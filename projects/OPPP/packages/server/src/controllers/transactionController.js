const { db, dbType } = require('../config/database');

const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, user_id, status } = req.query;
    const offset = (page - 1) * limit;

    let query;
    let params = [];
    let paramCount = 1;

    if (dbType === 'postgres') {
      query = 'SELECT * FROM transactions';
      const conditions = [];

      if (user_id) {
        conditions.push(`user_id = $${paramCount++}`);
        params.push(user_id);
      }
      if (status) {
        conditions.push(`status = $${paramCount++}`);
        params.push(status);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
      params.push(limit, offset);

      const result = await db.query(query, params);
      return res.json({
        transactions: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.rows.length
        }
      });
    } else if (dbType === 'mysql') {
      const connection = await db.createConnection();
      query = 'SELECT * FROM transactions';
      const conditions = [];

      if (user_id) {
        conditions.push('user_id = ?');
        params.push(user_id);
      }
      if (status) {
        conditions.push('status = ?');
        params.push(status);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      const [rows] = await connection.execute(query, params);
      await connection.end();

      return res.json({
        transactions: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: rows.length
        }
      });
    }
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    let result;

    if (dbType === 'postgres') {
      result = await db.query('SELECT * FROM transactions WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      return res.json(result.rows[0]);
    } else if (dbType === 'mysql') {
      const connection = await db.createConnection();
      const [rows] = await connection.execute('SELECT * FROM transactions WHERE id = ?', [id]);
      await connection.end();

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      return res.json(rows[0]);
    }
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
};

const createTransaction = async (req, res) => {
  try {
    const { user_id, transaction_hash, block_number, amount, token_address, transaction_type, status = 'pending' } = req.body;

    if (!transaction_hash) {
      return res.status(400).json({ error: 'Transaction hash is required' });
    }

    let result;

    if (dbType === 'postgres') {
      result = await db.query(
        'INSERT INTO transactions (user_id, transaction_hash, block_number, amount, token_address, transaction_type, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [user_id, transaction_hash, block_number, amount, token_address, transaction_type, status]
      );
      return res.status(201).json(result.rows[0]);
    } else if (dbType === 'mysql') {
      const connection = await db.createConnection();
      const [insertResult] = await connection.execute(
        'INSERT INTO transactions (user_id, transaction_hash, block_number, amount, token_address, transaction_type, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [user_id, transaction_hash, block_number, amount, token_address, transaction_type, status]
      );

      const [rows] = await connection.execute(
        'SELECT * FROM transactions WHERE id = ?',
        [insertResult.insertId]
      );
      await connection.end();

      return res.status(201).json(rows[0]);
    }
  } catch (error) {
    console.error('Error creating transaction:', error);
    if (error.code === '23505' || error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Transaction hash already exists' });
    }
    res.status(500).json({ error: 'Failed to create transaction' });
  }
};

const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { block_number, amount, status } = req.body;

    if (!block_number && !amount && !status) {
      return res.status(400).json({ error: 'At least one field must be provided for update' });
    }

    let result;

    if (dbType === 'postgres') {
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (block_number) {
        updates.push(`block_number = $${paramCount++}`);
        values.push(block_number);
      }
      if (amount) {
        updates.push(`amount = $${paramCount++}`);
        values.push(amount);
      }
      if (status) {
        updates.push(`status = $${paramCount++}`);
        values.push(status);
      }

      values.push(id);

      result = await db.query(
        `UPDATE transactions SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      return res.json(result.rows[0]);
    } else if (dbType === 'mysql') {
      const connection = await db.createConnection();
      const updates = [];
      const values = [];

      if (block_number) {
        updates.push('block_number = ?');
        values.push(block_number);
      }
      if (amount) {
        updates.push('amount = ?');
        values.push(amount);
      }
      if (status) {
        updates.push('status = ?');
        values.push(status);
      }

      values.push(id);

      const [updateResult] = await connection.execute(
        `UPDATE transactions SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      if (updateResult.affectedRows === 0) {
        await connection.end();
        return res.status(404).json({ error: 'Transaction not found' });
      }

      const [rows] = await connection.execute(
        'SELECT * FROM transactions WHERE id = ?',
        [id]
      );
      await connection.end();

      return res.json(rows[0]);
    }
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    let result;

    if (dbType === 'postgres') {
      result = await db.query('DELETE FROM transactions WHERE id = $1 RETURNING id', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
    } else if (dbType === 'mysql') {
      const connection = await db.createConnection();
      const [deleteResult] = await connection.execute('DELETE FROM transactions WHERE id = ?', [id]);
      await connection.end();

      if (deleteResult.affectedRows === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
    }

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
};

module.exports = {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction
};