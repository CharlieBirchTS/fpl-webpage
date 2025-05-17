export default async function handler(req, res) {
    const { path = [] } = req.query;
  
    const fullPath = Array.isArray(path) ? path.join('/') : path;
  
    const url = `https://draft.premierleague.com/api/${fullPath}`;
  
    try {
      const response = await fetch(url);
      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: 'Proxy request failed', detail: error.message });
    }
  }
  