"use strict";

const directDungeonStart = true;

/*
 * LIAM HOSFELD // THE OPERATIONS DUNGEON
 *
 * One connected dungeon map. The browser renders the world with a small
 * software 3D pipeline: fixed-horizon perspective projection,
 * painter-sorted low-poly meshes, raycast walls, procedural materials, and
 * hand-built low-poly weapon meshes and several enemy archetypes.
 */

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
window.__portfolioRendererBoot = { stage: 'context-ready', errors: [] };
if (new URLSearchParams(window.location.search).has('debug-render')) document.title = 'RENDER BOOT · CONTEXT READY';
window.addEventListener('error', (event) => {
  const message = event.error?.stack || event.message || String(event.error || event);
  window.__portfolioRendererBoot.errors.push(message);
  document.documentElement.dataset.renderError = message;
  document.title = `RENDER ERROR · ${message.replace(/\s+/g, ' ').slice(0, 1000)}`;
  if (ctx && canvas.width && canvas.height) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#130608';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffb3a7';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('RENDER STARTUP ERROR', canvas.width / 2, canvas.height / 2 - 18);
    ctx.font = '12px monospace';
    ctx.fillText(message.split('\n')[0].slice(0, 160), canvas.width / 2, canvas.height / 2 + 18);
    ctx.restore();
  }
});
const roomFloor = document.getElementById('room-floor');
const roomCount = document.getElementById('room-count');
const experienceValue = document.getElementById('experience-value');
const objectivePanel = document.getElementById('objective-panel');
const objectiveLabel = document.getElementById('objective-label');
const objectiveDetail = document.getElementById('objective-detail');
const weaponHudLabel = document.getElementById('weapon-hud-label');
const weaponStatus = document.getElementById('weapon-status');
const hoverTooltip = document.getElementById('hover-tooltip');
const bossPlaque = document.getElementById('boss-plaque');
const bossName = document.getElementById('boss-name');
const bossHealthBar = document.getElementById('boss-health-bar');
const bossPhase = document.getElementById('boss-phase');
const bossBottomHud = document.getElementById('boss-bottom-hud');
const bossBottomName = document.getElementById('boss-bottom-name');
const bossBottomHealth = document.getElementById('boss-bottom-health');
const bossBottomPhase = document.getElementById('boss-bottom-phase');
const scrollRewardKicker = document.getElementById('scroll-reward-kicker');
const hpValue = document.getElementById('hp-value');
const hpBar = document.getElementById('hp-bar');
const ammoValue = document.getElementById('ammo-value');
const weaponKills = document.getElementById('weapon-kills');
const threatCountValue = document.getElementById('threat-count');
const combatHealth = document.getElementById('combat-health');
const combatHealthBar = document.getElementById('combat-health-bar');
const combatWeaponName = document.getElementById('combat-weapon-name');
const combatAmmo = document.getElementById('combat-ammo');
const combatReserve = document.getElementById('combat-reserve');
const combatMode = document.getElementById('combat-mode');
const narratorPanel = document.getElementById('narrator-panel');
const narratorKicker = document.getElementById('narrator-kicker');
const narratorSpeaker = document.getElementById('narrator-speaker');
const narratorMessage = document.getElementById('narrator-message');
const narratorPortrait = document.getElementById('narrator-portrait');
const narratorPortraitCanvas = document.getElementById('narrator-portrait-canvas');
const combatKills = document.getElementById('combat-kills');
const combatThreats = document.getElementById('combat-threats');
const weaponSlots = [...document.querySelectorAll('[data-weapon-slot]')];
const floorAnnouncement = document.getElementById('floor-announcement');
const floorAnnouncementKicker = document.getElementById('floor-announcement-kicker');
const floorAnnouncementNumber = document.getElementById('floor-announcement-number');
const floorAnnouncementTitle = document.getElementById('floor-announcement-title');
const floorAnnouncementSubtitle = document.getElementById('floor-announcement-subtitle');
const interactionPrompt = document.getElementById('interaction-prompt');
const promptKey = document.getElementById('prompt-key');
const promptText = document.getElementById('prompt-text');
const toast = document.getElementById('toast');
const readingOverlay = document.getElementById('reading-overlay');
const scrollRoomLabel = document.getElementById('scroll-room-label');
const scrollRecordNumber = document.getElementById('scroll-record-number');
const scrollTitle = document.getElementById('scroll-title');
const scrollSummary = document.getElementById('scroll-summary');
const scrollAuthorLine = document.getElementById('scroll-author-line');
const scrollRecordStatus = document.getElementById('scroll-record-status');
const scrollPositioning = document.getElementById('scroll-positioning');
const scrollIntroGrid = document.getElementById('scroll-intro-grid');
const scrollProofLabel = document.getElementById('scroll-proof-label');
const scrollProofGrid = document.getElementById('scroll-proof-grid');
const scrollProgressLabel = document.getElementById('scroll-progress-label');
const scrollProgressValue = document.getElementById('scroll-progress-value');
const scrollProgressBar = document.getElementById('scroll-progress-bar');
const scrollProgressCaption = document.getElementById('scroll-progress-caption');
const scrollDetailsLabel = document.getElementById('scroll-details-label');
const scrollDetailCount = document.getElementById('scroll-detail-count');
const scrollDetails = document.getElementById('scroll-details');
const scrollCtaTitle = document.getElementById('scroll-cta-title');
const scrollCtaCopy = document.getElementById('scroll-cta-copy');
const scrollAbility = document.getElementById('scroll-ability');
const scrollAbilitySeal = document.getElementById('scroll-ability-seal');
const scrollAbilityName = document.getElementById('scroll-ability-name');
const scrollAbilityDescription = document.getElementById('scroll-ability-description');
const scrollTags = document.getElementById('scroll-tags');
const scrollActions = document.getElementById('scroll-actions');
const closeScrollButton = document.getElementById('close-scroll');
const deathOverlay = document.getElementById('death-overlay');
const deathCause = document.getElementById('death-cause');
const deathRestart = document.getElementById('death-restart');
const helpButton = document.getElementById('help-button');
const musicButton = document.getElementById('music-button');
const settingsButton = document.getElementById('settings-button');
const helpDialog = document.getElementById('help-dialog');
const settingsDialog = document.getElementById('settings-dialog');
const musicVolumeInput = document.getElementById('music-volume');
const sfxVolumeInput = document.getElementById('sfx-volume');
const reducedMotionInput = document.getElementById('reduced-motion');
const pointerLockInput = document.getElementById('pointer-lock-setting');
const gameShell = document.querySelector('.game-shell');
const visorBootFeed = document.getElementById('visor-boot-feed');
const visorTechFeed = document.getElementById('visor-tech-feed');
const visorTrainingFeed = document.getElementById('visor-training-feed');
const visorTrainingHint = visorTrainingFeed?.querySelector('.visor-training-hint');
const visorTutorialLines = visorTrainingFeed ? Object.fromEntries([...visorTrainingFeed.querySelectorAll('[data-visor-tutorial]')].map((line) => [line.dataset.visorTutorial, line])) : {};
const visorFeedLines = visorBootFeed ? Object.fromEntries([...visorBootFeed.querySelectorAll('[data-visor-feed]')].map((line) => [line.dataset.visorFeed, line])) : {};
const visorFeedPrefixes = {
  power: '> POWER BUS ............ ',
  optics: '> OPTICS ............... ',
  motion: '> GYRO ARRAY ........... ',
  range: '> RANGEFINDER .......... ',
  threat: '> THREAT MATRIX ........ ',
  combat: '> COMBAT LINK .......... ',
};
const loadoutDescription = document.getElementById('loadout-description');
const weaponOptionButtons = [...document.querySelectorAll('[data-weapon]')];
const settings = { musicVolume: .72, sfxVolume: .52, reducedMotion: false, pointerLock: true };
const EMERALD = '#24dca0';
const EMERALD_LIGHT = '#c4ffe4';
const lobbyPortfolioScroll = {
  id: 'lobby-portfolio-scroll',
  intro: true,
  gateTutorial: false,
  disabled: true,
  roomIndex: 0,
  x: 0,
  y: 0,
  title: 'LIAM HOSFELD / FIELD PORTFOLIO',
  kind: 'chronicle',
  tag: 'ENTRY BRIEF / SELECTED PROOF',
  summary: 'Technical consultant who turns complicated operational systems into workflows people can actually run. The work sits at the intersection of TMS delivery, analytics, integrations, automation, and the decisions that happen after the data is understood.',
  featuredMetrics: [
    { value: '5', label: 'enterprise accounts supported' },
    { value: '1M+', label: 'tracking messages organized monthly' },
    { value: '~$40K', label: 'annualized Azure savings identified' },
    { value: '40+', label: 'customer endpoints mapped' },
    { value: '50K+', label: 'shipper records made searchable' }
  ],
  featuredWork: [
    { index: '01', label: 'BILLING ANALYTICS', title: 'Turn message volume into billing clarity', result: '~$40K annualized Azure savings identified', method: 'Modeled 15 months of BigQuery activity and organized 1M+ monthly tracking messages by customer, carrier, and billing period.', tools: 'BigQuery · SQL · Usage modeling' },
    { index: '02', label: 'INTEGRATION DOCUMENTATION', title: 'Make customer guidance easier to trust', result: '40+ endpoints mapped through a repeatable release path', method: 'Built publishing and validation checks for request and response evidence before integration guidance reached customers.', tools: 'MIF · EDI/X12 · AS2 · SFTP' },
    { index: '03', label: 'SHIPMENT INTEGRITY', title: 'Trace the real cause of a status mismatch', result: 'Defensible product-workflow recommendation', method: 'Correlated tracking messages, shipment events, and lifecycle state to separate timing noise from the issue that mattered.', tools: 'Oracle SQL · Event tracing · R&D coordination' },
    { index: '04', label: 'SUPPORT SEARCH', title: 'Put the right relationship one search away', result: '50K+ shipper records made searchable', method: 'Built an SSO search route across shipper and account data, shortening the path from a live support question to the right record.', tools: 'Python · SSO · Data lookup design' }
  ],
  details: [
    'WHAT I DO — Own customer-facing technical delivery at Manhattan Associates across transportation workflows, TMS integrations, production support, analytics, documentation, and automation.',
    'HOW I WORK — Start with the evidence, clarify the requirement, trace the system relationship, automate the repeatable path, and leave behind an explanation another person can operate.',
    'DELIVERY CONTEXT — Supported five enterprise accounts, with work spanning requirements, demos, incident investigation, SQL analysis, EDI/X12, AS2, SFTP, MIF, and cross-functional coordination with Operations, Cloud Services, Finance, and R&D.',
    'CAREER ROUTE — Manhattan Associates: Consultant, May 2025 — Present; Cloud Services Intern / Co-op, May 2023 — May 2025. Soliant Healthcare: Systems Operations Intern, May — August 2022. Georgia Tech Research Institute: ATAS Lab Research Intern, May — August 2020.',
    'TOOLKIT — Oracle SQL, BigQuery, Power BI, DAX, Python, PowerShell, Perl, Bash, JavaScript, C#, Git, CI/CD, Transportation Management Systems, MIF, EDI/X12, AS2, SFTP, message troubleshooting, event troubleshooting, and integration evidence.',
    'FOUNDATION — University of Georgia, B.S. Computer Systems Engineering, GPA 3.83, May 2025. A systems foundation for moving comfortably between data, software, integrations, and delivery.',
    'OUTSIDE THE SYSTEM — Baking, plants, drums, and bass guitar. The same habits remain: observe closely, make the next step repeatable, and keep learning.',
    'NEXT — The assault rifle is equipped. Move through the archive and let each room show the work.'
  ],
  tags: ['TECHNICAL CONSULTANT', 'TMS / LOGISTICS', 'OPERATIONS ANALYTICS', 'INTEGRATIONS', 'AUTOMATION', 'TUTORIAL ABILITY: ARCHIVE KEY'],
  color: '#6ce0c2'
};
let shieldFeedbackAt = -Infinity;
let lastCombatHitAudioAt = -Infinity;

const rooms = [
  {
    id: 'threshold', roof: true, level: 'LEVEL 01', title: 'THE THRESHOLD CHAMBER', shortTitle: 'Threshold Chamber', subtitle: 'First contact waits beyond the entry lane.', fieldNote: 'The opening chamber gives the player a clean approach before enemies occupy the eastern half of the room.', color: '#b9a57e', material: 'stone', levelType: 'threshold chamber', width: 33, height: 18, palette: ['#07080a', '#2b2924', '#0a0908'],
    intro: 'The archive begins at a quiet threshold. Push into the eastern half, clear the first contact, and continue toward the Trophy Room.',
    details: ['The portfolio begins at a threshold rather than a waiting room.', 'The western entry lane gives you time to orient before the eastern chambers reveal the first hostiles.', 'Clear the Threshold Chamber, then follow the marked route toward the Trophy Room.'],
    tags: ['Level 01', 'Direct start', 'Threshold combat', 'Trophy Room route'],
    map: ['1111111111111111', '1000000000000001', '1000000000000001', '1000000000000001', '1000000000000001', '1000000000000001', '1000000000000001', '1111111111111111'],
    spawn: { x: 2.4, y: 9, angle: 0 },
    items: [],
    enemies: []
  },
  {
    id: 'trophy', roof: true, level: 'LEVEL 03', title: 'THE TROPHY ROOM', shortTitle: 'Trophy Room', subtitle: 'Proof gathered on the journey.', fieldNote: 'He supports five enterprise accounts and works with production data at more than one million tracking messages each month.', color: '#d88a45', material: 'wood', levelType: 'slaughter vault', palette: ['#100707', '#4b2017', '#0b0404'],
    intro: 'Customer-facing ownership at production scale, with measurable impact across data, billing, documentation, and cloud operations.',
    details: ['5 enterprise accounts supported, representing roughly 50% of the team’s managed contract value.', '1M+ tracking messages handled each month across production systems.', 'Approximately $40K in Azure savings identified through analysis and translated into a Finance-ready decision.', '40+ customer endpoints mapped through a reusable publishing and validation workflow.', 'Enterprise partners and ecosystems have included organizations such as Sysco, US Foods, BJ’s Wholesale Club, H&M Trucking, and Guest Supply.'],
    tags: ['5 accounts', '1M+ messages / month', '~$40K recovered', '40+ endpoints'],
    map: ['1111111111111111', '1000000000000001', '1000111111000001', '1000100001000001', '1000100001000001', '1000111111000001', '1000000000000001', '1111111111111111'],
    spawn: { x: 2.5, y: 6, angle: -Math.PI / 2 },
    items: [
      { id: 'account-ledger', title: 'CONTRACT DOSSIER: FIVE ACCOUNTS', kind: 'ledger', icon: '5', tag: 'CONTRACT / ACTIVE PARTY', x: 2.5, y: 2.5, color: '#e7ad67', summary: 'Five enterprise contracts carried across customer-facing support and improvement work.', details: ['The accounts represent roughly 50% of the team’s managed contract value.', 'Ownership includes investigation, demos, coordination, and delivery.'] },
      { id: 'message-crystal', title: 'SIGNAL CACHE: 1M MONTHLY', kind: 'crystal', icon: '1M', tag: 'RESOURCE / MESSAGE FLOW', x: 13.5, y: 2.5, color: '#6ce0c2', summary: 'A production-scale signal cache holding more than one million tracking messages each month.', details: ['The volume powers analytics, billing investigations, and operational decisions.', 'Evidence is only useful when it can be explained to the people running the process.'] },
      { id: 'savings-ledger', title: 'BOUNTY LEDGER: AZURE SAVINGS', kind: 'ledger', icon: '$', tag: 'BOUNTY / $40K RECOVERED', x: 2.5, y: 5.5, color: '#e7ad67', summary: 'A recovered bounty: approximately $40K in Azure savings identified through analysis.', details: ['Usage data was translated into a Finance-ready decision.', 'This is the pattern: find the signal, quantify it, and make the action obvious.'] },
      { id: 'endpoint-map', title: 'WAYPOINT CHART: 40+ ENDPOINTS', kind: 'map', icon: '40+', tag: 'FIELD MAP / ROUTE NETWORK', x: 13.5, y: 5.5, color: '#77a9e8', summary: 'A field map of more than forty customer endpoints, organized through a repeatable publishing workflow.', details: ['Documentation became easier to validate and ship.', 'Reusable guidance reduced the friction around customer integration work.'] }
    ],
    enemies: [
      { id: 'queue-crawler', name: 'Queue Crawler', kind: 'crawler', x: 7, y: 1.5, hp: 80, speed: .32, damage: 8, color: '#b77754' },
      { id: 'ledger-seer', name: 'Ledger Seer', kind: 'seer', attackStyle: 'ranged', x: 12.5, y: 1.5, hp: 72, speed: .27, damage: 10, color: '#78b6d0' },
      { id: 'invoice-ghoul', name: 'Invoice Ghoul', kind: 'ghoul', x: 10.5, y: 6.5, hp: 65, speed: .42, damage: 6, color: '#7db8ac' }
    ]
  },
  {
    id: 'quests', level: 'LEVEL 04', title: 'THE QUEST BOARD', shortTitle: 'Quest Board', subtitle: 'Selected problems, investigated and made repeatable.', fieldNote: 'His pattern is simple: investigate the evidence, clarify the requirement, automate the repeatable path, and measure the result.', color: '#c44748', material: 'stone', levelType: 'infernal crossroads', palette: ['#120608', '#4b1822', '#090406'],
    intro: 'Four representative quests show how Liam moves from ambiguity to an operating improvement.',
    details: ['Billing clarity: turned high-volume message data into a report that helped Finance understand usage and recover approximately $40K.', 'Integration guidance: built a publication and validation workflow that made documentation easier to ship across 40+ customer endpoints.', 'Shipment integrity: investigated message and status relationships to diagnose a shipment-status issue and produce a defensible recommendation.', 'Support search: built an SSO search tool for 50K+ shipper records so live support could find the right relationship faster.'],
    tags: ['Investigate', 'Clarify', 'Automate', 'Measure'],
    map: ['1111111111111111', '1000001000000001', '1000001000000001', '1000000000000001', '1111100001111111', '1000000000000001', '1000000000000001', '1111111111111111'],
    spawn: { x: 3.5, y: 2.5, angle: Math.PI / 2 },
    items: [
      { id: 'billing-quest', title: 'BOUNTY CONTRACT: BILLING RECOVERY', kind: 'scroll', icon: '$', tag: 'CONTRACT / REVENUE', x: 2.5, y: 6.5, color: '#e7ad67', summary: 'Turned a noisy message stream into a recovered billing bounty and a Finance-ready decision.', details: ['Investigated production data and usage patterns.', 'Recovered approximately $40K by making the evidence legible.'] },
      { id: 'documentation-quest', title: 'FIELD ORDER: ENDPOINT GUIDANCE', kind: 'scroll', icon: '↗', tag: 'FIELD ORDER / DOCUMENTATION', x: 9.5, y: 3.5, color: '#77a9e8', summary: 'A field order that made integration guidance easier to publish, validate, and explain.', details: ['Built a workflow around 40+ customer endpoints.', 'Reusable documentation turned one-off knowledge into an operating asset.'] },
      { id: 'shipment-quest', title: 'CASE FILE: SHIPMENT INTEGRITY', kind: 'scroll', icon: '↔', tag: 'CASE FILE / TRACE', x: 12.5, y: 6.5, color: '#c58de6', summary: 'A traced case file diagnosing a shipment-status integrity issue through the evidence trail.', details: ['Compared message and status evidence.', 'Produced a defensible recommendation instead of a guess.'] },
      { id: 'search-quest', title: 'KEY ITEM: SUPPORT SEARCH', kind: 'key', icon: '50K', tag: 'KEY ITEM / 50K RECORDS', x: 3.5, y: 3.5, color: '#6ce0c2', summary: 'A recovered key that opens an SSO search route through more than 50,000 shipper records.', details: ['Made relationship searches useful during live support.', 'The tool shortened the distance between a question and the right record.'] }
    ],
    enemies: [
      { id: 'requirement-beast', name: 'Requirement Beast', kind: 'beast', attackStyle: 'ground', x: 6.5, y: 4.5, hp: 90, speed: .34, damage: 9, color: '#9b6bd0' },
      { id: 'route-shaman', name: 'Route Shaman', kind: 'seer', attackStyle: 'ranged', x: 12.5, y: 2.5, hp: 78, speed: .25, damage: 11, color: '#c58de6' },
      { id: 'status-moth', name: 'Status Moth', kind: 'moth', x: 12.5, y: 2.5, hp: 55, speed: .56, damage: 5, color: '#dfae65' }
    ]
  },
  {
    id: 'chronicle', roof: true, level: 'LEVEL 05', title: 'THE CHRONICLE', shortTitle: 'Chronicle', subtitle: 'Experience that supports the proof.', fieldNote: 'His route runs from Cloud Services and systems operations into customer-facing technical consulting.', color: '#8a9b9b', material: 'stone', levelType: 'lost archive maze', palette: ['#07090b', '#283337', '#040506'],
    intro: 'A progression from technical delivery to analytics, integrations, automation, and cross-functional ownership.',
    details: ['Manhattan Associates — Consultant, May 2025 to present: own customer-facing work and coordinate across Operations, Cloud Services, Finance, and R&D.', 'Manhattan Associates — Cloud Services Intern / Co-op, May 2023 to May 2025: built the 50K+ shipper-record SSO search tool and Azure savings analysis.', 'Soliant Healthcare — Systems Operations Intern, May to August 2022: automated account-setup work and found duplicate accounts tied to roughly $36K in annual savings.', 'Georgia Tech Research Institute — Research Intern, ATAS Lab, May to August 2020: built C# integration components for robotic object-detection research.'],
    tags: ['Manhattan Associates', 'Soliant Healthcare', 'GTRI', 'Customer delivery'],
    map: ['1111111111111111', '1000000000000001', '1011110111101101', '1000010000010001', '1000010000010001', '1011110111101101', '1000000000000001', '1111111111111111'],
    spawn: { x: 8.5, y: 4.5, angle: Math.PI },
    items: [
      { id: 'manhattan-current', title: 'QUEST LOG: CURRENT RUN', kind: 'chronicle', icon: 'NOW', tag: 'QUEST LOG / MAY 2025 — PRESENT', x: 2.5, y: 1.5, color: '#6ce0c2', summary: 'Consultant at Manhattan Associates, owning customer-facing technical delivery.', details: ['Coordinates across Operations, Cloud Services, Finance, and R&D.', 'Turns functional requirements into reliable technical outcomes.'] },
      { id: 'manhattan-coop', title: 'QUEST LOG: CLOUD SERVICES', kind: 'chronicle', icon: '02', tag: 'QUEST LOG / MAY 2023 — MAY 2025', x: 13.5, y: 1.5, color: '#77a9e8', summary: 'Cloud Services Intern / Co-op at Manhattan Associates.', details: ['Built an SSO search tool for 50K+ shipper records.', 'Created analysis that identified approximately $40K in Azure savings.'] },
      { id: 'soliant-chapter', title: 'QUEST LOG: SOLIANT SYSTEMS', kind: 'chronicle', icon: '03', tag: 'QUEST LOG / MAY — AUG 2022', x: 2.5, y: 6.5, color: '#e7ad67', summary: 'Systems Operations Intern at Soliant Healthcare.', details: ['Automated account-setup work.', 'Found duplicate accounts tied to roughly $36K in annual savings.'] },
      { id: 'gtri-chapter', title: 'QUEST LOG: GTRI RESEARCH', kind: 'chronicle', icon: '04', tag: 'QUEST LOG / MAY — AUG 2020', x: 13.5, y: 6.5, color: '#c58de6', summary: 'Research Intern in the ATAS Lab at Georgia Tech Research Institute.', details: ['Built C# integration components.', 'Supported robotic object-detection research.'] }
    ],
    enemies: [
      { id: 'legacy-echo', name: 'Legacy Echo', kind: 'wraith', attackStyle: 'ranged', x: 6.5, y: 4.5, hp: 78, speed: .38, damage: 7, color: '#668ed0' },
      { id: 'archive-seer', name: 'Archive Seer', kind: 'seer', attackStyle: 'ranged', x: 12.5, y: 2.5, hp: 74, speed: .26, damage: 10, color: '#77a9e8' },
      { id: 'handoff-hound', name: 'Handoff Hound', kind: 'hound', x: 10.5, y: 4.5, hp: 68, speed: .52, damage: 8, color: '#b76b66' }
    ]
  },
  {
    id: 'character', roof: true, level: 'LEVEL 06', title: 'THE CHARACTER SHEET', shortTitle: 'Character Sheet', subtitle: 'Tools carried into the dungeon.', fieldNote: 'His toolkit crosses Oracle SQL, BigQuery, Power BI, Python, PowerShell, integrations, and automation.', color: '#d6944d', material: 'wood', levelType: 'hellforged armory', palette: ['#130807', '#4b2418', '#090404'],
    intro: 'A systems-minded toolkit spanning operational data, integration evidence, automation, and stakeholder delivery.',
    details: ['Education: University of Georgia, B.S. Computer Systems Engineering, GPA 3.83, May 2025.', 'Operational analytics: Oracle SQL, BigQuery, Power BI, DAX, data modeling, billing, and reporting.', 'Functional delivery: requirements, incident investigation, technical demos, process mapping, stakeholder coordination, and documentation.', 'Systems and integration: TMS, MIF, EDI/X12, AS2, SFTP, message troubleshooting, and event troubleshooting.', 'Automation and delivery: Python, PowerShell, Perl, Bash, JavaScript, C#, Git, and CI/CD.'],
    tags: ['UGA · 3.83 GPA', 'Oracle SQL', 'Python / PowerShell / Perl', 'EDI · AS2 · SFTP'],
    map: ['1111111111111111', '1000000000000001', '1000110001100001', '1000000000000001', '1000000000000001', '1000110001100001', '1000000000000001', '1111111111111111'],
    spawn: { x: 6.5, y: 6, angle: -Math.PI / 2 },
    items: [
      { id: 'uga-crest', title: 'FOUNDATION CREST: UGA', kind: 'crest', icon: 'UGA', tag: 'FOUNDATION / EDUCATION', x: 2.5, y: 2.5, color: '#e3c66e', summary: 'B.S. Computer Systems Engineering from the University of Georgia.', details: ['GPA: 3.83.', 'A foundation for moving comfortably between systems, data, and delivery.'] },
      { id: 'analytics-kit', title: 'EQUIPMENT: ANALYTICS KIT', kind: 'kit', icon: 'SQL', tag: 'EQUIPMENT / INTELLIGENCE', x: 11.5, y: 2.5, color: '#6ce0c2', summary: 'Operational analytics carried into production work.', details: ['Oracle SQL, BigQuery, Power BI, DAX, data modeling, billing, and reporting.', 'Turns operational evidence into a decision someone can use.'] },
      { id: 'integration-rune', title: 'EQUIPMENT: INTEGRATION RUNE', kind: 'rune', icon: 'EDI', tag: 'EQUIPMENT / WAYFINDING', x: 2.5, y: 5.5, color: '#77a9e8', summary: 'The languages of connected logistics systems.', details: ['TMS, MIF, EDI/X12, AS2, SFTP, message troubleshooting, and event troubleshooting.', 'Finds the path through noisy system relationships.'] },
      { id: 'automation-kit', title: 'EQUIPMENT: AUTOMATION KIT', kind: 'kit', icon: 'CODE', tag: 'EQUIPMENT / CRAFT', x: 11.5, y: 5.5, color: '#c58de6', summary: 'Automation and delivery tools that make the path repeatable.', details: ['Python, PowerShell, Perl, Bash, JavaScript, C#, Git, and CI/CD.', 'Prefers modular work that can be operated, explained, and improved.'] }
    ],
    enemies: [
      { id: 'syntax-beast', name: 'Syntax Beast', kind: 'beast', attackStyle: 'ground', x: 6.5, y: 3.5, hp: 85, speed: .36, damage: 8, color: '#cf9b5e' },
      { id: 'schema-breaker', name: 'Schema Breaker', kind: 'quake', attackStyle: 'ground', x: 10.5, y: 4.5, hp: 108, speed: .28, damage: 12, color: '#cf8b5e' },
      { id: 'integration-leech', name: 'Integration Leech', kind: 'leech', x: 9.5, y: 6.5, hp: 62, speed: .48, damage: 6, color: '#7d9bd1' }
    ]
  },
  {
    id: 'campfire', roof: true, level: 'LEVEL 07', title: 'THE CAMPFIRE', shortTitle: 'Campfire', subtitle: 'Plants, bread, and rhythm.', fieldNote: 'Away from the screen, Liam bakes bread, keeps plants alive, and trades drums for bass guitar.', color: '#d74a35', material: 'stone', levelType: 'ashen hearth', palette: ['#180606', '#562018', '#0b0404'],
    intro: 'Away from the screen, Liam likes slow, hands-on work: keeping plants alive, baking bread, and learning bass after years behind a drum kit.',
    details: ['Baking: long ferments, shaping, scoring, and the small improvements that show up in the next loaf.', 'Plants: light, propagation, watering routines, and building a greener home one cutting at a time.', 'Music: drums first, bass now — the same groove from a different seat.', 'Home base: Atlanta, Georgia.'],
    tags: ['Baking', 'Plants', 'Drums', 'Bass guitar', 'Atlanta'],
    map: ['1111111111111111', '1000000000000001', '1000001111000001', '1000001001000001', '1000001001000001', '1000001111000001', '1000000000000001', '1111111111111111'],
    spawn: { x: 2.5, y: 2.5, angle: 0 },
    items: [
      { id: 'bread-loaf', title: 'SUPPLY DROP: BREAD', kind: 'bread', icon: 'B', tag: 'SUPPLY DROP / BAKING', x: 2.5, y: 2.5, color: '#e7ad67', summary: 'Slow, hands-on work: long ferments, shaping, scoring, and the next small improvement.', details: ['Baking is a process of observing the evidence and adjusting the next iteration.', 'The best results show up in the loaf you make after the last one.'] },
      { id: 'plant-cutting', title: 'SUPPLY DROP: PLANT CUTTING', kind: 'plant', icon: 'P', tag: 'SUPPLY DROP / PLANTS', x: 13.5, y: 2.5, color: '#6ce0c2', summary: 'Light, propagation, watering routines, and a greener home one cutting at a time.', details: ['Plants reward consistency and attention to small signals.', 'A different kind of operating system, with dirt under the fingernails.'] },
      { id: 'music-kit', title: 'SUPPLY DROP: RHYTHM', kind: 'music', icon: '♫', tag: 'SUPPLY DROP / RHYTHM', x: 3.5, y: 5.5, color: '#c58de6', summary: 'Drums first, bass now — the same groove from a different seat.', details: ['Years behind a drum kit built the rhythm.', 'Learning bass adds another way to listen to the same system.'] },
      { id: 'atlanta-marker', title: 'WAYPOINT: ATLANTA HOME BASE', kind: 'marker', icon: 'ATL', tag: 'WAYPOINT / HOME BASE', x: 12.5, y: 5.5, color: '#db8872', summary: 'Atlanta, Georgia: the home base for the work and the off-duty experiments.', details: ['A city of logistics, systems, neighborhoods, gardens, and good food.', 'The map starts here.'] }
    ],
    enemies: [
      { id: 'burnout-imp', name: 'Burnout Imp', kind: 'imp', x: 5.5, y: 5.5, hp: 72, speed: .46, damage: 7, color: '#d16f63' },
      { id: 'root-quake', name: 'Root Quake', kind: 'quake', attackStyle: 'ground', x: 7.5, y: 2.5, hp: 102, speed: .3, damage: 11, color: '#77915d' },
      { id: 'noise-moth', name: 'Noise Moth', kind: 'moth', x: 10.5, y: 1.5, hp: 58, speed: .58, damage: 5, color: '#c7a359' }
    ]
  },
  {
    id: 'gate', level: 'LEVEL 08', title: 'THE LIGHTWELL SANCTUM', shortTitle: 'Lightwell Sanctum', subtitle: 'The final delivery is a fight.', color: '#efb36a', material: 'stone', levelType: 'icon arena', palette: ['#050809', '#1c3030', '#020405'],
    intro: 'A final sanctum where every route, system, and decision is tested under pressure.',
    details: ['The Operations Archon protects the lightwell.', 'Break its phases, survive the system-wide patterns, and enter the door of light.', 'The portfolio waits beyond the encounter.'],
    tags: ['Final encounter', 'Multi-phase boss', 'Door of light', 'Return to menu'],
    map: ['11111111111111111111111111', '10000000000000000000000001', '10000000000000000000000001', '10000000000000000000000001', '10000000000000000000000001', '10000000000000000000000001', '10000000000000000000000001', '10000000000000000000000001', '10000000000000000000000001', '10000000000000000000000001', '10000000000000000000000001', '10000000000000000000000001', '10000000000000000000000001', '11111111111111111111111111'],
    spawn: { x: 2.4, y: 5.5, angle: 0 },
    items: [
      { id: 'sanctum-brief', title: 'BOSS CONTRACT: FINAL BRIEF', kind: 'scroll', icon: '!', tag: 'BOSS CONTRACT / BRIEF', x: 5.2, y: 2.2, color: '#e9e9e0', summary: 'The last requirements arrive before the fight begins.', details: ['Recovering this scroll grants 25 XP.', 'The Archon is vulnerable between its attack patterns.'] },
      { id: 'phase-ledger', title: 'BOSS CONTRACT: PHASE LEDGER', kind: 'ledger', icon: 'III', tag: 'BOSS CONTRACT / PHASES', x: 20.8, y: 2.2, color: '#e7ad67', summary: 'Three phases. One operating system to dismantle.', details: ['Recovering this scroll grants 25 XP.', 'Watch the boss plaque for phase changes and shield breaks.'] },
      { id: 'lightwell-record', title: 'EXIT ROUTE: LIGHTWELL RECORD', kind: 'chronicle', icon: '✦', tag: 'EXIT ROUTE / LIGHTWELL', x: 5.2, y: 11.2, color: '#6ce0c2', summary: 'The door of light opens only after the Archon falls.', details: ['Recovering this scroll grants 25 XP.', 'Press E at the doorway when the encounter is complete.'] },
      { id: 'exit-seal', title: 'EXIT ROUTE: RETURN SEAL', kind: 'seal', icon: '↗', tag: 'EXIT ROUTE / RETURN', x: 20.8, y: 11.2, color: '#77a9e8', summary: 'A final seal for the route back to the portfolio.', details: ['Recovering this scroll grants 25 XP.', 'The active door of light will be impossible to miss.'] }
    ],
    enemies: []
  }
];

// The boss remains the authored final combat room. Defeating it leads to a
// separate celestial sanctuary instead of resetting the run into the lobby.
const BOSS_ROOM_INDEX = rooms.length - 1;
rooms.push({
  id: 'sanctuary',
  level: 'LEVEL 09',
  title: 'THE CELESTIAL SANCTUARY',
  shortTitle: 'Celestial Sanctuary',
  subtitle: 'A quiet place beyond the final delivery.',
  fieldNote: 'The archive is complete. Approach the résumé pedestal and let the next route arrive.',
  color: '#f5f0c6',
  material: 'stone',
  levelType: 'heaven-like sanctuary',
  palette: ['#d8f3ec', '#a8d9d0', '#f5f1cf'],
  intro: 'A bright sanctuary beyond the dungeon, where the completed résumé waits on a pedestal.',
  details: ['The Operations Archon has fallen.', 'The résumé is waiting on the illuminated pedestal.', 'Walk close to the pedestal to download the PDF automatically.'],
  tags: ['Ascension complete', 'Résumé pedestal', 'Automatic download'],
  map: ['111111111111111111111111111111', '100000000000000000000000000001', '100000000000000000000000000001', '100000000000000000000000000001', '100000000000000000000000000001', '100000000000000000000000000001', '100000000000000000000000000001', '100000000000000000000000000001', '100000000000000000000000000001', '100000000000000000000000000001', '100000000000000000000000000001', '100000000000000000000000000001', '100000000000000000000000000001', '100000000000000000000000000001', '100000000000000000000000000001', '100000000000000000000000000001', '100000000000000000000000000001', '111111111111111111111111111111'],
  spawn: { x: 4.2, y: 9, angle: 0 },
  items: [],
  enemies: [],
});
const SANCTUARY_ROOM_INDEX = rooms.length - 1;
const MINI_BOSS_ENCOUNTERS = [
  { roomId: 'trophy', id: 'contract-warden', name: 'THE CONTRACT WARDEN', kind: 'warden', x: 8, y: 4.5, hp: 360, speed: .24, damage: 14, color: '#d08a61', miniBoss: true },
  { roomId: 'chronicle', id: 'legacy-colossus', name: 'THE LEGACY COLOSSUS', kind: 'quake', x: 8, y: 4.5, hp: 430, speed: .2, damage: 16, color: '#7896b8', miniBoss: true },
  { roomId: 'campfire', id: 'burnout-keeper', name: 'THE BURNOUT KEEPER', kind: 'beast', x: 8, y: 4.5, hp: 500, speed: .22, damage: 18, color: '#c76f57', miniBoss: true },
];
for (const encounter of MINI_BOSS_ENCOUNTERS) {
  const room = rooms.find((candidate) => candidate.id === encounter.roomId);
  if (room) room.enemies.push({ ...encounter });
}
const MINI_BOSS_ROOM_IDS = new Set(MINI_BOSS_ENCOUNTERS.map((encounter) => encounter.roomId));
function miniBossRoom(roomIndex) { return MINI_BOSS_ROOM_IDS.has(rooms[roomIndex]?.id); }
const STARTING_ROOM_INDEX = 0;
const FINAL_ROOM_INDEX = BOSS_ROOM_INDEX;
// Only the entrance, forest corridor, boss arena, and completed sanctuary are
// open to the sky. Every other authored dungeon room receives a ceiling.
const OPEN_AIR_ROOM_IDS = new Set(['gate', 'sanctuary']);
for (const room of rooms) room.roof = !OPEN_AIR_ROOM_IDS.has(room.id);
for (const room of rooms) room.material = 'stone';

const ROOM_WIDTH = 22;
const ROOM_HEIGHT = 12;
const MISSION_ROOM_WIDTH = 33;
const MISSION_ROOM_HEIGHT = 18;
const FINAL_ROOM_WIDTH = 30;
const FINAL_ROOM_HEIGHT = 18;
const ROOM_GAP = 4;
const ROOM_INSET_X = 3;
const ROOM_INSET_Y = 2;
const MISSION_INSET_X = 8;
const MISSION_INSET_Y = 5;
const MISSION_ROOM_IDS = new Set(['threshold', 'trophy', 'quests', 'chronicle', 'character', 'campfire']);
function isMissionRoom(roomIndex) { return MISSION_ROOM_IDS.has(rooms[roomIndex]?.id); }
function gapAfterRoom() { return ROOM_GAP; }
const roomWidths = rooms.map((room, index) => index === BOSS_ROOM_INDEX || index === SANCTUARY_ROOM_INDEX
  ? FINAL_ROOM_WIDTH
  : isMissionRoom(index) ? MISSION_ROOM_WIDTH : (room.width || ROOM_WIDTH));
const roomHeights = rooms.map((room, index) => index === BOSS_ROOM_INDEX || index === SANCTUARY_ROOM_INDEX
  ? FINAL_ROOM_HEIGHT
  : isMissionRoom(index) ? MISSION_ROOM_HEIGHT : (room.height || ROOM_HEIGHT));
function roomDoorY(roomIndex) { return rooms[roomIndex]?.id === 'threshold' ? 9 : isMissionRoom(roomIndex) ? 5 : Math.floor(roomHeights[roomIndex] / 2) - 1; }
const ROOM_DOOR_Y = roomDoorY(0);
const roomOffsets = rooms.map((_, index) => rooms.slice(0, index).reduce((offset, __, roomIndex) => offset + roomWidths[roomIndex] + gapAfterRoom(roomIndex), 0));
const WORLD_WIDTH = roomOffsets[roomOffsets.length - 1] + roomWidths[roomWidths.length - 1];
const WORLD_HEIGHT = Math.max(...roomHeights);
const worldMap = Array.from({ length: WORLD_HEIGHT }, () => Array(WORLD_WIDTH).fill('1'));
const FINAL_ROOM_OFFSET = roomOffsets[FINAL_ROOM_INDEX];
const BOSS_EXIT_POINT = { x: FINAL_ROOM_OFFSET + FINAL_ROOM_WIDTH - 2.4, y: 9 };
const SANCTUARY_ROOM_OFFSET = roomOffsets[SANCTUARY_ROOM_INDEX];
const SANCTUARY_RESUME_PEDESTAL = {
  id: 'sanctuary-resume-pedestal',
  roomIndex: SANCTUARY_ROOM_INDEX,
  x: SANCTUARY_ROOM_OFFSET + 15,
  y: 9,
  z: .04,
  title: 'LIAM HOSFELD / RÉSUMÉ',
};

// Physical-looking elevation is kept in the route itself rather than in a
// second camera axis. These low stone galleries and stepped approaches make
// the combat rooms feel layered while preserving the direct Doom controls.
const ELEVATED_SET_PIECES = Object.freeze([
  { roomIndex: STARTING_ROOM_INDEX, kind: 'stairs', x1: 7.2, x2: 10.4, y1: 11.2, y2: 14.3, height: .58 },
  { roomIndex: STARTING_ROOM_INDEX, kind: 'platform', x1: 10.4, x2: 15.5, y1: 11.2, y2: 15.4, height: .58 },
  { roomIndex: STARTING_ROOM_INDEX, kind: 'platform', x1: 21.2, x2: 26.8, y1: 2.2, y2: 5.2, height: .42 },
  { roomIndex: STARTING_ROOM_INDEX + 1, kind: 'stairs', x1: 9.0, x2: 12.2, y1: 10.2, y2: 13.4, height: .46 },
  { roomIndex: STARTING_ROOM_INDEX + 1, kind: 'platform', x1: 12.2, x2: 18.6, y1: 10.2, y2: 14.5, height: .46 },
  { roomIndex: STARTING_ROOM_INDEX + 2, kind: 'stairs', x1: 18.6, x2: 21.8, y1: 4.4, y2: 7.4, height: .52 },
  { roomIndex: STARTING_ROOM_INDEX + 2, kind: 'platform', x1: 21.8, x2: 27.6, y1: 3.0, y2: 7.4, height: .52 },
].map((piece) => Object.freeze({
  ...piece,
  x1: roomOffsets[piece.roomIndex] + piece.x1,
  x2: roomOffsets[piece.roomIndex] + piece.x2,
})));

function roomInset(roomIndex) {
  return isMissionRoom(roomIndex)
    ? { x: MISSION_INSET_X, y: MISSION_INSET_Y }
    : { x: ROOM_INSET_X, y: ROOM_INSET_Y };
}
function roomContentPoint(roomIndex, x, y) {
  if (rooms[roomIndex]?.id === 'threshold' || roomIndex === BOSS_ROOM_INDEX || roomIndex === SANCTUARY_ROOM_INDEX) return { x, y };
  if (isMissionRoom(roomIndex)) {
    // Re-home authored content into the new architecture: low X is the west
    // gallery, high X is the east gallery, and the middle remains a shared
    // combat room. This keeps the portfolio evidence distributed across the
    // world instead of leaving every prop in the old room footprint.
    const mappedX = x <= 4.5 ? x + 2 : x >= 11.5 ? x + 13 : x + 8;
    const mappedY = y <= 4.5 ? y + 1.5 : y + 8;
    return { x: mappedX, y: mappedY };
  }
  const inset = roomInset(roomIndex);
  return { x: x + inset.x, y: y + inset.y };
}

const MISSION_ROOM_LAYOUTS = {
  // The route language changes from room to room: a funnel, gallery, hub, weave,
  // workshop loop, and hearth loop. Every profile still enters at the west door
  // and exits at the east door, so the world remains one connected journey.
  threshold: {
    chambers: [[2, 2, 8, 7], [2, 10, 9, 16], [12, 2, 20, 7], [12, 10, 20, 16], [23, 2, 30, 7], [23, 10, 30, 16]],
    route: [[1, 9, 8, 9], [8, 9, 8, 5], [8, 5, 17, 5], [17, 5, 17, 13], [17, 13, 26, 13], [26, 13, 26, 5], [26, 5, 31, 5]],
    branches: [[8, 5, 11, 5], [17, 13, 21, 13], [26, 5, 30, 5]],
    landmarks: [[10, 3, 1, 4], [21, 10, 1, 4]],
    waypoints: [[4, 8, 1, 2], [12, 4, 1, 2], [20, 12, 1, 2], [28, 4, 1, 2]],
  },
  trophy: {
    chambers: [[2, 2, 8, 7], [2, 10, 9, 16], [11, 2, 19, 7], [11, 10, 20, 16], [22, 2, 29, 7], [22, 10, 30, 16]],
    route: [[1, 5, 4, 5], [4, 5, 4, 3], [4, 3, 13, 3], [13, 3, 13, 14], [13, 14, 23, 14], [23, 14, 23, 4], [23, 4, 31, 4], [31, 4, 31, 5]],
    branches: [[4, 3, 7, 3], [13, 14, 8, 14], [23, 4, 28, 4], [23, 14, 28, 14]],
    landmarks: [[9, 6, 2, 1], [20, 11, 2, 1], [9, 11, 1, 2], [20, 5, 1, 2]],
    waypoints: [[11, 8, 1, 2], [15, 8, 1, 2], [21, 8, 1, 2], [25, 8, 1, 2]],
  },
  quests: {
    chambers: [[2, 2, 8, 7], [2, 10, 8, 16], [11, 2, 19, 7], [11, 10, 20, 16], [22, 2, 29, 7], [22, 10, 30, 16]],
    route: [[1, 5, 6, 5], [6, 5, 6, 14], [6, 14, 16, 14], [16, 14, 16, 7], [16, 7, 26, 7], [26, 7, 26, 13], [26, 13, 31, 13], [31, 13, 31, 5], [31, 5, 31, 5]],
    branches: [[6, 5, 3, 5], [16, 7, 20, 7], [26, 13, 30, 13]],
    landmarks: [[9, 3, 2, 1], [20, 14, 2, 1], [29, 8, 2, 1]],
    waypoints: [[4, 9, 1, 2], [8, 9, 1, 2], [14, 10, 1, 2], [18, 10, 1, 2], [24, 10, 1, 2], [28, 10, 1, 2]],
  },
  chronicle: {
    chambers: [[2, 2, 8, 7], [2, 10, 9, 16], [11, 2, 19, 7], [11, 10, 20, 16], [22, 2, 29, 7], [22, 10, 30, 16]],
    route: [[1, 5, 4, 5], [4, 5, 4, 14], [4, 14, 13, 14], [13, 14, 13, 4], [13, 4, 22, 4], [22, 4, 22, 14], [22, 14, 30, 14], [30, 14, 30, 5], [30, 5, 31, 5]],
    branches: [[4, 5, 8, 5], [13, 4, 18, 4], [22, 14, 26, 14], [30, 14, 31, 14]],
    landmarks: [[8, 7, 1, 4], [19, 3, 1, 4], [29, 10, 1, 4]],
    waypoints: [[2, 9, 1, 2], [6, 9, 1, 2], [11, 8, 1, 2], [15, 8, 1, 2], [20, 9, 1, 2], [24, 9, 1, 2]],
  },
  character: {
    chambers: [[2, 2, 8, 7], [2, 10, 9, 16], [11, 2, 19, 7], [11, 10, 20, 16], [22, 2, 29, 7], [22, 10, 30, 16]],
    route: [[1, 5, 7, 5], [7, 5, 7, 13], [7, 13, 19, 13], [19, 13, 19, 5], [19, 5, 28, 5], [28, 5, 28, 14], [28, 14, 31, 14], [31, 14, 31, 5]],
    branches: [[7, 13, 4, 13], [19, 5, 23, 5], [28, 14, 25, 14]],
    landmarks: [[9, 3, 2, 1], [20, 14, 2, 1], [24, 8, 1, 3]],
    waypoints: [[5, 9, 1, 2], [9, 9, 1, 2], [17, 8, 1, 2], [21, 8, 1, 2], [26, 10, 1, 2], [30, 10, 1, 2]],
  },
  campfire: {
    chambers: [[2, 2, 8, 7], [2, 10, 9, 16], [11, 2, 19, 7], [11, 10, 20, 16], [22, 2, 29, 7], [22, 10, 30, 16]],
    route: [[1, 5, 4, 5], [4, 5, 4, 13], [4, 13, 15, 13], [15, 13, 15, 5], [15, 5, 26, 5], [26, 5, 26, 14], [26, 14, 31, 14], [31, 14, 31, 5]],
    branches: [[4, 5, 8, 5], [15, 13, 11, 13], [26, 5, 30, 5]],
    landmarks: [[9, 7, 2, 1], [19, 10, 2, 1], [28, 3, 1, 3]],
    waypoints: [[2, 9, 1, 2], [6, 9, 1, 2], [13, 8, 1, 2], [17, 8, 1, 2], [24, 10, 1, 2], [28, 10, 1, 2]],
  },
};

function applyMissionRoomLayout(map, room, roomIndex) {
  const width = map[0].length;
  const height = map.length;
  const profile = MISSION_ROOM_LAYOUTS[room.id] || MISSION_ROOM_LAYOUTS.threshold;
  const wall = (x, y) => {
    if (x > 0 && x < width - 1 && y > 0 && y < height - 1) map[y][x] = '1';
  };
  const carve = (x1, y1, x2, y2) => {
    const left = Math.max(1, Math.min(x1, x2));
    const right = Math.min(width - 2, Math.max(x1, x2));
    const top = Math.max(1, Math.min(y1, y2));
    const bottom = Math.min(height - 2, Math.max(y1, y2));
    for (let y = top; y <= bottom; y += 1) {
      for (let x = left; x <= right; x += 1) map[y][x] = '0';
    }
  };
  const passage = (x1, y1, x2, y2, thickness = 2) => {
    const half = Math.floor(thickness / 2);
    if (x1 === x2) carve(x1 - half, y1, x2 + half, y2);
    else if (y1 === y2) carve(x1, y1 - half, x2, y2 + half);
    else {
      carve(x1, y1, x2, y1 + half);
      carve(x2 - half, y1, x2, y2);
    }
  };
  const cover = (x, y, w = 1, h = 1) => {
    for (let yy = y; yy < y + h; yy += 1) for (let xx = x; xx < x + w; xx += 1) wall(xx, yy);
  };
  const doorY = roomDoorY(roomIndex);

  if (miniBossRoom(roomIndex)) {
    // Each mini-boss arena has its own readable combat language: broad lanes,
    // deliberate cover, and no dead-end maze that can trap the player.
    for (let y = 1; y < height - 1; y += 1) for (let x = 1; x < width - 1; x += 1) map[y][x] = '0';
    const roomId = room.id;
    const coverSets = {
      trophy: [
        [4, 3, 2, 2], [4, height - 5, 2, 2], [width - 6, 3, 2, 2], [width - 6, height - 5, 2, 2],
        [11, 5, 2, 1], [width - 13, height - 6, 2, 1],
      ],
      chronicle: [
        [6, 3, 1, 3], [12, height - 6, 1, 3], [18, 3, 1, 3], [24, height - 6, 1, 3],
        [9, 7, 2, 1], [width - 11, 9, 2, 1],
      ],
      campfire: [
        [4, 3, 3, 1], [7, 4, 1, 3], [width - 8, height - 4, 3, 1], [width - 8, height - 7, 1, 3],
        [14, 5, 2, 1], [width - 16, height - 6, 2, 1],
      ],
    }[roomId] || [];
    for (const [x, y, w, h] of coverSets) {
      for (let yy = y; yy < y + h; yy += 1) for (let xx = x; xx < x + w; xx += 1) {
        if (xx > 0 && xx < width - 1 && yy > 0 && yy < height - 1) map[yy][xx] = '1';
      }
    }
    // Keep the entry/exit corridor and a central boss lane open.
    for (const y of [doorY, doorY + 1, Math.floor(height / 2), Math.floor(height / 2) + 1]) {
      for (let x = 1; x < width - 1; x += 1) map[y][x] = '0';
      map[y][0] = '0'; map[y][width - 1] = '0';
    }
    for (const x of [Math.floor(width / 2) - 1, Math.floor(width / 2)]) {
      for (let y = 1; y < height - 1; y += 1) map[y][x] = '0';
    }
    return;
  }

  // Begin as solid rock, then cut six readable bays. The profile-specific route
  // is the navigation landmark; the bays give enemies and evidence room to stage
  // without turning the whole floor into a featureless rectangle.
  for (let y = 1; y < height - 1; y += 1) for (let x = 1; x < width - 1; x += 1) map[y][x] = '1';
  profile.chambers.forEach((bounds) => carve(...bounds));
  const allRouteSegments = [...profile.route, ...profile.branches];
  for (const [x1, y1, x2, y2] of allRouteSegments) passage(x1, y1, x2, y2, 1);

  // Small shoulders and room-specific landmarks communicate where the player is
  // in the route. They create sightline breaks, but never seal a combat bay.
  cover(9, 3, 1, 2); cover(9, 6, 1, 2);
  cover(9, 12, 1, 2); cover(9, 15, 1, 2);
  cover(20, 3, 1, 2); cover(20, 6, 1, 2);
  cover(21, 12, 1, 2); cover(21, 15, 1, 2);
  cover(30, 3, 1, 2); cover(30, 6, 1, 2);
  cover(30, 12, 1, 2); cover(30, 15, 1, 2);
  profile.landmarks.forEach((landmark) => cover(...landmark));
  // Paired waypoint posts create three readable encounter beats along each
  // route. They sit outside the two-cell travel lane, acting as visual gates
  // without turning the optional galleries into dead ends.
  (profile.waypoints || []).forEach((waypoint) => cover(...waypoint));

  // Door lips sit beside the route so each turn reads as a deliberate room
  // entrance instead of another opening in a large hall.
  cover(9, 3, 2, 1); cover(9, 14, 2, 1);
  cover(19, 3, 2, 1); cover(19, 14, 2, 1);
  cover(30, 3, 1, 2); cover(30, 14, 1, 2);

  // Low cover alternates by depth, so a player cannot solve every encounter with
  // the same strafe direction.
  if (roomIndex % 2 === 0) {
    cover(4, 3, 2, 1); cover(13, 3, 1, 2); cover(25, 4, 2, 1);
    cover(4, 13, 2, 1); cover(13, 14, 1, 2); cover(25, 13, 2, 1);
  } else {
    cover(6, 5, 1, 2); cover(16, 5, 2, 1); cover(28, 3, 1, 2);
    cover(6, 12, 1, 2); cover(15, 12, 2, 1); cover(27, 14, 2, 1);
  }
  if (roomIndex === 3 || roomIndex === 5) {
    cover(3, 3, 2, 1); cover(17, 14, 2, 1); cover(24, 5, 1, 2);
  }
  // Combat pockets: offset barricades make each bay a push/peek decision rather
  // than a straight hallway, while leaving the two-cell route open for dodging.
  if (roomIndex % 3 === 0) {
    cover(7, 3, 2, 1); cover(14, 12, 2, 1); cover(24, 3, 1, 2); cover(28, 12, 2, 1);
  } else if (roomIndex % 3 === 1) {
    cover(3, 12, 1, 2); cover(11, 3, 2, 1); cover(21, 12, 1, 2); cover(27, 4, 2, 1);
  } else {
    cover(7, 6, 1, 2); cover(15, 10, 2, 1); cover(24, 6, 1, 2); cover(28, 10, 2, 1);
  }

  // Protect authored content locally without reopening the entire chamber. The
  // final reassertion below guarantees the main route remains traversable after
  // an item footprint or set-dressing piece has been carved.
  const protectedPoints = [room.spawn, ...room.items, ...room.enemies];
  for (const point of protectedPoints) {
    const contentPoint = roomContentPoint(roomIndex, point.x, point.y);
    carve(Math.floor(contentPoint.x - 1), Math.floor(contentPoint.y - 1), Math.ceil(contentPoint.x + 1), Math.ceil(contentPoint.y + 1));
  }
  carve(1, doorY - 1, 3, doorY + 2);

  // Reassert the profile route at two cells wide. This is both a design choice
  // (comfortable dodging around bends) and a safety net against overlap with
  // authored props/enemies. Branches remain one cell wide to form optional nooks.
  for (const [x1, y1, x2, y2] of profile.route) passage(x1, y1, x2, y2, 2);
  for (const [x1, y1, x2, y2] of profile.branches) passage(x1, y1, x2, y2, 1);

  // The room boundary is a wall everywhere else, but both connector rows must
  // meet the inter-room corridor at x = width - 1.
  carve(1, doorY - 1, 3, doorY + 2);
  carve(width - 5, doorY - 1, width - 2, doorY + 2);
  for (const y of [doorY, doorY + 1]) map[y][width - 1] = '0';
}
function applyDungeonRoomWalls(map, room, roomIndex) {
  if (isMissionRoom(roomIndex)) {
    applyMissionRoomLayout(map, room, roomIndex);
    return;
  }
  if (roomIndex === 0 || roomIndex === BOSS_ROOM_INDEX || roomIndex === SANCTUARY_ROOM_INDEX) return;
  // Small non-mission rooms retain their authored geometry, but do not receive
  // a forced full-width central escape lane.
  const width = map[0].length;
  const height = map.length;
  const wall = (x, y) => { if (x > 0 && x < width - 1 && y > 0 && y < height - 1) map[y][x] = '1'; };
  const clear = (x, y) => { if (x > 0 && x < width - 1 && y > 0 && y < height - 1) map[y][x] = '0'; };
  const doorY = roomDoorY(roomIndex);
  for (const y of [doorY, doorY + 1]) for (let x = 1; x < width - 1; x += 1) clear(x, y);
  // A compact threshold arrangement: one offset shoulder and one side pocket.
  for (let y = 2; y < Math.min(5, height - 2); y += 1) wall(6, y);
  for (let y = Math.max(7, height - 4); y < height - 2; y += 1) wall(width - 7, y);
}

function expandedRoomMap(room, roomIndex) {
  const width = roomWidths[roomIndex];
  const height = roomHeights[roomIndex];
  const map = Array.from({ length: height }, (_, y) => Array.from({ length: width }, (_, x) => (x === 0 || y === 0 || x === width - 1 || y === height - 1) ? '1' : '0'));
  const doorY = roomDoorY(roomIndex);

  if (isMissionRoom(roomIndex)) {
    applyMissionRoomLayout(map, room, roomIndex);
    return map.map((row) => row.join(''));
  }
  if (roomIndex !== BOSS_ROOM_INDEX && roomIndex !== SANCTUARY_ROOM_INDEX) {
    for (let y = 0; y < room.map.length; y += 1) {
      for (let x = 0; x < room.map[y].length; x += 1) map[y + ROOM_INSET_Y][x + ROOM_INSET_X] = room.map[y][x];
    }
    for (const y of [doorY, doorY + 1]) for (let x = 1; x < width - 1; x += 1) map[y][x] = '0';
    applyDungeonRoomWalls(map, room, roomIndex);
    if (roomIndex === 0) {
      for (let y = 1; y < height - 1; y += 1) for (let x = 1; x < width - 1; x += 1) map[y][x] = '0';
    }
    return map.map((row) => row.join(''));
  }

  if (roomIndex === SANCTUARY_ROOM_INDEX) {
    const centerY = Math.floor(height / 2);
    for (const y of [doorY, doorY + 1, centerY - 1, centerY]) for (let x = 1; x < width - 1; x += 1) map[y][x] = '0';
    for (const x of [5, width - 6]) for (let y = 3; y < height - 3; y += 1) {
      if (![doorY - 1, doorY, doorY + 1, doorY + 2, centerY - 1, centerY].includes(y)) map[y][x] = '1';
    }
    return map.map((row) => row.join(''));
  }

  // Boss arena: broad enough for its patterns, but still divided into side
  // galleries so the player can use space rather than only backpedal.
  const centerY = Math.floor(height / 2);
  for (let y = 3; y < height - 3; y += 1) {
    if (![doorY, doorY + 1, centerY - 1, centerY].includes(y)) { map[y][8] = '1'; map[y][width - 9] = '1'; }
  }
  for (let x = 3; x < width - 3; x += 1) if (x < 8 || x > width - 9) { map[4][x] = '1'; map[height - 5][x] = '1'; }
  for (const y of [doorY, doorY + 1, centerY - 1, centerY]) for (let x = 1; x < width - 1; x += 1) map[y][x] = '0';
  for (const x of [8, width - 9]) for (const y of [doorY - 1, doorY, doorY + 1, doorY + 2, centerY - 1, centerY]) map[y][x] = '0';
  // The post-boss exit is on the east wall. Keep a broad, guaranteed route
  // from the center lane to the portal instead of relying on decorative gaps.
  const exitX = width - 3;
  for (let y = centerY - 1; y <= centerY + 1; y += 1) {
    for (let x = width - 10; x <= width - 2; x += 1) map[y][x] = '0';
  }
  for (let y = centerY - 1; y <= centerY + 1; y += 1) map[y][width - 1] = '0';
  return map.map((row) => row.join(''));
}

/* Copy each chamber into one world grid, then cut doors through the connected level corridors. */
for (let roomIndex = 0; roomIndex < rooms.length; roomIndex += 1) {
  const room = rooms[roomIndex];
  const offset = roomOffsets[roomIndex];
  const map = expandedRoomMap(room, roomIndex);
  for (let y = 0; y < roomHeights[roomIndex]; y += 1) {
    for (let x = 0; x < roomWidths[roomIndex]; x += 1) worldMap[y][offset + x] = map[y][x];
  }
}
for (let roomIndex = 0; roomIndex < rooms.length - 1; roomIndex += 1) {
  if (roomIndex === BOSS_ROOM_INDEX) continue;
  const corridorStart = roomOffsets[roomIndex] + roomWidths[roomIndex];
  const corridorGap = gapAfterRoom(roomIndex);
  const corridorRows = [roomDoorY(roomIndex), roomDoorY(roomIndex) + 1];
  for (const y of corridorRows) {
    worldMap[y][roomOffsets[roomIndex] + roomWidths[roomIndex] - 1] = '0';
    for (let x = corridorStart; x < corridorStart + corridorGap; x += 1) worldMap[y][x] = '0';
    worldMap[y][roomOffsets[roomIndex + 1]] = '0';
  }
}
// Mission rooms connect directly through their east/west door rows.

const SANCTUARY_TREES = [
  { id: 'final-tree-northwest', roomIndex: SANCTUARY_ROOM_INDEX, x: SANCTUARY_ROOM_OFFSET + 2.8, y: 2.25, scale: .9, yaw: .18 },
  { id: 'final-tree-north', roomIndex: SANCTUARY_ROOM_INDEX, x: SANCTUARY_ROOM_OFFSET + 8.2, y: 2.0, scale: .78, yaw: -.16 },
  { id: 'final-tree-north-center', roomIndex: SANCTUARY_ROOM_INDEX, x: SANCTUARY_ROOM_OFFSET + 15.2, y: 2.15, scale: .88, yaw: .11 },
  { id: 'final-tree-northeast', roomIndex: SANCTUARY_ROOM_INDEX, x: SANCTUARY_ROOM_OFFSET + 22.8, y: 2.3, scale: .82, yaw: -.2 },
  { id: 'final-tree-east', roomIndex: SANCTUARY_ROOM_INDEX, x: SANCTUARY_ROOM_OFFSET + 27.1, y: 6.4, scale: .94, yaw: .14 },
  { id: 'final-tree-east-lower', roomIndex: SANCTUARY_ROOM_INDEX, x: SANCTUARY_ROOM_OFFSET + 27.0, y: 10.6, scale: .82, yaw: -.12 },
  { id: 'final-tree-southeast', roomIndex: SANCTUARY_ROOM_INDEX, x: SANCTUARY_ROOM_OFFSET + 23.8, y: 15.4, scale: .96, yaw: .2 },
  { id: 'final-tree-south-center', roomIndex: SANCTUARY_ROOM_INDEX, x: SANCTUARY_ROOM_OFFSET + 16.1, y: 15.35, scale: .8, yaw: -.1 },
  { id: 'final-tree-southwest', roomIndex: SANCTUARY_ROOM_INDEX, x: SANCTUARY_ROOM_OFFSET + 10.2, y: 15.7, scale: .9, yaw: .16 },
  { id: 'final-tree-west-lower', roomIndex: SANCTUARY_ROOM_INDEX, x: SANCTUARY_ROOM_OFFSET + 2.8, y: 10.6, scale: .84, yaw: -.18 },
  { id: 'final-tree-west', roomIndex: SANCTUARY_ROOM_INDEX, x: SANCTUARY_ROOM_OFFSET + 2.7, y: 6.4, scale: .78, yaw: .12 },
];

const GATE_TUTORIAL_ABILITY = {
  id: 'archive-key',
  name: 'Archive Key',
  glyph: '⟐',
  color: '#6ce0c2',
  description: 'A tutorial sigil that can open the archive gate. It has no combat effect.',
  effect: 'opens the archive gate',
  kind: 'gate',
  tutorial: true,
};
const ABILITY_FORMS = [
  { id: 'scope-sight', name: 'Scope Sight', glyph: '◎', color: '#6ce0c2', threshold: 50, cooldown: 6, description: 'Reveals enemies and recovered evidence through the walls for a few seconds.', effect: 'reveals the signal', kind: 'reveal' },
  { id: 'ledger-ward', name: 'Ledger Ward', glyph: '✦', color: '#e3c66e', threshold: 150, cooldown: 8, description: 'Raises a golden ward that sharply reduces incoming damage for seven seconds.', effect: 'guards the evidence', kind: 'ward' },
  { id: 'forge-ember', name: 'Forge Ember', glyph: '✹', color: '#db8872', threshold: 300, cooldown: 3.8, description: 'Launches an explosive fireball with an area-of-effect impact.', effect: 'fires the iteration', kind: 'fireball' },
  { id: 'gate-light', name: 'Gate Light', glyph: '△', color: '#e9e9e0', threshold: 500, cooldown: 10, description: 'A piercing beam that tears through every hostile target in its path.', effect: 'opens the next answer', kind: 'beam' },
];
const XP_PER_SCROLL = 25;
// Authored records are templates only. The live world starts empty and records
// are created at an enemy's position only after that enemy is defeated.
const worldItems = [];

// Additional hostiles populate the combat bays instead of leaving the snake as
// an empty navigation exercise. Positions deliberately occupy the side rooms,
// not the one-cell connectors.
const extraMissionEnemies = {
  threshold: [
    { id: 'threshold-skitter', name: 'Threshold Skitter', kind: 'crawler', x: 18.8, y: 9, hp: 52, speed: .34, damage: 6, color: '#9a6845' },
    { id: 'threshold-larva', name: 'Threshold Larva', kind: 'leech', x: 22.8, y: 4.2, hp: 48, speed: .42, damage: 5, color: '#78915f' },
    { id: 'threshold-imp', name: 'Blood Imp', kind: 'imp', x: 25.8, y: 13, hp: 54, speed: .48, damage: 6, color: '#c4473f' },
    { id: 'threshold-soldier', name: 'Hellwatch Soldier', kind: 'seer', attackStyle: 'ranged', x: 29, y: 5, hp: 58, speed: .25, damage: 7, color: '#9b684d' },
  ],
  trophy: [
    { id: 'vault-brute', name: 'Vault Brute', kind: 'warden', x: 5.2, y: 5.2, hp: 105, speed: .26, damage: 11, color: '#a66e60' },
    { id: 'signal-moth-two', name: 'Signal Moth', kind: 'moth', attackStyle: 'ranged', x: 11.8, y: 6.2, hp: 60, speed: .52, damage: 6, color: '#d0a45e' },
    { id: 'vault-zombie', name: 'Vault Revenant', kind: 'ghoul', x: 6.8, y: 6.5, hp: 62, speed: .4, damage: 7, color: '#8a7862' },
    { id: 'vault-soldier', name: 'Ledger Gunner', kind: 'seer', attackStyle: 'ranged', x: 13.5, y: 4.8, hp: 64, speed: .25, damage: 8, color: '#a26d4b' },
  ],
  quests: [
    { id: 'quest-crawler-two', name: 'Loose Requirement', kind: 'crawler', x: 4.8, y: 5.6, hp: 72, speed: .34, damage: 8, color: '#b77754' },
    { id: 'quest-imp', name: 'Scope Imp', kind: 'imp', x: 12.8, y: 6.2, hp: 68, speed: .48, damage: 7, color: '#bd6b72' },
    { id: 'quest-zombie', name: 'Process Husk', kind: 'beast', x: 6.0, y: 2.5, hp: 74, speed: .34, damage: 8, color: '#9b5145' },
    { id: 'quest-soldier', name: 'Route Gunner', kind: 'seer', attackStyle: 'ranged', x: 13.5, y: 4.5, hp: 70, speed: .25, damage: 9, color: '#a96b4d' },
  ],
  chronicle: [
    { id: 'chronicle-wraith-two', name: 'Old Handoff', kind: 'wraith', attackStyle: 'ranged', x: 4.5, y: 5.8, hp: 84, speed: .34, damage: 8, color: '#668ed0' },
    { id: 'chronicle-leech', name: 'Archive Leech', kind: 'leech', x: 12.8, y: 6.1, hp: 66, speed: .46, damage: 6, color: '#7d9bd1' },
    { id: 'chronicle-zombie', name: 'Dead Integration', kind: 'ghoul', x: 6.0, y: 2.4, hp: 76, speed: .4, damage: 8, color: '#77816e' },
    { id: 'chronicle-soldier', name: 'Archive Gunner', kind: 'seer', attackStyle: 'ranged', x: 13.6, y: 4.8, hp: 78, speed: .25, damage: 9, color: '#8f6b51' },
  ],
  character: [
    { id: 'toolkit-warden', name: 'Toolkit Warden', kind: 'warden', x: 4.6, y: 5.1, hp: 106, speed: .25, damage: 11, color: '#b47469' },
    { id: 'syntax-moth', name: 'Syntax Moth', kind: 'moth', attackStyle: 'ranged', x: 12.6, y: 6.3, hp: 64, speed: .54, damage: 6, color: '#c7a359' },
    { id: 'toolkit-zombie', name: 'Broken Schema', kind: 'beast', x: 6.0, y: 2.4, hp: 84, speed: .36, damage: 9, color: '#a45242' },
    { id: 'toolkit-soldier', name: 'Integration Gunner', kind: 'seer', attackStyle: 'ranged', x: 13.5, y: 4.7, hp: 82, speed: .25, damage: 10, color: '#9d694a' },
  ],
  campfire: [
    { id: 'garden-beast', name: 'Garden Beast', kind: 'beast', attackStyle: 'ground', x: 4.8, y: 5.8, hp: 98, speed: .34, damage: 10, color: '#77915d' },
    { id: 'noise-imp', name: 'Noise Imp', kind: 'imp', x: 12.5, y: 6.2, hp: 76, speed: .5, damage: 8, color: '#d16f63' },
    { id: 'ash-zombie', name: 'Ashen Revenant', kind: 'ghoul', x: 6.0, y: 2.3, hp: 88, speed: .4, damage: 9, color: '#9b4b3d' },
    { id: 'ash-soldier', name: 'Cinder Gunner', kind: 'seer', attackStyle: 'ranged', x: 13.6, y: 4.8, hp: 84, speed: .25, damage: 10, color: '#a96747' },
  ],
};
for (const room of rooms) if (extraMissionEnemies[room.id]) room.enemies.push(...extraMissionEnemies[room.id]);

// Use the new OG-Doom front-facing sprite rows for ordinary hostiles. Bosses
// keep their authored boss presentation, while room enemies are assigned one of
// three readable combat roles: zombie melee, soldier ranged, or insectoid ranged.
function enemySpriteKindFromLegacy(kind, index = 0) {
  if (['archon', 'boss'].includes(kind)) return kind;
  if (['moth', 'leech', 'crawler', 'briar-mantis'].includes(kind)) return 'insectoid';
  if (['seer', 'wraith'].includes(kind)) return 'soldier';
  if (['imp', 'ghoul', 'hound', 'beast', 'quake', 'warden'].includes(kind)) return index % 3 === 1 ? 'soldier' : 'zombie';
  return index % 3 === 2 ? 'insectoid' : index % 3 === 1 ? 'soldier' : 'zombie';
}
for (const room of rooms) for (const [index, enemy] of (room.enemies || []).entries()) {
  // Mini-bosses keep their authored combat profiles. Converting the first
  // encounter's `warden` into a generic zombie discarded its large melee
  // profile and made the arena target unreliable at close range.
  if (enemy.miniBoss) {
    enemy.archetype = enemy.kind;
    enemy.attackStyle = enemy.attackStyle || (enemy.kind === 'quake' ? 'ground' : 'melee');
    enemy.speed = Math.max(enemy.speed || 0, enemy.kind === 'warden' ? .48 : .42);
    continue;
  }
  enemy.kind = enemySpriteKindFromLegacy(enemy.kind, index);
  enemy.archetype = enemy.kind;
  enemy.attackStyle = enemy.kind === 'zombie' ? 'melee' : 'ranged';
  enemy.speed = Math.max(enemy.speed || 0, enemy.kind === 'zombie' ? .88 : enemy.kind === 'insectoid' ? .68 : .52);
}

const worldEnemies = [];
for (let roomIndex = 0; roomIndex < rooms.length; roomIndex += 1) {
  const room = rooms[roomIndex];
  const offset = roomOffsets[roomIndex];
  // Portfolio evidence is delivered through room design and narrator
  // transmissions, not collectible scrolls.
  room.enemies.forEach((enemy, index) => worldEnemies.push({
    ...enemy,
    x: roomContentPoint(roomIndex, enemy.x, enemy.y).x + offset,
    y: roomContentPoint(roomIndex, enemy.x, enemy.y).y,
    roomIndex,
    name: enemy.name,
    displayName: enemy.name,
    archetype: enemy.archetype || enemy.kind || 'zombie',
    kind: enemy.kind || 'zombie',
    maxHp: enemy.hp,
    cooldown: 0,
    attackTime: 0,
    attackHit: false,
    attackStyle: enemy.attackStyle || (enemy.kind === 'zombie' ? 'melee' : 'ranged'),
    attackTarget: null,
    attackDuration: enemy.attackDuration || 0,
    hitTime: 0,
    walkPhase: index * 2.3,
    alerted: true,
    dead: false,
    deathTime: 0,
    dropTemplates: [],
    miniBoss: Boolean(enemy.miniBoss),
  }));
}
function isClearForSpawn(x, y, radius = .26) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(radius)) return false;
  return !isWall(x - radius, y - radius) && !isWall(x + radius, y - radius) && !isWall(x - radius, y + radius) && !isWall(x + radius, y + radius);
}
function findWalkableSpawnPoint(x, y, roomIndex, occupied = []) {
  const room = rooms[roomIndex];
  const startX = roomOffsets[roomIndex];
  const width = roomWidths[roomIndex];
  const height = roomHeights[roomIndex];
  if (!room || !Number.isFinite(startX) || !Number.isFinite(width) || !Number.isFinite(height)) {
    throw new Error(`Invalid spawn room index: ${roomIndex}`);
  }
  const minX = startX + 1.3;
  const maxX = startX + width - 1.3;
  const minY = 1.3;
  const maxY = height - 1.3;
  const valid = (candidate) => isClearForSpawn(candidate.x, candidate.y) && occupied.every((point) => Math.hypot(candidate.x - point.x, candidate.y - point.y) >= .72);
  const original = { x: clamp(x, minX, maxX), y: clamp(y, minY, maxY) };
  if (valid(original)) return original;
  for (let ring = 1; ring <= 24; ring += 1) {
    const radius = ring * .25;
    for (let segment = 0; segment < 16; segment += 1) {
      const angle = segment * Math.PI * 2 / 16;
      const candidate = { x: clamp(x + Math.cos(angle) * radius, minX, maxX), y: clamp(y + Math.sin(angle) * radius, minY, maxY) };
      if (valid(candidate)) return candidate;
    }
  }
  for (let gridY = minY; gridY <= maxY; gridY += .5) {
    for (let gridX = minX; gridX <= maxX; gridX += .5) {
      const candidate = { x: gridX, y: gridY };
      if (valid(candidate)) return candidate;
    }
  }
  return original;
}
function recoverPlayerFromWall(preferredRoomIndex = null) {
  if (canStand(state.player.x, state.player.y)) return false;
  const arenaRoomIndex = state.miniBossArena?.roomIndex;
  const roomIndex = Number.isInteger(preferredRoomIndex)
    ? preferredRoomIndex
    : Number.isInteger(arenaRoomIndex) ? arenaRoomIndex : currentRoomIndex();
  const occupied = worldEnemies
    .filter((enemy) => enemy.roomIndex === roomIndex && !enemy.dead)
    .map((enemy) => ({ x: enemy.x, y: enemy.y }));
  let safePoint = findWalkableSpawnPoint(state.player.x, state.player.y, roomIndex, occupied);
  if (!canStand(safePoint.x, safePoint.y)) safePoint = findWalkableSpawnPoint(state.player.x, state.player.y, roomIndex);
  if (!canStand(safePoint.x, safePoint.y)) return false;
  state.player.x = safePoint.x;
  state.player.y = safePoint.y;
  return true;
}

const occupiedMonsterSpawns = [];
for (const enemy of worldEnemies) {
  const safePoint = findWalkableSpawnPoint(enemy.x, enemy.y, enemy.roomIndex, occupiedMonsterSpawns);
  enemy.x = safePoint.x;
  enemy.y = safePoint.y;
  occupiedMonsterSpawns.push(safePoint);
}

/* Enriched archive text from the current portfolio site. Each record keeps the
   game-readable summary, then adds context, ownership, methods, and outcomes. */
const scrollEnrichment = {
  'identity-sigil': [
    'Role context: customer-facing technical consulting across transportation, data, integrations, and delivery.',
    'Working method: investigate the evidence, clarify the requirement, automate the path, and measure what changed.'
  ],
  'consultant-seal': [
    'Ownership: coordinates across Operations, Cloud Services, Finance, and R&D.',
    'Delivery standard: translate system behavior and next steps into a decision the people operating the work can use.',
    'Technical notes: local Node.js delivery, Docker, Cloud Build, Cloud Run, and BigQuery support the broader portfolio ecosystem.'
  ],
  'account-ledger': [
    'Business context: five enterprise accounts represented roughly 50% of the team’s managed contract value.',
    'Ownership included customer support, improvement work, investigation, demos, coordination, and delivery.'
  ],
  'message-crystal': [
    'Problem context: production activity was distributed across active and legacy products, making usage difficult to interpret.',
    'Method: model message volume by customer, carrier, and billing period so operational evidence could support a business decision.'
  ],
  'savings-ledger': [
    'Method: analyze Azure usage, isolate the signal, and translate it into a Finance-ready recommendation.',
    'Outcome: approximately $40K in annualized savings identified through the analysis.'
  ],
  'endpoint-map': [
    'Problem context: endpoint guidance was difficult to find, deploy, and validate as customer-facing documentation grew.',
    'Method: create a repeatable publishing path with request and response validation before release.'
  ],
  'billing-quest': [
    'Problem: usage lived across active and legacy products, slowing billing decisions and making validation difficult.',
    'Method: centralized 15 months of activity in a BigQuery model and organized 1M+ monthly tracking messages by customer, carrier, and billing period.',
    'Ownership: data model, SQL and billing logic, reporting views, validation, and translation of usage into a Finance-ready workflow.',
    'Outcome: approximately $40K in annualized revenue recovered.'
  ],
  'documentation-quest': [
    'Problem: integration guidance needed a clearer path from authoring to customer-facing release.',
    'Method: create a reusable hub for 40+ customer endpoints, connect updates to one publishing path, and validate requests and responses before release.',
    'Ownership: documentation structure, deployment coordination, endpoint validation, and customer guidance.'
  ],
  'shipment-quest': [
    'Problem: a shipment could move to In Transit when a stop-arrival message arrived before the expected departure message.',
    'Method: correlate tracking messages with shipment events around each status transition and separate message timing from unrelated background updates.',
    'Outcome: isolated the triggering condition, coordinated with R&D, and validated the product-workflow fix. Customer and carrier details remain intentionally anonymized.'
  ],
  'search-quest': [
    'Problem: consultants and support employees relied on manual lookups to understand account relationships during live cases.',
    'Method: build a searchable internal tool covering 50,000+ shipper records and related account data.',
    'Outcome: reduced lookup and communication effort by approximately 30 minutes per request and helped support diagnose issues live.'
  ],
  'manhattan-current': [
    'Scope: customer-facing TMS integrations, cloud systems, analytics, billing, documentation, and process improvement.',
    'Ownership: support and improvement work for five enterprise accounts, stakeholder demos, requirements translation, and coordination across Operations, Cloud Services, Finance, and R&D.',
    'Proof: the accounts represented roughly 50% of the team’s managed contract value.'
  ],
  'manhattan-coop': [
    'Scope: cloud services, internal search, operational analytics, and cost analysis.',
    'Built: an SSO search tool for 50,000+ shipper records and an analysis that identified approximately $40K in Azure savings.',
    'Working lesson: make the evidence legible enough that the next team can act on it.'
  ],
  'soliant-chapter': [
    'Scope: systems operations and account onboarding.',
    'Method: automate account-setup work and audit the resulting account population for duplication.',
    'Outcome: duplicate accounts were tied to approximately $36K in annual savings.'
  ],
  'gtri-chapter': [
    'Scope: ATAS Lab research in robotic object detection.',
    'Method: build C# integration components that connected research workflows and supported experimentation.',
    'Foundation: early work moving between software components, evidence, and a physical-world system.'
  ],
  'uga-crest': [
    'Credential: B.S. Computer Systems Engineering, University of Georgia.',
    'Result: 3.83 GPA, May 2025.',
    'Relevance: a systems foundation for moving comfortably between data, software, integrations, and delivery.'
  ],
  'analytics-kit': [
    'Tools: Oracle SQL, BigQuery, Power BI, DAX, data modeling, billing, and reporting.',
    'Use: turn operational evidence into a decision that Finance, support, or an implementation team can use.',
    'Metric anchor: 15 months modeled for the billing case and 1M+ monthly tracking messages organized.'
  ],
  'integration-rune': [
    'Systems: Transportation Management Systems, MIF, EDI/X12, AS2, SFTP, message troubleshooting, and event troubleshooting.',
    'Use: follow the evidence through connected logistics systems and identify where the operating path diverges from the requirement.',
    'Delivery anchor: 40+ customer endpoints organized through reusable publishing and validation guidance.'
  ],
  'automation-kit': [
    'Languages and delivery: Python, PowerShell, Perl, Bash, JavaScript, C#, Git, and CI/CD.',
    'Use: make investigation, reporting, documentation, and support work modular, repeatable, and explainable.',
    'Preference: automate the path without losing the context needed by the person who will operate it.'
  ],
  'bread-loaf': [
    'Outside-work practice: long ferments, shaping, scoring, and small changes that show up in the next loaf.',
    'The same operating instinct applies: observe the evidence, adjust the process, and improve the next iteration.'
  ],
  'plant-cutting': [
    'Outside-work practice: light, propagation, watering routines, and building a greener home one cutting at a time.',
    'A quieter system that rewards consistency and attention to small signals.'
  ],
  'music-kit': [
    'Outside-work practice: drums first, bass now — the same groove from a different seat.',
    'Years behind a drum kit built the rhythm; learning bass adds another way to listen to the same system.'
  ],
  'atlanta-marker': [
    'Home base: Atlanta, Georgia.',
    'The setting for customer delivery, systems work, gardens, bread experiments, and music practice.'
  ],
  'sanctum-brief': [
    'Final encounter brief: every route, system, and decision is tested under pressure.',
    'The Archon is vulnerable between attack patterns; read the rhythm before committing to the next delivery.'
  ],
  'phase-ledger': [
    'Encounter structure: three phases, one operating system to dismantle.',
    'Watch the phase and shield signals, adjust the approach, and keep the objective visible.'
  ],
  'lightwell-record': [
    'Completion condition: the door of light opens after the Operations Archon falls.',
    'The case is a reminder that delivery is not complete until the outcome is usable.'
  ],
  'exit-seal': [
    'Return route: the final seal closes the archive loop and leads back to the portfolio lobby.',
    'The work remains available through the résumé, contact link, and LinkedIn record.'
  ]
};
// No collectible records are assigned to enemies. Evidence is surfaced by
// the room brief, narrator, and the final portfolio handoff.
function dungeonDifficultyForRoom(roomIndex) {
  const depth = Math.max(0, roomIndex - STARTING_ROOM_INDEX);
  return {
    depth,
    health: .94 + depth * .07,
    damage: .72 + depth * .045,
    speed: .96 + depth * .035,
    attackRate: .92 + depth * .045,
  };
}

// Scale ordinary dungeon enemies once, before initialEnemyData is captured. A
// reset therefore restores the same tuned encounter instead of reverting to the
// authored baseline. The final Archon is created separately and is untouched.
for (const enemy of worldEnemies) {
  if (enemy.boss || enemy.roomIndex >= FINAL_ROOM_INDEX) continue;
  const difficulty = dungeonDifficultyForRoom(enemy.roomIndex);
  // Give every encounter enough health to survive several deliberate plasma hits.
  enemy.hp = Math.round(Math.max(enemy.hp, 54) * difficulty.health * 1.42);
  enemy.maxHp = enemy.hp;
  enemy.damage = Math.round(enemy.damage * difficulty.damage);
  enemy.speed *= difficulty.speed;
  enemy.difficultyTier = difficulty.depth;
  enemy.difficultyAttackRate = difficulty.attackRate;
}

const initialEnemyData = worldEnemies.map((enemy) => ({ ...enemy, dropTemplates: [...enemy.dropTemplates] }));
const BOSS_MAX_HP = 900;
const BOSS_PHASES = [
  { name: 'PHASE I · THE BRIEF', threshold: 1, color: '#d99762' },
  { name: 'PHASE II · THE SYSTEM', threshold: .66, color: '#77a9e8' },
  { name: 'PHASE III · THE DELIVERY', threshold: .33, color: '#e9e9e0' },
];
const ARCHON_WAVES = [
  {
    label: 'THE FIRST RING',
    entries: [
      { kind: 'zombie', hp: 82, damage: 11, speed: .92, color: '#65734d' },
      { kind: 'insectoid', hp: 58, damage: 8, speed: .72, color: '#4f6a3d' },
    ],
  },
  {
    label: 'THE SYSTEM BREAK',
    entries: [
      { kind: 'zombie', hp: 96, damage: 13, speed: 1.02, color: '#65734d' },
      { kind: 'soldier', hp: 86, damage: 12, speed: .58, color: '#6e5937' },
      { kind: 'insectoid', hp: 72, damage: 9, speed: .82, color: '#4f6a3d' },
    ],
  },
  {
    label: 'THE FINAL DELIVERY',
    entries: [
      { kind: 'zombie', hp: 108, damage: 14, speed: 1.08, color: '#65734d' },
      { kind: 'zombie', hp: 100, damage: 13, speed: 1.04, color: '#65734d' },
      { kind: 'soldier', hp: 96, damage: 13, speed: .64, color: '#6e5937' },
      { kind: 'insectoid', hp: 82, damage: 10, speed: .9, color: '#4f6a3d' },
    ],
  },
];
const ARCHON_WAVE_MAX_ALIVE = 6;
const ARCHON_WAVE_SPAWN_POINTS = [
  { x: 5, y: 3 }, { x: 5, y: 15 }, { x: 12, y: 3 },
  { x: 12, y: 15 }, { x: 24, y: 3 }, { x: 24, y: 15 },
  { x: 27, y: 8 }, { x: 8, y: 9 },
];
function createFinalBoss() {
  return {
    id: 'operations-archon',
    name: 'THE OPERATIONS ARCHON',
    displayName: 'The Operations Archon',
    kind: 'warden',
    x: FINAL_ROOM_OFFSET + 15,
    y: 9,
    hp: BOSS_MAX_HP,
    maxHp: BOSS_MAX_HP,
    damage: 18,
    attackStyle: 'melee',
    attackDistance: 2.9,
    phase: 1,
    cooldown: 1.2,
    attackTime: 0,
    attackPattern: 0,
    patternTime: 0,
    attackTelegraph: null,
    hitTime: 0,
    shield: 0,
    dashTime: 0,
    summonTimer: 0,
    waveIndex: 0,
    waveState: 'idle',
    waveTimer: 0,
    waveActive: false,
    waveEnemiesRemaining: 0,
    waveCooldown: 0,
    waveSpawnQueue: [],
    waveSpawnTimer: 0,
    waveSpawnCursor: 0,
    waveIds: [],
    summonIds: [],
    pulse: 0,
    walkPhase: 0,
    dead: false,
    deathTime: 0,
    alerted: true,
    roomIndex: FINAL_ROOM_INDEX,
    boss: true,
  };
}

const lightGrid = new Float32Array(WORLD_WIDTH * WORLD_HEIGHT);

let ITEM_TOTAL = 0;
const FOV = Math.PI / 3;
const VERTICAL_FOV = Math.PI / 3;
const SKY_DISTANCE = 1000;
const MOON_AZIMUTH = .35;
const MOON_ELEVATION = .34;
const MAX_DEPTH = 36;
const BOSS_RENDER_DEPTH = 70;
const RAY_COUNT = 160;
const FLOOR_STEP = 6;
const RENDER_INTERVAL = 1000 / 36;
const MAX_PARTICLES = 260;
const MAX_REDUCED_PARTICLES = 130;
const MAX_PARTICLE_DRAW = 180;
const MAX_REDUCED_PARTICLE_DRAW = 90;
const MAX_IMPACT_BURSTS = 48;
const COMBAT_PARTICLE_DRAW_LIMIT = 54;
const COMBO_WINDOW = 1.35;
const ENEMY_ATTACK_DISTANCE = 2.34;
const MOVE_SPEED = 2.85;
const TURN_SPEED = 2.9;
const EYE_HEIGHT = .58;
const FLOOR_Z = 0;
const CEILING_Z = 2.2;
const TAU = Math.PI * 2;
const spriteCache = new Map();
const textures = {};

// Authored pixel-art assets. These are transparent RGBA derivatives of the
// two keyed sprite sheets in ~/Desktop/Images. Keep the procedural renderers
// below as a graceful fallback while the browser loads them.
function loadGameSprite(source) {
  const image = new Image();
  image.decoding = 'async';
  image.src = source;
  return image;
}
function spriteReady(image) {
  return Boolean(image && image.complete && image.naturalWidth > 0 && image.naturalHeight > 0);
}
function isChromaGreen(r, g, b) {
  // Generated sheets can contain a dark green anti-aliased fringe even after
  // their bright key color has been removed. Require green to dominate both
  // channels by a meaningful margin so teal plasma highlights remain intact.
  return g > 92 && g - r > 34 && g - b > 30 && g > r * 1.32 && g > b * 1.2;
}
function cleanEnemyAtlasCell(pixels, width, height) {
  // Remove chroma pixels first, then discard small opaque components that touch
  // a vertical cell edge. The generated sheet has a narrow neighboring-pose
  // sliver in one walk cell; keeping those edge components makes it appear as
  // a second sprite beside the zombie.
  const opaque = new Uint8Array(width * height);
  const visited = new Uint8Array(width * height);
  for (let index = 0; index < opaque.length; index += 1) {
    const offset = index * 4;
    const r = pixels.data[offset];
    const g = pixels.data[offset + 1];
    const b = pixels.data[offset + 2];
    const isNeutralBackdrop = r > 170 && g > 170 && b > 170 && Math.max(r, g, b) - Math.min(r, g, b) < 28;
    if (isChromaGreen(r, g, b) || isNeutralBackdrop) {
      pixels.data[offset + 3] = 0;
    } else if (pixels.data[offset + 3] > 0) {
      opaque[index] = 1;
    }
  }

  const components = [];
  for (let index = 0; index < opaque.length; index += 1) {
    if (!opaque[index] || visited[index]) continue;
    const queue = [index];
    visited[index] = 1;
    const component = { pixels: [], minX: width, minY: height, maxX: 0, maxY: 0, touchesEdge: false };
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const current = queue[cursor];
      const x = current % width;
      const y = Math.floor(current / width);
      component.pixels.push(current);
      component.minX = Math.min(component.minX, x);
      component.minY = Math.min(component.minY, y);
      component.maxX = Math.max(component.maxX, x + 1);
      component.maxY = Math.max(component.maxY, y + 1);
      if (x <= 1 || x >= width - 2) component.touchesEdge = true;
      const neighbors = [];
      if (x > 0) neighbors.push(current - 1);
      if (x + 1 < width) neighbors.push(current + 1);
      if (y > 0) neighbors.push(current - width);
      if (y + 1 < height) neighbors.push(current + width);
      for (const neighbor of neighbors) {
        if (opaque[neighbor] && !visited[neighbor]) {
          visited[neighbor] = 1;
          queue.push(neighbor);
        }
      }
    }
    components.push(component);
  }

  const largestArea = components.reduce((largest, component) => Math.max(largest, component.pixels.length), 0);
  for (const component of components) {
    const componentWidth = component.maxX - component.minX;
    const componentHeight = component.maxY - component.minY;
    const isSmallEdgeFragment = component.touchesEdge
      && component.pixels.length < Math.max(24, largestArea * .22)
      && (componentWidth < width * .42 || componentHeight < height * .56);
    if (isSmallEdgeFragment) {
      for (const index of component.pixels) pixels.data[index * 4 + 3] = 0;
    }
  }

  // The attack poses are wide enough that a bleed strip can touch their main
  // silhouette. Keep a small transparent gutter at each atlas boundary so a
  // neighboring attack/walk pose can never be sampled into this frame.
  const edgeGuard = 10;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < edgeGuard; x += 1) pixels.data[(y * width + x) * 4 + 3] = 0;
    for (let x = width - edgeGuard; x < width; x += 1) pixels.data[(y * width + x) * 4 + 3] = 0;
  }
  return pixels;
}
function prepareEnemySpriteSheet(image) {
  if (!spriteReady(image) || image.__enemyFramesReady) return;
  // The authored enemy sheet is six columns by three rows. Its 1536x1024
  // canvas uses 256px-wide cells and approximately 341px-high row cells.
  // Keep each complete cell. Cropping to visible pixels makes each pose use a
  // different origin, which is what caused the zombie feet/body to jump and
  // occasionally clip during animation.
  const columns = 6;
  const rows = 3;
  const frames = [];
  const source = document.createElement('canvas');
  source.width = image.naturalWidth;
  source.height = image.naturalHeight;
  const sourceContext = source.getContext('2d', { willReadFrequently: true });
  sourceContext.imageSmoothingEnabled = false;
  sourceContext.drawImage(image, 0, 0);

  for (let row = 0; row < rows; row += 1) {
    const startY = Math.floor(row * image.naturalHeight / rows);
    const endY = Math.min(image.naturalHeight, Math.floor((row + 1) * image.naturalHeight / rows));
    for (let column = 0; column < columns; column += 1) {
      const startX = Math.floor(column * image.naturalWidth / columns);
      const endX = Math.min(image.naturalWidth, Math.floor((column + 1) * image.naturalWidth / columns));
      const width = Math.max(1, endX - startX);
      const height = Math.max(1, endY - startY);
      const pixels = cleanEnemyAtlasCell(sourceContext.getImageData(startX, startY, width, height), width, height);
      const frame = document.createElement('canvas');
      frame.width = width;
      frame.height = height;
      frame.getContext('2d').putImageData(pixels, 0, 0);
      frames.push(frame);
    }
  }
  image.__enemyFrames = frames;
  image.__enemyFrameColumns = columns;
  image.__enemyFrameRows = rows;
  image.__enemyCellWidth = image.naturalWidth / columns;
  image.__enemyCellHeight = image.naturalHeight / rows;
  image.__enemyBaseline = image.__enemyCellHeight;
  image.__enemyAtlasLayout = '6x3-fixed-cells-edge-cleaned';
  image.__enemyFramesReady = true;
}
function enemySpriteFrame(image, row, frameIndex, attacking = false) {
  if (!spriteReady(image)) return null;
  prepareEnemySpriteSheet(image);
  const frames = image.__enemyFrames;
  if (!frames?.length) return null;
  const safeRow = clamp(Math.floor(row), 0, 2);
  const animationFrame = attacking ? 3 + (Math.floor(frameIndex) % 3) : Math.floor(frameIndex) % 3;
  return frames[safeRow * 6 + animationFrame] || null;
}

function prepareKeyedSpriteSheet(image, columns, rows, cacheKey) {
  const framesKey = `__${cacheKey}Frames`;
  if (!spriteReady(image) || image[framesKey]) return;
  const cellWidth = Math.floor(image.naturalWidth / columns);
  const cellHeight = Math.floor(image.naturalHeight / rows);
  const source = document.createElement('canvas');
  source.width = image.naturalWidth;
  source.height = image.naturalHeight;
  const sourceContext = source.getContext('2d', { willReadFrequently: true });
  sourceContext.imageSmoothingEnabled = false;
  sourceContext.drawImage(image, 0, 0);
  const frames = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const startX = Math.floor(column * image.naturalWidth / columns);
      const startY = Math.floor(row * image.naturalHeight / rows);
      const endX = Math.min(image.naturalWidth, Math.floor((column + 1) * image.naturalWidth / columns));
      const endY = Math.min(image.naturalHeight, Math.floor((row + 1) * image.naturalHeight / rows));
      const width = Math.max(1, endX - startX);
      const height = Math.max(1, endY - startY);
      const pixels = sourceContext.getImageData(startX, startY, width, height);
      let minX = width;
      let minY = height;
      let maxX = 0;
      let maxY = 0;

      for (let offset = 0; offset < pixels.data.length; offset += 4) {
        const r = pixels.data[offset];
        const g = pixels.data[offset + 1];
        const b = pixels.data[offset + 2];
        if (isChromaGreen(r, g, b)) {
          pixels.data[offset + 3] = 0;
          continue;
        }
        const pixelX = (offset / 4) % width;
        const pixelY = Math.floor(offset / 4 / width);
        minX = Math.min(minX, pixelX);
        minY = Math.min(minY, pixelY);
        maxX = Math.max(maxX, pixelX + 1);
        maxY = Math.max(maxY, pixelY + 1);
      }

      if (maxX <= minX || maxY <= minY) {
        minX = 0; minY = 0; maxX = width; maxY = height;
      } else {
        const padX = Math.max(3, Math.round((maxX - minX) * .08));
        const padY = Math.max(3, Math.round((maxY - minY) * .06));
        minX = Math.max(0, minX - padX);
        minY = Math.max(0, minY - padY);
        maxX = Math.min(width, maxX + padX);
        maxY = Math.min(height, maxY + padY);
      }

      const frame = document.createElement('canvas');
      frame.width = Math.max(1, maxX - minX);
      frame.height = Math.max(1, maxY - minY);
      const frameContext = frame.getContext('2d', { willReadFrequently: true });
      frameContext.imageSmoothingEnabled = false;
      frameContext.putImageData(pixels, -minX, -minY);
      frames.push(frame);
    }
  }
  image[framesKey] = frames;
}
function keyedSpriteFrame(image, columns, rows, frameIndex, cacheKey) {
  if (!spriteReady(image)) return null;
  prepareKeyedSpriteSheet(image, columns, rows, cacheKey);
  const frames = image[`__${cacheKey}Frames`];
  return frames?.[Math.floor(frameIndex) % (columns * rows)] || null;
}
const WEAPON_ATLAS_COLUMNS = 8;
const WEAPON_ATLAS_ROWS = 4;
// Authored atlas animation sequences. These are intentionally written in the
// same 1-based frame numbers used on the supplied reference sheet.
const WEAPON_ATLAS_SEQUENCES = Object.freeze({
  arsenal: Object.freeze({ fire: [1, 4], reload: [1, 2, 1] }),
  shotgun: Object.freeze({ fire: [1, 4, 5, 6, 7, 1], reload: [6, 7] }),
  bfg: Object.freeze({ fire: [1, 2, 3, 4], reload: [1, 2, 3, 2, 1] }),
});
// Keep the authored lower arms below the viewport edge. The atlas cells include
// the hands/arms, so the weapon itself remains visible while the lower clipping
// area removes those arms instead of leaving them along the canvas boundary.
const FIRST_PERSON_ATLAS_BOTTOM = 1.075;
// Atlas rows: Assault Rifle, Shotgun, Electric Gun, BFG. Columns 0–4 are
// source firing poses; each weapon selects its own authored timeline. The
// original cell coordinates are preserved so frame pivots remain stable.
const WEAPON_ATLAS_ROW_BY_TYPE = Object.freeze({
  arsenal: 0, // assault rifle
  shotgun: 1,
  bfg: 3,    // Electric BFG / BFG-style super weapon
});

function isWeaponAtlasBackdrop(r, g, b) {
  // The supplied weapon art is RGB chroma-key artwork. Use a broad but still
  // green-dominant test so internal green islands are removed too, while cyan
  // plasma highlights remain intact.
  const brightChroma = g > 72 && g - r > 20 && g - b > 18 && g > r * 1.16 && g > b * 1.08;
  // Catch the darker/anti-aliased green fringe without keying cyan plasma:
  // cyan has blue at or above green, while the baked screen remains green-led.
  const greenFringe = g > 54 && g - r > 14 && g >= b + 3 && g > r * 1.1;
  return brightChroma || greenFringe;
}
function isWeaponWhiteGuide(r, g, b) {
  // White cell guides and isolated cleanup pixels are neutral and bright. They
  // are removed below only when they look like a guide component (thin, tiny,
  // frame-adjacent, or touching the keyed background), preserving chunky weapon
  // highlights and hands.
  return r > 188 && g > 188 && b > 188 && Math.max(r, g, b) - Math.min(r, g, b) < 46;
}
function cleanWeaponPixelData(pixels, width, height) {
  // Key only green-screen pixels connected to the outside of each frame. This
  // is safer for the BFG than removing every green-ish pixel: its cyan energy
  // coils and highlights can legitimately contain green.
  const background = new Uint8Array(width * height);
  const isScreenGreen = (r, g, b) => (
    g > 72 && g > r * 1.18 && g > b * 1.08 && g - r > 24 && g - b > 14
  );
  const queue = [];
  const enqueue = (index) => {
    if (background[index]) return;
    const offset = index * 4;
    if (!isScreenGreen(pixels.data[offset], pixels.data[offset + 1], pixels.data[offset + 2])) return;
    background[index] = 1;
    queue.push(index);
  };
  for (let x = 0; x < width; x += 1) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }
  for (let y = 1; y < height - 1; y += 1) {
    enqueue(y * width);
    enqueue(y * width + width - 1);
  }
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const index = queue[cursor];
    const x = index % width;
    const y = Math.floor(index / width);
    if (x > 0) enqueue(index - 1);
    if (x + 1 < width) enqueue(index + 1);
    if (y > 0) enqueue(index - width);
    if (y + 1 < height) enqueue(index + width);
  }

  for (let index = 0; index < background.length; index += 1) {
    if (background[index]) pixels.data[index * 4 + 3] = 0;
  }

  // Despill the one-pixel green fringe left by antialiasing against the
  // screen. Do not touch cyan pixels where blue is at least as strong as green.
  const neighbors = (index) => {
    const x = index % width;
    const y = Math.floor(index / width);
    const result = [];
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (!dx && !dy) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) result.push(ny * width + nx);
      }
    }
    return result;
  };
  for (let index = 0; index < background.length; index += 1) {
    if (background[index]) continue;
    const offset = index * 4;
    const r = pixels.data[offset];
    const g = pixels.data[offset + 1];
    const b = pixels.data[offset + 2];
    if (b >= g || g <= r + 10) continue;
    if (!neighbors(index).some((neighbor) => background[neighbor])) continue;
    // Reduce green spill while retaining the original alpha and brightness.
    pixels.data[offset + 1] = Math.max(r, b, Math.round(g * .72));
  }
  return pixels;
}
function prepareCleanWeaponSprite(image, cacheKey) {
  const frameKey = `__${cacheKey}Frame`;
  if (!spriteReady(image)) return null;
  if (image[frameKey]) return image[frameKey];
  const source = document.createElement('canvas');
  source.width = image.naturalWidth;
  source.height = image.naturalHeight;
  const sourceContext = source.getContext('2d', { willReadFrequently: true });
  sourceContext.imageSmoothingEnabled = false;
  sourceContext.drawImage(image, 0, 0);
  const pixels = cleanWeaponPixelData(
    sourceContext.getImageData(0, 0, source.width, source.height),
    source.width,
    source.height,
  );
  const frame = document.createElement('canvas');
  frame.width = source.width;
  frame.height = source.height;
  frame.getContext('2d').putImageData(pixels, 0, 0);
  image[frameKey] = frame;
  return frame;
}
function prepareKeyedWeaponAtlas(image, columns = WEAPON_ATLAS_COLUMNS, rows = WEAPON_ATLAS_ROWS, frameRow = 0, cacheKey = 'weapon-arsenal') {
  const framesKey = `__${cacheKey}Frames`;
  if (!spriteReady(image) || image[framesKey]) return;

  const source = document.createElement('canvas');
  source.width = image.naturalWidth;
  source.height = image.naturalHeight;
  const sourceContext = source.getContext('2d', { willReadFrequently: true });
  sourceContext.imageSmoothingEnabled = false;
  sourceContext.drawImage(image, 0, 0);

  const row = clamp(frameRow, 0, rows - 1);
  const rowStartY = Math.floor(row * image.naturalHeight / rows);
  const rowEndY = Math.floor((row + 1) * image.naturalHeight / rows);
  const rowHeight = Math.max(1, rowEndY - rowStartY);
  const keyedFrames = [];

  for (let column = 0; column < columns; column += 1) {
    const startX = Math.floor(column * image.naturalWidth / columns);
    const endX = Math.floor((column + 1) * image.naturalWidth / columns);
    const width = Math.max(1, endX - startX);
    const pixels = sourceContext.getImageData(startX, rowStartY, width, rowHeight);
    cleanWeaponPixelData(pixels, width, rowHeight);

    // Keep the original atlas cell dimensions and origin. Do not crop to the
    // visible artwork: the generated poses have different silhouettes, and
    // cropping changes their scale/origin and creates apparent frame drift.
    const frame = document.createElement('canvas');
    frame.width = width;
    frame.height = rowHeight;
    frame.getContext('2d').putImageData(pixels, 0, 0);
    keyedFrames.push(frame);
  }
  image[framesKey] = keyedFrames;
}
function keyedWeaponAtlasFrame(image, frameIndex, frameRow = 0, cacheKey = 'weapon-arsenal') {
  if (!spriteReady(image)) return null;
  prepareKeyedWeaponAtlas(image, WEAPON_ATLAS_COLUMNS, WEAPON_ATLAS_ROWS, frameRow, cacheKey);
  const frames = image[`__${cacheKey}Frames`];
  return frames?.[Math.floor(frameIndex) % frames.length] || null;
}
function weaponAtlasRow(type) {
  return WEAPON_ATLAS_ROW_BY_TYPE[type] ?? null;
}
function weaponAtlasFrame(type, frameIndex) {
  const row = weaponAtlasRow(type);
  if (row === null) return null;
  return keyedWeaponAtlasFrame(gameSprites.weaponAtlas, frameIndex, row, `weapon-${type}`);
}
// The generated artwork is not perfectly pivoted inside every source cell.
// These offsets lock the receiver/hand pivot while preserving the authored
// recoil, muzzle flash, and scale changes. Values are source-cell pixels.
const WEAPON_ATLAS_PIVOT_OFFSETS = Object.freeze({
  arsenal: Object.freeze([0, -18, -37.5, -30, -24, -.5, 7.5, 11]),
  bfg: Object.freeze([0, -16.5, 0, 0, 0, 10, 3.5, 5.5]),
});
function weaponAtlasPivotOffset(type, frameIndex) {
  return WEAPON_ATLAS_PIVOT_OFFSETS[type]?.[frameIndex] || 0;
}
function weaponAtlasSequenceIndex(type, progress = 0, reloading = false) {
  const sequence = WEAPON_ATLAS_SEQUENCES[type] || WEAPON_ATLAS_SEQUENCES.arsenal;
  const frames = reloading ? sequence.reload : sequence.fire;
  return Math.min(frames.length - 1, Math.floor(clamp(progress, 0, .999999) * frames.length));
}
function weaponAtlasFrameIndex(type, progress = 0, reloading = false) {
  const sequence = WEAPON_ATLAS_SEQUENCES[type] || WEAPON_ATLAS_SEQUENCES.arsenal;
  const frames = reloading ? sequence.reload : sequence.fire;
  const sequenceIndex = weaponAtlasSequenceIndex(type, progress, reloading);
  // Convert the supplied 1-based frame number to the atlas' 0-based column.
  return frames[sequenceIndex] - 1;
}
const gameSprites = {
  enemySheet: loadGameSprite('assets/sprites/enemies-ogdoom.png?v=20260811-ogdoom-2'),
  enemyPlasmaProjectile: loadGameSprite('assets/sprites/enemy-plasma-projectile-sheet.png?v=20260811-plasma-sheet-1'),
  enemyFireballProjectile: loadGameSprite('assets/sprites/enemy-fireball-projectile-sheet.png?v=20260811-fireball-sheet-1'),
  enemyWardenIdle: loadGameSprite('assets/sprites/enemy-warden-idle.png?v=20260811-warden-key-2'),
  enemyWardenAttack: loadGameSprite('assets/sprites/enemy-warden-attack.png?v=20260811-warden-key-2'),
  pickupSheet: loadGameSprite('assets/sprites/pickups-green.png?v=20260812-pickups-green-1'),
  narratorGeneralSheet: loadGameSprite('assets/sprites/narrator-general-sheet.png?v=20260812-narrator-general-1'),
  weaponAtlas: loadGameSprite('assets/sprites/weapon-superweapon-animation.png?v=20260812-weapon-sheet-1'),
  explosionSheet: loadGameSprite('assets/sprites/source/explosion-ogdoom-source.png?v=20260811-explosion-1'),
};
const WEAPON_LOADOUTS = {
  // The atlas has five authored fire poses. These timings let each weapon read
  // clearly without changing its underlying hitscan damage or ammo behavior.
  arsenal: { label: 'Arsenal Carbine', description: 'Semi-auto precision carbine. Tap the trigger for high-damage, long-range hitscan shots.', range: 24, damage: 18, aim: .13, cooldown: .09, duration: .18, hitAt: .38, knockback: .1, critChance: .1, critMultiplier: 1.45, magazineSize: 15, reserveAmmo: 45, reloadTime: .95, ammoPerShot: 1, fireMode: 'semi', hitscan: true, impactColor: '#e0b66d', recoilAmount: .22, muzzleDuration: .105 },
  shotgun: { label: 'Shotgun', description: 'Pump-action shotgun. Fire a tight, heavy spread at close range.', range: 12, damage: 16, minDamage: 3, pellets: 7, spread: .13, aim: .34, cooldown: .58, duration: .64, hitAt: .12, knockback: .24, stagger: .22, critChance: .04, critMultiplier: 1.35, magazineSize: 4, reserveAmmo: 12, reloadTime: 1.1, ammoPerShot: 1, fireMode: 'semi', hitscan: true, impactColor: '#e08a55', recoilAmount: .52, muzzleDuration: .16 },
  bfg: { label: 'Electric BFG', description: 'Heavy electric launcher. Fires a visible sphere that detonates through nearby hostiles.', range: 24, damage: 132, aim: .16, cooldown: .82, duration: .76, hitAt: .38, knockback: .32, stagger: .35, critChance: .08, critMultiplier: 1.55, magazineSize: 1, reserveAmmo: 3, reloadTime: 2.65, ammoPerShot: 1, fireMode: 'semi', projectile: true, impactColor: '#58f4e4', recoilAmount: .82, muzzleDuration: .22 },
};
const ENEMY_PROFILES = {
  wraith: { scale: .62, height: 1.14, aimHeight: .84, speedMultiplier: 1.22, attackRate: 1.24, attackDistance: 2.2, opacity: .82, hover: .07, color: '#403143' },
  imp: { scale: .48, height: .72, aimHeight: .52, speedMultiplier: 1.42, attackRate: 1.26, attackDistance: 2.12, opacity: 1, color: '#8f3e32', attackColor: '#c44932' },
  crawler: { scale: .52, height: .44, aimHeight: .28, speedMultiplier: 1.02, attackRate: 1.08, attackDistance: 4.0, preferredDistance: 3.0, attackStyle: 'ground', opacity: 1, color: '#b77754', attackColor: '#d76b49' },
  ghoul: { scale: .58, height: 1.04, aimHeight: .76, speedMultiplier: 1.16, attackRate: 1.2, attackDistance: 2.26, opacity: 1, color: '#566d5c' },
  beast: { scale: .64, height: .84, aimHeight: .52, speedMultiplier: 1.16, attackRate: 1.22, attackDistance: 4.15, preferredDistance: 3.1, attackStyle: 'ground', opacity: 1, color: '#5f3b30', attackColor: '#ad4937' },
  moth: { scale: .56, height: 1.04, aimHeight: .8, speedMultiplier: 1.38, attackRate: 1.22, attackDistance: 9.2, preferredDistance: 6.1, attackStyle: 'ranged', opacity: .9, hover: .11, color: '#9b7a3e', attackColor: '#d39a43' },
  hound: { scale: .59, height: .72, aimHeight: .45, speedMultiplier: 1.7, attackRate: 1.3, attackDistance: 2.24, opacity: 1, color: '#78382e' },
  'briar-mantis': { scale: .62, height: .96, aimHeight: .62, speedMultiplier: 1.32, attackRate: 1.08, attackDistance: 2.15, opacity: 1, color: '#65734a', attackColor: '#d16b4f' },
  leech: { scale: .47, height: .38, aimHeight: .24, speedMultiplier: 1.12, attackRate: 1.02, attackDistance: 2.04, opacity: 1, color: '#7d9bd1' },
  seer: { scale: .59, height: 1.28, aimHeight: .94, speedMultiplier: .94, attackRate: 1.02, attackDistance: 10.5, preferredDistance: 6.8, attackStyle: 'ranged', opacity: .96, color: '#4c5b60', attackColor: '#58d9cf' },
  quake: { scale: .72, height: 1.18, aimHeight: .7, speedMultiplier: .62, attackRate: .86, attackDistance: 4.1, preferredDistance: 3.1, attackStyle: 'ground', opacity: 1, color: '#cf8b5e', attackColor: '#d76b49' },
  warden: { scale: 1.52, height: 2.82, aimHeight: 1.34, speedMultiplier: 1.34, attackRate: 1.24, attackDistance: 2.82, opacity: 1, color: '#b47469', attackColor: '#ffb36b' },
  zombie: { scale: .78, height: 1.72, aimHeight: 1.02, speedMultiplier: 1.7, attackRate: 1.3, attackDistance: 1.62, attackDuration: .58, opacity: 1, color: '#65734d', attackColor: '#c44932', spriteRow: 0, attackStyle: 'melee' },
  soldier: { scale: .92, height: 2.02, aimHeight: 1.22, speedMultiplier: 1.02, attackRate: 1.04, attackDistance: 10.5, preferredDistance: 6.2, opacity: 1, color: '#6e5937', attackColor: '#d39a43', spriteRow: 1, attackStyle: 'ranged' },
  insectoid: { scale: .82, height: 1.62, aimHeight: .98, speedMultiplier: 1.42, attackRate: 1.22, attackDistance: 8.5, preferredDistance: 4.8, opacity: 1, color: '#4f6a3d', attackColor: '#58d9cf', spriteRow: 2, attackStyle: 'ranged' },
  archon: { scale: 1.08, height: 2.85, aimHeight: 1.92, speedMultiplier: .42, attackRate: .78, attackDistance: 2.7, opacity: 1, color: '#d7c79b' },
};
const EMPTY_ENEMY_PROFILE = { scale: .46, height: .98, aimHeight: .78, speedMultiplier: 1, attackRate: 1, attackDistance: ENEMY_ATTACK_DISTANCE, opacity: 0, color: '#000000' };
function enemyProfile(enemy) {
  return ENEMY_PROFILES[enemy?.kind] || EMPTY_ENEMY_PROFILE;
}
function enemyAttackRate(enemy) {
  return (enemyProfile(enemy).attackRate || 1) * (enemy.difficultyAttackRate || 1);
}

const MAX_RENDER_WIDTH = 1280;
const MAX_RENDER_HEIGHT = 720;

const state = {
  room: 0,
  player: { x: roomOffsets[0] + roomContentPoint(0, rooms[0].spawn.x, rooms[0].spawn.y).x, y: roomContentPoint(0, rooms[0].spawn.x, rooms[0].spawn.y).y, angle: rooms[0].spawn.angle, hp: 100 },
  keys: new Set(),
  moonProgress: 0,
  combo: 0,
  comboTimer: 0,
  groundHazards: [],
  recoveredItems: new Set(),
  collectedRecordIds: new Set(),
  lastTime: 0,
  dragging: false,
  pointerMoved: false,
  pointerDownAt: 0,
  lastPointerX: 0,
  lastPointerY: 0,
  mouseAttack: false,
  // Blocks stale pointer input while a cinematic hands control back to gameplay.
  attackInputLock: 0,
  mouseLook: false,
  pointerLocked: false,
  zBuffer: new Float32Array(RAY_COUNT),
  floorBase: new Float32Array(RAY_COUNT),
  weapon: { type: 'arsenal', equipped: true, swing: 0, hit: false, cooldown: 0, bobPhase: 0, moving: false, projectile: 0, attackDamage: 0, comboStep: 0, attackHitAt: 0, ammo: 15, reserveAmmo: 45, magazineSize: 15, reloadTime: 1.15, reloadTimer: 0, reloadElapsed: 0, reloadShellsToLoad: 0, reloadShellsLoaded: 0, reloadShellInterval: 0, muzzleFlash: 0, recoil: 0, kickVelocity: 0, kickX: 0, rollKick: 0, viewKick: 0, fovKick: 0, shotPulse: 0, shotTraces: [], lastFireAt: 0, kills: 0, ammoByType: {}, reserveByType: {}, mousePressed: false },
  xp: 0,
  level: 0,
  kills: 0,
  unlockedAbilitys: new Set(),
  lastAbility: null,
  selectedAbilityId: null,
  tutorialAbility: false,
  guideStep: 0,
  guideRun: null,
  guideAdvanceStarted: false,
  guideTalkPulse: 0,
  guideSpeechTarget: '',
  guideSpeechVisible: '',
  guideSpeechElapsed: 0,
  guideSpeechActive: false,
  guideSpeechHold: 0,
  guideSpeechVoiceTimer: 0,
  guideSpeechLastVoiceIndex: -1,
  guideSpeechCompletion: null,
  guideSpeechPause: 0,
  guidePendingSpeech: null,
  guideSpeechLayout: null,
  guideWaitingForWeapon: false,
  guideMovementTriggered: false,
  guideIntroSpeechStarted: false,
  guideFarewellStarted: false,
  guideFarewellComplete: false,
  guideIntroPhase: 'look',
  guideIntroElapsed: 0,
  guideControlsLocked: true,
  guideWeaponCollected: false,
  guideWeaponReactionStarted: false,
  guideScrollReturnStarted: false,
  guideDeferredRun: null,
  guideScrollInstructionStarted: false,
  visorTutorial: { look: false, fire: false, weapon: false, active: false, step: 'look', mouseEngaged: false },
  narratorSignal: null,
  narratorSeenEvents: new Set(),
  narratorLastTransmission: null,
  guideAutoTimer: -1,
  abilityCast: null,
  abilityCooldown: 0,
  activeAbilityEffects: [],
  projectiles: [],
  impactBursts: [],
  // Short-lived combat feedback keeps successful hits readable even when the
  // DOM hit marker is hidden during fullscreen play.
  combatPulse: 0,
  combatPulseStrength: 0,
  combatPulseColor: '#f0ddaf',
  combatPulseCritical: false,
  combatPulseLabel: '',
  combatPulseType: 'hit',
  combatPerfUntil: 0,
  combatTargetId: null,
  pickupFeedback: null,
  pickupFeedbackTimer: 0,
  explosionEffects: [],
  particles: [],
  ambientParticleTimer: 0,
  footstepTimer: 0,
  revealTimer: 0,
  wardTimer: 0,
  enemySlowTimer: 0,
  doorOfLight: null,
  resumeDownloaded: false,
  sanctuaryActive: false,
  gameComplete: false,
  endingFade: -1,
  finalArenaTime: 0,
  transition: null,
  miniBossCutscene: null,
  miniBossArena: null,
  miniBossIntroSeen: new Set(),
  launchTransition: null,
  finalBoss: createFinalBoss(),
  damageFlash: 0,
  rearHitEffect: 0,
  damageDirection: 0,
  damageHudPulse: 0,
  damageSourceLabel: '',
  shakeTime: 0,
  healthBarShake: 0,
  reading: null,
  readingElapsed: 0,
  deathScreen: null,
  readingWorldTime: 0,
  now: 0,
  lastAttackInput: 0,
  lastShieldFeedback: -Infinity,
  hudSignature: '',
  promptTimer: 0,
  promptSignature: '',
  lastRenderAt: 0,
  lastCombatHudAt: -Infinity,
  abilityCyclePulse: 0,
  abilityCycleDirection: 1,
  menuActive: false,
  visitedFloors: new Set(),
  floorAnnouncement: null,
  levelPreview: null,
  routeOverview: null,
  routeOverviewTriggered: false,
  cinematicCamera: null,
  sectorStinger: null,
  aimTarget: null,
  lastAimTargetAt: -Infinity,
  lastAimTargetRoom: -1,
  frameAverageMs: 0,
  slowFrameStreak: 0,
  stableFrameStreak: 0,
  renderQuality: 1,
  runtimeErrorCount: 0,
  lastRuntimeError: '',
};

window.getPortfolioGameDiagnostics = () => ({
  frameAverageMs: Number(state.frameAverageMs.toFixed(2)),
  renderQuality: Number(state.renderQuality.toFixed(2)),
  particles: state.particles.length,
  projectiles: state.projectiles.length,
  activeAbilityEffects: state.activeAbilityEffects.length,
  runtimeErrorCount: state.runtimeErrorCount,
  lastRuntimeError: state.lastRuntimeError,
  room: state.room,
  player: {
    x: Number(state.player.x.toFixed(2)),
    y: Number(state.player.y.toFixed(2)),
    hp: Number(state.player.hp.toFixed(1)),
  },
  enemies: worldEnemies
    .filter((enemy) => enemy.roomIndex === state.room && !enemy.dead)
    .map((enemy) => ({
      id: enemy.id,
      x: Number(enemy.x.toFixed(2)),
      y: Number(enemy.y.toFixed(2)),
      distance: Number(Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y).toFixed(2)),
      hp: Number(enemy.hp.toFixed(1)),
      attackTime: Number((enemy.attackTime || 0).toFixed(2)),
      cooldown: Number((enemy.cooldown || 0).toFixed(2)),
      pathLength: enemy.path?.length || 0,
      alerted: Boolean(enemy.alerted),
    })),
});

const MEDIEVAL_COLORS = {
  // Keep legacy authored color inputs readable, but translate them into the
  // brown/olive/charcoal/rust palette used by classic Doom-era materials.
  '#6ce0c2': '#6f8f69', '#e7ad67': '#c28a3d', '#c58de6': '#4b3748', '#77a9e8': '#53636b',
  '#e3c66e': '#b48a42', '#db8872': '#9b4938', '#e9e9e0': '#c7b37e', '#ae6fd0': '#403143',
  '#bd6b72': '#8f3e32', '#b77754': '#70412d', '#7db8ac': '#566d5c', '#9b6bd0': '#563b4f',
  '#dfae65': '#9b7a3e', '#668ed0': '#4c5b60', '#b76b66': '#78382e', '#cf9b5e': '#85522f',
  '#7d9bd1': '#46635b', '#d16f63': '#a13d2f', '#c7a359': '#b48a42', '#b47469': '#5a5148', '#8b77c9': '#4c3b4b',
};

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function lerp(a, b, amount) { return a + (b - a) * amount; }
function fract(value) { return value - Math.floor(value); }
function smoothstep(edge0, edge1, value) { const t = clamp((value - edge0) / (edge1 - edge0), 0, 1); return t * t * (3 - 2 * t); }
function easeOutCubic(value) { return 1 - Math.pow(1 - clamp(value, 0, 1), 3); }
function normalizeAngle(angle) { while (angle < -Math.PI) angle += TAU; while (angle > Math.PI) angle -= TAU; return angle; }
const rgbCache = new Map();
function hexToRgb(hex) {
  const key = String(hex).toLowerCase();
  if (rgbCache.has(key)) return rgbCache.get(key);
  const themed = MEDIEVAL_COLORS[key] || hex;
  const value = Number.parseInt(String(themed).replace('#', ''), 16);
  const rgb = { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
  rgbCache.set(key, rgb);
  return rgb;
}
function rgba(color, alpha = 1) { return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`; }
function litColor(color, light) { const factor = clamp(.25 + light * .75, .12, 1.18); return { r: clamp(color.r * factor, 0, 255), g: clamp(color.g * factor, 0, 255), b: clamp(color.b * factor, 0, 255) }; }
function currentRoomIndex() { return roomIndexAtX(state.player.x); }
function roomIndexAtX(x) {
  for (let index = 0; index < rooms.length; index += 1) {
    const start = roomOffsets[index];
    if (x >= start && x < start + roomWidths[index]) return index;
    if (index < rooms.length - 1 && x >= start + roomWidths[index] && x < roomOffsets[index + 1]) return x < start + roomWidths[index] + gapAfterRoom(index) / 2 ? index : index + 1;
  }
  return x < roomOffsets[0] ? 0 : rooms.length - 1;
}
function materialRoomAtX(x) {
  const index = roomIndexAtX(x);
  const start = roomOffsets[index];
  return x >= start && x < start + roomWidths[index] ? rooms[index] : { material: 'stone', color: '#74736a' };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

/* Deterministic value noise drives the hell-tech wall and floor formulas. */
function hash2(x, y, seed = 0) { const value = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123; return value - Math.floor(value); }
function valueNoise(x, y, seed = 0) {
  const x0 = Math.floor(x); const y0 = Math.floor(y); const tx = x - x0; const ty = y - y0; const sx = tx * tx * (3 - 2 * tx); const sy = ty * ty * (3 - 2 * ty);
  return lerp(lerp(hash2(x0, y0, seed), hash2(x0 + 1, y0, seed), sx), lerp(hash2(x0, y0 + 1, seed), hash2(x0 + 1, y0 + 1, seed), sx), sy);
}
function fractalNoise(x, y, seed = 0) { let value = 0; let amplitude = .5; let frequency = 1; for (let octave = 0; octave < 4; octave += 1) { value += valueNoise(x * frequency, y * frequency, seed + octave * 17) * amplitude; frequency *= 2; amplitude *= .5; } return value; }
function createWoodTexture(size, seed) {
  const texture = document.createElement('canvas'); texture.width = size; texture.height = size; const image = texture.getContext('2d').createImageData(size, size); const knots = [{ x: .27, y: .24, radius: .08 }, { x: .71, y: .76, radius: .065 }];
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
    const u = x / size; const v = y / size; const warp = fractalNoise(x / 70, y / 34, seed) * 2.8; const grain = .5 + .5 * Math.sin(v * 38 + Math.sin(u * 17) * 2.6 + warp); const fine = .5 + .5 * Math.sin(v * 164 + u * 9 + warp * 4); let knot = 0;
    for (const point of knots) { const distance = Math.hypot(u - point.x, v - point.y); knot = Math.max(knot, Math.exp(-Math.pow(distance / point.radius, 2)) * (.5 + .5 * Math.sin(distance * 430))); }
    const seam = Math.exp(-Math.pow((fract(u * 4) - .04) / .027, 2)); const warmth = 78 + grain * 54 + fine * 16 - knot * 44 - seam * 30; const i = (y * size + x) * 4;
    image.data[i] = clamp(warmth + 38, 0, 255); image.data[i + 1] = clamp(warmth + 11, 0, 255); image.data[i + 2] = clamp(warmth - 20, 0, 255); image.data[i + 3] = 255;
  }
  texture.getContext('2d').putImageData(image, 0, 0); return texture;
}
function createStoneTexture(size, seed) {
  const texture = document.createElement('canvas'); texture.width = size; texture.height = size;
  const image = texture.getContext('2d').createImageData(size, size);
  const blockWidth = Math.max(24, Math.floor(size / 4));
  const blockHeight = Math.max(20, Math.floor(size / 5));
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
    const row = Math.floor(y / blockHeight);
    const offset = row % 2 ? blockWidth * .5 : 0;
    const localX = fract((x + offset) / blockWidth);
    const localY = fract(y / blockHeight);
    const seam = Math.max(
      1 - smoothstep(.035, .09, localX),
      1 - smoothstep(.035, .09, localY),
    );
    const n = fractalNoise(x / 31, y / 31, seed);
    const chips = Math.pow(clamp(1 - Math.abs(Math.sin(x * .17 + y * .11 + n * 8)), 0, 1), 18);
    const stain = Math.pow(clamp(1 - Math.abs(Math.sin(x * .021 - y * .037 + seed)), 0, 1), 28);
    const blockShade = ((row + Math.floor((x + offset) / blockWidth)) % 3) * 3;
    const base = 45 + n * 31 + blockShade - seam * 30 - chips * 13 + stain * 8;
    const i = (y * size + x) * 4;
    image.data[i] = clamp(base + 7 + stain * 13, 0, 255);
    image.data[i + 1] = clamp(base + 5, 0, 255);
    image.data[i + 2] = clamp(base + 3, 0, 255);
    image.data[i + 3] = 255;
  }
  texture.getContext('2d').putImageData(image, 0, 0); return texture;
}
function createBoneTexture(size, seed) {
  const texture = document.createElement('canvas'); texture.width = size; texture.height = size;
  const image = texture.getContext('2d').createImageData(size, size);
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
    const n = fractalNoise(x / 22, y / 20, seed);
    const grain = .5 + .5 * Math.sin(y * .2 + x * .045 + n * 4);
    const grime = Math.pow(clamp(1 - Math.abs(Math.sin(x * .11 - y * .15 + n * 7)), 0, 1), 14);
    const base = 84 + n * 30 + grain * 18 - grime * 34;
    const i = (y * size + x) * 4;
    image.data[i] = clamp(base + 43, 0, 255);
    image.data[i + 1] = clamp(base + 35, 0, 255);
    image.data[i + 2] = clamp(base + 20, 0, 255);
    image.data[i + 3] = 255;
  }
  texture.getContext('2d').putImageData(image, 0, 0); return texture;
}
function createSteelTexture(size, seed) {
  const texture = document.createElement('canvas'); texture.width = size; texture.height = size;
  const image = texture.getContext('2d').createImageData(size, size);
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
    const panelX = fract(x / Math.max(1, size / 3));
    const panelY = fract(y / Math.max(1, size / 3));
    const seam = Math.max(1 - smoothstep(.025, .075, panelX), 1 - smoothstep(.025, .075, panelY));
    const n = valueNoise(x / 17, y / 17, seed);
    const scratch = Math.pow(clamp(1 - Math.abs(Math.sin(x * .38 + y * .07 + n * 9)), 0, 1), 24);
    const rust = Math.pow(clamp(1 - Math.abs(Math.sin(x * .043 - y * .061 + seed)), 0, 1), 30);
    const base = 43 + n * 27 - seam * 22 + scratch * 18;
    const i = (y * size + x) * 4;
    image.data[i] = clamp(base + rust * 31, 0, 255);
    image.data[i + 1] = clamp(base + 3 + rust * 10, 0, 255);
    image.data[i + 2] = clamp(base + 4, 0, 255);
    image.data[i + 3] = 255;
  }
  texture.getContext('2d').putImageData(image, 0, 0);
  const paint = texture.getContext('2d');
  paint.fillStyle = 'rgba(174, 132, 58, .58)';
  for (const [x, y] of [[12, 12], [size - 16, 14], [14, size - 15], [size - 16, size - 15]]) {
    paint.fillRect(x - 2, y - 2, 4, 4);
  }
  return texture;
}
function createHellTechTexture(size, seed) {
  const texture = document.createElement('canvas');
  texture.width = size;
  texture.height = size;
  const context = texture.getContext('2d');
  const image = context.createImageData(size, size);
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
    const panelX = fract(x / Math.max(1, size / 5));
    const panelY = fract(y / Math.max(1, size / 4));
    const seam = Math.max(
      1 - smoothstep(.025, .075, panelX),
      1 - smoothstep(.025, .075, panelY),
    );
    const noise = fractalNoise(x / 24, y / 24, seed);
    const corrosion = Math.pow(clamp(1 - Math.abs(Math.sin(x * .07 - y * .11 + noise * 8)), 0, 1), 18);
    const circuit = Math.pow(clamp(1 - Math.abs(Math.sin(x * .31 + y * .055 + seed)), 0, 1), 28);
    const base = 21 + noise * 27 - seam * 17 - corrosion * 8;
    const ember = circuit * (8 + 12 * fractalNoise(x / 12, y / 35, seed + 41));
    const index = (y * size + x) * 4;
    image.data[index] = clamp(base + ember * 1.9, 0, 255);
    image.data[index + 1] = clamp(base + ember * .28, 0, 255);
    image.data[index + 2] = clamp(base + 5 + noise * 13, 0, 255);
    image.data[index + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  context.fillStyle = 'rgba(204, 57, 31, .58)';
  context.shadowBlur = 7;
  context.shadowColor = '#d9472f';
  for (const [x, y] of [[10, 10], [size - 14, 10], [10, size - 14], [size - 14, size - 14]]) {
    context.fillRect(x - 2, y - 2, 4, 4);
  }
  context.shadowBlur = 0;
  context.strokeStyle = 'rgba(68, 211, 190, .24)';
  context.lineWidth = 2;
  for (let y = 22; y < size; y += 43) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(size, y);
    context.stroke();
  }
  return texture;
}
function createLeatherTexture(size, seed) {
  const texture = document.createElement('canvas'); texture.width = size; texture.height = size;
  const image = texture.getContext('2d').createImageData(size, size);
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
    const n = valueNoise(x / 11, y / 11, seed);
    const grain = .5 + .5 * Math.sin(y * .34 + Math.sin(x * .08) * 1.8 + n * 4);
    const base = 30 + n * 25 + grain * 17;
    const i = (y * size + x) * 4;
    image.data[i] = clamp(base + 28, 0, 255);
    image.data[i + 1] = clamp(base + 13, 0, 255);
    image.data[i + 2] = clamp(base + 5, 0, 255);
    image.data[i + 3] = 255;
  }
  texture.getContext('2d').putImageData(image, 0, 0); return texture;
}
function createPipSkinTexture(size, seed) {
  const texture = document.createElement('canvas'); texture.width = size; texture.height = size;
  const image = texture.getContext('2d').createImageData(size, size);
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
    const n = fractalNoise(x / 19, y / 23, seed);
    const mottled = .5 + .5 * Math.sin(x * .12 + y * .17 + n * 8);
    const pores = hash2(x * .9, y * .9, seed + 11) > .975 ? 24 : 0;
    const shadow = Math.pow(clamp(1 - Math.abs(Math.sin(x * .045 - y * .08 + n * 7)), 0, 1), 12) * 18;
    const base = 48 + n * 48 + mottled * 15 + pores - shadow;
    const i = (y * size + x) * 4;
    image.data[i] = clamp(base * .62, 0, 255);
    image.data[i + 1] = clamp(base * 1.22, 0, 255);
    image.data[i + 2] = clamp(base * .72, 0, 255);
    image.data[i + 3] = 255;
  }
  texture.getContext('2d').putImageData(image, 0, 0);
  return texture;
}

function createDialogueTexture(size, seed) {
  const texture = document.createElement('canvas'); texture.width = size; texture.height = size;
  const image = texture.getContext('2d').createImageData(size, size);
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
    const n = fractalNoise(x / 26, y / 22, seed);
    const grain = .5 + .5 * Math.sin(x * .19 + n * 5.2);
    const block = ((Math.floor(x / 8) + Math.floor(y / 8)) % 2) * 4;
    const base = 31 + n * 32 + grain * 13 + block;
    const i = (y * size + x) * 4;
    image.data[i] = clamp(base + 26, 0, 255);
    image.data[i + 1] = clamp(base + 13, 0, 255);
    image.data[i + 2] = clamp(base + 2, 0, 255);
    image.data[i + 3] = 255;
  }
  texture.getContext('2d').putImageData(image, 0, 0);
  const overlay = texture.getContext('2d');
  overlay.strokeStyle = 'rgba(201, 157, 86, .28)';
  overlay.lineWidth = 2;
  for (let x = 8; x < size; x += 32) { overlay.beginPath(); overlay.moveTo(x, 0); overlay.lineTo(x, size); overlay.stroke(); }
  return texture;
}

const GROUND_CACHE_SCALE = 8;
const GROUND_CACHE_WIDTH = WORLD_WIDTH * GROUND_CACHE_SCALE;
const GROUND_CACHE_HEIGHT = WORLD_HEIGHT * GROUND_CACHE_SCALE;
const groundCache = new Array(GROUND_CACHE_WIDTH * GROUND_CACHE_HEIGHT);

function computeGroundColor(x, y) {
  const room = materialRoomAtX(x);
  const roomIndex = roomIndexAtX(x);
  const seed = roomIndex + 41;
  const broad = valueNoise(x * .34, y * .34, seed + 17);
  const n = valueNoise(x * .82, y * .82, seed) * .58
    + valueNoise(x * 1.7, y * 1.7, seed + 23) * .27
    + valueNoise(x * 3.5, y * 3.5, seed + 47) * .15;

  if (roomIndex === SANCTUARY_ROOM_INDEX) {
    const tileX = fract(x * .78);
    const tileY = fract(y * .78);
    const edge = Math.min(tileX, 1 - tileX, tileY, 1 - tileY);
    const grout = 1 - smoothstep(.018, .08, edge);
    const shimmer = valueNoise(x * .42, y * .42, seed + 83);
    return {
      r: 47 + shimmer * 22 - grout * 18,
      g: 61 + shimmer * 25 - grout * 20,
      b: 49 + shimmer * 19 - grout * 16,
    };
  }

  if (roomIndex === 0 && room.material !== 'wood') {
    const localX = fract(x * .92);
    const localY = fract(y * .92);
    const edge = Math.min(localX, 1 - localX, localY, 1 - localY);
    const grout = 1 - smoothstep(.018, .095, edge);
    const organic = valueNoise(x * .42, y * .42, seed + 73);
    const moss = smoothstep(.52, .82, organic) * (1 - grout * .7);
    const variation = n * 19 + broad * 12 - grout * 24;
    return {
      r: 55 + variation - moss * 8,
      g: 69 + variation + moss * 12,
      b: 48 + variation * .72 + moss * 5,
    };
  }

  if (room.material === 'wood') {
    const plank = Math.floor(x * .82);
    const plankTone = valueNoise(plank * .22, 0, seed + 61);
    const warped = y * 9.5 + Math.sin(x * 2.1 + broad * 2) * .72 + n * 2.2;
    const grain = .5 + .5 * Math.sin(warped * 1.45 + Math.sin(y * 1.8) * .5);
    const fine = .5 + .5 * Math.sin(warped * 8.4 + x * 3.1);
    const seam = 1 - smoothstep(0, .065, Math.abs(fract(x * .82) - .5));
    const knotNoise = valueNoise(x * .32, y * .24, seed + 91);
    const knot = Math.exp(-Math.pow((knotNoise - .54) / .12, 2)) * (.35 + .65 * valueNoise(x * .7, y * .7, seed + 97));
    const warmth = plankTone * 12 + broad * 9;
    return {
      r: 62 + warmth + grain * 48 + fine * 13 - seam * 31 - knot * 24 + (plank % 2) * 4,
      g: 34 + warmth * .58 + grain * 29 + fine * 8 - seam * 17 - knot * 13,
      b: 17 + warmth * .24 + grain * 16 + fine * 4 - seam * 8 - knot * 8,
    };
  }

  const localX = fract(x * .92);
  const localY = fract(y * .92);
  const edge = Math.min(localX, 1 - localX, localY, 1 - localY);
  const grout = 1 - smoothstep(.018, .085, edge);
  const slab = valueNoise(x * .31, y * .31, seed + 71);
  const mottling = valueNoise(x * 2.15, y * 2.15, seed + 83);
  const vein = Math.pow(clamp(1 - Math.abs(Math.sin(x * 1.7 + y * .83 + broad * 5.2)), 0, 1), 12);
  const crack = Math.pow(clamp(1 - Math.abs(Math.sin(x * 6.3 - y * 4.2 + mottling * 10)), 0, 1), 24);
  const palettes = [
    [42, 29, 30],
    [48, 28, 25],
    [55, 27, 25],
    [42, 30, 34],
    [35, 38, 39],
    [48, 29, 24],
  ];
  const palette = palettes[Math.min(roomIndex, palettes.length - 1)];
  const variation = slab * 25 + mottling * 18 + n * 13 - grout * 31 - vein * 13 - crack * 23;
  return {
    r: palette[0] + variation,
    g: palette[1] + variation * .96,
    b: palette[2] + variation * .9,
  };
}

function buildGroundCache() {
  for (let gy = 0; gy < GROUND_CACHE_HEIGHT; gy += 1) {
    for (let gx = 0; gx < GROUND_CACHE_WIDTH; gx += 1) {
      groundCache[gy * GROUND_CACHE_WIDTH + gx] = computeGroundColor((gx + .5) / GROUND_CACHE_SCALE, (gy + .5) / GROUND_CACHE_SCALE);
    }
  }
}

function sampleGround(x, y) {
  const gx = clamp(Math.floor(x * GROUND_CACHE_SCALE), 0, GROUND_CACHE_WIDTH - 1);
  const gy = clamp(Math.floor(y * GROUND_CACHE_SCALE), 0, GROUND_CACHE_HEIGHT - 1);
  return groundCache[gy * GROUND_CACHE_WIDTH + gx];
}

function isWall(x, y) {
  // Ray/ceiling samples can briefly receive an invalid coordinate while a
  // cinematic camera is being handed back to the player. Treat that sample as
  // an outer wall instead of indexing the map with NaN and aborting the frame.
  if (!Number.isFinite(x) || !Number.isFinite(y)) return true;
  const cellX = Math.floor(x);
  const cellY = Math.floor(y);
  if (cellY < 0 || cellY >= WORLD_HEIGHT || cellX < 0 || cellX >= WORLD_WIDTH) return true;
  const row = worldMap[cellY];
  return !row || row[cellX] === '1';
}
function lobbyGateBlocksPath(x, y) {
  if (directDungeonStart || state.room !== 0) return false;
  if (!LOBBY_GATE) return false;
  const gateDepth = x > LOBBY_GATE.x - .72 && x < LOBBY_GATE.x + .7;
  const gateWidth = Math.abs(y - LOBBY_GATE.y) < FOREST_HALL_GATE_HALF_WIDTH + .08;
  if (state.lobbyDeparted) return gateDepth && gateWidth;
  if (state.lobbyGateOpen) return false;
  return gateDepth && gateWidth;
}
function canStand(x, y) {
  const radius = .17;
  if (lobbyGateBlocksPath(x, y)) return false;
  if (lobbyGateBlocksPath(x - radius, y - radius) || lobbyGateBlocksPath(x + radius, y - radius) || lobbyGateBlocksPath(x - radius, y + radius) || lobbyGateBlocksPath(x + radius, y + radius)) return false;
  return !isWall(x - radius, y - radius) && !isWall(x + radius, y - radius) && !isWall(x - radius, y + radius) && !isWall(x + radius, y + radius);
}
function hasLineOfSight(ax, ay, bx, by) { const distance = Math.hypot(bx - ax, by - ay); const steps = Math.ceil(distance / .12); for (let i = 1; i < steps; i += 1) { const t = i / steps; if (isWall(lerp(ax, bx, t), lerp(ay, by, t))) return false; } return true; }
function allHostiles() {
  const hostiles = worldEnemies.filter((enemy) => enemy.roomIndex === state.room && !enemy.dead);
  if (state.finalBoss && !state.finalBoss.dead && state.room === FINAL_ROOM_INDEX) hostiles.push(state.finalBoss);
  return hostiles;
}
function hostileById(id) { return allHostiles().find((enemy) => enemy.id === id) || null; }
function hostileAimHeight(hostile) { return hostile?.boss ? 1.35 : enemyProfile(hostile).aimHeight; }
function hostileRadius(hostile) { return hostile?.boss ? .92 : Math.max(.22, enemyProfile(hostile).scale * .58); }
function distanceToAimLine(hostile, direction) {
  const point = { x: hostile.x - state.player.x, y: hostile.y - state.player.y, z: hostileAimHeight(hostile) - EYE_HEIGHT };
  const along = point.x * direction.x + point.y * direction.y + point.z * direction.z;
  if (along < 0) return Infinity;
  const nearest = { x: direction.x * along, y: direction.y * along, z: direction.z * along };
  return Math.hypot(point.x - nearest.x, point.y - nearest.y, point.z - nearest.z);
}
function resizeCanvas() {
  const cssWidth = Math.max(1, canvas.clientWidth);
  const cssHeight = Math.max(1, canvas.clientHeight);
  const ratio = Math.min(window.devicePixelRatio || 1, 1.25);
  const aspect = cssWidth / cssHeight;
  let width = Math.max(320, Math.floor(cssWidth * ratio));
  width = Math.min(width, MAX_RENDER_WIDTH);
  let height = Math.round(width / aspect);
  if (height > MAX_RENDER_HEIGHT) { height = MAX_RENDER_HEIGHT; width = Math.round(height * aspect); }
  if (height < 180) { height = 180; width = Math.round(height * aspect); }
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
}
function renderCamera() {
  const source = state.cinematicCamera?.active ? state.cinematicCamera : state.player;
  const startRoom = rooms[STARTING_ROOM_INDEX];
  const startPoint = roomContentPoint(STARTING_ROOM_INDEX, startRoom.spawn.x, startRoom.spawn.y);
  const fallback = {
    x: roomOffsets[STARTING_ROOM_INDEX] + startPoint.x,
    y: startPoint.y,
    angle: startRoom.spawn.angle,
    pitch: 0,
    roll: 0,
    fovKick: 0,
  };
  if (!source || !Number.isFinite(source.x) || !Number.isFinite(source.y) || !Number.isFinite(source.angle)) {
    if (state.cinematicCamera?.active) state.cinematicCamera = { ...fallback, active: true };
    else Object.assign(state.player, fallback);
    return state.cinematicCamera?.active ? state.cinematicCamera : state.player;
  }
  return {
    ...source,
    pitch: Number.isFinite(source.pitch) ? source.pitch : 0,
    roll: Number.isFinite(source.roll) ? source.roll : 0,
    fovKick: Number.isFinite(source.fovKick) ? source.fovKick : 0,
  };
}
function cameraFov() {
  const camera = renderCamera();
  const weaponKick = state.cinematicCamera?.active ? 0 : (state.weapon.fovKick || 0);
  return clamp(FOV + (camera.fovKick || 0) + weaponKick, Math.PI / 4.8, Math.PI / 1.42);
}
function focalX() { return canvas.width / (2 * Math.tan(cameraFov() / 2)); }
function focalY() { return canvas.height / (2 * Math.tan(VERTICAL_FOV / 2)); }
function cameraHorizon() { const camera = renderCamera(); return canvas.height * (.5 + (camera.pitch || 0) * 1.18); }
function projectY(z, forward) { return cameraHorizon() - Math.tan(Math.atan2(z - EYE_HEIGHT, Math.max(.01, forward))) * focalY(); }
function cameraPoint(x, y, z) { const camera = renderCamera(); const dx = x - camera.x; const dy = y - camera.y; return { side: -dx * Math.sin(camera.angle) + dy * Math.cos(camera.angle), forward: dx * Math.cos(camera.angle) + dy * Math.sin(camera.angle), z }; }
function projectCameraPoint(point) {
  if (point.forward <= .04) return null;
  const camera = renderCamera();
  const rawX = canvas.width / 2 + point.side * focalX() / point.forward;
  const rawY = projectY(point.z, point.forward);
  const roll = camera.roll || 0;
  if (!roll) return { x: rawX, y: rawY, depth: point.forward };
  const cosine = Math.cos(roll);
  const sine = Math.sin(roll);
  const dx = rawX - canvas.width / 2;
  const dy = rawY - canvas.height / 2;
  return {
    x: canvas.width / 2 + dx * cosine - dy * sine,
    y: canvas.height / 2 + dx * sine + dy * cosine,
    depth: point.forward,
  };
}

function emitAmbientParticles(delta) {
  state.ambientParticleTimer -= delta;
  if (state.ambientParticleTimer > 0) return;
  state.ambientParticleTimer = settings.reducedMotion ? .34 : .13;
  if (state.doorOfLight?.active && state.room === FINAL_ROOM_INDEX && Math.random() < .82) spawnParticles(state.doorOfLight.x, state.doorOfLight.y, .8, ['#b8f0e2', '#fff8db'], 2, { speed: .72, life: .9, size: .62, upward: .75, spread: TAU, gravity: -.1, drag: .97, glow: 16, shape: 'dot' });
}

function updateSegmentBar(bar, value, maximum) {
  if (!bar) return;
  const normalized = clamp(value / Math.max(1, maximum), 0, 1);
  const units = normalized * 10;
  const segments = bar.querySelectorAll('.status-segment');
  const pixelCount = 15;
  const now = performance.now();

  segments.forEach((segment, index) => {
    const fill = clamp(units - index, 0, 1);
    const targetPixels = Math.round(fill * pixelCount);

    let pixelGrid = segment.querySelector('.status-pixels');
    if (!pixelGrid) {
      pixelGrid = document.createElement('span');
      pixelGrid.className = 'status-pixels';
      for (let pixel = 0; pixel < pixelCount; pixel += 1) {
        const cell = document.createElement('span');
        cell.className = 'status-pixel';
        cell.dataset.pixel = String(pixel);
        pixelGrid.appendChild(cell);
      }
      segment.appendChild(pixelGrid);
    }

    // A stable order makes the segment look like it is breaking apart rather
    // than randomly blinking. Only one piece is changed per step.
    const removalOrder = Array.from({ length: pixelCount }, (_, pixel) => pixel)
      .sort((a, b) => hash2(index, a, 19) - hash2(index, b, 19));
    const rankByPixel = new Map(removalOrder.map((pixel, rank) => [pixel, rank]));

    if (!Number.isFinite(segment._pixelVisible)) segment._pixelVisible = targetPixels;
    if (!Number.isFinite(segment._pixelTarget)) segment._pixelTarget = targetPixels;
    if (!Number.isFinite(segment._pixelStepAt)) segment._pixelStepAt = now;

    segment._pixelTarget = targetPixels;
    if (segment._pixelVisible !== segment._pixelTarget && now >= segment._pixelStepAt) {
      segment._pixelVisible += segment._pixelVisible < segment._pixelTarget ? 1 : -1;
      segment._pixelStepAt = now + .075;
    }

    const visiblePixels = clamp(segment._pixelVisible, 0, pixelCount);
    const visible = new Set(removalOrder.slice(0, visiblePixels));
    segment.classList.toggle('is-full', visiblePixels >= pixelCount);
    segment.classList.toggle('is-partial', visiblePixels > 0 && visiblePixels < pixelCount);
    segment.classList.toggle('is-empty', visiblePixels <= 0);
    segment.style.setProperty('--fill', (visiblePixels / pixelCount).toFixed(3));

    pixelGrid.querySelectorAll('.status-pixel').forEach((cell, pixel) => {
      const isVisible = visible.has(pixel);
      cell.classList.toggle('is-visible', isVisible);
      cell.style.opacity = isVisible ? '.96' : '0';
    });
  });
  bar.parentElement?.setAttribute('aria-valuenow', String(Math.ceil(value)));
}

function updateCombatHud() {
  const hudNow = state.now || performance.now();
  if (hudNow - state.lastCombatHudAt < 0.05) return;
  state.lastCombatHudAt = hudNow;
  const definition = weaponDefinition();
  const ability = selectedAbilityDefinition();
  const weaponBusy = state.weapon.equipped && state.weapon.swing > 0;
  const weaponCooling = state.weapon.equipped && state.weapon.cooldown > 0;
  const weaponPhase = !state.weapon.equipped ? 'NO WEAPON' : weaponBusy ? (state.weapon.type === 'blade' ? 'RUNNING' : state.weapon.type === 'bfg' ? 'FIRING' : 'FIRING') : weaponCooling ? 'RECOVERING' : 'READY';
  const weaponTimer = weaponBusy ? state.weapon.swing : state.weapon.cooldown;
  const weaponTotal = weaponBusy ? definition.duration : Math.max(definition.cooldown || .01, .01);
  const weaponProgress = clamp(1 - weaponTimer / weaponTotal, 0, 1);
  if (weaponHudLabel) weaponHudLabel.textContent = state.weapon.equipped ? `${definition.label.toUpperCase()} · ${state.weapon.type === 'blade' ? 'MELEE' : state.weapon.type === 'bfg' ? 'ELECTRIC LAUNCHER' : state.weapon.type === 'shotgun' ? 'PUMP-ACTION' : state.weapon.type === 'bfg' ? 'ELECTRIC LAUNCHER' : 'SEMI-AUTO'}` : 'NO WEAPON';
  if (weaponStatus) weaponStatus.textContent = state.weapon.reloadTimer > 0 ? `RELOADING ${Math.ceil(state.weapon.reloadTimer * 10) / 10}s` : weaponPhase;
  if (ammoValue) ammoValue.textContent = definition.magazineSize ? `AMMO ${state.weapon.ammo}/${state.weapon.reserveAmmo}` : 'AMMO ∞';
  if (weaponKills) weaponKills.textContent = `KILLS ${state.kills || 0}`;
  const threats = worldEnemies.filter((enemy) => enemy.roomIndex === state.room && !enemy.dead).length + (state.finalBoss && state.room === FINAL_ROOM_INDEX && !state.finalBoss.dead ? 1 : 0);
  if (threatCountValue) threatCountValue.textContent = `THREATS ${threats}`;
  if (combatHealth) combatHealth.textContent = String(Math.max(0, Math.ceil(state.player.hp))).padStart(3, '0');
  if (combatHealthBar) combatHealthBar.style.width = `${clamp(state.player.hp, 0, 100)}%`;
  if (combatWeaponName) combatWeaponName.textContent = definition.label.toUpperCase();
  if (combatAmmo) combatAmmo.textContent = definition.magazineSize ? String(state.weapon.ammo).padStart(2, '0') : '∞';
  if (combatReserve) combatReserve.textContent = definition.magazineSize ? String(state.weapon.reserveAmmo).padStart(3, '0') : 'READY';
  if (combatMode) combatMode.textContent = state.weapon.reloadTimer > 0 ? 'RELOADING' : weaponPhase;
  if (combatKills) combatKills.textContent = String(state.kills || 0).padStart(2, '0');
  if (combatThreats) combatThreats.textContent = String(threats).padStart(2, '0');
  weaponSlots.forEach((slot) => slot.classList.toggle('is-active', slot.dataset.weaponSlot === state.weapon.type));
  // Advance both resource displays continuously so a changed target does not
  // remove an entire group of pixels in a single HUD update.
  updateSegmentBar(hpBar, state.player.hp, 100);
  const aimNow = state.now || performance.now();
  const aimActive = !state.menuActive && !state.reading && !state.transition && !state.forestTransition && !state.launchTransition;
  if (!aimActive) state.aimTarget = null;
  else if (aimNow - state.lastAimTargetAt > 100 || state.lastAimTargetRoom !== state.room) {
    state.lastAimTargetAt = aimNow;
    state.lastAimTargetRoom = state.room;
    state.aimTarget = findAimTarget();
  }
}

function drawNarratorPortrait(frameIndex = 0) {
  if (!narratorPortraitCanvas || !spriteReady(gameSprites.narratorGeneralSheet)) return;
  const frame = keyedSpriteFrame(gameSprites.narratorGeneralSheet, 4, 3, frameIndex, 'narrator-general-sheet');
  if (!frame) return;
  const portraitContext = narratorPortraitCanvas.getContext('2d');
  portraitContext.clearRect(0, 0, narratorPortraitCanvas.width, narratorPortraitCanvas.height);
  portraitContext.imageSmoothingEnabled = false;
  const scale = Math.min(narratorPortraitCanvas.width / frame.width, narratorPortraitCanvas.height / frame.height);
  const width = Math.floor(frame.width * scale);
  const height = Math.floor(frame.height * scale);
  portraitContext.drawImage(frame, Math.floor((narratorPortraitCanvas.width - width) / 2), Math.floor((narratorPortraitCanvas.height - height) / 2), width, height);
}

// The commander sheet is a 4 x 3 atlas. The pose map is intentionally
// explicit so a line never gets a generic portrait by accident:
// The supplied atlas is 4 columns x 3 rows. Row 0 (frames 0–3) is the
// authored talking animation. Rows 1–2 contain the still expressions used
// between words and for milestone reactions.
const NARRATOR_EXPRESSION_FRAMES = Object.freeze({
  'expression-calm': 0,
  'expression-alert': 4,
  'expression-angry': 6,
  'expression-command': 10,
  'expression-worried': 5,
  'expression-recoil': 11,
  'expression-pleased': 7,
  'expression-relieved': 7,
  'expression-focused': 8,
});
const NARRATOR_TALKING_SEQUENCES = Object.freeze({
  'expression-calm': [0, 1, 2, 3],
  'expression-alert': [0, 1, 2, 3],
  'expression-angry': [0, 1, 2, 3],
  'expression-command': [0, 1, 2, 3],
  'expression-worried': [0, 1, 2, 3],
  'expression-recoil': [0, 1, 2, 3],
  'expression-pleased': [0, 1, 2, 3],
  'expression-relieved': [0, 1, 2, 3],
  'expression-focused': [0, 1, 2, 3],
});
const NARRATOR_TALKING_FRAMES = NARRATOR_TALKING_SEQUENCES['expression-calm'];
const NARRATOR_EXPRESSION_CLASSES = [
  'expression-calm',
  'expression-alert',
  'expression-angry',
  'expression-command',
  'expression-worried',
  'expression-recoil',
  'expression-pleased',
  'expression-relieved',
  'expression-focused',
];

function narratorTalkingFrames(expression, override = null) {
  return Array.isArray(override) && override.length
    ? override
    : (NARRATOR_TALKING_SEQUENCES[expression] || NARRATOR_TALKING_FRAMES);
}

function announceNarrator(event, kicker, message, expression = 'expression-calm', expressionFrame = null, options = {}) {
  const now = performance.now();
  const current = state.narratorSignal;
  const priority = Number(options.priority || 0);
  const duration = Number(options.duration || 6.5) * 1000;
  if (!options.repeat && state.narratorSeenEvents.has(event)) return false;
  if (current && current.event === event && current.message === message && current.until > now) return false;
  if (!options.force && current && current.until > now && Number(current.priority || 0) > priority) return false;
  const resolvedFrame = Number.isFinite(expressionFrame)
    ? expressionFrame
    : (NARRATOR_EXPRESSION_FRAMES[expression] ?? 0);
  state.narratorSeenEvents.add(event);
  state.narratorSignal = {
    event,
    kicker,
    message,
    expression,
    expressionFrame: resolvedFrame,
    talkingFrames: narratorTalkingFrames(expression, options.talkingFrames),
    priority,
    until: now + duration,
  };
  return true;
}

function hideNarratorPanel() {
  if (!narratorPanel) return;
  narratorPanel.hidden = true;
  narratorPanel.classList.remove('is-speaking');
  narratorPortrait?.classList.remove('is-transmitting', 'is-talking');
  if (narratorPortrait) narratorPortrait.dataset.talking = '0';
  // Do not let a line interrupted by a cinematic reappear when the camera
  // returns. The next ordinary gameplay milestone gets a clean transmission.
  narratorPanel._narratorTarget = '';
  narratorPanel._narratorVisibleUntil = 0;
  narratorPanel.dataset.narratorEvent = '';
  narratorPanel.dataset.narratorLine = '';
  if (narratorMessage) narratorMessage.textContent = '';
}

function narratorTransmissionForState() {
  if (cinematicActive()) return null;
  const room = rooms[state.room];
  const playerHp = state.player?.hp ?? 100;
  const miniBoss = worldEnemies.find((enemy) => enemy.roomIndex === state.room && enemy.miniBoss && !enemy.dead);
  const arena = state.miniBossArena?.roomIndex === state.room ? state.miniBossArena : null;
  const boss = state.room === FINAL_ROOM_INDEX ? state.finalBoss : null;
  const bossName = boss?.displayName || boss?.name || 'the Operations Archon';
  const miniBossName = miniBoss?.displayName || miniBoss?.name || 'the arena target';

  const transmission = (event, kicker, message, expression, expressionFrame, talkingFrames = null) => {
    if (state.narratorSeenEvents.has(event)) return null;
    return {
      event,
      kicker,
      message,
      expression,
      expressionFrame: Number.isFinite(expressionFrame) ? expressionFrame : (NARRATOR_EXPRESSION_FRAMES[expression] ?? 0),
      talkingFrames: narratorTalkingFrames(expression, talkingFrames),
    };
  };

  const signal = state.narratorSignal;
  if (signal && signal.until > performance.now()) return signal;
  if (signal) state.narratorSignal = null;

  // The transition is an authored story beat, so it outranks the lobby state
  // for the short moment in which the player is pulled below the forest.
  if (state.room === 0 && state.forestTransition) {
    return transmission(
      'forest-transition',
      'ROUTE INTERRUPTED',
      'The forest has pulled you below the archive. Liam sent you for his Document of Truth—his résumé. Survive the threshold.',
      'expression-recoil',
      11,
    );
  }

  // The commander owns every line. Pip can still teach the controls in his
  // separate field-guide layer, but the lower HUD is one consistent voice.
  if (state.room === 0) {
    if (state.lobbyDeparted) {
      return transmission(
        'lobby-departure',
        'MISSION ROUTE',
        'ROUTE ACTIVE. ENTER THE ARCHIVE.',
        'expression-command',
        10,
      );
    }
    if (!state.weapon.equipped) {
      return transmission(
        'lobby-mission-brief',
        'MISSION BRIEF',
        'This is not a biography tour. Watch the work: noisy systems become evidence, evidence becomes a decision, and the decision becomes a route others can run.',
        'expression-command',
        10,
      );
    }
    if (!lobbyPortfolioScroll.recovered) {
      return transmission(
        'lobby-weapon-ready',
        'LOADOUT CONFIRMED',
        'Loadout confirmed. The route is the portfolio: pressure, evidence, judgment, and delivery. Keep moving.',
        'expression-command',
        10,
      );
    }
    if (state.lobbyGateOpening) {
      return transmission(
        'lobby-gate-opening',
        'ARCHIVE KEY',
        'Archive Key is opening the route. Beyond the forest waits Liam’s Document of Truth—his résumé.',
        'expression-command',
        10,
      );
    }
    if (!state.lobbyGateOpen) {
      return transmission(
        'lobby-record-recovered',
        'OBJECTIVE UPDATED',
        'GATE SEALED. TEST THE ROUTE. OPEN THE GATE.',
        'expression-command',
        10,
      );
    }
    return transmission(
      'lobby-gate-open',
      'ROUTE OPEN',
      'GATE OPEN. FOLLOW THE ROUTE.',
      'expression-command',
      10,
    );
  }

  if (state.room === STARTING_ROOM_INDEX) {
    return transmission(
      'threshold-entry',
      'MISSION / THRESHOLD',
      'Start with the evidence. Each chamber shows how Liam approaches a problem: clarify the signal, trace the system, and leave a result someone else can use.',
      'expression-alert',
      4,
    );
  }

  // Mini-boss states are deliberately ordered before low-health warnings. The
  // commander should describe the encounter, not drown it out with a generic
  // damage line.
  if (miniBoss) {
    const ratio = miniBoss.maxHp ? miniBoss.hp / miniBoss.maxHp : 1;
    if (ratio < .42) {
      return transmission(
        `mini-${miniBoss.id}-critical`,
        'TARGET CRITICAL',
        `${miniBossName} is below forty-two percent. Keep pressure on it; defeat it to open the exit toward Liam’s résumé.`,
        'expression-angry',
        6,
      );
    }
    if (arena?.entranceClosed) {
      return transmission(
        `mini-${miniBoss.id}-sealed`,
        'ARENA SEALED',
        `${miniBossName} has sealed the arena. The entrance is locked, and the exit stays closed until you defeat it.`,
        'expression-command',
        10,
      );
    }
    return transmission(
      `mini-${miniBoss.id}-entry`,
      'TARGET ACQUIRED',
      `That is ${miniBossName}. Cross the threshold; the arena seals behind you, and the exit stays closed until it falls.`,
      'expression-alert',
      4,
    );
  }

  if (arena?.exitOpen) {
    return transmission(
      `mini-defeated-${room?.id || state.room}`,
      'ROUTE RESTORED',
      `${arena.roomIndex === state.room ? 'The target is down.' : 'The arena is clear.'} The exit is open; continue through the archive toward Liam’s Document of Truth.`,
      'expression-relieved',
      7,
    );
  }

  if (state.doorOfLight?.active) {
    return transmission(
      'archon-defeated',
      'ROUTE SECURED',
      'ARCHON DOWN. EXIT OPEN. MOVE EAST TO THE LIGHTWELL.',
      'expression-relieved',
      7,
    );
  }

  if (boss && !boss.dead) {
    const waveActive = boss.waveActive || boss.waveEnemiesRemaining > 0;
    if (waveActive) {
      return transmission(
        `archon-wave-${boss.waveIndex}`,
        `SUPPORT WAVE ${boss.waveIndex}`,
        `${bossName} is calling reinforcements. Break the support wave, then punish the opening before reaching the Document of Truth.`,
        'expression-command',
        10,
      );
    }
    if (boss.phase >= 3) {
      return transmission(
        'archon-collapse',
        'FINAL PHASE',
        `${bossName} is losing control. Hold your ground and finish the delivery; Liam’s résumé is beyond the lightwell.`,
        'expression-recoil',
        11,
      );
    }
    if (boss.phase >= 2) {
      return transmission(
        'archon-system',
        'SYSTEM PHASE',
        `${bossName} has changed pattern. Read the lattice, survive the next opening, and keep the route to Liam’s résumé clear.`,
        'expression-worried',
        5,
      );
    }
    return transmission(
      'archon-brief',
      'FINAL ENCOUNTER',
      `${bossName} guards the lightwell. Break the core, enter the door of light, and secure Liam’s Document of Truth—his résumé.`,
      'expression-worried',
      5,
    );
  }

  if (state.room === SANCTUARY_ROOM_INDEX) {
    if (state.resumeDownloaded) {
      return transmission(
        'document-downloaded',
        'MISSION COMPLETE',
        'RÉSUMÉ DOWNLOADED. MISSION COMPLETE.',
        'expression-relieved',
        7,
      );
    }
    return transmission(
      'document-awaits',
      'DOCUMENT OF TRUTH',
      'RÉSUMÉ LOCATED. APPROACH THE PEDESTAL.',
      'expression-relieved',
      7,
    );
  }

  if (playerHp <= 30) {
    const healthBand = playerHp <= 12 ? 'critical' : 'low';
    return transmission(
      `health-${healthBand}-${room?.id || state.room}`,
      healthBand === 'critical' ? 'CRITICAL CONDITION' : 'DAMAGE REPORT',
      healthBand === 'critical'
        ? 'Critical condition. Find cover, reload, and make one clean exchange.'
        : 'You took a hit. Use cover, reload, and keep Liam’s route moving.',
      'expression-worried',
      5,
    );
  }

  const roomLines = {
    entrance: transmission(
      'room-entrance',
      'FIELD ORIENTATION',
      'Liam sent you here to secure the Document of Truth—his résumé. The archive holds the proof behind the work.',
      'expression-command',
      10,
    ),
    trophy: transmission(
      'room-trophy',
      'TROPHY ROOM',
      'Clear the Trophy Room, then recover the proof: five enterprise accounts, 1M+ monthly messages, and roughly $40K in Azure savings identified.',
      'expression-focused',
      8,
    ),
    quests: transmission(
      'room-quests',
      'QUEST METHOD',
      'Trace the requirement, automate the repeatable path, and measure the result. Every room adds one piece of the operating picture.',
      'expression-focused',
      8,
    ),
    chronicle: transmission(
      'room-chronicle',
      'CAREER CHRONICLE',
      'This room connects research and systems operations to Liam’s current technical consulting work. Follow the evidence into the next case.',
      'expression-calm',
      0,
    ),
    character: transmission(
      'room-character',
      'TOOLKIT',
      'The toolkit is built for the route: Oracle SQL, BigQuery, Power BI, Python, PowerShell, and EDI, AS2, and SFTP integrations.',
      'expression-focused',
      8,
    ),
    campfire: transmission(
      'room-campfire',
      'OFF DUTY',
      'Beyond systems, Liam bakes, grows plants, plays drums, and is learning bass. Clear this room, then continue the delivery.',
      'expression-pleased',
      7,
    ),
    gate: transmission(
      'room-gate',
      'LIGHTWELL',
      'The Operations Archon guards the final route. Defeat it, enter the door of light, and secure Liam’s Document of Truth.',
      'expression-worried',
      5,
    ),
  };
  return roomLines[room?.id] || transmission(
    `room-${room?.id || state.room}`,
    `${room?.level || 'ARCHIVE'} · FIELD NOTE`,
    room?.fieldNote || 'The next case study is ahead. Keep the route moving toward delivery.',
    'expression-calm',
    0,
  );
}

function applyNarratorExpression(expression, expressionFrame) {
  if (!narratorPortrait) return;
  narratorPortrait.classList.remove(...NARRATOR_EXPRESSION_CLASSES);
  narratorPortrait.classList.add(expression);
  narratorPortrait.dataset.expressionFrame = String(expressionFrame);
}

function updateNarrator() {
  if (!narratorPanel || !narratorMessage) return;
  const next = narratorTransmissionForState();
  if (!next) {
    hideNarratorPanel();
    return;
  }
  const lineChanged = narratorPanel.dataset.narratorEvent !== next.event
    || narratorPanel.dataset.narratorLine !== next.message;

  narratorKicker.textContent = next.kicker;
  narratorSpeaker.textContent = 'THE COMMANDER';
  applyNarratorExpression(next.expression, next.expressionFrame);
  narratorPanel._narratorTalkingFrames = narratorTalkingFrames(next.expression, next.talkingFrames);

  if (lineChanged) {
    narratorPanel._narratorTarget = next.message;
    narratorPanel._narratorStartedAt = performance.now();
    narratorPanel._narratorVisibleUntil = 0;
    narratorMessage.textContent = '';
    state.narratorSeenEvents.add(next.event);
    state.narratorLastTransmission = next;
    narratorPanel.dataset.narratorEvent = next.event;
    narratorPanel.dataset.narratorLine = next.message;
    narratorPanel.hidden = false;
    narratorPanel.classList.add('is-speaking');
    narratorPortrait?.classList.add('is-talking');
  } else if (narratorPanel._narratorTarget) {
    // The panel is intentionally persistent. A completed line remains in the
    // same compartment until a new milestone replaces it.
    narratorPanel.hidden = false;
  }

  updateNarratorTypewriter(performance.now());
}

function updateNarratorTypewriter(now) {
  if (!narratorPanel || !narratorMessage) return;
  if (cinematicActive()) {
    hideNarratorPanel();
    return;
  }
  const target = narratorPanel._narratorTarget || '';
  if (!target) return;

  narratorPanel.hidden = false;
  const elapsed = Math.max(0, now - (narratorPanel._narratorStartedAt || now));
  const charsPerSecond = 42;
  const visibleCount = Math.min(target.length, Math.floor(elapsed / 1000 * charsPerSecond));
  const isTyping = visibleCount < target.length;

  narratorMessage.textContent = target.slice(0, visibleCount);
  narratorPanel.classList.toggle('is-speaking', isTyping);
  narratorPortrait?.classList.toggle('is-transmitting', isTyping);
  narratorPortrait?.classList.toggle('is-talking', isTyping);
  if (narratorPortrait) narratorPortrait.dataset.talking = isTyping ? '1' : '0';

  if (!isTyping) {
    // Keep the complete line visible. Only the transmission state ends here;
    // the four HUD compartments never collapse or reflow.
    narratorMessage.textContent = target;
    if (!narratorPanel._narratorVisibleUntil) narratorPanel._narratorVisibleUntil = now + 2600;
    if (now >= narratorPanel._narratorVisibleUntil) {
      narratorPanel.classList.remove('is-speaking');
      narratorPortrait?.classList.remove('is-transmitting', 'is-talking');
      if (narratorPortrait) {
        narratorPortrait.dataset.talking = '0';
        drawNarratorPortrait(Number(narratorPortrait.dataset.expressionFrame || 0));
      }
      narratorPanel.hidden = true;
    }
  }
}

function updateHud() {
  const active = worldEnemies.filter((enemy) => enemy.roomIndex === state.room && !enemy.dead).length;
  const bossActive = state.room === FINAL_ROOM_INDEX && state.finalBoss && !state.finalBoss.dead;
  const recovered = worldItems.reduce((count, item) => count + (item.recovered ? 1 : 0), 0);
  const xpSignature = `${state.xp}|${state.level}|${[...state.unlockedAbilitys].join(',')}|${state.selectedAbilityId || ''}`;
  const miniBoss = worldEnemies.find((enemy) => enemy.roomIndex === state.room && enemy.miniBoss && !enemy.dead);
  const bossSignature = bossActive ? `${state.finalBoss.hp}|${state.finalBoss.phase}|${state.finalBoss.shield}|${state.finalBoss.waveIndex}|${state.finalBoss.waveState}|${state.finalBoss.waveEnemiesRemaining}` : 'none';
  const guideObjectiveSignature = `${state.guideIntroPhase}|${state.guideControlsLocked ? 1 : 0}|${state.guideWaitingForWeapon ? 1 : 0}|${state.guideWeaponCollected ? 1 : 0}|${lobbyPortfolioScroll.recovered ? 1 : 0}|${state.lobbyGateOpen ? 1 : 0}`;
  const signature = `${state.room}|${active}|${recovered}|${ITEM_TOTAL}|${Math.ceil(state.player.hp)}|${miniBoss?.id || 'none'}|${xpSignature}|${bossSignature}|${state.doorOfLight?.active ? 1 : 0}|${guideObjectiveSignature}`;
  if (signature !== state.hudSignature) {
    state.hudSignature = signature;
    const room = rooms[state.room];
    const threatCount = active + (bossActive ? 1 : 0);
    roomFloor.textContent = room.level;
    roomCount.textContent = `${String(state.room + 1).padStart(2, '0')} / ${String(rooms.length).padStart(2, '0')}`;
    const hpNow = Math.ceil(state.player.hp);
    const hpPercent = clamp(state.player.hp, 0, 100);
    updateSegmentBar(hpBar, state.player.hp, 100);
    if (experienceValue) experienceValue.textContent = `LVL ${state.level} · ${state.xp} XP`;
    if (objectiveLabel && objectiveDetail) {
      if (state.room === SANCTUARY_ROOM_INDEX) {
        objectiveLabel.textContent = state.resumeDownloaded ? 'RÉSUMÉ SECURED' : 'GET THE RÉSUMÉ';
        objectiveDetail.textContent = state.resumeDownloaded ? 'DOWNLOAD STARTED.' : 'FIND THE PEDESTAL. PRESS E.';
      } else if (bossActive) {
        objectiveLabel.textContent = `KILL THE ARCHON · PHASE ${state.finalBoss.phase}`;
        objectiveDetail.textContent = state.finalBoss.waveActive
          ? `WAVE ${state.finalBoss.waveIndex} / ${ARCHON_WAVES.length} · ${state.finalBoss.waveEnemiesRemaining} SUPPORT UNITS REMAIN.`
          : state.finalBoss.shield > 0 ? 'Break the active lattice shield, then keep pressure on the core.' : 'Read the attack rhythm and make the next delivery count.';
      } else if (state.doorOfLight?.active) {
        objectiveLabel.textContent = 'ENTER THE EXIT';
        objectiveDetail.textContent = 'THE EXIT IS OPEN. MOVE EAST.';
      } else if (state.room === 0) {
        if (state.guideIntroPhase === 'look') {
          objectiveLabel.textContent = 'CLEAR THE THRESHOLD';
          objectiveDetail.textContent = 'Move through the interior dungeon and eliminate the first threat.';
        } else if (state.lobbyGateOpen) {
          objectiveLabel.textContent = 'FOLLOW THE ARCHIVE ROUTE';
          objectiveDetail.textContent = 'Push through the connected dungeon chambers.';
        } else if (state.guideWaitingForWeapon || !state.weapon.equipped) {
          objectiveLabel.textContent = 'READ THE ROOM';
          objectiveDetail.textContent = 'Start with the signal: separate the requirement from the symptom.';
        } else if (!lobbyPortfolioScroll.recovered) {
          objectiveLabel.textContent = 'TRACE THE EVIDENCE';
          objectiveDetail.textContent = 'Read the room, test the path, and leave a result someone else can use.';
        } else {
          objectiveLabel.textContent = 'OPEN THE ARCHIVE GATE';
          objectiveDetail.textContent = 'Cast Archive Key with Q. The record is already in your archive.';
        }
      } else if (state.room === STARTING_ROOM_INDEX) {
        objectiveLabel.textContent = 'FOLLOW THE ARCHIVE ROUTE';
        objectiveDetail.textContent = 'Clear the first chamber, then follow the curving route toward Liam’s Document of Truth.';
      } else {
        objectiveLabel.textContent = 'MAKE THE SIGNAL USEFUL';
        objectiveDetail.textContent = room.subtitle;
      }
    }
    if (bossPlaque) bossPlaque.hidden = true;
    if (bossBottomHud) bossBottomHud.hidden = !bossActive;
    if (bossActive) {
      const waveLabel = state.finalBoss.waveActive ? ` · WAVE ${state.finalBoss.waveIndex}/${ARCHON_WAVES.length}` : '';
      const phaseLabel = `${BOSS_PHASES[state.finalBoss.phase - 1].name}${waveLabel}${state.finalBoss.shield > 0 ? ' · SHIELD ACTIVE' : ''}`;
      const healthPercent = `${clamp(state.finalBoss.hp / state.finalBoss.maxHp * 100, 0, 100)}%`;
      if (bossName) bossName.textContent = state.finalBoss.name;
      if (bossHealthBar) bossHealthBar.style.width = healthPercent;
      if (bossPhase) bossPhase.textContent = phaseLabel;
      if (bossBottomName) bossBottomName.textContent = state.finalBoss.name;
      if (bossBottomHealth) bossBottomHealth.style.width = healthPercent;
      if (bossBottomPhase) bossBottomPhase.textContent = phaseLabel;
    } else {
      if (bossBottomHud) bossBottomHud.hidden = true;
      if (bossHealthBar) bossHealthBar.style.width = '0%';
      if (bossBottomHealth) bossBottomHealth.style.width = '0%';
    }
  }
  if (cinematicActive()) hideNarratorPanel();
  else updateNarrator();
  updateCombatHud();
}
let toastTimeout = 0;
function showToast(text, tone = '') { clearTimeout(toastTimeout); toast.textContent = text; toast.hidden = false; toast.className = `toast visible${tone ? ` ${tone}` : ''}`; toastTimeout = window.setTimeout(() => { toast.classList.remove('visible'); window.setTimeout(() => { toast.hidden = true; }, 220); }, 2500); }

// Center hit markers were intentionally removed. Enemy-world feedback is used instead.
function showHitMarker() {}
function pushImpactBurst(burst) {
  // Impact effects are transient presentation only. Never allow rapid fire or
  // projectile collisions to grow an unbounded render list.
  if (state.impactBursts.length >= MAX_IMPACT_BURSTS) {
    state.impactBursts.splice(0, Math.max(1, state.impactBursts.length - MAX_IMPACT_BURSTS + 1));
  }
  state.impactBursts.push(burst);
}

function spawnPickupEffect(x, y, color) {
  const accent = color || '#e7ad67';
  const count = settings.reducedMotion ? 8 : 22;
  spawnParticles(x, y, .24, [accent, '#d6b57b', '#fff1b0'], count, {
    speed: 1.25,
    life: 1.05,
    size: .82,
    upward: .92,
    spread: TAU,
    gravity: .18,
    drag: .94,
    glow: 18,
    trail: true,
  });
  spawnParticles(x, y, .29, [accent, '#f7e2ac'], settings.reducedMotion ? 3 : 8, {
    speed: .72,
    life: .82,
    size: 1.25,
    upward: .56,
    spread: TAU,
    gravity: -.06,
    drag: .97,
    glow: 16,
    shape: 'ring',
  });
}
function spawnParticles(x, y, z, color = '#e7ad67', count = 8, options = {}) {
  if (settings.reducedMotion) count = Math.ceil(count * .32);
  const maxParticles = settings.reducedMotion ? MAX_REDUCED_PARTICLES : MAX_PARTICLES;
  const requestedCount = Math.max(0, Math.floor(count));
  const overflow = state.particles.length + requestedCount - maxParticles;
  if (overflow > 0) state.particles.splice(0, overflow);
  const spawnCount = Math.min(requestedCount, maxParticles - state.particles.length);
  const spread = options.spread ?? .35;
  const speed = options.speed ?? 1.8;
  const life = options.life ?? .55;
  const gravity = options.gravity ?? .65;
  const colorList = Array.isArray(color) ? color : [color];
  for (let index = 0; index < spawnCount; index += 1) {
    const angle = options.angle !== undefined ? options.angle + (Math.random() - .5) * spread : Math.random() * TAU;
    const elevation = options.elevation !== undefined ? options.elevation + (Math.random() - .5) * spread : (Math.random() - .25) * spread;
    const burstSpeed = speed * (.45 + Math.random() * .8);
    state.particles.push({
      x, y, z,
      previousX: x,
      previousY: y,
      previousZ: z,
      vx: Math.cos(angle) * Math.cos(elevation) * burstSpeed,
      vy: Math.sin(angle) * Math.cos(elevation) * burstSpeed,
      vz: Math.sin(elevation) * burstSpeed + (options.upward ?? .2) * Math.random(),
      life: life * (.68 + Math.random() * .58),
      maxLife: life,
      size: (options.size ?? 1) * (.65 + Math.random() * .72),
      color: colorList[index % colorList.length],
      gravity,
      drag: options.drag ?? .92,
      shape: options.shape || 'spark',
      rotation: Math.random() * TAU,
      spin: (Math.random() - .5) * 5.5,
      glow: options.glow ?? 12,
      trail: options.trail ?? false,
    });
  }
}
function spawnAbilityParticles(ability, origin, direction = { x: 0, y: 0, z: 0 }) {
  if (!ability || !origin) return;
  const color = ability.color;
  const angle = Math.atan2(direction.y || 0, direction.x || 1);
  const reduced = settings.reducedMotion;
  const profiles = {
    gate:    { shape: 'rune',  speed: 1.15, life: .72, size: .34, spread: TAU, gravity: -.08 },
    reveal:  { shape: 'ring',  speed: 1.35, life: .76, size: .3,  spread: TAU, gravity: -.04 },
    homing:  { shape: 'star',  speed: 2.05, life: .58, size: .26, spread: .5, gravity: .03 },
    ward:    { shape: 'rune',  speed: .9,  life: .9,  size: .3,  spread: TAU, gravity: -.09 },
    chain:   { shape: 'thread',speed: 2.4,  life: .5,  size: .26, spread: .25, gravity: .04 },
    echo:    { shape: 'ring',  speed: 1.05, life: .88, size: .3,  spread: TAU, gravity: -.06 },
    fireball:{ shape: 'ember', speed: 1.8,  life: .66, size: .34, spread: .35, gravity: -.18 },
    bloom:   { shape: 'petal', speed: 1.1,  life: .96, size: .32, spread: TAU, gravity: -.12 },
    beam:    { shape: 'thread',speed: 2.8,  life: .42, size: .22, spread: .1, gravity: .02 },
  };
  const profile = profiles[ability.kind] || { shape: 'dot', speed: 1.2, life: .62, size: .28, spread: TAU, gravity: .02 };
  const count = reduced ? 3 : 7;
  spawnParticles(origin.x, origin.y, origin.z, color, count, {
    speed: profile.speed,
    life: profile.life,
    size: profile.size,
    upward: profile.shape === 'petal' || profile.shape === 'rune' ? .35 : .12,
    angle,
    spread: profile.spread,
    gravity: profile.gravity,
    drag: .96,
    glow: 13,
    shape: 'pixel',
    trail: profile.shape === 'thread' || profile.shape === 'ember',
  });
  if (ability.kind === 'fireball' || ability.kind === 'chain' || ability.kind === 'homing') {
    spawnParticles(origin.x, origin.y, origin.z, color, reduced ? 1 : 2, {
      speed: .65,
      life: .48,
      size: .18,
      spread: TAU,
      gravity: -.04,
      glow: 10,
      shape: ability.kind === 'fireball' ? 'ember' : ability.kind === 'chain' ? 'thread' : 'star',
    });
  }
}
function spawnAbilityImpactParticles(kind, x, y, z, color, scale = 1) {
  if (!kind) return;
  const reduced = settings.reducedMotion;
  const profiles = {
    reveal:  { shape: 'ring',  speed: 1.0, life: .56, size: .28, gravity: -.03 },
    homing:  { shape: 'star',  speed: 1.45, life: .5, size: .25, gravity: .04 },
    ward:    { shape: 'rune',  speed: .8, life: .7, size: .28, gravity: -.08 },
    chain:   { shape: 'thread',speed: 1.7, life: .42, size: .24, gravity: .02 },
    echo:    { shape: 'ring',  speed: 1.0, life: .76, size: .3, gravity: -.06 },
    fireball:{ shape: 'ember', speed: 1.6, life: .62, size: .34, gravity: -.18 },
    bloom:   { shape: 'petal', speed: 1.1, life: .8, size: .32, gravity: -.12 },
    beam:    { shape: 'thread',speed: 2.1, life: .38, size: .22, gravity: .02 },
    gate:    { shape: 'rune',  speed: 1.0, life: .62, size: .3, gravity: -.07 },
  };
  const profile = profiles[kind] || { shape: 'dot', speed: 1.1, life: .5, size: .26, gravity: .02 };
  const count = reduced ? 3 : 7;
  spawnParticles(x, y, z, color, count, {
    speed: profile.speed * scale,
    life: profile.life,
    size: profile.size * scale,
    upward: kind === 'bloom' || kind === 'ward' ? .35 : .12,
    spread: TAU,
    gravity: profile.gravity,
    drag: .96,
    glow: 14,
    shape: profile.shape,
    trail: kind === 'fireball' || kind === 'chain' || kind === 'beam',
  });
}
function spawnAbilityTrailParticle(projectile) {
  if (!projectile?.ability || !projectile.abilityKind) return;
  const shape = projectile.abilityKind === 'fireball' ? 'ember' : projectile.abilityKind === 'chain' ? 'thread' : projectile.abilityKind === 'homing' ? 'star' : 'dot';
  spawnParticles(projectile.x, projectile.y, projectile.z, projectile.color, 1, { speed: .3, life: .28, size: .16, upward: .08, spread: projectile.abilityKind === 'chain' ? .55 : TAU, angle: Math.atan2(projectile.vy, projectile.vx), gravity: .12, drag: .95, glow: 9, shape, trail: true });
}
function updateParticles(delta) {
  const active = [];
  for (const particle of state.particles) {
    particle.life -= delta;
    if (particle.life <= 0) continue;
    particle.previousX = particle.x; particle.previousY = particle.y; particle.previousZ = particle.z;
    particle.vx *= Math.pow(particle.drag, delta * 60);
    particle.vy *= Math.pow(particle.drag, delta * 60);
    particle.vz -= particle.gravity * delta;
    particle.rotation += particle.spin * delta;
    particle.x += particle.vx * delta;
    particle.y += particle.vy * delta;
    particle.z += particle.vz * delta;
    if (particle.z < .015) { particle.z = .015; particle.vz *= -.24; particle.vx *= .84; particle.vy *= .84; }
    active.push(particle);
  }
  state.particles = active;
}
function drawParticles() {
  const combatActive = (state.now || 0) < (state.combatPerfUntil || 0);
  const normalLimit = Math.round(MAX_PARTICLE_DRAW * state.renderQuality);
  const drawLimit = settings.reducedMotion
    ? MAX_REDUCED_PARTICLE_DRAW
    : (combatActive ? Math.min(COMBAT_PARTICLE_DRAW_LIMIT, normalLimit) : normalLimit);
  let drawn = 0;
  for (const particle of state.particles) {
    if (drawn >= drawLimit) break;
    const camera = cameraPoint(particle.x, particle.y, particle.z);
    if (camera.forward <= .04 || Math.abs(Math.atan2(camera.side, camera.forward)) > cameraFov() * .95) continue;
    const point = projectCameraPoint(camera);
    if (!point) continue;
    const ray = clamp(Math.floor(point.x / canvas.width * RAY_COUNT), 0, RAY_COUNT - 1);
    if (camera.forward > state.zBuffer[ray] + .05) continue;
    const fade = clamp(particle.life / particle.maxLife, 0, 1);
    const radius = Math.max(.7, canvas.height * .008 * particle.size / Math.max(.7, camera.forward));
    const rgb = hexToRgb(particle.color);
    drawn += 1;
    ctx.save();
    ctx.globalAlpha = fade * .9;
    ctx.fillStyle = rgba(rgb, fade);
    ctx.strokeStyle = rgba(rgb, fade * .8);
    // Canvas shadowBlur is disproportionately expensive on macOS browsers.
    // Keep it for authored high-impact particles, not ordinary combat debris.
    ctx.shadowBlur = combatActive ? 0 : particle.glow * fade;
    ctx.shadowColor = particle.color;
    if (particle.trail) {
      const previous = projectCameraPoint(cameraPoint(particle.previousX, particle.previousY, particle.previousZ));
      if (previous) { ctx.lineWidth = Math.max(1, radius * .65); ctx.beginPath(); ctx.moveTo(previous.x, previous.y); ctx.lineTo(point.x, point.y); ctx.stroke(); }
    }
    if (particle.shape === 'pixel') {
      ctx.shadowBlur = 0;
      const pixelSize = Math.max(2, Math.round(radius * 1.35));
      const pixelX = Math.round(point.x - pixelSize / 2);
      const pixelY = Math.round(point.y - pixelSize / 2);
      ctx.fillRect(pixelX, pixelY, pixelSize, pixelSize);
    } else if (particle.shape === 'dot') {
      ctx.beginPath(); ctx.arc(point.x, point.y, radius, 0, TAU); ctx.fill();
    } else if (particle.shape === 'ring') {
      ctx.lineWidth = Math.max(1, radius * .42);
      ctx.beginPath(); ctx.arc(point.x, point.y, Math.max(2, radius * 1.65), 0, TAU); ctx.stroke();
    } else if (particle.shape === 'star') {
      ctx.translate(point.x, point.y); ctx.rotate(particle.rotation);
      ctx.beginPath();
      for (let pointIndex = 0; pointIndex < 8; pointIndex += 1) {
        const angle = pointIndex * Math.PI / 4;
        const length = pointIndex % 2 ? radius * .52 : radius * 1.9;
        const x = Math.cos(angle) * length;
        const y = Math.sin(angle) * length;
        if (pointIndex === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.fill();
    } else if (particle.shape === 'rune') {
      ctx.translate(point.x, point.y); ctx.rotate(particle.rotation * .45);
      ctx.lineWidth = Math.max(1, radius * .34);
      ctx.beginPath();
      for (let pointIndex = 0; pointIndex < 6; pointIndex += 1) {
        const angle = pointIndex * TAU / 6;
        const x = Math.cos(angle) * radius * 1.35;
        const y = Math.sin(angle) * radius * 1.35;
        if (pointIndex === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-radius * .7, 0); ctx.lineTo(radius * .7, 0); ctx.moveTo(0, -radius * .7); ctx.lineTo(0, radius * .7); ctx.stroke();
    } else if (particle.shape === 'petal') {
      ctx.translate(point.x, point.y); ctx.rotate(particle.rotation);
      ctx.beginPath(); ctx.ellipse(0, 0, radius * .6, radius * 1.9, 0, 0, TAU); ctx.fill();
    } else if (particle.shape === 'ember') {
      ctx.translate(point.x, point.y); ctx.rotate(Math.atan2(particle.vy, particle.vx) + Math.PI / 2);
      ctx.beginPath(); ctx.moveTo(0, -radius * 2.1); ctx.quadraticCurveTo(radius * 1.35, -radius * .35, 0, radius * 1.35); ctx.quadraticCurveTo(-radius * 1.2, -radius * .3, 0, -radius * 2.1); ctx.closePath(); ctx.fill();
    } else if (particle.shape === 'thread') {
      ctx.translate(point.x, point.y); ctx.rotate(Math.atan2(particle.vy, particle.vx));
      ctx.lineWidth = Math.max(1, radius * .45); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-radius * 2.2, 0); ctx.quadraticCurveTo(0, radius * 1.2, radius * 2.2, 0); ctx.stroke();
    } else {
      ctx.translate(point.x, point.y);
      ctx.rotate(Math.atan2(particle.vy, particle.vx));
      ctx.beginPath(); ctx.moveTo(radius * 1.9, 0); ctx.lineTo(0, radius * .55); ctx.lineTo(-radius * 1.9, 0); ctx.lineTo(0, -radius * .55); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
}
const MUSIC_PATTERNS = {
  dungeon: {
    // Fast, low-tuned death-metal pulse: palm-muted riffs, blast beats, and
    // dissonant tritone movement instead of a melodic/chiptune loop.
    tempo: 156,
    roots: [41.2, 38.9, 36.7, 34.65],
    riffs: [
      [0, 0, 0, -1, 0, 0, 3, 0, 0, 0, -4, 0, 0, 1, 0, -1],
      [0, 0, 3, 0, 0, -1, 0, 0, 0, 0, 6, 0, 0, -1, 0, 0],
      [0, -1, 0, 0, 3, 0, 0, -4, 0, 0, 0, -1, 0, 3, 0, 0],
    ],
    boss: false,
  },
  boss: {
    tempo: 178,
    roots: [36.7, 34.65, 32.7, 29.1],
    riffs: [
      [0, 0, -1, 0, 0, 3, 0, -4, 0, 0, -1, 0, 0, 6, 0, -4],
      [0, 3, 0, -1, 0, 0, 6, 0, 0, -4, 0, 3, 0, -1, 0, -6],
    ],
    boss: true,
  },
};
const music = { enabled: true, playing: false, timer: 0, nextTime: 0, step: 0, mode: 'dungeon', ambientSource: null, ambientGain: null, ambientFilter: null, usingProceduralFallback: false };
const AUDIO_ASSETS = Object.freeze({
  rifle: 'assets/audio/arsenal-cz-single.wav',
  shotgun: 'assets/audio/shotgun-blast.wav',
  shotgunShellFirst: 'assets/audio/shotgun-shell-first.mp3',
  shotgunShell: 'assets/audio/shotgun-shell.mp3',
  bfgElectric: 'assets/audio/bfg-electric.mp3',
  musicTrack: 'assets/audio/heavy-boss-battle-2.ogg',
  bossMusicTrack: 'assets/audio/boss-battle-6-metal-v1.wav',
  dungeonAmbient: 'assets/audio/dungeon-ambient.ogg',
});
const audioBuffers = new Map();
const audioBufferPromises = new Map();
function ensureAudioContext() {
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume?.();
    return audioContext;
  } catch {
    return null;
  }
}
function loadAudioBuffer(key) {
  const audio = ensureAudioContext();
  const source = AUDIO_ASSETS[key];
  if (!audio || !source) return Promise.resolve(null);
  if (audioBuffers.has(key)) return Promise.resolve(audioBuffers.get(key));
  if (audioBufferPromises.has(key)) return audioBufferPromises.get(key);
  const promise = fetch(source)
    .then((response) => {
      if (!response.ok) throw new Error(`Audio asset failed: ${response.status}`);
      return response.arrayBuffer();
    })
    .then((data) => audio.decodeAudioData(data))
    .then((buffer) => {
      audioBuffers.set(key, buffer);
      return buffer;
    })
    .catch(() => null);
  audioBufferPromises.set(key, promise);
  return promise;
}
function preloadAudioAssets() {
  for (const key of Object.keys(AUDIO_ASSETS)) loadAudioBuffer(key);
}
function playAudioBuffer(key, volume = .4, options = {}) {
  const audio = ensureAudioContext();
  if (!audio) return false;
  const buffer = audioBuffers.get(key);
  if (!buffer) {
    loadAudioBuffer(key);
    return false;
  }
  try {
    const source = audio.createBufferSource();
    const preFilter = audio.createBiquadFilter();
    const roomFilter = audio.createBiquadFilter();
    const compressor = audio.createDynamicsCompressor();
    const dryGain = audio.createGain();
    const roomGain = audio.createGain();
    const delay = audio.createDelay(.12);
    const delayFilter = audio.createBiquadFilter();
    const stereo = audio.createStereoPanner ? audio.createStereoPanner() : null;
    const start = audio.currentTime + Math.max(0, options.offset || 0);
    source.buffer = buffer;
    source.playbackRate.value = options.playbackRate || 1;
    preFilter.type = 'highpass';
    preFilter.frequency.value = options.highpass || 55;
    roomFilter.type = 'lowpass';
    roomFilter.frequency.value = options.lowpass || 8600;
    roomFilter.Q.value = .28;
    compressor.threshold.value = -18;
    compressor.knee.value = 12;
    compressor.ratio.value = 3.2;
    compressor.attack.value = .004;
    compressor.release.value = .16;
    delay.delayTime.value = options.roomDelay || .055;
    delayFilter.type = 'lowpass';
    delayFilter.frequency.value = 2400;
    const pan = options.pan ?? clamp((Math.sin(state.player.angle) * .05), -.12, .12);
    if (stereo) stereo.pan.value = pan;
    dryGain.gain.setValueAtTime(Math.max(.0001, volume * settings.sfxVolume), start);
    roomGain.gain.setValueAtTime(Math.max(.0001, volume * settings.sfxVolume * (options.roomMix || .18)), start);
    source.connect(preFilter).connect(roomFilter).connect(compressor);
    compressor.connect(dryGain);
    compressor.connect(delay).connect(delayFilter).connect(roomGain);
    if (stereo) { dryGain.connect(stereo); roomGain.connect(stereo); stereo.connect(audio.destination); }
    else { dryGain.connect(audio.destination); roomGain.connect(audio.destination); }
    source.start(start, Math.max(0, options.startAt || 0));
    return true;
  } catch {
    return false;
  }
}
function ambientTrackKey() {
  return music.mode === 'boss' ? 'bossMusicTrack' : 'musicTrack';
}
function startAmbientTrack() {
  const audio = ensureAudioContext();
  if (!audio || !music.enabled) return;
  const key = ambientTrackKey();
  if (music.ambientSource && music.ambientKey === key) return;
  const previousSource = music.ambientSource;
  const previousGain = music.ambientGain;
  const fadeDuration = music.mode === 'boss' ? .9 : .7;
  const buffer = audioBuffers.get(key);
  if (!buffer) {
    loadAudioBuffer(key).then((loaded) => {
      if (!music.playing || !music.enabled || ambientTrackKey() !== key) return;
      if (loaded) startAmbientTrack();
      else {
        music.usingProceduralFallback = true;
        musicScheduler();
      }
    });
    return;
  }
  music.usingProceduralFallback = false;
  try {
    const source = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();
    const start = audio.currentTime;
    const targetVolume = (music.mode === 'boss' ? .5 : .42) * settings.musicVolume;
    source.buffer = buffer;
    source.loop = true;
    filter.type = 'lowpass';
    filter.frequency.value = music.mode === 'boss' ? 7600 : 9800;
    filter.Q.value = .18;
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.linearRampToValueAtTime(Math.max(.0001, targetVolume), start + fadeDuration);
    source.connect(filter).connect(gain).connect(audio.destination);
    source.start(start);
    source.onended = () => {
      if (music.ambientSource === source) {
        music.ambientSource = null;
        music.ambientGain = null;
        music.ambientFilter = null;
        music.ambientKey = null;
      }
    };
    if (previousSource && previousGain) {
      previousGain.gain.cancelScheduledValues(start);
      previousGain.gain.setTargetAtTime(.0001, start, Math.max(.05, fadeDuration / 4));
      try { previousSource.stop(start + fadeDuration + .08); } catch { /* Already stopped. */ }
    }
    music.ambientSource = source;
    music.ambientGain = gain;
    music.ambientFilter = filter;
    music.ambientKey = key;
  } catch { /* Optional browser audio. */ }
}
function stopAmbientTrack(fadeDuration = 0) {
  if (!music.ambientSource) return;
  const source = music.ambientSource;
  const gain = music.ambientGain;
  const filter = music.ambientFilter;
  try {
    const audio = ensureAudioContext();
    const stopAt = audio.currentTime + Math.max(0, fadeDuration);
    if (gain && fadeDuration > 0) {
      gain.gain.cancelScheduledValues(audio.currentTime);
      gain.gain.setTargetAtTime(.0001, audio.currentTime, Math.max(.05, fadeDuration / 4));
    }
    source.stop(stopAt + .08);
    window.setTimeout(() => {
      try { source.disconnect(); gain?.disconnect(); filter?.disconnect(); } catch { /* Already disconnected. */ }
    }, (fadeDuration + .15) * 1000);
  } catch { /* Already stopped. */ }
  music.ambientSource = null;
  music.ambientGain = null;
  music.ambientFilter = null;
  music.ambientKey = null;
}
function scheduleMetalGuitar(frequency, time, duration, volume = .035, detune = 0) {
  const audio = ensureAudioContext();
  if (!audio || !frequency) return;
  const oscillator = audio.createOscillator();
  const second = audio.createOscillator();
  const shaper = audio.createWaveShaper();
  const filter = audio.createBiquadFilter();
  const gain = audio.createGain();
  const curve = new Float32Array(256);
  for (let index = 0; index < curve.length; index += 1) {
    const x = index * 2 / (curve.length - 1) - 1;
    curve[index] = Math.tanh(x * 5.5);
  }
  oscillator.type = 'sawtooth';
  second.type = 'square';
  oscillator.frequency.setValueAtTime(frequency, time);
  second.frequency.setValueAtTime(frequency * 1.003, time);
  oscillator.detune.value = detune - 5;
  second.detune.value = detune + 5;
  shaper.curve = curve;
  shaper.oversample = '2x';
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1900, time);
  filter.frequency.exponentialRampToValueAtTime(720, time + duration * .8);
  filter.Q.value = .8;
  gain.gain.setValueAtTime(.0001, time);
  gain.gain.exponentialRampToValueAtTime(Math.max(.0001, volume * settings.musicVolume), time + .006);
  gain.gain.setValueAtTime(Math.max(.0001, volume * settings.musicVolume * .62), time + duration * .58);
  gain.gain.exponentialRampToValueAtTime(.0001, time + duration);
  oscillator.connect(shaper);
  second.connect(shaper);
  shaper.connect(filter).connect(gain).connect(audio.destination);
  oscillator.start(time);
  second.start(time);
  oscillator.stop(time + duration + .03);
  second.stop(time + duration + .03);
}
function scheduleMetalBass(frequency, time, duration, volume = .045) {
  scheduleMetalGuitar(frequency, time, duration, volume, -12);
}
function scheduleMetalKick(time, volume = .07) {
  const audio = ensureAudioContext();
  if (!audio) return;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(142, time);
  oscillator.frequency.exponentialRampToValueAtTime(43, time + .13);
  gain.gain.setValueAtTime(.0001, time);
  gain.gain.exponentialRampToValueAtTime(volume * settings.musicVolume, time + .003);
  gain.gain.exponentialRampToValueAtTime(.0001, time + .18);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(time);
  oscillator.stop(time + .2);
}
function scheduleMetalSnare(time, volume = .055) {
  const audio = ensureAudioContext();
  if (!audio) return;
  const length = Math.floor(audio.sampleRate * .16);
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) data[index] = (Math.random() * 2 - 1) * Math.pow(1 - index / length, 2.1);
  const source = audio.createBufferSource();
  const filter = audio.createBiquadFilter();
  const gain = audio.createGain();
  filter.type = 'bandpass';
  filter.frequency.value = 1850;
  filter.Q.value = .65;
  gain.gain.setValueAtTime(volume * settings.musicVolume, time);
  gain.gain.exponentialRampToValueAtTime(.0001, time + .16);
  source.buffer = buffer;
  source.connect(filter).connect(gain).connect(audio.destination);
  source.start(time);
  source.stop(time + .18);
}
function scheduleMetalHat(time, volume = .018) {
  const audio = ensureAudioContext();
  if (!audio) return;
  const length = Math.floor(audio.sampleRate * .045);
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) data[index] = (Math.random() * 2 - 1) * Math.pow(1 - index / length, 3.2);
  const source = audio.createBufferSource();
  const filter = audio.createBiquadFilter();
  const gain = audio.createGain();
  filter.type = 'highpass';
  filter.frequency.value = 4600;
  gain.gain.value = volume * settings.musicVolume;
  source.buffer = buffer;
  source.connect(filter).connect(gain).connect(audio.destination);
  source.start(time);
  source.stop(time + .055);
}
function scheduleMusicStep(time, step, mode, stepDuration) {
  const pattern = MUSIC_PATTERNS[mode] || MUSIC_PATTERNS.dungeon;
  const bar = Math.floor(step / 16);
  const subdivision = step % 16;
  const root = pattern.roots[bar % pattern.roots.length];
  const riff = pattern.riffs[bar % pattern.riffs.length];
  const note = riff[subdivision];
  if (note !== null && note !== undefined) {
    const frequency = root * Math.pow(2, note / 12);
    scheduleMetalGuitar(frequency, time, stepDuration * .82, pattern.boss ? .045 : .034);
    if (subdivision === 0 || (pattern.boss && subdivision === 8)) scheduleMetalBass(frequency / 2, time, stepDuration * 1.45, pattern.boss ? .052 : .04);
  }
  if (subdivision % 2 === 0) scheduleMetalHat(time, pattern.boss ? .024 : .018);
  if (subdivision === 0 || subdivision === 3 || subdivision === 8 || subdivision === 11) scheduleMetalKick(time, pattern.boss ? .095 : .075);
  if (subdivision === 4 || subdivision === 12 || (pattern.boss && subdivision % 2 === 1)) scheduleMetalSnare(time, pattern.boss ? .075 : .058);
  if (subdivision === 7 || subdivision === 15) scheduleMetalSnare(time, pattern.boss ? .06 : .035);
}
function musicScheduler() {
  const audio = ensureAudioContext();
  if (!music.playing || !music.enabled || !audio || !music.usingProceduralFallback) return;
  const pattern = MUSIC_PATTERNS[music.mode] || MUSIC_PATTERNS.dungeon;
  const stepDuration = 60 / pattern.tempo / 4;
  while (music.nextTime < audio.currentTime + .24) {
    scheduleMusicStep(music.nextTime, music.step, music.mode, stepDuration);
    music.nextTime += stepDuration;
    music.step += 1;
  }
  music.timer = window.setTimeout(musicScheduler, 45);
}
function updateMusicButton() {
  if (!musicButton) return;
  musicButton.textContent = music.enabled ? '♫' : '×♫';
  musicButton.setAttribute('aria-label', music.enabled ? 'Mute atmospheric soundtrack' : 'Enable atmospheric soundtrack');
  musicButton.title = music.enabled ? 'Mute atmospheric soundtrack' : 'Enable atmospheric soundtrack';
  musicButton.classList.toggle('music-active', music.enabled && music.playing);
  musicButton.setAttribute('aria-pressed', String(music.enabled));
}
function startMusic() {
  if (!music.enabled) return;
  const audio = ensureAudioContext();
  if (!audio) return;
  music.playing = true;
  music.nextTime = audio.currentTime + .05;
  music.step = 0;
  window.clearTimeout(music.timer);
  music.timer = 0;
  music.usingProceduralFallback = false;
  preloadAudioAssets();
  startAmbientTrack();
  updateMusicButton();
}
function stopMusic() {
  music.playing = false;
  window.clearTimeout(music.timer);
  music.timer = 0;
  stopAmbientTrack();
  updateMusicButton();
}
function setMusicMode(mode) {
  if (!MUSIC_PATTERNS[mode]) return;
  if (music.mode === mode && (!music.playing || music.ambientKey === ambientTrackKey())) return;
  music.mode = mode;
  music.step = 0;
  if (music.playing) startMusic();
}
function toggleMusic() {
  music.enabled = !music.enabled;
  if (music.enabled) startMusic(); else stopMusic();
  updateMusicButton();
}

function playTrapdoorSound() {
  playLowThump(30, .55, .05);
  playNoiseSweep(.62, .032, 'lowpass', 520, 58, .16, .55);
  playMetallicAction(2.1, .016);
}
function playLaunchSound() {
  playNoiseSweep(.42, .014, 'lowpass', 360, 90, 0, .6);
  playLowThump(48, .34, .022, .12);
}
function beginLaunchTransition() {
  // The field opens directly now. Keep this compatibility hook because the
  // menu flow still calls it, but never block input or replay the old veil.
  state.launchTransition = null;
  state.keys.clear();
  state.mouseAttack = false;
  state.mouseLook = false;
  state.promptSignature = '';
  gameShell.classList.remove('game-launching');
}
function updateLaunchTransition(delta) {
  if (!state.launchTransition) return;
  state.launchTransition.elapsed += delta;
  if (state.launchTransition.elapsed >= state.launchTransition.duration) {
    state.launchTransition = null;
    gameShell.classList.remove('game-launching');
    // The lobby is immediately playable after the entrance animation.
  }
}
function drawLaunchTransition(now) {
  const transition = state.launchTransition;
  if (!transition) return;
  const progress = clamp(transition.elapsed / transition.duration, 0, 1);
  const opening = smoothstep(.05, .78, progress);
  const veil = 1 - smoothstep(.56, 1, progress);
  const titleFade = 1 - smoothstep(.24, .64, progress);
  const width = canvas.width;
  const height = canvas.height;
  const centerX = width * .5;
  const centerY = height * (.52 + Math.sin(now / 420) * .008);
  const portalRadius = Math.max(width, height) * (.045 + opening * .74);
  ctx.save();
  ctx.fillStyle = `rgba(6, 3, 3, ${.97 - opening * .42})`;
  ctx.fillRect(0, 0, width, height);

  // A fixed red moon-glow and expanding rune gate carry the visitor from the
  // parchment landing page into the first room.
  const glow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, portalRadius * 1.2);
  glow.addColorStop(0, `rgba(221, 71, 50, ${.16 + opening * .2})`);
  glow.addColorStop(.38, `rgba(164, 38, 31, ${.08 + opening * .12})`);
  glow.addColorStop(1, 'rgba(9, 4, 3, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.translate(centerX, centerY);
  ctx.rotate(progress * .22);
  ctx.globalAlpha = (.2 + opening * .72) * (1 - veil * .22);
  for (let ring = 0; ring < 4; ring += 1) {
    const radius = portalRadius * (1 - ring * .105);
    ctx.save();
    ctx.rotate((ring % 2 ? -1 : 1) * progress * (1.1 + ring * .18));
    ctx.strokeStyle = ring === 0 ? '#e7ad67' : ring === 1 ? '#db5546' : '#8d4738';
    ctx.shadowBlur = 18 + ring * 5;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.lineWidth = Math.max(1, height * (.0022 + ring * .0007));
    ctx.setLineDash([Math.max(8, radius * .08), Math.max(5, radius * .035)]);
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(12, radius), ring * .32, TAU - ring * .24);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
  const runeRadius = Math.max(16, portalRadius * .72);
  ctx.globalAlpha = opening * .72;
  ctx.strokeStyle = '#f0d49b';
  ctx.lineWidth = Math.max(1, height * .002);
  for (let rune = 0; rune < 8; rune += 1) {
    const angle = rune * TAU / 8 + progress * (rune % 2 ? -.35 : .35);
    const inner = runeRadius * .83;
    const outer = runeRadius * (1 + .045 * Math.sin(now / 180 + rune));
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.globalAlpha = titleFade * .88;
  ctx.fillStyle = '#f0ddaf';
  ctx.shadowBlur = 24;
  ctx.shadowColor = '#b93d32';
  ctx.font = `bold ${Math.max(17, height * .038)}px Georgia`;
  ctx.fillText('LIAM HOSFELD', centerX, height * .42);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = titleFade * .58;
  ctx.fillStyle = '#cfad70';
  ctx.font = `${Math.max(9, height * .015)}px Georgia`;
  ctx.fillText('THE OPERATIONS DUNGEON', centerX, height * .5);
  ctx.globalAlpha = (1 - opening) * .7;
  ctx.fillStyle = '#e7ad67';
  ctx.font = `${Math.max(9, height * .014)}px Georgia`;
  ctx.fillText('OPENING THE CASE STUDY', centerX, height * .59);
  ctx.restore();

  // Pixel bars make the final wipe feel intentional without using DOM effects.
  ctx.save();
  ctx.globalAlpha = .1 + veil * .18;
  for (let y = 0; y < height; y += 7) ctx.fillRect(0, y, width, 1);
  ctx.globalAlpha = .3 * (1 - opening);
  const wipeWidth = width * (1 - opening);
  ctx.fillStyle = '#070403';
  ctx.fillRect(0, 0, wipeWidth * .5, height);
  ctx.fillRect(width - wipeWidth * .5, 0, wipeWidth * .5, height);
  ctx.restore();
}

function setCinematicUi(phase = '') {
  if (!gameShell) return;
  gameShell.classList.toggle('cinematic-dialogue', phase === 'dialogue');
  gameShell.classList.toggle('cinematic-reveal', phase === 'reveal');
  gameShell.classList.toggle('cinematic-flicker', phase === 'flicker');
  gameShell.classList.toggle('cinematic-hud', phase === 'hud');
}
function saveCinematicHome() {
  return { x: state.player.x, y: state.player.y, angle: state.player.angle, room: state.room };
}
function restoreCinematicHome(home) {
  if (!home) return;
  state.player.x = home.x;
  state.player.y = home.y;
  state.player.angle = home.angle;
  state.room = home.room;
}

function cinematicActive() {
  return Boolean(
    state.levelPreview
      || state.routeOverview
      || state.forestTransition
      || state.transition
      || state.miniBossCutscene
      || state.launchTransition
      || state.cinematicCamera?.active,
  );
}
function firstMiniBossRoomIndex() {
  const encounter = MINI_BOSS_ENCOUNTERS[0];
  const index = rooms.findIndex((room) => room.id === encounter?.roomId);
  return index >= STARTING_ROOM_INDEX ? index : Math.min(FINAL_ROOM_INDEX - 1, STARTING_ROOM_INDEX + 1);
}
function firstMiniBossDefeated() {
  const roomIndex = firstMiniBossRoomIndex();
  return !worldEnemies.some((enemy) => enemy.roomIndex === roomIndex && enemy.miniBoss && !enemy.dead);
}
function levelPreviewRooms() {
  const destination = firstMiniBossRoomIndex();
  return rooms
    .map((room, index) => ({ room, index }))
    .filter(({ index }) => index >= STARTING_ROOM_INDEX && index <= destination);
}
function cinematicOpenCell(x, y) { const ix = Math.floor(x); const iy = Math.floor(y); return iy >= 0 && iy < WORLD_HEIGHT && ix >= 0 && ix < WORLD_WIDTH && worldMap[iy][ix] !== '1'; }
function cinematicPath(startPoint, endPoint) {
  const start = { x: Math.floor(startPoint.x), y: Math.floor(startPoint.y) };
  const goal = { x: Math.floor(endPoint.x), y: Math.floor(endPoint.y) };
  if (!cinematicOpenCell(start.x, start.y) || !cinematicOpenCell(goal.x, goal.y)) return [];
  const queue = [start];
  const previous = new Map([[`${start.x},${start.y}`, null]]);
  let head = 0;
  let reached = start.x === goal.x && start.y === goal.y;
  while (head < queue.length && queue.length < 18000 && !reached) {
    const current = queue[head++];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const next = { x: current.x + dx, y: current.y + dy };
      const key = `${next.x},${next.y}`;
      if (!cinematicOpenCell(next.x, next.y) || previous.has(key)) continue;
      previous.set(key, current);
      queue.push(next);
      if (next.x === goal.x && next.y === goal.y) { reached = true; break; }
    }
  }
  if (!reached) return [];
  const path = [];
  let cursor = goal;
  while (cursor) {
    path.push({ x: cursor.x + .5, y: cursor.y + .5 });
    cursor = previous.get(`${cursor.x},${cursor.y}`);
  }
  return path.reverse();
}
function cinematicSegmentClear(a, b) {
  const distance = Math.hypot(b.x - a.x, b.y - a.y);
  const steps = Math.max(2, Math.ceil(distance / .18));
  for (let index = 1; index < steps; index += 1) {
    const t = index / steps;
    if (!cinematicOpenCell(lerp(a.x, b.x, t), lerp(a.y, b.y, t))) return false;
  }
  return true;
}
function smoothCinematicRoute(route) {
  if (!route || route.length < 3) return route;
  const simplified = [route[0]];
  let anchor = 0;
  while (anchor < route.length - 1) {
    let furthest = anchor + 1;
    for (let candidate = anchor + 2; candidate < route.length; candidate += 1) {
      if (cinematicSegmentClear(route[anchor], route[candidate])) furthest = candidate;
      else break;
    }
    simplified.push(route[furthest]);
    anchor = furthest;
  }
  return simplified;
}
function buildCinematicRoute(home, previewRooms) {
  // The opening take ends at the first mini-boss. Every segment is generated
  // from the live worldMap, so the camera follows the same connected cells as
  // the player and never uses a wall-crossing fallback.
  const targets = [{ x: home.x, y: home.y }];
  for (const entry of previewRooms) {
    const point = roomContentPoint(entry.index, rooms[entry.index].spawn.x, rooms[entry.index].spawn.y);
    targets.push({ x: roomOffsets[entry.index] + point.x, y: point.y });
  }
  const route = [];
  for (let index = 0; index < targets.length - 1; index += 1) {
    const section = cinematicPath(targets[index], targets[index + 1]);
    if (section.length < 2) continue;
    if (route.length) section.shift();
    route.push(...section);
  }
  return smoothCinematicRoute(route.length > 1 ? route : [{ x: home.x, y: home.y }]);
}
function buildSanctuaryCinematicRoute() {
  const spawn = roomContentPoint(SANCTUARY_ROOM_INDEX, rooms[SANCTUARY_ROOM_INDEX].spawn.x, rooms[SANCTUARY_ROOM_INDEX].spawn.y);
  const start = { x: SANCTUARY_ROOM_OFFSET + spawn.x, y: spawn.y };
  const pedestalApproach = { x: SANCTUARY_RESUME_PEDESTAL.x - 2.8, y: SANCTUARY_RESUME_PEDESTAL.y };
  const route = cinematicPath(start, pedestalApproach);
  return smoothCinematicRoute(route.length > 1 ? route : [start]);
}
function cinematicRouteDistances(route) {
  if (!route || route.length < 2) return [0];
  const distances = [0];
  for (let index = 1; index < route.length; index += 1) {
    distances[index] = distances[index - 1] + Math.hypot(route[index].x - route[index - 1].x, route[index].y - route[index - 1].y);
  }
  return distances;
}
function sampleCinematicRoute(route, progress) {
  if (!route?.length) return { x: state.player.x, y: state.player.y, angle: state.player.angle };
  if (route.length === 1) return { ...route[0], angle: state.player.angle };
  const distances = route._distances || (route._distances = cinematicRouteDistances(route));
  const total = distances[distances.length - 1] || 1;
  // Ease only the speed, never the route itself. The camera therefore remains
  // in walkable cells while gaining a deliberate push-in/push-out cadence.
  const eased = smoothstep(.02, .98, clamp(progress, 0, 1));
  const distance = eased * total;
  let index = 1;
  while (index < distances.length && distances[index] < distance) index += 1;
  const previous = route[Math.max(0, index - 1)];
  const next = route[Math.min(route.length - 1, index)];
  const span = Math.max(.001, distances[index] - distances[index - 1]);
  const local = clamp((distance - distances[index - 1]) / span, 0, 1);
  const lookIndex = Math.min(route.length - 1, index + Math.max(3, Math.round(route.length * .035)));
  const look = route[lookIndex];
  return {
    x: lerp(previous.x, next.x, local),
    y: lerp(previous.y, next.y, local),
    angle: Math.atan2(look.y - previous.y, look.x - previous.x),
  };
}
function setCinematicCamera(point, options={}) { const previous=state.cinematicCamera||{}; state.cinematicCamera={active:true,x:point.x,y:point.y,angle:point.angle??previous.angle??state.player.angle,pitch:options.pitch??previous.pitch??0,roll:options.roll??previous.roll??0,fovKick:options.fovKick??previous.fovKick??0}; }
function clearCinematicCamera() { state.cinematicCamera=null; }
function previewBootElapsed(preview) {
  return Math.max(0, preview.elapsed - (preview.elevatorDuration || 0));
}
function visorTutorialComplete() {
  const tutorial = state.visorTutorial;
  return Boolean(tutorial?.look && tutorial?.fire && tutorial?.weapon);
}
function updateVisorTutorialFeed(preview = state.levelPreview) {
  const tutorial = state.visorTutorial;
  if (!tutorial) return;
  const bootElapsed = preview ? previewBootElapsed(preview) : Infinity;
  const scheduledStep = preview
    ? preview.elapsed < (preview.elevatorDuration || 0) ? 'look'
      : bootElapsed < (preview.weaponDuration || 0) ? 'fire'
        : 'weapon'
    : null;
  const firstIncomplete = ['look', 'fire', 'weapon'].find((key) => !tutorial[key]) || null;
  const activeStep = scheduledStep && !tutorial[scheduledStep] ? scheduledStep : firstIncomplete;
  tutorial.step = activeStep;
  const labels = {
    look: preview
      ? tutorial.mouseEngaged ? ' MOUSE LINK ..... ENGAGED / HOLD HEADING' : ' MOUSE LINK ..... CLICK TO ENGAGE'
      : ' LOOK ........ MOVE MOUSE',
    fire: activeStep === 'fire' ? ' FIRE ........ PRIMARY CLICK' : ' FIRE ........ PRIMARY CLICK',
    weapon: activeStep === 'weapon' ? ' LOADOUT ..... PRESS 1–3 / SWITCH' : ' LOADOUT ..... PRESS 1–3',
  };
  for (const [key, line] of Object.entries(visorTutorialLines)) {
    if (!line) continue;
    const complete = Boolean(tutorial[key]);
    line.dataset.state = complete ? 'complete' : 'pending';
    line.dataset.current = String(!complete && key === activeStep);
    line.innerHTML = `<span aria-hidden="true">${complete ? '[✓]' : key === activeStep ? '[›]' : '[ ]'}</span>${labels[key]}`;
  }
  if (visorTrainingHint) {
    const hint = activeStep === 'look'
      ? preview
        ? tutorial.mouseEngaged ? 'INTRO CAMERA LOCKED / HOLD HEADING' : 'CLICK TO ENGAGE MOUSE / INTRO CAMERA LOCKED'
        : 'MOVE MOUSE TO CALIBRATE OPTICS'
      : activeStep === 'fire'
        ? 'PRIMARY CLICK TO TEST FIRE CONTROL'
        : activeStep === 'weapon'
          ? 'PRESS 1–3 TO CYCLE THE LOADOUT'
          : 'CONTROL LINK CONFIRMED';
    visorTrainingHint.textContent = hint;
  }
  if (visorTrainingFeed) {
    const complete = visorTutorialComplete();
    visorTrainingFeed.hidden = !tutorial.active || complete;
    visorTrainingFeed.dataset.complete = String(complete);
    visorTrainingFeed.dataset.phase = preview ? 'visor-startup' : 'combat';
    visorTrainingFeed.dataset.step = activeStep || 'complete';
  }
}
function markVisorTutorial(step) {
  const tutorial = state.visorTutorial;
  if (!tutorial || !Object.prototype.hasOwnProperty.call(tutorial, step) || tutorial[step]) return;
  tutorial[step] = true;
  updateVisorTutorialFeed(state.levelPreview);
  updateVisorBootFeed(state.levelPreview);
  if (visorTutorialComplete()) {
    tutorial.active = false;
    updateVisorTutorialFeed();
    showToast('VISOR CONTROLS CONFIRMED. COMBAT LINK ARMED.', 'good');
  }
}
function updateVisorBootFeed(preview) {
  if (!preview || !visorBootFeed) return;
  const bootElapsed = previewBootElapsed(preview);
  const progress = clamp(bootElapsed / Math.max(.01, preview.bootDuration || preview.duration), 0, 1);
  const tutorial = state.visorTutorial || {};
  const checksReady = visorTutorialComplete();
  const phases = {
    power: bootElapsed >= .35,
    optics: bootElapsed >= 1.25,
    motion: tutorial.look,
    range: tutorial.fire,
    threat: tutorial.weapon,
    combat: progress >= .9 && checksReady,
  };
  const values = {
    power: phases.power ? 'ONLINE' : 'STANDBY',
    optics: tutorial.mouseEngaged ? 'MOUSE LINK' : bootElapsed >= 1.25 ? 'ENGAGE MOUSE' : 'OFFLINE',
    motion: phases.motion ? 'LOOK PASS' : preview.phase === 'hud-flicker' ? 'MOVE MOUSE' : 'CAMERA LOCKED',
    range: phases.range ? 'FIRE PASS' : bootElapsed >= 4.1 ? 'PRIMARY CLICK' : 'WAITING',
    threat: phases.threat ? 'LOADOUT PASS' : bootElapsed >= 5.45 ? 'PRESS 1–3' : 'UNLINKED',
    combat: phases.combat ? 'READY' : progress >= .9 ? 'CHECKS PENDING' : 'LOCKED',
  };
  for (const [key, line] of Object.entries(visorFeedLines)) {
    if (!line) continue;
    const stateText = values[key] || 'WAITING';
    line.dataset.state = phases[key] ? 'complete' : 'pending';
    line.textContent = `${visorFeedPrefixes[key] || ''}${stateText}`;
  }
  const bootVisibility = 1 - smoothstep(.72, 1, progress);
  visorBootFeed.dataset.phase = preview.phase;
  visorBootFeed.style.setProperty('--feed-progress', progress.toFixed(3));
  visorBootFeed.style.setProperty('--boot-visibility', bootVisibility.toFixed(3));
  if (gameShell) gameShell.style.setProperty('--boot-hud-opacity', (1 - smoothstep(.64, .98, progress)).toFixed(3));
  if (visorTechFeed) {
    visorTechFeed.dataset.phase = preview.phase;
    visorTechFeed.style.setProperty('--boot-visibility', bootVisibility.toFixed(3));
    visorTechFeed.style.setProperty('--tech-scroll', `${(progress * 68).toFixed(2)}%`);
  }
}
function beginLevelPreview() {
  state.visorTutorial = { look: false, fire: false, weapon: false, active: true, step: 'look', mouseEngaged: false };
  state.levelPreview = {
    elapsed: 0,
    elevatorDuration: 6.2,
    bootDuration: 8.2,
    duration: 14.4,
    weaponDuration: 2.4,
    lookLeftDuration: 1.5,
    lookRightDuration: 1.5,
    hudFlickerDuration: 2.8,
    phase: 'elevator-approach',
    home: saveCinematicHome(),
  };
  updateVisorTutorialFeed(state.levelPreview);
  state.keys.clear();
  state.mouseAttack = false;
  state.weapon.mousePressed = false;
  state.attackInputLock = 0;
  state.mouseLook = false;
  hideNarratorPanel();
  state.narratorSignal = null;
  if (gameShell) {
    gameShell.classList.remove('hud-flicker-on');
    gameShell.classList.add('visor-boot-active');
  }
  if (visorBootFeed) visorBootFeed.hidden = false;
  if (visorTechFeed) visorTechFeed.hidden = false;
  updateVisorBootFeed(state.levelPreview);
  setCinematicCamera({ x: state.player.x, y: state.player.y, angle: state.player.angle }, { pitch: .055, fovKick: .035 });
  setCinematicUi('reveal');
}

function cinematicLookAt(shot, progress, fallback) {
  const beats = shot?.beats || [];
  if (!beats.length) return fallback;
  let previous = { ...fallback, progress: 0 };
  for (const beat of beats) {
    if (progress <= beat.progress) {
      const span = Math.max(.001, beat.progress - previous.progress);
      const local = smoothstep(0, 1, clamp((progress - previous.progress) / span, 0, 1));
      return { x: lerp(previous.x, beat.x, local), y: lerp(previous.y, beat.y, local), z: lerp(previous.z || .58, beat.z || .58, local) };
    }
    previous = beat;
  }
  return beats[beats.length - 1];
}
function aimCinematicCamera(camera, target, strength = .7) {
  if (!target) return camera;
  camera.angle = normalizeAngle(lerp(camera.angle, Math.atan2(target.y - camera.y, target.x - camera.x), strength));
  const distance = Math.max(.25, Math.hypot(target.x - camera.x, target.y - camera.y));
  camera.pitch = clamp(camera.pitch + Math.atan2((target.z || .58) - EYE_HEIGHT, distance) * .12, -.12, .12);
  return camera;
}

function updateLevelPreview(delta) {
  const preview = state.levelPreview;
  if (!preview) return;
  preview.elapsed += delta;
  const elevatorEnd = preview.elevatorDuration;
  const bootElapsed = previewBootElapsed(preview);
  const weaponEnd = preview.weaponDuration;
  const leftEnd = weaponEnd + preview.lookLeftDuration;
  const rightEnd = leftEnd + preview.lookRightDuration;
  const progress = clamp(preview.elapsed / preview.duration, 0, 1);
  const camera = { x: preview.home.x, y: preview.home.y, angle: preview.home.angle, pitch: .025 };

  if (state.visorTutorial?.active) updateVisorTutorialFeed(preview);

  if (preview.elapsed < elevatorEnd) {
    // Keep the logical player at the Threshold Chamber while the cinematic
    // camera moves through the visual lift and takes one deliberate step out.
    state.room = STARTING_ROOM_INDEX;
    preview.phase = preview.elapsed < .85 ? 'elevator-approach'
      : preview.elapsed < 1.75 ? 'elevator-close'
        : preview.elapsed < 3.05 ? 'elevator-travel'
          : preview.elapsed < 4.35 ? 'elevator-open'
            : 'elevator-step-out';
    const stepOut = smoothstep(4.35, elevatorEnd, preview.elapsed);
    const forward = stepOut * 1.45;
    camera.x += Math.cos(preview.home.angle) * forward;
    camera.y += Math.sin(preview.home.angle) * forward;
    camera.pitch = preview.phase === 'elevator-step-out'
      ? lerp(.012, -.006, stepOut)
      : lerp(.05, .018, smoothstep(0, 1, preview.elapsed / 4.35));
    camera.roll = Math.sin(preview.elapsed * 3.2) * .003 * (1 - stepOut);
  } else if (bootElapsed < weaponEnd) {
    preview.phase = 'weapon-lift';
    camera.pitch = lerp(.055, .012, smoothstep(0, 1, bootElapsed / weaponEnd));
  } else if (bootElapsed < leftEnd) {
    preview.phase = 'look-left';
    const local = clamp((bootElapsed - weaponEnd) / preview.lookLeftDuration, 0, 1);
    camera.angle = normalizeAngle(preview.home.angle - lerp(0, .62, smoothstep(0, 1, local)));
  } else if (bootElapsed < rightEnd) {
    preview.phase = 'look-right';
    const local = clamp((bootElapsed - leftEnd) / preview.lookRightDuration, 0, 1);
    camera.angle = normalizeAngle(preview.home.angle - .62 + lerp(0, 1.24, smoothstep(0, 1, local)));
  } else {
    preview.phase = 'hud-flicker';
    const local = clamp((bootElapsed - rightEnd) / preview.hudFlickerDuration, 0, 1);
    if (gameShell) gameShell.classList.toggle('hud-flicker-on', Math.floor(bootElapsed * 14) % 2 === 0 || local > .84);
  }

  setCinematicCamera(camera, {
    pitch: camera.pitch,
    roll: Math.sin(preview.elapsed * 2.1) * .006,
    fovKick: preview.phase === 'weapon-lift' ? .065 : .018,
  });
  setCinematicUi(preview.phase === 'hud-flicker' ? 'flicker' : 'reveal');
  updateVisorBootFeed(preview);

  if (progress >= 1) {
    // The intro owns the weapon pose. Drop every pending attack event before
    // restoring normal combat so a click during the cinematic cannot fire on
    // the first gameplay frame. A short handoff lock also covers the exact
    // frame in which the cinematic flag is cleared.
    state.mouseAttack = false;
    state.weapon.mousePressed = false;
    state.weapon.hit = false;
    state.weapon.swing = 0;
    state.weapon.cooldown = 0;
    state.weapon.muzzleFlash = 0;
    state.weapon.shotPulse = 0;
    state.weapon.shotTraces = [];
    state.attackInputLock = .18;
    restoreCinematicHome(preview.home);
    clearCinematicCamera();
    state.levelPreview = null;
    if (gameShell) {
      gameShell.classList.remove('hud-flicker-on', 'visor-boot-active');
      gameShell.style.removeProperty('--boot-hud-opacity');
    }
    if (visorBootFeed) visorBootFeed.hidden = true;
    if (visorTechFeed) visorTechFeed.hidden = true;
    updateVisorTutorialFeed(null);
    setCinematicUi('');
    announceNarrator(
      'mission-brief',
      'MISSION BRIEF',
      'MISSION ACTIVE. FOLLOW THE ROUTE.',
      'expression-command',
      10,
      { duration: 10, priority: 8, force: true, repeat: true },
    );
    updateHud();
    updateNarrator();
  }
}

function drawCinematicGrade(progress, accent, label, detail, now, fadeIn = 0, fadeOut = 0) {
  const width = canvas.width;
  const height = canvas.height;
  const introFade = fadeIn ? smoothstep(0, fadeIn, progress) : 1;
  const outroFade = fadeOut ? 1 - smoothstep(1 - fadeOut, 1, progress) : 1;
  const visibility = clamp(introFade * outroFade, 0, 1);
  const bar = Math.max(24, height * .078);
  ctx.save();
  ctx.fillStyle = `rgba(3, 2, 3, ${.92 * visibility})`;
  ctx.fillRect(0, 0, width, bar);
  ctx.fillRect(0, height - bar, width, bar);
  ctx.globalAlpha = visibility * .86;
  ctx.fillStyle = accent;
  ctx.fillRect(width * .045, bar * .76, width * .13, Math.max(2, height * .003));
  ctx.fillStyle = '#f1dfad';
  ctx.font = `700 ${Math.max(9, height * .014)}px "Courier New", monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, width * .045, bar * .43);
  ctx.globalAlpha = visibility * .64;
  ctx.fillStyle = accent;
  ctx.textAlign = 'right';
  ctx.fillText(detail, width * .955, bar * .43);
  ctx.globalAlpha = visibility * .36;
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(1, height * .0015);
  ctx.beginPath();
  ctx.moveTo(width * .5 - height * .035, height * .5);
  ctx.lineTo(width * .5 + height * .035, height * .5);
  ctx.moveTo(width * .5, height * .5 - height * .018);
  ctx.lineTo(width * .5, height * .5 + height * .018);
  ctx.stroke();
  const vignette = ctx.createRadialGradient(width * .5, height * .5, height * .18, width * .5, height * .5, Math.max(width, height) * .76);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(.72, `rgba(0,0,0,${.08 * visibility})`);
  vignette.addColorStop(1, `rgba(0,0,0,${.58 * visibility})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = visibility * .08;
  ctx.fillStyle = accent;
  for (let y = 0; y < height; y += Math.max(5, Math.round(height / 120))) ctx.fillRect(0, y, width, 1);
  ctx.restore();
}
function drawVisorBootOverlay(preview) {
  const width = canvas.width;
  const height = canvas.height;
  const progress = clamp(previewBootElapsed(preview) / Math.max(.01, preview.bootDuration || preview.duration), 0, 1);
  const active = preview.phase === 'hud-flicker';
  const flickerOn = gameShell?.classList.contains('hud-flicker-on');
  const accent = flickerOn ? '#b8ffcf' : '#55d6c1';
  const visibility = 1 - smoothstep(.72, 1, progress);
  const edge = Math.max(18, Math.min(width, height) * .055);
  const corner = Math.max(22, Math.min(width, height) * .085);

  ctx.save();
  // Only the perimeter is shaded. The world and center sightline remain clear.
  const visorEdge = ctx.createRadialGradient(width * .5, height * .5, height * .18, width * .5, height * .5, Math.max(width, height) * .76);
  visorEdge.addColorStop(0, 'rgba(0, 0, 0, 0)');
  visorEdge.addColorStop(.7, `rgba(2, 7, 9, ${.018 * visibility})`);
  visorEdge.addColorStop(1, `rgba(1, 4, 6, ${.68 * visibility})`);
  ctx.fillStyle = visorEdge;
  ctx.fillRect(0, 0, width, height);

  // Subtle visor corners remain visible during calibration, then fade with boot.
  ctx.globalAlpha = (.18 + (active && flickerOn ? .16 : 0)) * visibility;
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(1, height * .0015);
  ctx.beginPath();
  ctx.moveTo(edge, edge + corner); ctx.lineTo(edge, edge); ctx.lineTo(edge + corner, edge);
  ctx.moveTo(width - edge - corner, edge); ctx.lineTo(width - edge, edge); ctx.lineTo(width - edge, edge + corner);
  ctx.moveTo(edge, height - edge - corner); ctx.lineTo(edge, height - edge); ctx.lineTo(edge + corner, height - edge);
  ctx.moveTo(width - edge - corner, height - edge); ctx.lineTo(width - edge, height - edge); ctx.lineTo(width - edge, height - edge - corner);
  ctx.stroke();

  // A single low-opacity sweep gives the boot a hardware response without
  // covering the playfield with scanlines or a title card.
  const sweep = smoothstep(0, 1, clamp(progress / .82, 0, 1));
  ctx.globalAlpha = (.18 + (active && flickerOn ? .18 : 0)) * visibility;
  ctx.fillStyle = accent;
  const sweepY = edge + (height - edge * 2) * sweep;
  ctx.fillRect(edge, sweepY, width - edge * 2, Math.max(1, height * .0015));
  ctx.restore();
}
function drawIntroHypeOverlay(preview, now) {
  if (!preview) return;
  const width = canvas.width;
  const height = canvas.height;
  const progress = clamp(previewBootElapsed(preview) / Math.max(.01, preview.bootDuration || preview.duration), 0, 1);
  const weaponProgress = clamp(previewBootElapsed(preview) / Math.max(.01, preview.weaponDuration), 0, 1);
  const ready = smoothstep(.04, .96, weaponProgress);
  const fadeIn = smoothstep(.02, .16, progress);
  const fadeOut = 1 - smoothstep(.78, 1, progress);
  const visibility = clamp(fadeIn * (.42 + fadeOut * .58), 0, 1);
  const accent = ready > .82 ? '#b8ffcf' : '#55d6c1';
  const warm = ready > .82 ? '#f2b35e' : '#d76b49';
  const bar = Math.max(24, height * .075);
  const edge = Math.max(18, Math.min(width, height) * .045);
  const room = rooms[state.room] || rooms[STARTING_ROOM_INDEX];
  const phaseLabel = preview.phase === 'weapon-lift'
    ? 'WEAPON SYSTEM / ARMING'
    : preview.phase === 'look-left'
      ? 'SECTOR SWEEP / PORT'
      : preview.phase === 'look-right'
        ? 'SECTOR SWEEP / STARBOARD'
        : 'COMBAT LINK / LIVE';

  ctx.save();
  ctx.globalAlpha = visibility;
  ctx.fillStyle = `rgba(2, 4, 6, ${.72 + (1 - fadeOut) * .2})`;
  ctx.fillRect(0, 0, width, bar);
  ctx.fillRect(0, height - bar, width, bar);

  // Fast horizontal signal bars create a stronger entrance beat without a
  // full-screen title card.
  ctx.fillStyle = accent;
  ctx.globalAlpha = visibility * (.34 + ready * .28);
  ctx.fillRect(edge, bar * .78, width * (.16 + ready * .2), Math.max(2, height * .003));
  ctx.fillRect(width - edge - width * (.16 + ready * .2), height - bar * .78, width * (.16 + ready * .2), Math.max(2, height * .003));
  ctx.globalAlpha = visibility * .52;
  ctx.fillStyle = warm;
  ctx.fillRect(width * .5 - height * .08, bar * .78, height * .16, Math.max(1, height * .0015));

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#eafff5';
  ctx.font = `700 ${Math.max(10, height * .017)}px "DM Mono", monospace`;
  ctx.fillText('THE OPERATIONS DUNGEON', edge, bar * .37);
  ctx.fillStyle = accent;
  ctx.font = `600 ${Math.max(8, height * .011)}px "DM Mono", monospace`;
  ctx.fillText(`${room.level}  //  ${phaseLabel}`, edge, bar * .63);

  ctx.textAlign = 'right';
  ctx.fillStyle = warm;
  ctx.font = `700 ${Math.max(9, height * .013)}px "DM Mono", monospace`;
  ctx.fillText(ready > .82 ? 'READY // ENTER THE RUN' : 'VISOR CALIBRATION', width - edge, bar * .37);
  ctx.fillStyle = accent;
  ctx.font = `600 ${Math.max(8, height * .011)}px "DM Mono", monospace`;
  ctx.fillText(`${String(Math.round(progress * 100)).padStart(3, '0')}%  //  ${room.shortTitle.toUpperCase()}`, width - edge, bar * .63);

  // Weapon-ready impact: a brief bright pulse at the moment the rifle locks.
  const readyHit = smoothstep(.68, .88, weaponProgress) * (1 - smoothstep(.88, 1, weaponProgress));
  if (readyHit > 0) {
    ctx.globalAlpha = visibility * readyHit * .22;
    ctx.fillStyle = warm;
    ctx.fillRect(0, height * .5 - 1, width, Math.max(2, height * .002));
    ctx.globalAlpha = visibility * readyHit * .15;
    ctx.fillRect(width * .08, 0, width * .84, height);
  }

  // A compact progress rail anchors the intro to the mission rather than a
  // generic loading screen.
  ctx.globalAlpha = visibility * .58;
  ctx.strokeStyle = 'rgba(184, 255, 207, .3)';
  ctx.lineWidth = Math.max(1, height * .001);
  ctx.strokeRect(edge, height - bar + height * .026, width - edge * 2, Math.max(3, height * .006));
  ctx.fillStyle = accent;
  ctx.fillRect(edge, height - bar + height * .026, (width - edge * 2) * progress, Math.max(3, height * .006));
  ctx.restore();
}

function openingElevatorPoint(home, point) {
  const world = localToWorld(home.x, home.y, home.angle, point);
  return cameraPoint(world.x, world.y, world.z);
}
function addOpeningElevatorBox(faces, home, center, dimensions, yaw, color, shade = 1, material = null) {
  const points = makeBoxPoints(center, dimensions, yaw, (point) => openingElevatorPoint(home, point));
  addBoxFaces(faces, points, color, shade, material);
}
function drawOpeningElevator3D(preview, now) {
  if (!preview || preview.elapsed >= preview.elevatorDuration) return;
  const home = preview.home;
  if (!home) return;
  const elapsed = preview.elapsed;
  const open = elapsed < 3.05 ? 0 : elapsed < 4.35 ? smoothstep(3.05, 4.35, elapsed) : 1;
  const stepOut = smoothstep(4.35, preview.elevatorDuration, elapsed);
  const opacity = 1 - stepOut * .72;
  const faces = [];
  const width = 3.65;
  const depth = 4.25;
  const front = 1.48;
  const rear = front - depth;
  const ceiling = 2.12;
  const doorTravel = open * 1.62;

  // These are the same low-poly, textured faces used by world objects. The
  // elevator is anchored to the opening spawn, so the camera can physically
  // move out of it instead of swapping a flat card for the room.
  addOpeningElevatorBox(faces, home, { side: 0, forward: (front + rear) / 2, z: .035 }, [width, depth, .07], 0, '#655039', .9, 'stone');
  addOpeningElevatorBox(faces, home, { side: 0, forward: (front + rear) / 2, z: ceiling }, [width, depth, .08], 0, '#29231f', .72, 'stone');
  addOpeningElevatorBox(faces, home, { side: -width / 2, forward: (front + rear) / 2, z: ceiling / 2 }, [.16, depth, ceiling], 0, '#40362d', .9, 'stone');
  addOpeningElevatorBox(faces, home, { side: width / 2, forward: (front + rear) / 2, z: ceiling / 2 }, [.16, depth, ceiling], 0, '#40362d', .78, 'stone');
  addOpeningElevatorBox(faces, home, { side: 0, forward: rear, z: ceiling / 2 }, [width, .14, ceiling], 0, '#241f1b', .82, 'stone');

  // Heavy wood/iron trim defines the threshold and remains visible as the
  // camera crosses it during the step-out beat.
  addOpeningElevatorBox(faces, home, { side: -width / 2 + .12, forward: front + .03, z: ceiling / 2 }, [.24, .24, ceiling + .1], 0, '#70412d', .94, 'wood');
  addOpeningElevatorBox(faces, home, { side: width / 2 - .12, forward: front + .03, z: ceiling / 2 }, [.24, .24, ceiling + .1], 0, '#70412d', .76, 'wood');
  addOpeningElevatorBox(faces, home, { side: 0, forward: front + .03, z: ceiling - .1 }, [width, .24, .24], 0, '#70412d', .86, 'wood');
  addOpeningElevatorBox(faces, home, { side: 0, forward: front + .17, z: .07 }, [width, .3, .14], 0, '#9b4938', .66, 'steel');

  // Door slabs slide sideways along the same front plane as the trim. Because
  // they are actual projected faces, the world opens through their center gap.
  addOpeningElevatorBox(faces, home, { side: -width * .25 - doorTravel, forward: front, z: ceiling / 2 }, [width / 2, .13, ceiling - .18], 0, '#30302c', .98, 'steel');
  addOpeningElevatorBox(faces, home, { side: width * .25 + doorTravel, forward: front, z: ceiling / 2 }, [width / 2, .13, ceiling - .18], 0, '#252724', .84, 'steel');

  // Riveted braces, repeated stone seams, and small ward plates share the
  // materials already used by the dungeon rather than introducing new assets.
  for (const side of [-1, 1]) {
    const panelSide = side * (width * .25 + doorTravel);
    for (const z of [.45, 1.05, 1.65]) addOpeningElevatorBox(faces, home, { side: panelSide, forward: front - .075, z }, [width * .43, .035, .035], 0, '#9b4938', .7, 'steel');
    addOpeningElevatorBox(faces, home, { side: panelSide, forward: front - .095, z: 1.08 }, [.16, .045, .48], 0, '#b48a42', .75, 'steel');
  }
  addOpeningElevatorBox(faces, home, { side: 0, forward: rear + .08, z: 1.34 }, [.75, .04, .36], 0, '#b48a42', .62, 'steel');
  addOpeningElevatorBox(faces, home, { side: 0, forward: rear + .045, z: 1.34 }, [.42, .025, .14], 0, '#9b4938', .66, 'steel');

  renderFaces(faces, opacity, true);

  // A warm shaft-light spill appears only after the doors begin opening. It is
  // projected in screen space but shaped like light entering the physical lift.
  if (open > 0) {
    const camera = renderCamera();
    const glow = projectCameraPoint(cameraPoint(
      camera.x + Math.cos(camera.angle) * 1.2,
      camera.y + Math.sin(camera.angle) * 1.2,
      .72,
    ));
    if (glow) {
      const radius = Math.max(30, canvas.height * (.2 + open * .2));
      const gradient = ctx.createRadialGradient(glow.x, glow.y, 0, glow.x, glow.y, radius);
      gradient.addColorStop(0, `rgba(212, 157, 82, ${.12 * open * (1 - stepOut * .55)})`);
      gradient.addColorStop(1, 'rgba(111, 42, 25, 0)');
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  }
}
function drawOpeningElevatorIntro(preview, now) {
  if (!preview || preview.elapsed >= preview.elevatorDuration) return;
  const progress = clamp(preview.elapsed / preview.elevatorDuration, 0, 1);
  const open = preview.elapsed < 3.05 ? 0 : preview.elapsed < 4.35 ? smoothstep(3.05, 4.35, preview.elapsed) : 1;
  const stepOut = smoothstep(4.35, preview.elevatorDuration, preview.elapsed);
  const detail = preview.phase === 'elevator-travel'
    ? 'DESCENDING'
    : preview.phase === 'elevator-step-out'
      ? 'CROSSING THRESHOLD'
      : open > .08
        ? 'DOORS OPENING'
        : 'SEALED / STANDBY';
  drawCinematicGrade(progress, '#b48a42', 'ARCHIVE LIFT / THRESHOLD CHAMBER', detail, now, .02, .08);

  // Keep the label treatment thin so the textured 3D set and the world remain
  // the focus during the door opening and step-out.
  const width = canvas.width;
  const height = canvas.height;
  ctx.save();
  ctx.globalAlpha = .62 * (1 - stepOut * .7);
  ctx.fillStyle = '#b48a42';
  ctx.fillRect(width * .08, height * .79, width * (.18 + open * .14), Math.max(2, height * .003));
  ctx.fillStyle = '#e1c887';
  ctx.font = `700 ${Math.max(9, height * .014)}px "Courier New", monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(preview.phase === 'elevator-step-out' ? 'THRESHOLD / STEP OUT' : 'LIFT 01 / ARCHIVE DESCENT', width * .08, height * .75);
  ctx.fillStyle = '#566d5c';
  ctx.font = `600 ${Math.max(7, height * .009)}px "Courier New", monospace`;
  ctx.fillText('STONE · IRON · RUST · ARCHIVE SIGNAL', width * .08, height * .82);
  ctx.restore();
}

function drawLevelPreview() {
  const preview = state.levelPreview;
  if (!preview) return;
  const progress = clamp(preview.elapsed / preview.duration, 0, 1);
  const label = preview.phase === 'pedestal-hold' || preview.phase === 'fade'
    ? 'SANCTUARY / DOCUMENT OF TRUTH'
    : 'VISOR BOOT / SYSTEM IGNITION';
  drawVisorBootOverlay(preview);
  drawIntroHypeOverlay(preview, state.now || performance.now());
  drawOpeningElevatorIntro(preview, state.now || performance.now());
  if (preview.fade > 0) {
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${clamp(preview.fade, 0, 1)})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
}
function drawPreviewRouteOverview(preview) {
  if (!preview?.route?.length) return;
  const width = canvas.width;
  const height = canvas.height;
  const panelW = Math.min(width * .72, 720);
  const panelH = Math.min(height * .22, 150);
  const left = (width - panelW) / 2;
  const top = height * .14;
  const points = preview.route;
  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const scaleX = (value) => left + 24 + (value - minX) / Math.max(1, maxX - minX) * (panelW - 48);
  const scaleY = (value) => top + 34 + (value - minY) / Math.max(1, maxY - minY) * (panelH - 56);
  ctx.save();
  ctx.fillStyle = 'rgba(4, 7, 8, .78)';
  ctx.strokeStyle = 'rgba(85, 214, 193, .62)';
  ctx.lineWidth = 1;
  ctx.fillRect(left, top, panelW, panelH);
  ctx.strokeRect(left, top, panelW, panelH);
  ctx.fillStyle = '#f1dfad';
  ctx.font = `700 ${Math.max(9, height * .013)}px "Courier New", monospace`;
  ctx.textAlign = 'left';
  ctx.fillText('PLAYER ROUTE / WHOLE MAP OVERVIEW', left + 16, top + 18);
  ctx.globalAlpha = .22;
  ctx.strokeStyle = '#55d6c1';
  ctx.beginPath();
  for (let index = 0; index < points.length; index += 1) {
    const x = scaleX(points[index].x); const y = scaleY(points[index].y);
    if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.globalAlpha = .82;
  ctx.strokeStyle = '#55d6c1';
  ctx.lineWidth = Math.max(2, height * .002);
  ctx.beginPath();
  const visible = Math.max(1, Math.floor((points.length - 1) * clamp(preview.routeProgress, 0, 1)));
  for (let index = 0; index <= visible; index += 1) {
    const x = scaleX(points[index].x); const y = scaleY(points[index].y);
    if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  const current = points[Math.min(points.length - 1, visible)];
  ctx.fillStyle = '#f4cf82';
  ctx.shadowBlur = 12;
  ctx.shadowColor = '#f4cf82';
  ctx.beginPath(); ctx.arc(scaleX(current.x), scaleY(current.y), Math.max(3, height * .006), 0, TAU); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#d88a45';
  ctx.beginPath(); ctx.arc(scaleX(points[points.length - 1].x), scaleY(points[points.length - 1].y), Math.max(3, height * .005), 0, TAU); ctx.fill();
  ctx.fillStyle = '#f1dfad';
  ctx.font = `700 ${Math.max(8, height * .011)}px "Courier New", monospace`;
  ctx.textAlign = 'right';
  ctx.fillText('TROPHY ROOM / FIRST MINI-BOSS', left + panelW - 16, top + 18);
  ctx.restore();
}

function cinematicCameraPoint(roomIndex, progress) {
  const room = rooms[roomIndex];
  const point = roomContentPoint(roomIndex, room.spawn.x, room.spawn.y);
  const target = { x: roomOffsets[roomIndex] + point.x, y: point.y };
  const direction = room.spawn.angle;
  const radius = lerp(2.8, 1.05, smoothstep(0, 1, progress));
  const orbit = Math.sin(progress * Math.PI) * .72;
  const x = target.x - Math.cos(direction) * radius + Math.cos(direction + Math.PI / 2) * orbit;
  const y = target.y - Math.sin(direction) * radius + Math.sin(direction + Math.PI / 2) * orbit;
  return { x, y, angle: Math.atan2(target.y - y, target.x - x) + Math.sin(progress * Math.PI) * .08 };
}
function cinematicTransitionRoute(home, destination) {
  const route = cinematicPath(home, destination);
  return route.length > 1 ? smoothCinematicRoute(route) : [{ ...home }];
}
function updateCinematicTravel(shot, progress) {
  const travel = smoothstep(.06, .82, progress);
  const camera = sampleCinematicRoute(shot.route, travel);
  const target = shot.destination;
  const reveal = smoothstep(.68, .98, progress);
  const look = Math.atan2(target.y - camera.y, target.x - camera.x);
  camera.angle = normalizeAngle(lerp(camera.angle, look, reveal * .62));
  setCinematicCamera(camera, {
    pitch: .025 + Math.sin(progress * Math.PI) * .028 - reveal * .018,
    roll: Math.sin(progress * Math.PI * 1.4) * .018 * (1 - reveal),
    fovKick: Math.sin(progress * Math.PI) * .09,
  });
}
function drawCinematicAtmosphere(now) {
  if (!cinematicActive()) return;
  const camera = renderCamera();
  const width = canvas.width;
  const height = canvas.height;
  const horizon = cameraHorizon();
  const room = rooms[clamp(renderRoomIndex(), 0, rooms.length - 1)];
  const accent = room?.color || '#d76b49';
  ctx.save();
  // A shallow atmospheric veil separates the far architecture from the
  // foreground without smearing the pixel-art renderer.
  const haze = ctx.createLinearGradient(0, Math.max(0, horizon - height * .2), 0, height);
  haze.addColorStop(0, 'rgba(3, 4, 5, .16)');
  haze.addColorStop(.42, 'rgba(5, 4, 5, .035)');
  haze.addColorStop(1, 'rgba(4, 2, 3, .08)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, width, height);

  // Stable dust motes give the moving camera a sense of volume. Their
  // positions are deterministic, so this does not create per-frame noise.
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = accent;
  for (let index = 0; index < 18; index += 1) {
    const x = width * fract(index * .173 + Math.sin(now * .00008 + index) * .035 + .11);
    const y = height * (.18 + fract(index * .417 + Math.sin(now * .00011 + index * 2) * .08) * .62);
    const size = Math.max(1, height * (.0012 + (index % 3) * .0007));
    ctx.globalAlpha = .035 + (index % 4) * .012;
    ctx.fillRect(x, y, size, size);
  }
  ctx.restore();
}

function drawCinematicTransitionFrame(shot, label, accent, now) {
  const progress = clamp(shot.elapsed / shot.duration, 0, 1);
  const reveal = smoothstep(.14, .36, progress);
  const close = smoothstep(.84, 1, progress);
  drawCinematicGrade(progress, accent, label, `${String(Math.round(progress * 100)).padStart(3, '0')}  REVEAL`, now, .06, .1);
  if (progress < .14 || progress > .86) {
    const fade = progress < .14 ? 1 - progress / .14 : (progress - .86) / .14;
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${clamp(fade, 0, 1)})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
  if (reveal > 0 && close < 1) {
    ctx.save();
    ctx.globalAlpha = reveal * (1 - close) * .72;
    ctx.fillStyle = accent;
    ctx.font = `700 ${Math.max(10, canvas.height * .016)}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, canvas.width / 2, canvas.height * .18);
    ctx.restore();
  }
}


function beginForestTransition() {
  if (state.forestTransition || state.transition || state.room !== 0 || !state.lobbyGateOpen) return;
  const forestSpawn = roomContentPoint(STARTING_ROOM_INDEX, rooms[STARTING_ROOM_INDEX].spawn.x, rooms[STARTING_ROOM_INDEX].spawn.y);
  state.forestTransition = { elapsed: 0, duration: 11.5, teleported: false, revealStarted: false, targetRoom: STARTING_ROOM_INDEX, home: saveCinematicHome(), destination: { x: roomOffsets[STARTING_ROOM_INDEX] + forestSpawn.x, y: forestSpawn.y, angle: rooms[STARTING_ROOM_INDEX].spawn.angle } };
  state.forestTransition.route = cinematicTransitionRoute({ x: state.forestTransition.home.x, y: state.forestTransition.home.y }, state.forestTransition.destination);
  setCinematicCamera({ x: state.player.x, y: state.player.y, angle: state.player.angle }, { pitch: .02, fovKick: .02 });
  setCinematicUi('dialogue');
  state.keys.clear(); state.mouseAttack = false; state.mouseLook = false;
  state.promptSignature = 'forest-transition';
  hideNarratorPanel();
  state.narratorSignal = null;
  playTone(38, .12, 'sawtooth', .026);
}
function finishForestTransition() {
  const transition = state.forestTransition;
  if (!transition) return;
  state.player.x = transition.destination.x; state.player.y = transition.destination.y;
  state.player.angle = transition.destination.angle; state.room = STARTING_ROOM_INDEX;
  recoverPlayerFromWall(STARTING_ROOM_INDEX);
  announceNarrator('threshold-arrival', 'THRESHOLD / ROUTE RESTORED', 'CAMERA RESTORED. CLEAR THE THRESHOLD AND SECURE THE DOCUMENT OF TRUTH.', 'expression-command', 10, { duration: 6.5, priority: 8, force: true });
  setMusicMode('dungeon'); updateHud(); showToast('THRESHOLD CHAMBER · ROUTE RESTORED.', 'danger');
}
function updateForestTransition(delta) {
  const transition = state.forestTransition; if (!transition) return;
  transition.elapsed += delta;
  const progress = transition.elapsed / transition.duration;
  if (!transition.revealStarted && progress >= .34) {
    transition.revealStarted = true; setCinematicUi('reveal'); state.room = transition.targetRoom;
  }
  if (progress >= .34 && progress < .86) {
    updateCinematicTravel(transition, progress);
  }
  if (progress >= .82 && progress < .95) {
    setCinematicUi('dialogue');
  }
  if (progress >= .95 && !transition.teleported) {
    transition.teleported = true; finishForestTransition();
  }
  if (progress >= 1) {
    clearCinematicCamera();
    setCinematicUi('');
    state.forestTransition = null;
    updateHud();
    updateNarrator();
  }
}
function drawForestTransition() {
  const shot = state.forestTransition;
  if (!shot) return;
  drawCinematicTransitionFrame(shot, 'THRESHOLD CHAMBER / ROUTE REVEAL', '#d76b49', state.now || performance.now());
}
function beginBossTransition() {
  if (state.transition || state.room === FINAL_ROOM_INDEX || state.gameComplete) return;
  const finalSpawn = roomContentPoint(FINAL_ROOM_INDEX, rooms[FINAL_ROOM_INDEX].spawn.x, rooms[FINAL_ROOM_INDEX].spawn.y);
  state.transition = { elapsed: 0, duration: 12.5, teleported: false, revealStarted: false, targetRoom: FINAL_ROOM_INDEX, home: saveCinematicHome(), destination: { x: roomOffsets[FINAL_ROOM_INDEX] + finalSpawn.x, y: finalSpawn.y, angle: rooms[FINAL_ROOM_INDEX].spawn.angle } };
  state.transition.route = cinematicTransitionRoute({ x: state.transition.home.x, y: state.transition.home.y }, state.transition.destination);
  setCinematicCamera({ x: state.player.x, y: state.player.y, angle: state.player.angle }, { pitch: .02, fovKick: .02 });
  setCinematicUi('dialogue');
  state.keys.clear(); state.mouseAttack = false; state.mouseLook = false; state.promptSignature = 'transition';
  hideNarratorPanel();
  state.narratorSignal = null;
  playTrapdoorSound(); showToast('FINAL SECTOR INCOMING.', 'danger');
}
function finishBossTransition() {
  const transition = state.transition;
  if (!transition) return;
  state.player.x = transition.destination.x; state.player.y = transition.destination.y;
  state.player.angle = transition.destination.angle; state.room = FINAL_ROOM_INDEX; state.finalArenaTime = .01;
  recoverPlayerFromWall(FINAL_ROOM_INDEX);
  state.finalBoss.alerted = true;
  announceNarrator('archon-entry', 'FINAL ENCOUNTER', 'CAMERA RESTORED. BREAK THE ARCHON. REACH THE EXIT.', 'expression-worried', 5, { duration: 8, priority: 9, force: true });
  state.player.hp = Math.max(1, state.player.hp - 12); state.damageFlash = .7; state.shakeTime = settings.reducedMotion ? .22 : .72;
  setMusicMode('boss'); updateHud(); showToast('FINAL ROOM · CAMERA RESTORED.', 'danger');
}
function updateBossTransition(delta) {
  const transition = state.transition; if (!transition) return;
  transition.elapsed += delta;
  const progress = transition.elapsed / transition.duration;
  if (!transition.revealStarted && progress >= .34) {
    transition.revealStarted = true; setCinematicUi('reveal'); state.room = transition.targetRoom;
  }
  if (progress >= .34 && progress < .86) {
    updateCinematicTravel(transition, progress);
  }
  if (progress >= .82 && progress < .95) {
    setCinematicUi('dialogue');
  }
  if (progress >= .95 && !transition.teleported) {
    transition.teleported = true; finishBossTransition();
  }
  if (progress >= 1) {
    clearCinematicCamera();
    setCinematicUi('');
    state.transition = null;
    updateHud();
    updateNarrator();
  }
}
function drawBossTransition() {
  const shot = state.transition;
  if (!shot) return;
  drawCinematicTransitionFrame(shot, 'FINAL SECTOR / ARCHON CHAMBER', '#e8d39a', state.now || performance.now());
}
function hideFloorAnnouncement() {
  if (!floorAnnouncement) return;
  floorAnnouncement.classList.remove('is-visible');
  window.setTimeout(() => {
    if (!state.floorAnnouncement) floorAnnouncement.hidden = true;
  }, 360);
}
function showFloorAnnouncement(roomIndex) {
  if (!Number.isInteger(roomIndex)) return;
  const firstVisit = !state.visitedFloors.has(roomIndex);
  state.visitedFloors.add(roomIndex);
  if (firstVisit && roomIndex !== 0 && roomIndex !== SANCTUARY_ROOM_INDEX) {
    const room = rooms[roomIndex];
    state.sectorStinger = { elapsed: 0, duration: settings.reducedMotion ? 1.25 : 2.15, room };
  }
}

function updateFloorAnnouncement(delta) {
  if (state.sectorStinger) {
    state.sectorStinger.elapsed += delta;
    if (state.sectorStinger.elapsed >= state.sectorStinger.duration) state.sectorStinger = null;
  }
  if (!state.floorAnnouncement) return;
  state.floorAnnouncement.elapsed += delta;
  if (state.floorAnnouncement.elapsed >= state.floorAnnouncement.duration) {
    state.floorAnnouncement = null;
    hideFloorAnnouncement();
  }
}

function sealLobbyCourtyard() {
  if (state.lobbyDeparted || !LOBBY_GATE) return;
  state.lobbyDeparted = true;
  const sealX = Math.floor(LOBBY_GATE.x);
  for (const y of FOREST_HALL_ROWS) worldMap[y][sealX] = '1';
}

function miniBossEntranceWallX(roomIndex) {
  // Keep the seal in the final connector cell rather than on the arena's west
  // boundary. The player is already past this point when the first cutscene
  // hands control back, so the wall cannot occupy the spawn/approach cell.
  return Math.max(0, roomOffsets[roomIndex] - 1);
}
function setMiniBossDoors(roomIndex, entranceClosed, exitOpen = false) {
  if (!miniBossRoom(roomIndex)) return;
  const offset = roomOffsets[roomIndex];
  const entranceWallX = miniBossEntranceWallX(roomIndex);
  const width = roomWidths[roomIndex];
  const doorY = roomDoorY(roomIndex);
  const centerY = Math.floor(roomHeights[roomIndex] / 2);
  const doorwayRows = [doorY, doorY + 1];
  const combatRows = [centerY - 1, centerY, centerY + 1];
  for (const y of doorwayRows) {
    worldMap[y][entranceWallX] = entranceClosed ? '1' : '0';
    worldMap[y][offset] = '0';
    worldMap[y][offset + width - 1] = exitOpen ? '0' : '1';
  }
  // The player fights in the center lane. When the target falls, connect that
  // lane to the actual east doorway so the exit is reachable from the kill area.
  for (const y of combatRows) {
    worldMap[y][offset + width - 1] = exitOpen ? '0' : '1';
  }
  if (exitOpen) {
    // Three cells wide: the player can reach the unlocked doorway from any
    // position in the central combat lane without catching a wall corner.
    for (let y = Math.min(doorY, centerY) - 1; y <= Math.max(doorY + 1, centerY + 1); y += 1) {
      for (let x = width - 4; x <= width - 1; x += 1) worldMap[y][offset + x] = '0';
    }
  }
}
function routeOverviewTriggerRoomIndex() {
  // The overview begins when the player actually enters the threshold area,
  // then glides forward through the connected route to the Trophy Room.
  return STARTING_ROOM_INDEX;
}
function trophyRoomIndex() {
  return rooms.findIndex((room) => room.id === 'trophy');
}
function beginRouteOverview() {
  if (state.routeOverview || state.routeOverviewTriggered || state.levelPreview) return false;
  if (!firstMiniBossDefeated()) return false;
  const destinationRoom = trophyRoomIndex();
  if (destinationRoom < 0 || state.room === destinationRoom) return false;
  const trophySpawn = roomContentPoint(destinationRoom, rooms[destinationRoom].spawn.x, rooms[destinationRoom].spawn.y);
  const home = saveCinematicHome();
  const destination = { x: roomOffsets[destinationRoom] + trophySpawn.x, y: trophySpawn.y };
  const route = cinematicPath({ x: home.x, y: home.y }, destination);
  if (route.length < 2) return false;
  state.routeOverview = {
    elapsed: 0,
    duration: 22,
    overviewDuration: 3.4,
    phase: 'map-overview',
    routeProgress: 0,
    home,
    destination,
    route: smoothCinematicRoute(route),
  };
  state.routeOverviewTriggered = true;
  state.keys.clear();
  state.mouseAttack = false;
  state.mouseLook = false;
  hideNarratorPanel();
  state.narratorSignal = null;
  setCinematicCamera({ x: home.x, y: home.y, angle: home.angle }, { pitch: .02, fovKick: .035 });
  setCinematicUi('reveal');
  return true;
}
function updateRouteOverview(delta) {
  const shot = state.routeOverview;
  if (!shot) return;
  shot.elapsed += delta;
  const progress = clamp(shot.elapsed / shot.duration, 0, 1);
  let camera;
  if (shot.elapsed < shot.overviewDuration) {
    shot.phase = 'map-overview';
    shot.routeProgress = lerp(0, .08, smoothstep(0, 1, shot.elapsed / shot.overviewDuration));
    camera = sampleCinematicRoute(shot.route, shot.routeProgress);
    camera.pitch = lerp(.02, -.06, smoothstep(0, 1, shot.elapsed / shot.overviewDuration));
    setCinematicUi('reveal');
  } else {
    shot.phase = 'route-to-trophy';
    const local = clamp((shot.elapsed - shot.overviewDuration) / Math.max(.001, shot.duration - shot.overviewDuration), 0, 1);
    shot.routeProgress = lerp(.08, 1, smoothstep(.01, .98, local));
    camera = sampleCinematicRoute(shot.route, shot.routeProgress);
    const target = { x: shot.destination.x, y: shot.destination.y, z: .72 };
    aimCinematicCamera(camera, target, .2 + smoothstep(.1, .8, local) * .22);
    setCinematicUi('hud');
    state.room = clamp(roomIndexAtX(camera.x), STARTING_ROOM_INDEX, destinationRoomForOverview());
  }
  setCinematicCamera(camera, {
    pitch: camera.pitch ?? .018,
    roll: Math.sin(shot.elapsed * 1.4) * .01,
    fovKick: shot.phase === 'map-overview' ? .08 : .025 + Math.sin(progress * Math.PI) * .06,
  });
  if (progress >= 1) {
    restoreCinematicHome(shot.home);
    clearCinematicCamera();
    state.routeOverview = null;
    setCinematicUi('');
    updateHud();
    updateNarrator();
  }
}
function destinationRoomForOverview() {
  const index = trophyRoomIndex();
  return index >= 0 ? index : FINAL_ROOM_INDEX - 1;
}
function drawRouteOverview() {
  const shot = state.routeOverview;
  if (!shot) return;
  const progress = clamp(shot.elapsed / shot.duration, 0, 1);
  drawCinematicGrade(progress, '#55d6c1', shot.phase === 'map-overview' ? 'PLAYER ROUTE / WHOLE MAP OVERVIEW' : 'ROUTE TO TROPHY ROOM', `${String(Math.round(progress * 100)).padStart(3, '0')}  ${shot.phase.toUpperCase()}`, state.now || performance.now(), .045, .1);
  if (shot.phase === 'map-overview') drawPreviewRouteOverview(shot);
}

function beginMiniBossArena(roomIndex, cinematicHome = null) {
  const miniBoss = worldEnemies.find((enemy) => enemy.roomIndex === roomIndex && enemy.miniBoss && !enemy.dead);
  if (!miniBoss || state.miniBossArena?.roomIndex === roomIndex || state.miniBossCutscene) return false;
  const room = rooms[roomIndex];
  const home = cinematicHome || saveCinematicHome();
  // Keep the camera/player handoff at the position where the player entered.
  // The authored room spawn can overlap decorative cover in the first arena,
  // which previously left the player inside a wall when the cutscene ended.
  const arrival = canStand(home.x, home.y)
    ? { x: home.x, y: home.y }
    : findWalkableSpawnPoint(home.x, home.y, roomIndex);
  const target = { x: miniBoss.x, y: miniBoss.y };
  const destination = {
    x: arrival.x,
    y: arrival.y,
    angle: Math.atan2(target.y - arrival.y, target.x - arrival.x),
  };

  state.miniBossArena = { roomIndex, active: true, entranceClosed: false, exitOpen: false };
  setMiniBossDoors(roomIndex, false, false);
  setMusicMode('boss');
  // The reveal is entirely inside the destination arena. Switch the logical
  // room before rendering so the boss, walls, lighting, and room metadata all
  // agree with the camera instead of exposing the previous room mid-shot.
  state.room = roomIndex;
  state.miniBossCutscene = {
    roomIndex,
    elapsed: 0,
    duration: 6.6,
    scanStart: 1.1,
    lockStart: 4.25,
    phase: 'approach',
    home,
    destination,
    target,
    miniBossName: miniBoss.name,
  };
  setCinematicCamera({ x: destination.x, y: destination.y, angle: destination.angle }, { pitch: .018, fovKick: .02 });
  setCinematicUi('dialogue');
  hideNarratorPanel();
  state.narratorSignal = null;
  state.keys.clear();
  state.mouseAttack = false;
  state.mouseLook = false;
  showToast(`${miniBoss.name} ahead.`, 'danger');
  return true;
}
function updateMiniBossArenaLock() {
  const arena = state.miniBossArena;
  if (!arena?.active || state.room !== arena.roomIndex) return;
  const remainingMiniBoss = worldEnemies.some((enemy) => enemy.roomIndex === arena.roomIndex && enemy.miniBoss && !enemy.dead);
  if (!remainingMiniBoss) {
    arena.exitOpen = true;
    arena.active = false;
    arena.entranceClosed = true;
    setMiniBossDoors(arena.roomIndex, true, true);
    recoverPlayerFromWall(arena.roomIndex);
    setMusicMode('dungeon');
    return;
  }
  if (arena.exitOpen || arena.entranceClosed) return;
  const offset = roomOffsets[arena.roomIndex];
  // Seal only after the player has cleared the physical doorway. The barrier
  // itself lives one cell back in the connector, behind the player rather than
  // on the arena's west boundary.
  if (state.player.x < offset + 1.25) return;
  arena.entranceClosed = true;
  announceNarrator(
    `mini-${arena.roomIndex}-sealed`,
    'ARENA SEALED',
    'The entrance is locked behind you. Defeat the target to reopen the route toward Liam’s Document of Truth.',
    'expression-command',
    10,
    { duration: 6, priority: 9, force: true },
  );
  setMiniBossDoors(arena.roomIndex, true, false);
  recoverPlayerFromWall(arena.roomIndex);
  showToast('ARENA SEALED. NO EXIT UNTIL THE TARGET FALLS.', 'danger');
}

function updateMiniBossCutscene(delta) {
  const cutscene = state.miniBossCutscene;
  if (!cutscene) return;
  cutscene.elapsed += delta;
  const progress = clamp(cutscene.elapsed / cutscene.duration, 0, 1);
  const targetAngle = Math.atan2(cutscene.target.y - cutscene.destination.y, cutscene.target.x - cutscene.destination.x);
  const camera = {
    x: cutscene.destination.x,
    y: cutscene.destination.y,
    angle: cutscene.destination.angle,
    pitch: .018,
  };

  if (cutscene.elapsed < cutscene.scanStart) {
    cutscene.phase = 'approach';
    const local = smoothstep(0, 1, cutscene.elapsed / cutscene.scanStart);
    camera.angle = normalizeAngle(lerp(cutscene.destination.angle, targetAngle - .18, local));
    camera.pitch = lerp(.045, .018, local);
    setCinematicUi('dialogue');
  } else if (cutscene.elapsed < cutscene.lockStart) {
    cutscene.phase = 'room-scan';
    const local = clamp((cutscene.elapsed - cutscene.scanStart) / (cutscene.lockStart - cutscene.scanStart), 0, 1);
    camera.angle = normalizeAngle(targetAngle - .18 + .36 * smoothstep(0, 1, local));
    camera.pitch = .018 + Math.sin(local * Math.PI) * .012;
    setCinematicUi('reveal');
  } else {
    cutscene.phase = 'target-lock';
    const local = clamp((cutscene.elapsed - cutscene.lockStart) / (cutscene.duration - cutscene.lockStart), 0, 1);
    camera.angle = normalizeAngle(lerp(targetAngle, targetAngle + .025, smoothstep(0, 1, local)));
    camera.pitch = .022;
    setCinematicUi('dialogue');
  }

  setCinematicCamera(camera, {
    pitch: camera.pitch,
    roll: 0,
    fovKick: cutscene.phase === 'room-scan' ? .035 : .018,
  });

  if (progress >= 1) {
    state.player.x = cutscene.destination.x;
    state.player.y = cutscene.destination.y;
    state.player.angle = cutscene.destination.angle;
    state.room = cutscene.roomIndex;
    recoverPlayerFromWall(cutscene.roomIndex);
    clearCinematicCamera();
    setCinematicUi('');
    state.miniBossCutscene = null;
    const targetEnemy = worldEnemies.find((candidate) => candidate.roomIndex === cutscene.roomIndex && candidate.miniBoss && !candidate.dead);
    if (targetEnemy) {
      announceNarrator(
        `mini-${targetEnemy.id}-arrival`,
        'TARGET ACQUIRED',
        `${targetEnemy.displayName || targetEnemy.name} is ahead. Clear the arena and keep the archive route open.`,
        'expression-alert',
        4,
        { duration: 5.5, priority: 8, force: true },
      );
      updateNarrator();
    }
  }
}
function drawMiniBossCutscene() {
  const shot = state.miniBossCutscene;
  if (!shot) return;
  drawCinematicTransitionFrame(shot, `${shot.miniBossName} / TROPHY ROOM`, '#d99762', state.now || performance.now());
}
function tryBeginMiniBossEntry(roomIndex) {
  if (!miniBossRoom(roomIndex) || roomIndex < STARTING_ROOM_INDEX) return false;
  const roomId = rooms[roomIndex]?.id;
  const offset = roomOffsets[roomIndex];
  const interiorBoundary = offset + 1.2;
  if (!roomId || state.miniBossIntroSeen.has(roomId)) return false;
  if (state.levelPreview || state.routeOverview || state.forestTransition || state.transition || state.launchTransition || state.miniBossCutscene) return false;
  if (firstMiniBossDefeated() && roomIndex === firstMiniBossRoomIndex()) return false;
  if (state.player.x < interiorBoundary) return false;

  // Preserve the prior pose for diagnostics and future transition effects;
  // the reveal itself is staged directly inside the destination arena.
  const home = saveCinematicHome();
  const started = beginMiniBossArena(roomIndex, home);
  if (started) {
    state.miniBossIntroSeen.add(roomId);
    return true;
  }
  return false;
}

function updateRoomFromPlayer() {
  updateMiniBossArenaLock();
  const next = currentRoomIndex();
  if (next === FINAL_ROOM_INDEX && state.room !== FINAL_ROOM_INDEX && state.finalBoss && !state.finalBoss.dead) {
    beginBossTransition();
    return;
  }
  if (tryBeginMiniBossEntry(next)) return;
  if (next !== state.room) {
    const previousRoom = state.room;
    state.room = next;
    if (
      next === firstMiniBossRoomIndex() + 1
      && previousRoom === firstMiniBossRoomIndex()
      && firstMiniBossDefeated()
    ) {
      // The map overview is a separate trigger: it starts only when the player
      // crosses into the area beyond the first cleared mini-boss room.
      beginRouteOverview();
    } else if (next !== FINAL_ROOM_INDEX && next !== SANCTUARY_ROOM_INDEX) {
      const room = rooms[next];
      announceNarrator(
        `room-entry-${room.id}`,
        `${room.level} / FIELD RECORD`,
        `${room.title}: identify the problem, test the method, and keep the outcome moving toward delivery.`,
        'expression-calm',
        0,
        { duration: 6.5, priority: 3, force: true },
      );
    }
    showFloorAnnouncement(next);
    updateHud();
    spawnParticles(state.player.x, state.player.y, .4, [rooms[next].color, '#d8c18b'], settings.reducedMotion ? 8 : 20, { speed: 1.4, life: .85, size: .78, upward: .7, glow: 14, trail: true });
    playNoiseSweep(.07, .008, 'bandpass', 1100, 420, 0, .8);
    playLowThump(66, .07, .008, .018);
  }
}

let audioContext = null;
function playTone(frequency, duration, type = 'sine', volume = .035, offset = 0) {
  try {
    const audio = ensureAudioContext();
    if (!audio) return;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const effectiveVolume = volume * settings.sfxVolume;
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(.0001, audio.currentTime + offset);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0001, effectiveVolume), audio.currentTime + offset + .01);
    gain.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + offset + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(audio.currentTime + offset);
    oscillator.stop(audio.currentTime + offset + duration + .03);
  } catch { /* Optional browser audio. */ }
}
function playNoiseBurst(duration = .08, volume = .02, filterType = 'bandpass', frequency = 1200, offset = 0, q = .7) {
  try {
    const audio = ensureAudioContext();
    if (!audio) return;
    const length = Math.max(1, Math.floor(audio.sampleRate * duration));
    const buffer = audio.createBuffer(1, length, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < length; index += 1) {
      const progress = index / length;
      const envelope = Math.pow(1 - progress, 1.8);
      data[index] = (Math.random() * 2 - 1) * envelope;
    }
    const source = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();
    filter.type = filterType;
    filter.frequency.setValueAtTime(frequency, audio.currentTime + offset);
    filter.Q.setValueAtTime(q, audio.currentTime + offset);
    source.buffer = buffer;
    const start = audio.currentTime + offset;
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0001, volume * settings.sfxVolume), start + .004);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    source.connect(filter).connect(gain).connect(audio.destination);
    source.start(start);
    source.stop(start + duration + .025);
  } catch { /* Optional browser audio. */ }
}
function playLowThump(frequency = 70, duration = .12, volume = .03, offset = 0) {
  playTone(frequency, duration, 'sine', volume, offset);
  playTone(frequency * .52, duration * .8, 'triangle', volume * .42, offset);
}
function playNoiseSweep(duration = .08, volume = .02, filterType = 'bandpass', startFrequency = 1200, endFrequency = 700, offset = 0, q = .7) {
  try {
    const audio = ensureAudioContext();
    if (!audio) return;
    const length = Math.max(1, Math.floor(audio.sampleRate * duration));
    const buffer = audio.createBuffer(1, length, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < length; index += 1) {
      const progress = index / length;
      data[index] = (Math.random() * 2 - 1) * Math.pow(1 - progress, 1.65);
    }
    const source = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();
    const startTime = audio.currentTime + offset;
    filter.type = filterType;
    filter.frequency.setValueAtTime(Math.max(40, startFrequency), startTime);
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, endFrequency), startTime + duration);
    filter.Q.setValueAtTime(q, startTime);
    source.buffer = buffer;
    gain.gain.setValueAtTime(.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0001, volume * settings.sfxVolume), startTime + .003);
    gain.gain.exponentialRampToValueAtTime(.0001, startTime + duration);
    source.connect(filter).connect(gain).connect(audio.destination);
    source.start(startTime);
    source.stop(startTime + duration + .03);
  } catch { /* Optional browser audio. */ }
}
function playMechanicalClick(offset = 0, volume = .018) {
  playNoiseBurst(.024, volume, 'highpass', 2900, offset, .85);
  playTone(104, .04, 'triangle', volume * .38, offset + .003);
}
function playMetallicAction(offset = 0, volume = .014) {
  playNoiseSweep(.045, volume, 'bandpass', 3600, 1100, offset, 1.4);
  playTone(92, .055, 'triangle', volume * .38, offset + .008);
}
function playGunshotReport() {
  // This is a trimmed single-shot clip, not the original multi-shot recording.
  // The procedural crack only fills in the transient while the asset loads.
  const loaded = playAudioBuffer('rifle', .28, { playbackRate: .98, lowpass: 7200, roomMix: .12, roomDelay: .042 });
  if (!loaded) {
    playNoiseBurst(.026, .052, 'highpass', 4300, 0, .72);
    playNoiseSweep(.085, .03, 'bandpass', 2450, 720, .006, 1.0);
    playNoiseSweep(.13, .018, 'lowpass', 520, 105, .01, .5);
  } else {
    playNoiseBurst(.018, .012, 'highpass', 5200, 0, .8);
  }
  playMechanicalClick(.092, .012);
}
function playShotgunBlast() {
  // The authored blast supplies the main report; procedural low pressure makes
  // the close-range weapon feel larger without stacking another fake gunshot.
  const loaded = playAudioBuffer('shotgun', .5, { playbackRate: .94, lowpass: 5200, roomMix: .28, roomDelay: .072 });
  if (!loaded) playNoiseBurst(.035, .07, 'highpass', 3600, 0, .58);
  playNoiseSweep(.22, loaded ? .055 : .09, 'lowpass', 1250, 190, .004, .52);
  playNoiseSweep(.31, loaded ? .052 : .062, 'lowpass', 220, 48, .008, .45);
  if (!loaded) playNoiseBurst(.1, .026, 'bandpass', 1850, .035, .65);
}
function playElectricalDischarge() {
  // Kenney electric zap provides the recognizable BFG attack; the synthesized
  // layer adds weight and keeps the weapon from sounding like a small laser.
  const loaded = playAudioBuffer('bfgElectric', .48, { playbackRate: .82, highpass: 38, lowpass: 6200, roomMix: .34, roomDelay: .088 });
  try {
    const audio = ensureAudioContext();
    if (!audio) return;
    const start = audio.currentTime;
    const oscillator = audio.createOscillator();
    const shaper = audio.createWaveShaper();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();
    const curve = new Float32Array(256);
    for (let index = 0; index < curve.length; index += 1) {
      const x = index * 2 / (curve.length - 1) - 1;
      curve[index] = Math.tanh(x * 3.2);
    }
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(74, start);
    oscillator.frequency.exponentialRampToValueAtTime(310, start + .26);
    oscillator.frequency.exponentialRampToValueAtTime(118, start + .58);
    shaper.curve = curve;
    shaper.oversample = '2x';
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(540, start);
    filter.frequency.exponentialRampToValueAtTime(1900, start + .22);
    filter.frequency.exponentialRampToValueAtTime(280, start + .62);
    filter.Q.setValueAtTime(1.8, start);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime((loaded ? .022 : .035) * settings.sfxVolume, start + .018);
    gain.gain.exponentialRampToValueAtTime(.0001, start + .68);
    oscillator.connect(shaper).connect(filter).connect(gain).connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + .72);
  } catch { /* Optional browser audio. */ }
  playNoiseSweep(.34, loaded ? .025 : .045, 'bandpass', 3400, 420, .01, 1.4);
  playNoiseBurst(.18, loaded ? .014 : .022, 'highpass', 5200, .05, .8);
  playLowThump(34, .34, .038, .015);
}
function playNinjaStarSound() {
  playNoiseSweep(.07, .016, 'bandpass', 4200, 1500, 0, .65);
  playTone(184, .07, 'sine', .006, .02);
}
function playWandSound() {
  playNoiseSweep(.12, .013, 'bandpass', 1150, 430, 0, .8);
  playLowThump(76, .14, .012, .018);
}
function playBladeSound() {
  playNoiseSweep(.11, .021, 'bandpass', 3000, 750, 0, .55);
  playLowThump(68, .08, .008, .018);
}
function playWeaponSound() {
  if (state.weapon.type === 'arsenal') playGunshotReport();
  else if (state.weapon.type === 'shotgun') playShotgunBlast();
  else if (state.weapon.type === 'bfg') playElectricalDischarge();
  else if (state.weapon.type === 'stars') playNinjaStarSound();
  else if (state.weapon.type === 'blade') playBladeSound();
  else playWandSound();
}
function playBossAttackSound(pattern, phase = 1) {
  if (pattern === 0) {
    playNoiseSweep(.11, .023, 'bandpass', phase === 3 ? 2600 : 2050, 760, 0, 1.1);
    playLowThump(phase === 3 ? 44 : 58, .18, phase === 3 ? .036 : .024, .015);
  } else if (pattern === 1) {
    playLowThump(phase === 3 ? 38 : 48, .28, .032);
    playNoiseSweep(.28, .02, 'bandpass', 940, 180, .02, .75);
  } else if (pattern === 2) {
    playNoiseSweep(.16, .028, 'lowpass', 740, 120, 0, .6);
    playLowThump(42, .2, .04, .025);
  } else if (pattern === 3) {
    playNoiseSweep(.2, .024, 'bandpass', 1350, 280, 0, 1.05);
    playLowThump(52, .24, .034, .018);
  } else {
    playNoiseSweep(.14, .026, 'bandpass', 3000, 520, 0, .8);
    playLowThump(46, .18, .032, .01);
  }
}
function playEnemyMeleeSound(enemy) {
  const kind = enemy?.kind;
  if (kind === 'zombie') {
    playNoiseSweep(.16, .017, 'lowpass', 360, 95, 0, .8);
    playLowThump(58, .14, .018, .015);
  } else if (kind === 'warden' || enemy?.boss) {
    playNoiseSweep(.21, .025, 'lowpass', 500, 110, 0, .7);
    playLowThump(enemy?.boss ? 42 : 52, .2, enemy?.boss ? .038 : .024, .018);
  } else if (kind === 'hound' || kind === 'beast' || kind === 'imp') {
    playNoiseSweep(.12, .019, 'bandpass', 980, 180, 0, .65);
    playLowThump(66, .1, .014, .012);
  } else {
    playNoiseSweep(.1, .014, 'lowpass', 620, 140, 0, .7);
    playLowThump(70, .09, .012, .01);
  }
}
function playEnemyRangedSound(enemy) {
  if (enemy?.kind === 'soldier') {
    playNoiseSweep(.07, .022, 'bandpass', 2400, 900, 0, 1.1);
    playMechanicalClick(.045, .009);
  } else if (enemy?.kind === 'insectoid' || enemy?.kind === 'moth') {
    playNoiseSweep(.18, .018, 'bandpass', 1900, 380, 0, .65);
    playNoiseSweep(.07, .007, 'lowpass', 520, 180, .035, .7);
  } else {
    playNoiseSweep(.13, .016, 'bandpass', 1500, 320, 0, .7);
  }
}
function playEnemyGroundSound(enemy) {
  playLowThump(enemy?.kind === 'quake' ? 38 : 54, .25, enemy?.kind === 'quake' ? .04 : .022);
  playNoiseSweep(.18, .014, 'lowpass', 520, 90, .02, .6);
}
function playEnemyShieldSound() {
  playNoiseSweep(.12, .018, 'bandpass', 1500, 420, 0, 1.1);
  playLowThump(58, .16, .022, .008);
}
function playWeaponEquipSound(type) {
  if (type === 'shotgun') {
    playMechanicalClick(0, .018);
    playLowThump(52, .12, .018, .035);
  } else if (type === 'bfg') {
    playLowThump(38, .2, .026);
    playNoiseSweep(.14, .014, 'bandpass', 720, 220, .04, .8);
  } else if (type === 'blade') {
    playMetallicAction(0, .014);
  } else {
    playMechanicalClick(0, .014);
    playNoiseSweep(.08, .009, 'bandpass', 1100, 420, .035, .7);
  }
}
function playEnemyHurtSound(enemy) {
  if (enemy?.boss) {
    playNoiseSweep(.085, .018, 'lowpass', 420, 120, 0, .7);
    playLowThump(48, .1, .018, .01);
  } else if (enemy?.kind === 'insectoid' || enemy?.kind === 'moth') {
    playNoiseSweep(.065, .012, 'bandpass', 2300, 800, 0, .8);
  } else {
    playNoiseSweep(.075, .011, 'lowpass', 720, 170, 0, .8);
    playMechanicalClick(.012, .006);
  }
}
function playEnemyDeathSound(enemy) {
  if (enemy?.boss) {
    playLowThump(32, .7, .05);
    playNoiseSweep(.55, .028, 'lowpass', 680, 75, .08, .55);
    return;
  }
  if (enemy?.kind === 'insectoid' || enemy?.kind === 'moth') {
    playNoiseSweep(.22, .018, 'bandpass', 2200, 260, 0, .6);
  } else if (enemy?.kind === 'zombie' || enemy?.kind === 'warden') {
    playNoiseSweep(.3, .022, 'lowpass', 560, 80, 0, .7);
    playLowThump(48, .2, .02, .03);
  } else {
    playNoiseSweep(.2, .015, 'lowpass', 760, 100, 0, .7);
  }
}
function playRecoverySound() {
  playNoiseSweep(.12, .012, 'bandpass', 900, 420, 0, .8);
  playLowThump(86, .11, .01, .04);
}
function playHitSound() {
  playNoiseSweep(.11, .027, 'lowpass', 540, 100, 0, .65);
  playLowThump(48, .13, .025, .008);
}
function playBoneHitSound() {
  playNoiseSweep(.065, .014, 'lowpass', 980, 260, 0, .8);
  playMechanicalClick(.008, .007);
}
function playTrollTalk(seed = 0) {
  // A short cluster of low, nasal syllable-like tones gives the troll a voice
  // without requiring an external audio asset.
  const base = 118 + (seed % 3) * 17;
  playTone(base, .08, 'square', .022);
  playTone(base * 1.32, .07, 'sawtooth', .018, .075);
  playTone(base * .82, .11, 'triangle', .02, .14);
  playTone(base * 1.08, .08, 'square', .014, .25);
}

function getNearestItem(maxDistance = 1.55) {
  let nearest = null;
  let best = maxDistance;
  const activeRoom = currentRoomIndex();
  for (const item of worldItems) {
    if (item.recovered || ['ammo-pickup', 'ammo-arsenal', 'ammo-shotgun', 'ammo-bfg'].includes(item.kind) || item.roomIndex !== activeRoom) continue;
    const distance = Math.hypot(item.x - state.player.x, item.y - state.player.y);
    if (distance < best) { best = distance; nearest = item; }
  }
  return nearest;
}
function getNearestLobbyScroll(maxDistance = 1.55) { if (state.room !== 0 || lobbyPortfolioScroll.recovered) return null; const distance = Math.hypot(lobbyPortfolioScroll.x - state.player.x, lobbyPortfolioScroll.y - state.player.y); return distance < maxDistance && hasLineOfSight(state.player.x, state.player.y, lobbyPortfolioScroll.x, lobbyPortfolioScroll.y) ? lobbyPortfolioScroll : null; }
function getNearestPromptScroll(maxDistance = 1.55) {
  if (state.room === 0 && !lobbyPortfolioScroll.recovered) {
    const lobbyDistance = Math.hypot(lobbyPortfolioScroll.x - state.player.x, lobbyPortfolioScroll.y - state.player.y);
    if (lobbyDistance < maxDistance && hasLineOfSight(state.player.x, state.player.y, lobbyPortfolioScroll.x, lobbyPortfolioScroll.y)) return lobbyPortfolioScroll;
  }
  let nearest = null;
  let best = maxDistance;
  for (const item of worldItems) {
    if (item.recovered || item.roomIndex !== currentRoomIndex() || item.kind !== 'scroll') continue;
    const distance = Math.hypot(item.x - state.player.x, item.y - state.player.y);
    if (distance < best) {
      best = distance;
      nearest = item;
    }
  }
  return nearest;
}
function getNearestWeaponCreature(maxDistance = .78) {
  if (directDungeonStart || state.room !== 0 || typeof LOBBY_WEAPON_CREATURES === 'undefined') return null;
  let nearest = null;
  let best = maxDistance;
  for (const display of LOBBY_WEAPON_CREATURES) {
    const distance = Math.hypot(display.x - state.player.x, display.y - state.player.y);
    if (distance < best && hasLineOfSight(state.player.x, state.player.y, display.x, display.y)) {
      best = distance;
      nearest = display;
    }
  }
  return nearest;
}
function getNearestLobbyGuide(maxDistance = 1.15) {
  // Pip is a diegetic guide, not an interactable menu. Keep this helper for
  // compatibility with the renderer, but never expose an interaction prompt.
  if (directDungeonStart || state.room !== 0 || state.guideRun || state.guideWaitingForWeapon || typeof LOBBY_GUIDE === 'undefined') return null;
  const distance = Math.hypot(LOBBY_GUIDE.x - state.player.x, LOBBY_GUIDE.y - state.player.y);
  return distance <= maxDistance ? LOBBY_GUIDE : null;
}
function beginLobbyGuideSpeech(message, completion = null) {
  const nextMessage = message || LOBBY_GUIDE_MESSAGES[0];
  // Never let a new line overwrite the intentional blank beat after the prior
  // line. Queue it until the pause has fully elapsed.
  if (state.guideSpeechPause > 0) {
    state.guidePendingSpeech = { message: nextMessage, completion };
    return;
  }
  if (state.guideSpeechTarget === nextMessage && (state.guideSpeechActive || state.guideSpeechHold > 0)) return;
  state.guideSpeechTarget = nextMessage;
  state.guideSpeechVisible = '';
  state.guideSpeechElapsed = 0;
  state.guideSpeechHold = 0;
  state.guideSpeechVoiceTimer = 0;
  state.guideSpeechLastVoiceIndex = -1;
  state.guideSpeechCompletion = completion;
  state.guideSpeechActive = true;
  state.guideSpeechLayout = null;
  state.promptSignature = '';
}
function clearLobbyGuideSpeech() {
  state.guideSpeechTarget = '';
  state.guideSpeechVisible = '';
  state.guideSpeechElapsed = 0;
  state.guideSpeechHold = 0;
  state.guideSpeechPause = 0;
  state.guideSpeechVoiceTimer = 0;
  state.guideSpeechLastVoiceIndex = -1;
  state.guideSpeechActive = false;
  state.guideSpeechCompletion = null;
  state.guidePendingSpeech = null;
  state.guideSpeechLayout = null;
  state.promptSignature = '';
}
function completeLobbyGuideSpeech() {
  state.guideSpeechVisible = state.guideSpeechTarget;
  state.guideSpeechElapsed = state.guideSpeechTarget.length * LOBBY_GUIDE_TEXT_SPEED;
  state.guideSpeechActive = false;
  state.guideSpeechHold = LOBBY_GUIDE_SPEECH_HOLD;
  state.guideSpeechPause = LOBBY_GUIDE_SPEECH_HOLD;
  state.promptSignature = '';
}
function finishLobbyGuideSpeech() {
  completeLobbyGuideSpeech();
}
function updateLobbyGuideSpeech(delta) {
  if (!state.guideSpeechTarget && state.guideSpeechPause <= 0) return;
  if (!state.guideSpeechActive) {
    state.guideSpeechHold = Math.max(0, state.guideSpeechHold - delta);
    state.guideSpeechPause = Math.max(0, state.guideSpeechPause - delta);
    if (state.guideSpeechPause > 0 || state.guideSpeechHold > 0) return;
    const completion = state.guideSpeechCompletion;
    const pending = state.guidePendingSpeech;
    state.guidePendingSpeech = null;
    clearLobbyGuideSpeech();
    if (completion === 'release-controls' && !state.guideFarewellComplete) {
      state.guideControlsLocked = false;
      state.guideFarewellComplete = true;
      state.guideAdvanceStarted = true;
      updateHud();
    }
    if (pending) beginLobbyGuideSpeech(pending.message, pending.completion);
    if (state.guideDeferredRun) state.guideAutoTimer = .42;
    return;
  }

  state.guideSpeechElapsed += delta;
  const characterCount = Math.min(
    state.guideSpeechTarget.length,
    Math.floor(state.guideSpeechElapsed / LOBBY_GUIDE_TEXT_SPEED),
  );
  state.guideSpeechVisible = state.guideSpeechTarget.slice(0, characterCount);
  state.guideSpeechVoiceTimer = Math.max(0, state.guideSpeechVoiceTimer - delta);
  if (characterCount > 0 && state.guideSpeechVoiceTimer <= 0 && characterCount > state.guideSpeechLastVoiceIndex) {
    const voiceIndex = Math.max(0, characterCount - 1);
    if (state.guideSpeechTarget[voiceIndex] !== ' ') {
      playTrollTalk(Math.floor(voiceIndex / 5));
      state.guideSpeechLastVoiceIndex = voiceIndex;
      state.guideSpeechVoiceTimer = LOBBY_GUIDE_VOICE_INTERVAL;
    }
  }
  if (characterCount >= state.guideSpeechTarget.length) completeLobbyGuideSpeech();
}

function scheduleLobbyGuideRun(kind) {
  state.guideDeferredRun = kind;
  state.guideAutoTimer = state.guideSpeechActive ? -1 : .9;
}
function finishLobbyGuideIntro() {
  if (state.guideIntroPhase !== 'look') return;
  state.guideIntroPhase = 'complete';
  state.guideIntroElapsed = 0;
  state.guideControlsLocked = false;
  state.guideMovementTriggered = true;
  LOBBY_GUIDE.yaw = Math.PI;
  beginLobbyGuideSpeech(LOBBY_GUIDE_RUN_LINES.walkLesson);
  scheduleLobbyGuideRun('weapons');
  updateHud();
  showHitMarker('PIP · NOW WALK WITH WASD', 'shielded');
}
function updateLobbyGuideIntro(delta) {
  if (state.room !== 0 || state.guideIntroPhase !== 'look') return false;
  if (!state.guideIntroSpeechStarted) {
    state.guideIntroSpeechStarted = true;
    beginLobbyGuideSpeech(LOBBY_GUIDE_MESSAGES[0]);
    scheduleLobbyGuideRun('weapons');
    showHitMarker('PIP · WATCH AND LISTEN', 'shielded');
  }
  state.guideIntroElapsed += delta;
  const progress = clamp(state.guideIntroElapsed / 2.8, 0, 1);
  // Pip checks the route, the player, and the route again before committing.
  LOBBY_GUIDE.yaw = Math.PI + Math.sin(progress * TAU * 1.15) * .82 * (1 - progress * .18);
  if (progress >= 1) finishLobbyGuideIntro();
  return true;
}
function reactToLobbyWeaponPickup() {
  state.guideWeaponCollected = true;
  state.guideWaitingForWeapon = false;
  // A fast pickup is still a real tutorial event. Stop Pip wherever he is,
  // react immediately, then continue from that position toward the scroll.
  if (state.guideRun?.kind === 'weapons') {
    state.guideRun = null;
    state.guideDeferredRun = null;
    state.guideAutoTimer = -1;
  }
  if (state.guideWeaponReactionStarted) return;
  state.guideWeaponReactionStarted = true;
  beginLobbyGuideSpeech(LOBBY_GUIDE_RUN_LINES.weaponReaction);
  scheduleLobbyGuideRun('scroll');
  showHitMarker('PIP · THAT WAS FAST', 'good');
}
function triggerLobbyGuideFromMovement() {
  // The intro state machine starts Pip's conversation exactly once. This hook
  // remains for movement compatibility but must never restart the conversation.
  if (state.room !== 0 || state.guideMovementTriggered || state.guideIntroSpeechStarted) return;
  state.guideMovementTriggered = true;
}
function startLobbyGuideWeaponWait() {
  if (state.room !== 0 || state.guideRun || state.guideWeaponCollected) return;
  state.guideWaitingForWeapon = false;
  state.guideWeaponCollected = true;
  state.guideDeferredRun = null;
  state.guideAutoTimer = -1;
  reactToLobbyWeaponPickup();
}
function startLobbyGuideRun() {
  if (state.room !== 0 || state.guideRun) return;
  state.guideWaitingForWeapon = false;
  const targetX = lobbyPortfolioScroll.x - 1.0;
  const targetY = lobbyPortfolioScroll.y - 1.45;
  const distance = Math.hypot(targetX - LOBBY_GUIDE.x, targetY - LOBBY_GUIDE.y);
  state.guideRun = {
    kind: 'scroll',
    startX: LOBBY_GUIDE.x,
    startY: LOBBY_GUIDE.y,
    targetX,
    targetY,
    elapsed: 0,
    duration: clamp(distance / LOBBY_GUIDE_WALK_SPEED, 2.8, 8.5),
  };
  state.promptSignature = '';
}
function startLobbyGuideScrollReturnRun() {
  if (state.room !== 0 || state.guideRun || state.guideScrollReturnStarted) return;
  state.guideScrollReturnStarted = true;
  // Return to the route centerline, not the scroll's offset reading position.
  const targetX = lobbyPortfolioScroll.x - .18;
  const targetY = LOBBY_WEAPON_PATH_Y;
  const distance = Math.hypot(targetX - LOBBY_GUIDE.x, targetY - LOBBY_GUIDE.y);
  state.guideRun = {
    kind: 'scrollReturn',
    startX: LOBBY_GUIDE.x,
    startY: LOBBY_GUIDE.y,
    targetX,
    targetY,
    elapsed: 0,
    duration: clamp(distance / LOBBY_GUIDE_WALK_SPEED, 2.4, 7.2),
  };
  state.promptSignature = '';
}
function startLobbyGuideScrollInstructionRun() {
  if (state.room !== 0 || state.guideRun || state.guideScrollInstructionStarted) return;
  state.guideScrollInstructionStarted = true;
  const targetX = LOBBY_GATE.x - 1.0;
  const targetY = LOBBY_WEAPON_PATH_Y;
  const distance = Math.hypot(targetX - LOBBY_GUIDE.x, targetY - LOBBY_GUIDE.y);
  state.guideRun = {
    kind: 'ability',
    startX: LOBBY_GUIDE.x,
    startY: LOBBY_GUIDE.y,
    targetX,
    targetY,
    elapsed: 0,
    duration: clamp(distance / LOBBY_GUIDE_WALK_SPEED, 2.8, 8.5),
  };
  state.promptSignature = '';
}
function updateLobbyGuide(delta) {
  if (updateLobbyGuideIntro(delta)) return;
  state.guideTalkPulse = Math.max(0, state.guideTalkPulse - delta);
  if (!state.guideRun && state.guideDeferredRun && state.guideAutoTimer >= 0) {
    state.guideAutoTimer -= delta;
    if (state.guideAutoTimer <= 0) {
      const deferred = state.guideDeferredRun;
      state.guideDeferredRun = null;
      if (deferred === 'weapons') startLobbyGuideWeaponWait();
      else if (deferred === 'scroll') startLobbyGuideRun();
      else if (deferred === 'ability') startLobbyGuideScrollInstructionRun();
    }
  }
  if (!state.guideRun || state.room !== 0) return;
  const run = state.guideRun;
  // Speech and movement share the same beat, but Pip must not make the player
  // wait if they catch him. Advance the scripted walk faster inside the same
  // short catch-up radius while keeping the route monotonic.
  const playerGap = Math.hypot(state.player.x - LOBBY_GUIDE.x, state.player.y - LOBBY_GUIDE.y);
  const catchUpMultiplier = playerGap <= LOBBY_GUIDE_CATCH_UP_DISTANCE ? LOBBY_GUIDE_CATCH_UP_SPEED / LOBBY_GUIDE_WALK_SPEED : 1;
  run.elapsed += delta * catchUpMultiplier;
  const progress = clamp(run.elapsed / run.duration, 0, 1);
  const eased = progress < .5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
  LOBBY_GUIDE.x = lerp(run.startX, run.targetX, eased);
  LOBBY_GUIDE.y = lerp(run.startY, run.targetY, eased);
  LOBBY_GUIDE.yaw = LOBBY_GUIDE.x < run.targetX ? 0 : Math.PI;
  if (progress >= 1) {
    LOBBY_GUIDE.x = run.targetX;
    LOBBY_GUIDE.y = run.targetY;
    LOBBY_GUIDE.yaw = Math.PI;
    const runKind = run.kind || 'scroll';
    state.guideRun = null;
    state.guideTalkPulse = 1.2;
    state.promptSignature = '';
    if (runKind === 'farewell') {
      LOBBY_GUIDE.yaw = Math.atan2(state.player.y - LOBBY_GUIDE.y, state.player.x - LOBBY_GUIDE.x);
      beginLobbyGuideSpeech(LOBBY_GUIDE_RUN_LINES.farewell, 'release-controls');
    } else if (runKind === 'weapons') {
      if (state.guideWeaponCollected) {
        state.guideWaitingForWeapon = false;
        reactToLobbyWeaponPickup();
      } else {
        state.guideWaitingForWeapon = true;
        beginLobbyGuideSpeech(LOBBY_GUIDE_RUN_LINES.weaponWait);
        showHitMarker('ASSAULT RIFLE READY', 'shielded');
      }
    } else if (runKind === 'scrollReturn') {
      beginLobbyGuideSpeech(LOBBY_GUIDE_RUN_LINES.scrollReturn);
      scheduleLobbyGuideRun('ability');
    } else if (runKind === 'scroll') {
      beginLobbyGuideSpeech(LOBBY_GUIDE_RUN_LINES.scrollApproach);
    } else if (runKind === 'ability') {
      // Pip remains beside the gate, not in its interaction lane.
    }
  }
}
function noteLobbyPlayerMovement() {
  if (state.room === 0 && state.weapon.moving) triggerLobbyGuideFromMovement();
}

function lobbyGateDistance() { return (!directDungeonStart && state.room === 0 && LOBBY_GATE) ? Math.hypot(LOBBY_GATE.x - state.player.x, LOBBY_GATE.y - state.player.y) : Infinity; }
function weaponDefinition() { return WEAPON_LOADOUTS[state.weapon.type] || WEAPON_LOADOUTS.arsenal; }
function ensureWeaponAmmo(type = state.weapon.type) {
  const definition = WEAPON_LOADOUTS[type];
  if (!definition?.magazineSize) return;
  const storedAmmo = Number.isFinite(state.weapon.ammoByType[type])
    ? state.weapon.ammoByType[type]
    : definition.magazineSize;
  const storedReserve = Number.isFinite(state.weapon.reserveByType[type])
    ? state.weapon.reserveByType[type]
    : definition.reserveAmmo;
  state.weapon.ammoByType[type] = clamp(Math.floor(storedAmmo), 0, definition.magazineSize);
  state.weapon.reserveByType[type] = Math.max(0, Math.floor(storedReserve));
  if (type === state.weapon.type) {
    state.weapon.ammo = state.weapon.ammoByType[type];
    state.weapon.reserveAmmo = state.weapon.reserveByType[type];
    state.weapon.magazineSize = definition.magazineSize;
    state.weapon.reloadTime = definition.reloadTime;
  }
}
function syncWeaponAmmo() {
  const type = state.weapon.type;
  const definition = WEAPON_LOADOUTS[type];
  if (!definition?.magazineSize) return;
  state.weapon.ammo = clamp(Math.floor(Number(state.weapon.ammo) || 0), 0, definition.magazineSize);
  state.weapon.reserveAmmo = Math.max(0, Math.floor(Number(state.weapon.reserveAmmo) || 0));
  state.weapon.ammoByType[type] = state.weapon.ammo;
  state.weapon.reserveByType[type] = state.weapon.reserveAmmo;
}
function loadShotgunShell(index) {
  if (state.weapon.type !== 'shotgun' || state.weapon.reloadShellsLoaded >= state.weapon.reloadShellsToLoad) return;
  const key = index === 0 ? 'shotgunShellFirst' : 'shotgunShell';
  const loaded = playAudioBuffer(key, .32, { playbackRate: index === 0 ? 1 : 1.02 });
  if (!loaded) {
    playMechanicalClick(0, .018);
    playNoiseSweep(.08, .014, 'lowpass', 760, 180, .1, .7);
  }
  state.weapon.ammo += 1;
  state.weapon.reserveAmmo = Math.max(0, state.weapon.reserveAmmo - 1);
  state.weapon.reloadShellsLoaded += 1;
  syncWeaponAmmo();
  showToast(`LOADING SHELL ${state.weapon.reloadShellsLoaded}/${state.weapon.reloadShellsToLoad}...`);
  updateCombatHud();
}
function reloadWeapon() {
  const definition = weaponDefinition();
  const magazineFull = state.weapon.ammo >= definition.magazineSize;
  if (!state.weapon.equipped || !definition.magazineSize || state.weapon.reloadTimer > 0 || state.weapon.reserveAmmo <= 0 || magazineFull) return false;
  syncWeaponAmmo();
  state.weapon.swing = 0;
  state.weapon.cooldown = Math.max(state.weapon.cooldown, .08);
  state.mouseAttack = false;
  state.hudSignature = '';
  if (state.weapon.type === 'shotgun') {
    const shellCount = Math.min(definition.magazineSize - state.weapon.ammo, state.weapon.reserveAmmo);
    state.weapon.reloadShellsToLoad = shellCount;
    state.weapon.reloadShellsLoaded = 0;
    state.weapon.reloadElapsed = 0;
    state.weapon.reloadShellInterval = .68;
    state.weapon.reloadTimer = Math.max(.36, shellCount * state.weapon.reloadShellInterval + .22);
    loadShotgunShell(0);
    showToast(`LOADING SHELL 1/${shellCount}...`);
  } else {
    state.weapon.reloadShellsToLoad = 0;
    state.weapon.reloadShellsLoaded = 0;
    state.weapon.reloadElapsed = 0;
    state.weapon.reloadTimer = definition.reloadTime;
    showToast(`RELOADING ${definition.label.toUpperCase()}...`);
  }
  updateCombatHud();
  if (state.weapon.type === 'bfg') {
    playLowThump(42, .18, .022);
    playNoiseSweep(.14, .014, 'bandpass', 600, 180, .08, .7);
  } else {
    playMechanicalClick(0, .016);
    playMechanicalClick(.16, .012);
    playLowThump(58, .012, .012, .03);
  }
  return true;
}
function finishReload() {
  const definition = weaponDefinition();
  if (!definition.magazineSize) return;
  ensureWeaponAmmo(state.weapon.type);
  const needed = Math.max(0, definition.magazineSize - state.weapon.ammo);
  const loaded = Math.min(needed, state.weapon.reserveAmmo);
  state.weapon.ammo += loaded;
  state.weapon.reserveAmmo -= loaded;
  state.weapon.reloadTimer = 0;
  state.weapon.reloadElapsed = 0;
  state.weapon.reloadShellsToLoad = 0;
  state.weapon.reloadShellsLoaded = 0;
  state.weapon.reloadShellInterval = 0;
  syncWeaponAmmo();
  state.hudSignature = '';
  updateCombatHud();
  showToast(`${definition.label.toUpperCase()} READY · ${state.weapon.ammo}/${state.weapon.reserveAmmo}`, 'good');
  if (state.weapon.type === 'shotgun') {
    playMetallicAction(0, .012);
  } else if (state.weapon.type === 'bfg') {
    playNoiseSweep(.1, .014, 'bandpass', 900, 260, 0, .8);
    playLowThump(54, .12, .016, .04);
  } else {
    playMechanicalClick(0, .012);
    playLowThump(82, .1, .014, .045);
  }
}
function consumeWeaponAmmo(amount = 1) {
  const definition = weaponDefinition();
  if (!definition.magazineSize) return true;
  ensureWeaponAmmo(state.weapon.type);
  if (state.weapon.ammo < amount) { reloadWeapon(); return false; }
  state.weapon.ammo -= amount;
  syncWeaponAmmo();
  updateCombatHud();
  return true;
}

function learnedAbilityDefinitions() { return [...(state.tutorialAbility ? [GATE_TUTORIAL_ABILITY] : []), ...ABILITY_FORMS.filter((ability) => state.unlockedAbilitys.has(ability.id))]; }
function selectedAbilityDefinition() {
  const learned = learnedAbilityDefinitions();
  if (!learned.length) return null;
  return learned.find((ability) => ability.id === state.selectedAbilityId) || learned[learned.length - 1];
}
function selectAbility(abilityId, announce = true) {
  const ability = learnedAbilityDefinitions().find((entry) => entry.id === abilityId);
  if (!ability) return false;
  state.selectedAbilityId = ability.id;
  state.abilityCyclePulse = 1;
  state.promptSignature = '';
  state.hudSignature = '';
  if (announce) showToast(`${ability.name} selected.`, 'good');
  spawnParticles(state.player.x, state.player.y, EYE_HEIGHT, ability.color, settings.reducedMotion ? 3 : 8, { speed: .8, life: .42, size: .75, glow: 10, upward: .4 });
  updateHud();
  return true;
}
function cycleAbility(direction = 1) {
  const learned = learnedAbilityDefinitions();
  if (!learned.length) { showToast('Use the route, not a collectible, to learn how the work fits together.'); return; }
  const foundIndex = learned.findIndex((ability) => ability.id === state.selectedAbilityId);
  const currentIndex = foundIndex >= 0 ? foundIndex : (direction > 0 ? -1 : 0);
  const nextIndex = (currentIndex + direction + learned.length) % learned.length;
  state.abilityCycleDirection = direction >= 0 ? 1 : -1;
  selectAbility(learned[nextIndex].id);
}
function wandColorForAbility() { return selectedAbilityDefinition()?.color || '#c76545'; }
function wandAbilityName() { return selectedAbilityDefinition()?.name || 'unattuned ember'; }
function updateWeaponSelection(type) {
  if (!WEAPON_LOADOUTS[type]) return false;
  state.weapon.type = type;
  weaponOptionButtons.forEach((button) => {
    const selected = button.dataset.weapon === type;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-checked', String(selected));
  });
  if (loadoutDescription) loadoutDescription.textContent = WEAPON_LOADOUTS[type].description;
  return true;
}
function setWeapon(type) {
  if (!WEAPON_LOADOUTS[type]) return;
  const previousType = state.weapon.type;
  syncWeaponAmmo();
  updateWeaponSelection(type);
  state.weapon.type = type;
  ensureWeaponAmmo(type);
  state.weapon.equipped = true;
  state.weapon.swing = 0;
  state.weapon.hit = false;
  state.weapon.cooldown = 0;
  state.weapon.reloadTimer = 0;
  state.weapon.projectile = 0;
  state.weapon.muzzleFlash = 0;
  state.promptSignature = '';
  if (!state.menuActive && previousType !== type) {
    markVisorTutorial('weapon');
    if (!state.levelPreview) {
      const color = WEAPON_LOADOUTS[type].impactColor;
      pushImpactBurst({ x: state.player.x, y: state.player.y, z: EYE_HEIGHT, elapsed: 0, duration: .24, color, radius: .22 });
      showToast(`${WEAPON_LOADOUTS[type].label} equipped.`, 'good');
      playWeaponEquipSound(type);
    }
  }
}

function currentAbilityDefinition() {
  return selectedAbilityDefinition();
}
function levelForXp(xp) {
  let level = 0;
  for (const ability of ABILITY_FORMS) if (xp >= ability.threshold) level += 1;
  return level;
}
function newlyUnlockedAbilitys(previousXp, nextXp) {
  return ABILITY_FORMS.filter((ability) => previousXp < ability.threshold && nextXp >= ability.threshold);
}
function earnExperience(amount, source = 'field work') {
  const previousXp = state.xp;
  state.xp += amount;
  const unlocked = newlyUnlockedAbilitys(previousXp, state.xp);
  for (const ability of unlocked) state.unlockedAbilitys.add(ability.id);
  state.level = levelForXp(state.xp);
  if (unlocked.length) {
    state.lastAbility = unlocked[unlocked.length - 1];
    state.selectedAbilityId = state.lastAbility.id;
    spawnParticles(state.player.x, state.player.y, EYE_HEIGHT, state.lastAbility.color, 22, { speed: 1.8, life: 1.05, size: 1.2, glow: 16, upward: .8, trail: true });
    showToast(`Level ${state.level}: ${unlocked.map((ability) => ability.name).join(', ')} unlocked.`, 'good');
    playAbilitySound();
  } else if (source !== 'scroll') {
    showToast(`+${amount} XP from ${source}.`, 'good');
  }
  updateHud();
  return unlocked;
}
function updateScrollProgress() {
  if (!scrollProgressLabel || !scrollProgressValue || !scrollProgressBar || !scrollProgressCaption) return;
  const nextAbility = ABILITY_FORMS.find((ability) => state.xp < ability.threshold);
  if (!nextAbility) {
    scrollProgressLabel.textContent = 'ABILITYBOOK COMPLETE';
    scrollProgressValue.textContent = `${state.xp} XP · ALL ABILITYS LEARNED`;
    scrollProgressBar.style.width = '100%';
    scrollProgressCaption.textContent = 'Every recorded route is now available to cast.';
    return;
  }
  const abilityIndex = ABILITY_FORMS.indexOf(nextAbility);
  const previousThreshold = abilityIndex > 0 ? ABILITY_FORMS[abilityIndex - 1].threshold : 0;
  const progress = clamp((state.xp - previousThreshold) / (nextAbility.threshold - previousThreshold), 0, 1);
  scrollProgressLabel.textContent = 'PROGRESS TO NEXT ABILITY';
  scrollProgressValue.textContent = `${state.xp} / ${nextAbility.threshold} XP`;
  scrollProgressBar.style.width = `${progress * 100}%`;
  scrollProgressCaption.textContent = `${nextAbility.name} unlocks at ${nextAbility.threshold} XP.`;
}
function updateAbilityCard(gained, unlocked = null) {
  scrollAbility?.classList.remove('ability-revealed');
  if (scrollAbility) void scrollAbility.offsetWidth;
  scrollAbility?.classList.add('ability-revealed');
  if (scrollAbilitySeal) scrollAbilitySeal.textContent = unlocked?.glyph || '✦';
  if (scrollRewardKicker) scrollRewardKicker.textContent = unlocked ? 'NEW ABILITY UNLOCKED' : 'XP RECOVERED';
  if (scrollAbilityName) scrollAbilityName.textContent = unlocked ? unlocked.name : `+${gained} XP`;
  if (scrollAbilityDescription) scrollAbilityDescription.textContent = unlocked ? `${unlocked.description} Use Q to cast it.` : 'Bank XP from completed case studies and defeated enemies to unlock abilities at each threshold.';
}
function grantScrollXP(item) {
  const recordId = item.recordId || item.id;
  if (state.collectedRecordIds.has(recordId)) {
    updateAbilityCard(0, null);
    showToast('This case study is already in your archive.', 'good');
    return;
  }
  state.collectedRecordIds.add(recordId);
  const unlocked = earnExperience(XP_PER_SCROLL, 'scroll');
  updateAbilityCard(XP_PER_SCROLL, unlocked[0] || null);
  if (!unlocked.length) showToast(`+${XP_PER_SCROLL} XP banked. ${state.xp} XP total.`, 'good');
}
function chooseAbilityTarget() {
  return findAimTarget(14, .32) || worldEnemies.filter((enemy) => enemy.roomIndex === state.room && !enemy.dead).sort((a, b) => Math.hypot(a.x - state.player.x, a.y - state.player.y) - Math.hypot(b.x - state.player.x, b.y - state.player.y))[0] || (state.room === FINAL_ROOM_INDEX && state.finalBoss && !state.finalBoss.dead ? state.finalBoss : null);
}
function makeProjectile(kind, origin, velocity, options = {}) {
  state.projectiles.push({ kind, x: origin.x, y: origin.y, z: origin.z, vx: velocity.x, vy: velocity.y, vz: velocity.z || 0, spin: Math.random() * TAU, radius: options.radius || .1, damage: options.damage || 0, color: options.color || '#e7ad67', lifetime: options.lifetime || 2.5, maxLifetime: options.lifetime || 2.5, homing: options.homing || 0, targetId: options.targetId || null, source: options.source || 'player', sourceId: options.sourceId || null, ability: options.ability || false, abilityKind: options.abilityKind || null, trail: [], origin: { ...origin }, aoe: options.aoe || 0, stun: options.stun || 0, stagger: options.stagger || 0, knockback: options.knockback || 0, critChance: options.critChance || 0, critMultiplier: options.critMultiplier || 1.65, beam: options.beam || false, collisionHeight: options.collisionHeight || .55, chainTargets: options.chainTargets || 0, trailSize: options.trailSize || 1, orbit: options.orbit || 0, sparks: options.sparks || 0, spriteSheet: options.spriteSheet || null, spriteFrameCount: options.spriteFrameCount || 8, spriteFps: options.spriteFps || 12, spriteWorldHeight: options.spriteWorldHeight || .42, age: 0 });
}
function playerAimDirection() {
  return { x: Math.cos(state.player.angle), y: Math.sin(state.player.angle), z: 0 };
}
function leftHandAbilityOrigin(direction) {
  const leftX = -Math.sin(state.player.angle);
  const leftY = Math.cos(state.player.angle);
  return {
    x: state.player.x + leftX * .48 + direction.x * .3,
    y: state.player.y + leftY * .48 + direction.y * .3,
    z: EYE_HEIGHT - .3 + direction.z * .12,
  };
}
function abilityProjectileOrigin(direction) {
  return {
    x: state.player.x + direction.x * .34,
    y: state.player.y + direction.y * .34,
    z: EYE_HEIGHT + direction.z * .08,
  };
}
function castAbility() {
  const ability = selectedAbilityDefinition();
  if (state.menuActive || state.reading || state.launchTransition || state.transition || state.forestTransition || state.gameComplete) return;
  if (!ability) { showToast('Equip a weapon to open the archive gate.'); return; }
  if (ability.kind === 'gate') {
    if (!state.weapon.equipped) {
      showToast('Equip a weapon before opening the archive gate.');
      return;
    }
    if (state.room !== 0 || lobbyGateDistance() > LOBBY_GATE_ABILITY_RANGE) {
      showToast('Archive Key only works at the sealed archive gate.');
      return;
    }
    if (state.lobbyGateOpen || state.lobbyGateOpening) {
      showToast('The archive gate is already open.', 'good');
      return;
    }
    state.abilityCast = { ability, elapsed: 0, duration: .72, source: 'ability-focus' };
    state.activeAbilityEffects.push({ kind: 'gate-key', elapsed: 0, duration: 1.1, color: ability.color, rings: 4 });
    spawnAbilityParticles(ability, { x: LOBBY_GATE.x, y: LOBBY_GATE.y, z: 1 }, { x: 1, y: 0, z: 0 });
    openLobbyGate();
    playAbilitySound();
    showToast('Archive Key cast. The gate is opening.', 'good');
    return;
  }
  if (state.abilityCooldown > 0) { showToast(`${ability.name} is recharging.`); return; }
  state.abilityCooldown = ability.cooldown;
  state.abilityCast = { ability, elapsed: 0, duration: .72, source: 'ability-focus' };
  spawnParticles(state.player.x, state.player.y, EYE_HEIGHT, ability.color, settings.reducedMotion ? 5 : 12, { speed: 1.1, life: .55, size: .8, glow: 14, upward: .45, trail: true });
  pushImpactBurst({ x: state.player.x, y: state.player.y, z: EYE_HEIGHT, elapsed: 0, duration: .32, color: ability.color, radius: .28 });
  const direction = playerAimDirection();
  const origin = abilityProjectileOrigin(direction);
  spawnAbilityParticles(ability, origin, direction);
  const target = chooseAbilityTarget();
  if (ability.kind === 'reveal') {
    state.revealTimer = 7;
    pushImpactBurst({ x: state.player.x, y: state.player.y, z: .58, elapsed: 0, duration: 1.2, color: ability.color, radius: 3.4, style: 'radar' });
    state.activeAbilityEffects.push({ kind: 'reveal', elapsed: 0, duration: 1.75, color: ability.color, rings: 4 });
  } else if (ability.kind === 'homing') {
    makeProjectile('ability-orb', origin, { x: direction.x * 5.4, y: direction.y * 5.4, z: direction.z * 5.4 }, { color: ability.color, damage: 72, radius: .18, lifetime: 3, homing: 4.2, targetId: target?.id, trailSize: 1.65, orbit: 2, sparks: 5, ability: true, abilityKind: ability.kind });
  } else if (ability.kind === 'ward') {
    state.wardTimer = 7;
    state.activeAbilityEffects.push({ kind: 'ward', elapsed: 0, duration: 7, color: ability.color, rings: 6 });
  } else if (ability.kind === 'chain') {
    makeProjectile('ability-chain', origin, { x: direction.x * 7.2, y: direction.y * 7.2, z: direction.z * 7.2 }, { color: ability.color, damage: 84, radius: .13, lifetime: 1.8, targetId: target?.id, aoe: 2.4, stun: .9, chainTargets: 3, trailSize: 2.05, orbit: 3, sparks: 7, ability: true, abilityKind: ability.kind });
  } else if (ability.kind === 'echo') {
    state.player.hp = clamp(state.player.hp + 35, 0, 100);
    state.enemySlowTimer = 4;
    state.activeAbilityEffects.push({ kind: 'echo', elapsed: 0, duration: 1.7, color: ability.color, rings: 5 });
    pushImpactBurst({ x: state.player.x, y: state.player.y, z: .6, elapsed: 0, duration: 1.1, color: ability.color, radius: 2.2 });
  } else if (ability.kind === 'fireball') {
    makeProjectile('ability-fireball', origin, { x: direction.x * 6.2, y: direction.y * 6.2, z: direction.z * 6.2 }, { color: ability.color, damage: 105, radius: .2, lifetime: 2.5, aoe: 1.65, trailSize: 2.35, orbit: 2, sparks: 9, ability: true, abilityKind: ability.kind });
  } else if (ability.kind === 'bloom') {
    state.player.hp = clamp(state.player.hp + 24, 0, 100);
    for (const enemy of allHostiles()) if (Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y) < 3.2) damageHostile(enemy, 64, { stun: 1.1 });
    state.activeAbilityEffects.push({ kind: 'bloom', elapsed: 0, duration: 1.8, color: ability.color, rings: 8 });
  } else if (ability.kind === 'beam') {
    const beamEnd = { x: state.player.x + direction.x * 12, y: state.player.y + direction.y * 12, z: EYE_HEIGHT + direction.z * 12 };
    state.activeAbilityEffects.push({ kind: 'beam', elapsed: 0, duration: .9, color: ability.color, start: origin, end: beamEnd, rings: 5 });
    for (const enemy of allHostiles()) {
      if (distanceToAimLine(enemy, direction) < .68 && hasLineOfSight(state.player.x, state.player.y, enemy.x, enemy.y)) {
        spawnAbilityImpactParticles(ability.kind, enemy.x, enemy.y, hostileAimHeight(enemy), ability.color, .9);
        damageHostile(enemy, 150, { stun: 1.6 });
      }
    }
  }
  playAbilitySound();
  showToast(`${ability.name}: ${ability.effect}.`, 'good');
}
function updateAbility(delta) {
  state.abilityCyclePulse = Math.max(0, state.abilityCyclePulse - delta * 1.8);
  state.abilityCooldown = Math.max(0, state.abilityCooldown - delta);
  state.revealTimer = Math.max(0, state.revealTimer - delta);
  state.wardTimer = Math.max(0, state.wardTimer - delta);
  state.enemySlowTimer = Math.max(0, state.enemySlowTimer - delta);
  if (state.abilityCast) {
    state.abilityCast.elapsed += delta;
    if (state.abilityCast.elapsed >= state.abilityCast.duration) state.abilityCast = null;
  }
  state.activeAbilityEffects = state.activeAbilityEffects.filter((effect) => { effect.elapsed += delta; return effect.elapsed < effect.duration; });
  state.impactBursts = state.impactBursts.filter((burst) => { burst.elapsed += delta; return burst.elapsed < burst.duration; });
}
const ABILITY_FOCUS_PROFILES = {
  gate: { shape: 'rune', accent: '#e9e9e0', count: 10, speed: .5, life: .84, size: .38, spread: TAU, gravity: -.1, upward: .34, glow: 18 },
  reveal: { shape: 'ring', accent: '#b8f0e2', count: 10, speed: .62, life: .82, size: .34, spread: TAU, gravity: -.08, upward: .24, glow: 18 },
  homing: { shape: 'star', accent: '#fff1b0', count: 13, speed: 1.05, life: .64, size: .31, spread: .8, gravity: .02, upward: .1, glow: 18 },
  ward: { shape: 'rune', accent: '#fff8d6', count: 11, speed: .46, life: 1.05, size: .34, spread: TAU, gravity: -.12, upward: .38, glow: 19 },
  chain: { shape: 'thread', accent: '#b8f0e2', count: 14, speed: 1.18, life: .56, size: .29, spread: .7, gravity: .02, upward: .12, glow: 17 },
  echo: { shape: 'ring', accent: '#e6c8ff', count: 11, speed: .56, life: 1.02, size: .36, spread: TAU, gravity: -.1, upward: .28, glow: 18 },
  fireball: { shape: 'ember', accent: '#f3b34e', count: 17, speed: .86, life: .72, size: .43, spread: 1.05, gravity: -.34, upward: .62, glow: 23 },
  bloom: { shape: 'petal', accent: '#b8f0e2', count: 13, speed: .62, life: 1.08, size: .38, spread: TAU, gravity: -.18, upward: .5, glow: 18 },
  beam: { shape: 'thread', accent: '#fff8d6', count: 14, speed: 1.25, life: .48, size: .26, spread: .18, gravity: .02, upward: .08, glow: 19 },
};
const DEFAULT_ABILITY_FOCUS_PROFILE = { shape: 'dot', accent: '#fff1b0', count: 9, speed: .55, life: .76, size: .32, spread: TAU, gravity: -.06, upward: .2, glow: 16 };
function abilityFocusProfile(kind) { return ABILITY_FOCUS_PROFILES[kind] || DEFAULT_ABILITY_FOCUS_PROFILE; }

function drawAbilityScreenMotif(kind, x, y, radius, now, alpha = 1, phase = 0, direction = 0) {
  const accent = abilityFocusProfile(kind).accent;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(direction);
  ctx.globalAlpha = alpha;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowBlur = Math.max(8, radius * .9);
  ctx.shadowColor = accent;
  if (kind === 'fireball') {
    for (let flame = 0; flame < 5; flame += 1) {
      const angle = phase + flame * TAU / 5;
      const distance = radius * (1.08 + .16 * Math.sin(now / 120 + flame));
      ctx.save();
      ctx.translate(Math.cos(angle) * distance, Math.sin(angle) * distance);
      ctx.rotate(angle + Math.PI / 2);
      ctx.fillStyle = flame % 2 ? '#f3b34e' : accent;
      ctx.beginPath();
      ctx.moveTo(0, -radius * .95);
      ctx.quadraticCurveTo(radius * .62, -radius * .18, 0, radius * .56);
      ctx.quadraticCurveTo(-radius * .5, -radius * .18, 0, -radius * .95);
      ctx.fill();
      ctx.restore();
    }
  } else if (kind === 'bloom') {
    ctx.fillStyle = accent;
    for (let petal = 0; petal < 6; petal += 1) {
      const angle = phase + petal * TAU / 6;
      ctx.save();
      ctx.rotate(angle);
      ctx.beginPath(); ctx.ellipse(0, -radius * 1.42, radius * .24, radius * .62, 0, 0, TAU); ctx.fill();
      ctx.restore();
    }
  } else if (kind === 'chain' || kind === 'beam') {
    ctx.strokeStyle = accent;
    ctx.lineWidth = Math.max(1, radius * .12);
    for (let spark = 0; spark < 4; spark += 1) {
      const angle = phase + spark * Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * radius * 1.05, Math.sin(angle) * radius * 1.05);
      ctx.lineTo(Math.cos(angle + .18) * radius * 1.7, Math.sin(angle + .18) * radius * 1.7);
      ctx.stroke();
    }
  } else if (kind === 'ward' || kind === 'gate') {
    ctx.strokeStyle = accent;
    ctx.lineWidth = Math.max(1, radius * .09);
    ctx.beginPath();
    for (let point = 0; point <= 4; point += 1) {
      const angle = phase + point * TAU / 4 - Math.PI / 4;
      const distance = radius * 1.52;
      const px = Math.cos(angle) * distance;
      const py = Math.sin(angle) * distance;
      if (point === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  } else {
    ctx.strokeStyle = accent;
    ctx.lineWidth = Math.max(1, radius * .08);
    ctx.beginPath(); ctx.arc(0, 0, radius * 1.52, phase, phase + Math.PI * 1.55); ctx.stroke();
  }
  ctx.restore();
}
function addAbilityCameraBox(faces, center, dimensions, color, shade = 1, material = 'steel') {
  addBoxFaces(faces, makeBoxPoints(center, dimensions, 0, (point) => point), color, shade, material);
}
function vividAbilityRgb(color) {
  if (color && typeof color === 'object') return { r: color.r, g: color.g, b: color.b };
  const value = String(color || '#fff1b0').replace('#', '');
  const normalized = value.length === 3 ? value.split('').map((part) => part + part).join('') : value.padEnd(6, 'f').slice(0, 6);
  const number = Number.parseInt(normalized, 16);
  return { r: (number >> 16) & 255, g: (number >> 8) & 255, b: number & 255 };
}
function mixAbilityRgb(first, second, amount) {
  const t = clamp(amount, 0, 1);
  return { r: Math.round(lerp(first.r, second.r, t)), g: Math.round(lerp(first.g, second.g, t)), b: Math.round(lerp(first.b, second.b, t)) };
}
function abilityRgbCss(color, alpha = 1) { return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`; }
function abilityVisualPalette(ability) {
  const profile = abilityFocusProfile(ability?.kind);
  const base = vividAbilityRgb(ability?.color || '#6ce0c2');
  const accent = vividAbilityRgb(profile.accent);
  const deep = mixAbilityRgb(base, { r: 21, g: 12, b: 30 }, .48);
  const light = mixAbilityRgb(mixAbilityRgb(base, accent, .42), { r: 255, g: 248, b: 214 }, .54);
  const glow = mixAbilityRgb(base, accent, .58);
  return { base, accent, deep, light, glow };
}
function abilityRoundRectPath(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
function drawAbilityGlyphSurface(blocks, palette, alpha, active) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = alpha * (active ? .18 : .1);
  for (const block of blocks) {
    const projected = projectCameraPoint({ side: block.side, forward: block.frontForward, z: block.z });
    if (!projected) continue;
    const width = block.cell * focalX() / block.frontForward * .98;
    const height = block.cell * focalY() / block.frontForward * .98;
    const radius = Math.max(1.5, Math.min(width, height) * .18);
    const gradient = ctx.createLinearGradient(projected.x, projected.y - height / 2, projected.x, projected.y + height / 2);
    gradient.addColorStop(0, abilityRgbCss(palette.light, .95));
    gradient.addColorStop(.38, abilityRgbCss(block.highlight ? palette.accent : palette.base, .94));
    gradient.addColorStop(1, abilityRgbCss(palette.deep, .95));
    ctx.fillStyle = gradient;
    ctx.strokeStyle = abilityRgbCss(palette.light, active ? .7 : .45);
    ctx.lineWidth = Math.max(.7, Math.min(width, height) * .045);
    abilityRoundRectPath(projected.x - width / 2, projected.y - height / 2, width, height, radius);
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = alpha * (active ? .34 : .22);
    ctx.strokeStyle = abilityRgbCss(palette.light, .9);
    ctx.lineWidth = Math.max(.6, Math.min(width, height) * .035);
    ctx.beginPath();
    ctx.moveTo(projected.x - width * .28, projected.y - height * .27);
    ctx.lineTo(projected.x + width * .2, projected.y - height * .27);
    ctx.stroke();
    ctx.globalAlpha = alpha * (active ? .18 : .1);
  }
  ctx.restore();
}
function abilityMeshPoint(center, side, forward, z, roll = 0) {
  const cosine = Math.cos(roll);
  const sine = Math.sin(roll);
  return {
    side: center.side + side * cosine - z * sine,
    forward: center.forward + forward,
    z: center.z + side * sine + z * cosine,
  };
}
function addAbilityCrystalMesh(faces, center, radius, depth, height, roll, color, shade = 1, material = null) {
  const ring = [];
  for (let index = 0; index < 6; index += 1) {
    const angle = index * TAU / 6;
    ring.push(abilityMeshPoint(center, Math.cos(angle) * radius, Math.sin(angle) * depth, 0, roll));
  }
  const top = abilityMeshPoint(center, 0, 0, height * .5, roll);
  const bottom = abilityMeshPoint(center, 0, 0, -height * .5, roll);
  for (let index = 0; index < ring.length; index += 1) {
    const next = (index + 1) % ring.length;
    faces.push({ points: [top, ring[index], ring[next]], color, shade: shade * (.76 + (index % 3) * .1), material });
    faces.push({ points: [bottom, ring[next], ring[index]], color, shade: shade * (.58 + ((index + 1) % 3) * .1), material });
  }
}
function addAbilityOrbMesh(faces, center, radius, depth, color, shade = 1, material = null) {
  const latitudes = [-Math.PI / 2, -Math.PI / 4, 0, Math.PI / 4, Math.PI / 2];
  const segments = 8;
  const rings = latitudes.map((latitude) => {
    const ringRadius = Math.cos(latitude) * radius;
    return Array.from({ length: segments }, (_, index) => {
      const longitude = index * TAU / segments;
      return abilityMeshPoint(center, Math.cos(longitude) * ringRadius, Math.sin(longitude) * ringRadius * depth / radius, Math.sin(latitude) * radius);
    });
  });
  for (let row = 0; row < rings.length - 1; row += 1) {
    for (let index = 0; index < segments; index += 1) {
      const next = (index + 1) % segments;
      faces.push({ points: [rings[row][index], rings[row][next], rings[row + 1][next], rings[row + 1][index]], color, shade: shade * (.72 + ((index + row) % 4) * .09), material });
    }
  }
}
function addAbilityTorusMesh(faces, center, radius, tube, roll, color, shade = 1, material = null, segments = 10) {
  const tubeSegments = 4;
  const rings = [];
  for (let major = 0; major < segments; major += 1) {
    const majorAngle = major * TAU / segments;
    rings.push([]);
    for (let minor = 0; minor < tubeSegments; minor += 1) {
      const minorAngle = minor * TAU / tubeSegments;
      const localRadius = radius + Math.cos(minorAngle) * tube;
      rings[major].push(abilityMeshPoint(center, Math.cos(majorAngle) * localRadius, Math.sin(minorAngle) * tube, Math.sin(majorAngle) * localRadius, roll));
    }
  }
  for (let major = 0; major < segments; major += 1) {
    const nextMajor = (major + 1) % segments;
    for (let minor = 0; minor < tubeSegments; minor += 1) {
      const nextMinor = (minor + 1) % tubeSegments;
      faces.push({ points: [rings[major][minor], rings[nextMajor][minor], rings[nextMajor][nextMinor], rings[major][nextMinor]], color, shade: shade * (.68 + ((major + minor) % 3) * .12), material });
    }
  }
}
function addAbilityPlateMesh(faces, center, width, height, depth, roll, color, shade = 1, material = null) {
  const bevel = Math.min(width, height) * .16;
  const profile = [
    { side: -width / 2 + bevel, z: -height / 2 },
    { side: width / 2 - bevel, z: -height / 2 },
    { side: width / 2, z: -height / 2 + bevel },
    { side: width / 2, z: height / 2 - bevel },
    { side: width / 2 - bevel, z: height / 2 },
    { side: -width / 2 + bevel, z: height / 2 },
    { side: -width / 2, z: height / 2 - bevel },
    { side: -width / 2, z: -height / 2 + bevel },
  ];
  const front = profile.map((point) => abilityMeshPoint(center, point.side, depth / 2, point.z, roll));
  const back = profile.map((point) => abilityMeshPoint(center, point.side, -depth / 2, point.z, roll));
  faces.push({ points: front, color, shade, material });
  faces.push({ points: [...back].reverse(), color, shade: shade * .56, material });
  for (let index = 0; index < profile.length; index += 1) {
    const next = (index + 1) % profile.length;
    faces.push({ points: [front[index], front[next], back[next], back[index]], color, shade: shade * (.62 + (index % 3) * .1), material });
  }
}
function addAbilityConnectorMesh(faces, center, sideOffset, zOffset, width, height, color, shade = 1) {
  addAbilityCameraBox(faces, { side: center.side + sideOffset, forward: center.forward, z: center.z + zOffset }, [width, width * .7, height], color, shade, null);
}
function drawAbilityGlyph3D(ability, now, center, size, alpha = 1, active = false, ignoreWorldDepth = false) {
  if (!ability) return;
  const palette = abilityVisualPalette(ability);
  const unit = Math.max(.004, size * center.forward / Math.max(1, focalY()) / 8);
  const pulse = active ? 1 + Math.sin(now / 130) * .08 : 1 + Math.sin(now / 260) * .035;
  const ringRotation = now / (active ? 1100 : 1700);
  const faces = [];
  const core = { ...center };
  const side = (value) => center.side + value;
  const height = (value) => center.z + value;

  if (ability.kind === 'gate') {
    addAbilityCrystalMesh(faces, core, unit * 1.28, unit * 1.02, unit * 4.8 * pulse, ringRotation, palette.base, 1.1, 'steel');
    addAbilityConnectorMesh(faces, core, 0, -unit * 2.55, unit * .42, unit * .72, palette.deep, .9);
    addAbilityTorusMesh(faces, core, unit * 3.05, unit * .11, ringRotation, palette.accent, 1.04, null, 8);
    addAbilityCrystalMesh(faces, { side: side(-unit * 2.2), forward: center.forward, z: height(unit * .1) }, unit * .42, unit * .34, unit * 1.05, -.45, palette.light, 1.04, null);
    addAbilityCrystalMesh(faces, { side: side(unit * 2.2), forward: center.forward, z: height(unit * .1) }, unit * .42, unit * .34, unit * 1.05, .45, palette.light, .88, null);
  } else if (ability.kind === 'reveal') {
    addAbilityOrbMesh(faces, core, unit * 1.45, unit * .74, palette.base, 1.04, null);
    addAbilityTorusMesh(faces, core, unit * 2.55, unit * .18, ringRotation, palette.accent, 1.02, null, 12);
    addAbilityCrystalMesh(faces, { ...core, forward: center.forward - unit * .84 }, unit * .42, unit * .18, unit * 1.6, 0, palette.light, 1.18, null);
    addAbilityCrystalMesh(faces, { ...core, forward: center.forward - unit * .98 }, unit * .18, unit * .1, unit * .72, 0, palette.accent, 1.22, null);
  } else if (ability.kind === 'homing') {
    addAbilityOrbMesh(faces, core, unit * 1.48, unit * 1.48, palette.base, 1.08, 'steel');
    addAbilityTorusMesh(faces, core, unit * 2.25, unit * .13, -ringRotation * 1.25, palette.accent, 1.02, null, 9);
    for (let index = 0; index < 4; index += 1) {
      const angle = ringRotation * .9 + index * TAU / 4;
      addAbilityCrystalMesh(faces, { side: side(Math.cos(angle) * unit * 2.05), forward: center.forward, z: height(Math.sin(angle) * unit * 2.05) }, unit * .3, unit * .22, unit * 1.15, angle, palette.light, .98, null);
    }
  } else if (ability.kind === 'ward') {
    addAbilityPlateMesh(faces, core, unit * 4.7, unit * 4.9, unit * .7, Math.sin(now / 1600) * .06, palette.base, 1.02, 'steel');
    addAbilityCrystalMesh(faces, { ...core, forward: center.forward - unit * .48 }, unit * .7, unit * .26, unit * 2.5, 0, palette.accent, 1.08, null);
    addAbilityTorusMesh(faces, core, unit * 3.02, unit * .1, ringRotation, palette.light, .92, null, 8);
  } else if (ability.kind === 'chain') {
    for (let index = -1; index <= 1; index += 1) {
      const linkCenter = { ...core, side: side(index * unit * 2.0), z: height(Math.sin(index * 1.2 + ringRotation) * unit * .32) };
      addAbilityTorusMesh(faces, linkCenter, unit * 1.02, unit * .16, ringRotation + index * .9, palette.base, 1.04, 'steel', 8);
      if (index < 1) addAbilityConnectorMesh(faces, core, (index + .5) * unit * 2, 0, unit * .28, unit * .3, palette.accent, .95);
    }
  } else if (ability.kind === 'echo') {
    addAbilityOrbMesh(faces, core, unit * .86, unit * .82, palette.base, 1.02, null);
    addAbilityTorusMesh(faces, core, unit * 1.65, unit * .13, ringRotation * .7, palette.accent, .96, null, 10);
    addAbilityTorusMesh(faces, core, unit * 2.45, unit * .11, -ringRotation, palette.light, .88, null, 10);
    addAbilityTorusMesh(faces, core, unit * 3.2, unit * .09, ringRotation * .58, palette.accent, .76, null, 10);
  } else if (ability.kind === 'fireball') {
    addAbilityOrbMesh(faces, core, unit * 1.72, unit * 1.5, palette.base, 1.08, 'steel');
    addAbilityCrystalMesh(faces, { side: side(-unit * .55), forward: center.forward, z: height(unit * 1.65) }, unit * .34, unit * .22, unit * 1.72, -.3, palette.accent, 1.06, null);
    addAbilityCrystalMesh(faces, { side: side(unit * .7), forward: center.forward + unit * .08, z: height(unit * .95) }, unit * .28, unit * .2, unit * 1.35, .45, palette.light, .94, null);
    addAbilityCrystalMesh(faces, { side: side(-unit * .9), forward: center.forward, z: height(-unit * 1.2) }, unit * .25, unit * .18, unit * 1.18, .8, palette.accent, .9, null);
    addAbilityTorusMesh(faces, core, unit * 2.55, unit * .1, ringRotation * 1.2, palette.light, .74, null, 9);
  } else if (ability.kind === 'bloom') {
    addAbilityOrbMesh(faces, core, unit * .78, unit * .72, palette.light, 1.08, null);
    for (let index = 0; index < 6; index += 1) {
      const angle = ringRotation + index * TAU / 6;
      const petalCenter = { side: side(Math.cos(angle) * unit * 2.15), forward: center.forward, z: height(Math.sin(angle) * unit * 2.15) };
      addAbilityCrystalMesh(faces, petalCenter, unit * .58, unit * .22, unit * 1.62, angle, palette.base, 1.02, null);
    }
    addAbilityTorusMesh(faces, core, unit * 2.95, unit * .1, -ringRotation, palette.accent, .8, null, 10);
  } else if (ability.kind === 'beam') {
    addAbilityPlateMesh(faces, core, unit * 1.55, unit * 5.8, unit * .56, 0, palette.base, 1.08, 'steel');
    addAbilityCrystalMesh(faces, { ...core, z: height(unit * 2.8) }, unit * .42, unit * .24, unit * .92, 0, palette.light, 1.12, null);
    addAbilityCrystalMesh(faces, { ...core, z: height(-unit * 2.8) }, unit * .42, unit * .24, unit * .92, 0, palette.accent, .92, null);
    addAbilityTorusMesh(faces, core, unit * 2.75, unit * .1, ringRotation, palette.light, .8, null, 8);
  } else {
    addAbilityOrbMesh(faces, core, unit * 1.3, unit * 1.15, palette.base, 1, null);
    addAbilityTorusMesh(faces, core, unit * 2.4, unit * .12, ringRotation, palette.accent, .9, null, 10);
  }

  const projected = projectCameraPoint(center);
  if (projected) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = alpha * (active ? .2 : .09);
    ctx.shadowBlur = Math.max(10, size * .17);
    ctx.shadowColor = abilityRgbCss(palette.glow, .92);
    const auraRadius = Math.max(14, size * (active ? .72 : .55));
    const aura = ctx.createRadialGradient(projected.x, projected.y, 0, projected.x, projected.y, auraRadius);
    aura.addColorStop(0, abilityRgbCss(palette.glow, .44));
    aura.addColorStop(.48, abilityRgbCss(palette.base, .16));
    aura.addColorStop(1, abilityRgbCss(palette.base, 0));
    ctx.fillStyle = aura;
    ctx.beginPath(); ctx.arc(projected.x, projected.y, auraRadius, 0, TAU); ctx.fill();
    ctx.restore();
  }
  renderFaces(faces, alpha, ignoreWorldDepth);
  if (!projected || (!ignoreWorldDepth && !abilityCameraPointVisible(projected))) return;
  ctx.save();
  ctx.globalAlpha = alpha * (active ? .34 : .14);
  ctx.strokeStyle = abilityRgbCss(palette.accent, .9);
  ctx.shadowBlur = Math.max(7, size * .1);
  ctx.shadowColor = abilityRgbCss(palette.glow, .8);
  ctx.lineWidth = Math.max(1, size * .012);
  ctx.beginPath();
  ctx.arc(projected.x, projected.y, Math.max(5, size * .21), ringRotation, ringRotation + Math.PI * 1.32);
  ctx.stroke();
  ctx.restore();
}

function abilityCameraPointVisible(point, clearance = .06) {
  if (!point || point.depth <= .04) return false;
  if (!state.zBuffer?.length) return true;
  const ray = clamp(Math.floor(point.x / canvas.width * RAY_COUNT), 0, RAY_COUNT - 1);
  return point.depth <= state.zBuffer[ray] + clearance;
}

function bottomLeftAbilityCameraAnchor(now) {
  const bob = state.weapon.moving ? Math.sin(state.weapon.bobPhase) * .026 : Math.sin(now / 520) * .014;
  // Camera-local placement keeps the ability in the lower-left view without
  // bringing back the hand or a separate DOM/UI ability slot.
  return { side: -.62, forward: 1.18, z: EYE_HEIGHT - .4 + bob };
}

function drawFloatingAbilityParticles(ability, center, size, now, alpha = 1, active = true, ignoreWorldDepth = false) {
  if (!ability || settings.reducedMotion && !active) return;
  const palette = abilityVisualPalette(ability);
  const count = settings.reducedMotion ? 5 : active ? 15 : 8;
  const unit = Math.max(.004, size * center.forward / Math.max(1, focalY()) / 8);
  const orbit = unit * (active ? 4.6 : 3.8);
  const phase = now / (active ? 650 : 1200) + ability.id.length * .31;
  const colors = [palette.base, palette.accent, palette.light];
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.lineCap = 'round';
  for (let index = 0; index < count; index += 1) {
    const seed = index * 17.371 + ability.id.length * 2.13;
    const angle = phase + index * TAU / count;
    const distance = orbit * (.72 + fract(Math.sin(seed * 4.17) * 43758.5453) * .55);
    const cameraPoint = {
      side: center.side + Math.cos(angle) * distance,
      forward: center.forward + Math.sin(angle * 1.7 + seed) * unit * .8,
      z: center.z + Math.sin(angle) * distance,
    };
    const point = projectCameraPoint(cameraPoint);
    if (!ignoreWorldDepth && !abilityCameraPointVisible(point)) continue;
    const previous = projectCameraPoint({
      side: center.side + Math.cos(angle - .2) * distance,
      forward: center.forward + Math.sin((angle - .2) * 1.7 + seed) * unit * .8,
      z: center.z + Math.sin(angle - .2) * distance,
    });
    const particleAlpha = alpha * (active ? .74 : .4) * (.55 + .45 * Math.sin(angle * 1.6 + seed) ** 2);
    const particleSize = Math.max(1.4, size * (.014 + (index % 3) * .005));
    ctx.globalAlpha = particleAlpha;
    ctx.shadowBlur = Math.max(5, size * .12);
    ctx.shadowColor = abilityRgbCss(palette.glow, .9);
    ctx.fillStyle = abilityRgbCss(colors[index % colors.length], .94);
    if (active && previous && (ignoreWorldDepth || abilityCameraPointVisible(previous))) {
      ctx.strokeStyle = abilityRgbCss(colors[index % colors.length], .68);
      ctx.lineWidth = Math.max(1, particleSize * .55);
      ctx.beginPath(); ctx.moveTo(previous.x, previous.y); ctx.lineTo(point.x, point.y); ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(point.x, point.y, particleSize, 0, TAU); ctx.fill();
  }
  if (active && !settings.reducedMotion) {
    ctx.globalAlpha = alpha * .66;
    ctx.fillStyle = abilityRgbCss(palette.light, .92);
    for (let spark = 0; spark < 5; spark += 1) {
      const angle = phase * 1.35 + spark * TAU / 5;
      const point = projectCameraPoint({
        side: center.side + Math.cos(angle) * orbit * .72,
        forward: center.forward,
        z: center.z + Math.sin(angle) * orbit * .72,
      });
      if (!ignoreWorldDepth && !abilityCameraPointVisible(point)) continue;
      ctx.save(); ctx.translate(point.x, point.y); ctx.rotate(angle); ctx.fillRect(-2, -2, 4, 4); ctx.restore();
    }
  }
  ctx.restore();
}

function drawFloatingAbility(ability, now) {
  if (!ability || state.reading || state.menuActive) return;
  const casting = state.abilityCast?.ability?.id === ability.id;
  const castProgress = casting ? clamp(state.abilityCast.elapsed / state.abilityCast.duration, 0, 1) : 0;
  const castPulse = casting ? Math.sin(Math.PI * castProgress) : 0;
  const center = bottomLeftAbilityCameraAnchor(now);
  if (!center || center.forward <= .04) return;

  const size = Math.max(58, canvas.height * (.15 + castPulse * .035));
  const palette = abilityVisualPalette(ability);
  const unit = Math.max(.004, size * center.forward / Math.max(1, focalY()) / 8);
  const ringFaces = [];
  const rotation = now / (casting ? 520 : 1050);
  addAbilityTorusMesh(ringFaces, center, unit * 4.35, unit * .12, rotation, palette.accent, 1.08, 'steel', 12);
  addAbilityTorusMesh(ringFaces, center, unit * 3.35, unit * .06, -rotation * 1.3, palette.light, .92, null, 10);
  for (let index = 0; index < 3; index += 1) {
    const angle = rotation * 1.3 + index * TAU / 3;
    addAbilityCrystalMesh(ringFaces, {
      side: center.side + Math.cos(angle) * unit * 3.8,
      forward: center.forward + Math.sin(angle) * unit * .7,
      z: center.z + Math.sin(angle) * unit * 3.8,
    }, unit * .27, unit * .18, unit * 1.1, angle, index % 2 ? palette.light : palette.base, .98, null);
  }
  // Lower-left camera-local placement: no hand, no DOM slot, just the ability
  // object rendered into the canvas at the requested corner.
  renderFaces(ringFaces, casting ? 1 : .88, true);
  drawAbilityGlyph3D(ability, now, center, size, casting ? .98 : .88, casting, true);
  drawFloatingAbilityParticles(ability, center, size, now, casting ? 1 : .82, true, true);

  const projected = projectCameraPoint(center);
  if (projected) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = .18 + castPulse * .34;
    ctx.fillStyle = abilityRgbCss(palette.glow, .38);
    ctx.shadowBlur = Math.max(12, size * .32);
    ctx.shadowColor = abilityRgbCss(palette.glow, .82);
    ctx.beginPath(); ctx.arc(projected.x, projected.y, Math.max(7, size * (.28 + castPulse * .12)), 0, TAU); ctx.fill();
    ctx.restore();
  }
}

function drawPassiveAbilityFocus(now) {
  drawFloatingAbility(selectedAbilityDefinition(), now);
}
function playAbilitySound() { playTone(220, .16, 'sine', .022); playTone(440, .26, 'triangle', .024, .08); playTone(660, .32, 'sine', .018, .17); }

function actionForItem(item) { if (item.intro) return '<a href="mailto:liam.hosfeld@gmail.com">CONTACT LIAM ↗</a><a href="assets/Liam_Hosfeld_Resume.pdf" download="Liam-Hosfeld-Operations-Analytics-Resume.pdf">DOWNLOAD RÉSUMÉ ↧</a><a href="https://www.linkedin.com/in/liam-hosfeld" target="_blank" rel="noreferrer">OPEN LINKEDIN ↗</a>'; if (item.id === 'contact-raven') return '<a href="mailto:liam.hosfeld@gmail.com">SEND A RAVEN ↗</a>'; if (item.id === 'resume-scroll') return '<a href="assets/Liam_Hosfeld_Resume.pdf" download="Liam-Hosfeld-Operations-Analytics-Resume.pdf">TAKE THE RÉSUMÉ ↧</a>'; if (item.id === 'linkedin-key') return '<a href="https://www.linkedin.com/in/liam-hosfeld" target="_blank" rel="noreferrer">TURN THE LINKEDIN KEY ↗</a>'; return ''; }
function openReading(item) {
  state.reading = item;
  state.readingElapsed = 0;
  state.readingWorldTime = state.now;
  state.keys.clear();
  state.mouseAttack = false;
  state.weapon.swing = 0;
  state.weapon.projectile = 0;
  let unlocked = null;
  if (item.gateTutorial) {
    if (!state.tutorialAbility) {
      state.tutorialAbility = true;
      state.selectedAbilityId = GATE_TUTORIAL_ABILITY.id;
      unlocked = GATE_TUTORIAL_ABILITY;
      updateHud();
    }
    updateAbilityCard(0, unlocked || GATE_TUTORIAL_ABILITY);
  } else {
    grantScrollXP(item);
  }

  const itemX = Number.isFinite(item.x) ? item.x : state.player.x;
  const itemY = Number.isFinite(item.y) ? item.y : state.player.y;
  const itemColor = item.color || '#6ce0c2';
  const room = rooms[item.roomIndex ?? 0];
  const recordId = item.recordId || item.id;
  const tags = item.tags || [item.tag, room.shortTitle, `+${XP_PER_SCROLL} XP`];
  spawnParticles(itemX, itemY, .55, [itemColor, '#fff1b0'], settings.reducedMotion ? 12 : 30, { speed: 1.35, life: 1, size: .8, upward: .68, glow: 18, trail: true });
  scrollRoomLabel.textContent = item.intro ? '· FIELD LOBBY' : `· ${room.level}`;
  if (scrollRecordNumber) scrollRecordNumber.textContent = item.intro ? 'ENTRY SCROLL' : 'CASE STUDY';
  if (readingOverlay) readingOverlay.style.setProperty('--scroll-accent', itemColor);
  if (scrollAuthorLine) scrollAuthorLine.textContent = item.intro ? 'LIAM HOSFELD · TECHNICAL CONSULTANT · ATLANTA, GA' : `LIAM HOSFELD · ${room.shortTitle.toUpperCase()}`;
  if (scrollRecordStatus) scrollRecordStatus.textContent = `${state.collectedRecordIds.has(recordId) ? 'ARCHIVED SIGNAL' : 'NEW SIGNAL'} · ${(item.kind || 'FIELD NOTE').toUpperCase()}`;
  if (scrollPositioning) scrollPositioning.textContent = item.intro
    ? 'BEST FIT: OPERATIONS ANALYTICS · TMS DELIVERY · INTEGRATIONS · AUTOMATION · PROJECT ANALYSIS'
    : `FIELD USE: ${item.tag || room.subtitle || 'SELECTED EVIDENCE'} · READ THE SIGNAL, THEN FOLLOW THE ROUTE`;
  scrollTitle.textContent = item.title;
  scrollSummary.textContent = item.summary;
  if (scrollIntroGrid) {
    const metrics = item.featuredMetrics || [
      { value: `+${XP_PER_SCROLL}`, label: 'archive experience' },
      { value: room.level, label: 'field classification' },
      { value: String(item.details?.length || 0), label: 'evidence points' },
      { value: String(tags.length), label: 'signal tags' },
      { value: (item.kind || 'record').toUpperCase(), label: 'record type' },
    ];
    scrollIntroGrid.hidden = metrics.length === 0;
    scrollIntroGrid.innerHTML = metrics.map((metric, index) => `<div class="scroll-metric" style="--delay:${.12 + index * .06}s"><strong>${escapeHtml(metric.value)}</strong><span>${escapeHtml(metric.label)}</span></div>`).join('');
  }
  if (scrollProofGrid) {
    const proof = item.featuredWork || [];
    scrollProofLabel.hidden = proof.length === 0;
    scrollProofGrid.hidden = proof.length === 0;
    scrollProofGrid.innerHTML = proof.map((card, index) => `<article class="scroll-proof-card" style="--delay:${.2 + index * .07}s"><div class="scroll-proof-meta"><span>${escapeHtml(card.index)}</span><small>${escapeHtml(card.label)}</small></div><h3>${escapeHtml(card.title)}</h3><strong>${escapeHtml(card.result)}</strong><p>${escapeHtml(card.method)}</p><em>${escapeHtml(card.tools)}</em></article>`).join('');
  }
  const details = item.details || [];
  if (scrollDetailsLabel) scrollDetailsLabel.textContent = item.intro ? 'FIELD NOTES / THE FULL ROUTE' : 'FIELD NOTES / EVIDENCE';
  if (scrollDetailCount) scrollDetailCount.textContent = `${details.length} EVIDENCE POINT${details.length === 1 ? '' : 'S'}`;
  scrollDetails.innerHTML = details.map((detail, index) => `<li style="--delay:${.18 + index * .06}s">${escapeHtml(detail)}</li>`).join('');
  scrollTags.innerHTML = tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('');
  if (scrollCtaTitle) scrollCtaTitle.textContent = item.intro ? 'READY TO MAKE COMPLEX WORK CLEARER?' : 'THIS IS ONE PROOF POINT — SEE THE FULL ROUTE';
  if (scrollCtaCopy) scrollCtaCopy.textContent = item.intro
    ? 'Bring Liam a difficult operational system, a noisy data trail, or a process worth automating. He turns the signal into a route people can run.'
    : 'Liam connects technical evidence to business action across TMS delivery, analytics, integrations, automation, and cross-functional work.';
  scrollActions.innerHTML = actionForItem(item);
  updateScrollProgress();
  readingOverlay.hidden = false;
  readingOverlay.classList.toggle('intro-scroll', Boolean(item.intro));
  readingOverlay.classList.remove('open');
  void readingOverlay.offsetWidth;
  readingOverlay.classList.add('open');
  playRecoverySound();
  showToast(item.gateTutorial ? 'Archive Key learned. Cast it at the gate with Q.' : 'The dungeon waits while you read the field record.', 'good');
}
function closeReading() { if (!state.reading) return; const wasLobbyScroll = state.reading === lobbyPortfolioScroll; state.reading = null; state.readingElapsed = 0; readingOverlay.classList.remove('open', 'intro-scroll'); window.setTimeout(() => { if (!state.reading) readingOverlay.hidden = true; }, 550); if (wasLobbyScroll) startLobbyGuideScrollReturnRun(); }
function interactWithLightDoor() {
  if (!state.doorOfLight?.active) return false;
  const distance = Math.hypot(state.doorOfLight.x - state.player.x, state.doorOfLight.y - state.player.y);
  if (distance > 2.35) return false;
  state.gameComplete = true;
  state.endingFade = 0;
  announceNarrator(
    'door-of-light',
    'ASCENSION ROUTE',
    'EXIT OPEN. MOVE EAST. SANCTUARY AHEAD.',
    'expression-relieved',
    7,
    { duration: 5.5, priority: 10, force: true },
  );
  state.keys.clear();
  state.mouseAttack = false;
  spawnParticles(state.doorOfLight.x, state.doorOfLight.y, .9, ['#b8f0e2', '#fff8db'], settings.reducedMotion ? 16 : 44, { speed: 2.3, life: 1.3, size: 1.1, upward: .9, glow: 21, trail: true });
  showToast('The ascension gate opens. A sanctuary waits beyond the boss arena.', 'good');
  playTone(330, .28, 'sine', .03); playTone(660, .5, 'triangle', .03, .12);
  return true;
}
function openLobbyGate() {
  if (!state.weapon.equipped) {
    showToast('Equip a weapon before opening the archive gate.');
    return false;
  }
  if (state.lobbyGateOpen || state.lobbyGateOpening) return true;
  state.lobbyGateOpening = true;
  announceNarrator(
    'lobby-gate-opening',
    'ARCHIVE KEY / ROUTE OPENING',
    'Archive Key is opening the route. Liam sent you beyond the forest to secure his Document of Truth—his résumé.',
    'expression-command',
    10,
    { duration: 7, priority: 8, force: true },
  );
  showToast('The archive gate opens. The world is waiting.', 'good');
  playTone(82, .45, 'sawtooth', .032); playTone(164, .5, 'triangle', .018, .15);
  return true;
}
function interactWithLobbyGate() {
  if (state.room !== 0 || lobbyGateDistance() > 1.65) return false;
  if (state.lobbyGateOpen) return true;
  if (!state.weapon.equipped) {
    showToast('Equip a weapon before opening the archive gate.');
  } else {
    openLobbyGate();
  }
  return true;
}
function startLobbyGuideFarewell() {
  if (state.guideFarewellStarted) return;
  state.guideFarewellStarted = true;
  state.guideFarewellComplete = false;
  state.guideControlsLocked = true;
  state.keys.clear();
  state.weapon.moving = false;
  state.guideSpeechTarget = '';
  state.guideSpeechVisible = '';
  state.guideSpeechActive = false;
  state.guideSpeechHold = 0;
  state.guideSpeechCompletion = null;
  state.guideSpeechPause = 0;
  state.guidePendingSpeech = null;
  state.guideDeferredRun = null;
  state.guideAutoTimer = -1;
  const facingX = Math.cos(state.player.angle);
  const facingY = Math.sin(state.player.angle);
  const desiredDistance = canStand(state.player.x + facingX * 1.15, state.player.y + facingY * 1.15) ? 1.15 : .72;
  const targetX = state.player.x + facingX * desiredDistance;
  const targetY = state.player.y + facingY * desiredDistance;
  const distance = Math.hypot(targetX - LOBBY_GUIDE.x, targetY - LOBBY_GUIDE.y);
  state.guideRun = {
    kind: 'farewell',
    startX: LOBBY_GUIDE.x,
    startY: LOBBY_GUIDE.y,
    targetX,
    targetY,
    elapsed: 0,
    duration: clamp(distance / 2.35, .45, 1.25),
  };
}
function updateLobbyGate(delta) {
  if (!state.lobbyGateOpening) return;
  state.lobbyGateProgress = clamp(state.lobbyGateProgress + delta / 1.25, 0, 1);
  if (state.lobbyGateProgress >= 1) {
    state.lobbyGateOpening = false;
    state.lobbyGateOpen = true;
    startLobbyGuideFarewell();
  }
}
function resumePedestalDistance() {
  return state.room === SANCTUARY_ROOM_INDEX
    ? Math.hypot(SANCTUARY_RESUME_PEDESTAL.x - state.player.x, SANCTUARY_RESUME_PEDESTAL.y - state.player.y)
    : Infinity;
}
function downloadSanctuaryResume() {
  if (state.room !== SANCTUARY_ROOM_INDEX || state.resumeDownloaded) return false;
  state.resumeDownloaded = true;
  announceNarrator(
    'document-downloaded',
    'MISSION COMPLETE',
    'Document of Truth secured. Liam’s résumé is downloaded; the delivery is complete.',
    'expression-relieved',
    7,
    { duration: 12, priority: 15, force: true },
  );
  const link = document.createElement('a');
  link.href = 'assets/Liam_Hosfeld_Resume.pdf';
  link.download = 'Liam-Hosfeld-Operations-Analytics-Resume.pdf';
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  spawnParticles(SANCTUARY_RESUME_PEDESTAL.x, SANCTUARY_RESUME_PEDESTAL.y, 1.15, ['#fff8d6', '#b8f0e2', '#f0d38f'], settings.reducedMotion ? 16 : 46, { speed: 1.5, life: 1.35, size: 1.05, upward: 1, spread: TAU, gravity: -.12, drag: .96, glow: 23, trail: true });
  pushImpactBurst({ x: SANCTUARY_RESUME_PEDESTAL.x, y: SANCTUARY_RESUME_PEDESTAL.y, z: 1.1, elapsed: 0, duration: 1.4, color: '#fff8d6', radius: 1.15, style: 'resume' });
  showToast('RÉSUMÉ SECURED · YOUR PDF DOWNLOAD HAS STARTED.', 'good');
  playTone(440, .2, 'sine', .03); playTone(660, .3, 'triangle', .03, .1); playTone(880, .42, 'sine', .022, .22);
  updateHud();
  return true;
}
function updateSanctuaryResume() {
  if (state.room === SANCTUARY_ROOM_INDEX && !state.resumeDownloaded && resumePedestalDistance() <= 1.45) downloadSanctuaryResume();
}

function equipLobbyWeapon(creature) {
  if (!creature || !WEAPON_LOADOUTS[creature.type]) return false;
  setWeapon(creature.type);
  showToast(`${WEAPON_LOADOUTS[creature.type].label.toUpperCase()} READY · THE ROUTE IS OPEN.`, 'good');
  showHitMarker('WEAPON PICKED UP', 'shielded');
  if (state.room === 0) reactToLobbyWeaponPickup();
  return true;
}

function recoverNearby() {
  if (state.menuActive || state.launchTransition || state.transition || state.forestTransition) return;
  if (state.reading) { closeReading(); return; }
  if (interactWithLightDoor()) return;
  if (interactWithLobbyGate()) return;
  const weaponCreature = getNearestWeaponCreature();
  if (weaponCreature) {
    equipLobbyWeapon(weaponCreature);
    return;
  }
  const item = getNearestItem();
  if (!item) { showToast('Move closer to a weapon keeper, supply cache, or the gate.'); return; }
  if (['ammo-pickup', 'ammo-arsenal', 'ammo-shotgun', 'ammo-bfg'].includes(item.kind)) { collectCombatPickup(item); return; }
  item.recovered = true; state.recoveredItems.add(item.id); openReading(item); updateHud();
}

function castRay(angle) {
  const rayDirX = Math.cos(angle); const rayDirY = Math.sin(angle);
  const camera = renderCamera();
  let mapX = Math.floor(camera.x); let mapY = Math.floor(camera.y);
  const deltaDistX = Math.abs(rayDirX) < .00001 ? 1e30 : Math.abs(1 / rayDirX);
  const deltaDistY = Math.abs(rayDirY) < .00001 ? 1e30 : Math.abs(1 / rayDirY);
  const stepX = rayDirX < 0 ? -1 : 1; const stepY = rayDirY < 0 ? -1 : 1;
  let sideDistX = rayDirX < 0 ? (camera.x - mapX) * deltaDistX : (mapX + 1 - camera.x) * deltaDistX;
  let sideDistY = rayDirY < 0 ? (camera.y - mapY) * deltaDistY : (mapY + 1 - camera.y) * deltaDistY;
  let side = 0; let distance = 0;
  while (distance < MAX_DEPTH) {
    if (sideDistX < sideDistY) { sideDistX += deltaDistX; mapX += stepX; side = 0; distance = sideDistX - deltaDistX; }
    else { sideDistY += deltaDistY; mapY += stepY; side = 1; distance = sideDistY - deltaDistY; }
    if (mapY < 0 || mapY >= WORLD_HEIGHT || mapX < 0 || mapX >= WORLD_WIDTH || worldMap[mapY][mapX] === '1') {
      distance = Math.max(.001, Math.abs(distance));
      const hitX = camera.x + rayDirX * distance; const hitY = camera.y + rayDirY * distance;
      const wallX = side === 0 ? hitY - Math.floor(hitY) : hitX - Math.floor(hitX);
      return { distance, hitX, hitY, wallX: clamp(wallX, 0, .999), vertical: side === 0 };
    }
  }
  return { distance: MAX_DEPTH, hitX: camera.x + rayDirX * MAX_DEPTH, hitY: camera.y + rayDirY * MAX_DEPTH, wallX: 0, vertical: false };
}
function torchInfluence(x, y) { return 0; }
function sampleLight(x, y) {
  const camera = renderCamera();
  if (state.room === SANCTUARY_ROOM_INDEX) return clamp(.92 + clamp(1 - Math.hypot(x - camera.x, y - camera.y) / 12, 0, 1) * .18, .82, 1.18);
  if (state.room === 0) {
    const lobbyBase = .84 + clamp(1 - Math.hypot(x - camera.x, y - camera.y) / 10, 0, 1) * .22;
    return clamp(lobbyBase, .7, 1.22);
  }
  return clamp(.25 + clamp(1 - Math.hypot(x - camera.x, y - camera.y) / 5.4, 0, 1) * .18, .12, 1.1);
}
let skyCloudTexture = null;
function ensureSkyCloudTexture() {
  if (skyCloudTexture) return skyCloudTexture;
  skyCloudTexture = document.createElement('canvas');
  skyCloudTexture.width = 2048;
  skyCloudTexture.height = 256;
  const cloud = skyCloudTexture.getContext('2d');
  const textureWidth = skyCloudTexture.width;
  const textureHeight = skyCloudTexture.height;
  cloud.clearRect(0, 0, textureWidth, textureHeight);

  // Keep all primary waves on integer cycles so the panorama repeats without a
  // seam. The ribbons are deliberately layered rather than drawn as one flat
  // strip; the overlapping edges create the busy, hand-painted cloud depth.
  const waveAt = (x, band, lower = false) => {
    const t = x / textureWidth;
    const phase = band * 1.73;
    const broad = Math.sin(TAU * (2 + band % 3) * t + phase + (lower ? 1.18 : 0)) * (lower ? 8 : 12);
    const tight = Math.sin(TAU * (5 + band % 2) * t - phase + (lower ? .54 : 0)) * (lower ? 4 : 7);
    const curl = Math.sin(TAU * (9 + band % 4) * t + phase * .7) * 2.4;
    return broad + tight + curl;
  };

  for (let band = 0; band < 8; band += 1) {
    const y = 12 + band * 31;
    cloud.beginPath();
    for (let x = 0; x <= textureWidth; x += 8) {
      const edge = y + waveAt(x, band);
      if (x === 0) cloud.moveTo(x, edge); else cloud.lineTo(x, edge);
    }
    for (let x = textureWidth; x >= 0; x -= 8) cloud.lineTo(x, y + 22 + waveAt(x, band, true));
    cloud.closePath();
    cloud.fillStyle = band % 3 === 0 ? 'rgba(47, 64, 65, .62)' : 'rgba(79, 96, 91, .48)';
    cloud.fill();

    // A broken highlight along each upper edge makes the cloud mass read as
    // rolled vapor instead of a collection of rectangular bars.
    cloud.beginPath();
    for (let x = 0; x <= textureWidth; x += 10) {
      const edge = y + 2 + waveAt(x, band) * .92;
      if (x === 0) cloud.moveTo(x, edge); else cloud.lineTo(x, edge);
    }
    cloud.strokeStyle = band % 2 ? 'rgba(190, 207, 190, .2)' : 'rgba(224, 225, 198, .24)';
    cloud.lineWidth = 5 + (band % 3) * 2;
    cloud.stroke();
  }

  // Curved, periodically repeated wisps cross the ribbons. Each wisp is copied
  // at both texture edges so even the looping strokes remain seamless.
  const drawWisp = (x, y, width, height, alpha, light = false) => {
    for (const wrap of [-textureWidth, 0, textureWidth]) {
      cloud.beginPath();
      cloud.moveTo(x + wrap, y + height * .18);
      cloud.bezierCurveTo(x + width * .18 + wrap, y - height * .62, x + width * .38 + wrap, y - height * .62, x + width * .5 + wrap, y + height * .05);
      cloud.bezierCurveTo(x + width * .64 + wrap, y + height * .7, x + width * .82 + wrap, y + height * .58, x + width + wrap, y - height * .08);
      cloud.strokeStyle = light ? `rgba(218, 226, 204, ${alpha})` : `rgba(30, 47, 49, ${alpha})`;
      cloud.lineWidth = Math.max(2, height * .16);
      cloud.lineCap = 'round';
      cloud.stroke();
    }
  };
  for (let wisp = 0; wisp < 18; wisp += 1) {
    const x = (wisp * 271 + 83) % textureWidth;
    const y = 18 + (wisp * 37) % 218;
    const width = 90 + (wisp % 5) * 34;
    const height = 14 + (wisp % 4) * 5;
    drawWisp(x, y, width, height, .11 + (wisp % 3) * .025, wisp % 3 === 0);
    if (wisp % 2 === 0) drawWisp(x + 24, y + 8, width * .62, height * .58, .08, true);
  }

  // Small curled loops break up the long horizontal motion and give the sky a
  // more turbulent, swirling silhouette at a glance.
  for (let curl = 0; curl < 15; curl += 1) {
    const x = (curl * 149 + 47) % textureWidth;
    const y = 24 + (curl * 53) % 206;
    const radius = 9 + (curl % 4) * 3;
    for (const wrap of [-textureWidth, 0, textureWidth]) {
      cloud.beginPath();
      cloud.arc(x + wrap, y, radius, Math.PI * .12, Math.PI * 1.78);
      cloud.strokeStyle = curl % 3 ? 'rgba(197, 214, 198, .12)' : 'rgba(34, 51, 52, .16)';
      cloud.lineWidth = 2.5;
      cloud.stroke();
    }
  }
  cloud.lineCap = 'butt';
  return skyCloudTexture;
}
function drawSkyCloudTexture(width, horizon, forestProgress) {
  const texture = ensureSkyCloudTexture();
  const textureScale = Math.max(width / 760, 1);
  const textureWidth = texture.width * textureScale;
  const textureHeight = Math.min(horizon * .9, texture.height * textureScale);
  const time = state.now || performance.now();
  // Deliberate one-way travel: camera yaw is intentionally excluded, so
  // looking around does not make the clouds swim. Several independently
  // drifting passes now create depth without breaking that stable horizon.
  const travel = (time * .18) % textureWidth;
  const vertical = Math.sin(time * .0008) * 2.5 + Math.sin(time * .0017) * 1.2;
  const drawLayer = (layerWidth, layerHeight, speed, phase, y, alpha) => {
    const layerTravel = (time * speed + phase) % layerWidth;
    for (let x = -layerTravel - layerWidth; x < width + layerWidth; x += layerWidth) {
      ctx.drawImage(texture, x, y, layerWidth, layerHeight);
    }
  };
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, Math.max(0, horizon));
  ctx.clip();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = (.07 + forestProgress * .1);
  drawLayer(textureWidth * .72, textureHeight * .78, .11, textureWidth * .31, vertical - 11, ctx.globalAlpha);
  ctx.globalAlpha = .16 + forestProgress * .22;
  drawLayer(textureWidth, textureHeight, .18, travel, vertical, ctx.globalAlpha);
  ctx.globalAlpha = .08 + forestProgress * .12;
  drawLayer(textureWidth * 1.34, textureHeight * 1.08, .235, textureWidth * .67, vertical + 16, ctx.globalAlpha);
  ctx.globalAlpha = .045 + forestProgress * .09;
  ctx.fillStyle = forestProgress > .2 ? '#102025' : '#b9c9b8';
  ctx.fillRect(0, 0, width, textureHeight);
  ctx.restore();
}

function drawBackground(width, height) {
  const palette = rooms[state.room].palette || ['#090503', '#392719', '#0e0906'];
  const forestProgress = 0;
  const forestLight = 1 - forestProgress * .92;
  const horizon = cameraHorizon();
  const baseTop = hexToRgb(palette[0]);
  const baseMid = hexToRgb(palette[1]);
  const baseLow = hexToRgb(palette[2]);
  const darkGrayTop = { r: 43, g: 45, b: 47 };
  const darkGrayMid = { r: 57, g: 59, b: 61 };
  const darkGrayLow = { r: 35, g: 38, b: 40 };
  const skyTop = forestProgress > 0 ? rgba({ r: lerp(baseTop.r, darkGrayTop.r, forestProgress), g: lerp(baseTop.g, darkGrayTop.g, forestProgress), b: lerp(baseTop.b, darkGrayTop.b, forestProgress) }, 1) : palette[0];
  const skyMid = forestProgress > 0 ? rgba({ r: lerp(baseMid.r, darkGrayMid.r, forestProgress), g: lerp(baseMid.g, darkGrayMid.g, forestProgress), b: lerp(baseMid.b, darkGrayMid.b, forestProgress) }, 1) : palette[1];
  const skyLow = forestProgress > 0 ? rgba({ r: lerp(baseLow.r, darkGrayLow.r, forestProgress), g: lerp(baseLow.g, darkGrayLow.g, forestProgress), b: lerp(baseLow.b, darkGrayLow.b, forestProgress) }, 1) : palette[2];
  const ceiling = ctx.createLinearGradient(0, 0, 0, horizon);
  ceiling.addColorStop(0, skyTop); ceiling.addColorStop(.72, skyMid); ceiling.addColorStop(1, skyLow);
  ctx.fillStyle = ceiling; ctx.fillRect(0, 0, width, Math.max(0, horizon));
  if (state.room === 0) {
    const glow = ctx.createRadialGradient(width * .52, horizon * .66, 0, width * .52, horizon * .66, Math.max(width, height) * .62);
    glow.addColorStop(0, `rgba(255, 250, 216, ${.32 * forestLight})`);
    glow.addColorStop(.48, `rgba(157, 222, 190, ${.14 * forestLight})`);
    glow.addColorStop(1, 'rgba(157, 222, 190, 0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, width, Math.max(0, horizon));
    ctx.save(); ctx.globalAlpha = .24 * forestLight; ctx.strokeStyle = '#dff1c2'; ctx.lineWidth = Math.max(1, height * .003);
    for (let leaf = 0; leaf < 5; leaf += 1) {
      const x = width * (.12 + leaf * .19); const y = horizon * (.3 + (leaf % 2) * .1);
      ctx.beginPath(); ctx.arc(x, y, Math.max(12, width * .03), Math.PI * .15, Math.PI * .85); ctx.stroke();
    }
    ctx.restore();
  }
  if (state.room === 0) drawSkyCloudTexture(width, horizon, forestProgress);

  if (forestProgress > 0) {
    const darkness = smoothstep(.02, 1, forestProgress) * .16;
    const forestShade = ctx.createLinearGradient(0, 0, 0, horizon);
    forestShade.addColorStop(0, `rgba(4, 7, 9, ${darkness})`);
    forestShade.addColorStop(.64, `rgba(5, 8, 10, ${darkness * .72})`);
    forestShade.addColorStop(1, `rgba(8, 12, 12, ${darkness * .18})`);
    ctx.fillStyle = forestShade;
    ctx.fillRect(0, 0, width, Math.max(0, horizon));
  }
  if (state.room === SANCTUARY_ROOM_INDEX) {
    const sanctuaryGlow = ctx.createRadialGradient(width * .5, horizon * .72, 0, width * .5, horizon * .72, Math.max(width, height) * .75);
    sanctuaryGlow.addColorStop(0, 'rgba(255, 255, 226, .62)');
    sanctuaryGlow.addColorStop(.36, 'rgba(190, 245, 226, .3)');
    sanctuaryGlow.addColorStop(1, 'rgba(190, 245, 226, 0)');
    ctx.fillStyle = sanctuaryGlow;
    ctx.fillRect(0, 0, width, Math.max(0, horizon));
    ctx.save();
    ctx.globalAlpha = .42;
    ctx.strokeStyle = '#fff8d6';
    ctx.shadowBlur = 18;
    ctx.shadowColor = '#d9fff0';
    for (let star = 0; star < 24; star += 1) {
      const x = width * fract(star * .417 + .08);
      const y = horizon * (.18 + fract(star * .719) * .68);
      const radius = 1 + (star % 3) * .55;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, TAU);
      ctx.fillStyle = star % 4 === 0 ? '#fff1b0' : '#e5fff6';
      ctx.fill();
    }
    ctx.restore();
  }

  // The moon belongs to the fixed skybox, not the player's yaw. Its color is a
  // quiet progress indicator: pale at the entrance, blood-red at the Archon.
  const roomProgress = clamp(state.room / Math.max(1, FINAL_ROOM_INDEX), 0, 1);
  const progress = roomProgress;
  const moonColor = {
    r: lerp(216, 182, progress),
    g: lerp(210, 52, progress),
    b: lerp(182, 43, progress),
  };
  const craterColor = {
    r: lerp(116, 83, progress),
    g: lerp(112, 24, progress),
    b: lerp(94, 21, progress),
  };
  // The moon is anchored to a fixed world-space sky direction. Turning the player
  // therefore moves it across the viewport instead of pinning it to the screen.
  const moonWorld = {
    x: renderCamera().x + Math.cos(MOON_AZIMUTH) * SKY_DISTANCE,
    y: renderCamera().y + Math.sin(MOON_AZIMUTH) * SKY_DISTANCE,
    z: EYE_HEIGHT + Math.sin(MOON_ELEVATION) * SKY_DISTANCE,
  };
  const moonCamera = cameraPoint(moonWorld.x, moonWorld.y, moonWorld.z);
  const moonVisible = moonCamera.forward > .1 && Math.abs(moonCamera.side / moonCamera.forward) < Math.tan(FOV * .66);
  if (moonVisible) {
    const moonX = width / 2 + moonCamera.side * focalX() / moonCamera.forward;
    const moonY = projectY(moonCamera.z, moonCamera.forward);
    const moonRadius = clamp(Math.min(width, height) * .075, 16, 42);
    ctx.save();
    ctx.globalAlpha = .72 * (1 - forestProgress * .62);
    const moonGlow = ctx.createRadialGradient(moonX, moonY, moonRadius * .35, moonX, moonY, moonRadius * 2.8);
    moonGlow.addColorStop(0, rgba({ r: moonColor.r, g: moonColor.g, b: moonColor.b }, .23));
    moonGlow.addColorStop(.44, rgba({ r: lerp(190, 100, progress), g: lerp(202, 28, progress), b: lerp(188, 24, progress) }, .1));
    moonGlow.addColorStop(1, rgba(moonColor, 0));
    ctx.fillStyle = moonGlow; ctx.beginPath(); ctx.arc(moonX, moonY, moonRadius * 2.8, 0, TAU); ctx.fill();
    ctx.globalAlpha = .86 * (1 - forestProgress * .62);
    ctx.fillStyle = rgba(moonColor, 1); ctx.shadowBlur = 10 + progress * 18; ctx.shadowColor = rgba(moonColor, .44); ctx.beginPath(); ctx.arc(moonX, moonY, moonRadius, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = rgba(craterColor, .26 + progress * .16);
    [[-.32, -.18, .15], [.18, -.28, .11], [.27, .18, .18], [-.2, .27, .1], [.02, .08, .075]].forEach(([x, y, radius]) => { ctx.beginPath(); ctx.arc(moonX + x * moonRadius, moonY + y * moonRadius, radius * moonRadius, 0, TAU); ctx.fill(); });
    ctx.restore();
  }
  const floor = ctx.createLinearGradient(0, horizon, 0, height);
  floor.addColorStop(0, palette[1]); floor.addColorStop(1, palette[0]);
  ctx.fillStyle = floor; ctx.fillRect(0, Math.max(0, horizon), width, height - Math.max(0, horizon));
}
let ceilingBuffer = null;
let ceilingBufferContext = null;
let ceilingBufferImage = null;
let ceilingBufferHeight = 0;
let ceilingRowDistances = null;

function ensureCeilingBuffer(height) {
  const nextHeight = Math.ceil(height / FLOOR_STEP);
  if (ceilingBuffer && ceilingBuffer.height === nextHeight) return;
  ceilingBuffer = document.createElement('canvas');
  ceilingBuffer.width = RAY_COUNT;
  ceilingBuffer.height = nextHeight;
  ceilingBufferContext = ceilingBuffer.getContext('2d', { alpha: true });
  ceilingBufferImage = ceilingBufferContext.createImageData(RAY_COUNT, nextHeight);
  ceilingBufferHeight = nextHeight;
  ceilingRowDistances = new Float32Array(nextHeight);
}

function ceilingDistanceAtScreenY(y) {
  const verticalAngle = -Math.atan((y - cameraHorizon()) / focalY());
  const denominator = Math.tan(verticalAngle);
  return denominator > .01 ? (CEILING_Z - EYE_HEIGHT) / denominator : MAX_DEPTH;
}

function roofRoomIndexAtX(x) {
  for (let index = 0; index < rooms.length; index += 1) {
    const start = roomOffsets[index];
    if (x >= start && x < start + roomWidths[index]) return index;
  }
  return -1;
}
function drawRoomRoof(width, height) {
  // The player can be in a threshold/corridor while the next roofed chamber is
  // already visible. Sample every actual room under the ray, not only state.room.
  ensureCeilingBuffer(height);
  const data = ceilingBufferImage.data;
  data.fill(0);
  const horizon = cameraHorizon();
  for (let row = 0; row < ceilingBufferHeight; row += 1) {
    const screenY = row * FLOOR_STEP + FLOOR_STEP * .5;
    if (screenY >= horizon) continue;
    ceilingRowDistances[row] = clamp(ceilingDistanceAtScreenY(screenY), .35, MAX_DEPTH);
  }
  for (let ray = 0; ray < RAY_COUNT; ray += 1) {
    const camera = renderCamera();
    const angle = camera.angle + (ray / RAY_COUNT - .5) * cameraFov();
    const directionX = Math.cos(angle); const directionY = Math.sin(angle);
    for (let row = 0; row < ceilingBufferHeight; row += 1) {
      const screenY = row * FLOOR_STEP + FLOOR_STEP * .5;
      if (screenY >= horizon) continue;
      const distance = ceilingRowDistances[row];
      const worldX = camera.x + directionX * distance;
      const worldY = camera.y + directionY * distance;
      const sampledRoomIndex = roofRoomIndexAtX(worldX);
      if (sampledRoomIndex < 0 || !rooms[sampledRoomIndex]?.roof || isWall(worldX, worldY)) continue;
      const surface = sampleGround(worldX, worldY);
      const light = sampleLight(worldX, worldY);
      const factor = clamp(.28 + light * .5, .12, .92);
      const index = (row * RAY_COUNT + ray) * 4;
      data[index] = clamp(Math.round(surface.r * factor), 0, 255);
      data[index + 1] = clamp(Math.round(surface.g * factor), 0, 255);
      data[index + 2] = clamp(Math.round(surface.b * factor), 0, 255);
      data[index + 3] = 255;
    }
  }
  ceilingBufferContext.putImageData(ceilingBufferImage, 0, 0);
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, width, horizon + 1); ctx.clip();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(ceilingBuffer, 0, 0, width, height);
  // Keep the far ceiling quiet so the floor-like tile pattern transitions into
  // neighboring rooms without a hard beam or material break at eye level.
  const shade = ctx.createLinearGradient(0, 0, 0, horizon);
  shade.addColorStop(0, 'rgba(4, 3, 3, .25)');
  shade.addColorStop(.72, 'rgba(4, 3, 3, .04)');
  shade.addColorStop(1, 'rgba(4, 3, 3, 0)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, width, horizon + 1);
  ctx.restore();
}
function drawWalls(width, height) {
  const textureTech = textures.hellTech;
  for (let ray = 0; ray < RAY_COUNT; ray += 1) {
    const camera = renderCamera(); const cameraX = ray / RAY_COUNT - .5; const angle = camera.angle + cameraX * cameraFov(); const hit = castRay(angle); const corrected = hit.distance * Math.cos(angle - camera.angle);
    const top = projectY(CEILING_Z, corrected); const base = projectY(FLOOR_Z, corrected); const x = ray * width / RAY_COUNT; const room = materialRoomAtX(hit.hitX); const texture = textureTech;
    state.zBuffer[ray] = corrected; state.floorBase[ray] = base;
    if (base <= 0 || top >= height) continue;
    const sourceX = Math.floor(hit.wallX * texture.width); ctx.drawImage(texture, sourceX, 0, 1, texture.height, x, top, width / RAY_COUNT + 1, base - top);
    const light = sampleLight(hit.hitX, hit.hitY); const fog = clamp((corrected - 3) / 17, 0, .72); const darkness = clamp(1 - light * .8 + fog * .44, .08, .9);
    const wallShade = state.room === SANCTUARY_ROOM_INDEX ? `rgba(37, 111, 105, ${darkness * .16})` : state.room === 0 ? `rgba(55, 16, 16, ${darkness * .42})` : `rgba(8, 3, 3, ${darkness})`; ctx.fillStyle = wallShade; ctx.fillRect(x, top, width / RAY_COUNT + 1, base - top);
    const roomAccent = ['rgba(116, 35, 28, .12)', 'rgba(145, 43, 29, .13)', 'rgba(116, 23, 20, .16)', 'rgba(137, 27, 35, .14)', 'rgba(68, 88, 86, .1)', 'rgba(126, 31, 22, .15)'][clamp(roomIndexAtX(hit.hitX), 0, 5)];
    if (roomAccent) { ctx.fillStyle = roomAccent; ctx.fillRect(x, top, width / RAY_COUNT + 1, base - top); }
    const warmth = clamp(torchInfluence(hit.hitX, hit.hitY) * .035, 0, .08); if (warmth > .005) { ctx.fillStyle = `rgba(196, 112, 43, ${warmth})`; ctx.fillRect(x, top, width / RAY_COUNT + 1, base - top); }
    if (hit.vertical) { ctx.fillStyle = 'rgba(24, 10, 3, .13)'; ctx.fillRect(x, top, 1, base - top); }
  }
}
function groundDistanceAtScreenY(y) { const verticalAngle = -Math.atan((y - cameraHorizon()) / focalY()); const denominator = -Math.tan(verticalAngle); return denominator > .01 ? EYE_HEIGHT / denominator : MAX_DEPTH; }
let floorBuffer = null;
let floorBufferContext = null;
let floorBufferImage = null;
let floorBufferHeight = 0;
let floorRowDistances = null;

function ensureFloorBuffer(height) {
  const nextHeight = Math.ceil(height / FLOOR_STEP);
  if (floorBuffer && floorBuffer.height === nextHeight) return;
  floorBuffer = document.createElement('canvas');
  floorBuffer.width = RAY_COUNT;
  floorBuffer.height = nextHeight;
  floorBufferContext = floorBuffer.getContext('2d', { alpha: true });
  floorBufferImage = floorBufferContext.createImageData(RAY_COUNT, nextHeight);
  floorBufferHeight = nextHeight;
  floorRowDistances = new Float32Array(nextHeight);
}

function drawFloor(width, height) {
  ensureFloorBuffer(height);
  const data = floorBufferImage.data;
  data.fill(0);
  for (let row = 0; row < floorBufferHeight; row += 1) {
    floorRowDistances[row] = clamp(groundDistanceAtScreenY(row * FLOOR_STEP + FLOOR_STEP * .5), .35, MAX_DEPTH);
  }
  for (let ray = 0; ray < RAY_COUNT; ray += 1) {
    const startRow = clamp(Math.floor(state.floorBase[ray] / FLOOR_STEP), 0, floorBufferHeight);
    const camera = renderCamera();
    const angle = camera.angle + (ray / RAY_COUNT - .5) * cameraFov();
    const directionX = Math.cos(angle); const directionY = Math.sin(angle);
    for (let row = startRow; row < floorBufferHeight; row += 1) {
      const distance = floorRowDistances[row];
      const worldX = camera.x + directionX * distance;
      const worldY = camera.y + directionY * distance;
      const surface = sampleGround(worldX, worldY);
      const light = sampleLight(worldX, worldY);
      const factor = clamp(.25 + light * .75, .12, 1.18);
      const index = (row * RAY_COUNT + ray) * 4;
      data[index] = clamp(Math.round(surface.r * factor), 0, 255);
      data[index + 1] = clamp(Math.round(surface.g * factor), 0, 255);
      data[index + 2] = clamp(Math.round(surface.b * factor), 0, 255);
      data[index + 3] = 255;
    }
  }
  floorBufferContext.putImageData(floorBufferImage, 0, 0);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(floorBuffer, 0, 0, width, height);
  ctx.restore();
}

function projectVerticalBounds(x, y, zCenter, worldHeight) {
  const point = cameraPoint(x, y, zCenter);
  if (point.forward <= .04) return null;
  const bottom = projectY(zCenter - worldHeight / 2, point.forward);
  const top = projectY(zCenter + worldHeight / 2, point.forward);
  return { x: canvas.width / 2 + point.side * focalX() / point.forward, top, bottom, height: bottom - top, depth: point.forward };
}

const PICKUP_SPRITE_INDEX = Object.freeze({
  'ammo-arsenal': 2,
  'ammo-shotgun': 3,
  'ammo-bfg': 4,
});
const PICKUP_BALANCE = Object.freeze({
  'ammo-arsenal': { title: 'RIFLE MAGAZINE', color: '#d7a34e', amount: 30, icon: '▣' },
  'ammo-shotgun': { title: 'SHOTGUN SHELLS', color: '#e08a55', amount: 6, icon: '▥' },
  'ammo-bfg': { title: 'BFG ENERGY CELL', color: '#4cdbff', amount: 1, icon: 'ϟ' },
});
function pickupSpriteFrame(item) {
  const index = PICKUP_SPRITE_INDEX[item.kind];
  if (!Number.isInteger(index) || !spriteReady(gameSprites.pickupSheet)) return null;
  const source = keyedSpriteFrame(gameSprites.pickupSheet, 5, 1, index, 'pickup-sheet');
  if (!source) return null;

  // The source sheet is intentionally reduced to a small nearest-neighbour
  // canvas. This removes the overly smooth/detail-heavy look while keeping the
  // authored silhouette and chroma-key transparency.
  const cacheKey = `pickup-pixel-${index}`;
  if (spriteCache.has(cacheKey)) return spriteCache.get(cacheKey);
  const pixelSize = 28;
  const ratio = source.width / Math.max(1, source.height);
  const width = Math.max(8, Math.round(ratio >= 1 ? pixelSize : pixelSize * ratio));
  const height = Math.max(8, Math.round(ratio >= 1 ? pixelSize / ratio : pixelSize));
  const pixelated = document.createElement('canvas');
  pixelated.width = width;
  pixelated.height = height;
  const pixelContext = pixelated.getContext('2d');
  pixelContext.imageSmoothingEnabled = false;
  pixelContext.clearRect(0, 0, width, height);
  pixelContext.drawImage(source, 0, 0, width, height);
  spriteCache.set(cacheKey, pixelated);
  return pixelated;
}
function pickupDefinition(kind) { return PICKUP_BALANCE[kind] || PICKUP_BALANCE['ammo-arsenal']; }
function showPickupFeedback(item, amount) {
  const definition = pickupDefinition(item.kind);
  state.pickupFeedback = { label: definition.title, amount, color: definition.color, kind: item.kind };
  state.pickupFeedbackTimer = 1.25;
  state.combatPulse = .42;
  state.combatPulseStrength = .65;
  state.combatPulseColor = definition.color;
  state.combatPulseType = 'pickup';
}
function createCombatPickup(id, kind, x, y, roomIndex, extra = {}) {
  const definition = pickupDefinition(kind);
  return {
    id, title: definition.title, kind, icon: definition.icon,
    tag: `SUPPLY / ${definition.title}`,
    summary: `${definition.amount} ${kind.startsWith('ammo-') ? 'rounds added to reserve ammunition.' : 'resource restored.'}`,
    color: definition.color, amount: definition.amount, x, y, roomIndex,
    recovered: false, dropFromEnemy: false, spawnedAt: state.now || performance.now(), bobPhase: Math.random() * TAU,
    ...extra,
  };
}
function spawnStaticCombatPickups() {
  // Supplies are landmarks, not a trail of free refills. Most resources now
  // come from exploration and the occasional meaningful combat drop.
  const staticLayout = [
    [1, 'ammo-arsenal', .42, .52],
    [2, 'ammo-shotgun', .78, .72],
    [3, 'ammo-arsenal', .78, .72],
    [4, 'ammo-shotgun', .28, .72],
    [5, 'ammo-arsenal', .72, .3],
    [6, 'ammo-bfg', .5, .5],
    [7, 'ammo-shotgun', .28, .72],
  ];
  for (const [roomIndex, kind, xRatio, yRatio] of staticLayout) {
    const room = rooms[roomIndex];
    if (!room || !Number.isFinite(roomOffsets[roomIndex]) || !Number.isFinite(roomWidths[roomIndex]) || !Number.isFinite(roomHeights[roomIndex])) {
      console.warn(`[Portfolio game] skipped static pickup with invalid room index ${roomIndex}`);
      continue;
    }
    const x = roomOffsets[roomIndex] + roomWidths[roomIndex] * xRatio;
    const y = roomHeights[roomIndex] * yRatio;
    const point = findWalkableSpawnPoint(x, y, roomIndex);
    worldItems.push(createCombatPickup(`static-${kind}-${roomIndex}`, kind, point.x, point.y, roomIndex));
  }
}

spawnStaticCombatPickups();

function makeItemSprite(item) {
  const key = `item:${item.id}`;
  if (spriteCache.has(key)) return spriteCache.get(key);
  const sprite = document.createElement('canvas');
  sprite.width = 112;
  sprite.height = 144;
  const paint = sprite.getContext('2d');
  const color = hexToRgb(item.color);
  const icon = String(item.icon || '');
  paint.translate(56, 68);
  paint.shadowBlur = 18;
  paint.shadowColor = rgba(color, .72);
  paint.fillStyle = rgba(color, .12);
  paint.beginPath();
  paint.arc(0, 0, 35, 0, TAU);
  paint.fill();
  paint.shadowBlur = 0;
  paint.strokeStyle = rgba(color, .9);
  paint.lineWidth = 4;
  if (item.kind === 'ammo-pickup') {
    paint.fillStyle = '#4a3527'; paint.fillRect(-25, -20, 50, 42); paint.strokeRect(-25, -20, 50, 42);
    paint.fillStyle = '#d7a34e'; for (let round = -1; round <= 1; round += 1) { paint.beginPath(); paint.arc(round * 13, 0, 6, 0, TAU); paint.fill(); }
  } else if (['scroll', 'ledger', 'chronicle', 'map'].includes(item.kind)) {
    paint.fillStyle = '#d6b57b';
    paint.fillRect(-26, -34, 52, 68);
    paint.strokeStyle = '#71451f';
    paint.strokeRect(-26, -34, 52, 68);
    paint.fillStyle = '#815124';
    paint.fillRect(-17, -18, 34, 3);
    paint.fillRect(-17, -7, 26, 3);
    paint.fillRect(-17, 4, 31, 3);
  } else {
    paint.fillStyle = '#6a4529';
    paint.beginPath();
    paint.arc(0, 5, 25, 0, TAU);
    paint.fill();
    paint.stroke();
    paint.fillStyle = rgba(color, .9);
    paint.beginPath();
    paint.moveTo(0, 0);
    paint.quadraticCurveTo(-15, -30, -22, -13);
    paint.quadraticCurveTo(-7, -15, 0, 0);
    paint.fill();
    paint.beginPath();
    paint.moveTo(0, 0);
    paint.quadraticCurveTo(15, -30, 22, -13);
    paint.quadraticCurveTo(7, -15, 0, 0);
    paint.fill();
  }
  paint.fillStyle = '#f0d78d';
  paint.font = `bold ${icon.length > 3 ? 13 : 22}px Georgia`;
  paint.textAlign = 'center';
  paint.textBaseline = 'middle';
  paint.fillText(icon, 0, 0);
  spriteCache.set(key, sprite);
  return sprite;
}
function projectBillboard(x, y, zCenter, worldHeight) {
  const point = cameraPoint(x, y, zCenter);
  if (point.forward <= .04) return null;
  const bottom = projectY(zCenter - worldHeight / 2, point.forward);
  const top = projectY(zCenter + worldHeight / 2, point.forward);
  return { x: canvas.width / 2 + point.side * focalX() / point.forward, top, bottom, height: bottom - top, depth: point.forward };
}
function drawBillboard(sprite, projection, opacity = 1) {
  if (!projection || projection.height <= 0) return;
  const destWidth = projection.height * sprite.width / sprite.height;
  const startX = Math.floor(projection.x - destWidth / 2);
  const endX = Math.ceil(projection.x + destWidth / 2);
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.imageSmoothingEnabled = false;
  for (let screenX = startX; screenX <= endX; screenX += 1) {
    if (screenX < 0 || screenX >= canvas.width) continue;
    const ray = clamp(Math.floor(screenX / canvas.width * RAY_COUNT), 0, RAY_COUNT - 1);
    if (projection.depth > state.zBuffer[ray] + .04) continue;
    const sourceX = clamp(
      Math.floor((screenX - startX) / Math.max(1, destWidth) * sprite.width),
      0,
      sprite.width - 1
    );
    ctx.drawImage(sprite, sourceX, 0, 1, sprite.height, screenX, projection.top, 1, projection.height);
  }
  ctx.restore();
}

function drawSpriteSheetBillboard(sprite, projection, frame = 0, frameCount = 8, opacity = 1) {
  if (!sprite || !projection || projection.height <= 0) return false;
  const sourceWidth = sprite.width / frameCount;
  const frameIndex = clamp(Math.floor(frame), 0, frameCount - 1);
  const destWidth = projection.height * sourceWidth / sprite.height;
  const startX = Math.floor(projection.x - destWidth / 2);
  const endX = Math.ceil(projection.x + destWidth / 2);
  const sourceFrameX = frameIndex * sourceWidth;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.imageSmoothingEnabled = false;
  for (let screenX = startX; screenX <= endX; screenX += 1) {
    if (screenX < 0 || screenX >= canvas.width) continue;
    const ray = clamp(Math.floor(screenX / canvas.width * RAY_COUNT), 0, RAY_COUNT - 1);
    if (projection.depth > state.zBuffer[ray] + .04) continue;
    const sourceX = clamp(
      sourceFrameX + Math.floor((screenX - startX) / Math.max(1, destWidth) * sourceWidth),
      sourceFrameX,
      sourceFrameX + sourceWidth - 1,
    );
    ctx.drawImage(sprite, sourceX, 0, 1, sprite.height, screenX, projection.top, 1, projection.height);
  }
  ctx.restore();
  return true;
}

// Generated projectile sheets have a large green keying canvas around the
// artwork. Key each RGB sheet once, then crop every frame to one shared union
// of non-green artwork bounds. The shared crop keeps animation frames stable
// while allowing spriteWorldHeight to describe the visible projectile itself.
function prepareKeyedProjectileSheet(image, cacheKey) {
  const framesKey = `__${cacheKey}Frames`;
  if (!spriteReady(image) || image[framesKey]) return;
  const frameCount = 8;
  const cellWidth = Math.floor(image.naturalWidth / frameCount);
  const cellHeight = image.naturalHeight;
  const source = document.createElement('canvas');
  source.width = image.naturalWidth;
  source.height = image.naturalHeight;
  const sourceContext = source.getContext('2d', { willReadFrequently: true });
  sourceContext.imageSmoothingEnabled = false;
  sourceContext.drawImage(image, 0, 0);
  const keyedFrames = [];
  let unionMinX = cellWidth;
  let unionMinY = cellHeight;
  let unionMaxX = 0;
  let unionMaxY = 0;
  for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
    const startX = Math.floor(frameIndex * image.naturalWidth / frameCount);
    const width = Math.min(cellWidth, image.naturalWidth - startX);
    const pixels = sourceContext.getImageData(startX, 0, width, cellHeight);
    let minX = width;
    let minY = cellHeight;
    let maxX = 0;
    let maxY = 0;
    for (let offset = 0; offset < pixels.data.length; offset += 4) {
      const r = pixels.data[offset];
      const g = pixels.data[offset + 1];
      const b = pixels.data[offset + 2];
      if (isChromaGreen(r, g, b)) {
        pixels.data[offset + 3] = 0;
        continue;
      }
      const pixelX = (offset / 4) % width;
      const pixelY = Math.floor(offset / 4 / width);
      minX = Math.min(minX, pixelX);
      minY = Math.min(minY, pixelY);
      maxX = Math.max(maxX, pixelX + 1);
      maxY = Math.max(maxY, pixelY + 1);
    }
    if (maxX <= minX || maxY <= minY) {
      minX = 0; minY = 0; maxX = width; maxY = cellHeight;
    }
    keyedFrames.push({ pixels, width, minX, minY, maxX, maxY });
    unionMinX = Math.min(unionMinX, minX);
    unionMinY = Math.min(unionMinY, minY);
    unionMaxX = Math.max(unionMaxX, maxX);
    unionMaxY = Math.max(unionMaxY, maxY);
  }
  const padX = Math.max(2, Math.round((unionMaxX - unionMinX) * .04));
  const padY = Math.max(2, Math.round((unionMaxY - unionMinY) * .04));
  unionMinX = Math.max(0, unionMinX - padX);
  unionMinY = Math.max(0, unionMinY - padY);
  unionMaxX = Math.min(cellWidth, unionMaxX + padX);
  unionMaxY = Math.min(cellHeight, unionMaxY + padY);
  const cropWidth = Math.max(1, unionMaxX - unionMinX);
  const cropHeight = Math.max(1, unionMaxY - unionMinY);
  image[framesKey] = keyedFrames.map(({ pixels }) => {
    const frame = document.createElement('canvas');
    frame.width = cropWidth;
    frame.height = cropHeight;
    const frameContext = frame.getContext('2d', { willReadFrequently: true });
    frameContext.imageSmoothingEnabled = false;
    frameContext.putImageData(pixels, -unionMinX, -unionMinY);
    return frame;
  });
}
function keyedProjectileFrame(image, frameIndex, cacheKey) {
  if (!spriteReady(image)) return null;
  prepareKeyedProjectileSheet(image, cacheKey);
  const frames = image[`__${cacheKey}Frames`];
  return frames?.[clamp(Math.floor(frameIndex), 0, 7)] || null;
}
function drawKeyedProjectileBillboard(image, projection, frame = 0, cacheKey, opacity = 1) {
  const keyedFrame = keyedProjectileFrame(image, frame, cacheKey);
  if (!keyedFrame) return false;
  return drawBillboard(keyedFrame, projection, opacity);
}

/* Portfolio records are world meshes, never camera-facing cards. */
function portfolioItemFaces(item) {
  const faces = [];
  const yaw = Math.atan2(renderCamera().y - item.y, renderCamera().x - item.x);
  const origin = { x: item.x, y: item.y };
  const color = item.color || '#e7ad67';
  const accent = item.kind === 'chronicle' ? '#77a9e8' : item.kind === 'map' ? '#6ce0c2' : color;
  if (['scroll', 'ledger', 'chronicle', 'map'].includes(item.kind)) {
    addBoxLocal(faces, origin, { side: 0, forward: 0, z: .72 }, [.62, .18, .92], yaw, '#d6b57b', .98, 'bone');
    addBoxLocal(faces, origin, { side: 0, forward: .12, z: .72 }, [.47, .045, .72], yaw, accent, .88, 'leather');
    addBoxLocal(faces, origin, { side: -.21, forward: .14, z: .72 }, [.05, .07, 1.02], '#6f4527', .92, 'wood');
    addBoxLocal(faces, origin, { side: .21, forward: .14, z: .72 }, [.05, .07, 1.02], '#6f4527', .82, 'wood');
    for (let line = 0; line < 3; line += 1) addBoxLocal(faces, origin, { side: -.13, forward: .17, z: .48 + line * .19 }, [.25 - line * .04, .025, .025], '#754c2a', .9, 'wood');
  } else {
    addBoxLocal(faces, origin, { side: 0, forward: 0, z: .56 }, [.58, .58, .72], '#4e3424', .84, 'wood');
    addBoxLocal(faces, origin, { side: 0, forward: .06, z: .72 }, [.34, .34, .5], color, 1.08, 'steel');
    addBoxLocal(faces, origin, { side: 0, forward: .14, z: .72 }, [.13, .08, .27], '#fff1b0', 1.16, 'steel');
    addBoxLocal(faces, origin, { side: -.24, forward: .02, z: .62 }, [.08, .08, .76], accent, .92, 'steel');
    addBoxLocal(faces, origin, { side: .24, forward: .02, z: .62 }, [.08, .08, .76], accent, .76, 'steel');
  }
  return faces;
}
function drawPortfolioItem3D(item, now) {
  renderFaces(portfolioItemFaces(item), .96);
  const projection = projectVerticalBounds(item.x, item.y, .62, 1.2);
  if (!projection) return;
  if (state.revealTimer > 0) {
    ctx.save();
    ctx.globalAlpha = .55 + Math.sin(now / 120) * .15;
    ctx.strokeStyle = '#6ce0c2';
    ctx.shadowBlur = 16;
    ctx.shadowColor = '#6ce0c2';
    ctx.lineWidth = Math.max(1, projection.height * .018);
    ctx.beginPath();
    ctx.arc(projection.x, (projection.top + projection.bottom) / 2, Math.max(8, projection.height * .5), 0, TAU);
    ctx.stroke();
    ctx.restore();
  }
}

/* Low-poly 3D mesh helpers. Coordinates are local side/forward/height triples. */
function localToWorld(originX, originY, yaw, point) { return { x: originX + Math.cos(yaw) * point.forward - Math.sin(yaw) * point.side, y: originY + Math.sin(yaw) * point.forward + Math.cos(yaw) * point.side, z: point.z }; }
function transformLocalPoint(enemy, point, yaw) {
  const scale = enemy.meshScale || 1;
  const baseZ = enemy.meshBaseZ ?? 0;
  const scaledPoint = {
    side: point.side * scale,
    forward: point.forward * scale,
    z: baseZ + (point.z - baseZ) * scale,
  };
  const world = localToWorld(enemy.x, enemy.y, yaw, scaledPoint);
  return cameraPoint(world.x, world.y, world.z + (enemy.zOffset || 0));
}
function makeBoxPoints(center, dimensions, yaw, transform) { const [sideSize, forwardSize, height] = dimensions; const points = []; for (const side of [-1, 1]) for (const forward of [-1, 1]) for (const zSign of [-1, 1]) points.push(transform({ side: center.side + side * sideSize / 2, forward: center.forward + forward * forwardSize / 2, z: center.z + zSign * height / 2 })); return points; }
function addBoxFaces(faces, points, color, shade = 1, material = null) {
  const indices = [[0, 4, 5, 1], [2, 3, 7, 6], [0, 2, 6, 4], [1, 5, 7, 3], [0, 1, 3, 2], [4, 6, 7, 5]];
  const shades = [.72, .88, .64, 1, .8, .58];
  indices.forEach((index, faceIndex) => faces.push({ points: index.map((i) => points[i]), color, shade: shade * shades[faceIndex], material }));
}
function addBoxLocal(faces, enemy, center, dimensions, yaw, color, shade = 1, material = null) {
  addBoxFaces(faces, makeBoxPoints(center, dimensions, yaw, (point) => transformLocalPoint(enemy, point, yaw)), color, shade, material);
}
function vectorCross(a, b) { return { side: a.forward * b.z - a.z * b.forward, forward: a.z * b.side - a.side * b.z, z: a.side * b.forward - a.forward * b.side }; }
function vectorNormalize(value) { const length = Math.hypot(value.side, value.forward, value.z) || 1; return { side: value.side / length, forward: value.forward / length, z: value.z / length }; }
function addBoneLocal(faces, enemy, start, end, radius, yaw, color, material = 'bone') {
  const direction = vectorNormalize({ side: end.side - start.side, forward: end.forward - start.forward, z: end.z - start.z });
  let u = vectorCross(direction, { side: 0, forward: 0, z: 1 }); if (Math.hypot(u.side, u.forward, u.z) < .01) u = { side: 1, forward: 0, z: 0 }; u = vectorNormalize(u); const v = vectorNormalize(vectorCross(direction, u)); const points = [];
  for (const endpoint of [start, end]) for (const a of [-1, 1]) for (const b of [-1, 1]) points.push({ side: endpoint.side + u.side * radius * a + v.side * radius * b, forward: endpoint.forward + u.forward * radius * a + v.forward * radius * b, z: endpoint.z + u.z * radius * a + v.z * radius * b });
  addBoxFaces(faces, points.map((point) => transformLocalPoint(enemy, point, yaw)), color, .92, material);
}
function traceFace(face) {
  ctx.beginPath(); ctx.moveTo(face.projected[0].x, face.projected[0].y); face.projected.slice(1).forEach((point) => ctx.lineTo(point.x, point.y)); ctx.closePath();
}
function paintFace(face) {
  const color = typeof face.color === 'string' ? hexToRgb(face.color) : face.color;
  const pattern = face.material && textures.patterns ? textures.patterns[face.material] : null;
  if (pattern) {
    let minX = canvas.width; let minY = canvas.height; let maxX = 0; let maxY = 0;
    for (const point of face.projected) { minX = Math.min(minX, point.x); minY = Math.min(minY, point.y); maxX = Math.max(maxX, point.x); maxY = Math.max(maxY, point.y); }
    minX = clamp(Math.floor(minX) - 2, 0, canvas.width); minY = clamp(Math.floor(minY) - 2, 0, canvas.height);
    maxX = clamp(Math.ceil(maxX) + 2, 0, canvas.width); maxY = clamp(Math.ceil(maxY) + 2, 0, canvas.height);
    ctx.save();
    traceFace(face); ctx.clip();
    ctx.fillStyle = pattern;
    ctx.fillRect(minX, minY, Math.max(1, maxX - minX), Math.max(1, maxY - minY));
    // Procedural textures are detail layers; preserve the authored material color.
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = rgba(color, .92);
    ctx.fillRect(minX, minY, Math.max(1, maxX - minX), Math.max(1, maxY - minY));
    ctx.globalCompositeOperation = 'source-over';
    if (face.shade < 1) {
      ctx.fillStyle = `rgba(18, 10, 5, ${clamp(1 - face.shade, 0, .75)})`;
      ctx.fillRect(minX, minY, Math.max(1, maxX - minX), Math.max(1, maxY - minY));
    }
    ctx.restore();
  } else { ctx.fillStyle = rgba({ r: color.r * face.shade, g: color.g * face.shade, b: color.b * face.shade }, 1); traceFace(face); ctx.fill(); }
  traceFace(face); ctx.strokeStyle = 'rgba(33, 21, 13, .72)'; ctx.lineWidth = 1; ctx.stroke();
}
function renderFaces(faces, opacity = 1, ignoreWall = false) {
  const projected = [];
  for (const face of faces) {
    const points = face.points.map(projectCameraPoint); if (points.some((point) => !point)) continue; const depth = points.reduce((sum, point) => sum + point.depth, 0) / points.length; const screenX = points.reduce((sum, point) => sum + point.x, 0) / points.length; const ray = clamp(Math.floor(screenX / canvas.width * RAY_COUNT), 0, RAY_COUNT - 1);
    if (!ignoreWall && depth > state.zBuffer[ray] + .06) continue; projected.push({ ...face, projected: points, depth });
  }
  projected.sort((a, b) => b.depth - a.depth); ctx.save(); ctx.globalAlpha = opacity; for (const face of projected) paintFace(face); ctx.restore();
}
function enemySurfaceMaterial(kind) {
  if (kind === 'warden' || kind === 'archon') return 'steel';
  if (kind === 'crawler' || kind === 'briar-mantis') return 'stone';
  if (kind === 'moth') return 'bone';
  return 'leather';
}
function enemyMeshContext(enemy) {
  const profile = enemyProfile(enemy);
  const faces = [];
  const yaw = Math.atan2(renderCamera().y - enemy.y, renderCamera().x - enemy.x);
  const walkPhase = Number.isFinite(enemy.walkPhase) ? enemy.walkPhase : 0;
  const walk = enemy.alerted ? Math.sin(walkPhase) * .12 : 0;
  const attack = enemy.attackTime > 0 ? easeOutCubic(1 - enemy.attackTime / .55) : 0;
  const fall = enemy.dead ? clamp(enemy.deathTime / .75, 0, 1) : 0;
  const hover = profile.hover ? Math.sin(enemy.walkPhase * .7) * profile.hover : 0;
  const poseYaw = yaw + attack * .045 - walk * .035;
  const shift = (point) => ({
    side: point.side * profile.scale,
    forward: point.forward * profile.scale + fall * .18 - attack * .035,
    z: point.z * profile.scale * (1 - fall) + .06 + hover * (1 - fall),
  });
  const surface = enemySurfaceMaterial(enemy.kind);
  const box = (center, dimensions, color, shade = 1, material = null) => addBoxLocal(
    faces,
    { x: enemy.x, y: enemy.y },
    shift(center),
    dimensions.map((value) => value * profile.scale),
    poseYaw,
    color,
    shade,
    material || surface,
  );
  const bone = (start, end, radius, color, material = null) => addBoneLocal(
    faces,
    { x: enemy.x, y: enemy.y },
    shift(start),
    shift(end),
    radius * profile.scale,
    poseYaw,
    color,
    material || 'bone',
  );
  return { faces, profile, yaw, walk, attack, fall, box, bone, color: enemy.color || profile.color };
}

function wraithFaces(enemy) {
  const mesh = enemyMeshContext(enemy); const { box, bone, color: aura } = mesh;
  box({ side: 0, forward: 0, z: 1.45 }, [.52, .42, .32], aura, .82);
  box({ side: 0, forward: -.01, z: 1.12 }, [.45, .5, .58], '#44304f', .86);
  box({ side: 0, forward: .12, z: 1.77 }, [.34, .34, .3], aura, .95);
  box({ side: -.1, forward: .25, z: 1.8 }, [.06, .04, .06], '#efd17c');
  box({ side: .1, forward: .25, z: 1.8 }, [.06, .04, .06], '#efd17c');
  bone({ side: -.2, forward: 0, z: 1.3 }, { side: -.52, forward: .03, z: .92 }, .055, aura);
  bone({ side: -.52, forward: .03, z: .92 }, { side: -.65, forward: .18, z: .56 }, .045, aura);
  bone({ side: .2, forward: 0, z: 1.3 }, { side: .52, forward: .03, z: .92 }, .055, aura);
  bone({ side: .52, forward: .03, z: .92 }, { side: .65, forward: -.12, z: .56 }, .045, aura);
  bone({ side: -.12, forward: -.08, z: .92 }, { side: -.25, forward: -.18, z: .42 }, .06, '#38263f');
  bone({ side: .12, forward: -.08, z: .92 }, { side: .25, forward: -.18, z: .42 }, .06, '#38263f');
  return mesh.faces;
}

function impFaces(enemy) {
  const mesh = enemyMeshContext(enemy); const { box, bone, color: hide } = mesh;
  box({ side: 0, forward: 0, z: .82 }, [.46, .38, .55], '#5a2928', .9);
  box({ side: 0, forward: .1, z: 1.25 }, [.48, .4, .4], hide, .95);
  box({ side: 0, forward: .28, z: 1.18 }, [.27, .12, .15], '#3e1c1b', .92);
  box({ side: -.12, forward: .3, z: 1.3 }, [.055, .035, .055], '#f0cf79');
  box({ side: .12, forward: .3, z: 1.3 }, [.055, .035, .055], '#f0cf79');
  bone({ side: -.16, forward: .02, z: .92 }, { side: -.44, forward: .06, z: .62 }, .045, hide);
  bone({ side: .16, forward: .02, z: .92 }, { side: .44, forward: .06, z: .62 }, .045, hide);
  bone({ side: -.14, forward: -.03, z: .57 }, { side: -.25 - mesh.walk, forward: .08, z: .22 }, .06, '#4b2522');
  bone({ side: .14, forward: -.03, z: .57 }, { side: .25 + mesh.walk, forward: .08, z: .22 }, .06, '#4b2522');
  box({ side: -.22, forward: .17, z: 1.62 }, [.08, .08, .3], '#3c1a19', .8);
  box({ side: .22, forward: .17, z: 1.62 }, [.08, .08, .3], '#3c1a19', .8);
  return mesh.faces;
}

function crawlerFaces(enemy) {
  const mesh = enemyMeshContext(enemy); const { box, bone, color: hide } = mesh;
  for (let index = 0; index < 3; index += 1) {
    const forward = .24 - index * .28;
    box({ side: 0, forward, z: .36 + (index === 0 ? .04 : 0) }, [.42 - index * .04, .32, .24], index === 0 ? hide : '#4d4e4a', .9);
  }
  box({ side: 0, forward: .45, z: .42 }, [.32, .2, .22], '#30322f', .95);
  box({ side: -.09, forward: .55, z: .45 }, [.045, .03, .045], '#e7c56d');
  box({ side: .09, forward: .55, z: .45 }, [.045, .03, .045], '#e7c56d');
  for (const side of [-1, 1]) {
    bone({ side: side * .16, forward: .22, z: .3 }, { side: side * .42, forward: .38, z: .12 }, .035, hide);
    bone({ side: side * .16, forward: -.04, z: .28 }, { side: side * .42, forward: -.22, z: .1 }, .035, hide);
  }
  return mesh.faces;
}

function leechFaces(enemy) {
  const mesh = enemyMeshContext(enemy); const { box, bone, color: hide } = mesh;
  for (let index = 0; index < 4; index += 1) {
    const forward = .34 - index * .23;
    box({ side: 0, forward, z: .28 + Math.sin(index * 1.8) * .025 }, [.26 + (index === 0 ? .08 : 0), .25, .2], index === 0 ? hide : '#3c4355', .9);
  }
  box({ side: 0, forward: .59, z: .29 }, [.3, .12, .16], '#9d473f', .95);
  bone({ side: -.12, forward: .62, z: .3 }, { side: -.22, forward: .72, z: .22 }, .025, '#d27a5c');
  bone({ side: .12, forward: .62, z: .3 }, { side: .22, forward: .72, z: .22 }, .025, '#d27a5c');
  return mesh.faces;
}

function ghoulFaces(enemy) {
  const mesh = enemyMeshContext(enemy); const { box, bone, color: hide } = mesh;
  box({ side: 0, forward: -.02, z: .96 }, [.56, .42, .72], '#3d4948', .82);
  box({ side: 0, forward: .18, z: 1.5 }, [.42, .36, .34], hide, .94);
  box({ side: 0, forward: .35, z: 1.38 }, [.3, .12, .13], '#29302e', .9);
  box({ side: -.1, forward: .4, z: 1.55 }, [.055, .03, .055], '#e4c674');
  box({ side: .1, forward: .4, z: 1.55 }, [.055, .03, .055], '#e4c674');
  bone({ side: -.23, forward: .04, z: 1.22 }, { side: -.48, forward: .24, z: .72 }, .065, hide);
  bone({ side: .23, forward: .04, z: 1.22 }, { side: .48, forward: .24, z: .72 }, .065, hide);
  bone({ side: -.13, forward: -.03, z: .65 }, { side: -.21 - mesh.walk, forward: .03, z: .16 }, .075, '#566260');
  bone({ side: .13, forward: -.03, z: .65 }, { side: .21 + mesh.walk, forward: .03, z: .16 }, .075, '#566260');
  return mesh.faces;
}

function quadrupedFaces(enemy) {
  const mesh = enemyMeshContext(enemy); const { box, bone, color: hide } = mesh;
  const hound = enemy.kind === 'hound';
  const bodyColor = hound ? '#56332f' : '#51436a';
  box({ side: 0, forward: -.03, z: .58 }, [.72, .82, .42], bodyColor, .88);
  box({ side: 0, forward: .43, z: .72 }, [.46, .46, .42], hide, .94);
  box({ side: 0, forward: .7, z: .66 }, [.34, .27, .2], '#332524', .9);
  box({ side: -.12, forward: .75, z: .75 }, [.05, .035, .05], '#f0cf79');
  box({ side: .12, forward: .75, z: .75 }, [.05, .035, .05], '#f0cf79');
  for (const side of [-1, 1]) for (const forward of [-.25, .27]) {
    bone({ side: side * .25, forward, z: .48 }, { side: side * (.28 + mesh.walk * side), forward: forward + .05, z: .1 }, .07, hide);
  }
  bone({ side: 0, forward: -.42, z: .62 }, { side: .12, forward: -.78, z: .85 + mesh.walk }, .045, hound ? '#7f4c43' : '#765a9a');
  if (hound) {
    box({ side: -.15, forward: .48, z: 1.05 }, [.1, .12, .24], '#4d2a28', .9);
    box({ side: .15, forward: .48, z: 1.05 }, [.1, .12, .24], '#4d2a28', .9);
  } else {
    box({ side: -.18, forward: .37, z: 1.04 }, [.13, .16, .22], '#6b526d', .86);
    box({ side: .18, forward: .37, z: 1.04 }, [.13, .16, .22], '#6b526d', .86);
  }
  return mesh.faces;
}

function briarMantisFaces(enemy) {
  const mesh = enemyMeshContext(enemy); const { box, bone, color: shell } = mesh;
  const moss = '#46553b';
  const thorn = '#b58b4e';
  // Low, segmented thorax and raised head establish an insect silhouette.
  box({ side: 0, forward: -.18, z: .62 }, [.72, .92, .38], moss, .86, 'stone');
  box({ side: 0, forward: .34, z: .78 }, [.5, .48, .42], shell, .96, 'stone');
  box({ side: 0, forward: .63, z: 1.02 }, [.34, .32, .42], '#283426', .94, 'stone');
  box({ side: -.1, forward: .79, z: 1.08 }, [.055, .045, .055], '#f0cf79', 1.14, 'steel');
  box({ side: .1, forward: .79, z: 1.08 }, [.055, .045, .055], '#f0cf79', 1.14, 'steel');
  // Three jointed legs on each side; the sharp angles make it read unlike the
  // quadruped hound archetype used elsewhere in the dungeon.
  for (const side of [-1, 1]) for (let leg = 0; leg < 3; leg += 1) {
    const forward = .32 - leg * .38;
    const reach = .52 + (leg === 1 ? .12 : 0);
    bone({ side: side * .25, forward, z: .68 }, { side: side * reach, forward: forward + .16, z: .34 }, .045, shell, 'bone');
    bone({ side: side * reach, forward: forward + .16, z: .34 }, { side: side * (.78 + leg * .04), forward: forward - .12, z: .08 }, .032, moss, 'bone');
  }
  // Back thorns and forward mandibles sell the ambusher as a bramble parasite.
  for (let spike = 0; spike < 3; spike += 1) {
    box({ side: (spike - 1) * .2, forward: -.48, z: .98 + spike * .12 }, [.09, .22, .34], thorn, .88, 'steel');
  }
  bone({ side: -.1, forward: .78, z: .98 }, { side: -.34, forward: 1.08, z: .82 }, .025, thorn, 'bone');
  bone({ side: .1, forward: .78, z: .98 }, { side: .34, forward: 1.08, z: .82 }, .025, thorn, 'bone');
  return mesh.faces;
}

function mothFaces(enemy) {
  const mesh = enemyMeshContext(enemy); const { box, bone, color: wing } = mesh;
  box({ side: 0, forward: 0, z: 1.16 }, [.2, .36, .56], '#49382b', .9);
  box({ side: 0, forward: .2, z: 1.5 }, [.25, .24, .22], wing, .96);
  box({ side: -.07, forward: .34, z: 1.52 }, [.035, .025, .035], '#f4d47e');
  box({ side: .07, forward: .34, z: 1.52 }, [.035, .025, .035], '#f4d47e');
  box({ side: -.42, forward: 0, z: 1.2 }, [.62, .09, .58], wing, .68);
  box({ side: .42, forward: 0, z: 1.2 }, [.62, .09, .58], wing, .54);
  bone({ side: -.16, forward: -.02, z: 1.2 }, { side: -.72, forward: .02, z: 1.55 }, .025, '#e9c17b');
  bone({ side: .16, forward: -.02, z: 1.2 }, { side: .72, forward: .02, z: 1.55 }, .025, '#e9c17b');
  bone({ side: -.06, forward: -.05, z: .96 }, { side: -.2, forward: -.16, z: .65 }, .025, '#75513a');
  bone({ side: .06, forward: -.05, z: .96 }, { side: .2, forward: -.16, z: .65 }, .025, '#75513a');
  return mesh.faces;
}

function wardenFaces(enemy) {
  const mesh = enemyMeshContext(enemy); const { box, bone, color: armor } = mesh;
  box({ side: 0, forward: 0, z: 1.12 }, [.7, .48, .88], armor, .86);
  box({ side: 0, forward: .12, z: 1.76 }, [.5, .42, .42], '#514b43', .96);
  box({ side: 0, forward: .32, z: 1.68 }, [.38, .1, .12], '#272622', .8);
  box({ side: -.14, forward: .37, z: 1.78 }, [.055, .03, .055], '#edca70');
  box({ side: .14, forward: .37, z: 1.78 }, [.055, .03, .055], '#edca70');
  box({ side: -.48, forward: .06, z: 1.2 }, [.22, .44, .5], '#5e5044', .78);
  box({ side: .48, forward: .06, z: 1.2 }, [.22, .44, .5], '#5e5044', .7);
  bone({ side: -.3, forward: .02, z: 1.35 }, { side: -.63, forward: .18, z: .88 }, .075, armor);
  bone({ side: .3, forward: .02, z: 1.35 }, { side: .62, forward: .42, z: .82 }, .075, armor);
  bone({ side: -.2, forward: -.02, z: .72 }, { side: -.25 - mesh.walk, forward: .03, z: .08 }, .09, '#4b443c');
  bone({ side: .2, forward: -.02, z: .72 }, { side: .25 + mesh.walk, forward: .03, z: .08 }, .09, '#4b443c');
  box({ side: -.66, forward: .34, z: 1.06 }, [.12, .1, .72], '#8a6a49', .72);
  box({ side: .66, forward: .5, z: 1.3 }, [.08, .08, 1.05], '#b9b7a0', .9);
  return mesh.faces;
}

function archonFaces(enemy) {
  const mesh = enemyMeshContext(enemy);
  const { box, bone } = mesh;
  const phaseColor = enemy.phase === 3 ? '#e9e9e0' : enemy.phase === 2 ? '#77a9e8' : '#d99762';
  const shadowColor = enemy.phase === 3 ? '#7e7f84' : enemy.phase === 2 ? '#315a76' : '#704535';
  const coreColor = enemy.shield > 0 ? '#d7f1ee' : phaseColor;
  box({ side: 0, forward: 0, z: 1.38 }, [1.28, .82, 1.52], '#323c40', .8, 'steel');
  box({ side: 0, forward: .28, z: 1.45 }, [.82, .2, 1.04], shadowColor, .9, 'steel');
  box({ side: 0, forward: .43, z: 1.44 }, [.42, .12, .55], coreColor, 1.08, 'steel');
  box({ side: 0, forward: .51, z: 1.44 }, [.18, .045, .25], '#fff6c4', 1.15, 'steel');
  box({ side: 0, forward: .06, z: 2.28 }, [.68, .56, .42], '#4c5759', .95, 'steel');
  box({ side: 0, forward: .34, z: 2.29 }, [.47, .09, .12], '#15191a', .82, 'steel');
  box({ side: -.15, forward: .4, z: 2.34 }, [.07, .04, .07], phaseColor, 1.2);
  box({ side: .15, forward: .4, z: 2.34 }, [.07, .04, .07], phaseColor, 1.2);
  box({ side: -.78, forward: 0, z: 1.62 }, [.34, .66, .46], shadowColor, .8, 'steel');
  box({ side: .78, forward: 0, z: 1.62 }, [.34, .66, .46], shadowColor, .72, 'steel');
  bone({ side: -.43, forward: .02, z: 1.8 }, { side: -.92, forward: .22, z: 1.2 }, .1, phaseColor, 'steel');
  bone({ side: .43, forward: .02, z: 1.8 }, { side: .92, forward: .22, z: 1.2 }, .1, phaseColor, 'steel');
  bone({ side: -.92, forward: .22, z: 1.2 }, { side: -1.04, forward: .36, z: .72 }, .07, shadowColor, 'steel');
  bone({ side: .92, forward: .22, z: 1.2 }, { side: 1.04, forward: .36, z: .72 }, .07, shadowColor, 'steel');
  bone({ side: -.32, forward: -.02, z: .75 }, { side: -.42, forward: .12, z: .08 }, .13, '#282e30', 'steel');
  bone({ side: .32, forward: -.02, z: .75 }, { side: .42, forward: .12, z: .08 }, .13, '#282e30', 'steel');
  // Three floating command sigils make the silhouette read as a boss, not a scaled-up minion.
  for (let index = 0; index < 3; index += 1) {
    const angle = enemy.pulse * .9 + index * TAU / 3;
    const distance = 1.02 + Math.sin(enemy.pulse * 1.4 + index) * .08;
    box({ side: Math.cos(angle) * distance, forward: .05 + Math.sin(angle) * .16, z: 1.25 + Math.sin(angle * 1.7) * .48 }, [.16, .12, .16], phaseColor, 1.15, 'steel');
  }
  if (enemy.shield > 0) {
    box({ side: 0, forward: -.02, z: 1.45 }, [1.62, .07, 2.45], '#8ddbd1', .25, 'steel');
  }
  return mesh.faces;
}

function seerFaces(enemy) {
  const mesh = enemyMeshContext(enemy); const { box, bone, color } = mesh;
  const cloak = color || '#78b6d0';
  box({ side: 0, forward: 0, z: 1.04 }, [.64, .48, 1.22], '#273640', .78, 'leather');
  box({ side: 0, forward: .12, z: 1.72 }, [.48, .42, .44], cloak, .96, 'steel');
  box({ side: 0, forward: .32, z: 1.64 }, [.3, .09, .12], '#142126', .84, 'steel');
  box({ side: -.1, forward: .38, z: 1.75 }, [.065, .035, .065], '#e9d17d', 1.12, 'steel');
  box({ side: .1, forward: .38, z: 1.75 }, [.065, .035, .065], '#e9d17d', 1.12, 'steel');
  box({ side: -.25, forward: .02, z: 1.32 }, [.16, .18, .55], cloak, .78, 'leather');
  box({ side: .25, forward: .02, z: 1.32 }, [.16, .18, .55], cloak, .68, 'leather');
  bone({ side: -.2, forward: .02, z: 1.3 }, { side: -.48, forward: .22, z: .78 }, .055, cloak, 'steel');
  bone({ side: .2, forward: .02, z: 1.3 }, { side: .48, forward: .22, z: .78 }, .055, cloak, 'steel');
  bone({ side: -.13, forward: -.02, z: .62 }, { side: -.2 - mesh.walk, forward: .04, z: .1 }, .075, '#1e292d', 'leather');
  bone({ side: .13, forward: -.02, z: .62 }, { side: .2 + mesh.walk, forward: .04, z: .1 }, .075, '#1e292d', 'leather');
  // Staff and hovering lens make the ranged role readable in silhouette.
  bone({ side: .58, forward: .08, z: .12 }, { side: .58, forward: .08, z: 1.65 }, .035, '#8e633d', 'wood');
  box({ side: .58, forward: .08, z: 1.78 }, [.18, .18, .18], '#c7f4e7', 1.18, 'steel');
  const orb = { side: -.62, forward: .14 + Math.sin(enemy.walkPhase * .7) * .06, z: 1.42 + Math.sin(enemy.walkPhase) * .1 };
  box(orb, [.22, .22, .22], '#78d9e8', 1.16, 'steel');
  box(orb, [.08, .08, .27], '#fff1b0', 1.2, 'steel');
  return mesh.faces;
}
function quakeFaces(enemy) {
  const mesh = enemyMeshContext(enemy); const { box, bone, color } = mesh;
  const armor = color || '#cf8b5e';
  box({ side: 0, forward: 0, z: 1.08 }, [1.02, .72, 1.22], '#47352d', .82, 'leather');
  box({ side: 0, forward: .18, z: 1.42 }, [.72, .24, .72], armor, .92, 'steel');
  box({ side: 0, forward: .35, z: 1.82 }, [.62, .44, .38], '#62483a', .95, 'steel');
  box({ side: 0, forward: .52, z: 1.78 }, [.42, .08, .12], '#231b18', .84, 'steel');
  box({ side: -.16, forward: .58, z: 1.87 }, [.06, .035, .06], '#f1cf79', 1.12, 'steel');
  box({ side: .16, forward: .58, z: 1.87 }, [.06, .035, .06], '#f1cf79', 1.12, 'steel');
  box({ side: -.62, forward: .02, z: 1.35 }, [.32, .62, .62], armor, .7, 'steel');
  box({ side: .62, forward: .02, z: 1.35 }, [.32, .62, .62], armor, .62, 'steel');
  bone({ side: -.38, forward: .02, z: 1.42 }, { side: -.76, forward: .2, z: .78 }, .105, armor, 'steel');
  bone({ side: .38, forward: .02, z: 1.42 }, { side: .76, forward: .2, z: .78 }, .105, armor, 'steel');
  box({ side: -.78, forward: .25, z: .58 }, [.26, .3, .3], '#392722', .84, 'steel');
  box({ side: .78, forward: .25, z: .58 }, [.26, .3, .3], '#392722', .76, 'steel');
  bone({ side: -.26, forward: -.04, z: .72 }, { side: -.34 - mesh.walk, forward: .05, z: .1 }, .12, '#302725', 'steel');
  bone({ side: .26, forward: -.04, z: .72 }, { side: .34 + mesh.walk, forward: .05, z: .1 }, .12, '#302725', 'steel');
  // Heavy back-spikes and a central seismic core distinguish the ground attacker.
  for (const side of [-1, 1]) for (let spike = 0; spike < 2; spike += 1) box({ side: side * (.35 + spike * .2), forward: -.38, z: 1.25 + spike * .28 }, [.12, .16, .38], '#8d5d3f', .68, 'steel');
  box({ side: 0, forward: .5, z: 1.28 }, [.2, .07, .3], '#e7ad67', 1.18, 'steel');
  return mesh.faces;
}

function enemyFaces(enemy) {
  switch (enemy.kind) {
    case 'wraith': return wraithFaces(enemy);
    case 'imp': return impFaces(enemy);
    case 'crawler': return crawlerFaces(enemy);
    case 'leech': return leechFaces(enemy);
    case 'ghoul': return ghoulFaces(enemy);
    case 'beast':
    case 'hound': return quadrupedFaces(enemy);
    case 'briar-mantis': return briarMantisFaces(enemy);
    case 'moth': return mothFaces(enemy);
    case 'seer': return seerFaces(enemy);
    case 'quake': return quakeFaces(enemy);
    case 'warden': return wardenFaces(enemy);
    case 'archon': return archonFaces(enemy);
    default: return [];
  }
}

function drawIndustrialEnemyAccents() {}

function pixelRect(x, y, w, h, color, scale) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x * scale), Math.round(y * scale), Math.max(1, Math.round(w * scale)), Math.max(1, Math.round(h * scale)));
}
function enemyHitVisualState(enemy) {
  const remaining = Math.max(0, Number(enemy.hitFlash || 0));
  if (!remaining) return { alpha: 0, offset: 0, color: '#ffffff' };
  const critical = Boolean(enemy.lastHitCritical);
  const duration = critical ? .48 : .3;
  const progress = clamp(1 - remaining / duration, 0, 1);
  const envelope = Math.sin(Math.PI * progress);
  const amplitude = settings.reducedMotion ? .018 : (critical ? .075 : .055);
  const direction = enemy.hitShakeDirection || 1;
  return {
    alpha: envelope * (critical ? .86 : .72),
    offset: Math.sin(progress * Math.PI * 7) * amplitude * direction,
    color: critical ? '#ff4f4f' : '#ffffff',
  };
}
function drawPixelEnemySprite(enemy) {
  const baseProfile = enemyProfile(enemy);
  const profile = enemy.miniBoss ? { ...baseProfile, scale: baseProfile.scale * 1.35, height: baseProfile.height * 1.35, aimHeight: baseProfile.aimHeight * 1.25 } : baseProfile;
  const camera = cameraPoint(enemy.x, enemy.y, profile.aimHeight);
  if (camera.forward <= .1 || Math.abs(Math.atan2(camera.side, camera.forward)) > cameraFov() * .76) return;

  const attacking = enemy.attackTime > 0;
  const animationClock = Number.isFinite(enemy.animationTime) ? enemy.animationTime : 0;
  const attackDuration = enemy.attackDuration || (enemy.attackStyle === 'ranged' ? .72 : .68);
  const animationFrame = attacking
    ? clamp(Math.floor((attackDuration - enemy.attackTime) / (attackDuration / 3)), 0, 2)
    : enemy.moving ? Math.floor(animationClock * 8.5) % 3 : 0;
  const hitShake = 0; // Enemy sprites never receive a screen-space combat rectangle.
  const profileRow = profile.spriteRow;
  const sheetSprite = Number.isInteger(profileRow)
    ? enemySpriteFrame(gameSprites.enemySheet, profileRow, animationFrame, attacking)
    : null;
  const authoredSprite = enemy.kind === 'warden'
    ? (attacking && spriteReady(gameSprites.enemyWardenAttack) ? gameSprites.enemyWardenAttack : gameSprites.enemyWardenIdle)
    : sheetSprite;

  if (authoredSprite) {
    // Match the previous procedural silhouette's projected scale while using
    // the authored sprite's own aspect ratio. This remains a world billboard,
    // so it is perspective-scaled and clipped by the wall depth buffer.
    const spriteWorldHeight = profile.height * .68;
    const hover = profile.hover || (enemy.kind === 'insectoid' ? .055 : .018);
    const breathing = Math.sin(animationClock * (enemy.moving ? 9.5 : 3.2) + enemy.walkPhase) * hover;
    const attackLift = attacking ? Math.sin(clamp((attackDuration - (enemy.attackTime || 0)) / attackDuration, 0, 1) * Math.PI) * .045 : 0;
    // Keep feet grounded while allowing hovering, breathing, and attack
    // anticipation to move the silhouette in world space.
    const projection = projectVerticalBounds(enemy.x, enemy.y, spriteWorldHeight / 2 + breathing + attackLift, spriteWorldHeight);
    if (!projection || projection.height <= 0) return;
    const hit = enemyHitVisualState(enemy);
    projection.x += hit.offset * focalX() / Math.max(.1, projection.depth);
    const opacity = enemy.dead ? clamp(1 - enemy.deathTime / .75, 0, 1) : 1;
    ctx.save();
    // Keep the authored sprite on the cheap, unfiltered path. The old CSS
    // filter made every vertical billboard slice expensive enough to stall the
    // world renderer.
    drawBillboard(authoredSprite, projection, opacity);
    if (hit.alpha > 0) {
      // A small pixel bracket is deliberately screen-space and bounded. It is
      // visible on both dark and bright sprites without a second sprite pass.
      const hitColor = hit.color === '#ffffff' ? '#fff4c2' : hit.color;
      const unit = Math.max(2, Math.round(canvas.height * .006));
      const x = Math.round(projection.x - projection.height * .24);
      const y = Math.round(projection.top + projection.height * .08);
      const w = Math.max(unit * 4, Math.round(projection.height * .48));
      const h = Math.max(unit * 5, Math.round(projection.height * .82));
      const arm = Math.max(unit * 2, Math.round(w * .22));
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = Math.min(.95, hit.alpha * 1.15);
      ctx.fillStyle = hitColor;
      // Four chunky corner brackets, aligned to the game's pixel grid.
      ctx.fillRect(x, y, arm, unit);
      ctx.fillRect(x, y, unit, arm);
      ctx.fillRect(x + w - arm, y, arm, unit);
      ctx.fillRect(x + w - unit, y, unit, arm);
      ctx.fillRect(x, y + h - unit, arm, unit);
      ctx.fillRect(x, y + h - arm, unit, arm);
      ctx.fillRect(x + w - arm, y + h - unit, arm, unit);
      ctx.fillRect(x + w - unit, y + h - arm, unit, arm);
    }
    ctx.restore();
    return;
  }

  const point = projectCameraPoint(cameraPoint(enemy.x, enemy.y, profile.aimHeight));
  if (!point) return;
  const hit = enemyHitVisualState(enemy);
  point.x += hit.offset * focalX() / Math.max(.1, camera.forward) + hitShake;
  const height = Math.max(18, canvas.height * profile.height / Math.max(.7, camera.forward) * .42);
  const width = Math.max(14, height * (enemy.kind === 'crawler' ? 1.45 : .72));
  const scale = Math.max(1, Math.floor(height / 24));
  const left = point.x - width / 2;
  const top = point.y - height * .72;
  const c = enemy.color || profile.color || '#d75b45';
  const dark = '#15171a';
  const shadow = '#49252b';
  const glow = attacking ? (profile.attackColor || '#fff1b0') : c;
  ctx.save();
  ctx.globalAlpha = enemy.dead ? clamp(1 - enemy.deathTime / .75, 0, 1) : 1;
  ctx.imageSmoothingEnabled = false;
  // Pixel-art fallback is drawn in world projection space, not as a screen HUD.
  pixelRect(left / scale, top / scale, width / scale, height / scale, 'rgba(0,0,0,.28)', scale);
  const px = left / scale;
  const py = top / scale;
  const unit = Math.max(1, width / 16 / scale);
  const rect = (gx, gy, gw, gh, color) => pixelRect(px + gx * unit, py + gy * unit, gw * unit, gh * unit, color, scale);
  if (enemy.kind === 'moth' || enemy.kind === 'wraith' || enemy.kind === 'seer') {
    rect(5, 1, 6, 4, glow); rect(4, 5, 8, 8, shadow); rect(2, 6, 3, 5, c); rect(11, 6, 3, 5, c); rect(6, 3, 1, 1, '#fff1b0'); rect(9, 3, 1, 1, '#fff1b0'); rect(3, 12, 4, 2, dark); rect(9, 12, 4, 2, dark);
  } else if (enemy.kind === 'crawler' || enemy.kind === 'leech') {
    rect(3, 7, 10, 5, dark); rect(5, 4, 6, 5, c); rect(6, 5, 1, 1, '#fff1b0'); rect(9, 5, 1, 1, '#fff1b0'); for (const leg of [2, 4, 11, 13]) { rect(leg, 11, 1, 4, c); rect(leg + (leg < 8 ? -1 : 1), 14, 2, 1, shadow); }
  } else if (enemy.kind === 'quake' || enemy.kind === 'beast' || enemy.kind === 'warden' || enemy.kind === 'archon') {
    rect(4, 2, 8, 5, c); rect(3, 7, 10, 7, dark); rect(5, 8, 6, 5, shadow); rect(1, 8, 3, 2, c); rect(12, 8, 3, 2, c); rect(5, 3, 1, 1, '#fff1b0'); rect(10, 3, 1, 1, '#fff1b0'); rect(5, 14, 3, 3, dark); rect(9, 14, 3, 3, dark);
  } else {
    rect(5, 2, 6, 5, c); rect(4, 7, 8, 7, shadow); rect(6, 3, 1, 1, '#fff1b0'); rect(9, 3, 1, 1, '#fff1b0'); rect(2, 8, 3, 2, c); rect(11, 8, 3, 2, c); rect(5, 14, 3, 3, dark); rect(9, 14, 3, 3, dark);
  }
  if (hit.alpha > 0) {
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = hit.alpha;
    ctx.fillStyle = hit.color;
    ctx.strokeStyle = hit.color;
    ctx.lineWidth = Math.max(2, scale * 1.5);
    ctx.strokeRect(left - scale, top - scale, width + scale * 2, height + scale * 2);
  }
  ctx.restore();
}

function drawEnemyCombatFeedback() {
  // Intentionally empty: the old projected fillRect created a white box above enemies.
}

function drawEnemyPresence(enemy, projection, now) {
  if (!projection) return;
  const profile = enemyProfile(enemy);
  const shadowWidth = Math.max(4, projection.height * (profile.scale > 1 ? .34 : .22));
  const shadowHeight = Math.max(2, shadowWidth * .22);
  ctx.save();
  ctx.globalAlpha = enemy.dead ? .08 : .28;
  ctx.fillStyle = '#050304';
  ctx.beginPath();
  ctx.ellipse(projection.x, projection.bottom - Math.max(1, projection.height * .012), shadowWidth, shadowHeight, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}
function drawEnemyVitals(enemy, projection, now) {
  if (!projection || enemy.dead || (!enemy.hitFlash && projection.depth > 5.5)) return;
  const ratio = clamp((enemy.hp || 0) / Math.max(1, enemy.maxHp || enemy.hp || 1), 0, 1);
  const width = clamp(projection.height * .48, 24, 92);
  const height = Math.max(3, Math.round(canvas.height * .006));
  const x = projection.x - width / 2;
  const y = projection.top - height * 2.8;
  ctx.save();
  ctx.globalAlpha = .72 + Math.sin(now / 120) * .08;
  ctx.fillStyle = 'rgba(4, 3, 3, .72)';
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = enemy.boss ? '#d8c18b' : (enemy.attackColor || '#d76b49');
  ctx.fillRect(x + 1, y + 1, Math.max(1, (width - 2) * ratio), Math.max(1, height - 2));
  ctx.restore();
}

function drawEnemy3D(enemy) {
  // Unknown or legacy actors have no visual representation. Never substitute
  // the retired classic skeleton mesh for an authored enemy archetype.
  if (!ENEMY_PROFILES[enemy?.kind]) return;
  const profile = enemyProfile(enemy);
  const camera = cameraPoint(enemy.x, enemy.y, profile.aimHeight);
  const isArchon = Boolean(enemy.boss);
  if (camera.forward <= .1 || (!isArchon && Math.abs(Math.atan2(camera.side, camera.forward)) > cameraFov() * .72)) return;
  if (!isArchon && camera.forward > MAX_DEPTH + 3) return;
  const aliveOpacity = enemy.dead ? clamp(1 - enemy.deathTime / .75, 0, 1) : 1;
  const presenceProjection = projectVerticalBounds(enemy.x, enemy.y, profile.height / 2, profile.height);
  drawEnemyPresence(enemy, presenceProjection, state.now || performance.now());

  const usesAuthoredSprite = Number.isInteger(profile.spriteRow) || (enemy.kind === 'warden' && spriteReady(gameSprites.enemyWardenIdle));
  if (usesAuthoredSprite) {
    drawPixelEnemySprite(enemy);
  } else {
    const faces = enemyFaces(enemy);
    if (faces.length) renderFaces(faces, aliveOpacity);
  }
  const projection = projectVerticalBounds(enemy.x, enemy.y, profile.height / 2, profile.height);
  drawEnemyVitals(enemy, projection, state.now || performance.now());
  if (projection && enemy.hitFlash > 0 && !usesAuthoredSprite) {
    const hit = enemyHitVisualState(enemy);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = hit.alpha * .58;
    ctx.strokeStyle = hit.color;
    ctx.lineWidth = Math.max(1, projection.height * .018);
    ctx.strokeRect(projection.x - projection.height * .24, projection.top, projection.height * .48, projection.height);
    ctx.restore();
  }
}
function renderRoomIndex() { const index = roomIndexAtX(renderCamera().x); return index >= 0 ? index : state.room; }
function objectInView(x, y, maxDistance = MAX_DEPTH + 1) {
  const camera = renderCamera();
  const dx = x - camera.x; const dy = y - camera.y; const distance = Math.hypot(dx, dy); if (distance > maxDistance) return false;
  const relative = Math.abs(normalizeAngle(Math.atan2(dy, dx) - camera.angle)); return relative < cameraFov() * .82;
}
function treeFootprintIsClear(tree) {
  const radius = .82 * (tree.scale || 1);
  for (let index = 0; index < 16; index += 1) {
    const angle = index * TAU / 16;
    if (isWall(tree.x + Math.cos(angle) * radius, tree.y + Math.sin(angle) * radius)) return false;
  }
  return !isWall(tree.x, tree.y);
}
function drawGroundGlow(x, y, color = '#d7a34e', now = 0, radius = .6, alpha = .04) {
  const point = projectCameraPoint(cameraPoint(x, y, .035));
  if (!point || point.forward <= .08) return;
  const screenRadius = Math.max(3, canvas.height * radius / Math.max(.5, point.forward) * .22);
  const pulse = .82 + Math.sin(now * .004 + x * 1.7 + y) * .12;
  const rgb = hexToRgb(color);
  ctx.save();
  ctx.globalAlpha = clamp(alpha * pulse * 15, .12, .72);
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = rgba(rgb, .34);
  ctx.shadowBlur = screenRadius * .7;
  ctx.shadowColor = color;
  ctx.beginPath();
  ctx.ellipse(point.x, point.y + screenRadius * .06, screenRadius, screenRadius * .28, 0, 0, TAU);
  ctx.fill();
  ctx.globalAlpha *= .7;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, screenRadius * .035);
  ctx.beginPath();
  ctx.ellipse(point.x, point.y + screenRadius * .06, screenRadius * (.72 + pulse * .08), screenRadius * .2, 0, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

function projectLobbyGroundPoint(x, y, z = .045) {
  return projectCameraPoint(cameraPoint(x, y, z));
}
function drawLobbyGroundPanel(xStart, yStart, xEnd, yEnd, fill, stroke, alpha = .9) {
  const points = [
    projectLobbyGroundPoint(xStart, yStart),
    projectLobbyGroundPoint(xEnd, yStart),
    projectLobbyGroundPoint(xEnd, yEnd),
    projectLobbyGroundPoint(xStart, yEnd),
  ];
  if (points.some((point) => !point)) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = Math.max(1, canvas.height * .0022);
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
function drawTexturedGroundPolygon(points, fill, stroke, alpha = .9) {
  if (points.some((point) => !point)) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
  ctx.closePath();
  ctx.clip();

  const pattern = textures.patterns?.stone;
  if (pattern) {
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = Math.max(1, canvas.height * .0023);
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}
function drawLobbyStoneSlab(x0, x1, y0, y1, index, now, fill = null) {
  const points = [
    projectLobbyGroundPoint(x0, y0),
    projectLobbyGroundPoint(x1, y0),
    projectLobbyGroundPoint(x1, y1),
    projectLobbyGroundPoint(x0, y1),
  ];
  if (points.some((point) => !point)) return;
  const slabColors = ['#76634b', '#8d7657', '#665541', '#a0835e', '#5b4a39'];
  drawTexturedGroundPolygon(
    points,
    fill || slabColors[index % slabColors.length],
    'rgba(39, 27, 17, .74)',
    .9,
  );
}
function drawLobbyBranchPath(x, yStart, yEnd, width, now, fill = null) {
  const step = .68;
  const low = Math.min(yStart, yEnd);
  const high = Math.max(yStart, yEnd);
  for (let y = low, index = 0; y < high; y += step, index += 1) {
    const y0 = y + .045;
    const y1 = Math.min(high, y + step - .055);
    drawLobbyStoneSlab(x - width / 2, x + width / 2, y0, y1, index, now, fill);
  }
}
function lobbyProjectionIsVisible(point, clearance = .08) {
  if (!point || point.depth <= .04) return false;
  const ray = clamp(Math.floor(point.x / canvas.width * RAY_COUNT), 0, RAY_COUNT - 1);
  return !state.zBuffer?.length || point.depth <= state.zBuffer[ray] + clearance;
}
function drawLobbyLowStone(faces, x, y, color = '#5b5948') {
  addBoxLocal(faces, { x, y }, { side: 0, forward: 0, z: .11 }, [.34, .34, .22], 0, color, .84, 'stone');
}
function drawLobbyArmory(now) {
  if (state.room !== 0 || state.lobbyDeparted) return;
  const pulse = settings.reducedMotion ? .5 : .5 + Math.sin(now / 260) * .5;
  const faces = [];
  const origin = { x: (LOBBY_ARMORY.xStart + LOBBY_ARMORY.xEnd) / 2, y: LOBBY_ARMORY.aisleY };
  const post = (x, y, height, color = '#5d3926') => {
    addBoxLocal(faces, { x, y }, { side: 0, forward: 0, z: height / 2 }, [.24, .24, height], 0, color, .94, 'wood');
    addBoxLocal(faces, { x, y }, { side: 0, forward: 0, z: height + .06 }, [.34, .34, .1], 0, '#d7a34e', .9, 'steel');
  };

  // A low ceremonial platform gives the two loadouts a proper reveal without
  // changing the floor map or blocking the route through the courtyard.
  drawLobbyGroundPanel(
    LOBBY_ARMORY.xStart - .58,
    LOBBY_ARMORY.backY - .35,
    LOBBY_ARMORY.xEnd + .58,
    LOBBY_ARMORY.frontY + .35,
    'rgba(52, 28, 20, .72)',
    'rgba(214, 139, 67, .72)',
    .78,
  );
  drawProjectedWorldRing(origin, 3.05, '#d76b49', .26 + pulse * .08, 32, .045, Math.max(1, canvas.height * .002));
  drawProjectedWorldRing(origin, 2.58, '#e7ad67', .28 + pulse * .1, 4, .05, Math.max(1, canvas.height * .002));

  post(LOBBY_ARMORY.xStart, LOBBY_ARMORY.backY, 1.5);
  post(LOBBY_ARMORY.xEnd, LOBBY_ARMORY.backY, 1.5);
  post(LOBBY_ARMORY.xStart, LOBBY_ARMORY.frontY, .9, '#4a3023');
  post(LOBBY_ARMORY.xEnd, LOBBY_ARMORY.frontY, .9, '#4a3023');
  addBoxLocal(faces, origin, { side: 0, forward: LOBBY_ARMORY.backY - LOBBY_ARMORY.aisleY, z: 1.58 }, [LOBBY_ARMORY.xEnd - LOBBY_ARMORY.xStart + .36, .22, .18], 0, '#8f5931', .9, 'wood');
  addBoxLocal(faces, origin, { side: 0, forward: LOBBY_ARMORY.backY - LOBBY_ARMORY.aisleY, z: 1.74 }, [LOBBY_ARMORY.xEnd - LOBBY_ARMORY.xStart - .18, .08, .06], 0, '#f0c775', 1.12, 'steel');
  renderFaces(faces, .98);

  // Animated command chevrons point the player from the spawn path toward the
  // loadout platform. These remain screen-projected world marks, not HUD UI.
  for (let index = 0; index < 5; index += 1) {
    const x = LOBBY_ARMORY.xStart + .66 + index * 1.55;
    const point = projectLobbyGroundPoint(x, LOBBY_ARMORY.aisleY, .06);
    if (!point) continue;
    const size = Math.max(4, canvas.height * .009 / Math.max(.7, point.depth));
    ctx.save();
    ctx.globalAlpha = .28 + pulse * .22;
    ctx.strokeStyle = '#f0c775';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#d76b49';
    ctx.lineWidth = Math.max(1, size * .12);
    ctx.beginPath();
    ctx.moveTo(point.x - size, point.y - size * .35);
    ctx.lineTo(point.x, point.y + size * .35);
    ctx.lineTo(point.x + size, point.y - size * .35);
    ctx.stroke();
    ctx.restore();
  }
}

function drawLobbyLantern(x, y, now, color = '#f0d38f') {
  const faces = [];
  const origin = { x, y };
  addBoxLocal(faces, origin, { side: 0, forward: 0, z: .26 }, [.13, .13, .52], 0, '#4b3423', .9, 'wood');
  addBoxLocal(faces, origin, { side: 0, forward: 0, z: .57 }, [.26, .22, .16], 0, color, 1.12, 'steel');
  addBoxLocal(faces, origin, { side: 0, forward: 0, z: .7 }, [.1, .1, .1], 0, '#fff1b0', 1.18, 'steel');
  renderFaces(faces, .98);
  drawGroundGlow(x, y, color, now, .62, .035);
}
function drawLobbyCampfire(now) {
  if (state.room !== 0 || state.lobbyDeparted) return;
  const { x, y } = LOBBY_CAMPFIRE;
  const pulse = settings.reducedMotion ? .5 : .5 + Math.sin(now / 170) * .5;
  const faces = [];
  for (let index = 0; index < 6; index += 1) {
    const angle = index * TAU / 6;
    addBoxLocal(
      faces,
      { x, y },
      { side: Math.cos(angle) * .31, forward: Math.sin(angle) * .31, z: .12 },
      [.26, .13, .22],
      angle,
      index % 2 ? '#5c3924' : '#75472a',
      .86,
      'wood',
    );
  }
  renderFaces(faces, .98);
  drawGroundGlow(x, y, '#d76b49', now, 1.18, .085);
  drawProjectedWorldRing({ x, y }, .62 + pulse * .07, '#e7ad67', .4 + pulse * .18, 18, .045, Math.max(1, canvas.height * .002));
  const flame = projectCameraPoint(cameraPoint(x, y, .64));
  const flameBase = projectCameraPoint(cameraPoint(x, y, .18));
  if (!flame || !flameBase) return;
  const height = Math.max(8, flameBase.y - flame.y);
  const width = Math.max(5, height * .46);
  ctx.save();
  ctx.globalAlpha = .54 + pulse * .22;
  ctx.globalCompositeOperation = 'screen';
  const glow = ctx.createRadialGradient(flame.x, flame.y, 0, flame.x, flame.y, width * 2.6);
  glow.addColorStop(0, 'rgba(255, 241, 176, .88)');
  glow.addColorStop(.35, 'rgba(232, 108, 59, .48)');
  glow.addColorStop(1, 'rgba(215, 75, 44, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(flame.x - width * 2.6, flame.y - width * 2.6, width * 5.2, width * 5.2);
  ctx.globalAlpha = .9;
  ctx.fillStyle = '#f4b25d';
  ctx.beginPath();
  ctx.moveTo(flame.x, flame.y - height * (1 + pulse * .12));
  ctx.quadraticCurveTo(flame.x + width * .72, flame.y - height * .34, flame.x, flameBase.y);
  ctx.quadraticCurveTo(flame.x - width * .78, flame.y - height * .28, flame.x, flame.y - height * (1 + pulse * .12));
  ctx.fill();
  ctx.fillStyle = '#fff1b0';
  ctx.globalAlpha = .78;
  ctx.beginPath();
  ctx.ellipse(flame.x, flameBase.y - height * .35, width * .25, height * .28, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawLobbyStonePath(now) {
  if (state.room !== 0 || !LOBBY_GATE) return;
  const startX = roomOffsets[0] + 3.15;
  const endX = LOBBY_GATE.x - .62;
  const centerY = LOBBY_WEAPON_PATH_Y;
  const spawnPoint = roomContentPoint(STARTING_ROOM_INDEX - 1, rooms[0].spawn.x, rooms[0].spawn.y);
  const spawnX = roomOffsets[0] + spawnPoint.x;
  const spawnY = spawnPoint.y;
  const pathWidth = 1.12;
  const slabLength = .78;
  for (let x = startX, index = 0; x < endX; x += slabLength, index += 1) {
    const x0 = x + .045;
    const x1 = Math.min(endX, x + slabLength - .06);
    const wobble0 = Math.sin(index * 1.7) * .045;
    const wobble1 = Math.sin((index + 1) * 1.7) * .045;
    drawLobbyStoneSlab(x0, x1, centerY - pathWidth / 2 + wobble0, centerY + pathWidth / 2 + wobble1, index, now);
  }
  // A short cross-path leads to the central armory, while this branch makes
  // the authored route visibly terminate at the actual player spawn point.
  drawLobbyBranchPath(LOBBY_ARMORY.xStart + .42, centerY - .46, LOBBY_ARMORY.aisleY, .86, now, 'rgba(178, 153, 102, .72)');
  drawLobbyBranchPath(LOBBY_ARMORY.xEnd - .48, centerY + .46, lobbyPortfolioScroll.y - .48, .72, now, 'rgba(143, 122, 83, .64)');
  drawLobbyBranchPath(spawnX, centerY, spawnY, .92, now, 'rgba(183, 158, 104, .78)');
  drawLobbyStoneSlab(spawnX - .42, spawnX + .42, spawnY - .18, spawnY + .18, 3, now, 'rgba(194, 165, 105, .62)');
}
function drawForestHallPath(now) {
  if (state.room !== 0) return;
  const startX = FOREST_HALL_START + .35;
  const endX = FOREST_HALL_END - .35;
  const pathWidth = .86;
  const slabLength = .82;
  const slabColors = ['#6f684d', '#837651', '#5b5948', '#947d55', '#676047'];
  for (let x = startX, index = 0; x < endX; x += slabLength, index += 1) {
    const x0 = x + .035;
    const x1 = Math.min(endX, x + slabLength - .06);
    const wobble0 = Math.sin(index * 1.37) * .055;
    const wobble1 = Math.sin((index + 1) * 1.37) * .055;
    const points = [
      projectLobbyGroundPoint(x0, FOREST_HALL_CENTER_Y - pathWidth / 2 + wobble0),
      projectLobbyGroundPoint(x1, FOREST_HALL_CENTER_Y - pathWidth / 2 + wobble1),
      projectLobbyGroundPoint(x1, FOREST_HALL_CENTER_Y + pathWidth / 2 + wobble1),
      projectLobbyGroundPoint(x0, FOREST_HALL_CENTER_Y + pathWidth / 2 + wobble0),
    ];
    if (points.some((point) => !point)) continue;
    drawTexturedGroundPolygon(
      points,
      slabColors[index % slabColors.length],
      'rgba(35, 31, 22, .72)',
      .9,
    );
  }
}

function drawForestHallFog(now) {
  if (state.room !== 0 || !state.lobbyGateOpen) return;
  const firstFogX = FOREST_HALL_START + FOREST_HALL_GAP * .28;
  const finalFogX = FOREST_HALL_END - 1.1;
  const layers = 7;
  // Draw the farthest layers first so the corridor dissolves into a deep,
  // opaque bank rather than ending in a single visible curtain.
  for (let layer = layers - 1; layer >= 0; layer -= 1) {
    const depth = layer / (layers - 1);
    const fogX = lerp(firstFogX, finalFogX, depth);
    const halfWidth = 1.28 + depth * .28;
    const bottom = projectCameraPoint(cameraPoint(fogX, FOREST_HALL_CENTER_Y + halfWidth, .03));
    const bottomLeft = projectCameraPoint(cameraPoint(fogX, FOREST_HALL_CENTER_Y - halfWidth, .03));
    const top = projectCameraPoint(cameraPoint(fogX, FOREST_HALL_CENTER_Y + halfWidth, 2.55));
    const topLeft = projectCameraPoint(cameraPoint(fogX, FOREST_HALL_CENTER_Y - halfWidth, 2.55));
    if ([bottom, bottomLeft, top, topLeft].some((point) => !point)) continue;
    const left = Math.min(bottomLeft.x, topLeft.x);
    const right = Math.max(bottom.x, top.x);
    const topY = Math.min(top.y, topLeft.y);
    const bottomY = Math.max(bottom.y, bottomLeft.y);
    const strength = (.16 + depth * .34) * (.94 + Math.sin(now / 1300 + layer) * .06);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(topLeft.x, topLeft.y);
    ctx.lineTo(top.x, top.y);
    ctx.lineTo(bottom.x, bottom.y);
    ctx.lineTo(bottomLeft.x, bottomLeft.y);
    ctx.closePath();
    ctx.clip();
    const fog = ctx.createLinearGradient(0, topY, 0, bottomY);
    fog.addColorStop(0, `rgba(145, 166, 152, ${strength * .32})`);
    fog.addColorStop(.28, `rgba(170, 190, 163, ${strength * .82})`);
    fog.addColorStop(.66, `rgba(144, 165, 147, ${strength})`);
    fog.addColorStop(1, `rgba(104, 126, 112, ${strength * .7})`);
    ctx.fillStyle = fog;
    ctx.fillRect(left, topY, Math.max(1, right - left), Math.max(1, bottomY - topY));
    for (let wisp = 0; wisp < 3; wisp += 1) {
      const y = topY + (bottomY - topY) * (.26 + wisp * .23) + Math.sin(now / 900 + wisp * 1.7 + layer) * 5;
      const wispGradient = ctx.createRadialGradient(left + (right - left) * (.2 + wisp * .3), y, 0, left + (right - left) * (.2 + wisp * .3), y, Math.max(12, (right - left) * .38));
      wispGradient.addColorStop(0, `rgba(218, 228, 207, ${strength * .34})`);
      wispGradient.addColorStop(1, 'rgba(218, 228, 207, 0)');
      ctx.fillStyle = wispGradient;
      ctx.fillRect(left, y - 20, Math.max(1, right - left), 40);
    }
    ctx.restore();
  }
}

function drawWorldRoute(now) {
  // Direct-start rooms use the authored room geometry. The removed lobby and
  // forest corridor must never be reached from the live frame path.
  if (state.room === FINAL_ROOM_INDEX) drawDoorOfLight(now);
  if (state.room === SANCTUARY_ROOM_INDEX) drawSanctuaryPedestal(now);
}
function drawLobbyWeaponPedestal(faces, origin, yaw, accent) {
  // Small three-tier display pedestal: broad foot, tapered-looking column,
  // and a thin illuminated cap under the weapon.
  addBoxLocal(faces, origin, { side: 0, forward: 0, z: .05 }, [.30, .30, .10], yaw, '#3b2a20', .82, 'stone');
  addBoxLocal(faces, origin, { side: 0, forward: 0, z: .15 }, [.21, .21, .20], yaw, '#68452d', .9, 'wood');
  addBoxLocal(faces, origin, { side: 0, forward: 0, z: .275 }, [.25, .25, .05], yaw, accent, .88, 'steel');
}

function weaponWorldPoint(origin, point, yaw) {
  const world = localToWorld(origin.x, origin.y, yaw, {
    side: point.side,
    forward: point.forward,
    z: point.z + (origin.zOffset || 0),
  });
  return cameraPoint(world.x, world.y, world.z);
}
function addFacetedWeaponVolumeWorld(faces, origin, center, dimensions, yaw, color, shade = 1, material = 'steel', variant = 0) {
  const [sideSize, forwardSize, height] = dimensions;
  const ringCount = 8;
  const ring = (z, radiusScale, phase) => {
    const points = [];
    for (let index = 0; index < ringCount; index += 1) {
      const angle = index * TAU / ringCount + variant * .17;
      const wobble = .92 + Math.sin(index * 2.55 + phase + variant) * .06;
      points.push(weaponWorldPoint(origin, {
        side: center.side + Math.cos(angle) * sideSize * .5 * radiusScale * wobble,
        forward: center.forward + Math.sin(angle) * forwardSize * .5 * radiusScale * wobble,
        z,
      }, yaw));
    }
    return points;
  };
  const lower = ring(center.z - height * .5, .78, .2);
  const upper = ring(center.z + height * .22, 1, 1.2);
  const topWorld = localToWorld(origin.x, origin.y, yaw, {
    side: center.side,
    forward: center.forward,
    z: center.z + height * .5,
  });
  const bottomWorld = localToWorld(origin.x, origin.y, yaw, {
    side: center.side,
    forward: center.forward,
    z: center.z - height * .5,
  });
  const top = cameraPoint(topWorld.x, topWorld.y, topWorld.z + (origin.zOffset || 0));
  const bottom = cameraPoint(bottomWorld.x, bottomWorld.y, bottomWorld.z + (origin.zOffset || 0));
  for (let index = 0; index < ringCount; index += 1) {
    const next = (index + 1) % ringCount;
    const faceShade = shade * (.78 + ((index + variant) % 4) * .07);
    faces.push({ points: [bottom, lower[index], lower[next]], color, shade: faceShade * .8, material });
    faces.push({ points: [lower[index], upper[index], upper[next], lower[next]], color, shade: faceShade, material });
    faces.push({ points: [upper[index], top, upper[next]], color, shade: faceShade * 1.08, material });
  }
}
function addSwordBladeWorld(faces, origin, center, width, length, thickness, yaw, color, shade = 1) {
  const profile = [
    { side: -width * .5, z: 0 },
    { side: width * .5, z: 0 },
    { side: width * .43, z: length * .78 },
    { side: width * .2, z: length * .93 },
    { side: 0, z: length },
    { side: -width * .2, z: length * .93 },
    { side: -width * .43, z: length * .78 },
  ];
  const front = profile.map((point) => weaponWorldPoint(origin, {
    side: center.side + point.side,
    forward: center.forward + thickness * .5,
    z: center.z + point.z,
  }, yaw));
  const back = profile.map((point) => weaponWorldPoint(origin, {
    side: center.side + point.side,
    forward: center.forward - thickness * .5,
    z: center.z + point.z,
  }, yaw));
  faces.push({ points: front, color, shade, material: 'steel' });
  faces.push({ points: [...back].reverse(), color, shade: shade * .58, material: 'steel' });
  for (let index = 0; index < profile.length; index += 1) {
    const next = (index + 1) % profile.length;
    faces.push({ points: [front[index], front[next], back[next], back[index]], color, shade: shade * (.68 + (index % 3) * .1), material: 'steel' });
  }
}
function drawLobbyWeaponMesh3D(creature, now = state.now || performance.now()) {
  if (state.room !== 0 || !creature) return;

  const faces = [];
  const origin = { x: creature.x, y: creature.y };
  const float = settings.reducedMotion ? 0 : Math.sin(now / 430 + creature.x * .7) * .065;
  const weaponOrigin = { ...origin, zOffset: float, meshScale: 1, meshBaseZ: 0 };
  const baseYaw = creature.yaw ?? 0;
  const type = creature.type;
  const color = type === 'bfg' ? '#db8872' : type === 'arsenal' ? '#d7a34e' : type === 'shotgun' ? '#b96b4c' : type === 'blade' ? '#b8f0e2' : '#d8c18b';
  const light = type === 'bfg' ? '#f4a06d' : type === 'arsenal' ? '#ffe0a0' : type === 'shotgun' ? '#efb06e' : type === 'blade' ? '#effff7' : '#fff4c7';
  const displayYaw = baseYaw + (type === 'stars' ? now / 1880 : Math.sin(now / 1420 + creature.x) * .035);
  let bottomZ = .315;
  let topZ = .58;
  let haloRadius = .24;

  drawLobbyWeaponPedestal(faces, origin, displayYaw, color);

  if (type === 'stars') {
    const starYaw = displayYaw + now / 560;
    const starSize = .17;
    addFlatSquareBladeWorld(faces, weaponOrigin, { side: 0, forward: 0, z: .39 }, starSize, .02, starYaw, color, 1.16);
    addFlatSquareBladeWorld(faces, weaponOrigin, { side: 0, forward: 0, z: .405 }, starSize * .42, .018, -starYaw * 1.45, light, 1.05);
    addFacetedWeaponVolumeWorld(faces, weaponOrigin, { side: 0, forward: 0, z: .4 }, [.065, .065, .06], displayYaw, '#684326', 1.08, 'steel', 1);
    for (let shard = 0; shard < 4; shard += 1) {
      const angle = now / 780 + shard * TAU / 4;
      addFacetedWeaponVolumeWorld(faces, weaponOrigin, {
        side: Math.cos(angle) * .145,
        forward: Math.sin(angle) * .075,
        z: .4 + Math.sin(angle * 1.4) * .028,
      }, [.026, .026, .035], displayYaw, light, .9, 'steel', shard + 2);
    }
    bottomZ = .32;
    topZ = .49;
    haloRadius = .22;
  } else if (type === 'arsenal') {
    // Prior-session Arsenal Carbine display: stock, receiver, magazine, and a
    // compact optic make the generated first-person weapon recognizable before
    // the player equips it. The authored atlas is used by drawDoomWeapon().
    const pulse = settings.reducedMotion ? 0 : Math.sin(now / 560 + creature.x) * .018;
    addBoxLocal(faces, weaponOrigin, { side: 0, forward: -.02, z: .39 }, [.11, .25, .09], displayYaw, '#3a2b22', .96, 'wood');
    addFacetedWeaponVolumeWorld(faces, weaponOrigin, { side: 0, forward: .08, z: .55 }, [.17, .3, .14], displayYaw, '#343b3a', 1.04, 'steel', 2);
    addBoxLocal(faces, weaponOrigin, { side: 0, forward: .25, z: .58 }, [.095, .38, .07], displayYaw, '#1f2625', 1.02, 'steel');
    addBoxLocal(faces, weaponOrigin, { side: 0, forward: .08, z: .41 }, [.07, .09, .22], displayYaw, '#27201d', .94, 'leather');
    addBoxLocal(faces, weaponOrigin, { side: .01, forward: .08, z: .39 }, [.065, .1, .2], displayYaw, '#d7a34e', 1.04, 'steel');
    addBoxLocal(faces, weaponOrigin, { side: 0, forward: .07, z: .72 + pulse }, [.07, .13, .045], displayYaw, '#e7ad67', 1.12, 'steel');
    addBoxLocal(faces, weaponOrigin, { side: 0, forward: .43, z: .6 }, [.045, .11, .045], displayYaw, '#d7a34e', 1.08, 'steel');
    bottomZ = .30;
    topZ = .78;
    haloRadius = .25;
  } else if (type === 'shotgun') {
    addBoxLocal(faces, weaponOrigin, { side: 0, forward: -.04, z: .39 }, [.13, .28, .1], displayYaw, '#4a3025', .96, 'wood');
    addFacetedWeaponVolumeWorld(faces, weaponOrigin, { side: 0, forward: .08, z: .56 }, [.18, .32, .14], displayYaw, '#343837', 1.04, 'steel', 3);
    addBoxLocal(faces, weaponOrigin, { side: -.055, forward: .31, z: .62 }, [.052, .42, .052], displayYaw, '#1f2423', 1.02, 'steel');
    addBoxLocal(faces, weaponOrigin, { side: .055, forward: .31, z: .62 }, [.052, .42, .052], displayYaw, '#1f2423', 1.02, 'steel');
    addBoxLocal(faces, weaponOrigin, { side: 0, forward: .08, z: .42 }, [.08, .1, .23], displayYaw, '#6e412d', .94, 'leather');
    addBoxLocal(faces, weaponOrigin, { side: 0, forward: .47, z: .62 }, [.1, .12, .06], displayYaw, '#d7a34e', 1.08, 'steel');
    bottomZ = .30;
    topZ = .79;
    haloRadius = .27;
  } else if (type === 'bfg') {
    const tipPulse = settings.reducedMotion ? .5 : .5 + Math.sin(now / 300 + creature.x) * .12;
    addBoxLocal(faces, weaponOrigin, { side: 0, forward: 0, z: .62 }, [.05, .05, .6], displayYaw, '#4a2d20', 1.02, 'wood');
    addFacetedWeaponVolumeWorld(faces, weaponOrigin, { side: 0, forward: 0, z: .94 }, [.13, .11, .12], displayYaw, '#d97856', 1.12, 'steel', 4);
    addFacetedWeaponVolumeWorld(faces, weaponOrigin, { side: 0, forward: 0, z: 1.08 + tipPulse * .03 }, [.07, .07, .11], displayYaw, light, 1.18, 'steel', 5);
    addBoxLocal(faces, weaponOrigin, { side: -.12, forward: .02, z: .94 }, [.032, .038, .23], displayYaw, '#b07a3f', .94, 'steel');
    addBoxLocal(faces, weaponOrigin, { side: .12, forward: .02, z: .94 }, [.032, .038, .23], displayYaw, '#b07a3f', .88, 'steel');
    for (let orbit = 0; orbit < 3; orbit += 1) {
      const angle = now / 680 + orbit * TAU / 3;
      addFacetedWeaponVolumeWorld(faces, weaponOrigin, {
        side: Math.cos(angle) * (.15 + tipPulse * .015),
        forward: Math.sin(angle) * .065,
        z: 1.08 + Math.sin(angle * 1.5) * .045,
      }, [.024, .024, .045], displayYaw, light, .96, 'steel', orbit + 6);
    }
    bottomZ = .33;
    topZ = 1.18;
    haloRadius = .21;
  } else if (type === 'blade') {
    const bladeYaw = displayYaw + Math.sin(now / 910 + creature.x) * .028;
    addBoxLocal(faces, weaponOrigin, { side: 0, forward: 0, z: .39 }, [.075, .075, .28], bladeYaw, '#3a241b', .98, 'leather');
    addFacetedWeaponVolumeWorld(faces, weaponOrigin, { side: 0, forward: 0, z: .56 }, [.33, .075, .055], bladeYaw, color, 1.04, 'steel', 7);
    addSwordBladeWorld(faces, weaponOrigin, { side: 0, forward: 0, z: .6 }, .13, 1.16, .038, bladeYaw, '#cfe8dc', 1.08);
    addSwordBladeWorld(faces, weaponOrigin, { side: 0, forward: .025, z: .63 }, .034, 1.04, .014, bladeYaw, '#f4fff0', 1.1);
    addFacetedWeaponVolumeWorld(faces, weaponOrigin, { side: 0, forward: 0, z: 1.78 }, [.05, .05, .07], bladeYaw, light, 1.12, 'steel', 8);
    bottomZ = .33;
    topZ = 1.8;
    haloRadius = .25;
  } else {
    return;
  }

  renderFaces(faces, .99);
  drawGroundGlow(creature.x, creature.y, color, now, .44, .035);
  drawLobbyWeaponHalos(creature, now, bottomZ + float, topZ + float, haloRadius, color, light);

  const scaledAnchorZ = (bottomZ + topZ) * .5 + float;
  const anchor = projectCameraPoint(cameraPoint(creature.x, creature.y, scaledAnchorZ));
  if (!anchor || !lobbyProjectionIsVisible(anchor, .08)) return;
  const size = clamp(canvas.height * .06 / Math.max(.8, anchor.depth), 9, 28);
  drawWorldLabel(
    { x: anchor.x, y: anchor.y - size * 1.18 },
    creature.name,
    'E · EQUIP',
    light,
    .84 + Math.sin(now / 260 + creature.x) * .08,
  );
  ctx.save();
  ctx.globalAlpha = .82;
  ctx.strokeStyle = light;
  ctx.shadowBlur = Math.max(6, size * .3);
  ctx.shadowColor = light;
  ctx.lineWidth = Math.max(1, size * .07);
  if (type === 'stars') {
    ctx.save(); ctx.translate(anchor.x, anchor.y); ctx.rotate(now / 560); ctx.strokeRect(-size * .38, -size * .16, size * .76, size * .32); ctx.restore();
  } else if (type === 'blade') {
    ctx.beginPath();
    ctx.moveTo(anchor.x, anchor.y + size * .58);
    ctx.lineTo(anchor.x, anchor.y - size * .58);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(anchor.x - size * .25, anchor.y + size * .1);
    ctx.lineTo(anchor.x + size * .25, anchor.y + size * .1);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(anchor.x, anchor.y - size * .55);
    ctx.lineTo(anchor.x, anchor.y + size * .55);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(anchor.x, anchor.y - size * .62, Math.max(2, size * .12), 0, TAU);
    ctx.fillStyle = light;
    ctx.fill();
  }
  ctx.restore();
}

function drawLobbyWeaponHalos(creature, now, bottomZ, topZ, radius, color, light) {
  const bottom = projectCameraPoint(cameraPoint(creature.x, creature.y, bottomZ));
  const top = projectCameraPoint(cameraPoint(creature.x, creature.y, topZ));
  if (!bottom && !top) return;

  const pulse = .78 + Math.sin(now / 230 + creature.x) * .16;
  const drawHalo = (point, phase, scale) => {
    if (!point) return;
    const width = Math.max(5, canvas.height * radius / Math.max(1, point.depth) * .62 * scale);
    const height = Math.max(2, width * .17);
    ctx.save();
    ctx.globalAlpha = .30 + pulse * .28;
    ctx.strokeStyle = phase === 0 ? light : color;
    ctx.shadowBlur = Math.max(8, width * .38);
    ctx.shadowColor = phase === 0 ? light : color;
    ctx.lineWidth = Math.max(1, width * .08);
    ctx.beginPath();
    ctx.ellipse(point.x, point.y, width, height, 0, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha *= .48;
    ctx.beginPath();
    ctx.ellipse(point.x, point.y, width * .62, height * .55, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
  };

  drawHalo(bottom, 1, 1);
  drawHalo(top, 0, .82);
}

function drawNinjaStarWeapon3D(creature, now) {
  drawLobbyWeaponMesh3D(creature, now);
}


function drawEmberWandWeapon3D(creature, now) {
  drawLobbyWeaponMesh3D(creature, now);
}

function drawLobbyWeaponCreature(creature, now = state.now || performance.now()) {
  if (!creature) return;
  if (creature.type === 'stars') drawNinjaStarWeapon3D(creature, now);
  else if (creature.type === 'arsenal') drawLobbyWeaponMesh3D(creature, now);
  else if (creature.type === 'shotgun') drawLobbyWeaponMesh3D(creature, now);
  else if (creature.type === 'bfg') drawEmberWandWeapon3D(creature, now);
  else if (creature.type === 'blade') drawLobbyWeaponMesh3D(creature, now);
}

function drawLobbyPortfolioScroll(item, now) {
  const projection = projectBillboard(item.x, item.y, item.z || .72, .86);
  drawBillboard(makeItemSprite(item), projection, .98);
  if (!projection) return;
  const pulse = .82 + Math.sin(now / 180) * .13;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.strokeStyle = item.color || EMERALD;
  ctx.shadowBlur = 24;
  ctx.shadowColor = item.color || EMERALD;
  ctx.lineWidth = Math.max(1, projection.height * .018);
  ctx.beginPath();
  ctx.arc(projection.x, (projection.top + projection.bottom) / 2, Math.max(10, projection.height * .68), 0, TAU);
  ctx.stroke();
  ctx.restore();
  drawGroundGlow(item.x, item.y, item.color || EMERALD, now, .7, .035);
}
function drawLobbyEntranceSign(sign, now) {
  if (state.room !== 0 || !sign || !objectInView(sign.x, sign.y, 28)) return;
  const origin = { x: sign.x, y: sign.y };
  const yaw = sign.yaw ?? 0;
  const faces = [];
  const sideOffset = sign.width * .39;

  // Thick timber board with a raised face on both sides, so the sign reads from
  // either direction when the player crosses the entrance.
  addBoxLocal(faces, origin, { side: 0, forward: 0, z: sign.z }, [sign.width, .22, sign.height], yaw, '#51331f', .96, 'wood');
  addBoxLocal(faces, origin, { side: 0, forward: -.125, z: sign.z }, [sign.width - .18, .035, sign.height - .14], yaw, '#986536', 1.02, 'wood');
  addBoxLocal(faces, origin, { side: 0, forward: .125, z: sign.z }, [sign.width - .18, .035, sign.height - .14], yaw, '#80532f', .9, 'wood');

  // Short supports tie the board into the entrance arch without creating a new
  // collision wall across the route.
  for (const side of [-1, 1]) {
    addBoxLocal(faces, origin, { side: side * sideOffset, forward: 0, z: 2.22 }, [.18, .24, .82], yaw, '#5f3b24', .92, 'wood');
    addBoxLocal(faces, origin, { side: side * sideOffset, forward: -.01, z: 2.62 }, [.3, .3, .1], yaw, '#b7864e', 1.04, 'steel');
  }
  addBoxLocal(faces, origin, { side: 0, forward: -.01, z: sign.z + sign.height * .43 }, [sign.width + .12, .24, .1], yaw, '#b7864e', 1.02, 'steel');
  renderFaces(faces, .98);

  // Draw the title onto the projected front-facing plane of the board. The
  // facing side changes as the player passes through the entrance.
  const faceForward = state.player.x <= sign.x ? -.15 : .15;
  const center = projectCameraPoint(cameraPoint(sign.x + faceForward, sign.y, sign.z));
  const left = projectCameraPoint(cameraPoint(sign.x + faceForward, sign.y - sign.width * .44, sign.z));
  const right = projectCameraPoint(cameraPoint(sign.x + faceForward, sign.y + sign.width * .44, sign.z));
  const top = projectCameraPoint(cameraPoint(sign.x + faceForward, sign.y, sign.z + sign.height * .38));
  const bottom = projectCameraPoint(cameraPoint(sign.x + faceForward, sign.y, sign.z - sign.height * .38));
  if ([center, left, right, top, bottom].some((point) => !point) || !lobbyProjectionIsVisible(center, .2)) return;

  const projectedWidth = Math.hypot(right.x - left.x, right.y - left.y);
  const projectedHeight = Math.abs(bottom.y - top.y);
  const fontSize = clamp(Math.min(projectedWidth / 15.2, projectedHeight * .56), 10, 30);
  ctx.save();
  ctx.globalAlpha = .98;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${fontSize}px Georgia, serif`;
  ctx.fillStyle = '#fff1b0';
  ctx.shadowBlur = Math.max(5, fontSize * .7);
  ctx.shadowColor = '#2e1b12';
  ctx.fillText(sign.text, center.x, center.y + projectedHeight * .04);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = .7;
  ctx.strokeStyle = '#e7c980';
  ctx.lineWidth = Math.max(1, fontSize * .07);
  ctx.beginPath();
  ctx.moveTo(center.x - projectedWidth * .35, center.y + projectedHeight * .33);
  ctx.lineTo(center.x + projectedWidth * .35, center.y + projectedHeight * .33);
  ctx.stroke();
  ctx.restore();
}

function drawLobbyGate(now) {
  if (!LOBBY_GATE || state.room !== 0) return;
  const gate = LOBBY_GATE;
  if (state.lobbyDeparted) {
    const faces = [];
    const origin = { x: gate.x, y: gate.y };
    addBoxLocal(faces, origin, { side: 0, forward: 0, z: .98 }, [FOREST_HALL_GATE_HALF_WIDTH * 2.05, .34, 1.96], gate.yaw, '#302824', .9, 'stone');
    addBoxLocal(faces, origin, { side: 0, forward: .2, z: .98 }, [FOREST_HALL_GATE_HALF_WIDTH * 1.72, .08, 1.68], gate.yaw, '#4b3b31', .82, 'stone');
    renderFaces(faces, .98);
    return;
  }
  const progress = state.lobbyGateOpen ? 1 : state.lobbyGateProgress;
  const faces = [];
  const origin = { x: gate.x, y: gate.y };
  const gateHalfWidth = FOREST_HALL_GATE_HALF_WIDTH;
  const frameSide = gateHalfWidth - .12;
  addBoxLocal(faces, origin, { side: -frameSide, forward: 0, z: .96 }, [.2, .34, 1.92], gate.yaw, '#704b2d', .92, 'wood');
  addBoxLocal(faces, origin, { side: frameSide, forward: 0, z: .96 }, [.2, .34, 1.92], gate.yaw, '#704b2d', .82, 'wood');
  addBoxLocal(faces, origin, { side: 0, forward: 0, z: 1.93 }, [gateHalfWidth * 2, .36, .18], gate.yaw, '#9f7443', 1, 'wood');
  const panelWidth = gateHalfWidth - .2;
  const slide = progress * gateHalfWidth * 1.05;
  for (const side of [-1, 1]) {
    const panelSide = side * (panelWidth / 2 + slide);
    addBoxLocal(faces, origin, { side: panelSide, forward: .02, z: .98 }, [panelWidth, .25, 1.72], gate.yaw, '#3a2b24', .88, 'wood');
    for (let bar = -3; bar <= 3; bar += 1) addBoxLocal(faces, origin, { side: panelSide + bar * .34, forward: .17, z: .98 }, [.045, .08, 1.64], gate.yaw, '#c2a56b', .9, 'steel');
  }
  renderFaces(faces, .98);
  const projection = projectVerticalBounds(gate.x, gate.y, 1, 2.2);
  if (projection && progress < 1) {
    ctx.save(); ctx.globalAlpha = .18 + Math.sin(now / 180) * .06; ctx.strokeStyle = '#e7ad67'; ctx.shadowBlur = 24; ctx.shadowColor = '#e7ad67'; ctx.lineWidth = Math.max(2, projection.height * .018); ctx.strokeRect(projection.x - projection.height * 1.14, projection.top + projection.height * .06, projection.height * 2.28, projection.height * .88); ctx.restore();
  }
}
function addFacetedTreeVolume(faces, origin, center, dimensions, yaw, color, shade = 1, material = 'stone', variant = 0) {
  const [sideSize, forwardSize, height] = dimensions;
  const ringCount = 8;
  const ring = [];
  for (let index = 0; index < ringCount; index += 1) {
    const angle = index * TAU / ringCount + variant * .17;
    const wobble = .9 + Math.sin(index * 2.7 + variant * 1.9) * .07;
    const worldPoint = localToWorld(origin.x, origin.y, yaw, {
      side: center.side + Math.cos(angle) * sideSize * .5 * wobble,
      forward: center.forward + Math.sin(angle) * forwardSize * .5 * wobble,
      z: center.z + Math.sin(angle * 2 + variant) * height * .055,
    });
    ring.push(cameraPoint(worldPoint.x, worldPoint.y, worldPoint.z));
  }
  const top = localToWorld(origin.x, origin.y, yaw, { side: center.side, forward: center.forward, z: center.z + height * .5 });
  const bottom = localToWorld(origin.x, origin.y, yaw, { side: center.side, forward: center.forward, z: center.z - height * .5 });
  const projectedRing = ring;
  const projectedTop = cameraPoint(top.x, top.y, top.z);
  const projectedBottom = cameraPoint(bottom.x, bottom.y, bottom.z);
  for (let index = 0; index < ringCount; index += 1) {
    const next = (index + 1) % ringCount;
    const faceShade = shade * (.86 + ((index + variant) % 4) * .055);
    faces.push({ points: [projectedTop, projectedRing[index], projectedRing[next]], color, shade: faceShade, material });
    faces.push({ points: [projectedBottom, projectedRing[next], projectedRing[index]], color, shade: faceShade * .78, material });
  }
}
function addFacetedTreeCrown(faces, origin, center, dimensions, yaw, color, shade = 1, variant = 0) {
  const [sideSize, forwardSize, height] = dimensions;
  const ringCount = 8;
  const makeRing = (z, radiusScale, phase) => {
    const points = [];
    for (let index = 0; index < ringCount; index += 1) {
      const angle = index * TAU / ringCount + variant * .13;
      const wobble = .94 + Math.sin(index * 2.35 + phase + variant) * .06;
      const worldPoint = localToWorld(origin.x, origin.y, yaw, {
        side: center.side + Math.cos(angle) * sideSize * .5 * radiusScale * wobble,
        forward: center.forward + Math.sin(angle) * forwardSize * .5 * radiusScale * wobble,
        z,
      });
      points.push(cameraPoint(worldPoint.x, worldPoint.y, worldPoint.z));
    }
    return points;
  };
  const lower = makeRing(center.z - height * .5, .72, .2);
  const shoulder = makeRing(center.z + height * .08, 1, 1.1);
  const upper = makeRing(center.z + height * .5, .56, 2.4);
  const crownTopWorld = localToWorld(origin.x, origin.y, yaw, {
    side: center.side,
    forward: center.forward,
    z: center.z + height * .58,
  });
  const crownTop = cameraPoint(crownTopWorld.x, crownTopWorld.y, crownTopWorld.z);

  for (let index = 0; index < ringCount; index += 1) {
    const next = (index + 1) % ringCount;
    const faceShade = shade * (.84 + ((index + variant) % 4) * .055);
    faces.push({ points: [lower[index], lower[next], shoulder[next], shoulder[index]], color, shade: faceShade * .92, material: 'stone' });
    faces.push({ points: [shoulder[index], shoulder[next], upper[next], upper[index]], color, shade: faceShade, material: 'stone' });
    faces.push({ points: [upper[index], upper[next], crownTop], color, shade: faceShade * 1.04, material: 'stone' });
  }
}
function drawLobbyTree3D(tree, now) {
  if (state.room !== (tree.roomIndex ?? 0) || !objectInView(tree.x, tree.y, 24)) return;
  const faces = [];
  const origin = { x: tree.x, y: tree.y };
  // Visual scale is intentionally larger than the collision footprint. This
  // makes the perimeter read as a forest without changing navigation.
  const scale = (tree.scale || 1) * 1.26;
  const yaw = tree.yaw ?? 0;
  const box = (center, dimensions, color, shade = 1, material = null) => addBoxLocal(
    faces,
    { x: tree.x, y: tree.y, meshScale: 1 },
    { side: center.side * scale, forward: center.forward * scale, z: center.z * scale },
    dimensions.map((value) => value * scale),
    yaw,
    color,
    shade,
    material,
  );
  const volume = (center, dimensions, color, shade = 1, variant = 0) => addFacetedTreeVolume(
    faces,
    origin,
    { side: center.side * scale, forward: center.forward * scale, z: center.z * scale },
    dimensions.map((value) => value * scale),
    yaw,
    color,
    shade,
    'stone',
    variant,
  );

  // A textured, split trunk and roots anchor the canopy. The extra branch
  // pieces make the silhouette less like a stack of cubes before the leaves.
  box({ side: 0, forward: 0, z: .56 }, [.34, .34, 1.12], '#4a2e1d', .94, 'wood');
  box({ side: -.17, forward: .01, z: .99 }, [.12, .15, .68], '#70462a', .82, 'wood');
  box({ side: .2, forward: .03, z: 1.02 }, [.12, .14, .62], '#6b4228', .76, 'wood');
  box({ side: -.17, forward: -.08, z: .18 }, [.2, .32, .18], '#59351f', .82, 'wood');
  box({ side: .18, forward: -.06, z: .19 }, [.2, .3, .18], '#58341f', .76, 'wood');
  box({ side: -.29, forward: .03, z: 1.2 }, [.12, .5, .13], '#6f4529', .82, 'wood');
  box({ side: .3, forward: .02, z: 1.22 }, [.12, .48, .13], '#613c26', .74, 'wood');

  // Eight overlapping low-poly foliage volumes use the stone pattern. Their
  // varied facets preserve green authored colors while matching the world’s
  // existing painted texture treatment.
  volume({ side: 0, forward: -.02, z: 1.38 }, [1.34, .98, .78], '#1a593b', .98, 0);
  volume({ side: -.43, forward: -.02, z: 1.62 }, [.78, .7, .72], '#247747', 1.02, 1);
  volume({ side: .43, forward: -.01, z: 1.61 }, [.8, .68, .7], '#216b42', .98, 2);
  volume({ side: -.18, forward: .28, z: 1.72 }, [.72, .58, .66], '#2d8750', 1.01, 3);
  volume({ side: .2, forward: .24, z: 1.75 }, [.7, .56, .68], '#2a7d49', .96, 4);
  volume({ side: -.3, forward: -.08, z: 1.98 }, [.68, .58, .62], '#3a9455', 1.02, 5);
  volume({ side: .3, forward: -.04, z: 2.0 }, [.66, .56, .62], '#32874d', 1, 6);
  volume({ side: 0, forward: .04, z: 2.27 }, [.58, .5, .54], '#70b965', 1.06, 7);

  // Add a broad upper crown so the tree has an unmistakable leafy top rather
  // than ending in a narrow point. Both tiers use the same stone pattern as
  // the lower foliage and expose textured upper-facing triangles.
  addFacetedTreeCrown(faces, origin, { side: 0, forward: -.02, z: 2.34 * scale }, [1.2 * scale, .94 * scale, .88 * scale], yaw, '#3d9655', 1.02, 8);
  addFacetedTreeCrown(faces, origin, { side: -.03 * scale, forward: .02 * scale, z: 2.78 * scale }, [.82 * scale, .66 * scale, .7 * scale], yaw, '#58aa5d', 1.04, 9);
  addFacetedTreeCrown(faces, origin, { side: .04 * scale, forward: -.01 * scale, z: 3.1 * scale }, [.48 * scale, .4 * scale, .48 * scale], yaw, '#79c56a', 1.08, 10);
  renderFaces(faces, .98);
  drawGroundGlow(tree.x, tree.y, '#6c9d68', now, .92 * scale, .035);
}

function addFacetedBushCluster(faces, origin, center, dimensions, yaw, color, shade = 1, variant = 0) {
  const [sideSize, forwardSize, height] = dimensions;
  const ringCount = 10;
  const makeRing = (z, radiusScale, phase) => {
    const points = [];
    for (let index = 0; index < ringCount; index += 1) {
      const angle = index * TAU / ringCount + variant * .19;
      const wobble = .9 + Math.sin(index * 2.41 + phase + variant * 1.3) * .08;
      const worldPoint = localToWorld(origin.x, origin.y, yaw, {
        side: center.side + Math.cos(angle) * sideSize * .5 * radiusScale * wobble,
        forward: center.forward + Math.sin(angle) * forwardSize * .5 * radiusScale * wobble,
        z,
      });
      points.push(cameraPoint(worldPoint.x, worldPoint.y, worldPoint.z));
    }
    return points;
  };
  const lower = makeRing(center.z - height * .5, .78, .2);
  const shoulder = makeRing(center.z + height * .02, 1, 1.1);
  const top = makeRing(center.z + height * .38, .68, 2.2);
  const capWorld = localToWorld(origin.x, origin.y, yaw, {
    side: center.side + Math.sin(variant * 1.7) * sideSize * .06,
    forward: center.forward + Math.cos(variant * 1.4) * forwardSize * .05,
    z: center.z + height * .52,
  });
  const cap = cameraPoint(capWorld.x, capWorld.y, capWorld.z);

  for (let index = 0; index < ringCount; index += 1) {
    const next = (index + 1) % ringCount;
    const faceShade = shade * (.8 + ((index + variant) % 4) * .065);
    faces.push({ points: [lower[index], lower[next], shoulder[next], shoulder[index]], color, shade: faceShade * .9, material: 'stone' });
    faces.push({ points: [shoulder[index], shoulder[next], top[next], top[index]], color, shade: faceShade, material: 'stone' });
    faces.push({ points: [top[index], top[next], cap], color, shade: faceShade * 1.04, material: 'stone' });
  }
}
function drawLobbyBush3D(bush, now) {
  if (state.room !== (bush.roomIndex ?? 0) || !objectInView(bush.x, bush.y, 24)) return;
  const faces = [];
  const origin = { x: bush.x, y: bush.y };
  // Give bushes the same expanded, faceted treatment as the trees while keeping
  // them low enough to frame paths and weapon displays.
  const scale = (bush.scale || 1) * 1.2;
  const yaw = bush.yaw ?? 0;
  const cluster = (center, dimensions, color, shade = 1, variant = 0) => addFacetedBushCluster(
    faces,
    origin,
    { side: center.side * scale, forward: center.forward * scale, z: center.z * scale },
    dimensions.map((value) => value * scale),
    yaw,
    color,
    shade,
    variant,
  );

  // Layered eight-sided clusters create a busy silhouette with leafy material
  // on every face, including the upper triangles and visible caps.
  cluster({ side: 0, forward: 0, z: .18 }, [.86, .66, .3], '#174b34', .88, 0);
  cluster({ side: -.28, forward: -.01, z: .35 }, [.64, .54, .48], '#236b40', .98, 1);
  cluster({ side: .27, forward: .02, z: .38 }, [.68, .56, .5], '#2e8050', 1.02, 2);
  cluster({ side: -.08, forward: .17, z: .52 }, [.55, .46, .5], '#439654', 1.03, 3);
  cluster({ side: .1, forward: -.12, z: .63 }, [.48, .4, .48], '#65ae60', 1.06, 4);
  cluster({ side: -.16, forward: .04, z: .72 }, [.38, .34, .4], '#55a85a', 1.04, 5);
  cluster({ side: .18, forward: .06, z: .75 }, [.4, .34, .42], '#70b965', 1.06, 6);
  cluster({ side: 0, forward: .01, z: .91 }, [.34, .3, .36], '#8bc96e', 1.08, 7);
  renderFaces(faces, .98);
  drawGroundGlow(bush.x, bush.y, '#4d9b5d', now, .62 * scale, .035);
}

function drawLobbyGuide(guide, now) {
  if (state.room !== 0 || !guide || !objectInView(guide.x, guide.y, 14)) return;
  const faces = [];
  const origin = { x: guide.x, y: guide.y };
  const yaw = guide.yaw ?? 0;
  const walking = Boolean(state.guideRun);
  const walkPhase = walking ? now / LOBBY_GUIDE_WALK_ANIMATION_MS : now / 1150;
  const stride = walking ? Math.sin(walkPhase) : Math.sin(walkPhase) * .16;
  const bob = walking ? Math.abs(Math.sin(walkPhase)) * .012 : Math.sin(now / 620) * .006;
  const legForward = stride * .045;
  const armForward = -stride * .035;

  // Restore Pip's original compact silhouette. The authored pip-skin material
  // adds surface detail without increasing the mesh's polygon count.
  addBoxLocal(faces, origin, { side: 0, forward: 0, z: .085 + bob }, [.18, .16, .13], yaw, '#76502f', .9, 'leather');
  addBoxLocal(faces, origin, { side: 0, forward: 0, z: .19 + bob }, [.19, .17, .11], yaw, '#4d9a68', 1.02, 'pip-skin');
  addBoxLocal(faces, origin, { side: -.12, forward: .01, z: .215 + bob }, [.08, .08, .13], yaw - .16, '#3c7e56', .92, 'pip-skin');
  addBoxLocal(faces, origin, { side: .12, forward: .01, z: .215 + bob }, [.08, .08, .13], yaw + .16, '#3c7e56', .86, 'pip-skin');
  addBoxLocal(faces, origin, { side: -.045, forward: .095, z: .19 + bob }, [.028, .018, .024], yaw, '#1c2923', .96, 'steel');
  addBoxLocal(faces, origin, { side: .045, forward: .095, z: .19 + bob }, [.028, .018, .024], yaw, '#1c2923', .96, 'steel');
  addBoxLocal(faces, origin, { side: -.125, forward: armForward, z: .14 + bob }, [.055, .08, .16], yaw, '#36794e', .9, 'pip-skin');
  addBoxLocal(faces, origin, { side: .125, forward: -armForward, z: .14 + bob }, [.055, .08, .16], yaw, '#36794e', .86, 'pip-skin');
  addBoxLocal(faces, origin, { side: -.055, forward: legForward, z: .035 }, [.07, .1, .07], yaw, '#392821', .84, 'leather');
  addBoxLocal(faces, origin, { side: .055, forward: -legForward, z: .035 }, [.07, .1, .07], yaw, '#392821', .78, 'leather');

  // Keep the shorter cane, but animate its plant and lean opposite Pip's step.
  const caneStride = walking ? Math.sin(walkPhase + Math.PI) : Math.sin(now / 900) * .08;
  const caneSide = .19 + caneStride * .035;
  const caneForward = .035 + caneStride * .045;
  const caneLean = caneStride * .08;
  const caneStart = { side: caneSide, forward: caneForward, z: .045 };
  const caneEnd = { side: caneSide + caneLean * .12, forward: caneForward + caneStride * .012, z: .29 };
  addBoneLocal(faces, origin, caneStart, caneEnd, .018, yaw, '#76502f', 'wood');
  addBoneLocal(
    faces,
    origin,
    { side: caneEnd.side - .045, forward: caneEnd.forward, z: caneEnd.z },
    { side: caneEnd.side + .02, forward: caneEnd.forward + .005, z: caneEnd.z },
    .021,
    yaw,
    '#8e6339',
    'wood',
  );
  addBoxLocal(faces, origin, { side: caneStart.side, forward: caneStart.forward, z: .03 }, [.035, .035, .025], yaw, '#d0a456', 1.04, 'steel');

  renderFaces(faces, .99);
  drawGroundGlow(guide.x, guide.y, '#70d38f', now, .3, .035);
}

function drawLobbyGuideSpeechBubble(guide, now) {
  if (state.room !== 0 || !guide || !state.guideSpeechTarget || (!state.guideSpeechActive && state.guideSpeechHold <= 0 && state.guideSpeechPause <= 0)) return;

  // Keep Pip's dialogue in the game canvas, but place it in a stable lower
  // viewport panel. The panel does not move with depth or re-wrap as Pip walks.
  const message = state.guideSpeechTarget;
  const typed = state.guideSpeechVisible.length;
  const fontSize = clamp(canvas.height * .021, 13, 19);
  const width = clamp(canvas.width * .62, 360, 760);
  const maxWidth = width - 42;
  const lineHeight = fontSize * 1.24;
  const pixel = Math.max(1, Math.round(fontSize * .1));
  const pattern = textures.patterns?.dialogue || '#261a11';

  ctx.save();
  ctx.font = `600 ${fontSize}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  const lines = [];
  let line = '';
  let lineStart = 0;
  let cursor = 0;
  for (const word of message.split(' ')) {
    const wordStart = cursor;
    cursor += word.length + 1;
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push({ text: line, start: lineStart, end: wordStart - 1 });
      line = word;
      lineStart = wordStart;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push({ text: line, start: lineStart, end: message.length });

  const headerHeight = Math.max(17, fontSize * .9);
  const height = Math.round(lines.length * lineHeight + headerHeight + 24);
  const left = Math.round((canvas.width - width) / 2);
  const top = Math.round(canvas.height - height - Math.max(18, canvas.height * .045));

  ctx.globalAlpha = .95;
  ctx.fillStyle = pattern;
  ctx.fillRect(left, top, width, height);
  ctx.fillStyle = 'rgba(8, 6, 4, .22)';
  for (let stripe = top + pixel * 2; stripe < top + height; stripe += pixel * 5) ctx.fillRect(left, stripe, width, pixel);
  ctx.strokeStyle = '#b88b4c';
  ctx.lineWidth = Math.max(1, pixel);
  ctx.strokeRect(left + .5, top + .5, width - 1, height - 1);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#d5a150';
  ctx.font = `700 ${Math.max(10, fontSize * .68)}px "DM Mono", monospace`;
  ctx.fillText('PIP · WAYFINDER', left + 14, top + headerHeight * .58);

  ctx.fillStyle = '#f2e2ba';
  ctx.font = `600 ${fontSize}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  lines.forEach((entry, index) => {
    const visible = typed > entry.start ? message.slice(entry.start, Math.min(typed, entry.end)).trimEnd() : '';
    ctx.fillText(visible || (index === 0 && typed === 0 ? '…' : ''), left + 14, top + headerHeight + 10 + index * lineHeight + lineHeight * .5);
  });
  ctx.restore();
}
function updateLobbyGuideHud() {
  // The legacy lobby guide has no live DOM counterpart after direct start.
  // Keep this compatibility hook as a no-op because drawScene still calls it.
}

function elevatedBoxFaces(x1, y1, x2, y2, top, color = '#78604a') {
  const points = [];
  for (const x of [x1, x2]) for (const y of [y1, y2]) for (const z of [0, top]) points.push({ x, y, z });
  const faces = [];
  addBoxFaces(faces, points, color, 1, 'stone');
  return faces;
}
function drawElevatedSetPieces() {
  const faces = [];
  for (const piece of ELEVATED_SET_PIECES) {
    if (piece.roomIndex !== state.room) continue;
    if (piece.kind === 'platform') {
      faces.push(...elevatedBoxFaces(piece.x1, piece.y1, piece.x2, piece.y2, piece.height));
      continue;
    }
    const steps = 7;
    for (let index = 0; index < steps; index += 1) {
      const t0 = index / steps;
      const t1 = (index + 1) / steps;
      faces.push(...elevatedBoxFaces(piece.x1, lerp(piece.y1, piece.y2, t0), piece.x2, lerp(piece.y1, piece.y2, t1), piece.height * t1, '#695044'));
    }
  }
  if (faces.length) renderFaces(faces, .98);
}

function drawWorldObjects(now) {
  const objects = [];
  // Room 0 is now the direct-start Threshold Chamber. Its obsolete lobby/forest
  // object collections are intentionally not part of the live render path.
  if (state.room === SANCTUARY_ROOM_INDEX) {
    SANCTUARY_TREES.forEach((tree) => {
      if (treeFootprintIsClear(tree) && objectInView(tree.x, tree.y, 24)) objects.push({ type: 'lobby-tree', ...tree, distance: Math.hypot(tree.x - renderCamera().x, tree.y - renderCamera().y) });
    });
  }
  const activeRoom = renderRoomIndex();
  worldItems.forEach((item) => { if (item.roomIndex !== activeRoom || item.recovered || !objectInView(item.x, item.y)) return; objects.push({ type: 'item', ...item, distance: Math.hypot(item.x - renderCamera().x, item.y - renderCamera().y) }); });
  // Weapon keepers use a dedicated final trader-style pass below. They are
  // intentionally not depth-sorted with trees, gates, and record props.
  // The safe lobby contains the the plasma display only. Never allow a stale/legacy room-0 enemy
  // to occupy a weapon keeper or appear beside the portfolio scroll.
  worldEnemies.forEach((enemy) => { if (enemy.roomIndex !== state.room) return; if ((!enemy.dead || enemy.deathTime < .75) && objectInView(enemy.x, enemy.y)) objects.push({ type: 'enemy', ...enemy, distance: Math.hypot(enemy.x - renderCamera().x, enemy.y - renderCamera().y) }); });
  if (state.room === FINAL_ROOM_INDEX && state.finalBoss && (!state.finalBoss.dead || state.finalBoss.deathTime < 2.4)) {
    const bossDistance = Math.hypot(state.finalBoss.x - renderCamera().x, state.finalBoss.y - renderCamera().y);
    if (objectInView(state.finalBoss.x, state.finalBoss.y, BOSS_RENDER_DEPTH) || state.finalArenaTime > 0) objects.push({ type: 'enemy', ...state.finalBoss, distance: bossDistance });
  }
  objects.sort((a, b) => b.distance - a.distance);
  for (const object of objects) {
    if (object.type === 'lobby-tree' || object.type === 'forest-tree') drawLobbyTree3D(object, now);
    else if (object.type === 'lobby-bush') drawLobbyBush3D(object, now);
    else if (object.type === 'forest-ambusher') drawEnemy3D(object);
    else if (object.type === 'lobby-entrance-sign') drawLobbyEntranceSign(object, now);
    else if (object.type === 'lobby-gate') drawLobbyGate(now);
    else if (object.type === 'item') {
      if (['ammo-pickup', 'ammo-arsenal', 'ammo-shotgun', 'ammo-bfg'].includes(object.kind)) {
        const pickupSprite = pickupSpriteFrame(object);
        // Pickups are physical ground loot: no hover animation and no bob.
        // Centering the billboard at half its world height makes its bottom
        // edge rest directly on the floor plane.
        const itemZ = pickupSprite ? .23 : .21;
        const itemSprite = pickupSprite || makeItemSprite(object);
        drawBillboard(itemSprite, projectBillboard(object.x, object.y, itemZ, pickupSprite ? .46 : .42), .9);
        if (object.kind.endsWith('-pickup') || object.kind.startsWith('ammo-')) drawGroundGlow(object.x, object.y, object.color || '#e7ad67', now, object.dropFromEnemy ? .7 : .58, object.dropFromEnemy ? .055 : .04);
        if (state.revealTimer > 0) {
          const projection = projectBillboard(object.x, object.y, pickupSprite ? .23 : .21, .55);
          if (projection) {
            ctx.save();
            ctx.globalAlpha = .55 + Math.sin(now / 120) * .15;
            ctx.strokeStyle = '#6ce0c2';
            ctx.shadowBlur = 16;
            ctx.shadowColor = '#6ce0c2';
            ctx.lineWidth = Math.max(1, projection.height * .018);
            ctx.beginPath();
            ctx.arc(projection.x, (projection.top + projection.bottom) / 2, Math.max(8, projection.height * .5), 0, TAU);
            ctx.stroke();
            ctx.restore();
          }
        }
      } else drawPortfolioItem3D(object, now);
    } else drawEnemy3D(object);
  }

  // Draw the plasma display after every other lobby prop so they remain
  // visible and interactable even when a tree or gate overlaps their projection.
  if (currentRoomIndex() === 0 && !state.lobbyDeparted) {
    for (const keeper of LOBBY_WEAPON_CREATURES) drawLobbyWeaponCreature(keeper, now);
    // Narration is rendered exclusively in the lower HUD; never draw the old world-space bubble.
  }
}
function ninjaStarProfile(size) {
  const radius = size / 2;
  const innerRadius = radius * .48;
  const profile = [];
  // Eight points in the side/forward plane. Thickness remains vertical so the
  // held and thrown stars share the same readable axis orientation.
  for (let index = 0; index < 16; index += 1) {
    const angle = -Math.PI / 2 + index * Math.PI / 8;
    const pointRadius = index % 2 === 0 ? radius : innerRadius;
    profile.push({ side: Math.cos(angle) * pointRadius, forward: Math.sin(angle) * pointRadius });
  }
  return profile;
}

function addFlatSquareBladeWorld(faces, origin, center, size, thickness, yaw, color, shade = 1) {
  const profile = ninjaStarProfile(size);
  const layers = [-1, 1].map((layer) => profile.map((point) => transformLocalPoint(origin, {
    side: center.side + point.side,
    forward: center.forward + point.forward,
    z: center.z + layer * thickness / 2,
  }, yaw)));
  const bottom = layers[0];
  const top = layers[1];
  faces.push({ points: top, color, shade, material: 'steel' });
  faces.push({ points: [...bottom].reverse(), color, shade: shade * .62, material: 'steel' });
  for (let index = 0; index < profile.length; index += 1) {
    const next = (index + 1) % profile.length;
    faces.push({ points: [top[index], top[next], bottom[next], bottom[index]], color, shade: shade * (.68 + (index % 3) * .1), material: 'steel' });
  }
}

function weaponFlatPoint(origin, side, forward, z, yaw) {
  const cosine = Math.cos(yaw);
  const sine = Math.sin(yaw);
  return {
    side: origin.side + side * cosine - forward * sine,
    forward: origin.forward + side * sine + forward * cosine,
    z: origin.z + z,
  };
}

function addFlatSquareBladeCamera(faces, origin, center, size, thickness, yaw, color, shade = 1) {
  const profile = ninjaStarProfile(size);
  const layers = [-1, 1].map((layer) => profile.map((point) => weaponFlatPoint(
    origin,
    center.side + point.side,
    center.forward + point.forward,
    center.z + layer * thickness / 2,
    yaw,
  )));
  const bottom = layers[0];
  const top = layers[1];
  faces.push({ points: top, color, shade, material: 'steel' });
  faces.push({ points: [...bottom].reverse(), color, shade: shade * .62, material: 'steel' });
  for (let index = 0; index < profile.length; index += 1) {
    const next = (index + 1) % profile.length;
    faces.push({ points: [top[index], top[next], bottom[next], bottom[index]], color, shade: shade * (.72 + (index % 2) * .12), material: 'steel' });
  }
}

function addSwordBladeCamera(faces, origin, center, width, length, thickness, roll, color, shade = 1) {
  const profile = [
    { side: -width * .5, z: 0 },
    { side: width * .5, z: 0 },
    { side: width * .42, z: length * .82 },
    { side: 0, z: length },
    { side: -width * .42, z: length * .82 },
  ];
  const layers = [-1, 1].map((layer) => profile.map((point) => weaponLocalPoint(
    origin,
    center.side + point.side,
    center.forward + layer * thickness / 2,
    center.z + point.z,
    roll,
  )));
  const back = layers[0];
  const front = layers[1];
  faces.push({ points: front, color, shade, material: 'steel' });
  faces.push({ points: [...back].reverse(), color, shade: shade * .58, material: 'steel' });
  for (let index = 0; index < profile.length; index += 1) {
    const next = (index + 1) % profile.length;
    faces.push({ points: [front[index], front[next], back[next], back[index]], color, shade: shade * (.68 + (index % 2) * .12), material: 'steel' });
  }
}

function addThinSquareBladeCamera(faces, origin, center, size, thickness, roll, color, shade = 1) {
  const half = size / 2;
  const bevel = size * .12;
  const profile = [
    { side: -half + bevel, z: -half },
    { side: half - bevel, z: -half },
    { side: half, z: -half + bevel },
    { side: half, z: half - bevel },
    { side: half - bevel, z: half },
    { side: -half + bevel, z: half },
    { side: -half, z: half - bevel },
    { side: -half, z: -half + bevel },
  ];
  const layers = [-1, 1].map((layer) => profile.map((point) => weaponLocalPoint(
    origin,
    center.side + point.side,
    center.forward + layer * thickness / 2,
    center.z + point.z,
    roll,
  )));
  const back = layers[0];
  const front = layers[1];
  faces.push({ points: front, color, shade, material: 'steel' });
  faces.push({ points: [...back].reverse(), color, shade: shade * .62, material: 'steel' });
  for (let index = 0; index < profile.length; index += 1) {
    const next = (index + 1) % profile.length;
    faces.push({ points: [front[index], front[next], back[next], back[index]], color, shade: shade * (.68 + (index % 3) * .10), material: 'steel' });
  }
}

function addFlatStarLocal(faces, origin, center, radius, depth, yaw, color, shade = 1) {
  const layers = [];
  for (const layer of [-1, 1]) {
    const points = [];
    for (let index = 0; index < 16; index += 1) {
      const angle = -Math.PI / 2 + index * Math.PI / 8;
      const pointRadius = index % 2 === 0 ? radius : radius * .42;
      points.push(transformLocalPoint(origin, {
        side: center.side + Math.cos(angle) * pointRadius,
        forward: center.forward + layer * depth / 2,
        z: center.z + Math.sin(angle) * pointRadius,
      }, yaw));
    }
    layers.push(points);
  }
  const back = layers[0];
  const front = layers[1];
  faces.push({ points: front, color, shade, material: 'steel' });
  faces.push({ points: [...back].reverse(), color, shade: shade * .68, material: 'steel' });
  for (let index = 0; index < 16; index += 1) {
    const next = (index + 1) % 16;
    faces.push({ points: [front[index], front[next], back[next], back[index]], color, shade: shade * (.72 + (index % 3) * .08), material: 'steel' });
  }
}

function drawNinjaStarBlade(centerX, centerY, size, rotation, color = '#f2e5bb', alpha = 1) {
  // The hand-held star uses the same eight-point silhouette as the world prop,
  // but is deliberately narrow and flat so it reads as a single blade in-hand.
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(rotation);
  ctx.globalAlpha = alpha;
  ctx.lineJoin = 'round';
  ctx.shadowBlur = Math.max(5, size * .28);
  ctx.shadowColor = color;
  const outerRadius = size * .68;
  const innerRadius = size * .28;
  const widthScale = .62;
  const points = [];
  for (let index = 0; index < 16; index += 1) {
    const angle = -Math.PI / 2 + index * Math.PI / 8;
    const pointRadius = index % 2 === 0 ? outerRadius : innerRadius;
    points.push({ x: Math.cos(angle) * pointRadius * widthScale, y: Math.sin(angle) * pointRadius });
  }
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
  ctx.closePath();
  ctx.fillStyle = '#c8a96d';
  ctx.strokeStyle = '#5a4228';
  ctx.lineWidth = Math.max(1, size * .045);
  ctx.fill();
  ctx.stroke();
  ctx.globalAlpha = alpha * .76;
  ctx.strokeStyle = '#f6df9c';
  ctx.lineWidth = Math.max(1, size * .022);
  ctx.beginPath();
  ctx.moveTo(-size * .12, -size * .42);
  ctx.lineTo(size * .12, -size * .42);
  ctx.lineTo(size * .12, size * .42);
  ctx.stroke();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#5b3d25';
  ctx.beginPath();
  ctx.arc(0, 0, size * .08, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawProjectedSquareBlade(centerX, centerY, size, rotation, color = '#f2e5bb', alpha = 1) {
  const half = size * .5;
  const bevel = size * .12;
  const profile = [
    [-half + bevel, -half], [half - bevel, -half], [half, -half + bevel],
    [half, half - bevel], [half - bevel, half], [-half + bevel, half],
    [-half, half - bevel], [-half, -half + bevel],
  ];
  const points = profile.map(([x, y]) => ({
    x: centerX + x * Math.cos(rotation) - y * Math.sin(rotation),
    y: centerY + x * Math.sin(rotation) + y * Math.cos(rotation),
  }));
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineJoin = 'bevel';
  ctx.shadowBlur = Math.max(5, size * .24);
  ctx.shadowColor = color;
  ctx.fillStyle = '#c8a96d';
  ctx.strokeStyle = '#5a4228';
  ctx.lineWidth = Math.max(1, size * .055);
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.globalAlpha = alpha * .72;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, size * .022);
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.slice(1, 5).forEach((point) => ctx.lineTo(point.x, point.y));
  ctx.stroke();
  ctx.restore();
}

function drawProjectileTrail(projectile, color) {
  const trail = projectile.trail || [];
  if (trail.length <= 1) return;
  ctx.save();
  ctx.lineCap = 'round';
  for (let index = 1; index < trail.length; index += 1) {
    const a = projectCameraPoint(cameraPoint(trail[index - 1].x, trail[index - 1].y, trail[index - 1].z));
    const b = projectCameraPoint(cameraPoint(trail[index].x, trail[index].y, trail[index].z));
    if (!a || !b) continue;
    ctx.globalAlpha = (1 - index / trail.length) * (projectile.ability ? .48 : .34);
    ctx.strokeStyle = projectile.kind === 'arrow' ? '#f0d38d' : color;
    ctx.shadowBlur = projectile.ability ? 10 : 7;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.lineWidth = Math.max(1, canvas.height * (projectile.kind === 'arrow' ? .0032 : .006) * (1 - index / trail.length));
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawWorldProjectiles(now) {
  for (const projectile of state.projectiles) {
    const camera = cameraPoint(projectile.x, projectile.y, projectile.z);
    if (camera.forward <= .04 || Math.abs(Math.atan2(camera.side, camera.forward)) > cameraFov() * .9) continue;
    const color = projectile.color;
    if (projectile.spriteSheet) {
      const sprite = gameSprites[projectile.spriteSheet];
      const projection = projectVerticalBounds(projectile.x, projectile.y, projectile.z, projectile.spriteWorldHeight || .42);
      const frame = Math.floor((projectile.age || 0) * (projectile.spriteFps || 12)) % (projectile.spriteFrameCount || 8);
      const keyedProjectile = ['enemyFireballProjectile', 'enemyPlasmaProjectile'].includes(projectile.spriteSheet);
      const drawn = spriteReady(sprite) && (keyedProjectile
        ? drawKeyedProjectileBillboard(sprite, projection, frame, `projectile-${projectile.spriteSheet}`, .96)
        : drawSpriteSheetBillboard(sprite, projection, frame, projectile.spriteFrameCount || 8, .96));
      // Generated enemy fireball/plasma sheets are the only projectile art.
      // Do not fall back to the retired red-cross/diamond procedural glyphs;
      // if the image is still loading, leave the projectile invisible for this
      // frame rather than showing the legacy placeholder.
      if (drawn) drawProjectileTrail(projectile, color);
      continue;
    }
    const projectileAbilityPalette = projectile.ability ? abilityVisualPalette({ color: projectile.color, kind: projectile.abilityKind }) : null;
    const renderColor = projectileAbilityPalette?.base || color;
    const renderAccent = projectileAbilityPalette?.accent || color;
    const renderLight = projectileAbilityPalette?.light || vividAbilityRgb('#fff1b0');
    const yaw = Math.atan2(projectile.vy, projectile.vx);
    const faces = [];
    const size = projectile.kind === 'arrow' ? .1 : projectile.kind === 'ninja-star' ? .14 : projectile.kind === 'boss-bolt' ? .2 : projectile.ability ? .085 : .18;
    if (projectile.kind === 'ninja-star') {
      // Match the held star: the face uses side/forward and the short axis is
      // vertical z, rather than making the short axis run through depth.
      const starSize = .28;
      const starThickness = .06;
      const starRotation = yaw + projectile.spin + now / 155;
      addFlatSquareBladeWorld(faces, projectile, { side: 0, forward: 0, z: projectile.z }, starSize, starThickness, starRotation, color, 1.12);
      addFlatSquareBladeWorld(faces, projectile, { side: 0, forward: 0, z: projectile.z + starThickness * .52 }, starSize * .48, .012, starRotation, '#fff0b2', .98);
      addBoxLocal(faces, projectile, { side: 0, forward: 0, z: projectile.z }, [.065, .065, .08], starRotation, '#5b3d25', 1.08, 'steel');
    } else if (projectile.kind === 'arrow') {
      const boltYaw = yaw + Math.sin((projectile.age || 0) * 18 + projectile.spin) * .015;
      addBoxLocal(faces, projectile, { side: 0, forward: 0, z: projectile.z }, [.045, .76, .045], boltYaw, '#d5b66e', 1, 'wood');
      addFacetedWeaponVolumeWorld(faces, projectile, { side: 0, forward: .42, z: projectile.z }, [.16, .19, .14], boltYaw, color, 1.16, 'steel', 2);
      addBoxLocal(faces, projectile, { side: -.075, forward: -.28, z: projectile.z + .025 }, [.026, .16, .09], boltYaw, '#efe0a9', .98, 'bone');
      addBoxLocal(faces, projectile, { side: .075, forward: -.28, z: projectile.z + .025 }, [.026, .16, .09], boltYaw, '#efe0a9', .9, 'bone');
      addBoxLocal(faces, projectile, { side: 0, forward: -.29, z: projectile.z }, [.17, .08, .025], '#9d6d39', .92, 'wood');

    } else if (projectile.kind === 'bfg-electric') {
      const pulse = settings.reducedMotion ? .7 : .86 + Math.sin((projectile.age || 0) * 18 + projectile.spin) * .16;
      const bfgYaw = yaw + (projectile.age || 0) * 3.6;
      const bfgSize = .34 * pulse;
      addFacetedWeaponVolumeWorld(faces, projectile, { side: 0, forward: 0, z: projectile.z }, [bfgSize, bfgSize, bfgSize], bfgYaw, '#2bd9d0', 1.2, 'steel', 6);
      addFacetedWeaponVolumeWorld(faces, projectile, { side: 0, forward: 0, z: projectile.z }, [bfgSize * .5, bfgSize * .5, bfgSize * .5], bfgYaw + Math.PI / 4, '#effff7', 1.3, 'steel', 4);
      for (let arc = 0; arc < 3; arc += 1) addBoxLocal(faces, projectile, { side: 0, forward: 0, z: projectile.z + (arc - 1) * .08 }, [bfgSize * 1.8, .025, .025], bfgYaw + arc * 1.05, '#8dfff1', 1.1, 'steel');
    } else if (projectile.kind === 'wand-fireball') {
      const firePulse = settings.reducedMotion ? .5 : .8 + Math.sin((projectile.age || 0) * 15 + projectile.spin) * .16;
      const fireYaw = yaw + (projectile.age || 0) * 2.8;
      addFacetedWeaponVolumeWorld(faces, projectile, { side: 0, forward: 0, z: projectile.z }, [size * 1.7 * firePulse, size * 1.45, size * 1.7 * firePulse], fireYaw, color, 1.12, 'steel', 4);
      addFacetedWeaponVolumeWorld(faces, projectile, { side: 0, forward: .03, z: projectile.z }, [size * .82, size * .7, size * .82], fireYaw - .7, '#fff1b0', 1.2, 'steel', 5);
      addBoxLocal(faces, projectile, { side: 0, forward: -.22, z: projectile.z }, [size * 1.85, size * .38, size * .38], yaw, '#9f3f2f', .92, 'steel');
      addBoxLocal(faces, projectile, { side: 0, forward: -.42, z: projectile.z }, [size * 1.05, size * .2, size * .2], yaw, '#f3b34e', 1.04, 'steel');
    } else {
      const coreScale = projectile.kind === 'ability-chain' ? 1.25 : projectile.kind === 'ability-orb' ? 1.08 : 1;
      addFacetedWeaponVolumeWorld(faces, projectile, { side: 0, forward: 0, z: projectile.z }, [size * coreScale, size * coreScale, size * coreScale], yaw, color, 1.15, 'steel', 1);
      addFacetedWeaponVolumeWorld(faces, projectile, { side: 0, forward: 0, z: projectile.z }, [size * .54, size * .54, size * .54], yaw + Math.PI / 4, '#fff1b0', 1.18, 'steel', 2);
      if (projectile.kind === 'ability-fireball') {
        addBoxLocal(faces, projectile, { side: 0, forward: -.2, z: projectile.z }, [size * 1.5, size * .35, size * .35], yaw, '#9f3f2f', .9, 'steel');
        addBoxLocal(faces, projectile, { side: 0, forward: -.38, z: projectile.z }, [size * .9, size * .18, size * .18], yaw, '#f3b34e', 1, 'steel');
      }
      if (projectile.kind === 'ability-chain') {
        addBoxLocal(faces, projectile, { side: 0, forward: -.28, z: projectile.z + .1 }, [size * .32, size * 2.2, size * .32], yaw + Math.PI / 4, color, .95, 'steel');
      }
      if (projectile.kind === 'boss-ring') {
        addBoxLocal(faces, projectile, { side: 0, forward: .18, z: projectile.z }, [size * .55, size * 1.8, size * .55], yaw, '#fff1b0', 1.05, 'steel');
      }
    }
    if (faces.length && !['enemy-bolt', 'enemy-plasma', 'enemy-fireball', 'boss-bolt', 'boss-ring'].includes(projectile.kind)) renderFaces(faces, clamp(.3 + projectile.lifetime / projectile.maxLifetime, .38, 1));
    const projectilePoint = projectCameraPoint(cameraPoint(projectile.x, projectile.y, projectile.z));
    // Generated fireball/plasma projectiles return above. Other projectiles
    // retain their authored world geometry and aura without legacy glyphs.
    if (projectilePoint && projectile.kind !== 'arrow') {
      const pulse = .72 + Math.sin(now / 85 + projectile.x * 2.1) * .22;
      ctx.save();
      let sphereRadius = 0;
      if (projectile.ability) {
        const sphereScaleByKind = { gate: 1.12, reveal: 1.05, homing: 1.18, ward: 1.1, chain: 1.08, echo: 1.04, fireball: 1.32, bloom: 1.16, beam: 1.12 };
        sphereRadius = Math.max(3.5, canvas.height * .017 / Math.max(.8, camera.forward) * (sphereScaleByKind[projectile.abilityKind] || 1));
        ctx.globalAlpha = .82 * pulse;
        ctx.fillStyle = color;
        ctx.shadowBlur = 9;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.arc(projectilePoint.x, projectilePoint.y, sphereRadius, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = .9;
        ctx.fillStyle = '#fff1b0';
        ctx.beginPath();
        ctx.arc(projectilePoint.x - sphereRadius * .28, projectilePoint.y - sphereRadius * .3, Math.max(1, sphereRadius * .28), 0, TAU);
        ctx.fill();
        ctx.globalAlpha = .38 * pulse;
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1, canvas.height * .0015);
        ctx.beginPath();
        ctx.arc(projectilePoint.x, projectilePoint.y, sphereRadius * 2.25, 0, TAU);
        ctx.stroke();
        if (state.renderQuality > .62) drawAbilityScreenMotif(projectile.abilityKind, projectilePoint.x, projectilePoint.y, sphereRadius, now, .42 * pulse, now / 240 + projectile.spin, Math.atan2(projectile.vy, projectile.vx));
      } else {
        ctx.globalAlpha = .42 * pulse;
        ctx.strokeStyle = color;
        ctx.shadowBlur = 16;
        ctx.shadowColor = color;
        ctx.lineWidth = Math.max(1, canvas.height * .0045 * projectile.trailSize);
        ctx.beginPath();
        ctx.arc(projectilePoint.x, projectilePoint.y, Math.max(2, canvas.height * .012 * projectile.trailSize), 0, TAU);
        ctx.stroke();
      }
      if (projectile.kind === 'ability-chain') {
        ctx.translate(projectilePoint.x, projectilePoint.y);
        ctx.rotate(now / 260);
        ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(4, 0); ctx.moveTo(0, -4); ctx.lineTo(0, 4); ctx.stroke();
        ctx.rotate(Math.PI / 4);
        ctx.globalAlpha = .55 * pulse;
        ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.stroke();
      }
      if (projectile.ability && projectile.orbit) {
        ctx.translate(projectilePoint.x, projectilePoint.y);
        for (let orbit = 0; orbit < projectile.orbit; orbit += 1) {
          const angle = now / (180 + orbit * 55) + projectile.spin + orbit * TAU / projectile.orbit;
          const orbitRadius = Math.max(4, canvas.height * .011 * projectile.trailSize);
          ctx.globalAlpha = .78 * pulse;
          ctx.fillStyle = orbit % 2 ? abilityFocusProfile(projectile.abilityKind).accent : color;
          ctx.beginPath(); ctx.arc(Math.cos(angle) * orbitRadius, Math.sin(angle) * orbitRadius, Math.max(1.5, canvas.height * .0022), 0, TAU); ctx.fill();
        }
      }
      ctx.restore();
    }
    drawProjectileTrail(projectile, color);
  }
}
function drawWorldLabel(point, title, subtitle, color = '#fff8d6', alpha = 1) {
  if (!point) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.max(12, canvas.height * .022)}px "DM Mono", monospace`;
  ctx.fillStyle = color;
  ctx.shadowBlur = 18;
  ctx.shadowColor = color;
  ctx.fillText(title, point.x, point.y);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = alpha * .76;
  ctx.font = `${Math.max(8, canvas.height * .012)}px "DM Mono", monospace`;
  ctx.fillText(subtitle, point.x, point.y + Math.max(14, canvas.height * .026));
  ctx.restore();
}
function drawDoorOfLight(now) {
  const door = state.doorOfLight;
  if (!door?.active || state.room !== FINAL_ROOM_INDEX) return;
  const yaw = Math.atan2(state.player.y - door.y, state.player.x - door.x);
  const pulse = 1 + Math.sin(now / 180) * .055;
  const faces = [];
  const origin = { x: door.x, y: door.y };
  // A broad stone-and-light arch is deliberately oversized so the boss exit
  // reads as the next objective rather than another piece of arena dressing.
  addBoxLocal(faces, origin, { side: -1.58, forward: 0, z: 1.38 }, [.32, .52, 2.76], yaw, '#d8c58c', 1, 'steel');
  addBoxLocal(faces, origin, { side: 1.58, forward: 0, z: 1.38 }, [.32, .52, 2.76], yaw, '#d8c58c', .9, 'steel');
  addBoxLocal(faces, origin, { side: 0, forward: 0, z: 2.72 }, [3.48, .54, .32], yaw, '#fff0b7', 1.08, 'steel');
  addBoxLocal(faces, origin, { side: 0, forward: .02, z: 1.37 }, [2.72 * pulse, .08, 2.46 * pulse], yaw, '#fffdf0', 1.22, 'steel');
  addBoxLocal(faces, origin, { side: 0, forward: .09, z: 1.37 }, [1.78, .1, 2.08], yaw, '#b8f0e2', 1.02, 'steel');
  renderFaces(faces, .98);
  drawProjectedWorldRing({ x: door.x, y: door.y }, 1.72 * pulse, '#fff1b0', .72, 32, .045, Math.max(2, canvas.height * .004));
  drawProjectedWorldRing({ x: door.x, y: door.y }, 1.3, '#b8f0e2', .56, 20, .055, Math.max(1, canvas.height * .002));
  const projection = projectVerticalBounds(door.x, door.y, 1.38, 2.9);
  if (!projection) return;
  ctx.save();
  ctx.globalAlpha = .34 + Math.sin(now / 130) * .1;
  ctx.strokeStyle = '#fff8d6';
  ctx.shadowBlur = 34;
  ctx.shadowColor = '#b8f0e2';
  ctx.lineWidth = Math.max(3, projection.height * .035);
  ctx.beginPath();
  ctx.ellipse(projection.x, (projection.top + projection.bottom) / 2, projection.height * .41, projection.height * .55, 0, 0, TAU);
  ctx.stroke();
  ctx.restore();
  drawWorldLabel(
    { x: projection.x, y: Math.max(20, projection.top - 25) },
    'ASCENSION GATE',
    'ENTER SANCTUARY',
    '#fff8d6',
    .92 + Math.sin(now / 180) * .08,
  );
}
function drawSanctuaryPedestal(now) {
  if (state.room !== SANCTUARY_ROOM_INDEX) return;
  const pedestal = SANCTUARY_RESUME_PEDESTAL;
  const yaw = Math.atan2(renderCamera().y - pedestal.y, renderCamera().x - pedestal.x);
  const origin = { x: pedestal.x, y: pedestal.y };
  const faces = [];
  addBoxLocal(faces, origin, { side: 0, forward: 0, z: .22 }, [1.28, 1.08, .44], yaw, '#8dbaa9', .88, 'stone');
  addBoxLocal(faces, origin, { side: 0, forward: 0, z: .68 }, [.72, .62, .78], yaw, '#d8ead6', 1.04, 'stone');
  addBoxLocal(faces, origin, { side: 0, forward: 0, z: 1.12 }, [1.02, .82, .16], yaw, '#fff1b0', 1.12, 'steel');
  // The résumé is a floating, readable page rather than a generic loot cube.
  addBoxLocal(faces, origin, { side: 0, forward: .05, z: 1.62 }, [.62, .08, .78], yaw, '#fff8d6', 1.12, 'bone');
  addBoxLocal(faces, origin, { side: 0, forward: .11, z: 1.62 }, [.46, .025, .62], yaw, '#b8f0e2', .92, 'leather');
  for (let line = 0; line < 4; line += 1) addBoxLocal(faces, origin, { side: -.13, forward: .14, z: 1.43 + line * .12 }, [.26 - line * .03, .018, .024], '#397c74', .9, 'steel');
  renderFaces(faces, .98);
  drawGroundGlow(pedestal.x, pedestal.y, '#fff1b0', now, 1.1, .035);
  drawProjectedWorldRing({ x: pedestal.x, y: pedestal.y }, 1.18, '#fff8d6', .74 + Math.sin(now / 190) * .12, 28, .045, Math.max(2, canvas.height * .004));
  const projection = projectVerticalBounds(pedestal.x, pedestal.y, 1.18, 2.18);
  if (!projection) return;
  const page = projectVerticalBounds(pedestal.x, pedestal.y, 1.62, .82);
  if (page) {
    ctx.save();
    ctx.globalAlpha = .22 + Math.sin(now / 160) * .07;
    ctx.strokeStyle = '#fff8d6';
    ctx.shadowBlur = 28;
    ctx.shadowColor = '#fff1b0';
    ctx.lineWidth = Math.max(2, page.height * .025);
    ctx.strokeRect(page.x - page.height * .28, page.top, page.height * .56, page.height);
    ctx.restore();
  }
  drawWorldLabel(
    { x: projection.x, y: Math.max(20, projection.top - 22) },
    'RÉSUMÉ PEDESTAL',
    state.resumeDownloaded ? 'DOWNLOAD STARTED' : 'APPROACH TO DOWNLOAD',
    '#fff8d6',
    .9 + Math.sin(now / 220) * .08,
  );
}

function drawImpactBursts(now) {
  const enemyEffectStyles = new Set(['hit', 'critical', 'defeat', 'stagger', 'enemy-melee', 'enemy-ranged', 'cast', 'bfg-impact', 'projectile-impact', 'telegraph-contact']);
  for (const burst of state.impactBursts) {
    if (enemyEffectStyles.has(burst.style)) continue;
    const progress = clamp(burst.elapsed / burst.duration, 0, 1);
    const center = projectCameraPoint(cameraPoint(burst.x, burst.y, burst.z));
    if (!center) continue;
    const radiusWorld = burst.radius * (0.25 + progress * .75);
    const pixelBurst = ['hit', 'critical', 'defeat', 'stagger', 'damage'].includes(burst.style);
    ctx.save(); ctx.globalAlpha = Math.sin(Math.PI * progress) * .7; ctx.strokeStyle = burst.color; ctx.shadowBlur = pixelBurst ? 0 : 18; ctx.shadowColor = burst.color; ctx.lineWidth = Math.max(1, canvas.height * .006);
    if (!pixelBurst) {
      ctx.beginPath();
      for (let index = 0; index <= 16; index += 1) {
        const angle = index / 16 * TAU; const point = projectCameraPoint(cameraPoint(burst.x + Math.cos(angle) * radiusWorld, burst.y + Math.sin(angle) * radiusWorld, burst.z));
        if (!point) continue; if (index === 0) ctx.moveTo(point.x, point.y); else ctx.lineTo(point.x, point.y);
      }
      ctx.stroke();
    }
    if (['hit', 'critical', 'defeat', 'stagger', 'damage'].includes(burst.style)) {
      // Hard-edged 8-bit impact chunks instead of smooth rings and vector slashes.
      const pixelSize = Math.max(2, Math.round(canvas.height * .006 * Math.max(.45, 1 / center.depth)));
      const pixelColor = burst.style === 'critical' || burst.style === 'defeat' ? '#e0b66d' : '#a13d2f';
      ctx.globalAlpha = Math.sin(Math.PI * progress) * (burst.style === 'defeat' ? .9 : .74);
      ctx.fillStyle = pixelColor;
      for (let chunk = 0; chunk < 12; chunk += 1) {
        const angle = chunk / 12 * TAU + Math.floor(burst.elapsed * 18) * .17;
        const distance = radiusWorld * (.28 + ((chunk * 7) % 9) / 10 * (1.1 + progress * .45));
        const point = projectCameraPoint(cameraPoint(burst.x + Math.cos(angle) * distance, burst.y + Math.sin(angle) * distance, burst.z + ((chunk % 3) - 1) * .045));
        if (!point) continue;
        const size = pixelSize * (chunk % 3 === 0 ? 2 : 1);
        ctx.fillRect(Math.round(point.x / pixelSize) * pixelSize, Math.round(point.y / pixelSize) * pixelSize, size, size);
      }
    }
    if (!pixelBurst) {
      for (let spark = 0; spark < 6; spark += 1) {
        const sparkAngle = spark / 6 * TAU + burst.elapsed * 3;
        const sparkRadius = radiusWorld * (.5 + spark * .07);
        const sparkPoint = projectCameraPoint(cameraPoint(burst.x + Math.cos(sparkAngle) * sparkRadius, burst.y + Math.sin(sparkAngle) * sparkRadius, burst.z + Math.sin(sparkAngle * 2) * .22));
        if (!sparkPoint) continue;
        ctx.globalAlpha = Math.sin(Math.PI * progress) * .72;
        ctx.fillStyle = burst.color;
        ctx.beginPath(); ctx.arc(sparkPoint.x, sparkPoint.y, Math.max(1, canvas.height * .004 * (1 - progress)), 0, TAU); ctx.fill();
      }
    }
    ctx.restore();
  }
}

function addCameraBox(faces, center, dimensions, roll, color, shade = 1, material = null) {
  const [sideSize, forwardSize, height] = dimensions; const points = [];
  for (const side of [-1, 1]) for (const forward of [-1, 1]) for (const zSign of [-1, 1]) {
    const localSide = side * sideSize / 2; const localZ = zSign * height / 2;
    points.push({ side: center.side + localSide * Math.cos(roll) - localZ * Math.sin(roll), forward: center.forward + forward * forwardSize / 2, z: center.z + localSide * Math.sin(roll) + localZ * Math.cos(roll) });
  }
  addBoxFaces(faces, points, color, shade, material);
}
function addCameraCrystal(faces, center, radius, depth, height, roll, color, shade = 1, material = 'steel') {
  const ring = [];
  for (let index = 0; index < 6; index += 1) {
    const angle = index * TAU / 6;
    const localSide = Math.cos(angle) * radius;
    const localForward = Math.sin(angle) * depth;
    ring.push({
      side: center.side + localSide * Math.cos(roll),
      forward: center.forward + localForward,
      z: center.z + localSide * Math.sin(roll),
    });
  }
  const top = { side: center.side - Math.sin(roll) * height * .5, forward: center.forward, z: center.z + Math.cos(roll) * height * .5 };
  const bottom = { side: center.side + Math.sin(roll) * height * .5, forward: center.forward, z: center.z - Math.cos(roll) * height * .5 };
  for (let index = 0; index < ring.length; index += 1) {
    const next = (index + 1) % ring.length;
    faces.push({ points: [top, ring[index], ring[next]], color, shade: shade * (.72 + (index % 3) * .11), material });
    faces.push({ points: [bottom, ring[next], ring[index]], color, shade: shade * (.6 + ((index + 1) % 3) * .12), material });
  }
}
function addWeaponBox(faces, origin, center, dimensions, roll, color, shade = 1, material = null) {
  const [sideSize, forwardSize, height] = dimensions;
  const points = [];
  const cosine = Math.cos(roll);
  const sine = Math.sin(roll);
  for (const side of [-1, 1]) for (const forward of [-1, 1]) for (const zSign of [-1, 1]) {
    const localSide = center.side + side * sideSize / 2;
    const localForward = center.forward + forward * forwardSize / 2;
    const localZ = center.z + zSign * height / 2;
    points.push({
      side: origin.side + localSide * cosine - localZ * sine,
      forward: origin.forward + localForward,
      z: origin.z + localSide * sine + localZ * cosine,
    });
  }
  addBoxFaces(faces, points, color, shade, material);
}

function weaponLocalPoint(origin, side, forward, z, roll) {
  return {
    side: origin.side + side * Math.cos(roll) - z * Math.sin(roll),
    forward: origin.forward + forward,
    z: origin.z + side * Math.sin(roll) + z * Math.cos(roll),
  };
}
function addWeaponCrystal(faces, origin, center, radius, depth, height, roll, color, shade = 1, material = null) {
  const ring = [];
  for (let index = 0; index < 6; index += 1) {
    const angle = index * TAU / 6;
    ring.push(weaponLocalPoint(origin, center.side + Math.cos(angle) * radius, center.forward + Math.sin(angle) * depth, center.z, roll));
  }
  const top = weaponLocalPoint(origin, center.side, center.forward, center.z + height * .5, roll);
  const bottom = weaponLocalPoint(origin, center.side, center.forward, center.z - height * .5, roll);
  for (let index = 0; index < ring.length; index += 1) {
    const next = (index + 1) % ring.length;
    faces.push({ points: [top, ring[index], ring[next]], color, shade: shade * (.72 + (index % 3) * .11), material });
    faces.push({ points: [bottom, ring[next], ring[index]], color, shade: shade * (.6 + ((index + 1) % 3) * .12), material });
  }
}

function weaponMotion() {
  const definition = weaponDefinition();
  const active = state.weapon.swing > 0;
  const t = active ? 1 - state.weapon.swing / definition.duration : 0;
  return { active, t, definition };
}

// The opening shot begins with the weapon below the visor and brings it into
// the ready position like a real first-person rig settling on target.
function weaponIntroPose() {
  const preview = state.levelPreview;
  if (!preview || preview.phase !== 'weapon-lift') return { ready: 1, lower: 0, roll: 0, sway: 0 };
  const progress = clamp(previewBootElapsed(preview) / Math.max(.01, preview.weaponDuration), 0, 1);
  const ready = smoothstep(.04, .96, progress);
  const lower = 1 - ready;
  return {
    ready,
    lower,
    // Keep the pull-up physical and vertical. Do not drift the weapon sideways
    // or rotate it during the intro; the camera and visor provide the drama.
    roll: 0,
    sway: 0,
  };
}

function drawNinjaStars(now) {
  const { active, t } = weaponMotion();
  const combo = state.weapon.comboStep || 1;
  const moving = state.weapon.moving;
  const idleSpin = settings.reducedMotion ? 0 : now / 390;
  const anticipation = active ? 1 - clamp(t / .22, 0, 1) : 0;
  const release = active ? easeOutCubic(clamp((t - .18) / .64, 0, 1)) : 0;
  const recoil = active ? Math.sin(clamp((t - .54) / .3, 0, 1) * Math.PI) : 0;
  const bob = moving ? Math.sin(state.weapon.bobPhase) * .025 : Math.sin(now / 650) * .01;
  const starYaw = idleSpin + release * (combo === 3 ? 8.5 : 6.4) + combo * .12;
  const faces = [];
  const origin = {
    side: .39 - anticipation * .09 - release * .16 + recoil * .07,
    forward: 1.18 + anticipation * .06 + release * .2,
    z: -.12 + bob + anticipation * .05,
  };
  const starSize = .158 + (active ? .018 + recoil * .01 : 0);
  const starCenter = { side: 0, forward: .18, z: .50 };
  addFlatSquareBladeCamera(faces, origin, starCenter, starSize, .032, starYaw, '#e6d29a', 1.12);
  addFlatSquareBladeCamera(faces, origin, { ...starCenter, z: starCenter.z + .016 }, starSize * .44, .009, starYaw - .7, '#fff0b2', 1.02);
  addFlatSquareBladeCamera(faces, origin, { ...starCenter, z: starCenter.z + .022 }, starSize * .72, .005, starYaw + Math.PI / 2, '#fff8d6', .42);
  addWeaponBox(faces, origin, { side: 0, forward: .19, z: .50 }, [.036, .045, .036], 0, '#5b3d25', 1.08, 'steel');
  addWeaponBox(faces, origin, { side: 0, forward: .19, z: .55 }, [.018, .025, .035], 0, '#fff0b2', .88, 'steel');
  renderFaces(faces, 1, true);

  const center = projectCameraPoint({ side: origin.side, forward: origin.forward + .18, z: origin.z + .50 });
  if (!center) return;
  const size = Math.max(10, canvas.height * (.045 + (active ? .006 : 0)));
  ctx.save();
  if (active && !settings.reducedMotion) {
    for (let trail = 3; trail >= 1; trail -= 1) {
      drawNinjaStarBlade(center.x - trail * canvas.height * .004, center.y + trail * canvas.height * .002, size * (.82 - trail * .06), starYaw - trail * .28, '#d08a4c', .08 + (3 - trail) * .035);
    }
  }
  drawNinjaStarBlade(center.x, center.y, size * .86, starYaw, '#f2dfaa', active ? .34 : .2);
  ctx.globalAlpha = .24 + (active ? .24 : 0);
  ctx.strokeStyle = '#fff1b0';
  ctx.shadowBlur = 12;
  ctx.shadowColor = '#d08a4c';
  ctx.lineWidth = Math.max(1, canvas.height * .002);
  ctx.beginPath();
  ctx.arc(center.x, center.y, size * (.32 + recoil * .2), starYaw, starYaw + Math.PI * 1.35);
  ctx.stroke();
  ctx.restore();
}

function drawWand(now) {
  const { active, t } = weaponMotion();
  const attunement = wandColorForAbility();
  const attunementLight = selectedAbilityDefinition()?.color || EMERALD_LIGHT;
  const moving = state.weapon.moving;
  const anticipation = active ? 1 - clamp(t / .26, 0, 1) : 0;
  const cast = active ? Math.sin(clamp(t / .82, 0, 1) * Math.PI) : 0;
  const release = active ? easeOutCubic(clamp((t - .34) / .42, 0, 1)) : 0;
  const castPulse = active ? Math.sin(clamp((t - .43) / .18, 0, 1) * Math.PI) : 0;
  const bob = moving ? Math.sin(state.weapon.bobPhase) * .02 : Math.sin(now / 620) * .008;
  const lift = anticipation * .055 + cast * .16 - release * .04;
  const sideOffset = -anticipation * .08 - cast * .04 + release * .08;
  const roll = -.16 + anticipation * .13 + cast * .16 - release * .12;
  const faces = [];
  const origin = { side: .42 + sideOffset, forward: 1.25 - cast * .08, z: -.04 + bob + lift };

  // Textured shaft, grip, ferrules, and a faceted crystal head.
  addWeaponBox(faces, origin, { side: 0, forward: .02, z: .4 }, [.086, .095, 2.2], roll, '#4a2d20', .98, 'wood');
  addWeaponBox(faces, origin, { side: 0, forward: .035, z: .12 }, [.16, .145, .24], roll, '#241716', .94, 'leather');
  addWeaponBox(faces, origin, { side: 0, forward: .03, z: -.68 }, [.13, .13, .1], roll, '#8f6338', .92, 'steel');
  addWeaponBox(faces, origin, { side: 0, forward: .04, z: .27 }, [.17, .15, .055], roll, '#b07a3f', .94, 'steel');
  addWeaponBox(faces, origin, { side: 0, forward: .04, z: .82 }, [.15, .145, .05], roll, '#8f6338', .9, 'steel');
  addWeaponBox(faces, origin, { side: 0, forward: .05, z: 1.17 }, [.15, .145, .07], roll, '#b07a3f', 1.02, 'steel');
  addWeaponBox(faces, origin, { side: -.16, forward: .045, z: 1.21 }, [.045, .05, .28], roll, attunement, .9, 'steel');
  addWeaponBox(faces, origin, { side: .16, forward: .045, z: 1.21 }, [.045, .05, .28], roll, attunement, .9, 'steel');

  const gem = { side: .01, forward: .08, z: 1.43 + castPulse * .04 };
  addWeaponBox(faces, origin, { side: gem.side, forward: gem.forward, z: gem.z - .07 }, [.15, .13, .07], roll, '#d09a4f', 1.08, null);
  addWeaponCrystal(faces, origin, gem, .105 + castPulse * .016, .07, .3 + castPulse * .045, roll, attunement, 1.14, null);
  addWeaponCrystal(faces, origin, { side: .01, forward: .105, z: 1.55 + castPulse * .05 }, .055, .04, .12, roll, attunementLight || '#8de8d0', 1.2, null);
  renderFaces(faces, 1, true);

  const tip = projectCameraPoint({ side: origin.side, forward: origin.forward + .18, z: origin.z + 1.62 + castPulse * .04 });
  if (tip) {
    ctx.save();
    ctx.globalAlpha = .22 + cast * .5 + castPulse * .22 + Math.sin(now / 130) * .05;
    ctx.strokeStyle = attunement;
    ctx.shadowBlur = 24 + castPulse * 16;
    ctx.shadowColor = attunement;
    ctx.lineWidth = Math.max(1, canvas.height * .004);
    ctx.beginPath(); ctx.arc(tip.x, tip.y, Math.max(6, canvas.height * (.015 + cast * .014 + castPulse * .01)), 0, TAU); ctx.stroke();
    ctx.globalAlpha *= .78;
    ctx.fillStyle = attunementLight;
    ctx.beginPath(); ctx.arc(tip.x, tip.y, Math.max(2, canvas.height * (.0085 + castPulse * .004)), 0, TAU); ctx.fill();
    for (let rune = 0; rune < 4; rune += 1) {
      const angle = now / (500 - rune * 35) + rune * TAU / 4;
      const orbitRadius = canvas.height * (.018 + castPulse * .012);
      ctx.globalAlpha = .42 + castPulse * .2;
      ctx.beginPath(); ctx.arc(tip.x + Math.cos(angle) * orbitRadius, tip.y + Math.sin(angle) * orbitRadius, Math.max(1, canvas.height * (.003 + castPulse * .0015)), 0, TAU); ctx.fill();
    }
    if (active && !settings.reducedMotion) {
      ctx.globalAlpha = .22 + castPulse * .25;
      ctx.strokeStyle = attunementLight;
      ctx.lineWidth = Math.max(1, canvas.height * .002);
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, Math.max(8, canvas.height * (.026 + castPulse * .022)), now / 280, now / 280 + Math.PI * 1.35);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function spawnNinjaStar() {
  const direction = playerAimDirection();
  const origin = { x: state.player.x + direction.x * .5, y: state.player.y + direction.y * .5, z: EYE_HEIGHT + direction.z * .05 };
  makeProjectile('ninja-star', origin, { x: direction.x * 11.5, y: direction.y * 11.5, z: direction.z * 11.5 }, { color: '#e6d29a', damage: state.weapon.attackDamage || WEAPON_LOADOUTS.stars.damage, radius: .16, lifetime: 2.2, collisionHeight: .72, knockback: WEAPON_LOADOUTS.stars.knockback, critChance: WEAPON_LOADOUTS.stars.critChance + (state.weapon.comboStep === 3 ? .1 : 0), critMultiplier: WEAPON_LOADOUTS.stars.critMultiplier, source: 'player', ability: false, trailSize: .8 });
  showToast(`Ninja star thrown · combo ${state.weapon.comboStep || 1}.`, 'good');
}
function spawnWandFireball() {
  const direction = playerAimDirection();
  const color = wandColorForAbility();
  const origin = { x: state.player.x + direction.x * .58, y: state.player.y + direction.y * .58, z: EYE_HEIGHT + direction.z * .1 };
  makeProjectile('wand-fireball', origin, { x: direction.x * 7.1, y: direction.y * 7.1, z: direction.z * 7.1 }, { color, damage: state.weapon.attackDamage || WEAPON_LOADOUTS.bfg.damage, radius: .23, lifetime: 2.8, aoe: 1.55, knockback: WEAPON_LOADOUTS.bfg.knockback, stagger: .18, critChance: WEAPON_LOADOUTS.bfg.critChance + (state.weapon.comboStep === 3 ? .08 : 0), critMultiplier: WEAPON_LOADOUTS.bfg.critMultiplier, trailSize: 1, orbit: 0, collisionHeight: .88, source: 'player', ability: false });
  showToast(`${weaponDefinition().label} launched ${wandAbilityName()} fire · combo ${state.weapon.comboStep || 1}.`, 'good');
  pushImpactBurst({ x: state.player.x + direction.x * .42, y: state.player.y + direction.y * .42, z: EYE_HEIGHT, elapsed: 0, duration: .28, color, radius: .32, style: 'weapon-cast' });
}

function spawnBfgProjectile(loadout = weaponDefinition()) {
  const direction = playerAimDirection();
  const origin = { x: state.player.x + direction.x * .58, y: state.player.y + direction.y * .58, z: EYE_HEIGHT + direction.z * .08 };
  const definition = loadout;
  makeProjectile('bfg-electric', origin, { x: direction.x * 8.4, y: direction.y * 8.4, z: direction.z * 8.4 }, {
    color: definition.impactColor, damage: definition.damage, radius: .3, lifetime: 3.4, aoe: 2.7,
    knockback: definition.knockback, stagger: definition.stagger, critChance: definition.critChance,
    critMultiplier: definition.critMultiplier, collisionHeight: 1.2, source: 'player', trailSize: 2.2, sparks: 12,
    spriteSheet: 'enemyPlasmaProjectile', spriteFrameCount: 8, spriteFps: 16, spriteWorldHeight: .58,
  });
  pushImpactBurst({ x: origin.x, y: origin.y, z: origin.z, elapsed: 0, duration: .42, color: definition.impactColor, radius: .48, style: 'weapon-cast' });
  showToast('Electric BFG launched.', 'good');
}

function drawSword(now) {
  const { active, t, definition } = weaponMotion();
  const combo = state.weapon.comboStep || 1;
  const moving = state.weapon.moving;
  const bob = moving ? Math.sin(state.weapon.bobPhase) * .018 : Math.sin(now / 680) * .006;
  const comboPose = [
    { start: -.98, end: 1.08, side: .54, endSide: -.48 },
    { start: -.64, end: 1.28, side: .48, endSide: -.54 },
    { start: -1.16, end: .84, side: .62, endSide: -.62 },
  ][Math.min(2, combo - 1)];

  // The swing has a visible wind-up, a fast cutting phase, and a short
  // follow-through. The existing hitAt value still controls gameplay impact.
  const poseAt = (sample) => {
    const anticipation = active ? 1 - clamp(sample / .18, 0, 1) : 0;
    const strike = active ? easeOutCubic(clamp((sample - .12) / .58, 0, 1)) : 0;
    const follow = active ? easeOutCubic(clamp((sample - .7) / .2, 0, 1)) : 0;
    return {
      angle: active ? lerp(comboPose.start, comboPose.end, strike) + follow * .18 - settle * .08 : -.14,
      origin: {
        side: active
          ? lerp(comboPose.side, comboPose.endSide, strike) + anticipation * .1 + follow * .1
          : .42,
        forward: active ? lerp(1.28, 1.0, strike) + anticipation * .04 : 1.16,
        z: (active ? lerp(.1, -.34, strike) : -.14) + bob + anticipation * .07 + Math.sin(strike * Math.PI) * .045,
      },
    };
  };
  const progress = active ? clamp(t / definition.duration, 0, 1) : 0;
  const settle = active ? easeOutCubic(clamp((progress - .82) / .18, 0, 1)) : 0;
  const pose = poseAt(progress);
  const origin = pose.origin;
  const sweepAngle = pose.angle;
  const faces = [];

  addWeaponBox(faces, origin, { side: 0, forward: .03, z: .14 }, [.11, .15, .38], sweepAngle, '#3a241b', .98, 'leather');
  addWeaponBox(faces, origin, { side: 0, forward: .05, z: .35 }, [.3, .13, .065], sweepAngle, '#b8f0e2', 1.02, 'steel');
  addWeaponBox(faces, origin, { side: 0, forward: .075, z: .35 }, [.18, .045, .025], sweepAngle, '#f4fff0', 1.16, 'steel');
  addWeaponBox(faces, origin, { side: 0, forward: .03, z: -.08 }, [.16, .16, .1], sweepAngle, '#8d633d', .96, 'steel');
  addSwordBladeCamera(faces, origin, { side: 0, forward: .1, z: .39 }, .145, 1.48, .038, sweepAngle, '#cfe8dc', 1.05);
  addSwordBladeCamera(faces, origin, { side: 0, forward: .132, z: .43 }, .034, 1.31, .014, sweepAngle, '#f4fff0', 1.08);
  addWeaponBox(faces, origin, { side: 0, forward: .08, z: 1.08 }, [.12, .06, .045], sweepAngle, '#f4fff0', 1.12, 'steel');
  renderFaces(faces, 1, true);

  const tip = projectCameraPoint(weaponLocalPoint(origin, 0, .1, .39 + 1.42, sweepAngle));
  if (!tip) return;
  ctx.save();
  ctx.globalAlpha = .2 + (active ? .24 : 0);
  ctx.strokeStyle = '#b8f0e2';
  ctx.shadowBlur = 16;
  ctx.shadowColor = '#b8f0e2';
  ctx.lineWidth = Math.max(1, canvas.height * .0022);
  ctx.beginPath();
  ctx.arc(tip.x, tip.y, Math.max(4, canvas.height * (.017 + (active ? .013 : 0) + settle * .004)), 0, TAU);
  ctx.stroke();

  if (active && !settings.reducedMotion) {
    ctx.globalAlpha = .12 + Math.sin(progress * Math.PI) * .32;
    ctx.lineWidth = Math.max(1, canvas.height * .0042);
    ctx.beginPath();
    const trailStart = Math.max(0, progress - .42);
    for (let sample = trailStart; sample <= progress; sample += .035) {
      const samplePose = poseAt(sample);
      const sampleTip = projectCameraPoint(weaponLocalPoint(samplePose.origin, 0, .1, .39 + 1.42, samplePose.angle));
      if (!sampleTip) continue;
      if (sample === trailStart) ctx.moveTo(sampleTip.x, sampleTip.y);
      else ctx.lineTo(sampleTip.x, sampleTip.y);
    }
    ctx.stroke();
    ctx.globalAlpha *= .58;
    ctx.lineWidth = Math.max(1, canvas.height * .0018);
    ctx.strokeStyle = '#f4fff0';
    ctx.beginPath();
    const highlightStart = Math.max(0, progress - .25);
    for (let sample = highlightStart; sample <= progress; sample += .035) {
      const samplePose = poseAt(sample);
      const sampleTip = projectCameraPoint(weaponLocalPoint(samplePose.origin, 0, .1, .39 + 1.42, samplePose.angle));
      if (!sampleTip) continue;
      if (sample === highlightStart) ctx.moveTo(sampleTip.x, sampleTip.y);
      else ctx.lineTo(sampleTip.x, sampleTip.y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function weaponReloadPose() {
  const definition = weaponDefinition();
  const active = state.weapon.reloadTimer > 0 && definition.reloadTime > 0;
  if (!active) return { active: false, progress: 0, lower: 0, offsetX: 0, offsetY: 0, roll: 0 };

  // Shotguns reload one shell at a time. Rewind the authored reload timeline
  // for each shell instead of stretching two frames across the whole magazine.
  const shellInterval = Math.max(.01, state.weapon.reloadShellInterval || .68);
  const shellProgress = clamp((state.weapon.reloadElapsed % shellInterval) / shellInterval, 0, .999999);
  const progress = state.weapon.type === 'shotgun'
    ? shellProgress
    : clamp(1 - state.weapon.reloadTimer / definition.reloadTime, 0, 1);
  return {
    active: true,
    progress,
    lower: 0,
    offsetX: 0,
    offsetY: 0,
    roll: 0,
  };
}

function drawDoomWeapon(now, type) {
  const moving = state.weapon.moving;
  const bob = moving ? Math.sin(state.weapon.bobPhase) * .022 : Math.sin(now / 650) * .008;
  const recoilKick = (state.weapon.recoil || 0) + (state.weapon.viewKick || 0) * .62 + (state.weapon.kickVelocity || 0) * .065;
  const introPose = weaponIntroPose();
  const w = canvas.width;
  const h = canvas.height;
  const reloadPose = weaponReloadPose();
  // Atlas sprites are positioned against the screen baseline. Add the intro
  // drop separately so the vertical weapon raise remains visible instead of
  // being cancelled by the local canvas translation.
  const atlasIntroDrop = h * introPose.lower * .16;
  // Keep the authored lower arms below the viewport without changing the
  // weapon's camera-local position during firing or reload.
  const center = {
    x: w * (.5 + introPose.sway * .045) + (state.weapon.kickX || 0) * w * .035 + Math.sin((state.weapon.lastFireAt || 0) * .01) * recoilKick * w * .018,
    y: h * (.73 + introPose.lower * .16 + recoilKick * .095) + bob * h + Math.sin(state.weapon.bobPhase * .5) * (state.weapon.moving ? h * .006 : h * .002),
  };
  // This save is deliberately outside the weapon transform. Previously the
  // firing rotation leaked into hit markers, damage effects, and post-process.
  ctx.save();
  ctx.translate(center.x, center.y);
  ctx.rotate(introPose.roll + (state.weapon.rollKick || 0) + Math.sin((state.weapon.lastFireAt || 0) * .013) * recoilKick * .045);
  const scale = Math.min(w, h) * .22;
  const pixel = Math.max(2, h * .004);
  ctx.lineJoin = 'bevel';
  ctx.lineCap = 'square';
  const fill = (x, y, width, height, color) => { ctx.fillStyle = color; ctx.fillRect(x * scale, y * scale, width * scale, height * scale); };
  const stroke = (x, y, width, height, color, line=pixel) => { ctx.strokeStyle = color; ctx.lineWidth = line; ctx.strokeRect(x * scale, y * scale, width * scale, height * scale); };
  if (type === 'stars') {
    // Heavy sidearm: squared receiver, dark grip, brass slide, front sight.
    fill(-.34, -.08, .68, .22, '#171819'); fill(-.28, -.14, .56, .09, '#4b5147');
    fill(-.15, .12, .3, .62, '#211916'); fill(-.11, .16, .22, .5, '#5b3828');
    fill(-.06, -.21, .12, .1, '#b48a42'); fill(.18, -.12, .12, .08, '#713b29');
    stroke(-.34, -.08, .68, .22, '#cf6d45');
  } else if (type === 'arsenal') {
    const arsenalActive = state.weapon.swing > 0;
    const arsenalProgress = arsenalActive ? clamp(1 - state.weapon.swing / weaponDefinition().duration, 0, 1) : 0;
    const arsenalFrame = reloadPose.active
      ? weaponAtlasFrameIndex('arsenal', reloadPose.progress, true)
      : arsenalActive ? weaponAtlasFrameIndex('arsenal', arsenalProgress) : 0;
    const arsenalSprite = weaponAtlasFrame('arsenal', arsenalFrame);
    if (arsenalSprite) {
      const aspect = (arsenalSprite.width || 1) / (arsenalSprite.height || 1);
      const imageHeight = Math.min(h * .66, w * .88 / aspect);
      const imageWidth = imageHeight * aspect;
      const imageTop = h * FIRST_PERSON_ATLAS_BOTTOM + atlasIntroDrop - center.y - imageHeight;
      ctx.imageSmoothingEnabled = false;
      // Use the native cell transform for the rifle. The authored firing
      // poses already contain their own recoil perspective; adding a screen
      // shear here makes frames 3/4 slide as their silhouettes widen.
      const pivotX = weaponAtlasPivotOffset('arsenal', arsenalFrame) * (imageWidth / 192);
      const drawX = -imageWidth / 2 + pivotX;
      // Frame 4 contains a larger left-edge intrusion in the supplied art.
      // Trim it with an angled boundary while retaining the lower receiver and
      // hands that belong to the authored firing pose.
      if (arsenalActive && !reloadPose.active && arsenalFrame === 3) {
        const clipDepth = imageWidth * .18;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(drawX + clipDepth, imageTop);
        ctx.lineTo(drawX + imageWidth, imageTop);
        ctx.lineTo(drawX + imageWidth, imageTop + imageHeight);
        ctx.lineTo(drawX, imageTop + imageHeight);
        ctx.lineTo(drawX + imageWidth * .08, imageTop + imageHeight * .5);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(arsenalSprite, drawX, imageTop, imageWidth, imageHeight);
        ctx.restore();
      } else {
        ctx.drawImage(arsenalSprite, drawX, imageTop, imageWidth, imageHeight);
      }
    } else {
      // Keep the carbine readable while its generated atlas is loading.
      fill(-.3, -.1, .6, .2, '#252824'); fill(-.19, -.2, .38, .09, '#72502f');
      fill(-.09, .1, .18, .63, '#2a211b'); fill(-.06, -.12, .12, .12, '#c28a3d');
      fill(-.03, -.83, .06, .54, '#895a31'); stroke(-.3, -.1, .6, .2, '#b14b32');
    }
  } else if (type === 'shotgun') {
    const shotgunActive = state.weapon.swing > 0;
    const shotgunProgress = shotgunActive ? clamp(1 - state.weapon.swing / weaponDefinition().duration, 0, 1) : 0;
    const shotgunFrame = reloadPose.active
      ? weaponAtlasFrameIndex('shotgun', reloadPose.progress, true)
      : shotgunActive ? weaponAtlasFrameIndex('shotgun', shotgunProgress) : 0;
    const shotgunSprite = weaponAtlasFrame('shotgun', shotgunFrame);
    if (shotgunSprite) {
      const aspect = (shotgunSprite.width || 1) / (shotgunSprite.height || 1);
      const imageHeight = Math.min(h * .66, w * .88 / aspect);
      const imageWidth = imageHeight * aspect;
      // Keep the authored lower arms below the viewport edge. The sprite
      // baseline is deliberately lower than the camera center.
      const imageBottom = h * FIRST_PERSON_ATLAS_BOTTOM + atlasIntroDrop - center.y;
      const imageTop = imageBottom - imageHeight;
      ctx.imageSmoothingEnabled = false;
      ctx.save();
      ctx.transform(1, 0.028, -0.018, 1, 0, 0);
      ctx.rotate(0.014);
      ctx.drawImage(shotgunSprite, -imageWidth / 2, imageTop, imageWidth, imageHeight);
      ctx.restore();
    } else {
      // Keep the pump readable while the authored atlas is loading.
      fill(-.38, -.1, .76, .22, '#202421'); fill(-.3, -.2, .6, .1, '#70432d');
      fill(-.13, .08, .26, .68, '#282019'); fill(-.08, .17, .16, .46, '#89562f');
      fill(-.22, -.35, .44, .12, '#905b35'); fill(-.1, -.76, .08, .42, '#b48a42'); fill(.02, -.76, .08, .42, '#b48a42');
      stroke(-.38, -.1, .76, .22, '#e68d5f');
    }
  } else if (type === 'bfg') {
    const launcherActive = state.weapon.swing > 0;
    const launcherProgress = launcherActive ? clamp(1 - state.weapon.swing / Math.max(.01, weaponDefinition().duration), 0, 1) : 0;
    const launcherFrame = reloadPose.active
      ? weaponAtlasFrameIndex('bfg', reloadPose.progress, true)
      : launcherActive ? weaponAtlasFrameIndex('bfg', launcherProgress) : 0;
    const launcherSprite = weaponAtlasFrame('bfg', launcherFrame);
    if (launcherSprite) {
      const aspect = (launcherSprite.width || 1) / (launcherSprite.height || 1);
      const imageHeight = Math.min(h * .68, w * .90 / aspect);
      const imageWidth = imageHeight * aspect;
      // The generated cells contain complete hands and forearms. Keep the
      // entire cell visible and place its baseline above the retro HUD.
      const imageBottom = h * FIRST_PERSON_ATLAS_BOTTOM + atlasIntroDrop - center.y;
      const imageTop = imageBottom - imageHeight;
      ctx.imageSmoothingEnabled = false;
      // Keep the Electric BFG orthographic as well. Its firing poses expand
      // toward both cell edges; even a small shear makes frames 3–5 look like
      // they translate instead of recoil in place.
      const pivotX = weaponAtlasPivotOffset('bfg', launcherFrame) * (imageWidth / 192);
      const drawX = -imageWidth / 2 + pivotX;
      ctx.drawImage(launcherSprite, drawX, imageTop, imageWidth, imageHeight);
    } else {
      // Safe fallback while the green-screen sheet is loading.
      fill(-.36, -.12, .72, .25, '#1c2725'); fill(-.29, -.2, .58, .1, '#31534a');
      fill(-.16, .1, .32, .68, '#202321'); fill(-.11, .17, .22, .47, '#3c493d');
      fill(-.31, -.03, .1, .34, '#3d9e82'); fill(.21, -.03, .1, .34, '#3d9e82');
      fill(-.18, -.35, .36, .1, '#b48a42'); fill(-.08, -.78, .16, .48, '#3d9e82');
      fill(-.025, -.84, .05, .58, '#effff7');
      stroke(-.36, -.12, .72, .25, '#58f4e4', pixel * 1.2);
    }
  } else {
    // Chainsaw: oversized motor housing, serrated bar, and red warning core.
    fill(-.38, -.05, .76, .36, '#29251f'); fill(-.3, -.14, .6, .14, '#82412e');
    fill(-.09, .28, .18, .34, '#211b18'); fill(-.62, -.08, .24, .12, '#9d6b35');
    fill(.38, -.08, .24, .12, '#9d6b35'); fill(-.04, -.2, .08, .14, '#db5c42');
    ctx.strokeStyle = '#d7a34e'; ctx.lineWidth = pixel * 1.5; ctx.beginPath(); ctx.moveTo(-.85*scale, -.02*scale); ctx.lineTo(.85*scale, -.02*scale); ctx.stroke();
    ctx.strokeStyle = '#db5c42'; ctx.lineWidth = pixel; for (let tooth=-7; tooth<=7; tooth+=1) { const x=tooth*.11*scale; ctx.beginPath(); ctx.moveTo(x, -.02*scale); ctx.lineTo(x+.045*scale, -.12*scale); ctx.stroke(); }
    if (state.mouseAttack) { ctx.globalAlpha = .45 + Math.sin(now/50)*.2; ctx.strokeStyle='#fff1b0'; ctx.shadowBlur=18; ctx.shadowColor='#db5c42'; ctx.beginPath(); ctx.arc(0, -.02*scale, .52*scale, Math.PI*.1, Math.PI*.9); ctx.stroke(); }
  }
  const flash = state.weapon.muzzleFlash || 0;
  if (flash > 0) {
    const definition = weaponDefinition();
    const duration = definition.muzzleDuration || .12;
    const strength = clamp(flash / duration, 0, 1);
    const color = definition.impactColor || '#f0d38f';
    const muzzleX = w * .5;
    const muzzleY = h * (type === 'bfg' ? .42 : type === 'shotgun' ? .46 : .49);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = .2 + strength * .72;
    ctx.translate(muzzleX, muzzleY);
    ctx.rotate((state.weapon.lastFireAt || 0) * .004);
    ctx.fillStyle = color;
    ctx.shadowBlur = 24;
    ctx.shadowColor = color;
    const radius = Math.max(8, h * (type === 'bfg' ? .075 : type === 'shotgun' ? .055 : .035)) * (.72 + strength * .35);
    ctx.beginPath();
    ctx.moveTo(0, -radius * 1.45); ctx.lineTo(radius * .42, -radius * .25); ctx.lineTo(radius * 1.15, 0);
    ctx.lineTo(radius * .34, radius * .28); ctx.lineTo(0, radius * 1.42); ctx.lineTo(-radius * .34, radius * .28);
    ctx.lineTo(-radius * 1.15, 0); ctx.lineTo(-radius * .42, -radius * .25); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = strength * .92;
    ctx.fillStyle = '#fff7d1';
    ctx.beginPath(); ctx.arc(0, 0, radius * .34, 0, TAU); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawWeapon(now) {
  if (!state.weapon.equipped) return;
  drawDoomWeapon(now, state.weapon.type);
}

function roundedRectPath(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  if (typeof context.roundRect === 'function') {
    context.roundRect(x, y, width, height, r);
    return;
  }
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}
function drawHeldScroll(now) { const width = canvas.width; const height = canvas.height; const reveal = easeOutCubic(state.readingElapsed / .72); const scrollWidth = Math.min(width * .58, 620); const scrollHeight = Math.min(height * .25, 210); const x = width * .5; const y = height * (.98 - reveal * .22) + Math.sin(now / 650) * 2; ctx.save(); ctx.translate(x, y); ctx.globalAlpha = .86; ctx.shadowBlur = 25; ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.fillStyle = '#9d7844'; ctx.beginPath(); roundedRectPath(ctx, -scrollWidth / 2 - 10, -scrollHeight / 2 - 10, scrollWidth + 20, scrollHeight + 20, 20); ctx.fill(); ctx.shadowBlur = 0; const paper = ctx.createLinearGradient(-scrollWidth / 2, 0, scrollWidth / 2, 0); paper.addColorStop(0, '#c5a46d'); paper.addColorStop(.5, '#ecd59e'); paper.addColorStop(1, '#b68d53'); ctx.fillStyle = paper; ctx.fillRect(-scrollWidth / 2, -scrollHeight / 2, scrollWidth, scrollHeight); ctx.fillStyle = 'rgba(77, 43, 18, .3)'; ctx.fillRect(-scrollWidth / 2 + 20, -scrollHeight / 2 + 22, scrollWidth - 40, 2); ctx.fillRect(-scrollWidth / 2 + 20, -scrollHeight / 2 + 38, scrollWidth * .63, 2); ctx.fillStyle = '#59391e'; ctx.font = `bold ${Math.max(12, scrollWidth / 30)}px Georgia`; ctx.textAlign = 'center'; ctx.fillText(state.reading?.title || 'CASE STUDY', 0, 5); ctx.fillStyle = '#6f4825'; ctx.fillRect(-scrollWidth / 2 - 17, -scrollHeight / 2 - 14, 18, scrollHeight + 28); ctx.fillRect(scrollWidth / 2 - 1, -scrollHeight / 2 - 14, 18, scrollHeight + 28); ctx.restore(); }
function drawAbilityWorldRing(centerWorld, radius, color, alpha, segments = 16, z = .58, phase = 0, lineWidth = 1) {
  const points = [];
  for (let index = 0; index <= segments; index += 1) {
    const angle = index / segments * TAU + phase;
    const point = projectCameraPoint(cameraPoint(centerWorld.x + Math.cos(angle) * radius, centerWorld.y + Math.sin(angle) * radius, z + Math.sin(angle * 3 + phase) * .08));
    if (point) points.push(point);
  }
  if (points.length < 2) return;
  ctx.beginPath();
  points.forEach((point, index) => { if (index === 0) ctx.moveTo(point.x, point.y); else ctx.lineTo(point.x, point.y); });
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.shadowBlur = 16;
  ctx.shadowColor = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}
function drawActiveAbilityEffects(now) {
  for (const effect of state.activeAbilityEffects) {
    const progress = clamp(effect.elapsed / effect.duration, 0, 1);
    const fade = Math.sin(Math.PI * progress);
    const color = effect.color || '#e7ad67';
    if (effect.kind === 'gate-key') {
      const gate = projectCameraPoint(cameraPoint(LOBBY_GATE.x, LOBBY_GATE.y, 1.05));
      if (!gate) continue;
      ctx.save();
      ctx.globalAlpha = .55 * (1 - progress);
      ctx.strokeStyle = color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = color;
      ctx.lineWidth = Math.max(1, canvas.height * .0015);
      ctx.beginPath(); ctx.arc(gate.x, gate.y, Math.max(4, canvas.height * (.01 + progress * .025)), 0, TAU); ctx.stroke();
      ctx.restore();
      continue;
    }
    if (effect.kind === 'beam' && effect.start && effect.end) {
      const start = projectCameraPoint(cameraPoint(effect.start.x, effect.start.y, effect.start.z));
      const end = projectCameraPoint(cameraPoint(effect.end.x, effect.end.y, effect.end.z));
      if (!start || !end) continue;
      ctx.save();
      ctx.globalAlpha = .56 * (1 - progress);
      ctx.lineCap = 'round';
      ctx.strokeStyle = color;
      ctx.shadowBlur = 9;
      ctx.shadowColor = color;
      ctx.lineWidth = Math.max(1, canvas.height * .0035 * (1 - progress));
      ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y); ctx.stroke();
      ctx.restore();
      continue;
    }
    if (effect.kind === 'chain' && effect.segments) {
      ctx.save();
      ctx.globalAlpha = .58 * (1 - progress);
      ctx.strokeStyle = color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = color;
      ctx.lineWidth = Math.max(1, canvas.height * .0028 * (1 - progress));
      for (const segment of effect.segments) {
        const start = projectCameraPoint(cameraPoint(segment.start.x, segment.start.y, segment.start.z));
        const end = projectCameraPoint(cameraPoint(segment.end.x, segment.end.y, segment.end.z));
        if (!start || !end) continue;
        ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y); ctx.stroke();
      }
      ctx.restore();
      continue;
    }
    const center = { x: state.player.x, y: state.player.y, z: .52 };
    const point = projectCameraPoint(cameraPoint(center.x, center.y, center.z));
    if (!point) continue;
    ctx.save();
    ctx.globalAlpha = .24 * fade;
    ctx.strokeStyle = color;
    ctx.shadowBlur = 8;
    ctx.shadowColor = color;
    ctx.lineWidth = Math.max(1, canvas.height * .0018);
    const radius = effect.kind === 'bloom' ? .7 * progress : effect.kind === 'echo' ? .52 * progress : .38 * progress;
    const screenRadius = Math.max(3, canvas.height * (.006 + radius * .006));
    ctx.beginPath(); ctx.arc(point.x, point.y, screenRadius, 0, TAU); ctx.stroke();
    if (effect.kind === 'bloom' || effect.kind === 'echo') {
      for (let mote = 0; mote < 4; mote += 1) {
        const angle = now / 700 + mote * TAU / 4;
        ctx.globalAlpha = .38 * fade;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(point.x + Math.cos(angle) * screenRadius, point.y + Math.sin(angle) * screenRadius, Math.max(1, canvas.height * .002), 0, TAU); ctx.fill();
      }
    }
    ctx.restore();
  }
}
function drawPickupFeedback() {
  const feedback = state.pickupFeedback;
  if (!feedback || state.pickupFeedbackTimer <= 0) return;
  const progress = clamp(state.pickupFeedbackTimer / 1.25, 0, 1);
  const alpha = Math.min(1, progress * 2.2);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.max(12, canvas.height * .022)}px "DM Mono", monospace`;
  ctx.fillStyle = feedback.color;
  ctx.shadowBlur = 12;
  ctx.shadowColor = feedback.color;
  ctx.fillText(`${feedback.label}  +${feedback.amount}`, canvas.width - 28, canvas.height * .18 - (1 - progress) * 16);
  ctx.restore();
}

function drawWeaponTraces(now) {
  for (const trace of state.weapon.shotTraces || []) {
    const progress = clamp(trace.life / trace.duration, 0, 1);
    const start = projectCameraPoint(cameraPoint(trace.x0, trace.y0, trace.z0));
    const end = projectCameraPoint(cameraPoint(trace.x1, trace.y1, trace.z1));
    if (!start || !end) continue;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = progress * (trace.hit ? .78 : .38);
    ctx.strokeStyle = trace.color;
    ctx.shadowBlur = trace.hit ? 12 : 6;
    ctx.shadowColor = trace.color;
    ctx.lineWidth = Math.max(1, canvas.height * (trace.hit ? .003 : .0015));
    ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y); ctx.stroke();
    if (trace.hit) {
      ctx.globalAlpha = progress * .9;
      ctx.fillStyle = '#fff4c2';
      ctx.beginPath(); ctx.arc(end.x, end.y, Math.max(2, canvas.height * .006 * progress), 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
}
function drawCombatVisor(now) {
  if (state.menuActive || state.reading || state.deathScreen) return;
  const width = canvas.width;
  const height = canvas.height;
  const minimum = Math.min(width, height);
  const pulse = state.weapon.shotPulse || 0;
  const damage = clamp(Math.max(state.damageFlash, state.rearHitEffect * .82), 0, 1.2);
  const intro = state.levelPreview;
  const introReady = intro ? weaponIntroPose().ready : 1;
  const accent = state.weapon.type === 'bfg' ? '#58f4e4' : '#b8ffcf';
  const edge = clamp(minimum * .035, 18, 42);
  const bracket = clamp(minimum * .05, 24, 56);
  const centerX = width / 2;
  const centerY = height / 2;

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';

  // A dark lens falloff at the perimeter makes the world feel viewed through
  // hardware. The middle stays clear so combat readability is not sacrificed.
  const lens = ctx.createRadialGradient(centerX, centerY, minimum * .2, centerX, centerY, Math.max(width, height) * .76);
  lens.addColorStop(0, 'rgba(0, 0, 0, 0)');
  lens.addColorStop(.56, 'rgba(1, 8, 10, .025)');
  lens.addColorStop(.82, `rgba(1, 7, 9, ${.1 + pulse * .035})`);
  lens.addColorStop(1, `rgba(0, 3, 5, ${.52 + damage * .16})`);
  ctx.fillStyle = lens;
  ctx.fillRect(0, 0, width, height);

  // Subtle tinted glass along the top and bottom edges, plus a restrained
  // horizontal scan response, sells the visor without covering the playfield.
  const glass = ctx.createLinearGradient(0, 0, 0, height);
  glass.addColorStop(0, `rgba(28, 126, 116, ${.055 + pulse * .025})`);
  glass.addColorStop(.16, 'rgba(16, 52, 53, 0)');
  glass.addColorStop(.84, 'rgba(16, 52, 53, 0)');
  glass.addColorStop(1, `rgba(9, 55, 57, ${.08 + pulse * .025})`);
  ctx.fillStyle = glass;
  ctx.fillRect(0, 0, width, height);

  const scanY = (now * .085) % (height + 40) - 20;
  ctx.globalAlpha = .035 + pulse * .025;
  ctx.fillStyle = accent;
  ctx.fillRect(edge, scanY, width - edge * 2, Math.max(1, height * .0014));

  // Fixed visor brackets are intentionally separate from enemy targeting. They
  // frame the screen like a helmet display instead of putting boxes on enemies.
  ctx.globalAlpha = (.16 + pulse * .12) * (intro ? .55 + introReady * .45 : 1);
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(1, height * .0012);
  ctx.shadowBlur = 7 + pulse * 8;
  ctx.shadowColor = accent;
  ctx.beginPath();
  ctx.moveTo(edge, edge + bracket); ctx.lineTo(edge, edge); ctx.lineTo(edge + bracket, edge);
  ctx.moveTo(width - edge - bracket, edge); ctx.lineTo(width - edge, edge); ctx.lineTo(width - edge, edge + bracket);
  ctx.moveTo(edge, height - edge - bracket); ctx.lineTo(edge, height - edge); ctx.lineTo(edge + bracket, height - edge);
  ctx.moveTo(width - edge - bracket, height - edge); ctx.lineTo(width - edge, height - edge); ctx.lineTo(width - edge, height - edge - bracket);
  ctx.stroke();

  // Directional hit feedback stays on the lens edge rather than becoming a
  // central flash or a target box.
  if (damage > 0) {
    const direction = state.damageDirection || 0;
    const hitX = width * (.5 + Math.sin(direction) * .68);
    const hitY = height * (.5 - Math.cos(direction) * .68);
    const hitEdge = ctx.createRadialGradient(hitX, hitY, 0, centerX, centerY, Math.max(width, height) * .76);
    hitEdge.addColorStop(0, `rgba(235, 48, 37, ${.2 * damage})`);
    hitEdge.addColorStop(.45, `rgba(194, 27, 28, ${.08 * damage})`);
    hitEdge.addColorStop(1, 'rgba(120, 10, 15, 0)');
    ctx.fillStyle = hitEdge;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.restore();
}
function drawWeaponReticle() {
  if (cinematicActive() || !state.weapon.equipped || state.reading) return;
  const pulse = state.weapon.shotPulse || 0;
  const spread = Math.max(3, canvas.height * (.006 + pulse * .018 + (state.weapon.moving ? .004 : 0)));
  const gap = spread * 1.7;
  const arm = Math.max(4, spread * .8);
  const color = state.aimTarget ? '#b8ffcf' : state.weapon.type === 'bfg' ? '#58f4e4' : '#f0d38f';
  ctx.save();
  ctx.globalAlpha = .42 + pulse * .36;
  ctx.strokeStyle = color;
  ctx.shadowBlur = 8 + pulse * 12;
  ctx.shadowColor = color;
  ctx.lineWidth = Math.max(1, canvas.height * .0018);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2 - gap - arm, canvas.height / 2); ctx.lineTo(canvas.width / 2 - gap, canvas.height / 2);
  ctx.moveTo(canvas.width / 2 + gap, canvas.height / 2); ctx.lineTo(canvas.width / 2 + gap + arm, canvas.height / 2);
  ctx.moveTo(canvas.width / 2, canvas.height / 2 - gap - arm); ctx.lineTo(canvas.width / 2, canvas.height / 2 - gap);
  ctx.moveTo(canvas.width / 2, canvas.height / 2 + gap); ctx.lineTo(canvas.width / 2, canvas.height / 2 + gap + arm);
  ctx.stroke();
  ctx.globalAlpha = .78 + pulse * .2;
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(canvas.width / 2, canvas.height / 2, Math.max(1.5, canvas.height * (.0018 + pulse * .003)), 0, TAU); ctx.fill();
  ctx.restore();
}

function drawEffects() {
  drawPickupFeedback();
  const damageIntensity = Math.max(state.damageFlash, state.rearHitEffect * .82);
  if (damageIntensity <= 0) return;

  // One restrained directional red hue: the strongest color sits on the edge
  // where the hit came from and falls away toward the center of the visor.
  const width = canvas.width;
  const height = canvas.height;
  const intensity = clamp(damageIntensity, 0, 1.2);
  const direction = state.damageDirection || 0;
  const sourceX = width * (.5 + Math.sin(direction) * .62);
  const sourceY = height * (.5 - Math.cos(direction) * .62);
  ctx.save();
  const incoming = ctx.createRadialGradient(sourceX, sourceY, 0, width * .5, height * .5, Math.max(width, height) * .72);
  incoming.addColorStop(0, `rgba(216, 28, 24, ${.56 * intensity})`);
  incoming.addColorStop(.2, `rgba(190, 24, 22, ${.28 * intensity})`);
  incoming.addColorStop(.58, `rgba(150, 18, 18, ${.08 * intensity})`);
  incoming.addColorStop(1, 'rgba(100, 8, 10, 0)');
  ctx.fillStyle = incoming;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}
function drawWorldPostProcess(now) {
  // Film-like contrast and sparse scanlines preserve the crunchy Doom-era
  // pixels while giving darker rooms a deeper, more cinematic atmosphere.
  const width = canvas.width;
  const height = canvas.height;
  ctx.save();
  const depthShade = ctx.createRadialGradient(width / 2, height * .48, height * .2, width / 2, height * .48, Math.max(width, height) * .82);
  depthShade.addColorStop(0, 'rgba(255, 236, 190, 0)');
  depthShade.addColorStop(.72, 'rgba(12, 8, 12, .018)');
  depthShade.addColorStop(1, 'rgba(5, 2, 8, .13)');
  ctx.fillStyle = depthShade;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = .035;
  ctx.fillStyle = state.room === SANCTUARY_ROOM_INDEX ? '#b8f0e2' : '#d45b42';
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = .055;
  ctx.fillStyle = '#080403';
  const scanStep = Math.max(3, Math.round(height / 180));
  for (let y = 0; y < height; y += scanStep * 2) ctx.fillRect(0, y, width, scanStep);
  ctx.restore();
}

function drawSectorStinger() {
  const stinger = state.sectorStinger;
  if (!stinger) return;
  const progress = clamp(stinger.elapsed / stinger.duration, 0, 1);
  const fade = progress < .16 ? progress / .16 : progress > .72 ? (1 - progress) / .28 : 1;
  const width = canvas.width;
  const height = canvas.height;
  const bar = Math.max(18, height * (.055 + fade * .035));
  ctx.save();
  ctx.fillStyle = `rgba(3, 2, 2, ${.9 * fade})`;
  ctx.fillRect(0, 0, width, bar);
  ctx.fillRect(0, height - bar, width, bar);
  ctx.globalAlpha = fade;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 14;
  ctx.shadowColor = stinger.room.color;
  ctx.fillStyle = '#f1dfad';
  ctx.font = `700 ${Math.max(17, height * .04)}px "Courier New", monospace`;
  ctx.fillText(stinger.room.title, width / 2, height * .5 - 5);
  ctx.shadowBlur = 0;
  ctx.fillStyle = stinger.room.color;
  ctx.font = `700 ${Math.max(9, height * .015)}px "Courier New", monospace`;
  ctx.fillText(`${stinger.room.level}  //  ${stinger.room.levelType.toUpperCase()}`, width / 2, height * .5 + Math.max(20, height * .048));
  ctx.restore();
}

function updateNarratorPortraitFrame(now) {
  updateNarratorTypewriter(now);
  if (!narratorPortrait || narratorPanel?.hidden) return;
  const expressionFrame = Number(narratorPortrait.dataset.expressionFrame || 0);
  const talking = narratorPortrait.dataset.talking === '1' && narratorPortrait.classList.contains('is-talking');
  const talkingFrames = narratorPanel?._narratorTalkingFrames || NARRATOR_TALKING_FRAMES;
  const frame = talking
    ? talkingFrames[Math.floor(now / 180) % talkingFrames.length]
    : (expressionFrame === 0 && now % 6200 > 5350 && now % 6200 < 5480 ? 3 : expressionFrame);
  drawNarratorPortrait(frame);
}

function drawScene(now) {
  const width = canvas.width;
  const height = canvas.height;
  const worldNow = state.reading ? state.readingWorldTime : now;
  updateNarratorPortraitFrame(now);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  if (state.shakeTime > 0) ctx.translate(Math.sin(worldNow * .09) * state.shakeTime * (settings.reducedMotion ? 2 : 7), Math.cos(worldNow * .11) * state.shakeTime * (settings.reducedMotion ? 1.5 : 5));
  try {
    drawBackground(width, height);
    drawRoomRoof(width, height);
  drawWalls(width, height);
  drawFloor(width, height);
  drawElevatedSetPieces();
  drawWorldRoute(worldNow);
  drawWorldObjects(worldNow);
  drawGroundHazards(worldNow);
  drawWorldProjectiles(worldNow);
  drawImpactBursts(worldNow);
  drawActiveAbilityEffects(worldNow);
  drawParticles();
  if (state.reading) drawHeldScroll(now);
  else if (!cinematicActive() || (state.levelPreview && ['weapon-lift', 'look-left', 'look-right', 'look-around', 'hud-flicker'].includes(state.levelPreview.phase))) drawWeapon(now);
  drawWeaponTraces(now);
  drawEffects();
  if (state.levelPreview) drawOpeningElevator3D(state.levelPreview, now);
  drawCombatVisor(now);
  drawWeaponReticle();
  drawLaunchTransition(now);
  drawLevelPreview();
  drawRouteOverview();
  drawBossTransition(now);
  drawMiniBossCutscene();
  drawWorldPostProcess(now);
  drawCinematicAtmosphere(now);
  drawSectorStinger();
    if (state.endingFade >= 0) { ctx.fillStyle = `rgba(255, 250, 225, ${clamp(state.endingFade, 0, 1)})`; ctx.fillRect(0, 0, width, height); }
  } finally {
    ctx.restore();
  }
  updateLobbyGuideHud();
  if (new URLSearchParams(window.location.search).has('debug-render')) {
    const sample = ctx.getImageData(Math.floor(width / 2), Math.floor(height / 2), 1, 1).data;
    document.title = `RENDER ${canvas.width}x${canvas.height} · ${sample[0]},${sample[1]},${sample[2]},${sample[3]} · room ${state.room}`;
  }
}

function updateCombatState(delta) {
  state.healthBarShake = Math.max(0, state.healthBarShake - delta);
  state.pickupFeedbackTimer = Math.max(0, state.pickupFeedbackTimer - delta);
  if (state.pickupFeedbackTimer <= 0) state.pickupFeedback = null;
  state.combatPulse = Math.max(0, state.combatPulse - delta * 3.8);
  state.combatPulseStrength = Math.max(0, state.combatPulseStrength - delta * 4.8);
  state.comboTimer = Math.max(0, state.comboTimer - delta);
  if (state.comboTimer <= 0) state.combo = 0;
}

function movePlayerBy(dx, dy) {
  if (canStand(state.player.x + dx, state.player.y)) state.player.x += dx;
  if (canStand(state.player.x, state.player.y + dy)) state.player.y += dy;
}

function updatePlayer(delta) {
  if (state.gameComplete || state.miniBossCutscene) return;
  recoverPlayerFromWall();
  updateCombatState(delta);
  if (state.keys.has('arrowleft')) state.player.angle -= TURN_SPEED * delta;
  if (state.keys.has('arrowright')) state.player.angle += TURN_SPEED * delta;

  if (state.room === 0 && state.guideControlsLocked) {
    state.weapon.moving = false;
    state.keys.delete('w'); state.keys.delete('a'); state.keys.delete('s'); state.keys.delete('d');
    return;
  }

  const sprinting = state.keys.has('shift');
  const speed = MOVE_SPEED * (sprinting ? 1.34 : 1) * delta;
  const angle = state.player.angle;
  let dx = 0;
  let dy = 0;
  if (state.keys.has('w')) { dx += Math.cos(angle) * speed; dy += Math.sin(angle) * speed; }
  if (state.keys.has('s')) { dx -= Math.cos(angle) * speed; dy -= Math.sin(angle) * speed; }
  if (state.keys.has('a')) { dx += Math.cos(angle - Math.PI / 2) * speed; dy += Math.sin(angle - Math.PI / 2) * speed; }
  if (state.keys.has('d')) { dx += Math.cos(angle + Math.PI / 2) * speed; dy += Math.sin(angle + Math.PI / 2) * speed; }
  movePlayerBy(dx, dy);
  state.player.angle = normalizeAngle(state.player.angle);
  state.weapon.moving = Math.abs(dx) + Math.abs(dy) > .001;
  noteLobbyPlayerMovement();
  state.weapon.bobPhase += delta * (state.weapon.moving ? (sprinting ? 12 : 8) : 2);
  state.footstepTimer -= delta;
  if (state.weapon.moving && state.footstepTimer <= 0) state.footstepTimer = sprinting ? .17 : .25;
  else if (!state.weapon.moving) state.footstepTimer = 0;
  updateRoomFromPlayer();
}

function damagePlayer(source, options = {}) {
  const showCombatFeedback = options.visual !== false;
  const baseDamage = Math.max(0, Number(options.damage ?? source?.damage ?? 0));
  const attackerName = source?.name || (options.projectile?.source === 'boss' ? 'The Archon' : 'Hostile signal');
  let amount = baseDamage;
  if (state.wardTimer > 0) amount *= .22;
  if (amount <= 0) return { blocked: true };

  state.player.hp -= amount;
  state.damageDirection = source && Number.isFinite(source.x) && Number.isFinite(source.y)
    ? normalizeAngle(Math.atan2(source.y - state.player.y, source.x - state.player.x) - state.player.angle)
    : 0;
  if (showCombatFeedback) {
    state.healthBarShake = settings.reducedMotion ? .14 : .34;
    state.damageFlash = 1.18;
    state.damageHudPulse = .8;
    state.damageSourceLabel = attackerName.toUpperCase().slice(0, 20);
    gameShell?.classList.add('damage-alert');
    state.shakeTime = settings.reducedMotion ? .16 : .62;
    state.combatPulse = .5;
    state.combatPulseStrength = .9;
    state.combatPulseColor = '#e44735';
    showHitMarker('DAMAGED', 'danger');
    showToast(`${attackerName} struck you.`, 'danger');
  }
  if (state.player.hp <= 12) {
    announceNarrator(
      'health-critical',
      'CRITICAL CONDITION',
      'Critical health. Break line of sight, reload, and keep Liam’s Document of Truth route alive.',
      'expression-worried',
      5,
      { duration: 4.5, priority: 10 },
    );
  } else if (state.player.hp <= 30) {
    announceNarrator(
      'health-low',
      'DAMAGE REPORT',
      'You took a hit. Find cover, reload, and keep moving toward Liam’s résumé.',
      'expression-worried',
      5,
      { duration: 4, priority: 5 },
    );
  }
  playHitSound();
  if (state.player.hp <= 0) {
    openDeathScreen(`${attackerName} brought you down.`);
  }
  updateHud();
  return { damaged: true };
}
function damageHostile(target, amount, options = {}) {
  if (!target || target.dead) return false;
  const showCombatFeedback = options.visual !== false;
  const damageStamp = Math.floor((performance.now?.() || 0) * 1000);
  if (target.lastDamageStamp === damageStamp) return false;
  target.lastDamageStamp = damageStamp;
  const baseAmount = Math.max(0, Number(amount || 0));
  const critChance = clamp(Number(options.critChance || 0), 0, .85);
  const critical = !target.boss && Math.random() < critChance;
  const multiplier = critical ? Number(options.critMultiplier || 1.7) : 1;
  const finalAmount = Math.max(1, Math.round(baseAmount * multiplier));
  if (target.boss && target.shield > 0) {
    const shieldDamage = Math.max(1, Math.round(finalAmount * .8));
    playEnemyShieldSound();
    target.shield = Math.max(0, target.shield - shieldDamage);
    if (showCombatFeedback) {
      target.hitTime = .28;
      target.hitFlash = .34;
      pushImpactBurst({ x: target.x, y: target.y, z: 1.4, elapsed: 0, duration: .52, color: '#c7f4e7', radius: 1.45 + (critical ? .2 : 0), style: 'shield' });
      if (state.now - shieldFeedbackAt > 360) { showHitMarker('SHIELDED', 'shielded'); shieldFeedbackAt = state.now; }
    } else {
      target.hitTime = 0;
      target.hitFlash = 0;
    }
    if (target.shield <= 0) {
      if (showCombatFeedback) {
        showHitMarker('SHIELD BREAK', 'hit');
        showToast('The Archon shield shatters.', 'good');
        state.shakeTime = settings.reducedMotion ? .16 : .5;
        spawnParticles(target.x, target.y, 1.3, ['#c7f4e7', '#fff1b0'], settings.reducedMotion ? 8 : 22, { speed: 1.8, life: .65, size: .7, upward: .55, spread: TAU, glow: 17, shape: 'rune' });
      }
    }
    return false;
  }
  target.hp = Math.max(0, Number(target.hp || target.maxHp || 0) - finalAmount);
  state.combatPerfUntil = Math.max(state.combatPerfUntil || 0, (state.now || performance.now()) + 180);
  if (showCombatFeedback) {
    target.hitTime = critical ? .62 : .5;
    target.hitFlash = critical ? .48 : .3;
    target.lastHitCritical = critical;
    target.hitShakeDirection = Math.random() < .5 ? -1 : 1;
  } else {
    target.hitTime = 0;
    target.hitFlash = 0;
    target.lastHitCritical = false;
  }
  target.alerted = true;
  const stagger = Number(options.stagger ?? options.stun ?? (options.source === 'ability' ? .18 : .14));
  if (stagger > 0) target.staggerTimer = Math.max(target.staggerTimer || 0, target.boss ? stagger * .35 : stagger);
  if (options.stun) target.stunTimer = Math.max(target.stunTimer || 0, options.stun);
  const direction = options.knockbackDirection || { x: target.x - state.player.x, y: target.y - state.player.y };
  const directionLength = Math.hypot(direction.x, direction.y) || 1;
  const knockback = target.boss ? 0 : Number(options.knockback || 0) * (critical ? 1.25 : 1);
  if (knockback > 0) {
    target.knockbackX = (target.knockbackX || 0) + direction.x / directionLength * knockback * 5.2;
    target.knockbackY = (target.knockbackY || 0) + direction.y / directionLength * knockback * 5.2;
  }
  const hitColor = options.color || (target.boss ? '#c7f4e7' : (target.color || '#d8c18b'));
  if (showCombatFeedback) {
    // Keep enemy silhouettes clean. Weapon recoil, muzzle flash, and world projectiles
    // communicate the hit; no projected rectangle, ring, spark cloud, or enemy shake.
    if (target.boss) state.shakeTime = Math.max(state.shakeTime, settings.reducedMotion ? .06 : (critical ? .2 : .08));
  }
  // Do not build Web Audio graphs for ordinary hits. The weapon report already
  // confirms the shot; extra hit sounds were the main rapid-fire hitch.
  if (options.silentAudio !== true && (target.boss || critical)) {
    const combatAudioNow = performance.now();
    if (combatAudioNow - lastCombatHitAudioAt >= 90) {
      lastCombatHitAudioAt = combatAudioNow;
      playBoneHitSound();
      playEnemyHurtSound(target);
    }
  }
  if (showCombatFeedback && critical) {
    showHitMarker('CRITICAL IMPACT', 'crit');
    if (target.boss) spawnParticles(target.x, target.y, hostileAimHeight(target), ['#fff1b0', hitColor], settings.reducedMotion ? 4 : 10, { speed: 1.2, life: .46, size: .5, upward: .2, spread: TAU, glow: 18, shape: 'star' });
  }
  if (target.hp <= 0) defeatHostile(target);
  return true;
}
function collectCombatPickup(item) {
  if (!item || item.recovered) return false;
  const definition = pickupDefinition(item.kind);
  if (item.kind === 'ammo-arsenal' || item.kind === 'ammo-shotgun' || item.kind === 'ammo-bfg') {
    const weaponType = item.kind === 'ammo-arsenal' ? 'arsenal' : item.kind === 'ammo-shotgun' ? 'shotgun' : 'bfg';
    state.weapon.reserveByType[weaponType] = (state.weapon.reserveByType[weaponType] || 0) + (item.amount || definition.amount);
    ensureWeaponAmmo(state.weapon.type);
  } else if (item.kind === 'ammo-pickup') {
    for (const type of Object.keys(WEAPON_LOADOUTS)) if (WEAPON_LOADOUTS[type].magazineSize) state.weapon.reserveByType[type] = (state.weapon.reserveByType[type] || 0) + Math.ceil(WEAPON_LOADOUTS[type].reserveAmmo * .12);
    ensureWeaponAmmo(state.weapon.type);
  } else return false;
  item.recovered = true;
  state.recoveredItems.add(item.id);
  const amount = item.amount || definition.amount;
  spawnParticles(item.x, item.y, .42, [definition.color, '#fff1b0'], settings.reducedMotion ? 5 : 11, { speed: .9, life: .55, size: .6, upward: .55, spread: TAU, glow: 12 });
  spawnPickupEffect(item.x, item.y, definition.color);
  playRecoverySound();
  showPickupFeedback(item, amount);
  showToast(`${definition.title} · +${amount}`, 'good');
  updateHud();
  return true;
}
function collectTouchItems() {
  const activeRoom = currentRoomIndex();
  for (const item of worldItems) {
    if (item.recovered || item.roomIndex !== activeRoom || !['ammo-pickup', 'ammo-arsenal', 'ammo-shotgun', 'ammo-bfg'].includes(item.kind)) continue;
    if (Math.hypot(item.x - state.player.x, item.y - state.player.y) <= .72) collectCombatPickup(item);
  }
}
function openDeathScreen(message) {
  if (state.deathScreen) return;
  state.deathScreen = { elapsed: 0, message };
  state.player.hp = 0;
  state.keys.clear();
  state.mouseAttack = false;
  state.mouseLook = false;
  state.projectiles = [];
  state.groundHazards = [];
  state.weapon.swing = 0;
  state.weapon.cooldown = 0;
  if (deathCause) deathCause.textContent = message;
  if (deathOverlay) { deathOverlay.hidden = false; deathOverlay.classList.add('is-visible'); }
  if (document.pointerLockElement === canvas) document.exitPointerLock?.();
  state.promptSignature = 'death';
  showToast('You fell. Restart the level when you are ready.', 'danger');
  playTone(46, .55, 'sawtooth', .045);
}
function resetCurrentLevel() {
  const roomIndex = state.room;
  const room = rooms[roomIndex];
  if (room?.id) state.miniBossIntroSeen.delete(room.id);
  state.miniBossCutscene = null;
  state.miniBossArena = null;
  const respawn = roomContentPoint(roomIndex, room.spawn.x, room.spawn.y);
  state.player.x = roomOffsets[roomIndex] + respawn.x;
  state.player.y = respawn.y;
  state.player.angle = room.spawn.angle;
  recoverPlayerFromWall(roomIndex);
  state.player.hp = 100;
  state.groundHazards = [];
  state.projectiles = [];
  state.explosionEffects = [];
  state.activeAbilityEffects = [];
  state.abilityCast = null;
  state.abilityCooldown = 0;
  state.combo = 0;
  state.comboTimer = 0;
  state.damageFlash = 0;
  state.rearHitEffect = 0;
  state.combatPulse = 0;
  state.combatPulseStrength = 0;
  state.combatTargetId = null;
  state.shakeTime = 0;
  state.weapon.swing = 0;
  state.weapon.cooldown = 0;
  state.weapon.reloadTimer = 0;
  state.weapon.muzzleFlash = 0;
  state.weapon.hit = false;
  state.weapon.attackDamage = 0;
  state.weapon.comboStep = 0;
  if (roomIndex === 0 && !directDungeonStart) {
    state.lobbyDeparted = false;
    if (LOBBY_GATE) for (const y of FOREST_HALL_ROWS) worldMap[y][Math.floor(LOBBY_GATE.x)] = '0';
    Object.assign(LOBBY_GUIDE, LOBBY_GUIDE_HOME, { yaw: Math.PI });
    state.guideMovementTriggered = false;
    state.guideDeferredRun = null;
    state.guideAutoTimer = -1;
    state.guideWaitingForWeapon = false;
    state.guideScrollInstructionStarted = false;
    state.guideIntroSpeechStarted = false;
    state.guideFarewellStarted = false;
    state.guideFarewellComplete = false;
    state.guideIntroPhase = 'look';
    state.guideIntroElapsed = 0;
    state.guideControlsLocked = true;
    state.guideWeaponCollected = false;
    state.guideWeaponReactionStarted = false;
    state.guideScrollReturnStarted = false;
    state.guideRun = null;
    clearLobbyGuideSpeech();
    state.guideSpeechLayout = null;
  }

  for (const item of worldItems) {
    if (item.roomIndex === roomIndex && !item.dropFromEnemy) item.recovered = false;
  }
  for (let index = worldItems.length - 1; index >= 0; index -= 1) {
    const item = worldItems[index];
    if (item.roomIndex === roomIndex && item.dropFromEnemy) {
      state.recoveredItems.delete(item.id);
      worldItems.splice(index, 1);
    }
  }
  const replacement = initialEnemyData.filter((enemy) => enemy.roomIndex === roomIndex).map((enemy) => ({ ...enemy, dropTemplates: [...(enemy.dropTemplates || [])] }));
  for (let index = worldEnemies.length - 1; index >= 0; index -= 1) if (worldEnemies[index].roomIndex === roomIndex) worldEnemies.splice(index, 1);
  worldEnemies.push(...replacement);
  if (roomIndex === FINAL_ROOM_INDEX) {
    state.finalBoss = createFinalBoss();
    state.finalBoss.alerted = true;
    state.doorOfLight = null;
    state.finalArenaTime = .01;
    setMusicMode('boss');
  } else {
    state.doorOfLight = null;
    setMusicMode('dungeon');
  }
  state.deathScreen = null;
  state.narratorSignal = null;
  if (narratorPanel) {
    narratorPanel.dataset.narratorEvent = '';
    narratorPanel.dataset.narratorLine = '';
    narratorPanel._narratorTarget = '';
    narratorPanel._narratorVisibleUntil = 0;
    narratorPanel.classList.remove('is-speaking');
  }
  if (narratorPortrait) {
    narratorPortrait.dataset.talking = '0';
    narratorPortrait.classList.remove('is-talking', 'is-transmitting');
  }
  if (deathOverlay) { deathOverlay.classList.remove('is-visible'); deathOverlay.hidden = true; }
  state.promptSignature = '';
  state.hudSignature = '';
  updateHud();
  showToast(`LEVEL RESTORED · ${room.title}`, 'good');
  playRecoverySound();
}
function deterministicDropAngle(target) {
  // Keep the reward close to the defeated hostile while making the placement
  // stable across renders and repeatable level resets.
  const signature = String(target?.id || target?.name || 'hostile');
  let hash = 0;
  for (let index = 0; index < signature.length; index += 1) hash = (hash * 31 + signature.charCodeAt(index)) >>> 0;
  return (hash / 0x100000000) * TAU;
}

function defeatHostile(target) {
  if (target.dead) return;
  state.kills += 1;
  state.weapon.kills = state.kills;
  target.dead = true;
  target.deathTime = 0;
  target.telegraph = null;
  spawnParticles(target.x, target.y, hostileAimHeight(target), [target.color || '#d8c18b', '#fff1b0'], settings.reducedMotion ? 5 : 14, { speed: 1.25, life: .58, size: .62, upward: .3, spread: TAU, glow: 12, shape: 'square' });
  playEnemyDeathSound(target);
  state.groundHazards = state.groundHazards.filter((hazard) => hazard.ownerId !== target.id);
  const dropAngle = deterministicDropAngle(target);
  const scrollDropPoint = findWalkableSpawnPoint(target.x, target.y, target.roomIndex);
  if (target.boss) {
    state.doorOfLight = { ...BOSS_EXIT_POINT, active: true, pulse: 0 };
    state.finalBoss.shield = 0;
    state.finalBoss.phase = 3;
    state.activeAbilityEffects.push({ kind: 'boss-death', elapsed: 0, duration: 2.2, color: '#fff4c5' });
    earnExperience(250, 'the Archon');
    announceNarrator(
      'archon-defeated',
      'ROUTE SECURED',
      'ARCHON DOWN. EXIT OPEN. MOVE EAST TO THE LIGHTWELL.',
      'expression-relieved',
      7,
      { duration: 9, priority: 12, force: true },
    );
    showToast('THE OPERATIONS ARCHON FALLS. THE DOOR OF LIGHT OPENS.', 'good');
    playLowThump(30, .72, .055);
    playNoiseSweep(.6, .03, 'lowpass', 520, 72, .12, .55);
  } else {
    if (target.miniBoss) {
      state.miniBossArena = { roomIndex: target.roomIndex, active: false, entranceClosed: true, exitOpen: true };
      announceNarrator(
        `mini-${target.id}-defeated`,
        'TARGET DOWN / EXIT OPEN',
        `${target.displayName || target.name} is down. The exit is open; continue through the archive toward Liam’s Document of Truth.`,
        'expression-relieved',
        7,
        { duration: 8, priority: 11, force: true },
      );
      setMiniBossDoors(target.roomIndex, true, true);
      showToast(`${target.displayName || target.name} defeated. EXIT OPEN.`, 'good');
    }
    const reward = target.kind === 'warden' ? 24 : target.kind === 'beast' ? 18 : 12;
    earnExperience(reward, target.displayName || target.name);
    const preferredSupplyPoint = findWalkableSpawnPoint(target.x - Math.cos(dropAngle) * .72, target.y - Math.sin(dropAngle) * .72, target.roomIndex, [scrollDropPoint]);
    const supplyPoint = canStand(preferredSupplyPoint.x, preferredSupplyPoint.y)
      ? preferredSupplyPoint
      : findWalkableSpawnPoint(target.x, target.y, target.roomIndex, [scrollDropPoint]);
    const supplySignature = String(target.id || '').split('').reduce((sum, character) => sum + character.charCodeAt(0), 0);
    // Every ordinary hostile pays out ammunition. The old deterministic table
    // allowed long fights to produce no visible reward at all. Rotate the
    // reward by enemy signature so rifle and shell supplies remain common while
    // BFG cells appear as a rarer but guaranteed periodic upgrade.
    const dropKind = supplySignature % 11 === 0
      ? 'ammo-bfg'
      : supplySignature % 3 === 0 ? 'ammo-shotgun' : 'ammo-arsenal';
    const dropAmount = dropKind === 'ammo-bfg' ? 2 : dropKind === 'ammo-shotgun' ? 10 : 45;
    const dropId = `supply-${target.roomIndex}-${target.id || target.name || state.kills}-${state.kills}`;
    worldItems.push(createCombatPickup(dropId, dropKind, supplyPoint.x, supplyPoint.y, target.roomIndex, {
      dropFromEnemy: true,
      amount: dropAmount,
      spawnedAt: performance.now(),
    }));
    spawnPickupEffect(supplyPoint.x, supplyPoint.y, pickupDefinition(dropKind).color);
    showToast(`${target.displayName || target.name} defeated · ${pickupDefinition(dropKind).title} DROPPED.`, 'good');
  }
  updateHud();
}

function enemyAttackStyle(enemy) {
  return enemyProfile(enemy).attackStyle || enemy.attackStyle || 'melee';
}

function enemyRoomBounds(enemy) {
  const roomStart = roomOffsets[enemy.roomIndex] ?? 0;
  const roomWidth = roomWidths[enemy.roomIndex] || WORLD_WIDTH;
  const roomHeight = roomHeights[enemy.roomIndex] || WORLD_HEIGHT;
  return {
    roomStart,
    minX: roomStart + 1,
    maxX: roomStart + roomWidth - 2,
    minY: 1,
    maxY: Math.min(WORLD_HEIGHT, roomHeight) - 2,
  };
}

function enemyCanStand(enemy, x, y) {
  const bounds = enemyRoomBounds(enemy);
  const margin = .22;
  if (x < bounds.roomStart + margin || x > bounds.roomStart + (roomWidths[enemy.roomIndex] || WORLD_WIDTH) - margin || y < margin || y > bounds.maxY + 1 - margin) return false;
  return canStand(x, y);
}

function enemyPathCell(enemy, x, y) {
  const bounds = enemyRoomBounds(enemy);
  return {
    x: clamp(Math.floor(x), bounds.minX, bounds.maxX),
    y: clamp(Math.floor(y), bounds.minY, bounds.maxY),
  };
}

function enemyPathCellKey(cell) {
  return `${cell.x}:${cell.y}`;
}

function enemyPathCellCenter(cell) {
  return { x: cell.x + .5, y: cell.y + .5 };
}

function enemyPathCellOpen(enemy, cell) {
  const bounds = enemyRoomBounds(enemy);
  if (cell.x < bounds.minX || cell.x > bounds.maxX || cell.y < bounds.minY || cell.y > bounds.maxY) return false;
  const center = enemyPathCellCenter(cell);
  return enemyCanStand(enemy, center.x, center.y);
}

function nearestEnemyPathCell(enemy, x, y) {
  const origin = enemyPathCell(enemy, x, y);
  if (enemyPathCellOpen(enemy, origin)) return origin;
  let best = null;
  for (let radius = 1; radius <= 7; radius += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      for (const dy of [-radius, radius]) {
        const cell = { x: origin.x + dx, y: origin.y + dy };
        if (!enemyPathCellOpen(enemy, cell)) continue;
        if (!best || Math.abs(cell.x - origin.x) + Math.abs(cell.y - origin.y) < best.distance) best = { cell, distance: Math.abs(cell.x - origin.x) + Math.abs(cell.y - origin.y) };
      }
    }
    for (let dy = -radius + 1; dy < radius; dy += 1) {
      for (const dx of [-radius, radius]) {
        const cell = { x: origin.x + dx, y: origin.y + dy };
        if (!enemyPathCellOpen(enemy, cell)) continue;
        if (!best || Math.abs(cell.x - origin.x) + Math.abs(cell.y - origin.y) < best.distance) best = { cell, distance: Math.abs(cell.x - origin.x) + Math.abs(cell.y - origin.y) };
      }
    }
    if (best) return best.cell;
  }
  return null;
}

function buildEnemyPath(enemy, targetX, targetY) {
  const start = nearestEnemyPathCell(enemy, enemy.x, enemy.y);
  const goal = nearestEnemyPathCell(enemy, targetX, targetY);
  if (!start || !goal) return [];
  const startKey = enemyPathCellKey(start);
  const goalKey = enemyPathCellKey(goal);
  if (startKey === goalKey) return [start];

  const queue = [start];
  const previous = new Map([[startKey, null]]);
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let found = false;
  let head = 0;
  while (head < queue.length && queue.length < 720) {
    const current = queue[head++];
    for (const [dx, dy] of directions) {
      const next = { x: current.x + dx, y: current.y + dy };
      const key = enemyPathCellKey(next);
      if (previous.has(key) || !enemyPathCellOpen(enemy, next)) continue;
      previous.set(key, current);
      queue.push(next);
      if (key === goalKey) { found = true; break; }
    }
    if (found) break;
  }
  if (!found) return [];

  const path = [];
  let current = goal;
  while (current) {
    path.push(current);
    current = previous.get(enemyPathCellKey(current));
  }
  return path.reverse();
}

function moveEnemy(enemy, dx, dy, amount, targetX = enemy.x + dx, targetY = enemy.y + dy) {
  const distance = Math.hypot(dx, dy);
  if (!Number.isFinite(distance) || distance < .0001 || amount <= 0) return false;
  const nx = dx / distance;
  const ny = dy / distance;
  const attempts = [
    [nx, ny, 1],
    [nx, 0, .98],
    [0, ny, .98],
    [-ny, nx, .9],
    [ny, -nx, .9],
    [nx * .7 - ny * .7, ny * .7 + nx * .7, .82],
    [nx * .7 + ny * .7, ny * .7 - nx * .7, .82],
  ];
  const currentTargetDistance = Math.hypot(enemy.x - targetX, enemy.y - targetY);
  let best = null;
  for (const [axisX, axisY, scale] of attempts) {
    const step = amount * scale;
    const nextX = enemy.x + axisX * step;
    const nextY = enemy.y + axisY * step;
    if (!enemyCanStand(enemy, nextX, nextY)) continue;
    const targetDistance = Math.hypot(nextX - targetX, nextY - targetY);
    const progress = currentTargetDistance - targetDistance;
    if (!best || progress > best.progress) best = { nextX, nextY, progress };
  }
  if (!best) return false;
  enemy.x = best.nextX;
  enemy.y = best.nextY;
  return true;
}

function enemyPathWaypoint(enemy, targetX, targetY) {
  const targetCell = nearestEnemyPathCell(enemy, targetX, targetY);
  if (!targetCell) return { x: targetX, y: targetY };
  const targetKey = enemyPathCellKey(targetCell);
  enemy.pathTimer = Math.max(0, (enemy.pathTimer || 0) - 1 / 60);
  if (!Array.isArray(enemy.path) || enemy.pathTimer <= 0 || enemy.pathTargetKey !== targetKey) {
    enemy.path = buildEnemyPath(enemy, targetX, targetY);
    enemy.pathTargetKey = targetKey;
    enemy.pathTimer = .2;
    enemy.pathIndex = 1;
  }
  if (!enemy.path.length) return { x: targetX, y: targetY };
  while (enemy.pathIndex < enemy.path.length - 1) {
    const center = enemyPathCellCenter(enemy.path[enemy.pathIndex]);
    if (Math.hypot(enemy.x - center.x, enemy.y - center.y) > .28) break;
    enemy.pathIndex += 1;
  }
  return enemyPathCellCenter(enemy.path[Math.min(enemy.pathIndex, enemy.path.length - 1)]);
}

function rangedProjectileSpec(enemy) {
  if (enemy.kind === 'insectoid') {
    return {
      kind: 'enemy-fireball',
      spriteSheet: 'enemyFireballProjectile',
      color: '#e85b39',
      radius: .2,
      speed: 4.05,
      // Presentation-only scale: collision radius remains .2 below.
      spriteWorldHeight: .84,
      spriteFps: 11,
      tone: 222,
    };
  }
  return {
    kind: 'enemy-plasma',
    spriteSheet: 'enemyPlasmaProjectile',
    color: '#36e0d0',
    radius: .15,
    speed: 4.65,
    // Presentation-only scale: collision radius remains .15 below.
    spriteWorldHeight: .72,
    spriteFps: 14,
    tone: 214,
  };
}

function fireEnemyRangedAttack(enemy) {
  const profile = enemyProfile(enemy);
  const dx = state.player.x - enemy.x;
  const dy = state.player.y - enemy.y;
  const distance = Math.hypot(dx, dy) || 1;
  const direction = { x: dx / distance, y: dy / distance };
  const projectile = rangedProjectileSpec(enemy);
  const origin = { x: enemy.x + direction.x * .42, y: enemy.y + direction.y * .42, z: profile.aimHeight };
  makeProjectile(projectile.kind, origin, {
    x: direction.x * projectile.speed,
    y: direction.y * projectile.speed,
    z: (EYE_HEIGHT - profile.aimHeight) * .22,
  }, {
    color: projectile.color,
    damage: enemy.damage,
    radius: projectile.radius,
    lifetime: 4.2,
    collisionHeight: .9,
    source: 'enemy',
    sourceId: enemy.id,
    spriteSheet: projectile.spriteSheet,
    spriteFrameCount: 8,
    spriteFps: projectile.spriteFps,
    spriteWorldHeight: projectile.spriteWorldHeight,
  });
  pushImpactBurst({ x: enemy.x, y: enemy.y, z: profile.aimHeight, elapsed: 0, duration: .28, color: projectile.color, radius: .32, style: 'cast' });
  playEnemyRangedSound(enemy);
}

function createGroundHazard(enemy) {
  const profile = enemyProfile(enemy);
  const radius = enemy.kind === 'quake' ? 1.62 : enemy.kind === 'crawler' ? 1.2 : 1.38;
  const hazard = {
    id: `hazard-${enemy.id}-${Math.floor(state.now)}-${Math.random().toString(16).slice(2)}`,
    ownerId: enemy.id,
    x: state.player.x,
    y: state.player.y,
    radius,
    elapsed: 0,
    warningDuration: enemy.kind === 'quake' ? .98 : .82,
    activeDuration: .48,
    active: false,
    hit: false,
    damage: enemy.damage,
    color: enemy.attackColor || profile.attackColor || enemy.color || '#d76b49',
    name: enemy.displayName || enemy.name,
  };
  state.groundHazards.push(hazard);
  enemy.telegraph = { type: 'ground', hazardId: hazard.id };
}

function updateGroundHazards(delta) {
  const active = [];
  for (const hazard of state.groundHazards) {
    hazard.elapsed += delta;
    if (!hazard.active && hazard.elapsed >= hazard.warningDuration) {
      hazard.active = true;
      pushImpactBurst({ x: hazard.x, y: hazard.y, z: .045, elapsed: 0, duration: .38, color: hazard.color, radius: hazard.radius, style: 'ground-impact' });
    }
    if (hazard.active && !hazard.hit && Math.hypot(state.player.x - hazard.x, state.player.y - hazard.y) <= hazard.radius + .18) {
      hazard.hit = true;
      damagePlayer({ name: hazard.name, damage: hazard.damage }, { ground: true, hazard });
    }
    if (hazard.elapsed < hazard.warningDuration + hazard.activeDuration) active.push(hazard);
    else {
      for (const enemy of worldEnemies) if (enemy.telegraph?.hazardId === hazard.id) enemy.telegraph = null;
    }
  }
  state.groundHazards = active;
}

function drawProjectedWorldRing(centerWorld, radius, color, alpha = .8, segments = 20, z = .04, lineWidth = 2, dashed = false) {
  if (!centerWorld || !Number.isFinite(radius)) return;
  const points = [];
  for (let index = 0; index <= segments; index += 1) {
    const angle = index / segments * TAU;
    const point = projectCameraPoint(cameraPoint(centerWorld.x + Math.cos(angle) * radius, centerWorld.y + Math.sin(angle) * radius, z));
    if (point) points.push(point);
  }
  if (points.length < 2) return;
  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.shadowBlur = Math.min(14, lineWidth * 4);
  ctx.shadowColor = color;
  if (dashed) ctx.setLineDash([Math.max(4, lineWidth * 4), Math.max(3, lineWidth * 2.5)]);
  ctx.beginPath();
  points.forEach((point, index) => { if (index === 0) ctx.moveTo(point.x, point.y); else ctx.lineTo(point.x, point.y); });
  ctx.stroke();
  ctx.restore();
}

function drawGroundHazards(now) {
  for (const hazard of state.groundHazards) {
    const center = projectCameraPoint(cameraPoint(hazard.x, hazard.y, .05));
    if (!center) continue;
    if (!hazard.active) continue;
    const pulse = .86 + Math.sin(now / 100 + hazard.x) * .12;
    drawProjectedWorldRing({ x: hazard.x, y: hazard.y }, hazard.radius, hazard.color, .9 * pulse, 24, .035, Math.max(1, canvas.height * .004));
    drawProjectedWorldRing({ x: hazard.x, y: hazard.y }, hazard.radius * .9, '#f5d59b', .74, 8, .048, Math.max(1, canvas.height * .002));
    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate(now / 210);
    ctx.globalAlpha = .9;
    ctx.strokeStyle = hazard.color;
    ctx.fillStyle = 'rgba(215, 118, 73, .18)';
    ctx.lineWidth = Math.max(1, canvas.height * .003);
    ctx.beginPath();
    ctx.moveTo(0, -Math.max(7, canvas.height * .018));
    ctx.lineTo(Math.max(6, canvas.height * .015), Math.max(5, canvas.height * .012));
    ctx.lineTo(-Math.max(6, canvas.height * .015), Math.max(5, canvas.height * .012));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(3, canvas.height * .009), 0, TAU);
    ctx.stroke();
    ctx.restore();
  }
}

function enemySeparationVector(enemy) {
  let x = 0;
  let y = 0;
  for (const other of worldEnemies) {
    if (other === enemy || other.dead || other.roomIndex !== enemy.roomIndex) continue;
    const dx = enemy.x - other.x;
    const dy = enemy.y - other.y;
    const distance = Math.hypot(dx, dy);
    if (distance > 1.05 || distance < .001) continue;
    const weight = (1.05 - distance) / 1.05;
    x += dx / distance * weight;
    y += dy / distance * weight;
  }
  return { x, y };
}

function updateEnemies(delta) {
  if (state.miniBossCutscene) return;
  if (state.reading || state.menuActive || state.gameComplete) return;
  for (const enemy of worldEnemies) {
    const profile = enemyProfile(enemy);
    const attackStyle = enemyAttackStyle(enemy);
    enemy.attackStyle = attackStyle;
    enemy.animationTime = (enemy.animationTime || 0) + delta;
    enemy.moving = false;
    if (enemy.dead) { enemy.deathTime += delta; continue; }
    if (enemy.roomIndex !== state.room && !enemy.boss) continue;

    enemy.cooldown = Math.max(0, enemy.cooldown - delta);
    enemy.hitTime = Math.max(0, enemy.hitTime - delta);
    enemy.hitFlash = Math.max(0, (enemy.hitFlash || 0) - delta);
    enemy.staggerTimer = Math.max(0, (enemy.staggerTimer || 0) - delta);
    enemy.stunTimer = Math.max(0, (enemy.stunTimer || 0) - delta);
    enemy.pathTimer = Math.max(0, (enemy.pathTimer || 0) - delta);
    if (!enemy.orbitDirection) enemy.orbitDirection = (String(enemy.id || '').charCodeAt(0) || 1) % 2 ? 1 : -1;
    enemy.repositionTimer = Math.max(0, (enemy.repositionTimer || 0) - delta);

    const recoilX = enemy.knockbackX || 0;
    const recoilY = enemy.knockbackY || 0;
    if (Math.abs(recoilX) + Math.abs(recoilY) > .01) {
      if (enemyCanStand(enemy, enemy.x + recoilX * delta, enemy.y)) enemy.x += recoilX * delta;
      if (enemyCanStand(enemy, enemy.x, enemy.y + recoilY * delta)) enemy.y += recoilY * delta;
      enemy.knockbackX = recoilX * Math.pow(.035, delta);
      enemy.knockbackY = recoilY * Math.pow(.035, delta);
    }
    if (enemy.stunTimer > 0 || enemy.staggerTimer > 0) continue;

    if (enemy.attackTime > 0) {
      const previous = enemy.attackTime;
      const attackDuration = Math.max(.01, enemy.telegraph?.duration || enemy.attackTime);
      enemy.attackTime = Math.max(0, enemy.attackTime - delta);
      if (enemy.telegraph) enemy.telegraph.elapsed = (enemy.telegraph.elapsed || 0) + delta;
      if (enemy.attackStyle === 'melee' && enemy.attackLungeDistance > 0) {
        const attackProgress = clamp(1 - enemy.attackTime / attackDuration, 0, 1);
        const lungeProgress = Math.sin(Math.PI * clamp(attackProgress / .72, 0, 1));
        const targetAngle = Math.atan2((enemy.attackTargetY ?? state.player.y) - enemy.attackStartY, (enemy.attackTargetX ?? state.player.x) - enemy.attackStartX);
        const desiredX = enemy.attackStartX + Math.cos(targetAngle) * enemy.attackLungeDistance * lungeProgress;
        const desiredY = enemy.attackStartY + Math.sin(targetAngle) * enemy.attackLungeDistance * lungeProgress;
        if (enemyCanStand(enemy, desiredX, enemy.y)) enemy.x = desiredX;
        if (enemyCanStand(enemy, enemy.x, desiredY)) enemy.y = desiredY;
      }
      if (!enemy.attackHit && previous > .25 && enemy.attackTime <= .25) {
        enemy.attackHit = true;
        const impactDistance = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y);
        if (enemyAttackStyle(enemy) === 'melee' && impactDistance <= (profile.attackDistance || ENEMY_ATTACK_DISTANCE) + .2) damagePlayer(enemy, { damage: enemy.damage });
        else if (enemyAttackStyle(enemy) === 'ranged') fireEnemyRangedAttack(enemy);
        else if (enemyAttackStyle(enemy) === 'ground') createGroundHazard(enemy);
        enemy.telegraph = null;
      }
      continue;
    }

    const dx = state.player.x - enemy.x;
    const dy = state.player.y - enemy.y;
    const distance = Math.hypot(dx, dy);
    const reach = profile.attackDistance || ENEMY_ATTACK_DISTANCE;
    enemy.alerted = true;
    enemy.walkPhase += delta * (distance < reach + 1 ? 9 : 5) * profile.speedMultiplier;

    const slow = state.enemySlowTimer > 0 ? .38 : 1;
    const preferredDistance = profile.preferredDistance || reach;
    const shouldClose = attackStyle === 'melee' ? distance > reach - .12 : distance > preferredDistance + .35;
    const shouldRetreat = attackStyle !== 'melee' && distance < Math.max(2.1, preferredDistance - 1.15);
    if (shouldClose || shouldRetreat) {
      const waypoint = enemyPathWaypoint(enemy, state.player.x, state.player.y);
      const separation = enemySeparationVector(enemy);
      const lateral = attackStyle === 'ranged' && !shouldRetreat
        ? { x: -dy * enemy.orbitDirection, y: dx * enemy.orbitDirection }
        : { x: 0, y: 0 };
      const baseDirection = shouldRetreat ? { x: -dx, y: -dy } : { x: waypoint.x - enemy.x, y: waypoint.y - enemy.y };
      const moveDirection = {
        x: baseDirection.x + separation.x * .95 + lateral.x * .24,
        y: baseDirection.y + separation.y * .95 + lateral.y * .24,
      };
      const sprint = enemy.kind === 'zombie' && distance > 3.2 ? 1.18 : 1;
      const moved = moveEnemy(enemy, moveDirection.x, moveDirection.y, enemy.speed * profile.speedMultiplier * sprint * slow * delta, shouldRetreat ? enemy.x - dx : waypoint.x, shouldRetreat ? enemy.y - dy : waypoint.y);
      enemy.moving = moved;
      if (!moved && !shouldRetreat) {
        enemy.pathTimer = 0;
        const sprint = enemy.kind === 'zombie' && distance > 3.2 ? 1.18 : 1;
        enemy.moving = moveEnemy(enemy, dx, dy, enemy.speed * profile.speedMultiplier * sprint * slow * delta, state.player.x, state.player.y);
      }
    }

    const distanceAfterMove = Math.hypot(state.player.x - enemy.x, state.player.y - enemy.y);
    const canAttack = attackStyle === 'melee'
      ? distanceAfterMove <= reach
      : distanceAfterMove <= reach && hasLineOfSight(enemy.x, enemy.y, state.player.x, state.player.y);
    const attackPhase = ((String(enemy.id || '').split('').reduce((sum, character) => sum + character.charCodeAt(0), 0) % 7) * .055);
    if (canAttack && enemy.cooldown <= 0 && enemy.animationTime % 1.1 >= attackPhase) {
      enemy.attackTime = profile.attackDuration || (attackStyle === 'melee' ? .48 : .58);
      enemy.attackHit = false;
      enemy.attackStartX = enemy.x;
      enemy.attackStartY = enemy.y;
      enemy.attackTargetX = state.player.x;
      enemy.attackTargetY = state.player.y;
      enemy.attackLungeDistance = attackStyle === 'melee' ? Math.min(.48, Math.max(.18, reach * .22)) : 0;
      enemy.cooldown = (attackStyle === 'melee' ? (enemy.kind === 'zombie' ? .72 : .84) : 1.18) / enemyAttackRate(enemy);
      enemy.attackStyle = attackStyle;
      enemy.telegraph = attackStyle === 'ranged'
        ? { type: 'ranged', targetX: state.player.x, targetY: state.player.y, targetZ: EYE_HEIGHT, duration: enemy.attackTime, elapsed: 0 }
        : attackStyle === 'ground'
          ? { type: 'ground', targetX: state.player.x, targetY: state.player.y, radius: enemy.kind === 'quake' ? 1.62 : enemy.kind === 'crawler' ? 1.2 : 1.38, duration: enemy.attackTime, elapsed: 0 }
          : { type: 'melee', targetX: state.player.x, targetY: state.player.y, duration: enemy.attackTime, elapsed: 0 };
      if (attackStyle === 'ranged') playEnemyRangedSound(enemy);
      else if (attackStyle === 'ground') playEnemyGroundSound(enemy);
      else playEnemyMeleeSound(enemy);
    }
  }
  updateBoss(delta);
  updateHud();
}
function bossPhaseForHp(boss) {
  const ratio = boss.hp / boss.maxHp;
  return ratio <= .33 ? 3 : ratio <= .66 ? 2 : 1;
}
function spawnBossPattern(kind, boss, count, speed, color, damage, options = {}) {
  const targetX = options.targetX ?? state.player.x;
  const targetY = options.targetY ?? state.player.y;
  const baseAngle = Math.atan2(targetY - boss.y, targetX - boss.x);
  for (let index = 0; index < count; index += 1) {
    const angle = baseAngle + (index - (count - 1) / 2) * (options.spread || .18);
    const origin = { x: boss.x + Math.cos(angle) * .55, y: boss.y + Math.sin(angle) * .55, z: options.z || 1.15 };
    makeProjectile(kind, origin, { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed, z: options.vz || 0 }, { color, damage, radius: options.radius || .14, lifetime: options.lifetime || 4, source: 'boss', sourceId: boss.id, collisionHeight: options.collisionHeight || 1.2, aoe: options.aoe || 0 });
  }
}
function bossAttackDuration(boss, pattern) {
  if (pattern === 3) return boss.phase === 3 ? 1.05 : .86;
  return boss.phase === 3 ? .68 : .82;
}
function bossAttackLabel(boss, pattern) {
  if (pattern === 0) return 'ARC BOLTS';
  if (pattern === 1) return 'LATTICE RING';
  if (pattern === 2) return 'CORE DASH';
  if (pattern === 3) return 'LATTICE SHIELD';
  return 'DELIVERY SALVO';
}
function executeBossPattern(boss, pattern, telegraph) {
  playBossAttackSound(pattern, boss.phase);
  const targetX = telegraph?.targetX ?? state.player.x;
  const targetY = telegraph?.targetY ?? state.player.y;
  if (pattern === 0) {
    spawnBossPattern('boss-bolt', boss, boss.phase === 3 ? 7 : 4, boss.phase === 3 ? 5.35 : 4.55, boss.phase === 3 ? '#f6e3a5' : '#d99762', boss.phase === 3 ? 18 : 13, { spread: boss.phase === 3 ? .16 : .2, z: 1.22, targetX, targetY });
  } else if (pattern === 1) {
    const count = boss.phase === 3 ? 14 : boss.phase === 2 ? 10 : 7;
    for (let index = 0; index < count; index += 1) {
      const angle = index / count * TAU + boss.pulse * .25;
      makeProjectile('boss-ring', { x: boss.x, y: boss.y, z: .75 }, { x: Math.cos(angle) * (boss.phase === 3 ? 5.1 : 4.05), y: Math.sin(angle) * (boss.phase === 3 ? 5.1 : 4.05), z: 0 }, { color: boss.phase === 2 ? '#77a9e8' : '#d99762', damage: boss.phase === 3 ? 15 : 10, radius: .12, lifetime: 3.3, source: 'boss', sourceId: boss.id, collisionHeight: .45 });
    }
  } else if (pattern === 2) {
    boss.dashTime = .7;
    const direction = Math.atan2(targetY - boss.y, targetX - boss.x);
    const nextX = boss.x + Math.cos(direction) * 2.2;
    const nextY = boss.y + Math.sin(direction) * 2.2;
    if (canStand(nextX, nextY)) { boss.x = nextX; boss.y = nextY; }
    pushImpactBurst({ x: boss.x, y: boss.y, z: 1, elapsed: 0, duration: .8, color: '#e9e9e0', radius: 1.2, style: 'boss-dash' });
    // The dash is a committed reposition rather than a free teleport: only
    // punish the player when the landing point actually overlaps them.
    if (Math.hypot(state.player.x - boss.x, state.player.y - boss.y) <= 1.55) {
      damagePlayer(boss, { damage: boss.phase === 3 ? 22 : 16 });
    }
  } else if (pattern === 3) {
    boss.shield = Math.max(boss.shield, boss.phase === 3 ? 52 : 38);
    state.activeAbilityEffects.push({ kind: 'boss-shield', elapsed: 0, duration: 1.1, color: '#9debdc' });
    announceNarrator(
      `archon-shield-${boss.phase}`,
      'LATTICE SHIELD',
      'The Archon raised a lattice shield. Break it first, then keep pressure on the core.',
      'expression-focused',
      8,
      { duration: 4.2, priority: 7 },
    );
    showToast('THE ARCHON RAISES A LATTICE SHIELD.', 'danger');
  } else {
    spawnBossPattern('boss-bolt', boss, 8, 3.8, '#c58de6', 14, { spread: .42, z: 1.75, lifetime: 3.5, targetX, targetY });
  }
}
function archonOwnedAliveCount(boss) {
  const owned = new Set(boss.summonIds || []);
  return worldEnemies.filter((enemy) => owned.has(enemy.id) && !enemy.dead).length;
}
function archonWaveRemaining(boss) {
  const currentIds = new Set(boss.waveIds || []);
  return worldEnemies.filter((enemy) => currentIds.has(enemy.id) && !enemy.dead).length;
}
function spawnArchonWaveUnit(boss, entry) {
  const occupied = worldEnemies.filter((enemy) => !enemy.dead && enemy.roomIndex === FINAL_ROOM_INDEX).map((enemy) => ({ x: enemy.x, y: enemy.y }));
  occupied.push({ x: boss.x, y: boss.y }, { x: state.player.x, y: state.player.y });
  const point = ARCHON_WAVE_SPAWN_POINTS[boss.waveSpawnCursor % ARCHON_WAVE_SPAWN_POINTS.length];
  boss.waveSpawnCursor += 1;
  const requestedX = FINAL_ROOM_OFFSET + point.x;
  const requestedY = point.y;
  const spawnPoint = findWalkableSpawnPoint(requestedX, requestedY, FINAL_ROOM_INDEX, occupied);
  if (!isClearForSpawn(spawnPoint.x, spawnPoint.y, .34)) return false;
  const id = `archon-wave-${boss.waveIndex}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const ranged = entry.kind === 'soldier' || entry.kind === 'insectoid';
  worldEnemies.push({
    id,
    name: entry.kind === 'soldier' ? 'Archive Rifleman' : entry.kind === 'insectoid' ? 'Archive Stinger' : 'Archive Runner',
    displayName: entry.kind === 'soldier' ? 'Archive Rifleman' : entry.kind === 'insectoid' ? 'Archive Stinger' : 'Archive Runner',
    kind: entry.kind,
    archetype: entry.kind,
    attackStyle: ranged ? 'ranged' : 'melee',
    x: spawnPoint.x,
    y: spawnPoint.y,
    roomIndex: FINAL_ROOM_INDEX,
    hp: Math.round(entry.hp * 1.35),
    maxHp: Math.round(entry.hp * 1.35),
    speed: entry.speed,
    damage: entry.damage,
    color: entry.color,
    cooldown: ranged ? .7 : .55,
    attackTime: 0,
    attackHit: false,
    hitTime: 0,
    hitFlash: 0,
    walkPhase: Math.random() * 5,
    alerted: true,
    dead: false,
    deathTime: 0,
    dropTemplates: [],
    bossWave: true,
    bossOwnerId: boss.id,
  });
  boss.waveIds.push(id);
  boss.summonIds.push(id);
  return true;
}
function startArchonWave(boss, waveNumber) {
  const wave = ARCHON_WAVES[waveNumber - 1];
  if (!wave || boss.dead) return;
  boss.waveIndex = waveNumber;
  boss.waveState = 'arming';
  boss.waveActive = true;
  boss.waveTimer = waveNumber === 1 ? .8 : 1.15;
  boss.waveCooldown = 0;
  boss.waveEnemiesRemaining = wave.entries.length;
  boss.waveSpawnQueue = wave.entries.map((entry) => ({ ...entry }));
  boss.waveSpawnTimer = .15;
  boss.waveSpawnCursor = waveNumber * 2;
  boss.waveIds = [];
  announceNarrator(
    `archon-wave-${waveNumber}`,
    `SUPPORT WAVE ${waveNumber}`,
    `${boss.displayName} is calling reinforcements. Break the support wave, then return fire on the Archon; Liam’s résumé is beyond this fight.`,
    'expression-command',
    10,
    { duration: 5.5, priority: 8, force: true },
  );
  showToast(`WAVE ${waveNumber} / ${ARCHON_WAVES.length} · ${wave.label}`, 'danger');
  playLowThump(waveNumber === 3 ? 42 : 52, .28, .035);
}
function updateArchonWave(delta, boss) {
  if (boss.waveState === 'idle') startArchonWave(boss, 1);
  if (boss.waveState === 'arming') {
    boss.waveTimer -= delta;
    if (boss.waveTimer > 0) return true;
    boss.waveState = 'active';
    showToast(`WAVE ${boss.waveIndex} LIVE · BREAK THE SUPPORT RING.`, 'danger');
  }
  if (boss.waveState === 'cleared') {
    if (boss.waveIndex < ARCHON_WAVES.length && boss.waveCooldown <= 0) {
      startArchonWave(boss, boss.waveIndex + 1);
      return true;
    }
    // After the last support ring, leave the Archon active. The short recovery
    // window is the reward for clearing the encounter, not a victory pause.
    if (boss.waveIndex >= ARCHON_WAVES.length && boss.waveCooldown <= 0) {
      boss.waveState = 'final';
      boss.waveActive = false;
      showToast('THE SUPPORT RING IS BROKEN · FINISH THE ARCHON.', 'good');
      return false;
    }
    return true;
  }
  if (boss.waveState !== 'active') return false;
  boss.waveSpawnTimer -= delta;
  if (boss.waveSpawnQueue.length && boss.waveSpawnTimer <= 0 && archonOwnedAliveCount(boss) < ARCHON_WAVE_MAX_ALIVE) {
    const entry = boss.waveSpawnQueue.shift();
    if (!spawnArchonWaveUnit(boss, entry)) boss.waveSpawnQueue.unshift(entry);
    boss.waveSpawnTimer = .42;
  }
  boss.waveEnemiesRemaining = archonWaveRemaining(boss) + boss.waveSpawnQueue.length;
  if (!boss.waveSpawnQueue.length && boss.waveEnemiesRemaining <= 0) {
    boss.waveState = 'cleared';
    boss.waveActive = false;
    boss.waveCooldown = 1.35;
    showToast(`WAVE ${boss.waveIndex} CLEARED · THE ARCHON IS EXPOSED.`, 'good');
    playLowThump(64, .2, .026);
  }
  return false;
}
function updateBoss(delta) {
  const boss = state.finalBoss;
  if (!boss || state.room !== FINAL_ROOM_INDEX || state.gameComplete) return;
  boss.pulse += delta * (boss.phase === 3 ? 2.4 : 1.4);
  if (boss.dead) { boss.deathTime += delta; return; }
  boss.hitTime = Math.max(0, boss.hitTime - delta);
  boss.hitFlash = Math.max(0, (boss.hitFlash || 0) - delta);
  boss.staggerTimer = Math.max(0, (boss.staggerTimer || 0) - delta);
  boss.stunTimer = Math.max(0, (boss.stunTimer || 0) - delta);
  boss.waveCooldown = Math.max(0, boss.waveCooldown - delta);

  const nextPhase = bossPhaseForHp(boss);
  if (nextPhase !== boss.phase) {
    boss.phase = nextPhase;
    boss.shield = nextPhase === 2 ? 58 : nextPhase === 3 ? 76 : 0;
    boss.attackTelegraph = null;
    boss.cooldown = .72;
    announceNarrator(
      `archon-phase-${nextPhase}`,
      BOSS_PHASES[nextPhase - 1].name,
      nextPhase === 3
        ? 'The Archon is collapsing. Hold your ground, finish the delivery, and reach Liam’s résumé beyond the lightwell.'
        : 'The Archon has changed pattern. Read the opening, break the phase, and keep Liam’s document route clear.',
      nextPhase === 3 ? 'expression-recoil' : 'expression-worried',
      nextPhase === 3 ? 11 : 5,
      { duration: 6.5, priority: 9, force: true },
    );
    state.shakeTime = settings.reducedMotion ? .2 : .8;
    pushImpactBurst({ x: boss.x, y: boss.y, z: 1.2, elapsed: 0, duration: 1.4, color: BOSS_PHASES[nextPhase - 1].color, radius: 2.4 });
    spawnParticles(boss.x, boss.y, 1.15, [BOSS_PHASES[nextPhase - 1].color, '#fff1b0'], settings.reducedMotion ? 14 : 42, { speed: 2.4, life: 1.05, size: 1.05, upward: .9, glow: 18, trail: true });
    showToast(`${BOSS_PHASES[nextPhase - 1].name} — THE WARDEN RECONFIGURES.`, 'danger');
    playLowThump(nextPhase === 3 ? 38 : 48, .38, .04);
  }

  const waveArming = updateArchonWave(delta, boss);
  if (waveArming || boss.stunTimer > 0 || boss.staggerTimer > 0) return;

  // Resolve one authored pattern at a time. The telegraph is intentionally
  // updated before movement so every attack has a readable, interruptible
  // wind-up and never silently remains on screen after firing.
  if (boss.attackTelegraph) {
    const attack = boss.attackTelegraph;
    attack.elapsed += delta;
    if (attack.elapsed >= attack.duration) {
      executeBossPattern(boss, attack.pattern, attack);
      boss.attackTelegraph = null;
      boss.cooldown = boss.phase === 3 ? .56 : boss.phase === 2 ? .68 : .78;
    }
    return;
  }

  const dx = state.player.x - boss.x;
  const dy = state.player.y - boss.y;
  const distance = Math.hypot(dx, dy) || 1;
  const attackDistance = boss.attackDistance || enemyProfile(boss).attackDistance;
  boss.cooldown = Math.max(0, boss.cooldown - delta);

  if (boss.attackTime > 0) {
    const previous = boss.attackTime;
    boss.attackTime = Math.max(0, boss.attackTime - delta);
    if (!boss.attackHit && previous > .24 && boss.attackTime <= .24) {
      boss.attackHit = true;
      if (distance <= attackDistance + .12) damagePlayer(boss, { damage: boss.damage });
    }
    return;
  }

  if (distance > attackDistance - .12) {
    const direction = { x: dx / distance, y: dy / distance };
    const amount = (boss.phase === 3 ? .56 : .48) * (state.enemySlowTimer > 0 ? .4 : 1) * delta;
    if (canStand(boss.x + direction.x * amount, boss.y)) boss.x += direction.x * amount;
    if (canStand(boss.x, boss.y + direction.y * amount)) boss.y += direction.y * amount;
  }

  if (boss.cooldown <= 0 && hasLineOfSight(boss.x, boss.y, state.player.x, state.player.y)) {
    const patternPool = boss.phase === 1 ? [0, 1, 2] : boss.phase === 2 ? [0, 1, 2, 3, 1] : [0, 1, 2, 3, 4, 1];
    const pattern = patternPool[boss.attackPattern % patternPool.length];
    boss.attackPattern += 1;
    boss.attackTelegraph = {
      type: 'pattern',
      pattern,
      label: bossAttackLabel(boss, pattern),
      targetX: state.player.x,
      targetY: state.player.y,
      elapsed: 0,
      duration: bossAttackDuration(boss, pattern),
    };
    boss.cooldown = boss.attackTelegraph.duration + (boss.phase === 3 ? .58 : .78);
  }
}
function findAimTarget(range = weaponDefinition().range, aim = weaponDefinition().aim) {
  let target = null;
  let bestScore = Infinity;
  for (const enemy of allHostiles()) {
    if (enemy.dead) continue;
    const dx = enemy.x - state.player.x;
    const dy = enemy.y - state.player.y;
    const horizontal = Math.hypot(dx, dy);
    if (horizontal > range || !hasLineOfSight(state.player.x, state.player.y, enemy.x, enemy.y)) continue;
    const camera = cameraPoint(enemy.x, enemy.y, enemyProfile(enemy).aimHeight);
    if (camera.forward <= .1) continue;
    const yawError = Math.abs(Math.atan2(camera.side, camera.forward));
    if (yawError > aim) continue;
    const score = yawError * 3 + horizontal * .06;
    if (score < bestScore) { bestScore = score; target = enemy; }
  }
  return target;
}
function findMeleeTarget() {
  const definition = weaponDefinition();
  let target = null;
  let bestScore = Infinity;
  for (const enemy of allHostiles()) {
    if (enemy.dead) continue;
    const distance = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y);
    if (distance > definition.range || !hasLineOfSight(state.player.x, state.player.y, enemy.x, enemy.y)) continue;
    const camera = cameraPoint(enemy.x, enemy.y, enemyProfile(enemy).aimHeight);
    if (camera.forward <= .05) continue;
    const yawError = Math.abs(Math.atan2(camera.side, camera.forward));
    if (yawError > definition.aim) continue;
    const score = yawError * 1.55 + distance * .1;
    if (score < bestScore) { bestScore = score; target = enemy; }
  }
  return target;
}
function findHitscanTarget(range, aimWindow, shotOffset = 0, candidates = null) {
  let target = null;
  let bestScore = Infinity;
  // Candidates can be supplied by fireHitscan so shotgun pellets do not repeat
  // the same expensive wall/line-of-sight tests seven times per trigger pull.
  for (const enemy of candidates || allHostiles()) {
    if (enemy.dead) continue;
    const distance = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y);
    if (distance > range || (!candidates && !hasLineOfSight(state.player.x, state.player.y, enemy.x, enemy.y))) continue;
    const camera = cameraPoint(enemy.x, enemy.y, enemyProfile(enemy).aimHeight);
    if (camera.forward <= .05) continue;
    const relativeAngle = Math.atan2(camera.side, camera.forward);
    const shotError = Math.abs(normalizeAngle(relativeAngle - shotOffset));
    if (shotError > aimWindow) continue;
    const score = shotError * 3 + distance * .06;
    if (score < bestScore) { bestScore = score; target = enemy; }
  }
  return target;
}
function fireHitscan(definition) {
  const pelletCount = Math.max(1, definition.pellets || 1);
  const hits = new Map();
  const targetWindow = definition.pellets ? .055 : definition.aim;
  const hitscanCandidates = allHostiles().filter((enemy) => {
    if (enemy.dead) return false;
    const distance = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y);
    return distance <= definition.range
      && hasLineOfSight(state.player.x, state.player.y, enemy.x, enemy.y);
  });
  for (let pellet = 0; pellet < pelletCount; pellet += 1) {
    const shotOffset = definition.pellets
      ? (Math.random() * 2 - 1) * definition.spread
      : 0;
    const target = findHitscanTarget(definition.range, targetWindow, shotOffset, hitscanCandidates);
    if (target) hits.set(target, (hits.get(target) || 0) + 1);
  }
  if (!hits.size) {
    showHitMarker('MISS', 'miss');
    const angle = state.player.angle;
    state.weapon.shotTraces.push({ x0: state.player.x, y0: state.player.y, z0: EYE_HEIGHT, x1: state.player.x + Math.cos(angle) * definition.range, y1: state.player.y + Math.sin(angle) * definition.range, z1: EYE_HEIGHT, color: definition.impactColor || '#f0d38f', hit: false, life: .06, duration: .06 });
    return false;
  }
  for (const [target, pelletHits] of hits) {
    const direction = { x: target.x - state.player.x, y: target.y - state.player.y };
    const distance = Math.hypot(direction.x, direction.y);
    const rangeProgress = clamp(distance / Math.max(.1, definition.range), 0, 1);
    const pelletDamage = definition.pellets
      ? definition.damage + (definition.minDamage - definition.damage) * rangeProgress
      : definition.damage;
    damageHostile(target, pelletDamage * pelletHits, {
      source: 'weapon',
      label: definition.pellets ? `SHOTGUN · ${pelletHits} PELLETS` : 'HIT',
      color: definition.impactColor,
      knockback: definition.knockback,
      knockbackDirection: direction,
      stagger: definition.stagger || .12,
      critChance: definition.critChance,
      critMultiplier: definition.critMultiplier,
      silentAudio: true,
    });
  }
  // The weapon report is the hit confirmation. Avoid creating another audio
  // graph for every successful rifle or shotgun trigger pull.
  const traceTarget = hits.keys().next().value;
  const angle = state.player.angle;
  const traceEnd = traceTarget
    ? { x: traceTarget.x, y: traceTarget.y, z: hostileAimHeight(traceTarget) }
    : { x: state.player.x + Math.cos(angle) * definition.range, y: state.player.y + Math.sin(angle) * definition.range, z: EYE_HEIGHT };
  state.weapon.shotTraces.push({ x0: state.player.x, y0: state.player.y, z0: EYE_HEIGHT, x1: traceEnd.x, y1: traceEnd.y, z1: traceEnd.z, color: definition.impactColor || '#f0d38f', hit: Boolean(traceTarget), life: .085, duration: .085 });
  return true;
}

function hitTarget() {
  const definition = weaponDefinition();
  const target = definition.melee ? findMeleeTarget() : findAimTarget(definition.range, definition.aim);
  if (!target) { showHitMarker('MISS', 'miss'); return false; }
  const direction = { x: target.x - state.player.x, y: target.y - state.player.y };
  const damaged = damageHostile(target, definition.damage, { source: 'weapon', label: 'HIT', color: definition.impactColor, knockback: definition.knockback, knockbackDirection: direction, stagger: definition.stagger || .12, critChance: definition.critChance, critMultiplier: definition.critMultiplier, visual: false });
  return damaged;
}

function projectileTargetHit(projectile, target) {
  const weaponProjectile = projectile.source === 'player' && !projectile.ability;
  // Player projectiles are still combat events: show the same enemy flash,
  // sparks, damage number, and impact ring as hitscan weapons.
  const showCombatFeedback = true;
  if (projectile.ability) spawnAbilityImpactParticles(projectile.abilityKind, target.x, target.y, hostileAimHeight(target), projectile.color, projectile.aoe ? 1.08 : .9);
  const damaged = damageHostile(target, projectile.damage, { stun: projectile.stun, stagger: projectile.stagger, knockback: projectile.knockback, knockbackDirection: { x: projectile.vx, y: projectile.vy }, critChance: projectile.critChance, critMultiplier: projectile.critMultiplier, source: projectile.ability ? 'ability' : 'weapon', color: projectile.color, label: projectile.ability ? 'ABILITY HIT' : 'HIT', visual: showCombatFeedback });
  if (!damaged) return;
  // The target flash, ring, sparks, and stagger are the hit confirmation.
  if (projectile.kind === 'ability-chain' && projectile.chainTargets > 0) {
    const chained = allHostiles().filter((other) => other !== target && !other.dead && Math.hypot(other.x - target.x, other.y - target.y) < (projectile.aoe || 2.8) + .9).slice(0, projectile.chainTargets);
    for (const other of chained) damageHostile(other, projectile.damage * .5, { source: 'ability', color: projectile.color, label: 'CHAIN HIT', stagger: projectile.stagger });
  } else if (projectile.aoe > 0) {
    for (const other of allHostiles()) if (other !== target && Math.hypot(other.x - target.x, other.y - target.y) < projectile.aoe) damageHostile(other, projectile.damage * .42, { source: projectile.ability ? 'ability' : 'weapon', color: projectile.color, label: 'SPLASH HIT' });
  }
  if (projectile.kind === 'bfg-electric') {
    pushImpactBurst({ x: target.x, y: target.y, z: hostileAimHeight(target), elapsed: 0, duration: .72, color: projectile.color, radius: projectile.aoe || 2.7, style: 'bfg-impact' });
    spawnParticles(target.x, target.y, hostileAimHeight(target), ['#effff7', '#58f4e4', '#2bd9d0'], settings.reducedMotion ? 12 : 32, { speed: 3, life: .75, size: 1.05, upward: .7, spread: TAU, glow: 24, trail: true });
    state.shakeTime = Math.max(state.shakeTime, settings.reducedMotion ? .12 : .3);
  }
  if (showCombatFeedback) pushImpactBurst({ x: target.x, y: target.y, z: hostileAimHeight(target), elapsed: 0, duration: .55, color: projectile.color, radius: projectile.aoe || .65 });
}
function updateProjectiles(delta) {
  const remaining = [];
  for (const projectile of state.projectiles) {
    projectile.lifetime -= delta;
    if (projectile.lifetime <= 0) continue;

    const target = projectile.targetId ? hostileById(projectile.targetId) : null;
    if (projectile.homing && target && !target.dead) {
      const dx = target.x - projectile.x;
      const dy = target.y - projectile.y;
      const dz = hostileAimHeight(target) - projectile.z;
      const distance = Math.hypot(dx, dy, dz) || 1;
      const speed = Math.hypot(projectile.vx, projectile.vy, projectile.vz) || 1;
      const steering = clamp(projectile.homing * delta, 0, 1);
      projectile.vx = lerp(projectile.vx, dx / distance * speed, steering);
      projectile.vy = lerp(projectile.vy, dy / distance * speed, steering);
      projectile.vz = lerp(projectile.vz, dz / distance * speed, steering);
    }

    projectile.age = (projectile.age || 0) + delta;
    const leavesTrail = projectile.ability || ['ninja-star', 'arrow', 'wand-fireball', 'bfg-electric', 'enemy-plasma', 'enemy-fireball'].includes(projectile.kind);
    if (leavesTrail) {
      projectile.trail.unshift({ x: projectile.x, y: projectile.y, z: projectile.z });
      if (projectile.trail.length > 12) projectile.trail.pop();
      if (projectile.ability && projectile.sparks && Math.random() < delta * (settings.reducedMotion ? 3 : 12)) {
        spawnAbilityTrailParticle(projectile);
      }
    }

    const next = {
      x: projectile.x + projectile.vx * delta,
      y: projectile.y + projectile.vy * delta,
      z: projectile.z + projectile.vz * delta,
    };
    if (isWall(next.x, next.y) || next.z < .03 || next.z > CEILING_Z - .03) {
      if (projectile.ability) {
        pushImpactBurst({ x: projectile.x, y: projectile.y, z: projectile.z, elapsed: 0, duration: .35, color: projectile.color, radius: .45, style: 'projectile-impact' });
        spawnAbilityImpactParticles(projectile.abilityKind, projectile.x, projectile.y, projectile.z, projectile.color, 1.05);
      } else if (projectile.kind === 'bfg-electric') {
        pushImpactBurst({ x: projectile.x, y: projectile.y, z: projectile.z, elapsed: 0, duration: .62, color: projectile.color, radius: projectile.aoe || 2.7, style: 'bfg-impact' });
        spawnParticles(projectile.x, projectile.y, projectile.z, ['#effff7', '#58f4e4', '#2bd9d0'], settings.reducedMotion ? 10 : 24, { speed: 2.4, life: .65, size: .9, upward: .5, spread: TAU, glow: 20, trail: true });
      }
      continue;
    }

    projectile.x = next.x;
    projectile.y = next.y;
    projectile.z = next.z;

    if (projectile.source === 'enemy' || projectile.source === 'boss') {
      if (Math.hypot(projectile.x - state.player.x, projectile.y - state.player.y) < projectile.radius + .23
        && Math.abs(projectile.z - EYE_HEIGHT) < projectile.collisionHeight) {
        damagePlayer(
          { name: projectile.source === 'boss' ? 'The Archon' : 'Archive Warden', damage: projectile.damage },
          { projectile },
        );
        pushImpactBurst({ x: projectile.x, y: projectile.y, z: projectile.z, elapsed: 0, duration: .26, color: projectile.color, radius: .3, style: 'telegraph-contact' });
        continue;
      }
    } else {
      let hit = null;
      for (const hostile of allHostiles()) {
        if (hostile.dead) continue;
        const distance = Math.hypot(projectile.x - hostile.x, projectile.y - hostile.y, projectile.z - hostileAimHeight(hostile));
        if (distance < projectile.radius + hostileRadius(hostile)) {
          hit = hostile;
          break;
        }
      }
      if (hit) {
        projectileTargetHit(projectile, hit);
        continue;
      }
    }
    remaining.push(projectile);
  }
  state.projectiles = remaining;
}

function triggerWeaponFeedback(definition) {
  const impulse = definition.recoilAmount || 0;
  state.weapon.muzzleFlash = definition.muzzleDuration || .12;
  state.weapon.recoil = impulse;
  state.weapon.kickVelocity = Math.max(state.weapon.kickVelocity || 0, impulse * 7.2);
  state.weapon.kickX = clamp((state.weapon.kickX || 0) + (Math.sin((state.weapon.lastFireAt || performance.now()) * .017) * .42 + .1) * impulse, -.22, .22);
  state.weapon.rollKick = clamp((state.weapon.rollKick || 0) - impulse * .055, -.12, .12);
  state.weapon.viewKick = Math.min(.16, (state.weapon.viewKick || 0) + impulse * .7);
  state.weapon.fovKick = Math.min(.105, (state.weapon.fovKick || 0) + impulse * .075);
  state.weapon.shotPulse = 1;
  state.weapon.lastFireAt = performance.now();
  if (!settings.reducedMotion) state.shakeTime = Math.max(state.shakeTime, definition.projectile ? .19 : definition.pellets ? .13 : .07);
}

function performAttack() {
  const definition = weaponDefinition();
  if (state.levelPreview) {
    markVisorTutorial('fire');
    state.weapon.muzzleFlash = Math.max(state.weapon.muzzleFlash || 0, .12);
    state.weapon.shotPulse = 1;
    return;
  }
  if (state.attackInputLock > 0) return;
  if (state.reading || state.deathScreen || !state.weapon.equipped || state.menuActive || state.launchTransition || state.transition || state.gameComplete || state.weapon.reloadTimer > 0 || state.weapon.cooldown > 0) return;
  if (definition.magazineSize && !consumeWeaponAmmo(definition.ammoPerShot || 1)) return;
  markVisorTutorial('fire');
  if (definition.melee) {
    state.weapon.cooldown = definition.cooldown;
    state.weapon.swing = definition.duration;
    hitTarget();
  } else {
    // Hold the combat event until the authored frame-4 firing pose. This keeps
    // the visible muzzle moment and the actual projectile/hitscan impact aligned.
    state.weapon.hit = false;
    state.weapon.attackHitAt = definition.hitAt ?? .5;
  }
  state.weapon.cooldown = definition.cooldown;
  state.weapon.swing = definition.duration;
  state.weapon.lastFireAt = performance.now();
  // Show the weapon event at trigger time. Damage/projectiles still land on the
  // authored impact frame below, but the gun no longer feels disconnected from
  // the click.
  triggerWeaponFeedback(definition);
  playWeaponSound();
}
function updateWeapon(delta) {
  const definition = weaponDefinition();
  state.weapon.cooldown = Math.max(0, state.weapon.cooldown - delta);
  state.weapon.swing = Math.max(0, state.weapon.swing - delta);
  state.weapon.projectile = Math.max(0, state.weapon.projectile - delta);
  if (state.weapon.swing > 0 && !state.weapon.hit && !definition.melee) {
    const progress = 1 - state.weapon.swing / Math.max(.01, definition.duration);
    if (progress >= (state.weapon.attackHitAt ?? .5)) {
      state.weapon.hit = true;
      if (definition.projectile) spawnBfgProjectile(definition);
      else fireHitscan(definition);
    }
  }
  state.weapon.muzzleFlash = Math.max(0, state.weapon.muzzleFlash - delta);
  state.weapon.recoil = Math.max(0, state.weapon.recoil - delta * 4.8);
  state.weapon.kickVelocity = (state.weapon.kickVelocity || 0) * Math.pow(.018, delta);
  state.weapon.kickX = (state.weapon.kickX || 0) * Math.pow(.035, delta);
  state.weapon.rollKick = (state.weapon.rollKick || 0) * Math.pow(.025, delta);
  state.weapon.viewKick = Math.max(0, (state.weapon.viewKick || 0) - delta * 2.9);
  state.weapon.fovKick = Math.max(0, (state.weapon.fovKick || 0) - delta * 1.85);
  state.weapon.shotPulse = Math.max(0, (state.weapon.shotPulse || 0) - delta * 5.4);
  state.weapon.shotTraces = (state.weapon.shotTraces || []).filter((trace) => { trace.life -= delta; return trace.life > 0; });
  if (state.weapon.reloadTimer > 0) {
    if (state.weapon.type === 'shotgun' && state.weapon.reloadShellsLoaded < state.weapon.reloadShellsToLoad) {
      state.weapon.reloadElapsed += delta;
      while (state.weapon.reloadShellsLoaded < state.weapon.reloadShellsToLoad
        && state.weapon.reloadElapsed >= state.weapon.reloadShellsLoaded * state.weapon.reloadShellInterval) {
        loadShotgunShell(state.weapon.reloadShellsLoaded);
      }
    }
    state.weapon.reloadTimer = Math.max(0, state.weapon.reloadTimer - delta);
    if (state.weapon.reloadTimer <= 0) finishReload();
    return;
  }
  if (state.mouseAttack && definition.fireMode !== 'semi' && state.weapon.cooldown <= 0) performAttack();
}

function updatePrompt(delta = 0) {
  state.promptTimer -= delta;
  if (state.menuActive || state.deathScreen || state.transition || state.forestTransition || state.launchTransition || state.reading) {
    interactionPrompt.hidden = true;
    state.promptSignature = '';
    return;
  }
  if (state.promptTimer > 0) return;
  state.promptTimer = .12;

  const finalDoorDistance = state.doorOfLight?.active
    ? Math.hypot(state.doorOfLight.x - state.player.x, state.doorOfLight.y - state.player.y)
    : Infinity;
  const finalDoor = finalDoorDistance <= 2.35;
  const weaponCreature = getNearestWeaponCreature();
  const scroll = null;
  const lobbyGate = state.room === 0 && !state.lobbyGateOpen && lobbyGateDistance() <= 1.65;
  const gateAbility = state.room === 0
    && !state.lobbyGateOpen
    && state.tutorialAbility
    && state.weapon.equipped
    && lobbyGateDistance() <= LOBBY_GATE_ABILITY_RANGE;
  let nextKey = null;
  let nextText = '';

  // Keep this list intentionally narrow: only immediate, explicitly actionable
  // interactions are shown below the crosshair.
  if (finalDoor) {
    nextKey = 'E';
    nextText = 'INTERACT WITH FINAL DOOR';
  } else if (lobbyGate && !state.weapon.equipped) {
    nextKey = 'E';
    nextText = 'CAST ARCHIVE KEY TO OPEN GATE';
  } else if (gateAbility) {
    nextKey = 'Q';
    nextText = 'CAST ARCHIVE KEY TO OPEN GATE';
  } else if (weaponCreature) {
    nextKey = 'E';
    nextText = `PICK UP ${WEAPON_LOADOUTS[weaponCreature.type].label.toUpperCase()}`;
  }

  if (!nextKey) {
    interactionPrompt.hidden = true;
    state.promptSignature = '';
    return;
  }

  const keyLabel = `[${nextKey}]`;
  const signature = `${keyLabel}|${nextText}`;
  if (signature === state.promptSignature) return;
  state.promptSignature = signature;
  interactionPrompt.hidden = false;
  promptKey.textContent = keyLabel;
  promptText.textContent = nextText;
}
function advanceToPortfolio() {
  // Kept under the old name for compatibility with the existing ending flow;
  // the completed run now fades into the sanctuary instead of the lobby.
  state.endingFade += .022;
  if (state.endingFade >= 1) {
    state.endingFade = -1;
    const spawn = roomContentPoint(SANCTUARY_ROOM_INDEX, rooms[SANCTUARY_ROOM_INDEX].spawn.x, rooms[SANCTUARY_ROOM_INDEX].spawn.y);
    state.player.x = roomOffsets[SANCTUARY_ROOM_INDEX] + spawn.x;
    state.player.y = spawn.y;
      state.player.angle = rooms[SANCTUARY_ROOM_INDEX].spawn.angle;
      state.room = SANCTUARY_ROOM_INDEX;
    state.sanctuaryActive = true;
    state.gameComplete = false;
    announceNarrator(
      'sanctuary-arrival',
      'DOCUMENT OF TRUTH / SANCTUARY',
      'SANCTUARY CLEAR. FIND THE RÉSUMÉ PEDESTAL.',
      'expression-pleased',
      7,
      { duration: 8, priority: 10, force: true },
    );
    state.doorOfLight = null;
    state.keys.clear();
    state.mouseAttack = false;
    state.mouseLook = false;
    setMusicMode('dungeon');
    updateHud();
    spawnParticles(state.player.x, state.player.y, .65, ['#fff8d6', '#b8f0e2'], settings.reducedMotion ? 14 : 34, { speed: 1.1, life: 1.2, size: .9, upward: .8, spread: TAU, gravity: -.08, glow: 19, trail: true });
    showToast('ASCENSION COMPLETE · APPROACH THE RÉSUMÉ PEDESTAL.', 'good');
  }
}
function tick(delta, now) {
  if (state.menuActive) return;
  if (state.deathScreen) { state.deathScreen.elapsed += delta; return; }
  if (state.reading) { state.readingElapsed += delta; return; }
  state.now = now;
  updateParticles(delta);
  emitAmbientParticles(delta);
  updateFloorAnnouncement(delta);
  if (state.launchTransition) { updateLaunchTransition(delta); state.damageFlash = Math.max(0, state.damageFlash - delta * 1.8); state.shakeTime = Math.max(0, state.shakeTime - delta * 1.8); }
  if (state.gameComplete) { advanceToPortfolio(); return; }
  if (state.levelPreview) { updateLevelPreview(delta); return; }
  if (state.routeOverview) { updateRouteOverview(delta); return; }
  if (state.forestTransition) { updateForestTransition(delta); state.rearHitEffect = Math.max(0, state.rearHitEffect - delta * 5.2); state.damageFlash = Math.max(0, state.damageFlash - delta * 2.8); state.shakeTime = Math.max(0, state.shakeTime - delta * 1.8); return; }
  if (state.miniBossCutscene) { updateMiniBossCutscene(delta); return; }
  if (state.transition) { updateBossTransition(delta); state.damageFlash = Math.max(0, state.damageFlash - delta * 1.8); state.shakeTime = Math.max(0, state.shakeTime - delta * 1.8); return; }
  state.attackInputLock = Math.max(0, state.attackInputLock - delta);
  updateLobbyGate(delta);
  updateLobbyGuide(delta);
  updateLobbyGuideSpeech(delta);
  updatePlayer(delta);
  updateSanctuaryResume();
  collectTouchItems();
  if (state.room === FINAL_ROOM_INDEX) state.finalArenaTime += delta;
  updateWeapon(delta);
  if (state.mouseAttack && weaponDefinition().fireMode === 'semi' && state.weapon.swing <= 0 && state.weapon.cooldown <= 0) performAttack();
  updateAbility(delta);
  updateProjectiles(delta);
  updateEnemies(delta);
  updateGroundHazards(delta);
  state.rearHitEffect = Math.max(0, state.rearHitEffect - delta * 5.2);
  state.damageFlash = Math.max(0, state.damageFlash - delta * 1.8);
  state.damageHudPulse = Math.max(0, state.damageHudPulse - delta);
  if (state.damageHudPulse <= 0) gameShell?.classList.remove('damage-alert');
  state.shakeTime = Math.max(0, state.shakeTime - delta * 1.8);
  updateCombatHud();
}
const runtimeDiagnostics = {
  lastErrorAt: -Infinity,
  lastReportedSignature: '',
  lastToastAt: -Infinity,
};
function reportRuntimeError(scope, error) {
  const now = performance.now();
  const message = error?.stack || error?.message || String(error);
  const signature = `${scope}:${message}`;
  state.runtimeErrorCount += 1;
  state.lastRuntimeError = `${scope}: ${message}`;
  if (new URLSearchParams(window.location.search).has('debug-render')) {
    document.title = `RENDER ERROR · ${scope} · ${message.replace(/\s+/g, ' ').slice(0, 1000)}`;
    document.documentElement.dataset.renderError = state.lastRuntimeError;
  }
  if (signature !== runtimeDiagnostics.lastReportedSignature || now - runtimeDiagnostics.lastErrorAt > 2000) {
    console.error(`[Portfolio game] recovered ${scope} error`, error);
    runtimeDiagnostics.lastReportedSignature = signature;
    runtimeDiagnostics.lastErrorAt = now;
  }
  if (!state.menuActive && now - runtimeDiagnostics.lastToastAt > 5000) {
    runtimeDiagnostics.lastToastAt = now;
    try { showToast('The renderer recovered from a transient fault.', 'danger'); } catch { /* keep the frame loop alive even if the HUD is unavailable */ }
  }
}
function runFrameTask(scope, callback) {
  try {
    callback();
    return true;
  } catch (error) {
    reportRuntimeError(scope, error);
    return false;
  }
}
function drawRecoveryScene(now) {
  const width = canvas.width;
  const height = canvas.height;
  ctx.save();
  try {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#090705';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#f0ddaf';
    ctx.font = `bold ${Math.max(12, height * .025)}px "DM Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('RENDERER RECOVERING', width / 2, height / 2 - 14);
    ctx.fillStyle = '#b8f0e2';
    ctx.font = `${Math.max(9, height * .014)}px "DM Mono", monospace`;
    ctx.fillText('THE RUN IS STILL ACTIVE', width / 2, height / 2 + 16);
    if (state.lastRuntimeError) {
      const detail = state.lastRuntimeError.replace(/\s+/g, ' ').slice(0, 180);
      ctx.fillStyle = '#e79a8c';
      ctx.font = `${Math.max(8, height * .011)}px \"DM Mono\", monospace`;
      ctx.fillText(detail, width / 2, height / 2 + 48);
    }
  } finally {
    ctx.restore();
  }
}
function updateFrameQuality(frameMs) {
  const sample = clamp(frameMs, 0, 250);
  state.frameAverageMs = state.frameAverageMs ? state.frameAverageMs * .92 + sample * .08 : sample;
  if (state.frameAverageMs > 28) {
    state.slowFrameStreak += 1;
    state.stableFrameStreak = 0;
  } else if (state.frameAverageMs < 19) {
    state.stableFrameStreak += 1;
    state.slowFrameStreak = 0;
  } else {
    state.slowFrameStreak = 0;
    state.stableFrameStreak = 0;
  }
  if (state.slowFrameStreak >= 8) {
    state.renderQuality = Math.max(.58, state.renderQuality - .12);
    state.slowFrameStreak = 0;
  } else if (state.stableFrameStreak >= 45) {
    state.renderQuality = Math.min(1, state.renderQuality + .06);
    state.stableFrameStreak = 0;
  }
}
function gameLoop(now) {
  const frameStart = performance.now();
  try {
    const delta = Math.min(.05, (now - state.lastTime) / 1000 || 0);
    state.lastTime = now;
    runFrameTask('update', () => tick(delta, now));
    runFrameTask('prompt', () => updatePrompt(delta));
    if (now - state.lastRenderAt >= RENDER_INTERVAL) {
      state.lastRenderAt = now;
      const rendered = runFrameTask('scene', () => drawScene(now));
      if (!rendered) runFrameTask('recovery scene', () => drawRecoveryScene(now));
    }
  } catch (error) {
    reportRuntimeError('frame loop', error);
  } finally {
    updateFrameQuality(performance.now() - frameStart);
    requestAnimationFrame(gameLoop);
  }
}
window.addEventListener('error', (event) => {
  if (event.error) reportRuntimeError('window', event.error);
});
window.addEventListener('unhandledrejection', (event) => {
  reportRuntimeError('promise', event.reason || 'Unhandled promise rejection');
});

function setKey(event, down) {
  const rawKey = event.key;
  const key = rawKey.toLowerCase();
  if (down && !event.repeat && (key === 'e' || key === 'enter')) { event.preventDefault(); if (state.deathScreen) resetCurrentLevel(); else recoverNearby(); return; }
  if (down && !event.repeat && key === 'escape') {
    if (helpDialog?.open || settingsDialog?.open) return;
    event.preventDefault();
    if (state.reading) closeReading();
    else showToast(state.room === 0 ? 'You are in the safe field lobby.' : 'The archive has no pause menu. Return to the entrance hall for the safe lobby.');
    return;
  }
  if (down && !event.repeat && key === 'r') { event.preventDefault(); reloadWeapon(); return; }
  if (down && !event.repeat && key === 'q') { event.preventDefault(); castAbility(); return; }
  if (down && !event.repeat && key === 'z') { event.preventDefault(); cycleAbility(-1); return; }
  if (down && !event.repeat && key === 'x') { event.preventDefault(); cycleAbility(1); return; }
  if (down && !event.repeat && ['1', '2', '3', '4'].includes(key)) {
    event.preventDefault();
    const nextWeapon = { '1': 'arsenal', '2': 'shotgun', '3': 'bfg' }[key];
    if (nextWeapon) setWeapon(nextWeapon);
    return;
  }
  const movementKeys = ['w', 'a', 's', 'd', 'shift', 'arrowleft', 'arrowright'];
  if (!movementKeys.includes(key)) return;
  if (state.guideControlsLocked && ['w', 'a', 's', 'd'].includes(key)) { event.preventDefault(); return; }
  event.preventDefault();
  if (down) state.keys.add(key); else state.keys.delete(key);
}
function requestGamePointerLock() {
  if (settings.pointerLock && !state.menuActive && !state.reading && document.pointerLockElement !== canvas) canvas.requestPointerLock?.();
}
function handleMouseMove(event) {
  if (state.menuActive || state.reading) return;
  if (document.pointerLockElement !== canvas && !state.mouseLook) return;
  const dx = document.pointerLockElement === canvas ? event.movementX : event.movementX || 0;
  if (Math.abs(dx) <= .5) return;
  if (state.levelPreview) return;
  markVisorTutorial('look');
  state.player.angle = normalizeAngle(state.player.angle + dx * .0028);
}
window.addEventListener('keydown', (event) => setKey(event, true), { passive: false });
window.addEventListener('keyup', (event) => setKey(event, false), { passive: false });
window.addEventListener('blur', () => { state.keys.clear(); state.mouseAttack = false; state.weapon.mousePressed = false; state.mouseLook = false; });
document.addEventListener('mousemove', handleMouseMove);
document.addEventListener('pointerlockchange', () => {
  state.pointerLocked = document.pointerLockElement === canvas;
  if (state.pointerLocked && state.levelPreview && state.visorTutorial) state.visorTutorial.mouseEngaged = true;
  canvas.classList.toggle('pointer-locked', state.pointerLocked);
  if (!state.pointerLocked && !state.mouseAttack) state.mouseLook = false;
});
canvas.addEventListener('pointerdown', (event) => {
  if (event.button !== 0 || state.reading || state.menuActive || state.attackInputLock > 0) return;
  const startupMouseAlreadyEngaged = Boolean(state.pointerLocked || state.visorTutorial?.mouseEngaged);
  state.mouseLook = true;
  if (state.levelPreview) {
    state.visorTutorial.mouseEngaged = true;
    requestGamePointerLock();
    if (!startupMouseAlreadyEngaged) {
      showToast('MOUSE LINK ENGAGED. INTRO CAMERA LOCKED.', 'good');
    } else {
      performAttack();
    }
    return;
  }
  requestGamePointerLock();
  state.mouseAttack = true;
  state.weapon.mousePressed = true;
  performAttack();
  if (canvas.setPointerCapture && event.pointerId != null && event.isTrusted && canvas.matches(':active')) {
    try { canvas.setPointerCapture(event.pointerId); } catch (error) { /* optional */ }
  }
});
canvas.addEventListener('pointerup', (event) => {
  if (event.button !== 0) return;
  state.mouseAttack = false;
  state.weapon.mousePressed = false;
  if (!state.pointerLocked) state.mouseLook = false;
  if (canvas.releasePointerCapture && event.pointerId != null && event.isTrusted) {
    try { canvas.releasePointerCapture(event.pointerId); } catch (error) { /* optional */ }
  }
});
canvas.addEventListener('pointercancel', () => { state.mouseAttack = false; state.weapon.mousePressed = false; if (!state.pointerLocked) state.mouseLook = false; });
canvas.addEventListener('contextmenu', (event) => event.preventDefault());
for (const button of document.querySelectorAll('[data-control]')) {
  const key = { forward: 'w', back: 's', 'strafe-left': 'a', 'strafe-right': 'd' }[button.dataset.control];
  if (button.dataset.control === 'attack') { button.addEventListener('pointerdown', (event) => { event.preventDefault(); performAttack(); }); continue; }
  const press = (event) => { event.preventDefault(); state.keys.add(key); };
  const release = (event) => { event.preventDefault(); state.keys.delete(key); };
  button.addEventListener('pointerdown', press); button.addEventListener('pointerup', release); button.addEventListener('pointerleave', release); button.addEventListener('pointercancel', release);
}
function showHoverTooltip(target) {
  if (!hoverTooltip || !target) return;
  const text = target.dataset.tooltip;
  if (!text) return;
  hoverTooltip.textContent = text;
  hoverTooltip.hidden = false;
  hoverTooltip.classList.add('is-visible');
}
function hideHoverTooltip(target = null) {
  if (!hoverTooltip) return;
  if (target && hoverTooltip.dataset.owner !== target.dataset.tooltip) return;
  hoverTooltip.hidden = true;
  hoverTooltip.classList.remove('is-visible');
  hoverTooltip.dataset.owner = '';
}
document.addEventListener('pointerover', (event) => {
  const target = event.target.closest?.('[data-tooltip]');
  if (!target || (event.relatedTarget && target.contains(event.relatedTarget))) return;
  if (hoverTooltip) hoverTooltip.dataset.owner = target.dataset.tooltip || '';
  showHoverTooltip(target);
});
document.addEventListener('pointerout', (event) => {
  const target = event.target.closest?.('[data-tooltip]');
  if (!target || (event.relatedTarget && target.contains(event.relatedTarget))) return;
  hideHoverTooltip(target);
});
document.addEventListener('focusin', (event) => {
  const target = event.target.closest?.('[data-tooltip]');
  if (!target) return;
  if (hoverTooltip) hoverTooltip.dataset.owner = target.dataset.tooltip || '';
  showHoverTooltip(target);
});
document.addEventListener('focusout', (event) => {
  const target = event.target.closest?.('[data-tooltip]');
  if (target) hideHoverTooltip(target);
});

closeScrollButton.addEventListener('click', closeReading);
deathRestart?.addEventListener('click', resetCurrentLevel);
helpButton.addEventListener('click', () => { if (typeof helpDialog.showModal === 'function' && !helpDialog.open) helpDialog.showModal(); else helpDialog.setAttribute('open', ''); });
settingsButton?.addEventListener('click', () => {
  if (!settingsDialog) return;
  if (typeof settingsDialog.showModal === 'function' && !settingsDialog.open) settingsDialog.showModal();
  else settingsDialog.setAttribute('open', '');
});
musicButton?.addEventListener('click', toggleMusic);
let soundtrackGestureHandled = false;
function startSoundtrackFromGesture() {
  if (soundtrackGestureHandled || !music.enabled) return;
  soundtrackGestureHandled = true;
  startMusic();
}
document.addEventListener('pointerdown', startSoundtrackFromGesture, { once: true, passive: true });
document.addEventListener('keydown', startSoundtrackFromGesture, { once: true });
musicVolumeInput?.addEventListener('input', (event) => {
  settings.musicVolume = clamp(Number(event.target.value), 0, 1);
  if (music.ambientGain && ensureAudioContext()) {
    music.ambientGain.gain.setTargetAtTime((music.mode === 'boss' ? .5 : .42) * settings.musicVolume, audioContext.currentTime, .08);
  }
});
sfxVolumeInput?.addEventListener('input', (event) => { settings.sfxVolume = clamp(Number(event.target.value), 0, 1); });
reducedMotionInput?.addEventListener('change', (event) => { settings.reducedMotion = event.target.checked; });
pointerLockInput?.addEventListener('change', (event) => {
  settings.pointerLock = event.target.checked;
  if (!settings.pointerLock && document.pointerLockElement === canvas) document.exitPointerLock?.();
});
weaponOptionButtons.forEach((button) => button.addEventListener('click', () => {
  setWeapon(button.dataset.weapon);
}));
weaponSlots.forEach((button) => button.addEventListener('click', () => {
  setWeapon(button.dataset.weaponSlot);
}));
if (musicVolumeInput) musicVolumeInput.value = String(settings.musicVolume);
if (sfxVolumeInput) sfxVolumeInput.value = String(settings.sfxVolume);
if (reducedMotionInput) reducedMotionInput.checked = settings.reducedMotion;
if (pointerLockInput) pointerLockInput.checked = settings.pointerLock;
window.addEventListener('resize', resizeCanvas);

function startDirectDungeon() {
  const roomIndex = STARTING_ROOM_INDEX;
  const spawn = roomContentPoint(roomIndex, rooms[roomIndex].spawn.x, rooms[roomIndex].spawn.y);
  state.room = roomIndex;
  state.player.x = roomOffsets[roomIndex] + spawn.x;
  state.player.y = spawn.y;
  state.player.angle = rooms[roomIndex].spawn.angle;
  state.player.hp = 100;
  state.keys.clear();
  state.mouseAttack = false;
  state.weapon.mousePressed = false;
  state.weapon.hit = false;
  state.weapon.swing = 0;
  state.weapon.cooldown = 0;
  state.weapon.muzzleFlash = 0;
  state.weapon.shotPulse = 0;
  state.weapon.shotTraces = [];
  state.attackInputLock = 0;
  state.mouseLook = false;
  state.visorTutorial = { look: false, fire: false, weapon: false, active: false, step: 'look', mouseEngaged: false };
  state.guideControlsLocked = false;
  state.guideIntroPhase = 'complete';
  state.guideRun = null;
  state.guideDeferredRun = null;
  state.launchTransition = null;
  state.transition = null;
  state.routeOverview = null;
  state.routeOverviewTriggered = false;
  state.miniBossIntroSeen.clear();
  state.lobbyGateOpen = true;
  state.lobbyDeparted = true;
  state.lobbyGateOpening = false;
  state.lobbyGateProgress = 1;
  for (const type of Object.keys(WEAPON_LOADOUTS)) {
    const loadout = WEAPON_LOADOUTS[type];
    if (loadout.magazineSize) {
      state.weapon.ammoByType[type] = loadout.magazineSize;
      state.weapon.reserveByType[type] = loadout.reserveAmmo;
    }
  }
  state.weapon.type = 'arsenal';
  ensureWeaponAmmo('arsenal');
  state.weapon.equipped = true;
  setMusicMode('dungeon');
  beginLevelPreview();
  updateHud();
}

function clearLegacyStartupOverlays() {
  if (floorAnnouncement) {
    floorAnnouncement.hidden = true;
    floorAnnouncement.setAttribute('aria-hidden', 'true');
  }
  document.querySelectorAll('.game-shell > [class$="-overlay"], .game-shell > [id^="main-"]').forEach((node) => {
    if (!node.classList.contains('reading-overlay') && !node.classList.contains('death-overlay') && !node.classList.contains('commander-overlay')) node.remove();
  });
  if (readingOverlay && !state.reading) {
    readingOverlay.hidden = true;
    readingOverlay.classList.remove('open', 'intro-scroll');
  }
  if (floorAnnouncement && !state.floorAnnouncement) {
    floorAnnouncement.hidden = true;
    floorAnnouncement.classList.remove('is-visible');
  }
  gameShell.classList.remove('menu-active', 'game-launching');
}

try {
  resizeCanvas();
  textures.stone = createStoneTexture(256, 13);
  buildGroundCache();
  textures.bone = createBoneTexture(96, 37);
  textures.steel = createSteelTexture(96, 53);
  textures.hellTech = createHellTechTexture(256, 113);
  textures.wood = createWoodTexture(256, 29);
  textures.leather = createLeatherTexture(96, 71);
  textures.pipSkin = createPipSkinTexture(128, 97);
  textures.dialogue = createDialogueTexture(128, 83);
  textures.patterns = { stone: ctx.createPattern(textures.stone, 'repeat'), wood: ctx.createPattern(textures.wood, 'repeat'), bone: ctx.createPattern(textures.bone, 'repeat'), steel: ctx.createPattern(textures.steel, 'repeat'), leather: ctx.createPattern(textures.leather, 'repeat'), 'pip-skin': ctx.createPattern(textures.pipSkin, 'repeat'), dialogue: ctx.createPattern(textures.dialogue, 'repeat') };
  updateWeaponSelection(state.weapon.type);
  state.weapon.equipped = false;
  clearLegacyStartupOverlays();
  startDirectDungeon();
  state.lastTime = performance.now();
  updateHud();
  requestAnimationFrame(gameLoop);
} catch (error) {
  reportRuntimeError('startup', error);
  resizeCanvas();
  drawRecoveryScene(performance.now());
  requestAnimationFrame(gameLoop);
}
