import React, { useState, useEffect } from 'react';
import { X, MapPin, Loader2 } from 'lucide-react';
import { Map, AdvancedMarker } from '@vis.gl/react-google-maps';

function EntityModal({ isOpen, modalType, onClose, onSuccess, initialData }) {
  const [driverForm, setDriverForm] = useState({ name: '', phone: '', vehicle: 'Van', capacity: '', fuelEfficiency: '', workHours: '08:00 - 16:00', performance: 100 });
  const [storeForm, setStoreForm] = useState({ name: '', address: '', lat: '', lng: '', timeWindow: '09:00-17:00', unloadTime: 15, priority: 3 });
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && initialData) {
      if (modalType === 'driver') {
        setDriverForm({
          name: initialData.full_name || '',
          phone: initialData.phone || '',
          vehicle: initialData.vehicle_type || 'Van',
          capacity: initialData.capacity || '',
          fuelEfficiency: initialData.fuel_efficiency || '',
          workHours: initialData.working_hours || '08:00 - 16:00',
          performance: initialData.performance_score || 100
        });
      } else if (modalType === 'store') {
        setStoreForm({
          name: initialData.store_name || '',
          address: initialData.address || '',
          lat: initialData.latitude || '',
          lng: initialData.longitude || '',
          timeWindow: initialData.delivery_window || '09:00-17:00',
          unloadTime: initialData.average_unload_time || 15,
          priority: initialData.priority_level || 3
        });
      }
    } else if (isOpen && !initialData) {
      setDriverForm({ name: '', phone: '', vehicle: 'Van', capacity: '', fuelEfficiency: '', workHours: '08:00 - 16:00', performance: 100 });
      setStoreForm({ name: '', address: '', lat: '', lng: '', timeWindow: '09:00-17:00', unloadTime: 15, priority: 3 });
    }
  }, [isOpen, initialData, modalType]);

  if (!isOpen || !modalType) return null;

  const handleMapClick = async (lat, lng) => {
    setStoreForm(prev => ({ ...prev, lat, lng }));
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (apiKey && apiKey !== 'AIzaSy_mock_key_for_build') {
        const googleRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`);
        const googleData = await googleRes.json();
        if (googleData.status === 'OK' && googleData.results.length > 0) {
          setStoreForm(prev => ({ ...prev, address: googleData.results[0].formatted_address }));
          return;
        }
      }
      
      const nomRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const nomData = await nomRes.json();
      if (nomData && nomData.display_name) {
        setStoreForm(prev => ({ ...prev, address: nomData.display_name }));
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
    }
  };

  const handleGeocode = async () => {
    if (!storeForm.address) return;
    setIsGeocoding(true);
    try {
      // 1. Try Nominatim First
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(storeForm.address)}`);
      const data = await res.json();
      
      if (data && data.length > 0) {
        setStoreForm(prev => ({ ...prev, lat: data[0].lat, lng: data[0].lon }));
        return;
      }
      
      // 2. Fallback to Google Maps API
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (apiKey && apiKey !== 'AIzaSy_mock_key_for_build') {
        const googleRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(storeForm.address)}&key=${apiKey}`);
        const googleData = await googleRes.json();
        
        if (googleData.status === 'OK' && googleData.results.length > 0) {
          const location = googleData.results[0].geometry.location;
          setStoreForm(prev => ({ ...prev, lat: location.lat, lng: location.lng }));
          return;
        }
      }
      
      alert("Could not find coordinates for this address. Please try a different address, include the city/country, or enter manually.");
    } catch (err) {
      console.error(err);
      alert("Error geocoding address.");
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (modalType === 'driver') {
        const payload = {
          driver_id: initialData ? initialData.driver_id : `DRV-${Math.floor(Math.random() * 10000)}`,
          full_name: driverForm.name || 'New Driver',
          phone: driverForm.phone || '+1 555-0000',
          vehicle_type: driverForm.vehicle || 'Van',
          capacity: parseInt(driverForm.capacity) || (driverForm.vehicle === 'Truck' ? 2000 : 500),
          average_speed: 45.0,
          fuel_efficiency: parseFloat(driverForm.fuelEfficiency) || 12.5,
          working_hours: driverForm.workHours || '08:00 - 16:00',
          performance_score: parseFloat(driverForm.performance) || 100.0
        };
        const method = initialData ? 'PUT' : 'POST';
        const url = initialData ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/drivers/${initialData.driver_id}` : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/drivers/`;
        const res = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(`Failed to ${initialData ? 'update' : 'create'} driver`);
      } else if (modalType === 'store') {
        const payload = {
          store_id: initialData ? initialData.store_id : `STR-${Math.floor(Math.random() * 10000)}`,
          store_name: storeForm.name || 'New Store',
          address: storeForm.address || 'Unknown Address',
          latitude: parseFloat(storeForm.lat) || 0.0,
          longitude: parseFloat(storeForm.lng) || 0.0,
          delivery_window: storeForm.timeWindow || '09:00-17:00',
          average_unload_time: parseInt(storeForm.unloadTime) || 15,
          priority_level: parseInt(storeForm.priority) || 3
        };
        const method = initialData ? 'PUT' : 'POST';
        const url = initialData ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/stores/${initialData.store_id}` : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/stores/`;
        const res = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(`Failed to ${initialData ? 'update' : 'create'} store`);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to save. Check console.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className={`bg-white p-6 rounded-2xl shadow-xl w-full animate-in fade-in zoom-in duration-200 ${modalType === 'store' ? 'max-w-4xl' : 'max-w-md'}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">
            {modalType === 'driver' ? (initialData ? 'Edit Driver' : 'Add New Driver') : (initialData ? 'Edit Store' : 'Add New Store')}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          {modalType === 'driver' ? 'Enter driver details below to register them in the system.' : 'Enter the new store location details.'}
        </p>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {modalType === 'driver' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input type="text" value={driverForm.name} onChange={e => setDriverForm({...driverForm, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input type="text" value={driverForm.phone} onChange={e => setDriverForm({...driverForm, phone: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. +1 555-0100" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Type</label>
                  <select value={driverForm.vehicle} onChange={e => setDriverForm({...driverForm, vehicle: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Van</option>
                    <option>Truck</option>
                    <option>Motorcycle</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Capacity (kg)</label>
                  <input type="number" value={driverForm.capacity} onChange={e => setDriverForm({...driverForm, capacity: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fuel Efficiency (mpg)</label>
                  <input type="number" step="0.1" value={driverForm.fuelEfficiency} onChange={e => setDriverForm({...driverForm, fuelEfficiency: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 15.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Performance Score</label>
                  <input type="number" value={driverForm.performance} onChange={e => setDriverForm({...driverForm, performance: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 100" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Shift / Working Hours</label>
                <input type="text" value={driverForm.workHours} onChange={e => setDriverForm({...driverForm, workHours: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 08:00 - 16:00" />
              </div>
            </>
          )}
          {modalType === 'store' && (
            <div className="flex flex-col md:flex-row gap-6 h-[400px]">
              <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Store Name</label>
                  <input type="text" value={storeForm.name} onChange={e => setStoreForm({...storeForm, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter store name..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                  <div className="flex gap-2">
                    <input type="text" value={storeForm.address} onChange={e => setStoreForm({...storeForm, address: e.target.value})} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter full address..." />
                    <button onClick={handleGeocode} disabled={isGeocoding} className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-200 transition-colors flex items-center justify-center min-w-[40px]" title="Convert address to coordinates">
                      {isGeocoding ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
                    <input type="number" step="any" value={storeForm.lat} onChange={e => setStoreForm({...storeForm, lat: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" placeholder="e.g. 34.0522" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
                    <input type="number" step="any" value={storeForm.lng} onChange={e => setStoreForm({...storeForm, lng: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" placeholder="e.g. -118.2437" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Time Window</label>
                    <input type="text" value={storeForm.timeWindow} onChange={e => setStoreForm({...storeForm, timeWindow: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 09:00-17:00" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Priority (1-5)</label>
                    <input type="number" min="1" max="5" value={storeForm.priority} onChange={e => setStoreForm({...storeForm, priority: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 3" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Average Unload Time (mins)</label>
                  <input type="number" value={storeForm.unloadTime} onChange={e => setStoreForm({...storeForm, unloadTime: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 15" />
                </div>
              </div>
              <div className="flex-1 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative min-h-[300px]">
                <Map
                  onClick={(e) => handleMapClick(e.detail.latLng.lat, e.detail.latLng.lng)}
                  defaultCenter={{ lat: 30.3165, lng: 78.0322 }}
                  defaultZoom={12}
                  gestureHandling={'greedy'}
                  disableDefaultUI={true}
                  mapId="MINI_STORE_MAP_ID"
                >
                  {(storeForm.lat && storeForm.lng) && (
                    <AdvancedMarker position={{ lat: parseFloat(storeForm.lat), lng: parseFloat(storeForm.lng) }}>
                      <div className="bg-red-500 text-white w-8 h-8 rounded-full shadow-lg border-2 border-white flex items-center justify-center transform -translate-y-1/2">
                        <MapPin size={16} />
                      </div>
                    </AdvancedMarker>
                  )}
                </Map>
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-sm border border-slate-200 text-xs text-slate-600 text-center pointer-events-none">
                  Click map to drop pin and auto-fill address
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2">
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />} Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default EntityModal;
