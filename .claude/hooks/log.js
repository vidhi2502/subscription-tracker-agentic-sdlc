const fs = require('fs');
const path = require('path');

let raw = '';
process.stdin.on('data', (d) => (raw += d));
process.stdin.on('end', () => {
  let input = {};
  try {
    input = JSON.parse(raw);
  } catch (e) {
    process.exit(0);
  }

  const agent = input.agent_type || '';
  if (!agent.endsWith('-agent')) process.exit(0); // only log our pipeline agents

  const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  const logFile = path.join(root, 'docs', 'pipeline-log.md');
  fs.mkdirSync(path.dirname(logFile), { recursive: true });

  if (!fs.existsSync(logFile)) {
    fs.writeFileSync(
      logFile,
      '# Pipeline Log\n\n| Time | Event | Agent |\n|------|-------|-------|\n'
    );
  }

  const event = input.hook_event_name === 'SubagentStart' ? 'START' : 'STOP';
  const time = new Date().toISOString();
  fs.appendFileSync(logFile, `| ${time} | ${event} | ${agent} |\n`);
  process.exit(0);
});