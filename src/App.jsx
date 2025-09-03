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
    const handleLogout = () => supabaseClient.auth.signOut();
    return (
        <footer style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', padding: '20px', backgroundColor: 'var(--background-white)', textAlign: 'center', boxShadow: '0 -2px 5px rgba(0,0,0,0.1)', zIndex: 1000 }}>
            <button onClick={handleLogout} className="btn-danger">Cerrar Sesión</button>
        </footer>
    );
};

const EstudioApp = ({ user }) => {
    const [activeSection, setActiveSection] = useState('dashboard');
    const [tasks, setTasks] = useState([]);
    const [jobProfiles, setJobProfiles] = useState([]);
    // ...el resto del código de tu componente EstudioApp
    return (
        // ...el JSX de tu componente EstudioApp
    );
};

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
