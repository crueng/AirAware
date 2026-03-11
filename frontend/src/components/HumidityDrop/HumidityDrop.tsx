import './HumidityDrop.css';

interface HumidityDropProps {
  value: number; 
}

const HumidityDrop = ({ value }: HumidityDropProps) => {
  const percentage = Math.min(100, Math.max(0, value));
  const dropPath = "M12 2C7.5 7 4 11.5 4 15.5a8 8 0 1 0 16 0c0-4-3.5-8.5-8-13.5z";

  return (
    <div className="humidity-drop-wrapper">
      <div className="drop-container">
        
        <div className="drop-bg">
          <svg viewBox="0 0 24 24">
            <path d={dropPath} />
          </svg>
        </div>

        <div 
          className="drop-fill-wrapper" 
          style={{ height: `${percentage}%` }}
        >
          <div className="drop-fill">
            <svg viewBox="0 0 24 24">
              <path d={dropPath} />
            </svg>
          </div>
        </div>

      </div>

      <div className="drop-text-container">
        <div className="drop-value">
          {percentage.toFixed(0)}%
        </div>
      </div>
    </div>
  );
};

export default HumidityDrop;