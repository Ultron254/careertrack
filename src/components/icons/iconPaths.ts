// The design ships its own icon set as raw path data inside the logic
// scripts' paint() methods. Ported verbatim; all draw in a 24 by 24 box.

export const iconPaths = {
  dashboard:
    '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  goal: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.4"/>',
  chat: '<path d="M5 5h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9l-4 4V7a2 2 0 0 1 2-2z"/>',
  doc: '<path d="M7 3h7l4 4v14H7zM14 3v4h4M9.5 12h5M9.5 16h5"/>',
  chart: '<path d="M5 19V5M5 19h14M9 15v-4M13 15V8M17 15v-6"/>',
  cal: '<rect x="4" y="5.5" width="16" height="15" rx="2.5"/><path d="M4 10h16M8 3v4M16 3v4"/>',
  bell: '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6zM10 20a2 2 0 0 0 4 0"/>',
  user: '<circle cx="12" cy="8.5" r="3.6"/><path d="M5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
  team: '<circle cx="9" cy="8.5" r="3"/><path d="M3 19c0-3 2.7-4.6 6-4.6s6 1.6 6 4.6"/><circle cx="17.5" cy="8.5" r="2.6"/><path d="M16 14.6c3 .2 5 1.8 5 4.4"/>',
  home: '<path d="M4 11l8-7 8 7M6 9.5V20h12V9.5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  lock: '<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  sparkle: '<path d="M12 3l1.9 4.8L18.7 9l-4.8 1.9L12 15.7 10.1 10.9 5.3 9l4.8-1.2z"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  help: '<path d="M18 8a6 6 0 1 1-12 0"/><path d="M12 2v9"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/>',
  star: '<path d="M12 4l2.3 5.2 5.7.5-4.3 3.8 1.3 5.5L12 16.9 7 19.3l1.3-5.5L4 10l5.7-.5z"/>',
  bolt: '<path d="M13 3L4 14h6l-1 7 9-11h-6z"/>',
} as const;

export type IconName = keyof typeof iconPaths;
