import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserMinus, faSpinner, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../context/AuthContext";
import { Endpoints } from "../../apiConfig";
import CustomButton from "../CustomButton/CustomButton";
import Toast from "../Toast/Toast"; 
import "./DeleteUser.css";

export default function DeleteUser() {
  const { token, user } = useAuth(); 
  const [targetUsername, setTargetUsername] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = targetUsername.trim();
    
    if (!cleanUsername) return;

    if (user && user.username === cleanUsername) {
      setToast({ msg: "Du kannst dein eigenes Administrator-Konto nicht löschen!", type: 'error' });
      return;
    }

    if (!window.confirm(`Soll der Benutzer "${cleanUsername}" wirklich gelöscht werden?`)) return;

    setIsDeleting(true);

    try {
      const response = await fetch(Endpoints.DeleteUser(cleanUsername), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setToast({ msg: `Benutzer "${cleanUsername}" wurde erfolgreich gelöscht.`, type: 'success' });
        setTargetUsername(""); 
      } else {
        const errorData = await response.json().catch(() => null);
        setToast({ 
          msg: errorData?.message || "Löschen fehlgeschlagen. Existiert der Nutzer?", 
          type: 'error' 
        });
      }
    } catch (err) {
      setToast({ msg: "Netzwerkfehler beim Löschen.", type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="delete-user-section">
      {toast && (
        <Toast 
          message={toast.msg} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
      
      <h3 className="settings-title">
        <FontAwesomeIcon icon={faUserMinus} className="settings-title-icon" />
        Benutzer entfernen
      </h3>
      <p className="settings-description">
        Geben Sie den exakten Benutzernamen ein, um den Zugang zu löschen.
      </p>

      <form className="delete-form" onSubmit={handleDelete}>
        <div className="settings-control">
          <label>Benutzername</label>
          <div className="delete-input-group">
            <input
              type="text"
              className="custom-input"
              value={targetUsername}
              onChange={(e) => setTargetUsername(e.target.value)}
              placeholder="z.B. max_mustermann"
            />
            <CustomButton 
              type="submit" 
              className="delete-btn"
              disabled={isDeleting || !targetUsername}
            >
              {isDeleting ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                <>
                  <FontAwesomeIcon icon={faTrash} /> Nutzer löschen
                </>
              )}
            </CustomButton>
          </div>
        </div>
      </form>
    </div>
  );
}