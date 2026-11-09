// Lesson: two runners going opposite ways round a circle (Math Kangaroo 2025, Ecolier, Q10).
(function () {
    const { add, choice, guess, guessResult, reveal, numbers, callout, feedback, praise } = window.UI;

    const CW_COLOR = '#1e6fd9';   // clockwise runner
    const CCW_COLOR = '#e67e22';  // anticlockwise runner

    // Track settings: { labels: ['A','B',...] (clockwise from the top, '' = unlabeled point),
    //   cw: { name, parts }, ccw: { name, parts } } — parts = how many parts each runs between two meetings.
    const N = t => t.labels.length;
    const gcd = (a, b) => b ? gcd(b, a % b) : a;
    const meetingsUntilStart = t => N(t) / gcd(t.cw.parts, N(t));
    const meetingPoint = (t, k) => t.labels[(k * t.cw.parts) % N(t)];

    const deg = d => d * Math.PI / 180;
    function pt(cx, cy, r, angleDeg) { return [cx + r * Math.cos(deg(angleDeg)), cy + r * Math.sin(deg(angleDeg))]; }
    function arcPath(cx, cy, r, a0, a1) {
        // from angle a0 to a1 (degrees, screen coords; a1 > a0 means clockwise)
        if (Math.abs(a1 - a0) < 0.01) return '';
        const [x0, y0] = pt(cx, cy, r, a0);
        const [x1, y1] = pt(cx, cy, r, a1);
        const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
        const sweep = a1 > a0 ? 1 : 0;
        return `M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 ${large} ${sweep} ${x1.toFixed(1)},${y1.toFixed(1)}`;
    }

    // Static circle picture like in the contest (points + names with arrows).
    function circleSVG(t, opts = {}) {
        const S = opts.size || 230, cx = S / 2, cy = S / 2 + 6, r = S * 0.34;
        const n = N(t);
        let s = `<svg viewBox="0 0 ${S} ${S + 12}" width="${S}" height="${S + 12}" class="track-svg">`;
        s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#333" stroke-width="2"/>`;
        // direction arrows at the top
        s += `<path d="${arcPath(cx, cy, r + 14, -84, -52)}" fill="none" stroke="${CW_COLOR}" stroke-width="2.5" marker-end="url(#arrow-cw)"/>`;
        s += `<path d="${arcPath(cx, cy, r + 14, -96, -128)}" fill="none" stroke="${CCW_COLOR}" stroke-width="2.5" marker-end="url(#arrow-ccw)"/>`;
        s += `<defs><marker id="arrow-cw" markerWidth="9" markerHeight="9" refX="4" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L8,4 L0,8 z" fill="${CW_COLOR}"/></marker>
              <marker id="arrow-ccw" markerWidth="9" markerHeight="9" refX="4" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L8,4 L0,8 z" fill="${CCW_COLOR}"/></marker></defs>`;
        const [nx1, ny1] = pt(cx, cy, r + 30, -58);
        const [nx2, ny2] = pt(cx, cy, r + 30, -122);
        s += `<text x="${nx1}" y="${ny1}" text-anchor="start" font-size="14" font-weight="700" fill="${CW_COLOR}">${t.cw.name}</text>`;
        s += `<text x="${nx2}" y="${ny2}" text-anchor="end" font-size="14" font-weight="700" fill="${CCW_COLOR}">${t.ccw.name}</text>`;
        for (let i = 0; i < n; i++) {
            const a = -90 + i * 360 / n;
            const [x, y] = pt(cx, cy, r, a);
            s += `<circle cx="${x}" cy="${y}" r="${i === 0 ? 4.5 : 3.5}" fill="${i === 0 ? '#333' : '#fff'}" stroke="#333" stroke-width="1.5"/>`;
            if (t.labels[i]) {
                const [lx, ly] = pt(cx, cy, r - 17, a);
                s += `<text x="${lx}" y="${ly + 5}" text-anchor="middle" font-size="15" font-weight="700" fill="#222">${t.labels[i]}</text>`;
            }
        }
        s += (opts.extra || '') + '</svg>';
        return s;
    }

    // The track after `time` meetings (can be fractional): runners, the arcs they ran since the last meeting, meeting markers.
    function trackPicture(t, time, S = 260) {
        const n = N(t);
        const cx = S / 2, cy = S / 2 + 6, r = S * 0.34;
        const last = Math.floor(time === Math.floor(time) && time > 0 ? time - 1 : time);
        const frac = time - last;
        const startA = -90 + (last * t.cw.parts) * 360 / n;
        const cwA = startA + frac * t.cw.parts * 360 / n;
        const ccwA = startA - frac * t.ccw.parts * 360 / n;
        let extra = '';
        extra += `<path d="${arcPath(cx, cy, r - 30, startA, cwA)}" fill="none" stroke="${CW_COLOR}" stroke-width="7" stroke-linecap="round" opacity="0.75"/>`;
        extra += `<path d="${arcPath(cx, cy, r - 40, startA, ccwA)}" fill="none" stroke="${CCW_COLOR}" stroke-width="7" stroke-linecap="round" opacity="0.75"/>`;
        for (let m = 1; m <= Math.floor(time); m++) {
            const a = -90 + (m * t.cw.parts) * 360 / n;
            const [x, y] = pt(cx, cy, r + 2, a);
            extra += `<circle cx="${x}" cy="${y}" r="9" fill="#fff1a8" stroke="#333" stroke-width="1.2"/><text x="${x}" y="${y + 4}" text-anchor="middle" font-size="11" font-weight="800">${m}</text>`;
        }
        const [x1, y1] = pt(cx, cy, r, cwA);
        const [x2, y2] = pt(cx, cy, r, ccwA);
        extra += `<circle cx="${x2}" cy="${y2}" r="8" fill="${CCW_COLOR}" stroke="#fff" stroke-width="2"/>`;
        extra += `<circle cx="${x1}" cy="${y1}" r="8" fill="${CW_COLOR}" stroke="#fff" stroke-width="2"/>`;
        return circleSVG(t, { size: S, extra });
    }

    // A circle cut into its parts, each part shaded and numbered.
    function partsPicture(n, opts = {}) {
        const S = opts.size || 200, cx = S / 2, cy = S / 2, r = S * 0.36;
        const from = opts.from || 1;
        let s = `<svg viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">`;
        const dir = opts.reverse ? -1 : 1;
        for (let i = 0; i < n; i++) {
            const a0 = -90 + dir * i * 360 / n, a1 = a0 + dir * 360 / n;
            s += `<path d="${arcPath(cx, cy, r, Math.min(a0, a1) + 1.5, Math.max(a0, a1) - 1.5)}" fill="none" stroke="${i % 2 ? '#9fb3c8' : '#cfd8e3'}" stroke-width="16"/>`;
            const [x, y] = pt(cx, cy, r, (a0 + a1) / 2);
            s += `<text x="${x}" y="${y + 5}" text-anchor="middle" font-size="14" font-weight="800" fill="#222">${from + i}</text>`;
            const [px, py] = pt(cx, cy, r, a0);
            s += `<circle cx="${px}" cy="${py}" r="4" fill="#fff" stroke="#333" stroke-width="1.5"/>`;
            if (opts.labels) { const [lx, ly] = pt(cx, cy, r - 26, a0); s += `<text x="${lx}" y="${ly + 5}" text-anchor="middle" font-size="14" font-weight="700">${opts.labels[i]}</text>`; }
        }
        if (opts.caption) s += `<text x="${cx}" y="${cy + 5}" text-anchor="middle" font-size="15" font-weight="700" fill="#555">${opts.caption}</text>`;
        return s + '</svg>';
    }

    // A clock face with an arrow showing clockwise.
    function clockSVG() {
        const S = 170, c = S / 2, r = 62;
        let s = `<svg viewBox="0 0 ${S} ${S}" width="${S}" height="${S}"><circle cx="${c}" cy="${c}" r="${r}" fill="#fff" stroke="#333" stroke-width="2"/>`;
        [['12', -90], ['3', 0], ['6', 90], ['9', 180]].forEach(([t, a]) => { const [x, y] = pt(c, c, r - 14, a); s += `<text x="${x}" y="${y + 5}" text-anchor="middle" font-size="15" font-weight="700">${t}</text>`; });
        s += `<line x1="${c}" y1="${c}" x2="${c}" y2="${c - 38}" stroke="#333" stroke-width="3" stroke-linecap="round"/><line x1="${c}" y1="${c}" x2="${c + 26}" y2="${c}" stroke="#333" stroke-width="3" stroke-linecap="round"/>`;
        s += `<defs><marker id="clock-arrow" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L10,5 L0,10 z" fill="${CW_COLOR}"/></marker></defs>`;
        s += `<path d="${arcPath(c, c, r + 12, -60, 20)}" fill="none" stroke="${CW_COLOR}" stroke-width="3" marker-end="url(#clock-arrow)"/>`;
        return s + '</svg>';
    }

    // Animated track. opts: { table: true, stopAfter, onMeeting(k) }
    function track(container, t, opts = {}) {
        const n = N(t);
        const stopAfter = opts.stopAfter || meetingsUntilStart(t);
        const unit = opts.unit || 'parts';
        const wrap = add(container, `<div class="track">
            <div class="track-row">
                <div class="track-pic"></div>
                <div class="track-side">
                    <div class="legend"><span style="color:${CW_COLOR}">● ${t.cw.name}</span> runs clockwise<br><span style="color:${CCW_COLOR}">● ${t.ccw.name}</span> runs anticlockwise</div>
                    <div class="btn-row"><button type="button" class="btn-random t-go">Run to the next meeting</button><button type="button" class="btn-random t-reset">Start again</button></div>
                    <div class="track-msg"></div>
                </div>
            </div>
            ${opts.table ? `<table class="fit-table run-table"><thead><tr><th>Meeting</th><th>Where</th><th>${t.cw.name} has run</th><th>${t.ccw.name} has run</th></tr></thead><tbody></tbody></table>` : ''}
        </div>`);
        const pic = wrap.querySelector('.track-pic');
        const msg = wrap.querySelector('.track-msg');
        const go = wrap.querySelector('.t-go');
        const tbody = wrap.querySelector('tbody');
        let k = 0, anim = null;

        function draw(time) { pic.innerHTML = trackPicture(t, time); }

        function meeting() {
            k++;
            const where = meetingPoint(t, k) || '—';
            const cwRun = k * t.cw.parts, ccwRun = k * t.ccw.parts;
            if (tbody) add(tbody, `<tr><td>${k}</td><td><b>${where}</b></td><td>${cwRun} ${unit}</td><td>${ccwRun} ${unit}</td></tr>`);
            msg.innerHTML = `Meeting <b>${k}</b>${meetingPoint(t, k) ? ` at <b>${meetingPoint(t, k)}</b>` : ''}. Since the last meeting: <span style="color:${CW_COLOR}">${t.cw.name} ${t.cw.parts}</span> + <span style="color:${CCW_COLOR}">${t.ccw.name} ${t.ccw.parts}</span> = <b>${n}</b> ${unit} = once around.`;
            if (k >= stopAfter) {
                go.disabled = true;
                go.textContent = k === meetingsUntilStart(t) ? 'Both are back at the start' : 'Stop here';
            }
            opts.onMeeting && opts.onMeeting(k);
        }

        go.addEventListener('click', () => {
            if (anim || k >= stopAfter) return;
            const from = k, t0 = performance.now(), dur = opts.duration || 1600;
            const step = now => {
                const f = Math.min(1, (now - t0) / dur);
                draw(from + f);
                if (f < 1) anim = requestAnimationFrame(step);
                else { anim = null; meeting(); }
            };
            anim = requestAnimationFrame(step);
        });
        wrap.querySelector('.t-reset').addEventListener('click', () => {
            if (anim) cancelAnimationFrame(anim);
            anim = null; k = 0;
            if (tbody) tbody.innerHTML = '';
            msg.innerHTML = '';
            go.disabled = false; go.textContent = 'Run to the next meeting';
            draw(0);
            opts.onReset && opts.onReset();
        });
        draw(0);
        return wrap;
    }

    // The circle cut open at the start and laid flat.
    function flatLine(t) {
        const n = N(t), W = 520, x0 = 20, x1 = W - 20, step = (x1 - x0) / n;
        let s = `<svg viewBox="0 0 ${W} 110" width="100%" style="max-width:${W}px" class="flat-svg">`;
        const a = t.cw.parts * step;
        s += `<rect x="${x0}" y="22" width="${a}" height="10" fill="${CW_COLOR}"/>`;
        s += `<rect x="${x0 + a}" y="40" width="${x1 - x0 - a}" height="10" fill="${CCW_COLOR}"/>`;
        s += `<text x="${x0}" y="16" font-size="14" font-weight="700" fill="${CW_COLOR}">${t.cw.name} →  ${t.cw.parts} part${t.cw.parts > 1 ? 's' : ''}</text>`;
        s += `<text x="${x1}" y="68" text-anchor="end" font-size="14" font-weight="700" fill="${CCW_COLOR}">${t.ccw.parts} parts  ← ${t.ccw.name}</text>`;
        s += `<line x1="${x0}" y1="84" x2="${x1}" y2="84" stroke="#333" stroke-width="2"/>`;
        for (let i = 0; i <= n; i++) {
            const x = x0 + i * step;
            s += `<line x1="${x}" y1="78" x2="${x}" y2="90" stroke="#333" stroke-width="2"/>`;
            s += `<text x="${x}" y="106" text-anchor="middle" font-size="15" font-weight="700">${t.labels[i % n]}</text>`;
        }
        return s + '</svg>';
    }

    const LISA = { labels: ['A', 'B', 'C', 'D'], cw: { name: 'Lisa', parts: 1 }, ccw: { name: 'Max', parts: 3 } };

    const steps = [
        {
            title: 'The puzzle',
            render(body, ctx) {
                add(body, `<p class="big">Lisa and Max draw a big circle in the sand and write A, B, C and D on it. They start together at A. Lisa runs <b style="color:${CW_COLOR}">clockwise</b>, Max runs <b style="color:${CCW_COLOR}">anticlockwise</b>.</p>`);
                add(body, `<div class="center-pic">${circleSVG(LISA)}</div>`);
                add(body, `<p>They meet for the first time at <b>B</b>, then at <b>C</b>, at <b>D</b> and then again at <b>A</b>.</p>`);
                callout(body, 'question', 'The question', 'How many times has <b>Max</b> run around the circle by then?');
                guess(body, { id: 'runners', options: ['1 time', '3 times', '4 times', '5 times', '8 times'], onPicked: ctx.done });
            }
        },
        {
            title: 'Clockwise and anticlockwise',
            render(body, ctx) {
                add(body, `<p class="big"><b style="color:${CW_COLOR}">Clockwise</b> means the way the hands of a clock go: from 12 to 3 to 6 to 9. <b style="color:${CCW_COLOR}">Anticlockwise</b> is the other way.</p>`);
                add(body, `<div class="center-pic pics">${clockSVG()}${circleSVG(LISA, { size: 200 })}</div>`);
                choice(body, {
                    question: `Lisa runs <b style="color:${CW_COLOR}">clockwise</b> from A. Which letter does she reach first?`,
                    options: ['B', 'C', 'D'],
                    answer: 0,
                    right: 'A is at the top, like the 12. Clockwise goes to the right first: B.',
                    wrong: () => 'Clockwise: like a clock hand going from 12 to 3. Which letter is where the 3 would be?',
                    onRight() {
                        choice(body, {
                            question: `Max runs <b style="color:${CCW_COLOR}">anticlockwise</b> from A. Which letter does he reach first?`,
                            options: ['B', 'C', 'D'],
                            answer: 2,
                            right: 'Anticlockwise goes to the left first: D. So they run away from each other.',
                            wrong: () => 'Anticlockwise is the other way: from 12 to 9.',
                            onRight: ctx.done
                        });
                    }
                });
            }
        },
        {
            title: 'Cut the circle into equal parts',
            render(body, ctx) {
                add(body, `<p class="big">The letters cut the circle into equal <b>parts</b>. We measure how far someone runs in parts.</p>`);
                add(body, `<div class="center-pic">${partsPicture(4, { labels: ['A', 'B', 'C', 'D'], size: 220 })}</div>`);
                add(body, `<p>A to B is one part, B to C is one part, and so on.</p>`);
                numbers(body, {
                    template: 'Once around the whole circle (one <b>lap</b>) = [4] parts',
                    right: 'A → B → C → D → A: 4 parts make one lap.',
                    hint: 'Count the shaded pieces in the picture.',
                    onRight: ctx.done
                });
            }
        },
        {
            title: 'Run to the first meeting',
            render(body, ctx) {
                add(body, `<p class="big">They start at A and meet for the first time at <b>B</b>. Here is the path each one ran:</p>`);
                add(body, `<div class="center-pic">${trackPicture(LISA, 1)}</div>`);
                choice(body, {
                    question: `How many parts did <b style="color:${CW_COLOR}">Lisa</b> run (the blue path, A to B)?`,
                    options: ['1 part', '2 parts', '3 parts', '4 parts'],
                    answer: 0,
                    right: 'A to B is just 1 part.',
                    wrong: () => 'Follow the blue path from A. How many gaps does it cover?',
                    onRight() {
                        choice(body, {
                            question: `And <b style="color:${CCW_COLOR}">Max</b> (the orange path, A → D → C → B)?`,
                            options: ['1 part', '2 parts', '3 parts', '4 parts'],
                            answer: 2,
                            right: 'A to D, D to C, C to B: 3 parts.',
                            wrong: () => 'Follow the orange path from A the other way round to B. Count each gap.',
                            onRight: ctx.done
                        });
                    }
                });
            }
        },
        {
            title: 'The big idea',
            render(body, ctx) {
                add(body, `<p class="big">Lisa ran 1 part, Max ran 3 parts. 1 + 3 = 4 parts. That is the <b>whole circle</b>!</p>`);
                add(body, `<p>Cut the circle open at A and lay it flat like a rope. Lisa starts at the left end, Max at the right end:</p>`);
                add(body, `<div class="center-pic">${flatLine(LISA)}</div>`);
                add(body, `<p>They run towards each other and meet where their pieces touch. Together their pieces always fill the <b>whole rope</b>.</p>`);
                callout(body, 'idea', 'The big idea', 'From one meeting to the next, the two runners <b>together</b> run exactly <b>once around</b> the circle.');
                add(body, `<p>Watch it happen:</p>`);
                track(body, LISA, { stopAfter: 1, onMeeting: ctx.done });
            }
        },
        {
            title: 'Try the big idea',
            render(body, ctx) {
                const ZJ = { labels: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], cw: { name: 'Zoe', parts: 3 }, ccw: { name: 'Jack', parts: 5 } };
                add(body, `<p class="big">A circle is cut into <b>8</b> equal parts. Zoe and Jack start together and run in opposite directions. When they meet, Zoe has run <b>3 parts</b>.</p>`);
                numbers(body, {
                    template: 'Jack has run [5] parts.',
                    right: 'Together 8 parts (once around): 8 − 3 = 5. Here is the picture:',
                    hint: 'Together they run once around. How many parts is once around?',
                    onRight() {
                        add(body, `<div class="center-pic">${trackPicture(ZJ, 1)}</div>`);
                        ctx.done();
                    }
                });
            }
        },
        {
            title: 'Where will they meet next?',
            render(body, ctx) {
                add(body, `<p class="big">After meeting at B, they keep running just as fast. Until the next meeting, again Lisa runs <b>1 part</b> and Max runs <b>3 parts</b>.</p>`);
                add(body, `<div class="center-pic">${trackPicture(LISA, 1)}</div>`);
                choice(body, {
                    question: 'Where is the <b>second</b> meeting?',
                    options: ['A', 'B', 'C', 'D'],
                    answer: 2,
                    right: 'From B, Lisa runs 1 more part: to C. (Max runs B → A → D → C, 3 parts.) Press the button to check:',
                    wrong: () => 'Start at B. Lisa runs 1 part clockwise. Where does she get to?',
                    onRight() {
                        track(body, LISA, { stopAfter: 2, onMeeting(k) { if (k === 2) ctx.done(); } });
                    }
                });
            }
        },
        {
            title: 'Keep count in a table',
            render(body, ctx) {
                add(body, `<p class="big">Every meeting, Lisa adds 1 part and Max adds 3 parts. They meet at B, C, D and then A.</p>`);
                add(body, `<table class="fit-table"><tr><th>Meeting</th><th>Where</th><th>Lisa has run</th><th>Max has run</th></tr>
                    <tr><td>1</td><td>B</td><td>1 part</td><td>3 parts</td></tr>
                    <tr><td>2</td><td>C</td><td>2 parts</td><td>6 parts</td></tr>
                    <tr><td>3</td><td>D</td><td>?</td><td>?</td></tr>
                    <tr><td>4</td><td>A</td><td>?</td><td>?</td></tr></table>`);
                numbers(body, {
                    template: 'Meeting 3: Lisa [3] parts, Max [9] parts',
                    right: 'Add 1 for Lisa and 3 for Max.',
                    hint: 'Meeting 2 was Lisa 2, Max 6. Add 1 and 3.',
                    onRight() {
                        numbers(body, {
                            template: 'Meeting 4: Lisa [4] parts, Max [12] parts',
                            right: 'Now watch all four meetings and see the table fill in:',
                            onRight() {
                                track(body, LISA, { table: true, onMeeting(k) { if (k === 4) ctx.done(); } });
                            }
                        });
                    }
                });
            }
        },
        {
            title: 'Change parts into laps',
            render(body, ctx) {
                add(body, `<p class="big">Max ran <b>12 parts</b>. But the question asks how many <b>times around the circle</b>. One time around (one lap) is 4 parts.</p>`);
                add(body, `<div class="center-pic pics">${partsPicture(4, { from: 1, size: 150, caption: 'lap 1', reverse: true })}${partsPicture(4, { from: 5, size: 150, caption: 'lap 2', reverse: true })}${partsPicture(4, { from: 9, size: 150, caption: 'lap 3', reverse: true })}</div>`);
                add(body, `<p>Max runs anticlockwise. His parts 1–4 are the first lap, 5–8 the second lap, 9–12 the third lap.</p>`);
                numbers(body, {
                    template: '12 parts ÷ 4 parts in one lap = [3] times around',
                    right: 'Max ran around <b>3 times</b>.',
                    hint: 'How many 4s make 12?',
                    onRight() {
                        guessResult(body, 'runners', '3 times');
                        ctx.done();
                    }
                });
            }
        },
        {
            title: 'Equally fast',
            render(body, ctx) {
                const t2 = { labels: ['P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W'], cw: { name: 'Anna', parts: 4 }, ccw: { name: 'Ben', parts: 4 } };
                add(body, `<p class="big">Anna and Ben start at P and run in opposite directions, <b>equally fast</b>. The circle has 8 equal parts.</p>`);
                add(body, `<div class="center-pic">${circleSVG(t2)}</div>`);
                add(body, `<p>Together they run 8 parts to the first meeting. Equally fast means they each run the <b>same</b> amount.</p>`);
                choice(body, {
                    question: 'Where do they meet for the first time?',
                    options: ['point P', 'point Q', 'point S', 'point T', 'point U'],
                    answer: 3,
                    right: '8 parts shared equally: 4 each. T is 4 parts from P, right opposite.',
                    wrong: () => 'Share 8 parts equally between the two. How many does Anna run?',
                    onRight() {
                        add(body, `<div class="center-pic">${trackPicture(t2, 1)}</div>`);
                        ctx.done();
                    }
                });
            }
        },
        {
            title: 'Watch out: meetings are not laps',
            render(body, ctx) {
                add(body, `<p class="big">Lisa and Max met <b>4 times</b>, but Max ran around only <b>3 times</b>. Always read what the question asks!</p>`);
                callout(body, 'idea', 'A clever check',
                    `Lisa ran 4 parts = <b>1</b> lap. Max ran <b>3</b> laps. 1 + 3 = <b>4</b> = the number of meetings.<br>
                     That's because each meeting "uses up" one lap together.`);
                add(body, `<p>Tom and Mia start together at A and run in opposite directions. When they are together at A again for the first time, Tom has run around <b>once</b> and Mia <b>2 times</b>.</p>`);
                choice(body, {
                    question: 'How many times did they meet? (Count the meeting at A, but not the start.)',
                    options: ['1', '2', '3', '4', '5'],
                    answer: 2,
                    right: 'Together they ran 1 + 2 = 3 laps, so they met 3 times. Watch it to be sure:',
                    wrong: () => 'Every meeting = one lap together. How many laps did they run together?',
                    onRight() {
                        track(body, { labels: ['A', '', ''], cw: { name: 'Tom', parts: 1 }, ccw: { name: 'Mia', parts: 2 } }, {});
                        ctx.done();
                    }
                });
            }
        },
        {
            title: 'The recipe',
            render(body, ctx) {
                add(body, `<p class="big">This works for every "running round a circle" question:</p>`);
                add(body, `<ol class="recipe">
                    <li><b>Count the parts</b> in one lap.</li>
                    <li><b>First meeting:</b> how many parts did each runner run? Together = one lap.</li>
                    <li><b>Same every time:</b> each meeting, each runner adds the same number of parts.</li>
                    <li><b>Keep count</b> until the moment the question asks about.</li>
                    <li><b>Parts → laps:</b> divide by the parts in one lap. Meetings are not laps!</li>
                </ol>`);
                add(body, `<a class="btn btn-primary align-start" href="#/lesson/circle-runners/practice">Start practice</a>`);
                ctx.done();
            }
        }
    ];

    // ---------- practice (from the preview PDF) ----------
    const T = (labels, cwName, cwParts, ccwName, ccwParts) => ({ labels: labels.split(''), cw: { name: cwName, parts: cwParts }, ccw: { name: ccwName, parts: ccwParts } });
    const blank = (first, n) => [first, ...Array(n - 1).fill('')];
    const times = n => [1, 2, 3, 4, 5].map(x => `${x} time${x > 1 ? 's' : ''}`);

    const practice = [
        {
            id: 'W1', part: 'Warm-up', points: 0,
            text: 'Anna and Ben start together at point P and run around the circle in opposite directions. They run <b>equally fast</b>. At which point do they meet for the first time?',
            track: T('PQRSTUVW', 'Anna', 4, 'Ben', 4), stop: 1, check: { firstPoint: 'T' },
            choices: ['point P', 'point Q', 'point S', 'point T', 'point U'], answer: 3,
            hint: 'Equally fast: each runs the same number of parts. Together 8 parts.',
            solution: 'Equally fast means each runs half of the circle. Half of 8 parts is 4 parts: <b>point T</b>, right opposite P.'
        },
        {
            id: 'W2', part: 'Warm-up', points: 0,
            text: 'A circle is cut into 8 equal parts. Zoe and Jack start together and run in opposite directions. When they meet for the first time, Zoe has run 3 parts. How many parts has Jack run?',
            choices: ['5 parts', '6 parts', '7 parts', '8 parts', '11 parts'], answer: 0,
            hint: 'Together they run once around.',
            solution: 'Together they ran once around, that is 8 parts. 8 − 3 = <b>5</b>.'
        },
        {
            id: 'W3', part: 'Warm-up', points: 0,
            text: 'Max runs clockwise and Lisa anticlockwise. They start together at P and meet for the first time at Q. They keep running just as fast. Where do they meet the <b>second</b> time?',
            track: T('PQRST', 'Max', 1, 'Lisa', 4), stop: 2, check: { secondPoint: 'R' },
            choices: ['point P', 'point Q', 'point R', 'point S', 'point T'], answer: 2,
            hint: 'How many parts did Max run until the first meeting? He runs the same again.',
            solution: 'Each time, Max runs 1 part (one point further) and Lisa the other 4 parts. So the second meeting is one point after Q: at <b>R</b>.'
        },
        {
            id: 'W4', part: 'Warm-up', points: 0,
            text: 'A circle is cut into 4 equal parts. Every time Anna and Ben meet, Ben has run 3 more parts. How many parts has Ben run after 4 meetings?',
            choices: ['12 parts', '13 parts', '14 parts', '15 parts', '16 parts'], answer: 0,
            hint: '3 parts for each meeting.',
            solution: '4 meetings × 3 parts = <b>12 parts</b>.'
        },
        {
            id: 'W5', part: 'Warm-up', points: 0,
            text: 'A circle is cut into 6 equal parts. Tom runs 24 parts around the circle. How many times has Tom run around the circle?',
            choices: ['1 time', '2 times', '3 times', '4 times', '24 times'], answer: 3,
            hint: 'One time around = 6 parts.',
            solution: 'One time around is 6 parts. 24 ÷ 6 = <b>4</b>.'
        },
        {
            id: '1', part: 'Part A', points: 3,
            text: 'Lisa and Max draw a big circle and write A, B, C and D on it. They start at A. Lisa runs clockwise and Max anticlockwise. They meet for the first time at B, then at C, at D and then again at A. How many times has <b>Max</b> run around the circle by then?',
            track: T('ABCD', 'Lisa', 1, 'Max', 3), check: { ccwLaps: 3 },
            choices: ['1 time', '3 times', '4 times', '5 times', '8 times'], answer: 1,
            hint: 'How many parts does Max run between two meetings? How many meetings are there?',
            solution: 'Lisa only gets to the next letter (1 of 4 parts), so Max runs the other 3 parts each time. 4 meetings × 3 parts = 12 parts = <b>3 times</b> around.'
        },
        {
            id: '2', part: 'Part A', points: 3,
            text: 'Sara and Leo write A, B, C, D and E on a circle. They start at A. Sara runs clockwise and Leo anticlockwise. They meet for the first time at E, then at D, at C, at B and then again at A. How many times has <b>Sara</b> run around the circle by then?',
            track: T('ABCDE', 'Sara', 4, 'Leo', 1), check: { cwLaps: 4 },
            choices: times(), answer: 3,
            hint: 'Who only gets one letter further each time? So how many parts does the other one run?',
            solution: 'Leo only gets to the next letter (1 of 5 parts), so Sara runs the other 4 parts. 5 meetings × 4 parts = 20 parts = <b>4 times</b> around.'
        },
        {
            id: '3', part: 'Part B', points: 4,
            text: 'Jack and Zoe start at point A of the circle. Jack runs clockwise, Zoe anticlockwise. They meet for the first time at E, then at C and then again at A. How many times has <b>Jack</b> run around the circle by then?',
            track: T('ABCDEF', 'Jack', 4, 'Zoe', 2), check: { cwLaps: 2 },
            choices: ['2 times', '3 times', '4 times', '5 times', '6 times'], answer: 0,
            hint: 'Careful: this time they don\'t meet at every letter. Count the parts each one runs to the first meeting at E.',
            solution: 'Each time, Zoe runs 2 of the 6 parts and Jack runs the other 4. They meet 3 times, so Jack runs 3 × 4 = 12 parts = <b>2 times</b> around.'
        },
        {
            id: '4', part: 'Part B', points: 4,
            text: 'Tom and Mia start at point A of the circle. Tom runs clockwise, Mia anticlockwise. They meet for the first time at D, then at B, at E, at C and then again at A. How many times has <b>Tom</b> run around the circle by then?',
            track: T('ABCDE', 'Tom', 3, 'Mia', 2), check: { cwLaps: 3 },
            choices: times(), answer: 2,
            hint: 'Count the parts to the first meeting at D for each runner. Then multiply by the number of meetings.',
            solution: 'Each time, Mia runs 2 of the 5 parts and Tom runs the other 3. They meet 5 times, so Tom runs 5 × 3 = 15 parts = <b>3 times</b> around.'
        },
        {
            id: '5', part: 'Part B', points: 4,
            text: 'Mia and Tom start together at point P and run in opposite directions: Mia clockwise and Tom anticlockwise. The points are evenly spaced. Mia runs <b>4 times as fast</b> as Tom. At which point do they meet for the first time?',
            track: T('PQRST', 'Mia', 4, 'Tom', 1), stop: 1, check: { firstPoint: 'T' },
            choices: ['point P', 'point Q', 'point R', 'point S', 'point T'], answer: 4,
            hint: 'Together they run 5 parts. Mia runs 4 times as much as Tom. Tom runs 1, Mia runs ...?',
            solution: 'Together once around (5 parts), and Mia runs 4 times as far: Tom runs 1 part and Mia 4. Tom only gets 1 point anticlockwise: <b>point T</b>.'
        },
        {
            id: '6', part: 'Part B', points: 4,
            text: 'Sara and Leo start together at point P and run in opposite directions: Sara clockwise and Leo anticlockwise. The points are evenly spaced. Leo runs <b>7 times as fast</b> as Sara. At which point do they meet for the first time?',
            track: T('PQRSTUVW', 'Sara', 1, 'Leo', 7), stop: 1, check: { firstPoint: 'Q' },
            choices: ['point P', 'point Q', 'point S', 'point U', 'point W'], answer: 1,
            hint: 'Together 8 parts. Sara runs 1 part, Leo 7 parts. Which way does Sara go?',
            solution: 'Sara runs 1 part and Leo 7 parts of 8. Sara only gets 1 point clockwise: <b>point Q</b>.'
        },
        {
            id: '7', part: 'Part C', points: 5,
            text: 'Tom runs clockwise and Mia runs anticlockwise around a circle. They start together at A. When they are together at A again for the first time, Tom has run around the circle once and Mia 2 times. How many times did they meet? (Count the meeting at A, but not the start.)',
            track: { labels: blank('A', 3), cw: { name: 'Tom', parts: 1 }, ccw: { name: 'Mia', parts: 2 } }, check: { meetings: 3 },
            choices: ['1', '2', '3', '4', '5'], answer: 2,
            hint: 'Each meeting = one lap together. How many laps did they run together?',
            solution: 'Between two meetings they run once around together. Together they ran 1 + 2 = 3 times around, so they met <b>3</b> times.'
        },
        {
            id: '8', part: 'Part C', points: 5,
            text: 'Zoe runs clockwise and Jack runs anticlockwise around a circle. They start together at A. When they are together at A again for the first time, Jack has run around the circle 3 times and Zoe 5 times. How many times did they meet? (Count the meeting at A, but not the start.)',
            track: { labels: blank('A', 8), cw: { name: 'Zoe', parts: 5 }, ccw: { name: 'Jack', parts: 3 } }, check: { meetings: 8 },
            choices: ['2', '4', '5', '7', '8'], answer: 4,
            hint: 'Each meeting = one lap together.',
            solution: 'Together they ran 3 + 5 = 8 times around, so they met <b>8</b> times.'
        },
        {
            id: '9', part: 'Part C', points: 5,
            text: 'Leo and Sara start together at the same spot of a round track. Leo runs clockwise and Sara anticlockwise. Sara needs 12 minutes to run once around, Leo only needs 4 minutes. After 12 minutes they stop — both are back at the start together. How many times did they meet? (Count the meeting at the end, but not the start.)',
            track: { labels: blank('start', 4), cw: { name: 'Leo', parts: 3 }, ccw: { name: 'Sara', parts: 1 } }, check: { meetings: 4 },
            choices: ['1', '2', '3', '4', '5'], answer: 3,
            hint: 'How many times around does each run in 12 minutes?',
            solution: 'In 12 minutes Sara runs 1 time and Leo 3 times around: 1 + 3 = 4 laps together, so <b>4</b> meetings.'
        },
        {
            id: '10', part: 'Part C', points: 5,
            text: 'Sam and Emma start together at the same spot of a round track. Sam runs clockwise and Emma anticlockwise. Emma needs 8 minutes to run once around, Sam also needs 8 minutes. After 24 minutes they stop — both are back at the start together. How many times did they meet? (Count the meeting at the end, but not the start.)',
            track: { labels: blank('start', 2), cw: { name: 'Sam', parts: 1 }, ccw: { name: 'Emma', parts: 1 } }, stopAt: 6, check: { meetings: 6 },
            choices: ['1', '3', '5', '6', '7'], answer: 3,
            hint: 'How many times around does each run in 24 minutes? Careful: they are at the start together more than once!',
            solution: 'In 24 minutes Emma runs 3 and Sam runs 3 times around: 3 + 3 = 6 laps together, so <b>6</b> meetings.'
        }
    ];

    // Questions whose figure in the contest shows only the start point
    const NO_POINTS = ['7', '8', '9', '10'];

    window.MK.register({
        id: 'circle-runners',
        title: 'Runners on a circle',
        topic: 'Movement',
        summary: 'Two runners go opposite ways round a circle. Between two meetings they run exactly once around together.',
        source: {
            label: 'Math Kangaroo 2025 · Ecolier (Grade 3–4) · Q10',
            pdf: 'set-01/by_level/Grade_03-04_Ecolier/y2025_q10.pdf'
        },
        steps,
        practice,
        practiceIntro: 'Use the recipe: count the parts, parts to the first meeting, the same every time, parts into laps.',
        figure(q, el) {
            if (!q.track) return;
            const t = NO_POINTS.includes(q.id) ? { ...q.track, labels: [q.track.labels[0]] } : q.track;
            el.innerHTML = `<div class="center-pic">${circleSVG(t, { size: 200 })}</div>`;
        },
        helper(q) {
            if (!q.track) return null;
            return {
                label: 'Let them run',
                title: 'Press the button to see each meeting',
                draw: el => track(el, q.track, { table: true, stopAfter: q.stopAt || q.stop })
            };
        },
        _check: { meetingPoint, meetingsUntilStart, N }
    });
})();
