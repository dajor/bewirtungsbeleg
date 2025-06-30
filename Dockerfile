# Dockerfile for PDF processing with system dependencies
FROM node:18-bullseye

# Install system dependencies for PDF processing
RUN apt-get update && apt-get install -y \
    imagemagick \
    ghostscript \
    poppler-utils \
    libmagickwand-dev \
    && rm -rf /var/lib/apt/lists/*

# Configure ImageMagick policy for PDF processing
RUN sed -i '/disable ghostscript format types/,+6d' /etc/ImageMagick-6/policy.xml && \
    sed -i 's/rights="none" pattern="PDF"/rights="read|write" pattern="PDF"/' /etc/ImageMagick-6/policy.xml

WORKDIR /app

# Copy package files
COPY package*.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN yarn build

# Expose port
EXPOSE 3000

# Start the application
CMD ["yarn", "start"]