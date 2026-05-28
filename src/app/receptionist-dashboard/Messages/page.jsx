'use client';
import { useState } from 'react';
import { FiSearch, FiMail, FiStar, FiTrash2, FiArchive, FiClock } from 'react-icons/fi';

export default function Messages() {
  const [activeTab, setActiveTab] = useState('inbox');
  const [selectedMessage, setSelectedMessage] = useState(null);

  const messages = [
    { 
      id: 1, 
      sender: "Dr. Smith", 
      avatar: "https://randomuser.me/api/portraits/med/men/75.jpg",
      message: "Patient report is ready for review. Please check the lab results when you get a chance.", 
      time: "10:30 AM", 
      date: "Today",
      unread: true,
      starred: false,
      attachments: 1
    },
    { 
      id: 2, 
      sender: "Nurse Jane", 
      avatar: "https://randomuser.me/api/portraits/med/women/68.jpg",
      message: "Mr. Johnson's appointment has been rescheduled to Friday at 2 PM due to his request.", 
      time: "Yesterday", 
      date: "May 15",
      unread: false,
      starred: true,
      attachments: 0
    },
    { 
      id: 3, 
      sender: "Admin Team", 
      avatar: "https://randomuser.me/api/portraits/med/women/32.jpg",
      message: "New clinic policy update: All staff must complete the HIPAA training by end of month.", 
      time: "2 days ago", 
      date: "May 14",
      unread: false,
      starred: false,
      attachments: 2
    },
    { 
      id: 4, 
      sender: "Dr. Rodriguez", 
      avatar: "https://randomuser.me/api/portraits/med/men/22.jpg",
      message: "Urgent: Need approval for patient medication refill. Please respond ASAP.", 
      time: "1 week ago", 
      date: "May 8",
      unread: false,
      starred: true,
      attachments: 0
    },
  ];

  const filteredMessages = messages.filter(msg => {
    if (activeTab === 'inbox') return true;
    if (activeTab === 'starred') return msg.starred;
    if (activeTab === 'unread') return msg.unread;
    return true;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 border-b border-blue-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-blue-800 flex items-center gap-2">
              <FiMail className="text-blue-600" /> Messages
            </h2>
            <p className="text-blue-600">You have {messages.filter(m => m.unread).length} unread messages</p>
          </div>
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search messages..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
            />
            <FiSearch className="absolute left-3 top-3 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`px-6 py-3 font-medium text-sm flex items-center gap-2 ${activeTab === 'inbox' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-blue-500'}`}
        >
          <FiMail /> Inbox
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            {messages.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('starred')}
          className={`px-6 py-3 font-medium text-sm flex items-center gap-2 ${activeTab === 'starred' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-blue-500'}`}
        >
          <FiStar /> Starred
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            {messages.filter(m => m.starred).length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('unread')}
          className={`px-6 py-3 font-medium text-sm flex items-center gap-2 ${activeTab === 'unread' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-blue-500'}`}
        >
          <FiClock /> Unread
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            {messages.filter(m => m.unread).length}
          </span>
        </button>
      </div>

      {/* Message List */}
      <div className="divide-y divide-gray-100">
        {filteredMessages.map((msg) => (
          <div
            key={msg.id}
            className={`p-4 hover:bg-blue-50 transition-colors duration-150 cursor-pointer ${selectedMessage === msg.id ? 'bg-blue-50' : ''} ${msg.unread ? 'font-semibold' : ''}`}
            onClick={() => setSelectedMessage(msg.id)}
          >
            <div className="flex items-start gap-4">
              <img
                src={msg.avatar}
                alt={msg.sender}
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className={`text-base truncate ${msg.unread ? 'text-blue-800' : 'text-gray-700'}`}>
                    {msg.sender}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 whitespace-nowrap">{msg.time}</span>
                    <button className="text-gray-400 hover:text-yellow-500">
                      <FiStar className={msg.starred ? 'fill-yellow-400 text-yellow-400' : ''} />
                    </button>
                  </div>
                </div>
                <p className={`text-sm mt-1 truncate ${msg.unread ? 'text-gray-800' : 'text-gray-600'}`}>
                  {msg.message}
                </p>
                {msg.attachments > 0 && (
                  <div className="mt-2 flex items-center gap-1">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {msg.attachments} attachment{msg.attachments > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredMessages.length === 0 && (
        <div className="p-8 text-center">
          <div className="mx-auto w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <FiMail className="text-blue-400 text-3xl" />
          </div>
          <h3 className="text-lg font-medium text-gray-700">No messages found</h3>
          <p className="text-gray-500 mt-1">Try changing your filters or search term</p>
        </div>
      )}

      {/* Message Actions Bar */}
      <div className="bg-gray-50 p-3 border-t border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full">
            <FiArchive className="text-sm" />
          </button>
          <button className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full">
            <FiTrash2 className="text-sm" />
          </button>
        </div>
        <div className="text-xs text-gray-500">
          Showing {filteredMessages.length} of {messages.length} messages
        </div>
      </div>
    </div>
  );
}
