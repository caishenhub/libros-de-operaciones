import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // API Proxy para Google Apps Script (Bypass CORS)
  app.get("/api/trades", async (req, res) => {
    console.log(`[${new Date().toISOString()}] Incoming request to /api/trades`);
    try {
      const urls = [
        process.env.VITE_APPS_SCRIPT_URL,
        process.env.VITE_APPS_SCRIPT_URL_FOREX,
        process.env.VITE_APPS_SCRIPT_URL_COMMODITIES,
        process.env.VITE_APPS_SCRIPT_URL_ACCIONES
      ].filter((val, index, self) => val && self.indexOf(val) === index) as string[];

      console.log(`[${new Date().toISOString()}] Parallel proxying to ${urls.length} URLs:`, urls);

      const fetchPromises = urls.map(async (url) => {
        try {
          const resp = await fetch(url);
          if (!resp.ok) {
            console.error(`[${new Date().toISOString()}] URL failed with status ${resp.status}: ${url}`);
            return null;
          }
          const text = await resp.text();
          try {
            return JSON.parse(text);
          } catch (e) {
            console.error(`[${new Date().toISOString()}] Failed to parse JSON from URL: ${url}`, e);
            return null;
          }
        } catch (e) {
          console.error(`[${new Date().toISOString()}] Error fetching URL: ${url}`, e);
          return null;
        }
      });

      const results = await Promise.allSettled(fetchPromises);
      
      const allTrades: any[] = [];
      const seenIds = new Set<string>();

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status === 'fulfilled' && result.value) {
          const data = result.value;
          if (Array.isArray(data)) {
            const isCommoditiesUrl = urls[i] === process.env.VITE_APPS_SCRIPT_URL_COMMODITIES;
            const isForexUrl = urls[i] === process.env.VITE_APPS_SCRIPT_URL_FOREX;
            const isAccionesUrl = urls[i] === process.env.VITE_APPS_SCRIPT_URL_ACCIONES;

            for (const item of data) {
              if (item && typeof item === 'object') {
                // Determine a unique key for deduplication
                const id = item.id || item.ticket || `${item.symbol}_${item.openDate}_${item.action || ''}`;
                
                let rawCat = '';
                if (item.category) {
                  rawCat = String(item.category).toUpperCase();
                }

                // Map/normalize/swap categories so Gold (XAUUSD) raw data ('ACCIONES') ends up in 'COMMODITIES' and stocks/indexes end up in 'ACCIONES'
                if (isForexUrl || rawCat.includes('FOREX')) {
                  item.category = 'FOREX';
                } else if (isAccionesUrl || rawCat.includes('ACCIONES') || rawCat.includes('STOCK')) {
                  item.category = 'COMMODITIES';
                } else if (isCommoditiesUrl || rawCat.includes('COMMODITIES') || rawCat.includes('MATERIAS') || rawCat.includes('COMMO')) {
                  item.category = 'ACCIONES';
                } else {
                  item.category = 'FOREX';
                }

                if (!seenIds.has(id)) {
                  seenIds.add(id);
                  allTrades.push(item);
                }
              }
            }
          }
        }
      }

      console.log(`[${new Date().toISOString()}] Successfully processed and deduplicated ${allTrades.length} items`);
      res.json(allTrades);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error in /api/trades proxy:`, error);
      res.status(500).json({ 
        error: "Error al obtener datos de la Nube Institucional",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Vite middleware para desarrollo
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // En producción servimos los archivos estáticos
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
