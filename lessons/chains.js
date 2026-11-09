// Lesson: counting chains with a tree (Math Kangaroo 2024, Ecolier, Q14).
(function () {
    const { add, choice, pencil, numbers, callout, feedback, praise } = window.UI;

    // ---------- pieces ----------
    // A piece has a peg on its left and a hole on its right. Shapes: c = round, s = square, t = triangle.
    const SHAPE_NAME = { c: 'round', s: 'square', t: 'triangle' };
    const ROLE = {
        caterpillar: { start: 'head', end: 'tail', part: 'part', parts: 'parts', chain: 'caterpillar', chains: 'caterpillars' },
        train: { start: 'engine', end: 'last wagon', part: 'wagon', parts: 'wagons', chain: 'train', chains: 'trains' }
    };

    // SVG for one piece. role: 'start' | 'part' | 'end'
    function pieceSVG(theme, role, peg, hole, label, opts = {}) {
        const w = opts.size || 84;
        const cy = theme === 'train' ? 26 : 28;
        let body = '';
        if (theme === 'caterpillar') {
            body = `<circle cx="40" cy="${cy}" r="20" fill="#dcdcdc" stroke="#333" stroke-width="1.5"/>`;
            if (role === 'start') body += `<circle cx="34" cy="${cy - 7}" r="2.2" fill="#333"/><path d="M28,${cy + 5} q6,7 13,1" fill="none" stroke="#333" stroke-width="1.5"/>`;
            if (role === 'end') body = `<polygon points="58,${cy - 7} 72,${cy} 58,${cy + 7}" fill="#dcdcdc" stroke="#333" stroke-width="1.5"/>` + body;
        } else {
            body = `<rect x="20" y="12" width="40" height="28" fill="#dcdcdc" stroke="#333" stroke-width="1.5"/>
                <circle cx="29" cy="44" r="4.5" fill="#333"/><circle cx="51" cy="44" r="4.5" fill="#333"/>`;
            if (role === 'start') body += `<rect x="24" y="3" width="7" height="9" fill="#dcdcdc" stroke="#333" stroke-width="1.5"/><rect x="26" y="17" width="10" height="8" fill="#fff" stroke="#333" stroke-width="1.2"/>`;
            if (role === 'end') body += `<line x1="54" y1="12" x2="54" y2="0" stroke="#333" stroke-width="1.5"/><polygon points="54,0 63,3 54,6" fill="#333"/>`;
        }
        let pegSVG = '';
        if (peg === 'c') pegSVG = `<circle cx="14" cy="${cy}" r="5.5" fill="#dcdcdc" stroke="#333" stroke-width="1.5"/>`;
        if (peg === 's') pegSVG = `<rect x="9" y="${cy - 5.5}" width="11" height="11" fill="#dcdcdc" stroke="#333" stroke-width="1.5"/>`;
        if (peg === 't') pegSVG = `<polygon points="7,${cy} 20,${cy - 7} 20,${cy + 7}" fill="#dcdcdc" stroke="#333" stroke-width="1.5"/>`;
        let holeSVG = '';
        if (hole === 'c') holeSVG = `<circle cx="57" cy="${cy}" r="5.5" fill="#fff" stroke="#333" stroke-width="1.5"/>`;
        if (hole === 's') holeSVG = `<rect x="49" y="${cy - 5.5}" width="11" height="11" fill="#fff" stroke="#333" stroke-width="1.5"/>`;
        if (hole === 't') holeSVG = `<polygon points="47,${cy} 60,${cy - 7} 60,${cy + 7}" fill="#fff" stroke="#333" stroke-width="1.5"/>`;
        if (hole) holeSVG += `<rect x="60.2" y="${cy - 7.5}" width="6" height="15" fill="#fff"/>`;
        const text = label ? `<text x="${hole === 's' || hole === 't' ? 37 : 39}" y="${cy + 5}" text-anchor="middle" font-size="15" font-weight="700" fill="#222">${label}</text>` : '';
        return `<svg viewBox="0 0 76 52" width="${w}" height="${w * 52 / 76}" aria-hidden="true">${pegSVG}${body}${holeSVG}${text}</svg>`;
    }

    // A set of pieces: { theme, start: {hole}, end: {peg}, parts: [{n, name?, peg, hole}], maxLen }
    function startSVG(set, o) { return pieceSVG(set.theme, 'start', null, set.start.hole, '', o); }
    function endSVG(set, o) { return pieceSVG(set.theme, 'end', set.end.peg, null, '', o); }
    function partSVG(set, p, o) { return pieceSVG(set.theme, 'part', p.peg, p.hole, p.n, o); }

    function pieceRow(set, opts = {}) {
        const r = ROLE[set.theme];
        const wrap = document.createElement('div');
        wrap.className = 'pieces';
        const cell = (svg, label) => `<div class="piece-cell">${svg}<span>${label}</span></div>`;
        wrap.innerHTML = cell(startSVG(set), r.start) +
            set.parts.map(p => cell(partSVG(set, p), p.name || `${r.part} ${p.n}`)).join('') +
            cell(endSVG(set), r.end);
        return wrap;
    }

    // ---------- solver ----------
    const holeOf = (set, path) => path.length ? set.parts.find(p => p.n === path[path.length - 1]).hole : set.start.hole;
    function nextParts(set, path) {
        if (set.maxLen && path.length >= set.maxLen) return [];
        const h = holeOf(set, path);
        return set.parts.filter(p => p.peg === h && !path.includes(p.n));
    }
    const canEnd = (set, path) => path.length > 0 && set.end.peg === holeOf(set, path);
    function allChains(set, first) {
        const out = [];
        const walk = path => {
            if (canEnd(set, path)) out.push(path.slice());
            nextParts(set, path).forEach(p => walk([...path, p.n]));
        };
        if (first) walk([first]); else walk([]);
        return out;
    }
    const chainText = (set, path) => {
        const r = ROLE[set.theme];
        return [r.start, ...path.map(n => (set.parts.find(p => p.n === n).name || n)), r.end].join(' – ');
    };

    // ---------- interactive tree ----------
    // Click a box to grow its branches. opts: { first, expandAll, onCount(n) }
    function tree(container, set, opts = {}) {
        const r = ROLE[set.theme];
        const wrap = add(container, `<div class="tree-wrap">
            <div class="tree-bar"><span class="tree-count">Finished ${r.chains}: <b>0</b></span>
            <button type="button" class="btn-random tree-all">Grow everything</button></div>
            <div class="tree"></div></div>`);
        const root = wrap.querySelector('.tree');
        let found = 0;
        const counter = wrap.querySelector('.tree-count b');
        const nameOf = n => set.parts.find(p => p.n === n).name || `${r.part} ${n}`;

        function node(parent, label, path, kind) {
            const n = add(parent, `<div class="tnode"><div class="tline"><button type="button" class="tbox ${kind}">${label}</button></div><div class="tkids"></div></div>`);
            const box = n.querySelector('.tbox');
            const kids = n.querySelector('.tkids');
            if (kind === 'end') {
                found++;
                counter.textContent = found;
                box.disabled = true;
                add(n.querySelector('.tline'), `<span class="tnote good">= ${r.chain} ${found}</span>`);
                opts.onCount && opts.onCount(found);
                return n;
            }
            box.title = 'Click to see what can come next';
            box.addEventListener('click', () => grow(n, path), { once: true });
            n._grow = () => grow(n, path);
            return n;

            function grow(nodeEl, p) {
                if (nodeEl._grown) return;
                nodeEl._grown = true;
                box.classList.add('grown');
                const parts = nextParts(set, p);
                const end = canEnd(set, p);
                if (!parts.length && !end) {
                    add(n.querySelector('.tline'), `<span class="tnote bad">stuck — nothing fits</span>`);
                    return;
                }
                if (end) node(kids, r.end, p, 'end');
                parts.forEach(pt => node(kids, nameOf(pt.n), [...p, pt.n], 'part'));
            }
        }

        let top;
        if (opts.first) {
            top = node(root, r.start, [], 'start');
            top._grown = true;
            top.querySelector('.tbox').classList.add('grown');
            node(top.querySelector('.tkids'), nameOf(opts.first), [opts.first], 'part');
        } else {
            top = node(root, r.start, [], 'start');
        }
        const growAll = () => {
            let again = true;
            while (again) {
                again = false;
                wrap.querySelectorAll('.tnode').forEach(t => { if (t._grow && !t._grown) { t._grow(); again = true; } });
            }
        };
        wrap.querySelector('.tree-all').addEventListener('click', e => { growAll(); e.target.remove(); });
        if (opts.expandAll) { growAll(); wrap.querySelector('.tree-all').remove(); }
        return wrap;
    }

    // ---------- the contest pieces ----------
    const LUCAS = {
        theme: 'caterpillar',
        start: { hole: 'c' },
        end: { peg: 's' },
        parts: [
            { n: 'A', name: 'apple', peg: 's', hole: 's' },
            { n: 'C', name: 'cherry', peg: 'c', hole: 's' },
            { n: 'G', name: 'grape', peg: 'c', hole: 'c' }
        ]
    };

    // Click pieces to select them. answer = array of piece ids ('end' for the end piece).
    function pickPieces(container, set, opts) {
        const r = ROLE[set.theme];
        const chosen = new Set();
        const row = add(container, `<div class="pieces"></div>`);
        const items = [...set.parts.map(p => ({ id: p.n, svg: partSVG(set, p), label: p.name || `${r.part} ${p.n}` })),
            { id: 'end', svg: endSVG(set), label: r.end }];
        items.forEach(it => {
            const b = add(row, `<button type="button" class="piece-cell pick">${it.svg}<span>${it.label}</span></button>`);
            b.addEventListener('click', () => {
                if (done) return;
                chosen.has(it.id) ? chosen.delete(it.id) : chosen.add(it.id);
                b.classList.toggle('picked');
            });
        });
        let done = false;
        const btn = add(container, `<button type="button" class="btn-random">Check</button>`);
        const fb = add(container, `<div class="feedback"></div>`);
        btn.addEventListener('click', () => {
            const want = opts.answer;
            const extra = [...chosen].filter(i => !want.includes(i));
            const missing = want.filter(i => !chosen.has(i));
            if (!extra.length && !missing.length) {
                done = true; btn.remove();
                feedback(fb, 'good', `<b>${praise()}</b> ${opts.right}`);
                opts.onRight && opts.onRight();
            } else if (extra.length) {
                feedback(fb, 'bad', opts.wrong(extra[0]));
            } else {
                feedback(fb, 'bad', 'You missed one. Check every piece: look at its peg on the left.');
            }
        });
    }

    // "What can come next" table: one row per piece, click the pieces that fit after it.
    function nextTable(container, set, onRight) {
        const r = ROLE[set.theme];
        const rows = [{ id: null, label: r.start, hole: set.start.hole, path: [] },
            ...set.parts.map(p => ({ id: p.n, label: p.name, hole: p.hole, path: [p.n] }))];
        const options = [...set.parts.map(p => ({ id: p.n, label: p.name })), { id: 'end', label: r.end }];
        const table = add(container, `<table class="fit-table"><thead><tr><th>Piece</th><th>Its hole</th><th>What can come next? (click)</th></tr></thead><tbody></tbody></table>`);
        const tbody = table.querySelector('tbody');
        const state = rows.map(() => new Set());
        rows.forEach((row, ri) => {
            const tr = add(tbody, `<tr><td><b>${row.label}</b></td><td>${SHAPE_NAME[row.hole]}</td><td class="chips"></td></tr>`);
            const td = tr.querySelector('.chips');
            options.filter(o => o.id !== row.id).forEach(o => {
                const b = add(td, `<button type="button" class="chip">${o.label}</button>`);
                b.addEventListener('click', () => {
                    state[ri].has(o.id) ? state[ri].delete(o.id) : state[ri].add(o.id);
                    b.classList.toggle('on');
                });
            });
        });
        const btn = add(container, `<button type="button" class="btn-random">Check my table</button>`);
        const fb = add(container, `<div class="feedback"></div>`);
        btn.addEventListener('click', () => {
            for (let ri = 0; ri < rows.length; ri++) {
                const row = rows[ri];
                const want = set.parts.filter(p => p.peg === row.hole && p.n !== row.id).map(p => p.n);
                if (row.id && set.end.peg === row.hole) want.push('end');
                const got = state[ri];
                const ok = want.length === got.size && want.every(w => got.has(w));
                if (!ok) {
                    feedback(fb, 'bad', `Look at the <b>${row.label}</b> row again. Its hole is <b>${SHAPE_NAME[row.hole]}</b>. Which pieces have a ${SHAPE_NAME[row.hole]} peg?`);
                    return;
                }
            }
            btn.remove();
            table.querySelectorAll('.chip').forEach(c => c.disabled = true);
            feedback(fb, 'good', `<b>${praise()}</b> Your table is right. Now we never have to look at the pictures again!`);
            onRight && onRight();
        });
    }

    // Build caterpillars by clicking pieces.
    function builder(container, set, onFound) {
        const r = ROLE[set.theme];
        const wrap = add(container, `<div class="builder">
            <div class="chain"></div>
            <div class="small">Click a piece to put it at the end:</div>
            <div class="pieces palette"></div>
            <div class="btn-row"><button type="button" class="btn-random b-undo">Undo</button><button type="button" class="btn-random b-reset">Start again</button></div>
            <div class="feedback"></div>
            <div class="found"></div>
        </div>`);
        const chainEl = wrap.querySelector('.chain');
        const pal = wrap.querySelector('.palette');
        const fb = wrap.querySelector('.feedback');
        const foundEl = wrap.querySelector('.found');
        let path = [];
        const found = [];
        function draw() {
            chainEl.innerHTML = startSVG(set, { size: 90 }) + path.map(n => partSVG(set, set.parts.find(p => p.n === n), { size: 90 })).join('');
            pal.innerHTML = '';
            set.parts.filter(p => !path.includes(p.n)).forEach(p => {
                const b = add(pal, `<button type="button" class="piece-cell pick">${partSVG(set, p)}<span>${p.name}</span></button>`);
                b.addEventListener('click', () => tryAdd(p));
            });
            const e = add(pal, `<button type="button" class="piece-cell pick">${endSVG(set)}<span>${r.end}</span></button>`);
            e.addEventListener('click', () => tryEnd());
        }
        function tryAdd(p) {
            const h = holeOf(set, path);
            if (p.peg !== h) {
                feedback(fb, 'bad', `That doesn't fit. The hole is <b>${SHAPE_NAME[h]}</b>, but the ${p.name} has a <b>${SHAPE_NAME[p.peg]}</b> peg.`);
                return;
            }
            path.push(p.n);
            fb.className = 'feedback';
            draw();
        }
        function tryEnd() {
            const h = holeOf(set, path);
            if (!path.length) { feedback(fb, 'bad', `A ${r.chain} needs at least one middle piece.`); return; }
            if (set.end.peg !== h) {
                feedback(fb, 'bad', `The ${r.end} has a <b>${SHAPE_NAME[set.end.peg]}</b> peg, but the hole is <b>${SHAPE_NAME[h]}</b>.`);
                return;
            }
            const t = chainText(set, path);
            if (found.includes(t)) {
                feedback(fb, 'bad', `You already have that one! Try to make a different ${r.chain}.`);
            } else {
                found.push(t);
                feedback(fb, 'good', `<b>${praise()}</b> A finished ${r.chain}!`);
                foundEl.innerHTML = `<b>Found so far: ${found.length}</b><ol>${found.map(f => `<li>${f}</li>`).join('')}</ol>`;
                onFound && onFound(found.length);
            }
            path = [];
            draw();
        }
        wrap.querySelector('.b-undo').addEventListener('click', () => { path.pop(); fb.className = 'feedback'; draw(); });
        wrap.querySelector('.b-reset').addEventListener('click', () => { path = []; fb.className = 'feedback'; draw(); });
        draw();
    }

    const steps = [
        {
            title: 'The puzzle',
            render(body, ctx) {
                add(body, `<p class="big">Lucas has a head, a tail and three middle pieces: <b>apple (A)</b>, <b>cherry (C)</b> and <b>grape (G)</b>.</p>`);
                body.appendChild(pieceRow(LUCAS));
                add(body, `<p>A peg (the bump on the left) only fits into a hole (on the right) of the <b>same shape</b>. A caterpillar is the head, then some middle pieces, then the tail. Each piece can be used only once.</p>`);
                callout(body, 'question', 'The question', 'How many different caterpillars can Lucas build?');
                pencil(body, {
                    task: 'Write down your <b>guess</b> on paper.',
                    button: 'I wrote my guess',
                    reveal(r) { r.innerHTML = `<p class="ok-note">Keep that paper. Let's find out!</p>`; ctx.done(); }
                });
            }
        },
        {
            title: 'How pieces fit',
            render(body, ctx) {
                add(body, `<p class="big">Look at the <b>right side</b> of a piece: that is its hole. The next piece needs a <b>peg of the same shape</b> on its left side.</p>`);
                const ex = add(body, `<div class="fit-examples"></div>`);
                const head = startSVG(LUCAS, { size: 90 });
                add(ex, `<div class="fit-ex good"><div class="joined plug">${head}${partSVG(LUCAS, LUCAS.parts[1], { size: 90 })}</div><span>round hole + round peg: <b>fits</b></span></div>`);
                add(ex, `<div class="fit-ex bad"><div class="joined">${head}${partSVG(LUCAS, LUCAS.parts[0], { size: 90 })}</div><span>round hole + square peg: <b>does not fit</b></span></div>`);
                add(body, `<p>The head has a <b>round</b> hole. Click <b>every</b> piece that can go right after the head, then press Check.</p>`);
                pickPieces(body, LUCAS, {
                    answer: ['C', 'G'],
                    right: 'Cherry and grape both have a round peg.',
                    wrong: id => id === 'end' ? 'The tail has a square peg. And a caterpillar needs a middle piece!' : 'The apple has a <b>square</b> peg. The head\'s hole is round.',
                    onRight: ctx.done
                });
            }
        },
        {
            title: 'Make a "what comes next" list',
            render(body, ctx) {
                add(body, `<p class="big">Before building anything, make a list: for <b>each piece</b>, what can come right after it?</p>`);
                body.appendChild(pieceRow(LUCAS));
                pencil(body, {
                    task: `Draw this table on paper and fill in the last column:
                        <table class="fit-table paper"><tr><th>Piece</th><th>Its hole</th><th>What can come next</th></tr>
                        <tr><td>head</td><td></td><td></td></tr><tr><td>apple</td><td></td><td></td></tr>
                        <tr><td>cherry</td><td></td><td></td></tr><tr><td>grape</td><td></td><td></td></tr></table>
                        <p class="small">Remember: a piece can't come after itself, because each piece is used only once.</p>`,
                    reveal(r) {
                        add(r, `<p>Now click your answers into the table to check them:</p>`);
                        nextTable(r, LUCAS, ctx.done);
                    }
                });
            }
        },
        {
            title: 'Try building some',
            render(body, ctx) {
                add(body, `<p class="big">Let's build caterpillars! Start at the head and add pieces that fit, until you add the tail.</p>`);
                let told = false;
                builder(body, LUCAS, n => {
                    if (n >= 2 && !told) {
                        told = true;
                        callout(body, 'idea', 'But wait…', `You found ${n}. Are there more? How can you be <b>sure</b> you didn't miss one? Trying pieces in any order is how people miss one or count one twice. The next step shows a way to be sure.`);
                        ctx.done();
                    }
                });
            }
        },
        {
            title: 'Grow a tree',
            render(body, ctx) {
                add(body, `<p class="big">To be sure, we grow a <b>tree</b>. Start at the head. Write every piece that can come next as a new branch. Then do the same for each branch.</p>`);
                pencil(body, {
                    task: `Draw the tree on paper. Use your "what comes next" list!
                        <p class="small">Start: write <b>head</b> on the left. Draw a line to each piece that can come next. Keep going until every branch ends with the <b>tail</b> or gets stuck.</p>`,
                    button: 'I drew my tree — let me grow it here',
                    reveal(r) {
                        add(r, `<p>Click a box to grow its branches. Does it match your paper?</p>`);
                        let doneOnce = false;
                        tree(r, LUCAS, {
                            onCount(n) {
                                if (n === 4 && !doneOnce) {
                                    doneOnce = true;
                                    add(r, `<p class="ok-note">Every branch ends with a tail. The tree is finished.</p>`);
                                    ctx.done();
                                }
                            }
                        });
                    }
                });
            }
        },
        {
            title: 'Count the tails',
            render(body, ctx) {
                add(body, `<p class="big">Every branch that ends with a <b>tail</b> is one caterpillar.</p>`);
                tree(body, LUCAS, { expandAll: true });
                numbers(body, {
                    template: 'Lucas can build [4] caterpillars.',
                    right: 'Look at your guess from the beginning. Were you close?',
                    hint: 'Count the green "= caterpillar" notes.',
                    onRight: ctx.done
                });
            }
        },
        {
            title: 'Watch out: dead ends',
            render(body, ctx) {
                const ANNA = {
                    theme: 'train', start: { hole: 's' }, end: { peg: 't' },
                    parts: [{ n: '1', peg: 'c', hole: 's' }, { n: '2', peg: 's', hole: 't' }, { n: '3', peg: 's', hole: 'c' }, { n: '4', peg: 't', hole: 's' }]
                };
                add(body, `<p class="big">Sometimes a branch gets <b>stuck</b>: nothing fits and it never reaches the end. That is a <b>dead end</b>. Don't count it!</p>`);
                add(body, `<p>Anna has an engine, a last wagon and 4 wagons:</p>`);
                body.appendChild(pieceRow(ANNA));
                pencil(body, {
                    task: 'Draw the tree for Anna\'s trains on paper. Cross out pieces you already used on a branch.',
                    button: 'I drew it — show me',
                    reveal(r) {
                        tree(r, ANNA, { expandAll: true });
                        choice(r, {
                            question: 'Which wagon is <b>never</b> part of a finished train?',
                            options: ['wagon 1', 'wagon 2', 'wagon 3', 'wagon 4'],
                            answer: 3,
                            right: 'Wagon 4 only appears on branches that get stuck. So it is never in a finished train.',
                            wrong: () => 'Look only at the branches that end with the last wagon. Which wagons are on them?',
                            onRight() {
                                callout(r, 'warn', 'Remember', 'Each piece can be used <b>only once</b> in a chain, so cross out pieces you already used on that branch. Count only branches that reach the end.');
                                ctx.done();
                            }
                        });
                    }
                });
            }
        },
        {
            title: 'The recipe',
            render(body, ctx) {
                add(body, `<p class="big">This works for every "how many chains" question:</p>`);
                add(body, `<ol class="recipe">
                    <li><b>Make the list.</b> For each piece: what can come right after it?</li>
                    <li><b>Grow a tree</b> from the start. Every piece that fits is a new branch.</li>
                    <li><b>Cross out</b> pieces already used on that branch.</li>
                    <li><b>Stuck?</b> That branch is a dead end. Don't count it.</li>
                    <li><b>Count</b> the branches that reach the end.</li>
                </ol>`);
                pencil(body, {
                    task: 'Copy these 5 steps into your notebook. Then go to <b>Practice</b>.',
                    button: 'I copied it',
                    reveal(r) {
                        r.innerHTML = `<a class="btn btn-primary" href="#/lesson/chains/practice">Start practice</a>`;
                        ctx.done();
                    }
                });
            }
        }
    ];

    // ---------- practice (from the preview PDF) ----------
    const cat = (hole, end, parts, maxLen) => ({ theme: 'caterpillar', start: { hole }, end: { peg: end }, parts: parts.map((x, i) => ({ n: String(i + 1), peg: x[0], hole: x[1] })), maxLen });
    const trn = (hole, end, parts, maxLen) => ({ ...cat(hole, end, parts, maxLen), theme: 'train' });
    const lone = (theme, ph, n) => pieceSVG(theme, 'part', ph[0], ph[1], n, { size: 64 });

    const RULES = (r, max) => `A peg fits only into a hole of the <b>same shape</b>, and the pieces cannot be turned around. A ${r.chain} is the ${r.start}, then ${max} ${r.parts}, then the ${r.end}. Each piece can be used only once.`;

    const practice = [
        {
            id: 'W1', part: 'Warm-up', points: 0,
            text: 'A peg fits only into a hole of the <b>same shape</b>. Which piece can go right after the head?',
            figureHTML: () => `<div class="pieces"><div class="piece-cell">${pieceSVG('caterpillar', 'start', null, 's', '')}<span>head</span></div></div>`,
            choices: [['s', 's'], ['t', 'c'], ['c', 'c'], ['c', 's'], ['c', 't']].map(x => lone('caterpillar', x, '')), answer: 0,
            hint: 'Look at the head\'s hole. Which piece has a peg of that shape on its LEFT side?',
            solution: 'The head has a square hole, so the next piece needs a square peg on its left: <b>A</b>.'
        },
        {
            id: 'W2', part: 'Warm-up', points: 0,
            text: 'How many of the other pieces (also the tail) could go right after part 4?',
            set: cat('s', 'c', [['s', 's'], ['c', 'c'], ['s', 'c'], ['c', 's']]),
            choices: ['0', '1', '2', '3', '4'], answer: 2,
            hint: 'What shape is part 4\'s hole? Now count the pieces with that peg.',
            solution: 'Part 4 has a square hole. Count the pieces with a square peg: parts 1 and 3. So <b>2</b>.'
        },
        {
            id: 'W3', part: 'Warm-up', points: 0,
            text: 'Lucas has these pieces. ' + RULES(ROLE.train, '1 or 2') + ' How many different trains can Lucas build?',
            set: trn('s', 'c', [['s', 'c'], ['s', 's']]), tree: true,
            choices: ['0', '1', '2', '3', '4'], answer: 2,
            hint: 'Start at the engine. Which wagons fit? Grow the tree.',
            solution: 'engine – 1 – last wagon, and engine – 2 – 1 – last wagon. That is <b>2</b>.'
        },
        {
            id: 'W4', part: 'Warm-up', points: 0,
            text: 'Tom has these pieces. ' + RULES(ROLE.train, '1, 2 or 3') + ' Tom puts <b>wagon 3</b> right after the engine. How many ways are there to finish?',
            set: trn('c', 's', [['s', 's'], ['c', 's'], ['c', 'c']]), tree: true, first: '3',
            choices: ['1', '2', '3', '4', '5'], answer: 1,
            hint: 'You only need ONE branch of the tree: the one that starts with wagon 3.',
            solution: 'Follow only this branch: engine – 3 – 2 – last wagon, and engine – 3 – 2 – 1 – last wagon. That is <b>2</b>.'
        },
        {
            id: '1', part: 'Part A', points: 3,
            text: 'Tom has these pieces. ' + RULES(ROLE.caterpillar, '1, 2, 3 or 4') + ' How many different caterpillars can Tom build?',
            set: cat('c', 't', [['c', 't'], ['t', 't'], ['t', 's'], ['s', 't']]), tree: true,
            choices: ['5', '6', '7', '8', '10'], answer: 0,
            hint: 'Make the "what comes next" list first. Then grow the tree from the head.',
            solution: 'head–1–tail, head–1–2–tail, head–1–2–3–4–tail, head–1–3–4–tail, head–1–3–4–2–tail. That is <b>5</b>.'
        },
        {
            id: '2', part: 'Part A', points: 3,
            text: 'Leo has these pieces. ' + RULES(ROLE.train, '1, 2, 3 or 4') + ' How many different trains can Leo build?',
            set: trn('c', 's', [['c', 's'], ['t', 's'], ['s', 'c'], ['c', 'c'], ['s', 't']], 4), tree: true,
            choices: ['1', '2', '3', '4', '6'], answer: 3,
            hint: 'Grow the tree. Some branches get stuck — don\'t count those.',
            solution: 'engine–1–last, engine–1–5–2–last, engine–4–1–last, engine–4–1–5–2–last. That is <b>4</b>.'
        },
        {
            id: '3', part: 'Part B', points: 4,
            text: 'Leo has these pieces. ' + RULES(ROLE.caterpillar, '1, 2, 3 or 4') + ' How many different caterpillars with <b>exactly 2</b> parts can Leo build?',
            set: cat('c', 't', [['c', 't'], ['t', 't'], ['t', 'c'], ['c', 'c']]), tree: true,
            choices: ['0', '1', '2', '3', '4'], answer: 2,
            hint: 'Grow the tree only 2 parts deep. After 2 parts, the tail must come.',
            solution: 'head–1–2–tail and head–4–1–tail. That is <b>2</b>.'
        },
        {
            id: '4', part: 'Part B', points: 4,
            text: 'Emma has these pieces. ' + RULES(ROLE.train, '1, 2, 3, 4 or 5') + ' How many different trains with <b>exactly 4</b> wagons can Emma build?',
            set: trn('s', 't', [['c', 't'], ['t', 'c'], ['s', 'c'], ['t', 's'], ['s', 't']]), tree: true,
            choices: ['0', '2', '3', '4', '5'], answer: 1,
            hint: 'Grow the whole tree, then count only the trains with 4 wagons.',
            solution: 'engine–3–1–4–5–last and engine–5–4–3–1–last. That is <b>2</b>.'
        },
        {
            id: '5', part: 'Part B', points: 4,
            text: 'Anna has these pieces. ' + RULES(ROLE.train, '1, 2, 3 or 4') + ' Which wagon can <b>never</b> be part of one of Anna\'s trains?',
            set: trn('s', 't', [['c', 's'], ['s', 't'], ['s', 'c'], ['t', 's']]), tree: true,
            choices: ['wagon 1', 'wagon 2', 'wagon 3', 'wagon 4', 'each wagon can be used'], answer: 3,
            hint: 'Find ALL trains with a tree. Which wagon is missing from every one of them?',
            solution: 'The trains are engine–2–last and engine–3–1–2–last. <b>Wagon 4</b> is in none of them: it only appears on branches that get stuck.'
        },
        {
            id: '6', part: 'Part B', points: 4,
            text: 'Tom has these pieces. ' + RULES(ROLE.caterpillar, '1, 2, 3, 4 or 5') + ' Which part can <b>never</b> be part of one of Tom\'s caterpillars?',
            set: cat('s', 't', [['t', 'c'], ['c', 'c'], ['s', 'c'], ['t', 't'], ['c', 't']]), tree: true,
            choices: ['part 1', 'part 2', 'part 3', 'part 4', 'part 5'], answer: 0,
            hint: 'Grow the tree from the head. Which part never shows up on a finished branch?',
            solution: 'head–3–2–5–tail, head–3–2–5–4–tail, head–3–5–tail, head–3–5–4–tail. <b>Part 1</b> is in none of them.'
        },
        {
            id: '7', part: 'Part C', points: 5,
            text: 'Lucas has these pieces. ' + RULES(ROLE.train, '1, 2, 3 or 4') + ' Now Lucas can build 1 train. Lucas gets one more wagon (number 4) and then can build <b>exactly 4</b>. Which wagon did Lucas get?',
            set: trn('t', 's', [['t', 'c'], ['s', 't'], ['c', 's']]), tree: true,
            extra: [['s', 's'], ['c', 't'], ['t', 't'], ['s', 'c'], ['t', 's']],
            choices: [['s', 's'], ['c', 't'], ['t', 't'], ['s', 'c'], ['t', 's']].map(x => lone('train', x, '4')), answer: 4,
            hint: 'Try each new wagon one at a time: add it to your list and grow the tree again. Which one gives exactly 4?',
            solution: 'With wagon E: engine–1–3–last, engine–1–3–2–4–last, engine–4–last, engine–4–2–1–3–last. That is <b>4</b>, so the answer is <b>E</b>.'
        },
        {
            id: '8', part: 'Part C', points: 5,
            text: 'Leo has these pieces. ' + RULES(ROLE.caterpillar, '1, 2, 3, 4 or 5') + ' Now Leo can build 2 caterpillars. Leo gets one more part (number 5) and then can build <b>exactly 6</b>. Which part did Leo get?',
            set: cat('t', 's', [['c', 's'], ['c', 't'], ['t', 'c'], ['s', 's']]), tree: true,
            extra: [['s', 'c'], ['s', 't'], ['c', 'c'], ['t', 's'], ['t', 't']],
            choices: [['s', 'c'], ['s', 't'], ['c', 'c'], ['t', 's'], ['t', 't']].map(x => lone('caterpillar', x, '5')), answer: 3,
            hint: 'Try each new part one at a time. A good start: which new parts could even go right after the head?',
            solution: 'With part D: head–3–1–tail, head–3–1–4–tail, head–3–2–5–tail, head–3–2–5–4–tail, head–5–tail, head–5–4–tail. That is <b>6</b>, so the answer is <b>D</b>.'
        },
        {
            id: '9', part: 'Part C', points: 5,
            text: 'Tom has these pieces. ' + RULES(ROLE.train, '1, 2, 3 or 4') + ' Tom has already put <b>wagon 4</b> right after the engine. In how many different ways can Tom finish the train?',
            set: trn('s', 't', [['t', 't'], ['t', 's'], ['s', 't'], ['s', 's']]), tree: true, first: '4',
            choices: ['1', '2', '3', '4', '5'], answer: 1,
            hint: 'Grow only the branch that starts with wagon 4.',
            solution: 'engine–4–3–last and engine–4–3–1–last. That is <b>2</b>.'
        },
        {
            id: '10', part: 'Part C', points: 5,
            text: 'Anna has these pieces. ' + RULES(ROLE.caterpillar, '1, 2, 3, 4 or 5') + ' Anna has already put <b>part 2</b> right after the head. In how many different ways can Anna finish the caterpillar?',
            set: cat('t', 's', [['c', 'c'], ['t', 'c'], ['t', 's'], ['c', 't'], ['s', 's']]), tree: true, first: '2',
            choices: ['3', '4', '5', '6', '7'], answer: 1,
            hint: 'Grow only the branch that starts with part 2. Cross out used parts!',
            solution: 'head–2–1–4–3–tail, head–2–1–4–3–5–tail, head–2–4–3–tail, head–2–4–3–5–tail. That is <b>4</b>.'
        }
    ];

    window.MK.register({
        id: 'chains',
        title: 'Counting chains with a tree',
        topic: 'Counting',
        summary: 'Pieces with pegs and holes. List what fits after what, then grow a tree so you never miss one.',
        source: {
            label: 'Math Kangaroo 2024 · Ecolier (Grade 3–4) · Q14',
            pdf: 'set-01/by_level/Grade_03-04_Ecolier/y2024_q14.pdf'
        },
        steps,
        practice,
        practiceIntro: 'Use the recipe: make the list, grow a tree, cross out used pieces, skip dead ends, count.',
        figure(q, el) {
            if (q.figureHTML) el.innerHTML = q.figureHTML();
            else if (q.set) el.appendChild(pieceRow(q.set));
        },
        helper(q) {
            if (!q.tree || q.extra) return null;
            return {
                label: 'I drew my tree on paper — show me the tree',
                title: 'Click the boxes to grow the tree',
                draw: el => tree(el, q.set, { first: q.first })
            };
        },
        // for tests
        _solver: { allChains, cat, trn }
    });
})();
