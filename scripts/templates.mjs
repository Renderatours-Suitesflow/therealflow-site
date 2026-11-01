// HTML templates for therealflow.tv. Plain functions returning strings, no framework.
import { HOME_FAQ, GLOSSARY } from './content.mjs';

const esc = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const fmtShort = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const fmtDur = (s) => {
  if (!s) return '';
  const m = Math.round(s / 60);
  return m < 1 ? `${s} sec` : `${m} min`;
};
const thumb = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
const ytUrl = (v) => v.short ? `https://www.youtube.com/shorts/${v.id}` : `https://www.youtube.com/watch?v=${v.id}`;

const ICONS = {
  arrow: '<svg class="i-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.7 15.1V8.9l5.8 3.1z"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.6 2h-3.3v13.2a2.9 2.9 0 1 1-2-2.8V9a6.2 6.2 0 1 0 5.3 6.1V8.6a7.8 7.8 0 0 0 4.4 1.4V6.7a4.5 4.5 0 0 1-4.4-4.7z"/></svg>',
  spotify: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 1.5a10.5 10.5 0 1 0 0 21 10.5 10.5 0 0 0 0-21zm4.8 15.2a.7.7 0 0 1-1 .2c-2.7-1.6-6-2-10-1.1a.7.7 0 0 1-.3-1.4c4.3-1 8-.6 11 1.3.3.2.4.6.3 1zm1.3-2.9a.9.9 0 0 1-1.2.3c-3-1.9-7.7-2.4-11.3-1.3a.9.9 0 1 1-.5-1.7c4.1-1.2 9.2-.6 12.7 1.5.4.3.5.8.3 1.2zm.1-3c-3.7-2.2-9.8-2.4-13.3-1.3a1 1 0 1 1-.6-2c4.1-1.2 10.8-1 15 1.6a1 1 0 0 1-1.1 1.7z"/></svg>',
  apple: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a9 9 0 0 0-3.4 17.3l.3-1.6A7.4 7.4 0 1 1 15 17.7l.4 1.6A9 9 0 0 0 12 2zm0 4a5 5 0 0 0-2.4 9.4l.3-1.7a3.4 3.4 0 1 1 4.2 0l.3 1.7A5 5 0 0 0 12 6zm0 4a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2zm-1 4.6-.8 7.4h3.6l-.8-7.4z"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 22v-8.2h2.8l.4-3.2h-3.2V8.5c0-.9.3-1.6 1.6-1.6h1.7V4.1a23 23 0 0 0-2.5-.1c-2.5 0-4.2 1.5-4.2 4.3v2.4H7.3v3.2h2.8V22z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4v11H3zm7 0h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6.1v5.3h-4v-4.7c0-1.1 0-2.6-1.6-2.6s-1.9 1.2-1.9 2.5v4.8h-4z"/></svg>',
};

const btn = (href, label, { variant = 'solid', ext = false, icon = 'arrow' } = {}) =>
  `<a class="sf-btn sf-btn--${variant}" href="${esc(href)}"${ext ? ' target="_blank" rel="noopener"' : ''}><span>${esc(label)}</span>${ICONS[icon] || ''}</a>`;

function channelLinks(config, { compact = false } = {}) {
  const L = config.links;
  const items = [
    ['youtube', 'YouTube', L.youtube],
    ['tiktok', 'TikTok', L.tiktok],
    ['spotify', 'Spotify', L.spotify],
    ['apple', 'Apple Podcasts', L.apple],
    ['facebook', 'Facebook', L.facebook],
    ['linkedin', 'LinkedIn', L.linkedin],
  ].filter(([, , href]) => href);
  return `<ul class="channels${compact ? ' channels--compact' : ''}">${items.map(([k, name, href]) =>
    `<li><a href="${esc(href)}" target="_blank" rel="noopener" aria-label="TheRealFlow on ${name}">${ICONS[k]}<span>${name}</span></a></li>`).join('')}</ul>`;
}

