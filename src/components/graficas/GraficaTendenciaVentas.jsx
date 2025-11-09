// components/graficas/GraficaTendenciaVentas.jsx
import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';

export const GraficaTendenciaVentas = ({ datos }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 text-gray-800">
        📊 Tendencia Semanal de Órdenes
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={datos.tendencia}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="semana" 
            tick={{ fill: '#374151' }}
            axisLine={{ stroke: '#d1d5db' }}
          />
          <YAxis 
            tick={{ fill: '#374151' }}
            axisLine={{ stroke: '#d1d5db' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '6px'
            }}
          />
          <Legend />
          <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="3 3" />
          <Line
            type="monotone"
            dataKey="ordenes"
            name="Órdenes Reales"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
            activeDot={{ r: 8, fill: '#1d4ed8' }}
          />
          <Line
            type="monotone"
            dataKey="promedio"
            name="Promedio Esperado"
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#10b981', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};