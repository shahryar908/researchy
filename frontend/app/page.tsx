'use client';
import React, { useState } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { MessageSquare, Menu, X, ChevronDown, FileText, Download } from "lucide-react";
export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

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
              <Link href="#features" className="text-gray-300 hover:text-orange-400 font-medium transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-gray-300 hover:text-orange-400 font-medium transition-colors">
                How it Works
              </Link>
              <Link href="#pricing" className="text-gray-300 hover:text-orange-400 font-medium transition-colors">
                Pricing
              </Link>
              <Link href="#about" className="text-gray-300 hover:text-orange-400 font-medium transition-colors">
                About
              </Link>
              <SignedIn>
                <Link href="/chat" className="text-gray-300 hover:text-orange-400 font-medium transition-colors">
                  Try Demo
                </Link>
              </SignedIn>
              <SignedOut>
                <SignInButton>
                  <button className="text-gray-300 hover:text-orange-400 font-medium transition-colors">
                    Try Demo
                  </button>
                </SignInButton>
              </SignedOut>
            </div>
            
            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-4">
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
                  Dashboard
                </Link>
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10 rounded-full ring-2 ring-orange-200 hover:ring-orange-300 transition-all duration-300"
                    }
                  }}
                />
              </SignedIn>
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
                <Link href="#features" className="text-gray-300 hover:text-orange-400 font-medium px-2 py-1 transition-colors">
                  Features
                </Link>
                <Link href="#how-it-works" className="text-gray-300 hover:text-orange-400 font-medium px-2 py-1 transition-colors">
                  How it Works
                </Link>
                <Link href="#pricing" className="text-gray-300 hover:text-orange-400 font-medium px-2 py-1 transition-colors">
                  Pricing
                </Link>
                <Link href="#about" className="text-gray-300 hover:text-orange-400 font-medium px-2 py-1 transition-colors">
                  About
                </Link>
                <SignedIn>
                  <Link href="/chat" className="text-gray-300 hover:text-orange-400 font-medium px-2 py-1 transition-colors">
                    Try Demo
                  </Link>
                </SignedIn>
                <SignedOut>
                  <SignInButton>
                    <button className="text-gray-300 hover:text-orange-400 font-medium px-2 py-1 transition-colors text-left w-full">
                      Try Demo
                    </button>
                  </SignInButton>
                </SignedOut>
                
                {/* Mobile Auth */}
                <div className="pt-4 border-t border-gray-700">
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
                        Dashboard
                      </Link>
                      <UserButton />
                    </div>
                  </SignedIn>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-orange-500/5"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="text-center">
            {/* Main Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Research Like Never
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                Before
              </span>
            </h1>

            {/* Description */}
            <p className="text-xl lg:text-2xl text-gray-300 max-w-4xl mx-auto mb-16 leading-relaxed">
              From finding the right papers to writing your research — get guided assistance every step of the way. Just ask, and let AI handle the heavy lifting.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <SignUpButton>
                <button className="group relative px-8 py-4 text-white text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-orange-500/25"
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
                  Start Researching Free
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                </button>
              </SignUpButton>
              
              <SignedIn>
                <Link href="/chat">
                  <button className="px-8 py-4 text-gray-300 hover:text-white text-lg font-semibold rounded-xl border border-gray-600 hover:border-orange-400 transition-all duration-300 transform hover:scale-105 hover:bg-gray-800/50">
                    Try Demo
                  </button>
                </Link>
              </SignedIn>
              <SignedOut>
                <SignInButton>
                  <button className="px-8 py-4 text-gray-300 hover:text-white text-lg font-semibold rounded-xl border border-gray-600 hover:border-orange-400 transition-all duration-300 transform hover:scale-105 hover:bg-gray-800/50">
                    Try Demo
                  </button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-12 lg:py-20 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/5 to-transparent"></div>
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6">
              Research Superpowers
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                Unleashed
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Advanced AI capabilities designed specifically for academic research, all accessible through natural conversation.
            </p>
          </div>


          {/* Features Grid */}
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            
            {/* ArXiv Paper Discovery */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              <div className="relative bg-gray-800/40 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-8 hover:bg-gray-800/60 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">ArXiv Paper Discovery</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Search through 2M+ academic papers with intelligent AI ranking and instant access to complete research metadata
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                    Smart relevance ranking
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                    Complete metadata extraction
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                    Direct PDF access
                  </div>
                </div>
              </div>
            </div>

            {/* LaTeX Document Generation */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              <div className="relative bg-gray-800/40 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-8 hover:bg-gray-800/60 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">LaTeX Document Generation</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Generate publication-ready research papers with professional formatting, mathematical equations, and bibliography management
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                    Professional formatting
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                    Mathematical equations
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                    Bibliography management
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time Streaming Intelligence */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              <div className="relative bg-gray-800/40 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-8 hover:bg-gray-800/60 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Real-time Streaming</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Watch AI work in real-time with live progress updates and transparent tool execution for complete research workflow visibility
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                    Server-sent events
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                    Tool visualization
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                    LangGraph workflow
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-12 lg:py-20 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-800/50 to-gray-900"></div>
        <div className="absolute top-1/3 left-1/6 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/6 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6">
              How it
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                Works
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Research made simple in three steps. From question to publication-ready paper.
            </p>
          </div>

          {/* Steps */}
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            
            {/* Step 1 */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-xl">
                1
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-8 pt-12 hover:bg-gray-800/70 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Ask Your Question</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Simply type your research question in natural language. &quot;Find papers about quantum computing applications&quot; or &quot;Generate a literature review on machine learning.&quot;
                </p>
                <div className="bg-gray-900/50 border border-gray-600/30 rounded-xl p-4">
                  <div className="text-sm text-gray-400 mb-2">Example:</div>
                  <div className="text-white italic">&quot;Find recent papers on transformer attention mechanisms&quot;</div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-xl">
                2
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-8 pt-12 hover:bg-gray-800/70 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">AI Searches & Analyzes</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Watch in real-time as AI searches ArXiv, ranks papers by relevance, extracts key information, and builds comprehensive understanding of your topic.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    Searching ArXiv database...
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    Ranking by relevance...
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    Extracting insights...
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-xl">
                3
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-8 pt-12 hover:bg-gray-800/70 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Get Your Results</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Receive comprehensive answers, curated paper lists, or publication-ready LaTeX documents. Everything formatted professionally and ready to use.
                </p>
                <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 border border-emerald-500/20 rounded-xl p-4">
                  <div className="text-emerald-400 text-sm font-medium mb-1">✓ Research Complete</div>
                  <div className="text-gray-300 text-sm">Found 12 relevant papers, generated summary</div>
                </div>
              </div>
            </div>

          </div>

          {/* Call to Action */}
          <div className="text-center mt-16">
            <p className="text-xl text-gray-300 mb-8">
              Ready to revolutionize your research workflow?
            </p>
            <SignUpButton>
              <button className="px-8 py-4 text-white text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-orange-500/25"
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
                Start Researching Now
              </button>
            </SignUpButton>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 lg:py-20 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/5 to-transparent"></div>
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6">
              Simple
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                Pricing
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Start free, scale as you grow. No hidden fees, no surprises.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-8">
            
            {/* Free Plan */}
            <div className="relative group">
              <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-8 hover:bg-gray-800/60 transition-all duration-300">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">Starter</h3>
                  <div className="text-4xl font-bold text-white mb-2">
                    $0
                    <span className="text-lg text-gray-400 font-normal">/month</span>
                  </div>
                  <p className="text-gray-400">Perfect for getting started</p>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-300">5 research queries per day</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-300">ArXiv paper search</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-300">Basic summaries</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-300">Community support</span>
                  </div>
                </div>
                
                <SignUpButton>
                  <button className="w-full px-6 py-3 border border-gray-600 text-gray-300 rounded-xl hover:border-orange-400 hover:text-white transition-all duration-300">
                    Get Started Free
                  </button>
                </SignUpButton>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
              <div className="relative bg-gray-800/60 backdrop-blur-sm border border-orange-500/30 rounded-2xl p-8 hover:bg-gray-800/80 transition-all duration-300">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-orange-400 to-orange-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                </div>
                
                <div className="text-center mb-8 pt-4">
                  <h3 className="text-2xl font-bold text-white mb-2">Professional</h3>
                  <div className="text-4xl font-bold text-white mb-2">
                    $29
                    <span className="text-lg text-gray-400 font-normal">/month</span>
                  </div>
                  <p className="text-gray-400">For serious researchers</p>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-300">Unlimited research queries</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-300">Advanced ArXiv analysis</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-300">LaTeX document generation</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-300">Priority support</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-300">Export to multiple formats</span>
                  </div>
                </div>
                
                <SignUpButton>
                  <button className="w-full px-6 py-3 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-orange-500/25"
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
                    Start Pro Trial
                  </button>
                </SignUpButton>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="relative group md:col-span-2 lg:col-span-1">
              <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-8 hover:bg-gray-800/60 transition-all duration-300">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
                  <div className="text-4xl font-bold text-white mb-2">
                    Custom
                  </div>
                  <p className="text-gray-400">For teams and institutions</p>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-300">Everything in Professional</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-300">Team collaboration tools</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-300">Custom integrations</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-300">Dedicated support</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-300">On-premise deployment</span>
                  </div>
                </div>
                
                <button className="w-full px-6 py-3 border border-purple-500 text-purple-400 rounded-xl hover:bg-purple-500/10 hover:border-purple-400 transition-all duration-300">
                  Contact Sales
                </button>
              </div>
            </div>

          </div>

          {/* FAQ Accordion */}
          <div className="mt-20">
            <h3 className="text-3xl font-bold text-white text-center mb-12">Frequently Asked Questions</h3>
            <div className="max-w-3xl mx-auto space-y-4">
              {[
                {
                  question: "Is there a free trial?",
                  answer: "Yes! The Starter plan is completely free with 5 queries per day. Pro plan includes a 14-day free trial with no credit card required."
                },
                {
                  question: "Can I cancel anytime?",
                  answer: "Absolutely. Cancel your subscription at any time with no cancellation fees or commitments. You'll retain access until the end of your billing period."
                },
                {
                  question: "What payment methods do you accept?",
                  answer: "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for enterprise accounts."
                },
                {
                  question: "Do you offer academic discounts?",
                  answer: "Yes! Students and academic researchers can get 50% off Pro plans with a valid institutional email address. Contact us for verification."
                },
                {
                  question: "How accurate are the AI-generated papers?",
                  answer: "Our AI uses state-of-the-art language models to analyze and synthesize research. However, we recommend always reviewing and validating the content, especially for academic submissions."
                },
                {
                  question: "Can I export papers in different formats?",
                  answer: "Yes! Pro and Enterprise users can export papers in LaTeX, PDF, Word, and Markdown formats. Free users can export as PDF only."
                }
              ].map((faq, index) => (
                <div key={index} className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/30 rounded-xl overflow-hidden hover:border-gray-600/50 transition-all duration-300">
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-700/20 transition-colors"
                  >
                    <h4 className="text-lg font-semibold text-white pr-4">{faq.question}</h4>
                    <ChevronDown
                      className={`w-5 h-5 text-orange-400 flex-shrink-0 transition-transform duration-300 ${
                        openFaqIndex === index ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      openFaqIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p className="px-6 pb-4 text-gray-400 leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}