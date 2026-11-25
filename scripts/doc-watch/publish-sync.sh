#!/usr/bin/env bash
set -euo pipefail

repo=${GITHUB_REPOSITORY:?}
base=$(git rev-parse HEAD)
branch="doc-watch/sync-upstream"
reviewer=${DOC_WATCH_REVIEWER:-dongjiang1989}
bot='github-actions[bot]'
git config user.name "$bot"
git config user.email '41898282+github-actions[bot]@users.noreply.github.com'

git add -- docs/guide docs/en/guide docs/public/astudio docs/public/loomy docs/public/astronclaw docs/public/docs-index.json scripts/doc-watch/baseline
git diff --cached --check
if git diff --cached --quiet; then exit 0; fi
if git diff --cached --quiet -- docs/guide docs/en/guide docs/public/astudio/images; then
  echo 'No tutorial content or illustrations changed; refusing baseline-only publication.' >&2
  exit 1
fi

# Reuse the open PR even when main advances between scheduled runs.
pr=$(gh pr list --repo "$repo" --head "$branch" --base main --state open --json number --jq '.[0].number // empty')
parent="$base"
parents=(-p "$base")
remote=$(git ls-remote --heads origin "refs/heads/$branch")
if [[ -n "$remote" ]]; then
  git fetch origin "refs/heads/$branch"
  parent=$(git rev-parse FETCH_HEAD)
  while read -r author; do
    [[ "$author" == '41898282+github-actions[bot]@users.noreply.github.com' ]] || exit 1
  done < <(git log --format=%ae "$base..$parent")
  if git merge-base --is-ancestor "$parent" "$base"; then
    parent="$base"
  elif git merge-base --is-ancestor "$base" "$parent"; then
    parents=(-p "$parent")
  else
    parents=(-p "$base" -p "$parent")
  fi
fi
[[ $(gh api "repos/$repo/git/ref/heads/main" --jq '.object.sha') == "$base" ]]
tree=$(git write-tree)
head="$parent"
if [[ $(git rev-parse "$parent^{tree}") != "$tree" || ${#parents[@]} -gt 2 ]]; then
  head=$(git commit-tree "$tree" "${parents[@]}" -m 'docs: synchronize upstream tutorials' -m 'Signed-off-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>')
  git push origin "$head:refs/heads/$branch"
fi
issue=$(gh issue list --repo "$repo" --state open --label doc-watch --limit 100 --json number,title | jq -er 'map(select(.title=="[doc-watch] 上游文档有新增内容待补全")) | first.number')
cp doc-watch-report.md doc-watch-pr.md
printf '\nCloses #%s\n' "$issue" >> doc-watch-pr.md
if [[ -z "$pr" ]]; then
  url=$(gh pr create --repo "$repo" --base main --head "$branch" --title 'docs: 同步上游教程与官方配图' --body-file doc-watch-pr.md --reviewer "$reviewer")
  pr=${url##*/}
else
  gh pr edit "$pr" --repo "$repo" --body-file doc-watch-pr.md --add-reviewer "$reviewer"
fi
gh api "repos/$repo/pulls/$pr" | jq -e --arg repo "$repo" --arg head "$head" --arg reviewer "$reviewer" '
  .user.login=="github-actions[bot]" and .head.repo.full_name==$repo and .head.sha==$head
  and .base.ref=="main" and any(.requested_reviewers[]; .login==$reviewer)' >/dev/null

# A token-created push may not trigger push CI. Dispatch read-only CI on this
# exact branch and wait for its result before checking the PR's other statuses.
gh workflow run ci.yml --repo "$repo" --ref "$branch"
run=''
for attempt in {1..30}; do
  run=$(gh run list --repo "$repo" --workflow ci.yml --event workflow_dispatch --branch "$branch" --commit "$head" --limit 1 --json databaseId --jq '.[0].databaseId // empty')
  [[ -z "$run" ]] || break
  sleep 5
done
[[ -n "$run" ]]
gh run watch "$run" --repo "$repo" --exit-status
# Wait for reported status contexts, including CLA and preview integrations.
for attempt in {1..60}; do
  state=$(gh pr view "$pr" --repo "$repo" --json statusCheckRollup,mergeStateStatus,reviewDecision)
  jq -e '.reviewDecision!="CHANGES_REQUESTED" and all(.statusCheckRollup[]; ((.state // .conclusion) | IN("FAILURE","ERROR","CANCELLED","TIMED_OUT","ACTION_REQUIRED")) | not)' <<<"$state" >/dev/null
  if jq -e '.mergeStateStatus=="CLEAN" and all(.statusCheckRollup[]; (.state // .conclusion) | IN("SUCCESS","SKIPPED","NEUTRAL"))' <<<"$state" >/dev/null; then break; fi
  [[ "$attempt" != 60 ]] || exit 1
  sleep 10
done
[[ $(gh api "repos/$repo/git/ref/heads/main" --jq '.object.sha') == "$base" ]]
gh pr merge "$pr" --repo "$repo" --merge --match-head-commit "$head"
gh pr view "$pr" --repo "$repo" --json state --jq .state | grep -Fx MERGED
gh workflow run deploy.yml --repo "$repo" --ref main
