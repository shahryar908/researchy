'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { FileText, Download, Trash2, Calendar, ArrowLeft, Loader2 } from 'lucide-react';
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
  const { user, isLoaded } = useUser();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      fetchPapers();
    }
  }, [isLoaded, user]);

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

  if (!isLoaded || loading) {
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
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/chat"
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white">My Research Library</h1>
                <p className="text-gray-400 mt-1">
                  {papers.length} {papers.length === 1 ? 'paper' : 'papers'} generated
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {papers.map(paper => (
              <div
                key={paper.id}
                className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-3 bg-orange-500/10 rounded-lg flex-shrink-0">
                    <FileText className="w-6 h-6 text-orange-500" />
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
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
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
