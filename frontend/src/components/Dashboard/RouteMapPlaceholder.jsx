import React from 'react';
import { Map } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function RouteMapPlaceholder() {
  const navigate = useNavigate();

  return (
    <div className="w-full h-[400px] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-6 text-center group cursor-pointer transition-colors hover:bg-slate-100 hover:border-blue-300" onClick={() => navigate('/route')}>
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <Map className="w-8 h-8 text-blue-600" />
      </div>
      <h3 className="font-bold text-slate-700 text-lg mb-2">Live Route Optimization</h3>
      <p className="text-slate-500 text-sm max-w-sm mb-6">
        Head over to the Live Route map to generate an optimized schedule and automatically push it to the dashboards.
      </p>
      <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-xl shadow-lg shadow-blue-500/30 transition-colors">
        Optimize New Route
      </button>
    </div>
  );
}

export default RouteMapPlaceholder;
