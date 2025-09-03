import React, { useState, useRef } from 'react';
import { supabaseClient } from '../services/supabaseClient.js';
import { useAutosizeTextArea } from '../hooks/useAutosizeTextArea.js'; // Lo crearemos después
import { LoaderIcon, SparklesIcon, TrashIcon } from './Icons.jsx';

// --- TU COMPONENTE PHASESUMMARY ---
const PhaseSummary = ({ phase, allTasks, showNotification, user, summaryData, onSummaryUpdate, aiModel, openaiApiKey, studyData }) => {
    const [isLoading, setIsLoading] = useState(false);
    
    const phaseTaskIds = phase.sections?.flatMap(s => s.tasks || []) || [];
    const phaseTasks = allTasks.filter(t => phaseTaskIds.includes(t.task_id));
    const canTakeAction = phaseTasks.length > 0 && phaseTasks.some(t => t.status === 'aprobado');

    const handleGenerateSummary = async () => {
        if (!openaiApiKey) {
            showNotification('La clave de API de OpenAI no está configurada.', 'error');
            return;
        }
        setIsLoading(true);

        const taskNotes = phaseTasks
            .filter(t => t.status === 'aprobado' && t.notes)
            .map(t => `Tarea: ${t.task_id}\nNotas: ${t.notes.replace('[state:parado]', '').trim()}`)
            .join('\n\n');

        const prompt = `
            Eres un consultor de organización de empresas. Analiza la siguiente información de una fase de un estudio organizativo y genera un resumen contextual.
            El resumen debe explicar el estado actual de la fase, los puntos clave identificados a través de las notas de las tareas aprobadas y las posibles implicaciones o siguientes pasos.
            Fase: ${phase.title}
            Descripción de la fase: ${phase.sections[0]?.description || ''}
            Datos de las tareas aprobadas:
            ${taskNotes || 'No se han proporcionado notas para las tareas aprobadas.'}
            Basado en esta información, proporciona un resumen coherente y profesional en español.
        `;

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiApiKey}` },
                body: JSON.stringify({ model: aiModel, messages: [{ role: 'system', content: 'Eres un consultor de organización de empresas.' }, { role: 'user', content: prompt }] })
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            const generatedText = data.choices[0].message.content;

            const { error: upsertError } = await supabaseClient
                .from('phase_summaries')
                .upsert({ phase_id: phase.id, user_id: user.id, summary_text: generatedText }, { onConflict: 'phase_id, user_id' });
            if (upsertError) throw upsertError;

            showNotification('Resumen generado y guardado con éxito.', 'success');
            onSummaryUpdate();
        } catch (err) {
            showNotification(`Error al generar o guardar el resumen: ${err.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteSummary = async () => {
        setIsLoading(true);
        try {
            const { error } = await supabaseClient.from('phase_summaries').delete().match({ phase_id: phase.id, user_id: user.id });
            if (error) throw error;
            showNotification('Resumen eliminado con éxito.', 'success');
            onSummaryUpdate();
        } catch (err) {
            showNotification(`Error al eliminar el resumen: ${err.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="subsection mt-6 border-t-4 border-blue-200">
            <h3 className="text-lg font-bold">Resumen de Fase con IA</h3>
            <div className="mt-4">
                <div className="flex flex-wrap gap-4">
                    <button onClick={handleGenerateSummary} className="btn-success" disabled={!canTakeAction || isLoading}>
                        {isLoading ? <LoaderIcon /> : <SparklesIcon />} {isLoading ? 'Procesando...' : 'Generar / Actualizar Resumen'}
                    </button>
                     <button onClick={handleDeleteSummary} className="btn-danger" disabled={!canTakeAction || isLoading || !summaryData}>
                        {isLoading ? <LoaderIcon /> : <TrashIcon />} {isLoading ? 'Procesando...' : 'Eliminar Resumen'}
                    </button>
                </div>
                {!canTakeAction && <p className="text-sm text-gray-500 mt-3">Aprueba al menos una tarea de esta fase para poder generar un resumen.</p>}
                {summaryData && summaryData.summary_text && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                        <h4 className="font-bold mb-2">Resumen Guardado:</h4>
                        <p className="text-sm whitespace-pre-wrap">{summaryData.summary_text}</p>
                        <p className="text-xs text-gray-500 mt-2">Última actualización: {new Date(summaryData.created_at).toLocaleString()}</p>
                    </div>
                )}
            </div>
        </div>
    );
};


// --- TU COMPONENTE SUMMARIESSECTION ---
export const SummariesSection = ({ phaseSummaries, showNotification, aiModel, openaiApiKey, studyData }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [generalSummary, setGeneralSummary] = useState('');
    const summaryTextAreaRef = useRef(null);
    useAutosizeTextArea(summaryTextAreaRef, generalSummary);

    const handleGenerateGeneralSummary = async () => {
        if (!openaiApiKey) {
            showNotification('La clave de API de OpenAI no está configurada.', 'error');
            return;
        }
        if (phaseSummaries.length === 0) {
            showNotification("No hay resúmenes de fase para analizar. Genere al menos uno.", 'warning');
            return;
        }
        setIsLoading(true);
        setGeneralSummary('');

        const summariesText = phaseSummaries
            .map(s => {
                const phaseTitle = studyData.find(p => p.id === s.phase_id)?.title || s.phase_id;
                return `**${phaseTitle}**:\n${s.summary_text}`;
            })
            .join('\n\n');

        const prompt = `
            Eres un consultor de alta dirección. A continuación se presentan los resúmenes generados para cada fase de un estudio organizativo en la empresa EGEA. 
            Tu tarea es sintetizar todos estos resúmenes en un único Resumen Ejecutivo final.
            El resumen debe:
            1. Integrar los hallazgos clave de cada fase en una narrativa coherente.
            2. Identificar temas o problemas recurrentes que aparezcan en múltiples fases.
            3. Concluir con 3-4 recomendaciones estratégicas de alto nivel, priorizadas, basadas en la totalidad de los datos.
            **Resúmenes de Fase para Analizar:**
            ${summariesText}
            Por favor, genera el Resumen Ejecutivo final en español, con un tono profesional y directo, formateado para fácil lectura con párrafos y listas con viñetas.
        `;

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiApiKey}` },
                body: JSON.stringify({ model: aiModel, messages: [{ role: 'system', content: 'Eres un consultor de alta dirección.' }, { role: 'user', content: prompt }] })
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            const generatedText = data.choices[0].message.content;

            setGeneralSummary(generatedText);
            showNotification('Resumen general generado con éxito.', 'success');
        } catch (err) {
            showNotification(`Error al generar el resumen general: ${err.message}`, 'error');
            setGeneralSummary(`Error: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="subsection">
            <h2 className="text-xl font-bold mb-4">Resumen General del Estudio</h2>
            <div className="mb-6">
                <h3 className="font-bold text-lg mb-2">Resúmenes de Fase Acumulados</h3>
                {phaseSummaries && phaseSummaries.length > 0 ? (
                    <ul className="space-y-4">
                        {phaseSummaries.map(summary => {
                            const phase = studyData.find(p => p.id === summary.phase_id);
                            return (
                                <li key={summary.id} className="p-4 border rounded-lg bg-gray-50">
                                    <h4 className="font-bold text-md text-blue-700">{phase ? phase.title : 'Fase Desconocida'}</h4>
                                    <p className="text-sm text-gray-800 mt-2 whitespace-pre-wrap">{summary.summary_text}</p>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-500">Aún no se ha generado ningún resumen de fase. Ve a cada fase y genera los resúmenes para poder verlos aquí.</p>
                )}
            </div>
            <div className="border-t pt-6">
                 <h3 className="font-bold text-lg mb-2">Resumen Ejecutivo Final (IA)</h3>
                <div className="p-4 border-2 border-dashed border-gray-300 rounded-md mt-2 min-h-[200px] flex items-center justify-center">
                    {isLoading ? (
                        <div className="flex justify-center items-center flex-col text-center">
                            <LoaderIcon />
                            <p className="mt-2 text-gray-600">Generando resumen ejecutivo... <br/>Esto puede tardar un momento.</p>
                        </div>
                    ) : generalSummary ? (
                        <textarea
                            ref={summaryTextAreaRef}
                            readOnly
                            className="notes-textarea w-full p-2 bg-gray-50"
                            value={generalSummary}
                        />
                    ) : (
                        <p className="text-gray-500 text-center">Haga clic en el botón para generar un resumen ejecutivo de todo el estudio con la información disponible.</p>
                    )}
                </div>
                <div className="flex justify-end mt-4">
                    <button onClick={handleGenerateGeneralSummary} className="btn-action" disabled={isLoading}>
                        {isLoading ? <LoaderIcon /> : <SparklesIcon />} {isLoading ? 'Generando...' : 'Actualizar Resumen General'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Exportamos PhaseSummary para que pueda ser usado en la sección de fases
export { PhaseSummary };
