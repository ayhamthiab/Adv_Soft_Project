import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '5m', target: 50 },  // Ramp up to 50 users
    { duration: '55m', target: 50 }, // Run for 55 minutes (total ~1 hour)
    { duration: '5m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<600'], // Slightly higher threshold for long test
  },
};

export default function () {
  let response = http.get('http://localhost:3000/api/v1/incidents?page=1&limit=20');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 600ms': (r) => r.timings.duration < 600,
  });
  sleep(1);
}