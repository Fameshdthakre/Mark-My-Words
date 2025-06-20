
import React from 'react';
import { SwingStrategy } from '../types';
import Card from './shared/Card';
import { DISCLAIMER_AI_SUGGESTIONS } from '../constants';

interface StrategyInsightsProps {
  strategies: SwingStrategy[];
}

const StrategyInsights: React.FC<StrategyInsightsProps> = ({ strategies }) => {
   if (!strategies || strategies.length === 0) {
    return <Card title="AI Swing Strategy Insights"><p>No strategies available at the moment.</p></Card>;
  }
  return (
    <Card title="AI Swing Strategy Insights">
      <div className="space-y-5 max-h-96 overflow-y-auto pr-2">
        {strategies.map((strategy, index) => (
          <div key={index} className="p-4 bg-gray-700 rounded-lg shadow">
            <h4 className="text-lg font-semibold text-emerald-300 mb-2">{strategy.strategyTitle || `Strategy ${index + 1}`}</h4>
            <p className="text-sm text-gray-300 mb-1"><strong className="text-gray-400">Entry:</strong> {strategy.entryCondition}</p>
            <p className="text-sm text-gray-300 mb-1"><strong className="text-gray-400">Target:</strong> {strategy.targetPrice}</p>
            <p className="text-sm text-gray-300 mb-1"><strong className="text-gray-400">Stop-Loss:</strong> {strategy.stopLoss}</p>
            <p className="text-sm text-gray-400 mt-2"><em><strong className="text-gray-500">Risk Note:</strong> {strategy.riskAssessment}</em></p>
          </div>
        ))}
      </div>
       <p className="text-xs text-gray-500 mt-4">
        {DISCLAIMER_AI_SUGGESTIONS}
      </p>
    </Card>
  );
};

export default StrategyInsights;
