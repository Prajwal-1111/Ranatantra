import { RegistrationFormData, ApiResponse, AdminRegistrationRecord } from '../types';
import { EVENTS, GOOGLE_SCRIPT_URL } from '../constants';

// Simulated database for when Google Script URL is missing or fails (CORS)
const SIMULATED_DB: RegistrationFormData[] = [
  {
    fullName: "JCET Ranatantra",
    email: "participant@example.com", // This matches the simulated user account
    phone: "9876543210",
    college: "Jain College of Engineering and Technology",
    department: "Computer Science",
    year: "3",
    selectedEvents: ["Project Pitch Day", "Code Debugging"],
    paymentId: "pay_xyz_test123"
  },
  {
    fullName: "Srujan Mirji",
    email: "srujanmirji10@gmail.com",
    phone: "7795341351",
    college: "Jain College of Engineering and Technology",
    department: "Information Science",
    year: "3",
    selectedEvents: ["BGMI Tournament", "Treasure Hunt"],
    paymentId: "pay_abc_test456"
  },
  {
    fullName: "Test User",
    email: "test@example.com",
    phone: "1112223333",
    college: "Other College",
    department: "Mechanical",
    year: "1",
    selectedEvents: ["Robo Wars", "Tech Quiz"],
    paymentId: "pay_def_test789"
  }
];
const USER_REGISTRATIONS_CACHE_PREFIX = 'user_registrations_cache:';
const USER_REGISTRATIONS_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const inFlightRegistrationRequests = new Map<string, Promise<RegistrationsResponse>>();

type RawApiResponse = {
  status?: string;
  message?: string;
  error?: string;
};

type RegistrationsResponse = {
  status: 'success' | 'error';
  data?: any[];
  message?: string;
};

const normalizeEmailKey = (email: string) => email.trim().toLowerCase();
const getUserRegistrationsCacheKey = (email: string) => `${USER_REGISTRATIONS_CACHE_PREFIX}${normalizeEmailKey(email)}`;

const readUserRegistrationsCache = (
  email: string,
  ignoreExpiry = false
): { data: any[]; timestamp: number } | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const cached = localStorage.getItem(getUserRegistrationsCacheKey(email));
    if (!cached) {
      return null;
    }

    const parsed = JSON.parse(cached) as { timestamp?: number; data?: any[] };
    if (!Array.isArray(parsed?.data) || typeof parsed?.timestamp !== 'number') {
      return null;
    }

    if (!ignoreExpiry && Date.now() - parsed.timestamp >= USER_REGISTRATIONS_CACHE_DURATION) {
      return null;
    }

    return {
      data: parsed.data,
      timestamp: parsed.timestamp,
    };
  } catch (error) {
    console.warn('Failed to read user registrations cache:', error);
    return null;
  }
};

const writeUserRegistrationsCache = (email: string, data: any[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(
      getUserRegistrationsCacheKey(email),
      JSON.stringify({
        timestamp: Date.now(),
        data,
      })
    );
  } catch (error) {
    console.warn('Failed to write user registrations cache:', error);
  }
};

export const invalidateRegistrationsCache = (email?: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (email) {
    const normalizedEmail = normalizeEmailKey(email);
    localStorage.removeItem(getUserRegistrationsCacheKey(normalizedEmail));
    inFlightRegistrationRequests.delete(normalizedEmail);
    return;
  }

  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(USER_REGISTRATIONS_CACHE_PREFIX)) {
      localStorage.removeItem(key);
    }
  }
  inFlightRegistrationRequests.clear();
};

const normalizeApiResponse = (response: RawApiResponse | null, defaultError: string): ApiResponse => {
  const isSuccess = response?.status === 'success';
  const message = response?.message || response?.error || (isSuccess ? 'Registration successful!' : defaultError);
  return { status: isSuccess ? 'success' : 'error', message };
};

