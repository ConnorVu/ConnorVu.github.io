/* Accessible project gallery carousel and image lightbox. All presentation lives in style.css. */
(() => {
  const galleries = [...document.querySelectorAll('.project-gallery')];
  const dialog = document.createElement('dialog');
  dialog.className = 'image-lightbox';
  dialog.setAttribute('aria-label', 'Image viewer');
  dialog.innerHTML = `
    <div class="image-lightbox-layout">
      <div class="image-lightbox-toolbar">
        <div class="image-lightbox-title" id="lightbox-title">Project image</div>
        <div class="image-lightbox-actions">
          <button class="lightbox-action" type="button" data-zoom aria-pressed="false" aria-label="Magnify image">⌕ Magnify</button>
          <button class="lightbox-action" type="button" data-close aria-label="Close image viewer">✕</button>
        </div>
      </div>
      <div class="lightbox-stage" data-stage tabindex="0">
        <img data-lightbox-image alt="">
      </div>
      <div class="image-lightbox-footer">
        <span data-lightbox-count>1 / 1</span>
        <span>Use arrow keys to browse · Escape to close</span>
        <div class="image-lightbox-actions">
          <button class="lightbox-action" type="button" data-prev aria-label="Previous image">←</button>
          <button class="lightbox-action" type="button" data-next aria-label="Next image">→</button>
        </div>
      </div>
    </div>`;
  document.body.append(dialog);

  const stage = dialog.querySelector('[data-stage]');
  const largeImage = dialog.querySelector('[data-lightbox-image]');
  const title = dialog.querySelector('#lightbox-title');
  const count = dialog.querySelector('[data-lightbox-count]');
  const zoomButton = dialog.querySelector('[data-zoom]');
  let activeGallery = null;
  let activeIndex = 0;

  const itemsFor = gallery => [...gallery.querySelectorAll('figure img')];
  const showZoom = enabled => {
    stage.classList.toggle('is-zoomed', enabled);
    zoomButton.setAttribute('aria-pressed', String(enabled));
    zoomButton.textContent = enabled ? '⊖ Fit' : '⌕ Magnify';
    if (enabled) {
      const ratio = largeImage.naturalWidth / Math.max(1, largeImage.naturalHeight);
      largeImage.classList.toggle('zoom-landscape', ratio >= 1);
      largeImage.classList.toggle('zoom-portrait', ratio < 1);
    } else {
      largeImage.classList.remove('zoom-landscape', 'zoom-portrait');
      stage.scrollTo({ left: 0, top: 0 });
    }
  };

  const updateLightbox = () => {
    if (!activeGallery) return;
    const images = itemsFor(activeGallery);
    const image = images[activeIndex];
    largeImage.src = image.currentSrc || image.src;
    largeImage.alt = image.alt || 'Project image';
    title.textContent = image.alt || activeGallery.closest('.project-entry')?.querySelector('h2')?.textContent || 'Project image';
    count.textContent = `${activeIndex + 1} / ${images.length}`;
    dialog.querySelector('[data-prev]').disabled = images.length < 2;
    dialog.querySelector('[data-next]').disabled = images.length < 2;
    showZoom(false);
  };

  const move = delta => {
    if (!activeGallery) return;
    const images = itemsFor(activeGallery);
    activeIndex = (activeIndex + delta + images.length) % images.length;
    updateLightbox();
  };

  galleries.forEach((gallery, galleryIndex) => {
    const figures = [...gallery.querySelectorAll('figure')];
    if (!figures.length) return;
    gallery.setAttribute('role', 'group');
    gallery.setAttribute('aria-label', `Project image gallery ${galleryIndex + 1}`);
    figures.forEach((figure, index) => {
      const image = figure.querySelector('img');
      if (!image) return;
      const open = document.createElement('button');
      open.type = 'button';
      open.className = 'gallery-image-open';
      open.setAttribute('aria-label', `Open image ${index + 1} of ${figures.length} in larger view`);
      figure.replaceChild(open, image);
      open.append(image);
      open.addEventListener('click', () => {
        activeGallery = gallery;
        activeIndex = index;
        updateLightbox();
        if (typeof dialog.showModal === 'function') dialog.showModal();
      });
    });

    const controls = document.createElement('div');
    controls.className = 'gallery-controls';
    controls.innerHTML = `
      <span class="gallery-counter" aria-live="polite">1 / ${figures.length}</span>
      <div class="gallery-control-group">
        <button class="gallery-control" type="button" data-gallery-prev aria-label="Previous gallery image">←</button>
        <button class="gallery-control" type="button" data-gallery-next aria-label="Next gallery image">→</button>
      </div>`;
    gallery.insertAdjacentElement('afterend', controls);
    const previous = controls.querySelector('[data-gallery-prev]');
    const next = controls.querySelector('[data-gallery-next]');
    const counter = controls.querySelector('.gallery-counter');
    const sync = () => {
      const width = gallery.clientWidth;
      const current = width ? Math.round(gallery.scrollLeft / (figures[0].getBoundingClientRect().width + parseFloat(getComputedStyle(gallery).gap || 0))) : 0;
      counter.textContent = `${Math.min(figures.length, current + 1)} / ${figures.length}`;
      previous.disabled = gallery.scrollLeft <= 2;
      next.disabled = gallery.scrollLeft + gallery.clientWidth >= gallery.scrollWidth - 2;
    };
    const step = direction => {
      const figure = figures[0];
      const gap = parseFloat(getComputedStyle(gallery).gap || 0);
      gallery.scrollBy({ left: direction * (figure.getBoundingClientRect().width + gap), behavior: 'smooth' });
    };
    previous.addEventListener('click', () => step(-1));
    next.addEventListener('click', () => step(1));
    gallery.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  });

  zoomButton.addEventListener('click', () => showZoom(!stage.classList.contains('is-zoomed')));
  largeImage.addEventListener('click', () => showZoom(!stage.classList.contains('is-zoomed')));
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-prev]').addEventListener('click', () => move(-1));
  dialog.querySelector('[data-next]').addEventListener('click', () => move(1));
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { activeGallery = null; showZoom(false); });
  document.addEventListener('keydown', event => {
    if (!dialog.open) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
  });
  const year = document.querySelector('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
