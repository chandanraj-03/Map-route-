import React, { useState } from 'react';
import { X, Settings2 } from 'lucide-react';

function ConstraintModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    traffic_congestion: 'Moderate',
    work_shift: 'Morning',
    peak_traffic_hours: false,
    max_daily_distance: 150,
    delivery_priority: 'Standard',
    time_window: 'Flexible',
    road_condition: 'Clear',
    driver_familiarity: 'High',
    driver_working_hours: 8,
    driver_break_hours: 1,
    driver_shift_hours: 9,
    driver_fatigue: 'Low'
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Parse numbers properly
    const submissionData = {
      ...formData,
      max_daily_distance: Number(formData.max_daily_distance),
      driver_working_hours: Number(formData.driver_working_hours),
      driver_break_hours: Number(formData.driver_break_hours),
      driver_shift_hours: Number(formData.driver_shift_hours),
    };
    onSubmit(submissionData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
              <Settings2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Optimization Constraints</h2>
              <p className="text-sm text-slate-500">Configure parameters for the routing engine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Traffic & Environment */}
            <div className="space-y-4 col-span-1 md:col-span-2 lg:col-span-3 border-b pb-4 mb-2 border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Environment & Delivery Rules</h3>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-slate-700">Traffic Congestion</label>
              <select name="traffic_congestion" value={formData.traffic_congestion} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Low">Low</option>
                <option value="Moderate">Moderate</option>
                <option value="High">High</option>
                <option value="Extreme">Extreme</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-slate-700">Road Conditions</label>
              <select name="road_condition" value={formData.road_condition} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Clear">Clear</option>
                <option value="Construction">Construction</option>
                <option value="Weather Disruptions">Weather Disruptions</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-slate-700">Delivery Priorities</label>
              <select name="delivery_priority" value={formData.delivery_priority} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Standard">Standard</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-slate-700">Time Windows</label>
              <select name="time_window" value={formData.time_window} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Flexible">Flexible</option>
                <option value="Strict">Strict</option>
              </select>
            </div>

            <div className="flex items-center gap-3 mt-8">
              <input type="checkbox" name="peak_traffic_hours" id="peak_traffic_hours" checked={formData.peak_traffic_hours} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
              <label htmlFor="peak_traffic_hours" className="text-sm font-semibold text-slate-700 cursor-pointer">Operating in Peak Traffic Hours</label>
            </div>

            {/* Driver Profile */}
            <div className="space-y-4 col-span-1 md:col-span-2 lg:col-span-3 border-b pb-4 mt-4 border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Driver Constraints</h3>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-slate-700">Work Shift</label>
              <select name="work_shift" value={formData.work_shift} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Night">Night</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-slate-700">Driver Familiarity</label>
              <select name="driver_familiarity" value={formData.driver_familiarity} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-slate-700">Driver Fatigue Level</label>
              <select name="driver_fatigue" value={formData.driver_fatigue} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Low">Low</option>
                <option value="Moderate">Moderate</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-slate-700">Max Daily Distance (km)</label>
              <input type="number" name="max_daily_distance" value={formData.max_daily_distance} onChange={handleChange} min="10" max="1000" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-slate-700">Working Hours</label>
              <input type="number" name="driver_working_hours" value={formData.driver_working_hours} onChange={handleChange} min="1" max="14" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-slate-700">Break Hours</label>
              <input type="number" name="driver_break_hours" value={formData.driver_break_hours} onChange={handleChange} min="0" max="5" step="0.5" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-slate-700">Shift Length (Hours)</label>
              <input type="number" name="driver_shift_hours" value={formData.driver_shift_hours} onChange={handleChange} min="1" max="16" className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

          </div>

          <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95">
              Apply & Predict
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ConstraintModal;
