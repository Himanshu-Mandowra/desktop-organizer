import {
  listLocalLayouts,
  saveLocalLayout,
  deleteLocalLayout,
} from "../utils/layoutCache";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export const DEFAULT_TEMPLATES = [
  {
    _id: "builtin-boa-hancock",
    title: "Boa Hancock",
    category: "One Piece",
    type: "image",
    url: "/templates/boa-hancock.jpg",
    isDefault: true,
    isBuiltIn: true,
    likesCount: 0,
  },
  {
    _id: "builtin-toji",
    title: "Toji Fushiguro",
    category: "Jujutsu Kaisen",
    type: "image",
    url: "/templates/toji.jpg",
    isDefault: false,
    isBuiltIn: true,
    likesCount: 0,
  },
];

const getAuthHeaders = () => {
  const token = localStorage.getItem("dc_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const apiRequest = async (endpoint, options = {}) => {
  const headers = {
    ...(options.isFormData ? {} : { "Content-Type": "application/json" }),
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || "Request failed");
    error.requiresAuth = data.requiresAuth;
    error.status = response.status;
    throw error;
  }
  return data;
};

export const authApi = {
  signup: (payload) =>
    apiRequest("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  login: (payload) =>
    apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getMe: () => apiRequest("/auth/me"),
};

export const templateApi = {
  getAll: async () => {
    try {
      const data = await apiRequest("/templates");
      return data.templates?.length ? data.templates : DEFAULT_TEMPLATES;
    } catch {
      return DEFAULT_TEMPLATES;
    }
  },
  upload: (formData) =>
    apiRequest("/templates", {
      method: "POST",
      isFormData: true,
      body: formData,
    }),
  toggleLike: (templateId) =>
    apiRequest(`/templates/${templateId}/like`, {
      method: "POST",
    }),
};

// Layout storage mode:
// - default ("local"): layouts are cached in the browser (IndexedDB), no login or backend needed.
// - set REACT_APP_LAYOUT_STORAGE=cloud in frontend/.env to save layouts to the backend/MongoDB instead
//   (this requires the user to be signed in).
export const LAYOUTS_ARE_LOCAL =
  (process.env.REACT_APP_LAYOUT_STORAGE || "local").toLowerCase() !== "cloud";

const cloudLayoutApi = {
  getAll: () => apiRequest("/layouts"),
  save: (payload) =>
    apiRequest("/layouts", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  remove: (id) =>
    apiRequest(`/layouts/${id}`, {
      method: "DELETE",
    }),
};

const localLayoutApi = {
  getAll: async () => ({ layouts: await listLocalLayouts() }),
  save: async (payload) => ({ layout: await saveLocalLayout(payload) }),
  remove: async (id) => {
    await deleteLocalLayout(id);
    return { success: true };
  },
};

export const layoutApi = LAYOUTS_ARE_LOCAL ? localLayoutApi : cloudLayoutApi;
