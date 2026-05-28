import React, {useCallback, useEffect, useRef, useState} from 'react'
import {useOutletContext} from "react-router";
import {CheckCircle2, ImageIcon, UploadIcon} from "lucide-react";
import {PROGRESS_INTERVAL_MS, PROGRESS_STEP, REDIRECT_DELAY_MS} from "../lib/constants";

const Upload = ({onComplete}: UploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const {isSignedIn} = useOutletContext<AuthContext>();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const readerRef = useRef<FileReader | null>(null);

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (readerRef.current) {
      readerRef.current.abort();
      readerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const processFile = useCallback((file: File) => {
    if (!isSignedIn) return;

    // 50MB limit
    if (file.size > 50 * 1024 * 1024) {
      alert("File size exceeds 50MB limit");
      return;
    }

    cleanup();
    setFile(file);
    setProgress(0);

    const reader = new FileReader();
    readerRef.current = reader;

    reader.onerror = () => {
      if (readerRef.current !== reader) return;
      cleanup();
      alert("Error reading file");
    };

    reader.onloadend = () => {
      if (readerRef.current !== reader) return;
      if (reader.error || !reader.result) {
        cleanup();
        alert("Error reading file");
        return;
      }

      const base64String = reader.result as string;

      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            timeoutRef.current = setTimeout(() => {
              onComplete(base64String);
              timeoutRef.current = null;
            }, REDIRECT_DELAY_MS);
            return 100;
          }
          return prev + PROGRESS_STEP;
        });
      }, PROGRESS_INTERVAL_MS);
    };
    reader.readAsDataURL(file);
  }, [isSignedIn, onComplete, cleanup]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isSignedIn) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isSignedIn) return;

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      processFile(droppedFile);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isSignedIn) return;
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  return (
    <div className="upload">
      {!file ? (
        <div
          className={`dropzone ${isDragging ? 'is-dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            className="drop-input"
            accept=".jpg, .jpeg, .png"
            disabled={!isSignedIn}
            onChange={handleChange}
          />
          <div className="drop-content">
            <div className="drop-icon">
              <UploadIcon size={20}/>
            </div>
            <p>{
              isSignedIn ? "Drop your floor plan here or click to select" : "Sign in to upload"
            }</p>
            <p className="help">
              Maximum file size: 50MB
            </p>
          </div>
        </div>
      ) : (
        <div className="upload-status">
          <div className="status-content">
            <div className="status-icon">
              {progress === 100 ? (
                <CheckCircle2 className="check"/>
              ) : (
                <ImageIcon className="image"/>
              )
              }
            </div>
            <h3>{file.name}</h3>
            <div className="progress">
              <div className="bar" style={{width: `${progress}%`}}/>
              <p className="status-text">
                {progress < 100 ? 'Analysing floor plan...' : 'Rendering..'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default Upload;
