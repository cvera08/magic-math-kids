/*
 * I18N — English and Spanish copy. Everything the UI says comes from
 * here, so a language switch only has to re-run the painters.
 */

const I18N_STRINGS = {
    en:{
        title:'💖 Math LDK ✨',
        subtitle:'Learning through play 🌟',
        operationsTitle:'🪄 Write the operations',
        generateButton:'🪄 Generate exercises',
        pageTitle:'Math LDK',
        progress:'🌈 Progress',
        magicTitle:'🪄 MAGIC! 🪄',
        completedMessage:'You completed all the exercises!',
        invalidOperation:'⚠️ I could not understand',
        exactDivisions:'Exact divisions only',
        enterNumber:'🔢 Enter a number',
        correct:'✅ Great job!',
        incorrect:'🤔 Try again'
    },
    es:{
        title:'💖 Matemáticas LDK ✨',
        subtitle:'Aprendamos jugando 🌟',
        operationsTitle:'🪄 Escribe las operaciones',
        generateButton:'🪄 Generar ejercicios',
        pageTitle:'Matemáticas LDK',
        progress:'🌈 Progreso',
        magicTitle:'🪄 ¡MAGIA! 🪄',
        completedMessage:'¡Completaste todos los ejercicios!',
        invalidOperation:'⚠️ No pude interpretar',
        exactDivisions:'Solo divisiones exactas',
        enterNumber:'🔢 Escribe un número',
        correct:'✅ ¡Muy bien!',
        incorrect:'🤔 Intenta otra vez'
    }
};

let currentLanguage = 'en';

function t(key){
    return I18N_STRINGS[currentLanguage][key];
}
