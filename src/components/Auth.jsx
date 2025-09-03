import React, { useState } from 'react';
// Importamos el cliente de Supabase que creamos en el paso anterior.
import { supabaseClient } from '../services/supabaseClient.js'; 
// Importaremos los iconos en el siguiente paso. Por ahora los definimos aquí.
const LoaderIcon = () => <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>;

// --- TU COMPONENTE AUTH (Extraído directamente de tu código) ---
// No se ha cambiado la lógica, solo se ha movido a su propio archivo.
export const Auth = () => {
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
    
    // El resto de tu JSX para el formulario se mantiene exactamente igual.
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
