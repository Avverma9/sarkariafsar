const http = require('http');

const host = 'localhost';
const port = 5000;

function request(path, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const dataStr = body ? JSON.stringify(body) : null;
    const options = {
      hostname: host,
      port,
      path,
      method,
      headers: dataStr
        ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(dataStr) }
        : undefined,
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(data); } catch (e) { parsed = data; }
        resolve({ statusCode: res.statusCode, body: parsed });
      });
    });
    req.on('error', (err) => {
      resolve({ error: String(err) });
    });
    if (dataStr) req.write(dataStr);
    req.end();
  });
}

(async () => {
  const timestamp = Date.now();
  const results = [];

  // 1) Create a scheme
  const schemeBody = { data: { schemeTitle: `smoke-scheme-${timestamp}`, schemetype: 'test', state: 'TestState' } };
  const schemeCreate = await request('/api/schemes/add', 'POST', schemeBody);
  results.push({ endpoint: '/api/schemes/add', result: schemeCreate });
  let schemeId = null;
  if (schemeCreate && schemeCreate.body && schemeCreate.body.data && schemeCreate.body.data._id) schemeId = schemeCreate.body.data._id;

  // 2) Create a job post
  const postBody = { data: { title: `smoke-post-${timestamp}`, category: 'test', slug: `smoke-post-${timestamp}` } };
  const postCreate = await request('/api/post/add', 'POST', postBody);
  results.push({ endpoint: '/api/post/add', result: postCreate });
  let postId = null;
  if (postCreate && postCreate.body && postCreate.body.data && postCreate.body.data._id) postId = postCreate.body.data._id;

  // 3) Create a blog
  const blogBody = { data: { slug: `smoke-blog-${timestamp}`, title: `smoke-blog-${timestamp}`, excerpt: 'test', author: 'tester', category: 'test', intro: 'intro' } };
  const blogCreate = await request('/api/blog/add', 'POST', blogBody);
  results.push({ endpoint: '/api/blog/add', result: blogCreate });
  let blogId = null;
  if (blogCreate && blogCreate.body && blogCreate.body.data && blogCreate.body.data._id) blogId = blogCreate.body.data._id;

  // Print create results
  console.log('CREATE RESULTS:');
  console.log(JSON.stringify(results, null, 2));

  // Cleanup: delete created docs where possible
  const deletions = [];
  if (schemeId) {
    const del = await request(`/api/schemes/${schemeId}`, 'DELETE');
    deletions.push({ endpoint: `/api/schemes/${schemeId}`, result: del });
  }
  if (postId) {
    const del = await request(`/api/post/id/${postId}`, 'DELETE');
    deletions.push({ endpoint: `/api/post/id/${postId}`, result: del });
  }
  if (blogId) {
    const del = await request(`/api/blog/id/${blogId}`, 'DELETE');
    deletions.push({ endpoint: `/api/blog/id/${blogId}`, result: del });
  }

  console.log('DELETE RESULTS:');
  console.log(JSON.stringify(deletions, null, 2));

})();
