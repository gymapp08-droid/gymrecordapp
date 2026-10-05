const fs = require('fs');
const path = require('path');

let html = fs.readFileSync(path.join(__dirname, '../../storage/crawler/DietPlan.html'), 'utf8');

const anchorRegex = /<a\s+([^>]*?)href=["']([^"']*)["']([^>]*?)>(.*?)<\/a>/gis;
let match;
const anchors = [];

while ((match = anchorRegex.exec(html)) !== null) {
  const href = match[2].trim();
  const text = match[4].replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  anchors.push({ href, text });
}

const pdfs = anchors.filter(a => a.href.toLowerCase().endsWith('.pdf') || a.href.toLowerCase().includes('.pdf'));
console.log('DietPlan.html PDF count:', pdfs.length);
pdfs.forEach(p => console.log(`Diet PDF: [${p.text}] -> ${p.href}`));

const divRegex = /<div\s+id=["']?([^"'\s>]+)?["']?\s+style=["']([^"']*)["'][^>]*>([\s\S]*?)<\/div>/gi;
const headings = [];
while ((match = divRegex.exec(html)) !== null) {
  const style = match[2];
  const inner = match[3];
  const topMatch = style.match(/top:\s*(\d+)px/i);
  if (topMatch) {
    const cleanText = inner.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (cleanText.includes('DIET') || cleanText.includes('NUTRITION') || cleanText.includes('PROGRAM')) {
      headings.push({ top: parseInt(topMatch[1], 10), cleanText });
    }
  }
}
headings.sort((a, b) => a.top - b.top);
console.log('\nDietPlan headings:');
headings.slice(0, 20).forEach(h => console.log(`Top ${h.top}: "${h.cleanText.slice(0, 60)}"`));
