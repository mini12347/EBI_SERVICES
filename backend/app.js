const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const connectDB = require('./config/db');
const routes = require('./routes');

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'EBI service API is running',
        database: global.__dbConnected ? 'connected' : 'degraded',
    });
});

app.use('/api', routes);

const PORT = process.env.PORT || 5001;

const startServer = async () => {
    global.__dbConnected = await connectDB();

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Database status: ${global.__dbConnected ? 'connected' : 'degraded mode'}`);
    });
};

startServer();
