import { useEffect } from 'react';

export const useAutosizeTextArea = (textAreaRef, value) => {
    useEffect(() => {
        if (textAreaRef && textAreaRef.current) {
            textAreaRef.current.style.height = "0px";
            const scrollHeight = textAreaRef.current.scrollHeight;
            textAreaRef.current.style.height = scrollHeight + "px";
        }
    }, [textAreaRef, value]);
};
