import re

file_path = "c:/dev/antigravity-projects/PMM/src/store/useEmailStore.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update fetchEmails query
old_query = """() => emailService.getEmails(accessToken, user.email, 'subject:(job OR career OR hiring OR interview OR "application received")'),"""
new_query = """() => emailService.getEmails(accessToken, user.email, 'subject:(job OR career OR hiring OR interview OR application OR applied OR offer OR rejected OR "next steps")'),"""
content = content.replace(old_query, new_query)


# 2. Update syncStats discoveryTasks
sync_query_insertion = """        () => emailService.getEmails(accessToken, user.email, '(from:(phonepe OR paytm OR google) OR subject:("paid to" OR "sent rs" OR "paid rs"))', 100),
        () => emailService.getEmails(accessToken, user.email, 'subject:(job OR career OR hiring OR interview OR application OR applied OR offer OR rejected OR "next steps")', 50)
      ];"""
content = content.replace("""        () => emailService.getEmails(accessToken, user.email, '(from:(phonepe OR paytm OR google) OR subject:("paid to" OR "sent rs" OR "paid rs"))', 100)\n      ];""", sync_query_insertion)

# 3. Update syncStats discoveryResults
old_results = """        paymentAppEmailDetails
      ] = discoveryResults;"""
new_results = """        paymentAppEmailDetails,
        jobSearchEmailDetails
      ] = discoveryResults;"""
content = content.replace(old_results, new_results)

# 4. Pass it to processJobSearchInsight
old_process = """        processJobSearchInsight([])
      ]);"""
new_process = """        processJobSearchInsight(jobSearchEmailDetails)
      ]);"""
content = content.replace(old_process, new_process)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed syncStats empty array bug and broadened queries.")
