const GMAIL_API_BASE = 'https://www.googleapis.com/gmail/v1/users/me';

const parseHeader = (headers, name) => {
  const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  return header ? header.value : '';
};

const getEmailType = (labelIds) => {
  if (labelIds.includes('SPAM')) return 'spam';
  if (labelIds.includes('SENT')) return 'outgoing';
  return 'incoming';
};

const getCategory = (labelIds) => {
  if (labelIds.includes('SPAM')) return 'spam';
  if (labelIds.includes('CATEGORY_PROMOTIONS')) return 'promotions';
  if (labelIds.includes('CATEGORY_UPDATES')) return 'updates';
  return 'primary';
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url, options, retries = 3, backoff = 2000) {
  try {
    const response = await fetch(url, options);
    if (response.status === 429 && retries > 0) {
      console.warn(`Rate limited (429) at ${url}. Retrying in ${backoff}ms... (${retries} left)`);
      await wait(backoff);
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      await wait(backoff);
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw error;
  }
}

// Helper to handle fetch responses and throw on errors
async function handleResponse(response, context = '') {
  if (!response.ok) {
    let errorMsg = response.statusText;
    try {
      const errorData = await response.json();
      errorMsg = errorData.error?.message || errorMsg;
    } catch (e) { /* ignore parse error */ }
    
    const fullError = new Error(`Gmail API error ${response.status} (${context}): ${errorMsg}`);
    fullError.status = response.status;
    throw fullError;
  }
  return response.json();
}

// Helper to run promises in limited concurrency batches
const batchPromises = async (tasks, batchSize = 3) => {
  const results = [];
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(task => task().catch(err => {
      // Don't log expected auth errors to console to avoid noise (the store handles them)
      if (err.status !== 401 && err.status !== 403) {
        console.error('Batch task error:', err);
      }
      return null;
    })));
    results.push(...batchResults);
    if (i + batchSize < tasks.length) await wait(200);
  }
  return results;
};

