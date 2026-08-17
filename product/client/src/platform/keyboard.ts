import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

export async function hideKeyboard(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Keyboard.hide();
  } catch {
    // Ignore if not supported on platform
  }
}

export async function showKeyboard(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Keyboard.show();
  } catch {
    // Ignore if not supported on platform
  }
}

export function initKeyboardHandling(onShow?: (info: { keyboardHeight: number }) => void, onHide?: () => void) {
  if (!Capacitor.isNativePlatform()) return () => {};

  const showListener = Keyboard.addListener('keyboardWillShow', (info) => {
    if (onShow) onShow(info);
  });

  const hideListener = Keyboard.addListener('keyboardWillHide', () => {
    if (onHide) onHide();
  });

  return () => {
    showListener.then((l) => l.remove()).catch(() => {});
    hideListener.then((l) => l.remove()).catch(() => {});
  };
}