function layout(ctx, { title, description, path = '/', body, schema = [], image, active = '', extraHead = '', crumbs = [], ogType = 'website', published, modified }) {
  const { config } = ctx;
  const fullTitle = !title ? `${config.siteName}: How off-plan real estate really works` : title.length > 50 ? title : `${title} | ${config.siteName}`;
  const desc = description || config.description;
  const url = config.siteUrl + path;
  const ogImage = image || ctx.show?.image || config.host.portrait;
  const nav = [['/videos/', 'Videos'], ['/podcast/', 'Podcast'], ['/tracker/', 'Tracker'], ['/glossary/', 'Glossary'], ['/about/', 'About']];
  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': config.siteUrl + '/#mario',
    name: config.host.name,
    description: 'Host of TheRealFlow and co-founder of SuitesFlow. Has worked with real estate developers for 20 years.',
    knowsAbout: ['Off-plan real estate', 'Presale real estate', 'Contract assignment', 'Real estate development', 'Real estate visualization', 'Digital twins'],
    url: config.siteUrl + '/about/',
    image: config.host.portrait,
    jobTitle: 'Co-founder',
    worksFor: { '@type': 'Organization', name: config.host.company, url: config.host.companyUrl },
    sameAs: Object.values(config.links).filter(Boolean),
  };
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<meta name="author" content="${esc(config.host.name)}">
${config.verification?.google ? `<meta name="google-site-verification" content="${esc(config.verification.google)}">` : ''}
${config.verification?.bing ? `<meta name="msvalidate.01" content="${esc(config.verification.bing)}">` : ''}
<meta property="og:type" content="${ogType}">
${published ? `<meta property="article:published_time" content="${esc(published)}">` : ''}
${modified ? `<meta property="article:modified_time" content="${esc(modified)}">` : ''}
<meta property="og:site_name" content="${esc(config.siteName)}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(ogImage)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#ffffff">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="TheRealFlow podcast" href="${esc(config.feeds.podcastRss)}">
<link rel="alternate" type="application/rss+xml" title="TheRealFlow updates" href="${config.siteUrl}/feed.xml">
<link rel="alternate" type="text/plain" title="LLM summary" href="${config.siteUrl}/llms.txt">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/site.css">
${extraHead}
${[baseSchema, ...(crumbs.length ? [breadcrumbSchema(config, crumbs)] : []), ...schema].map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n')}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-head">
  <div class="wrap site-head__in">
    <a class="logo" href="/"><img src="/assets/logo.png" alt="TheRealFlow" width="500" height="307"></a>
    <nav aria-label="Main">
      <ul>${nav.map(([h, l]) => `<li><a href="${h}"${active === h ? ' aria-current="page"' : ''}>${l}</a></li>`).join('')}</ul>
    </nav>
  </div>
</header>
<main id="main">
${crumbs.length ? `<nav class="crumbs wrap" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li>${crumbs.map(([h, l], i) => i === crumbs.length - 1 ? `<li aria-current="page">${esc(l)}</li>` : `<li><a href="${esc(h)}">${esc(l)}</a></li>`).join('')}</ol></nav>` : ''}
${body}
</main>
<footer class="site-foot">
  <div class="wrap site-foot__in">
    <div>
      <a class="logo logo--foot" href="/"><img src="/assets/logo.png" alt="TheRealFlow" width="500" height="307" loading="lazy"></a>
      <p class="foot-tag">${esc(config.tagline)}.</p>
      <ul class="foot-nav">${nav.map(([h, l]) => `<li><a href="${h}">${l}</a></li>`).join('')}<li><a href="/feed.xml">RSS</a></li></ul>
    </div>
    ${channelLinks(config, { compact: true })}
  </div>
  <div class="wrap foot-legal">
    <p>Educational content only. Nothing here is financial or legal advice. Off-plan real estate carries risk, including total loss.</p>
    <p>© ${new Date().getUTCFullYear()} ${esc(config.host.name)}</p>
  </div>
</footer>
<dialog class="player" id="player" aria-label="Video player">
  <button class="player__close" type="button" aria-label="Close video">×</button>
  <div class="player__frame"></div>
</dialog>
<script src="/assets/site.js" defer></script>
</body>
</html>`;
}

function breadcrumbSchema(config, crumbs) {
  const items = [['/', 'Home'], ...crumbs];
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([h, l], i) => ({ '@type': 'ListItem', position: i + 1, name: l, item: config.siteUrl + h })) };
}

// A vertical video card. Clicking opens the on-page player; the link still works without JS.
const videoCard = (v, { large = false } = {}) => `
<a class="vcard${large ? ' vcard--large' : ''}" href="/videos/${esc(v.slug)}/" data-video="${esc(v.id)}">
  <span class="vcard__media">
    <img src="${thumb(v.id)}" alt="${esc(v.title)}" loading="${large ? 'eager' : 'lazy'}" width="480" height="360">
    <span class="vcard__play">${ICONS.play}</span>
  </span>
  <span class="vcard__title">${esc(v.title)}</span>
  ${v.dateGuessed ? '' : `<span class="vcard__date">${fmtShort(v.date)}</span>`}
</a>`;

const episodeRow = (ep, ctx) => `
<li class="eprow">
  <a href="/podcast/${esc(ep.slug)}/">
    <span class="eprow__date">${fmtShort(ep.date)}</span>
    <span class="eprow__title">${esc(ep.title)}</span>
    <span class="eprow__ex">${esc(ctx.excerpt(ep.notes, 150))}</span>
    <span class="eprow__dur">${fmtDur(ep.duration)}</span>
  </a>
</li>`;

const audio = (ep) => ep.audio ? `<audio class="audio" controls preload="none" src="${esc(ep.audio)}"><a href="${esc(ep.audio)}">Download the episode</a></audio>` : '';

// ---------- Pages ----------
export function home(ctx) {
  const { config, videos, episodes, tracker } = ctx;
  const latestV = videos[0];
  const latestE = episodes[0];
  const markets = [...new Set(tracker.projects.map((p) => p.market))];
  const body = `
<section class="hero">
  <div class="wrap hero__in">
    <div class="hero__copy">
      <p class="hero__hello">I’m Mario.</p>
      <h1>How off&#8209;plan real estate really works.</h1>
      <p class="lede">For 20 years I have worked next to the developers who sell homes before they exist. Here I explain that game from every side of the deal, one idea at a time.</p>
      <div class="actions">
        ${btn('/podcast/', 'Listen to the podcast')}
        ${btn('/videos/', 'Watch the videos', { variant: 'ghost', icon: 'play' })}
      </div>
      <p class="hero__for">For developers, brokers, investors and buyers.</p>
    </div>
    <figure class="hero__mario">
      <img src="/assets/mario-1100.webp" srcset="/assets/mario-720.webp 720w, /assets/mario-1100.webp 1100w" sizes="(max-width: 860px) 92vw, 560px" alt="Mario Comando, host of TheRealFlow" width="1100" height="1100" fetchpriority="high">
    </figure>
  </div>
</section>

${latestE ? `
<section class="band band--parchment">
  <div class="wrap episode-feature">
    <div class="episode-feature__main">
      <h2 class="h-section">New on the podcast</h2>
      <div class="ep-hero">
        ${latestE.image ? `<img class="ep-hero__art" src="${esc(latestE.image)}" alt="TheRealFlow podcast cover" width="168" height="168" loading="lazy">` : ''}
        <div>
          <p class="meta"><time datetime="${latestE.date}">${fmtDate(latestE.date)}</time><span>${fmtDur(latestE.duration)}</span></p>
          <h3 class="ep-hero__title"><a href="/podcast/${esc(latestE.slug)}/">${esc(latestE.title)}</a></h3>
          <p class="ep-hero__ex">${esc(ctx.excerpt(latestE.notes, 220))}</p>
          ${audio(latestE)}
        </div>
      </div>
    </div>
    <aside class="episode-feature__side" aria-label="Recent episodes">
      <h2 class="h-small">Recent episodes</h2>
      <ul class="eplist eplist--tight">${episodes.slice(1, 5).map((e) => episodeRow(e, ctx)).join('')}</ul>
      <a class="text-link" href="/podcast/">All episodes</a>
    </aside>
  </div>
</section>` : ''}

${videos.length ? `
<section class="band">
  <div class="wrap">
    <div class="row-head">
      <h2 class="h-section">Watch in a minute</h2>
      <a class="text-link" href="/videos/">All videos</a>
    </div>
    <div class="rail">${videos.slice(0, 8).map((v) => videoCard(v)).join('')}</div>
  </div>
</section>` : ''}

<section class="band band--tracker">
  <div class="wrap tracker-teaser">
    <div>
      <h2 class="h-display">Where the next ${esc(tracker.threshold)} is rising.</h2>
      <p class="lede">A live map of ${tracker.projects.length} ultra-luxury developments in ${markets.length} markets. Every figure links to its source.</p>
      ${btn('/tracker/', 'Open the tracker')}
    </div>
    <ul class="market-list" aria-label="Markets tracked">${markets.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>
  </div>
</section>

<section class="band">
  <div class="wrap about-strip about-strip--text">
    <div>
      <h2 class="h-section">Who is Mario</h2>
      <p>Mario has spent two decades next to the developers who sell homes before they exist. TheRealFlow explains that world from every side of the deal, so developers sell with more certainty and buyers invest with open eyes.</p>
      <p class="quiet">Mario is also the co-founder of <a href="${esc(config.host.companyUrl)}" target="_blank" rel="noopener">${esc(config.host.company)}</a>, which builds unit-by-unit virtual tours for off-plan projects.</p>
      <a class="text-link" href="/about/">More about Mario</a>
    </div>
  </div>
</section>

<section class="band band--parchment">
  <div class="wrap narrow">
    <h2 class="h-section">Off-plan real estate, answered</h2>
    <div class="faq">${HOME_FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
    <p class="faq-more">More terms explained in the <a class="text-link" href="/glossary/">off-plan glossary</a>.</p>
  </div>
</section>

<section class="band band--follow">
  <div class="wrap">
    <h2 class="h-section">Follow along</h2>
    ${channelLinks(config)}
  </div>
</section>`;
  const schema = [
    { '@context': 'https://schema.org', '@type': 'WebSite', '@id': config.siteUrl + '/#website', name: config.siteName, url: config.siteUrl + '/', description: config.description, inLanguage: 'en', publisher: { '@id': config.siteUrl + '/#mario' } },
    { '@context': 'https://schema.org', '@type': 'Organization', '@id': config.siteUrl + '/#org', name: config.siteName, url: config.siteUrl + '/', logo: config.siteUrl + '/assets/favicon.svg', slogan: config.tagline, founder: { '@id': config.siteUrl + '/#mario' }, sameAs: Object.values(config.links).filter(Boolean) },
    faqSchema(HOME_FAQ),
  ];
  return layout(ctx, { path: '/', body, active: '/', schema, image: config.siteUrl + '/assets/og-home.jpg' });
}

export function videosPage(ctx) {
  const { videos, config } = ctx;
  const body = `
<section class="page-head">
  <div class="wrap">
    <h1>Videos</h1>
    <p class="lede">Off-plan real estate in one minute or less. A new one every day.</p>
    <div class="actions">${btn(config.links.youtube, 'Subscribe on YouTube', { ext: true, icon: 'youtube' })}${btn(config.links.tiktok, 'Follow on TikTok', { variant: 'ghost', ext: true, icon: 'tiktok' })}</div>
  </div>
</section>
<section class="band band--tight">
  <div class="wrap">
    ${videos.length ? `<div class="vgrid">${videos.map((v) => videoCard(v)).join('')}</div>`
      : `<p class="empty">The first videos appear here as soon as they are on YouTube.</p>`}
  </div>
</section>`;
  return layout(ctx, { title: 'Videos', description: 'Short videos on how off-plan and presale real estate works, for developers, brokers, investors and buyers.', path: '/videos/', body, active: '/videos/', crumbs: [['/videos/', 'Videos']], schema: [itemList(ctx.config, videos.map((v) => ['/videos/' + v.slug + '/', v.title]))] });
}

export function podcastPage(ctx) {
  const { episodes, show, config } = ctx;
  const schema = [{
    '@context': 'https://schema.org', '@type': 'PodcastSeries', name: show.title || 'TheRealFlow',
    description: show.description, url: config.siteUrl + '/podcast/', image: show.image, webFeed: config.feeds.podcastRss,
    author: { '@type': 'Person', name: config.host.name },
  }];
  const body = `
<section class="page-head page-head--podcast">
  <div class="wrap podcast-head">
    ${show.image ? `<img src="${esc(show.image)}" alt="TheRealFlow podcast cover" width="200" height="200">` : ''}
    <div>
      <h1>The podcast</h1>
      <p class="lede">${esc(show.description || config.description)}</p>
      <div class="actions">
        ${config.links.spotify ? btn(config.links.spotify, 'Listen on Spotify', { ext: true, icon: 'spotify' }) : ''}
        ${config.links.apple ? btn(config.links.apple, 'Apple Podcasts', { variant: 'ghost', ext: true, icon: 'apple' }) : ''}
      </div>
    </div>
  </div>
</section>
<section class="band band--tight">
  <div class="wrap narrow">
    ${episodes.length ? `<ul class="eplist">${episodes.map((e) => episodeRow(e, ctx)).join('')}</ul>`
      : `<p class="empty">Episodes appear here as soon as they are published.</p>`}
  </div>
</section>`;
  return layout(ctx, { title: 'Off-plan real estate podcast', description: ctx.excerpt(show.description || config.description, 155), path: '/podcast/', body, schema: [...schema, itemList(config, episodes.map((e) => ['/podcast/' + e.slug + '/', e.title]))], active: '/podcast/', crumbs: [['/podcast/', 'Podcast']] });
}

export function episodePage(ctx, ep) {
  const { episodes, config } = ctx;
  const i = episodes.indexOf(ep);
  const more = episodes.filter((e) => e !== ep).slice(Math.max(0, i - 1), Math.max(0, i - 1) + 4);
  const desc = ctx.excerpt(ep.notes, 155);
  const schema = [{
    '@context': 'https://schema.org', '@type': 'PodcastEpisode', name: ep.title, datePublished: ep.date,
    description: desc, url: `${config.siteUrl}/podcast/${ep.slug}/`, image: ep.image,
    timeRequired: ep.duration ? `PT${Math.round(ep.duration / 60)}M` : undefined,
    associatedMedia: ep.audio ? { '@type': 'MediaObject', contentUrl: ep.audio } : undefined,
    partOfSeries: { '@type': 'PodcastSeries', name: 'TheRealFlow', url: config.siteUrl + '/podcast/' },
    author: { '@type': 'Person', name: config.host.name },
  }];
  const body = `
<article class="episode">
  <header class="wrap narrow episode__head">
    <a class="back" href="/podcast/">All episodes</a>
    <h1>${esc(ep.title)}</h1>
    <p class="meta"><time datetime="${ep.date}">${fmtDate(ep.date)}</time><span>${fmtDur(ep.duration)}</span></p>
    ${audio(ep)}
    <div class="actions">
      ${ep.spotify || config.links.spotify ? btn(ep.spotify || config.links.spotify, 'Open in Spotify', { variant: 'ghost', ext: true, icon: 'spotify' }) : ''}
    </div>
  </header>
  <div class="wrap narrow prose">${ep.notes || '<p>Show notes are on the way.</p>'}</div>
  <footer class="wrap narrow episode__foot">
    <div class="byline">
      <img src="${esc(config.host.portrait)}" alt="" width="56" height="56" loading="lazy">
      <p>Hosted by <a href="/about/">Mario Comando</a>, co-founder of <a href="${esc(config.host.companyUrl)}" target="_blank" rel="noopener">${esc(config.host.company)}</a>.</p>
    </div>
    ${more.length ? `<h2 class="h-small">More episodes</h2><ul class="eplist eplist--tight">${more.map((e) => episodeRow(e, ctx)).join('')}</ul>` : ''}
  </footer>
</article>`;
  return layout(ctx, { title: ep.title, description: desc, path: `/podcast/${ep.slug}/`, body, schema, image: ep.image, active: '/podcast/', crumbs: [['/podcast/', 'Podcast'], [`/podcast/${ep.slug}/`, ep.title]], ogType: 'article', published: ep.date });
}

export function trackerPage(ctx) {
  const { tracker, config } = ctx;
  const P = tracker.projects;
  const markets = new Set(P.map((p) => p.market));
  const regions = [...new Set(P.map((p) => p.region))];
  const schema = [{
    '@context': 'https://schema.org', '@type': 'Dataset', name: 'Luxury Development Tracker',
    description: `Ultra-luxury residential developments of ${tracker.threshold} worldwide, each with a dated public source.`,
    url: config.siteUrl + '/tracker/', dateModified: tracker.updated, creator: { '@id': config.siteUrl + '/#mario' }, license: 'https://creativecommons.org/licenses/by/4.0/', isAccessibleForFree: true,
    keywords: ['luxury real estate', 'branded residences', 'off-plan', 'real estate development', 'construction loans'],
    spatialCoverage: [...markets].join(', '),
    distribution: [{ '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: config.siteUrl + '/assets/tracker-data.json' }],
  }, faqSchema(FAQ)];
  const fields = [['developer', 'Developer'], ['value', 'Value'], ['status', 'Status'], ['units', 'Units'], ['floors', 'Floors'], ['startingPrice', 'Starting price'], ['unitSize', 'Unit size'], ['completion', 'Completion']];
  const card = (p) => `
<li class="proj" data-region="${esc(p.region)}" data-market="${esc(p.market)}">
  <h3><a href="/tracker/${esc(p.slug)}/">${esc(p.name)}</a></h3>
  <p class="proj__loc">${esc(p.location)}</p>
  <dl>${fields.filter(([k]) => p[k]).map(([k, l]) => `<div><dt>${l}</dt><dd>${k === 'developer' && p.developerUrl ? `<a href="${esc(p.developerUrl)}" target="_blank" rel="noopener">${esc(p.developer)}</a>` : esc(p[k])}</dd></div>`).join('')}</dl>
  <a class="text-link" href="${esc(p.sourceUrl)}" target="_blank" rel="noopener">Read the source</a>
</li>`;
  const body = `
<section class="page-head page-head--tracker">
  <div class="wrap">
    <h1>Where the next ${esc(tracker.threshold)} is rising.</h1>
    <p class="lede">${P.length} ultra-luxury developments in ${markets.size} markets, each with a public, dated source. Updated ${fmtDate(tracker.updated)}.</p>
  </div>
</section>
<section class="band band--tight">
  <div class="wrap tracker">
    <div class="globe-wrap">
      <div id="globe" class="globe" role="img" aria-label="Globe showing tracked markets"></div>
      <p class="globe-hint">Drag to turn the globe. Select a market to see its projects.</p>
    </div>
    <div class="tracker__list">
      <div class="filters" role="group" aria-label="Filter by region">
        <button type="button" class="chip" aria-pressed="true" data-filter="all">All regions</button>
        ${regions.map((r) => `<button type="button" class="chip" aria-pressed="false" data-filter="${esc(r)}">${esc(r)}</button>`).join('')}
      </div>
      <p class="filter-status" aria-live="polite"></p>
      <ul class="projects">${P.map(card).join('')}</ul>
    </div>
  </div>
</section>
<section class="band band--parchment">
  <div class="wrap narrow">
    <h2 class="h-section">Common questions</h2>
    <div class="faq">${FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
  </div>
</section>
<section class="band">
  <div class="wrap narrow cta-quiet">
    <h2 class="h-section">Building something that belongs on this list?</h2>
    <p>Mario’s company, ${esc(config.host.company)}, gives buyers a walkable tour of their exact unit and its real view before a single wall goes up.</p>
    ${btn(config.host.companyUrl + '/request-a-demo/', 'See how SuitesFlow works', { ext: true })}
  </div>
</section>`;
  const extraHead = `
<script src="/assets/vendor/d3.min.js" defer></script>
<script src="/assets/vendor/topojson-client.min.js" defer></script>
<script src="/assets/tracker.js" defer></script>`;
  return layout(ctx, { title: `Luxury Development Tracker: ${tracker.threshold} projects`, description: `A live map of ultra-luxury developments over ${tracker.threshold.replace('+', '')} worldwide: developer, value and status of each, with sources.`, path: '/tracker/', body, schema, active: '/tracker/', extraHead, crumbs: [['/tracker/', 'Luxury Development Tracker']] });
}

const FAQ = [
  ['What counts as a project on this tracker?', 'A publicly announced residential development with a reported construction cost, construction loan or total project value of $250M or more, in a recognized ultra-luxury market.'],
  ['How is the data checked?', 'Every figure comes from a named, dated source: trade press reporting a loan or contract, a public filing, or a developer announcement. The source is linked on each project. Figures are never estimated or rounded up to meet the threshold.'],
  ['How often is it updated?', 'New projects are added as soon as a $250M+ figure is confirmed by a public source. Each addition is checked by hand before it goes live.'],
  ['Why do some figures say “reported” or give a range?', 'When sources disagree, the tracker shows the range or the most credible figure and says so, rather than picking a number that looks precise.'],
];

export function aboutPage(ctx) {
  const { config } = ctx;
  const body = `
<section class="page-head">
  <div class="wrap about">
    <img class="about__portrait" src="${esc(config.host.portrait)}" alt="Mario Comando" width="320" height="320">
    <div>
      <h1>Mario Comando</h1>
      <p class="lede">Host of TheRealFlow. Co-founder of <a href="${esc(config.host.companyUrl)}" target="_blank" rel="noopener">${esc(config.host.company)}</a>.</p>
      <div class="prose">
        <p>There’s something weird about how real estate works. A buyer sees a project they love, but there’s this voice in their head saying “but is it real?” Most developers ignore that voice and make the dream sound better. I think that’s backwards.</p>
        <p>I built SuitesFlow to let buyers answer that question themselves. Not through brochures. Through certainty. Turns out that works better than any pitch.</p>
        <p>TheRealFlow is where I explain the rest of the game: how presales are priced, why early buyers profit, how a contract gets assigned, and why developers who show buyers the truth sell faster. One idea per video, every day.</p>
      </div>
      <div class="actions">
        ${btn(config.host.linkedin, 'Connect on LinkedIn', { ext: true, icon: 'linkedin' })}
        ${btn('/podcast/', 'Listen to the podcast', { variant: 'ghost' })}
      </div>
    </div>
  </div>
</section>
<section class="band band--follow">
  <div class="wrap">
    <h2 class="h-section">Follow along</h2>
    ${channelLinks(config)}
  </div>
</section>`;
  return layout(ctx, { title: 'About Mario Comando', description: 'Mario Comando hosts TheRealFlow and co-founded SuitesFlow. Two decades working with real estate developers.', path: '/about/', body, active: '/about/', crumbs: [['/about/', 'About']], schema: [{ '@context': 'https://schema.org', '@type': 'ProfilePage', mainEntity: { '@id': config.siteUrl + '/#mario' }, url: config.siteUrl + '/about/' }] });
}

export function notFound(ctx) {
  const body = `
<section class="page-head">
  <div class="wrap narrow">
    <h1>This page does not exist.</h1>
    <p class="lede">The link may be old. The newest videos and episodes are on the home page.</p>
    <div class="actions">${btn('/', 'Go to the home page')}</div>
  </div>
</section>`;
  return layout(ctx, { title: 'Page not found', path: '/404.html', body });
}


// ---------- SEO helpers ----------
function faqSchema(list) {
  return { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: list.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) };
}
function itemList(config, items) {
  return { '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: items.slice(0, 100).map(([u, n], i) => ({ '@type': 'ListItem', position: i + 1, url: config.siteUrl + u, name: n })) };
}
const isoDur = (s) => `PT${Math.floor(s / 60)}M${s % 60}S`;

// ---------- Video page ----------
export function videoPage(ctx, v) {
  const { config, videos, episodes } = ctx;
  const i = videos.indexOf(v);
  const more = videos.filter((x) => x !== v).slice(Math.max(0, i - 2), Math.max(0, i - 2) + 6);
  const desc = v.description ? ctx.excerpt(v.description, 155) : `${v.title}. A one-minute explainer on off-plan and presale real estate by Mario Comando.`;
  const schema = [{
    '@context': 'https://schema.org', '@type': 'VideoObject', name: v.title, description: v.description || desc,
    thumbnailUrl: [`https://i.ytimg.com/vi/${v.id}/maxresdefault.jpg`, thumb(v.id)], uploadDate: v.date,
    duration: v.seconds ? isoDur(v.seconds) : undefined,
    embedUrl: `https://www.youtube.com/embed/${v.id}`, contentUrl: ytUrl(v), url: `${config.siteUrl}/videos/${v.slug}/`,
    author: { '@id': config.siteUrl + '/#mario' }, inLanguage: 'en',
  }];
  const body = `
<article class="video-page">
  <div class="wrap video-page__in">
    <figure class="phone phone--page">
      <div class="phone__screen">${videoCard(v, { large: true })}</div>
    </figure>
    <div class="video-page__copy">
      <h1>${esc(v.title)}</h1>
      ${v.dateGuessed ? '' : `<p class="meta"><time datetime="${v.date}">${fmtDate(v.date)}</time>${v.seconds ? `<span>${v.seconds} sec</span>` : ''}</p>`}
      ${v.description ? `<div class="prose prose--video">${v.description.split(/\n{2,}/).map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('')}</div>` : `<p class="lede">A one-minute explainer on how off-plan real estate works, from every side of the deal.</p>`}
      <div class="actions">
        ${btn(ytUrl(v), 'Watch on YouTube', { ext: true, icon: 'youtube' })}
        ${btn(config.links.tiktok, 'Follow on TikTok', { variant: 'ghost', ext: true, icon: 'tiktok' })}
      </div>
      <div class="byline">
        <img src="${esc(config.host.portrait)}" alt="" width="56" height="56" loading="lazy">
        <p>By <a href="/about/">Mario Comando</a>, 20 years working with real estate developers.</p>
      </div>
    </div>
  </div>
  ${more.length ? `<div class="wrap video-more"><h2 class="h-section">More videos</h2><div class="rail">${more.map((x) => videoCard(x)).join('')}</div></div>` : ''}
  ${episodes[0] ? `<div class="wrap narrow video-more"><h2 class="h-small">Latest podcast episodes</h2><ul class="eplist eplist--tight">${episodes.slice(0, 3).map((e) => episodeRow(e, ctx)).join('')}</ul></div>` : ''}
</article>`;
  return layout(ctx, { title: v.title, description: desc, path: `/videos/${v.slug}/`, body, schema, image: `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`, active: '/videos/', crumbs: [['/videos/', 'Videos'], [`/videos/${v.slug}/`, v.title]], ogType: 'video.other', published: v.dateGuessed ? undefined : v.date });
}

// ---------- Tracker project page ----------
export function projectPage(ctx, p) {
  const { config, tracker } = ctx;
  const others = tracker.projects.filter((x) => x !== p && x.market === p.market);
  const nearby = others.length ? others : tracker.projects.filter((x) => x !== p && x.region === p.region).slice(0, 4);
  const status = (p.status || '').toLowerCase();
  const by = p.developer ? ` by ${p.developer}` : '';
  const lead = `${p.name} is an ultra-luxury residential development in ${p.location}${by}, with a reported ${p.value}. Status: ${status}${p.completion ? `, with completion expected ${/^\d|^[QHM]/.test(p.completion) ? 'in ' : ''}${p.completion}` : ''}.`;
  const fields = [['developer', 'Developer'], ['value', 'Reported value'], ['status', 'Status'], ['units', 'Units'], ['floors', 'Floors'], ['startingPrice', 'Starting price'], ['unitSize', 'Unit size'], ['completion', 'Completion']];
  const schema = [{
    '@context': 'https://schema.org', '@type': 'Residence', name: p.name, description: lead,
    url: `${config.siteUrl}/tracker/${p.slug}/`,
    address: { '@type': 'PostalAddress', addressLocality: p.location },
    geo: p.lat != null ? { '@type': 'GeoCoordinates', latitude: p.lat, longitude: p.lng } : undefined,
    subjectOf: { '@type': 'NewsArticle', url: p.sourceUrl },
  }];
  const body = `
<article class="project-page">
  <header class="wrap narrow">
    <h1>${esc(p.name)}</h1>
    <p class="lede">${esc(lead)}</p>
  </header>
  <div class="wrap narrow">
    <dl class="facts">${fields.filter(([k]) => p[k]).map(([k, l]) => `<div><dt>${l}</dt><dd>${k === 'developer' && p.developerUrl ? `<a href="${esc(p.developerUrl)}" target="_blank" rel="noopener">${esc(p.developer)}</a>` : esc(p[k])}</dd></div>`).join('')}
      <div><dt>Market</dt><dd>${esc(p.market)}, ${esc(p.region)}</dd></div></dl>
    <div class="actions">
      ${btn(p.sourceUrl, 'Read the source', { ext: true })}
      ${btn(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.location)}`, 'See it on the map', { variant: 'ghost', ext: true })}
    </div>
    <p class="quiet project-note">Figures come from the linked public source and are shown as reported. Tracker updated ${fmtDate(tracker.updated)}.</p>
    ${nearby.length ? `<h2 class="h-small">${others.length ? `More ${tracker.threshold} projects in ${esc(p.market)}` : `More in ${esc(p.region)}`}</h2>
    <ul class="mini-list">${nearby.map((x) => `<li><a href="/tracker/${esc(x.slug)}/">${esc(x.name)}</a><span>${esc(x.value)}</span></li>`).join('')}</ul>` : ''}
    <p><a class="text-link" href="/tracker/">See all ${tracker.projects.length} projects on the map</a></p>
  </div>
