export interface EventDetails {
  id: string;
  title: string;
  category: 'Coding' | 'Gaming' | 'Quiz' | 'Workshop' | 'Presentation' | 'Innovation' | 'AI/Tech' | 'Cultural' | 'Ceremony' | 'Fun' | 'Competition';
  description: string;
  date: string;
  time: string;
  venue: string;
  image: string;
  teamSize: string;
  department?: 'CSE' | 'ECE' | 'CVE' | 'ME' | 'BS' | 'General';
  fee?: number; // Fee in INR
}

export interface RegistrationFormData {
  fullName: string;
  email: string;
  phone: string;
  college: string;
  department: string;
  year: string;
  selectedEvents: string[];
  razorpayPaymentId?: string; // Optional field for payment ID
  teamName?: string;
  member1Name?: string;
  member2Name?: string;
  member3Name?: string;
  member4Name?: string;
  accommodationRequired?: string;
  agreeToRules?: boolean;
}

export interface ApiResponse {
  status: 'success' | 'error';
  message: string;
}

export interface AdminRegistrationRecord {
  timestamp: string;
  fullName: string;
  email: string;
  phone: string;
  college: string;
  department: string;
  year: string;
  eventTitle: string;
  eventId: string;
  eventDate: string;
  registrationId?: string;
  razorpayPaymentId?: string;
}
