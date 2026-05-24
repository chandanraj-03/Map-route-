import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Clock, CheckCircle2 } from 'lucide-react';

function UpcomingDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We fetch from the same /data/weekly endpoint to show an upcoming preview
    const fetchUpcoming = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/data/weekly`);
        setDeliveries(response.data.slice(0, 4)); // Only show top 4
      } catch (err) {
        console.error("Error fetching upcoming deliveries", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUpcoming();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 h-full flex flex-col">
        <h2 className="text-lg font-bold mb-4">Upcoming Routes</h2>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Upcoming Routes</h2>
        <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">Live</span>
      </div>
      
      {deliveries.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3" />
          <p className="text-slate-500 font-medium text-sm">No pending routes for today.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {deliveries.map((delivery, i) => (
            <div key={i} className="flex items-start gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors">
              <div className="bg-slate-100 p-2.5 rounded-xl shrink-0">
                <Package className="w-5 h-5 text-slate-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-sm truncate">Driver: {delivery.driver}</p>
                <div className="flex items-center gap-1 mt-1 text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs">{delivery.eta} via {delivery.stops} stops</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UpcomingDeliveries;
