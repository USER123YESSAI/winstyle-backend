# Use official Node.js LTS image
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Bundle app source
COPY . .

# Ensure uploads directory exists
RUN mkdir -p /usr/src/app/uploads

# Expose port
EXPOSE 5000

# Use production node environment
ENV NODE_ENV=production

CMD ["node", "server.js"]
