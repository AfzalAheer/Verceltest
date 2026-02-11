const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 8000;

// 1. Logging (Professional Monitoring)
app.use(morgan('combined'));

// 2. Helmet with full CSP (Content Security Policy) protection
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            "default-src": ["'self'"],
            "script-src": ["'self'", "'unsafe-inline'"],
            "style-src": ["'self'", "'unsafe-inline'"],
            "img-src": ["'self'", "data:", "https:"],
        },
    },
}));

// 3. Rate Limiting (Abuse Prevention)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per window
    message: "Too many requests, please try again later."
});
app.use(limiter);

// 4. CORS properly configured
const corsOptions = {
    origin: '*', // Production mein isse apne domain par restrict karein
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

// 5. Secure Route with Error Handling
app.get('/', (req, res) => {
    try {
        res.status(200).json({
            status: "Secure Professional Gateway Active",
            location: "Washington, D.C. Cluster",
            protection: "Active (Helmet, Rate-Limit, CORS)",
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 6. 404 & Global Error Handling
app.use((req, res) => res.status(404).json({ error: "Route Not Found" }));

app.listen(PORT, () => {
    console.log(`[SECURE] Server running on port ${PORT}`);
});
