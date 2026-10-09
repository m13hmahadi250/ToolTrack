import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Dices,
  Lock,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

export type SecurityTab = 'password' | 'strength' | 'random';

interface SecurityUtilitiesToolProps {
  initialTab?: SecurityTab;
}

export const SecurityUtilitiesTool: React.FC<SecurityUtilitiesToolProps> = ({ initialTab = 'password' }) => {
  const [activeTab, setActiveTab] = useState<SecurityTab>(initialTab);
  const [copied, setCopied] = useState(false);

  const copyVal = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ----------------------------------------------------
  // 1. PASSWORD GENERATOR STATE
  // ----------------------------------------------------
  const [pwdLength, setPwdLength] = useState<number>(16);
  const [includeUpper, setIncludeUpper] = useState(true);
  const [includeLower, setIncludeLower] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);

  const generatePassword = () => {
    let upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let lower = 'abcdefghijklmnopqrstuvwxyz';
    let numbers = '0123456789';
    let symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (excludeAmbiguous) {
      upper = upper.replace(/[IO]/g, '');
      lower = lower.replace(/[lo]/g, '');
      numbers = numbers.replace(/[01]/g, '');
      symbols = symbols.replace(/[|]/g, '');
    }

    let charPool = '';
    if (includeUpper) charPool += upper;
    if (includeLower) charPool += lower;
    if (includeNumbers) charPool += numbers;
    if (includeSymbols) charPool += symbols;

    if (!charPool) {
      setGeneratedPassword('');
      return;
    }

    // Cryptographically secure randomness
    const randomBuffer = new Uint32Array(pwdLength);
    crypto.getRandomValues(randomBuffer);

    let result = '';
    for (let i = 0; i < pwdLength; i++) {
      result += charPool[randomBuffer[i] % charPool.length];
    }

    setGeneratedPassword(result);
  };

  // Generate on initial load or option changes
  useEffect(() => {
    generatePassword();
  }, [pwdLength, includeUpper, includeLower, includeNumbers, includeSymbols, excludeAmbiguous]);

  // Compute password entropy in bits: E = L * log2(poolSize)
  const passwordEntropy = useMemo(() => {
    let poolSize = 0;
    if (includeUpper) poolSize += 26;
    if (includeLower) poolSize += 26;
    if (includeNumbers) poolSize += 10;
    if (includeSymbols) poolSize += 26;
    if (poolSize === 0) return 0;

    const bits = Math.round(pwdLength * Math.log2(poolSize));
    return bits;
  }, [pwdLength, includeUpper, includeLower, includeNumbers, includeSymbols]);

  // ----------------------------------------------------
  // 2. PASSWORD STRENGTH ANALYZER STATE
  // ----------------------------------------------------
  const [evalPassword, setEvalPassword] = useState('ToolTrack$2026!Secure');
  const [evalVisible, setEvalVisible] = useState(true);

  const strengthAnalysis = useMemo(() => {
    const pwd = evalPassword;
    if (!pwd) {
      return { score: 0, label: 'Empty', color: 'text-slate-400', crackTime: 'Instant', tips: [] };
    }

    let score = 0;
    const tips: string[] = [];

    // Length
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    if (pwd.length >= 16) score += 1;
    if (pwd.length < 8) tips.push('Use at least 8-12 characters.');

    // Character variety
    const hasLower = /[a-z]/.test(pwd);
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSymbol = /[^a-zA-Z0-9]/.test(pwd);

    let varietyCount = 0;
    if (hasLower) varietyCount++;
    if (hasUpper) varietyCount++;
    if (hasNumber) varietyCount++;
    if (hasSymbol) varietyCount++;

    if (varietyCount >= 3) score += 1;
    if (varietyCount === 4) score += 1;

    if (!hasUpper) tips.push('Add uppercase letters (A-Z).');
    if (!hasLower) tips.push('Add lowercase letters (a-z).');
    if (!hasNumber) tips.push('Add numbers (0-9).');
    if (!hasSymbol) tips.push('Add symbols or special characters.');

    // Common weaknesses
    if (/^[0-9]+$/.test(pwd)) {
      score = Math.min(score, 1);
      tips.push('Password contains only digits.');
    }
    if (/^[a-zA-Z]+$/.test(pwd)) {
      score = Math.min(score, 2);
      tips.push('Add numbers and symbols.');
    }

    // Crack time estimation (at 100 billion guesses/sec)
    let pool = 0;
    if (hasLower) pool += 26;
    if (hasUpper) pool += 26;
    if (hasNumber) pool += 10;
    if (hasSymbol) pool += 33;

    const combinations = Math.pow(pool || 1, pwd.length);
    const seconds = combinations / 1e11;

    let crackTime = '< 1 millisecond';
    if (seconds >= 3.15e7 * 1000) crackTime = '> 1,000 centuries';
    else if (seconds >= 3.15e7) crackTime = `${Math.round(seconds / 3.15e7)} years`;
    else if (seconds >= 86400) crackTime = `${Math.round(seconds / 86400)} days`;
    else if (seconds >= 3600) crackTime = `${Math.round(seconds / 3600)} hours`;
    else if (seconds >= 60) crackTime = `${Math.round(seconds / 60)} minutes`;
    else if (seconds >= 1) crackTime = `${Math.round(seconds)} seconds`;

    let label = 'Very Weak';
    let color = 'text-rose-600';
    if (score === 2) {
      label = 'Weak';
      color = 'text-amber-500';
    } else if (score === 3) {
      label = 'Moderate';
      color = 'text-yellow-500';
    } else if (score === 4) {
      label = 'Strong';
      color = 'text-emerald-500';
    } else if (score >= 5) {
      label = 'Very Strong';
      color = 'text-emerald-600';
    }

    return { score: Math.min(score, 5), label, color, crackTime, tips };
  }, [evalPassword]);

  // ----------------------------------------------------
  // 3. RANDOM NUMBER GENERATOR STATE
  // ----------------------------------------------------
  const [rngMin, setRngMin] = useState<number>(1);
  const [rngMax, setRngMax] = useState<number>(100);
  const [rngCount, setRngCount] = useState<number>(5);
  const [rngUnique, setRngUnique] = useState(true);
  const [rngSort, setRngSort] = useState<'none' | 'asc' | 'desc'>('none');
  const [rngResults, setRngResults] = useState<number[]>([]);

  const generateRandomNumbers = () => {
    const min = Math.min(rngMin, rngMax);
    const max = Math.max(rngMin, rngMax);
    const range = max - min + 1;
    const count = Math.min(Math.max(1, rngCount), 1000);

    if (rngUnique && count > range) {
      alert(`Cannot generate ${count} unique numbers in a range of ${range}. Please increase the range or allow duplicates.`);
      return;
    }

    const numbers: number[] = [];
    const used = new Set<number>();

    while (numbers.length < count) {
      const buffer = new Uint32Array(1);
      crypto.getRandomValues(buffer);
      const val = min + (buffer[0] % range);

      if (rngUnique) {
        if (!used.has(val)) {
          used.add(val);
          numbers.push(val);
        }
      } else {
        numbers.push(val);
      }
    }

    if (rngSort === 'asc') numbers.sort((a, b) => a - b);
    else if (rngSort === 'desc') numbers.sort((a, b) => b - a);

    setRngResults(numbers);
  };

  useEffect(() => {
    generateRandomNumbers();
  }, [rngMin, rngMax, rngCount, rngUnique, rngSort]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span>Privacy & Security Utilities</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Generate cryptographically secure passwords, estimate entropy, and pick secure random numbers. 100% private in-browser execution.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/60 scrollbar-none">
        {[
          { id: 'password', label: 'Password Generator', icon: KeyRound },
          { id: 'strength', label: 'Password Strength Analyzer', icon: Lock },
          { id: 'random', label: 'Random Number Picker', icon: Dices },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SecurityTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PASSWORD GENERATOR */}
      {activeTab === 'password' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-6 shadow-xs">
            {/* Generated Password Box */}
            <div className="relative p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="font-mono text-base sm:text-lg font-bold text-slate-900 dark:text-white break-all tracking-wider select-all">
                {showPassword ? generatedPassword : '•'.repeat(generatedPassword.length)}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={generatePassword}
                  className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                  title="Generate new password"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => copyVal(generatedPassword)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Metrics: Entropy & Security */}
            <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Generated locally with crypto.getRandomValues()</span>
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Entropy: {passwordEntropy} bits
              </span>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              {/* Length Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Password Length</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{pwdLength} characters</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="64"
                  value={pwdLength}
                  onChange={(e) => setPwdLength(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              {/* Character Rules */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeUpper}
                    onChange={(e) => setIncludeUpper(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Uppercase (A-Z)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeLower}
                    onChange={(e) => setIncludeLower(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Lowercase (a-z)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeNumbers}
                    onChange={(e) => setIncludeNumbers(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Numbers (0-9)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeSymbols}
                    onChange={(e) => setIncludeSymbols(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Symbols (!@#$)</span>
                </label>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={excludeAmbiguous}
                    onChange={(e) => setExcludeAmbiguous(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Exclude Ambiguous Characters (e.g. 1, l, I, 0, O)</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PASSWORD STRENGTH ANALYZER */}
      {activeTab === 'strength' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-6 shadow-xs">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Test Any Password (Heuristic Evaluation Only)
              </label>
              <div className="relative">
                <input
                  type={evalVisible ? 'text' : 'password'}
                  value={evalPassword}
                  onChange={(e) => setEvalPassword(e.target.value)}
                  placeholder="Type a password to test..."
                  className="w-full p-3 pr-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => setEvalVisible(!evalVisible)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {evalVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Strength Meter Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600 dark:text-slate-400">Score & Complexity</span>
                <span className={strengthAnalysis.color}>{strengthAnalysis.label}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex gap-1">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <div
                    key={lvl}
                    className={`flex-1 transition-all duration-300 ${
                      lvl <= strengthAnalysis.score
                        ? strengthAnalysis.score <= 2
                          ? 'bg-rose-500'
                          : strengthAnalysis.score <= 3
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                        : 'bg-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Estimated Crack Time</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {strengthAnalysis.crackTime}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">At 100 billion offline guesses/second</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Improvement Suggestions</div>
                {strengthAnalysis.tips.length === 0 ? (
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                    ✓ Strong diversity and character mix!
                  </div>
                ) : (
                  <ul className="text-xs text-slate-600 dark:text-slate-300 mt-1 space-y-0.5 list-disc list-inside">
                    {strengthAnalysis.tips.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-[11px] text-slate-500 leading-relaxed">
              <strong>Disclaimer:</strong> This strength estimator evaluates password entropy and character space heuristics client-side. It does not test against targeted leaked dictionary dumps or phishing vectors, and cannot guarantee invulnerability.
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RANDOM NUMBER GENERATOR */}
      {activeTab === 'random' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Min Value</label>
                <input
                  type="number"
                  value={rngMin}
                  onChange={(e) => setRngMin(parseInt(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-center focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Max Value</label>
                <input
                  type="number"
                  value={rngMax}
                  onChange={(e) => setRngMax(parseInt(e.target.value) || 1)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-center focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Quantity</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={rngCount}
                  onChange={(e) => setRngCount(parseInt(e.target.value) || 1)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-center focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rngUnique}
                    onChange={(e) => setRngUnique(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>No Duplicates (Unique)</span>
                </label>

                <div className="flex items-center gap-1.5">
                  <span>Sort:</span>
                  <select
                    value={rngSort}
                    onChange={(e) => setRngSort(e.target.value as any)}
                    className="p-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="none">Random Order</option>
                    <option value="asc">Ascending (1 → 9)</option>
                    <option value="desc">Descending (9 → 1)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={generateRandomNumbers}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Dices className="w-3.5 h-3.5" />
                <span>Roll Numbers</span>
              </button>
            </div>

            {/* Results Grid */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                <span>Generated Numbers (crypto.getRandomValues)</span>
                {rngResults.length > 0 && (
                  <button
                    onClick={() => copyVal(rngResults.join(', '))}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-normal"
                  >
                    Copy List
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 min-h-24 items-center justify-center">
                {rngResults.map((n, i) => (
                  <div
                    key={i}
                    onClick={() => copyVal(String(n))}
                    className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold text-base hover:border-indigo-400 hover:text-indigo-600 transition cursor-pointer shadow-2xs"
                    title="Click to copy number"
                  >
                    {n}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
