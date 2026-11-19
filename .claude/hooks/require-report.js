const fs = require('fs');
const path = require('path');

const AGENTS = {
  'requirements-agent': { n: '01', skill: 'requirements-template' },
  'architecture-agent': { n: '02', skill: 'architecture-template' },
  'design-review-agent': { n: '03', skill: 'architecture-template' },
  'planning-agent': { n: '04', skill: null },
  'implementation-agent': { n: '05', skill: null },
  'code-review-agent': { n: '06', skill: 'code-review-checklist' },
  'verification-agent': { n: '07', skill: null },
  'pr-agent': { n: '08', skill: 'pr-template' },
};

const REQUIRED_SECTIONS = ['Files consulted', 'Skills used', 'Jira actions'];

let raw = '';
process.stdin.on('data', (d) => (raw += d));
process.stdin.on('end', () => {
  let input = {};
  try {
    input = JSON.parse(raw);
  } catch (e) {
    process.exit(0);
  }

  const agent = input.agent_type;
  const cfg = AGENTS[agent];
  if (!cfg) process.exit(0); // not one of our pipeline agents

  const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();

  // Requirements agent runs in two phases; the report is only due in phase B.
  if (
    agent === 'requirements-agent' &&
    !fs.existsSync(path.join(root, 'docs', 'requirements.md'))
  ) {
    process.exit(0);
  }

  const relPath = `reports/${cfg.n}-${agent}-report.md`;
  const file = path.join(root, relPath);
  const problems = [];

  if (!fs.existsSync(file)) {
    problems.push(`The report file ${relPath} does not exist.`);
  } else {
    const text = fs.readFileSync(file, 'utf8');
    for (const section of REQUIRED_SECTIONS) {
      if (!text.includes(section)) {
        problems.push(`${relPath} is missing the section "${section}".`);
      }
    }
    if (cfg.skill && !text.includes(cfg.skill)) {
      problems.push(`${relPath} must name the skill "${cfg.skill}" under "Skills used".`);
    }
  }

  if (problems.length === 0) process.exit(0);

  // Avoid an endless loop: after one retry, let the agent stop but warn.
  if (input.stop_hook_active) {
    console.error('WARNING: report still incomplete: ' + problems.join(' '));
    process.exit(0);
  }

  console.error(
    'You cannot finish yet. Write the required report per CLAUDE.md "Report format". ' +
      problems.join(' ')
  );
  process.exit(2);
});