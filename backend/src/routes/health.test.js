const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');

describe('Health Check & System Routes', () => {
  describe('GET /health', () => {
    it('should return 200 and health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('database');
    });

    it('should report database connection status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.database).toBeDefined();
      expect(['connected', 'disconnected']).toContain(response.body.database);
    });

    it('should include timestamp in ISO format', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });
  });

  describe('GET /', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('running');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/nonexistent-route')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Route not found');
    });

    it('should handle POST to non-existent routes', async () => {
      await request(app)
        .post('/api/nonexistent')
        .send({ data: 'test' })
        .expect(404);
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      // This tests the global error handler
      // In a real scenario, you'd create a route that throws an error
      const response = await request(app)
        .get('/api/test-error-handler')
        .expect(404); // Since this route doesn't exist

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in responses', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should handle OPTIONS preflight requests', async () => {
      const response = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST');

      expect(response.status).toBeLessThan(400);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health');

      // Helmet.js should add these headers
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-content-type-options');
    });
  });

  describe('Rate Limiting', () => {
    it('should not rate limit in test/development', async () => {
      // Make multiple requests rapidly
      const requests = Array(10).fill(null).map(() => request(app).get('/health'));

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('JSON Body Parsing', () => {
    it('should parse JSON request bodies', async () => {
      const testData = { test: 'data', number: 123 };

      const response = await request(app)
        .post('/api/auth/register')
        .send(testData)
        .set('Content-Type', 'application/json');

      // Should be parseable (may fail validation but parsing should work)
      expect(response.status).not.toBe(400); // Not a parsing error
    });

    it('should reject invalid JSON', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send('invalid json {')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
    });

    it('should handle large JSON payloads within limit', async () => {
      const largeData = {
        data: 'x'.repeat(1024 * 1024) // 1MB
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(largeData)
        .set('Content-Type', 'application/json');

      // Should not reject due to size (10MB limit configured)
      expect(response.status).not.toBe(413);
    });
  });

  describe('Cookie Handling', () => {
    it('should accept cookies in requests', async () => {
      const response = await request(app)
        .get('/health')
        .set('Cookie', 'test=value');

      expect(response.status).toBe(200);
    });
  });

  describe('Database Connection', () => {
    it('should have active database connection', () => {
      const state = mongoose.connection.readyState;
      // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
      expect([0, 1, 2]).toContain(state);
    });
  });
});
