
import React, { useState, useRef, useCallback, ChangeEvent, useEffect } from 'react';
import { fileToBase64 } from '../utils/helpers';
import { CameraIcon, SwitchCameraIcon } from './Shared';

interface ImageUploaderProps {
  onImagesChange: (images: { data: string, mimeType: string }[] | null) => void;
  showAlert: (message: string, title?: string) => void;
  initialImageUrls?: string[] | null;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImagesChange, showAlert, initialImageUrls }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ preview: string; data: string; mimeType: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);

  useEffect(() => {
    if (initialImageUrls) {
        const initialFiles = initialImageUrls.map(url => {
            const parts = url.split(',');
            const data = parts[1];
            const mimePart = parts[0].match(/:(.*?);/);
            const mimeType = mimePart ? mimePart[1] : 'image/png';
            return { preview: url, data, mimeType };
        });
        setUploadedFiles(initialFiles);
        onImagesChange(initialFiles.map(f => ({ data: f.data, mimeType: f.mimeType })));
    } else {
        setUploadedFiles([]);
    }
  }, [initialImageUrls, onImagesChange]);

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
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
      }
      
      setIsUploading(true);
      
      try {
        const imagePromises = validFiles.map(file => fileToBase64(file));
        const results = await Promise.all(imagePromises);
        
        const newUploadedFiles = [...uploadedFiles, ...results.map(r => ({ preview: r.full, data: r.data, mimeType: r.mimeType }))];
        setUploadedFiles(newUploadedFiles);
        
        const base64Data = newUploadedFiles.map(f => ({ data: f.data, mimeType: f.mimeType }));
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
            const newFile = { preview: dataUrl, data, mimeType };
            
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
    <div className="mt-4">
      <label className="block text-sm font-medium text-[#6a5f5f] dark:text-[#c7bca9] mb-2">Adicione imagens de referência ou rascunhos (até 3):</label>
      <div className="flex items-center gap-2">
        <button onClick={() => fileInputRef.current?.click()}
          className="bg-[#e6ddcd] dark:bg-[#4a4040] hover:bg-[#dcd6c8] dark:hover:bg-[#5a4f4f] text-[#3e3535] dark:text-[#f5f1e8] font-bold py-2 px-4 rounded-lg transition">
          {isUploading ? 'Enviando...' : 'Escolher Arquivos'}
        </button>
        <button onClick={handleOpenCamera} className="bg-[#e6ddcd] dark:bg-[#4a4040] hover:bg-[#dcd6c8] dark:hover:bg-[#5a4f4f] text-[#3e3535] dark:text-[#f5f1e8] font-bold py-2 px-4 rounded-lg transition flex items-center gap-2">
          <CameraIcon /> Tirar Foto
        </button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" multiple className="hidden" />
      </div>
      <p className="text-xs text-[#8a7e7e] dark:text-[#a89d8d] mt-1">Formatos: JPG, PNG, WebP. Máx: 5MB.</p>
      {uploadedFiles.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {uploadedFiles.map((img, index) => (
            <div key={index} className="relative group">
              <img src={img.preview} alt={`preview ${index}`} className="w-full h-24 object-cover rounded-md" />
              <button onClick={() => handleRemoveImage(index)}
                className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">&times;</button>
            </div>
          ))}
        </div>
      )}

      {isCameraOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4 animate-fadeIn">
          <video ref={videoRef} autoPlay playsInline className="max-w-full max-h-[80%] w-auto h-auto rounded-lg"></video>
          <canvas ref={canvasRef} className="hidden"></canvas>
          <div className="absolute bottom-10 flex items-center justify-center w-full gap-20">
             {cameraDevices.length > 1 && (
                <button onClick={handleSwitchCamera} className="text-white bg-black/30 rounded-full w-14 h-14 flex items-center justify-center hover:bg-black/50 transition" aria-label="Trocar câmera">
                    <SwitchCameraIcon />
                </button>
            )}
            <button onClick={handleCapturePhoto} className="w-20 h-20 rounded-full bg-white flex items-center justify-center p-1" aria-label="Tirar foto">
                <div className="w-full h-full rounded-full bg-white border-4 border-black/50"></div>
            </button>
             {cameraDevices.length > 1 && (
                <div className="w-14 h-14"></div> // Spacer to center capture button
            )}
          </div>
          <button onClick={handleCloseCamera} className="absolute top-5 right-5 text-white text-4xl font-light" aria-label="Fechar câmera">&times;</button>
        </div>
      )}
    </div>
  );
};
