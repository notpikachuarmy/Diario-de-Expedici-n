/* =========================================================
   Estado de la partida + guardado en localStorage
   ========================================================= */
(function (PA) {
  'use strict';
  const U = PA.util;
  const SAVE_KEY = 'pokedex-adventure-save-v1';

  PA.BACKPACK_SIZES = {
    s: { w: 6, h: 5, label: 'Mochila básica' },
    m: { w: 7, h: 6, label: 'Mochila mediana' },
    l: { w: 8, h: 7, label: 'Mochila grande' }
  };

  PA.makeItem = (id) => {
    const def = PA.ITEMS[id];
    if (!def) { console.error(`[Pokédex Adventure] Objeto desconocido: ${id}`); return null; }
    return { uid: U.uid(), id, uses: def.uses != null ? def.uses : null };
  };

  function fresh() {
    const starter = ['pokeball', 'pokeball', 'pokeball', 'pokeball', 'pokeball', 'baya', 'baya', 'pocion', 'racion', 'racion', 'cafe', 'linterna'];
    return {
      version: 1,
      money: 600,
      storage: starter.map(PA.makeItem),      // objetos en la base (fuera de la mochila)
      backpack: { size: 's', placed: [] },     // {uid,id,uses,x,y,rot}
      keyItems: {},                            // {'amuleto-iris': true, ...}
      dex: {},                                 // {id: {seen, caught, shinySeen, shinyCaught}}
      milestones: [],
      records: { expeditions: 0, deepest: 0, bestHaul: 0, faints: 0, shinyFound: 0 },
      exp: null,                               // expedición en curso
      lastResult: null
    };
  }

  PA.state = fresh();

  PA.save = () => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(PA.state));
    } catch (e) {
      console.error('[Pokédex Adventure] No se pudo guardar la partida (¿localStorage bloqueado?).', e);
    }
  };

  PA.load = () => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      const base = fresh();
      PA.state = Object.assign(base, data);
      PA.state.records = Object.assign(fresh().records, data.records || {});
      // Limpia objetos que ya no existan en items.js
      PA.state.storage = (PA.state.storage || []).filter((it) => it && PA.ITEMS[it.id]);
      PA.state.backpack.placed = (PA.state.backpack.placed || []).filter((it) => it && PA.ITEMS[it.id]);
      return true;
    } catch (e) {
      console.error('[Pokédex Adventure] Partida guardada corrupta: se empieza de cero.', e);
      return false;
    }
  };

  PA.resetSave = () => {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* nada */ }
    PA.state = fresh();
    PA.save();
  };

  PA.bpSize = () => PA.BACKPACK_SIZES[PA.state.backpack.size] || PA.BACKPACK_SIZES.s;
})(window.PA);
