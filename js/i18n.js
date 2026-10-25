/*
 * I18N — Spanish and English copy. Everything the UI says comes from
 * here, so a language switch only has to re-run the painters in ui.js.
 * Spanish is the Rioplatense one she hears at home ("tocá", "elegí").
 */

const I18N = (() => {

    const STRINGS = {
        es: {
            pageTitle: 'Matemáticas LDK',
            brand: '💖 Matemáticas LDK',
            brandShort: '💖 Mate LDK',
            streak: '🔥 {n} seguidas',
            tagline: 'Aprendamos jugando 🌟',
            menu: '← Menú',

            howMany: '¿Cuántas cuentas?',
            sounds: '🔔 Sonidos',
            music: '🎵 Música',
            listen: '🔊 Escuchar',
            ops: { '+': 'más', '-': 'menos', '*': 'por', '/': 'dividido' },
            howMuchIs: '¿Cuánto es {a} {op} {b}?',
            orHomework: 'o una tarea que escribís vos',

            homeworkTitle: '📝 Tarea',
            homeworkHint: 'Escribí una cuenta por renglón: 15+13, 20-7, 4x5, 8/2',
            homeworkGo: '🪄 Armar ejercicios',
            invalidOperation: 'No entendí',
            exactDivisions: 'solo divisiones exactas',
            negativeResult: 'el resultado no puede ser negativo',
            noExercises: 'Escribí al menos una cuenta 🙂',

            progress: 'Cuenta {n} de {total}',
            instr_keypad: '¿Cuánto da?',
            instr_choose: 'Tocá la respuesta',
            instr_missing: '¿Qué número falta?',
            instr_truefalse: '¿Está bien o está mal?',
            instr_compare: '¿Mayor, menor o igual?',
            instr_sequence: 'Completá la serie',
            instr_count: '¿Qué número es?',
            instr_story: '🧩 Problema',
            compareSpoken: '{a} {op} {b}, ¿es mayor, menor o igual que {c}?',
            bigger: 'mayor',
            smaller: 'menor',
            same: 'igual',
            isItTrue: '¿{a} {op} {b} es igual a {c}?',
            yes: 'Está bien',
            no: 'Está mal',
            whatNumber: 'qué número',
            equals: 'es igual a',
            ok: 'Listo',
            erase: 'Borrar',
            correct: ['¡Muy bien! ✨', '¡Genial! 🌟', '¡Eso es! 💖', '¡Bravo! 🎉'],
            tryAgain: '🤔 Casi… probá otra vez',
            revealed: 'Era {answer}. ¡La próxima sale! 💪',

            endTitle: '🪄 ¡MAGIA! 🪄',
            endTitles: ['', '¡Bien hecho! 🌱', '¡Muy bien! 🌟', '🪄 ¡MAGIA! 🪄'],
            endScore: '{correct} de {total} a la primera',
            newBest: '🏆 ¡Nuevo récord!',
            yourBest: 'Tu mejor puntaje: {correct}/{total}',
            viewScores: '📊 Ver puntajes',
            pathTitle: '🏰 Camino al castillo',
            pathHere: '¡Seguí acá!',
            castle: '¡Llegaste al castillo!',
            castleLocked: 'Con 2 estrellas en cada nivel llegás al castillo',
            album: '⭐ Mis stickers {n}/{total}',
            albumTitle: '⭐ Mis stickers',
            albumHint: 'Cada juego con 2 o 3 estrellas te da un sticker nuevo. Tenés {n} de {total}.',
            albumFull: '¡Completaste el álbum! 🎉',
            newSticker: '¡Ganaste un sticker nuevo!',
            weakTitle: 'Lo que más le cuesta',
            weakSub: '{n} cuentas para repasar',
            practiceMissed: '💪 Practicar las que me costaron ({n})',
            scoresTitle: '📊 Tus puntajes',
            scoresHint: 'Lo mejor que hiciste en cada nivel. Las estrellas son un resumen; el número dice cuántas te salieron a la primera. Reiniciar borra los récords y también la lista de lo que más le cuesta.',
            notPlayed: 'todavía no',
            resetScores: '🔄 Reiniciar récords',
            resetConfirm: '¿Seguro? Tocá de nuevo para borrar',
            playAgain: '🔁 Jugar de nuevo',
            home: '🏠 Menú',
        },
        en: {
            pageTitle: 'Math LDK',
            brand: '💖 Math LDK',
            brandShort: '💖 Math LDK',
            streak: '🔥 {n} in a row',
            tagline: 'Learning through play 🌟',
            menu: '← Menu',

            howMany: 'How many sums?',
            sounds: '🔔 Sounds',
            music: '🎵 Music',
            listen: '🔊 Listen',
            ops: { '+': 'plus', '-': 'minus', '*': 'times', '/': 'divided by' },
            howMuchIs: 'What is {a} {op} {b}?',
            orHomework: 'or homework you write',

            homeworkTitle: '📝 Homework',
            homeworkHint: 'One sum per line: 15+13, 20-7, 4x5, 8/2',
            homeworkGo: '🪄 Make the exercises',
            invalidOperation: 'I could not understand',
            exactDivisions: 'exact divisions only',
            negativeResult: 'the answer cannot be negative',
            noExercises: 'Write at least one sum 🙂',

            progress: 'Sum {n} of {total}',
            instr_keypad: 'What is the answer?',
            instr_choose: 'Tap the answer',
            instr_missing: 'Which number is missing?',
            instr_truefalse: 'Right or wrong?',
            instr_compare: 'Bigger, smaller or the same?',
            instr_sequence: 'Fill in the gap',
            instr_count: 'Which number is it?',
            instr_story: '🧩 Word problem',
            compareSpoken: 'Is {a} {op} {b} bigger than, smaller than, or the same as {c}?',
            bigger: 'bigger',
            smaller: 'smaller',
            same: 'same',
            isItTrue: 'Is {a} {op} {b} equal to {c}?',
            yes: 'Right',
            no: 'Wrong',
            whatNumber: 'what number',
            equals: 'equals',
            ok: 'Done',
            erase: 'Delete',
            correct: ['Great job! ✨', 'Awesome! 🌟', 'That’s it! 💖', 'Bravo! 🎉'],
            tryAgain: '🤔 Almost… try again',
            revealed: 'It was {answer}. You’ll get the next one! 💪',

            endTitle: '🪄 MAGIC! 🪄',
            endTitles: ['', 'Well done! 🌱', 'Great job! 🌟', '🪄 MAGIC! 🪄'],
            endScore: '{correct} of {total} on the first try',
            newBest: '🏆 New record!',
            yourBest: 'Your best: {correct}/{total}',
            viewScores: '📊 See scores',
            pathTitle: '🏰 Road to the castle',
            pathHere: 'Keep going here!',
            castle: 'You reached the castle!',
            castleLocked: 'Two stars on every level takes you to the castle',
            album: '⭐ My stickers {n}/{total}',
            albumTitle: '⭐ My stickers',
            albumHint: 'Every round with 2 or 3 stars gives you a new sticker. You have {n} of {total}.',
            albumFull: 'You filled the album! 🎉',
            newSticker: 'You won a new sticker!',
            weakTitle: 'The tricky ones',
            weakSub: '{n} sums to practise',
            practiceMissed: '💪 Practise the tricky ones ({n})',
            scoresTitle: '📊 Your scores',
            scoresHint: 'Your best on each level. Stars are a summary; the number says how many you got on the first try. Resetting also clears the tricky-ones list.',
            notPlayed: 'not yet',
            resetScores: '🔄 Reset records',
            resetConfirm: 'Sure? Tap again to erase',
            playAgain: '🔁 Play again',
            home: '🏠 Menu',
        },
    };

    let lang = 'es';

    function guess(saved, navigatorLanguage){
        if(saved && STRINGS[saved]) return saved;
        return /^en\b/i.test(navigatorLanguage || '') ? 'en' : 'es';
    }

    function setLang(next){
        if(STRINGS[next]) lang = next;
    }

    function getLang(){
        return lang;
    }

    /* t('progress', { n: 2, total: 10 }) — arrays pick one at random */
    function t(key, vars){
        let value = STRINGS[lang][key];
        if(value === undefined) value = STRINGS.es[key];
        if(Array.isArray(value)) value = value[Math.floor(Math.random() * value.length)];
        if(value && typeof value === 'object') return value;
        if(typeof value !== 'string') return '';
        return value.replace(/\{(\w+)\}/g, (_, name) => (vars && name in vars) ? vars[name] : '');
    }

    /* one entry of a list, e.g. tAt('endTitles', 3) */
    function tAt(key, index){
        const list = STRINGS[lang][key] || STRINGS.es[key] || [];
        return list[index] || '';
    }

    return { STRINGS, t, tAt, guess, setLang, getLang };
})();
