import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faServer, faPlugCircleXmark } from '@fortawesome/free-solid-svg-icons';
import './OfflineCard.css';

const OfflineCard = () => {
  return (
    <div className="offline-card">
      <div className="offline-icon-wrapper">
        <FontAwesomeIcon icon={faServer} />
        <div className="offline-cross">
          <FontAwesomeIcon icon={faPlugCircleXmark} />
        </div>
      </div>
      <h3>Keine Verbindung zum Sensor</h3>
      <p>
        Das Backend ist momentan nicht erreichbar oder liefert keine Daten. 
        Wir versuchen im Hintergrund weiterhin, eine Verbindung herzustellen.
      </p>
    </div>
  );
};

export default OfflineCard;