// Builds therealflow.tv into ./dist
// 1. Pulls the podcast RSS feed and the YouTube channel feed
// 2. Merges new items into data/episodes.json and data/videos.json (the archive keeps
//    everything, even after it drops out of the live feeds)
// 3. Writes every page as static HTML
// Run: npm run build   (OFFLINE=1 skips the network and uses the archive only)

import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { XMLParser } from 'fast-xml-parser';
import * as T from './templates.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const DATA = path.join(ROOT, 'data');
const OFFLINE = process.env.OFFLINE === '1';

const config = JSON.parse(await readFile(path.join(ROOT, 'config.json'), 'utf8'));
const tracker = JSON.parse(await readFile(path.join(DATA, 'tracker.json'), 'utf8'));

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@',
  cdataPropName: false,
  trimValues: true,
});

async function readJson(file, fallback) {
  try { return JSON.parse(await readFile(file, 'utf8')); } catch { return fallback; }
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { 'user-agent': 'therealflow.tv site builder' },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`${url} answered ${res.status}`);
  return res.text();
}

const asArray = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
const text = (x) => (x == null ? '' : typeof x === 'object' ? (x['#text'] ?? '') : String(x));

export function slugify(s) {
  return s
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

// Keeps the show notes as HTML but removes anything that could run code.
function cleanHtml(html) {
  return String(html)
    .replace(/<(script|style|iframe|object|embed|form)[\s\S]*?<\/\1>/gi, '')
    .replace(/<(script|style|iframe|object|embed|form)[^>]*\/?>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1="#"')
    .replace(/<p>\s*<\/p>/g, '')
    .trim();
}

function plain(html) {
  return String(html).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function excerpt(s, n = 180) {
  const t = plain(s);
  if (t.length <= n) return t;
  return t.slice(0, n).replace(/\s+\S*$/, '') + '…';
}

function durationToSeconds(d) {
  if (!d) return 0;
  if (/^\d+$/.test(String(d))) return Number(d);
  return String(d).split(':').map(Number).reduce((a, b) => a * 60 + b, 0);
}

// ---------- Podcast ----------
async function loadEpisodes() {
  const archiveFile = path.join(DATA, 'episodes.json');
  const archive = await readJson(archiveFile, []);
  let fresh = [];
  let show = null;
  if (!OFFLINE) {
    try {
      const xml = parser.parse(await fetchText(config.feeds.podcastRss));
      const ch = xml.rss.channel;
      show = {
        title: text(ch.title),
        description: plain(text(ch.description)),
        image: ch['itunes:image']?.['@href'] || ch.image?.url || '',
      };
      fresh = asArray(ch.item).map((it) => {
        const desc = text(it['content:encoded']) || text(it.description) || text(it['itunes:summary']);
        return {
          id: text(it.guid) || it.enclosure?.['@url'] || text(it.title),
          title: text(it.title).trim(),
          date: new Date(text(it.pubDate)).toISOString(),
          audio: it.enclosure?.['@url'] || '',
          audioType: it.enclosure?.['@type'] || 'audio/mpeg',
          duration: durationToSeconds(text(it['itunes:duration'])),
          image: it['itunes:image']?.['@href'] || show.image,
          spotify: text(it.link),
          notes: cleanHtml(desc),
        };
      });
      console.log(`Podcast feed: ${fresh.length} episodes`);
    } catch (e) {
      console.warn(`Podcast feed not reachable, using the archive: ${e.message}`);
    }
  }
  const byId = new Map(archive.map((e) => [e.id, e]));
  for (const e of fresh) byId.set(e.id, { ...byId.get(e.id), ...e });
  const episodes = [...byId.values()].sort((a, b) => b.date.localeCompare(a.date));
  // stable, unique slugs (a slug never changes once published)
  const used = new Set();
  for (const e of episodes.slice().reverse()) {
    let s = e.slug || slugify(e.title) || 'episode';
    let base = s, i = 2;
    while (used.has(s)) s = `${base}-${i++}`;
    e.slug = s; used.add(s);
  }
  await writeFile(archiveFile, JSON.stringify(episodes, null, 2) + '\n');
  const showFile = path.join(DATA, 'show.json');
  if (show) await writeFile(showFile, JSON.stringify(show, null, 2) + '\n');
  else show = await readJson(showFile, { title: 'TheRealFlow', description: config.description, image: '' });
  return { episodes, show };
}

// ---------- YouTube ----------
async function loadVideos() {
  const archiveFile = path.join(DATA, 'videos.json');
  const archive = await readJson(archiveFile, []);
  let fresh = [];
  if (!OFFLINE) {
    try {
      const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${config.feeds.youtubeChannelId}`;
      const xml = parser.parse(await fetchText(url));
      fresh = asArray(xml.feed.entry).map((en) => {
        const id = text(en['yt:videoId']);
        const link = asArray(en.link).map((l) => l['@href']).find(Boolean) || `https://www.youtube.com/watch?v=${id}`;
        return {
          id,
          title: text(en.title).trim(),
          date: new Date(text(en.published)).toISOString(),
          description: text(en['media:group']?.['media:description']).trim(),
          short: link.includes('/shorts/'),
        };
      });
      console.log(`YouTube feed: ${fresh.length} videos`);
    } catch (e) {
      console.warn(`YouTube feed not reachable, using the archive: ${e.message}`);
    }
  }
  const byId = new Map(archive.map((v) => [v.id, v]));
  for (const v of fresh) byId.set(v.id, { ...byId.get(v.id), ...v });
  const videos = [...byId.values()].sort((a, b) => b.date.localeCompare(a.date));
  await writeFile(archiveFile, JSON.stringify(videos, null, 2) + '\n');
  return videos;
}

// ---------- Write ----------
async function page(rel, html) {
  const file = path.join(DIST, rel);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, html);
}

const { episodes, show } = await loadEpisodes();
const videos = await loadVideos();

await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });
await cp(path.join(ROOT, 'assets'), path.join(DIST, 'assets'), { recursive: true });

const ctx = { config, show, episodes, videos, tracker, excerpt, plain };

await page('index.html', T.home(ctx));
await page('videos/index.html', T.videosPage(ctx));
await page('podcast/index.html', T.podcastPage(ctx));
for (const ep of episodes) await page(`podcast/${ep.slug}/index.html`, T.episodePage(ctx, ep));
await page('tracker/index.html', T.trackerPage(ctx));
await page('about/index.html', T.aboutPage(ctx));
await page('404.html', T.notFound(ctx));
await page('assets/tracker-data.json', JSON.stringify(tracker));

// SEO plumbing
const now = new Date().toISOString().slice(0, 10);
const urls = [
  ['/', now], ['/videos/', videos[0]?.date.slice(0, 10) || now], ['/podcast/', episodes[0]?.date.slice(0, 10) || now],
  ['/tracker/', tracker.updated], ['/about/', now],
  ...episodes.map((e) => [`/podcast/${e.slug}/`, e.date.slice(0, 10)]),
];
await page('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
  .map(([u, d]) => `  <url><loc>${config.siteUrl}${u}</loc><lastmod>${d}</lastmod></url>`).join('\n')}\n</urlset>\n`);
await page('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${config.siteUrl}/sitemap.xml\n`);
await page('CNAME', new URL(config.siteUrl).host + '\n');
await page('.nojekyll', '');

console.log(`Built ${episodes.length} episode pages, ${videos.length} videos, ${tracker.projects.length} tracker projects.`);
if (!existsSync(path.join(DIST, 'index.html'))) process.exit(1);
