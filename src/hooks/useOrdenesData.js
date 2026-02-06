// hooks/useOrdenesData.js
import { useState, useEffect } from 'react';

export const useOrdenesData = () => {
  const [datosReales, setDatosReales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Datos simulados basados en el dominio del proyecto (Bodega/Órdenes)
  const datosSimulados = {
    mensual: [
      { mes: 'Ene', ordenes: 45, ingresos: 12500, productos: 89 },
      { mes: 'Feb', ordenes: 52, ingresos: 14200, productos: 104 },
      { mes: 'Mar', ordenes: 48, ingresos: 13800, productos: 95 },
      { mes: 'Abr', ordenes: 67, ingresos: 18900, productos: 132 },
      { mes: 'May', ordenes: 73, ingresos: 21500, productos: 148 },
      { mes: 'Jun', ordenes: 61, ingresos: 17200, productos: 121 }
    ],
    estados: [
      { estado: 'Completadas', cantidad: 156, color: '#00C49F' },
      { estado: 'Pendientes', cantidad: 34, color: '#FFBB28' },
      { estado: 'En Proceso', cantidad: 23, color: '#0088FE' },
      { estado: 'Canceladas', cantidad: 12, color: '#FF8042' }
    ],
    tendencia: [
      { semana: 'Sem 1', ordenes: 15, promedio: 12 },
      { semana: 'Sem 2', ordenes: 18, promedio: 14 },
      { semana: 'Sem 3', ordenes: 22, promedio: 16 },
      { semana: 'Sem 4', ordenes: 25, promedio: 18 },
      { semana: 'Sem 5', ordenes: 28, promedio: 20 }
    ]
  };

  // Simular fetch de datos reales
  useEffect(() => {
    const fetchDatosReales = async () => {
      try {
        setCargando(true);
        // Aquí iría la llamada real a tu API ms2-orders
        // const response = await fetch('http://localhost:8000/orders/estadisticas');
        // const data = await response.json();
        
        // Por ahora usamos datos simulados
        setTimeout(() => {
          setDatosReales(datosSimulados);
          setCargando(false);
        }, 1000);
      } catch (err) {
        setError(err.message);
        setCargando(false);
      }
    };

    fetchDatosReales();
  }, []);

  return { datos: datosReales, cargando, error };
};