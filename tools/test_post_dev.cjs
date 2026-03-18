const fs = require('fs');
const path = require('path');

async function main() {
  const filePath = path.resolve(__dirname, '..', 'fe486393-7e30-48ec-8722-bb223fde7c10_531372.pdf');
  if (!fs.existsSync(filePath)) {
    console.error('Sample PDF not found:', filePath);
    process.exit(1);
  }

  const data = fs.readFileSync(filePath);
  const form = new FormData();
  const blob = new Blob([data], { type: 'application/pdf' });
  form.append('file', blob, path.basename(filePath));

  const res = await fetch('http://localhost:3001/extract', { method: 'POST', body: form });
  console.log('status', res.status);
  const text = await res.text();
  try {
    console.log('json:', JSON.parse(text));
  } catch (e) {
    console.log('text:', text);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
