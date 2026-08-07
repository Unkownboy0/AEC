import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

export function initKeyboardHandling(onShow?: (info: { keyboardHeight: number }) => void, onHide?: () => void) {
  if (!Capacitor.isNativePlatform()) return () => {};

  const showListener = Keyboard.addListener('keyboardWillShow', (info) => {
    if (onShow) onShow(info);
  });

  const hideListener = Keyboard.addListener('keyboardWillHide', () => {
    if (onHide) onHide();
  });

  return () => {
    showListener.then((l) => l.remove());
    hideListener.then((l) => l.remove());
  };
}
