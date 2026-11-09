// app.js - sidebar, home page, lesson player (Learn + Practice), progress.
(function () {
    const { add, choice } = window.UI;
    const main = document.getElementById('main');
    const sidebar = document.getElementById('sidebar');

    // ---------- progress ----------
    // Progress lives only while the page is open. Refresh = fresh start.
    const memory = {};
    const progress = () => memory;
    function lessonProgress(id) {
        const p = progress()[id] || {};
        return { stepsDone: p.stepsDone || [], answers: p.answers || {} };
    }
    function saveLessonProgress(id, lp) {
        const all = progress();
        all[id] = lp;
        renderSidebar();
    }

    // ---------- sidebar ----------
    function renderSidebar(activeId) {
        if (activeId !== undefined) sidebar.dataset.active = activeId || '';
        const active = sidebar.dataset.active;
        const byTopic = {};
        MK.lessons.forEach(l => (byTopic[l.topic] = byTopic[l.topic] || []).push(l));
        sidebar.innerHTML = `<div class="side-title">Topics</div>` + Object.keys(byTopic).sort().map(topic => `
            <div class="side-group">
                <div class="side-topic">${topic}</div>
                ${byTopic[topic].map(l => {
                    const lp = lessonProgress(l.id);
                    const pct = Math.round(100 * lp.stepsDone.length / l.steps.length);
                    return `<a class="side-link${l.id === active ? ' active' : ''}" href="#/lesson/${l.id}">
                        <span class="side-text">${l.title}<span class="side-bar"><span style="width:${pct}%"></span></span></span>
                    </a>`;
                }).join('')}
            </div>`).join('') +
            `<div class="side-soon">More topics coming soon.</div>`;
    }

    // ---------- home ----------
    function renderHome() {
        renderSidebar(null);
        main.innerHTML = '';
        add(main, `<div class="hero">
            <h2>Pick a topic</h2>
            <p>Every topic here comes from a Kangaroo question that was tricky. We go through it <b>step by step</b>.</p>
            <ul class="hero-rules">
                <li><b>Pencil and paper</b> next to you, always.</li>
                <li><b>Go slowly.</b> One step at a time.</li>
                <li><b>Guess first</b>, then check.</li>
                <li><b>Mistakes are OK.</b> That's how we learn.</li>
            </ul>
        </div>`);
        const grid = add(main, `<div class="lesson-grid"></div>`);
        MK.lessons.forEach(l => {
            const lp = lessonProgress(l.id);
            const right = Object.values(lp.answers).filter(a => a.right).length;
            add(grid, `<a class="lesson-card" href="#/lesson/${l.id}">
                <div class="lesson-body">
                    <div class="lesson-topic">${l.topic}</div>
                    <div class="game-name">${l.title}</div>
                    <div class="game-meta">${l.summary}</div>
                    <div class="lesson-stats">${lp.stepsDone.length}/${l.steps.length} steps · ${right}/${l.practice.length} practice right</div>
                </div>
            </a>`);
        });
    }

    // ---------- lesson ----------
    function lessonHeader(l, mode) {
        const head = add(main, `<div class="lesson-head">
            <div>
                <h2>${l.title}</h2>
                <div class="username">${l.source.label}</div>
            </div>
            <div class="tabs">
                <a href="#/lesson/${l.id}/learn" class="nav-link${mode === 'learn' ? ' active' : ''}">Learn</a>
                <a href="#/lesson/${l.id}/practice" class="nav-link${mode === 'practice' ? ' active' : ''}">Practice</a>
            </div>
        </div>`);
        return head;
    }

    function renderLearn(l, stepIndex) {
        const lp = lessonProgress(l.id);
        if (stepIndex === undefined) stepIndex = 0;
        stepIndex = Math.max(0, Math.min(l.steps.length - 1, stepIndex));
        const step = l.steps[stepIndex];

        lessonHeader(l, 'learn');
        const dots = add(main, `<div class="step-dots"></div>`);
        l.steps.forEach((s, i) => {
            add(dots, `<a href="#/lesson/${l.id}/learn/${i + 1}" title="${s.title}"
                class="dot${i === stepIndex ? ' current' : ''}${lp.stepsDone.includes(i) ? ' done' : ''}">${i + 1}</a>`);
        });

        const card = add(main, `<section class="step-card">
            <div class="step-top">
                <span class="step-num">Step ${stepIndex + 1} of ${l.steps.length}</span>
                <h3>${step.title}</h3>
            </div>
            <div class="step-body"></div>
            <div class="step-nav"></div>
        </section>`);
        const nav = card.querySelector('.step-nav');
        const prev = add(nav, `<a class="btn btn-secondary${stepIndex === 0 ? ' hidden' : ''}" href="#/lesson/${l.id}/learn/${stepIndex}">Back</a>`);
        const isLast = stepIndex === l.steps.length - 1;
        const next = add(nav, isLast
            ? `<a class="btn btn-primary" href="#/lesson/${l.id}/practice">Go to practice</a>`
            : `<a class="btn btn-primary" href="#/lesson/${l.id}/learn/${stepIndex + 2}">Next</a>`);

        const ctx = {
            done() {
                const p = lessonProgress(l.id);
                if (!p.stepsDone.includes(stepIndex)) p.stepsDone.push(stepIndex);
                saveLessonProgress(l.id, p);
                dots.children[stepIndex].classList.add('done');
                next.classList.add('pulse');
            }
        };
        step.render(card.querySelector('.step-body'), ctx);
    }

    function renderPractice(l) {
        lessonHeader(l, 'practice');
        const lp = lessonProgress(l.id);
        const score = add(main, `<div class="stats"></div>`);
        const drawScore = () => {
            const p = lessonProgress(l.id);
            const answered = l.practice.filter(q => p.answers[q.id]);
            const right = l.practice.filter(q => p.answers[q.id] && p.answers[q.id].right);
            const pts = right.reduce((s, q) => s + q.points, 0);
            const maxPts = l.practice.reduce((s, q) => s + q.points, 0);
            score.innerHTML = `
                <div class="stat-card"><div class="stat-number">${answered.length}/${l.practice.length}</div><div class="stat-label">Answered</div></div>
                <div class="stat-card"><div class="stat-number">${right.length}</div><div class="stat-label">Right first try</div></div>
                <div class="stat-card"><div class="stat-number">${pts}/${maxPts}</div><div class="stat-label">Kangaroo points</div></div>
                <button type="button" class="btn-random reset-btn">Start over</button>`;
            score.querySelector('.reset-btn').addEventListener('click', () => {
                if (!confirm('Clear all practice answers for this topic?')) return;
                const q = lessonProgress(l.id);
                q.answers = {};
                saveLessonProgress(l.id, q);
                route();
            });
        };
        drawScore();

        add(main, `<p class="practice-intro">Do every question on <b>paper first</b>. Use the recipe: write it down, find the block, count, multiply, check leftovers. Only then click your answer!</p>`);

        let lastPart = null;
        l.practice.forEach(q => {
            if (q.part !== lastPart) {
                lastPart = q.part;
                const pts = q.points ? `each question is worth ${q.points} points` : 'small steps first, no points';
                add(main, `<h3 class="part-title">${q.part} <span>· ${pts}</span></h3>`);
            }
            const prev = lp.answers[q.id];
            const card = add(main, `<div class="q-card${prev ? (prev.right ? ' solved' : ' tried') : ''}">
                <div class="q-head"><span class="q-id">${q.id}</span>${prev ? (prev.right ? '<span class="q-star">right</span>' : '<span class="q-star tried">done</span>') : ''}</div>
                <div class="q-text">${q.text}</div>
                <div class="q-figure"></div>
                <div class="q-tools"></div>
                <div class="q-help"></div>
                <div class="q-quiz"></div>
            </div>`);
            if (q.show) l.drawPractice(q, card.querySelector('.q-figure'));
            const tools = card.querySelector('.q-tools');
            const help = card.querySelector('.q-help');
            const hintBtn = add(tools, `<button type="button" class="btn-random">Hint</button>`);
            hintBtn.addEventListener('click', () => {
                hintBtn.remove();
                add(help, `<div class="callout"><div class="callout-title">Hint</div><div>${q.hint}</div></div>`);
            });
            if (q.draw || q.lamps) {
                const drawBtn = add(tools, `<button type="button" class="btn-random">I drew it on paper — show me the picture</button>`);
                drawBtn.addEventListener('click', () => {
                    drawBtn.remove();
                    const box = add(help, `<div class="callout"><div class="callout-title">Compare with your drawing</div></div>`);
                    l.drawPractice(q, box);
                });
            }
            const showSolution = () => add(card, `<div class="callout callout-good"><div class="callout-title">Solution</div><div>${q.solution}</div></div>`);
            if (prev) {
                add(card.querySelector('.q-quiz'), `<p class="small">Your answer: <b>${'ABCDE'[prev.choice]}. ${q.choices[prev.choice]}</b> ${prev.right ? '— right first try!' : ''}</p>`);
                const again = add(tools, `<button type="button" class="btn-random">Try again</button>`);
                again.addEventListener('click', () => {
                    const p = lessonProgress(l.id);
                    delete p.answers[q.id];
                    saveLessonProgress(l.id, p);
                    route();
                });
                showSolution();
                return;
            }
            let firstTry = true;
            choice(card.querySelector('.q-quiz'), {
                options: q.choices, answer: q.answer, letters: true,
                wrong: () => 'Not this one. Check your paper again, or use the hint.',
                onWrong() { firstTry = false; },
                onRight() {
                    const p = lessonProgress(l.id);
                    p.answers[q.id] = { choice: q.answer, right: firstTry };
                    saveLessonProgress(l.id, p);
                    card.classList.add(firstTry ? 'solved' : 'tried');
                    showSolution();
                    drawScore();
                }
            });
        });
    }

    // ---------- router ----------
    function route() {
        const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
        main.innerHTML = '';
        document.querySelector('[data-nav="home"]').classList.toggle('active', parts.length === 0);
        if (parts[0] === 'lesson' && MK.find(parts[1])) {
            const l = MK.find(parts[1]);
            renderSidebar(l.id);
            if (parts[2] === 'practice') renderPractice(l);
            else renderLearn(l, parts[3] ? Number(parts[3]) - 1 : undefined);
        } else {
            renderHome();
        }
        window.scrollTo({ top: 0 });
    }

    window.addEventListener('hashchange', route);
    route();
})();
