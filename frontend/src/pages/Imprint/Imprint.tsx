import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCode,
  faGraduationCap,
  faScaleBalanced,
  faHeart,
} from "@fortawesome/free-solid-svg-icons";
import "../Pages.css";
import "./Imprint.css";

export default function Impressum() {
  return (
    <div className="dashboard-container">
      <h2 className="page-title">Impressum</h2>

      <div className="impressum-content">
        <div className="impressum-card">
          <div className="impressum-icon-wrapper">
            <FontAwesomeIcon icon={faGraduationCap} />
          </div>
          <h3>Schulprojekt</h3>
          <p>
            <strong>AirAware</strong> ist im Rahmen eines Schulprojekts der
            Klasse <strong>EFI24A</strong> entstanden. Es handelt sich hierbei
            um einen Prototypen und keine kommerzielle Anwendung.
          </p>
        </div>

        <div className="impressum-card">
          <div className="impressum-icon-wrapper">
            <FontAwesomeIcon icon={faCode} />
          </div>
          <h3>Entwicklung</h3>
          <p>
            Mit <FontAwesomeIcon icon={faHeart} className="heart-icon" />{" "}
            entwickelt von:
            <br />
            <strong>Finja</strong> (Frontend) <br />
            <strong>Moritz</strong> (Backend) <br />
            <strong>Connor</strong> (Embedded) <br />
          </p>
        </div>

        <div className="impressum-card">
          <div className="impressum-icon-wrapper">
            <FontAwesomeIcon icon={faScaleBalanced} />
          </div>
          <h3>Haftungsausschluss</h3>
          <p>
            Alle gemessenen Sensordaten (Temperatur & Luftfeuchtigkeit) sind
            rein informativ. Wir übernehmen keine Haftung für verbrannte oder
            vertrocknete Pflanzen. 😉
          </p>
        </div>
      </div>
    </div>
  );
}
