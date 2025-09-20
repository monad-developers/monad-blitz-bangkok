# BetNad Backend

Fastify-based backend API with Twitter authentication and MongoDB integration.

## Features

- 🐦 Twitter Authentication
- 🗄️ MongoDB integration
- ⚡ Fastify framework
- 🛡️ Security middleware (CORS, Helmet, Rate Limiting)
- 📝 TypeScript support
- 🔄 Auto-reload in development

## Quick Start

1. **Install dependencies:**

   ```bash
   cd packages/backend
   yarn install
   ```

2. **Set up environment variables:**
   Create a `.env` file based on `.env.example`:

   ```bash
   cp .env.example .env
   ```

3. **Configure Twitter API:**

   - Get your Twitter API credentials from Twitter Developer Portal
   - Update the Twitter environment variables in `.env`

4. **Start MongoDB:**

   ```bash
   # From project root
   docker-compose up -d
   ```

5. **Start the backend:**

   ```bash
   # Development mode
   yarn dev

   # Production mode
   yarn build
   yarn start
   ```

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login with Twitter credentials
- `POST /api/auth/verify-token` - Verify Twitter credentials
- `GET /api/auth/health` - Health check

### General

- `GET /` - API information

## Environment Variables

| Variable                | Description               | Default                                                        |
| ----------------------- | ------------------------- | -------------------------------------------------------------- |
| `PORT`                  | Server port               | `3001`                                                         |
| `HOST`                  | Server host               | `0.0.0.0`                                                      |
| `NODE_ENV`              | Environment               | `development`                                                  |
| `MONGODB_URI`           | MongoDB connection string | `mongodb://betnad_user:betnad_password@localhost:27017/betnad` |
| `CORS_ORIGIN`           | CORS allowed origin       | `http://localhost:4000`                                        |
| `X_APP_KEY`             | Twitter API key           | Required                                                       |
| `X_APP_SECRET`          | Twitter API secret        | Required                                                       |
| `X_USER_ACCESS_TOKEN`   | Twitter access token      | Required                                                       |
| `X_USER_ACCESS_SECRET`  | Twitter access secret     | Required                                                       |
| `X_BOT_USER_ID`         | Twitter bot user ID       | Required                                                       |

## Development

```bash
# Install dependencies
yarn install

# Run in development mode
yarn dev

# Build for production
yarn build

# Run production build
yarn start

# Lint code
yarn lint

# Fix linting issues
yarn lint:fix
```

## Project Structure

```
src/
├── index.ts           # Main server file
├── types/             # TypeScript type definitions
├── models/            # Database models
├── routes/            # API routes
├── services/          # External services (Twitter, Privy)
└── utils/             # Utility functions
```

## Integration with Frontend

The backend is designed to work with the Next.js frontend. Make sure to:

1. Set the correct `CORS_ORIGIN` in your `.env` file
2. Use the backend URL in your frontend API calls
3. Handle Twitter authentication on the frontend
4. Send the Twitter credentials to the backend for authentication
