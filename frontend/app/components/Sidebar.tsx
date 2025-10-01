'use client';
import React, { useState } from 'react';
import { Plus, MessageSquare, Edit3, Trash2, ChevronLeft, ChevronRight, User, LogOut, Settings, ChevronUp } from 'lucide-react';
import { useUser, useClerk } from '@clerk/nextjs';

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
  lastMessage: string | null;
}

interface SidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  isOpen: boolean;
  onToggle: () => void;
  onConversationSelect: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation?: (id: string) => void;
}

export default function Sidebar({
  conversations,
  currentConversationId,
  isOpen,
  onToggle,
  onConversationSelect,
  onNewChat,
  onDeleteConversation
}: SidebarProps) {
  const { user, isLoaded } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-gray-900 text-white z-30 transition-all duration-300 ease-in-out
        ${isOpen ? 'w-64' : 'w-0'} 
        lg:relative lg:z-10
        ${isOpen ? 'shadow-xl' : ''}
      `}>
        <div className="h-full flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <div 
                className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ backgroundColor: '#ff9a54' }}
              >
                <MessageSquare className="w-3 h-3 text-white" />
              </div>
              <h2 className="text-sm font-semibold">Researchy</h2>
            </div>
            <button
              onClick={onToggle}
              className="p-1 hover:bg-gray-700 rounded-md transition-colors"
            >
              {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-3">
            <button
              onClick={onNewChat}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
              style={{
                backgroundColor: '#ff9a54',
                color: 'white',
                background: 'linear-gradient(135deg, #ff9a54 0%, #e8844a 100%)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #e8844a 0%, #d9733f 100%)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #ff9a54 0%, #e8844a 100%)';
                e.currentTarget.style.transform = 'translateY(0px)';
              }}
            >
              <Plus className="w-4 h-4" />
              <span>New Chat</span>
            </button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto px-2">
            <div className="px-1 py-1">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
                Recent
              </h3>
              
              {conversations.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No conversations yet</p>
                  <p className="text-xs mt-1">Start a new research chat!</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => onConversationSelect(conversation.id)}
                      className={`
                        group relative cursor-pointer rounded-md p-2 mx-1 mb-1 transition-all duration-200
                        ${currentConversationId === conversation.id
                          ? 'bg-gray-700'
                          : 'hover:bg-gray-800'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className={`
                            text-xs font-medium truncate
                            ${currentConversationId === conversation.id ? 'text-white' : 'text-gray-200'}
                          `}>
                            {conversation.title || 'New Conversation'}
                          </h4>
                          
                        </div>
                        
                        {/* Delete Button */}
                        {onDeleteConversation && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteConversation(conversation.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 ml-1 p-1 hover:bg-red-600 rounded transition-all duration-200"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 relative">
            {isLoaded && user ? (
              <>
                {/* Profile Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute bottom-full left-3 right-3 mb-2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl overflow-hidden">
                    <button
                      onClick={() => {
                        openUserProfile();
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Profile Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        signOut();
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}

                {/* Profile Button */}
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-full flex items-center gap-3 mb-3 p-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  {user.imageUrl ? (
                    <img 
                      src={user.imageUrl} 
                      alt="User avatar"
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {user.firstName?.charAt(0) || user.emailAddresses[0]?.emailAddress.charAt(0) || 'U'}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-white truncate">
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : user.firstName || user.emailAddresses[0]?.emailAddress || 'User'
                      }
                    </p>
                  </div>
                  <ChevronUp 
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      showProfileMenu ? 'rotate-180' : ''
                    }`} 
                  />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-400 truncate">Loading...</p>
                  <p className="text-xs text-gray-500">Authenticating</p>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
      
      {/* Toggle button when sidebar is closed */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed top-4 left-4 z-20 p-3 bg-gray-800 text-gray-400 rounded-lg shadow-md hover:bg-gray-700 hover:text-gray-300 transition-all duration-200 border border-gray-700 hover:border-gray-600"
          title="Open sidebar"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </>
  );
}