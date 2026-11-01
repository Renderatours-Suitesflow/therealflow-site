// Luxury Development Tracker: rotating globe + region/market filters.
(async () => {
  const list = [...document.querySelectorAll('.proj')];
  const chips = [...document.querySelectorAll('.chip')];
  const status = document.querySelector('.filter-status');
  const el = document.getElementById('globe');
  let current = { type: 'all', value: null };

  function apply(type, value) {
    current = { type, value };
    let n = 0;
    for (const li of list) {
      const show = type === 'all' || li.dataset[type] === value;
      li.hidden = !show;
      if (show) n++;
    }
    chips.forEach((c) => c.setAttribute('aria-pressed', String(
      (type === 'all' && c.dataset.filter === 'all') || (type === 'region' && c.dataset.filter === value))));
    status.textContent = type === 'all' ? '' : `${n} project${n === 1 ? '' : 's'} in ${value}.`;
    if (window.__markGlobe) window.__markGlobe(type === 'market' ? value : null);
  }
  chips.forEach((c) => c.addEventListener('click', () =>
    c.dataset.filter === 'all' ? apply('all') : apply('region', c.dataset.filter)));

  if (!el || !window.d3 || !window.topojson) return;
  const d3 = window.d3;
  let data, world;
  try {
    [data, world] = await Promise.all([
      fetch('/assets/tracker-data.json').then((r) => r.json()),
      fetch('/assets/vendor/countries-110m.json').then((r) => r.json()),
    ]);
  } catch { el.closest('.globe-wrap').hidden = true; return; }

  // one marker per market, at the average of its projects
  const markets = d3.rollups(data.projects, (ps) => ({
    count: ps.length,
    lng: d3.mean(ps, (p) => p.lng), lat: d3.mean(ps, (p) => p.lat),
  }), (p) => p.market).map(([name, v]) => ({ name, ...v }));

  const size = 600;
  const proj = d3.geoOrthographic().scale(size / 2 - 6).translate([size / 2, size / 2]).clipAngle(90).rotate([-30, -22]);
  const pathGen = d3.geoPath(proj);
  const svg = d3.select(el).append('svg').attr('viewBox', `0 0 ${size} ${size}`);
  svg.append('path').datum({ type: 'Sphere' }).attr('class', 'sphere');
  svg.append('path').datum(d3.geoGraticule10()).attr('class', 'grat');
  svg.append('path').datum(topojson.feature(world, world.objects.countries)).attr('class', 'land');
  const gM = svg.append('g');
  const rScale = d3.scaleSqrt().domain([1, d3.max(markets, (m) => m.count)]).range([6, 15]);

  const mk = gM.selectAll('g').data(markets).join('g')
    .attr('tabindex', 0).attr('role', 'button')
    .attr('aria-label', (m) => `${m.name}, ${m.count} project${m.count > 1 ? 's' : ''}`)
    .on('click', (_, m) => focus(m))
    .on('keydown', (e, m) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); focus(m); } });
  mk.append('circle').attr('class', 'mk').attr('r', (m) => rScale(m.count));
  mk.append('text').attr('class', 'mk-label').attr('dy', (m) => -rScale(m.count) - 6).attr('text-anchor', 'middle').text((m) => m.name);

  function render() {
    svg.selectAll('path').attr('d', pathGen);
    const center = proj.invert([size / 2, size / 2]);
    mk.attr('transform', (m) => `translate(${proj([m.lng, m.lat])})`)
      .attr('visibility', (m) => (d3.geoDistance([m.lng, m.lat], center) < Math.PI / 2 - 0.05 ? 'visible' : 'hidden'));
  }
  window.__markGlobe = (name) => { mk.classed('is-on', (m) => m.name === name); mk.select('circle').classed('is-on', (m) => m.name === name); };

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let spinning = !reduced;
  d3.timer(() => {
    if (!spinning) return;
    const r = proj.rotate();
    proj.rotate([r[0] + 0.12, r[1]]);
    render();
  });

  function focus(m) {
    spinning = false;
    const from = proj.rotate();
    const to = [-m.lng, -m.lat * 0.8];
    const it = d3.interpolate(from, to);
    d3.transition().duration(reduced ? 0 : 900).tween('rotate', () => (t) => { proj.rotate(it(t)); render(); });
    if (current.type === 'market' && current.value === m.name) apply('all');
    else apply('market', m.name);
  }

  svg.call(d3.drag().on('start', () => { spinning = false; }).on('drag', (e) => {
    const r = proj.rotate();
    const k = 75 / proj.scale();
    proj.rotate([r[0] + e.dx * k * 1.6, Math.max(-70, Math.min(70, r[1] - e.dy * k * 1.6))]);
    render();
  }));
  document.addEventListener('visibilitychange', () => { if (document.hidden) spinning = false; });
  render();
})();
