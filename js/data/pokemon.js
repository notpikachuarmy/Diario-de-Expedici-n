/* =========================================================
   Pokémon disponibles.
   - id      → nombre del archivo del sprite (assets/sprites/pokemon/<id>.png)
   - rarity  → clave de PA.RARITY
   - lore    → importante para el lore del canal (siempre rarísimo)
   - fakemon → forma regional / criatura propia (sprite lo pones tú)
   - hostile → si falla la captura puede atacarte
   ========================================================= */
(function (PA) {
  'use strict';

  PA.RARITY = {
    comun:     { label: 'Común',      weight: 100, catch: 0.65, reward: 60,   flee: 0.12, cls: 'r-comun' },
    pococomun: { label: 'Poco común', weight: 42,  catch: 0.48, reward: 150,  flee: 0.18, cls: 'r-poco' },
    raro:      { label: 'Raro',       weight: 14,  catch: 0.32, reward: 400,  flee: 0.24, cls: 'r-raro' },
    muyraro:   { label: 'Muy raro',   weight: 5,   catch: 0.2,  reward: 900,  flee: 0.3,  cls: 'r-muyraro' },
    lore:      { label: 'Lore ✦',     weight: 1.5, catch: 0.14, reward: 2000, flee: 0.35, cls: 'r-lore' },
    mega:      { label: 'Mega',       weight: 0.6, catch: 0.08, reward: 4000, flee: 0.4,  cls: 'r-mega' }
  };

  // Probabilidad base de shiny (1/256). El Amuleto Iris la triplica.
  PA.SHINY_RATE = 1 / 256;

  const P = (n, id, name, types, rarity, extra) => Object.assign({ n, id, name, types, rarity }, extra || {});

  PA.POKEMON = [
    P(1,  'wooper',            'Wooper',              ['water', 'ground'],   'lore',      { lore: true }),
    P(2,  'quagsire',          'Quagsire',            ['water', 'ground'],   'raro'),
    P(3,  'magikarp',          'Magikarp',            ['water'],             'comun'),
    P(4,  'gyarados',          'Gyarados',            ['water', 'flying'],   'muyraro',   { hostile: true }),
    P(5,  'delibird-argalia',  'Delibird de Argalia', ['grass'],             'pococomun', { fakemon: true }),
    P(6,  'wickbrid',          'Wickbrid',            ['grass', 'dark'],     'raro',      { fakemon: true }),
    P(7,  'pichu-argalia',     'Pichu de Argalia',    ['grass'],             'comun',     { fakemon: true }),
    P(8,  'pikachu-argalia',   'Pikachu de Argalia',  ['grass'],             'pococomun', { fakemon: true }),
    P(9,  'raichu-argalia',    'Raichu de Argalia',   ['grass'],             'muyraro',   { fakemon: true }),
    P(10, 'krabby',            'Krabby',              ['water'],             'comun'),
    P(11, 'kingler',           'Kingler',             ['water'],             'raro'),
    P(12, 'spheal',            'Spheal',              ['ice', 'water'],      'comun'),
    P(13, 'sealeo',            'Sealeo',              ['ice', 'water'],      'pococomun'),
    P(14, 'walrein',           'Walrein',             ['ice', 'water'],      'raro'),
    P(15, 'vulpix-alola',      'Vulpix de Alola',     ['ice'],               'pococomun'),
    P(16, 'ninetales-alola',   'Ninetales de Alola',  ['ice', 'fairy'],      'muyraro'),
    P(17, 'dedenne',           'Dedenne',             ['electric', 'fairy'], 'lore',      { lore: true }),
    P(18, 'hoppip',            'Hoppip',              ['grass', 'flying'],   'comun'),
    P(19, 'skiploom',          'Skiploom',            ['grass', 'flying'],   'pococomun'),
    P(20, 'jumpluff',          'Jumpluff',            ['grass', 'flying'],   'lore',      { lore: true }),
    P(21, 'wooper-paldea',     'Wooper de Paldea',    ['poison', 'ground'],  'lore',      { lore: true }),
    P(22, 'clodsire',          'Clodsire',            ['poison', 'ground'],  'lore',      { lore: true }),
    P(23, 'aipom',             'Aipom',               ['normal'],            'comun'),
    P(24, 'ambipom',           'Ambipom',             ['normal'],            'raro'),
    P(25, 'bidoof',            'Bidoof',              ['normal'],            'comun'),
    P(26, 'bibarel',           'Bibarel',             ['normal', 'water'],   'pococomun'),
    P(27, 'pidgey',            'Pidgey',              ['normal', 'flying'],  'comun'),
    P(28, 'pidgeotto',         'Pidgeotto',           ['normal', 'flying'],  'pococomun'),
    P(29, 'pidgeot',           'Pidgeot',             ['normal', 'flying'],  'raro'),
    P(30, 'mega-pidgeot',      'Mega Pidgeot',        ['normal', 'flying'],  'mega',      { hostile: true }),
    P(31, 'deino',             'Deino',               ['dark', 'dragon'],    'raro'),
    P(32, 'zweilous',          'Zweilous',            ['dark', 'dragon'],    'muyraro',   { hostile: true }),
    P(33, 'hydreigon',         'Hydreigon',           ['dark', 'dragon'],    'muyraro',   { hostile: true }),
    P(34, 'drifloon',          'Drifloon',            ['ghost', 'flying'],   'comun'),
    P(35, 'drifblim',          'Drifblim',            ['ghost', 'flying'],   'pococomun'),
    P(36, 'mimikyu',           'Mimikyu',             ['ghost', 'fairy'],    'raro'),
    P(37, 'phantump',          'Phantump',            ['ghost', 'grass'],    'pococomun'),
    P(38, 'trevenant',         'Trevenant',           ['ghost', 'grass'],    'raro',      { hostile: true }),
    P(39, 'slugma',            'Slugma',              ['fire'],              'comun'),
    P(40, 'magcargo',          'Magcargo',            ['fire', 'rock'],      'pococomun')
  ];

  PA.POKEMON_BY_ID = Object.fromEntries(PA.POKEMON.map((p) => [p.id, p]));
})(window.PA);
