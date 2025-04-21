# Base image
FROM node:22.12.0-slim AS base

# Cài đặt hệ thống cần thiết
RUN apt-get update && apt-get install -y openssl ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Tạo thư mục làm việc
WORKDIR /app

# Copy cấu hình package
COPY package*.json ./

# Stage cho production: chỉ cài dependencies cần thiết
FROM base AS prod

# Cài dependencies không bao gồm dev
RUN npm install --omit=dev

# Cài build tool
RUN npm install tsup typescript

# Copy toàn bộ mã nguồn (sau khi cài để tránh cache lại khi source code thay đổi)
COPY . .

# Build TypeScript
RUN npm run build

# Expose cổng chạy app
EXPOSE 3000

# Start ứng dụng
CMD ["npm", "start"]

# Stage cho development
FROM base AS dev

# Cài full dependencies bao gồm dev
RUN npm install

# Copy toàn bộ mã nguồn (sau khi cài để tránh cache lại khi source code thay đổi)
COPY . .

# Expose cổng chạy app
EXPOSE 3000

# Start ở chế độ dev
CMD ["npm", "run", "dev"]
