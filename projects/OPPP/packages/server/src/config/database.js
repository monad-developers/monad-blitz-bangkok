const { Pool } = require('pg');
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbType = process.env.DATABASE_TYPE || 'postgres';

let db;

if (dbType === 'postgres') {
  db = new Pool({
    user: process.env.DATABASE_USER,
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE_NAME,
    password: process.env.DATABASE_PASSWORD,
    port: process.env.DATABASE_PORT,
  });
} else if (dbType === 'mysql') {
  const createConnection = async () => {
    return await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      port: process.env.MYSQL_PORT
    });
  };
  db = { createConnection };
}

const testConnection = async () => {
  try {
    if (dbType === 'postgres') {
      const client = await db.connect();
      console.log('✅ PostgreSQL connected successfully');
      client.release();
    } else if (dbType === 'mysql') {
      const connection = await db.createConnection();
      console.log('✅ MySQL connected successfully');
      await connection.end();
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
};

module.exports = { db, testConnection, dbType };