/*
 * CONTENT — the levels, in the order she meets them at school.
 *
 * Each level names the generator that makes its sums (see engine.js).
 * Limits come from what she does in first grade: sums and subtractions,
 * tens up to 100, two-digit sums written one above the other (15 + 13),
 * and — practised at home with sweets — small multiplications up to
 * about 5 × 4 and divisions up to 8 ÷ 2 / 8 ÷ 4, always exact.
 */

const CONTENT = (() => {

    const VERSION = '2.0';

    const LEVELS = [
        { id: 'sum10', icon: '🌸', gen: 'sum10', name: { es: 'Sumas hasta 10', en: 'Sums to 10' }, sub: { es: '3 + 4', en: '3 + 4' } },
        { id: 'sub10', icon: '🐞', gen: 'sub10', name: { es: 'Restas hasta 10', en: 'Take away to 10' }, sub: { es: '9 − 5', en: '9 − 5' } },
        { id: 'sum20', icon: '🦋', gen: 'sum20', name: { es: 'Sumas hasta 20', en: 'Sums to 20' }, sub: { es: '8 + 7', en: '8 + 7' } },
        { id: 'sub20', icon: '🐠', gen: 'sub20', name: { es: 'Restas hasta 20', en: 'Take away to 20' }, sub: { es: '20 − 7', en: '20 − 7' } },
        { id: 'tens',  icon: '🧱', gen: 'tens',  name: { es: 'Decenas', en: 'Tens' }, sub: { es: '30 + 20', en: '30 + 20' } },
        { id: 'big',   icon: '🏰', gen: 'big',   name: { es: 'Cuentas grandes', en: 'Big sums' }, sub: { es: '15 + 13', en: '15 + 13' }, vertical: true },
        { id: 'mul',   icon: '🍬', gen: 'mul',   name: { es: 'Caramelos para todos', en: 'Sweets for everyone' }, sub: { es: '4 × 2', en: '4 × 2' },
          types: ['story', 'story', 'story', 'keypad', 'choose', 'missing', 'truefalse', 'sequence'] },
        { id: 'div',   icon: '🍭', gen: 'div',   name: { es: 'Repartir caramelos', en: 'Share the sweets' }, sub: { es: '8 ÷ 2', en: '8 ÷ 2' },
          types: ['story', 'story', 'story', 'keypad', 'choose', 'missing', 'truefalse'] },
    ];

    // "a bit of everything" — the school levels weigh more than the sweets
    const MIX = { id: 'mix', icon: '🎯', name: { es: 'Mezcla de todo', en: 'A bit of everything' },
                  sub: { es: 'Un poquito de cada nivel', en: 'A little of every level' },
                  mix: ['sum10', 'sub10', 'sum20', 'sub20', 'tens', 'big', 'sum20', 'sub20', 'mul', 'div'] };

    /* ---------------- story problems ----------------
       The multiplications and divisions she practises at home are told
       as sweets shared out between kids, so the app tells them the same
       way. g = Spanish gender, for "cada uno / cada una", "cuántos /
       cuántas". */

    const STORY_HOLDERS = [
        { icon: '🧒', g: 'm', es: 'nenes', en: 'kids' },
        { icon: '👸', g: 'f', es: 'princesas', en: 'princesses' },
        { icon: '🧸', g: 'm', es: 'ositos', en: 'teddy bears' },
        { icon: '🐰', g: 'm', es: 'conejitos', en: 'bunnies' },
    ];

    const STORY_ITEMS = [
        { icon: '🍬', g: 'm', es: 'caramelos', en: 'sweets' },
        { icon: '🍭', g: 'm', es: 'chupetines', en: 'lollipops' },
        { icon: '🍪', g: 'f', es: 'galletitas', en: 'cookies' },
        { icon: '🍓', g: 'f', es: 'frutillas', en: 'strawberries' },
    ];

    /* {a} {b} numbers · {holders} {items} words · {each} cada uno/una ·
       {howMany} cuántos/cuántas (agrees with the item) */
    const STORIES = {
        '*': {
            es: 'Hay {a} {holders} y a {each} le doy {b} {items}. ¿{HowMany} {items} necesito?',
            en: 'There are {a} {holders} and each one gets {b} {items}. How many {items} do I need?',
        },
        '/': {
            es: 'Tengo {a} {items} para repartir entre {b} {holders}. ¿{HowMany} le tocan a {each}?',
            en: 'I have {a} {items} to share between {b} {holders}. How many does each one get?',
        },
        '+': {
            es: 'Tengo {a} {items} y me regalan {b} más. ¿{HowMany} tengo ahora?',
            en: 'I have {a} {items} and I get {b} more. How many do I have now?',
        },
        '-': {
            es: 'Tengo {a} {items} y me como {b}. ¿{HowMany} me quedan?',
            en: 'I have {a} {items} and I eat {b}. How many are left?',
        },
    };

    const COUNTS = [6, 10, 15];
    const DEFAULT_COUNT = 10;

    function levelById(id){
        if(id === MIX.id) return MIX;
        return LEVELS.find(l => l.id === id) || null;
    }

    return { VERSION, LEVELS, MIX, COUNTS, DEFAULT_COUNT, STORY_HOLDERS, STORY_ITEMS, STORIES, levelById };
})();
