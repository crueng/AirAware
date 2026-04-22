import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTemperatureHigh, 
  faTint, 
  faExclamationTriangle, 
  faCheckDouble,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import { Endpoints } from '../../apiConfig'; 
import './Alarm.css';

interface ApiAlert {
  id: string;
  message: string;
  triggeredAt: string;
  threshold: {
    metricName: string;
  };
}

const Alarms = () => {
  const [alarms, setAlarms] = useState<ApiAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [readIds, setReadIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('read_alarms');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('deleted_alarms');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const deletedIdsRef = useRef(deletedIds);
  useEffect(() => { deletedIdsRef.current = deletedIds; }, [deletedIds]);

  useEffect(() => {
    const fetchAlarms = async () => {
      try {
        const response = await fetch(Endpoints.Alerts);
        
        if (response.ok) {
          const data: ApiAlert[] = await response.json();
          const activeAlerts = data.filter(alert => !deletedIdsRef.current.has(alert.id));
          const sortedData = activeAlerts.sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime());
          
          setAlarms(sortedData);
        }
      } catch (error) {
        console.error("Fehler beim Laden der Alarme:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlarms();
    const interval = setInterval(fetchAlarms, 10000);
    return () => clearInterval(interval);
  }, []);

  const tempAlertsCount = alarms.filter(a => a.threshold?.metricName === 'TemperatureC').length;
  const humAlertsCount = alarms.filter(a => a.threshold?.metricName !== 'TemperatureC').length;
  const unreadCount = alarms.filter(a => !readIds.has(a.id)).length;

  const markAllAsRead = () => {
    const newReadIds = new Set(readIds);
    alarms.forEach(a => newReadIds.add(a.id)); // Alle aktuellen IDs hinzufügen
    setReadIds(newReadIds);
    localStorage.setItem('read_alarms', JSON.stringify(Array.from(newReadIds)));
  };

  const removeAlarm = (id: string) => {
    const newDeletedIds = new Set(deletedIds);
    newDeletedIds.add(id);
    setDeletedIds(newDeletedIds);
    localStorage.setItem('deleted_alarms', JSON.stringify(Array.from(newDeletedIds)));
    
    setAlarms(prev => prev.filter(a => a.id !== id));
  };

  if (isLoading) return <div className="dashboard-container">Lade Alarme...</div>;

  return (
    <div className="dashboard-container">
      <div className="alarms-header-row">
        <h2 className="page-title" style={{ marginBottom: 0 }}>Alarm-Übersicht</h2>
        {unreadCount > 0 && (
          <button className="mark-read-btn" onClick={markAllAsRead}>
            <FontAwesomeIcon icon={faCheckDouble} /> Alle als gelesen markieren
          </button>
        )}
      </div>

      <div className="alarm-stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-icon-wrapper total-icon">
            <FontAwesomeIcon icon={faExclamationTriangle} size="lg" />
          </div>
          <div className="stat-info">
            <span className="stat-label">Ungelesene Alarme</span>
            <span className="stat-value">{unreadCount}</span>
          </div>
        </div>

        <div className="stat-card stat-temp">
          <div className="stat-icon-wrapper temp-icon">
            <FontAwesomeIcon icon={faTemperatureHigh} size="lg" />
          </div>
          <div className="stat-info">
            <span className="stat-label">Temperatur-Alarme</span>
            <span className="stat-value">{tempAlertsCount}</span>
          </div>
        </div>

        <div className="stat-card stat-hum">
          <div className="stat-icon-wrapper hum-icon">
            <FontAwesomeIcon icon={faTint} size="lg" />
          </div>
          <div className="stat-info">
            <span className="stat-label">Luftfeuchtigkeits-Alarme</span>
            <span className="stat-value">{humAlertsCount}</span>
          </div>
        </div>
      </div>

      <div className="tacho-card alarms-list-card">
        <h3 className="settings-title" style={{ marginBottom: '1.5rem' }}>Alle Benachrichtigungen</h3>
        
        <div className="alarms-list">
          {alarms.length === 0 ? (
            <div className="empty-state">Keine Alarme im System vorhanden.</div>
          ) : (
            alarms.map(alarm => {
              const isTemp = alarm.threshold?.metricName === 'TemperatureC';
              const isRead = readIds.has(alarm.id);

              return (
                <div key={alarm.id} className={`alarm-row ${!isRead ? 'unread-row' : ''}`}>
                  
                  {/* Icon basierend auf Backend-Metrik */}
                  <div className={`alarm-row-icon ${isTemp ? 'temperature' : 'humidity'}`}>
                    <FontAwesomeIcon icon={isTemp ? faTemperatureHigh : faTint} />
                  </div>

                  {/* Textinhalt */}
                  <div className="alarm-row-content">
                    <div className="alarm-row-message">{alarm.message}</div>
                    <div className="alarm-row-time">
                      {new Date(alarm.triggeredAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })} um {new Date(alarm.triggeredAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute:'2-digit' })} Uhr
                    </div>
                  </div>

                  {/* Löschen */}
                  <button 
                    className="alarm-delete-btn" 
                    onClick={() => removeAlarm(alarm.id)}
                    title="Alarm dauerhaft löschen"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Alarms;