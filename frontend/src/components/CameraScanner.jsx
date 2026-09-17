import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle, AlertCircle, SwitchCamera, Image as ImageIcon } from 'lucide-react';

export default function CameraScanner({ onCapture, disabled }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // Default to rear camera on mobile
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [capturedPreview, setCapturedPreview] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const startCamera = async () => {
    setCameraError(null);
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraActive(true);
    } catch (err) {
      console.warn("Camera access failed:", err);
      setCameraError("Camera access was blocked or unavailable on this device. You can upload an image directly below.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const toggleFacingMode = () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
  };

  useEffect(() => {
    if (isCameraActive) {
      startCamera();
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [facingMode]);

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        setCapturedBlob(blob);
        setCapturedPreview(URL.createObjectURL(blob));
        stopCamera();
      }
    }, 'image/jpeg', 0.95);
  };

  const retake = () => {
    setCapturedBlob(null);
    if (capturedPreview) {
      URL.revokeObjectURL(capturedPreview);
      setCapturedPreview(null);
    }
    startCamera();
  };

  const submitCapture = () => {
    if (capturedBlob && onCapture) {
      onCapture(capturedBlob, "camera_capture.jpg");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Camera className="w-5 h-5 text-blue-600" />
            <span>Smartphone Live Camera Scanner</span>
          </h3>
          <p className="text-xs text-slate-500">Capture OMR sheet directly using your device's camera</p>
        </div>
        {isCameraActive && (
          <button
            onClick={toggleFacingMode}
            className="flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition"
            title="Switch Front/Rear Camera"
          >
            <SwitchCamera className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">Flip Camera</span>
          </button>
        )}
      </div>

      {cameraError ? (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-semibold">{cameraError}</p>
            <p className="mt-1 text-slate-600">Tip: Test with the uploaded image options or click Demo Mode to evaluate test scans.</p>
          </div>
        </div>
      ) : capturedPreview ? (
        /* Captured Preview View */
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-black aspect-[3/4] max-h-[480px] mx-auto flex items-center justify-center">
            <img src={capturedPreview} alt="Captured OMR" className="w-full h-full object-contain" />
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-medium">
              Preview Ready
            </div>
          </div>
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={retake}
              disabled={disabled}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retake Photo</span>
            </button>
            <button
              onClick={submitCapture}
              disabled={disabled}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Process OMR Sheet</span>
            </button>
          </div>
        </div>
      ) : isCameraActive ? (
        /* Live Viewfinder */
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden border-2 border-dashed border-blue-500 bg-slate-900 aspect-[3/4] max-h-[480px] mx-auto flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* OMR Alignment Guide Overlay */}
            <div className="absolute inset-8 border-2 border-emerald-400/80 rounded-lg pointer-events-none flex flex-col justify-between p-3">
              <div className="flex justify-between">
                <span className="w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                <span className="w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
              </div>
              <div className="text-center">
                <span className="bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium px-3 py-1 rounded-full">
                  Align OMR sheet corners inside green frame
                </span>
              </div>
              <div className="flex justify-between">
                <span className="w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                <span className="w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
              </div>
            </div>
          </div>
          <div className="flex justify-center space-x-3">
            <button
              onClick={stopCamera}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={captureFrame}
              disabled={disabled}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition"
            >
              <Camera className="w-4 h-4" />
              <span>Capture Photo</span>
            </button>
          </div>
        </div>
      ) : (
        /* Camera Dormant Prompt */
        <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Ready to Scan with Camera</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Position your smartphone above the paper sheet and tap Start Camera to begin.
            </p>
          </div>
          <button
            onClick={startCamera}
            disabled={disabled}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition"
          >
            <Camera className="w-4 h-4" />
            <span>Start Camera</span>
          </button>
        </div>
      )}

      {/* Hidden canvas for snapshot rendering */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
