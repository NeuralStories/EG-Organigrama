// Importamos la función para crear el cliente desde la librería de Supabase.
import { createClient } from '@supabase/supabase-js';

// --- TUS CREDENCIALES (Extraídas directamente de tu código) ---
const supabaseUrl = 'https://mtncylafoftawkuruinu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10bmN5bGFmb2Z0YXdrdXJ1aW51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5Nzc5MzAsImV4cCI6MjA2NzU1MzkzMH0.K3w1EiuhSXGbbEtY0muyDEUXvlxGkmnb9fCrv3eSuOU';

// Creamos y exportamos la instancia del cliente de Supabase.
// "export" permite que otros archivos puedan importarlo y usarlo.
export const supabaseClient = createClient(supabaseUrl, SUPABASE_ANON_KEY);
