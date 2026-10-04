/* =========================================================
   Pokédex Adventure — utilidades y carga de assets
   Todo cuelga del espacio de nombres global PA para que el
   juego funcione con <script> clásicos (también abriendo
   index.html con doble clic, sin servidor).
   ========================================================= */
window.PA = window.PA || {};

(function (PA) {
  'use strict';

  const U = {};

  U.randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  U.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  U.chance = (p) => Math.random() < p;
  U.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  U.uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
  U.money = (n) => '₽' + Math.round(n).toLocaleString('es-ES');
  U.pct = (p) => Math.round(p * 100) + '%';

  /** Elige un elemento según un peso calculado por wf(elemento). */
  U.weighted = (list, wf) => {
    let total = 0;
    const ws = list.map((x) => { const w = Math.max(0, wf(x)); total += w; return w; });
    if (total <= 0) return null;
    let r = Math.random() * total;
    for (let i = 0; i < list.length; i++) { r -= ws[i]; if (r <= 0) return list[i]; }
    return list[list.length - 1];
  };

  /** Mini creador de elementos DOM: h('div', {class:'x', onClick: fn}, hijos...) */
  U.h = (tag, attrs, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') { for (const [sk, sv] of Object.entries(v)) { if (sk.startsWith('--')) el.style.setProperty(sk, sv); else el.style[sk] = sv; } }
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false) continue;
      el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    }
    return el;
  };

  U.toast = (msg, kind = 'info') => {
    const box = document.getElementById('toasts');
    if (!box) return;
    const t = U.h('div', { class: 'toast toast-' + kind, text: msg });
    box.append(t);
    setTimeout(() => t.classList.add('out'), 2600);
    setTimeout(() => t.remove(), 3100);
  };

  PA.util = U;

  /* ---------------- Assets con respaldo ---------------- */
  const TYPE_COLORS = {
    normal: '#a8a77a', fire: '#ee8130', water: '#6390f0', grass: '#7ac74c', electric: '#f7d02c',
    ice: '#96d9d6', fighting: '#c22e28', poison: '#a33ea1', ground: '#e2bf65', flying: '#a98ff3',
    psychic: '#f95587', bug: '#a6b91a', rock: '#b6a136', ghost: '#735797', dragon: '#6f35fc',
    dark: '#705746', steel: '#b7b7ce', fairy: '#d685ad'
  };
  const TYPE_NAMES = {
    normal: 'Normal', fire: 'Fuego', water: 'Agua', grass: 'Planta', electric: 'Eléctrico', ice: 'Hielo',
    fighting: 'Lucha', poison: 'Veneno', ground: 'Tierra', flying: 'Volador', psychic: 'Psíquico',
    bug: 'Bicho', rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón', dark: 'Siniestro', steel: 'Acero', fairy: 'Hada'
  };

  const warned = new Set();
  function warnMissing(path, what) {
    if (warned.has(path)) return;
    warned.add(path);
    console.warn(`[Pokédex Adventure] Falta el asset (${what}): ${path} → se usa el respaldo visual.`);
  }

  const svgUri = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  const escXml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /** Tarjeta genérica (colores de tipo + iniciales). No representa al Pokémon. */
  function placeholderPokemon(p, shiny) {
    const c1 = TYPE_COLORS[p.types[0]] || '#888';
    const c2 = TYPE_COLORS[p.types[1]] || c1;
    const initials = escXml(p.name.replace(/\(.*?\)|de \w+/gi, '').trim().slice(0, 2).toUpperCase());
    const stroke = shiny ? '#ffc94a' : '#0f0d26';
    return svgUri(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>` +
      `<rect x="4" y="4" width="88" height="88" rx="10" fill="url(#g)" stroke="${stroke}" stroke-width="${shiny ? 6 : 4}"/>` +
      `<text x="48" y="58" font-family="monospace" font-size="30" font-weight="bold" text-anchor="middle" fill="#fff" stroke="#0f0d26" stroke-width="1.5">${initials}</text>` +
      (shiny ? `<text x="76" y="28" font-size="20" text-anchor="middle" fill="#fff6c8">✦</text>` : '') +
      `<text x="48" y="82" font-family="monospace" font-size="8" text-anchor="middle" fill="#fff" opacity=".8">SIN SPRITE</text></svg>`
    );
  }

  /** <img> que va probando rutas y termina en un respaldo que nunca falla. */
  function imgChain(sources, fallback, alt, cls) {
    const img = new Image();
    img.alt = alt;
    img.className = cls || '';
    img.draggable = false;
    img.decoding = 'async';
    let i = 0;
    const extra = sources.map((s) => s.cls).filter(Boolean);
    const next = () => {
      extra.forEach((c) => img.classList.remove(c));
      if (i < sources.length) {
        const s = sources[i++];
        if (s.cls) img.classList.add(s.cls);
        img.dataset.src = s.src;
        img.src = s.src;
      } else {
        img.onerror = null;
        img.classList.add('is-placeholder');
        img.src = fallback;
      }
    };
    img.onerror = () => { warnMissing(img.dataset.src, alt); next(); };
    next();
    return img;
  }

  PA.assets = {
    TYPE_COLORS,
    TYPE_NAMES,
    warnMissing,
    spritePath: (id, shiny) => `assets/sprites/pokemon/${shiny ? 'shiny/' : ''}${id}.png`,

    /** Sprite Pokémon. Si falta el shiny, usa el normal con filtro; si falta todo, tarjeta genérica. */
    pokemonImg(p, shiny, cls) {
      const sources = shiny
        ? [{ src: this.spritePath(p.id, true) }, { src: this.spritePath(p.id, false), cls: 'shiny-tint' }]
        : [{ src: this.spritePath(p.id, false) }];
      return imgChain(sources, placeholderPokemon(p, shiny), p.name + (shiny ? ' shiny' : ''), 'sprite ' + (cls || ''));
    },

    /** Icono de objeto: PNG en assets/items/<id>.png o emoji de respaldo. */
    itemIcon(id, cls) {
      const def = PA.ITEMS[id];
      const span = PA.util.h('span', { class: 'item-icon ' + (cls || ''), title: def ? def.name : id });
      const path = `assets/items/${id}.png`;
      const img = new Image();
      img.alt = def ? def.name : id;
      img.draggable = false;
      img.onload = () => { span.textContent = ''; span.append(img); };
      img.onerror = () => warnMissing(path, 'icono de objeto');
      span.textContent = def ? def.icon : '❔';
      img.src = path;
      return span;
    },

    /** Fondo de zona: imagen opcional sobre un degradado que siempre se ve. */
    applyZoneBg(el, zone) {
      const path = `assets/zones/${zone.id}.jpg`;
      const grad = `linear-gradient(135deg, ${zone.colors[0]}, ${zone.colors[1]})`;
      el.style.backgroundImage = grad;
      const probe = new Image();
      probe.onload = () => { el.style.backgroundImage = `linear-gradient(180deg, transparent 30%, rgba(15,13,38,.85)), url("${path}"), ${grad}`; };
      probe.onerror = () => warnMissing(path, 'fondo de zona');
      probe.src = path;
    }
  };
})(window.PA);
