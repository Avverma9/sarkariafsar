import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { baseUrl } from "../../lib/baseUrl";
import { getCache, setCache, fetchWithTimeout } from "../../lib/sessionCache";

// GET /schemes/slug/:slug
export const fetchSchemeBySlug = createAsyncThunk(
  "schemes/fetchSchemeBySlug",
  async (slug, { rejectWithValue }) => {
    const cacheKey = `sarkari_scheme_slug_${slug}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;
    try {
      const res = await fetchWithTimeout(`${baseUrl}/schemes/slug/${encodeURIComponent(slug)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCache(cacheKey, data);
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// GET /schemes/getSchemeStateNameOnly
export const fetchSchemeStateNames = createAsyncThunk(
  "schemes/fetchSchemeStateNames",
  async (_, { rejectWithValue }) => {
    const cacheKey = "sarkari_scheme_state_names";
    const cached = getCache(cacheKey);
    if (cached) return cached;
    try {
      const res = await fetchWithTimeout(`${baseUrl}/schemes/getSchemeStateNameOnly`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCache(cacheKey, data);
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// GET /schemes/getSchemeByState?state=...&page=...&limit=...
export const fetchSchemesByState = createAsyncThunk(
  "schemes/fetchSchemesByState",
  async (params = {}, { rejectWithValue }) => {
    const cacheKey = `sarkari_schemes_state_${params.state || ""}_${params.page || 1}_${params.limit || 24}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;
    try {
      const url = new URL(`${baseUrl}/schemes/getSchemeByState`);
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

// GET /schemes with optional filters/pagination
export const fetchSchemes = createAsyncThunk(
  "schemes/fetchSchemes",
  async (params = {}, { rejectWithValue }) => {
    const cacheKey = `sarkari_schemes_${params.page || 1}_${params.limit || 24}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;
    try {
      const url = new URL(`${baseUrl}/schemes`);
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

const initialState = {
  items: [],
  total: 0,
  page: 1,
  limit: 10,
  currentScheme: null,
  stateNames: [],
  schemesByState: [],
  loading: false,
  error: null,
};

const schemesSlice = createSlice({
  name: "schemes",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchSchemes
      .addCase(fetchSchemes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSchemes.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data ?? action.payload;
        state.total = action.payload.total ?? state.items.length;
        state.page = action.payload.page ?? 1;
        state.limit = action.payload.limit ?? 10;
      })
      .addCase(fetchSchemes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchSchemeBySlug
      .addCase(fetchSchemeBySlug.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSchemeBySlug.fulfilled, (state, action) => {
        state.loading = false;
        state.currentScheme = action.payload.data ?? action.payload;
      })
      .addCase(fetchSchemeBySlug.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchSchemeStateNames
      .addCase(fetchSchemeStateNames.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSchemeStateNames.fulfilled, (state, action) => {
        state.loading = false;
        state.stateNames = action.payload.data ?? action.payload;
      })
      .addCase(fetchSchemeStateNames.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchSchemesByState
      .addCase(fetchSchemesByState.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSchemesByState.fulfilled, (state, action) => {
        state.loading = false;
        state.schemesByState = action.payload.data ?? action.payload;
        state.total = action.payload.total ?? state.schemesByState.length;
        state.page = action.payload.page ?? 1;
        state.limit = action.payload.limit ?? 10;
      })
      .addCase(fetchSchemesByState.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default schemesSlice.reducer;
