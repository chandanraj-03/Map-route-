import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, TrendingUp, TrendingDown, AlertTriangle, Loader2 } from 'lucide-react';

function MetricCard({ title, value, type, threshold = 0.85 }) {
  const isGood = type === 'accuracy' ? value >= threshold : value <= threshold;
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="text-sm text-slate-500 font-medium mb-1">{title}</div>
      <div className="flex items-center gap-2">
        <span className="text-3xl font-bold text-slate-800">
          {type === 'accuracy' ? `${(value * 100).toFixed(1)}%` : value.toFixed(3)}
        </span>
        {isGood ? 
          <TrendingUp className="w-5 h-5 text-emerald-500" /> : 
          <TrendingDown className="w-5 h-5 text-red-500" />
        }
      </div>
      {!isGood && (
        <div className="text-xs text-red-500 mt-2 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> Drift detected
        </div>
      )}
    </div>
  );
}

export default function ModelMonitoring() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/analytics/models`);
        setMetrics(response.data);
      } catch (err) {
        console.error("Failed to fetch model metrics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto w-full text-slate-800">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
          <Activity className="w-8 h-8 text-purple-600" />
          Model Monitoring
        </h1>
        <p className="text-slate-500 font-medium text-sm">Real-time performance metrics and drift detection for routing models.</p>
      </header>

      <h2 className="text-xl font-bold mb-4">Random Forest (Travel Time)</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard title="Accuracy" value={metrics?.random_forest?.accuracy} type="accuracy" threshold={0.88} />
        <MetricCard title="Mean Squared Error" value={metrics?.random_forest?.mse} type="error" threshold={0.06} />
        <MetricCard title="Drift Score" value={metrics?.random_forest?.drift_score} type="error" threshold={0.05} />
      </div>

      <h2 className="text-xl font-bold mb-4">XGBoost (Traffic ETA)</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard title="Accuracy" value={metrics?.xgboost?.accuracy} type="accuracy" threshold={0.90} />
        <MetricCard title="Mean Squared Error" value={metrics?.xgboost?.mse} type="error" threshold={0.05} />
        <MetricCard title="Drift Score" value={metrics?.xgboost?.drift_score} type="error" threshold={0.05} />
      </div>

      <h2 className="text-xl font-bold mb-4">LSTM (Sequence Predictor)</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard title="Accuracy" value={metrics?.lstm?.accuracy} type="accuracy" threshold={0.80} />
        <MetricCard title="Mean Squared Error" value={metrics?.lstm?.mse} type="error" threshold={0.1} />
        <MetricCard title="Drift Score" value={metrics?.lstm?.drift_score} type="error" threshold={0.05} />
      </div>
    </div>
  );
}
