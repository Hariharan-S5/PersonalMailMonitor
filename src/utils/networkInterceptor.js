import { useEmailStore } from '../store/useEmailStore';

// ─── FETCH INTERCEPTION ──────────────────────────────────────────────────────
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const startTime = performance.now();
  const { updateNetworkMetrics } = useEmailStore.getState();

  // 1. Initial Update (Request Sent)
  const networkMetrics = useEmailStore.getState().networkMetrics;
  updateNetworkMetrics({
    requests: networkMetrics.requests + 1,
    pending: networkMetrics.pending + 1,
  });

  // Estimate Request Size
  const requestUrl = typeof args[0] === 'string' ? args[0] : args[0].url;
  const requestOptions = args[1] || {};
  let sentBytes = requestUrl.length;
  if (requestOptions.body) {
    if (typeof requestOptions.body === 'string') sentBytes += requestOptions.body.length;
    else if (requestOptions.body instanceof Blob) sentBytes += requestOptions.body.size;
    else if (requestOptions.body instanceof FormData) {
      // Approximation for FormData
      for (let pair of requestOptions.body.entries()) {
        sentBytes += String(pair[0]).length + (pair[1] instanceof Blob ? pair[1].size : String(pair[1]).length);
      }
    }
  }
  
  updateNetworkMetrics({
    sentKb: parseFloat((useEmailStore.getState().networkMetrics.sentKb + (sentBytes / 1024)).toFixed(4))
  });

  try {
    const response = await originalFetch(...args);
    const duration = performance.now() - startTime;
    
    // Read size without consuming body
    const clonedResponse = response.clone();
    let fetchedBytes = 0;
    try {
      const blob = await clonedResponse.blob();
      fetchedBytes = blob.size;
    } catch (e) {
      fetchedBytes = parseInt(response.headers.get('content-length') || '0', 10);
    }

    const currentState = useEmailStore.getState().networkMetrics;
    const newTotalTime = currentState.totalTime + duration;
    const totalCompleted = currentState.success + currentState.errors + 1;

    if (response.ok) {
      updateNetworkMetrics({
        pending: Math.max(0, currentState.pending - 1),
        success: currentState.success + 1,
        fetchedKb: parseFloat((currentState.fetchedKb + (fetchedBytes / 1024)).toFixed(4)),
        totalTime: newTotalTime,
        avgTime: Math.round(newTotalTime / totalCompleted)
      });
    } else {
      updateNetworkMetrics({
        pending: Math.max(0, currentState.pending - 1),
        errors: currentState.errors + 1,
        totalTime: newTotalTime,
        avgTime: Math.round(newTotalTime / totalCompleted)
      });
    }

    return response;
  } catch (error) {
    const duration = performance.now() - startTime;
    const currentState = useEmailStore.getState().networkMetrics;
    updateNetworkMetrics({
      pending: Math.max(0, currentState.pending - 1),
      errors: currentState.errors + 1,
      totalTime: currentState.totalTime + duration,
      avgTime: Math.round((currentState.totalTime + duration) / (currentState.success + currentState.errors + 1))
    });
    throw error;
  }
};

// ─── XHR INTERCEPTION ────────────────────────────────────────────────────────
const XHR = window.XMLHttpRequest;
const originalOpen = XHR.prototype.open;
const originalSend = XHR.prototype.send;

XHR.prototype.open = function(method, url) {
  this._method = method;
  this._url = url;
  this._startTime = performance.now();
  return originalOpen.apply(this, arguments);
};

XHR.prototype.send = function(body) {
  const { updateNetworkMetrics } = useEmailStore.getState();
  const metrics = useEmailStore.getState().networkMetrics;
  
  updateNetworkMetrics({
    requests: metrics.requests + 1,
    pending: metrics.pending + 1
  });

  // Estimate Request Size
  let sentBytes = (this._url || '').length;
  if (body) {
    if (typeof body === 'string') sentBytes += body.length;
    else if (body instanceof Blob) sentBytes += body.size;
  }
  updateNetworkMetrics({
    sentKb: parseFloat((useEmailStore.getState().networkMetrics.sentKb + (sentBytes / 1024)).toFixed(4))
  });

  this.addEventListener('load', function() {
    const duration = performance.now() - this._startTime;
    const currentState = useEmailStore.getState().networkMetrics;
    
    let fetchedBytes = 0;
    try {
      if (this.responseType === '' || this.responseType === 'text') fetchedBytes = (this.responseText || '').length;
      else if (this.response) fetchedBytes = this.response.byteLength || this.response.size || 0;
    } catch (e) {}

    const isSuccess = this.status >= 200 && this.status < 300;
    const newTotalTime = currentState.totalTime + duration;
    const totalCompleted = currentState.success + currentState.errors + 1;

    updateNetworkMetrics({
      pending: Math.max(0, currentState.pending - 1),
      success: isSuccess ? currentState.success + 1 : currentState.success,
      errors: !isSuccess ? currentState.errors + 1 : currentState.errors,
      fetchedKb: parseFloat((currentState.fetchedKb + (fetchedBytes / 1024)).toFixed(4)),
      totalTime: newTotalTime,
      avgTime: Math.round(newTotalTime / totalCompleted)
    });
  });

  this.addEventListener('error', function() {
    const duration = performance.now() - this._startTime;
    const currentState = useEmailStore.getState().networkMetrics;
    updateNetworkMetrics({
      pending: Math.max(0, currentState.pending - 1),
      errors: currentState.errors + 1,
      totalTime: currentState.totalTime + duration,
      avgTime: Math.round((currentState.totalTime + duration) / (currentState.success + currentState.errors + 1))
    });
  });

  return originalSend.apply(this, arguments);
};
