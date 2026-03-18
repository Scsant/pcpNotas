import Busboy from 'busboy';
import pdfjs from 'pdfjs-dist/legacy/build/pdf.js';
const { getDocument, GlobalWorkerOptions } = pdfjs;

export const config = { api: { bodyParser: false } };

const RE_CNPJ = /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/;
const RE_NOTA = /(?:Nota Fiscal|Fatura|NF|No\.?|Nota)\s*[:\-]?\s*(\d{3,12})/i;

function normalizeTextItems(items){
  // Convert textContent items to {str,x,y}
  return items.map(it => {
    const t = it.transform || it.transformMatrix || [1,0,0,1,0,0];
    const x = t[4];
    const y = t[5];
    return { str: (it.str||'').trim(), x, y };
  }).filter(i => i.str && i.str.length>0);
}

function joinLineItems(lineItems){
  // sort by x and join
  return lineItems.sort((a,b)=>a.x-b.x).map(i=>i.str).join(' ').replace(/\s+/g,' ').trim();
}

function findLabelItem(items, labelRegex){
  for(const it of items){
    if(labelRegex.test(it.str)) return it;
  }
  return null;
}

function getLineBelow(items, labelItem){
  if(!labelItem) return null;
  // find items with y < labelItem.y (below on page)
  const below = items.filter(i=>i.y < labelItem.y - 0.5);
  if(below.length===0) return null;
  // group items by rounded y (to form lines)
  const groups = {};
  for(const it of below){
    const key = Math.round(it.y);
    groups[key] = groups[key] || [];
    groups[key].push(it);
  }
  // keys sorted desc => closest first
  const keys = Object.keys(groups).map(k=>parseFloat(k)).sort((a,b)=>b-a);
  for(const k of keys){
    const line = joinLineItems(groups[k]);
    // filters: ignore if contains long digit sequences (chave) or CNPJ
    if(/\d[\d\s]{20,}/.test(line)) continue;
    if(RE_CNPJ.test(line)) continue;
    // ignore if line looks like a label or short
    if(/^(remessa|fatura|ordem|po cliente)[:\s]/i.test(line)) continue;
    if((line.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/g)||[]).length < 3) continue;
    return line;
  }
  return null;
}

