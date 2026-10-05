const fs = require('fs');
const path = require('path');

let html = fs.readFileSync(path.join(__dirname, '../../storage/crawler/WorkoutProgram.html'), 'utf8');

const divRegex = /<div\s+id=["']?([^"'\s>]+)?["']?\s+style=["']([^"']*)["'][^>]*>([\s\S]*?)<\/div>/gi;
const elements = [];
let match;

while ((match = divRegex.exec(html)) !== null) {
  const id = match[1] || '';
  const style = match[2];
  const inner = match[3];

  const topMatch = style.match(/top:\s*(\d+)px/i);
  const leftMatch = style.match(/left:\s*(\d+)px/i);
  const widthMatch = style.match(/width:\s*(\d+)px/i);
  const heightMatch = style.match(/height:\s*(\d+)px/i);

  if (topMatch && leftMatch) {
    const top = parseInt(topMatch[1], 10);
    const left = parseInt(leftMatch[1], 10);
    const width = widthMatch ? parseInt(widthMatch[1], 10) : 0;
    const height = heightMatch ? parseInt(heightMatch[1], 10) : 0;
    const links = [...inner.matchAll(/href=["']([^"']+)["']/gi)].map(m => m[1]);
    const imgs = [...inner.matchAll(/src=["']([^"']+)["']/gi)].map(m => m[1]);
    const cleanText = inner.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    elements.push({ id, top, left, width, height, cleanText, links, imgs, inner });
  }
}

// Find all category headers (usually contain "PROGRAMS")
console.log('--- CATEGORY HEADERS ---');
elements
  .filter(e => e.cleanText && e.cleanText.toUpperCase().includes('PROGRAMS'))
  .forEach(e => {
    console.log(`Top: ${e.top}, Left: ${e.left}, Text: "${e.cleanText}"`);
  });

console.log('\n--- ALL ELEMENTS WITH PDF LINKS ---');
const pdfElements = elements.filter(e => e.links.some(l => l.toLowerCase().includes('.pdf')));
pdfElements.forEach((e, idx) => {
  console.log(`[${idx+1}] Top: ${e.top}, Left: ${e.left}, Text: "${e.cleanText}", Links: ${e.links.join(', ')}`);
});
