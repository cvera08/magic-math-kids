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
        return { type: 'keypad', fact: f, answer: f.result };
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

    function buildSession({ level, count, rng = Math.random }){
        return makeFacts(level, count, rng).map(keypadQuestion);
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

    return { symbol, solve, fact, parseOperations, homeworkSession, buildSession, GENERATORS };
})();
