import re

file_path = "c:/dev/antigravity-projects/PMM/src/store/useEmailStore.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Inject processHRInsight
new_func = r"""
/**
 * Processes HR emails to extract candidate and hiring data.
 */
async function processHRInsight(emails) {
  let postingsCount = 4; // Mock baseline
  let appliedCount = 0;
  let shortlistedCount = 0;
  let interviewsCount = 0;
  let offersCount = 0;
  let offersAcceptedCount = 0;
  let rejectedCount = 0;
  
  const tableData = [];
  const weeklyMap = {};
  const rolesMap = {};
  const activityFeed = [];

  const sortedEmails = [...emails].sort((a, b) => new Date(a.date) - new Date(b.date));
  const seenIds = new Set();
  
  for (const email of sortedEmails) {
    if (seenIds.has(email.id) || email.isPlaceholder) continue;
    seenIds.add(email.id);

    const text = (email.subject + ' ' + (email.preview || '')).toLowerCase();
    
    // Simple heuristic to ignore our own job applications and only count HR receiving side
    if (!text.includes('candidate') && !text.includes('applicant') && !text.includes('applied for') && !text.includes('new application')) continue;

    let candidateName = 'Unknown Candidate';
    const nameMatch = email.subject.match(/from ([a-zA-Z\s]+)|([a-zA-Z\s]+) has applied|application from ([a-zA-Z\s]+)/i);
    if (nameMatch) {
      candidateName = (nameMatch[1] || nameMatch[2] || nameMatch[3] || 'Candidate').trim();
    }
    
    let roleName = 'Open Position';
    const roleMatch = email.subject.match(/(?:for(?: the)?)\s+(.+?)(?:\s+position|\s+role|\s+at|$)/i);
    if (roleMatch && roleMatch[1] && roleMatch[1].length < 30) {
      roleName = roleMatch[1].trim();
    }
    
    // Roles chart data
    if (!rolesMap[roleName]) rolesMap[roleName] = 0;
    rolesMap[roleName]++;

    let stage = 'Applied';
    let status = 'Pending Review';
    let recruiterName = 'System';
    
    let isApplied = false, isShortlisted = false, isInterview = false, isOffer = false, isOfferAccepted = false, isRejected = false;

    if (text.includes('offer accepted')) {
      stage = 'Offer'; status = 'Accepted'; isOfferAccepted = true; offersAcceptedCount++; offersCount++;
    } else if (text.includes('offer')) {
      stage = 'Offer'; status = 'Sent'; isOffer = true; offersCount++;
    } else if (text.includes('reject') || text.includes('not selected')) {
      stage = 'Rejected'; status = 'Closed'; isRejected = true; rejectedCount++;
    } else if (text.includes('interview')) {
      stage = 'Interview'; status = 'Scheduled'; isInterview = true; interviewsCount++;
    } else if (text.includes('shortlist') || text.includes('moving forward')) {
      stage = 'Shortlisted'; status = 'Screening'; isShortlisted = true; shortlistedCount++;
    } else {
      isApplied = true; appliedCount++;
    }

    const dStr = email.date ? email.date.split('T')[0] : new Date().toISOString().split('T')[0];
    
    tableData.push({
      id: email.id,
      name: candidateName,
      role: roleName,
      date: dStr,
      stage,
      recruiter: recruiterName,
      status
    });

    const d = new Date(dStr);
    const dow = d.getDay();
    const diff = d.getDate() - dow + (dow === 0 ? -6 : 1);
    const weekStart = new Date(d.setDate(diff)).toISOString().split('T')[0];
    
    if (!weeklyMap[weekStart]) weeklyMap[weekStart] = { name: weekStart, applied: 0, interviews: 0, offers: 0 };
    if (isApplied) weeklyMap[weekStart].applied++;
    if (isInterview) weeklyMap[weekStart].interviews++;
    if (isOffer || isOfferAccepted) weeklyMap[weekStart].offers++;

    const dateObj = new Date(email.date);
    activityFeed.push({
      id: email.id,
      type: `${stage} Activity`,
      text: `${candidateName} - ${stage} for ${roleName}`,
      time: isNaN(dateObj.getTime()) ? dStr : dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    });
  }

  const weeklyData = Object.values(weeklyMap).sort((a,b) => new Date(a.name) - new Date(b.name)).slice(-8);
  const rolesDataArr = Object.entries(rolesMap).map(([name, value]) => ({ name: name.substring(0, 15), value })).sort((a,b) => b.value - a.value).slice(0, 5);

  return {
    postingsCount,
    appliedCount,
    shortlistedCount,
    interviewsCount,
    offersCount,
    offersAcceptedCount,
    rejectedCount,
    tableData: tableData.reverse(),
    weeklyData,
    rolesData: rolesDataArr,
    activityFeed: activityFeed.reverse().slice(0, 15)
  };
}
"""
content = re.sub(r'(async function processJobSearchInsight\s*\(\s*emails\s*\)\s*\{)', new_func.replace('\\', '\\\\') + r'\n\1', content)

