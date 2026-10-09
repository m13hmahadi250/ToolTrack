import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Code2,
  FileCode,
  FileSpreadsheet,
  Binary,
  Link,
  Fingerprint,
  Hash,
  Copy,
  Check,
  Download,
  Upload,
  AlertCircle,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export type DevUtilityTab =
  | 'json'
  | 'csv-json'
  | 'base64'
  | 'url'
  | 'uuid'
  | 'hash';

interface DevDataUtilitiesToolProps {
  initialTab?: DevUtilityTab;
}

// Pure JS MD5 implementation for standard MD5 hash calculation in browser
function md5(string: string): string {
  function rotateLeft(lValue: number, iShiftBits: number) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  }
  function addUnsigned(lX: number, lY: number) {
    const lX4 = lX & 0x40000000;
    const lY4 = lY & 0x40000000;
    const lX8 = lX & 0x80000000;
    const lY8 = lY & 0x80000000;
    const lResult = (lX & 0x3fffffff) + (lY & 0x3fffffff);
    if (lX4 & lY4) return lResult ^ 0x80000000 ^ lX8 ^ lY8;
    if (lX4 | lY4) {
      if (lResult & 0x40000000) return lResult ^ 0xc0000000 ^ lX8 ^ lY8;
      return lResult ^ 0x40000000 ^ lX8 ^ lY8;
    }
    return lResult ^ lX8 ^ lY8;
  }
  function F(x: number, y: number, z: number) {
    return (x & y) | (~x & z);
  }
  function G(x: number, y: number, z: number) {
    return (x & z) | (y & ~z);
  }
  function H(x: number, y: number, z: number) {
    return x ^ y ^ z;
  }
  function I(x: number, y: number, z: number) {
    return y ^ (x | ~z);
  }
  function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function convertToWordArray(str: string) {
    let lWordCount;
    const lMessageLength = str.length;
    const lNumberOfWords_temp1 = lMessageLength + 8;
    const lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
    const lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
    const lWordArray = Array(lNumberOfWords - 1);
    let lBytePosition = 0;
    let lByteCount = 0;
    while (lByteCount < lMessageLength) {
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] =
        lWordArray[lWordCount] | (str.charCodeAt(lByteCount) << lBytePosition);
      lByteCount++;
    }
    lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  }
  function wordToHex(lValue: number) {
    let wordToHexValue = '',
      wordToHexValue_temp = '',
      lByte,
      lCount;
    for (lCount = 0; lCount <= 3; lCount++) {
      lByte = (lValue >>> (lCount * 8)) & 255;
      wordToHexValue_temp = '0' + lByte.toString(16);
      wordToHexValue =
        wordToHexValue +
        wordToHexValue_temp.substr(wordToHexValue_temp.length - 2, 2);
    }
    return wordToHexValue;
  }

  const x = convertToWordArray(string);
  let a = 0x67452301;
  let b = 0xefcdab89;
  let c = 0x98badcfe;
  let d = 0x10325476;

  for (let k = 0; k < x.length; k += 16) {
    const AA = a;
    const BB = b;
    const CC = c;
    const DD = d;
    a = FF(a, b, c, d, x[k + 0], 7, 0xd76aa478);
    d = FF(d, a, b, c, x[k + 1], 12, 0xe8c7b756);
    c = FF(c, d, a, b, x[k + 2], 17, 0x242070db);
    b = FF(b, c, d, a, x[k + 3], 22, 0xc1bdceee);
    a = FF(a, b, c, d, x[k + 4], 7, 0xf57c0faf);
    d = FF(d, a, b, c, x[k + 5], 12, 0x4787c62a);
    c = FF(c, d, a, b, x[k + 6], 17, 0xa8304613);
    b = FF(b, c, d, a, x[k + 7], 22, 0xfd469501);
    a = FF(a, b, c, d, x[k + 8], 7, 0x698098d8);
    d = FF(d, a, b, c, x[k + 9], 12, 0x8b44f7af);
    c = FF(c, d, a, b, x[k + 10], 17, 0xffff5bb1);
    b = FF(b, c, d, a, x[k + 11], 22, 0x895cd7be);
    a = FF(a, b, c, d, x[k + 12], 7, 0x6b901122);
    d = FF(d, a, b, c, x[k + 13], 12, 0xfd987193);
    c = FF(c, d, a, b, x[k + 14], 17, 0xa679438e);
    b = FF(b, c, d, a, x[k + 15], 22, 0x49b40821);

    a = GG(a, b, c, d, x[k + 1], 5, 0xf61e2562);
    d = GG(d, a, b, c, x[k + 6], 9, 0xc040b340);
    c = GG(c, d, a, b, x[k + 11], 14, 0x265e5a51);
    b = GG(b, c, d, a, x[k + 0], 20, 0xe9b6c7aa);
    a = GG(a, b, c, d, x[k + 5], 5, 0xd62f105d);
    d = GG(d, a, b, c, x[k + 10], 9, 0x2441453);
    c = GG(c, d, a, b, x[k + 15], 14, 0xd8a1e681);
    b = GG(b, c, d, a, x[k + 4], 20, 0xe7d3fbc8);
    a = GG(a, b, c, d, x[k + 9], 5, 0x21e1cde6);
    d = GG(d, a, b, c, x[k + 14], 9, 0xc33707d6);
    c = GG(c, d, a, b, x[k + 3], 14, 0xf4d50d87);
    b = GG(b, c, d, a, x[k + 8], 20, 0x455a14ed);
    a = GG(a, b, c, d, x[k + 13], 5, 0xa9e3e905);
    d = GG(d, a, b, c, x[k + 2], 9, 0xfcefa3f8);
    c = GG(c, d, a, b, x[k + 7], 14, 0x676f02d9);
    b = GG(b, c, d, a, x[k + 12], 20, 0x8d2a4c8a);

    a = HH(a, b, c, d, x[k + 5], 4, 0xfffa3942);
    d = HH(d, a, b, c, x[k + 8], 11, 0x8771f681);
    c = HH(c, d, a, b, x[k + 11], 16, 0x6d9d6122);
    b = HH(b, c, d, a, x[k + 14], 23, 0xfde5380c);
    a = HH(a, b, c, d, x[k + 1], 4, 0xa4beea44);
    d = HH(d, a, b, c, x[k + 4], 11, 0x4bdecfa9);
    c = HH(c, d, a, b, x[k + 7], 16, 0xf6bb4b60);
    b = HH(b, c, d, a, x[k + 10], 23, 0xbebfbc70);
    a = HH(a, b, c, d, x[k + 13], 4, 0x289b7ec6);
    d = HH(d, a, b, c, x[k + 0], 11, 0xeaa127fa);
    c = HH(c, d, a, b, x[k + 3], 16, 0xd4ef3085);
    b = HH(b, c, d, a, x[k + 6], 23, 0x4881d05);
    a = HH(a, b, c, d, x[k + 9], 4, 0xd9d4d039);
    d = HH(d, a, b, c, x[k + 12], 11, 0xe6db99e5);
    c = HH(c, d, a, b, x[k + 15], 16, 0x1fa27cf8);
    b = HH(b, c, d, a, x[k + 2], 23, 0xc4ac5665);

    a = II(a, b, c, d, x[k + 0], 6, 0xf4292244);
    d = II(d, a, b, c, x[k + 7], 10, 0x432aff97);
    c = II(c, d, a, b, x[k + 14], 15, 0xab9423a7);
    b = II(b, c, d, a, x[k + 5], 21, 0xfc93a039);
    a = II(a, b, c, d, x[k + 12], 6, 0x655b59c3);
    d = II(d, a, b, c, x[k + 3], 10, 0x8f0ccc92);
    c = II(c, d, a, b, x[k + 10], 15, 0xffeff47d);
    b = II(b, c, d, a, x[k + 1], 21, 0x85845dd1);
    a = II(a, b, c, d, x[k + 8], 6, 0x6fa87e4f);
    d = II(d, a, b, c, x[k + 15], 10, 0xfe2ce6e0);
    c = II(c, d, a, b, x[k + 6], 15, 0xa3014314);
    b = II(b, c, d, a, x[k + 13], 21, 0x4e0811a1);
    a = II(a, b, c, d, x[k + 4], 6, 0xf7537e82);
    d = II(d, a, b, c, x[k + 11], 10, 0xbd3af235);
    c = II(c, d, a, b, x[k + 2], 15, 0x2ad7d2bb);
    b = II(b, c, d, a, x[k + 9], 21, 0xeb86d391);

    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }

  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
}

