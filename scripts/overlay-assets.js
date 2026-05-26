const preloadedImages = new Map();

export function applyPanelImages(root) {
  root.querySelectorAll(".vs-fighter-panel[data-img]").forEach((panel) => {
    const image = panel.querySelector(".vs-fighter-image");
    if (image) image.style.backgroundImage = `url("${panel.dataset.img}")`;
  });
}

export function preloadPanelImages(root) {
  const srcs = [...root.querySelectorAll(".vs-fighter-panel[data-img]")]
    .map((panel) => panel.dataset.img)
    .filter(Boolean);

  return Promise.allSettled(srcs.map(preloadImage));
}

export function preloadImage(src) {
  if (preloadedImages.has(src)) return preloadedImages.get(src);

  const promise = new Promise((resolve) => {
    const image = new Image();
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    image.onload = finish;
    image.onerror = finish;
    image.src = src;

    if (image.decode) image.decode().then(finish).catch(finish);
  });

  preloadedImages.set(src, promise);
  return promise;
}
