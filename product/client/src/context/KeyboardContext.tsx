import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Keyboard, KeyboardInfo } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

export interface KeyboardState {
  isKeyboardOpen: boolean;
  keyboardHeight: number;
  scrollToActiveInput: (element?: HTMLElement | null) => void;
}

const KeyboardContext = createContext<KeyboardState>({
  isKeyboardOpen: false,
  keyboardHeight: 0,
  scrollToActiveInput: () => {},
});

export const KeyboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const activeElementRef = useRef<HTMLElement | null>(null);

  const updateCssVariables = useCallback((open: boolean, height: number) => {
    if (typeof document === 'undefined') return;

    const docEl = document.documentElement;
    const body = document.body;

    if (open && height > 0) {
      docEl.style.setProperty('--keyboard-height', `${height}px`);
      docEl.setAttribute('data-keyboard-open', 'true');
      body.setAttribute('data-keyboard-open', 'true');
    } else {
      docEl.style.setProperty('--keyboard-height', '0px');
      docEl.removeAttribute('data-keyboard-open');
      body.removeAttribute('data-keyboard-open');
    }
  }, []);

  const scrollToActiveInput = useCallback((targetElement?: HTMLElement | null) => {
    if (typeof window === 'undefined') return;

    const el = targetElement || (document.activeElement as HTMLElement | null);
    if (!el) return;

    const tagName = el.tagName?.toLowerCase();
    const isInput = tagName === 'input' || tagName === 'textarea' || el.isContentEditable;
    if (!isInput) return;

    // Small timeout to allow the software keyboard animation / webview resize to settle
    window.setTimeout(() => {
      try {
        el.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      } catch {
        // Fallback for older browsers
        el.scrollIntoView(false);
      }
    }, 150);
  }, []);

  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();

    if (isNative) {
      let isMounted = true;

      const handleWillShow = (info: KeyboardInfo) => {
        if (!isMounted) return;
        const height = info.keyboardHeight || 0;
        setIsKeyboardOpen(true);
        setKeyboardHeight(height);
        updateCssVariables(true, height);
        scrollToActiveInput(activeElementRef.current);
      };

      const handleDidShow = (info: KeyboardInfo) => {
        if (!isMounted) return;
        const height = info.keyboardHeight || 0;
        setIsKeyboardOpen(true);
        setKeyboardHeight(height);
        updateCssVariables(true, height);
        scrollToActiveInput(activeElementRef.current);
      };

      const handleWillHide = () => {
        if (!isMounted) return;
        setIsKeyboardOpen(false);
        setKeyboardHeight(0);
        updateCssVariables(false, 0);
      };

      const handleDidHide = () => {
        if (!isMounted) return;
        setIsKeyboardOpen(false);
        setKeyboardHeight(0);
        updateCssVariables(false, 0);
      };

      const willShowSub = Keyboard.addListener('keyboardWillShow', handleWillShow);
      const didShowSub = Keyboard.addListener('keyboardDidShow', handleDidShow);
      const willHideSub = Keyboard.addListener('keyboardWillHide', handleWillHide);
      const didHideSub = Keyboard.addListener('keyboardDidHide', handleDidHide);

      return () => {
        isMounted = false;
        willShowSub.then((s) => s.remove()).catch(() => {});
        didShowSub.then((s) => s.remove()).catch(() => {});
        willHideSub.then((s) => s.remove()).catch(() => {});
        didHideSub.then((s) => s.remove()).catch(() => {});
        updateCssVariables(false, 0);
      };
    } else {
      // Fallback for mobile browser preview / desktop viewport emulation
      const visualViewport = window.visualViewport;

      const handleViewportResize = () => {
        if (!visualViewport) return;

        const screenHeight = window.innerHeight;
        const viewportHeight = visualViewport.height;
        const diff = screenHeight - viewportHeight;

        // Consider keyboard open if the height shrunk significantly (> 120px) on mobile/touch screen
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isOpen = diff > 120 && (isTouch || window.innerWidth < 1024);
        const height = isOpen ? Math.round(diff) : 0;

        setIsKeyboardOpen(isOpen);
        setKeyboardHeight(height);
        updateCssVariables(isOpen, height);

        if (isOpen) {
          scrollToActiveInput(activeElementRef.current);
        }
      };

      if (visualViewport) {
        visualViewport.addEventListener('resize', handleViewportResize);
        visualViewport.addEventListener('scroll', handleViewportResize);
      } else {
        window.addEventListener('resize', handleViewportResize);
      }

      return () => {
        if (visualViewport) {
          visualViewport.removeEventListener('resize', handleViewportResize);
          visualViewport.removeEventListener('scroll', handleViewportResize);
        } else {
          window.removeEventListener('resize', handleViewportResize);
        }
        updateCssVariables(false, 0);
      };
    }
  }, [updateCssVariables, scrollToActiveInput]);

  // Global focus listener to track focused inputs and trigger auto-scroll
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const tagName = target.tagName?.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || target.isContentEditable) {
        activeElementRef.current = target;
        // On mobile devices, ensure the element scrolls into view smoothly
        if (window.innerWidth < 1024 || 'ontouchstart' in window) {
          scrollToActiveInput(target);
        }
      }
    };

    const handleFocusOut = () => {
      activeElementRef.current = null;
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, [scrollToActiveInput]);

  return (
    <KeyboardContext.Provider
      value={{
        isKeyboardOpen,
        keyboardHeight,
        scrollToActiveInput,
      }}
    >
      {children}
    </KeyboardContext.Provider>
  );
};

export const useKeyboardState = (): KeyboardState => {
  return useContext(KeyboardContext);
};

export default KeyboardProvider;
