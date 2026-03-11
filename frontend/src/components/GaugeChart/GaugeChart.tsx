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
  const getDynamicColor = (currentValue: number) => {
    if (label !== '°C') return 'var(--primary-color)';

    if (currentValue < 20) return 'var(--temp-cold)';       
    if (currentValue >= 20 && currentValue <= 30) return 'var(--temp-normal)';
    return 'var(--temp-hot)';                               
  };

  const activeColor = getDynamicColor(value);

  const COLORS = [activeColor, 'var(--navy-100)'];

  const data = [
    { value: Math.max(0, value - min), fill: COLORS[0] }, 
    { value: Math.max(0, max - value), fill: COLORS[1] } 
  ];

  return (
    <div className="gauge-wrapper">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart className='gauge-pie-chart'>
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