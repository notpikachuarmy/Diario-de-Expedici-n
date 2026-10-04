/* =========================================================
   Objetos. shape = filas de la forma en la mochila ('X' ocupa, '.' vacío).
   cat: ball | heal | food | energy | tool | lure | key
   - ball   → multiplicador de captura
   - use    → efecto al usarlo en expedición {hp, st, fd}
   - tool   → etiqueta que piden los eventos; uses = usos antes de romperse
   - passive→ efecto mientras está en la mochila
   - key    → objeto clave: no ocupa mochila, se compra una vez
   ========================================================= */
(function (PA) {
  'use strict';

  PA.ITEMS = {
    pokeball:  { name: 'Poké Ball',        icon: '🔴', shape: ['X'],            price: 60,  cat: 'ball', ball: 1,   desc: 'Ball básica. Captura ×1.' },
    superball: { name: 'Super Ball',       icon: '🔵', shape: ['X'],            price: 160, cat: 'ball', ball: 1.5, desc: 'Captura ×1,5.' },
    ultraball: { name: 'Ultra Ball',       icon: '🟡', shape: ['X'],            price: 380, cat: 'ball', ball: 2.2, desc: 'Captura ×2,2.' },

    baya:      { name: 'Baya Aranja',      icon: '🫐', shape: ['X'],            price: 40,  cat: 'heal', use: { hp: 15 },          desc: '+15 de salud.' },
    pocion:    { name: 'Poción',           icon: '🧪', shape: ['X', 'X'],       price: 120, cat: 'heal', use: { hp: 40 },          desc: '+40 de salud.' },
    botiquin:  { name: 'Botiquín',         icon: '🩹', shape: ['XX', 'XX'],     price: 340, cat: 'heal', use: { hp: 80 },          desc: '+80 de salud.' },

    lata:      { name: 'Lata de conserva', icon: '🥫', shape: ['X'],            price: 35,  cat: 'food', use: { fd: 20 },          desc: '+20 de saciedad.' },
    racion:    { name: 'Ración de viaje',  icon: '🍱', shape: ['XX'],           price: 70,  cat: 'food', use: { fd: 45 },          desc: '+45 de saciedad.' },

    cafe:      { name: 'Café de termo',    icon: '☕', shape: ['X'],            price: 50,  cat: 'energy', use: { st: 25 },        desc: '+25 de estamina.' },
    sacodormir:{ name: 'Saco de dormir',   icon: '🛏️', shape: ['XX', 'XX'],     price: 260, cat: 'tool', tool: 'saco', uses: 3,    desc: 'Permite acampar en los descansos (+estamina). 3 usos.' },

    cuerda:    { name: 'Cuerda',           icon: '🪢', shape: ['XXX'],          price: 150, cat: 'tool', tool: 'cuerda', uses: 3,  desc: 'Barrancos, nidos y paredes. 3 usos.' },
    linterna:  { name: 'Linterna',         icon: '🔦', shape: ['X', 'X'],       price: 180, cat: 'tool', tool: 'linterna', uses: 4, desc: 'Cuevas y ruinas oscuras. 4 usos.' },
    botas:     { name: 'Botas de agua',    icon: '🥾', shape: ['XX', 'X.'],     price: 200, cat: 'tool', tool: 'botas', uses: 4,   desc: 'Pantanos, barro y lava fría. 4 usos.' },
    manta:     { name: 'Manta térmica',    icon: '🧣', shape: ['XX'],           price: 140, cat: 'tool', tool: 'manta', uses: 3,   desc: 'Protege del frío y la ventisca. 3 usos.' },
    machete:   { name: 'Machete',          icon: '🔪', shape: ['X', 'X', 'X'],  price: 190, cat: 'tool', tool: 'machete', uses: 5, desc: 'Abre paso entre la maleza. 5 usos.' },
    repelente: { name: 'Repelente',        icon: '🧴', shape: ['X'],            price: 90,  cat: 'tool', tool: 'repelente', uses: 1, desc: 'Aleja a un Pokémon que bloquea el paso.' },
    brujula:   { name: 'Brújula',          icon: '🧭', shape: ['X'],            price: 240, cat: 'tool', tool: 'brujula', uses: 4, passive: 'brujula', desc: 'En la mochila: −25% de estamina por paso. Sirve en la niebla.' },

    cebo:      { name: 'Cebo',             icon: '🍯', shape: ['X'],            price: 80,  cat: 'lure', desc: 'Fuera de combate: el siguiente paso es un encuentro más raro. En un encuentro: captura ×1,25.' },

    // Objetos clave (no van en la mochila)
    'amuleto-iris': { name: 'Amuleto Iris',   icon: '🌈', price: 15000, cat: 'key', desc: 'Triplica la probabilidad de shiny.' },
    'mochila-m':    { name: 'Mochila mediana', icon: '🎒', price: 1500, cat: 'key', desc: 'La mochila pasa a 7×6.' },
    'mochila-l':    { name: 'Mochila grande',  icon: '🎒', price: 5000, cat: 'key', requires: 'mochila-m', desc: 'La mochila pasa a 8×7.' }
  };

  // Colores de las piezas en la cuadrícula
  PA.CAT_COLORS = { ball: '#e2364b', heal: '#45c48a', food: '#f08c3a', energy: '#b07a4f', tool: '#4f86d9', lure: '#c45bd6', key: '#ffc94a' };

  // Botín aleatorio de eventos (peso)
  PA.LOOT_TABLE = [
    ['pokeball', 30], ['baya', 22], ['lata', 18], ['cafe', 14], ['superball', 10], ['pocion', 9],
    ['cebo', 6], ['repelente', 6], ['ultraball', 3], ['cuerda', 3], ['manta', 2]
  ];
})(window.PA);
