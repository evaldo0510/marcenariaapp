
import React, { useState, useEffect, useRef, WheelEvent, MouseEvent, TouchEvent, useCallback } from 'react';
import { Spinner } from './Shared';

interface ARViewerProps {
    isOpen: boolean;
    onClose: () => void;
    imageSrc: string;
    showAlert: (message: string, title?: string) => void;
}

// Helper to calculate distance between two touch points
const getTouchDistance = (touches: React.TouchList) => {
    return Math.sqrt(
        Math.pow(touches[0].clientX - touches[1].clientX, 2) +
        Math.pow(touches[0].clientY - touches[1].clientY, 2)
    );
};

// Helper to calculate angle between two touch points
const getTouchAngle = (touches: React.TouchList) => {
    return Math.atan2(
        touches[0].clientY - touches[1].clientY,
        touches[0].clientX - touches[1].clientX
    ) * 180 / Math.PI;
};


export const ARViewer: React.FC<ARViewerProps> = ({ isOpen, onClose, imageSrc, showAlert }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const interactionRef = useRef({
        isInteracting: false,
        isRotating: false,
        startX: 0,
        startY: 0,
        initialX: 0,
        initialY: 0,
        initialScale: 1,
        initialRotation: 0,
        initialDistance: 0,
        initialAngle: 0,
    });

    const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.8, rotation: 0 });
    const [opacity, setOpacity] = useState(0.85);
    const [isCameraLoading, setIsCameraLoading] = useState(true);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            setIsCameraLoading(true);
            const startCamera = async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                    streamRef.current = stream;
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.onloadedmetadata = () => {
                             setIsCameraLoading(false);
                        };
                    }
                } catch (err) {
                    console.error("Camera access error:", err);
                    showAlert("Não foi possível acessar a câmera. Verifique as permissões do seu navegador.", "Erro de Câmera");
                    onClose();
                }
            };
            startCamera();
        } else {
            stopCamera();
        }

        return () => {
            stopCamera();
        };
    }, [isOpen, onClose, showAlert, stopCamera]);
    
    useEffect(() => {
        if (isOpen) {
             setTransform({ x: 0, y: 0, scale: 0.8, rotation: 0 });
        }
    }, [isOpen, imageSrc]);

    const handleInteractionStart = (clientX: number, clientY: number, touches?: React.TouchList) => {
        interactionRef.current.isInteracting = true;
        interactionRef.current.startX = clientX;
        interactionRef.current.startY = clientY;
        interactionRef.current.initialX = transform.x;
        interactionRef.current.initialY = transform.y;
        if (touches && touches.length === 2) {
             interactionRef.current.isRotating = true;
             interactionRef.current.initialDistance = getTouchDistance(touches);
             interactionRef.current.initialAngle = getTouchAngle(touches);
             interactionRef.current.initialScale = transform.scale;
             interactionRef.current.initialRotation = transform.rotation;
        }
    };

    const handleInteractionMove = (clientX: number, clientY: number, touches?: React.TouchList) => {
        if (!interactionRef.current.isInteracting) return;
        
        if (touches && touches.length === 2 && interactionRef.current.isRotating) {
             const newDistance = getTouchDistance(touches);
             const newAngle = getTouchAngle(touches);
             const scale = interactionRef.current.initialScale * (newDistance / interactionRef.current.initialDistance);
             const rotation = interactionRef.current.initialRotation + (newAngle - interactionRef.current.initialAngle);
             setTransform(prev => ({ ...prev, scale, rotation }));

        } else if (!interactionRef.current.isRotating) {
             const dx = clientX - interactionRef.current.startX;
             const dy = clientY - interactionRef.current.startY;
             setTransform(prev => ({
                 ...prev,
                 x: interactionRef.current.initialX + dx,
                 y: interactionRef.current.initialY + dy,
             }));
        }
    };
    
    const handleInteractionEnd = () => {
        interactionRef.current.isInteracting = false;
        interactionRef.current.isRotating = false;
    };
    
    const onMouseDown = (e: MouseEvent) => handleInteractionStart(e.clientX, e.clientY);
    const onMouseMove = (e: MouseEvent) => handleInteractionMove(e.clientX, e.clientY);
    
    const onTouchStart = (e: TouchEvent) => handleInteractionStart(e.touches[0].clientX, e.touches[0].clientY, e.touches);
    const onTouchMove = (e: TouchEvent) => handleInteractionMove(e.touches[0].clientX, e.touches[0].clientY, e.touches);

    const handleSnapshot = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;
        
        const imageToDraw = new Image();
        imageToDraw.crossOrigin = "anonymous";
        imageToDraw.onload = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            context.save();
            context.globalAlpha = opacity;
            
            const imageWidth = imageToDraw.width * transform.scale;
            const imageHeight = imageToDraw.height * transform.scale;
            
            // Center drawing calculation
            const drawX = canvas.width / 2 + transform.x - imageWidth / 2;
            const drawY = canvas.height / 2 + transform.y - imageHeight / 2;

            context.translate(drawX + imageWidth/2, drawY + imageHeight/2);
            context.rotate(transform.rotation * Math.PI / 180);
            context.translate(-(drawX + imageWidth/2), -(drawY + imageHeight/2));
            
            context.drawImage(imageToDraw, drawX, drawY, imageWidth, imageHeight);
            context.restore();
            
            const dataUrl = canvas.toDataURL('image/jpeg');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `marcenapp_ar_snapshot.jpg`;
            link.click();
        };
        imageToDraw.src = imageSrc;
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center text-white animate-fadeIn" style={{ touchAction: 'none' }}>
            <video ref={videoRef} autoPlay playsInline muted className="absolute top-0 left-0 w-full h-full object-cover"></video>
            
            {isCameraLoading && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                    <Spinner size="lg" />
                    <p className="mt-4">Iniciando câmera...</p>
                </div>
            )}
            
            <canvas ref={canvasRef} className="hidden"></canvas>

            <div 
                className="absolute top-0 left-0 w-full h-full cursor-move"
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={handleInteractionEnd}
                onMouseLeave={handleInteractionEnd}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={handleInteractionEnd}
                style={{ touchAction: 'none' }} // Prevent default browser scrolling/zooming
            >
                <img 
                    src={imageSrc}
                    alt="AR Overlay"
                    draggable="false"
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none origin-center"
                    style={{
                        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale}) rotate(${transform.rotation}deg)`,
                        opacity: opacity,
                        willChange: 'transform',
                        maxWidth: '80%', // Prevent huge initial size
                        maxHeight: '80%'
                    }}
                />
            </div>
            
            <button onClick={onClose} className="absolute top-4 right-4 text-white text-4xl font-light bg-black/30 rounded-full w-12 h-12 flex items-center justify-center z-50">&times;</button>
            
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 flex flex-col items-center gap-4 z-50">
                 <div className="w-full flex items-center gap-3 bg-black/30 p-2 rounded-full backdrop-blur-sm">
                    <span className="text-sm font-bold">Opacidade</span>
                    <input 
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={opacity}
                        onChange={(e) => setOpacity(Number(e.target.value))}
                        className="w-full h-4 bg-white/30 rounded-lg appearance-none cursor-pointer accent-[#d4ac6e]"
                    />
                 </div>

                <button 
                    onClick={handleSnapshot} 
                    className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                    aria-label="Tirar foto"
                >
                    <div className="w-16 h-16 bg-white rounded-full border-4 border-black/50"></div>
                </button>
                <p className="text-xs text-white/70 text-center mt-2">Arraste para mover, pince para zoom/rotação</p>
            </div>
        </div>
    );
}
