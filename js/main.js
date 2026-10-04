/* =========================================================
   Arranque, navegación entre pantallas y pantalla de Zonas
   ========================================================= */
(function (PA) {
  'use strict';
  const U = PA.util;
  const h = U.h;

  const UI = { current: 'zones' };

  const SCREENS = {
    zones: (root) => renderZones(root),
    backpack: (root) => PA.backpack.render(root),
    shop: (root) => PA.shop.render(root),
    dex: (root) => PA.dex.render(root, false),
    shinydex: (root) => PA.dex.render(root, true),
    expedition: (root) => PA.expedition.render(root),
    results: (root) => PA.expedition.renderResults(root)
  };

  UI.refreshHud = () => {
    const c = PA.dex.counts();
    document.getElementById('hud-money').textContent = U.money(PA.state.money);
    document.getElementById('hud-dex').textContent = `${c.caught}/${c.total}`;
    document.getElementById('hud-shiny').textContent = `${c.shiny}/${c.total}`;
  };

  UI.refresh = () => {
    const root = document.getElementById('app');
    const scroll = window.scrollY;
    root.innerHTML = '';
    // Durante una expedición no se puede ir a la base
    if (PA.state.exp && UI.current !== 'expedition') UI.current = 'expedition';
    const inBase = !['expedition', 'results'].includes(UI.current);
    document.getElementById('tabs').hidden = !inBase;
    document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('active', b.dataset.screen === UI.current));
    try {
      SCREENS[UI.current](root);
    } catch (err) {
      console.error('[Pokédex Adventure] Error al dibujar la pantalla', UI.current, err);
      root.append(h('div', { class: 'panel error-panel' },
        h('h2', { text: 'Algo ha fallado al dibujar esta pantalla' }),
        h('p', { text: String(err && err.message || err) }),
        h('button', { class: 'btn', onClick: () => { PA.state.exp = null; UI.go('zones'); } }, 'Volver a la base')));
    }
    UI.refreshHud();
    window.scrollTo(0, scroll);
  };

  UI.go = (screen) => {
    UI.current = screen;
    if (screen !== 'backpack') PA.backpack.sel = null;
    UI.refresh();
    window.scrollTo(0, 0);
  };

  /* ---------------- Zonas (pantalla de base) ---------------- */
  function renderZones(root) {
    const caught = PA.dex.counts().caught;
    const balls = PA.backpack.placed().filter((i) => PA.ITEMS[i.id].cat === 'ball').length;
    const packed = PA.backpack.placed().length;
    const rec = PA.state.records;

    const warn = !packed
      ? 'Tu mochila está vacía. Ve a Mochila y coloca tus objetos antes de salir.'
      : !balls ? 'No llevas ninguna ball en la mochila: no podrás capturar nada.' : null;

    root.append(h('section', { class: 'screen' },
      h('div', { class: 'screen-head' },
        h('h2', { text: 'Elige una zona' }),
        h('p', { class: 'lead', text: 'Cada paso gasta estamina y saciedad. Retírate a tiempo para conservar la mochila; llega al límite para cobrar el bonus de la zona a costa de desgastar tu equipo.' })
      ),
      warn ? h('div', { class: 'notice' }, warn, ' ', h('button', { class: 'btn btn-sm', onClick: () => UI.go('backpack') }, 'Abrir mochila')) : null,
      h('div', { class: 'zone-grid' }, PA.ZONES.map((z) => {
        const locked = caught < z.unlock;
        const card = h('article', { class: 'zone-card' + (locked ? ' is-locked' : '') });
        const banner = h('div', { class: 'zone-banner' }, h('span', { class: 'zone-emoji', text: z.emoji }));
        PA.assets.applyZoneBg(banner, z);
        const pool = z.pool.map((id) => PA.POKEMON_BY_ID[id]).filter(Boolean);
        const found = pool.filter((p) => (PA.state.dex[p.id] || {}).caught > 0).length;
        card.append(
          banner,
          h('div', { class: 'zone-body' },
            h('h3', { text: z.name }),
            h('div', { class: 'zone-stars', title: 'Dificultad', 'aria-label': `Dificultad ${z.stars} de 5` }, '★'.repeat(z.stars) + '☆'.repeat(5 - z.stars)),
            h('p', { text: z.desc }),
            h('dl', { class: 'zone-facts' },
              h('dt', { text: 'Pasos' }), h('dd', { text: `${z.length} (seguros: ${z.safe})` }),
              h('dt', { text: 'Bonus de límite' }), h('dd', { text: U.money(z.reward) }),
              h('dt', { text: 'Especies' }), h('dd', { text: `${found}/${pool.length} capturadas` })),
            locked
              ? h('p', { class: 'lock', text: `Captura ${z.unlock} especies distintas para desbloquear (llevas ${caught}).` })
              : h('button', { class: 'btn btn-primary btn-block', onClick: () => PA.expedition.start(z.id) }, 'Salir de expedición')
          )
        );
        return card;
      })),
      h('div', { class: 'records panel' },
        h('h3', { text: 'Récords' }),
        h('dl', { class: 'zone-facts' },
          h('dt', { text: 'Expediciones' }), h('dd', { text: rec.expeditions }),
          h('dt', { text: 'Paso más profundo' }), h('dd', { text: rec.deepest }),
          h('dt', { text: 'Mejor botín' }), h('dd', { text: U.money(rec.bestHaul) }),
          h('dt', { text: 'Shiny vistos' }), h('dd', { text: rec.shinyFound }),
          h('dt', { text: 'Desmayos' }), h('dd', { text: rec.faints })),
        h('button', { class: 'btn btn-ghost btn-sm', onClick: () => {
          if (confirm('¿Borrar toda la partida? No se puede deshacer.')) { PA.resetSave(); UI.go('zones'); U.toast('Partida reiniciada.'); }
        } }, 'Reiniciar partida')
      )
    ));
  }

  /* ---------------- Ayuda anti-bloqueo ---------------- */
  function professorHelp() {
    if (PA.state.exp) return;
    const allItems = [...PA.state.storage, ...PA.backpack.placed()];
    const hasBall = allItems.some((i) => PA.ITEMS[i.id].cat === 'ball');
    if (!hasBall && PA.state.money < PA.ITEMS.pokeball.price) {
      for (let i = 0; i < 3; i++) PA.state.storage.push(PA.makeItem('pokeball'));
      PA.state.storage.push(PA.makeItem('racion'));
      PA.save();
      U.toast('El Profesor te ha enviado 3 Poké Balls y una ración para que no te quedes tirado.', 'ok');
    }
  }

  /* ---------------- Arranque ---------------- */
  function init() {
    // Validación rápida de datos: avisa en consola si algo no cuadra
    for (const z of PA.ZONES) for (const id of z.pool) if (!PA.POKEMON_BY_ID[id]) console.error(`[Pokédex Adventure] La zona ${z.id} usa un Pokémon desconocido: ${id}`);
    for (const p of PA.POKEMON) if (!PA.ZONES.some((z) => z.pool.includes(p.id))) console.warn(`[Pokédex Adventure] ${p.name} no aparece en ninguna zona.`);

    const loaded = PA.load();
    if (!loaded) PA.save();

    document.getElementById('tabs').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-screen]');
      if (b) UI.go(b.dataset.screen);
    });

    document.addEventListener('keydown', (e) => {
      if (UI.current !== 'backpack') return;
      if (e.key === 'r' || e.key === 'R') { e.preventDefault(); PA.backpack.rotate(); }
      if (e.key === 'Escape') PA.backpack.cancel();
    });

    UI.current = PA.state.exp ? 'expedition' : PA.state.lastResult ? 'results' : 'zones';
    professorHelp();
    UI.refresh();
    if (!loaded) U.toast('¡Bienvenido! Empieza colocando tus objetos en la mochila.', 'ok');
  }

  window.addEventListener('error', (e) => {
    console.error('[Pokédex Adventure] Error no controlado:', e.message);
  });

  PA.ui = UI;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window.PA);
