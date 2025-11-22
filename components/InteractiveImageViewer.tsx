
import React, { useState, useRef, WheelEvent, MouseEvent, TouchEvent, useCallback, useEffect } from 'react';
import { ZoomInIcon, ZoomOutIcon, ResetZoomIcon, ShareIcon, CopyIcon, EmailIcon, DownloadIcon, CheckIcon, WhatsappIcon, CubeIcon, LinkIcon } from './Shared';

interface InteractiveImageViewerProps {
  src: string;
  alt: string;
  projectName: string;
  className?: string;
  onGenerateNewView?: () => void;
  shareUrl?: string;
}

const ZOOM_SPEED = 0.1;
const MIN_SCALE = 1; 
const MAX_SCALE = 5;

// Helper to calculate distance between two touch points
const getTouchDistance = (touches: React.TouchList) => {
    return Math.sqrt(
        Math.pow(touches[0].clientX - touches[1].clientX, 2) +
        Math.pow(touches[0].clientY - touches[1].clientY, 2)
    );
};

export const InteractiveImageViewer: React.FC<InteractiveImageViewerProps> = ({ src, alt, projectName, className, onGenerateNewView, shareUrl }) => {
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [isInteracting, setIsInteracting] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const interactionStartRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0, initialDistance: 0 });
  const lastTapRef = useRef<number>(0);

  // Use a ref to hold the latest transform state to avoid stale closures in window event listeners
  const transformRef = useRef(transform);
  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);


  const applyTransform = useCallback(({ scale, x, y }: { scale: number, x: number, y: number }) => {
    const container = containerRef.current;
    const image = imageRef.current;
    if (!container || !image) {
      setTransform({ scale, x, y });
      return;
    }
    
    const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
    
    setTransform({ scale: clampedScale, x, y });
  }, []);

  const resetTransform = useCallback(() => {
    applyTransform({ scale: 1, x: 0, y: 0 });
  }, [applyTransform]);
  
  // --- MOUSE EVENT LISTENERS ---
  const handleWindowMouseMove = useCallback((e: globalThis.MouseEvent) => {
      e.preventDefault();
      const newX = interactionStartRef.current.initialX + (e.clientX - interactionStartRef.current.startX);
      const newY = interactionStartRef.current.initialY + (e.clientY - interactionStartRef.current.startY);
      applyTransform({ scale: transformRef.current.scale, x: newX, y: newY });
  }, [applyTransform]);

  const handleWindowMouseUp = useCallback(() => {
      setIsInteracting(false);
      if (imageRef.current) imageRef.current.style.transition = 'transform 0.2s ease-out';
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
  }, [handleWindowMouseMove]);

  const handleMouseDown = useCallback((e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.button !== 0) return; 
    
    setIsInteracting(true);
    interactionStartRef.current = { 
      startX: e.clientX, 
      startY: e.clientY, 
      initialX: transformRef.current.x,
      initialY: transformRef.current.y,
      initialDistance: 0
    };
    if (imageRef.current) imageRef.current.style.transition = 'none';

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
  }, [handleWindowMouseMove, handleWindowMouseUp]);
  
  useEffect(() => {
      return () => {
          window.removeEventListener('mousemove', handleWindowMouseMove);
          window.removeEventListener('mouseup', handleWindowMouseUp);
      };
  }, [handleWindowMouseMove, handleWindowMouseUp]);

  
  const handleWheel = useCallback((e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!containerRef.current) return;
    
    const scaleDelta = e.deltaY > 0 ? 1 - ZOOM_SPEED : 1 + ZOOM_SPEED;
    const newScale = transform.scale * scaleDelta;
    
    applyTransform({ ...transform, scale: newScale });
  }, [transform, applyTransform]);

  // --- TOUCH EVENTS ---
  const handleInteractionEnd = useCallback(() => {
    setIsInteracting(false);
    if(imageRef.current) imageRef.current.style.transition = 'transform 0.2s ease-out';
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    // Double tap detection
    const now = Date.now();
    if (now - lastTapRef.current < 300 && e.touches.length === 1) {
        e.preventDefault();
        if (transform.scale > 1.1) {
            resetTransform();
        } else {
            applyTransform({ scale: 2.5, x: 0, y: 0 });
        }
        lastTapRef.current = 0;
        return;
    }
    lastTapRef.current = now;

    if (e.cancelable) e.preventDefault();
    
    setIsInteracting(true);
    if(imageRef.current) imageRef.current.style.transition = 'none';
    const touches = e.touches;
    if (touches.length === 1) { // Pan
      interactionStartRef.current = { 
        startX: touches[0].clientX, 
        startY: touches[0].clientY, 
        initialX: transform.x, 
        initialY: transform.y, 
        initialDistance: 0
      };
    } else if (touches.length === 2) { // Pinch
      interactionStartRef.current = {
        ...interactionStartRef.current,
        initialDistance: getTouchDistance(touches),
      };
    }
  }, [transform, applyTransform, resetTransform]);

  const handleTouchMove = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (!isInteracting) return;
    if (e.cancelable) e.preventDefault();
    const touches = e.touches;
     if (touches.length === 1) { // Pan
        const newX = interactionStartRef.current.initialX + (touches[0].clientX - interactionStartRef.current.startX);
        const newY = interactionStartRef.current.initialY + (touches[0].clientY - interactionStartRef.current.startY);
        applyTransform({ ...transform, x: newX, y: newY });
    } else if (touches.length === 2 && interactionStartRef.current.initialDistance > 0) { // Pinch
        if (!containerRef.current) return;
        const newDistance = getTouchDistance(touches);
        const scaleDelta = newDistance / interactionStartRef.current.initialDistance;
        const newScale = transform.scale * scaleDelta;
        
        applyTransform({ ...transform, scale: newScale });
        interactionStartRef.current.initialDistance = newDistance;
    }
  }, [isInteracting, transform, applyTransform]);


  // --- CONTROLS ---
  const manualZoom = (direction: 'in' | 'out') => {
    const scaleDelta = direction === 'in' ? 1 + ZOOM_SPEED * 3 : 1 - ZOOM_SPEED * 3;
    const newScale = transform.scale * scaleDelta;
    applyTransform({ ...transform, scale: newScale });
  };


  // --- SHARE & FEEDBACK ---
  const showFeedback = (message: string) => {
    setShareFeedback(message);
    setShowShareMenu(false);
    setTimeout(() => {
      setShareFeedback(null);
    }, 2500);
  };

  const handleCopyImage = async () => {
    if (!navigator.clipboard?.write) {
        showFeedback('Navegador não suporta copiar imagem.');
        return;
    }
    try {
        const response = await fetch(src);
        const blob = await response.blob();
        await navigator.clipboard.write([
            new ClipboardItem({ [blob.type]: blob })
        ]);
        showFeedback('Imagem copiada!');
    } catch (err) {
        console.error('Failed to copy image: ', err);
        showFeedback('Falha ao copiar imagem.');
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Visualização do Projeto: ${projectName} - MarcenApp`);
    const body = encodeURIComponent(`Olá,\n\nVeja esta visualização do projeto "${projectName}" que gerei com o MarcenApp. O que acha?\n\n(Para compartilhar a imagem, você pode baixá-la e anexar a este e-mail).`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setShowShareMenu(false);
  };

  const handleWhatsappShare = () => {
    if (!projectName) return;
    const url = shareUrl ? ` ${shareUrl}` : '';
    const text = encodeURIComponent(`Confira esta visualização do projeto "${projectName}" gerada com o MarcenApp!${url}`);
    window.open(`whatsapp://send?text=${text}`);
    setShowShareMenu(false);
  };

  const handleCopyLink = () => {
    const link = shareUrl || `https://marcenapp.com/p/${Math.random().toString(36).substring(2, 10)}`;
    navigator.clipboard.writeText(link).then(() => {
        showFeedback('Link do projeto copiado!');
    });
  };

  const handleDownload = () => {
    try {
        const link = document.createElement('a');
        link.href = src;
        link.download = `${projectName.replace(/\s+/g, '_').toLowerCase()}_marcenapp.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showFeedback('Download iniciado!');
    } catch (err) {
        console.error('Failed to download image: ', err);
        showFeedback('Falha no download.');
    }
  };
  
  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
        if (controlsRef.current && !controlsRef.current.contains(event.target as Node)) {
            setShowShareMenu(false);
        }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  useEffect(() => {
    resetTransform();
  }, [src, resetTransform]);
  
  const containerClass = className || "relative w-full h-auto bg-[#fffefb] dark:bg-[#3e3535] p-2 rounded-lg overflow-hidden select-none border border-[#e6ddcd] dark:border-[#4a4040]";

  return (
    <div 
        ref={containerRef} 
        className={`${containerClass} flex items-center justify-center cursor-move bg-[#1a1a1a]`} // Force dark background for letterboxing
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleInteractionEnd}
        style={{ touchAction: 'none', overscrollBehavior: 'contain' }} // CRITICAL: Prevents browser scrolling and pull-to-refresh on mobile
        aria-label="Visualizador interativo. Use dois dedos para zoom/pan ou duplo toque para resetar."
    >
      <img
          ref={imageRef}
          src={src}
          alt={alt}
          draggable="false"
          className="select-none"
          style={{
              maxWidth: '100%',
              maxHeight: '100%',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain', // STRICTLY PREVENT CROPPING
              display: 'block',
              cursor: isInteracting ? 'grabbing' : 'grab',
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              transition: isInteracting ? 'none' : 'transform 0.2s ease-out',
              transformOrigin: 'center center',
              pointerEvents: 'none' // Allow events to bubble to container for robust gesture handling
          }}
      />
      
      {/* 3D Gizmo / HUD */}
      <div className="absolute top-4 right-4 pointer-events-none opacity-70">
          <div className="w-10 h-10 relative">
              <div className="absolute bottom-0 left-0 w-8 h-0.5 bg-red-500 origin-left transform rotate-0"></div> {/* X */}
              <div className="absolute bottom-0 left-0 w-8 h-0.5 bg-green-500 origin-left transform -rotate-90"></div> {/* Y */}
              <div className="absolute bottom-0 left-0 w-6 h-0.5 bg-blue-500 origin-left transform rotate-[135deg] opacity-80"></div> {/* Z */}
              <span className="absolute bottom-[-15px] right-0 text-[8px] font-bold text-white">X</span>
              <span className="absolute top-[-5px] left-[2px] text-[8px] font-bold text-white">Y</span>
          </div>
      </div>

      {/* Mobile Friendly Controls */}
      <div ref={controlsRef} className="absolute bottom-6 right-4 flex gap-2 bg-[#3e3535]/90 dark:bg-black/80 p-2 rounded-xl backdrop-blur-sm z-20 shadow-lg border border-white/10" onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
        {shareFeedback ? (
            <div className="flex items-center gap-2 px-3 py-1 text-white text-sm animate-fadeIn">
              <div className="text-green-400"><CheckIcon /></div>
              <span>{shareFeedback}</span>
            </div>
        ) : (
          <>
            {onGenerateNewView && (
                <button onClick={onGenerateNewView} className="w-12 h-12 flex items-center justify-center text-[#d4ac6e] hover:bg-white/20 rounded-lg transition active:scale-95 border border-[#d4ac6e]/30" title="Girar Câmera / Nova Vista">
                    <CubeIcon className="w-6 h-6" />
                </button>
            )}
            <div className="w-px h-8 bg-white/20 self-center mx-1"></div>
            <button onClick={() => manualZoom('in')} className="w-12 h-12 flex items-center justify-center text-white hover:bg-white/20 rounded-lg transition active:scale-95" title="Aproximar"><ZoomInIcon /></button>
            <button onClick={() => manualZoom('out')} className="w-12 h-12 flex items-center justify-center text-white hover:bg-white/20 rounded-lg transition active:scale-95" title="Afastar"><ZoomOutIcon /></button>
            <button onClick={resetTransform} className="w-12 h-12 flex items-center justify-center text-white hover:bg-white/20 rounded-lg transition active:scale-95" title="Resetar Zoom"><ResetZoomIcon /></button>
            <div className="w-px h-8 bg-white/20 self-center mx-1"></div>
            <div className="relative">
                <button onClick={() => setShowShareMenu(prev => !prev)} className={`w-12 h-12 flex items-center justify-center text-white hover:bg-white/20 rounded-lg transition active:scale-95 ${showShareMenu ? 'bg-white/20' : ''}`} title="Compartilhar"><ShareIcon /></button>
                {showShareMenu && (
                    <div className="absolute bottom-full right-0 mb-3 w-56 bg-[#2d2424] border border-[#4a4040] rounded-xl shadow-2xl p-2 flex flex-col gap-1 animate-fadeInUp z-30" style={{ animationDuration: '0.2s'}}>
                        <button onClick={handleWhatsappShare} className="w-full flex items-center gap-3 text-left p-3 rounded-lg text-green-400 hover:bg-[#3e3535] transition font-medium">
                           <WhatsappIcon className="w-5 h-5" /> <span>WhatsApp</span>
                        </button>
                        <button onClick={handleCopyLink} className="w-full flex items-center gap-3 text-left p-3 rounded-lg text-blue-400 hover:bg-[#3e3535] transition font-medium">
                           <LinkIcon className="w-5 h-5" /> <span>Copiar Link</span>
                        </button>
                        <button onClick={handleEmailShare} className="w-full flex items-center gap-3 text-left p-3 rounded-lg text-[#c7bca9] hover:bg-[#3e3535] transition font-medium">
                            <EmailIcon className="w-5 h-5" /> <span>Enviar por E-mail</span>
                        </button>
                        <button onClick={handleCopyImage} className="w-full flex items-center gap-3 text-left p-3 rounded-lg text-[#c7bca9] hover:bg-[#3e3535] transition font-medium">
                            <CopyIcon className="w-5 h-5" /> <span>Copiar Imagem</span>
                        </button>
                        <button onClick={handleDownload} className="w-full flex items-center gap-3 text-left p-3 rounded-lg text-[#c7bca9] hover:bg-[#3e3535] transition font-medium">
                            <DownloadIcon className="w-5 h-5" /> <span>Baixar PNG</span>
                        </button>
                    </div>
                )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
