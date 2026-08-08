"use strict";

/*
 * LIAM HOSFELD // THE OPERATIONS DUNGEON
 *
 * One connected dungeon map. The browser renders the world with a small
 * software 3D pipeline: vertical camera pitch, perspective projection,
 * painter-sorted low-poly meshes, raycast walls, procedural materials, and
 * hand-built low-poly ninja-star/crossbow meshes and several enemy archetypes.
 */

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
const roomFloor = document.getElementById('room-floor');
const roomCount = document.getElementById('room-count');
const experienceValue = document.getElementById('experience-value');
const objectivePanel = document.getElementById('objective-panel');
const objectiveLabel = document.getElementById('objective-label');
const objectiveDetail = document.getElementById('objective-detail');
const weaponHudLabel = document.getElementById('weapon-hud-label');
const weaponStatus = document.getElementById('weapon-status');
const hitMarker = document.getElementById('hit-marker');
const hitMarkerSymbol = document.getElementById('hit-marker-symbol');
const hitMarkerLabel = document.getElementById('hit-marker-label');
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
const staminaValue = document.getElementById('stamina-value');
const staminaBar = document.getElementById('stamina-bar');
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
const scrollSpell = document.getElementById('scroll-spell');
const scrollSpellSeal = document.getElementById('scroll-spell-seal');
const scrollSpellName = document.getElementById('scroll-spell-name');
const scrollSpellDescription = document.getElementById('scroll-spell-description');
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
const aimReticle = document.querySelector('.aim-reticle');
const loadoutDescription = document.getElementById('loadout-description');
const weaponOptionButtons = [...document.querySelectorAll('[data-weapon]')];
const settings = { musicVolume: .72, sfxVolume: .82, reducedMotion: false, pointerLock: true };
const EMERALD = '#24dca0';
const EMERALD_LIGHT = '#c4ffe4';
const lobbyPortfolioScroll = {
  id: 'lobby-portfolio-scroll',
  intro: true,
  gateTutorial: true,
  roomIndex: 0,
  x: 0,
  y: 0,
  title: 'LIAM HOSFELD / FIELD PORTFOLIO',
  kind: 'chronicle',
  tag: 'ENTRY SCROLL / SELECTED PROOF',
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
    'NEXT — Approach a weapon keeper and press E to equip its weapon. Reading this record grants the tutorial spell: Archive Key. Use Q to cast it at the sealed archive gate.'
  ],
  tags: ['TECHNICAL CONSULTANT', 'TMS / LOGISTICS', 'OPERATIONS ANALYTICS', 'INTEGRATIONS', 'AUTOMATION', 'TUTORIAL SPELL: ARCHIVE KEY'],
  color: '#6ce0c2'
};
let LOBBY_GATE = null;
let hitMarkerTimeout = 0;
let shieldFeedbackAt = -Infinity;

const rooms = [
  {
    id: 'entrance', level: 'LEVEL 01', title: 'THE ENTRANCE HALL', shortTitle: 'Entrance Hall', subtitle: 'Identity, scope, and the work behind the map.', fieldNote: 'Liam is a Technical Consultant at Manhattan Associates, translating complex transportation systems into work people can run.', color: '#6ce0c2', material: 'stone', levelType: 'grand hall', palette: ['#8fc7bd', '#cfe2c2', '#9ab991'],
    intro: 'Liam Hosfeld is a Technical Consultant in Atlanta, Georgia, translating operational complexity into systems people can actually run.',
    details: [
      'Current class: Technical Consultant at Manhattan Associates.',
      'Specialty: Transportation Management Systems, logistics data ecosystems, integrations, and custom automation.',
      'Working style: investigate the evidence, clarify the requirement, automate the path, then measure what changed.',
      'The through-line is practical: connect requirements, data, and delivery so complex work becomes easier to operate.'
    ],
    tags: ['Technical Consulting', 'TMS', 'Operations Analytics', 'Atlanta, GA'],
    map: ['1111111111111111', '1000000000000001', '1000000000000001', '1000000000000001', '1000000000000001', '1000000000000001', '1000000000000001', '1111111111111111'],
    spawn: { x: 3.5, y: 4, angle: 0 },
    items: [
      { id: 'identity-sigil', title: 'SYSTEMS CARTOGRAPHER', kind: 'sigil', icon: 'Σ', tag: 'CLASS / IDENTITY', x: 8.5, y: 3.2, color: '#6ce0c2', summary: 'Liam turns messy operational systems into routes people can actually run.', details: ['Technical Consultant at Manhattan Associates.', 'Specialty spans TMS, logistics data ecosystems, integration evidence, and automation.'] },
      { id: 'consultant-seal', title: 'THE CONSULTANT’S SEAL', kind: 'seal', icon: 'LH', tag: 'ROLE / SCOPE', x: 12.5, y: 6.2, color: '#e7ad67', summary: 'Customer-facing technical delivery with a bias toward clarity and useful outcomes.', details: ['Coordinates across Operations, Cloud Services, Finance, and R&D.', 'Translates requirements and system behavior into clear decisions.'] }
    ],
    enemies: []
  },
  {
    id: 'threshold', roof: true, level: 'LEVEL 02', title: 'THE THRESHOLD CHAMBER', shortTitle: 'Threshold Chamber', subtitle: 'The first room after the forest.', fieldNote: 'A narrow entry chamber. Something weak is waiting across the stone.', color: '#b9a57e', material: 'stone', levelType: 'threshold room', width: 16, height: 10, palette: ['#07080a', '#2b2924', '#0a0908'],
    intro: 'The forest spits you into a small stone chamber. A threshold cockroach waits far across the stone.',
    details: ['The gate route is not a clean walk into the archive.', 'Something struck from behind in the outer forest.', 'Cross the threshold, defeat the cockroach, and continue into the archive rooms.'],
    tags: ['Forest ambush', 'Starting room', 'Weak enemy'],
    map: ['1111111111', '1000000001', '1000000001', '1000000001', '1000000001', '1111111111'],
    spawn: { x: 2.1, y: 3, angle: 0 },
    items: [],
    enemies: [
      { id: 'threshold-cockroach', name: 'Threshold Cockroach', kind: 'cockroach', x: 8.2, y: 3, hp: 38, speed: .24, damage: 4, color: '#80634a' }
    ]
  },
  {
    id: 'trophy', roof: true, level: 'LEVEL 03', title: 'THE TROPHY ROOM', shortTitle: 'Trophy Room', subtitle: 'Proof gathered on the journey.', fieldNote: 'He supports five enterprise accounts and works with production data at more than one million tracking messages each month.', color: '#e7ad67', material: 'wood', levelType: 'vault gallery', palette: ['#0c0704', '#3b2112', '#120805'],
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
    id: 'quests', level: 'LEVEL 04', title: 'THE QUEST BOARD', shortTitle: 'Quest Board', subtitle: 'Selected problems, investigated and made repeatable.', fieldNote: 'His pattern is simple: investigate the evidence, clarify the requirement, automate the repeatable path, and measure the result.', color: '#c58de6', material: 'stone', levelType: 'crossroads', palette: ['#0a0508', '#2e1d2b', '#0b070b'],
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
    id: 'chronicle', roof: true, level: 'LEVEL 05', title: 'THE CHRONICLE', shortTitle: 'Chronicle', subtitle: 'Experience that supports the proof.', fieldNote: 'His route runs from Cloud Services and systems operations into customer-facing technical consulting.', color: '#77a9e8', material: 'stone', levelType: 'archive maze', palette: ['#05080c', '#1d2b3a', '#06090d'],
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
    id: 'character', roof: true, level: 'LEVEL 06', title: 'THE CHARACTER SHEET', shortTitle: 'Character Sheet', subtitle: 'Tools carried into the dungeon.', fieldNote: 'His toolkit crosses Oracle SQL, BigQuery, Power BI, Python, PowerShell, integrations, and automation.', color: '#e3c66e', material: 'wood', levelType: 'craft workshop', palette: ['#0d0703', '#402613', '#120805'],
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
    id: 'campfire', roof: true, level: 'LEVEL 07', title: 'THE CAMPFIRE', shortTitle: 'Campfire', subtitle: 'Plants, bread, and rhythm.', fieldNote: 'Away from the screen, Liam bakes bread, keeps plants alive, and trades drums for bass guitar.', color: '#db8872', material: 'stone', levelType: 'garden hearth', palette: ['#120704', '#4a2418', '#100604'],
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
    id: 'gate', level: 'LEVEL 08', title: 'THE LIGHTWELL SANCTUM', shortTitle: 'Lightwell Sanctum', subtitle: 'The final delivery is a fight.', color: '#e9e9e0', material: 'stone', levelType: 'boss arena', palette: ['#030a0d', '#102c31', '#020608'],
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
const STARTING_ROOM_INDEX = 1;
const FINAL_ROOM_INDEX = BOSS_ROOM_INDEX;
// Only the entrance, forest corridor, boss arena, and completed sanctuary are
// open to the sky. Every other authored dungeon room receives a ceiling.
const OPEN_AIR_ROOM_IDS = new Set(['entrance', 'gate', 'sanctuary']);
for (const room of rooms) room.roof = !OPEN_AIR_ROOM_IDS.has(room.id);

const ROOM_WIDTH = 22;
const ROOM_HEIGHT = 12;
const FINAL_ROOM_WIDTH = 30;
const FINAL_ROOM_HEIGHT = 18;
const ROOM_GAP = 4;
const FOREST_HALL_GAP = 88;
const FOREST_HALL_TREE_SPACING = 1.18;
const ROOM_INSET_X = 3;
const ROOM_INSET_Y = 2;
const ROOM_DOOR_Y = Math.floor(ROOM_HEIGHT / 2) - 1;
function gapAfterRoom(roomIndex) { return roomIndex === 0 ? FOREST_HALL_GAP : ROOM_GAP; }
const roomWidths = rooms.map((room, index) => index === BOSS_ROOM_INDEX || index === SANCTUARY_ROOM_INDEX ? FINAL_ROOM_WIDTH : (room.width || ROOM_WIDTH));
const roomHeights = rooms.map((room, index) => index === BOSS_ROOM_INDEX || index === SANCTUARY_ROOM_INDEX ? FINAL_ROOM_HEIGHT : (room.height || ROOM_HEIGHT));
const roomOffsets = rooms.map((_, index) => rooms.slice(0, index).reduce((offset, __, roomIndex) => offset + roomWidths[roomIndex] + gapAfterRoom(roomIndex), 0));
const WORLD_WIDTH = roomOffsets[roomOffsets.length - 1] + roomWidths[roomWidths.length - 1];
const WORLD_HEIGHT = Math.max(...roomHeights);
const worldMap = Array.from({ length: WORLD_HEIGHT }, () => Array(WORLD_WIDTH).fill('1'));
const FOREST_HALL_START = roomOffsets[0] + roomWidths[0];
const FOREST_HALL_END = roomOffsets[STARTING_ROOM_INDEX];
const FOREST_HALL_CENTER_Y = ROOM_DOOR_Y + 1;
const FOREST_HALL_GATE_HALF_WIDTH = 1.5;
const FOREST_HALL_TRIGGER_X = FOREST_HALL_START + FOREST_HALL_GAP * .22;
const FOREST_HALL_ROWS = [ROOM_DOOR_Y, ROOM_DOOR_Y + 1, ROOM_DOOR_Y + 2];
const FINAL_ROOM_OFFSET = roomOffsets[FINAL_ROOM_INDEX];
const BOSS_EXIT_POINT = { x: FINAL_ROOM_OFFSET + FINAL_ROOM_WIDTH - 3.2, y: 9 };
const SANCTUARY_ROOM_OFFSET = roomOffsets[SANCTUARY_ROOM_INDEX];
const SANCTUARY_RESUME_PEDESTAL = {
  id: 'sanctuary-resume-pedestal',
  roomIndex: SANCTUARY_ROOM_INDEX,
  x: SANCTUARY_ROOM_OFFSET + 15,
  y: 9,
  z: .04,
  title: 'LIAM HOSFELD / RÉSUMÉ',
};

function roomContentPoint(roomIndex, x, y) {
  if (roomIndex === BOSS_ROOM_INDEX || roomIndex === SANCTUARY_ROOM_INDEX) return { x, y };
  return { x: x + ROOM_INSET_X, y: y + ROOM_INSET_Y };
}

function expandedRoomMap(room, roomIndex) {
  const width = roomWidths[roomIndex];
  const height = roomHeights[roomIndex];
  const map = Array.from({ length: height }, (_, y) => Array.from({ length: width }, (_, x) => (x === 0 || y === 0 || x === width - 1 || y === height - 1) ? '1' : '0'));
  const doorRows = [ROOM_DOOR_Y, ROOM_DOOR_Y + 1];
  const centerY = Math.floor(height / 2);

  if (roomIndex !== BOSS_ROOM_INDEX && roomIndex !== SANCTUARY_ROOM_INDEX) {
    // Preserve each authored room while giving it a generous outer gallery and a
    // guaranteed two-cell east/west spine. The spine means no room can become a
    // dead-end simply because its showcase geometry blocks the exit.
    for (let y = 0; y < room.map.length; y += 1) {
      for (let x = 0; x < room.map[y].length; x += 1) map[y + ROOM_INSET_Y][x + ROOM_INSET_X] = room.map[y][x];
    }
    for (const y of doorRows) for (let x = 1; x < width - 1; x += 1) map[y][x] = '0';
    for (let y = 2; y < height - 2; y += 1) map[y][Math.floor(width / 2)] = '0';
    // Small side pockets add alternate routes without interrupting the main path.
    for (const y of [2, height - 3]) {
      for (let x = 8; x <= 12; x += 1) map[y][x] = '0';
      for (let x = width - 13; x <= width - 9; x += 1) map[y][x] = '0';
    }
    // Room 0 has an open-air armory clearing along its north edge. The authored
    // entrance map originally placed a decorative interior wall on row 2; clear
    // that row here so the armory cannot look blocked or behave like a hidden
    // collision wall beneath its floor dressing.
    if (roomIndex === 0) {
      // The lobby is a single open clearing: preserve only its outer perimeter
      // and the gate mouth. Interior authored walls would make the camp read as
      // a corridor instead of an open staging area.
      for (let y = 1; y < height - 1; y += 1) {
        for (let x = 1; x < width - 1; x += 1) map[y][x] = '0';
      }
    }
    return map.map((row) => row.join(''));
  }

  if (roomIndex === SANCTUARY_ROOM_INDEX) {
    // A wide, open room keeps the pedestal readable from the entrance. The
    // celestial look comes from the renderer; this map only handles collision.
    for (const y of [ROOM_DOOR_Y, ROOM_DOOR_Y + 1, centerY - 1, centerY]) {
      for (let x = 1; x < width - 1; x += 1) map[y][x] = '0';
    }
    for (const x of [5, width - 6]) {
      for (let y = 3; y < height - 3; y += 1) {
        if (![ROOM_DOOR_Y - 1, ROOM_DOOR_Y, ROOM_DOOR_Y + 1, ROOM_DOOR_Y + 2, centerY - 1, centerY].includes(y)) map[y][x] = '1';
      }
    }
    return map.map((row) => row.join(''));
  }

  // Floor 07 is a proper arena: a broad entry lane, a central combat bowl,
  // side galleries, and a clean route to the lightwell on the far wall.
  for (let y = 3; y < height - 3; y += 1) {
    if (![ROOM_DOOR_Y, ROOM_DOOR_Y + 1, centerY - 1, centerY].includes(y)) {
      map[y][8] = '1';
      map[y][width - 9] = '1';
    }
  }
  for (let x = 3; x < width - 3; x += 1) {
    if (x < 8 || x > width - 9) {
      map[4][x] = '1';
      map[height - 5][x] = '1';
    }
  }
  // Guaranteed entry and boss approach lanes.
  for (const y of [ROOM_DOOR_Y, ROOM_DOOR_Y + 1, centerY - 1, centerY]) {
    for (let x = 1; x < width - 1; x += 1) map[y][x] = '0';
  }
  // Break the divider edges into readable archways.
  for (const x of [8, width - 9]) {
    for (const y of [ROOM_DOOR_Y - 1, ROOM_DOOR_Y, ROOM_DOOR_Y + 1, ROOM_DOOR_Y + 2, centerY - 1, centerY]) map[y][x] = '0';
  }
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
  const corridorRows = roomIndex === 0 ? FOREST_HALL_ROWS : [ROOM_DOOR_Y, ROOM_DOOR_Y + 1];
  for (const y of corridorRows) {
    worldMap[y][roomOffsets[roomIndex] + roomWidths[roomIndex] - 1] = '0';
    for (let x = corridorStart; x < corridorStart + corridorGap; x += 1) worldMap[y][x] = '0';
    worldMap[y][roomOffsets[roomIndex + 1]] = '0';
  }
}
// Seal the forest side of the threshold chamber. This is a permanent world wall,
// not a room-state check, so the player cannot walk back into the forest after
// waking in the dungeon.
const FOREST_EXIT_WALL_X = FOREST_HALL_END;
for (const y of FOREST_HALL_ROWS) worldMap[y][FOREST_EXIT_WALL_X] = '1';

// The first chamber is a calm, open field lobby. Props sit around the perimeter
// while the center remains readable from the entrance to the archive gate.
// Each display has an authored yaw, so its geometry remains fixed in world space
// and never turns into a player-facing billboard.
const LOBBY_WEAPON_PATH_Y = ROOM_DOOR_Y + 1;
const LOBBY_ARMORY = {
  xStart: roomOffsets[0] + 6.35,
  xEnd: roomOffsets[0] + 19.35,
  backY: 2.25,
  weaponY: 3.45,
  aisleY: 4.55,
  frontY: 5.15,
};
// Keep the hearth visually to the player's left, outside the direct gate route.
const LOBBY_CAMPFIRE = {
  x: roomOffsets[0] + 4.75,
  y: 5.8,
};
const LOBBY_WEAPON_INTERACTION_RANGE = 1.2;
// The scroll is positioned after the gate is authored below. Keeping the
// initialization here limited to stable fields avoids touching LOBBY_GATE before
// its declaration has been assigned.
lobbyPortfolioScroll.z = .7;
lobbyPortfolioScroll.recovered = false;
const LOBBY_WEAPON_CREATURES = [
  { id: 'creature-ninja-star', type: 'stars', name: 'NINJA STARS', x: roomOffsets[0] + 8.35, y: LOBBY_ARMORY.weaponY, yaw: 0 },
  { id: 'creature-crossbow', type: 'crossbow', name: 'CROSSBOW', x: roomOffsets[0] + 11.55, y: LOBBY_ARMORY.weaponY, yaw: 0 },
  { id: 'creature-ember-wand', type: 'wand', name: 'EMBER WAND', x: roomOffsets[0] + 14.75, y: LOBBY_ARMORY.weaponY, yaw: 0 },
  { id: 'creature-moonsteel-blade', type: 'blade', name: 'MOONSTEEL BLADE', x: roomOffsets[0] + 17.95, y: LOBBY_ARMORY.weaponY, yaw: 0 },
];
// The gate belongs on the two-cell-wide east corridor mouth, not in the room's
// visual center. Its center is the midpoint of the actual opening rows.
LOBBY_GATE = { id: 'archive-gate', x: roomOffsets[0] + roomWidths[0] + .34, y: LOBBY_WEAPON_PATH_Y, z: 1.12, yaw: 0 };
// Keep the portfolio scroll just inside the gate-facing route.
lobbyPortfolioScroll.x = LOBBY_GATE.x - 2.6;
lobbyPortfolioScroll.y = LOBBY_GATE.y;
// A physical sign hangs above the entrance arch. Its lettering is projected
// onto the sign face so it remains part of the world rather than a HUD label.
const LOBBY_ENTRANCE_SIGN = {
  id: 'lobby-entrance-sign',
  x: LOBBY_GATE.x - .2,
  y: LOBBY_GATE.y,
  z: 2.72,
  width: 4.7,
  height: .78,
  yaw: 0,
  text: "Liam's Portfolio Journey",
};
const LOBBY_TREES = [
  // Keep the clearing open: trees live on the outer gallery edges, away from
  // the campfire, weapon keepers, scroll approach, and gate lane.
  { id: 'lobby-tree-west-north', roomIndex: 0, x: roomOffsets[0] + 2.35, y: 2.35, scale: .7, yaw: .12 },
  { id: 'lobby-tree-west-upper', roomIndex: 0, x: roomOffsets[0] + 2.45, y: 4.25, scale: .64, yaw: -.14 },
  { id: 'lobby-tree-west-lower', roomIndex: 0, x: roomOffsets[0] + 2.35, y: 7.65, scale: .7, yaw: .18 },
  { id: 'lobby-tree-west-south', roomIndex: 0, x: roomOffsets[0] + 2.65, y: 9.15, scale: .62, yaw: -.16 },
  { id: 'lobby-tree-northwest', roomIndex: 0, x: roomOffsets[0] + 6.05, y: 2.2, scale: .58, yaw: .16 },
  { id: 'lobby-tree-north-center', roomIndex: 0, x: roomOffsets[0] + 12.15, y: 2.15, scale: .62, yaw: -.2 },
  { id: 'lobby-tree-northeast', roomIndex: 0, x: roomOffsets[0] + 17.2, y: 2.25, scale: .6, yaw: .1 },
  { id: 'lobby-tree-east-north', roomIndex: 0, x: roomOffsets[0] + 19.65, y: 2.45, scale: .68, yaw: -.18 },
  { id: 'lobby-tree-east-upper', roomIndex: 0, x: roomOffsets[0] + 19.7, y: 4.35, scale: .62, yaw: .12 },
  { id: 'lobby-tree-east-lower', roomIndex: 0, x: roomOffsets[0] + 19.7, y: 7.85, scale: .68, yaw: -.16 },
  { id: 'lobby-tree-east-south', roomIndex: 0, x: roomOffsets[0] + 19.4, y: 9.15, scale: .62, yaw: .14 },
  { id: 'lobby-tree-southwest', roomIndex: 0, x: roomOffsets[0] + 6.65, y: 9.2, scale: .6, yaw: .16 },
  { id: 'lobby-tree-south-center', roomIndex: 0, x: roomOffsets[0] + 11.15, y: 9.3, scale: .58, yaw: -.2 },
  { id: 'lobby-tree-southeast', roomIndex: 0, x: roomOffsets[0] + 15.75, y: 9.2, scale: .62, yaw: .14 },
];

const LOBBY_BUSHES = [
  { id: 'lobby-bush-west-north', roomIndex: 0, x: roomOffsets[0] + 3.25, y: 2.05, scale: .72, yaw: .18 },
  { id: 'lobby-bush-west-middle', roomIndex: 0, x: roomOffsets[0] + 2.75, y: 6.55, scale: .62, yaw: -.12 },
  { id: 'lobby-bush-west-south', roomIndex: 0, x: roomOffsets[0] + 4.2, y: 9.45, scale: .68, yaw: .08 },
  { id: 'lobby-bush-north-left', roomIndex: 0, x: roomOffsets[0] + 8.25, y: 2.0, scale: .58, yaw: -.16 },
  { id: 'lobby-bush-north-right', roomIndex: 0, x: roomOffsets[0] + 15.05, y: 2.0, scale: .62, yaw: .14 },
  { id: 'lobby-bush-east-north', roomIndex: 0, x: roomOffsets[0] + 20.05, y: 3.05, scale: .64, yaw: -.18 },
  { id: 'lobby-bush-east-south', roomIndex: 0, x: roomOffsets[0] + 20.0, y: 8.95, scale: .66, yaw: .12 },
  { id: 'lobby-bush-south-left', roomIndex: 0, x: roomOffsets[0] + 8.85, y: 9.35, scale: .56, yaw: -.14 },
  { id: 'lobby-bush-south-right', roomIndex: 0, x: roomOffsets[0] + 17.55, y: 9.35, scale: .58, yaw: .16 },
];

const FOREST_HALL_TREES = [];
const FOREST_HALL_TREE_COUNT = Math.floor((FOREST_HALL_GAP - 2.4) / FOREST_HALL_TREE_SPACING);
for (let index = 0; index < FOREST_HALL_TREE_COUNT; index += 1) {
  const x = FOREST_HALL_START + 1.2 + index * FOREST_HALL_TREE_SPACING;
  const scale = .7 + (index % 5) * .075;
  const leftY = FOREST_HALL_CENTER_Y - .84 - (index % 2) * .07;
  const rightY = FOREST_HALL_CENTER_Y + .84 + (index % 2) * .07;
  FOREST_HALL_TREES.push(
    { id: `forest-hall-left-${index}`, roomIndex: 0, x, y: leftY, scale, yaw: .12 + (index % 4) * .17 },
    { id: `forest-hall-right-${index}`, roomIndex: 0, x: x + .3, y: rightY, scale: scale * (index % 3 ? .94 : 1.08), yaw: -.14 - (index % 5) * .12 },
  );
}

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

const GATE_TUTORIAL_SPELL = {
  id: 'archive-key',
  name: 'Archive Key',
  glyph: '⟐',
  color: '#6ce0c2',
  description: 'A tutorial sigil that can open the archive gate. It has no combat effect.',
  effect: 'opens the archive gate',
  kind: 'gate',
  tutorial: true,
};
const SPELL_FORMS = [
  { id: 'scope-sight', name: 'Scope Sight', glyph: '◎', color: '#6ce0c2', threshold: 50, cooldown: 6, description: 'Reveals enemies and recovered evidence through the walls for a few seconds.', effect: 'reveals the signal', kind: 'reveal' },
  { id: 'route-spark', name: 'Route Spark', glyph: '↗', color: '#e7ad67', threshold: 100, cooldown: 3.4, description: 'Launches a homing lightning orb that hunts a target through the chamber.', effect: 'marks the route', kind: 'homing' },
  { id: 'ledger-ward', name: 'Ledger Ward', glyph: '✦', color: '#e3c66e', threshold: 175, cooldown: 8, description: 'Raises a golden ward that sharply reduces incoming damage for seven seconds.', effect: 'guards the evidence', kind: 'ward' },
  { id: 'signal-thread', name: 'Signal Thread', glyph: '⌁', color: '#77a9e8', threshold: 275, cooldown: 4.2, description: 'Fires a blue chain that jumps from the first enemy into nearby targets.', effect: 'connects the message', kind: 'chain' },
  { id: 'archive-echo', name: 'Archive Echo', glyph: '◈', color: '#c58de6', threshold: 400, cooldown: 7, description: 'Restores vitality and slows hostile movement as useful history returns.', effect: 'recovers the context', kind: 'echo' },
  { id: 'forge-ember', name: 'Forge Ember', glyph: '✹', color: '#db8872', threshold: 525, cooldown: 3.8, description: 'Launches an explosive fireball with an area-of-effect impact.', effect: 'fires the iteration', kind: 'fireball' },
  { id: 'garden-bloom', name: 'Garden Bloom', glyph: '✽', color: '#6ce0c2', threshold: 650, cooldown: 8.5, description: 'Releases a healing pulse that also damages enemies around you.', effect: 'grows the next step', kind: 'bloom' },
  { id: 'gate-light', name: 'Gate Light', glyph: '△', color: '#e9e9e0', threshold: 800, cooldown: 10, description: 'A piercing beam that tears through every hostile target in its path.', effect: 'opens the next answer', kind: 'beam' },
];
const XP_PER_SCROLL = 25;
// Authored records are templates only. The live world starts empty and records
// are created at an enemy's position only after that enemy is defeated.
const recordDropTemplates = [];
const worldItems = [];
const droppedRecordIds = new Set();
const worldEnemies = [];
for (let roomIndex = 0; roomIndex < rooms.length; roomIndex += 1) {
  const room = rooms[roomIndex];
  const offset = roomOffsets[roomIndex];
  room.items.forEach((item) => {
    const point = roomContentPoint(roomIndex, item.x, item.y);
    recordDropTemplates.push({ ...item, x: point.x + offset, y: point.y, roomIndex });
  });
  if (roomIndex === 0) continue;
  room.enemies.forEach((enemy, index) => worldEnemies.push({
    ...enemy,
    x: roomContentPoint(roomIndex, enemy.x, enemy.y).x + offset,
    y: roomContentPoint(roomIndex, enemy.x, enemy.y).y,
    roomIndex,
    name: enemy.name,
    displayName: enemy.name,
    archetype: enemy.kind || 'archive-unknown',
    kind: enemy.kind || 'archive-unknown',
    maxHp: enemy.hp,
    cooldown: 0,
    attackTime: 0,
    attackHit: false,
    attackStyle: enemy.attackStyle || null,
    attackTarget: null,
    attackDuration: enemy.attackDuration || 0,
    hitTime: 0,
    walkPhase: index * 2.3,
    alerted: false,
    dead: false,
    deathTime: 0,
    dropTemplates: [],
  }));
}
// Give every authored scroll exactly one enemy owner. If the authored roster
// is smaller than the record pool, add archive wardens at the authored record
// positions so every scroll has a distinct monster to defeat.
for (let index = worldEnemies.length; index < recordDropTemplates.length; index += 1) {
  const template = recordDropTemplates[index];
  if (template.roomIndex === 0) continue;
  const kind = index % 3 === 0 ? 'warden' : index % 3 === 1 ? 'crawler' : 'ghoul';
  worldEnemies.push({
    id: `archive-warden-${index + 1}`,
    name: 'Archive Warden',
    displayName: 'Archive Warden',
    kind,
    archetype: kind,
    attackStyle: kind === 'crawler' ? 'ground' : 'melee',
    x: template.x,
    y: template.y,
    roomIndex: template.roomIndex,
    hp: kind === 'warden' ? 92 : 66,
    maxHp: kind === 'warden' ? 92 : 66,
    speed: kind === 'crawler' ? .28 : .36,
    damage: kind === 'warden' ? 10 : 7,
    color: kind === 'warden' ? '#b47469' : kind === 'crawler' ? '#b77754' : '#7db8ac',
    cooldown: .8,
    attackTime: 0,
    attackHit: false,
    attackTarget: null,
    attackDuration: 0,
    hitTime: 0,
    walkPhase: index * 1.7,
    alerted: false,
    dead: false,
    deathTime: 0,
    dropTemplates: [],
  });
}
function isClearForSpawn(x, y, radius = .26) {
  return !isWall(x - radius, y - radius) && !isWall(x + radius, y - radius) && !isWall(x - radius, y + radius) && !isWall(x + radius, y + radius);
}
function findWalkableSpawnPoint(x, y, roomIndex, occupied = []) {
  const startX = roomOffsets[roomIndex];
  const width = roomWidths[roomIndex];
  const height = roomHeights[roomIndex];
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
    'The record is a reminder that delivery is not complete until the outcome is usable.'
  ],
  'exit-seal': [
    'Return route: the final seal closes the archive loop and leads back to the portfolio lobby.',
    'The work remains available through the résumé, contact link, and LinkedIn record.'
  ]
};
for (const item of recordDropTemplates) {
  const extras = scrollEnrichment[item.id] || [
    `Archive context: ${rooms[item.roomIndex].subtitle}`,
    'Evidence standard: connect the requirement, the system behavior, the intervention, and the measurable outcome.'
  ];
  item.details = [...item.details, ...extras];
}

worldEnemies.forEach((enemy) => { enemy.dropTemplates = []; });
const recordOwnerIndexByRoom = new Map();
for (const template of recordDropTemplates) {
  if (template.roomIndex === 0) continue;
  const owners = worldEnemies.filter((enemy) => enemy.roomIndex === template.roomIndex);
  if (!owners.length) continue;
  const ownerIndex = recordOwnerIndexByRoom.get(template.roomIndex) || 0;
  owners[ownerIndex % owners.length].dropTemplates.push(template);
  recordOwnerIndexByRoom.set(template.roomIndex, ownerIndex + 1);
}
const initialEnemyData = worldEnemies.map((enemy) => ({ ...enemy, dropTemplates: [...enemy.dropTemplates] }));
const BOSS_MAX_HP = 720;
const BOSS_PHASES = [
  { name: 'PHASE I · THE BRIEF', threshold: 1, color: '#d99762' },
  { name: 'PHASE II · THE SYSTEM', threshold: .66, color: '#77a9e8' },
  { name: 'PHASE III · THE DELIVERY', threshold: .33, color: '#e9e9e0' },
];
function createFinalBoss() {
  return {
    id: 'operations-archon',
    name: 'THE OPERATIONS ARCHON',
    displayName: 'The Operations Archon',
    kind: 'archon',
    x: FINAL_ROOM_OFFSET + 15,
    y: 9,
    hp: BOSS_MAX_HP,
    maxHp: BOSS_MAX_HP,
    damage: 16,
    phase: 1,
    cooldown: 1.2,
    attackTime: 0,
    attackPattern: 0,
    patternTime: 0,
    attackTelegraph: null,
    hitTime: 0,
    shield: 0,
    dashTime: 0,
    summonTimer: 5,
    pulse: 0,
    dead: false,
    deathTime: 0,
    alerted: false,
    roomIndex: FINAL_ROOM_INDEX,
    boss: true,
  };
}

const lightGrid = new Float32Array(WORLD_WIDTH * WORLD_HEIGHT);

let ITEM_TOTAL = recordDropTemplates.length;
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
const STAMINA_MAX = 100;
const COMBO_WINDOW = 1.15;
const DODGE_COST = 24;
const DODGE_DURATION = .68;
const DODGE_SPEED = 10.8;
const ENEMY_STOP_DISTANCE = 2.18;
const ENEMY_ATTACK_DISTANCE = 2.34;
const MOVE_SPEED = 2.2;
const TURN_SPEED = 2.4;
const PITCH_SPEED = 1.65;
const EYE_HEIGHT = .58;
const FLOOR_Z = 0;
const CEILING_Z = 2.2;
const TAU = Math.PI * 2;
const spriteCache = new Map();
const textures = {};
const WEAPON_LOADOUTS = {
  stars: { label: 'Ninja Stars', description: 'A quick ranged throw: send a spinning star down the lane, chain the combo, and keep moving before the next throw.', range: 9.2, damage: 34, staminaCost: 12, comboMultipliers: [1, 1.12, 1.3], aim: .15, pitch: .2, hitAt: .48, knockback: .14, critChance: .08, critMultiplier: 1.7, duration: .62, cooldown: .28, impactColor: '#d8c18b', projectileType: 'ninja-star' },
  crossbow: { label: 'Crossbow', description: 'A patient precision tool: draw, release a fast bolt, then accept the longer reload before the next shot.', range: 8.5, damage: 48, staminaCost: 11, comboMultipliers: [1, 1.08, 1.2], aim: .12, pitch: .14, hitAt: .62, knockback: .1, critChance: .18, critMultiplier: 1.9, duration: 1.02, cooldown: .42, impactColor: '#f0d38d' },
  wand: { label: 'Ember Wand', description: 'An arcane area weapon: slower cast, long reach, color-matched fireballs, and splash damage around the impact.', range: 10.5, damage: 44, staminaCost: 14, comboMultipliers: [1, 1.1, 1.28], aim: .2, pitch: .26, hitAt: .56, knockback: .12, critChance: .1, critMultiplier: 1.65, duration: .86, cooldown: .44, impactColor: '#db8872', projectileType: 'wand-fireball' },
  blade: { label: 'Moonsteel Blade', description: 'A dependable melee weapon: close the distance, chain three sweeping strikes, and stagger dangerous targets with the finisher.', range: 2.85, damage: 58, staminaCost: 16, comboMultipliers: [1, 1.18, 1.55], aim: .42, pitch: .52, hitAt: .42, knockback: .28, stagger: .24, critChance: .12, critMultiplier: 1.8, duration: .7, cooldown: .24, impactColor: '#b8f0e2', melee: true },
};
const ENEMY_PROFILES = {
  wraith: { scale: .54, height: 1.14, aimHeight: .84, speedMultiplier: 1.08, attackRate: 1.1, attackDistance: 2.2, opacity: .82, hover: .07, color: '#ae6fd0' },
  imp: { scale: .39, height: .72, aimHeight: .52, speedMultiplier: 1.28, attackRate: 1.12, attackDistance: 2.12, opacity: 1, color: '#bd6b72' },
  crawler: { scale: .42, height: .44, aimHeight: .28, speedMultiplier: .82, attackRate: .95, attackDistance: 4.0, preferredDistance: 3.0, attackStyle: 'ground', opacity: 1, color: '#b77754', attackColor: '#d76b49' },
  ghoul: { scale: .5, height: 1.04, aimHeight: .76, speedMultiplier: .92, attackRate: 1.05, attackDistance: 2.26, opacity: 1, color: '#7db8ac' },
  beast: { scale: .55, height: .84, aimHeight: .52, speedMultiplier: .94, attackRate: 1.08, attackDistance: 4.15, preferredDistance: 3.1, attackStyle: 'ground', opacity: 1, color: '#9b6bd0', attackColor: '#b967d2' },
  moth: { scale: .46, height: 1.04, aimHeight: .8, speedMultiplier: 1.2, attackRate: 1.1, attackDistance: 9.2, preferredDistance: 6.1, attackStyle: 'ranged', opacity: .9, hover: .11, color: '#dfae65', attackColor: '#f2bd61' },
  hound: { scale: .5, height: .72, aimHeight: .45, speedMultiplier: 1.4, attackRate: 1.18, attackDistance: 2.24, opacity: 1, color: '#b76b66' },
  leech: { scale: .36, height: .38, aimHeight: .24, speedMultiplier: 1.12, attackRate: 1.02, attackDistance: 2.04, opacity: 1, color: '#7d9bd1' },
  seer: { scale: .5, height: 1.28, aimHeight: .94, speedMultiplier: .72, attackRate: .78, attackDistance: 10.5, preferredDistance: 6.8, attackStyle: 'ranged', opacity: .96, color: '#78b6d0', attackColor: '#78d9e8' },
  quake: { scale: .64, height: 1.18, aimHeight: .7, speedMultiplier: .62, attackRate: .86, attackDistance: 4.1, preferredDistance: 3.1, attackStyle: 'ground', opacity: 1, color: '#cf8b5e', attackColor: '#d76b49' },
  warden: { scale: .62, height: 1.34, aimHeight: 1.03, speedMultiplier: .68, attackRate: .82, attackDistance: 2.48, opacity: 1, color: '#b47469' },
  cockroach: { scale: .42, height: .56, aimHeight: .3, speedMultiplier: .92, attackRate: .88, attackDistance: 2.02, opacity: 1, color: '#80634a' },
  archon: { scale: 1.08, height: 2.85, aimHeight: 1.92, speedMultiplier: .42, attackRate: .78, attackDistance: 2.7, opacity: 1, color: '#d7c79b' },
};
const EMPTY_ENEMY_PROFILE = { scale: .46, height: .98, aimHeight: .78, speedMultiplier: 1, attackRate: 1, attackDistance: ENEMY_ATTACK_DISTANCE, opacity: 0, color: '#000000' };
function enemyProfile(enemy) { return ENEMY_PROFILES[enemy?.kind] || EMPTY_ENEMY_PROFILE; }

const MAX_RENDER_WIDTH = 1280;
const MAX_RENDER_HEIGHT = 720;

const state = {
  room: 0,
  player: { x: roomOffsets[0] + roomContentPoint(0, rooms[0].spawn.x, rooms[0].spawn.y).x, y: roomContentPoint(0, rooms[0].spawn.x, rooms[0].spawn.y).y, angle: rooms[0].spawn.angle, pitch: 0, hp: 100 },
  keys: new Set(),
  stamina: STAMINA_MAX,
  maxStamina: STAMINA_MAX,
  staminaRegenDelay: 0,
  moonProgress: 0,
  combo: 0,
  comboTimer: 0,
  dodgeTime: 0,
  dodgeCooldown: 0,
  dodgeInvulnerable: 0,
  dodgeVx: 0,
  dodgeVy: 0,
  dodgeRoll: 0,
  dodgeCameraDrop: 0,
  dodgeDirection: { x: 1, y: 0 },
  dodgeProgress: 0,
  dodgeImpact: 0,
  dodgeTrailTimer: 0,
  lobbyGateOpen: false,
  lobbyGateProgress: 0,
  lobbyGateOpening: false,
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
  mouseLook: false,
  pointerLocked: false,
  zBuffer: new Float32Array(RAY_COUNT),
  floorBase: new Float32Array(RAY_COUNT),
  weapon: { type: 'stars', equipped: false, swing: 0, hit: false, cooldown: 0, bobPhase: 0, moving: false, projectile: 0, attackDamage: 0, comboStep: 0, attackHitAt: 0 },
  xp: 0,
  level: 0,
  unlockedSpells: new Set(),
  lastSpell: null,
  selectedSpellId: null,
  tutorialSpell: false,
  spellCast: null,
  spellCooldown: 0,
  activeSpellEffects: [],
  projectiles: [],
  impactBursts: [],
  particles: [],
  damageNumbers: [],
  ambientParticleTimer: 0,
  spellFocusParticleTimer: 0,
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
  forestTransition: null,
  launchTransition: null,
  finalBoss: createFinalBoss(),
  damageFlash: 0,
  shakeTime: 0,
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
  menuActive: false,
  visitedFloors: new Set(),
  floorAnnouncement: null,
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
  activeSpellEffects: state.activeSpellEffects.length,
  runtimeErrorCount: state.runtimeErrorCount,
  lastRuntimeError: state.lastRuntimeError,
});

