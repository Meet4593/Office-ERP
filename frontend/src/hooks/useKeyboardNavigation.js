import { useCallback } from 'react';

export default function useKeyboardNavigation() {
  const handleKeyDown = useCallback((e) => {
    // Only handle ArrowUp, ArrowDown, and Enter
    if (!['ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) return;

    // Do not interfere if user is holding Shift/Ctrl/Alt or interacting with a multi-line input
    if (e.shiftKey || e.ctrlKey || e.altKey) return;
    if (e.target.tagName.toLowerCase() === 'textarea') return;
    // Don't interfere with dropdowns/selects natively using arrows, but simple inputs are fine
    if (e.target.tagName.toLowerCase() === 'select') return;
    
    // Crucial fix: Let MUI Autocomplete handle ArrowUp/ArrowDown for list navigation
    if (e.target.getAttribute('role') === 'combobox' && ['ArrowUp', 'ArrowDown'].includes(e.key)) return;

    // Let buttons handle Enter key natively to trigger click events
    if (e.target.tagName.toLowerCase() === 'button' && e.key === 'Enter') return;


    // Get all focusable input elements within the current form or the closest parent container
    const container = e.target.closest('form') || e.target.closest('.MuiBox-root') || document.body;
    
    // Select input, button, and select elements that are not disabled and are visible
    const focusableSelector = 'input:not([disabled]):not([type="hidden"]), button:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusableElements = Array.from(container.querySelectorAll(focusableSelector)).filter(
      (el) => el.offsetWidth > 0 && el.offsetHeight > 0 // visible check
    );

    const index = focusableElements.indexOf(e.target);
    if (index === -1) return;

    let nextIndex = index;
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      nextIndex = index + 1;
    } else if (e.key === 'ArrowUp') {
      nextIndex = index - 1;
    }

    if (nextIndex >= 0 && nextIndex < focusableElements.length) {
      e.preventDefault();
      focusableElements[nextIndex].focus();
      
      // If it's an input field (but not a checkbox/radio), select its text for easy overwriting
      const nextEl = focusableElements[nextIndex];
      if (nextEl.tagName.toLowerCase() === 'input' && !['checkbox', 'radio'].includes(nextEl.type)) {
        setTimeout(() => nextEl.select(), 0);
      }
    }
  }, []);

  return handleKeyDown;
}
