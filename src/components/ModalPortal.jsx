'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

let activeModalsCount = 0;
let originalOverflow = '';
let originalPaddingRight = '';

export function lockBodyScroll() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (activeModalsCount === 0) {
    originalOverflow = document.body.style.overflow;
    originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = 'hidden';
  }
  activeModalsCount++;
}

export function unlockBodyScroll() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  activeModalsCount = Math.max(0, activeModalsCount - 1);
  if (activeModalsCount === 0) {
    document.body.style.overflow = originalOverflow || '';
    document.body.style.paddingRight = originalPaddingRight || '';
  }
}

export function useModalScrollLock(isOpen, onClose) {
  useEffect(() => {
    if (!isOpen) return;
    lockBodyScroll();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unlockBodyScroll();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);
}

export default function ModalPortal({ children, isOpen, onClose }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !mounted) return;
    lockBodyScroll();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unlockBodyScroll();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, mounted, onClose]);

  if (!mounted || !isOpen) return null;
  return createPortal(children, document.body);
}
