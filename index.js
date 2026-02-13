const http = require('http');
const https = require('https');
const cluster = require('cluster');

const PORT = process.env.PORT || 8000;

if (cluster.isPrimary) {
    cluster.fork();
    cluster.on('exit', () => cluster.fork());
} else {
    const server = http.createServer((req, res) => {
        if (req.url === '/health') return res.end('HEALTHY');

        const options = {
            hostname: 'www.facebook.com',
            port: 443,
            path: req.url,
            method: req.method,
            headers: {
                ...req.headers,
                'host': 'www.facebook.com',
                // Sabse zaroori pin: Mobile Residential Signal simulate karna
                'X-Forwarded-For': '10.80.144.64', 
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        };

        const proxyReq = https.request(options, (proxyRes) => {
            // Cookie Rewriting taaki Facebook session ko block na kare
            let resHeaders = { ...proxyRes.headers };
            if (resHeaders['set-cookie']) {
                resHeaders['set-cookie'] = resHeaders['set-cookie'].map(c => 
                    c.replace(/\.facebook\.com/g, req.headers.host)
                );
            }
            res.writeHead(proxyRes.statusCode, resHeaders);
            proxyRes.pipe(res);
        });

        proxyReq.on('error', () => {
            if (!res.headersSent) { res.writeHead(502); res.end('Tunnel Error'); }
        });

        req.pipe(proxyReq);
    });

    server.listen(PORT, () => console.log("Residential Tunnel Active"));
}