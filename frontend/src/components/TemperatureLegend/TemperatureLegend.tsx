import "./TemperatureLegend.css"

const TemperatureLegend = () => {
  return (
    <div className="legend-card">
      <h3 className="legend-title">Temperatur-Legende</h3>
      
      <div className="legend-list">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: 'var(--temp-cold)' }}></span>
          <span className="legend-text">Unter 20°C (Kalt)</span>
        </div>
        
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: 'var(--temp-normal)' }}></span>
          <span className="legend-text">20°C - 30°C (Optimal)</span>
        </div>
        
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: 'var(--temp-hot)' }}></span>
          <span className="legend-text">Über 30°C (Heiß)</span>
        </div>
      </div>
    </div>
  );
};

export default TemperatureLegend;