import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { baseUrl } from "../../lib/baseUrl";
import { getCache, setCache } from "../../lib/sessionCache";
import axios from "axios";

// GET /post/slug/:slug
export const fetchPostBySlug = createAsyncThunk(
  "posts/fetchPostBySlug",
  async (slug, { rejectWithValue }) => {
    const cacheKey = `sarkari_post_slug_${slug}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;
    try {
      const { data } = await axios.get(`${baseUrl}/post/slug/${encodeURIComponent(slug)}`, { timeout: 30000 });
      setCache(cacheKey, data);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// GET /post/get-posts-with-section (no params needed)
export const fetchPostsBySection = createAsyncThunk(
  "posts/fetchPostsBySection",
  async (_, { rejectWithValue }) => {
    const cacheKey = "sarkari_posts_by_section";
    const cached = getCache(cacheKey);
    if (cached) return cached;
    try {
      const { data } = await axios.get(`${baseUrl}/post/get-posts-with-section`, { timeout: 30000 });
      setCache(cacheKey, data);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// GET /post?section=<sectionCanonicalUrl> — all posts for one section
export const fetchSectionPosts = createAsyncThunk(
  "posts/fetchSectionPosts",
  async (sectionCanonicalUrl, { rejectWithValue }) => {
    const cacheKey = `sarkari_section_posts_${sectionCanonicalUrl}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;
    try {
      const { data } = await axios.get(
        `${baseUrl}/post/section-list/${encodeURIComponent(sectionCanonicalUrl)}`,
        { timeout: 30000 }
      );
      setCache(cacheKey, data);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// GET /post (only search/filter params, no pagination)
export const fetchPosts = createAsyncThunk(
  "posts/fetchPosts",
  async ({ search, section, state, limit } = {}, { rejectWithValue }) => {
    const cacheKey = `sarkari_posts_${search || ""}_${section || ""}_${state || ""}_${limit || ""}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;

    const params = {};
    if (search) params.search = search;
    if (section) params.section = section;
    if (state) params.state = state;
    if (limit) params.limit = limit;

    const MAX_RETRIES = 3;
    let lastErr;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const { data } = await axios.get(`${baseUrl}/post`, {
          params,
          timeout: 30000,
        });
        setCache(cacheKey, data);
        return data;
      } catch (err) {
        lastErr = err;
        // Only retry on timeout or network errors, not on 4xx/5xx
        const isRetryable =
          err.code === "ECONNABORTED" ||
          err.code === "ERR_NETWORK" ||
          !err.response;
        if (!isRetryable || attempt === MAX_RETRIES - 1) break;
        // Exponential backoff: 1s, 2s
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
    return rejectWithValue(
      lastErr?.response?.data?.message || lastErr?.message || "Failed to load posts"
    );
  }
);

const initialState = {
  items: [],
  bySection: [],
  bySectionLoading: false,
  bySectionError: null,
  sectionPosts: [],
  sectionPostsLoading: false,
  sectionPostsError: null,
  activeSectionSlug: null,
  currentPost: null,
  postLoading: false,
  postError: null,
  total: 0,
  page: 1,
  limit: 10,
  loading: false,
  error: null,
};

const postsSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchPostsBySection
      .addCase(fetchPostsBySection.pending, (state) => {
        state.bySectionLoading = true;
        state.bySectionError = null;
      })
      .addCase(fetchPostsBySection.fulfilled, (state, action) => {
        state.bySectionLoading = false;
        state.bySection = action.payload.data ?? action.payload;
      })
      .addCase(fetchPostsBySection.rejected, (state, action) => {
        state.bySectionLoading = false;
        state.bySectionError = action.payload;
      })

      // fetchSectionPosts
      .addCase(fetchSectionPosts.pending, (state, action) => {
        state.sectionPostsLoading = true;
        state.sectionPostsError = null;
        state.activeSectionSlug = action.meta.arg;
      })
      .addCase(fetchSectionPosts.fulfilled, (state, action) => {
        state.sectionPostsLoading = false;
        const payload = action.payload;
        state.sectionPosts = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.posts)
          ? payload.posts
          : [];
      })
      .addCase(fetchSectionPosts.rejected, (state, action) => {
        state.sectionPostsLoading = false;
        state.sectionPostsError = action.payload;
      })

      // fetchPosts
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        const arr = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.posts)
          ? payload.posts
          : [];
        state.items = arr;
        state.total = payload?.total ?? arr.length;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchPostBySlug
      .addCase(fetchPostBySlug.pending, (state) => {
        state.postLoading = true;
        state.postError = null;
      })
      .addCase(fetchPostBySlug.fulfilled, (state, action) => {
        state.postLoading = false;
        state.currentPost = action.payload.data ?? action.payload;
      })
      .addCase(fetchPostBySlug.rejected, (state, action) => {
        state.postLoading = false;
        state.postError = action.payload;
      });
  },
});

export default postsSlice.reducer;
