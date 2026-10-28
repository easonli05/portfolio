// Renders the gallery from window.PORTFOLIO (photos.js) and runs the lightbox.
// Markup and class names follow DESIGN-CONTRACT.md.
// ✍️ Claude · 2026-10-28
(function () {
  'use strict';

  var data = window.PORTFOLIO;
  if (!data || !data.photos) return;

  var site = data.site || {};
  var photos = data.photos;
  var SIZES = '(min-width: 1100px) 33vw, (min-width: 700px) 50vw, 100vw';

  function $(sel) { return document.querySelector(sel); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  // ---- Page text ----
  var title = $('.site-title');
  title.textContent = '';
  // The page is zh-Hant; mark the Latin name so screen readers pronounce it in English.
  if (site.title) {
    var main = el('span', 'site-title-main', site.title);
    if (/^[\x00-\x7F]+$/.test(site.title)) main.lang = 'en';
    title.appendChild(main);
  }
  if (site.titleAlt) {
    title.appendChild(document.createTextNode(' '));
    var alt = el('span', 'site-title-alt', site.titleAlt);
    alt.lang = 'zh-Hant';
    title.appendChild(alt);
  }
  $('.site-tagline').textContent = site.tagline || '';
  if (site.title) {
    document.title = [site.title, site.titleAlt].filter(Boolean).join(' ') +
      ' · ' + (site.tagline || '作品集');
  }
  var intro = $('.intro');
  (site.intro || []).forEach(function (p) { intro.appendChild(el('p', null, p)); });
  var contact = $('.site-contact');
  if (site.contact) contact.textContent = site.contact; else contact.remove();
  $('.site-credit').textContent = site.credit || '';

  // ---- Gallery ----
  var gallery = $('.gallery');
  var box = $('.lightbox');
  // Browsers without <dialog> support open the large file instead of the lightbox.
  var canDialog = typeof box.showModal === 'function';
  photos.forEach(function (p, i) {
    var li = el('li', 'gallery-item');
    li.dataset.orientation = p.width >= p.height ? 'landscape' : 'portrait';
    li.dataset.index = String(i);

    var btn = el('button', 'gallery-open');
    btn.type = 'button';
    btn.setAttribute('aria-label', '開啟第 ' + (i + 1) + ' 張照片，共 ' + photos.length + ' 張' +
      (p.caption ? '：' + p.caption : ''));

    var img = el('img', 'gallery-img');
    img.src = p.thumb;
    img.srcset = p.thumb + ' ' + p.thumbWidth + 'w, ' + p.large + ' ' + p.width + 'w';
    img.sizes = SIZES;
    img.width = p.width;
    img.height = p.height;
    img.alt = p.caption || '第 ' + (i + 1) + ' 張照片';
    img.loading = i < 4 ? 'eager' : 'lazy';
    img.decoding = 'async';

    btn.appendChild(img);
    btn.addEventListener('click', function () {
      if (canDialog) open(i); else window.location.href = p.large;
    });
    li.appendChild(btn);
    if (p.caption) li.appendChild(el('p', 'gallery-caption', p.caption));
    gallery.appendChild(li);
  });

  // ---- Lightbox ----
  if (!canDialog) return;
  var boxImg = $('.lightbox-img');
  var counter = $('.lightbox-counter');
  var text = $('.lightbox-text');
  var current = -1;

  function show(i) {
    current = (i + photos.length) % photos.length;
    var p = photos[current];
    boxImg.classList.add('is-loading');
    boxImg.onload = function () { boxImg.classList.remove('is-loading'); };
    boxImg.src = p.large;
    boxImg.width = p.width;
    boxImg.height = p.height;
    boxImg.alt = p.caption || '第 ' + (current + 1) + ' 張照片';
    counter.textContent = (current + 1) + ' / ' + photos.length;
    text.textContent = p.caption || '';
    // Warm the cache for the neighbours.
    [current + 1, current - 1].forEach(function (n) {
      new Image().src = photos[(n + photos.length) % photos.length].large;
    });
    document.querySelectorAll('.gallery-item.is-current').forEach(function (n) {
      n.classList.remove('is-current');
    });
    gallery.children[current].classList.add('is-current');
  }

  function open(i) {
    show(i);
    document.body.classList.add('lightbox-open');
    box.showModal();
  }

  function close() { box.close(); }

  box.addEventListener('close', function () {
    document.body.classList.remove('lightbox-open');
    var item = gallery.children[current];
    if (item) item.querySelector('.gallery-open').focus();
  });

  $('.lightbox-close').addEventListener('click', close);
  $('.lightbox-prev').addEventListener('click', function () { show(current - 1); });
  $('.lightbox-next').addEventListener('click', function () { show(current + 1); });

  // A click on the backdrop (the dialog itself, not its contents) closes it.
  box.addEventListener('click', function (e) { if (e.target === box) close(); });

  box.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1); }
  });

  // Horizontal swipe on touch screens.
  var startX = null, startY = null;
  box.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) return;
    startX = e.touches[0].clientX; startY = e.touches[0].clientY;
  }, { passive: true });
  box.addEventListener('touchend', function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    var dy = e.changedTouches[0].clientY - startY;
    startX = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) show(current + (dx < 0 ? 1 : -1));
  });
})();
