"use client";

import { useState, useRef, MouseEvent, TouchEvent } from "react";
import { motion } from "motion/react";
import {
  Maximize2,
  Minimize2,
  Move,
  RotateCcw,
  Sliders,
  Eye,
  EyeOff,
  Grid,
  Sparkles,
  Link,
  Link2Off
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KycComparisonSplitViewProps {
  selfieUrl: string;
  docUrl: string;
}

export function KycComparisonSplitView({ selfieUrl, docUrl }: KycComparisonSplitViewProps) {
  const [zoom, setZoom] = useState(1.2);
  const [syncZoom, setSyncZoom] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [viewMode, setViewMode] = useState<"side-by-side" | "curtain">("side-by-side");
  const [curtainPosition, setCurtainPosition] = useState(50); // percentage 0-100

  // Pan states
  const [panSelfie, setPanSelfie] = useState({ x: 0, y: 0 });
  const [panDoc, setPanDoc] = useState({ x: 0, y: 0 });

  const isDraggingSelfie = useRef(false);
  const isDraggingDoc = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>, target: "selfie" | "doc") => {
    e.preventDefault();
    dragStart.current = { x: e.clientX, y: e.clientY };
    if (target === "selfie") {
      isDraggingSelfie.current = true;
    } else {
      isDraggingDoc.current = true;
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDraggingSelfie.current && !isDraggingDoc.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    dragStart.current = { x: e.clientX, y: e.clientY };

    if (isDraggingSelfie.current) {
      setPanSelfie((prev) => {
        const newX = prev.x + dx;
        const newY = prev.y + dy;
        if (syncZoom) {
          setPanDoc({ x: newX, y: newY });
        }
        return { x: newX, y: newY };
      });
    } else if (isDraggingDoc.current) {
      setPanDoc((prev) => {
        const newX = prev.x + dx;
        const newY = prev.y + dy;
        if (syncZoom) {
          setPanSelfie({ x: newX, y: newY });
        }
        return { x: newX, y: newY };
      });
    }
  };

  const handleMouseUp = () => {
    isDraggingSelfie.current = false;
    isDraggingDoc.current = false;
  };

  // Touch controls for mobile
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>, target: "selfie" | "doc") => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    dragStart.current = { x: touch.clientX, y: touch.clientY };
    if (target === "selfie") {
      isDraggingSelfie.current = true;
    } else {
      isDraggingDoc.current = true;
    }
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!isDraggingSelfie.current && !isDraggingDoc.current) return;
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStart.current.x;
    const dy = touch.clientY - dragStart.current.y;
    dragStart.current = { x: touch.clientX, y: touch.clientY };

    if (isDraggingSelfie.current) {
      setPanSelfie((prev) => {
        const newX = prev.x + dx;
        const newY = prev.y + dy;
        if (syncZoom) {
          setPanDoc({ x: newX, y: newY });
        }
        return { x: newX, y: newY };
      });
    } else if (isDraggingDoc.current) {
      setPanDoc((prev) => {
        const newX = prev.x + dx;
        const newY = prev.y + dy;
        if (syncZoom) {
          setPanSelfie({ x: newX, y: newY });
        }
        return { x: newX, y: newY };
      });
    }
  };

  const resetControls = () => {
    setZoom(1.0);
    setPanSelfie({ x: 0, y: 0 });
    setPanDoc({ x: 0, y: 0 });
  };

  const handleCurtainSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurtainPosition(Number(e.target.value));
  };

  return (
    <div id="kyc-comparison-station-root" className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm flex flex-col gap-4">
      {/* Dynamic Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 flex items-center w-max gap-1">
            <Sparkles className="w-3 h-3" /> Interactive Split View Analyzer
          </span>
          <h4 className="text-sm font-bold text-slate-900 mt-1">Biometric Feature Overlap & Magnification</h4>
          <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
            Compare biometric landmarks. Zoom in and drag the viewer canvas to verify subtle facial keypoints.
          </p>
        </div>

        {/* Quick View Modes Toggle */}
        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold self-start sm:self-auto shrink-0">
          <button
            onClick={() => { setViewMode("side-by-side"); resetControls(); }}
            className={cn(
              "px-3 py-1 rounded-md transition-all duration-150",
              viewMode === "side-by-side" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
            )}
          >
            Side-by-Side
          </button>
          <button
            onClick={() => { setViewMode("curtain"); resetControls(); }}
            className={cn(
              "px-3 py-1 rounded-md transition-all duration-150",
              viewMode === "curtain" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
            )}
          >
            Curtain slider
          </button>
        </div>
      </div>

      {/* Control Bar Dashboard */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
        {/* Zoom adjustment */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <span className="text-slate-500 font-bold shrink-0 flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5 text-blue-500" /> Zoom Level ({zoom.toFixed(1)}x):
          </span>
          <input
            type="range"
            min="1.0"
            max="4.0"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-full sm:w-32 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => setZoom(1.0)}
              className={cn("px-1.5 py-0.5 rounded border text-[10px] font-bold", zoom === 1.0 ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200")}
            >
              1.0x
            </button>
            <button
              onClick={() => setZoom(2.0)}
              className={cn("px-1.5 py-0.5 rounded border text-[10px] font-bold", zoom === 2.0 ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200")}
            >
              2.0x
            </button>
            <button
              onClick={() => setZoom(3.5)}
              className={cn("px-1.5 py-0.5 rounded border text-[10px] font-bold", zoom === 3.5 ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200")}
            >
              3.5x
            </button>
          </div>
        </div>

        {/* Feature Switches */}
        <div className="flex items-center space-x-3 ml-auto select-none">
          {/* Linked Pan & Zoom */}
          <button
            onClick={() => setSyncZoom(!syncZoom)}
            className={cn(
              "px-2.5 py-1.5 rounded-lg border text-[10px] font-bold flex items-center space-x-1.5 transition-all duration-150",
              syncZoom 
                ? "bg-blue-50 text-blue-700 border-blue-200 shadow-2xs" 
                : "bg-white text-slate-500 border-slate-200 hover:text-slate-800"
            )}
            title="Linked movement applies pan and zoom to both images simultaneously."
          >
            {syncZoom ? <Link className="w-3.5 h-3.5 text-blue-600" /> : <Link2Off className="w-3.5 h-3.5 text-slate-400" />}
            <span>{syncZoom ? "Linked Pan/Zoom" : "Independent Pan/Zoom"}</span>
          </button>

          {/* Biometric Reference Axis overlay */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={cn(
              "px-2.5 py-1.5 rounded-lg border text-[10px] font-bold flex items-center space-x-1.5 transition-all duration-150",
              showGrid 
                ? "bg-slate-900 text-white border-slate-900 shadow-2xs" 
                : "bg-white text-slate-500 border-slate-200 hover:text-slate-800"
            )}
            title="Toggle helper axis guidelines to align eye levels, nose tip, and jawline across both cards."
          >
            {showGrid ? <Eye className="w-3.5 h-3.5 text-slate-200" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
            <span>Alignment Axis</span>
          </button>

          {/* Reset position */}
          <button
            onClick={resetControls}
            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-600 font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-3xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset View</span>
          </button>
        </div>
      </div>

      {/* Main interactive Canvas Viewports */}
      <div 
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
        className="w-full relative select-none"
      >
        {viewMode === "side-by-side" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Box: Applicant Selfie */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1">Applicant Selfie</span>
              <div 
                onMouseDown={(e) => handleMouseDown(e, "selfie")}
                onTouchStart={(e) => handleTouchStart(e, "selfie")}
                className={cn(
                  "relative bg-slate-950 border border-slate-250 aspect-[4/5] overflow-hidden rounded-2xl cursor-grab transition-colors shadow-inner flex items-center justify-center",
                  zoom > 1 ? "cursor-grabbing" : ""
                )}
              >
                <div 
                  className="w-full h-full relative"
                  style={{
                    transform: `scale(${zoom}) translate(${panSelfie.x / zoom}px, ${panSelfie.y / zoom}px)`,
                    transformOrigin: "center center",
                    transition: "none",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selfieUrl} alt="Applicant biometric zoom" className="w-full h-full object-cover pointer-events-none" />
                </div>

                {/* Alignment Grid Guidelines Overlay */}
                {showGrid && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-1">
                    {/* Horizontal Biometric Guides */}
                    <div className="absolute top-[28%] left-0 right-0 border-t border-emerald-500/60 flex justify-between px-2 text-[8px] text-emerald-300 font-mono tracking-tighter">
                      <span>EYE HEIGHT LEVEL</span>
                      <span>EYE LEVEL</span>
                    </div>
                    <div className="absolute top-[48%] left-0 right-0 border-t border-emerald-500/40 flex justify-between px-2 text-[8px] text-emerald-300/80 font-mono tracking-tighter">
                      <span>NOSE POINT ALIGN</span>
                      <span>NOSE ALIGN</span>
                    </div>
                    <div className="absolute top-[65%] left-0 right-0 border-t border-emerald-500/40 flex justify-between px-2 text-[8px] text-emerald-300/80 font-mono tracking-tighter">
                      <span>CHIN LEVEL</span>
                      <span>CHIN LEVEL</span>
                    </div>
                    {/* Centering Vertical line */}
                    <div className="absolute top-0 bottom-0 left-1/2 -ml-px border-l border-dashed border-emerald-500/30"></div>
                  </div>
                )}

                {/* Status Indicator */}
                <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white px-2 py-1 rounded-md text-[8px] uppercase tracking-wider font-bold">
                  Camera source
                </div>
              </div>
            </div>

            {/* Right Box: Document photo */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1">Official Document Portrait</span>
              <div 
                onMouseDown={(e) => handleMouseDown(e, "doc")}
                onTouchStart={(e) => handleTouchStart(e, "doc")}
                className={cn(
                  "relative bg-slate-950 border border-slate-250 aspect-[4/5] overflow-hidden rounded-2xl cursor-grab transition-colors shadow-inner flex items-center justify-center",
                  zoom > 1 ? "cursor-grabbing" : ""
                )}
              >
                <div 
                  className="w-full h-full relative"
                  style={{
                    transform: `scale(${zoom}) translate(${panDoc.x / zoom}px, ${panDoc.y / zoom}px)`,
                    transformOrigin: "center center",
                    transition: "none",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={docUrl} alt="Document biometric zoom" className="w-full h-full object-cover pointer-events-none" />
                </div>

                {/* Alignment Grid Guidelines Overlay */}
                {showGrid && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-1">
                    {/* Horizontal Biometric Guides */}
                    <div className="absolute top-[28%] left-0 right-0 border-t border-emerald-500/60 flex justify-between px-2 text-[8px] text-emerald-300 font-mono tracking-tighter">
                      <span>EYE HEIGHT LEVEL</span>
                      <span>EYE LEVEL</span>
                    </div>
                    <div className="absolute top-[48%] left-0 right-0 border-t border-emerald-500/40 flex justify-between px-2 text-[8px] text-emerald-300/80 font-mono tracking-tighter">
                      <span>NOSE POINT ALIGN</span>
                      <span>NOSE ALIGN</span>
                    </div>
                    <div className="absolute top-[65%] left-0 right-0 border-t border-emerald-500/40 flex justify-between px-2 text-[8px] text-emerald-300/80 font-mono tracking-tighter">
                      <span>CHIN LEVEL</span>
                      <span>CHIN LEVEL</span>
                    </div>
                    {/* Centering Vertical line */}
                    <div className="absolute top-0 bottom-0 left-1/2 -ml-px border-l border-dashed border-emerald-500/30"></div>
                  </div>
                )}

                {/* Status Indicator */}
                <div className="absolute bottom-3 left-3 bg-emerald-950/90 backdrop-blur-xs text-emerald-300 px-2 py-1 rounded-md text-[8px] uppercase tracking-wider font-bold border border-emerald-500/20">
                  Passport ID Portrait
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Slider Curtain Reveal overlay mode */
          <div className="flex flex-col gap-1.5 items-center w-full">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 text-center w-full">Merged Curtain Overlay Spectrum</span>
            
            <div className="relative w-full max-w-xl aspect-[4/5] rounded-2xl overflow-hidden border border-slate-350 bg-slate-900 shadow-lg">
              {/* Background Layer: Selfie */}
              <div 
                onMouseDown={(e) => handleMouseDown(e, "selfie")}
                onTouchStart={(e) => handleTouchStart(e, "selfie")}
                className="absolute inset-0 cursor-grab"
              >
                <div
                  className="w-full h-full"
                  style={{
                    transform: `scale(${zoom}) translate(${panSelfie.x / zoom}px, ${panSelfie.y / zoom}px)`,
                    transformOrigin: "center center",
                    transition: "none",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selfieUrl} alt="Applicant layer" className="w-full h-full object-cover pointer-events-none" />
                </div>
              </div>

              {/* Foreground Layer clipPath: Document portrait */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  clipPath: `polygon(0 0, ${curtainPosition}% 0, ${curtainPosition}% 100%, 0 100%)`
                }}
              >
                <div
                  className="w-full h-full"
                  style={{
                    transform: `scale(${zoom}) translate(${panDoc.x / zoom}px, ${panDoc.y / zoom}px)`,
                    transformOrigin: "center center",
                    transition: "none",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={docUrl} alt="Document layer portrait" className="w-full h-full object-cover pointer-events-none" />
                </div>
              </div>

              {/* Dynamic Overlay vertical line helper */}
              <div 
                className="absolute top-0 bottom-0 pointer-events-none w-0.5 bg-blue-500 shadow-lg z-10"
                style={{ left: `${curtainPosition}%` }}
              >
                <div className="absolute top-1/2 -mt-4 -ml-4 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg border-2 border-white text-[10px] font-bold">
                  ↔️
                </div>
              </div>

              {/* Grid axes overlay inside curtain */}
              {showGrid && (
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-1 z-5">
                  <div className="absolute top-[28%] left-0 right-0 border-t border-blue-500/50 flex justify-between px-2 text-[8px] text-blue-200 font-mono">
                    <span>EYE BAR</span>
                    <span>EYE BAR</span>
                  </div>
                  <div className="absolute top-[48%] left-0 right-0 border-t border-blue-500/30 flex justify-between px-2 text-[8px] text-blue-200 font-mono">
                    <span>NOSE CORRELATION</span>
                    <span>NOSE CORRELATION</span>
                  </div>
                  <div className="absolute top-[65%] left-0 right-0 border-t border-blue-500/30 flex justify-between px-2 text-[8px] text-blue-200 font-mono">
                    <span>CHIN JOINT</span>
                    <span>CHIN JOINT</span>
                  </div>
                </div>
              )}

              {/* Interactive labels left & right */}
              <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-xs text-white px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-bold z-10 pointer-events-none">
                Selfie (Left)
              </div>
              <div className="absolute top-4 right-4 bg-emerald-950/80 backdrop-blur-xs text-emerald-300 px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-bold z-10 pointer-events-none border border-emerald-500/20">
                Official doc (Right)
              </div>
            </div>

            {/* Slider track bar */}
            <div className="w-full max-w-xl mt-3 flex items-center gap-3">
              <span className="text-[10px] uppercase font-bold text-slate-400">Selfie</span>
              <input
                type="range"
                min="0"
                max="100"
                value={curtainPosition}
                onChange={handleCurtainSliderChange}
                className="flex-grow h-2 bg-slate-200 rounded-lg appearance-none cursor-ew-resize accent-blue-600"
              />
              <span className="text-[10px] uppercase font-bold text-emerald-600">ID Image</span>
            </div>
          </div>
        )}
      </div>

      {/* Manual panning guide message */}
      <div className="bg-slate-50 border border-slate-200 border-dashed rounded-lg p-3 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5 leading-snug">
        <Move className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>Click or tap & drag inside either image frame to pan around while zoomed. Use <b>Reset View</b> to center.</span>
      </div>
    </div>
  );
}
