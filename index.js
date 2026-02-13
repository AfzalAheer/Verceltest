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

        // 1. NEON DASHBOARD UI (PUBG WOW Style)
        if (req.url === '/' || req.url === '/dashboard') {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            return res.end(`
                <body style="background:#0a0a0a; color:#00f2ff; font-family:sans-serif; text-align:center; padding:50px;">
                    <div style="border:2px solid #00f2ff; border-radius:15px; padding:30px; display:inline-block; box-shadow:0 0 20px #00f2ff;">
                        <h1>ELITE FB DASHBOARD PRO</h1>
                        <p style="color:#39FF14;">TUNNEL STATUS: RESIDENTIAL ACTIVE ✅</p>
                        <a href="/login?profile=android_pro" style="background:#00f2ff; color:#000; padding:15px 30px; text-decoration:none; font-weight:bold; border-radius:5px; display:block; margin:10px;">LAUNCH FB (PROFILE 1)</a>
                        <a href="/login?profile=iphone_elite" style="background:#00f2ff; color:#000; padding:15px 30px; text-decoration:none; font-weight:bold; border-radius:5px; display:block; margin:10px;">LAUNCH FB (PROFILE 2)</a>
                        <p style="font-size:10px; color:#555;">Variable Pin: 10.80.144.64</p>
                    </div>
                </body>
            `);
        }

        // 2. ANTI-LOOP PROXY LOGIC
        const profileUAs = {
            'android_pro': 'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36',
            'iphone_elite': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
        };

        const urlParams = new URL(req.url, `http://${req.headers.host}`).searchParams;
        const profile = urlParams.get('profile') || 'android_pro';

        const options = {
            hostname: 'www.facebook.com',
            port: 443,
            path: req.url.startsWith('/login') ? '/' : req.url,
            method: req.method,
            headers: {
                ...req.headers,
                'host': 'www.facebook.com',
                'referer': 'https://www.facebook.com/',
                'X-Forwarded-For': '10.80.144.64', // Residential IP
                'User-Agent': profileUAs[profile] || profileUAs['android_pro']
            }
        };

        const proxyReq = https.request(options, (pRes) => {
            let resHeaders = { ...pRes.headers };

            // REFRESH BYPASS: Location header ko link se fix karna
            if (resHeaders['location']) {
                resHeaders['location'] = resHeaders['location'].replace('https://www.facebook.com', `https://${req.headers.host}`);
            }

            // ADVANCED COOKIE MASKING: Loop ko khatam karne ke liye
            if (resHeaders['set-cookie']) {
                resHeaders['set-cookie'] = resHeaders['set-cookie'].map(c => {
                    return c.replace(/domain=\.facebook\.com/gi, `domain=${req.headers.host}`)
                            .replace(/secure/gi, '') // SSL mismatch hatane ke liye
                            .replace(/SameSite=None/gi, 'SameSite=Lax');
                });
            }

            res.writeHead(pRes.statusCode, resHeaders);
            pRes.pipe(res);
        });

        proxyReq.on('error', () => res.end());
        req.pipe(proxyReq);
    });

    server.listen(PORT, () => console.log("Elite Anti-Refresh Proxy Online"));
}