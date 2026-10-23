/*
 * HINTS — after a miss, the sum drawn as things she can count, instead
 * of a bare "try again". The drawing never says the answer; she still
 * has to count it.
 *
 *   3 + 4      🍓🍓🍓 + 🍋🍋🍋🍋        (rows of five, like a ten frame)
 *   9 − 5      🍪 × 9, the last five crossed out
 *   34 + 11    tens as bars, ones as dots (base-ten blocks)
 *   4 × 2      four bags with two sweets each
 *   8 ÷ 2      two kids, the sweets shared between them
 */

const HINTS = (() => {

    function row(n, emoji, extraClass){
        let html = '';
        for(let i = 0; i < n; i++){
            if(i > 0 && i % 5 === 0) html += '<span class="hint-gap"></span>';
            html += `<span class="hint-item ${extraClass ? extraClass(i) : ''}">${emoji}</span>`;
        }
        return `<span class="hint-row">${html}</span>`;
    }

    /* base-ten blocks: a bar per ten, a dot per one */
    function blocks(n, color){
        const tens = Math.floor(n / 10);
        const ones = n % 10;
        let html = '';
        for(let i = 0; i < tens; i++) html += `<span class="ten-bar ${color}"></span>`;
        if(ones) html += `<span class="ones">${`<span class="one-dot ${color}"></span>`.repeat(ones)}</span>`;
        return `<span class="blocks">${html}</span>`;
    }

    function bags(count, each, emoji, holder){
        let html = '';
        for(let i = 0; i < count; i++){
            html += `<span class="hint-bag">${holder ? `<span class="bag-holder">${holder}</span>` : ''}<span>${emoji.repeat(each)}</span></span>`;
        }
        return `<span class="hint-bags">${html}</span>`;
    }

    function render(f){
        const sign = `<span class="hint-sign">${ENGINE.symbol(f.op)}</span>`;

        if(f.op === '+'){
            if(f.result <= 20) return row(f.a, '🍓') + sign + row(f.b, '🍋');
            return blocks(f.a, 'c1') + sign + blocks(f.b, 'c2');
        }
        if(f.op === '-'){
            if(f.a <= 20) return row(f.a, '🍪', i => i >= f.a - f.b ? 'gone' : '');
            return blocks(f.a, 'c1') + sign + blocks(f.b, 'c2 gone');
        }
        if(f.op === '*') return bags(f.a, f.b, '🍬');
        if(f.op === '/') return bags(f.b, f.a / f.b, '🍬', '🧒');
        return '';
    }

    /* 10, 20, 30, ?: show the jump between numbers */
    function jumps(q){
        const sign = q.step > 0 ? '+' : '−';
        const hop = `<span class="hop">${sign}${Math.abs(q.step)}</span>`;
        return `<span class="hops">${q.seq.map((v, i) =>
            (i ? hop : '') + `<span class="hop-num">${i === q.blank ? '?' : v}</span>`
        ).join('')}</span>`;
    }

    /* the count question itself: a big set of blocks */
    function countBlocks(n){
        return `<div class="count-blocks">${blocks(n, 'c1')}</div>
            <div class="count-legend"><span class="ten-bar c1 mini"></span> = 10 &nbsp; <span class="one-dot c1"></span> = 1</div>`;
    }

    function forQuestion(q){
        if(q.type === 'count'){
            return `<span class="hint-text">${Math.floor(q.n / 10)} × <span class="ten-bar c1 mini"></span> + ${q.n % 10} × <span class="one-dot c1"></span></span>`;
        }
        if(q.type === 'sequence') return jumps(q);
        return render(q.fact);
    }

    return { render, forQuestion, countBlocks };
})();