</article>`;
  return layout(ctx, { title: `${p.name}, ${p.market}`, description: lead.slice(0, 158), path: `/tracker/${p.slug}/`, body, schema, active: '/tracker/', crumbs: [['/tracker/', 'Luxury Development Tracker'], [`/tracker/${p.slug}/`, p.name]] });
}

// ---------- Glossary ----------
export function glossaryPage(ctx) {
  const { config } = ctx;
  const slug = (t) => t.toLowerCase().replace(/\([^)]*\)/g, '').trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const schema = [{
    '@context': 'https://schema.org', '@type': 'DefinedTermSet', '@id': config.siteUrl + '/glossary/#terms', name: 'Off-plan real estate glossary',
    url: config.siteUrl + '/glossary/',
    hasDefinedTerm: GLOSSARY.map(([t, d]) => ({ '@type': 'DefinedTerm', name: t, description: d, url: `${config.siteUrl}/glossary/#${slug(t)}`, inDefinedTermSet: config.siteUrl + '/glossary/#terms' })),
  }, {
    '@context': 'https://schema.org', '@type': 'WebPage', url: config.siteUrl + '/glossary/',
    speakable: { '@type': 'SpeakableSpecification', cssSelector: ['.term dd'] },
  }];
  const body = `
<section class="page-head">
  <div class="wrap narrow">
    <h1>Off-plan real estate glossary</h1>
    <p class="lede">The words developers, brokers and investors use when they sell and buy homes before they exist, explained in plain English.</p>
  </div>
</section>
<section class="band band--tight">
  <div class="wrap narrow">
    <nav class="toc" aria-label="Terms"><ul>${GLOSSARY.map(([t]) => `<li><a href="#${slug(t)}">${esc(t)}</a></li>`).join('')}</ul></nav>
    <dl class="terms">${GLOSSARY.map(([t, d]) => `<div class="term" id="${slug(t)}"><dt><h2>${esc(t)}</h2></dt><dd>${esc(d)}</dd></div>`).join('')}</dl>
    <p class="quiet">Have a term you want explained? Ask Mario on <a href="${esc(config.links.tiktok)}" target="_blank" rel="noopener">TikTok</a> and the answer may become the next video.</p>
  </div>
</section>`;
  return layout(ctx, { title: 'Off-plan real estate glossary: presale terms explained', description: 'Plain-English definitions of off-plan and presale real estate terms: assignment, deposit structure, pre-absorption, risk curve, GDV and more.', path: '/glossary/', body, schema, active: '/glossary/', crumbs: [['/glossary/', 'Glossary']] });
}
