/**
 * @file        artifacts/ai-command-center/src/hooks/useFileUpload.ts
 * @module      File Management / Upload
 * @purpose     React hook for file upload with drag-and-drop, validation, and progress tracking
 *
 * @ai_instructions
 *   - Must validate file types and sizes before upload
 *   - Must properly cleanup object URLs on unmount
 *   - Must handle drag events with proper counter to avoid false negatives
 *   - DO NOT modify default file size limits without security review
 *
 * @exports     useFileUpload, FileUploadOptions, FileWithPreview, UseFileUploadResult
 * @imports     @/api/chat
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { useState, useEffect, useRef, ChangeEvent, DragEvent } from 'react';
import { FileAttachment } from '@/api/chat';

export interface FileUploadOptions {
  maxSizeMB?: number;
  allowedTypes?: string[];
  maxFiles?: number;
}

export interface FileWithPreview {
  file: File;
  preview: string;
  id: string;
}

export interface UploadProgress {
  [fileId: string]: number;
}

export interface UseFileUploadResult {
  files: FileWithPreview[];
  uploadProgress: UploadProgress;
  error: string | null;
  isUploading: boolean;
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleDragOver: (event: DragEvent<HTMLDivElement>) => void;
  handleDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  handleDrop: (event: DragEvent<HTMLDivElement>) => void;
  removeFile: (id: string) => void;
  clearAllFiles: () => void;
  uploadFiles: () => Promise<FileAttachment[]>;
}

export function useFileUpload(options: FileUploadOptions = {}): UseFileUploadResult {
  const {
    maxSizeMB = 10,
    allowedTypes = [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/json',
      'text/csv'
    ],
    maxFiles = 5
  } = options;

  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach(({ preview }) => URL.revokeObjectURL(preview));
    };
  }, [files]);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      const allowedExtensions = allowedTypes
        .map(type => type.split('/')[1])
        .join(', ');
      return `Invalid file type. Allowed: ${allowedExtensions}`;
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File too large. Maximum size: ${maxSizeMB}MB`;
    }

    return null;
  };

  const createFileWithPreview = (file: File): FileWithPreview => {
    const preview = URL.createObjectURL(file);
    return {
      file,
      preview,
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  };

  const processFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setError(null);
    const filesToProcess = Array.from(fileList);

    // Check max files limit
    if (files.length + filesToProcess.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate all files first
    for (const file of filesToProcess) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    // All files valid, create previews and add to state
    const newFiles = filesToProcess.map(createFileWithPreview);
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    processFiles(event.target.files);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounter.current++;
    if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
    dragCounter.current = 0;

    const droppedFiles = event.dataTransfer.files;
    processFiles(droppedFiles);
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
        // Remove from upload progress if exists
        setUploadProgress(progress => {
          const newProgress = { ...progress };
          delete newProgress[id];
          return newProgress;
        });
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const clearAllFiles = () => {
    files.forEach(({ preview }) => URL.revokeObjectURL(preview));
    setFiles([]);
    setUploadProgress({});
    setError(null);
  };

  const uploadFiles = async (): Promise<FileAttachment[]> => {
    if (files.length === 0) return [];

    setIsUploading(true);
    setError(null);

    try {
      const uploadPromises = files.map(async (fileData): Promise<FileAttachment> => {
        const formData = new FormData();
        formData.append('file', fileData.file);

        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          // Track upload progress
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const percentComplete = (e.loaded / e.total) * 100;
              setUploadProgress(prev => ({
                ...prev,
                [fileData.id]: Math.round(percentComplete)
              }));
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve({
                  id: fileData.id,
                  name: fileData.file.name,
                  type: fileData.file.type,
                  size: fileData.file.size,
                  url: response.url || `/uploads/${fileData.file.name}`
                });
              } catch (error) {
                reject(new Error('Invalid server response'));
              }
            } else {
              reject(new Error(`Upload failed: ${xhr.statusText}`));
            }
          });

          xhr.addEventListener('error', () => {
            reject(new Error('Network error during upload'));
          });

          xhr.open('POST', '/api/upload');
          xhr.send(formData);
        });
      });

      const results = await Promise.all(uploadPromises);
      
      // Clear files after successful upload
      clearAllFiles();
      
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    files,
    uploadProgress,
    error,
    isUploading,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    removeFile,
    clearAllFiles,
    uploadFiles
  };
}
