import { useSensorData } from '../../context/SensorContext';
import './TemperatureLegend.css';

const TemperatureLegend = () => {
  const { convertTemp, tempUnit } = useSensorData();

  return (
    <div className="legend-card">
      <h3 className="legend-title">Temperatur-Bereiche</h3>
      <div className="legend-items">
        
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#3B82F6' }}></div>
          <div className="legend-info">
            <span className="legend-label">Kalt: </span>
            <span className="legend-range">&lt; {convertTemp(18)}°{tempUnit}</span>
          </div>
        </div>

        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#10B981' }}></div>
          <div className="legend-info">
            <span className="legend-label">Ideal: </span>
            <span className="legend-range">{convertTemp(18)}°{tempUnit} - {convertTemp(24)}°{tempUnit}</span>
          </div>
        </div>

        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#F59E0B' }}></div>
          <div className="legend-info">
            <span className="legend-label">Warm: </span>
            <span className="legend-range">{convertTemp(24)}°{tempUnit} - {convertTemp(30)}°{tempUnit}</span>
          </div>
        </div>

        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#EF4444' }}></div>
          <div className="legend-info">
            <span className="legend-label">Heiß: </span>
            <span className="legend-range">&gt; {convertTemp(30)}°{tempUnit}</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TemperatureLegend;