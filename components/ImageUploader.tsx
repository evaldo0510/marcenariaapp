
import React, { useState, useRef, useCallback, ChangeEvent, useEffect } from 'react';
import { fileToBase64 } from '../utils/helpers';
import { CameraIcon, SwitchCameraIcon, TrashIcon, PlusIcon, CheckIcon } from './Shared';

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
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        stream.getTracks().forEach(track => track.stop());

        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        if (videoDevices.length === 0) {
            showAlert("Nenhuma câmera foi encontrada no seu dispositivo.", "Erro de Câmera");
            return;
        }
        setCameraDevices(videoDevices);

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
      <label className="block text-sm font-medium text-[#6a5f5f] dark:text-[#c7bca9] mb-2">Imagens de Referência ({uploadedFiles.length}/3)</label>
      
      <div className="grid grid-cols-3 gap-3">
          {uploadedFiles.map((img, index) => (
            <div key={index} className="relative aspect-square rounded-xl overflow-hidden border-2 border-green-500/50 dark:border-green-400/50 group shadow-sm bg-gray-100 dark:bg-[#2d2424]">
                <img src={img.preview} alt={`ref ${index}`} className="w-full h-full object-cover" />
                {/* Success Indicator */}
                <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full p-0.5 shadow-sm">
                    <CheckIcon className="w-3 h-3" />
                </div>
                {/* Remove Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <button 
                        onClick={() => handleRemoveImage(index)}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow-lg transform hover:scale-110"
                        title="Remover imagem"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
          ))}

          {uploadedFiles.length < 3 && (
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square border-2 border-dashed border-[#e6ddcd] dark:border-[#4a4040] rounded-xl flex flex-col items-center justify-center hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535] transition text-gray-400 hover:text-[#d4ac6e] hover:border-[#d4ac6e]"
            >
                {isUploading ? <div className="animate-spin w-6 h-6 border-2 border-[#d4ac6e] border-t-transparent rounded-full mb-1"></div> : <PlusIcon className="w-6 h-6 mb-1" />}
                <span className="text-[10px] font-bold uppercase">{isUploading ? 'Enviando...' : 'Adicionar'}</span>
            </button>
          )}

          {uploadedFiles.length < 3 && (
            <button 
                onClick={handleOpenCamera}
                className="aspect-square border-2 border-dashed border-[#e6ddcd] dark:border-[#4a4040] rounded-xl flex flex-col items-center justify-center hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535] transition text-gray-400 hover:text-[#d4ac6e] hover:border-[#d4ac6e]"
            >
                <CameraIcon className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold uppercase">Câmera</span>
            </button>
          )}
      </div>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" multiple className="hidden" />

      {isCameraOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4 animate-fadeIn">
          <div className="relative w-full max-w-lg aspect-[3/4] bg-black rounded-xl overflow-hidden shadow-2xl border border-white/20">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
              
              <div className="absolute inset-0 border border-white/20 pointer-events-none">
                  <div className="absolute top-1/3 w-full h-px bg-white/20"></div>
                  <div className="absolute top-2/3 w-full h-px bg-white/20"></div>
                  <div className="absolute left-1/3 h-full w-px bg-white/20"></div>
                  <div className="absolute left-2/3 h-full w-px bg-white/20"></div>
              </div>

              <canvas ref={canvasRef} className="hidden"></canvas>
              
              <div className="absolute bottom-0 w-full p-6 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent">
                 <button onClick={handleCloseCamera} className="text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition backdrop-blur-sm">
                    Cancelar
                 </button>
                 
                 <button onClick={handleCapturePhoto} className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center p-1 hover:scale-105 transition bg-white/20 backdrop-blur-sm">
                    <div className="w-full h-full bg-white rounded-full shadow-inner"></div>
                 </button>
                 
                 {cameraDevices.length > 1 ? (
                    <button onClick={handleSwitchCamera} className="text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition backdrop-blur-sm">
                        <SwitchCameraIcon className="w-6 h-6" />
                    </button>
                 ) : <div className="w-12"></div>}
              </div>
          </div>
        </div>
      )}
    </div>
  );
};
