const http = require('http');

const host = 'localhost';
const port = 5000;
const endpoints = [
  '/api/schemes',
  '/api/schemes/getSchemeStateNameOnly',
  '/api/post',
  '/api/blog'
];

function request(path) {
  return new Promise((resolve) => {
    const options = { hostname: host, port, path, method: 'GET' };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({ path, statusCode: res.statusCode, body: data });
      });
    });
    req.on('error', (err) => {
      resolve({ path, error: String(err) });
    });
    req.end();
  });
}

(async () => {
  for (const ep of endpoints) {
    const result = await request(ep);
    console.log('===', ep, '===');
    if (result.error) {
      console.log('ERROR:', result.error);
    } else {
      console.log('STATUS:', result.statusCode);
      const body = result.body || '';
      try {
        const parsed = JSON.parse(body);
        console.log(JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log(body.slice(0, 2000));
      }
    }
    console.log('\n');
  }
})();
