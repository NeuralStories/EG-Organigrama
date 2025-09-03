import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { LoaderIcon } from './Icons.jsx';

// --- TU COMPONENTE ORGANIGRAMA (Extraído directamente de tu código) ---
export const Organigrama = ({ jobProfiles, showNotification, predefinedOptions, onEditProfile, aiModel, openaiApiKey }) => {
    const [chartData, setChartData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [nodePositions, setNodePositions] = useState({});
    const containerRef = useRef(null);

    const generateAndSetChartData = useCallback(async () => {
        if (!predefinedOptions || !predefinedOptions.puestos) {
            setIsLoading(false);
            return;
        }
        if (!openaiApiKey) {
            setError('La clave de API de OpenAI no está configurada.');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        const prompt = `
            Analiza la siguiente lista de puestos de una empresa y los empleados asignados a cada uno.
            La jerarquía es implícita en los nombres de los puestos (ej: Director > Jefe > Especialista). Todos los roles que no reportan a nadie deben depender de un nodo raíz llamado "Dirección".
            Tu tarea es crear una estructura jerárquica en formato JSON que represente TODOS los puestos definidos, incluso si no tienen empleados asignados.

            Puestos definidos en la empresa:
            ${JSON.stringify(predefinedOptions.puestos)}

            Empleados actuales y sus puestos:
            ${JSON.stringify(jobProfiles.map(p => ({ id: p.id, name: p.nombre_apellidos, role: p.nombre_puesto })))}

            Crea un objeto JSON con un único nodo raíz "Dirección". Cada nodo debe tener:
            - "id": El nombre del puesto.
            - "name": El nombre del puesto.
            - "employees": Un array de objetos, donde cada objeto tiene "id" y "name" del empleado en ese puesto (puede ser un array vacío).
            - "children": Un array de los nodos de los puestos que le reportan directamente.

            Por favor, devuelve solo el objeto JSON, sin ningún texto o explicación adicional.
        `;

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiApiKey}` },
                body: JSON.stringify({ model: aiModel, messages: [{ role: 'system', content: 'Eres un experto en organigramas empresariales.' }, { role: 'user', content: prompt }] })
            });
            const responseData = await response.json();
            if (responseData.error) throw new Error(responseData.error.message);
            let jsonString = responseData.choices[0].message.content;

            jsonString = jsonString.replace(/```json\n|```/g, '').trim();
            const parsedData = JSON.parse(jsonString);
            setChartData(parsedData);

        } catch (err) {
            console.error("Error generating org chart:", err);
            setError(`Error al generar el organigrama con IA: ${err.message}. Intenta de nuevo o revisa la configuración.`);
            showNotification(`Error al generar organigrama: ${err.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [jobProfiles, showNotification, predefinedOptions, aiModel, openaiApiKey]);

    useEffect(() => {
        generateAndSetChartData();
    }, [generateAndSetChartData]);

    useLayoutEffect(() => {
        if (!chartData || !containerRef.current) return;
        
        const positions = {};
        const nodes = containerRef.current.querySelectorAll('.org-chart-node');
        nodes.forEach(node => {
            const id = node.dataset.id;
            if (id) {
                const rect = node.getBoundingClientRect();
                const containerRect = containerRef.current.getBoundingClientRect();
                positions[id] = {
                    x: rect.left - containerRect.left + rect.width / 2,
                    y: rect.top - containerRect.top
                };
            }
        });
        setNodePositions(positions);
    }, [chartData]);


    const renderNode = (node) => (
        <li key={node.id}>
            <div className="org-chart-node" data-id={node.id}>
                <p className="role">{node.name}</p>
                {node.employees && node.employees.map(emp => (
                    <div key={emp.id} className="flex justify-between items-center">
                        <p className="name">{emp.name}</p>
                        <button onClick={() => onEditProfile(emp.id)} className="edit-org-btn">✎</button>
                    </div>
                ))}
            </div>
            {node.children && node.children.length > 0 && (
                <ul>
                    {node.children.map(child => renderNode(child))}
                </ul>
            )}
        </li>
    );
    
    const renderLines = (node) => {
        if (!node || !node.children || node.children.length === 0) {
            return [];
        }
        const parentPos = nodePositions[node.id];
        if (!parentPos) {
            return [];
        }

        return node.children.flatMap(child => {
            const childPos = nodePositions[child.id];
            if (!childPos) {
                return [];
            }
            const childLines = renderLines(child);
            return [
                <path
                    key={`${node.id}-${child.id}`}
                    d={`M ${parentPos.x} ${parentPos.y + 50} C ${parentPos.x} ${parentPos.y + 70}, ${childPos.x} ${childPos.y - 20}, ${childPos.x} ${childPos.y}`}
                    stroke="var(--border-color)"
                    strokeWidth="2"
                    fill="none"
                />,
                ...(childLines || [])
            ];
        });
    };

    if (isLoading) {
        return <div className="flex justify-center items-center p-10"><LoaderIcon /> <p className="ml-4">Generando organigrama con IA...</p></div>;
    }
    if (error) {
        return <div className="text-red-500 bg-red-100 p-4 rounded-md">{error}</div>;
    }
    if (!chartData) {
        return <p>No hay datos de empleados para mostrar el organigrama.</p>;
    }

    return (
        <div className="subsection">
            <h2 className="text-xl font-bold mb-4">Organigrama de la Empresa</h2>
            <div className="org-chart-container" ref={containerRef}>
                <div className="org-chart">
                    <ul>{renderNode(chartData)}</ul>
                </div>
                <svg className="absolute top-0 left-0 w-full h-full" style={{ zIndex: -1, pointerEvents: 'none' }}>
                    {renderLines(chartData)}
                </svg>
            </div>
        </div>
    );
};
