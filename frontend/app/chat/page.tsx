'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, MessageSquare, Download, FileText, ChevronDown } from 'lucide-react';
import Sidebar from '../components/Sidebar';
// CLERK AUTH COMMENTED OUT - Uncomment when ready to use authentication
// import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

// Force localhost for development
const API_BASE = 'http://localhost:3001';

// Function to get user-friendly tool descriptions
const getToolDescription = (toolName: string): string => {
  const toolDescriptions: { [key: string]: string } = {
    'arxiv_search': '[SEARCH] Searching arXiv for research papers...',
    'read_pdf': '[READ] Reading and extracting text from research paper...',
    'render_latex_pdf': '[WRITE] Writing and generating research paper PDF...',
    'search_papers': '[SEARCH] Searching for research papers...',
    'web_search': '[WEB] Searching the web...',
    'analyze': '[ANALYZE] Analyzing content...',
    'unknown': '[PROCESS] Processing request...'
  };

  return toolDescriptions[toolName] || `[TOOL] Using ${toolName}...`;
};

// Function to extract PDF filenames from AI responses
const extractPDFFilenames = (content: string): string[] => {
  // Look for patterns like "paper_20231215_143022.pdf" or mentions of PDF files
  const pdfPatterns = [
    /paper_\d{8}_\d{6}\.pdf/g,                    // paper_20231215_143022.pdf
    /generated_paper_\d{8}_\d{6}\.pdf/g,         // generated_paper_20231215_143022.pdf
    /research_paper_\d{8}_\d{6}\.pdf/g,          // research_paper_20231215_143022.pdf
    /\b\w+_paper_\d{8}_\d{6}\.pdf/g,            // any_paper_20231215_143022.pdf
    /\b[\w\-]+_\d{8}_\d{6}\.pdf/g,              // filename_20231215_143022.pdf
    /\b[\w\-]{3,}\.pdf\b/g                       // any filename.pdf (at least 3 chars)
  ];
  
  const foundPDFs: string[] = [];
  
  pdfPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      foundPDFs.push(...matches);
    }
  });
  
  // Remove duplicates and filter out common false positives
  const filteredPDFs = [...new Set(foundPDFs)].filter(pdf => {
    // Filter out very generic or likely false positive PDF names
    const filename = pdf.toLowerCase();
    return !filename.includes('example') && 
           !filename.includes('sample') && 
           filename.length > 6; // At least "xx.pdf"
  });
  
  return filteredPDFs;
};

// Function to download PDF with improved error handling
const downloadPDF = async (filename: string) => {
  try {
    // Show loading state
    console.log(`Downloading ${filename}...`);
    
    const response = await fetch(`${API_BASE}/api/research/papers/${filename}`, {
      credentials: 'include',
      headers: {
        'Accept': 'application/pdf',
      },
    });
    
    if (!response.ok) {
      // Try to get error details from response
      let errorDetail = '';
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || errorData.error || '';
      } catch {
        // If response is not JSON, use status text
        errorDetail = response.statusText;
      }
      
      if (response.status === 404) {
        throw new Error(`PDF file not found: ${errorDetail}`);
      } else if (response.status === 401) {
        throw new Error('You need to be logged in to download this file.');
      } else {
        throw new Error(`Failed to download PDF (${response.status}): ${errorDetail}`);
      }
    }
    
    // Verify content type
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/pdf')) {
      console.warn('Warning: Downloaded file may not be a PDF, content-type:', contentType);
    }
    
    // Create blob and download
    const blob = await response.blob();
    
    // Verify blob has content
    if (blob.size === 0) {
      throw new Error('Downloaded file is empty');
    }
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    console.log(`Successfully downloaded ${filename} (${blob.size} bytes)`);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    // More user-friendly error messages
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    alert(`Failed to download PDF: ${errorMessage}`);
  }
};

