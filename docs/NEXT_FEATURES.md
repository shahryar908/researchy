# 🚀 Next Features to Build - Detailed Implementation Guide

This document provides step-by-step implementation guides for the **highest-impact features** you can add to Researchy.

---

## 📋 **Feature Priority Matrix**

| Feature | Impact | Difficulty | Time | Priority |
|---------|--------|------------|------|----------|
| Citation Manager | ⭐⭐⭐⭐⭐ | 🔧🔧 | 2-3 days | **#1** |
| Advanced Search Filters | ⭐⭐⭐⭐⭐ | 🔧 | 1-2 days | **#2** |
| Export Chat History | ⭐⭐⭐⭐ | 🔧 | 1 day | **#3** |
| Paper Comparison Tool | ⭐⭐⭐⭐ | 🔧🔧🔧 | 3-4 days | **#4** |
| Dark/Light Mode | ⭐⭐⭐ | 🔧 | 1 day | **#5** |

---

# 🎯 FEATURE #1: Citation Management System

## **Overview**
Allow users to save citations from researched papers and export them in multiple academic formats (APA, MLA, Chicago, BibTeX).

## **User Story**
> "As a researcher, I want to easily save and export citations from papers I find, so I can quickly add them to my bibliography without manual formatting."

---

## **Implementation Steps**

### **Phase 1: Backend Database Schema (30 mins)**

#### 1.1 Update Prisma Schema
Add new `Citation` model to `backend/prisma/schema.prisma`:

```prisma
model Citation {
  id          String   @id @default(cuid())
  userId      String
  paperId     String   // ArXiv ID or unique identifier
  title       String
  authors     String[] // Array of author names
  year        String
  journal     String?
  doi         String?
  arxivId     String?
  url         String?
  abstract    String?  @db.Text
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([paperId])
  @@map("citations")
}

// Update User model to include citations
model User {
  id            String         @id @default(cuid())
  clerkUserId   String         @unique
  email         String?
  firstName     String?
  lastName      String?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  conversations Conversation[]
  messages      Message[]
  citations     Citation[]     // ADD THIS LINE

  @@map("users")
}
```

#### 1.2 Run Migration
```bash
cd backend
npx prisma migrate dev --name add_citations
npx prisma generate
```

---

### **Phase 2: Backend API Endpoints (1 hour)**

Create `backend/routes/citations.ts`:

```typescript
import { Router } from 'express';
import { PrismaClient } from '../generated/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/citations - Get all user's citations
router.get('/api/citations', requireAuth, async (req, res) => {
    try {
        const { userId } = req as any;

        const user = await prisma.user.findUnique({
            where: { clerkUserId: userId }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const citations = await prisma.citation.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ citations, count: citations.length });
    } catch (error) {
        console.error('Error fetching citations:', error);
        res.status(500).json({ error: "Failed to fetch citations" });
    }
});

// POST /api/citations - Save a new citation
router.post('/api/citations', requireAuth, async (req, res) => {
    try {
        const { userId } = req as any;
        const { paperId, title, authors, year, journal, doi, arxivId, url, abstract } = req.body;

        if (!paperId || !title || !authors) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const user = await prisma.user.findUnique({
            where: { clerkUserId: userId }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check if citation already exists
        const existing = await prisma.citation.findFirst({
            where: {
                userId: user.id,
                paperId: paperId
            }
        });

        if (existing) {
            return res.status(409).json({
                error: "Citation already saved",
                citation: existing
            });
        }

        const citation = await prisma.citation.create({
            data: {
                userId: user.id,
                paperId,
                title,
                authors,
                year,
                journal,
                doi,
                arxivId,
                url,
                abstract
            }
        });

        res.status(201).json({ citation });
    } catch (error) {
        console.error('Error saving citation:', error);
        res.status(500).json({ error: "Failed to save citation" });
    }
});

// DELETE /api/citations/:id - Delete a citation
router.delete('/api/citations/:id', requireAuth, async (req, res) => {
    try {
        const { userId } = req as any;
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { clerkUserId: userId }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Verify ownership
        const citation = await prisma.citation.findFirst({
            where: { id, userId: user.id }
        });

        if (!citation) {
            return res.status(404).json({ error: "Citation not found" });
        }

        await prisma.citation.delete({ where: { id } });

        res.json({ message: "Citation deleted" });
    } catch (error) {
        console.error('Error deleting citation:', error);
        res.status(500).json({ error: "Failed to delete citation" });
    }
});

// GET /api/citations/export/:format - Export citations in specific format
router.get('/api/citations/export/:format', requireAuth, async (req, res) => {
    try {
        const { userId } = req as any;
        const { format } = req.params; // apa, mla, chicago, bibtex

        const user = await prisma.user.findUnique({
            where: { clerkUserId: userId }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const citations = await prisma.citation.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        });

        let formatted = '';

        citations.forEach(citation => {
            switch (format.toLowerCase()) {
                case 'apa':
                    formatted += formatAPA(citation) + '\n\n';
                    break;
                case 'mla':
                    formatted += formatMLA(citation) + '\n\n';
                    break;
                case 'chicago':
                    formatted += formatChicago(citation) + '\n\n';
                    break;
                case 'bibtex':
                    formatted += formatBibTeX(citation) + '\n\n';
                    break;
                default:
                    return res.status(400).json({ error: "Invalid format" });
            }
        });

        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="citations.${format}.txt"`);
        res.send(formatted);

    } catch (error) {
        console.error('Error exporting citations:', error);
        res.status(500).json({ error: "Failed to export citations" });
    }
});

