// Quick sanity check, no browser: loads the app's plain scripts into one vm
// context and checks the math engine.
// Run from the repo root: node tests/check.js
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = process.argv[2] || path.join(__dirname, '..');
const files = ['js/engine.js'];
const code = files.map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n;\n')
    + '\n;globalThis.__x = { ENGINE };';
const ctx = vm.createContext({ console });
vm.runInContext(code, ctx);
const { ENGINE } = ctx.__x;

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
console.log(problems ? `\n${problems} PROBLEM(S)` : '\nall good');
process.exit(problems ? 1 : 0);
