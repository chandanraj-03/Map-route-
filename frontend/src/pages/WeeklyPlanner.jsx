import React, { useState } from 'react';
import axios from 'axios';
import {
  Calendar as CalendarIcon, Clock, MapPin, Truck, AlertCircle,
  Play, Loader2, Brain, Route, ChevronRight, TrendingUp
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const DAY_COLORS = {
  monday:    { bg: 'bg-blue-50',   border: 'border-blue-200',   badge: 'bg-blue-600',   text: 'text-blue-700' },
  tuesday:   { bg: 'bg-violet-50', border: 'border-violet-200', badge: 'bg-violet-600', text: 'text-violet-700' },
  wednesday: { bg: 'bg-emerald-50',border: 'border-emerald-200',badge: 'bg-emerald-600',text: 'text-emerald-700' },
  thursday:  { bg: 'bg-amber-50',  border: 'border-amber-200',  badge: 'bg-amber-600',  text: 'text-amber-700' },
  friday:    { bg: 'bg-rose-50',   border: 'border-rose-200',   badge: 'bg-rose-600',   text: 'text-rose-700' },
};

function WeeklyPlanner() {
  const [driverId, setDriverId]     = useState('D1');
  const [weekInput, setWeekInput]   = useState(() => {
    const now = new Date();
    const jan4 = new Date(now.getFullYear(), 0, 4);
    const week = Math.ceil(((now - jan4) / 86400000 + jan4.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`;
  });
  const [schedule, setSchedule]   = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  // Default store pool for the week
  const defaultLocations = [
    { name: 'Store_1',  lat: 23.023, lng: 72.571 },
    { name: 'Store_2',  lat: 23.035, lng: 72.580 },
    { name: 'Store_3',  lat: 23.027, lng: 72.588 },
    { name: 'Store_4',  lat: 23.122, lng: 72.569 },
    { name: 'Store_5',  lat: 23.100, lng: 72.518 },
    { name: 'Store_6',  lat: 23.115, lng: 72.550 },
    { name: 'Store_7',  lat: 22.996, lng: 72.573 },
    { name: 'Store_8',  lat: 22.906, lng: 72.548 },
    { name: 'Store_9',  lat: 23.172, lng: 72.568 },
    { name: 'Store_10', lat: 22.931, lng: 72.544 },
  ];

  const handleGenerateSchedule = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/predict/weekly`, {
        driver_id: driverId,
        week: weekInput,
        locations: defaultLocations,
      });
      setSchedule(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to generate schedule');
    } finally {
      setLoading(false);
    }
  };

  const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

  return (
    <div className="flex-1 p-8 bg-slate-50 overflow-y-auto text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-blue-600" />
            Weekly Planner
          </h1>
          <p className="text-slate-500">AI-generated 5-day driver route schedule using RF + XGBoost + LSTM</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Driver ID</label>
            <input
              type="text"
              value={driverId}
              onChange={e => setDriverId(e.target.value)}
              className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
              placeholder="D1"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Week</label>
            <input
              type="week"
              value={weekInput}
              onChange={e => setWeekInput(e.target.value.replace('W', 'W'))}
              className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleGenerateSchedule}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
              : <><Play className="w-4 h-4" /> Generate AI Schedule</>
            }
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center gap-3 mb-6 text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Empty State */}
      {!schedule && !loading && !error && (
        <div className="w-full h-64 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <CalendarIcon className="w-12 h-12 text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-600 mb-2">No Schedule Generated Yet</h2>
          <p className="text-slate-400 text-center max-w-md">
            Select a driver and week, then click <strong>Generate AI Schedule</strong> to create an optimized
            5-day delivery plan using the RF + XGBoost + LSTM ensemble.
          </p>
        </div>
      )}

      {/* Weekly Stats Bar */}
      {schedule && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Weekly Distance', value: schedule.weekly_distance, icon: Route, color: 'text-blue-600' },
            { label: 'Weekly Duration', value: schedule.weekly_duration, icon: Clock, color: 'text-violet-600' },
            { label: 'Avg Efficiency', value: `${schedule.weekly_efficiency}%`, icon: TrendingUp, color: 'text-emerald-600' },
            { label: 'Confidence', value: `${Math.round(schedule.weekly_confidence * 100)}%`, icon: Brain, color: 'text-amber-600' },
          ].map(stat => (
            <div key={stat.label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className={`flex items-center gap-2 ${stat.color} mb-2`}>
                <stat.icon className="w-5 h-5" />
                <span className="text-xs font-semibold uppercase tracking-wide">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{stat.value || '—'}</p>
            </div>
          ))}
        </div>
      )}

      {/* LSTM Insight Banner */}
      {schedule?.lstm_weekly_insight && Array.isArray(schedule.lstm_weekly_insight) && schedule.lstm_weekly_insight.length > 0 && (
        <div className="bg-gradient-to-r from-violet-50 to-blue-50 border border-violet-200 rounded-2xl p-5 mb-8 flex gap-4 items-start">
          <Brain className="w-6 h-6 text-violet-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-violet-800 mb-2">🧠 LSTM Sequence Insights</p>
            <ul className="space-y-1">
              {schedule.lstm_weekly_insight.map((insight, i) => (
                <li key={i} className="text-violet-700 text-sm">{insight}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Day Cards Grid */}
      {schedule && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {DAYS.map(day => {
            const stops = schedule[day] || [];
            const colors = DAY_COLORS[day];

            return (
              <div key={day} className={`${colors.bg} border ${colors.border} rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
                {/* Day Header */}
                <div className={`${colors.badge} text-white p-4 flex items-center justify-between`}>
                  <h3 className="font-bold capitalize text-lg">{day}</h3>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                    {stops.length} stops
                  </span>
                </div>

                {/* Stops List */}
                <div className="p-4 flex flex-col gap-2">
                  {stops.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No stops scheduled</p>
                  ) : (
                    stops.map((stop, idx) => (
                      <div key={idx} className="bg-white rounded-xl p-3 border border-white/80 shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold ${colors.text} bg-white border ${colors.border} rounded-full w-5 h-5 flex items-center justify-center shrink-0`}>
                            {idx + 1}
                          </span>
                          <p className="font-semibold text-slate-800 text-xs truncate">{stop.store || stop.name}</p>
                        </div>
                        {stop.eta && (
                          <div className="flex items-center gap-1 text-slate-500">
                            <Clock className="w-3 h-3" />
                            <span className="text-xs">{stop.eta}</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default WeeklyPlanner;