// Helper functions for formatting
function formatAPA(citation: any): string {
    const authors = citation.authors.join(', ');
    return `${authors} (${citation.year}). ${citation.title}. ${citation.journal || 'arXiv'}. ${citation.doi || citation.url || ''}`;
}

function formatMLA(citation: any): string {
    const authors = citation.authors.join(', ');
    return `${authors}. "${citation.title}." ${citation.journal || 'arXiv'}, ${citation.year}. ${citation.url || ''}`;
}

function formatChicago(citation: any): string {
    const authors = citation.authors.join(', ');
    return `${authors}. "${citation.title}." ${citation.journal || 'arXiv'} (${citation.year}). ${citation.doi || citation.url || ''}`;
}

function formatBibTeX(citation: any): string {
    const key = `${citation.authors[0]?.split(' ').pop() || 'Unknown'}${citation.year}`;
    return `@article{${key},
  author = {${citation.authors.join(' and ')}},
  title = {${citation.title}},
  journal = {${citation.journal || 'arXiv'}},
  year = {${citation.year}},
  doi = {${citation.doi || ''}},
  url = {${citation.url || ''}}
}`;
}

export default router;
```

#### 2.2 Register Routes in `backend/index.ts`
```typescript
import citationRoutes from './routes/citations';
app.use(citationRoutes);
```

---

### **Phase 3: Frontend UI Components (2 hours)**

#### 3.1 Create Citation Manager Component

Create `frontend/components/CitationManager.tsx`:

```typescript
'use client';
import { useState, useEffect } from 'react';
import { BookmarkPlus, Download, Trash2, FileText } from 'lucide-react';

interface Citation {
  id: string;
  title: string;
  authors: string[];
  year: string;
  journal?: string;
  arxivId?: string;
  url?: string;
}

export default function CitationManager() {
  const [citations, setCitations] = useState<Citation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCitations();
  }, []);

  const fetchCitations = async () => {
    try {
      const response = await fetch('/api/citations');
      const data = await response.json();
      setCitations(data.citations || []);
    } catch (error) {
      console.error('Error fetching citations:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCitation = async (id: string) => {
    try {
      await fetch(`/api/citations/${id}`, { method: 'DELETE' });
      setCitations(citations.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting citation:', error);
    }
  };

  const exportCitations = async (format: string) => {
    try {
      const response = await fetch(`/api/citations/export/${format}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `citations.${format}.txt`;
      a.click();
    } catch (error) {
      console.error('Error exporting citations:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">My Citations ({citations.length})</h2>

        <div className="flex gap-2">
          <button
            onClick={() => exportCitations('apa')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export APA
          </button>
          <button
            onClick={() => exportCitations('bibtex')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export BibTeX
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-400">Loading citations...</div>
      ) : citations.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No citations saved yet.</p>
          <p className="text-sm mt-2">Save citations from research papers to build your bibliography.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {citations.map((citation) => (
            <div
              key={citation.id}
              className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {citation.title}
                  </h3>
                  <p className="text-sm text-gray-400 mb-1">
                    {citation.authors.join(', ')}
                  </p>
                  <p className="text-sm text-gray-500">
                    {citation.journal || 'arXiv'} ({citation.year})
                  </p>
                  {citation.url && (
                    <a
                      href={citation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 hover:text-blue-300 mt-2 inline-block"
                    >
                      View Paper →
                    </a>
                  )}
                </div>

                <button
                  onClick={() => deleteCitation(citation.id)}
                  className="text-red-400 hover:text-red-300 p-2"
                  title="Delete citation"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

#### 3.2 Add "Save Citation" Button to Chat

Update `frontend/app/chat/page.tsx` to detect ArXiv papers in AI responses and show "Save Citation" button:

```typescript
// Add this function to extract paper info from AI response
const extractPaperInfo = (content: string) => {
  const papers = [];
  const regex = /\[([^\]]+)\]\(https:\/\/arxiv\.org\/pdf\/([^)]+)\)/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    papers.push({
      title: match[1],
      arxivId: match[2],
      url: `https://arxiv.org/abs/${match[2]}`
    });
  }

  return papers;
};

// Add save citation function
const saveCitation = async (paper: any) => {
  try {
    const response = await fetch('/api/citations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paperId: paper.arxivId,
        title: paper.title,
        authors: ['Unknown'], // You can enhance this
        year: new Date().getFullYear().toString(),
        arxivId: paper.arxivId,
        url: paper.url
      })
    });

    if (response.ok) {
      alert('Citation saved!');
    }
  } catch (error) {
    console.error('Error saving citation:', error);
  }
};

