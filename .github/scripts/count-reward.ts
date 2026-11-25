import { changeMonth, formatDate, makeDateRange } from "npm:web-utility";
import { $, YAML } from "npm:zx";

import { createDetachedCommit } from "./git.ts";
import { Reward } from "./type.ts";

$.verbose = true;

const rawTags =
  await $`git tag --list "reward-*" --format="%(refname:short) %(creatordate:short)"`;

const [startDate, endDate] = makeDateRange(
  formatDate(changeMonth(Date.now(), -1), "YYYY-MM"),
);
const rewardTags = rawTags.stdout
  .split("\n")
  .filter((line) => {
    const thisDate = new Date(line.split(/\s+/)[1]);

    return startDate <= thisDate && thisDate < endDate;
  })
  .map((line) => line.split(/\s+/)[0]);

let rawYAML = "";

for (const tag of rewardTags)
  rawYAML += (await $`git tag -l --format="%(contents)" ${tag}`) + "\n";

if (!rawYAML.trim()) {
  console.warn("No reward data is found for the last month.");

  process.exit(0);
}

const rewards = YAML.parse(rawYAML) as Reward[];

const groupedRewards = Object.groupBy(rewards, ({ payee }) => payee);

const AmountPatterns = [
  /^(?<number>\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)\s*(?<unit>[^\d\s.,][^\d]*)$/,
  /^(?<unit>[^\d\s.,][^\d]*?)\s*(?<number>\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)$/,
];

/**
 * Parse an amount with a unit on either side, e.g. "500 CNY", "1,000 cny" or "USD 50"
 */
function parseAmount(text: string) {
  for (const pattern of AmountPatterns) {
    const { number, unit } = text.trim().match(pattern)?.groups ?? {};

    if (number && unit)
      return {
        amount: parseFloat(number.replaceAll(",", "")),
        unit: /^[a-z]+$/i.test(unit) ? unit.toUpperCase() : unit.trim(),
      };
  }
}

const summaryList = Object.entries(groupedRewards).map(([payee, rewards]) => {
  // Amounts are summed per unit; other rewards (badges, gifts...) are counted
  const reward: Record<string, number> = {};
  const items: Record<string, number> = {};

  for (const { reward: text } of rewards!) {
    const parsed = parseAmount(String(text));

    if (parsed) {
      const { amount, unit } = parsed;

      reward[unit] = Math.round(((reward[unit] ?? 0) + amount) * 100) / 100;
    } else {
      items[text] = (items[text] ?? 0) + 1;
    }
  }

  return {
    payee,
    ...(Object.keys(reward).length ? { reward } : {}),
    ...(Object.keys(items).length ? { items } : {}),
    accounts: rewards!.map(({ payee: _, ...account }) => account),
  };
});

const summaryText = YAML.stringify(summaryList);

console.log(summaryText);

const tagName = `statistic-${new Date().toJSON().slice(0, 7)}`;

await $`git config user.name "github-actions[bot]"`;
await $`git config user.email "github-actions[bot]@users.noreply.github.com"`;

const tagTarget = await createDetachedCommit(tagName);
await $`git tag -a ${tagName} ${tagTarget} -m ${summaryText}`;
await $`git push origin ${tagName} --no-verify`;

await $`git config unset user.name`;
await $`git config unset user.email`;

// Keep "Latest" pointing at the newest product release
await $`gh release create ${tagName} --latest=false --notes ${summaryText}`;