const MEDIEVAL_COLORS = {
  '#6ce0c2': '#b18752', '#e7ad67': '#d5a150', '#c58de6': '#76566d', '#77a9e8': '#5d7582',
  '#e3c66e': '#c29a4c', '#db8872': '#9a5140', '#e9e9e0': '#d7c79b', '#ae6fd0': '#735a65',
  '#bd6b72': '#8e473b', '#b77754': '#815033', '#7db8ac': '#5d756c', '#9b6bd0': '#6b526d',
  '#dfae65': '#b17d3b', '#668ed0': '#5c697c', '#b76b66': '#824238', '#cf9b5e': '#966530',
  '#7d9bd1': '#566a78', '#d16f63': '#934236', '#c7a359': '#a17c39', '#b47469': '#804338', '#8b77c9': '#655274',
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

/* Deterministic value noise drives the wood, wall stone, and floor stone formulas. */
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
  const texture = document.createElement('canvas'); texture.width = size; texture.height = size; const image = texture.getContext('2d').createImageData(size, size);
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
    const n = fractalNoise(x / 42, y / 42, seed); const marble = Math.sin(x * .033 + y * .021 + n * 5.5 + Math.sin(y * .061) * 1.7); const vein = Math.pow(clamp(1 - Math.abs(marble), 0, 1), 11) * (.35 + n); const crack = Math.pow(clamp(1 - Math.abs(Math.sin(x * .011 - y * .029 + n * 8)), 0, 1), 22) * .55; const speck = hash2(x * .7, y * .7, seed + 9) > .985 ? 22 : 0; const base = 67 + n * 43 - vein * 28 - crack * 20 + speck; const i = (y * size + x) * 4;
    image.data[i] = clamp(base + 10, 0, 255); image.data[i + 1] = clamp(base + 13, 0, 255); image.data[i + 2] = clamp(base + 12, 0, 255); image.data[i + 3] = 255;
  }
  texture.getContext('2d').putImageData(image, 0, 0); return texture;
}

function createBoneTexture(size, seed) {
  const texture = document.createElement('canvas'); texture.width = size; texture.height = size;
  const image = texture.getContext('2d').createImageData(size, size);
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
    const n = valueNoise(x / 18, y / 18, seed) * .7 + valueNoise(x / 5, y / 5, seed + 5) * .3;
    const grain = .5 + .5 * Math.sin(y * .24 + x * .035 + n * 4);
    const crack = Math.pow(clamp(1 - Math.abs(Math.sin(x * .19 - y * .11 + n * 8)), 0, 1), 18);
    const base = 70 + n * 42 + grain * 17 - crack * 30;
    const i = (y * size + x) * 4;
    image.data[i] = clamp(base + 37, 0, 255);
    image.data[i + 1] = clamp(base + 31, 0, 255);
    image.data[i + 2] = clamp(base + 21, 0, 255);
    image.data[i + 3] = 255;
  }
  texture.getContext('2d').putImageData(image, 0, 0); return texture;
}
function createSteelTexture(size, seed) {
  const texture = document.createElement('canvas'); texture.width = size; texture.height = size;
  const image = texture.getContext('2d').createImageData(size, size);
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
    const n = valueNoise(x / 18, y / 18, seed);
    const polish = .5 + .5 * Math.sin(x * .34 + n * 2.4);
    const scratch = Math.pow(clamp(1 - Math.abs(Math.sin(y * .7 + x * .08 + n * 9)), 0, 1), 26);
    const base = 69 + n * 41 + polish * 23 + scratch * 22;
    const i = (y * size + x) * 4;
    image.data[i] = clamp(base + 12, 0, 255); image.data[i + 1] = clamp(base + 14, 0, 255); image.data[i + 2] = clamp(base + 13, 0, 255); image.data[i + 3] = 255;
  }
  texture.getContext('2d').putImageData(image, 0, 0); return texture;
}
function createLeatherTexture(size, seed) {
  const texture = document.createElement('canvas'); texture.width = size; texture.height = size;
  const image = texture.getContext('2d').createImageData(size, size);
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
    const n = valueNoise(x / 10, y / 10, seed); const grain = .5 + .5 * Math.sin(y * .48 + Math.sin(x * .13) * 2 + n * 3); const base = 36 + n * 24 + grain * 17; const i = (y * size + x) * 4;
    image.data[i] = clamp(base + 29, 0, 255); image.data[i + 1] = clamp(base + 12, 0, 255); image.data[i + 2] = clamp(base, 0, 255); image.data[i + 3] = 255;
  }
  texture.getContext('2d').putImageData(image, 0, 0); return texture;
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
      r: 178 + shimmer * 42 - grout * 28,
      g: 222 + shimmer * 28 - grout * 22,
      b: 214 + shimmer * 35 - grout * 17,
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
      r: 83 + variation - moss * 10,
      g: 111 + variation + moss * 18,
      b: 89 + variation * .72 + moss * 7,
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
    [71, 73, 66],
    [70, 61, 53],
    [53, 50, 61],
    [52, 64, 76],
    [68, 56, 51],
    [49, 65, 66],
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

