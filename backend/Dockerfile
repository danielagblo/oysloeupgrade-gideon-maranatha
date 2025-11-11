# Multi-stage build for production
FROM oven/bun:1 as base
WORKDIR /app

# Install all dependencies (including dev dependencies for build)
COPY package.json ./
RUN bun install

# Copy source code
COPY . .

# Build application
RUN bun run build

# Production stage
FROM oven/bun:1-slim
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apt-get update && apt-get install -y dumb-init && rm -rf /var/lib/apt/lists/*

# Copy built application and dependencies
COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./
COPY --from=base /app/bunfig.toml ./
COPY --from=base /app/spec ./spec
COPY --from=base /app/scripts ./scripts
COPY --from=base /app/zod-extend.ts ./

# Create non-root user for security
RUN groupadd --gid 1001 --system bunjs && \
    useradd --uid 1001 --system --gid bunjs --shell /bin/false bunjs

# Create necessary directories and set permissions
RUN mkdir -p /app/logs /app/uploads && \
    chown -R bunjs:bunjs /app

# Switch to non-root user
USER bunjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["bun", "run", "start"]
