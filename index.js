package-lock.jsonconst http = require('http');
const https = require('https');
const cluster = require('cluster');
const os = require('os');

const PORT = process.env.PORT || 8000;
const TARGET_HOST = 'www.facebook.com';
const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
console.log([ELITE MASTER] Forking ${numCPUs} workers...);
for (let i = 0; i < numCPUs; i++) cluster.fork();
cluster.on('exit', (worker) => cluster.fork());
} else {
// 1. Performance Agent
const keepAliveAgent = new https.Agent({ keepAlive: true, maxSockets: 150 });

// 2. Rolling Window Circuit Breaker  
let failureTimestamps = [];  
const FAILURE_WINDOW = 30000;  
const FAILURE_THRESHOLD = 10;  
let isCircuitOpen = false;  

const recordFailure = () => {  
    const now = Date.now();  
    failureTimestamps = failureTimestamps.filter(ts => now - ts < FAILURE_WINDOW);  
    failureTimestamps.push(now);  
    if (failureTimestamps.length >= FAILURE_THRESHOLD) {  
        isCircuitOpen = true;  
        setTimeout(() => { isCircuitOpen = false; failureTimestamps = []; }, 30000);  
    }  
};  

// 3. Rate Limit with Memory Cleanup  
const ipCounts = new Map();  
setInterval(() => {  
    const now = Date.now();  
    ipCounts.forEach((timestamps, ip) => {  
        const fresh = timestamps.filter(ts => now - ts < 60000);  
        if (fresh.length === 0) ipCounts.delete(ip);  
        else ipCounts.set(ip, fresh);  
    });  
}, 60000);  

const server = http.createServer({ maxHeaderSize: 16384 }, (req, res) => {  
    const start = Date.now();  
    if (req.url === '/health') { res.writeHead(200); return res.end('HEALTHY'); }  
    if (isCircuitOpen) { res.writeHead(503); return res.end('Circuit Open: Stability Mode'); }  

    // 4. Header Sanitization (Hop-by-hop remove karna)  
    const cleanHeaders = { ...req.headers };  
    ['connection', 'keep-alive', 'transfer-encoding', 'proxy-authenticate', 'te', 'upgrade'].forEach(h => delete cleanHeaders[h]);  
      
    const options = {  
        hostname: TARGET_HOST,  
        port: 443,  
        path: req.url,  
        method: req.method,  
        agent: keepAliveAgent,  
        headers: {  
            ...cleanHeaders,  
            'host': TARGET_HOST,  
            'X-Forwarded-For': `66.249.66.${Math.floor(Math.random() * 255)}`,  
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'  
        }  
    };  

    const proxyReq = https.request(options, (proxyRes) => {  
        res.writeHead(proxyRes.statusCode, proxyRes.headers);  
        proxyRes.pipe(res);  
        // 5. Backpressure Protection  
        proxyRes.on('error', () => res.destroy());  
        console.log(`[LOG] ${req.method} ${req.url} -> ${proxyRes.statusCode} (${Date.now() - start}ms)`);  
    });  

    proxyReq.on('error', (err) => {  
        recordFailure();  
        if (!res.headersSent) { res.writeHead(502); res.end('Gateway Error'); }  
    });  

    proxyReq.setTimeout(15000, () => proxyReq.destroy());  
    req.on('aborted', () => proxyReq.destroy());  
    req.pipe(proxyReq);  
});  

// 6. Client Error Handling (Malformed Request Protection)  
server.on('clientError', (err, socket) => {  
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');  
});  

// 7. SIGTERM for Cloud Platforms  
const shutdown = () => server.close(() => process.exit(0));  
process.on('SIGINT', shutdown);  
process.on('SIGTERM', shutdown);  

server.listen(PORT, () => console.log(`[WORKER ${process.pid}] Engine Elite Active`));

}