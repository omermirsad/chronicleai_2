// scripts/health-check.ts
/**
 * Post-Deployment Health Check Script
 * Runs a comprehensive health check on your deployed application
 * 
 * Usage: ts-node scripts/health-check.ts --url https://yourdomain.com
 */

import https from 'https';
import http from 'http';

interface HealthCheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  responseTime?: number;
}

const results: HealthCheckResult[] = [];
const args = process.argv.slice(2);
const urlIndex = args.indexOf('--url');
const APP_URL = urlIndex !== -1 ? args[urlIndex + 1] : process.env.VITE_APP_URL || 'http://localhost:5173';

console.log('\n' + '='.repeat(60));
console.log('Chronicle AI - Post-Deployment Health Check');
console.log('='.repeat(60));
console.log(`\nTarget URL: ${APP_URL}\n`);

// Helper to make HTTP requests
function makeRequest(url: string, method = 'GET'): Promise<{ status: number; body: string; headers: any; time: number }> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const req = protocol.request(url, { method }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode || 0,
          body,
          headers: res.headers,
          time: Date.now() - startTime
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

async function checkEndpoint(name: string, url: string, expectedStatus = 200): Promise<void> {
  try {
    const response = await makeRequest(url);
    
    if (response.status === expectedStatus) {
      results.push({
        name,
        status: 'pass',
        message: `Endpoint accessible (${response.time}ms)`,
        responseTime: response.time
      });
    } else {
      results.push({
        name,
        status: 'fail',
        message: `Expected ${expectedStatus}, got ${response.status}`
      });
    }
  } catch (error) {
    results.push({
      name,
      status: 'fail',
      message: `Request failed: ${error}`
    });
  }
}

async function checkHTML(name: string, url: string, searchText: string): Promise<void> {
  try {
    const response = await makeRequest(url);
    
    if (response.status === 200 && response.body.includes(searchText)) {
      results.push({
        name,
        status: 'pass',
        message: `Content verified (${response.time}ms)`,
        responseTime: response.time
      });
    } else if (response.status === 200) {
      results.push({
        name,
        status: 'warn',
        message: `Page loads but expected content not found`
      });
    } else {
      results.push({
        name,
        status: 'fail',
        message: `Status ${response.status}`
      });
    }
  } catch (error) {
    results.push({
      name,
      status: 'fail',
      message: `Request failed: ${error}`
    });
  }
}

async function checkSecurityHeaders(name: string, url: string): Promise<void> {
  try {
    const response = await makeRequest(url);
    const headers = response.headers;
    
    const requiredHeaders = {
      'x-frame-options': 'X-Frame-Options',
      'x-content-type-options': 'X-Content-Type-Options',
      'strict-transport-security': 'Strict-Transport-Security'
    };
    
    const missingHeaders: string[] = [];
    
    for (const [key, name] of Object.entries(requiredHeaders)) {
      if (!headers[key]) {
        missingHeaders.push(name);
      }
    }
    
    if (missingHeaders.length === 0) {
      results.push({
        name,
        status: 'pass',
        message: 'All security headers present'
      });
    } else {
      results.push({
        name,
        status: 'warn',
        message: `Missing headers: ${missingHeaders.join(', ')}`
      });
    }
  } catch (error) {
    results.push({
      name,
      status: 'fail',
      message: `Failed to check headers: ${error}`
    });
  }
}

async function checkSSL(url: string): Promise<void> {
  if (!url.startsWith('https://')) {
    results.push({
      name: 'SSL/TLS',
      status: 'fail',
      message: 'Site not using HTTPS'
    });
    return;
  }
  
  try {
    await makeRequest(url);
    results.push({
      name: 'SSL/TLS',
      status: 'pass',
      message: 'HTTPS enabled'
    });
  } catch (error) {
    results.push({
      name: 'SSL/TLS',
      status: 'fail',
      message: `SSL error: ${error}`
    });
  }
}

async function runHealthChecks() {
  console.log('🏥 Running health checks...\n');
  
  // 1. Check main page
  await checkHTML('Main Page', APP_URL, 'Chronicle AI');
  
  // 2. Check important routes
  await checkEndpoint('Terms of Service', `${APP_URL}/terms`, 200);
  await checkEndpoint('Privacy Policy', `${APP_URL}/privacy`, 200);
  await checkEndpoint('Help Center', `${APP_URL}/help`, 200);
  
  // 3. Check 404 handling
  await checkEndpoint('404 Handling', `${APP_URL}/nonexistent-page-12345`, 200); // SPA returns 200 and handles in JS
  
  // 4. Check SSL/TLS
  await checkSSL(APP_URL);
  
  // 5. Check security headers
  await checkSecurityHeaders('Security Headers', APP_URL);
  
  // 6. Check assets loading
  await checkEndpoint('Static Assets', `${APP_URL}/assets`, 200); // May or may not exist
  
  // Print results
  console.log('\n' + '='.repeat(60));
  console.log('Results:');
  console.log('='.repeat(60) + '\n');
  
  let passCount = 0;
  let failCount = 0;
  let warnCount = 0;
  
  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${result.name}`);
    console.log(`   ${result.message}`);
    
    if (result.status === 'pass') passCount++;
    else if (result.status === 'fail') failCount++;
    else warnCount++;
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`Summary: ${passCount} passed, ${failCount} failed, ${warnCount} warnings`);
  console.log('='.repeat(60) + '\n');
  
  if (failCount > 0) {
    console.log('❌ Health check failed!\n');
    console.log('Common issues:');
    console.log('1. DNS not propagated yet (wait 5-10 minutes)');
    console.log('2. Security headers not configured');
    console.log('3. SPA routing not working (check server config)');
    console.log('4. SSL certificate not issued yet\n');
    process.exit(1);
  } else if (warnCount > 0) {
    console.log('⚠️  Health check passed with warnings.\n');
    console.log('Review warnings above and fix if needed.\n');
    process.exit(0);
  } else {
    console.log('✅ All health checks passed!\n');
    console.log('Your app is live and healthy. 🎉\n');
    process.exit(0);
  }
}

// Performance check
async function checkPerformance() {
  console.log('\n📊 Running performance checks...\n');
  
  try {
    const response = await makeRequest(APP_URL);
    
    console.log(`Load time: ${response.time}ms`);
    
    if (response.time < 1000) {
      console.log('✅ Excellent load time (<1s)');
    } else if (response.time < 3000) {
      console.log('⚠️  Good load time (1-3s)');
    } else {
      console.log('❌ Slow load time (>3s) - optimize your app');
    }
    
    // Check gzip compression
    if (response.headers['content-encoding']?.includes('gzip') || 
        response.headers['content-encoding']?.includes('br')) {
      console.log('✅ Compression enabled');
    } else {
      console.log('⚠️  Compression not detected - enable gzip/brotli');
    }
    
  } catch (error) {
    console.log(`❌ Performance check failed: ${error}`);
  }
}

// Run all checks
(async () => {
  await runHealthChecks();
  await checkPerformance();
})().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});