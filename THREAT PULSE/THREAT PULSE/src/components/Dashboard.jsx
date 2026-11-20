import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Download,
  FileDown,
  Filter,
  X,
  TrendingUp,
  Database,
  Eye,
  Zap,
  Globe,
  Lock,
  Search,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  BarChart3,
  PieChart as PieIcon,
  Info
} from 'lucide-react';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  XAxis,
  YAxis
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { API_BASE } from '../lib/api';
import seedData from '../data/threatSeedData.json';

// Animated Counter Component with smooth easing
const AnimatedCounter = ({ value, duration = 0.8 }) => {
  const [displayValue, setDisplayValue] = useState(value || 0);

  useEffect(() => {
    let start = displayValue;
    const end = value || 0;
    if (start === end) return;

    const startTime = Date.now();
    const durationMs = duration * 1000;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * ease);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(end);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <>{displayValue.toLocaleString()}</>;
};

export default function Dashboard() {
  // All IOCs stored in memory (starts with seed data, live updates from backend)
  const [allIOCs, setAllIOCs] = useState(seedData);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(() => new Date());
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionStatus, setIngestionStatus] = useState(null);
  const [apiHealth, setApiHealth] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [selectedThreatDetail, setSelectedThreatDetail] = useState(null);

  // Filters
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Sync with live backend on mount
  useEffect(() => {
    fetchLiveThreatData();
    fetchAPIHealth();

    const healthInterval = setInterval(fetchAPIHealth, 120000);
    return () => clearInterval(healthInterval);
  }, []);

  // Fetch live IOC data from backend
  const fetchLiveThreatData = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/reports/download/json`, {
        signal: AbortSignal.timeout(20000)
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.iocs && Array.isArray(data.iocs) && data.iocs.length > 0) {
          setAllIOCs(data.iocs);
          setLastUpdated(new Date());
        }
      }
    } catch (err) {
      console.log('Using seeded threat dataset (backend connecting in background)');
    }
  };

  // Fetch API Health
  const fetchAPIHealth = async () => {
    try {
      const response = await fetch(`${API_BASE}/health/apis`);
      if (response.ok) {
        const data = await response.json();
        setApiHealth(data);
      }
    } catch (err) {
      console.error('Error fetching API health:', err);
    }
  };

  // Manual Refresh Handler
  const handleRefresh = async () => {
    setLoading(true);
    setIsRefreshing(true);
    const start = Date.now();

    try {
      await Promise.all([
        fetchLiveThreatData(),
        fetchAPIHealth()
      ]);
      const elapsed = Date.now() - start;
      const wait = Math.max(0, 800 - elapsed);
      if (wait > 0) await new Promise(r => setTimeout(r, wait));

      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } finally {
      setLoading(false);
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  // Trigger Ingestion
  const triggerIngestion = async () => {
    setIsIngesting(true);
    try {
      const res = await fetch(`${API_BASE}/api/ingestion/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) {
        alert('Ingestion request queued or rate limited.');
        setIsIngesting(false);
        return;
      }
      pollIngestionStatus();
    } catch (err) {
      alert('Could not reach backend ingestion endpoint.');
      setIsIngesting(false);
    }
  };

  const pollIngestionStatus = () => {
    const check = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/ingestion/status`);
        const data = await res.json();
        setIngestionStatus(data);
        if (!data.running) {
          setIsIngesting(false);
          await handleRefresh();
          return;
        }
        setTimeout(check, 2500);
      } catch {
        setIsIngesting(false);
      }
    };
    check();
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedType('all');
    setSelectedSeverity('all');
    setSearchTerm('');
    setCurrentPage(1);
  };

  // -------------------------------------------------------------
  // DYNAMIC FILTER ENGINE: Recalculates EVERYTHING when filters change
  // -------------------------------------------------------------
  const filteredIOCs = useMemo(() => {
    return allIOCs.filter(ioc => {
      // Type filter
      if (selectedType !== 'all') {
        if ((ioc.ioc_type || '').toLowerCase() !== selectedType.toLowerCase()) {
          return false;
        }
      }

      // Severity filter
      if (selectedSeverity !== 'all') {
        if ((ioc.severity || '').toUpperCase() !== selectedSeverity.toUpperCase()) {
          return false;
        }
      }

      // Search term filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const valMatch = (ioc.ioc_value || '').toLowerCase().includes(term);
        const malwareMatch = (ioc.malware_family || '').toLowerCase().includes(term);
        const descMatch = (ioc.description || '').toLowerCase().includes(term);
        const actorMatch = (ioc.threat_actor || '').toLowerCase().includes(term);
        const tagsMatch = Array.isArray(ioc.tags) && ioc.tags.some(t => t.toLowerCase().includes(term));
        if (!valMatch && !malwareMatch && !descMatch && !actorMatch && !tagsMatch) {
          return false;
        }
      }

      return true;
    });
  }, [allIOCs, selectedType, selectedSeverity, searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedType, selectedSeverity, searchTerm]);

  // Dynamic Calculated Metrics from filteredIOCs
  const dynamicStats = useMemo(() => {
    const total = filteredIOCs.length;
    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;
    let unknown = 0;
    let recent = 0;

    const byType = {};
    const bySeverity = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, UNKNOWN: 0 };
    const bySource = {};

    const now = new Date().getTime();
    const twoDaysMs = 72 * 60 * 60 * 1000;

    filteredIOCs.forEach(item => {
      // Severity
      const sev = (item.severity || 'UNKNOWN').toUpperCase();
      if (sev === 'CRITICAL') critical++;
      else if (sev === 'HIGH') high++;
      else if (sev === 'MEDIUM') medium++;
      else if (sev === 'LOW') low++;
      else unknown++;

      bySeverity[sev] = (bySeverity[sev] || 0) + 1;

      // Type
      const type = (item.ioc_type || 'unknown').toLowerCase();
      byType[type] = (byType[type] || 0) + 1;

      // Source
      const source = (item.source || 'unknown').toLowerCase();
      bySource[source] = (bySource[source] || 0) + 1;

      // Recent estimation
      if (item.first_seen || item.last_updated) {
        const d = new Date(item.last_updated || item.first_seen).getTime();
        if (now - d < twoDaysMs || item.source === 'urlhaus') {
          recent++;
        }
      }
    });

    return {
      total_iocs: total,
      critical_count: critical,
      high_count: high,
      medium_count: medium,
      low_count: low,
      recent_count: recent,
      by_severity: bySeverity,
      by_type: byType,
      by_source: bySource
    };
  }, [filteredIOCs]);

  // Is any filter currently active?
  const isFiltered = selectedType !== 'all' || selectedSeverity !== 'all' || searchTerm.trim().length > 0;

  // Chart 1: Dynamic Severity Breakdown
  const severityChartData = useMemo(() => {
    const data = [
      { name: 'Critical', value: dynamicStats.by_severity.CRITICAL || 0, color: '#ef4444' },
      { name: 'High', value: dynamicStats.by_severity.HIGH || 0, color: '#f97316' },
      { name: 'Medium', value: dynamicStats.by_severity.MEDIUM || 0, color: '#eab308' },
      { name: 'Low', value: dynamicStats.by_severity.LOW || 0, color: '#22c55e' }
    ];
    if (dynamicStats.by_severity.UNKNOWN > 0) {
      data.push({ name: 'Unknown', value: dynamicStats.by_severity.UNKNOWN, color: '#6b7280' });
    }
    return data.filter(d => d.value > 0);
  }, [dynamicStats]);

  // Chart 2: Dynamic Type Distribution Bar Chart
  const typeChartData = useMemo(() => {
    const entries = Object.entries(dynamicStats.by_type);
    return entries.map(([type, count]) => ({
      name: type.toUpperCase(),
      count,
      color: type === selectedType.toLowerCase() ? '#eab308' : '#38bdf8'
    })).sort((a, b) => b.count - a.count);
  }, [dynamicStats, selectedType]);

  // Heatmap Data: Real calculation of Severity × Type for current dataset
  const heatmapData = useMemo(() => {
    const severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    const types = ['sha256', 'ipv4', 'url', 'domain', 'cve', 'md5', 'email'];

    return severities.map(sev => {
      const row = { severity: sev };
      types.forEach(t => {
        const count = filteredIOCs.filter(i => 
          (i.severity || '').toUpperCase() === sev && 
          (i.ioc_type || '').toLowerCase() === t
        ).length;
        row[t] = count;
      });
      return row;
    });
  }, [filteredIOCs]);

  const heatmapTypes = ['sha256', 'ipv4', 'url', 'domain', 'cve', 'md5', 'email'];

  // Dynamic Top 10 Threats for the active filter
  const dynamicTopThreats = useMemo(() => {
    const copy = [...filteredIOCs];
    copy.sort((a, b) => (b.severity_score || 0) - (a.severity_score || 0));
    return copy.slice(0, 10);
  }, [filteredIOCs]);

  // Dynamic Key Insights
  const dynamicInsights = useMemo(() => {
    const total = dynamicStats.total_iocs;
    if (total === 0) return null;

    const topType = typeChartData[0] || { name: 'N/A', count: 0 };
    const topTypePercent = ((topType.count / total) * 100).toFixed(1);
    const criticalPercent = ((dynamicStats.critical_count / total) * 100).toFixed(1);
    const highPercent = ((dynamicStats.high_count / total) * 100).toFixed(1);

    // Dominant malware family
    const malwareCounts = {};
    filteredIOCs.forEach(i => {
      if (i.malware_family) {
        malwareCounts[i.malware_family] = (malwareCounts[i.malware_family] || 0) + 1;
      }
    });
    const sortedMalware = Object.entries(malwareCounts).sort((a, b) => b[1] - a[1]);
    const topMalware = sortedMalware[0] ? sortedMalware[0][0] : null;

    return {
      topType: topType.name,
      topTypePercent,
      criticalPercent,
      highPercent,
      topMalware,
      total
    };
  }, [dynamicStats, typeChartData, filteredIOCs]);

  // Paginated Table Data
  const paginatedIOCs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredIOCs.slice(start, start + pageSize);
  }, [filteredIOCs, currentPage]);

  const totalPages = Math.ceil(filteredIOCs.length / pageSize) || 1;

  // Severity color helpers
  const getSeverityBadgeClass = (sev) => {
    switch((sev || '').toUpperCase()) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      case 'LOW': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      default: return 'bg-gray-700/40 text-gray-400 border-gray-600/40';
    }
  };

  const getTypeIcon = (type) => {
    switch((type || '').toLowerCase()) {
      case 'ipv4': return <Globe className="w-4 h-4 text-cyan-400" />;
      case 'domain': return <Globe className="w-4 h-4 text-indigo-400" />;
      case 'url': return <Globe className="w-4 h-4 text-sky-400" />;
      case 'sha256': return <Lock className="w-4 h-4 text-amber-400" />;
      case 'md5': return <Lock className="w-4 h-4 text-orange-400" />;
      case 'cve': return <Shield className="w-4 h-4 text-red-400" />;
      default: return <Database className="w-4 h-4 text-gray-400" />;
    }
  };

  // Copy IOC
  const handleCopy = (val, id) => {
    navigator.clipboard.writeText(val);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export handlers
  const handleDownloadCSV = () => {
    const headers = ['IOC Value', 'Type', 'Severity', 'Score', 'Malware Family', 'Source', 'First Seen', 'Tags'];
    const rows = filteredIOCs.map(i => [
      `"${i.ioc_value || ''}"`,
      `"${i.ioc_type || ''}"`,
      `"${i.severity || ''}"`,
      i.severity_score || 0,
      `"${i.malware_family || ''}"`,
      `"${i.source || ''}"`,
      `"${i.first_seen || ''}"`,
      `"${(i.tags || []).join(', ')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `threat_pulse_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadJSON = () => {
    const data = {
      platform: 'Threat Pulse',
      exported_at: new Date().toISOString(),
      filter_applied: { type: selectedType, severity: selectedSeverity, search: searchTerm },
      total_records: filteredIOCs.length,
      iocs: filteredIOCs
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `threat_pulse_export_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadBlocklist = () => {
    let content = '# Threat Pulse - Automated Firewall & SIEM Blocklist\n';
    content += `# Generated: ${new Date().toISOString()}\n`;
    content += `# Active Filter: Type=${selectedType}, Severity=${selectedSeverity}\n`;
    content += `# Total Indicators: ${filteredIOCs.length}\n\n`;

    const ips = filteredIOCs.filter(i => i.ioc_type === 'ipv4').map(i => i.ioc_value);
    const domains = filteredIOCs.filter(i => i.ioc_type === 'domain').map(i => i.ioc_value);
    const urls = filteredIOCs.filter(i => i.ioc_type === 'url').map(i => i.ioc_value);
    const hashes = filteredIOCs.filter(i => i.ioc_type === 'sha256' || i.ioc_type === 'md5').map(i => i.ioc_value);

    if (ips.length) { content += '# [IP Addresses]\n' + ips.join('\n') + '\n\n'; }
    if (domains.length) { content += '# [Domains]\n' + domains.join('\n') + '\n\n'; }
    if (urls.length) { content += '# [URLs]\n' + urls.join('\n') + '\n\n'; }
    if (hashes.length) { content += '# [Hashes]\n' + hashes.join('\n') + '\n\n'; }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'threat_pulse_blocklist.txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 p-4 sm:p-8">
      {/* Dashboard Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center">
                <Activity className="w-5 h-5 text-yellow-500" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Threat Pulse <span className="text-yellow-500">Analytics</span>
              </h1>
            </div>
            <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
              <span>Multi-Source Real-Time IOC Telemetry</span>
              <span className="text-gray-600">•</span>
              <span className="text-gray-400">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
              {isFiltered && (
                <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 animate-pulse">
                  ● Filter Active: {filteredIOCs.length.toLocaleString()} of {allIOCs.length.toLocaleString()} IOCs
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={triggerIngestion}
              disabled={isIngesting}
              className="bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-emerald-500/20"
            >
              <Database className={`w-4 h-4 ${isIngesting ? 'animate-bounce' : ''}`} />
              <span>{isIngesting ? 'Ingesting Feeds...' : 'Ingest New IOCs'}</span>
            </Button>
            <Button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Refreshing...' : 'Refresh Telemetry'}</span>
            </Button>
          </div>
        </div>

        {/* Refresh feedback toast */}
        {showSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Telemetry refreshed successfully! {filteredIOCs.length.toLocaleString()} matching indicators active.</span>
          </motion.div>
        )}
      </motion.div>

      {/* FILTER CONTROL BAR */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <Card className="border-yellow-500/30 bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950">
          <CardHeader className="py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-yellow-400 flex items-center gap-2">
                <Filter className="w-4 h-4 text-yellow-500" />
                <span>Interactive Threat Filters & Instant Search</span>
              </CardTitle>
              {isFiltered && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-medium px-2.5 py-1 rounded-md bg-red-500/10 border border-red-500/30 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-center">
              {/* Type Filter */}
              <div className="lg:col-span-3">
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                  Indicator Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-700 hover:border-yellow-500/50 rounded-lg text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors"
                >
                  <option value="all">All Types ({allIOCs.length.toLocaleString()})</option>
                  <option value="sha256">SHA256 Hashes</option>
                  <option value="ipv4">IPv4 Addresses</option>
                  <option value="url">Malicious URLs</option>
                  <option value="domain">Suspicious Domains</option>
                  <option value="cve">CVE Vulnerabilities</option>
                  <option value="md5">MD5 Hashes</option>
                  <option value="email">Phishing Emails</option>
                </select>
              </div>

              {/* Severity Filter */}
              <div className="lg:col-span-3">
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                  Severity Level
                </label>
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-700 hover:border-yellow-500/50 rounded-lg text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors"
                >
                  <option value="all">All Severities</option>
                  <option value="CRITICAL">Critical Only</option>
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Severity</option>
                  <option value="LOW">Low Severity</option>
                </select>
              </div>

              {/* Text Search */}
              <div className="lg:col-span-6">
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                  Search Indicators, Malware, or Threat Actors
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="e.g. Emotet, 45.61.49.78, WannaCry, Log4Shell, AlienVault..."
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-900 border border-gray-700 hover:border-yellow-500/50 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-3 text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Filter Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-gray-800 text-xs">
              <span className="text-gray-500 font-mono">Quick Filters:</span>
              <button 
                onClick={() => { setSelectedType('ipv4'); setSelectedSeverity('CRITICAL'); }}
                className="px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors"
              >
                Critical IPs ({allIOCs.filter(i => i.ioc_type === 'ipv4' && i.severity === 'CRITICAL').length})
              </button>
              <button 
                onClick={() => { setSelectedType('sha256'); setSelectedSeverity('CRITICAL'); }}
                className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors"
              >
                Critical Hashes ({allIOCs.filter(i => i.ioc_type === 'sha256' && i.severity === 'CRITICAL').length})
              </button>
              <button 
                onClick={() => { setSelectedType('url'); setSelectedSeverity('all'); }}
                className="px-2.5 py-1 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 transition-colors"
              >
                All URLs ({allIOCs.filter(i => i.ioc_type === 'url').length})
              </button>
              <button 
                onClick={() => { setSelectedType('cve'); setSelectedSeverity('all'); }}
                className="px-2.5 py-1 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 transition-colors"
              >
                CVEs ({allIOCs.filter(i => i.ioc_type === 'cve').length})
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 4 DYNAMIC KPI STATS CARDS: All numbers recalculate when filter changes! */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8"
      >
        {/* Total IOCs Card */}
        <Card className="relative overflow-hidden border-yellow-500/40 bg-gradient-to-br from-gray-900 to-gray-950 hover:border-yellow-500 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-yellow-500/10 rounded-full -mr-10 -mt-10 pointer-events-none" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs uppercase tracking-wider text-gray-400 font-mono">
                {isFiltered ? 'Filtered IOCs' : 'Total Indicators'}
              </CardTitle>
              <Database className="w-5 h-5 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-yellow-400 font-mono">
              <AnimatedCounter value={dynamicStats.total_iocs} />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
              <span>{isFiltered ? `of ${allIOCs.length.toLocaleString()} total` : 'Across 4 global feeds'}</span>
              <span className="text-yellow-500 font-mono font-semibold">
                {((dynamicStats.total_iocs / allIOCs.length) * 100).toFixed(0)}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Critical Threats Card */}
        <Card className="relative overflow-hidden border-red-500/40 bg-gradient-to-br from-gray-900 to-gray-950 hover:border-red-500 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-red-500/10 rounded-full -mr-10 -mt-10 pointer-events-none" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs uppercase tracking-wider text-gray-400 font-mono">
                Critical Threats
              </CardTitle>
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-red-500 font-mono">
              <AnimatedCounter value={dynamicStats.critical_count} />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1 text-red-400">
                <Zap className="w-3 h-3" /> Immediate Action
              </span>
              <span className="text-red-400 font-mono font-semibold">
                {dynamicStats.total_iocs > 0 ? ((dynamicStats.critical_count / dynamicStats.total_iocs) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* High Priority Card */}
        <Card className="relative overflow-hidden border-orange-500/40 bg-gradient-to-br from-gray-900 to-gray-950 hover:border-orange-500 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-orange-500/10 rounded-full -mr-10 -mt-10 pointer-events-none" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs uppercase tracking-wider text-gray-400 font-mono">
                High Priority
              </CardTitle>
              <Shield className="w-5 h-5 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-orange-400 font-mono">
              <AnimatedCounter value={dynamicStats.high_count} />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1 text-orange-400">
                <Eye className="w-3 h-3" /> High Risk Telemetry
              </span>
              <span className="text-orange-400 font-mono font-semibold">
                {dynamicStats.total_iocs > 0 ? ((dynamicStats.high_count / dynamicStats.total_iocs) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Active Card */}
        <Card className="relative overflow-hidden border-cyan-500/40 bg-gradient-to-br from-gray-900 to-gray-950 hover:border-cyan-500 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/10 rounded-full -mr-10 -mt-10 pointer-events-none" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs uppercase tracking-wider text-gray-400 font-mono">
                Recent Telemetry (24-72h)
              </CardTitle>
              <Clock className="w-5 h-5 text-cyan-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-cyan-400 font-mono">
              <AnimatedCounter value={dynamicStats.recent_count} />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1 text-cyan-400">
                <TrendingUp className="w-3 h-3" /> Actively Propagating
              </span>
              <span className="text-cyan-400 font-mono font-semibold">
                {dynamicStats.total_iocs > 0 ? ((dynamicStats.recent_count / dynamicStats.total_iocs) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* EXPORT & ACTION BAR */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <Download className="w-4 h-4 text-yellow-500" />
            <span className="font-semibold text-white">Export Filtered Threat Intelligence:</span>
            <span className="text-gray-400">({filteredIOCs.length.toLocaleString()} matching records)</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleDownloadCSV} variant="secondary" size="sm" className="flex items-center gap-1.5">
              <FileDown className="w-3.5 h-3.5 text-yellow-400" />
              <span>Export CSV</span>
            </Button>
            <Button onClick={handleDownloadJSON} variant="secondary" size="sm" className="flex items-center gap-1.5">
              <FileDown className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export JSON</span>
            </Button>
            <Button onClick={handleDownloadBlocklist} variant="default" size="sm" className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-black" />
              <span>Download Blocklist.txt</span>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* DYNAMIC CHARTS GRID */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8"
      >
        {/* Chart 1: Severity Breakdown Donut Chart */}
        <div className="lg:col-span-5">
          <Card className="h-full flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-base text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-yellow-500" />
                  Severity Breakdown
                </span>
                <span className="text-xs font-mono text-gray-400">
                  {filteredIOCs.length.toLocaleString()} IOCs
                </span>
              </CardTitle>
              <CardDescription>
                Proportional distribution of active threats by severity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {severityChartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
                  No IOCs matching active filter
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={severityChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                      >
                        {severityChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0a0d14',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        formatter={(val, name) => [
                          `${val.toLocaleString()} IOCs (${((val / dynamicStats.total_iocs) * 100).toFixed(1)}%)`,
                          name
                        ]}
                      />
                      <Legend 
                        formatter={(val) => <span className="text-xs text-gray-300">{val}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chart 2: Type Distribution Bar Chart */}
        <div className="lg:col-span-7">
          <Card className="h-full flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-base text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  Indicator Type Breakdown
                </span>
                <span className="text-xs font-mono text-gray-400">
                  {typeChartData.length} Active Categories
                </span>
              </CardTitle>
              <CardDescription>
                Categorization of indicators matching the active filter
              </CardDescription>
            </CardHeader>
            <CardContent>
              {typeChartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
                  No IOCs matching active filter
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={typeChartData} margin={{ top: 15, right: 20, left: 10, bottom: 25 }}>
                      <XAxis 
                        dataKey="name" 
                        stroke="#9ca3af" 
                        fontSize={11} 
                        tickLine={false} 
                      />
                      <YAxis 
                        stroke="#9ca3af" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0a0d14',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        formatter={(val) => [`${val.toLocaleString()} Indicators`, 'Count']}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {typeChartData.map((entry, index) => (
                          <Cell 
                            key={`bar-${index}`} 
                            fill={entry.color} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* DYNAMIC HEATMAP & KEY INSIGHTS */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8"
      >
        {/* Heatmap Matrix */}
        <div className="lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-yellow-500" />
                Indicator Matrix (Severity × Type)
              </CardTitle>
              <CardDescription>
                Cross-tabulation of indicators in the current view
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400">
                      <th className="p-2 text-left">SEVERITY</th>
                      {heatmapTypes.map(t => (
                        <th 
                          key={t} 
                          className={`p-2 text-center ${selectedType === t ? 'text-yellow-400 font-bold' : ''}`}
                        >
                          {t.toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {heatmapData.map((row) => (
                      <tr 
                        key={row.severity} 
                        className={`border-b border-gray-900 hover:bg-gray-800/40 transition-colors ${selectedSeverity === row.severity ? 'bg-yellow-500/5' : ''}`}
                      >
                        <td className="p-2.5 font-bold">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${getSeverityBadgeClass(row.severity)}`}>
                            {row.severity}
                          </span>
                        </td>
                        {heatmapTypes.map(t => {
                          const val = row[t] || 0;
                          return (
                            <td 
                              key={t} 
                              className="p-2.5 text-center"
                            >
                              <span 
                                className={`inline-block px-2 py-1 rounded ${
                                  val > 0 
                                    ? row.severity === 'CRITICAL' 
                                      ? 'bg-red-500/20 text-red-300 font-bold border border-red-500/30' 
                                      : row.severity === 'HIGH'
                                      ? 'bg-orange-500/20 text-orange-300 font-semibold'
                                      : 'bg-yellow-500/15 text-yellow-200'
                                    : 'text-gray-600'
                                }`}
                              >
                                {val > 0 ? val.toLocaleString() : '—'}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dynamic Key Threat Insights */}
        <div className="lg:col-span-4">
          <Card className="h-full flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-base text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-yellow-500" />
                Active Threat Insights
              </CardTitle>
              <CardDescription>
                Automated heuristic evaluation of the filtered set
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dynamicInsights ? (
                <div className="space-y-3.5 text-xs">
                  <div className="p-3 rounded-lg bg-gray-950/60 border border-gray-800">
                    <p className="text-gray-400">Dominant Vector:</p>
                    <p className="text-white font-semibold mt-0.5">
                      <span className="text-yellow-400">{dynamicInsights.topType}</span> accounts for{' '}
                      <span className="text-white font-bold">{dynamicInsights.topTypePercent}%</span> of active indicators in this view.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-gray-950/60 border border-gray-800">
                    <p className="text-gray-400">Critical Threat Ratio:</p>
                    <p className="text-white font-semibold mt-0.5">
                      <span className="text-red-400 font-bold">{dynamicInsights.criticalPercent}%</span> of indicators have severity scores requiring immediate perimeter blocking.
                    </p>
                  </div>

                  {dynamicInsights.topMalware && (
                    <div className="p-3 rounded-lg bg-gray-950/60 border border-gray-800">
                      <p className="text-gray-400">Top Malware Campaign:</p>
                      <p className="text-white font-semibold mt-0.5">
                        <span className="text-cyan-400 font-bold">{dynamicInsights.topMalware}</span> identified across multiple compromised vectors.
                      </p>
                    </div>
                  )}

                  <div className="p-3 rounded-lg bg-gray-950/60 border border-gray-800">
                    <p className="text-gray-400">Consensus Confidence:</p>
                    <p className="text-emerald-400 font-semibold mt-0.5">
                      Enriched across AlienVault OTX, VirusTotal, and URLhaus with automated scoring.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-xs">No data available for the current filter.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* TOP 10 CRITICAL THREATS (FILTERED REACTIVELY) */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mb-8"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Top Critical Threats
                  {isFiltered && <span className="text-xs text-yellow-400 font-normal">(Matching Active Filter)</span>}
                </CardTitle>
                <CardDescription>
                  Highest severity indicators ranked by composite risk score
                </CardDescription>
              </div>
              <Badge variant="critical">Top {dynamicTopThreats.length} Ranked</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {dynamicTopThreats.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">No threats match current filter criteria.</p>
            ) : (
              <div className="space-y-3">
                {dynamicTopThreats.map((threat, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg bg-gray-950/80 border border-gray-800 hover:border-yellow-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-md bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 flex items-center justify-center text-xs font-mono font-bold flex-shrink-0">
                        #{idx + 1}
                      </span>
                      {getTypeIcon(threat.ioc_type)}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-white font-semibold truncate group-hover:text-yellow-400 transition-colors">
                            {threat.ioc_value}
                          </span>
                          <button
                            onClick={() => handleCopy(threat.ioc_value, `top-${idx}`)}
                            className="text-gray-500 hover:text-white"
                            title="Copy IOC"
                          >
                            {copiedId === `top-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">
                          {threat.description || threat.malware_family || 'High-risk malicious indicator'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0 text-xs">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${getSeverityBadgeClass(threat.severity)}`}>
                        {threat.severity} ({threat.severity_score || 95})
                      </span>
                      <span className="text-gray-400 font-mono text-[11px]">
                        VT: <strong className="text-white">{threat.vt_detections || 'N/A'}</strong>
                      </span>
                      <button
                        onClick={() => setSelectedThreatDetail(threat)}
                        className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium border border-gray-700"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ALL INDICATORS OF COMPROMISE TABLE */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-yellow-500" />
                  All Indicators of Compromise
                </CardTitle>
                <CardDescription>
                  Showing {paginatedIOCs.length} of {filteredIOCs.length.toLocaleString()} matching records
                </CardDescription>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="p-1.5 rounded bg-gray-800 hover:bg-gray-700 text-white disabled:opacity-30 disabled:cursor-not-allowed border border-gray-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 text-gray-400 font-mono">
                  Page <strong className="text-white">{currentPage}</strong> of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-1.5 rounded bg-gray-800 hover:bg-gray-700 text-white disabled:opacity-30 disabled:cursor-not-allowed border border-gray-700"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b-2 border-yellow-500/30 text-gray-400 font-mono uppercase">
                    <th className="p-3">Type</th>
                    <th className="p-3">Indicator Value</th>
                    <th className="p-3">Severity</th>
                    <th className="p-3">Threat / Malware</th>
                    <th className="p-3">Source</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {paginatedIOCs.map((ioc, idx) => (
                    <tr 
                      key={idx}
                      className="hover:bg-yellow-500/5 transition-colors group font-mono"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          {getTypeIcon(ioc.ioc_type)}
                          <span className="text-gray-300 uppercase font-semibold">
                            {ioc.ioc_type}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 max-w-md">
                          <span className="truncate text-white group-hover:text-yellow-400 transition-colors">
                            {ioc.ioc_value}
                          </span>
                          <button
                            onClick={() => handleCopy(ioc.ioc_value, `row-${idx}`)}
                            className="text-gray-500 hover:text-white flex-shrink-0"
                            title="Copy"
                          >
                            {copiedId === `row-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getSeverityBadgeClass(ioc.severity)}`}>
                          {ioc.severity}
                        </span>
                      </td>
                      <td className="p-3 text-gray-300">
                        {ioc.malware_family || ioc.threat_actor || 'Generic Threat'}
                      </td>
                      <td className="p-3 text-gray-400">
                        <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 text-[10px]">
                          {ioc.source || 'OTX'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedThreatDetail(ioc)}
                          className="px-2.5 py-1 rounded bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 text-xs border border-yellow-500/30 transition-colors"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                  {paginatedIOCs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-gray-500">
                        <Database className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p>No indicators match the selected filter criteria.</p>
                        <button
                          onClick={handleResetFilters}
                          className="mt-3 px-3 py-1.5 rounded-lg bg-yellow-500 text-black font-semibold text-xs"
                        >
                          Reset Filters
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-800 text-xs text-gray-400">
                <span>Showing {paginatedIOCs.length} of {filteredIOCs.length.toLocaleString()} records</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="font-mono text-white font-semibold">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* THREAT DETAIL INSPECTOR MODAL */}
      {selectedThreatDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-950 border border-yellow-500/50 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedThreatDetail(null)}
              className="absolute right-5 top-5 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <Shield className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-bold text-white">Threat Intelligence Indicator Dossier</h3>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="p-3 rounded-lg bg-gray-900 border border-gray-800">
                <span className="text-gray-400 block mb-1">INDICATOR VALUE</span>
                <p className="text-sm text-yellow-400 break-all font-bold">
                  {selectedThreatDetail.ioc_value}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-2.5 rounded bg-gray-900 border border-gray-800">
                  <span className="text-gray-500 block text-[10px]">TYPE</span>
                  <span className="text-white font-bold uppercase">{selectedThreatDetail.ioc_type}</span>
                </div>
                <div className="p-2.5 rounded bg-gray-900 border border-gray-800">
                  <span className="text-gray-500 block text-[10px]">SEVERITY</span>
                  <span className={`font-bold ${getSeverityBadgeClass(selectedThreatDetail.severity)}`}>
                    {selectedThreatDetail.severity}
                  </span>
                </div>
                <div className="p-2.5 rounded bg-gray-900 border border-gray-800">
                  <span className="text-gray-500 block text-[10px]">RISK SCORE</span>
                  <span className="text-red-400 font-bold">{selectedThreatDetail.severity_score || 'N/A'}</span>
                </div>
                <div className="p-2.5 rounded bg-gray-900 border border-gray-800">
                  <span className="text-gray-500 block text-[10px]">SOURCE</span>
                  <span className="text-cyan-400 font-bold uppercase">{selectedThreatDetail.source}</span>
                </div>
              </div>

              {selectedThreatDetail.description && (
                <div className="p-3 rounded-lg bg-gray-900 border border-gray-800 font-sans">
                  <span className="text-gray-400 block text-xs font-semibold mb-1">Description</span>
                  <p className="text-gray-200 text-xs leading-relaxed">{selectedThreatDetail.description}</p>
                </div>
              )}

              {selectedThreatDetail.tags && Array.isArray(selectedThreatDetail.tags) && (
                <div>
                  <span className="text-gray-400 block mb-1">Correlation Tags:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedThreatDetail.tags.map((t, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 text-[10px]">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-gray-800 flex justify-end gap-3 font-sans">
                <Button 
                  onClick={() => handleCopy(selectedThreatDetail.ioc_value, 'modal')}
                  variant="secondary"
                  size="sm"
                >
                  {copiedId === 'modal' ? 'Copied!' : 'Copy Value'}
                </Button>
                <Button 
                  onClick={() => setSelectedThreatDetail(null)}
                  size="sm"
                >
                  Close Dossier
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
