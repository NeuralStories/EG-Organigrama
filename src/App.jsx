import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabaseClient } from './services/supabaseClient.js';
import { studyData, allTaskIds } from './data/studyData.js';
import { Auth } from './components/Auth.jsx';
import { TaskItem } from './components/TaskItem.jsx';
import { EmpleadosSection } from './components/EmpleadosSection.jsx';
import { DashboardSection } from './components/DashboardSection.jsx';
import { ProfileDropdown } from './components/ProfileDropdown.jsx';
import { SummariesSection, PhaseSummary } from './components/SummariesSection.jsx';
import { Organigrama } from './components/Organigrama.jsx';
import { LoaderIcon, MenuIcon, XIcon } from './components/Icons.jsx';

// --- COMPONENTES SETTINGSMODAL Y EMPLOYEEFOOTER (Extraídos de tu código) ---
const SettingsModal = ({ onClose, onSave, initialSettings }) => {
    const [localOpenaiKey, setLocalOpenaiKey] = useState(initialSettings.openaiApiKey);
    const [localAiModel, setLocalAiModel] = useState(initialSettings.aiModel);

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3 className="text-lg font-bold mb-4">Configuración de IA</h3>
                    <div>
                    <label className="form-label">Proveedor de IA para Texto</label>
                    <select className="form-select" value={localAiModel} onChange={e => setLocalAiModel(e.target.value)}>
                        <option value="gpt-4">OpenAI (GPT-4)</option>
                        <option value="gpt-3.5-turbo">OpenAI (GPT-3.5)</option>
                    </select>
                </div>
                <div>
                    <label className="form-label">Clave de API de OpenAI</label>
                    <p className="text-xs text-gray-500 mb-2">Necesaria para todas las funciones de IA.</p>
                    <input type="password" placeholder="sk-..." value={localOpenaiKey} onChange={e => setLocalOpenaiKey(e.target.value)} className="form-input" />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="btn-secondary">Cancelar</button>
                    <button onClick={() => onSave({ openaiApiKey: localOpenaiKey, aiModel: localAiModel })} className="btn-action">Guardar</button>
                </div>
            </div>
        </div>
    );
};

const EmployeeFooter = () => {
    const handleLogout = () => {
        supabaseClient.auth.signOut();
    };
    return (
        <footer style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', padding: '20px', backgroundColor: 'var(--background-white)', textAlign: 'center', boxShadow: '0 -2px 5px rgba(0,0,0,0.1)', zIndex: 1000 }}>
            <button onClick={handleLogout} className="btn-danger">Cerrar Sesión</button>
        </footer>
    );
};


