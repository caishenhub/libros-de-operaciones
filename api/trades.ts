export default async function handler(
  req: any,
  res: any
) {
  // Handle OPTIONS for CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const urls = [
      process.env.VITE_APPS_SCRIPT_URL,
      process.env.VITE_APPS_SCRIPT_URL_FOREX,
      process.env.VITE_APPS_SCRIPT_URL_COMMODITIES,
      process.env.VITE_APPS_SCRIPT_URL_ACCIONES
    ].filter((val, index, self) => val && self.indexOf(val) === index) as string[];

    console.log(`Parallel serverless proxying to ${urls.length} URLs`);

    const fetchPromises = urls.map(async (url) => {
      try {
        const resp = await fetch(url);
        if (!resp.ok) {
          console.error(`URL failed with status ${resp.status}: ${url}`);
          return null;
        }
        const text = await resp.text();
        try {
          return JSON.parse(text);
        } catch (e) {
          console.error(`Failed to parse JSON from URL: ${url}`, e);
          return null;
        }
      } catch (e) {
        console.error(`Error fetching URL: ${url}`, e);
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

    console.log(`Successfully compiled ${allTrades.length} serverless trades`);
    return res.status(200).json(allTrades);
  } catch (error) {
    console.error("Error in Vercel API trades:", error);
    return res.status(500).json({ 
      error: "Error al obtener datos de la Nube Institucional",
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
