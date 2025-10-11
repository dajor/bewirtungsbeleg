/**
 * Document type definitions for Bewirtungsbeleg application
 */

export type DocumentStatus = 'processing' | 'completed' | 'error' | 'pending';

export type DocumentType =
  | 'bewirtungsbeleg'
  | 'receipt'
  | 'invoice'
  | 'eigenbeleg'
  | 'other';

export interface DocumentMetadata {
  total_amount?: number;
  currency?: string;
  date?: string;
  restaurant_name?: string;
  participants?: string[];
  business_purpose?: string;
  [key: string]: any; // Allow additional custom metadata
}

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  status: DocumentStatus;
  created_at: string;
  updated_at?: string;
  thumbnail_url?: string;
  pdf_url?: string;
  original_url?: string;
  user_id: string;
  organization_id?: string;
  metadata: DocumentMetadata;
  gobd_compliant?: boolean;
  signature_hash?: string;
}

export interface DocumentListResponse {
  documents: Document[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DocumentListQuery {
  search?: string;
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
  type?: DocumentType;
  status?: DocumentStatus;
  sortBy?: 'created_at' | 'updated_at' | 'name' | 'amount';
  sortOrder?: 'asc' | 'desc';
}
