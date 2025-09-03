import React, { useState, useMemo } from 'react';
import { ConfirmationModal } from './Modals.jsx';
import { TrashIcon } from './Icons.jsx';

// --- TU COMPONENTE DASHBOARDSECTION (y sus sub-componentes, extraídos de tu código) ---
export const DashboardSection = ({ jobProfiles, progress, onNavigate, activityLog, setProfileToEdit, onResetLog, studyData }) => {
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    const StatCard = ({ title, value, change, isPositive }) => (
        <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold my-1">{value}</p>
            {change &&
                <div className={`text-xs flex items-center ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        {isPositive ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>}
                    </svg>
                    <span>{change}</span>
                </div>
            }
        </div>
    );

    const UsageRateChart = ({ activityLog }) => {
        const [year, setYear] = useState(new Date().getFullYear());

        const { weeks, monthLabels } = useMemo(() => {
            const activityByDate = activityLog.reduce((acc, logEntry) => {
                if (logEntry.created_at) {
                    const date = new Date(logEntry.created_at).toISOString().slice(0, 10);
                    acc[date] = (acc[date] || 0) + 1;
                }
                return acc;
            }, {});

            const startDate = new Date(year, 0, 1);
            const endDate = new Date(year, 11, 31);
            const days = [];
            
            let firstDayOfWeek = startDate.getDay();
            const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; 
            for (let i = 0; i < offset; i++) {
                days.push({ type: 'EMPTY' });
            }

            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().slice(0, 10);
                days.push({
                    type: 'DAY',
                    date: dateStr,
                    count: activityByDate[dateStr] || 0,
                    month: d.getMonth()
                });
            }

            const weeksData = [];
            for (let i = 0; i < days.length; i += 7) {
                weeksData.push(days.slice(i, i + 7));
            }
            
            const monthLabelsData = [];
            let lastMonth = -1;
            weeksData.forEach((week, weekIndex) => {
                const firstDayOfMonth = week.find(day => day.type === 'DAY' && day.month !== lastMonth);
                if (firstDayOfMonth) {
                    lastMonth = firstDayOfMonth.month;
                    monthLabelsData.push({
                        name: new Date(year, lastMonth, 1).toLocaleString('es-ES', { month: 'short' }),
                        weekIndex: weekIndex
                    });
                }
            });
            
            return { weeks: weeksData, monthLabels: monthLabelsData };
        }, [year, activityLog]);

        const getColor = (count) => {
            if (typeof count === 'undefined') return 'bg-transparent';
            if (count === 0) return 'bg-gray-200';
            if (count < 3) return 'bg-blue-200';
            if (count < 6) return 'bg-blue-400';
            return 'bg-blue-600';
        };
        
        const dayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

        return (
            <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold">Tasa de Uso</h3>
                    <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="form-input py-1 px-2 text-sm">
                         <option>2025</option>
                         <option>2024</option>
                         <option>2023</option>
                    </select>
                </div>
                <div className="flex gap-3">
                    <div className="grid grid-rows-7 gap-1 text-xs text-gray-400 pt-5">
                        {dayLabels.map((label, i) => (
                            <div key={label} className={`h-3 flex items-center ${i % 2 !== 0 ? 'invisible' : ''}`}>{label}</div>
                        ))}
                    </div>
                    <div className="overflow-x-auto w-full">
                        <div className="relative h-full">
                            <div className="flex" style={{width: `${weeks.length * 16}px`}}>
                                {monthLabels.map(({ name, weekIndex }) => (
                                    <div key={name} className="text-xs text-gray-500 absolute" style={{ left: `${weekIndex * 16}px` }}>
                                        {name.charAt(0).toUpperCase() + name.slice(1)}
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-flow-col gap-1 pt-5">
                                {weeks.map((week, weekIndex) => (
                                    <div key={weekIndex} className="grid grid-rows-7 gap-1">
                                        {week.map((day, dayIndex) => (
                                            <div
                                                key={day.date || `empty-${weekIndex}-${dayIndex}`}
                                                className={`w-3 h-3 rounded-sm ${getColor(day.count)}`}
                                                title={day.date ? `${day.date}: ${day.count} actividad(es)` : ''}
                                            ></div>
                                        ))}
                                        {Array.from({ length: 7 - week.length }).map((_, i) => (
                                            <div key={`pad-${weekIndex}-${i}`} className="w-3 h-3"></div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    
     const NuevasAltas = ({ profiles, onNavigate, setProfileToEdit }) => {
        const handleRowClick = (profile) => {
            setProfileToEdit(profile);
            onNavigate('empleados');
        };
        
        return (
            <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Nuevas Altas</h3>
                    <button onClick={() => onNavigate('empleados')} className="text-sm text-blue-600 hover:underline">Ver todas</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full w-full text-sm text-left">
                        <thead>
                            <tr className="border-b-2 border-gray-100">
                                <th className="px-4 py-3 font-semibold text-gray-600">ID</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Nombre</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Puesto</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Departamento</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Condición</th>
                            </tr>
                        </thead>
                        <tbody>
                            {profiles.slice(0, 5).map((p) => (
                                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => handleRowClick(p)}>
                                    <td className="px-4 py-3 text-blue-600 font-medium">{p.id}</td>
                                    <td className="px-4 py-3 font-bold text-gray-800">{p.nombre_apellidos}</td>
                                    <td className="px-4 py-3 text-gray-600">{p.nombre_puesto}</td>
                                    <td className="px-4 py-3 text-gray-600">{p.departamento}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${p.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {p.approved ? 'Aprobado' : 'Pendiente'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {profiles.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No hay nuevas altas registradas.</p>}
                </div>
            </div>
        );
     };
    
    const ActivityLog = ({ log, onReset }) => {
        const timeAgo = (date) => {
            if (!date) return '';
            const seconds = Math.floor((new Date() - new Date(date)) / 1000);
            let interval = seconds / 31536000;
            if (interval > 1) return `hace ${Math.floor(interval)} años`;
            interval = seconds / 2592000;
            if (interval > 1) return `hace ${Math.floor(interval)} meses`;
            interval = seconds / 86400;
            if (interval > 1) return `hace ${Math.floor(interval)} días`;
            interval = seconds / 3600;
            if (interval > 1) return `hace ${Math.floor(interval)} horas`;
            interval = seconds / 60;
            if (interval > 1) return `hace ${Math.floor(interval)} minutos`;
            return `hace unos segundos`;
        };

        return (
             <div className="bg-white p-4 rounded-lg shadow h-full">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold">Registro de Actividad</h3>
                    <button onClick={onReset} className="p-1 hover:bg-gray-200 rounded-full" title="Borrar registro">
                        <TrashIcon />
                    </button>
                </div>
                <ul className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {log.map((item) => (
                        <li key={item.id} className="flex items-start">
                            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center mr-3 mt-1">
                                <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium">{item.action}</p>
                                <p className="text-xs text-gray-500">
                                    {item.user_id ? `ID Usuario: ${item.user_id.substring(0,8)}...` : 'Sistema'}
                                    <span className="mx-1">·</span>
                                    {timeAgo(item.created_at)}
                                </p>
                            </div>
                        </li>
                    ))}
                     {log.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No hay actividad registrada.</p>}
                </ul>
            </div>
        );
    };

    return (
        <>
            {showResetConfirm && (
                <ConfirmationModal 
                    message="¿Estás seguro de que quieres borrar todo el registro de actividad? Esta acción es irreversible."
                    onConfirm={() => { onResetLog(); setShowResetConfirm(false); }}
                    onCancel={() => setShowResetConfirm(false)}
                />
            )}
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Total Empleados" value={jobProfiles.length} />
                    <StatCard title="Progreso General" value={`${Math.round(progress)}%`} />
                    <StatCard title="Fichas Aprobadas" value={jobProfiles.filter(p => p.approved).length} />
                    <StatCard title="Fases del Estudio" value={studyData.filter(p => p.id.startsWith('phase')).length} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                         <UsageRateChart activityLog={activityLog} />
                         <NuevasAltas profiles={jobProfiles} onNavigate={onNavigate} setProfileToEdit={setProfileToEdit} />
                    </div>
                    <div className="lg:col-span-1">
                        <ActivityLog log={activityLog} onReset={() => setShowResetConfirm(true)} />
                    </div>
                </div>
            </div>
        </>
    );
};
