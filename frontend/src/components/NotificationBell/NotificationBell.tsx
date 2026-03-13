import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
// import { Endpoints } from '../../apiConfig'; 
import './NotificationBell.css'; 

interface Alert {
  id: string;
  message: string;
  triggeredAt: string;
}

const NotificationBell = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [livePopup, setLivePopup] = useState<Alert | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [readIds, setReadIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('read_alarms');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const readIdsRef = useRef(readIds);
  const livePopupRef = useRef(livePopup);

  useEffect(() => {
    readIdsRef.current = readIds;
  }, [readIds]);

  useEffect(() => {
    livePopupRef.current = livePopup;
  }, [livePopup]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // useEffect(() => {
  //   const fetchAlerts = async () => {
  //     try {
  //       const response = await fetch(Endpoints.Alerts);
  //       if (response.ok) {
  //         const data: Alert[] = await response.json();
  //         const sortedData = data.sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime());
  //         setAlerts(sortedData);

  //         if (sortedData.length > 0) {
  //           const newestAlert = sortedData[0];
  //           const isUnread = !readIdsRef.current.has(newestAlert.id);
  //           const isRecent = (new Date().getTime() - new Date(newestAlert.triggeredAt).getTime()) < 120000; 

  //           if (isUnread && isRecent && (!livePopupRef.current || livePopupRef.current.id !== newestAlert.id)) {
  //             setLivePopup(newestAlert);
  //             setTimeout(() => setLivePopup(null), 6000);
  //           }
  //         }
  //       }
  //      } catch (error) {
  //       console.error("Fehler beim Laden der Alarme:", error);
  //     }
  //   };

  //   fetchAlerts(); 

  //   const interval = setInterval(fetchAlerts, 10000);
  //   return () => clearInterval(interval);
  // }, []); 

  useEffect(() => {
    const fakeInterval = setInterval(() => {
      const isTemp = Math.random() > 0.5;
      const fakeValue = isTemp ? (Math.random() * 10 + 30).toFixed(1) + "°C" : (Math.random() * 20 + 70).toFixed(0) + "%";
      
      const newFakeAlert: Alert = {
        id: `fake-${Date.now()}`,
        message: `🚨 Wert außerhalb des zulässigen Bereichs! Gemessen: ${fakeValue}`,
        triggeredAt: new Date().toISOString()
      };

      setAlerts(prevAlerts => {
        const newList = [newFakeAlert, ...prevAlerts];
        return newList.slice(0, 10); 
      });

      setLivePopup(newFakeAlert);
      
      setTimeout(() => setLivePopup(null), 6000);

      console.log("🚨 Fake-Alarm generiert!");
    }, 12000);

    return () => clearInterval(fakeInterval);
  }, []);

  const markAsRead = (id: string) => {
    const newReadIds = new Set(readIds);
    newReadIds.add(id);
    setReadIds(newReadIds);
    localStorage.setItem('read_alarms', JSON.stringify(Array.from(newReadIds)));
  };

  const unreadCount = alerts.filter(a => !readIds.has(a.id)).length;

  return (
    <>
      {livePopup && (
        <div className="alarm-popup" onClick={() => { markAsRead(livePopup.id); setLivePopup(null); setIsOpen(true); }}>
          <div className="popup-title">
            <FontAwesomeIcon icon={faExclamationTriangle} />
            Neuer Sensor-Alarm!
          </div>
          <div className="popup-message">{livePopup.message}</div>
        </div>
      )}

      <div className="notification-container" ref={dropdownRef}>
        <button className="bell-button" onClick={() => setIsOpen(!isOpen)}>
          <FontAwesomeIcon icon={faBell} />
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </button>

        {isOpen && (
          <div className="notification-dropdown">
            <div className="notification-header">
              Benachrichtigungen ({unreadCount} neu)
            </div>

            <div className="alert-list">
              {alerts.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>
                  Keine Alarme vorhanden.
                </div>
              ) : (
                alerts.slice(0, 5).map(alert => {
                  const isRead = readIds.has(alert.id);
                  return (
                    <div
                      key={alert.id}
                      className={`alert-item ${!isRead ? 'unread' : ''}`}
                      onClick={() => markAsRead(alert.id)}
                    >
                      <div className="alert-time">
                        {new Date(alert.triggeredAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute:'2-digit' })} Uhr
                      </div>
                      <div className="alert-message">
                        {alert.message}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="notification-footer">
              <a href="/alarms">Alle Alarme anzeigen &rarr;</a>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationBell;