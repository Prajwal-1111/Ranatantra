import React, { useState, useEffect } from 'react';
import { EVENTS, GOOGLE_CLIENT_ID, MBA_EVENT_TITLES } from '../constants';
import { useLocation } from 'react-router-dom';

import { getRegistrations, submitRegistration } from '../services/googleSheets';
import { clearAuthToken, getAuthUserFromToken, getStoredAuthUser, persistAuthToken } from '../services/authSession';
import { RegistrationFormData } from '../types';
import { CheckCircle, AlertCircle, Loader2, Sparkles, User, LogOut, Users, Upload, FileCheck, Shield } from 'lucide-react';

// Declare google global for TypeScript
declare const google: any;

const Register: React.FC = () => {
  const location = useLocation();
  const [formData, setFormData] = useState<RegistrationFormData>({
    fullName: '',
    email: '',
    phone: '',
    college: '',
    department: '',
    year: '1',
    selectedEvents: [...MBA_EVENT_TITLES], // Auto-select all 3 MBA events
    teamName: '',
    member1Name: '',
    member2Name: '',
    member3Name: '',
    member4Name: '',
    accommodationRequired: 'no',
    agreeToRules: false,
  });

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);
  const [userProfilePicture, setUserProfilePicture] = useState('');
  const [generatedRegId, setGeneratedRegId] = useState<string>('');
  const [loadingRegisteredEvents, setLoadingRegisteredEvents] = useState(false);
  const [collegeIdFile, setCollegeIdFile] = useState<File | null>(null);
  const [paymentScreenshotFile, setPaymentScreenshotFile] = useState<File | null>(null);

  const fetchRegisteredEvents = async (email: string, forceRefresh = false) => {
    if (!email) return;
    setLoadingRegisteredEvents(true);
    await getRegistrations(email, forceRefresh);
    setLoadingRegisteredEvents(false);
  };

  const handleCredentialResponse = (response: any) => {
    const authUser = getAuthUserFromToken(response.credential);
    if (authUser) {
      setFormData(prev => ({
        ...prev,
        fullName: authUser.name || '',
        email: authUser.email || ''
      }));
      setIsGoogleSignedIn(true);
      if (authUser.picture) {
        setUserProfilePicture(authUser.picture);
      }
      setMessage("");
      persistAuthToken(response.credential);
      fetchRegisteredEvents(authUser.email);
    }
  };

  const handleSignOut = () => {
    setIsGoogleSignedIn(false);
    setFormData(prev => ({ ...prev, fullName: '', email: '' }));
    setUserProfilePicture('');
    setMessage('');
    setLoadingRegisteredEvents(false);
    clearAuthToken();
  };

  useEffect(() => {
    const storedUser = getStoredAuthUser();
    if (storedUser) {
      setFormData(prev => ({
        ...prev,
        fullName: storedUser.name || '',
        email: storedUser.email || ''
      }));
      setIsGoogleSignedIn(true);
      if (storedUser.picture) {
        setUserProfilePicture(storedUser.picture);
      }
      fetchRegisteredEvents(storedUser.email);
    }
  }, []);

  useEffect(() => {
    const renderGoogleButton = () => {
      const buttonContainer = document.getElementById("googleSignInDiv");
      if (typeof google !== 'undefined' && buttonContainer) {
        try {
          const buttonWidth = Math.min(Math.max(buttonContainer.clientWidth || 250, 220), 400);
          buttonContainer.innerHTML = '';

          google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse
          });
          google.accounts.id.renderButton(
            buttonContainer,
            { theme: "filled_black", size: "large", width: buttonWidth, text: "continue_with" }
          );
        } catch (e) {
          console.error("Google Sign In Error:", e);
        }
      }
    };

    if (!isGoogleSignedIn) {
      if (typeof google !== 'undefined') {
        renderGoogleButton();
      } else {
        const interval = setInterval(() => {
          if (typeof google !== 'undefined') {
            renderGoogleButton();
            clearInterval(interval);
          }
        }, 500);
        return () => clearInterval(interval);
      }
    }
  }, [isGoogleSignedIn]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setMessage('Only PDF, JPG, and PNG files are accepted.');
        setStatus('error');
        e.target.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setMessage('File size must be less than 5MB.');
        setStatus('error');
        e.target.value = '';
        return;
      }
    }
    setter(file);
  };

  const validateForm = () => {
    if (!formData.teamName?.trim()) {
      setMessage("Please enter a team name.");
      setStatus('error');
      return false;
    }
    if (!formData.fullName?.trim()) {
      setMessage("Team leader name is required.");
      setStatus('error');
      return false;
    }
    if (!formData.email?.trim()) {
      setMessage("Leader email is required.");
      setStatus('error');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessage("Please enter a valid email address.");
      setStatus('error');
      return false;
    }
    if (!formData.phone?.trim()) {
      setMessage("Leader phone number is required.");
      setStatus('error');
      return false;
    }
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
      setMessage("Please enter a valid 10-digit phone number.");
      setStatus('error');
      return false;
    }
    if (!formData.college?.trim()) {
      setMessage("College name is required.");
      setStatus('error');
      return false;
    }

    // Validate all 5 team members
    const members = [
      formData.member1Name,
      formData.member2Name,
      formData.member3Name,
      formData.member4Name,
    ];
    for (let i = 0; i < members.length; i++) {
      if (!members[i]?.trim()) {
        setMessage(`Member ${i + 1} name is required. Team must have exactly 5 members (Leader + 4 Members).`);
        setStatus('error');
        return false;
      }
    }

    if (!formData.agreeToRules) {
      setMessage("You must agree to the rules and regulations to proceed.");
      setStatus('error');
      return false;
    }

    return true;
  };

  const processRegistration = async () => {
    setStatus('submitting');
    setMessage('');

    try {
      const uniqueId = `MBA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const payload: any = { ...formData, registrationId: uniqueId };

      const response = await submitRegistration(payload);
      if (response.status === 'success') {
        setStatus('success');
        setGeneratedRegId(uniqueId);
        setMessage(response.message || 'Registration successful!');
        setFormData(prev => ({
          ...prev,
          phone: '',
          college: '',
          department: '',
          year: '1',
          selectedEvents: [...MBA_EVENT_TITLES],
          teamName: '',
          member1Name: '',
          member2Name: '',
          member3Name: '',
          member4Name: '',
          accommodationRequired: 'no',
          agreeToRules: false,
        }));
        setCollegeIdFile(null);
        setPaymentScreenshotFile(null);
        fetchRegisteredEvents(formData.email, true);
      } else {
        setStatus('error');
        setMessage(response.message || 'Registration failed.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('An unexpected error occurred. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    await processRegistration();
  };

  const inputClasses = "w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-gray-600";
  const labelClasses = "text-xs font-bold text-secondary uppercase tracking-wider";

  return (
    <div className="pt-24 min-h-screen bg-darker flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-4xl bg-card/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] p-4 sm:p-6 md:p-10 relative z-10">
        <div className="text-center mb-6 md:mb-8 flex flex-col items-center">
          <img
            src="/logo.png"
            alt="Ranatantra Logo"
            className="h-20 md:h-28 w-auto mb-6 object-contain"
          />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 font-mono tracking-tighter uppercase">
            MBA Fest <span className="text-primary">Registration</span>
          </h1>
          <p className="text-gray-400 text-sm md:text-base">Register your MBA team to participate in the management events.</p>
        </div>

        {status === 'success' ? (
          <div className="bg-green-500/10 border border-green-500/50 rounded-xl p-8 text-center animate-pulse-slow">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Registration Successful!</h2>
            <p className="text-gray-300 mb-6">{message}</p>

            {generatedRegId && (
              <div className="bg-black/60 border border-primary/50 shadow-[0_0_20px_rgba(255,0,85,0.3)] rounded-xl py-6 px-4 mb-8 inline-block max-w-sm w-full relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-cyan-500"></div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                  <Sparkles className="w-3 h-3 text-primary" />
                  Your Registration ID
                  <Sparkles className="w-3 h-3 text-primary" />
                </p>
                <div className="bg-darker/80 border border-white/5 py-4 rounded-lg my-3">
                  <p className="text-3xl md:text-4xl font-black tracking-widest font-mono select-all flex justify-center items-center">
                    <span className="text-white">{generatedRegId.split('-')[0]}</span>
                    <span className="text-primary mx-2">-</span>
                    <span className="text-primary">{generatedRegId.split('-')[1]}</span>
                  </p>
                </div>
                <p className="text-xs text-secondary mt-3">Please save or screenshot this ID.</p>
              </div>
            )}

            <div>
              <button
                onClick={() => {
                  setStatus('idle');
                  setGeneratedRegId('');
                  setFormData(prev => ({
                    ...prev,
                    phone: '',
                    college: '',
                    department: '',
                    year: '1',
                    selectedEvents: [...MBA_EVENT_TITLES],
                    teamName: '',
                    member1Name: '',
                    member2Name: '',
                    member3Name: '',
                    member4Name: '',
                    member5Name: '',
                    accommodationRequired: 'no',
                    agreeToRules: false,
                  }));
                  setCollegeIdFile(null);
                  setPaymentScreenshotFile(null);
                }}
                className="mt-2 px-8 py-3 bg-darker hover:bg-black text-white border border-green-500/50 hover:border-green-400 rounded-lg transition-all font-bold tracking-wider"
              >
                REGISTER ANOTHER TEAM
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Login Enforcement Section */}
            {!isGoogleSignedIn && (
              <div className="bg-black/40 border border-primary/20 rounded-xl p-8 text-center space-y-6 animate-fade-in-up">
                <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(255,0,85,0.2)]">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Authentication Required</h2>
                  <p className="text-gray-400 text-sm max-w-xs mx-auto">Please sign in with your Google account to verify your identity and access the registration form.</p>
                </div>
                <div id="googleSignInDiv" className="h-[44px] w-full max-w-[250px] mx-auto"></div>
              </div>
            )}

            {isGoogleSignedIn && (
              <div className="animate-fade-in-up">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-primary/10 border border-primary/30 p-4 rounded-xl mb-6">
                  <div className="flex items-center gap-4 min-w-0">
                    {userProfilePicture ? (
                      <img src={userProfilePicture} alt="Profile" referrerPolicy="no-referrer" className="w-12 h-12 rounded-full border-2 border-primary" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        <User className="w-6 h-6" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Signed in as</p>
                      <p className="text-white font-bold break-words">{formData.fullName}</p>
                      <p className="text-xs text-secondary break-all">{formData.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="self-end sm:self-auto p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">

                  {/* ========== SECTION 1: TEAM INFORMATION ========== */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-bold text-white uppercase tracking-wider">Team Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Team Name */}
                      <div className="space-y-2">
                        <label className={labelClasses}>Team Name *</label>
                        <input
                          type="text"
                          name="teamName"
                          value={formData.teamName || ''}
                          onChange={handleChange}
                          placeholder="Enter your team name"
                          className={inputClasses}
                        />
                      </div>

                      {/* College Name */}
                      <div className="space-y-2">
                        <label className={labelClasses}>College Name *</label>
                        <input
                          type="text"
                          name="college"
                          value={formData.college}
                          onChange={handleChange}
                          placeholder="Enter your college name"
                          className={inputClasses}
                        />
                      </div>

                      {/* Team Leader Name */}
                      <div className="space-y-2">
                        <label className={labelClasses}>Team Leader Name *</label>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          className={inputClasses}
                        />
                      </div>

                      {/* Leader Email */}
                      <div className="space-y-2">
                        <label className={labelClasses}>Leader Email</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          readOnly
                          className="w-full bg-black/40 border border-white/5 rounded-lg px-4 py-3 text-gray-400 focus:outline-none cursor-not-allowed"
                        />
                      </div>

                      {/* Leader Phone */}
                      <div className="space-y-2">
                        <label className={labelClasses}>Leader Phone Number *</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="1234567890"
                          className={inputClasses}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ========== SECTION 2: TEAM MEMBERS ========== */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-bold text-white uppercase tracking-wider">Team Members</h3>
                      <span className="text-xs text-gray-500 ml-2">(exactly 4 members + Leader required)</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map((num) => (
                        <div key={num} className="space-y-2">
                          <label className={labelClasses}>Member {num} Name *</label>
                          <input
                            type="text"
                            name={`member${num}Name`}
                            value={(formData as any)[`member${num}Name`] || ''}
                            onChange={handleChange}
                            placeholder={`Enter member ${num} full name`}
                            className={inputClasses}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ========== SECTION 3: EVENT PARTICIPATION ========== */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-bold text-white uppercase tracking-wider">Event Participation</h3>
                    </div>
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
                      <p className="text-sm text-secondary font-bold mb-4 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Your team will automatically participate in all 3 events:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {EVENTS.map(event => (
                          <div
                            key={event.id}
                            className="bg-primary/10 border border-primary/30 shadow-[0_0_10px_rgba(255,0,85,0.1)] rounded-lg p-4"
                          >
                            <p className="font-bold text-white text-sm">{event.title}</p>
                            <p className="text-xs text-gray-400 mt-1">{event.date} • {event.time}</p>
                            <p className="text-xs text-gray-500 mt-1">{event.venue}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ========== SECTION 4: OTHER FIELDS ========== */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileCheck className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-bold text-white uppercase tracking-wider">Additional Details</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                      {/* Accommodation */}
                      <div className="space-y-3">
                        <label className={labelClasses}>Accommodation Required</label>
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="radio"
                              name="accommodationRequired"
                              value="yes"
                              checked={formData.accommodationRequired === 'yes'}
                              onChange={handleChange}
                              className="w-4 h-4 accent-primary"
                            />
                            <span className="text-white group-hover:text-primary transition-colors">Yes</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="radio"
                              name="accommodationRequired"
                              value="no"
                              checked={formData.accommodationRequired === 'no'}
                              onChange={handleChange}
                              className="w-4 h-4 accent-primary"
                            />
                            <span className="text-white group-hover:text-primary transition-colors">No</span>
                          </label>
                        </div>
                      </div>

                      {/* Spacer for grid alignment */}
                      <div></div>

                      {/* College ID Upload */}
                      <div className="space-y-2">
                        <label className={labelClasses}>Upload College ID *</label>
                        <div className="relative">
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileChange(e, setCollegeIdFile)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-gray-400 file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-bold file:bg-primary/20 file:text-primary hover:file:bg-primary/30 cursor-pointer focus:outline-none focus:border-primary transition-all"
                          />
                          {collegeIdFile && (
                            <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                              <FileCheck className="w-3 h-3" /> {collegeIdFile.name}
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2 italic flex items-center gap-1.5 px-1 font-bold">
                          <AlertCircle className="w-3 h-3 text-primary shrink-0" />
                          Note: Please upload all 5 team member ID cards in a single PDF file.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ========== RULES CHECKBOX ========== */}
                  <div className="bg-black/30 border border-white/5 rounded-xl p-5">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        name="agreeToRules"
                        checked={formData.agreeToRules || false}
                        onChange={handleChange}
                        className="w-5 h-5 mt-0.5 accent-primary rounded flex-shrink-0"
                      />
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                        I agree to the <span className="text-primary font-bold">rules and regulations</span> of the MBA Fest.
                        I confirm that all the information provided above is accurate, and my team has exactly 5 members (Leader + 4 Members). *
                      </span>
                    </label>
                  </div>

                  {/* Error Message */}
                  {status === 'error' && (
                    <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-4 rounded-lg border border-red-500/20">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <p className="text-sm">{message}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={status === 'submitting' || loadingRegisteredEvents}
                    className="w-full bg-primary hover:bg-white hover:text-primary disabled:bg-gray-800 disabled:text-gray-500 text-white font-black uppercase tracking-widest py-4 rounded-lg transition-all transform hover:scale-[1.01] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,0,85,0.4)] hover:shadow-[0_0_30px_rgba(255,0,85,0.6)]"
                  >
                    {status === 'submitting' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        PROCESSING...
                      </>
                    ) : (
                      <>
                        CONFIRM REGISTRATION <Sparkles className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
