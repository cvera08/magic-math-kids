/*
 * UI — screens, the question card and the on-screen number pad.
 *
 * One question at a time, answered by tapping: on a small phone the
 * system keyboard covered half the page and "check on blur" confused
 * a six-year-old. The pad is always in the same place, under the card.
 */

const UI = (() => {

    const MAX_DIGITS = 3;
    const MAX_TRIES = 3;          // after the third miss we show the answer
    const NEXT_DELAY = 900;       // pause on a right answer before moving on
    const REVEAL_DELAY = 2200;    // longer, so she can read the answer

    const els = {};
    const state = {
        source: null,      // what to rebuild on "play again"
        questions: [],
        index: 0,
        tries: 0,
        typed: '',
        locked: false,
        firstTry: 0,
        count: CONTENT.DEFAULT_COUNT,
    };

    const $ = (id) => document.getElementById(id);

    /* ---------------- screens ---------------- */

    function show(name){
        ['home', 'quiz', 'end'].forEach(s => $('screen-' + s).classList.toggle('hidden', s !== name));
        els.btnBack.classList.toggle('hidden', name === 'home');
        window.scrollTo(0, 0);
    }

    /* ---------------- copy ---------------- */

    function paintStatic(){
        document.documentElement.lang = I18N.getLang();
        document.title = I18N.t('pageTitle');
        document.querySelectorAll('[data-i18n]').forEach(el => {
            el.textContent = I18N.t(el.dataset.i18n);
        });
        els.keyBack.setAttribute('aria-label', I18N.t('erase'));
        els.keyOk.setAttribute('aria-label', I18N.t('ok'));
        els.langToggle.querySelectorAll('button').forEach(b => {
            b.classList.toggle('selected', b.dataset.lang === I18N.getLang());
        });
    }

    /* ---------------- home: levels ---------------- */

    function name(obj){
        return obj[I18N.getLang()] || obj.es;
    }

    function renderStars(n){
        return [1, 2, 3].map(i =>
            `<span class="${i <= n ? 'star-filled' : 'star-empty'}">★</span>`
        ).join('');
    }

    function levelCard(level, extraClass){
        const best = STORAGE.getBest(level.id);
        const badge = best
            ? `<span class="card-badge">${renderStars(best.stars)}</span>`
            : '';
        return `<button class="card ${extraClass || ''}" data-level="${level.id}">
            ${badge}
            <span class="card-icon">${level.icon}</span>
            <span class="card-title">${name(level.name)}</span>
            <span class="card-sub">${name(level.sub)}</span>
        </button>`;
    }

    function paintHome(){
        els.levelGrid.innerHTML =
            levelCard(CONTENT.MIX, 'card-featured') +
            `<div class="level-grid">${CONTENT.LEVELS.map(l => levelCard(l)).join('')}</div>`;

        els.countOptions.innerHTML = CONTENT.COUNTS.map(n =>
            `<button data-count="${n}" class="${n === state.count ? 'selected' : ''}">${n}</button>`
        ).join('');
    }

    /* ---------------- scores ---------------- */

    let resetArmed = false;

    function paintScores(){
        els.scoresList.innerHTML = [CONTENT.MIX, ...CONTENT.LEVELS].map(level => {
            const best = STORAGE.getBest(level.id);
            const value = best
                ? `<span class="score-frac">${best.correct}/${best.total}</span>${renderStars(best.stars)}`
                : `<span class="score-empty">${I18N.t('notPlayed')}</span>`;
            return `<div class="score-row">
                <span class="score-icon">${level.icon}</span>
                <span class="score-name">${name(level.name)}</span>
                <span class="score-value">${value}</span>
            </div>`;
        }).join('');
        els.btnResetScores.textContent = I18N.t(resetArmed ? 'resetConfirm' : 'resetScores');
        els.btnResetScores.classList.toggle('armed', resetArmed);
    }

    function openScores(){
        resetArmed = false;
        paintScores();
        els.scoresBackdrop.classList.remove('hidden');
    }

    function closeScores(){
        els.scoresBackdrop.classList.add('hidden');
        paintHome();
    }

    /* two taps, so a stray tap never wipes her records */
    function resetScores(){
        if(!resetArmed){
            resetArmed = true;
            paintScores();
            return;
        }
        STORAGE.resetScores();
        resetArmed = false;
        paintScores();
    }

    /* everything drawn by hand has to be redrawn after a language switch */
    function repaintCopy(){
        paintStatic();
        paintHome();
        paintWarnings();
        if(!$('screen-quiz').classList.contains('hidden') && current()){
            paintProgress();
            paintInstruction(current());
        }
        if(!$('screen-end').classList.contains('hidden')) paintEnd();
        if(!els.scoresBackdrop.classList.contains('hidden')) paintScores();
    }

    function setLanguage(lang){
        I18N.setLang(lang);
        STORAGE.setSetting('lang', lang);
        repaintCopy();
    }

    /* ---------------- homework (the grown-up's box) ---------------- */

    let warnings = [];

    function paintWarnings(){
        els.homeworkWarnings.innerHTML = warnings.map(w => {
            const line = escapeHtml(w.line);
            if(w.key === 'invalidOperation') return `<div>⚠️ ${I18N.t('invalidOperation')}: <b>${line}</b></div>`;
            if(w.key === 'none') return `<div>${I18N.t('noExercises')}</div>`;
            return `<div>⚠️ <b>${line}</b> → ${I18N.t(w.key)}</div>`;
        }).join('');
    }

    function startHomework(){
        const text = els.homeworkText.value;
        STORAGE.setSetting('homework', text);

        const parsed = ENGINE.parseOperations(text);
        warnings = parsed.warnings;
        if(!parsed.exercises.length) warnings = [...warnings, { key: 'none', line: '' }];
        paintWarnings();
        if(!parsed.exercises.length) return;

        start({ kind: 'homework', exercises: parsed.exercises });
    }

    /* ---------------- a round ---------------- */

    function buildQuestions(source){
        if(source.kind === 'homework') return ENGINE.homeworkSession(source.exercises);
        return ENGINE.buildSession({ level: CONTENT.levelById(source.levelId), count: state.count });
    }

    function start(source){
        state.source = source;
        state.questions = buildQuestions(source);
        state.index = 0;
        state.firstTry = 0;
        CONFETTI.clear(els.confetti);
        show('quiz');
        renderQuestion();
    }

    function current(){
        return state.questions[state.index];
    }

    function paintProgress(){
        const total = state.questions.length;
        els.progressText.textContent = I18N.t('progress', { n: state.index + 1, total });
        els.progressFill.style.width = (state.index / total * 100) + '%';
    }

    function paintInstruction(){
        els.instruction.textContent = I18N.t('typeAnswer');
    }

    function exprHtml(f, slot, vertical){
        if(vertical){
            return `<div class="vexpr">
                <span></span><span class="num">${f.a}</span>
                <span class="op">${ENGINE.symbol(f.op)}</span><span class="num">${f.b}</span>
                <span class="vline"></span>
                <span></span>${slot}
            </div>`;
        }
        return `<div class="expr">
            <span class="num">${f.a}</span>
            <span class="op">${ENGINE.symbol(f.op)}</span>
            <span class="num">${f.b}</span>
            <span class="op">=</span>
            ${slot}
        </div>`;
    }

    function renderQuestion(){
        const q = current();
        state.tries = 0;
        state.typed = '';
        state.locked = false;

        paintProgress();
        paintInstruction(q);
        els.feedback.textContent = '';
        els.feedback.className = 'quiz-feedback';
        els.options.innerHTML = '';

        els.prompt.innerHTML = exprHtml(q.fact, '<span class="answer-box" id="answerBox"></span>', q.vertical)
            + '<div class="hint hidden" id="hint"></div>';
        els.keypad.classList.remove('hidden');
        paintTyped();
    }

    function paintTyped(){
        const box = $('answerBox');
        if(!box) return;
        box.textContent = state.typed || '?';
        box.classList.toggle('empty', !state.typed);
    }

    /* ---------------- answering ---------------- */

    function press(key){
        if(state.locked || els.keypad.classList.contains('hidden')) return;

        AUDIO.tap();
        if(key === 'back'){
            state.typed = state.typed.slice(0, -1);
        }else if(key === 'ok'){
            if(state.typed) submit(Number(state.typed));
            return;
        }else if(state.typed.length < MAX_DIGITS){
            state.typed = (state.typed === '0' ? '' : state.typed) + key;
        }
        paintTyped();
    }

    function submit(value){
        const q = current();
        const box = $('answerBox');

        if(value === q.answer){
            state.locked = true;
            if(state.tries === 0) state.firstTry++;
            box.classList.add('right');
            AUDIO.correct();
            els.feedback.textContent = I18N.t('correct');
            els.feedback.className = 'quiz-feedback feedback-good';
            setTimeout(next, NEXT_DELAY);
            return;
        }

        state.tries++;
        AUDIO.wrong();
        box.classList.remove('wrong');
        void box.offsetWidth; // restart the shake animation
        box.classList.add('wrong');

        if(state.tries >= MAX_TRIES){
            state.locked = true;
            state.typed = String(q.answer);
            paintTyped();
            box.classList.add('revealed');
            els.feedback.textContent = I18N.t('revealed', { answer: q.answer });
            els.feedback.className = 'quiz-feedback feedback-retry';
            setTimeout(next, REVEAL_DELAY);
            return;
        }

        state.typed = '';
        paintTyped();
        showHint(q);
        els.feedback.textContent = I18N.t('tryAgain');
        els.feedback.className = 'quiz-feedback feedback-retry';
    }

    /* ---------------- sound ---------------- */

    function spokenText(q){
        const f = q.fact;
        return I18N.t('howMuchIs', { a: f.a, op: I18N.t('ops')[f.op], b: f.b });
    }

    function speakCurrent(){
        const q = current();
        if(q) AUDIO.speak(spokenText(q), I18N.getLang());
    }

    function paintToggles(){
        els.btnSounds.classList.toggle('on', AUDIO.isEnabled());
        els.btnSounds.setAttribute('aria-pressed', AUDIO.isEnabled());
    }

    function toggleSounds(){
        AUDIO.setEnabled(!AUDIO.isEnabled());
        STORAGE.setSetting('sounds', AUDIO.isEnabled());
        paintToggles();
        AUDIO.correct();
    }

    /* after a miss, draw the sum so she can count it */
    function showHint(q){
        const hint = $('hint');
        if(!hint || !hint.classList.contains('hidden')) return;
        hint.innerHTML = HINTS.render(q.fact);
        hint.classList.remove('hidden');
    }

    function next(){
        state.index++;
        if(state.index >= state.questions.length){
            finish();
            return;
        }
        renderQuestion();
    }

    /* ---------------- end ---------------- */

    function paintEnd(){
        const r = state.result;
        els.endStars.innerHTML = renderStars(r.stars);
        els.endTitle.textContent = I18N.tAt('endTitles', r.stars);
        els.endScore.textContent = I18N.t('endScore', { correct: r.correct, total: r.total });
        if(r.isNewBest) els.endBest.textContent = I18N.t('newBest');
        else if(r.best) els.endBest.textContent = I18N.t('yourBest', { correct: r.best.correct, total: r.best.total });
        else els.endBest.textContent = '';
    }

    function finish(){
        const total = state.questions.length;
        const stars = ENGINE.starsFor(state.firstTry, total);
        const levelId = state.source.kind === 'level' ? state.source.levelId : null;

        state.result = { stars, correct: state.firstTry, total, isNewBest: false, best: null };
        if(levelId){
            state.result.isNewBest = STORAGE.saveBest(levelId, stars, state.firstTry, total);
            state.result.best = STORAGE.getBest(levelId);
        }

        els.progressFill.style.width = '100%';
        els.keypad.classList.add('hidden');
        paintEnd();
        show('end');
        CONFETTI.burst(els.confetti, 30 + stars * 20);
        AUDIO.complete();
    }

    function goHome(){
        paintHome();
        show('home');
    }

    /* ---------------- helpers ---------------- */

    function escapeHtml(text){
        return String(text).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
        }[c]));
    }

    /* ---------------- wiring ---------------- */

    function init(){
        els.btnBack = $('btnBack');
        els.langToggle = $('langToggle');
        els.levelGrid = $('levelGrid');
        els.countOptions = $('countOptions');
        els.homeworkText = $('homeworkText');
        els.homeworkWarnings = $('homeworkWarnings');
        els.progressText = $('quizProgressText');
        els.progressFill = $('quizProgressFill');
        els.instruction = $('quizInstruction');
        els.prompt = $('quizPrompt');
        els.options = $('quizOptions');
        els.feedback = $('quizFeedback');
        els.keypad = $('keypad');
        els.keyBack = $('keyBack');
        els.keyOk = $('keyOk');
        els.endStars = $('endStars');
        els.endBest = $('endBest');
        els.scoresBackdrop = $('scoresBackdrop');
        els.scoresList = $('scoresList');
        els.btnResetScores = $('btnResetScores');
        els.endTitle = $('endTitle');
        els.endScore = $('endScore');
        els.confetti = $('confetti');
        els.btnSounds = $('btnSounds');
        els.btnSpeak = $('btnSpeak');

        I18N.setLang(I18N.guess(STORAGE.getSetting('lang'), navigator.language));
        els.homeworkText.value = STORAGE.getSetting('homework', '15+13\n20-7\n4x5\n8/2');

        els.langToggle.addEventListener('click', (e) => {
            const b = e.target.closest('button');
            if(b) setLanguage(b.dataset.lang);
        });

        $('btnHomework').addEventListener('click', startHomework);

        AUDIO.setEnabled(STORAGE.getSetting('sounds', true));
        els.btnSounds.addEventListener('click', toggleSounds);
        els.btnSpeak.addEventListener('click', speakCurrent);
        els.btnSpeak.classList.toggle('hidden', !AUDIO.speechSupported);
        document.addEventListener('pointerdown', AUDIO.unlock, { once: true });

        state.count = STORAGE.getSetting('count', CONTENT.DEFAULT_COUNT);
        if(!CONTENT.COUNTS.includes(state.count)) state.count = CONTENT.DEFAULT_COUNT;

        els.levelGrid.addEventListener('click', (e) => {
            const card = e.target.closest('[data-level]');
            if(card) start({ kind: 'level', levelId: card.dataset.level });
        });

        els.countOptions.addEventListener('click', (e) => {
            const b = e.target.closest('[data-count]');
            if(!b) return;
            state.count = Number(b.dataset.count);
            STORAGE.setSetting('count', state.count);
            paintHome();
        });

        els.keypad.addEventListener('click', (e) => {
            const b = e.target.closest('button');
            if(b) press(b.dataset.key);
        });

        // a real keyboard works too, for the laptop
        document.addEventListener('keydown', (e) => {
            if($('screen-quiz').classList.contains('hidden')) return;
            if(/^[0-9]$/.test(e.key)) press(e.key);
            else if(e.key === 'Backspace') press('back');
            else if(e.key === 'Enter') press('ok');
        });

        els.btnBack.addEventListener('click', goHome);
        $('btnMenu').addEventListener('click', goHome);
        $('btnViewScores').addEventListener('click', openScores);
        $('btnCloseScores').addEventListener('click', closeScores);
        els.btnResetScores.addEventListener('click', resetScores);
        els.scoresBackdrop.addEventListener('click', (e) => {
            if(e.target === els.scoresBackdrop) closeScores();
        });
        $('btnRetry').addEventListener('click', () => start(state.source));

        paintStatic();
        paintHome();
        paintToggles();
        show('home');
    }

    return { init };
})();
