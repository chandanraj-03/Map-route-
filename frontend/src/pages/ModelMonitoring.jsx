import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, TrendingUp, TrendingDown, AlertTriangle, Loader2, Brain, RefreshCw, Zap } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function MetricCard({ title, value, type, threshold = 0.85 }) {
  if (value === undefined || value === null) return null;
  const isGood = type === 'accuracy' ? value >= threshold : value <= threshold;
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="text-sm text-slate-500 font-medium mb-1">{title}</div>
      <div className="flex items-center gap-2">
        <span className="text-3xl font-bold text-slate-800">
          {type === 'accuracy' ? `${(value * 100).toFixed(1)}%` : value.toFixed(3)}
        </span>
        {isGood
          ? <TrendingUp className="w-5 h-5 text-emerald-500" />
          : <TrendingDown className="w-5 h-5 text-red-500" />
        }
      </div>
      {!isGood && (
        <div className="text-xs text-red-500 mt-2 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> Drift detected — consider retraining
        </div>
      )}
    </div>
  );
}

function LSTMDemoPanel() {
  const [locations, setLocations] = useState('Store_1, Store_9, Store_3, Store_15');
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  const parseLocations = () => {
    return locations.split(',').map((s, i) => ({
      name: s.trim(),
      lat: 23.02 + i * 0.015,
      lng: 72.57 + i * 0.012
    })).filter(l => l.name);
  };

  const runPrediction = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const locs = parseLocations();
      const response = await axios.post(`${API_URL}/predict/daily`, {
        driver_id: 'D1',
        date: new Date().toISOString().split('T')[0],
        locations: locs
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-violet-50 to-blue-50 border border-violet-200 rounded-2xl p-6 mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-violet-900 text-lg">🧠 LSTM Live Demo — Next-Stop Prediction</h3>
          <p className="text-violet-600 text-sm">Enter a sequence of store names to get the LSTM's next-stop suggestion</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={locations}
          onChange={e => setLocations(e.target.value)}
          placeholder="Store_1, Store_9, Store_3, Store_15"
          className="flex-1 border border-violet-200 bg-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <button
          onClick={runPrediction}
          disabled={loading}
          className="flex items-center gap-2 bg-violet-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-violet-500 transition-all disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          Run LSTM
        </button>
      </div>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-3 mb-3">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-white rounded-xl border border-violet-200 p-5 space-y-4">
          {/* LSTM next-stop */}
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-violet-600 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">LSTM Next-Stop Suggestion</p>
              <p className="font-bold text-violet-700 text-lg">
                {result.ml_models_used?.lstm_next_stop_suggestion
                  ? result.ml_models_used.lstm_next_stop_suggestion
                  : result.ml_models_used?.lstm
                    ? '⚠️ LSTM trained but no matching location IDs found in sequence'
                    : '⚠️ LSTM model not yet trained — run POST /retrain'}
              </p>
            </div>
          </div>

          {/* Optimized Route */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Optimized Route Sequence</p>
            <div className="flex flex-wrap gap-2">
              {result.recommended_route?.map((stop, i) => (
                <div key={i} className="flex items-center gap-1 bg-violet-50 border border-violet-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-violet-700">
                  <span className="text-violet-400 text-xs">#{i + 1}</span>
                  {stop.store}
                  <span className="text-violet-400 text-xs ml-1">{stop.eta}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ML Models Used */}
          <div className="grid grid-cols-4 gap-2">
            {Object.entries({
              'Random Forest': result.ml_models_used?.random_forest,
              'XGBoost': result.ml_models_used?.xgboost,
              'LSTM': result.ml_models_used?.lstm,
              'Google Traffic': result.ml_models_used?.google_maps_traffic
            }).map(([name, active]) => (
              <div key={name} className={`text-center rounded-lg p-2 border text-xs font-semibold
                ${active ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                {active ? '✓' : '○'} {name}
              </div>
            ))}
          </div>

          {/* Execution Logs */}
          {result.execution_logs?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Execution Trace</p>
              <div className="bg-slate-900 rounded-xl p-4 max-h-48 overflow-y-auto font-mono space-y-1">
                {result.execution_logs.map((log, i) => (
                  <p key={i} className={`text-xs ${
                    log.includes('[LSTM]') ? 'text-violet-400' :
                    log.includes('[ML') ? 'text-blue-400' :
                    log.includes('[GOOGLE]') ? 'text-yellow-400' :
                    log.includes('[OPT]') ? 'text-emerald-400' :
                    log.includes('[CACHE]') ? 'text-orange-400' :
                    'text-slate-400'
                  }`}>{log}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ModelMonitoring() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/analytics/models`);
      setMetrics(response.data);
    } catch (err) {
      console.error("Failed to fetch model metrics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMetrics(); }, []);

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto w-full text-slate-800">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
            <Activity className="w-8 h-8 text-purple-600" />
            Model Monitoring
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            Live performance metrics and drift detection for all 4 AI routing models.
          </p>
        </div>
        <button onClick={fetchMetrics} className="flex items-center gap-2 text-slate-600 border border-slate-200 rounded-xl px-4 py-2.5 hover:bg-slate-50 transition-all text-sm font-semibold">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </header>

      {/* LSTM Live Demo */}
      <LSTMDemoPanel />

      {/* RF Metrics */}
      <h2 className="text-xl font-bold mb-4">🌲 Random Forest — Travel Time + Efficiency (Multi-Output)</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard title="Accuracy" value={metrics?.random_forest?.accuracy} type="accuracy" threshold={0.88} />
        <MetricCard title="Mean Squared Error" value={metrics?.random_forest?.mse} type="error" threshold={0.06} />
        <MetricCard title="Drift Score" value={metrics?.random_forest?.drift_score} type="error" threshold={0.05} />
      </div>

      {/* XGBoost Metrics */}
      <h2 className="text-xl font-bold mb-4">⚡ XGBoost — Traffic-Aware ETA Prediction</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard title="Accuracy" value={metrics?.xgboost?.accuracy} type="accuracy" threshold={0.90} />
        <MetricCard title="Mean Squared Error" value={metrics?.xgboost?.mse} type="error" threshold={0.05} />
        <MetricCard title="Drift Score" value={metrics?.xgboost?.drift_score} type="error" threshold={0.05} />
      </div>

      {/* LSTM Metrics */}
      <h2 className="text-xl font-bold mb-4">🧠 LSTM — Next-Stop Sequence Predictor</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard title="Accuracy" value={metrics?.lstm?.accuracy} type="accuracy" threshold={0.80} />
        <MetricCard title="Mean Squared Error" value={metrics?.lstm?.mse} type="error" threshold={0.1} />
        <MetricCard title="Drift Score" value={metrics?.lstm?.drift_score} type="error" threshold={0.05} />
      </div>

      {/* Accuracy History */}
      {metrics?.history?.length > 0 && (
        <>
          <h2 className="text-xl font-bold mb-4">📈 Accuracy Trend (Last 6 Days)</h2>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 font-semibold border-b border-slate-100">
                  <th className="text-left py-2 pr-6">Date</th>
                  <th className="text-center py-2 pr-6">🌲 RF</th>
                  <th className="text-center py-2 pr-6">⚡ XGBoost</th>
                  <th className="text-center py-2">🧠 LSTM</th>
                </tr>
              </thead>
              <tbody>
                {metrics.history.map((row, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 pr-6 font-medium">{row.date}</td>
                    <td className="text-center py-2.5 pr-6 font-semibold text-blue-600">{(row.rf_acc * 100).toFixed(1)}%</td>
                    <td className="text-center py-2.5 pr-6 font-semibold text-violet-600">{(row.xgb_acc * 100).toFixed(1)}%</td>
                    <td className="text-center py-2.5 font-semibold text-emerald-600">{(row.lstm_acc * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
