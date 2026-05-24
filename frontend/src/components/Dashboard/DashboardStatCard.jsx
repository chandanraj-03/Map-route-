import React from 'react';

function DashboardStatCard({ title, value, icon, trend, trendPositive }) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col justify-center transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
          {icon}
        </div>
        <h3 className="font-bold text-slate-500">{title}</h3>
      </div>
      <div className="flex items-end justify-between mt-2">
        <div>
          <p className="text-3xl font-bold text-slate-800">{value}</p>
          <div className="mt-3 flex items-end gap-[3px] h-6 opacity-80">
            {[30, 45, 40, 60, 50, 75, 65, 85, 80, 100].map((h, i) => (
              <div 
                key={i} 
                className={`w-1.5 rounded-t-sm ${trendPositive ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                style={{ height: `${h}%` }}
              ></div>
            ))}
          </div>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-lg flex items-center gap-1 mb-8 ${
          trendPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
        }`}>
          {trend}
        </span>
      </div>
    </div>
  );
}

export default DashboardStatCard;
