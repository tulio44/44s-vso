import { getImageFitCssVars, getImageFitStyle, normalizeImageFit } from "./image-fit.js";
import { applyPanelImages } from "./overlay-assets.js";
import { createOverlayAnimations } from "./overlay-animations.js";
import { clampNumber } from "./utils.js";

const MODULE_ID = "44s-vso";
const OVERLAY_ID = "vs-combat-overlay-root";
const FALLBACK_IMG = "icons/svg/mystery-man.svg";
const SETTING_ENABLED = "enabled";
const SETTING_IMAGE_SOURCE = "imageSource";
const SETTING_DISPLAY_MODE = "displayMode";
const SETTING_INTRO_ENTRY_DELAY_MS = "introEntryDelayMs";
const SETTING_INTRO_HOLD_MS = "introHoldMs";
const SETTING_MUSIC_PLAYLIST = "musicPlaylist";
const SETTING_MUSIC_SOUND = "musicSound";
const SETTING_NAME_POSITION = "namePosition";
const IMAGE_SOURCE_TOKEN = "token";
const IMAGE_SOURCE_ARTWORK = "artwork";
const DISPLAY_MODE_PERSISTENT = "persistent";
const DISPLAY_MODE_INTRO = "intro";
const NAME_POSITION_BOTTOM = "bottom";
const NAME_POSITION_TOP = "top";
const DEFAULT_INTRO_ENTRY_DELAY_MS = 144;
const DEFAULT_INTRO_HOLD_MS = 1600;
const INTRO_ENTRY_ANIMATION_MS = 720;
const FLAG_DEFEATED = "defeated";
const FLAG_IMAGE_FIT = "imageFit";
const FLAG_DISPLAY_NAME = "displayName";
const FLAG_NAME_HIDDEN = "nameHidden";
const FLAG_SIDES = "sides";
const LOCALIZATION_FALLBACKS = {
  "pt-BR": {
    "settings.enabled.name": "44's VSO ativo",
    "settings.enabled.hint": "Mostra o 44's VSO durante combates.",
    "settings.imageSource.name": "Imagem dos personagens",
    "settings.imageSource.hint": "Escolhe qual imagem o 44's VSO usa para cada personagem.",
    "settings.imageSource.token": "Token",
    "settings.imageSource.artwork": "Arte do personagem",
    "settings.displayMode.name": "Modo do 44's VSO",
    "settings.displayMode.hint": "Escolhe se o overlay fica na tela ou aparece como introducao curta no inicio do combate.",
    "settings.displayMode.persistent": "Permanencia",
    "settings.displayMode.intro": "Intro de combate",
    "settings.introEntryDelay.name": "Intervalo entre personagens (ms)",
    "settings.introEntryDelay.hint": "Tempo entre a chegada de um personagem e o proximo na intro.",
    "settings.introHold.name": "Tempo da intro em tela (ms)",
    "settings.introHold.hint": "Tempo que o overlay permanece na tela depois que todos os personagens aparecem.",
    "settings.musicPlaylist.name": "Playlist do 44's VSO",
    "settings.musicPlaylist.hint": "Playlist usada quando o overlay aparece.",
    "settings.musicSound.name": "Musica do 44's VSO",
    "settings.musicSound.hint": "Faixa da playlist que toca junto do overlay.",
    "settings.namePosition.name": "Posicao dos nomes",
    "settings.namePosition.hint": "Escolhe onde os nomes aparecem nos portraits.",
    "settings.namePosition.bottom": "Embaixo",
    "settings.namePosition.top": "Em cima",
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
    "config.visible": "Visivel",
    "config.hidden": "Sumiu",
    "config.defeated": "Derrotado",
    "config.entryCount": "{count} no lado",
    "config.moveForward": "Mover para frente",
    "config.moveBackward": "Mover para tras",
    "config.music": "Musica do overlay",
    "config.noMusic": "Sem musica",
    "config.noSound": "Escolha uma faixa",
    "config.finalBlow": "Golpe final",
    "config.finalBlowAttacker": "Vencedor",
    "config.finalBlowLoser": "Perdedor",
    "config.finalBlowPlay": "Tocar cena",
    "config.names": "Nomes",
    "config.namePosition": "Posicao dos nomes",
    "config.namePositionBottom": "Embaixo",
    "config.namePositionTop": "Em cima",
    "config.displayName": "Nome exibido",
    "config.hideName": "Ocultar nome",
    "config.showName": "Mostrar nome",
    "imageAdjust.title": "Ajustar imagem do 44's VSO",
    "imageAdjust.zoom": "Zoom",
    "imageAdjust.horizontal": "Horizontal",
    "imageAdjust.vertical": "Vertical",
    "imageAdjust.flip": "Inverter imagem",
    "imageAdjust.displayName": "Nome exibido",
    "imageAdjust.hideName": "Ocultar nome",
    "imageAdjust.showName": "Mostrar nome",
    "imageAdjust.reset": "Resetar",
    "imageAdjust.save": "Salvar",
    "imageAdjust.cancel": "Cancelar",
    "imageAdjust.noPermission": "Voce nao tem permissao para ajustar essa imagem.",
    "imageAdjust.saved": "Ajuste da imagem salvo.",
    "imageAdjust.saveRequested": "Pedido de ajuste enviado para o mestre.",
    "imageAdjust.saveFailed": "Nao consegui salvar o ajuste da imagem.",
    "config.dropHint": "Arraste fichas, tokens ou combatentes aqui",
    "config.hiddenSuffix": " (oculto)",
    "notifications.dropReadFailed": "Nao consegui ler esse item arrastado para o 44's VSO.",
    "notifications.finalBlowNeedsOverlay": "O overlay precisa estar visivel para tocar o golpe final.",
    "notifications.finalBlowNeedsTargets": "Escolha dois personagens diferentes para o golpe final."
  },
  en: {
    "settings.enabled.name": "44's VSO enabled",
    "settings.enabled.hint": "Shows 44's VSO during combat.",
    "settings.imageSource.name": "Character image",
    "settings.imageSource.hint": "Chooses which image 44's VSO uses for each character.",
    "settings.imageSource.token": "Token",
    "settings.imageSource.artwork": "Character artwork",
    "settings.displayMode.name": "44's VSO mode",
    "settings.displayMode.hint": "Chooses whether the overlay stays on screen or plays as a short combat intro.",
    "settings.displayMode.persistent": "Persistent",
    "settings.displayMode.intro": "Combat intro",
    "settings.introEntryDelay.name": "Character interval (ms)",
    "settings.introEntryDelay.hint": "Time between one character arrival and the next during the intro.",
    "settings.introHold.name": "Intro hold time (ms)",
    "settings.introHold.hint": "Time the overlay stays on screen after every character has appeared.",
    "settings.musicPlaylist.name": "44's VSO playlist",
    "settings.musicPlaylist.hint": "Playlist used when the overlay appears.",
    "settings.musicSound.name": "44's VSO music",
    "settings.musicSound.hint": "Playlist sound that plays with the overlay.",
    "settings.namePosition.name": "Name position",
    "settings.namePosition.hint": "Chooses where names appear on portraits.",
    "settings.namePosition.bottom": "Bottom",
    "settings.namePosition.top": "Top",
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
    "config.visible": "Visible",
    "config.hidden": "Gone",
    "config.defeated": "Defeated",
    "config.entryCount": "{count} on side",
    "config.moveForward": "Move forward",
    "config.moveBackward": "Move backward",
    "config.music": "Overlay music",
    "config.noMusic": "No music",
    "config.noSound": "Choose a sound",
    "config.finalBlow": "Final blow",
    "config.finalBlowAttacker": "Winner",
    "config.finalBlowLoser": "Loser",
    "config.finalBlowPlay": "Play scene",
    "config.names": "Names",
    "config.namePosition": "Name position",
    "config.namePositionBottom": "Bottom",
    "config.namePositionTop": "Top",
    "config.displayName": "Display name",
    "config.hideName": "Hide name",
    "config.showName": "Show name",
    "imageAdjust.title": "Adjust 44's VSO image",
    "imageAdjust.zoom": "Zoom",
    "imageAdjust.horizontal": "Horizontal",
    "imageAdjust.vertical": "Vertical",
    "imageAdjust.flip": "Flip image",
    "imageAdjust.displayName": "Display name",
    "imageAdjust.hideName": "Hide name",
    "imageAdjust.showName": "Show name",
    "imageAdjust.reset": "Reset",
    "imageAdjust.save": "Save",
    "imageAdjust.cancel": "Cancel",
    "imageAdjust.noPermission": "You do not have permission to adjust this image.",
    "imageAdjust.saved": "Image adjustment saved.",
    "imageAdjust.saveRequested": "Image adjustment request sent to the GM.",
    "imageAdjust.saveFailed": "I could not save the image adjustment.",
    "config.dropHint": "Drag actors, tokens, or combatants here",
    "config.hiddenSuffix": " (hidden)",
    "notifications.dropReadFailed": "I could not read that dropped item for 44's VSO.",
    "notifications.finalBlowNeedsOverlay": "The overlay must be visible to play the final blow.",
    "notifications.finalBlowNeedsTargets": "Choose two different characters for the final blow."
  }
};

let configApp;
let previousOverlayUuids = new Set();
let pendingNewUuids = new Set();
let pendingCompactionSides = new Set();
let suppressOverlayRefreshUntil = 0;
let overlayGeneration = 0;
let playedIntroKeys = new Set();
let scheduledIntroExitId = null;
let scheduledOverlayRefreshId = null;
let scheduledOverlayRefreshOptions = {};
let lastOverlaySignature = "";
let tidy5eHeaderControlsRegistered = false;
let overlayMusicState = null;
let finalBlowAudioContext = null;
const {
  cancelSlotAnimations,
  playDefeatedAnimation,
  playOverlayExitAnimation,
  playRecoveryAnimation,
  playSlotExitAnimation,
  scheduleOverlayEnter,
  triggerDefeatedChangeAnimations,
  triggerIntroEntryAnimations,
  triggerNewEntryAnimations,
  triggerRepositionAnimations,
  triggerSideCompactionAnimations
} = createOverlayAnimations({
  overlayId: OVERLAY_ID,
  getOverlayGeneration: () => overlayGeneration,
  getRenderSide,
  escapeSelector
});

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

  game.settings.register(MODULE_ID, SETTING_DISPLAY_MODE, {
    name: localize("settings.displayMode.name"),
    hint: localize("settings.displayMode.hint"),
    scope: "world",
    config: true,
    type: String,
    choices: {
      [DISPLAY_MODE_PERSISTENT]: localize("settings.displayMode.persistent"),
      [DISPLAY_MODE_INTRO]: localize("settings.displayMode.intro")
    },
    default: DISPLAY_MODE_PERSISTENT,
    onChange: () => resetIntroPlayback()
  });

  game.settings.register(MODULE_ID, SETTING_INTRO_ENTRY_DELAY_MS, {
    name: localize("settings.introEntryDelay.name"),
    hint: localize("settings.introEntryDelay.hint"),
    scope: "world",
    config: true,
    type: Number,
    default: DEFAULT_INTRO_ENTRY_DELAY_MS,
    onChange: () => resetIntroPlayback()
  });

  game.settings.register(MODULE_ID, SETTING_INTRO_HOLD_MS, {
    name: localize("settings.introHold.name"),
    hint: localize("settings.introHold.hint"),
    scope: "world",
    config: true,
    type: Number,
    default: DEFAULT_INTRO_HOLD_MS,
    onChange: () => resetIntroPlayback()
  });

  game.settings.register(MODULE_ID, SETTING_MUSIC_PLAYLIST, {
    name: localize("settings.musicPlaylist.name"),
    hint: localize("settings.musicPlaylist.hint"),
    scope: "world",
    config: false,
    type: String,
    default: "",
    onChange: () => {
      configApp?.render(false);
      if (document.getElementById(OVERLAY_ID)) restartOverlayMusic();
    }
  });

  game.settings.register(MODULE_ID, SETTING_MUSIC_SOUND, {
    name: localize("settings.musicSound.name"),
    hint: localize("settings.musicSound.hint"),
    scope: "world",
    config: false,
    type: String,
    default: "",
    onChange: () => {
      configApp?.render(false);
      if (document.getElementById(OVERLAY_ID)) restartOverlayMusic();
    }
  });

  game.settings.register(MODULE_ID, SETTING_NAME_POSITION, {
    name: localize("settings.namePosition.name"),
    hint: localize("settings.namePosition.hint"),
    scope: "world",
    config: true,
    type: String,
    choices: {
      [NAME_POSITION_BOTTOM]: localize("settings.namePosition.bottom"),
      [NAME_POSITION_TOP]: localize("settings.namePosition.top")
    },
    default: NAME_POSITION_BOTTOM,
    onChange: () => {
      lastOverlaySignature = "";
      refreshVSOverlay({ force: true });
      configApp?.render(false);
    }
  });
});

