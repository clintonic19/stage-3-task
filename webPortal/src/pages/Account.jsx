// src/pages/Account.jsx
import { useState, useEffect } from 'react';
import Navbar from '../components/commons/Navbar';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';

const Account = () => {
  const { user, role, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    company: '',
    location: '',
    website: '',
    notifications: {
      email: true,
      push: false,
      weeklyDigest: true
    }
  });
  const [apiKeys, setApiKeys] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState(null);

  useEffect(() => {
    fetchAccountData();
    fetchApiKeys();
    fetchSessions();
  }, []);

  const fetchAccountData = async () => {
    try {
      const response = await api.get('/account/profile');
      setFormData(response.data);
    } catch (error) {
      console.error('Failed to fetch account data:', error);
    }
  };

  const fetchApiKeys = async () => {
    try {
      const response = await api.get('/account/api-keys');
      setApiKeys(response.data);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await api.get('/account/sessions');
      setSessions(response.data);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/account/profile', formData);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Update failed:', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const form = e.target;
    const currentPassword = form.currentPassword.value;
    const newPassword = form.newPassword.value;
    const confirmPassword = form.confirmPassword.value;

    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/account/change-password', {
        currentPassword,
        newPassword
      });
      alert('Password changed successfully!');
      form.reset();
    } catch (error) {
      console.error('Password change failed:', error);
      alert('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!newApiKeyName.trim()) return;
    
    try {
      const response = await api.post('/account/api-keys', {
        name: newApiKeyName
      });
      setGeneratedKey(response.data.key);
      fetchApiKeys();
      setShowApiKeyModal(false);
      setNewApiKeyName('');
    } catch (error) {
      console.error('Failed to create API key:', error);
    }
  };

  const revokeApiKey = async (keyId) => {
    if (confirm('Are you sure you want to revoke this API key?')) {
      try {
        await api.delete(`/account/api-keys/${keyId}`);
        fetchApiKeys();
      } catch (error) {
        console.error('Failed to revoke API key:', error);
      }
    }
  };

  const revokeSession = async (sessionId) => {
    if (confirm('This will log out the device. Are you sure?')) {
      try {
        await api.delete(`/account/sessions/${sessionId}`);
        fetchSessions();
      } catch (error) {
        console.error('Failed to revoke session:', error);
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm('Are you absolutely sure? This action cannot be undone!')) {
      try {
        await api.delete('/account');
        logout();
      } catch (error) {
        console.error('Failed to delete account:', error);
      }
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'security', name: 'Security', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
    { id: 'api', name: 'API Keys', icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' },
    { id: 'sessions', name: 'Active Sessions', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'danger', name: 'Danger Zone', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your account settings, security preferences, and API keys
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="md:w-64">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 bg-white rounded-lg shadow">
            {activeTab === 'profile' && (
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
                <form onSubmit={handleProfileUpdate}>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Username
                      </label>
                      <input
                        type="text"
                        value={user?.username || ''}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                      />
                      <p className="mt-1 text-xs text-gray-500">Username cannot be changed</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      <textarea
                        rows={4}
                        value={formData.bio}
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Company
                        </label>
                        <input
                          type="text"
                          value={formData.company}
                          onChange={(e) => setFormData({...formData, company: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Location
                        </label>
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => setFormData({...formData, location: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Website
                      </label>
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({...formData, website: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.notifications?.email}
                            onChange={(e) => setFormData({
                              ...formData,
                              notifications: {...formData.notifications, email: e.target.checked}
                            })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">Email notifications</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.notifications?.push}
                            onChange={(e) => setFormData({
                              ...formData,
                              notifications: {...formData.notifications, push: e.target.checked}
                            })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">Push notifications</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.notifications?.weeklyDigest}
                            onChange={(e) => setFormData({
                              ...formData,
                              notifications: {...formData.notifications, weeklyDigest: e.target.checked}
                            })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">Weekly digest</span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
            
            {activeTab === 'security' && (
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-6">Security Settings</h2>
                
                <form onSubmit={handlePasswordChange}>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        name="currentPassword"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        name="newPassword"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Must be at least 8 characters long
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {loading ? 'Changing...' : 'Change Password'}
                      </button>
                    </div>
                  </div>
                </form>
                
                <div className="mt-8 pt-8 border-t">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Two-Factor Authentication</h3>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Enable 2FA
                  </button>
                </div>
              </div>
            )}
            
            {activeTab === 'api' && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">API Keys</h2>
                  <button
                    onClick={() => setShowApiKeyModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Generate New Key
                  </button>
                </div>
                
                {generatedKey && (
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <h3 className="text-sm font-medium text-yellow-800 mb-2">Your New API Key</h3>
                    <code className="block p-2 bg-white rounded text-sm mb-2 break-all">{generatedKey}</code>
                    <p className="text-sm text-yellow-700">
                      Make sure to copy this key now. You won't be able to see it again!
                    </p>
                    <button
                      onClick={() => navigator.clipboard.writeText(generatedKey)}
                      className="mt-2 px-3 py-1 bg-yellow-600 text-white rounded text-sm"
                    >
                      Copy to Clipboard
                    </button>
                  </div>
                )}
                
                <div className="space-y-3">
                  {apiKeys.map((key) => (
                    <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{key.name}</p>
                        <p className="text-sm text-gray-500">
                          Created: {new Date(key.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-400">
                          Last used: {key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                      <button
                        onClick={() => revokeApiKey(key.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
                
                {apiKeys.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No API keys generated yet
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'sessions' && (
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-6">Active Sessions</h2>
                
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{session.device || 'Unknown Device'}</p>
                          {session.isCurrent && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          Location: {session.location || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-400">
                          Last active: {new Date(session.lastActive).toLocaleString()}
                        </p>
                      </div>
                      {!session.isCurrent && (
                        <button
                          onClick={() => revokeSession(session.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'danger' && (
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-6 text-red-600">Danger Zone</h2>
                
                <div className="space-y-6">
                  <div className="p-4 border border-red-200 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Account</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Once you delete your account, there is no going back. This action is permanent.
                    </p>
                    <button
                      onClick={handleDeleteAccount}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Delete My Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Generate New API Key</h3>
              <input
                type="text"
                value={newApiKeyName}
                onChange={(e) => setNewApiKeyName(e.target.value)}
                placeholder="Key name (e.g., Production Server)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 mb-4"
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowApiKeyModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={createApiKey}
                  disabled={!newApiKeyName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Generate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Account;