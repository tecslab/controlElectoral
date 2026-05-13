import { useEffect, useRef } from 'react'

export function useEnterSubmit(buttonSelector: string, condition: boolean = true) {
  const isSubmitting = useRef(false);

  useEffect(() => {
    if (!condition) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        // Prevent auto-repeat if user holds down the Enter key
        if (e.repeat) return;
        
        // Ignore if user is typing in a textarea
        if (e.target instanceof HTMLTextAreaElement) return;
        
        // Let other interactive elements trigger their own default Enter behavior
        if (e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement) {
           const targetNode = document.querySelector(buttonSelector);
           if (e.target !== targetNode) return;
        }

        e.preventDefault();
        
        if (isSubmitting.current) return;

        const saveBtn = document.querySelector(buttonSelector) as HTMLButtonElement | null;
        if (saveBtn && !saveBtn.disabled) {
          isSubmitting.current = true;
          saveBtn.click();
          // Unlock after 1 second to allow future submissions if there was an error
          setTimeout(() => { isSubmitting.current = false; }, 1000);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [buttonSelector, condition]);
}
