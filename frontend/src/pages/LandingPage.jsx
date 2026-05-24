import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, Zap, TrendingUp, ShieldCheck, ArrowRight, Truck } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="fixed w-full z-50 top-0 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Map className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">Route Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/login')} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Sign In
            </button>
            <button onClick={() => navigate('/login')} className="text-sm font-semibold bg-slate-900 text-white px-5 py-2.5 rounded-full hover:bg-slate-800 transition-colors shadow-sm">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-slate-50 to-slate-50"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 text-xs font-semibold tracking-wide uppercase mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Enterprise Fleet Optimization
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
            Routing Intelligence <br className="hidden md:block"/> for the Modern Fleet.
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Harness the power of Random Forest, XGBoost, and K-Means clustering to optimize your logistics, cut fuel costs by up to 15%, and deliver faster with live traffic-aware routing.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => navigate('/login')} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40">
              Start Optimizing
              <ArrowRight className="w-5 h-5" />
            </button>

          </div>
        </div>
      </section>

      {/* Statistics Banner */}
      <section className="bg-blue-600 text-white py-16 relative z-10 shadow-inner">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-blue-500/50">
          <div>
            <div className="text-4xl md:text-5xl font-black mb-2 tracking-tight">1M+</div>
            <div className="text-blue-100 font-medium">Routes Optimized</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-black mb-2 tracking-tight">15%</div>
            <div className="text-blue-100 font-medium">Avg Fuel Saved</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-black mb-2 tracking-tight">99.9%</div>
            <div className="text-blue-100 font-medium">System Uptime</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-black mb-2 tracking-tight">5k+</div>
            <div className="text-blue-100 font-medium">Active Drivers</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white border-y border-slate-200 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Enterprise-Grade Features</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Built for scale, speed, and real-world logistics challenges.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<Zap className="w-6 h-6 text-yellow-400" />}
              title="Multi-Driver Fleet Dispatch"
              description="Automatically partition locations across your entire fleet based on capacity, shift times, and geography using K-Means."
            />
            <FeatureCard 
              icon={<Map className="w-6 h-6 text-emerald-400" />}
              title="Dynamic Geofencing"
              description="Draw custom delivery zones directly on the map. Receive instant alerts if a driver breaches their assigned territory."
            />
            <FeatureCard 
              icon={<TrendingUp className="w-6 h-6 text-purple-400" />}
              title="Advanced ML Predictions"
              description="Hybrid ML architecture utilizing Random Forest and XGBoost for ultra-accurate, traffic-aware ETAs."
            />
            <FeatureCard 
              icon={<Truck className="w-6 h-6 text-blue-400" />}
              title="Capacity Optimization"
              description="Assign routes that perfectly match each vehicle's volume and weight constraints to maximize delivery efficiency."
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-6 h-6 text-red-400" />}
              title="System Audit & Monitoring"
              description="Track every dispatch action and monitor your ML model's accuracy and drift in real-time."
            />
            <FeatureCard 
              icon={<Map className="w-6 h-6 text-orange-400" />}
              title="Live Google Maps Integration"
              description="True road-based polyline routing, traffic overlays, and interactive map planning just like Google Maps."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-slate-50 border-b border-slate-200 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-slate-500 max-w-xl mx-auto">From messy spreadsheets to perfectly orchestrated fleets in seconds.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-200 z-0"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-4 border-slate-50 shadow-xl mb-6 text-2xl font-black text-blue-600 group-hover:scale-110 transition-transform">1</div>
              <h3 className="text-xl font-bold mb-3 text-slate-800">Connect Your Fleet</h3>
              <p className="text-slate-600 leading-relaxed">Import your drivers, vehicles, and their unique constraints like capacity and shift times.</p>
            </div>
            
            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center border-4 border-blue-100 shadow-xl mb-6 text-2xl font-black text-white group-hover:scale-110 transition-transform">2</div>
              <h3 className="text-xl font-bold mb-3 text-slate-800">Run The Optimizer</h3>
              <p className="text-slate-600 leading-relaxed">Our ML models instantly divide stops and calculate the most efficient paths across the network.</p>
            </div>
            
            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-4 border-slate-50 shadow-xl mb-6 text-2xl font-black text-emerald-600 group-hover:scale-110 transition-transform">3</div>
              <h3 className="text-xl font-bold mb-3 text-slate-800">Dispatch & Monitor</h3>
              <p className="text-slate-600 leading-relaxed">Push routes directly to driver apps and monitor live progress through dynamic dashboards.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-100 py-12 text-center text-slate-500 border-t border-slate-200 relative z-10">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Map className="w-5 h-5 text-slate-500" />
          <span className="font-bold text-slate-700 tracking-tight">Route Platform</span>
        </div>
        <p className="text-sm">© {new Date().getFullYear()} Route Logistics Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 hover:bg-slate-100 transition-colors group">
      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-200 mb-4 group-hover:scale-110 transition-transform shadow-sm">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
