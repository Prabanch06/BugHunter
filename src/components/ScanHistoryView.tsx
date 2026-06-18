import React, { useEffect, useState } from 'react';
import { Search, Filter, History, ArrowUpDown, ChevronRight, Download, GitCompare, X } from 'lucide-react';
import type { ScanHistory } from '../types';

export function ScanHistoryView() {
  const [history, setHistory] = useState<ScanHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<keyof ScanHistory>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScans, setSelectedScans] = useState<string[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  useEffect(() => {
    fetch('/api/history')
      .then(res => res.json())
      .then(data => {
        setHistory(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleSort = (field: keyof ScanHistory) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedScans(prev => {
      if (prev.includes(id)) {
        return prev.filter(scanId => scanId !== id);
      }
      return [...prev, id];
    });
  };

  const toggleSelectAll = () => {
    if (selectedScans.length === filteredAndSortedHistory.length) {
      setSelectedScans([]);
    } else {
      setSelectedScans(filteredAndSortedHistory.map(scan => scan.id));
    }
  };

  const handleBulkDownload = () => {
    // In a real app we'd fetch actual reports here.
    // We just download a combined CSV of the summary
    let csv = 'Project,Language,Date,Score,Vulnerabilities,Bugs\n';
    
    selectedScans.forEach(id => {
      const scan = history.find(s => s.id === id);
      if (scan) {
        csv += `${scan.project},${scan.language},${new Date(scan.date).toLocaleDateString()},${scan.score},${scan.vulnerabilities},${scan.bugs}\n`;
      }
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk_reports_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredAndSortedHistory = [...history]
    .filter(scan => 
      scan.project.toLowerCase().includes(searchTerm.toLowerCase()) || 
      scan.language.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const SortIcon = () => <ArrowUpDown className="w-3 h-3 ml-1 text-slate-400 inline-block" />;

  const scan1 = history.find(s => s.id === selectedScans[0]);
  const scan2 = history.find(s => s.id === selectedScans[1]);

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Scan History</h1>
          <p className="text-slate-500 text-sm">Review past analysis runs and track code quality improvements.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50">
          <div className="relative w-full sm:max-w-md">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text" 
              placeholder="Search projects or languages..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm text-slate-700" 
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {selectedScans.length > 0 ? (
              <div className="flex items-center gap-2 mr-auto bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                <span className="text-sm font-medium text-blue-700">{selectedScans.length} selected</span>
                <div className="h-4 w-px bg-blue-200 mx-1"></div>
                <button 
                  onClick={handleBulkDownload}
                  className="text-blue-700 hover:text-blue-800 text-sm font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-4 h-4" /> Download All
                </button>
              </div>
            ) : null}
            <button 
              disabled={selectedScans.length !== 2}
              onClick={() => setIsComparing(true)}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center gap-2"
            >
              <GitCompare className="w-4 h-4" /> Compare (2)
            </button>
            <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-white">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold sticky top-0 shadow-sm z-10">
                <tr>
                  <th className="px-4 py-4 w-12 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedScans.length > 0 && selectedScans.length === filteredAndSortedHistory.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('project')}>
                    Project <SortIcon />
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('language')}>
                    Language <SortIcon />
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('date')}>
                    Date <SortIcon />
                  </th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('score')}>
                    Score <SortIcon />
                  </th>
                  <th className="px-6 py-4">Issues</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAndSortedHistory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                      No matching scans found.
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedHistory.map((scan) => (
                    <tr key={scan.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-4 py-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={selectedScans.includes(scan.id)}
                          onChange={() => toggleSelect(scan.id)}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{scan.project}</td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-medium">
                          {scan.language}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{new Date(scan.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-max">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          Complete
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`font-bold ${scan.score >= 80 ? 'text-green-600' : scan.score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                            {scan.score}
                          </div>
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full hidden sm:block">
                            <div 
                              className={`h-full rounded-full ${scan.score >= 80 ? 'bg-green-500' : scan.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} 
                              style={{ width: `${scan.score}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {scan.vulnerabilities > 0 && (
                            <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded text-xs font-bold border border-red-100">
                              {scan.vulnerabilities} Vuln
                            </span>
                          )}
                          {scan.bugs > 0 && (
                            <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-xs font-semibold border border-amber-100">
                              {scan.bugs} Bugs
                            </span>
                          )}
                          {scan.bugs === 0 && scan.vulnerabilities === 0 && (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          View Report <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Comparison Modal */}
      {isComparing && scan1 && scan2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-slate-50 w-full max-w-4xl max-h-[90vh] rounded-xl shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
            <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-blue-600" /> Compare Analyses
              </h2>
              <button 
                onClick={() => setIsComparing(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div></div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
                  <span className="text-xs font-bold uppercase text-slate-400 mb-1 tracking-wider">Scan 1</span>
                  <span className="font-bold text-slate-800">{scan1.project}</span>
                  <span className="text-sm text-slate-500">{new Date(scan1.date).toLocaleDateString()}</span>
                  <span className="mt-2 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{scan1.language}</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
                  <span className="text-xs font-bold uppercase text-slate-400 mb-1 tracking-wider">Scan 2</span>
                  <span className="font-bold text-slate-800">{scan2.project}</span>
                  <span className="text-sm text-slate-500">{new Date(scan2.date).toLocaleDateString()}</span>
                  <span className="mt-2 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{scan2.language}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Metrics Comparison</h3>
                
                <div className="grid grid-cols-3 gap-6 items-center py-3 border-b border-slate-100 bg-white px-4 rounded-lg shadow-sm">
                  <span className="font-medium text-slate-600 text-sm">Overall Score</span>
                  <div className={`text-center font-bold text-lg ${scan1.score >= 80 ? 'text-green-600' : scan1.score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{scan1.score}</div>
                  <div className={`text-center font-bold text-lg ${scan2.score >= 80 ? 'text-green-600' : scan2.score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{scan2.score}</div>
                </div>

                <div className="grid grid-cols-3 gap-6 items-center py-3 border-b border-slate-100 bg-white px-4 rounded-lg shadow-sm">
                  <span className="font-medium text-slate-600 text-sm">Vulnerabilities</span>
                  <div className="text-center font-bold text-lg">
                    {scan1.vulnerabilities > 0 ? (
                      <span className="text-red-600">{scan1.vulnerabilities}</span>
                    ) : (
                      <span className="text-green-600">0</span>
                    )}
                  </div>
                  <div className="text-center font-bold text-lg">
                    {scan2.vulnerabilities > 0 ? (
                      <span className="text-red-600">{scan2.vulnerabilities}</span>
                    ) : (
                      <span className="text-green-600">0</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 items-center py-3 border-b border-slate-100 bg-white px-4 rounded-lg shadow-sm">
                  <span className="font-medium text-slate-600 text-sm">Bugs Detected</span>
                  <div className="text-center font-bold text-lg">
                     {scan1.bugs > 0 ? (
                      <span className="text-amber-600">{scan1.bugs}</span>
                    ) : (
                      <span className="text-green-600">0</span>
                    )}
                  </div>
                  <div className="text-center font-bold text-lg">
                    {scan2.bugs > 0 ? (
                      <span className="text-amber-600">{scan2.bugs}</span>
                    ) : (
                      <span className="text-green-600">0</span>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
