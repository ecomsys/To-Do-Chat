// autorem.js

export function getScaleFactor(baseSiteWidth = 1536) {
  // Если ширина >= базовой — считаем динамически
  if (window.innerWidth >= baseSiteWidth) {
    return window.innerWidth / baseSiteWidth;
  }
  // Иначе — 1 (адаптивный режим)
  return 1;
}

export default function initAutoRem({
  baseSiteWidth = 1536,
  baseFontSize = 16,
} = {}) {
  const htmlElement = document.documentElement;

  function updateFontSize() {
    const screenWidth = window.innerWidth;
    const scaleFactor = screenWidth / baseSiteWidth;

    if (screenWidth >= baseSiteWidth) {
     
      const newFontSize = baseFontSize * scaleFactor;
      htmlElement.style.fontSize = `${newFontSize}px`;
      console.log("forced rem mode:", {
        screenWidth,
        baseSiteWidth,
        scaleFactor,
      });
    } else {
     
      htmlElement.style.fontSize = "1rem";
      console.log("adaptive rem mode:", { screenWidth });
    }
  }

  window.addEventListener("resize", updateFontSize);
  updateFontSize(); // Первый вызов

  return () => window.removeEventListener("resize", updateFontSize);
}
