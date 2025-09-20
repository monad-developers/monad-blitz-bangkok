-- MySQL initialization script
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    transaction_hash VARCHAR(66) UNIQUE NOT NULL,
    block_number BIGINT,
    amount DECIMAL(36, 18),
    token_address VARCHAR(42),
    transaction_type VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert sample data
INSERT IGNORE INTO users (username, email, password_hash) VALUES
    ('admin', 'admin@sonad.com', '$2b$10$example_hash_here'),
    ('testuser', 'test@sonad.com', '$2b$10$example_hash_here');