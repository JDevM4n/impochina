import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell
} from 'recharts';
import { useAuth } from "../hooks/useAuth";
import "../styles/Reportes.css";

export default function Reportes() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState("bar");
  const [timeRange, setTimeRange] = useState("month");
  const { user } = useAuth();

  // Datos de ejemplo para las gráficas
  const chartData = [
    { name: 'Lun', busquedas: 12, exitosas: 10, productos: 8 },
    { name: 'Mar', busquedas: 19, exitosas: 15, productos: 12 },
    { name: 'Mié', busquedas: 8, exitosas: 7, productos: 6 },
    { name: 'Jue', busquedas: 15, exitosas: 14, productos: 11 },
    { name: 'Vie', busquedas: 22, exitosas: 20, productos: 18 },
    { name: 'Sáb', busquedas: 18, exitosas: 16, productos: 14 },
    { name: 'Dom', busquedas: 14, exitosas: 12, productos: 10 }
  ];

  const categoryData = [
    { name: 'Electrónicos', value: 35, color: '#8884d8' },
    { name: 'Ropa', value: 25, color: '#82ca9d' },
    { name: 'Hogar', value: 20, color: '#ffc658' },
    { name: 'Deportes', value: 15, color: '#ff8042' },
    { name: 'Otros', value: 5, color: '#0088fe' }
  ];

  const monthlyData = [
    { mes: 'Ene', ingresos: 4000, gastos: 2400, profit: 1600 },
    { mes: 'Feb', ingresos: 3000, gastos: 1398, profit: 1602 },
    { mes: 'Mar', ingresos: 2000, gastos: 9800, profit: -7800 },
    { mes: 'Abr', ingresos: 2780, gastos: 3908, profit: -1128 },
    { mes: 'May', ingresos: 1890, gastos: 4800, profit: -2910 },
    { mes: 'Jun', ingresos: 2390, gastos: 3800, profit: -1410 }
  ];

  useEffect(() => {
    const loadReportData = async () => {
      try {
        setTimeout(() => {
          setReportData({
            totalSearches: 156,
            successfulSearches: 142,
            savedProducts: 89,
            favoriteProducts: 34,
            conversionRate: 91,
            estimatedSavings: "$5,200 USD",
            activeCategories: 8,
            avgPrice: "$85 USD"
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error loading report data:", error);
        setLoading(false);
      }
    };

    loadReportData();
  }, []);

  // Custom Tooltip para gráficas
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{`${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="reportes-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando reportes interactivos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reportes-page">
      {/* Navbar */}
      <motion.header
        className="navbar"
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="brand">
          <span className="logo-dot" /> Impochina - Reportes Avanzados
        </div>
        <nav className="nav-actions">
          <Link to="/" className="nav-link">
            ← Volver al Home
          </Link>
          <Link to="/bodega" className="nav-link">
            Bodega
          </Link>
        </nav>
      </motion.header>

      {/* Contenido Principal */}
      <motion.div
        className="reportes-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="reportes-header">
          <h1>📊 Reportes y Analytics Avanzados</h1>
          <p>Visualizaciones interactivas de tu actividad en Impochina</p>
          
          {/* Filtros de Tiempo */}
          <div className="filters">
            <button 
              className={timeRange === "week" ? "filter-active" : "filter-btn"}
              onClick={() => setTimeRange("week")}
            >
              Semana
            </button>
            <button 
              className={timeRange === "month" ? "filter-active" : "filter-btn"}
              onClick={() => setTimeRange("month")}
            >
              Mes
            </button>
            <button 
              className={timeRange === "year" ? "filter-active" : "filter-btn"}
              onClick={() => setTimeRange("year")}
            >
              Año
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="kpi-grid">
          {[
            { title: "Total Búsquedas", value: reportData.totalSearches, icon: "🔍", color: "#4f46e5" },
            { title: "Éxito", value: `${reportData.conversionRate}%`, icon: "✅", color: "#10b981" },
            { title: "Productos Guardados", value: reportData.savedProducts, icon: "📦", color: "#f59e0b" },
            { title: "Ahorro Estimado", value: reportData.estimatedSavings, icon: "💰", color: "#ef4444" }
          ].map((kpi, index) => (
            <motion.div
              key={index}
              className="kpi-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="kpi-icon" style={{ backgroundColor: kpi.color }}>
                {kpi.icon}
              </div>
              <div className="kpi-content">
                <h3>{kpi.value}</h3>
                <p>{kpi.title}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Sección de Gráficas Interactivas */}
        <div className="charts-section">
          <div className="charts-header">
            <h2>📈 Visualizaciones Interactivas</h2>
            <div className="chart-controls">
              <button 
                className={activeChart === "bar" ? "chart-btn-active" : "chart-btn"}
                onClick={() => setActiveChart("bar")}
              >
                Barras
              </button>
              <button 
                className={activeChart === "line" ? "chart-btn-active" : "chart-btn"}
                onClick={() => setActiveChart("line")}
              >
                Líneas
              </button>
              <button 
                className={activeChart === "area" ? "chart-btn-active" : "chart-btn"}
                onClick={() => setActiveChart("area")}
              >
                Área
              </button>
            </div>
          </div>

          {/* Gráfica Principal Interactiva */}
          <div className="main-chart">
            <ResponsiveContainer width="100%" height={400}>
              {activeChart === "bar" ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#6b7280"
                    tick={{ fill: '#6b7280' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    tick={{ fill: '#6b7280' }}
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                    cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="busquedas" 
                    name="Total Búsquedas" 
                    fill="#8884d8" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="exitosas" 
                    name="Búsquedas Exitosas" 
                    fill="#82ca9d" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="productos" 
                    name="Productos Guardados" 
                    fill="#ffc658" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              ) : activeChart === "line" ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#6b7280"
                    tick={{ fill: '#6b7280' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    tick={{ fill: '#6b7280' }}
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                    cursor={{ stroke: '#6b7280', strokeWidth: 1 }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="busquedas" 
                    name="Total Búsquedas"
                    stroke="#8884d8" 
                    strokeWidth={3}
                    dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#8884d8' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="exitosas" 
                    name="Búsquedas Exitosas"
                    stroke="#82ca9d" 
                    strokeWidth={3}
                    dot={{ fill: '#82ca9d', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#82ca9d' }}
                  />
                </LineChart>
              ) : (
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#6b7280"
                    tick={{ fill: '#6b7280' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    tick={{ fill: '#6b7280' }}
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                    cursor={{ stroke: '#6b7280', strokeWidth: 1 }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="busquedas" 
                    name="Total Búsquedas"
                    stroke="#8884d8" 
                    fill="#8884d8"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="exitosas" 
                    name="Búsquedas Exitosas"
                    stroke="#82ca9d" 
                    fill="#82ca9d"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Gráficas Secundarias */}
          <div className="secondary-charts">
            {/* Gráfica de Pie Interactiva */}
            <div className="chart-container">
              <h3>📊 Distribución por Categorías</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Porcentaje']}
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfica de Línea para Tendencias */}
            <div className="chart-container">
              <h3>📈 Tendencias Mensuales</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="mes" 
                    stroke="#6b7280"
                    tick={{ fill: '#6b7280' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    tick={{ fill: '#6b7280' }}
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                    cursor={{ stroke: '#6b7280', strokeWidth: 1 }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="ingresos" 
                    name="Ingresos (USD)"
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="gastos" 
                    name="Gastos (USD)"
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={{ fill: '#ef4444', r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    name="Profit (USD)"
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Resumen de Actividad */}
        <motion.div 
          className="activity-summary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h3>📋 Resumen de Actividad Reciente</h3>
          <div className="activity-stats">
            <div className="stat-item">
              <span>🚀 Búsquedas este mes:</span>
              <strong>42</strong>
            </div>
            <div className="stat-item">
              <span>⭐ Productos favoritos:</span>
              <strong>18</strong>
            </div>
            <div className="stat-item">
              <span>📈 Tasa de crecimiento:</span>
              <strong className="positive">+15%</strong>
            </div>
            <div className="stat-item">
              <span>🎯 Eficiencia de búsqueda:</span>
              <strong>94%</strong>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}