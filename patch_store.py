import sys
import re

file_path = "c:/dev/antigravity-projects/PMM/src/store/useEmailStore.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Insert processJobSearchInsight
new_func = """
/**
 * Processes job search emails to extract applications, interviews, rejections, offers.
 */
async function processJobSearchInsight(emails) {
  let applicationsCount = 0;
  let interviewsCount = 0;
  let offersCount = 0;
  let rejectionsCount = 0;
  let followUpsCount = 0;
  const tableData = [];
  const weeklyMap = {};

  const confirmedEmails = emails.filter(e => !e.isPlaceholder);
  const sortedEmails = [...confirmedEmails].sort((a, b) => new Date(a.date) - new Date(b.date));
  const seenIds = new Set();
  
  for (const email of sortedEmails) {
    if (seenIds.has(email.id)) continue;
    seenIds.add(email.id);

    const textToSearch = (email.subject + ' ' + (email.preview || '') + ' ' + (email.content || '')).toLowerCase();
    const sender = (email.sender || '').toLowerCase();
    const subject = email.subject || '';

    let company = 'Unknown';
    const domainMatch = sender.match(/@([^@]+\\.[^@]+)/);
    if (domainMatch && domainMatch[1]) {
      company = domainMatch[1].split('.')[0];
      company = company.charAt(0).toUpperCase() + company.slice(1);
    }
    if (['Linkedin', 'Naukri', 'Indeed', 'Greenhouse', 'Lever', 'Workday'].includes(company)) {
      const atMatch = textToSearch.match(/at\\s+([a-zA-Z0-9\\s]+?)(?:\\s+for|\\s+is|\\.|\\n|$)/i);
      if (atMatch && atMatch[1]) company = atMatch[1].trim().split(' ')[0];
    }

    let role = 'Job Application';
    const roleMatch = subject.match(/(?:for|role|position)(?:\\s+of)?\\s+([a-zA-Z0-9\\s\\-\\/]+?)(?:\\s+at|\\s+with|\\s+application)/i);
    if (roleMatch && roleMatch[1]) role = roleMatch[1].trim();
    
    let stage = 'Applied';
    let status = 'Pending';
    
    if (/offer|congratulations.*offer|extend.*offer/i.test(textToSearch) && !/rejection|unfortunately/i.test(textToSearch)) {
      stage = 'Offer';
      status = 'Accepted';
      offersCount++;
    } else if (/reject|unfortunately|not moving forward|other candidates|not selected/i.test(textToSearch)) {
      stage = 'Rejected';
      status = 'Rejected';
      rejectionsCount++;
    } else if (/interview|scheduling|availability|next steps.*call|chat with/i.test(textToSearch)) {
      stage = 'Interview';
      status = 'In Progress';
      interviewsCount++;
    } else if (/follow up|checking in|following up/i.test(textToSearch)) {
      stage = 'Follow-up';
      status = 'In Progress';
      followUpsCount++;
    } else {
      applicationsCount++;
    }

    const emailDateStr = email.date ? email.date.split('T')[0] : new Date().toISOString().split('T')[0];
    
    tableData.push({
      id: email.id,
      role: role.slice(0, 30),
      company: company.slice(0, 20),
      date: emailDateStr,
      stage,
      status
    });

    const d = new Date(emailDateStr);
    const dow = d.getDay();
    const diff = d.getDate() - dow + (dow === 0 ? -6 : 1);
    const weekStart = new Date(d.setDate(diff)).toISOString().split('T')[0];
    
    if (!weeklyMap[weekStart]) weeklyMap[weekStart] = { name: weekStart, applications: 0, interviews: 0 };
    if (stage === 'Applied' || stage === 'Rejected') weeklyMap[weekStart].applications++;
    if (stage === 'Interview') weeklyMap[weekStart].interviews++;
  }

  const weeklyData = Object.values(weeklyMap).sort((a,b) => new Date(a.name) - new Date(b.name)).slice(-8);

  return { applicationsCount, interviewsCount, offersCount, rejectionsCount, followUpsCount, tableData: tableData.reverse(), weeklyData };
}

"""
content = re.sub(r'(async function processPaymentAppInsight\s*\(\s*emails\s*\)\s*\{)', new_func + r'\1', content)

# 2. Add to initial state
state_code = """
  jobSearchStats: { applicationsCount: 0, interviewsCount: 0, offersCount: 0, rejectionsCount: 0, followUpsCount: 0, tableData: [], weeklyData: [] },
  careerSources: [],
"""
content = re.sub(r'\s*careerSources:\s*\[\],\s*// Dynamic job sources list', state_code, content)

# 3. Add to fetchEmails
content = content.replace("paymentAppSpend\n      ] = await Promise.all([", "paymentAppSpend,\n        jobSearchStats\n      ] = await Promise.all([")
content = content.replace("processPaymentAppInsight(paymentAppEmailDetails)\n      ]);", "processPaymentAppInsight(paymentAppEmailDetails),\n        processJobSearchInsight(dynamicSourceEmails)\n      ]);")
content = content.replace("paymentAppSpend,\n        subscriptions", "paymentAppSpend,\n        jobSearchStats,\n        subscriptions")

# 4. Add to syncStats
content = content.replace("newPaymentAppSpend\n      ] = await Promise.all([", "newPaymentAppSpend,\n        newJobSearchStats\n      ] = await Promise.all([")
content = content.replace("processPaymentAppInsight(paymentAppEmailDetails)\n      ]);", "processPaymentAppInsight(paymentAppEmailDetails),\n        processJobSearchInsight([])\n      ]);")
content = content.replace("paymentAppSpend: newPaymentAppSpend,\n        error: null", "paymentAppSpend: newPaymentAppSpend,\n        jobSearchStats: newJobSearchStats,\n        error: null")

# 5. Update getStats jobSearch
js_stats = """
      jobSearch: get().jobSearchStats,
"""
# Replace the old jobSearch object with the new one
content = re.sub(r'jobSearch:\s*\{\s*total:.*?sources: careerSources\s*\},', 'jobSearch: get().jobSearchStats,', content, flags=re.DOTALL)


with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updates completed.")
