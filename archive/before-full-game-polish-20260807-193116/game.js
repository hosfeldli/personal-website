"use strict";

/*
 * LIAM HOSFELD // THE OPERATIONS DUNGEON
 *
 * One connected dungeon map. The browser renders the world with a small
 * software 3D pipeline: vertical camera pitch, perspective projection,
 * painter-sorted low-poly meshes, raycast walls, procedural materials, and
 * hand-built low-poly spear/crossbow meshes and several enemy archetypes.
 */

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d', { alpha: false });
const roomTitle = document.getElementById('room-title');
const roomFloor = document.getElementById('room-floor');
const roomCount = document.getElementById('room-count');
const evidenceCount = document.getElementById('evidence-count');
const skeletonCount = document.getElementById('skeleton-count');
const experienceValue = document.getElementById('experience-value');
const bossPlaque = document.getElementById('boss-plaque');
const bossName = document.getElementById('boss-name');
const bossHealthBar = document.getElementById('boss-health-bar');
const bossPhase = document.getElementById('boss-phase');
const scrollRewardKicker = document.getElementById('scroll-reward-kicker');
const hpValue = document.getElementById('hp-value');
const hpBar = document.getElementById('hp-bar');
const interactionPrompt = document.getElementById('interaction-prompt');
const promptKey = document.getElementById('prompt-key');
const promptText = document.getElementById('prompt-text');
const toast = document.getElementById('toast');
const readingOverlay = document.getElementById('reading-overlay');
const scrollRoomLabel = document.getElementById('scroll-room-label');
const scrollRecordNumber = document.getElementById('scroll-record-number');
const scrollTitle = document.getElementById('scroll-title');
const scrollSummary = document.getElementById('scroll-summary');
const scrollProgressLabel = document.getElementById('scroll-progress-label');
const scrollProgressValue = document.getElementById('scroll-progress-value');
const scrollProgressBar = document.getElementById('scroll-progress-bar');
const scrollProgressCaption = document.getElementById('scroll-progress-caption');
const scrollDetails = document.getElementById('scroll-details');
const scrollSpell = document.getElementById('scroll-spell');
const scrollSpellSeal = document.getElementById('scroll-spell-seal');
const scrollSpellName = document.getElementById('scroll-spell-name');
const scrollSpellDescription = document.getElementById('scroll-spell-description');
const scrollTags = document.getElementById('scroll-tags');
const scrollActions = document.getElementById('scroll-actions');
const closeScrollButton = document.getElementById('close-scroll');
const helpButton = document.getElementById('help-button');
const musicButton = document.getElementById('music-button');
const helpDialog = document.getElementById('help-dialog');
const gameShell = document.querySelector('.game-shell');
const mainMenu = document.getElementById('main-menu');
const playButton = document.getElementById('play-button');
const menuButton = document.getElementById('menu-button');
const loadoutDescription = document.getElementById('loadout-description');
const weaponOptionButtons = [...document.querySelectorAll('[data-weapon]')];

const rooms = [
  {
    id: 'entrance', floor: 'FLOOR 01', title: 'THE ENTRANCE HALL', shortTitle: 'Entrance Hall', subtitle: 'Identity, scope, and the work behind the map.', color: '#6ce0c2', material: 'stone', levelType: 'grand hall', palette: ['#090503', '#392719', '#0e0906'],
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
    decor: ['L H', 'SYSTEMS', 'CARTOGRAPHER'],
    torches: [{ x: 2, y: 1.5 }, { x: 13.8, y: 1.5 }, { x: 8, y: 6.6 }],
    items: [
      { id: 'identity-sigil', title: 'SYSTEMS CARTOGRAPHER', kind: 'sigil', icon: 'Σ', tag: 'CLASS / IDENTITY', x: 8.5, y: 3.2, color: '#6ce0c2', summary: 'Liam turns messy operational systems into routes people can actually run.', details: ['Technical Consultant at Manhattan Associates.', 'Specialty spans TMS, logistics data ecosystems, integration evidence, and automation.'] },
      { id: 'consultant-seal', title: 'THE CONSULTANT’S SEAL', kind: 'seal', icon: 'LH', tag: 'ROLE / SCOPE', x: 12.5, y: 6.2, color: '#e7ad67', summary: 'Customer-facing technical delivery with a bias toward clarity and useful outcomes.', details: ['Coordinates across Operations, Cloud Services, Finance, and R&D.', 'Translates requirements and system behavior into clear decisions.'] }
    ],
    enemies: [
      { id: 'scope-wraith', name: 'Scope Wraith', kind: 'wraith', x: 6.5, y: 2.5, hp: 70, speed: .36, damage: 7, color: '#ae6fd0' },
      { id: 'ambiguity-imp', name: 'Ambiguity Imp', kind: 'imp', x: 11.5, y: 4.8, hp: 55, speed: .48, damage: 5, color: '#bd6b72' }
    ]
  },
  {
    id: 'trophy', floor: 'FLOOR 02', title: 'THE TROPHY ROOM', shortTitle: 'Trophy Room', subtitle: 'Proof gathered on the journey.', color: '#e7ad67', material: 'wood', levelType: 'vault gallery', palette: ['#0c0704', '#3b2112', '#120805'],
    intro: 'Customer-facing ownership at production scale, with measurable impact across data, billing, documentation, and cloud operations.',
    details: ['5 enterprise accounts supported, representing roughly 50% of the team’s managed contract value.', '1M+ tracking messages handled each month across production systems.', 'Approximately $40K in Azure savings identified through analysis and translated into a Finance-ready decision.', '40+ customer endpoints mapped through a reusable publishing and validation workflow.', 'Enterprise partners and ecosystems have included organizations such as Sysco, US Foods, BJ’s Wholesale Club, H&M Trucking, and Guest Supply.'],
    tags: ['5 accounts', '1M+ messages / month', '~$40K recovered', '40+ endpoints'],
    map: ['1111111111111111', '1000000000000001', '1000111111000001', '1000100001000001', '1000100001000001', '1000111111000001', '1000000000000001', '1111111111111111'],
    spawn: { x: 2.5, y: 6, angle: -Math.PI / 2 },
    decor: ['5 ACCOUNTS', '1M+ MSG', '~$40K', '40+ ROUTES'],
    torches: [{ x: 2, y: 1.5 }, { x: 13.8, y: 1.5 }, { x: 2, y: 6.6 }, { x: 13.8, y: 6.6 }],
    items: [
      { id: 'account-ledger', title: 'THE ACCOUNT LEDGER', kind: 'ledger', icon: '5', tag: 'REPUTATION / PARTY', x: 2.5, y: 2.5, color: '#e7ad67', summary: 'Five enterprise accounts carried across customer-facing support and improvement work.', details: ['The accounts represent roughly 50% of the team’s managed contract value.', 'Ownership includes investigation, demos, coordination, and delivery.'] },
      { id: 'message-crystal', title: 'THE MESSAGE CRYSTAL', kind: 'crystal', icon: '1M', tag: 'MESSAGES / MONTH', x: 13.5, y: 2.5, color: '#6ce0c2', summary: 'Production-scale tracking data: more than one million messages each month.', details: ['The volume powers analytics, billing investigations, and operational decisions.', 'Evidence is only useful when it can be explained to the people running the process.'] },
      { id: 'savings-ledger', title: 'THE SAVINGS LEDGER', kind: 'ledger', icon: '$', tag: 'GOLD / RECOVERED', x: 2.5, y: 5.5, color: '#e7ad67', summary: 'Approximately $40K in Azure savings identified through analysis.', details: ['Usage data was translated into a Finance-ready decision.', 'This is the pattern: find the signal, quantify it, and make the action obvious.'] },
      { id: 'endpoint-map', title: 'THE ENDPOINT MAP', kind: 'map', icon: '40+', tag: 'ROUTES / MAPPED', x: 13.5, y: 5.5, color: '#77a9e8', summary: 'More than forty customer endpoints mapped through a repeatable publishing workflow.', details: ['Documentation became easier to validate and ship.', 'Reusable guidance reduced the friction around customer integration work.'] }
    ],
    enemies: [
      { id: 'queue-crawler', name: 'Queue Crawler', kind: 'crawler', x: 7, y: 1.5, hp: 80, speed: .32, damage: 8, color: '#b77754' },
      { id: 'invoice-ghoul', name: 'Invoice Ghoul', kind: 'ghoul', x: 10.5, y: 6.5, hp: 65, speed: .42, damage: 6, color: '#7db8ac' }
    ]
  },
  {
    id: 'quests', floor: 'FLOOR 03', title: 'THE QUEST BOARD', shortTitle: 'Quest Board', subtitle: 'Selected problems, investigated and made repeatable.', color: '#c58de6', material: 'stone', levelType: 'crossroads', palette: ['#0a0508', '#2e1d2b', '#0b070b'],
    intro: 'Four representative quests show how Liam moves from ambiguity to an operating improvement.',
    details: ['Billing clarity: turned high-volume message data into a report that helped Finance understand usage and recover approximately $40K.', 'Integration guidance: built a publication and validation workflow that made documentation easier to ship across 40+ customer endpoints.', 'Shipment integrity: investigated message and status relationships to diagnose a shipment-status issue and produce a defensible recommendation.', 'Support search: built an SSO search tool for 50K+ shipper records so live support could find the right relationship faster.'],
    tags: ['Investigate', 'Clarify', 'Automate', 'Measure'],
    map: ['1111111111111111', '1000001000000001', '1000001000000001', '1000000000000001', '1111100001111111', '1000000000000001', '1000000000000001', '1111111111111111'],
    spawn: { x: 3.5, y: 2.5, angle: Math.PI / 2 },
    decor: ['QUEST 01', 'QUEST 02', 'QUEST 03', 'QUEST 04'],
    torches: [{ x: 1.5, y: 1.5 }, { x: 14, y: 1.5 }, { x: 6.5, y: 4.5 }, { x: 2, y: 6.5 }, { x: 13.5, y: 6.5 }],
    items: [
      { id: 'billing-quest', title: 'BILLING CLARITY', kind: 'scroll', icon: '$', tag: 'QUEST / FINANCE', x: 2.5, y: 6.5, color: '#e7ad67', summary: 'Turned message volume into a Finance-ready billing decision.', details: ['Investigated production data and usage patterns.', 'Recovered approximately $40K by making the evidence legible.'] },
      { id: 'documentation-quest', title: 'INTEGRATION GUIDANCE', kind: 'scroll', icon: '↗', tag: 'QUEST / DOCUMENTATION', x: 9.5, y: 3.5, color: '#77a9e8', summary: 'Made integration guidance easier to publish, validate, and explain.', details: ['Built a workflow around 40+ customer endpoints.', 'Reusable documentation turned one-off knowledge into an operating asset.'] },
      { id: 'shipment-quest', title: 'SHIPMENT INTEGRITY', kind: 'scroll', icon: '↔', tag: 'QUEST / INVESTIGATION', x: 12.5, y: 6.5, color: '#c58de6', summary: 'Diagnosed a shipment-status integrity issue by tracing relationships through the data.', details: ['Compared message and status evidence.', 'Produced a defensible recommendation instead of a guess.'] },
      { id: 'search-quest', title: 'THE SUPPORT SEARCH', kind: 'key', icon: '50K', tag: 'QUEST / WAYFINDING', x: 3.5, y: 3.5, color: '#6ce0c2', summary: 'Built an SSO search tool for more than 50,000 shipper records.', details: ['Made relationship searches useful during live support.', 'The tool shortened the distance between a question and the right record.'] }
    ],
    enemies: [
      { id: 'requirement-beast', name: 'Requirement Beast', kind: 'beast', x: 6.5, y: 4.5, hp: 90, speed: .34, damage: 9, color: '#9b6bd0' },
      { id: 'status-moth', name: 'Status Moth', kind: 'moth', x: 12.5, y: 2.5, hp: 55, speed: .56, damage: 5, color: '#dfae65' }
    ]
  },
  {
    id: 'chronicle', floor: 'FLOOR 04', title: 'THE CHRONICLE', shortTitle: 'Chronicle', subtitle: 'Experience that supports the proof.', color: '#77a9e8', material: 'stone', levelType: 'archive maze', palette: ['#05080c', '#1d2b3a', '#06090d'],
    intro: 'A progression from technical delivery to analytics, integrations, automation, and cross-functional ownership.',
    details: ['Manhattan Associates — Consultant, May 2025 to present: own customer-facing work and coordinate across Operations, Cloud Services, Finance, and R&D.', 'Manhattan Associates — Cloud Services Intern / Co-op, May 2023 to May 2025: built the 50K+ shipper-record SSO search tool and Azure savings analysis.', 'Soliant Healthcare — Systems Operations Intern, May to August 2022: automated onboarding work and found duplicate accounts tied to roughly $36K in annual savings.', 'Georgia Tech Research Institute — Research Intern, ATAS Lab, May to August 2020: built C# integration components for robotic object-detection research.'],
    tags: ['Manhattan Associates', 'Soliant Healthcare', 'GTRI', 'Customer delivery'],
    map: ['1111111111111111', '1000000000000001', '1011110111101101', '1000010000010001', '1000010000010001', '1011110111101101', '1000000000000001', '1111111111111111'],
    spawn: { x: 8.5, y: 4.5, angle: Math.PI },
    decor: ['NOW', '02', '03', '04'],
    torches: [{ x: 1.5, y: 1.5 }, { x: 14, y: 1.5 }, { x: 1.5, y: 6.5 }, { x: 14, y: 6.5 }],
    items: [
      { id: 'manhattan-current', title: 'THE CURRENT CHAPTER', kind: 'chronicle', icon: 'NOW', tag: 'MAY 2025 — PRESENT', x: 2.5, y: 1.5, color: '#6ce0c2', summary: 'Consultant at Manhattan Associates, owning customer-facing technical delivery.', details: ['Coordinates across Operations, Cloud Services, Finance, and R&D.', 'Turns functional requirements into reliable technical outcomes.'] },
      { id: 'manhattan-coop', title: 'THE CO-OP CHAPTER', kind: 'chronicle', icon: '02', tag: 'MAY 2023 — MAY 2025', x: 13.5, y: 1.5, color: '#77a9e8', summary: 'Cloud Services Intern / Co-op at Manhattan Associates.', details: ['Built an SSO search tool for 50K+ shipper records.', 'Created analysis that identified approximately $40K in Azure savings.'] },
      { id: 'soliant-chapter', title: 'THE SOLIANT CHAPTER', kind: 'chronicle', icon: '03', tag: 'MAY — AUG 2022', x: 2.5, y: 6.5, color: '#e7ad67', summary: 'Systems Operations Intern at Soliant Healthcare.', details: ['Automated onboarding work.', 'Found duplicate accounts tied to roughly $36K in annual savings.'] },
      { id: 'gtri-chapter', title: 'THE GTRI CHAPTER', kind: 'chronicle', icon: '04', tag: 'MAY — AUG 2020', x: 13.5, y: 6.5, color: '#c58de6', summary: 'Research Intern in the ATAS Lab at Georgia Tech Research Institute.', details: ['Built C# integration components.', 'Supported robotic object-detection research.'] }
    ],
    enemies: [
      { id: 'legacy-echo', name: 'Legacy Echo', kind: 'wraith', x: 6.5, y: 4.5, hp: 78, speed: .38, damage: 7, color: '#668ed0' },
      { id: 'handoff-hound', name: 'Handoff Hound', kind: 'hound', x: 10.5, y: 4.5, hp: 68, speed: .52, damage: 8, color: '#b76b66' }
    ]
  },
  {
    id: 'character', floor: 'FLOOR 05', title: 'THE CHARACTER SHEET', shortTitle: 'Character Sheet', subtitle: 'Tools carried into the dungeon.', color: '#e3c66e', material: 'wood', levelType: 'craft workshop', palette: ['#0d0703', '#402613', '#120805'],
    intro: 'A systems-minded toolkit spanning operational data, integration evidence, automation, and stakeholder delivery.',
    details: ['Education: University of Georgia, B.S. Computer Systems Engineering, GPA 3.83, May 2025.', 'Operational analytics: Oracle SQL, BigQuery, Power BI, DAX, data modeling, billing, and reporting.', 'Functional delivery: requirements, incident investigation, technical demos, process mapping, stakeholder coordination, and documentation.', 'Systems and integration: TMS, MIF, EDI/X12, AS2, SFTP, message troubleshooting, and event troubleshooting.', 'Automation and delivery: Python, PowerShell, Perl, Bash, JavaScript, C#, Git, and CI/CD.'],
    tags: ['UGA · 3.83 GPA', 'Oracle SQL', 'Python / PowerShell / Perl', 'EDI · AS2 · SFTP'],
    map: ['1111111111111111', '1000000000000001', '1000110001100001', '1000000000000001', '1000000000000001', '1000110001100001', '1000000000000001', '1111111111111111'],
    spawn: { x: 6.5, y: 6, angle: -Math.PI / 2 },
    decor: ['UGA', 'SQL', 'EDI', 'CODE'],
    torches: [{ x: 2, y: 1.5 }, { x: 13.8, y: 1.5 }, { x: 2, y: 6.5 }, { x: 13.8, y: 6.5 }],
    items: [
      { id: 'uga-crest', title: 'THE UGA CREST', kind: 'crest', icon: 'UGA', tag: 'EDUCATION / MAY 2025', x: 2.5, y: 2.5, color: '#e3c66e', summary: 'B.S. Computer Systems Engineering from the University of Georgia.', details: ['GPA: 3.83.', 'A foundation for moving comfortably between systems, data, and delivery.'] },
      { id: 'analytics-kit', title: 'THE ANALYTICS KIT', kind: 'kit', icon: 'SQL', tag: 'SLOT 01 / INTELLIGENCE', x: 11.5, y: 2.5, color: '#6ce0c2', summary: 'Operational analytics carried into production work.', details: ['Oracle SQL, BigQuery, Power BI, DAX, data modeling, billing, and reporting.', 'Turns operational evidence into a decision someone can use.'] },
      { id: 'integration-rune', title: 'THE INTEGRATION RUNE', kind: 'rune', icon: 'EDI', tag: 'SLOT 03 / WAYFINDING', x: 2.5, y: 5.5, color: '#77a9e8', summary: 'The languages of connected logistics systems.', details: ['TMS, MIF, EDI/X12, AS2, SFTP, message troubleshooting, and event troubleshooting.', 'Finds the path through noisy system relationships.'] },
      { id: 'automation-kit', title: 'THE AUTOMATION KIT', kind: 'kit', icon: 'CODE', tag: 'SLOT 04 / CRAFT', x: 11.5, y: 5.5, color: '#c58de6', summary: 'Automation and delivery tools that make the path repeatable.', details: ['Python, PowerShell, Perl, Bash, JavaScript, C#, Git, and CI/CD.', 'Prefers modular work that can be operated, explained, and improved.'] }
    ],
    enemies: [
      { id: 'syntax-beast', name: 'Syntax Beast', kind: 'beast', x: 6.5, y: 3.5, hp: 85, speed: .36, damage: 8, color: '#cf9b5e' },
      { id: 'integration-leech', name: 'Integration Leech', kind: 'leech', x: 9.5, y: 6.5, hp: 62, speed: .48, damage: 6, color: '#7d9bd1' }
    ]
  },
  {
    id: 'campfire', floor: 'FLOOR 06', title: 'THE CAMPFIRE', shortTitle: 'Campfire', subtitle: 'Plants, bread, and rhythm.', color: '#db8872', material: 'stone', levelType: 'garden hearth', palette: ['#120704', '#4a2418', '#100604'],
    intro: 'Away from the screen, Liam likes slow, hands-on work: keeping plants alive, baking bread, and learning bass after years behind a drum kit.',
    details: ['Baking: long ferments, shaping, scoring, and the small improvements that show up in the next loaf.', 'Plants: light, propagation, watering routines, and building a greener home one cutting at a time.', 'Music: drums first, bass now — the same groove from a different seat.', 'Home base: Atlanta, Georgia.'],
    tags: ['Baking', 'Plants', 'Drums', 'Bass guitar', 'Atlanta'],
    map: ['1111111111111111', '1000000000000001', '1000001111000001', '1000001001000001', '1000001001000001', '1000001111000001', '1000000000000001', '1111111111111111'],
    spawn: { x: 2.5, y: 2.5, angle: 0 },
    decor: ['BAKE', 'GROW', 'DRUM', 'BASS'],
    torches: [{ x: 2, y: 1.5 }, { x: 13.8, y: 1.5 }, { x: 2, y: 6.5 }, { x: 13.8, y: 6.5 }],
    items: [
      { id: 'bread-loaf', title: 'THE BREAD LOAF', kind: 'bread', icon: 'B', tag: 'OFF-DUTY / BAKING', x: 2.5, y: 2.5, color: '#e7ad67', summary: 'Slow, hands-on work: long ferments, shaping, scoring, and the next small improvement.', details: ['Baking is a process of observing the evidence and adjusting the next iteration.', 'The best results show up in the loaf you make after the last one.'] },
      { id: 'plant-cutting', title: 'THE PLANT CUTTING', kind: 'plant', icon: 'P', tag: 'OFF-DUTY / PLANTS', x: 13.5, y: 2.5, color: '#6ce0c2', summary: 'Light, propagation, watering routines, and a greener home one cutting at a time.', details: ['Plants reward consistency and attention to small signals.', 'A different kind of operating system, with dirt under the fingernails.'] },
      { id: 'music-kit', title: 'THE MUSIC KIT', kind: 'music', icon: '♫', tag: 'OFF-DUTY / RHYTHM', x: 3.5, y: 5.5, color: '#c58de6', summary: 'Drums first, bass now — the same groove from a different seat.', details: ['Years behind a drum kit built the rhythm.', 'Learning bass adds another way to listen to the same system.'] },
      { id: 'atlanta-marker', title: 'THE ATLANTA MARKER', kind: 'marker', icon: 'ATL', tag: 'HOME BASE', x: 12.5, y: 5.5, color: '#db8872', summary: 'Atlanta, Georgia: the home base for the work and the off-duty experiments.', details: ['A city of logistics, systems, neighborhoods, gardens, and good food.', 'The map starts here.'] }
    ],
    enemies: [
      { id: 'burnout-imp', name: 'Burnout Imp', kind: 'imp', x: 5.5, y: 5.5, hp: 72, speed: .46, damage: 7, color: '#d16f63' },
      { id: 'noise-moth', name: 'Noise Moth', kind: 'moth', x: 10.5, y: 1.5, hp: 58, speed: .58, damage: 5, color: '#c7a359' }
    ]
  },
  {
    id: 'gate', floor: 'FLOOR 07', title: 'THE LIGHTWELL SANCTUM', shortTitle: 'Lightwell Sanctum', subtitle: 'The final delivery is a fight.', color: '#e9e9e0', material: 'stone', levelType: 'boss arena', palette: ['#030a0d', '#102c31', '#020608'],
    intro: 'A final sanctum where every route, system, and decision is tested under pressure.',
    details: ['The Operations Archon protects the lightwell.', 'Break its phases, survive the system-wide patterns, and enter the door of light.', 'The portfolio waits beyond the encounter.'],
    tags: ['Final encounter', 'Multi-phase boss', 'Door of light', 'Return to menu'],
    map: ['11111111111111111111111111', '10000000000000000000000001', '10000000000000000000000001', '10000000000000000000000001', '10000000000000000000000001', '10000000000000000000000001', '10000000000000000000000001', '10000000000000000000000001', '10000000000000000000000001', '10000000000000000000000001', '10000000000000000000000001', '10000000000000000000000001', '10000000000000000000000001', '11111111111111111111111111'],
    spawn: { x: 2.4, y: 5.5, angle: 0 },
    decor: ['ARCHON', 'PHASE', 'LIGHTWELL', 'EXIT'],
    torches: [{ x: 2, y: 2 }, { x: 2, y: 12 }, { x: 13, y: 2 }, { x: 13, y: 12 }, { x: 23, y: 2 }, { x: 23, y: 12 }, { x: 13, y: 7 }],
    items: [
      { id: 'sanctum-brief', title: 'THE FINAL BRIEF', kind: 'scroll', icon: '!', tag: 'SANCTUM / BRIEF', x: 5.2, y: 2.2, color: '#e9e9e0', summary: 'The last requirements arrive before the fight begins.', details: ['Recovering this scroll grants 25 XP.', 'The Archon is vulnerable between its attack patterns.'] },
      { id: 'phase-ledger', title: 'THE PHASE LEDGER', kind: 'ledger', icon: 'III', tag: 'SANCTUM / PHASES', x: 20.8, y: 2.2, color: '#e7ad67', summary: 'Three phases. One operating system to dismantle.', details: ['Recovering this scroll grants 25 XP.', 'Watch the boss plaque for phase changes and shield breaks.'] },
      { id: 'lightwell-record', title: 'THE LIGHTWELL RECORD', kind: 'chronicle', icon: '✦', tag: 'SANCTUM / LIGHT', x: 5.2, y: 11.2, color: '#6ce0c2', summary: 'The door of light opens only after the Archon falls.', details: ['Recovering this scroll grants 25 XP.', 'Press E at the doorway when the encounter is complete.'] },
      { id: 'exit-seal', title: 'THE EXIT SEAL', kind: 'seal', icon: '↗', tag: 'SANCTUM / RETURN', x: 20.8, y: 11.2, color: '#77a9e8', summary: 'A final seal for the route back to the portfolio.', details: ['Recovering this scroll grants 25 XP.', 'The active door of light will be impossible to miss.'] }
    ],
    enemies: []
  }
];

