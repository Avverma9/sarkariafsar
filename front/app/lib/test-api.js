
import { getAllBlogPosts } from './blogs.js';
import baseUrl from './baseUrl.js';



async function runTest() {
  try {
    const posts = await getAllBlogPosts();
  } catch (error) {
    console.error('Error fetching posts:', error);
  }
}

runTest();
