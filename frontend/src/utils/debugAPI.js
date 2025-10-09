// Debug API Connection Test
import { authAPI } from '../services/api';

export const debugAPIConnection = async () => {
  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  // Test 1: Health Check
  try {
    console.log('🔍 Testing API health check...');
    const response = await fetch('http://localhost:5002/health');
    results.tests.push({
      name: 'Health Check',
      status: response.ok ? 'PASS' : 'FAIL',
      details: `Status: ${response.status}, StatusText: ${response.statusText}`
    });
  } catch (error) {
    results.tests.push({
      name: 'Health Check',
      status: 'ERROR',
      details: error.message
    });
  }

  // Test 2: CORS Preflight
  try {
    console.log('🔍 Testing CORS configuration...');
    const response = await fetch('http://localhost:5002/api/auth/register', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3001',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    results.tests.push({
      name: 'CORS Preflight',
      status: response.ok ? 'PASS' : 'FAIL',
      details: `Status: ${response.status}`
    });
  } catch (error) {
    results.tests.push({
      name: 'CORS Preflight',
      status: 'ERROR',
      details: error.message
    });
  }

  // Test 3: API Endpoint Accessibility
  try {
    console.log('🔍 Testing API endpoint accessibility...');
    // Try a simple GET request that should return 404 or similar
    const response = await fetch('http://localhost:5002/api/test-endpoint');
    results.tests.push({
      name: 'API Endpoint Access',
      status: response.status === 404 ? 'PASS' : 'UNEXPECTED',
      details: `Status: ${response.status} (404 expected for non-existent endpoint)`
    });
  } catch (error) {
    results.tests.push({
      name: 'API Endpoint Access',
      status: 'ERROR',
      details: error.message
    });
  }

  // Test 4: Form Clearing Service
  try {
    console.log('🔍 Testing Form Clearing Service...');
    const { default: FormClearingService } = await import('../services/formClearingService');
    FormClearingService.clearAllForms();
    results.tests.push({
      name: 'Form Clearing Service',
      status: 'PASS',
      details: 'Service loaded and executed without errors'
    });
  } catch (error) {
    results.tests.push({
      name: 'Form Clearing Service',
      status: 'ERROR',
      details: error.message
    });
  }

  // Log results
  console.group('🐛 DEBUG RESULTS');
  console.table(results.tests);
  console.groupEnd();

  return results;
};

// Auto-run debug on import if in development
if (process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    debugAPIConnection();
  }, 2000);
}

export default debugAPIConnection;