const postRegistrationForEvent = async (data: RegistrationFormData, eventTitle: string): Promise<ApiResponse> => {
  const selectedEvent = EVENTS.find((event) => event.title === eventTitle);
  const payload = {
    ...data,
    selectedEventId: selectedEvent?.id || '',
    selectedEvent: eventTitle,
    selectedEvents: [
      {
        id: selectedEvent?.id || '',
        title: eventTitle,
      },
    ],
    action: 'register',
  };

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let parsed: RawApiResponse | null = null;

    if (text) {
      try {
        parsed = JSON.parse(text) as RawApiResponse;
      } catch {
        parsed = null;
      }
    }

    if (!response.ok && !parsed) {
      return { status: 'error', message: `${eventTitle}: Registration failed with HTTP ${response.status}.` };
    }

    const normalized = normalizeApiResponse(parsed, 'Registration failed.');
    if (normalized.status === 'error') {
      return { status: 'error', message: `${eventTitle}: ${normalized.message}` };
    }

    return normalized;
  } catch (fetchError) {
    // If CORS blocks response reading but data was sent, try no-cors as fallback.
    console.warn("Retrying registration with no-cors mode...", fetchError);

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(payload),
      });
      // no-cors means we cannot read the response body.
      return { status: 'success', message: `Registration submitted for "${eventTitle}".` };
    } catch (noCorsError: any) {
      return { status: 'error', message: `${eventTitle}: ${noCorsError?.message || 'Failed to submit registration.'}` };
    }
  }
};

export const submitRegistration = async (data: RegistrationFormData): Promise<ApiResponse> => {
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes('INSERT_YOUR')) {
    // Simulate success for demo purposes if URL is not set
    console.warn("Google Script URL is not configured. Simulating success.");
    SIMULATED_DB.push(data); // Store in memory for demo
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ status: 'success', message: 'Registration simulated successfully (API URL not set).' });
      }, 1500);
    });
  }

  try {
    const selectedEvents = [...new Set(data.selectedEvents || [])].filter(Boolean);
    if (selectedEvents.length === 0) {
      return { status: 'error', message: 'Please select at least one event.' };
    }

    // Send ALL events in a single request so the backend sends one consolidated email
    const eventsWithIds = selectedEvents.map((eventTitle) => {
      const selectedEvent = EVENTS.find((event) => event.title === eventTitle);
      return {
        id: selectedEvent?.id || '',
        title: eventTitle,
      };
    });

    const payload = {
      ...data,
      selectedEvents: eventsWithIds,
      action: 'register',
    };

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      let parsed: { status?: string; message?: string; error?: string } | null = null;
      if (text) {
        try { parsed = JSON.parse(text); } catch { parsed = null; }
      }

      if (!response.ok && !parsed) {
        return { status: 'error', message: `Registration failed with HTTP ${response.status}.` };
      }

      const normalized = normalizeApiResponse(parsed, 'Registration failed.');
      if (normalized.status === 'success') {
        invalidateRegistrationsCache(data.email);
      }
      return normalized;
    } catch (fetchError) {
      // CORS fallback: retry with no-cors
      console.warn("Retrying batch registration with no-cors mode...", fetchError);
      try {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify(payload),
        });
        invalidateRegistrationsCache(data.email);
        return { status: 'success', message: `Registration submitted for ${selectedEvents.length} event(s).` };
      } catch (noCorsError: any) {
        return { status: 'error', message: noCorsError?.message || 'Failed to submit registration.' };
      }
    }
  } catch (error: any) {
    console.error("Submission error:", error);
    return { status: 'error', message: 'Failed to submit: ' + (error.message || error.toString()) };
  }
};

/**
 * Helper to bypass CORS using JSONP for GET requests to Google Apps Script.
 */
