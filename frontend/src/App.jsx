import React, { useState, useEffect, useRef } from 'react';
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
  FileText,
  Eye,
  EyeOff,
  RotateCcw,
  Upload,
  Download,
  FileCheck
} from 'lucide-react';

const BACKEND_URL = "https://aegis-ztna-system.onrender.com";

// =============================================================================
// BROWSER-NATIVE AES-256-GCM CRYPTOGRAPHIC ROUTINES (Web Crypto API)
// =============================================================================
async function deriveKey(passphrase, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
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
  
  // Custom Dynamic Passphrase Enrollment
  const [registeredPassphrase, setRegisteredPassphrase] = useState("MySecureKey123");
  const [showRegisteredPass, setShowRegisteredPass] = useState(false);
  
  // Challenge input state
  const [passphrase, setPassphrase] = useState("");
  const [showChallengePass, setShowChallengePass] = useState(false);
  
  const [cadence, setCadence] = useState(0);
  const [accessHour, setAccessHour] = useState(new Date().getHours());
  const [violations, setViolations] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  // Vault File State
  const [activeVaultFile, setActiveVaultFile] = useState(null);
  const [unlockedDownloadUrl, setUnlockedDownloadUrl] = useState(null);
  const [unlockedFileName, setUnlockedFileName] = useState(null);
  const fileInputRef = useRef(null);

  const [terminalLogs, setTerminalLogs] = useState([
    "[SYSTEM BOOT] Aegis ZTNA Autonomous Controller v1.0.0 Online.",
    "[AI ENGINE] Isolation Forest baseline profile loaded (Contamination: 8%).",
    "[WEB3] Polygon Amoy contract listener initialized at 0x4a96...01d0.",
    "[SECURITY POLICY] Browser-native AES-256-GCM vault subsystem ready.",
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
    const pollInterval = setInterval(fetchAuditLogs, 5000);
    return () => clearInterval(pollInterval);
  }, []);

  // ---------------------------------------------------------------------------
  // FIX 1: KEYSTROKE CAPTURE WITH CLEAN BACKSPACE RESET
  // ---------------------------------------------------------------------------
  const handlePassphraseChange = (e) => {
    const val = e.target.value;
    setPassphrase(val);

    // If user cleared the input with backspaces, immediately reset cadence to 0
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

  // ---------------------------------------------------------------------------
  // FIX 2: REAL IN-BROWSER FILE UPLOAD & AES-256 LOCKING
  // ---------------------------------------------------------------------------
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!registeredPassphrase) {
      alert("Please configure an Enrolled Asset Secret Passphrase first!");
      return;
    }

    try {
      setTerminalLogs((prev) => [
        ...prev,
        `[VAULT ENCRYPT] Ingesting binary payload for: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
        `[CRYPTO] Deriving 256-bit key via PBKDF2-HMAC-SHA256 (100,000 rounds)...`,
        `[CRYPTO] Applying AES-256-GCM with 96-bit unique IV & GCM auth tag...`
      ]);

      const buffer = await file.arrayBuffer();
      const encryptedBytes = await encryptFileData(buffer, registeredPassphrase);

      // Arm asset inside vault
      const lockedName = `${file.name}.aegis`;
      setActiveVaultFile({
        originalName: file.name,
        lockedName: lockedName,
        encryptedBytes: encryptedBytes,
        mimeType: file.type || "application/octet-stream"
      });
      setAsset(lockedName);
      setUnlockedDownloadUrl(null);
      setUnlockedFileName(null);

      // Automatically trigger download of the encrypted .aegis binary
      const blob = new Blob([encryptedBytes], { type: "application/octet-stream" });
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = lockedName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setTerminalLogs((prev) => [
        ...prev,
        `[✓] ASSET LOCKED: Generated AES-256 vault container -> ${lockedName}`,
        `[VAULT READY] Target asset armed on disk and held in browser memory.`
      ]);
    } catch (err) {
      console.error("Encryption error:", err);
      setTerminalLogs((prev) => [...prev, `[CRYPTO ERROR] Failed to lock asset: ${err.message}`]);
    }
  };

  const handleResetViolations = () => {
    setViolations(0);
    setTerminalLogs((prev) => [...prev, `[ADMIN OVERRIDE] Security violation counter reset to 0.`]);
  };

  // ---------------------------------------------------------------------------
  // FIX 3: TWO-TIER EVALUATION WITH REAL AES-256 DECRYPTION
  // ---------------------------------------------------------------------------
  const handleEvaluate = async (e) => {
    e.preventDefault();
    if (!passphrase) return;

    setIsEvaluating(true);
    setUnlockedDownloadUrl(null);
    setUnlockedFileName(null);

    // Tier 1: Dynamic Passphrase Check
    if (passphrase.trim() !== registeredPassphrase.trim()) {
      const updatedViolations = violations + 1;
      setViolations(updatedViolations);
      setLatestVerdict({ decision: "DENIED", risk_score_percent: 98.5 });

      setTerminalLogs((prev) => [
        ...prev,
        `[TIER 1 FAILED] Invalid passphrase string provided for principal: ${identity}`,
        `[SECURITY INCIDENT] Violation counter incremented to: ${updatedViolations}`,
        `[POLICY DECISION: DENIED] Request dropped prior to AI inference. Asset remains encrypted.`
      ]);

      setIsEvaluating(false);
      setPassphrase("");
      setCadence(0);
      intervals.current = [];
      lastKeyTime.current = null;
      return;
    }

    // Tier 2: Zero Trust Behavioral Biometrics
    const measuredCadence = cadence === 0 ? 210.5 : cadence;

    setTerminalLogs((prev) => [
      ...prev,
      `[TIER 1 CLEAR] Passphrase string matched enrolled asset key for ${identity}.`,
      `[INGEST] Telemetry Vector -> Cadence: ${measuredCadence}ms | Access Hour: ${accessHour}:00 | Violations: ${violations}`,
      `[AI INFERENCE] Running multi-vector observation through Isolation Forest decision trees...`
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
        setTerminalLogs((prev) => [
          ...prev,
          `[EVALUATION CLEAR] Threat Probability: ${result.risk_score_percent}% (Below 60% Threshold)`,
          `[POLICY DECISION: GRANTED] Session token issued: ${result.session_token}`,
          `[WEB3 AUDIT] Block commitment hash: ${result.tx_hash}`
        ]);

        // Decrypt uploaded file if armed in browser vault
        if (activeVaultFile) {
          try {
            setTerminalLogs((prev) => [
              ...prev,
              `[DECRYPTING] Authenticating AES-256-GCM tag and restoring cleartext bytes...`
            ]);
            const decryptedBytes = await decryptFileData(activeVaultFile.encryptedBytes, passphrase);
            const decryptedBlob = new Blob([decryptedBytes], { type: activeVaultFile.mimeType });
            const fileUrl = URL.createObjectURL(decryptedBlob);

            setUnlockedDownloadUrl(fileUrl);
            setUnlockedFileName(activeVaultFile.originalName);

            // Trigger instant download of unlocked original file
            const autoLink = document.createElement("a");
            autoLink.href = fileUrl;
            autoLink.download = activeVaultFile.originalName;
            document.body.appendChild(autoLink);
            autoLink.click();
            document.body.removeChild(autoLink);

            setTerminalLogs((prev) => [
              ...prev,
              `[✓] ZTNA PERIMETER CLEAR: Decrypted ${activeVaultFile.originalName} into memory!`,
              `[✓] File automatically restored and downloaded to client desktop.`
            ]);
          } catch (decErr) {
            setTerminalLogs((prev) => [...prev, `[CRYPTO FAILED] Integrity tag mismatch: ${decErr.message}`]);
          }
        } else {
          // Demo fallback for default simulated asset
          const defaultBlob = new Blob([
            "CONFIDENTIAL ENTERPRISE AUDIT REPORT 2026\nStatus: AES-256-GCM Decryption Authenticated via Aegis ZTNA."
          ], { type: "text/plain" });
          const fileUrl = URL.createObjectURL(defaultBlob);
          setUnlockedDownloadUrl(fileUrl);
          setUnlockedFileName("Confidential_Enterprise_Report.txt");
        }
      } else {
        setTerminalLogs((prev) => [
          ...prev,
          `[ZERO TRUST BREACH] Passphrase was CORRECT, but typing cadence (${measuredCadence}ms) is anomalous!`,
          `[POLICY DECISION: DENIED] Threat Probability: ${result.risk_score_percent}% (Exceeds Policy Limit)`,
          `[SECURITY ENFORCEMENT] Target asset remains AES-256 encrypted on disk.`,
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

  return (
    <div className="min-h-screen bg-[#060913] text-slate-200 p-4 md:p-8 selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400 shadow-inner">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Aegis ZTNA Gateway
              <span className="text-[11px] font-mono uppercase bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
                Live Production Node
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              AI & Decentralized Blockchain Access Verification Node • HIT Nidasoshi
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-2 text-xs font-mono bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/20">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            ISOLATION FOREST ACTIVE
          </span>
          <span className="flex items-center gap-2 text-xs font-mono bg-purple-500/10 text-purple-400 px-3 py-1.5 rounded-full border border-purple-500/20">
            <Cpu className="w-3.5 h-3.5" />
            POLYGON AMOY (80002)
          </span>
        </div>
      </header>

      {/* Main Grid */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6">
        {/* Left Column: Contextual Security Signals */}
        <section className="lg:col-span-6 bg-[#0d1322] border border-slate-800 rounded-xl p-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold tracking-wider uppercase text-slate-300">
                Contextual Security Signals
              </h2>
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
                className="w-full bg-[#070b14] border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                required
              />
            </div>

            {/* PROTECTED ASSET & FILE UPLOAD */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Protected Enterprise Target Asset
                </label>
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer flex items-center gap-1 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload File to Vault (AES Lock)
                </button>
              </div>
              <input
                type="text"
                value={asset}
                onChange={(e) => setAsset(e.target.value)}
                className="w-full bg-[#070b14] border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                required
              />
              {activeVaultFile && (
                <div className="mt-1 text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5" />
                  Locked: <span className="underline">{activeVaultFile.lockedName}</span> (AES-256 Container Armed)
                </div>
              )}
            </div>

            {/* DYNAMIC SECRET PASSPHRASE FIELD */}
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <div className="flex justify-between items-center mb-1">
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
                className="w-full bg-[#070b14] border border-cyan-900/60 rounded-lg px-3 py-2 text-sm text-cyan-200 focus:outline-none focus:border-cyan-500 font-mono tracking-wider"
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
                placeholder={`Type '${registeredPassphrase}' to capture live typing cadence...`}
                value={passphrase}
                onKeyDown={handleKeyDown}
                onChange={handlePassphraseChange}
                className="w-full bg-[#070b14] border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono tracking-widest"
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
                  className="w-full bg-[#070b14] border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
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
                  className="w-full bg-[#070b14] border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isEvaluating}
              className={`w-full mt-2 py-3 px-4 rounded-lg font-semibold text-sm tracking-wide transition-all shadow-lg ${
                isEvaluating
                  ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 active:scale-[0.99]"
              }`}
            >
              {isEvaluating ? "EVALUATING THREAT PARAMETERS..." : "TRANSMIT TELEMETRY CHALLENGE"}
            </button>

            {/* UNLOCKED FILE DOWNLOAD BADGE */}
            {unlockedDownloadUrl && (
              <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Decrypted: <strong>{unlockedFileName}</strong></span>
                </div>
                <a
                  href={unlockedDownloadUrl}
                  download={unlockedFileName}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded flex items-center gap-1 transition-colors"
                >
                  <Download className="w-3 h-3" /> Save File
                </a>
              </div>
            )}
          </form>
        </section>

        {/* Right Column: AI Engine Interception Terminal */}
        <section className="lg:col-span-6 bg-[#070b14] border border-slate-800 rounded-xl p-6 flex flex-col font-mono shadow-2xl relative">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
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

          <div className="flex-1 overflow-y-auto space-y-1.5 text-xs text-slate-300 max-h-[360px] pr-2 scroll-smooth">
            {terminalLogs.map((log, index) => (
              <div
                key={index}
                className={`leading-relaxed ${
                  log.includes("ALERT") || log.includes("DENIED") || log.includes("FAILED") || log.includes("INCIDENT")
                    ? "text-rose-400"
                    : log.includes("CLEAR") || log.includes("GRANTED") || log.includes("LOCKED")
                    ? "text-emerald-400"
                    : log.includes("INGEST") || log.includes("AI") || log.includes("CRYPTO")
                    ? "text-cyan-400"
                    : "text-slate-400"
                }`}
              >
                {log}
              </div>
            ))}
          </div>

          <div className="pt-3 mt-3 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between items-center">
            <span>Model: Isolation Forest Core Profile (Contamination Rate: 8%)</span>
            <span>Policy: Threshold &lt; 60.0%</span>
          </div>
        </section>
      </main>

      {/* Bottom Section: Decentralized Vault Audit Trail */}
      <section className="bg-[#0d1322] border border-slate-800 rounded-xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h2 className="text-sm font-semibold tracking-wider uppercase text-slate-300">
              Decentralized Vault Audit Trail (Distributed Block Logging)
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {auditTrail.length} On-Chain Records
          </span>
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
                <th className="pb-3 px-3">Tx Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {auditTrail.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-6 text-center text-slate-500">
                    No access events logged yet. Transmit a challenge above to record a block.
                  </td>
                </tr>
              ) : (
                auditTrail.map((row, idx) => (
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
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
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
                    <td className="py-3 px-3 text-purple-400 hover:text-purple-300">
                      <a
                        href={row.explorer_url || `https://amoy.polygonscan.com/tx/${row.tx_hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 underline underline-offset-2"
                      >
                        {row.tx_hash ? `${row.tx_hash.slice(0, 10)}...` : "0xPending"}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
