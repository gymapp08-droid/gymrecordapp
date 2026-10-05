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

// Category ranges
const categories = [
  { name: "MUSCLE BUILDING PROGRAMS", startTop: 649, endTop: 4646 },
  { name: "FAT LOSS PROGRAMS", startTop: 4647, endTop: 7823 },
  { name: "SINGLE MUSCLE PROGRAMS", startTop: 7824, endTop: 9163 },
  { name: "BODY WEIGHT WORKOUT PROGRAMS", startTop: 9164, endTop: 12162 },
  { name: "MEDICAL CONDITION PROGRAMS", startTop: 12163, endTop: 14043 },
  { name: "KIDS & FAMILY PROGRAMS", startTop: 14044, endTop: 99999 }
];

function getCategory(top) {
  const cat = categories.find(c => top >= c.startTop && top <= c.endTop);
  return cat ? cat.name : "UNKNOWN";
}

// Find all big posters (width > 700, height > 350)
const posters = elements.filter(e => e.width >= 700 && e.height >= 350 && e.top >= 600);
posters.sort((a, b) => a.top - b.top || a.left - b.left);

console.log(`Found ${posters.length} program posters.`);

// For each poster, let's find elements that belong to it:
// An element belongs to this poster if:
// top is between poster.top and poster.top + 600
// left is within poster column (left < 800 for left column, left >= 800 for right column, or left column centered)
const programs = posters.map((poster, idx) => {
  const isLeftCol = poster.left < 500;
  const isCentered = poster.left >= 400 && poster.left < 800; // e.g. single item rows
  const minLeft = isCentered ? 300 : (isLeftCol ? 0 : 800);
  const maxLeft = isCentered ? 1600 : (isLeftCol ? 800 : 2000);

  const related = elements.filter(e => 
    e.top >= poster.top &&
    e.top <= poster.top + 600 &&
    (isCentered || (e.left >= minLeft && e.left < maxLeft)) &&
    e !== poster
  );

  const allLinks = [];
  const allImgs = [];
  const texts = [];

  related.forEach(r => {
    r.links.forEach(l => { if (!allLinks.includes(l)) allLinks.push(l); });
    r.imgs.forEach(i => { if (!allImgs.includes(i)) allImgs.push(i); });
    if (r.cleanText && !texts.includes(r.cleanText)) texts.push(r.cleanText);
  });

  const pdfLinks = allLinks.filter(l => l.toLowerCase().includes('.pdf'));
  const youtubeLinks = allLinks.filter(l => l.toLowerCase().includes('youtube.com') || l.toLowerCase().includes('youtu.be'));
  const category = getCategory(poster.top);

  // Derive program name from poster image, pdf link, or text
  let inferredName = '';
  if (pdfLinks.length > 0) {
    const mainPdf = pdfLinks[0];
    const filename = path.basename(mainPdf, path.extname(mainPdf));
    inferredName = filename
      .replace(/_Workout_Plan_by_Guru_Mann/i, '')
      .replace(/_Nutrition_Plan_by_Guru_Mann/i, '')
      .replace(/_by_Guru_Mann/i, '')
      .replace(/_by_GuruMann/i, '')
      .replace(/_eBook/i, '')
      .replace(/_Plan/i, '')
      .replace(/_/g, ' ')
      .trim();
  } else {
    inferredName = path.basename(poster.imgs[0], path.extname(poster.imgs[0])).replace(/publishImages\//, '').replace(/_/g, ' ');
  }

  return {
    id: idx + 1,
    inferredName,
    category,
    top: poster.top,
    left: poster.left,
    posterImg: poster.imgs[0],
    pdfLinks,
    youtubeLinks,
    texts
  };
});

programs.forEach(p => {
  console.log(`\n[Program ${p.id}] ${p.inferredName}`);
  console.log(`  Category: ${p.category}`);
  console.log(`  Poster: ${p.posterImg} (top:${p.top}, left:${p.left})`);
  console.log(`  PDFs: ${p.pdfLinks.join(', ')}`);
  console.log(`  Videos: ${p.youtubeLinks.join(', ')}`);
  console.log(`  Texts: ${p.texts.join(' | ')}`);
});