export const emailService = {
  batchPromises,
  getProfileStats: async (accessToken) => {
    const response = await fetchWithRetry(`${GMAIL_API_BASE}/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return handleResponse(response, 'getProfileStats');
  },

  getPersonalInfo: async (accessToken) => {
    const response = await fetchWithRetry(`https://people.googleapis.com/v1/people/me?personFields=names,birthdays,genders`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return handleResponse(response, 'getPersonalInfo');
  },

  getLabels: async (accessToken) => {
    const response = await fetchWithRetry(`${GMAIL_API_BASE}/labels`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const data = await handleResponse(response, 'getLabels');
    
    const importantLabels = ['INBOX', 'SENT', 'DRAFT', 'SPAM', 'TRASH', 'STARRED', 'IMPORTANT'];
    const detailTasks = data.labels
      .filter(label => importantLabels.includes(label.id))
      .map(l => () => fetchWithRetry(`${GMAIL_API_BASE}/labels/${l.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      }).then(res => res.ok ? res.json() : null));

    const results = await batchPromises(detailTasks, 2);
    return results.filter(r => r !== null);
  },

  getSearchCount: async (accessToken, query, limit = 2000) => {
    let count = 0;
    let pageToken = null;
    let pages = 0;
    const maxPages = limit / 500;
    const refinedQuery = `${query} -in:trash -in:spam`;

    do {
      const url = `${GMAIL_API_BASE}/messages?q=${encodeURIComponent(refinedQuery)}&maxResults=500${pageToken ? `&pageToken=${pageToken}` : ''}`;
      const response = await fetchWithRetry(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await handleResponse(response, 'getSearchCount');
      
      if (data.messages) {
        count += data.messages.length;
      }
      pageToken = data.nextPageToken;
      pages++;
      if (pageToken && pages >= maxPages) {
        return Math.max(count, data.resultSizeEstimate || 0);
      }
    } while (pageToken && pages < maxPages);

    return count;
  },

  getEmails: async (accessToken, userEmail, customQuery = null, detailLimit = 20, listLimit = 100) => {
    const queryParam = customQuery ? `&q=${encodeURIComponent(customQuery)}` : '';
    const url = `${GMAIL_API_BASE}/messages?maxResults=${listLimit}${queryParam}`;
    // console.log(`[Gmail API] GET /messages | Query: ${customQuery || 'Default (Latest)'}`);

    const listResponse = await fetchWithRetry(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const listData = await handleResponse(listResponse, 'getEmails');
    
    if (!listData.messages || listData.messages.length === 0) {
      return [];
    }

    const targetMessages = listData.messages.slice(0, detailLimit);
    const detailTasks = targetMessages.map(msg => () => fetchWithRetry(`${GMAIL_API_BASE}/messages/${msg.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    }).then(res => res.ok ? res.json() : null));

    const emailDetails = await batchPromises(detailTasks, 5);
    const transformed = emailDetails
      .filter(msg => msg && msg.payload && msg.payload.headers)
      .map(msg => {
        const headers = msg.payload.headers;
        const getBody = (payload) => {
          let body = '';
          if (payload.parts) {
            // Prefer HTML if available
            const htmlPart = payload.parts.find(p => p.mimeType === 'text/html');
            const plainPart = payload.parts.find(p => p.mimeType === 'text/plain');
            
            if (htmlPart) {
              body = htmlPart.body?.data || '';
            } else if (plainPart) {
              body = plainPart.body?.data || '';
            } else {
              // Recursively search in nested parts
              for (const part of payload.parts) {
                const nestedBody = getBody(part);
                if (nestedBody) return nestedBody;
              }
            }
          } else {
            body = payload.body?.data || '';
          }
          return body;
        };

        const bodyData = getBody(msg.payload);
        const decodedBody = bodyData 
          ? b64DecodeUnicode(bodyData.replace(/-/g, '+').replace(/_/g, '/'))
          : '';

        const hasAttachments = msg.payload.parts?.some(p => p.body?.attachmentId) || !!msg.payload.body?.attachmentId;

        return {
          id: msg.id,
          sender: parseHeader(headers, 'From'),
          recipient: parseHeader(headers, 'To'),
          subject: parseHeader(headers, 'Subject'),
          preview: msg.snippet,
          content: decodedBody,
          date: new Date(parseInt(msg.internalDate)).toISOString(),
          status: msg.labelIds?.includes('UNREAD') ? 'unread' : 'read',
          type: getEmailType(msg.labelIds || []),
          category: getCategory(msg.labelIds || []),
          starred: msg.labelIds?.includes('STARRED'),
          important: msg.labelIds?.includes('IMPORTANT'),
          hasAttachments,
          attachments: msg.payload.parts?.filter(p => p.body?.attachmentId).map(p => ({
            id: p.body.attachmentId,
            filename: p.filename,
            mimeType: p.mimeType
          })) || []
        };
      });

    return [
      ...transformed,
      ...listData.messages.slice(detailLimit).map(msg => ({ id: msg.id, isPlaceholder: true }))
    ];
  },
  
  getEmailById: async (accessToken, id) => {
    const response = await fetchWithRetry(`${GMAIL_API_BASE}/messages/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const msg = await handleResponse(response, 'getEmailById');
    const headers = msg.payload.headers;
    const body = msg.payload.parts 
      ? msg.payload.parts[0]?.body?.data 
      : msg.payload.body?.data;
    
    const decodedBody = body 
      ? b64DecodeUnicode(body.replace(/-/g, '+').replace(/_/g, '/'))
      : '';

    return {
      id: msg.id,
      sender: parseHeader(headers, 'From'),
      recipient: parseHeader(headers, 'To'),
      subject: parseHeader(headers, 'Subject'),
      preview: msg.snippet,
      content: decodedBody,
      date: new Date(parseInt(msg.internalDate)).toISOString(),
      status: msg.labelIds.includes('UNREAD') ? 'unread' : 'read',
      type: getEmailType(msg.labelIds),
      category: getCategory(msg.labelIds)
    };
  },
  
  markAsRead: async (accessToken, id) => {
    const response = await fetchWithRetry(`${GMAIL_API_BASE}/messages/${id}/removeLabels`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ removeLabelIds: ['UNREAD'] })
    });
    await handleResponse(response, 'markAsRead');
    return true;
  },

  toggleStar: async (accessToken, id, isStarred) => {
    const url = `${GMAIL_API_BASE}/messages/${id}/${isStarred ? 'removeLabels' : 'addLabels'}`;
    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ [isStarred ? 'removeLabelIds' : 'addLabelIds']: ['STARRED'] })
    });
    await handleResponse(response, `toggleStar:${isStarred ? 'remove' : 'add'}`);
    return true;
  },

  toggleImportant: async (accessToken, id, isImportant) => {
    const url = `${GMAIL_API_BASE}/messages/${id}/${isImportant ? 'removeLabels' : 'addLabels'}`;
    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ [isImportant ? 'removeLabelIds' : 'addLabelIds']: ['IMPORTANT'] })
    });
    await handleResponse(response, `toggleImportant:${isImportant ? 'remove' : 'add'}`);
    return true;
  },

  archiveEmail: async (accessToken, id) => {
    const response = await fetchWithRetry(`${GMAIL_API_BASE}/messages/${id}/removeLabels`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ removeLabelIds: ['INBOX'] })
    });
    await handleResponse(response, 'archiveEmail');
    return true;
  },

  deleteEmail: async (accessToken, id) => {
    const response = await fetchWithRetry(`${GMAIL_API_BASE}/messages/${id}/trash`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    await handleResponse(response, 'deleteEmail');
    return true;
  },

  getDailyStats: async (accessToken) => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const seconds = Math.floor(startOfToday.getTime() / 1000);
    const afterQuery = `after:${seconds}`;
    
    const queries = {
      todayTotal: afterQuery,
      todayRead: `${afterQuery} -is:unread`,
      todayUnread: `${afterQuery} is:unread`,
      todaySent: `is:sent ${afterQuery}`,
      todayDrafts: `is:draft ${afterQuery}`,
      todaySpam: `is:spam ${afterQuery}`,
      todayTrash: `is:trash ${afterQuery}`
    };

    const results = {};
    const queryTasks = Object.entries(queries).map(([key, query]) => async () => {
      const url = `${GMAIL_API_BASE}/messages?q=${encodeURIComponent(query)}&maxResults=500`;
      const response = await fetchWithRetry(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await handleResponse(response, `getDailyStats:${key}`);
      const realCount = data.messages ? data.messages.length : 0;
      let count = realCount;
      if (realCount === 500) {
        count = data.resultSizeEstimate || 500;
      }
      results[key] = count;
    });
    
    await batchPromises(queryTasks, 2);
    return results;
  },

  getSecurityAlerts: async (accessToken) => {
    const query = 'subject:("New sign-in" OR "Security alert")';
    const url = `${GMAIL_API_BASE}/messages?q=${encodeURIComponent(query)}&maxResults=20`;
    const response = await fetchWithRetry(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const data = await handleResponse(response, 'getSecurityAlerts');
    if (!data.messages) return [];

    // Use a small batch to get full details for these alerts
    const targetMessages = data.messages;
    const detailTasks = targetMessages.map(msg => () => fetchWithRetry(`${GMAIL_API_BASE}/messages/${msg.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    }).then(res => res.ok ? res.json() : null));

    const emailDetails = await emailService.batchPromises(detailTasks, 5);
    return emailDetails
      .filter(msg => msg && msg.payload && msg.payload.headers)
      .map(msg => {
        const headers = msg.payload.headers;
        return {
          id: msg.id,
          sender: parseHeader(headers, 'From'),
          subject: parseHeader(headers, 'Subject'),
          preview: msg.snippet,
          date: new Date(parseInt(msg.internalDate)).toISOString(),
          internalDate: msg.internalDate,
          status: msg.labelIds?.includes('UNREAD') ? 'unread' : 'read'
        };
      });
  },

  getRecentThreadDetails: async (accessToken, limit = 5, query = '') => {
    const qParam = query ? `&q=${encodeURIComponent(query)}` : '';
    const url = `${GMAIL_API_BASE}/threads?maxResults=${limit}${qParam}`;
    const response = await fetchWithRetry(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const data = await handleResponse(response, 'getRecentThreadDetails');
    if (!data.threads) return [];

    const details = [];
    for (const t of data.threads) {
      const tResp = await fetchWithRetry(`${GMAIL_API_BASE}/threads/${t.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (tResp.ok) {
        details.push(await tResp.json());
      }
      await wait(100);
    }
    return details;
  },

  getAttachment: async (accessToken, messageId, attachmentId) => {
    const url = `${GMAIL_API_BASE}/messages/${messageId}/attachments/${attachmentId}`;
    const response = await fetchWithRetry(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return await handleResponse(response, 'getAttachment');
  }
};

function b64DecodeUnicode(str) {
  try {
    return decodeURIComponent(atob(str).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  } catch (e) {
    return "";
  }
}
