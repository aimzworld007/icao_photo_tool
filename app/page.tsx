"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Camera,
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  User,
  ShieldCheck,
  FileText,
  History,
  ChevronRight,
  Search,
  BookOpen,
  ArrowRight,
  Activity,
  Maximize2,
  Lock,
  Scale,
  Smile,
  Image as ImageIcon,
  Check,
  X,
  Plus,
  Compass,
  FileCheck,
  Eye,
  Info,
  HelpCircle,
  AlertCircle,
  Download,
  Sun,
  Moon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KycComparisonSplitView } from "@/components/KycComparisonSplitView";

// Define strict types for the ICAO compliance check
interface CategoryCheck {
  passed: boolean;
  score?: number;
  color?: string;
  uniformityScore?: number;
  centeringScore?: number;
  rotationScore?: number;
  eyeLevelScore?: number;
  neutralExpressionScore?: number;
  mouthClosed?: boolean;
  eyesOpenScore?: number;
  glassesIssues?: string;
  shadowsScore?: number;
  blurScore?: number;
  contrastScore?: number;
  feedback: string;
}

interface LandmarkCoordinates {
  eyeLeft: number[];
  eyeRight: number[];
  noseTip: number[];
  mouthCenter: number[];
  chinBottom: number[];
  crownTop: number[];
  faceRect: number[];
}

interface IcaoReport {
  eligible: boolean;
  overallScore: number;
  rejectionReasons: string[];
  analysis: {
    background: CategoryCheck;
    poseAndAlignment: CategoryCheck;
    expression: CategoryCheck;
    eyesAndGlasses: CategoryCheck;
    lightingAndShadows: CategoryCheck;
    imageQuality: CategoryCheck;
  };
  landmarksPercent: LandmarkCoordinates;
}

interface KycReport {
  matched: boolean;
  similarityScore: number;
  confidenceLevel: string;
  verdict: string;
  landmarkMatching: {
    eyes: { similarity: number; feedback: string };
    nose: { similarity: number; feedback: string };
    faceShape: { similarity: number; feedback: string };
    mouthAndJaw: { similarity: number; feedback: string };
  };
  antiSpoofingAudit: {
    isSpoofingDetected: boolean;
    livenessIndicators: string[];
    assessment: string;
  };
  rejectionReasons: string[];
}

interface AuditRecord {
  id: string;
  timestamp: string;
  type: "compliance_scan" | "identity_match";
  photoUrl: string;
  secondaryPhotoUrl?: string;
  score: number;
  status: "PASSED" | "FAILED" | "WARNING" | "VERIFIED" | "MISMATCH";
  details: string;
}

// Preset Sandbox Samples
const SAMPLE_PHOTOS = [
  {
    id: "compliant",
    name: "Perfect ICAO Standard (Emirates ID)",
    url: "/icao_perfect.png",
    description: "Standard gray uniform background, neutral expression, crisp focus. Perfect for UAE Residency processing.",
    type: "compliant"
  },
  {
    id: "smile",
    name: "Imperfect Photo (Invalid Expression)",
    url: "/icao_flawed.png",
    description: "Smiles are restricted for official Emirates ID. Teeth show, altering biometric landmarks.",
    type: "smile_violation"
  },
  {
    id: "shadows",
    name: "Imperfect Photo (Bad Lighting)",
    url: "/icao_shadow.png",
    description: "Dark shadows on face or background. Typing centers will reject this for UAE Residency.",
    type: "shadow_violation"
  },
  {
    id: "glasses",
    name: "Imperfect Photo (Reflective Spectacles)",
    url: "/icao_glasses.png",
    description: "Heavy dark frames masking facial points and causing glare, prohibited by ICA standards.",
    type: "glasses_violation"
  }
];

