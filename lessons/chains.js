// Lesson: counting chains with a tree (Math Kangaroo 2024, Ecolier, Q14).
(function () {
    const { add, choice, guess, guessResult, reveal, numbers, callout, feedback, praise } = window.UI;

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
            <div class="tree"></div>
            <div class="tree-msg"></div></div>`);
        const root = wrap.querySelector('.tree');
        let found = 0;
        const counter = wrap.querySelector('.tree-count b');
        const msgEl = wrap.querySelector('.tree-msg');
        const explain = html => { if (opts.explain) { msgEl.innerHTML = html; msgEl.classList.add('show'); } };
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
                const who = p.length ? `The <b>${nameOf(p[p.length - 1])}</b>` : `The <b>${r.start}</b>`;
                const hole = SHAPE_NAME[holeOf(set, p)];
                const used = p.length > 1 ? ` Already used on this branch: ${p.slice(0, -1).map(nameOf).join(', ')}.` : '';
                const nexts = [...(end ? [r.end] : []), ...parts.map(pt => nameOf(pt.n))];
                if (!parts.length && !end) {
                    add(n.querySelector('.tline'), `<span class="tnote bad">stuck — nothing fits</span>`);
                    explain(`${who} has a <b>${hole}</b> hole.${used} No piece that is left has a ${hole} peg. <b>Stuck!</b> This branch is a dead end.`);
                    return;
                }
                explain(`${who} has a <b>${hole}</b> hole.${used} Pieces left with a ${hole} peg: <b>${nexts.join(', ')}</b>. So ${nexts.length === 1 ? 'there is 1 branch' : `there are ${nexts.length} branches`}.`);
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

    // A finished chain drawn as joined pieces.
    function chainPicture(set, path) {
        return `<div class="joined plug-sm">${startSVG(set, { size: 84 })}${path.map(n => partSVG(set, set.parts.find(p => p.n === n), { size: 84 })).join('')}${endSVG(set, { size: 84 })}</div>`;
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

    const CHERRY = LUCAS.parts[1], GRAPE = LUCAS.parts[2], APPLE = LUCAS.parts[0];
    const generic = (peg, hole) => pieceSVG('caterpillar', 'part', peg, hole, '', { size: 90 });

    const steps = [
        {
            title: 'Meet the pieces',
            render(body, ctx) {
                add(body, `<p class="big">A caterpillar is made of round pieces that click together.</p>`);
                add(body, `<div class="anatomy">
                    <div class="anat-label left">peg<br><small>the bump on the left</small></div>
                    ${partSVG(LUCAS, CHERRY, { size: 220 })}
                    <div class="anat-label right">hole<br><small>the dent on the right</small></div>
                </div>`);
                add(body, `<p>Every middle piece has a <b>peg</b> on its left side and a <b>hole</b> on its right side. The head has only a hole (it is the front). The tail has only a peg (it is the back).</p>`);
                add(body, `<div class="pieces">
                    <div class="piece-cell">${startSVG(LUCAS)}<span>head: only a hole</span></div>
                    <div class="piece-cell">${endSVG(LUCAS)}<span>tail: only a peg</span></div></div>`);
                choice(body, {
                    question: 'Look at the big cherry piece. What shape is its <b>peg</b>?',
                    options: ['round', 'square', 'triangle'],
                    answer: 0,
                    right: 'The bump on the left is round.',
                    wrong: () => 'The peg is the bump on the LEFT side.',
                    onRight() {
                        choice(body, {
                            question: 'And what shape is its <b>hole</b>?',
                            options: ['round', 'square', 'triangle'],
                            answer: 1,
                            right: 'The dent on the right is square. Peg and hole can be different shapes!',
                            wrong: () => 'The hole is the dent on the RIGHT side.',
                            onRight: ctx.done
                        });
                    }
                });
            }
        },
        {
            title: 'The puzzle',
            render(body, ctx) {
                add(body, `<p class="big">Lucas has a head, a tail and three middle pieces: <b>apple (A)</b>, <b>cherry (C)</b> and <b>grape (G)</b>.</p>`);
                body.appendChild(pieceRow(LUCAS));
                add(body, `<ul class="rules">
                    <li>A peg only fits into a hole of the <b>same shape</b>.</li>
                    <li>A caterpillar is: the head, then one or more middle pieces, then the tail.</li>
                    <li>Each piece can be used <b>only once</b>.</li></ul>`);
                callout(body, 'question', 'The question', 'How many different caterpillars can Lucas build?');
                guess(body, { id: 'chains', options: ['2', '3', '4', '5', '6'], onPicked: ctx.done });
            }
        },
        {
            title: 'Same shape fits',
            render(body, ctx) {
                add(body, `<p class="big">The peg of the next piece goes into the hole of the piece before. They must be the <b>same shape</b>.</p>`);
                add(body, `<div class="fit-examples">
                    <div class="fit-ex good"><div class="joined plug">${generic(null, 'c')}${generic('c', null)}</div><span>round into round: <b>fits</b></span></div>
                    <div class="fit-ex good"><div class="joined plug">${generic(null, 's')}${generic('s', null)}</div><span>square into square: <b>fits</b></span></div>
                    <div class="fit-ex good"><div class="joined plug">${generic(null, 't')}${generic('t', null)}</div><span>triangle into triangle: <b>fits</b></span></div>
                    <div class="fit-ex bad"><div class="joined">${generic(null, 'c')}${generic('s', null)}</div><span>square peg, round hole: <b>no!</b></span></div>
                </div>`);
                add(body, `<p>Only the <b>hole</b> of the left piece and the <b>peg</b> of the right piece matter. The other sides don't.</p>`);
                add(body, `<div class="fit-examples"><div class="fit-ex"><div class="joined">${partSVG(LUCAS, APPLE, { size: 90 })}${partSVG(LUCAS, CHERRY, { size: 90 })}</div><span>apple, then cherry?</span></div></div>`);
                choice(body, {
                    question: 'Does the cherry fit right after the apple?',
                    options: ['yes, it fits', 'no, it does not fit'],
                    answer: 1,
                    right: 'The apple\'s hole is <b>square</b>, but the cherry\'s peg is <b>round</b>.',
                    wrong: () => 'Look only at the apple\'s hole (right side) and the cherry\'s peg (left side). Same shape?',
                    onRight: ctx.done
                });
            }
        },
        {
            title: 'What can come after the head?',
            render(body, ctx) {
                add(body, `<p class="big">The head has a <b>round</b> hole. So the next piece needs a <b>round peg</b>.</p>`);
                add(body, `<div class="pieces"><div class="piece-cell">${startSVG(LUCAS, { size: 110 })}<span>head</span></div></div>`);
                add(body, `<p>Click <b>every</b> piece that can go right after the head, then press Check.</p>`);
                pickPieces(body, LUCAS, {
                    answer: ['C', 'G'],
                    right: 'Cherry and grape both have a round peg. So there are <b>2</b> ways to start.',
                    wrong: id => id === 'end' ? 'The tail has a square peg. And a caterpillar needs a middle piece!' : 'The apple has a <b>square</b> peg. The head\'s hole is round.',
                    onRight() {
                        add(body, `<div class="fit-examples">
                            <div class="fit-ex good"><div class="joined plug">${startSVG(LUCAS, { size: 90 })}${partSVG(LUCAS, CHERRY, { size: 90 })}</div><span>head + cherry</span></div>
                            <div class="fit-ex good"><div class="joined plug">${startSVG(LUCAS, { size: 90 })}${partSVG(LUCAS, GRAPE, { size: 90 })}</div><span>head + grape</span></div></div>`);
                        ctx.done();
                    }
                });
            }
        },
        {
            title: 'What can come after each piece?',
            render(body, ctx) {
                add(body, `<p class="big">Let's do the same for <b>every</b> piece and keep it in a list. Then we never have to look at the pictures again!</p>`);
                body.appendChild(pieceRow(LUCAS));
                add(body, `<p>For each row: look at the piece's hole, then click every piece with a peg of that shape.</p>`);
                nextTable(body, LUCAS, ctx.done);
            }
        },
        {
            title: 'Each piece only once',
            render(body, ctx) {
                add(body, `<p class="big">Look at the grape in your list. Its hole is <b>round</b>, and its own peg is round too!</p>`);
                add(body, `<div class="fit-examples"><div class="fit-ex bad"><div class="joined plug">${partSVG(LUCAS, GRAPE, { size: 90 })}${partSVG(LUCAS, GRAPE, { size: 90 })}</div><span>grape + grape?</span></div></div>`);
                choice(body, {
                    question: 'Can a grape come right after the grape?',
                    options: ['Yes, the shapes fit', 'No, there is only one grape'],
                    answer: 1,
                    right: 'Lucas has only <b>one</b> grape. Once a piece is in the caterpillar, it is used up.',
                    wrong: () => 'The shapes fit, but how many grapes does Lucas have?',
                    onRight() {
                        callout(body, 'warn', 'Remember', 'When you build a caterpillar, <b>cross out</b> in your head every piece that is already in it. It can\'t be used again.');
                        ctx.done();
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
                        callout(body, 'idea', 'But wait…', `You found ${n}. Are there more? How can you be <b>sure</b> you didn't miss one? Keep trying if you like, then press Next.`);
                        ctx.done();
                    }
                });
            }
        },
        {
            title: 'A tree: a map of every choice',
            render(body, ctx) {
                add(body, `<p class="big">When you just try pieces, it's easy to miss one or count one twice. A <b>tree</b> makes sure we try <b>every</b> choice exactly once.</p>`);
                add(body, `<div class="mini-tree">
                    <div class="mt-node">head</div>
                    <div class="mt-kids"><div class="mt-node">cherry</div><div class="mt-node">grape</div></div>
                    <div class="mt-note">← 2 branches, because 2 pieces fit after the head</div>
                </div>`);
                add(body, `<p>We start with the head. Every piece that can come next gets its <b>own branch</b>. Then we do the same at the end of every branch, again and again.</p>`);
                choice(body, {
                    question: 'When does a branch stop growing?',
                    options: ['When it reaches the tail, or nothing fits', 'After 3 pieces', 'When we get bored'],
                    answer: 0,
                    right: 'A branch that reaches the tail is a finished caterpillar. A branch where nothing fits is a dead end.',
                    wrong: () => 'Caterpillars can have different lengths. What makes a caterpillar finished?',
                    onRight: ctx.done
                });
            }
        },
        {
            title: 'Grow the tree',
            render(body, ctx) {
                add(body, `<p class="big">Now you grow it! Click a box with a blue glow to grow its branches. Read the explanation under the tree each time.</p>`);
                let doneOnce = false;
                tree(body, LUCAS, {
                    explain: true,
                    onCount(n) {
                        if (n === 4 && !doneOnce) {
                            doneOnce = true;
                            add(body, `<p class="ok-note">Every branch ends with a tail. The tree is finished.</p>`);
                            ctx.done();
                        }
                    }
                });
            }
        },
        {
            title: 'Count the caterpillars',
            render(body, ctx) {
                add(body, `<p class="big">Every branch that ends with a <b>tail</b> is one caterpillar.</p>`);
                tree(body, LUCAS, { expandAll: true });
                numbers(body, {
                    template: 'Lucas can build [4] caterpillars.',
                    right: 'Here they are, all four:',
                    hint: 'Count the green tail boxes.',
                    onRight() {
                        const box = add(body, `<div class="chain-gallery"></div>`);
                        allChains(LUCAS).forEach((c, i) => add(box, `<div class="cg-item"><span>${i + 1}</span>${chainPicture(LUCAS, c)}</div>`));
                        guessResult(body, 'chains', '4');
                        ctx.done();
                    }
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
                add(body, `<p class="big">Sometimes a branch gets <b>stuck</b>: nothing that is left fits, so it never reaches the end. That is a <b>dead end</b>. Don't count it!</p>`);
                add(body, `<p>Same rules with a train: Anna has an engine, a last wagon and 4 wagons.</p>`);
                body.appendChild(pieceRow(ANNA));
                add(body, `<p>Grow Anna's tree. Watch for branches that get stuck:</p>`);
                let asked = false;
                tree(body, ANNA, {
                    explain: true,
                    onCount(n) {
                        if (n === 2 && !asked) {
                            asked = true;
                            reveal(body, 'I grew the whole tree', box => {
                                choice(box, {
                                    question: 'Which wagon is <b>never</b> part of a finished train?',
                                    options: ['wagon 1', 'wagon 2', 'wagon 3', 'wagon 4'],
                                    answer: 3,
                                    right: 'Wagon 4 only appears on branches that get stuck. So it is never in a finished train.',
                                    wrong: () => 'Look only at the branches that end with the last wagon. Which wagons are on them?',
                                    onRight: ctx.done
                                });
                            });
                        }
                    }
                });
            }
        },
        {
            title: 'The recipe',
            render(body, ctx) {
                add(body, `<p class="big">This works for every "how many chains" question:</p>`);
                add(body, `<ol class="recipe">
                    <li><b>What comes next?</b> For each piece: which pieces have a peg that fits its hole?</li>
                    <li><b>Grow a tree</b> from the start. Every piece that fits is a new branch.</li>
                    <li><b>Each piece only once</b> on a branch.</li>
                    <li><b>Stuck?</b> That branch is a dead end. Don't count it.</li>
                    <li><b>Count</b> the branches that reach the end.</li>
                </ol>`);
                add(body, `<a class="btn btn-primary align-start" href="#/lesson/chains/practice">Start practice</a>`);
                ctx.done();
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
        practiceIntro: 'Use the recipe: what comes next, grow a tree, each piece once, skip dead ends, count.',
        figure(q, el) {
            if (q.figureHTML) el.innerHTML = q.figureHTML();
            else if (q.set) el.appendChild(pieceRow(q.set));
        },
        helper(q) {
            if (!q.tree || q.extra) return null;
            return {
                label: 'Show me the tree',
                title: 'Click the boxes to grow the tree',
                draw: el => tree(el, q.set, { first: q.first, explain: true })
            };
        },
        // for tests
        _solver: { allChains, cat, trn }
    });
})();
