import React, { useState, useEffect } from 'react';
import { supabaseClient } from './services/supabaseClient';
import { Auth } from './components/Auth';
import { DashboardSection } from './components/DashboardSection';
import { EmpleadosSection } from './components/EmpleadosSection';
import { Organigrama } from './components/Organigrama';
import { SummariesSection } from './components/SummariesSection';
import { TaskItem } from './components/TaskItem';
import { ProfileDropdown } from './components/ProfileDropdown';
// MODIFICACIÓN: Cambiado 'SettingsModal' por el nombre correcto 'ApiKeySettingsModal'
import { ConfirmationModal, ApiKeySettingsModal, GeneradorDescripcionModal } from './components/Modals';
import { JobProfileDetail } from './components/JobProfileDetail';
import logo from './assets/img/logo-egea.png';

const App = () => {
    const [session, setSession] = useState(null);
    const [userRole, setUserRole] = useState('employee');
    const [activeSection, setActiveSection] = useState('dashboard');
    const [jobProfiles, setJobProfiles] = useState([]);
    const [profileToEdit, setProfileToEdit] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [openaiApiKey, setOpenaiApiKey] = useState(() => localStorage.getItem('openaiApiKey') || '');
    const [aiModel, setAiModel] = useState(() => localStorage.getItem('aiModel') || 'gpt-3.5-turbo');

    useEffect(() => {
        supabaseClient.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) {
                fetchUserProfile(session.user);
                fetchJobProfiles();
            } else {
                setLoading(false);
            }
        });

        const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) {
                fetchUserProfile(session.user);
                if (jobProfiles.length === 0) fetchJobProfiles(); 
            } else {
                setJobProfiles([]);
                setUserRole('employee');
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserProfile = async (user) => {
        const { data, error } = await supabaseClient
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .single();
        
        if (data) setUserRole(data.role);
        setLoading(false);
    };

    const fetchJobProfiles = async () => {
        setLoading(true);
        const { data, error } = await supabaseClient.from('job_profiles').select('*').order('id', { ascending: true });
        if (error) {
            console.error('Error fetching job profiles:', error);
            showNotification('Error al cargar las fichas de puesto.', 'error');
        } else {
            setJobProfiles(data);
        }
        setLoading(false);
    };

    const handleLogout = async () => {
        await supabaseClient.auth.signOut();
        setActiveSection('dashboard');
    };
    
    const showNotification = (message, type = 'info') => {
        alert(`${type.toUpperCase()}: ${message}`);
    };

    const logActivity = async (action) => {
        if (session) {
            await supabaseClient.from('activity_log').insert({ user_id: session.user.id, action });
        }
    };
    
    const predefinedOptions = {
        puestos: ['Desarrollador', 'Diseñador', 'Jefe de Proyecto', 'Comercial'],
        departamentos: ['Tecnología', 'Diseño', 'Ventas', 'Administración'],
        reporta_a: ['Director de Tecnología', 'Director de Diseño'],
        tipos_contrato: ['Indefinido', 'Temporal', 'Prácticas'],
        modalidades_trabajo: ['Remoto', 'Híbrido', 'Presencial']
    };

    if (loading && !session) {
        return <div className="loading-fullscreen">Cargando...</div>;
    }

    if (!session) {
        return <Auth />;
    }

    return (
        <div className="app-container">
            <header className="app-header">
                <div className="logo-container">
                    <img src={logo} alt="Logo" className="logo" />
                    <h1>Portal del Empleado</h1>
                </div>
                <ProfileDropdown user={session.user} onLogout={handleLogout} onSettings={() => setShowSettings(true)} />
            </header>

            <div className="main-content">
                <nav className="sidebar">
                    <ul>
                        <li className={activeSection === 'dashboard' ? 'active' : ''} onClick={() => setActiveSection('dashboard')}>Dashboard</li>
                        {userRole !== 'employee' && <li className={activeSection === 'empleados' ? 'active' : ''} onClick={() => setActiveSection('empleados')}>Gestión Fichas</li>}
                        <li className={activeSection === 'organigrama' ? 'active' : ''} onClick={() => setActiveSection('organigrama')}>Organigrama</li>
                        <li className={activeSection === 'summaries' ? 'active' : ''} onClick={() => setActiveSection('summaries')}>Resúmenes IA</li>
                    </ul>
                </nav>

                <main className="content-area">
                    {activeSection === 'dashboard' && <DashboardSection user={session.user} />}
                    {activeSection === 'empleados' && userRole !== 'employee' && (
                        <EmpleadosSection
                            user={session.user}
                            showNotification={showNotification}
                            logActivity={logActivity}
                            userRole={userRole}
                            predefinedOptions={predefinedOptions}
                            profileToEdit={profileToEdit}
                            setProfileToEdit={setProfileToEdit}
                            jobProfiles={jobProfiles}
                            setJobProfiles={setJobProfiles}
                            refetchJobProfiles={fetchJobProfiles}
                            openaiApiKey={openaiApiKey}
                            aiModel={aiModel}
                        />
                    )}
                    {activeSection === 'organigrama' && <Organigrama jobProfiles={jobProfiles} onProfileClick={(profile) => { setProfileToEdit(profile); setActiveSection('empleados'); }} />}
                    {activeSection === 'summaries' && <SummariesSection jobProfiles={jobProfiles} openaiApiKey={openaiApiKey} aiModel={aiModel} />}
                </main>
            </div>
            
            {showSettings && (
                // MODIFICACIÓN: Usando el nombre correcto del componente
                <ApiKeySettingsModal 
                    onClose={() => setShowSettings(false)}
                    apiKey={openaiApiKey}
                    setApiKey={setOpenaiApiKey}
                    model={aiModel}
                    setModel={setAiModel}
                />
            )}
        </div>
    );
};

export default App;
