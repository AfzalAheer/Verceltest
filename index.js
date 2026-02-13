const http = require('http');
const https = require('https');
const cluster = require('cluster');
const os = require('os');

const PORT = process.env.PORT || 8000;
const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
    console.log(`[ELITE MASTER] Active. Forking ${numCPUs} Workers...`);
    for (let i = 0; i < numCPUs; i++) cluster.fork();
    cluster.on('exit', () => {
        console.log('[LOGIC CONTROL] Worker died. Rebooting...');
        cluster.fork();
    });
} else {
    const keepAliveAgent = new https.Agent({ keepAlive: true, maxSockets: 200 });
    
    // AdsPower Style Profile Library (Variables)
    const profiles = {
        'android_pro': { 
            ua: 'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36', 
            platform: 'Android',
            vendor: 'Google Inc.'
        },
        'iphone_elite': { 
            ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', 
            platform: 'iOS',
            vendor: 'Apple Computer, Inc.'
        },
        'windows_stealth': { 
            ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36', 
            platform: 'Windows',
            vendor: 'Google Inc.'
        }
    };

    const server = http.createServer({ maxHeaderSize: 16384 }, (req, res) => {
        const start = Date.now();

        // 1. UI DASHBOARD (Neon Blue/Metallic Style)
        if (req.url === '/' || req.url === '/dashboard') {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            return res.end(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Elite FB Masker Pro</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        body { background-color: #0a0a0a; color: #00f2ff; font-family: 'Segoe UI', sans-serif; margin: 0; padding: 20px; }
                        .container { max-width: 600px; margin: auto; border: 2px solid #00f2ff; border-radius: 15px; padding: 20px; box-shadow: 0 0 20px #00f2ff; background: rgba(0, 242, 255, 0.05); }
                        h1 { text-shadow: 0 0 10px #00f2ff; border-bottom: 1px solid #00f2ff; padding-bottom: 10px; }
                        .status-box { background: #111; padding: 10px; border-radius: 5px; border-left: 5px solid #39FF14; margin-bottom: 20px; }
                        .profile-card { background: #1a1a1a; padding: 15px; border-radius: 10px; margin-bottom: 15px; border: 1px solid #333; transition: 0.3s; }
                        .profile-card:hover { border-color: #00f2ff; }
                        .btn { background: #00f2ff; color: #000; padding: 12px 25px; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; text-decoration: none; display: inline-block; width: 100%; box-sizing: border-box; text-align: center; }
                        .footer { font-size: 12px; color: #555; margin-top: 30px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>ADS-POWER PRO MASK</h1>
                        <div class="status-box">
                            System Status: <span style="color:#39FF14;">ONLINE (Worker ${process.pid})</span><br>
                            Residential IP: <span style="color:#00f2ff;">10.80.144.64</span>
                        </div>
                        
                        <div class="profile-card">
                            <h3>Profile 1: Android Pro</h3>
                            <p>SM-S918B (S23 Ultra) Fingerprint</p>
                            <a href="/login?profile=android_pro" class="btn">LAUNCH FACEBOOK</a>
                        </div>

                        <div class="profile-card">
                            <h3>Profile 2: iPhone Elite</h3>
                            <p>iPhone 15 Pro Max Fingerprint</p>
                            <a href="/login?profile=iphone_elite" class="btn">LAUNCH FACEBOOK</a>
                        </div>

                        <div class="profile-card">
                            <h3>Profile 3: Windows Stealth</h3>
                            <p>Desktop PC Masking (Anti-Bot)</p>
                            <a href="/login?profile=windows_stealth" class="btn">LAUNCH FACEBOOK</a>
                        </div>

                        <div class="footer">
                            PUBG WOW 2026 Editor Schema | Logic Control v4.0
                        </div>
                    </div>
                </body>
                </html>
            `);
        }

        // 2. HEALTH CHECK
        if (req.url === '/health') {
            res.writeHead(200);
            return res.end('HEALTHY');
        }

        // 3. PROXY LOGIC WITH DYNAMIC FINGERPRINTING
        const urlParams = new URL(req.url, `http://${req.headers.host}`).searchParams;
        const profileId = urlParams.get('profile') || 'android_pro';
        const activeProfile = profiles[profileId] || profiles['android_pro'];

        const targetOptions = {
            hostname: 'www.facebook.com',
            port: 443,
            path: req.url.startsWith('/login') ? '/' : req.url,
            method: req.method,
            agent: keepAliveAgent,
            headers: {
                ...req.headers,
                'host': 'www.facebook.com',
                'X-Forwarded-For': '10.80.144.64', // Residential Signal Pin
                'User-Agent': activeProfile.ua,
                'Accept-Language': 'en-US,en;q=0.9',
                'sec-ch-ua-platform': `"${activeProfile.platform}"`,
                'sec-ch-ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
                'Referer': 'https://www.google.com/'
            }
        };

        const proxyReq = https.request(targetOptions, (proxyRes) => {
            let resHeaders = { ...proxyRes.headers };

            // Manual Helmet Security Injection
            resHeaders['X-Content-Type-Options'] = 'nosniff';
            resHeaders['X-Frame-Options'] = 'SAMEORIGIN';
            resHeaders['Strict-Transport-Security'] = 'max-age=31536000';
            resHeaders['Content-Security-Policy'] = "default-src * 'unsafe-inline' 'unsafe-eval';";

            // Cookie Masking for Session Persistence
            if (resHeaders['set-cookie']) {
                resHeaders['set-cookie'] = resHeaders['set-cookie'].map(cookie => 
                    cookie.replace(/\.facebook\.com/g, req.headers.host)
                );
            }

            res.writeHead(proxyRes.statusCode, resHeaders);
            proxyRes.pipe(res);
            console.log(`[${profileId}] ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
        });

        proxyReq.on('error', (err) => {
            if (!res.headersSent) {
                res.writeHead(502);
                res.end('Gateway Connection Failed');
            }
        });

        // Timeout Handling
        proxyReq.setTimeout(20000, () => proxyReq.destroy());
        req.pipe(proxyReq);
    });

    server.on('clientError', (err, socket) => socket.end('HTTP/1.1 400 Bad Request\r\n\r\n'));
    server.listen(PORT, () => console.log(`[WORKER ${process.pid}] Dashboard Active`));
}