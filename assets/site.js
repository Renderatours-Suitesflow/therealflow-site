// Video player dialog + button ripple. Everything works without JS too (links open YouTube).
(() => {
  const track = (name, params) => { try { if (window.gtag) window.gtag('event', name, params); } catch {} };
  // first play of each podcast episode
  document.addEventListener('play', (e) => {
    const a = e.target;
    if (a.tagName !== 'AUDIO' || a.dataset.tracked) return;
    a.dataset.tracked = '1';
    track('podcast_play', { episode_title: document.querySelector('.episode__head h1, .ep-hero__title')?.textContent.trim() || '' });
  }, true);
  const dlg = document.getElementById('player');
  const frame = dlg && dlg.querySelector('.player__frame');
  const close = () => { if (!dlg) return; frame.innerHTML = ''; if (dlg.open) dlg.close(); };

  document.addEventListener('click', (e) => {
    const card = e.target.closest('[data-video]');
    if (card && dlg && typeof dlg.showModal === 'function') {
      e.preventDefault();
      const id = encodeURIComponent(card.dataset.video);
      frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1" title="Video player" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
      dlg.showModal();
      track('video_play', { video_id: card.dataset.video, video_title: card.querySelector('img')?.alt || '' });
      return;
    }
    const btn = e.target.closest('.sf-btn');
    if (btn) {
      const r = btn.getBoundingClientRect();
      const s = Math.max(r.width, r.height);
      const span = document.createElement('span');
      span.className = 'ripple';
      span.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
      btn.appendChild(span);
      setTimeout(() => span.remove(), 650);
    }
  });

  if (dlg) {
    dlg.querySelector('.player__close').addEventListener('click', close);
    dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
    dlg.addEventListener('close', () => { frame.innerHTML = ''; });
  }
})();
