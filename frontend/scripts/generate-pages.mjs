import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const site = (process.env.VITE_SITE_URL || 'https://savyour.blitz.cloud').replace(/\/$/, '');
const base = process.env.GITHUB_PAGES_BASE || '/';
const pages = [
  {path:'', title:'Savyour — Download Public Social Videos', description:'Paste a public video link, preview its thumbnail, choose an available quality, and save media you own or have permission to download.', heading:'Download social videos with Savyour', body:'Paste a public YouTube, TikTok, Instagram, Facebook, X, Vimeo, Pinterest, or Reddit video link. See the preview and select an available format. YouTube downloads are limited to 480p; other supported sources use their best available quality.'},
  {path:'supported-sites/', title:'Supported Video Sites | YouTube, TikTok & More — Savyour', description:'Explore the public video platforms supported by Savyour, including YouTube, TikTok, Instagram, Facebook, X, Vimeo, Pinterest, and Reddit.', heading:'Supported video sites', body:'Check supported public links from YouTube videos and Shorts, TikTok videos, Instagram Reels, Facebook videos, X posts, Vimeo videos, Pinterest video pins, and Reddit posts. Availability depends on each platform and video.'},
  {path:'how-it-works/', title:'How to Download a Public Video — Savyour', description:'Learn how Savyour analyzes a public video link, displays its thumbnail and available formats, and saves your selected quality.', heading:'How Savyour works', body:'Copy a public video link, paste it in the downloader, review its preview and formats, then choose a quality and save. Only download media you own or are authorized to save.'},
  {path:'faq/', title:'Video Downloading FAQ — Savyour', description:'Answers about supported links, YouTube’s 480p limit, quality choices, failed downloads, privacy, and permission to save videos.', heading:'Frequently asked questions', body:'Find answers about public video links, supported platforms, available qualities, YouTube’s 480p limit, failed downloads, and responsible use.'},
  {path:'about/', title:'About Savyour | Public Video Downloader', description:'Meet Savyour, a simple tool for previewing and saving public videos you own or are authorized to download.', heading:'About Savyour', body:'Savyour helps you preview public video links and save permitted media from several social platforms. We focus on a straightforward workflow and clear quality choices.'},
];
const esc = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const json = obj => JSON.stringify(obj).replaceAll('<','\\u003c');
const extra = {
  'supported-sites/': '<h2>Public video platforms</h2><ul><li>YouTube videos and Shorts: up to 480p</li><li>TikTok public videos</li><li>Instagram Reels and public video posts</li><li>Facebook public videos</li><li>X public video posts</li><li>Vimeo publicly accessible videos</li><li>Pinterest video pins</li><li>Reddit public video posts</li></ul><p>Individual availability depends on the source platform.</p>',
  'how-it-works/': '<h2>Three steps</h2><ol><li>Paste a public video link from a supported platform.</li><li>Review the thumbnail, title and available qualities.</li><li>Select a format and track the download and saving progress.</li></ol><p>Save only media you own or have permission to download.</p>',
  'faq/': '<h2>Answers</h2><h3>Which sites are supported?</h3><p>YouTube, TikTok, Instagram, Facebook, X, Vimeo, Pinterest, and Reddit public links.</p><h3>Why is YouTube limited to 480p?</h3><p>Higher formats have not downloaded reliably in this setup, so the backend caps YouTube at 480p.</p><h3>Why might a thumbnail show while a download fails?</h3><p>The source may allow metadata but restrict the media stream, or require login.</p><h3>Can I choose quality?</h3><p>Yes, choose a listed format or Best available.</p>',
  'about/': '<h2>What Savyour does</h2><p>Savyour analyzes public video links, displays available formats, and saves media when the source permits access.</p><h2>Responsible use</h2><p>Respect creators and platform rules. Only save content you own or are authorized to download.</p>',
};
for (const page of pages) {
  const canonical = `${site}/${page.path}`;
  const links = pages.map(p => `<a href="${base}${p.path}">${esc(p.path ? p.heading : 'Downloader')}</a>`).join(' · ');
  const schema = [{ '@context':'https://schema.org', '@type':'WebPage', name:page.title, description:page.description, url:canonical, isPartOf:{'@type':'WebSite',name:'Savyour',url:`${site}/`} }];
  if (!page.path) schema.push({'@context':'https://schema.org','@type':'SoftwareApplication',name:'Savyour',applicationCategory:'MultimediaApplication',operatingSystem:'Web',url:canonical,description:page.description,offers:{'@type':'Offer',price:'0',priceCurrency:'USD'}});
  else schema.push({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:`${site}/`},{'@type':'ListItem',position:2,name:page.heading,item:canonical}]});
  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#0a0613"><meta name="color-scheme" content="dark">
<title>${esc(page.title)}</title><meta name="description" content="${esc(page.description)}">
<meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${canonical}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Savyour"><meta property="og:locale" content="en_US">
<meta property="og:title" content="${esc(page.title)}"><meta property="og:description" content="${esc(page.description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${site}/social-preview.png"><meta property="og:image:alt" content="Savyour — Your media. Your flow."><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(page.title)}"><meta name="twitter:description" content="${esc(page.description)}"><meta name="twitter:image" content="${site}/social-preview.png">
<link rel="icon" type="image/svg+xml" href="${base}favicon.svg"><link rel="apple-touch-icon" href="${base}apple-touch-icon.png"><link rel="manifest" href="${base}site.webmanifest">
<script type="application/ld+json">${json(schema)}</script>
</head><body><div id="root"><main style="font:16px system-ui;background:#0a0613;color:#fff;min-height:100vh;padding:4rem;max-width:1100px;margin:auto"><nav aria-label="Main navigation">${links}</nav><h1>${esc(page.heading)}</h1><p>${esc(page.body)}</p>${extra[page.path]||''}</main></div><script type="module" src="/src/main.jsx"></script></body></html>`;
  const destination = join(root, page.path, 'index.html');
  mkdirSync(resolve(destination, '..'), {recursive:true});
  writeFileSync(destination, html);
}
const publicDir = join(root, 'public');
writeFileSync(join(publicDir, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${site}/sitemap.xml\n`);
writeFileSync(join(publicDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(p => `  <url><loc>${site}/${p.path}</loc></url>`).join('\n')}\n</urlset>\n`);
writeFileSync(join(publicDir, 'site.webmanifest'), JSON.stringify({name:'Savyour',short_name:'Savyour',description:'Preview and save permitted public videos',start_url:base,display:'standalone',background_color:'#0a0613',theme_color:'#0a0613',icons:[{src:`${base}favicon.svg`,sizes:'any',type:'image/svg+xml'},{src:`${base}icon-192.png`,sizes:'192x192',type:'image/png'},{src:`${base}icon-512.png`,sizes:'512x512',type:'image/png'}]}));
console.log(`Generated ${pages.length} pages, sitemap and robots.txt`);