# 2. Setup initial state for hrStats
state_code = r"""
  hrStats: { postingsCount: 0, appliedCount: 0, shortlistedCount: 0, interviewsCount: 0, offersCount: 0, offersAcceptedCount: 0, rejectedCount: 0, tableData: [], weeklyData: [], rolesData: [], activityFeed: [] },
  jobSearchStats:
"""
content = re.sub(r'\s*jobSearchStats:', state_code, content)

# 3. Add to fetchEmails
content = content.replace("jobSearchStats\n      ] = await Promise.all([", "jobSearchStats,\n        hrStats\n      ] = await Promise.all([")

from_text = """processJobSearchInsight(dynamicSourceEmails)
      ]);"""
to_text = """processJobSearchInsight(dynamicSourceEmails),
        processHRInsight(hrEmailDetails)
      ]);"""
content = content.replace(from_text, to_text)

content = content.replace("jobSearchStats,\n        subscriptions", "jobSearchStats,\n        hrStats,\n        subscriptions")

# We also need to add hrEmailDetails to fetchEmails
# Around line 1184 (fetchEmails Promise.all for different queries):
fetch_query = r"""
        emailService.getEmails(accessToken, user.email, 'subject:(job OR career OR hiring OR interview OR application OR applied OR offer OR rejected OR "next steps")'),
"""
fetch_query_new = r"""
        emailService.getEmails(accessToken, user.email, 'subject:(job OR career OR hiring OR interview OR application OR applied OR offer OR rejected OR "next steps")'),
        emailService.getEmails(accessToken, user.email, 'subject:(candidate OR applicant OR "applied for" OR "new application" OR "interview scheduled" OR "offer accepted")'),
"""
content = content.replace(fetch_query, fetch_query_new)

# Extract variable from results
fetch_res = r"""
        paymentAppEmailDetails,
        dynamicSourceEmails
      ] = results;
"""
fetch_res_new = r"""
        paymentAppEmailDetails,
        dynamicSourceEmails,
        hrEmailDetails
      ] = results;
"""
content = content.replace(fetch_res, fetch_res_new)


# 4. Add to syncStats
sync_query = r"""
        () => emailService.getEmails(accessToken, user.email, 'subject:(job OR career OR hiring OR interview OR application OR applied OR offer OR rejected OR "next steps")', 50)
      ];
"""
sync_query_new = r"""
        () => emailService.getEmails(accessToken, user.email, 'subject:(job OR career OR hiring OR interview OR application OR applied OR offer OR rejected OR "next steps")', 50),
        () => emailService.getEmails(accessToken, user.email, 'subject:(candidate OR applicant OR "applied for" OR "new application" OR "interview scheduled" OR "offer accepted")', 50)
      ];
"""
content = content.replace(sync_query, sync_query_new)

sync_res = r"""
        paymentAppEmailDetails,
        jobSearchEmailDetails
      ] = discoveryResults;
"""
sync_res_new = r"""
        paymentAppEmailDetails,
        jobSearchEmailDetails,
        hrEmailDetails
      ] = discoveryResults;
"""
content = content.replace(sync_res, sync_res_new)

content = content.replace("newJobSearchStats\n      ] = await Promise.all([", "newJobSearchStats,\n        newHrStats\n      ] = await Promise.all([")

sync_proc = r"""
        processJobSearchInsight(jobSearchEmailDetails)
      ]);
"""
sync_proc_new = r"""
        processJobSearchInsight(jobSearchEmailDetails),
        processHRInsight(hrEmailDetails)
      ]);
"""
content = content.replace(sync_proc, sync_proc_new)

sync_save = r"""
        jobSearchStats: newJobSearchStats,
        error: null
"""
sync_save_new = r"""
        jobSearchStats: newJobSearchStats,
        hrStats: newHrStats,
        error: null
"""
content = content.replace(sync_save, sync_save_new)

# 5. Add hrStats export to getStats
content = re.sub(r'jobSearch:\s*get\(\)\.jobSearchStats,', 'jobSearch: get().jobSearchStats,\n      hr: get().hrStats,\n', content, flags=re.DOTALL)


with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("useEmailStore HR patches applied v2.")
