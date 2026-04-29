import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { Endpoints } from '../apiConfig';
import { useAuth } from './AuthContext'; 

interface ApiSensorData {
  type: number;
  temperatureC: number | null;
  humidityPercent: number | null;
}

type TempUnit = 'C' | 'F';

interface SensorContextType {
  temp: number;
  humidity: number;
  loading: boolean;
  isOffline: boolean;
  refreshInterval: number;
  setRefreshInterval: (interval: number) => void;
  tempUnit: TempUnit;
  setTempUnit: (unit: TempUnit) => void;
  convertTemp: (celsius: number) => number;
}

const SensorContext = createContext<SensorContextType | undefined>(undefined);

export const SensorProvider = ({ children }: { children: ReactNode }) => {
  const { logout, isLoggedIn } = useAuth(); 

  const [temp, setTemp] = useState<number>(0);
  const [humidity, setHumidity] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  
  const [refreshInterval, setRefreshInterval] = useState<number>(() => {
    const savedInterval = localStorage.getItem('app_refresh_interval');
    return savedInterval ? Number(savedInterval) : 5000;
  });

  const [tempUnit, setTempUnitState] = useState<TempUnit>(() => {
    return (localStorage.getItem('temp_unit') as TempUnit) || 'C';
  });

  useEffect(() => {
    if (isOffline && isLoggedIn) {
      console.warn("Backend offline: Automatischer Logout wird durchgeführt, um Inkonsistenzen zu vermeiden.");
      logout();
    }
  }, [isOffline, isLoggedIn, logout]);

  const setTempUnit = (unit: TempUnit) => {
    setTempUnitState(unit);
    localStorage.setItem('temp_unit', unit);
  };

  const convertTemp = (celsius: number): number => {
    if (tempUnit === 'C') return celsius;
    return parseFloat(((celsius * 9) / 5 + 32).toFixed(1));
  };

  useEffect(() => {
    const abortController = new AbortController(); 

    const fetchLatestData = async () => {
      try {
        const response = await fetch(Endpoints.LatestSensorData, {
          signal: abortController.signal
        });

        if (!response.ok) throw new Error(`HTTP Fehler! Status: ${response.status}`);

        const data: ApiSensorData[] = await response.json();
        const tempObj = data.find(d => d.type === 0);
        const humObj = data.find(d => d.type === 1);

        if (tempObj && tempObj.temperatureC != null) setTemp(tempObj.temperatureC);
        if (humObj && humObj.humidityPercent != null) setHumidity(humObj.humidityPercent);
        
        setIsOffline(false);
        setLoading(false);
      } catch (error: any) {
        if (error.name === 'AbbortError') return;
        setIsOffline(true);
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
    <SensorContext.Provider value={{ 
      temp, humidity, loading, isOffline, refreshInterval, 
      setRefreshInterval, tempUnit, setTempUnit, convertTemp
    }}>
      {children}
    </SensorContext.Provider>
  );
};

export const useSensorData = () => {
  const context = useContext(SensorContext);
  if (context === undefined) throw new Error('useSensorData error');
  return context;
};