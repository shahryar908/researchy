'use client';

import { useState, useEffect } from 'react';
// CLERK AUTH COMMENTED OUT - Uncomment when ready to use authentication
// import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { FileText, Download, Trash2, Calendar, Loader2, MessageSquare, Menu, X, Search, ArrowUpDown, HardDrive, TrendingUp } from 'lucide-react';
import Link from 'next/link';

// Force localhost for development
const API_BASE = 'http://localhost:3001';

// Debug: Log the API URL being used
console.log('[Dashboard] Using API:', API_BASE);

interface Paper {
  id: string;
  filename: string;
  title: string;
  supabasePath: string | null;
  fileSize: number | null;
  createdAt: string;
}

export default function DashboardPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'size-desc' | 'size-asc'>('date-desc');

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/research/papers/library`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch papers');
      }

      const data = await response.json();
      setPapers(data.papers || []);
    } catch (error) {
      console.error('Error fetching papers:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (paper: Paper) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/research/papers/${encodeURIComponent(paper.filename)}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = paper.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const deletePaper = async (paperId: string) => {
    if (!confirm('Are you sure you want to delete this paper?')) {
      return;
    }

    try {
      setDeleting(paperId);
      const response = await fetch(`${API_BASE}/api/research/papers/${paperId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete paper');
      }

      // Remove from local state
      setPapers(papers.filter(p => p.id !== paperId));
    } catch (error) {
      console.error('Error deleting paper:', error);
      alert('Failed to delete paper. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter and sort papers
  const filteredAndSortedPapers = papers
    .filter(paper => {
      const query = searchQuery.toLowerCase();
      return (
        paper.title.toLowerCase().includes(query) ||
        paper.filename.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'size-desc':
          return (b.fileSize || 0) - (a.fileSize || 0);
        case 'size-asc':
          return (a.fileSize || 0) - (b.fileSize || 0);
        default:
          return 0;
      }
    });

  // Calculate statistics
  const totalPapers = papers.length;
  const totalStorageBytes = papers.reduce((sum, paper) => sum + (paper.fileSize || 0), 0);
  const totalStorageMB = (totalStorageBytes / (1024 * 1024)).toFixed(2);
  const thisWeekPapers = papers.filter(paper => {
    const paperDate = new Date(paper.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return paperDate >= weekAgo;
  }).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your research papers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Top spacing for navbar */}
      <div className="h-4 bg-gray-900"></div>

      {/* Navbar */}
      <nav className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 mx-4 rounded-xl shadow-lg sticky top-4 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#ff9a54' }}>
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <Link href="/" className="text-2xl font-bold text-white tracking-tight hover:text-orange-400 transition-colors">
                Researchy
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-4">
              {/* CLERK AUTH COMMENTED OUT
              <SignedOut>
                <SignInButton>
                  <button className="px-4 py-2 text-gray-300 hover:text-orange-400 rounded-lg transition-all duration-300 font-medium">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton>
                  <button className="px-6 py-2 text-white rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                    style={{
                      background: 'linear-gradient(135deg, #ff9a54 0%, #e8844a 100%)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #e8844a 0%, #d9733f 100%)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #ff9a54 0%, #e8844a 100%)';
                    }}
                  >
                    Get Started Free
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link href="/chat" className="px-4 py-2 text-gray-300 hover:text-orange-400 rounded-lg transition-colors font-medium">
                  Chat
                </Link>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10 rounded-full ring-2 ring-orange-200 hover:ring-orange-300 transition-all duration-300"
                    }
                  }}
                />
              </SignedIn>
              */}
              <Link href="/chat" className="px-4 py-2 text-gray-300 hover:text-orange-400 rounded-lg transition-colors font-medium">
                Chat
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-gray-300 hover:text-orange-400 hover:bg-gray-800 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-700 py-4">
              <div className="flex flex-col space-y-4">
                {/* Mobile Auth */}
                <div className="pt-4 border-t border-gray-700">
                  {/* CLERK AUTH COMMENTED OUT
                  <SignedOut>
                    <div className="flex flex-col space-y-3">
                      <SignInButton>
                        <button className="w-full px-4 py-2 text-gray-300 hover:text-orange-400 rounded-lg transition-colors font-medium text-left">
                          Sign In
                        </button>
                      </SignInButton>
                      <SignUpButton>
                        <button className="w-full px-4 py-2 text-white rounded-lg font-medium transition-all duration-300"
                          style={{
                            background: 'linear-gradient(135deg, #ff9a54 0%, #e8844a 100%)'
                          }}
                        >
                          Get Started Free
                        </button>
                      </SignUpButton>
                    </div>
                  </SignedOut>
                  <SignedIn>
                    <div className="flex items-center justify-between">
                      <Link href="/chat" className="px-2 py-1 text-gray-300 hover:text-orange-400 font-medium transition-colors">
                        Chat
                      </Link>
                      <UserButton />
                    </div>
                  </SignedIn>
                  */}
                  <Link href="/chat" className="px-2 py-1 text-gray-300 hover:text-orange-400 font-medium transition-colors">
                    Chat
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistics Cards */}
        {papers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Papers */}
            <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(255, 154, 84, 0.1)' }}>
                  <FileText className="w-6 h-6" style={{ color: '#ff9a54' }} />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">{totalPapers}</p>
                  <p className="text-sm text-gray-400">Total Papers</p>
                </div>
              </div>
            </div>

            {/* Storage Used */}
            <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <HardDrive className="w-6 h-6 text-blue-400" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">{totalStorageMB}</p>
                  <p className="text-sm text-gray-400">MB Used</p>
                </div>
              </div>
            </div>

            {/* This Week */}
            <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">{thisWeekPapers}</p>
                  <p className="text-sm text-gray-400">This Week</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter Bar */}
        {papers.length > 0 && (
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search papers by title or filename..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none pl-10 pr-10 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="size-desc">Largest First</option>
                <option value="size-asc">Smallest First</option>
              </select>
              <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        )}

        {papers.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-300 mb-2">No papers yet</h2>
            <p className="text-gray-500 mb-6">
              Start a conversation and ask the AI to generate a research paper
            </p>
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Start Researching
            </Link>
          </div>
        ) : filteredAndSortedPapers.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-300 mb-2">No papers found</h2>
            <p className="text-gray-500 mb-6">
              Try adjusting your search query
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-6 py-3 text-white rounded-lg font-medium transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, #ff9a54 0%, #e8844a 100%)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #e8844a 0%, #d9733f 100%)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #ff9a54 0%, #e8844a 100%)';
              }}
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedPapers.map(paper => (
              <div
                key={paper.id}
                className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-3 rounded-lg flex-shrink-0" style={{ backgroundColor: 'rgba(255, 154, 84, 0.1)' }}>
                    <FileText className="w-6 h-6" style={{ color: '#ff9a54' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2">
                      {paper.title}
                    </h3>
                    <p className="text-sm text-gray-400 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(paper.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">Filename</p>
                  <p className="text-sm text-gray-300 font-mono truncate">
                    {paper.filename}
                  </p>
                </div>

                {paper.fileSize && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">File Size</p>
                    <p className="text-sm text-gray-300">
                      {formatFileSize(paper.fileSize)}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => downloadPDF(paper)}
                    className="flex-1 px-4 py-2 text-white rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2 text-sm"
                    style={{
                      background: 'linear-gradient(135deg, #ff9a54 0%, #e8844a 100%)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #e8844a 0%, #d9733f 100%)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #ff9a54 0%, #e8844a 100%)';
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={() => deletePaper(paper.id)}
                    disabled={deleting === paper.id}
                    className="px-4 py-2 bg-red-900/50 text-red-400 rounded-lg hover:bg-red-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting === paper.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
