import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabaseClient } from './services/supabaseClient';
import { studyData } from './data/studyData';

import { Auth } from './components/Auth';
import { DashboardSection } from './components/DashboardSection';
import { EmpleadosSection } from './components/EmpleadosSection';
import { Organigrama } from './components/Organigrama';
import { SummariesSection } from './components/SummariesSection';
import { TaskItem } from './components/TaskItem';
import { ProfileDropdown } from './components/ProfileDropdown';
import { Icons } from './components/Icons';
import { ConfirmationModal, SettingsModal, GeneradorDescripcionModal } from './components/Modals';
import { JobProfileDetail } from './components/JobProfileDetail';
import { JobProfileForm } from './components/JobProfileForm';

const PARADO_TAG = '[state:parado]';

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
    const [activeTaskId, setActiveTaskId] = useState(null);
    const [loginTime] = useState(Date.now());
    const [showSettings, setShowSettings] = useState(false);
    const [userRole, setUserRole] = useState('employee');
    const [loadingRole, setLoadingRole] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [profileToEdit, setProfileToEdit] = useState(null);

    const allTaskIds = useMemo(() => 
        studyData.flatMap(phase => phase.sections?.flatMap(section => section.tasks || []) || []).filter(Boolean),
        []
    );

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
    
    // ... (El resto de tus funciones como fetchUserRole, logActivity, updateTask, etc. irían aquí)
    
    return (
      <>
        {notification.show && <div className={`notification ${notification.type}`}>{notification.message}</div>}
        {/* Aquí iría el resto del JSX que renderiza la aplicación principal */}
        <div className="container">
            <p>Contenido principal de la aplicación...</p>
            {/* Ejemplo de cómo usar un componente */}
            {activeSection === 'dashboard' && <DashboardSection />}
        </div>
      </>
    );
};

const App = () => {
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
        return <div className="flex justify-center items-center h-screen"><Icons.LoaderIcon /></div>;
    }
    
    return session ? <EstudioApp user={session.user} /> : <Auth />;
};

export default App;
