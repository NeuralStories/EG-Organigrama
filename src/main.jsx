import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.jsx';

// 1. Encuentra el elemento del DOM donde se montará la aplicación.
const rootElement = document.getElementById('root');

// 2. Crea el "root" de React para la aplicación.
const root = ReactDOM.createRoot(rootElement);

// 3. Renderiza el componente principal <App /> dentro de ese elemento.
//    StrictMode es una herramienta de React para destacar problemas potenciales.
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
