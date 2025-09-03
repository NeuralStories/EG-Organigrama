import React, { useState, useEffect } from 'react';
import { supabaseClient } from '../services/supabaseClient.js';
import { JobProfileForm } from './JobProfileForm.jsx';
import { JobProfileDetail } from './JobProfileDetail.jsx';
import { ConfirmationModal, GeneradorDescripcionModal } from './Modals.jsx';
import { LoaderIcon, TrashIcon } from './Icons.jsx';

// --- TU COMPONENTE EMPLEADOSSECTION (Extraído y ahora importa sus dependencias) ---
export const EmpleadosSection = ({ user, showNotification, onNavigate, openaiApiKey, aiModel, logActivity, userRole, predefinedOptions, profileToEdit, setProfileToEdit, jobProfiles, setJobProfiles }) => {
    const [view, setView] = useState('list');
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [loading, setLoading] = useState(false); // Este estado no se usaba, pero lo mantengo por si lo necesitas.
    const [searchTerm, setSearchTerm] = useState('');
    const [profileToDelete, setProfileToDelete] = useState(null);
    const [showGenerator, setShowGenerator] = useState(false);
    
    useEffect(() => {
        if (profileToEdit) {
            setSelectedProfile(profileToEdit);
            setView('detail'); 
            setProfileToEdit(null);
        }
    }, [profileToEdit, setProfileToEdit]);
    
    const handleFormSave = () => {
        setView('list');
        setSelectedProfile(null);
        // Aquí podrías añadir una llamada para recargar los perfiles si fuera necesario
    };
    
    const handleDeleteConfirm = async () => {
        if (!profileToDelete) return;
        if (userRole !== 'admin') {
            showNotification('No tienes permiso para eliminar fichas.', 'error');
            setProfileToDelete(null);
            return;
        }
        
        try {
            const { error } = await supabaseClient.from('job_profiles').delete().eq('id', profileToDelete.id);
            if (error) throw error;

            showNotification('Ficha eliminada con éxito.', 'success');
            logActivity(`Eliminada ficha de ${profileToDelete.nombre_apellidos}`);
            setJobProfiles(currentProfiles => currentProfiles.filter(p => p.id !== profileToDelete.id));
            
            if (selectedProfile && selectedProfile.id === profileToDelete.id) {
                setView('list');
                setSelectedProfile(null);
            }
        } catch (error) {
            showNotification(`Error al eliminar: ${error.message}. Asegúrate de que las políticas RLS lo permiten.`, 'error');
        } finally {
            setProfileToDelete(null);
        }
    };

    const handleToggleApprove = async (profile) => {
         if (userRole !== 'admin' && userRole !== 'management') {
            showNotification('No tienes permiso para aprobar fichas.', 'error');
            return;
        }
        const { data, error } = await supabaseClient
            .from('job_profiles')
            .update({ approved: !profile.approved })
            .eq('id', profile.id)
            .select()
            .single();

        if (error) {
            showNotification(`Error al actualizar estado: ${error.message}`, 'error');
        } else {
            const actionText = data.approved ? `Aprobada ficha de ${profile.nombre_apellidos}` : `Desaprobada ficha de ${profile.nombre_apellidos}`;
            showNotification('Estado actualizado.', 'success');
            logActivity(actionText);
            setJobProfiles(currentProfiles => currentProfiles.map(p => (p.id === profile.id ? data : p)));
        }
    };

    const handleExportPDF = (elementRef, fileName) => {
        // Asumimos que html2canvas y jsPDF están disponibles globalmente
        if (elementRef.current && window.html2canvas && window.jspdf.jsPDF) {
            window.html2canvas(elementRef.current, { scale: 2 }).then((canvas) => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const imgProps = pdf.getImageProperties(imgData);
                const imgWidth = pdfWidth;
                const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
                let heightLeft = imgHeight;
                let position = 0;

                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pdfHeight;

                while (heightLeft >= 0) {
                  position = heightLeft - imgHeight;
                  pdf.addPage();
                  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                  heightLeft -= pdfHeight;
                }
                pdf.save(`${fileName || 'ficha'}.pdf`);
                logActivity(`Exportado PDF de ${fileName}`);
            });
        }
    };

    const filteredProfiles = jobProfiles.filter(profile =>
        (profile.nombre_apellidos && profile.nombre_apellidos.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (profile.nombre_puesto && profile.nombre_puesto.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // VISTAS CONDICIONALES
    if (userRole === 'employee' && loading) { // 'loading' viene de la prop, aunque no se usa actualmente
         return <div className="flex justify-center items-center h-40"><LoaderIcon /></div>;
    }

    if (view === 'create') {
        return <JobProfileForm user={user} onSave={handleFormSave} onCancel={() => setView('list')} showNotification={showNotification} predefinedOptions={predefinedOptions} logActivity={logActivity} />;
    }
    if (view === 'edit') {
        return <JobProfileForm user={user} onSave={handleFormSave} onCancel={() => { setView('detail'); }} showNotification={showNotification} profileToEdit={selectedProfile} predefinedOptions={predefinedOptions} logActivity={logActivity} />;
    }
    if (view === 'detail' && selectedProfile) {
        return (
            <>
                {profileToDelete && (
                    <ConfirmationModal 
                        message={`¿Estás seguro de que quieres eliminar la ficha de ${profileToDelete.nombre_apellidos}? Esta acción no se puede deshacer.`}
                        onConfirm={handleDeleteConfirm}
                        onCancel={() => setProfileToDelete(null)}
                    />
                )}
                {showGenerator && (
                    <GeneradorDescripcionModal 
                        profile={selectedProfile}
                        onClose={() => setShowGenerator(false)}
                        openaiApiKey={openaiApiKey}
                        aiModel={aiModel}
                        showNotification={showNotification}
                    />
                )}
                <JobProfileDetail 
                    profile={selectedProfile} 
                    onBack={() => { setView('list'); setSelectedProfile(null); }}
                    onEdit={() => setView('edit')}
                    onDelete={() => setProfileToDelete(selectedProfile)}
                    onExportPDF={handleExportPDF}
                    onGenerateDescription={() => setShowGenerator(true)}
                    userRole={userRole}
                />
            </>
        );
    }

    // VISTA POR DEFECTO (LISTA)
    return (
        <div>
            {profileToDelete && (
                <ConfirmationModal 
                    message={`¿Estás seguro de que quieres eliminar la ficha de ${profileToDelete.nombre_apellidos}? Esta acción no se puede deshacer.`}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setProfileToDelete(null)}
                />
            )}
            <div className="phase-header">
                <h2>Gestión de Empleados</h2>
                <p>Busca, visualiza y añade nuevas fichas de puesto de trabajo.</p>
            </div>
            <div className="subsection flex flex-col md:flex-row justify-between items-center gap-4">
                <input 
                    type="text" 
                    placeholder="Buscar por nombre o puesto..." 
                    className="form-input w-full md:flex-grow"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <div>
                    <button onClick={() => setView('create')} className="btn-action w-full md:w-auto">Añadir Ficha</button>
                </div>
            </div>

            <div className="subsection">
                <h3>Fichas de Puesto Creadas</h3>
                {jobProfiles.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Puesto</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departamento</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aprobado</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredProfiles.map(profile => (
                                    <tr key={profile.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold cursor-pointer" onClick={() => { setSelectedProfile(profile); setView('detail'); }}>{profile.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium cursor-pointer" onClick={() => { setSelectedProfile(profile); setView('detail'); }}>{profile.nombre_apellidos}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 cursor-pointer" onClick={() => { setSelectedProfile(profile); setView('detail'); }}>{profile.nombre_puesto}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold cursor-pointer" onClick={() => { setSelectedProfile(profile); setView('detail'); }}>{profile.departamento}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <label className="flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                                <div className="relative">
                                                    <input type="checkbox" className="sr-only" checked={profile.approved} onChange={() => handleToggleApprove(profile)} />
                                                    <div className={`block w-10 h-6 rounded-full ${profile.approved ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                                                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${profile.approved ? 'transform translate-x-4' : ''}`}></div>
                                                </div>
                                            </label>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {userRole === 'admin' && (
                                                <button onClick={(e) => {e.stopPropagation(); setProfileToDelete(profile);}} className="btn-danger p-2">
                                                    <TrashIcon />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="mt-4 text-gray-500">No se encontraron fichas. ¡Añade una para empezar!</p>
                )}
            </div>
        </div>
    );
};