// --- COMPONENTE ESTUDIOAPP (El corazón de tu aplicación con toda la lógica) ---
const EstudioApp = ({ user }) => {
    const [activeSection, setActiveSection] = useState('dashboard');
    const [tasks, setTasks] = useState([]);
    const [jobProfiles, setJobProfiles] = useState([]);
    const [activityLog, setActivityLog] = useState([]);
    const [phaseSummaries, setPhaseSummaries] = useState([]);
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });
    const [openaiApiKey, setOpenaiApiKey] = useState('');
    const [aiModel, setAiModel] = useState('gpt-3.5-turbo');
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const mediaRecorder = useRef(null);
    const [activeTaskId, setActiveTaskId] = useState(null);
    const [loginTime] = useState(Date.now());
    const [showSettings, setShowSettings] = useState(false);
    const [userRole, setUserRole] = useState('employee');
    const [loadingRole, setLoadingRole] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [profileToEdit, setProfileToEdit] = useState(null);
    const [dataLoading, setDataLoading] = useState(true);

    const PREDEFINED_OPTIONS = {
        puestos: [ "Director Producción", "Jefe Almacén", "Jefe Taller", "Tapicero", "Encargado de tapiceria", "Carpintero", "Encargada de confección", "Especialista en Confección", "Especialista confección y acabado", "Oficial de 1ª", "Oficial de 2ª", "Director Financiero", "Jefe administración", "RRHH", "Proveedores", "Facturación", "Recobro", "Contable", "Director operaciones", "Jefe ventas", "Comerciales", "Comercial Madera", "Gestores Nacional", "Gestores Internacional", "Recepción", "Responsable de obra", "Jefe de obra", "Peon", "Propiedad" ],
        departamentos: [ "Directiva", "Producción", "Administracion", "Comercial" ],
        reporta_a: [ "Director Producción", "Jefe Almacén", "Jefe Taller", "Tapicero", "Encargado de tapiceria", "Carpintero", "Encargada de confección", "Especialista en Confección", "Especialista confección y acabado", "Oficial de 1ª", "Oficial de 2ª", "Director Financiero", "Jefe administración", "RRHH", "No necesita" ],
        tipos_contrato: [ "Temporal", "Fijo Discontinuo", "FiJo", "Subcontrata" ],
        modalidades_trabajo: [ "Presencial", "A distancia", "Hibrido" ]
    };

    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 4000);
    };

    const fetchUserRole = useCallback(async () => {
        const { data, error } = await supabaseClient.rpc('get_my_role');
        if (error || !data) {
            console.error("Could not fetch user role, defaulting to 'employee'.", error);
            setUserRole('employee');
        } else {
            setUserRole(data);
        }
        setLoadingRole(false);
    }, []);

    const fetchActivityLog = useCallback(async () => {
        const { data, error } = await supabaseClient.from('activity_log').select('*').order('created_at', { ascending: false }).limit(50);
        if (error) showNotification(`Error al cargar registro: ${error.message}`, 'error');
        else setActivityLog(data || []);
    }, []);

    const fetchPhaseSummaries = useCallback(async () => {
        const { data, error } = await supabaseClient.from('phase_summaries').select('*').eq('user_id', user.id);
        if (error) {
            if (error.code !== '42P01') showNotification(`Error al cargar resúmenes: ${error.message}`, 'error');
            setPhaseSummaries([]);
        } else {
            setPhaseSummaries(data || []);
        }
    }, [user.id]);
    
    const logActivity = async (action) => {
        const { error } = await supabaseClient.from('activity_log').insert([{ action, user_id: user.id }]);
        if (error) showNotification(`Error al registrar actividad: ${error.message}`, 'error');
        else fetchActivityLog();
    };
    
    const handleResetLog = async () => {
        if(userRole !== 'admin') {
            showNotification('No tienes permiso para realizar esta acción.', 'error');
            return;
        }
        const { error } = await supabaseClient.from('activity_log').delete().gt('id', 0);
        if (error) showNotification('Error al borrar el registro.', 'error');
        else {
            setActivityLog([]);
            showNotification('Registro de actividad borrado.', 'success');
        }
    };

    const fetchInitialData = useCallback(async () => {
        setDataLoading(true);
        await fetchUserRole();
        const { data: tasksData, error: tasksError } = await supabaseClient.from('tasks').select('task_id, is_completed, notes');
        if (tasksError) showNotification(`Error al cargar tareas: ${tasksError.message}`, 'error');
        else {
            const taskMap = {};
            (tasksData || []).forEach(task => { taskMap[task.task_id] = task; });
            const initialTasks = allTaskIds.map(id => {
                const dbTask = taskMap[id];
                let status = 'pendiente';
                if (dbTask) {
                    if (dbTask.is_completed) status = 'aprobado';
                    else if (dbTask.notes && dbTask.notes.includes('[state:parado]')) status = 'parado';
                }
                return { task_id: id, user_id: user.id, notes: dbTask?.notes || '', status, is_editing: false };
            });
            setTasks(initialTasks);
        }
        const { data: profilesData, error: profilesError } = await supabaseClient.from('job_profiles').select('*').order('created_at', { ascending: false });
        if (profilesError) showNotification(`Error al cargar fichas: ${profilesError.message}`, 'error');
        else setJobProfiles(profilesData || []);
        const { data: profileData } = await supabaseClient.from('profiles').select('openai_api_key').eq('id', user.id).single();
        if (profileData) setOpenaiApiKey(profileData.openai_api_key || '');
        await fetchActivityLog();
        await fetchPhaseSummaries();
        setDataLoading(false);
    }, [user.id, fetchUserRole, fetchActivityLog, fetchPhaseSummaries]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    useEffect(() => {
        if(loadingRole || dataLoading) return;
        if (userRole === 'management' || userRole === 'admin') setActiveSection('dashboard');
        else if (userRole === 'employee') setActiveSection('empleados');
    }, [userRole, loadingRole, dataLoading]);

    const getTaskState = useCallback((taskId) => {
        return tasks.find(t => t.task_id === taskId) || { status: 'pendiente', notes: '', is_editing: false };
    }, [tasks]);
    
    const updateTask = async (taskId, newState, showSuccessNotification = true) => {
        const existingTask = getTaskState(taskId);
        const mergedState = { ...existingTask, ...newState };
        const is_completed = mergedState.status === 'aprobado';
        let notes = (mergedState.notes || '').replace('[state:parado]', '').trim();
        if (mergedState.status === 'parado') notes = `[state:parado] ${notes}`.trim();
        const updatePayload = { user_id: user.id, task_id: taskId, is_completed, notes };
        try {
            const { data: dbData, error } = await supabaseClient.from('tasks').upsert(updatePayload, { onConflict: 'user_id, task_id' }).select().single();
            if (error) throw error;
            if (showSuccessNotification) showNotification(newState.status ? 'Estado actualizado.' : 'Notas guardadas.', 'success');
            setTasks(prevTasks => prevTasks.map(t => t.task_id === taskId ? { ...t, ...mergedState, notes: dbData.notes } : t));
        } catch (error) {
            showNotification(`Error al guardar: ${error.message}`, 'error');
        }
    };
    
    const handleToggleEditTask = (taskId, isEditing) => {
        setTasks(prevTasks => prevTasks.map(task => task.task_id === taskId ? { ...task, is_editing: isEditing } : task));
    };
    
    const handleSaveSettings = async (settings) => {
        setAiModel(settings.aiModel);
        setOpenaiApiKey(settings.openaiApiKey);
        const { error } = await supabaseClient.from('profiles').update({ openai_api_key: settings.openaiApiKey }).eq('id', user.id);
        showNotification(error ? `Error al guardar: ${error.message}` : 'Configuración guardada.', error ? 'error' : 'success');
        setShowSettings(false);
    };

    const handleRecording = async (taskId) => {
        if (isRecording) { mediaRecorder.current?.stop(); return; }
        if (!openaiApiKey) { showNotification('Configura tu clave de API de OpenAI.', 'error'); return; }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setIsRecording(true);
            setActiveTaskId(taskId);
            mediaRecorder.current = new MediaRecorder(stream);
            const audioChunks = [];
            mediaRecorder.current.ondataavailable = e => audioChunks.push(e.data);
            mediaRecorder.current.onstop = async () => {
                stream.getTracks().forEach(track => track.stop());
                setIsRecording(false);
                setIsProcessing(true);
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                if (audioBlob.size === 0) { setIsProcessing(false); setActiveTaskId(null); return; }
                const formData = new FormData();
                formData.append('file', audioBlob, 'recording.webm');
                formData.append('model', 'whisper-1');
                try {
                    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${openaiApiKey}` }, body: formData });
                    const data = await res.json();
                    if (data.error) throw new Error(data.error.message);
                    const currentNotes = getTaskState(taskId).notes.replace('[state:parado]', '').trim() || '';
                    await updateTask(taskId, { notes: `${currentNotes}\n${data.text}`.trim() });
                } catch (error) { showNotification(`Error con la API de OpenAI: ${error.message}`, 'error'); } 
                finally { setIsProcessing(false); setActiveTaskId(null); }
            };
            mediaRecorder.current.start();
        } catch(err) {
            showNotification('No se pudo acceder al micrófono.', 'error');
            setIsRecording(false);
            setActiveTaskId(null);
        }
    };

    const handleGenerateSummary = async (taskId) => {
        const task = getTaskState(taskId);
        const summarySeparator = '--- Resumen IA ---';
        const notesToSummarize = task.notes.replace('[state:parado]', '').split(summarySeparator)[0].trim();
        if (!notesToSummarize) { showNotification('No hay notas para resumir.', 'error'); return; }
        if (!openaiApiKey) { showNotification('La clave de API de OpenAI no está configurada.', 'error'); return; }
        setIsProcessing(true);
        setActiveTaskId(taskId);
        try {
            const prompt = `Resume el siguiente texto de forma concisa y clara en español: ${notesToSummarize}`;
            const summaryRes = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiApiKey}` },
                body: JSON.stringify({ model: aiModel, messages: [{ role: 'user', content: prompt }] })
            });
            const summaryData = await summaryRes.json();
            if (summaryData.error) throw new Error(summaryData.error.message);
            const summary = summaryData.choices[0].message.content;
            await updateTask(taskId, { notes: `${notesToSummarize}\n\n${summarySeparator}\n${summary}` });
        } catch (error) { showNotification(`Error al generar resumen: ${error.message}`, 'error'); } 
        finally { setIsProcessing(false); setActiveTaskId(null); }
    };
    
    const handleExportAllToPDF = () => {
        logActivity('Iniciada exportación a PDF de todo el informe');
        const pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
        let y = 20;
        const pageHeight = 297;
        const margin = 15;
        const contentWidth = 210 - (2 * margin);

        const checkPageBreak = (currentY, requiredHeight) => {
            if (currentY + requiredHeight > pageHeight - margin) {
                pdf.addPage();
                return margin;
            }
            return currentY;
        };

        pdf.setFontSize(22);
        pdf.setFont("helvetica", "bold");
        pdf.text("Informe del Estudio Organizativo", 105, y, { align: 'center' });
        y += 8;
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "normal");
        pdf.text("EGEA Dev", 105, y, { align: 'center' });
        y += 4;
        pdf.setFontSize(10);
        pdf.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, 105, y, { align: 'center' });
        y += 15;

        pdf.setFontSize(16);
        pdf.setFont("helvetica", "bold");
        pdf.text("Resumen General", margin, y);
        y += 8;
        
        const approvedTasksCount = tasks.filter(t => t.status === 'aprobado').length;
        const totalTasks = allTaskIds.length;
        const progress = totalTasks > 0 ? Math.round((approvedTasksCount / totalTasks) * 100) : 0;
        
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        pdf.text(`- Progreso Total: ${progress}% (${approvedTasksCount} de ${totalTasks} tareas aprobadas)`, margin + 5, y);
        y += 7;
        pdf.text(`- Fichas de Empleado Registradas: ${jobProfiles.length}`, margin + 5, y);
        y += 15;

        studyData.filter(p => p.id.startsWith('phase')).forEach(phase => {
            y = checkPageBreak(y, 20);
            pdf.setFontSize(14);
            pdf.setFont("helvetica", "bold");
            pdf.text(phase.title, margin, y);
            y += 8;
            phase.sections.forEach(section => {
                if (section.subtitle) {
                    y = checkPageBreak(y, 10);
                    pdf.setFontSize(12);
                    pdf.setFont("helvetica", "bold");
                    pdf.text(section.subtitle, margin, y);
                    y += 7;
                }
                section.tasks?.forEach(taskId => {
                    const taskState = getTaskState(taskId);
                    const statusSymbol = { pendiente: '○', parado: '✗', aprobado: '✓' };
                    const taskLines = pdf.splitTextToSize(`${statusSymbol[taskState.status]} ${taskId}`, contentWidth - 8);
                    y = checkPageBreak(y, taskLines.length * 5);
                    pdf.setFontSize(10);
                    pdf.text(taskLines, margin + 5, y);
                    y += taskLines.length * 5;
                });
                y += 5;
            });
        });

        pdf.save(`informe-egea-${new Date().toISOString().slice(0,10)}.pdf`);
    };

    const getVisibleNavItems = () => {
        if (userRole === 'admin') return studyData;
        if (userRole === 'management') return studyData.filter(p => p.id === 'dashboard' || p.id === 'summaries');
        return [];
    };
    
    const handleEditProfileFromChart = (profileId) => {
        const profileToEdit = jobProfiles.find(p => p.id === profileId);
        if (profileToEdit) {
            setProfileToEdit(profileToEdit);
            setActiveSection('empleados');
        }
    };

    if (loadingRole || dataLoading) {
        return <div className="flex justify-center items-center h-screen"><LoaderIcon /></div>;
    }

    const approvedTasksCount = tasks.filter(t => t.status === 'aprobado').length;
    const progress = allTaskIds.length > 0 ? (approvedTasksCount / allTaskIds.length) * 100 : 0;

    return (
        <>
            {notification.show && <div className={`notification ${notification.type}`}>{notification.message}</div>}
            {showSettings && <SettingsModal onClose={() => setShowSettings(false)} onSave={handleSaveSettings} initialSettings={{ openaiApiKey, aiModel }} />}
            <div className="container">
                {userRole !== 'employee' && (
                    <div className="header">
                        <div className="header-title">
                            <h1>EGEA Dev</h1>
                            <p>Estudio Organizativo - Análisis de Estructura y Procesos Internos</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <ProfileDropdown user={user} loginTime={loginTime} showNotification={showNotification} onSettingsClick={() => setShowSettings(true)} onExportAll={handleExportAllToPDF} />
                            <div className="md:hidden"><button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2">{isMenuOpen ? <XIcon /> : <MenuIcon />}</button></div>
                        </div>
                    </div>
                )}
                {userRole !== 'employee' && (
                     <nav className={`navigation ${isMenuOpen ? 'flex-col items-start' : 'hidden'} md:flex md:flex-row md:items-center`}>
                        {getVisibleNavItems().map(phase => (
                            <button key={phase.id} data-sectionid={phase.id} className={`nav-btn w-full md:w-auto text-left ${activeSection === phase.id ? 'active' : ''}`} onClick={() => {setActiveSection(phase.id); setIsMenuOpen(false);}}>{phase.title}</button>
                        ))}
                        {(userRole === 'admin' || userRole === 'management') && (
                            <>
                                <button className={`nav-btn w-full md:w-auto text-left ${activeSection === 'empleados' ? 'active' : ''}`} onClick={() => {setActiveSection('empleados'); setIsMenuOpen(false);}}>Empleados</button>
                                <button className={`nav-btn w-full md:w-auto text-left ${activeSection === 'organigrama' ? 'active' : ''}`} onClick={() => {setActiveSection('organigrama'); setIsMenuOpen(false);}}>Organigrama</button>
                            </>
                        )}
                    </nav>
                )}

                <div className={`content-section ${activeSection === 'dashboard' ? 'active' : ''}`}>
                    <DashboardSection jobProfiles={jobProfiles} progress={progress} onNavigate={setActiveSection} activityLog={activityLog} setProfileToEdit={setProfileToEdit} onResetLog={handleResetLog} studyData={studyData}/>
                </div>
                <div className={`content-section ${activeSection === 'summaries' ? 'active' : ''}`}>
                    <SummariesSection phaseSummaries={phaseSummaries} showNotification={showNotification} aiModel={aiModel} openaiApiKey={openaiApiKey} studyData={studyData}/>
                </div>
                {studyData.filter(p => p.id.startsWith('phase') || p.id === 'timeline').map(phase => (
                    <div key={phase.id} className={`content-section ${activeSection === phase.id ? 'active' : ''}`}>
                        {phase.sections && phase.sections.map((section, idx) => (
                            <div key={idx} className={section.tasks ? "subsection" : "phase-header"}>
                                {section.title && <h2>{section.title}</h2>}
                                {section.description && <p>{section.description}</p>}
                                {section.subtitle && <h3>{section.subtitle}</h3>}
                                {section.tasks && (
                                    <ul className="checklist">
                                        {section.tasks.map(taskId => (
                                            <TaskItem key={taskId} taskId={taskId} taskState={getTaskState(taskId)} onStatusChange={updateTask} onNoteChange={updateTask} onRecord={{handle: handleRecording, isRecording, isProcessing, activeTaskId}} onSummarize={handleGenerateSummary} onEditClick={handleToggleEditTask}/>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                        {phase.id.startsWith('phase') && <PhaseSummary phase={phase} allTasks={tasks} showNotification={showNotification} user={user} summaryData={phaseSummaries.find(s => s.phase_id === phase.id)} onSummaryUpdate={fetchPhaseSummaries} aiModel={aiModel} openaiApiKey={openaiApiKey} studyData={studyData}/>}
                    </div>
                ))}
                <div className={`content-section ${activeSection === 'empleados' ? 'active' : ''}`}>
                    <EmpleadosSection user={user} showNotification={showNotification} onNavigate={setActiveSection} openaiApiKey={openaiApiKey} aiModel={aiModel} logActivity={logActivity} userRole={userRole} predefinedOptions={PREDEFINED_OPTIONS} profileToEdit={profileToEdit} setProfileToEdit={setProfileToEdit} jobProfiles={jobProfiles} setJobProfiles={setJobProfiles}/>
                </div>
                <div className={`content-section ${activeSection === 'organigrama' ? 'active' : ''}`}>
                    <Organigrama jobProfiles={jobProfiles} showNotification={showNotification} predefinedOptions={PREDEFINED_OPTIONS} onEditProfile={handleEditProfileFromChart} aiModel={aiModel} openaiApiKey={openaiApiKey}/>
                </div>
            </div>
            {userRole === 'employee' && <EmployeeFooter />}
        </>
    );
};


// --- COMPONENTE APP (El controlador de sesión) ---
export const App = () => {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabaseClient.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });
        const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });
        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><LoaderIcon /></div>;
    }
    
    return session ? <EstudioApp user={session.user} /> : <Auth />;
};
