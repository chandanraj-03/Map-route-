import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, Clock, Star } from 'lucide-react';
import EntityModal from '../components/Shared/EntityModal';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000');

export default function StoreManagement() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStores = stores.filter(s => 
    s.store_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchStores = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/stores`);
      if (!response.ok) throw new Error('Failed to fetch stores');
      const data = await response.json();
      setStores(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this store?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/stores/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setStores(stores.filter(s => s.store_id !== id));
      }
    } catch (err) {
      console.error('Error deleting store', err);
    }
  };

  const handleEdit = (store) => {
    setSelectedEntity(store);
    setModalType('store');
  };

  const handleAdd = () => {
    setSelectedEntity(null);
    setModalType('store');
  };

  return (
    <div className="p-6 md:p-8 w-full max-w-7xl mx-auto overflow-y-auto h-full">
      <EntityModal isOpen={!!modalType} modalType={modalType} onClose={() => setModalType(null)} onSuccess={fetchStores} initialData={selectedEntity} />
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Store Management</h1>
          <p className="text-slate-500 mt-2">Manage delivery locations, priorities, and time windows.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search stores or addresses..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm w-full md:w-64"
            />
            <div className="absolute left-3 top-3 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
          </div>
          <button 
            onClick={handleAdd}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all font-medium whitespace-nowrap">
            <Plus size={20} />
            Add Store
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-sm uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4 font-semibold">Store Details</th>
                  <th className="p-4 font-semibold">Status & Contact</th>
                  <th className="p-4 font-semibold">Operations</th>
                  <th className="p-4 font-semibold">Priority</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredStores.map((store, index) => {
                  const isOpen = index % 4 !== 0; // Mock status
                  const contactNames = ['Sarah Jenkins', 'Mike Ross', 'Elena Gilbert', 'David Chen'];
                  return (
                  <tr key={store.store_id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                          <MapPin size={20} />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{store.store_name}</div>
                          <div className="text-slate-500 text-xs mt-1 w-48 truncate" title={store.address}>
                            {store.address}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {isOpen ? 'Open Now' : 'Closed'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 font-medium">
                        {contactNames[index % 4]}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        (555) 01{index.toString().padStart(2, '0')}-{99 - index}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                        <Clock size={16} className="text-slate-400" />
                        <span>{store.delivery_window}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Unload: {store.average_unload_time} mins
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={16} 
                            fill={i < store.priority_level ? "currentColor" : "none"} 
                            className={i < store.priority_level ? "" : "text-slate-200"}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(store)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(store.store_id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  )
                })}
                
                {stores.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-500">
                      No stores found. Add a store to get started.
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
