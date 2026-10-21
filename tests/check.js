// Quick sanity check, no browser: loads the app's plain scripts into one vm
// context and checks the math engine.
// Run from the repo root: node tests/check.js
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = process.argv[2] || path.join(__dirname, '..');
const files = ['js/content.js', 'js/engine.js'];
const code = files.map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n;\n')
    + '\n;globalThis.__x = { CONTENT, ENGINE };';
const ctx = vm.createContext({ console });
vm.runInContext(code, ctx);
const { CONTENT, ENGINE } = ctx.__x;

let problems = 0;
const fail = (m) => { problems++; console.log('  ✗', m); };
const eq = (got, want, label) => {
    if(JSON.stringify(got) !== JSON.stringify(want)) fail(`${label}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
};

/* ---------- the free-text parser (the grown-up's box) ---------- */

const parsed = ENGINE.parseOperations('2+2\n 5 - 2 \n2*4\n3/3\n\n15 + 13\n3x4\n8÷2\n7/2\n2%3\n4//2\nhola');
eq(parsed.exercises.map(e => [e.a, e.op, e.b, e.result]),
   [[2,'+',2,4],[5,'-',2,3],[2,'*',4,8],[3,'/',3,1],[15,'+',13,28],[3,'*',4,12],[8,'/',2,4]],
   'parsed exercises');
eq(parsed.warnings.map(w => [w.key, w.line]),
   [['exactDivisions','7/2'],['invalidOperation','2%3'],['invalidOperation','4//2'],['invalidOperation','hola']],
   'parser warnings');
eq(ENGINE.parseOperations('5/0').warnings.map(w => w.key), ['exactDivisions'], 'division by zero');
eq(ENGINE.parseOperations('').exercises.length, 0, 'empty box');
eq(ENGINE.parseOperations('2-5').warnings.map(w => w.key), ['negativeResult'], 'negative result');
eq(ENGINE.homeworkSession(parsed.exercises).map(q => q.answer), [4,3,8,1,28,12,4], 'homework keeps the order');

console.log('parser ok');

/* ---------- every generated fact stays inside its level's limits ---------- */

const LIMITS = {
    sum10: f => f.op === '+' && f.a >= 1 && f.b >= 1 && f.result <= 10,
    sub10: f => f.op === '-' && f.a <= 10 && f.b >= 1 && f.result >= 1,
    sum20: f => f.op === '+' && f.result >= 11 && f.result <= 20 && f.a <= 10 && f.b <= 10,
    sub20: f => f.op === '-' && f.a >= 11 && f.a <= 20 && f.result >= 1,
    tens:  f => (f.a % 10 === 0 && f.b % 10 === 0 || f.b === 10) && f.result >= 0 && f.result <= 100,
    big:   f => f.a >= 10 && f.b >= 10 && f.result <= 99 && f.result >= 0 &&
                (f.op === '+' ? (f.a % 10 + f.b % 10 <= 9) : (f.a % 10 >= f.b % 10)),
    mul:   f => f.op === '*' && f.a >= 2 && f.b >= 2 && f.a <= 5 && f.b <= 5 && f.result <= 20,
    div:   f => f.op === '/' && f.a <= 8 && f.b >= 2 && f.b <= 4 && f.a % f.b === 0,
};

const levels = [...CONTENT.LEVELS, CONTENT.MIX];
const typeCount = {};
let tfTrue = 0, tfAll = 0;
for(const level of levels){
    for(let i = 0; i < 300; i++){
        const session = ENGINE.buildSession({ level, count: 15 });
        if(session.length !== 15) fail(`${level.id}: ${session.length} questions`);
        for(const q of session){
            const f = q.fact;
            if(f.result !== ENGINE.solve(f.a, f.op, f.b)) fail(`${level.id}: wrong result ${f.key}`);
            if(!Number.isInteger(f.result) || f.result < 0) fail(`${level.id}: bad result ${f.key}=${f.result}`);
            const gen = level.mix ? f.gen : level.gen;
            if(!LIMITS[gen](f)) fail(`${level.id}/${gen}: out of limits ${f.key}`);
            if(q.answer === undefined) fail(`${level.id}: question without an answer`);
            typeCount[q.type] = (typeCount[q.type] || 0) + 1;
            if(q.type === 'truefalse'){
                if((q.shown === f.result) !== q.answer) fail(`${level.id}: truefalse ${f.key}=${q.shown} marked ${q.answer}`);
                if(Math.abs(q.shown - f.result) > (f.result >= 20 ? 10 : 2)) fail(`${level.id}: truefalse too obvious ${f.key}=${q.shown}`);
                tfTrue += q.answer ? 1 : 0; tfAll++;
            }
            if(q.type === 'missing' && q.answer !== f[q.hide]) fail(`${level.id}: missing number ${q.answer} is not ${q.hide} of ${f.key}`);
            if(q.options){
                const right = q.options.filter(o => o.isCorrect);
                if(right.length !== 1) fail(`${level.id}/${q.type}: ${right.length} right options`);
                else if(right[0].value !== q.answer) fail(`${level.id}/${q.type}: right option is not the answer`);
                const labels = q.options.map(o => o.label);
                if(new Set(labels).size !== labels.length) fail(`${level.id}/${q.type}: duplicate options ${labels}`);
                if(q.options.some(o => o.value < 0)) fail(`${level.id}/${q.type}: negative option`);
            }
        }
    }
    console.log(`${level.id}: ok`);
}
console.log('question types seen:', typeCount);
if(tfAll && (tfTrue / tfAll < 0.4 || tfTrue / tfAll > 0.6)) fail(`true/false is lopsided: ${tfTrue}/${tfAll} true`);
console.log(problems ? `\n${problems} PROBLEM(S)` : '\nall good');
process.exit(problems ? 1 : 0);
