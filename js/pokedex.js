/* =========================================================
   Pokédex y Shiny Dex: registro, recompensas y pantallas
   ========================================================= */
(function (PA) {
  'use strict';
  const U = PA.util;
  const h = U.h;

  const D = {};

  D.entry = (id) => {
    if (!PA.state.dex[id]) PA.state.dex[id] = { seen: false, caught: 0, shinySeen: false, shinyCaught: 0 };
    return PA.state.dex[id];
  };

  D.counts = () => {
    let seen = 0, caught = 0, shiny = 0;
    for (const p of PA.POKEMON) {
      const e = PA.state.dex[p.id];
      if (!e) continue;
      if (e.seen) seen++;
      if (e.caught > 0) caught++;
      if (e.shinyCaught > 0) shiny++;
    }
    return { seen, caught, shiny, total: PA.POKEMON.length };
  };

  D.shinyRate = (exp) => {
    let r = PA.SHINY_RATE;
    if (PA.state.keyItems['amuleto-iris']) r *= 3;
    if (exp) {
      const z = PA.ZONES_BY_ID[exp.zone];
      if (z && exp.depth > z.safe) r *= 1.5; // premio por arriesgar
    }
    return r;
  };

  D.registerSeen = (p, shiny) => {
    const e = D.entry(p.id);
    e.seen = true;
    if (shiny) { e.shinySeen = true; PA.state.records.shinyFound++; }
  };

  /** Registra una captura y paga recompensas. Devuelve info para la UI. */
  D.registerCatch = (p, shiny) => {
    const e = D.entry(p.id);
    const r = PA.RARITY[p.rarity];
    const first = e.caught === 0;
    const firstShiny = shiny && e.shinyCaught === 0;
    e.caught++;
    if (shiny) e.shinyCaught++;

    let reward = first ? r.reward : Math.round(r.reward * 0.1); // capturas repetidas siguen dando algo
    if (firstShiny) reward += r.reward * 3;
    const notes = [];

    // Hitos cada 5 especies distintas
    const { caught, total, shiny: shinyCount } = D.counts();
    const milestone = Math.floor(caught / 5) * 5;
    if (milestone > 0 && !PA.state.milestones.includes('dex' + milestone)) {
      PA.state.milestones.push('dex' + milestone);
      const bonus = 100 * milestone;
      reward += bonus;
      notes.push(`Hito: ${milestone} especies registradas (+${U.money(bonus)})`);
    }
    if (caught === total && !PA.state.milestones.includes('dex-complete')) {
      PA.state.milestones.push('dex-complete');
      reward += 20000;
      notes.push('¡Pokédex completada! (+₽20.000)');
    }
    if (shinyCount === total && !PA.state.milestones.includes('shiny-complete')) {
      PA.state.milestones.push('shiny-complete');
      reward += 100000;
      notes.push('¡SHINY DEX COMPLETADA! (+₽100.000)');
    }

    PA.state.money += reward;
    return { first, firstShiny, reward, notes };
  };

  /* ---------------- Pantallas ---------------- */
  function typeChips(p) {
    return h('div', { class: 'types' }, p.types.map((t) =>
      h('span', { class: 'type', style: { background: PA.assets.TYPE_COLORS[t] }, text: PA.assets.TYPE_NAMES[t] || t })));
  }

  function zonesOf(p) {
    return PA.ZONES.filter((z) => z.pool.includes(p.id)).map((z) => z.name).join(', ');
  }

  D.render = (root, shinyMode) => {
    const c = D.counts();
    const done = shinyMode ? c.shiny : c.caught;
    const list = h('div', { class: 'dex-grid' });

    for (const p of PA.POKEMON) {
      const e = PA.state.dex[p.id] || {};
      const r = PA.RARITY[p.rarity];
      const known = shinyMode ? e.shinyCaught > 0 : e.caught > 0;
      const glimpsed = shinyMode ? e.shinySeen : e.seen;
      const card = h('article', { class: `dex-card ${known ? 'is-caught' : glimpsed ? 'is-seen' : 'is-unknown'} ${shinyMode ? 'is-shinymode' : ''} ${p.lore ? 'is-lore' : ''}` });
      const img = PA.assets.pokemonImg(p, shinyMode, known ? '' : 'silhouette');
      card.append(...[
        h('div', { class: 'dex-num', text: '#' + String(p.n).padStart(3, '0') }),
        h('div', { class: 'dex-sprite' }, img),
        h('h3', { text: known || glimpsed ? p.name : '???' }),
        known || glimpsed ? typeChips(p) : h('div', { class: 'types' }),
        h('div', { class: 'dex-meta' },
          h('span', { class: 'rarity ' + (known ? r.cls : ''), text: known ? r.label : '—' }),
          known ? h('span', { class: 'dex-count', text: '×' + (shinyMode ? e.shinyCaught : e.caught) }) : null
        ),
        known ? h('p', { class: 'dex-zones', text: zonesOf(p) }) : (glimpsed ? h('p', { class: 'dex-zones', text: 'Visto, sin capturar' }) : null)
      ].filter(Boolean));
      list.append(card);
    }

    root.append(h('section', { class: 'screen' },
      h('div', { class: 'screen-head' },
        h('h2', { text: shinyMode ? 'Shiny Dex' : 'Pokédex' }),
        h('p', { class: 'lead' }, shinyMode
          ? `Probabilidad actual de shiny: 1/${Math.round(1 / D.shinyRate(null))}. Más allá de la zona segura sube ×1,5.`
          : 'Captura cada especie para cobrar su recompensa. Las de borde dorado son clave para el lore.')
      ),
      h('div', { class: 'progress-line' },
        h('div', { class: 'progress' }, h('i', { style: { width: (done / c.total * 100) + '%' } })),
        h('b', { text: `${done}/${c.total}` }),
        !shinyMode ? h('span', { class: 'muted', text: `Vistos: ${c.seen}` }) : null
      ),
      list
    ));
  };

  PA.dex = D;
})(window.PA);
