export function initViewport({ breakpoint = 1536, designWidth = 1920 } = {}) {
  const updateViewport = () => {
    const screenWidth = window.screen.width;
    const dpr = window.devicePixelRatio || 1;
    const realWidth = screenWidth / dpr;

    const meta = document.querySelector('meta[name="viewport"]');
    if (!meta) return;

    if (realWidth < breakpoint) {
      meta.setAttribute("content", "width=device-width, initial-scale=1");
      console.log("adaptive mode:", { realWidth, breakpoint });
    } else {
      const scale = realWidth / designWidth;
      meta.setAttribute(
        "content",
        `width=${designWidth}, initial-scale=${scale}, maximum-scale=${scale}, user-scalable=no`,
      );
      console.log("forced mode:", { realWidth, designWidth, scale });
    }
  };

  // Если DOM уже загружен, выполняем сразу, иначе ждём событие
  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", updateViewport);
  } else {
    updateViewport();
  }

  // Возвращаем функцию очистки (если нужно отменить)
  return () => {
    window.removeEventListener("DOMContentLoaded", updateViewport);
  };
}
