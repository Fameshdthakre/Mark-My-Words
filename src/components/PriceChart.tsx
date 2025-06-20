
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { StockPricePoint, StockTechnicals } from '../types';
import Card from './shared/Card';

interface PriceChartProps {
  data: StockPricePoint[];
  technicals?: StockTechnicals; 
  stockName: string;
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    let displayLabel = label;
    // Attempt to format if it's a full ISO string (likely from intraday)
    if (typeof label === 'string' && label.includes('T') && label.includes('Z')) {
        try {
            displayLabel = new Date(label).toLocaleString('en-IN', { 
                year: 'numeric', month: 'short', day: 'numeric', 
                hour: '2-digit', minute: '2-digit', hour12: false 
            });
        } catch (e) { /* Fallback to original label if parsing fails */ }
    } else if (typeof label === 'string' && !isNaN(new Date(label).getTime())) {
        // Handle cases where label is a date string that Date can parse, but not full ISO with T and Z
         try {
            displayLabel = new Date(label).toLocaleDateString('en-IN', { 
                year: 'numeric', month: 'short', day: 'numeric'
            });
        } catch (e) { /* Fallback */ }
    }


    return (
      <div className="bg-gray-700 p-3 rounded shadow-lg border border-gray-600">
        <p className="label text-sm text-gray-300">{`Date : ${displayLabel}`}</p>
        <p className="intro text-emerald-400 font-semibold">{`Price : ₹${payload[0].value.toFixed(2)}`}</p>
      </div>
    );
  }
  return null;
};

const PriceChart: React.FC<PriceChartProps> = ({ data, technicals, stockName }) => {
  if (!data || data.length === 0) {
    return <Card title="Price Chart"><p>No price data available to display chart.</p></Card>;
  }
  
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const prices = sortedData.map(p => p.price);
  let yDomainMin = Math.min(...prices);
  let yDomainMax = Math.max(...prices);

  if (technicals) {
    const technicalValues = [
        technicals.supportLevel, technicals.resistanceLevel,
        technicals.sma50, technicals.sma200
    ].filter(v => typeof v === 'number' && isFinite(v)) as number[];
    
    if (technicalValues.length > 0) {
        yDomainMin = Math.min(yDomainMin, ...technicalValues);
        yDomainMax = Math.max(yDomainMax, ...technicalValues);
    }
  }
  
  const yDomainPaddingFactor = 0.02; // 2% padding
  const yDomain = [
    yDomainMin * (1 - yDomainPaddingFactor),
    yDomainMax * (1 + yDomainPaddingFactor)
  ];


  // Determine if data is intraday based on date string format
  const isIntraday = sortedData.length > 0 && typeof sortedData[0].date === 'string' && sortedData[0].date.includes('T');

  return (
    <Card title={`${stockName} - Price Chart ${technicals ? '& Key Levels' : ''}`} className="h-[450px] flex flex-col">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={sortedData} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(tick) => {
                try {
                    const d = new Date(tick);
                    if (isNaN(d.getTime())) return String(tick); // Fallback for unparsable dates
                    return isIntraday 
                        ? d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
                        : d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
                } catch (e) {
                    return String(tick); // Fallback
                }
            }}
            stroke="#9CA3AF"
            padding={{ left: 10, right: 10 }}
            dy={10}
            interval={isIntraday && sortedData.length > 50 ? Math.floor(sortedData.length / 10) : 'preserveStartEnd'} // Adjust interval for intraday
            minTickGap={isIntraday ? 40 : 10}
          />
          <YAxis 
            domain={yDomain} 
            tickFormatter={(tick) => `₹${tick.toFixed(0)}`}
            stroke="#9CA3AF"
            dx={-5}
            allowDataOverflow={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ bottom: 0 }} />
          <Line type="monotone" dataKey="price" stroke="#10B981" strokeWidth={2} dot={false} name="Price" />
          
          {technicals?.sma50 && isFinite(technicals.sma50) && <ReferenceLine y={technicals.sma50} label={{ value: `SMA50: ${technicals.sma50.toFixed(0)}`, position: 'insideTopRight', fill: '#FBBF24', fontSize: 10 }} stroke="#FBBF24" strokeDasharray="3 3" />}
          {technicals?.sma200 && isFinite(technicals.sma200) && <ReferenceLine y={technicals.sma200} label={{ value: `SMA200: ${technicals.sma200.toFixed(0)}`, position: 'insideTopRight', fill: '#F59E0B', dy: 15, fontSize: 10 }} stroke="#F59E0B" strokeDasharray="3 3" />}
          {technicals?.supportLevel && isFinite(technicals.supportLevel) && <ReferenceLine y={technicals.supportLevel} label={{ value: `Support: ${technicals.supportLevel.toFixed(0)}`, position: 'insideBottomRight', fill: '#34D399', fontSize: 10 }} stroke="#34D399" strokeDasharray="5 5" />}
          {technicals?.resistanceLevel && isFinite(technicals.resistanceLevel) && <ReferenceLine y={technicals.resistanceLevel} label={{ value: `Resistance: ${technicals.resistanceLevel.toFixed(0)}`, position: 'insideTopRight', fill: '#EF4444', dy:30, fontSize: 10 }} stroke="#EF4444" strokeDasharray="5 5" />}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default PriceChart;
