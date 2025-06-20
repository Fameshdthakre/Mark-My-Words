

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { StockPricePoint, StockTechnicals } from '../types';
import Card from './shared/Card';

interface PriceChartProps {
  data: StockPricePoint[];
  technicals?: StockTechnicals; // Made optional
  stockName: string;
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-700 p-3 rounded shadow-lg border border-gray-600">
        <p className="label text-sm text-gray-300">{`Date : ${label}`}</p>
        <p className="intro text-emerald-400 font-semibold">{`Price : ₹${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const PriceChart: React.FC<PriceChartProps> = ({ data, technicals, stockName }) => {
  if (!data || data.length === 0) {
    return <Card title="Price Chart"><p>No price data available to display chart.</p></Card>;
  }
  
  // Ensure data is sorted by date if it's not already
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const yDomainMin = Math.min(...sortedData.map(p => p.price), technicals?.supportLevel ?? Infinity, technicals?.sma50 ?? Infinity, technicals?.sma200 ?? Infinity) * 0.98;
  const yDomainMax = Math.max(...sortedData.map(p => p.price), technicals?.resistanceLevel ?? -Infinity, technicals?.sma50 ?? -Infinity, technicals?.sma200 ?? -Infinity) * 1.02;
  
  const yDomain = [
    isFinite(yDomainMin) ? yDomainMin : Math.min(...sortedData.map(p => p.price)) * 0.98,
    isFinite(yDomainMax) ? yDomainMax : Math.max(...sortedData.map(p => p.price)) * 1.02
  ];


  return (
    <Card title={`${stockName} - Price Chart & Key Levels`} className="h-[450px] flex flex-col">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={sortedData} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
            stroke="#9CA3AF"
            padding={{ left: 10, right: 10 }}
            dy={10}
          />
          <YAxis 
            domain={yDomain} 
            tickFormatter={(tick) => `₹${tick.toFixed(0)}`}
            stroke="#9CA3AF"
            dx={-5}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ bottom: 0 }} />
          <Line type="monotone" dataKey="price" stroke="#10B981" strokeWidth={2} dot={false} name="Price" />
          
          {technicals?.sma50 && <ReferenceLine y={technicals.sma50} label={{ value: `SMA50: ${technicals.sma50.toFixed(0)}`, position: 'insideTopRight', fill: '#FBBF24', fontSize: 10 }} stroke="#FBBF24" strokeDasharray="3 3" />}
          {technicals?.sma200 && <ReferenceLine y={technicals.sma200} label={{ value: `SMA200: ${technicals.sma200.toFixed(0)}`, position: 'insideTopRight', fill: '#F59E0B', dy: 15, fontSize: 10 }} stroke="#F59E0B" strokeDasharray="3 3" />}
          {technicals?.supportLevel && <ReferenceLine y={technicals.supportLevel} label={{ value: `Support: ${technicals.supportLevel.toFixed(0)}`, position: 'insideBottomRight', fill: '#34D399', fontSize: 10 }} stroke="#34D399" strokeDasharray="5 5" />}
          {technicals?.resistanceLevel && <ReferenceLine y={technicals.resistanceLevel} label={{ value: `Resistance: ${technicals.resistanceLevel.toFixed(0)}`, position: 'insideTopRight', fill: '#EF4444', dy:30, fontSize: 10 }} stroke="#EF4444" strokeDasharray="5 5" />}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default PriceChart;