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
    const appsScriptUrl = process.env.VITE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbzthYRRwNWmTJ3gU5R6lHL_Fn0CZk8AYozllfcz-bEyOHVzMPzXnYN9xBPAq3tubyyj/exec';
    
    console.log("Fetching from Google Apps Script...");
    const response = await fetch(appsScriptUrl);
    
    if (!response.ok) {
      throw new Error(`Google API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error in Vercel API trades:", error);
    return res.status(500).json({ 
      error: "Error al obtener datos de la Nube Institucional",
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
