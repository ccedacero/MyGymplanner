#!/usr/bin/env python3
import urllib.request
import json
import os

# GitHub API base URL
REPO = "ccedacero/MyGymplanner"
API_BASE = f"https://api.github.com/repos/{REPO}"

# Create transcribe folder
os.makedirs("transcribe", exist_ok=True)

def fetch_json(url):
    """Fetch JSON data from URL"""
    with urllib.request.urlopen(url) as response:
        return json.loads(response.read().decode())

def fetch_text(url):
    """Fetch text content from URL"""
    try:
        with urllib.request.urlopen(url) as response:
            return response.read().decode('utf-8')
    except Exception as e:
        return f"[Error fetching content: {e}]"

# Get all open PRs
prs = fetch_json(f"{API_BASE}/pulls?state=open&per_page=100")

print(f"Found {len(prs)} open PRs")

for pr in prs:
    pr_number = pr['number']
    pr_title = pr['title']

    # Sanitize filename
    safe_title = "".join(c if c.isalnum() or c in (' ', '-', '_') else '_' for c in pr_title)
    safe_title = safe_title.replace(' ', '_')[:100]  # Limit length
    filename = f"transcribe/PR_{pr_number}_{safe_title}.txt"

    print(f"\nProcessing PR #{pr_number}: {pr_title}")

    # Get files changed in this PR
    files = fetch_json(f"{API_BASE}/pulls/{pr_number}/files")

    print(f"  Found {len(files)} changed file(s)")

    # Merge all files into one
    merged_content = f"=== PULL REQUEST #{pr_number} ===\n"
    merged_content += f"Title: {pr_title}\n"
    merged_content += f"URL: {pr['html_url']}\n"
    merged_content += f"Files changed: {len(files)}\n"
    merged_content += "=" * 80 + "\n\n"

    for file_info in files:
        file_path = file_info['filename']
        print(f"    - {file_path}")

        merged_content += f"\n{'=' * 80}\n"
        merged_content += f"FILE: {file_path}\n"
        merged_content += f"{'=' * 80}\n\n"

        # Get the file content from the raw URL
        if 'raw_url' in file_info:
            raw_content = fetch_text(file_info['raw_url'])
            merged_content += raw_content
        else:
            # If raw_url not available, use patch
            if 'patch' in file_info:
                merged_content += f"[PATCH/DIFF CONTENT]:\n{file_info['patch']}\n"
            else:
                merged_content += "[No content available]\n"

        merged_content += "\n\n"

    # Write merged content to file
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(merged_content)

    print(f"  ✓ Saved to: {filename}")

print(f"\n✅ All PRs processed! Files saved in 'transcribe/' folder")
