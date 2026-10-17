/*
 * UI — the exercise list, progress bar and celebration.
 */

let totalExercises = 0;
let completedExercises = 0;
let currentWarnings = [];

function setLanguage(language){

    currentLanguage = language;
    document.documentElement.lang = language;
    document.title = t('pageTitle');

    document
        .querySelectorAll('[data-i18n]')
        .forEach(element=>{
            element.innerHTML =
                t(element.dataset.i18n);
        });

    document
        .querySelectorAll('.message[data-message-key]')
        .forEach(element=>{
            element.innerHTML =
                t(element.dataset.messageKey);
        });

    renderWarnings();
    updateProgress();
}

function renderWarnings(){

    const warningArea = document.getElementById('warningArea');

    if(!currentWarnings.length){
        warningArea.innerHTML = '';
        return;
    }

    const messages =
        currentWarnings.map(warning=>{
            if(warning.key === 'invalidOperation'){
                return `${t('invalidOperation')}: ${warning.line}`;
            }

            return `⚠️ ${warning.line} → ${t('exactDivisions')}`;
        });

    warningArea.innerHTML =
        `<div class="warning">${messages.join('<br>')}</div>`;
}

function generateExercises(){

    document.body.classList.remove('completed');

    const warningArea = document.getElementById('warningArea');
    warningArea.innerHTML = '';
    currentWarnings = [];

    completedExercises = 0;

    const container = document.getElementById('exerciseContainer');
    container.innerHTML = '';

    const parsed = ENGINE.parseOperations(
        document.getElementById('operations').value
    );

    const warnings = parsed.warnings;
    const validExercises = parsed.exercises.map(e=>({
        display: `${e.a} ${ENGINE.symbol(e.op)} ${e.b}`,
        result: e.result
    }));

    if(warnings.length){
        currentWarnings = warnings;
        renderWarnings();
    }

    totalExercises = validExercises.length;

    validExercises.forEach((exercise,index)=>{

        const div = document.createElement('div');
        div.className = 'exercise';

        div.innerHTML = `
            <div class="row">
                <div class="expression">
                    ${exercise.display} =
                </div>

                <input
                    type="text"
                    inputmode="numeric"
                    class="answer"
                    data-answer="${exercise.result}"
                >
            </div>

            <div class="message"></div>
        `;

        container.appendChild(div);

        const input = div.querySelector('.answer');
        const message = div.querySelector('.message');

        const validate = () => {

            if(input.disabled) return;

            const value = input.value.trim();

            if(value === ''){
                return;
            }

            if(!/^-?\d+$/.test(value)){
                message.dataset.messageKey =
                    'enterNumber';
                message.innerHTML =
                    t('enterNumber');
                message.className =
                    'message incorrect';
                return;
            }

            if(Number(value) === Number(input.dataset.answer)){

                input.disabled = true;
                input.classList.add('locked');

                message.innerHTML =
                    t('correct');
                message.dataset.messageKey =
                    'correct';

                message.className =
                    'message correct';

                completedExercises++;

                updateProgress();
                highlightNext();
                checkFinished();

            }else{

                message.innerHTML =
                    t('incorrect');
                message.dataset.messageKey =
                    'incorrect';

                message.className =
                    'message incorrect';
            }
        };

        input.addEventListener('keydown',(e)=>{
            if(e.key==='Enter'){
                validate();
            }
        });

        input.addEventListener('blur',validate);

    });

    document
        .getElementById('exerciseSection')
        .classList.remove('hidden');

    updateProgress();
    highlightNext();

    setTimeout(()=>{
        const first = document.querySelector('.answer');
        if(first){
            first.focus();
        }
    },100);
}

function updateProgress(){

    const text =
        document.getElementById('progressText');

    const fill =
        document.getElementById('progressFill');

    text.innerHTML =
        `${t('progress')}: ${completedExercises}/${totalExercises}`;

    const percent =
        totalExercises
            ? (completedExercises/totalExercises)*100
            : 0;

    fill.style.width = percent + '%';
}

function highlightNext(){

    document
        .querySelectorAll('.exercise')
        .forEach(e=>e.classList.remove('active'));

    const next =
        [...document.querySelectorAll('.answer')]
        .find(x=>!x.disabled);

    if(next){
        next.closest('.exercise')
            .classList.add('active');

        next.focus();

        next.scrollIntoView({
            behavior:'smooth',
            block:'center'
        });
    }
}

function checkFinished(){

    if(
        totalExercises > 0 &&
        completedExercises === totalExercises
    ){

        document.body.classList.add('completed');

        createConfetti();

        window.scrollTo({
            top:document.body.scrollHeight,
            behavior:'smooth'
        });
    }
}

function createConfetti(){

    const container =
        document.getElementById('confetti');

    container.innerHTML = '';

    const emojis =
        ['🎉','✨','🌟','💖','🎊'];

    for(let i=0;i<70;i++){

        const el =
            document.createElement('span');

        el.innerHTML =
            emojis[Math.floor(
                Math.random()*emojis.length
            )];

        el.style.left =
            Math.random()*100 + 'vw';

        el.style.animationDuration =
            (3 + Math.random()*4) + 's';

        el.style.animationDelay =
            Math.random()*2 + 's';

        container.appendChild(el);
    }
}

generateExercises();
