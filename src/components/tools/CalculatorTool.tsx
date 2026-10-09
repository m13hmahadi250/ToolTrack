import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Calculator,
  ArrowRightLeft,
  Percent,
  Calendar,
  Timer as TimerIcon,
  Copy,
  Check,
  RotateCcw,
  Play,
  Pause,
  Plus,
  Minus,
  Sparkles,
  Clock,
  History,
  Trash2,
} from 'lucide-react';

export type CalculatorTab =
  | 'calc'
  | 'unit'
  | 'percent'
  | 'date'
  | 'timer'
  | 'stopwatch';

interface CalculatorToolProps {
  initialTab?: CalculatorTab;
}

export const CalculatorTool: React.FC<CalculatorToolProps> = ({ initialTab = 'calc' }) => {
  const [activeTab, setActiveTab] = useState<CalculatorTab>(initialTab);
  const [copied, setCopied] = useState(false);

  const copyVal = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ----------------------------------------------------
  // 1. STANDARD CALCULATOR STATE
  // ----------------------------------------------------
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcEquation, setCalcEquation] = useState('');
  const [calcHistory, setCalcHistory] = useState<string[]>([]);
  const [calcWaitingForOperand, setCalcWaitingForOperand] = useState(false);
  const [calcPrevVal, setCalcPrevVal] = useState<number | null>(null);
  const [calcOperator, setCalcOperator] = useState<string | null>(null);

  const handleCalcNumber = (num: string) => {
    if (calcWaitingForOperand) {
      setCalcDisplay(num);
      setCalcWaitingForOperand(false);
    } else {
      setCalcDisplay(calcDisplay === '0' ? num : calcDisplay + num);
    }
  };

  const handleCalcDecimal = () => {
    if (calcWaitingForOperand) {
      setCalcDisplay('0.');
      setCalcWaitingForOperand(false);
      return;
    }
    if (!calcDisplay.includes('.')) {
      setCalcDisplay(calcDisplay + '.');
    }
  };

  const handleCalcClear = () => {
    setCalcDisplay('0');
    setCalcEquation('');
    setCalcPrevVal(null);
    setCalcOperator(null);
    setCalcWaitingForOperand(false);
  };

  const handleCalcBackspace = () => {
    if (calcWaitingForOperand) return;
    if (calcDisplay.length === 1 || (calcDisplay.length === 2 && calcDisplay.startsWith('-'))) {
      setCalcDisplay('0');
    } else {
      setCalcDisplay(calcDisplay.slice(0, -1));
    }
  };

  const handleCalcToggleSign = () => {
    const val = parseFloat(calcDisplay);
    if (!isNaN(val)) {
      setCalcDisplay(String(-val));
    }
  };

  const handleCalcPercent = () => {
    const val = parseFloat(calcDisplay);
    if (!isNaN(val)) {
      setCalcDisplay(String(val / 100));
    }
  };

  const executeCalc = (prev: number, curr: number, op: string): number => {
    switch (op) {
      case '+':
        return prev + curr;
      case '-':
        return prev - curr;
      case '×':
      case '*':
        return prev * curr;
      case '÷':
      case '/':
        return curr !== 0 ? prev / curr : 0;
      default:
        return curr;
    }
  };

  const handleCalcOperator = (nextOp: string) => {
    const currVal = parseFloat(calcDisplay);

    if (calcPrevVal === null) {
      setCalcPrevVal(currVal);
      setCalcEquation(`${currVal} ${nextOp}`);
    } else if (calcOperator) {
      const result = executeCalc(calcPrevVal, currVal, calcOperator);
      // Round to 10 decimal places to eliminate IEEE float artifacts
      const rounded = Math.round(result * 1e10) / 1e10;
      setCalcPrevVal(rounded);
      setCalcDisplay(String(rounded));
      setCalcEquation(`${rounded} ${nextOp}`);
    }

    setCalcWaitingForOperand(true);
    setCalcOperator(nextOp);
  };

  const handleCalcEquals = () => {
    const currVal = parseFloat(calcDisplay);

    if (calcPrevVal !== null && calcOperator) {
      const result = executeCalc(calcPrevVal, currVal, calcOperator);
      const rounded = Math.round(result * 1e10) / 1e10;
      const historyEntry = `${calcPrevVal} ${calcOperator} ${currVal} = ${rounded}`;
      setCalcHistory((prev) => [historyEntry, ...prev.slice(0, 9)]);
      setCalcDisplay(String(rounded));
      setCalcEquation('');
      setCalcPrevVal(null);
      setCalcOperator(null);
      setCalcWaitingForOperand(true);
    }
  };

  // Keyboard support for calculator
  useEffect(() => {
    if (activeTab !== 'calc') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is in an input field
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key >= '0' && e.key <= '9') {
        handleCalcNumber(e.key);
      } else if (e.key === '.') {
        handleCalcDecimal();
      } else if (e.key === '+' || e.key === '-') {
        handleCalcOperator(e.key);
      } else if (e.key === '*') {
        handleCalcOperator('×');
      } else if (e.key === '/') {
        e.preventDefault();
        handleCalcOperator('÷');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleCalcEquals();
      } else if (e.key === 'Backspace') {
        handleCalcBackspace();
      } else if (e.key === 'Escape') {
        handleCalcClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, calcDisplay, calcPrevVal, calcOperator, calcWaitingForOperand]);

  // ----------------------------------------------------
  // 2. UNIT CONVERTER STATE & FORMULAS
  // ----------------------------------------------------
  type UnitCategory =
    | 'length'
    | 'weight'
    | 'temperature'
    | 'area'
    | 'volume'
    | 'speed'
    | 'time'
    | 'digital';

  const [unitCategory, setUnitCategory] = useState<UnitCategory>('length');
  const [unitAmount, setUnitAmount] = useState<string>('');
  const [unitFrom, setUnitFrom] = useState('meters');
  const [unitTo, setUnitTo] = useState('feet');

  const unitDefinitions: Record<
    UnitCategory,
    { label: string; units: Record<string, { name: string; toBase: (v: number) => number; fromBase: (v: number) => number }> }
  > = {
    length: {
      label: 'Length',
      units: {
        meters: { name: 'Meters (m)', toBase: (v) => v, fromBase: (v) => v },
        km: { name: 'Kilometers (km)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
        cm: { name: 'Centimeters (cm)', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
        mm: { name: 'Millimeters (mm)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
        miles: { name: 'Miles (mi)', toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
        yards: { name: 'Yards (yd)', toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
        feet: { name: 'Feet (ft)', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
        inches: { name: 'Inches (in)', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
        nautical_miles: { name: 'Nautical Miles (NM)', toBase: (v) => v * 1852, fromBase: (v) => v / 1852 },
      },
    },
    weight: {
      label: 'Weight & Mass',
      units: {
        kg: { name: 'Kilograms (kg)', toBase: (v) => v, fromBase: (v) => v },
        grams: { name: 'Grams (g)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
        mg: { name: 'Milligrams (mg)', toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
        pounds: { name: 'Pounds (lb)', toBase: (v) => v * 0.45359237, fromBase: (v) => v / 0.45359237 },
        ounces: { name: 'Ounces (oz)', toBase: (v) => v * 0.028349523, fromBase: (v) => v / 0.028349523 },
        metric_tons: { name: 'Metric Tons (t)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
        stones: { name: 'Stones (st)', toBase: (v) => v * 6.35029, fromBase: (v) => v / 6.35029 },
      },
    },
    temperature: {
      label: 'Temperature',
      units: {
        celsius: { name: 'Celsius (°C)', toBase: (v) => v, fromBase: (v) => v },
        fahrenheit: { name: 'Fahrenheit (°F)', toBase: (v) => ((v - 32) * 5) / 9, fromBase: (v) => (v * 9) / 5 + 32 },
        kelvin: { name: 'Kelvin (K)', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
      },
    },
    area: {
      label: 'Area',
      units: {
        sq_meters: { name: 'Square Meters (m²)', toBase: (v) => v, fromBase: (v) => v },
        sq_km: { name: 'Square Kilometers (km²)', toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
        sq_feet: { name: 'Square Feet (ft²)', toBase: (v) => v * 0.092903, fromBase: (v) => v / 0.092903 },
        sq_yards: { name: 'Square Yards (yd²)', toBase: (v) => v * 0.836127, fromBase: (v) => v / 0.836127 },
        acres: { name: 'Acres (ac)', toBase: (v) => v * 4046.86, fromBase: (v) => v / 4046.86 },
        hectares: { name: 'Hectares (ha)', toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
      },
    },
    volume: {
      label: 'Volume',
      units: {
        liters: { name: 'Liters (L)', toBase: (v) => v, fromBase: (v) => v },
        ml: { name: 'Milliliters (mL)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
        cubic_meters: { name: 'Cubic Meters (m³)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
        gallons_us: { name: 'Gallons (US)', toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
        quarts_us: { name: 'Quarts (US)', toBase: (v) => v * 0.946353, fromBase: (v) => v / 0.946353 },
        pints_us: { name: 'Pints (US)', toBase: (v) => v * 0.473176, fromBase: (v) => v / 0.473176 },
        fl_oz_us: { name: 'Fluid Ounces (US)', toBase: (v) => v * 0.0295735, fromBase: (v) => v / 0.0295735 },
      },
    },
    speed: {
      label: 'Speed',
      units: {
        kmh: { name: 'Kilometers per hour (km/h)', toBase: (v) => v, fromBase: (v) => v },
        mph: { name: 'Miles per hour (mph)', toBase: (v) => v * 1.60934, fromBase: (v) => v / 1.60934 },
        ms: { name: 'Meters per second (m/s)', toBase: (v) => v * 3.6, fromBase: (v) => v / 3.6 },
        knots: { name: 'Knots (kn)', toBase: (v) => v * 1.852, fromBase: (v) => v / 1.852 },
      },
    },
    time: {
      label: 'Time',
      units: {
        seconds: { name: 'Seconds (s)', toBase: (v) => v, fromBase: (v) => v },
        minutes: { name: 'Minutes (min)', toBase: (v) => v * 60, fromBase: (v) => v / 60 },
        hours: { name: 'Hours (hr)', toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
        days: { name: 'Days (d)', toBase: (v) => v * 86400, fromBase: (v) => v / 86400 },
        weeks: { name: 'Weeks (wk)', toBase: (v) => v * 604800, fromBase: (v) => v / 604800 },
        years: { name: 'Years (yr)', toBase: (v) => v * 31557600, fromBase: (v) => v / 31557600 },
      },
    },
    digital: {
      label: 'Digital Storage',
      units: {
        bytes: { name: 'Bytes (B)', toBase: (v) => v, fromBase: (v) => v },
        kb: { name: 'Kilobytes (KB, 1000B)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
        mb: { name: 'Megabytes (MB)', toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
        gb: { name: 'Gigabytes (GB)', toBase: (v) => v * 1e9, fromBase: (v) => v / 1e9 },
        tb: { name: 'Terabytes (TB)', toBase: (v) => v * 1e12, fromBase: (v) => v / 1e12 },
        kib: { name: 'Kibibytes (KiB, 1024B)', toBase: (v) => v * 1024, fromBase: (v) => v / 1024 },
        mib: { name: 'Mebibytes (MiB)', toBase: (v) => v * 1048576, fromBase: (v) => v / 1048576 },
        gib: { name: 'Gibibytes (GiB)', toBase: (v) => v * 1073741824, fromBase: (v) => v / 1073741824 },
      },
    },
  };

  // Set default units whenever unitCategory changes
  useEffect(() => {
    const keys = Object.keys(unitDefinitions[unitCategory].units);
    if (!keys.includes(unitFrom)) setUnitFrom(keys[0]);
    if (!keys.includes(unitTo)) setUnitTo(keys[1] || keys[0]);
  }, [unitCategory]);

  const convertedUnitValue = useMemo(() => {
    if (unitAmount.trim() === '') return '';
    const num = parseFloat(unitAmount);
    if (isNaN(num)) return '';
    const cat = unitDefinitions[unitCategory];
    if (!cat || !cat.units[unitFrom] || !cat.units[unitTo]) return '';
    const base = cat.units[unitFrom].toBase(num);
    const converted = cat.units[unitTo].fromBase(base);
    return String(Math.round(converted * 1e8) / 1e8);
  }, [unitCategory, unitAmount, unitFrom, unitTo]);

  // ----------------------------------------------------
  // 3. PERCENTAGE CALCULATOR STATE
  // ----------------------------------------------------
  const [pctVal1, setPctVal1] = useState<string>('');
  const [pctVal2, setPctVal2] = useState<string>('');

  const [pctA, setPctA] = useState<string>('');
  const [pctB, setPctB] = useState<string>('');

  const [pctOld, setPctOld] = useState<string>('');
  const [pctNew, setPctNew] = useState<string>('');

  // ----------------------------------------------------
  // 4. DATE CALCULATOR STATE
  // ----------------------------------------------------
  const [date1, setDate1] = useState('');
  const [date2, setDate2] = useState('');

  const [dateBase, setDateBase] = useState('');
  const [dateOffsetDays, setDateOffsetDays] = useState<string>('');
  const [dateOffsetOp, setDateOffsetOp] = useState<'add' | 'subtract'>('add');

  const dateDiffResult = useMemo(() => {
    if (!date1 || !date2) {
      return { totalDays: '—', weeks: '—', remDays: '—', workdays: '—', pctYear: '—' };
    }
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      return { totalDays: '—', weeks: '—', remDays: '—', workdays: '—', pctYear: '—' };
    }
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const totalDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(totalDays / 7);
    const remDays = totalDays % 7;

    // Calculate workdays (Monday-Friday)
    let workdays = 0;
    const start = new Date(Math.min(d1.getTime(), d2.getTime()));
    const end = new Date(Math.max(d1.getTime(), d2.getTime()));
    const cur = new Date(start);
    while (cur < end) {
      cur.setDate(cur.getDate() + 1);
      const day = cur.getDay();
      if (day !== 0 && day !== 6) workdays++;
    }

    const pctYear = `${Math.round((totalDays / 365) * 100)}%`;
    return {
      totalDays: String(totalDays),
      weeks: String(weeks),
      remDays: String(remDays),
      workdays: String(workdays),
      pctYear,
    };
  }, [date1, date2]);

  const dateOffsetResult = useMemo(() => {
    if (!dateBase || dateOffsetDays.trim() === '') return '—';
    const numDays = parseInt(dateOffsetDays, 10);
    if (isNaN(numDays)) return '—';
    const d = new Date(dateBase);
    if (isNaN(d.getTime())) return '—';
    const delta = dateOffsetOp === 'add' ? numDays : -numDays;
    d.setDate(d.getDate() + delta);
    return d.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [dateBase, dateOffsetDays, dateOffsetOp]);

  // ----------------------------------------------------
  // 5. STOPWATCH & TIMER STATE
  // ----------------------------------------------------
  // Stopwatch
  const [swTime, setSwTime] = useState(0);
  const [swRunning, setSwRunning] = useState(false);
  const [swLaps, setSwLaps] = useState<number[]>([]);
  const swIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (swRunning) {
      swIntervalRef.current = setInterval(() => {
        setSwTime((prev) => prev + 10);
      }, 10);
    } else {
      clearInterval(swIntervalRef.current);
    }
    return () => clearInterval(swIntervalRef.current);
  }, [swRunning]);

  const formatSwTime = (ms: number) => {
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    const centi = Math.floor((ms % 1000) / 10);
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(centi).padStart(2, '0')}`;
  };

  // Timer
  const [timerInitialSeconds, setTimerInitialSeconds] = useState(300); // 5 min default
  const [timerRemaining, setTimerRemaining] = useState(300);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (timerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            setTimerRunning(false);
            playTimerChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [timerRunning]);

  // Play pleasant chime with Web Audio API oscillator
  const playTimerChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch {
      // Audio autoplay restrictions or headless environment
    }
  };

  const formatTimerTime = (secTotal: number) => {
    const hrs = Math.floor(secTotal / 3600);
    const mins = Math.floor((secTotal % 3600) / 60);
    const secs = secTotal % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <span>Calculators & Conversion</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Standard calculator, 8-category unit conversions, percentages, days between dates & countdown timers.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/60 scrollbar-none">
        {[
          { id: 'calc', label: 'Calculator', icon: Calculator },
          { id: 'unit', label: 'Unit Converter', icon: ArrowRightLeft },
          { id: 'percent', label: 'Percentage', icon: Percent },
          { id: 'date', label: 'Date Calculator', icon: Calendar },
          { id: 'stopwatch', label: 'Stopwatch', icon: TimerIcon },
          { id: 'timer', label: 'Countdown Timer', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as CalculatorTab)}
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

      {/* TAB 1: STANDARD CALCULATOR */}
      {activeTab === 'calc' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start max-w-2xl mx-auto">
          {/* Keypad */}
          <div className="md:col-span-8 p-5 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            {/* Display */}
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 text-right space-y-1">
              <div className="text-xs font-mono text-slate-400 h-5 overflow-hidden">
                {calcEquation || ' '}
              </div>
              <div className="text-3xl sm:text-4xl font-mono font-bold text-slate-900 dark:text-white truncate">
                {calcDisplay}
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-4 gap-2 text-sm font-semibold">
              <button
                onClick={handleCalcClear}
                className="p-3.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-750 text-rose-600 dark:text-rose-400 transition cursor-pointer"
              >
                C
              </button>
              <button
                onClick={handleCalcToggleSign}
                className="p-3.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                ±
              </button>
              <button
                onClick={handleCalcPercent}
                className="p-3.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                %
              </button>
              <button
                onClick={() => handleCalcOperator('÷')}
                className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition cursor-pointer"
              >
                ÷
              </button>

              {['7', '8', '9'].map((n) => (
                <button
                  key={n}
                  onClick={() => handleCalcNumber(n)}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white transition cursor-pointer text-base"
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => handleCalcOperator('×')}
                className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition cursor-pointer"
              >
                ×
              </button>

              {['4', '5', '6'].map((n) => (
                <button
                  key={n}
                  onClick={() => handleCalcNumber(n)}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white transition cursor-pointer text-base"
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => handleCalcOperator('-')}
                className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition cursor-pointer text-lg"
              >
                −
              </button>

              {['1', '2', '3'].map((n) => (
                <button
                  key={n}
                  onClick={() => handleCalcNumber(n)}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white transition cursor-pointer text-base"
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => handleCalcOperator('+')}
                className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition cursor-pointer text-lg"
              >
                +
              </button>

              <button
                onClick={() => handleCalcNumber('0')}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white transition cursor-pointer text-base col-span-2"
              >
                0
              </button>
              <button
                onClick={handleCalcDecimal}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white transition cursor-pointer text-base font-bold"
              >
                .
              </button>
              <button
                onClick={handleCalcEquals}
                className="p-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition cursor-pointer text-lg shadow-sm"
              >
                =
              </button>
            </div>
          </div>

          {/* History Tape Column */}
          <div className="md:col-span-4 p-5 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-indigo-500" />
                <span>History</span>
              </span>
              {calcHistory.length > 0 && (
                <button
                  onClick={() => setCalcHistory([])}
                  className="text-slate-400 hover:text-red-500 text-[11px] cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {calcHistory.length === 0 ? (
              <div className="text-xs text-slate-400 py-8 text-center">No calculations yet.</div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {calcHistory.map((entry, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      const res = entry.split('=')[1]?.trim();
                      if (res) setCalcDisplay(res);
                    }}
                    className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 font-mono text-xs text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer transition text-right"
                  >
                    {entry}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: UNIT CONVERTER */}
      {activeTab === 'unit' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-6 shadow-xs">
            {/* Category Select */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Conversion Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(unitDefinitions).map(([key, cat]) => (
                  <button
                    key={key}
                    onClick={() => setUnitCategory(key as UnitCategory)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      unitCategory === key
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs & Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-11 gap-3 items-center">
              {/* From */}
              <div className="sm:col-span-5 space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">From</label>
                <input
                  type="number"
                  value={unitAmount}
                  onChange={(e) => setUnitAmount(e.target.value)}
                  placeholder="Enter amount..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                />
                <select
                  value={unitFrom}
                  onChange={(e) => setUnitFrom(e.target.value)}
                  className="w-full p-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  {Object.entries(unitDefinitions[unitCategory].units).map(([uKey, uData]) => (
                    <option key={uKey} value={uKey}>
                      {uData.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Swap Button */}
              <div className="sm:col-span-1 flex justify-center pt-4 sm:pt-6">
                <button
                  onClick={() => {
                    const temp = unitFrom;
                    setUnitFrom(unitTo);
                    setUnitTo(temp);
                  }}
                  className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition cursor-pointer"
                  title="Swap units"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>
              </div>

              {/* To */}
              <div className="sm:col-span-5 space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">To</label>
                <div className="w-full p-2.5 bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900 rounded-xl text-sm font-mono font-bold text-indigo-700 dark:text-indigo-300 truncate">
                  {convertedUnitValue || '—'}
                </div>
                <select
                  value={unitTo}
                  onChange={(e) => setUnitTo(e.target.value)}
                  className="w-full p-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  {Object.entries(unitDefinitions[unitCategory].units).map(([uKey, uData]) => (
                    <option key={uKey} value={uKey}>
                      {uData.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action & Result Summary */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-500">
                {unitAmount && convertedUnitValue
                  ? `Formula: ${unitAmount} ${unitDefinitions[unitCategory].units[unitFrom]?.name} = ${convertedUnitValue} ${unitDefinitions[unitCategory].units[unitTo]?.name}`
                  : 'Enter an amount above to see instant conversion'}
              </span>
              <button
                onClick={() => copyVal(String(convertedUnitValue))}
                disabled={!convertedUnitValue}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 font-semibold transition cursor-pointer flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PERCENTAGE CALCULATOR */}
      {activeTab === 'percent' && (
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Card 1: What is X% of Y? */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              1. What is X% of Y?
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-slate-500 text-xs">What is</span>
              <input
                type="number"
                value={pctVal1}
                onChange={(e) => setPctVal1(e.target.value)}
                placeholder="20"
                className="w-24 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-mono text-sm placeholder-slate-400 focus:outline-none"
              />
              <span className="text-slate-500 text-xs">% of</span>
              <input
                type="number"
                value={pctVal2}
                onChange={(e) => setPctVal2(e.target.value)}
                placeholder="150"
                className="w-28 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-mono text-sm placeholder-slate-400 focus:outline-none"
              />
              <span className="font-bold text-slate-500">=</span>
              <div className="px-3 py-2 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 rounded-xl font-mono font-bold text-indigo-600 dark:text-indigo-400 min-w-16 text-center">
                {(() => {
                  const v1 = parseFloat(pctVal1);
                  const v2 = parseFloat(pctVal2);
                  if (isNaN(v1) || isNaN(v2)) return '—';
                  return Math.round(((v1 * v2) / 100) * 1e6) / 1e6;
                })()}
              </div>
            </div>
          </div>

          {/* Card 2: X is what % of Y? */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              2. X is what percent of Y?
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <input
                type="number"
                value={pctA}
                onChange={(e) => setPctA(e.target.value)}
                placeholder="45"
                className="w-24 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-mono text-sm placeholder-slate-400 focus:outline-none"
              />
              <span className="text-slate-500 text-xs">is what % of</span>
              <input
                type="number"
                value={pctB}
                onChange={(e) => setPctB(e.target.value)}
                placeholder="200"
                className="w-28 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-mono text-sm placeholder-slate-400 focus:outline-none"
              />
              <span className="font-bold text-slate-500">=</span>
              <div className="px-3 py-2 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 rounded-xl font-mono font-bold text-indigo-600 dark:text-indigo-400 min-w-16 text-center">
                {(() => {
                  const a = parseFloat(pctA);
                  const b = parseFloat(pctB);
                  if (isNaN(a) || isNaN(b)) return '—';
                  return b !== 0 ? `${Math.round(((a / b) * 100) * 1e4) / 1e4}%` : '0%';
                })()}
              </div>
            </div>
          </div>

          {/* Card 3: Percentage increase / decrease */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              3. Percentage Change (Increase / Decrease)
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-slate-500 text-xs">From</span>
              <input
                type="number"
                value={pctOld}
                onChange={(e) => setPctOld(e.target.value)}
                placeholder="80"
                className="w-24 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-mono text-sm placeholder-slate-400 focus:outline-none"
              />
              <span className="text-slate-500 text-xs">to</span>
              <input
                type="number"
                value={pctNew}
                onChange={(e) => setPctNew(e.target.value)}
                placeholder="120"
                className="w-28 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-mono text-sm placeholder-slate-400 focus:outline-none"
              />
              <span className="font-bold text-slate-500">=</span>
              {(() => {
                const oldN = parseFloat(pctOld);
                const newN = parseFloat(pctNew);
                if (isNaN(oldN) || isNaN(newN)) {
                  return (
                    <div className="px-3 py-2 rounded-xl font-mono font-bold border border-slate-200 dark:border-slate-700 text-slate-400 text-sm min-w-16 text-center">
                      —
                    </div>
                  );
                }
                const diff = newN - oldN;
                const pct = oldN !== 0 ? Math.round(((diff / oldN) * 100) * 1e2) / 1e2 : 0;
                const isIncrease = diff >= 0;
                return (
                  <div
                    className={`px-3 py-2 rounded-xl font-mono font-bold border text-sm ${
                      isIncrease
                        ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-50 dark:bg-rose-950/70 border-rose-200 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isIncrease ? `+${pct}% (Increase)` : `${pct}% (Decrease)`}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DATE CALCULATOR */}
      {activeTab === 'date' && (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Section 1: Days Between Dates */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Days Between Two Dates</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Start Date</label>
                <input
                  type="date"
                  value={date1}
                  onChange={(e) => setDate1(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">End Date</label>
                <input
                  type="date"
                  value={date2}
                  onChange={(e) => setDate2(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Total Days</div>
                <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{dateDiffResult.totalDays}</div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Weeks + Days</div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                  {dateDiffResult.weeks}w {dateDiffResult.remDays}d
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Workdays (M-F)</div>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{dateDiffResult.workdays}</div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                <div className="text-[10px] font-bold text-slate-500 uppercase">% of Year</div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                  {dateDiffResult.pctYear}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Add or Subtract Days */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Add or Subtract Days from a Date</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Base Date</label>
                <input
                  type="date"
                  value={dateBase}
                  onChange={(e) => setDateBase(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Operation</label>
                <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <button
                    onClick={() => setDateOffsetOp('add')}
                    className={`flex-1 py-2 text-xs font-semibold transition cursor-pointer ${
                      dateOffsetOp === 'add' ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    + Add
                  </button>
                  <button
                    onClick={() => setDateOffsetOp('subtract')}
                    className={`flex-1 py-2 text-xs font-semibold transition cursor-pointer ${
                      dateOffsetOp === 'subtract' ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    − Subtract
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Number of Days</label>
                <input
                  type="number"
                  min="1"
                  max="3650"
                  value={dateOffsetDays}
                  onChange={(e) => setDateOffsetDays(e.target.value)}
                  placeholder="e.g. 14"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-indigo-500 uppercase">Calculated Date</div>
                <div className="text-sm font-bold text-indigo-900 dark:text-indigo-200 mt-0.5">{dateOffsetResult}</div>
              </div>
              <button
                onClick={() => copyVal(dateOffsetResult)}
                disabled={dateOffsetResult === '—'}
                className="p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                title="Copy Result"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: STOPWATCH */}
      {activeTab === 'stopwatch' && (
        <div className="max-w-md mx-auto space-y-6 text-center">
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
            <div className="text-5xl font-mono font-black text-slate-900 dark:text-white tracking-wider">
              {formatSwTime(swTime)}
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setSwRunning(!swRunning)}
                className={`px-6 py-3 rounded-2xl font-bold text-sm text-white transition flex items-center gap-2 cursor-pointer shadow-sm ${
                  swRunning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {swRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{swRunning ? 'Pause' : 'Start'}</span>
              </button>

              <button
                onClick={() => {
                  if (swRunning) {
                    setSwLaps((prev) => [swTime, ...prev]);
                  } else {
                    setSwTime(0);
                    setSwLaps([]);
                  }
                }}
                className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm transition cursor-pointer"
              >
                {swRunning ? 'Lap' : 'Reset'}
              </button>
            </div>

            {/* Lap Times Tape */}
            {swLaps.length > 0 && (
              <div className="space-y-1.5 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-mono max-h-48 overflow-y-auto pr-1">
                {swLaps.map((lap, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
                    <span>Lap {swLaps.length - idx}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{formatSwTime(lap)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: COUNTDOWN TIMER */}
      {activeTab === 'timer' && (
        <div className="max-w-md mx-auto space-y-6 text-center">
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
            {/* Display */}
            <div className="text-6xl font-mono font-black text-indigo-600 dark:text-indigo-400 tracking-wider">
              {formatTimerTime(timerRemaining)}
            </div>

            {/* Quick Presets */}
            {!timerRunning && (
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {[
                  { label: '1m', sec: 60 },
                  { label: '5m', sec: 300 },
                  { label: '10m', sec: 600 },
                  { label: '15m', sec: 900 },
                  { label: '25m (Pomodoro)', sec: 1500 },
                ].map((p) => (
                  <button
                    key={p.sec}
                    onClick={() => {
                      setTimerInitialSeconds(p.sec);
                      setTimerRemaining(p.sec);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                      timerInitialSeconds === p.sec
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-400 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className={`px-6 py-3 rounded-2xl font-bold text-sm text-white transition flex items-center gap-2 cursor-pointer shadow-sm ${
                  timerRunning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{timerRunning ? 'Pause' : 'Start'}</span>
              </button>

              <button
                onClick={() => {
                  setTimerRunning(false);
                  setTimerRemaining(timerInitialSeconds);
                }}
                className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm transition cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
