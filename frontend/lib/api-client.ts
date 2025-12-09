import { toast } from "react-hot-toast";

export const API_BASE =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiClientOptions {
  headers?: Record<string, string>;
  body?: unknown;
  cache?: RequestCache;
  auth?: boolean;
  // Querystring parameters (axios-style alias: params)
  query?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

export interface ApiClientResponse<T = any> {
  data: T;
  status: number;
  ok: boolean;
  headers: Headers;
}

const isServer = typeof window === "undefined";
const ACCESS_COOKIE = "access_token";

function getBrowserAccessToken(): string | null {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split("; ").filter(Boolean);
  const raw = parts.find((c) => c.startsWith(`${ACCESS_COOKIE}=`));
  if (!raw) return null;
  const [, value] = raw.split("=");
  return decodeURIComponent(value);
    }

function buildHeaders(
  custom?: Record<string, string>,
  includeAuth = true
): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...custom,
  };

  // In the browser, automatically attach Authorization from access_token cookie
  if (!isServer && includeAuth && !headers.Authorization) {
    const token = getBrowserAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
  }

async function handleResponse<T>(
  response: Response
): Promise<ApiClientResponse<T>> {
  let payload: T | null = null;
  try {
    payload = (await response.json()) as T;
  } catch {
    // ignore parse errors for empty bodies
  }

  return {
    data: payload as T,
    status: response.status,
    ok: response.ok,
    headers: response.headers,
  };
        }

async function request<T>(
  path: string,
  method: HttpMethod,
  options: ApiClientOptions = {}
): Promise<ApiClientResponse<T>> {
  const {
    headers,
    body,
    cache = "no-store",
    auth = true,
    query,
    params,
  } = options;

  const searchParams = new URLSearchParams();
  const qp = query || params;
  if (qp) {
    Object.entries(qp).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      searchParams.append(key, String(value));
    });
  }

  const url =
    searchParams.toString().length > 0
      ? `${API_BASE}${path}?${searchParams.toString()}`
      : `${API_BASE}${path}`;

  const response = await fetch(url, {
    method,
    headers: buildHeaders(headers, auth),
    body: body ? JSON.stringify(body) : undefined,
    cache,
    credentials: "include",
  });

  const handled = await handleResponse<T>(response);

  if (!handled.ok) {
    // Axios-style error object so existing catch blocks keep working
    const error: any = new Error("API request failed");
    error.response = {
      status: handled.status,
      data: handled.data,
    };

    if (!isServer) {
      // Client-side toasts and actions for common errors
      if (handled.status === 401) {
        toast.error("Session expired. Please sign in again.");
        // Clear auth cookies
        if (typeof document !== "undefined") {
          document.cookie = `${ACCESS_COOKIE}=; Max-Age=0; Path=/`;
          document.cookie = `refresh_token=; Max-Age=0; Path=/`;
        }
        // Redirect to login
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      } else if (handled.status === 403) {
        toast.error("You do not have permission to access this resource.");
      } else if (handled.status === 404) {
        toast.error("Resource not found.");
      } else if (handled.status >= 500) {
        toast.error("Server error. Please try again later.");
    }
    }

    throw error;
  }

  return handled;
}

export const apiClient = {
  async get<T>(path: string, options?: ApiClientOptions) {
    return request<T>(path, "GET", options);
  },
  async post<T>(path: string, body?: unknown, options?: ApiClientOptions) {
    return request<T>(path, "POST", { ...options, body });
  },
  async put<T>(path: string, body?: unknown, options?: ApiClientOptions) {
    return request<T>(path, "PUT", { ...options, body });
  },
  async patch<T>(path: string, body?: unknown, options?: ApiClientOptions) {
    return request<T>(path, "PATCH", { ...options, body });
  },
  async delete<T>(path: string, options?: ApiClientOptions) {
    return request<T>(path, "DELETE", options);
  },
};

export default apiClient;
