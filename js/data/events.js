/* =========================================================
   Eventos de texto.
   tags: zonas donde aparece ('any' = todas). w: peso.
   Cada opción tiene:
     needs   → etiqueta de herramienta necesaria (gasta 1 uso)
     pay     → dinero que cuesta (del banco)
     fx      → efecto fijo, o outcomes: [{w, ...efecto}] aleatorio
   Efectos: text, hp, st, fd, money (n o [min,max]), loot ([ids] o 'random'),
            encounter (true), rareBoost (n), breakRandom (true)
   ========================================================= */
(function (PA) {
  'use strict';

  PA.EVENTS = [
    {
      id: 'baya-silvestre', tags: ['any'], w: 8,
      text: 'Encuentras un arbusto cargado de bayas silvestres.',
      options: [
        { label: 'Comer unas cuantas', fx: { fd: 20, text: 'Están dulces y jugosas. Recuperas saciedad.' } },
        { label: 'Guardar una en la mochila', fx: { loot: ['baya'], text: 'Arrancas una Baya Aranja con cuidado.' } }
      ]
    },
    {
      id: 'objeto-brillante', tags: ['any'], w: 7,
      text: 'Algo brilla entre la hierba, a unos metros del sendero.',
      options: [
        { label: 'Investigar', outcomes: [
          { w: 55, loot: ['random'], text: '¡Es un objeto útil!' },
          { w: 30, money: [40, 140], text: 'Son unas monedas olvidadas.' },
          { w: 15, hp: -10, text: 'Era una trampa oxidada. Te cortas la mano.' }
        ] },
        { label: 'Ignorarlo', fx: { text: 'Sigues tu camino sin arriesgarte.' } }
      ]
    },
    {
      id: 'campamento', tags: ['any'], w: 5,
      text: 'Llegas a un campamento abandonado. Las brasas aún humean.',
      options: [
        { label: 'Registrar las tiendas', outcomes: [
          { w: 45, loot: ['random', 'random'], text: 'Alguien se dejó provisiones.' },
          { w: 30, money: [80, 200], st: -5, text: 'Encuentras una bolsa con dinero.' },
          { w: 25, hp: -8, encounter: true, text: '¡Un Pokémon dormía dentro y se despierta molesto!' }
        ] },
        { label: 'Descansar junto al fuego', fx: { st: 15, fd: -5, text: 'Entras en calor y recuperas fuerzas.' } }
      ]
    },
    {
      id: 'bloqueo', tags: ['any'], w: 6,
      text: 'Un Pokémon salvaje bloquea el camino y no parece dispuesto a moverse.',
      options: [
        { label: 'Usar repelente', needs: 'repelente', fx: { text: 'Arruga el morro y se marcha por donde vino.' } },
        { label: 'Hacerle frente', fx: { hp: -12, encounter: true, text: 'Te embiste antes de que puedas reaccionar.' } },
        { label: 'Dar un rodeo', fx: { st: -15, text: 'Pierdes un buen rato rodeándolo.' } }
      ]
    },
    {
      id: 'cueva', tags: ['cave', 'mountain', 'ruins', 'volcano', 'forest'], w: 6,
      text: 'Encuentras una cueva oscura. Se oye algo moverse al fondo.',
      options: [
        { label: 'Explorar con la linterna', needs: 'linterna', fx: { encounter: true, rareBoost: 2.2, money: [30, 120], text: 'La luz revela minerales... y un Pokémon poco común.' } },
        { label: 'Entrar a tientas', outcomes: [
          { w: 45, hp: -15, text: 'Tropiezas con las rocas en la oscuridad.' },
          { w: 35, loot: ['random'], text: 'Palpando el suelo das con algo útil.' },
          { w: 20, encounter: true, text: 'Dos ojos brillan frente a ti.' }
        ] },
        { label: 'Pasar de largo', fx: { text: 'Mejor no tentar a la suerte.' } }
      ]
    },
    {
      id: 'barranco', tags: ['mountain', 'ruins', 'volcano', 'coast'], w: 6,
      text: 'Un barranco profundo corta el paso.',
      options: [
        { label: 'Descolgarte con la cuerda', needs: 'cuerda', fx: { st: -5, money: [20, 80], text: 'Bajas sin problema y encuentras algo al fondo.' } },
        { label: 'Buscar otro paso', fx: { st: -20, fd: -5, text: 'El rodeo te deja agotado.' } },
        { label: 'Saltar', outcomes: [
          { w: 50, text: '¡Por los pelos! Llegas al otro lado.' },
          { w: 50, hp: -25, text: 'Caes mal y te haces daño en el tobillo.' }
        ] }
      ]
    },
    {
      id: 'maleza', tags: ['forest', 'swamp', 'ruins'], w: 7,
      text: 'La maleza es tan espesa que no ves el sendero.',
      options: [
        { label: 'Abrir paso con el machete', needs: 'machete', outcomes: [
          { w: 60, st: -3, text: 'Avanzas rápido y limpio.' },
          { w: 40, st: -3, encounter: true, text: 'Al cortar las ramas asustas a un Pokémon.' }
        ] },
        { label: 'Atravesarla a la fuerza', fx: { hp: -8, st: -12, text: 'Las zarzas te arañan por todas partes.' } }
      ]
    },
    {
      id: 'pantano', tags: ['swamp', 'forest'], w: 7,
      text: 'Te encuentras con un pantano fangoso.',
      options: [
        { label: 'Cruzar con las botas', needs: 'botas', fx: { st: -5, text: 'Las botas hacen su trabajo. Cruzas sin mojarte.' } },
        { label: 'Rodearlo', fx: { st: -18, fd: -6, text: 'Tardas casi una hora en rodearlo.' } },
        { label: 'Cruzar a pelo', outcomes: [
          { w: 50, st: -10, hp: -10, text: 'El barro te traga hasta la cintura.' },
          { w: 30, st: -8, breakRandom: true, text: 'Sales... pero algo de la mochila se ha estropeado.' },
          { w: 20, st: -8, encounter: true, text: 'Algo se mueve bajo el agua turbia.' }
        ] }
      ]
    },
    {
      id: 'ventisca', tags: ['cold'], w: 8,
      text: 'Se levanta una ventisca helada.',
      options: [
        { label: 'Abrigarte con la manta', needs: 'manta', fx: { st: -4, text: 'La manta térmica te mantiene caliente.' } },
        { label: 'Aguantar', fx: { hp: -12, st: -15, text: 'El frío te cala los huesos.' } },
        { label: 'Refugiarte y esperar', fx: { fd: -15, st: 5, text: 'Esperas a que amaine. Te entra mucha hambre.' } }
      ]
    },
    {
      id: 'lava', tags: ['volcano'], w: 8,
      text: 'Un río de lava enfriándose bloquea el camino.',
      options: [
        { label: 'Cruzar con las botas', needs: 'botas', fx: { st: -6, text: 'Las suelas humean, pero aguantan.' } },
        { label: 'Rodearlo', fx: { st: -22, text: 'El rodeo es largo y el calor agota.' } },
        { label: 'Esperar a que se enfríe', fx: { fd: -15, text: 'Pasas horas esperando.' } }
      ]
    },
    {
      id: 'aguas-termales', tags: ['volcano', 'mountain'], w: 4,
      text: 'Descubres unas aguas termales humeantes.',
      options: [
        { label: 'Darte un baño', fx: { hp: 20, st: 20, fd: -5, text: 'Sales como nuevo.' } },
        { label: 'Seguir adelante', fx: { text: 'No hay tiempo que perder.' } }
      ]
    },
    {
      id: 'marea', tags: ['coast', 'swamp'], w: 7,
      text: 'La marea sube y el camino queda bajo el agua.',
      options: [
        { label: 'Esperar a que baje', fx: { fd: -12, st: 5, text: 'Esperas sentado en una roca.' } },
        { label: 'Nadar', outcomes: [
          { w: 55, hp: -15, st: -10, text: 'Las corrientes te arrastran contra las rocas.' },
          { w: 45, st: -10, encounter: true, text: 'Mientras nadas, algo se acerca.' }
        ] }
      ]
    },
    {
      id: 'niebla', tags: ['ruins', 'swamp', 'coast', 'mountain'], w: 5,
      text: 'Una niebla espesa lo cubre todo.',
      options: [
        { label: 'Orientarte con la brújula', needs: 'brujula', fx: { encounter: true, rareBoost: 1.6, text: 'Encuentras un claro escondido en la niebla.' } },
        { label: 'Avanzar a ciegas', outcomes: [
          { w: 60, st: -15, text: 'Das vueltas en círculos.' },
          { w: 40, hp: -10, text: 'Te golpeas con una rama que no viste.' }
        ] }
      ]
    },
    {
      id: 'nido', tags: ['mountain', 'forest', 'coast'], w: 4,
      text: 'Ves un nido enorme en lo alto de unas rocas.',
      options: [
        { label: 'Trepar con la cuerda', needs: 'cuerda', fx: { loot: ['random'], encounter: true, rareBoost: 1.8, text: 'Arriba hay objetos brillantes... y su dueño vuelve.' } },
        { label: 'Dejarlo estar', fx: { text: 'Mejor no molestar.' } }
      ]
    },
    {
      id: 'huellas', tags: ['any'], w: 6,
      text: 'Encuentras huellas frescas de un Pokémon.',
      options: [
        { label: 'Seguirlas', fx: { st: -10, encounter: true, rareBoost: 1.5, text: 'Las huellas te llevan hasta su dueño.' } },
        { label: 'Ignorarlas', fx: { text: 'Prefieres no desviarte.' } }
      ]
    },
    {
      id: 'inscripciones', tags: ['ruins'], w: 7,
      text: 'Los muros están cubiertos de inscripciones antiguas.',
      options: [
        { label: 'Intentar descifrarlas', outcomes: [
          { w: 60, st: -10, money: [150, 320], text: 'Señalan un escondite con monedas antiguas.' },
          { w: 40, st: -10, encounter: true, rareBoost: 2, text: 'Al leerlas en voz alta, algo despierta.' }
        ] },
        { label: 'Ignorarlas', fx: { text: 'Siguen ahí cuando te vas.' } }
      ]
    },
    {
      id: 'monedero', tags: ['any'], w: 4,
      text: 'Encuentras un monedero perdido en el camino.',
      options: [
        { label: 'Quedártelo', fx: { money: [80, 200], text: 'Nadie lo va a echar de menos... ¿no?' } },
        { label: 'Buscar a su dueño', outcomes: [
          { w: 50, st: -10, loot: ['random', 'random'], text: 'Un excursionista agradecido te regala provisiones.' },
          { w: 50, st: -10, text: 'No encuentras a nadie. Al menos lo intentaste.' }
        ] }
      ]
    },
    {
      id: 'descanso', tags: ['any'], w: 6,
      text: 'Un claro tranquilo, perfecto para descansar.',
      options: [
        { label: 'Acampar en el saco', needs: 'saco', fx: { st: 45, hp: 10, fd: -8, text: 'Duermes de maravilla.' } },
        { label: 'Echar una cabezada', fx: { st: 15, fd: -8, text: 'Recuperas algo de energía.' } },
        { label: 'Seguir', fx: { text: 'No hay tiempo para siestas.' } }
      ]
    },
    {
      id: 'mercader', tags: ['any'], w: 3,
      text: 'Un mercader ambulante te ofrece un paquete sorpresa.',
      options: [
        { label: 'Comprarlo (₽150)', pay: 150, fx: { loot: ['random', 'random'], text: 'Abres el paquete con curiosidad.' } },
        { label: 'No, gracias', fx: { text: 'El mercader se encoge de hombros.' } }
      ]
    },
    {
      id: 'tormenta', tags: ['any'], w: 4,
      text: 'Se desata una tormenta repentina.',
      options: [
        { label: 'Refugiarte', fx: { fd: -10, text: 'Esperas bajo una roca hasta que pasa.' } },
        { label: 'Seguir bajo la lluvia', outcomes: [
          { w: 60, hp: -8, st: -10, text: 'Acabas empapado y helado.' },
          { w: 40, st: -8, breakRandom: true, text: 'El agua se cuela en la mochila y estropea algo.' }
        ] }
      ]
    }
  ];

  PA.EVENTS_BY_ID = Object.fromEntries(PA.EVENTS.map((e) => [e.id, e]));
})(window.PA);
