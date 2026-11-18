'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Section navigation and reading progress.
const menuButton = $('.menu-trigger');
const mobileNav = $('#mobile-nav');
function closeMenu() {
  mobileNav.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open navigation');
}
menuButton.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') === 'true';
  mobileNav.hidden = expanded;
  menuButton.setAttribute('aria-expanded', String(!expanded));
  menuButton.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
});
$$('a', mobileNav).forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeMenu();
});
document.addEventListener('click', event => {
  if (!mobileNav.hidden && !mobileNav.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
});
window.matchMedia('(min-width: 761px)').addEventListener('change', event => {
  if (event.matches) closeMenu();
});

const navLinks = $$('.desktop-nav a');
let scrollQueued = false;
function updateProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  $('.reading-progress').style.width = `${max > 0 ? Math.min(100, window.scrollY / max * 100) : 0}%`;
  const current = $$('main > section[id]').filter(section => section.getBoundingClientRect().top < window.innerHeight * .4).at(-1);
  navLinks.forEach(link => {
    const active = current && link.hash === `#${current.id}`;
    link.classList.toggle('active', Boolean(active));
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  scrollQueued = false;
}
window.addEventListener('scroll', () => {
  if (!scrollQueued) {
    scrollQueued = true;
    requestAnimationFrame(updateProgress);
  }
}, { passive: true });
window.addEventListener('resize', updateProgress);
updateProgress();
$('#year').textContent = new Date().getFullYear();

if ('IntersectionObserver' in window && !reduceMotion) {
  document.documentElement.classList.add('can-animate');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -35px 0px', threshold: .06 });
  $$('.reveal').forEach(element => observer.observe(element));
}

if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
  const stage = $('.portrait-stage');
  stage.addEventListener('pointermove', event => {
    const box = stage.getBoundingClientRect();
    stage.style.setProperty('--pointer-x', `${((event.clientX - box.left) / box.width - .5) * 9}px`);
    stage.style.setProperty('--pointer-y', `${((event.clientY - box.top) / box.height - .5) * 6}px`);
  });
  stage.addEventListener('pointerleave', () => {
    stage.style.setProperty('--pointer-x', '0px');
    stage.style.setProperty('--pointer-y', '0px');
  });
}

// Accessible chapter tabs support arrows, Home, and End.
function connectTabs(buttonSelector, valueKey, panelPrefix) {
  const buttons = $$(buttonSelector);
  function select(button, focus = false) {
    buttons.forEach(item => {
      const selected = item === button;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      $(`#${panelPrefix}${item.dataset[valueKey]}`).hidden = !selected;
    });
    if (focus) button.focus();
    updateProgress();
  }
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => select(button));
    button.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % buttons.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + buttons.length) % buttons.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = buttons.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        select(buttons[next], true);
      }
    });
  });
}
connectTabs('[data-chapter]', 'chapter', 'chapter-');
connectTabs('[data-memory]', 'memory', 'memory-');

$$('.interest').forEach(detail => {
  detail.addEventListener('toggle', () => {
    if (detail.open) $$('.interest').forEach(other => {
      if (other !== detail) other.open = false;
    });
    updateProgress();
  });
});

// Native modal dialogs preserve focus and support Escape.
$$('[data-close]').forEach(button => {
  button.addEventListener('click', () => $(`#${button.dataset.close}`).close());
});
$$('dialog').forEach(dialog => {
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
});

