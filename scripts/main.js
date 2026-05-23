const MODULE_ID = "vs-combat-overlay";
const OVERLAY_ID = "vs-combat-overlay-root";
const FALLBACK_IMG = "icons/svg/mystery-man.svg";
const SETTING_ENABLED = "enabled";
const SETTING_IMAGE_SOURCE = "imageSource";
const IMAGE_SOURCE_TOKEN = "token";
const IMAGE_SOURCE_ARTWORK = "artwork";
const FLAG_DEFEATED = "defeated";
const FLAG_IMAGE_FIT = "imageFit";
const FLAG_SIDES = "sides";
const LOCALIZATION_FALLBACKS = {
  "pt-BR": {
    "settings.enabled.name": "44's VSO ativo",
    "settings.enabled.hint": "Mostra o 44's VSO durante combates.",
    "settings.imageSource.name": "Imagem dos personagens",
    "settings.imageSource.hint": "Escolhe qual imagem o 44's VSO usa para cada personagem.",
    "settings.imageSource.token": "Token",
    "settings.imageSource.artwork": "Arte do personagem",
    "controls.enable": "Ativar 44's VSO",
    "controls.disable": "Desativar 44's VSO",
    "controls.config": "Configurar lados do 44's VSO",
    "hud.markActive": "Marcar como ativo no 44's VSO",
    "hud.markDefeated": "Marcar como derrotado no 44's VSO",
    "common.unknown": "Desconhecido",
    "config.title": "44's VSO",
    "config.allies": "Aliados",
    "config.enemies": "Inimigos",
    "config.openSheet": "Abrir ficha",
    "config.toggleDefeated": "Alternar derrotado",
    "config.reveal": "Revelar no overlay",
    "config.hide": "Esconder do overlay",
    "config.remove": "Remover",
    "imageAdjust.title": "Ajustar imagem do 44's VSO",
    "imageAdjust.zoom": "Zoom",
    "imageAdjust.horizontal": "Horizontal",
    "imageAdjust.vertical": "Vertical",
    "imageAdjust.flip": "Inverter imagem",
    "imageAdjust.reset": "Resetar",
    "imageAdjust.save": "Salvar",
    "imageAdjust.cancel": "Cancelar",
    "imageAdjust.noPermission": "Voce nao tem permissao para ajustar essa imagem.",
    "imageAdjust.saved": "Ajuste da imagem salvo.",
    "imageAdjust.saveRequested": "Pedido de ajuste enviado para o mestre.",
    "imageAdjust.saveFailed": "Nao consegui salvar o ajuste da imagem.",
    "config.dropHint": "Arraste fichas, tokens ou combatentes aqui",
    "config.hiddenSuffix": " (oculto)",
    "notifications.dropReadFailed": "Nao consegui ler esse item arrastado para o 44's VSO."
  },
  en: {
    "settings.enabled.name": "44's VSO enabled",
    "settings.enabled.hint": "Shows 44's VSO during combat.",
    "settings.imageSource.name": "Character image",
    "settings.imageSource.hint": "Chooses which image 44's VSO uses for each character.",
    "settings.imageSource.token": "Token",
    "settings.imageSource.artwork": "Character artwork",
    "controls.enable": "Enable 44's VSO",
    "controls.disable": "Disable 44's VSO",
    "controls.config": "Configure 44's VSO sides",
    "hud.markActive": "Mark as active in 44's VSO",
    "hud.markDefeated": "Mark as defeated in 44's VSO",
    "common.unknown": "Unknown",
    "config.title": "44's VSO",
    "config.allies": "Allies",
    "config.enemies": "Enemies",
    "config.openSheet": "Open sheet",
    "config.toggleDefeated": "Toggle defeated",
    "config.reveal": "Show in overlay",
    "config.hide": "Hide from overlay",
    "config.remove": "Remove",
    "imageAdjust.title": "Adjust 44's VSO image",
    "imageAdjust.zoom": "Zoom",
    "imageAdjust.horizontal": "Horizontal",
    "imageAdjust.vertical": "Vertical",
    "imageAdjust.flip": "Flip image",
    "imageAdjust.reset": "Reset",
    "imageAdjust.save": "Save",
    "imageAdjust.cancel": "Cancel",
    "imageAdjust.noPermission": "You do not have permission to adjust this image.",
    "imageAdjust.saved": "Image adjustment saved.",
    "imageAdjust.saveRequested": "Image adjustment request sent to the GM.",
    "imageAdjust.saveFailed": "I could not save the image adjustment.",
    "config.dropHint": "Drag actors, tokens, or combatants here",
    "config.hiddenSuffix": " (hidden)",
    "notifications.dropReadFailed": "I could not read that dropped item for 44's VSO."
  }
};

