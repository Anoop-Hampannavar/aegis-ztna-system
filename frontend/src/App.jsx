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
  RotateCcw
} from 'lucide-react';

const BACKEND_URL = "https://aegis-ztna-system.onrender.com";

export default function App() {
  const [identity, setIdentity] = useState("sanjana@enterprise.com");
  const [asset, setAsset] = useState("Confidential_Enterprise_Report.txt");
  
  // Dynamic passphrase state (user-defined on the fly)
  const [registeredPassphrase, setRegisteredPassphrase] = useState("MySecureKey123");
  const [showRegisteredPass, setShowRegisteredPass] = useState(false);
  
  // Challenge test passphrase state
  const [passphrase, setPassphrase] = useState("");
  const [showChallengePass, setShowChallengePass] = useState(false);
  
  const [cadence, setCadence] = useState(0);
  const [accessHour, setAccessHour] = useState(new Date().getHours());
  const [violations, setViolations] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState([
    "[SYSTEM BOOT] Aegis ZTNA Autonomous Controller v1.0.0 Online.",
    "[AI ENGINE] Isolation Forest baseline profile loaded (Contamination: 8%).",
    "[WEB3] Polygon Amoy contract listener initialized at 0x4a96...01d0.",
    "[SECURITY POLICY] Dynamic asset credential enrollment ready.",
    "Awaiting challenge request initialization..."
  ]);
  const [auditTrail, setAuditTrail] = useState([]);
  const [latestVerdict, setLatestVerdict] = useState(null);

  const lastKeyTime = useRef(null);
  const intervals = useRef([]);

  // Fetch recent ledger events from Render backend
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

  // Measure Inter-Key Timing (cadence in ms) in real time
  const handleKeyDown = (e) => {
    const now = performance.now();
    if (lastKeyTime.current !== null && e.key !== "Backspace" && e.key !== "Enter") {
      const delta = now - lastKeyTime.current;
      intervals.current.push(delta);
      const avg = intervals.current.reduce((a, b) => a + b, 0) / intervals.current.length;
      setCadence(Math.round(avg));
    }
    lastKeyTime.current = now;
  };

  // Reset hourly security violations counter
  const handleResetViolations = () => {
    setViolations(0);
    setTerminalLogs((prev) => [
      ...prev,
      `[ADMIN OVERRIDE] Security violation counter reset to 0.`
    ]);
  };

  // Submit challenge evaluation to the AI Gateway
  const handleEvaluate = async (e) => {
    e.preventDefault();
    if (!passphrase) return;

    setIsEvaluating(true);

    // =========================================================================
    // TIER 1: KNOWLEDGE VERIFICATION (Dynamic Passphrase String Check)
    // =========================================================================
    if (passphrase.trim() !== registeredPassphrase.trim()) {
      const updatedViolations = violations + 1;
      setViolations(updatedViolations);
      
      setLatestVerdict({
        decision: "DENIED",
        risk_score_percent: 98.5,
        reason: "Credential mismatch"
      });

      setTerminalLogs((prev) => [
        ...prev,
        `[TIER 1 FAILED] Invalid passphrase string provided for principal: ${identity}`,
        `[SECURITY INCIDENT] Violation counter incremented to: ${updatedViolations}`,
        `[POLICY DECISION: DENIED] Credential does not match enrolled asset key. Request dropped.`
      ]);

      setIsEvaluating(false);
      setPassphrase("");
      intervals.current = [];
      lastKeyTime.current = null;
      return;
    }

    // =========================================================================
    // TIER 2: ZERO TRUST BEHAVIORAL AI (Biometrics & Context Analysis)
    // =========================================================================
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
          `[EVALUATION CLEAR] Threat Probability: ${result.risk_score_percent}% (Below 60% Policy Threshold)`,
          `[POLICY DECISION: GRANTED] Session token issued: ${result.session_token}`,
          `[WEB3 AUDIT] Block commitment hash: ${result.tx_hash}`
        ]);
      } else {
        setTerminalLogs((prev) => [
          ...prev,
          `[ZERO TRUST BREACH] Passphrase was CORRECT, but typing cadence (${measuredCadence}ms) is anomalous!`,
          `[POLICY DECISION: DENIED] Threat Probability: ${result.risk_score_percent}% (Exceeds Policy Limit)`,
          `[WEB3 AUDIT] Tamper-proof incident hash written: ${result.tx_hash}`
        ]);
      }

      fetchAuditLogs();
    } catch (err) {
      setTerminalLogs((prev) => [...prev, `[GATEWAY ERROR] Policy controller unreachable: ${err.message}`]);
    } finally {
      setIsEvaluating(false);
      setPassphrase("");
      intervals.current = [];
      lastKeyTime.current = null;
    }
  };

  return (
    <div className="min-h-screen bg-[#060913] text-slate-200 p-4 md:p-8 selection:bg-blue-600 selection:text-white">
      {/* Header */}
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

      {/* Main Grid matching Figure 6.2.1 */}
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
                className="w-full bg-[#070b14] border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono transition-colors"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Protected Enterprise Target Asset
                </label>
                <span className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Upload File to Vault
                </span>
              </div>
              <input
                type="text"
                value={asset}
                onChange={(e) => setAsset(e.target.value)}
                className="w-full bg-[#070b14] border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono transition-colors"
                required
              />
            </div>

            {/* DYNAMIC PASSPHRASE ENROLLMENT FIELD */}
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
                placeholder="Set whatever secret passphrase you want..."
                className="w-full bg-[#070b14] border border-cyan-900/60 rounded-lg px-3 py-2 text-sm text-cyan-200 focus:outline-none focus:border-cyan-500 font-mono tracking-wider"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Change this value anytime to simulate custom organizational secrets.
              </p>
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
                onChange={(e) => setPassphrase(e.target.value)}
                className="w-full bg-[#070b14] border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono tracking-widest transition-colors"
                required
              />
              <div className="flex justify-between items-center mt-1.5 text-xs">
                <span className="text-slate-400">Calculated Typing Cadence:</span>
                <span className="font-mono text-cyan-400 font-semibold">{cadence} ms</span>
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
                  className="w-full bg-[#070b14] border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono transition-colors"
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
                  className="w-full bg-[#070b14] border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono transition-colors"
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
                    : log.includes("CLEAR") || log.includes("GRANTED") || log.includes("PASS")
                    ? "text-emerald-400"
                    : log.includes("INGEST") || log.includes("AI") || log.includes("TELEMETRY")
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

      {/* Bottom Section: Decentralized Vault Audit Trail (Polygon Blockchain Ledger) */}
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
                      <span
                        className={
                          row.risk_score_percent >= 60.0 ? "text-rose-400" : "text-emerald-400"
                        }
                      >
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
