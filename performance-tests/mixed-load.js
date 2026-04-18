import http from 'k6/http';
import { check, sleep } from 'k6';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export let options = {
  stages: [
    { duration: '1m', target: 200 }, // Ramp up to 200 users
    { duration: '3m', target: 200 }, // Stay at 200 users for 3 minutes
    { duration: '1m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'], // 95% of requests should be below 800ms
  },
};

export default function () {
  let random = Math.random();

  if (random < 0.7) {
    // 70% - GET /incidents
    let response = http.get(`http://localhost:3000/api/v1/incidents?page=${randomIntBetween(1, 5)}&limit=10`);
    check(response, {
      'status is 200': (r) => r.status === 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
    });
  } else if (random < 0.9) {
    // 20% - POST /reports
    let latitude = 24.7136 + (Math.random() - 0.5) * 0.1;
    let longitude = 46.6753 + (Math.random() - 0.5) * 0.1;

    let payload = JSON.stringify({
      latitude: latitude,
      longitude: longitude,
      category: 'accident',
      description: 'Mixed load test report'
    });

    let response = http.post('http://localhost:3000/api/v1/reports', payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    check(response, {
      'status is 201': (r) => r.status === 201,
      'response time < 1000ms': (r) => r.timings.duration < 1000,
    });
  } else {
    // 10% - GET /routes/estimate
    let response = http.get('http://localhost:3000/api/v1/routes/estimate?startLat=24.7136&startLng=46.6753&endLat=24.7743&endLng=46.7384');
    check(response, {
      'status is 200': (r) => r.status === 200,
      'response time < 1500ms': (r) => r.timings.duration < 1500,
    });
  }

  sleep(Math.random() * 2 + 0.5);
}