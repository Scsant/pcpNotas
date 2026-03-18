import fs from 'fs';
import pdf from 'pdf-parse';

const buf = fs.readFileSync('./fe486393-7e30-48ec-8722-bb223fde7c10_531372.pdf');

(async()=>{
  const data = await pdf(buf);
  const text = data.text || '';
  console.log('EXTRACTED TEXT (first 800 chars):\n', text.slice(0,800));
  // basic regex checks
  const chaveMatch = text.replace(/\s+/g,'').match(/(\d{44,})/);
  console.log('chave:', chaveMatch ? chaveMatch[1] : null);
  const remessa = (text.match(/Remessa[:\s]*([0-9A-Za-z\-\.]+)/i) || [null,null])[1];
  const fatura = (text.match(/Fatura[:\s]*([0-9A-Za-z\-\.]+)/i) || [null,null])[1];
  const ordem = (text.match(/Ordem\s+de\s+Venda[:\s]*([0-9A-Za-z\-\.]+)/i) || [null,null])[1];
  console.log({ remessa, fatura, ordem });
})();
