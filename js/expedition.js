/* =========================================================
   Expediciones: bucle de eventos, encuentros, captura y resultados
   Fases: 'event' (decidir) → 'result' (seguir / retirarse)
          'encounter' (lanzar ball / huir) → 'result'
   ========================================================= */
(function (PA) {
  'use strict';
  const U = PA.util;
  const h = U.h;
  const E = {};
  const B = () => PA.backpack;

  const X = () => PA.state.exp;
  const zone = () => PA.ZONES_BY_ID[X().zone];

  function log(text, kind) {
    const x = X();
    x.log.unshift({ t: text, k: kind || 'info', d: x.depth });
    if (x.log.length > 50) x.log.length = 50;
  }

  function change(stat, amount) {
    const x = X();
    x[stat] = U.clamp(x[stat] + amount, 0, 100);
  }

  /* ---------------- Inicio ---------------- */
  E.start = (zoneId) => {
    const z = PA.ZONES_BY_ID[zoneId];
    if (!z) return;
    PA.state.exp = {
      zone: zoneId, depth: 0, hp: 100, st: 100, fd: 100, money: 0,
      captures: [], log: [], phase: 'result', eventId: null, lastEventId: null,
      encounter: null, bait: 0, resultText: `Partes hacia ${z.name}. ${z.desc}`, atLimit: false
    };
    PA.state.records.expeditions++;
    log(`Comienza la expedición a ${z.name}.`);
    PA.save();
    PA.ui.go('expedition');
  };

  /* ---------------- Avanzar un paso ---------------- */
  E.next = () => {
    const x = X(), z = zone();
    if (x.atLimit) return E.finish('limite');
    x.depth++;
    x.eventId = null;
    x.encounter = null;
    x.resultText = '';

    const stCost = Math.round(z.cost.st * (B().hasPassive('brujula') ? 0.75 : 1));
    change('st', -stCost);
    change('fd', -z.cost.fd);

    const notes = [];
    if (x.st <= 0) { change('hp', -10); notes.push('Estás agotado y pierdes salud.'); }
    if (x.fd <= 0) { change('hp', -8); notes.push('El hambre te hace perder salud.'); }
    if (x.depth > z.safe && U.chance(0.22 + (x.depth - z.safe) * 0.05)) {
      const worn = breakRandom();
      if (worn) notes.push(`Desgaste: ${worn}.`);
    }
    if (notes.length) { log(notes.join(' '), 'warn'); x.resultText = notes.join(' '); }
    if (checkFaint()) return;

    if (x.depth >= z.length) {
      x.eventId = '__final';
      x.phase = 'event';
      log(`Paso ${x.depth}: has llegado al límite de la zona.`, 'gold');
    } else if (x.bait > 0 || U.chance(z.encounterRate)) {
      startEncounter(1);
    } else {
      const ev = pickEvent(z, x.lastEventId);
      x.eventId = ev.id;
      x.lastEventId = ev.id;
      x.phase = 'event';
      log(`Paso ${x.depth}: ${ev.text}`);
    }
    PA.save();
    PA.ui.refresh();
  };

  function pickEvent(z, lastId) {
    const list = PA.EVENTS.filter((e) => e.id !== lastId && (e.tags.includes('any') || e.tags.some((t) => z.tags.includes(t))));
    return U.weighted(list, (e) => e.w);
  }

  function getEvent(id) {
    if (id === '__final') {
      const z = zone();
      return {
        id, final: true,
        text: `Llegas al corazón de ${z.name}. Algo poderoso se mueve muy cerca. Más allá no se puede avanzar.`,
        options: [
          { label: 'Acercarte con cuidado', fx: { encounter: true, rareBoost: 4, text: '¡Un Pokémon excepcional aparece ante ti!' } },
          { label: 'Dar media vuelta', fx: { text: 'Decides no tentar a la suerte.' } }
        ]
      };
    }
    return PA.EVENTS_BY_ID[id];
  }

  /* ---------------- Efectos ---------------- */
  /** Desgasta un objeto: a las herramientas les quita 1 uso (se rompen al llegar a 0);
      el resto (balls, curas, comida) se pierde entero. Devuelve el texto para el diario. */
  function wearItem(it) {
    const name = PA.ITEMS[it.id].name;
    if (it.uses != null && it.uses > 1) {
      it.uses--;
      return `${name} se desgasta (le queda${it.uses === 1 ? '' : 'n'} ${it.uses} uso${it.uses === 1 ? '' : 's'})`;
    }
    B().removePlaced(it.uid);
    return `${name} se rompe`;
  }

  function breakRandom() {
    const placed = B().placed();
    if (!placed.length) return null;
    return wearItem(U.pick(placed));
  }

  function rollLoot() {
    const e = U.weighted(PA.LOOT_TABLE, (l) => l[1]);
    return e ? e[0] : 'pokeball';
  }

  function applyFx(fx) {
    const x = X();
    const texts = [];
    if (fx.text) texts.push(fx.text);
    for (const [k, label] of [['hp', 'salud'], ['st', 'estamina'], ['fd', 'saciedad']]) {
      if (fx[k]) { change(k, fx[k]); texts.push(`${fx[k] > 0 ? '+' : ''}${fx[k]} ${label}.`); }
    }
    if (fx.money) {
      const amount = Array.isArray(fx.money) ? U.randInt(fx.money[0], fx.money[1]) : fx.money;
      x.money += amount;
      texts.push(`Botín: +${U.money(amount)}.`);
    }
    if (fx.loot) {
      for (const raw of fx.loot) {
        const id = raw === 'random' ? rollLoot() : raw;
        const inst = PA.makeItem(id);
        if (!inst) continue;
        if (B().autoAdd(inst)) texts.push(`Guardas ${PA.ITEMS[id].name} en la mochila.`);
        else texts.push(`${PA.ITEMS[id].name} no cabe en la mochila y lo dejas atrás.`);
      }
    }
    if (fx.breakRandom) {
      const b = breakRandom();
      if (b) texts.push(`${b}.`);
    }
    return texts.join(' ');
  }

  function checkFaint() {
    if (X().hp <= 0) {
      log('Te desmayas por el agotamiento...', 'bad');
      E.finish('desmayo');
      return true;
    }
    return false;
  }

  /* ---------------- Decisiones de eventos ---------------- */
  function optionState(opt) {
    if (opt.needs && !B().findTool(opt.needs)) return { ok: false, why: 'Te falta: ' + toolName(opt.needs) };
    if (opt.pay && PA.state.money < opt.pay) return { ok: false, why: 'No tienes dinero suficiente' };
    return { ok: true };
  }

  function toolName(tag) {
    const id = Object.keys(PA.ITEMS).find((k) => PA.ITEMS[k].tool === tag);
    return id ? PA.ITEMS[id].name : tag;
  }

  E.choose = (i) => {
    const x = X();
    const ev = getEvent(x.eventId);
    const opt = ev && ev.options[i];
    if (!opt || !optionState(opt).ok) return;

    const pre = [];
    if (opt.needs) pre.push(B().useTool(opt.needs));
    if (opt.pay) { PA.state.money -= opt.pay; pre.push(`Pagas ${U.money(opt.pay)}.`); }
    const fx = opt.fx || U.weighted(opt.outcomes, (o) => o.w);
    const text = [...pre, applyFx(fx)].filter(Boolean).join(' ');
    x.resultText = text;
    log(`→ ${opt.label}. ${text}`, fx.hp < 0 ? 'warn' : 'info');
    if (ev.final) x.atLimit = true;

    if (checkFaint()) return;
    if (fx.encounter) startEncounter(fx.rareBoost || 1);
    else x.phase = 'result';
    PA.save();
    PA.ui.refresh();
  };

  /* ---------------- Encuentros y captura ---------------- */
  function startEncounter(rareBoost) {
    const x = X(), z = zone();
    const baited = x.bait > 0;
    if (baited) x.bait = 0;
    const boost = rareBoost * (1 + Math.max(0, x.depth - 1) * 0.08) * (baited ? 1.8 : 1);
    const pool = z.pool.map((id) => PA.POKEMON_BY_ID[id]).filter(Boolean);
    const p = U.weighted(pool, (pk) => PA.RARITY[pk.rarity].weight * (pk.rarity === 'comun' ? 1 : boost));
    if (!p) { x.phase = 'result'; return; }
    const shiny = Math.random() < PA.dex.shinyRate(x);
    x.encounter = { id: p.id, shiny, throws: 0, baited: false };
    x.eventId = null;
    x.phase = 'encounter';
    PA.dex.registerSeen(p, shiny);
    log(`¡Aparece un ${p.name} salvaje${shiny ? ' ✨SHINY✨' : ''}!`, shiny ? 'gold' : 'info');
  }

  function catchChance(ballId) {
    const x = X();
    const p = PA.POKEMON_BY_ID[x.encounter.id];
    const r = PA.RARITY[p.rarity];
    const mult = PA.ITEMS[ballId].ball;
    return U.clamp(r.catch * mult * (x.encounter.baited ? 1.25 : 1) * (1 + x.encounter.throws * 0.05), 0.03, 0.97);
  }

  E.throwBall = (ballId) => {
    const x = X();
    if (x.phase !== 'encounter') return;
    const inst = B().takeOne(ballId);
    if (!inst) return;
    const p = PA.POKEMON_BY_ID[x.encounter.id];
    const r = PA.RARITY[p.rarity];
    const chance = catchChance(ballId);
    x.encounter.throws++;
    const name = p.name + (x.encounter.shiny ? ' shiny' : '');

    if (Math.random() < chance) {
      const res = PA.dex.registerCatch(p, x.encounter.shiny);
      x.captures.push({ id: p.id, shiny: x.encounter.shiny, first: res.first, firstShiny: res.firstShiny });
      const bits = [`¡${name} capturado con ${PA.ITEMS[ballId].name}!`];
      if (res.first) bits.push('Nuevo registro en la Pokédex.');
      if (res.firstShiny) bits.push('¡Nuevo registro en la Shiny Dex!');
      bits.push(`Recompensa: +${U.money(res.reward)}.`);
      bits.push(...res.notes);
      x.resultText = bits.join(' ');
      log(x.resultText, x.encounter.shiny || p.lore ? 'gold' : 'ok');
      x.phase = 'result';
      x.encounter = null;
    } else {
      const fleeChance = r.flee * (x.encounter.baited ? 0.6 : 1) + x.encounter.throws * 0.04;
      if (U.chance(fleeChance)) {
        x.resultText = `${name} se libera... y huye.`;
        log(x.resultText, 'warn');
        x.phase = 'result';
        x.encounter = null;
      } else {
        let t = `${name} se ha escapado de la ball.`;
        if (p.hostile && U.chance(0.5)) { change('hp', -10); t += ' ¡Te ataca enfurecido! −10 salud.'; }
        x.resultText = t;
        log(t, 'warn');
      }
    }
    if (checkFaint()) return;
    PA.save();
    PA.ui.refresh();
  };

  E.flee = () => {
    const x = X();
    if (x.phase !== 'encounter') return;
    const p = PA.POKEMON_BY_ID[x.encounter.id];
    change('st', -4);
    let t = `Te alejas de ${p.name}.`;
    if (p.hostile && U.chance(0.5)) { change('hp', -15); t += ' Te persigue y te hiere. −15 salud.'; }
    x.resultText = t;
    log(t, 'warn');
    x.phase = 'result';
    x.encounter = null;
    if (checkFaint()) return;
    PA.save();
    PA.ui.refresh();
  };

  /* ---------------- Usar objetos ---------------- */
  E.useItem = (id) => {
    const x = X();
    const def = PA.ITEMS[id];
    if (!def) return;
    if (def.cat === 'lure') {
      if (x.phase === 'encounter') { x.encounter.baited = true; x.resultText = 'Lanzas el cebo. El Pokémon se distrae comiendo.'; }
      else if (x.bait > 0) { U.toast('Ya hay un cebo activo.', 'warn'); return; }
      else { x.bait = 1; x.resultText = 'Esparces el cebo. Algo vendrá en el próximo paso.'; }
      B().takeOne(id);
      log(x.resultText);
    } else if (def.use) {
      B().takeOne(id);
      const t = applyFx(Object.assign({ text: `Usas ${def.name}.` }, def.use));
      log(t, 'ok');
      U.toast(t, 'ok');
    } else return;
    PA.save();
    PA.ui.refresh();
  };

  E.retreat = () => {
    const x = X();
    if (x.phase === 'encounter' && !confirm('Estás en un encuentro. ¿Retirarte igualmente?')) return;
    E.finish('retirada');
  };

  /* ---------------- Final ---------------- */
  E.finish = (reason) => {
    const x = X(), z = zone();
    const summary = { reason, zone: z.id, depth: x.depth, captures: x.captures, money: 0, bonus: 0, lost: [] };

    if (reason === 'desmayo') {
      summary.lost = B().placed().map((i) => PA.ITEMS[i.id].name);
      PA.state.backpack.placed = [];
      summary.moneyLost = x.money;
      PA.state.records.faints++;
    } else {
      summary.money = x.money;
      PA.state.money += x.money;
      if (reason === 'limite') {
        summary.bonus = z.reward;
        PA.state.money += z.reward;
        summary.worn = [];
        for (const it of [...B().placed()]) {
          if (!U.chance(0.4)) continue;
          const t = wearItem(it);
          (t.endsWith('se rompe') ? summary.lost : summary.worn).push(t.endsWith('se rompe') ? PA.ITEMS[it.id].name : t);
        }
      }
    }
    const rec = PA.state.records;
    rec.deepest = Math.max(rec.deepest, x.depth);
    rec.bestHaul = Math.max(rec.bestHaul, summary.money + summary.bonus);
    PA.state.lastResult = summary;
    PA.state.exp = null;
    PA.save();
    PA.ui.go('results');
  };

  /* ---------------- Interfaz ---------------- */
  function bar(label, value, cls) {
    return h('div', { class: 'stat-bar ' + cls + (value <= 25 ? ' is-low' : '') },
      h('div', { class: 'stat-bar-top' }, h('span', { text: label }), h('b', { text: Math.round(value) })),
      h('div', { class: 'progress' }, h('i', { style: { width: value + '%' } })));
  }

  function group(list) {
    const g = {};
    for (const it of list) g[it.id] = (g[it.id] || 0) + 1;
    return g;
  }

  function encounterCard(x) {
    const p = PA.POKEMON_BY_ID[x.encounter.id];
    const r = PA.RARITY[p.rarity];
    const e = PA.state.dex[p.id] || {};
    const balls = group(B().placed().filter((i) => PA.ITEMS[i.id].cat === 'ball'));
    const ballIds = Object.keys(balls);
    return h('div', { class: 'event-card is-encounter' + (x.encounter.shiny ? ' is-shiny' : '') + (p.lore ? ' is-lore' : '') },
      x.resultText ? h('p', { class: 'result-pre', text: x.resultText }) : null,
      h('div', { class: 'encounter' },
        h('div', { class: 'encounter-sprite' }, PA.assets.pokemonImg(p, x.encounter.shiny)),
        h('div', { class: 'encounter-info' },
          h('h3', { text: p.name + (x.encounter.shiny ? ' ✨' : '') }),
          h('span', { class: 'rarity ' + r.cls, text: r.label }),
          h('p', { class: 'muted small', text: e.caught ? `Ya tienes ${e.caught}.` : 'Aún no lo has capturado.' }),
          p.hostile ? h('p', { class: 'warn-text small', text: 'Agresivo: puede atacarte si falla la captura.' }) : null,
          x.encounter.baited ? h('p', { class: 'ok-text small', text: 'Distraído con el cebo.' }) : null
        )
      ),
      h('div', { class: 'options' },
        ballIds.length
          ? ballIds.map((id) => h('button', { class: 'btn btn-primary', onClick: () => E.throwBall(id) },
              PA.assets.itemIcon(id), ` ${PA.ITEMS[id].name} ×${balls[id]}`, h('small', { text: U.pct(catchChance(id)) })))
          : h('p', { class: 'warn-text', text: 'No te quedan balls en la mochila.' }),
        h('button', { class: 'btn btn-ghost', onClick: E.flee }, 'Huir')
      )
    );
  }

  function eventCard(x) {
    const ev = getEvent(x.eventId);
    if (!ev) { x.phase = 'result'; return resultCard(x); }
    return h('div', { class: 'event-card' + (ev.final ? ' is-final' : '') },
      x.resultText ? h('p', { class: 'result-pre', text: x.resultText }) : null,
      h('p', { class: 'event-text', text: ev.text }),
      h('div', { class: 'options' }, ev.options.map((opt, i) => {
        const st = optionState(opt);
        return h('button', { class: 'btn ' + (opt.needs ? 'btn-tool' : ''), disabled: !st.ok, onClick: () => E.choose(i) },
          opt.label, !st.ok ? h('small', { text: st.why }) : null);
      }))
    );
  }

  function resultCard(x) {
    const z = zone();
    return h('div', { class: 'event-card is-result' },
      h('p', { class: 'event-text', text: x.resultText || 'El camino sigue adelante.' }),
      h('div', { class: 'options' },
        x.atLimit
          ? h('button', { class: 'btn btn-primary', onClick: () => E.finish('limite') }, 'Regresar a la base')
          : h('button', { class: 'btn btn-primary', onClick: E.next }, x.depth === 0 ? 'Empezar a explorar' : `Seguir explorando (paso ${x.depth + 1}/${z.length})`),
        !x.atLimit && x.depth > 0 ? h('button', { class: 'btn btn-ghost', onClick: E.retreat }, 'Retirarse con lo que llevo') : null
      )
    );
  }

  E.render = (root) => {
    const x = X();
    if (!x) { PA.ui.go('zones'); return; }
    const z = zone();
    const deep = x.depth > z.safe;

    const usable = group(B().placed().filter((i) => PA.ITEMS[i.id].use || PA.ITEMS[i.id].cat === 'lure'));
    const card = x.phase === 'encounter' && x.encounter ? encounterCard(x) : x.phase === 'event' ? eventCard(x) : resultCard(x);

    const head = h('div', { class: 'exp-head' });
    PA.assets.applyZoneBg(head, z);
    head.append(...[
      h('div', { class: 'exp-title' },
        h('h2', {}, z.emoji + ' ' + z.name),
        h('span', { class: 'exp-step', text: `Paso ${x.depth}/${z.length}` })),
      h('div', { class: 'depth-track', style: { '--safe': (z.safe / z.length * 100) + '%' } },
        h('i', { style: { width: (x.depth / z.length * 100) + '%' } }),
        h('span', { class: 'safe-mark', title: 'Fin de la zona segura' })),
      deep ? h('p', { class: 'deep-warn', text: 'Zona profunda: los objetos pueden romperse, pero los shiny son más probables.' }) : null
    ].filter(Boolean));

    root.append(h('section', { class: 'screen exp' },
      head,
      h('div', { class: 'bars' },
        bar('Salud', x.hp, 'bar-hp'), bar('Saciedad', x.fd, 'bar-fd'), bar('Estamina', x.st, 'bar-st')),
      h('div', { class: 'exp-layout' },
        h('div', { class: 'exp-main' }, card,
          h('div', { class: 'log' }, h('h3', { text: 'Diario' }),
            h('ol', {}, x.log.map((l) => h('li', { class: 'log-' + l.k }, h('span', { class: 'log-d', text: l.d }), l.t))))),
        h('aside', { class: 'exp-side' },
          h('div', { class: 'panel' },
            h('h3', { text: 'Usar objeto' }),
            Object.keys(usable).length
              ? h('div', { class: 'use-list' }, Object.keys(usable).map((id) =>
                  h('button', { class: 'use-btn', onClick: () => E.useItem(id), title: PA.ITEMS[id].desc },
                    PA.assets.itemIcon(id), h('span', { text: PA.ITEMS[id].name }), h('b', { text: '×' + usable[id] }))))
              : h('p', { class: 'muted small', text: 'No llevas objetos usables.' })),
          h('div', { class: 'panel' }, h('h3', { text: 'Mochila' }), B().renderGrid(false)),
          h('div', { class: 'panel' },
            h('h3', { text: 'Botín de la expedición' }),
            h('p', {}, 'Dinero encontrado: ', h('b', { text: U.money(x.money) })),
            x.captures.length
              ? h('div', { class: 'cap-row' }, x.captures.map((c) => h('span', { class: 'cap' + (c.shiny ? ' is-shiny' : ''), title: PA.POKEMON_BY_ID[c.id].name }, PA.assets.pokemonImg(PA.POKEMON_BY_ID[c.id], c.shiny))))
              : h('p', { class: 'muted small', text: 'Sin capturas todavía.' })),
          h('button', { class: 'btn btn-danger btn-block', onClick: E.retreat }, 'Retirarse a la base')
        )
      )
    ));
  };

  E.renderResults = (root) => {
    const r = PA.state.lastResult;
    if (!r) { PA.ui.go('zones'); return; }
    const z = PA.ZONES_BY_ID[r.zone];
    const titles = {
      retirada: ['Retirada a tiempo', 'Vuelves a la base con todo lo que llevabas.'],
      limite: ['Expedición completa', `Llegaste al límite de ${z.name}. Bonus de ${U.money(r.bonus)}, pero el esfuerzo pasó factura a tu equipo.`],
      desmayo: ['Te has desmayado', 'Un equipo de rescate te lleva a la base. Has perdido la mochila y el dinero encontrado; tus capturas siguen registradas.']
    };
    const [title, sub] = titles[r.reason];

    root.append(h('section', { class: 'screen results is-' + r.reason },
      h('div', { class: 'screen-head' }, h('h2', { text: title }), h('p', { class: 'lead', text: sub })),
      h('div', { class: 'results-grid' },
        h('div', { class: 'panel' }, h('h3', { text: 'Resumen' }),
          h('p', {}, `Zona: ${z.name}`), h('p', {}, `Pasos recorridos: ${r.depth}/${z.length}`),
          h('p', {}, 'Dinero encontrado: ', h('b', { text: r.reason === 'desmayo' ? `perdido (${U.money(r.moneyLost || 0)})` : U.money(r.money) })),
          r.bonus ? h('p', {}, 'Bonus de límite: ', h('b', { text: U.money(r.bonus) })) : null),
        h('div', { class: 'panel' }, h('h3', { text: `Capturas (${r.captures.length})` }),
          r.captures.length
            ? h('div', { class: 'res-caps' }, r.captures.map((c) => {
                const p = PA.POKEMON_BY_ID[c.id];
                return h('div', { class: 'res-cap' + (c.shiny ? ' is-shiny' : '') },
                  PA.assets.pokemonImg(p, c.shiny), h('span', { text: p.name }),
                  c.firstShiny ? h('em', { class: 'tag tag-shiny', text: 'Nuevo shiny' }) : c.first ? h('em', { class: 'tag', text: 'Nuevo' }) : null);
              }))
            : h('p', { class: 'muted', text: 'Esta vez no ha caído ninguno.' })),
        h('div', { class: 'panel' }, h('h3', { text: 'Objetos perdidos' }),
          r.lost.length ? h('ul', { class: 'lost' }, r.lost.map((n) => h('li', { text: n }))) : h('p', { class: 'muted', text: 'Ninguno.' }),
          r.worn && r.worn.length ? [h('h3', { text: 'Desgastados', style: { marginTop: '.8rem' } }), h('ul', { class: 'worn' }, r.worn.map((n) => h('li', { text: n })))] : null)
      ),
      h('button', { class: 'btn btn-primary btn-big', onClick: () => { PA.state.lastResult = null; PA.save(); PA.ui.go('zones'); } }, 'Volver a la base')
    ));
  };

  PA.expedition = E;
})(window.PA);
