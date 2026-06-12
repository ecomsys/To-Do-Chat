import { useState, useEffect } from 'react';

export const useKeyboard = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const detectKeyboard = () => {
      const visualViewport = window.visualViewport;
      if (!visualViewport) return;

      // Получаем текущую высоту окна
      const windowHeight = window.innerHeight;
      // Вычисляем высоту клавиатуры как разницу
      const newKeyboardHeight = Math.max(0, windowHeight - visualViewport.height);

      setKeyboardHeight(newKeyboardHeight);
      // Считаем клавиатуру открытой, если её высота больше условных 150px
      setIsKeyboardOpen(newKeyboardHeight > 150);
    };

    // Подписываемся на изменение visualViewport
    window.visualViewport?.addEventListener('resize', detectKeyboard);
    // Вызываем функцию для первоначальной установки
    detectKeyboard();

    return () => {
      window.visualViewport?.removeEventListener('resize', detectKeyboard);
    };
  }, []);

  return { keyboardHeight, isKeyboardOpen };
};