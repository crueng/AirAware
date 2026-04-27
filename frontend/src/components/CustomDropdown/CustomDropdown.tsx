import { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import './CustomDropdown.css';

interface Option {
  id: string | number;
  label: string;
}

interface CustomDropdownProps {
  options: Option[];
  value: string | number;
  onChange: (value: any) => void;
}

export default function CustomDropdown({ options, value, onChange }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find(opt => opt.id === value)?.label || 'Auswählen...';

  return (
    <div className="custom-dropdown-component" ref={dropdownRef}>
      <button 
        type="button"
        className={`dropdown-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedLabel}</span>
        <FontAwesomeIcon icon={faChevronDown} className={`arrow-icon ${isOpen ? 'rotated' : ''}`} />
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          {options.map((option) => (
            <div 
              key={option.id} 
              className={`dropdown-item ${value === option.id ? 'selected' : ''}`}
              onClick={() => {
                onChange(option.id);
                setIsOpen(false);
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}