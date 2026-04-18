import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 50 }, // Ramp up to 50 users
    { duration: '2m', target: 50 },  // Stay at 50 users for 2 minutes
    { duration: '30s', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests should be below 1000ms
  },
};

export default function () {
  let latitude = 24.7136 + (Math.random() - 0.5) * 0.1;
  let longitude = 46.6753 + (Math.random() - 0.5) * 0.1;

  let payload = JSON.stringify({
    latitude: latitude,
    longitude: longitude,
    category: 'accident',
    description: 'Load test report - write heavy'
  });

  let response = http.post('http://localhost:3000/api/v1/reports', payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(response, {
    'status is 201': (r) => r.status === 201,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  sleep(0.5);
}