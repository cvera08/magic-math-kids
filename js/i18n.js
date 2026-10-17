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
            tagline: 'Aprendamos jugando 🌟',
            menu: '← Menú',

            howMany: '¿Cuántas cuentas?',
            orHomework: 'o una tarea que escribís vos',

            homeworkTitle: '📝 Tarea',
            homeworkHint: 'Escribí una cuenta por renglón: 15+13, 20-7, 4x5, 8/2',
            homeworkGo: '🪄 Armar ejercicios',
            invalidOperation: 'No entendí',
            exactDivisions: 'solo divisiones exactas',
            negativeResult: 'el resultado no puede ser negativo',
            noExercises: 'Escribí al menos una cuenta 🙂',

            progress: 'Cuenta {n} de {total}',
            typeAnswer: '¿Cuánto da?',
            ok: 'Listo',
            erase: 'Borrar',
            correct: ['¡Muy bien! ✨', '¡Genial! 🌟', '¡Eso es! 💖', '¡Bravo! 🎉'],
            tryAgain: '🤔 Casi… probá otra vez',
            revealed: 'Era {answer}. ¡La próxima sale! 💪',

            endTitle: '🪄 ¡MAGIA! 🪄',
            endScore: 'Hiciste {total} cuentas',
            playAgain: '🔁 Jugar de nuevo',
            home: '🏠 Menú',
        },
        en: {
            pageTitle: 'Math LDK',
            brand: '💖 Math LDK',
            tagline: 'Learning through play 🌟',
            menu: '← Menu',

            howMany: 'How many sums?',
            orHomework: 'or homework you write',

            homeworkTitle: '📝 Homework',
            homeworkHint: 'One sum per line: 15+13, 20-7, 4x5, 8/2',
            homeworkGo: '🪄 Make the exercises',
            invalidOperation: 'I could not understand',
            exactDivisions: 'exact divisions only',
            negativeResult: 'the answer cannot be negative',
            noExercises: 'Write at least one sum 🙂',

            progress: 'Sum {n} of {total}',
            typeAnswer: 'What is the answer?',
            ok: 'Done',
            erase: 'Delete',
            correct: ['Great job! ✨', 'Awesome! 🌟', 'That’s it! 💖', 'Bravo! 🎉'],
            tryAgain: '🤔 Almost… try again',
            revealed: 'It was {answer}. You’ll get the next one! 💪',

            endTitle: '🪄 MAGIC! 🪄',
            endScore: 'You did {total} sums',
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
        if(typeof value !== 'string') return '';
        return value.replace(/\{(\w+)\}/g, (_, name) => (vars && name in vars) ? vars[name] : '');
    }

    return { STRINGS, t, guess, setLang, getLang };
})();
