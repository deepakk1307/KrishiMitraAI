FROM node:22-alpine

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy application files
COPY server.ts ./
COPY src/ ./src/
COPY public/ ./public/
COPY migrations/ ./migrations/

# Environment configuration
ENV PORT=3000
ENV NODE_ENV=production
EXPOSE 3000

# Start server
CMD ["npm", "start"]
