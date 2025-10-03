const API_BASE = 'http://localhost:5000/api';

// Enhanced type definitions
export interface FaceAnalysis {
  age: string;
  gender: string;
  emotions: string[];
  species?: string;
  smile?: string;
  glasses?: string;
  pose?: string;
  expression?: string;
}

export interface AnalysisResult {
  objects: string[];
  text: string[];
  faces: FaceAnalysis[];
  analysisType: string;
  confidence: string;
  // New properties from enhanced AI
  scene?: string;
  lighting?: string;
  quality?: string;
  environment?: string;
  activity?: string;
  type?: string;
  appeal?: string;
  setting?: string;
  imageQuality?: string;
  processingTime?: string;
  timestamp?: string;
}

export interface ImageInfo {
  originalName: string;
  storedName: string;
  size: number;
  thumbnail: string;
  fullImage: string;
}

export interface UploadResponse {
  success: boolean;
  analysis: AnalysisResult;
  imageInfo: ImageInfo;
  analysisId: number;
}

// Upload and analyze image
export const analyzeImage = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return response.json();
};

// Search images
export const searchImages = async (query: string) => {
  const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error('Search failed');
  }
  return response.json();
};