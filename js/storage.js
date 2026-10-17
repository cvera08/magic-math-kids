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

    return { read, write, getSetting, setSetting };
})();
