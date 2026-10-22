/*
 * ENGINE — pure math logic, no DOM. Kept free of window/document so it
 * runs in Node for tests/check.js, the same split english-ldk and
 * memory-ldk use.
 */

const ENGINE = (() => {

    const SYMBOLS = { '+': '+', '-': '−', '*': '×', '/': '÷' };

    function symbol(op){
        return SYMBOLS[op] || op;
    }

    function solve(a, op, b){
        switch(op){
            case '+': return a + b;
            case '-': return a - b;
            case '*': return a * b;
            case '/': return a / b;
        }
        return NaN;
    }

    /* one exercise: "a op b", its answer and a stable key ("7+8") used
       to remember which facts she keeps missing */
    function fact(a, op, b){
        return { a, op, b, result: solve(a, op, b), key: `${a}${op}${b}` };
    }

    /* A question asks about one fact. 'keypad' = type the answer on the
       on-screen number pad. */
    function keypadQuestion(f){
        return { type: 'keypad', fact: f, answer: f.result, vertical: isVertical(f) };
    }

    /* two-digit sums are written one above the other, the way she does
       them in her notebook */
    function isVertical(f){
        return f.gen === 'big' || (f.op === '+' || f.op === '-') && f.a >= 10 && f.b >= 10 && f.a % 10 + f.b % 10 > 0;
    }

    /* ---------------- generators ----------------
       Each one returns a random fact for its level. rng is injectable so
       tests can run thousands of rounds and check every limit. */

    function int(lo, hi, rng){
        return lo + Math.floor(rng() * (hi - lo + 1));
    }

    function pick(list, rng){
        return list[Math.floor(rng() * list.length)];
    }

    const GENERATORS = {
        // 3 + 4: both at least 1, total up to 10
        sum10(rng){
            const a = int(1, 9, rng);
            return fact(a, '+', int(1, 10 - a, rng));
        },
        // 9 − 5: never below zero
        sub10(rng){
            const a = int(2, 10, rng);
            return fact(a, '-', int(1, a - 1, rng));
        },
        // 8 + 7: crosses ten, total 11–20
        sum20(rng){
            const total = int(11, 20, rng);
            const a = int(Math.max(2, total - 10), Math.min(10, total - 2), rng);
            return fact(a, '+', total - a);
        },
        // 20 − 7, 15 − 8: from the teens down, answer at least 1
        sub20(rng){
            const a = int(11, 20, rng);
            return fact(a, '-', int(2, Math.min(10, a - 1), rng));
        },
        // 30 + 20, 70 − 40, 24 + 10
        tens(rng){
            const kind = int(0, 2, rng);
            if(kind === 0){
                const a = int(1, 8, rng);
                return fact(a * 10, '+', int(1, 9 - a, rng) * 10);
            }
            if(kind === 1){
                const a = int(2, 10, rng);
                return fact(a * 10, '-', int(1, a - 1, rng) * 10);
            }
            const a = int(11, 89, rng);
            if(a % 10 === 0) return fact(a, '+', 10);
            return int(0, 1, rng) ? fact(a, '+', 10) : fact(a, '-', 10);
        },
        // 15 + 13, 48 − 23: two digits, one above the other, no carrying
        // or borrowing yet — each column works on its own
        big(rng){
            if(int(0, 1, rng)){
                const ta = int(1, 7, rng), tb = int(1, 8 - ta, rng);
                const ua = int(0, 9, rng), ub = int(0, 9 - ua, rng);
                return fact(ta * 10 + ua, '+', tb * 10 + ub);
            }
            const ta = int(2, 9, rng), tb = int(1, ta - 1, rng);
            const ua = int(1, 9, rng), ub = int(0, ua, rng);
            return fact(ta * 10 + ua, '-', tb * 10 + ub);
        },
        // 4 kids × 2 sweets: factors 2–5, up to 20
        mul(rng){
            const pairs = [];
            for(let a = 2; a <= 5; a++) for(let b = 2; b <= 5; b++) if(a * b <= 20) pairs.push([a, b]);
            const [a, b] = pick(pairs, rng);
            return fact(a, '*', b);
        },
        // 8 sweets for 2 kids: exact, up to 8 ÷ 2 / 8 ÷ 4
        div(rng){
            const pairs = [];
            for(let b = 2; b <= 4; b++) for(let q = 1; b * q <= 8; q++) pairs.push([b * q, b]);
            const [a, b] = pick(pairs, rng);
            return fact(a, '/', b);
        },
    };

    /* `count` facts for a level, avoiding repeats while the level has
       enough different ones to choose from */
    function makeFacts(level, count, rng){
        const facts = [];
        const seen = new Set();
        let guard = 0;
        while(facts.length < count){
            const gen = level.mix ? pick(level.mix, rng) : level.gen;
            const f = GENERATORS[gen](rng);
            f.gen = gen;
            guard++;
            if(seen.has(f.key) && guard < count * 40) continue;
            seen.add(f.key);
            facts.push(f);
        }
        return facts;
    }

    function shuffle(list, rng = Math.random){
        const arr = [...list];
        for(let i = arr.length - 1; i > 0; i--){
            const j = Math.floor(rng() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    /* a "shuffled bag" so every question type shows up about equally
       often instead of clumping by chance — same as english-ldk */
    function makeBag(items, rng){
        let bag = [];
        return () => {
            if(bag.length === 0) bag = shuffle(items, rng);
            return bag.pop();
        };
    }

    /* believable wrong answers: one or two off, ten off for big numbers,
       or what the other operation would give (8 − 3 → 11) */
    function nearMisses(answer, f, rng){
        const pool = new Set([answer + 1, answer - 1, answer + 2, answer - 2]);
        if(answer >= 20) [answer + 10, answer - 10].forEach(v => pool.add(v));
        if(f && f.op === '+') pool.add(f.a - f.b);
        if(f && f.op === '-') pool.add(f.a + f.b);
        if(f && f.op === '*') pool.add(f.a + f.b);
        return shuffle([...pool].filter(v => v >= 0 && v !== answer), rng);
    }

    function numberOptions(answer, f, rng){
        const wrong = nearMisses(answer, f, rng).slice(0, 2);
        return shuffle([answer, ...wrong], rng)
            .map(v => ({ label: String(v), value: v, isCorrect: v === answer }));
    }

    /* question builders, one per type */
    const BUILDERS = {
        keypad: (f) => keypadQuestion(f),

        // pick the answer out of three bubbles
        choose: (f, rng) => ({ type: 'choose', fact: f, answer: f.result, options: numberOptions(f.result, f, rng) }),
    };

    BUILDERS.missing = (f, rng) => {
        // 3 + ? = 7, or ? + 4 = 7 — which side hides is random
        const hide = rng() < 0.5 ? 'a' : 'b';
        const answer = f[hide];
        const wrong = shuffle([...new Set([...nearMisses(answer, null, rng).slice(0, 3), f.result])]
            .filter(v => v !== answer && v >= 0), rng).slice(0, 2);
        return {
            type: 'missing', fact: f, hide, answer,
            options: shuffle([answer, ...wrong], rng).map(v => ({ label: String(v), value: v, isCorrect: v === answer })),
        };
    };

    /* 5 + 3 = 9 — right or wrong? A wrong claim is only one or two off
       (ten off for big numbers), so she has to actually work it out. */
    BUILDERS.truefalse = (f, rng) => {
        const isTrue = rng() < 0.5;
        let shown = f.result;
        if(!isTrue){
            const offs = f.result >= 20 ? [1, -1, 2, -2, 10, -10] : [1, -1, 1, -1, 2, -2];
            const candidates = shuffle(offs, rng).map(d => f.result + d).filter(v => v >= 0);
            shown = candidates[0];
        }
        return {
            type: 'truefalse', fact: f, shown, answer: isTrue,
            options: [
                { label: '✔', value: true, isCorrect: isTrue, className: 'option-mark option-yes' },
                { label: '✘', value: false, isCorrect: !isTrue, className: 'option-mark option-no' },
            ],
        };
    };

    /* 7 + 2 ◯ 8 — is the sum bigger, smaller or the same? The number on
       the right is close to the answer, so she has to work it out. */
    BUILDERS.compare = (f, rng) => {
        const kind = pick(['>', '<', '='], rng);
        const step = f.result >= 20 ? pick([1, 2, 10], rng) : pick([1, 1, 2], rng);
        let other = kind === '=' ? f.result : kind === '>' ? f.result - step : f.result + step;
        let answer = kind;
        if(other < 0){ other = f.result + step; answer = '<'; }
        return {
            type: 'compare', fact: f, other, answer,
            options: ['>', '<', '='].map(sym => ({ label: sym, value: sym, isCorrect: sym === answer, className: 'option-compare' })),
        };
    };

    /* 10, 20, 30, ? — counting on in steps that fit the level: ones and
       twos for small sums, backwards for take-aways, tens for the tens,
       and 2s–5s (skip counting, the root of times tables) for sweets. */
    const SEQUENCE_STEPS = {
        sum10: [1, 2], sub10: [-1, -2], sum20: [1, 2], sub20: [-1, -2],
        tens: [10], big: [5, 10, -10], mul: [2, 3, 4, 5], div: [2, 3, 4, 5],
    };

    BUILDERS.sequence = (f, rng) => {
        const step = pick(SEQUENCE_STEPS[f.gen] || [1, 2], rng);
        const length = 5;
        const span = Math.abs(step) * (length - 1);
        const size = Math.abs(step);
        const top = size >= 10 ? 100 : size >= 5 || f.gen === 'mul' || f.gen === 'div' ? 30 : 20;
        let start;
        if(step === 10) start = int(0, 9, rng) + 10 * int(0, Math.floor((top - span - 9) / 10), rng);
        else if(step === -10) start = int(span, top - 1, rng);
        else if(step > 0) start = step === 1 ? int(0, top - span, rng) : step * int(0, Math.floor((top - span) / step), rng);
        else start = int(span, top, rng);
        const seq = [];
        for(let i = 0; i < length; i++) seq.push(start + step * i);
        const blank = rng() < 0.7 ? length - 1 : int(1, length - 2, rng);
        return {
            type: 'sequence', seq, blank, step, answer: seq[blank],
            fact: { key: `seq${seq.join(',')}`, gen: f.gen },
        };
    };

    const DEFAULT_TYPES = ['keypad', 'keypad', 'choose', 'missing', 'truefalse', 'compare', 'sequence'];

    function buildQuestion(type, f, rng = Math.random){
        return BUILDERS[type](f, rng);
    }

    function buildSession({ level, count, rng = Math.random }){
        const nextType = makeBag(level.types || DEFAULT_TYPES, rng);
        return makeFacts(level, count, rng).map(f => buildQuestion(nextType(), f, rng));
    }

    /* stars from answers right on the first try — the same cut-offs as
       english-ldk, so both apps feel the same to her */
    function starsFor(firstTry, total){
        if(total === 0) return 0;
        const ratio = firstTry / total;
        if(ratio >= 0.9) return 3;
        if(ratio >= 0.6) return 2;
        return 1;
    }

    /* The grown-up's homework keeps their order — it is their list. */
    function homeworkSession(exercises){
        return exercises.map(keypadQuestion);
    }

    /* Free text, one operation per line ("15+13", "8 / 2", "3x4").
       Returns the exercises it understood, in order, and a warning per
       line it could not use — the grown-up sees those under the box. */
    function parseOperations(text){

        const exercises = [];
        const warnings = [];

        String(text || '')
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length)
            .forEach(line => {

                const clean = line
                    .replace(/\s+/g, '')
                    .replace(/[x×X]/g, '*')
                    .replace(/[÷:]/g, '/')
                    .replace(/[−–]/g, '-');

                const match = clean.match(/^(\d+)([+\-*/])(\d+)$/);

                if(!match){
                    warnings.push({ key: 'invalidOperation', line });
                    return;
                }

                const a = Number(match[1]);
                const op = match[2];
                const b = Number(match[3]);

                if(op === '/' && (b === 0 || a % b !== 0)){
                    warnings.push({ key: 'exactDivisions', line });
                    return;
                }

                // the keypad has no minus key, and first grade has no negatives
                if(op === '-' && b > a){
                    warnings.push({ key: 'negativeResult', line });
                    return;
                }

                exercises.push(fact(a, op, b));
            });

        return { exercises, warnings };
    }

    return { symbol, solve, fact, parseOperations, homeworkSession, buildSession, buildQuestion, starsFor, shuffle, GENERATORS, BUILDERS };
})();
