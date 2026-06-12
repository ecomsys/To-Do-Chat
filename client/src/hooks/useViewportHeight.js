import { useState, useEffect } from "react";

export function useViewportHeight() {
  const [height, setHeight] = useState(
    // Начальная высота
    window.visualViewport?.height || window.innerHeight
  );

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return; // Если браузер совсем старый, игнорим

    const handleResize = () => {
      // Обновляем высоту при любом изменении (выезд клавиатуры, тулбара, поворот экрана)
      setHeight(vv.height);
    };

    // Слушаем и изменение размера, и скролл (иногда Firefox триггерит скролл при появлении тулбара)
    vv.addEventListener("resize", handleResize);
    vv.addEventListener("scroll", handleResize);

    return () => {
      vv.removeEventListener("resize", handleResize);
      vv.removeEventListener("scroll", handleResize);
    };
  }, []);

  return height;
}