const ROOM_WIDTH = 22;
const ROOM_HEIGHT = 12;
const FINAL_ROOM_WIDTH = 30;
const FINAL_ROOM_HEIGHT = 18;
const ROOM_GAP = 4;
const ROOM_INSET_X = 3;
const ROOM_INSET_Y = 2;
const ROOM_DOOR_Y = Math.floor(ROOM_HEIGHT / 2) - 1;
const roomWidths = rooms.map((_, index) => index === rooms.length - 1 ? FINAL_ROOM_WIDTH : ROOM_WIDTH);
const roomHeights = rooms.map((_, index) => index === rooms.length - 1 ? FINAL_ROOM_HEIGHT : ROOM_HEIGHT);
const roomOffsets = rooms.map((_, index) => rooms.slice(0, index).reduce((offset, __, roomIndex) => offset + roomWidths[roomIndex] + ROOM_GAP, 0));
const WORLD_WIDTH = roomOffsets[roomOffsets.length - 1] + roomWidths[roomWidths.length - 1];
const WORLD_HEIGHT = Math.max(...roomHeights);
const worldMap = Array.from({ length: WORLD_HEIGHT }, () => Array(WORLD_WIDTH).fill('1'));

function roomContentPoint(roomIndex, x, y) {
  if (roomIndex === rooms.length - 1) return { x, y };
  return { x: x + ROOM_INSET_X, y: y + ROOM_INSET_Y };
}

