(() => {
  'use strict';
  const apiOrigin = document.querySelector('meta[name="api-origin"]')?.content || '';
  const q = (selector, root = document) => root.querySelector(selector);
  const qa = (selector, root = document) => [...root.querySelectorAll(selector)];
  const motionReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const text = (tag, value, className) => {
    const element = document.createElement(tag);
    element.textContent = value;
    if (className) element.className = className;
    return element;
  };

  // Include the new collections in the existing quick navigation.
  sections.push(
    { id: 'education', name: 'Two degrees, a continuing education', description: 'Computer science, from the foundations to CSU Channel Islands', word: 'Education', tags: 'bachelors bachelor masters master degree csuci campus silhouette university' },
    { id: 'sports', name: 'Sports & allegiances', description: 'Max, Kimi, Red Bull, and Sunrisers Hyderabad', word: 'Sports', tags: 'max verstappen kimi antonelli world champion championships trophies trophy red bull srh 2016 2024 2026 cricket ipl' },
    { id: 'route', name: 'California, connected', description: 'Fourteen places from LAX to Fremont', word: 'Places', tags: 'map route atlas travel malibu oxnard camarillo ventura santa barbara lake cachuma solvang pismo beach san luis obispo paso robles big sur golden gate bridge fremont' },
    { id: 'books', name: 'The bookshelf', description: 'Bullseye, The Art of Witty Banter, and The Subtle Art', word: 'Books', tags: 'bookshelf reading patterson ledwidge patrick king mark manson book recommendation suggestions' },
    { id: 'beef', name: 'The beef section', description: 'Twelve opinion questions, vote meters, and anonymous notes', word: 'Beef', tags: 'quiz pick a side agree disagree linkedin voice notes youtube fries beach mountains remote hybrid subscriptions dating taco roast anonymous disagreement suggestion comment feedback board notes' }
  );

  // The atlas uses real positions; the line connects memories, not road instructions.
  const places = [
    { name: 'LAX', lon: -118.4085, lat: 33.9416, region: 'THE ARRIVAL', description: 'The arrival point. Where the California chapter begins, a long way from where the story started.', label: [15, 24] },
    { name: 'Malibu', lon: -118.7798, lat: 34.0259, region: 'THE PACIFIC COAST', description: 'A familiar name that became a place on my own map. One of the coastal stops in this California chapter.', label: [-3, -19] },
    { name: 'Oxnard', lon: -119.1771, lat: 34.1975, region: 'VENTURA COUNTY', description: 'Part of the stretch of California I have come to know around Camarillo. A small connection in the bigger map.' },
    { name: 'Camarillo', lon: -119.0376, lat: 34.2164, region: 'THE PLACE I CALL HOME NOW', description: 'My base in California. The everyday chapter among all the places I have visited, and the place this website comes back to.' },
    { name: 'Ventura', lon: -119.2945, lat: 34.2805, region: 'VENTURA COUNTY', description: 'Another place close to home, connecting the everyday part of California with the coast farther north.' },
    { name: 'Santa Barbara', lon: -119.6982, lat: 34.4208, region: 'THE CENTRAL COAST', description: 'One of the places in this growing collection of California stops. A point on the map with room for its own photographs and memories.', label: [-12, 28] },
    { name: 'Lake Cachuma', lon: -119.9256, lat: 34.5811, region: 'SANTA YNEZ VALLEY', description: 'A turn inland from the coast. The lake is part of the thread connecting Santa Barbara, the valley, and the roads north.' },
    { name: 'Solvang', lon: -120.1376, lat: 34.5958, region: 'SANTA YNEZ VALLEY', description: 'The valley chapter of this route. One more stop that makes this map a little more personal than a line between two cities.' },
    { name: 'Pismo Beach', lon: -120.6413, lat: 35.1428, region: 'SAN LUIS OBISPO COUNTY', description: 'Back toward the water. A coastal stop between the Santa Ynez Valley and San Luis Obispo.' },
    { name: 'San Luis Obispo', lon: -120.6596, lat: 35.2828, region: 'THE CENTRAL COAST', description: 'Another piece of the Central Coast, with the journey continuing both inland and along the Pacific.', label: [15, 7] },
    { name: 'Paso Robles', lon: -120.6910, lat: 35.6266, region: 'INLAND CALIFORNIA', description: 'A turn away from the immediate coastline. Part of the inland stretch before the map finds its way back toward Big Sur.' },
    { name: 'Big Sur', lon: -121.8081, lat: 36.2704, region: 'WHERE LAND MEETS THE PACIFIC', description: 'A name that belongs to the California coast. One of the places I wanted to keep connected to the rest of my story here.', label: [16, 6] },
    { name: 'Golden Gate Bridge', lon: -122.4783, lat: 37.8199, region: 'SAN FRANCISCO BAY', description: 'The Golden Gate is a landmark in California and a landmark on my own map, before the thread turns toward the East Bay.', label: [-5, -19] },
    { name: 'Fremont', lon: -121.9886, lat: 37.5483, region: 'THE EAST BAY', description: 'The last stop on this particular line. A connection in the Bay Area, and another place in a California chapter that is still unfolding.', label: [16, 6] }
  ];
  const map = q('#california-map');
  const svgNamespace = 'http://www.w3.org/2000/svg';
  const svg = (tag, attributes = {}) => {
    const node = document.createElementNS(svgNamespace, tag);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, String(value)));
    return node;
  };
  const project = (lon, lat) => [(lon + 123.8) * 118, (38.4 - lat) * 158 + 40];
  const routePoints = places.map(place => project(place.lon, place.lat));
  const routePath = routePoints.map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
  q('#route-line').setAttribute('d', routePath);
  q('#route-line-shadow').setAttribute('d', routePath);
  let selectedPlace = 0;
  let tracing = false;
  let traceTimer;
  const markerButtons = [];
  const stopButtons = [];

  function stopTracing() {
    tracing = false;
    clearTimeout(traceTimer);
    q('#trace-route').replaceChildren(text('span', '▷'), document.createTextNode(' Trace the route'));
    q('#trace-route').setAttribute('aria-pressed', 'false');
  }
  function selectPlace(index, fromTrace = false) {
    if (!fromTrace) stopTracing();
    selectedPlace = (index + places.length) % places.length;
    const place = places[selectedPlace];
    q('#stop-region').textContent = place.region;
    q('#stop-name').textContent = place.name;
    q('#stop-description').textContent = place.description;
    q('#stop-count').textContent = `${selectedPlace + 1} of ${places.length} places`;
    markerButtons.forEach((marker, i) => {
      const selected = i === selectedPlace;
      marker.classList.toggle('selected', selected);
      marker.setAttribute('aria-pressed', String(selected));
      const label = marker.querySelector('text');
      if (label) label.classList.toggle('selected', selected);
    });
    stopButtons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === selectedPlace)));
  }

  places.forEach((place, index) => {
    const [x, y] = routePoints[index];
    const marker = svg('g', { class: 'map-marker', transform: `translate(${x} ${y})`, role: 'button', tabindex: '0', 'aria-label': `Explore ${place.name}`, 'aria-pressed': String(index === 0) });
    marker.append(svg('circle', { r: 19, class: 'marker-hit' }), svg('circle', { r: 13, class: 'marker-ring' }), svg('circle', { r: 4.5, class: 'marker-dot' }));
    if (place.label) {
      const label = svg('text', { x: place.label[0], y: place.label[1], class: 'map-label' });
      label.textContent = place.name;
      marker.append(label);
    }
    marker.addEventListener('click', () => selectPlace(index));
    marker.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectPlace(index); }
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); markerButtons[(index + 1) % places.length].focus(); selectPlace(index + 1); }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); markerButtons[(index - 1 + places.length) % places.length].focus(); selectPlace(index - 1); }
    });
    q('#map-markers').append(marker);
    markerButtons.push(marker);
    const button = text('button', place.name);
    button.type = 'button';
    button.setAttribute('aria-pressed', String(index === 0));
    button.addEventListener('click', () => selectPlace(index));
    q('#route-stops').append(button);
    stopButtons.push(button);
  });
  q('#previous-stop').addEventListener('click', () => selectPlace(selectedPlace - 1));
  q('#next-stop').addEventListener('click', () => selectPlace(selectedPlace + 1));
  q('#trace-route').addEventListener('click', () => {
    if (tracing) { stopTracing(); return; }
    tracing = true;
    q('#trace-route').replaceChildren(text('span', 'Ⅱ'), document.createTextNode(' Pause the route'));
    q('#trace-route').setAttribute('aria-pressed', 'true');
    let index = 0;
    const advance = () => {
      selectPlace(index, true);
      if (index === places.length - 1) { stopTracing(); return; }
      index += 1;
      traceTimer = setTimeout(advance, motionReduced ? 350 : 720);
    };
    advance();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopTracing(); });
  fetch('assets/california.json')
    .then(response => { if (!response.ok) throw new Error('Map unavailable'); return response.json(); })
    .then(geometry => {
      const rings = geometry.type === 'Feature' ? geometry.geometry.coordinates : geometry.coordinates;
      const path = rings.map(ring => ring.map(([lon, lat], index) => {
        const [x, y] = project(lon, lat);
        return `${index ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`;
      }).join(' ') + 'Z').join(' ');
      q('#map-geography').append(svg('path', { d: path, class: 'map-land-shape' }));
    })
    .catch(() => {
      const note = q('.map-bottom>span');
      note.textContent = 'The boundary is unavailable. All places and connections still work.';
    });
  selectPlace(0);

  // Covers float on a dark field; opening a book supplies the context.
  const books = {
    bullseye: {
      title: 'Bullseye', author: 'James Patterson & Michael Ledwidge', category: 'A CHANGE OF PACE', cover: 'assets/book-bullseye.jpg',
      description: 'A Michael Bennett thriller that brings an international threat to New York City. A change of pace from the books about habits, ideas, and the way we live.',
      note: 'Sometimes the point is simply to turn the next page.',
      source: 'https://www.jamespatterson.com/titles/james-patterson/bullseye/9780316407199/'
    },
    banter: {
      title: 'The Art of Witty Banter', author: 'Patrick King', category: 'BETTER CONVERSATIONS', cover: 'assets/book-banter.jpg',
      description: 'A book about the give-and-take of conversation: listening, thinking on your feet, and finding the lighter moments in a conversation.',
      note: 'A little less overthinking. A little more being present.',
      source: 'https://books.google.com/books?id=M6z3DwAAQBAJ'
    },
    subtle: {
      title: 'The Subtle Art of Not Giving a F*ck', author: 'Mark Manson', category: 'CHOOSING WHAT MATTERS', cover: 'assets/book-subtle-front.jpg',
      description: 'A direct, sometimes uncomfortable look at choosing what deserves your time and energy, and accepting that a meaningful life comes with problems of its own.',
      note: 'A reminder to be more deliberate about what gets my attention.',
      source: 'https://markmanson.net/books/subtle-art'
    }
  };
  qa('[data-book]').forEach(button => {
    button.addEventListener('click', () => {
      const book = books[button.dataset.book];
      q('#book-detail-cover').src = book.cover;
      q('#book-detail-cover').alt = `${book.title} book cover`;
      q('#book-detail-title').textContent = book.title;
      q('#book-detail-author').textContent = book.author;
      q('#book-detail-category').textContent = book.category;
      q('#book-detail-description').textContent = book.description;
      q('#book-detail-note').textContent = book.note;
      q('#book-detail-source').href = book.source;
      q('#book-dialog').showModal();
    });
  });

  // Notes are stored server-side without name, email, account ID, or IP fields.
  const sectionNames = { story: 'My story', education: 'Education', interests: 'Interests', sports: 'Sports & allegiances', route: 'California map', books: 'The bookshelf', frames: 'Photo journal', memories: 'Memories', now: 'Right now', beef: 'The beef section' };
  const kindNames = { suggestion: 'A SUGGESTION', disagree: 'A DIFFERENT TAKE', roast: 'A LITTLE FRIENDLY FIRE' };
  const noteDialog = q('#note-dialog');
  const noteForm = q('#note-form');
  let boardKind = 'all';
  let boardNotes = [];
  let nextCursor = null;
  let requestSerial = 0;
  let posting = false;
  const relativeDate = value => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));

  function openNote(section = 'beef', kind = 'suggestion') {
    noteForm.reset();
    q('#note-section').value = section;
    q('#note-kind').value = kind;
    q('#note-character-count').textContent = '0';
    q('#note-form-error').textContent = '';
    noteDialog.showModal();
    q('#note-body').focus();
  }
  qa('[data-note-section]').forEach(button => {
    button.addEventListener('click', () => openNote(button.dataset.noteSection, button.dataset.noteKind));
  });
  q('#book-recommend').addEventListener('click', () => {
    q('#book-dialog').close();
    openNote('books', 'suggestion');
  });
  Object.keys(sectionNames).filter(id => id !== 'beef').forEach(id => {
    const section = q(`#${id}`);
    if (!section) return;
    const footer = document.createElement('div');
    footer.className = 'section-conversation';
    footer.append(text('span', id === 'books' ? 'Something else belongs on this shelf?' : 'There’s room for another point of view.'));
    const actions = document.createElement('div');
    [['suggestion', 'Suggest something'], ['disagree', 'A different take'], ['roast', 'A little roast']].forEach(([kind, label]) => {
      const button = text('button', label);
      button.type = 'button';
      button.setAttribute('aria-label', `${label} about ${sectionNames[id]}`);
      button.addEventListener('click', () => openNote(id, kind));
      actions.append(button);
    });
    footer.append(actions);
    const target = section.classList.contains('section-shell') ? section : q(':scope > .section-shell', section) || section;
    const closing = q('.closing-note', target);
    if (closing) target.insertBefore(footer, closing);
    else target.append(footer);
  });

  function renderBoard() {
    const board = q('#note-board');
    board.replaceChildren();
    if (!boardNotes.length) {
      const empty = text('p', '', 'board-empty');
      empty.append(text('strong', boardKind === 'all' ? 'The notebook is open.' : 'An open page.'), document.createTextNode(boardKind === 'all' ? 'A book recommendation, a different take, or the first roast. There’s room for your words here.' : 'No notes in this collection yet. A different point of view is welcome.'));
      board.append(empty);
    }
    boardNotes.forEach(note => {
      const article = document.createElement('article');
      article.className = 'anonymous-note';
      const top = document.createElement('div');
      top.className = 'note-topline';
      top.append(text('span', kindNames[note.kind] || 'A NOTE', `note-kind-label kind-${note.kind}`), text('span', sectionNames[note.section] || 'The journal', 'note-section-label'));
      const body = text('p', note.body);
      const byline = document.createElement('div');
      byline.className = 'note-byline';
      const author = text('span', 'Anonymous');
      const icon = document.createElementNS(svgNamespace, 'svg');
      icon.setAttribute('viewBox', '0 0 24 24');
      icon.setAttribute('aria-hidden', 'true');
      icon.append(svg('circle', { cx: 12, cy: 8, r: 3 }), svg('path', { d: 'M5 21v-2a7 7 0 0 1 14 0v2' }));
      author.prepend(icon);
      const date = text('time', relativeDate(note.createdAt));
      date.dateTime = new Date(note.createdAt).toISOString();
      byline.append(author, date);
      article.append(top, body, byline);
      board.append(article);
    });
    q('#more-notes').hidden = !nextCursor;
    updateProgress();
  }
  async function loadNotes(reset = true) {
    const serial = ++requestSerial;
    const moreButton = q('#more-notes');
    moreButton.disabled = true;
    const params = new URLSearchParams();
    if (boardKind !== 'all') params.set('kind', boardKind);
    if (!reset && nextCursor) params.set('before', String(nextCursor));
    if (reset) {
      const loading = text('p', 'Opening the notebook…', 'board-loading');
      q('#note-board').replaceChildren(loading);
      moreButton.hidden = true;
    }
    try {
      const response = await fetch(apiOrigin + `/api/feedback${params.size ? `?${params}` : ''}`, { headers: { Accept: 'application/json' }, cache: 'no-store' });
      if (!response.ok) throw new Error('The notebook could not be opened.');
      const payload = await response.json();
      if (!Array.isArray(payload.notes)) throw new Error('Invalid response');
      if (serial !== requestSerial) return;
      const incoming = payload.notes.filter(note => typeof note.body === 'string' && typeof note.id === 'string' && Number.isFinite(note.createdAt));
      boardNotes = reset ? incoming : [...boardNotes, ...incoming.filter(note => !boardNotes.some(existing => existing.id === note.id))];
      nextCursor = payload.next;
      renderBoard();
    } catch (error) {
      if (serial !== requestSerial) return;
      if (reset) {
        const message = text('div', 'The notebook could not be loaded. Your words deserve a place to stay; please try again.', 'board-error');
        const retry = text('button', 'Try again', 'button button-outline');
        retry.type = 'button';
        retry.addEventListener('click', () => loadNotes());
        message.append(retry);
        q('#note-board').replaceChildren(message);
      } else toast('More notes could not be loaded. Please try again.');
    } finally {
      if (serial === requestSerial) moreButton.disabled = false;
    }
  }
  qa('[data-board-filter]').forEach(button => {
    button.addEventListener('click', () => {
      boardKind = button.dataset.boardFilter;
      qa('[data-board-filter]').forEach(item => {
        item.classList.toggle('active', item === button);
        item.setAttribute('aria-pressed', String(item === button));
      });
      nextCursor = null;
      loadNotes();
    });
  });
  q('#more-notes').addEventListener('click', () => loadNotes(false));
  q('#note-body').addEventListener('input', () => {
    q('#note-character-count').textContent = String(q('#note-body').value.length);
    q('#note-form-error').textContent = '';
  });
  noteForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (posting) return;
    const body = q('#note-body').value.trim();
    const error = q('#note-form-error');
    if (body.length < 3 || body.length > 1000) { error.textContent = 'Write between 3 and 1,000 characters.'; return; }
    posting = true;
    const post = q('#post-note');
    post.disabled = true;
    post.textContent = 'Keeping your words…';
    error.textContent = '';
    try {
      const response = await fetch(apiOrigin + '/api/feedback', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ section: q('#note-section').value, kind: q('#note-kind').value, body, website: q('#note-website').value })
      });
      let payload;
      try { payload = await response.json(); } catch { throw new Error('Your note could not be saved. Keep this window open and try again.'); }
      if (!response.ok) throw new Error(payload.error || 'Your note could not be saved. Please try again.');
      noteDialog.close();
      toast('Your words are on the board. Posted as Anonymous.');
      boardKind = 'all';
      qa('[data-board-filter]').forEach(button => {
        const active = button.dataset.boardFilter === 'all';
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      await loadNotes();
    } catch (failure) {
      error.textContent = failure.message || 'Your note could not be saved. Please try again.';
    } finally {
      posting = false;
      post.disabled = false;
      post.textContent = 'Post anonymously';
    }
  });
  loadNotes();
})();
