// ui.js - small building blocks used by lessons: quizzes, pencil boxes, number boxes, celebrations.
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

    // A "pencil and paper" task with a button that reveals the answer.
    function pencil(container, opts) {
        const wrap = add(container, `<div class="pencil">
            <div class="pencil-head">✏️ On paper</div>
            <div class="pencil-task">${opts.task}</div>
            ${opts.reveal ? `<button type="button" class="btn-random pencil-btn">${opts.button || 'I did it on paper — check it!'}</button>` : ''}
            <div class="pencil-reveal"></div>
        </div>`);
        if (opts.reveal) {
            const btn = wrap.querySelector('.pencil-btn');
            btn.addEventListener('click', () => {
                btn.remove();
                opts.reveal(wrap.querySelector('.pencil-reveal'));
            });
        }
        return wrap;
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
                feedback(fb, 'bad', opts.hint || 'Some boxes are not right yet. Check them on paper!');
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

    window.UI = { el, add, feedback, choice, pencil, numbers, callout, praise };
})();
