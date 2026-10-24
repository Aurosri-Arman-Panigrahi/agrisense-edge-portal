import React, { useState, useEffect, useRef } from 'react';
import {
  Cpu,
  Layers,
  Radio,
  Activity,
  Droplets,
  Zap,
  Leaf,
  FileText,
  Download,
  Printer,
  ChevronDown,
  ChevronUp,
  Sliders,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Shield,
  Smartphone,
  Gauge,
  Sun,
  Flame,
  Award,
  BookOpen,
  ArrowRight,
  TrendingDown,
  Terminal,
  RefreshCw,
  Clock,
  Sparkles
} from 'lucide-react';

// Time-series dataset derived from Kaggle soil moisture data
const KAGGLE_STREAM_DATA = [
  { time: "00:00", m10: 0.285, m30: 0.312, m50: 0.334, temp: 18.4, hum: 78.2, solar: 0 },
  { time: "03:00", m10: 0.278, m30: 0.309, m50: 0.334, temp: 16.5, hum: 85.4, solar: 0 },
  { time: "06:00", m10: 0.272, m30: 0.307, m50: 0.333, temp: 18.1, hum: 81.0, solar: 120 },
  { time: "09:00", m10: 0.245, m30: 0.301, m50: 0.332, temp: 24.5, hum: 62.0, solar: 550 },
  { time: "12:00", m10: 0.218, m30: 0.291, m50: 0.332, temp: 30.5, hum: 42.1, solar: 890 },
  { time: "14:00", m10: 0.174, m30: 0.271, m50: 0.331, temp: 32.1, hum: 38.4, solar: 920 },
  { time: "16:00", m10: 0.155, m30: 0.258, m50: 0.330, temp: 31.2, hum: 41.0, solar: 650 },
  { time: "18:00", m10: 0.148, m30: 0.249, m50: 0.329, temp: 27.6, hum: 52.3, solar: 230 },
  { time: "20:00", m10: 0.210, m30: 0.285, m50: 0.335, temp: 23.8, hum: 64.7, solar: 10 },
  { time: "22:00", m10: 0.295, m30: 0.318, m50: 0.342, temp: 21.0, hum: 71.5, solar: 0 }
];

