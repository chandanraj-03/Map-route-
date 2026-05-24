import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, Calendar, User, TrendingUp, Truck, Store, Activity, Shield } from 'lucide-react';

function Navbar() {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Live Route', path: '/route', icon: <Map className="w-5 h-5" /> },
    { name: 'Weekly Planner', path: '/weekly', icon: <Calendar className="w-5 h-5" /> },
    { name: 'Drivers', path: '/drivers', icon: <Truck className="w-5 h-5" /> },
    { name: 'Stores', path: '/stores', icon: <Store className="w-5 h-5" /> },
    { name: 'Performance', path: '/performance', icon: <User className="w-5 h-5" /> },
    { name: 'Analytics', path: '/analytics', icon: <TrendingUp className="w-5 h-5" /> },
    { name: 'ML Models', path: '/models', icon: <Activity className="w-5 h-5" /> },
    { name: 'Audit', path: '/audit', icon: <Shield className="w-5 h-5" /> },
  ];

  return (
    <nav className="w-full h-20 bg-white border-b border-slate-200 flex items-center px-8 z-50 shadow-sm shrink-0">
      <div className="flex items-center gap-3 mr-12">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Map className="w-6 h-6 text-white" />
        </div>
        <span className="text-slate-800 font-bold text-xl tracking-tight hidden md:block">Route Platform</span>
      </div>

      <div className="flex items-center gap-2 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-semibold'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`
            }
          >
            {item.icon}
            <span className="text-sm">{item.name}</span>
          </NavLink>
        ))}
      </div>

      <div className="ml-auto hidden lg:flex items-center gap-4">
        <div className="bg-slate-100 rounded-xl px-4 py-2 border border-slate-200 flex items-center gap-3">
          <p className="text-xs text-slate-500">Google API</p>
          <div className="w-24 bg-slate-200 rounded-full h-2">
            <div className="bg-emerald-400 h-2 rounded-full w-[45%]"></div>
          </div>
        </div>
        <button 
          onClick={() => { localStorage.removeItem('auth_token'); window.location.href='/login'; }}
          className="text-slate-500 hover:text-red-500 transition-colors text-sm font-semibold"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
