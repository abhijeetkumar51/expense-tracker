# -------------------------
# Stage 1: Build the React App
# -------------------------
FROM node:20-alpine as build

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy source code and build the static files
COPY . .
RUN npm run build

# -------------------------
# Stage 2: Serve with Nginx
# -------------------------
FROM nginx:alpine

# Copy the static build output from Stage 1 into Nginx's HTML folder
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx (daemon off runs it in the foreground)
CMD ["nginx", "-g", "daemon off;"]