const jsonpFetch = <T>(url: string): Promise<T> => {
  return new Promise((resolve, reject) => {
    const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
    const script = document.createElement('script');

    // Append the callback parameter
    const src = url.includes('?')
      ? `${url}&callback=${callbackName}`
      : `${url}?callback=${callbackName}`;

    script.src = src;

    // Define the global callback function
    (window as any)[callbackName] = (data: T) => {
      resolve(data);
      cleanup();
    };

    // Handle script load errors
    script.onerror = () => {
      reject(new Error('JSONP request failed: Script failed to load'));
      cleanup();
    };

    // Cleanup function to remove script and global callback
    const cleanup = () => {
      document.body.removeChild(script);
      delete (window as any)[callbackName];
    };

    document.body.appendChild(script);
  });
};

export const getRegistrations = async (email: string, forceRefresh = false): Promise<RegistrationsResponse> => {
  const normalizedEmail = normalizeEmailKey(email);
  if (!normalizedEmail) {
    return { status: 'error', message: 'Email is required.' };
  }

  if (!forceRefresh) {
    const cached = readUserRegistrationsCache(normalizedEmail);
    if (cached) {
      return { status: 'success', data: cached.data };
    }
  }

  if (!forceRefresh) {
    const inFlight = inFlightRegistrationRequests.get(normalizedEmail);
    if (inFlight) {
      return inFlight;
    }
  }

  const requestPromise = (async (): Promise<RegistrationsResponse> => {
    try {
      const query = new URLSearchParams({
        action: 'getRegistrations',
        email: normalizedEmail,
      });
      if (forceRefresh) {
        query.set('forceRefresh', '1');
      }

      const result = await jsonpFetch<any>(`${GOOGLE_SCRIPT_URL}?${query.toString()}`);

      if (result?.status === 'error') {
        return { status: 'error', message: result.message || result.error || 'Failed to fetch registrations.' };
      }

      const data = Array.isArray(result?.data) ? result.data : [];
      writeUserRegistrationsCache(normalizedEmail, data);

      return { status: 'success', data };
    } catch (error) {
      console.error("Fetch error:", error);
      const staleCache = readUserRegistrationsCache(normalizedEmail, true);
      if (staleCache) {
        return { status: 'success', data: staleCache.data };
      }
      return { status: 'error', message: 'Failed to connect to the server to fetch registrations.' };
    } finally {
      inFlightRegistrationRequests.delete(normalizedEmail);
    }
  })();

  if (!forceRefresh) {
    inFlightRegistrationRequests.set(normalizedEmail, requestPromise);
  }

  return requestPromise;
};

const CACHE_KEY = 'admin_registrations_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getAllRegistrationsForAdmin = async (
  adminEmail: string,
  forceRefresh = false
): Promise<{ status: 'success' | 'error'; data?: AdminRegistrationRecord[]; message?: string }> => {
  // Check cache first if not forcing refresh
  if (!forceRefresh) {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        // Check if cache is still valid (less than 5 minutes old)
        if (Date.now() - timestamp < CACHE_DURATION) {
          console.log('Serving from cache');
          return { status: 'success', data };
        }
      }
    } catch (e) {
      console.warn('Failed to read from cache:', e);
    }
  }

  try {
    const query = new URLSearchParams({
      action: 'getAllRegistrations',
      adminEmail,
    });
    if (forceRefresh) {
      query.set('forceRefresh', '1');
    }

    const result = await jsonpFetch<any>(`${GOOGLE_SCRIPT_URL}?${query.toString()}`);

    if (result?.status === 'error') {
      return { status: 'error', message: result.message || result.error || 'Failed to fetch admin data.' };
    }

    // Cache the successful result
    if (result?.status === 'success' && result.data) {
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({
          timestamp: Date.now(),
          data: result.data
        }));
      } catch (e) {
        console.warn('Failed to save to cache:', e);
      }
    }

    return {
      status: 'success',
      data: (result?.data || []) as AdminRegistrationRecord[],
      message: result?.message,
    };
  } catch (error) {
    console.error('Admin fetch error:', error);
    return { status: 'error', message: 'Failed to connect to the server to fetch all registrations.' };
  }
};
