import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import CustomButton from "../CustomButton/CustomButton";
import "./ConfirmPopup.css";

interface ConfirmPopupProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmPopup = ({
  isOpen,
  title,
  message,
  confirmText = "Löschen",
  cancelText = "Abbrechen",
  onConfirm,
  onCancel,
}: ConfirmPopupProps) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay" onMouseDown={onCancel}>
      <div
        className="confirm-modal-content"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="confirm-icon-wrapper">
          <FontAwesomeIcon icon={faExclamationTriangle} />
        </div>

        <h3 className="confirm-title">{title}</h3>
        <p className="confirm-message">{message}</p>

        <div className="confirm-actions">
          <CustomButton
            type="button"
            className="cancel-button"
            onClick={onCancel}
          >
            {cancelText}
          </CustomButton>
          <CustomButton
            type="button"
            className="danger-button"
            onClick={onConfirm}
          >
            {confirmText}
          </CustomButton>
        </div>
      </div>
    </div>
  );
};

export default ConfirmPopup;
