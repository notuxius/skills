import { readFileSync } from 'node:fs';

function nextDue(reviewed) {
  const date = new Date(`${reviewed}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reviewed) || Number.isNaN(date.valueOf()) ||
      date.toISOString().slice(0, 10) !== reviewed) {
    throw new Error(`Invalid Reviewed date: ${reviewed || '(empty)'}. Expected YYYY-MM-DD.`);
  }
  date.setUTCDate(date.getUTCDate() + 90);
  return date.toISOString().split('T')[0];
}

function toolVersion(value) {
  const match = /^(?<tool>@?[^@\s]+)@v?(?<version>\d+\.\d+\.\d+(?:-[\w.-]+)?)(?:\+[\w.-]+)?$/.exec(value);
  if (!match) throw new Error(`Expected a tool@version value, got ${value}.`);
  return match.groups;
}

export function checkLedger(ledger, installedVersions, today = new Date().toLocaleDateString('sv-SE')) {
  const installed = new Map();
  for (const value of installedVersions) {
    const { tool, version } = toolVersion(value);
    if (installed.has(tool) && installed.get(tool) !== version) {
      throw new Error(`Run the check separately for workspaces with different versions of ${tool}.`);
    }
    installed.set(tool, version);
  }

  const results = [];
  let columns = [];
  for (const line of ledger.split(/\r?\n/)) {
    if (!line.trimStart().startsWith('|')) {
      columns = [];
      continue;
    }
    const cells = line.trim().split(/(?<!\\)\|/).slice(1).map(cell => cell.trim().replace(/^`(.*)`$/, '$1'));
    if (cells.includes('Skill') && cells.includes('Reviewed')) {
      columns = cells;
      continue;
    }
    if (!columns.length || /^:?-+:?$/.test(cells[0])) continue;

    const skill = cells[columns.indexOf('Skill')];
    const reviewed = cells[columns.indexOf('Reviewed')];
    const recordedDue = cells[columns.indexOf('Next due')];
    const syncedFrom = cells[columns.indexOf('Synced from')];
    const status = [];
    try {
      const due = nextDue(reviewed);
      status.push(`Next due ${due}${today >= due ? ' (review due)' : ''}`);
      if (!recordedDue) status.push('ledger Next due missing');
      else if (recordedDue !== due) status.push(`ledger Next due is ${recordedDue}`);
    } catch (error) {
      status.push(error.message);
    }

    if (syncedFrom) {
      try {
        const { tool, version } = toolVersion(syncedFrom);
        const current = installed.get(tool);
        if (!current) status.push(`installed ${tool} version unverified`);
        else if (version !== current) status.push(`re-sync due (${tool} synced from ${version}, installed ${current})`);
      } catch (error) {
        status.push(error.message);
      }
    }
    results.push(`${skill} | ${status.join(' | ')}`);
  }
  return results;
}

if (import.meta.main) {
  const [ledger, ...versions] = process.argv.slice(2);
  try {
    if (!ledger) throw new Error('Usage: node check-ledger.mjs <reviewed.md> [tool@version ...] or --next-due YYYY-MM-DD');
    if (ledger === '--next-due') console.log(nextDue(versions[0]));
    else for (const result of checkLedger(readFileSync(ledger, 'utf8'), versions)) console.log(result);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
