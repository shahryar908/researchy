# Use Bun image
FROM oven/bun:1
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb* ./
RUN bun install --production

# Copy application code
COPY . .

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
