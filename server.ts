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
      const appsScriptUrl = process.env.VITE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbzthYRRwNWmTJ3gU5R6lHL_Fn0CZk8AYozllfcz-bEyOHVzMPzXnYN9xBPAq3tubyyj/exec';
      
      console.log(`[${new Date().toISOString()}] Proxying to: ${appsScriptUrl}`);
      
      const response = await fetch(appsScriptUrl);
      console.log(`[${new Date().toISOString()}] Google API status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`Google API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`[${new Date().toISOString()}] Successfully fetched ${Array.isArray(data) ? data.length : 'non-array'} items`);
      res.json(data);
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
