import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { baseUrl } from "../../lib/baseUrl";
import { getCache, setCache } from "../../lib/sessionCache";
import axios from "axios";

export const fetchStats = createAsyncThunk(
  "stats/fetchStats",
  async (_, { rejectWithValue }) => {
    const cacheKey = "sarkari_stats";
    const cached = getCache(cacheKey);
    if (cached) return cached;
    try {
      const [schemes, blogs, posts] = await Promise.all([
        axios.get(`${baseUrl}/stats/schemes`, { timeout: 15000 }),
        axios.get(`${baseUrl}/stats/blogs`, { timeout: 15000 }),
        axios.get(`${baseUrl}/stats/posts`, { timeout: 15000 }),
      ]);
      const data = {
        schemes: schemes.data?.count ?? schemes.data?.total ?? 0,
        blogs: blogs.data?.count ?? blogs.data?.total ?? 0,
        posts: posts.data?.count ?? posts.data?.total ?? 0,
      };
      setCache(cacheKey, data);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// GET /stats/posts/advanced -> { total, byOrganization: [{ organization, count }] }
export const fetchPostsAdvanced = createAsyncThunk(
  "stats/fetchPostsAdvanced",
  async (_, { rejectWithValue }) => {
    const cacheKey = "sarkari_posts_advanced";
    const cached = getCache(cacheKey);
    if (cached) return cached;
    try {
      const { data } = await axios.get(`${baseUrl}/stats/posts/advanced`, { timeout: 15000 });
      // normalize to simple shape
      const payload = {
        total: data?.total ?? 0,
        byOrganization: Array.isArray(data?.byOrganization) ? data.byOrganization : [],
      };
      setCache(cacheKey, payload);
      return payload;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const statsSlice = createSlice({
  name: "stats",
  initialState: {
    schemes: null,
    blogs: null,
    posts: null,
    postsAdvancedTotal: null,
    postsByOrganization: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.loading = false;
        state.schemes = action.payload.schemes;
        state.blogs = action.payload.blogs;
        state.posts = action.payload.posts;
      })
      .addCase(fetchStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
    builder
      .addCase(fetchPostsAdvanced.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPostsAdvanced.fulfilled, (state, action) => {
        state.loading = false;
        state.postsAdvancedTotal = action.payload.total;
        state.postsByOrganization = action.payload.byOrganization;
      })
      .addCase(fetchPostsAdvanced.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default statsSlice.reducer;
export { fetchPostsAdvanced };
