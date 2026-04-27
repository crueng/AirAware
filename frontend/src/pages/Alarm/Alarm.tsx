import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTemperatureHigh, 
  faTint, 
  faExclamationTriangle, 
  faCheckDouble,
  faCheck, 
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import { Endpoints } from '../../apiConfig'; 
import { useAuth } from '../../context/AuthContext';
import './Alarm.css';

interface ApiAlert {
  id: string;
  message: string;
  triggeredAt: string;
  threshold?: {
    metricName: string;
  };
  isRead?: boolean; 
}

const getLocalReadIds = (): string[] => JSON.parse(localStorage.getItem('read_alarms') || '[]');
const getLocalDeletedIds = (): string[] => JSON.parse(localStorage.getItem('deleted_alarms') || '[]');

const Alarms = () => {
  const [alarms, setAlarms] = useState<ApiAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { token, isLoggedIn } = useAuth(); 

  const fetchAlarms = async () => {
    if (!token || !isLoggedIn) return;

    try {
      const response = await fetch(Endpoints.Alerts, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data: ApiAlert[] = await response.json();
        
        const readIds = getLocalReadIds();
        const deletedIds = getLocalDeletedIds();

        const processedData = data
          .filter(a => !deletedIds.includes(a.id))
          .map(a => ({
            ...a,
            isRead: readIds.includes(a.id)
          }))
          .sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime());
        
        setAlarms(processedData);
      }
    } catch (error) {
      console.error("Fehler beim Laden der Alarme:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlarms();
    const interval = setInterval(fetchAlarms, 10000);
    
    const handleSync = () => {
      const readIds = getLocalReadIds();
      const deletedIds = getLocalDeletedIds();
      
      setAlarms(prevAlarms => prevAlarms
        .filter(a => !deletedIds.includes(a.id))
        .map(a => ({
          ...a,
          isRead: readIds.includes(a.id)
        }))
      );
    };
    
    window.addEventListener('sync_alarms', handleSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('sync_alarms', handleSync);
    };
  }, [token, isLoggedIn]);

  const tempAlertsCount = alarms.filter(a => a.threshold?.metricName === 'TemperatureC').length;
  const humAlertsCount = alarms.filter(a => a.threshold?.metricName !== 'TemperatureC').length;
  const unreadCount = alarms.filter(a => !a.isRead).length;

  const markAllAsRead = () => {
    const readIds = getLocalReadIds();
    alarms.forEach(a => {
      if (!readIds.includes(a.id)) readIds.push(a.id);
    });
    localStorage.setItem('read_alarms', JSON.stringify(readIds));
    
    setAlarms(prev => prev.map(a => ({ ...a, isRead: true })));
    window.dispatchEvent(new Event('sync_alarms')); 
  };

  const markAsRead = (id: string) => {
    const readIds = getLocalReadIds();
    if (!readIds.includes(id)) {
      readIds.push(id);
      localStorage.setItem('read_alarms', JSON.stringify(readIds));
    }
    setAlarms(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
    window.dispatchEvent(new Event('sync_alarms')); 
  };

  const removeAlarm = (id: string) => {
    const deletedIds = getLocalDeletedIds();
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      localStorage.setItem('deleted_alarms', JSON.stringify(deletedIds));
    }
    setAlarms(prev => prev.filter(a => a.id !== id));
    window.dispatchEvent(new Event('sync_alarms')); 
  };

  if (isLoading) return <div className="dashboard-container">Lade Alarme...</div>;

  return (
    <div className="dashboard-container">
      <div className="alarms-header-row">
        <h2 className="page-title">Alarm-Übersicht</h2>
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

      <div className="alarms-list-wrapper">
        <h3 className="page-title list-section-title">Alle Benachrichtigungen</h3>
        
        <div className="alarms-list">
          {alarms.length === 0 ? (
            <div className="empty-state">Keine Alarme im System vorhanden.</div>
          ) : (
            alarms.map(alarm => {
              const isTemp = alarm.threshold?.metricName === 'TemperatureC';

              return (
                <div key={alarm.id} className={`alarm-row ${!alarm.isRead ? 'unread-row' : ''}`}>
                  
                  <div className={`alarm-row-icon ${isTemp ? 'temperature' : 'humidity'}`}>
                    <FontAwesomeIcon icon={isTemp ? faTemperatureHigh : faTint} />
                  </div>

                  <div className="alarm-row-content">
                    <div className="alarm-row-message">{alarm.message}</div>
                    <div className="alarm-row-time">
                      {new Date(alarm.triggeredAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })} um {new Date(alarm.triggeredAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute:'2-digit' })} Uhr
                    </div>
                  </div>

                  <div className="alarm-actions">
                    {!alarm.isRead && (
                      <button 
                        className="alarm-action-btn check-btn" 
                        onClick={() => markAsRead(alarm.id)}
                        title="Als gelesen markieren"
                      >
                        <FontAwesomeIcon icon={faCheck} />
                      </button>
                    )}
                    
                    <button 
                      className="alarm-action-btn delete-btn" 
                      onClick={() => removeAlarm(alarm.id)}
                      title="Alarm dauerhaft löschen"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
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