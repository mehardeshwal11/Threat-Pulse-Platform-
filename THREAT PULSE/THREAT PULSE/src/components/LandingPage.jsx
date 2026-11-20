import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Activity, 
  Database, 
  FileText, 
  Server, 
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  AlertTriangle,
  Globe2,
  Lock,
  Zap,
  Radio,
  Eye,
  Radar
} from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import ThreatRadar from './ThreatRadar';
import { API_BASE } from '../lib/api';
import seedData from '../data/threatSeedData.json';

export default function LandingPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(() => {
    // Immediate seed stats calculation so landing page loads without delay
    const total = seedData.length;
    const critical = seedData.filter(i => i.severity === 'CRITICAL').length;
    const high = seedData.filter(i => i.severity === 'HIGH').length;
    return {
      total_iocs: total,
      by_severity: { CRITICAL: critical, HIGH: high },
      sources: 4
    };
  });

  useEffect(() => {
    // Try fetching live stats in background
    fetch(`${API_BASE}/api/iocs/stats`)
      .then(res => res.json())
      .then(data => {
        if (data && data.total_iocs) {
          setStats(data);
        }
      })
      .catch(() => {});
  }, []);

  const achievements = [
    { number: stats?.total_iocs?.toLocaleString() || "2,861", label: "Indicators Aggregated" },
    { number: stats?.by_severity?.CRITICAL?.toLocaleString() || "69", label: "Critical Active Threats" },
    { number: stats?.by_severity?.HIGH?.toLocaleString() || "211", label: "High Priority IOCs" },
    { number: "4", label: "Live Threat Feeds" },
  ];

  const features = [
    {
      icon: Shield,
      label: "Multi-Source Threat Ingestion",
      description: "Continuous streaming from AlienVault OTX, VirusTotal, URLhaus, and AbuseIPDB with automated IOC normalization."
    },
    {
      icon: Activity,
      label: "Real-Time Enrichment & Scoring",
      description: "Multi-dimensional scoring pipeline measuring VT detection rates, AbuseIPDB confidence, and malware heuristics."
    },
    {
      icon: Radio,
      label: "Interactive Threat Telemetry",
      description: "Instant dynamic filtering by IOC type (IP, Domain, URL, Hash, CVE) and severity with real-time recalculating figures."
    },
    {
      icon: FileText,
      label: "Actionable Multi-Format Reports",
      description: "Instant export of intelligence reports in CSV, JSON, and executive HTML formats for SOC analysts."
    },
    {
      icon: Server,
      label: "Automated Blocklist Generation",
      description: "Firewall-ready blocklists formatted for IPs, Domains, URLs, and File Hashes for immediate perimeter defence."
    },
    {
      icon: Zap,
      label: "High-Performance Architecture",
      description: "FastAPI asynchronous backend with MongoDB correlation indices, sub-millisecond querying, and RESTful APIs."
    },
  ];

  const threatLevels = [
    {
      level: "CRITICAL",
      count: stats?.by_severity?.CRITICAL ?? "69",
      description: "Immediate action required • Active ransomware campaigns and active C2 command nodes",
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30"
    },
    {
      level: "HIGH",
      count: stats?.by_severity?.HIGH ?? "211",
      description: "Urgent response needed • Malicious droppers, phishing lures, and confirmed spyware",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/30"
    },
    {
      level: "MEDIUM",
      count: "678",
      description: "Monitor closely • Suspicious domains, newly registered hosts, and anomalous IPs",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30"
    },
    {
      level: "LOW",
      count: "202",
      description: "Informational telemetry • Low-risk scans, research references, and benign probes",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-yellow-500 selection:text-black">
      {/* Top Cyber Banner */}
      <div className="border-b border-yellow-500/20 bg-yellow-500/5 px-4 py-2 text-center text-xs text-yellow-400/90 flex items-center justify-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-mono">THREAT PULSE ENGINE ONLINE</span>
        <span className="text-gray-500">•</span>
        <span>Monitoring 2,800+ Live Global Indicators of Compromise</span>
      </div>

      {/* Navigation */}
      <nav className="border-b border-gray-800/80 bg-gray-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border border-yellow-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.2)]">
              <Activity className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">
                THREAT PULSE
              </span>
              <span className="text-[10px] block font-mono text-gray-400 tracking-widest uppercase">
                Threat Intelligence Platform
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={`${API_BASE}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <span>API Docs</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <Button
              onClick={() => navigate('/dashboard')}
              className="shadow-lg shadow-yellow-500/20 flex items-center gap-2"
            >
              <span>Launch Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 px-4 sm:px-6 lg:px-8 radar-grid">
        <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/5 via-transparent to-black pointer-events-none" />
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Hero Copy */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-xs font-mono text-yellow-400">
              <Radio className="w-3.5 h-3.5 animate-pulse text-yellow-500" />
              <span>Real-Time Threat Intelligence & IOC Analytics</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
              Defend Against Threats with{' '}
              <span className="bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">
                Actionable Pulse Telemetry
              </span>
            </h1>

            <p className="text-lg text-gray-400 leading-relaxed max-w-2xl">
              Threat Pulse continuously harvests, normalizes, scores, and correlates security telemetry across AlienVault OTX, VirusTotal, URLhaus, and AbuseIPDB. Filter across indicators with instant dynamic calculations and automated SOC exports.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button 
                size="lg"
                onClick={() => navigate('/dashboard')}
                className="text-base px-8 py-4 flex items-center gap-3 shadow-xl shadow-yellow-500/25"
              >
                <Activity className="w-5 h-5 text-black" />
                <span>Open Threat Pulse Dashboard</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </Button>
              <a
                href="#features"
                className="px-6 py-4 rounded-xl border border-gray-800 hover:border-yellow-500/40 text-gray-300 hover:text-white transition-all text-sm font-medium bg-gray-900/60"
              >
                Explore Capabilities
              </a>
            </div>

            {/* Metric Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-gray-800">
              {achievements.map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-gray-900/40 border border-gray-800">
                  <div className="text-2xl font-bold font-mono text-yellow-400">{item.number}</div>
                  <div className="text-xs text-gray-400 mt-1">{item.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Column: Live Radar Visualizer */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5 flex justify-center"
          >
            <div className="p-6 rounded-2xl bg-gradient-to-b from-gray-900/80 to-gray-950/80 border border-yellow-500/30 backdrop-blur-xl shadow-2xl relative w-full max-w-md">
              <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <Radar className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs font-mono font-bold text-gray-200">GLOBAL PULSE RADAR</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  ACTIVE SCAN
                </span>
              </div>
              
              <ThreatRadar 
                criticalCount={stats?.by_severity?.CRITICAL || 69}
                highCount={stats?.by_severity?.HIGH || 211}
                totalCount={stats?.total_iocs || 2861}
              />

              <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400">
                <span>Multi-Source Correlation: <strong className="text-white">Active</strong></span>
                <span className="text-yellow-400 font-mono">30s Auto-Sync</span>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* Threat Tiers Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-gray-800/60 bg-gray-950/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">Automated Severity Classification</h2>
            <p className="text-sm text-gray-400 mt-2">Threat Pulse scores every indicator using multi-source consensus, VirusTotal detection ratios, and AbuseIPDB confidence</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {threatLevels.map((tier, idx) => (
              <div 
                key={idx}
                className={`p-6 rounded-xl border ${tier.borderColor} ${tier.bgColor} transition-all hover:scale-[1.02]`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-lg font-bold font-mono ${tier.color}`}>{tier.level}</span>
                  <Badge variant={tier.level.toLowerCase()}>{tier.count} IOCs</Badge>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">{tier.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-gray-800/60">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono text-yellow-500 tracking-wider uppercase">Enterprise Capabilities</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">Engineered for Modern Security Operations</h2>
            <p className="text-gray-400 text-sm mt-3">From raw threat feed aggregation to instant firewall-ready blocklists and executive threat summaries.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div 
                  key={idx}
                  className="p-6 rounded-xl bg-gray-900/40 border border-gray-800 hover:border-yellow-500/40 transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-5 group-hover:bg-yellow-500/20 group-hover:border-yellow-500/40 transition-colors">
                    <Icon className="w-6 h-6 text-yellow-500" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors">
                    {feat.label}
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="border-t border-gray-800 bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-yellow-500" />
            <div>
              <p className="text-sm font-bold text-white">Threat Pulse • Real-Time Threat Intelligence</p>
              <p className="text-xs text-gray-500">Multi-source telemetry, automated scoring, and reactive SOC analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate('/dashboard')} size="sm">
              Launch Dashboard
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
