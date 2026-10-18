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

    function resetScores(){
        try{
            localStorage.removeItem(BEST_KEY);
        }catch(e){
            /* ignore */
        }
    }

    return { read, write, getSetting, setSetting, getBest, saveBest, resetScores };
})();