function expandedRoomMap(room, roomIndex) {
  const width = roomWidths[roomIndex];
  const height = roomHeights[roomIndex];
  const map = Array.from({ length: height }, (_, y) => Array.from({ length: width }, (_, x) => (x === 0 || y === 0 || x === width - 1 || y === height - 1) ? '1' : '0'));
  const doorRows = [ROOM_DOOR_Y, ROOM_DOOR_Y + 1];
  const centerY = Math.floor(height / 2);

  if (roomIndex !== rooms.length - 1) {
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

/* Copy each chamber into one world grid, then cut two-cell-wide doors through the corridors. */
for (let roomIndex = 0; roomIndex < rooms.length; roomIndex += 1) {
  const room = rooms[roomIndex];
  const offset = roomOffsets[roomIndex];
  const map = expandedRoomMap(room, roomIndex);
  for (let y = 0; y < roomHeights[roomIndex]; y += 1) {
    for (let x = 0; x < roomWidths[roomIndex]; x += 1) worldMap[y][offset + x] = map[y][x];
  }
}
for (let roomIndex = 0; roomIndex < rooms.length - 1; roomIndex += 1) {
  const corridorStart = roomOffsets[roomIndex] + roomWidths[roomIndex];
  const doorRows = [ROOM_DOOR_Y, ROOM_DOOR_Y + 1];
  for (const y of doorRows) {
    worldMap[y][roomOffsets[roomIndex] + roomWidths[roomIndex] - 1] = '0';
    for (let x = corridorStart; x < corridorStart + ROOM_GAP; x += 1) worldMap[y][x] = '0';
    worldMap[y][roomOffsets[roomIndex + 1]] = '0';
  }
}

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
const DECORATIVE_ITEM_IDS = new Set(['sanctum-brief', 'phase-ledger', 'lightwell-record', 'exit-seal']);
const worldItems = [];
const worldEnemies = [];
const worldTorches = [];
for (let roomIndex = 0; roomIndex < rooms.length; roomIndex += 1) {
  const room = rooms[roomIndex];
  const offset = roomOffsets[roomIndex];
  room.items.filter((item) => item.portfolioRecord !== false && !DECORATIVE_ITEM_IDS.has(item.id)).forEach((item) => {
    const point = roomContentPoint(roomIndex, item.x, item.y);
    worldItems.push({ ...item, x: point.x + offset, y: point.y, roomIndex, recovered: false });
  });
  room.enemies.forEach((enemy, index) => worldEnemies.push({
    ...enemy,
    x: roomContentPoint(roomIndex, enemy.x, enemy.y).x + offset,
    y: roomContentPoint(roomIndex, enemy.x, enemy.y).y,
    roomIndex,
    name: enemy.name,
    displayName: enemy.name,
    archetype: enemy.kind || 'skeleton',
    kind: enemy.kind || 'skeleton',
    maxHp: enemy.hp,
    cooldown: 0,
    attackTime: 0,
    attackHit: false,
    hitTime: 0,
    walkPhase: index * 2.3,
    alerted: false,
    dead: false,
    deathTime: 0,
  }));
  room.torches.forEach((torch) => {
    const point = roomContentPoint(roomIndex, torch.x, torch.y);
    worldTorches.push({ ...torch, x: point.x + offset, y: point.y, roomIndex });
  });
}
const initialEnemyData = worldEnemies.map((enemy) => ({ ...enemy }));

const FINAL_ROOM_INDEX = rooms.length - 1;
const FINAL_ROOM_OFFSET = roomOffsets[FINAL_ROOM_INDEX];
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
    phase: 1,
    cooldown: 1.2,
    attackTime: 0,
    attackPattern: 0,
    patternTime: 0,
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
for (let gy = 0; gy < WORLD_HEIGHT; gy += 1) {
  for (let gx = 0; gx < WORLD_WIDTH; gx += 1) {
    let brightness = 0;
    for (const torch of worldTorches) {
      const distance = Math.hypot(gx + .5 - torch.x, gy + .5 - torch.y);
      brightness += Math.pow(clamp(1 - distance / 5.2, 0, 1), 2);
    }
    lightGrid[gy * WORLD_WIDTH + gx] = clamp(brightness, 0, 1.5);
  }
}

const ITEM_TOTAL = worldItems.length;
const FOV = Math.PI / 3;
const VERTICAL_FOV = Math.PI / 3;
const MAX_DEPTH = 36;
const BOSS_RENDER_DEPTH = 70;
const RAY_COUNT = 224;
const FLOOR_STEP = 10;
const RENDER_INTERVAL = 1000 / 50;
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
  spear: { label: 'Spear', description: 'A steady melee reach weapon. Aim at a threat and let the thrust land before you commit to the next strike.', range: 4.7, damage: 30, aim: .2, pitch: .2, hitAt: .48, knockback: .18, duration: .72, cooldown: .14 },
  crossbow: { label: 'Crossbow', description: 'A measured ranged shot with a clear recovery beat. Precise, useful, and deliberately not overpowering.', range: 8.5, damage: 36, aim: .12, pitch: .14, hitAt: .62, knockback: .06, duration: .9, cooldown: .3 },
  wand: { label: 'Ember Wand', description: 'A rune-carved wand that casts area fireballs. Its crystal and fire change color with the latest spell learned.', range: 10.5, damage: 42, aim: .2, pitch: .26, hitAt: .56, knockback: .07, duration: .82, cooldown: .36, projectileType: 'wand-fireball' },
};
const ENEMY_PROFILES = {
  skeleton: { scale: .46, height: .98, aimHeight: .78, speedMultiplier: 1, attackRate: 1, attackDistance: ENEMY_ATTACK_DISTANCE, opacity: 1, color: '#77756a' },
  wraith: { scale: .54, height: 1.14, aimHeight: .84, speedMultiplier: 1.08, attackRate: 1.1, attackDistance: 2.2, opacity: .82, hover: .07, color: '#ae6fd0' },
  imp: { scale: .39, height: .72, aimHeight: .52, speedMultiplier: 1.28, attackRate: 1.12, attackDistance: 2.12, opacity: 1, color: '#bd6b72' },
  crawler: { scale: .42, height: .44, aimHeight: .28, speedMultiplier: .82, attackRate: .95, attackDistance: 2.08, opacity: 1, color: '#b77754' },
  ghoul: { scale: .5, height: 1.04, aimHeight: .76, speedMultiplier: .92, attackRate: 1.05, attackDistance: 2.26, opacity: 1, color: '#7db8ac' },
  beast: { scale: .55, height: .84, aimHeight: .52, speedMultiplier: .94, attackRate: 1.08, attackDistance: 2.3, opacity: 1, color: '#9b6bd0' },
  moth: { scale: .46, height: 1.04, aimHeight: .8, speedMultiplier: 1.2, attackRate: 1.1, attackDistance: 2.16, opacity: .9, hover: .11, color: '#dfae65' },
  hound: { scale: .5, height: .72, aimHeight: .45, speedMultiplier: 1.4, attackRate: 1.18, attackDistance: 2.24, opacity: 1, color: '#b76b66' },
  leech: { scale: .36, height: .38, aimHeight: .24, speedMultiplier: 1.12, attackRate: 1.02, attackDistance: 2.04, opacity: 1, color: '#7d9bd1' },
  warden: { scale: .62, height: 1.34, aimHeight: 1.03, speedMultiplier: .68, attackRate: .82, attackDistance: 2.48, opacity: 1, color: '#b47469' },
  archon: { scale: 1.08, height: 2.85, aimHeight: 1.92, speedMultiplier: .42, attackRate: .78, attackDistance: 2.7, opacity: 1, color: '#d7c79b' },
};
function enemyProfile(enemy) { return ENEMY_PROFILES[enemy.kind] || ENEMY_PROFILES.skeleton; }

const MAX_RENDER_WIDTH = 960;
const MAX_RENDER_HEIGHT = 540;

const state = {
  room: 0,
  player: { x: roomOffsets[0] + roomContentPoint(0, rooms[0].spawn.x, rooms[0].spawn.y).x, y: roomContentPoint(0, rooms[0].spawn.x, rooms[0].spawn.y).y, angle: rooms[0].spawn.angle, pitch: 0, hp: 100 },
  keys: new Set(),
  recoveredItems: new Set(),
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
  weapon: { type: 'spear', swing: 0, hit: false, cooldown: 0, bobPhase: 0, moving: false, projectile: 0 },
  xp: 0,
  level: 0,
  unlockedSpells: new Set(),
  lastSpell: null,
  spellCast: null,
  spellCooldown: 0,
  activeSpellEffects: [],
  projectiles: [],
  impactBursts: [],
  revealTimer: 0,
  wardTimer: 0,
  enemySlowTimer: 0,
  doorOfLight: null,
  gameComplete: false,
  endingFade: -1,
  finalArenaTime: 0,
  transition: null,
  launchTransition: null,
  finalBoss: createFinalBoss(),
  damageFlash: 0,
  shakeTime: 0,
  reading: null,
  readingElapsed: 0,
  now: 0,
  lastAttackInput: 0,
  hudSignature: '',
  promptTimer: 0,
  promptSignature: '',
  lastRenderAt: 0,
  menuActive: true,
};

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
function hexToRgb(hex) { const themed = MEDIEVAL_COLORS[String(hex).toLowerCase()] || hex; const value = Number.parseInt(themed.replace('#', ''), 16); return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 }; }
function rgba(color, alpha = 1) { return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`; }
function litColor(color, light) { const factor = clamp(.25 + light * .75, .12, 1.18); return { r: clamp(color.r * factor, 0, 255), g: clamp(color.g * factor, 0, 255), b: clamp(color.b * factor, 0, 255) }; }
function currentRoomIndex() { return roomIndexAtX(state.player.x); }
function roomIndexAtX(x) {
  for (let index = 0; index < rooms.length; index += 1) {
    const start = roomOffsets[index];
    if (x >= start && x < start + roomWidths[index]) return index;
    if (index < rooms.length - 1 && x >= start + roomWidths[index] && x < roomOffsets[index + 1]) return x < start + roomWidths[index] + ROOM_GAP / 2 ? index : index + 1;
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
function populateMenuData() { /* Portfolio menu is authored in index.html. */ }

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

const GROUND_CACHE_SCALE = 4;
const GROUND_CACHE_WIDTH = WORLD_WIDTH * GROUND_CACHE_SCALE;
const GROUND_CACHE_HEIGHT = WORLD_HEIGHT * GROUND_CACHE_SCALE;
const groundCache = new Array(GROUND_CACHE_WIDTH * GROUND_CACHE_HEIGHT);

function computeGroundColor(x, y) {
  const room = materialRoomAtX(x);
  const roomSeed = roomIndexAtX(x);
  const n = valueNoise(x * .82, y * .82, roomSeed + 41) * .72 + valueNoise(x * 1.64, y * 1.64, roomSeed + 59) * .28;
  if (room.material === 'wood') {
    const plank = Math.floor(x * .82);
    const warped = y * 9.5 + Math.sin(x * 2.1) * .72 + n * 2.2;
    const grain = .5 + .5 * Math.sin(warped * 1.45 + Math.sin(y * 1.8) * .5);
    const fine = .5 + .5 * Math.sin(warped * 8.4 + x * 3.1);
    const seam = 1 - smoothstep(0, .065, Math.abs(fract(x * .82) - .5));
    const knot = Math.exp(-Math.pow(Math.hypot(fract(x * .32) - .38, fract(y * .24) - .52) / .15, 2));
    return { r: 66 + grain * 48 + fine * 13 - seam * 29 - knot * 21 + (plank % 2) * 3, g: 37 + grain * 29 + fine * 8 - seam * 16 - knot * 12, b: 19 + grain * 16 + fine * 4 - seam * 8 - knot * 7 };
  }
  const localX = fract(x * .92); const localY = fract(y * .92);
  const edge = Math.min(localX, 1 - localX, localY, 1 - localY);
  const grout = 1 - smoothstep(.025, .09, edge);
  const vein = Math.pow(clamp(1 - Math.abs(Math.sin(x * 1.7 + y * .83 + n * 4.8)), 0, 1), 12);
  const crack = Math.pow(clamp(1 - Math.abs(Math.sin(x * 6.3 - y * 4.2 + n * 10)), 0, 1), 24);
  const variation = n * 25 + hash2(Math.floor(x), Math.floor(y), roomSeed + 19) * 10 - grout * 29 - vein * 17 - crack * 22;
  return { r: 62 + variation, g: 64 + variation, b: 59 + variation * .92 };
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
function canStand(x, y) { const radius = .17; return !isWall(x - radius, y - radius) && !isWall(x + radius, y - radius) && !isWall(x - radius, y + radius) && !isWall(x + radius, y + radius); }
function hasLineOfSight(ax, ay, bx, by) { const distance = Math.hypot(bx - ax, by - ay); const steps = Math.ceil(distance / .12); for (let i = 1; i < steps; i += 1) { const t = i / steps; if (isWall(lerp(ax, bx, t), lerp(ay, by, t))) return false; } return true; }
function allHostiles() {
  const hostiles = worldEnemies.filter((enemy) => !enemy.dead);
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
  const ratio = Math.min(window.devicePixelRatio || 1, 1.15);
  const aspect = cssWidth / cssHeight;
  let width = Math.max(320, Math.floor(cssWidth * ratio * .68));
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

function updateHud() {
  const active = worldEnemies.filter((enemy) => enemy.roomIndex === state.room && !enemy.dead).length;
  const bossActive = state.room === FINAL_ROOM_INDEX && state.finalBoss && !state.finalBoss.dead;
  const recovered = worldItems.reduce((count, item) => count + (item.recovered ? 1 : 0), 0);
  const xpSignature = `${state.xp}|${state.level}|${[...state.unlockedSpells].join(',')}`;
  const bossSignature = bossActive ? `${state.finalBoss.hp}|${state.finalBoss.phase}|${state.finalBoss.shield}` : 'none';
  const signature = `${state.room}|${active}|${recovered}|${Math.ceil(state.player.hp)}|${xpSignature}|${bossSignature}|${state.doorOfLight?.active ? 1 : 0}`;
  if (signature === state.hudSignature) return;
  state.hudSignature = signature;
  roomTitle.textContent = rooms[state.room].title;
  roomFloor.textContent = rooms[state.room].floor;
  roomCount.textContent = `${String(state.room + 1).padStart(2, '0')} / ${String(rooms.length).padStart(2, '0')}`;
  evidenceCount.textContent = `${recovered} / ${ITEM_TOTAL} SCROLLS`;
  skeletonCount.textContent = `${active + (bossActive ? 1 : 0)} THREAT${active + (bossActive ? 1 : 0) === 1 ? '' : 'S'}`;
  hpValue.textContent = `${Math.ceil(state.player.hp)} / 100`;
  hpBar.style.width = `${clamp(state.player.hp, 0, 100)}%`;
  if (experienceValue) experienceValue.textContent = `LVL ${state.level} · ${state.xp} XP`;
  if (bossPlaque) bossPlaque.hidden = !bossActive && !state.doorOfLight?.active;
  if (bossActive) {
    if (bossName) bossName.textContent = state.finalBoss.name;
    if (bossHealthBar) bossHealthBar.style.width = `${clamp(state.finalBoss.hp / state.finalBoss.maxHp * 100, 0, 100)}%`;
    if (bossPhase) bossPhase.textContent = `${BOSS_PHASES[state.finalBoss.phase - 1].name}${state.finalBoss.shield > 0 ? ' · SHIELD ACTIVE' : ''}`;
  } else if (state.doorOfLight?.active && bossPhase) {
    if (bossName) bossName.textContent = 'THE WAY IS OPEN';
    if (bossHealthBar) bossHealthBar.style.width = '0%';
    bossPhase.textContent = 'DOOR OF LIGHT · PRESS E TO RETURN';
  }
}
let toastTimeout = 0;
function showToast(text, tone = '') { clearTimeout(toastTimeout); toast.textContent = text; toast.hidden = false; toast.className = `toast visible${tone ? ` ${tone}` : ''}`; toastTimeout = window.setTimeout(() => { toast.classList.remove('visible'); window.setTimeout(() => { toast.hidden = true; }, 220); }, 2500); }
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
  const gain = audio.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, time);
  oscillator.detune.setValueAtTime(detune, time);
  gain.gain.setValueAtTime(.0001, time);
  gain.gain.exponentialRampToValueAtTime(volume, time + .008);
  gain.gain.setValueAtTime(volume * .72, time + Math.min(duration * .28, .055));
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

function playTransitionSound() {
  playTone(55, .72, 'sawtooth', .04);
  playTone(110, .55, 'square', .025, .08);
  playTone(220, .7, 'triangle', .022, .34);
  playTone(440, .8, 'sine', .02, 1.1);
}
function playLaunchSound() {
  playTone(98, .42, 'sine', .018);
  playTone(147, .54, 'triangle', .016, .16);
  playTone(196, .66, 'sine', .014, .34);
}
function beginLaunchTransition() {
  state.launchTransition = { elapsed: 0, duration: 2.15 };
  state.keys.clear();
  state.mouseAttack = false;
  state.mouseLook = false;
  state.promptSignature = 'launch-transition';
  gameShell.classList.add('game-launching');
  playLaunchSound();
}
function updateLaunchTransition(delta) {
  if (!state.launchTransition) return;
  state.launchTransition.elapsed += delta;
  if (state.launchTransition.elapsed >= state.launchTransition.duration) {
    state.launchTransition = null;
    gameShell.classList.remove('game-launching');
  }
}
function drawLaunchTransition(now) {
  const transition = state.launchTransition;
  if (!transition) return;
  const progress = clamp(transition.elapsed / transition.duration, 0, 1);
  const veil = 1 - smoothstep(0, 1, progress);
  const titleFade = 1 - smoothstep(.28, .78, progress);
  const floorFade = smoothstep(.48, .94, progress);
  const width = canvas.width;
  const height = canvas.height;
  ctx.save();
  ctx.fillStyle = `rgba(7, 4, 3, ${.96 * veil + .018})`;
  ctx.fillRect(0, 0, width, height);

  // A restrained parchment line carries the eye from the résumé into the first room.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.globalAlpha = titleFade * .8;
  ctx.fillStyle = '#e4cea0';
  ctx.font = `bold ${Math.max(16, height * .035)}px Georgia`;
  ctx.fillText('LIAM HOSFELD', width / 2, height * .43);
  ctx.globalAlpha = titleFade * .55;
  ctx.fillStyle = '#b9a57e';
  ctx.font = `${Math.max(10, height * .016)}px Georgia`;
  ctx.fillText('RÉSUMÉ  /  INTERACTIVE VIEW', width / 2, height * .51);

  ctx.globalAlpha = floorFade * .52;
  ctx.fillStyle = '#cfad70';
  ctx.font = `${Math.max(10, height * .016)}px Georgia`;
  ctx.fillText('FLOOR 01  ·  THE ENTRANCE HALL', width / 2, height * .57);
  ctx.strokeStyle = '#a7804b';
  ctx.lineWidth = 1;
  ctx.globalAlpha = .12 + floorFade * .2;
  ctx.beginPath();
  ctx.moveTo(width * .32, height * .64);
  ctx.lineTo(width * .68, height * .64);
  ctx.stroke();

  // Very subtle dust replaces the previous bright glitch treatment.
  ctx.fillStyle = '#d39b5d';
  ctx.globalAlpha = .08 + veil * .12;
  for (let index = 0; index < 7; index += 1) {
    const seed = index * 83.7 + Math.floor(now / 170);
    const x = fract(Math.sin(seed) * 43758.5) * width;
    const y = fract(Math.sin(seed * 1.6) * 27183.2) * height;
    ctx.fillRect(x, y, 2 + index % 3, 1);
  }
  ctx.restore();
}
function beginBossTransition() {
  if (state.transition || state.room === FINAL_ROOM_INDEX || state.gameComplete) return;
  state.transition = { elapsed: 0, duration: 5.2, teleported: false };
  state.keys.clear();
  state.mouseAttack = false;
  state.mouseLook = false;
  state.promptSignature = 'transition';
  state.shakeTime = .3;
  playTransitionSound();
  showToast('DELIVERY COMPLETE. RETURNING TO THE PORTFOLIO…', 'good');
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
  setMusicMode('boss');
  updateHud();
  showToast('NO. THE SYSTEM IS NOT DONE. THE OPERATIONS ARCHON AWAKENS.', 'danger');
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
  if (state.transition.elapsed >= state.transition.duration) state.transition = null;
}

function updateRoomFromPlayer() {
  const next = currentRoomIndex();
  if (next === FINAL_ROOM_INDEX && state.room !== FINAL_ROOM_INDEX) {
    beginBossTransition();
    return;
  }
  if (next !== state.room) {
    state.room = next;
    updateHud();
    showToast(`Entered ${rooms[next].title.toLowerCase()}.`, 'good');
    playTone(220, .1, 'triangle', .02);
  }
}

let audioContext = null;
function playTone(frequency, duration, type = 'sine', volume = .035, offset = 0) { try { const audio = ensureAudioContext(); if (!audio) return; const oscillator = audioContext.createOscillator(); const gain = audioContext.createGain(); oscillator.type = type; oscillator.frequency.value = frequency; gain.gain.setValueAtTime(.0001, audio.currentTime + offset); gain.gain.exponentialRampToValueAtTime(volume, audio.currentTime + offset + .01); gain.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + offset + duration); oscillator.connect(gain).connect(audio.destination); oscillator.start(audio.currentTime + offset); oscillator.stop(audio.currentTime + offset + duration + .03); } catch { /* Optional browser audio. */ } }
function playSpearSound() { playTone(82, .14, 'triangle', .026); playTone(164, .18, 'sine', .018, .045); }
function playCrossbowSound() { playTone(72, .08, 'square', .018); playTone(260, .08, 'triangle', .018, .03); }
function playWandSound() { playTone(116, .14, 'sine', .02); playTone(232, .24, 'triangle', .026, .07); playTone(464, .3, 'sine', .016, .16); }
function playWeaponSound() { if (state.weapon.type === 'crossbow') playCrossbowSound(); else if (state.weapon.type === 'wand') playWandSound(); else playSpearSound(); }
function playRecoverySound() { playTone(294, .18, 'sine', .035); playTone(440, .24, 'triangle', .03, .11); playTone(587, .3, 'sine', .022, .21); }
function playHitSound() { playTone(66, .18, 'square', .035); }
function playBoneHitSound() { playTone(110, .12, 'triangle', .025); playTone(72, .13, 'square', .018, .05); }

function getNearestItem(maxDistance = 1.35) { let nearest = null; let best = maxDistance; for (const item of worldItems) { if (item.recovered) continue; const distance = Math.hypot(item.x - state.player.x, item.y - state.player.y); if (distance < best && hasLineOfSight(state.player.x, state.player.y, item.x, item.y)) { best = distance; nearest = item; } } return nearest; }
function weaponDefinition() { return WEAPON_LOADOUTS[state.weapon.type] || WEAPON_LOADOUTS.spear; }
function wandColorForSpell() { return state.lastSpell?.color || '#c76545'; }
function wandSpellName() { return state.lastSpell?.name || 'unattuned ember'; }
function setWeapon(type) {
  if (!WEAPON_LOADOUTS[type]) return;
  state.weapon.type = type;
  state.weapon.swing = 0;
  state.weapon.hit = false;
  state.weapon.cooldown = 0;
  state.weapon.projectile = 0;
  weaponOptionButtons.forEach((button) => {
    const selected = button.dataset.weapon === type;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-checked', String(selected));
  });
  if (loadoutDescription) loadoutDescription.textContent = WEAPON_LOADOUTS[type].description;
  state.promptSignature = '';
}
function resetRun() {
  state.menuActive = true;
  state.room = 0;
  const initialSpawn = roomContentPoint(0, rooms[0].spawn.x, rooms[0].spawn.y);
  state.player.x = roomOffsets[0] + initialSpawn.x;
  state.player.y = initialSpawn.y;
  state.player.angle = rooms[0].spawn.angle;
  state.player.pitch = 0;
  state.player.hp = 100;
  state.recoveredItems.clear();
  for (const item of worldItems) item.recovered = false;
  worldEnemies.splice(0, worldEnemies.length, ...initialEnemyData.map((enemy) => ({ ...enemy })));
  state.xp = 0;
  state.level = 0;
  state.unlockedSpells.clear();
  state.lastSpell = null;
  state.spellCast = null;
  state.spellCooldown = 0;
  state.activeSpellEffects = [];
  state.projectiles = [];
  state.impactBursts = [];
  state.revealTimer = 0;
  state.wardTimer = 0;
  state.enemySlowTimer = 0;
  state.finalBoss = createFinalBoss();
  state.finalArenaTime = 0;
  state.transition = null;
  state.launchTransition = null;
  setMusicMode('dungeon');
  state.doorOfLight = null;
  state.gameComplete = false;
  state.endingFade = -1;
  state.damageFlash = 0;
  state.shakeTime = 0;
  state.hudSignature = '';
  state.promptSignature = '';
  updateHud();
}
function setMenuVisible(visible) {
  if (!visible && state.gameComplete) resetRun();
  state.menuActive = visible;
  if (visible) updateMenuSelection();
  state.keys.clear();
  state.mouseAttack = false;
  state.mouseLook = false;
  if (visible && document.pointerLockElement === canvas) document.exitPointerLock?.();
  state.dragging = false;
  canvas.classList.remove('dragging');
  if (visible) {
    state.launchTransition = null;
    gameShell.classList.remove('game-launching');
    stopMusic();
    if (state.reading) closeReading();
    mainMenu.classList.remove('is-hidden');
    gameShell.classList.add('menu-active');
    interactionPrompt.hidden = true;
    state.promptSignature = 'menu';
    return;
  }
  mainMenu.classList.add('is-hidden');
  gameShell.classList.remove('menu-active');
  beginLaunchTransition();
  state.promptSignature = '';
  state.lastTime = performance.now();
  state.lastRenderAt = 0;
  startMusic();
  showToast(`${weaponDefinition().label} equipped. Enter the dungeon.`, 'good');
}
function updateMenuSelection() {
  const definition = weaponDefinition();
  if (loadoutDescription) loadoutDescription.textContent = definition.description;
}

function currentSpellDefinition() {
  return state.lastSpell || null;
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
  if (scrollSpellDescription) scrollSpellDescription.textContent = unlocked ? `${unlocked.description} Press Q to cast.` : 'Bank XP from scrolls and defeat enemies to unlock spells at each threshold.';
}
function grantScrollXP(item) {
  const unlocked = earnExperience(XP_PER_SCROLL, 'scroll');
  updateSpellCard(XP_PER_SCROLL, unlocked[0] || null);
  if (!unlocked.length) showToast(`+${XP_PER_SCROLL} XP banked. ${state.xp} XP total.`, 'good');
}
function chooseSpellTarget() {
  return findAimTarget(14, .32, .36) || worldEnemies.filter((enemy) => !enemy.dead && enemy.roomIndex === state.room).sort((a, b) => Math.hypot(a.x - state.player.x, a.y - state.player.y) - Math.hypot(b.x - state.player.x, b.y - state.player.y))[0] || (state.room === FINAL_ROOM_INDEX && state.finalBoss && !state.finalBoss.dead ? state.finalBoss : null);
}
function makeProjectile(kind, origin, velocity, options = {}) {
  state.projectiles.push({ kind, x: origin.x, y: origin.y, z: origin.z, vx: velocity.x, vy: velocity.y, vz: velocity.z || 0, spin: Math.random() * TAU, radius: options.radius || .1, damage: options.damage || 0, color: options.color || '#e7ad67', lifetime: options.lifetime || 2.5, maxLifetime: options.lifetime || 2.5, homing: options.homing || 0, targetId: options.targetId || null, source: options.source || 'player', trail: [], origin: { ...origin }, aoe: options.aoe || 0, stun: options.stun || 0, beam: options.beam || false, collisionHeight: options.collisionHeight || .55, chainTargets: options.chainTargets || 0, trailSize: options.trailSize || 1, orbit: options.orbit || 0, sparks: options.sparks || 0 });
}
function playerAimDirection() {
  return { x: Math.cos(state.player.angle) * Math.cos(state.player.pitch), y: Math.sin(state.player.angle) * Math.cos(state.player.pitch), z: Math.sin(state.player.pitch) };
}
function castSpell() {
  const spell = currentSpellDefinition();
  if (state.menuActive || state.reading || state.launchTransition || state.transition || !spell || state.spellCooldown > 0 || state.gameComplete) return;
  state.spellCooldown = spell.cooldown;
  state.spellCast = { spell, elapsed: 0, duration: .72 };
  const direction = playerAimDirection();
  const origin = { x: state.player.x + direction.x * .42, y: state.player.y + direction.y * .42, z: EYE_HEIGHT + direction.z * .18 };
  const target = chooseSpellTarget();
  if (spell.kind === 'reveal') {
    state.revealTimer = 7;
    state.impactBursts.push({ x: state.player.x, y: state.player.y, z: .58, elapsed: 0, duration: 1.2, color: spell.color, radius: 3.4, style: 'radar' });
    state.activeSpellEffects.push({ kind: 'reveal', elapsed: 0, duration: 1.75, color: spell.color, rings: 4 });
  } else if (spell.kind === 'homing') {
    makeProjectile('spell-orb', origin, { x: direction.x * 5.4, y: direction.y * 5.4, z: direction.z * 5.4 }, { color: spell.color, damage: 72, radius: .18, lifetime: 3, homing: 4.2, targetId: target?.id, trailSize: 1.65, orbit: 2, sparks: 5 });
  } else if (spell.kind === 'ward') {
    state.wardTimer = 7;
    state.activeSpellEffects.push({ kind: 'ward', elapsed: 0, duration: 7, color: spell.color, rings: 6 });
  } else if (spell.kind === 'chain') {
    makeProjectile('spell-chain', origin, { x: direction.x * 7.2, y: direction.y * 7.2, z: direction.z * 7.2 }, { color: spell.color, damage: 84, radius: .13, lifetime: 1.8, targetId: target?.id, aoe: 2.4, stun: .9, chainTargets: 3, trailSize: 2.05, orbit: 3, sparks: 7 });
  } else if (spell.kind === 'echo') {
    state.player.hp = clamp(state.player.hp + 35, 0, 100);
    state.enemySlowTimer = 4;
    state.activeSpellEffects.push({ kind: 'echo', elapsed: 0, duration: 1.7, color: spell.color, rings: 5 });
    state.impactBursts.push({ x: state.player.x, y: state.player.y, z: .6, elapsed: 0, duration: 1.1, color: spell.color, radius: 2.2 });
  } else if (spell.kind === 'fireball') {
    makeProjectile('spell-fireball', origin, { x: direction.x * 6.2, y: direction.y * 6.2, z: direction.z * 6.2 }, { color: spell.color, damage: 105, radius: .2, lifetime: 2.5, aoe: 1.65, trailSize: 2.35, orbit: 2, sparks: 9 });
  } else if (spell.kind === 'bloom') {
    state.player.hp = clamp(state.player.hp + 24, 0, 100);
    for (const enemy of allHostiles()) if (Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y) < 3.2) damageHostile(enemy, 64, { stun: 1.1 });
    state.activeSpellEffects.push({ kind: 'bloom', elapsed: 0, duration: 1.8, color: spell.color, rings: 8 });
  } else if (spell.kind === 'beam') {
    const beamEnd = { x: state.player.x + direction.x * 12, y: state.player.y + direction.y * 12, z: EYE_HEIGHT + direction.z * 12 };
    state.activeSpellEffects.push({ kind: 'beam', elapsed: 0, duration: .9, color: spell.color, start: origin, end: beamEnd, rings: 5 });
    for (const enemy of allHostiles()) {
      if (distanceToAimLine(enemy, direction) < .68 && hasLineOfSight(state.player.x, state.player.y, enemy.x, enemy.y)) damageHostile(enemy, 150, { stun: 1.6 });
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
  if (state.spellCast) {
    state.spellCast.elapsed += delta;
    if (state.spellCast.elapsed >= state.spellCast.duration) state.spellCast = null;
  }
  state.activeSpellEffects = state.activeSpellEffects.filter((effect) => { effect.elapsed += delta; return effect.elapsed < effect.duration; });
  state.impactBursts = state.impactBursts.filter((burst) => { burst.elapsed += delta; return burst.elapsed < burst.duration; });
}
function drawSpellCast(now) {
  if (!state.spellCast) return;
  const spell = state.spellCast.spell;
  const progress = clamp(state.spellCast.elapsed / state.spellCast.duration, 0, 1);
  const fade = Math.sin(Math.PI * progress);
  const color = hexToRgb(spell.color);
  ctx.save();
  ctx.globalAlpha = fade * .72;
  ctx.translate(canvas.width * .5, canvas.height * (.5 + Math.sin(now / 260) * .015));
  ctx.rotate(progress * Math.PI * 1.5);
  ctx.strokeStyle = rgba(color, .88);
  ctx.fillStyle = rgba(color, .12);
  ctx.shadowBlur = 18;
  ctx.shadowColor = rgba(color, .8);
  ctx.lineWidth = Math.max(1, canvas.height * .004);
  const radius = canvas.height * (.035 + progress * .13);
  ctx.beginPath(); ctx.arc(0, 0, radius, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, radius * .57, 0, TAU); ctx.fill();
  ctx.font = `bold ${Math.max(16, canvas.height * .085)}px Georgia`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = rgba(color, 1); ctx.fillText(spell.glyph, 0, 0);
  ctx.restore();
}
function playSpellSound() { playTone(220, .16, 'sine', .022); playTone(440, .26, 'triangle', .024, .08); playTone(660, .32, 'sine', .018, .17); }

function actionForItem(item) { if (item.id === 'contact-raven') return '<a href="mailto:liam.hosfeld@gmail.com">SEND A RAVEN ↗</a>'; if (item.id === 'resume-scroll') return '<a href="assets/Liam_Hosfeld_Resume.pdf" download="Liam-Hosfeld-Operations-Analytics-Resume.pdf">TAKE THE RÉSUMÉ ↧</a>'; if (item.id === 'linkedin-key') return '<a href="https://www.linkedin.com/in/liam-hosfeld" target="_blank" rel="noreferrer">TURN THE LINKEDIN KEY ↗</a>'; return ''; }
function openReading(item) {
  state.reading = item;
  state.readingElapsed = 0;
  state.keys.clear();
  state.mouseAttack = false;
  state.weapon.swing = 0;
  state.weapon.projectile = 0;
  grantScrollXP(item);
  const recordIndex = worldItems.findIndex((record) => record.id === item.id) + 1;
  scrollRoomLabel.textContent = `· ${rooms[item.roomIndex].floor}`;
  if (scrollRecordNumber) scrollRecordNumber.textContent = `RECORD ${String(recordIndex).padStart(2, '0')} / ${String(ITEM_TOTAL).padStart(2, '0')}`;
  scrollTitle.textContent = item.title;
  scrollSummary.textContent = item.summary;
  scrollDetails.innerHTML = item.details.map((detail, index) => `<li style="--delay:${.18 + index * .12}s">${detail}</li>`).join('');
  scrollTags.innerHTML = `<span>${item.tag}</span><span>${rooms[item.roomIndex].shortTitle}</span><span>+${XP_PER_SCROLL} XP</span>`;
  scrollActions.innerHTML = actionForItem(item);
  updateScrollProgress();
  readingOverlay.hidden = false;
  readingOverlay.classList.remove('open');
  void readingOverlay.offsetWidth;
  readingOverlay.classList.add('open');
  playRecoverySound();
  showToast('The dungeon waits while you read the record.', 'good');
}
function closeReading() { if (!state.reading) return; state.reading = null; state.readingElapsed = 0; readingOverlay.classList.remove('open'); window.setTimeout(() => { if (!state.reading) readingOverlay.hidden = true; }, 550); }
function interactWithLightDoor() {
  if (!state.doorOfLight?.active) return false;
  const distance = Math.hypot(state.doorOfLight.x - state.player.x, state.doorOfLight.y - state.player.y);
  if (distance > 1.65) return false;
  state.gameComplete = true;
  state.endingFade = 0;
  state.keys.clear();
  state.mouseAttack = false;
  showToast('The light accepts the delivery. Returning to the portfolio.', 'good');
  playTone(330, .28, 'sine', .03); playTone(660, .5, 'triangle', .03, .12);
  return true;
}
function recoverNearby() { if (state.menuActive || state.launchTransition || state.transition) return; if (state.reading) { closeReading(); return; } if (interactWithLightDoor()) return; const item = getNearestItem(); if (!item) { showToast('Move closer to a glowing scroll or the door of light.'); return; } item.recovered = true; state.recoveredItems.add(item.id); openReading(item); updateHud(); }

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
function torchInfluence(x, y) {
  const gridX = clamp(Math.floor(x), 0, WORLD_WIDTH - 1);
  const gridY = clamp(Math.floor(y), 0, WORLD_HEIGHT - 1);
  return lightGrid[gridY * WORLD_WIDTH + gridX];
}
function sampleLight(x, y) { return clamp(.16 + torchInfluence(x, y) * .68 + clamp(1 - Math.hypot(x - state.player.x, y - state.player.y) / 3.8, 0, 1) * .13, .08, 1.35); }
function drawBackground(width, height) {
  const palette = rooms[state.room].palette || ['#090503', '#392719', '#0e0906'];
  const horizon = height / 2 + Math.tan(state.player.pitch) * focalY();
  const ceiling = ctx.createLinearGradient(0, 0, 0, horizon);
  ceiling.addColorStop(0, palette[0]); ceiling.addColorStop(.72, palette[1]); ceiling.addColorStop(1, palette[2]);
  ctx.fillStyle = ceiling; ctx.fillRect(0, 0, width, Math.max(0, horizon));
  const floor = ctx.createLinearGradient(0, horizon, 0, height);
  floor.addColorStop(0, palette[1]); floor.addColorStop(1, palette[0]);
  ctx.fillStyle = floor; ctx.fillRect(0, Math.max(0, horizon), width, height - Math.max(0, horizon));
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
    ctx.fillStyle = `rgba(8, 4, 2, ${darkness})`; ctx.fillRect(x, top, width / RAY_COUNT + 1, base - top);
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

function makeItemSprite(item) { const key = `item:${item.id}`; if (spriteCache.has(key)) return spriteCache.get(key); const sprite = document.createElement('canvas'); sprite.width = 112; sprite.height = 144; const paint = sprite.getContext('2d'); const color = hexToRgb(item.color); paint.translate(56, 68); paint.shadowBlur = 18; paint.shadowColor = rgba(color, .72); paint.fillStyle = rgba(color, .12); paint.beginPath(); paint.arc(0, 0, 35, 0, TAU); paint.fill(); paint.shadowBlur = 0; paint.strokeStyle = rgba(color, .9); paint.lineWidth = 4; if (['scroll', 'ledger', 'chronicle', 'map'].includes(item.kind)) { paint.fillStyle = '#d6b57b'; paint.fillRect(-26, -34, 52, 68); paint.strokeStyle = '#71451f'; paint.strokeRect(-26, -34, 52, 68); paint.fillStyle = '#815124'; paint.fillRect(-17, -18, 34, 3); paint.fillRect(-17, -7, 26, 3); paint.fillRect(-17, 4, 31, 3); } else { paint.fillStyle = '#6a4529'; paint.beginPath(); paint.arc(0, 5, 25, 0, TAU); paint.fill(); paint.stroke(); paint.fillStyle = rgba(color, .9); paint.beginPath(); paint.moveTo(0, 0); paint.quadraticCurveTo(-15, -30, -22, -13); paint.quadraticCurveTo(-7, -15, 0, 0); paint.fill(); paint.beginPath(); paint.moveTo(0, 0); paint.quadraticCurveTo(15, -30, 22, -13); paint.quadraticCurveTo(7, -15, 0, 0); paint.fill(); } paint.fillStyle = '#f0d78d'; paint.font = `bold ${item.icon.length > 3 ? 13 : 22}px Georgia`; paint.textAlign = 'center'; paint.textBaseline = 'middle'; paint.fillText(item.icon, 0, 0); spriteCache.set(key, sprite); return sprite; }
function makeTorchSprite() { const key = 'torch'; if (spriteCache.has(key)) return spriteCache.get(key); const sprite = document.createElement('canvas'); sprite.width = 70; sprite.height = 130; const paint = sprite.getContext('2d'); paint.translate(35, 64); paint.fillStyle = '#4d2b16'; paint.fillRect(-4, 3, 8, 52); paint.fillStyle = '#e9a43e'; paint.shadowBlur = 25; paint.shadowColor = '#d66b22'; paint.beginPath(); paint.moveTo(0, -47); paint.quadraticCurveTo(-20, -17, 0, 5); paint.quadraticCurveTo(20, -17, 0, -47); paint.fill(); paint.shadowBlur = 0; spriteCache.set(key, sprite); return sprite; }
function projectBillboard(x, y, zCenter, worldHeight) { const point = cameraPoint(x, y, zCenter); if (point.forward <= .04) return null; const bottom = projectY(zCenter - worldHeight / 2, point.forward); const top = projectY(zCenter + worldHeight / 2, point.forward); return { x: canvas.width / 2 + point.side * focalX() / point.forward, top, bottom, height: bottom - top, depth: point.forward }; }
function drawBillboard(sprite, projection, opacity = 1) { if (!projection || projection.height <= 0) return; const destWidth = projection.height * sprite.width / sprite.height; const startX = Math.floor(projection.x - destWidth / 2); const endX = Math.ceil(projection.x + destWidth / 2); ctx.save(); ctx.globalAlpha = opacity; ctx.imageSmoothingEnabled = false; for (let screenX = startX; screenX <= endX; screenX += 1) { if (screenX < 0 || screenX >= canvas.width) continue; const ray = clamp(Math.floor(screenX / canvas.width * RAY_COUNT), 0, RAY_COUNT - 1); if (projection.depth > state.zBuffer[ray] + .04) continue; const sourceX = clamp(Math.floor((screenX - startX) / Math.max(1, destWidth) * sprite.width), 0, sprite.width - 1); ctx.drawImage(sprite, sourceX, 0, 1, sprite.height, screenX, projection.top, 1, projection.height); } ctx.restore(); }

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
    ctx.save(); traceFace(face); ctx.clip(); ctx.fillStyle = pattern; ctx.fillRect(minX, minY, Math.max(1, maxX - minX), Math.max(1, maxY - minY));
    if (face.shade < 1) { ctx.fillStyle = `rgba(18, 10, 5, ${clamp(1 - face.shade, 0, .75)})`; ctx.fillRect(minX, minY, Math.max(1, maxX - minX), Math.max(1, maxY - minY)); }
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
function skeletonFacesClassic(enemy) {
  const faces = []; const yaw = Math.atan2(state.player.y - enemy.y, state.player.x - enemy.x); const walk = enemy.alerted ? Math.sin(enemy.walkPhase) * .12 : 0; const attack = enemy.attackTime > 0 ? easeOutCubic(1 - enemy.attackTime / .55) : 0; const fall = enemy.dead ? clamp(enemy.deathTime / .75, 0, 1) : 0; const roomMaterial = materialRoomAtX(enemy.x).material === 'wood' ? 'wood' : 'stone'; const bone = roomMaterial === 'wood' ? '#765036' : '#666761'; const darkBone = roomMaterial === 'wood' ? '#4f3527' : '#484a48'; const iron = '#3e3731'; const socket = '#171411'; const red = '#9e3b2f';
  const bodyScale = .46;
  const shift = (point) => ({ side: point.side * bodyScale, forward: point.forward * bodyScale + fall * .18, z: point.z * bodyScale * (1 - fall) + .08 });
  const box = (center, dimensions, color, shade = 1, material = color === iron ? 'steel' : (color === bone || color === darkBone ? roomMaterial : null)) => addBoxLocal(faces, { x: enemy.x, y: enemy.y }, shift(center), dimensions.map((value) => value * bodyScale), yaw, color, shade, material);
  const bonePart = (start, end, radius, color = bone, material = roomMaterial) => addBoneLocal(faces, { x: enemy.x, y: enemy.y }, shift(start), shift(end), radius * bodyScale, yaw, color, material);
  box({ side: 0, forward: 0, z: 1.64 }, [.46, .38, .38], bone); box({ side: 0, forward: .04, z: 1.43 }, [.34, .3, .13], bone, .9); box({ side: 0, forward: 0, z: 1.1 }, [.48, .3, .62], iron, .75); box({ side: 0, forward: .02, z: .72 }, [.46, .34, .18], darkBone);
  box({ side: -.1, forward: .2, z: 1.68 }, [.08, .05, .08], socket, .8); box({ side: .1, forward: .2, z: 1.68 }, [.08, .05, .08], socket, .8); box({ side: -.1, forward: .23, z: 1.68 }, [.025, .02, .025], red); box({ side: .1, forward: .23, z: 1.68 }, [.025, .02, .025], red);
  for (let index = 0; index < 4; index += 1) bonePart({ side: -.19, forward: .17, z: 1.28 - index * .12 }, { side: .19, forward: .17, z: 1.28 - index * .12 }, .026, bone);
  bonePart({ side: -.13, forward: 0, z: .65 }, { side: -.17 - walk, forward: -.02 + walk, z: .33 }, .065, bone); bonePart({ side: -.17 - walk, forward: -.02 + walk, z: .33 }, { side: -.2 + walk, forward: .08 - walk, z: .08 }, .055, bone);
  bonePart({ side: .13, forward: 0, z: .65 }, { side: .17 + walk, forward: -.02 - walk, z: .33 }, .065, bone); bonePart({ side: .17 + walk, forward: -.02 - walk, z: .33 }, { side: .2 - walk, forward: .08 + walk, z: .08 }, .055, bone);
  const leftHand = { side: -.33, forward: .08 - walk, z: .72 }; const rightHand = attack > .1 ? { side: .37, forward: .5 + attack * .22, z: 1.25 + attack * .16 } : { side: .33, forward: .08 + walk, z: .72 };
  bonePart({ side: -.23, forward: 0, z: 1.3 }, { side: -.38, forward: -.01 - walk, z: 1.02 }, .055, bone); bonePart({ side: -.38, forward: -.01 - walk, z: 1.02 }, leftHand, .05, bone); bonePart({ side: .23, forward: 0, z: 1.3 }, { side: .38, forward: .01 + walk, z: 1.02 + attack * .2 }, .055, bone); bonePart({ side: .38, forward: .01 + walk, z: 1.02 + attack * .2 }, rightHand, .05, bone);
  if (attack > .25) bonePart({ side: .37, forward: .53, z: 1.2 }, { side: .37, forward: .53, z: 1.95 }, .025, darkBone);
  return faces;
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

function enemyFaces(enemy) {
  switch (enemy.kind) {
    case 'wraith': return wraithFaces(enemy);
    case 'imp': return impFaces(enemy);
    case 'crawler': return crawlerFaces(enemy);
    case 'leech': return leechFaces(enemy);
    case 'ghoul': return ghoulFaces(enemy);
    case 'beast':
    case 'hound': return quadrupedFaces(enemy);
    case 'moth': return mothFaces(enemy);
    case 'warden': return wardenFaces(enemy);
    case 'archon': return archonFaces(enemy);
    default: return skeletonFacesClassic(enemy);
  }
}

function drawEnemy3D(enemy) {
  const profile = enemyProfile(enemy);
  const camera = cameraPoint(enemy.x, enemy.y, profile.aimHeight);
  const isArchon = Boolean(enemy.boss);
  if (camera.forward <= .1 || (!isArchon && Math.abs(Math.atan2(camera.side, camera.forward)) > FOV * .72)) return;
  if (!isArchon && camera.forward > MAX_DEPTH + 3) return;
  const aliveOpacity = enemy.dead ? clamp(1 - enemy.deathTime / .75, 0, 1) : 1;
  if (isArchon && !enemy.dead && camera.forward > 22) {
    const distant = projectBillboard(enemy.x, enemy.y, profile.height / 2, profile.height);
    if (distant) {
      ctx.save();
      ctx.globalAlpha = .2 + Math.min(.22, (camera.forward - 22) / 100);
      ctx.strokeStyle = enemy.phase === 3 ? '#e9e9e0' : enemy.phase === 2 ? '#77a9e8' : '#d99762';
      ctx.shadowBlur = 26;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.lineWidth = Math.max(2, distant.height * .025);
      ctx.beginPath();
      ctx.ellipse(distant.x, (distant.top + distant.bottom) / 2, Math.max(12, distant.height * .32), Math.max(16, distant.height * .52), 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }
  renderFaces(enemyFaces(enemy), aliveOpacity * profile.opacity);
  const projection = projectBillboard(enemy.x, enemy.y, profile.height / 2, profile.height);
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
function drawWorldObjects(now) {
  const objects = [];
  worldTorches.forEach((torch) => { if (objectInView(torch.x, torch.y)) objects.push({ type: 'torch', ...torch, distance: Math.hypot(torch.x - state.player.x, torch.y - state.player.y) }); });
  worldItems.forEach((item) => { if (!item.recovered && objectInView(item.x, item.y)) objects.push({ type: 'item', ...item, distance: Math.hypot(item.x - state.player.x, item.y - state.player.y) }); });
  worldEnemies.forEach((enemy) => { if ((!enemy.dead || enemy.deathTime < .75) && objectInView(enemy.x, enemy.y)) objects.push({ type: 'enemy', ...enemy, distance: Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y) }); });
  if (state.room === FINAL_ROOM_INDEX && state.finalBoss && (!state.finalBoss.dead || state.finalBoss.deathTime < 2.4)) {
    // Once the player enters the sanctum, keep the Archon in the render queue at arena scale.
    // drawEnemy3D still applies depth/FOV projection and wall occlusion, so this avoids a
    // premature disappearance without drawing the boss through the room geometry.
    const bossDistance = Math.hypot(state.finalBoss.x - state.player.x, state.finalBoss.y - state.player.y);
    if (objectInView(state.finalBoss.x, state.finalBoss.y, BOSS_RENDER_DEPTH) || state.finalArenaTime > 0) objects.push({ type: 'enemy', ...state.finalBoss, distance: bossDistance });
  }
  objects.sort((a, b) => b.distance - a.distance);
  for (const object of objects) {
    if (object.type === 'torch') drawBillboard(makeTorchSprite(), projectBillboard(object.x, object.y, .56, .56), .9);
    else if (object.type === 'item') {
      drawBillboard(makeItemSprite(object), projectBillboard(object.x, object.y, .48, .38), .9);
      if (state.revealTimer > 0) {
        const projection = projectBillboard(object.x, object.y, .48, .55);
        if (projection) { ctx.save(); ctx.globalAlpha = .55 + Math.sin(now / 120) * .15; ctx.strokeStyle = '#6ce0c2'; ctx.shadowBlur = 16; ctx.shadowColor = '#6ce0c2'; ctx.beginPath(); ctx.arc(projection.x, (projection.top + projection.bottom) / 2, Math.max(8, projection.height * .5), 0, TAU); ctx.stroke(); ctx.restore(); }
      }
    } else drawEnemy3D(object);
  }
}
function drawWorldProjectiles(now) {
  for (const projectile of state.projectiles) {
    const camera = cameraPoint(projectile.x, projectile.y, projectile.z);
    if (camera.forward <= .04 || Math.abs(Math.atan2(camera.side, camera.forward)) > FOV * .9) continue;
    const color = projectile.color;
    const yaw = Math.atan2(projectile.vy, projectile.vx);
    const faces = [];
    const size = projectile.kind === 'arrow' ? .1 : projectile.kind === 'boss-bolt' ? .2 : .18;
    if (projectile.kind === 'arrow') {
      addBoxLocal(faces, projectile, { side: 0, forward: 0, z: projectile.z }, [.045, .72, .045], yaw, '#d5b66e', 1, 'steel');
      addBoxLocal(faces, projectile, { side: 0, forward: .42, z: projectile.z }, [.16, .18, .16], color, 1.12, 'steel');
      addBoxLocal(faces, projectile, { side: 0, forward: -.27, z: projectile.z }, [.18, .1, .025], '#efe0a9', .95, 'steel');
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
    renderFaces(faces, clamp(.3 + projectile.lifetime / projectile.maxLifetime, .38, 1));
    const projectilePoint = projectCameraPoint(cameraPoint(projectile.x, projectile.y, projectile.z));
    if (projectilePoint && projectile.kind !== 'arrow') {
      const pulse = .72 + Math.sin(now / 85 + projectile.x * 2.1) * .22;
      ctx.save();
      ctx.globalAlpha = .42 * pulse;
      ctx.strokeStyle = color;
      ctx.shadowBlur = 16;
      ctx.shadowColor = color;
      ctx.lineWidth = Math.max(1, canvas.height * .0045 * projectile.trailSize);
      ctx.beginPath();
      ctx.arc(projectilePoint.x, projectilePoint.y, Math.max(3, canvas.height * .012 * projectile.trailSize), 0, TAU);
      ctx.stroke();
      if (projectile.kind === 'spell-chain') {
        ctx.translate(projectilePoint.x, projectilePoint.y);
        ctx.rotate(now / 260);
        ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.moveTo(0, -8); ctx.lineTo(0, 8); ctx.stroke();
        ctx.rotate(Math.PI / 4);
        ctx.globalAlpha = .55 * pulse;
        ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(11, 0); ctx.stroke();
      }
      if (projectile.orbit) {
        ctx.translate(projectilePoint.x, projectilePoint.y);
        for (let orbit = 0; orbit < projectile.orbit; orbit += 1) {
          const angle = now / (180 + orbit * 55) + projectile.spin + orbit * TAU / projectile.orbit;
          const radius = Math.max(7, canvas.height * .018 * projectile.trailSize);
          ctx.globalAlpha = .72 * pulse;
          ctx.fillStyle = orbit % 2 ? '#fff3b0' : color;
          ctx.beginPath(); ctx.arc(Math.cos(angle) * radius, Math.sin(angle) * radius, Math.max(1.5, canvas.height * .004), 0, TAU); ctx.fill();
        }
      }
      ctx.restore();
    }
    const trail = projectile.trail || [];
    if (trail.length > 1) {
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
function drawDoorOfLight(now) {
  const door = state.doorOfLight;
  if (!door?.active || state.room !== FINAL_ROOM_INDEX) return;
  const yaw = Math.atan2(state.player.y - door.y, state.player.x - door.x);
  const pulse = .9 + Math.sin(now / 220) * .1;
  const faces = [];
  const origin = { x: door.x, y: door.y };
  addBoxLocal(faces, origin, { side: -.72, forward: 0, z: .9 }, [.2, .34, 1.8], yaw, '#d9bd70', 1, 'steel');
  addBoxLocal(faces, origin, { side: .72, forward: 0, z: .9 }, [.2, .34, 1.8], yaw, '#d9bd70', .9, 'steel');
  addBoxLocal(faces, origin, { side: 0, forward: 0, z: 1.78 }, [1.62, .34, .2], yaw, '#f4df9c', 1.08, 'steel');
  addBoxLocal(faces, origin, { side: 0, forward: .02, z: .91 }, [1.2 * pulse, .06, 1.56 * pulse], yaw, '#fff8db', 1.22, 'steel');
  addBoxLocal(faces, origin, { side: 0, forward: .08, z: .91 }, [.72, .08, 1.18], yaw, '#b8f0e2', .95, 'steel');
  renderFaces(faces, .95);
  const projection = projectBillboard(door.x, door.y, .9, 2.05);
  if (projection) {
    ctx.save(); ctx.globalAlpha = .26 + Math.sin(now / 170) * .08; ctx.strokeStyle = '#fff8d6'; ctx.shadowBlur = 28; ctx.shadowColor = '#baf4dc'; ctx.lineWidth = Math.max(2, projection.height * .035); ctx.beginPath(); ctx.ellipse(projection.x, (projection.top + projection.bottom) / 2, projection.height * .29, projection.height * .49, 0, 0, TAU); ctx.stroke(); ctx.restore();
  }
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

function weaponMotion() {
  const definition = weaponDefinition();
  const active = state.weapon.swing > 0;
  const t = active ? 1 - state.weapon.swing / definition.duration : 0;
  return { active, t, definition };
}

function drawSpear(now) {
  const { active, t } = weaponMotion();
  const moving = state.weapon.moving;
  const bob = moving ? Math.sin(state.weapon.bobPhase) * .025 : Math.sin(now / 700) * .007;
  let thrust = 0;
  let sideOffset = 0;
  let lift = 0;
  let roll = .08;

  if (active && t < .22) {
    const windup = easeOutCubic(t / .22);
    thrust = -.38 * windup;
    sideOffset = .13 * windup;
    lift = .04 * windup;
    roll = .08 - .34 * windup;
  } else if (active && t < .62) {
    const drive = smoothstep(0, 1, (t - .22) / .4);
    thrust = -.38 + 1.42 * drive;
    sideOffset = .13 - .27 * drive;
    lift = .04 - .035 * drive;
    roll = -.26 + .34 * drive;
  } else if (active) {
    const recovery = easeOutCubic((t - .62) / .38);
    thrust = 1.04 - 1.04 * recovery;
    sideOffset = -.14 + .14 * recovery;
    lift = .005 - .005 * recovery;
    roll = .08 + .08 * recovery;
  }

  const faces = [];
  const scale = .8;
  const origin = { side: .37 + sideOffset, forward: 1.42 + thrust, z: -.08 + bob + lift };
  const steel = '#b9b7a0';
  const brightSteel = '#eee3bd';
  const darkSteel = '#70736f';

  // Ash shaft and capped butt.
  addWeaponBox(faces, origin, { side: 0, forward: 0, z: .72 * scale }, [.078 * scale, .078 * scale, 1.55 * scale], roll, '#704622', .98, 'wood');
  addWeaponBox(faces, origin, { side: 0, forward: -.015, z: .045 * scale }, [.14 * scale, .13 * scale, .12 * scale], roll, darkSteel, .92, 'steel');

  // Four raised leather wraps make the grip read clearly during the animation.
  for (let wrap = 0; wrap < 4; wrap += 1) {
    addWeaponBox(faces, origin, { side: 0, forward: .035, z: (.16 + wrap * .095) * scale }, [.13 * scale, .12 * scale, .045 * scale], roll, '#4d2d1b', .9, 'leather');
  }

  // Guard, socket, and a layered leaf head give the spear a readable low-poly profile.
  addWeaponBox(faces, origin, { side: 0, forward: .045, z: 1.31 * scale }, [.38 * scale, .14 * scale, .09 * scale], roll, steel, .96, 'steel');
  addWeaponBox(faces, origin, { side: 0, forward: .07, z: 1.42 * scale }, [.18 * scale, .15 * scale, .17 * scale], roll, darkSteel, .9, 'steel');
  addWeaponBox(faces, origin, { side: 0, forward: .1, z: 1.56 * scale }, [.24 * scale, .13 * scale, .2 * scale], roll, steel, 1.02, 'steel');
  addWeaponBox(faces, origin, { side: 0, forward: .13, z: 1.73 * scale }, [.18 * scale, .12 * scale, .28 * scale], roll, brightSteel, 1.08, 'steel');
  addWeaponBox(faces, origin, { side: -.075, forward: .125, z: 1.72 * scale }, [.06 * scale, .115 * scale, .18 * scale], roll, brightSteel, 1.1, 'steel');
  addWeaponBox(faces, origin, { side: .075, forward: .125, z: 1.72 * scale }, [.06 * scale, .115 * scale, .18 * scale], roll, darkSteel, .86, 'steel');
  addWeaponBox(faces, origin, { side: 0, forward: .15, z: 1.94 * scale }, [.065 * scale, .095 * scale, .22 * scale], roll, brightSteel, 1.12, 'steel');
  renderFaces(faces, 1, true);

  // A short impact glint gives the thrust a readable endpoint without turning it into a beam.
  if (active && t > .38 && t < .78) {
    const tip = projectCameraPoint({ side: origin.side, forward: origin.forward + .15, z: origin.z + 2.06 * scale });
    if (tip) {
      const impact = Math.sin((t - .38) / .4 * Math.PI);
      ctx.save();
      ctx.globalAlpha = impact * .72;
      ctx.strokeStyle = brightSteel;
      ctx.shadowBlur = 16;
      ctx.shadowColor = '#d59643';
      ctx.lineWidth = Math.max(1, canvas.height * .0035);
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, Math.max(3, canvas.height * .009 * impact), 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }
}
function drawWand(now) {
  const { active, t } = weaponMotion();
  const color = wandColorForSpell();
  const moving = state.weapon.moving;
  const bob = moving ? Math.sin(state.weapon.bobPhase) * .02 : Math.sin(now / 620) * .008;
  const cast = active ? Math.sin(clamp(t / .82, 0, 1) * Math.PI) : 0;
  const lift = active ? easeOutCubic(clamp(t / .48, 0, 1)) * .16 : 0;
  const sideOffset = active ? -cast * .06 : 0;
  const roll = -.14 + cast * .1;
  const faces = [];
  const origin = { side: .42 + sideOffset, forward: 1.23 - cast * .08, z: -.02 + bob + lift };
  addWeaponBox(faces, origin, { side: 0, forward: .02, z: .64 }, [.1, .1, 1.42], roll, '#593a24', .98, 'wood');
  addWeaponBox(faces, origin, { side: 0, forward: .03, z: .1 }, [.17, .14, .2], roll, '#362217', .9, 'leather');
  addWeaponBox(faces, origin, { side: 0, forward: .04, z: 1.16 }, [.14, .13, .12], roll, '#9c7543', .92, 'wood');
  addWeaponBox(faces, origin, { side: 0, forward: .08, z: 1.39 }, [.28, .2, .3], roll, color, 1.12, 'steel');
  addWeaponBox(faces, origin, { side: 0, forward: .15, z: 1.41 }, [.12, .08, .17], roll, '#fff0b2', 1.18, 'steel');
  addWeaponBox(faces, origin, { side: -.18, forward: .06, z: 1.18 }, [.045, .045, .26], roll, color, 1.05, 'steel');
  addWeaponBox(faces, origin, { side: .18, forward: .06, z: 1.18 }, [.045, .045, .26], roll, color, .86, 'steel');
  renderFaces(faces, 1, true);
  const tip = projectCameraPoint({ side: origin.side, forward: origin.forward + .18, z: origin.z + 1.42 });
  if (tip) {
    ctx.save();
    ctx.globalAlpha = .22 + cast * .45 + Math.sin(now / 130) * .05;
    ctx.strokeStyle = color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = color;
    ctx.lineWidth = Math.max(1, canvas.height * .004);
    ctx.beginPath(); ctx.arc(tip.x, tip.y, Math.max(5, canvas.height * (.014 + cast * .012)), 0, TAU); ctx.stroke();
    ctx.globalAlpha *= .8;
    ctx.fillStyle = '#fff0b2';
    ctx.beginPath(); ctx.arc(tip.x, tip.y, Math.max(2, canvas.height * .009), 0, TAU); ctx.fill();
    ctx.restore();
  }
}

function spawnCrossbowArrow() {
  const direction = playerAimDirection();
  makeProjectile('arrow', { x: state.player.x + direction.x * .52, y: state.player.y + direction.y * .52, z: EYE_HEIGHT + direction.z * .06 }, { x: direction.x * 12, y: direction.y * 12, z: direction.z * 12 }, { color: '#f0d38d', damage: WEAPON_LOADOUTS.crossbow.damage, radius: .12, lifetime: 1.7, collisionHeight: .72 });
}
function spawnWandFireball() {
  const direction = playerAimDirection();
  const color = wandColorForSpell();
  const spellBonus = state.lastSpell?.kind === 'fireball' ? 5 : 0;
  makeProjectile('wand-fireball', { x: state.player.x + direction.x * .58, y: state.player.y + direction.y * .58, z: EYE_HEIGHT + direction.z * .1 }, { x: direction.x * 7.1, y: direction.y * 7.1, z: direction.z * 7.1 }, { color, damage: WEAPON_LOADOUTS.wand.damage + spellBonus, radius: .23, lifetime: 2.8, aoe: 1.55, trailSize: 2.8, orbit: 3, sparks: 12, collisionHeight: .88 });
  showToast(`${weaponDefinition().label} cast ${wandSpellName()} fire.`, 'good');
  state.impactBursts.push({ x: state.player.x + direction.x * .42, y: state.player.y + direction.y * .42, z: EYE_HEIGHT, elapsed: 0, duration: .28, color, radius: .32 });
}
function drawCrossbowArrow() { /* Arrows are rendered from state.projectiles in world space. */ }

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
  const origin = { side: .39 + sideOffset, forward: 1.36 - recoil, z: -.01 + bob };
  addWeaponBox(faces, origin, { side: 0, forward: .2, z: .28 * scale }, [.2 * scale, .66 * scale, .18 * scale], roll, '#704622', .94, 'wood');
  addWeaponBox(faces, origin, { side: 0, forward: .02, z: .43 * scale }, [.62 * scale, .11 * scale, .14 * scale], roll, '#6d7170', 1, 'steel');
  addWeaponBox(faces, origin, { side: -.32 * scale, forward: .02, z: .43 * scale }, [.17 * scale, .11 * scale, .23 * scale], roll, '#b9b7a0', .92, 'steel');
  addWeaponBox(faces, origin, { side: .32 * scale, forward: .02, z: .43 * scale }, [.17 * scale, .11 * scale, .23 * scale], roll, '#b9b7a0', .92, 'steel');
  addWeaponBox(faces, origin, { side: 0, forward: -.03, z: .51 * scale }, [.055 * scale, .055 * scale, .12 * scale], roll, '#c5ae73', 1, 'steel');
  // Bowstring flexes during the draw/release cycle; it is not an attack beam.
  addWeaponBox(faces, origin, { side: 0, forward: .38 * scale - draw * .08, z: .44 * scale }, [.035 * scale, .42 * scale, .035 * scale], roll, '#e7d49d', 1, 'steel');
  renderFaces(faces, 1, true);
  drawCrossbowArrow();
}

function drawWeapon(now) {
  if (state.weapon.type === 'crossbow') { drawCrossbow(now); return; }
  if (state.weapon.type === 'wand') { drawWand(now); return; }
  drawSpear(now);
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
    const fade = Math.sin(Math.PI * clamp(progress, 0, 1));
    const color = effect.color || '#e7ad67';
    if (effect.kind === 'beam' && effect.start && effect.end) {
      const start = projectCameraPoint(cameraPoint(effect.start.x, effect.start.y, effect.start.z));
      const end = projectCameraPoint(cameraPoint(effect.end.x, effect.end.y, effect.end.z));
      if (!start || !end) continue;
      ctx.save();
      ctx.globalAlpha = .88 * (1 - progress);
      ctx.lineCap = 'round';
      for (let beam = 0; beam < 3; beam += 1) {
        ctx.strokeStyle = beam === 0 ? '#fff8d0' : color;
        ctx.shadowBlur = 24 - beam * 5;
        ctx.shadowColor = color;
        ctx.lineWidth = Math.max(2, canvas.height * (.028 - beam * .007) * (1 - progress * .35));
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x + Math.sin(now / 33 + beam) * 7, end.y + Math.cos(now / 29 + beam) * 7);
        ctx.stroke();
      }
      for (let ring = 0; ring < 5; ring += 1) {
        const t = (ring / 5 + progress * 1.4) % 1;
        const x = lerp(start.x, end.x, t);
        const y = lerp(start.y, end.y, t);
        ctx.globalAlpha = .75 * (1 - progress);
        ctx.strokeStyle = '#fff3b0';
        ctx.beginPath(); ctx.arc(x, y, Math.max(2, canvas.height * .008 * (1 - t * .45)), 0, TAU); ctx.stroke();
      }
      ctx.restore();
      continue;
    }
    if (effect.kind === 'chain' && effect.segments) {
      ctx.save();
      ctx.globalAlpha = .92 * (1 - progress);
      ctx.strokeStyle = color;
      ctx.shadowBlur = 20;
      ctx.shadowColor = color;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(2, canvas.height * .014 * (1 - progress * .5));
      for (const segment of effect.segments) {
        const start = projectCameraPoint(cameraPoint(segment.start.x, segment.start.y, segment.start.z));
        const end = projectCameraPoint(cameraPoint(segment.end.x, segment.end.y, segment.end.z));
        if (!start || !end) continue;
        ctx.beginPath();
        const bend = Math.sin(now / 30 + segment.start.x * 2) * 12;
        ctx.moveTo(start.x, start.y);
        ctx.lineTo((start.x + end.x) / 2 + bend, (start.y + end.y) / 2 - bend * .55);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        ctx.strokeStyle = '#f4f7d1';
        ctx.lineWidth = Math.max(1, canvas.height * .004);
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(end.x, end.y, Math.max(3, canvas.height * .014 * (1 - progress)), 0, TAU); ctx.fill();
      }
      ctx.restore();
      continue;
    }
    const centerWorld = { x: state.player.x, y: state.player.y, z: .58 };
    const rings = effect.rings || 3;
    ctx.save();
    if (effect.kind === 'reveal') {
      const sweep = progress * 8.5;
      drawSpellWorldRing(centerWorld, Math.max(.2, sweep), color, .85 * (1 - progress * .35), 24, .58, now / 500, Math.max(1, canvas.height * .007));
      for (let ring = 0; ring < rings; ring += 1) drawSpellWorldRing(centerWorld, .65 + ring * .62 + progress * 1.4, color, .42 * fade, 8, .42 + ring * .08, -now / 700 + ring, Math.max(1, canvas.height * .003));
      ctx.restore();
      continue;
    }
    if (effect.kind === 'ward') {
      for (let ring = 0; ring < rings; ring += 1) {
        const radius = 1.02 + ring * .12;
        drawSpellWorldRing(centerWorld, radius, color, .34 + Math.sin(now / 160 + ring) * .11, 6, .38 + ring * .08, now / (720 + ring * 40) + ring * .5, Math.max(1, canvas.height * .004));
      }
      for (let sigil = 0; sigil < 6; sigil += 1) {
        const angle = now / 800 + sigil * TAU / 6;
        const point = projectCameraPoint(cameraPoint(state.player.x + Math.cos(angle) * 1.2, state.player.y + Math.sin(angle) * 1.2, .85 + Math.sin(angle * 2) * .2));
        if (!point) continue;
        ctx.globalAlpha = .75; ctx.fillStyle = color; ctx.shadowBlur = 14; ctx.shadowColor = color;
        ctx.font = `bold ${Math.max(12, canvas.height * .035)}px Georgia`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✦', point.x, point.y);
      }
      ctx.restore();
      continue;
    }
    let radius = effect.kind === 'echo' ? 2.3 * progress : effect.kind === 'bloom' ? 3.1 * progress : 1.3;
    if (effect.kind === 'echo') {
      for (let ring = 0; ring < rings; ring += 1) drawSpellWorldRing(centerWorld, radius * (ring + 1) / rings, color, .75 * fade * (1 - ring / rings), 20, .4 + ring * .1, now / 800 + ring, Math.max(1, canvas.height * .005));
      for (let ghost = 0; ghost < 4; ghost += 1) drawSpellWorldRing(centerWorld, .9 + ghost * .42, '#e9d9ff', .3 * fade, 6, .62 + ghost * .1, -now / 600 + ghost, 1);
    } else if (effect.kind === 'bloom') {
      for (let petal = 0; petal < 8; petal += 1) {
        const angle = petal * TAU / 8 + now / 900;
        const point = projectCameraPoint(cameraPoint(state.player.x + Math.cos(angle) * radius, state.player.y + Math.sin(angle) * radius, .45 + Math.sin(angle * 3) * .22));
        if (!point) continue;
        ctx.globalAlpha = .8 * fade; ctx.fillStyle = color; ctx.shadowBlur = 15; ctx.shadowColor = color;
        ctx.beginPath(); ctx.ellipse(point.x, point.y, Math.max(3, canvas.height * .018), Math.max(7, canvas.height * .038), angle, 0, TAU); ctx.fill();
      }
      drawSpellWorldRing(centerWorld, radius, color, .74 * fade, 16, .35, now / 500, Math.max(1, canvas.height * .006));
      drawSpellWorldRing(centerWorld, radius * .56, '#eaffd0', .64 * fade, 12, .65, -now / 390, Math.max(1, canvas.height * .004));
    }
    ctx.restore();
  }
}

function drawBossTransition(now) {
  const transition = state.transition;
  if (!transition) return;
  const elapsed = transition.elapsed;
  const total = transition.duration;
  const width = canvas.width;
  const height = canvas.height;
  const fakeEnding = elapsed < 2.1;
  const flash = clamp(1 - Math.abs(elapsed - 2.45) / .42, 0, 1);
  const reveal = clamp((elapsed - 2.45) / 2.35, 0, 1);
  ctx.save();
  ctx.fillStyle = `rgba(3, 2, 5, ${fakeEnding ? .86 : .38 * (1 - reveal)})`;
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = .12 + (fakeEnding ? .16 : .08);
  ctx.fillStyle = '#e8d29a';
  for (let y = 0; y < height; y += 6) ctx.fillRect(0, y, width, 1);
  if (fakeEnding) {
    const pulse = .72 + Math.sin(now / 170) * .16;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#f0ddaf';
    ctx.shadowBlur = 22;
    ctx.shadowColor = '#d7b16c';
    ctx.font = `bold ${Math.max(19, height * .045)}px Georgia`;
    ctx.fillText('DELIVERY COMPLETE', width / 2, height * .43);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#b9d9c5';
    ctx.font = `${Math.max(10, height * .018)}px Georgia`;
    ctx.fillText('RETURNING TO THE PORTFOLIO…', width / 2, height * .53);
    ctx.globalAlpha = .36;
    ctx.strokeStyle = '#b98542';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(width * .25, height * .61); ctx.lineTo(width * .75, height * .61); ctx.stroke();
  } else {
    ctx.globalAlpha = .28 + reveal * .7;
    ctx.fillStyle = flash > 0 ? '#fff8dc' : '#071719';
    ctx.fillRect(0, 0, width, height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = .45 + reveal * .55;
    ctx.fillStyle = '#d8fff1';
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#6ce0c2';
    ctx.font = `bold ${Math.max(18, height * .04)}px Georgia`;
    ctx.fillText('NO. THE SYSTEM IS NOT DONE.', width / 2, height * .42);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#9ad5c4';
    ctx.font = `${Math.max(10, height * .018)}px Georgia`;
    ctx.fillText('THE OPERATIONS ARCHON // FLOOR 07', width / 2, height * .53);
  }
  // Low-bit glitch shards make the false ending break apart before the arena reveal.
  const shardCount = fakeEnding ? 18 : 8;
  ctx.globalAlpha = .2 + flash * .65;
  for (let index = 0; index < shardCount; index += 1) {
    const seed = index * 97.17 + Math.floor(elapsed * 13);
    const x = fract(Math.sin(seed) * 43758.5) * width;
    const y = fract(Math.sin(seed * 1.7) * 27183.2) * height;
    const shardWidth = 8 + fract(Math.sin(seed * 2.1) * 9123) * width * .12;
    ctx.fillStyle = index % 2 ? '#6ce0c2' : '#e7ad67';
    ctx.fillRect(x, y, shardWidth, 1 + (index % 3));
  }
  ctx.restore();
}

function drawEffects() { if (state.damageFlash > 0) { ctx.fillStyle = `rgba(156, 43, 32, ${state.damageFlash * .2})`; ctx.fillRect(0, 0, canvas.width, canvas.height); } }
function drawScene(now) { const width = canvas.width; const height = canvas.height; ctx.save(); if (state.shakeTime > 0) ctx.translate(Math.sin(now * .09) * state.shakeTime * 7, Math.cos(now * .11) * state.shakeTime * 5); drawBackground(width, height); drawWalls(width, height); drawFloor(width, height); drawWorldObjects(now); drawWorldProjectiles(now); drawDoorOfLight(now); drawImpactBursts(now); drawActiveSpellEffects(now); if (state.reading) drawHeldScroll(now); else { drawWeapon(now); drawSpellCast(now); } drawEffects(); drawLaunchTransition(now); drawBossTransition(now); if (state.endingFade >= 0) { ctx.fillStyle = `rgba(255, 250, 225, ${clamp(state.endingFade, 0, 1)})`; ctx.fillRect(0, 0, width, height); } ctx.restore(); }

function updatePlayer(delta) {
  if (state.gameComplete) return;
  if (state.keys.has('arrowleft')) state.player.angle -= TURN_SPEED * delta;
  if (state.keys.has('arrowright')) state.player.angle += TURN_SPEED * delta;
  if (state.keys.has('arrowup')) state.player.pitch = clamp(state.player.pitch + PITCH_SPEED * delta, -.48, .48);
  if (state.keys.has('arrowdown')) state.player.pitch = clamp(state.player.pitch - PITCH_SPEED * delta, -.48, .48);
  const sprint = state.keys.has('shift');
  const speed = MOVE_SPEED * (sprint ? 1.55 : 1) * delta;
  const angle = state.player.angle;
  let dx = 0; let dy = 0;
  if (state.keys.has('w')) { dx += Math.cos(angle) * speed; dy += Math.sin(angle) * speed; }
  if (state.keys.has('s')) { dx -= Math.cos(angle) * speed; dy -= Math.sin(angle) * speed; }
  if (state.keys.has('a')) { dx += Math.cos(angle - Math.PI / 2) * speed; dy += Math.sin(angle - Math.PI / 2) * speed; }
  if (state.keys.has('d')) { dx += Math.cos(angle + Math.PI / 2) * speed; dy += Math.sin(angle + Math.PI / 2) * speed; }
  if (canStand(state.player.x + dx, state.player.y)) state.player.x += dx;
  if (canStand(state.player.x, state.player.y + dy)) state.player.y += dy;
  state.player.angle = normalizeAngle(state.player.angle);
  state.weapon.moving = Math.abs(dx) + Math.abs(dy) > .001;
  state.weapon.bobPhase += delta * (state.weapon.moving ? (sprint ? 13 : 8) : 2);
  updateRoomFromPlayer();
}
function damagePlayer(enemy) {
  const amount = state.wardTimer > 0 ? enemy.damage * .22 : enemy.damage;
  state.player.hp -= amount;
  state.damageFlash = .95;
  state.shakeTime = .45;
  playHitSound();
  showToast(`${enemy.name} struck you.`, 'danger');
  if (state.player.hp <= 0) {
    state.player.hp = 100;
    const room = rooms[state.room];
    const respawn = roomContentPoint(state.room, room.spawn.x, room.spawn.y);
    state.player.x = roomOffsets[state.room] + respawn.x;
    state.player.y = respawn.y;
    state.player.angle = room.spawn.angle;
    state.player.pitch = 0;
    showToast('You wake at the threshold.', 'danger');
  }
  updateHud();
}
function damageHostile(target, amount, options = {}) {
  if (!target || target.dead) return false;
  if (target.boss && target.shield > 0) {
    target.shield = Math.max(0, target.shield - amount * .34);
    target.hitTime = .22;
    state.impactBursts.push({ x: target.x, y: target.y, z: 1.4, elapsed: 0, duration: .42, color: '#c7f4e7', radius: 1.45 });
    if (target.shield <= 0) showToast('The Archon shield shatters.', 'good');
    return false;
  }
  target.hp -= amount;
  target.hitTime = .28;
  target.alerted = true;
  if (options.stun) target.stunTimer = Math.max(target.stunTimer || 0, options.stun);
  playBoneHitSound();
  if (target.hp <= 0) defeatHostile(target);
  return true;
}
function defeatHostile(target) {
  if (target.dead) return;
  target.dead = true;
  target.deathTime = 0;
  if (target.boss) {
    state.doorOfLight = { x: FINAL_ROOM_OFFSET + 23.1, y: 7, active: true, pulse: 0 };
    state.finalBoss.shield = 0;
    state.finalBoss.phase = 3;
    state.activeSpellEffects.push({ kind: 'boss-death', elapsed: 0, duration: 2.2, color: '#fff4c5' });
    earnExperience(250, 'the Archon');
    showToast('THE OPERATIONS ARCHON FALLS. THE DOOR OF LIGHT OPENS.', 'good');
    playTone(55, .6, 'square', .045); playTone(330, .8, 'triangle', .035, .18);
  } else {
    const reward = target.kind === 'warden' ? 24 : target.kind === 'beast' ? 18 : 12;
    earnExperience(reward, target.displayName || target.name);
    showToast(`${target.displayName || target.name} defeated.`, 'good');
  }
  updateHud();
}
function updateEnemies(delta) {
  if (state.reading || state.menuActive || state.gameComplete) return;
  for (const enemy of worldEnemies) {
    const profile = enemyProfile(enemy);
    if (enemy.dead) { enemy.deathTime += delta; continue; }
    enemy.cooldown = Math.max(0, enemy.cooldown - delta);
    enemy.hitTime = Math.max(0, enemy.hitTime - delta);
    enemy.stunTimer = Math.max(0, (enemy.stunTimer || 0) - delta);
    if (enemy.stunTimer > 0) continue;
    if (enemy.attackTime > 0) {
      const previous = enemy.attackTime;
      enemy.attackTime = Math.max(0, enemy.attackTime - delta);
      if (!enemy.attackHit && previous > .25 && enemy.attackTime <= .25) {
        enemy.attackHit = true;
        if (Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y) < profile.attackDistance + .08) damagePlayer(enemy);
      }
      continue;
    }
    const dx = state.player.x - enemy.x;
    const dy = state.player.y - enemy.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 7.5 && hasLineOfSight(enemy.x, enemy.y, state.player.x, state.player.y)) enemy.alerted = true;
    if (enemy.alerted) enemy.walkPhase += delta * (distance < 2 ? 9 : 5) * profile.speedMultiplier;
    if (enemy.alerted && distance > ENEMY_STOP_DISTANCE && distance < 12) {
      const direction = Math.atan2(dy, dx);
      const slow = state.enemySlowTimer > 0 ? .38 : 1;
      const amount = enemy.speed * profile.speedMultiplier * slow * delta * (distance < 2 ? 1.08 : 1);
      const nextX = enemy.x + Math.cos(direction) * amount;
      const nextY = enemy.y + Math.sin(direction) * amount;
      if (canStand(nextX, enemy.y)) enemy.x = nextX;
      if (canStand(enemy.x, nextY)) enemy.y = nextY;
    }
    if (enemy.alerted && distance < profile.attackDistance && enemy.cooldown <= 0) {
      enemy.attackTime = .55;
      enemy.attackHit = false;
      enemy.cooldown = 1.25 / profile.attackRate;
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
  const baseAngle = Math.atan2(state.player.y - boss.y, state.player.x - boss.x);
  for (let index = 0; index < count; index += 1) {
    const angle = baseAngle + (index - (count - 1) / 2) * (options.spread || .18);
    const origin = { x: boss.x + Math.cos(angle) * .55, y: boss.y + Math.sin(angle) * .55, z: options.z || 1.15 };
    makeProjectile(kind, origin, { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed, z: options.vz || 0 }, { color, damage, radius: options.radius || .14, lifetime: options.lifetime || 4, source: 'boss', collisionHeight: options.collisionHeight || 1.2, aoe: options.aoe || 0 });
  }
}
function updateBoss(delta) {
  const boss = state.finalBoss;
  if (!boss || state.room !== FINAL_ROOM_INDEX || state.gameComplete) return;
  boss.pulse += delta * (boss.phase === 3 ? 2.4 : 1.4);
  if (boss.dead) { boss.deathTime += delta; return; }
  boss.hitTime = Math.max(0, boss.hitTime - delta);
  boss.stunTimer = Math.max(0, (boss.stunTimer || 0) - delta);
  const nextPhase = bossPhaseForHp(boss);
  if (nextPhase !== boss.phase) {
    boss.phase = nextPhase;
    boss.shield = nextPhase === 2 ? 92 : nextPhase === 3 ? 126 : 0;
    boss.cooldown = .35;
    state.shakeTime = .8;
    state.impactBursts.push({ x: boss.x, y: boss.y, z: 1.3, elapsed: 0, duration: 1.4, color: BOSS_PHASES[nextPhase - 1].color, radius: 2.4 });
    showToast(`${BOSS_PHASES[nextPhase - 1].name} — THE ARCHON RECONFIGURES.`, 'danger');
    playTone(82, .32, 'sawtooth', .035); playTone(164, .45, 'triangle', .026, .1);
  }
  if (boss.stunTimer > 0) return;
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
  boss.cooldown -= delta;
  boss.summonTimer -= delta;
  if (boss.phase >= 2 && boss.summonTimer <= 0) {
    boss.summonTimer = boss.phase === 3 ? 5.2 : 7.5;
    const spawnKind = boss.phase === 3 ? 'hound' : 'wraith';
    const spawnX = clamp(boss.x + (Math.random() * 2 - 1) * 3.4, FINAL_ROOM_OFFSET + 2, FINAL_ROOM_OFFSET + FINAL_ROOM_WIDTH - 2);
    const spawnY = clamp(boss.y + (Math.random() * 2 - 1) * 3.4, 1.2, FINAL_ROOM_HEIGHT - 1.2);
    if (canStand(spawnX, spawnY)) worldEnemies.push({ id: `archon-summon-${Date.now()}-${Math.random()}`, name: boss.phase === 3 ? 'Delivery Hound' : 'System Wraith', displayName: boss.phase === 3 ? 'Delivery Hound' : 'System Wraith', kind: spawnKind, x: spawnX, y: spawnY, roomIndex: FINAL_ROOM_INDEX, hp: boss.phase === 3 ? 74 : 66, maxHp: boss.phase === 3 ? 74 : 66, speed: boss.phase === 3 ? .52 : .38, damage: boss.phase === 3 ? 9 : 7, color: boss.phase === 3 ? '#b76b66' : '#77a9e8', cooldown: 1.2, attackTime: 0, attackHit: false, hitTime: 0, walkPhase: Math.random() * 5, alerted: true, dead: false, deathTime: 0 });
    showToast('The Archon dispatches a new blocker.', 'danger');
  }
  if (boss.cooldown > 0) return;
  boss.cooldown = boss.phase === 3 ? 1.35 : boss.phase === 2 ? 1.7 : 2.1;
  const pattern = boss.attackPattern++ % (boss.phase === 1 ? 3 : boss.phase === 2 ? 4 : 5);
  if (pattern === 0) {
    spawnBossPattern('boss-bolt', boss, boss.phase === 3 ? 5 : 3, boss.phase === 3 ? 4.9 : 4.2, boss.phase === 3 ? '#f6e3a5' : '#d99762', boss.phase === 3 ? 16 : 12, { spread: boss.phase === 3 ? .16 : .2, z: 1.22 });
  } else if (pattern === 1) {
    const count = boss.phase === 3 ? 12 : boss.phase === 2 ? 9 : 6;
    for (let index = 0; index < count; index += 1) {
      const angle = index / count * TAU + boss.pulse * .25;
      makeProjectile('boss-ring', { x: boss.x, y: boss.y, z: .75 }, { x: Math.cos(angle) * (boss.phase === 3 ? 4.5 : 3.7), y: Math.sin(angle) * (boss.phase === 3 ? 4.5 : 3.7), z: 0 }, { color: boss.phase === 2 ? '#77a9e8' : '#d99762', damage: boss.phase === 3 ? 13 : 9, radius: .12, lifetime: 3.3, source: 'boss', collisionHeight: .45 });
    }
  } else if (pattern === 2) {
    boss.dashTime = .7;
    const direction = Math.atan2(state.player.y - boss.y, state.player.x - boss.x);
    const nextX = boss.x + Math.cos(direction) * 2.2;
    const nextY = boss.y + Math.sin(direction) * 2.2;
    if (canStand(nextX, nextY)) { boss.x = nextX; boss.y = nextY; }
    state.impactBursts.push({ x: boss.x, y: boss.y, z: 1, elapsed: 0, duration: .8, color: '#e9e9e0', radius: 1.2 });
  } else if (pattern === 3) {
    boss.shield = Math.max(boss.shield, boss.phase === 3 ? 72 : 54);
    state.activeSpellEffects.push({ kind: 'boss-shield', elapsed: 0, duration: 1.1, color: '#9debdc' });
    showToast('THE ARCHON RAISES A LATTICE SHIELD.', 'danger');
  } else {
    spawnBossPattern('boss-bolt', boss, 8, 3.8, '#c58de6', 14, { spread: .42, z: 1.75, lifetime: 3.5 });
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
function hitTarget() {
  const target = findAimTarget();
  const definition = weaponDefinition();
  if (!target) { showToast(`${definition.label} found empty air.`); return; }
  damageHostile(target, definition.damage);
  state.impactBursts.push({ x: target.x, y: target.y, z: hostileAimHeight(target), elapsed: 0, duration: .32, color: state.weapon.type === 'spear' ? '#d8c18b' : '#c99750', radius: .42 });
  const direction = Math.atan2(target.y - state.player.y, target.x - state.player.x);
  const nx = target.x + Math.cos(direction) * definition.knockback;
  const ny = target.y + Math.sin(direction) * definition.knockback;
  if (!target.boss) { if (canStand(nx, target.y)) target.x = nx; if (canStand(target.x, ny)) target.y = ny; }
  if (!target.dead) showToast(`${definition.label} struck ${target.displayName || target.name}.`, 'good');
  updateHud();
}
function projectileTargetHit(projectile, target) {
  damageHostile(target, projectile.damage, { stun: projectile.stun });
  const chainSegments = [];
  if (projectile.kind === 'spell-chain' && projectile.chainTargets > 0) {
    const chained = allHostiles()
      .filter((other) => other !== target && !other.dead && Math.hypot(other.x - target.x, other.y - target.y) < (projectile.aoe || 2.8) + .9)
      .sort((a, b) => Math.hypot(a.x - target.x, a.y - target.y) - Math.hypot(b.x - target.x, b.y - target.y))
      .slice(0, projectile.chainTargets);
    let previous = target;
    for (const other of chained) {
      damageHostile(other, projectile.damage * .5, { stun: projectile.stun * .72 });
      chainSegments.push({ start: { x: previous.x, y: previous.y, z: hostileAimHeight(previous) }, end: { x: other.x, y: other.y, z: hostileAimHeight(other) } });
      state.impactBursts.push({ x: other.x, y: other.y, z: hostileAimHeight(other), elapsed: 0, duration: .62, color: projectile.color, radius: .85 });
      previous = other;
    }
    if (chainSegments.length) state.activeSpellEffects.push({ kind: 'chain', elapsed: 0, duration: .8, color: projectile.color, segments: chainSegments });
  } else if (projectile.aoe > 0) {
    for (const other of allHostiles()) {
      if (other !== target && Math.hypot(other.x - target.x, other.y - target.y) < projectile.aoe) damageHostile(other, projectile.damage * .42, { stun: projectile.stun * .55 });
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
      projectile.vx = lerp(projectile.vx, desired.x, steering); projectile.vy = lerp(projectile.vy, desired.y, steering); projectile.vz = lerp(projectile.vz, desired.z, steering);
    }
    projectile.trail.unshift({ x: projectile.x, y: projectile.y, z: projectile.z });
    if (projectile.trail.length > 12) projectile.trail.pop();
    const next = { x: projectile.x + projectile.vx * delta, y: projectile.y + projectile.vy * delta, z: projectile.z + projectile.vz * delta };
    if (isWall(next.x, next.y) || next.z < .03 || next.z > CEILING_Z - .03) {
      state.impactBursts.push({ x: projectile.x, y: projectile.y, z: projectile.z, elapsed: 0, duration: .35, color: projectile.color, radius: .45 });
      continue;
    }
    projectile.x = next.x; projectile.y = next.y; projectile.z = next.z;
    if (projectile.source === 'boss') {
      if (Math.hypot(projectile.x - state.player.x, projectile.y - state.player.y) < projectile.radius + .23 && Math.abs(projectile.z - EYE_HEIGHT) < projectile.collisionHeight) { damagePlayer({ name: 'The Archon', damage: projectile.damage }); continue; }
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
function performAttack() { const definition = weaponDefinition(); if (state.reading || state.menuActive || state.launchTransition || state.transition || state.weapon.swing > 0 || state.weapon.cooldown > 0 || state.gameComplete) return; state.weapon.swing = definition.duration; state.weapon.cooldown = definition.cooldown ?? .08; state.weapon.hit = false; state.weapon.projectile = 0; state.lastAttackInput = performance.now(); playWeaponSound(); }
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
    if (state.weapon.type === 'crossbow') spawnCrossbowArrow();
    else if (state.weapon.type === 'wand') spawnWandFireball();
    else hitTarget();
  }
  if (previous > 0 && state.weapon.swing <= 0) state.weapon.hit = false;
}

function updatePrompt(delta = 0) {
  state.promptTimer -= delta;
  if (state.menuActive || state.transition || state.launchTransition) { interactionPrompt.hidden = true; return; }
  if (state.reading) {
    if (state.promptSignature !== 'reading') { interactionPrompt.hidden = true; state.promptSignature = 'reading'; }
    return;
  }
  if (state.promptTimer > 0) return;
  state.promptTimer = .12;
  const doorDistance = state.doorOfLight?.active ? Math.hypot(state.doorOfLight.x - state.player.x, state.doorOfLight.y - state.player.y) : Infinity;
  const item = getNearestItem(); const target = findAimTarget();
  const nextKey = doorDistance < 1.65 ? 'E' : target ? 'LMB' : item ? 'E' : state.lastSpell ? 'Q' : 'WASD';
  const nextText = doorDistance < 1.65 ? 'Enter the door of light · return to portfolio' : target ? `${weaponDefinition().label}: attack ${target.displayName || target.name}` : item ? `Read ${item.title} · +${XP_PER_SCROLL} XP` : state.lastSpell ? `Cast ${state.lastSpell.name}${state.spellCooldown > 0 ? ` · ${state.spellCooldown.toFixed(1)}s` : ''}` : 'Explore the connected dungeon';
  const signature = `${nextKey}|${nextText}`;
  if (signature === state.promptSignature) return;
  state.promptSignature = signature;
  interactionPrompt.hidden = false;
  promptKey.textContent = nextKey;
  promptText.textContent = nextText;
}
function advanceToPortfolio() {
  state.endingFade += .022;
  if (state.endingFade >= 1) {
    state.endingFade = -1;
    setMenuVisible(true);
  }
}
function tick(delta, now) {
  state.now = now;
  if (state.menuActive) return;
  if (state.launchTransition) { updateLaunchTransition(delta); state.damageFlash = Math.max(0, state.damageFlash - delta * 1.8); state.shakeTime = Math.max(0, state.shakeTime - delta * 1.8); return; }
  if (state.gameComplete) { advanceToPortfolio(); return; }
  if (state.transition) { updateBossTransition(delta); state.damageFlash = Math.max(0, state.damageFlash - delta * 1.8); state.shakeTime = Math.max(0, state.shakeTime - delta * 1.8); return; }
  if (state.reading) { state.readingElapsed += delta; return; }
  updatePlayer(delta);
  if (state.room === FINAL_ROOM_INDEX) state.finalArenaTime += delta;
  updateWeapon(delta);
  if (state.mouseAttack && state.weapon.swing <= 0 && state.weapon.cooldown <= 0) performAttack();
  updateSpell(delta);
  updateProjectiles(delta);
  updateEnemies(delta);
  state.damageFlash = Math.max(0, state.damageFlash - delta * 1.8);
  state.shakeTime = Math.max(0, state.shakeTime - delta * 1.8);
}
function gameLoop(now) { const delta = Math.min(.05, (now - state.lastTime) / 1000 || 0); state.lastTime = now; tick(delta, now); updatePrompt(delta); if (now - state.lastRenderAt >= RENDER_INTERVAL) { state.lastRenderAt = now; drawScene(now); } requestAnimationFrame(gameLoop); }

function setKey(event, down) {
  const key = event.key.toLowerCase();
  if (down && !event.repeat && (key === 'e' || key === 'enter')) { event.preventDefault(); recoverNearby(); return; }
  if (down && !event.repeat && key === 'escape') { event.preventDefault(); setMenuVisible(true); return; }
  if (down && !event.repeat && key === 'q') { event.preventDefault(); castSpell(); return; }
  const movementKeys = ['w', 'a', 's', 'd', 'shift', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
  if (!movementKeys.includes(key)) return;
  event.preventDefault();
  if (down) state.keys.add(key); else state.keys.delete(key);
}
function requestGamePointerLock() {
  if (!state.menuActive && !state.reading && document.pointerLockElement !== canvas) canvas.requestPointerLock?.();
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
closeScrollButton.addEventListener('click', closeReading);
helpButton.addEventListener('click', () => { if (typeof helpDialog.showModal === 'function') helpDialog.showModal(); else helpDialog.setAttribute('open', ''); });
musicButton?.addEventListener('click', toggleMusic);
playButton.addEventListener('click', () => { setMenuVisible(false); startMusic(); requestGamePointerLock(); });
menuButton.addEventListener('click', () => setMenuVisible(true));
weaponOptionButtons.forEach((button) => button.addEventListener('click', () => setWeapon(button.dataset.weapon)));
window.addEventListener('resize', resizeCanvas);

textures.stone = createStoneTexture(256, 13); textures.wood = createWoodTexture(256, 29); buildGroundCache(); textures.bone = createBoneTexture(96, 37); textures.steel = createSteelTexture(96, 53); textures.leather = createLeatherTexture(96, 71); textures.patterns = { stone: ctx.createPattern(textures.stone, 'repeat'), wood: ctx.createPattern(textures.wood, 'repeat'), bone: ctx.createPattern(textures.bone, 'repeat'), steel: ctx.createPattern(textures.steel, 'repeat'), leather: ctx.createPattern(textures.leather, 'repeat') }; setWeapon(state.weapon.type); populateMenuData(); setMenuVisible(true); updateHud(); resizeCanvas(); requestAnimationFrame(gameLoop);
