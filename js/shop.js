/* =========================================================
   Tienda: lo comprado va al almacén de la base
   ========================================================= */
(function (PA) {
  'use strict';
  const U = PA.util;
  const h = U.h;
  const S = {};

  const SECTIONS = [
    { title: 'Poké Balls', cats: ['ball'] },
    { title: 'Salud y comida', cats: ['heal', 'food', 'energy'] },
    { title: 'Equipo de expedición', cats: ['tool', 'lure'] },
    { title: 'Objetos clave', cats: ['key'] }
  ];

  S.buy = (id, qty) => {
    const def = PA.ITEMS[id];
    const total = def.price * qty;
    if (PA.state.money < total) { U.toast('No tienes dinero suficiente.', 'warn'); return; }
    PA.state.money -= total;
    if (def.cat === 'key') {
      PA.state.keyItems[id] = true;
      if (id === 'mochila-m' && PA.state.backpack.size === 's') PA.state.backpack.size = 'm';
      if (id === 'mochila-l') PA.state.backpack.size = 'l';
    } else {
      for (let i = 0; i < qty; i++) PA.state.storage.push(PA.makeItem(id));
    }
    PA.save();
    PA.ui.refresh();
    U.toast(`Comprado: ${def.name}${qty > 1 ? ' ×' + qty : ''}`, 'ok');
  };

  S.render = (root) => {
    const owned = (id) => PA.state.storage.filter((i) => i.id === id).length + PA.backpack.countById(id);
    const sections = SECTIONS.map((sec) => {
      const ids = Object.keys(PA.ITEMS).filter((id) => sec.cats.includes(PA.ITEMS[id].cat));
      return h('div', { class: 'shop-section' },
        h('h3', { text: sec.title }),
        h('div', { class: 'shop-grid' }, ids.map((id) => {
          const def = PA.ITEMS[id];
          const isKey = def.cat === 'key';
          const have = isKey ? !!PA.state.keyItems[id] : false;
          const locked = isKey && def.requires && !PA.state.keyItems[def.requires];
          const canAfford = PA.state.money >= def.price;
          return h('article', { class: 'shop-card' + (have ? ' is-owned' : '') },
            h('div', { class: 'shop-top' }, PA.assets.itemIcon(id, 'big'),
              h('div', {}, h('h4', { text: def.name }), h('span', { class: 'price', text: U.money(def.price) }))),
            h('p', { text: def.desc }),
            !isKey ? h('p', { class: 'muted small', text: `Ocupa ${PA.backpack.cellCount(id)} casilla${PA.backpack.cellCount(id) > 1 ? 's' : ''}. Tienes ${owned(id)}.` }) : null,
            have
              ? h('span', { class: 'owned', text: 'En tu poder' })
              : locked
                ? h('span', { class: 'muted small', text: 'Necesitas antes: ' + PA.ITEMS[def.requires].name })
                : h('div', { class: 'shop-actions' },
                    h('button', { class: 'btn btn-primary', disabled: !canAfford, onClick: () => S.buy(id, 1) }, 'Comprar'),
                    !isKey && def.price * 5 <= 2500 ? h('button', { class: 'btn', disabled: PA.state.money < def.price * 5, onClick: () => S.buy(id, 5) }, '×5') : null)
          );
        }))
      );
    });

    root.append(h('section', { class: 'screen' },
      h('div', { class: 'screen-head' },
        h('h2', { text: 'Tienda' }),
        h('p', { class: 'lead', text: 'Lo que compres va al almacén. Recuerda meterlo en la mochila antes de salir.' })
      ),
      sections
    ));
  };

  PA.shop = S;
})(window.PA);
