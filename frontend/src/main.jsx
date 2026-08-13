// Standalone dev harness — runs the module on its own with a mocked runtime context.
import { mount } from './bootstrap.jsx';

mount(document.getElementById('root'), {
  apiBaseUrl: '/api',
  authToken: 'dev-token',
  tenant: { code: 'DEV', name: 'Dev College' },
  user: { id: 'dev', role: 'college_admin' },
  permissions: ['result_analysis.view', 'result_analysis.create', 'result_analysis.update', 'result_analysis.delete'],
  theme: {},
  eventBus: { emit() {}, on() { return () => {}; } },
});
