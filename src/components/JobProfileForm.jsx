import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabaseClient } from '../services/supabaseClient.js';
import { LoaderIcon } from './Icons.jsx';
import SignaturePad from 'signature_pad'; // <-- MODIFICACIÓN: Importación añadida

export const JobProfileForm = ({ user, onSave, onCancel, showNotification, profileToEdit, predefinedOptions, logActivity }) => {
    const [formData, setFormData] = useState({
        nombre_apellidos: '', nombre_puesto: '', departamento: '', ubicacion: '', reporta_a: '', proposito: '',
        competencias_tecnicas: '', competencias_transversales: '', formacion: '', experiencia: '', horario: '',
        tipo_contrato: '', modalidad_trabajo: '', riesgos: '', herramientas: '', observaciones: '', firmado_por: '', fecha_firma: '', signature_data_url: ''
    });
    const [subordinados, setSubordinados] = useState(['']);
    const [funciones, setFunciones] = useState([{ funcion: '', frecuencia: [], responsabilidad: [] }]);
    const [kpis, setKpis] = useState(['']);
    const [relaciones, setRelaciones] = useState([{ tipo: 'Interna', con_quien: '', motivo: '' }]);
    const [isSaving, setIsSaving] = useState(false);
    const signaturePadRef = useRef(null);
    const canvasRef = useRef(null);

    const resizeCanvas = useCallback(() => {
        if (canvasRef.current) {
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            const canvas = canvasRef.current;
            canvas.width = canvas.offsetWidth * ratio;
            canvas.height = canvas.offsetHeight * ratio;
            canvas.getContext("2d").scale(ratio, ratio);
            if (signaturePadRef.current) {
                signaturePadRef.current.fromData(signaturePadRef.current.toData());
            }
        }
    }, []);

    useEffect(() => {
        if (canvasRef.current) {
            signaturePadRef.current = new SignaturePad(canvasRef.current);
            resizeCanvas();
            window.addEventListener("resize", resizeCanvas);
            if (profileToEdit && profileToEdit.signature_data_url) {
                signaturePadRef.current.fromDataURL(profileToEdit.signature_data_url);
            }
        }
        return () => {
            window.removeEventListener("resize", resizeCanvas);
        };
    }, [profileToEdit, resizeCanvas]);

    useEffect(() => {
        if (profileToEdit) {
            setFormData({
                nombre_apellidos: profileToEdit.nombre_apellidos || '',
                nombre_puesto: profileToEdit.nombre_puesto || '',
                departamento: profileToEdit.departamento || '',
                ubicacion: profileToEdit.ubicacion || '',
                reporta_a: profileToEdit.reporta_a || '',
                proposito: profileToEdit.proposito || '',
                competencias_tecnicas: profileToEdit.competencias_tecnicas || '',
                competencias_transversales: profileToEdit.competencias_transversales || '',
                formacion: profileToEdit.formacion || '',
                experiencia: profileToEdit.experiencia || '',
                horario: profileToEdit.horario || '',
                tipo_contrato: profileToEdit.tipo_contrato || '',
                modalidad_trabajo: profileToEdit.modalidad_trabajo || '',
                riesgos: profileToEdit.riesgos || '',
                herramientas: profileToEdit.herramientas || '',
                observaciones: profileToEdit.observaciones || '',
                firmado_por: profileToEdit.firmado_por || '',
                fecha_firma: profileToEdit.fecha_firma || '',
                signature_data_url: profileToEdit.signature_data_url || '',
                approved: profileToEdit.approved || false,
            });
            setSubordinados(profileToEdit.subordinados && profileToEdit.subordinados.length > 0 ? profileToEdit.subordinados : ['']);
            setFunciones(profileToEdit.funciones && profileToEdit.funciones.length > 0 ? profileToEdit.funciones : [{ funcion: '', frecuencia: [], responsabilidad: [] }]);
            setKpis(profileToEdit.kpis && profileToEdit.kpis.length > 0 ? profileToEdit.kpis : ['']);
            setRelaciones(profileToEdit.relaciones && profileToEdit.relaciones.length > 0 ? profileToEdit.relaciones : [{ tipo: 'Interna', con_quien: '', motivo: '' }]);
        }
    }, [profileToEdit]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleDynamicChange = (setter, index, field, value) => {
        setter(prev => {
            const items = [...prev];
            if (field) {
                items[index][field] = value;
            } else {
                items[index] = value;
            }
            return items;
        });
    };
    
    const handleCheckboxChange = (setter, index, field, value) => {
        setter(prev => {
            const items = [...prev];
            const currentValues = items[index][field] || [];
            if (currentValues.includes(value)) {
                items[index][field] = currentValues.filter(v => v !== value);
            } else {
                items[index][field] = [...currentValues, value];
            }
            return items;
        });
    };

    const addDynamicItem = (setter, newItem) => setter(prev => [...prev, newItem]);
    const removeDynamicItem = (setter, index) => setter(prev => prev.filter((_, i) => i !== index));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        
        let signatureURL = formData.signature_data_url;
        if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
            signatureURL = signaturePadRef.current.toDataURL();
        }

        const completeData = {
            ...formData,
            user_id: user.id,
            signature_data_url: signatureURL,
            subordinados: subordinados.filter(s => s && s.trim() !== ''),
            funciones: funciones.filter(f => f.funcion && f.funcion.trim() !== ''),
            kpis: kpis.filter(k => k && k.trim() !== ''),
            relaciones: relaciones.filter(r => r.con_quien && r.con_quien.trim() !== '')
        };
        
        try {
            let error;
            if (profileToEdit) {
                const { error: updateError } = await supabaseClient.from('job_profiles').update(completeData).eq('id', profileToEdit.id);
                error = updateError;
                if (!error) logActivity(`Editada ficha de ${completeData.nombre_apellidos}`);
            } else {
                const newId = Math.random().toString(36).substring(2, 8).toUpperCase();
                const { error: insertError } = await supabaseClient.from('job_profiles').insert([{ ...completeData, id: newId }]);
                error = insertError;
                if (!error) logActivity(`Creada ficha de ${completeData.nombre_apellidos}`);
            }

            if (error) throw error;
            showNotification(`Ficha de puesto ${profileToEdit ? 'actualizada' : 'guardada'} con éxito.`, 'success');
            onSave();
        } catch (error) {
            showNotification(`Error al ${profileToEdit ? 'actualizar' : 'guardar'} la ficha: ${error.message}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };
            
    return (
        <div className="subsection">
            <form onSubmit={handleSubmit}>
                <h2 className="text-xl font-bold mb-4 border-b pb-2">{profileToEdit ? 'Editar' : 'Nueva'} Ficha de Puesto de Trabajo</h2>
                
                <h3 className="text-lg font-semibold mt-4">1. Identificación del Puesto</h3>
                <label className="form-label" htmlFor="nombre_apellidos">Nombre y Apellidos</label>
                <input className="form-input" type="text" id="nombre_apellidos" name="nombre_apellidos" value={formData.nombre_apellidos} onChange={handleInputChange} required />
                
                <label className="form-label" htmlFor="nombre_puesto">Puesto</label>
                <select className="form-select" id="nombre_puesto" name="nombre_puesto" value={formData.nombre_puesto} onChange={handleInputChange} required>
                    <option value="">Selecciona un puesto...</option>
                    {predefinedOptions.puestos.map(puesto => <option key={puesto} value={puesto}>{puesto}</option>)}
                </select>
                
                <label className="form-label" htmlFor="departamento">Departamento / Área</label>
                <select className="form-select" id="departamento" name="departamento" value={formData.departamento} onChange={handleInputChange} required>
                    <option value="">Selecciona un departamento...</option>
                    {predefinedOptions.departamentos.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                </select>

                <label className="form-label" htmlFor="ubicacion">Ubicación</label>
                <input className="form-input" type="text" id="ubicacion" name="ubicacion" value={formData.ubicacion} onChange={handleInputChange} />

                <label className="form-label" htmlFor="reporta_a">Reporta a</label>
                    <select className="form-select" id="reporta_a" name="reporta_a" value={formData.reporta_a} onChange={handleInputChange}>
                    <option value="">Selecciona a quién reporta...</option>
                    {predefinedOptions.reporta_a.map(rep => <option key={rep} value={rep}>{rep}</option>)}
                </select>

                <label className="form-label">Subordinados directos</label>
                {subordinados.map((sub, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                        <input className="form-input" type="text" value={sub} onChange={e => handleDynamicChange(setSubordinados, index, null, e.target.value)} placeholder="Puesto del subordinado"/>
                        {index > 0 && <button type="button" onClick={() => removeDynamicItem(setSubordinados, index)} className="btn-danger p-2 leading-none">X</button>}
                    </div>
                ))}
                <button type="button" onClick={() => addDynamicItem(setSubordinados, '')} className="btn-secondary text-sm mt-1">+ Añadir subordinado</button>
                
                <h3 className="text-lg font-semibold mt-6">2. Propósito y Funciones</h3>
                <label className="form-label" htmlFor="proposito">Propósito General del Puesto</label>
                <textarea className="form-textarea" id="proposito" name="proposito" value={formData.proposito} onChange={handleInputChange} required></textarea>

                <label className="form-label mt-6">Funciones y Tareas Principales</label>
                <table className="form-table">
                    <thead><tr><th style={{width: '5%'}}>#</th><th>Función / Tarea</th><th>Frecuencia</th><th>Responsabilidad</th><th style={{width: '5%'}}></th></tr></thead>
                    <tbody>
                    {funciones.map((item, index) => (
                        <tr key={index}>
                            <td>{index + 1}</td>
                            <td><input type="text" placeholder="Función / Tarea" className="form-input" value={item.funcion} onChange={e => handleDynamicChange(setFunciones, index, 'funcion', e.target.value)} /></td>
                            <td>
                                <div className="checkbox-group">
                                    {['Diaria', 'Semanal', 'Mensual'].map(freq => <label key={freq}><input type="checkbox" className="mr-1" checked={(item.frecuencia || []).includes(freq)} onChange={() => handleCheckboxChange(setFunciones, index, 'frecuencia', freq)}/>{freq}</label>)}
                                </div>
                            </td>
                            <td>
                                <div className="checkbox-group">
                                    {['Alta', 'Media', 'Baja'].map(resp => <label key={resp}><input type="checkbox" className="mr-1" checked={(item.responsabilidad || []).includes(resp)} onChange={() => handleCheckboxChange(setFunciones, index, 'responsabilidad', resp)}/>{resp}</label>)}
                                </div>
                            </td>
                            <td>{index > 0 && <button type="button" onClick={() => removeDynamicItem(setFunciones, index)} className="btn-danger p-2 leading-none">X</button>}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                <button type="button" onClick={() => addDynamicItem(setFunciones, { funcion: '', frecuencia: [], responsabilidad: [] })} className="btn-secondary text-sm mt-2">+ Añadir función</button>
                
                <h3 className="text-lg font-semibold mt-6">3. KPIs y Observaciones</h3>
                <label className="form-label">KPIs / Indicadores de Desempeño</label>
                {kpis.map((kpi, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                        <input className="form-input" type="text" value={kpi} onChange={e => handleDynamicChange(setKpis, index, null, e.target.value)} placeholder="Ej: Nivel de satisfacción del cliente > 90%"/>
                        {index > 0 && <button type="button" onClick={() => removeDynamicItem(setKpis, index)} className="btn-danger p-2 leading-none">X</button>}
                    </div>
                ))}
                <button type="button" onClick={() => addDynamicItem(setKpis, '')} className="btn-secondary text-sm mt-1">+ Añadir KPI</button>

                <label className="form-label mt-6" htmlFor="observaciones">Observaciones</label>
                <textarea className="form-textarea" name="observaciones" id="observaciones" value={formData.observaciones} onChange={handleInputChange}></textarea>


                <h3 className="text-lg font-semibold mt-6">4. Competencias Requeridas</h3>
                <label className="form-label" htmlFor="competencias_tecnicas">Competencias técnicas / específicas</label>
                <textarea className="form-textarea" id="competencias_tecnicas" name="competencias_tecnicas" value={formData.competencias_tecnicas} onChange={handleInputChange}></textarea>
                <label className="form-label" htmlFor="competencias_transversales">Competencias transversales / blandas</label>
                <textarea className="form-textarea" id="competencias_transversales" name="competencias_transversales" value={formData.competencias_transversales} onChange={handleInputChange}></textarea>
                <label className="form-label" htmlFor="formacion">Formación mínima requerida</label>
                <input className="form-input" type="text" id="formacion" name="formacion" value={formData.formacion} onChange={handleInputChange} />
                <label className="form-label" htmlFor="experiencia">Experiencia mínima requerida</label>
                <input className="form-input" type="text" id="experiencia" name="experiencia" value={formData.experiencia} onChange={handleInputChange} />

                <h3 className="text-lg font-semibold mt-6">5. Condiciones del Puesto</h3>
                <label className="form-label" htmlFor="horario">Horario</label>
                <input className="form-input" type="text" id="horario" name="horario" value={formData.horario} onChange={handleInputChange} placeholder="Ej: 09:00 - 18:00"/>
                <label className="form-label" htmlFor="tipo_contrato">Tipo de contrato</label>
                <select className="form-select" id="tipo_contrato" name="tipo_contrato" value={formData.tipo_contrato} onChange={handleInputChange}>
                    <option value="">Selecciona un tipo de contrato...</option>
                    {predefinedOptions.tipos_contrato.map(con => <option key={con} value={con}>{con}</option>)}
                </select>
                <label className="form-label" htmlFor="modalidad_trabajo">Modalidad de trabajo</label>
                <select className="form-select" id="modalidad_trabajo" name="modalidad_trabajo" value={formData.modalidad_trabajo} onChange={handleInputChange}>
                    <option value="">Selecciona una modalidad...</option>
                    {predefinedOptions.modalidades_trabajo.map(mod => <option key={mod} value={mod}>{mod}</option>)}
                </select>
                <label className="form-label" htmlFor="riesgos">Riesgos asociados</label>
                <textarea className="form-textarea" id="riesgos" name="riesgos" value={formData.riesgos} onChange={handleInputChange}></textarea>
                <label className="form-label" htmlFor="herramientas">Equipos o herramientas clave</label>
                <textarea className="form-textarea" id="herramientas" name="herramientas" value={formData.herramientas} onChange={handleInputChange}></textarea>

                <h3 className="text-lg font-semibold mt-6">6. Relaciones Internas y Externas</h3>
                <table className="form-table">
                    <thead><tr><th>Tipo</th><th>Con quién</th><th>Motivo / Resultado esperado</th><th style={{width: '5%'}}></th></tr></thead>
                    <tbody>
                    {relaciones.map((item, index) => (
                        <tr key={index}>
                            <td>
                                <select className="form-select" value={item.tipo} onChange={e => handleDynamicChange(setRelaciones, index, 'tipo', e.target.value)}>
                                    <option>Interna</option>
                                    <option>Externa</option>
                                </select>
                            </td>
                            <td><input type="text" placeholder="Con quién" className="form-input" value={item.con_quien} onChange={e => handleDynamicChange(setRelaciones, index, 'con_quien', e.target.value)} /></td>
                            <td><input type="text" placeholder="Motivo" className="form-input" value={item.motivo} onChange={e => handleDynamicChange(setRelaciones, index, 'motivo', e.target.value)} /></td>
                            <td>{index > 0 && <button type="button" onClick={() => removeDynamicItem(setRelaciones, index)} className="btn-danger p-2 leading-none">X</button>}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                <button type="button" onClick={() => addDynamicItem(setRelaciones, { tipo: 'Interna', con_quien: '', motivo: '' })} className="btn-secondary text-sm mt-2">+ Añadir relación</button>

                <h3 className="text-lg font-semibold mt-6">7. Firma</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="form-label" htmlFor="firmado_por">Firmado por</label>
                        <input className="form-input" type="text" id="firmado_por" name="firmado_por" value={formData.firmado_por} onChange={handleInputChange} required />
                    </div>
                    <div>
                        <label className="form-label" htmlFor="fecha_firma">Fecha</label>
                        <input className="form-input" type="date" id="fecha_firma" name="fecha_firma" value={formData.fecha_firma} onChange={handleInputChange} required />
                    </div>
                </div>
                <div className="mt-4">
                    <label className="form-label">Panel de Firma</label>
                    <canvas ref={canvasRef} className="signature-pad w-full h-40"></canvas>
                    <button type="button" onClick={() => signaturePadRef.current && signaturePadRef.current.clear()} className="btn-secondary text-sm mt-2">Limpiar Firma</button>
                </div>

                <div className="mt-6 flex justify-end gap-4">
                    <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
                    <button type="submit" className="btn-action" disabled={isSaving}>
                        {isSaving && <LoaderIcon />}
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </form>
        </div>
    );
};
