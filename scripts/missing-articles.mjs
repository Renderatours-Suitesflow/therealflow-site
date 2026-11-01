// Lists videos and episodes that have no article yet. Used by the daily writer.
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
const read = async (f) => JSON.parse(await readFile(new URL(`../${f}`, import.meta.url), 'utf8'));
const videos = await read('data/videos.json');
const episodes = await read('data/episodes.json');
const has = (p) => existsSync(new URL(`../${p}`, import.meta.url));
const norm = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const covered = new Set(videos.filter((x) => has(`content/videos/${x.id}.json`)).map((x) => norm(x.title)));
// a repeated upload of a video that already has an article is skipped
const v = videos.filter((x) => !has(`content/videos/${x.id}.json`) && !covered.has(norm(x.title))).map((x) => ({ id: x.id, title: x.title, file: `content/videos/${x.id}.json` }));
const e = episodes.filter((x) => !has(`content/podcast/${x.slug}.json`)).map((x) => ({ slug: x.slug, title: x.title, transcript: has(`data/transcripts/podcast/${x.slug}.txt`) ? `data/transcripts/podcast/${x.slug}.txt` : null, file: `content/podcast/${x.slug}.json` }));
console.log(JSON.stringify({ videos: v, episodes: e }, null, 2));
