const fs = require('fs');
const path = require('path');

let html = fs.readFileSync(path.join(__dirname, '../../storage/crawler/WorkoutProgram.html'), 'utf8');

const divRegex = /<div\s+id=["']?([^"'\s>]+)?["']?\s+style=["']([^"']*)["'][^>]*>([\s\S]*?)<\/div>/gi;
const elements = [];
let match;

while ((match = divRegex.exec(html)) !== null) {
  const style = match[2];
  const inner = match[3];

  const topMatch = style.match(/top:\s*(\d+)px/i);
  const leftMatch = style.match(/left:\s*(\d+)px/i);

  if (topMatch && leftMatch) {
    const top = parseInt(topMatch[1], 10);
    const left = parseInt(leftMatch[1], 10);
    const cleanText = inner.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (cleanText.includes('PROGRAMS')) {
      elements.push({ top, left, cleanText });
    }
  }
}

elements.sort((a, b) => a.top - b.top);
elements.forEach(e => console.log(`Top: ${e.top} | Left: ${e.left} | Text: "${e.cleanText}"`));
