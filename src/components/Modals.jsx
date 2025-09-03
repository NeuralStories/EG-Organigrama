import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LoaderIcon, CopyIcon } from './Icons.jsx';

// --- TU COMPONENTE CONFIRMATIONMODAL ---
export const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
    return (
        <div className="modal-overlay">
            <div className="modal-content text-center">
                <p className="mb-4">{message}</p>
                <div className="flex justify-center gap-4">
                    <button onClick={onCancel} className="btn-secondary">Cancelar</button>
                    <button onClick={onConfirm} className="btn-danger">Confirmar</button>
                </div>
            </div>
        </div>
    );
};

// --- TU COMPONENTE GENERADORDESCRIPCIONMODAL ---
export const GeneradorDescripcionModal = ({ profile, onClose, openaiApiKey, aiModel, showNotification }) => {
    const [descripcion, setDescripcion] = useState('');
    const [isGenerating, setIsGenerating] = useState(true);
    const [copyButtonText, setCopyButtonText] = useState('Copiar');

    const buildPrompt = (profile) => {
        const formatList = (items, field) => items && items.length > 0 ? items.map(item => `- ${item[field]}`).join('\n') : 'No especificadas';
        const responsabilidades = formatList(profile.funciones, 'funcion');
        const requisitos = profile.competencias_tecnicas ? profile.competencias_tecnicas.split('\n').filter(r => r.trim() !== '').map(r => `- ${r}`).join('\n') : 'No especificados';

        return `
            Por favor, genera una descripción de puesto de trabajo profesional y atractiva en español para publicar en un portal de empleo. Utiliza un tono profesional y amigable.
            Aquí está la información detallada del puesto:
            - **Nombre de la empresa:** EGEA
            - **Nombre del puesto:** ${profile.nombre_puesto}
            - **Departamento / Área:** ${profile.departamento || 'No especificado'}
            - **Ubicación:** ${profile.ubicacion || 'No especificada'}
            - **Reporta a:** ${profile.reporta_a || 'No especificado'}
            - **Formación mínima requerida:** ${profile.formacion || 'No especificada'}
            - **Experiencia mínima requerida:** ${profile.experiencia || 'No especificada'}
            - **Horario:** ${profile.horario || 'No especificado'}
            - **Tipo de contrato:** ${profile.tipo_contrato || 'No especificado'}
            - **Modalidad de trabajo:** ${profile.modalidad_trabajo || 'No especificada'}
            **Responsabilidades Clave:**
            ${responsabilidades}
            **Requisitos Clave:**
            ${requisitos}
            **Instrucciones para la estructura:**
            1.  **Título del Puesto:** Usa el nombre del puesto proporcionado.
            2.  **Introducción:** Escribe un párrafo breve y atractivo sobre la oportunidad de unirse a EGEA.
            3.  **Responsabilidades Principales:** Crea una lista clara basada en las responsabilidades.
            4.  **Requisitos y Cualificaciones:** Detalla lo necesario para el puesto.
            5.  **Qué Ofrecemos:** Añade una sección sobre los beneficios.
            6.  **Llamada a la acción:** Termina con una invitación para aplicar.
            El resultado final debe ser un texto coherente y bien formateado. Usa negritas (con asteriscos) para los subtítulos.
        `;
    };

    const generateDescription = useCallback(async () => {
        const prompt = buildPrompt(profile);
        setIsGenerating(true);
        setDescripcion('');
        try {
            if (!openaiApiKey) throw new Error('La clave de API de OpenAI no está configurada.');
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiApiKey}` },
                body: JSON.stringify({ model: aiModel, messages: [{ role: 'system', content: 'Eres un asistente de RRHH experto en redactar ofertas de empleo.' }, { role: 'user', content: prompt }] })
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            let text = data.choices[0].message.content;
            text = text.replace(/\*\*(.*?)\*\*/g, '<h3 class="text-md font-bold mt-3 mb-1">$1</h3>');
            text = text.replace(/\n/g, '<br />');
            setDescripcion(text);
        } catch (error) {
            setDescripcion(`Hubo un error al generar la descripción: ${error.message}`);
            showNotification(error.message, 'error');
        } finally {
            setIsGenerating(false);
        }
    }, [profile, openaiApiKey, aiModel, showNotification]);

    useEffect(() => {
        generateDescription();
    }, [generateDescription]);
    
    const handleCopy = () => {
        const contentEl = document.getElementById('generated-description-content');
        if (contentEl) {
            navigator.clipboard.writeText(contentEl.innerText).then(() => {
                setCopyButtonText('¡Copiado!');
                setTimeout(() => setCopyButtonText('Copiar'), 2000);
            }, (err) => {
                showNotification('Error al copiar texto.', 'error');
            });
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content modal-content-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Descripción de Puesto Generada con {aiModel}</h2>
                    <button onClick={onClose} className="text-2xl font-bold">&times;</button>
                </div>
                <div className="p-4 border rounded-md bg-gray-50 max-h-[60vh] overflow-y-auto">
                    {isGenerating ? (
                        <div className="flex flex-col items-center justify-center h-40">
                            <LoaderIcon />
                            <p className="mt-2 text-gray-600">Generando descripción con IA...</p>
                        </div>
                    ) : (
                        <div id="generated-description-content" dangerouslySetInnerHTML={{ __html: descripcion }}></div>
                    )}
                </div>
                <div className="flex justify-end gap-4 mt-4">
                    <button onClick={handleCopy} className="btn-action" disabled={isGenerating}>
                        <CopyIcon /> {copyButtonText}
                    </button>
                    <button onClick={onClose} className="btn-secondary">Cerrar</button>
                </div>
            </div>
        </div>
    );
};
