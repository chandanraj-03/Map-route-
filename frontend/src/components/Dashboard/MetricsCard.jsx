import React from 'react';
import { BarChart3 } from 'lucide-react';

function MetricsCard({ prediction }) {
  return (
    <div className="mt-8 p-5 bg-white border border-slate-200 rounded-2xl shadow-xl text-slate-800">
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-blue-600" />
        Optimization Result
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
          <p className="text-slate-500 text-xs font-medium mb-1">Total Distance</p>
          <p className="text-lg font-bold">{prediction.total_distance}</p>
        </div>
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
          <p className="text-slate-500 text-xs font-medium mb-1">Est. Time</p>
          <p className="text-lg font-bold text-emerald-600">{prediction.predicted_time}</p>
        </div>
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
          <p className="text-slate-500 text-xs font-medium mb-1">Efficiency Score</p>
          <p className="text-lg font-bold text-blue-600">{prediction.efficiency_score}/100</p>
        </div>
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
          <p className="text-slate-500 text-xs font-medium mb-1">Model Confidence</p>
          <p className="text-lg font-bold">{(prediction.confidence * 100).toFixed(0)}%</p>
        </div>
      </div>
    </div>
  );
}

export default MetricsCard;
