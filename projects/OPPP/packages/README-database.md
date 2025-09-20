# Database Setup with Docker

This setup provides both PostgreSQL and MySQL databases with Docker Compose for the Sonad project.

## Quick Start

1. **Start the databases:**
   ```bash
   cd packages
   docker-compose up -d
   ```

2. **Access databases:**
   - PostgreSQL: `localhost:5432`
   - MySQL: `localhost:3306`
   - Adminer (Web UI): `http://localhost:8080`

## Database Credentials

### PostgreSQL
- Database: `sonad_db`
- User: `sonad_user`
- Password: `sonad_password`
- Port: `5432`

### MySQL
- Database: `sonad_db`
- User: `sonad_user`
- Password: `sonad_password`
- Root Password: `root_password`
- Port: `3306`

## Connection Examples

### Node.js with PostgreSQL (pg)
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  user: 'sonad_user',
  host: 'localhost',
  database: 'sonad_db',
  password: 'sonad_password',
  port: 5432,
});

// Example query
async function getUsers() {
  const res = await pool.query('SELECT * FROM users');
  return res.rows;
}
```

### Node.js with MySQL (mysql2)
```javascript
const mysql = require('mysql2/promise');

const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'sonad_user',
  password: 'sonad_password',
  database: 'sonad_db',
  port: 3306
});

// Example query
async function getUsers() {
  const [rows] = await connection.execute('SELECT * FROM users');
  return rows;
}
```

## Available Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs

# Reset databases (removes all data)
docker-compose down -v
docker-compose up -d
```

## Database Schema

The initialization scripts create:
- `users` table with id, username, email, password_hash, timestamps
- `transactions` table with blockchain transaction data
- Sample data for testing

## Adminer Web Interface

Access the web-based database administration tool at `http://localhost:8080`

**Login credentials:**
- System: PostgreSQL or MySQL
- Server: postgres or mysql (container names)
- Username: sonad_user
- Password: sonad_password
- Database: sonad_db