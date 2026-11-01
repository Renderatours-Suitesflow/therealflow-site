// Sends the URLs found by the last build to IndexNow (Bing, Yandex, Seznam, Naver...).
import { readFile } from 'node:fs/promises';
const config = JSON.parse(await readFile(new URL('../config.json', import.meta.url), 'utf8'));
let urls = [];
try { urls = JSON.parse(await readFile(new URL('../.indexnow-pending.json', import.meta.url), 'utf8')); } catch {}
if (!urls.length || !config.indexNowKey) { console.log('IndexNow: nothing new to announce'); process.exit(0); }
const host = new URL(config.siteUrl).host;
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key: config.indexNowKey, keyLocation: `${config.siteUrl}/${config.indexNowKey}.txt`, urlList: urls.slice(0, 10000) }),
});
console.log(`IndexNow: announced ${urls.length} URLs, answer ${res.status}`);
