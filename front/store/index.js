import { configureStore } from "@reduxjs/toolkit";
import postsReducer from "./slices/postsSlice";
import schemesReducer from "./slices/schemesSlice";
import blogReducer from "./slices/blogSlice";

export const store = configureStore({
  reducer: {
    posts: postsReducer,
    schemes: schemesReducer,
    blog: blogReducer,
  },
});
