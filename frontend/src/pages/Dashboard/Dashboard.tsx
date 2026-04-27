import GaugeChart from '../../components/GaugeChart/GaugeChart';
import TemperatureLegend from '../../components/TemperatureLegend/TemperatureLegend';
import { useSensorData } from '../../context/SensorContext'; 
import '../Pages.css';
import './Dashboard.css';

const Dashboard = () => {
  const { temp, humidity, loading, tempUnit, convertTemp } = useSensorData();

  if (loading) return <div className="main-content">Lade Sensordaten...</div>;

  return (
    <div className="dashboard-container">
      <h2 className="page-title">Dashboard</h2>
      
      <div className="dashboard-content">
        <div className="tacho-card">
          <div className="live-badge">
            <span className="live-dot"></span>
            LIVE
          </div>
          
          <GaugeChart 
            value={convertTemp(temp)} 
            humidity={humidity} 
            label={`°${tempUnit}`} 
            min={convertTemp(10)} 
            max={convertTemp(40)} 
          />
        </div>

        <TemperatureLegend />
      </div>
    </div>
  );
};

export default Dashboard;