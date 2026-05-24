import React, { useState } from 'react';
import axios from 'axios';
import RouteSidebar from '../components/Sidebar/RouteSidebar';
import GoogleMapContainer from '../components/Map/GoogleMapContainer';
import ConstraintModal from '../components/Sidebar/ConstraintModal';
import EntityModal from '../components/Shared/EntityModal';
import MultiDriverKanban from '../components/Sidebar/MultiDriverKanban';

function RoutePlanner() {
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [locations, setLocations] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entityModalType, setEntityModalType] = useState(null);
  const [isFleetMode, setIsFleetMode] = useState(false);

  // Map clicks are intentionally disabled to enforce searching via database

  const openConstraintsModal = () => {
    setIsModalOpen(true);
  };

  const handlePredict = async (constraints) => {
    setLoading(true);
    setIsModalOpen(false);
    try {
      const endpoint = selectedDriver ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/predict/daily` : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/predict/auto-assign`;
      
      const payload = selectedDriver ? {
        driver_id: selectedDriver,
        date: selectedDate || new Date().toISOString().split('T')[0],
        locations: locations,
        constraints: constraints
      } : {
        date: selectedDate || new Date().toISOString().split('T')[0],
        locations: locations,
        constraints: constraints
      };

      const response = await axios.post(endpoint, payload);
      if (response.data.error) {
        alert(`Prediction Error: ${response.data.error}`);
        setPrediction(null);
      } else {
        setPrediction(response.data);
      }
    } catch (error) {
      console.error('Prediction failed', error);
      alert(`Prediction failed: ${error.response?.data?.detail || error.message}`);
      setPrediction(null);
    }
    setLoading(false);
  };

  const handlePredictFleet = async () => {
    setLoading(true);
    try {
      const payload = {
        date: selectedDate || new Date().toISOString().split('T')[0],
        driver_ids: ['D1', 'D2'], // Mocking selected drivers for now
        locations: locations
      };
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/predict/fleet`, payload);
      if (response.data.error) {
        alert(`Fleet Optimizer Error: ${response.data.error}`);
      } else {
        setPrediction(response.data);
      }
    } catch (error) {
      console.error('Fleet prediction failed', error);
      alert('Fleet prediction failed');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-1 w-full h-full relative overflow-hidden">
      {!isFleetMode && (
        <div className="absolute top-6 left-[424px] z-20">
          <button 
            onClick={() => setIsFleetMode(true)}
            className="flex items-center gap-2 bg-white border border-slate-200 px-5 py-2.5 rounded-xl shadow-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all hover:shadow-xl"
          >
            Enter Fleet Mode
          </button>
        </div>
      )}

      {!isFleetMode ? (
        <RouteSidebar 
          selectedDriver={selectedDriver}
          setSelectedDriver={setSelectedDriver}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          locations={locations}
          setLocations={setLocations}
          handlePredict={openConstraintsModal}
          loading={loading}
          prediction={prediction}
          setEntityModalType={setEntityModalType}
        />
      ) : (
        <MultiDriverKanban 
          locations={locations}
          prediction={prediction}
          setPrediction={setPrediction}
          handlePredictFleet={handlePredictFleet}
          setIsFleetMode={setIsFleetMode}
        />
      )}
      
      {!isFleetMode && <GoogleMapContainer locations={locations} prediction={prediction} />}
      
      {isModalOpen && (
        <ConstraintModal 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={handlePredict} 
        />
      )}
      <EntityModal isOpen={!!entityModalType} modalType={entityModalType} onClose={() => setEntityModalType(null)} />
    </div>
  );
}

export default RoutePlanner;