export const DevDataUtilitiesTool: React.FC<DevDataUtilitiesToolProps> = ({ initialTab = 'json' }) => {
  const [activeTab, setActiveTab] = useState<DevUtilityTab>(initialTab);
  const [copied, setCopied] = useState(false);

  const copyVal = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadText = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ----------------------------------------------------
  // 1. JSON FORMATTER & VALIDATOR
  // ----------------------------------------------------
  const [jsonInput, setJsonInput] = useState(
    JSON.stringify(
      {
        app: 'ToolTrack',
        version: '2.5.0',
        features: ['pdf', 'images', 'whiteboard', 'utilities'],
        clientSide: true,
        stats: { tools: 45, offlineReady: true },
      },
      null,
      2
    )
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  const formatJson = (spaces: number = 2) => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed, null, spaces));
      setJsonError(null);
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON syntax');
    }
  };

  const minifyJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed));
      setJsonError(null);
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON syntax');
    }
  };

  // ----------------------------------------------------
  // 2. CSV <-> JSON CONVERTER
  // ----------------------------------------------------
  const [csvDirection, setCsvDirection] = useState<'csv2json' | 'json2csv'>('csv2json');
  const [csvDelimiter, setCsvDelimiter] = useState<',' | ';' | '\t'>(',');
  const [csvInput, setCsvInput] = useState(
    'id,name,role,department\n1,Alice Johnson,Designer,Product\n2,Bob Smith,Engineer,Platform\n3,Carol Danvers,Manager,Operations'
  );
  const [csvOutput, setCsvOutput] = useState('');
  const [csvError, setCsvError] = useState<string | null>(null);

  const convertCsvJson = () => {
    setCsvError(null);
    try {
      if (csvDirection === 'csv2json') {
        const lines = csvInput.trim().split(/\r\n|\r|\n/);
        if (lines.length < 1) {
          setCsvOutput('[]');
          return;
        }

        const headers = lines[0].split(csvDelimiter).map((h) => h.trim().replace(/^"|"$/g, ''));
        const rows = lines.slice(1);
        const result: any[] = [];

        for (const row of rows) {
          if (!row.trim()) continue;
          const values = row.split(csvDelimiter).map((v) => v.trim().replace(/^"|"$/g, ''));
          const item: any = {};
          headers.forEach((h, i) => {
            const rawVal = values[i] ?? '';
            // auto cast number / boolean if applicable
            if (!isNaN(Number(rawVal)) && rawVal !== '') {
              item[h] = Number(rawVal);
            } else if (rawVal.toLowerCase() === 'true') {
              item[h] = true;
            } else if (rawVal.toLowerCase() === 'false') {
              item[h] = false;
            } else {
              item[h] = rawVal;
            }
          });
          result.push(item);
        }

        setCsvOutput(JSON.stringify(result, null, 2));
      } else {
        // json2csv
        const parsed = JSON.parse(csvInput);
        if (!Array.isArray(parsed) || parsed.length === 0) {
          throw new Error('Input must be a non-empty array of objects for JSON to CSV conversion.');
        }

        const headers = Array.from(new Set(parsed.flatMap((item) => Object.keys(item))));
        const rows = parsed.map((item) =>
          headers
            .map((h) => {
              const val = item[h] !== undefined ? String(item[h]) : '';
              return val.includes(csvDelimiter) || val.includes('"') || val.includes('\n')
                ? `"${val.replace(/"/g, '""')}"`
                : val;
            })
            .join(csvDelimiter)
        );

        const csvResult = [headers.join(csvDelimiter), ...rows].join('\n');
        setCsvOutput(csvResult);
      }
    } catch (err: any) {
      setCsvError(err.message || 'Conversion error occurred.');
    }
  };

  // ----------------------------------------------------
  // 3. BASE64 ENCODER / DECODER
  // ----------------------------------------------------
  const [b64Mode, setB64Mode] = useState<'encode' | 'decode'>('encode');
  const [b64Input, setB64Input] = useState('ToolTrack — All Your Files & Productivity Tools in One Place');
  const [b64Output, setB64Output] = useState('');
  const [b64Error, setB64Error] = useState<string | null>(null);

  const processBase64 = () => {
    setB64Error(null);
    try {
      if (b64Mode === 'encode') {
        // UTF-8 safe encoding using TextEncoder
        const bytes = new TextEncoder().encode(b64Input);
        let binary = '';
        bytes.forEach((b) => (binary += String.fromCharCode(b)));
        setB64Output(btoa(binary));
      } else {
        // UTF-8 safe decoding using TextDecoder
        const binary = atob(b64Input.trim());
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        setB64Output(new TextDecoder().decode(bytes));
      }
    } catch (err: any) {
      setB64Error(`Base64 error: ${err.message || 'Malformed string'}`);
    }
  };

  // File to base64 helper
  const handleB64FileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const res = event.target?.result as string;
      setB64Output(res);
      setB64Mode('encode');
      setB64Input(`[File: ${file.name} (${file.size} bytes)]`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ----------------------------------------------------
  // 4. URL ENCODER / DECODER
  // ----------------------------------------------------
  const [urlMode, setUrlMode] = useState<'encode' | 'decode'>('encode');
  const [urlComponentOnly, setUrlComponentOnly] = useState(true);
  const [urlInput, setUrlInput] = useState('https://example.com/search?q=ToolTrack PDF & Tools#top');
  const [urlOutput, setUrlOutput] = useState('');

  const processUrl = () => {
    try {
      if (urlMode === 'encode') {
        setUrlOutput(urlComponentOnly ? encodeURIComponent(urlInput) : encodeURI(urlInput));
      } else {
        setUrlOutput(urlComponentOnly ? decodeURIComponent(urlInput) : decodeURI(urlInput));
      }
    } catch (err: any) {
      setUrlOutput(`Error: ${err.message || 'Malformed URL'}`);
    }
  };

  // ----------------------------------------------------
  // 5. UUID GENERATOR
  // ----------------------------------------------------
  const [uuidCount, setUuidCount] = useState<number>(5);
  const [uuidUppercase, setUuidUppercase] = useState(false);
  const [uuidHyphens, setUuidHyphens] = useState(true);
  const [uuidsList, setUuidsList] = useState<string[]>([]);

  const generateUuids = () => {
    const count = Math.min(Math.max(1, uuidCount), 100);
    const list: string[] = [];

    for (let i = 0; i < count; i++) {
      let id: string = crypto.randomUUID();
      if (!uuidHyphens) id = id.replace(/-/g, '');
      if (uuidUppercase) id = id.toUpperCase();
      list.push(id);
    }

    setUuidsList(list);
  };

  // ----------------------------------------------------
  // 6. HASH GENERATOR (SHA-1, SHA-256, SHA-384, SHA-512, MD5)
  // ----------------------------------------------------
  const [hashInput, setHashInput] = useState('ToolTrack2026');
  const [hashResults, setHashResults] = useState<{
    md5: string;
    sha1: string;
    sha256: string;
    sha384: string;
    sha512: string;
  }>({
    md5: '',
    sha1: '',
    sha256: '',
    sha384: '',
    sha512: '',
  });

  const computeHashes = async (textToHash: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(textToHash);

    const bufferToHex = (buf: ArrayBuffer) => {
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    };

    try {
      const [sha1Buf, sha256Buf, sha384Buf, sha512Buf] = await Promise.all([
        crypto.subtle.digest('SHA-1', data),
        crypto.subtle.digest('SHA-256', data),
        crypto.subtle.digest('SHA-384', data),
        crypto.subtle.digest('SHA-512', data),
      ]);

      setHashResults({
        md5: md5(textToHash),
        sha1: bufferToHex(sha1Buf),
        sha256: bufferToHex(sha256Buf),
        sha384: bufferToHex(sha384Buf),
        sha512: bufferToHex(sha512Buf),
      });
    } catch (err) {
      console.error('Hashing error:', err);
    }
  };

  // Run hash computation on change
  useEffect(() => {
    if (activeTab === 'hash') {
      computeHashes(hashInput);
    }
  }, [hashInput, activeTab]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
            <span>Developer & Data Tools</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Format JSON, convert CSV, encode Base64, generate cryptographically secure UUIDs & compute SHA/MD5 hashes.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/60 scrollbar-none">
        {[
          { id: 'json', label: 'JSON Formatter', icon: FileCode },
          { id: 'csv-json', label: 'CSV / JSON', icon: FileSpreadsheet },
          { id: 'base64', label: 'Base64 Tool', icon: Binary },
          { id: 'url', label: 'URL Encoder', icon: Link },
          { id: 'uuid', label: 'UUID Generator', icon: Fingerprint },
          { id: 'hash', label: 'Hash Generator', icon: Hash },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as DevUtilityTab)}
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

      {/* TAB 1: JSON FORMATTER & VALIDATOR */}
      {activeTab === 'json' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => formatJson(2)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
              >
                Beautify (2 Spaces)
              </button>
              <button
                onClick={() => formatJson(4)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition cursor-pointer"
              >
                Beautify (4 Spaces)
              </button>
              <button
                onClick={minifyJson}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition cursor-pointer"
              >
                Minify JSON
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => copyVal(jsonInput)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition cursor-pointer flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={() => downloadText('formatted.json', jsonInput)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>

          {jsonError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{jsonError}</span>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 overflow-hidden shadow-xs">
            <textarea
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value);
                setJsonError(null);
              }}
              rows={16}
              placeholder="Paste JSON here..."
              className="w-full p-4 bg-transparent text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none resize-y leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* TAB 2: CSV <-> JSON CONVERTER */}
      {activeTab === 'csv-json' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Mode:</span>
                <select
                  value={csvDirection}
                  onChange={(e) => setCsvDirection(e.target.value as any)}
                  className="p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                >
                  <option value="csv2json">CSV → JSON</option>
                  <option value="json2csv">JSON → CSV</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500">Delimiter:</span>
                <select
                  value={csvDelimiter}
                  onChange={(e) => setCsvDelimiter(e.target.value as any)}
                  className="p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                >
                  <option value=",">Comma (,)</option>
                  <option value=";">Semicolon (;)</option>
                  <option value="	">Tab (\t)</option>
                </select>
              </div>
            </div>

            <button
              onClick={convertCsvJson}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
            >
              Convert Now
            </button>
          </div>

          {csvError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{csvError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Input ({csvDirection === 'csv2json' ? 'CSV' : 'JSON'})
              </div>
              <textarea
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
                rows={12}
                className="w-full p-3 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Output ({csvDirection === 'csv2json' ? 'JSON' : 'CSV'})</span>
                {csvOutput && (
                  <div className="flex items-center gap-2 font-normal">
                    <button
                      onClick={() => copyVal(csvOutput)}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Copy
                    </button>
                    <span>·</span>
                    <button
                      onClick={() =>
                        downloadText(
                          csvDirection === 'csv2json' ? 'output.json' : 'output.csv',
                          csvOutput
                        )
                      }
                      className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Download
                    </button>
                  </div>
                )}
              </div>
              <textarea
                value={csvOutput}
                readOnly
                rows={12}
                placeholder="Click Convert Now to generate output..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BASE64 ENCODER / DECODER */}
      {activeTab === 'base64' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setB64Mode('encode')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  b64Mode === 'encode'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                Encode to Base64
              </button>
              <button
                onClick={() => setB64Mode('decode')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  b64Mode === 'decode'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                Decode from Base64
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition cursor-pointer flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                <span>Encode File</span>
                <input type="file" onChange={handleB64FileUpload} className="hidden" />
              </label>

              <button
                onClick={processBase64}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
              >
                Process
              </button>
            </div>
          </div>

          {b64Error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{b64Error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Input String</div>
              <textarea
                value={b64Input}
                onChange={(e) => setB64Input(e.target.value)}
                rows={10}
                className="w-full p-3 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Output Result</span>
                {b64Output && (
                  <button
                    onClick={() => copyVal(b64Output)}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-normal"
                  >
                    Copy Output
                  </button>
                )}
              </div>
              <textarea
                value={b64Output}
                readOnly
                rows={10}
                placeholder="Click Process to convert..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: URL ENCODER / DECODER */}
      {activeTab === 'url' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setUrlMode('encode')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    urlMode === 'encode'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Encode
                </button>
                <button
                  onClick={() => setUrlMode('decode')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    urlMode === 'decode'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Decode
                </button>
              </div>

              <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={urlComponentOnly}
                  onChange={(e) => setUrlComponentOnly(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>Component Mode (encodeURIComponent)</span>
              </label>
            </div>

            <button
              onClick={processUrl}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
            >
              Convert URL
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Input URL / Query</div>
              <textarea
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                rows={8}
                className="w-full p-3 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Output Result</span>
                {urlOutput && (
                  <button
                    onClick={() => copyVal(urlOutput)}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-normal"
                  >
                    Copy
                  </button>
                )}
              </div>
              <textarea
                value={urlOutput}
                readOnly
                rows={8}
                placeholder="Click Convert URL to see encoded/decoded output..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: UUID GENERATOR */}
      {activeTab === 'uuid' && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Quantity:
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={uuidCount}
                  onChange={(e) => setUuidCount(parseInt(e.target.value) || 1)}
                  className="w-20 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-center focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={uuidHyphens}
                    onChange={(e) => setUuidHyphens(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Hyphens</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={uuidUppercase}
                    onChange={(e) => setUuidUppercase(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Uppercase</span>
                </label>
              </div>

              <button
                onClick={generateUuids}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate UUIDs</span>
              </button>
            </div>

            {uuidsList.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Generated UUIDs (v4 Cryptographically Secure)</span>
                  <div className="flex items-center gap-2 font-normal">
                    <button
                      onClick={() => copyVal(uuidsList.join('\n'))}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Copy All
                    </button>
                    <span>·</span>
                    <button
                      onClick={() => downloadText('uuids.txt', uuidsList.join('\n'))}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Download List
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-h-64 overflow-y-auto space-y-1 font-mono text-xs text-slate-800 dark:text-slate-200">
                  {uuidsList.map((id, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded group"
                    >
                      <span>{id}</span>
                      <button
                        onClick={() => copyVal(id)}
                        className="opacity-0 group-hover:opacity-100 text-[10px] text-indigo-600 dark:text-indigo-400 cursor-pointer font-sans font-semibold"
                      >
                        Copy
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: HASH GENERATOR */}
      {activeTab === 'hash' && (
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Input String to Hash</label>
              <textarea
                value={hashInput}
                onChange={(e) => setHashInput(e.target.value)}
                rows={3}
                placeholder="Type or paste text to compute hashes..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-3 pt-2">
              {[
                { label: 'MD5 (128-bit)', val: hashResults.md5 },
                { label: 'SHA-1 (160-bit)', val: hashResults.sha1 },
                { label: 'SHA-256 (256-bit)', val: hashResults.sha256 },
                { label: 'SHA-384 (384-bit)', val: hashResults.sha384 },
                { label: 'SHA-512 (512-bit)', val: hashResults.sha512 },
              ].map((h) => (
                <div
                  key={h.label}
                  className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <span>{h.label}</span>
                    <button
                      onClick={() => copyVal(h.val)}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1 font-semibold"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                  <div className="font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all">
                    {h.val || 'Computing...'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
