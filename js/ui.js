// ui.js - small building blocks used by lessons: quizzes, guesses, number boxes, callouts.
(function () {
    function el(html) {
        const t = document.createElement('template');
        t.innerHTML = html.trim();
        return t.content.firstElementChild;
    }

    function add(container, html) {
        const node = typeof html === 'string' ? el(html) : html;
        container.appendChild(node);
        return node;
    }

    const PRAISE = ['Good job!', 'Yes!', 'Super!', 'Exactly right!', 'You got it!', 'Brilliant!'];
    function praise() { return PRAISE[Math.floor(Math.random() * PRAISE.length)]; }

    function feedback(box, kind, html) {
        box.className = 'feedback show ' + kind;
        box.innerHTML = html;
    }

    // Multiple-choice buttons. opts: { question, options: [html], answer: index,
    //   right: html shown when right, wrong: (index) => html, onRight() }
    function choice(container, opts) {
        const wrap = add(container, `<div class="quiz">
            ${opts.question ? `<div class="quiz-q">${opts.question}</div>` : ''}
            <div class="quiz-options"></div>
            <div class="feedback"></div>
        </div>`);
        const row = wrap.querySelector('.quiz-options');
        const fb = wrap.querySelector('.feedback');
        let solved = false;
        opts.options.forEach((label, i) => {
            const b = add(row, `<button type="button" class="opt">${opts.letters ? `<b>${'ABCDE'[i]}.</b> ` : ''}${label}</button>`);
            b.addEventListener('click', () => {
                if (solved) return;
                if (i === opts.answer) {
                    solved = true;
                    b.classList.add('right');
                    row.querySelectorAll('.opt').forEach(o => o.disabled = true);
                    feedback(fb, 'good', `<b>${praise()}</b> ${opts.right || ''}`);
                    opts.onRight && opts.onRight();
                } else {
                    b.classList.add('wrong');
                    b.disabled = true;
                    feedback(fb, 'bad', (opts.wrong && opts.wrong(i)) || 'Not quite. Look again and try another one!');
                    opts.onWrong && opts.onWrong(i);
                }
            });
        });
        return wrap;
    }

    // A quick guess at the start of a lesson. Remembered (in memory only) and compared at the end.
    const guesses = {};
    function guess(container, opts) {
        const wrap = add(container, `<div class="guess">
            <div class="guess-head">Your guess</div>
            <div class="quiz-q">${opts.question || 'Don\'t work it out yet. Just pick what feels right:'}</div>
            <div class="quiz-options"></div>
            <div class="feedback"></div>
        </div>`);
        const row = wrap.querySelector('.quiz-options');
        const fb = wrap.querySelector('.feedback');
        opts.options.forEach(o => {
            const b = add(row, `<button type="button" class="opt">${o}</button>`);
            b.addEventListener('click', () => {
                guesses[opts.id] = o;
                row.querySelectorAll('.opt').forEach(x => x.classList.remove('chosen'));
                b.classList.add('chosen');
                feedback(fb, 'good', `You guessed <b>${o}</b>. Let's find out if you are right!`);
                opts.onPicked && opts.onPicked(o);
            });
        });
        return wrap;
    }
    function guessResult(container, id, answer) {
        const g = guesses[id];
        if (g === undefined) return;
        const right = String(g) === String(answer);
        callout(container, right ? 'good' : 'plain', right ? 'Your guess was right!' : 'Your guess',
            right ? `You guessed <b>${g}</b> at the start. Now you also know <b>why</b>.`
                  : `You guessed <b>${g}</b> at the start. The real answer is <b>${answer}</b>. Now you know the trick, so next time you won't need to guess.`);
    }

    // A button that shows more (an explanation, a picture) when clicked.
    function reveal(container, label, fill) {
        const btn = add(container, `<button type="button" class="btn-random">${label}</button>`);
        const box = add(container, `<div class="reveal-box"></div>`);
        btn.addEventListener('click', () => { btn.remove(); fill(box); });
        return box;
    }

    // Number boxes inside a sentence. template: "60 ÷ 6 = [10] blocks" -> [n] becomes an input.
    function numbers(container, opts) {
        const answers = [];
        const html = opts.template.replace(/\[(\d+)\]/g, (_, n) => {
            answers.push(Number(n));
            return `<input type="number" inputmode="numeric" class="num-box" data-i="${answers.length - 1}">`;
        });
        const wrap = add(container, `<div class="numbers">
            <div class="numbers-line">${html}</div>
            <button type="button" class="btn-random">Check</button>
            <div class="feedback"></div>
        </div>`);
        const fb = wrap.querySelector('.feedback');
        const inputs = [...wrap.querySelectorAll('.num-box')];
        const check = () => {
            let allRight = true;
            inputs.forEach((inp, i) => {
                const ok = inp.value !== '' && Number(inp.value) === answers[i];
                inp.classList.toggle('right', ok);
                inp.classList.toggle('wrong', !ok && inp.value !== '');
                if (!ok) allRight = false;
            });
            if (allRight) {
                feedback(fb, 'good', `<b>${praise()}</b> ${opts.right || ''}`);
                inputs.forEach(i => i.disabled = true);
                wrap.querySelector('button').remove();
                opts.onRight && opts.onRight();
            } else {
                feedback(fb, 'bad', opts.hint || 'Some boxes are not right yet. Try again!');
            }
        };
        wrap.querySelector('button').addEventListener('click', check);
        inputs.forEach(inp => inp.addEventListener('keydown', e => { if (e.key === 'Enter') check(); }));
        return wrap;
    }

    // A box with a coloured title, e.g. "The big idea".
    function callout(container, kind, title, html) {
        return add(container, `<div class="callout callout-${kind}"><div class="callout-title">${title}</div><div>${html}</div></div>`);
    }

    window.UI = { el, add, feedback, choice, guess, guessResult, reveal, numbers, callout, praise };
})();
