import { useState, useEffect } from 'react';

export const useKeyboard = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const detectKeyboard = () => {
      const visualViewport = window.visualViewport;
      if (!visualViewport) return;
      const windowHeight = window.innerHeight;
      const newKeyboardHeight = Math.max(0, windowHeight - visualViewport.height);
      setKeyboardHeight(newKeyboardHeight);
      setIsKeyboardOpen(newKeyboardHeight > 150);
    };

    window.visualViewport?.addEventListener('resize', detectKeyboard);
    detectKeyboard();
    return () => window.visualViewport?.removeEventListener('resize', detectKeyboard);
  }, []);

  return { keyboardHeight, isKeyboardOpen };
};