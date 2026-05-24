import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Truck, Navigation, TrendingUp, AlertCircle, Loader2, Plus, Store, X, MapPin } from 'lucide-react';
import DashboardStatCard from '../components/Dashboard/DashboardStatCard';
import RouteMapPlaceholder from '../components/Dashboard/RouteMapPlaceholder';
import UpcomingDeliveries from '../components/Dashboard/UpcomingDeliveries';
import EntityModal from '../components/Shared/EntityModal';

function Dashboard() {
  const [data, setData] = useState({
    active_routes: 0,
    active_drivers: 0,
    alerts: 0,
    avg_efficiency: 0,
    fuel_savings: 0
  });
  const [username, setUsername] = useState('Admin');
  const navigate = useNavigate();
  const [modalType, setModalType] = useState(null); // 'driver', 'store', or null
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem('username');
    if (user) setUsername(user);

    const fetchData = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/data/dashboard`);
        setData(response.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    
    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 p-8 overflow-y-auto w-full relative z-10 text-slate-800">
      <EntityModal isOpen={!!modalType} modalType={modalType} onClose={() => setModalType(null)} />

      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back, {username}</h1>
          <p className="text-slate-500 font-medium text-sm">Here is your live routing intelligence overview.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setModalType('driver')} className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Truck className="w-4 h-4" />
            Add Driver
          </button>
          <button onClick={() => setModalType('store')} className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Store className="w-4 h-4" />
            Add Store
          </button>
          <button onClick={() => navigate('/route')} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Create Route
          </button>
        </div>
      </header>

      {/* Daily Progress */}
      <div className="mb-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between gap-6">
        <div className="w-full">
          <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
            <span>Daily Delivery Progress</span>
            <span className="text-emerald-600">68% Completed</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3">
            <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-3 rounded-full relative" style={{ width: '68%' }}>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-emerald-500 rounded-full shadow"></div>
            </div>
          </div>
          <div className="flex justify-between text-xs font-medium text-slate-400 mt-2">
            <span>08:00 AM</span>
            <span>1,245 / 1,830 Stops</span>
            <span>08:00 PM</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="w-full h-32 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DashboardStatCard 
            title="Total Routes Optimized" 
            value={data.active_routes.toString()} 
            icon={<Navigation className="w-5 h-5 text-blue-600" />} 
            trend="+12% vs last week"
            trendPositive={true}
          />
          <DashboardStatCard 
            title="Active Drivers" 
            value={data.active_drivers.toString()} 
            icon={<Truck className="w-5 h-5 text-emerald-600" />} 
            trend="Live"
            trendPositive={true}
          />
          <DashboardStatCard 
            title="Avg. ML Efficiency" 
            value={`${data.avg_efficiency}%`} 
            icon={<TrendingUp className="w-5 h-5 text-purple-600" />} 
            trend="+4.2% optimized"
            trendPositive={true}
          />
          <DashboardStatCard 
            title="Est. Fuel Savings" 
            value={`$${(data.fuel_savings || 1245).toLocaleString()}`} 
            icon={<TrendingUp className="w-5 h-5 text-emerald-500" />} 
            trend="+15% this month"
            trendPositive={true}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold mb-4">Live Optimization Feed</h2>
            <RouteMapPlaceholder />
          </div>
        </div>
        <div className="lg:col-span-1 flex flex-col gap-8">
          <UpcomingDeliveries />
          
          {/* Recent System Alerts */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Recent Alerts
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-semibold text-amber-900">Heavy Traffic Detected</p>
                  <p className="text-xs text-amber-700 mt-1">Route D1 delayed by ~15 mins. AI recalculating.</p>
                  <span className="text-[10px] text-amber-600 mt-2 block font-medium">10 mins ago</span>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-semibold text-blue-900">New Driver Registered</p>
                  <p className="text-xs text-blue-700 mt-1">Driver 'John D.' is ready for auto-assignment.</p>
                  <span className="text-[10px] text-blue-600 mt-2 block font-medium">1 hour ago</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Fleet Activity */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
              <Navigation className="w-5 h-5 text-blue-500" />
              Live Fleet Activity
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0 ring-4 ring-emerald-50"></div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 w-full">
                  <div className="flex justify-between mb-1">
                    <span className="font-bold text-sm text-slate-800">D1 - John D.</span>
                    <span className="text-xs font-medium text-emerald-600">Just now</span>
                  </div>
                  <p className="text-xs text-slate-500">Completed drop-off at <span className="font-medium text-slate-700">124 Main St.</span></p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0 ring-4 ring-amber-50"></div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 w-full">
                  <div className="flex justify-between mb-1">
                    <span className="font-bold text-sm text-slate-800">D3 - Mike R.</span>
                    <span className="text-xs font-medium text-amber-600">2 min ago</span>
                  </div>
                  <p className="text-xs text-slate-500">Stuck in traffic on <span className="font-medium text-slate-700">I-95 North</span></p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0 ring-4 ring-blue-50"></div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 w-full">
                  <div className="flex justify-between mb-1">
                    <span className="font-bold text-sm text-slate-800">D2 - Sarah J.</span>
                    <span className="text-xs font-medium text-slate-400">5 min ago</span>
                  </div>
                  <p className="text-xs text-slate-500">Started new route block <span className="font-medium text-slate-700">#RT-884</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