Hooks.once("ready", () => {
  game.socket?.on(`module.${MODULE_ID}`, handleSocketMessage);
  registerTidy5eHeaderControls(game.modules?.get?.("tidy5e-sheet")?.api);
  refreshVSOverlay();
});

Hooks.once("tidy5e-sheet.ready", registerTidy5eHeaderControls);

Hooks.on("combatStart", refreshVSOverlay);
Hooks.on("deleteCombat", () => {
  removeVSOverlay({ stopMusic: true });
  previousOverlayUuids = new Set();
  pendingNewUuids = new Set();
  pendingCompactionSides = new Set();
  playedIntroKeys = new Set();
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
Hooks.on("renderActorSheetV2", addActorSheetHeaderButtonFallback);
Hooks.on("renderApplicationV2", addActorSheetHeaderButtonFallback);
Hooks.on("tidy5e-sheet.renderActorSheet", addActorSheetHeaderButtonFallback);
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
  const introMode = isIntroMode();
  const introKey = introMode ? getIntroKey(combat, sides) : "";

  if (!isOverlayEnabled() || !shouldRenderOverlay(combat, sides)) {
    removeVSOverlay({ stopMusic: true });
    previousOverlayUuids = new Set();
    pendingNewUuids = new Set();
    pendingCompactionSides = new Set();
    lastOverlaySignature = "";
    return;
  }

  if (introMode && !document.getElementById(OVERLAY_ID) && introKey && playedIntroKeys.has(introKey)) {
    configApp?.render(false);
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
    removeVSOverlay({ stopMusic: true });
  }
  configApp?.render(false);
}

function isOverlayEnabled() {
  return game.settings.get(MODULE_ID, SETTING_ENABLED);
}

function shouldRenderOverlay(combat, sides) {
  if (!hasConfiguredEntries(sides)) return false;
  if (isIntroMode()) return isCombatStarted(combat);
  if (isCombatStarted(combat)) return true;

  return Boolean(getCurrentScene());
}

function isIntroMode() {
  return game.settings.get(MODULE_ID, SETTING_DISPLAY_MODE) === DISPLAY_MODE_INTRO;
}

function resetIntroPlayback() {
  playedIntroKeys = new Set();
  removeVSOverlay({ stopMusic: true });
  refreshVSOverlay({ force: true });
  configApp?.render(false);
}

function getIntroEntryDelayMs() {
  return Math.round(clampNumber(game.settings.get(MODULE_ID, SETTING_INTRO_ENTRY_DELAY_MS), 0, 5000, DEFAULT_INTRO_ENTRY_DELAY_MS));
}

function getIntroHoldMs() {
  return Math.round(clampNumber(game.settings.get(MODULE_ID, SETTING_INTRO_HOLD_MS), 0, 30000, DEFAULT_INTRO_HOLD_MS));
}

function getIntroKey(combat, sides) {
  const combatKey = combat?.uuid ?? combat?.id ?? "";
  if (combatKey) return combatKey;
  return getOverlaySignature(sides);
}

function scheduleIntroOverlayExit(generation, introStepCount) {
  if (scheduledIntroExitId) window.clearTimeout(scheduledIntroExitId);

  const visibleCount = Math.max(1, Number(introStepCount) || 1);
  const delay = INTRO_ENTRY_ANIMATION_MS + ((visibleCount - 1) * getIntroEntryDelayMs()) + getIntroHoldMs();
  scheduledIntroExitId = window.setTimeout(async () => {
    scheduledIntroExitId = null;
    if (generation !== overlayGeneration || !document.getElementById(OVERLAY_ID)) return;

    playOverlayExitSound();
    await playOverlayExitAnimation();
    if (generation !== overlayGeneration) return;

    removeVSOverlay({ stopMusic: true });
    if (game.user?.isGM && isOverlayEnabled()) await game.settings.set(MODULE_ID, SETTING_ENABLED, false);
  }, delay);
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
    if (isIntroMode()) playedIntroKeys.delete(getIntroKey(getCurrentCombat(), getCombatSides()));
    refreshVSOverlay();
    return;
  }

  const generation = overlayGeneration;
  playOverlayExitSound();
  await playOverlayExitAnimation();

  if (generation === overlayGeneration && !isOverlayEnabled()) {
    removeVSOverlay({ stopMusic: true });
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
  return /ActorSheet|Tidy5e/i.test(appName);
}

function getActorFromSheetApp(app) {
  if (!isActorSheetApp(app)) return null;

  const candidates = [
    app?.actor,
    app?.object,
    app?.document,
    app?.options?.actor,
    app?.options?.document,
    app?.object?.actor,
    app?.document?.actor
  ];
  return candidates.find((candidate) => candidate?.documentName === "Actor") ?? null;
}

function registerTidy5eHeaderControls(api) {
  if (game.system?.id !== "dnd5e" || !api || tidy5eHeaderControlsRegistered) return;
  if (typeof api.registerActorHeaderControls !== "function") return;

  api.registerActorHeaderControls({
    position: "menu",
    controls: [
      {
        icon: "fas fa-crop-alt",
        label: localize("imageAdjust.title"),
        position: "menu",
        ownership: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,
        visible() {
          return Boolean(this.document && (game.user?.isGM || this.document.isOwner));
        },
        async onClickAction() {
          if (this.document) openImageAdjusterForActor(this.document);
        }
      }
    ]
  });

  tidy5eHeaderControlsRegistered = true;
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
  if (isTidy5eActorSheet(app, root)) {
    registerTidy5eHeaderControls(game.modules?.get?.("tidy5e-sheet")?.api);
    root?.querySelectorAll?.(".vs-combat-overlay-adjust-image").forEach((button) => button.remove());
    return;
  }

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

function isTidy5eActorSheet(app, root) {
  if (game.system?.id !== "dnd5e") return false;

  const api = game.modules?.get?.("tidy5e-sheet")?.api;
  if (typeof api?.isTidy5eSheet === "function" && api.isTidy5eSheet(app)) return true;

  const appName = app?.constructor?.name ?? "";
  return /Tidy5e/i.test(appName) || root?.classList?.contains("tidy5e-sheet") || Boolean(root?.querySelector?.(".tidy5e-sheet"));
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
  if (nextDefeated) {
    playDefeatedSound();
    playDefeatedAnimation(combatant.uuid);
  } else {
    playRecoverySound();
    playRecoveryAnimation(combatant.uuid);
  }

  persistDefeatedState(combatant.uuid, nextDefeated, combatant);
}

function renderVSOverlay(combat, sides = getCombatSides(combat)) {
  const existingRoot = document.getElementById(OVERLAY_ID);
  const shouldAnimate = !existingRoot;
  const introMode = isIntroMode();
  const previousVisibleState = captureVisibleOverlayState(existingRoot);
  const previousDefeatedState = captureDefeatedOverlayState(existingRoot);
  const previousLayout = captureOverlayLayout(existingRoot);
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
  const introDelays = introMode && shouldAnimate ? createIntroDelayMap(allies, enemies) : new Map();
  const introStepCount = introDelays.size;

  const root = document.createElement("section");
  root.id = OVERLAY_ID;
  root.classList.toggle("is-enter-prep", shouldAnimate);
  root.classList.toggle("is-intro-mode", introMode && shouldAnimate);
  root.classList.toggle("has-names-top", getNamePositionSetting() === NAME_POSITION_TOP);
  root.classList.toggle("has-names-bottom", getNamePositionSetting() !== NAME_POSITION_TOP);
  if (introMode && shouldAnimate) {
    const introTotalMs = INTRO_ENTRY_ANIMATION_MS + Math.max(0, introStepCount - 1) * getIntroEntryDelayMs();
    root.style.setProperty("--vs-intro-enter-total-ms", `${introTotalMs}ms`);
  }

  root.innerHTML = `
    <div class="vs-overlay-vignette"></div>
    <div class="vs-overlay-fx">
      <div class="vs-impact-burst"></div>
    </div>
    <div class="vs-overlay-frame" aria-hidden="true">
      <div class="vs-fighter-wall vs-fighter-wall-left ${!allies.length ? "is-empty" : ""}" style="${getFighterCountStyle(allies)}">
        ${createFighterColumns(allies, "left", { shouldAnimate, knownUuids, newUuids, introDelays })}
      </div>

      <div class="vs-fighter-wall vs-fighter-wall-right ${!enemies.length ? "is-empty" : ""}" style="${getFighterCountStyle(enemies)}">
        ${createFighterColumns(enemies, "right", { shouldAnimate, knownUuids, newUuids, introDelays })}
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
  if (shouldAnimate) {
    startOverlayMusic();
    playOverlayEnterSound(allies.length + enemies.length);
  }
  scheduleOverlayEnter(root, generation, shouldAnimate);
  if (introMode && shouldAnimate) {
    playedIntroKeys.add(getIntroKey(combat, sides));
    scheduleIntroOverlayExit(generation, introStepCount);
    playIntroEntrySounds(introDelays, generation);
  }
  if (!shouldAnimate && compactionSides.size) playCompactionSound(compactionSides.size);
  if (!shouldAnimate && hasRepositionCandidate(root, previousLayout, newUuids, compactionSides)) playRepositionSound(previousLayout.size);
  triggerSideCompactionAnimations(root, compactionSides, newUuids, generation, shouldAnimate);
  triggerRepositionAnimations(root, previousLayout, newUuids, compactionSides, generation, shouldAnimate);
  if (introMode && shouldAnimate) triggerIntroEntryAnimations(root, introDelays, generation);
  else {
    triggerNewEntryAnimations(root, newUuids, generation);
    if (!shouldAnimate) playNewEntrySounds(newUuids, generation);
  }
  if (!shouldAnimate) playDefeatedChangeSounds(previousDefeatedState, currentDefeatedState, newUuids);
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

function captureOverlayLayout(root) {
  const layout = new Map();
  if (!root) return layout;

  root.querySelectorAll(".vs-fighter-slot[data-uuid]").forEach((slot) => {
    const uuid = slot.dataset.uuid;
    if (!uuid) return;
    const rect = slot.getBoundingClientRect();
    layout.set(uuid, {
      side: slot.dataset.side,
      left: rect.left,
      top: rect.top
    });
  });

  return layout;
}

function hasRepositionCandidate(root, previousLayout, newUuids = new Set(), compactionSides = new Set()) {
  if (!root || !previousLayout?.size) return false;

  const compactingSides = new Set([...compactionSides].map(getRenderSide));
  return [...root.querySelectorAll(".vs-fighter-slot[data-uuid]")].some((slot) => {
    const uuid = slot.dataset.uuid;
    if (!uuid || newUuids.has(uuid)) return false;

    const previous = previousLayout.get(uuid);
    if (!previous) return false;

    const currentSide = getRenderSide(slot.dataset.side);
    if (getRenderSide(previous.side) !== currentSide || compactingSides.has(currentSide)) return false;

    const current = slot.getBoundingClientRect();
    return Math.abs(previous.left - current.left) >= 1 || Math.abs(previous.top - current.top) >= 1;
  });
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

function getRenderSide(side) {
  if (side === "allies") return "left";
  if (side === "enemies") return "right";
  return side;
}

function createIntroDelayMap(allies, enemies) {
  const delays = new Map();
  const entryDelay = getIntroEntryDelayMs();
  let step = 0;
  const rightToLeftEnemies = [...enemies].reverse();
  const maxLength = Math.max(allies.length, rightToLeftEnemies.length);

  for (let index = 0; index < maxLength; index += 1) {
    const pair = [allies[index], rightToLeftEnemies[index]];
    pair.forEach((entry) => {
      if (!entry?.uuid) return;
      delays.set(entry.uuid, step * entryDelay);
      step += 1;
    });
  }

  return delays;
}

function createFighterColumns(entries, side, context = {}) {
  if (!entries.length) return "";
  return entries.map((entry) => createFighterPanel(entry, side, context)).join("");
}

function createFighterPanel(entry, side, { shouldAnimate = false, knownUuids = new Set(), newUuids = new Set() } = {}) {
  const img = entry.img || FALLBACK_IMG;
  const name = getEntryDisplayName(entry);
  const nameMarkup = entry.nameHidden
    ? ""
    : `<div class="vs-fighter-name" title="${escapeAttr(name)}">${escapeHtml(name)}</div>`;
  const imageStyle = getEntryImageStyle(entry, side);
  const isNew = !shouldAnimate && entry.uuid && (newUuids.has(entry.uuid) || !knownUuids.has(entry.uuid));

  return `
    <article class="vs-fighter-slot ${entry.defeated ? "is-defeated" : ""} ${isNew ? "is-pending-new" : ""}" data-side="${side}" data-uuid="${escapeAttr(entry.uuid ?? "")}">
      <div class="vs-fighter-panel" data-img="${escapeAttr(img)}" style="${imageStyle}">
        <div class="vs-fighter-image"></div>
        <div class="vs-fighter-shade"></div>
        ${nameMarkup}
      </div>
    </article>
  `;
}

function getEntryImageStyle(entry, side = "left") {
  const fit = normalizeImageFit(entry?.imageFit);
  const sideFlip = side === "right" ? -1 : 1;
  const imageFlip = fit.flip ? -1 : 1;
  return getImageFitStyle(fit, sideFlip * imageFlip);
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
    namePosition: getNamePositionSetting(),
    allies: sides.allies.map((entry) => getEntrySignature(normalizeEntryImage(entry))),
    enemies: sides.enemies.map((entry) => getEntrySignature(normalizeEntryImage(entry)))
  });
}

function getEntrySignature(entry) {
  return {
    uuid: entry.uuid,
    img: entry.img,
    name: entry.name,
    displayName: entry.displayName ?? "",
    nameHidden: Boolean(entry.nameHidden),
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
  if (sourceSide === targetSide && uuid === beforeUuid) return;

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

async function moveAssignedEntryByOffset(side, uuid, offset) {
  const sides = getCombatSides();
  const entries = sides[side];
  if (!Array.isArray(entries)) return false;

  const index = entries.findIndex((entry) => entry.uuid === uuid);
  const targetIndex = index + offset;
  if (index < 0 || targetIndex < 0 || targetIndex >= entries.length) return false;

  const [entry] = entries.splice(index, 1);
  entries.splice(targetIndex, 0, entry);
  await setCombatSides(sides);
  return true;
}

function getConfigDisplayEntries(side, entries) {
  return side === "allies" ? [...entries].reverse() : entries;
}

function getConfigMoveOffset(side, direction) {
  const forwardOffset = side === "allies" ? 1 : -1;
  return direction === "forward" ? forwardOffset : -forwardOffset;
}

function canMoveEntryByOffset(entries, index, offset) {
  const targetIndex = index + offset;
  return index >= 0 && targetIndex >= 0 && targetIndex < entries.length;
}

function getFinalBlowOptions(sides = getCombatSides()) {
  return ["allies", "enemies"].flatMap((side) => {
    const sideLabel = localize(side === "allies" ? "config.allies" : "config.enemies");
    return sides[side]
      .filter((entry) => !entry.hidden)
      .map(normalizeEntryImage)
      .map((entry) => ({
        uuid: entry.uuid,
        label: `${sideLabel}: ${getEntryDisplayName(entry)}`
      }));
  }).filter((entry) => entry.uuid);
}

async function playFinalBlowScene(attackerUuid, loserUuid) {
  if (!attackerUuid || !loserUuid || attackerUuid === loserUuid) {
    ui.notifications?.warn(localize("notifications.finalBlowNeedsTargets"));
    return;
  }

  const root = document.getElementById(OVERLAY_ID);
  if (!root) {
    ui.notifications?.warn(localize("notifications.finalBlowNeedsOverlay"));
    return;
  }

  root.querySelector(".vs-final-blow-scene")?.remove();
  const attackerSlot = root.querySelector(`.vs-fighter-slot[data-uuid="${escapeSelector(attackerUuid)}"]`);
  const loserSlot = root.querySelector(`.vs-fighter-slot[data-uuid="${escapeSelector(loserUuid)}"]`);
  if (!attackerSlot || !loserSlot) {
    ui.notifications?.warn(localize("notifications.finalBlowNeedsOverlay"));
    return;
  }

  const attackerSide = getRenderSide(attackerSlot.dataset.side);
  const loserSide = getRenderSide(loserSlot.dataset.side);
  const attackerEntry = getAssignedEntry(attackerUuid)?.entry;
  const loserAssigned = getAssignedEntry(loserUuid);
  const loserEntry = loserAssigned?.entry;
  const attackerOnRight = attackerSide === "right";
  const rootRect = root.getBoundingClientRect();
  const attackerStartBox = getFinalBlowStartBox(attackerSlot, rootRect);
  const loserStartBox = getFinalBlowStartBox(loserSlot, rootRect);
  const attackerStart = getFinalBlowStartStyle(attackerStartBox);
  const loserStart = getFinalBlowStartStyle(loserStartBox);

  const scene = document.createElement("div");
  scene.className = `vs-final-blow-scene is-waapi ${attackerOnRight ? "is-attacker-right" : "is-attacker-left"}`;
  scene.innerHTML = `
    <div class="vs-final-blow-shutter"></div>
    <div class="vs-final-blow-aura"></div>
    <div class="vs-final-blow-speedlines"></div>
    <div class="vs-final-blow-slash"></div>
    <div class="vs-final-blow-spark"></div>
    <div class="vs-final-blow-wind"></div>
    <div class="vs-final-blow-impact-frame"></div>
    <div class="vs-final-blow-fighter vs-final-blow-attacker" data-side="${attackerSide}" style="${attackerStart}">
      ${createFinalBlowCard(attackerSlot, attackerEntry)}
    </div>
    <div class="vs-final-blow-fighter vs-final-blow-loser" data-side="${loserSide}" style="${loserStart}">
      ${createFinalBlowCard(loserSlot, loserEntry)}
    </div>
  `;

  attackerSlot.classList.add("is-final-blow-source");
  loserSlot.classList.add("is-final-blow-source");
  root.appendChild(scene);
  applyPanelImages(scene);

  await waitForMs(40);
  scene.classList.add("is-entering");
  await runFinalBlowStoryboardCinematic(scene, {
    attackerStart: attackerStartBox,
    loserStart: loserStartBox,
    attackerOnRight,
    rootRect
  });

  attackerSlot.classList.remove("is-final-blow-source");
  loserSlot.classList.remove("is-final-blow-source");
  loserSlot.classList.add("is-defeated");
  scene.remove();

  if (loserAssigned?.side) {
    await persistAssignedEntryState(loserAssigned.side, loserUuid, { defeated: true }, findCombatantByUuid(loserUuid));
  }
}

function getFinalBlowStartBox(slot, rootRect) {
  const rect = slot.getBoundingClientRect();
  return {
    left: rect.left - rootRect.left,
    top: rect.top - rootRect.top,
    width: rect.width,
    height: rect.height
  };
}

function getFinalBlowStartStyle(box) {
  return [
    `--final-start-left: ${box.left}px`,
    `--final-start-top: ${box.top}px`,
    `--final-start-width: ${box.width}px`,
    `--final-start-height: ${box.height}px`
  ].join("; ");
}

async function runFinalBlowCinematic(scene, { attackerStart, loserStart, attackerOnRight, rootRect }) {
  const attacker = scene.querySelector(".vs-final-blow-attacker");
  const loser = scene.querySelector(".vs-final-blow-loser");
  const speedlines = scene.querySelector(".vs-final-blow-speedlines");
  const wind = scene.querySelector(".vs-final-blow-wind");
  const impact = scene.querySelector(".vs-final-blow-impact-frame");
  const aura = scene.querySelector(".vs-final-blow-aura");
  const slash = scene.querySelector(".vs-final-blow-slash");
  const spark = scene.querySelector(".vs-final-blow-spark");
  const loserPanel = loser?.querySelector(".vs-fighter-panel");
  if (!attacker || !loser) return;

  const focusWidth = clampNumber(rootRect.width * 0.3, 260, 480, 420);
  const focusHeight = clampNumber(rootRect.height * 0.68, 390, 720, 620);
  const margin = clampNumber(rootRect.width * 0.065, 34, 120, 80);
  const focusTop = (rootRect.height - focusHeight) / 2;
  const leftFocus = { left: margin, top: focusTop, width: focusWidth, height: focusHeight };
  const rightFocus = { left: rootRect.width - margin - focusWidth, top: focusTop, width: focusWidth, height: focusHeight };
  const attackerFocus = attackerOnRight ? rightFocus : leftFocus;
  const loserFocus = attackerOnRight ? leftFocus : rightFocus;
  const direction = attackerOnRight ? -1 : 1;

  setFinalBlowBox(attacker, attackerStart);
  setFinalBlowBox(loser, loserStart);
  attacker.style.opacity = "1";
  loser.style.opacity = "1";
  playFinalBlowChargeSound();

  await Promise.all([
    animateFinalBlowBox(attacker, attackerStart, attackerFocus, {
      duration: 560,
      easing: "cubic-bezier(0.16, 1, 0.3, 1)"
    }),
    animateFinalBlowBox(loser, loserStart, loserFocus, {
      duration: 560,
      easing: "cubic-bezier(0.16, 1, 0.3, 1)"
    }),
    animateFinalBlowFx(aura, [
      { opacity: 0, transform: "scale(0.92)" },
      { opacity: 1, transform: "scale(1)", offset: 0.5 },
      { opacity: 0.72, transform: "scale(1.035)" }
    ], { duration: 620, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }),
    animateFinalBlowFx(scene.querySelector(".vs-final-blow-shutter"), [
      { opacity: 0 },
      { opacity: 1 }
    ], { duration: 280, easing: "ease-out" })
  ]);

  await waitForMs(160);
  playFinalBlowDrawSound();

  await Promise.all([
    animateFinalBlowFx(attacker, [
      { transform: "translate(0, 0) scale(1)", filter: "brightness(1.12) contrast(1.1)" },
      { transform: `translate(${direction * -34}px, 0) scale(0.985) skewX(${direction * 2}deg)`, filter: "brightness(0.86) contrast(1.24) saturate(0.86)", offset: 0.62 },
      { transform: "translate(0, 0) scale(1.018)", filter: "brightness(1.35) contrast(1.18)" }
    ], { duration: 210, easing: "cubic-bezier(0.34, 0, 0.22, 1)" }),
    animateFinalBlowFx(loser, [
      { transform: "translate(0, 0) scale(1)", filter: "brightness(1.06) contrast(1.08)" },
      { transform: `translate(${direction * 20}px, 0) scale(1.01)`, filter: "brightness(1.2) contrast(1.14)" },
      { transform: "translate(0, 0) scale(1)", filter: "brightness(1.06) contrast(1.08)" }
    ], { duration: 210, easing: "cubic-bezier(0.34, 0, 0.22, 1)" }),
    animateFinalBlowFx(aura, [
      { opacity: 0.72, filter: "brightness(1)" },
      { opacity: 1, filter: "brightness(1.7)", offset: 0.48 },
      { opacity: 0.62, filter: "brightness(1.1)" }
    ], { duration: 210, easing: "steps(2, end)" })
  ]);

  playFinalBlowSlashSound();
  await Promise.all([
    animateFinalBlowFx(attacker, [
      { transform: "translate(0, 0) scale(1)", filter: "brightness(1.08) contrast(1.08)" },
      { transform: `translate(${direction * 430}px, 0) scale(1.12) skewX(${direction * -7}deg)`, filter: "brightness(2.25) contrast(1.48) saturate(1.28)", offset: 0.52 },
      { transform: `translate(${direction * 250}px, 0) scale(1.035)`, filter: "brightness(1.2) contrast(1.18)" }
    ], { duration: 280, easing: "cubic-bezier(0.6, 0, 0.22, 1)" }),
    animateFinalBlowFx(loser, [
      { transform: "translate(0, 0) scale(1)", filter: "brightness(1.08) contrast(1.08)" },
      { transform: `translate(${direction * -390}px, 0) scale(1.09) skewX(${direction * 6}deg)`, filter: "brightness(1.84) contrast(1.34) saturate(1.18)", offset: 0.52 },
      { transform: `translate(${direction * -170}px, 0) rotate(${direction * 1.2}deg) scale(0.99)`, filter: "brightness(0.62) grayscale(0.54) contrast(1.3)" }
    ], { duration: 310, easing: "cubic-bezier(0.6, 0, 0.22, 1)" }),
    animateFinalBlowFx(speedlines, getFinalBlowLineFrames(direction), { duration: 360, easing: "ease-out" }),
    animateFinalBlowFx(slash, getFinalBlowSlashFrames(direction), { duration: 330, easing: "cubic-bezier(0.18, 0.8, 0.22, 1)" }),
    animateFinalBlowFx(spark, getFinalBlowSparkFrames(direction), { duration: 440, easing: "cubic-bezier(0.16, 1, 0.3, 1)" })
  ]);

  playFinalBlowImpactSound(0.56);
  await playFinalBlowImpact(scene, impact, wind, "#ffffff", "contrast(2.5) saturate(0)", direction, 16);
  playFinalBlowImpactSound(0.72);
  await playFinalBlowImpact(scene, impact, wind, "#050505", "contrast(3) invert(1) saturate(0)", direction, 22);
  playFinalBlowImpactSound(0.92);
  await playFinalBlowImpact(scene, impact, wind, "linear-gradient(90deg, #050505, #ffffff, #ff5752, #050505)", "contrast(3) saturate(1.8)", direction, 30);

  playFinalBlowGlassSound();
  await Promise.all([
    animateFinalBlowFx(loserPanel, [
      { filter: "brightness(0.72) grayscale(0.55) contrast(1.18)" },
      { filter: "brightness(1.5) grayscale(0.25) contrast(1.5)", offset: 0.24 },
      { filter: "brightness(0.48) grayscale(1) contrast(1.35)" }
    ], { duration: 760, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }),
    animateFinalBlowFx(cracks, [
      { opacity: 0, transform: "scale(0.7)" },
      { opacity: 1, transform: "scale(1.04)", offset: 0.35 },
      { opacity: 0.96, transform: "scale(1)" }
    ], { duration: 760, easing: "steps(4, end)" }),
    animateFinalBlowFx(glass, [
      { opacity: 0, transform: "scale(0.5) rotate(0deg)" },
      { opacity: 0.98, transform: "scale(1.08) rotate(1deg)", offset: 0.35 },
      { opacity: 0.68, transform: "scale(1.18) rotate(-1deg)" }
    ], { duration: 760, easing: "steps(3, end)" }),
    animateFinalBlowFx(aura, [
      { opacity: 0.62, transform: "scale(1.035)", filter: "brightness(1)" },
      { opacity: 1, transform: "scale(1.08)", filter: "brightness(1.8)", offset: 0.18 },
      { opacity: 0, transform: "scale(1.16)", filter: "brightness(1.2)" }
    ], { duration: 760, easing: "cubic-bezier(0.16, 1, 0.3, 1)" })
  ]);

  await waitForMs(170);

  await Promise.all([
    animateFinalBlowBox(attacker, attackerFocus, attackerStart, {
      duration: 440,
      easing: "cubic-bezier(0.72, 0, 0.84, 0)",
      fromTransform: `translate(${direction * 230}px, 0) scale(1.025)`,
      toTransform: "translate(0, 0) scale(1)",
      fadeOut: true
    }),
    animateFinalBlowBox(loser, loserFocus, loserStart, {
      duration: 440,
      easing: "cubic-bezier(0.72, 0, 0.84, 0)",
      fromTransform: `translate(${direction * -150}px, 0) rotate(${direction * 0.8}deg) scale(0.995)`,
      toTransform: "translate(0, 0) scale(1)",
      fadeOut: true
    })
  ]);
}

async function runFinalBlowStoryboardCinematic(scene, { attackerStart, loserStart, attackerOnRight, rootRect }) {
  const attacker = scene.querySelector(".vs-final-blow-attacker");
  const loser = scene.querySelector(".vs-final-blow-loser");
  const speedlines = scene.querySelector(".vs-final-blow-speedlines");
  const wind = scene.querySelector(".vs-final-blow-wind");
  const glass = scene.querySelector(".vs-final-blow-glass");
  const impact = scene.querySelector(".vs-final-blow-impact-frame");
  const aura = scene.querySelector(".vs-final-blow-aura");
  const slash = scene.querySelector(".vs-final-blow-slash");
  const spark = scene.querySelector(".vs-final-blow-spark");
  const cracks = scene.querySelector(".vs-final-blow-cracks");
  const loserPanel = loser?.querySelector(".vs-fighter-panel");
  const shutter = scene.querySelector(".vs-final-blow-shutter");
  if (!attacker || !loser) return;

  const direction = attackerOnRight ? -1 : 1;
  const focusWidth = clampNumber(rootRect.width * 0.25, 230, 420, 360);
  const focusHeight = clampNumber(rootRect.height * 0.68, 390, 720, 620);
  const margin = clampNumber(rootRect.width * 0.055, 30, 100, 72);
  const clashGap = clampNumber(rootRect.width * 0.028, 26, 62, 42);
  const drift = clampNumber(rootRect.width * 0.06, 52, 130, 92);
  const focusTop = (rootRect.height - focusHeight) / 2;
  const centerX = rootRect.width / 2;
  const leftFocus = { left: margin, top: focusTop, width: focusWidth, height: focusHeight };
  const rightFocus = { left: rootRect.width - margin - focusWidth, top: focusTop, width: focusWidth, height: focusHeight };
  const leftClash = { left: centerX - clashGap / 2 - focusWidth, top: focusTop, width: focusWidth, height: focusHeight };
  const rightClash = { left: centerX + clashGap / 2, top: focusTop, width: focusWidth, height: focusHeight };
  const attackerFocus = attackerOnRight ? rightFocus : leftFocus;
  const loserFocus = attackerOnRight ? leftFocus : rightFocus;
  const attackerClash = attackerOnRight ? rightClash : leftClash;
  const loserClash = attackerOnRight ? leftClash : rightClash;
  const attackerAfterHit = attackerOnRight
    ? { ...rightFocus, left: rightFocus.left + drift * 0.35 }
    : { ...leftFocus, left: leftFocus.left - drift * 0.35 };
  const loserAfterHit = attackerOnRight
    ? { ...leftFocus, left: leftFocus.left - drift, width: focusWidth * 0.86 }
    : { ...rightFocus, left: rightFocus.left + drift, width: focusWidth * 0.86 };

  setFinalBlowBox(attacker, attackerStart);
  setFinalBlowBox(loser, loserStart);
  attacker.style.opacity = "1";
  loser.style.opacity = "1";
  playFinalBlowChargeSound();

  await Promise.all([
    animateFinalBlowBox(attacker, attackerStart, attackerFocus, {
      duration: 520,
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
      toTransform: `rotate(${direction * -1.2}deg) scale(1)`
    }),
    animateFinalBlowBox(loser, loserStart, loserFocus, {
      duration: 520,
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
      toTransform: `rotate(${direction * 1.2}deg) scale(1)`
    }),
    animateFinalBlowFx(aura, [
      { opacity: 0, transform: "scale(0.88)", filter: "brightness(0.8)" },
      { opacity: 0.9, transform: "scale(1.02)", filter: "brightness(1.6)", offset: 0.62 },
      { opacity: 0.62, transform: "scale(1)", filter: "brightness(1.08)" }
    ], { duration: 600, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }),
    animateFinalBlowFx(shutter, [
      { opacity: 0 },
      { opacity: 1 }
    ], { duration: 260, easing: "ease-out" })
  ]);

  await waitForMs(80);
  playFinalBlowDrawSound();

  await Promise.all([
    animateFinalBlowBox(attacker, attackerFocus, attackerClash, {
      duration: 360,
      easing: "cubic-bezier(0.18, 0.8, 0.22, 1)",
      fromTransform: `translate(${direction * -18}px, 0) rotate(${direction * -1.4}deg) scale(0.985)`,
      toTransform: `translate(${direction * 8}px, 0) rotate(${direction * 1.1}deg) scale(1.028)`
    }),
    animateFinalBlowBox(loser, loserFocus, loserClash, {
      duration: 360,
      easing: "cubic-bezier(0.18, 0.8, 0.22, 1)",
      fromTransform: `translate(${direction * 18}px, 0) rotate(${direction * 1.4}deg) scale(0.985)`,
      toTransform: `translate(${direction * -8}px, 0) rotate(${direction * -1.1}deg) scale(1.018)`
    }),
    animateFinalBlowFx(speedlines, getFinalBlowLineFrames(direction), { duration: 420, easing: "ease-out" }),
    animateFinalBlowFx(aura, [
      { opacity: 0.62, transform: "scale(0.98)", filter: "brightness(1)" },
      { opacity: 1, transform: "scale(1.08)", filter: "brightness(1.9)", offset: 0.62 },
      { opacity: 0.78, transform: "scale(1.02)", filter: "brightness(1.18)" }
    ], { duration: 360, easing: "cubic-bezier(0.16, 1, 0.3, 1)" })
  ]);

  playFinalBlowSlashSound();
  await Promise.all([
    animateFinalBlowFx(attacker, [
      { transform: `translate(${direction * 8}px, 0) rotate(${direction * 1.1}deg) scale(1.028)`, filter: "brightness(1.25) contrast(1.12)" },
      { transform: `translate(${direction * 120}px, 0) rotate(${direction * -2}deg) scale(1.08) skewX(${direction * -6}deg)`, filter: "brightness(2.35) contrast(1.5) saturate(1.32)", offset: 0.42 },
      { transform: `translate(${direction * 38}px, 0) rotate(${direction * 0.7}deg) scale(1.02)`, filter: "brightness(1.24) contrast(1.16)" }
    ], { duration: 300, easing: "cubic-bezier(0.55, 0, 0.22, 1)" }),
    animateFinalBlowFx(loser, [
      { transform: `translate(${direction * -8}px, 0) rotate(${direction * -1.1}deg) scale(1.018)`, filter: "brightness(1.1) contrast(1.1)" },
      { transform: `translate(${direction * -118}px, 0) rotate(${direction * 2}deg) scale(1.06) skewX(${direction * 5}deg)`, filter: "brightness(1.9) contrast(1.38) saturate(1.16)", offset: 0.42 },
      { transform: `translate(${direction * -42}px, 0) rotate(${direction * -0.9}deg) scale(0.995)`, filter: "brightness(0.76) grayscale(0.38) contrast(1.24)" }
    ], { duration: 320, easing: "cubic-bezier(0.55, 0, 0.22, 1)" }),
    animateFinalBlowFx(slash, getFinalBlowSlashFrames(direction), { duration: 360, easing: "cubic-bezier(0.18, 0.8, 0.22, 1)" }),
    animateFinalBlowFx(spark, getFinalBlowSparkFrames(direction), { duration: 520, easing: "cubic-bezier(0.16, 1, 0.3, 1)" })
  ]);

  playFinalBlowImpactSound(0.56);
  await playFinalBlowImpact(scene, impact, wind, {
    mode: "white",
    background: "#ffffff",
    fighterFilter: "grayscale(1) contrast(4.4) brightness(1.7)",
    direction,
    strength: 18,
    duration: 5
  });
  playFinalBlowImpactSound(0.72);
  await playFinalBlowImpact(scene, impact, wind, {
    mode: "black",
    background: "#050505",
    fighterFilter: "invert(1) grayscale(1) contrast(5) brightness(0.42)",
    direction,
    strength: 25,
    duration: 5
  });
  playFinalBlowImpactSound(0.92);
  await playFinalBlowImpact(scene, impact, wind, {
    mode: "cut",
    background: "#ffffff",
    fighterFilter: "grayscale(1) contrast(5.2) brightness(1.85)",
    direction,
    strength: 34,
    duration: 5
  });

  await Promise.all([
    animateFinalBlowBox(attacker, attackerClash, attackerAfterHit, {
      duration: 420,
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
      fromTransform: `translate(${direction * 38}px, 0) rotate(${direction * 0.7}deg) scale(1.02)`,
      toTransform: `translate(${direction * -10}px, 0) rotate(${direction * -0.6}deg) scale(1.015)`
    }),
    animateFinalBlowBox(loser, loserClash, loserAfterHit, {
      duration: 420,
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
      fromTransform: `translate(${direction * -42}px, 0) rotate(${direction * -0.9}deg) scale(0.995)`,
      toTransform: `translate(${direction * 22}px, 0) rotate(${direction * 2.2}deg) scale(0.965)`
    }),
    animateFinalBlowFx(aura, [
      { opacity: 0.8, transform: "scale(1.02)", filter: "brightness(1.2)" },
      { opacity: 0.28, transform: "scale(0.98)", filter: "brightness(0.85)" }
    ], { duration: 420, easing: "ease-out" })
  ]);

  await waitForMs(80);
  await Promise.all([
    animateFinalBlowFx(loserPanel, [
      { filter: "brightness(0.72) grayscale(0.55) contrast(1.18)" },
      { filter: "brightness(1.32) grayscale(0.35) contrast(1.36)", offset: 0.18 },
      { filter: "brightness(0.48) grayscale(1) contrast(1.35)" }
    ], { duration: 360, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }),
    animateFinalBlowFx(aura, [
      { opacity: 0.52, transform: "scale(1.02)", filter: "brightness(1)" },
      { opacity: 1, transform: "scale(1.08)", filter: "brightness(1.8)", offset: 0.18 },
      { opacity: 0, transform: "scale(1.16)", filter: "brightness(1.2)" }
    ], { duration: 360, easing: "cubic-bezier(0.16, 1, 0.3, 1)" })
  ]);

  await waitForMs(120);
  await Promise.all([
    animateFinalBlowBox(attacker, attackerAfterHit, attackerStart, {
      duration: 440,
      easing: "cubic-bezier(0.72, 0, 0.84, 0)",
      fromTransform: `translate(${direction * -10}px, 0) rotate(${direction * -0.6}deg) scale(1.015)`,
      toTransform: "translate(0, 0) scale(1)",
      fadeOut: true
    }),
    animateFinalBlowBox(loser, loserAfterHit, loserStart, {
      duration: 440,
      easing: "cubic-bezier(0.72, 0, 0.84, 0)",
      fromTransform: `translate(${direction * 22}px, 0) rotate(${direction * 2.2}deg) scale(0.965)`,
      toTransform: "translate(0, 0) scale(1)",
      fadeOut: true
    })
  ]);
}

function setFinalBlowBox(element, box) {
  element.style.left = `${box.left}px`;
  element.style.top = `${box.top}px`;
  element.style.width = `${box.width}px`;
  element.style.height = `${box.height}px`;
}

async function animateFinalBlowBox(element, fromBox, toBox, options = {}) {
  const animation = element.animate([
    {
      left: `${fromBox.left}px`,
      top: `${fromBox.top}px`,
      width: `${fromBox.width}px`,
      height: `${fromBox.height}px`,
      opacity: 1,
      transform: options.fromTransform ?? "translate(0, 0) scale(1)"
    },
    {
      left: `${toBox.left}px`,
      top: `${toBox.top}px`,
      width: `${toBox.width}px`,
      height: `${toBox.height}px`,
      opacity: options.fadeOut ? 0 : 1,
      transform: options.toTransform ?? "translate(0, 0) scale(1)"
    }
  ], {
    duration: options.duration ?? 400,
    easing: options.easing ?? "ease",
    fill: "forwards"
  });

  await animation.finished.catch(() => {});
  setFinalBlowBox(element, toBox);
  element.style.opacity = options.fadeOut ? "0" : "1";
  element.style.transform = options.toTransform ?? "translate(0, 0) scale(1)";
}

function animateFinalBlowFx(element, keyframes, options = {}) {
  if (!element) return Promise.resolve();
  const animation = element.animate(keyframes, {
    duration: options.duration ?? 200,
    easing: options.easing ?? "ease",
    fill: options.fill ?? "both"
  });
  return animation.finished.catch(() => {});
}

function getFinalBlowLineFrames(direction = 1) {
  return [
    { opacity: 0, transform: `translateX(${direction * -34}%) skewX(-18deg) scaleX(1.28)` },
    { opacity: 1, transform: `translateX(${direction * -4}%) skewX(-18deg) scaleX(1.32)`, offset: 0.22 },
    { opacity: 0.72, transform: `translateX(${direction * 12}%) skewX(-18deg) scaleX(1.22)`, offset: 0.58 },
    { opacity: 0, transform: `translateX(${direction * 36}%) skewX(-18deg) scaleX(1.28)` }
  ];
}

function getFinalBlowSlashFrames(direction = 1) {
  return [
    { opacity: 0, transform: `translate(${direction * -32}%, -50%) rotate(${direction * -14}deg) scaleX(0.16) scaleY(0.62)`, filter: "blur(6px) brightness(1.4)" },
    { opacity: 1, transform: `translate(${direction * -7}%, -50%) rotate(${direction * -14}deg) scaleX(1.08) scaleY(1)`, filter: "blur(0) brightness(2.1)", offset: 0.34 },
    { opacity: 0.55, transform: `translate(${direction * 12}%, -50%) rotate(${direction * -14}deg) scaleX(1.42) scaleY(0.88)`, filter: "blur(1px) brightness(1.6)", offset: 0.62 },
    { opacity: 0, transform: `translate(${direction * 28}%, -50%) rotate(${direction * -14}deg) scaleX(1.62) scaleY(0.7)`, filter: "blur(5px) brightness(1.1)" }
  ];
}

function getFinalBlowSparkFrames(direction = 1) {
  return [
    { opacity: 0, transform: `translate(${direction * 4}%, -50%) scale(0.18) rotate(0deg)`, filter: "brightness(1)" },
    { opacity: 1, transform: `translate(${direction * 2}%, -50%) scale(0.68) rotate(${direction * 6}deg)`, filter: "brightness(2.4)", offset: 0.18 },
    { opacity: 0.86, transform: `translate(${direction * -4}%, -50%) scale(1.2) rotate(${direction * -8}deg)`, filter: "brightness(1.7)", offset: 0.52 },
    { opacity: 0, transform: `translate(${direction * -10}%, -50%) scale(1.68) rotate(${direction * -16}deg)`, filter: "brightness(1)" }
  ];
}

async function playFinalBlowImpact(scene, impact, wind, options = {}) {
  const {
    background = "#ffffff",
    fighterFilter = "invert(1) grayscale(1) contrast(3)",
    mode = "white",
    direction = 1,
    strength = 18,
    duration = 92
  } = options;
  const fighters = [...scene.querySelectorAll(".vs-final-blow-fighter")];
  const previousFilters = fighters.map((fighter) => fighter.style.filter);
  const previousSceneBackground = scene.style.background;
  const previousImpactOpacity = impact?.style.opacity ?? "";
  const impactClass = `is-impact-${mode}`;
  const fighterModeClass = mode === "black" ? "is-impact-black" : "";

  scene.classList.add("is-impact-frame");
  scene.style.background = background;
  if (impact) {
    impact.style.background = background;
    impact.style.filter = "none";
    impact.style.opacity = "1";
    impact.classList.remove("is-impact-white", "is-impact-black", "is-impact-cut");
    impact.classList.add(impactClass);
  }
  fighters.forEach((fighter) => {
    fighter.style.filter = fighterFilter;
    fighter.classList.add("is-impact-sketch");
    if (fighterModeClass) fighter.classList.add(fighterModeClass);
  });

  await Promise.all([
    animateFinalBlowFx(scene, getFinalBlowCameraShakeFrames(direction, strength), { duration: 150, easing: "steps(4, end)" }),
    waitForMs(duration),
    animateFinalBlowFx(wind, [
      { opacity: 0, transform: "scale(0.18)", filter: "blur(0)" },
      { opacity: 0.95, transform: "scale(0.72)", filter: "blur(0)", offset: 0.22 },
      { opacity: 0, transform: "scale(1.58)", filter: "blur(2px)" }
    ], { duration: 160, easing: "steps(2, end)" })
  ]);

  fighters.forEach((fighter, index) => {
    fighter.style.filter = previousFilters[index] ?? "";
    fighter.classList.remove("is-impact-sketch", "is-impact-black");
  });
  scene.classList.remove("is-impact-frame");
  scene.style.background = previousSceneBackground;
  if (impact) {
    impact.style.opacity = previousImpactOpacity;
    impact.classList.remove("is-impact-white", "is-impact-black", "is-impact-cut");
  }
}

function getFinalBlowCameraShakeFrames(direction = 1, strength = 18) {
  const side = Math.sign(direction) || 1;
  return [
    { transform: "translate(0, 0) rotate(0deg)" },
    { transform: `translate(${side * strength}px, -${strength * 0.35}px) rotate(${side * 0.22}deg)` },
    { transform: `translate(${-side * strength * 0.72}px, ${strength * 0.28}px) rotate(${-side * 0.18}deg)` },
    { transform: `translate(${side * strength * 0.38}px, ${strength * 0.14}px) rotate(${side * 0.08}deg)` },
    { transform: "translate(0, 0) rotate(0deg)" }
  ];
}

function createFinalBlowCard(slot, entry) {
  const panel = slot.querySelector(".vs-fighter-panel");
  const name = getEntryDisplayName(entry) || slot.querySelector(".vs-fighter-name")?.textContent || localize("common.unknown");
  const img = panel?.dataset.img || entry?.img || FALLBACK_IMG;
  const style = panel?.getAttribute("style") || "";
  const nameMarkup = entry?.nameHidden
    ? ""
    : `<div class="vs-fighter-name" title="${escapeAttr(name)}">${escapeHtml(name)}</div>`;

  return `
    <div class="vs-final-blow-card">
      <div class="vs-fighter-panel" data-img="${escapeAttr(img)}" style="${style}">
        <div class="vs-fighter-image"></div>
        <div class="vs-fighter-shade"></div>
        ${nameMarkup}
      </div>
    </div>
  `;
}

function waitForMs(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getFinalBlowAudioContext() {
  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContextClass) return null;

  finalBlowAudioContext ??= new AudioContextClass();
  if (finalBlowAudioContext.state === "suspended") finalBlowAudioContext.resume?.();
  return finalBlowAudioContext;
}

function getFinalBlowFxVolume(multiplier = 1) {
  let globalVolume = 0.75;
  try {
    globalVolume = Number(game.settings?.get?.("core", "globalInterfaceVolume"));
  } catch (error) {
    globalVolume = Number(game.audio?.interfaceVolume ?? game.audio?.volume ?? 0.75);
  }

  const baseVolume = Number.isFinite(globalVolume) ? globalVolume : 0.75;
  return clampNumber(baseVolume * multiplier, 0, 1, 0.55);
}

function createFinalBlowNoiseBuffer(context, duration = 0.28) {
  const length = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);

  for (let index = 0; index < length; index += 1) {
    data[index] = (Math.random() * 2) - 1;
  }

  return buffer;
}

function connectFinalBlowGain(context, destination, startTime, envelope = {}) {
  const gain = context.createGain();
  const attack = envelope.attack ?? 0.018;
  const hold = envelope.hold ?? 0.02;
  const decay = envelope.decay ?? 0.24;
  const peak = getFinalBlowFxVolume(envelope.volume ?? 0.4);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), startTime + attack);
  gain.gain.setValueAtTime(Math.max(0.0001, peak), startTime + attack + hold);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + attack + hold + decay);
  gain.connect(destination);
  return gain;
}

function playFinalBlowTone({ type = "sine", frequency = 220, endFrequency, duration = 0.2, volume = 0.35, delay = 0, detune = 0, destination, envelope } = {}) {
  const context = getFinalBlowAudioContext();
  if (!context) return;

  const startTime = context.currentTime + delay;
  const oscillator = context.createOscillator();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), startTime + duration);
  oscillator.detune.setValueAtTime(detune, startTime);

  const gain = connectFinalBlowGain(context, destination ?? context.destination, startTime, {
    attack: envelope?.attack ?? 0.018,
    hold: envelope?.hold ?? duration * 0.12,
    decay: envelope?.decay ?? duration * 0.92,
    volume
  });

  oscillator.connect(gain);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.08);
}

function playFinalBlowNoise({ duration = 0.24, volume = 0.35, delay = 0, filterType = "bandpass", frequency = 900, endFrequency, q = 1.2, destination, envelope } = {}) {
  const context = getFinalBlowAudioContext();
  if (!context) return;

  const startTime = context.currentTime + delay;
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  source.buffer = createFinalBlowNoiseBuffer(context, duration + 0.08);
  filter.type = filterType;
  filter.frequency.setValueAtTime(frequency, startTime);
  if (endFrequency) filter.frequency.exponentialRampToValueAtTime(Math.max(40, endFrequency), startTime + duration);
  filter.Q.setValueAtTime(q, startTime);

  const gain = connectFinalBlowGain(context, destination ?? context.destination, startTime, {
    attack: envelope?.attack ?? 0.012,
    hold: envelope?.hold ?? duration * 0.06,
    decay: envelope?.decay ?? duration * 0.96,
    volume
  });

  source.connect(filter);
  filter.connect(gain);
  source.start(startTime);
  source.stop(startTime + duration + 0.08);
}

function createCinematicCompressor({ threshold = -22, ratio = 6, attack = 0.004, release = 0.24 } = {}) {
  const context = getFinalBlowAudioContext();
  if (!context) return null;

  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = threshold;
  compressor.knee.value = 10;
  compressor.ratio.value = ratio;
  compressor.attack.value = attack;
  compressor.release.value = release;
  compressor.connect(context.destination);
  return compressor;
}

function playCinematicBoom({ volume = 0.3, delay = 0, duration = 0.54, destination } = {}) {
  const output = destination ?? createCinematicCompressor({ threshold: -24, ratio: 8, release: 0.32 });
  if (!output) return;

  playFinalBlowTone({
    type: "sine",
    frequency: 52,
    endFrequency: 26,
    duration,
    volume,
    delay,
    destination: output,
    envelope: { attack: 0.004, hold: 0.035, decay: duration * 1.05 }
  });
  playFinalBlowNoise({
    duration: duration * 0.55,
    volume: volume * 0.42,
    delay,
    filterType: "lowpass",
    frequency: 260,
    endFrequency: 70,
    q: 0.5,
    destination: output,
    envelope: { attack: 0.003, hold: 0.018, decay: duration * 0.7 }
  });
}

function playMetalResonance({ volume = 0.12, delay = 0, destination } = {}) {
  const output = destination ?? createCinematicCompressor({ threshold: -26, ratio: 4, release: 0.42 });
  if (!output) return;

  [
    { frequency: 278, duration: 0.58, detune: -8, level: 0.52 },
    { frequency: 431, duration: 0.46, detune: 11, level: 0.35 },
    { frequency: 763, duration: 0.34, detune: -5, level: 0.18 },
    { frequency: 1187, duration: 0.26, detune: 7, level: 0.1 }
  ].forEach((partial) => {
    playFinalBlowTone({
      type: "sine",
      frequency: partial.frequency,
      endFrequency: partial.frequency * 0.985,
      duration: partial.duration,
      volume: volume * partial.level,
      delay,
      detune: partial.detune,
      destination: output,
      envelope: { attack: 0.002, hold: 0.01, decay: partial.duration }
    });
  });
}

function playBladeDrawTexture({ volume = 0.16, delay = 0, destination } = {}) {
  const output = destination ?? createCinematicCompressor({ threshold: -24, ratio: 5, release: 0.22 });
  if (!output) return;

  playFinalBlowNoise({
    duration: 0.34,
    volume,
    delay,
    filterType: "bandpass",
    frequency: 520,
    endFrequency: 2300,
    q: 1.35,
    destination: output,
    envelope: { attack: 0.018, hold: 0.035, decay: 0.28 }
  });
  playMetalResonance({ volume: volume * 0.55, delay: delay + 0.11, destination: output });
}

function playBladeWhooshTexture({ volume = 0.28, delay = 0, destination } = {}) {
  const output = destination ?? createCinematicCompressor({ threshold: -23, ratio: 6, release: 0.24 });
  if (!output) return;

  playFinalBlowNoise({
    duration: 0.36,
    volume,
    delay,
    filterType: "bandpass",
    frequency: 2100,
    endFrequency: 180,
    q: 0.62,
    destination: output,
    envelope: { attack: 0.006, hold: 0.02, decay: 0.36 }
  });
  playFinalBlowNoise({
    duration: 0.12,
    volume: volume * 0.38,
    delay: delay + 0.055,
    filterType: "highpass",
    frequency: 1400,
    endFrequency: 900,
    q: 0.75,
    destination: output,
    envelope: { attack: 0.002, hold: 0.006, decay: 0.11 }
  });
}

function playGlassCrackTexture({ volume = 0.12, delay = 0 } = {}) {
  const output = createCinematicCompressor({ threshold: -26, ratio: 5, release: 0.32 });
  if (!output) return;

  [0, 0.018, 0.041, 0.072, 0.118, 0.17].forEach((offset, index) => {
    playFinalBlowNoise({
      duration: 0.035 + (index * 0.006),
      volume: volume * (1 - (index * 0.08)),
      delay: delay + offset,
      filterType: "highpass",
      frequency: 1300 + (index * 330),
      endFrequency: 2400 + (index * 280),
      q: 0.8,
      destination: output,
      envelope: { attack: 0.001, hold: 0.002, decay: 0.045 }
    });
  });

  [690, 1040, 1560].forEach((frequency, index) => {
    playFinalBlowTone({
      type: "sine",
      frequency,
      endFrequency: frequency * 0.68,
      duration: 0.18 + (index * 0.04),
      volume: volume * 0.12,
      delay: delay + 0.026 + (index * 0.035),
      detune: index % 2 ? -11 : 9,
      destination: output,
      envelope: { attack: 0.001, hold: 0.004, decay: 0.18 }
    });
  });
}

function playFinalBlowChargeSound() {
  const output = createCinematicCompressor({ threshold: -22, ratio: 5, release: 0.34 });
  if (!output) return;

  playCinematicBoom({ volume: 0.18, duration: 0.72, destination: output });
  playFinalBlowNoise({ duration: 0.74, volume: 0.12, filterType: "lowpass", frequency: 110, endFrequency: 520, q: 0.48, destination: output });
  playBladeDrawTexture({ volume: 0.08, delay: 0.22, destination: output });
}

function playFinalBlowDrawSound() {
  playBladeDrawTexture({ volume: 0.18 });
}

function playFinalBlowSlashSound() {
  const output = createCinematicCompressor({ threshold: -22, ratio: 7, release: 0.2 });
  if (!output) return;

  playBladeWhooshTexture({ volume: 0.36, destination: output });
  playCinematicBoom({ volume: 0.1, duration: 0.3, delay: 0.04, destination: output });
}

function playFinalBlowImpactSound(volume = 0.7) {
  const context = getFinalBlowAudioContext();
  if (!context) return;

  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -24;
  compressor.knee.value = 8;
  compressor.ratio.value = 10;
  compressor.attack.value = 0.001;
  compressor.release.value = 0.22;
  compressor.connect(context.destination);

  playCinematicBoom({ volume: 0.46 * volume, duration: 0.42, destination: compressor });
  playFinalBlowNoise({ duration: 0.12, volume: 0.26 * volume, filterType: "lowpass", frequency: 360, endFrequency: 70, q: 0.46, destination: compressor, envelope: { attack: 0.001, hold: 0.012, decay: 0.18 } });
  playMetalResonance({ volume: 0.18 * volume, delay: 0.018, destination: compressor });
}

function playFinalBlowGlassSound() {
  playGlassCrackTexture({ volume: 0.16 });
}

function playOverlayEnterSound(entryCount = 1) {
  const count = clampNumber(Number(entryCount) || 1, 1, 10, 1);
  playCinematicBoom({ volume: 0.2, duration: 0.58 });
  playFinalBlowNoise({ duration: 0.46, volume: 0.1, filterType: "lowpass", frequency: 140, endFrequency: 620, q: 0.52 });

  for (let index = 0; index < Math.min(count, 4); index += 1) {
    playBladeWhooshTexture({ volume: 0.035, delay: 0.14 + (index * 0.055) });
  }
}

function playOverlayExitSound() {
  playBladeWhooshTexture({ volume: 0.12 });
  playCinematicBoom({ volume: 0.1, duration: 0.42, delay: 0.04 });
}

function playSlotEntrySound(index = 0) {
  const delay = Math.min(index * 0.035, 0.24);
  playBladeWhooshTexture({ volume: 0.075, delay });
}

function playNewEntrySounds(newUuids, generation) {
  if (!newUuids?.size) return;

  [...newUuids].slice(0, 8).forEach((uuid, index) => {
    window.setTimeout(() => {
      if (generation !== overlayGeneration) return;
      playSlotEntrySound(index);
    }, Math.min(index * 80, 520));
  });
}

function playIntroEntrySounds(introDelays, generation) {
  if (!introDelays?.size) return;

  [...introDelays.entries()].slice(0, 14).forEach(([, delay], index) => {
    window.setTimeout(() => {
      if (generation !== overlayGeneration) return;
      playSlotEntrySound(index);
    }, Math.max(0, delay));
  });
}

function playSlotExitSound(side) {
  const delay = side === "enemies" ? 0.012 : 0;
  playBladeWhooshTexture({ volume: 0.09, delay });
}

function playDefeatedSound() {
  playFinalBlowImpactSound(0.5);
  playCinematicBoom({ volume: 0.12, duration: 0.6, delay: 0.05 });
}

function playRecoverySound() {
  playFinalBlowNoise({ duration: 0.38, volume: 0.06, filterType: "bandpass", frequency: 260, endFrequency: 980, q: 0.7 });
  playMetalResonance({ volume: 0.045, delay: 0.08 });
}

function playDefeatedChangeSounds(previousState, currentState, newUuids = new Set()) {
  if (!previousState?.size || !currentState?.size) return;

  let delay = 0;
  currentState.forEach((defeated, uuid) => {
    if (newUuids.has(uuid) || !previousState.has(uuid) || previousState.get(uuid) === defeated) return;

    window.setTimeout(() => {
      if (defeated) playDefeatedSound();
      else playRecoverySound();
    }, delay);
    delay = Math.min(delay + 90, 360);
  });
}

function playCompactionSound(sideCount = 1) {
  const volume = sideCount > 1 ? 0.07 : 0.045;
  playFinalBlowNoise({ duration: 0.14, volume, filterType: "lowpass", frequency: 240, endFrequency: 420, q: 0.64 });
  playCinematicBoom({ volume: 0.035, duration: 0.2 });
}

function playRepositionSound(layoutCount = 1) {
  const count = Math.min(3, Math.max(1, Math.round((Number(layoutCount) || 1) / 3)));
  for (let index = 0; index < count; index += 1) {
    playBladeWhooshTexture({ volume: 0.025, delay: index * 0.035 });
  }
}

function setAssignedEntryDefeated(side, uuid, defeated) {
  const entry = getCombatSides()[side]?.find((candidate) => candidate.uuid === uuid);
  if (entry) entry.defeated = defeated;

  setRenderedDefeatedState(uuid, defeated);
  suppressOverlayRefresh();
  if (defeated) {
    playDefeatedSound();
    playDefeatedAnimation(uuid);
  } else {
    playRecoverySound();
    playRecoveryAnimation(uuid);
  }

  persistAssignedEntryState(side, uuid, { defeated }, findCombatantByUuid(uuid));
}

function setAssignedEntryHidden(side, uuid, hidden) {
  if (hidden) {
    playSlotExitSound(side);
    playSlotExitAnimation(uuid, side).finally(() => {
      pendingCompactionSides.add(side);
      persistAssignedEntryState(side, uuid, { hidden: true }, undefined, { suppressRefresh: false, compactionSide: side });
    });
    return;
  }

  pendingNewUuids.add(uuid);
  playSlotEntrySound(0);
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

async function persistEntryPortraitSettings(uuid, { imageFit, displayName, nameHidden }) {
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

  if (!canSave) {
    ui.notifications?.warn(localize("imageAdjust.noPermission"));
    return false;
  }

  await actor.setFlag(MODULE_ID, FLAG_IMAGE_FIT, normalizeImageFit(imageFit));
  await actor.setFlag(MODULE_ID, FLAG_DISPLAY_NAME, String(displayName ?? "").trim());
  await actor.setFlag(MODULE_ID, FLAG_NAME_HIDDEN, Boolean(nameHidden));
  await updateAssignedEntry(uuid, {
    displayName: String(displayName ?? "").trim(),
    nameHidden: Boolean(nameHidden),
    imageFit: normalizeImageFit(imageFit)
  });
  lastOverlaySignature = "";
  refreshVSOverlay({ force: true });
  configApp?.render(false);
  return true;
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
    displayName: "",
    nameHidden: false,
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
  if (!document) return normalizeEntryDisplay(entry);
  const actor = combatant?.actor ?? document.actor ?? (document.documentName === "Actor" ? document : null);
  const token = combatant?.token ?? (document.documentName === "Token" ? document : null);
  const displayName = actor?.getFlag?.(MODULE_ID, FLAG_DISPLAY_NAME);
  const nameHidden = actor?.getFlag?.(MODULE_ID, FLAG_NAME_HIDDEN);

  return {
    ...normalizeEntryDisplay(entry),
    displayName: typeof displayName === "string" ? displayName : entry.displayName,
    nameHidden: typeof nameHidden === "boolean" ? nameHidden : Boolean(entry.nameHidden),
    img: getTokenImage({ combatant, token, actor, document }),
    imageFit: normalizeImageFit(actor?.getFlag?.(MODULE_ID, FLAG_IMAGE_FIT) ?? entry.imageFit)
  };
}

function normalizeEntryDisplay(entry = {}) {
  return {
    ...entry,
    displayName: typeof entry.displayName === "string" ? entry.displayName : "",
    nameHidden: Boolean(entry.nameHidden)
  };
}

function getEntryDisplayName(entry = {}) {
  const override = typeof entry.displayName === "string" ? entry.displayName.trim() : "";
  return override || entry.name || localize("common.unknown");
}

function getNamePositionSetting() {
  try {
    return game.settings.get(MODULE_ID, SETTING_NAME_POSITION) === NAME_POSITION_TOP
      ? NAME_POSITION_TOP
      : NAME_POSITION_BOTTOM;
  } catch (error) {
    return NAME_POSITION_BOTTOM;
  }
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

function removeVSOverlay({ stopMusic = false } = {}) {
  if (scheduledIntroExitId) {
    window.clearTimeout(scheduledIntroExitId);
    scheduledIntroExitId = null;
  }
  overlayGeneration += 1;
  lastOverlaySignature = "";
  if (stopMusic) stopOverlayMusic();
  const root = document.getElementById(OVERLAY_ID);
  if (!root) return;

  root.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
  root.remove();
}

async function restartOverlayMusic() {
  await stopOverlayMusic();
  startOverlayMusic();
}

async function startOverlayMusic() {
  if (!game.user?.isGM) return;

  const { playlist, sound } = getConfiguredOverlayMusic();
  if (!playlist || !sound) return;

  const wasPlaying = Boolean(sound.playing);
  overlayMusicState = {
    playlistId: playlist.id,
    soundId: sound.id,
    startedByOverlay: !wasPlaying
  };

  if (wasPlaying) return;

  try {
    if (typeof playlist.playSound === "function") await playlist.playSound(sound);
    else if (typeof sound.play === "function") await sound.play();
    else if (typeof sound.update === "function") await sound.update({ playing: true });
  } catch (error) {
    console.warn(`${MODULE_ID} | Could not start overlay music`, error);
    overlayMusicState = null;
  }
}

async function stopOverlayMusic() {
  if (!game.user?.isGM || !overlayMusicState) return;

  const state = overlayMusicState;
  overlayMusicState = null;
  if (!state.startedByOverlay) return;

  const playlist = game.playlists?.get(state.playlistId);
  const sound = getCollectionDocument(playlist?.sounds, state.soundId);
  if (!playlist || !sound) return;

  try {
    if (typeof playlist.stopSound === "function") await playlist.stopSound(sound);
    else if (typeof sound.stop === "function") await sound.stop();
    else if (typeof sound.update === "function") await sound.update({ playing: false });
  } catch (error) {
    console.warn(`${MODULE_ID} | Could not stop overlay music`, error);
  }
}

function getConfiguredOverlayMusic() {
  const playlistId = game.settings.get(MODULE_ID, SETTING_MUSIC_PLAYLIST);
  const soundId = game.settings.get(MODULE_ID, SETTING_MUSIC_SOUND);
  const playlist = playlistId ? game.playlists?.get(playlistId) : null;
  const sound = playlist && soundId
    ? getCollectionDocument(playlist.sounds, soundId)
    : null;

  return { playlist, sound };
}

function getCollectionDocument(collection, id) {
  return collection?.get?.(id) ?? getCollectionValues(collection).find((entry) => entry?.id === id) ?? null;
}

function getCollectionValues(collection) {
  if (!collection) return [];
  if (Array.isArray(collection)) return collection;
  if (Array.isArray(collection.contents)) return collection.contents;
  if (typeof collection.values === "function") return [...collection.values()];
  return [...collection].map((entry) => Array.isArray(entry) ? entry[1] : entry);
}

function getEntryUuidSet(entries) {
  return new Set(entries.map((entry) => entry.uuid).filter(Boolean));
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
    const assignedEntry = getAssignedEntry(uuid)?.entry;
    this.fit = normalizeImageFit(this.actor?.getFlag?.(MODULE_ID, FLAG_IMAGE_FIT) ?? assignedEntry?.imageFit);
    this.displayName = this.actor?.getFlag?.(MODULE_ID, FLAG_DISPLAY_NAME) ?? assignedEntry?.displayName ?? "";
    this.nameHidden = Boolean(this.actor?.getFlag?.(MODULE_ID, FLAG_NAME_HIDDEN) ?? assignedEntry?.nameHidden);
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
    const originalName = entry?.name || localize("common.unknown");
    const name = getEntryDisplayName({ ...entry, displayName: this.displayName });

    return $($.parseHTML(`
      <div class="vs-image-adjust-form">
        <div class="vs-image-adjust-counts">
          ${[1, 2, 3, 4].map((count) => `
            <button type="button" data-count="${count}" class="${count === this.previewCount ? "active" : ""}">${count}</button>
          `).join("")}
        </div>
        <div class="vs-image-adjust-preview-stage">
          <div class="vs-image-adjust-preview ${this.nameHidden ? "is-name-hidden" : ""}" style="--vs-preview-width: ${this.previewSize.width}px; --vs-preview-height: ${this.previewSize.height}px; ${getImageFitStyle(this.fit, this.fit.flip ? -1 : 1)};">
            <div class="vs-image-adjust-picture" style="background-image: url('${escapeAttr(img)}');"></div>
            <div class="vs-image-adjust-name">${escapeHtml(name)}</div>
          </div>
        </div>
        <label class="vs-image-adjust-text">
          <span>${localize("imageAdjust.displayName")}</span>
          <input type="text" name="displayName" value="${escapeAttr(this.displayName)}" placeholder="${escapeAttr(originalName)}">
        </label>
        <button type="button" class="vs-image-adjust-name-toggle ${this.nameHidden ? "active" : ""}" data-action="name-hidden" aria-pressed="${this.nameHidden}">
          <i class="fas fa-tag"></i>
          <span>${this.nameHidden ? localize("imageAdjust.showName") : localize("imageAdjust.hideName")}</span>
        </button>
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

    html.find("input[name='displayName']").on("input", (event) => {
      this.displayName = event.currentTarget.value;
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

    html.find("button[data-action='name-hidden']").on("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.nameHidden = !this.nameHidden;
      event.currentTarget.classList.toggle("active", this.nameHidden);
      event.currentTarget.setAttribute("aria-pressed", String(this.nameHidden));
      event.currentTarget.querySelector("span").textContent = this.nameHidden
        ? localize("imageAdjust.showName")
        : localize("imageAdjust.hideName");
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
        const saved = await persistEntryPortraitSettings(this.uuid, {
          imageFit: this.fit,
          displayName: this.displayName,
          nameHidden: this.nameHidden
        });
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
    const entry = this.getPreviewEntry();
    const name = getEntryDisplayName({ ...entry, displayName: this.displayName });
    const nameElement = preview.querySelector(".vs-image-adjust-name");
    if (nameElement) nameElement.textContent = name;
    preview.classList.toggle("is-name-hidden", this.nameHidden);
    const fitVars = getImageFitCssVars(this.fit, this.fit.flip ? -1 : 1);
    for (const [property, value] of Object.entries(fitVars)) {
      preview.style.setProperty(property, value);
    }
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
      displayName: actor.getFlag?.(MODULE_ID, FLAG_DISPLAY_NAME) ?? "",
      nameHidden: Boolean(actor.getFlag?.(MODULE_ID, FLAG_NAME_HIDDEN)),
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
        ${this.createMusicMarkup()}
        ${this.createFinalBlowMarkup(sides)}
        <div class="vs-config-sides">
          ${this.createSideMarkup("allies", localize("config.allies"), sides.allies)}
          ${this.createSideMarkup("enemies", localize("config.enemies"), sides.enemies)}
        </div>
      </form>
    `));
  }

  createSideMarkup(side, label, entries) {
    const normalizedEntries = entries.map(normalizeEntryImage);
    const displayEntries = getConfigDisplayEntries(side, normalizedEntries);
    const rows = displayEntries.map((entry) => {
      const visibleLabel = entry.hidden ? localize("config.hidden") : localize("config.visible");
      const defeatedLabel = localize("config.defeated");
      const displayName = getEntryDisplayName(entry);
      const index = normalizedEntries.findIndex((candidate) => candidate.uuid === entry.uuid);
      const canMoveForward = canMoveEntryByOffset(normalizedEntries, index, getConfigMoveOffset(side, "forward"));
      const canMoveBackward = canMoveEntryByOffset(normalizedEntries, index, getConfigMoveOffset(side, "backward"));

      return `
      <li class="vs-config-entry ${entry.defeated ? "is-defeated" : ""} ${entry.hidden ? "is-hidden" : ""}" data-side="${side}" data-uuid="${escapeAttr(entry.uuid)}" draggable="true" title="${localize("config.openSheet")}">
        <div class="vs-config-order-actions">
          <button type="button" class="vs-config-order-button" data-action="move-forward" title="${localize("config.moveForward")}" ${canMoveForward ? "" : "disabled"}><i class="fas fa-chevron-up"></i></button>
          <button type="button" class="vs-config-order-button" data-action="move-backward" title="${localize("config.moveBackward")}" ${canMoveBackward ? "" : "disabled"}><i class="fas fa-chevron-down"></i></button>
        </div>
        <div class="vs-config-portrait">
          <img src="${escapeAttr(entry.img || FALLBACK_IMG)}" alt="" />
        </div>
        <div class="vs-config-entry-main">
          <span class="vs-config-entry-name">${entry.nameHidden ? `<i class="fas fa-tag"></i> ` : ""}${escapeHtml(displayName)}</span>
          <div class="vs-config-entry-status">
            <span class="vs-config-status vs-config-status-hidden">${escapeHtml(visibleLabel)}</span>
            <span class="vs-config-status vs-config-status-defeated">${escapeHtml(defeatedLabel)}</span>
          </div>
        </div>
        <div class="vs-config-entry-actions">
          <button type="button" class="vs-config-icon-button ${entry.defeated ? "active" : ""}" data-action="defeated" title="${localize("config.toggleDefeated")}" aria-pressed="${entry.defeated ? "true" : "false"}"><i class="fas fa-skull"></i></button>
          <button type="button" class="vs-config-icon-button ${entry.hidden ? "active" : ""}" data-action="hidden" title="${entry.hidden ? localize("config.reveal") : localize("config.hide")}" aria-pressed="${entry.hidden ? "true" : "false"}"><i class="fas ${entry.hidden ? "fa-eye" : "fa-eye-slash"}"></i></button>
          <button type="button" class="vs-config-icon-button vs-config-remove-button" data-action="remove" title="${localize("config.remove")}"><i class="fas fa-trash"></i></button>
        </div>
      </li>
    `;
    }).join("");

    return `
      <section class="vs-config-side" data-side="${side}">
        <div class="vs-config-side-header">
          <h3>${label}</h3>
          <span>${localize("config.entryCount").replace("{count}", String(entries.length))}</span>
        </div>
        <div class="vs-config-drop"><i class="fas fa-plus"></i><span>${localize("config.dropHint")}</span></div>
        <ol class="vs-config-list">${rows}</ol>
      </section>
    `;
  }

  createMusicMarkup() {
    const selectedPlaylistId = game.settings.get(MODULE_ID, SETTING_MUSIC_PLAYLIST);
    const selectedSoundId = game.settings.get(MODULE_ID, SETTING_MUSIC_SOUND);
    const playlists = getCollectionValues(game.playlists);
    const selectedPlaylist = getCollectionDocument(game.playlists, selectedPlaylistId);
    const sounds = selectedPlaylist ? getCollectionValues(selectedPlaylist.sounds) : [];

    return `
      <section class="vs-config-music">
        <div class="vs-config-side-header">
          <h3>${localize("config.music")}</h3>
        </div>
        <div class="vs-config-music-fields">
          <select name="musicPlaylist">
            <option value="">${localize("config.noMusic")}</option>
            ${playlists.map((playlist) => `<option value="${escapeAttr(playlist.id)}" ${playlist.id === selectedPlaylistId ? "selected" : ""}>${escapeHtml(playlist.name)}</option>`).join("")}
          </select>
          <select name="musicSound" ${selectedPlaylist ? "" : "disabled"}>
            <option value="">${localize("config.noSound")}</option>
            ${sounds.map((sound) => `<option value="${escapeAttr(sound.id)}" ${sound.id === selectedSoundId ? "selected" : ""}>${escapeHtml(sound.name)}</option>`).join("")}
          </select>
        </div>
      </section>
    `;
  }

  createFinalBlowMarkup(sides) {
    const entries = getFinalBlowOptions(sides);

    return `
      <section class="vs-config-final-blow">
        <div class="vs-config-side-header">
          <h3>${localize("config.finalBlow")}</h3>
        </div>
        <div class="vs-config-final-blow-fields">
          <select name="finalBlowAttacker">
            <option value="">${localize("config.finalBlowAttacker")}</option>
            ${entries.map((entry) => `<option value="${escapeAttr(entry.uuid)}">${escapeHtml(entry.label)}</option>`).join("")}
          </select>
          <select name="finalBlowLoser">
            <option value="">${localize("config.finalBlowLoser")}</option>
            ${entries.map((entry) => `<option value="${escapeAttr(entry.uuid)}">${escapeHtml(entry.label)}</option>`).join("")}
          </select>
          <button type="button" data-action="final-blow"><i class="fas fa-bolt"></i><span>${localize("config.finalBlowPlay")}</span></button>
        </div>
      </section>
    `;
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find("select[name='musicPlaylist']").on("change", async (event) => {
      await game.settings.set(MODULE_ID, SETTING_MUSIC_PLAYLIST, event.currentTarget.value);
      await game.settings.set(MODULE_ID, SETTING_MUSIC_SOUND, "");
      this.render(false);
    });

    html.find("select[name='musicSound']").on("change", async (event) => {
      await game.settings.set(MODULE_ID, SETTING_MUSIC_SOUND, event.currentTarget.value);
    });

    html.find("button[data-action='final-blow']").on("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const root = getHtmlRootElement(html);
      const attackerUuid = root?.querySelector("select[name='finalBlowAttacker']")?.value;
      const loserUuid = root?.querySelector("select[name='finalBlowLoser']")?.value;
      await playFinalBlowScene(attackerUuid, loserUuid);
    });

    html.find(".vs-config-entry").on("click", (event) => {
      if (event.target.closest("button, input, select, textarea, label")) return;

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

    html.find("button[data-action='move-forward'], button[data-action='move-backward']").on("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const row = event.currentTarget.closest(".vs-config-entry");
      const direction = event.currentTarget.dataset.action === "move-forward" ? "forward" : "backward";
      const offset = getConfigMoveOffset(row.dataset.side, direction);
      const moved = await moveAssignedEntryByOffset(row.dataset.side, row.dataset.uuid, offset);
      if (moved) this.render(false);
    });

    html.find("button[data-action='defeated']").on("click", async (event) => {
      const row = event.currentTarget.closest(".vs-config-entry");
      const defeated = row.classList.toggle("is-defeated");
      event.currentTarget.classList.toggle("active", defeated);
      event.currentTarget.setAttribute("aria-pressed", String(defeated));
      setAssignedEntryDefeated(row.dataset.side, row.dataset.uuid, defeated);
    });

    html.find("button[data-action='hidden']").on("click", async (event) => {
      const row = event.currentTarget.closest(".vs-config-entry");
      const hidden = row.classList.toggle("is-hidden");
      const icon = event.currentTarget.querySelector("i");
      icon?.classList.toggle("fa-eye", hidden);
      icon?.classList.toggle("fa-eye-slash", !hidden);
      event.currentTarget.classList.toggle("active", hidden);
      event.currentTarget.setAttribute("aria-pressed", String(hidden));
      event.currentTarget.title = hidden ? localize("config.reveal") : localize("config.hide");
      row.querySelector(".vs-config-status-hidden").textContent = hidden ? localize("config.hidden") : localize("config.visible");
      setAssignedEntryHidden(row.dataset.side, row.dataset.uuid, hidden);
    });
  }
}
