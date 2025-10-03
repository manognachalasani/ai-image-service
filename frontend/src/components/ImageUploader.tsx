import React, { useState } from 'react';
import { analyzeImage, AnalysisResult, ImageInfo } from '../services/api';

interface ImageUploaderProps {
  onAnalysisComplete: (result: AnalysisResult, imageInfo: ImageInfo) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onAnalysisComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const result = await analyzeImage(file);
      onAnalysisComplete(result.analysis, result.imageInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card">
      <h2>Upload Image for AI Analysis</h2>
      <div className="upload-area">
        <p>Drag & drop or click to upload</p>
        <input 
          type="file" 
          accept="image/*"
          onChange={handleFileUpload}
          disabled={uploading}
          style={{ display: 'none' }}
          id="file-input"
        />
        <label htmlFor="file-input" className="primary-button" style={{ cursor: 'pointer', display: 'inline-block', marginTop: '1rem' }}>
          {uploading ? (
            <>
              <span className="loading-spinner"></span>
              Analyzing...
            </>
          ) : (
            'Select Image'
          )}
        </label>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
          Supports: JPG, PNG, GIF, WebP (max 10MB)
        </p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;