const sections = [
  { id: 'home', name: 'The beginning', description: 'An introduction to Yasin', word: 'Welcome', tags: 'home life introduction welcome' },
  { id: 'story', name: 'My story', description: 'Warangal, California, and becoming', word: 'About', tags: 'about education university csuci computer science roots india biography' },
  { id: 'interests', name: 'Things that pull me in', description: 'Formula 1, books, photographs, and curiosity', word: 'Interests', tags: 'hobbies f1 red bull formula racing photography reading travel technology' },
  { id: 'frames', name: 'The photo journal', description: 'Places and quiet moments', word: 'Frames', tags: 'photos images gallery camera upload pictures collection memories' },
  { id: 'memories', name: 'A few chapters', description: 'The moments that give the story its shape', word: 'Memories', tags: 'timeline move india america us graduation university california malibu san francisco fremont' },
  { id: 'now', name: 'Right now', description: 'A small update from this chapter', word: 'Now', tags: 'current present latest reading learning camarillo' }
];
const searchDialog = $('#search-dialog');
const searchInput = $('#section-search');
function renderSearch() {
  const query = searchInput.value.trim().toLowerCase();
  const matches = sections
    .filter(item => `${item.name} ${item.description} ${item.word} ${item.tags}`.toLowerCase().includes(query))
    .sort((a, b) => Number(b.word.toLowerCase() === query) - Number(a.word.toLowerCase() === query));
  const target = $('#search-results');
  target.replaceChildren();
  matches.forEach(item => {
    const link = document.createElement('a');
    link.className = 'search-result';
    link.href = `#${item.id}`;
    const info = document.createElement('span');
    info.append(document.createTextNode(item.name));
    const description = document.createElement('small');
    description.textContent = item.description;
    info.append(description);
    const label = document.createElement('span');
    label.textContent = item.word;
    link.append(info, label);
    link.addEventListener('click', () => {
      searchDialog.close();
      requestAnimationFrame(() => {
        const section = $(`#${item.id}`);
        section.setAttribute('tabindex', '-1');
        section.focus({ preventScroll: true });
      });
    });
    target.append(link);
  });
  if (!matches.length) {
    const empty = document.createElement('p');
    empty.className = 'search-empty';
    empty.textContent = 'No matching section. Try “photos”, “story”, or “Formula 1”.';
    target.append(empty);
  }
}
function openSearch() {
  closeMenu();
  searchInput.value = '';
  renderSearch();
  searchDialog.showModal();
  searchInput.focus();
}
$('.search-trigger').addEventListener('click', openSearch);
searchInput.addEventListener('input', renderSearch);
searchInput.addEventListener('keydown', event => {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    $('.search-result')?.focus();
  }
  if (event.key === 'Enter') {
    const match = $('.search-result');
    if (match) { event.preventDefault(); match.click(); }
  }
});
document.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    if (searchDialog.open) searchDialog.close();
    else if (!document.querySelector('dialog[open]')) openSearch();
  }
});

// Sample photographs are clearly separated from the owner's browser-local collection.
const samples = [
  { id: 'sample-coast', title: 'Where the day slows down', place: 'A study in coastal light', category: 'places', src: 'assets/coast.jpg', alt: 'Sunlit ocean and coastline, a sample photograph', description: 'A sample frame to set the mood for this journal. Your own photograph and the story behind it can take its place.', sample: true },
  { id: 'sample-city', title: 'Another perspective', place: 'A study in city & colour', category: 'places', src: 'assets/city.jpg', alt: 'The Golden Gate Bridge in San Francisco, a sample photograph', description: 'A reference image for the places collection. This space is made for the views you have seen and the pictures you have taken.', sample: true },
  { id: 'sample-quiet', title: 'A little room to breathe', place: 'A study in stillness', category: 'quiet', src: 'assets/quiet.jpg', alt: 'Mountain peaks beneath an open sky, a sample photograph', description: 'A sample photograph for the quieter moments: a detail, a landscape, or a little pause in an ordinary day.', sample: true }
];
let personalPhotos = [];
let currentFilter = 'all';
let lightboxIndex = 0;
let collectionError = false;
const objectURLs = new Map();
const categoryNames = { places: 'Places', quiet: 'Quiet moments' };

