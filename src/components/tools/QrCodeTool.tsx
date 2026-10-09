import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import {
  QrCode,
  ScanLine,
  Download,
  Copy,
  Check,
  Camera,
  Upload,
  Link,
  Mail,
  Phone,
  Wifi,
  User,
  ExternalLink,
  AlertCircle,
  Sparkles,
  RefreshCw,
  VideoOff,
} from 'lucide-react';

export type QrTabMode = 'generator' | 'scanner';
export type QrContentType = 'url' | 'text' | 'wifi' | 'email' | 'phone' | 'contact';

interface QrCodeToolProps {
  initialTab?: QrTabMode;
}

export const QrCodeTool: React.FC<QrCodeToolProps> = ({ initialTab = 'generator' }) => {
  const [activeTab, setActiveTab] = useState<QrTabMode>(initialTab);

  // Generator State
  const [contentType, setContentType] = useState<QrContentType>('url');
  const [urlInput, setUrlInput] = useState('https://tooltracker.vercel.app');
  const [textInput, setTextInput] = useState('Hello from ToolTrack!');

  // Wi-Fi inputs
  const [wifiSsid, setWifiSsid] = useState('MyHomeNetwork');
  const [wifiPassword, setWifiPassword] = useState('SecretPassword123');
  const [wifiAuth, setWifiAuth] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  const [wifiHidden, setWifiHidden] = useState(false);

  // Email inputs
  const [emailTo, setEmailTo] = useState('hello@example.com');
  const [emailSubject, setEmailSubject] = useState('Inquiry');
  const [emailBody, setEmailBody] = useState('Hi, I am contacting you regarding...');

  // Phone inputs
  const [phoneNumber, setPhoneNumber] = useState('+1 555 123 4567');

  // Contact inputs (vCard)
  const [contactName, setContactName] = useState('Jane Doe');
  const [contactOrg, setContactOrg] = useState('Acme Corp');
  const [contactPhone, setContactPhone] = useState('+1 555 987 6543');
  const [contactEmail, setContactEmail] = useState('jane.doe@example.com');
  const [contactUrl, setContactUrl] = useState('https://example.com');

  // QR Customization
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [qrSize, setQrSize] = useState(300);
  const [errorCorrection, setErrorCorrection] = useState<'L' | 'M' | 'Q' | 'H'>('M');

  // Output
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrSvgString, setQrSvgString] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Scanner State
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scanCanvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Construct raw QR string payload based on selected type
  const qrPayload = React.useMemo(() => {
    switch (contentType) {
      case 'url':
        return urlInput.trim() || 'https://';
      case 'text':
        return textInput || '';
      case 'wifi':
        return `WIFI:S:${wifiSsid};T:${wifiAuth};P:${wifiPassword};H:${wifiHidden ? 'true' : 'false'};;`;
      case 'email':
        return `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      case 'phone':
        return `tel:${phoneNumber.replace(/\s+/g, '')}`;
      case 'contact':
        return [
          'BEGIN:VCARD',
          'VERSION:3.0',
          `FN:${contactName}`,
          `ORG:${contactOrg}`,
          `TEL:${contactPhone}`,
          `EMAIL:${contactEmail}`,
          `URL:${contactUrl}`,
          'END:VCARD',
        ].join('\n');
      default:
        return urlInput;
    }
  }, [
    contentType,
    urlInput,
    textInput,
    wifiSsid,
    wifiPassword,
    wifiAuth,
    wifiHidden,
    emailTo,
    emailSubject,
    emailBody,
    phoneNumber,
    contactName,
    contactOrg,
    contactPhone,
    contactEmail,
    contactUrl,
  ]);

  // Generate QR Code on any input change
  useEffect(() => {
    if (!qrPayload) return;

    let isMounted = true;

    // Generate PNG Data URL
    QRCode.toDataURL(qrPayload, {
      width: qrSize,
      margin: 2,
      color: {
        dark: fgColor,
        light: bgColor,
      },
      errorCorrectionLevel: errorCorrection,
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('QR code generation error:', err);
      });

    // Generate SVG string
    QRCode.toString(qrPayload, {
      type: 'svg',
      width: qrSize,
      margin: 2,
      color: {
        dark: fgColor,
        light: bgColor,
      },
      errorCorrectionLevel: errorCorrection,
    })
      .then((svg) => {
        if (isMounted) setQrSvgString(svg);
      })
      .catch((err) => {
        console.error('QR code SVG generation error:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [qrPayload, fgColor, bgColor, qrSize, errorCorrection]);

  // Clean up camera on unmount or tab switch
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsCameraActive(false);
    setCameraLoading(false);
  };

  // Start Camera Scanning
  const startCamera = async () => {
    setScanError(null);
    setScanResult(null);
    setCameraLoading(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);
        setCameraLoading(false);
        scanCameraFrame();
      }
    } catch (err: any) {
      setCameraLoading(false);
      setIsCameraActive(false);
      setScanError(
        err.name === 'NotAllowedError'
          ? 'Camera access denied by user. Please grant permission in your browser or upload an image file instead.'
          : `Camera error: ${err.message || 'Unable to access video device.'}`
      );
    }
  };

  // Scan frame from video feed using jsQR
  const scanCameraFrame = () => {
    if (!videoRef.current || !scanCanvasRef.current) return;

    const video = videoRef.current;
    const canvas = scanCanvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        setScanResult(code.data);
        stopCamera();
        return;
      }
    }

    animFrameRef.current = requestAnimationFrame(scanCameraFrame);
  };

  // Scan uploaded image file
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanError(null);
    setScanResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (code && code.data) {
          setScanResult(code.data);
        } else {
          setScanError('No QR code detected in this image. Ensure the image is clear and well-lit.');
        }
      };
      img.onerror = () => {
        setScanError('Failed to read image file.');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Download QR PNG
  const downloadPng = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qrcode-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Download QR SVG
  const downloadSvg = () => {
    if (!qrSvgString) return;
    const blob = new Blob([qrSvgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qrcode-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <span>QR Code Studio</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Generate custom color QR codes for URLs, Wi-Fi & vCards, or scan codes via camera and image upload.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
          <button
            onClick={() => {
              setActiveTab('generator');
              stopCamera();
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'generator'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Generator</span>
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'scanner'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>QR Scanner</span>
          </button>
        </div>
      </div>

      {/* GENERATOR MODE */}
      {activeTab === 'generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Settings & Input Column */}
          <div className="lg:col-span-7 space-y-5">
            {/* Content Type Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                QR Code Type
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {[
                  { id: 'url', label: 'Website', icon: Link },
                  { id: 'text', label: 'Plain Text', icon: QrCode },
                  { id: 'wifi', label: 'Wi-Fi', icon: Wifi },
                  { id: 'email', label: 'Email', icon: Mail },
                  { id: 'phone', label: 'Phone', icon: Phone },
                  { id: 'contact', label: 'vCard', icon: User },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = contentType === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setContentType(item.id as QrContentType)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition text-center cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[11px] truncate w-full">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inputs based on selected content type */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
              {contentType === 'url' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Website URL</label>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              )}

              {contentType === 'text' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Plain Text</label>
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    rows={4}
                    placeholder="Enter any note or message..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 resize-y"
                  />
                </div>
              )}

              {contentType === 'wifi' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Network Name (SSID)</label>
                      <input
                        type="text"
                        value={wifiSsid}
                        onChange={(e) => setWifiSsid(e.target.value)}
                        placeholder="Network SSID"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Password</label>
                      <input
                        type="text"
                        value={wifiPassword}
                        onChange={(e) => setWifiPassword(e.target.value)}
                        placeholder="Network Password"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-600 dark:text-slate-400">Security:</span>
                      {(['WPA', 'WEP', 'nopass'] as const).map((mode) => (
                        <label key={mode} className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="wifiAuth"
                            checked={wifiAuth === mode}
                            onChange={() => setWifiAuth(mode)}
                            className="text-indigo-600"
                          />
                          <span className="uppercase">{mode === 'nopass' ? 'Open' : mode}</span>
                        </label>
                      ))}
                    </div>

                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400">
                      <input
                        type="checkbox"
                        checked={wifiHidden}
                        onChange={(e) => setWifiHidden(e.target.checked)}
                        className="rounded text-indigo-600"
                      />
                      <span>Hidden SSID</span>
                    </label>
                  </div>
                </div>
              )}

              {contentType === 'email' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Recipient Email</label>
                    <input
                      type="email"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      placeholder="recipient@example.com"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Subject</label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Subject line"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Body</label>
                    <textarea
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      rows={2}
                      placeholder="Email message..."
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none resize-y"
                    />
                  </div>
                </div>
              )}

              {contentType === 'phone' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Phone Number</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 555 123 4567"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none font-mono"
                  />
                </div>
              )}

              {contentType === 'contact' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
                      <input
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="John Smith"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Organization / Title</label>
                      <input
                        type="text"
                        value={contactOrg}
                        onChange={(e) => setContactOrg(e.target.value)}
                        placeholder="Acme Inc."
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Phone</label>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+1 234 567 8900"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email</label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Visual Customization & Colors */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Color & Size Customization</div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
                {/* Foreground Color */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-500">QR Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer p-0"
                    />
                    <span className="text-xs font-mono text-slate-700 dark:text-slate-300">{fgColor}</span>
                  </div>
                </div>

                {/* Background Color */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-500">Background</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer p-0"
                    />
                    <span className="text-xs font-mono text-slate-700 dark:text-slate-300">{bgColor}</span>
                  </div>
                </div>

                {/* Resolution / Size */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-500">Resolution: {qrSize}px</label>
                  <input
                    type="range"
                    min="200"
                    max="600"
                    step="50"
                    value={qrSize}
                    onChange={(e) => setQrSize(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                {/* Error Correction */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-500">Error Correction</label>
                  <select
                    value={errorCorrection}
                    onChange={(e) => setErrorCorrection(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="L">L - Low (7%)</option>
                    <option value="M">M - Medium (15%)</option>
                    <option value="Q">Q - Quartile (25%)</option>
                    <option value="H">H - High (30%)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* QR Preview & Download Column */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-5 text-center shadow-xs sticky top-20">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Live QR Preview</div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 inline-flex items-center justify-center mx-auto max-w-full overflow-hidden shadow-inner">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Generated QR Code"
                  className="rounded-lg shadow-xs max-w-[240px] max-h-[240px] object-contain"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">
                  Generating QR...
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-500 font-mono break-all line-clamp-2 px-2">
              {qrPayload}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={downloadPng}
                disabled={!qrDataUrl}
                className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Download PNG</span>
              </button>

              <button
                onClick={downloadSvg}
                disabled={!qrSvgString}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Download className="w-4 h-4" />
                <span>Download SVG</span>
              </button>
            </div>

            <button
              onClick={() => copyToClipboard(qrPayload)}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-600 dark:text-slate-400 font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Raw Data'}</span>
            </button>
          </div>
        </div>
      )}

      {/* SCANNER MODE */}
      {activeTab === 'scanner' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-5 text-center shadow-xs">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Scan Any QR Code</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scan instantly using your device camera or upload an image file. 100% private in-browser decoding.
              </p>
            </div>

            {/* Hidden canvas for video processing */}
            <canvas ref={scanCanvasRef} className="hidden" />

            {/* Video Viewport or Camera Inactive Placeholder */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 aspect-video flex items-center justify-center max-h-80 mx-auto w-full">
              {isCameraActive ? (
                <>
                  <video ref={videoRef} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 border-2 border-indigo-500/50 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-dashed border-indigo-400 rounded-2xl animate-pulse flex items-center justify-center">
                      <span className="text-[10px] font-mono text-indigo-300 bg-slate-900/80 px-2 py-0.5 rounded">
                        Aim at QR Code
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div className="text-xs text-slate-400">
                    {cameraLoading ? 'Starting camera...' : 'Camera is currently inactive.'}
                  </div>
                </div>
              )}
            </div>

            {/* Scanner Controls */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {!isCameraActive ? (
                <button
                  onClick={startCamera}
                  disabled={cameraLoading}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  <span>{cameraLoading ? 'Connecting...' : 'Scan with Camera'}</span>
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <VideoOff className="w-4 h-4" />
                  <span>Stop Camera</span>
                </button>
              )}

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <Upload className="w-4 h-4" />
                <span>Upload QR Image</span>
              </button>
            </div>

            {/* Error Message */}
            {scanError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{scanError}</span>
              </div>
            )}

            {/* Scan Success Result */}
            {scanResult && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-left space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                    <Check className="w-4 h-4" />
                    <span>Scanned Successfully</span>
                  </div>
                  <button
                    onClick={() => setScanResult(null)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-medium cursor-pointer"
                  >
                    Clear
                  </button>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-emerald-100 dark:border-emerald-900 font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all">
                  {scanResult}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => copyToClipboard(scanResult)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Decoded Text'}</span>
                  </button>

                  {/^https?:\/\//i.test(scanResult) && (
                    <a
                      href={scanResult}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Link</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
