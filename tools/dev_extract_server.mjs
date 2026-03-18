import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import handlerModule from '../api/extract.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.EXTRACT_DEV_PORT || 3001;

// Wrap the Next/Vercel-style handler: it expects (req,res)
app.post('/api/extract', async (req, res) => {
  try {
    // delegate to handler imported from api/extract.js
    await handlerModule.default(req, res);
  } catch (err) {
    console.error('dev server handler error', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Dev proxy server listening at http://localhost:${PORT}/api/extract`));
