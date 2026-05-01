import { useEffect, useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { de } from "date-fns/locale/de";
import "react-datepicker/dist/react-datepicker.css";
import "../DateRangePicker/DateRangePicker.css";

registerLocale("de", de);

interface SingleDatePickerProps {
  selectedDate: string;
  onChange: (date: string) => void;
}

const SingleDatePicker = ({
  selectedDate,
  onChange,
}: SingleDatePickerProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const stringToDate = (s: string) => {
    if (!s) return null;
    const [year, month, day] = s.split("-");
    return new Date(Number(year), Number(month) - 1, Number(day));
  };

  const dateToString = (d: Date | null) => {
    if (!d) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return (
    <>
      <style>
        {`
          /* Überschreibt die 90px aus dem alten CSS nur für diesen einen Picker */
          .single-picker-wrapper .custom-date-input {
            width: 110px !important; 
          }
        `}
      </style>

      <div
        className={`date-picker-group single-picker-wrapper ${mounted ? "is-visible" : ""}`}
        style={{ maxWidth: mounted ? "160px" : "0" }}
      >
        <DatePicker
          selected={stringToDate(selectedDate)}
          onChange={(date: Date | null) => onChange(dateToString(date))}
          dateFormat="dd.MM.yyyy"
          placeholderText="Datum wählen"
          locale="de"
          className="custom-date-input"
          calendarClassName="calendar"
        />
      </div>
    </>
  );
};

export default SingleDatePicker;
