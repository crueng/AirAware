import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface GaugeChartProps {
  value: number;       
  humidity: number;    
  min?: number;       
  max?: number;        
  label: string;       
}

const GaugeChart = ({ value, humidity, min = 0, max = 50, label }: GaugeChartProps) => {
  const data = [
    { value: Math.max(0, value - min) }, 
    { value: Math.max(0, max - value) }  
  ];

  const COLORS = ['#EE6C4D', '#E5E7EB']; 

  return (
    <div className="gauge-wrapper" style={{ width: '100%', height: '250px', position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
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
          >
            {data.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <div style={{
        position: 'absolute',
        top: '65%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        width: '100%'
      }}>
        <div style={{ 
          fontSize: '3.2rem', 
          fontWeight: '700', 
          color: 'var(--navy-900)',
          lineHeight: '1'
        }}>
          {value.toFixed(1)}{label}
        </div>
        
        <div style={{ 
          fontSize: '1.1rem', 
          color: '#6B7280', 
          fontWeight: '500',
          marginTop: '0.5rem'
        }}>
          {humidity.toFixed(0)}% Luftfeuchte
        </div>
      </div>
    </div>
  );
};

export default GaugeChart;