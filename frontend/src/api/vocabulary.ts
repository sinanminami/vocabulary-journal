import axios from 'axios';
import type { Word, WordCreateRequest, DictionaryLookupResponse } from '../types';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// API 请求拦截器
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// API 响应拦截器
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const vocabularyApi = {
  // 获取生词列表
  async getWords(params?: {
    skip?: number;
    limit?: number;
    search?: string;
  }): Promise<Word[]> {
    const response = await api.get('/api/words', { params });
    return response.data;
  },

  // 查询单词释义
  async lookupWord(word: string): Promise<DictionaryLookupResponse> {
    const response = await api.get(`/api/words/${encodeURIComponent(word)}/lookup`);
    return response.data;
  },

  // 添加生词
  async addWord(wordData: WordCreateRequest): Promise<Word> {
    const response = await api.post('/api/words', wordData);
    return response.data;
  },

  // 删除生词
  async deleteWord(wordId: number): Promise<void> {
    await api.delete(`/api/words/${wordId}`);
  },

  // 更新掌握程度
  async updateMastery(wordId: number, masteryLevel: number): Promise<void> {
    await api.put(`/api/words/${wordId}/mastery`, null, {
      params: { mastery_level: masteryLevel }
    });
  },

  // 获取统计信息
  async getStats(): Promise<{
    totalWords: number;
    todayWords: number;
    weekWords: number;
    masteryDistribution: Record<number, number>;
  }> {
    const words = await this.getWords({ limit: 1000 });
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const todayWords = words.filter(word => {
      const wordDate = new Date(word.created_at);
      return wordDate.toDateString() === today.toDateString();
    }).length;
    
    const weekWords = words.filter(word => {
      const wordDate = new Date(word.created_at);
      return wordDate >= weekAgo;
    }).length;
    
    const masteryDistribution = words.reduce((acc, word) => {
      acc[word.mastery_level] = (acc[word.mastery_level] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    return {
      totalWords: words.length,
      todayWords,
      weekWords,
      masteryDistribution,
    };
  }
};