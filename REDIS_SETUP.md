# Redis Setup for Audiora

## Local Development

### Prerequisites
- Docker and Docker Compose installed

### Starting Redis
```bash
docker-compose up -d
```

### Stopping Redis
```bash
docker-compose down
```

### Viewing Redis Data (Optional)
```bash
# Connect to Redis CLI
docker exec -it audiora-redis redis-cli

# View all keys
KEYS *

# View throttle keys
KEYS throttle:*

# Exit
exit
```

## Environment Variables

Add to your `.env.local`:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

## Production Deployment

For production, use a managed Redis service (e.g., AWS ElastiCache, Redis Cloud) and update the environment variables accordingly.

## Rate Limiting Configuration

Rate limiting is now applied **ONLY to authentication endpoints**:
- `/auth/google`: 20 requests/minute
- `/auth/google/callback`: 20 requests/minute
- `/auth/refresh`: 100 requests/minute

Music endpoints have **NO rate limiting** as they are protected by JWT authentication.
