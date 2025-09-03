
// #################################################################
// ##              CLIENTE DE CONEXIÓN A SUPABASE                 ##
// ##                                                             ##
// ## Este archivo establece la conexión con tu proyecto Supabase ##
// ## y exporta el cliente para que sea usado en toda la app.     ##
// #################################################################

// Importamos la función 'createClient' desde la librería de Supabase.
// Para que esto funcione, necesitaremos instalarla. Te indicaré cómo.
import { createClient } from '@supabase/supabase-js';

// --- ¡IMPORTANTE! ---
// Estas son las variables que debes reemplazar con tus propias
// credenciales de Supabase. Las encuentras en el panel de tu
// proyecto: "Project Settings" > "API".

const supabaseUrl = 'YOUR_SUPABASE_URL';             // <-- Pega aquí tu URL
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';      // <-- Pega aquí tu clave anónima (public)

// Creamos una única instancia del cliente de Supabase.
// Esta instancia será "el puente" a nuestra base de datos.
export const supabase = createClient(supabaseUrl, supabaseKey);

// "export" permite que otros archivos puedan importar y usar
// esta constante "supabase" para hacer consultas a la base de datos.
