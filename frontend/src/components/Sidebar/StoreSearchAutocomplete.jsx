import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import axios from 'axios';

function StoreSearchAutocomplete({ onAddLocation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [allStores, setAllStores] = useState([]);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    // Fetch all stores from database on mount
    const fetchStores = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/stores/`);
        setAllStores(res.data);
      } catch (error) {
        console.error("Error fetching stores", error);
      }
    };
    fetchStores();
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      return;
    }
    
    const lowerQuery = query.toLowerCase();
    const filtered = allStores.filter(store => {
      const name = store.store_name || '';
      const address = store.address || '';
      return name.toLowerCase().includes(lowerQuery) || address.toLowerCase().includes(lowerQuery);
    });
    
    setResults(filtered.slice(0, 5));
    setIsOpen(true);
  }, [query, allStores]);

  const handleSelect = (store) => {
    onAddLocation({
      name: store.store_name,
      lat: store.latitude,
      lng: store.longitude
    });
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative mb-4">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="w-4 h-4 text-slate-400" />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        placeholder="Search for stores..."
        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-700 bg-white shadow-sm"
      />
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
          {results.map((store, idx) => (
            <div 
              key={idx} 
              onClick={() => handleSelect(store)}
              className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0"
            >
              <p className="text-sm font-semibold text-slate-800 truncate">{store.store_name}</p>
              <p className="text-xs text-slate-500 truncate">{store.address}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StoreSearchAutocomplete;
