(function(){
// Timeline window: Jan 1 → mid-June
const START = new Date('2026-01-01T00:00:00');
const END = new Date('2026-06-15T23:59:59');


// Events (add more later)
const EVENTS = [
{
id: 'irish-double',
date: '2026-03-15',
title: 'Irish Double',
emoji: '🍀',
info: [
'8K run at 7:00 AM',
'5K run at 8:30 AM'
]
},
{
id: 'owens-corning',
date: '2026-04-26',
title: 'Owens Corning Half Marathon',
emoji: '🏃‍♂️‍➡️',
info: [
'Half marathon run',
'Start time: TBD'
]
},
{
id: 'trifecta-weekend',
date: '2026-06-06',
title: '2026 Trifecta Weekend',
emoji: '🏔️',
info: [
'Beast 21K • Super 10K • Sprint 5K',
'Beast start: 10:00 AM (OPEN)'
]
}
];


const track = document.getElementById('timelineTrack');
const todayMarker = document.getElementById('todayMarker');
const header = document.querySelector('.site-header');


function setStickyOffset(){
if(!header) return;
const h = header.offsetHeight || 0;
document.documentElement.style.setProperty('--sticky-top', h + 'px');
}


// Modal elements
const modal = document.getElementById('eventModal');
const closeBtn = document.getElementById('modalClose');
const titleEl = document.getElementById('eventTitle');
const dateEl = document.getElementById('eventDate');
const emojiEl = document.getElementById('eventEmoji');
const infoEl = document.getElementById('eventInfo');
const countdownEl = document.getElementById('eventCountdown');
const countdownSubEl = document.getElementById('eventCountdownSub');


const msDay = 24*60*60*1000;


function clamp01(x){ return Math.max(0, Math.min(1, x)); }


})();
