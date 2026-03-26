import os
import re

components = {
    'Overview.jsx': {
        'target': r'(<p className="text-lg text-\[var\(--text-secondary\)\] font-medium tracking-tight">Your personal mail ecosystem is looking healthy today.</p>)',
        'replace': r'\1\n          <div className="mt-4"><SyncStatus /></div>'
    },
    'Personal.jsx': {
        'target': r'(<p className="text-lg text-\[var\(--text-secondary\)\] font-medium tracking-tight">Deep-scan analysis of your \{user\?\.displayName \|\| \'digital\'\} footprint.</p>)',
        'replace': r'\1\n          <div className="mt-4"><SyncStatus /></div>'
    },
    'Dashboard.jsx': {
        'target': r'(<p className="text-lg text-\[var\(--text-secondary\)\] font-medium tracking-tight">Real-time data visualization.*?</p>)\s*<div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-\[10px\] font-black uppercase tracking-widest border border-emerald-500/20">\s*<span className="relative flex h-2 w-2">\s*<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>\s*<span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>\s*</span>\s*Live\s*</div>',
        'replace': r'\1\n            <SyncStatus />'
    },
    'HRTracker.jsx': {
        'target': r'(<p className="text-lg text-\[var\(--text-secondary\)\] font-medium tracking-tight">Real-time recruitment and candidate pipeline.</p>)\s*<div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-\[10px\] font-black uppercase tracking-widest border border-emerald-500/20">\s*<span className="relative flex h-2 w-2">\s*<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>\s*<span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>\s*</span>\s*Live\s*</div>',
        'replace': r'\1\n            <SyncStatus />'
    },
    'EmailList.jsx': {
         'target': r'(<span className="px-3 py-1 bg-primary-500/10 text-primary-500 rounded-lg text-xs font-black uppercase tracking-wider">\s*\{emails\.length\} Messages\s*</span>)\s*\{\(type === \'inbox\' \|\| type === \'sent\'\) && \(\s*<>\s*<div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-\[10px\] font-black uppercase tracking-widest border border-emerald-500/20">.*?</div>',
         'replace': r'\1\n            {(type === \'inbox\' || type === \'sent\') && (\n              <>\n                <SyncStatus />'
    }
}

base_dir = "c:/dev/antigravity-projects/PMM/src/pages"

for filename, spec in components.items():
    filepath = os.path.join(base_dir, filename)
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Add import
    if "import SyncStatus" not in content:
        content = re.sub(r"(import React.*?;\n)", r"\1import SyncStatus from '../components/SyncStatus';\n", content, count=1)
    
    # 2. Add Component usage
    content = re.sub(spec['target'], spec['replace'], content, flags=re.DOTALL)
    
    # Optional cleanup for EmailList
    if filename == "EmailList.jsx":
        # remove old "Synchronized Xm ago" hardcoded span
        content = re.sub(r'<span className="text-sm text-\[var\(--text-secondary\)\] font-bold">Synchronized 2m ago</span>', '', content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Injected SyncStatus in 5 components.")
