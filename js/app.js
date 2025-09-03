const { useState, useEffect, useRef, useCallback, useLayoutEffect } = React;
const { createClient } = supabase;
const { jsPDF } = window.jspdf;

// --- SUPABASE CREDENTIALS ---
const supabaseUrl = 'https://mtncylafoftawkuruinu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10bmN5bGFmb2Z0YXdrdXJ1aW51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5Nzc5MzAsImV4cCI6MjA2NzU1MzkzMH0.K3w1EiuhSXGbbEtY0muyDEUXvlxGkmnb9fCrv3eSuOU';
const supabaseClient = createClient(supabaseUrl, SUPABASE_ANON_KEY);

// --- STUDY DATA ---
const studyData = [
    { id: 'dashboard', title: 'Visión General' },
    { id: 'timeline', title: 'Cronograma', sections: [
        { title: 'CRONOGRAMA GENERAL DEL ESTUDIO', description: 'Duración total: 8 semanas' },
        { subtitle: 'Recursos Necesarios', tasks: ['1 Coordinador del estudio (dedicación 50%)', 'Participación de todos los empleados (entrevistas)', 'Apoyo de la dirección', 'Computadora con software de diagramación', 'Material de oficina para documentación', 'Acceso a información de la empresa', 'Costo de oportunidad del tiempo del personal', 'Posible consultoría externa (opcional)', 'Software especializado (opcional)'] },
        { subtitle: 'Indicadores de Éxito del Estudio', tasks: ['Participación: 100% de empleados entrevistados', 'Documentación: Todos los procesos principales mapeados', 'Oportunidades: Al menos 10 mejoras identificadas', 'Consenso: Aceptación de dirección y empleados', 'Implementación: Plan de acción definido y aprobado'] }
    ]},
    { id: 'phase1', title: 'Fase 1', sections: [
        { title: 'FASE 1: PREPARACIÓN Y PLANIFICACIÓN', description: 'Tiempo estimado: 1-2 días' },
        { subtitle: '1.1 Definición de Objetivos', tasks: ['Definir objetivo principal del estudio', 'Establecer 3-5 objetivos específicos y medibles', 'Documentar expectativas de la dirección', 'Identificar stakeholders clave'] },
        { subtitle: '1.2 Conformación del Equipo de Estudio', tasks: ['Designar coordinador principal del estudio', 'Identificar personas clave para entrevistas', 'Definir cronograma detallado (4-6 semanas)', 'Comunicar el proyecto a toda la organización', 'Establecer metodología de trabajo'] }
    ]},
    { id: 'phase2', title: 'Fase 2', sections: [
        { title: 'FASE 2: DIAGNÓSTICO DE ESTRUCTURA ORGANIZATIVA', description: 'Tiempo estimado: 3-4 días' },
        { subtitle: 'A) Identificación de Niveles Jerárquicos', tasks: ['Nivel Directivo: Gerencia general, socios, dirección', 'Nivel Intermedio: Jefes de área, supervisores', 'Nivel Operativo: Empleados de primera línea'] },
        { subtitle: 'B) Departamentos y Áreas Funcionales', tasks: ['Área Comercial: Ventas, atención al cliente, desarrollo de negocio', 'Área de Diseño: Diseñadores, asesores de decoración', 'Área de Producción/Taller: Confección textil, carpintería, tapicería', 'Área de Compras: Proveedores, materiales, textiles', 'Área de Instalación: Equipos de montaje, logística de entrega', 'Área Administrativa: Contabilidad, RRHH, facturación', 'Área de Almacén: Gestión de stock, recepción, despacho'] },
        { subtitle: '2.2 Análisis de Puestos de Trabajo', tasks: ['Denominación del puesto', 'Objetivo principal', 'Dependencia jerárquica (a quién reporta)', 'Personal a cargo (si aplica)', 'Responsabilidades principales (5-8 máximo)', 'Competencias requeridas', 'Interacciones internas (con qué áreas trabaja)', 'Interacciones externas (clientes, proveedores)'] }
    ]},
    { id: 'phase3', title: 'Fase 3', sections: [
        { title: 'FASE 3: ANÁLISIS DE PROCESOS INTERNOS', description: 'Tiempo estimado: 4-5 días' },
        { subtitle: 'A) Procesos Estratégicos', tasks: ['Planificación estratégica', 'Desarrollo de nuevos productos/servicios', 'Gestión de la calidad'] },
        { subtitle: 'B) Procesos Operativos (Core Business)', tasks: ['Proceso Comercial: Prospección → Presupuesto → Venta', 'Proceso de Diseño: Briefing → Propuesta → Aprobación', 'Proceso de Compras: Solicitud → Cotización → Compra', 'Proceso de Producción: Orden → Fabricación → Control de calidad', 'Proceso de Instalación: Programación → Instalación → Entrega', 'Proceso de Facturación: Venta → Factura → Cobro'] },
        { subtitle: 'C) Procesos de Apoyo', tasks: ['Gestión de recursos humanos', 'Gestión financiera y contable', 'Mantenimiento y limpieza', 'Sistemas de información'] },
        { subtitle: '3.2 Mapeo Detallado de Procesos', tasks: ['Objetivo del proceso', 'Responsable del proceso', 'Actividades paso a paso', 'Recursos necesarios', 'Tiempos de ejecución', 'Documentos/formularios utilizados', 'Indicadores de desempeño', 'Puntos críticos o cuellos de botella'] }
    ]},
    { id: 'phase4', title: 'Fase 4', sections: [
        { title: 'FASE 4: HERRAMIENTAS DE ANÁLISIS Y DOCUMENTACIÓN', description: 'Tiempo estimado: 2-3 días' },
        { subtitle: 'A) Para Estructura Organizativa:', tasks: ['Organigrama funcional: Estructura jerárquica actual', 'Matriz de responsabilidades: RACI', 'Análisis de cargas de trabajo: Distribución por persona'] },
        { subtitle: 'B) Para Procesos:', tasks: ['Diagramas de flujo: Representación visual de procesos', 'Mapas de procesos: Interrelación entre procesos', 'Matriz de procesos vs. estructura: Quién hace qué'] }
    ]},
    { id: 'phase5', title: 'Fase 5', sections: [
        { title: 'FASE 5: ANÁLISIS DE RESULTADOS', description: 'Tiempo estimado: 3-4 días' },
        { subtitle: '5.1 Evaluación de la Estructura Actual', tasks: ['Eficiencia de la estructura: ¿Los niveles jerárquicos son apropiados?', 'Claridad de roles: ¿Todos conocen sus responsabilidades?', 'Comunicación: ¿Los canales son efectivos?', 'Sobrecarga/Subcarga: ¿Hay desequilibrio en cargas de trabajo?', 'Duplicidades: ¿Hay funciones repetidas innecesariamente?'] },
        { subtitle: '5.2 Evaluación de Procesos', tasks: ['Eficiencia: ¿Los procesos son ágiles y efectivos?', 'Efectividad: ¿Se logran los objetivos esperados?', 'Calidad: ¿Los resultados cumplen los estándares?', 'Costos: ¿Los procesos son rentables?', 'Riesgos: ¿Existen puntos críticos de falla?'] },
        { subtitle: 'Técnicas de Análisis Recomendadas', tasks: ['Análisis FODA (Fortalezas, Oportunidades, Debilidades, Amenazas)', 'Diagrama de Pareto para identificar problemas principales', 'Análisis de valor agregado en procesos', 'Benchmarking con empresas del sector'] }
    ]},
    { id: 'phase6', title: 'Fase 6', sections: [
        { title: 'FASE 6: IDENTIFICACIÓN DE OPORTUNIDADES DE MEJORA', description: 'Tiempo estimado: 3-4 días' },
        { subtitle: '6.1 Problemas Identificados (Estructura Organizativa)', tasks: ['Problemas de comunicación', 'Falta de claridad en responsabilidades', 'Niveles jerárquicos inadecuados', 'Desequilibrio en cargas de trabajo'] },
        { subtitle: '6.1 Problemas Identificados (Procesos)', tasks: ['Cuellos de botella', 'Actividades redundantes', 'Falta de estandarización', 'Ausencia de controles'] },
        { subtitle: '6.2 Oportunidades de Mejora (Priorización)', tasks: ['Impacto en el negocio (Alto/Medio/Bajo)', 'Facilidad de implementación (Fácil/Media/Difícil)', 'Recursos requeridos (Altos/Medios/Bajos)', 'Tiempo de implementación (Corto/Medio/Largo plazo)'] }
    ]},
    { id: 'phase7', title: 'Fase 7', sections: [
        { title: 'FASE 7: PLAN DE IMPLEMENTACIÓN', description: 'Tiempo estimado: 4-5 días' },
        { subtitle: '7.1 Propuestas de Mejora', tasks: ['Descripción de la mejora', 'Objetivos específicos', 'Responsable de implementación', 'Cronograma', 'Recursos necesarios', 'Indicadores de éxito', 'Riesgos y contingencias'] },
        { subtitle: '7.2 Cronograma de Implementación', tasks: ['Fase 1: Mejoras de corto plazo (1-3 meses)', 'Fase 2: Mejoras de mediano plazo (3-6 meses)', 'Fase 3: Mejoras de largo plazo (6-12 meses)'] }
    ]},
    { id: 'summaries', title: 'Resumenes' }
];

