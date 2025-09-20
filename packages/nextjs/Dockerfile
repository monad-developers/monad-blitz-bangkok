# Use Node.js 20 Alpine as base image
FROM node:20-alpine

# Enable Corepack for Yarn version management
RUN corepack enable

# Set working directory
WORKDIR /app

# Copy root package.json and yarn.lock
COPY package.json yarn.lock ./

# Copy all package.json files
COPY packages/backend/package.json ./packages/backend/
COPY packages/nextjs/package.json ./packages/nextjs/
COPY packages/hardhat/package.json ./packages/hardhat/

# Install dependencies
RUN yarn install

# Copy source code
COPY packages/nextjs ./packages/nextjs

# Set working directory to nextjs
WORKDIR /app/packages/nextjs

# Build the application
RUN yarn build

# Expose port
EXPOSE 8000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8000
ENV NEXT_TELEMETRY_DISABLED=1

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["yarn", "serve"]