let configApp;
let previousOverlayUuids = new Set();
let pendingNewUuids = new Set();
let pendingCompactionSides = new Set();
let suppressOverlayRefreshUntil = 0;
let overlayGeneration = 0;
let scheduledOverlayRefreshId = null;
let scheduledOverlayRefreshOptions = {};
let lastOverlaySignature = "";
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
    onChange: (enabled) => {
      handleOverlayEnabledChange(enabled);
      ui.controls?.render?.();
    }
  });

  game.settings.register(MODULE_ID, SETTING_IMAGE_SOURCE, {
    name: localize("settings.imageSource.name"),
    hint: localize("settings.imageSource.hint"),
    scope: "world",
    config: true,
    type: String,
    choices: {
      [IMAGE_SOURCE_TOKEN]: localize("settings.imageSource.token"),
      [IMAGE_SOURCE_ARTWORK]: localize("settings.imageSource.artwork")
    },
    default: IMAGE_SOURCE_TOKEN,
    onChange: () => {
      refreshVSOverlay({ force: true });
      configApp?.render(false);
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
Hooks.on("updateScene", refreshVSOverlayForScene);
Hooks.on("createCombatant", refreshVSOverlay);
Hooks.on("updateCombatant", refreshVSOverlay);
Hooks.on("deleteCombatant", refreshVSOverlay);
Hooks.on("updateToken", refreshVSOverlay);
Hooks.on("updateActor", () => scheduleOverlayRefresh({ force: true, delay: 50 }));
Hooks.on("canvasReady", () => {
  refreshVSOverlay({ force: true });
  configApp?.render(false);
});

Hooks.on("getSceneControlButtons", addSceneControlButtons);
Hooks.on("getActorSheetHeaderButtons", addActorSheetHeaderButton);
Hooks.on("getApplicationHeaderButtons", addActorSheetHeaderButton);
Hooks.on("renderActorSheet", addActorSheetHeaderButtonFallback);
Hooks.on("renderApplicationV2", addActorSheetHeaderButtonFallback);
Hooks.on("renderActorSheet5eCharacter", addActorSheetHeaderButtonFallback);
Hooks.on("renderActorSheet5eNPC", addActorSheetHeaderButtonFallback);
Hooks.on("renderActorSheet5eVehicle", addActorSheetHeaderButtonFallback);
Hooks.on("renderActorSheet5eCharacter2", addActorSheetHeaderButtonFallback);
Hooks.on("renderActorSheet5eNPC2", addActorSheetHeaderButtonFallback);
Hooks.on("renderActorSheet5eVehicle2", addActorSheetHeaderButtonFallback);
Hooks.on("renderTokenHUD", addDefeatedHudButton);

function refreshVSOverlay(options = {}) {
  const combat = getCurrentCombat();
  const force = options?.force === true;
  const sides = options?.sides ? normalizeSides(options.sides) : getCombatSides(combat);

  if (!isOverlayEnabled() || !shouldRenderOverlay(combat, sides)) {
    removeVSOverlay();
    previousOverlayUuids = new Set();
    pendingNewUuids = new Set();
    pendingCompactionSides = new Set();
    lastOverlaySignature = "";
    return;
  }

  if (!force && Date.now() < suppressOverlayRefreshUntil && !pendingNewUuids.size) {
    configApp?.render(false);
    return;
  }

  const signature = getOverlaySignature(sides);
  const hasPendingAnimations = pendingNewUuids.size || pendingCompactionSides.size;
  const existingRoot = document.getElementById(OVERLAY_ID);
  if (!hasPendingAnimations && existingRoot && signature === lastOverlaySignature) {
    configApp?.render(false);
    return;
  }

  try {
    renderVSOverlay(combat, sides);
    lastOverlaySignature = signature;
  } catch (error) {
    console.error(`${MODULE_ID} | Failed to render VS overlay`, error);
    removeVSOverlay();
  }
  configApp?.render(false);
}

function isOverlayEnabled() {
  return game.settings.get(MODULE_ID, SETTING_ENABLED);
}

function shouldRenderOverlay(combat, sides) {
  if (!hasConfiguredEntries(sides)) return false;
  if (isCombatStarted(combat)) return true;

  return Boolean(getCurrentScene());
}

function scheduleOverlayRefresh({ force = false, delay = 0, sides } = {}) {
  scheduledOverlayRefreshOptions = {
    force: Boolean(scheduledOverlayRefreshOptions.force || force),
    sides: sides ?? scheduledOverlayRefreshOptions.sides
  };

  if (scheduledOverlayRefreshId) window.clearTimeout(scheduledOverlayRefreshId);
  scheduledOverlayRefreshId = window.setTimeout(() => {
    const options = scheduledOverlayRefreshOptions;
    scheduledOverlayRefreshId = null;
    scheduledOverlayRefreshOptions = {};
    refreshVSOverlay(options);
  }, delay);
}

async function toggleOverlayEnabled() {
  if (!game.user.isGM) return;

  const enabled = isOverlayEnabled();
  await game.settings.set(MODULE_ID, SETTING_ENABLED, !enabled);
  ui.controls?.render?.();
}

async function handleOverlayEnabledChange(enabled) {
  if (enabled) {
    refreshVSOverlay();
    return;
  }

  const generation = overlayGeneration;
  await playOverlayExitAnimation();

  if (generation === overlayGeneration && !isOverlayEnabled()) {
    removeVSOverlay();
    previousOverlayUuids = new Set();
    pendingNewUuids = new Set();
    pendingCompactionSides = new Set();
    lastOverlaySignature = "";
  }
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

function isActorSheetApp(app) {
  if (!app || app?.constructor?.name === "VSOverlayImageAdjustApp") return false;
  if (typeof ActorSheet !== "undefined" && app instanceof ActorSheet) return true;

  const appName = app.constructor?.name ?? "";
  return /ActorSheet/i.test(appName);
}

function getActorFromSheetApp(app) {
  if (!isActorSheetApp(app)) return null;

  const candidates = [
    app?.object,
    app?.document,
    app?.options?.document,
    app?.object?.actor,
    app?.document?.actor
  ];
  return candidates.find((candidate) => candidate?.documentName === "Actor") ?? null;
}

function addActorSheetHeaderButton(app, buttons) {
  const actor = getActorFromSheetApp(app);
  if (!Array.isArray(buttons)) return;
  if (!actor || (!game.user?.isGM && !actor.isOwner)) return;
  if (game.system?.id === "dnd5e") return;
  if (buttons.some((button) => button.class === "vs-combat-overlay-adjust-image")) return;

  buttons.unshift({
    label: "VS",
    class: "vs-combat-overlay-adjust-image",
    icon: "fas fa-crop-alt",
    onclick: () => openImageAdjusterForActor(actor)
  });
}

function addActorSheetHeaderButtonFallback(app, html) {
  const actor = getActorFromSheetApp(app);
  if (!actor || (!game.user?.isGM && !actor.isOwner)) return;

  const root = app.element instanceof Element ? app.element : app.element?.[0] ?? getHtmlRootElement(html) ?? html?.[0]?.closest?.(".app");
  if (isDnd5eActorSheetRoot(root)) {
    addDnd5eActorSheetAdjustButton(app, root, actor);
    return;
  }

  const header = root?.querySelector?.(".window-header");
  if (!header || header.querySelector(".vs-combat-overlay-adjust-image")) return;

  const button = document.createElement("a");
  button.className = "header-button vs-combat-overlay-adjust-image";
  button.title = localize("imageAdjust.title");
  button.innerHTML = `<i class="fas fa-crop-alt"></i> VS`;
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    openImageAdjusterForActor(actor);
  });

  const close = header.querySelector(".close");
  if (close) header.insertBefore(button, close);
  else header.appendChild(button);
}

function isDnd5eActorSheetRoot(root) {
  return game.system?.id === "dnd5e" && (root?.classList?.contains("dnd5e2") || Boolean(root?.querySelector?.(".dnd5e2")));
}

function addDnd5eActorSheetAdjustButton(app, root, actor) {
  if (!root) return;

  root.querySelectorAll(".vs-combat-overlay-adjust-image").forEach((button) => button.remove());
  patchDnd5eHeaderMenu(app, actor);
}

function patchDnd5eHeaderMenu(app, actor) {
  if (app._vsCombatOverlayHeaderMenuPatched || typeof app._getHeaderControlContextEntries !== "function") return;

  const original = app._getHeaderControlContextEntries.bind(app);
  app._getHeaderControlContextEntries = function* vsCombatOverlayHeaderEntries() {
    yield* original();
    yield {
      name: localize("imageAdjust.title"),
      icon: `<i class="fas fa-crop-alt" inert></i>`,
      callback: () => openImageAdjusterForActor(actor)
    };
  };
  app._vsCombatOverlayHeaderMenuPatched = true;
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

function renderVSOverlay(combat, sides = getCombatSides(combat)) {
  const existingRoot = document.getElementById(OVERLAY_ID);
  const shouldAnimate = !existingRoot;
  const previousVisibleState = captureVisibleOverlayState(existingRoot);
  const previousDefeatedState = captureDefeatedOverlayState(existingRoot);
  removeVSOverlay();
  overlayGeneration += 1;
  const generation = overlayGeneration;
  const knownUuids = new Set(previousOverlayUuids);

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
    root.classList.remove("is-entering");
    root.getBoundingClientRect();
    root.classList.add("is-entering");
    root.classList.remove("is-enter-prep");
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
  if (!entries.length) return "";
  return entries.map((entry) => createFighterPanel(entry, side, context)).join("");
}

function createFighterPanel(entry, side, { shouldAnimate = false, knownUuids = new Set(), newUuids = new Set() } = {}) {
  const img = entry.img || FALLBACK_IMG;
  const name = entry.name || localize("common.unknown");
  const imageStyle = getEntryImageStyle(entry, side);
  const isNew = !shouldAnimate && entry.uuid && (newUuids.has(entry.uuid) || !knownUuids.has(entry.uuid));

  return `
    <article class="vs-fighter-slot ${entry.defeated ? "is-defeated" : ""} ${isNew ? "is-pending-new" : ""}" data-side="${side}" data-uuid="${escapeAttr(entry.uuid ?? "")}">
      <div class="vs-fighter-panel" data-img="${escapeAttr(img)}" style="${imageStyle}">
        <div class="vs-fighter-image"></div>
        <div class="vs-fighter-shade"></div>
      </div>
      <div class="vs-fighter-name" title="${escapeAttr(name)}">${escapeHtml(name)}</div>
    </article>
  `;
}

function getEntryImageStyle(entry, side = "left") {
  const fit = normalizeImageFit(entry?.imageFit);
  const sideFlip = side === "right" ? -1 : 1;
  const imageFlip = fit.flip ? -1 : 1;
  return `--fighter-image-x: ${fit.x}%; --fighter-image-y: ${fit.y}%; --fighter-image-zoom: ${fit.zoom}; --fighter-image-flip: ${sideFlip * imageFlip};`;
}

function getFighterCountStyle(entries) {
  const count = entries.length || 0;
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

function getActorFromOverlayDocument(document) {
  return document?.actor ?? (document?.documentName === "Actor" ? document : null);
}

function getAssignedEntry(uuid) {
  const sides = getCombatSides();
  for (const side of ["allies", "enemies"]) {
    const entry = sides[side].find((candidate) => candidate.uuid === uuid);
    if (entry) return { side, entry: normalizeEntryImage(entry) };
  }

  return null;
}

function getDefaultPreviewCount(uuid) {
  const assigned = getAssignedEntry(uuid);
  const entries = assigned ? getCombatSides()[assigned.side] : null;
  const visibleCount = entries?.filter((entry) => !entry.hidden).length ?? 1;
  return clampNumber(visibleCount, 1, 4, 1);
}

function getOverlayPanelPreviewSize(uuid, count = getDefaultPreviewCount(uuid)) {
  const wall = findRenderedWallForEntry(uuid);
  const wallRect = wall?.getBoundingClientRect();
  const panel = findRenderedPanelForEntry(uuid);
  const panelRect = panel?.getBoundingClientRect();
  const normalizedCount = clampNumber(count, 1, 4, 1);
  const slant = getRenderedSlant(wall ?? panel);
  const sidePadding = slant * 0.35;
  const aspectRatio = wallRect?.width > 0 && wallRect?.height > 0
    ? (((wallRect.width - sidePadding) / normalizedCount) + (slant * 2)) / wallRect.height
    : panelRect?.width > 0 && panelRect?.height > 0
      ? panelRect.width / panelRect.height
      : 0.72 / normalizedCount;
  const maxWidth = 344;
  const maxHeight = 430;
  let width = maxWidth;
  let height = width / aspectRatio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  return {
    width: Math.max(128, Math.round(width)),
    height: Math.max(220, Math.round(height))
  };
}

function getRenderedSlant(element) {
  if (!(element instanceof Element)) return 48;
  const value = getComputedStyle(element).getPropertyValue("--tp-slant");
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : 48;
}

function findRenderedWallForEntry(uuid) {
  return findRenderedSlotForEntry(uuid)?.closest(".vs-fighter-wall") ?? null;
}

function findRenderedPanelForEntry(uuid) {
  return findRenderedSlotForEntry(uuid)?.querySelector(".vs-fighter-panel") ?? null;
}

function findRenderedSlotForEntry(uuid) {
  const root = document.getElementById(OVERLAY_ID);
  if (!root || !uuid) return null;

  const directSlot = root.querySelector(`.vs-fighter-slot[data-uuid="${escapeSelector(uuid)}"]`);
  if (directSlot) return directSlot;

  const actor = getActorFromOverlayDocument(findCombatantByUuid(uuid) ?? resolveEntryDocumentSync(uuid));
  if (!actor) return null;

  const sides = getCombatSides();
  for (const side of ["allies", "enemies"]) {
    for (const entry of sides[side]) {
      const entryActor = getActorFromOverlayDocument(findCombatantByUuid(entry.uuid) ?? resolveEntryDocumentSync(entry.uuid));
      if (entryActor?.uuid !== actor.uuid) continue;

      const slot = root.querySelector(`.vs-fighter-slot[data-uuid="${escapeSelector(entry.uuid)}"]`);
      if (slot) return slot;
    }
  }

  return null;
}

function openImageAdjusterForActor(actor) {
  if (!actor || (!game.user?.isGM && !actor.isOwner)) {
    ui.notifications?.warn(localize("imageAdjust.noPermission"));
    return;
  }

  new VSOverlayImageAdjustApp(actor.uuid, { actor }).render(true);
}

async function canConfigureEntryImage(uuid, user = game.user) {
  if (user?.isGM) return true;

  const document = await resolveOverlayEntryDocument(uuid);
  const actor = document?.actor ?? (document?.documentName === "Actor" ? document : null);
  if (!actor) return false;

  if (typeof actor.testUserPermission === "function") return actor.testUserPermission(user, "OWNER");
  return Boolean(actor.isOwner);
}

function getCurrentCombat() {
  const combat = game.combats?.active ?? game.combat ?? getCurrentScene()?.combat ?? null;
  const scene = getCurrentScene();
  if (!combat || !scene) return combat ?? null;

  const combatSceneId = combat.scene?.id ?? combat.sceneId;
  if (combatSceneId && combatSceneId !== scene.id) return null;

  return combat;
}

function isCombatStarted(combat) {
  if (!combat) return false;
  if (combat.started === true) return true;
  if (Number(combat.round) > 0) return true;

  const turn = Number(combat.turn);
  const hasTurn = Number.isInteger(turn) && turn >= 0;
  const hasCombatants = (combat.combatants?.size ?? combat.turns?.length ?? 0) > 0;
  return hasTurn && hasCombatants;
}

function getCurrentScene() {
  return canvas?.scene ?? game.scenes?.current ?? game.scene ?? null;
}

function getSideStorageDocument() {
  return getCurrentCombat() ?? getCurrentScene();
}

function normalizeSides(stored = {}) {
  return {
    allies: Array.isArray(stored.allies) ? stored.allies : [],
    enemies: Array.isArray(stored.enemies) ? stored.enemies : []
  };
}

function getCombatSides(combat = getCurrentCombat()) {
  const combatSides = normalizeSides(foundry.utils.deepClone(combat?.getFlag(MODULE_ID, FLAG_SIDES) ?? {}));
  if (hasConfiguredEntries(combatSides)) return combatSides;

  const sceneSides = foundry.utils.deepClone(getCurrentScene()?.getFlag(MODULE_ID, FLAG_SIDES) ?? {});
  return normalizeSides(sceneSides);
}

async function setCombatSides(sides) {
  const storageDocument = getSideStorageDocument();
  if (!storageDocument) return;

  const normalized = normalizeSides(sides);
  await storageDocument.setFlag(MODULE_ID, FLAG_SIDES, normalized);

  const scene = getCurrentScene();
  if (scene && storageDocument !== scene) await scene.setFlag(MODULE_ID, FLAG_SIDES, normalized);

  broadcastOverlayRefresh(normalized);
  if (!isOverlayRefreshSuppressed()) scheduleOverlayRefresh({ force: true, sides: normalized });
  window.setTimeout(() => {
    if (pendingNewUuids.size) refreshVSOverlay();
  }, 80);
}

function hasConfiguredEntries(sides) {
  return Boolean(sides.allies.length || sides.enemies.length);
}

function getOverlaySignature(sides) {
  return JSON.stringify({
    allies: sides.allies.map((entry) => getEntrySignature(normalizeEntryImage(entry))),
    enemies: sides.enemies.map((entry) => getEntrySignature(normalizeEntryImage(entry)))
  });
}

function getEntrySignature(entry) {
  return {
    uuid: entry.uuid,
    img: entry.img,
    name: entry.name,
    hidden: Boolean(entry.hidden),
    defeated: Boolean(entry.defeated),
    imageFit: normalizeImageFit(entry.imageFit)
  };
}

function broadcastOverlayRefresh(sides = getCombatSides()) {
  if (!game.user.isGM) return;

  game.socket?.emit(`module.${MODULE_ID}`, {
    type: "refresh",
    sides: normalizeSides(sides),
    newUuids: [...pendingNewUuids],
    compactionSides: [...pendingCompactionSides]
  });
}

function handleSocketMessage(message) {
  if (message?.type === "saveImageFit") {
    handleImageFitSaveRequest(message);
    return;
  }

  if (message?.type !== "refresh") return;

  (message.newUuids ?? []).forEach((uuid) => pendingNewUuids.add(uuid));
  (message.compactionSides ?? []).forEach((side) => pendingCompactionSides.add(side));
  scheduleOverlayRefresh({ force: true, sides: message.sides, delay: 50 });
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

function setAssignedEntryDefeated(side, uuid, defeated) {
  const entry = getCombatSides()[side]?.find((candidate) => candidate.uuid === uuid);
  if (entry) entry.defeated = defeated;

  setRenderedDefeatedState(uuid, defeated);
  suppressOverlayRefresh();
  if (defeated) playDefeatedAnimation(uuid);
  else playRecoveryAnimation(uuid);

  persistAssignedEntryState(side, uuid, { defeated }, findCombatantByUuid(uuid));
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

async function persistEntryImageFit(uuid, imageFit) {
  const fit = normalizeImageFit(imageFit);
  const document = await resolveOverlayEntryDocument(uuid);
  const actor = getActorFromOverlayDocument(document);

  if (!actor) {
    ui.notifications?.warn(localize("imageAdjust.noPermission"));
    return false;
  }

  const canSave =
    game.user.isGM ||
    (typeof actor.testUserPermission === "function"
      ? actor.testUserPermission(game.user, "OWNER")
      : actor.isOwner);

  if (canSave) {
    await actor.setFlag(MODULE_ID, FLAG_IMAGE_FIT, fit);
    return true;
  }

  ui.notifications?.warn(localize("imageAdjust.noPermission"));
  return false;
}

async function handleImageFitSaveRequest(message) {
  if (!game.user.isGM || !message?.uuid) return;

  const user = game.users?.get(message.userId);
  if (!(await canConfigureEntryImage(message.uuid, user))) return;

  const document = await resolveOverlayEntryDocument(message.uuid);
  const actor = getActorFromOverlayDocument(document);
  if (!actor) return;

  await actor.setFlag(MODULE_ID, FLAG_IMAGE_FIT, normalizeImageFit(message.imageFit));
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
  if (uuid) {
    try {
      const document = await fromUuid(uuid);
      if (document) return document;
    } catch (error) {
      console.warn(`${MODULE_ID} | Could not resolve dropped UUID`, uuid, error);
    }
  }

  if (data.pack && data.id) {
    const pack = game.packs?.get(data.pack);
    const document = await pack?.getDocument?.(data.id);
    if (document) return document;
  }

  if (data.type === "Actor" && data.id) return game.actors.get(data.id);
  if (data.type === "Combatant" && data.id) return getCurrentCombat()?.combatants.get(data.id);
  if (data.type === "Token" && data.id) return canvas?.scene?.tokens?.get(data.id);

  return null;
}

function getCombatantFromDocument(document) {
  if (document.documentName === "Combatant") return document;
  if (document.combatant) return document.combatant;

  const tokenId = document.documentName === "Token" ? document.id : null;
  const combat = getCurrentCombat();
  if (tokenId) return combat?.combatants.find((combatant) => combatant.tokenId === tokenId || combatant.token?.id === tokenId);

  if (document.documentName === "Actor") {
    return combat?.combatants.find((combatant) => combatant.actor?.uuid === document.uuid);
  }

  return null;
}

function normalizeEntryImage(entry) {
  const combatant = findCombatantByUuid(entry.uuid);
  const document = combatant ?? resolveEntryDocumentSync(entry.uuid);
  if (!document) return entry;
  const actor = combatant?.actor ?? document.actor ?? (document.documentName === "Actor" ? document : null);
  const token = combatant?.token ?? (document.documentName === "Token" ? document : null);

  return {
    ...entry,
    img: getTokenImage({ combatant, token, actor, document }),
    imageFit: normalizeImageFit(actor?.getFlag?.(MODULE_ID, FLAG_IMAGE_FIT) ?? entry.imageFit)
  };
}

function normalizeImageFit(fit = {}) {
  fit = fit ?? {};
  return {
    x: clampNumber(fit.x, 0, 100, 50),
    y: clampNumber(fit.y, 0, 100, 50),
    zoom: clampNumber(fit.zoom, 1, 3, 1),
    flip: Boolean(fit.flip)
  };
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function getTokenImage({ combatant, token, actor, document }) {
  const tokenImage =
    token?.texture?.src ??
    token?.document?.texture?.src ??
    combatant?.token?.texture?.src ??
    combatant?.token?.document?.texture?.src ??
    document?.texture?.src ??
    document?.document?.texture?.src ??
    actor?.prototypeToken?.texture?.src ??
    document?.prototypeToken?.texture?.src ??
    combatant?.img;

  const artworkImage =
    actor?.img ??
    (document?.documentName === "Actor" ? document.img : null) ??
    combatant?.actor?.img ??
    document?.actor?.img;

  if (getImageSourceSetting() === IMAGE_SOURCE_ARTWORK) return artworkImage ?? tokenImage ?? FALLBACK_IMG;

  return tokenImage ?? artworkImage ?? document?.img ?? FALLBACK_IMG;
}

function getImageSourceSetting() {
  try {
    return game.settings.get(MODULE_ID, SETTING_IMAGE_SOURCE);
  } catch (error) {
    return IMAGE_SOURCE_TOKEN;
  }
}

function resolveEntryDocumentSync(uuid) {
  if (!uuid) return null;

  const actorMatch = /^Actor\.([^.]+)$/.exec(uuid);
  if (actorMatch) return game.actors?.get(actorMatch[1]) ?? null;

  const sceneTokenMatch = /^Scene\.([^.]+)\.Token\.([^.]+)$/.exec(uuid);
  if (sceneTokenMatch) return game.scenes?.get(sceneTokenMatch[1])?.tokens?.get(sceneTokenMatch[2]) ?? null;

  const tokenMatch = /^Token\.([^.]+)$/.exec(uuid);
  if (tokenMatch) return getCurrentScene()?.tokens?.get(tokenMatch[1]) ?? null;

  return null;
}

function findCombatantForToken(token) {
  const documentId = token?.document?.id ?? token?.id;
  const combat = getCurrentCombat();
  if (!documentId || !combat) return null;

  return combat.combatants.find((combatant) => {
    const combatantTokenId = combatant.token?.id ?? combatant.token?.document?.id ?? combatant.tokenId;
    return combatantTokenId === documentId;
  });
}

function findCombatantByUuid(uuid) {
  return getCurrentCombat()?.combatants.find((combatant) => {
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

function refreshVSOverlayForScene(scene) {
  const currentScene = getCurrentScene();
  if (scene && currentScene && scene.id !== currentScene.id) return;
  if (isOverlayRefreshSuppressed()) return;
  refreshVSOverlay({ force: true });
}

function isOverlayRefreshSuppressed() {
  return Date.now() < suppressOverlayRefreshUntil;
}

function removeVSOverlay() {
  overlayGeneration += 1;
  lastOverlaySignature = "";
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
    const image = panel.querySelector(".vs-fighter-image");
    if (image) image.style.backgroundImage = `url("${panel.dataset.img}")`;
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
  const rawValues = [
    transfer?.getData("application/json"),
    transfer?.getData("text/plain"),
    transfer?.getData("text/uri-list")
  ].filter(Boolean);

  for (const rawValue of rawValues) {
    const raw = rawValue.trim();
    try {
      return JSON.parse(raw);
    } catch (error) {
      if (/^(Actor|Scene|Compendium)\./.test(raw)) return { uuid: raw };
    }
  }

  if (rawValues.length) console.warn(`${MODULE_ID} | Invalid drop data`, rawValues);
  return null;
}

function getHtmlRootElement(html) {
  if (html instanceof Element) return html;
  if (html?.jquery) return [...html].find((node) => node instanceof Element) ?? null;
  if (html?.[0] instanceof Element) return html[0];
  if (html?.[0]?.[0] instanceof Element) return html[0][0];
  return null;
}

class VSOverlayImageAdjustApp extends Application {
  constructor(uuid, options = {}) {
    super(options);
    this.uuid = uuid;
    this.actor = options.actor ?? getActorFromOverlayDocument(resolveEntryDocumentSync(uuid)) ?? null;
    this.fit = normalizeImageFit(this.actor?.getFlag?.(MODULE_ID, FLAG_IMAGE_FIT) ?? getAssignedEntry(uuid)?.entry?.imageFit);
    this.previewCount = getDefaultPreviewCount(uuid);
    this.previewSize = getOverlayPanelPreviewSize(uuid, this.previewCount);
    this.dragState = null;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "vs-combat-overlay-image-adjust",
      title: localize("imageAdjust.title"),
      classes: ["vs-image-adjust"],
      width: 360,
      height: "auto",
      resizable: false
    });
  }

  async _renderInner() {
    const entry = this.getPreviewEntry();
    const img = entry?.img || FALLBACK_IMG;
    const name = entry?.name || localize("common.unknown");

    return $($.parseHTML(`
      <div class="vs-image-adjust-form">
        <div class="vs-image-adjust-counts">
          ${[1, 2, 3, 4].map((count) => `
            <button type="button" data-count="${count}" class="${count === this.previewCount ? "active" : ""}">${count}</button>
          `).join("")}
        </div>
        <div class="vs-image-adjust-preview-stage">
          <div class="vs-image-adjust-preview" style="--vs-preview-width: ${this.previewSize.width}px; --vs-preview-height: ${this.previewSize.height}px; --fighter-image-x: ${this.fit.x}%; --fighter-image-y: ${this.fit.y}%; --fighter-image-zoom: ${this.fit.zoom}; --fighter-image-flip: ${this.fit.flip ? -1 : 1};">
            <div class="vs-image-adjust-picture" style="background-image: url('${escapeAttr(img)}');"></div>
            <div class="vs-image-adjust-name">${escapeHtml(name)}</div>
          </div>
        </div>
        <label class="vs-image-adjust-zoom">
          <span>${localize("imageAdjust.zoom")}</span>
          <div>
            <button type="button" data-action="zoom-out">-</button>
            <input type="range" name="zoom" min="1" max="3" step="0.01" value="${this.fit.zoom}">
            <button type="button" data-action="zoom-in">+</button>
          </div>
        </label>
        <label class="vs-image-adjust-range">
          <span>${localize("imageAdjust.horizontal")}</span>
          <input type="range" name="x" min="0" max="100" step="1" value="${this.fit.x}">
        </label>
        <label class="vs-image-adjust-range">
          <span>${localize("imageAdjust.vertical")}</span>
          <input type="range" name="y" min="0" max="100" step="1" value="${this.fit.y}">
        </label>
        <button type="button" class="vs-image-adjust-flip ${this.fit.flip ? "active" : ""}" data-action="flip" aria-pressed="${this.fit.flip}">
          <i class="fas fa-arrows-alt-h"></i>
          <span>${localize("imageAdjust.flip")}</span>
        </button>
        <div class="vs-image-adjust-actions">
          <button type="button" data-action="reset">${localize("imageAdjust.reset")}</button>
          <button type="button" data-action="cancel">${localize("imageAdjust.cancel")}</button>
          <button type="button" data-action="save">${localize("imageAdjust.save")}</button>
        </div>
      </div>
    `));
  }

  activateListeners(html) {
    super.activateListeners(html);

    const root = getHtmlRootElement(html);
    const preview = root?.querySelector(".vs-image-adjust-preview");
    this.updatePreview(preview);

    html.find(".vs-image-adjust-counts button").on("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.previewCount = clampNumber(event.currentTarget.dataset.count, 1, 4, 1);
      this.previewSize = getOverlayPanelPreviewSize(this.uuid, this.previewCount);
      html.find(".vs-image-adjust-counts button").removeClass("active");
      event.currentTarget.classList.add("active");
      this.updatePreview(preview);
    });

    html.find("input[name='zoom']").on("input", (event) => {
      this.fit.zoom = clampNumber(event.currentTarget.value, 1, 3, 1);
      this.updatePreview(preview);
    });

    html.find("input[name='x']").on("input", (event) => {
      this.fit.x = clampNumber(event.currentTarget.value, 0, 100, 50);
      this.updatePreview(preview);
    });

    html.find("input[name='y']").on("input", (event) => {
      this.fit.y = clampNumber(event.currentTarget.value, 0, 100, 50);
      this.updatePreview(preview);
    });

    html.find("button[data-action='flip']").on("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.fit.flip = !this.fit.flip;
      event.currentTarget.classList.toggle("active", this.fit.flip);
      event.currentTarget.setAttribute("aria-pressed", String(this.fit.flip));
      this.updatePreview(preview);
    });

    html.find("button[data-action='zoom-out']").on("click", () => this.stepZoom(html, preview, -0.1));
    html.find("button[data-action='zoom-in']").on("click", () => this.stepZoom(html, preview, 0.1));

    preview?.addEventListener("pointerdown", (event) => this.startDrag(event, preview));
    preview?.addEventListener("pointermove", (event) => this.drag(event, preview));
    preview?.addEventListener("pointerup", () => this.endDrag(preview));
    preview?.addEventListener("pointercancel", () => this.endDrag(preview));

    html.find("button[data-action='reset']").on("click", () => {
      this.fit = normalizeImageFit();
      this.syncInputs(root);
      this.updatePreview(preview);
    });

    html.find("button[data-action='cancel']").on("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.close();
    });

    html.find("button[data-action='save']").on("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      try {
        const saved = await persistEntryImageFit(this.uuid, this.fit);
        if (saved) ui.notifications?.info(localize("imageAdjust.saved"));
      } catch (error) {
        console.warn(`${MODULE_ID} | Could not save image fit`, error);
        ui.notifications?.warn(localize("imageAdjust.saveFailed"));
      }
    });
  }

  startDrag(event, preview) {
    event.preventDefault();
    preview.setPointerCapture?.(event.pointerId);
    this.dragState = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: this.fit.x,
      startY: this.fit.y
    };
  }

  drag(event, preview) {
    if (!this.dragState || this.dragState.pointerId !== event.pointerId) return;

    const rect = preview.getBoundingClientRect();
    const deltaX = ((event.clientX - this.dragState.startClientX) / rect.width) * 100;
    const deltaY = ((event.clientY - this.dragState.startClientY) / rect.height) * 100;

    this.fit.x = clampNumber(this.dragState.startX - deltaX, 0, 100, 50);
    this.fit.y = clampNumber(this.dragState.startY - deltaY, 0, 100, 50);
    this.syncInputs(getHtmlRootElement(this.element));
    this.updatePreview(preview);
  }

  endDrag(preview) {
    if (!this.dragState) return;
    preview.releasePointerCapture?.(this.dragState.pointerId);
    this.dragState = null;
  }

  updatePreview(preview) {
    if (!preview) return;
    preview.style.setProperty("--vs-preview-width", `${this.previewSize.width}px`);
    preview.style.setProperty("--vs-preview-height", `${this.previewSize.height}px`);
    preview.style.setProperty("--fighter-image-x", `${this.fit.x}%`);
    preview.style.setProperty("--fighter-image-y", `${this.fit.y}%`);
    preview.style.setProperty("--fighter-image-zoom", String(this.fit.zoom));
    preview.style.setProperty("--fighter-image-flip", this.fit.flip ? "-1" : "1");
  }

  stepZoom(html, preview, delta) {
    this.fit.zoom = clampNumber(this.fit.zoom + delta, 1, 3, 1);
    this.syncInputs(getHtmlRootElement(html));
    this.updatePreview(preview);
  }

  syncInputs(root) {
    if (!root) return;

    const zoom = root.querySelector("input[name='zoom']");
    const x = root.querySelector("input[name='x']");
    const y = root.querySelector("input[name='y']");
    const flip = root.querySelector("button[data-action='flip']");
    if (zoom) zoom.value = this.fit.zoom;
    if (x) x.value = this.fit.x;
    if (y) y.value = this.fit.y;
    if (flip) {
      flip.classList.toggle("active", this.fit.flip);
      flip.setAttribute("aria-pressed", String(this.fit.flip));
    }
  }

  getPreviewEntry() {
    const assigned = getAssignedEntry(this.uuid);
    if (assigned?.entry) return assigned.entry;

    const actor = this.actor ?? resolveEntryDocumentSync(this.uuid);
    if (actor?.documentName !== "Actor") return null;

    return normalizeEntryImage({
      uuid: actor.uuid,
      name: actor.name,
      img: actor.img,
      imageFit: actor.getFlag?.(MODULE_ID, FLAG_IMAGE_FIT)
    });
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
    const rows = entries.map(normalizeEntryImage).map((entry) => `
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
