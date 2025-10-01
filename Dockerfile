# Use Bun image
FROM oven/bun:1
WORKDIR /app

# Copy backend files
COPY backend/package.json backend/bun.lockb* ./
RUN bun install

# Copy backend application code
COPY backend/ ./

# Generate Prisma client
RUN bun x prisma generate

# Create directory for SQLite database
RUN mkdir -p /app/prisma

# Expose port (Render uses PORT env variable)
EXPOSE 10000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["bun", "run", "index.ts"]
