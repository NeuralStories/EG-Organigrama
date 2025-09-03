import React, { useState, useMemo, useRef } from 'react';

// Importamos los iconos que este componente necesita desde nuestro archivo centralizado.
import { LoaderIcon, MicIcon, LinkIcon, CodeIcon } from './Icons.jsx';

// --- TU COMPONENTE TASKITEM (Extraído directamente de tu código) ---
// La única modificación es la importación de los iconos.
export const TaskItem = ({ taskId, taskState, onStatusChange, onNoteChange, onRecord, onSummarize, onEditClick }) => {
    const { isRecording, isProcessing, activeTaskId } = onRecord;
    const { status, notes, is_editing } = taskState;
    const summarySeparator = '--- Resumen IA ---';
    const PARADO_TAG = '[state:parado]'; // Aseguramos que la constante esté disponible aquí.
    
    const [mainNotes, summaryText] = useMemo(() => {
        const rawNotes = notes || '';
        const userNotes = rawNotes.replace(PARADO_TAG, '').trim();
        const hasSummary = userNotes.includes(summarySeparator);
        const main = hasSummary ? userNotes.split(summarySeparator)[0].trim() : userNotes;
        const summary = hasSummary ? userNotes.split(summarySeparator)[1].trim() : null;
        return [main, summary];
    }, [notes]);
    
    const editorRef = useRef(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleContentUpdate = () => {
        if (editorRef.current) {
            const newContent = editorRef.current.innerHTML;
            if (newContent !== mainNotes) {
                const finalNotes = summaryText ? `${newContent}\n\n${summarySeparator}\n${summaryText}` : newContent;
                onNoteChange(taskId, { notes: finalNotes, is_editing: true }, false);
            }
        }
    };

    const handleSave = async () => {
        if (!editorRef.current) return;
        setIsSaving(true);
        const newContent = editorRef.current.innerHTML;
        const finalNotes = summaryText ? `${newContent}\n\n${summarySeparator}\n${summaryText}` : newContent;
        await onNoteChange(taskId, { notes: finalNotes, is_editing: false }, true);
        setIsSaving(false);
    };

    const handleDeleteSummary = () => {
        onNoteChange(taskId, { notes: mainNotes }, true);
    };
    
    const handleFormat = (command, value = null) => {
        if (editorRef.current) {
            editorRef.current.focus();
            document.execCommand(command, false, value);
            handleContentUpdate();
        }
    };

    const handleEmbed = () => {
        const embedCode = prompt('Pega aquí el código HTML para incrustar (ej: de Google Sheets):');
        if (embedCode && editorRef.current) {
            editorRef.current.focus();
            const wrapperHtml = `<div style="overflow: auto; width: 100%;">${embedCode}</div>`;
            document.execCommand('insertHTML', false, wrapperHtml);
            handleContentUpdate();
        }
    };

    return (
         <li className={`status-${status}`}>
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center gap-4">
                    <span className="task-title">{taskId}</span>
                    <div className="flex items-center flex-shrink-0">
                        <div className="task-status-selector" title="Cambiar estado">
                            <button onClick={() => onStatusChange(taskId, { status: 'pendiente' })} className={`status-btn pendiente ${status === 'pendiente' ? 'active' : ''}`}>Pendiente</button>
                            <button onClick={() => onStatusChange(taskId, { status: 'parado' })} className={`status-btn parado ${status === 'parado' ? 'active' : ''}`}>Parado</button>
                            <button onClick={() => onStatusChange(taskId, { status: 'aprobado' })} className={`status-btn aprobado ${status === 'aprobado' ? 'active' : ''}`}>Aprobado</button>
                        </div>
                        <button onClick={() => onEditClick(taskId, !is_editing)} className="btn-secondary text-xs px-2 py-1 ml-4">
                            {is_editing ? 'Cerrar' : 'Editar'}
                        </button>
                    </div>
                </div>
                
                <div className="border-t border-gray-200 pt-2 task-content-wrapper">
                    {is_editing ? (
                        <div className="mt-2">
                            <div className="editor-toolbar">
                                <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('bold')} title="Negrita"><b>B</b></button>
                                <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('italic')} title="Cursiva" style={{fontStyle: 'italic'}}>I</button>
                                <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('createLink', prompt('Introduce la URL:'))} title="Enlace"><LinkIcon /></button>
                                <button onMouseDown={(e) => e.preventDefault()} onClick={handleEmbed} title="Incrustar HTML"><CodeIcon /></button>
                            </div>
                            <div 
                                ref={editorRef}
                                className="rich-text-editor"
                                contentEditable={true}
                                onBlur={handleContentUpdate}
                                dangerouslySetInnerHTML={{ __html: mainNotes }}
                            />
                            <div className="flex items-center justify-between mt-2">
                                <div>
                                    <button onClick={() => onSummarize(taskId)} className="btn-secondary text-xs px-2 py-1" disabled={isProcessing || !mainNotes || isRecording || isSaving}>
                                        {(isProcessing && activeTaskId === taskId) ? <LoaderIcon /> : 'Resumen IA'}
                                    </button>
                                    {summaryText && (
                                        <button onClick={handleDeleteSummary} className="btn-danger text-xs px-2 py-1 ml-2">Borrar Resumen</button>
                                    )}
                                </div>
                                <div className="flex items-center">
                                     <button type="button" onClick={() => onRecord.handle(taskId)} className={`voice-btn ${isRecording && activeTaskId === taskId ? 'listening' : ''}`} disabled={isProcessing || isSaving}>
                                        {(isRecording && activeTaskId === taskId) ? <LoaderIcon /> : <MicIcon />}
                                     </button>
                                     <button type="button" onClick={handleSave} className="btn-success text-xs px-2 py-1 ml-2" disabled={isSaving || isProcessing || isRecording}>
                                        {isSaving ? <LoaderIcon /> : 'Guardar y Cerrar'}
                                     </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {mainNotes && (
                                <div 
                                    className="mt-2 text-sm text-gray-700 pl-1 w-full"
                                    dangerouslySetInnerHTML={{ __html: mainNotes }}>
                                </div>
                            )}
                            {summaryText && (
                                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <h4 className="font-semibold text-sm text-blue-800">Resumen de IA</h4>
                                    <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{summaryText}</p>
                                </div>
                            )}
                            {!mainNotes && !summaryText && (
                                <p className="text-xs text-gray-400 italic mt-2 pl-1">No hay notas para esta tarea. Haz clic en "Editar" para añadir contenido.</p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </li>
    );
};
