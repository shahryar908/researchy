# Use Bun image
FROM oven/bun:1
WORKDIR /app

# Copy backend application code first
COPY backend/ ./

# Install dependencies (now prisma schema exists)
RUN bun install

# Prisma generate already ran via postinstall, but run again to be safe
RUN bun x prisma generate

# Create directory for SQLite database
RUN mkdir -p /app/prisma

# Expose port (Render uses PORT env variable)
EXPOSE 10000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["bun", "run", "index.ts"]
