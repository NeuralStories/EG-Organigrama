import React, { useState, useEffect, useRef } from 'react';
import { supabaseClient } from '../services/supabaseClient.js';
import { UserIcon, SettingsIcon, DownloadIcon } from './Icons.jsx';

// --- TU COMPONENTE PROFILEDROPDOWN ---
export const ProfileDropdown = ({ user, loginTime, showNotification, onSettingsClick, onExportAll }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showContactForm, setShowContactForm] = useState(false);
    const [contactSubject, setContactSubject] = useState('');
    const [contactMessage, setContactMessage] = useState('');
    const [elapsedTime, setElapsedTime] = useState('00:00:00');
    const dropdownRef = useRef(null);

    useEffect(() => {
        const timer = setInterval(() => {
            const seconds = Math.floor((Date.now() - loginTime) / 1000);
            const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
            const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
            const s = String(seconds % 60).padStart(2, '0');
            setElapsedTime(`${h}:${m}:${s}`);
        }, 1000);

        return () => clearInterval(timer);
    }, [loginTime]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setShowContactForm(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);
    
    const handleSendEmail = (e) => {
        e.preventDefault();
        const body = encodeURIComponent(contactMessage);
        const subject = encodeURIComponent(contactSubject);
        window.location.href = `mailto:hacchi.creativiza@gmail.com?subject=${subject}&body=${body}`;
        showNotification('Abriendo cliente de correo...', 'success');
        setIsOpen(false);
        setShowContactForm(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-full hover:bg-gray-200">
                <UserIcon />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg z-20 border">
                    <div className="p-4">
                        {showContactForm ? (
                            <div>
                                <h4 className="font-bold mb-2">Enviar Consulta</h4>
                                <form onSubmit={handleSendEmail}>
                                    <input type="text" placeholder="Asunto" className="form-input mb-2" value={contactSubject} onChange={e => setContactSubject(e.target.value)} required />
                                    <textarea placeholder="Tu mensaje..." className="form-textarea mb-2" style={{minHeight: '100px'}} value={contactMessage} onChange={e => setContactMessage(e.target.value)} required></textarea>
                                    <div className="flex justify-end gap-2">
                                        <button type="button" onClick={() => setShowContactForm(false)} className="btn-secondary text-sm">Cancelar</button>
                                        <button type="submit" className="btn-action text-sm">Enviar</button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <>
                                <div className="border-b pb-2 mb-2">
                                    <p className="font-semibold text-sm truncate">{user.email}</p>
                                    <p className="text-xs text-gray-500">Miembro</p>
                                </div>
                                <div className="text-xs text-gray-500 mb-3">
                                    <p>Tiempo de conexión: {elapsedTime}</p>
                                </div>
                                <button onClick={onSettingsClick} className="w-full text-left text-sm p-2 rounded hover:bg-gray-100 flex items-center gap-2"><SettingsIcon /> Configuración</button>
                                <button onClick={onExportAll} className="w-full text-left text-sm p-2 rounded hover:bg-gray-100 flex items-center gap-2"><DownloadIcon /> Exportar Todo a PDF</button>
                                <button onClick={() => setShowContactForm(true)} className="w-full text-left text-sm p-2 rounded hover:bg-gray-100">Enviar Consulta</button>
                                <button onClick={() => supabaseClient.auth.signOut()} className="w-full text-left text-sm p-2 rounded hover:bg-gray-100 text-red-600">Cerrar Sesión</button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
