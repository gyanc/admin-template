import apiClient from '../api-client';
import { CmsPage, PaginatedResponse, ListQueryOptions } from '../types';

export interface CreateCmsPageDto {
  title: string;
  slug: string;
  content?: string;
  isPublished?: boolean;
}

export interface UpdateCmsPageDto {
  title?: string;
  slug?: string;
  content?: string;
  isPublished?: boolean;
}

export const cmsApi = {
  /**
   * List CMS pages with pagination and filters
   */
  async list(options: ListQueryOptions = {}) {
    const response = await apiClient.get<PaginatedResponse<CmsPage>>('/cms', {
      params: {
        page: options.page || 1,
        limit: options.limit || 20,
        search: options.search,
        status: options.status,
        sortBy: options.sortBy,
        sortOrder: options.sortOrder,
      },
    });
    return response.data;
  },

  /**
   * Get a single CMS page by ID
   */
  async getById(id: string) {
    const response = await apiClient.get<{ data: CmsPage } | CmsPage>(
      `/cms/${id}`
    );
    return (
      (response.data as { data: CmsPage }).data || (response.data as CmsPage)
    );
  },

  /**
   * Create a new CMS page
   */
  async create(data: CreateCmsPageDto) {
    const response = await apiClient.post<{ data: CmsPage } | CmsPage>(
      '/cms',
      data
    );
    return (
      (response.data as { data: CmsPage }).data || (response.data as CmsPage)
    );
  },

  /**
   * Update an existing CMS page
   */
  async update(id: string, data: UpdateCmsPageDto) {
    const response = await apiClient.put<{ data: CmsPage } | CmsPage>(
      `/cms/${id}`,
      data
    );
    return (
      (response.data as { data: CmsPage }).data || (response.data as CmsPage)
    );
  },

  /**
   * Delete a CMS page
   */
  async delete(id: string) {
    await apiClient.delete(`/cms/${id}`);
  },
};
