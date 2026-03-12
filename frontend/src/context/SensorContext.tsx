import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { Endpoints } from '../Api';

interface ApiSensorData {
  type: number;
  temperatureC: number | null;
  humidityPercent: number | null;
}

interface SensorContextType {
  temp: number;
  humidity: number;
  loading: boolean;
  refreshInterval: number;
  setRefreshInterval: (interval: number) => void;
}

const SensorContext = createContext<SensorContextType | undefined>(undefined);

export const SensorProvider = ({ children }: { children: ReactNode }) => {
  const [temp, setTemp] = useState<number>(0);
  const [humidity, setHumidity] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  
  const [refreshInterval, setRefreshInterval] = useState<number>(() => {
    const savedInterval = localStorage.getItem('app_refresh_interval');
    return savedInterval ? Number(savedInterval) : 5000;
  });

  useEffect(() => {
    localStorage.setItem('app_refresh_interval', refreshInterval.toString());
  }, [refreshInterval]);

  useEffect(() => {
    const abortController = new AbortController(); 

    const fetchLatestData = async () => {
        console.log(`⏱️ Fetche neue Daten... (Aktuelles Intervall: ${refreshInterval} ms)`);
      
    try {
        const response = await fetch(Endpoints.LatestSensorData, {
          signal: abortController.signal
        });

        if (!response.ok) {
          throw new Error(`HTTP Fehler! Status: ${response.status}`);
        }

        const data: ApiSensorData[] = await response.json();

        const tempObj = data.find(d => d.type === 0);
        const humObj = data.find(d => d.type === 1);

        if (tempObj && tempObj.temperatureC != null) {
          setTemp(tempObj.temperatureC);
        }
        if (humObj && humObj.humidityPercent != null) {
          setHumidity(humObj.humidityPercent);
        }
        
        setLoading(false);
      } catch (error: any) {
        if (error.name === 'AbortError') return;
        
        console.error("Fehler beim Laden der Sensordaten:", error);
        setLoading(false);
      }
    };

    fetchLatestData();

    const intervalId = setInterval(fetchLatestData, refreshInterval);

    return () => {
      clearInterval(intervalId);
      abortController.abort();
    };
  }, [refreshInterval]); 

  return (
    <SensorContext.Provider value={{ temp, humidity, loading, refreshInterval, setRefreshInterval }}>
      {children}
    </SensorContext.Provider>
  );
};

export const useSensorData = () => {
  const context = useContext(SensorContext);
  if (context === undefined) {
    throw new Error('useSensorData muss innerhalb eines SensorProviders verwendet werden');
  }
  return context;
};