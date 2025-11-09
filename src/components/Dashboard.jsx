import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

// Datos de ejemplo para las gráficas
const datosEjemplo = {
  mensual: [
    { mes: 'Ene', ordenes: 45, ingresos: 12500 },
    { mes: 'Feb', ordenes: 52, ingresos: 14200 },
    { mes: 'Mar', ordenes: 48, ingresos: 13800 },
    { mes: 'Abr', ordenes: 67, ingresos: 18900 },
    { mes: 'May', ordenes: 73, ingresos: 21500 },
    { mes: 'Jun', ordenes: 61, ingresos: 17200 }
  ],
  estados: [
    { estado: 'Completadas', cantidad: 156, color: '#00C49F' },
    { estado: 'Pendientes', cantidad: 34, color: '#FFBB28' },
    { estado: 'En Proceso', cantidad: 23, color: '#0088FE' },
    { estado: 'Canceladas', cantidad: 12, color: '#FF8042' }
  ],
  tendencia: [
    { semana: 'Sem 1', ordenes: 15 },
    { semana: 'Sem 2', ordenes: 18 },
    { semana: 'Sem 3', ordenes: 22 },
    { semana: 'Sem 4', ordenes: 25 }
  ]
};

export default function Dashboard() {
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
        📊 Dashboard de Reportes - Bodega
      </h1>

      {/* Primera fila: Gráficas lado a lado */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        
        {/* Gráfica de Barras - Órdenes Mensuales */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px', color: '#555' }}>Órdenes Mensuales</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={datosEjemplo.mensual}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="ordenes" fill="#8884d8" name="Total Órdenes" />
              <Bar dataKey="ingresos" fill="#82ca9d" name="Ingresos ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfica Circular - Estados */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px', color: '#555' }}>Estado de Órdenes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={datosEjemplo.estados}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ estado, cantidad }) => `${estado}: ${cantidad}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="cantidad"
              >
                {datosEjemplo.estados.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Segunda fila: Gráfica de líneas ancha */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginBottom: '15px', color: '#555' }}>Tendencia Semanal</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={datosEjemplo.tendencia}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="semana" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="ordenes" stroke="#8884d8" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Información adicional */}
      <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
          💡 <strong>Nota:</strong> Estos son datos de ejemplo. Para ver datos reales, 
          conecta este dashboard con tu API de ms2-orders.
        </p>
      </div>
    </div>
  );
}