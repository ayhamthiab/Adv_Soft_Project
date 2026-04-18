import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '10s', target: 10 },   // Normal load
    { duration: '10s', target: 500 },  // Spike to 500 users
    { duration: '10s', target: 10 },   // Back to normal
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // Allow higher latency during spike
  },
};

export default function () {
  let response = http.get('http://localhost:3000/api/v1/incidents?page=1&limit=20');
  check(response, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(1);
}