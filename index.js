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

        let target;
        try {
            // URL format: app.koyeb.app/https://whoer.net
            target = new URL(req.url.substring(1));
        } catch (e) {
            target = new URL('https://www.facebook.com');
        }

        const cleanHeaders = { ...req.headers };
        // Purane headers saaf karna taaki leak na ho
        ['host', 'connection', 'keep-alive', 'proxy-authenticate', 'te', 'upgrade'].forEach(h => delete cleanHeaders[h]);

        const options = {
            hostname: target.hostname,
            port: 443,
            path: target.pathname + target.search,
            method: req.method,
            headers: {
                ...cleanHeaders,
                'host': target.hostname,
                'X-Forwarded-For': '10.80.144.64', // Aapki Every Proxy IP
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://www.google.com/', // Dhoka dene ke liye
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'cross-site',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Upgrade-Insecure-Requests': '1'
            },
            // High security sites ke liye timeout
            timeout: 15000 
        };

        const proxyReq = https.request(options, (proxyRes) => {
            let resHeaders = { ...proxyRes.headers };
            
            // Cookie Domain Masking
            if (resHeaders['set-cookie']) {
                resHeaders['set-cookie'] = resHeaders['set-cookie'].map(c => 
                    c.replace(new RegExp(target.hostname, 'g'), req.headers.host)
                );
            }
            
            // Pro Security Headers Injection
            resHeaders['X-Frame-Options'] = 'SAMEORIGIN';
            resHeaders['X-Content-Type-Options'] = 'nosniff';

            res.writeHead(proxyRes.statusCode, resHeaders);
            proxyRes.pipe(res);
        });

        proxyReq.on('error', (e) => {
            if (!res.headersSent) {
                res.writeHead(502);
                res.end('Stealth Route Failed: ' + e.message);
            }
        });

        req.pipe(proxyReq);
    });

    server.listen(PORT, () => console.log("Elite Stealth Mode Active"));
}