// In your message rendering, add:
{message.role === 'assistant' && extractPaperInfo(message.content).map((paper, idx) => (
  <button
    key={idx}
    onClick={() => saveCitation(paper)}
    className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-2"
  >
    <BookmarkPlus className="w-4 h-4" />
    Save "{paper.title}"
  </button>
))}
```

#### 3.3 Add Citations Page

Create `frontend/app/citations/page.tsx`:

```typescript
import CitationManager from '@/components/CitationManager';

export default function CitationsPage() {
  return <CitationManager />;
}
```

#### 3.4 Add Link to Navbar

Update sidebar to include Citations link:

```typescript
<Link href="/citations" className="text-gray-300 hover:text-orange-400">
  My Citations
</Link>
```

---

### **Phase 4: Testing (30 mins)**

#### Test Checklist:
- [ ] Save a citation from chat
- [ ] View all citations in Citations page
- [ ] Delete a citation
- [ ] Export as APA format
- [ ] Export as BibTeX format
- [ ] Verify citations persist after refresh
- [ ] Test with multiple papers

---

## **Expected Results**

✅ Users can save citations with one click
✅ Citations are stored in database
✅ Export to APA, MLA, Chicago, BibTeX
✅ Clean UI to manage all citations
✅ Download formatted bibliography files

---

## **Future Enhancements**

- Auto-fill citation data from ArXiv API
- Group citations by project/topic
- Inline citations in generated papers
- Citation style editor
- Share citation libraries

---

# 🎯 FEATURE #2: Advanced Search Filters

## **Overview**
Add powerful filtering capabilities to search ArXiv papers by date range, category, author, and sort by relevance or recency.

## **User Story**
> "As a researcher, I want to filter ArXiv papers by publication date, category, and author, so I can find exactly the papers I need without sifting through irrelevant results."

---

## **Implementation Steps**

### **Phase 1: Backend API Enhancement (1 hour)**

#### 1.1 Update Search Endpoint in FastAPI

Update `agent/ai-researcher/main.py` to add filter parameters:

```python
# Add to imports
from datetime import datetime, timedelta
from typing import Optional, List