const KYC_SAMPLES = [
  {
    id: "match-1",
    name: "Valid Match Pair",
    selfie: "https://picsum.photos/seed/client_s1/500/600",
    doc: "https://picsum.photos/seed/client_s1/480/580",
    description: "Same person. Webcam selfie matched successfully with high-resolution travel passport print bio-node.",
    matched: true
  },
  {
    id: "match-2",
    name: "Mismatched Person Check",
    selfie: "https://picsum.photos/seed/client_s2/500/600",
    doc: "https://picsum.photos/seed/client_passport3/480/580",
    description: "Identity fraud warning. Selfie of applicant doesn't agree with official database ID portrait.",
    matched: false
  }
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<"icao" | "kyc" | "explorer" | "audit">("icao");

  // Dynamic Theme state
  const [mounted, setMounted] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    let isDark = false;
    if (saved === "dark") {
      isDark = true;
    } else if (saved === "light") {
      isDark = false;
    } else {
      isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    
    // Defer state update out of synchronous React render batch to comply with linter rules
    const timer = setTimeout(() => {
      setDarkMode(isDark);
      setMounted(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode, mounted]);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("Service Worker registered with scope:", reg.scope))
        .catch((err) => console.error("Service Worker registration failed:", err));
    }
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", nextDark ? "dark" : "light");
    }
  };

  // Tab 1: ICAO compliance States
  const [icaoPhoto, setIcaoPhoto] = useState<string | null>(null);
  const [analyzingIcao, setAnalyzingIcao] = useState(false);
  const [icaoReport, setIcaoReport] = useState<IcaoReport | null>(null);
  const [icaoError, setIcaoError] = useState<string | null>(null);
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);

  // Tab 2: KYC match states
  const [kycSelfie, setKycSelfie] = useState<string | null>(null);
  const [kycDoc, setKycDoc] = useState<string | null>(null);
  const [analyzingKyc, setAnalyzingKyc] = useState(false);
  const [kycReport, setKycReport] = useState<KycReport | null>(null);
  const [kycError, setKycError] = useState<string | null>(null);

  // Webcam stream handlers
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [webcamActive, setWebcamActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [webcamPurpose, setWebcamPurpose] = useState<"icao" | "kyc-selfie" | null>(null);

  // Log Storage State
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("icao_kyc_audit_logs");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAuditLogs(parsed);
        return;
      } catch (e) {
        console.error("Failed to parse logs", e);
      }
    }
    
    // Seed prefilled compliance log if storage empty
    const defaultLogs: AuditRecord[] = [
      {
        id: "TX-2026-0912A",
        timestamp: new Date(Date.now() - 3600000 * 2.5).toLocaleString(),
        type: "compliance_scan",
        photoUrl: "https://picsum.photos/seed/icao_f_1/500/600",
        score: 95,
        status: "PASSED",
        details: "Compliance test completed under normal background: Gray uniform. Neutral expression."
      },
      {
        id: "TX-2026-0912B",
        timestamp: new Date(Date.now() - 3600000 * 18).toLocaleString(),
        type: "identity_match",
        photoUrl: "https://picsum.photos/seed/client_s1/500/600",
        secondaryPhotoUrl: "https://picsum.photos/seed/client_s1/480/580",
        score: 94,
        status: "VERIFIED",
        details: "Biometric matching passed with high similarity and reliable liveness triggers."
      }
    ];
    localStorage.setItem("icao_kyc_audit_logs", JSON.stringify(defaultLogs));
    setAuditLogs(defaultLogs);
  }, []);

  // Category view trigger
  const [expandedSection, setExpandedSection] = useState<string>("poseAndAlignment");

  // Sync to database simulated list
  const addLog = (newLog: AuditRecord) => {
    const amended = [newLog, ...auditLogs];
    setAuditLogs(amended);
    localStorage.setItem("icao_kyc_audit_logs", JSON.stringify(amended));
  };

  const clearLogs = () => {
    setAuditLogs([]);
    localStorage.removeItem("icao_kyc_audit_logs");
  };

  // Webcam actions
  const startWebcam = async (purpose: "icao" | "kyc-selfie") => {
    setCameraError(null);
    setWebcamPurpose(purpose);
    setWebcamActive(true);

    try {
      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        }
      };
      const rStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(rStream);
      if (videoRef.current) {
        videoRef.current.srcObject = rStream;
      }
    } catch (err: any) {
      console.error("Camera connection failed:", err);
      setCameraError("Camera permission denied, or webcam is busy. Please upload instead.");
      setWebcamActive(false);
      setWebcamPurpose(null);
    }
  };

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setWebcamActive(false);
    setWebcamPurpose(null);
  };

  const triggerCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Mirror the image to feel natural to user
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.6); // Reduced for faster AI scan
        
        if (webcamPurpose === "icao") {
          setIcaoPhoto(dataUrl);
          setIcaoReport(null);
          setIcaoError(null);
        } else if (webcamPurpose === "kyc-selfie") {
          setKycSelfie(dataUrl);
          setKycReport(null);
          setKycError(null);
        }
      }
    }
    stopWebcam();
  };

  // Upload handler for document, selfie, or compliance targets
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: "icao" | "kyc-selfie" | "kyc-doc") => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Str = reader.result as string;
        if (target === "icao") {
          setIcaoPhoto(base64Str);
          setIcaoReport(null);
          setIcaoError(null);
        } else if (target === "kyc-selfie") {
          setKycSelfie(base64Str);
          setKycReport(null);
          setKycError(null);
        } else if (target === "kyc-doc") {
          setKycDoc(base64Str);
          setKycReport(null);
          setKycError(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Convert external public images to base64 via temporary canvas to resolve secure sandboxing checks
  const loadPresetIcao = async (imageUrl: string) => {
    setIcaoError(null);
    setAnalyzingIcao(true);
    setIcaoReport(null);
    try {
      // Fetch matching template
      const res = await fetch(imageUrl, { credentials: "omit" });
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setIcaoPhoto(reader.result as string);
        setAnalyzingIcao(false);
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      console.warn("Direct template download blocked by CORS. Using direct simulation trigger.", e);
      // Fallback: draw beautiful gradient or set typical image url
      setIcaoPhoto(imageUrl);
      setAnalyzingIcao(false);
    }
  };

  const loadKycPair = async (selfieUrl: string, docUrl: string) => {
    setKycError(null);
    setKycReport(null);
    setKycSelfie(selfieUrl);
    setKycDoc(docUrl);
  };

  // Run Backend API - Compliance Analysis
  const runIcaoVerification = async () => {
    if (!icaoPhoto) return;
    setAnalyzingIcao(true);
    setIcaoError(null);
    setIcaoReport(null);

    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: icaoPhoto }),
      });

      const data = await response.json();
      if (data.success && data.report) {
        setIcaoReport(data.report);

        // Record compliance run logger
        addLog({
          id: `TX-COMP-${Math.floor(Math.random() * 89999 + 10000)}`,
          timestamp: new Date().toLocaleString(),
          type: "compliance_scan",
          photoUrl: icaoPhoto.substring(0, 500) === "data:image" ? icaoPhoto : SAMPLE_PHOTOS[0].url,
          score: data.report.overallScore,
          status: data.report.eligible ? "PASSED" : "FAILED",
          details: `Compliance scan complete. Eligibility: ${data.report.eligible ? "PASS" : "FAIL"}. Overall Compliance: ${data.report.overallScore}%. Reasons: ${data.report.rejectionReasons.slice(0, 2).join(", ") || "None"}`
        });
      } else {
        setIcaoError(data.error || "System rejected standard layout. Make sure face is clear.");
      }
    } catch (e: any) {
      console.error(e);
      setIcaoError("Backend network failure. Verify API connection and try again.");
    } finally {
      setAnalyzingIcao(false);
    }
  };

  // Run Backend API - Facial Recognition KYC verification matching
  const runKycVerification = async () => {
    if (!kycSelfie || !kycDoc) return;
    setAnalyzingKyc(true);
    setKycError(null);
    setKycReport(null);

    try {
      const response = await fetch("/api/match-identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selfie: kycSelfie, document: kycDoc }),
      });

      const data = await response.json();
      if (data.success && data.matchReport) {
        setKycReport(data.matchReport);

        addLog({
          id: `TX-MATCH-${Math.floor(Math.random() * 89999 + 10000)}`,
          timestamp: new Date().toLocaleString(),
          type: "identity_match",
          photoUrl: kycSelfie.substring(0, 500) === "data:image" ? kycSelfie : KYC_SAMPLES[0].selfie,
          secondaryPhotoUrl: kycDoc.substring(0, 500) === "data:image" ? kycDoc : KYC_SAMPLES[0].doc,
          score: data.matchReport.similarityScore,
          status: data.matchReport.matched ? "VERIFIED" : "MISMATCH",
          details: `Biometric matching complete. Match Decision: ${data.matchReport.verdict}. Similarity Score: ${data.matchReport.similarityScore}%`
        });
      } else {
        setKycError(data.error || "Matching algorithm interrupted. Check visual specs.");
      }
    } catch (e: any) {
      console.error(e);
      setKycError("Biometric network timeout. Try standard format.");
    } finally {
      setAnalyzingKyc(false);
    }
  };

  return (
    <div id="compliance-main-root" className={cn("min-h-screen antialiased font-sans flex flex-col transition-colors duration-200", (mounted && darkMode) ? "dark bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800")}>
      {/* Top Header */}
      <header id="app-header" className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                    ICAO Doc 9303 SECURE
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                    KYC Verified
                  </span>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-0.5">UAE Residency & Emirates ID Photo Check</h1>
              </div>
            </div>
            
            {/* Mobile/Tablet Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="md:hidden p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition duration-150 cursor-pointer flex items-center justify-center shadow-3xs"
              aria-label="Toggle dark mode"
              title="Toggle theme"
            >
              {(mounted && darkMode) ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-600" />}
            </button>
          </div>

          {/* Navigation Controls (Desktop) */}
          <div className="hidden md:flex items-center space-x-3 w-full md:w-auto overflow-x-auto no-scrollbar mask-fade-right md:mask-none pb-2 md:pb-0 -mb-2 md:mb-0">
            <nav className="flex items-center w-max bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveTab("icao")}
                className={cn(
                  "px-3.5 py-1.5 whitespace-nowrap rounded-lg text-xs font-semibold tracking-tight transition-all duration-150 flex items-center space-x-1.5 shrink-0",
                  activeTab === "icao" ? "bg-white text-blue-600 shadow-xs border border-slate-200" : "text-slate-500 hover:text-slate-900"
                )}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Compliance Scan</span>
              </button>
              <button
                onClick={() => setActiveTab("kyc")}
                className={cn(
                  "px-3.5 py-1.5 whitespace-nowrap rounded-lg text-xs font-semibold tracking-tight transition-all duration-150 flex items-center space-x-1.5 shrink-0",
                  activeTab === "kyc" ? "bg-white text-blue-600 shadow-xs border border-slate-200" : "text-slate-500 hover:text-slate-900"
                )}
              >
                <User className="w-3.5 h-3.5" />
                <span>Biometric Identity Match</span>
              </button>
              <button
                onClick={() => setActiveTab("explorer")}
                className={cn(
                  "px-3.5 py-1.5 whitespace-nowrap rounded-lg text-xs font-semibold tracking-tight transition-all duration-150 flex items-center space-x-1.5 shrink-0",
                  activeTab === "explorer" ? "bg-white text-blue-600 shadow-xs border border-slate-200" : "text-slate-500 hover:text-slate-900"
                )}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Standards Reference</span>
              </button>
              <button
                onClick={() => setActiveTab("audit")}
                className={cn(
                  "px-3.5 py-1.5 whitespace-nowrap rounded-lg text-xs font-semibold tracking-tight transition-all duration-150 flex items-center space-x-1.5 shrink-0",
                  activeTab === "audit" ? "bg-white text-blue-600 shadow-xs border border-slate-200" : "text-slate-500 hover:text-slate-900"
                )}
              >
                <History className="w-3.5 h-3.5" />
                <span>Audit Ledger</span>
                <span className="bg-slate-200 text-slate-700 text-[10px] w-4.5 h-4.5 flex items-center justify-center rounded-full font-bold">
                  {auditLogs.length}
                </span>
              </button>
            </nav>

            {/* Desktop Theme Toggle Button */}
            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition duration-150 cursor-pointer flex items-center justify-center shadow-3xs"
              aria-label="Toggle dark mode"
              title={(mounted && darkMode) ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {(mounted && darkMode) ? (
                <Sun className="w-4.5 h-4.5 text-amber-500" />
              ) : (
                <Moon className="w-4.5 h-4.5 text-indigo-600" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        
        <div className="mb-6 flex space-x-2 items-center bg-blue-50 border border-blue-100 rounded-xl p-4 shadow-sm text-sm text-blue-900 leading-relaxed max-w-4xl">
          <Info className="w-5 h-5 shrink-0 text-blue-600" />
          <p>
            Specially designed for UAE Typing Centers, Photo Studios, and residents to instantly verify photo compliance for <b>Emirates ID and UAE Residency processing</b>. Ensure ICAO Doc 9303 constraints are met before submission.
          </p>
        </div>

        {/* WEBCAM DIALOG SCREEN OVERLAY */}
        <AnimatePresence>
          {webcamActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
            >
              <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                    <h3 className="font-bold text-slate-900">Live Secure Biometric Capture</h3>
                  </div>
                  <button onClick={stopWebcam} className="text-slate-400 hover:text-slate-800 p-1 bg-slate-100 rounded-full">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="relative rounded-2xl bg-black overflow-hidden aspect-video border-2 border-blue-400 flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  
                  {/* ICAO Template Grid Guide Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    {/* Outer frame guideline */}
                    <div className="border border-blue-300/30 w-[90%] h-[90%] rounded-xl absolute" />
                    
                    {/* Face boundary ellipse */}
                    <div className="w-[45%] h-[70%] border-2 border-dashed border-blue-400/80 rounded-[50%/45%] flex flex-col items-center justify-center relative">
                      <div className="h-px w-full bg-blue-400/40 absolute top-[38%]" /> {/* Eye alignment line */}
                      <div className="h-px w-full bg-blue-400/40 absolute top-[62%]" /> {/* Mouth alignment line */}
                      <div className="w-px h-full bg-blue-400/40 absolute left-1/2" />  {/* Center axis */}
                    </div>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 text-slate-200 text-[10px] font-semibold uppercase tracking-widest px-3 py-1 rounded-md border border-slate-750 backdrop-blur-xs">
                      Align Face in Oval
                    </div>
                  </div>
                </div>

                {cameraError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center space-x-2 border border-red-200">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>{cameraError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button onClick={stopWebcam} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition duration-150">
                    Cancel
                  </button>
                  <button
                    onClick={triggerCapture}
                    disabled={!!cameraError}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition duration-150 flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture Snapshot</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* TAB 1: ICAO PHOTOGRAPH verification */}
        {activeTab === "icao" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Interactive Panel: Source Input */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm group">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center justify-between">
                  <span>Photo Selection Source</span>
                  <Camera className="w-4 h-4 text-blue-600" />
                </h3>

                {/* Main Interactive Drag/Drop Canvas Container */}
                <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50 text-center flex flex-col items-center justify-center group-hover:border-blue-300 transition-all duration-200 aspect-square overflow-hidden max-w-md mx-auto w-full">
                  {icaoPhoto ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={icaoPhoto}
                        alt="ICAO compliance candidate portrait"
                        className="max-h-full max-w-full rounded-lg object-contain shadow-sm"
                        id="icao-target-preview-img"
                      />

                      {/* LANDMARK DETECTION CANVAS OVERLAYS */}
                      {icaoReport && icaoReport.landmarksPercent && (
                        <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
                          
                          {/* Face Rect absolute box overlay */}
                          {icaoReport.landmarksPercent.faceRect && (
                            <div
                              style={{
                                left: `${icaoReport.landmarksPercent.faceRect[0]}%`,
                                top: `${icaoReport.landmarksPercent.faceRect[1]}%`,
                                width: `${icaoReport.landmarksPercent.faceRect[2]}%`,
                                height: `${icaoReport.landmarksPercent.faceRect[3]}%`,
                              }}
                              className="absolute border-2 border-emerald-500 border-dashed animate-pulse"
                            >
                              <span className="absolute -top-5 left-0 bg-emerald-600 text-white font-mono text-[9px] uppercase px-1 rounded">
                                Detected Face: {icaoReport.overallScore}% Conf
                              </span>
                            </div>
                          )}

                          {/* Specific Landmark dots */}
                          {[
                            { name: "eyeLeft", point: icaoReport.landmarksPercent.eyeLeft, label: "Left Eye" },
                            { name: "eyeRight", point: icaoReport.landmarksPercent.eyeRight, label: "Right Eye" },
                            { name: "noseTip", point: icaoReport.landmarksPercent.noseTip, label: "Nose Tip" },
                            { name: "mouthCenter", point: icaoReport.landmarksPercent.mouthCenter, label: "Oral Center" },
                            { name: "chinBottom", point: icaoReport.landmarksPercent.chinBottom, label: "Chin Profile" },
                            { name: "crownTop", point: icaoReport.landmarksPercent.crownTop, label: "Head Crown" }
                          ].map((landmark) => {
                            if (!landmark.point || landmark.point.length < 2) return null;
                            const isHighlighted = activeHighlight === landmark.name;
                            return (
                              <div
                                key={landmark.name}
                                style={{
                                  left: `${landmark.point[0]}%`,
                                  top: `${landmark.point[1]}%`,
                                }}
                                className="absolute -translate-x-1/2 -translate-y-1/2 z-10 transition-all duration-200"
                              >
                                <div className={cn(
                                  "w-3 h-3 rounded-full border-2 border-white flex items-center justify-center shadow-md",
                                  isHighlighted ? "bg-amber-500 scale-150 animate-bounce" : "bg-blue-500"
                                )}>
                                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                </div>
                                <span className={cn(
                                  "absolute left-4 top-1/2 -translate-y-1/2 bg-slate-900/90 text-white font-mono text-[8px] whitespace-nowrap rounded px-1 backdrop-blur-sm shadow-sm transition-opacity",
                                  isHighlighted ? "opacity-100" : "opacity-40"
                                )}>
                                  {landmark.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-8 text-slate-400">
                      <ImageIcon className="w-12 h-12 stroke-1 opacity-65 mb-3 text-slate-400" />
                      <p className="text-xs font-semibold mb-1 text-slate-600">Drag or drop candidate passport portrait</p>
                      <p className="text-[10px] text-slate-400 mb-4 max-w-xs leading-normal">Supports standard image files JPEG, PNG or WebP</p>
                      
                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <label className="cursor-pointer bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-sm transition">
                          <Upload className="w-3.5 h-3.5 text-slate-500" />
                          <span>Browse local files</span>
                          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "icao")} className="hidden" />
                        </label>
                        <button
                          onClick={() => startWebcam("icao")}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-sm transition"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Use webcam feed</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Clear source button overlay */}
                  {icaoPhoto && (
                    <button
                      onClick={() => {
                        setIcaoPhoto(null);
                        setIcaoReport(null);
                        setIcaoError(null);
                      }}
                      className="absolute top-3 right-3 bg-slate-900/85 hover:bg-slate-900 text-white p-1.5 rounded-full shadow-md backdrop-blur-xs transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Run Buttons action block */}
                {icaoPhoto && (
                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={runIcaoVerification}
                      disabled={analyzingIcao}
                      className={cn(
                        "flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md transition-all duration-150",
                        analyzingIcao ? "opacity-70 pointer-events-none" : ""
                      )}
                    >
                      {analyzingIcao ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      <span>{analyzingIcao ? "Executing ICAO Scanning Core..." : "Initiate Biometric Audit"}</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setIcaoPhoto(null);
                        setIcaoReport(null);
                        setIcaoError(null);
                      }}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition"
                    >
                      Clear All
                    </button>
                  </div>
                )}
              </div>

              {/* Template sandbox selection widget */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center space-x-1.5">
                  <Compass className="w-3.5 h-3.5 text-blue-600" />
                  <span>Interactive Test Samples</span>
                </h4>
                <p className="text-[11px] text-slate-500 mb-4 leading-normal">
                  Don&apos;t have a ready passport photo or webcam access? Select a sample dataset and click the scan button above.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {SAMPLE_PHOTOS.map((sample) => (
                    <button
                      key={sample.id}
                      onClick={() => loadPresetIcao(sample.url)}
                      className={cn(
                        "text-left p-2.5 rounded-xl border transition-all text-xs flex flex-col justify-between align-stretch text-slate-700 hover:border-blue-300 hover:bg-blue-50/20 group relative overflow-hidden",
                        icaoPhoto === sample.url ? "border-blue-600 bg-blue-50/40 text-blue-900" : "border-slate-205 border-slate-200"
                      )}
                    >
                      <div>
                        <span className="font-bold block tracking-tight truncate pr-4">{sample.name}</span>
                        <span className="text-[10px] text-neutral-500 line-clamp-2 mt-0.5 leading-normal">{sample.description}</span>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between">
                        <span className={cn(
                          "text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md",
                          sample.type === "compliant" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                        )}>
                          {sample.type === "compliant" ? "Pass" : "Warn/Fail"}
                        </span>
                        <ChevronRight className="w-3 h-3 text-neutral-400 group-hover:translate-x-0.5 transition" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Interactive Panel: compliance reports */}
            <div className="lg:col-span-7">
              <AnimatePresence mode="wait">
                
                {/* State A: Not started scanning */}
                {!icaoReport && !analyzingIcao && !icaoError && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 flex flex-col items-center justify-center min-h-[440px] shadow-sm"
                  >
                    <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4 border border-blue-100">
                      <FileCheck className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">Upload Portrait for ICAO Scan</h3>
                    <p className="text-xs text-slate-500 max-w-sm leading-normal mb-6">
                      Our system carries out automated biometric checking under standard framework doc ISO/IEC 19794-5, parsing backgrounds, shadow indices, smiles, and alignment ratios.
                    </p>
                    <div className="grid grid-cols-3 gap-6 max-w-md w-full border-t border-slate-100 pt-6">
                      <div className="text-center">
                        <span className="font-mono text-xs font-semibold text-slate-400">01</span>
                        <p className="text-[11px] font-bold text-slate-800 mt-1">Acquire Picture</p>
                      </div>
                      <div className="text-center">
                        <span className="font-mono text-xs font-semibold text-slate-400">02</span>
                        <p className="text-[11px] font-bold text-slate-800 mt-1">Gemini AI Audit</p>
                      </div>
                      <div className="text-center">
                        <span className="font-mono text-xs font-semibold text-slate-400">03</span>
                        <p className="text-[11px] font-bold text-slate-800 mt-1">Biometric Printout</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* State B: Engine Analyzing Loading frame */}
                {analyzingIcao && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white rounded-2xl border border-slate-200 p-8 text-center flex flex-col items-center justify-center min-h-[440px] shadow-sm"
                  >
                    <div className="relative mb-6">
                      <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">Scanning Face biometric indexes...</h3>
                    <p className="text-xs text-slate-500 max-w-xs leading-normal animate-pulse">
                      Analyzing pixel density, calculating background hue variances, checking facial geometric rotation and vertical guidelines...
                    </p>
                    <div className="w-full max-w-xs mt-6 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <motion.div 
                        className="bg-blue-600 h-full"
                        initial={{ width: "0%" }}
                        animate={{ width: "90%" }}
                        transition={{ duration: 15, ease: "easeOut" }}
                      />
                    </div>
                  </motion.div>
                )}

                {/* State C: Errors reported */}
                {icaoError && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white rounded-2xl border border-slate-200 p-8 text-center flex flex-col items-center justify-center min-h-[440px] shadow-sm"
                  >
                    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4 border border-red-250">
                      <AlertCircle className="w-8 h-8 text-red-650 text-red-600" />
                    </div>
                    <h3 className="text-base font-bold text-red-900 mb-1.5">Compliance Scan Failed</h3>
                    <p className="text-xs text-red-700 bg-red-50/50 p-4 rounded-xl border border-red-200/50 max-w-md leading-relaxed">
                      {icaoError}
                    </p>
                    <button
                      onClick={runIcaoVerification}
                      className="mt-6 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center space-x-2 shadow-sm transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Rerun verification Scan</span>
                    </button>
                  </motion.div>
                )}

                {/* State D: Successful Scanner report visualization! */}
                {icaoReport && !analyzingIcao && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col gap-6"
                  >
                    
                    {/* Top Stats Cards summary bar */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-center gap-6">
                      
                      {/* Overall Compliance gauge */}
                      <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-95" viewBox="0 0 36 36">
                          <path
                            className="text-slate-100"
                            strokeWidth="3.5"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className={cn(
                              icaoReport.eligible ? "text-emerald-500" : icaoReport.overallScore > 75 ? "text-amber-500" : "text-red-500"
                            )}
                            strokeWidth="3.5"
                            strokeDasharray={`${icaoReport.overallScore}, 100`}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="font-mono text-2xl font-bold tracking-tight text-slate-800">{icaoReport.overallScore}%</span>
                          <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Audit Score</span>
                        </div>
                      </div>

                      {/* Score description verdict panel */}
                      <div className="flex-grow space-y-1.5 text-center md:text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-center md:justify-start gap-2">
                          <h4 className="text-base font-bold text-slate-900">Scan Assessment Outcome</h4>
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider self-center border",
                            icaoReport.eligible
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          )}>
                            {icaoReport.eligible ? "PASSED Compliance" : "CRITICAL WARNING"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-normal">
                          {icaoReport.eligible
                            ? "This portrait conforms to strict standards set by ICAO specifications under passport photo regulations. Ready to export."
                            : "One or more critical components did not meet the machine-readable requirements. See audit notes below for remediation."}
                        </p>
                      </div>

                    </div>

                    {/* Critical Alerts panel */}
                    {icaoReport.rejectionReasons.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3 text-xs text-amber-800">
                        <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-bold">Required Actions for Compliance Entry:</p>
                          <ul className="list-disc list-inside space-y-0.5 pl-1 opacity-90 leading-normal">
                            {icaoReport.rejectionReasons.map((reason, i) => (
                              <li key={i}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Collapsible Checker Category List */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center space-x-1.5 px-1">
                        <Activity className="w-3.5 h-3.5 text-blue-600" />
                        <span>Visual Feature Standards Breakdown</span>
                      </h4>

                      {[
                        {
                          key: "poseAndAlignment",
                          name: "Pose Alignment & Fitting ratios",
                          icon: Scale,
                          desc: "Analyzes centering index, tilt angle, yaw rotation and head proportion height.",
                          landmarkLinks: ["eyeLeft", "eyeRight", "crownTop", "chinBottom", "faceRect"]
                        },
                        {
                          key: "expression",
                          name: "Facial Expression Neutrality",
                          icon: Smile,
                          desc: "Ensures mouth is shut, eye muscles are relaxed, and jaw shows zero teeth/smiling profiles.",
                          landmarkLinks: ["mouthCenter"]
                        },
                        {
                          key: "eyesAndGlasses",
                          name: "Eye Visibility & Optical analysis",
                          icon: Eye,
                          desc: "Detects spectacles obstruction, frame shadow indices, iris occlusion, or blinking eyes.",
                          landmarkLinks: ["eyeLeft", "eyeRight"]
                        },
                        {
                          key: "background",
                          name: "Background Pattern & uniformities",
                          icon: ImageIcon,
                          desc: "Detects background shadows, gradients, clutter, or off-standard back-wall coloration.",
                          landmarkLinks: []
                        },
                        {
                          key: "lightingAndShadows",
                          name: "Lighting Quality & Hotspots",
                          icon: Compass,
                          desc: "Checks even illumination, under-eye shadow, flash flares, and high luminosity zones.",
                          landmarkLinks: []
                        },
                        {
                          key: "imageQuality",
                          name: "Image Quality, Sharpness & Resolution",
                          icon: Maximize2,
                          desc: "Screens for digital artifact noise, focal pixel bluriness, edge contrast, or pixelation.",
                          landmarkLinks: []
                        }
                      ].map((item) => {
                        const scoreData = icaoReport.analysis[item.key as keyof IcaoReport["analysis"]];
                        if (!scoreData) return null;

                        const isExpanded = expandedSection === item.key;
                        const specIcon = item.icon;

                        // Calculate dynamic sub-score to display
                        const subScore = scoreData.uniformityScore ?? scoreData.centeringScore ?? scoreData.neutralExpressionScore ?? scoreData.eyesOpenScore ?? scoreData.shadowsScore ?? scoreData.blurScore ?? 100;

                        return (
                          <div key={item.key} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm transition-colors duration-150">
                            
                            {/* Panel Header */}
                            <button
                              onClick={() => setExpandedSection(isExpanded ? "" : item.key)}
                              className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50/50 transition duration-150"
                            >
                              <div className="flex items-center space-x-3 min-w-0">
                                <div className={cn(
                                  "p-2 rounded-lg",
                                  scoreData.passed ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                                )}>
                                  {scoreData.passed ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                </div>
                                <div className="min-w-0">
                                  <span className="font-bold text-xs text-slate-900 block tracking-tight pr-2">{item.name}</span>
                                  <span className="text-[10px] text-slate-500 block truncate max-w-sm">{item.desc}</span>
                                </div>
                              </div>

                              <div className="flex items-center space-x-3 shrink-0">
                                <div className="text-right">
                                  <span className="font-mono text-xs font-bold text-slate-800">{subScore}%</span>
                                   <span className="text-[8px] text-slate-400 block uppercase font-semibold">Quality Index</span>
                                </div>
                                <ChevronRight className={cn(
                                  "w-3.5 h-3.5 text-slate-400 transition-transform duration-200",
                                  isExpanded ? "rotate-90 text-slate-800" : ""
                                )} />
                              </div>
                            </button>

                            {/* Expanded Panel content */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: "auto" }}
                                  exit={{ height: 0 }}
                                  className="overflow-hidden border-t border-slate-100 bg-slate-50/50"
                                >
                                  <div className="p-4 text-xs space-y-3">
                                    <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs leading-relaxed text-slate-600">
                                      {scoreData.feedback}
                                    </div>

                                    {/* Action links to show/hide the landmark points overlay */}
                                    {item.landmarkLinks.length > 0 && (
                                      <div className="flex items-center space-x-2 pt-1 border-t border-slate-100/60">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Inspect Landmarks:</span>
                                        <div className="flex flex-wrap gap-1.5">
                                          {item.landmarkLinks.map((landmarkName) => (
                                            <button
                                              key={landmarkName}
                                              onMouseEnter={() => setActiveHighlight(landmarkName)}
                                              onMouseLeave={() => setActiveHighlight(null)}
                                              onClick={() => setActiveHighlight(activeHighlight === landmarkName ? null : landmarkName)}
                                              className={cn(
                                                "px-2.5 py-1 rounded-md text-[10px] font-semibold transition border",
                                                activeHighlight === landmarkName
                                                  ? "bg-amber-600 text-white border-amber-500 shadow-2xs"
                                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                              )}
                                            >
                                              {landmarkName.replace(/([A-Z])/g, " $1")}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                          </div>
                        );
                      })}
                    </div>

                  </motion.div>
                )}

              </AnimatePresence>
            </div>

          </div>
        )}


        {/* TAB 2: BIOMETRIC IDENTITY MATCHING */}
        {activeTab === "kyc" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Photo pair ingestion slots */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center justify-between">
                  <span>Biometric Target Ingestion</span>
                  <Compass className="w-4 h-4 text-blue-600" />
                </h3>
                <p className="text-[11px] text-slate-500 mb-4 leading-normal">
                  To perform identity verification, pair a live Captured Selfie (webcam preferred) with a photograph of the official identification card (Passport/License).
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {/* Slot A: Live Captured Selfie */}
                  <div className="text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-2 tracking-wider">Applicant Selfie (Live)</span>
                    <div className="relative border-2 border-dashed border-slate-200 bg-slate-50 rounded-xl aspect-[4/5] flex flex-col items-center justify-center p-2 group hover:border-blue-300 transition overflow-hidden">
                      {kycSelfie ? (
                        <div className="relative w-full h-full">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={kycSelfie} alt="Kyc applicant selfie" className="w-full h-full object-cover rounded-lg shadow-2xs" />
                          <button
                            onClick={() => setKycSelfie(null)}
                            className="absolute top-2 right-2 bg-slate-900/80 p-1.5 rounded-full text-white shadow-md hover:bg-slate-950 transition"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-2">
                          <User className="w-8 h-8 opacity-45 text-slate-400 mb-2" />
                          <label className="cursor-pointer bg-white hover:bg-slate-100 text-slate-700 font-bold px-2 py-1.5 rounded-lg border border-slate-300 text-[10px] block transition shadow-2xs mb-1.5">
                            Browse File
                            <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "kyc-selfie")} className="hidden" />
                          </label>
                          <button
                            onClick={() => startWebcam("kyc-selfie")}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2 py-1.5 rounded-lg text-[10px] flex items-center space-x-1 shadow-2xs transition"
                          >
                            <Camera className="w-3 h-3" />
                            <span>Webcam Capture</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Slot B: Official Passport Photo */}
                  <div className="text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-2 tracking-wider">Official Document ID ID</span>
                    <div className="relative border-2 border-dashed border-slate-200 bg-slate-50 rounded-xl aspect-[4/5] flex flex-col items-center justify-center p-2 group hover:border-blue-300 transition overflow-hidden">
                      {kycDoc ? (
                        <div className="relative w-full h-full">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={kycDoc} alt="Official Database passport" className="w-full h-full object-cover rounded-lg shadow-2xs" />
                          <button
                            onClick={() => setKycDoc(null)}
                            className="absolute top-2 right-2 bg-slate-900/80 p-1.5 rounded-full text-white shadow-md hover:bg-slate-950 transition"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-2">
                          <FileText className="w-8 h-8 opacity-45 text-slate-400 mb-2" />
                          <label className="cursor-pointer bg-white hover:bg-slate-100 text-slate-700 font-bold px-3 py-2 rounded-lg border border-slate-300 text-[10px] block transition shadow-2xs">
                            Browse ID Image
                            <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "kyc-doc")} className="hidden" />
                          </label>
                          <span className="text-[9px] text-slate-400 mt-2 block leading-snug">Passport, Driver license, or Emirates ID portrait page</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Audit trigger buttons */}
                {kycSelfie && kycDoc && (
                  <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
                    <button
                      onClick={runKycVerification}
                      disabled={analyzingKyc}
                      className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md transition disabled:opacity-50"
                    >
                      {analyzingKyc ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      <span>{analyzingKyc ? "Biometric Cross Referencing..." : "Compute Match Verdict"}</span>
                    </button>
                    <button
                      onClick={() => {
                        setKycSelfie(null);
                        setKycDoc(null);
                        setKycReport(null);
                        setKycError(null);
                      }}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 rounded-xl transition"
                    >
                      Reset
                    </button>
                  </div>
                )}
              </div>

              {/* KYC Demo Pair helper widget */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>KYC Biometric Trial Dataset</span>
                </h4>
                <p className="text-[11px] text-slate-500 mb-4 leading-normal">
                  Select a test match scenario below. The backend compares structural bone vectors to diagnose identity status.
                </p>

                <div className="space-y-2">
                  {KYC_SAMPLES.map((sample, i) => (
                    <button
                      key={sample.id}
                      onClick={() => loadKycPair(sample.selfie, sample.doc)}
                      className={cn(
                        "w-full text-left p-2.5 rounded-xl border text-xs flex items-center justify-between transition hover:bg-emerald-50/10 group",
                        kycSelfie === sample.selfie ? "border-emerald-600 bg-emerald-50/20 text-emerald-955 font-semibold" : "border-slate-200"
                      )}
                    >
                      <div>
                        <span className="font-bold block tracking-tight text-slate-800">{sample.name}</span>
                        <span className="text-[10px] text-slate-500 block leading-normal">{sample.description}</span>
                      </div>
                      <span className={cn(
                        "text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded self-center",
                        sample.matched ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
                      )}>
                        {sample.matched ? "Matched Pair" : "Fraud Test"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column: outputs */}
            <div className="lg:col-span-7">
              <AnimatePresence mode="wait">
                
                {/* State A: Incomplete state screen */}
                {!kycReport && !analyzingKyc && !kycError && (!kycSelfie || !kycDoc) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 flex flex-col items-center justify-center min-h-[460px] shadow-sm"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4 border border-emerald-100">
                      <User className="w-8 h-8 text-emerald-600 animate-pulse" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">KYC Facial Match Station</h3>
                    <p className="text-xs text-slate-500 max-w-sm leading-normal mb-6">
                      Load candidate photo assets into the slots on the left. Our biometric agent executes an automated comparison checklist to bypass spoofing risks.
                    </p>
                    <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl max-w-md w-full text-left space-y-2.5">
                      <div className="flex items-center space-x-2 text-[11px] font-semibold text-slate-600">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Compares 80+ structural facial coordinates</span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] font-semibold text-slate-600">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Calculates precise Interpupillary distance margins</span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] font-semibold text-slate-600">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Screens for print-attack spoofing metrics</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* State A.2: Interactive pre-match manual inspection (Both files loaded, before verify is clicked) */}
                {!kycReport && !analyzingKyc && !kycError && kycSelfie && kycDoc && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center space-x-3 text-xs text-amber-800 shadow-3xs">
                      <Info className="w-4 h-4 text-amber-600 shrink-0 animate-bounce" />
                      <p className="font-semibold">
                        Ready for verification! Click the green <b>&quot;Compute Match Verdict&quot;</b> button on the left to output comprehensive biometric analytics.
                      </p>
                    </div>
                    <KycComparisonSplitView selfieUrl={kycSelfie} docUrl={kycDoc} />
                  </motion.div>
                )}

                {/* State B: In execution status */}
                {analyzingKyc && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white rounded-2xl border border-slate-200 p-8 text-center flex flex-col items-center justify-center min-h-[460px] shadow-sm"
                  >
                    <div className="relative mb-6">
                      <div className="w-16 h-16 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6 text-emerald-600" />
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">Comparing facial profile nodes...</h3>
                    <p className="text-xs text-slate-500 max-w-xs leading-normal animate-pulse">
                      Analyzing orbital alignment, relative jaw taper, nasal bridge structures and cross-referencing against passport security printing...
                    </p>
                    <div className="w-full max-w-xs mt-6 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <motion.div 
                        className="bg-emerald-600 h-full"
                        initial={{ width: "0%" }}
                        animate={{ width: "90%" }}
                        transition={{ duration: 15, ease: "easeOut" }}
                      />
                    </div>
                  </motion.div>
                )}

                {/* State C: Errors reported */}
                {kycError && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white rounded-2xl border border-slate-200 p-8 text-center flex flex-col items-center justify-center min-h-[460px] shadow-sm"
                  >
                    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4 border border-red-200">
                      <AlertCircle className="w-8 h-8 text-red-650 text-red-600" />
                    </div>
                    <h3 className="text-base font-bold text-red-900 mb-1.5">Biometric verification Scan Failed</h3>
                    <p className="text-xs text-red-700 bg-red-50/50 p-4 rounded-xl border border-red-200/50 max-w-md leading-relaxed">
                      {kycError}
                    </p>
                    <button
                      onClick={runKycVerification}
                      className="mt-6 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center space-x-2 shadow-sm transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Facial Match</span>
                    </button>
                  </motion.div>
                )}

                {/* State D: Successful Match Record visualization */}
                {kycReport && !analyzingKyc && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    {/* Score Summary box */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        
                        <div className="flex items-center space-x-4">
                          <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center border",
                            kycReport.matched
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                              : "bg-red-50 text-red-600 border-red-200"
                          )}>
                            {kycReport.matched ? <ShieldCheck className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Match verdict</span>
                            <h3 className="text-lg font-bold text-slate-900 mt-0.5">{kycReport.verdict}</h3>
                          </div>
                        </div>

                        <div className="text-center md:text-right">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Similarity Match score</span>
                          <div className="flex items-baseline md:justify-end mt-1 space-x-1.5">
                            <span className="font-mono text-3xl font-extrabold text-slate-900">{kycReport.similarityScore}%</span>
                            <span className="text-xs text-slate-500">Match score</span>
                          </div>
                          <span className="text-[9px] uppercase font-bold tracking-widest bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded mt-1.5 inline-block">
                            Confidence: {kycReport.confidenceLevel}
                          </span>
                        </div>

                      </div>
                    </div>

                    {/* Forensic Photo Overlap & Split-view Analyzer */}
                    <KycComparisonSplitView selfieUrl={kycSelfie!} docUrl={kycDoc!} />

                    {/* Liveness anti-spoofing audit report card */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center space-x-1.5 border-b border-slate-100 pb-3">
                        <Lock className="w-3.5 h-3.5 text-blue-600" />
                        <span>Biometric Authenticity & Liveness Audit</span>
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2 text-xs">
                            <span className="text-slate-500 font-medium">Liveness Integrity:</span>
                            <span className={cn(
                              "px-2 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider",
                              kycReport.antiSpoofingAudit.isSpoofingDetected
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            )}>
                              {kycReport.antiSpoofingAudit.isSpoofingDetected ? "POSSIBLE FRAUD ALERT" : "INTEGRITY CONFIRMED"}
                            </span>
                          </div>

                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs text-slate-600 leading-normal">
                            {kycReport.antiSpoofingAudit.assessment}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Liveness Verifications Passed:</span>
                          <div className="space-y-1.5">
                            {kycReport.antiSpoofingAudit.livenessIndicators.map((indicator, index) => (
                              <div key={index} className="flex items-center space-x-2 text-xs text-slate-700">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{indicator}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Morphological comparison parameters */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center space-x-1.5">
                        <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Biometric Landmark Alignment Indices</span>
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { key: "eyes", label: "Orbital & Pupil Distance", report: kycReport.landmarkMatching.eyes },
                          { key: "nose", label: "Nasal Ridge Symmetry", report: kycReport.landmarkMatching.nose },
                          { key: "faceShape", label: "Cheekbone & Jaw Tapestry", report: kycReport.landmarkMatching.faceShape },
                          { key: "mouthAndJaw", label: "Oral Alignment index", report: kycReport.landmarkMatching.mouthAndJaw }
                        ].map((landmark) => (
                          <div key={landmark.key} className="border border-slate-200 p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/55 transition duration-150">
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="font-bold text-xs text-slate-800">{landmark.label}</span>
                              <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 rounded-md border border-emerald-200">{landmark.report.similarity}% Match</span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-normal">{landmark.report.feedback}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* KYC Rejections alerts */}
                    {!kycReport.matched && kycReport.rejectionReasons.length > 0 && (
                      <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start space-x-3 text-xs text-red-800">
                        <AlertTriangle className="w-5 h-5 shrink-0 text-red-650 mt-0.5" />
                        <div>
                          <p className="font-bold">Biometric Discrepancy Warnings:</p>
                          <ul className="list-disc list-inside space-y-0.5 pl-1 opacity-90 leading-normal">
                            {kycReport.rejectionReasons.map((alert, i) => (
                              <li key={i}>{alert}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                  </motion.div>
                )}

              </AnimatePresence>
            </div>

          </div>
        )}


        {/* TAB 3: STANDARDS REFERENCE EXPLORER */}
        {activeTab === "explorer" && (
          <div className="space-y-8">
            
            {/* Top overview title block */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-950 text-white rounded-3xl p-8 shadow-md border border-slate-800">
              <div className="max-w-3xl space-y-2">
                <span className="text-[10px] bg-blue-500/10 text-slate-350 bg-slate-800/60 px-2.5 py-1 rounded uppercase tracking-widest font-bold border border-slate-700">
                  Official Standard UAE ICP & ICAO
                </span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Emirates ID & UAE Residency Photo Guidelines</h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-normal opacity-90 max-w-2xl">
                  The UAE&apos;s Federal Authority for Identity, Citizenship, Customs and Port Security (ICP) requires specific photo formats. System compliance scans assure that your portrait qualifies for processing without delays.
                </p>
              </div>
            </div>

            {/* Interactive Grid explorer with sub-rules */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3.5">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100 font-bold text-sm">
                  01
                </div>
                <h3 className="font-bold text-sm text-slate-900 leading-snug">Dimensions & Head Size</h3>
                <p className="text-xs text-slate-500 leading-normal leading-relaxed">
                  Photos must measure 35 × 45 mm (or 35 × 40 mm for select documents). The head must measure between 32 mm and 36 mm from chin to top of hair. The face must be perfectly centered and occupy 70% to 80% of the frame.
                </p>
                <div className="bg-slate-50 px-3 py-2 rounded-lg text-[10px] border border-slate-200 font-mono text-slate-600">
                  Age Constraint: &lt; 6 months old
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 font-bold text-sm">
                  02
                </div>
                <h3 className="font-bold text-sm text-slate-900 leading-snug">Pose & Expression</h3>
                <p className="text-xs text-slate-500 leading-normal leading-relaxed">
                  Expression must be neutral and natural. Do not smile, keep mouth completely closed. Head position must be straight-on, facing the camera directly. Eyes must be open, looking directly at the lens.
                </p>
                <div className="bg-slate-50 px-3 py-2 rounded-lg text-[10px] border border-slate-200 font-mono text-slate-600">
                  Teeth Visibility: STRICTLY PROHIBITED
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 font-bold text-sm">
                  03
                </div>
                <h3 className="font-bold text-sm text-slate-900 leading-snug">Background Standards</h3>
                <p className="text-xs text-slate-500 leading-normal leading-relaxed">
                  The background must be plain white. Uniform and balanced lighting is required without shadows on the face or background. Absolutely zero textured walls, wallpaper, plants, or other people may be visible.
                </p>
                <div className="bg-slate-50 px-3 py-2 rounded-lg text-[10px] border border-slate-200 font-mono text-slate-600">
                  Background Color: Plain White
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3.5">
                <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center border border-pink-100 font-bold text-sm">
                  04
                </div>
                <h3 className="font-bold text-sm text-slate-900 leading-snug">Spectacles & Eyewear</h3>
                <p className="text-xs text-slate-500 leading-normal leading-relaxed">
                  Not generally allowed unless worn daily for medical purposes. If worn, they must not cause reflection, glare, or cover the eyes in any way.
                </p>
                <div className="bg-slate-50 px-3 py-2 rounded-lg text-[10px] border border-slate-200 font-mono text-slate-600">
                  Medical Exception Only
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 font-bold text-sm">
                  05
                </div>
                <h3 className="font-bold text-sm text-slate-900 leading-snug">Dress Code & Headwear</h3>
                <p className="text-xs text-slate-500 leading-normal leading-relaxed">
                  Headwear allowed only for religious purposes and must not cover the eyes, eyebrows, or sides of the face. Emirati Citizens should align attire with official national dress.
                </p>
                <div className="bg-slate-50 px-3 py-2 rounded-lg text-[10px] border border-slate-200 font-mono text-slate-600">
                  Face Margins: Fully Visible
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3.5">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200 font-bold text-sm">
                  06
                </div>
                <h3 className="font-bold text-sm text-slate-900 leading-snug">File & Digital Specs</h3>
                <p className="text-xs text-slate-500 leading-normal leading-relaxed">
                  File Size: Between 1 MB and 5 MB (or &lt; 2 MB for bank KYC/smart channels). Format: PDF, JPG, JPEG, or PNG. Resolution: Minimum 600 DPI. No ink marks, creases, or digital alterations.
                </p>
                <div className="bg-slate-50 px-3 py-2 rounded-lg text-[10px] border border-slate-200 font-mono text-slate-600">
                  Allowed Formats: PDF, JPG, PNG
                </div>
              </div>

            </div>

            {/* Official PDF source citation alert */}
            <div className="bg-slate-100 border border-slate-300 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-xs">Looking for the official UAE ICP specification sheets?</h4>
                <p className="text-[11px] text-slate-500 leading-normal">
                  You can inspect the complete regulatory details referenced in our analysis parameters via standard ICP documentation templates.
                </p>
              </div>
              <a
                href="https://icp.gov.ae/wp-content/uploads/2021/11/icao_english.pdf"
                target="_blank"
                rel="noreferrer"
                className="bg-white hover:bg-slate-50 text-blue-700 font-bold border border-slate-300 font-semibold px-4 py-2 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-2xs shrink-0 self-start sm:self-auto transition"
              >
                <span>Read Official Standard PDF</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>
        )}


        {/* TAB 4: AUDIT LEDGER */}
        {activeTab === "audit" && (
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Enterprise Automated processing Ledger</h2>
                <p className="text-xs text-slate-500 leading-normal">
                  Secure local security audit ledger documenting KYC matches, compliance failures, and visual scanning results.
                </p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={clearLogs}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-red-650 font-bold border border-slate-200 rounded-lg text-xs transition"
                >
                  Clear Logs
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(auditLogs, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `ICAO_KYC_Audit_Logs_${new Date().toISOString().slice(0, 10)}.json`;
                    link.click();
                  }}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs flex items-center space-x-1.5 shadow-sm transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download JSON Report</span>
                </button>
              </div>
            </div>

            {/* Audit Table dashboard list */}
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                      <th className="py-3.5 px-6">ID & Timestamp</th>
                      <th className="py-3.5 px-4">Verification Class</th>
                      <th className="py-3.5 px-4">Score</th>
                      <th className="py-3.5 px-4">Eligibility Status</th>
                      <th className="py-3.5 px-4">Assurance Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {auditLogs.length > 0 ? (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition duration-150">
                          
                          {/* Log ID & date */}
                          <td className="py-4 px-6 min-w-[150px]">
                            <span className="font-mono font-bold text-xs text-slate-900 block">{log.id}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{log.timestamp}</span>
                          </td>

                          {/* Action Type */}
                          <td className="py-4 px-4 min-w-[140px]">
                            {log.type === "compliance_scan" ? (
                              <div className="flex items-center space-x-1.5 text-slate-700">
                                <Camera className="w-4 h-4 text-blue-600" />
                                <span className="font-semibold text-xs">ICAO Doc 9303</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1.5 text-slate-700">
                                <User className="w-4 h-4 text-emerald-600" />
                                <span className="font-semibold text-xs">KYC Identity Match</span>
                              </div>
                            )}
                          </td>

                          {/* Score quality */}
                          <td className="py-4 px-4">
                            <span className="font-mono font-bold text-slate-950 text-xs">{log.score}%</span>
                          </td>

                          {/* Verdict */}
                          <td className="py-4 px-4">
                            <span className={cn(
                              "inline-block px-2.5 py-0.5 rounded-full text-[9px] uppercase font-bold border",
                              log.status === "PASSED" || log.status === "VERIFIED"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : log.status === "WARNING"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            )}>
                              {log.status}
                            </span>
                          </td>

                          {/* Details feedback snippet */}
                          <td className="py-4 px-4 max-w-xs md:max-w-md leading-relaxed text-slate-600 pr-6">
                            <div className="truncate group relative hover:text-slate-900 cursor-help" title={log.details}>
                              {log.details}
                            </div>
                          </td>

                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-12 px-6 text-center text-slate-450 text-slate-400">
                          <History className="w-10 h-10 outline-hidden mx-auto mb-2 opacity-50" />
                          <p className="font-bold text-xs text-slate-600">No verification log events registered</p>
                          <p className="text-[10px] text-slate-450">Scanned logs will accumulate locally and persistent within browser session storage</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Footer Info bar */}
      <footer id="app-footer" className="border-t border-slate-200 bg-white py-6 mt-12 mb-16 md:mb-0 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="leading-normal font-medium text-slate-500">
            Built With <span className="text-red-500 text-sm">❤️</span> in UAE by <a href="https://ainulislam.info" target="_blank" rel="noopener noreferrer" className="font-bold text-slate-700 hover:text-blue-600 underline decoration-slate-300">Ainulislam.info</a>
          </p>
          <div className="flex space-x-4">
            <span className="text-[10px]">ICAO Doc 9303 & ISO/IEC 19794-5 specifications for Emirates ID.</span>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex items-center justify-around z-50 px-2 py-2 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => setActiveTab("icao")}
          className={cn(
            "flex flex-col items-center justify-center p-2 transition-all w-1/4",
            activeTab === "icao" ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-900 font-medium"
          )}
        >
          <Camera className={cn("w-5 h-5 mb-1 transition-colors", activeTab === "icao" ? "text-blue-600" : "text-slate-400")} />
          <span className="text-[10px] tracking-tight">Scan</span>
        </button>
        <button
          onClick={() => setActiveTab("kyc")}
          className={cn(
            "flex flex-col items-center justify-center p-2 transition-all w-1/4",
            activeTab === "kyc" ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-900 font-medium"
          )}
        >
          <User className={cn("w-5 h-5 mb-1 transition-colors", activeTab === "kyc" ? "text-blue-600" : "text-slate-400")} />
          <span className="text-[10px] tracking-tight">Identity</span>
        </button>
        <button
          onClick={() => setActiveTab("explorer")}
          className={cn(
            "flex flex-col items-center justify-center p-2 transition-all w-1/4",
            activeTab === "explorer" ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-900 font-medium"
          )}
        >
          <BookOpen className={cn("w-5 h-5 mb-1 transition-colors", activeTab === "explorer" ? "text-blue-600" : "text-slate-400")} />
          <span className="text-[10px] tracking-tight">Rules</span>
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={cn(
            "flex flex-col items-center justify-center p-2 transition-all w-1/4 relative",
            activeTab === "audit" ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-900 font-medium"
          )}
        >
          <History className={cn("w-5 h-5 mb-1 transition-colors", activeTab === "audit" ? "text-blue-600" : "text-slate-400")} />
          <span className="text-[10px] tracking-tight">Audit</span>
          <span className="absolute top-1 right-2 bg-slate-200 text-slate-700 text-[8px] w-3.5 h-3.5 flex items-center justify-center rounded-full font-bold shadow-xs">
            {auditLogs.length}
          </span>
        </button>
      </nav>
    </div>
  );
}
