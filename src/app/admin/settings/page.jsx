'use client';
import { useState, useEffect } from 'react'
import { 
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Database,
  Key,
  Mail,
  Phone,
  MapPin,
  Camera,
  Save,
  Eye,
  EyeOff,
  Upload,
  Download,
  Trash2,
  CheckCircle,
  AlertCircle,
  Moon,
  Sun,
  Monitor,
  Volume2,
  VolumeX,
  Lock,
  Unlock,
  CreditCard,
  Users,
  Settings as SettingsIcon,
  HelpCircle
} from 'lucide-react'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    appointmentReminders: true,
    systemUpdates: true,
    marketingEmails: false
  })
  
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    position: "Administrator",
    department: "IT",
    location: "",
    bio: "",
    avatar: null
  });

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const nameParts = (user.name || "").split(" ");
        setProfileData(prev => ({
          ...prev,
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" ") || "",
          email: user.email || "",
          phone: user.phone || ""
        }));
      } catch (e) {
        console.error("Error parsing user data", e);
      }
    }
  }, []);

  const [securitySettings, setSecuritySettings] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
    sessionTimeout: '30',
    loginAlerts: true
  })

  const [systemSettings, setSystemSettings] = useState({
    language: 'en',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',
    autoSave: true,
    dataRetention: '365'
  })

  const [saveStatus, setSaveStatus] = useState('')

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    
  ]

  const handleProfileUpdate = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
  }

  const handleNotificationToggle = (setting) => {
    setNotifications(prev => ({ ...prev, [setting]: !prev[setting] }))
  }

  const handleSecurityUpdate = (field, value) => {
    setSecuritySettings(prev => ({ ...prev, [field]: value }))
  }

  const handleSystemUpdate = (field, value) => {
    setSystemSettings(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async (section) => {
    setSaveStatus('saving')
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus(''), 3000)
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => handleProfileUpdate('avatar', e.target.result)
      reader.readAsDataURL(file)
    }
  }

  const renderProfile = () => (
    <div className="space-y-6">
      {/* Profile Picture */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Picture</h3>
        <div className="flex items-center space-x-6">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden">
              {profileData.avatar ? (
                <img src={profileData.avatar} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <span className="text-white font-semibold text-xl">
                  {profileData.firstName[0]}{profileData.lastName[0]}
                </span>
              )}
            </div>
            <label className="absolute bottom-0 right-0 h-6 w-6 bg-indigo-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-indigo-600 transition-colors">
              <Camera className="h-3 w-3 text-white" />
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{profileData.firstName} {profileData.lastName}</h4>
            <p className="text-sm text-gray-600">{profileData.position}</p>
            <p className="text-xs text-gray-500 mt-1">JPG, PNG up to 2MB</p>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input
              type="text"
              value={profileData.firstName}
              onChange={(e) => handleProfileUpdate('firstName', e.target.value)}
              className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input
              type="text"
              value={profileData.lastName}
              onChange={(e) => handleProfileUpdate('lastName', e.target.value)}
              className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={profileData.email}
              onChange={(e) => handleProfileUpdate('email', e.target.value)}
              className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={profileData.phone}
              onChange={(e) => handleProfileUpdate('phone', e.target.value)}
              className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
            <input
              type="text"
              value={profileData.position}
              onChange={(e) => handleProfileUpdate('position', e.target.value)}
              className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={profileData.department}
              onChange={(e) => handleProfileUpdate('department', e.target.value)}
              className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            >
              <option value="IT">IT</option>
              <option value="Administration">Administration</option>
              <option value="Medical">Medical</option>
              <option value="Finance">Finance</option>
              <option value="HR">Human Resources</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={profileData.location}
              onChange={(e) => handleProfileUpdate('location', e.target.value)}
              className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={profileData.bio}
              onChange={(e) => handleProfileUpdate('bio', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button
            onClick={() => handleSave('profile')}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
        </div>

        {/* Main Content - now full width without sidebar */}
        <div>
          {activeTab === 'profile' && renderProfile()}
          {activeTab === 'notifications' && renderNotifications()}
          {activeTab === 'security' && renderSecurity()}
          {activeTab === 'appearance' && renderAppearance()}
          {activeTab === 'system' && renderSystem()}
          {activeTab === 'data' && renderDataPrivacy()}
        </div>

        {/* Save Status */}
        {saveStatus && (
          <div className={`fixed bottom-6 right-6 px-4 py-2 rounded-xl shadow-lg flex items-center ${
            saveStatus === 'saving' ? 'bg-yellow-100 text-yellow-800' :
            saveStatus === 'saved' ? 'bg-green-100 text-green-800' : ''
          }`}>
            {saveStatus === 'saving' && (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
                Saving...
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Changes saved!
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