function allPhotos() { return [...personalPhotos, ...samples]; }
function filteredPhotos() {
  return allPhotos().filter(photo => currentFilter === 'all' || (currentFilter === 'mine' ? !photo.sample : photo.category === currentFilter));
}
function makeText(tag, text, className = '') {
  const element = document.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  return element;
}
function renderGallery() {
  const grid = $('#photo-grid');
  const photos = filteredPhotos();
  grid.replaceChildren();
  grid.hidden = photos.length === 0;
  $('#empty-gallery').hidden = photos.length !== 0;
  const emptyTitle = $('#empty-gallery h3');
  const emptyText = $('#empty-gallery p');
  emptyTitle.textContent = currentFilter === 'mine' ? 'Your own moments, right here.' : 'A moment worth keeping.';
  emptyText.textContent = collectionError ? 'This browser could not open the saved collection. Your photographs have not been removed. Try refreshing or allowing browser storage.' : 'Add your first photograph, give it a title, and write a little about why it matters.';
  photos.forEach((photo, index) => {
    const figure = document.createElement('figure');
    figure.className = 'photo-card';
    const open = document.createElement('button');
    open.className = 'photo-open';
    open.type = 'button';
    open.setAttribute('aria-label', `View ${photo.title}${photo.sample ? ', sample photograph' : ''}`);
    const image = document.createElement('img');
    image.src = photo.src;
    image.alt = photo.alt || photo.title;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.width = 700;
    image.height = 900;
    const zoom = document.createElement('span');
    zoom.className = 'photo-zoom';
    zoom.setAttribute('aria-hidden', 'true');
    zoom.innerHTML = '<svg viewBox="0 0 24 24"><path d="M14 3h7v7M10 21H3v-7M21 3l-7 7M3 21l7-7"/></svg>';
    open.append(image, zoom);
    if (photo.sample) open.append(makeText('span', 'SAMPLE FRAME', 'photo-sample'));
    open.addEventListener('click', () => openPhoto(index));
    const caption = document.createElement('figcaption');
    const text = document.createElement('div');
    text.append(makeText('h3', photo.title), makeText('p', photo.place || (photo.sample ? 'Sample photography' : 'A moment from my collection')));
    caption.append(text, makeText('span', categoryNames[photo.category].toUpperCase(), 'photo-kind'));
    figure.append(open, caption);
    grid.append(figure);
  });
  updateProgress();
}
$$('[data-filter]').forEach(button => {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    $$('[data-filter]').forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    renderGallery();
  });
});

const photoDialog = $('#photo-dialog');
function showPhoto(index) {
  const photos = filteredPhotos();
  if (!photos.length) return;
  lightboxIndex = (index + photos.length) % photos.length;
  const photo = photos[lightboxIndex];
  $('#lightbox-image').src = photo.src;
  $('#lightbox-image').alt = photo.alt || photo.title;
  $('#photo-title').textContent = photo.title;
  $('#photo-category').textContent = `${categoryNames[photo.category]}${photo.sample ? ' · sample photograph' : ' · my collection'}`;
  $('#photo-description').textContent = photo.description || photo.place || 'A moment worth keeping.';
  $('#photo-count').textContent = `${lightboxIndex + 1} / ${photos.length}`;
  $('#delete-photo').hidden = photo.sample;
  const credit = $('#photo-credit');
  credit.replaceChildren();
  if (photo.sample) {
    credit.append(document.createTextNode('Reference photography from '));
    const link = makeText('a', 'Unsplash');
    link.href = 'https://unsplash.com/';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    credit.append(link, document.createTextNode('. This is not a photograph taken by Yasin.'));
  } else {
    credit.textContent = `${photo.place ? `${photo.place} · ` : ''}Saved in this browser on this device.`;
  }
  $$('.lightbox-step').forEach(button => { button.hidden = photos.length < 2; });
}
function openPhoto(index) {
  showPhoto(index);
  photoDialog.showModal();
}
$('.lightbox-prev').addEventListener('click', () => showPhoto(lightboxIndex - 1));
$('.lightbox-next').addEventListener('click', () => showPhoto(lightboxIndex + 1));
photoDialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    showPhoto(lightboxIndex + (event.key === 'ArrowRight' ? 1 : -1));
  }
});

