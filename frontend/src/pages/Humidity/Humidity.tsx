import HumidityDrop from '../../components/HumidityDrop/HumidityDrop';
import { useSensorData } from '../../context/SensorContext';
import '../Pages.css';
import '.././Dashboard/Dashboard.css';


const Humidity = () => {
  const { humidity, loading } = useSensorData();

  if (loading) return <div className="main-content">Lade Luftfeuchtigkeit...</div>;

  return (
    <div className="dashboard-container">
      <h2 className="page-title">Luftfeuchtigkeit</h2>
      
      <div className="dashboard-content">
        <div className="tacho-card">
          <div className="live-badge">
            <span className="live-dot"></span>
            LIVE
          </div>
        
          <HumidityDrop value={humidity} />
        </div>
      </div>
    </div>
  );
};

export default Humidity;