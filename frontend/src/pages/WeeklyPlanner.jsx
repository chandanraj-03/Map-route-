import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar as CalendarIcon, Clock, MapPin, Truck, AlertCircle } from 'lucide-react';

function WeeklyPlanner() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/data/weekly`);
        setSchedule(response.data);
      } catch (err) {
        console.error("Error fetching weekly data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  return (
    <div className="flex-1 p-8 bg-slate-50 overflow-y-auto text-slate-800">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-blue-600" />
            Weekly Planner
          </h1>
          <p className="text-slate-500">Automated 7-day driver and route allocations</p>
        </div>
        <button className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-500 transition-colors">
          Export Schedule
        </button>
      </div>

      {loading ? (
        <div className="w-full h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : schedule.length === 0 ? (
        <div className="w-full h-64 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-600 mb-2">No Routes Scheduled</h2>
          <p className="text-slate-400">Head over to the Live Route page to optimize and save a new route.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {schedule.map((slot, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-slate-100 border-b border-slate-200 p-4 text-center">
                <h3 className="font-bold text-slate-800 text-lg">{slot.day}</h3>
                <p className="text-slate-500 text-xs">{slot.date}</p>
              </div>
              <div className="p-5 flex flex-col gap-4">
                <div className="flex items-center gap-3 bg-blue-50 text-blue-700 p-3 rounded-xl border border-blue-100">
                  <Truck className="w-5 h-5 shrink-0" />
                  <span className="font-semibold text-sm break-all">Driver: {slot.driver}</span>
                </div>
                
                <div className="flex items-center gap-3 text-slate-600">
                  <MapPin className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span className="font-medium text-sm">{slot.stops} Optimized Stops</span>
                </div>

                <div className="flex items-center gap-3 text-slate-600">
                  <Clock className="w-5 h-5 text-orange-500 shrink-0" />
                  <span className="font-medium text-sm">Total ETA: {slot.eta}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default WeeklyPlanner;
