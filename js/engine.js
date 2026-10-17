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

    return { symbol, solve, fact, parseOperations, homeworkSession };
})();
