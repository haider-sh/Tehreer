import api from './api';

export interface PdfDocument {
  document_id: string;
  name: string;
  page_count: number;
  uploaded_at: string;
}

export const pdfService = {
  async list(): Promise<PdfDocument[]> {
    const { data } = await api.get<PdfDocument[]>('/pdfs/');
    return data;
  },

  async upload(uri: string, name: string): Promise<PdfDocument> {
    const formData = new FormData();
    formData.append('file', { uri, name, type: 'application/pdf' } as any);
    const { data } = await api.post<PdfDocument>('/pdfs/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async delete(documentId: string): Promise<void> {
    await api.delete(`/pdfs/${documentId}`);
  },

  getFileUrl(documentId: string): string {
    // Returns the URL used as the source for react-native-pdf
    const { API_BASE_URL } = require('../constants/api');
    return `${API_BASE_URL}/pdfs/${documentId}/file`;
  },
};
