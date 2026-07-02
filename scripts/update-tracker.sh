#!/usr/bin/env bash
#
# update-tracker.sh
#
# WHAT THIS DOES (in plain words):
# Walks through every file listed in TRACKER.md, asks git "has this file
# ever appeared in a commit?", and rewrites the checkbox accordingly.
#
# WHY THIS IS TRUSTWORTHY:
# It never asks YOU whether you committed something. It asks git directly,
# using `git log -- <path>`. If that returns nothing, the file has never
# been committed. There's no way to "cheat" this file into looking done
# when it isn't.
#
# HOW TO RUN:
#   cd khetibahi
#   bash scripts/update-tracker.sh
#
# Run it any time — after every commit, or once a day, whatever you like.

set -euo pipefail

TRACKER_FILE="TRACKER.md"

if [ ! -f "$TRACKER_FILE" ]; then
  echo "Error: $TRACKER_FILE not found. Run this from the khetibahi project root."
  exit 1
fi

if [ ! -d ".git" ]; then
  echo "Error: no .git folder found here. Run 'git init' first, or cd into the right folder."
  exit 1
fi

TMP_FILE="$(mktemp)"
committed_count=0
pending_count=0

while IFS= read -r line; do
  # Only touch lines that look like checklist entries: "- ⬜ path" or "- ✅ path"
  if [[ "$line" =~ ^-\ (⬜|✅)\ (.+)$ ]]; then
    filepath="${BASH_REMATCH[2]}"
    # Ask git: has this exact file ever been part of a commit?
    if git log --oneline -- "$filepath" 2>/dev/null | grep -q .; then
      echo "- ✅ $filepath" >> "$TMP_FILE"
      committed_count=$((committed_count + 1))
    else
      echo "- ⬜ $filepath" >> "$TMP_FILE"
      pending_count=$((pending_count + 1))
    fi
  else
    echo "$line" >> "$TMP_FILE"
  fi
done < "$TRACKER_FILE"

mv "$TMP_FILE" "$TRACKER_FILE"

total=$((committed_count + pending_count))
echo ""
echo "Tracker updated."
echo "  Committed: $committed_count / $total"
echo "  Pending:   $pending_count / $total"
echo ""
echo "Next files still pending (pick 2-3 for today):"
grep "^- ⬜" "$TRACKER_FILE" | head -5