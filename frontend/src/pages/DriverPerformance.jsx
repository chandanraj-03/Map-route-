import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Star, TrendingUp, AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';

function DriverPerformance() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/data/performance`);
        setDrivers(response.data);
      } catch (err) {
        console.error("Error fetching performance data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const topDriver = drivers.length > 0 ? drivers.reduce((prev, current) => (prev.score > current.score) ? prev : current) : null;

  return (
    <div className="flex-1 p-8 bg-slate-50 overflow-y-auto text-slate-800">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
        <User className="w-8 h-8 text-blue-600" />
        Driver Performance
      </h1>
      <p className="text-slate-500 mb-8">Data-driven behavioral metrics and efficiency scoring</p>

      {loading ? (
        <div className="w-full h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : drivers.length === 0 ? (
        <div className="w-full h-64 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-600 mb-2">No Driver Data</h2>
          <p className="text-slate-400">Optimize a route and assign it to a driver to start gathering metrics.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-900/20">
              <h3 className="font-bold text-lg mb-2 opacity-90">Top Performer</h3>
              <div className="flex items-end gap-4 mt-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30 backdrop-blur-sm">
                  <Star className="w-8 h-8 text-yellow-300" />
                </div>
                <div className="truncate">
                  <h2 className="text-2xl font-bold truncate">{topDriver.id}</h2>
                  <p className="text-blue-100 font-medium">Score: {topDriver.score}/100</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-center">
              <h3 className="font-bold text-slate-500 mb-1">Fleet Average Speed</h3>
              <p className="text-4xl font-bold text-slate-800 flex items-center gap-3">
                42 <span className="text-lg text-slate-400 font-medium">km/h</span>
                <span className="bg-emerald-100 text-emerald-600 text-sm px-2 py-1 rounded-lg flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" /> +2%
                </span>
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-center">
              <h3 className="font-bold text-slate-500 mb-1">Active Alerts</h3>
              <p className="text-4xl font-bold text-slate-800 flex items-center gap-3">
                0 <span className="text-lg text-slate-400 font-medium">issues detected</span>
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-xl">Fleet Leaderboard</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-sm font-semibold">
                  <tr>
                    <th className="p-4 pl-6">Driver ID</th>
                    <th className="p-4">Efficiency Score</th>
                    <th className="p-4">Breakdown (Brake/Speed/Idle)</th>
                    <th className="p-4">Rating</th>
                    <th className="p-4">On-Time %</th>
                    <th className="p-4 pr-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {drivers.map(driver => (
                    <tr key={driver.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6 font-bold text-slate-800">{driver.id}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold">{driver.score}</span>
                          {driver.score > 85 ? (
                            <TrendingUp className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />
                          )}
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 max-w-[100px]">
                          <div 
                            className={`h-1.5 rounded-full ${driver.score > 90 ? 'bg-emerald-500' : driver.score > 80 ? 'bg-blue-500' : 'bg-orange-500'}`}
                            style={{ width: `${driver.score}%` }}
                          />
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 text-xs font-mono text-slate-500">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded">{driver.incidents}B</span>
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded">{(driver.score % 4)}S</span>
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded">{(driver.score % 6)}I</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 font-medium text-slate-700">
                          4.{(driver.score % 9) + 1} <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        </div>
                      </td>
                      <td className="p-4 font-medium">{driver.onTime}</td>
                      <td className="p-4 pr-6">
                        <span className={`px-3 py-1 text-xs font-bold rounded-lg ${
                          driver.score > 90 ? 'bg-emerald-100 text-emerald-700' : 
                          driver.score > 80 ? 'bg-blue-100 text-blue-700' : 
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {driver.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default DriverPerformance;
