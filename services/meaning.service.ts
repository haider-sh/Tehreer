import api from './api';

export type SelectionType = 'word' | 'phrase' | 'sentence' | 'paragraph';

export interface MeaningResponse {
  meaning: string;
  pageNo: number;
  bookName: string;
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
    text: string;
  }): Promise<SummaryResponse> {
    const { data } = await api.post<SummaryResponse>('/summary', params, {
      timeout: 60_000,
    });
    return data;
  },
};
