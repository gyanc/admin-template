// User & Staff Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  roles?: Role[];
}

export interface Staff {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  department?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  roles?: Role[];
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User | Staff;
}

export interface ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Role & Permission Types
export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions?: Permission[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

// CMS Types
export interface CmsPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
  publishedAt?: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  versions?: CmsPageVersion[];
}

export interface CmsPageVersion {
  id: string;
  pageId: string;
  content: string;
  version: number;
  createdBy: string;
  createdAt: string;
}

// FAQ Types
export interface FaqCategory {
  id: string;
  name: string;
  description?: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category?: FaqCategory;
  views: number;
  helpful: number;
  notHelpful: number;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Email Template Types
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  triggerType: string;
  variables?: string[];
  createdAt: string;
  updatedAt: string;
  versions?: EmailTemplateVersion[];
}

export interface EmailTemplateVersion {
  id: string;
  templateId: string;
  subject: string;
  body: string;
  version: number;
  createdAt: string;
}

// Settings Types
export interface Setting {
  key: string;
  value: string;
  description?: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  category?: string;
  updatedAt: string;
}

// Pagination Types
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// List query options
export interface ListQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: any;
}
