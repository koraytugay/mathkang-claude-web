// Lesson: two repeating patterns at the same time (Math Kangaroo 2024, Ecolier, Q19).
(function () {
    const { strip, lamps, cardTag, shirtTag, shirtIcon, at, CARD_COLOR, EMOJI } = window.Draw;
    const { add, choice, guess, guessResult, numbers, callout, feedback, praise } = window.UI;

    const SHIRTS = ['white', 'striped'];
    const CARDS = ['circle', 'star', 'triangle'];
    const sameAs1 = i => at(SHIRTS, i) === at(SHIRTS, 1) && at(CARDS, i) === at(CARDS, 1);
    const isTarget = i => at(SHIRTS, i) === 'white' && at(CARDS, i) === 'triangle';

    // Children you click to select; "Check" compares with the right set.
    function pickMany(container, opts) {
        const chosen = new Set();
        const s = strip({
            ...opts.strip,
            onPick(i, el) {
                if (done) return;
                chosen.has(i) ? chosen.delete(i) : chosen.add(i);
                el.classList.toggle('picked');
            }
        });
        let done = false;
        container.appendChild(s);
        const btn = add(container, `<button type="button" class="btn-random">Check my circles</button>`);
        const fb = add(container, `<div class="feedback"></div>`);
        btn.addEventListener('click', () => {
            const want = opts.answer;
            const missing = want.filter(i => !chosen.has(i));
            const extra = [...chosen].filter(i => !want.includes(i));
            if (!missing.length && !extra.length) {
                done = true;
                btn.remove();
                feedback(fb, 'good', `<b>${praise()}</b> ${opts.right}`);
                opts.onRight && opts.onRight();
            } else if (extra.length) {
                const i = extra[0];
                feedback(fb, 'bad', `Look at child <b>${i}</b> again: ${shirtTag(at(opts.strip.shirts, i))} T-shirt and ${cardTag(at(opts.strip.cards, i))} card. Is that what we want?`);
            } else {
                feedback(fb, 'bad', `You missed some! Check every child one by one.`);
            }
        });
    }

    // A table to fill in by clicking: each click changes the box to the next option.
    function fillTable(container, opts) {
        const { shirts, cards, n, given } = opts;
        const shirtOpts = [...new Set(shirts)], cardOpts = [...new Set(cards)];
        const wrap = add(container, `<div class="fill-wrap">
            <div class="fill-table" style="grid-template-columns: 90px repeat(${n}, minmax(34px, 1fr))"></div>
            <div class="btn-row"><button type="button" class="btn-random f-check">Check my table</button></div>
            <div class="feedback"></div></div>`);
        const grid = wrap.querySelector('.fill-table');
        const fb = wrap.querySelector('.feedback');
        const showShirt = k => k ? shirtIcon(k) : '<span class="q">?</span>';
        const showCard = k => k ? `<span class="card-big" style="color:${CARD_COLOR[k]}">${EMOJI[k]}</span>` : '<span class="q">?</span>';
        const cells = [];
        add(grid, `<div class="fh">child</div>`);
        for (let i = 1; i <= n; i++) add(grid, `<div class="fh">${i}</div>`);
        [['T-shirt', shirts, shirtOpts, showShirt], ['card', cards, cardOpts, showCard]].forEach(([label, list, options, show]) => {
            add(grid, `<div class="fh">${label}</div>`);
            for (let i = 1; i <= n; i++) {
                const want = at(list, i);
                const fixed = i <= given;
                const c = add(grid, `<button type="button" class="fc${fixed ? ' fixed' : ''}">${show(fixed ? want : null)}</button>`);
                const cell = { el: c, want, val: fixed ? want : null, show, options };
                cells.push(cell);
                if (!fixed) c.addEventListener('click', () => {
                    const k = options.indexOf(cell.val);
                    cell.val = options[(k + 1) % options.length];
                    c.innerHTML = show(cell.val);
                    c.classList.remove('wrong');
                });
            }
        });
        let tries = 0;
        wrap.querySelector('.f-check').addEventListener('click', e => {
            const empty = cells.filter(c => c.val === null).length;
            if (empty) {
                feedback(fb, 'bad', `${empty} box${empty > 1 ? 'es are' : ' is'} still empty. Click each <b>?</b> until it shows the right thing.`);
                return;
            }
            const wrong = cells.filter(c => c.val !== c.want);
            wrong.forEach(c => c.el.classList.add('wrong'));
            if (!wrong.length) {
                e.target.remove();
                const extra = wrap.querySelector('.f-show'); if (extra) extra.remove();
                cells.forEach(c => c.el.disabled = true);
                feedback(fb, 'good', `<b>${praise()}</b> ${opts.right || ''}`);
                opts.onRight && opts.onRight();
                return;
            }
            tries++;
            feedback(fb, 'bad', `${wrong.length} box${wrong.length > 1 ? 'es are' : ' is'} not right yet (marked). Remember: T-shirts repeat every ${shirtOpts.length}, cards every ${cardOpts.length}.`);
            if (tries === 2) {
                const s = add(wrap.querySelector('.btn-row'), `<button type="button" class="btn-random f-show">Show me the answer</button>`);
                s.addEventListener('click', () => {
                    cells.forEach(c => { c.val = c.want; c.el.innerHTML = c.show(c.want); c.el.classList.remove('wrong'); });
                    wrap.querySelector('.f-check').click();
                });
            }
        });
    }

    // Children 1..n as small boxes in blocks, with the wanted ones starred.
    function blocksPicture(total, block, isWanted) {
        let html = '<div class="blocks">';
        for (let b = 0; b * block < total; b++) {
            const from = b * block + 1, to = Math.min(total, from + block - 1);
            const stars = [];
            for (let i = from; i <= to; i++) if (isWanted(i)) stars.push(i);
            html += `<div class="block-box${to - from + 1 < block ? ' partial' : ''}"><div class="block-range">${from}–${to}</div><div class="block-star">${stars.length ? '★ ' + stars.join(', ') : '—'}</div></div>`;
        }
        return html + '</div>';
    }

    const steps = [
        {
            title: 'The puzzle',
            render(body, ctx) {
                add(body, `<p class="big">60 children stand in a row. Each child wears a T-shirt and holds a card.</p>`);
                add(body, `<p>The T-shirts go: ${shirtTag('white')}, ${shirtTag('striped')}, ${shirtTag('white')}, ${shirtTag('striped')}, ...<br>
                    The cards go: ${cardTag('circle')}, ${cardTag('star')}, ${cardTag('triangle')}, ${cardTag('circle')}, ${cardTag('star')}, ${cardTag('triangle')}, ...</p>`);
                body.appendChild(strip({ shirts: SHIRTS, cards: CARDS, to: 8, more: '... all the way to child 60' }));
                callout(body, 'question', 'The question',
                    `How many children have a <b>white</b> T-shirt <b>and</b> a ${cardTag('triangle')} card?`);
                guess(body, { id: 'two-patterns', options: ['6', '10', '20', '30', '60'], onPicked: ctx.done });
            }
        },
        {
            title: 'Too many to count',
            render(body, ctx) {
                add(body, `<p class="big">Here are <b>all 60</b> children.</p>`);
                body.appendChild(strip({ shirts: SHIRTS, cards: CARDS, to: 60, size: 30 }));
                add(body, `<p>Checking them one by one takes a long time, and it is very easy to skip one or count one twice.</p>`);
                callout(body, 'idea', 'A better way', 'Mathematicians look for a <b>pattern</b> first. Then they only need to check a few children, not 60. Let\'s learn how!');
                ctx.done();
            }
        },
        {
            title: 'Look only at the T-shirts',
            render(body, ctx) {
                add(body, `<p class="big">Two things change at the same time. That's hard! So first, let's look at <b>only one</b> thing: the T-shirts.</p>`);
                body.appendChild(strip({ shirts: SHIRTS, cards: CARDS, hide: 'card', to: 8, block: 2 }));
                add(body, `<p>${shirtTag('white')}, ${shirtTag('striped')}, then it starts again. The T-shirts repeat <b>every 2 children</b>.</p>`);
                choice(body, {
                    question: 'What T-shirt does child number <b>9</b> wear?',
                    options: [shirtTag('white'), shirtTag('striped')],
                    answer: 0,
                    right: 'White T-shirts are on 1, 3, 5, 7, 9, ... the <b>odd</b> numbers!',
                    wrong: () => 'Count on from the picture: 7 is white, 8 is striped, 9 is ...?',
                    onRight() {
                        choice(body, {
                            question: 'And child number <b>20</b>?',
                            options: [shirtTag('white'), shirtTag('striped')],
                            answer: 1,
                            right: '20 is an <b>even</b> number, so striped. You don\'t need to draw 20 children!',
                            wrong: () => 'Is 20 an odd number or an even number?',
                            onRight: ctx.done
                        });
                    }
                });
            }
        },
        {
            title: 'Now only the cards',
            render(body, ctx) {
                add(body, `<p class="big">Now let's forget the T-shirts and look only at the cards.</p>`);
                body.appendChild(strip({ shirts: SHIRTS, cards: CARDS, hide: 'shirt', to: 9, block: 3 }));
                add(body, `<p>${cardTag('circle')}, ${cardTag('star')}, ${cardTag('triangle')}, then again. The cards repeat <b>every 3 children</b>.</p>`);
                choice(body, {
                    question: `Which children have a ${cardTag('triangle')} card?`,
                    options: ['1, 4, 7, 10, ...', '2, 5, 8, 11, ...', '3, 6, 9, 12, ...', '1, 3, 5, 7, ...'],
                    answer: 2,
                    right: 'Triangles are on 3, 6, 9, 12, ... the <b>3 times table</b>!',
                    wrong: i => i === 3 ? 'Those are the white T-shirts! We only look at cards now.' : 'Look at the picture: where is the first triangle? Then jump 3.',
                    onRight() {
                        choice(body, {
                            question: 'What card does child number <b>10</b> hold?',
                            options: [cardTag('circle'), cardTag('star'), cardTag('triangle')],
                            answer: 0,
                            right: '9 is a triangle (3 times table), so 10 starts again with a circle.',
                            wrong: () => 'Hint: child 9 has a triangle. What comes after a triangle?',
                            onRight: ctx.done
                        });
                    }
                });
            }
        },
        {
            title: 'Put both in a table',
            render(body, ctx) {
                add(body, `<p class="big">Now both together. A <b>table</b> keeps everything tidy: one column for each child.</p>`);
                add(body, `<p>Children 1, 2 and 3 are done. Fill in the rest: <b>click a box</b> to change it. Use what you just learned: T-shirts repeat every 2, cards every 3.</p>`);
                fillTable(body, {
                    shirts: SHIRTS, cards: CARDS, n: 12, given: 3,
                    right: 'Your table is perfect. Here are the children it describes:',
                    onRight() {
                        body.appendChild(strip({ shirts: SHIRTS, cards: CARDS, to: 12, size: 50 }));
                        ctx.done();
                    }
                });
            }
        },
        {
            title: 'Find where it starts again',
            render(body, ctx) {
                add(body, `<p class="big">Here is the secret trick: at some point <b>both</b> patterns start again <b>at the same time</b>.</p>`);
                add(body, `<p>Child 1 has a ${shirtTag('white')} T-shirt and a ${cardTag('circle')} card. <b>Click the next child that looks exactly the same</b> (same T-shirt <b>and</b> same card).</p>`);
                const fb = document.createElement('div');
                fb.className = 'feedback';
                let solved = false;
                const s = strip({
                    shirts: SHIRTS, cards: CARDS, to: 12, marked: [1],
                    onPick(i, el) {
                        if (solved) return;
                        if (i === 1) {
                            feedback(fb, 'bad', 'That is child 1 itself! Find the <b>next</b> one.');
                        } else if (sameAs1(i)) {
                            solved = true;
                            el.classList.add('picked');
                            feedback(fb, 'good', `<b>${praise()}</b> Child 7 looks exactly like child 1. And child 8 looks like child 2, child 9 like child 3, ... Everything repeats after <b>6 children</b>. We call these 6 children a <b>block</b>.`);
                            s.replaceWith(strip({ shirts: SHIRTS, cards: CARDS, to: 12, block: 6, marked: [1, 7] }));
                            ctx.done();
                        } else if (at(SHIRTS, i) === 'white') {
                            el.classList.add('nope');
                            feedback(fb, 'bad', `Child ${i} has the same T-shirt, but a ${cardTag(at(CARDS, i))} card. Child 1 has a circle!`);
                        } else if (at(CARDS, i) === 'circle') {
                            el.classList.add('nope');
                            feedback(fb, 'bad', `Child ${i} has a circle card, but a striped T-shirt. Child 1's T-shirt is white!`);
                        } else {
                            el.classList.add('nope');
                            feedback(fb, 'bad', `Child ${i} has a different T-shirt <b>and</b> a different card. Keep looking!`);
                        }
                    }
                });
                body.appendChild(s);
                body.appendChild(fb);
            }
        },
        {
            title: 'Why after 6 children?',
            render(body, ctx) {
                add(body, `<p class="big">Let's see <b>why</b> it is 6. Each row below circles the children where that pattern <b>starts again</b>.</p>`);
                const rows = add(body, `<div class="restart"></div>`);
                const line = (label, every) => {
                    let h = `<div class="restart-row"><div class="restart-label">${label}</div>`;
                    for (let i = 1; i <= 13; i++) h += `<button type="button" class="rn${(i - 1) % every === 0 ? ' on' : ''}" data-n="${i}">${i}</button>`;
                    return h + '</div>';
                };
                rows.innerHTML = line(`${shirtTag('white')} T-shirt again (every 2)`, 2) + line(`${cardTag('circle')} card again (every 3)`, 3);
                add(body, `<p>Click the first number <b>after 1</b> that is circled in <b>both</b> rows.</p>`);
                const fb = add(body, `<div class="feedback"></div>`);
                let solved = false;
                rows.querySelectorAll('.rn').forEach(b => b.addEventListener('click', () => {
                    if (solved) return;
                    const n = +b.dataset.n;
                    const sh = (n - 1) % 2 === 0, cd = (n - 1) % 3 === 0;
                    if (n === 7) {
                        solved = true;
                        rows.querySelectorAll('.rn[data-n="7"]').forEach(x => x.classList.add('both'));
                        feedback(fb, 'good', `<b>${praise()}</b> At child 7 the T-shirts <b>and</b> the cards start again together. 7 − 1 = <b>6</b>, so the block is 6 children long.`);
                        callout(body, 'idea', 'The rule', 'Write down when each pattern starts again. The first number in <b>both</b> lists tells you where the block ends.');
                        ctx.done();
                    } else if (n === 1) feedback(fb, 'bad', 'Child 1 is where we start. Find the next one!');
                    else if (n === 13) feedback(fb, 'bad', '13 is in both rows too, but is it the <b>first</b> one after 1?');
                    else if (sh && !cd) feedback(fb, 'bad', `At ${n} only the T-shirts start again. Is ${n} circled in the card row?`);
                    else if (cd && !sh) feedback(fb, 'bad', `At ${n} only the cards start again. Is ${n} circled in the T-shirt row?`);
                    else feedback(fb, 'bad', `${n} is not circled at all. Look for a number circled in both rows.`);
                }));
            }
        },
        {
            title: 'Count inside ONE block',
            render(body, ctx) {
                add(body, `<p class="big">We don't need to look at all 60 children. Just <b>one block</b> of 6!</p>`);
                add(body, `<p>Click every child in this block who has a <b>white</b> T-shirt <b>and</b> a ${cardTag('triangle')} card. Then press "Check".</p>`);
                pickMany(body, {
                    strip: { shirts: SHIRTS, cards: CARDS, to: 6 },
                    answer: [3],
                    right: 'Only child 3. So in one block there is exactly <b>1</b> such child.',
                    onRight: ctx.done
                });
            }
        },
        {
            title: 'Every block is the same',
            render(body, ctx) {
                add(body, `<p class="big">Because everything repeats, <b>every</b> block looks exactly like the first one.</p>`);
                body.appendChild(strip({ shirts: SHIRTS, cards: CARDS, to: 18, block: 6, marked: [3], size: 44 }));
                add(body, `<p>In block 1 (children 1–6) the child we want is number <b>3</b>.</p>`);
                choice(body, {
                    question: 'Which child is it in block 2 (children 7–12)?',
                    options: ['child 7', 'child 8', 'child 9', 'child 10'],
                    answer: 2,
                    right: 'Child 9: the 3rd child of block 2. That is 3 + 6.',
                    wrong: () => 'Find the 3rd child of block 2. Or: 3 + 6 = ?',
                    onRight() {
                        choice(body, {
                            question: 'And in block 3 (children 13–18)?',
                            options: ['child 14', 'child 15', 'child 16', 'child 18'],
                            answer: 1,
                            right: 'Child 15 = 9 + 6. Always <b>6 more</b>: 3, 9, 15, 21, ... One in every block.',
                            wrong: () => '9 + 6 = ?',
                            onRight: ctx.done
                        });
                    }
                });
            }
        },
        {
            title: 'How many blocks?',
            render(body, ctx) {
                add(body, `<p class="big">So now the only question is: how many blocks of 6 fit into 60 children?</p>`);
                numbers(body, {
                    template: '60 children ÷ 6 per block = [10] blocks',
                    right: 'Here they are, all 10 blocks, with the child we want in each:',
                    hint: 'How many 6s make 60? Use the 6 times table: 6, 12, 18, ...',
                    onRight() {
                        add(body, blocksPicture(60, 6, isTarget));
                        numbers(body, {
                            template: '10 blocks × 1 in each block = [10] children',
                            right: 'The answer is <b>10</b>.',
                            onRight: ctx.done
                        });
                    }
                });
            }
        },
        {
            title: 'Check it with all 60',
            render(body, ctx) {
                add(body, `<p class="big">Let's check our answer. Here are all 60 children again. The ones we want are marked.</p>`);
                body.appendChild(strip({ shirts: SHIRTS, cards: CARDS, to: 60, size: 30, block: 6, marked: Array.from({ length: 10 }, (_, k) => 3 + 6 * k) }));
                add(body, `<p>One in every block: 3, 9, 15, 21, 27, 33, 39, 45, 51, 57. That's <b>10</b>. ✔</p>`);
                guessResult(body, 'two-patterns', '10');
                ctx.done();
            }
        },
        {
            title: 'Another way to see it',
            render(body, ctx) {
                add(body, `<p class="big">Here are the numbers 1 to 60. Press both buttons. Numbers in <b>both</b> lists turn dark.</p>`);
                const ctr = add(body, `<div class="btn-row"></div>`);
                const bWhite = add(ctr, `<button type="button" class="toggle"><span class="swatch" style="background:#dbe7f3"></span>white T-shirts (odd numbers)</button>`);
                const bTri = add(ctr, `<button type="button" class="toggle"><span class="swatch" style="background:#dcefdc"></span>triangle cards (3 times table)</button>`);
                const grid = add(body, `<div class="num-grid"></div>`);
                for (let i = 1; i <= 60; i++) add(grid, `<div class="cell" data-n="${i}"><span>${i}</span></div>`);
                const on = { w: false, t: false };
                let shown = false;
                const paint = () => {
                    grid.querySelectorAll('.cell').forEach(c => {
                        const n = +c.dataset.n;
                        const w = on.w && n % 2 === 1, t = on.t && n % 3 === 0;
                        c.className = 'cell' + (w && t ? ' both' : w ? ' w' : t ? ' t' : '');
                    });
                    if (on.w && on.t && !shown) {
                        shown = true;
                        callout(body, 'idea', 'Look at the dark numbers', `3, 9, 15, 21, ... Every time <b>6 more</b>. That's our block again!`);
                        numbers(body, { template: 'How many dark numbers are there? [10]', right: 'Same answer, a different way.', onRight: ctx.done });
                    }
                };
                bWhite.addEventListener('click', () => { on.w = !on.w; bWhite.classList.toggle('on'); paint(); });
                bTri.addEventListener('click', () => { on.t = !on.t; bTri.classList.toggle('on'); paint(); });
            }
        },
        {
            title: 'Watch out: the block can be shorter',
            render(body, ctx) {
                const sh = ['white', 'striped'], cd = ['circle', 'star', 'triangle', 'square'];
                add(body, `<p class="big">New row: the T-shirts repeat every <b>2</b> and the cards repeat every <b>4</b>.</p>`);
                add(body, `<p>Many people think: "2 × 4 = 8, so the block is 8 long." Let's test it! Click the next child who looks exactly like child 1.</p>`);
                const fb = document.createElement('div');
                fb.className = 'feedback';
                let solved = false;
                const s = strip({
                    shirts: sh, cards: cd, to: 10, marked: [1],
                    onPick(i, el) {
                        if (solved || i === 1) return;
                        if (i === 5) {
                            solved = true;
                            el.classList.add('picked');
                            feedback(fb, 'good', `<b>${praise()}</b> Child 5 already looks like child 1. The block is only <b>4</b>, not 8! (T-shirts start again at 1, 3, <b>5</b>; cards at 1, <b>5</b>.)`);
                            s.replaceWith(strip({ shirts: sh, cards: cd, to: 12, block: 4, marked: [1, 5, 9] }));
                            askNever();
                        } else {
                            el.classList.add('nope');
                            feedback(fb, 'bad', `Child ${i}: ${shirtTag(at(sh, i))} T-shirt and ${cardTag(at(cd, i))} card. Not the same as child 1.`);
                        }
                    }
                });
                body.appendChild(s);
                body.appendChild(fb);
                function askNever() {
                    choice(body, {
                        question: `Does any child have a <b>striped</b> T-shirt and a ${cardTag('circle')} card?`,
                        options: ['Yes', 'No, never!'],
                        answer: 1,
                        right: `Circles are on 1, 5, 9, 13, ... (all odd). Striped T-shirts are on even numbers. They <b>never</b> meet! So the answer to "how many?" would be <b>0</b>.`,
                        wrong: () => 'Look at the picture. Which children have a circle? What T-shirt do they wear?',
                        onRight() {
                            callout(body, 'warn', 'Remember', 'Don\'t just multiply the two lengths. <b>Look</b> where both start again together. And sometimes a pair <b>never</b> happens!');
                            ctx.done();
                        }
                    });
                }
            }
        },
        {
            title: 'Watch out: children left over',
            render(body, ctx) {
                add(body, `<p class="big">Same row as before (block of 6), but now there are <b>64</b> children. 64 is not in the 6 times table!</p>`);
                add(body, blocksPicture(64, 6, isTarget));
                add(body, `<p>10 full blocks, and then a small piece that is not a full block.</p>`);
                numbers(body, {
                    template: '64 = [10] blocks × 6 + [4] left over',
                    right: '10 full blocks give us 10 children. But we must check the 4 left-over children too!',
                    hint: '10 × 6 = 60. How many more to get to 64?',
                    onRight() {
                        add(body, `<p>These are the 4 children left over. Click the ones with a <b>white</b> T-shirt and a ${cardTag('triangle')} card:</p>`);
                        pickMany(body, {
                            strip: { shirts: SHIRTS, cards: CARDS, from: 61, to: 64 },
                            answer: [63],
                            right: 'Child 63! So the answer is 10 + 1 = <b>11</b>.',
                            onRight: ctx.done
                        });
                    }
                });
            }
        },
        {
            title: 'The recipe',
            render(body, ctx) {
                add(body, `<p class="big">You learned a trick that works for <b>all</b> "two patterns" questions!</p>`);
                add(body, `<ol class="recipe">
                    <li><b>One pattern at a time.</b> How often does each one repeat?</li>
                    <li><b>Find the block.</b> Where do <b>both</b> start again at the same time?</li>
                    <li><b>Count in one block.</b> How many children do you want in one block?</li>
                    <li><b>Multiply.</b> Number of blocks × count in one block.</li>
                    <li><b>Check the leftovers!</b> Children after the last full block.</li>
                </ol>`);
                add(body, `<a class="btn btn-primary align-start" href="#/lesson/two-patterns/practice">Start practice</a>`);
                ctx.done();
            }
        }
    ];

    // ---------- Practice (from the preview PDF) ----------
    const S = (shirts, cards, n) => ({ shirts, cards, n });
    const practice = [
        {
            id: 'W1', part: 'Warm-up', points: 0,
            text: 'Children stand in a row. Their cards repeat like this: cross, circle, diamond, cross, circle, diamond, ... What shape is on the card of child number 12?',
            show: S(null, ['cross', 'circle', 'diamond'], 7),
            choices: ['cross', 'circle', 'diamond', 'star', 'square'], answer: 2,
            hint: 'The cards repeat every 3. Which children have a diamond? 3, 6, 9, ...',
            solution: 'The shapes repeat every 3 children. 12 is in the 3 times table, so child 12 is like child 3: <b>diamond</b>.'
        },
        {
            id: 'W2', part: 'Warm-up', points: 0,
            text: '24 children stand in a row. Their cards repeat like this: triangle, cross, diamond, triangle, cross, diamond, ... How many have a cross card?',
            draw: S(null, ['triangle', 'cross', 'diamond'], 9),
            choices: ['3', '5', '6', '7', '8'], answer: 4,
            hint: 'In every 3 children there is 1 cross. How many groups of 3 are in 24?',
            solution: 'In every 3 children there is one cross card. 24 ÷ 3 = <b>8</b>.'
        },
        {
            id: 'W3', part: 'Warm-up', points: 0,
            text: 'Here are the first 6 children of a row. How many of them have a <b>white</b> T-shirt <b>and</b> a <b>circle</b> card?',
            show: S(['white', 'dotted'], ['diamond', 'square', 'circle'], 6),
            choices: ['0', '1', '2', '4', '6'], answer: 1,
            hint: 'Put your finger on each child, one by one. Check BOTH things.',
            solution: 'Look at each child: only child number 3. So <b>1</b>.'
        },
        {
            id: 'W4', part: 'Warm-up', points: 0,
            text: 'Child 1 has a white T-shirt and a triangle card. Which is the <b>next</b> child with a white T-shirt and a triangle card?',
            show: S(['white', 'striped'], ['triangle', 'circle', 'diamond'], 8),
            choices: ['child 7', 'child 8', 'child 9', 'child 10', 'child 11'], answer: 0,
            hint: 'White T-shirts: 1, 3, 5, 7, ... Triangle cards: 1, 4, 7, ... Which number is in both lists?',
            solution: 'The T-shirt pattern starts again at 3, 5, 7, ... and the card pattern at 4, 7, 10, ... Both together: <b>child 7</b>.'
        },
        {
            id: 'W5', part: 'Warm-up', points: 0,
            text: 'In a row of 60 children, the children with a white T-shirt and a star card have the numbers 2, 8, 14, 20, ... (always 6 more). How many of them are there?',
            choices: ['6', '8', '9', '10', '20'], answer: 3,
            hint: 'One in every block of 6. How many blocks of 6 in 60?',
            solution: 'One in every block of 6: 60 ÷ 6 = <b>10</b>.'
        },
        {
            id: '1', part: 'Part A', points: 3,
            text: '60 children stand in a row. The T-shirts repeat like this: white, striped, white, striped, ... The cards repeat like this: circle, square, diamond, circle, square, diamond, ... How many children have a <b>striped</b> T-shirt <b>and</b> a <b>diamond</b> card?',
            draw: S(['white', 'striped'], ['circle', 'square', 'diamond'], 12), block: 6,
            choices: ['5', '8', '9', '10', '12'], answer: 3,
            hint: 'Make the table for 12 children. Where do both patterns start again?',
            solution: 'Both patterns start again together every 6 children. In each block of 6 only child number 6 (then 12, 18, ...) has a striped T-shirt and a diamond card. 60 ÷ 6 = 10 blocks, so <b>10</b>.'
        },
        {
            id: '2', part: 'Part A', points: 3,
            text: '70 children stand in a row. The T-shirts repeat like this: white, striped, white, striped, ... The cards repeat like this: circle, cross, diamond, triangle, square, circle, cross, ... How many children have a <b>striped</b> T-shirt <b>and</b> a <b>cross</b> card?',
            draw: S(['white', 'striped'], ['circle', 'cross', 'diamond', 'triangle', 'square'], 20), block: 10,
            choices: ['3', '4', '5', '6', '7'], answer: 4,
            hint: 'T-shirts repeat every 2, cards every 5. Write the children until child 1 comes back.',
            solution: 'Both patterns start again together every 10 children. In each block of 10 only child number 2 (then 12, 22, ...) has a striped T-shirt and a cross card. 70 ÷ 10 = 7 blocks, so <b>7</b>.'
        },
        {
            id: '3', part: 'Part B', points: 4,
            text: '50 children stand in a row. The T-shirts repeat like this: black, white, black, white, ... The cards repeat like this: triangle, diamond, square, triangle, diamond, square, ... How many children have a <b>black</b> T-shirt <b>and</b> a <b>triangle</b> card?',
            draw: S(['black', 'white'], ['triangle', 'diamond', 'square'], 12), block: 6,
            choices: ['6', '7', '8', '9', '16'], answer: 3,
            hint: '50 is not in the 6 times table! Don\'t forget the children left over.',
            solution: 'The patterns start again together every 6 children; in each block child number 1 matches. 50 = 8 × 6 + 2: 8 full blocks give 8, and in the 2 children left over child 49 matches too. 8 + 1 = <b>9</b>.'
        },
        {
            id: '4', part: 'Part B', points: 4,
            text: '73 children stand in a row. The T-shirts repeat like this: black, striped, dotted, black, striped, dotted, ... The cards repeat like this: square, triangle, circle, diamond, star, square, triangle, ... How many children have a <b>striped</b> T-shirt <b>and</b> a <b>star</b> card?',
            draw: S(['black', 'striped', 'dotted'], ['square', 'triangle', 'circle', 'diamond', 'star'], 15), block: 15,
            choices: ['5', '6', '7', '14', '24'], answer: 0,
            hint: 'T-shirts every 3, cards every 5. The block is longer this time. And check the leftovers!',
            solution: 'The patterns start again together every 15 children; in each block child number 5 matches. 73 = 4 × 15 + 13: 4 full blocks give 4, and in the 13 children left over child 65 matches too. 4 + 1 = <b>5</b>.'
        },
        {
            id: '5', part: 'Part B', points: 4,
            text: '60 children stand in a row. The T-shirts repeat like this: white, black, white, black, ... The cards repeat like this: circle, square, cross, circle, square, cross, ... What does child number <b>54</b> wear?',
            draw: S(['white', 'black'], ['circle', 'square', 'cross'], 12), block: 6,
            choices: ['black T-shirt, cross card', 'black T-shirt, square card', 'white T-shirt, circle card', 'white T-shirt, cross card', 'black T-shirt, circle card'], answer: 0,
            hint: 'Do one pattern at a time! Is 54 odd or even? Is 54 in the 3 times table?',
            solution: 'The T-shirts repeat every 2: 54 is even, so the T-shirt is the 2nd one: black. The cards repeat every 3: 54 = 18 × 3, so the card is the 3rd one: a cross. <b>Black T-shirt, cross card</b>.'
        },
        {
            id: '6', part: 'Part B', points: 4,
            text: '100 children stand in a row. The T-shirts repeat like this: dotted, black, white, dotted, black, white, ... The cards repeat like this: cross, triangle, diamond, star, cross, triangle, ... What does child number <b>94</b> wear?',
            draw: S(['dotted', 'black', 'white'], ['cross', 'triangle', 'diamond', 'star'], 12), block: 12,
            choices: ['white T-shirt, triangle card', 'dotted T-shirt, triangle card', 'dotted T-shirt, cross card', 'black T-shirt, triangle card', 'dotted T-shirt, diamond card'], answer: 1,
            hint: 'One pattern at a time. T-shirts every 3: 93 is in the 3 times table, so 94 is ...? Cards every 4: 92 is in the 4 times table, so 94 is ...?',
            solution: 'The T-shirts repeat every 3: 94 = 31 × 3 + 1, so the T-shirt is the 1st one: dotted. The cards repeat every 4: 94 = 23 × 4 + 2, so the card is the 2nd one: triangle. <b>Dotted T-shirt, triangle card</b>.'
        },
        {
            id: '7', part: 'Part B', points: 4,
            text: '100 children stand in a row. The T-shirts repeat like this: striped, dotted, striped, dotted, ... The cards repeat like this: square, circle, star, square, circle, star, ... Count only the children with a <b>striped</b> T-shirt and a <b>circle</b> card. Which number in the row does the <b>5th</b> of them have?',
            draw: S(['striped', 'dotted'], ['square', 'circle', 'star'], 12), block: 6,
            choices: ['23', '25', '28', '29', '30'], answer: 3,
            hint: 'Find the first one. Then the next ones come every block (6 more).',
            solution: 'The first one is child 5. The patterns start again together every 6 children, so the next ones are 11, 17, 23, ... The 5th: 5 + 4 × 6 = <b>29</b>.'
        },
        {
            id: '8', part: 'Part B', points: 4,
            text: '100 children stand in a row. The T-shirts repeat like this: striped, dotted, striped, dotted, ... The cards repeat like this: cross, diamond, square, circle, triangle, cross, diamond, ... Count only the children with a <b>dotted</b> T-shirt and a <b>triangle</b> card. Which number in the row does the <b>6th</b> of them have?',
            draw: S(['striped', 'dotted'], ['cross', 'diamond', 'square', 'circle', 'triangle'], 20), block: 10,
            choices: ['60', '61', '65', '70', '72'], answer: 0,
            hint: 'Find the first one. How long is the block? The next ones come one block later each time.',
            solution: 'The first one is child 10. The patterns start again together every 10 children, so the next ones are 20, 30, ... The 6th: 10 + 5 × 10 = <b>60</b>.'
        },
        {
            id: '9', part: 'Part C', points: 5,
            text: '28 children stand in a row. The T-shirts repeat like this: white, striped, white, striped, ... The cards repeat like this: circle, cross, triangle, star, circle, cross, ... How many children have a <b>striped</b> T-shirt and a <b>circle</b> card?',
            draw: S(['white', 'striped'], ['circle', 'cross', 'triangle', 'star'], 12), block: 4,
            choices: ['0', '3', '6', '7', '14'], answer: 0,
            hint: 'Careful! Is the block really 2 × 4 = 8? Write it down and look.',
            solution: 'Both patterns start again together already after 4 children (not 2 × 4 = 8). In each block of 4 no child has a striped T-shirt and a circle card, so the answer is <b>0</b>.'
        },
        {
            id: '10', part: 'Part C', points: 5,
            text: '24 children stand in a row. The T-shirts repeat like this: black, white, dotted, striped, black, white, ... The cards repeat like this: star, triangle, star, triangle, ... How many children have a <b>striped</b> T-shirt and a <b>star</b> card?',
            draw: S(['black', 'white', 'dotted', 'striped'], ['star', 'triangle'], 12), block: 4,
            choices: ['0', '1', '3', '6', '12'], answer: 0,
            hint: 'Where are the striped T-shirts? 4, 8, 12, ... Where are the stars? Do they ever meet?',
            solution: 'Both patterns start again together already after 4 children (not 4 × 2 = 8). In each block of 4 no child has a striped T-shirt and a star card, so the answer is <b>0</b>.'
        },
        {
            id: '11', part: 'Part C', points: 5,
            text: 'A big lamp flashes every 2 seconds and a small lamp flashes every 5 seconds. They flash together right at the start. How many times do they flash <b>together</b> in the next 50 seconds? (Count a flash exactly at second 50, but not the one at the start.)',
            lamps: [2, 5, 20],
            choices: ['1', '2', '3', '4', '5'], answer: 4,
            hint: 'Same trick, with time! Big lamp: 2, 4, 6, ... Small lamp: 5, 10, 15, ... When do they first flash together?',
            solution: 'The big lamp flashes at 2, 4, 6, ... and the small one at 5, 10, 15, ... The first time both flash is at second 10, then every 10 seconds. 50 ÷ 10 = <b>5</b>.'
        },
        {
            id: '12', part: 'Part C', points: 5,
            text: 'A big lamp flashes every 4 seconds and a small lamp flashes every 6 seconds. They flash together right at the start. How many times do they flash <b>together</b> in the next 72 seconds? (Count a flash exactly at second 72, but not the one at the start.)',
            lamps: [4, 6, 24],
            choices: ['6', '7', '12', '18', '30'], answer: 0,
            hint: 'Is it really 4 × 6 = 24? Write the lists: 4, 8, 12, ... and 6, 12, ...',
            solution: 'The big lamp flashes at 4, 8, 12, ... and the small one at 6, 12, 18, ... The first time both flash is at second 12 (not 4 × 6 = 24), then every 12 seconds. 72 ÷ 12 = <b>6</b>.'
        }
    ];

    window.MK.register({
        id: 'two-patterns',
        title: 'Two patterns at once',
        topic: 'Patterns',
        color: '#333',
        summary: 'T-shirts and cards both repeat. Find the block where both start again, count in it, multiply.',
        source: {
            label: 'Math Kangaroo 2024 · Ecolier (Grade 3–4) · Q19',
            pdf: 'set-01/by_level/Grade_03-04_Ecolier/y2024_q19.pdf'
        },
        steps,
        practice,
        practiceIntro: 'Use the recipe: one pattern at a time, find the block, count, multiply, check leftovers.',
        figure(q, el) {
            if (q.show) el.appendChild(strip({ shirts: q.show.shirts, cards: q.show.cards, to: q.show.n, size: 54 }));
        },
        helper(q) {
            if (q.lamps) return { label: 'Show me the lamps', draw: el => el.appendChild(lamps(q.lamps[0], q.lamps[1], q.lamps[2])) };
            if (q.draw) return {
                label: 'Show me the picture',
                draw: el => el.appendChild(strip({ shirts: q.draw.shirts, cards: q.draw.cards, to: q.draw.n, block: q.block, size: 54, more: '...' }))
            };
            return null;
        }
    });
})();
