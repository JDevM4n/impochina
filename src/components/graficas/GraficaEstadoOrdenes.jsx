// components/graficas/GraficaEstadoOrdenes.jsx
import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
        <p className="font-semibold" style={{ color: data.color }}>
          {data.estado}
        </p>
        <p>{`Cantidad: ${data.cantidad}`}</p>
        <p>{`Porcentaje: ${((data.cantidad / 225) * 100).toFixed(1)}%`}</p>
      </div>
    );
  }
  return null;
};

export const GraficaEstadoOrdenes = ({ datos }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 text-gray-800">
        🎯 Estado Actual de Órdenes
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={datos.estados}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={activeIndex !== null ? 90 : 80}
            paddingAngle={2}
            dataKey="cantidad"
            nameKey="estado"
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
            label={({ estado, porcentaje }) => 
              `${estado} (${((porcentaje) * 100).toFixed(0)}%)`
            }
            labelLine={false}
          >
            {datos.estados.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                stroke="#ffffff"
                strokeWidth={2}
                opacity={activeIndex === index ? 1 : 0.8}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomPieTooltip />} />
          <Legend 
            layout="vertical"
            verticalAlign="middle"
            align="right"
            wrapperStyle={{ paddingLeft: '20px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};