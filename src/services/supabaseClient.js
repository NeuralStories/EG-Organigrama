// #################################################################
// ##              CLIENTE DE CONEXIÓN A SUPABASE                 ##
// ##                                                             ##
// ## Este archivo establece la conexión con tu proyecto Supabase ##
// ## y exporta el cliente para que sea usado en toda la app.     ##
// #################################################################

import { createClient } from '@supabase/supabase-js';

// --- Credenciales de tu proyecto Supabase ---
const supabaseUrl = 'https://fkrawpxgkuciofjvtttr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrcmF3cHhna3VjaW9manZ0dHRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MDA1NDEsImV4cCI6MjA3MjM3NjU0MX0.T0VUiIBJ04iDq8Vk7bMzAdFHUVyCBFkgppmw2DwTGY8';

// Creamos una única instancia del cliente de Supabase.
export const supabase = createClient(supabaseUrl, supabaseKey);
