import api from './api';

export type SelectionType = 'word' | 'phrase' | 'sentence' | 'paragraph';

export interface MeaningResponse {
  meaning: string;
  pos: string;
  confidence: number;
}

export interface SummaryResponse {
  summary: string;
}

export const meaningService = {
  async getMeaning(params: {
    page: number;
    selected_text: string;
    context: string;
    selection_type: SelectionType;
    document_id?: string; // optional — only used if the PDF is server-side
  }): Promise<MeaningResponse> {
    const { data } = await api.post<MeaningResponse>('/meaning', params);
    return data;
  },

  async getSummary(params: {
    local_pdf_path: string; // file:// URI — backend will receive the file
    from_page: number;
    to_page: number;
  }): Promise<SummaryResponse> {
    const { data } = await api.post<SummaryResponse>('/summary', params);
    return data;
  },
};
