/* =========================================================
   Zonas de expedición.
   unlock  → Pokémon distintos capturados necesarios
   length  → nº de pasos hasta el límite (evento final)
   safe    → a partir de aquí los objetos pueden romperse
   cost    → gasto por paso de estamina (st) y saciedad (fd)
   tags    → qué eventos pueden salir (ver events.js)
   reward  → bonus por llegar al límite
   ========================================================= */
(function (PA) {
  'use strict';

  PA.ZONES = [
    {
      id: 'bosque-argalia', name: 'Bosque de Argalia', emoji: '🌳', stars: 1,
      desc: 'Arboleda espesa donde viven las formas regionales de Argalia.',
      unlock: 0, length: 10, safe: 6, cost: { st: 7, fd: 5 }, encounterRate: 0.42, reward: 300,
      tags: ['forest'], colors: ['#2f6b3a', '#173a26'],
      pool: ['pichu-argalia', 'pikachu-argalia', 'raichu-argalia', 'delibird-argalia', 'wickbrid', 'hoppip', 'skiploom', 'jumpluff', 'aipom', 'ambipom', 'bidoof', 'phantump']
    },
    {
      id: 'costa-escarcha', name: 'Costa Escarcha', emoji: '🌊', stars: 2,
      desc: 'Playa helada con mareas traicioneras y témpanos a la deriva.',
      unlock: 3, length: 11, safe: 6, cost: { st: 8, fd: 6 }, encounterRate: 0.42, reward: 450,
      tags: ['coast', 'cold'], colors: ['#3a7bbf', '#14304f'],
      pool: ['magikarp', 'gyarados', 'krabby', 'kingler', 'spheal', 'sealeo', 'walrein', 'vulpix-alola', 'ninetales-alola', 'wooper', 'quagsire']
    },
    {
      id: 'marisma-turbia', name: 'Marisma Turbia', emoji: '🪷', stars: 2,
      desc: 'Barro hasta las rodillas. Dicen que aquí se esconden Wooper muy especiales.',
      unlock: 6, length: 11, safe: 6, cost: { st: 9, fd: 6 }, encounterRate: 0.4, reward: 500,
      tags: ['swamp'], colors: ['#5d6b2e', '#2a2f17'],
      pool: ['wooper', 'quagsire', 'wooper-paldea', 'clodsire', 'bidoof', 'bibarel', 'krabby', 'magikarp', 'hoppip']
    },
    {
      id: 'cumbres-viento', name: 'Cumbres del Viento', emoji: '🏔️', stars: 3,
      desc: 'Picos azotados por el viento. Las aves más fuertes anidan en lo alto.',
      unlock: 10, length: 12, safe: 7, cost: { st: 10, fd: 7 }, encounterRate: 0.4, reward: 700,
      tags: ['mountain', 'cold', 'cave'], colors: ['#8a9bb8', '#2c3550'],
      pool: ['pidgey', 'pidgeotto', 'pidgeot', 'mega-pidgeot', 'drifloon', 'drifblim', 'hoppip', 'skiploom', 'jumpluff', 'dedenne', 'aipom']
    },
    {
      id: 'ruinas-sombra', name: 'Ruinas de la Sombra', emoji: '🏚️', stars: 4,
      desc: 'Templo derruido donde algo te observa desde la oscuridad.',
      unlock: 15, length: 12, safe: 7, cost: { st: 10, fd: 7 }, encounterRate: 0.45, reward: 900,
      tags: ['ruins', 'cave'], colors: ['#4b3a6e', '#1a1430'],
      pool: ['mimikyu', 'phantump', 'trevenant', 'drifloon', 'drifblim', 'wickbrid', 'deino', 'dedenne', 'ambipom']
    },
    {
      id: 'crater-ascuas', name: 'Cráter Ascuas', emoji: '🌋', stars: 5,
      desc: 'Volcán activo. Solo los dragones más feroces resisten este calor.',
      unlock: 20, length: 13, safe: 7, cost: { st: 11, fd: 8 }, encounterRate: 0.42, reward: 1300,
      tags: ['volcano', 'cave', 'mountain'], colors: ['#b8432a', '#3a1210'],
      pool: ['slugma', 'magcargo', 'deino', 'zweilous', 'hydreigon', 'pidgeot']
    }
  ];

  PA.ZONES_BY_ID = Object.fromEntries(PA.ZONES.map((z) => [z.id, z]));
})(window.PA);
