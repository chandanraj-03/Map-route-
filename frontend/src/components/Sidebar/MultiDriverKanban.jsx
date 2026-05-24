import React, { useState } from 'react';
import { Truck, MapPin, GripVertical } from 'lucide-react';

export default function MultiDriverKanban({ locations, prediction, setPrediction, handlePredictFleet, setIsFleetMode }) {
  // A simplified UI to represent drag-and-drop lanes for multiple drivers
  
  const renderDriverLane = (driverId, driverName, assignedLocations) => (
    <div key={driverId} className="bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[200px] flex-1">
      <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
        <Truck className="w-5 h-5 text-blue-600" />
        <span className="font-bold text-slate-800">{driverName}</span>
      </div>
      
      <div className="space-y-3">
        {assignedLocations.map((loc, idx) => (
          <div key={idx} className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm flex items-center gap-3 cursor-grab active:cursor-grabbing hover:border-blue-300">
            <GripVertical className="w-4 h-4 text-slate-400" />
            <div>
              <div className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-red-500" /> {loc.name}
              </div>
              {loc.eta && <div className="text-xs text-slate-500 mt-1">ETA: {loc.eta}</div>}
            </div>
          </div>
        ))}
        {assignedLocations.length === 0 && (
          <div className="text-sm text-slate-400 text-center py-4 border-2 border-dashed border-slate-200 rounded-lg">
            Drag locations here
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full h-full bg-white flex flex-col absolute inset-0 z-10 p-6 overflow-hidden">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Fleet Optimization & Dispatch</h2>
          <p className="text-sm text-slate-500">Drag and drop stops between drivers to dynamically recalculate routes.</p>
        </div>
        <div className="flex gap-3 items-center">
          <button 
            onClick={() => setIsFleetMode(false)}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-6 py-2 rounded-xl font-semibold shadow-sm transition-colors"
          >
            Exit Fleet Mode
          </button>
          <button 
            onClick={handlePredictFleet}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-semibold shadow-sm transition-colors"
          >
            Run Fleet Optimizer
          </button>
        </div>
      </header>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        {prediction?.fleet_routes ? (
          prediction.fleet_routes.map((route, i) => 
            renderDriverLane(
              route.driver?.driver_id || `temp-${i}`, 
              route.driver?.full_name || `Driver ${i+1}`, 
              route.optimized_path || []
            )
          )
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-4">
            <Truck className="w-16 h-16 opacity-20" />
            <p>Select multiple drivers and run the optimizer to generate the Kanban board.</p>
          </div>
        )}
      </div>
    </div>
  );
}
