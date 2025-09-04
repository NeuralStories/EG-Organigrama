import React, { useEffect, useRef } from 'react';
import { OrgChart } from './OrgChart.js'; 

// --- MODIFICADO PARA SER MÁS SEGURO Y NO BLOQUEARSE ---
export const Organigrama = ({ jobProfiles, onProfileClick }) => {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        // --- CAMBIO CLAVE: Verificación de seguridad para evitar el crash ---
        // Si jobProfiles no es un array, o si el contenedor no está listo, no hace nada.
        if (!Array.isArray(jobProfiles) || !chartContainerRef.current) {
            return;
        }

        // Transforma los datos de Supabase al formato que espera d3-org-chart
        const nodes = jobProfiles.map(profile => ({
            id: profile.id.toString(),
            parentId: profile.reporta_a_id ? profile.reporta_a_id.toString() : null, // Asume que tienes un `reporta_a_id`
            name: profile.nombre_apellidos,
            positionName: profile.nombre_puesto,
            department: profile.departamento,
            imageUrl: profile.avatar_url || 'https://via.placeholder.com/100', // Un avatar por defecto
            _profileData: profile // Almacenamos el perfil completo para el evento de clic
        }));
        
        if (!chartRef.current) {
            chartRef.current = new OrgChart()
                .container(chartContainerRef.current)
                .data(nodes)
                .nodeWidth(() => 250)
                .nodeHeight(() => 120)
                .onNodeClick((d) => {
                    const profileData = d._profileData;
                    if (profileData && onProfileClick) {
                        onProfileClick(profileData);
                    }
                })
                .nodeContent(function (d, i, arr, state) {
                    return `
                        <div style="font-family: Arial, sans-serif; background-color: #fff; border-radius: 5px; border: 1px solid #ccc; width: ${d.width}px; height: ${d.height}px;">
                            <div style="display: flex; align-items: center; padding: 10px;">
                                <img src="${d.data.imageUrl}" style="width: 60px; height: 60px; border-radius: 50%; margin-right: 10px;">
                                <div style="line-height: 1.4;">
                                    <div style="font-weight: bold; color: #2c3e50;">${d.data.name}</div>
                                    <div style="font-size: 14px; color: #34495e;">${d.data.positionName}</div>
                                    <div style="font-size: 12px; color: #7f8c8d; font-weight: bold;">${d.data.department}</div>
                                </div>
                            </div>
                        </div>
                    `;
                });
        } else {
            chartRef.current.data(nodes);
        }

        chartRef.current.render();

    }, [jobProfiles, onProfileClick]); // Se ejecuta cada vez que los perfiles cambian

    return (
        <div>
            <div className="phase-header">
                <h2>Organigrama de la Empresa</h2>
                <p>Visualiza la estructura jerárquica y de equipos de la organización.</p>
            </div>
            <div className="subsection">
                {/* El contenedor donde se renderizará el organigrama */}
                <div ref={chartContainerRef} style={{ width: '100%', height: '700px' }}></div>
            </div>
        </div>
    );
};
