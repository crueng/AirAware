import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faChartLine } from '@fortawesome/free-solid-svg-icons';
import { Endpoints } from '../../apiConfig';
import { useSensorData } from '../../context/SensorContext'; 
import CustomButton from '../../components/CustomButton/CustomButton';
import CustomDropdown from '../../components/CustomDropdown/CustomDropdown';
import DateRangePicker from '../../components/DateRangePicker/DateRangePicker';
import '../Pages.css';
import './History.css';

interface SensorReading {
  id: string;
  timestamp: string;
  type: number;
  temperatureC: number | null;
  humidityPercent: number | null;
}

const VIEW_OPTIONS = [
  { id: 'combined', label: 'Beides (Kombiniert)' },
  { id: 'temp', label: 'Nur Temperatur' },
  { id: 'hum', label: 'Nur Luftfeuchtigkeit' }
];

const TIME_OPTIONS = [
  { id: 30, label: 'Letzte 30 Werte' },
  { id: 50, label: 'Letzte 50 Werte' },
  { id: 100, label: 'Letzte 100 Werte' },
  { id: 500, label: 'Letzte 500 Werte' },
  { id: 0, label: 'Eigener Zeitraum' } 
];

export default function History() {
  const { convertTemp, tempUnit } = useSensorData(); 

  const [data, setData] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<string>(() => localStorage.getItem('history_viewMode') || 'combined');
  
  const [dataCount, setDataCount] = useState<number>(() => {
    const savedCount = localStorage.getItem('history_dataCount');
    return savedCount ? Number(savedCount) : (window.innerWidth <= 480 ? 50 : 100);
  });

  const [startDate, setStartDate] = useState<string>(() => localStorage.getItem('history_startDate') || '');
  const [endDate, setEndDate] = useState<string>(() => localStorage.getItem('history_endDate') || '');

  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{from: string, to: string} | null>(null);

  useEffect(() => { localStorage.setItem('history_viewMode', viewMode); }, [viewMode]);
  useEffect(() => { localStorage.setItem('history_dataCount', dataCount.toString()); }, [dataCount]);
  useEffect(() => { localStorage.setItem('history_startDate', startDate); }, [startDate]);
  useEffect(() => { localStorage.setItem('history_endDate', endDate); }, [endDate]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (dataCount === 0 && (!startDate || !endDate)) {
        setData([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        let fetchUrl = `${Endpoints.History}?count=${dataCount}`;
        
        if (dataCount === 0) {
          const fromIso = new Date(`${startDate}T00:00:00`).toISOString();
          const toIso = new Date(`${endDate}T23:59:59`).toISOString();
          fetchUrl = `${Endpoints.History}?from=${fromIso}&to=${toIso}`;
        }

        const response = await fetch(fetchUrl);
        if (response.ok) {
          const result: SensorReading[] = await response.json();
          
          if (result.length > 0) {
            const newest = result[0].timestamp;
            const oldest = result[result.length - 1].timestamp;
            setDateRange({ from: oldest, to: newest });
          } else {
            setDateRange(null);
          }
          
          const groupedData = result.reduce((acc: any, curr: SensorReading) => {
            const dateObj = new Date(curr.timestamp);
            
            const day = dateObj.getUTCDate().toString().padStart(2, '0');
            const month = (dateObj.getUTCMonth() + 1).toString().padStart(2, '0');
            const hours = dateObj.getUTCHours().toString().padStart(2, '0');
            const minutes = dateObj.getUTCMinutes().toString().padStart(2, '0');
            
            const rawKey = curr.timestamp; 
            const displayTime = `${day}.${month}. ${hours}:${minutes}`;
            
            if (!acc[rawKey]) {
              acc[rawKey] = { 
                time: displayTime, 
                rawDate: dateObj.getTime() 
              }; 
            }
            
            if (curr.type === 0) acc[rawKey].temperatureC = curr.temperatureC;
            if (curr.type === 1) acc[rawKey].humidityPercent = curr.humidityPercent;
            
            return acc;
          }, {});

          const sortedData = Object.values(groupedData).sort((a: any, b: any) => a.rawDate - b.rawDate);
          setData(sortedData);
          
        }
      } catch (error) {
        console.error("Fehler beim Laden der Historie:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [dataCount, startDate, endDate]); 

  const handleDownloadCsv = () => {
    if (dataCount === 0 && startDate && endDate) {
      const fromIso = new Date(`${startDate}T00:00:00`).toISOString();
      const toIso = new Date(`${endDate}T23:59:59`).toISOString();
      window.open(`${Endpoints.ReportCsv}?from=${fromIso}&to=${toIso}`, '_blank');
    } else if (dateRange) {
      window.open(`${Endpoints.ReportCsv}?from=${dateRange.from}&to=${dateRange.to}`, '_blank');
    } else {
      window.open(Endpoints.ReportCsv, '_blank');
    }
  };

  const chartData = data.map(d => ({
    ...d,
    displayTemp: d.temperatureC != null ? convertTemp(d.temperatureC) : null
  }));

  return (
    <div className="dashboard-container">
      <div className="history-header-row">
        <h2 className="page-title">Historischer Verlauf</h2>
        
        <div className="history-controls">  
          <CustomDropdown 
            options={VIEW_OPTIONS}
            value={viewMode}
            onChange={(val) => setViewMode(val as string)}
          />
          <CustomDropdown 
            options={TIME_OPTIONS}
            value={dataCount}
            onChange={(val) => setDataCount(Number(val))}
          />
          
          {dataCount === 0 && (
            <DateRangePicker 
              key="range-picker" 
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />
          )}
          <CustomButton onClick={handleDownloadCsv}>
            <FontAwesomeIcon icon={faDownload} /> CSV Export
          </CustomButton>
        </div>
      </div>

      <div className="chart-card">
        {loading ? (
          <div className="loading-state">Lade Diagramm-Daten...</div>
        ) : chartData.length === 0 ? (
          <div className="empty-chart-state">
            <div className="empty-icon-wrapper">
              <FontAwesomeIcon icon={faChartLine} className="empty-icon" />
            </div>
            <h3>Keine Messdaten gefunden</h3>
            <p>
              Für den gewählten Zeitraum sind aktuell keine historischen Sensordaten vorhanden. 
              Sobald der Sensor neue Werte aufzeichnet, erscheint hier das Diagramm.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="time" stroke="#6B7280" fontSize={12} tickMargin={10} minTickGap={30} />
              
              {(viewMode === 'temp' || viewMode === 'combined') && (
                <YAxis yAxisId="left" stroke="#EE6C4D" fontSize={12} domain={['auto', 'auto']} tickFormatter={(val) => `${val}°`} />
              )}
              {(viewMode === 'hum' || viewMode === 'combined') && (
                <YAxis yAxisId="right" orientation="right" stroke="#3B82F6" fontSize={12} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
              )}

              <Tooltip 
                cursor={{ stroke: '#E5E7EB', strokeWidth: 2 }}
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                formatter={(value: any, name: any) => [`${value} ${name === 'Temperatur' ? `°${tempUnit}` : '%'}`, name]}
              />
              
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '14px', color: '#4B5563' }} />

              {(viewMode === 'temp' || viewMode === 'combined') && (
                <Line yAxisId="left" type="monotone" dataKey="displayTemp" name="Temperatur" stroke="#EE6C4D" strokeWidth={3} dot={{ r: 4, fill: '#fff', stroke: '#EE6C4D' }} activeDot={{ r: 6, fill: '#EE6C4D', stroke: '#fff', strokeWidth: 2 }} />
              )}
              {(viewMode === 'hum' || viewMode === 'combined') && (
                <Line yAxisId="right" type="monotone" dataKey="humidityPercent" name="Luftfeuchtigkeit" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#fff', stroke: '#3B82F6' }} activeDot={{ r: 6, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }} />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}