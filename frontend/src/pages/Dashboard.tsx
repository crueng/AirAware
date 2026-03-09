import { useEffect, useState } from 'react';

import GaugeChart from '../components/GaugeChart';
import './Pages.css';
import './Dasboard.css';

interface SensorData {
  type: number;
  temperatureC: number | null;
  humidityPercent: number | null;
}

const Dashboard = () => {
  const [temp, setTemp] = useState<number>(0);
  const [humidity, setHumidity] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/sensordata/latest');
        const data: SensorData[] = await response.json();

        const tempObj = data.find(d => d.type === 0);
        const humObj = data.find(d => d.type === 1);

        if (tempObj?.temperatureC !== null) setTemp(tempObj!.temperatureC!);
        if (humObj?.humidityPercent !== null) setHumidity(humObj!.humidityPercent!);
        
        setLoading(false);
      } catch (error) {
        console.error("Fehler beim Laden der Sensordaten:", error);
        setTemp(23.5);
        setHumidity(61);
        setLoading(false);
      }
    };

    fetchLatestData();
  }, []);

  if (loading) return <div className="main-content">Lade Sensordaten...</div>;

  return (
    <div className="dashboard-container">
      <h2 className="page-title">Dashboard</h2>
      
      <div className="tacho-card">
        <GaugeChart 
          value={temp} 
          humidity={humidity} 
          label="°C" 
          min={10} 
          max={35} 
        />
      </div>
    </div>
  );
};

export default Dashboard;