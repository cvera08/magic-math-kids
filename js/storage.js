/*
 * STORAGE — tiny localStorage wrapper, wrapped in try/catch so private
 * browsing (which throws on write) never breaks the game — the same
 * guard english-ldk and memory-ldk use.
 */

const STORAGE = (() => {

    const SETTINGS_KEY = 'math-ldk-settings';

    function read(key, fallback){
        try{
            const value = JSON.parse(localStorage.getItem(key));
            return value === null ? fallback : value;
        }catch(e){
            return fallback;
        }
    }

    function write(key, value){
        try{
            localStorage.setItem(key, JSON.stringify(value));
        }catch(e){
            /* ignore — private mode or storage disabled */
        }
    }

    /* language, the homework box text, sound switches… */
    function getSetting(name, fallback){
        const all = read(SETTINGS_KEY, {});
        return name in all ? all[name] : fallback;
    }

    function setSetting(name, value){
        const all = read(SETTINGS_KEY, {});
        all[name] = value;
        write(SETTINGS_KEY, all);
    }

    /* ---------- best score per level ---------- */

    const BEST_KEY = 'math-ldk-best-scores';

    function getBest(levelId){
        return read(BEST_KEY, {})[levelId] || null;
    }

    /* more stars wins; with the same stars, more right answers wins */
    function saveBest(levelId, stars, correct, total){
        const all = read(BEST_KEY, {});
        const current = all[levelId];
        if(!current || stars > current.stars ||
           (stars === current.stars && correct > current.correct)){
            all[levelId] = { stars, correct, total };
            write(BEST_KEY, all);
            return true;
        }
        return false;
    }

    /* ---------- per-fact memory: what she keeps getting wrong ----------
       { "7+8": { a, op, b, gen, m: first-try misses, s: first-try hits in a row } }
       A fact "costs her" while it has been missed and hasn't yet been got
       right twice in a row on the first try — then it graduates off the
       list, and comes back if she misses it again. Same rule as
       english-ldk's "Lo que más le cuesta". */

    const FACTS_KEY = 'math-ldk-fact-stats';

    function recordFact(f, firstTry){
        if(!f || !f.op) return; // sequences and block counts aren't facts
        const all = read(FACTS_KEY, {});
        const current = all[f.key] || { a: f.a, op: f.op, b: f.b, gen: f.gen, m: 0, s: 0 };
        if(firstTry){
            current.s += 1;
        }else{
            current.m += 1;
            current.s = 0;
        }
        all[f.key] = current;
        write(FACTS_KEY, all);
    }

    function weakFacts(){
        const all = read(FACTS_KEY, {});
        return Object.keys(all)
            .filter(key => all[key].m > 0 && all[key].s < 2)
            .map(key => all[key]);
    }

    function resetScores(){
        try{
            localStorage.removeItem(BEST_KEY);
            localStorage.removeItem(FACTS_KEY);
        }catch(e){
            /* ignore */
        }
    }

    return { read, write, getSetting, setSetting, getBest, saveBest, resetScores, recordFact, weakFacts };
})();
