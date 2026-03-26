const http = require('http');

function request(path) {
  return new Promise((resolve) => {
    const options = { hostname: 'localhost', port: 5000, path, method: 'GET' };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e){ resolve(null); }
      });
    });
    req.on('error', (err) => resolve(null));
    req.end();
  });
}

(async () => {
  const res = await request('/api/post/get-posts-with-section?page=1&limit=1');
  if (!res) return console.log('No response');
  const item = res.data && res.data[0];
  if (!item) return console.log('No data item');
  console.log('Has section:', !!item.section);
  console.log('Has sectionPosts:', Array.isArray(item.sectionPosts));
  console.log('sectionPosts length:', item.sectionPosts ? item.sectionPosts.length : 0);
})();
