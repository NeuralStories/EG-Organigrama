import React, { useState, useEffect } from 'react';
import { supabaseClient } from '../services/supabaseClient.js';
import { useAutosizeTextArea } from '../hooks/useAutosizeTextArea.js';

// --- TU COMPONENTE MODALS (Extraído directamente de tu código) ---
export const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <p>{message}</p>
                <div className="modal-actions">
                    <button onClick={onCancel} className="btn-secondary">Cancelar</button>
                    <button onClick={onConfirm} className="btn-danger">Confirmar</button>
                </div>
            </div>
        </div>
    );
};

// MODIFICACIÓN: Añadida la palabra 'export' para que el componente pueda ser importado
export const ApiKeySettingsModal = ({ onClose, apiKey, setApiKey, model, setModel }) => {
    const [localApiKey, setLocalApiKey] = useState(apiKey);
    const [localModel, setLocalModel] = useState(model);

    const handleSave = () => {
        localStorage.setItem('openaiApiKey', localApiKey);
        localStorage.setItem('aiModel', localModel);
        setApiKey(localApiKey);
        setModel(localModel);
        onClose();
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <h2>Configuración de API</h2>
                <label htmlFor="apiKey">OpenAI API Key</label>
                <input
                    type="password"
                    id="apiKey"
                    className="form-input"
                    value={localApiKey}
                    onChange={(e) => setLocalApiKey(e.target.value)}
                    placeholder="Introduce tu API Key de OpenAI"
                />
                <label htmlFor="aiModel">Modelo de IA</label>
                <select 
                    id="aiModel"
                    className="form-select"
                    value={localModel}
                    onChange={(e) => setLocalModel(e.target.value)}
                >
                    <option value="gpt-3.5-turbo">GPT-3.5-Turbo</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4-turbo">GPT-4-Turbo</option>
                </select>
                <div className="modal-actions">
                    <button onClick={onClose} className="btn-secondary">Cancelar</button>
                    <button onClick={handleSave} className="btn-action">Guardar</button>
                </div>
            </div>
        </div>
    );
};

export const GeneradorDescripcionModal = ({ profile, onClose, openaiApiKey, aiModel, showNotification }) => {
    const [generatedText, setGeneratedText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const textareaRef = useAutosizeTextArea(generatedText);

    const generateDescription = async () => {
        if (!openaiApiKey) {
            showNotification('Por favor, configura tu API Key de OpenAI en los ajustes.', 'warning');
            return;
        }
        setIsLoading(true);
        setGeneratedText('');

        const systemPrompt = `Eres un experto en Recursos Humanos especializado en la creación de descripciones de puestos de trabajo. Tu tarea es generar una descripción de puesto profesional, clara y atractiva. Utiliza un tono formal y un lenguaje inclusivo.`;
        const userPrompt = `Basándote en la siguiente información de una ficha de puesto, genera una descripción completa y profesional para el propósito general del puesto:
        - Puesto: ${profile.nombre_puesto || 'No especificado'}
        - Departamento: ${profile.departamento || 'No especificado'}
        - Reporta a: ${profile.reporta_a || 'No especificado'}
        - Funciones principales: ${profile.funciones ? profile.funciones.map(f => f.funcion).join(', ') : 'No especificadas'}
        - Competencias técnicas clave: ${profile.competencias_tecnicas || 'No especificadas'}
        - Competencias transversales: ${profile.competencias_transversales || 'No especificadas'}
        - Formación requerida: ${profile.formacion || 'No especificada'}
        - Experiencia requerida: ${profile.experiencia || 'No especificada'}
        
        Genera un párrafo conciso y bien redactado que resuma el propósito del puesto.`;

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
                    temperature: 0.7,
                    max_tokens: 250,
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message || `Error del servidor de OpenAI: ${response.statusText}`);
            }

            const data = await response.json();
            setGeneratedText(data.choices[0].message.content.trim());
            showNotification('Descripción generada con éxito.', 'success');
        } catch (error) {
            showNotification(`Error al generar la descripción: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(generatedText).then(() => {
            showNotification('Texto copiado al portapapeles.', 'info');
        });
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content" style={{maxWidth: '600px'}}>
                <h2>Generador de Descripciones con IA</h2>
                <p className="text-sm mb-4">Pulsa el botón para generar una propuesta de "propósito del puesto" basada en la información de la ficha.</p>
                
                <textarea
                    ref={textareaRef}
                    className="form-textarea w-full"
                    rows="8"
                    value={generatedText}
                    readOnly
                    placeholder="La descripción generada por la IA aparecerá aquí..."
                />
                
                {generatedText && (
                    <button onClick={handleCopyToClipboard} className="btn-secondary text-sm mt-2">Copiar al portapapeles</button>
                )}

                <div className="modal-actions mt-4">
                    <button onClick={onClose} className="btn-secondary">Cerrar</button>
                    <button onClick={generateDescription} className="btn-action" disabled={isLoading}>
                        {isLoading ? 'Generando...' : 'Generar Descripción'}
                    </button>
                </div>
            </div>
        </div>
    );
};
