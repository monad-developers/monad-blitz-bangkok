// MongoDB initialization script for BetNad
// This script runs when the MongoDB container starts for the first time

// Switch to the betnad database
db = db.getSiblingDB('betnad');

// Create a user for the application
db.createUser({
  user: 'betnad_user',
  pwd: 'betnad_password',
  roles: [
    {
      role: 'readWrite',
      db: 'betnad'
    }
  ]
});

// Create initial collections with some sample data
db.createCollection('users');
db.createCollection('bets');
db.createCollection('events');

// Insert some sample data
db.users.insertOne({
  _id: ObjectId(),
  address: '0x0000000000000000000000000000000000000000',
  username: 'admin',
  createdAt: new Date(),
  updatedAt: new Date()
});

db.events.insertOne({
  _id: ObjectId(),
  title: 'Sample Event',
  description: 'This is a sample betting event',
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date()
});

print('Database initialization completed successfully!');
