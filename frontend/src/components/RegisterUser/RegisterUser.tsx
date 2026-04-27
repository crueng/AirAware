import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../context/AuthContext";
import { Endpoints } from "../../apiConfig";
import CustomButton from "../CustomButton/CustomButton";
import "./RegisterUser.css";

export default function RegisterUser() {
  const { token } = useAuth();
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerMsg, setRegisterMsg] = useState("");
  const [registerErr, setRegisterErr] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) {
      setRegisterErr("Bitte Benutzername und Passwort eingeben.");
      return;
    }
    if (!token) return;

    setIsRegistering(true);
    setRegisterMsg("");
    setRegisterErr("");

    try {
      const response = await fetch(Endpoints.Register, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: newUsername, password: newPassword }),
      });

      if (response.ok) {
        setRegisterMsg(`Benutzer '${newUsername}' erfolgreich angelegt!`);
        setNewUsername("");
        setNewPassword("");
        setTimeout(() => setRegisterMsg(""), 4000);
      } else {
        setRegisterErr("Fehler beim Anlegen. Evtl. existiert der Nutzer schon.");
      }
    } catch (err) {
      setRegisterErr("Netzwerkfehler beim Anlegen des Benutzers.");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <>
      <h3 className="settings-title">
        <FontAwesomeIcon icon={faUserPlus} className="settings-title-icon" />
        Benutzerverwaltung
      </h3>
      <p className="settings-description">
        Neue Administrator-Zugänge für dieses Dashboard anlegen.
      </p>

      <form className="register-form" onSubmit={handleRegister}>
        <div className="settings-control">
          <label>Benutzername</label>
          <input
            type="text"
            className="custom-input"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="z.B. admin"
          />
        </div>
        <div className="settings-control" style={{ marginTop: '1rem' }}>
          <label>Passwort</label>
          <input
            type="password"
            className="custom-input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Sicheres Passwort"
          />
        </div>
        
        <CustomButton 
            type="submit" 
            style={{ marginTop: '1.5rem', width: 'auto' }} 
            disabled={isRegistering}
            >
            {isRegistering ? <FontAwesomeIcon icon={faSpinner} spin /> : "Benutzer anlegen"}
        </CustomButton>

        <div style={{ marginTop: '1rem' }}>
          {registerMsg && <span className="save-message">{registerMsg}</span>}
          {registerErr && <span className="error-message">{registerErr}</span>}
        </div>
      </form>
    </>
  );
}