const allTaskIds = studyData.flatMap(phase => phase.sections?.flatMap(section => section.tasks || []) || []).filter(Boolean);

// --- ICONS ---
const MicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>;
const LoaderIcon = () => <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.553L16.5 21.75l-.398-1.197a3.375 3.375 0 00-2.455-2.455L12.75 18l1.197-.398a3.375 3.375 0 002.455 2.455l.398-1.197.398 1.197a3.375 3.375 0 002.455 2.455l1.197.398-1.197.398a3.375 3.375 0 00-2.455 2.455z"/></svg>;
const CopyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;

// --- HOOKS ---
const useAutosizeTextArea = (textAreaRef, value) => {
    useEffect(() => {
        if (textAreaRef && textAreaRef.current) {
            textAreaRef.current.style.height = "0px";
            const scrollHeight = textAreaRef.current.scrollHeight;
            textAreaRef.current.style.height = scrollHeight + "px";
        }
    }, [textAreaRef, value]);
};

// --- MAIN APP COMPONENT ---
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
        return <div className="flex justify-center items-center h-screen"><LoaderIcon /></div>;
    }
    
    return session ? <EstudioApp user={session.user} /> : <Auth />;
};

// --- AUTH COMPONENT ---
const Auth = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [view, setView] = useState('express');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
            if (error) throw error;
        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            const { data, error } = await supabaseClient.auth.signUp({ email, password });
            if (error) throw error;
            if (data.user) {
                const { error: profileError } = await supabaseClient
                    .from('profiles')
                    .insert({ id: data.user.id, role: 'employee' });
                if (profileError) throw profileError;
            }
            setMessage('¡Registro exitoso! Revisa tu correo para verificar la cuenta.');
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleExpressLink = async (e) => {
        e.preventDefault();
        if (!email) {
            setMessage("Por favor, introduce tu email para recibir el enlace de acceso.");
            return;
        }
        setLoading(true);
        setMessage('');
        try {
            const { error } = await supabaseClient.auth.signInWithOtp({ email });
            if (error) throw error;
            setMessage('¡Revisa tu correo! Te hemos enviado un enlace para iniciar sesión.');
        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };
    
    return ( 
        <div className="auth-container"> 
            <div className="flex justify-center mb-4"><img src="https://egea.creativiza.com/expansion/logo-783%20(1).png" alt="Logo de EGEA" className="h-12" /></div>
            
            {view === 'express' && (
                 <>
                    <h2 className="text-xl font-bold text-center mb-6">Acceso Express</h2> 
                    <form onSubmit={handleExpressLink} className="space-y-4"> 
                        <input type="email" placeholder="tu-correo@egea.com" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-2 border rounded-md text-center" /> 
                        <button type="submit" className="w-full btn-success justify-center" disabled={loading}>
                            {loading ? <LoaderIcon /> : 'Enviar Enlace de Acceso'}
                        </button> 
                    </form>
                    <div className="mt-4 text-center">
                        <a href="#" onClick={(e) => { e.preventDefault(); setView('login'); }} className="text-sm text-blue-600 hover:underline">
                            O iniciar sesión con contraseña
                        </a>
                    </div>
                </>
            )}

            {view === 'login' && (
                <>
                    <h2 className="text-xl font-bold text-center mb-6">Iniciar Sesión</h2> 
                    <form onSubmit={handleLogin} className="space-y-4"> 
                        <input type="email" placeholder="correo@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-2 border rounded-md text-center" /> 
                        <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-2 border rounded-md text-center" /> 
                        <button type="submit" className="w-full btn-action justify-center" disabled={loading}>
                            {loading ? <LoaderIcon /> : 'Entrar'}
                        </button> 
                    </form>
                    <p className="text-center mt-4">
                        <a href="#" onClick={(e) => { e.preventDefault(); setView('signUp'); }} className="text-sm text-blue-600 hover:underline">
                           ¿No tienes cuenta? Regístrate
                        </a>
                    </p>
                     <div className="mt-2 text-center">
                        <a href="#" onClick={(e) => { e.preventDefault(); setView('express'); }} className="text-xs text-gray-500 hover:underline">
                            Volver a Acceso Express
                        </a>
                    </div>
                </>
            )}

            {view === 'signUp' && (
                 <>
                    <h2 className="text-xl font-bold text-center mb-6">Registrarse</h2> 
                    <form onSubmit={handleSignUp} className="space-y-4"> 
                        <input type="email" placeholder="correo@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-2 border rounded-md text-center" /> 
                        <input type="password" placeholder="Crea una contraseña" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-2 border rounded-md text-center" /> 
                        <button type="submit" className="w-full btn-action justify-center" disabled={loading}>
                            {loading ? <LoaderIcon /> : 'Crear Cuenta'}
                        </button> 
                    </form>
                     <p className="text-center mt-4">
                        <a href="#" onClick={(e) => { e.preventDefault(); setView('login'); }} className="text-sm text-blue-600 hover:underline">
                            ¿Ya tienes cuenta? Inicia sesión
                        </a>
                    </p>
                </>
            )}
            
            {message && <p className={`mt-4 text-center text-sm ${message.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>} 
        </div> 
    );
};

// --- TASK ITEM COMPONENT ---
const TaskItem = ({ taskId, taskState, onToggle, onNoteChange, onRecord, onSummarize, isEditing, onEditClick }) => {
    const { isRecording, isProcessing, activeTaskId } = onRecord;
    const { is_completed, notes } = taskState;
    const summarySeparator = '--- Resumen IA ---';
    const hasSummary = notes && notes.includes(summarySeparator);
    const mainNotes = hasSummary ? notes.split(summarySeparator)[0].trim() : notes;
    const summaryText = hasSummary ? notes.split(summarySeparator)[1].trim() : null;
    const textAreaRef = useRef(null);
    const summaryTextAreaRef = useRef(null);

    useAutosizeTextArea(textAreaRef, mainNotes);
    useAutosizeTextArea(summaryTextAreaRef, summaryText);

    const handleBlur = (e) => {
        const newNotes = e.target.value;
        const finalNotes = summaryText ? `${newNotes}\n\n${summarySeparator}\n${summaryText}` : newNotes;
        onNoteChange(taskId, { notes: finalNotes });
    };

    const handleDeleteSummary = () => {
        onNoteChange(taskId, { notes: mainNotes });
    };

    return (
         <li className={is_completed ? 'completed' : ''}>
            <div className="flex items-start">
                <input type="checkbox" className="task-checkbox mt-1" checked={is_completed} onChange={() => onToggle(taskId, { is_completed: !is_completed })} />
                <div className="flex-grow">
                    <span className="task-text" onClick={() => onEditClick(taskId)}>{taskId}</span>
                    {isEditing && (
                        <div className="mt-2">
                            <textarea 
                                ref={textAreaRef}
                                className="notes-textarea" 
                                placeholder="Escribe tus notas aquí o usa el micrófono..." 
                                defaultValue={mainNotes} 
                                onBlur={handleBlur} 
                                autoFocus 
                            />
                            <div className="flex items-center mt-1">
                                 <button type="button" onClick={() => onRecord.handle(taskId)} className={`voice-btn ${isRecording && activeTaskId === taskId ? 'listening' : ''}`} disabled={isProcessing}>
                                    {(isRecording && activeTaskId === taskId) ? <LoaderIcon /> : <MicIcon />}
                                </button>
                                 <button type="button" onClick={() => onSummarize(taskId)} className="btn-secondary text-xs px-2 py-1 ml-2" disabled={isProcessing || !mainNotes || isRecording}>
                                    {(isProcessing && activeTaskId === taskId) ? <LoaderIcon /> : 'Resumen con IA'}
                                </button>
                                {hasSummary && (
                                    <button type="button" onClick={handleDeleteSummary} className="btn-danger text-xs px-2 py-1 ml-2">Borrar Resumen</button>
                                )}
                            </div>
                            {summaryText && (
                                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <h4 className="font-semibold text-sm text-blue-800">Resumen de IA</h4>
                                    <textarea
                                        ref={summaryTextAreaRef}
                                        readOnly
                                        className="w-full bg-transparent border-none focus:ring-0 p-0 m-0 text-sm text-gray-700 mt-1 resize-none"
                                        value={summaryText}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </li>
    );
};

// --- JOB PROFILE FORM COMPONENT ---
const JobProfileForm = ({ user, onSave, onCancel, showNotification, profileToEdit, predefinedOptions, logActivity }) => {
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
                if (!error) showNotification('Ficha actualizada con éxito.');
            } else {
                const { error: insertError } = await supabaseClient.from('job_profiles').insert(completeData);
                error = insertError;
                if (!error) showNotification('Ficha creada con éxito.');
            }
            if (error) throw error;
            onSave();
        } catch (error) {
            showNotification(`Error al guardar: ${error.message}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="subsection">
            <h3 className="text-lg font-bold mb-4">{profileToEdit ? 'Editar Ficha de Empleado' : 'Nueva Ficha de Empleado'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="form-label">Nombre y Apellidos</label>
                        <input type="text" name="nombre_apellidos" value={formData.nombre_apellidos} onChange={handleInputChange} required className="form-input" />
                    </div>
                    <div>
