import { EventDetails } from './types';

// Replace this with your deployed Google Apps Script Web App URL
export const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyj0GWc2pGQcLkmQdHE-8aWSXt1u-wRFlfvv0JHHA_0eL9ZpFWj995GVQ3VPgwSQLIobg/exec';

// Replace with your Google Cloud Client ID (for Google Sign-In)
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '967099015304-3at146naslvniojgrhirrjv04bpb50lo.apps.googleusercontent.com';

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
    description: 'Prove your leadership and management skills in this ultimate Best Manager competition.',
    date: 'March 27, 2026',
    time: '10:00 AM',
    venue: 'Main Auditorium',
    image: 'https://loremflickr.com/800/600/business,leadership',
    teamSize: 'Team of 5',
    department: 'General',
    fee: 1,
    rulebookUrl: '/rulebooks/Black%20and%20White%20Torn%20Run%20Fest%20Event%20Banner.pdf'
  },
  {
    id: 'e2',
    title: 'Prachara Tantra (Marketing)',
    category: 'Competition',
    description: 'Showcase your marketing strategies, brand building, and advertising skills.',
    date: 'March 27, 2026',
    time: '01:00 PM',
    venue: 'Seminar Hall',
    image: 'https://loremflickr.com/800/600/marketing,advertising',
    teamSize: 'Team of 5',
    department: 'General',
    fee: 1,
    rulebookUrl: '/rulebooks/Black%20and%20White%20Torn%20Run%20Fest%20Event%20Banner.pdf'
  },
  {
    id: 'e3',
    title: 'Kosh Tantra (Finance)',
    category: 'Competition',
    description: 'Test your financial acumen, budgeting skills, and investment strategies.',
    date: 'March 27, 2026',
    time: '03:00 PM',
    venue: 'Conference Room',
    image: 'https://loremflickr.com/800/600/finance,money',
    teamSize: 'Team of 5',
    department: 'General',
    fee: 1,
    rulebookUrl: '/rulebooks/Black%20and%20White%20Torn%20Run%20Fest%20Event%20Banner.pdf'
  }
];

// All MBA events for auto-selection
export const MBA_EVENT_TITLES = EVENTS.map(e => e.title);

export const SCHEDULE = [
  {
    day: 'MBA Fest Day - March 27',
    events: [
      { time: '09:30 AM - 10:00 AM', title: 'Inauguration & Welcome' },
      { time: '10:00 AM - 12:30 PM', title: 'Netrtva Tantra (Best Manager)' },
      { time: '12:30 PM - 01:00 PM', title: 'Lunch Break' },
      { time: '01:00 PM - 03:00 PM', title: 'Prachara Tantra (Marketing)' },
      { time: '03:00 PM - 05:00 PM', title: 'Kosh Tantra (Finance)' },
      { time: '05:00 PM - 05:30 PM', title: 'Valedictory & Prize Distribution' },
    ]
  }
];
