require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const connectToDatabase = require('./database');

// App constants
const PORT = process.env['PORT'] || 3000;

// Express instance and middlewares
const app = express();
app.use(bodyParser.json());

// Register routers
app.use('/api/v1/auth/', require('./routes/auth'));

const startApp = async () => {
    try {
        // Connect to mongoDb
        await connectToDatabase();
        console.log('Successfully connected to database');

        // Start server
        app.listen(PORT, ()=> {
            console.log(`App is running on: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server: ', error);
        process.exit(1);
    }
}

startApp();
