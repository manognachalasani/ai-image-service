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
  
  // Azure-specific fields
  categories?: Array<{
    name: string;
    score: string;
  }>;
  tags?: Array<{
    name: string;
    confidence: string;
  }>;
  colors?: {
    dominantColorForeground?: string;
    dominantColorBackground?: string;
    dominantColors?: string[];
    accentColor?: string;
    isBWImg?: boolean;
  };
  imageType?: {
    clipArtType?: number;
    lineDrawingType?: number;
  };
  brands?: string[];
  celebrities?: Array<{
    name: string;
    confidence: number;
  }>;
  landmarks?: Array<{
    name: string;
    confidence: number;
  }>;
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
  autoSaved?: boolean; // New field from backend
}

// NEW: User Analysis History Types
export interface UserAnalysis {
  id: number;
  analysis: AnalysisResult;
  imageInfo: ImageInfo;
  savedAt: string;
  formattedDate: string;
  quickInfo?: {
    analysisType: string;
    objectCount: number;
    textCount: number;
    faceCount: number;
  };
}

export interface PaginatedHistory {
  history: UserAnalysis[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserStatistics {
  totalAnalyses: number;
  recentActivity: number;
  analysesByType: Record<string, number>;
  averagePerWeek: number;
}

// NEW: Export Types
export interface ExportOptions {
  analysisData: AnalysisResult;
  imageInfo: ImageInfo;
  format: 'pdf' | 'json' | 'csv' | 'image';
}

// Helper function to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('authToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Upload and analyze image (enhanced with auto-save)
export const analyzeImage = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: getAuthHeaders(),
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

// Get user analysis history (enhanced with search and filtering)
export const getUserAnalysisHistory = async (
  page: number = 1, 
  limit: number = 20,
  search: string = '',
  type: string = ''
): Promise<PaginatedHistory> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(type && { type })
  });

  const response = await fetch(`${API_BASE}/user/history?${params}`, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch analysis history');
  }

  return response.json();
};

// NEW: Get user statistics
export const getUserStatistics = async (): Promise<UserStatistics> => {
  const response = await fetch(`${API_BASE}/user/statistics`, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user statistics');
  }

  return response.json();
};

// NEW: Save user preferences
export const saveUserPreferences = async (preferences: any) => {
  const response = await fetch(`${API_BASE}/user/preferences`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ preferences }),
  });

  if (!response.ok) {
    throw new Error('Failed to save preferences');
  }

  return response.json();
};

// NEW: Export analysis
export const exportAnalysis = async (
  analysisData: AnalysisResult, 
  imageInfo: ImageInfo, 
  format: 'pdf' | 'json' | 'csv' | 'image'
): Promise<Blob | any> => {
  const params = new URLSearchParams({
    analysisData: JSON.stringify(analysisData),
    imageInfo: JSON.stringify(imageInfo),
  });

  const response = await fetch(`${API_BASE}/export/${format}?${params}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Export failed: ${response.statusText}`);
  }

  if (format === 'json') {
    return response.json();
  } else {
    return response.blob();
  }
};

// NEW: Bulk delete analyses
export const bulkDeleteAnalyses = async (analysisIds: number[]) => {
  const response = await fetch(`${API_BASE}/user/history/bulk`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ analysisIds }),
  });

  if (!response.ok) {
    throw new Error('Failed to delete analyses');
  }

  return response.json();
};

// NEW: Bulk export analyses
export const bulkExportAnalyses = async (analysisIds: number[], format: string = 'json') => {
  const response = await fetch(`${API_BASE}/user/history/export`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ analysisIds, format }),
  });

  if (!response.ok) {
    throw new Error('Failed to export analyses');
  }

  if (format === 'json') {
    return response.json();
  } else {
    return response.blob();
  }
};
