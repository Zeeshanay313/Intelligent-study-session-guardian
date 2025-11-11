# Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Docker Deployment](#docker-deployment)
4. [Cloud Deployment](#cloud-deployment)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Monitoring & Maintenance](#monitoring--maintenance)

## Prerequisites

### Required Software
- Docker 24.0+ and Docker Compose 2.0+
- Node.js 18.x (for local development)
- MongoDB 7.0+ (if not using Docker)
- Git

### Required Accounts & Credentials
- MongoDB Atlas account (for cloud database)
- Google Cloud Console project (for OAuth)
- SMTP server credentials (for email notifications)
- Domain name (for production deployment)

## Environment Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Zeeshanay313/Intelligent-study-session-guardian.git
cd Intelligent-study-session-guardian
```

### 2. Create Environment Files

Create `backend/.env` file:
```env
# Environment
NODE_ENV=production
PORT=5004

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/study-guardian?retryWrites=true&w=majority

# JWT Secrets (CHANGE THESE!)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
SESSION_SECRET=your-session-secret-key-min-32-chars

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=Study Guardian <noreply@yourdomain.com>

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_MAX=100
```

Create `.env` file in root for Docker Compose:
```env
MONGO_ROOT_PASSWORD=your-secure-mongodb-password
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key
SESSION_SECRET=your-session-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### 3. Generate Secure Secrets

Use these commands to generate secure random secrets:

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Docker Deployment

### Local Docker Deployment

1. **Build and start services:**
```bash
docker-compose up -d
```

2. **Check service health:**
```bash
docker-compose ps
docker-compose logs backend
```

3. **Access the application:**
- Backend API: http://localhost:5004
- Health check: http://localhost:5004/health
- MongoDB: localhost:27017

4. **Stop services:**
```bash
docker-compose down
```

5. **Stop and remove volumes (CAUTION: Deletes all data):**
```bash
docker-compose down -v
```

### Production Docker Deployment

1. **Build optimized image:**
```bash
docker build -t study-guardian:latest .
```

2. **Run with production settings:**
```bash
docker run -d \
  --name study-guardian-backend \
  -p 5004:5004 \
  --env-file backend/.env \
  --restart unless-stopped \
  study-guardian:latest
```

## Cloud Deployment

### Deploy to Google Cloud Run

1. **Install Google Cloud SDK:**
```bash
gcloud components install
```

2. **Authenticate:**
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

3. **Build and push to Container Registry:**
```bash
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/study-guardian
```

4. **Deploy to Cloud Run:**
```bash
gcloud run deploy study-guardian \
  --image gcr.io/YOUR_PROJECT_ID/study-guardian \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-env-vars MONGODB_URI=$MONGODB_URI \
  --set-env-vars JWT_SECRET=$JWT_SECRET
```

### Deploy to AWS ECS

1. **Install AWS CLI:**
```bash
aws configure
```

2. **Create ECR repository:**
```bash
aws ecr create-repository --repository-name study-guardian
```

3. **Build and push Docker image:**
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com
docker build -t study-guardian .
docker tag study-guardian:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/study-guardian:latest
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/study-guardian:latest
```

4. **Create ECS task definition and service** (use AWS Console or AWS CDK)

### Deploy to Heroku

1. **Install Heroku CLI:**
```bash
heroku login
```

2. **Create app:**
```bash
heroku create study-guardian-app
```

3. **Add MongoDB addon:**
```bash
heroku addons:create mongolab:sandbox
```

4. **Set environment variables:**
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
heroku config:set JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
heroku config:set SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
```

5. **Deploy:**
```bash
git push heroku main
```

### Deploy to Vercel (Backend as Serverless Functions)

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Configure `vercel.json`** (already in repo)

3. **Deploy:**
```bash
vercel --prod
```

4. **Set environment variables:**
```bash
vercel env add MONGODB_URI production
vercel env add JWT_SECRET production
```

## Post-Deployment Verification

### 1. Health Check
```bash
curl https://your-domain.com/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-11-10T...",
  "database": "connected"
}
```

### 2. Database Connectivity
```bash
curl https://your-domain.com/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

Should return 401 or proper auth response (not 500).

### 3. Google OAuth Flow
1. Navigate to: `https://your-domain.com/api/auth/google`
2. Should redirect to Google login
3. After authentication, should redirect back with tokens

### 4. API Endpoints Test
```bash
# Register user
curl https://your-domain.com/api/auth/register -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "email":"testuser@example.com",
    "password":"SecurePass123!",
    "displayName":"Test User"
  }'

# Get analytics (with auth token)
curl https://your-domain.com/api/analytics/user-stats \
  -H "Cookie: accessToken=YOUR_TOKEN"
```

### 5. Performance Testing
```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Load test
ab -n 1000 -c 10 https://your-domain.com/health
```

## Monitoring & Maintenance

### Log Monitoring

**Docker logs:**
```bash
docker-compose logs -f backend
docker-compose logs --tail=100 backend
```

**Cloud Run logs:**
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=study-guardian" --limit 50
```

**Heroku logs:**
```bash
heroku logs --tail
```

### Database Backup

**MongoDB Atlas (Automated):**
- Backups run automatically
- Restore via Atlas Console

**Self-hosted MongoDB:**
```bash
# Backup
docker exec study-guardian-db mongodump --out /backup

# Restore
docker exec study-guardian-db mongorestore /backup
```

### Update Deployment

**Docker:**
```bash
docker-compose pull
docker-compose up -d
```

**Cloud Run:**
```bash
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/study-guardian
gcloud run deploy study-guardian --image gcr.io/YOUR_PROJECT_ID/study-guardian
```

### SSL/TLS Certificate

**Using Let's Encrypt with Nginx:**
```bash
sudo certbot --nginx -d yourdomain.com
```

**Using Cloudflare:**
1. Point DNS to Cloudflare
2. Enable "Full (strict)" SSL mode
3. Enable "Always Use HTTPS"

### Scaling

**Horizontal Scaling (Docker Swarm):**
```bash
docker service scale study-guardian-backend=3
```

**Auto-scaling (Cloud Run):**
```bash
gcloud run services update study-guardian \
  --min-instances 1 \
  --max-instances 10
```

### Security Checklist

- [ ] All secrets rotated from defaults
- [ ] HTTPS enabled with valid certificate
- [ ] Firewall rules configured
- [ ] Rate limiting enabled
- [ ] MongoDB authentication enabled
- [ ] Backup strategy implemented
- [ ] Monitoring and alerting configured
- [ ] CORS configured for production domains only
- [ ] Security headers enabled (Helmet.js)
- [ ] Input validation on all endpoints

### Troubleshooting

**Backend won't start:**
1. Check logs: `docker-compose logs backend`
2. Verify MongoDB connection
3. Check environment variables
4. Verify port 5004 is available

**Database connection errors:**
1. Check `MONGODB_URI` format
2. Verify database credentials
3. Check network connectivity
4. Verify IP whitelist (MongoDB Atlas)

**OAuth not working:**
1. Verify Google Client ID and Secret
2. Check callback URL matches Google Console
3. Verify redirect URIs in Google Console
4. Check HTTPS requirement for production

**Performance issues:**
1. Check database indexes
2. Monitor memory usage
3. Check connection pool settings
4. Enable caching where appropriate

## Rollback Procedure

**Docker:**
```bash
docker tag study-guardian:latest study-guardian:backup
docker pull study-guardian:previous-version
docker-compose up -d
```

**Cloud Run:**
```bash
gcloud run services update-traffic study-guardian \
  --to-revisions REVISION_NAME=100
```

## Support

For issues, please check:
1. GitHub Issues: https://github.com/Zeeshanay313/Intelligent-study-session-guardian/issues
2. Documentation: README.md
3. Logs and error messages

---

**Last Updated:** November 10, 2025  
**Version:** 1.0.0
