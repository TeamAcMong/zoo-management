// hooks made global so every babel-script file can use them bare
Object.assign(window, { useState: React.useState, useEffect: React.useEffect, useRef: React.useRef, useMemo: React.useMemo });

// Inline Lucide-style icons (24/24, 1.5px stroke) for the workspace chrome.
// Game-interior art uses emoji/CSS, not these.
const _svg = (path, fill) => ({ size = 18, ...rest }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={fill || 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...rest}>{path}</svg>
);

const Home = _svg(<><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></>);
const Repeat = _svg(<><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></>);
const Smartphone = _svg(<><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></>);
const Paw = _svg(<><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="4" cy="8" r="2"/><circle cx="7" cy="16" r="2.5"/><path d="M9.5 14.5c1.5-1.5 4.5-1.5 6 .5s.5 4-1 4.5-3-.5-5 0-3.5-.5-3.5-2.5 2-1 3.5-2.5Z"/></>);
const Dumbbell = _svg(<><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></>);
const Star = _svg(<polygon points="12 2 15.1 8.6 22 9.3 17 14.1 18.2 21 12 17.6 5.8 21 7 14.1 2 9.3 8.9 8.6"/>);
const Coins = _svg(<><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></>);
const Trending = _svg(<><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></>);
const Gauge = _svg(<><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></>);
const Wallet = _svg(<><path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7"/><path d="M18 12a1 1 0 0 0 0 2h3v-2Z"/></>);
const Calendar = _svg(<><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>);
const Ticket = _svg(<><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2M13 17v2M13 11v2"/></>);
const Search = _svg(<><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>);
const Bell = _svg(<><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>);
const Plus = _svg(<><path d="M12 5v14M5 12h14"/></>);
const Download = _svg(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><path d="M12 15V3"/></>);
const ChevronRight = _svg(<polyline points="9 18 15 12 9 6"/>);
const ArrowRight = _svg(<><path d="M5 12h14M12 5l7 7-7 7"/></>);
const Sparkles = _svg(<><path d="m12 3 1.9 5.8L19.7 9l-4.7 3.4L16.7 18 12 14.7 7.3 18l1.7-5.6L4.3 9l5.8-.2z"/></>);
const Check = _svg(<polyline points="20 6 9 17 4 12"/>);
const Heart = _svg(<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>);
const Trophy = _svg(<><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></>);
const Layers = _svg(<><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>);
const Clock = _svg(<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>);
const Gift = _svg(<><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/></>);
const Zap = _svg(<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>);
const Crown = _svg(<><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M5 20h14"/></>);
const X = _svg(<><path d="M18 6 6 18M6 6l12 12"/></>);
const Layout = _svg(<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M3 9h6"/></>);
const Flag = _svg(<><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/></>);
const MapIcon = _svg(<><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><path d="M9 3v15M15 6v15"/></>);
const Megaphone = _svg(<><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></>);
const Server = _svg(<><rect x="2" y="3" width="20" height="8" rx="2"/><rect x="2" y="13" width="20" height="8" rx="2"/><path d="M6 7h.01M6 17h.01"/></>);
const Table = _svg(<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></>);
const Rocket = _svg(<><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/></>);

Object.assign(window, {
  Home, Repeat, Smartphone, Paw, Dumbbell, Star, Coins, Trending, Gauge, Wallet, Calendar, Ticket,
  Search, Bell, Plus, Download, ChevronRight, ArrowRight, Sparkles, Check, Heart, Trophy, Layers, Clock, Gift, Zap, Crown, X, Layout, Flag, MapIcon, Megaphone, Server, Table, Rocket,
});
