const MODULE_ID = "vs-combat-overlay";
const OVERLAY_ID = "vs-combat-overlay-root";
const FALLBACK_IMG = "icons/svg/mystery-man.svg";
const SETTING_ENABLED = "enabled";
const FLAG_DEFEATED = "defeated";
const FLAG_SIDES = "sides";
const LOCALIZATION_FALLBACKS = {
  "pt-BR": {
    "settings.enabled.name": "VS Overlay ativo",
    "settings.enabled.hint": "Mostra o overlay VS durante combates.",
    "controls.enable": "Ativar VS Overlay",
    "controls.disable": "Desativar VS Overlay",
    "controls.config": "Configurar lados do VS Overlay",
    "hud.markActive": "Marcar como ativo no VS Overlay",
    "hud.markDefeated": "Marcar como derrotado no VS Overlay",
    "common.unknown": "Desconhecido",
    "config.title": "VS Overlay",
    "config.allies": "Aliados",
    "config.enemies": "Inimigos",
    "config.openSheet": "Abrir ficha",
    "config.toggleDefeated": "Alternar derrotado",
    "config.reveal": "Revelar no overlay",
    "config.hide": "Esconder do overlay",
    "config.remove": "Remover",
    "config.dropHint": "Arraste fichas, tokens ou combatentes aqui",
    "config.hiddenSuffix": " (oculto)",
    "notifications.dropReadFailed": "Nao consegui ler esse item arrastado para o VS Overlay."
  },
  en: {
    "settings.enabled.name": "VS Overlay enabled",
    "settings.enabled.hint": "Shows the VS overlay during combat.",
    "controls.enable": "Enable VS Overlay",
    "controls.disable": "Disable VS Overlay",
    "controls.config": "Configure VS Overlay sides",
    "hud.markActive": "Mark as active in VS Overlay",
    "hud.markDefeated": "Mark as defeated in VS Overlay",
    "common.unknown": "Unknown",
    "config.title": "VS Overlay",
    "config.allies": "Allies",
    "config.enemies": "Enemies",
    "config.openSheet": "Open sheet",
    "config.toggleDefeated": "Toggle defeated",
    "config.reveal": "Show in overlay",
    "config.hide": "Hide from overlay",
    "config.remove": "Remove",
    "config.dropHint": "Drag actors, tokens, or combatants here",
    "config.hiddenSuffix": " (hidden)",
    "notifications.dropReadFailed": "I could not read that dropped item for the VS Overlay."
  }
};

