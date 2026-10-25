/*
 * UI — screens, the question card and the on-screen number pad.
 *
 * One question at a time, answered by tapping: on a small phone the
 * system keyboard covered half the page and "check on blur" confused
 * a six-year-old. The pad is always in the same place, under the card.
 */

const UI = (() => {

    const MAX_DIGITS = 3;
    const WEAK_MIN = 3;
    const STICKER_MIN_ROUND = 6;  // a two-sum practice round doesn't earn a sticker           // the "tricky ones" card needs a few to be worth it
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

    let screen = 'home';

    function show(name){
        screen = name;
        ['home', 'quiz', 'end'].forEach(s => $('screen-' + s).classList.toggle('hidden', s !== name));
        els.btnBack.classList.toggle('hidden', name === 'home');
        paintBrand();
        window.scrollTo(0, 0);
    }

    /* ---------------- copy ---------------- */

    /* the long name doesn't fit next to the Menu button on a small phone */
    function paintBrand(){
        els.brand.textContent = I18N.t(screen === 'home' ? 'brand' : 'brandShort');
    }

    function paintStatic(){
        paintBrand();
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

    /* the levels as a winding road that ends at a castle. Nothing is
       locked — she can tap any stop — the glow only suggests the next one
       (the first without two stars). */
    const PATH_STARS = 2;

    function paintPath(){
        const bests = CONTENT.LEVELS.map(l => STORAGE.getBest(l.id));
        const nextIndex = bests.findIndex(b => !b || b.stars < PATH_STARS);

        const stops = CONTENT.LEVELS.map((level, i) => {
            const best = bests[i];
            const done = best && best.stars >= PATH_STARS;
            const classes = ['stop', i % 2 ? 'stop-right' : 'stop-left'];
            if(done) classes.push('stop-done');
            if(i === nextIndex) classes.push('stop-next');
            return `<button class="${classes.join(' ')}" data-level="${level.id}">
                <span class="stop-bubble">${level.icon}</span>
                <span class="stop-text">
                    <span class="stop-name">${name(level.name)}</span>
                    <span class="stop-sub">${name(level.sub)}</span>
                    <span class="stop-stars">${best ? renderStars(best.stars) : ''}</span>
                    ${i === nextIndex ? `<span class="stop-here">${I18N.t('pathHere')}</span>` : ''}
                </span>
            </button>`;
        }).join('');

        const reached = nextIndex === -1;
        const castle = `<div class="castle ${reached ? 'castle-reached' : ''}">
            <span class="castle-icon">🏰</span>
            <span class="castle-text">${I18N.t(reached ? 'castle' : 'castleLocked')}</span>
        </div>`;

        els.levelPath.innerHTML = stops + castle;
    }

    function paintHome(){
        els.levelGrid.innerHTML = levelCard(CONTENT.MIX, 'card-featured');
        paintPath();

        const owned = STORAGE.getStickers().length;
        els.btnAlbum.textContent = I18N.t('album', { n: owned, total: CONTENT.STICKERS.length });

        const weak = STORAGE.weakFacts();
        els.btnWeak.classList.toggle('hidden', weak.length < WEAK_MIN);
        els.weakSub.textContent = I18N.t('weakSub', { n: weak.length });

        els.countOptions.innerHTML = CONTENT.COUNTS.map(n =>
            `<button data-count="${n}" class="${n === state.count ? 'selected' : ''}">${n}</button>`
        ).join('');
    }

    /* ---------------- sticker album ---------------- */

    function paintAlbum(){
        const owned = STORAGE.getStickers();
        const total = CONTENT.STICKERS.length;
        els.albumHint.textContent = owned.length >= total
            ? I18N.t('albumFull')
            : I18N.t('albumHint', { n: owned.length, total });
        els.albumGrid.innerHTML = CONTENT.STICKERS.map(sticker =>
            owned.includes(sticker)
                ? `<span class="album-slot album-owned">${sticker}</span>`
                : `<span class="album-slot album-empty">?</span>`
        ).join('');
    }

    function openAlbum(){
        paintAlbum();
        els.albumBackdrop.classList.remove('hidden');
    }

    function closeAlbum(){
        els.albumBackdrop.classList.add('hidden');
    }

    /* two or three stars earn the next sticker she doesn't have yet */
    function awardSticker(stars){
        if(stars < 2) return null;
        const owned = STORAGE.getStickers();
        const left = CONTENT.STICKERS.filter(s => !owned.includes(s));
        if(!left.length) return null;
        const sticker = left[Math.floor(Math.random() * left.length)];
        STORAGE.addSticker(sticker);
        return sticker;
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
        paintHome();
    }

    /* everything drawn by hand has to be redrawn after a language switch */
    function repaintCopy(){
        paintStatic();
        paintHome();
        paintWarnings();
        if(!$('screen-quiz').classList.contains('hidden') && current()){
            els.progressText.textContent = I18N.t('progress', { n: state.index + 1, total: state.questions.length });
            paintStreak();
            paintInstruction(current());
            const story = els.prompt.querySelector('.story-text');
            if(story) story.textContent = storyText(current());
            paintFeedback();
        }
        if(!$('screen-end').classList.contains('hidden')) paintEnd();
        if(!els.scoresBackdrop.classList.contains('hidden')) paintScores();
        if(!els.albumBackdrop.classList.contains('hidden')) paintAlbum();
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
        if(source.kind === 'review') return ENGINE.reviewSession(source.facts);
        if(source.kind === 'weak') return ENGINE.reviewSession(ENGINE.shuffle(STORAGE.weakFacts()).slice(0, state.count));
        return ENGINE.buildSession({ level: CONTENT.levelById(source.levelId), count: state.count });
    }

    function start(source){
        state.source = source;
        state.questions = buildQuestions(source);
        state.index = 0;
        state.firstTry = 0;
        state.streak = 0;
        state.missed = [];
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
        setProgress(state.index / total);
        paintStreak();
    }

    function setProgress(ratio){
        const percent = Math.round(ratio * 100);
        els.progressFill.style.width = percent + '%';
        els.runner.style.left = `calc(${percent}% - ${percent / 100 * 26}px)`;
    }

    /* right on the first try, several in a row: a small flame, never a
       penalty — a miss just quietly resets it */
    const STREAK_SHOW = 3;

    function paintStreak(){
        const show = state.streak >= STREAK_SHOW;
        els.streak.classList.toggle('hidden', !show);
        if(show) els.streak.textContent = I18N.t('streak', { n: state.streak });
    }

    function paintInstruction(q){
        els.instruction.textContent = I18N.t('instr_' + q.type);
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

    const BOX = '<span class="answer-box" id="answerBox"></span>';
    const HINT = '<div class="hint hidden" id="hint"></div>';

    /* question types answered on the number pad */
    const PAD_TYPES = ['keypad', 'sequence', 'story'];

    /* how each type draws its prompt; the options (if any) come from the
       engine and are drawn the same way for every type */
    const PROMPTS = {
        keypad: (q) => exprHtml(q.fact, BOX, q.vertical),
        choose: (q) => exprHtml(q.fact, BOX, q.vertical),

        // 5 + 3 = 9 ✔/✘ — the claimed result sits in a plain box
        truefalse: (q) => exprHtml(q.fact, `<span class="claim-box">${q.shown}</span>`, q.vertical),

        // 10, 20, 30, ? — one bead per number, the gap is the box
        sequence: (q) => `<div class="seq">${q.seq.map((v, i) =>
            i === q.blank ? BOX : `<span class="seq-num">${v}</span>`
        ).join('')}</div>`,

        // "There are 4 kids and each gets 2 sweets…" plus a small picture
        story: (q) => {
            const f = q.fact;
            const holder = CONTENT.STORY_HOLDERS[q.holder];
            const item = CONTENT.STORY_ITEMS[q.item];
            let picture;
            if(f.op === '*') picture = `<span class="story-row">${holder.icon.repeat(f.a)}</span><span class="story-each">1 ${holder.icon} → ${item.icon.repeat(f.b)}</span>`;
            else if(f.op === '/') picture = `<span class="story-row">${item.icon.repeat(f.a)}</span><span class="story-row">${holder.icon.repeat(f.b)}</span>`;
            else picture = `<span class="story-row">${item.icon.repeat(f.a)}</span>`;
            return `<p class="story-text">${storyText(q)}</p>
                <div class="story-body">
                    <div class="story-picture" id="storyPicture">${picture}</div>
                    <span class="story-equals">=</span>${BOX}
                </div>`;
        },

        // tens as bars, ones as dots
        count: (q) => HINTS.countBlocks(q.n),

        // 7 + 2 ◯ 8
        compare: (q) => {
            const f = q.fact;
            return `<div class="expr"><span class="num">${f.a}</span><span class="op">${ENGINE.symbol(f.op)}</span><span class="num">${f.b}</span>
                <span class="compare-slot" id="compareSlot">?</span><span class="num">${q.other}</span></div>`;
        },

        // 3 + ? = 7: the box takes the place of the hidden number
        missing: (q) => {
            const f = q.fact;
            const a = q.hide === 'a' ? BOX : `<span class="num">${f.a}</span>`;
            const b = q.hide === 'b' ? BOX : `<span class="num">${f.b}</span>`;
            return `<div class="expr">${a}<span class="op">${ENGINE.symbol(f.op)}</span>${b}<span class="op">=</span><span class="num">${f.result}</span></div>`;
        },
    };

    function storyText(q){
        const lang = I18N.getLang();
        const f = q.fact;
        const holder = CONTENT.STORY_HOLDERS[q.holder];
        const item = CONTENT.STORY_ITEMS[q.item];
        const template = CONTENT.STORIES[f.op][lang] || CONTENT.STORIES[f.op].es;
        const howMany = item.g === 'f' ? 'cuántas' : 'cuántos';
        return template
            .replace(/\{a\}/g, f.a)
            .replace(/\{b\}/g, f.b)
            .replace(/\{holders\}/g, holder[lang] || holder.es)
            .replace(/\{items\}/g, item[lang] || item.es)
            .replace(/\{each\}/g, holder.g === 'f' ? 'cada una' : 'cada uno')
            .replace(/\{HowMany\}/g, howMany[0].toUpperCase() + howMany.slice(1));
    }

    function optionHtml(o, i){
        const caption = o.value === true ? I18N.t('yes') : o.value === false ? I18N.t('no')
            : o.value === '>' ? I18N.t('bigger') : o.value === '<' ? I18N.t('smaller') : o.value === '=' ? I18N.t('same') : '';
        return `<button class="option ${o.className || ''}" data-index="${i}">${o.label}${caption ? `<small>${caption}</small>` : ''}</button>`;
    }

    function renderQuestion(){
        const q = current();
        state.tries = 0;
        state.typed = '';
        state.locked = false;

        paintProgress();
        paintInstruction(q);
        setFeedback(null);

        els.prompt.innerHTML = PROMPTS[q.type](q) + HINT;
        els.options.innerHTML = (q.options || []).map(optionHtml).join('');
        els.options.dataset.count = (q.options || []).length;
        els.keypad.classList.toggle('hidden', !PAD_TYPES.includes(q.type));
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
        if(value === q.answer){
            onRight(q);
            return;
        }
        shake($('answerBox'));
        if(onWrong(q)) return;
        state.typed = '';
        paintTyped();
    }

    function chooseOption(button){
        if(state.locked || button.disabled) return;
        const q = current();
        const option = q.options[Number(button.dataset.index)];

        if(option.isCorrect){
            button.classList.add('option-correct');
            onRight(q);
            return;
        }
        button.classList.add('option-wrong');
        button.disabled = true;
        onWrong(q);
    }

    /* the line under the card; remembered so a language switch can
       redraw it */
    let feedback = null;

    function setFeedback(key, vars, className){
        feedback = key ? { key, vars, className } : null;
        paintFeedback();
    }

    function paintFeedback(){
        els.feedback.textContent = feedback ? I18N.t(feedback.key, feedback.vars) : '';
        els.feedback.className = 'quiz-feedback ' + (feedback ? feedback.className : '');
    }

    function bump(el){
        if(!el) return;
        el.classList.remove('bump');
        void el.offsetWidth;
        el.classList.add('bump');
    }

    function shake(el){
        if(!el) return;
        el.classList.remove('wrong');
        void el.offsetWidth; // restart the shake animation
        el.classList.add('wrong');
    }

    function onRight(q){
        state.locked = true;
        if(state.tries === 0) state.firstTry++;
        state.streak = state.tries === 0 ? state.streak + 1 : 0;
        paintStreak();
        if(state.tries === 0 && state.streak >= STREAK_SHOW) bump(els.streak);
        STORAGE.recordFact(q.fact, state.tries === 0);
        if(state.tries > 0 && q.fact.op) state.missed.push(q.fact);
        const box = $('answerBox');
        if(box){
            state.typed = String(q.answer);
            paintTyped();
            box.classList.add('right');
            bump(box);
        }
        // a wrong claim gets corrected on screen: 5 + 3 = ~~9~~ 8
        const claim = els.prompt.querySelector('.claim-box');
        if(claim && q.type === 'truefalse'){
            claim.classList.add('right');
            if(!q.answer) claim.innerHTML = `<s>${q.shown}</s> ${q.fact.result}`;
        }
        const slot = $('compareSlot');
        if(slot){
            slot.textContent = q.answer;
            slot.classList.add('right');
        }
        AUDIO.correct();
        setFeedback('correct', null, 'feedback-good');
        setTimeout(next, NEXT_DELAY);
    }

    /* returns true when the question is over (answer revealed) */
    function onWrong(q){
        state.tries++;
        AUDIO.wrong();

        const left = (q.options || []).filter(o => !o.isCorrect).length;
        const outOfTries = q.options ? state.tries >= left : state.tries >= MAX_TRIES;

        state.streak = 0;
        paintStreak();

        if(outOfTries && !q.options){
            state.locked = true;
            STORAGE.recordFact(q.fact, false);
            if(q.fact.op) state.missed.push(q.fact);
            state.typed = String(q.answer);
            paintTyped();
            $('answerBox').classList.add('revealed');
            setFeedback('revealed', { answer: q.answer }, 'feedback-retry');
            setTimeout(next, REVEAL_DELAY);
            return true;
        }

        showHint(q);
        setFeedback('tryAgain', null, 'feedback-retry');
        return false;
    }

    /* ---------------- sound ---------------- */

    function spokenText(q){
        const f = q.fact;
        if(q.type === 'count') return I18N.t('instr_count');
        if(q.type === 'story') return storyText(q);
        if(q.type === 'sequence'){
            return q.seq.map((v, i) => i === q.blank ? I18N.t('whatNumber') : v).join(', ') + '. ' + I18N.t('instr_sequence');
        }
        const op = I18N.t('ops')[f.op];
        if(q.type === 'compare'){
            return I18N.t('compareSpoken', { a: f.a, op, b: f.b, c: q.other });
        }
        if(q.type === 'truefalse'){
            return I18N.t('isItTrue', { a: f.a, op, b: f.b, c: q.shown });
        }
        if(q.type === 'missing'){
            const blank = I18N.t('whatNumber');
            return `${q.hide === 'a' ? blank : f.a} ${op} ${q.hide === 'b' ? blank : f.b} ${I18N.t('equals')} ${f.result}`;
        }
        return I18N.t('howMuchIs', { a: f.a, op, b: f.b });
    }

    function speakCurrent(){
        const q = current();
        if(q) AUDIO.speak(spokenText(q), I18N.getLang());
    }

    let musicWanted = false;

    function paintToggles(){
        els.btnSounds.classList.toggle('on', AUDIO.isEnabled());
        els.btnSounds.setAttribute('aria-pressed', AUDIO.isEnabled());
        els.btnMusic.classList.toggle('on', musicWanted);
        els.btnMusic.setAttribute('aria-pressed', musicWanted);
    }

    /* calm bed for concentrating — off until someone turns it on, and
       remembered; browsers only start audio from a tap, so a saved "on"
       waits for her first tap */
    function toggleMusic(){
        musicWanted = !musicWanted;
        STORAGE.setSetting('music', musicWanted);
        if(musicWanted) MUSIC.start(); else MUSIC.stop();
        paintToggles();
    }

    function toggleSounds(){
        AUDIO.setEnabled(!AUDIO.isEnabled());
        STORAGE.setSetting('sounds', AUDIO.isEnabled());
        paintToggles();
        AUDIO.correct();
    }

    /* after a miss, draw the sum so she can count it */
    function showHint(q){
        // a story's picture turns into the counting drawing, in place,
        // so the number pad stays on screen
        const picture = $('storyPicture');
        if(picture){
            if(!picture.classList.contains('hinted')){
                picture.innerHTML = HINTS.forQuestion(q);
                picture.classList.add('hinted');
            }
            return;
        }
        const hint = $('hint');
        if(!hint || !hint.classList.contains('hidden')) return;
        hint.innerHTML = HINTS.forQuestion(q);
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
        els.endSticker.classList.toggle('hidden', !r.sticker);
        if(r.sticker){
            els.endSticker.innerHTML = `<span class="end-sticker-icon">${r.sticker}</span><span>${I18N.t('newSticker')}</span>`;
        }
        els.btnPracticeMissed.classList.toggle('hidden', !state.missed.length);
        els.btnPracticeMissed.textContent = I18N.t('practiceMissed', { n: state.missed.length });
        if(r.isNewBest) els.endBest.textContent = I18N.t('newBest');
        else if(r.best) els.endBest.textContent = I18N.t('yourBest', { correct: r.best.correct, total: r.best.total });
        else els.endBest.textContent = '';
    }

    function finish(){
        const total = state.questions.length;
        const stars = ENGINE.starsFor(state.firstTry, total);
        const levelId = state.source.kind === 'level' ? state.source.levelId : null;

        state.result = { stars, correct: state.firstTry, total, isNewBest: false, best: null, sticker: total >= STICKER_MIN_ROUND ? awardSticker(stars) : null };
        if(levelId){
            state.result.isNewBest = STORAGE.saveBest(levelId, stars, state.firstTry, total);
            state.result.best = STORAGE.getBest(levelId);
        }

        setProgress(1);
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
        els.brand = $('brand');
        els.streak = $('streak');
        els.runner = $('progressRunner');
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
        els.btnWeak = $('btnWeak');
        els.levelPath = $('levelPath');
        els.btnAlbum = $('btnAlbum');
        els.albumBackdrop = $('albumBackdrop');
        els.albumGrid = $('albumGrid');
        els.albumHint = $('albumHint');
        els.endSticker = $('endSticker');
        els.weakSub = $('weakSub');
        els.btnPracticeMissed = $('btnPracticeMissed');
        els.endScore = $('endScore');
        els.confetti = $('confetti');
        els.btnSounds = $('btnSounds');
        els.btnSpeak = $('btnSpeak');
        els.btnMusic = $('btnMusic');

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
        document.addEventListener('pointerdown', () => {
            AUDIO.unlock();
            if(musicWanted && !document.hidden) MUSIC.start();
        }, { once: true });

        musicWanted = STORAGE.getSetting('music', false);
        els.btnMusic.addEventListener('click', toggleMusic);

        // no music from a phone in a pocket
        document.addEventListener('visibilitychange', () => {
            if(document.hidden) MUSIC.stop();
            else if(musicWanted && AUDIO.context() && AUDIO.context().state !== 'suspended') MUSIC.start();
        });

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

        els.options.addEventListener('click', (e) => {
            const b = e.target.closest('.option');
            if(b) chooseOption(b);
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
        els.btnAlbum.addEventListener('click', openAlbum);
        $('btnCloseAlbum').addEventListener('click', closeAlbum);
        els.albumBackdrop.addEventListener('click', (e) => {
            if(e.target === els.albumBackdrop) closeAlbum();
        });
        els.levelPath.addEventListener('click', (e) => {
            const stop = e.target.closest('[data-level]');
            if(stop) start({ kind: 'level', levelId: stop.dataset.level });
        });
        els.btnWeak.addEventListener('click', () => start({ kind: 'weak' }));
        // the review never touches the best score: it is extra practice
        els.btnPracticeMissed.addEventListener('click', () => start({ kind: 'review', facts: [...state.missed] }));
        $('btnCloseScores').addEventListener('click', closeScores);
        els.btnResetScores.addEventListener('click', resetScores);
        els.scoresBackdrop.addEventListener('click', (e) => {
            if(e.target === els.scoresBackdrop) closeScores();
        });
        $('btnRetry').addEventListener('click', () => start(state.source));

        $('appVersion').textContent = 'v' + CONTENT.VERSION;
        paintStatic();
        paintHome();
        paintToggles();
        show('home');
    }

    return { init, current };
})();
