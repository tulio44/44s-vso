import { preloadPanelImages } from "./overlay-assets.js";

export function createOverlayAnimations({ overlayId, getOverlayGeneration, getRenderSide, escapeSelector }) {
  function cancelSlotAnimations(slot, { keepBreath = false } = {}) {
    slot?.getAnimations({ subtree: true }).forEach((animation) => {
      if (animation.playState === "finished") return;
      if (keepBreath && animation.animationName === "vs-fighter-breath") return;
      animation.cancel();
    });
  }

  function triggerDefeatedChangeAnimations(root, previousState, currentState, newUuids, generation, shouldAnimate) {
    if (shouldAnimate || !previousState.size) return;

    requestAnimationFrame(() => {
      if (generation !== getOverlayGeneration() || !root.isConnected) return;

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
      if (generation !== getOverlayGeneration() || !root.isConnected) return;

      compactionSides.forEach((side) => {
        const renderSide = getRenderSide(side);
        const slots = [...root.querySelectorAll(`.vs-fighter-slot[data-side="${renderSide}"][data-uuid]`)]
          .filter((slot) => slot.dataset.uuid && !newUuids.has(slot.dataset.uuid));

        slots.forEach((slot, index) => {
          const fromX = renderSide === "right" ? "5%" : "-5%";
          const cutX = renderSide === "right" ? "-1.2%" : "1.2%";

          slot.animate(
            [
              { opacity: 0.72, transform: `translateX(${fromX})` },
              { opacity: 1, transform: `translateX(${cutX})`, offset: 0.42 },
              { opacity: 1, transform: "translateX(0)" }
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

  function triggerRepositionAnimations(root, previousLayout, newUuids, compactionSides, generation, shouldAnimate) {
    if (shouldAnimate || !previousLayout?.size) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;
    const compactingSides = new Set([...compactionSides].map(getRenderSide));

    root.getBoundingClientRect();
    requestAnimationFrame(() => {
      if (generation !== getOverlayGeneration() || !root.isConnected) return;
      const newEntrySides = new Set([...newUuids].map((uuid) => {
        const slot = root.querySelector(`.vs-fighter-slot[data-uuid="${escapeSelector(uuid)}"]`);
        return slot ? getRenderSide(slot.dataset.side) : null;
      }).filter(Boolean));

      root.querySelectorAll(".vs-fighter-slot[data-uuid]").forEach((slot) => {
        const uuid = slot.dataset.uuid;
        if (!uuid || newUuids.has(uuid)) return;

        const previous = previousLayout.get(uuid);
        if (!previous) return;
        const currentSide = getRenderSide(slot.dataset.side);
        const previousSide = getRenderSide(previous.side);
        if (currentSide !== previousSide || compactingSides.has(currentSide) || newEntrySides.has(currentSide)) return;

        const current = slot.getBoundingClientRect();
        const deltaX = previous.left - current.left;
        const deltaY = previous.top - current.top;
        if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return;

        const distance = Math.hypot(deltaX, deltaY);

        slot.classList.add("is-repositioning");
        slot.animate(
          [
            { transform: `translate(${deltaX}px, ${deltaY}px)` },
            { transform: "translate(0, 0)" }
          ],
          {
            duration: Math.min(340, Math.max(220, distance * 0.72)),
            easing: "cubic-bezier(0.2, 0, 0, 1)",
            fill: "both"
          }
        ).finished.finally(() => {
          if (!slot.isConnected) return;
          slot.classList.remove("is-repositioning");
        });
      });
    });
  }

  async function scheduleOverlayEnter(root, generation, shouldAnimate) {
    if (!shouldAnimate) return;

    root.getBoundingClientRect();
    await Promise.race([
      preloadPanelImages(root),
      new Promise((resolve) => window.setTimeout(resolve, 520))
    ]);

    requestAnimationFrame(() => {
      if (generation !== getOverlayGeneration() || !root.isConnected) return;
      root.classList.remove("is-entering");
      root.getBoundingClientRect();
      root.classList.add("is-entering");
      root.classList.remove("is-enter-prep");

      waitForAnimation(root, 580).finally(() => {
        if (generation === getOverlayGeneration() && root.isConnected) root.classList.remove("is-entering");
      });
    });
  }

  function triggerNewEntryAnimations(root, newUuids, generation = getOverlayGeneration()) {
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
        if (generation !== getOverlayGeneration() || !slot.isConnected) return;

        const movement = slot.animate(
          [
            { opacity: 0, transform: `translateX(${fromX}) scaleX(0.78)` },
            { opacity: 1, transform: `translateX(${overshootX}) scaleX(1.025)`, offset: 0.72 },
            { opacity: 1, transform: "translateX(0) scaleX(1)" }
          ],
          {
            duration: 720,
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
        duration: 520,
        easing: "ease-out",
        pseudoElement: "::after"
      }
    );
  }

  async function playSlotExitAnimation(uuid, side) {
    const root = document.getElementById(overlayId);
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
        duration: 420,
        easing: "cubic-bezier(0.7, 0, 0.84, 0)",
        fill: "forwards"
      }
    ).finished.catch(() => {});
  }

  async function playDefeatedAnimation(uuid) {
    const root = document.getElementById(overlayId);
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
          { filter: "brightness(1.18) grayscale(0.15)", offset: 0.2 },
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
    const root = document.getElementById(overlayId);
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
          duration: 600,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)"
        }
      ).finished,
      panel.animate(
        [
          { filter: "brightness(0.55) grayscale(1)" },
          { filter: "brightness(1.18) grayscale(0.15)", offset: 0.46 },
          { filter: "brightness(1) grayscale(0)" }
        ],
        {
          duration: 600,
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
        duration: 560,
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
        duration: 280,
        easing: "cubic-bezier(0.55, 0, 0.28, 1)",
        fill: "both",
        pseudoElement: "::after"
      }
    ).finished.catch(() => {});
  }

  async function playOverlayExitAnimation() {
    const root = document.getElementById(overlayId);
    if (!root) return;

    root.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
    root.classList.add("is-exiting");

    await waitForAnimation(root, 420);
  }

  return {
    cancelSlotAnimations,
    playDefeatedAnimation,
    playOverlayExitAnimation,
    playRecoveryAnimation,
    playSlotExitAnimation,
    scheduleOverlayEnter,
    triggerDefeatedChangeAnimations,
    triggerNewEntryAnimations,
    triggerRepositionAnimations,
    triggerSideCompactionAnimations
  };
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
