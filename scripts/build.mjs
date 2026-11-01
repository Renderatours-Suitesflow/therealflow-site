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
  const yt = url.includes('youtube.com');
  const res = await fetch(url, {
    headers: yt ? {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
      'accept-language': 'en-US,en;q=0.9',
      cookie: 'CONSENT=YES+cb; SOCS=CAI',
    } : { 'user-agent': 'therealflow.tv site builder' },
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
    .replace(/['’]/g, '')
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

// The channel feed is the clean source; the uploads-playlist feed is the same data by another URL.
async function youtubeFromFeeds() {
  const id = config.feeds.youtubeChannelId;
  const urls = [
    `https://www.youtube.com/feeds/videos.xml?channel_id=${id}`,
    `https://www.youtube.com/feeds/videos.xml?playlist_id=UU${id.slice(2)}`,
  ];
  let lastErr;
  for (const url of urls) {
    try {
      const xml = parser.parse(await fetchText(url));
      return asArray(xml.feed.entry).map((en) => {
        const vid = text(en['yt:videoId']);
        const link = asArray(en.link).map((l) => l['@href']).find(Boolean) || '';
        return {
          id: vid,
          title: text(en.title).replace(/\s*#shorts\b/gi, '').trim(),
          date: new Date(text(en.published)).toISOString(),
          description: text(en['media:group']?.['media:description']).trim(),
          short: true,
        };
      });
    } catch (e) { lastErr = e; }
  }
  throw lastErr;
}

// Last resort: read the Shorts tab of the channel page. It gives ids and titles in newest-first
// order but no dates, so a new video gets the time it was first seen.
async function youtubeFromChannelPage() {
  const html = await fetchText(config.links.youtube.replace(/\/$/, '') + '/shorts');
  const seen = new Set();
  const out = [];
  // Each Short is one "shortsLockupViewModel" block holding its title and its videoId.
  const blocks = html.split('"shortsLockupViewModel"').slice(1);
  for (const b of blocks) {
    // the block's own id: entityId first (most reliable), then its thumbnail, then any videoId
    const vid = (b.match(/"entityId":"shorts-shelf-item-([\w-]{11})"/) || b.match(/i\.ytimg\.com\/vi\/([\w-]{11})\//) || b.match(/"videoId":"([\w-]{11})"/) || [])[1];
    if (!vid || seen.has(vid)) continue;
    seen.add(vid);
    const t = b.match(/"primaryText":\{"content":"((?:[^"\\]|\\.)*)"/)
      || b.match(/"accessibilityText":"((?:[^"\\]|\\.)*?), [\d.,KM]+ views/);
    const title = t ? JSON.parse(`"${t[1]}"`).replace(/\s*#shorts\b/gi, '').trim() : '';
    out.push({ id: vid, title, short: true, dateGuessed: true });
  }
  console.log(`Shorts page: ${blocks.length} blocks, ${(html.match(/shorts-shelf-item-/g) || []).length} entity ids`);
  if (!out.length) throw new Error('no Shorts found on the channel page');
  const now = Date.now();
  out.forEach((v, i) => { v.date = new Date(now - i * 60000).toISOString(); });
  console.log(`YouTube channel page: ${out.length} Shorts`);
  return out;
}

// Reads one video's public page for its real publish date, description and length.
async function videoDetails(id) {
  const html = await fetchText(`https://www.youtube.com/watch?v=${id}`);
  const grab = (re) => { const m = html.match(re); return m ? JSON.parse(`"${m[1]}"`) : ''; };
  const out = {};
  const date = grab(/"uploadDate":"([^"]+)"/) || grab(/"publishDate":"([^"]+)"/) || grab(/itemprop="uploadDate" content="([^"]+)"/);
  if (date && !isNaN(new Date(date))) { out.date = new Date(date).toISOString(); out.dateGuessed = false; }
  const desc = grab(/"shortDescription":"((?:[^"\\]|\\.)*)"/);
  if (desc) out.description = desc.replace(/(^|\s)#\w+/g, '').replace(/[ \t]+\n/g, '\n').trim();
  const secs = grab(/"lengthSeconds":"(\d+)"/);
  if (secs) out.seconds = Number(secs);
  if (!out.date && !out.description) throw new Error(`no details on the page (${html.length} bytes, title: ${(html.match(/<title>([^<]*)/) || [])[1] || 'none'})`);
  return out;
}

// ---------- YouTube ----------
async function loadVideos() {
  const archiveFile = path.join(DATA, 'videos.json');
  const archive = await readJson(archiveFile, []);
  let fresh = [];
  if (!OFFLINE) {
    try {
      fresh = await youtubeFromFeeds();
      console.log(`YouTube feed: ${fresh.length} videos`);
    } catch (e) {
      console.warn(`YouTube feed failed (${e.message}), reading the channel page instead`);
      try { fresh = await youtubeFromChannelPage(); }
      catch (e2) { console.warn(`YouTube channel page failed too, using the archive: ${e2.message}`); }
    }
  }
  const byId = new Map(archive.map((v) => [v.id, v]));
  for (const v of fresh) {
    const old = byId.get(v.id);
    // a guessed date never replaces a date we already have
    if (old && v.dateGuessed) byId.set(v.id, { ...old, title: v.title || old.title });
    else if (!old && v.dateGuessed && archive.length) {
      // a Short that appeared since the last run (runs are 2 hours apart): first-seen time is its publish time
      byId.set(v.id, { ...v, date: new Date().toISOString(), dateGuessed: false, dateSource: 'first-seen' });
    } else byId.set(v.id, { ...old, ...v });
  }
  if (!OFFLINE) {
    let n = 0;
    for (const v of byId.values()) {
      if (v.detailed || (v.detailTries || 0) >= 2 || n >= 40) continue;
      n++;
      try { Object.assign(v, await videoDetails(v.id)); v.detailed = true; }
      catch (e) { v.detailTries = (v.detailTries || 0) + 1; if (n === 1) console.warn(`Video details not available from YouTube: ${e.message}`); }
    }
    if (n) console.log(`Video details tried for ${n} videos`);
  }
  const all = [...byId.values()].sort((a, b) => b.date.localeCompare(a.date));
  // the same video uploaded twice gets one page (the older upload)
  const seenTitle = new Map();
  const hasArticle = (v) => existsSync(path.join(ROOT, 'content/videos', `${v.id}.json`));
  for (const v of all.slice().reverse()) {
    const k = slugify(v.title);
    if (!seenTitle.has(k) || (hasArticle(v) && !hasArticle(all.find((x) => x.id === seenTitle.get(k))))) seenTitle.set(k, v.id);
  }
  const videos = all.filter((v) => !v.title || seenTitle.get(slugify(v.title)) === v.id);
  const used = new Set();
  for (const v of videos.slice().reverse()) {
    let s = v.slug || slugify(v.title) || v.id.toLowerCase();
    if (used.has(s)) s = `${s}-${v.id.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    v.slug = s; used.add(s);
  }
  await writeFile(archiveFile, JSON.stringify(all, null, 2) + '\n');
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

{
  const used = new Set();
  for (const p of tracker.projects) { let s = slugify(p.name); while (used.has(s)) s += '-2'; p.slug = s; used.add(s); }
}
// Articles written from each video's and episode's own content
async function loadArticle(file) { try { return JSON.parse(await readFile(file, 'utf8')); } catch { return null; } }
for (const v of videos) v.article = await loadArticle(path.join(ROOT, 'content/videos', `${v.id}.json`));
for (const e of episodes) e.article = await loadArticle(path.join(ROOT, 'content/podcast', `${e.slug}.json`));
console.log(`Articles: ${videos.filter((v) => v.article).length} videos, ${episodes.filter((e) => e.article).length} episodes`);
const ctx = { config, show, episodes, videos, tracker, excerpt, plain };

await page('index.html', T.home(ctx));
await page('videos/index.html', T.videosPage(ctx));
await page('podcast/index.html', T.podcastPage(ctx));
for (const ep of episodes) await page(`podcast/${ep.slug}/index.html`, T.episodePage(ctx, ep));
for (const v of videos) await page(`videos/${v.slug}/index.html`, T.videoPage(ctx, v));
for (const p of tracker.projects) await page(`tracker/${p.slug}/index.html`, T.projectPage(ctx, p));
await page('glossary/index.html', T.glossaryPage(ctx));
await page('tracker/index.html', T.trackerPage(ctx));
await page('about/index.html', T.aboutPage(ctx));
await page('404.html', T.notFound(ctx));
await page('assets/tracker-data.json', JSON.stringify(tracker));

// SEO plumbing
const latest = [episodes[0]?.date, videos[0]?.date, tracker.updated].filter(Boolean).sort().pop()?.slice(0, 10) || '2026-11-01';
const urls = [
  ['/', latest, 'daily', '1.0'], ['/videos/', videos[0]?.date.slice(0, 10) || latest, 'daily', '0.9'],
  ['/podcast/', episodes[0]?.date.slice(0, 10) || latest, 'daily', '0.9'], ['/tracker/', tracker.updated, 'weekly', '0.9'],
  ['/glossary/', '2026-11-01', 'monthly', '0.8'], ['/about/', '2026-11-01', 'monthly', '0.6'],
  ...episodes.map((e) => [`/podcast/${e.slug}/`, e.date.slice(0, 10), 'monthly', '0.8']),
  ...videos.map((v) => [`/videos/${v.slug}/`, v.date.slice(0, 10), 'monthly', '0.7', v]),
  ...tracker.projects.map((p) => [`/tracker/${p.slug}/`, tracker.updated, 'weekly', '0.7']),
];
const x = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
await page('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls.map(([u, d, f, pr, v]) => `  <url><loc>${config.siteUrl}${u}</loc><lastmod>${d}</lastmod><changefreq>${f}</changefreq><priority>${pr}</priority>${v ? `
    <video:video><video:thumbnail_loc>https://i.ytimg.com/vi/${v.id}/hqdefault.jpg</video:thumbnail_loc><video:title>${x(v.title)}</video:title><video:description>${x((v.description || v.title).slice(0, 2000))}</video:description><video:player_loc>https://www.youtube.com/embed/${v.id}</video:player_loc>${v.seconds ? `<video:duration>${v.seconds}</video:duration>` : ''}${v.dateGuessed ? '' : `<video:publication_date>${v.date}</video:publication_date>`}</video:video>` : ''}</url>`).join('\n')}
</urlset>
`);

// Search engines and AI answer engines are all welcome.
const aiBots = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'Amazonbot', 'CCBot', 'Meta-ExternalAgent', 'Bytespider', 'DuckAssistBot', 'MistralAI-User', 'cohere-ai'];
await page('robots.txt', `User-agent: *\nAllow: /\n\n${aiBots.map((b) => `User-agent: ${b}\nAllow: /`).join('\n\n')}\n\nSitemap: ${config.siteUrl}/sitemap.xml\n`);

// llms.txt — a plain summary for AI assistants (llmstxt.org)
const abs = (u) => config.siteUrl + u;
await page('llms.txt', `# TheRealFlow

> ${config.description} TheRealFlow explains how off-plan (presale) real estate works for developers, brokers, investors and buyers. Host: Mario Comando, co-founder of SuitesFlow, 20 years working with real estate developers.

Key facts:
- Off-plan real estate is property sold before it is built. Early buyers pay the lowest prices because risk is highest; prices rise as construction removes risk.
- An assignment transfers an off-plan contract to a new buyer before completion; the original buyer keeps the price difference.
- The site keeps a sourced Luxury Development Tracker of ${tracker.projects.length} ultra-luxury residential projects worth ${tracker.threshold}.

## Core pages
- [Off-plan glossary](${abs('/glossary/')}): plain-English definitions of presale terms
- [Luxury Development Tracker](${abs('/tracker/')}): ${tracker.projects.length} projects ${tracker.threshold}, each with a public source ([JSON data](${abs('/assets/tracker-data.json')}))
- [Podcast](${abs('/podcast/')}): weekday episodes on off-plan real estate
- [Videos](${abs('/videos/')}): one-minute explainers
- [About Mario Comando](${abs('/about/')})

## Podcast episodes
${episodes.map((e) => `- [${e.title}](${abs(`/podcast/${e.slug}/`)}): ${excerpt(e.notes, 160)}`).join('\n')}

## Videos
${videos.slice(0, 60).map((v) => `- [${v.title}](${abs(`/videos/${v.slug}/`)})`).join('\n')}

## Tracker projects
${tracker.projects.map((p) => `- [${p.name}](${abs(`/tracker/${p.slug}/`)}): ${p.location}; ${p.value}; ${p.status}`).join('\n')}

## Optional
- [Full text for AI assistants](${abs('/llms-full.txt')})
`);

const { HOME_FAQ, GLOSSARY } = await import('./content.mjs');
await page('llms-full.txt', `# TheRealFlow — full text

${config.description}

## Questions and answers
${HOME_FAQ.map(([q, a]) => `### ${q}\n${a}`).join('\n\n')}

## Glossary
${GLOSSARY.map(([t, d]) => `### ${t}\n${d}`).join('\n\n')}

## Luxury Development Tracker (updated ${tracker.updated})
${tracker.projects.map((p) => `### ${p.name}\n${['location', 'developer', 'value', 'status', 'units', 'floors', 'startingPrice', 'unitSize', 'completion'].filter((k) => p[k]).map((k) => `- ${k}: ${p[k]}`).join('\n')}\n- source: ${p.sourceUrl}\n- page: ${abs(`/tracker/${p.slug}/`)}`).join('\n\n')}

## Podcast episodes
${episodes.map((e) => `### ${e.title}\nPublished ${e.date.slice(0, 10)}. ${abs(`/podcast/${e.slug}/`)}\n\n${plain(e.notes)}`).join('\n\n')}

## Videos
${videos.map((v) => `### ${v.title}\n${abs(`/videos/${v.slug}/`)}${v.description ? `\n\n${v.description}` : ''}`).join('\n\n')}
`);

// RSS feed of everything new on the site
const feedItems = [
  ...episodes.map((e) => ({ title: e.title, url: abs(`/podcast/${e.slug}/`), date: e.date, desc: excerpt(e.notes, 300) })),
  ...videos.filter((v) => !v.dateGuessed).map((v) => ({ title: v.title, url: abs(`/videos/${v.slug}/`), date: v.date, desc: v.description ? excerpt(v.description, 300) : v.title })),
].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 50);
await page('feed.xml', `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>TheRealFlow</title>
<link>${config.siteUrl}/</link>
<atom:link href="${config.siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
<description>${x(config.description)}</description>
<language>en</language>
${feedItems.map((i) => `<item><title>${x(i.title)}</title><link>${i.url}</link><guid>${i.url}</guid><pubDate>${new Date(i.date).toUTCString()}</pubDate><description>${x(i.desc)}</description></item>`).join('\n')}
</channel>
</rss>
`);

// IndexNow: tells Bing, Yandex and others about new pages right away
if (config.indexNowKey) {
  await page(`${config.indexNowKey}.txt`, config.indexNowKey);
  const indexedFile = path.join(DATA, 'indexed.json');
  const indexed = new Set(await readJson(indexedFile, []));
  const all = urls.map(([u]) => abs(u));
  const fresh = all.filter((u) => !indexed.has(u));
  // list pages always change when something new arrives
  if (fresh.length) for (const u of ['/', '/videos/', '/podcast/', '/tracker/']) if (!fresh.includes(abs(u))) fresh.push(abs(u));
  await writeFile(path.join(ROOT, '.indexnow-pending.json'), JSON.stringify(fresh));
  await writeFile(indexedFile, JSON.stringify(all, null, 2) + '\n');
  if (fresh.length) console.log(`IndexNow: ${fresh.length} URLs to announce`);
}

await page('CNAME', new URL(config.siteUrl).host + '\n');
await page('.nojekyll', '');

console.log(`Built ${episodes.length} episode pages, ${videos.length} video pages, ${tracker.projects.length} tracker pages, glossary.`);
if (!existsSync(path.join(DIST, 'index.html'))) process.exit(1);
