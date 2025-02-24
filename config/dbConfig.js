const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables from .env file

const dbConfig = {
    host: process.env.DB_HOST, // Use host from .env file
    user: process.env.DB_USER, // Use user
    password: process.env.DB_PASSWORD, // Use password
    database: process.env.DB_NAME, // Use database name
};

async function connect() {
    try {
        console.log('Connecting to database with config:', dbConfig); // Add logging
        const connection = await mysql.createConnection(dbConfig);
        console.log('Database connected successfully');
        return connection;
    } catch (error) {
        console.error('Database connection failed:', error);
        throw error;
    }
}

module.exports = { connect };
