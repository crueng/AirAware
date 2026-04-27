import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faExclamationTriangle, faTimes, faCheck } from "@fortawesome/free-solid-svg-icons";
import { Endpoints } from "../../apiConfig";
import { useAuth } from "../../context/AuthContext";
import "./NotificationBell.css";

interface ApiAlert {
  id: string;
  message: string;
  triggeredAt: string;
  isRead?: boolean;
}

const getLocalReadIds = (): string[] => JSON.parse(localStorage.getItem('read_alarms') || '[]');
const getLocalDeletedIds = (): string[] => JSON.parse(localStorage.getItem('deleted_alarms') || '[]');

const NotificationBell = () => {
  const [alerts, setAlerts] = useState<ApiAlert[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [livePopup, setLivePopup] = useState<ApiAlert | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastSeenAlertId = useRef<string | null>(null);

  const { token, isLoggedIn } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchAlerts = async () => {
    if (!token || !isLoggedIn) return;

    try {
      const response = await fetch(Endpoints.Alerts, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
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

        if (processedData.length > 0) {
          const newest = processedData[0];
          if (lastSeenAlertId.current !== null && lastSeenAlertId.current !== newest.id && !newest.isRead) {
            setLivePopup(newest);
            setTimeout(() => setLivePopup(null), 8000);
          }
          lastSeenAlertId.current = newest.id;
        }

        setAlerts(processedData);
      }
    } catch (error) {
      console.error("Fehler beim Abrufen der Glocken-Alarme:", error);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);
    const handleSync = () => {
      const readIds = getLocalReadIds();
      const deletedIds = getLocalDeletedIds();
      
      setAlerts(prevAlerts => prevAlerts
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

  const markAsRead = (id: string) => {
    const readIds = getLocalReadIds();
    if (!readIds.includes(id)) {
      readIds.push(id);
      localStorage.setItem('read_alarms', JSON.stringify(readIds));
    }
    setAlerts((prev) => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
    window.dispatchEvent(new Event('sync_alarms'));
  };

  const removeAlert = (id: string) => {
    const deletedIds = getLocalDeletedIds();
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      localStorage.setItem('deleted_alarms', JSON.stringify(deletedIds));
    }
    setAlerts((prev) => prev.filter(a => a.id !== id));
    window.dispatchEvent(new Event('sync_alarms'));
  };

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  if (!isLoggedIn) return null;

  return (
    <>
      {livePopup && (
        <div className="alarm-popup" onClick={() => { markAsRead(livePopup.id); setLivePopup(null); setIsOpen(true); }}>
          <div className="popup-header-row">
            <div className="popup-title">
              <FontAwesomeIcon icon={faExclamationTriangle} /> Neuer Sensor-Alarm!
            </div>
            <button className="popup-close-btn" onClick={(e) => { e.stopPropagation(); setLivePopup(null); }}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className="popup-message">{livePopup.message}</div>
        </div>
      )}

      <div className="notification-container" ref={dropdownRef}>
        <button className="bell-button" onClick={() => setIsOpen(!isOpen)}>
          <FontAwesomeIcon icon={faBell} />
          {unreadCount > 0 && (
            <span className="notification-badge">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="notification-dropdown">
            <div className="notification-header">
              Benachrichtigungen ({unreadCount} neu)
            </div>

            <div className="alert-list">
              {alerts.length === 0 ? (
                <div className="empty-state-text">Keine Alarme vorhanden.</div>
              ) : (
                alerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className={`alert-item ${!alert.isRead ? "unread" : ""}`}>
                    <div className="alert-content" onClick={() => markAsRead(alert.id)}>
                      <div className="alert-time">
                        {new Date(alert.triggeredAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
                      </div>
                      <div className="alert-message">{alert.message}</div>
                    </div>
                    
                    <div className="alert-actions-group">
                      {!alert.isRead && (
                        <button className="alert-action-btn action-check-btn" onClick={(e) => { e.stopPropagation(); markAsRead(alert.id); }} title="Als gelesen markieren">
                          <FontAwesomeIcon icon={faCheck} />
                        </button>
                      )}
                      <button className="alert-action-btn action-delete-btn" onClick={(e) => { e.stopPropagation(); removeAlert(alert.id); }} title="Alarm löschen">
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </div>

                  </div>
                ))
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