export default function App() {
  // Navigation active state
  const [activeTab, setActiveTab] = useState('overview');

  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);

  // Simulation Studio State
  const [simMode, setSimMode] = useState('auto'); // 'auto' | 'manual'
  const [simIndex, setSimIndex] = useState(0);
  const [manual10, setManual10] = useState(0.15);
  const [manual30, setManual30] = useState(0.26);
  const [manual50, setManual50] = useState(0.31);
  const [manualTemp, setManualTemp] = useState(28.5);
  const [activePacketStep, setActivePacketStep] = useState(0);
  const [simSpeed, setSimSpeed] = useState(1);
  const [simHistory, setSimHistory] = useState([
    { t: '12:00', m10: 0.22, m30: 0.29, m50: 0.33, valve: 'CLOSED' }
  ]);

  // Acreage Calculator State
  const [acreage, setAcreage] = useState(45);
  const [cropType, setCropType] = useState('bell_pepper');
  const [showFaoDetails, setShowFaoDetails] = useState(false);

  // Setup Handbook Modal
  const [handbookOpen, setHandbookOpen] = useState(false);

  // FarmBuddy AI Beta Form State
  const [betaPlatform, setBetaPlatform] = useState('ios');
  const [betaEmail, setBetaEmail] = useState('');
  const [betaSubmitted, setBetaSubmitted] = useState(false);

  // Research Paper Sticky TOC active section
  const [activePaperSection, setActivePaperSection] = useState('sec1');
  // Research Paper View Mode: 'pdf' (direct PDF display) or 'editorial' (web text reader)
  const [paperViewMode, setPaperViewMode] = useState('pdf');

  // Bonto Cloud SCADA Gateway Stagnant / Active State
  const [gatewayActive, setGatewayActive] = useState(false);
  const [gatewayWaking, setGatewayWaking] = useState(false);
  const bontoUrl = "https://agrisense-scada.bonto.run";

  const handleToggleGateway = () => {
    if (!gatewayActive) {
      setGatewayWaking(true);
      try {
        fetch(bontoUrl, { mode: 'no-cors' }).catch(() => {});
      } catch (e) {}
      setTimeout(() => {
        setGatewayWaking(false);
        setGatewayActive(true);
      }, 1800);
    } else {
      setGatewayActive(false);
    }
  };

  // Carousel Auto-Advance Effect
  useEffect(() => {
    if (carouselPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 5);
    }, 5000);
    return () => clearInterval(timer);
  }, [carouselPaused]);

  // Simulation Auto-Stream Effect
  useEffect(() => {
    if (simMode !== 'auto') return;
    const intervalTime = 2500 / simSpeed;
    const timer = setInterval(() => {
      setSimIndex((prev) => (prev + 1) % KAGGLE_STREAM_DATA.length);
      setActivePacketStep((prev) => (prev + 1) % 5);
    }, intervalTime);
    return () => clearInterval(timer);
  }, [simMode, simSpeed]);

  // Compute Active Soil Moisture and Valve State
  const current10 = simMode === 'auto' ? KAGGLE_STREAM_DATA[simIndex].m10 : manual10;
  const current30 = simMode === 'auto' ? KAGGLE_STREAM_DATA[simIndex].m30 : manual30;
  const current50 = simMode === 'auto' ? KAGGLE_STREAM_DATA[simIndex].m50 : manual50;
  const currentTemp = simMode === 'auto' ? KAGGLE_STREAM_DATA[simIndex].temp : manualTemp;

  // FAO-56 Hysteresis Decision logic
  let valveState = 'CLOSED';
  let valveReason = 'Soil moisture within optimal vegetative reserve band.';
  let diagnosticStatus = 'optimal';

  if (current50 >= 0.35) {
    valveState = 'CLOSED';
    valveReason = 'Drainage limit reached at 50 cm. Solenoid locked closed to prevent nitrogen leaching.';
    diagnosticStatus = 'warning';
  } else if (current30 >= 0.32) {
    valveState = 'CLOSED';
    valveReason = 'Root-zone Field Capacity reached (θ ≥ 0.32). Valve closed.';
    diagnosticStatus = 'optimal';
  } else if (current10 < 0.18 && current50 < 0.35) {
    valveState = 'OPEN';
    valveReason = 'Surface/Root depletion detected (θ < 0.18). Solenoid pulsed OPEN for micro-dosing.';
    diagnosticStatus = 'irrigating';
  }

  // Acreage Calculator Formulas
  const cropMultipliers = {
    bell_pepper: { waterPerAcre: 68000, co2Factor: 0.18, kwhPerL: 0.0012, name: 'Bell Pepper (Capsicum annuum)' },
    corn: { waterPerAcre: 82000, co2Factor: 0.22, kwhPerL: 0.0014, name: 'Maize / Field Corn' },
    almond: { waterPerAcre: 115000, co2Factor: 0.29, kwhPerL: 0.0018, name: 'Almond Orchard' },
    vineyard: { waterPerAcre: 54000, co2Factor: 0.14, kwhPerL: 0.0009, name: 'Wine Grape Vineyard' },
    wheat: { waterPerAcre: 48000, co2Factor: 0.12, kwhPerL: 0.0008, name: 'Winter Wheat' }
  };
  const activeCrop = cropMultipliers[cropType];
  const waterSavedLiters = Math.round(acreage * activeCrop.waterPerAcre * 0.342);
  const waterSavedGallons = Math.round(waterSavedLiters * 0.264172);
  const energySavedKWh = Math.round(waterSavedLiters * activeCrop.kwhPerL);
  const co2AvoidedKg = Math.round(energySavedKWh * 0.72);

  // Download Setup Handbook as text/markdown PDF-compatible manual
  const handleDownloadHandbook = () => {
    const handbookContent = `# AGRISENSE-EDGE POD™ - IN-SITU INSTALLATION & DEPLOYMENT HANDBOOK
Patent Pending | IPC Classification: A01G 25/16 (Agricultural Watering Control)

1. SITE SELECTION & AUGERING
- Identify the representative crop canopy drip-line (approx. 25-35 cm from plant stem).
- Use a standard 45 mm diameter soil core auger to bore a continuous 52 cm vertical hole.
- Preserve excavated core strata in separate buckets to maintain accurate horizon backfill.

2. PROBE INSERTION & COMPACTION
- Gently insert the stepped cylindrical AgriSense-Edge Pod into the pre-bored shaft.
- Ensure the 10 cm, 30 cm, and 50 cm gold-immersion (ENIG) annular rings align with surface, root, and sub-root horizons.
- Backfill each horizon with slurried native soil to guarantee zero air-gap dielectric contact.

3. HYDRAULIC & LATCHING ACTUATOR CONNECTION
- Connect 16 mm standard polyethylene lateral drip tubing to the probe's upper quick-connect flange.
- Verify that the bi-stable pulse-latching solenoid valve operates at 12V DC (20 ms pulse width).

4. EDGE GATEWAY COMMISSIONING (NODE-RED & MOSQUITTO)
- Boot your local Raspberry Pi or industrial edge gateway running on-premises Mosquitto MQTT.
- Ensure Node-RED flow (agrisense_core.json) is active on port 1880.
- Telemetry will begin broadcasting locally to "agrisense/telemetry/pod_01".
- The system operates with 100% autonomy without internet or cloud subscriptions!
`;
    const blob = new Blob([handbookContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'AgriSense_Edge_Setup_Handbook.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#080a09] text-gray-100 flex flex-col font-sans">
      {/* 1. GLOBAL HEADER & LIVE EDGE BEACON */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/10 px-4 lg:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Leaf className="w-5 h-5 text-black stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                  AgriSense-Edge<span className="text-emerald-400 font-mono"> Pod™</span>
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  IPC A01G 25/16
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-mono">Industrial IoT &amp; Soil Dynamics</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-7 text-sm font-medium text-gray-300">
            <a href="#hero" className="hover:text-emerald-400 transition-colors">Probe</a>
            <a href="#carousel" className="hover:text-emerald-400 transition-colors">Architecture</a>
            <a href="#pipeline" className="hover:text-emerald-400 transition-colors">Edge Pipeline</a>
            <a href="#simulator" className="hover:text-emerald-400 transition-colors">Simulation Studio</a>
            <a href="#calculator" className="hover:text-emerald-400 transition-colors">Impact Sandbox</a>
            <a href="#paper" className="hover:text-emerald-400 transition-colors">Research Paper</a>
            <a href="#farmbuddy" className="hover:text-emerald-400 transition-colors">FarmBuddy AI</a>
          </nav>

          {/* Interactive Bonto Cloud SCADA Gateway Controller */}
          <div className="flex items-center space-x-2.5">
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border shadow-inner transition-all ${
              gatewayActive
                ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                : gatewayWaking
                ? 'bg-amber-950/70 border-amber-500/50 text-amber-300 animate-pulse'
                : 'bg-zinc-900/90 border-white/10 text-gray-400'
            }`}>
              <span className="relative flex h-2.5 w-2.5">
                {gatewayActive && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  gatewayActive ? 'bg-emerald-500' : gatewayWaking ? 'bg-amber-400' : 'bg-zinc-500'
                }`}></span>
              </span>
              <span className="text-xs font-mono font-medium tracking-wide">
                {gatewayActive ? (
                  <>SCADA Cloud: <span className="text-emerald-300 font-semibold">Active</span></>
                ) : gatewayWaking ? (
                  <>SCADA Cloud: <span className="text-amber-300 font-semibold">Waking Up...</span></>
                ) : (
                  <>SCADA Cloud: <span className="text-gray-400">Stagnant (Standby)</span></>
                )}
              </span>
            </div>

            {/* Toggle / Start Button */}
            {!gatewayActive ? (
              <button
                onClick={handleToggleGateway}
                disabled={gatewayWaking}
                className="px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs font-mono transition-all flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                title="Wake up the cloud Node-RED container on Bonto"
              >
                <span>{gatewayWaking ? 'Waking...' : '⚡ Start Gateway'}</span>
              </button>
            ) : (
              <div className="flex items-center space-x-1.5">
                <a
                  href={bontoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-emerald-500/30 text-xs font-mono transition-colors flex items-center space-x-1"
                  title="Open live Node-RED Canvas"
                >
                  <span>Open</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  onClick={handleToggleGateway}
                  className="px-2 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-gray-400 hover:text-white border border-white/10 text-xs font-mono transition-colors"
                  title="Put back into dormant/stagnant state"
                >
                  ⏸️
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION (APPLE AESTHETIC) */}
      <section id="hero" className="relative pt-20 pb-24 overflow-hidden border-b border-white/5">
        {/* Glow backdrop */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/10 blur-[140px] pointer-events-none rounded-full" />
        
        <div className="max-w-7xl mx-auto px-4 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Vision & Patent Claim */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-emerald-400">
                <Shield className="w-3.5 h-3.5" />
                <span>Patent Pending | IPC Classification: A01G 25/16</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
                Zero-Cloud Precision. <br />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-green-500 bg-clip-text text-transparent">
                  Deterministic Edge
                </span> Irrigation.
              </h1>

              <p className="text-lg text-gray-300 max-w-2xl font-normal leading-relaxed">
                The <strong className="text-white">AgriSense-Edge Pod™</strong> re-engineers agricultural water management. By combining a 50 cm stepped in-situ probe with active fringe-field ENIG guard rings and on-premises Node-RED hysteresis middleware, crops receive micro-dosed irrigation with <span className="text-emerald-400 font-semibold">&lt;120 ms latency</span> and <span className="text-emerald-400 font-semibold">100% offline autonomy</span> during wide-area cellular blackouts.
              </p>

              {/* Author Attribution pill */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 max-w-xl text-xs text-gray-400">
                <span className="text-emerald-400 font-semibold uppercase tracking-wider font-mono">KIIT Research Engineering:</span>{" "}
                Aurosri Arman Panigrahi, Aayush Saha, Ayush Pradhan, Ayush Das, Kumar Mimanshu Singh
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="#pipeline"
                  className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center space-x-2"
                >
                  <Cpu className="w-4 h-4" />
                  <span>Explore Architecture</span>
                </a>
                <a
                  href="#paper"
                  className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm transition-all border border-white/15 flex items-center space-x-2"
                >
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>Read Research Paper ↗</span>
                </a>
                <button
                  onClick={() => setHandbookOpen(true)}
                  className="px-5 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-gray-300 font-mono text-xs border border-white/10 flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Setup Guide</span>
                </button>
              </div>

              {/* Empirical High-Impact Stats */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">34.2%</div>
                  <div className="text-xs text-gray-400">Freshwater Conserved</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">&lt;112ms</div>
                  <div className="text-xs text-gray-400">Edge Decision Latency</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-teal-300 font-mono">100%</div>
                  <div className="text-xs text-gray-400">Offline WAN Resilience</div>
                </div>
              </div>
            </div>

            {/* Right Column: Photorealistic Interactive Probe Cutaway Diagram */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-sm glass-panel-elevated rounded-3xl p-6 border border-emerald-500/20">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="font-mono text-xs text-gray-300">POD_SCHEMATIC_v2.4</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    500mm SHAFT
                  </span>
                </div>

                {/* Stepped probe visualization */}
                <div className="relative py-6 flex flex-col items-center">
                  {/* Head & Hydraulic Latching Flange */}
                  <div className="w-44 h-16 rounded-2xl bg-gradient-to-b from-zinc-700 to-zinc-800 border-2 border-emerald-500/50 flex flex-col items-center justify-center p-2 text-center shadow-md">
                    <span className="text-[11px] font-bold text-white tracking-wide">HYDRAULIC HEAD FLANGE</span>
                    <span className="text-[9px] font-mono text-emerald-400">12V Bi-Stable Latching Valve</span>
                  </div>

                  {/* Stem Tier 1 (10cm) */}
                  <div className="w-32 h-20 bg-zinc-800 border-x border-zinc-600 flex flex-col items-center justify-center relative">
                    <div className="w-36 h-6 rounded-md bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 border border-yellow-200 flex items-center justify-center shadow-lg">
                      <span className="text-[10px] font-mono font-bold text-black">10 cm Ring: Evaporation</span>
                    </div>
                    <span className="text-[8px] font-mono text-gray-400 mt-1">Active Guard Ring Shield</span>
                  </div>

                  {/* Stem Tier 2 (30cm) */}
                  <div className="w-28 h-24 bg-zinc-850 border-x border-zinc-600 flex flex-col items-center justify-center relative">
                    <div className="w-32 h-6 rounded-md bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 border border-yellow-200 flex items-center justify-center shadow-lg">
                      <span className="text-[10px] font-mono font-bold text-black">30 cm Ring: Root Transp.</span>
                    </div>
                    <span className="text-[8px] font-mono text-emerald-400 mt-1">Field Capacity: θ = 0.32</span>
                  </div>

                  {/* Stem Tier 3 (50cm) */}
                  <div className="w-24 h-24 bg-zinc-900 border-x border-zinc-600 flex flex-col items-center justify-center relative">
                    <div className="w-28 h-6 rounded-md bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 border border-yellow-200 flex items-center justify-center shadow-lg">
                      <span className="text-[10px] font-mono font-bold text-black">50 cm Ring: Drainage</span>
                    </div>
                    <span className="text-[8px] font-mono text-red-400 mt-1">Leach Cutoff: θ ≥ 0.35</span>
                  </div>

                  {/* Penetration Cone Tip */}
                  <div className="w-0 h-0 border-l-[40px] border-l-transparent border-r-[40px] border-r-transparent border-t-[35px] border-t-zinc-700" />
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-gray-400">
                  <span>Plating: ENIG 3μm Au</span>
                  <span className="text-emerald-400">Isolation: Fringe Guard</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. DYNAMIC ENGINEERING CAROUSEL BANNER */}
      <section
        id="carousel"
        className="py-16 bg-[#0a0d0b] border-b border-white/5 relative"
        onMouseEnter={() => setCarouselPaused(true)}
        onMouseLeave={() => setCarouselPaused(false)}
      >
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-xs uppercase font-mono tracking-widest text-emerald-400 font-semibold">
                Modular Hardware &amp; Edge Architecture
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
                Engineering Pillars of AgriSense-Edge
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-gray-500 mr-2">
                {carouselPaused ? "Paused on Hover" : "Auto-Advancing (5s)"}
              </span>
              {[0, 1, 2, 3, 4].map((i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-2 rounded-full transition-all ${
                    currentSlide === i ? 'w-8 bg-emerald-400' : 'w-2 bg-white/20'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Carousel Card Slides */}
          <div className="relative min-h-[260px] glass-panel rounded-2xl p-8 border border-white/10 flex flex-col justify-between overflow-hidden">
            {currentSlide === 0 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center space-x-3 text-emerald-400 font-mono text-xs uppercase">
                  <Layers className="w-5 h-5" />
                  <span>Slide 1 / 5: Subsurface Sensor Physics</span>
                </div>
                <h3 className="text-2xl font-bold text-white">
                  Multi-Strata Capacitive Impedance Sensing (10 cm, 30 cm, 50 cm)
                </h3>
                <p className="text-gray-300 text-sm max-w-3xl leading-relaxed">
                  Three isolated annular ring electrodes measure bulk soil dielectric permittivity at discrete agronomic horizons. Active unity-gain operational amplifiers drive adjacent copper guard rings (V_guard = V_sense) to eliminate parasitic fringe-field capacitance and provide clean readings even in high-salinity fertilised soils.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 font-mono text-xs text-emerald-300">
                    ENIG 3μm Nickel / 0.05μm Gold
                  </span>
                  <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 font-mono text-xs text-emerald-300">
                    Third-Order Cubic Calibration Curve
                  </span>
                </div>
              </div>
            )}

            {currentSlide === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center space-x-3 text-teal-400 font-mono text-xs uppercase">
                  <Radio className="w-5 h-5" />
                  <span>Slide 2 / 5: Low-Power Telemetry</span>
                </div>
                <h3 className="text-2xl font-bold text-white">
                  Long-Range Low-Power Telemetry (LoRaWAN &amp; RS-485 Modbus)
                </h3>
                <p className="text-gray-300 text-sm max-w-3xl leading-relaxed">
                  Field nodes deploy an ultra-low-power transceiver transmitting deterministic telemetry packets over 868/915 MHz LoRa up to 10 km in line-of-sight conditions. For dense polyhouse setups, RS-485 Modbus RTU provides interference-free wired communication straight into industrial gateway terminals.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 font-mono text-xs text-teal-300">
                    Sub-GHz Chirp Spread Spectrum
                  </span>
                  <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 font-mono text-xs text-teal-300">
                    Solar Sleep Regime &lt;25μA
                  </span>
                </div>
              </div>
            )}

            {currentSlide === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center space-x-3 text-emerald-400 font-mono text-xs uppercase">
                  <Cpu className="w-5 h-5" />
                  <span>Slide 3 / 5: Edge Middleware Intelligence</span>
                </div>
                <h3 className="text-2xl font-bold text-white">
                  On-Premises Node-RED Middleware (100% Offline Autonomy)
                </h3>
                <p className="text-gray-300 text-sm max-w-3xl leading-relaxed">
                  The local gateway hosts an asynchronous event-driven Node-RED engine paired with a Mosquitto broker. If external broadband cellular service drops for days, the closed-loop decision engine continues evaluating FAO-56 Penman-Monteith hysteresis thresholds without missing an actuation cycle.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 font-mono text-xs text-emerald-300">
                    Sub-120ms Latency Guarantee
                  </span>
                  <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 font-mono text-xs text-emerald-300">
                    Zero Cloud Subscription Fees
                  </span>
                </div>
              </div>
            )}

            {currentSlide === 3 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center space-x-3 text-yellow-400 font-mono text-xs uppercase">
                  <Zap className="w-5 h-5" />
                  <span>Slide 4 / 5: Zero-Loss Actuation</span>
                </div>
                <h3 className="text-2xl font-bold text-white">
                  Bi-Stable Pulse-Latching Solenoid Actuation
                </h3>
                <p className="text-gray-300 text-sm max-w-3xl leading-relaxed">
                  Unlike traditional solenoid valves that consume 400 to 600 mA continuously while open, AgriSense utilizes a bi-stable latching solenoid requiring only a 20 ms, 12V pulse (&lt;15 mJ energy) to switch states. Permanent magnets hold the valve open or closed indefinitely with zero holding current.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 font-mono text-xs text-yellow-300">
                    20ms Polarity Pulse
                  </span>
                  <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 font-mono text-xs text-yellow-300">
                    Zero Continuous Holding Draw
                  </span>
                </div>
              </div>
            )}

            {currentSlide === 4 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center space-x-3 text-purple-400 font-mono text-xs uppercase">
                  <Sparkles className="w-5 h-5" />
                  <span>Slide 5 / 5: Future Horizon</span>
                </div>
                <h3 className="text-2xl font-bold text-white">
                  In-Situ Microfluidic NPK &amp; Autonomous Drone Swarms
                </h3>
                <p className="text-gray-300 text-sm max-w-3xl leading-relaxed">
                  Next iterations will incorporate ion-selective microfluidic electrodes for real-time nitrogen, phosphorus, and potassium (NPK) nutrient tracking, synchronized with autonomous agricultural UAVs for localized multispectral NDVI thermal cross-calibration.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 font-mono text-xs text-purple-300">
                    Microfluidic Ion Tracking
                  </span>
                  <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 font-mono text-xs text-purple-300">
                    Drone Swarm Mesh Coordination
                  </span>
                </div>
              </div>
            )}

            {/* Navigation Arrows */}
            <div className="flex items-center justify-between pt-6 border-t border-white/10">
              <button
                onClick={() => setCurrentSlide((prev) => (prev - 1 + 5) % 5)}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-gray-300 border border-white/10 transition-colors"
              >
                ← Previous
              </button>
              <span className="text-xs font-mono text-gray-400">
                Pillar {currentSlide + 1} of 5
              </span>
              <button
                onClick={() => setCurrentSlide((prev) => (prev + 1) % 5)}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-gray-300 border border-white/10 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SCROLL-DRIVEN "WINDING ROAD" ANIMATED PIPELINE */}
      <section id="pipeline" className="py-24 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs uppercase font-mono tracking-widest text-emerald-400 font-semibold">
              Deterministic Cyber-Physical Dataflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
              From Dielectric Permittivity to Micro-Dose Valve Latch
            </h2>
            <p className="text-gray-400 text-sm mt-3">
              Follow the end-to-end signal trajectory as sensor excitation converts to edge hysteresis decisions in less than 112 milliseconds.
            </p>
          </div>

          {/* Animated 5-Step Pipeline Cards with Vertical Connector */}
          <div className="relative">
            {/* Visual illuminated center track */}
            <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 via-teal-400 to-green-600 hidden md:block opacity-40 shadow-[0_0_15px_#10b981]" />

            <div className="space-y-12 relative">
              {/* Step 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="glass-panel rounded-2xl p-6 border border-emerald-500/20 glass-card-hover md:text-right">
                  <div className="inline-block px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 font-mono text-xs mb-2">
                    STEP 01
                  </div>
                  <h3 className="text-xl font-bold text-white">Dielectric Permittivity Excitation</h3>
                  <p className="text-gray-400 text-sm mt-2">
                    The 50 cm probe injects a 50 MHz oscillation across three ENIG annular electrodes. The apparent dielectric constant ($ε_b$) of the soil-water matrix alters the resonant circuit frequency, sampling moisture at 10 cm, 30 cm, and 50 cm.
                  </p>
                </div>
                <div className="hidden md:flex justify-start items-center pl-8">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <Activity className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="hidden md:flex justify-end items-center pr-8">
                  <div className="w-12 h-12 rounded-full bg-teal-500/20 border-2 border-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/30">
                    <Radio className="w-5 h-5 text-teal-400" />
                  </div>
                </div>
                <div className="glass-panel rounded-2xl p-6 border border-teal-500/20 glass-card-hover">
                  <div className="inline-block px-2.5 py-1 rounded bg-teal-500/10 text-teal-400 font-mono text-xs mb-2">
                    STEP 02
                  </div>
                  <h3 className="text-xl font-bold text-white">LoRa / Modbus Telemetry Serialization</h3>
                  <p className="text-gray-400 text-sm mt-2">
                    The probe's embedded MCU normalizes frequency values into volumetric water content ($\theta$) using pre-calibrated polynomials ($VWC = a\varepsilon^3 + b\varepsilon^2 + c\varepsilon + d$), packing data into encrypted LoRa packets transmitted to the edge gateway.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="glass-panel rounded-2xl p-6 border border-emerald-500/20 glass-card-hover md:text-right">
                  <div className="inline-block px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 font-mono text-xs mb-2">
                    STEP 03
                  </div>
                  <h3 className="text-xl font-bold text-white">Local Ingestion (Mosquitto MQTT)</h3>
                  <p className="text-gray-400 text-sm mt-2">
                    The on-farm edge gateway ingests telemetry via an on-premises Mosquitto MQTT broker on topic <code className="text-emerald-300 font-mono text-xs">agrisense/telemetry/pod_01</code> with QoS 1 persistence, completely isolated from wide-area cloud connections.
                  </p>
                </div>
                <div className="hidden md:flex justify-start items-center pl-8">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <Terminal className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="hidden md:flex justify-end items-center pr-8">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <Cpu className="w-5 h-5 text-amber-400" />
                  </div>
                </div>
                <div className="glass-panel rounded-2xl p-6 border border-amber-500/20 glass-card-hover">
                  <div className="inline-block px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 font-mono text-xs mb-2">
                    STEP 04
                  </div>
                  <h3 className="text-xl font-bold text-white">Node-RED FAO-56 Hysteresis Computation</h3>
                  <p className="text-gray-400 text-sm mt-2">
                    Node-RED's <span className="font-mono text-emerald-300 text-xs">agronomic-hysteresis</span> function evaluates multi-depth moisture against Permanent Wilting Point (θ_PWP) and Field Capacity (θ_FC), calculating evapotranspiration flux in under 2 ms.
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="glass-panel rounded-2xl p-6 border border-emerald-500/20 glass-card-hover md:text-right">
                  <div className="inline-block px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 font-mono text-xs mb-2">
                    STEP 05
                  </div>
                  <h3 className="text-xl font-bold text-white">Bi-Stable Solenoid Micro-Dosing Latch</h3>
                  <p className="text-gray-400 text-sm mt-2">
                    A 20 ms electrical polarity pulse triggers the probe's integrated latching solenoid, releasing water straight to lateral drip emitters. As soon as 50 cm moisture detects drainage, the valve locks closed, preventing pesticide and nutrient leaching.
                  </p>
                </div>
                <div className="hidden md:flex justify-start items-center pl-8">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <Droplets className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE NODE-RED & KAGGLE SIMULATION STUDIO */}
      <section id="simulator" className="py-20 bg-[#090c0a] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div>
              <span className="text-xs uppercase font-mono tracking-widest text-emerald-400 font-semibold">
                Interactive Scientific Sandbox
              </span>
              <h2 className="text-3xl font-bold text-white mt-1">
                Node-RED Hysteresis &amp; Kaggle Telemetry Studio
              </h2>
              <p className="text-gray-400 text-sm mt-2">
                Simulate actual time-series soil moisture datasets or interactively manipulate multi-depth sliders to observe real-time edge valve decisions.
              </p>
            </div>

            {/* Input Mode Selector */}
            <div className="flex items-center space-x-3 mt-4 md:mt-0 p-1.5 rounded-xl bg-zinc-900 border border-white/10">
              <button
                onClick={() => setSimMode('auto')}
                className={`px-4 py-2 rounded-lg text-xs font-mono transition-all flex items-center space-x-2 ${
                  simMode === 'auto'
                    ? 'bg-emerald-500 text-black font-bold shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>Auto: Kaggle CSV Stream</span>
              </button>
              <button
                onClick={() => setSimMode('manual')}
                className={`px-4 py-2 rounded-lg text-xs font-mono transition-all flex items-center space-x-2 ${
                  simMode === 'manual'
                    ? 'bg-emerald-500 text-black font-bold shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Manual: Interactive Sliders</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Visual Node-RED Flowchart with glowing active packet */}
            <div className="lg:col-span-7 glass-panel rounded-2xl p-6 border border-white/10 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono text-xs font-bold text-gray-200">
                    Node-RED Runtime Canvas: flows.json
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs font-mono text-gray-400">
                  <span>Speed:</span>
                  {['1x', '2x', '5x'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSimSpeed(parseInt(s))}
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        simSpeed === parseInt(s) ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-white/5'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Glowing Interactive Flow Diagram */}
              <div className="bg-[#050706] p-6 rounded-xl border border-white/5 space-y-4">
                <div className="text-[11px] font-mono text-gray-400 flex justify-between">
                  <span>Packet Sequence #{simIndex + 101}</span>
                  <span className="text-emerald-400 font-bold">Execution Latency: 1.84ms</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
                  {/* Node 1 */}
                  <div className={`p-3 rounded-lg border transition-all ${
                    activePacketStep === 0
                      ? 'bg-emerald-950/80 border-emerald-400 shadow-md shadow-emerald-500/20'
                      : 'bg-zinc-900/60 border-white/10'
                  }`}>
                    <div className="text-[10px] font-mono text-gray-400">mqtt in</div>
                    <div className="text-xs font-bold text-white mt-1">pod_01 Telemetry</div>
                    <div className="text-[9px] font-mono text-emerald-400 mt-1">QoS 1 Ingestion</div>
                  </div>

                  {/* Node 2 */}
                  <div className={`p-3 rounded-lg border transition-all ${
                    activePacketStep === 1
                      ? 'bg-emerald-950/80 border-emerald-400 shadow-md shadow-emerald-500/20'
                      : 'bg-zinc-900/60 border-white/10'
                  }`}>
                    <div className="text-[10px] font-mono text-gray-400">json parser</div>
                    <div className="text-xs font-bold text-white mt-1">Payload Parser</div>
                    <div className="text-[9px] font-mono text-teal-400 mt-1">UTF-8 Decode</div>
                  </div>

                  {/* Node 3 */}
                  <div className={`p-3 rounded-lg border transition-all ${
                    activePacketStep >= 2 && activePacketStep <= 3
                      ? 'bg-emerald-950/80 border-emerald-400 shadow-md shadow-emerald-500/20'
                      : 'bg-zinc-900/60 border-white/10'
                  }`}>
                    <div className="text-[10px] font-mono text-gray-400">function</div>
                    <div className="text-xs font-bold text-white mt-1">FAO-56 Hysteresis</div>
                    <div className="text-[9px] font-mono text-yellow-400 mt-1">θ Evaluation</div>
                  </div>

                  {/* Node 4 */}
                  <div className={`p-3 rounded-lg border transition-all ${
                    activePacketStep === 4
                      ? 'bg-emerald-950/80 border-emerald-400 shadow-md shadow-emerald-500/20'
                      : 'bg-zinc-900/60 border-white/10'
                  }`}>
                    <div className="text-[10px] font-mono text-gray-400">mqtt out</div>
                    <div className="text-xs font-bold text-white mt-1">Valve Actuator</div>
                    <div className="text-[9px] font-mono text-emerald-400 mt-1">Command Dispatched</div>
                  </div>
                </div>
              </div>

              {/* Live Multi-Depth Gauges */}
              <div className="grid grid-cols-3 gap-4">
                {/* 10 cm Gauge */}
                <div className="p-4 rounded-xl bg-zinc-900/70 border border-white/10 text-center">
                  <div className="text-xs font-mono text-gray-400">Surface (10 cm)</div>
                  <div className="text-2xl font-extrabold text-white font-mono mt-1">
                    {(current10 * 100).toFixed(1)}%
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400 mt-1">
                    VWC: {current10.toFixed(3)}
                  </div>
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, current10 * 200)}%` }}
                    />
                  </div>
                </div>

                {/* 30 cm Gauge */}
                <div className="p-4 rounded-xl bg-zinc-900/70 border border-white/10 text-center">
                  <div className="text-xs font-mono text-gray-400">Root Zone (30 cm)</div>
                  <div className="text-2xl font-extrabold text-white font-mono mt-1">
                    {(current30 * 100).toFixed(1)}%
                  </div>
                  <div className="text-[10px] font-mono text-teal-400 mt-1">
                    VWC: {current30.toFixed(3)}
                  </div>
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-teal-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, current30 * 200)}%` }}
                    />
                  </div>
                </div>

                {/* 50 cm Gauge */}
                <div className="p-4 rounded-xl bg-zinc-900/70 border border-white/10 text-center">
                  <div className="text-xs font-mono text-gray-400">Sub-Root (50 cm)</div>
                  <div className="text-2xl font-extrabold text-white font-mono mt-1">
                    {(current50 * 100).toFixed(1)}%
                  </div>
                  <div className="text-[10px] font-mono text-yellow-400 mt-1">
                    VWC: {current50.toFixed(3)}
                  </div>
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-yellow-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, current50 * 200)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Manual mode sliders if enabled */}
              {simMode === 'manual' && (
                <div className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-4">
                  <div className="text-xs font-mono text-emerald-400 font-bold uppercase">
                    Interactive Soil Stratum Sliders
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-300 font-mono mb-1">
                      <span>10 cm Surface Moisture:</span>
                      <span className="text-emerald-400 font-bold">{(manual10 * 100).toFixed(1)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.08"
                      max="0.45"
                      step="0.01"
                      value={manual10}
                      onChange={(e) => setManual10(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-gray-300 font-mono mb-1">
                      <span>30 cm Root Zone Moisture:</span>
                      <span className="text-teal-400 font-bold">{(manual30 * 100).toFixed(1)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.10"
                      max="0.45"
                      step="0.01"
                      value={manual30}
                      onChange={(e) => setManual30(parseFloat(e.target.value))}
                      className="w-full accent-teal-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-gray-300 font-mono mb-1">
                      <span>50 cm Deep Drainage Moisture:</span>
                      <span className="text-yellow-400 font-bold">{(manual50 * 100).toFixed(1)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.12"
                      max="0.45"
                      step="0.01"
                      value={manual50}
                      onChange={(e) => setManual50(parseFloat(e.target.value))}
                      className="w-full accent-yellow-500 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actuator State & Agronomic Diagnostic Engine */}
            <div className="lg:col-span-5 space-y-6">
              {/* Valve Status Card */}
              <div className={`p-6 rounded-2xl border transition-all ${
                valveState === 'OPEN'
                  ? 'bg-emerald-950/60 border-emerald-400 shadow-xl shadow-emerald-500/20'
                  : 'bg-zinc-900/80 border-white/10'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-gray-400 uppercase">
                    12V Solenoid Actuator State
                  </span>
                  <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold tracking-widest ${
                    valveState === 'OPEN'
                      ? 'bg-emerald-500 text-black animate-pulse'
                      : 'bg-zinc-800 text-gray-300'
                  }`}>
                    {valveState}
                  </span>
                </div>

                <div className="my-4">
                  <div className="text-3xl font-extrabold text-white flex items-center space-x-2">
                    <Droplets className={`w-8 h-8 ${valveState === 'OPEN' ? 'text-emerald-400' : 'text-gray-500'}`} />
                    <span>{valveState === 'OPEN' ? 'Micro-Dosing Active' : 'Solenoid Locked'}</span>
                  </div>
                  <p className="text-xs text-gray-300 mt-2 font-mono leading-relaxed">
                    Reason: {valveReason}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-3 text-[11px] font-mono text-gray-400">
                  <div>
                    PWP Threshold: <span className="text-white">θ &lt; 0.18</span>
                  </div>
                  <div>
                    FC Threshold: <span className="text-white">θ ≥ 0.32</span>
                  </div>
                  <div>
                    Drainage Limit: <span className="text-white">θ ≥ 0.35</span>
                  </div>
                  <div>
                    Pulse Energy: <span className="text-emerald-400">&lt;15 mJ</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Agronomic Diagnostic Engine */}
              <div className="p-6 rounded-2xl glass-panel border border-white/10 space-y-4">
                <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 uppercase font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>Agronomic Yield Diagnostic Engine</span>
                </div>

                {diagnosticStatus === 'optimal' && (
                  <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 space-y-1">
                    <div className="font-bold flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Vegetative Comfort Zone Maintained</span>
                    </div>
                    <p className="text-gray-300 text-[11px]">
                      Root-zone available water capacity is at equilibrium. Optimal transpiration conditions promote active calcium absorption and vigorous foliar expansion.
                    </p>
                  </div>
                )}

                {diagnosticStatus === 'irrigating' && (
                  <div className="p-4 rounded-xl bg-teal-950/40 border border-teal-500/30 text-xs text-teal-200 space-y-1">
                    <div className="font-bold flex items-center space-x-2">
                      <Droplets className="w-4 h-4 text-teal-400 animate-bounce" />
                      <span>Rhizosphere Replenishment Underway</span>
                    </div>
                    <p className="text-gray-300 text-[11px]">
                      Surface evaporative horizon has depleted below permanent wilting point. Pulse micro-dosing replenishes the 10-30 cm root boundary without inducing soil compaction.
                    </p>
                  </div>
                )}

                {diagnosticStatus === 'warning' && (
                  <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-200 space-y-1">
                    <div className="font-bold flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span>Deep Percolation Leaching Guard Activated</span>
                    </div>
                    <p className="text-gray-300 text-[11px]">
                      Excess moisture detected at 50 cm ($θ \ge 0.35$). Irrigation cut off immediately to protect root oxygenation and prevent chemical nitrogen runoff into ground aquifers.
                    </p>
                  </div>
                )}

                <div className="text-[11px] font-mono text-gray-400 bg-white/[0.02] p-3 rounded-lg border border-white/5">
                  <span className="text-white font-semibold">Agronomic Tip:</span> Maintaining a vertical moisture gradient ($θ_{10} &lt; θ_{30} &lt; θ_{50}$) trains root architecture to plunge deeply into subsoil strata, increasing drought tolerance.
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 6. REAL-TIME ACREAGE IMPACT CALCULATOR (DEEPMIND SANDBOX) */}
      <section id="calculator" className="py-20 relative border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs uppercase font-mono tracking-widest text-emerald-400 font-semibold">
              Predictive Agronomic Modeling
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
              Field-Scale Resource Conservation Calculator
            </h2>
            <p className="text-gray-400 text-sm mt-2">
              Based on empirical split-plot findings showing 34.2% water conservation and 22% energy reduction over conventional timer scheduling.
            </p>
          </div>

          <div className="glass-panel-elevated rounded-3xl p-8 border border-white/10">
            {/* Interactive Acreage Slider & Crop Preset */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pb-8 border-b border-white/10">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-200">Cultivated Farm Area:</span>
                  <span className="text-2xl font-mono font-extrabold text-emerald-400">
                    {acreage} <span className="text-sm text-gray-400">Acres</span>
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="1000"
                  step="1"
                  value={acreage}
                  onChange={(e) => setAcreage(parseInt(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[11px] font-mono text-gray-500 mt-1">
                  <span>1 Acre</span>
                  <span>250</span>
                  <span>500</span>
                  <span>750</span>
                  <span>1,000 Acres</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Crop Evapotranspiration Coefficient ($K_c$ Preset):
                </label>
                <select
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/15 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="bell_pepper">Bell Pepper (Capsicum annuum) - Kc: 1.05</option>
                  <option value="corn">Field Corn / Maize - Kc: 1.15</option>
                  <option value="almond">Almond Orchard - Kc: 1.20</option>
                  <option value="vineyard">Wine Grape Vineyard - Kc: 0.70</option>
                  <option value="wheat">Winter Wheat - Kc: 1.10</option>
                </select>
              </div>
            </div>

            {/* Calculated Impact Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8">
              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/10 text-center">
                <Droplets className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <div className="text-3xl font-extrabold text-white font-mono">
                  {(waterSavedLiters / 1000000).toFixed(2)}M <span className="text-base text-gray-400">Liters</span>
                </div>
                <div className="text-xs font-mono text-emerald-300 mt-1">
                  ~{(waterSavedGallons / 1000).toFixed(0)}k Gallons Saved
                </div>
                <div className="text-[11px] text-gray-400 mt-1">Cumulative Season Water Conserved</div>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/10 text-center">
                <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                <div className="text-3xl font-extrabold text-white font-mono">
                  {energySavedKWh.toLocaleString()} <span className="text-base text-gray-400">kWh</span>
                </div>
                <div className="text-xs font-mono text-yellow-300 mt-1">
                  Pumping Electricity Saved
                </div>
                <div className="text-[11px] text-gray-400 mt-1">Avoids High Peak Irrigation Tariffs</div>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/10 text-center">
                <Leaf className="w-6 h-6 text-teal-400 mx-auto mb-2" />
                <div className="text-3xl font-extrabold text-white font-mono">
                  {co2AvoidedKg.toLocaleString()} <span className="text-base text-gray-400">kg</span>
                </div>
                <div className="text-xs font-mono text-teal-300 mt-1">
                  Avoided CO₂e Emissions
                </div>
                <div className="text-[11px] text-gray-400 mt-1">Submersible Well Pump Footprint</div>
              </div>
            </div>

            {/* Collapsible Scientific Drawer: FAO-56 Penman-Monteith Derivations */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <button
                onClick={() => setShowFaoDetails(!showFaoDetails)}
                className="w-full flex items-center justify-between text-xs font-mono text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                <span>[ SCIENTIFIC DISCLOSURE: FAO-56 PENMAN-MONTEITH MATHEMATICAL MODEL ]</span>
                {showFaoDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showFaoDetails && (
                <div className="mt-4 p-5 rounded-xl bg-zinc-950 border border-white/10 font-mono text-xs text-gray-300 space-y-3 animate-fadeIn">
                  <p className="text-emerald-300 font-bold">Standardized Reference Evapotranspiration Equation:</p>
                  <div className="p-3 bg-zinc-900 rounded-lg overflow-x-auto text-emerald-200">
                    ET₀ = [ 0.408·Δ·(Rₙ - G) + γ·(900 / (T + 273))·u₂·(eₛ - eₐ) ] / [ Δ + γ·(1 + 0.34·u₂) ]
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-gray-400 text-[11px]">
                    <li><strong className="text-gray-200">Rₙ:</strong> Net radiation flux at crop canopy (MJ m⁻² day⁻¹)</li>
                    <li><strong className="text-gray-200">G:</strong> Soil heat flux density (MJ m⁻² day⁻¹)</li>
                    <li><strong className="text-gray-200">T:</strong> Mean daily air temperature at 2 m (°C)</li>
                    <li><strong className="text-gray-200">u₂:</strong> Wind speed measured at 2 m height (m s⁻¹)</li>
                    <li><strong className="text-gray-200">eₛ - eₐ:</strong> Atmospheric vapor pressure deficit (VPD, kPa)</li>
                    <li><strong className="text-gray-200">Δ:</strong> Slope of saturation vapor pressure curve (kPa °C⁻¹)</li>
                    <li><strong className="text-gray-200">γ:</strong> Psychrometric constant (≈ 0.067 kPa °C⁻¹)</li>
                  </ul>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* 7. OUR JOURNEY, PROBLEM STATEMENT & EVOLUTION */}
      <section className="py-20 bg-[#080b09] border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs uppercase font-mono tracking-widest text-emerald-400 font-semibold">
              Research &amp; Prototyping Evolution
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
              From Corroded PCB Prototypes to Patent-Pending Pod
            </h2>
            <p className="text-gray-400 text-sm mt-2">
              How hands-on agronomic failure guided our mechanical, metallurgical, and edge architecture decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="glass-panel rounded-2xl p-6 border border-red-500/20 glass-card-hover">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4 font-mono font-bold">
                01
              </div>
              <h3 className="text-lg font-bold text-white">The Rapid Oxidation Failure</h3>
              <p className="text-gray-400 text-xs mt-2 leading-relaxed">
                Initial field tests with generic capacitive soil sensors (v1.2 FR4) resulted in total trace oxidation within 18 days in saline fertilizer soil ($EC &gt; 4$ dS/m). Furthermore, unshielded planar geometry captured stray electromagnetic noise from overhead drip wires.
              </p>
              <div className="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono text-red-400">
                ✗ 18-Day Lifespan | Erratic Drift
              </div>
            </div>

            {/* Card 2 */}
            <div className="glass-panel rounded-2xl p-6 border border-yellow-500/20 glass-card-hover">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 mb-4 font-mono font-bold">
                02
              </div>
              <h3 className="text-lg font-bold text-white">The Rural WAN Blackout Hazard</h3>
              <p className="text-gray-400 text-xs mt-2 leading-relaxed">
                Subsequent tests using pure cloud IoT platforms (AWS IoT &amp; ThingsBoard) suffered fatal outages during seasonal monsoon cellular dead-zones. A dropped socket left standard solenoid relays latched open for 14 hours, drowning crop roots in hypoxia.
              </p>
              <div className="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono text-yellow-400">
                ✗ Cloud Dependent | Single Point of Failure
              </div>
            </div>

            {/* Card 3 */}
            <div className="glass-panel rounded-2xl p-6 border border-emerald-500/30 glass-card-hover bg-emerald-950/20">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 mb-4 font-mono font-bold">
                03
              </div>
              <h3 className="text-lg font-bold text-white">The AgriSense-Edge Solution</h3>
              <p className="text-gray-300 text-xs mt-2 leading-relaxed">
                We engineered an Electroless Nickel Immersion Gold (ENIG 3μm) stepped probe with active operational-amplifier guard rings and moved all decision logic locally to a Raspberry Pi running Node-RED. 100% offline resilience was achieved with sub-120 ms latency.
              </p>
              <div className="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono text-emerald-400">
                ✓ Multi-Year Corrosion Proof | &lt;112ms Latency
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. DEDICATED RESEARCH PAPER CENTER (CLAUDE EDITORIAL STYLE) */}
      <section id="paper" className="py-20 bg-[#070908] border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-6 border-b border-white/10">
            <div>
              <span className="text-xs uppercase font-mono tracking-widest text-emerald-400 font-semibold">
                Academic Publication &amp; Manuscript Reader
              </span>
              <h2 className="text-3xl font-bold text-white font-serif mt-1">
                IEEE Research Paper Center
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                Full peer-reviewed manuscript: Double-column IEEEtran format with mathematical proofs and empirical findings.
              </p>
            </div>

            {/* Mode Switcher & Quick Actions */}
            <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
              <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setPaperViewMode('pdf')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center space-x-1.5 ${
                    paperViewMode === 'pdf'
                      ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Direct IEEE PDF</span>
                </button>
                <button
                  onClick={() => setPaperViewMode('editorial')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center space-x-1.5 ${
                    paperViewMode === 'editorial'
                      ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Editorial Web Reader</span>
                </button>
              </div>

              <a
                href={`${import.meta.env.BASE_URL}AgriSense_Edge_Research_Paper.pdf`}
                download="AgriSense_Edge_Research_Paper.pdf"
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-all flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </a>

              <a
                href={`${import.meta.env.BASE_URL}AgriSense_Edge_Research_Paper.pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-gray-200 font-mono text-xs border border-white/10 transition-colors flex items-center space-x-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                <span>Fullscreen</span>
              </a>
            </div>
          </div>

          {paperViewMode === 'pdf' ? (
            <div className="space-y-4">
              {/* PDF Header Status Banner */}
              <div className="glass-panel rounded-2xl p-4 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    Live Document: AgriSense_Edge_Research_Paper.pdf (Recompiled with Table I at Top of Page 4)
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <a
                    href={`${import.meta.env.BASE_URL}AgriSense_Edge_Research_Paper.pdf#page=4`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono transition-colors flex items-center space-x-1.5"
                  >
                    <span>Jump to Table I (Page 4)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-gray-300 font-mono text-xs border border-white/10 transition-colors flex items-center space-x-1.5"
                  >
                    <Printer className="w-3 h-3 text-emerald-400" />
                    <span>Print View</span>
                  </button>
                </div>
              </div>

              {/* Direct PDF Iframe Container */}
              <div className="w-full h-[950px] rounded-2xl overflow-hidden border border-emerald-500/30 shadow-2xl bg-zinc-950 relative">
                <iframe
                  src={`${import.meta.env.BASE_URL}AgriSense_Edge_Research_Paper.pdf#toolbar=1&navpanes=1&scrollbar=1&page=1`}
                  title="AgriSense-Edge IEEE Academic Research Paper"
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sticky Table of Contents Sidebar */}
            <div className="hidden lg:block lg:col-span-3">
              <div className="sticky top-24 glass-panel rounded-2xl p-5 border border-white/10 text-xs space-y-2">
                <div className="font-mono text-emerald-400 uppercase font-bold tracking-wider mb-3">
                  Contents (13 Sections)
                </div>
                <a href="#p-sec1" className="block text-gray-300 hover:text-emerald-400 py-1 transition-colors">1. Introduction &amp; Context</a>
                <a href="#p-sec2" className="block text-gray-300 hover:text-emerald-400 py-1 transition-colors">2. Literature Review</a>
                <a href="#p-sec3" className="block text-gray-300 hover:text-emerald-400 py-1 transition-colors">3. Research Gap</a>
                <a href="#p-sec4" className="block text-gray-300 hover:text-emerald-400 py-1 transition-colors">4. Objectives &amp; 5. RQs</a>
                <a href="#p-sec6" className="block text-gray-300 hover:text-emerald-400 py-1 transition-colors">6. Research Hypotheses</a>
                <a href="#p-sec7" className="block text-gray-300 hover:text-emerald-400 py-1 transition-colors">7. Hardware &amp; Patent Claims</a>
                <a href="#p-sec8" className="block text-gray-300 hover:text-emerald-400 py-1 transition-colors">8. Mathematical Models</a>
                <a href="#p-sec9" className="block text-gray-300 hover:text-emerald-400 py-1 transition-colors">9. Empirical Findings</a>
                <a href="#p-sec10" className="block text-gray-300 hover:text-emerald-400 py-1 transition-colors">10. Scope &amp; Significance</a>
                <a href="#p-sec11" className="block text-gray-300 hover:text-emerald-400 py-1 transition-colors">11. Limitations</a>
                <a href="#p-sec12" className="block text-gray-300 hover:text-emerald-400 py-1 transition-colors">12. Conclusion</a>
                <a href="#p-sec13" className="block text-gray-300 hover:text-emerald-400 py-1 transition-colors">13. References (16 Works)</a>
              </div>
            </div>

            {/* Manuscript Reader: Claude Editorial Aesthetic */}
            <div className="lg:col-span-9 academic-paper rounded-2xl p-8 sm:p-12 text-[#1a1a18] font-serif shadow-2xl">
              {/* Paper Title & Authors */}
              <div className="text-center pb-8 border-b border-gray-300">
                <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-800 font-bold">
                  IEEE TRANSACTIONS ON AGRIFOOD ELECTRONICS — OCTOBER 2026
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold mt-3 leading-tight text-gray-900">
                  Edge-Decoupled Autonomous Micro-Irrigation and Soil Dynamics Monitoring: A Multi-Depth Capacitive Impedance and Node-RED Architecture
                </h1>
                <div className="mt-4 text-xs font-sans text-gray-700 space-y-1">
                  <p className="font-semibold text-gray-900">
                    Aurosri Arman Panigrahi, Aayush Saha, Ayush Pradhan, Ayush Das, and Kumar Mimanshu Singh
                  </p>
                  <p className="text-gray-600">
                    Department of Computer Science and Engineering, KIIT University, Bhubaneswar, India
                  </p>
                  <p className="font-mono text-[11px] text-emerald-800">
                    Patent Pending | IPC Classification: A01G 25/16 (Agricultural Watering Control)
                  </p>
                </div>
              </div>

              {/* Abstract & Keywords */}
              <div className="py-6 border-b border-gray-300 text-xs sm:text-sm leading-relaxed text-gray-800">
                <p>
                  <strong><em>Abstract</em>—Agricultural irrigation consumes approximately 70% of global freshwater withdrawals, with up to 45% lost to sub-optimal timer scheduling and deep drainage. While cloud-centric IoT frameworks have emerged, their reliance on wide-area cellular connectivity renders them fragile in remote rural terrains where network blackouts cause prolonged irrigation failures. This paper introduces the AgriSense-Edge Pod™, an autonomous micro-irrigation pod operating with 100% offline edge resilience. The hardware comprises a 50 cm stepped cylindrical probe with three gold-immersion (ENIG) annular capacitive sensing rings at 10 cm, 30 cm, and 50 cm, shielded by active guard rings and coupled to an integrated 12V pulse-latching solenoid valve. Across a 60-day trial against traditional timer drip, the proposed edge system demonstrated a 34.2% reduction in freshwater consumption, maintained a closed-loop decision latency of &lt;112 ms, and achieved 100% operational uptime during simulated 72-hour broadband internet severance.</strong>
                </p>
                <div className="mt-3 font-sans text-[11px] text-gray-600">
                  <strong>Keywords:</strong> Capacitive impedance sensing, edge computing, FAO-56 Penman-Monteith, hysteretic control, Node-RED, offline IoT, precision agriculture.
                </div>
              </div>

              {/* Section 1 */}
              <div id="p-sec1" className="py-6 border-b border-gray-200">
                <h3 className="font-sans font-bold text-sm tracking-wide text-gray-900 uppercase">
                  I. Introduction &amp; Background
                </h3>
                <p className="text-xs sm:text-sm mt-3 leading-relaxed text-gray-800">
                  Freshwater scarcity represents one of the most pressing existential bottlenecks confronting modern civilization. According to the United Nations Food and Agriculture Organization (FAO), global agrarian activities account for nearly 70% of all anthropogenic freshwater extractions. Soil moisture dynamics within cultivated fields exhibit vertical stratification across the surface layer (0-10 cm), active rhizosphere zone (10-30 cm), and deep drainage zone (30-50 cm). In rural farms, broadband cellular connectivity drops frequently; decoupling the sensory-decision-actuation loop from remote cloud dependencies is paramount.
                </p>
              </div>

              {/* Section 2 */}
              <div id="p-sec2" className="py-6 border-b border-gray-200">
                <h3 className="font-sans font-bold text-sm tracking-wide text-gray-900 uppercase">
                  II. Literature Review
                </h3>
                <p className="text-xs sm:text-sm mt-3 leading-relaxed text-gray-800">
                  Time Domain Reflectometry (TDR) instruments (such as Meter Group TEROS and Sentek Drill&amp;Drop) achieve high accuracy (RMSE &lt; 0.02 m³/m³) but suffer from prohibitive costs (&gt;$1,200). In contrast, cheap open-hardware capacitive probes corrode rapidly in saline fertilizers within 18 days. Node-RED serves as an asynchronous event-driven visual runtime capable of executing sub-second logic on on-farm edge gateways.
                </p>
              </div>

              {/* Section 3 */}
              <div id="p-sec3" className="py-6 border-b border-gray-200">
                <h3 className="font-sans font-bold text-sm tracking-wide text-gray-900 uppercase">
                  III. Research Gap
                </h3>
                <p className="text-xs sm:text-sm mt-3 leading-relaxed text-gray-800">
                  Existing solutions force farmers into a compromise: either pay thousands for closed cloud systems vulnerable to rural cellular blackouts, or deploy cheap hobbyist sensors that corrode rapidly and lack vertical multi-depth profiling with direct valve actuation.
                </p>
              </div>

              {/* Section 4 & 5 */}
              <div id="p-sec4" className="py-6 border-b border-gray-200">
                <h3 className="font-sans font-bold text-sm tracking-wide text-gray-900 uppercase">
                  IV. Objectives &amp; V. Research Questions
                </h3>
                <p className="text-xs sm:text-sm mt-3 leading-relaxed text-gray-800">
                  <strong>RQ1:</strong> Can an ENIG-treated annular capacitive sensing array achieve volumetric water content estimation accuracy of RMSE &lt; 0.03 m³/m³? <br />
                  <strong>RQ2:</strong> Does an on-premises Node-RED edge pipeline maintain deterministic actuation latency below 120 ms during complete WAN disconnection? <br />
                  <strong>RQ3:</strong> Can a tri-strata hysteretic decision policy reduce cumulative water consumption by ≥30% relative to timer drip systems?
                </p>
              </div>

              {/* Section 6 */}
              <div id="p-sec6" className="py-6 border-b border-gray-200">
                <h3 className="font-sans font-bold text-sm tracking-wide text-gray-900 uppercase">
                  VI. Research Hypotheses
                </h3>
                <p className="text-xs sm:text-sm mt-3 font-mono text-gray-800 bg-gray-100 p-3 rounded">
                  H₀ : μ_AgriSense ≥ μ_Control (ΔW ≤ 0) <br />
                  H₁ : μ_AgriSense &lt; μ_Control (ΔW ≥ 30%, p &lt; 0.05)
                </p>
              </div>

              {/* Section 7 */}
              <div id="p-sec7" className="py-6 border-b border-gray-200">
                <h3 className="font-sans font-bold text-sm tracking-wide text-gray-900 uppercase">
                  VII. Hardware Architecture &amp; Formal Patent Claims
                </h3>
                <p className="text-xs sm:text-sm mt-3 leading-relaxed text-gray-800">
                  <strong>Patent Claim 1 (IPC A01G 25/16):</strong> A modular in-situ soil dynamics monitoring pod comprising: a stepped cylindrical dielectric housing; an array of annular capacitive sensing rings at predetermined vertical depth intervals; active electrical guard rings configured to neutralize stray fringe-field capacitance (V_guard = V_sense); and a bi-stable pulse-latching solenoid valve integrated directly into an upper head flange.
                </p>
              </div>

              {/* Section 8 */}
              <div id="p-sec8" className="py-6 border-b border-gray-200">
                <h3 className="font-sans font-bold text-sm tracking-wide text-gray-900 uppercase">
                  VIII. Mathematical Modeling &amp; Node-RED Logic
                </h3>
                <p className="text-xs sm:text-sm mt-3 leading-relaxed text-gray-800">
                  Cubic calibration polynomial: $\theta(z) = a\varepsilon_b^3 + b\varepsilon_b^2 + c\varepsilon_b + d$. <br />
                  Closed-loop hysteresis state machine:
                </p>
                <div className="p-3 my-2 bg-gray-100 rounded text-xs font-mono text-gray-900">
                  Valve State = OPEN if (θ₁₀ &lt; θ_PWP and θ₅₀ &lt; θ_Drainage) <br />
                  Valve State = CLOSED if (θ₃₀ ≥ θ_FC or θ₅₀ ≥ θ_Drainage)
                </div>
              </div>

              {/* Section 9: Comparative Table */}
              <div id="p-sec9" className="py-6 border-b border-gray-200">
                <h3 className="font-sans font-bold text-sm tracking-wide text-gray-900 uppercase">
                  IX. Empirical Findings &amp; Comparative Results
                </h3>
                <div className="overflow-x-auto mt-4 font-sans text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-900 font-bold">
                        <th className="py-2">Metric</th>
                        <th className="py-2">Plot A (Control)</th>
                        <th className="py-2">Plot B (Commercial)</th>
                        <th className="py-2 text-emerald-900">Plot C (AgriSense-Edge)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="py-2 font-medium">Cumulative Water (L)</td>
                        <td>42,850</td>
                        <td>30,120</td>
                        <td className="font-bold text-emerald-800">28,190 (-34.2%)</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-medium">Closed-Loop Latency</td>
                        <td>N/A (Timer)</td>
                        <td>1,840 ms</td>
                        <td className="font-bold text-emerald-800">112 ms</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-medium">Uptime in 72h Outage</td>
                        <td>100% (Open-Loop)</td>
                        <td>24.3% (Frozen)</td>
                        <td className="font-bold text-emerald-800">100% (Active)</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-medium">Deep Leaching Events</td>
                        <td>47</td>
                        <td>12</td>
                        <td className="font-bold text-emerald-800">2</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-medium">Crop Yield (kg/m²)</td>
                        <td>4.12</td>
                        <td>4.88</td>
                        <td className="font-bold text-emerald-800">4.95</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 10 - 13 */}
              <div id="p-sec10" className="py-6 space-y-4">
                <h3 className="font-sans font-bold text-sm tracking-wide text-gray-900 uppercase">
                  X. Scope, XI. Limitations &amp; XII. Conclusion
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed text-gray-800">
                  AgriSense-Edge validates that precision micro-irrigation can be reliably democratized for smallholder farms with zero recurring cloud subscription costs. Limitations include dielectric shifts in extreme salinity ($EC &gt; 8$ dS/m) and edge gateway continuous power requirements ($2.5$ W), addressed via localized solar substations.
                </p>
                <div id="p-sec13" className="pt-4 border-t border-gray-200">
                  <h4 className="font-sans font-bold text-xs uppercase text-gray-700">References (Selected)</h4>
                  <ol className="list-decimal pl-5 text-[11px] text-gray-600 space-y-1 mt-2">
                    <li>R. G. Allen et al., <em>Crop Evapotranspiration</em>, FAO Paper 56, 1998.</li>
                    <li>D. Gao et al., <em>Computers and Electronics in Agriculture</em>, 2022.</li>
                    <li>M. O. Ojo &amp; A. Zahid, <em>IEEE Access</em>, vol. 9, 2021.</li>
                    <li>G. Vellidis et al., <em>Agricultural Water Management</em>, 2016.</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </section>

      {/* 9. UPCOMING FARMBUDDY AI MOBILE APP SECTION */}
      <section id="farmbuddy" className="py-20 bg-[#080a09] border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left: Smartphone Mockup */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-72 rounded-[40px] bg-zinc-950 p-3.5 border-4 border-zinc-700 shadow-2xl relative">
                {/* Dynamic Island / Notch */}
                <div className="w-24 h-5 bg-black rounded-full mx-auto mb-3 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-900" />
                </div>

                {/* Smartphone Screen Content */}
                <div className="rounded-[30px] bg-[#0c120e] p-4 text-white space-y-4 border border-white/5 font-sans">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-emerald-400">FarmBuddy AI</span>
                    <span className="text-[10px] font-mono text-gray-400">Pod #01 Connected</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-950 to-zinc-900 border border-emerald-500/30">
                    <div className="text-[10px] text-gray-400">AI Crop Doctor Recommendation</div>
                    <div className="text-xs font-bold text-white mt-1">Optimal Transpiration</div>
                    <p className="text-[10px] text-gray-300 mt-1">
                      "Surface moisture is holding at 22%. Solar irradiance expected to peak at 13:00. Local valve scheduled for brief 4-minute micro-burst at 15:30."
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-zinc-900 border border-white/5">
                      <div className="text-[9px] text-gray-400">Local Wi-Fi Sync</div>
                      <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">100% Direct</div>
                    </div>
                    <div className="p-2 rounded-xl bg-zinc-900 border border-white/5">
                      <div className="text-[9px] text-gray-400">Voice Agronomist</div>
                      <div className="text-xs font-mono font-bold text-teal-400 mt-0.5">Ready</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs font-mono">
                    <span>Valve State:</span>
                    <span className="text-emerald-400 font-bold">STANDBY</span>
                  </div>
                </div>

                {/* Home Indicator */}
                <div className="w-32 h-1 bg-zinc-600 rounded-full mx-auto mt-4" />
              </div>
            </div>

            {/* Right: FarmBuddy AI Features & Beta Registration */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-400">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Next-Gen Companion App</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                FarmBuddy AI: Pocket Agronomist for Offline Fields
              </h2>

              <p className="text-gray-300 text-sm leading-relaxed">
                Connect directly to your local Node-RED edge gateway over offline on-farm Wi-Fi. Access conversational crop diagnostics, calibrate soil specific VWC curves, and monitor multi-depth percolation charts without needing cellular broadband.
              </p>

              {/* Beta Registration Form */}
              <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
                <div className="text-xs font-mono text-emerald-400 font-bold uppercase">
                  Join FarmBuddy Early Beta Program
                </div>

                {/* Platform Toggle */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setBetaPlatform('ios')}
                    className={`px-4 py-2 rounded-xl text-xs font-mono transition-all ${
                      betaPlatform === 'ios'
                        ? 'bg-emerald-500 text-black font-bold shadow'
                        : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    Apple TestFlight (iOS)
                  </button>
                  <button
                    onClick={() => setBetaPlatform('android')}
                    className={`px-4 py-2 rounded-xl text-xs font-mono transition-all ${
                      betaPlatform === 'android'
                        ? 'bg-emerald-500 text-black font-bold shadow'
                        : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    Google Play Beta (Android)
                  </button>
                </div>

                {/* Email Input */}
                {betaSubmitted ? (
                  <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300 flex items-center space-x-2 font-mono">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Invitation reserved for {betaEmail}! TestFlight build will be dispatched upon gateway link.</span>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (betaEmail) setBetaSubmitted(true);
                    }}
                    className="flex flex-col sm:flex-row gap-3"
                  >
                    <input
                      type="email"
                      required
                      placeholder="Enter agronomist / researcher email..."
                      value={betaEmail}
                      onChange={(e) => setBetaEmail(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl bg-zinc-900 border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="submit"
                      className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-all shadow-lg shadow-emerald-500/25"
                    >
                      Request Invite
                    </button>
                  </form>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 10. SETUP HANDBOOK MODAL */}
      {handbookOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel-elevated rounded-2xl max-w-2xl w-full p-6 border border-emerald-500/30 space-y-4 max-h-[90vh] overflow-y-auto font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-white text-base">AgriSense-Edge Installation &amp; Core-Boring Handbook</span>
              </div>
              <button
                onClick={() => setHandbookOpen(false)}
                className="text-gray-400 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-gray-300 leading-relaxed font-sans">
              <div className="p-3 bg-zinc-900/80 rounded-xl border border-white/10">
                <h4 className="font-bold text-emerald-400 text-sm">Step 1: Representative Soil Core Boring</h4>
                <p className="mt-1">
                  Using a 45 mm diameter hand auger, bore a clean vertical core 52 cm deep within the active crop drip zone (approximately 25 cm from main crop stem). Segregate extracted soil layers by depth to maintain accurate backfill compaction.
                </p>
              </div>

              <div className="p-3 bg-zinc-900/80 rounded-xl border border-white/10">
                <h4 className="font-bold text-emerald-400 text-sm">Step 2: Probe Insertion &amp; Slurry Sealing</h4>
                <p className="mt-1">
                  Insert the stepped AgriSense-Edge Pod cylindrical shaft gently into the bore hole. Mix extracted soil with water to form a native slurry; pour around the annular ENIG rings to ensure 100% dielectric contact with zero air gaps.
                </p>
              </div>

              <div className="p-3 bg-zinc-900/80 rounded-xl border border-white/10">
                <h4 className="font-bold text-emerald-400 text-sm">Step 3: Drip Tubing Quick-Flange Coupling</h4>
                <p className="mt-1">
                  Snap the 16 mm lateral polyethylene drip line directly into the probe's upper quick-connect flange. Connect the 12V pulse-latching solenoid valve leads to the integrated field MCU.
                </p>
              </div>

              <div className="p-3 bg-zinc-900/80 rounded-xl border border-white/10">
                <h4 className="font-bold text-emerald-400 text-sm">Step 4: Node-RED Gateway Commissioning</h4>
                <p className="mt-1">
                  Power on the Raspberry Pi edge gateway. Mosquitto MQTT will bind to <code className="text-emerald-300">0.0.0.0:1883</code>. Node-RED will immediately start parsing telemetry packets and orchestrating hysteretic micro-irrigation autonomously.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                onClick={handleDownloadHandbook}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-all flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Setup Guide (.md)</span>
              </button>
              <button
                onClick={() => setHandbookOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-gray-300 font-mono text-xs border border-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. FOOTER */}
      <footer className="mt-auto py-12 bg-black border-t border-white/10 text-xs font-mono text-gray-500">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400 flex items-center justify-center">
                <Leaf className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <span className="text-white font-bold tracking-tight">AgriSense-Edge Pod™</span>
                <span className="text-gray-400 ml-2">| Patent Pending IPC A01G 25/16</span>
              </div>
            </div>

            <div className="text-center md:text-right text-gray-400">
              <p className="text-gray-300 font-semibold">
                KIIT University — Department of Computer Science and Engineering
              </p>
              <p className="text-[11px] text-gray-500 mt-1">
                Research Team: Aurosri Arman Panigrahi, Aayush Saha, Ayush Pradhan, Ayush Das, Kumar Mimanshu Singh
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-600 gap-4">
            <div>
              &copy; {new Date().getFullYear()} AgriSense-Edge Research Collective. Open-Access Agritech Architecture.
            </div>
            <div className="flex space-x-6">
              <a href="#hero" className="hover:text-emerald-400 transition-colors">Top</a>
              <a href="#pipeline" className="hover:text-emerald-400 transition-colors">Dataflow</a>
              <a href="#simulator" className="hover:text-emerald-400 transition-colors">Kaggle Studio</a>
              <a href="#paper" className="hover:text-emerald-400 transition-colors">Manuscript</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
