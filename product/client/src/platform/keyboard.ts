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

// NOTE: Keyboard event listeners (keyboardWillShow/Hide/DidShow/DidHide) are managed
// exclusively by KeyboardContext (src/context/KeyboardContext.tsx) which is the single
// authoritative keyboard state manager. Do not register additional Keyboard.addListener
// calls elsewhere — duplicate listeners cause stale state and excessive re-renders.
