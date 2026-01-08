import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Download, Video, Loader2, Image as ImageIcon } from 'lucide-react';
import { PinConfig, PinVariation } from '../types';

interface CanvasPreviewProps {
  variation: PinVariation | null;
  config: PinConfig;
  imageUrl: string | null | undefined;
  isLoadingImage: boolean;
  isGeneratingText: boolean;
}

export interface CanvasPreviewHandle {
  getBase64: () => string | null;
}

export const CanvasPreview = forwardRef<CanvasPreviewHandle, CanvasPreviewProps>(({
  variation,
  config,
  imageUrl,
  isLoadingImage,
  isGeneratingText
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bgImageObj, setBgImageObj] = useState<HTMLImageElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    getBase64: () => {
      return canvasRef.current ? canvasRef.current.toDataURL('image/png') : null;
    }
  }));

  // Load Image Object
  useEffect(() => {
    if (imageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;
      img.onload = () => setBgImageObj(img);
      img.onerror = () => setBgImageObj(null);
    } else {
      setBgImageObj(null);
    }
  }, [imageUrl]);

  const getLines = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
    const words = text.split(" ");
    const lines = [];
    let currentLine = words[0];
    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + " " + word).width;
      if (width < maxWidth) currentLine += " " + word;
      else { lines.push(currentLine); currentLine = word; }
    }
    lines.push(currentLine);
    return lines;
  };

  const calculateOptimalFontSize = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxHeight: number, fontFace: string) => {
    let minSize = 40;
    let maxSize = 400;
    let optimal = minSize;

    while (minSize <= maxSize) {
      const mid = Math.floor((minSize + maxSize) / 2);
      ctx.font = `bold ${mid}px ${fontFace}`;
      const words = text.split(" ");
      let valid = true;
      
      for (const word of words) {
        if (ctx.measureText(word).width > maxWidth) {
          valid = false;
          break;
        }
      }

      if (valid) {
        const lines = getLines(ctx, text, maxWidth);
        const totalHeight = lines.length * mid * 1.2;
        if (totalHeight > maxHeight) valid = false;
      }

      if (valid) {
        optimal = mid;
        minSize = mid + 1;
      } else {
        maxSize = mid - 1;
      }
    }
    return optimal;
  };

  const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  const renderPin = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, scaleFactor: number = 1.0) => {
    const isFallback = variation?.fallbackMode;
    
    ctx.clearRect(0, 0, width, height);

    if (bgImageObj && !isFallback) {
      const baseScale = Math.max(width / bgImageObj.width, height / bgImageObj.height);
      const effectiveScale = baseScale * scaleFactor;
      const w = bgImageObj.width * effectiveScale;
      const h = bgImageObj.height * effectiveScale;
      const x = (width - w) / 2;
      const y = (height - h) / 2;
      ctx.drawImage(bgImageObj, x, y, w, h);
    } else {
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#f87171');
      gradient.addColorStop(1, '#c026d3');
      
      ctx.save();
      ctx.translate(width/2, height/2);
      ctx.scale(scaleFactor, scaleFactor);
      ctx.translate(-width/2, -height/2);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      for(let i=0; i<width; i+=20) ctx.fillRect(i, 0, 1, height);
      ctx.restore();
    }

    let overlayAlpha = 0.2;
    let effectiveTextColor = config.textColor;
    let effectiveOutlineColor = config.outlineColor;

    if (config.colorScheme === 'dark-overlay') {
      overlayAlpha = 0.6;
      effectiveTextColor = '#ffffff'; 
    } else if (config.colorScheme === 'monochrome') {
       ctx.save();
       ctx.globalCompositeOperation = 'saturation';
       ctx.fillStyle = 'black';
       ctx.fillRect(0,0,width,height);
       ctx.restore();
       effectiveTextColor = '#ffffff';
       effectiveOutlineColor = '#000000';
    }

    ctx.fillStyle = `rgba(0,0,0,${overlayAlpha})`;
    ctx.fillRect(0, 0, width, height);

    if (config.headline) {
      const maxWidth = width * 0.9;
      const maxHeight = height * 0.55; 
      const optimalFontSize = calculateOptimalFontSize(ctx, config.headline, maxWidth, maxHeight, config.fontFamily);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${optimalFontSize}px ${config.fontFamily}`;
      
      const lineHeight = optimalFontSize * 1.2;
      const x = width / 2;
      const y = (height * (config.textYPos / 100));

      const lines = getLines(ctx, config.headline, maxWidth);
      let currentY = y - ((lines.length * lineHeight) / 2) + (lineHeight / 2);

      lines.forEach(line => {
        ctx.strokeStyle = effectiveOutlineColor;
        ctx.lineWidth = optimalFontSize * 0.25; 
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.strokeText(line, x, currentY);

        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 10;

        ctx.fillStyle = effectiveTextColor;
        ctx.fillText(line, x, currentY);

        ctx.shadowColor = 'transparent';
        currentY += lineHeight;
      });
    }

    if (config.ctaText) {
      const ctaY = height * 0.92; 
      const btnWidth = width * 0.9;
      const btnHeight = 120; 
      
      let ctaFontSize = 45;
      ctx.font = `bold ${ctaFontSize}px ${config.fontFamily}`;
      const textWidth = ctx.measureText(config.ctaText).width;
      
      const maxTextWidth = btnWidth * 0.9;
      if (textWidth > maxTextWidth) {
         ctaFontSize = ctaFontSize * (maxTextWidth / textWidth);
         ctx.font = `bold ${ctaFontSize}px ${config.fontFamily}`;
      }
      
      const btnX = (width - btnWidth) / 2;
      const btnY = ctaY - (btnHeight / 2);

      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetY = 8;
      
      ctx.fillStyle = config.ctaBgColor;
      drawRoundedRect(ctx, btnX, btnY, btnWidth, btnHeight, btnHeight/2);
      ctx.fill();
      
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      ctx.fillStyle = config.ctaTextColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(config.ctaText, width / 2, ctaY + 4);
    }

    if (config.brandText) {
      ctx.textAlign = 'center';
      ctx.font = `bold 24px ${config.fontFamily}`;
      ctx.fillStyle = config.brandColor;
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 10;
      const brandY = config.ctaText ? (height * 0.92 - 80) : (height - 40);
      ctx.fillText(config.brandText, width / 2, brandY);
    }
  }, [variation, config, bgImageObj]);

  useEffect(() => {
    if (isRecording) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1000;
    canvas.height = 1500;
    renderPin(ctx, 1000, 1500, 1.0);
  }, [renderPin, isRecording]);

  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    const slug = config.headline.slice(0, 20).replace(/[^a-z0-9]/gi, '-').toLowerCase();
    link.download = `pin-${slug}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleRecordVideo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsRecording(true);
    setRecordingProgress(0);

    const stream = canvas.captureStream(30);
    const chunks: BlobPart[] = [];
    const mimeType = MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : 'video/webm';
    const recorder = new MediaRecorder(stream, { mimeType });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const ext = mimeType === 'video/mp4' ? 'mp4' : 'webm';
      const slug = config.headline.slice(0, 20).replace(/[^a-z0-9]/gi, '-').toLowerCase();
      link.download = `pin-video-${slug}.${ext}`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      setIsRecording(false);
      setRecordingProgress(0);
    };

    recorder.start();

    const ctx = canvas.getContext('2d');
    if(!ctx) return;

    const width = 1000;
    const height = 1500;
    const duration = 8000; 
    const startTime = performance.now();
    const startScale = 1.15; 
    const endScale = 1.0;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setRecordingProgress(Math.round(progress * 100));

      const currentScale = startScale - ((startScale - endScale) * progress);
      renderPin(ctx, width, height, currentScale);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        recorder.stop();
      }
    };
    requestAnimationFrame(animate);
  };

  return (
    <div className="flex flex-col items-center">
      {variation && (
        <div className="w-full max-w-[500px] flex justify-between items-center mb-4 gap-2">
           <button 
            onClick={handleRecordVideo}
            disabled={isRecording || !bgImageObj}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm border ${
                isRecording 
                ? 'bg-red-50 text-red-600 border-red-200' 
                : 'bg-white text-slate-700 border-slate-200 hover:border-red-300 hover:text-red-600'
            }`}
          >
            {isRecording ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
            {isRecording ? `${recordingProgress}%` : 'Video'}
          </button>

          <button 
            onClick={handleDownloadImage}
            disabled={isRecording}
            className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-lg"
          >
            <Download className="w-4 h-4" /> PNG
          </button>
        </div>
      )}

      <div className="relative shadow-2xl rounded-2xl overflow-hidden bg-white ring-1 ring-slate-900/5 aspect-[2/3] w-full max-w-[500px]">
        {(isGeneratingText || isLoadingImage) && (
          <div className="absolute inset-0 z-10 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="w-12 h-12 animate-spin text-red-600 mb-4" />
            <p className="font-medium animate-pulse">
              {isGeneratingText ? 'Writing viral text...' : 'Generating aesthetic background...'}
            </p>
          </div>
        )}

        {!variation && !isGeneratingText && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
            <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">Enter a keyword to start</p>
            </div>
        )}

        <canvas ref={canvasRef} className="w-full h-full object-contain block" />
      </div>
      
      {variation && !isGeneratingText && (
        <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
            {isRecording 
            ? "Recording 8s video... Do not switch tabs." 
            : "Tip: Try the 'Video' button to generate a zooming Pin animation!"}
            </p>
        </div>
      )}
    </div>
  );
});