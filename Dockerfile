# =============================================================
# Single-service Dockerfile for Railway deployment
# Builds React frontend + Spring Boot backend into one image
# Frontend is served from Spring Boot's classpath:/static/
# =============================================================

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
# No VITE_API_URL needed — frontend uses relative /api paths served by same origin
RUN npm run build

# Stage 2: Build backend
FROM maven:3.9-eclipse-temurin-17-alpine AS backend-build
WORKDIR /app/backend
COPY backend/pom.xml .
RUN mvn dependency:go-offline -B
COPY backend/src src
# Copy frontend build into Spring Boot static resources
COPY --from=frontend-build /app/frontend/dist src/main/resources/static/
RUN mvn clean package -DskipTests -B

# Stage 3: Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=backend-build /app/backend/target/*.jar app.jar
RUN mkdir -p /app/uploads
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=prod"]
