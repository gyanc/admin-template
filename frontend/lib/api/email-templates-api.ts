import apiClient from '../api-client';
import { EmailTemplate, PaginatedResponse, ListQueryOptions } from '../types';

export interface CreateEmailTemplateDto {
  name: string;
  subject: string;
  body: string;
  triggerType: string;
  variables?: string[];
}

export interface UpdateEmailTemplateDto {
  name?: string;
  subject?: string;
  body?: string;
  triggerType?: string;
  variables?: string[];
}

export const emailTemplatesApi = {
  /**
   * List email templates with pagination and filters
   */
  async list(options: ListQueryOptions = {}) {
    const response = await apiClient.get<PaginatedResponse<EmailTemplate>>(
      '/email-templates',
      {
        params: {
          page: options.page || 1,
          limit: options.limit || 20,
          search: options.search,
          triggerType: options.triggerType,
          sortBy: options.sortBy,
          sortOrder: options.sortOrder,
        },
      }
    );
    return response.data;
  },

  /**
   * Get a single email template by ID
   */
  async getById(id: string) {
    const response = await apiClient.get<{ data: EmailTemplate } | EmailTemplate>(
      `/email-templates/${id}`
    );
    return (
      (response.data as { data: EmailTemplate }).data ||
      (response.data as EmailTemplate)
    );
  },

  /**
   * Create a new email template
   */
  async create(data: CreateEmailTemplateDto) {
    const response = await apiClient.post<
      { data: EmailTemplate } | EmailTemplate
    >('/email-templates', data);
    return (
      (response.data as { data: EmailTemplate }).data ||
      (response.data as EmailTemplate)
    );
  },

  /**
   * Update an existing email template
   */
  async update(id: string, data: UpdateEmailTemplateDto) {
    const response = await apiClient.put<
      { data: EmailTemplate } | EmailTemplate
    >(`/email-templates/${id}`, data);
    return (
      (response.data as { data: EmailTemplate }).data ||
      (response.data as EmailTemplate)
    );
  },

  /**
   * Delete an email template
   */
  async delete(id: string) {
    await apiClient.delete(`/email-templates/${id}`);
  },
};
