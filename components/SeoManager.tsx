import React from 'react';
import { useLocation } from 'react-router-dom';

type PageMeta = {
  title: string;
  description: string;
  keywords: string;
  robots: string;
};

const SITE_NAME = 'Ranatantra';
const DEFAULT_DESCRIPTION =
  'Ranatantra 2026 - The premier Technical and Cultural Fest of Jain College of Engineering and Technology (JCET), Hubballi. Join us for a fusion of innovation and talent.';
const DEFAULT_KEYWORDS =
  'Ranatantra 2026, JCET Hubballi, Jain College Hubballi, Hubballi Tech Fest, Engineering Fest Hubli, Cultural Fest Hubballi, Karnataka College Events, JCET Fest';
const COLLEGE_NAME = 'Jain College of Engineering and Technology, Hubballi';
const COLLEGE_ALIASES = ['JCET', 'JCET Hubballi', 'JCET Hubli'];

const PAGE_METADATA: Record<string, PageMeta> = {
  '/': {
    title: 'Ranatantra 2026 | Official Hubballi Tech & Cultural Fest at JCET',
    description:
      'Participate in Ranatantra 2026 at JCET Hubballi. Experience high-octane technical competitions, cultural talent hunts, and amazing student showcases. Register now!',
    keywords: `${DEFAULT_KEYWORDS}, Ranatantra 2026 homepage, JCET Hubballi best fest, Hubballi Engineering Event`,
    robots: 'index, follow',
  },
  '/gallery': {
    title: 'Festival Moments & Highlights | Ranatantra 2026 Gallery',
    description:
      'Browse through the visual journey of Ranatantra. See photos and videos of past winners, celebrations, and high-energy performances at JCET.',
    keywords: `${DEFAULT_KEYWORDS}, Ranatantra event photos, JCET fest highlights, Hubballi college gallery`,
    robots: 'index, follow',
  },
  '/events': {
    title: 'All Competitions & Events | Ranatantra 2026 List',
    description:
      'Explore all technical, management, and cultural events at Ranatantra 2026. Detailed rules, prize info, and venue details for all JCET competitions.',
    keywords: `${DEFAULT_KEYWORDS}, Ranatantra competition list, engineering events Hubballi, management games Hubli`,
    robots: 'index, follow',
  },
  '/schedule': {
    title: 'Event Timeline & Day Wise Schedule | Ranatantra 2026',
    description:
      'Complete day-wise timeline for Ranatantra 2026. Don\'t miss a single round of your favorite competitions at JCET Hubballi.',
    keywords: `${DEFAULT_KEYWORDS}, Ranatantra event timings, JCET fest schedule 2026`,
    robots: 'index, follow',
  },
  '/register': {
    title: 'Online Registration | Join Ranatantra 2026 Tech Fest',
    description:
      'Secure your spot at Ranatantra 2026. Register online for various technical and cultural events at Jain College of Engineering & Technology, Hubballi.',
    keywords: `${DEFAULT_KEYWORDS}, Ranatantra 2026 registration online, JCET event signup`,
    robots: 'index, follow',
  },
  '/contact': {
    title: 'Contact Local Organizers | Reach Out to Ranatantra JCET',
    description:
      'Have questions? Contact the Ranatantra 2026 student organizing committee at JCET Hubballi for support, venue maps, and general queries.',
    keywords: `${DEFAULT_KEYWORDS}, Ranatantra helpdesk, JCET Hubballi contact number, event coordinator details`,
    robots: 'index, follow',
  },
  '/dashboard': {
    title: 'Participant Profile | Ranatantra Digital Pass',
    description: 'Login to access your Ranatantra 2026 digital entry pass and participation history.',
    keywords: `${DEFAULT_KEYWORDS}, participant login`,
    robots: 'noindex, nofollow',
  },
  '/admin': {
    title: 'Command Center | Admin Control Panel',
    description: 'Restricted administrative access for the Ranatantra 2026 Organizing Committee.',
    keywords: `${DEFAULT_KEYWORDS}, admin login`,
    robots: 'noindex, nofollow',
  },
  '/scanner': {
    title: 'Gate Pass Verification | QR Scanner',
    description: 'In-venue entry verification scanner for Ranatantra 2026 organizers.',
    keywords: `${DEFAULT_KEYWORDS}, qr scanner admin`,
    robots: 'noindex, nofollow',
  },
};

const upsertMetaTag = (selector: string, attributes: Record<string, string>, content: string) => {
  let tag = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    Object.entries(attributes).forEach(([key, value]) => tag?.setAttribute(key, value));
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
};

