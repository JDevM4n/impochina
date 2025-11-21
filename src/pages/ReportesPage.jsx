import React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useNavigate } from "react-router-dom";
import "../styles/Reportes.css";

const Reportes = () => {
  // Navegación
  const navigate = useNavigate();
  const goToHome = () => navigate("/home");

  // Datos quemados (simulados)
  const productosMasSolicitados = [
    { nombre: "Zapatillas Nike", pedidos: 120 },
    { nombre: "Suéter Oversize", pedidos: 98 },
    { nombre: "Lentes retro", pedidos: 75 },
    { nombre: "Bolso kawaii", pedidos: 60 },
  ];

  const pedidosPorMes = [
    { mes: "Ene", pedidos: 45 },
    { mes: "Feb", pedidos: 52 },
    { mes: "Mar", pedidos: 61 },
    { mes: "Abr", pedidos: 70 },
    { mes: "May", pedidos: 95 },
    { mes: "Jun", pedidos: 110 },
  ];

  return (
    <div className="reportes-container">
      {/* HEADER */}
      <header className="reportes-header">
        <div className="brand">
          <span className="logo-dot"></span> Reportes del Sistema
        </div>

        <div className="header-actions">
          <button className="link" onClick={goToHome}>Inicio</button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="reportes-main">
        {/* PANEL 1 */}
        <section className="panel">
          <h2 className="panel-title">Productos más Solicitados</h2>
          <p className="panel-sub">
            Basado en los artículos que más copian desde Taobao.
          </p>

          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={productosMasSolicitados}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombre" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="pedidos" fill="#667eea" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* PANEL 2 */}
        <section className="panel">
          <h2 className="panel-title">Pedidos por Mes</h2>
          <p className="panel-sub">
            Cantidad de artículos añadidos al carrito por los usuarios.
          </p>

          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={pedidosPorMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="pedidos"
                  stroke="#63b3ed"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* PANEL 3 - EXPLICACIÓN */}
        <section className="panel">
          <h2 className="panel-title">Explicación Técnica</h2>
          <p className="panel-sub">Cómo se integraron las gráficas en la aplicación.</p>

          <ul className="explain-list">
            <li>
              Se importaron componentes de Recharts como <strong>BarChart</strong>,{" "}
              <strong>LineChart</strong> y <strong>Tooltip</strong>.
            </li>
            <li>
              Las gráficas usan datos simulados relevantes al sistema: productos
              copiados y pedidos por mes.
            </li>
            <li>Cada gráfica es <strong>Responsive</strong> y se adapta al tamaño del panel.</li>
            <li>
              Se personalizaron colores, bordes y estilo de barras/líneas.
            </li>
            <li>
              El Tooltip permite interacción mostrando datos precisos al pasar el cursor.
            </li>
          </ul>
        </section>

        {/* PANEL 4 - REFLEXIÓN */}
        <section className="panel">
          <h2 className="panel-title">Crítica / Reflexión</h2>
          <p className="panel-sub">
            Consideraciones sobre el uso de Recharts.
          </p>

          <p className="reflection">
            Recharts fue sencillo de implementar por su estructura basada en
            componentes. Sin embargo, tiene limitaciones: no permite animaciones
            avanzadas y algunos estilos requieren ajustes manuales.  
            Aun así, sigue siendo una opción ideal para dashboards simples como este.
          </p>
        </section>
      </main>
    </div>
  );
};

export default Reportes;
