
// #####################################################################
// ##               COMPONENTE DEL ORGANIGRAMA DINÁMICO               ##
// ##                                                                 ##
// ## Este módulo reemplaza a 'app.js'. Su responsabilidad es:        ##
// ## 1. Cargar datos desde Supabase usando OrganizationService.      ##
// ## 2. Transformar los datos a una estructura de árbol.             ##
// ## 3. Renderizar el organigrama con D3.js.                         ##
// #####################################################################

import { OrganizationService } from '../services/organizationService.js';

export class OrgChart {
  constructor(containerSelector) {
    // --- 1. CONFIGURACIÓN INICIAL (adaptado de app.js) ---
    this.container = document.querySelector(containerSelector);
    if (!this.container) {
      console.error(`Contenedor "${containerSelector}" no encontrado.`);
      return;
    }
    this.margin = { top: 20, right: 120, bottom: 20, left: 200 };
    this.width = 2500 - this.margin.right - this.margin.left;
    this.height = 1200 - this.margin.top - this.margin.bottom;
    this.i = 0;
    this.duration = 750;

    this.tree = d3.tree().size([this.height, this.width]);
    this.svg = d3.select(containerSelector).append("svg")
      .attr("width", this.width + this.margin.right + this.margin.left)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
  }

  /**
   * Carga los datos, los transforma y comienza el renderizado.
   */
  async init() {
    try {
      const employees = await OrganizationService.getOrganizationData();
      const treeData = this.buildHierarchy(employees);
      
      if (!treeData) {
        console.error("No se pudo construir la jerarquía. ¿Hay un empleado raíz (sin manager_id)?");
        return;
      }

      this.root = d3.hierarchy(treeData, d => d.children);
      this.root.x0 = this.height / 2;
      this.root.y0 = 0;

      this.update(this.root);

    } catch (error) {
      console.error("Fallo al inicializar el organigrama:", error);
      this.container.innerHTML = `<p style="color: red;">Error al cargar los datos del organigrama.</p>`;
    }
  }

  /**
   * ¡NUEVO! Transforma la lista plana de empleados en un árbol jerárquico.
   * @param {Array} employees - La lista de empleados de Supabase.
   * @returns {Object} El nodo raíz del árbol.
   */
  buildHierarchy(employees) {
    const map = {};
    let root;

    employees.forEach(emp => {
      map[emp.id] = { ...emp, children: [] };
    });

    employees.forEach(emp => {
      if (emp.manager_id) {
        if (map[emp.manager_id]) {
          map[emp.manager_id].children.push(map[emp.id]);
        }
      } else {
        root = map[emp.id]; // Este es el nodo raíz
      }
    });
    return root;
