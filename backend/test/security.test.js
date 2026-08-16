const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

process.env.JWT_SECRET = 'a'.repeat(64);

const app = require('../src/app');
const Customer = require('../src/models/customer');
const Order = require('../src/models/order');
const Product = require('../src/models/product');
const Setting = require('../src/models/setting');
const User = require('../src/models/user');
const { inspectValue } = require('../src/middleware/requestSecurity');
const { redact } = require('../src/services/logger');

const request = (server, path) => new Promise((resolve, reject) => {
  const address = server.address();
  const req = http.get({ hostname: '127.0.0.1', port: address.port, path }, (res) => {
    let body = '';
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body), headers: res.headers }));
  });
  req.on('error', reject);
});

test('liveness is minimal and readiness fails closed without MongoDB', async (t) => {
  const server = await new Promise((resolve) => {
    const listeningServer = app.listen(0, '127.0.0.1', () => resolve(listeningServer));
  });
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const health = await request(server, '/health');
  assert.equal(health.status, 200);
  assert.deepEqual(health.body, { ok: true });
  assert.match(health.headers['x-request-id'], /^[0-9a-f-]{36}$/);

  const ready = await request(server, '/ready');
  assert.equal(ready.status, 503);
  assert.deepEqual(ready.body, { ready: false });
});

test('request security rejects malformed identifiers and oversized collections', () => {
  assert.equal(inspectValue({ customerId: 'not-an-object-id' }), 'Invalid resource identifier');
  assert.equal(inspectValue({ items: Array(201).fill('x') }), 'Request contains too many items');
  assert.equal(inspectValue({ search: 'x'.repeat(750001) }), 'Request text is too long');
});

test('structured log redaction removes secrets, credentials, and customer fields', () => {
  const output = redact({
    authorization: 'Bearer abc.def.ghi',
    mongo: 'mongodb://user:password@example.test/db',
    customer: { name: 'Customer Name', mobile: '9999999999' },
  }, { customerData: true });
  assert.equal(output.authorization, '[REDACTED]');
  assert.equal(output.mongo, 'mongodb://[REDACTED]@example.test/db');
  assert.equal(output.customer.name, '[REDACTED]');
  assert.equal(output.customer.mobile, '[REDACTED]');
});

test('pharmacy schemas enforce bounded customer, order, setting, and credential fields', () => {
  assert.ok(new Customer({ name: 'Valid Name', mobile: '9999999999', address: 'x'.repeat(501) }).validateSync());
  assert.ok(new Order({ items: [] }).validateSync());
  assert.ok(new Setting({ companyName: 'x'.repeat(151) }).validateSync());
  assert.ok(new User({ email: 'owner@example.com', password: 'A'.repeat(64), role: 'admin', name: 'Owner', mobile: 'invalid' }).validateSync());
  assert.equal(new User({ email: 'owner@example.com', password: 'A'.repeat(64), role: 'admin', name: 'Owner', mobile: '9999999999' }).toJSON().password, undefined);
  assert.equal(new Setting({ whatsappToken: 'provider-secret' }).toJSON().whatsappToken, undefined);
  assert.equal(new Product({ hsnCode: 'HSN3004' }).validateSync()?.errors.hsnCode, undefined);
});
