const http = require('http');

function request(path) {
  return new Promise((resolve) => {
    const options = { hostname: 'localhost', port: 5000, path, method: 'GET' };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch(e){ resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', (err) => resolve({ error: String(err) }));
    req.end();
  });
}

(async () => {
  const res = await request('/api/post/get-posts-with-section?page=1&limit=5');
  console.log(JSON.stringify(res, null, 2));
})();
