import React from 'react';
import { Navigation, Activity, X, Truck, Store, User, Sparkles } from 'lucide-react';
import MetricsCard from '../Dashboard/MetricsCard';
import StoreSearchAutocomplete from './StoreSearchAutocomplete';
import MLExecutionLogs from './MLExecutionLogs';

function RouteSidebar({ 
  selectedDriver, 
  setSelectedDriver, 
  selectedDate, 
  setSelectedDate, 
  locations, 
  setLocations,
  handlePredict, 
  loading, 
  prediction,
  setEntityModalType
}) {

  const handleAddLocation = (loc) => {
    setLocations([...locations, loc]);
  };

  const handleRemoveLocation = (index) => {
    const newLocs = [...locations];
    newLocs.splice(index, 1);
    setLocations(newLocs);
  };

  return (
    <aside className="w-[400px] flex-shrink-0 bg-white border-r border-slate-200 shadow-xl z-10 flex flex-col">
      <div className="p-6 bg-white border-b border-slate-200 text-slate-800">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Navigation className="w-6 h-6 text-blue-600" />
          Route Platform
        </h1>
        <p className="text-sm text-slate-500 mt-1 mb-4">Enterprise Logistics Platform</p>
        <div className="flex gap-2">
          <button onClick={() => setEntityModalType('driver')} className="flex-1 flex justify-center items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-slate-200">
            <Truck className="w-4 h-4" />
            Add Driver
          </button>
          <button onClick={() => setEntityModalType('store')} className="flex-1 flex justify-center items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-slate-200">
            <Store className="w-4 h-4" />
            Add Store
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700">Driver</label>
            <select 
              className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
              value={selectedDriver}
              onChange={e => setSelectedDriver(e.target.value)}
            >
              <option value="" className="font-bold text-indigo-600">✨ Auto-Assign (Best Match)</option>
              <option value="D1">Driver 1 (Expert)</option>
              <option value="D2">Driver 2 (Intermediate)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700">Date</label>
            <input 
              type="date" 
              className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3 text-slate-700 flex justify-between items-center">
            <span>Route Stops</span>
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">{locations.length}</span>
          </h3>
          
          <StoreSearchAutocomplete onAddLocation={handleAddLocation} />

          <div className="space-y-2 mt-2">
            {locations.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">No stops added. Search above to add stops.</p>
            )}
            {locations.map((loc, idx) => (
              <div key={idx} className="group flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 transition-colors hover:border-blue-200">
                <div className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-slate-800 truncate">{loc.name}</p>
                  <p className="text-xs text-slate-500 truncate">{loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}</p>
                </div>
                <button 
                  onClick={() => handleRemoveLocation(idx)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all rounded-full hover:bg-red-50"
                  title="Remove stop"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={handlePredict}
          disabled={loading || locations.length < 2}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Activity className="w-5 h-5" />
              Optimize Route
            </>
          )}
        </button>

        {prediction && prediction.assignment && (
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-4 shadow-sm">
            <h4 className="font-semibold text-indigo-900 flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              Auto-Assigned Driver
            </h4>
            <div className="space-y-2 text-sm text-indigo-800">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 opacity-70" />
                <span className="font-medium">{prediction.assignment.driver.full_name}</span>
                <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs ml-auto">Score: {prediction.assignment.match_score}</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 opacity-70" />
                <span>{prediction.assignment.driver.vehicle_type} (Cap: {prediction.assignment.driver.capacity}kg)</span>
              </div>
              <p className="text-xs text-indigo-600 mt-3 pt-2 border-t border-indigo-100 italic leading-relaxed">
                "{prediction.assignment.reason}"
              </p>
            </div>
          </div>
        )}

        {prediction && prediction.execution_logs && <MLExecutionLogs logs={prediction.execution_logs} />}

        {prediction && <MetricsCard prediction={prediction} />}
      </div>
    </aside>
  );
}

export default RouteSidebar;
