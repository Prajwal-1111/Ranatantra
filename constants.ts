import { EventDetails } from './types';

// Replace this with your deployed Google Apps Script Web App URL
export const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxZ3u_VLfn6LOXh4gaC3jNvzUbFJBcXD0Lt4mWIEV8eVc6AKsBS4Tku8cKIAHW4Odit/exec';

// Replace with your Google Cloud Client ID (for Google Sign-In)
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '967099015304-3at146naslvniojgrhirrjv04bpb50lo.apps.googleusercontent.com';

// Backend Config — empty string means API calls go to same origin (/api/*)
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

// Only these Google accounts can access the Admin page.
export const DEFAULT_KEYWORDS =
  'MBA Fest, management fest, JCET, JCET Hubballi, Jain College of Engineering and Technology, Jain College Hubli, MBA events, management competition, Hubli';
export const ADMIN_ALLOWED_EMAILS = [
  'vaibhav2k26jcet@gmail.com',
  'srujanmirji10@gmail.com',
  'jcetvaibhav@gmail.com',
  'prajwaljinagi63@gmail.com',
  'dharwadzishan@gmail.com',
  'sachitsarangamath44@gmail.com',
  'vishal.ishwar.ponaji@gmail.com'
];


export const DEPARTMENTS = ['All', 'MBA', 'BBA', 'M.Com', 'B.Com'];
export const EVENTS: EventDetails[] = [
  {
    id: 'e1',
    title: 'Netrtva Tantra (Best Manager)',
    category: 'Competition',
    description: 'Prove your leadership and management skills in this ultimate Best Manager competition. 4 Rounds over 2 Days.',
    date: 'March 27 - 28, 2026',
    time: '10:00 AM & 2:00 PM',
    venue: 'Main Auditorium',
    image: '/Netrtva tantra.jpg.jpeg',
    teamSize: 'Team of 5',
    department: 'General',
    fee: 10,
    rulebookUrl: '/rulebooks/Black%20and%20White%20Torn%20Run%20Fest%20Event%20Banner.pdf'
  },
  {
    id: 'e2',
    title: 'Prachara Tantra (Marketing)',
    category: 'Competition',
    description: 'Showcase your marketing strategies, brand building, and advertising skills. 4 Rounds over 2 Days.',
    date: 'March 27 - 28, 2026',
    time: '10:00 AM & 2:00 PM',
    venue: 'Seminar Hall',
    image: '/Prachara Tantra.jpg.jpeg',
    teamSize: 'Team of 5',
    department: 'General',
    fee: 10,
    rulebookUrl: '/rulebooks/Black%20and%20White%20Torn%20Run%20Fest%20Event%20Banner.pdf'
  },
  {
    id: 'e3',
    title: 'Kosh Tantra (Finance)',
    category: 'Competition',
    description: 'Test your financial acumen, budgeting skills, and investment strategies. 4 Rounds over 2 Days.',
    date: 'March 27 - 28, 2026',
    time: '10:00 AM & 2:00 PM',
    venue: 'Conference Room',
    image: '/Kosha tantra.jpg.jpeg',
    teamSize: 'Team of 5',
    department: 'General',
    fee: 10,
    rulebookUrl: '/rulebooks/Black%20and%20White%20Torn%20Run%20Fest%20Event%20Banner.pdf'
  }
];

// All MBA events for auto-selection
export const MBA_EVENT_TITLES = EVENTS.map(e => e.title);

export const SCHEDULE = [
  {
    day: 'Day 1 - March 27',
    events: [
      { time: '09:30 AM - 10:00 AM', title: 'Inauguration & Welcome' },
      { time: '10:00 AM - 12:00 PM', title: 'Round 1 (All Events)' },
      { time: '12:00 PM - 02:00 PM', title: 'Lunch Break' },
      { time: '02:00 PM - 04:00 PM', title: 'Round 2 (All Events)' },
    ]
  },
  {
    day: 'Day 2 - March 28',
    events: [
      { time: '10:00 AM - 12:00 PM', title: 'Round 3 (All Events)' },
      { time: '12:00 PM - 02:00 PM', title: 'Lunch Break' },
      { time: '02:00 PM - 04:00 PM', title: 'Round 4 (All Events)' },
      { time: '04:00 PM - 05:00 PM', title: 'Valedictory & Prize Distribution' },
    ]
  }
];
