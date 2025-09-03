
// #####################################################################
// ##                SERVICIO DE DATOS DE LA ORGANIZACIÓN             ##
// ##                                                                 ##
// ## Este archivo centraliza todas las consultas a la base de datos  ##
// ## relacionadas con la estructura de la organización.              ##
// #####################################################################

// 1. Importamos nuestro cliente 'supabase' que ya tiene la conexión.
import { supabase } from './supabaseClient.js';

// Usamos una clase para agrupar todas las funciones relacionadas.
// Es una buena práctica para mantener el código ordenado.
export class OrganizationService {

  /**
   * Obtiene todos los datos necesarios para construir el organigrama.
   * Realiza una única consulta a Supabase pidiendo los empleados y,
   * para cada uno, la información relacionada de su cargo (position)
   * y su departamento (department).
   * @returns {Promise<Array>} Una promesa que resuelve a un array con los datos de los empleados.
   */
  static async getOrganizationData() {
    
    // 2. Usamos el cliente de Supabase para construir la consulta.
    const { data, error } = await supabase
      .from('employees') // Desde la tabla 'employees'...
      .select(`
        id,
        full_name,
        manager_id,
        position:positions (
          title,
          description,
          responsibilities,
          functions,
          hierarchy_level,
          department:departments (
            name
          )
        )
      `); // ...selecciona estos campos y la info anidada de 'positions' y 'departments'.

    // 3. Manejo de errores básico.
    if (error) {
      console.error('Error fetching organization data:', error);
      throw error; // Lanza el error para que la parte que llamó a esta función sepa que algo falló.
    }

    // 4. Si todo salió bien, devuelve los datos.
    return data;
  }

  // --- Futuras funciones ---
  // En el futuro, podríamos añadir más funciones aquí, como:
  // static async addEmployee(employeeData) { /* ... */ }
  // static async getEmployeeById(id) { /* ... */ }
  // etc.
}
