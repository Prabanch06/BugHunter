import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Code, UploadCloud, Shield, CheckCircle2, AlertTriangle, Bug as BugIcon, Zap, Loader2, ArrowLeft, Download, FileText, MessageSquare, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import type { AnalysisResponse } from '../types';

export function CodeAnalyzer() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('Python');
  const [isAutoDetected, setIsAutoDetected] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'bugs' | 'security' | 'optimizations'>('overview');

  const handleAnalyze = async () => {
    if (!code.trim()) {
      setError('Please provide code to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    const toastId = toast.loading('Analysis in progress...', { description: 'Scanning code for vulnerabilities and performance issues.' });

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          analysisTypes: ['Logical Errors', 'Security Vulnerabilities', 'Performance', 'Code Quality']
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze code');
      
      setResults(data);
      
      toast.success('Analysis completed successfully', { id: toastId });

      // Notify about critical vulnerabilities directly
      const criticalVulns = data.vulnerabilities?.filter((v: any) => v.riskLevel === 'Critical');
      if (criticalVulns && criticalVulns.length > 0) {
        toast.error(`${criticalVulns.length} Critical ${criticalVulns.length === 1 ? 'Vulnerability' : 'Vulnerabilities'} Detected!`, {
          description: criticalVulns[0].name,
          duration: 10000,
        });
      }

    } catch (err: any) {
      setError(err.message);
      toast.error('Analysis failed', { id: toastId, description: err.message });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);
    setIsAutoDetected(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    let detectedLang = language;
    let didDetect = false;

    switch (ext) {
      case 'py': detectedLang = 'Python'; didDetect = true; break;
      case 'js':
      case 'jsx': detectedLang = 'JavaScript'; didDetect = true; break;
      case 'ts':
      case 'tsx': detectedLang = 'TypeScript'; didDetect = true; break;
      case 'java': detectedLang = 'Java'; didDetect = true; break;
      case 'cpp':
      case 'cc':
      case 'cxx':
      case 'c': detectedLang = 'C++'; didDetect = true; break;
      case 'php': detectedLang = 'PHP'; didDetect = true; break;
    }

    if (didDetect) {
      setLanguage(detectedLang);
      setIsAutoDetected(true);
      toast.info(`Language auto-detected: ${detectedLang}`);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setCode(event.target?.result as string);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (results) {
    return (
      <AnalysisResults 
        results={results} 
        onBack={() => setResults(null)} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[70vh]">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <Code className="w-5 h-5 text-blue-600" />
            Source Code Input
          </h2>
          <div className="flex gap-4 items-center">
            {isAutoDetected && (
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3" /> Auto-Detected
              </span>
            )}
            <select 
              value={language}
              onChange={handleLanguageChange}
              className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none"
            >
              <option value="Python">Python</option>
              <option value="JavaScript">JavaScript</option>
              <option value="TypeScript">TypeScript</option>
              <option value="Java">Java</option>
              <option value="C++">C++</option>
              <option value="PHP">PHP</option>
            </select>
            
            <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 border border-slate-300">
              <UploadCloud className="w-4 h-4" />
              Upload File
              <input type="file" className="hidden" accept=".py,.js,.ts,.tsx,.jsx,.java,.cpp,.php" onChange={handleFileUpload} />
            </label>
          </div>
        </div>

        <div className="flex-1 p-0 relative bg-slate-50">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your source code here..."
            className="w-full h-full p-4 bg-transparent outline-none resize-none font-mono text-sm text-slate-800"
            spellCheck={false}
          />
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 border-t border-red-100 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !code.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" /> Run AI Analysis
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function AnalysisResults({ 
  results, 
  onBack, 
  activeTab, 
  setActiveTab 
}: { 
  results: AnalysisResponse, 
  onBack: () => void,
  activeTab: string,
  setActiveTab: (tab: any) => void
}) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', content: string}[]>([
    { role: 'ai', content: "Hi! I'm your AI coding assistant. Ask me anything about the analysis results or how to fix the identified code smells." }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;
    
    setChatMessages(prev => [...prev, { role: 'user', content: currentMessage }]);
    setCurrentMessage('');
    setIsTyping(true);
    
    // Simulate AI response
    setTimeout(() => {
      setChatMessages(prev => [...prev, { 
        role: 'ai', 
        content: "I'd be happy to explain that. Looking at the vulnerabilities and bugs we found, you should focus on sanitizing input and ensuring proper bounds checking. Let me know if you need a specific code fix."
      }]);
      setIsTyping(false);
    }, 1500);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const exportToCSV = () => {
    let csv = 'Type,Severity/Risk,Issue Name,Location,Description,Recommendation\n';
    
    results.bugs.forEach(bug => {
      csv += `Bug,${bug.severity},Logical Error,"Line ${bug.line}","${bug.issue.replace(/"/g, '""')}","${bug.suggestedFix.replace(/"/g, '""')}"\n`;
    });

    results.vulnerabilities.forEach(vuln => {
      csv += `Vulnerability,${vuln.riskLevel},"${vuln.name.replace(/"/g, '""')}",General,"${vuln.impact.replace(/"/g, '""')}","${vuln.recommendation.replace(/"/g, '""')}"\n`;
    });

    results.optimizations.forEach(opt => {
      csv += `Optimization,Info,"${opt.type.replace(/"/g, '""')}",General,"${opt.suggestion.replace(/"/g, '""')}","N/A"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported to CSV successfully');
  };

  const exportToPDF = () => {
    const doc = new jsPDF() as any;
    
    // Add title
    doc.setFontSize(20);
    doc.text("Analysis Report", 14, 22);
    
    // Add generation date
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Add scores section
    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text("Scores", 14, 40);
    
    doc.autoTable({
      startY: 45,
      head: [['Metric', 'Score']],
      body: [
        ['Overall', results.scores.overall],
        ['Security', results.scores.security],
        ['Maintainability', results.scores.maintainability],
        ['Performance', results.scores.performance],
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    let currentY = doc.lastAutoTable.finalY + 15;
    
    // Summary
    doc.setFontSize(14);
    doc.text("Review Summary", 14, currentY);
    doc.setFontSize(11);
    doc.setTextColor(80);
    const splitSummary = doc.splitTextToSize(results.reviewSummary, 180);
    doc.text(splitSummary, 14, currentY + 7);
    
    currentY += splitSummary.length * 5 + 15;
    
    // Vulnerabilities
    if (results.vulnerabilities.length > 0) {
      if (currentY > 250) { doc.addPage(); currentY = 20; }
      doc.setFontSize(14);
      doc.setTextColor(40);
      doc.text("Vulnerabilities", 14, currentY);
      
      const vBody = results.vulnerabilities.map(v => [
        v.riskLevel,
        v.name,
        v.impact,
        v.recommendation
      ]);
      
      doc.autoTable({
        startY: currentY + 5,
        head: [['Risk', 'Name', 'Impact', 'Recommendation']],
        body: vBody,
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68] }
      });
      currentY = doc.lastAutoTable.finalY + 15;
    }
    
    // Bugs
    if (results.bugs.length > 0) {
      if (currentY > 250) { doc.addPage(); currentY = 20; }
      doc.setFontSize(14);
      doc.setTextColor(40);
      doc.text("Bugs", 14, currentY);
      
      const bBody = results.bugs.map(b => [
        `Line ${b.line}`,
        b.severity,
        b.issue,
        b.suggestedFix
      ]);
      
      doc.autoTable({
        startY: currentY + 5,
        head: [['Line', 'Severity', 'Issue', 'Fix']],
        body: bBody,
        theme: 'grid',
        headStyles: { fillColor: [245, 158, 11] }
      });
      currentY = doc.lastAutoTable.finalY + 15;
    }
    
    // Optimizations
    if (results.optimizations.length > 0) {
      if (currentY > 250) { doc.addPage(); currentY = 20; }
      doc.setFontSize(14);
      doc.setTextColor(40);
      doc.text("Optimizations", 14, currentY);
      
      const oBody = results.optimizations.map(o => [
        o.type,
        o.suggestion
      ]);
      
      doc.autoTable({
        startY: currentY + 5,
        head: [['Type', 'Suggestion']],
        body: oBody,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] }
      });
    }
    
    doc.save(`analysis_report_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Report exported to PDF successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Analysis Report</h2>
            <p className="text-sm text-slate-500">Completed just now</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-2 border ${isChatOpen ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'}`}
          >
            <MessageSquare className="w-4 h-4" /> {isChatOpen ? 'Close AI Chat' : 'Ask AI'}
          </button>
          <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>
          <button 
            onClick={exportToPDF}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-2"
          >
            <FileText className="w-4 h-4" /> Export PDF
          </button>
          <button 
            onClick={exportToCSV}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ScoreCard label="Overall" score={results.scores.overall} />
        <ScoreCard label="Security" score={results.scores.security} />
        <ScoreCard label="Maintainability" score={results.scores.maintainability} />
        <ScoreCard label="Performance" score={results.scores.performance} />
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className={`flex-1 w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all ${isChatOpen ? 'lg:w-2/3' : 'w-full'}`}>
          <div className="flex border-b border-slate-200">
            <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<CheckCircle2 />} label="Overview" />
            <TabButton active={activeTab === 'bugs'} onClick={() => setActiveTab('bugs')} icon={<BugIcon />} label={`Bugs (${results.bugs.length})`} />
            <TabButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={<Shield />} label={`Security (${results.vulnerabilities.length})`} />
            <TabButton active={activeTab === 'optimizations'} onClick={() => setActiveTab('optimizations')} icon={<Zap />} label={`Optimizations (${results.optimizations.length})`} />
          </div>

          <div className="p-6 min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
              >
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800">AI Review Summary</h3>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-slate-700 leading-relaxed">
                      {results.reviewSummary}
                    </div>
                  </div>
                )}

                {activeTab === 'bugs' && (
                  <div className="space-y-4">
                    {results.bugs.length === 0 ? (
                      <p className="text-slate-500 text-center py-8">No logical bugs detected. Great job!</p>
                    ) : (
                      results.bugs.map((bug, i) => (
                        <div key={i} className="p-4 border border-amber-200 bg-amber-50 rounded-lg flex items-start gap-4">
                          <BugIcon className="w-5 h-5 text-amber-500 mt-1 shrink-0" />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-amber-900">Line {bug.line}</span>
                              <span className="text-xs bg-amber-200/50 text-amber-800 px-2 py-0.5 rounded-full font-medium">{bug.severity} Severity</span>
                            </div>
                            <p className="text-amber-800 font-medium mb-2">{bug.issue}</p>
                            <div className="bg-white/60 p-3 rounded text-sm text-amber-900 border border-amber-100 font-mono">
                              {bug.suggestedFix}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-4">
                    {results.vulnerabilities.length === 0 ? (
                      <p className="text-slate-500 text-center py-8">No security vulnerabilities detected. Secure code!</p>
                    ) : (
                      results.vulnerabilities.map((vuln, i) => (
                        <div key={i} className="p-4 border border-red-200 bg-red-50 rounded-lg flex items-start gap-4">
                          <Shield className="w-5 h-5 text-red-500 mt-1 shrink-0" />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-red-900">{vuln.name}</span>
                              <span className="text-xs bg-red-200/50 text-red-800 px-2 py-0.5 rounded-full font-medium">{vuln.riskLevel} Risk</span>
                            </div>
                            <p className="text-red-800 text-sm mb-2">{vuln.impact}</p>
                            <div className="bg-white/60 text-red-900 p-3 rounded text-sm border border-red-100">
                              <strong>Fix:</strong> {vuln.recommendation}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'optimizations' && (
                  <div className="space-y-4">
                    {results.optimizations.length === 0 ? (
                      <p className="text-slate-500 text-center py-8">No optimization suggestions.</p>
                    ) : (
                      results.optimizations.map((opt, i) => (
                        <div key={i} className="p-4 border border-blue-200 bg-blue-50 rounded-lg flex items-start gap-4">
                          <Zap className="w-5 h-5 text-blue-500 mt-1 shrink-0" />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs bg-blue-200/50 text-blue-800 px-2 py-0.5 rounded-full font-medium">{opt.type}</span>
                            </div>
                            <p className="text-blue-900">{opt.suggestion}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        
        {isChatOpen && (
          <div className="w-full lg:w-1/3 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-[500px] sticky top-6">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" /> AI Assistant
              </h3>
              <button onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
               {chatMessages.map((msg, i) => (
                 <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[85%] p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none shadow-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'}`}>
                     {msg.content}
                   </div>
                 </div>
               ))}
               {isTyping && (
                 <div className="flex justify-start">
                   <div className="bg-white border border-slate-200 p-3 rounded-lg rounded-bl-none shadow-sm flex gap-1 items-center h-10">
                     <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                     <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                     <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                   </div>
                 </div>
               )}
               <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white shrink-0">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={currentMessage}
                  onChange={e => setCurrentMessage(e.target.value)}
                  placeholder="Ask about code smells..." 
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
                <button type="submit" disabled={!currentMessage.trim()} className="bg-blue-600 text-white p-2 text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreCard({ label, score }: { label: string, score: number }) {
  const isGood = score >= 80;
  const isWarn = score >= 60 && score < 80;
  const colorClass = isGood ? 'text-green-600' : isWarn ? 'text-amber-500' : 'text-red-500';
  
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
      <span className="text-xs font-bold text-slate-400 uppercase mb-1">{label}</span>
      <span className={`text-3xl font-bold ${colorClass}`}>{score}</span>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-4 px-2 text-sm font-medium flex items-center justify-center gap-2 focus:outline-none transition-colors ${
        active ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 border-b-2 border-transparent'
      }`}
    >
      <span className="w-4 h-4">{icon}</span>
      {label}
    </button>
  );
}
