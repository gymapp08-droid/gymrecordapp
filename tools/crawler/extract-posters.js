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

// Group elements by row (clustering by top position within ~550px bands)
// Let's filter elements below top: 600 (below header/nav)
const contentElements = elements.filter(e => e.top >= 600);

// Let's find all images that are program posters (typically height > 200 or width > 200, not icons/shapes)
const posters = contentElements.filter(e => e.imgs.length > 0 && !e.imgs[0].includes('shapes.action') && !e.imgs[0].includes('tp.gif') && !e.imgs[0].includes('Downloadable-PDF') && !e.imgs[0].includes('element7'));
console.log('Posters count:', posters.length);
posters.sort((a, b) => a.top - b.top || a.left - b.left);
posters.forEach(p => {
  console.log(`Poster: top=${p.top}, left=${p.left}, width=${p.width}, height=${p.height}, img=${p.imgs[0]}`);
});
