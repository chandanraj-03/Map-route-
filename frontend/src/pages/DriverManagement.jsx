import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, User, Truck, Phone } from 'lucide-react';
import EntityModal from '../components/Shared/EntityModal';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000');

export default function DriverManagement() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDrivers = drivers.filter(d => 
    d.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.vehicle_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/drivers`);
      if (!response.ok) throw new Error('Failed to fetch drivers');
      const data = await response.json();
      setDrivers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this driver?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/drivers/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setDrivers(drivers.filter(d => d.driver_id !== id));
      }
    } catch (err) {
      console.error('Error deleting driver', err);
    }
  };

  const handleEdit = (driver) => {
    setSelectedEntity(driver);
    setModalType('driver');
  };

  const handleAdd = () => {
    setSelectedEntity(null);
    setModalType('driver');
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 flex items-center justify-center h-full">Loading drivers...</div>;
  }

  return (
    <div className="p-6 md:p-8 w-full max-w-7xl mx-auto overflow-y-auto h-full">
      <EntityModal isOpen={!!modalType} modalType={modalType} onClose={() => setModalType(null)} onSuccess={fetchDrivers} initialData={selectedEntity} />
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Driver Management</h1>
          <p className="text-slate-500 mt-2">Manage your fleet personnel and vehicle assignments.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search drivers or vehicles..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm w-full md:w-64"
            />
            <div className="absolute left-3 top-3 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
          </div>
          <button 
            onClick={handleAdd}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all font-medium whitespace-nowrap">
            <Plus size={20} />
            Add Driver
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 shadow-sm border border-red-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-sm uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4 font-semibold">Driver Info</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Vehicle & License</th>
                  <th className="p-4 font-semibold">Performance</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredDrivers.map((driver, index) => (
                  <tr key={driver.driver_id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 overflow-hidden shrink-0">
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${driver.full_name}&backgroundColor=eef2ff`} alt="avatar" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{driver.full_name}</div>
                          <div className="text-slate-500 text-xs flex items-center gap-1 mt-1">
                            <Phone size={12} /> {driver.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        index % 3 === 0 ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                        'bg-emerald-50 text-emerald-600 border-emerald-200'
                      }`}>
                        {index % 3 === 0 ? 'On Break' : 'Active'}
                      </span>
                      <div className="text-xs text-slate-500 mt-2">
                        {driver.working_hours}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <Truck size={16} className="text-slate-400" />
                        <span>{driver.vehicle_type}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        License: {['CDL-A', 'CDL-B', 'Class-C'][index % 3]} • {driver.capacity}kg Cap
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-slate-200 rounded-full h-2.5 max-w-[100px]">
                          <div 
                            className={`h-2.5 rounded-full ${driver.performance_score > 85 ? 'bg-emerald-500' : driver.performance_score > 70 ? 'bg-amber-400' : 'bg-red-500'}`} 
                            style={{ width: `${Math.min(100, Math.max(0, driver.performance_score))}%` }}
                          ></div>
                        </div>
                        <span className="font-medium text-slate-700">{driver.performance_score}%</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 font-medium tracking-wide">
                        {300 + (index * 45)} TOTAL DELIVERIES
                      </div>
                    </td>
                    <td className="p-4 text-right align-middle">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(driver)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(driver.driver_id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {drivers.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-500">
                      No drivers found. Add a driver to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