// Component to format AI messages with proper styling
const FormattedMessage = ({ content }: { content: string }) => {
  // Check for PDF files in content
  const pdfFiles = extractPDFFilenames(content);
  const [downloadingFiles, setDownloadingFiles] = React.useState<Set<string>>(new Set());
  
  // Format the content with proper styling
  const formatContent = (text: string) => {
    // Split into lines for processing
    const lines = text.split('\n');
    const formattedLines: JSX.Element[] = [];
    
    lines.forEach((line, index) => {
      // Headers (lines starting with ##, ###, etc.)
      if (line.match(/^#{1,6}\s/)) {
        const level = line.match(/^#{1,6}/)?.[0].length || 1;
        const text = line.replace(/^#{1,6}\s/, '');
        formattedLines.push(
          <div key={index} className={`font-semibold mb-3 mt-6 first:mt-0 leading-[1.6] ${
            level === 1 ? 'text-[17px] text-gray-100' : level === 2 ? 'text-[16px] text-gray-100' : 'text-[15px] text-gray-200'
          }`}>
            {text}
          </div>
        );
      }
      // Bold text (**text**)
      else if (line.includes('**')) {
        const parts = line.split(/(\*\*.*?\*\*)/);
        formattedLines.push(
          <div key={index} className="mb-3 leading-[1.6] text-[15px]">
            {parts.map((part, partIndex) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <span key={partIndex} className="font-semibold text-white">
                    {part.slice(2, -2)}
                  </span>
                );
              }
              return <span key={partIndex} className="text-gray-300">{part}</span>;
            })}
          </div>
        );
      }
      // Numbered lists (prioritize over bullets)
      else if (line.match(/^\d+\.\s/)) {
        const match = line.match(/^(\d+)\.\s(.*)$/);
        if (match) {
          const text = match[2];
          formattedLines.push(
            <div key={index} className="mb-2.5 leading-[1.6] text-[15px]">
              <span className="text-gray-400 mr-2">{match[1]}.</span>
              {text.includes('**') ? (
                <>
                  {text.split(/(\*\*.*?\*\*)/).map((part, partIndex) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return (
                        <span key={partIndex} className="font-semibold text-white">
                          {part.slice(2, -2)}
                        </span>
                      );
                    }
                    return <span key={partIndex} className="text-gray-300">{part}</span>;
                  })}
                </>
              ) : (
                <span className="text-gray-300">{text}</span>
              )}
            </div>
          );
        }
      }
      // Sub-bullets (lines starting with * or - with any indentation)
      else if (line.match(/^\s*[\*\-]\s/)) {
        const text = line.replace(/^\s*[\*\-]\s/, '');

        // Check if it has bold or colon format
        if (text.includes('**') || text.includes(':')) {
          const parts = text.split(/(\*\*.*?\*\*)/);
          formattedLines.push(
            <div key={index} className="mb-2.5 leading-[1.6] text-[15px]">
              <span className="text-gray-400 mr-2">•</span>
              {parts.map((part, partIndex) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <span key={partIndex} className="font-semibold text-white">
                      {part.slice(2, -2)}
                    </span>
                  );
                }
                return <span key={partIndex} className="text-gray-300">{part}</span>;
              })}
            </div>
          );
        } else {
          formattedLines.push(
            <div key={index} className="mb-2.5 leading-[1.6] text-[15px] text-gray-300">
              <span className="text-gray-400 mr-2">•</span>
              {text}
            </div>
          );
        }
      }
      // Links (basic http/https detection)
      else if (line.includes('http')) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = line.split(urlRegex);
        formattedLines.push(
          <div key={index} className="mb-2.5 leading-[1.6] text-[15px]">
            {parts.map((part, partIndex) => {
              if (part.match(urlRegex)) {
                return (
                  <a
                    key={partIndex}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
                  >
                    {part}
                  </a>
                );
              }
              return <span key={partIndex} className="text-gray-300">{part}</span>;
            })}
          </div>
        );
      }
      // Empty lines
      else if (line.trim() === '') {
        formattedLines.push(<div key={index} className="h-3" />);
      }
      // Regular text
      else if (line.trim()) {
        formattedLines.push(
          <div key={index} className="mb-3 leading-[1.6] text-[15px] text-gray-300 font-normal">
            {line}
          </div>
        );
      }
    });
    
    return formattedLines;
  };

  return (
    <div className="text-base">
      {formatContent(content)}
      
      {/* PDF Download Section */}
      {pdfFiles.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-600">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-white">Generated Documents:</span>
          </div>
          <div className="space-y-2">
            {pdfFiles.map((filename, index) => {
              const isDownloading = downloadingFiles.has(filename);
              return (
                <div key={index} className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{filename}</p>
                      <p className="text-xs text-gray-400">PDF Document</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      setDownloadingFiles(prev => new Set([...prev, filename]));
                      try {
                        await downloadPDF(filename);
                      } finally {
                        setDownloadingFiles(prev => {
                          const next = new Set(prev);
                          next.delete(filename);
                          return next;
                        });
                      }
                    }}
                    disabled={isDownloading}
                    className={`flex items-center gap-2 px-3 py-2 text-white text-sm rounded-lg transition-colors ${
                      isDownloading
                        ? 'bg-gray-600 cursor-not-allowed'
                        : ''
                    }`}
                    style={isDownloading ? {} : { backgroundColor: '#ff9a54' }}
                    onMouseEnter={(e) => {
                      if (!isDownloading) e.currentTarget.style.backgroundColor = '#e8844a';
                    }}
                    onMouseLeave={(e) => {
                      if (!isDownloading) e.currentTarget.style.backgroundColor = '#ff9a54';
                    }}
                  >
                    {isDownloading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Download
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
  lastMessage: string | null;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  // CLERK AUTH COMMENTED OUT - Uncomment when ready to use authentication
  // const { user } = useUser();
  const user = { id: 'test_user_123', firstName: 'User' }; // Mock user for testing
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [availablePDFs, setAvailablePDFs] = useState<string[]>([]);
  const [showPDFDropdown, setShowPDFDropdown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pdfDropdownRef = useRef<HTMLDivElement>(null);

  // Load conversations from database
  const loadConversations = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/research/conversations`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to load conversations');
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  // Create new conversation
  const handleNewChat = async () => {
    try {
      // Clear current state immediately
      setCurrentConversationId(null);
      setMessages([]);
      setInput('');
      setIsLoading(false);
      setActiveTool(null);
      
      // Note: We don't create the conversation here anymore
      // It will be created when the user sends their first message
      await loadConversations();
    } catch (err) {
      console.error('Failed to create new conversation:', err);
    }
  };

  // Delete conversation
  const handleDeleteConversation = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/research/conversations/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete conversation');
      
      // If we deleted the current conversation, clear it
      if (currentConversationId === id) {
        setCurrentConversationId(null);
        setMessages([]);
      }
      
      await loadConversations();
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  // Load messages for a conversation
  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/research/history?conversationId=${conversationId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to load messages');
      const data = await response.json();
      
      // Convert API messages to our Message format with proper error handling
      const convertedMessages: Message[] = (data.messages || []).map((msg: any, index: number) => ({
        id: msg.id || `msg-${Date.now()}-${index}`, // Ensure unique ID
        role: msg.role === 'user' ? 'user' : 'assistant', // Validate role
        content: msg.content || '', // Ensure content exists
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
      })).filter(msg => msg.content.trim() !== ''); // Filter out empty messages
      
      setMessages(convertedMessages);
    } catch (err) {
      console.error('Failed to load messages:', err);
      setMessages([]);
    }
  };

  // Select conversation
  const handleConversationSelect = (id: string) => {
    setCurrentConversationId(id);
    loadMessages(id);
  };

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = input;
    setInput('');
    setIsLoading(true);
    setActiveTool(null); // Reset active tool for new message

    try {
      // If no current conversation, create one first
      let conversationId = currentConversationId;
      if (!conversationId) {
        const newConvResponse = await fetch(`${API_BASE}/api/research/conversations/new`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (!newConvResponse.ok) throw new Error('Failed to create conversation');
        const newConvData = await newConvResponse.json();
        conversationId = newConvData.conversation.id;
        setCurrentConversationId(conversationId);
        await loadConversations();
      }

      // Create assistant message placeholder immediately
      const assistantMessageId = (Date.now() + 1).toString();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Stream the response
      const response = await fetch(`${API_BASE}/api/research/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: messageText,
          conversationId: conversationId
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonData = JSON.parse(line.slice(6));
                
                if (jsonData.type === 'content') {
                  assistantContent += jsonData.content;
                  
                  // Update the assistant message in real-time
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMessageId 
                      ? { ...msg, content: assistantContent }
                      : msg
                  ));
                } else if (jsonData.type === 'tool_start') {
                  // Tool execution started - show what the AI is doing
                  const toolName = jsonData.tool_name;
                  setActiveTool(toolName);
                  console.log(`Tool started: ${toolName}`);
                } else if (jsonData.type === 'tool_end') {
                  // Tool execution completed
                  setActiveTool(null);
                  console.log('Tool completed');
                } else if (jsonData.type === 'complete') {
                  // Streaming is complete
                  setIsLoading(false);
                  setActiveTool(null);
                  
                  // Refresh conversations list to show updated title
                  setTimeout(() => {
                    loadConversations();
                  }, 1000);
                  break;
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      setIsLoading(false);
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setIsLoading(false);
      
      // Show error message - replace the empty assistant message with error
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your message. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev.slice(0, -1), errorMessage]); // Remove last message and add error
    }
  };

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Update available PDFs when messages change
  useEffect(() => {
    const allPDFs = new Set<string>();
    messages.forEach(message => {
      if (message.role === 'assistant') {
        const pdfs = extractPDFFilenames(message.content);
        pdfs.forEach(pdf => allPDFs.add(pdf));
      }
    });
    setAvailablePDFs(Array.from(allPDFs));
  }, [messages]);

  // Close PDF dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pdfDropdownRef.current && !pdfDropdownRef.current.contains(event.target as Node)) {
        setShowPDFDropdown(false);
      }
    };

    if (showPDFDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPDFDropdown]);

  const hasMessages = messages.length > 0;

  return (
    <div className="flex min-h-screen h-screen bg-gray-900" style={{ height: '100vh' }}>
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onConversationSelect={handleConversationSelect}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
      />
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Navbar - Fixed at top */}
        <div className="flex-shrink-0 bg-gray-900 px-4 py-3">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            {!sidebarOpen && (
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: '#ff9a54' }}>
                  <MessageSquare className="w-3 h-3 text-white" />
                </div>
                <h1 className="text-sm font-semibold text-white">Researchy</h1>
              </div>
            )}
            {sidebarOpen && <div></div>}
            
            {/* PDF Download Section & Library Link */}
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-3 py-1.5 text-white text-xs rounded-md transition-colors bg-gray-700 hover:bg-gray-600"
                title="View all your research papers"
              >
                <FileText className="w-3 h-3" />
                <span>Library</span>
              </Link>

              {availablePDFs.length > 0 ? (
                <div className="relative" ref={pdfDropdownRef}>
                  <button
                    onClick={() => setShowPDFDropdown(!showPDFDropdown)}
                    className="flex items-center gap-2 px-3 py-1.5 text-white text-xs rounded-md transition-colors"
                    style={{ backgroundColor: '#ff9a54' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e8844a';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#ff9a54';
                    }}
                    title={`${availablePDFs.length} PDF document${availablePDFs.length > 1 ? 's' : ''} available for download`}
                  >
                    <Download className="w-3 h-3" />
                    <span>PDFs ({availablePDFs.length})</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${showPDFDropdown ? 'rotate-180' : ''}`} />
                  </button>
                
                {/* PDF Dropdown */}
                {showPDFDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-80 bg-gray-800 border border-gray-600 rounded-lg shadow-xl">
                    <div className="p-3 border-b border-gray-600">
                      <h3 className="text-sm font-semibold text-white">Available Documents</h3>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {availablePDFs.map((filename, index) => (
                        <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-700 transition-colors">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-6 h-6 bg-red-100 rounded flex items-center justify-center flex-shrink-0">
                              <FileText className="w-3 h-3 text-red-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-white truncate">{filename}</p>
                              <p className="text-xs text-gray-400">PDF Document</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              downloadPDF(filename);
                              setShowPDFDropdown(false);
                            }}
                            className="flex items-center gap-1 px-2 py-1 text-white text-xs rounded transition-colors flex-shrink-0 ml-2"
                            style={{ backgroundColor: '#ff9a54' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#e8844a';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#ff9a54';
                            }}
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                </div>
              ) : (
                <span className="text-xs text-gray-500">No PDFs</span>
              )}
            </div>
          </div>
        </div>
        {!hasMessages ? (
          /* Centered Input - Like Claude */
          <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
            <div className="w-full max-w-3xl">
              {/* Welcome Message */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-semibold text-white mb-2">
                  Hi{user?.firstName ? `, ${user.firstName}` : ''}!
                </h1>
                <p className="text-lg text-gray-300">
                  What would you like to research today?
                </p>
              </div>

              {/* Input Field */}
              <div className="flex gap-3 items-end">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me about research topics, papers, or anything you'd like to explore..."
                  className="flex-1 p-4 text-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 rounded-xl resize-none focus:outline-none focus:ring-2 shadow-sm overflow-hidden"
                  rows={1}
                  style={{ 
                    minHeight: '60px', 
                    maxHeight: '200px', 
                    scrollbarWidth: 'none', 
                    msOverflowStyle: 'none',
                    '--tw-ring-color': '#ff9a54'
                  } as any}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="relative p-4 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex-shrink-0 group"
                  style={{ 
                    minHeight: '60px',
                    background: 'linear-gradient(135deg, #ff9a54 0%, #e8844a 100%)'
                  }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #e8844a 0%, #d9733f 100%)';
                      e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #ff9a54 0%, #e8844a 100%)';
                      e.currentTarget.style.transform = 'translateY(0px) scale(1)';
                    }
                  }}
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Send className="w-6 h-6 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  )}
                  
                  {/* Shine effect */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Chat View with Messages */
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
            {/* Messages Area - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 pt-6 pb-24">
                <div className="max-w-4xl mx-auto space-y-6">
                  {messages.length > 0 ? (
                    <>
                      {messages.map((message, index) => (
                        <div key={`${message.id}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
                          <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                            <div
                              className={`px-6 py-4 rounded-xl break-words ${
                                message.role === 'user'
                                  ? 'text-gray-200 bg-transparent border border-gray-700/50'
                                  : 'bg-gray-800/50 text-gray-200 border border-gray-700/30'
                              }`}
                              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                            >
                              {message.role === 'assistant' ? (
                                <FormattedMessage content={message.content} />
                              ) : (
                                <p className="whitespace-pre-wrap leading-[1.6] text-[15px] text-gray-300 font-normal">{message.content}</p>
                              )}
                            </div>

                            {/* Timestamp */}
                            <div className={`text-xs text-gray-500 mt-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex justify-start mb-4">
                          <div className="flex flex-col items-start max-w-[85%]">
                            <div className="bg-gradient-to-br from-gray-800 to-gray-850 border border-gray-700/50 px-5 py-4 rounded-2xl rounded-bl-md shadow-lg">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                <span className="text-sm text-gray-300 ml-2">
                                  {activeTool ? getToolDescription(activeTool) : 'Thinking...'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full min-h-[400px] text-gray-400">
                      <div className="text-center">
                        <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">No messages yet</p>
                        <p className="text-sm mt-1">Start a conversation below</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Input */}
            <div className="absolute bottom-0 left-0 right-0 pb-4 pt-2">
              <div className="max-w-4xl mx-auto px-2">
                <div className="flex gap-3 items-end max-w-[95%]" style={{ marginLeft: '-21px' }}>
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    className="flex-1 p-3 bg-gray-800 border border-gray-700 text-white placeholder-gray-400 rounded-4xl resize-none focus:outline-none focus:ring-2"
                    rows={1}
                    style={{
                      minHeight: '48px',
                      maxHeight: '150px',
                      overflow: 'hidden auto',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                      '--tw-ring-color': '#ff9a54'
                    } as any}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || isLoading}
                    className="p-3 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    style={{
                      minHeight: '48px',
                      minWidth: '48px',
                      background: 'linear-gradient(135deg, #ff9a54 0%, #e8844a 100%)'
                    }}
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}