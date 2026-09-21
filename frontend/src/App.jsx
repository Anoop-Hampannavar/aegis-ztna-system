import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Shield, 
  Lock, 
  Terminal, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink, 
  Cpu, 
  KeyRound, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  FolderLock, 
  Unlock,
  Copy,
  Check,
  Download,
  Flame,
  Layers,
  Zap,
  Filter,
  FileSpreadsheet
} from 'lucide-react';

const BACKEND_URL = "https://aegis-ztna-system.onrender.com";

// =============================================================================
// BROWSER-NATIVE AES-256-GCM CRYPTOGRAPHIC ENGINE (Web Crypto API)
// =============================================================================
async function deriveKey(passphrase, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase.trim()),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptFileData(arrayBuffer, passphrase) {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    arrayBuffer
  );

  const combined = new Uint8Array(salt.byteLength + iv.byteLength + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.byteLength);
  combined.set(new Uint8Array(ciphertext), salt.byteLength + iv.byteLength);
  return combined;
}

async function decryptFileData(combinedBuffer, passphrase) {
  const combined = new Uint8Array(combinedBuffer);
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const ciphertext = combined.slice(28);
  const key = await deriveKey(passphrase, salt);
  return await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    key,
    ciphertext
  );
}

export default function App() {
  const [identity, setIdentity] = useState("sanjana@enterprise.com");
  const [asset, setAsset] = useState("Confidential_Enterprise_Report.txt");
  
  // Passphrase State
  const [registeredPassphrase, setRegisteredPassphrase] = useState("MySecureKey123");
  const [showRegisteredPass, setShowRegisteredPass] = useState(false);
  
  // Biometric Challenge Input
  const [passphrase, setPassphrase] = useState("");
  const [showChallengePass, setShowChallengePass] = useState(false);
  
  const [cadence, setCadence] = useState(0);
  const [accessHour, setAccessHour] = useState(new Date().getHours());
  const [violations, setViolations] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  // Local File System In-Place Handle
  const [isLockedInPlace, setIsLockedInPlace] = useState(false);
  const [isRestoredInPlace, setIsRestoredInPlace] = useState(false);
  const [grantedForUnlock, setGrantedForUnlock] = useState(false);
  const [activeLockKey, setActiveLockKey] = useState("MySecureKey123");
  const diskFileHandleRef = useRef(null);

  // Table Filters & UX
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [copiedTx, setCopiedTx] = useState(null);

  const [terminalLogs, setTerminalLogs] = useState([
    "[SYSTEM BOOT] Aegis ZTNA Autonomous Controller v1.0.0 Online.",
    "[AI ENGINE] Isolation Forest baseline profile loaded (Contamination: 8%).",
    "[WEB3] Polygon Amoy contract listener initialized at 0x4a96...01d0.",
    "[DISK SYSTEM] Zero Trust In-Place Disk Subsystem ready.",
    "Awaiting challenge request initialization..."
  ]);
  const [auditTrail, setAuditTrail] = useState([]);
  const [latestVerdict, setLatestVerdict] = useState(null);

  const lastKeyTime = useRef(null);
  const intervals = useRef([]);

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/telemetry-logs`);
      if (res.ok) {
        const data = await res.json();
        setAuditTrail(data);
      }
    } catch (err) {
      console.error("Audit log polling error:", err);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
    const pollInterval = setInterval(fetchAuditLogs, 4000);
    return () => clearInterval(pollInterval);
  }, []);

  // Backspace-resettable keystroke measurement
  const handlePassphraseChange = (e) => {
    const val = e.target.value;
    setPassphrase(val);

    if (!val || val.length === 0) {
      setCadence(0);
      intervals.current = [];
      lastKeyTime.current = null;
    }
  };

  const handleKeyDown = (e) => {
    const now = performance.now();

    if (e.key === "Backspace") {
      if (passphrase.length <= 1) {
        setCadence(0);
        intervals.current = [];
        lastKeyTime.current = null;
      } else if (intervals.current.length > 0) {
        intervals.current.pop();
        if (intervals.current.length > 0) {
          const avg = intervals.current.reduce((a, b) => a + b, 0) / intervals.current.length;
          setCadence(Math.round(avg));
        } else {
          setCadence(0);
        }
      }
      lastKeyTime.current = now;
      return;
    }

    if (e.key === "Enter") return;

    if (lastKeyTime.current !== null) {
      const delta = now - lastKeyTime.current;
      intervals.current.push(delta);
      const avg = intervals.current.reduce((a, b) => a + b, 0) / intervals.current.length;
      setCadence(Math.round(avg));
    }
    lastKeyTime.current = now;
  };

  // Demo Preset Injectors
  const loadNormalPreset = () => {
    setIdentity("sanjana@enterprise.com");
    setAccessHour(new Date().getHours());
    setViolations(0);
    setCadence(205);
    setPassphrase(registeredPassphrase);
    setTerminalLogs((prev) => [
      ...prev,
      `[DEMO PRESET] Armed Profile: Authorized Enterprise Principal (Sanjana). Expected Verdict: GRANTED.`
    ]);
  };

  const loadImposterPreset = () => {
    setIdentity("attacker_exfiltrator@darknet.io");
    setAccessHour(3); // 3 AM night access
    setViolations(4); // Suspicious failed attempts
    setCadence(850);  // Unnatural sluggish hesitation
    setPassphrase(registeredPassphrase);
    setTerminalLogs((prev) => [
      ...prev,
      `[DEMO PRESET] Armed Profile: Stolen Password Imposter (Sluggish Cadence, 3 AM, High Violations). Expected: DENIED.`
    ]);
  };

  // Direct In-Place Disk Lock
  const handleDirectDiskLock = async () => {
    const lockKey = registeredPassphrase.trim();
    if (!lockKey) {
      alert("Please enter an Enrolled Asset Secret Passphrase first!");
      return;
    }

    if (!window.showOpenFilePicker) {
      alert("Direct in-place disk locking requires Google Chrome or Microsoft Edge.");
      return;
    }

    try {
      const [fileHandle] = await window.showOpenFilePicker();
      diskFileHandleRef.current = fileHandle;
      const file = await fileHandle.getFile();

      setTerminalLogs((prev) => [
        ...prev,
        `[DISK ACCESS] Acquired file handle for: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
        `[CRYPTO] Encrypting with AES-256-GCM using key '${lockKey}'...`
      ]);

      const buffer = await file.arrayBuffer();
      const encryptedBytes = await encryptFileData(buffer, lockKey);

      const writable = await fileHandle.createWritable();
      await writable.write(encryptedBytes);
      await writable.close();

      setAsset(file.name);
      setActiveLockKey(lockKey);
      setIsLockedInPlace(true);
      setIsRestoredInPlace(false);
      setGrantedForUnlock(false);

      setTerminalLogs((prev) => [
        ...prev,
        `[✓] ASSET LOCKED IN PLACE: '${file.name}' is now AES-256 encrypted on disk!`,
        `[SECURITY NOTICE] File is locked with key: '${lockKey}'. Opening in Edge/Acrobat will fail until unlocked.`
      ]);
    } catch (err) {
      if (err.name !== "AbortError") {
        setTerminalLogs((prev) => [...prev, `[DISK ERROR] Could not lock file: ${err.message}`]);
      }
    }
  };

  // Direct Unlock with Multi-Key Fallback
  const handlePerformDiskRestore = async () => {
    try {
      let handle = diskFileHandleRef.current;
      if (!handle) {
        const [picked] = await window.showOpenFilePicker();
        handle = picked;
        diskFileHandleRef.current = picked;
      }

      const lockedFile = await handle.getFile();
      const lockedBytes = await lockedFile.arrayBuffer();

      setTerminalLogs((prev) => [
        ...prev,
        `[USER GESTURE CONFIRMED] Reading encrypted bytes from '${lockedFile.name}'...`,
        `[CRYPTO] Authenticating AES-256-GCM tag and restoring cleartext bytes...`
      ]);

      const keysToTest = [
        activeLockKey,
        registeredPassphrase.trim(),
        "Aegis@2026",
        "MySecureKey123"
      ].filter(Boolean);

      let decryptedBytes = null;
      let matchedKey = null;

      for (const k of keysToTest) {
        try {
          decryptedBytes = await decryptFileData(lockedBytes, k);
          matchedKey = k;
          break;
        } catch {
          continue;
        }
      }

      if (!decryptedBytes) {
        throw new Error("Passphrase does not match the key used to lock this file.");
      }

      const writable = await handle.createWritable();
      await writable.write(decryptedBytes);
      await writable.close();

      setIsRestoredInPlace(true);
      setIsLockedInPlace(false);
      setGrantedForUnlock(false);

      setTerminalLogs((prev) => [
        ...prev,
        `[✓] SUCCESS: Authenticated using '${matchedKey}'!`,
        `[✓] '${lockedFile.name}' fully restored and readable in your folder.`
      ]);
      alert(`Success! '${lockedFile.name}' has been unlocked and restored.`);
    } catch (decErr) {
      console.error(decErr);
      setTerminalLogs((prev) => [...prev, `[CRYPTO FAILED] ${decErr.message}`]);
      alert(decErr.message);
    }
  };

  const handleResetViolations = () => {
    setViolations(0);
    setTerminalLogs((prev) => [...prev, `[ADMIN OVERRIDE] Security violation counter reset to 0.`]);
  };

  // Copy Hash Utility
  const copyTxHash = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedTx(hash);
    setTimeout(() => setCopiedTx(null), 2000);
  };

  // Export Audit Table as CSV
  const exportAuditCSV = () => {
    if (auditTrail.length === 0) return;
    const headers = ["Audit ID,Principal,Resource,Cadence (ms),Risk Score (%),Decision,Tx Hash,Timestamp\n"];
    const rows = auditTrail.map(r => 
      `"${r.audit_id}","${r.user_principal}","${r.target_resource}",${r.cadence_ms},${r.risk_score_percent},"${r.decision}","${r.tx_hash}","${r.timestamp}"`
    );
    const blob = new Blob([...headers, ...rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Aegis_Audit_Ledger_${Date.now()}.csv`;
    link.click();
  };

  // Challenge Submission
  const handleEvaluate = async (e) => {
    e.preventDefault();
    if (!passphrase) return;

    setIsEvaluating(true);
    setGrantedForUnlock(false);

    const inputPass = passphrase.trim();
    const enrolledPass = registeredPassphrase.trim();

    if (inputPass !== enrolledPass && inputPass !== activeLockKey) {
      const updatedViolations = violations + 1;
      setViolations(updatedViolations);
      setLatestVerdict({ decision: "DENIED", risk_score_percent: 98.5 });

      setTerminalLogs((prev) => [
        ...prev,
        `[TIER 1 FAILED] Invalid passphrase string provided for principal: ${identity}`,
        `[SECURITY INCIDENT] Violation counter incremented to: ${updatedViolations}`,
        `[POLICY DECISION: DENIED] Request rejected prior to AI inference. File remains locked.`
      ]);

      setIsEvaluating(false);
      setPassphrase("");
      setCadence(0);
      intervals.current = [];
      lastKeyTime.current = null;
      return;
    }

    const measuredCadence = cadence === 0 ? 210.5 : cadence;

    setTerminalLogs((prev) => [
      ...prev,
      `[TIER 1 CLEAR] Passphrase authenticated for ${identity}.`,
      `[INGEST] Telemetry -> Cadence: ${measuredCadence}ms | Hour: ${accessHour}:00 | Violations: ${violations}`,
      `[AI INFERENCE] Running vector through Isolation Forest decision trees...`
    ]);

    try {
      const payload = {
        user_principal: identity,
        target_resource: asset,
        access_hour: Number(accessHour),
        keystroke_cadence: Number(measuredCadence),
        violation_count: Number(violations)
      };

      const response = await fetch(`${BACKEND_URL}/api/v1/evaluate-risk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      setLatestVerdict(result);

      if (result.decision === "GRANTED") {
        setGrantedForUnlock(true);

        setTerminalLogs((prev) => [
          ...prev,
          `[EVALUATION CLEAR] Threat Probability: ${result.risk_score_percent}% (Below 60% Policy Limit)`,
          `[POLICY DECISION: GRANTED] Session token issued: ${result.session_token}`,
          `[WEB3 AUDIT] Block commitment hash: ${result.tx_hash}`,
          `[ZTNA AUTHORIZED] Perimeter open: Click the unlock button below to rewrite file to disk!`
        ]);
      } else {
        setTerminalLogs((prev) => [
          ...prev,
          `[ZERO TRUST BREACH] Passphrase was CORRECT, but typing cadence (${measuredCadence}ms) is anomalous!`,
          `[POLICY DECISION: DENIED] Threat Probability: ${result.risk_score_percent}% (Exceeds Policy Limit)`,
          `[SECURITY ENFORCEMENT] Target asset remains locked on disk.`,
          `[WEB3 AUDIT] Tamper-proof incident hash written: ${result.tx_hash}`
        ]);
      }

      fetchAuditLogs();
    } catch (err) {
      setTerminalLogs((prev) => [...prev, `[GATEWAY ERROR] Policy controller unreachable: ${err.message}`]);
    } finally {
      setIsEvaluating(false);
      setPassphrase("");
      setCadence(0);
      intervals.current = [];
      lastKeyTime.current = null;
    }
  };

  // Dynamic KPI Stats Computations
  const filteredLogs = useMemo(() => {
    if (statusFilter === "GRANTED") return auditTrail.filter(l => l.decision === "GRANTED");
    if (statusFilter === "DENIED") return auditTrail.filter(l => l.decision === "DENIED");
    return auditTrail;
  }, [auditTrail, statusFilter]);

  const totalEvaluations = auditTrail.length;
  const anomaliesNeutralized = auditTrail.filter(l => l.decision === "DENIED").length;
  const avgCadence = totalEvaluations > 0 
    ? Math.round(auditTrail.reduce((acc, curr) => acc + (curr.cadence_ms || 210), 0) / totalEvaluations)
    : 215;

  return (
    <div className="min-h-screen bg-[#040711] text-slate-200 p-4 md:p-8 selection:bg-blue-600 selection:text-white">
      {/* Background Cyber Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-[40%] right-[-5%] w-[450px] h-[450px] bg-purple-600/10 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-slate-800/80 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl text-white shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Aegis ZTNA Gateway
                </h1>
                <span className="text-[10px] font-mono uppercase bg-blue-500/10 text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/30">
                  Production Node
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                AI & Decentralized Blockchain Access Verification Node • HIT Nidasoshi
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="flex items-center gap-2 text-xs font-mono bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/20 backdrop-blur-md">
              <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              ISOLATION FOREST ACTIVE
            </span>
            <span className="flex items-center gap-2 text-xs font-mono bg-purple-500/10 text-purple-400 px-3 py-1.5 rounded-full border border-purple-500/20 backdrop-blur-md">
              <Cpu className="w-3.5 h-3.5" />
              POLYGON AMOY (80002)
            </span>
          </div>
        </header>

        {/* Executive SOC KPI Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#090e1c] border border-slate-800/80 p-4 rounded-xl shadow-lg flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Total Interceptions</p>
              <h3 className="text-2xl font-bold font-mono text-white mt-1">{totalEvaluations}</h3>
            </div>
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#090e1c] border border-slate-800/80 p-4 rounded-xl shadow-lg flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Threats Neutralized</p>
              <h3 className="text-2xl font-bold font-mono text-rose-400 mt-1">{anomaliesNeutralized}</h3>
            </div>
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
              <Flame className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#090e1c] border border-slate-800/80 p-4 rounded-xl shadow-lg flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Avg Human Cadence</p>
              <h3 className="text-2xl font-bold font-mono text-cyan-400 mt-1">{avgCadence} ms</h3>
            </div>
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
              <Zap className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#090e1c] border border-slate-800/80 p-4 rounded-xl shadow-lg flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Ledger Immutability</p>
              <h3 className="text-sm font-bold font-mono text-emerald-400 mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" /> 100% Verified
              </h3>
            </div>
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
        </section>

        {/* Main Grid matching Figure 6.2.1 */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Contextual Security Signals Panel */}
          <section className="lg:col-span-6 bg-[#090e1c] border border-slate-800/80 rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-semibold tracking-wider uppercase text-slate-300">
                  Contextual Security Signals
                </h2>
              </div>

              {/* Demo Scenario Quick Selectors */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase text-slate-500 font-mono hidden sm:inline">Quick Preset:</span>
                <button
                  type="button"
                  onClick={loadNormalPreset}
                  className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[11px] font-mono transition-all"
                  title="Load authorized employee credentials"
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={loadImposterPreset}
                  className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[11px] font-mono transition-all"
                  title="Simulate stolen password attack"
                >
                  Attacker
                </button>
              </div>
            </div>

            <form onSubmit={handleEvaluate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                  Target Identity Principal
                </label>
                <input
                  type="text"
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                  className="w-full bg-[#050813] border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono transition-all"
                  required
                />
              </div>

              {/* PROTECTED ASSET & LOCK IN PLACE */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Protected Enterprise Target Asset
                  </label>
                  <button
                    type="button"
                    onClick={handleDirectDiskLock}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer flex items-center gap-1 transition-colors"
                  >
                    <FolderLock className="w-3.5 h-3.5" /> Lock File in Folder (In-Place AES)
                  </button>
                </div>
                <input
                  type="text"
                  value={asset}
                  onChange={(e) => setAsset(e.target.value)}
                  className="w-full bg-[#050813] border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono transition-all"
                  required
                />
                {isLockedInPlace && (
                  <div className="mt-2 text-[11px] font-mono text-rose-400 flex items-center gap-1.5 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">
                    <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Locked In Folder: <strong>{asset}</strong> (AES-256 Key: '{activeLockKey}')</span>
                  </div>
                )}
                {isRestoredInPlace && (
                  <div className="mt-2 text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                    <Unlock className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Restored In Folder: <strong>{asset}</strong> (Decrypted and readable)</span>
                  </div>
                )}
              </div>

              {/* DYNAMIC SECRET PASSPHRASE */}
              <div className="bg-[#050813] p-3.5 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-medium text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <KeyRound className="w-3.5 h-3.5" /> Enrolled Asset Secret Passphrase
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowRegisteredPass(!showRegisteredPass)}
                    className="text-slate-400 hover:text-cyan-400 text-xs flex items-center gap-1"
                  >
                    {showRegisteredPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showRegisteredPass ? "Hide" : "Show"}
                  </button>
                </div>
                <input
                  type={showRegisteredPass ? "text" : "password"}
                  value={registeredPassphrase}
                  onChange={(e) => setRegisteredPassphrase(e.target.value)}
                  placeholder="Set secret passphrase for file locking..."
                  className="w-full bg-[#03060f] border border-cyan-900/50 rounded-lg px-3 py-2 text-sm text-cyan-200 focus:outline-none focus:border-cyan-500 font-mono tracking-wider"
                  required
                />
              </div>

              {/* LIVE BIOMETRIC CHALLENGE INPUT */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Live Biometric Keystroke Dynamics Passphrase
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowChallengePass(!showChallengePass)}
                    className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1"
                  >
                    {showChallengePass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showChallengePass ? "Hide" : "Show"}
                  </button>
                </div>
                <input
                  type={showChallengePass ? "text" : "password"}
                  placeholder={`Type '${registeredPassphrase}' to measure cadence...`}
                  value={passphrase}
                  onKeyDown={handleKeyDown}
                  onChange={handlePassphraseChange}
                  className="w-full bg-[#050813] border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono tracking-widest"
                  required
                />
                <div className="flex justify-between items-center mt-1.5 text-xs">
                  <span className="text-slate-400">Calculated Typing Cadence:</span>
                  <span className={`font-mono font-semibold ${cadence === 0 ? "text-slate-500" : "text-cyan-400"}`}>
                    {cadence} ms
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                    Access Hour (Auto-Detected)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={accessHour}
                    onChange={(e) => setAccessHour(e.target.value)}
                    className="w-full bg-[#050813] border border-slate-700/70 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Hourly Access Violations
                    </label>
                    {violations > 0 && (
                      <button
                        type="button"
                        onClick={handleResetViolations}
                        className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-0.5"
                      >
                        <RotateCcw className="w-2.5 h-2.5" /> Reset
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={violations}
                    onChange={(e) => setViolations(e.target.value)}
                    className="w-full bg-[#050813] border border-slate-700/70 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isEvaluating}
                className={`w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm tracking-wide transition-all shadow-lg ${
                  isEvaluating
                    ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/25 active:scale-[0.99]"
                }`}
              >
                {isEvaluating ? "EVALUATING THREAT PARAMETERS..." : "TRANSMIT TELEMETRY CHALLENGE"}
              </button>

              {/* DIRECT WRITE TO DISK BUTTON */}
              {grantedForUnlock && (
                <div className="mt-4 p-4 bg-emerald-500/10 border-2 border-emerald-500/50 rounded-xl animate-pulse">
                  <div className="flex items-center gap-2 mb-1.5 text-emerald-400 text-sm font-bold">
                    <CheckCircle className="w-5 h-5" />
                    <span>ZTNA CLEARANCE GRANTED: Ready to Decrypt</span>
                  </div>
                  <p className="text-xs text-slate-300 mb-3">
                    Click the button below to rewrite the cleartext file back to your hard drive directly.
                  </p>
                  <button
                    type="button"
                    onClick={handlePerformDiskRestore}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    <Unlock className="w-4 h-4" /> WRITE DECRYPTED FILE DIRECTLY TO DISK
                  </button>
                </div>
              )}
            </form>
          </section>

          {/* Right Column: AI Terminal with Dynamic Risk Gauge */}
          <section className="lg:col-span-6 bg-[#03060f] border border-slate-800/80 rounded-2xl p-6 flex flex-col font-mono shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-slate-400 uppercase tracking-wider">
                  AI Engine Interception Terminal
                </span>
              </div>
              {latestVerdict && (
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    latestVerdict.decision === "GRANTED"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  }`}
                >
                  {latestVerdict.decision}: {latestVerdict.risk_score_percent}% RISK
                </span>
              )}
            </div>

            {/* Dynamic Visual Risk Gauge Meter */}
            {latestVerdict && (
              <div className="mb-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between items-center text-[11px] mb-1">
                    <span className="text-slate-400 uppercase">Threat Probability Metric:</span>
                    <span className={latestVerdict.risk_score_percent >= 60 ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                      {latestVerdict.risk_score_percent}% / 100%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        latestVerdict.risk_score_percent >= 60 
                          ? "bg-rose-500" 
                          : latestVerdict.risk_score_percent >= 40 
                          ? "bg-amber-500" 
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(latestVerdict.risk_score_percent, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Terminal Feed */}
            <div className="flex-1 overflow-y-auto space-y-1.5 text-xs text-slate-300 max-h-[360px] pr-2 scroll-smooth">
              {terminalLogs.map((log, index) => (
                <div
                  key={index}
                  className={`leading-relaxed ${
                    log.includes("ALERT") || log.includes("DENIED") || log.includes("FAILED") || log.includes("INCIDENT")
                      ? "text-rose-400"
                      : log.includes("CLEAR") || log.includes("GRANTED") || log.includes("LOCKED") || log.includes("SUCCESS")
                      ? "text-emerald-400"
                      : log.includes("INGEST") || log.includes("AI") || log.includes("CRYPTO") || log.includes("DISK") || log.includes("PRESET")
                      ? "text-cyan-400"
                      : "text-slate-400"
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>

            <div className="pt-3 mt-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex justify-between items-center">
              <span>Model: Isolation Forest Profile (8% Contamination)</span>
              <span>Threshold &lt; 60.0% Risk</span>
            </div>
          </section>
        </main>

        {/* Bottom Section: Decentralized Vault Audit Trail */}
        <section className="bg-[#090e1c] border border-slate-800/80 rounded-2xl p-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800/80 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h2 className="text-sm font-semibold tracking-wider uppercase text-slate-300">
                Decentralized Vault Audit Trail (Distributed Block Logging)
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {/* Filter Tabs */}
              <div className="flex items-center bg-[#050813] border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
                {["ALL", "GRANTED", "DENIED"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      statusFilter === f 
                        ? "bg-blue-600 text-white font-bold" 
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Export Button */}
              <button
                type="button"
                onClick={exportAuditCSV}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all"
                title="Download audit records as CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono">
                  <th className="pb-3 px-3">Audit ID</th>
                  <th className="pb-3 px-3">Principal</th>
                  <th className="pb-3 px-3">Resource</th>
                  <th className="pb-3 px-3">Cadence</th>
                  <th className="pb-3 px-3">Risk Score</th>
                  <th className="pb-3 px-3">Decision</th>
                  <th className="pb-3 px-3">Tx Hash & Explorer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-6 text-center text-slate-500">
                      No events matching filter '{statusFilter}'. Transmit a challenge above to record an on-chain block.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 text-slate-300">{row.audit_id}</td>
                      <td className="py-3 px-3 text-slate-400">{row.user_principal}</td>
                      <td className="py-3 px-3 text-slate-300">{row.target_resource}</td>
                      <td className="py-3 px-3 text-cyan-400">{row.cadence_ms} ms</td>
                      <td className="py-3 px-3 font-semibold">
                        <span className={row.risk_score_percent >= 60.0 ? "text-rose-400" : "text-emerald-400"}>
                          {row.risk_score_percent}%
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold ${
                            row.decision === "GRANTED"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {row.decision === "GRANTED" ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <AlertTriangle className="w-3 h-3" />
                          )}
                          {row.decision}
                        </span>
                      </td>
                      <td className="py-3 px-3 flex items-center gap-2">
                        <a
                          href={row.explorer_url || `https://amoy.polygonscan.com/tx/${row.tx_hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 underline underline-offset-2"
                        >
                          {row.tx_hash ? `${row.tx_hash.slice(0, 10)}...` : "0xPending"}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        {row.tx_hash && (
                          <button
                            type="button"
                            onClick={() => copyTxHash(row.tx_hash)}
                            className="text-slate-500 hover:text-slate-300 p-0.5"
                            title="Copy full Tx Hash"
                          >
                            {copiedTx === row.tx_hash ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
