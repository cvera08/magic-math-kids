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
        { id: 'mul',   icon: '🍬', gen: 'mul',   name: { es: 'Caramelos para todos', en: 'Sweets for everyone' }, sub: { es: '4 × 2', en: '4 × 2' } },
        { id: 'div',   icon: '🍭', gen: 'div',   name: { es: 'Repartir caramelos', en: 'Share the sweets' }, sub: { es: '8 ÷ 2', en: '8 ÷ 2' } },
    ];

    // "a bit of everything" — the school levels weigh more than the sweets
    const MIX = { id: 'mix', icon: '🎯', name: { es: 'Mezcla de todo', en: 'A bit of everything' },
                  sub: { es: 'Un poquito de cada nivel', en: 'A little of every level' },
                  mix: ['sum10', 'sub10', 'sum20', 'sub20', 'tens', 'big', 'sum20', 'sub20', 'mul', 'div'] };

    const COUNTS = [6, 10, 15];
    const DEFAULT_COUNT = 10;

    function levelById(id){
        if(id === MIX.id) return MIX;
        return LEVELS.find(l => l.id === id) || null;
    }

    return { VERSION, LEVELS, MIX, COUNTS, DEFAULT_COUNT, levelById };
})();
