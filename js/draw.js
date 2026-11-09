// draw.js - SVG drawings: children with T-shirts and cards, rows of children, number grids, lamps.
(function () {
    const SHIRT_FILL = {
        white: '#ffffff',
        striped: 'url(#p-striped)',
        dotted: 'url(#p-dotted)',
        black: '#2d2d2d'
    };

    const CARD_COLOR = {
        circle: '#e53935',
        star: '#f9a825',
        triangle: '#43a047',
        square: '#1e88e5',
        diamond: '#8e24aa',
        cross: '#fb8c00'
    };

    const EMOJI = { circle: '●', star: '★', triangle: '▲', square: '■', diamond: '◆', cross: '✚' };

    function shape(kind, cx, cy, r, color) {
        const c = color || CARD_COLOR[kind] || '#333';
        switch (kind) {
            case 'circle':
                return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}"/>`;
            case 'square':
                return `<rect x="${cx - r * 0.85}" y="${cy - r * 0.85}" width="${r * 1.7}" height="${r * 1.7}" fill="${c}"/>`;
            case 'triangle':
                return `<polygon points="${cx},${cy - r} ${cx + r},${cy + r * 0.8} ${cx - r},${cy + r * 0.8}" fill="${c}"/>`;
            case 'diamond':
                return `<polygon points="${cx},${cy - r} ${cx + r * 0.8},${cy} ${cx},${cy + r} ${cx - r * 0.8},${cy}" fill="${c}"/>`;
            case 'cross': {
                const t = r * 0.38;
                return `<path d="M${cx - t},${cy - r}h${2 * t}v${r - t}h${r - t}v${2 * t}h-${r - t}v${r - t}h-${2 * t}v-${r - t}h-${r - t}v-${2 * t}h${r - t}z" fill="${c}"/>`;
            }
            case 'star': {
                let pts = [];
                for (let k = 0; k < 10; k++) {
                    const rr = k % 2 === 0 ? r * 1.1 : r * 0.45;
                    const a = -Math.PI / 2 + (k * Math.PI) / 5;
                    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
                }
                return `<polygon points="${pts.join(' ')}" fill="${c}"/>`;
            }
            default:
                return '';
        }
    }

    // One child holding a card. shirt / card may be null (= hidden, shows a "?").
    function child(shirt, card, opts = {}) {
        const w = opts.size || 64;
        const h = w * (80 / 60);
        const shirtFill = shirt ? SHIRT_FILL[shirt] : '#e8e8e8';
        const shirtQ = shirt ? '' : `<text x="20" y="43" text-anchor="middle" font-size="14" font-weight="700" fill="#999">?</text>`;
        const cardInner = card ? shape(card, 48, 36, 7) : opts.blankCard ? '' :
            `<text x="48" y="41" text-anchor="middle" font-size="13" font-weight="700" fill="#999">?</text>`;
        return `<svg viewBox="0 0 60 80" width="${w}" height="${h}" class="kid-svg" aria-hidden="true">
            <circle cx="20" cy="12" r="9" fill="#ffd8a8" stroke="#333" stroke-width="1.5"/>
            <rect x="8" y="22" width="24" height="32" rx="3" fill="${shirtFill}" stroke="#333" stroke-width="1.5"/>
            ${shirtQ}
            <line x1="32" y1="30" x2="39" y2="34" stroke="#333" stroke-width="1.5"/>
            <rect x="38" y="25" width="20" height="22" rx="3" fill="#fff" stroke="#333" stroke-width="1.5"/>
            ${cardInner}
            <line x1="15" y1="54" x2="15" y2="72" stroke="#333" stroke-width="2"/>
            <line x1="25" y1="54" x2="25" y2="72" stroke="#333" stroke-width="2"/>
        </svg>`;
    }

    function at(list, i) {
        return list ? list[(i - 1) % list.length] : null;
    }

    // A row of children. Returns an element. opts:
    //  shirts, cards: repeating lists (null => plain white shirt / no card)
    //  from, to: numbers of the children to draw
    //  block: draw a dashed line every `block` children
    //  hide: 'shirt' | 'card' to show a "?" instead
    //  onPick(i, el): makes the children clickable
    //  marked: array of child numbers to highlight
    function strip(opts) {
        const from = opts.from || 1;
        const to = opts.to;
        const wrap = document.createElement('div');
        wrap.className = 'strip';
        for (let i = from; i <= to; i++) {
            const shirt = opts.hide === 'shirt' ? null : (opts.shirts ? at(opts.shirts, i) : 'white');
            const card = opts.hide === 'card' ? null : at(opts.cards, i);
            const el = document.createElement(opts.onPick ? 'button' : 'div');
            el.className = 'kid';
            el.dataset.n = i;
            if (opts.block) {
                if (i > from && (i - 1) % opts.block === 0) el.classList.add('block-start');
                if (Math.floor((i - 1) / opts.block) % 2 === 1) el.classList.add('block-alt');
            }
            if (opts.marked && opts.marked.includes(i)) el.classList.add('marked');
            el.innerHTML = child(shirt, card, { size: opts.size, blankCard: !opts.cards }) + `<span class="kid-num">${i}</span>`;
            if (opts.onPick) {
                el.type = 'button';
                el.addEventListener('click', () => opts.onPick(i, el));
            }
            wrap.appendChild(el);
        }
        if (opts.more) {
            const dots = document.createElement('div');
            dots.className = 'strip-more';
            dots.textContent = opts.more;
            wrap.appendChild(dots);
        }
        return wrap;
    }

    // Two lamps flashing: a row of seconds with dots.
    function lamps(a, b, upTo) {
        const wrap = document.createElement('div');
        wrap.className = 'lamps';
        let html = `<div class="lamp-row lamp-head"><span class="lamp-label">second</span>`;
        for (let s = 1; s <= upTo; s++) html += `<span class="lamp-cell num">${s}</span>`;
        html += `</div><div class="lamp-row"><span class="lamp-label">big lamp (every ${a})</span>`;
        for (let s = 1; s <= upTo; s++) html += `<span class="lamp-cell ${s % a === 0 ? (s % b === 0 ? 'on both' : 'on big') : ''}"></span>`;
        html += `</div><div class="lamp-row"><span class="lamp-label">small lamp (every ${b})</span>`;
        for (let s = 1; s <= upTo; s++) html += `<span class="lamp-cell ${s % b === 0 ? (s % a === 0 ? 'on both' : 'on small') : ''}"></span>`;
        html += `</div>`;
        wrap.innerHTML = html;
        return wrap;
    }

    // Inline label like "▲ triangle" in the card's colour.
    function cardTag(kind) {
        return `<span class="card-tag" style="color:${CARD_COLOR[kind]}">${EMOJI[kind]} ${kind}</span>`;
    }

    // A small T-shirt drawing in the same style as the children.
    function shirtIcon(kind, size = 30) {
        return `<svg viewBox="0 0 30 30" width="${size}" height="${size}" aria-hidden="true"><path d="M9,4 L4,8 L6,13 L9,11 L9,27 L21,27 L21,11 L24,13 L26,8 L21,4 Q15,8 9,4 z" fill="${SHIRT_FILL[kind]}" stroke="#333" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
    }

    function shirtTag(kind) {
        return `<span class="shirt-tag shirt-${kind}">${kind}</span>`;
    }

    window.Draw = { child, strip, lamps, shape, cardTag, shirtTag, shirtIcon, at, CARD_COLOR, EMOJI };
})();