function isWall(x, y) { const cellX = Math.floor(x); const cellY = Math.floor(y); if (cellY < 0 || cellY >= WORLD_HEIGHT || cellX < 0 || cellX >= WORLD_WIDTH) return true; return worldMap[cellY][cellX] === '1'; }
function lobbyGateBlocksPath(x, y) {
  if (state.lobbyGateOpen || !LOBBY_GATE || state.room !== 0) return false;
  const gateDepth = x > LOBBY_GATE.x - .72 && x < LOBBY_GATE.x + .7;
  const gateWidth = Math.abs(y - LOBBY_GATE.y) < FOREST_HALL_GATE_HALF_WIDTH + .08;
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
  const hostiles = worldEnemies.filter((enemy) => enemy.roomIndex === state.room && enemy.roomIndex !== 0 && !enemy.dead);
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
function focalX() { return canvas.width / (2 * Math.tan(FOV / 2)); }
function focalY() { return canvas.height / (2 * Math.tan(VERTICAL_FOV / 2)); }
function projectY(z, forward) { return canvas.height / 2 + Math.tan(state.player.pitch - Math.atan2(z - EYE_HEIGHT, Math.max(.01, forward))) * focalY(); }
function cameraPoint(x, y, z) { const dx = x - state.player.x; const dy = y - state.player.y; return { side: -dx * Math.sin(state.player.angle) + dy * Math.cos(state.player.angle), forward: dx * Math.cos(state.player.angle) + dy * Math.sin(state.player.angle), z }; }
function projectCameraPoint(point) { if (point.forward <= .04) return null; return { x: canvas.width / 2 + point.side * focalX() / point.forward, y: projectY(point.z, point.forward), depth: point.forward }; }

function emitAmbientParticles(delta) {
  state.ambientParticleTimer -= delta;
  if (state.ambientParticleTimer > 0) return;
  state.ambientParticleTimer = settings.reducedMotion ? .34 : .13;
  if (state.doorOfLight?.active && state.room === FINAL_ROOM_INDEX && Math.random() < .82) spawnParticles(state.doorOfLight.x, state.doorOfLight.y, .8, ['#b8f0e2', '#fff8db'], 2, { speed: .72, life: .9, size: .62, upward: .75, spread: TAU, gravity: -.1, drag: .97, glow: 16, shape: 'dot' });
}

function updateCombatHud() {
  const hudNow = state.now || performance.now();
  if (hudNow - state.lastCombatHudAt < 0.05) return;
  state.lastCombatHudAt = hudNow;
  const definition = weaponDefinition();
  const spell = selectedSpellDefinition();
  const weaponBusy = state.weapon.equipped && state.weapon.swing > 0;
  const weaponCooling = state.weapon.equipped && state.weapon.cooldown > 0;
  const weaponPhase = !state.weapon.equipped ? 'NO WEAPON' : weaponBusy ? (state.weapon.type === 'stars' ? 'THROWING' : state.weapon.type === 'crossbow' ? 'LOADING' : state.weapon.type === 'blade' ? 'SWINGING' : 'CASTING') : weaponCooling ? 'RECOVERING' : 'READY';
  const weaponTimer = weaponBusy ? state.weapon.swing : state.weapon.cooldown;
  const weaponTotal = weaponBusy ? definition.duration : Math.max(definition.cooldown || .01, .01);
  const weaponProgress = clamp(1 - weaponTimer / weaponTotal, 0, 1);
  if (weaponHudLabel) weaponHudLabel.textContent = state.weapon.equipped ? `${definition.label.toUpperCase()} · ${state.weapon.type === 'blade' ? 'MELEE' : state.weapon.type === 'stars' ? 'RANGED' : state.weapon.type === 'crossbow' ? 'PRECISION' : 'ARCANE'}` : 'NO WEAPON';
  if (weaponStatus) weaponStatus.textContent = weaponPhase;
  const staminaPercent = clamp(state.stamina / state.maxStamina * 100, 0, 100);
  const staminaNow = Math.ceil(state.stamina);
  if (staminaValue) staminaValue.textContent = `${staminaNow} / ${state.maxStamina}`;
  if (staminaBar) staminaBar.style.width = `${staminaPercent}%`;
  staminaBar?.parentElement?.setAttribute('aria-valuenow', String(staminaNow));
  const aimNow = state.now || performance.now();
  const aimActive = !state.menuActive && !state.reading && !state.transition && !state.forestTransition && !state.launchTransition;
  if (!aimActive) state.aimTarget = null;
  else if (aimNow - state.lastAimTargetAt > 100 || state.lastAimTargetRoom !== state.room) {
    state.lastAimTargetAt = aimNow;
    state.lastAimTargetRoom = state.room;
    state.aimTarget = findAimTarget();
  }
  aimReticle?.classList.toggle('has-target', Boolean(state.aimTarget));
  aimReticle?.classList.toggle('has-spell', Boolean(spell));
}

function updateHud() {
  const active = worldEnemies.filter((enemy) => enemy.roomIndex !== 0 && enemy.roomIndex === state.room && !enemy.dead).length;
  const bossActive = state.room === FINAL_ROOM_INDEX && state.finalBoss && !state.finalBoss.dead;
  const recovered = worldItems.reduce((count, item) => count + (item.recovered && item.kind !== 'health-potion' ? 1 : 0), 0);
  const xpSignature = `${state.xp}|${state.level}|${[...state.unlockedSpells].join(',')}|${state.selectedSpellId || ''}`;
  const bossSignature = bossActive ? `${state.finalBoss.hp}|${state.finalBoss.phase}|${state.finalBoss.shield}` : 'none';
  const signature = `${state.room}|${active}|${recovered}|${ITEM_TOTAL}|${Math.ceil(state.player.hp)}|${xpSignature}|${bossSignature}|${state.doorOfLight?.active ? 1 : 0}`;
  if (signature !== state.hudSignature) {
    state.hudSignature = signature;
    const room = rooms[state.room];
    const threatCount = active + (bossActive ? 1 : 0);
    roomFloor.textContent = room.level;
    roomCount.textContent = `${String(state.room + 1).padStart(2, '0')} / ${String(rooms.length).padStart(2, '0')}`;
    const hpNow = Math.ceil(state.player.hp);
    const hpPercent = clamp(state.player.hp, 0, 100);
    hpValue.textContent = `${hpNow} / 100`;
    hpBar.style.width = `${hpPercent}%`;
    hpBar.parentElement?.setAttribute('aria-valuenow', String(hpNow));
    if (experienceValue) experienceValue.textContent = `LVL ${state.level} · ${state.xp} XP`;
    if (objectiveLabel && objectiveDetail) {
      if (state.room === SANCTUARY_ROOM_INDEX) {
        objectiveLabel.textContent = state.resumeDownloaded ? 'RÉSUMÉ SECURED' : 'CLAIM THE RÉSUMÉ';
        objectiveDetail.textContent = state.resumeDownloaded ? 'The PDF is downloading. The sanctuary is yours.' : 'Approach the illuminated pedestal. The résumé downloads automatically.';
      } else if (bossActive) {
        objectiveLabel.textContent = `DEFEAT THE OPERATIONS ARCHON · PHASE ${state.finalBoss.phase}`;
        objectiveDetail.textContent = state.finalBoss.shield > 0 ? 'Break the active lattice shield, then keep pressure on the core.' : 'Read the attack rhythm and make the next delivery count.';
      } else if (state.doorOfLight?.active) {
        objectiveLabel.textContent = 'ENTER THE DOOR OF LIGHT';
        objectiveDetail.textContent = 'The ascension gate is now active. Walk into its light to enter the celestial sanctuary.';
      } else {
        objectiveLabel.textContent = 'RECOVER FIELD RECORDS';
        objectiveDetail.textContent = recovered >= ITEM_TOTAL ? 'All records recovered. Continue toward the lightwell.' : room.subtitle;
      }
    }
    if (bossPlaque) bossPlaque.hidden = true;
    if (bossBottomHud) bossBottomHud.hidden = !bossActive;
    if (bossActive) {
      const phaseLabel = `${BOSS_PHASES[state.finalBoss.phase - 1].name}${state.finalBoss.shield > 0 ? ' · SHIELD ACTIVE' : ''}`;
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
  updateCombatHud();
}
let toastTimeout = 0;
function showToast(text, tone = '') { clearTimeout(toastTimeout); toast.textContent = text; toast.hidden = false; toast.className = `toast visible${tone ? ` ${tone}` : ''}`; toastTimeout = window.setTimeout(() => { toast.classList.remove('visible'); window.setTimeout(() => { toast.hidden = true; }, 220); }, 2500); }

function showHitMarker(label = 'HIT', tone = 'hit') {
  if (!hitMarker) return;
  clearTimeout(hitMarkerTimeout);
  hitMarker.hidden = false;
  hitMarker.className = `hit-marker ${tone}`;
  if (hitMarkerSymbol) hitMarkerSymbol.textContent = tone === 'miss' ? '×' : tone === 'blocked' || tone === 'shielded' ? '◇' : '✦';
  if (hitMarkerLabel) hitMarkerLabel.textContent = label;
  hitMarkerTimeout = window.setTimeout(() => { hitMarker.hidden = true; }, settings.reducedMotion ? 360 : 620);
}

function spawnScrollDropEffect(x, y, color) {
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
function spawnSpellParticles(spell, origin, direction = { x: 0, y: 0, z: 0 }) {
  if (!spell || !origin) return;
  const color = spell.color;
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
  const profile = profiles[spell.kind] || { shape: 'dot', speed: 1.2, life: .62, size: .28, spread: TAU, gravity: .02 };
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
  if (spell.kind === 'fireball' || spell.kind === 'chain' || spell.kind === 'homing') {
    spawnParticles(origin.x, origin.y, origin.z, color, reduced ? 1 : 2, {
      speed: .65,
      life: .48,
      size: .18,
      spread: TAU,
      gravity: -.04,
      glow: 10,
      shape: spell.kind === 'fireball' ? 'ember' : spell.kind === 'chain' ? 'thread' : 'star',
    });
  }
}
function spawnSpellImpactParticles(kind, x, y, z, color, scale = 1) {
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
function spawnSpellTrailParticle(projectile) {
  if (!projectile?.spell || !projectile.spellKind) return;
  const shape = projectile.spellKind === 'fireball' ? 'ember' : projectile.spellKind === 'chain' ? 'thread' : projectile.spellKind === 'homing' ? 'star' : 'dot';
  spawnParticles(projectile.x, projectile.y, projectile.z, projectile.color, 1, { speed: .3, life: .28, size: .16, upward: .08, spread: projectile.spellKind === 'chain' ? .55 : TAU, angle: Math.atan2(projectile.vy, projectile.vx), gravity: .12, drag: .95, glow: 9, shape, trail: true });
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
  const drawLimit = settings.reducedMotion ? MAX_REDUCED_PARTICLE_DRAW : Math.round(MAX_PARTICLE_DRAW * state.renderQuality);
  let drawn = 0;
  for (const particle of state.particles) {
    if (drawn >= drawLimit) break;
    const camera = cameraPoint(particle.x, particle.y, particle.z);
    if (camera.forward <= .04 || Math.abs(Math.atan2(camera.side, camera.forward)) > FOV * .95) continue;
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
    ctx.shadowBlur = particle.glow * fade;
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
function spawnDamageNumber(x, y, z, value, color = '#f0ddaf', options = {}) {
  if (settings.reducedMotion && state.damageNumbers.length > 4) return;
  state.damageNumbers.push({ x, y, z, text: String(value), color, critical: Boolean(options.critical), shield: Boolean(options.shield), elapsed: 0, duration: settings.reducedMotion ? .45 : options.critical ? .95 : .8 });
  if (state.damageNumbers.length > 24) state.damageNumbers.splice(0, state.damageNumbers.length - 24);
}
function updateDamageNumbers(delta) {
  state.damageNumbers = state.damageNumbers.filter((number) => { number.elapsed += delta; number.z += delta * .32; return number.elapsed < number.duration; });
}
function drawDamageNumbers() {
  for (const number of state.damageNumbers) {
    const point = projectCameraPoint(cameraPoint(number.x, number.y, number.z));
    if (!point) continue;
    const progress = clamp(number.elapsed / number.duration, 0, 1);
    ctx.save(); ctx.globalAlpha = 1 - progress; ctx.fillStyle = number.color; ctx.shadowBlur = number.critical ? 14 : 8; ctx.shadowColor = number.color; ctx.font = `${number.critical ? 'bold' : '600'} ${Math.max(10, canvas.height * (number.critical ? .032 : .027))}px ${number.shield ? 'DM Mono' : 'Georgia'}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(number.text, point.x, point.y); ctx.restore();
  }
}

const MUSIC_PATTERNS = {
  dungeon: {
    // D-minor fragments, long rests, and a low drone: more stone corridor than arcade loop.
    tempo: 40,
    melody: [146, 0, 174, 0, 130, 0, 116, 0, 146, 0, 196, 0, 174, 0, 130, 0],
    bass: [36.7, 36.7, 43.7, 43.7, 32.7, 32.7, 29.1, 29.1, 36.7, 36.7, 43.7, 43.7, 34.6, 34.6, 29.1, 29.1],
    drone: [36.7, 43.7, 32.7, 29.1],
    melodyType: 'sine',
    bassType: 'triangle',
    noteLength: 1.7,
    melodyVolume: .009,
    bassVolume: .021,
    droneVolume: .008,
    droneEvery: 16,
    kickEvery: 0,
    hatEvery: 0,
  },
  boss: {
    tempo: 54,
    melody: [146, 0, 174, 0, 196, 174, 130, 0, 146, 0, 116, 0, 130, 116, 146, 0],
    bass: [36.7, 36.7, 43.7, 43.7, 32.7, 32.7, 29.1, 29.1, 36.7, 36.7, 43.7, 43.7, 27.5, 27.5, 32.7, 32.7],
    drone: [36.7, 32.7, 29.1, 27.5],
    melodyType: 'triangle',
    bassType: 'sine',
    noteLength: 1.25,
    melodyVolume: .013,
    bassVolume: .027,
    droneVolume: .011,
    droneEvery: 8,
    kickEvery: 8,
    hatEvery: 0,
  },
};
const music = { enabled: true, playing: false, timer: 0, nextTime: 0, step: 0, mode: 'dungeon' };
function ensureAudioContext() {
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume?.();
    return audioContext;
  } catch {
    return null;
  }
}
function scheduleChipNote(frequency, time, duration, type, volume, detune = 0) {
  const audio = ensureAudioContext();
  if (!audio || !frequency) return;
  const oscillator = audio.createOscillator();
  const effectiveVolume = volume * settings.musicVolume;
  const gain = audio.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, time);
  oscillator.detune.setValueAtTime(detune, time);
  gain.gain.setValueAtTime(.0001, time);
  gain.gain.exponentialRampToValueAtTime(Math.max(.0001, effectiveVolume), time + .008);
  gain.gain.setValueAtTime(Math.max(.0001, effectiveVolume * .72), time + Math.min(duration * .28, .055));
  gain.gain.exponentialRampToValueAtTime(.0001, time + duration);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(time);
  oscillator.stop(time + duration + .025);
}
function scheduleChipKick(time, boss = false) {
  scheduleChipNote(boss ? 74 : 92, time, .11, 'square', boss ? .045 : .032);
  scheduleChipNote(boss ? 38 : 52, time + .018, .16, 'triangle', boss ? .034 : .022);
}
function scheduleChipHat(time, boss = false) {
  scheduleChipNote(boss ? 1300 : 1800, time, .025, 'square', boss ? .014 : .009, Math.random() * 80 - 40);
}
function scheduleMusicStep(time, step, mode, stepDuration) {
  const pattern = MUSIC_PATTERNS[mode] || MUSIC_PATTERNS.dungeon;
  const boss = mode === 'boss';
  const melody = pattern.melody[step % pattern.melody.length];
  const bass = pattern.bass[step % pattern.bass.length];
  const noteDuration = stepDuration * (pattern.noteLength || 1);
  if (melody) {
    scheduleChipNote(melody, time, noteDuration, pattern.melodyType || 'triangle', pattern.melodyVolume || .018);
    if (step % 8 === 4) scheduleChipNote(melody * 2, time + .018, noteDuration * .42, 'sine', (pattern.melodyVolume || .018) * .34, 5);
  }
  if (bass) scheduleChipNote(bass, time, noteDuration * 1.12, pattern.bassType || 'triangle', pattern.bassVolume || .026);
  if (pattern.drone && step % (pattern.droneEvery || 8) === 0) {
    const drone = pattern.drone[Math.floor(step / (pattern.droneEvery || 8)) % pattern.drone.length];
    scheduleChipNote(drone, time, stepDuration * (pattern.droneEvery || 8) * 1.18, 'sine', pattern.droneVolume || .012);
  }
  if (pattern.kickEvery && step % pattern.kickEvery === 0) scheduleChipKick(time, boss);
  if (pattern.hatEvery && step % pattern.hatEvery === pattern.hatEvery - 1) scheduleChipHat(time, boss);
}
function musicScheduler() {
  const audio = ensureAudioContext();
  if (!music.playing || !music.enabled || !audio) return;
  const pattern = MUSIC_PATTERNS[music.mode] || MUSIC_PATTERNS.dungeon;
  const stepDuration = 60 / pattern.tempo / 4;
  while (music.nextTime < audio.currentTime + .24) {
    scheduleMusicStep(music.nextTime, music.step, music.mode, stepDuration);
    music.nextTime += stepDuration;
    music.step += 1;
  }
  music.timer = window.setTimeout(musicScheduler, 55);
}
function updateMusicButton() {
  if (!musicButton) return;
  musicButton.textContent = music.enabled ? '♫' : '×♫';
  musicButton.setAttribute('aria-label', music.enabled ? 'Mute generated chiptune music' : 'Enable generated chiptune music');
  musicButton.title = music.enabled ? 'Mute generated chiptune music' : 'Enable generated chiptune music';
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
  musicScheduler();
  updateMusicButton();
}
function stopMusic() {
  music.playing = false;
  window.clearTimeout(music.timer);
  music.timer = 0;
  updateMusicButton();
}
function setMusicMode(mode) {
  if (!MUSIC_PATTERNS[mode]) return;
  if (music.mode === mode) return;
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
  playTone(48, .42, 'square', .045);
  playTone(73, .72, 'sawtooth', .035, .18);
  playTone(29, 1.1, 'triangle', .04, .72);
  playTone(118, .18, 'square', .025, 2.18);
}
function playLaunchSound() {
  playTone(98, .42, 'sine', .018);
  playTone(147, .54, 'triangle', .016, .16);
  playTone(196, .66, 'sine', .014, .34);
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
  ctx.fillText('OPENING THE FIELD RECORD', centerX, height * .59);
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

function beginForestTransition() {
  if (state.forestTransition || state.transition || state.room !== 0 || !state.lobbyGateOpen) return;
  state.forestTransition = { elapsed: 0, duration: 7.2, attacked: false, teleported: false };
  state.keys.clear();
  state.mouseAttack = false;
  state.mouseLook = false;
  state.promptSignature = 'forest-transition';
  showToast('The forest hallway narrows around you.', 'danger');
  playTone(110, .26, 'triangle', .022);
}
function finishForestTransition() {
  const spawn = roomContentPoint(STARTING_ROOM_INDEX, rooms[STARTING_ROOM_INDEX].spawn.x, rooms[STARTING_ROOM_INDEX].spawn.y);
  state.player.x = roomOffsets[STARTING_ROOM_INDEX] + spawn.x;
  state.player.y = spawn.y;
  state.player.angle = rooms[STARTING_ROOM_INDEX].spawn.angle;
  state.player.pitch = 0;
  state.room = STARTING_ROOM_INDEX;
  state.player.hp = Math.max(1, state.player.hp - 8);
  state.damageFlash = .76;
  state.shakeTime = settings.reducedMotion ? .16 : .5;
  setMusicMode('dungeon');
  updateHud();
  playTone(55, .42, 'sawtooth', .04);
  playTone(110, .54, 'square', .026, .1);
  playTone(220, .62, 'triangle', .018, .23);
}
function updateForestTransition(delta) {
  const transition = state.forestTransition;
  if (!transition) return;
  transition.elapsed += delta;
  if (!transition.attacked && transition.elapsed >= .24) {
    transition.attacked = true;
    state.damageFlash = .9;
    state.shakeTime = settings.reducedMotion ? .22 : .95;
    spawnParticles(state.player.x, state.player.y, .68, ['#b74d43', '#e7ad67', '#292017'], settings.reducedMotion ? 8 : 20, { speed: 1.4, life: .7, size: .72, upward: .45, spread: TAU, gravity: .16, glow: 12, trail: true });
    showToast('Something attacks from behind.', 'danger');
    playTone(42, .32, 'sawtooth', .05);
    playTone(84, .45, 'square', .035, .12);
  }
  if (!transition.teleported && transition.elapsed >= 4.35) {
    transition.teleported = true;
    finishForestTransition();
  }
  if (transition.elapsed >= transition.duration) state.forestTransition = null;
}
function drawForestTransition(now) {
  const transition = state.forestTransition;
  if (!transition) return;
  const elapsed = transition.elapsed;
  const width = canvas.width;
  const height = canvas.height;
  const fadeIn = clamp((elapsed - .2) / 1.15, 0, 1);
  const wake = clamp((elapsed - 5.25) / 1.55, 0, 1);
  const blackout = elapsed < .2 ? 0 : elapsed < 1.35 ? fadeIn : elapsed < 5.25 ? 1 : 1 - wake;
  ctx.save();
  ctx.fillStyle = `rgba(2, 2, 2, ${clamp(blackout, 0, 1)})`;
  ctx.fillRect(0, 0, width, height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f0ddaf';
  ctx.shadowBlur = 18;
  ctx.shadowColor = '#244936';
  ctx.font = `bold ${Math.max(16, height * .038)}px Georgia`;
  const message = elapsed < 1.35
    ? 'THE FOREST HALL'
    : elapsed < 2.15
      ? 'SOMETHING ATTACKS FROM BEHIND'
      : elapsed < 5.25
        ? 'THE ROUTE GOES BLACK'
        : 'YOU WAKE IN THE DUNGEON';
  ctx.fillText(message, width / 2, height * .42);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = .82;
  ctx.fillStyle = '#d3c08f';
  ctx.font = `${Math.max(10, height * .016)}px Georgia`;
  const submessage = elapsed < 1.35
    ? 'The path continues through the living trees.'
    : elapsed < 2.15
      ? 'The strike comes from behind.'
      : elapsed < 5.25
        ? 'The archive route disappears into darkness.'
        : 'Cold stone. A cockroach waits far across the threshold chamber.';
  ctx.fillText(submessage, width / 2, height * .51);
  if (elapsed >= 5.25) {
    ctx.globalAlpha = .62;
    ctx.fillStyle = '#b98542';
    ctx.font = `${Math.max(9, height * .014)}px "DM Mono", monospace`;
    ctx.fillText('LEVEL 02 · THE THRESHOLD CHAMBER', width / 2, height * .61);
  }
  ctx.restore();
}

function beginBossTransition() {
  if (state.transition || state.room === FINAL_ROOM_INDEX || state.gameComplete) return;
  state.transition = { elapsed: 0, duration: 5.4, teleported: false, impact: false };
  state.keys.clear();
  state.mouseAttack = false;
  state.mouseLook = false;
  state.promptSignature = 'transition';
  state.shakeTime = .3;
  playTrapdoorSound();
  showToast('The floor gives way beneath you.', 'danger');
}
function finishBossTransition() {
  const spawn = roomContentPoint(FINAL_ROOM_INDEX, rooms[FINAL_ROOM_INDEX].spawn.x, rooms[FINAL_ROOM_INDEX].spawn.y);
  state.player.x = roomOffsets[FINAL_ROOM_INDEX] + spawn.x;
  state.player.y = spawn.y;
  state.player.angle = rooms[FINAL_ROOM_INDEX].spawn.angle;
  state.player.pitch = 0;
  state.room = FINAL_ROOM_INDEX;
  state.finalArenaTime = .01;
  state.finalBoss.alerted = true;
  state.player.hp = Math.max(1, state.player.hp - 12);
  state.damageFlash = .7;
  state.shakeTime = settings.reducedMotion ? .22 : .72;
  setMusicMode('boss');
  updateHud();
  showToast('You hit the stone hard. Your shoulder is hurt, but the chamber is waiting.', 'danger');
  playTone(73, .5, 'sawtooth', .04);
  playTone(146, .65, 'square', .025, .12);
  playTone(292, .8, 'triangle', .025, .24);
}
function updateBossTransition(delta) {
  if (!state.transition) return;
  state.transition.elapsed += delta;
  if (!state.transition.teleported && state.transition.elapsed >= 2.45) {
    state.transition.teleported = true;
    finishBossTransition();
  }
  if (state.transition.elapsed >= state.transition.duration) {
    state.transition = null;
  }
}

function hideFloorAnnouncement() {
  if (!floorAnnouncement) return;
  floorAnnouncement.classList.remove('is-visible');
  window.setTimeout(() => {
    if (!state.floorAnnouncement) floorAnnouncement.hidden = true;
  }, 360);
}
function showFloorAnnouncement(roomIndex) {
  if (roomIndex === FINAL_ROOM_INDEX || state.visitedFloors.has(roomIndex) || !floorAnnouncement) return;
  state.visitedFloors.add(roomIndex);
  const room = rooms[roomIndex];
  state.floorAnnouncement = { roomIndex, elapsed: 0, duration: 1.35 };
  if (floorAnnouncementKicker) floorAnnouncementKicker.textContent = '';
  if (floorAnnouncementNumber) floorAnnouncementNumber.textContent = '';
  if (floorAnnouncementTitle) floorAnnouncementTitle.textContent = room.title;
  if (floorAnnouncementSubtitle) floorAnnouncementSubtitle.textContent = '';
  floorAnnouncement.hidden = false;
  floorAnnouncement.classList.remove('is-visible');
  void floorAnnouncement.offsetWidth;
  floorAnnouncement.classList.add('is-visible');
}
function updateFloorAnnouncement(delta) {
  if (!state.floorAnnouncement) return;
  state.floorAnnouncement.elapsed += delta;
  if (state.floorAnnouncement.elapsed >= state.floorAnnouncement.duration) {
    state.floorAnnouncement = null;
    hideFloorAnnouncement();
  }
}

function updateRoomFromPlayer() {
  const next = currentRoomIndex();
  if (state.room === 0 && state.lobbyGateOpen && state.player.x >= FOREST_HALL_TRIGGER_X && state.player.x < FOREST_HALL_END) {
    beginForestTransition();
    return;
  }
  if (state.room === 0 && state.lobbyGateOpen && state.player.x >= FOREST_HALL_START && state.player.x < FOREST_HALL_TRIGGER_X) return;
  if (next === FINAL_ROOM_INDEX && state.room !== FINAL_ROOM_INDEX && state.finalBoss && !state.finalBoss.dead) {
    beginBossTransition();
    return;
  }
  if (next !== state.room) {
    state.room = next;
    showFloorAnnouncement(next);
    updateHud();
    spawnParticles(state.player.x, state.player.y, .4, [rooms[next].color, '#d8c18b'], settings.reducedMotion ? 8 : 20, { speed: 1.4, life: .85, size: .78, upward: .7, glow: 14, trail: true });
    playTone(220, .1, 'triangle', .02);
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
function playNinjaStarSound() { playTone(330, .06, 'triangle', .022); playTone(660, .1, 'sine', .016, .035); playTone(990, .08, 'square', .012, .07); }
function playCrossbowSound() { playTone(72, .08, 'square', .018); playTone(260, .08, 'triangle', .018, .03); }
function playWandSound() { playTone(116, .14, 'sine', .02); playTone(232, .24, 'triangle', .026, .07); playTone(464, .3, 'sine', .016, .16); }
function playBladeSound() { playTone(176, .08, 'sawtooth', .018); playTone(352, .12, 'triangle', .022, .035); }
function playWeaponSound() { if (state.weapon.type === 'stars') playNinjaStarSound(); else if (state.weapon.type === 'crossbow') playCrossbowSound(); else if (state.weapon.type === 'blade') playBladeSound(); else playWandSound(); }
function playRecoverySound() { playTone(294, .18, 'sine', .035); playTone(440, .24, 'triangle', .03, .11); playTone(587, .3, 'sine', .022, .21); }
function playHitSound() { playTone(66, .18, 'square', .035); }
function playBoneHitSound() { playTone(110, .12, 'triangle', .025); playTone(72, .13, 'square', .018, .05); }

function getNearestItem(maxDistance = 1.55) {
  let nearest = null;
  let best = maxDistance;
  const activeRoom = currentRoomIndex();
  for (const item of worldItems) {
    if (item.recovered || item.kind === 'health-potion' || item.roomIndex !== activeRoom) continue;
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
function getNearestWeaponCreature(maxDistance = LOBBY_WEAPON_INTERACTION_RANGE) {
  if (state.room !== 0) return null;
  let nearest = null;
  let best = maxDistance;
  for (const display of LOBBY_WEAPON_CREATURES) {
    const distance = Math.hypot(display.x - state.player.x, display.y - state.player.y);
    if (distance < best) {
      best = distance;
      nearest = display;
    }
  }
  return nearest;
}
function lobbyGateDistance() { return state.room === 0 ? Math.hypot(LOBBY_GATE.x - state.player.x, LOBBY_GATE.y - state.player.y) : Infinity; }
function weaponDefinition() { return WEAPON_LOADOUTS[state.weapon.type] || WEAPON_LOADOUTS.stars; }
function learnedSpellDefinitions() { return [...(state.tutorialSpell ? [GATE_TUTORIAL_SPELL] : []), ...SPELL_FORMS.filter((spell) => state.unlockedSpells.has(spell.id))]; }
function selectedSpellDefinition() {
  const learned = learnedSpellDefinitions();
  if (!learned.length) return null;
  return learned.find((spell) => spell.id === state.selectedSpellId) || learned[learned.length - 1];
}
function selectSpell(spellId, announce = true) {
  const spell = learnedSpellDefinitions().find((entry) => entry.id === spellId);
  if (!spell) return false;
  state.selectedSpellId = spell.id;
  state.promptSignature = '';
  state.hudSignature = '';
  if (announce) showToast(`${spell.name} selected.`, 'good');
  spawnParticles(state.player.x, state.player.y, EYE_HEIGHT, spell.color, settings.reducedMotion ? 3 : 8, { speed: .8, life: .42, size: .75, glow: 10, upward: .4 });
  updateHud();
  return true;
}
function cycleSpell(direction = 1) {
  const learned = learnedSpellDefinitions();
  if (!learned.length) { showToast('Recover more records to learn a spell.'); return; }
  const foundIndex = learned.findIndex((spell) => spell.id === state.selectedSpellId);
  const currentIndex = foundIndex >= 0 ? foundIndex : (direction > 0 ? -1 : 0);
  const nextIndex = (currentIndex + direction + learned.length) % learned.length;
  selectSpell(learned[nextIndex].id);
}
function wandColorForSpell() { return selectedSpellDefinition()?.color || '#c76545'; }
function wandSpellName() { return selectedSpellDefinition()?.name || 'unattuned ember'; }
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
  updateWeaponSelection(type);
  state.weapon.equipped = true;
  state.weapon.swing = 0;
  state.weapon.hit = false;
  state.weapon.cooldown = 0;
  state.weapon.projectile = 0;
  state.promptSignature = '';
  if (!state.menuActive && previousType !== type) {
    const color = type === 'wand' ? wandColorForSpell() : type === 'crossbow' ? '#f0d38d' : type === 'blade' ? '#b8f0e2' : '#d8c18b';
    state.impactBursts.push({ x: state.player.x, y: state.player.y, z: EYE_HEIGHT, elapsed: 0, duration: .24, color, radius: .22 });
    showToast(`${WEAPON_LOADOUTS[type].label} equipped.`, 'good');
    playTone(type === 'stars' ? 330 : type === 'crossbow' ? 220 : type === 'blade' ? 176 : 330, .12, 'triangle', .02);
  }
}

function currentSpellDefinition() {
  return selectedSpellDefinition();
}
function levelForXp(xp) {
  let level = 0;
  for (const spell of SPELL_FORMS) if (xp >= spell.threshold) level += 1;
  return level;
}
function newlyUnlockedSpells(previousXp, nextXp) {
  return SPELL_FORMS.filter((spell) => previousXp < spell.threshold && nextXp >= spell.threshold);
}
function earnExperience(amount, source = 'field work') {
  const previousXp = state.xp;
  state.xp += amount;
  const unlocked = newlyUnlockedSpells(previousXp, state.xp);
  for (const spell of unlocked) state.unlockedSpells.add(spell.id);
  state.level = levelForXp(state.xp);
  if (unlocked.length) {
    state.lastSpell = unlocked[unlocked.length - 1];
    state.selectedSpellId = state.lastSpell.id;
    spawnParticles(state.player.x, state.player.y, EYE_HEIGHT, state.lastSpell.color, 22, { speed: 1.8, life: 1.05, size: 1.2, glow: 16, upward: .8, trail: true });
    showToast(`Level ${state.level}: ${unlocked.map((spell) => spell.name).join(', ')} unlocked.`, 'good');
    playSpellSound();
  } else if (source !== 'scroll') {
    showToast(`+${amount} XP from ${source}.`, 'good');
  }
  updateHud();
  return unlocked;
}
function updateScrollProgress() {
  if (!scrollProgressLabel || !scrollProgressValue || !scrollProgressBar || !scrollProgressCaption) return;
  const nextSpell = SPELL_FORMS.find((spell) => state.xp < spell.threshold);
  if (!nextSpell) {
    scrollProgressLabel.textContent = 'SPELLBOOK COMPLETE';
    scrollProgressValue.textContent = `${state.xp} XP · ALL SPELLS LEARNED`;
    scrollProgressBar.style.width = '100%';
    scrollProgressCaption.textContent = 'Every recorded route is now available to cast.';
    return;
  }
  const spellIndex = SPELL_FORMS.indexOf(nextSpell);
  const previousThreshold = spellIndex > 0 ? SPELL_FORMS[spellIndex - 1].threshold : 0;
  const progress = clamp((state.xp - previousThreshold) / (nextSpell.threshold - previousThreshold), 0, 1);
  scrollProgressLabel.textContent = 'PROGRESS TO NEXT SPELL';
  scrollProgressValue.textContent = `${state.xp} / ${nextSpell.threshold} XP`;
  scrollProgressBar.style.width = `${progress * 100}%`;
  scrollProgressCaption.textContent = `${nextSpell.name} unlocks at ${nextSpell.threshold} XP.`;
}
function updateSpellCard(gained, unlocked = null) {
  scrollSpell?.classList.remove('spell-revealed');
  if (scrollSpell) void scrollSpell.offsetWidth;
  scrollSpell?.classList.add('spell-revealed');
  if (scrollSpellSeal) scrollSpellSeal.textContent = unlocked?.glyph || '✦';
  if (scrollRewardKicker) scrollRewardKicker.textContent = unlocked ? 'NEW SPELL UNLOCKED' : 'XP RECOVERED';
  if (scrollSpellName) scrollSpellName.textContent = unlocked ? unlocked.name : `+${gained} XP`;
  if (scrollSpellDescription) scrollSpellDescription.textContent = unlocked ? `${unlocked.description} Use Q to cast it.` : 'Bank XP from scrolls and defeat enemies to unlock spells at each threshold.';
}
function grantScrollXP(item) {
  const recordId = item.recordId || item.id;
  if (state.collectedRecordIds.has(recordId)) {
    updateSpellCard(0, null);
    showToast('This field record is already in your archive.', 'good');
    return;
  }
  state.collectedRecordIds.add(recordId);
  const unlocked = earnExperience(XP_PER_SCROLL, 'scroll');
  updateSpellCard(XP_PER_SCROLL, unlocked[0] || null);
  if (!unlocked.length) showToast(`+${XP_PER_SCROLL} XP banked. ${state.xp} XP total.`, 'good');
}
function chooseSpellTarget() {
  return findAimTarget(14, .32, .36) || worldEnemies.filter((enemy) => enemy.roomIndex !== 0 && !enemy.dead && enemy.roomIndex === state.room).sort((a, b) => Math.hypot(a.x - state.player.x, a.y - state.player.y) - Math.hypot(b.x - state.player.x, b.y - state.player.y))[0] || (state.room === FINAL_ROOM_INDEX && state.finalBoss && !state.finalBoss.dead ? state.finalBoss : null);
}
function makeProjectile(kind, origin, velocity, options = {}) {
  state.projectiles.push({ kind, x: origin.x, y: origin.y, z: origin.z, vx: velocity.x, vy: velocity.y, vz: velocity.z || 0, spin: Math.random() * TAU, radius: options.radius || .1, damage: options.damage || 0, color: options.color || '#e7ad67', lifetime: options.lifetime || 2.5, maxLifetime: options.lifetime || 2.5, homing: options.homing || 0, targetId: options.targetId || null, source: options.source || 'player', sourceId: options.sourceId || null, spell: options.spell || false, spellKind: options.spellKind || null, trail: [], origin: { ...origin }, aoe: options.aoe || 0, stun: options.stun || 0, stagger: options.stagger || 0, knockback: options.knockback || 0, critChance: options.critChance || 0, critMultiplier: options.critMultiplier || 1.65, beam: options.beam || false, collisionHeight: options.collisionHeight || .55, chainTargets: options.chainTargets || 0, trailSize: options.trailSize || 1, orbit: options.orbit || 0, sparks: options.sparks || 0 });
}
function playerAimDirection() {
  return { x: Math.cos(state.player.angle) * Math.cos(state.player.pitch), y: Math.sin(state.player.angle) * Math.cos(state.player.pitch), z: Math.sin(state.player.pitch) };
}
function leftHandSpellOrigin(direction) {
  const leftX = -Math.sin(state.player.angle);
  const leftY = Math.cos(state.player.angle);
  return {
    x: state.player.x + leftX * .48 + direction.x * .3,
    y: state.player.y + leftY * .48 + direction.y * .3,
    z: EYE_HEIGHT - .3 + direction.z * .12,
  };
}
function spellProjectileOrigin(direction) {
  return {
    x: state.player.x + direction.x * .34,
    y: state.player.y + direction.y * .34,
    z: EYE_HEIGHT + direction.z * .08,
  };
}
function castSpell() {
  const spell = selectedSpellDefinition();
  if (state.menuActive || state.reading || state.launchTransition || state.transition || state.forestTransition || state.gameComplete) return;
  if (!spell) { showToast('Find and read the glowing portfolio scroll to learn the Archive Key.'); return; }
  if (spell.kind === 'gate') {
    if (!state.weapon.equipped) {
      showToast('Equip a weapon before opening the archive gate.');
      return;
    }
    if (state.room !== 0 || lobbyGateDistance() > 2.2) {
      showToast('Archive Key only works at the sealed archive gate.');
      return;
    }
    if (state.lobbyGateOpen || state.lobbyGateOpening) {
      showToast('The archive gate is already open.', 'good');
      return;
    }
    state.spellCast = { spell, elapsed: 0, duration: .72, source: 'spell-focus' };
    state.activeSpellEffects.push({ kind: 'gate-key', elapsed: 0, duration: 1.1, color: spell.color, rings: 4 });
    spawnSpellParticles(spell, { x: LOBBY_GATE.x, y: LOBBY_GATE.y, z: 1 }, { x: 1, y: 0, z: 0 });
    openLobbyGate();
    playSpellSound();
    showToast('Archive Key cast. The gate is opening.', 'good');
    return;
  }
  if (state.spellCooldown > 0) { showToast(`${spell.name} is recharging.`); return; }
  state.spellCooldown = spell.cooldown;
  state.spellCast = { spell, elapsed: 0, duration: .72, source: 'spell-focus' };
  spawnParticles(state.player.x, state.player.y, EYE_HEIGHT, spell.color, settings.reducedMotion ? 5 : 12, { speed: 1.1, life: .55, size: .8, glow: 14, upward: .45, trail: true });
  state.impactBursts.push({ x: state.player.x, y: state.player.y, z: EYE_HEIGHT, elapsed: 0, duration: .32, color: spell.color, radius: .28 });
  const direction = playerAimDirection();
  const origin = spellProjectileOrigin(direction);
  spawnSpellParticles(spell, origin, direction);
  const target = chooseSpellTarget();
  if (spell.kind === 'reveal') {
    state.revealTimer = 7;
    state.impactBursts.push({ x: state.player.x, y: state.player.y, z: .58, elapsed: 0, duration: 1.2, color: spell.color, radius: 3.4, style: 'radar' });
    state.activeSpellEffects.push({ kind: 'reveal', elapsed: 0, duration: 1.75, color: spell.color, rings: 4 });
  } else if (spell.kind === 'homing') {
    makeProjectile('spell-orb', origin, { x: direction.x * 5.4, y: direction.y * 5.4, z: direction.z * 5.4 }, { color: spell.color, damage: 72, radius: .18, lifetime: 3, homing: 4.2, targetId: target?.id, trailSize: 1.65, orbit: 2, sparks: 5, spell: true, spellKind: spell.kind });
  } else if (spell.kind === 'ward') {
    state.wardTimer = 7;
    state.activeSpellEffects.push({ kind: 'ward', elapsed: 0, duration: 7, color: spell.color, rings: 6 });
  } else if (spell.kind === 'chain') {
    makeProjectile('spell-chain', origin, { x: direction.x * 7.2, y: direction.y * 7.2, z: direction.z * 7.2 }, { color: spell.color, damage: 84, radius: .13, lifetime: 1.8, targetId: target?.id, aoe: 2.4, stun: .9, chainTargets: 3, trailSize: 2.05, orbit: 3, sparks: 7, spell: true, spellKind: spell.kind });
  } else if (spell.kind === 'echo') {
    state.player.hp = clamp(state.player.hp + 35, 0, 100);
    state.enemySlowTimer = 4;
    state.activeSpellEffects.push({ kind: 'echo', elapsed: 0, duration: 1.7, color: spell.color, rings: 5 });
    state.impactBursts.push({ x: state.player.x, y: state.player.y, z: .6, elapsed: 0, duration: 1.1, color: spell.color, radius: 2.2 });
  } else if (spell.kind === 'fireball') {
    makeProjectile('spell-fireball', origin, { x: direction.x * 6.2, y: direction.y * 6.2, z: direction.z * 6.2 }, { color: spell.color, damage: 105, radius: .2, lifetime: 2.5, aoe: 1.65, trailSize: 2.35, orbit: 2, sparks: 9, spell: true, spellKind: spell.kind });
  } else if (spell.kind === 'bloom') {
    state.player.hp = clamp(state.player.hp + 24, 0, 100);
    for (const enemy of allHostiles()) if (Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y) < 3.2) damageHostile(enemy, 64, { stun: 1.1 });
    state.activeSpellEffects.push({ kind: 'bloom', elapsed: 0, duration: 1.8, color: spell.color, rings: 8 });
  } else if (spell.kind === 'beam') {
    const beamEnd = { x: state.player.x + direction.x * 12, y: state.player.y + direction.y * 12, z: EYE_HEIGHT + direction.z * 12 };
    state.activeSpellEffects.push({ kind: 'beam', elapsed: 0, duration: .9, color: spell.color, start: origin, end: beamEnd, rings: 5 });
    for (const enemy of allHostiles()) {
      if (distanceToAimLine(enemy, direction) < .68 && hasLineOfSight(state.player.x, state.player.y, enemy.x, enemy.y)) {
        spawnSpellImpactParticles(spell.kind, enemy.x, enemy.y, hostileAimHeight(enemy), spell.color, .9);
        damageHostile(enemy, 150, { stun: 1.6 });
      }
    }
  }
  playSpellSound();
  showToast(`${spell.name}: ${spell.effect}.`, 'good');
}
function updateSpell(delta) {
  state.spellCooldown = Math.max(0, state.spellCooldown - delta);
  state.revealTimer = Math.max(0, state.revealTimer - delta);
  state.wardTimer = Math.max(0, state.wardTimer - delta);
  state.enemySlowTimer = Math.max(0, state.enemySlowTimer - delta);
  const equippedSpell = selectedSpellDefinition();
  if (equippedSpell && !state.menuActive && !state.reading) {
    state.spellFocusParticleTimer -= delta;
    if (state.spellFocusParticleTimer <= 0) {
      state.spellFocusParticleTimer = settings.reducedMotion ? .52 : .2;
      spawnSpellFocusParticles(equippedSpell);
    }
  } else {
    state.spellFocusParticleTimer = 0;
  }
  if (state.spellCast) {
    state.spellCast.elapsed += delta;
    if (state.spellCast.elapsed >= state.spellCast.duration) state.spellCast = null;
  }
  state.activeSpellEffects = state.activeSpellEffects.filter((effect) => { effect.elapsed += delta; return effect.elapsed < effect.duration; });
  state.impactBursts = state.impactBursts.filter((burst) => { burst.elapsed += delta; return burst.elapsed < burst.duration; });
}
const SPELL_FOCUS_PROFILES = {
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
const DEFAULT_SPELL_FOCUS_PROFILE = { shape: 'dot', accent: '#fff1b0', count: 9, speed: .55, life: .76, size: .32, spread: TAU, gravity: -.06, upward: .2, glow: 16 };
function spellFocusProfile(kind) { return SPELL_FOCUS_PROFILES[kind] || DEFAULT_SPELL_FOCUS_PROFILE; }

function spawnSpellFocusParticles(spell) {
  if (!spell || state.menuActive || state.reading) return;
  const direction = playerAimDirection();
  const origin = leftHandSpellOrigin(direction);
  const profile = spellFocusProfile(spell.kind);
  const colors = [spell.color, profile.accent, '#fff1b0'];
  spawnParticles(origin.x, origin.y, origin.z + .06, colors, settings.reducedMotion ? 5 : profile.count, {
    speed: profile.speed,
    life: settings.reducedMotion ? profile.life * .72 : profile.life,
    size: profile.size,
    upward: profile.upward,
    spread: profile.spread,
    gravity: profile.gravity,
    drag: .97,
    glow: profile.glow,
    shape: profile.shape,
    trail: spell.kind === 'fireball' || spell.kind === 'chain' || spell.kind === 'beam',
  });
  const accentShape = spell.kind === 'fireball' ? 'ember' : spell.kind === 'bloom' ? 'petal' : spell.kind === 'chain' || spell.kind === 'beam' ? 'thread' : spell.kind === 'homing' ? 'star' : 'dot';
  spawnParticles(origin.x, origin.y, origin.z + .08, profile.accent, settings.reducedMotion ? 1 : 3, {
    speed: spell.kind === 'fireball' ? .66 : .82,
    life: settings.reducedMotion ? .36 : .58,
    size: spell.kind === 'fireball' ? .3 : .22,
    upward: spell.kind === 'fireball' || spell.kind === 'bloom' ? .56 : .18,
    spread: spell.kind === 'chain' || spell.kind === 'beam' ? .35 : TAU,
    gravity: spell.kind === 'fireball' ? -.28 : -.06,
    drag: .96,
    glow: 16,
    shape: 'pixel',
    trail: spell.kind === 'fireball' || spell.kind === 'chain' || spell.kind === 'beam',
  });
}
function drawSpellScreenMotif(kind, x, y, radius, now, alpha = 1, phase = 0, direction = 0) {
  const accent = spellFocusProfile(kind).accent;
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
const PIXEL_SPELL_GLYPHS = {
  gate: ['000010000', '000111000', '001212100', '011111110', '112232211', '011111110', '001212100', '000111000', '000010000'],
  reveal: ['001111100', '011212110', '110000011', '120333021', '120232021', '120333021', '110000011', '011212110', '001111100'],
  homing: ['000010000', '001111100', '011232110', '111111111', '122232221', '111111111', '011232110', '001111100', '000010000'],
  ward: ['011111110', '112323211', '120000021', '123232321', '120232021', '123232321', '120000021', '112323211', '011111110'],
  chain: ['100000001', '010000010', '001000100', '000111000', '111232111', '000111000', '001000100', '010000010', '100000001'],
  echo: ['001111100', '011212110', '110000011', '120111021', '120232021', '120111021', '110000011', '011212110', '001111100'],
  fireball: ['000010000', '001111100', '011212110', '112232211', '123333321', '112232211', '011212110', '001111100', '000010000'],
  bloom: ['000010000', '010111010', '101212101', '011333110', '112232211', '011333110', '101212101', '010111010', '000010000'],
  beam: ['000010000', '000010000', '001010100', '000111000', '112232211', '000111000', '001010100', '000010000', '000010000'],
};

function drawPixelSpellGlyph(kind, x, y, size, color, alpha = 1, active = false) {
  const profile = spellFocusProfile(kind);
  const pattern = PIXEL_SPELL_GLYPHS[kind] || PIXEL_SPELL_GLYPHS.gate;
  const cell = Math.max(3, Math.round(size / pattern.length));
  const width = pattern[0].length * cell;
  const height = pattern.length * cell;
  const left = Math.round(x - width / 2);
  const top = Math.round(y - height / 2);
  const depth = Math.max(3, Math.round(cell * .72));
  const baseRgb = hexToRgb(color);
  const dark = `rgb(${Math.round(baseRgb.r * .34)}, ${Math.round(baseRgb.g * .34)}, ${Math.round(baseRgb.b * .34)})`;
  const side = `rgb(${Math.round(baseRgb.r * .58)}, ${Math.round(baseRgb.g * .58)}, ${Math.round(baseRgb.b * .58)})`;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = false;
  ctx.shadowBlur = 0;
  const drawLayer = (offsetX, offsetY, fillMode) => {
    for (let row = 0; row < pattern.length; row += 1) {
      for (let column = 0; column < pattern[row].length; column += 1) {
        const value = pattern[row][column];
        if (value === '0') continue;
        const px = left + column * cell + offsetX;
        const py = top + row * cell + offsetY;
        ctx.fillStyle = fillMode === 'dark' ? dark : fillMode === 'side' ? side : (value === '2' ? profile.accent : color);
        ctx.fillRect(px, py, cell, cell);
      }
    }
  };
  for (let layer = depth; layer >= 1; layer -= 1) drawLayer(layer, layer, layer > depth * .52 ? 'dark' : 'side');
  drawLayer(0, 0, 'front');
  // Use the same procedural material language as the world meshes: a subtle
  // repeating surface pattern, bevel highlights, and a second accent value.
  const glyphPattern = textures.patterns?.steel || textures.patterns?.bone;
  if (glyphPattern) {
    ctx.save();
    ctx.globalAlpha = .24;
    ctx.beginPath();
    for (let row = 0; row < pattern.length; row += 1) {
      for (let column = 0; column < pattern[row].length; column += 1) {
        if (pattern[row][column] === '0') continue;
        ctx.rect(left + column * cell, top + row * cell, cell, cell);
      }
    }
    ctx.clip();
    ctx.fillStyle = glyphPattern;
    ctx.fillRect(left, top, width, height);
    ctx.restore();
  }
  ctx.fillStyle = profile.accent;
  for (let row = 0; row < pattern.length; row += 1) {
    for (let column = 0; column < pattern[row].length; column += 1) {
      if (pattern[row][column] === '0') continue;
      const px = left + column * cell;
      const py = top + row * cell;
      ctx.fillRect(px, py, Math.max(1, Math.round(cell * .22)), Math.max(1, Math.round(cell * .14)));
      ctx.fillRect(px, py, Math.max(1, Math.round(cell * .14)), Math.max(1, Math.round(cell * .22)));
    }
  }
  const orbitRadius = width * (active ? .9 : .72);
  const orbitSize = Math.max(2, Math.round(cell * .62));
  ctx.fillStyle = profile.accent;
  for (let index = 0; index < 4; index += 1) {
    const angle = (index * TAU / 4) + (active ? performance.now() / 900 : 0);
    const orbitX = Math.round(x + Math.cos(angle) * orbitRadius - orbitSize / 2);
    const orbitY = Math.round(y + Math.sin(angle) * orbitRadius - orbitSize / 2);
    ctx.fillRect(orbitX, orbitY, orbitSize, orbitSize);
  }
  ctx.save();
  ctx.globalAlpha = alpha * (active ? .72 : .38);
  ctx.strokeStyle = profile.accent;
  ctx.lineWidth = Math.max(1, Math.round(cell * .16));
  ctx.setLineDash([Math.max(2, cell * .7), Math.max(2, cell * .45)]);
  ctx.strokeRect(left - cell * .72, top - cell * .72, width + cell * 1.44, height + cell * 1.44);
  ctx.setLineDash([]);
  for (let corner = 0; corner < 4; corner += 1) {
    const angle = corner * Math.PI / 2 + (active ? performance.now() / 2400 : 0);
    const nodeX = x + Math.cos(angle) * (width * .72);
    const nodeY = y + Math.sin(angle) * (height * .72);
    ctx.fillStyle = corner % 2 ? profile.accent : '#fff1b0';
    ctx.fillRect(Math.round(nodeX - cell * .16), Math.round(nodeY - cell * .16), Math.max(2, Math.round(cell * .32)), Math.max(2, Math.round(cell * .32)));
  }
  ctx.restore();
  if (active) {
    ctx.strokeStyle = profile.accent;
    ctx.lineWidth = Math.max(2, Math.round(cell * .45));
    ctx.strokeRect(left - cell, top - cell, width + cell * 2, height + cell * 2);
  }
  ctx.restore();
}

function addSpellCameraBox(faces, center, dimensions, color, shade = 1, material = 'steel') {
  addBoxFaces(faces, makeBoxPoints(center, dimensions, 0, (point) => point), color, shade, material);
}
function vividSpellRgb(color) {
  if (color && typeof color === 'object') return { r: color.r, g: color.g, b: color.b };
  const value = String(color || '#fff1b0').replace('#', '');
  const normalized = value.length === 3 ? value.split('').map((part) => part + part).join('') : value.padEnd(6, 'f').slice(0, 6);
  const number = Number.parseInt(normalized, 16);
  return { r: (number >> 16) & 255, g: (number >> 8) & 255, b: number & 255 };
}
function mixSpellRgb(first, second, amount) {
  const t = clamp(amount, 0, 1);
  return { r: Math.round(lerp(first.r, second.r, t)), g: Math.round(lerp(first.g, second.g, t)), b: Math.round(lerp(first.b, second.b, t)) };
}
function spellRgbCss(color, alpha = 1) { return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`; }
function spellVisualPalette(spell) {
  const profile = spellFocusProfile(spell?.kind);
  const base = vividSpellRgb(spell?.color || '#6ce0c2');
  const accent = vividSpellRgb(profile.accent);
  const deep = mixSpellRgb(base, { r: 21, g: 12, b: 30 }, .48);
  const light = mixSpellRgb(mixSpellRgb(base, accent, .42), { r: 255, g: 248, b: 214 }, .54);
  const glow = mixSpellRgb(base, accent, .58);
  return { base, accent, deep, light, glow };
}
function spellRoundRectPath(x, y, width, height, radius) {
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
function drawSpellGlyphSurface(blocks, palette, alpha, active) {
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
    gradient.addColorStop(0, spellRgbCss(palette.light, .95));
    gradient.addColorStop(.38, spellRgbCss(block.highlight ? palette.accent : palette.base, .94));
    gradient.addColorStop(1, spellRgbCss(palette.deep, .95));
    ctx.fillStyle = gradient;
    ctx.strokeStyle = spellRgbCss(palette.light, active ? .7 : .45);
    ctx.lineWidth = Math.max(.7, Math.min(width, height) * .045);
    spellRoundRectPath(projected.x - width / 2, projected.y - height / 2, width, height, radius);
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = alpha * (active ? .34 : .22);
    ctx.strokeStyle = spellRgbCss(palette.light, .9);
    ctx.lineWidth = Math.max(.6, Math.min(width, height) * .035);
    ctx.beginPath();
    ctx.moveTo(projected.x - width * .28, projected.y - height * .27);
    ctx.lineTo(projected.x + width * .2, projected.y - height * .27);
    ctx.stroke();
    ctx.globalAlpha = alpha * (active ? .18 : .1);
  }
  ctx.restore();
}
function spellMeshPoint(center, side, forward, z, roll = 0) {
  const cosine = Math.cos(roll);
  const sine = Math.sin(roll);
  return {
    side: center.side + side * cosine - z * sine,
    forward: center.forward + forward,
    z: center.z + side * sine + z * cosine,
  };
}
function addSpellCrystalMesh(faces, center, radius, depth, height, roll, color, shade = 1, material = null) {
  const ring = [];
  for (let index = 0; index < 6; index += 1) {
    const angle = index * TAU / 6;
    ring.push(spellMeshPoint(center, Math.cos(angle) * radius, Math.sin(angle) * depth, 0, roll));
  }
  const top = spellMeshPoint(center, 0, 0, height * .5, roll);
  const bottom = spellMeshPoint(center, 0, 0, -height * .5, roll);
  for (let index = 0; index < ring.length; index += 1) {
    const next = (index + 1) % ring.length;
    faces.push({ points: [top, ring[index], ring[next]], color, shade: shade * (.76 + (index % 3) * .1), material });
    faces.push({ points: [bottom, ring[next], ring[index]], color, shade: shade * (.58 + ((index + 1) % 3) * .1), material });
  }
}
function addSpellOrbMesh(faces, center, radius, depth, color, shade = 1, material = null) {
  const latitudes = [-Math.PI / 2, -Math.PI / 4, 0, Math.PI / 4, Math.PI / 2];
  const segments = 8;
  const rings = latitudes.map((latitude) => {
    const ringRadius = Math.cos(latitude) * radius;
    return Array.from({ length: segments }, (_, index) => {
      const longitude = index * TAU / segments;
      return spellMeshPoint(center, Math.cos(longitude) * ringRadius, Math.sin(longitude) * ringRadius * depth / radius, Math.sin(latitude) * radius);
    });
  });
  for (let row = 0; row < rings.length - 1; row += 1) {
    for (let index = 0; index < segments; index += 1) {
      const next = (index + 1) % segments;
      faces.push({ points: [rings[row][index], rings[row][next], rings[row + 1][next], rings[row + 1][index]], color, shade: shade * (.72 + ((index + row) % 4) * .09), material });
    }
  }
}
function addSpellTorusMesh(faces, center, radius, tube, roll, color, shade = 1, material = null, segments = 10) {
  const tubeSegments = 4;
  const rings = [];
  for (let major = 0; major < segments; major += 1) {
    const majorAngle = major * TAU / segments;
    rings.push([]);
    for (let minor = 0; minor < tubeSegments; minor += 1) {
      const minorAngle = minor * TAU / tubeSegments;
      const localRadius = radius + Math.cos(minorAngle) * tube;
      rings[major].push(spellMeshPoint(center, Math.cos(majorAngle) * localRadius, Math.sin(minorAngle) * tube, Math.sin(majorAngle) * localRadius, roll));
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
function addSpellPlateMesh(faces, center, width, height, depth, roll, color, shade = 1, material = null) {
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
  const front = profile.map((point) => spellMeshPoint(center, point.side, depth / 2, point.z, roll));
  const back = profile.map((point) => spellMeshPoint(center, point.side, -depth / 2, point.z, roll));
  faces.push({ points: front, color, shade, material });
  faces.push({ points: [...back].reverse(), color, shade: shade * .56, material });
  for (let index = 0; index < profile.length; index += 1) {
    const next = (index + 1) % profile.length;
    faces.push({ points: [front[index], front[next], back[next], back[index]], color, shade: shade * (.62 + (index % 3) * .1), material });
  }
}
function addSpellConnectorMesh(faces, center, sideOffset, zOffset, width, height, color, shade = 1) {
  addSpellCameraBox(faces, { side: center.side + sideOffset, forward: center.forward, z: center.z + zOffset }, [width, width * .7, height], color, shade, null);
}
function drawSpellGlyph3D(spell, now, center, size, alpha = 1, active = false) {
  if (!spell) return;
  const palette = spellVisualPalette(spell);
  const unit = Math.max(.004, size * center.forward / Math.max(1, focalY()) / 8);
  const pulse = active ? 1 + Math.sin(now / 130) * .08 : 1 + Math.sin(now / 260) * .035;
  const ringRotation = now / (active ? 1100 : 1700);
  const faces = [];
  const core = { ...center };
  const side = (value) => center.side + value;
  const height = (value) => center.z + value;

  if (spell.kind === 'gate') {
    addSpellCrystalMesh(faces, core, unit * 1.28, unit * 1.02, unit * 4.8 * pulse, ringRotation, palette.base, 1.1, 'steel');
    addSpellConnectorMesh(faces, core, 0, -unit * 2.55, unit * .42, unit * .72, palette.deep, .9);
    addSpellTorusMesh(faces, core, unit * 3.05, unit * .11, ringRotation, palette.accent, 1.04, null, 8);
    addSpellCrystalMesh(faces, { side: side(-unit * 2.2), forward: center.forward, z: height(unit * .1) }, unit * .42, unit * .34, unit * 1.05, -.45, palette.light, 1.04, null);
    addSpellCrystalMesh(faces, { side: side(unit * 2.2), forward: center.forward, z: height(unit * .1) }, unit * .42, unit * .34, unit * 1.05, .45, palette.light, .88, null);
  } else if (spell.kind === 'reveal') {
    addSpellOrbMesh(faces, core, unit * 1.45, unit * .74, palette.base, 1.04, null);
    addSpellTorusMesh(faces, core, unit * 2.55, unit * .18, ringRotation, palette.accent, 1.02, null, 12);
    addSpellCrystalMesh(faces, { ...core, forward: center.forward - unit * .84 }, unit * .42, unit * .18, unit * 1.6, 0, palette.light, 1.18, null);
    addSpellCrystalMesh(faces, { ...core, forward: center.forward - unit * .98 }, unit * .18, unit * .1, unit * .72, 0, palette.accent, 1.22, null);
  } else if (spell.kind === 'homing') {
    addSpellOrbMesh(faces, core, unit * 1.48, unit * 1.48, palette.base, 1.08, 'steel');
    addSpellTorusMesh(faces, core, unit * 2.25, unit * .13, -ringRotation * 1.25, palette.accent, 1.02, null, 9);
    for (let index = 0; index < 4; index += 1) {
      const angle = ringRotation * .9 + index * TAU / 4;
      addSpellCrystalMesh(faces, { side: side(Math.cos(angle) * unit * 2.05), forward: center.forward, z: height(Math.sin(angle) * unit * 2.05) }, unit * .3, unit * .22, unit * 1.15, angle, palette.light, .98, null);
    }
  } else if (spell.kind === 'ward') {
    addSpellPlateMesh(faces, core, unit * 4.7, unit * 4.9, unit * .7, Math.sin(now / 1600) * .06, palette.base, 1.02, 'steel');
    addSpellCrystalMesh(faces, { ...core, forward: center.forward - unit * .48 }, unit * .7, unit * .26, unit * 2.5, 0, palette.accent, 1.08, null);
    addSpellTorusMesh(faces, core, unit * 3.02, unit * .1, ringRotation, palette.light, .92, null, 8);
  } else if (spell.kind === 'chain') {
    for (let index = -1; index <= 1; index += 1) {
      const linkCenter = { ...core, side: side(index * unit * 2.0), z: height(Math.sin(index * 1.2 + ringRotation) * unit * .32) };
      addSpellTorusMesh(faces, linkCenter, unit * 1.02, unit * .16, ringRotation + index * .9, palette.base, 1.04, 'steel', 8);
      if (index < 1) addSpellConnectorMesh(faces, core, (index + .5) * unit * 2, 0, unit * .28, unit * .3, palette.accent, .95);
    }
  } else if (spell.kind === 'echo') {
    addSpellOrbMesh(faces, core, unit * .86, unit * .82, palette.base, 1.02, null);
    addSpellTorusMesh(faces, core, unit * 1.65, unit * .13, ringRotation * .7, palette.accent, .96, null, 10);
    addSpellTorusMesh(faces, core, unit * 2.45, unit * .11, -ringRotation, palette.light, .88, null, 10);
    addSpellTorusMesh(faces, core, unit * 3.2, unit * .09, ringRotation * .58, palette.accent, .76, null, 10);
  } else if (spell.kind === 'fireball') {
    addSpellOrbMesh(faces, core, unit * 1.72, unit * 1.5, palette.base, 1.08, 'steel');
    addSpellCrystalMesh(faces, { side: side(-unit * .55), forward: center.forward, z: height(unit * 1.65) }, unit * .34, unit * .22, unit * 1.72, -.3, palette.accent, 1.06, null);
    addSpellCrystalMesh(faces, { side: side(unit * .7), forward: center.forward + unit * .08, z: height(unit * .95) }, unit * .28, unit * .2, unit * 1.35, .45, palette.light, .94, null);
    addSpellCrystalMesh(faces, { side: side(-unit * .9), forward: center.forward, z: height(-unit * 1.2) }, unit * .25, unit * .18, unit * 1.18, .8, palette.accent, .9, null);
    addSpellTorusMesh(faces, core, unit * 2.55, unit * .1, ringRotation * 1.2, palette.light, .74, null, 9);
  } else if (spell.kind === 'bloom') {
    addSpellOrbMesh(faces, core, unit * .78, unit * .72, palette.light, 1.08, null);
    for (let index = 0; index < 6; index += 1) {
      const angle = ringRotation + index * TAU / 6;
      const petalCenter = { side: side(Math.cos(angle) * unit * 2.15), forward: center.forward, z: height(Math.sin(angle) * unit * 2.15) };
      addSpellCrystalMesh(faces, petalCenter, unit * .58, unit * .22, unit * 1.62, angle, palette.base, 1.02, null);
    }
    addSpellTorusMesh(faces, core, unit * 2.95, unit * .1, -ringRotation, palette.accent, .8, null, 10);
  } else if (spell.kind === 'beam') {
    addSpellPlateMesh(faces, core, unit * 1.55, unit * 5.8, unit * .56, 0, palette.base, 1.08, 'steel');
    addSpellCrystalMesh(faces, { ...core, z: height(unit * 2.8) }, unit * .42, unit * .24, unit * .92, 0, palette.light, 1.12, null);
    addSpellCrystalMesh(faces, { ...core, z: height(-unit * 2.8) }, unit * .42, unit * .24, unit * .92, 0, palette.accent, .92, null);
    addSpellTorusMesh(faces, core, unit * 2.75, unit * .1, ringRotation, palette.light, .8, null, 8);
  } else {
    addSpellOrbMesh(faces, core, unit * 1.3, unit * 1.15, palette.base, 1, null);
    addSpellTorusMesh(faces, core, unit * 2.4, unit * .12, ringRotation, palette.accent, .9, null, 10);
  }

  const projected = projectCameraPoint(center);
  if (projected) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = alpha * (active ? .2 : .09);
    ctx.shadowBlur = Math.max(10, size * .17);
    ctx.shadowColor = spellRgbCss(palette.glow, .92);
    const auraRadius = Math.max(14, size * (active ? .72 : .55));
    const aura = ctx.createRadialGradient(projected.x, projected.y, 0, projected.x, projected.y, auraRadius);
    aura.addColorStop(0, spellRgbCss(palette.glow, .44));
    aura.addColorStop(.48, spellRgbCss(palette.base, .16));
    aura.addColorStop(1, spellRgbCss(palette.base, 0));
    ctx.fillStyle = aura;
    ctx.beginPath(); ctx.arc(projected.x, projected.y, auraRadius, 0, TAU); ctx.fill();
    ctx.restore();
  }
  renderFaces(faces, alpha, true);
  if (!projected) return;
  ctx.save();
  ctx.globalAlpha = alpha * (active ? .34 : .14);
  ctx.strokeStyle = spellRgbCss(palette.accent, .9);
  ctx.shadowBlur = Math.max(7, size * .1);
  ctx.shadowColor = spellRgbCss(palette.glow, .8);
  ctx.lineWidth = Math.max(1, size * .012);
  ctx.beginPath();
  ctx.arc(projected.x, projected.y, Math.max(5, size * .21), ringRotation, ringRotation + Math.PI * 1.32);
  ctx.stroke();
  ctx.restore();
}

function drawSpellFocusMesh(spell, now, active) {
  if (!spell) return;
  const pulse = .82 + Math.sin(now / 155) * .08 + (active ? .1 : 0);
  const center = { side: -.38, forward: 1.06, z: .16 + Math.sin(now / 430) * .012 };
  const projected = projectCameraPoint(center);
  if (!projected) return;
  const size = Math.max(26, canvas.height * .066);
  drawSpellGlyph3D(spell, now, center, size, .78 + pulse * .12, active);
}
function drawPassiveSpellFocus(now) {
  const spell = selectedSpellDefinition();
  if (!spell || state.reading || state.menuActive) return;
  drawSpellFocusMesh(spell, now, state.spellCast?.spell?.id === spell.id);
}

function drawSpellCast(now) {
  if (!state.spellCast) return;
  const spell = state.spellCast.spell;
  const progress = clamp(state.spellCast.elapsed / state.spellCast.duration, 0, 1);
  const fade = Math.sin(Math.PI * progress);
  const size = canvas.height * (.09 + progress * .06);
  drawSpellGlyph3D(spell, now, { side: 0, forward: 1.18, z: EYE_HEIGHT }, size, fade * .9, true);
}
function drawSpellSwitchControls(now) {
  const spell = selectedSpellDefinition();
  if (!spell || state.reading || state.menuActive || state.forestTransition) return;
  // Use the exact same camera-space anchor as the in-hand spell glyph. This
  // keeps the controls attached to the design instead of drifting to a HUD
  // corner or appearing on the opposite side of the weapon.
  const center = projectCameraPoint({ side: -.38, forward: 1.06, z: .16 + Math.sin(now / 430) * .012 });
  if (!center) return;
  const glyphSize = Math.max(26, canvas.height * .066);
  const cell = Math.max(3, Math.round(glyphSize / 7));
  const glyphHeight = 7 * cell;
  const labelY = center.y + glyphHeight / 2 + Math.max(9, canvas.height * .014);
  const fontSize = Math.max(10, Math.round(canvas.height * .016));
  const keySpread = Math.max(fontSize * 2.55, glyphSize * .52);
  const arrowSpread = Math.max(fontSize * 1.12, glyphSize * .18);
  ctx.save();
  ctx.globalAlpha = .9;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 ${fontSize}px "DM Mono", monospace`;
  ctx.shadowBlur = 3;
  ctx.shadowColor = '#050302';
  ctx.fillStyle = '#f0d38f';
  ctx.fillText('Z', center.x - keySpread, labelY);
  ctx.fillStyle = '#d6b56d';
  ctx.fillText('◀', center.x - arrowSpread, labelY);
  ctx.fillText('▶', center.x + arrowSpread, labelY);
  ctx.fillStyle = '#f0d38f';
  ctx.fillText('X', center.x + keySpread, labelY);
  ctx.restore();
}
function playSpellSound() { playTone(220, .16, 'sine', .022); playTone(440, .26, 'triangle', .024, .08); playTone(660, .32, 'sine', .018, .17); }

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
    if (!state.tutorialSpell) {
      state.tutorialSpell = true;
      state.selectedSpellId = GATE_TUTORIAL_SPELL.id;
      unlocked = GATE_TUTORIAL_SPELL;
      updateHud();
    }
    updateSpellCard(0, unlocked || GATE_TUTORIAL_SPELL);
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
  if (scrollRecordNumber) scrollRecordNumber.textContent = item.intro ? 'ENTRY SCROLL' : 'FIELD RECORD';
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
function closeReading() { if (!state.reading) return; state.reading = null; state.readingElapsed = 0; readingOverlay.classList.remove('open', 'intro-scroll'); window.setTimeout(() => { if (!state.reading) readingOverlay.hidden = true; }, 550); }
function interactWithLightDoor() {
  if (!state.doorOfLight?.active) return false;
  const distance = Math.hypot(state.doorOfLight.x - state.player.x, state.doorOfLight.y - state.player.y);
  if (distance > 1.65) return false;
  state.gameComplete = true;
  state.endingFade = 0;
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
  showToast('The archive gate opens. The world is waiting.', 'good');
  playTone(82, .45, 'sawtooth', .032); playTone(164, .5, 'triangle', .018, .15);
  return true;
}
function interactWithLobbyGate() {
  if (state.room !== 0 || lobbyGateDistance() > 1.65) return false;
  if (state.lobbyGateOpen) return true;
  if (!state.weapon.equipped) {
    showToast('Equip a weapon before opening the archive gate.');
  } else if (!state.tutorialSpell) {
    showToast('The archive gate is sealed. Find and read the glowing portfolio scroll first.');
  } else {
    showToast('Archive Key ready. Press Q to cast it at the gate.');
  }
  return true;
}
function updateLobbyGate(delta) {
  if (!state.lobbyGateOpening) return;
  state.lobbyGateProgress = clamp(state.lobbyGateProgress + delta / 1.25, 0, 1);
  if (state.lobbyGateProgress >= 1) { state.lobbyGateOpening = false; state.lobbyGateOpen = true; showToast('ARCHIVE GATE OPEN · ENTER THE WORLD.', 'good'); }
}
function resumePedestalDistance() {
  return state.room === SANCTUARY_ROOM_INDEX
    ? Math.hypot(SANCTUARY_RESUME_PEDESTAL.x - state.player.x, SANCTUARY_RESUME_PEDESTAL.y - state.player.y)
    : Infinity;
}
function downloadSanctuaryResume() {
  if (state.room !== SANCTUARY_ROOM_INDEX || state.resumeDownloaded) return false;
  state.resumeDownloaded = true;
  const link = document.createElement('a');
  link.href = 'assets/Liam_Hosfeld_Resume.pdf';
  link.download = 'Liam-Hosfeld-Operations-Analytics-Resume.pdf';
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  spawnParticles(SANCTUARY_RESUME_PEDESTAL.x, SANCTUARY_RESUME_PEDESTAL.y, 1.15, ['#fff8d6', '#b8f0e2', '#f0d38f'], settings.reducedMotion ? 16 : 46, { speed: 1.5, life: 1.35, size: 1.05, upward: 1, spread: TAU, gravity: -.12, drag: .96, glow: 23, trail: true });
  state.impactBursts.push({ x: SANCTUARY_RESUME_PEDESTAL.x, y: SANCTUARY_RESUME_PEDESTAL.y, z: 1.1, elapsed: 0, duration: 1.4, color: '#fff8d6', radius: 1.15, style: 'resume' });
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
  // Equip by loadout type only. The static display remains in the lobby and is
  // never reused as the player's original/held weapon object.
  setWeapon(creature.type);
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
  const scroll = getNearestLobbyScroll();
  if (scroll) { scroll.recovered = true; openReading(scroll); updateHud(); return; }
  const item = getNearestItem();
  if (!item) { showToast('Move closer to a weapon keeper, glowing scroll, health potion, field record, or the gate.'); return; }
  if (item.kind === 'health-potion') return;
  item.recovered = true; state.recoveredItems.add(item.id); openReading(item); updateHud();
}

function castRay(angle) {
  const rayDirX = Math.cos(angle); const rayDirY = Math.sin(angle);
  let mapX = Math.floor(state.player.x); let mapY = Math.floor(state.player.y);
  const deltaDistX = Math.abs(rayDirX) < .00001 ? 1e30 : Math.abs(1 / rayDirX);
  const deltaDistY = Math.abs(rayDirY) < .00001 ? 1e30 : Math.abs(1 / rayDirY);
  const stepX = rayDirX < 0 ? -1 : 1; const stepY = rayDirY < 0 ? -1 : 1;
  let sideDistX = rayDirX < 0 ? (state.player.x - mapX) * deltaDistX : (mapX + 1 - state.player.x) * deltaDistX;
  let sideDistY = rayDirY < 0 ? (state.player.y - mapY) * deltaDistY : (mapY + 1 - state.player.y) * deltaDistY;
  let side = 0; let distance = 0;
  while (distance < MAX_DEPTH) {
    if (sideDistX < sideDistY) { sideDistX += deltaDistX; mapX += stepX; side = 0; distance = sideDistX - deltaDistX; }
    else { sideDistY += deltaDistY; mapY += stepY; side = 1; distance = sideDistY - deltaDistY; }
    if (mapY < 0 || mapY >= WORLD_HEIGHT || mapX < 0 || mapX >= WORLD_WIDTH || worldMap[mapY][mapX] === '1') {
      distance = Math.max(.001, Math.abs(distance));
      const hitX = state.player.x + rayDirX * distance; const hitY = state.player.y + rayDirY * distance;
      const wallX = side === 0 ? hitY - Math.floor(hitY) : hitX - Math.floor(hitX);
      return { distance, hitX, hitY, wallX: clamp(wallX, 0, .999), vertical: side === 0 };
    }
  }
  return { distance: MAX_DEPTH, hitX: state.player.x + rayDirX * MAX_DEPTH, hitY: state.player.y + rayDirY * MAX_DEPTH, wallX: 0, vertical: false };
}
function torchInfluence(x, y) { return 0; }
function sampleLight(x, y) {
  if (state.room === SANCTUARY_ROOM_INDEX) return clamp(.92 + clamp(1 - Math.hypot(x - state.player.x, y - state.player.y) / 12, 0, 1) * .18, .82, 1.18);
  if (state.room === 0) {
    const lobbyBase = .84 + clamp(1 - Math.hypot(x - state.player.x, y - state.player.y) / 10, 0, 1) * .22;
    const fireWarmth = clamp(1 - Math.hypot(x - LOBBY_CAMPFIRE.x, y - LOBBY_CAMPFIRE.y) / 5.8, 0, 1) * .14;
    return clamp(lobbyBase + fireWarmth, .7, 1.22);
  }
  return clamp(.25 + clamp(1 - Math.hypot(x - state.player.x, y - state.player.y) / 5.4, 0, 1) * .18, .12, 1.1);
}
function drawBackground(width, height) {
  const palette = rooms[state.room].palette || ['#090503', '#392719', '#0e0906'];
  const forestProgress = state.room === 0
    ? clamp((state.player.x - FOREST_HALL_START) / Math.max(.01, FOREST_HALL_TRIGGER_X - FOREST_HALL_START), 0, 1)
    : 0;
  const forestLight = 1 - forestProgress * .92;
  const horizon = height / 2 + Math.tan(state.player.pitch) * focalY();
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
    x: state.player.x + Math.cos(MOON_AZIMUTH) * SKY_DISTANCE,
    y: state.player.y + Math.sin(MOON_AZIMUTH) * SKY_DISTANCE,
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
  const verticalAngle = state.player.pitch - Math.atan((y - canvas.height / 2) / focalY());
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
  const horizon = clamp(height / 2 + Math.tan(state.player.pitch) * focalY(), 0, height);
  for (let row = 0; row < ceilingBufferHeight; row += 1) {
    const screenY = row * FLOOR_STEP + FLOOR_STEP * .5;
    if (screenY >= horizon) continue;
    ceilingRowDistances[row] = clamp(ceilingDistanceAtScreenY(screenY), .35, MAX_DEPTH);
  }
  for (let ray = 0; ray < RAY_COUNT; ray += 1) {
    const angle = state.player.angle + (ray / RAY_COUNT - .5) * FOV;
    const directionX = Math.cos(angle); const directionY = Math.sin(angle);
    for (let row = 0; row < ceilingBufferHeight; row += 1) {
      const screenY = row * FLOOR_STEP + FLOOR_STEP * .5;
      if (screenY >= horizon) continue;
      const distance = ceilingRowDistances[row];
      const worldX = state.player.x + directionX * distance;
      const worldY = state.player.y + directionY * distance;
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
  const textureStone = textures.stone; const textureWood = textures.wood;
  for (let ray = 0; ray < RAY_COUNT; ray += 1) {
    const cameraX = ray / RAY_COUNT - .5; const angle = state.player.angle + cameraX * FOV; const hit = castRay(angle); const corrected = hit.distance * Math.cos(angle - state.player.angle);
    const top = projectY(CEILING_Z, corrected); const base = projectY(FLOOR_Z, corrected); const x = ray * width / RAY_COUNT; const room = materialRoomAtX(hit.hitX); const texture = room.material === 'wood' ? textureWood : textureStone;
    state.zBuffer[ray] = corrected; state.floorBase[ray] = base;
    if (base <= 0 || top >= height) continue;
    const sourceX = Math.floor(hit.wallX * texture.width); ctx.drawImage(texture, sourceX, 0, 1, texture.height, x, top, width / RAY_COUNT + 1, base - top);
    const light = sampleLight(hit.hitX, hit.hitY); const fog = clamp((corrected - 3) / 17, 0, .72); const darkness = clamp(1 - light * .8 + fog * .44, .08, .9);
    const wallShade = state.room === SANCTUARY_ROOM_INDEX ? `rgba(37, 111, 105, ${darkness * .16})` : state.room === 0 ? `rgba(22, 55, 41, ${darkness * .42})` : `rgba(8, 4, 2, ${darkness})`; ctx.fillStyle = wallShade; ctx.fillRect(x, top, width / RAY_COUNT + 1, base - top);
    const warmth = clamp(torchInfluence(hit.hitX, hit.hitY) * .035, 0, .08); if (warmth > .005) { ctx.fillStyle = `rgba(196, 112, 43, ${warmth})`; ctx.fillRect(x, top, width / RAY_COUNT + 1, base - top); }
    if (hit.vertical) { ctx.fillStyle = 'rgba(24, 10, 3, .13)'; ctx.fillRect(x, top, 1, base - top); }
  }
}
function groundDistanceAtScreenY(y) { const verticalAngle = state.player.pitch - Math.atan((y - canvas.height / 2) / focalY()); const denominator = -Math.tan(verticalAngle); return denominator > .01 ? EYE_HEIGHT / denominator : MAX_DEPTH; }
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
    const angle = state.player.angle + (ray / RAY_COUNT - .5) * FOV;
    const directionX = Math.cos(angle); const directionY = Math.sin(angle);
    for (let row = startRow; row < floorBufferHeight; row += 1) {
      const distance = floorRowDistances[row];
      const worldX = state.player.x + directionX * distance;
      const worldY = state.player.y + directionY * distance;
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
  if (item.kind === 'health-potion') {
    paint.fillStyle = '#6a2b2a';
    paint.beginPath(); paint.arc(0, 9, 23, 0, TAU); paint.fill(); paint.stroke();
    paint.fillStyle = '#d16f63';
    paint.fillRect(-15, -18, 30, 30);
    paint.fillStyle = '#f0ddaf';
    paint.fillRect(-8, -29, 16, 11);
    paint.fillStyle = '#fff1b0';
    paint.fillRect(-4, -12, 8, 22); paint.fillRect(-12, -5, 24, 8);
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

/* Portfolio records are world meshes, never camera-facing cards. */
function portfolioItemFaces(item) {
  const faces = [];
  const yaw = Math.atan2(state.player.y - item.y, state.player.x - item.x);
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
function transformLocalPoint(enemy, point, yaw) { const world = localToWorld(enemy.x, enemy.y, yaw, point); return cameraPoint(world.x, world.y, world.z); }
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
function enemyMeshContext(enemy) {
  const profile = enemyProfile(enemy);
  const faces = [];
  const yaw = Math.atan2(state.player.y - enemy.y, state.player.x - enemy.x);
  const walk = enemy.alerted ? Math.sin(enemy.walkPhase) * .12 : 0;
  const attack = enemy.attackTime > 0 ? easeOutCubic(1 - enemy.attackTime / .55) : 0;
  const fall = enemy.dead ? clamp(enemy.deathTime / .75, 0, 1) : 0;
  const hover = profile.hover ? Math.sin(enemy.walkPhase * .7) * profile.hover : 0;
  const shift = (point) => ({
    side: point.side * profile.scale,
    forward: point.forward * profile.scale + fall * .18,
    z: point.z * profile.scale * (1 - fall) + .06 + hover * (1 - fall),
  });
  const box = (center, dimensions, color, shade = 1, material = null) => addBoxLocal(faces, { x: enemy.x, y: enemy.y }, shift(center), dimensions.map((value) => value * profile.scale), yaw, color, shade, material);
  const bone = (start, end, radius, color, material = null) => addBoneLocal(faces, { x: enemy.x, y: enemy.y }, shift(start), shift(end), radius * profile.scale, yaw, color, material);
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

function cockroachFaces(enemy) {
  const mesh = enemyMeshContext(enemy); const { box, bone, color: shell } = mesh;
  const darkShell = '#30241d';
  const amber = '#b8894c';
  // A low, segmented body makes this read as an actual cockroach rather than a
  // generic crawler. The head points toward the player through the authored yaw.
  box({ side: 0, forward: -.22, z: .34 }, [.48, .62, .22], darkShell, .84, 'leather');
  box({ side: 0, forward: .16, z: .38 }, [.42, .52, .28], shell, .96, 'leather');
  box({ side: 0, forward: .48, z: .4 }, [.3, .3, .2], '#4b3323', .92, 'leather');
  box({ side: 0, forward: .66, z: .42 }, [.22, .16, .14], amber, 1.02, 'steel');
  box({ side: -.12, forward: .73, z: .47 }, [.045, .035, .045], '#f0cf79', 1.1, 'steel');
  box({ side: .12, forward: .73, z: .47 }, [.045, .035, .045], '#f0cf79', 1.1, 'steel');
  for (const side of [-1, 1]) {
    for (let leg = 0; leg < 3; leg += 1) {
      const forward = .3 - leg * .28;
      const reach = .38 + (leg === 1 ? .08 : 0);
      const lift = .18 + (leg === 1 ? .03 : 0);
      bone({ side: side * .16, forward, z: .34 }, { side: side * reach, forward: forward + .18, z: lift }, .028, shell, 'leather');
      bone({ side: side * reach, forward: forward + .18, z: lift }, { side: side * (.54 + leg * .035), forward: forward - .04, z: .08 }, .022, darkShell, 'leather');
    }
  }
  bone({ side: -.08, forward: .66, z: .46 }, { side: -.34, forward: .98, z: .55 }, .018, amber, 'bone');
  bone({ side: .08, forward: .66, z: .46 }, { side: .34, forward: .98, z: .55 }, .018, amber, 'bone');
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
    case 'cockroach': return cockroachFaces(enemy);
    case 'leech': return leechFaces(enemy);
    case 'ghoul': return ghoulFaces(enemy);
    case 'beast':
    case 'hound': return quadrupedFaces(enemy);
    case 'moth': return mothFaces(enemy);
    case 'seer': return seerFaces(enemy);
    case 'quake': return quakeFaces(enemy);
    case 'warden': return wardenFaces(enemy);
    case 'archon': return archonFaces(enemy);
    default: return [];
  }
}

function drawEnemy3D(enemy) {
  // Unknown or legacy actors have no visual representation. Never substitute
  // the retired classic skeleton mesh for an authored enemy archetype.
  if (!ENEMY_PROFILES[enemy?.kind]) return;
  const profile = enemyProfile(enemy);
  const camera = cameraPoint(enemy.x, enemy.y, profile.aimHeight);
  const isArchon = Boolean(enemy.boss);
  if (camera.forward <= .1 || (!isArchon && Math.abs(Math.atan2(camera.side, camera.forward)) > FOV * .72)) return;
  if (!isArchon && camera.forward > MAX_DEPTH + 3) return;
  const aliveOpacity = enemy.dead ? clamp(1 - enemy.deathTime / .75, 0, 1) : 1;

  renderFaces(enemyFaces(enemy), aliveOpacity * profile.opacity);
  const projection = projectVerticalBounds(enemy.x, enemy.y, profile.height / 2, profile.height);
  if (!enemy.dead && state.revealTimer > 0 && projection) {
    ctx.save();
    ctx.globalAlpha = .72 + Math.sin(state.now / 120) * .14;
    ctx.strokeStyle = '#6ce0c2';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#6ce0c2';
    ctx.lineWidth = Math.max(1, projection.height * .018);
    ctx.beginPath();
    ctx.ellipse(projection.x, (projection.top + projection.bottom) / 2, Math.max(9, projection.height * .28), Math.max(12, projection.height * .48), 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }
  if (!enemy.dead && projection && projection.depth < 7 && projection.height > 12) {
    const barWidth = clamp(projection.height * .42, 16, 58);
    const x = projection.x - barWidth / 2;
    const y = projection.top - 7;
    const healthColor = hexToRgb(enemy.color || profile.color || '#984033');
    ctx.fillStyle = 'rgba(18, 6, 2, .76)';
    ctx.fillRect(x, y, barWidth, 3);
    ctx.fillStyle = rgba(healthColor, .92);
    ctx.fillRect(x, y, barWidth * clamp(enemy.hp / enemy.maxHp, 0, 1), 3);
  }
}
function objectInView(x, y, maxDistance = MAX_DEPTH + 1) {
  const dx = x - state.player.x; const dy = y - state.player.y; const distance = Math.hypot(dx, dy); if (distance > maxDistance) return false;
  const relative = Math.abs(normalizeAngle(Math.atan2(dy, dx) - state.player.angle)); return relative < FOV * .82;
}
function treeFootprintIsClear(tree) {
  const radius = .82 * (tree.scale || 1);
  for (let index = 0; index < 16; index += 1) {
    const angle = index * TAU / 16;
    if (isWall(tree.x + Math.cos(angle) * radius, tree.y + Math.sin(angle) * radius)) return false;
  }
  return !isWall(tree.x, tree.y);
}
function drawGroundGlow(x, y, color, now, radius = .48, z = .035) {
  const center = projectCameraPoint(cameraPoint(x, y, z));
  if (!center) return;
  ctx.save();
  const pulse = .72 + Math.sin(now / 220 + x) * .15;
  ctx.globalAlpha = .24 * pulse;
  ctx.fillStyle = color;
  ctx.shadowBlur = 22;
  ctx.shadowColor = color;
  ctx.beginPath();
  ctx.ellipse(center.x, center.y, Math.max(5, canvas.height * radius / Math.max(1, center.depth) * .33), Math.max(2, canvas.height * radius / Math.max(1, center.depth) * .12), 0, 0, TAU);
  ctx.fill();
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
function drawLobbyStoneSlab(x0, x1, y0, y1, index, now, fill = null) {
  const points = [
    projectLobbyGroundPoint(x0, y0),
    projectLobbyGroundPoint(x1, y0),
    projectLobbyGroundPoint(x1, y1),
    projectLobbyGroundPoint(x0, y1),
  ];
  if (points.some((point) => !point)) return;
  const slabColors = ['#76634b', '#8d7657', '#665541', '#a0835e', '#5b4a39'];
  ctx.save();
  ctx.globalAlpha = .9;
  ctx.fillStyle = fill || slabColors[index % slabColors.length];
  ctx.strokeStyle = 'rgba(39, 27, 17, .74)';
  ctx.lineWidth = Math.max(1, canvas.height * .0023);
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
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
  if (state.room !== 0) return;
  const { xStart, xEnd, backY, frontY } = LOBBY_ARMORY;
  // Flat ground dressing only: the armory is an open clearing, not a room
  // inside the room. No tall back panel or vertical bay walls are rendered.
  drawLobbyGroundPanel(xStart, backY, xEnd, frontY, 'rgba(73, 102, 68, .72)', 'rgba(205, 174, 111, .72)', .88);
  drawLobbyGroundPanel(xStart + .32, backY + .3, xEnd - .32, frontY - .3, 'rgba(122, 145, 85, .2)', 'rgba(222, 202, 139, .3)', .8);

  const faces = [];
  // A low perimeter of individual stones gives the area a readable boundary
  // without creating the wall-like rendering problem from the previous design.
  for (let x = xStart + .35; x <= xEnd - .35; x += 1.18) {
    drawLobbyLowStone(faces, x, backY, '#5f604b');
    drawLobbyLowStone(faces, x, frontY, '#6e694d');
  }
  for (let y = backY + .55; y <= frontY - .55; y += 1.05) {
    drawLobbyLowStone(faces, xStart, y, '#5f604b');
    drawLobbyLowStone(faces, xEnd, y, '#6e694d');
  }
  // Four open posts mark the armory corners. They stop below the weapon meshes
  // and cannot be mistaken for enclosing walls.
  for (const [x, y] of [[xStart + .22, backY + .22], [xEnd - .22, backY + .22], [xStart + .22, frontY - .22], [xEnd - .22, frontY - .22]]) {
    addBoxLocal(faces, { x, y }, { side: 0, forward: 0, z: .38 }, [.2, .2, .76], 0, '#4b3423', .88, 'wood');
    addBoxLocal(faces, { x, y }, { side: 0, forward: 0, z: .8 }, [.32, .32, .12], 0, '#d3aa62', 1.02, 'steel');
  }
  renderFaces(faces, .96);

  drawGroundGlow((xStart + xEnd) / 2, LOBBY_ARMORY.aisleY, '#8fd4a0', now, 1.25, .035);
  drawLobbyStoneSlab(xStart + .3, xEnd - .3, LOBBY_ARMORY.aisleY - .14, LOBBY_ARMORY.aisleY + .14, 2, now, 'rgba(208, 184, 120, .42)');
  drawLobbyLantern(xStart + .65, backY + .52, now, '#f0d38f');
  drawLobbyLantern(xEnd - .65, backY + .52, now, '#f0d38f');

  const sign = projectCameraPoint(cameraPoint((xStart + xEnd) / 2, backY + .06, 1.52));
  // No hovering room labels: let the geometry communicate the space.
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
  if (state.room !== 0) return;
  const fire = LOBBY_CAMPFIRE;
  const origin = { x: fire.x, y: fire.y };
  const faces = [];
  const stoneCount = 9;
  for (let index = 0; index < stoneCount; index += 1) {
    const angle = index / stoneCount * TAU;
    const radius = .62;
    addBoxLocal(faces, origin, { side: Math.sin(angle) * radius, forward: Math.cos(angle) * radius, z: .12 }, [.32, .25, .24], angle + Math.PI / 2, '#716a50', .9 - (index % 3) * .05, 'stone');
  }
  addBoxLocal(faces, origin, { side: 0, forward: 0, z: .23 }, [.16, .92, .16], .45, '#6a3e24', .92, 'wood');
  addBoxLocal(faces, origin, { side: 0, forward: 0, z: .3 }, [.16, .92, .16], -.45, '#7b4827', .86, 'wood');
  addBoxLocal(faces, origin, { side: 0, forward: 0, z: .57 }, [.28, .24, .46], .08, '#d85f35', 1.04, 'steel');
  addBoxLocal(faces, origin, { side: -.03, forward: .02, z: .74 }, [.16, .14, .36], -.18, '#f0a24b', 1.12, 'steel');
  renderFaces(faces, .98);
  drawGroundGlow(fire.x, fire.y, '#f0a24b', now, 1.16, .035);
  drawProjectedWorldRing({ x: fire.x, y: fire.y }, .78, '#e7ad67', .4 + Math.sin(now / 180) * .08, 18, .045, Math.max(1, canvas.height * .0025));

  const flame = projectCameraPoint(cameraPoint(fire.x, fire.y, .94));
  const flameBase = projectCameraPoint(cameraPoint(fire.x, fire.y, .36));
  if (lobbyProjectionIsVisible(flame, .12) && flameBase) {
    const pulse = .9 + Math.sin(now / 115) * .08;
    ctx.save();
    ctx.globalAlpha = .82 * pulse;
    ctx.shadowBlur = 26;
    ctx.shadowColor = '#f0a24b';
    ctx.fillStyle = '#f7c967';
    ctx.beginPath();
    ctx.moveTo(flameBase.x - 9 * pulse, flameBase.y);
    ctx.quadraticCurveTo(flame.x - 11, flame.y + 12, flame.x, flame.y - 14 * pulse);
    ctx.quadraticCurveTo(flame.x + 13, flame.y + 10, flameBase.x + 9 * pulse, flameBase.y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff1b0';
    ctx.beginPath();
    ctx.moveTo(flameBase.x - 4, flameBase.y);
    ctx.quadraticCurveTo(flame.x - 5, flame.y + 12, flame.x, flame.y - 4);
    ctx.quadraticCurveTo(flame.x + 6, flame.y + 10, flameBase.x + 4, flameBase.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Smoke is built from depth-checked projected puffs so it cannot smear across
  // the sky or draw through the lobby edge walls when the player turns.
  for (let index = 0; index < 6; index += 1) {
    const rise = index * .34 + .18;
    const drift = Math.sin(now / (900 + index * 75) + index * 1.4) * (.08 + index * .035) + Math.sin(now / 1500 + index) * .05;
    const puff = projectCameraPoint(cameraPoint(fire.x + drift, fire.y + Math.cos(index * 1.8) * .035, .92 + rise));
    if (!lobbyProjectionIsVisible(puff, .16)) continue;
    const radius = clamp(canvas.height * (.022 + index * .004) / Math.max(.8, puff.depth), 4, 22);
    ctx.save();
    ctx.globalAlpha = (.24 - index * .025) * (.9 + Math.sin(now / 410 + index) * .08);
    ctx.fillStyle = index % 2 ? '#b9c1af' : '#d6d0b5';
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#9fa998';
    ctx.beginPath();
    ctx.arc(puff.x - radius * .55, puff.y + radius * .12, radius * .75, 0, TAU);
    ctx.arc(puff.x + radius * .35, puff.y - radius * .18, radius, 0, TAU);
    ctx.arc(puff.x + radius * .8, puff.y + radius * .18, radius * .62, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  // No hovering camp label; the fire is the landmark.
}
function drawLobbyStonePath(now) {
  if (state.room !== 0 || !LOBBY_GATE) return;
  const startX = roomOffsets[0] + 5.15;
  const endX = LOBBY_GATE.x - .62;
  const centerY = LOBBY_WEAPON_PATH_Y;
  const pathWidth = 1.12;
  const slabLength = .78;
  for (let x = startX, index = 0; x < endX; x += slabLength, index += 1) {
    const x0 = x + .045;
    const x1 = Math.min(endX, x + slabLength - .06);
    const wobble0 = Math.sin(index * 1.7) * .045;
    const wobble1 = Math.sin((index + 1) * 1.7) * .045;
    drawLobbyStoneSlab(x0, x1, centerY - pathWidth / 2 + wobble0, centerY + pathWidth / 2 + wobble1, index, now);
  }
  drawLobbyBranchPath(LOBBY_ARMORY.xStart + .42, centerY - .46, LOBBY_ARMORY.aisleY, .86, now, 'rgba(178, 153, 102, .72)');
  drawLobbyBranchPath(LOBBY_ARMORY.xEnd - .48, centerY + .46, lobbyPortfolioScroll.y - .48, .72, now, 'rgba(143, 122, 83, .64)');
  drawLobbyStoneSlab(LOBBY_ARMORY.xStart + .22, LOBBY_ARMORY.xEnd - .22, LOBBY_ARMORY.aisleY - .16, LOBBY_ARMORY.aisleY + .16, 1, now, 'rgba(194, 165, 105, .52)');

  const edgeA = projectLobbyGroundPoint(startX, centerY - pathWidth / 2 - .08);
  const edgeB = projectLobbyGroundPoint(endX, centerY - pathWidth / 2 - .08);
  const edgeC = projectLobbyGroundPoint(startX, centerY + pathWidth / 2 + .08);
  const edgeD = projectLobbyGroundPoint(endX, centerY + pathWidth / 2 + .08);
  if ([edgeA, edgeB, edgeC, edgeD].every(Boolean)) {
    ctx.save();
    ctx.globalAlpha = .27;
    ctx.strokeStyle = '#c4a66b';
    ctx.lineWidth = Math.max(2, canvas.height * .005);
    ctx.setLineDash([2, 12]);
    ctx.beginPath(); ctx.moveTo(edgeA.x, edgeA.y); ctx.lineTo(edgeB.x, edgeB.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(edgeC.x, edgeC.y); ctx.lineTo(edgeD.x, edgeD.y); ctx.stroke();
    ctx.restore();
  }
  drawGroundGlow(roomOffsets[0] + 5.35, centerY, '#b8f0e2', now, 1.15, .035);
  drawProjectedWorldRing({ x: roomOffsets[0] + 5.35, y: centerY }, 1.04, '#b8f0e2', .38 + Math.sin(now / 280) * .06, 28, .05, Math.max(1, canvas.height * .0025));
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
    ctx.save();
    ctx.globalAlpha = .9;
    ctx.fillStyle = slabColors[index % slabColors.length];
    ctx.strokeStyle = 'rgba(35, 31, 22, .72)';
    ctx.lineWidth = Math.max(1, canvas.height * .0022);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
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
  if (state.room === 0) {
    // Keep the spawn courtyard open. Weapon displays remain as the only
    // intentional lobby dressing; remove the old ground panels, stones,
    // lanterns, and branching showcase paths.
    drawLobbyCampfire(now);
    drawForestHallPath(now);
  }
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

function drawLobbyWeaponMesh3D(creature, now = state.now || performance.now()) {
  if (state.room !== 0 || !creature) return;

  const faces = [];
  const origin = { x: creature.x, y: creature.y };
  // Keep each display fixed in world space. These are not billboards.
  const yaw = creature.yaw ?? 0;
  const type = creature.type;
  const color = type === 'wand' ? '#db8872' : type === 'crossbow' ? '#f0d38d' : type === 'blade' ? '#b8f0e2' : '#d8c18b';
  const light = type === 'wand' ? '#f4a06d' : type === 'crossbow' ? '#fff0b2' : type === 'blade' ? '#effff7' : '#fff4c7';
  const pedestalTop = .30;
  let bottomZ = pedestalTop + .015;
  let topZ = .58;
  let haloRadius = .24;

  drawLobbyWeaponPedestal(faces, origin, yaw, color);

  if (type === 'stars') {
    // The pedestal star is intentionally tiny so it reads as a display item,
    // not a second pedestal. It is 20% of the previous plate size.
    const starYaw = yaw + now / 1800;
    const pedestalStarSize = .072;
    addFlatSquareBladeWorld(faces, origin, { side: 0, forward: 0, z: .325 }, pedestalStarSize, .005, starYaw, color, 1.16);
    addBoxLocal(faces, origin, { side: 0, forward: 0, z: .327 }, [.011, .011, .008], starYaw, '#5b3d25', 1, 'steel');
    topZ = .47;
    haloRadius = .22;
  } else if (type === 'crossbow') {
    // Small stand-alone crossbow, scaled to sit naturally on the pedestal cap.
    addBoxLocal(faces, origin, { side: 0, forward: 0, z: .35 }, [.07, .32, .07], yaw, '#704622', 1, 'wood');
    addBoxLocal(faces, origin, { side: 0, forward: .14, z: .445 }, [.44, .06, .07], yaw, '#a87843', 1.08, 'wood');
    addBoxLocal(faces, origin, { side: 0, forward: .17, z: .47 }, [.38, .018, .018], yaw, '#fff0b2', 1.14, 'steel');
    addBoxLocal(faces, origin, { side: -.23, forward: .14, z: .445 }, [.06, .06, .13], yaw, '#b9b7a0', .96, 'steel');
    addBoxLocal(faces, origin, { side: .23, forward: .14, z: .445 }, [.06, .06, .13], yaw, '#b9b7a0', .88, 'steel');
    topZ = .61;
    haloRadius = .27;
  } else if (type === 'wand') {
    // Small upright Ember Wand with its base seated on the pedestal cap.
    addBoxLocal(faces, origin, { side: 0, forward: 0, z: .59 }, [.055, .055, .56], yaw, '#4a2d20', 1.02, 'wood');
    addBoxLocal(faces, origin, { side: 0, forward: 0, z: .90 }, [.12, .10, .11], yaw, '#d97856', 1.12, 'steel');
    addBoxLocal(faces, origin, { side: 0, forward: 0, z: 1.01 }, [.06, .06, .08], yaw, light, 1.2, 'steel');
    topZ = 1.11;
    haloRadius = .19;
  } else if (type === 'blade') {
    addBoxLocal(faces, origin, { side: 0, forward: 0, z: .39 }, [.08, .08, .3], yaw, '#3a241b', .98, 'leather');
    addBoxLocal(faces, origin, { side: 0, forward: 0, z: .57 }, [.36, .08, .06], yaw, color, 1.04, 'steel');
    addBoxLocal(faces, origin, { side: 0, forward: 0, z: 1.05 }, [.13, .04, .9], yaw, '#cfe8dc', 1.06, 'steel');
    addBoxLocal(faces, origin, { side: 0, forward: 0, z: 1.52 }, [.02, .04, .08], yaw, light, 1.15, 'steel');
    topZ = 1.58;
    haloRadius = .25;
  } else {
    return;
  }

  renderFaces(faces, .99, true);
  drawGroundGlow(creature.x, creature.y, color, now, .44, .035);
  drawLobbyWeaponHalos(creature, now, bottomZ, topZ, haloRadius, color, light);

  const anchor = projectCameraPoint(cameraPoint(creature.x, creature.y, bottomZ + (topZ - bottomZ) * .5));
  if (!anchor) return;

  const size = clamp(canvas.height * .065 / Math.max(.8, anchor.depth), 9, 28);
  ctx.save();
  ctx.globalAlpha = .82;
  ctx.strokeStyle = light;
  ctx.shadowBlur = Math.max(6, size * .3);
  ctx.shadowColor = light;
  ctx.lineWidth = Math.max(1, size * .07);
  if (type === 'stars') {
    ctx.strokeRect(anchor.x - size * .42, anchor.y - size * .18, size * .84, size * .36);
  } else if (type === 'crossbow') {
    ctx.beginPath();
    ctx.moveTo(anchor.x - size * .48, anchor.y);
    ctx.lineTo(anchor.x + size * .48, anchor.y);
    ctx.stroke();
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

function drawCrossbowWeapon3D(creature, now) {
  drawLobbyWeaponMesh3D(creature, now);
}

function drawEmberWandWeapon3D(creature, now) {
  drawLobbyWeaponMesh3D(creature, now);
}

function drawLobbyWeaponCreature(creature, now = state.now || performance.now()) {
  if (!creature) return;
  if (creature.type === 'stars') drawNinjaStarWeapon3D(creature, now);
  else if (creature.type === 'crossbow') drawCrossbowWeapon3D(creature, now);
  else if (creature.type === 'wand') drawEmberWandWeapon3D(creature, now);
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
function drawLobbyTree3D(tree, now) {
  if (state.room !== (tree.roomIndex ?? 0) || !objectInView(tree.x, tree.y, 24)) return;
  const faces = [];
  const origin = { x: tree.x, y: tree.y };
  const scale = tree.scale || 1;
  // Trees are authored world props, not billboards. Keep their facing fixed.
  const yaw = tree.yaw ?? 0;
  const box = (center, dimensions, color, shade = 1, material = null) => addBoxLocal(
    faces,
    origin,
    { side: center.side * scale, forward: center.forward * scale, z: center.z * scale },
    dimensions.map((value) => value * scale),
    yaw,
    color,
    shade,
    material,
  );
  // Trunk, split branches, then overlapping faceted canopy volumes. No sprite.
  box({ side: 0, forward: 0, z: .55 }, [.34, .34, 1.1], '#4a2e1d', .94, 'wood');
  box({ side: -.18, forward: .02, z: .98 }, [.12, .15, .64], '#70462a', .82, 'wood');
  box({ side: .2, forward: .03, z: 1.03 }, [.12, .14, .58], '#6b4228', .76, 'wood');
  box({ side: 0, forward: 0, z: 1.42 }, [1.24, .92, .7], '#1f6844', .96, null);
  box({ side: -.37, forward: .02, z: 1.7 }, [.72, .62, .62], '#2f8a52', 1.02, null);
  box({ side: .37, forward: .02, z: 1.7 }, [.72, .62, .62], '#277745', .98, null);
  box({ side: 0, forward: .02, z: 2.03 }, [.58, .5, .5], '#70b965', 1.04, null);
  renderFaces(faces, .98);
  drawGroundGlow(tree.x, tree.y, '#6c9d68', now, .84 * scale, .035);
}

function drawLobbyBush3D(bush, now) {
  if (state.room !== (bush.roomIndex ?? 0) || !objectInView(bush.x, bush.y, 24)) return;
  const faces = [];
  const origin = { x: bush.x, y: bush.y };
  const scale = bush.scale || 1;
  const yaw = bush.yaw ?? 0;
  const box = (center, dimensions, color, shade = 1, material = null) => addBoxLocal(
    faces,
    origin,
    { side: center.side * scale, forward: center.forward * scale, z: center.z * scale },
    dimensions.map((value) => value * scale),
    yaw,
    color,
    shade,
    material,
  );

  // Overlapping cuboids keep the bush faceted and low-poly while giving it a
  // softer silhouette than another full tree canopy.
  box({ side: 0, forward: 0, z: .13 }, [.7, .56, .24], '#174b34', .88, null);
  box({ side: -.22, forward: .01, z: .31 }, [.56, .48, .42], '#236b40', .98, null);
  box({ side: .2, forward: .03, z: .34 }, [.58, .5, .46], '#2e8050', 1.02, null);
  box({ side: 0, forward: -.08, z: .5 }, [.42, .4, .38], '#5aa85d', 1.03, null);
  box({ side: -.08, forward: .15, z: .43 }, [.28, .24, .3], '#79bd68', 1.06, null);
  renderFaces(faces, .98);
  drawGroundGlow(bush.x, bush.y, '#4d9b5d', now, .55 * scale, .035);
}

function drawWorldObjects(now) {
  const objects = [];
  if (state.room === 0) {
    LOBBY_TREES.forEach((tree) => {
      if (treeFootprintIsClear(tree) && objectInView(tree.x, tree.y, 24)) objects.push({ type: 'lobby-tree', ...tree, distance: Math.hypot(tree.x - state.player.x, tree.y - state.player.y) });
    });
    LOBBY_BUSHES.forEach((bush) => {
      if (objectInView(bush.x, bush.y, 24)) objects.push({ type: 'lobby-bush', ...bush, distance: Math.hypot(bush.x - state.player.x, bush.y - state.player.y) });
    });
    FOREST_HALL_TREES.forEach((tree) => {
      // These are deliberately fixed world meshes. They do not billboard and
      // they do not use the old 2D forest sequence.
      if (objectInView(tree.x, tree.y, FOREST_HALL_GAP + 4)) objects.push({ type: 'forest-tree', ...tree, distance: Math.hypot(tree.x - state.player.x, tree.y - state.player.y) });
    });
    if (!lobbyPortfolioScroll.recovered && objectInView(lobbyPortfolioScroll.x, lobbyPortfolioScroll.y, 16)) objects.push({ type: 'lobby-scroll', ...lobbyPortfolioScroll, distance: Math.hypot(lobbyPortfolioScroll.x - state.player.x, lobbyPortfolioScroll.y - state.player.y) });
    if (objectInView(LOBBY_ENTRANCE_SIGN.x, LOBBY_ENTRANCE_SIGN.y, 28)) objects.push({ type: 'lobby-entrance-sign', ...LOBBY_ENTRANCE_SIGN, distance: Math.hypot(LOBBY_ENTRANCE_SIGN.x - state.player.x, LOBBY_ENTRANCE_SIGN.y - state.player.y) });
    if (objectInView(LOBBY_GATE.x, LOBBY_GATE.y, 26)) objects.push({ type: 'lobby-gate', ...LOBBY_GATE, distance: Math.hypot(LOBBY_GATE.x - state.player.x, LOBBY_GATE.y - state.player.y) });
  }
  if (state.room === SANCTUARY_ROOM_INDEX) {
    SANCTUARY_TREES.forEach((tree) => {
      if (treeFootprintIsClear(tree) && objectInView(tree.x, tree.y, 24)) objects.push({ type: 'lobby-tree', ...tree, distance: Math.hypot(tree.x - state.player.x, tree.y - state.player.y) });
    });
  }
  const activeRoom = currentRoomIndex();
  worldItems.forEach((item) => { if (item.roomIndex !== activeRoom || item.recovered || !objectInView(item.x, item.y)) return; objects.push({ type: 'item', ...item, distance: Math.hypot(item.x - state.player.x, item.y - state.player.y) }); });
  // Weapon keepers use a dedicated final trader-style pass below. They are
  // intentionally not depth-sorted with trees, gates, and record props.
  // The safe lobby contains the four weapon displays only. Never allow a stale/legacy room-0 enemy
  // to occupy a weapon keeper or appear beside the portfolio scroll.
  if (state.room !== 0) worldEnemies.forEach((enemy) => { if (enemy.roomIndex !== state.room) return; if ((!enemy.dead || enemy.deathTime < .75) && objectInView(enemy.x, enemy.y)) objects.push({ type: 'enemy', ...enemy, distance: Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y) }); });
  if (state.room === FINAL_ROOM_INDEX && state.finalBoss && (!state.finalBoss.dead || state.finalBoss.deathTime < 2.4)) {
    const bossDistance = Math.hypot(state.finalBoss.x - state.player.x, state.finalBoss.y - state.player.y);
    if (objectInView(state.finalBoss.x, state.finalBoss.y, BOSS_RENDER_DEPTH) || state.finalArenaTime > 0) objects.push({ type: 'enemy', ...state.finalBoss, distance: bossDistance });
  }
  objects.sort((a, b) => b.distance - a.distance);
  for (const object of objects) {
    if (object.type === 'lobby-tree' || object.type === 'forest-tree') drawLobbyTree3D(object, now);
    else if (object.type === 'lobby-bush') drawLobbyBush3D(object, now);
    else if (object.type === 'lobby-scroll') drawLobbyPortfolioScroll(object, now);
    else if (object.type === 'lobby-entrance-sign') drawLobbyEntranceSign(object, now);
    else if (object.type === 'lobby-gate') drawLobbyGate(now);
    else if (object.type === 'item') {
      if (['scroll', 'ledger', 'chronicle', 'map', 'health-potion'].includes(object.kind)) {
        const bob = object.dropFromEnemy ? Math.sin(now * .003 + (object.bobPhase || 0)) * .09 : 0;
        const itemZ = .48 + bob;
        drawBillboard(makeItemSprite(object), projectBillboard(object.x, object.y, itemZ, .55), .9);
        if (object.dropFromEnemy) drawGroundGlow(object.x, object.y, object.color || '#e7ad67', now, .56, .035);
        if (state.revealTimer > 0) {
          const projection = projectBillboard(object.x, object.y, itemZ, .55);
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

  // Draw the weapon-only displays after every other lobby prop so they remain
  // visible and interactable even when a tree or gate overlaps their projection.
  if (currentRoomIndex() === 0) {
    for (const keeper of LOBBY_WEAPON_CREATURES) drawLobbyWeaponCreature(keeper, now);
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

function drawWorldProjectiles(now) {
  for (const projectile of state.projectiles) {
    const camera = cameraPoint(projectile.x, projectile.y, projectile.z);
    if (camera.forward <= .04 || Math.abs(Math.atan2(camera.side, camera.forward)) > FOV * .9) continue;
    const color = projectile.color;
    const projectileSpellPalette = projectile.spell ? spellVisualPalette({ color: projectile.color, kind: projectile.spellKind }) : null;
    const renderColor = projectileSpellPalette?.base || color;
    const renderAccent = projectileSpellPalette?.accent || color;
    const renderLight = projectileSpellPalette?.light || vividSpellRgb('#fff1b0');
    const yaw = Math.atan2(projectile.vy, projectile.vx);
    const faces = [];
    const size = projectile.kind === 'arrow' ? .1 : projectile.kind === 'ninja-star' ? .14 : projectile.kind === 'boss-bolt' ? .2 : projectile.spell ? .085 : .18;
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
      addBoxLocal(faces, projectile, { side: 0, forward: 0, z: projectile.z }, [.045, .72, .045], yaw, '#d5b66e', 1, 'steel');
      addBoxLocal(faces, projectile, { side: 0, forward: .42, z: projectile.z }, [.16, .18, .16], color, 1.12, 'steel');
      addBoxLocal(faces, projectile, { side: 0, forward: -.27, z: projectile.z }, [.18, .1, .025], '#efe0a9', .95, 'steel');
    } else if (projectile.spell) {
      const spellScale = projectile.spellKind === 'fireball' ? 1.7 : projectile.spellKind === 'chain' ? 1.35 : 1.2;
      addBoxLocal(faces, projectile, { side: 0, forward: 0, z: projectile.z }, [size * spellScale, size * spellScale, size * spellScale], yaw, renderColor, 1.12, null);
      addBoxLocal(faces, projectile, { side: 0, forward: 0, z: projectile.z }, [size * spellScale * .5, size * spellScale * .5, size * spellScale * .5], yaw + Math.PI / 4, renderLight, 1.18, null);
      if (projectile.spellKind === 'fireball') addBoxLocal(faces, projectile, { side: 0, forward: -.2, z: projectile.z }, [size * 2.1, size * .42, size * .42], yaw, renderAccent, 1.02, null);
      if (projectile.spellKind === 'chain' || projectile.spellKind === 'beam') addBoxLocal(faces, projectile, { side: 0, forward: -.18, z: projectile.z + .08 }, [size * .34, size * 1.8, size * .34], yaw + Math.PI / 4, renderAccent, 1.02, null);
    } else {
      const coreScale = projectile.kind === 'spell-chain' ? 1.25 : projectile.kind === 'spell-orb' ? 1.08 : 1;
      addBoxLocal(faces, projectile, { side: 0, forward: 0, z: projectile.z }, [size * coreScale, size * coreScale, size * coreScale], yaw, color, 1.15, 'steel');
      addBoxLocal(faces, projectile, { side: 0, forward: 0, z: projectile.z }, [size * .54, size * .54, size * .54], yaw, '#fff1b0', 1.18, 'steel');
      if (projectile.kind === 'spell-fireball' || projectile.kind === 'wand-fireball') {
        addBoxLocal(faces, projectile, { side: 0, forward: -.2, z: projectile.z }, [size * 1.5, size * .35, size * .35], yaw, '#9f3f2f', .9, 'steel');
        addBoxLocal(faces, projectile, { side: 0, forward: -.38, z: projectile.z }, [size * .9, size * .18, size * .18], yaw, '#f3b34e', 1, 'steel');
      }
      if (projectile.kind === 'spell-chain') {
        addBoxLocal(faces, projectile, { side: 0, forward: -.28, z: projectile.z + .1 }, [size * .32, size * 2.2, size * .32], yaw + Math.PI / 4, color, .95, 'steel');
      }
      if (projectile.kind === 'boss-ring') {
        addBoxLocal(faces, projectile, { side: 0, forward: .18, z: projectile.z }, [size * .55, size * 1.8, size * .55], yaw, '#fff1b0', 1.05, 'steel');
      }
    }
    if (faces.length) renderFaces(faces, clamp(.3 + projectile.lifetime / projectile.maxLifetime, .38, 1));
    const projectilePoint = projectCameraPoint(cameraPoint(projectile.x, projectile.y, projectile.z));
    if (projectilePoint && projectile.kind !== 'arrow') {
      const pulse = .72 + Math.sin(now / 85 + projectile.x * 2.1) * .22;
      ctx.save();
      let sphereRadius = 0;
      if (projectile.spell) {
        const sphereScaleByKind = { gate: 1.12, reveal: 1.05, homing: 1.18, ward: 1.1, chain: 1.08, echo: 1.04, fireball: 1.32, bloom: 1.16, beam: 1.12 };
        sphereRadius = Math.max(3.5, canvas.height * .017 / Math.max(.8, camera.forward) * (sphereScaleByKind[projectile.spellKind] || 1));
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
        if (state.renderQuality > .62) drawSpellScreenMotif(projectile.spellKind, projectilePoint.x, projectilePoint.y, sphereRadius, now, .42 * pulse, now / 240 + projectile.spin, Math.atan2(projectile.vy, projectile.vx));
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
      if (projectile.kind === 'spell-chain') {
        ctx.translate(projectilePoint.x, projectilePoint.y);
        ctx.rotate(now / 260);
        ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(4, 0); ctx.moveTo(0, -4); ctx.lineTo(0, 4); ctx.stroke();
        ctx.rotate(Math.PI / 4);
        ctx.globalAlpha = .55 * pulse;
        ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.stroke();
      }
      if (projectile.spell && projectile.orbit) {
        ctx.translate(projectilePoint.x, projectilePoint.y);
        for (let orbit = 0; orbit < projectile.orbit; orbit += 1) {
          const angle = now / (180 + orbit * 55) + projectile.spin + orbit * TAU / projectile.orbit;
          const orbitRadius = Math.max(4, canvas.height * .011 * projectile.trailSize);
          ctx.globalAlpha = .78 * pulse;
          ctx.fillStyle = orbit % 2 ? spellFocusProfile(projectile.spellKind).accent : color;
          ctx.beginPath(); ctx.arc(Math.cos(angle) * orbitRadius, Math.sin(angle) * orbitRadius, Math.max(1.5, canvas.height * .0022), 0, TAU); ctx.fill();
        }
      }
      ctx.restore();
    }
    const trail = projectile.trail || [];
    if (projectile.spell && trail.length > 1) {
      ctx.save(); ctx.lineCap = 'round';
      for (let index = 1; index < trail.length; index += 1) {
        const a = projectCameraPoint(cameraPoint(trail[index - 1].x, trail[index - 1].y, trail[index - 1].z));
        const b = projectCameraPoint(cameraPoint(trail[index].x, trail[index].y, trail[index].z));
        if (!a || !b) continue;
        ctx.globalAlpha = (1 - index / trail.length) * .48;
        ctx.strokeStyle = color; ctx.shadowBlur = 10; ctx.shadowColor = color; ctx.lineWidth = Math.max(1, canvas.height * .006 * (1 - index / trail.length));
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      ctx.restore();
    }
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
  const yaw = Math.atan2(state.player.y - pedestal.y, state.player.x - pedestal.x);
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
  for (const burst of state.impactBursts) {
    const progress = clamp(burst.elapsed / burst.duration, 0, 1);
    const center = projectCameraPoint(cameraPoint(burst.x, burst.y, burst.z));
    if (!center) continue;
    const radiusWorld = burst.radius * (0.25 + progress * .75);
    ctx.save(); ctx.globalAlpha = Math.sin(Math.PI * progress) * .7; ctx.strokeStyle = burst.color; ctx.shadowBlur = 18; ctx.shadowColor = burst.color; ctx.lineWidth = Math.max(1, canvas.height * .006);
    ctx.beginPath();
    for (let index = 0; index <= 16; index += 1) {
      const angle = index / 16 * TAU; const point = projectCameraPoint(cameraPoint(burst.x + Math.cos(angle) * radiusWorld, burst.y + Math.sin(angle) * radiusWorld, burst.z));
      if (!point) continue; if (index === 0) ctx.moveTo(point.x, point.y); else ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
    for (let spark = 0; spark < 6; spark += 1) {
      const sparkAngle = spark / 6 * TAU + burst.elapsed * 3;
      const sparkRadius = radiusWorld * (.5 + spark * .07);
      const sparkPoint = projectCameraPoint(cameraPoint(burst.x + Math.cos(sparkAngle) * sparkRadius, burst.y + Math.sin(sparkAngle) * sparkRadius, burst.z + Math.sin(sparkAngle * 2) * .22));
      if (!sparkPoint) continue;
      ctx.globalAlpha = Math.sin(Math.PI * progress) * .72;
      ctx.fillStyle = burst.color;
      ctx.beginPath(); ctx.arc(sparkPoint.x, sparkPoint.y, Math.max(1, canvas.height * .004 * (1 - progress)), 0, TAU); ctx.fill();
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

function drawNinjaStars(now) {
  const { active, t } = weaponMotion();
  const moving = state.weapon.moving;
  const bob = moving ? Math.sin(state.weapon.bobPhase) * .025 : Math.sin(now / 650) * .01;
  const throwMotion = active ? easeOutCubic(clamp(t / .55, 0, 1)) : 0;
  const recoil = active ? Math.sin(clamp(t / .72, 0, 1) * Math.PI) * .14 : 0;
  const starYaw = 0;
  const faces = [];
  const origin = { side: .39 - recoil, forward: 1.18 + throwMotion * .2, z: -.12 + bob + throwMotion * .04 };
  // The equipped Ninja Star is held lower in the view. Its face stays on the
  // side/forward plane and its thin dimension stays vertical along z.
  const starSize = .18 + (active ? .02 : 0);
  const starCenter = { side: 0, forward: .18, z: .50 };
  addFlatSquareBladeCamera(faces, origin, starCenter, starSize, .032, starYaw, '#e6d29a', 1.12);
  addFlatSquareBladeCamera(faces, origin, { ...starCenter, z: starCenter.z + .019 }, starSize * .48, .012, starYaw, '#fff0b2', .98);
  addWeaponBox(faces, origin, { side: 0, forward: .19, z: .50 }, [.045, .055, .045], 0, '#5b3d25', 1.08, 'steel');
  renderFaces(faces, 1, true);

  const center = projectCameraPoint({ side: origin.side, forward: origin.forward + .18, z: origin.z + .50 });
  if (!center) return;
  const size = Math.max(10, canvas.height * (.045 + (active ? .006 : 0)));
  ctx.save();
  ctx.globalAlpha = .28 + (active ? .24 : 0);
  ctx.strokeStyle = '#fff1b0';
  ctx.shadowBlur = 12;
  ctx.shadowColor = '#d08a4c';
  ctx.lineWidth = Math.max(1, canvas.height * .002);
  ctx.beginPath();
  ctx.arc(center.x, center.y, size * .32, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

function drawWand(now) {
  const { active, t } = weaponMotion();
  const attunement = wandColorForSpell();
  const attunementLight = selectedSpellDefinition()?.color || EMERALD_LIGHT;
  const moving = state.weapon.moving;
  const bob = moving ? Math.sin(state.weapon.bobPhase) * .02 : Math.sin(now / 620) * .008;
  const cast = active ? Math.sin(clamp(t / .82, 0, 1) * Math.PI) : 0;
  const lift = active ? easeOutCubic(clamp(t / .48, 0, 1)) * .16 : 0;
  const sideOffset = active ? -cast * .07 : 0;
  const roll = -.16 + cast * .12;
  const faces = [];
  const origin = { side: .42 + sideOffset, forward: 1.25 - cast * .08, z: -.04 + bob + lift };

  // The shaft now drops below the hand toward the ground instead of ending at the grip.
  addWeaponBox(faces, origin, { side: 0, forward: .02, z: .4 }, [.115, .12, 2.12], roll, '#4a2d20', .98, 'wood');
  addWeaponBox(faces, origin, { side: 0, forward: .035, z: .12 }, [.2, .17, .24], roll, '#241716', .94, 'leather');
  addWeaponBox(faces, origin, { side: 0, forward: .03, z: -.68 }, [.17, .16, .12], roll, '#8f6338', .92, 'steel');
  addWeaponBox(faces, origin, { side: 0, forward: .04, z: .27 }, [.17, .15, .055], roll, '#b07a3f', .94, 'steel');
  addWeaponBox(faces, origin, { side: 0, forward: .04, z: .82 }, [.15, .145, .05], roll, '#8f6338', .9, 'steel');
  addWeaponBox(faces, origin, { side: 0, forward: .05, z: 1.17 }, [.19, .18, .085], roll, '#b07a3f', 1.02, 'steel');
  addWeaponBox(faces, origin, { side: -.16, forward: .045, z: 1.21 }, [.045, .05, .28], roll, attunement, .9, 'steel');
  addWeaponBox(faces, origin, { side: .16, forward: .045, z: 1.21 }, [.045, .05, .28], roll, attunement, .9, 'steel');

  // The jewel is transformed in staff-local coordinates, so it stays seated on the tip.
  const gem = { side: .01, forward: .08, z: 1.43 };
  addWeaponBox(faces, origin, { side: gem.side, forward: gem.forward, z: gem.z - .07 }, [.15, .13, .07], roll, '#d09a4f', 1.08, null);
  addWeaponCrystal(faces, origin, gem, .12, .08, .26, roll, attunement, 1.14, null);
  addWeaponCrystal(faces, origin, { side: .01, forward: .105, z: 1.55 }, .055, .04, .12, roll, attunementLight || '#8de8d0', 1.2, null);
  renderFaces(faces, 1, true);

  const tip = projectCameraPoint({ side: origin.side, forward: origin.forward + .18, z: origin.z + 1.58 });
  if (tip) {
    ctx.save();
    ctx.globalAlpha = .22 + cast * .5 + Math.sin(now / 130) * .05;
    ctx.strokeStyle = attunement;
    ctx.shadowBlur = 24;
    ctx.shadowColor = attunement;
    ctx.lineWidth = Math.max(1, canvas.height * .004);
    ctx.beginPath(); ctx.arc(tip.x, tip.y, Math.max(6, canvas.height * (.015 + cast * .014)), 0, TAU); ctx.stroke();
    ctx.globalAlpha *= .78;
    ctx.fillStyle = attunementLight;
    ctx.beginPath(); ctx.arc(tip.x, tip.y, Math.max(2, canvas.height * .0085), 0, TAU); ctx.fill();
    for (let rune = 0; rune < 3; rune += 1) {
      const angle = now / 500 + rune * TAU / 3;
      ctx.globalAlpha = .46;
      ctx.beginPath(); ctx.arc(tip.x + Math.cos(angle) * canvas.height * .018, tip.y + Math.sin(angle) * canvas.height * .018, Math.max(1, canvas.height * .003), 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
}

function spawnNinjaStar() {
  const direction = playerAimDirection();
  const origin = { x: state.player.x + direction.x * .5, y: state.player.y + direction.y * .5, z: EYE_HEIGHT + direction.z * .05 };
  makeProjectile('ninja-star', origin, { x: direction.x * 11.5, y: direction.y * 11.5, z: direction.z * 11.5 }, { color: '#e6d29a', damage: state.weapon.attackDamage || WEAPON_LOADOUTS.stars.damage, radius: .16, lifetime: 2.2, collisionHeight: .72, knockback: WEAPON_LOADOUTS.stars.knockback, critChance: WEAPON_LOADOUTS.stars.critChance + (state.weapon.comboStep === 3 ? .1 : 0), critMultiplier: WEAPON_LOADOUTS.stars.critMultiplier, source: 'player', spell: false, trailSize: .8 });
  showToast(`Ninja star thrown · combo ${state.weapon.comboStep || 1}.`, 'good');
}
function spawnCrossbowArrow() {
  const direction = playerAimDirection();
  const origin = { x: state.player.x + direction.x * .52, y: state.player.y + direction.y * .52, z: EYE_HEIGHT + direction.z * .06 };
  makeProjectile('arrow', origin, { x: direction.x * 12, y: direction.y * 12, z: direction.z * 12 }, { color: '#f0d38d', damage: state.weapon.attackDamage || WEAPON_LOADOUTS.crossbow.damage, radius: .12, lifetime: 1.7, collisionHeight: .72, knockback: WEAPON_LOADOUTS.crossbow.knockback, critChance: WEAPON_LOADOUTS.crossbow.critChance + (state.weapon.comboStep === 3 ? .1 : 0), critMultiplier: WEAPON_LOADOUTS.crossbow.critMultiplier, source: 'player', spell: false });
  showToast(`Crossbow bolt released · combo ${state.weapon.comboStep || 1}.`, 'good');
}
function spawnWandFireball() {
  const direction = playerAimDirection();
  const color = wandColorForSpell();
  const origin = { x: state.player.x + direction.x * .58, y: state.player.y + direction.y * .58, z: EYE_HEIGHT + direction.z * .1 };
  makeProjectile('wand-fireball', origin, { x: direction.x * 7.1, y: direction.y * 7.1, z: direction.z * 7.1 }, { color, damage: state.weapon.attackDamage || WEAPON_LOADOUTS.wand.damage, radius: .23, lifetime: 2.8, aoe: 1.55, knockback: WEAPON_LOADOUTS.wand.knockback, stagger: .18, critChance: WEAPON_LOADOUTS.wand.critChance + (state.weapon.comboStep === 3 ? .08 : 0), critMultiplier: WEAPON_LOADOUTS.wand.critMultiplier, trailSize: 1, orbit: 0, collisionHeight: .88, source: 'player', spell: false });
  showToast(`${weaponDefinition().label} launched ${wandSpellName()} fire · combo ${state.weapon.comboStep || 1}.`, 'good');
  state.impactBursts.push({ x: state.player.x + direction.x * .42, y: state.player.y + direction.y * .42, z: EYE_HEIGHT, elapsed: 0, duration: .28, color, radius: .32, style: 'weapon-cast' });
}
function drawCrossbowArrow() { /* Arrows are rendered from state.projectiles in world space. */ }

function drawSword(now) {
  const { active, t, definition } = weaponMotion();
  const moving = state.weapon.moving;
  const bob = moving ? Math.sin(state.weapon.bobPhase) * .018 : Math.sin(now / 680) * .006;
  const rawProgress = active ? clamp(t / definition.duration, 0, 1) : 0;
  const progress = rawProgress < .5
    ? 4 * rawProgress * rawProgress * rawProgress
    : 1 - Math.pow(-2 * rawProgress + 2, 3) / 2;

  // Sword coordinates are camera-local: negative side is screen-left and
  // positive z is up. The authored endpoints make the attack unmistakable:
  // high/right at the start, then low/left at the follow-through.
  const poseAt = (sample) => ({
    angle: active ? lerp(-.92, 1.08, sample) : -.14,
    origin: {
      side: active ? lerp(.54, -.48, sample) : .42,
      forward: active ? lerp(1.28, 1.0, sample) : 1.16,
      z: (active ? lerp(.1, -.34, sample) : -.14) + bob + (active ? Math.sin(sample * Math.PI) * .045 : 0),
    },
  });
  const pose = poseAt(progress);
  const origin = pose.origin;
  const sweepAngle = pose.angle;
  const faces = [];

  addWeaponBox(faces, origin, { side: 0, forward: .03, z: .14 }, [.11, .15, .38], sweepAngle, '#3a241b', .98, 'leather');
  addWeaponBox(faces, origin, { side: 0, forward: .05, z: .35 }, [.34, .16, .075], sweepAngle, '#b8f0e2', 1.02, 'steel');
  addWeaponBox(faces, origin, { side: 0, forward: .03, z: -.08 }, [.16, .16, .1], sweepAngle, '#8d633d', .96, 'steel');
  addSwordBladeCamera(faces, origin, { side: 0, forward: .1, z: .39 }, .17, 1.42, .045, sweepAngle, '#cfe8dc', 1.05);
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
  ctx.arc(tip.x, tip.y, Math.max(4, canvas.height * (.018 + (active ? .012 : 0))), 0, TAU);
  ctx.stroke();

  if (active && !settings.reducedMotion) {
    ctx.globalAlpha = .16 + Math.sin(progress * Math.PI) * .28;
    ctx.lineWidth = Math.max(1, canvas.height * .0042);
    ctx.beginPath();
    const trailStart = Math.max(0, progress - .36);
    for (let sample = trailStart; sample <= progress; sample += .04) {
      const samplePose = poseAt(sample);
      const sampleTip = projectCameraPoint(weaponLocalPoint(samplePose.origin, 0, .1, .39 + 1.42, samplePose.angle));
      if (!sampleTip) continue;
      if (sample === trailStart) ctx.moveTo(sampleTip.x, sampleTip.y);
      else ctx.lineTo(sampleTip.x, sampleTip.y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawCrossbow(now) {
  const { active, t } = weaponMotion();
  const moving = state.weapon.moving;
  const bob = moving ? Math.sin(state.weapon.bobPhase) * .016 : Math.sin(now / 730) * .005;
  const draw = active ? Math.sin(clamp(t / .7, 0, 1) * Math.PI) : 0;
  const recoil = active && t > .5 ? Math.sin(clamp((t - .5) / .18, 0, 1) * Math.PI) * .2 : 0;
  const sideOffset = active ? -draw * .09 : 0;
  const roll = -.13 + draw * .16;
  const faces = [];
  const scale = .68;
  const origin = { side: .39 + sideOffset, forward: 1.44 - recoil, z: -.01 + bob };

  // Long rear stock: the wood continues behind the trigger toward the player.
  addWeaponBox(faces, origin, { side: 0, forward: -.34, z: .3 * scale }, [.24 * scale, 1.18 * scale, .2 * scale], roll, '#704622', .94, 'wood');
  addWeaponBox(faces, origin, { side: 0, forward: -.91, z: .3 * scale }, [.28 * scale, .13 * scale, .25 * scale], roll, '#51331f', .98, 'wood');
  // Raised rail and bolt channel.
  addWeaponBox(faces, origin, { side: 0, forward: .13, z: .46 * scale }, [.15 * scale, .84 * scale, .1 * scale], roll, '#6d7170', 1, 'steel');
  addWeaponBox(faces, origin, { side: 0, forward: .1, z: .52 * scale }, [.035 * scale, .82 * scale, .028 * scale], roll, '#e7d49d', 1, 'steel');
  // Grip and trigger sit under the back half of the stock.
  addWeaponBox(faces, origin, { side: 0, forward: -.1, z: .1 * scale }, [.16 * scale, .2 * scale, .38 * scale], roll, '#3e281b', .96, 'leather');
  addWeaponBox(faces, origin, { side: 0, forward: -.1, z: .27 * scale }, [.12 * scale, .08 * scale, .16 * scale], roll, '#c5ae73', 1, 'steel');
  // Bow limbs sit at the front and read separately from the wooden stock.
  addWeaponBox(faces, origin, { side: 0, forward: .47 * scale, z: .46 * scale }, [.76 * scale, .1 * scale, .12 * scale], roll, '#6d7170', 1, 'steel');
  addWeaponBox(faces, origin, { side: -.38 * scale, forward: .47 * scale, z: .46 * scale }, [.18 * scale, .11 * scale, .27 * scale], roll, '#b9b7a0', .92, 'steel');
  addWeaponBox(faces, origin, { side: .38 * scale, forward: .47 * scale, z: .46 * scale }, [.18 * scale, .11 * scale, .27 * scale], roll, '#b9b7a0', .92, 'steel');
  // Bowstring flexes during the draw/release cycle; it is not an attack beam.
  addWeaponBox(faces, origin, { side: 0, forward: .48 * scale - draw * .08, z: .46 * scale }, [.035 * scale, .035 * scale, .48 * scale], roll, '#e7d49d', 1, 'steel');
  renderFaces(faces, 1, true);
  drawCrossbowArrow();
}

function drawWeapon(now) {
  if (!state.weapon.equipped) return;
  if (state.weapon.type === 'stars') { drawNinjaStars(now); return; }
  if (state.weapon.type === 'crossbow') { drawCrossbow(now); return; }
  if (state.weapon.type === 'wand') { drawWand(now); return; }
  if (state.weapon.type === 'blade') { drawSword(now); return; }
  drawNinjaStars(now);
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
function drawHeldScroll(now) { const width = canvas.width; const height = canvas.height; const reveal = easeOutCubic(state.readingElapsed / .72); const scrollWidth = Math.min(width * .58, 620); const scrollHeight = Math.min(height * .25, 210); const x = width * .5; const y = height * (.98 - reveal * .22) + Math.sin(now / 650) * 2; ctx.save(); ctx.translate(x, y); ctx.globalAlpha = .86; ctx.shadowBlur = 25; ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.fillStyle = '#9d7844'; ctx.beginPath(); roundedRectPath(ctx, -scrollWidth / 2 - 10, -scrollHeight / 2 - 10, scrollWidth + 20, scrollHeight + 20, 20); ctx.fill(); ctx.shadowBlur = 0; const paper = ctx.createLinearGradient(-scrollWidth / 2, 0, scrollWidth / 2, 0); paper.addColorStop(0, '#c5a46d'); paper.addColorStop(.5, '#ecd59e'); paper.addColorStop(1, '#b68d53'); ctx.fillStyle = paper; ctx.fillRect(-scrollWidth / 2, -scrollHeight / 2, scrollWidth, scrollHeight); ctx.fillStyle = 'rgba(77, 43, 18, .3)'; ctx.fillRect(-scrollWidth / 2 + 20, -scrollHeight / 2 + 22, scrollWidth - 40, 2); ctx.fillRect(-scrollWidth / 2 + 20, -scrollHeight / 2 + 38, scrollWidth * .63, 2); ctx.fillStyle = '#59391e'; ctx.font = `bold ${Math.max(12, scrollWidth / 30)}px Georgia`; ctx.textAlign = 'center'; ctx.fillText(state.reading?.title || 'FIELD SCROLL', 0, 5); ctx.fillStyle = '#6f4825'; ctx.fillRect(-scrollWidth / 2 - 17, -scrollHeight / 2 - 14, 18, scrollHeight + 28); ctx.fillRect(scrollWidth / 2 - 1, -scrollHeight / 2 - 14, 18, scrollHeight + 28); ctx.restore(); }
function drawSpellWorldRing(centerWorld, radius, color, alpha, segments = 16, z = .58, phase = 0, lineWidth = 1) {
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
function drawActiveSpellEffects(now) {
  for (const effect of state.activeSpellEffects) {
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
function drawBossTransition(now) {
  const transition = state.transition;
  if (!transition) return;
  const elapsed = transition.elapsed;
  const width = canvas.width;
  const height = canvas.height;
  const opening = clamp(elapsed / 1.05, 0, 1);
  const falling = clamp((elapsed - .75) / 1.75, 0, 1);
  const landing = clamp((elapsed - 2.35) / 1.15, 0, 1);
  const afterImpact = elapsed >= 2.35;
  const message = elapsed < .85
    ? 'THE FLOOR GIVES WAY.'
    : elapsed < 2.35
      ? 'YOU FALL THROUGH THE ARCHIVE.'
      : 'YOU HIT THE STONE HARD.';
  const submessage = elapsed < .85
    ? 'The trap-door opens beneath your feet.'
    : elapsed < 2.35
      ? 'Your shoulder takes the impact on the way down.'
      : 'You are hurt, but the chamber is waiting.';
  ctx.save();
  ctx.fillStyle = `rgba(9, 5, 3, ${afterImpact ? .62 * (1 - landing) : .78 + falling * .18})`;
  ctx.fillRect(0, 0, width, height);

  if (!afterImpact) {
    const centerX = width * .5;
    const horizon = height * (.58 + falling * .12);
    const openingWidth = width * (.08 + opening * .82);
    const openingHeight = height * (.035 + opening * .34);
    ctx.save();
    ctx.translate(centerX, horizon);
    ctx.rotate(Math.sin(now / 410) * .018);
    ctx.fillStyle = 'rgba(2, 1, 1, .96)';
    ctx.strokeStyle = '#5f3a20';
    ctx.lineWidth = Math.max(2, height * .006);
    ctx.beginPath();
    ctx.moveTo(-openingWidth / 2, 0);
    ctx.lineTo(-openingWidth * .38, openingHeight);
    ctx.lineTo(openingWidth * .38, openingHeight);
    ctx.lineTo(openingWidth / 2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Broken timber and stone edges make the opening read as a real floor.
    for (let plank = -3; plank <= 3; plank += 1) {
      const x = plank * openingWidth * .12;
      ctx.fillStyle = plank % 2 ? '#704622' : '#8b5b31';
      ctx.fillRect(x - openingWidth * .055, -height * .018, openingWidth * .1, height * .035);
    }
    ctx.strokeStyle = 'rgba(200, 159, 103, .72)';
    ctx.lineWidth = Math.max(1, height * .003);
    for (let crack = 0; crack < 12; crack += 1) {
      const angle = crack / 12 * TAU + .15;
      const inner = openingWidth * .35;
      const outer = openingWidth * (.5 + (crack % 3) * .1);
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner * .28);
      ctx.lineTo(Math.cos(angle + .08) * outer, Math.sin(angle + .08) * outer * .32);
      ctx.stroke();
    }
    ctx.restore();

    if (falling > 0) {
      ctx.save();
      ctx.globalAlpha = .34 + falling * .4;
      for (let debris = 0; debris < 18; debris += 1) {
        const seed = debris * 13.71;
        const drift = Math.sin(now / 180 + seed) * width * .08;
        const y = height * (.32 + fract(seed * .27 + elapsed * .9) * .55);
        const x = width * (.5 + Math.sin(seed) * .42) + drift * falling;
        const size = 3 + (debris % 4) * 2;
        ctx.fillStyle = debris % 3 ? '#704622' : '#a17b50';
        ctx.save(); ctx.translate(x, y); ctx.rotate(now / (180 + debris * 15)); ctx.fillRect(-size, -size / 2, size * 2.4, size); ctx.restore();
      }
      ctx.restore();
    }
  } else {
    const flash = Math.max(0, 1 - landing * 3.2);
    if (flash > 0) { ctx.fillStyle = `rgba(244, 220, 165, ${flash * .68})`; ctx.fillRect(0, 0, width, height); }
    ctx.fillStyle = `rgba(5, 3, 2, ${.42 + landing * .4})`;
    ctx.fillRect(0, 0, width, height);
    // A brief low, warm impact vignette keeps the landing physical rather than digital.
    const impactGlow = ctx.createRadialGradient(width / 2, height * .62, 0, width / 2, height * .62, Math.max(width, height) * .62);
    impactGlow.addColorStop(0, `rgba(145, 93, 49, ${.2 * (1 - landing)})`);
    impactGlow.addColorStop(1, 'rgba(15, 7, 3, 0)');
    ctx.fillStyle = impactGlow; ctx.fillRect(0, 0, width, height);
  }

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f0ddaf';
  ctx.shadowBlur = 18;
  ctx.shadowColor = '#8e5530';
  ctx.font = `bold ${Math.max(17, height * .041)}px Georgia`;
  ctx.fillText(message, width / 2, height * .42);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = .82;
  ctx.fillStyle = '#d7bd87';
  ctx.font = `${Math.max(10, height * .017)}px Georgia`;
  ctx.fillText(submessage, width / 2, height * .51);
  if (afterImpact) {
    ctx.globalAlpha = .62;
    ctx.fillStyle = '#b98542';
    ctx.font = `${Math.max(9, height * .014)}px "DM Mono", monospace`;
    ctx.fillText('LEVEL 08 · THE OPERATIONS ARCHON', width / 2, height * .61);
  }
  ctx.restore();
  ctx.restore();
}

function drawEffects() { if (state.damageFlash > 0) { ctx.fillStyle = `rgba(156, 43, 32, ${state.damageFlash * .2})`; ctx.fillRect(0, 0, canvas.width, canvas.height); } }

function drawDodgeOverlay(now) {
  if (settings.reducedMotion) return;
  const active = state.dodgeTime > 0;
  const landing = state.dodgeImpact > 0;
  if (!active && !landing) return;
  const width = canvas.width;
  const height = canvas.height;
  const direction = state.dodgeDirection || { x: 1, y: 0 };
  const lateral = direction.x * -Math.sin(state.player.angle) + direction.y * Math.cos(state.player.angle);
  const progress = active ? clamp(state.dodgeProgress, 0, 1) : 1;
  const speed = active ? Math.sin(Math.PI * progress) : state.dodgeImpact * 3.5;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = .035 + speed * .09;
  const wash = ctx.createLinearGradient(width * .5 - lateral * width * .42, 0, width * .5 + lateral * width * .42, height);
  wash.addColorStop(0, 'rgba(108, 224, 194, 0)');
  wash.addColorStop(.46, 'rgba(108, 224, 194, .16)');
  wash.addColorStop(1, 'rgba(231, 173, 103, 0)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = .12 + speed * .2;
  ctx.strokeStyle = 'rgba(215, 240, 208, .64)';
  ctx.lineWidth = Math.max(1, height * .0025);
  const centerX = width * .5 - lateral * width * .06;
  const centerY = height * (.5 + speed * .06);
  for (let index = 0; index < 7; index += 1) {
    const spread = (index - 3) * height * .035;
    const x0 = centerX + spread * lateral - lateral * width * (.08 + speed * .1);
    const y0 = centerY + spread * .45;
    const x1 = centerX + spread * lateral + lateral * width * (.18 + speed * .22);
    const y1 = centerY + spread * .72;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  }
  if (landing) {
    ctx.globalAlpha = state.dodgeImpact * 1.8;
    ctx.fillStyle = 'rgba(255, 242, 194, .08)';
    ctx.fillRect(0, 0, width, height);
  }
  ctx.restore();
}

function drawScene(now) {
  const width = canvas.width;
  const height = canvas.height;
  const worldNow = state.reading ? state.readingWorldTime : now;
  ctx.save();
  if (state.shakeTime > 0) ctx.translate(Math.sin(worldNow * .09) * state.shakeTime * (settings.reducedMotion ? 2 : 7), Math.cos(worldNow * .11) * state.shakeTime * (settings.reducedMotion ? 1.5 : 5));
  if (state.dodgeTime > 0 && !settings.reducedMotion) {
    const progress = clamp(state.dodgeProgress, 0, 1);
    const travel = Math.sin(Math.PI * Math.pow(progress, .86));
    const lateral = state.dodgeRoll || .34;
    const roll = lateral * (.035 + travel * .105) + Math.sin(progress * Math.PI * 2) * .012;
    const swayX = lateral * width * .018 * travel;
    const dip = travel * .21;
    ctx.translate(width / 2 + swayX, height / 2 - dip * height);
    ctx.rotate(roll);
    ctx.translate(-width / 2, -height / 2);
  } else if (state.dodgeImpact > 0 && !settings.reducedMotion) {
    const impact = state.dodgeImpact;
    ctx.translate(width / 2, height / 2 - impact * height * .16);
    ctx.rotate(Math.sin(worldNow * .09) * impact * .05);
    ctx.translate(-width / 2, -height / 2);
  }
  try {
    drawBackground(width, height);
    drawRoomRoof(width, height);
    drawWalls(width, height);
  drawFloor(width, height);
  drawWorldRoute(worldNow);
  drawWorldObjects(worldNow);
  drawForestHallFog(worldNow);
  drawGroundHazards(worldNow);
  drawEnemyTelegraphs(worldNow);
  drawBossTelegraph(worldNow);
  drawWorldProjectiles(worldNow);
  drawImpactBursts(worldNow);
  drawActiveSpellEffects(worldNow);
  drawParticles();
  drawDamageNumbers();
  if (state.reading) drawHeldScroll(now);
  else { drawWeapon(now); drawPassiveSpellFocus(now); drawSpellCast(now); drawSpellSwitchControls(now); }
  drawEffects();
  drawLaunchTransition(now);
  drawForestTransition(now);
  drawBossTransition(now);
    if (state.endingFade >= 0) { ctx.fillStyle = `rgba(255, 250, 225, ${clamp(state.endingFade, 0, 1)})`; ctx.fillRect(0, 0, width, height); }
  } finally {
    ctx.restore();
  }
  drawDodgeOverlay(now);
}

function spendStamina(amount) {
  if (amount <= 0) return true;
  if (state.stamina + .001 < amount) return false;
  state.stamina = clamp(state.stamina - amount, 0, state.maxStamina);
  state.staminaRegenDelay = Math.max(state.staminaRegenDelay, .72);
  return true;
}

function tryDodge() {
  if (state.menuActive || state.reading || state.deathScreen || state.launchTransition || state.transition || state.gameComplete) return false;
  if (state.dodgeTime > 0 || state.dodgeCooldown > 0) return false;
  if (!spendStamina(DODGE_COST)) {
    showHitMarker('NO STAMINA', 'miss');
    showToast('Not enough stamina to dodge.');
    return false;
  }
  let x = 0;
  let y = 0;
  const angle = state.player.angle;
  if (state.keys.has('w')) { x += Math.cos(angle); y += Math.sin(angle); }
  if (state.keys.has('s')) { x -= Math.cos(angle); y -= Math.sin(angle); }
  if (state.keys.has('a')) { x += Math.cos(angle - Math.PI / 2); y += Math.sin(angle - Math.PI / 2); }
  if (state.keys.has('d')) { x += Math.cos(angle + Math.PI / 2); y += Math.sin(angle + Math.PI / 2); }
  const length = Math.hypot(x, y) || 1;
  if (!x && !y) { x = Math.cos(angle); y = Math.sin(angle); }
  else { x /= length; y /= length; }
  state.dodgeTime = DODGE_DURATION;
  state.dodgeCooldown = .92;
  state.dodgeInvulnerable = DODGE_DURATION;
  state.dodgeVx = x * DODGE_SPEED;
  state.dodgeVy = y * DODGE_SPEED;
  state.dodgeDirection = { x, y };
  const lateralDirection = x * -Math.sin(angle) + y * Math.cos(angle);
  // A forward roll still gets a readable shoulder lean, while a strafe roll
  // tilts toward the direction of travel instead of always rotating right.
  state.dodgeRoll = Math.abs(lateralDirection) > .08 ? Math.sign(lateralDirection) : .34;
  state.dodgeProgress = 0;
  state.dodgeImpact = 0;
  state.dodgeTrailTimer = 0;
  state.dodgeCameraDrop = 0;
  state.weapon.swing = 0;
  state.weapon.hit = false;
  state.weapon.cooldown = Math.max(state.weapon.cooldown, .08);
  state.impactBursts.push({ x: state.player.x, y: state.player.y, z: .08, elapsed: 0, duration: .3, color: '#6ce0c2', radius: .38, style: 'dodge' });
  spawnParticles(state.player.x, state.player.y, .06, ['#6ce0c2', '#d8c18b'], settings.reducedMotion ? 4 : 11, { speed: 1.25, life: .42, size: .52, upward: .06, spread: 1.8, gravity: .3, drag: .86, glow: 8, shape: 'dot', trail: true });
  playTone(188, .08, 'triangle', .018);
  return true;
}

function updateCombatState(delta) {
  state.dodgeCooldown = Math.max(0, state.dodgeCooldown - delta);
  state.dodgeInvulnerable = Math.max(0, state.dodgeInvulnerable - delta);
  state.comboTimer = Math.max(0, state.comboTimer - delta);
  if (state.comboTimer <= 0) state.combo = 0;
  const wasDodging = state.dodgeTime > 0;
  if (state.dodgeTime > 0) {
    state.dodgeTime = Math.max(0, state.dodgeTime - delta);
    state.dodgeProgress = clamp(1 - state.dodgeTime / DODGE_DURATION, 0, 1);
  } else if (wasDodging) {
    state.dodgeProgress = 1;
    state.dodgeImpact = settings.reducedMotion ? .08 : .22;
    state.impactBursts.push({ x: state.player.x, y: state.player.y, z: .06, elapsed: 0, duration: .34, color: '#d8c18b', radius: .46, style: 'dodge-land' });
    playTone(62, .12, 'triangle', .014);
  }
  state.dodgeImpact = Math.max(0, state.dodgeImpact - delta * 1.9);
  if (state.staminaRegenDelay > 0) state.staminaRegenDelay = Math.max(0, state.staminaRegenDelay - delta);
  else if (state.dodgeTime <= 0) state.stamina = clamp(state.stamina + 31 * delta, 0, state.maxStamina);
}

function movePlayerBy(dx, dy) {
  if (canStand(state.player.x + dx, state.player.y)) state.player.x += dx;
  if (canStand(state.player.x, state.player.y + dy)) state.player.y += dy;
}

function updatePlayer(delta) {
  if (state.gameComplete) return;
  updateCombatState(delta);
  if (state.keys.has('arrowleft')) state.player.angle -= TURN_SPEED * delta;
  if (state.keys.has('arrowright')) state.player.angle += TURN_SPEED * delta;
  if (state.keys.has('arrowup')) state.player.pitch = clamp(state.player.pitch + PITCH_SPEED * delta, -.48, .48);
  if (state.keys.has('arrowdown')) state.player.pitch = clamp(state.player.pitch - PITCH_SPEED * delta, -.48, .48);

  if (state.dodgeTime > 0) {
    movePlayerBy(state.dodgeVx * delta, state.dodgeVy * delta);
    const damping = Math.pow(.045, delta / DODGE_DURATION);
    state.dodgeVx *= damping;
    state.dodgeVy *= damping;
    state.player.angle = normalizeAngle(state.player.angle);
    const dodgeProgress = clamp(state.dodgeProgress, 0, 1);
    const travel = Math.sin(Math.PI * Math.pow(dodgeProgress, .86));
    state.dodgeCameraDrop = travel * .21;
    state.weapon.moving = true;
    state.weapon.bobPhase += delta * 18;
    state.dodgeTrailTimer -= delta;
    if (state.dodgeTrailTimer <= 0) {
      state.dodgeTrailTimer = settings.reducedMotion ? .09 : .045;
      spawnParticles(state.player.x, state.player.y, .055, ['#6ce0c2', '#d8c18b'], settings.reducedMotion ? 1 : 3, { speed: .7, life: .3, size: .42, upward: .03, spread: 1.2, gravity: .2, drag: .9, glow: 6, shape: 'dot', trail: true });
    }
    updateRoomFromPlayer();
    return;
  }

  const sprintRequested = state.keys.has('shift');
  const sprint = sprintRequested && state.stamina > 1;
  const speed = MOVE_SPEED * (sprint ? 1.55 : 1) * delta;
  const angle = state.player.angle;
  let dx = 0;
  let dy = 0;
  if (state.keys.has('w')) { dx += Math.cos(angle) * speed; dy += Math.sin(angle) * speed; }
  if (state.keys.has('s')) { dx -= Math.cos(angle) * speed; dy -= Math.sin(angle) * speed; }
  if (state.keys.has('a')) { dx += Math.cos(angle - Math.PI / 2) * speed; dy += Math.sin(angle - Math.PI / 2) * speed; }
  if (state.keys.has('d')) { dx += Math.cos(angle + Math.PI / 2) * speed; dy += Math.sin(angle + Math.PI / 2) * speed; }
  if (sprint && (dx !== 0 || dy !== 0)) {
    state.stamina = clamp(state.stamina - 22 * delta, 0, state.maxStamina);
    state.staminaRegenDelay = Math.max(state.staminaRegenDelay, .42);
  }
  movePlayerBy(dx, dy);
  state.player.angle = normalizeAngle(state.player.angle);
  state.weapon.moving = Math.abs(dx) + Math.abs(dy) > .001;
  state.weapon.bobPhase += delta * (state.weapon.moving ? (sprint ? 13 : 8) : 2);
  state.footstepTimer -= delta;
  if (state.weapon.moving && state.footstepTimer <= 0) {
    state.footstepTimer = sprint ? .15 : .25;
  } else if (!state.weapon.moving) {
    state.footstepTimer = 0;
  }
  updateRoomFromPlayer();
}

function damagePlayer(source, options = {}) {
  const baseDamage = Math.max(0, Number(options.damage ?? source?.damage ?? 0));
  const attackerName = source?.name || (options.projectile?.source === 'boss' ? 'The Archon' : 'Hostile signal');
  if (state.dodgeInvulnerable > 0 || state.dodgeTime > 0) {
    showHitMarker('DODGE', 'shielded');
    return { dodged: true };
  }

  let amount = baseDamage;
  if (state.wardTimer > 0) amount *= .22;
  if (amount <= 0) return { blocked: true };

  state.player.hp -= amount;
  state.damageFlash = .95;
  state.shakeTime = settings.reducedMotion ? .13 : .45;
  state.impactBursts.push({ x: state.player.x, y: state.player.y, z: EYE_HEIGHT, elapsed: 0, duration: .42, color: '#d16f63', radius: .72, style: 'damage' });
  showHitMarker('DAMAGED', 'danger');
  playHitSound();
  showToast(`${attackerName} struck you.`, 'danger');
  if (state.player.hp <= 0) {
    openDeathScreen(`${attackerName} brought you down.`);
  }
  updateHud();
  return { damaged: true };
}
function damageHostile(target, amount, options = {}) {
  if (!target || target.dead) return false;
  const baseAmount = Math.max(0, Number(amount || 0));
  const critChance = clamp(Number(options.critChance || 0), 0, .85);
  const critical = !target.boss && Math.random() < critChance;
  const multiplier = critical ? Number(options.critMultiplier || 1.7) : 1;
  const finalAmount = Math.max(1, Math.round(baseAmount * multiplier));
  if (target.boss && target.shield > 0) {
    const shieldDamage = Math.max(1, Math.round(finalAmount * .8));
    target.shield = Math.max(0, target.shield - shieldDamage);
    target.hitTime = .28;
    target.hitFlash = .34;
    state.impactBursts.push({ x: target.x, y: target.y, z: 1.4, elapsed: 0, duration: .52, color: '#c7f4e7', radius: 1.45 + (critical ? .2 : 0), style: 'shield' });
    spawnDamageNumber(target.x, target.y, hostileAimHeight(target) + .2, `-${shieldDamage}`, '#b8f0e2', { shield: true });
    if (state.now - shieldFeedbackAt > 360) { showHitMarker('SHIELDED', 'shielded'); shieldFeedbackAt = state.now; }
    if (target.shield <= 0) {
      showHitMarker('SHIELD BREAK', 'hit');
      showToast('The Archon shield shatters.', 'good');
      state.shakeTime = settings.reducedMotion ? .16 : .5;
      spawnParticles(target.x, target.y, 1.3, ['#c7f4e7', '#fff1b0'], settings.reducedMotion ? 8 : 22, { speed: 1.8, life: .65, size: .7, upward: .55, spread: TAU, glow: 17, shape: 'rune' });
    }
    return false;
  }
  target.hp -= finalAmount;
  target.hitTime = critical ? .42 : .28;
  target.hitFlash = critical ? .48 : .3;
  target.alerted = true;
  const stagger = Number(options.stagger ?? options.stun ?? (options.source === 'spell' ? .18 : .14));
  if (stagger > 0) target.staggerTimer = Math.max(target.staggerTimer || 0, target.boss ? stagger * .35 : stagger);
  if (options.stun) target.stunTimer = Math.max(target.stunTimer || 0, options.stun);
  const direction = options.knockbackDirection || { x: target.x - state.player.x, y: target.y - state.player.y };
  const directionLength = Math.hypot(direction.x, direction.y) || 1;
  const knockback = target.boss ? 0 : Number(options.knockback || 0) * (critical ? 1.25 : 1);
  if (knockback > 0) {
    target.knockbackX = (target.knockbackX || 0) + direction.x / directionLength * knockback * 5.2;
    target.knockbackY = (target.knockbackY || 0) + direction.y / directionLength * knockback * 5.2;
  }
  const label = options.label || (options.source === 'spell' ? 'SPELL HIT' : 'HIT');
  spawnDamageNumber(target.x, target.y, hostileAimHeight(target) + .18, `-${finalAmount}`, critical ? '#fff1b0' : (target.boss ? '#f0ddaf' : '#f0ddaf'), { critical });
  const hitColor = options.color || (target.boss ? '#c7f4e7' : (target.color || '#d8c18b'));
  state.impactBursts.push({ x: target.x, y: target.y, z: hostileAimHeight(target), elapsed: 0, duration: critical ? .62 : .42, color: hitColor, radius: (target.boss ? 1.05 : .56) + (critical ? .28 : 0), style: critical ? 'critical' : (options.source === 'spell' ? 'spell-hit' : 'hit') });
  if (stagger > 0) state.impactBursts.push({ x: target.x, y: target.y, z: hostileAimHeight(target) + .12, elapsed: 0, duration: .3, color: critical ? '#fff1b0' : hitColor, radius: .32, style: 'stagger' });
  state.shakeTime = Math.max(state.shakeTime, settings.reducedMotion ? (critical ? .1 : .05) : (critical ? .32 : .12));
  playBoneHitSound();
  if (critical) {
    showHitMarker(`CRITICAL · ${finalAmount}`, 'crit');
    spawnParticles(target.x, target.y, hostileAimHeight(target), ['#fff1b0', hitColor], settings.reducedMotion ? 4 : 10, { speed: 1.2, life: .46, size: .5, upward: .2, spread: TAU, glow: 18, shape: 'star' });
  } else {
    showHitMarker(target.boss ? 'ARCHON HIT' : label, target.boss ? 'crit' : 'hit');
  }
  if (target.hp <= 0) defeatHostile(target);
  return true;
}
function collectHealthPotion(item) {
  if (!item || item.recovered || item.kind !== 'health-potion') return false;
  const previousHp = state.player.hp;
  state.player.hp = clamp(state.player.hp + (item.healAmount || 30), 0, 100);
  item.recovered = true;
  state.recoveredItems.add(item.id);
  const recoveredAmount = Math.ceil(state.player.hp - previousHp);
  spawnParticles(item.x, item.y, .42, ['#d16f63', '#f0ddaf', '#fff1b0'], settings.reducedMotion ? 6 : 16, { speed: 1.1, life: .75, size: .72, upward: .7, spread: TAU, glow: 14 });
  state.impactBursts.push({ x: item.x, y: item.y, z: .42, elapsed: 0, duration: .45, color: '#d16f63', radius: .62, style: 'potion' });
  playRecoverySound();
  showToast(recoveredAmount > 0 ? `Health potion used · +${recoveredAmount} vitality.` : 'Health potion collected · vitality already full.', 'good');
  updateHud();
  return true;
}
function collectTouchItems() {
  const activeRoom = currentRoomIndex();
  for (const item of worldItems) {
    if (item.recovered || item.kind !== 'health-potion' || item.roomIndex !== activeRoom) continue;
    if (Math.hypot(item.x - state.player.x, item.y - state.player.y) <= .72) collectHealthPotion(item);
  }
}
function monsterShouldDropHealthPotion(target) {
  if (target?.boss) return true;
  const favoredKinds = new Set(['warden', 'beast', 'quake']);
  if (favoredKinds.has(target?.kind)) return true;
  const signature = String(target?.id || '').split('').reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return signature % 5 === 0;
}
function deterministicDropAngle(target) {
  const signature = String(target?.id || '').split('').reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return (signature % 360) * Math.PI / 180;
}

function spawnHealthPotion(x, y, roomIndex, sourceName) {
  const id = `potion-${targetPotionSequence++}`;
  worldItems.push({
    id,
    title: 'HEALTH POTION',
    kind: 'health-potion',
    icon: '+',
    tag: 'RECOVERY / VITALITY',
    summary: 'Restores 30 vitality.',
    details: [`Dropped by ${sourceName}.`, 'Drink it from the ground to return to the fight.'],
    color: '#d16f63',
    healAmount: 30,
    x,
    y,
    roomIndex,
    recovered: false,
    dropFromEnemy: true,
    dropSource: sourceName,
    spawnedAt: state.now || performance.now(),
    bobPhase: Math.random() * TAU,
  });
  spawnScrollDropEffect(x, y, '#d16f63');
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
  const respawn = roomContentPoint(roomIndex, room.spawn.x, room.spawn.y);
  state.player.x = roomOffsets[roomIndex] + respawn.x;
  state.player.y = respawn.y;
  state.player.angle = room.spawn.angle;
  state.player.pitch = 0;
  state.player.hp = 100;
  state.stamina = state.maxStamina;
  state.staminaRegenDelay = 0;
  state.groundHazards = [];
  state.projectiles = [];
  state.activeSpellEffects = [];
  state.spellCast = null;
  state.spellCooldown = 0;
  state.combo = 0;
  state.comboTimer = 0;
  state.dodgeTime = 0;
  state.dodgeCooldown = 0;
  state.dodgeInvulnerable = 0;
  state.dodgeProgress = 0;
  state.dodgeImpact = 0;
  state.damageFlash = 0;
  state.shakeTime = 0;
  state.weapon.swing = 0;
  state.weapon.cooldown = 0;
  state.weapon.hit = false;
  state.weapon.attackDamage = 0;
  state.weapon.comboStep = 0;

  for (let index = worldItems.length - 1; index >= 0; index -= 1) {
    const item = worldItems[index];
    if (item.roomIndex === roomIndex && item.dropFromEnemy) {
      if (item.kind === 'scroll' || item.kind === 'ledger' || item.kind === 'chronicle' || item.kind === 'map') droppedRecordIds.delete(item.id.replace(/^drop-/, ''));
      state.recoveredItems.delete(item.id);
      worldItems.splice(index, 1);
    }
  }
  for (const template of recordDropTemplates) if (template.roomIndex === roomIndex) droppedRecordIds.delete(template.id);
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
  if (deathOverlay) { deathOverlay.classList.remove('is-visible'); deathOverlay.hidden = true; }
  state.promptSignature = '';
  state.hudSignature = '';
  updateHud();
  showToast(`LEVEL RESTORED · ${room.title}`, 'good');
  playRecoverySound();
}
let targetPotionSequence = 0;

function defeatHostile(target) {
  if (target.dead) return;
  target.dead = true;
  target.deathTime = 0;
  state.groundHazards = state.groundHazards.filter((hazard) => hazard.ownerId !== target.id);
  state.impactBursts.push({ x: target.x, y: target.y, z: hostileAimHeight(target), elapsed: 0, duration: target.boss ? 1.2 : .56, color: target.boss ? '#fff4c5' : (target.color || '#d8c18b'), radius: target.boss ? 2.1 : .82, style: 'defeat' });
  const dropAngle = deterministicDropAngle(target);
  const scrollDropPoint = findWalkableSpawnPoint(target.x, target.y, target.roomIndex);
  const potionDropPoint = findWalkableSpawnPoint(
    target.x + Math.cos(dropAngle) * .92,
    target.y + Math.sin(dropAngle) * .92,
    target.roomIndex,
    [scrollDropPoint],
  );
  if (target.boss) {
    state.doorOfLight = { ...BOSS_EXIT_POINT, active: true, pulse: 0 };
    state.finalBoss.shield = 0;
    state.finalBoss.phase = 3;
    state.activeSpellEffects.push({ kind: 'boss-death', elapsed: 0, duration: 2.2, color: '#fff4c5' });
    if (monsterShouldDropHealthPotion(target)) spawnHealthPotion(potionDropPoint.x, potionDropPoint.y, target.roomIndex, target.displayName || target.name);
    earnExperience(250, 'the Archon');
    showToast('THE OPERATIONS ARCHON FALLS. THE DOOR OF LIGHT OPENS.', 'good');
    playTone(55, .6, 'square', .045); playTone(330, .8, 'triangle', .035, .18);
  } else {
    const reward = target.kind === 'warden' ? 24 : target.kind === 'beast' ? 18 : 12;
    earnExperience(reward, target.displayName || target.name);
    if (monsterShouldDropHealthPotion(target)) spawnHealthPotion(potionDropPoint.x, potionDropPoint.y, target.roomIndex, target.displayName || target.name);
    const templates = target.dropTemplates || [];
    templates.forEach((template) => {
      if (droppedRecordIds.has(template.id)) return;
      droppedRecordIds.add(template.id);
      worldItems.push({
        ...template,
        id: `drop-${template.id}`,
        recordId: template.id,
        kind: 'scroll',
        x: scrollDropPoint.x,
        y: scrollDropPoint.y,
        roomIndex: target.roomIndex,
        recovered: false,
        dropFromEnemy: true,
        spawnedAt: state.now || performance.now(),
        bobPhase: Math.random() * TAU,
      });
      spawnScrollDropEffect(scrollDropPoint.x, scrollDropPoint.y, template.color || rooms[target.roomIndex].color);
    });
    showToast(templates.length ? `${target.displayName || target.name} dropped field records.` : `${target.displayName || target.name} defeated.`, 'good');
  }
  updateHud();
}

function enemyAttackStyle(enemy) {
  return enemy.attackStyle || enemyProfile(enemy).attackStyle || 'melee';
}

function moveEnemy(enemy, dx, dy, amount) {
  const distance = Math.hypot(dx, dy) || 1;
  const stepX = dx / distance * amount;
  const stepY = dy / distance * amount;
  if (canStand(enemy.x + stepX, enemy.y)) enemy.x += stepX;
  if (canStand(enemy.x, enemy.y + stepY)) enemy.y += stepY;
}

function fireEnemyRangedAttack(enemy) {
  const profile = enemyProfile(enemy);
  const dx = state.player.x - enemy.x;
  const dy = state.player.y - enemy.y;
  const distance = Math.hypot(dx, dy) || 1;
  const direction = { x: dx / distance, y: dy / distance };
  const origin = { x: enemy.x + direction.x * .42, y: enemy.y + direction.y * .42, z: profile.aimHeight };
  makeProjectile('enemy-bolt', origin, { x: direction.x * 4.35, y: direction.y * 4.35, z: (EYE_HEIGHT - profile.aimHeight) * .22 }, {
    color: enemy.attackColor || profile.attackColor || enemy.color || '#78d9e8',
    damage: enemy.damage,
    radius: .14,
    lifetime: 4.2,
    collisionHeight: .9,
    source: 'enemy',
    sourceId: enemy.id,
  });
  state.impactBursts.push({ x: enemy.x, y: enemy.y, z: profile.aimHeight, elapsed: 0, duration: .28, color: enemy.attackColor || profile.attackColor || '#78d9e8', radius: .32, style: 'cast' });
  playTone(176, .1, 'triangle', .014);
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
  state.impactBursts.push({ x: hazard.x, y: hazard.y, z: .035, elapsed: 0, duration: hazard.warningDuration, color: hazard.color, radius: radius * .42, style: 'warning' });
}

function updateGroundHazards(delta) {
  const active = [];
  for (const hazard of state.groundHazards) {
    hazard.elapsed += delta;
    if (!hazard.active && hazard.elapsed >= hazard.warningDuration) {
      hazard.active = true;
      state.impactBursts.push({ x: hazard.x, y: hazard.y, z: .045, elapsed: 0, duration: .38, color: hazard.color, radius: hazard.radius, style: 'ground-impact' });
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

function drawProjectedWorldRing(center, radius, color, alpha, segments = 20, z = .04, lineWidth = 1, dashed = false) {
  const points = [];
  for (let index = 0; index <= segments; index += 1) {
    const angle = index / segments * TAU;
    const point = projectCameraPoint(cameraPoint(center.x + Math.cos(angle) * radius, center.y + Math.sin(angle) * radius, z));
    if (point) points.push(point);
  }
  if (points.length < 2) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.shadowBlur = 12;
  ctx.shadowColor = color;
  ctx.lineWidth = lineWidth;
  if (dashed) ctx.setLineDash([8, 6]);
  ctx.beginPath();
  points.forEach((point, index) => { if (index === 0) ctx.moveTo(point.x, point.y); else ctx.lineTo(point.x, point.y); });
  ctx.stroke();
  ctx.restore();
}

function drawGroundHazards(now) {
  for (const hazard of state.groundHazards) {
    const center = projectCameraPoint(cameraPoint(hazard.x, hazard.y, .05));
    if (!center) continue;
    const warning = !hazard.active;
    const pulse = .86 + Math.sin(now / 100 + hazard.x) * .12;
    drawProjectedWorldRing({ x: hazard.x, y: hazard.y }, hazard.radius, hazard.color, warning ? .72 * pulse : .9, 24, .035, Math.max(1, canvas.height * .004), warning);
    drawProjectedWorldRing({ x: hazard.x, y: hazard.y }, hazard.radius * (warning ? .72 : .9), '#f5d59b', warning ? .4 : .74, 8, .048, Math.max(1, canvas.height * .002));
    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate(now / (warning ? 520 : 210));
    ctx.globalAlpha = warning ? .72 : .9;
    ctx.strokeStyle = hazard.color;
    ctx.fillStyle = warning ? 'rgba(215, 118, 73, .08)' : 'rgba(215, 118, 73, .18)';
    ctx.lineWidth = Math.max(1, canvas.height * .003);
    ctx.beginPath();
    ctx.moveTo(0, -Math.max(7, canvas.height * .018));
    ctx.lineTo(Math.max(6, canvas.height * .015), Math.max(5, canvas.height * .012));
    ctx.lineTo(-Math.max(6, canvas.height * .015), Math.max(5, canvas.height * .012));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (!warning) {
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(3, canvas.height * .009), 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawEnemyTelegraphs(now) {
  for (const enemy of worldEnemies) {
    if (enemy.roomIndex === 0 || enemy.dead || enemy.roomIndex !== state.room || !enemy.telegraph || enemy.telegraph.type !== 'ranged') continue;
    const target = enemy.telegraph;
    const start = projectCameraPoint(cameraPoint(enemy.x, enemy.y, hostileAimHeight(enemy)));
    const end = projectCameraPoint(cameraPoint(target.targetX, target.targetY, target.targetZ || .58));
    if (!start || !end) continue;
    const pulse = .72 + Math.sin(now / 75) * .18;
    ctx.save();
    ctx.globalAlpha = .65 * pulse;
    ctx.strokeStyle = enemy.attackColor || enemy.color || '#78d9e8';
    ctx.shadowBlur = 12;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.lineWidth = Math.max(1, canvas.height * .0025);
    ctx.setLineDash([10, 7]);
    ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.translate(end.x, end.y);
    ctx.rotate(now / 300);
    const size = Math.max(7, canvas.height * .018);
    ctx.beginPath(); ctx.moveTo(0, -size); ctx.lineTo(size, 0); ctx.lineTo(0, size); ctx.lineTo(-size, 0); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, size * .42, 0, TAU); ctx.stroke();
    ctx.restore();
  }
}

function updateEnemies(delta) {
  if (state.reading || state.menuActive || state.gameComplete) return;
  for (const enemy of worldEnemies) {
    const profile = enemyProfile(enemy);
    const style = enemyAttackStyle(enemy);
    enemy.attackStyle = style;
    if (enemy.roomIndex === 0) { enemy.dead = true; enemy.deathTime = .75; continue; }
    if (enemy.dead) { enemy.deathTime += delta; continue; }
    if (enemy.roomIndex !== state.room && !enemy.boss) continue;
    enemy.cooldown = Math.max(0, enemy.cooldown - delta);
    enemy.hitTime = Math.max(0, enemy.hitTime - delta);
    enemy.hitFlash = Math.max(0, (enemy.hitFlash || 0) - delta);
    enemy.staggerTimer = Math.max(0, (enemy.staggerTimer || 0) - delta);
    enemy.stunTimer = Math.max(0, (enemy.stunTimer || 0) - delta);
    const recoilX = enemy.knockbackX || 0;
    const recoilY = enemy.knockbackY || 0;
    if (Math.abs(recoilX) + Math.abs(recoilY) > .01) {
      if (canStand(enemy.x + recoilX * delta, enemy.y)) enemy.x += recoilX * delta;
      if (canStand(enemy.x, enemy.y + recoilY * delta)) enemy.y += recoilY * delta;
      enemy.knockbackX = recoilX * Math.pow(.035, delta);
      enemy.knockbackY = recoilY * Math.pow(.035, delta);
    }
    if (enemy.stunTimer > 0 || enemy.staggerTimer > 0) continue;

    if (enemy.telegraph?.type === 'ranged') {
      enemy.telegraph.elapsed += delta;
      if (enemy.telegraph.elapsed >= enemy.telegraph.duration) {
        fireEnemyRangedAttack(enemy);
        enemy.telegraph = null;
        enemy.cooldown = 1.65 / (profile.attackRate || 1);
      }
      continue;
    }
    if (enemy.telegraph?.type === 'ground') continue;

    if (enemy.attackTime > 0) {
      const previous = enemy.attackTime;
      enemy.attackTime = Math.max(0, enemy.attackTime - delta);
      if (!enemy.attackHit && previous > .25 && enemy.attackTime <= .25) {
        enemy.attackHit = true;
        if (Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y) < profile.attackDistance + .08) damagePlayer(enemy, { damage: enemy.damage });
      }
      continue;
    }

    const dx = state.player.x - enemy.x;
    const dy = state.player.y - enemy.y;
    const distance = Math.hypot(dx, dy);
    const visible = distance < (style === 'ranged' ? 13 : 8.5) && hasLineOfSight(enemy.x, enemy.y, state.player.x, state.player.y);
    if (visible) enemy.alerted = true;
    if (!enemy.alerted) continue;
    enemy.walkPhase += delta * (distance < 2 ? 9 : 5) * profile.speedMultiplier;

    const slow = state.enemySlowTimer > 0 ? .38 : 1;
    const preferred = profile.preferredDistance || (style === 'ranged' ? 6.4 : style === 'ground' ? 3 : 0);
    if (style === 'ranged') {
      if (distance > preferred + .75) moveEnemy(enemy, dx, dy, enemy.speed * profile.speedMultiplier * slow * delta);
      else if (distance < preferred - .85) moveEnemy(enemy, -dx, -dy, enemy.speed * profile.speedMultiplier * slow * delta);
      else {
        const strafe = Math.sin(enemy.walkPhase * .7) >= 0 ? 1 : -1;
        moveEnemy(enemy, -dy * strafe, dx * strafe, enemy.speed * .44 * slow * delta);
      }
      if (visible && distance <= profile.attackDistance && enemy.cooldown <= 0) {
        enemy.telegraph = { type: 'ranged', elapsed: 0, duration: enemy.kind === 'moth' ? .56 : .74, targetX: state.player.x, targetY: state.player.y, targetZ: EYE_HEIGHT };
      }
    } else if (style === 'ground') {
      if (distance > preferred + .5) moveEnemy(enemy, dx, dy, enemy.speed * profile.speedMultiplier * slow * delta);
      else if (distance < preferred - .6) moveEnemy(enemy, -dx, -dy, enemy.speed * profile.speedMultiplier * slow * delta);
      if (visible && distance <= profile.attackDistance && enemy.cooldown <= 0) {
        createGroundHazard(enemy);
        enemy.cooldown = 1.8 / (profile.attackRate || 1);
      }
    } else {
      if (distance > profile.attackDistance - .1) moveEnemy(enemy, dx, dy, enemy.speed * profile.speedMultiplier * slow * delta);
      if (visible && distance <= profile.attackDistance && enemy.cooldown <= 0) {
        enemy.attackTime = .55;
        enemy.attackHit = false;
        enemy.cooldown = 1.25 / (profile.attackRate || 1);
      }
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
    state.impactBursts.push({ x: boss.x, y: boss.y, z: 1, elapsed: 0, duration: .8, color: '#e9e9e0', radius: 1.2 });
  } else if (pattern === 3) {
    boss.shield = Math.max(boss.shield, boss.phase === 3 ? 52 : 38);
    state.activeSpellEffects.push({ kind: 'boss-shield', elapsed: 0, duration: 1.1, color: '#9debdc' });
    showToast('THE ARCHON RAISES A LATTICE SHIELD.', 'danger');
  } else {
    spawnBossPattern('boss-bolt', boss, 8, 3.8, '#c58de6', 14, { spread: .42, z: 1.75, lifetime: 3.5, targetX, targetY });
  }
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
  const nextPhase = bossPhaseForHp(boss);
  if (nextPhase !== boss.phase) {
    boss.phase = nextPhase;
    boss.attackTelegraph = null;
    boss.shield = nextPhase === 2 ? 58 : nextPhase === 3 ? 76 : 0;
    boss.cooldown = 1.1;
    state.shakeTime = settings.reducedMotion ? .2 : .8;
    state.impactBursts.push({ x: boss.x, y: boss.y, z: 1.3, elapsed: 0, duration: 1.4, color: BOSS_PHASES[nextPhase - 1].color, radius: 2.4 });
    spawnParticles(boss.x, boss.y, 1.25, [BOSS_PHASES[nextPhase - 1].color, '#fff1b0'], settings.reducedMotion ? 14 : 42, { speed: 2.4, life: 1.05, size: 1.05, upward: .9, glow: 18, trail: true });
    showToast(`${BOSS_PHASES[nextPhase - 1].name} — THE ARCHON RECONFIGURES.`, 'danger');
    playTone(82, .32, 'sawtooth', .035); playTone(164, .45, 'triangle', .026, .1);
  }
  if (boss.stunTimer > 0 || boss.staggerTimer > 0) return;
  const dx = state.player.x - boss.x;
  const dy = state.player.y - boss.y;
  const distance = Math.hypot(dx, dy);
  boss.patternTime += delta;
  if (distance > 3.6 && distance < 12) {
    const direction = Math.atan2(dy, dx);
    const amount = .36 * (state.enemySlowTimer > 0 ? .4 : 1) * delta;
    const nextX = boss.x + Math.cos(direction) * amount;
    const nextY = boss.y + Math.sin(direction) * amount;
    if (canStand(nextX, boss.y)) boss.x = nextX;
    if (canStand(boss.x, nextY)) boss.y = nextY;
  }
  boss.summonTimer -= delta;
  if (boss.phase >= 2 && boss.summonTimer <= 0) {
    boss.summonTimer = boss.phase === 3 ? 5.8 : 7.8;
    const spawnKind = boss.phase === 3 ? 'hound' : 'wraith';
    const requestedX = clamp(boss.x + (Math.random() * 2 - 1) * 3.4, FINAL_ROOM_OFFSET + 2, FINAL_ROOM_OFFSET + FINAL_ROOM_WIDTH - 2);
    const requestedY = clamp(boss.y + (Math.random() * 2 - 1) * 3.4, 1.2, FINAL_ROOM_HEIGHT - 1.2);
    const occupied = worldEnemies.filter((enemy) => !enemy.dead).map((enemy) => ({ x: enemy.x, y: enemy.y }));
    occupied.push({ x: boss.x, y: boss.y });
    const summonPoint = findWalkableSpawnPoint(requestedX, requestedY, FINAL_ROOM_INDEX, occupied);
    if (isClearForSpawn(summonPoint.x, summonPoint.y, .3)) worldEnemies.push({ id: `archon-summon-${Date.now()}-${Math.random()}`, name: boss.phase === 3 ? 'Delivery Hound' : 'System Wraith', displayName: boss.phase === 3 ? 'Delivery Hound' : 'System Wraith', kind: spawnKind, x: summonPoint.x, y: summonPoint.y, roomIndex: FINAL_ROOM_INDEX, hp: boss.phase === 3 ? 74 : 66, maxHp: boss.phase === 3 ? 74 : 66, speed: boss.phase === 3 ? .52 : .38, damage: boss.phase === 3 ? 9 : 7, color: boss.phase === 3 ? '#b76b66' : '#77a9e8', cooldown: 1.2, attackTime: 0, attackHit: false, hitTime: 0, walkPhase: Math.random() * 5, alerted: true, dead: false, deathTime: 0, dropTemplates: [] });
    showToast('The Archon dispatches a new blocker.', 'danger');
  }

  if (boss.attackTelegraph) {
    boss.attackTelegraph.elapsed += delta;
    if (boss.attackTelegraph.elapsed >= boss.attackTelegraph.duration) {
      const attack = boss.attackTelegraph;
      executeBossPattern(boss, attack.pattern, attack);
      boss.attackTelegraph = null;
      boss.cooldown = boss.phase === 3 ? 1.22 : boss.phase === 2 ? 1.58 : 1.9;
    }
    return;
  }

  boss.cooldown -= delta;
  if (boss.cooldown > 0) return;
  const patternCount = boss.phase === 1 ? 3 : boss.phase === 2 ? 4 : 5;
  const pattern = boss.attackPattern++ % patternCount;
  boss.attackTelegraph = {
    pattern,
    label: bossAttackLabel(boss, pattern),
    elapsed: 0,
    duration: bossAttackDuration(boss, pattern),
    targetX: state.player.x,
    targetY: state.player.y,
  };
  showToast(`THE ARCHON TELEGRAPHS ${boss.attackTelegraph.label}.`, 'danger');
}
function drawBossTelegraph(now) {
  const boss = state.finalBoss;
  const attack = boss?.attackTelegraph;
  if (!boss || boss.dead || state.room !== FINAL_ROOM_INDEX || !attack) return;
  const progress = clamp(attack.elapsed / attack.duration, 0, 1);
  const pulse = .55 + Math.sin(now / 80) * .18;
  const color = attack.pattern === 3 ? '#9debdc' : attack.pattern === 4 ? '#c58de6' : '#f0d38f';
  if (attack.pattern === 1 || attack.pattern === 3) {
    drawProjectedWorldRing({ x: boss.x, y: boss.y }, attack.pattern === 3 ? 1.6 + progress * .5 : 1.2 + progress * 1.4, color, pulse, 28, .06, Math.max(1, canvas.height * .004), true);
  }
  if (attack.pattern === 0 || attack.pattern === 2 || attack.pattern === 4) {
    const start = projectCameraPoint(cameraPoint(boss.x, boss.y, .07));
    const end = projectCameraPoint(cameraPoint(attack.targetX, attack.targetY, .07));
    if (start && end) {
      ctx.save();
      ctx.globalAlpha = .48 + progress * .32;
      ctx.strokeStyle = color;
      ctx.shadowBlur = 12;
      ctx.shadowColor = color;
      ctx.lineWidth = Math.max(1, canvas.height * .003);
      ctx.setLineDash([12, 8]);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      if (attack.pattern === 4) {
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        for (const offset of [-.16, .16]) {
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(start.x + Math.cos(angle + offset) * (end.x - start.x) * .82, start.y + Math.sin(angle + offset) * (end.y - start.y) * .82);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }
}

function findAimTarget(range = weaponDefinition().range, aim = weaponDefinition().aim, pitch = weaponDefinition().pitch) {
  let target = null;
  let bestScore = Infinity;
  for (const enemy of allHostiles()) {
    if (enemy.dead) continue;
    const profile = enemyProfile(enemy);
    const dx = enemy.x - state.player.x;
    const dy = enemy.y - state.player.y;
    const horizontal = Math.hypot(dx, dy);
    if (horizontal > range || !hasLineOfSight(state.player.x, state.player.y, enemy.x, enemy.y)) continue;
    const camera = cameraPoint(enemy.x, enemy.y, profile.aimHeight);
    if (camera.forward <= .1) continue;
    const yawError = Math.abs(Math.atan2(camera.side, camera.forward));
    const pitchError = Math.abs(Math.atan2(profile.aimHeight - EYE_HEIGHT, camera.forward) - state.player.pitch);
    if (yawError > aim || pitchError > pitch) continue;
    const score = yawError * 3 + pitchError * 3 + horizontal * .06;
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
    const profile = enemyProfile(enemy);
    const dx = enemy.x - state.player.x;
    const dy = enemy.y - state.player.y;
    const distance = Math.hypot(dx, dy);
    if (distance > definition.range || !hasLineOfSight(state.player.x, state.player.y, enemy.x, enemy.y)) continue;
    const camera = cameraPoint(enemy.x, enemy.y, profile.aimHeight);
    if (camera.forward <= .05) continue;
    const yawError = Math.abs(Math.atan2(camera.side, camera.forward));
    const pitchError = Math.abs(Math.atan2(profile.aimHeight - EYE_HEIGHT, camera.forward) - state.player.pitch);
    if (yawError > definition.aim || pitchError > definition.pitch) continue;
    const score = yawError * 1.55 + pitchError * .75 + distance * .1;
    if (score < bestScore) { bestScore = score; target = enemy; }
  }
  return target;
}
function hitTarget() {
  const definition = weaponDefinition();
  const target = definition.melee ? findMeleeTarget() : findAimTarget();
  const damage = state.weapon.attackDamage || definition.damage;
  const comboStep = state.weapon.comboStep || 1;
  if (!target) {
    showHitMarker('MISS', 'miss');
    state.impactBursts.push({ x: state.player.x, y: state.player.y, z: EYE_HEIGHT, elapsed: 0, duration: .2, color: definition.impactColor || '#b9a57e', radius: .22, style: definition.melee ? 'melee-miss' : 'miss' });
    showToast(`${definition.label} found empty air.`);
    return;
  }
  const direction = { x: target.x - state.player.x, y: target.y - state.player.y };
  const damaged = damageHostile(target, damage, { source: 'weapon', label: `HIT · COMBO ${comboStep}`, color: definition.impactColor || '#d8c18b', knockback: definition.knockback * (1 + (comboStep - 1) * .25), knockbackDirection: direction, stagger: comboStep === 3 ? .3 : .16, critChance: (definition.critChance || .08) + (comboStep === 3 ? .12 : 0), critMultiplier: definition.critMultiplier || 1.7 });
  if (!damaged) return;
  state.impactBursts.push({ x: target.x, y: target.y, z: hostileAimHeight(target), elapsed: 0, duration: comboStep === 3 ? .56 : .32, color: definition.impactColor || '#d8c18b', radius: .42 + comboStep * .1, style: definition.melee ? (comboStep === 3 ? 'blade-finisher' : 'blade-hit') : comboStep === 3 ? 'finisher' : 'weapon-hit' });
  if (!target.dead) showToast(`${definition.label} struck ${target.displayName || target.name}.`, 'good');
  updateHud();
}
function projectileTargetHit(projectile, target) {
  if (projectile.spell) spawnSpellImpactParticles(projectile.spellKind, target.x, target.y, hostileAimHeight(target), projectile.color, projectile.aoe ? 1.08 : .9);
  const damaged = damageHostile(target, projectile.damage, { stun: projectile.stun, stagger: projectile.stagger, knockback: projectile.knockback, knockbackDirection: { x: projectile.vx, y: projectile.vy }, critChance: projectile.critChance, critMultiplier: projectile.critMultiplier, source: projectile.spell ? 'spell' : 'weapon', color: projectile.color, label: projectile.spell ? 'SPELL HIT' : 'HIT' });
  if (!damaged) return;
  showHitMarker(target.boss ? 'ARCHON HIT' : 'HIT', target.boss ? 'crit' : 'hit');
  const chainSegments = [];
  if (projectile.kind === 'spell-chain' && projectile.chainTargets > 0) {
    const chained = allHostiles()
      .filter((other) => other !== target && !other.dead && Math.hypot(other.x - target.x, other.y - target.y) < (projectile.aoe || 2.8) + .9)
      .sort((a, b) => Math.hypot(a.x - target.x, a.y - target.y) - Math.hypot(b.x - target.x, b.y - target.y))
      .slice(0, projectile.chainTargets);
    let previous = target;
    for (const other of chained) {
      damageHostile(other, projectile.damage * .5, { stun: projectile.stun * .72, stagger: projectile.stagger, knockback: projectile.knockback * .65, knockbackDirection: { x: other.x - target.x, y: other.y - target.y }, critChance: projectile.critChance * .6, critMultiplier: projectile.critMultiplier, source: 'spell', color: projectile.color, label: 'CHAIN HIT' });
      chainSegments.push({ start: { x: previous.x, y: previous.y, z: hostileAimHeight(previous) }, end: { x: other.x, y: other.y, z: hostileAimHeight(other) } });
      spawnSpellImpactParticles(projectile.spellKind, other.x, other.y, hostileAimHeight(other), projectile.color, .72);
      state.impactBursts.push({ x: other.x, y: other.y, z: hostileAimHeight(other), elapsed: 0, duration: .62, color: projectile.color, radius: .85 });
      previous = other;
    }
    if (chainSegments.length) state.activeSpellEffects.push({ kind: 'chain', elapsed: 0, duration: .8, color: projectile.color, segments: chainSegments });
  } else if (projectile.aoe > 0) {
    for (const other of allHostiles()) {
      if (other !== target && Math.hypot(other.x - target.x, other.y - target.y) < projectile.aoe) damageHostile(other, projectile.damage * .42, { stun: projectile.stun * .55, stagger: projectile.stagger, knockback: projectile.knockback * .7, knockbackDirection: { x: other.x - target.x, y: other.y - target.y }, critChance: projectile.critChance * .55, critMultiplier: projectile.critMultiplier, source: projectile.spell ? 'spell' : 'weapon', color: projectile.color, label: 'SPLASH HIT' });
    }
  }
  state.impactBursts.push({ x: target.x, y: target.y, z: hostileAimHeight(target), elapsed: 0, duration: .55, color: projectile.color, radius: projectile.aoe || .65 });
  playBoneHitSound();
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
      const currentSpeed = Math.hypot(projectile.vx, projectile.vy, projectile.vz) || 1;
      const desired = { x: dx / distance * currentSpeed, y: dy / distance * currentSpeed, z: dz / distance * currentSpeed };
      const steering = clamp(projectile.homing * delta, 0, 1);
      projectile.vx = lerp(projectile.vx, desired.x, steering);
      projectile.vy = lerp(projectile.vy, desired.y, steering);
      projectile.vz = lerp(projectile.vz, desired.z, steering);
    }
    if (projectile.spell) {
      projectile.trail.unshift({ x: projectile.x, y: projectile.y, z: projectile.z });
      if (projectile.trail.length > 12) projectile.trail.pop();
      if (projectile.spell && projectile.sparks && Math.random() < delta * (settings.reducedMotion ? 3 : 12)) spawnSpellTrailParticle(projectile);
    }
    const next = { x: projectile.x + projectile.vx * delta, y: projectile.y + projectile.vy * delta, z: projectile.z + projectile.vz * delta };
    if (isWall(next.x, next.y) || next.z < .03 || next.z > CEILING_Z - .03) {
      state.impactBursts.push({ x: projectile.x, y: projectile.y, z: projectile.z, elapsed: 0, duration: .35, color: projectile.color, radius: .45, style: 'projectile-impact' });
      if (projectile.spell) spawnSpellImpactParticles(projectile.spellKind, projectile.x, projectile.y, projectile.z, projectile.color, 1.05);
      continue;
    }
    projectile.x = next.x;
    projectile.y = next.y;
    projectile.z = next.z;

    if (projectile.source === 'enemy' || projectile.source === 'boss') {
      if (Math.hypot(projectile.x - state.player.x, projectile.y - state.player.y) < projectile.radius + .23 && Math.abs(projectile.z - EYE_HEIGHT) < projectile.collisionHeight) {
        damagePlayer({ name: projectile.source === 'boss' ? 'The Archon' : 'Ranged enemy', damage: projectile.damage }, { projectile });
        continue;
      }
    } else {
      let hit = null;
      for (const hostile of allHostiles()) {
        if (hostile.dead) continue;
        const distance = Math.hypot(projectile.x - hostile.x, projectile.y - hostile.y, projectile.z - hostileAimHeight(hostile));
        if (distance < projectile.radius + hostileRadius(hostile)) { hit = hostile; break; }
      }
      if (hit) { projectileTargetHit(projectile, hit); continue; }
    }
    remaining.push(projectile);
  }
  state.projectiles = remaining;
}
function performAttack() {
  const definition = weaponDefinition();
  if (state.reading || state.deathScreen || !state.weapon.equipped || state.menuActive || state.launchTransition || state.transition || state.weapon.swing > 0 || state.weapon.cooldown > 0 || state.gameComplete || state.dodgeTime > 0) return;
  const nextStep = state.comboTimer > 0 && state.combo > 0 && state.combo < 3 ? state.combo + 1 : 1;
  const staminaCost = definition.staminaCost * (nextStep === 2 ? 1.08 : nextStep === 3 ? 1.2 : 1);
  if (!spendStamina(staminaCost)) {
    showHitMarker('NO STAMINA', 'miss');
    showToast('Recover stamina before attacking.');
    return;
  }
  state.combo = nextStep;
  state.comboTimer = COMBO_WINDOW;
  state.weapon.comboStep = nextStep;
  state.weapon.attackDamage = definition.damage * (definition.comboMultipliers[nextStep - 1] || 1);
  state.weapon.swing = definition.duration;
  state.weapon.cooldown = definition.cooldown ?? .08;
  state.weapon.hit = false;
  state.weapon.projectile = 0;
  state.weapon.attackHitAt = definition.hitAt;
  state.lastAttackInput = performance.now();
  state.impactBursts.push({ x: state.player.x, y: state.player.y, z: .22, elapsed: 0, duration: .2, color: definition.impactColor || '#d8c18b', radius: .26 + nextStep * .06, style: 'weapon-ready' });
  playWeaponSound();
}
function updateWeapon(delta) {
  const definition = weaponDefinition();
  state.weapon.cooldown = Math.max(0, state.weapon.cooldown - delta);
  state.weapon.projectile = Math.max(0, state.weapon.projectile - delta);
  if (state.weapon.swing <= 0) return;
  const previous = state.weapon.swing;
  state.weapon.swing = Math.max(0, state.weapon.swing - delta);
  const progress = 1 - state.weapon.swing / definition.duration;
  if (!state.weapon.hit && progress > definition.hitAt) {
    state.weapon.hit = true;
    if (state.weapon.type === 'stars') spawnNinjaStar();
    else if (state.weapon.type === 'crossbow') spawnCrossbowArrow();
    else if (state.weapon.type === 'wand') spawnWandFireball();
    else hitTarget();
  }
  if (previous > 0 && state.weapon.swing <= 0) state.weapon.hit = false;
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
  const finalDoor = finalDoorDistance <= 1.65;
  const weaponCreature = getNearestWeaponCreature();
  const scroll = getNearestPromptScroll();
  const lobbyGate = state.room === 0 && !state.lobbyGateOpen && lobbyGateDistance() <= 1.65;
  let nextKey = null;
  let nextText = '';

  // Keep this list intentionally narrow: only immediate, explicitly actionable
  // interactions are shown below the crosshair.
  if (finalDoor) {
    nextKey = 'E';
    nextText = 'INTERACT WITH FINAL DOOR';
  } else if (lobbyGate && !state.weapon.equipped) {
    nextKey = 'E';
    nextText = 'EQUIP A WEAPON BEFORE OPENING GATE';
  } else if (lobbyGate && state.tutorialSpell) {
    nextKey = 'Q';
    nextText = 'CAST ARCHIVE KEY TO OPEN GATE';
  } else if (weaponCreature) {
    nextKey = 'E';
    nextText = `PICK UP ${WEAPON_LOADOUTS[weaponCreature.type].label.toUpperCase()}`;
  } else if (scroll) {
    nextKey = 'E';
    nextText = 'PICK UP SCROLL';
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
    state.player.pitch = 0;
    state.room = SANCTUARY_ROOM_INDEX;
    state.sanctuaryActive = true;
    state.gameComplete = false;
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
  updateDamageNumbers(delta);
  emitAmbientParticles(delta);
  if (state.launchTransition) { updateLaunchTransition(delta); state.damageFlash = Math.max(0, state.damageFlash - delta * 1.8); state.shakeTime = Math.max(0, state.shakeTime - delta * 1.8); }
  if (state.gameComplete) { advanceToPortfolio(); return; }
  if (state.forestTransition) { updateForestTransition(delta); state.damageFlash = Math.max(0, state.damageFlash - delta * 1.8); state.shakeTime = Math.max(0, state.shakeTime - delta * 1.8); return; }
  if (state.transition) { updateBossTransition(delta); state.damageFlash = Math.max(0, state.damageFlash - delta * 1.8); state.shakeTime = Math.max(0, state.shakeTime - delta * 1.8); return; }
  if (state.floorAnnouncement) updateFloorAnnouncement(delta);
  updateLobbyGate(delta);
  updatePlayer(delta);
  updateSanctuaryResume();
  collectTouchItems();
  if (state.room === FINAL_ROOM_INDEX) state.finalArenaTime += delta;
  updateWeapon(delta);
  if (state.mouseAttack && state.weapon.swing <= 0 && state.weapon.cooldown <= 0) performAttack();
  updateSpell(delta);
  updateProjectiles(delta);
  updateEnemies(delta);
  updateGroundHazards(delta);
  state.damageFlash = Math.max(0, state.damageFlash - delta * 1.8);
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
  if (event.code === 'Space' || rawKey === ' ') {
    event.preventDefault();
    if (down && !event.repeat) tryDodge();
    return;
  }
  if (down && !event.repeat && (key === 'e' || key === 'enter')) { event.preventDefault(); if (state.deathScreen) resetCurrentLevel(); else recoverNearby(); return; }
  if (down && !event.repeat && key === 'escape') {
    if (helpDialog?.open || settingsDialog?.open) return;
    event.preventDefault();
    if (state.reading) closeReading();
    else showToast(state.room === 0 ? 'You are in the safe field lobby.' : 'The archive has no pause menu. Return to the entrance hall for the safe lobby.');
    return;
  }
  if (down && !event.repeat && key === 'q') { event.preventDefault(); castSpell(); return; }
  if (down && !event.repeat && key === 'z') { event.preventDefault(); cycleSpell(-1); return; }
  if (down && !event.repeat && key === 'x') { event.preventDefault(); cycleSpell(1); return; }
  if (down && !event.repeat && ['1', '2', '3', '4'].includes(key)) {
    event.preventDefault();
    const weaponTypes = { '1': 'stars', '2': 'crossbow', '3': 'wand', '4': 'blade' };
    setWeapon(weaponTypes[key]);
    return;
  }
  const movementKeys = ['w', 'a', 's', 'd', 'shift', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
  if (!movementKeys.includes(key)) return;
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
  const dy = document.pointerLockElement === canvas ? event.movementY : event.movementY || 0;
  state.player.angle = normalizeAngle(state.player.angle + dx * .0028);
  state.player.pitch = clamp(state.player.pitch - dy * .0022, -.48, .48);
}
window.addEventListener('keydown', (event) => setKey(event, true), { passive: false });
window.addEventListener('keyup', (event) => setKey(event, false), { passive: false });
window.addEventListener('blur', () => { state.keys.clear(); state.mouseAttack = false; state.mouseLook = false; });
document.addEventListener('mousemove', handleMouseMove);
document.addEventListener('pointerlockchange', () => {
  state.pointerLocked = document.pointerLockElement === canvas;
  canvas.classList.toggle('pointer-locked', state.pointerLocked);
  if (!state.pointerLocked && !state.mouseAttack) state.mouseLook = false;
});
canvas.addEventListener('pointerdown', (event) => {
  if (event.button !== 0 || state.reading || state.menuActive) return;
  state.mouseAttack = true;
  state.mouseLook = true;
  requestGamePointerLock();
  performAttack();
  canvas.setPointerCapture?.(event.pointerId);
});
canvas.addEventListener('pointerup', (event) => {
  if (event.button !== 0) return;
  state.mouseAttack = false;
  if (!state.pointerLocked) state.mouseLook = false;
  canvas.releasePointerCapture?.(event.pointerId);
});
canvas.addEventListener('pointercancel', () => { state.mouseAttack = false; if (!state.pointerLocked) state.mouseLook = false; });
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
musicVolumeInput?.addEventListener('input', (event) => { settings.musicVolume = clamp(Number(event.target.value), 0, 1); });
sfxVolumeInput?.addEventListener('input', (event) => { settings.sfxVolume = clamp(Number(event.target.value), 0, 1); });
reducedMotionInput?.addEventListener('change', (event) => { settings.reducedMotion = event.target.checked; });
pointerLockInput?.addEventListener('change', (event) => {
  settings.pointerLock = event.target.checked;
  if (!settings.pointerLock && document.pointerLockElement === canvas) document.exitPointerLock?.();
});
weaponOptionButtons.forEach((button) => button.addEventListener('click', () => {
  updateWeaponSelection(button.dataset.weapon);
  state.weapon.equipped = false;
  state.promptSignature = '';
}));
if (musicVolumeInput) musicVolumeInput.value = String(settings.musicVolume);
if (sfxVolumeInput) sfxVolumeInput.value = String(settings.sfxVolume);
if (reducedMotionInput) reducedMotionInput.checked = settings.reducedMotion;
if (pointerLockInput) pointerLockInput.checked = settings.pointerLock;
window.addEventListener('resize', resizeCanvas);

function clearLegacyStartupOverlays() {
  document.querySelectorAll('.game-shell > [class$="-overlay"], .game-shell > [id^="main-"]').forEach((node) => {
    if (!node.classList.contains('reading-overlay') && !node.classList.contains('death-overlay')) node.remove();
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

textures.stone = createStoneTexture(256, 13); textures.wood = createWoodTexture(256, 29); buildGroundCache(); textures.bone = createBoneTexture(96, 37); textures.steel = createSteelTexture(96, 53); textures.leather = createLeatherTexture(96, 71); textures.patterns = { stone: ctx.createPattern(textures.stone, 'repeat'), wood: ctx.createPattern(textures.wood, 'repeat'), bone: ctx.createPattern(textures.bone, 'repeat'), steel: ctx.createPattern(textures.steel, 'repeat'), leather: ctx.createPattern(textures.leather, 'repeat') }; updateWeaponSelection(state.weapon.type); state.weapon.equipped = false; clearLegacyStartupOverlays(); state.lastTime = performance.now(); updateHud(); resizeCanvas(); requestAnimationFrame(gameLoop);
