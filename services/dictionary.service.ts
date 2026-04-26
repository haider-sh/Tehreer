import api from './api';
import { DictionaryEntry } from '../store/dictionary.store';

export const dictionaryService = {
  async list(): Promise<DictionaryEntry[]> {
    const { data } = await api.get<DictionaryEntry[]>('/dictionary');
    return data;
  },

  async add(params: {
    word: string;
    meaning: string;
    context_sentence: string;
  }): Promise<DictionaryEntry> {
    const { data } = await api.post<DictionaryEntry>('/dictionary', params);
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/dictionary/${id}`);
  },
};
