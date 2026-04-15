import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTemperatureHigh, 
  faTint, 
  faExclamationTriangle, 
  faCheckDouble,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import './alarm.css';

interface Alarm {
  id: string;
  type: 'temperature' | 'humidity';
  message: string;
  timestamp: string;
  isRead: boolean;
}

const initialAlarms: Alarm[] = [
  { id: '1', type: 'temperature', message: 'Kritische Temperatur erreicht: 42.5°C', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), isRead: false },
  { id: '2', type: 'humidity', message: 'Luftfeuchtigkeit zu niedrig: 18%', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), isRead: false },
  { id: '3', type: 'temperature', message: 'Temperatur leicht erhöht: 38.1°C', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), isRead: true },
  { id: '4', type: 'humidity', message: 'Luftfeuchtigkeit kritisch hoch: 85%', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), isRead: true },
  { id: '5', type: 'temperature', message: 'Kritische Temperatur erreicht: 41.0°C', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), isRead: true },
];

const Alarms = () => {
  const [alarms, setAlarms] = useState<Alarm[]>(initialAlarms);

  const tempAlertsCount = alarms.filter(a => a.type === 'temperature').length;
  const humAlertsCount = alarms.filter(a => a.type === 'humidity').length;
  const unreadCount = alarms.filter(a => !a.isRead).length;

  const markAllAsRead = () => {
    setAlarms(alarms.map(alarm => ({ ...alarm, isRead: true })));
  };

  const removeAlarm = (id: string) => {
    setAlarms(alarms.filter(alarm => alarm.id !== id));
  };

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
            <span className="stat-label">Temperatur-Alarme (Gesamt)</span>
            <span className="stat-value">{tempAlertsCount}</span>
          </div>
        </div>

        <div className="stat-card stat-hum">
          <div className="stat-icon-wrapper hum-icon">
            <FontAwesomeIcon icon={faTint} size="lg" />
          </div>
          <div className="stat-info">
            <span className="stat-label">Luftfeuchtigkeits-Alarme (Gesamt)</span>
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
            alarms.map(alarm => (
              <div key={alarm.id} className={`alarm-row ${!alarm.isRead ? 'unread-row' : ''}`}>
                
                <div className={`alarm-row-icon ${alarm.type}`}>
                  <FontAwesomeIcon icon={alarm.type === 'temperature' ? faTemperatureHigh : faTint} />
                </div>

                <div className="alarm-row-content">
                  <div className="alarm-row-message">{alarm.message}</div>
                  <div className="alarm-row-time">
                    {new Date(alarm.timestamp).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })} um {new Date(alarm.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute:'2-digit' })} Uhr
                  </div>
                </div>

                <button 
                  className="alarm-delete-btn" 
                  onClick={() => removeAlarm(alarm.id)}
                  title="Alarm löschen"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Alarms;