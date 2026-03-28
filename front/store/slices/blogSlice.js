import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { baseUrl } from "../../lib/baseUrl";
import { getCache, setCache, fetchWithTimeout } from "../../lib/sessionCache";

// GET /blog
export const fetchBlogs = createAsyncThunk(
  "blog/fetchBlogs",
  async (params = {}, { rejectWithValue }) => {
    const cacheKey = `sarkari_blogs_${params.page || 1}_${params.limit || 30}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;
    try {
      const url = new URL(`${baseUrl}/blog`);
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, String(value));
        }
      });
      const res = await fetchWithTimeout(url.toString());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCache(cacheKey, data);
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// GET /blog/slug/:slug
export const fetchBlogBySlug = createAsyncThunk(
  "blog/fetchBlogBySlug",
  async (slug, { rejectWithValue }) => {
    const cacheKey = `sarkari_blog_slug_${slug}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;
    try {
      const res = await fetchWithTimeout(`${baseUrl}/blog/slug/${encodeURIComponent(slug)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCache(cacheKey, data);
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const initialState = {
  items: [],
  total: 0,
  page: 1,
  limit: 10,
  currentBlog: null,
  loading: false,
  error: null,
  blogLoading: false,
  blogError: null,
};

const blogSlice = createSlice({
  name: "blog",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchBlogs
      .addCase(fetchBlogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBlogs.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload ?? {};

        // Determine items array from common response shapes
        let items = [];
        if (Array.isArray(payload)) {
          items = payload;
        } else if (Array.isArray(payload.data)) {
          items = payload.data;
        } else if (Array.isArray(payload.docs)) {
          items = payload.docs;
        } else if (Array.isArray(payload.items)) {
          items = payload.items;
        }

        state.items = items;

        // Extract total from various possible fields
        const totalFromPayload =
          payload.total ?? payload.count ?? payload.totalDocs ?? payload.meta?.total ?? payload.pagination?.total ?? null;
        state.total = typeof totalFromPayload === 'number' ? totalFromPayload : items.length;

        // Extract page & limit with fallbacks
        const pageFromPayload = payload.page ?? payload.currentPage ?? payload.meta?.page ?? payload.pagination?.page ?? null;
        const limitFromPayload = payload.limit ?? payload.perPage ?? payload.pageSize ?? payload.meta?.limit ?? payload.pagination?.limit ?? null;

        state.page = Number(pageFromPayload ?? state.page ?? 1);
        state.limit = Number(limitFromPayload ?? state.limit ?? 10);
      })
      .addCase(fetchBlogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchBlogBySlug
      .addCase(fetchBlogBySlug.pending, (state) => {
        state.blogLoading = true;
        state.blogError = null;
      })
      .addCase(fetchBlogBySlug.fulfilled, (state, action) => {
        state.blogLoading = false;
        state.currentBlog = action.payload.data ?? action.payload;
      })
      .addCase(fetchBlogBySlug.rejected, (state, action) => {
        state.blogLoading = false;
        state.blogError = action.payload;
      });
  },
});

export default blogSlice.reducer;
