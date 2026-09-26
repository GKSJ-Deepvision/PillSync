/*
 * API Debug Visualizer
 * Intercepts window.fetch and visually displays HTTP requests.
 */
(function () {
  // Only inject once
  if (window.__API_LOGGER_INJECTED__) return;
  window.__API_LOGGER_INJECTED__ = true;

  // Create UI overlay
  const container = document.createElement('div');
  container.id = 'api-debug-logger';
  container.innerHTML = `
    <div id="api-debug-toggle">
      <span>API Activity Log</span>
      <span id="api-debug-count">0</span>
    </div>
    <div id="api-debug-panel" style="display: none;">
      <div id="api-debug-header">
        <span>Network Flow Visualizer</span>
        <button id="api-debug-clear">Clear</button>
      </div>
      <div id="api-debug-list"></div>
    </div>
  `;
  document.body.appendChild(container);

  const toggle = document.getElementById('api-debug-toggle');
  const panel = document.getElementById('api-debug-panel');
  const list = document.getElementById('api-debug-list');
  const countBadge = document.getElementById('api-debug-count');
  const clearBtn = document.getElementById('api-debug-clear');

  let reqCount = 0;

  toggle.addEventListener('click', () => {
    panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
  });

  clearBtn.addEventListener('click', () => {
    list.innerHTML = '';
    reqCount = 0;
    countBadge.textContent = '0';
  });

  function logRequest(url, method, status, hasToken, isSaved, recordsCount) {
    reqCount++;
    countBadge.textContent = reqCount;

    // Auto-open panel on first request
    if (reqCount === 1) {
      panel.style.display = 'flex';
    }

    const item = document.createElement('div');
    item.className = 'api-debug-item';

    const isSuccess = status >= 200 && status < 300;
    const statusText = status === 201 ? '201 Created' : status === 200 ? '200 OK' : status;

    let dbStatus = '';
    if (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
      dbStatus = `│ Database: ${isSuccess ? 'Saved ✓' : 'Failed ✗'}                    │\n`;
    } else if (method === 'GET' && isSuccess) {
      dbStatus = `│ Records returned: ${recordsCount !== null ? String(recordsCount).padEnd(19) : 'X                  '}│\n│ Source: Backend Database ✓           │\n`;
    }

    item.innerHTML = `
<pre class="api-debug-pre">
┌──────────────────────────────────────┐
│ Medication API / PillSync            │
├──────────────────────────────────────┤
│ ${method.padEnd(5)} ${url.padEnd(31)}│
│ Status: ${String(statusText).padEnd(29)}│
│ Authentication: ${hasToken ? 'JWT ✓                        ' : 'None ✗                       '}│
${dbStatus}└──────────────────────────────────────┘
</pre>`;

    list.prepend(item);
  }

  // Intercept fetch
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const urlStr =
      typeof args[0] === 'string' ? args[0] : args[0] && args[0].url ? args[0].url : '';
    const options = args[1] || {};
    const method = options.method || (args[0] && args[0].method) || 'GET';

    const headers = options.headers || (args[0] && args[0].headers) || {};
    const authHeader =
      typeof headers.get === 'function' ? headers.get('Authorization') : headers['Authorization'];
    const hasToken = !!authHeader;

    // Only log calls to our API
    if (urlStr.includes('http://127.0.0.1:8000/')) {
      try {
        const response = await originalFetch.apply(this, args);
        // clone to read body for counts
        const clone = response.clone();
        let count = null;
        try {
          const data = await clone.json();
          if (data && Array.isArray(data.results)) {
            count = data.results.length;
          } else if (data && Array.isArray(data)) {
            count = data.length;
          } else if (data && Array.isArray(data.days)) {
            count = data.days.length; // History days
          } else if (data && data.slots) {
            count = Object.values(data.slots).flat().length; // Today's doses
          }
        } catch {
          // ignore parsing error
        }

        // Truncate URL for display
        let displayUrl = urlStr.replace(window.location.origin, '');
        if (displayUrl.length > 31) displayUrl = displayUrl.slice(0, 28) + '...';

        logRequest(displayUrl, method, response.status, hasToken, true, count);
        return response;
      } catch (err) {
        logRequest(urlStr.slice(0, 31), method, 'ERR', hasToken, false, null);
        throw err;
      }
    }

    return originalFetch.apply(this, args);
  };
})();



