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

        // Dynamic URL Logic: Link ke baad wali site uthana
        let target;
        try {
            // Agar link.app/https://whoer.net likha ho
            target = new URL(req.url.substring(1));
        } catch (e) {
            // Default agar kuch na likha ho
            target = new URL('https://www.facebook.com');
        }

        const options = {
            hostname: target.hostname,
            port: 443,
            path: target.pathname + target.search,
            method: req.method,
            headers: {
                ...req.headers,
                'host': target.hostname,
                'X-Forwarded-For': '10.80.144.64', // Aapki Every Proxy IP
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        };

        const proxyReq = https.request(options, (proxyRes) => {
            let resHeaders = { ...proxyRes.headers };
            // Domain masking taaki login error na aaye
            if (resHeaders['set-cookie']) {
                resHeaders['set-cookie'] = resHeaders['set-cookie'].map(c => 
                    c.replace(new RegExp(target.hostname, 'g'), req.headers.host)
                );
            }
            res.writeHead(proxyRes.statusCode, resHeaders);
            proxyRes.pipe(res);
        });

        proxyReq.on('error', () => {
            if (!res.headersSent) { res.writeHead(502); res.end('Proxy Route Error'); }
        });

        req.pipe(proxyReq);
    });

    server.listen(PORT, () => console.log("Global Stealth Active"));
}