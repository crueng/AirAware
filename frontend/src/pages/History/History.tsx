import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { Endpoints } from '../../apiConfig';
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

export default function History() {
  const [data, setData] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<string>('combined');
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dateRange, setDateRange] = useState<{from: string, to: string} | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${Endpoints.History}?count=100`);
        if (response.ok) {
          const result: SensorReading[] = await response.json();
          
          if (result.length > 0) {
            const newest = result[0].timestamp;
            const oldest = result[result.length - 1].timestamp;
            setDateRange({ from: oldest, to: newest });
          }
          
          const groupedData = result.reduce((acc: any, curr: SensorReading) => {
            const time = new Date(curr.timestamp).toLocaleTimeString('de-DE', { 
              hour: '2-digit', 
              minute: '2-digit',
              timeZone: 'UTC'
            });
            
            if (!acc[time]) acc[time] = { time };
            if (curr.type === 0) acc[time].temperatureC = curr.temperatureC;
            if (curr.type === 1) acc[time].humidityPercent = curr.humidityPercent;
            return acc;
          }, {});
          setData(Object.values(groupedData).reverse());
        }
      } catch (error) {
        console.error("Fehler beim Laden der Historie:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDownloadCsv = () => {
    if (dateRange) {
      window.open(`${Endpoints.ReportCsv}?from=${dateRange.from}&to=${dateRange.to}`, '_blank');
    } else {
      window.open(Endpoints.ReportCsv, '_blank');
    }
  };

  const selectedLabel = VIEW_OPTIONS.find(opt => opt.id === viewMode)?.label;

  return (
    <div className="dashboard-container">
      <div className="history-header-row">
        <h2 className="page-title">Historischer Verlauf</h2>
        
        <div className="history-controls">
          <div className="custom-dropdown" ref={dropdownRef}>
            <button 
              className={`dropdown-trigger ${isDropdownOpen ? 'active' : ''}`}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span>{selectedLabel}</span>
              <FontAwesomeIcon icon={faChevronDown} className={`arrow-icon ${isDropdownOpen ? 'rotated' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="dropdown-menu">
                {VIEW_OPTIONS.map((option) => (
                  <div 
                    key={option.id} 
                    className={`dropdown-item ${viewMode === option.id ? 'selected' : ''}`}
                    onClick={() => {
                      setViewMode(option.id);
                      setIsDropdownOpen(false);
                    }}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="csv-download-btn" onClick={handleDownloadCsv}>
            <FontAwesomeIcon icon={faDownload} /> CSV Export
          </button>
        </div>
      </div>

      <div className="chart-card">
        {loading ? (
          <div className="loading-state">Lade Diagramm-Daten...</div>
        ) : data.length === 0 ? (
          <div className="empty-state">Keine Messdaten vorhanden.</div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="time" 
                stroke="#6B7280" 
                fontSize={12} 
                tickMargin={10} 
                minTickGap={30}
              />
              
              {(viewMode === 'temp' || viewMode === 'combined') && (
                <YAxis 
                  yAxisId="left" 
                  stroke="#EE6C4D" 
                  fontSize={12} 
                  domain={['auto', 'auto']} 
                  tickFormatter={(val) => `${val}°`} 
                />
              )}
              {(viewMode === 'hum' || viewMode === 'combined') && (
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="#3B82F6" 
                  fontSize={12} 
                  domain={[0, 100]} 
                  tickFormatter={(val) => `${val}%`} 
                />
              )}

              <Tooltip 
                cursor={{ stroke: '#E5E7EB', strokeWidth: 2 }}
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                formatter={(value: any, name: any) => [
                  `${value} ${name === 'Temperatur' ? '°C' : '%'}`, 
                  name 
                ]}
              />
              
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '14px', color: '#4B5563' }} />

              {(viewMode === 'temp' || viewMode === 'combined') && (
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="temperatureC" 
                  name="Temperatur" 
                  stroke="#EE6C4D" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#fff', stroke: '#EE6C4D' }} 
                  activeDot={{ r: 6, fill: '#EE6C4D', stroke: '#fff', strokeWidth: 2 }} 
                />
              )}
              {(viewMode === 'hum' || viewMode === 'combined') && (
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="humidityPercent" 
                  name="Luftfeuchtigkeit" 
                  stroke="#3B82F6" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#fff', stroke: '#3B82F6' }} 
                  activeDot={{ r: 6, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }} 
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}