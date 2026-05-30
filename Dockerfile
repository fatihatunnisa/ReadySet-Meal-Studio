# ==========================================
# STAGE 1: Build Phase
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (including devDependencies required for building)
RUN npm ci

# Copy the rest of the application files
COPY . .

# Run the typescript & bundle build script (generates dist/)
RUN npm run build

# ==========================================
# STAGE 2: Production Safe Runtime Phase
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

# Set production environment flags
ENV NODE_ENV=production
ENV PORT=3000

# Copy dependency manifests
COPY package*.json ./

# Install only production dependencies (excluding devDependencies to keep container tiny)
RUN npm ci --omit=dev

# Copy the bundled assets & compiled server file from the builder stage
COPY --from=builder /app/dist ./dist

# Document the designated entry port (exposing port 3000)
EXPOSE 3000

# Start the compiled React + Express full-stack application
CMD ["npm", "run", "start"]
