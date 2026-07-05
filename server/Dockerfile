# Use the official Node.js LTS Alpine image for a smaller footprint
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files first to leverage Docker layer caching
COPY package.json package-lock.json* ./

# Install production dependencies
RUN npm install --production

# Copy the rest of the server code
COPY . .

# Expose port 5000 (which the Express app uses)
EXPOSE 5000

# Start the Node.js server (using node, not nodemon, for production)
CMD ["node", "index.js"]