const upsertCanonical = (href: string) => {
  let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
};

const upsertStructuredData = (origin: string) => {
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${origin}/#organization`,
        name: 'Ranatantra Organizing Team',
        alternateName: [SITE_NAME, ...COLLEGE_ALIASES.map((name) => `${name} Ranatantra`)],
        url: `${origin}/`,
        email: 'vishal.ishwar.ponaji@gmail.com',
        logo: `${origin}/logo.png`,
      },
      {
        '@type': 'CollegeOrUniversity',
        '@id': `${origin}/#college`,
        name: COLLEGE_NAME,
        alternateName: COLLEGE_ALIASES,
        url: `${origin}/`,
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Hubballi',
          addressRegion: 'Karnataka',
          addressCountry: 'IN',
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${origin}/#website`,
        name: `${SITE_NAME} - JCET Hubballi`,
        url: `${origin}/`,
        inLanguage: 'en-IN',
        publisher: {
          '@id': `${origin}/#organization`,
        },
        about: {
          '@id': `${origin}/#college`,
        },
      },
      {
        '@type': 'Event',
        '@id': `${origin}/#event`,
        name: `${SITE_NAME} at JCET Hubballi`,
        description: DEFAULT_DESCRIPTION,
        startDate: '2026-03-27T09:00:00+05:30',
        endDate: '2026-03-28T18:00:00+05:30',
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        url: `${origin}/#/register`,
        image: [`${origin}/logo.png`],
        organizer: {
          '@id': `${origin}/#organization`,
        },
        about: {
          '@id': `${origin}/#college`,
        },
        location: {
          '@type': 'Place',
          name: COLLEGE_NAME,
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Hubballi',
            addressRegion: 'Karnataka',
            addressCountry: 'IN',
          },
        },
      },
    ],
  };

  const scriptId = 'Ranatantra-structured-data';
  let script = document.getElementById(scriptId) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }

  script.textContent = JSON.stringify(data);
};

const SeoManager: React.FC = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    const metadata = PAGE_METADATA[pathname] ?? {
      title: `${SITE_NAME} | Official Cultural & Tech Fest Website`,
      description: DEFAULT_DESCRIPTION,
      keywords: DEFAULT_KEYWORDS,
      robots: 'index, follow',
    };

    const origin = window.location.origin;
    const canonicalUrl = pathname === '/' ? `${origin}/` : `${origin}/#${pathname}`;
    const imageUrl = `${origin}/logo.png`;

    document.title = metadata.title;
    document.documentElement.setAttribute('lang', 'en');

    upsertMetaTag('meta[name="description"]', { name: 'description' }, metadata.description);
    upsertMetaTag('meta[name="keywords"]', { name: 'keywords' }, metadata.keywords);
    upsertMetaTag('meta[name="robots"]', { name: 'robots' }, metadata.robots);
    upsertMetaTag('meta[name="author"]', { name: 'author' }, 'Ranatantra Organizing Team, JCET Hubballi');

    upsertMetaTag('meta[property="og:title"]', { property: 'og:title' }, metadata.title);
    upsertMetaTag('meta[property="og:description"]', { property: 'og:description' }, metadata.description);
    upsertMetaTag('meta[property="og:type"]', { property: 'og:type' }, 'website');
    upsertMetaTag('meta[property="og:url"]', { property: 'og:url' }, canonicalUrl);
    upsertMetaTag('meta[property="og:image"]', { property: 'og:image' }, imageUrl);
    upsertMetaTag('meta[property="og:image:alt"]', { property: 'og:image:alt' }, 'Ranatantra official logo at JCET Hubballi');
    upsertMetaTag('meta[property="og:locale"]', { property: 'og:locale' }, 'en_IN');
    upsertMetaTag('meta[property="og:site_name"]', { property: 'og:site_name' }, SITE_NAME);

    upsertMetaTag('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary_large_image');
    upsertMetaTag('meta[name="twitter:title"]', { name: 'twitter:title' }, metadata.title);
    upsertMetaTag('meta[name="twitter:description"]', { name: 'twitter:description' }, metadata.description);
    upsertMetaTag('meta[name="twitter:image"]', { name: 'twitter:image' }, imageUrl);
    upsertMetaTag('meta[name="twitter:image:alt"]', { name: 'twitter:image:alt' }, 'Ranatantra official logo at JCET Hubballi');

    upsertCanonical(canonicalUrl);
    upsertStructuredData(origin);
  }, [pathname]);

  return null;
};

export default SeoManager;
