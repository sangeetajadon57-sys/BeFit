import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Upload, 
  Search, 
  Sparkles, 
  Plus, 
  AlertTriangle, 
  Check, 
  Info, 
  Undo2, 
  Sliders, 
  UserCheck,
  ShieldAlert,
  Loader2,
  ListRestart
} from 'lucide-react';
import { FoodScanResult } from '../types';
import { GLOBAL_FOOD_DATABASE, searchLocalFood, FoodItem } from '../utils/foodDatabase';

interface FoodScannerProps {
  onAddCalories: (data: { name: string; calories: number; protein: number; carbs: number; fat: number; portion: string }) => void;
}

export default function FoodScanner({ onAddCalories }: FoodScannerProps) {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  
  // Camera & Image state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // SCAN states
  const [scanState, setScanState] = useState<'idle' | 'loading' | 'success' | 'rejected' | 'error'>('idle');
  const [scanResult, setScanResult] = useState<FoodScanResult | null>(null);
  const [rejectionMessage, setRejectionMessage] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('Sizing food matrix...');
  
  // Custom manual tuning adjustment states
  const [tunedName, setTunedName] = useState('');
  const [tunedCalories, setTunedCalories] = useState<number>(0);
  const [tunedProtein, setTunedProtein] = useState<number>(0);
  const [tunedCarbs, setTunedCarbs] = useState<number>(0);
  const [tunedFat, setTunedFat] = useState<number>(0);
  const [tunedPortion, setTunedPortion] = useState('');
  const [isTuningMode, setIsTuningMode] = useState(false);
  const [isLogged, setIsLogged] = useState(false);

  // HTML5 video element refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Cycle loading messages to engage user
  useEffect(() => {
    if (scanState === 'loading') {
      const messages = [
        'Connecting with AI Vision Engine...',
        'Checking if image contains listable nutrients...',
        'Analyzing volume & macro weight density...',
        'Sizing estimates for international cuisine...',
        'Almost ready. Finalizing nutritional counts...'
      ];
      let idx = 0;
      const interval = setInterval(() => {
        idx = (idx + 1) % messages.length;
        setLoadingMessage(messages[idx]);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [scanState]);

  // Local Search trigger
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query) {
      setSearchResults(searchLocalFood(query));
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectLocalFood = (item: FoodItem) => {
    // Treat seleccion as instant scan result mapping
    setScanResult({
      isFood: true,
      detectedFoodName: item.name,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      portionEstimate: item.portionSize,
      confidenceScore: 100, // Predefined is 100% accurate
      suggestions: []
    });
    
    // Automatically trigger adjustment modes so they can verify
    setTunedName(item.name);
    setTunedCalories(item.calories);
    setTunedProtein(item.protein);
    setTunedCarbs(item.carbs);
    setTunedFat(item.fat);
    setTunedPortion(item.portionSize);
    
    setScanState('success');
    setIsTuningMode(false);
    setIsLogged(false);
  };

  // Start HTML5 Live webcam feed
  const startCamera = async () => {
    // Release any previous lock or stream before starting a new request
    stopCamera();

    setCameraError('');
    setIsCameraActive(true);
    setImagePreview(null);
    setScanState('idle');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser or preview sandbox does not support video capture media devices. Please upload/drag-and-drop a photo instead.");
      }

      let stream: MediaStream;
      try {
        // Try with soft, ideal preferences in a single call. This works beautifully 
        // to auto-fallback from environment to front camera on desktops and laptops.
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: { ideal: 'environment' }, 
            width: { ideal: 640 }, 
            height: { ideal: 480 } 
          },
          audio: false 
        });
      } catch (firstErr) {
        console.warn("Primary camera configuration failed, trying simpler resolution constraint fallback", firstErr);
        try {
          // Fallback to simpler constraints without restricting facingMode unless ideal
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 }
            },
            audio: false
          });
        } catch (secondErr) {
          console.warn("Resolution constraints failed, trying absolute basic video constraints", secondErr);
          // Absolute basic fallback to any available camera, no audio
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: false 
          });
        }
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn("Video play command was interrupted or failed: ", playErr);
        }
      }
    } catch (err: any) {
      console.error("Camera access failed", err);
      
      const errName = err.name || '';
      const errMsg = (err.message || '').toLowerCase();
      
      let friendlyInstructions = "Camera start failed. ";
      
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        friendlyInstructions = "Camera permissions blocked! Please click the camera/site lock icon next to the URL in your browser, grant webcam access, and press Camera Snap again.";
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError' || errMsg.includes('could not start video source') || errMsg.includes('source failed to start')) {
        friendlyInstructions = "Webcam source busy! Your video camera is likely in use by Zoom, Teams, another browser tab, or another active program. Please close any software that utilizes your webcam, refresh the page, and try again.";
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        friendlyInstructions = "Webcam device not found! No usable image capture device or camera was detected. You can upload or drag food photos directly in the file select panel.";
      } else if (errName === 'OverconstrainedError') {
        friendlyInstructions = "Webcam device is unable to support standard resolution constraints. Please upload a photo instead, or select another input.";
      } else {
        friendlyInstructions = `Camera initialization failed (${err.message || err.name || 'Unknown error'}). Please check site hardware permission permissions or select a food picture from your files.`;
      }
      
      setCameraError(friendlyInstructions);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Capture still base64 image from web camera feed
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Set canvas constraints to video size
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const base64 = canvas.toDataURL('image/jpeg', 0.82);
        setImagePreview(base64);
        stopCamera();
        handleAnalyzeImage(base64, 'image/jpeg');
      }
    }
  };

  const triggerUploadInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle uploaded picture conversions
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        handleAnalyzeImage(base64, file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setImagePreview(base64);
          handleAnalyzeImage(base64, file.type);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Send to full-stack Gemini validator Express server
  const handleAnalyzeImage = async (base64Data: string, mimeType: string) => {
    setScanState('loading');
    setRejectionMessage('');
    setIsLogged(false);
    
    try {
      const res = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Data, mimeType })
      });

      if (!res.ok) {
        throw new Error('Calorie engine communication issue.');
      }

      const data: FoodScanResult = await res.json();
      
      if (!data.isFood) {
        setScanState('rejected');
        setRejectionMessage(data.rejectedReason || 'We’ve identified that this is not a food item. Please scan or upload dietary dishes only.');
        return;
      }

      setScanResult(data);
      // Initialize states with estimated values
      setTunedName(data.detectedFoodName);
      setTunedCalories(data.calories);
      setTunedProtein(data.protein);
      setTunedCarbs(data.carbs);
      setTunedFat(data.fat);
      setTunedPortion(data.portionEstimate);
      
      setScanState('success');
      setIsTuningMode(false);

    } catch (err: any) {
      console.error(err);
      setScanState('error');
    }
  };

  // Alternative suggestions triggers manual tuning update
  const handleSelectSuggestion = (alternativeName: string) => {
    setTunedName(alternativeName);
    // Find closest match in local DB to fill out macros dynamically if it exists
    const localMatch = GLOBAL_FOOD_DATABASE.find(
      x => x.name.toLowerCase().includes(alternativeName.toLowerCase())
    );
    if (localMatch) {
      setTunedCalories(localMatch.calories);
      setTunedProtein(localMatch.protein);
      setTunedCarbs(localMatch.carbs);
      setTunedFat(localMatch.fat);
      setTunedPortion(localMatch.portionSize);
    } else {
      // Just adjust name, keep values but label as selected suggestion
      setTunedCalories(Math.round(tunedCalories));
    }
    setIsTuningMode(true);
  };

  // Save selection callback to global logs
  const handleLogFood = () => {
    onAddCalories({
      name: tunedName,
      calories: tunedCalories,
      protein: tunedProtein,
      carbs: tunedCarbs,
      fat: tunedFat,
      portion: tunedPortion
    });
    setIsLogged(true);
  };

  const handleResetScanner = () => {
    setImagePreview(null);
    setScanResult(null);
    setScanState('idle');
    setIsLogged(false);
    setIsTuningMode(false);
    stopCamera();
  };

  // Clean elements on unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 select-none relative z-10">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="space-y-0.5">
          <h2 className="text-xl font-bold text-white tracking-tight">Count Any Food Calorie</h2>
          <p className="text-xs text-slate-400 font-light">Instant calorie counts powered by local databases and server-side machine vision.</p>
        </div>
        <div className="flex gap-2">
          {scanState !== 'idle' && (
            <button
              onClick={handleResetScanner}
              className="flex items-center gap-1 bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 font-semibold text-xs px-3.5 py-2.5 rounded-xl cursor-pointer transition shadow"
            >
              <ListRestart className="w-4 h-4 text-emerald-400" /> Reset Scanner
            </button>
          )}
        </div>
      </div>

      {scanState === 'idle' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Snap Camera / File Interface */}
          <div className="md:col-span-7 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 font-mono">Primary Capture Interface</h3>
            
            {cameraError && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs rounded-xl flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}

            {!isCameraActive ? (
              // Drag and drop interface
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-white/10 hover:border-emerald-500/50 bg-white/5 hover:bg-white/10 rounded-2xl p-8 sm:p-12 text-center transition cursor-pointer flex flex-col items-center justify-center space-y-4 min-h-[300px]"
                onClick={triggerUploadInput}
              >
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400">
                  <Upload className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">Choose picture or drag food here</p>
                  <p className="text-xs text-slate-400 font-light">Supports standard JPEG, PNG formats</p>
                </div>
                <div className="flex gap-3 pt-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs px-5 py-3 rounded-xl shadow-lg shadow-emerald-500/10 transition cursor-pointer"
                  >
                    <Camera className="w-4 h-4" /> Use Camera Snap
                  </button>
                  <button
                    type="button"
                    onClick={triggerUploadInput}
                    className="bg-white/5 border border-white/10 text-slate-205 hover:bg-white/10 font-semibold text-xs px-5 py-3 rounded-xl transition cursor-pointer"
                  >
                    Select File
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            ) : (
              // Live camera preview box
              <div className="relative bg-slate-950 rounded-2xl overflow-hidden shadow-inner flex flex-col justify-between items-center h-[340px] sm:h-[400px] border border-white/10">
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover"
                  playsInline
                  muted
                  autoPlay
                />
                
                {/* Visual guidelines alignment ring */}
                <div className="absolute inset-0 border-4 border-white/10 flex items-center justify-center pointer-events-none">
                  <div className="w-56 h-56 border-2 border-dashed border-white/30 rounded-full" />
                </div>

                <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-4 px-6 z-10">
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="bg-white/10 hover:bg-white/15 text-white font-medium text-xs px-4 py-2.5 rounded-xl backdrop-blur-md cursor-pointer border border-white/10"
                  >
                    Cancel snap
                  </button>
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="w-16 h-16 bg-white hover:bg-emerald-100 border-4 border-slate-950 rounded-full shadow-lg flex items-center justify-center cursor-pointer transition active:scale-95 animate-pulse"
                    aria-label="Capture still photo shutter"
                  >
                    <div className="w-10 h-10 bg-emerald-500 rounded-full" />
                  </button>
                </div>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />

            {/* Privacy note */}
            <div className="p-4 bg-white/5 rounded-xl flex items-start gap-3 border border-white/10">
              <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-[10px] sm:text-xs text-slate-400 font-light leading-relaxed">
                <strong>Data Privacy Safeguard:</strong> Pictures scanned inside Count Any Food Calorie are processed on the secure server solely for identifying nutrient values. They are never cached, archived, or exposed in shared profiles.
              </div>
            </div>
          </div>

          {/* Quick Search Dictionary Panel */}
          <div className="md:col-span-5 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 font-mono">Local Food Dictionary</h3>
            
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                aria-label="Search local food dictionary"
                onChange={handleSearchChange}
                placeholder="Search chicken breast, sushi, banana..."
                className="w-full bg-white/5 border border-white/10 focus:border-emerald-500/40 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/10 focus:bg-white/10 transition font-light"
              />
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-450" />
            </div>

            {/* Quick list container */}
            <div className="bg-white/5 rounded-xl border border-white/10 divide-y divide-white/5 max-h-[300px] overflow-y-auto shadow-xl">
              {searchResults.length > 0 ? (
                searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectLocalFood(item)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-white/5 transition text-xs cursor-pointer"
                  >
                    <div>
                      <span className="font-semibold text-slate-200 block">{item.name}</span>
                      <span className="text-[10px] text-slate-450 font-light">{item.portionSize} ({item.cuisine})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-white">{item.calories} <span className="text-[8px] text-slate-400 font-normal">kcal</span></span>
                      <Plus className="w-4 h-4 text-emerald-450" />
                    </div>
                  </button>
                ))
              ) : searchQuery ? (
                <div className="p-6 text-center text-xs text-slate-400 whitespace-pre-wrap">
                  No local direct match. AI Vision or custom manual calculation can estimate details.
                </div>
              ) : (
                // Prepopulated popular global recommendations
                <div className="divide-y divide-white/5">
                  <div className="p-2.5 bg-white/5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">Popular Global Selections</div>
                  {GLOBAL_FOOD_DATABASE.slice(0, 6).map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectLocalFood(item)}
                      className="w-full flex items-center justify-between p-3 text-left hover:bg-white/10 transition text-xs cursor-pointer"
                    >
                      <div>
                        <span className="font-semibold text-slate-200 block">{item.name}</span>
                        <span className="text-[10px] text-slate-450 font-light">{item.portionSize} ({item.dishType})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-white">{item.calories} <span className="text-[8px] text-slate-400 font-normal">kcal</span></span>
                        <Plus className="w-4 h-4 text-emerald-400" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Loading analysis state panels */}
      <AnimatePresence>
        {scanState === 'loading' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-12 text-center rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex flex-col items-center justify-center space-y-4"
          >
            <div className="relative flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
              <Sparkles className="w-4 h-4 text-yellow-400 absolute animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-white">Scan In Progress</h4>
              <p className="text-xs text-slate-350 max-w-xs font-light">{loadingMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REJECTED Non-Food image panel */}
      {scanState === 'rejected' && (
        <div className="p-8 text-center rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center space-y-4 max-w-md mx-auto relative z-20">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-full border border-rose-500/20">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white">Image Classification Rejected</h4>
            <p className="text-xs text-slate-350 leading-relaxed font-light">{rejectionMessage}</p>
          </div>
          <button
            onClick={handleResetScanner}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs rounded-xl hover:from-emerald-400 transition cursor-pointer"
          >
            Try different image
          </button>
        </div>
      )}

      {/* Error / Offline state */}
      {scanState === 'error' && (
        <div className="p-8 text-center rounded-2xl bg-rose-500/5 border border-rose-500/10 flex flex-col items-center justify-center space-y-4 max-w-md mx-auto">
          <AlertTriangle className="w-8 h-8 text-rose-400 font-light" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-rose-300 tracking-tight">Scanner Interrupted</h4>
            <p className="text-xs text-rose-200 leading-snug">The server-side vision engine experienced a timeout or could not compile image details. Please verify your internet connection or use direct search.</p>
          </div>
          <button
            onClick={handleResetScanner}
            className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white font-medium text-xs rounded-xl cursor-pointer border border-white/10"
          >
            Retry analysis
          </button>
        </div>
      )}

      {/* Success Calorie scan panel */}
      {scanState === 'success' && scanResult && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white/5 backdrop-blur-2xl border border-white/15 p-6 rounded-2xl shadow-2xl relative overflow-hidden"
        >
          {/* Photo Preview & confidence score meter */}
          <div className="md:col-span-4 space-y-4">
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-white/10 h-44 bg-white/5 shadow-sm select-none">
                <img 
                  src={imagePreview} 
                  alt="Scanned Food input" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 h-44 bg-white/5 flex items-center justify-center text-xs text-slate-400 font-mono italic">
                Local Dictionary Item loaded
              </div>
            )}

            {/* Confidence circular gauge */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 leading-normal space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-400 font-mono">
                <span>AI Confidence Score</span>
                <span className={`${scanResult.confidenceScore < 75 ? 'text-amber-400' : 'text-emerald-400'}`}>{scanResult.confidenceScore}%</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden flex">
                <div 
                  className={`h-full ${scanResult.confidenceScore < 75 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                  style={{ width: `${scanResult.confidenceScore}%` }}
                />
              </div>
              {scanResult.confidenceScore < 75 && (
                <div className="p-2.5 bg-amber-500/10 text-[10px] text-amber-300 rounded-lg flex items-start gap-1 border border-amber-500/10">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>Low confidence scan. Review suggestions or adjust macros manually below.</span>
                </div>
              )}
            </div>
          </div>

          {/* Calorie Macro Dashboard & Tuners */}
          <div className="md:col-span-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">Vision Estimates Compiled</span>
                <h4 className="text-lg font-bold text-white tracking-tight leading-tight mt-1">{tunedName}</h4>
              </div>
              <button
                onClick={() => setIsTuningMode(!isTuningMode)}
                className={`text-xs font-semibold px-3.5 py-1.5 rounded-xl border flex items-center gap-1 cursor-pointer transition ${isTuningMode ? 'bg-emerald-500 text-slate-950 border-emerald-500 font-bold' : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'}`}
              >
                <Sliders className="w-3.5 h-3.5" /> {isTuningMode ? 'Tuning manual details' : 'Adjust nutrition'}
              </button>
            </div>

            {/* Large Calorie visual indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 h-24 rounded-xl flex flex-col justify-between">
                <span className="text-[10px] text-indigo-300 font-semibold uppercase tracking-wider font-mono">Calorie Portion</span>
                <div>
                  <span className="text-xl font-bold text-white">{tunedCalories}</span>
                  <span className="text-[9px] text-slate-400 uppercase font-mono block">Estimated Kcal</span>
                </div>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 h-24 rounded-xl flex flex-col justify-between">
                <span className="text-[10px] text-emerald-300 font-semibold uppercase tracking-wider font-mono">Protein (g)</span>
                <div>
                  <span className="text-xl font-bold text-white">{tunedProtein}g</span>
                  <span className="text-[9px] text-slate-400 uppercase font-mono block">Muscle Building</span>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 p-3 h-24 rounded-xl flex flex-col justify-between">
                <span className="text-[10px] text-amber-300 font-semibold uppercase tracking-wider font-mono">Carbs (g)</span>
                <div>
                  <span className="text-xl font-bold text-white">{tunedCarbs}g</span>
                  <span className="text-[9px] text-slate-400 uppercase font-mono block">Physical Fuel</span>
                </div>
              </div>

              <div className="bg-rose-500/10 border border-rose-500/20 p-3 h-24 rounded-xl flex flex-col justify-between">
                <span className="text-[10px] text-rose-300 font-semibold uppercase tracking-wider font-mono">Fats (g)</span>
                <div>
                  <span className="text-xl font-bold text-white">{tunedFat}g</span>
                  <span className="text-[9px] text-slate-400 uppercase font-mono block">Endocrine Fats</span>
                </div>
              </div>
            </div>

            {/* Slider tuning controls */}
            {isTuningMode && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-4 overflow-hidden"
              >
                <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-1">
                  <span className="text-xs font-bold text-white">Tuning sliders</span>
                  <span className="text-[10px] text-slate-400 font-mono">Adjust precisely</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="food-name" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1">Rename Item</label>
                    <input
                      id="food-name"
                      type="text"
                      value={tunedName}
                      onChange={(e) => setTunedName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/30"
                    />
                  </div>
                  <div>
                    <label htmlFor="food-portion" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1">Portion Size</label>
                    <input
                      id="food-portion"
                      type="text"
                      value={tunedPortion}
                      onChange={(e) => setTunedPortion(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/30"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Calorie slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Calories</span>
                      <span className="font-bold text-white">{tunedCalories} kcal</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2000"
                      step="5"
                      value={tunedCalories}
                      onChange={(e) => setTunedCalories(parseInt(e.target.value))}
                      className="w-full accent-emerald-400 cursor-pointer h-1 bg-white/10 rounded-lg appearance-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {/* Protein slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-slate-400">Protein</span>
                        <span className="font-bold text-emerald-300">{tunedProtein}g</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="150"
                        value={tunedProtein}
                        onChange={(e) => setTunedProtein(parseInt(e.target.value))}
                        className="w-full accent-emerald-400 cursor-pointer h-1 bg-white/10 rounded-lg appearance-none"
                      />
                    </div>
                    
                    {/* Carbs slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-slate-400">Carbs</span>
                        <span className="font-bold text-amber-300">{tunedCarbs}g</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="300"
                        value={tunedCarbs}
                        onChange={(e) => setTunedCarbs(parseInt(e.target.value))}
                        className="w-full accent-amber-400 cursor-pointer h-1 bg-white/10 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Fat slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-slate-400">Fat</span>
                        <span className="font-bold text-rose-300">{tunedFat}g</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="120"
                        value={tunedFat}
                        onChange={(e) => setTunedFat(parseInt(e.target.value))}
                        className="w-full accent-rose-500 cursor-pointer h-1 bg-white/10 rounded-lg appearance-none"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Low confidence suggestion options */}
            {scanResult.suggestions && scanResult.suggestions.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[9px] uppercase font-bold text-slate-400 font-mono block">Alternative choices based on scan:</span>
                <div className="flex flex-wrap gap-2">
                  {scanResult.suggestions.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectSuggestion(sug)}
                      className="px-3 py-1 bg-white/5 border border-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-full text-xs font-medium cursor-pointer transition focus:outline-none"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom action logs */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleLogFood}
                disabled={isLogged}
                style={{ opacity: isLogged ? 0.7 : 1 }}
                className={`w-full py-3.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer select-none ${isLogged ? 'bg-emerald-500 text-slate-950 shadow shadow-emerald-500/10' : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 shadow shadow-slate-950/10'}`}
              >
                {isLogged ? (
                  <>
                    <Check className="w-4 h-4" /> Added to your Daily Intake!
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Add calories to your History Logs
                  </>
                )}
              </button>
              
              <button
                onClick={handleResetScanner}
                className="bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 font-semibold text-xs px-5 rounded-xl transition cursor-pointer shrink-0"
              >
                Scan another
              </button>
            </div>
          </div>
        </motion.div>
      )}

    </div>
  );
}
