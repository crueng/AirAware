import { useEffect, useState } from 'react';
import GaugeChart from '../components/GaugeChart';
import './Pages.css';
import './Dasboard.css';

interface SensorData {
  type: number;
  temperatureC: number | null;
}

const Temperature = () => {
  const [temp, setTemp] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/sensordata/latest');
        const data: SensorData[] = await response.json();

        const tempObj = data.find(d => d.type === 0);

        if (tempObj?.temperatureC !== null) setTemp(tempObj!.temperatureC!);
        
        setLoading(false);
      } catch (error) {
        console.error("Fehler beim Laden der Sensordaten:", error);
        setLoading(false);
      }
    };

    fetchLatestData();

    const intervalId = setInterval(fetchLatestData, 60000);

    return () => clearInterval(intervalId);
    
  }, []);

  if (loading) return <div className="main-content">Lade Sensordaten...</div>;

  return (
    <div className="dashboard-container">
      <h2 className="page-title">Dashboard</h2>
      
      <div className="tacho-card">
        <div className="live-badge">
          <span className="live-dot"></span>
          LIVE
        </div>
        
        <GaugeChart 
          value={temp} 
          label="°C" 
          min={10} 
          max={40} 
        />
      </div>
    </div>
  );
};

export default Temperature;