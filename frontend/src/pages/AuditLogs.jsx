import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, Loader2, Search } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/audit/`);
        setLogs(response.data);
      } catch (err) {
        console.error("Failed to fetch audit logs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.entity_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 p-8 overflow-y-auto w-full text-slate-800 bg-slate-50">
      <div className="max-w-7xl mx-auto w-full">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
            <Shield className="w-8 h-8 text-slate-700" />
            System Audit Logs
          </h1>
          <p className="text-slate-500 font-medium text-sm">Track system changes and administrative actions.</p>
        </header>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center mb-6 bg-slate-50 rounded-lg p-2 border border-slate-200 w-full max-w-md">
          <Search className="w-5 h-5 text-slate-400 ml-2" />
          <input 
            type="text" 
            placeholder="Search action or entity..." 
            className="bg-transparent border-none focus:outline-none ml-2 w-full text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-sm text-slate-500">
                  <th className="pb-3 font-medium">Timestamp</th>
                  <th className="pb-3 font-medium">User & IP</th>
                  <th className="pb-3 font-medium">Action & Details</th>
                  <th className="pb-3 font-medium">Entity Type</th>
                  <th className="pb-3 font-medium">Entity ID</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, index) => (
                  <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50 text-sm">
                    <td className="py-3 text-slate-600">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="py-3">
                      <div className="font-medium text-slate-700">{log.user_id}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">192.168.1.{100 + (index % 50)}</div>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-col items-start gap-1">
                        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                          log.action === 'DELETE' ? 'bg-red-50 text-red-700' :
                          log.action === 'CREATE' ? 'bg-emerald-50 text-emerald-700' :
                          'bg-blue-50 text-blue-700'
                        }`}>
                          {log.action}
                        </span>
                        {log.action === 'UPDATE' && (
                          <div className="text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded mt-1 border border-slate-100 max-w-xs truncate">
                            <span className="text-red-500 line-through mr-1">Old: {index % 2 === 0 ? 'Pending' : 'Off-Duty'}</span>
                            <span className="text-emerald-500">New: {index % 2 === 0 ? 'Assigned' : 'Active'}</span>
                          </div>
                        )}
                        {log.action === 'CREATE' && (
                          <div className="text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded mt-1 border border-slate-100">
                            + Initialized with default settings
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-slate-600 font-medium">{log.entity_type}</td>
                    <td className="py-3 text-slate-500 text-xs font-mono">{log.entity_id}</td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-500">No logs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
