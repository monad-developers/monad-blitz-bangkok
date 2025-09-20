const { db, dbType } = require('../config/database');
const bcrypt = require('bcrypt');

const getUsers = async (req, res) => {
  try {
    let result;

    if (dbType === 'postgres') {
      result = await db.query('SELECT id, username, email, created_at FROM users ORDER BY created_at DESC');
      return res.json(result.rows);
    } else if (dbType === 'mysql') {
      const connection = await db.createConnection();
      const [rows] = await connection.execute('SELECT id, username, email, created_at FROM users ORDER BY created_at DESC');
      await connection.end();
      return res.json(rows);
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    let result;

    if (dbType === 'postgres') {
      result = await db.query('SELECT id, username, email, created_at FROM users WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.json(result.rows[0]);
    } else if (dbType === 'mysql') {
      const connection = await db.createConnection();
      const [rows] = await connection.execute('SELECT id, username, email, created_at FROM users WHERE id = ?', [id]);
      await connection.end();

      if (rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.json(rows[0]);
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

const createUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let result;

    if (dbType === 'postgres') {
      result = await db.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
        [username, email, hashedPassword]
      );
      return res.status(201).json(result.rows[0]);
    } else if (dbType === 'mysql') {
      const connection = await db.createConnection();
      const [insertResult] = await connection.execute(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        [username, email, hashedPassword]
      );

      const [rows] = await connection.execute(
        'SELECT id, username, email, created_at FROM users WHERE id = ?',
        [insertResult.insertId]
      );
      await connection.end();

      return res.status(201).json(rows[0]);
    }
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === '23505' || error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email } = req.body;

    if (!username && !email) {
      return res.status(400).json({ error: 'At least username or email must be provided' });
    }

    let result;

    if (dbType === 'postgres') {
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (username) {
        updates.push(`username = $${paramCount++}`);
        values.push(username);
      }
      if (email) {
        updates.push(`email = $${paramCount++}`);
        values.push(email);
      }

      values.push(id);

      result = await db.query(
        `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING id, username, email, updated_at`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.json(result.rows[0]);
    } else if (dbType === 'mysql') {
      const connection = await db.createConnection();
      const updates = [];
      const values = [];

      if (username) {
        updates.push('username = ?');
        values.push(username);
      }
      if (email) {
        updates.push('email = ?');
        values.push(email);
      }

      values.push(id);

      const [updateResult] = await connection.execute(
        `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        values
      );

      if (updateResult.affectedRows === 0) {
        await connection.end();
        return res.status(404).json({ error: 'User not found' });
      }

      const [rows] = await connection.execute(
        'SELECT id, username, email, updated_at FROM users WHERE id = ?',
        [id]
      );
      await connection.end();

      return res.json(rows[0]);
    }
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.code === '23505' || error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    let result;

    if (dbType === 'postgres') {
      result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
    } else if (dbType === 'mysql') {
      const connection = await db.createConnection();
      const [deleteResult] = await connection.execute('DELETE FROM users WHERE id = ?', [id]);
      await connection.end();

      if (deleteResult.affectedRows === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};