// API客户端工具函数

const API_BASE = "/api";

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  params?: Record<string, string | number | undefined>;
}

export async function api<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, params } = options;
  
  let url = `${API_BASE}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    url += `?${searchParams.toString()}`;
  }

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || "请求失败");
  }

  return data;
}

// 产品API
export const productsApi = {
  list: (params?: { category?: string; page?: number; pageSize?: number }) =>
    api<{ data: unknown[]; total: number }>("/products", { params }),
  
  get: (id: string) =>
    api<{ data: unknown }>(`/products/${id}`),
  
  create: (data: unknown) =>
    api<{ data: unknown }>("/products", { method: "POST", body: data }),
  
  update: (data: unknown) =>
    api<{ data: unknown }>("/products", { method: "PUT", body: data }),
  
  delete: (id: string) =>
    api<{ success: boolean }>(`/products?id=${id}`, { method: "DELETE" }),
};

// 风格模板API
export const templatesApi = {
  list: (params?: { styleType?: string }) =>
    api<{ data: unknown[] }>("/style-templates", { params }),
  
  create: (data: unknown) =>
    api<{ data: unknown }>("/style-templates", { method: "POST", body: data }),
  
  update: (data: unknown) =>
    api<{ data: unknown }>("/style-templates", { method: "PUT", body: data }),
  
  delete: (id: string) =>
    api<{ success: boolean }>(`/style-templates?id=${id}`, { method: "DELETE" }),
};

// 素材API
export const materialsApi = {
  search: (keyword: string, params?: { page?: number; pageSize?: number }) =>
    api<{ data: { videos: unknown[]; total: number } }>("/materials/search", { 
      params: { keyword, ...params } 
    }),
  
  list: (params?: { status?: string; page?: number }) =>
    api<{ data: unknown[]; total: number }>("/materials", { params }),
  
  create: (data: unknown) =>
    api<{ data: unknown }>("/materials", { method: "POST", body: data }),
  
  delete: (id: string) =>
    api<{ success: boolean }>(`/materials?id=${id}`, { method: "DELETE" }),
  
  analyze: (data: { materialId: string; videoUrl?: string }) =>
    api<{ data: unknown }>("/materials/analyze", { method: "POST", body: data }),
};

// 话术API
export const scriptsApi = {
  list: (params?: { productId?: string; status?: string; page?: number }) =>
    api<{ data: unknown[]; total: number }>("/scripts", { params }),
  
  update: (data: unknown) =>
    api<{ data: unknown }>("/scripts", { method: "PUT", body: data }),
  
  delete: (id: string) =>
    api<{ success: boolean }>(`/scripts?id=${id}`, { method: "DELETE" }),
  
  checkCompliance: (scriptId: string) =>
    api<{ data: unknown }>("/scripts/compliance", { 
      method: "POST", 
      body: { scriptId } 
    }),
};

// 知识库API
export const knowledgeApi = {
  listCollections: (params?: { collectionType?: string }) =>
    api<{ data: unknown[] }>("/knowledge", { params }),
  
  createCollection: (data: unknown) =>
    api<{ data: unknown }>("/knowledge", { method: "POST", body: data }),
  
  search: (query: string, params?: { collectionIds?: string[]; topK?: number }) =>
    api<{ data: { results: unknown[]; total: number } }>("/knowledge/search", { 
      method: "POST", 
      body: { query, ...params } 
    }),
  
  listDocuments: (collectionId: string, params?: { page?: number }) =>
    api<{ data: unknown[]; total: number }>("/knowledge/documents", { 
      params: { collectionId, ...params } 
    }),
  
  importDocument: (data: unknown) =>
    api<{ data: unknown }>("/knowledge/documents", { method: "POST", body: data }),
  
  deleteDocument: (id: string) =>
    api<{ success: boolean }>(`/knowledge/documents?id=${id}`, { method: "DELETE" }),
};
