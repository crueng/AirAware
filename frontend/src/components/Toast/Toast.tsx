import { useEffect } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faCircleXmark, faXmark } from "@fortawesome/free-solid-svg-icons";
import './Toast.css';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast-popup ${type}`}>
      <div className="toast-content">
        <FontAwesomeIcon icon={type === 'success' ? faCircleCheck : faCircleXmark} className="toast-icon" />
        <span className="toast-message">{message}</span>
        <button onClick={onClose} className="toast-close">
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>
    </div>
  );
}