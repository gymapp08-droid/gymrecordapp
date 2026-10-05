const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const STORAGE_DIR = path.join(__dirname, '../../storage/source-documents');
fs.mkdirSync(STORAGE_DIR, { recursive: true });

async function downloadFileWithTimeout(url, destPath, timeoutMs = 15000) {
  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 1000) {
    const buffer = fs.readFileSync(destPath);
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    console.log(`[Cache Hit] ${path.basename(destPath)} (${buffer.length} bytes)`);
    return { buffer, hash, cached: true, size: buffer.length };
  }

  console.log(`[Downloading] ${url} -> ${path.basename(destPath)}`);
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      clearTimeout(timer);

      if (!res.ok) {
        console.warn(`[HTTP ${res.status}] ${url}`);
        return null;
      }
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      if (buffer.length < 500) {
        console.warn(`[Too small (${buffer.length}b)] ${url}`);
        return null;
      }
      fs.writeFileSync(destPath, buffer);
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');
      console.log(`[Downloaded] ${path.basename(destPath)} (${buffer.length} bytes, SHA256: ${hash.slice(0, 12)}...)`);
      return { buffer, hash, cached: false, size: buffer.length };
    } catch (err) {
      console.warn(`[Attempt ${attempt} Failed] ${url}: ${err.message}`);
      if (attempt === 2) return null;
    }
  }
  return null;
}

// Read HTML files
const workoutHtml = fs.readFileSync(path.join(__dirname, '../../storage/crawler/WorkoutProgram.html'), 'utf8');
const dietHtml = fs.readFileSync(path.join(__dirname, '../../storage/crawler/DietPlan.html'), 'utf8');

function extractPdfUrls(html, sourcePage) {
  const urls = [];
  const hrefMatches = [...html.matchAll(/href=["']([^"']+\.pdf[^"']*)["']/gi)];
  hrefMatches.forEach(m => {
    let raw = m[1].trim();
    if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
      if (raw.startsWith('/')) {
        raw = 'http://www.gurumann.com' + raw;
      } else {
        raw = 'http://www.gurumann.com/' + raw;
      }
    }
    const cleanUrl = raw.split('#')[0];
    urls.push({ url: cleanUrl, sourcePage });
  });
  return urls;
}

const allPdfEntries = [
  ...extractPdfUrls(workoutHtml, 'WorkoutProgram.html'),
  ...extractPdfUrls(dietHtml, 'DietPlan.html')
];

const uniqueUrls = new Map();
allPdfEntries.forEach(item => {
  if (!uniqueUrls.has(item.url)) {
    uniqueUrls.set(item.url, item);
  }
});

console.log(`Discovered ${uniqueUrls.size} unique PDF document URLs across source catalog.`);

async function run() {
  const items = Array.from(uniqueUrls.entries());
  const downloadResults = [];
  const CONCURRENCY = 4;

  let index = 0;
  async function worker() {
    while (index < items.length) {
      const currentIndex = index++;
      const [url, meta] = items[currentIndex];
      const filename = path.basename(new URL(url).pathname);
      const dest = path.join(STORAGE_DIR, filename);

      const result = await downloadFileWithTimeout(url, dest, 15000);
      downloadResults.push({
        url,
        filename,
        dest,
        success: !!result,
        size: result ? result.size : 0,
        sha256: result ? result.hash : null,
        sourcePage: meta.sourcePage
      });
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  fs.writeFileSync(
    path.join(__dirname, '../../storage/crawler/download-index.json'),
    JSON.stringify(downloadResults, null, 2)
  );

  const successful = downloadResults.filter(r => r.success);
  console.log(`\n========================================`);
  console.log(`DOWNLOAD COMPLETE`);
  console.log(`Successfully acquired: ${successful.length}/${downloadResults.length}`);
  console.log(`========================================`);
}

run().catch(console.error);
