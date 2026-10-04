/* =========================================================
   Mochila estilo Tetris
   - Objetos con formas (matrices) que se pueden rotar.
   - Clic en almacén → seleccionar · R → rotar · clic en cuadrícula → colocar
   - Clic en una pieza colocada → sacarla (queda seleccionada para moverla)
   ========================================================= */
(function (PA) {
  'use strict';
  const U = PA.util;
  const h = U.h;
  const B = {};

  B.sel = null; // { uid, rot }

  /* ---------------- Geometría ---------------- */
  function rotateCW(m) {
    const H = m.length, W = m[0].length, out = [];
    for (let y = 0; y < W; y++) {
      out.push([]);
      for (let x = 0; x < H; x++) out[y].push(m[H - 1 - x][y]);
    }
    return out;
  }

  B.matrix = (id, rot) => {
    let m = PA.ITEMS[id].shape.map((row) => [...row].map((c) => c === 'X'));
    const turns = ((rot || 0) % 4 + 4) % 4;
    for (let i = 0; i < turns; i++) m = rotateCW(m);
    return m;
  };

  B.cells = (id, rot, x, y) => {
    const out = [];
    B.matrix(id, rot).forEach((row, dy) => row.forEach((on, dx) => { if (on) out.push([x + dx, y + dy]); }));
    return out;
  };

  B.cellCount = (id) => PA.ITEMS[id].shape.join('').split('X').length - 1;

  B.occupancy = (ignoreUid) => {
    const occ = new Map();
    for (const it of PA.state.backpack.placed) {
      if (it.uid === ignoreUid) continue;
      for (const [cx, cy] of B.cells(it.id, it.rot, it.x, it.y)) occ.set(cx + ',' + cy, it.uid);
    }
    return occ;
  };

  B.canPlace = (id, rot, x, y, ignoreUid) => {
    const { w, h: H } = PA.bpSize();
    const occ = B.occupancy(ignoreUid);
    return B.cells(id, rot, x, y).every(([cx, cy]) => cx >= 0 && cy >= 0 && cx < w && cy < H && !occ.has(cx + ',' + cy));
  };

  /* ---------------- Movimiento de objetos ---------------- */
  const storageIndex = (uid) => PA.state.storage.findIndex((i) => i.uid === uid);
  const placedIndex = (uid) => PA.state.backpack.placed.findIndex((i) => i.uid === uid);

  B.place = (uid, x, y, rot) => {
    const si = storageIndex(uid);
    if (si < 0) return false;
    const inst = PA.state.storage[si];
    if (!B.canPlace(inst.id, rot, x, y)) return false;
    PA.state.storage.splice(si, 1);
    PA.state.backpack.placed.push({ uid: inst.uid, id: inst.id, uses: inst.uses, x, y, rot });
    return true;
  };

  B.pickUp = (uid) => {
    const pi = placedIndex(uid);
    if (pi < 0) return null;
    const it = PA.state.backpack.placed.splice(pi, 1)[0];
    PA.state.storage.push({ uid: it.uid, id: it.id, uses: it.uses });
    return it;
  };

  /** Intenta meter un objeto nuevo en el primer hueco (cualquier rotación). */
  B.autoAdd = (inst) => {
    const { w, h: H } = PA.bpSize();
    for (let rot = 0; rot < 4; rot++) {
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < w; x++) {
          if (B.canPlace(inst.id, rot, x, y)) {
            PA.state.backpack.placed.push({ uid: inst.uid, id: inst.id, uses: inst.uses, x, y, rot });
            return true;
          }
        }
      }
    }
    return false;
  };

  /** Coloca todo lo posible del almacén, de mayor a menor. */
  B.autoFill = () => {
    const items = [...PA.state.storage].sort((a, b) => B.cellCount(b.id) - B.cellCount(a.id));
    let n = 0;
    for (const inst of items) {
      if (B.autoAdd(inst)) {
        PA.state.storage.splice(storageIndex(inst.uid), 1);
        n++;
      }
    }
    return n;
  };

  B.emptyAll = () => {
    for (const it of [...PA.state.backpack.placed]) B.pickUp(it.uid);
  };

  B.removePlaced = (uid) => {
    const pi = placedIndex(uid);
    return pi < 0 ? null : PA.state.backpack.placed.splice(pi, 1)[0];
  };

  /* ---------------- Consultas para la expedición ---------------- */
  B.placed = () => PA.state.backpack.placed;
  B.countById = (id) => B.placed().filter((i) => i.id === id).length;
  B.findTool = (tag) => B.placed().filter((i) => PA.ITEMS[i.id].tool === tag).sort((a, b) => a.uses - b.uses)[0] || null;
  B.hasPassive = (p) => B.placed().some((i) => PA.ITEMS[i.id].passive === p);

  B.takeOne = (id) => {
    const it = B.placed().find((i) => i.id === id);
    return it ? B.removePlaced(it.uid) : null;
  };

  /** Gasta un uso de una herramienta. Devuelve texto para el registro. */
  B.useTool = (tag) => {
    const it = B.findTool(tag);
    if (!it) return null;
    const def = PA.ITEMS[it.id];
    it.uses = (it.uses == null ? 1 : it.uses) - 1;
    if (it.uses <= 0) { B.removePlaced(it.uid); return `Usas ${def.name}. Se ha gastado del todo.`; }
    return `Usas ${def.name} (${it.uses} uso${it.uses === 1 ? '' : 's'} restante${it.uses === 1 ? '' : 's'}).`;
  };

  B.sellPrice = (inst) => {
    const def = PA.ITEMS[inst.id];
    let p = Math.floor(def.price / 2);
    if (def.uses && inst.uses != null) p = Math.floor(p * inst.uses / def.uses);
    return Math.max(1, p);
  };

  /* ---------------- Interfaz ---------------- */
  function selectedInst() {
    if (!B.sel) return null;
    return PA.state.storage.find((i) => i.uid === B.sel.uid) || null;
  }

  B.select = (id) => {
    const cands = PA.state.storage.filter((i) => i.id === id).sort((a, b) => (b.uses || 0) - (a.uses || 0));
    if (!cands.length) return;
    B.sel = { uid: cands[0].uid, rot: B.sel && B.sel.uid && selectedInst() && selectedInst().id === id ? B.sel.rot : 0 };
    PA.ui.refresh();
  };

  B.rotate = () => {
    if (!B.sel) return;
    B.sel.rot = (B.sel.rot + 1) % 4;
    PA.ui.refresh();
  };

  B.cancel = () => { B.sel = null; PA.ui.refresh(); };

  function shadowFor(uid, x, y, occ) {
    const s = [];
    if (occ.get(x + ',' + (y - 1)) !== uid) s.push('inset 0 3px 0 rgba(255,255,255,.35)');
    if (occ.get(x + ',' + (y + 1)) !== uid) s.push('inset 0 -4px 0 rgba(0,0,0,.35)');
    if (occ.get((x - 1) + ',' + y) !== uid) s.push('inset 3px 0 0 rgba(255,255,255,.2)');
    if (occ.get((x + 1) + ',' + y) !== uid) s.push('inset -4px 0 0 rgba(0,0,0,.3)');
    return s.join(',');
  }

  /** Dibuja la cuadrícula. interactive=false → solo lectura (expedición). */
  B.renderGrid = (interactive) => {
    const { w, h: H } = PA.bpSize();
    const occ = B.occupancy(null);
    const byUid = Object.fromEntries(B.placed().map((i) => [i.uid, i]));
    const grid = h('div', { class: 'bp-grid' + (interactive ? '' : ' is-mini'), style: { gridTemplateColumns: `repeat(${w}, var(--cell))` } });
    const cellEls = [];

    // celda "ancla" de cada pieza (primera casilla ocupada) para el icono
    const anchors = new Map();
    for (const it of B.placed()) {
      const first = B.cells(it.id, it.rot, it.x, it.y)[0];
      anchors.set(first[0] + ',' + first[1], it);
    }

    for (let y = 0; y < H; y++) {
      cellEls.push([]);
      for (let x = 0; x < w; x++) {
        const key = x + ',' + y;
        const uid = occ.get(key);
        const cell = h('div', { class: 'cell', dataset: { x, y } });
        if (uid) {
          const it = byUid[uid];
          const def = PA.ITEMS[it.id];
          cell.classList.add('filled');
          cell.style.background = PA.CAT_COLORS[def.cat] || '#777';
          cell.style.boxShadow = shadowFor(uid, x, y, occ);
          cell.title = def.name + (it.uses != null ? ` (${it.uses}/${def.uses} usos)` : '');
          const a = anchors.get(key);
          if (a) {
            cell.append(PA.assets.itemIcon(a.id));
            if (a.uses != null) cell.append(h('span', { class: 'uses', text: a.uses }));
          }
        }
        cellEls[y].push(cell);
        grid.append(cell);
      }
    }

    if (!interactive) return grid;

    let ghost = [];
    const clearGhost = () => { ghost.forEach((c) => c.classList.remove('ghost-ok', 'ghost-bad')); ghost = []; };
    const showGhost = (x, y) => {
      clearGhost();
      const inst = selectedInst();
      if (!inst) return;
      const ok = B.canPlace(inst.id, B.sel.rot, x, y);
      for (const [cx, cy] of B.cells(inst.id, B.sel.rot, x, y)) {
        const c = cellEls[cy] && cellEls[cy][cx];
        if (c) { c.classList.add(ok ? 'ghost-ok' : 'ghost-bad'); ghost.push(c); }
      }
    };

    grid.addEventListener('pointermove', (e) => {
      const c = e.target.closest('.cell');
      if (c) showGhost(+c.dataset.x, +c.dataset.y);
    });
    grid.addEventListener('pointerleave', clearGhost);
    grid.addEventListener('click', (e) => {
      const c = e.target.closest('.cell');
      if (!c) return;
      const x = +c.dataset.x, y = +c.dataset.y;
      const inst = selectedInst();
      if (inst) {
        if (B.place(inst.uid, x, y, B.sel.rot)) {
          const next = PA.state.storage.find((i) => i.id === inst.id);
          B.sel = next ? { uid: next.uid, rot: B.sel.rot } : null;
          PA.save();
          PA.ui.refresh();
        } else {
          U.toast('No cabe ahí. Prueba a rotarlo (R) o en otro hueco.', 'warn');
        }
      } else {
        const uid = occ.get(x + ',' + y);
        if (uid) {
          const it = B.pickUp(uid);
          B.sel = { uid: it.uid, rot: it.rot };
          PA.save();
          PA.ui.refresh();
        }
      }
    });
    return grid;
  };

  function miniShape(id, rot) {
    const m = B.matrix(id, rot || 0);
    const box = h('span', { class: 'mini-shape', style: { gridTemplateColumns: `repeat(${m[0].length}, 8px)` } });
    m.forEach((row) => row.forEach((on) => box.append(h('i', { class: on ? 'on' : '' }))));
    return box;
  }

  B.render = (root) => {
    const size = PA.bpSize();
    const used = B.placed().reduce((s, i) => s + B.cellCount(i.id), 0);
    const inst = selectedInst();
    if (B.sel && !inst) B.sel = null;

    // Almacén agrupado por tipo
    const groups = {};
    for (const it of PA.state.storage) (groups[it.id] = groups[it.id] || []).push(it);
    const order = Object.keys(PA.ITEMS);
    const ids = Object.keys(groups).sort((a, b) => order.indexOf(a) - order.indexOf(b));

    const storageList = h('div', { class: 'storage-list' },
      ids.length ? ids.map((id) => {
        const def = PA.ITEMS[id];
        const list = groups[id];
        const active = inst && inst.id === id;
        return h('div', { class: 'storage-row' + (active ? ' is-active' : '') },
          h('button', { class: 'storage-pick', onClick: () => B.select(id), 'aria-pressed': active ? 'true' : 'false' },
            PA.assets.itemIcon(id),
            h('span', { class: 'storage-name' }, def.name, h('small', { text: def.desc })),
            miniShape(id, 0),
            h('b', { text: '×' + list.length })
          ),
          h('button', { class: 'btn-sell', title: 'Vender uno', onClick: () => {
            const it = list[list.length - 1];
            const p = B.sellPrice(it);
            PA.state.storage.splice(storageIndex(it.uid), 1);
            PA.state.money += p;
            if (B.sel && B.sel.uid === it.uid) B.sel = null;
            PA.save(); PA.ui.refresh();
            U.toast(`Vendido: ${def.name} (+${U.money(p)})`);
          } }, 'Vender ' + U.money(B.sellPrice(list[list.length - 1])))
        );
      }) : h('p', { class: 'empty', text: 'El almacén está vacío. Compra suministros en la tienda.' })
    );

    const keyList = Object.keys(PA.state.keyItems).filter((k) => PA.state.keyItems[k] && PA.ITEMS[k]);

    root.append(h('section', { class: 'screen' },
      h('div', { class: 'screen-head' },
        h('h2', { text: 'Mochila' }),
        h('p', { class: 'lead', text: 'Elige un objeto del almacén, gíralo con R y colócalo en la cuadrícula. Toca una pieza colocada para sacarla. Solo viaja contigo lo que está dentro.' })
      ),
      h('div', { class: 'bp-layout' },
        h('div', { class: 'bp-board' },
          h('div', { class: 'bp-toolbar' },
            h('button', { class: 'btn', onClick: B.rotate, disabled: !inst }, '⟳ Rotar (R)'),
            h('button', { class: 'btn', onClick: () => { const n = B.autoFill(); B.sel = null; PA.save(); PA.ui.refresh(); U.toast(n ? `Colocados ${n} objetos.` : 'No cabe nada más.'); } }, 'Colocar todo'),
            h('button', { class: 'btn btn-ghost', onClick: () => { B.emptyAll(); B.sel = null; PA.save(); PA.ui.refresh(); } }, 'Vaciar')
          ),
          h('div', { class: 'bp-selected' }, inst
            ? [PA.assets.itemIcon(inst.id), h('span', {}, h('b', { text: PA.ITEMS[inst.id].name }), ' seleccionado. Toca dónde va su esquina superior izquierda.'), miniShape(inst.id, B.sel.rot), h('button', { class: 'btn btn-ghost btn-sm', onClick: B.cancel }, 'Cancelar')]
            : h('span', { class: 'muted', text: 'Nada seleccionado.' })),
          h('div', { class: 'bp-canvas' }, B.renderGrid(true)),
          h('p', { class: 'bp-legend' }, `${size.label} (${size.w}×${size.h}): ${used}/${size.w * size.h} casillas ocupadas`)
        ),
        h('aside', { class: 'bp-storage' },
          h('h3', { text: 'Almacén de la base' }),
          storageList,
          keyList.length ? h('div', { class: 'key-items' }, h('h3', { text: 'Objetos clave' }),
            keyList.map((k) => h('div', { class: 'key-item' }, PA.assets.itemIcon(k), h('span', { text: PA.ITEMS[k].name })))) : null
        )
      )
    ));
  };

  PA.backpack = B;
})(window.PA);
