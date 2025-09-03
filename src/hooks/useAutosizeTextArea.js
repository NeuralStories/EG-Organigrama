import { useEffect } from 'react';

// --- TU HOOK PERSONALIZADO (Extraído directamente de tu código) ---
// Este hook se encarga de ajustar la altura de un textarea automáticamente.
export const useAutosizeTextArea = (textAreaRef, value) => {
    useEffect(() => {
        if (textAreaRef && textAreaRef.current) {
            textAreaRef.current.style.height = "0px";
            const scrollHeight = textAreaRef.current.scrollHeight;
            textAreaRef.current.style.height = scrollHeight + "px";
        }
    }, [textAreaRef, value]);
};