let configApp;
let previousOverlayUuids = new Set();
let pendingNewUuids = new Set();
let pendingCompactionSides = new Set();
let suppressOverlayRefreshUntil = 0;
let overlayGeneration = 0;
const preloadedImages = new Map();

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initializing`);

  game.settings.register(MODULE_ID, SETTING_ENABLED, {
    name: localize("settings.enabled.name"),
    hint: localize("settings.enabled.hint"),
    scope: "world",
    config: false,
    type: Boolean,
    default: true,
    onChange: () => {
      refreshVSOverlay();
      ui.controls?.render?.();
    }
  });
});

Hooks.once("ready", () => {
  game.socket?.on(`module.${MODULE_ID}`, handleSocketMessage);
  refreshVSOverlay();
});

Hooks.on("combatStart", refreshVSOverlay);
Hooks.on("deleteCombat", () => {
  removeVSOverlay();
  previousOverlayUuids = new Set();
  pendingNewUuids = new Set();
  pendingCompactionSides = new Set();
});
Hooks.on("updateCombat", refreshVSOverlay);
Hooks.on("createCombatant", refreshVSOverlay);
Hooks.on("updateCombatant", refreshVSOverlay);
Hooks.on("deleteCombatant", refreshVSOverlay);
Hooks.on("updateToken", refreshVSOverlay);

Hooks.on("getSceneControlButtons", addSceneControlButtons);
Hooks.on("renderTokenHUD", addDefeatedHudButton);

function refreshVSOverlay(options = {}) {
  const combat = game.combat;
  const force = options?.force === true;

  if (!isOverlayEnabled() || !combat?.started) {
    removeVSOverlay();
    previousOverlayUuids = new Set();
    pendingNewUuids = new Set();
    return;
  }

  if (!force && Date.now() < suppressOverlayRefreshUntil && !pendingNewUuids.size) {
    configApp?.render(false);
    return;
  }

  renderVSOverlay(combat);
  configApp?.render(false);
}

function isOverlayEnabled() {
  return game.settings.get(MODULE_ID, SETTING_ENABLED);
}

async function toggleOverlayEnabled() {
  if (!game.user.isGM) return;

  const enabled = isOverlayEnabled();

  if (enabled) await playOverlayExitAnimation();
  await game.settings.set(MODULE_ID, SETTING_ENABLED, !enabled);
  ui.controls?.render?.();
}

function addSceneControlButtons(controls) {
  const tokenControls = findTokenControls(controls);
  if (!tokenControls) return;

  addTool(tokenControls, {
    name: "vs-combat-overlay-toggle",
    title: isOverlayEnabled() ? localize("controls.disable") : localize("controls.enable"),
    icon: "fas fa-bolt",
    toggle: true,
    active: isOverlayEnabled(),
    button: true,
    visible: game.user.isGM,
    onClick: toggleOverlayEnabled
  });

  addTool(tokenControls, {
    name: "vs-combat-overlay-config",
    title: localize("controls.config"),
    icon: "fas fa-people-arrows",
    button: true,
    visible: game.user.isGM,
    onClick: openConfigApp
  });
}

function addTool(control, tool) {
  if (Array.isArray(control.tools)) {
    const existing = control.tools.find((candidate) => candidate.name === tool.name);
    if (existing) Object.assign(existing, tool);
    else control.tools.push(tool);
    return;
  }

  if (control.tools instanceof Map) {
    control.tools.set(tool.name, tool);
    return;
  }

  if (control.tools && typeof control.tools === "object") control.tools[tool.name] = tool;
}

function findTokenControls(controls) {
  if (Array.isArray(controls)) return controls.find((control) => ["token", "tokens"].includes(control.name));
  return controls?.tokens ?? controls?.token;
}

function openConfigApp() {
  configApp ??= new VSOverlayConfigApp();
  configApp.render(true);
}

function addDefeatedHudButton(app, html) {
  if (!game.user.isGM) return;

  const token = app.object;
  const combatant = findCombatantForToken(token);
  if (!combatant) return;

  const defeated = isEntryDefeated(combatant);
  const button = document.createElement("div");
  button.className = `control-icon vs-combat-defeated-toggle ${defeated ? "active" : ""}`;
  button.title = defeated ? localize("hud.markActive") : localize("hud.markDefeated");
  button.innerHTML = `<i class="fas fa-skull"></i>`;
  button.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleCombatantDefeated(combatant);
  });

  const element = html instanceof HTMLElement ? html : html?.[0];
  const column = element?.querySelector(".col.left") ?? element?.querySelector(".left");
  column?.appendChild(button);
}

async function toggleCombatantDefeated(combatant) {
  const defeated = isEntryDefeated(combatant);
  const nextDefeated = !defeated;

  setRenderedDefeatedState(combatant.uuid, nextDefeated);
  suppressOverlayRefresh();
  if (nextDefeated) playDefeatedAnimation(combatant.uuid);
  else playRecoveryAnimation(combatant.uuid);

  persistDefeatedState(combatant.uuid, nextDefeated, combatant);
}

function renderVSOverlay(combat) {
  const existingRoot = document.getElementById(OVERLAY_ID);
  const shouldAnimate = !existingRoot;
  const previousVisibleState = captureVisibleOverlayState(existingRoot);
  const previousDefeatedState = captureDefeatedOverlayState(existingRoot);
  removeVSOverlay();
  overlayGeneration += 1;
  const generation = overlayGeneration;
  const knownUuids = new Set(previousOverlayUuids);

  const sides = getCombatSides(combat);
  const allies = sides.allies.filter((entry) => !entry.hidden).map(normalizeEntryImage);
  const enemies = sides.enemies.filter((entry) => !entry.hidden).map(normalizeEntryImage);
  const currentVisibleState = createVisibleState({ left: allies, right: enemies });
  const currentDefeatedState = createDefeatedState([...allies, ...enemies]);
  const newUuids = getNewVisibleUuids(currentVisibleState, previousVisibleState, pendingNewUuids, shouldAnimate);
  const compactionSides = getCompactionSides(currentVisibleState, previousVisibleState, pendingCompactionSides, shouldAnimate);

  const root = document.createElement("section");
  root.id = OVERLAY_ID;
  root.classList.toggle("is-enter-prep", shouldAnimate);

  root.innerHTML = `
    <div class="vs-overlay-vignette"></div>
    <div class="vs-overlay-fx">
      <div class="vs-impact-burst"></div>
    </div>
    <div class="vs-overlay-frame" aria-hidden="true">
      <div class="vs-fighter-wall vs-fighter-wall-left ${!allies.length ? "is-empty" : ""}" style="${getFighterCountStyle(allies)}">
        ${createFighterColumns(allies, "left", { shouldAnimate, knownUuids, newUuids })}
      </div>

      <div class="vs-fighter-wall vs-fighter-wall-right ${!enemies.length ? "is-empty" : ""}" style="${getFighterCountStyle(enemies)}">
        ${createFighterColumns(enemies, "right", { shouldAnimate, knownUuids, newUuids })}
      </div>

      <div class="vs-center-mark">
        <div class="vs-text">VS</div>
      </div>
    </div>
  `;

  const host = getOverlayHost();
  root.classList.toggle("vs-overlay-root--body", host === document.body);
  applyPanelImages(root);
  host.insertBefore(root, host.firstElementChild);
  bindOverlayPanelClicks(root);
  scheduleOverlayEnter(root, generation, shouldAnimate);
  triggerSideCompactionAnimations(root, compactionSides, newUuids, generation, shouldAnimate);
  triggerNewEntryAnimations(root, newUuids, generation);
  triggerDefeatedChangeAnimations(root, previousDefeatedState, currentDefeatedState, newUuids, generation, shouldAnimate);
  previousOverlayUuids = getEntryUuidSet([...allies, ...enemies]);
  pendingNewUuids = new Set();
  pendingCompactionSides = new Set();
}

function captureVisibleOverlayState(root) {
  const state = createEmptyVisibleState();
  if (!root) return state;

  root.querySelectorAll(".vs-fighter-slot[data-side][data-uuid]").forEach((slot) => {
    const side = slot.dataset.side;
    const uuid = slot.dataset.uuid;
    if (!uuid || !state[side]) return;
    state[side].add(uuid);
  });

  return state;
}

function captureDefeatedOverlayState(root) {
  const state = new Map();
  if (!root) return state;

  root.querySelectorAll(".vs-fighter-slot[data-uuid]").forEach((slot) => {
    if (!slot.dataset.uuid) return;
    state.set(slot.dataset.uuid, slot.classList.contains("is-defeated"));
  });

  return state;
}

function createDefeatedState(entries) {
  const state = new Map();

  entries.forEach((entry) => {
    if (entry.uuid) state.set(entry.uuid, Boolean(entry.defeated));
  });

  return state;
}

function createVisibleState(entriesBySide) {
  const state = createEmptyVisibleState();

  Object.entries(entriesBySide).forEach(([side, entries]) => {
    entries.forEach((entry) => {
      if (entry.uuid) state[side].add(entry.uuid);
    });
  });

  return state;
}

function createEmptyVisibleState() {
  return {
    left: new Set(),
    right: new Set()
  };
}

function getNewVisibleUuids(currentState, previousState, explicitNewUuids, shouldAnimate) {
  const newUuids = new Set(explicitNewUuids);
  if (shouldAnimate) return newUuids;

  for (const side of ["left", "right"]) {
    currentState[side].forEach((uuid) => {
      if (!previousState[side].has(uuid)) newUuids.add(uuid);
    });
  }

  return newUuids;
}

function getCompactionSides(currentState, previousState, explicitSides, shouldAnimate) {
  const sides = new Set([...explicitSides].map(getRenderSide));
  if (shouldAnimate) return sides;

  for (const side of ["left", "right"]) {
    const removed = [...previousState[side]].some((uuid) => !currentState[side].has(uuid));
    if (removed) sides.add(side);
  }

  return sides;
}

function triggerDefeatedChangeAnimations(root, previousState, currentState, newUuids, generation, shouldAnimate) {
  if (shouldAnimate || !previousState.size) return;

  requestAnimationFrame(() => {
    if (generation !== overlayGeneration || !root.isConnected) return;

    currentState.forEach((defeated, uuid) => {
      if (newUuids.has(uuid) || !previousState.has(uuid) || previousState.get(uuid) === defeated) return;

      if (defeated) playDefeatedAnimation(uuid);
      else playRecoveryAnimation(uuid);
    });
  });
}

function triggerSideCompactionAnimations(root, compactionSides, newUuids, generation, shouldAnimate) {
  if (shouldAnimate || !compactionSides.size) return;

  root.getBoundingClientRect();
  requestAnimationFrame(() => {
    if (generation !== overlayGeneration || !root.isConnected) return;

    compactionSides.forEach((side) => {
      const renderSide = getRenderSide(side);
      const slots = [...root.querySelectorAll(`.vs-fighter-slot[data-side="${renderSide}"][data-uuid]`)]
        .filter((slot) => slot.dataset.uuid && !newUuids.has(slot.dataset.uuid));

      slots.forEach((slot, index) => {
        const fromX = renderSide === "right" ? "5%" : "-5%";
        const cutX = renderSide === "right" ? "-1.2%" : "1.2%";

        slot.animate(
          [
            { opacity: 0.72, transform: `translateX(${fromX})`, filter: "brightness(1.35) contrast(1.08)" },
            { opacity: 1, transform: `translateX(${cutX})`, filter: "brightness(1.08) contrast(1.03)", offset: 0.42 },
            { opacity: 1, transform: "translateX(0)", filter: "brightness(1) contrast(1)" }
          ],
          {
            delay: Math.min(index * 14, 42),
            duration: 170,
            easing: "cubic-bezier(0.55, 0, 0.28, 1)",
            fill: "both"
          }
        );
      });
    });
  });
}

function getRenderSide(side) {
  if (side === "allies") return "left";
  if (side === "enemies") return "right";
  return side;
}

async function scheduleOverlayEnter(root, generation, shouldAnimate) {
  if (!shouldAnimate) return;

  root.getBoundingClientRect();
  await Promise.race([
    preloadPanelImages(root),
    new Promise((resolve) => window.setTimeout(resolve, 120))
  ]);

  requestAnimationFrame(() => {
    if (generation !== overlayGeneration || !root.isConnected) return;
    root.classList.remove("is-enter-prep");
    root.classList.add("is-entering");
  });
}

function preloadPanelImages(root) {
  const srcs = [...root.querySelectorAll(".vs-fighter-panel[data-img]")]
    .map((panel) => panel.dataset.img)
    .filter(Boolean);

  return Promise.allSettled(srcs.map(preloadImage));
}

function preloadImage(src) {
  if (preloadedImages.has(src)) return preloadedImages.get(src);

  const promise = new Promise((resolve) => {
    const image = new Image();
    image.onload = resolve;
    image.onerror = resolve;
    image.src = src;

    if (image.decode) image.decode().then(resolve).catch(resolve);
  });

  preloadedImages.set(src, promise);
  return promise;
}

function createFighterColumns(entries, side, context = {}) {
  const visibleEntries = entries;
  const slotCount = getDisplayCount(visibleEntries);
  if (!slotCount) return "";

  return Array.from({ length: slotCount }, (_, index) => {
    const entry = visibleEntries[index];
    return entry ? createFighterPanel(entry, side, context) : "";
  }).join("");
}

function createFighterPanel(entry, side, { shouldAnimate = false, knownUuids = new Set(), newUuids = new Set() } = {}) {
  const img = entry.img || FALLBACK_IMG;
  const name = entry.name || localize("common.unknown");
  const isNew = !shouldAnimate && entry.uuid && (newUuids.has(entry.uuid) || !knownUuids.has(entry.uuid));

  return `
    <article class="vs-fighter-slot ${entry.defeated ? "is-defeated" : ""} ${isNew ? "is-pending-new" : ""}" data-side="${side}" data-uuid="${escapeAttr(entry.uuid ?? "")}">
      <div class="vs-fighter-panel" data-img="${escapeAttr(img)}">
        <div class="vs-fighter-shade"></div>
      </div>
      <div class="vs-fighter-name" title="${escapeAttr(name)}">${escapeHtml(name)}</div>
    </article>
  `;
}

function getDisplayCount(entries) {
  return entries.length || 0;
}

function getFighterCountStyle(entries) {
  const count = getDisplayCount(entries);
  return `--fighter-count: ${count}; --fighter-grid-count: ${Math.max(1, count)};`;
}

function bindOverlayPanelClicks(root) {
  root.querySelectorAll(".vs-fighter-panel[data-img]").forEach((panel) => {
    panel.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const slot = event.currentTarget.closest(".vs-fighter-slot[data-uuid]");
      openOverlayEntrySheet(slot?.dataset.uuid);
    });
  });
}

async function openOverlayEntrySheet(uuid) {
  const document = await resolveOverlayEntryDocument(uuid);
  const sheetDocument = document?.actor ?? document;

  sheetDocument?.sheet?.render?.(true);
}

async function resolveOverlayEntryDocument(uuid) {
  if (!uuid) return null;

  const combatant = findCombatantByUuid(uuid);
  if (combatant) return combatant;

  return fromUuid(uuid);
}

function getCombatSides(combat = game.combat) {
  const stored = foundry.utils.deepClone(combat?.getFlag(MODULE_ID, FLAG_SIDES) ?? {});

  return {
    allies: Array.isArray(stored.allies) ? stored.allies : [],
    enemies: Array.isArray(stored.enemies) ? stored.enemies : []
  };
}

async function setCombatSides(sides) {
  if (!game.combat) return;
  await game.combat.setFlag(MODULE_ID, FLAG_SIDES, sides);
  broadcastOverlayRefresh();
  window.setTimeout(() => {
    if (pendingNewUuids.size) refreshVSOverlay();
  }, 80);
}

function broadcastOverlayRefresh() {
  if (!game.user.isGM) return;

  game.socket?.emit(`module.${MODULE_ID}`, {
    type: "refresh",
    newUuids: [...pendingNewUuids],
    compactionSides: [...pendingCompactionSides]
  });
}

function handleSocketMessage(message) {
  if (message?.type !== "refresh") return;

  (message.newUuids ?? []).forEach((uuid) => pendingNewUuids.add(uuid));
  (message.compactionSides ?? []).forEach((side) => pendingCompactionSides.add(side));
  refreshVSOverlay({ force: true });
}

async function addEntryToSide(side, entry) {
  const sides = getCombatSides();
  const otherSide = side === "allies" ? "enemies" : "allies";

  sides[side] = sides[side].filter((existing) => existing.uuid !== entry.uuid);
  sides[otherSide] = sides[otherSide].filter((existing) => existing.uuid !== entry.uuid);
  if (side === "enemies") sides[side].unshift(entry);
  else sides[side].push(entry);
  pendingNewUuids.add(entry.uuid);

  await setCombatSides(sides);
}

async function removeEntryFromSide(side, uuid) {
  await playSlotExitAnimation(uuid, side);
  pendingCompactionSides.add(side);
  const sides = getCombatSides();
  sides[side] = sides[side].filter((entry) => entry.uuid !== uuid);
  await setCombatSides(sides);
}

async function moveAssignedEntry(sourceSide, targetSide, uuid, beforeUuid = null) {
  const sides = getCombatSides();
  const sourceEntries = sides[sourceSide];
  const targetEntries = sides[targetSide];
  if (!Array.isArray(sourceEntries) || !Array.isArray(targetEntries)) return;

  const entryIndex = sourceEntries.findIndex((entry) => entry.uuid === uuid);
  if (entryIndex < 0) return;

  const [entry] = sourceEntries.splice(entryIndex, 1);
  const cleanTargetEntries = sourceSide === targetSide
    ? sourceEntries
    : targetEntries.filter((candidate) => candidate.uuid !== uuid);

  const insertIndex = beforeUuid
    ? cleanTargetEntries.findIndex((candidate) => candidate.uuid === beforeUuid)
    : -1;

  if (insertIndex >= 0) cleanTargetEntries.splice(insertIndex, 0, entry);
  else cleanTargetEntries.push(entry);

  sides[sourceSide] = sourceEntries;
  sides[targetSide] = cleanTargetEntries;
  await setCombatSides(sides);
}

async function toggleAssignedEntryDefeated(side, uuid) {
  const sides = getCombatSides();
  const entry = sides[side].find((candidate) => candidate.uuid === uuid);
  if (!entry) return;

  setAssignedEntryDefeated(side, uuid, !entry.defeated);
}

function setAssignedEntryDefeated(side, uuid, defeated) {
  const entry = getCombatSides()[side]?.find((candidate) => candidate.uuid === uuid);
  if (entry) entry.defeated = defeated;

  setRenderedDefeatedState(uuid, defeated);
  suppressOverlayRefresh();
  if (defeated) playDefeatedAnimation(uuid);
  else playRecoveryAnimation(uuid);

  persistAssignedEntryState(side, uuid, { defeated }, findCombatantByUuid(uuid));
}

async function toggleAssignedEntryHidden(side, uuid) {
  const sides = getCombatSides();
  const entry = sides[side].find((candidate) => candidate.uuid === uuid);
  if (!entry) return;

  setAssignedEntryHidden(side, uuid, !entry.hidden);
}

function setAssignedEntryHidden(side, uuid, hidden) {
  if (hidden) {
    playSlotExitAnimation(uuid, side).finally(() => {
      pendingCompactionSides.add(side);
      persistAssignedEntryState(side, uuid, { hidden: true }, undefined, { suppressRefresh: false, compactionSide: side });
    });
    return;
  }

  pendingNewUuids.add(uuid);
  persistAssignedEntryState(side, uuid, { hidden: false }, undefined, { suppressRefresh: false, newUuid: uuid });
}

async function updateAssignedEntry(uuid, updates) {
  const sides = getCombatSides();

  for (const side of ["allies", "enemies"]) {
    const entry = sides[side].find((candidate) => candidate.uuid === uuid);
    if (entry) Object.assign(entry, updates);
  }

  await setCombatSides(sides);
}

async function persistDefeatedState(uuid, defeated, combatant = findCombatantByUuid(uuid)) {
  await updateAssignedEntry(uuid, { defeated });
  suppressOverlayRefresh();
  if (combatant) await combatant.setFlag(MODULE_ID, FLAG_DEFEATED, defeated);
}

async function persistAssignedEntryState(side, uuid, updates, combatant = findCombatantByUuid(uuid), options = {}) {
  const suppressRefresh = options.suppressRefresh !== false;
  const sides = getCombatSides();
  const entry = sides[side]?.find((candidate) => candidate.uuid === uuid);
  if (!entry) return;

  Object.assign(entry, updates);
  if (suppressRefresh) suppressOverlayRefresh();
  else if (options.compactionSide) suppressOverlayRefresh(350);
  await setCombatSides(sides);
  if (options.newUuid) pendingNewUuids.add(options.newUuid);
  if (options.compactionSide) pendingCompactionSides.add(options.compactionSide);
  if (!suppressRefresh) refreshVSOverlay({ force: true });

  if ("defeated" in updates && combatant) {
    suppressOverlayRefresh();
    await combatant.setFlag(MODULE_ID, FLAG_DEFEATED, updates.defeated);
  }
}

async function createEntryFromDropData(data) {
  const document = await resolveDroppedDocument(data);
  if (!document) return null;

  const combatant = getCombatantFromDocument(document);
  const actor = combatant?.actor ?? document.actor ?? (document.documentName === "Actor" ? document : null);
  const token = combatant?.token ?? (document.documentName === "Token" ? document : null);
  const uuid = combatant?.uuid ?? token?.uuid ?? actor?.uuid ?? document.uuid;
  const name = combatant?.name ?? token?.name ?? actor?.name ?? document.name ?? localize("common.unknown");
  const img = getTokenImage({ combatant, token, actor, document });

  if (!uuid) return null;

  return {
    uuid,
    name,
    img,
    defeated: combatant ? isEntryDefeated(combatant) : false,
    hidden: false
  };
}

async function resolveDroppedDocument(data) {
  const uuid = data.uuid ?? data.documentUuid;
  if (uuid) return fromUuid(uuid);

  if (data.type === "Actor" && data.id) return game.actors.get(data.id);
  if (data.type === "Combatant" && data.id) return game.combat?.combatants.get(data.id);
  if (data.type === "Token" && data.id) return canvas?.scene?.tokens?.get(data.id);

  return null;
}

function getCombatantFromDocument(document) {
  if (document.documentName === "Combatant") return document;
  if (document.combatant) return document.combatant;

  const tokenId = document.documentName === "Token" ? document.id : null;
  if (tokenId) return game.combat?.combatants.find((combatant) => combatant.tokenId === tokenId || combatant.token?.id === tokenId);

  if (document.documentName === "Actor") {
    return game.combat?.combatants.find((combatant) => combatant.actor?.uuid === document.uuid);
  }

  return null;
}

function normalizeEntryImage(entry) {
  const combatant = findCombatantByUuid(entry.uuid);
  if (!combatant) return entry;

  return {
    ...entry,
    img: getTokenImage({ combatant, token: combatant.token, actor: combatant.actor, document: combatant })
  };
}

function getTokenImage({ combatant, token, actor, document }) {
  return (
    token?.texture?.src ??
    token?.document?.texture?.src ??
    combatant?.token?.texture?.src ??
    combatant?.token?.document?.texture?.src ??
    document?.texture?.src ??
    document?.document?.texture?.src ??
    actor?.prototypeToken?.texture?.src ??
    document?.prototypeToken?.texture?.src ??
    combatant?.img ??
    actor?.img ??
    document?.img ??
    FALLBACK_IMG
  );
}

function findCombatantForToken(token) {
  const documentId = token?.document?.id ?? token?.id;
  if (!documentId || !game.combat) return null;

  return game.combat.combatants.find((combatant) => {
    const combatantTokenId = combatant.token?.id ?? combatant.token?.document?.id ?? combatant.tokenId;
    return combatantTokenId === documentId;
  });
}

function findCombatantByUuid(uuid) {
  return game.combat?.combatants.find((combatant) => {
    const tokenUuid = combatant.token?.uuid ?? combatant.token?.document?.uuid;
    const actorUuid = combatant.actor?.uuid;

    return combatant.uuid === uuid || tokenUuid === uuid || actorUuid === uuid;
  });
}

function isEntryDefeated(entry) {
  return Boolean(entry?.getFlag?.(MODULE_ID, FLAG_DEFEATED) || entry?.defeated);
}

function getOverlayHost() {
  const board = document.getElementById("board");
  if (board && board.tagName !== "CANVAS") return board;

  return document.body;
}

function removeVSOverlay() {
  overlayGeneration += 1;
  const root = document.getElementById(OVERLAY_ID);
  if (!root) return;

  root.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
  root.remove();
}

function getEntryUuidSet(entries) {
  return new Set(entries.map((entry) => entry.uuid).filter(Boolean));
}

function applyPanelImages(root) {
  root.querySelectorAll(".vs-fighter-panel[data-img]").forEach((panel) => {
    panel.style.backgroundImage = `url("${panel.dataset.img}")`;
  });
}

function suppressOverlayRefresh(duration = 900) {
  suppressOverlayRefreshUntil = Math.max(suppressOverlayRefreshUntil, Date.now() + duration);
}

function setRenderedDefeatedState(uuid, defeated) {
  const root = document.getElementById(OVERLAY_ID);
  if (!root || !uuid) return;

  const slot = root.querySelector(`.vs-fighter-slot[data-uuid="${escapeSelector(uuid)}"]`);
  cancelSlotAnimations(slot, { keepBreath: !defeated });
  slot?.classList.toggle("is-defeated", defeated);
}

function cancelSlotAnimations(slot, { keepBreath = false } = {}) {
  slot?.getAnimations({ subtree: true }).forEach((animation) => {
    if (animation.playState === "finished") return;
    if (keepBreath && animation.animationName === "vs-fighter-breath") return;
    animation.cancel();
  });
}

function triggerNewEntryAnimations(root, newUuids, generation = overlayGeneration) {
  if (!newUuids.size) return;

  const selectors = [...newUuids]
    .map((uuid) => `.vs-fighter-slot[data-uuid="${escapeSelector(uuid)}"]`)
    .join(",");

  if (!selectors) return;

  const slots = root.querySelectorAll(selectors);
  slots.forEach((slot) => {
    const isRight = getRenderSide(slot.dataset.side) === "right";
    const fromX = isRight ? "108%" : "-108%";
    const overshootX = isRight ? "-1.8%" : "1.8%";

    slot.getAnimations().forEach((animation) => animation.cancel());
    slot.classList.remove("is-new");
    slot.classList.add("is-pending-new");

    requestAnimationFrame(() => {
      if (generation !== overlayGeneration || !slot.isConnected) return;

      const movement = slot.animate(
        [
          { opacity: 0, transform: `translateX(${fromX}) scaleX(0.78)` },
          { opacity: 1, transform: `translateX(${overshootX}) scaleX(1.025)`, offset: 0.72 },
          { opacity: 1, transform: "translateX(0) scaleX(1)" }
        ],
        {
          duration: 920,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "both"
        }
      );

      slot.classList.remove("is-pending-new");
      slot.classList.add("is-new");
      triggerPanelFlash(slot);

      movement.finished.finally(() => {
        if (!slot.isConnected) return;
        slot.classList.remove("is-new");
      });
    });
  });
}

function triggerPanelFlash(slot) {
  const panel = slot.querySelector(".vs-fighter-panel");
  if (!panel) return;
  const isRight = getRenderSide(slot.dataset.side) === "right";
  const fromX = isRight ? "120%" : "-120%";
  const midX = isRight ? "20%" : "-20%";
  const toX = isRight ? "-120%" : "120%";

  panel.animate(
    [
      { opacity: 0, transform: `translateX(${fromX})` },
      { opacity: 0.85, transform: `translateX(${midX})`, offset: 0.35 },
      { opacity: 0, transform: `translateX(${toX})` }
    ],
    {
      duration: 620,
      easing: "ease-out",
      pseudoElement: "::after"
    }
  );
}

async function playSlotExitAnimation(uuid, side) {
  const root = document.getElementById(OVERLAY_ID);
  if (!root || !uuid) return;

  const slot = root.querySelector(`.vs-fighter-slot[data-uuid="${escapeSelector(uuid)}"]`);
  if (!slot) return;

  const direction = side === "enemies" || slot.dataset.side === "right" ? "110%" : "-110%";
  slot.classList.add("is-leaving");

  await slot.animate(
    [
      { opacity: 1, transform: "translateX(0) scaleX(1)" },
      { opacity: 1, transform: "translateX(2%) scaleX(1.04)", offset: 0.24 },
      { opacity: 0, transform: `translateX(${direction}) scaleX(0.72)` }
    ],
    {
      duration: 520,
      easing: "cubic-bezier(0.7, 0, 0.84, 0)",
      fill: "forwards"
    }
  ).finished.catch(() => {});
}

async function playDefeatedAnimation(uuid) {
  const root = document.getElementById(OVERLAY_ID);
  if (!root || !uuid) return;

  const slot = root.querySelector(`.vs-fighter-slot[data-uuid="${escapeSelector(uuid)}"]`);
  if (!slot) return;
  const panel = slot.querySelector(".vs-fighter-panel");
  if (!panel) return;

  cancelSlotAnimations(slot);
  slot.classList.add("is-being-defeated");

  await Promise.allSettled([
    slot.animate(
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-8px)", offset: 0.18 },
        { transform: "translateX(7px)", offset: 0.34 },
        { transform: "translateX(-4px)", offset: 0.5 },
        { transform: "translateX(0)" }
      ],
      {
        delay: 80,
        duration: 520,
        easing: "ease-out"
      }
    ).finished,
    panel.animate(
      [
        { filter: "brightness(1) grayscale(0)" },
        { filter: "brightness(1.22) grayscale(0.15)", offset: 0.2 },
        { filter: "brightness(0.55) grayscale(1)" }
      ],
      {
        duration: 520,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)"
      }
    ).finished,
    triggerDefeatedPulse(slot)
  ]);

  slot.classList.remove("is-being-defeated");
}

async function playRecoveryAnimation(uuid) {
  const root = document.getElementById(OVERLAY_ID);
  if (!root || !uuid) return;

  const slot = root.querySelector(`.vs-fighter-slot[data-uuid="${escapeSelector(uuid)}"]`);
  if (!slot) return;
  const panel = slot.querySelector(".vs-fighter-panel");
  if (!panel) return;

  cancelSlotAnimations(slot, { keepBreath: true });
  slot.classList.add("is-recovering");

  await Promise.allSettled([
    slot.animate(
      [
        { transform: "translateX(0) scale(0.985)" },
        { transform: "translateX(0) scale(1.035)", offset: 0.46 },
        { transform: "translateX(0) scale(1)" }
      ],
      {
        duration: 680,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)"
      }
    ).finished,
    panel.animate(
      [
        { filter: "brightness(0.55) grayscale(1)" },
        { filter: "brightness(1.28) grayscale(0.15)", offset: 0.46 },
        { filter: "brightness(1) grayscale(0)" }
      ],
      {
        duration: 680,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)"
      }
    ).finished,
    triggerRecoveryPulse(slot)
  ]);

  slot.classList.remove("is-recovering");
}

function triggerRecoveryPulse(slot) {
  const panel = slot.querySelector(".vs-fighter-panel");
  if (!panel) return Promise.resolve();

  return panel.animate(
    [
      { opacity: 0, transform: "translateY(18%) scaleY(0.2)" },
      { opacity: 0.95, transform: "translateY(0) scaleY(1)", offset: 0.36 },
      { opacity: 0, transform: "translateY(-18%) scaleY(1.15)" }
    ],
    {
      duration: 640,
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
      fill: "both",
      pseudoElement: "::after"
    }
  ).finished.catch(() => {});
}

function triggerDefeatedPulse(slot) {
  const panel = slot.querySelector(".vs-fighter-panel");
  if (!panel) return Promise.resolve();

  return panel.animate(
    [
      { opacity: 0, transform: "translateX(-126%) scaleX(0.75)" },
      { opacity: 0.92, transform: "translateX(-18%) scaleX(1)", offset: 0.42 },
      { opacity: 0, transform: "translateX(122%) scaleX(0.82)" }
    ],
    {
      duration: 300,
      easing: "cubic-bezier(0.55, 0, 0.28, 1)",
      fill: "both",
      pseudoElement: "::after"
    }
  ).finished.catch(() => {});
}

async function playOverlayExitAnimation() {
  const root = document.getElementById(OVERLAY_ID);
  if (!root) return;

  root.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
  root.classList.add("is-exiting");

  await waitForAnimation(root, 420);
}

function waitForAnimation(element, fallbackMs) {
  const animations = element.getAnimations({ subtree: true });
  if (!animations.length) {
    return new Promise((resolve) => window.setTimeout(resolve, fallbackMs));
  }

  return Promise.race([
    Promise.allSettled(animations.map((animation) => animation.finished)),
    new Promise((resolve) => window.setTimeout(resolve, fallbackMs))
  ]);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return entities[character];
  });
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function escapeSelector(value) {
  if (globalThis.CSS?.escape) return CSS.escape(String(value));

  return String(value).replace(/["\\]/g, "\\$&");
}

function localize(key) {
  const fullKey = `${MODULE_ID}.${key}`;
  const language = getFoundryLanguage();
  const fallback = LOCALIZATION_FALLBACKS[language]?.[key] ?? LOCALIZATION_FALLBACKS.en[key];
  if (fallback) return fallback;

  return game.i18n.localize(fullKey);
}

function getFoundryLanguage() {
  const languages = [];

  try {
    languages.push(game.i18n?.lang);
    languages.push(game.settings?.get?.("core", "language"));
    languages.push(document.documentElement?.lang);
  } catch (error) {
    // English remains the default if Foundry is not ready to expose language settings.
  }

  const normalized = languages.filter(Boolean).map((language) => String(language).toLowerCase());
  if (normalized.some((language) => language.startsWith("en"))) return "en";
  if (normalized.some((language) => language.startsWith("pt"))) return "pt-BR";

  return "en";
}

function parseDropData(event) {
  const transfer = event.originalEvent?.dataTransfer ?? event.dataTransfer;
  const raw = transfer?.getData("text/plain") || transfer?.getData("application/json");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`${MODULE_ID} | Invalid drop data`, error);
    return null;
  }
}

class VSOverlayConfigApp extends Application {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "vs-combat-overlay-config",
      title: localize("config.title"),
      classes: ["vs-combat-config"],
      width: 560,
      height: "auto",
      resizable: true
    });
  }

  async _renderInner() {
    const sides = getCombatSides();

    return $($.parseHTML(`
      <form class="vs-config-form">
        <div class="vs-config-sides">
          ${this.createSideMarkup("allies", localize("config.allies"), sides.allies)}
          ${this.createSideMarkup("enemies", localize("config.enemies"), sides.enemies)}
        </div>
      </form>
    `));
  }

  createSideMarkup(side, label, entries) {
    const rows = entries.map((entry) => `
      <li class="vs-config-entry ${entry.defeated ? "is-defeated" : ""} ${entry.hidden ? "is-hidden" : ""}" data-side="${side}" data-uuid="${escapeAttr(entry.uuid)}" draggable="true" title="${localize("config.openSheet")}">
        <img src="${escapeAttr(entry.img || FALLBACK_IMG)}" alt="" />
        <span data-hidden-label="${escapeAttr(localize("config.hiddenSuffix"))}">${escapeHtml(entry.name || localize("common.unknown"))}</span>
        <button type="button" data-action="defeated" title="${localize("config.toggleDefeated")}"><i class="fas fa-skull"></i></button>
        <button type="button" data-action="hidden" title="${entry.hidden ? localize("config.reveal") : localize("config.hide")}"><i class="fas ${entry.hidden ? "fa-eye" : "fa-eye-slash"}"></i></button>
        <button type="button" data-action="remove" title="${localize("config.remove")}"><i class="fas fa-trash"></i></button>
      </li>
    `).join("");

    return `
      <section class="vs-config-side" data-side="${side}">
        <h3>${label}</h3>
        <div class="vs-config-drop">${localize("config.dropHint")}</div>
        <ol class="vs-config-list">${rows}</ol>
      </section>
    `;
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find(".vs-config-entry").on("click", (event) => {
      if (event.target.closest("button")) return;

      const row = event.currentTarget;
      openOverlayEntrySheet(row.dataset.uuid);
    });

    html.find(".vs-config-entry").on("dragstart", (event) => {
      const row = event.currentTarget;
      const dragData = {
        type: "VSOverlayEntry",
        side: row.dataset.side,
        uuid: row.dataset.uuid
      };

      row.classList.add("is-dragging");
      event.originalEvent?.dataTransfer?.setData("text/plain", JSON.stringify(dragData));
      event.originalEvent?.dataTransfer?.setData("application/json", JSON.stringify(dragData));
      if (event.originalEvent?.dataTransfer) event.originalEvent.dataTransfer.effectAllowed = "move";
    });

    html.find(".vs-config-entry").on("dragend", (event) => {
      event.currentTarget.classList.remove("is-dragging");
      html.find(".vs-config-entry.is-drop-target").removeClass("is-drop-target");
    });

    html.find(".vs-config-entry").on("dragover", (event) => {
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.classList.add("is-drop-target");
    });

    html.find(".vs-config-entry").on("dragleave", (event) => {
      event.currentTarget.classList.remove("is-drop-target");
    });

    html.find(".vs-config-entry").on("drop", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.classList.remove("is-drop-target");

      const data = parseDropData(event);
      if (data?.type !== "VSOverlayEntry") return;

      await moveAssignedEntry(data.side, event.currentTarget.dataset.side, data.uuid, event.currentTarget.dataset.uuid);
      this.render(false);
    });

    html.find(".vs-config-side").on("dragover", (event) => {
      event.preventDefault();
      event.currentTarget.classList.add("is-dragging");
    });

    html.find(".vs-config-side").on("dragleave", (event) => {
      event.currentTarget.classList.remove("is-dragging");
    });

    html.find(".vs-config-side").on("drop", async (event) => {
      event.preventDefault();
      event.currentTarget.classList.remove("is-dragging");

      const side = event.currentTarget.dataset.side;
      const data = parseDropData(event);
      if (!data) return;

      if (data.type === "VSOverlayEntry") {
        await moveAssignedEntry(data.side, side, data.uuid);
        this.render(false);
        return;
      }

      const entry = await createEntryFromDropData(data);
      if (!entry) {
        ui.notifications?.warn(localize("notifications.dropReadFailed"));
        return;
      }

      await addEntryToSide(side, entry);
      this.render(false);
    });

    html.find("button[data-action='remove']").on("click", async (event) => {
      const row = event.currentTarget.closest(".vs-config-entry");
      removeEntryFromSide(row.dataset.side, row.dataset.uuid);
      this.render(false);
    });

    html.find("button[data-action='defeated']").on("click", async (event) => {
      const row = event.currentTarget.closest(".vs-config-entry");
      const defeated = row.classList.toggle("is-defeated");
      setAssignedEntryDefeated(row.dataset.side, row.dataset.uuid, defeated);
    });

    html.find("button[data-action='hidden']").on("click", async (event) => {
      const row = event.currentTarget.closest(".vs-config-entry");
      const hidden = row.classList.toggle("is-hidden");
      const icon = event.currentTarget.querySelector("i");
      icon?.classList.toggle("fa-eye", hidden);
      icon?.classList.toggle("fa-eye-slash", !hidden);
      event.currentTarget.title = hidden ? localize("config.reveal") : localize("config.hide");
      setAssignedEntryHidden(row.dataset.side, row.dataset.uuid, hidden);
    });
  }
}
