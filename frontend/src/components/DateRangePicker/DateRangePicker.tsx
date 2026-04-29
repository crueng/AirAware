import { useEffect, useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { de } from 'date-fns/locale/de';
import "react-datepicker/dist/react-datepicker.css";
import './DateRangePicker.css';

registerLocale('de', de);

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

const DateRangePicker = ({ startDate, endDate, onStartDateChange, onEndDateChange }: DateRangePickerProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const stringToDate = (s: string) => s ? new Date(s) : null;
  const dateToString = (d: Date | null) => d ? d.toISOString().split('T')[0] : '';

 return (
    <div className={`date-picker-group ${mounted ? 'is-visible' : ''}`}>
      <DatePicker
        selected={stringToDate(startDate) as Date} 
        onChange={(date: Date | null) => onStartDateChange(dateToString(date))}
        selectsStart
        startDate={stringToDate(startDate) as Date}
        endDate={stringToDate(endDate) as Date}
        dateFormat="dd.MM.yyyy"
        placeholderText="Von"
        locale="de"
        className="custom-date-input"
        calendarClassName="calendar"
      />
      
      <span className="date-separator">-</span>

      <DatePicker
        selected={stringToDate(endDate) as Date}
        onChange={(date: Date | null) => onEndDateChange(dateToString(date))}
        selectsEnd
        startDate={stringToDate(startDate) as Date}
        endDate={stringToDate(endDate) as Date}
        minDate={stringToDate(startDate) as Date}
        dateFormat="dd.MM.yyyy"
        placeholderText="Bis"
        locale="de"
        className="custom-date-input"
        calendarClassName="calendar"
      />
    </div>
  );
};

export default DateRangePicker;