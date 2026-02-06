// components/graficas/GraficaOrdenesMensuales.jsx
import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LabelList
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
        <p className="font-semibold">{`Mes: ${label}`}</p>
        <p className="text-blue-600">{`Órdenes: ${payload[0].value}`}</p>
        <p className="text-green-600">{`Ingresos: $${payload[1].value?.toLocaleString()}`}</p>
        <p className="text-purple-600">{`Productos: ${payload[2].value}`}</p>
      </div>
    );
  }
  return null;
};

export const GraficaOrdenesMensuales = ({ datos }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 text-gray-800">
        📈 Desempeño Mensual de Órdenes
      </h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={datos.mensual} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="mes" 
            tick={{ fill: '#374151' }}
            axisLine={{ stroke: '#d1d5db' }}
          />
          <YAxis 
            tick={{ fill: '#374151' }}
            axisLine={{ stroke: '#d1d5db' }}
            label={{ 
              value: 'Cantidad', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle', fill: '#374151' }
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="top" 
            height={36}
            wrapperStyle={{ color: '#374151' }}
          />
          <Bar 
            dataKey="ordenes" 
            name="Total Órdenes"
            fill="#3b82f6" 
            radius={[4, 4, 0, 0]}
          >
            <LabelList dataKey="ordenes" position="top" fill="#374151" />
          </Bar>
          <Bar 
            dataKey="ingresos" 
            name="Ingresos ($)"
            fill="#10b981" 
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="productos" 
            name="Productos"
            fill="#8b5cf6" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};