async function extractFromBuffer(buffer){
  // Use the simpler, proven position-aware footer-first extractor (from tools)
  const uint8 = new Uint8Array(buffer);
  const doc = await getDocument({ data: uint8 }).promise;
  // prefer page 1 (front page) for invoice metadata
  const page = await doc.getPage(1);
  const content = await page.getTextContent({ disableCombineTextItems: false });
  const items = content.items.map(it => {
    const t = it.transform || it.transformMatrix || [1,0,0,1,0,0];
    const x = t[4];
    const y = t[5];
    return { str: (it.str||'').trim(), x, y };
  }).filter(i=>i.str && i.str.length>0);

  // group by coarse y to form lines
  const groups = {};
  items.forEach(it => {
    const key = Math.round(it.y/2)*2;
    groups[key] = groups[key] || [];
    groups[key].push(it);
  });
  const keys = Object.keys(groups).map(k=>parseFloat(k)).sort((a,b)=>b-a);
  const lines = keys.map(k => groups[k].sort((a,b)=>a.x-b.x).map(i=>i.str).join(' ').trim()).filter(Boolean);

  const footer = lines.slice(0,25).join('\n');
  const chave = (footer.replace(/\s+/g,'').match(/(\d{44})/) || [null])[0] || null;
  const remessa = (footer.match(/remessa[:\s]*([0-9A-Za-z\-\.\s]+)/i) || [null,null])[1] || null;
  const ordem = (footer.match(/ordem[:\s]*([0-9A-Za-z\-\.\s]+)/i) || [null,null])[1] || null;
  const fatura = (footer.match(/fatura[:\s]*([0-9A-Za-z\-\.\s]+)/i) || [null,null])[1] || null;
  const numero = (footer.match(/(?:Nota Fiscal|Fatura|NF|No\.?|Nota)[:\s]*([0-9]{3,12})/i) || [null,null])[1] || null;
  const fazenda = (lines.find(l => /fazenda|destinatario|destinatário/i.test(l)) || '').trim() || null;

  // improved cleaning helpers
  function looksLikeChave(s){
    if(!s) return false;
    return /\d{40,}/.test(s.replace(/\s+/g,''));
  }
  function looksLikeLongDigits(s){
    if(!s) return false;
    // many digits/spaces/dots (chave or long numeric)
    return /[0-9][0-9\s\.\-]{8,}/.test(s);
  }
  function firstNumericCandidate(s, minLen=3){
    if(!s) return null;
    const m = s.match(/(\d[0-9\-]{2,})/g);
    if(!m) return null;
    for(const mm of m){
      const clean = mm.replace(/[^0-9]/g,'');
      if(clean.length >= minLen) return clean;
    }
    return null;
  }
  function cleanExtracted(val, type){
    if(!val) return null;
    // split by lines and pick first non-noisy line
    const parts = val.split(/\r?\n|\/|\|/).map(s=>s.trim()).filter(Boolean);
    let candidate = parts.find(p => !looksLikeChave(p) && p.replace(/[^A-Za-z0-9]/g,'').length>0) || parts[0] || val;
    candidate = candidate.replace(/^(remessa|fatura|ordem|pedido|destinatari[oa]?|documento|nf\-e)[:\s\-]*/i,'').trim();

    if(type === 'remessa' || type === 'fatura'){
      // prefer numeric token
      const num = firstNumericCandidate(candidate, 3);
      return num || (candidate.length ? candidate : null);
    }
    if(type === 'ordem'){
      // prefer numeric, otherwise ignore short word fragments like 'de Venda'
      const num = firstNumericCandidate(candidate, 3);
      if(num) return num;
      // if candidate contains only short words, discard
      if(/^([a-zA-Z]{1,4}\s*){1,3}$/.test(candidate)) return null;
      return candidate;
    }
    if(type === 'fazenda'){
      // prefer a candidate with letters, not a chave or URL
      candidate = candidate.replace(/\.{2,}/g,'.').trim();
      if(looksLikeChave(candidate) || looksLikeLongDigits(candidate)){
        // try subsequent parts
        const alt = parts.find(p => !looksLikeChave(p) && !looksLikeLongDigits(p) && /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(p));
        if(alt) return alt.trim().toUpperCase();
        return null;
      }
      return candidate.toUpperCase();
    }
    return candidate;
  }

  // If initial footer-based extraction returns suspicious values (labels or mixed content),
  // try positional fallbacks: look for label and take the line below if it's a cleaner candidate.
  function getLineBelowLabel(labelRegex){
    // find an item whose string matches labelRegex (case-insensitive)
    const labelIdx = lines.findIndex(l => labelRegex.test(l));
    if(labelIdx >= 0 && labelIdx < lines.length - 1){
      const cand = lines[labelIdx+1].trim();
      if(cand && !looksLikeChave(cand) && !looksLikeLongDigits(cand)) return cand;
    }
    return null;
  }

  // clean initial finds
  let c_remessa = cleanExtracted(remessa,'remessa');
  let c_fatura = cleanExtracted(fatura,'fatura');
  let c_ordem = cleanExtracted(ordem,'ordem');
  let c_fazenda = cleanExtracted(fazenda,'fazenda');

  // try positional fallbacks when results look like labels or null
  if(!c_remessa || /^(remessa|remessa[:\s]*)$/i.test(c_remessa)){
    const p = getLineBelowLabel(/remessa[:\s\b]/i) || getLineBelowLabel(/remessa/i);
    if(p) c_remessa = cleanExtracted(p,'remessa');
  }
  if(!c_fatura || /^(fatura|fatura[:\s]*)$/i.test(c_fatura)){
    const p = getLineBelowLabel(/fatura[:\s\b]/i) || getLineBelowLabel(/fatura/i);
    if(p) c_fatura = cleanExtracted(p,'fatura');
  }
  if(!c_ordem || /^de\s+venda$/i.test(c_ordem) || /^(ordem|ordem[:\s]*)$/i.test(c_ordem)){
    const p = getLineBelowLabel(/ordem\s+de\s+venda[:\s\b]/i) || getLineBelowLabel(/ordem/i);
    if(p) c_ordem = cleanExtracted(p,'ordem');
  }
  if(!c_fazenda){
    // prefer explicit FAZENDA label
    const fExplicit = lines.find(l => /fazenda[:\s\-]|^fazenda\b/i.test(l));
    if(fExplicit){
      const after = getLineBelowLabel(/fazenda[:\s\-]/i);
      if(after) c_fazenda = cleanExtracted(after,'fazenda');
      else c_fazenda = cleanExtracted(fExplicit,'fazenda');
    } else {
      // try label 'destinat' and take next line
      const p = getLineBelowLabel(/destinat/i);
      if(p) c_fazenda = cleanExtracted(p,'fazenda');
    }
  }

  const out = [{ page: 0, numero_nf: numero, chave_acesso: chave, remessa: c_remessa, ordem: c_ordem, fatura: c_fatura, fazenda: c_fazenda, raw_text: footer }];
  return out;
}

export default async function handler(req,res){
  if(req.method !== 'POST') return res.status(405).end('Method Not Allowed');
  const busboy = Busboy({ headers: req.headers });
  let fileBuffer = null;
  await new Promise((resolve,reject)=>{
    busboy.on('file',(fieldname,file,info)=>{
      const chunks = [];
      file.on('data',d=>chunks.push(d));
      file.on('end',()=>{ fileBuffer = Buffer.concat(chunks); });
    });
    busboy.on('finish',resolve);
    busboy.on('error',reject);
    req.pipe(busboy);
  });
  if(!fileBuffer) return res.status(400).json({ error: 'no file uploaded' });
  try{
    const extracted = await extractFromBuffer(fileBuffer);
    return res.json({ pages: extracted });
  }catch(err){
    console.error('extract error',err);
    return res.status(500).json({ error: err.message });
  }
}
