import React, { useState } from 'react';

// --- TU COMPONENTE SUMMARIESSECTION (Extraído directamente de tu código) ---
// --- MODIFICADO PARA SER MÁS SEGURO Y NO BLOQUEARSE ---
export const SummariesSection = ({ jobProfiles, openaiApiKey, aiModel }) => {
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const generateSummary = async () => {
        if (!openaiApiKey) {
            setError('Por favor, configura tu API Key de OpenAI en los ajustes.');
            return;
        }

        // --- CAMBIO CLAVE: Verificación de seguridad para evitar el crash ---
        // Si jobProfiles no es un array o está vacío, no continúa.
        if (!Array.isArray(jobProfiles) || jobProfiles.length === 0) {
            setError('No hay fichas de puesto disponibles para generar un resumen.');
            return;
        }

        setIsLoading(true);
        setError('');
        setSummary('');

        const profilesText = jobProfiles.map(p => 
            `Puesto: ${p.nombre_puesto}, Departamento: ${p.departamento}, Funciones: ${p.funciones ? p.funciones.map(f => f.funcion).join(', ') : 'N/A'}`
        ).join('\n');

        const systemPrompt = "Eres un analista de Recursos Humanos. Tu tarea es analizar una lista de perfiles de puestos de trabajo y generar un resumen ejecutivo conciso sobre la estructura de la plantilla.";
        const userPrompt = `Basado en la siguiente lista de perfiles, genera un resumen de 2 o 3 párrafos sobre la composición de la plantilla. Destaca los departamentos con más personal y los roles más comunes. \n\nPerfiles:\n${profilesText}`;

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openaiApiKey}`
                },
                body: JSON.stringify({
                    model: aiModel,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.5,
                    max_tokens: 400,
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message || `Error del servidor de OpenAI`);
            }

            const data = await response.json();
            setSummary(data.choices[0].message.content);
        } catch (e) {
            setError(`Error al generar el resumen: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div className="phase-header">
                <h2>Resúmenes con IA</h2>
                <p>Genera análisis y resúmenes sobre la estructura de la plantilla utilizando la IA.</p>
            </div>

            <div className="subsection">
                <h3>Análisis de la Plantilla</h3>
                <button 
                    onClick={generateSummary} 
                    className="btn-action" 
                    disabled={isLoading}
                >
                    {isLoading ? 'Generando...' : 'Generar Resumen Ejecutivo'}
                </button>
                
                {error && <p className="text-red-500 mt-4">{error}</p>}
                
                {summary && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-md border">
                        <h4 className="font-semibold mb-2">Resumen Generado:</h4>
                        <p className="text-gray-700 whitespace-pre-wrap">{summary}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
