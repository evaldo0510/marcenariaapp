
import React, { useState, useRef, useCallback, ChangeEvent, useEffect } from 'react';
import { fileToBase64 } from '../utils/helpers';
import { CameraIcon, SwitchCameraIcon, TrashIcon, CloudIcon, PlusIcon } from './Shared';

interface ImageUploaderProps {
  onImagesChange: (images: { data: string, mimeType: string }[] | null) => void;
  showAlert: (message: string, title?: string) => void;
  initialImageUrls?: string[] | null;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImagesChange, showAlert, initialImageUrls }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ preview: string; data: string; mimeType: string; name?: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);

  useEffect(() => {
    if (initialImageUrls) {
        const initialFiles = initialImageUrls.map((url, index) => {
            const parts = url.split(',');
            const data = parts[1];
            const mimePart = parts[0].match(/:(.*?);/);
            const mimeType = mimePart ? mimePart[1] : 'image/png';
            return { preview: url, data, mimeType, name: `Imagem ${index + 1}` };
        });
        setUploadedFiles(initialFiles);
        // Avoid triggering parent update immediately on load to prevent loops, unless necessary
    } else {
        setUploadedFiles([]);
    }
  }, [initialImageUrls]);

  useEffect(() => {
    if (isCameraOpen && cameraDevices.length > 0) {
        const openStream = async () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            const deviceId = cameraDevices[currentDeviceIndex]?.deviceId;
            const constraints = { video: { deviceId: deviceId ? { exact: deviceId } : undefined } };
            try {
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error opening camera stream:", err);
                showAlert("Não foi possível acessar a câmera selecionada.", "Erro de Câmera");
            }
        };
        openStream();
    }
  }, [isCameraOpen, currentDeviceIndex, cameraDevices, showAlert]);


  const handleFileChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const files = [...event.target.files];
      
      // Validation
      const validFiles: File[] = [];
      for (const file of files) {
          if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
              showAlert(`O arquivo "${file.name}" não é suportado. Use apenas JPG, PNG ou WebP.`, "Formato Inválido");
              continue;
          }
          if (file.size > 5 * 1024 * 1024) {
              showAlert(`O arquivo "${file.name}" é muito grande. Máximo de 5MB.`, "Arquivo Muito Grande");
              continue;
          }
          validFiles.push(file);
      }

      if (validFiles.length === 0) {
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
      }

      const totalFiles = uploadedFiles.length + validFiles.length;
      if (totalFiles > 3) {
          showAlert("Você pode adicionar no máximo 3 imagens.", "Limite Atingido");
          // Allow adding up to the limit
          const slotsLeft = 3 - uploadedFiles.length;
          if (slotsLeft <= 0) {
             if (fileInputRef.current) fileInputRef.current.value = "";
             return;
          }
          validFiles.splice(slotsLeft); 
      }
      
      setIsUploading(true);
      
      try {
        const imagePromises = validFiles.map(file => fileToBase64(file));
        const results = await Promise.all(imagePromises);
        
        // Combine new files with existing ones
        const newFiles = results.map((r, i) => ({ 
            preview: r.full, 
            data: r.data, 
            mimeType: r.mimeType, 
            name: validFiles[i].name 
        }));
        
        const updatedUploadedFiles = [...uploadedFiles, ...newFiles];
        setUploadedFiles(updatedUploadedFiles);
        
        const base64Data = updatedUploadedFiles.map(f => ({ data: f.data, mimeType: f.mimeType }));
        onImagesChange(base64Data);

      } catch (error) {
        console.error("Error processing files:", error);
        showAlert("Ocorreu um erro ao processar as imagens.", "Erro de Imagem");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  }, [onImagesChange, showAlert, uploadedFiles]);

  const handleRemoveImage = (indexToRemove: number) => {
    const newUploadedFiles = uploadedFiles.filter((_, index) => index !== indexToRemove);
    setUploadedFiles(newUploadedFiles);
    
    if (newUploadedFiles.length === 0) {
      onImagesChange(null);
    } else {
      const base64Data = newUploadedFiles.map(f => ({ data: f.data, mimeType: f.mimeType }));
      onImagesChange(base64Data);
    }
  };

  const handleOpenCamera = async () => {
    if (uploadedFiles.length >= 3) {
      showAlert("Você pode adicionar no máximo 3 imagens.", "Limite Atingido");
      return;
    }
    try {
        // Request permission and enumerate devices
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        stream.getTracks().forEach(track => track.stop()); // Stop the temporary stream

        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        if (videoDevices.length === 0) {
            showAlert("Nenhuma câmera foi encontrada no seu dispositivo.", "Erro de Câmera");
            return;
        }
        setCameraDevices(videoDevices);

        // Prefer back camera
        const backCameraIndex = videoDevices.findIndex(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('traseira'));
        setCurrentDeviceIndex(backCameraIndex !== -1 ? backCameraIndex : 0);
        
        setIsCameraOpen(true);
    } catch (err) {
      console.error("Camera access error:", err);
      showAlert("Não foi possível acessar a câmera. Verifique as permissões do seu navegador.", "Erro de Câmera");
    }
  };

  const handleCloseCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };
  
  const handleSwitchCamera = () => {
    if (cameraDevices.length > 1) {
        const nextIndex = (currentDeviceIndex + 1) % cameraDevices.length;
        setCurrentDeviceIndex(nextIndex);
    }
  };

  const blobToDataUrl = (blob: Blob): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
      });
  };

  const handleCapturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            const dataUrl = await blobToDataUrl(blob);
            const data = dataUrl.split(',')[1];
            const mimeType = blob.type;
            const newFile = { preview: dataUrl, data, mimeType, name: `Foto ${new Date().toLocaleTimeString()}` };
            
            const newUploadedFiles = [...uploadedFiles, newFile];
            setUploadedFiles(newUploadedFiles);
            
            onImagesChange(newUploadedFiles.map(f => ({ data: f.data, mimeType: f.mimeType })));
            handleCloseCamera();
          } catch (error) {
            showAlert("Erro ao processar a foto.", "Erro");
          }
        }
      }, 'image/jpeg');
    }
  };

  return (
    <div className="mt-4 animate-fadeIn">
      <label className="block text-sm font-medium text-[#6a5f5f] dark:text-[#c7bca9] mb-2">Imagens de Referência (Máx. 3)</label>
      
      <div className="flex gap-3 mb-3">
          {uploadedFiles.length < 3 && (
            <div 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 border-2 border-dashed border-[#e6ddcd] dark:border-[#4a4040] rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535] transition text-gray-500 dark:text-gray-400 min-h-[100px]"
            >
                {isUploading ? (
                    <div className="animate-pulse">Carregando...</div>
                ) : (
                    <>
                        <CloudIcon className="w-8 h-8 mb-1 text-[#d4ac6e]" />
                        <span className="text-xs font-bold">Carregar Imagens</span>
                        <span className="text-[10px]">JPG, PNG (Max 5MB)</span>
                    </>
                )}
            </div>
          )}
          
          {uploadedFiles.length < 3 && (
            <div 
                onClick={handleOpenCamera}
                className="flex-1 border-2 border-dashed border-[#e6ddcd] dark:border-[#4a4040] rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535] transition text-gray-500 dark:text-gray-400 min-h-[100px]"
            >
                <CameraIcon className="w-8 h-8 mb-1 text-[#d4ac6e]" />
                <span className="text-xs font-bold">Tirar Foto</span>
                <span className="text-[10px]">Usar Câmera</span>
            </div>
          )}
      </div>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" multiple className="hidden" />

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((img, index) => (
            <div key={index} className="flex items-center gap-3 bg-white dark:bg-[#2d2424] p-2 rounded-lg border border-[#e6ddcd] dark:border-[#4a4040] shadow-sm animate-fadeIn">
                <img src={img.preview} alt={`preview ${index}`} className="w-12 h-12 object-cover rounded-md flex-shrink-0 bg-gray-100" />
                <div className="flex-grow min-w-0">
                    <p className="text-sm font-medium text-[#3e3535] dark:text-[#f5f1e8] truncate">{img.name || `Imagem ${index + 1}`}</p>
                    <p className="text-xs text-green-600 dark:text-green-400">Carregado</p>
                </div>
                <button 
                    onClick={() => handleRemoveImage(index)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition"
                    title="Remover imagem"
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>
          ))}
        </div>
      )}

      {isCameraOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4 animate-fadeIn">
          <div className="relative w-full max-w-lg aspect-[3/4] bg-black rounded-xl overflow-hidden shadow-2xl">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
              
              {/* Camera Overlay Guides */}
              <div className="absolute inset-0 border border-white/20 pointer-events-none">
                  <div className="absolute top-1/3 w-full h-px bg-white/20"></div>
                  <div className="absolute top-2/3 w-full h-px bg-white/20"></div>
                  <div className="absolute left-1/3 h-full w-px bg-white/20"></div>
                  <div className="absolute left-2/3 h-full w-px bg-white/20"></div>
              </div>

              <canvas ref={canvasRef} className="hidden"></canvas>
              
              <div className="absolute bottom-0 w-full p-6 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent">
                 <button onClick={handleCloseCamera} className="text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition">
                    Cancelar
                 </button>
                 
                 <button onClick={handleCapturePhoto} className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center p-1 hover:scale-105 transition">
                    <div className="w-full h-full bg-white rounded-full"></div>
                 </button>
                 
                 {cameraDevices.length > 1 ? (
                    <button onClick={handleSwitchCamera} className="text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition">
                        <SwitchCameraIcon className="w-6 h-6" />
                    </button>
                 ) : <div className="w-10"></div>}
              </div>
          </div>
        </div>
      )}
    </div>
  );
};
