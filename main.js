// Hover preview following cursor
const preview = document.querySelector('.preview');
const previewThumb = preview?.querySelector('.pv-thumb');
const previewVideo = preview?.querySelector('.pv-video');
const previewTitle = preview?.querySelector('.pv-title');
const previewYear = preview?.querySelector('.pv-year');
const previewRatio = preview?.querySelector('.pv-ratio');
let mouseX = 0, mouseY = 0;
let previewRAF = null;
let previewLoadTimer = null;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  if (preview?.classList.contains('active')) {
    if (previewRAF) cancelAnimationFrame(previewRAF);
    previewRAF = requestAnimationFrame(() => {
      preview.style.left = mouseX + 'px';
      preview.style.top = mouseY + 'px';
    });
  }
});

function clearPreviewVideo() {
  if (previewLoadTimer) { clearTimeout(previewLoadTimer); previewLoadTimer = null; }
  if (previewVideo) {
    previewVideo.classList.remove('ready');
    previewVideo.innerHTML = '';
  }
}

function loadPreviewVideo(row) {
  if (!previewVideo) return;
  const youtube = row.dataset.youtube;
  const vimeo = row.dataset.vimeo;
  const start = row.dataset.previewStart || '0';
  if (youtube) {
    previewVideo.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${youtube}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&playsinline=1&loop=1&playlist=${youtube}&start=${start}&disablekb=1" allow="autoplay; encrypted-media" frameborder="0"></iframe>`;
  } else if (vimeo) {
    previewVideo.innerHTML = `<iframe src="https://player.vimeo.com/video/${vimeo}?autoplay=1&muted=1&loop=1&background=1" allow="autoplay" frameborder="0"></iframe>`;
  } else {
    return;
  }
  previewLoadTimer = setTimeout(() => {
    previewVideo.classList.add('ready');
  }, 600);
}

// Inject inline thumbnail into each project row (visible on mobile)
document.querySelectorAll('.project').forEach((row) => {
  if (row.querySelector('.project-thumb')) return;
  const youtube = row.dataset.youtube;
  const thumb = youtube
    ? `https://i.ytimg.com/vi/${youtube}/hqdefault.jpg`
    : row.dataset.thumb;
  if (!thumb) return;
  const wrap = document.createElement('div');
  wrap.className = 'project-thumb';
  const img = document.createElement('img');
  img.src = thumb;
  img.alt = row.dataset.title || '';
  img.loading = 'lazy';
  img.decoding = 'async';
  wrap.appendChild(img);
  row.insertBefore(wrap, row.firstChild);
});

document.querySelectorAll('.project').forEach((row) => {
  row.addEventListener('mouseenter', () => {
    if (!preview) return;
    const thumb = row.dataset.thumb;
    const title = row.dataset.title;
    const year = row.dataset.year;
    if (previewThumb && thumb) previewThumb.src = thumb;
    if (previewTitle && title) previewTitle.textContent = title;
    if (previewYear && year) previewYear.textContent = year;
    preview.style.left = mouseX + 'px';
    preview.style.top = mouseY + 'px';
    preview.classList.add('active');
    clearPreviewVideo();
    loadPreviewVideo(row);
  });
  row.addEventListener('mouseleave', () => {
    preview?.classList.remove('active');
    clearPreviewVideo();
  });
});

// Lightbox
const lightbox = document.querySelector('.lightbox');
const lightboxFrame = lightbox?.querySelector('iframe');
const lightboxClose = lightbox?.querySelector('.lightbox-close');

function openLightbox(embedUrl) {
  if (!lightbox || !lightboxFrame) return;
  lightboxFrame.src = embedUrl;
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  if (!lightbox || !lightboxFrame) return;
  lightbox.classList.remove('active');
  lightboxFrame.src = '';
  document.body.style.overflow = '';
}

document.querySelectorAll('.project').forEach((row) => {
  row.addEventListener('click', (e) => {
    e.preventDefault();
    const youtube = row.dataset.youtube;
    const vimeo = row.dataset.vimeo;
    const href = row.dataset.href;
    if (youtube) {
      openLightbox(`https://www.youtube-nocookie.com/embed/${youtube}?autoplay=1&rel=0&modestbranding=1`);
    } else if (vimeo) {
      openLightbox(`https://player.vimeo.com/video/${vimeo}?autoplay=1`);
    } else if (href) {
      window.open(href, '_blank', 'noopener');
    }
  });
});

lightboxClose?.addEventListener('click', closeLightbox);
lightbox?.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

// Scroll reveal
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && revealEls.length) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -80px 0px' });
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('in'));
}

// Header background on scroll
const headerEl = document.querySelector('header');
if (headerEl) {
  const onScroll = () => {
    if (window.scrollY > 16) headerEl.classList.add('scrolled');
    else headerEl.classList.remove('scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

// Timeline playhead + timecode
const timelineProgress = document.querySelector('.timeline-progress');
const timelineHead = document.querySelector('.timeline-head');
const scrollTc = document.querySelector('[data-scroll-tc]');

if (timelineProgress || scrollTc) {
  const pad = (n, w = 2) => String(n).padStart(w, '0');
  const onScroll = () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const pct = h > 0 ? Math.min(Math.max(window.scrollY / h, 0), 1) : 0;
    if (timelineProgress) timelineProgress.style.width = (pct * 100) + '%';
    if (timelineHead) timelineHead.style.left = (pct * 100) + '%';
    if (scrollTc) {
      // Fake SMPTE timecode spread across a mock 2-minute duration
      const totalFrames = 24 * 120;
      const frame = Math.round(pct * totalFrames);
      const hh = Math.floor(frame / (24 * 3600));
      const mm = Math.floor((frame / (24 * 60)) % 60);
      const ss = Math.floor((frame / 24) % 60);
      const ff = frame % 24;
      scrollTc.textContent = `${pad(hh)}:${pad(mm)}:${pad(ss)}:${pad(ff)}`;
    }
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
}

// Live timecode in header slate (subtle detail)
const clockEl = document.querySelector('[data-clock]');
if (clockEl) {
  const pad = (n) => String(n).padStart(2, '0');
  const tick = () => {
    const d = new Date();
    clockEl.textContent = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
  };
  tick();
  setInterval(tick, 1000);
}
