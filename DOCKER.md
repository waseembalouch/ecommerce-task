# Docker Deployment Guide

This document describes how to run the e-commerce application using Docker and Docker Compose.

## Prerequisites

- Docker Desktop installed
- Docker Compose v2.x or higher

## Quick Start

### Start all services (PostgreSQL, Redis, Backend, Frontend)

```bash
docker-compose up -d
```

### Stop all services

```bash
docker-compose down
```

### Stop and remove volumes (clean database)

```bash
docker-compose down -v
```

## Services

The Docker Compose setup includes 4 services:

### 1. PostgreSQL Database
- **Port**: 5432
- **Database**: ecommerce_db
- **User**: ecommerce
- **Password**: ecommerce123
- **Volume**: postgres_data

### 2. Redis Cache
- **Port**: 6379
- **Volume**: redis_data

### 3. Backend API (Node.js)
- **Port**: 3000
- **Health Check**: http://localhost:3000/api/health
- **Volume**: backend_uploads (for product images)
- **Environment**: Production mode with Prisma migrations

### 4. Frontend (React + Nginx)
- **Port**: 80
- **Health Check**: http://localhost/health
- **Serves**: Built React application via Nginx

## Accessing the Application

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000/api
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Development vs Production

### Development (Current Setup)
```bash
# Run only database services
docker-compose up -d postgres redis

# Run backend and frontend locally
cd backend-nodejs && npm run dev
cd frontend-react && npm run dev
```

### Production (Full Docker)
```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Useful Commands

### View running containers
```bash
docker-compose ps
```

### View logs
```bash
docker-compose logs -f
```

### Restart a service
```bash
docker-compose restart backend
```

### Rebuild a service
```bash
docker-compose up -d --build backend
```

### Access service shell
```bash
docker-compose exec backend sh
docker-compose exec postgres psql -U ecommerce -d ecommerce_db
```

### Database operations
```bash
# Access PostgreSQL
docker-compose exec postgres psql -U ecommerce -d ecommerce_db

# Run migrations manually
docker-compose exec backend npx prisma migrate deploy

# Seed database
docker-compose exec backend npm run seed
```

## Environment Variables

Create a `.env` file in the project root for custom configuration:

```env
# JWT Secret (change in production!)
JWT_SECRET=your-very-secure-secret-key

# Database (if using external database)
DATABASE_URL=postgresql://user:password@host:5432/database

# Redis (if using external Redis)
REDIS_URL=redis://host:6379
```

## Multi-stage Build

Both backend and frontend use multi-stage Docker builds for optimization:

### Backend Dockerfile
- **Stage 1 (builder)**: Installs all dependencies, generates Prisma client, builds TypeScript
- **Stage 2 (production)**: Copies only production dependencies and built files

### Frontend Dockerfile
- **Stage 1 (builder)**: Installs dependencies, builds React application
- **Stage 2 (production)**: Serves built files with Nginx

## Volumes

- **postgres_data**: PostgreSQL database files
- **redis_data**: Redis persistence
- **backend_uploads**: Product images and file uploads

## Health Checks

All services include health checks:
- **PostgreSQL**: `pg_isready` command
- **Redis**: `redis-cli ping` command
- **Backend**: HTTP GET to /api/health
- **Frontend**: HTTP GET to /health

## Networking

All services communicate through the `ecommerce-network` bridge network:
- Services can access each other using service names (e.g., `postgres`, `redis`, `backend`)
- Frontend → Backend: http://backend:3000
- Backend → PostgreSQL: postgres:5432
- Backend → Redis: redis:6379

## Security Notes

⚠️ **Important for Production:**

1. Change default database credentials
2. Use strong JWT_SECRET
3. Use secrets management (Docker Secrets, Kubernetes Secrets)
4. Enable HTTPS with reverse proxy (Nginx, Traefik)
5. Implement rate limiting
6. Use non-root users in containers
7. Scan images for vulnerabilities

## Troubleshooting

### Backend can't connect to database
```bash
# Check if PostgreSQL is healthy
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Frontend can't reach backend
- Check CORS_ORIGIN environment variable in backend
- Verify backend is running: `docker-compose ps backend`
- Check backend health: `curl http://localhost:3000/api/health`

### Migrations fail
```bash
# Run migrations manually
docker-compose exec backend npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d
```

### Port conflicts
If ports 80, 3000, 5432, or 6379 are in use:
```bash
# Modify docker-compose.yml to use different ports
# For example, change "80:80" to "8080:80"
```

## Performance Optimization

For production deployment:
1. Use Docker BuildKit for faster builds
2. Implement multi-stage builds (already done)
3. Use .dockerignore to exclude unnecessary files (already done)
4. Consider using Docker layer caching in CI/CD
5. Use specific image tags instead of `latest`

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Build and Push Docker Images

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build backend image
        run: docker build -t backend:latest ./backend-nodejs
      - name: Build frontend image
        run: docker build -t frontend:latest ./frontend-react
```

---

**Last Updated**: 2025-11-16
