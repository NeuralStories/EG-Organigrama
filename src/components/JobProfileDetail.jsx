import React, { useRef } from 'react';
import { SparklesIcon } from './Icons.jsx';

// --- TU COMPONENTE JOBPROFILEDETAIL ---
export const JobProfileDetail = ({ profile, onBack, onEdit, onDelete, onExportPDF, onGenerateDescription, userRole }) => {
    const detailRef = useRef(null);
    
    const DetailItem = ({ label, value }) => (
        <div className="detail-item">
            <span className="detail-label">{label}</span>
            <p className="detail-value">{value || <span className="text-gray-400">N/A</span>}</p>
        </div>
    );

    const DetailTextarea = ({ label, value }) => (
         <div className="detail-item detail-item-full">
            <span className="detail-label">{label}</span>
            <p className="detail-value">{value || <span className="text-gray-400">N/A</span>}</p>
        </div>
    );

    return (
        <div className="subsection">
            <div ref={detailRef} className="p-4">
                <h2 className="text-xl font-bold mb-4 border-b pb-2">Detalle de la Ficha de Puesto: {profile.nombre_apellidos}</h2>
                
                <div className="detail-section">
                    <h4>1. Identificación del Puesto</h4>
                    <div className="detail-grid">
                        <DetailItem label="ID Ficha" value={profile.id} />
                        <DetailItem label="Nombre y Apellidos" value={profile.nombre_apellidos} />
                        <DetailItem label="Puesto" value={profile.nombre_puesto} />
                        <DetailItem label="Departamento" value={profile.departamento} />
                        <DetailItem label="Ubicación" value={profile.ubicacion} />
                        <DetailItem label="Reporta a" value={profile.reporta_a} />
                        <div className="detail-item detail-item-full">
                            <span className="detail-label">Subordinados Directos</span>
                            {profile.subordinados && profile.subordinados.length > 0 ? (
                                <ul className="list-disc pl-5 detail-value">
                                    {profile.subordinados.map((item, index) => <li key={index}>{item}</li>)}
                                </ul>
                            ) : <p className="detail-value text-gray-400">N/A</p>}
                        </div>
                    </div>
                </div>

                <div className="detail-section">
                    <h4>2. Propósito y Funciones</h4>
                     <DetailTextarea label="Propósito General del Puesto" value={profile.proposito} />
                     <div className="detail-item detail-item-full mt-4">
                        <span className="detail-label">Funciones y Tareas Principales</span>
                        {profile.funciones && profile.funciones.length > 0 ? (
                            <table className="detail-table">
                                <thead><tr><th>Función</th><th>Frecuencia</th><th>Responsabilidad</th></tr></thead>
                                <tbody>
                                    {profile.funciones.map((f, i) => (
                                        <tr key={i}>
                                            <td>{f.funcion}</td>
                                            <td>{(f.frecuencia || []).join(', ')}</td>
                                            <td>{(f.responsabilidad || []).join(', ')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : <p className="detail-value text-gray-400">N/A</p>}
                    </div>
                </div>

                <div className="detail-section">
                    <h4>3. KPIs y Observaciones</h4>
                     <div className="detail-item detail-item-full">
                        <span className="detail-label">KPIs / Indicadores de Desempeño</span>
                        {profile.kpis && profile.kpis.length > 0 ? (
                            <ul className="list-disc pl-5 detail-value">
                                {profile.kpis.map((item, index) => <li key={index}>{item}</li>)}
                            </ul>
                        ) : <p className="detail-value text-gray-400">N/A</p>}
                    </div>
                    <DetailTextarea label="Observaciones" value={profile.observaciones} />
                </div>

                <div className="detail-section">
                    <h4>4. Competencias Requeridas</h4>
                    <div className="detail-grid">
                        <DetailTextarea label="Competencias Técnicas" value={profile.competencias_tecnicas} />
                        <DetailTextarea label="Competencias Transversales" value={profile.competencias_transversales} />
                        <DetailItem label="Formación Mínima" value={profile.formacion} />
                        <DetailItem label="Experiencia Mínima" value={profile.experiencia} />
                    </div>
                </div>
                
                <div className="detail-section">
                    <h4>5. Condiciones del Puesto</h4>
                    <div className="detail-grid">
                        <DetailItem label="Horario" value={profile.horario} />
                        <DetailItem label="Tipo de Contrato" value={profile.tipo_contrato} />
                        <DetailItem label="Modalidad de Trabajo" value={profile.modalidad_trabajo} />
                        <DetailTextarea label="Riesgos Asociados" value={profile.riesgos} />
                        <DetailTextarea label="Equipos o Herramientas Clave" value={profile.herramientas} />
                    </div>
                </div>

                <div className="detail-section">
                    <h4>6. Relaciones</h4>
                     <div className="detail-item detail-item-full">
                        <span className="detail-label">Relaciones Internas y Externas</span>
                        {profile.relaciones && profile.relaciones.length > 0 ? (
                            <table className="detail-table">
                                <thead><tr><th>Tipo</th><th>Con Quién</th><th>Motivo</th></tr></thead>
                                <tbody>
                                    {profile.relaciones.map((r, i) => (
                                        <tr key={i}>
                                            <td>{r.tipo}</td>
                                            <td>{r.con_quien}</td>
                                            <td>{r.motivo}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : <p className="detail-value text-gray-400">N/A</p>}
                    </div>
                </div>

                {profile.signature_data_url && (
                     <div className="detail-section">
                         <h4>7. Firma</h4>
                         <div className="detail-grid">
                             <DetailItem label="Firmado Por" value={profile.firmado_por} />
                             <DetailItem label="Fecha de Firma" value={profile.fecha_firma} />
                         </div>
                         <img src={profile.signature_data_url} alt="Firma" className="mt-4 border rounded max-w-xs" />
                     </div>
                )}
            </div>
            <div className="flex flex-wrap justify-end gap-2 mt-4 border-t pt-4">
                <button onClick={onBack} className="btn-secondary">Volver</button>
                <button onClick={() => onExportPDF(detailRef, profile.nombre_apellidos)} className="btn-action">Exportar a PDF</button>
                <button onClick={onGenerateDescription} className="btn-success">
                    <SparklesIcon />
                    Generar Descripción
                </button>
                <button onClick={onEdit} className="btn-warning">Editar</button>
                {userRole === 'admin' && (
                    <button onClick={onDelete} className="btn-danger">Eliminar</button>
                )}
            </div>
        </div>
    );
}
