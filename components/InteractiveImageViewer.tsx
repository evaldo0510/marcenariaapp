
import React, { useState, useRef, WheelEvent, MouseEvent, TouchEvent, useCallback, useEffect } from 'react';
import { ZoomInIcon, ZoomOutIcon, ResetZoomIcon, ShareIcon, CopyIcon, EmailIcon, DownloadIcon, CheckIcon, WhatsappIcon } from './Shared';

interface InteractiveImageViewerProps {
  src: string;
  alt: string;
  projectName: string;
  className?: string;
}

const ZOOM_SPEED = 0.1;
const MIN_SCALE = 1; // Start at 1 to prevent zooming out smaller than container
const MAX_SCALE = 5;

// Helper to calculate distance between two touch points
const getTouchDistance = (touches: React.TouchList) => {
    return Math.sqrt(
        Math.pow(touches[0].clientX - touches[1].clientX, 2) +
        Math.pow(touches[0].clientY - touches[1].clientY, 2)
    );
};


export const InteractiveImageViewer: React.FC<InteractiveImageViewerProps> = ({ src, alt, projectName, className }) => {
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [isInteracting, setIsInteracting] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const interactionStartRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0, initialDistance: 0 });

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
    
    const containerRect = container.getBoundingClientRect();
    // Use the actual rendered dimensions of the image element (which fits within container)
    const imageWidth = image.offsetWidth;
    const imageHeight = image.offsetHeight;

    const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));

    const scaledImageWidth = imageWidth * clampedScale;
    const scaledImageHeight = imageHeight * clampedScale;

    // Calculate limits based on centered origin (transform-origin: center center)
    // The maximum absolute translation allowed in either direction from center (0,0)
    // If scaled image is smaller than container, limit is 0 (keep centered).
    // If larger, limit is half the difference.
    const xLimit = Math.max(0, (scaledImageWidth - containerRect.width) / 2);
    const yLimit = Math.max(0, (scaledImageHeight - containerRect.height) / 2);

    const clampedX = Math.max(-xLimit, Math.min(xLimit, x));
    const clampedY = Math.max(-yLimit, Math.min(yLimit, y));
    
    setTransform({ scale: clampedScale, x: clampedX, y: clampedY });
  }, []);
  
  // --- MOUSE EVENT LISTENERS (ATTACHED TO WINDOW FOR ROBUST DRAGGING) ---
  const handleWindowMouseMove = useCallback((e: globalThis.MouseEvent) => {
      e.preventDefault();
      const newX = interactionStartRef.current.initialX + (e.clientX - interactionStartRef.current.startX);
      const newY = interactionStartRef.current.initialY + (e.clientY - interactionStartRef.current.startY);
      // Use the ref to get the latest scale, preventing stale state in the callback
      applyTransform({ scale: transformRef.current.scale, x: newX, y: newY });
  }, [applyTransform]);

  const handleWindowMouseUp = useCallback(() => {
      setIsInteracting(false);
      if (imageRef.current) imageRef.current.style.transition = 'transform 0.1s ease-out';
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
  }, [handleWindowMouseMove]);

  const handleMouseDown = useCallback((e: MouseEvent<HTMLImageElement>) => {
    e.preventDefault();
    if (e.button !== 0) return; // Only process left-click
    
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
  
  // Effect to clean up window listeners if the component unmounts while dragging
  useEffect(() => {
      return () => {
          window.removeEventListener('mousemove', handleWindowMouseMove);
          window.removeEventListener('mouseup', handleWindowMouseUp);
      };
  }, [handleWindowMouseMove, handleWindowMouseUp]);

  
  const handleWheel = useCallback((e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!containerRef.current) return;
    
    // Simple zoom centered on container for simplicity and robustness
    const scaleDelta = e.deltaY > 0 ? 1 - ZOOM_SPEED : 1 + ZOOM_SPEED;
    const newScale = transform.scale * scaleDelta;

    // Keep relative position roughly stable (simplified for center zoom)
    const newX = transform.x * scaleDelta; 
    const newY = transform.y * scaleDelta;

    applyTransform({ scale: newScale, x: newX, y: newY });
  }, [transform, applyTransform]);

  // --- TOUCH EVENTS ---
  const handleInteractionEnd = useCallback(() => {
    setIsInteracting(false);
    if(imageRef.current) imageRef.current.style.transition = 'transform 0.1s ease-out';
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent<HTMLImageElement>) => {
    e.preventDefault();
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
  }, [transform]);

  const handleTouchMove = useCallback((e: TouchEvent<HTMLImageElement>) => {
    if (!isInteracting) return;
    e.preventDefault();
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
        
        // Pinch zoom usually centers on the midpoint of touches, 
        // but clamping logic handles the bounds. 
        // Simplified to center zoom for stability.
        
        applyTransform({ ...transform, scale: newScale });
        interactionStartRef.current.initialDistance = newDistance; // Update for next move
    }
  }, [isInteracting, transform, applyTransform]);


  // --- CONTROLS ---
  const manualZoom = (direction: 'in' | 'out') => {
    const scaleDelta = direction === 'in' ? 1 + ZOOM_SPEED * 2 : 1 - ZOOM_SPEED * 2;
    const newScale = transform.scale * scaleDelta;
    applyTransform({ ...transform, scale: newScale });
  };

  const resetTransform = useCallback(() => {
    applyTransform({ scale: 1, x: 0, y: 0 });
  }, [applyTransform]);

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
    const text = encodeURIComponent(`Confira esta visualização do projeto "${projectName}" gerada com o MarcenApp!`);
    window.open(`whatsapp://send?text=${text}`);
    setShowShareMenu(false);
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
  
  // Recalculate centering when the image src changes
  useEffect(() => {
    resetTransform();
  }, [src, resetTransform]);
  
  const containerClass = className || "relative w-full h-auto bg-[#fffefb] dark:bg-[#3e3535] p-2 rounded-lg overflow-hidden select-none touch-manipulation border border-[#e6ddcd] dark:border-[#4a4040]";

  return (
    <div 
        ref={containerRef} 
        className={`${containerClass} flex items-center justify-center`}
        onWheel={handleWheel}
        aria-label="Visualizador de imagem interativo. Use a roda do mouse/gesto de pinça para zoom e arraste para mover."
    >
      <img
          ref={imageRef}
          src={src}
          alt={alt}
          draggable="false"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleInteractionEnd}
          style={{
              maxWidth: '100%',
              maxHeight: '100%',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              display: 'block',
              cursor: isInteracting ? 'grabbing' : 'grab',
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              transition: isInteracting ? 'none' : 'transform 0.1s ease-out',
              transformOrigin: 'center center'
          }}
      />
      <div ref={controlsRef} className="absolute bottom-2 right-2 flex gap-1 bg-[#3e3535]/80 dark:bg-black/70 p-1.5 rounded-lg backdrop-blur-sm z-10">
        {shareFeedback ? (
            <div className="flex items-center gap-2 px-3 py-2 text-white text-sm animate-fadeIn">
              <div className="text-green-400"><CheckIcon /></div>
              <span>{shareFeedback}</span>
            </div>
        ) : (
          <>
            <button onClick={() => manualZoom('in')} className="p-2 text-white hover:bg-[#2d2424]/80 dark:hover:bg-white/20 rounded-md transition" title="Aproximar"><ZoomInIcon /></button>
            <button onClick={() => manualZoom('out')} className="p-2 text-white hover:bg-[#2d2424]/80 dark:hover:bg-white/20 rounded-md transition" title="Afastar"><ZoomOutIcon /></button>
            <button onClick={resetTransform} className="p-2 text-white hover:bg-[#2d2424]/80 dark:hover:bg-white/20 rounded-md transition" title="Resetar Zoom"><ResetZoomIcon /></button>
            <div className="relative">
                <button onClick={() => setShowShareMenu(prev => !prev)} className="p-2 text-white hover:bg-[#2d2424]/80 dark:hover:bg-white/20 rounded-md transition" title="Compartilhar"><ShareIcon /></button>
                {showShareMenu && (
                    <div className="absolute bottom-full right-0 mb-2 w-48 bg-[#2d2424] border border-[#4a4040] rounded-lg shadow-lg p-2 flex flex-col gap-1 animate-fadeInUp" style={{ animationDuration: '0.2s'}}>
                        <button onClick={handleWhatsappShare} className="w-full flex items-center gap-3 text-left p-2 rounded text-green-400 hover:bg-[#3e3535] transition">
                           <WhatsappIcon className="w-5 h-5" /> <span>WhatsApp</span>
                        </button>
                        <button onClick={handleCopyImage} className="w-full flex items-center gap-3 text-left p-2 rounded text-[#c7bca9] hover:bg-[#3e3535] transition">
                            <CopyIcon /> <span>Copiar Imagem</span>
                        </button>
                        <button onClick={handleEmailShare} className="w-full flex items-center gap-3 text-left p-2 rounded text-[#c7bca9] hover:bg-[#3e3535] transition">
                            <EmailIcon /> <span>Enviar por E-mail</span>
                        </button>
                        <button onClick={handleDownload} className="w-full flex items-center gap-3 text-left p-2 rounded text-[#c7bca9] hover:bg-[#3e3535] transition">
                            <DownloadIcon /> <span>Baixar PNG</span>
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
