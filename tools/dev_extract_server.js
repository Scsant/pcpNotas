// Minimal dev server to expose /extract for frontend during development
// Usage: node tools/dev_extract_server.js

const express = require('express');
const Busboy = require('busboy');
const fs = require('fs');
const path = require('path');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

const app = express();
const PORT = process.env.EXTRACT_DEV_PORT || 3001;

function bufferFromStream(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (c) => chunks.push(c));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

async function extractFromBuffer(buffer) {
  const uint8 = new Uint8Array(buffer);
  const doc = await pdfjsLib.getDocument({ data: uint8 }).promise;
  const page = await doc.getPage(1);
  const ops = await page.getTextContent({ disableCombineTextItems: false });
  const items = ops.items.map((it) => {
    return {
      str: it.str || '',
      x: it.transform ? it.transform[4] : 0,
      y: it.transform ? it.transform[5] : 0,
    };
  });

  const lines = [];
  // simple join by y position
  const groups = {};
  items.forEach((it) => {
    const key = Math.round(it.y / 2) * 2; // coarse grouping
    groups[key] = groups[key] || [];
    groups[key].push(it);
  });
  Object.keys(groups)
    .sort((a, b) => b - a)
    .forEach((k) => {
      const row = groups[k]
        .sort((a, b) => a.x - b.x)
        .map((i) => i.str)
        .join(' ')
        .trim();
      if (row) lines.push(row);
    });

  const footer = lines.slice(0, 25).join('\n');
  // quick regexes
  const chave = (footer.match(/\b(\d{44})\b/) || [null])[0];
  const remessa = (footer.match(/remessa[:\s]*([0-9-]{6,})/i) || [null, null])[1];
  const ordem = (footer.match(/ordem[:\s]*([0-9-]{6,})/i) || [null, null])[1];
  const fatura = (footer.match(/fatura[:\s]*([0-9-]{6,})/i) || [null, null])[1];
  const numero = (footer.match(/nota\s*fiscal[:\s]*([0-9-]{3,})/i) || [null, null])[1] || (footer.match(/nota[:\s]*([0-9-]{3,})/i) || [null, null])[1];
  const fazenda = (lines.find((l) => /fazenda|destinatario|destinatário/i.test(l)) || '').trim();

  return {
    page0: {
      numero_nf: numero || null,
      chave_acesso: chave || null,
      remessa: remessa || null,
      ordem: ordem || null,
      fatura: fatura || null,
      nome_fazenda: fazenda || null,
      raw_text: footer,
    },
  };
}

app.post('/extract', (req, res) => {
  const busboy = new Busboy({ headers: req.headers });
  let fileBuffer = null;
  busboy.on('file', async (fieldname, file, filename) => {
    try {
      fileBuffer = await bufferFromStream(file);
    } catch (err) {
      console.error('stream error', err);
    }
  });
  busboy.on('finish', async () => {
    if (!fileBuffer) return res.status(400).json({ error: 'no file' });
    try {
      const pages = await extractFromBuffer(fileBuffer);
      res.json({ pages });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });
  req.pipe(busboy);
});

app.listen(PORT, () => console.log(`Dev extract server listening: http://localhost:${PORT}/extract`));
