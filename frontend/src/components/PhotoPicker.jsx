import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Camera, X, RotateCcw } from 'lucide-react';

/**
 * PhotoPicker — upload a file OR capture from camera.
 *
 * Props:
 *   preview   – existing image URL (for edit mode)
 *   onChange  – (file: File | null) => void
 *   label     – heading text (default "Photo")
 *   hint      – small hint below buttons (default "Square PNG or JPG, max 5MB")
 *   icon      – fallback icon component when no preview (default Camera)
 */
export default function PhotoPicker({ preview: externalPreview, onChange, label = 'Photo', hint = 'Square PNG or JPG, max 5MB', icon: FallbackIcon = Camera, bare = false }) {
  const [localPreview, setLocalPreview] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  const preview = localPreview || externalPreview;

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => () => stopCamera(), [stopCamera]);

  const startCamera = async (facing) => {
    stopCamera();
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing || facingMode, width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setCameraError('Unable to access camera. Please check permissions.');
    }
  };

  const handleOpenCamera = async () => {
    setCameraOpen(true);
    // Wait a tick for the video element to mount
    await new Promise(r => setTimeout(r, 50));
    startCamera();
  };

  const handleCloseCamera = () => {
    stopCamera();
    setCameraOpen(false);
    setCameraError(null);
  };

  const handleFlip = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    startCamera(next);
  };

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setLocalPreview(URL.createObjectURL(file));
      onChange?.(file);
      handleCloseCamera();
    }, 'image/jpeg', 0.85);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Image must be less than 5MB'); return; }
    setLocalPreview(URL.createObjectURL(file));
    onChange?.(file);
  };

  const handleClear = () => {
    setLocalPreview(null);
    onChange?.(null);
  };

  const inner = (
    <>
      {!bare && <h2 className="text-[14px] font-semibold text-heading mb-4">{label}</h2>}
      {bare && <label className="block text-[13px] font-medium text-heading mb-2">{label}</label>}

      {/* Camera view */}
      {cameraOpen ? (
        <div className="space-y-3">
          <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-black">
            {cameraError ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-[13px] text-red-400 text-center px-4">{cameraError}</p>
              </div>
            ) : (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <div className="flex gap-2">
            {!cameraError && (
              <>
                <button type="button" onClick={handleCapture} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                  <Camera className="w-4 h-4" /> Capture
                </button>
                <button type="button" onClick={handleFlip} className="px-3 py-2.5 border border-border rounded-lg text-[13px] text-sub hover:bg-card-hover transition-colors" title="Flip camera">
                  <RotateCcw className="w-4 h-4" />
                </button>
              </>
            )}
            <button type="button" onClick={handleCloseCamera} className="px-3 py-2.5 border border-border rounded-lg text-[13px] text-sub hover:bg-card-hover transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center">
          {/* Preview */}
          <div className="relative w-24 h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-card-alt overflow-hidden mb-3">
            {preview ? (
              <>
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <button type="button" onClick={handleClear} className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors">
                  <X className="w-3 h-3 text-white" />
                </button>
              </>
            ) : (
              <FallbackIcon className="w-10 h-10 text-muted opacity-40" />
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 transition-colors cursor-pointer">
              <Upload className="w-4 h-4" /> Upload
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
            <button type="button" onClick={handleOpenCamera} className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">
              <Camera className="w-4 h-4" /> Camera
            </button>
          </div>
          {hint && <p className="text-[11px] text-muted mt-2">{hint}</p>}
        </div>
      )}
    </>
  );

  if (bare) return <div>{inner}</div>;

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      {inner}
    </div>
  );
}
