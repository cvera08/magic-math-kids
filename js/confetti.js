/*
 * CONFETTI — emoji celebration for the end screen: absolutely
 * positioned spans falling with a CSS animation, no canvas, no library.
 * (english-ldk borrowed this from here and tidied it; this is that copy.)
 */

const CONFETTI = (() => {

    function burst(container, amount = 60){
        if(!container) return;

        container.innerHTML = '';
        const emojis = ['🎉', '✨', '🌟', '💖', '🎊', '🏆'];

        for(let i = 0; i < amount; i++){
            const span = document.createElement('span');
            span.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            span.style.left = Math.random() * 100 + 'vw';
            span.style.animationDuration = (3 + Math.random() * 4) + 's';
            span.style.animationDelay = Math.random() * 1.5 + 's';
            span.style.fontSize = (18 + Math.random() * 18) + 'px';
            container.appendChild(span);
        }
    }

    function clear(container){
        if(container) container.innerHTML = '';
    }

    return { burst, clear };
})();
