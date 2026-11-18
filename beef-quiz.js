(() => {
  'use strict';
  const apiOrigin = document.querySelector('meta[name="api-origin"]')?.content || '';
  const root = document.getElementById('beef-quiz');
  if (!root) return;
  const storageKey = 'yasin-beef-quiz-v1';
  const allowedChoices = new Set(['a', 'b', 'skip']);
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  let questions = [];
  let counts = {};
  let state = { started: false, progress: 0, receipts: {} };
  let index = 0;
  let phase = 'intro';
  let reviewing = false;
  let saving = false;
  let error = '';
  let storageWorks = true;
  const node = (tag, className, content) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content !== undefined) element.textContent = content;
    return element;
  };
  const button = (label, className, handler) => {
    const element = node('button', className, label);
    element.type = 'button';
    element.addEventListener('click', handler);
    return element;
  };
  const own = question => state.receipts[question.id]?.choice;
  const score = () => questions.reduce((result, question) => {
    const answer = own(question);
    if (answer === 'skip') result.skips++;
    else if (answer === 'a' || answer === 'b') result.picks++;
    return result;
  }, { picks: 0, skips: 0 });
  const repaintProgress = () => { if (typeof updateProgress === 'function') updateProgress(); };
  function saveState() {
    try { localStorage.setItem(storageKey, JSON.stringify(state)); }
    catch { storageWorks = false; }
  }
  function readState() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (!saved || typeof saved !== 'object') return;
      const receipts = {};
      questions.forEach(question => {
        const receipt = saved.receipts?.[question.id];
        if (receipt && uuidPattern.test(receipt.id) && (receipt.choice === null || allowedChoices.has(receipt.choice))) {
          receipts[question.id] = { id: receipt.id, choice: receipt.choice };
        }
      });
      const progress = Number.isInteger(saved.progress) ? Math.max(0, Math.min(questions.length, saved.progress)) : 0;
      state = { receipts, progress, started: saved.started === true };
    } catch { storageWorks = false; }
  }
  function focusQuestion() {
    const heading = root.querySelector('h3');
    if (!heading) return;
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  }
  function frame() {
    root.replaceChildren();
    root.setAttribute('aria-busy', String(saving));
    const top = node('div', 'quiz-topline');
    const label = phase === 'summary' ? 'YOUR BEEF REPORT' : phase === 'intro' ? 'THE PICK-A-SIDE QUIZ' : `BEEF ${String(index + 1).padStart(2, '0')} OF ${questions.length}`;
    top.append(node('span', 'quiz-kicker', label), node('span', 'quiz-anonymous', 'NO NAMES. JUST TAKES.'));
    root.append(top);
    const progress = node('div', 'quiz-progress');
    const completed = Math.min(questions.length, state.progress + ((phase === 'result' && !reviewing) ? 1 : 0));
    progress.setAttribute('role', 'progressbar');
    progress.setAttribute('aria-label', 'Beefs completed');
    progress.setAttribute('aria-valuemin', '0');
    progress.setAttribute('aria-valuemax', String(questions.length));
    progress.setAttribute('aria-valuenow', String(phase === 'summary' ? questions.length : completed));
    questions.forEach((question, i) => {
      const segment = node('span', i < completed ? 'done' : '');
      if (i === index && (phase === 'question' || phase === 'result')) segment.classList.add('current');
      progress.append(segment);
    });
    root.append(progress);
    return root;
  }
  function meter(question, compact = false) {
    const tally = counts[question.id] || { a: 0, b: 0, skip: 0 };
    const a = Math.max(0, Number(tally.a) || 0);
    const b = Math.max(0, Number(tally.b) || 0);
    const skips = Math.max(0, Number(tally.skip) || 0);
    const total = a + b;
    const aPercent = total ? Math.round(a / total * 100) : 0;
    const bPercent = total ? 100 - aPercent : 0;
    const wrapper = node('div', `quiz-meter${compact ? ' compact' : ''}`);
    if (!compact) wrapper.append(node('p', 'quiz-meter-title', 'THE ANONYMOUS VOTE SPLIT'));
    const labels = node('div', 'quiz-meter-labels');
    const left = node('span', 'quiz-meter-a');
    const right = node('span', 'quiz-meter-b');
    left.append(node('strong', '', total ? `${aPercent}%` : '—'), document.createTextNode(` ${question.a.title}`));
    right.append(document.createTextNode(`${question.b.title} `), node('strong', '', total ? `${bPercent}%` : '—'));
    labels.append(left, right);
    const bar = node('div', 'quiz-meter-bar');
    bar.setAttribute('role', 'img');
    bar.setAttribute('aria-label', total ? `${question.a.title}: ${aPercent} percent, ${question.b.title}: ${bPercent} percent. ${total} votes, ${skips} skips.` : `No side has received a vote yet. ${skips} skips.`);
    const first = node('span', 'meter-side-a');
    const second = node('span', 'meter-side-b');
    first.style.width = `${aPercent}%`;
    second.style.width = `${bPercent}%`;
    bar.append(first, second);
    wrapper.append(labels, bar);
    wrapper.append(node('p', 'quiz-meter-count', `${total ? `${total} ${total === 1 ? 'side picked' : 'sides picked'}` : 'Waiting for the first side'} · ${skips} ${skips === 1 ? 'skip' : 'skips'}`));
    return wrapper;
  }
  function renderIntro() {
    phase = 'intro';
    frame();
    const intro = node('div', 'quiz-intro');
    const emblem = node('div', 'quiz-emblem');
    emblem.setAttribute('aria-hidden', 'true');
    emblem.append(node('span', 'emblem-a', 'A'), node('span', 'emblem-vs', 'vs.'), node('span', 'emblem-b', 'B'));
    intro.append(emblem, node('p', 'quiz-category', `${questions.length} DEBATES · A SMALL TEST OF YOUR TAKES`), node('h3', '', 'We should probably argue about this.'), node('p', 'quiz-intro-copy', 'LinkedIn humble-brags. Voice-note podcasts. Animal Style fries. Pick your side, see the anonymous vote split, and find out where the beef is.'));
    intro.append(button(state.started && state.progress > 0 ? 'Continue the beef' : 'Start the beef', 'button button-light quiz-start', () => {
      state.started = true;
      index = Math.min(state.progress, questions.length - 1);
      reviewing = false;
      phase = own(questions[index]) ? 'result' : 'question';
      saveState();
      renderQuestion(true);
    }));
    intro.append(node('p', 'quiz-intro-aside', 'You can skip. The Skip button will have something to say about it.'));
    root.append(intro);
    root.append(node('p', 'quiz-privacy', storageWorks ? 'No name or email. Your place is remembered in this browser; the vote split is shared.' : 'Your votes save to the shared meter. This browser won’t remember your place after you leave.'));
    repaintProgress();
  }
  function renderQuestion(focus = false) {
    const question = questions[index];
    frame();
    const body = node('div', 'quiz-question');
    body.append(node('p', 'quiz-category', `${question.category.toUpperCase()} · ${question.title}`), node('h3', 'quiz-prompt', question.prompt), node('p', 'quiz-setup', question.setup));
    const choices = node('div', 'quiz-choices');
    choices.setAttribute('role', 'group');
    choices.setAttribute('aria-label', 'Choose your side');
    ['a', 'b'].forEach(side => {
      const option = question[side];
      const selected = phase === 'result' && own(question) === side;
      const card = button('', `quiz-choice quiz-choice-${side}${selected ? ' chosen' : ''}`, () => castVote(side));
      card.disabled = saving || phase === 'result';
      card.setAttribute('aria-pressed', String(selected));
      card.setAttribute('aria-label', `Choose ${option.title}`);
      const top = node('span', 'choice-top');
      top.append(node('span', '', `SIDE ${side.toUpperCase()}`), node('span', 'choice-mark', selected ? '✓' : '+'));
      card.append(top, node('span', 'choice-title', option.title));
      if (option.detail) card.append(node('span', 'choice-detail', option.detail));
      card.append(node('span', 'choice-hint', option.hint));
      choices.append(card);
    });
    body.append(choices);
    if (phase === 'result') {
      const skipped = own(question) === 'skip';
      const outcome = node('div', skipped ? 'quiz-outcome quiz-taunt' : 'quiz-outcome');
      outcome.setAttribute('role', 'status');
      outcome.append(node('span', 'outcome-label', skipped ? 'THE SKIP BUTTON HAS ENTERED THE CHAT' : 'YOUR PICK IS IN'));
      outcome.append(node('p', '', skipped ? question.taunt : `${question[own(question)].title}. Consider your side picked.`));
      body.append(outcome, meter(question));
      const actions = node('div', 'quiz-result-actions');
      actions.append(button('Change my pick', 'quiz-quiet-button', () => { phase = 'question'; error = ''; renderQuestion(true); }));
      actions.append(button(reviewing ? 'Back to my report' : index === questions.length - 1 ? 'See my beef report' : 'Next beef', 'button button-light', () => {
        if (reviewing) { renderSummary(true); return; }
        state.progress = index + 1;
        saveState();
        if (state.progress >= questions.length) renderSummary(true);
        else { index++; phase = own(questions[index]) ? 'result' : 'question'; error = ''; renderQuestion(true); }
      }));
      body.append(actions);
    } else {
      const actions = node('div', 'quiz-pick-actions');
      const skip = button('Skip. I’m staying out of this.', 'quiz-skip', () => castVote('skip'));
      skip.disabled = saving;
      actions.append(skip, node('span', 'quiz-saving', saving ? 'Saving your side…' : `${score().picks} picks · ${score().skips} dodges so far`));
      body.append(actions);
      if (error) {
        const message = node('p', 'quiz-error', error);
        message.setAttribute('role', 'alert');
        body.append(message);
      }
    }
    root.append(body);
    root.append(node('p', 'quiz-privacy', 'Anonymous votes. Skips stay outside the vote percentages. Changing a pick updates your existing vote.'));
    repaintProgress();
    if (focus) focusQuestion();
  }
  async function castVote(choice) {
    if (saving || phase === 'result') return;
    const question = questions[index];
    if (!state.receipts[question.id]) state.receipts[question.id] = { id: crypto.randomUUID(), choice: null };
    saveState();
    const ballotId = state.receipts[question.id].id;
    saving = true;
    error = '';
    renderQuestion();
    try {
      const response = await fetch(apiOrigin + '/api/beef', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ questionId: question.id, choice, ballotId })
      });
      let payload;
      try { payload = await response.json(); }
      catch { throw new Error('Your pick couldn’t be saved. Please reload and try again.'); }
      if (!response.ok || !payload.counts) throw new Error(payload.error || 'Your pick couldn’t be saved. Try again.');
      state.receipts[question.id].choice = choice;
      counts[question.id] = payload.counts;
      saveState();
      phase = 'result';
    } catch (failure) {
      error = failure instanceof TypeError ? 'Your pick couldn’t reach the meter. Check your connection and try again.' : failure.message || 'Your pick couldn’t be saved. Try again.';
      phase = 'question';
    } finally {
      saving = false;
      renderQuestion();
    }
  }
  function renderSummary(focus = false) {
    phase = 'summary';
    reviewing = false;
    frame();
    const tally = score();
    const header = node('div', 'quiz-summary-header');
    header.append(node('p', 'quiz-category', 'THE TAKES HAVE BEEN TAKEN'), node('h3', '', tally.skips ? 'Some sides picked. Some artful dodging.' : 'Twelve takes. Zero fence-sitting.'), node('p', 'quiz-summary-description', `You picked a side on ${tally.picks} of ${questions.length} beefs and skipped ${tally.skips}. Your name stayed out of all of them.`));
    const metrics = node('div', 'quiz-summary-metrics');
    [['PICKS', tally.picks], ['DODGES', tally.skips], ['BEEFS SURVIVED', questions.length]].forEach(([label, value]) => {
      const metric = node('div', '');
      metric.append(node('strong', '', String(value)), node('span', '', label));
      metrics.append(metric);
    });
    header.append(metrics);
    root.append(header);
    const list = node('div', 'quiz-summary-list');
    questions.forEach((question, questionIndex) => {
      const answer = own(question);
      const card = node('article', 'quiz-summary-item');
      card.append(node('p', 'quiz-summary-title', `${String(questionIndex + 1).padStart(2, '0')} · ${question.title}`), node('h4', '', answer === 'skip' ? 'You skipped this one.' : `Your pick: ${question[answer]?.title || 'Not answered'}`));
      if (answer === 'skip') card.append(node('p', 'summary-taunt', question.taunt));
      card.append(meter(question, true));
      card.append(button('Revisit this beef', 'quiz-quiet-button', () => { index = questionIndex; reviewing = true; phase = 'result'; renderQuestion(true); }));
      list.append(card);
    });
    root.append(list);
    root.append(node('p', 'quiz-privacy', 'Revisit a beef to change your pick. Your saved response updates on the shared meter.'));
    repaintProgress();
    if (focus) focusQuestion();
  }
  async function loadQuiz() {
    root.replaceChildren(node('p', 'quiz-loading', 'Opening the beef…'));
    try {
      const response = await fetch(apiOrigin + '/api/beef', { headers: { Accept: 'application/json' }, cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok || !Array.isArray(payload.questions) || !payload.questions.length) throw new Error('The quiz couldn’t be opened.');
      questions = payload.questions;
      counts = payload.stats || {};
      readState();
      index = Math.min(state.progress, questions.length - 1);
      if (state.progress === questions.length) renderSummary();
      else if (state.started) { phase = own(questions[index]) ? 'result' : 'question'; renderQuestion(); }
      else renderIntro();
    } catch {
      const panel = node('div', 'quiz-unavailable');
      panel.append(node('h3', '', 'The beef is taking a breather.'), node('p', '', 'The questions and vote meter couldn’t be loaded. Try again in a moment.'), button('Try again', 'button button-light', loadQuiz));
      root.replaceChildren(panel);
    }
  }
  loadQuiz();
})();
