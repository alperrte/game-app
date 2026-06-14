import { API_BASE_URL } from "./constants";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;

type ApiClientOptions = {
  body?: unknown;
  query?: QueryParams;
};

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

const buildUrl = (endpoint: string, query?: QueryParams) => {
  const url = new URL(endpoint, API_BASE_URL);

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
};

const parseResponseBody = async (response: Response) => {
  const contentType = response.headers.get("content-type");

  if (response.status === 204) {
    return undefined;
  }

  if (contentType?.includes("application/json")) {
    return response.json();
  }

  return response.text();
};

const request = async <TResponse>(
  method: HttpMethod,
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<TResponse> => {
  const response = await fetch(buildUrl(endpoint, options.query), {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const responseBody = await parseResponseBody(response);

  if (!response.ok) {
    throw new ApiError("API request failed", response.status, responseBody);
  }

  return responseBody as TResponse;
};

export const apiClient = {
  get: <TResponse>(endpoint: string, query?: QueryParams) =>
    request<TResponse>("GET", endpoint, { query }),
  post: <TResponse>(endpoint: string, body: unknown) =>
    request<TResponse>("POST", endpoint, { body }),
  put: <TResponse>(endpoint: string, body: unknown) =>
    request<TResponse>("PUT", endpoint, { body }),
  delete: (endpoint: string) => request<void>("DELETE", endpoint),
};