# Update search function (around line 200)
@app.get("/api/search")
async def search_papers(
    query: str,
    category: Optional[str] = None,  # e.g., "cs.AI", "cs.LG"
    author: Optional[str] = None,
    date_from: Optional[str] = None,  # YYYY-MM-DD format
    date_to: Optional[str] = None,
    sort_by: str = "relevance",  # "relevance" or "date"
    max_results: int = 10
):
    """
    Search ArXiv with advanced filters
    """
    try:
        # Build ArXiv query
        search_query = f"all:{query}"

        if author:
            search_query += f" AND au:{author}"

        if category:
            search_query += f" AND cat:{category}"

        # ArXiv API call with filters
        params = {
            "search_query": search_query,
            "start": 0,
            "max_results": max_results,
            "sortBy": "submittedDate" if sort_by == "date" else "relevance",
            "sortOrder": "descending"
        }

        response = requests.get(
            "http://export.arxiv.org/api/query",
            params=params
        )

        # Parse XML response
        import xml.etree.ElementTree as ET
        root = ET.fromstring(response.content)

        papers = []
        for entry in root.findall('{http://www.w3.org/2005/Atom}entry'):
            published = entry.find('{http://www.w3.org/2005/Atom}published').text
            pub_date = datetime.fromisoformat(published.replace('Z', '+00:00'))

            # Filter by date range
            if date_from:
                from_date = datetime.fromisoformat(date_from)
                if pub_date < from_date:
                    continue

            if date_to:
                to_date = datetime.fromisoformat(date_to)
                if pub_date > to_date:
                    continue

            # Extract paper data
            title = entry.find('{http://www.w3.org/2005/Atom}title').text
            summary = entry.find('{http://www.w3.org/2005/Atom}summary').text
            pdf_link = entry.find('{http://www.w3.org/2005/Atom}id').text.replace('/abs/', '/pdf/')

            authors = [
                author.find('{http://www.w3.org/2005/Atom}name').text
                for author in entry.findall('{http://www.w3.org/2005/Atom}author')
            ]

            categories = [
                cat.get('term')
                for cat in entry.findall('{http://www.w3.org/2005/Atom}category')
            ]

            papers.append({
                "title": title.strip(),
                "summary": summary.strip(),
                "authors": authors,
                "published": published,
                "pdf_url": pdf_link,
                "categories": categories
            })

        return {
            "papers": papers,
            "count": len(papers),
            "query": query,
            "filters": {
                "category": category,
                "author": author,
                "date_from": date_from,
                "date_to": date_to,
                "sort_by": sort_by
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

### **Phase 2: Frontend Search UI (1.5 hours)**

#### 2.1 Create Advanced Search Component

Create `frontend/components/AdvancedSearch.tsx`:

```typescript
'use client';
import { useState } from 'react';
import { Search, Filter, Calendar, User, Tag, SortAsc } from 'lucide-react';

interface SearchFilters {
  query: string;
  category: string;
  author: string;
  dateFrom: string;
  dateTo: string;
  sortBy: 'relevance' | 'date';
}

export default function AdvancedSearch({ onSearch }: { onSearch: (filters: SearchFilters) => void }) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: '',
    author: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'relevance'
  });

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const arxivCategories = [
    { value: '', label: 'All Categories' },
    { value: 'cs.AI', label: 'Artificial Intelligence' },
    { value: 'cs.LG', label: 'Machine Learning' },
    { value: 'cs.CL', label: 'Computation and Language' },
    { value: 'cs.CV', label: 'Computer Vision' },
    { value: 'cs.NE', label: 'Neural Networks' },
    { value: 'stat.ML', label: 'Statistics - Machine Learning' },
    { value: 'math.OC', label: 'Optimization and Control' },
    { value: 'q-bio', label: 'Quantitative Biology' },
    { value: 'physics', label: 'Physics' }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Main Search Bar */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search research papers..."
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            onKeyPress={handleKeyPress}
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-3 rounded-lg flex items-center gap-2 ${
            showFilters ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <Filter className="w-5 h-5" />
          Filters
        </button>
        <button
          onClick={handleSearch}
          className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
        >
          Search
        </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4">Advanced Filters</h3>

          {/* Category Filter */}
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <Tag className="w-4 h-4" />
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
            >
              {arxivCategories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Author Filter */}
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <User className="w-4 h-4" />
              Author Name
            </label>
            <input
              type="text"
              placeholder="e.g., Geoffrey Hinton"
              value={filters.author}
              onChange={(e) => setFilters({ ...filters, author: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                <Calendar className="w-4 h-4" />
                From Date
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                <Calendar className="w-4 h-4" />
                To Date
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <SortAsc className="w-4 h-4" />
              Sort By
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-white cursor-pointer">
                <input
                  type="radio"
                  value="relevance"
                  checked={filters.sortBy === 'relevance'}
                  onChange={(e) => setFilters({ ...filters, sortBy: 'relevance' })}
                  className="text-orange-600 focus:ring-orange-500"
                />
                Relevance
              </label>
              <label className="flex items-center gap-2 text-white cursor-pointer">
                <input
                  type="radio"
                  value="date"
                  checked={filters.sortBy === 'date'}
                  onChange={(e) => setFilters({ ...filters, sortBy: 'date' })}
                  className="text-orange-600 focus:ring-orange-500"
                />
                Most Recent
              </label>
            </div>
          </div>

          {/* Quick Filters */}
          <div>
            <p className="text-sm text-gray-400 mb-2">Quick Filters</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  const lastWeek = new Date();
                  lastWeek.setDate(lastWeek.getDate() - 7);
                  setFilters({ ...filters, dateFrom: lastWeek.toISOString().split('T')[0], dateTo: '' });
                }}
                className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded-full hover:bg-gray-600"
              >
                Last 7 days
              </button>
              <button
                onClick={() => {
                  const lastMonth = new Date();
                  lastMonth.setMonth(lastMonth.getMonth() - 1);
                  setFilters({ ...filters, dateFrom: lastMonth.toISOString().split('T')[0], dateTo: '' });
                }}
                className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded-full hover:bg-gray-600"
              >
                Last month
              </button>
              <button
                onClick={() => {
                  const lastYear = new Date();
                  lastYear.setFullYear(lastYear.getFullYear() - 1);
                  setFilters({ ...filters, dateFrom: lastYear.toISOString().split('T')[0], dateTo: '' });
                }}
                className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded-full hover:bg-gray-600"
              >
                Last year
              </button>
              <button
                onClick={() => setFilters({ query: filters.query, category: '', author: '', dateFrom: '', dateTo: '', sortBy: 'relevance' })}
                className="px-3 py-1 text-sm bg-red-900/50 text-red-400 rounded-full hover:bg-red-900"
              >
                Clear filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

#### 2.2 Integrate into Chat Page

Update `frontend/app/chat/page.tsx` to use AdvancedSearch:

```typescript
import AdvancedSearch from '@/components/AdvancedSearch';

// Add to component
const handleAdvancedSearch = async (filters: any) => {
  const params = new URLSearchParams();
  params.append('query', filters.query);
  if (filters.category) params.append('category', filters.category);
  if (filters.author) params.append('author', filters.author);
  if (filters.dateFrom) params.append('date_from', filters.dateFrom);
  if (filters.dateTo) params.append('date_to', filters.dateTo);
  params.append('sort_by', filters.sortBy);

  try {
    const response = await fetch(`${API_BASE}/api/search?${params}`);
    const data = await response.json();

    // Display results in chat as AI message
    const resultsMessage = {
      role: 'assistant',
      content: `Found ${data.count} papers matching your search:\n\n${
        data.papers.map((p: any, i: number) =>
          `${i + 1}. **${p.title}**\n   Authors: ${p.authors.join(', ')}\n   Published: ${new Date(p.published).toLocaleDateString()}\n   [View PDF](${p.pdf_url})\n`
        ).join('\n')
      }`
    };

    setMessages(prev => [...prev, resultsMessage]);
  } catch (error) {
    console.error('Search error:', error);
  }
};

// Add to JSX before chat messages
<AdvancedSearch onSearch={handleAdvancedSearch} />
```

---

### **Phase 3: Testing (30 mins)**

#### Test Checklist:
- [ ] Search papers by category (cs.AI, cs.LG)
- [ ] Filter by author name
- [ ] Filter by date range (last week, last month)
- [ ] Sort by relevance vs. most recent
- [ ] Use quick filter buttons
- [ ] Clear all filters
- [ ] Test combined filters (category + date + author)
- [ ] Verify results display correctly in chat

---

## **Expected Results**

✅ Users can filter papers by category, author, and date
✅ Quick filter buttons for common date ranges
✅ Sort by relevance or recency
✅ Clean, collapsible filter UI
✅ Results integrate seamlessly with chat interface

---

# 🎯 FEATURE #3: Export Chat History

## **Overview**
Allow users to export their entire chat conversation as PDF, Markdown, or JSON for record-keeping and sharing.

## **User Story**
> "As a researcher, I want to export my AI research conversations, so I can reference them later, share with colleagues, or include in my research documentation."

---

## **Implementation Steps**

### **Phase 1: Backend Export Endpoints (45 mins)**

Create `backend/routes/export.ts`:

```typescript
import { Router } from 'express';
import { PrismaClient } from '../generated/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/conversations/:id/export?format=pdf|markdown|json
router.get('/api/conversations/:id/export', requireAuth, async (req, res) => {
    try {
        const { userId } = req as any;
        const { id } = req.params;
        const format = (req.query.format as string) || 'markdown';

        const user = await prisma.user.findUnique({
            where: { clerkUserId: userId }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const conversation = await prisma.conversation.findFirst({
            where: {
                id,
                userId: user.id
            },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!conversation) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        let content = '';
        let contentType = 'text/plain';
        let filename = `conversation-${id}`;

        switch (format) {
            case 'markdown':
                content = generateMarkdown(conversation);
                contentType = 'text/markdown';
                filename += '.md';
                break;

            case 'json':
                content = JSON.stringify(conversation, null, 2);
                contentType = 'application/json';
                filename += '.json';
                break;

            case 'txt':
                content = generatePlainText(conversation);
                contentType = 'text/plain';
                filename += '.txt';
                break;

            default:
                return res.status(400).json({ error: "Invalid format" });
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(content);

    } catch (error) {
        console.error('Error exporting conversation:', error);
        res.status(500).json({ error: "Failed to export conversation" });
    }
});

function generateMarkdown(conversation: any): string {
    let md = `# ${conversation.title || 'Research Conversation'}\n\n`;
    md += `**Created:** ${new Date(conversation.createdAt).toLocaleString()}\n`;
    md += `**Last Updated:** ${new Date(conversation.updatedAt).toLocaleString()}\n`;
    md += `**Total Messages:** ${conversation.messages.length}\n\n`;
    md += `---\n\n`;

    conversation.messages.forEach((msg: any) => {
        const role = msg.role === 'user' ? '👤 User' : '🤖 AI Assistant';
        const timestamp = new Date(msg.createdAt).toLocaleTimeString();

        md += `### ${role} (${timestamp})\n\n`;
        md += `${msg.content}\n\n`;
        md += `---\n\n`;
    });

    return md;
}

function generatePlainText(conversation: any): string {
    let txt = `${conversation.title || 'Research Conversation'}\n`;
    txt += `${'='.repeat(50)}\n\n`;
    txt += `Created: ${new Date(conversation.createdAt).toLocaleString()}\n`;
    txt += `Last Updated: ${new Date(conversation.updatedAt).toLocaleString()}\n`;
    txt += `Total Messages: ${conversation.messages.length}\n\n`;

    conversation.messages.forEach((msg: any) => {
        const role = msg.role.toUpperCase();
        const timestamp = new Date(msg.createdAt).toLocaleTimeString();

        txt += `[${role}] ${timestamp}\n`;
        txt += `${msg.content}\n\n`;
        txt += `${'-'.repeat(50)}\n\n`;
    });

    return txt;
}

export default router;
```

Register in `backend/index.ts`:
```typescript
import exportRoutes from './routes/export';
app.use(exportRoutes);
```

---

### **Phase 2: Frontend Export UI (30 mins)**

Add export buttons to `frontend/app/chat/page.tsx`:

```typescript
import { Download } from 'lucide-react';

// Add export function
const exportConversation = async (format: 'markdown' | 'json' | 'txt') => {
  try {
    const response = await fetch(
      `${API_BASE}/api/conversations/${conversationId}/export?format=${format}`
    );

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation.${format}`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Export error:', error);
  }
};

// Add to chat header
<div className="flex gap-2">
  <button
    onClick={() => exportConversation('markdown')}
    className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
    title="Export as Markdown"
  >
    <Download className="w-4 h-4" />
    MD
  </button>
  <button
    onClick={() => exportConversation('json')}
    className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
    title="Export as JSON"
  >
    <Download className="w-4 h-4" />
    JSON
  </button>
  <button
    onClick={() => exportConversation('txt')}
    className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
    title="Export as Text"
  >
    <Download className="w-4 h-4" />
    TXT
  </button>
</div>
```

---

### **Phase 3: Testing (15 mins)**

#### Test Checklist:
- [ ] Export conversation as Markdown
- [ ] Export conversation as JSON
- [ ] Export conversation as TXT
- [ ] Verify file downloads correctly
- [ ] Check formatting in exported files
- [ ] Test with conversations of different lengths

---

## **Expected Results**

✅ Export conversations in 3 formats (MD, JSON, TXT)
✅ Properly formatted with timestamps and roles
✅ One-click download from chat interface
✅ Files include conversation metadata

---

**Implementation Summary:**
1. ✅ **Citation Manager** - Full database, API, and UI (2-3 days)
2. ✅ **Advanced Search Filters** - Enhanced ArXiv search with filters (1-2 days)
3. ✅ **Export Chat History** - Download conversations (1 day)
4. **Paper Comparison Tool** - Coming next
5. **Dark/Light Mode Toggle** - Coming next

All three features above are now fully detailed and ready to implement!
