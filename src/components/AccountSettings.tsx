import { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut, User, sendEmailVerification, updateProfile } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Switch } from '@headlessui/react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const US_STATES = [
  { name: 'Alabama', cities: ['Birmingham', 'Montgomery', 'Mobile'] },
  { name: 'California', cities: ['Los Angeles', 'San Francisco', 'San Diego'] },
  { name: 'New York', cities: ['New York City', 'Buffalo', 'Rochester'] },
  { name: 'Texas', cities: ['Houston', 'Dallas', 'Austin'] },
  { name: 'Florida', cities: ['Miami', 'Orlando', 'Tampa'] },
  // ...add more as needed
];

const AccountSettings = () => {
  const [user, setUser] = useState<User | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [personalInfoLoading, setPersonalInfoLoading] = useState(false);
  const [personalInfoSaved, setPersonalInfoSaved] = useState(false);
  const [showPersonal, setShowPersonal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAppSettings, setShowAppSettings] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.displayName?.split(' ')[0] || '');
    setLastName(user.displayName?.split(' ')[1] || '');
    const fetchProfile = async () => {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setState(docSnap.data().state || '');
        setPhone(docSnap.data().phone || '');
        setZip(docSnap.data().zip || '');
      }
    };
    fetchProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const handleResendVerification = async () => {
    setVerificationError(null);
    setVerificationSent(false);
    if (user) {
      try {
        await sendEmailVerification(user);
        setVerificationSent(true);
      } catch (err: any) {
        setVerificationError('Failed to send verification email.');
      }
    }
  };

  const isEmailPasswordUser = user?.providerData.some(p => p.providerId === 'password');

  const handleSavePersonalInfo = async () => {
    if (!user) return;
    setPersonalInfoLoading(true);
    setPersonalInfoSaved(false);
    try {
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`.trim(),
      });
      await setDoc(doc(db, 'users', user.uid), { state, phone, zip }, { merge: true });
      setPersonalInfoSaved(true);
    } catch (e) {
      // Optionally handle error
    }
    setPersonalInfoLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="relative max-w-md w-full space-y-8 bg-white rounded-2xl shadow-2xl p-10 border border-gray-100">
        <button
          onClick={() => navigate(-1)}
          className="absolute -top-4 -left-4 flex items-center px-3 py-1.5 bg-white border border-gray-200 rounded-full shadow hover:bg-gray-50 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-blue-600 mr-1" />
          <span className="text-blue-600 font-medium">Back</span>
        </button>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-8 text-center tracking-tight">Account Settings</h2>
        {user ? (
          <div className="space-y-6 flex flex-col h-full">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-200 to-purple-200 flex items-center justify-center text-3xl font-bold text-blue-700 mb-3 shadow">
                {user.displayName ? user.displayName[0] : user.email?.[0]}
              </div>
              <div className="text-xl font-semibold text-gray-800">{user.displayName || user.email}</div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </div>
            {isEmailPasswordUser && !user.emailVerified && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-yellow-800 font-semibold">Account not confirmed</div>
                    <div className="text-yellow-700 text-sm mt-1">Your email address is not verified. Please check your inbox or spam folder for a confirmation link.</div>
                  </div>
                  <button
                    onClick={handleResendVerification}
                    className="ml-4 px-3 py-1.5 bg-yellow-400 text-yellow-900 rounded font-semibold hover:bg-yellow-500 transition-colors"
                  >
                    Resend Confirmation Link
                  </button>
                </div>
                {verificationSent && <div className="text-green-600 text-sm mt-2">Verification email sent!</div>}
                {verificationError && <div className="text-red-600 text-sm mt-2">{verificationError}</div>}
              </div>
            )}
            <div className="mb-4">
              <button
                className="w-full flex justify-between items-center px-4 py-3 bg-gray-100 rounded-t-lg text-left text-lg font-semibold text-gray-700 hover:bg-gray-200 focus:outline-none"
                onClick={() => setShowPersonal((v) => !v)}
              >
                <span>Personal Information</span>
                <span>{showPersonal ? '▲' : '▼'}</span>
              </button>
              {showPersonal && (
                <div className="bg-gray-50 p-5 rounded-b-lg border border-dashed border-gray-200 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input type="text" className="w-full rounded border-gray-300 focus:ring-blue-500 focus:border-blue-500" value={firstName} onChange={e => setFirstName(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input type="text" className="w-full rounded border-gray-300 focus:ring-blue-500 focus:border-blue-500" value={lastName} onChange={e => setLastName(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input type="text" className="w-full rounded border-gray-300 focus:ring-blue-500 focus:border-blue-500" value={phone} onChange={e => setPhone(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <select
                        className="w-full rounded border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        value={state}
                        onChange={e => setState(e.target.value)}
                      >
                        <option value="">Select a state</option>
                        {US_STATES.map(s => (
                          <option key={s.name} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                      <input type="text" className="w-full rounded border-gray-300 focus:ring-blue-500 focus:border-blue-500" value={zip} onChange={e => setZip(e.target.value)} />
                    </div>
                  </div>
                  <button
                    onClick={handleSavePersonalInfo}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 transition-colors"
                    disabled={personalInfoLoading}
                  >
                    {personalInfoLoading ? 'Saving...' : 'Save'}
                  </button>
                  {personalInfoSaved && <div className="text-green-600 text-sm mt-2">Personal information saved!</div>}
                </div>
              )}
            </div>
            <div className="mb-4">
              <button
                className="w-full flex justify-between items-center px-4 py-3 bg-gray-100 rounded-t-lg text-left text-lg font-semibold text-gray-700 hover:bg-gray-200 focus:outline-none"
                onClick={() => setShowNotifications((v) => !v)}
              >
                <span>Notifications</span>
                <span>{showNotifications ? '▲' : '▼'}</span>
              </button>
              {showNotifications && (
                <div className="flex items-center justify-between bg-gray-50 p-5 rounded-b-lg border border-dashed border-gray-200">
                  <span className="text-base text-gray-700">Email Notifications</span>
                  <Switch
                    checked={emailNotifications}
                    onChange={setEmailNotifications}
                    className={`${emailNotifications ? 'bg-blue-600' : 'bg-gray-300'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                  >
                    <span className="sr-only">Enable email notifications</span>
                    <span
                      className={`${emailNotifications ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                    />
                  </Switch>
                </div>
              )}
            </div>
            <div className="mb-8">
              <button
                className="w-full flex justify-between items-center px-4 py-3 bg-gray-100 rounded-t-lg text-left text-lg font-semibold text-gray-700 hover:bg-gray-200 focus:outline-none"
                onClick={() => setShowAppSettings((v) => !v)}
              >
                <span>App Settings</span>
                <span>{showAppSettings ? '▲' : '▼'}</span>
              </button>
              {showAppSettings && (
                <div className="bg-gray-50 p-5 rounded-b-lg text-gray-500 text-base border border-dashed border-gray-200">
                  (Settings coming soon)
                </div>
              )}
            </div>
            <div className="flex-1" />
            <button
              onClick={handleSignOut}
              className="w-full py-2 px-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-semibold hover:from-red-600 hover:to-pink-600 shadow transition-colors mt-8"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="text-center text-gray-500">Loading user info...</div>
        )}
      </div>
    </div>
  );
};

export default AccountSettings; 