// IndexedDB stores uploaded image files without sending them anywhere.
let dbPromise;
function database() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open('yasin-journal', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('photos')) db.createObjectStore('photos', { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Browser storage is currently blocked.'));
    });
  }
  return dbPromise;
}
async function storageAction(mode, operation) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('photos', mode);
    const request = operation(transaction.objectStore('photos'));
    transaction.oncomplete = () => resolve(request.result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}
async function loadCollection() {
  try {
    const records = await storageAction('readonly', store => store.getAll());
    personalPhotos = records.sort((a, b) => b.created - a.created).map(record => {
      const src = URL.createObjectURL(record.file);
      objectURLs.set(record.id, src);
      return { ...record, src, sample: false };
    });
    collectionError = false;
    renderGallery();
  } catch (error) {
    collectionError = true;
    renderGallery();
  }
}

let toastTimeout;
function toast(message) {
  const element = $('.toast');
  clearTimeout(toastTimeout);
  element.textContent = message;
  element.classList.add('visible');
  toastTimeout = setTimeout(() => element.classList.remove('visible'), 4200);
}

const uploadDialog = $('#upload-dialog');
const uploadForm = $('#upload-form');
const fileInput = $('#photo-file');
$$('.add-photo').forEach(button => {
  button.addEventListener('click', () => {
    uploadForm.reset();
    $('#file-label').textContent = 'Choose a photograph';
    $('#upload-error').textContent = '';
    uploadDialog.showModal();
  });
});
fileInput.addEventListener('change', () => {
  $('#file-label').textContent = fileInput.files[0]?.name || 'Choose a photograph';
  $('#upload-error').textContent = '';
});
uploadForm.addEventListener('submit', async event => {
  event.preventDefault();
  const file = fileInput.files[0];
  const title = $('#upload-photo-title').value.trim();
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  const error = $('#upload-error');
  if (!file) { error.textContent = 'Choose a photograph first.'; return; }
  if (!allowedTypes.includes(file.type)) { error.textContent = 'Choose a JPG, PNG, WebP, or AVIF image.'; return; }
  if (file.size > 15 * 1024 * 1024) { error.textContent = 'This photograph is over 15 MB. Choose a smaller file.'; return; }
  if (!title) { error.textContent = 'Give this photograph a title.'; return; }
  const saveButton = $('#save-photo');
  saveButton.disabled = true;
  saveButton.textContent = 'Keeping your moment…';
  try {
    const record = {
      id: crypto.randomUUID(), title,
      place: $('#upload-place').value.trim(),
      category: $('#upload-category').value,
      description: $('#upload-story').value.trim(),
      alt: title,
      file,
      created: Date.now()
    };
    await storageAction('readwrite', store => store.put(record));
    const src = URL.createObjectURL(file);
    objectURLs.set(record.id, src);
    personalPhotos.unshift({ ...record, src, sample: false });
    collectionError = false;
    currentFilter = 'mine';
    $$('[data-filter]').forEach(button => {
      const active = button.dataset.filter === 'mine';
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    renderGallery();
    uploadDialog.close();
    toast('A moment kept. Saved in this browser.');
  } catch (storageError) {
    error.textContent = storageError.name === 'QuotaExceededError' ? 'This browser is out of storage. Try a smaller photograph or remove an older one.' : 'This browser could not save the photograph. Allow browser storage and try again.';
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = 'Save this moment';
  }
});

$('#delete-photo').addEventListener('click', async () => {
  const photo = filteredPhotos()[lightboxIndex];
  if (!photo || photo.sample) return;
  const button = $('#delete-photo');
  button.disabled = true;
  try {
    await storageAction('readwrite', store => store.delete(photo.id));
    personalPhotos = personalPhotos.filter(item => item.id !== photo.id);
    const url = objectURLs.get(photo.id);
    if (url) URL.revokeObjectURL(url);
    objectURLs.delete(photo.id);
    renderGallery();
    if (filteredPhotos().length) showPhoto(lightboxIndex);
    else photoDialog.close();
    toast('Photograph removed from this browser.');
  } catch (error) {
    toast('The photograph could not be removed. Try again.');
  } finally { button.disabled = false; }
});

renderGallery();
loadCollection();
