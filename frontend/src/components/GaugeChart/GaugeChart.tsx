import { useState, useEffect } from 'react';
import { PieChart, Pie, ResponsiveContainer } from 'recharts';
import './GaugeChart.css';

interface GaugeChartProps {
  value: number;     
  humidity?: number;   
  min?: number;   
  max?: number;     
  label: string;     
}

const GaugeChart = ({ value, humidity, min = 0, max = 50, label }: GaugeChartProps) => {
  const [showGradient, setShowGradient] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowGradient(true));
    return () => clearTimeout(timer);
  }, []);

  const getOffset = (targetValue: number) => {
    const percentage = ((targetValue - min) / (max - min)) * 100;
    return `${Math.max(0, Math.min(100, percentage))}%`;
  };

  const getColor = (targetColor: string) => {
    return showGradient ? `var(${targetColor})` : 'var(--temp-normal)';
  };

  const data = [
    { value: Math.max(0, value - min), fill: label === '°C' ? 'url(#tempGradient)' : 'var(--primary-color)' }, 
    { value: Math.max(0, max - value), fill: 'var(--navy-100)' } 
  ];

  return (
    <div className="gauge-wrapper">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart className='gauge-pie-chart'>
          <defs>
            <linearGradient 
              id="tempGradient" 
              gradientUnits="userSpaceOnUse" 
              x1="0" y1="0" x2="100%" y2="0"
            >
              <stop offset="0%" style={{ stopColor: getColor('--temp-cold'), transition: 'stop-color 1s ease-in-out' }} />
              <stop offset={getOffset(18)} style={{ stopColor: getColor('--temp-cold'), transition: 'stop-color 1s ease-in-out' }} />
              
              <stop offset={getOffset(22)} style={{ stopColor: getColor('--temp-normal'), transition: 'stop-color 1s ease-in-out' }} />
              <stop offset={getOffset(28)} style={{ stopColor: getColor('--temp-normal'), transition: 'stop-color 1s ease-in-out' }} />
              
              <stop offset={getOffset(30)} style={{ stopColor: getColor('--temp-hot'), transition: 'stop-color 1s ease-in-out' }} />
              <stop offset="100%" style={{ stopColor: getColor('--temp-hot'), transition: 'stop-color 1s ease-in-out' }} />
            </linearGradient>
          </defs>

          <Pie
            data={data}
            cx="50%"         
            cy="80%"           
            startAngle={180}    
            endAngle={0}       
            innerRadius="75%"   
            outerRadius="100%"
            paddingAngle={0}
            dataKey="value"
            stroke="none"
            isAnimationActive={true}
            animationDuration={1500}
            animationEasing="ease-out"
          />
        </PieChart>
      </ResponsiveContainer>

      <div className='gauge-text-container'>
        <div className='gauge-value'>
          {value.toFixed(1)}{label}
        </div>
        
        {humidity !== undefined && (
            <div className='gauge-humidity'>
             {humidity.toFixed(0)}% Luftfeuchtigkeit
         </div>
        )}
      </div>
    </div>
  );
};

export default GaugeChart;