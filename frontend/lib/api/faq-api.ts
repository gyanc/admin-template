import apiClient from '../api-client';
import { Faq, PaginatedResponse, ListQueryOptions } from '../types';

export interface CreateFaqDto {
  question: string;
  answer: string;
  category?: string;
  isActive?: boolean;
  priority?: number;
}

export interface UpdateFaqDto {
  question?: string;
  answer?: string;
  category?: string;
  isActive?: boolean;
  priority?: number;
}

export const faqApi = {
  /**
   * List FAQs with pagination and filters
   */
  async list(options: ListQueryOptions = {}) {
    const response = await apiClient.get<PaginatedResponse<Faq>>('/faq', {
      params: {
        page: options.page || 1,
        limit: options.limit || 20,
        search: options.search,
        status: options.status,
        category: options.category,
        sortBy: options.sortBy,
        sortOrder: options.sortOrder,
      },
    });
    return response.data;
  },

  /**
   * Get a single FAQ by ID
   */
  async getById(id: string) {
    const response = await apiClient.get<{ data: Faq } | Faq>(`/faq/${id}`);
    return (response.data as { data: Faq }).data || (response.data as Faq);
  },

  /**
   * Create a new FAQ
   */
  async create(data: CreateFaqDto) {
    const response = await apiClient.post<{ data: Faq } | Faq>('/faq', data);
    return (response.data as { data: Faq }).data || (response.data as Faq);
  },

  /**
   * Update an existing FAQ
   */
  async update(id: string, data: UpdateFaqDto) {
    const response = await apiClient.put<{ data: Faq } | Faq>(`/faq/${id}`, data);
    return (response.data as { data: Faq }).data || (response.data as Faq);
  },

  /**
   * Delete a FAQ
   */
  async delete(id: string) {
    await apiClient.delete(`/faq/${id}`);
  },
};
