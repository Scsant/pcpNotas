import fs from 'fs';
import pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
const { getDocument } = pdfjsLib;

function normalizeTextItems(items){
  return items.map(it => {
    const t = it.transform || it.transformMatrix || [1,0,0,1,0,0];
    const x = t[4];
    const y = t[5];
    return { str: (it.str||'').trim(), x, y };
  }).filter(i => i.str && i.str.length>0);
}

function joinLineItems(lineItems){
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
  const below = items.filter(i=>i.y < labelItem.y - 0.5);
  if(below.length===0) return null;
  const maxY = Math.max(...below.map(i=>i.y));
  const lineItems = below.filter(i=>Math.abs(i.y - maxY) <= 3);
  const line = joinLineItems(lineItems);
  if(/\d[\d\s]{20,}/.test(line)) return null;
  if(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/.test(line)) return null;
  if((line.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/g)||[]).length < 3) return null;
  return line;
}

async function run(pdfPath){
  const data = fs.readFileSync(pdfPath);
  const loadingTask = getDocument({ data: new Uint8Array(data) });
  const pdf = await loadingTask.promise;
  for(let p=1;p<=pdf.numPages;p++){
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const items = normalizeTextItems(content.items);
    const fullText = items.map(i=>i.str).join('\n');

    const chaveMatch = fullText.replace(/\s+/g,'').match(/(\d{44,})/);
    const chave = chaveMatch ? chaveMatch[1] : null;
    const notaMatch = fullText.match(/(?:Nota Fiscal|Fatura|NF|No\.?|Nota)\s*[:\-]?\s*(\d{3,12})/i);
    const numero_nf = notaMatch ? notaMatch[1] : null;

    const faturaLabel = findLabelItem(items,/fatura[:\s\b]/i) || findLabelItem(items,/fatura/i);
    const remessaLabel = findLabelItem(items,/remessa[:\s\b]/i) || findLabelItem(items,/remessa/i);
    const ordemLabel = findLabelItem(items,/ordem\s+de\s+venda[:\s\b]/i) || findLabelItem(items,/ordem/i);

    // Build footer: take bottom-most 8 rounded Y groups
    const groups = {};
    for(const it of items){
      const key = Math.round(it.y);
      groups[key] = groups[key] || [];
      groups[key].push(it);
    }
    const sortedKeys = Object.keys(groups).map(k=>parseFloat(k)).sort((a,b)=>a-b);
    const footerKeys = sortedKeys.slice(0,8);
    const footerLines = footerKeys.map(k => joinLineItems(groups[k]));
    const footerText = footerLines.join('\n');

    const remessaRegex = /Remessa[:\s]*([0-9A-Za-z\-\.\s]+)/i;
    const faturaRegex = /Fatura[:\s]*([0-9A-Za-z\-\.\s]+)/i;
    const ordemRegex = /Ordem(?:\s+de\s+Venda)?[:\s]*([0-9A-Za-z\-\.\s]+)/i;
    const fazendaRegex = /(?:FAZENDA[:\s-]*|FAZENDA\s+)([A-Z0-9\s\-\.,\/]+)/i;

    let remessa = (footerText.match(remessaRegex) || [null,null])[1] || null;
    let fatura = (footerText.match(faturaRegex) || [null,null])[1] || null;
    let ordem = (footerText.match(ordemRegex) || [null,null])[1] || null;
    let fazenda = (footerText.match(fazendaRegex) || [null,null])[1] || null;

    function cleanExtracted(val,type){
      if(!val) return null;
      val = val.replace(/\r?\n+/g,' ').trim();
      val = val.replace(/^(remessa|fatura|ordem|po cliente)[:\s\-]*/i,'').trim();
      const parts = val.split(/[\n\r\/\\|]+|\s{2,}/).map(s=>s.trim()).filter(Boolean);
      const candidate = parts[0] || val;
      if(type === 'fatura' || type === 'remessa'){
        const m = candidate.match(/(\d{3,})/);
        return m ? m[1] : candidate;
      }
      if(type === 'ordem'){
        const m = candidate.match(/([0-9A-Za-z\-\.]{3,})/);
        let val = m ? m[1] : candidate;
        val = val.replace(/-[A-Z]{2,}$/i,'');
        return val;
      }
      if(type === 'fazenda'){
        let f = candidate.replace(/(PO Cliente|Art\.|Art\.|PO:).*/i,'').trim();
        return f.toUpperCase();
      }
      return candidate;
    }

    if(remessa) remessa = cleanExtracted(remessa,'remessa');
    if(fatura) fatura = cleanExtracted(fatura,'fatura');
    if(ordem) ordem = cleanExtracted(ordem,'ordem');
    if(fazenda) fazenda = cleanExtracted(fazenda,'fazenda');

    if(!remessa){
      const remessaLabel = findLabelItem(items,/remessa[:\s\b]/i) || findLabelItem(items,/remessa/i);
      remessa = getLineBelow(items, remessaLabel);
      remessa = cleanExtracted(remessa,'remessa');
    }
    if(!fatura){
      const faturaLabel = findLabelItem(items,/fatura[:\s\b]/i) || findLabelItem(items,/fatura/i);
      fatura = getLineBelow(items, faturaLabel);
      fatura = cleanExtracted(fatura,'fatura');
    }
    if(!ordem){
      const ordemLabel = findLabelItem(items,/ordem\s+de\s+venda[:\s\b]/i) || findLabelItem(items,/ordem/i);
      ordem = getLineBelow(items, ordemLabel);
      ordem = cleanExtracted(ordem,'ordem');
    }
    if(!fazenda){
      const fazLabel = findLabelItem(items,/fazenda[:\s\b]/i) || findLabelItem(items,/fazenda/i);
      fazenda = getLineBelow(items,fazLabel);
      fazenda = cleanExtracted(fazenda,'fazenda');
    }

    console.log(JSON.stringify({ page: p-1, numero_nf, chave_acesso: chave, remessa, ordem, fatura, fazenda }, null, 2));
  }
}

const pdfPath = './fe486393-7e30-48ec-8722-bb223fde7c10_531372.pdf';
run(pdfPath).catch(err=>{ console.error(err); process.exit(1); });
