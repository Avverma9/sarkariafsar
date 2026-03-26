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
        state.items = action.payload.data ?? action.payload;
        state.total = action.payload.total ?? state.items.length;
        state.page = action.payload.page ?? 1;
        state.limit = action.payload.limit ?? 10;
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
