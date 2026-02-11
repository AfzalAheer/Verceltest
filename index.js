const http = require('http');

const PORT = process.env.PORT || 8000;

const server = http.createServer((req, res) => {
    // Ye Headers Facebook ke security bots ko dhoka dene ke liye hain
    res.writeHead(200, { 
        'Content-Type': 'text/html; charset=UTF-8',
        'X-Frame-Options': 'SAMEORIGIN',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=()',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Server': 'Apache/2.4.52 (Ubuntu)', // Fake Server Signature
        'Set-Cookie': 'session_id=usa_secure_gate_' + Math.random().toString(36).substring(7) + '; HttpOnly; Secure'
    });
    
    // Facebook Bot Bypass HTML
    res.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dashboard - WorkSpace</title>
        <style>
            body { background-color: #f4f7f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
            .container { background: #fff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); text-align: center; width: 350px; }
            .status { color: #2ecc71; font-weight: bold; font-size: 18px; }
            .location { color: #7f8c8d; font-size: 14px; margin-top: 10px; }
            .secure-badge { background: #e8f5e9; color: #2e7d32; padding: 5px 15px; border-radius: 20px; font-size: 12px; display: inline-block; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2 style="color: #2c3e50;">Secure Access</h2>
            <p class="status">● Connection Encrypted</p>
            <p class="location">Node Location: <b>Washington, D.C., USA</b></p>
            <div class="secure-badge">Verified USA Resident IP</div>
            <p style="font-size: 10px; color: #bdc3c7; margin-top: 30px;">ID: ${Math.floor(Math.random() * 99999999)}</p>
        </div>
    </body>
    </html>
    `);
    res.end();
});

server.listen(PORT, () => {
    console.log(`Stealth Proxy Engine Active on USA Port ${PORT}`);
});