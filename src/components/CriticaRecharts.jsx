// components/CriticaRecharts.jsx
export const CriticaRecharts = () => {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
      <h3 className="font-semibold text-yellow-800 mb-2">🤔 Reflexión sobre Recharts</h3>
      <div className="text-yellow-700 text-sm space-y-2">
        <p><strong>✅ Ventajas encontradas:</strong></p>
        <ul className="list-disc list-inside ml-4">
          <li>Configuración extremadamente sencilla para gráficas básicas</li>
          <li>Documentación clara con muchos ejemplos prácticos</li>
          <li>Responsive por defecto con ResponsiveContainer</li>
          <li>Buena personalización de colores y estilos</li>
        </ul>
        
        <p><strong>⚠️ Limitaciones/Dificultades:</strong></p>
        <ul className="list-disc list-inside ml-4">
          <li>Curva de aprendizaje para personalizaciones avanzadas</li>
          <li>Tooltips personalizados requieren más código</li>
          <li>Menos opciones de animación que otras librerías</li>
          <li>Documentación de props anidadas puede ser confusa</li>
        </ul>
        
        <p><strong>💡 Recomendación:</strong> Ideal para proyectos que necesitan gráficas 
        profesionales rápidamente, pero para visualizaciones muy complejas podría 
        considerarse D3.js directamente.</p>
      </div>
    </div>
  );
};