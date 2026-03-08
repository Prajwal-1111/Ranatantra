import React, { useEffect, useRef, useState } from 'react';
import { EVENTS, GOOGLE_CLIENT_ID, MBA_EVENT_TITLES, BACKEND_URL } from '../constants';
import { useLocation } from 'react-router-dom';

import { getRegistrations, submitRegistration } from '../services/googleSheets';
import { clearAuthToken, getAuthUserFromToken, getStoredAuthUser, persistAuthToken } from '../services/authSession';
import { RegistrationFormData } from '../types';
import { CheckCircle, AlertCircle, Loader2, Sparkles, User, LogOut, Users, Upload, FileCheck, Shield } from 'lucide-react';

// Declare google global for TypeScript
declare const google: any;

type PreparedCollegeIdFile = {
  base64: string;
  fileName: string;
  contentType: string;
};

type RegistrationSyncState = 'idle' | 'syncing' | 'completed' | 'delayed';

const ensureCashfreeLoaded = async (): Promise<void> => {
  if ((window as any).Cashfree) return;

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector('script[src="https://sdk.cashfree.com/js/v3/cashfree.js"]') as HTMLScriptElement | null;

    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Cashfree script.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Cashfree script.'));
    document.body.appendChild(script);
  });
};

const readCollegeIdFile = (file: File): Promise<PreparedCollegeIdFile> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;
      resolve({
        base64: result.split(',')[1],
        fileName: file.name,
        contentType: file.type
      });
    };

    reader.onerror = () => reject(new Error('Failed to read college ID file.'));
    reader.readAsDataURL(file);
  });

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
  const [fileBase64, setFileBase64] = useState<PreparedCollegeIdFile | null>(null);
  const [registrationSyncState, setRegistrationSyncState] = useState<RegistrationSyncState>('idle');
  const [lastPaymentId, setLastPaymentId] = useState('');
  const paymentHandledRef = useRef(false);

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const fetchRegisteredEvents = async (email: string, forceRefresh = false) => {
    if (!email) return;
    setLoadingRegisteredEvents(true);
    await getRegistrations(email, forceRefresh);
    setLoadingRegisteredEvents(false);
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.fullName?.trim() || !formData.email?.trim() || !formData.teamName?.trim() || !formData.college?.trim() || !formData.phone?.trim()) {
        setMessage("Please fill all required team information.");
        setStatus('error');
        return;
      }
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
        setMessage("Please enter a valid 10-digit phone number.");
        setStatus('error');
        return;
      }
    } else if (currentStep === 2) {
      const members = [formData.member1Name, formData.member2Name, formData.member3Name, formData.member4Name];
      for (let i = 0; i < members.length; i++) {
        if (!members[i]?.trim()) {
          setMessage(`Please enter Member ${i + 1}'s name.`);
          setStatus('error');
          return;
        }
      }
    }
    setMessage("");
    setStatus('idle');
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    setRegistrationSyncState('idle');
    setGeneratedRegId('');
    setLastPaymentId('');
    paymentHandledRef.current = false;
    clearAuthToken();
    setCurrentStep(1);
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
    if (status === 'error') setStatus('idle');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      setCollegeIdFile(file);
      try {
        setFileBase64(await readCollegeIdFile(file));
      } catch (error: any) {
        setCollegeIdFile(null);
        setFileBase64(null);
        e.target.value = '';
        setMessage(error.message || 'Failed to process the uploaded file.');
        setStatus('error');
        return;
      }
    } else {
      setCollegeIdFile(null);
      setFileBase64(null);
    }
    if (status === 'error') setStatus('idle');
  };

  const validateFinalForm = () => {
    if (!formData.agreeToRules) {
      setMessage("You must agree to the rules and regulations to proceed.");
      setStatus('error');
      return false;
    }
    if (!collegeIdFile) {
      setMessage("Please upload your college ID.");
      setStatus('error');
      return false;
    }
    return true;
  };

  const processRegistration = async () => {
    const uniqueId = `MBA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setGeneratedRegId(uniqueId);
    setRegistrationSyncState('idle');
    setLastPaymentId('');
    paymentHandledRef.current = false;

    setStatus('submitting');
    setMessage('Connecting to Gateway...');

    try {
      await ensureCashfreeLoaded();

      const createOrderRes = await fetch(`${BACKEND_URL}/api/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedEventIds: EVENTS.map((event) => event.id),
          currency: 'INR',
          email: formData.email,
          phone: formData.phone,
          name: formData.fullName
        })
      });

      const orderData = await createOrderRes.json();
      if (!createOrderRes.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to initialize payment.');
      }

      const cashfree = (window as any).Cashfree({ mode: "production" });

      const checkoutOptions = {
        paymentSessionId: orderData.payment_session_id,
        redirectTarget: "_modal",
      };

      cashfree.checkout(checkoutOptions).then(async (result: any) => {
        if (result.error) {
          paymentHandledRef.current = true;
          setStatus('error');
          setMessage(result.error.message || 'Payment cancelled or failed.');
        } else if (result.paymentDetails) {
          paymentHandledRef.current = true;
          setMessage('Verifying Payment...');
          try {
            const verifyRes = await fetch(`${BACKEND_URL}/api/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ order_id: orderData.order_id })
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error('Payment verification failed.');
            }

            setLastPaymentId(orderData.order_id);
            setStatus('success');
            setRegistrationSyncState('syncing');
            setMessage('Payment successful. Your registration ID is ready below while we finish syncing your team details.');
            void finalizeGoogleRegistration(orderData.order_id, uniqueId);
          } catch (err: any) {
            setStatus('error');
            setMessage(err.message || 'Payment verification failed.');
          }
        }
      });

    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'An unexpected error occurred. Please try again.');
    }
  };

  const finalizeGoogleRegistration = async (paymentId: string, uniqueId: string) => {
    try {
      let preparedFile = fileBase64;

      if (!preparedFile && collegeIdFile) {
        preparedFile = await readCollegeIdFile(collegeIdFile);
        setFileBase64(preparedFile);
      }

      const payload: any = {
        ...formData,
        registrationId: uniqueId,
        collegeIdFile: preparedFile,
        paymentId: paymentId
      };

      const response = await submitRegistration(payload);

      if (response.status === 'success') {
        setRegistrationSyncState('completed');
        setMessage('Payment successful and registration confirmed. Your digital pass will be available shortly.');

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
        setFileBase64(null);
        void fetchRegisteredEvents(formData.email, true);
      } else {
        setRegistrationSyncState('delayed');
        setMessage(response.message || `Payment successful. Registration sync is taking longer than expected. Keep this Payment ID safe: ${paymentId}`);
      }
    } catch (error) {
      setRegistrationSyncState('delayed');
      setMessage('Payment successful. Registration sync is still pending. Please keep this Payment ID safe: ' + paymentId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateFinalForm()) return;
    processRegistration();
  };

  const inputClasses = "w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-gray-600 sm:text-base text-sm";
  const labelClasses = "text-xs font-bold text-secondary uppercase tracking-wider mb-1 block";

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-10 space-x-2 sm:space-x-4">
      {[1, 2, 3].map((step) => (
        <React.Fragment key={step}>
          <div className={`flex flex-col items-center relative`}>
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300 ${currentStep >= step ? 'bg-primary text-white shadow-[0_0_15px_rgba(255,0,85,0.5)]' : 'bg-white/10 text-gray-500 border border-white/5'}`}>
              {step}
            </div>
            <span className={`absolute -bottom-6 text-[8px] sm:text-[10px] font-black uppercase tracking-tighter whitespace-nowrap ${currentStep === step ? 'text-primary' : 'text-gray-500'}`}>
              {step === 1 ? 'Team' : step === 2 ? 'Members' : 'Finalize'}
            </span>
          </div>
          {step < 3 && (
            <div className={`w-8 sm:w-20 h-[2px] transition-all duration-500 ${currentStep > step ? 'bg-primary' : 'bg-white/10'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="pt-24 min-h-screen bg-darker flex items-center justify-center p-3 sm:p-4 md:p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-2xl bg-card/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] px-4 py-8 sm:p-8 md:p-10 relative z-10 transition-all duration-500">
        <div className="text-center mb-8 flex flex-col items-center">
          <img
            src="/logo.png"
            alt="Ranatantra Logo"
            className="h-20 sm:h-24 w-auto mb-4 object-contain animate-float"
          />
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-2 font-mono tracking-tighter uppercase">
            Fast <span className="text-primary">Registration</span>
          </h1>
          <p className="text-gray-400 text-[10px] sm:text-sm">Quickly register your MBA team for Ranatantra 2026.</p>
        </div>

        {status === 'success' ? (
          <div className="bg-green-500/10 border border-green-500/50 rounded-xl p-6 sm:p-8 text-center animate-fade-in">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              {registrationSyncState === 'syncing' ? 'Payment Received' : 'Success!'}
            </h2>
            <p className="text-gray-300 mb-6 text-sm">{message}</p>

            {generatedRegId && (
              <div className="bg-black/60 border border-primary/50 shadow-[0_0_20px_rgba(255,0,85,0.3)] rounded-xl py-6 px-4 mb-8 inline-block w-full relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-cyan-500"></div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Registration ID</p>
                <div className="bg-darker/80 border border-white/5 py-4 rounded-lg">
                  <p className="text-2xl sm:text-3xl font-black tracking-widest font-mono select-all text-white">
                    {generatedRegId}
                  </p>
                </div>
              </div>
            )}

            {lastPaymentId && (
              <div className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 mb-6">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Payment ID</p>
                <p className="text-sm font-mono text-secondary break-all">{lastPaymentId}</p>
              </div>
            )}

            {registrationSyncState === 'syncing' && (
              <div className="flex items-center justify-center gap-3 bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 mb-6 text-left">
                <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
                <p className="text-xs text-gray-300">
                  Final registration sync is still running. Keep this page open for a few seconds.
                </p>
              </div>
            )}

            {registrationSyncState === 'delayed' && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 mb-6 text-left">
                <p className="text-xs text-yellow-200">
                  Payment is already received. If confirmation email or dashboard entry does not appear soon, contact support with the Payment ID above.
                </p>
              </div>
            )}

            {registrationSyncState !== 'syncing' && (
              <button
                onClick={() => {
                  setStatus('idle');
                  setCurrentStep(1);
                  setRegistrationSyncState('idle');
                  setMessage('');
                  setGeneratedRegId('');
                  setLastPaymentId('');
                  paymentHandledRef.current = false;
                }}
                className="w-full py-4 bg-primary text-white rounded-lg font-bold tracking-widest hover:bg-white hover:text-primary transition-colors"
              >
                REGISTER ANOTHER TEAM
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {!isGoogleSignedIn ? (
              <div className="bg-black/40 border border-primary/20 rounded-xl p-8 text-center space-y-6 animate-fade-in-up">
                <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(255,0,85,0.2)]">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Unlock Form</h2>
                <div id="googleSignInDiv" className="h-[44px] w-full max-w-[250px] mx-auto"></div>
              </div>
            ) : (
              <div className="animate-fade-in">
                {renderStepIndicator()}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {currentStep === 1 && (
                    <div className="space-y-4 animate-slide-in-right">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1">
                          <label className={labelClasses}>Team Leader Name *</label>
                          <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Your Full Name" className={inputClasses} />
                        </div>
                        <div className="space-y-1">
                          <label className={labelClasses}>Team Leader Email *</label>
                          <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="leader@example.com" className={inputClasses} />
                        </div>
                        <div className="space-y-1">
                          <label className={labelClasses}>Team Name *</label>
                          <input type="text" name="teamName" value={formData.teamName} onChange={handleChange} placeholder="Elite Warriors" className={inputClasses} />
                        </div>
                        <div className="space-y-1">
                          <label className={labelClasses}>College Name *</label>
                          <input type="text" name="college" value={formData.college} onChange={handleChange} placeholder="JCET Hubballi" className={inputClasses} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className={labelClasses}>Leader Phone *</label>
                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="10-digit number" className={inputClasses} />
                          </div>
                          <div className="space-y-1">
                            <label className={labelClasses}>Accommodation</label>
                            <select name="accommodationRequired" value={formData.accommodationRequired} onChange={handleChange} className={inputClasses}>
                              <option value="no">No</option>
                              <option value="yes">Yes</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-4 animate-slide-in-right">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Add 4 Team Members (Required)</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map(num => (
                          <div key={num} className="space-y-1">
                            <label className={labelClasses}>Member {num} Name *</label>
                            <input type="text" name={`member${num}Name`} value={(formData as any)[`member${num}Name`]} onChange={handleChange} placeholder="Full Name" className={inputClasses} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-6 animate-slide-in-right">
                      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 sm:p-5 space-y-4">
                        <p className="text-sm font-bold text-white flex items-center gap-2">
                          <Shield className="w-4 h-4 text-primary" /> Final Confirmation
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className={labelClasses}>College ID (PDF/JPG) *</label>
                            <p className="text-[9px] text-gray-500 mb-1 -mt-1 uppercase tracking-tighter">Merge all 5 member IDs into 1 single PDF file</p>
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="w-full text-[10px] text-gray-400 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-primary/20 file:text-primary file:font-bold cursor-pointer" />
                            {collegeIdFile && <p className="text-[10px] text-green-400 font-bold truncate">{collegeIdFile.name}</p>}
                          </div>
                        </div>

                        <div className="pt-2">
                          <label className="flex items-start gap-3 cursor-pointer group">
                            <input type="checkbox" name="agreeToRules" checked={formData.agreeToRules} onChange={handleChange} className="w-5 h-5 mt-0.5 accent-primary rounded flex-shrink-0" />
                            <span className="text-[10px] sm:text-xs text-gray-300 group-hover:text-white transition-colors">
                              I confirm all details are correct and my team has 5 members.
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {status === 'error' && (
                    <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-500/20 animate-shake">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <p className="text-[10px] sm:text-xs font-bold">{message}</p>
                    </div>
                  )}

                  {status === 'submitting' && (
                    <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 text-center animate-pulse">
                      <Loader2 className="w-10 h-10 text-primary mx-auto mb-4 animate-spin" />
                      <h3 className="text-lg font-bold text-white mb-2">Generating Your Pass...</h3>
                      <div className="text-[10px] font-mono text-primary bg-black/40 py-2 px-3 rounded inline-block mb-3 border border-primary/20">
                        PENDING ID: {generatedRegId}
                      </div>
                      <p className="text-xs text-gray-400">{message}</p>
                    </div>
                  )}

                  <div className={`flex gap-3 pt-4 ${status === 'submitting' ? 'hidden' : ''}`}>
                    {currentStep > 1 && (
                      <button type="button" onClick={prevStep} className="flex-1 py-3 sm:py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg border border-white/10 transition-all text-xs sm:text-base">
                        BACK
                      </button>
                    )}

                    {currentStep < totalSteps ? (
                      <button type="button" onClick={nextStep} className="flex-[2] py-3 sm:py-4 bg-primary text-white font-black tracking-widest rounded-lg shadow-[0_0_20px_rgba(255,0,85,0.3)] hover:scale-[1.01] transition-all text-xs sm:text-base">
                        NEXT STEP
                      </button>
                    ) : (
                      <button type="submit" className="flex-[2] py-3 sm:py-4 bg-primary text-white font-black tracking-widest rounded-lg shadow-[0_0_20px_rgba(255,0,85,0.3)] hover:scale-[1.01] transition-all flex items-center justify-center gap-2 text-xs sm:text-base">
                        CONFIRM <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    )}
                  </div>
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
