/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Briefcase, 
  Send, 
  Sparkles, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  BookOpen,
  Target,
  FileText,
  Layers,
  Globe,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Download,
  Copy,
  Check,
  ExternalLink,
  Award,
  Zap
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface PortfolioProject {
  title: string;
  description: string;
  keyFeatures: string[];
  techStack: string[];
}

interface PortfolioData {
  fullName: string;
  tagline: string;
  aboutMe: string;
  skills: string[];
  projects: PortfolioProject[];
  experience: { company: string; role: string; period: string; desc: string }[];
}

type Language = 'en' | 'hi';

const translations = {
  en: {
    title: "AI Portfolio Builder",
    heroTitle: "Generate Your Professional Portfolio",
    heroAccent: "Instantly",
    heroSub: "Don't wait 3 days. Get a complete, AI-crafted portfolio based on your skills in seconds. Ready to copy and use!",
    placeholder: "E.g., Full Stack Developer, Graphic Designer...",
    generate: "Generate Portfolio",
    portfolioTitle: "Your AI-Generated Portfolio",
    aboutMe: "About Me",
    skills: "Core Skills",
    projects: "Featured Projects",
    experience: "Experience",
    copy: "Copy Content",
    copied: "Copied!",
    errorGen: "Something went wrong while generating your portfolio. Please try again.",
    instant: "Instant Generation",
    instantDesc: "No more waiting. Get your full portfolio content in seconds.",
    proQuality: "Pro Quality",
    proQualityDesc: "High-quality descriptions and project ideas tailored to your niche.",
    readyToUse: "Ready to Use",
    readyToUseDesc: "Copy the content directly to your website, LinkedIn, or resume.",
    loadingMsg: "AI is crafting your professional portfolio...",
  },
  hi: {
    title: "AI पोर्टफोलियो बिल्डर",
    heroTitle: "अपना प्रोफेशनल पोर्टफोलियो",
    heroAccent: "तुरंत",
    heroSub: "3 दिन का इंतज़ार क्यों? अपनी स्किल्स के आधार पर सेकंडों में एक पूरा AI-क्राफ्टेड पोर्टफोलियो पाएं। कॉपी करें और इस्तेमाल करें!",
    placeholder: "जैसे: फुल स्टैक डेवलपर, ग्राफिक डिज़ाइनर...",
    generate: "पोर्टफोलियो बनाएं",
    portfolioTitle: "आपका AI-जेनरेटेड पोर्टफोलियो",
    aboutMe: "मेरे बारे में",
    skills: "मुख्य स्किल्स",
    projects: "प्रमुख प्रोजेक्ट्स",
    experience: "अनुभव",
    copy: "कंटेंट कॉपी करें",
    copied: "कॉपी हो गया!",
    errorGen: "पोर्टफोलियो बनाने में कुछ गलत हो गया। कृपया फिर से प्रयास करें।",
    instant: "तुरंत जनरेशन",
    instantDesc: "अब और इंतज़ार नहीं। सेकंडों में अपना पूरा पोर्टफोलियो कंटेंट पाएं।",
    proQuality: "प्रो क्वालिटी",
    proQualityDesc: "आपकी नीश के हिसाब से हाई-क्वालिटी विवरण और प्रोजेक्ट आइडियाज।",
    readyToUse: "इस्तेमाल के लिए तैयार",
    readyToUseDesc: "कंटेंट को सीधे अपनी वेबसाइट, लिंक्डइन या रिज्यूमे पर कॉपी करें।",
    loadingMsg: "AI आपका प्रोफेशनल पोर्टफोलियो तैयार कर रहा है...",
  }
};

export default function App() {
  const [skill, setSkill] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<Language>('hi');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewingSlug, setViewingSlug] = useState<string | null>(null);
  const [finalUrl, setFinalUrl] = useState<string | null>(null);

  const portfolioRef = useRef<HTMLDivElement>(null);
  const t = translations[lang];

  useEffect(() => {
    // Check if we are viewing a portfolio
    const path = window.location.pathname;
    if (path.startsWith('/p/')) {
      const slug = path.split('/p/')[1];
      if (slug) {
        setViewingSlug(slug);
        fetchPortfolio(slug);
      }
    }
  }, []);

  const fetchPortfolio = async (slug: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/portfolios/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setPortfolio(data);
      } else {
        setError("Portfolio not found.");
      }
    } catch (err) {
      setError("Failed to load portfolio.");
    } finally {
      setLoading(false);
    }
  };

  const generatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skill.trim()) return;

    setLoading(true);
    setError(null);
    setPortfolio(null);
    setFinalUrl(null);

    try {
      const model = "gemini-3-flash-preview";
      const prompt = `You are an expert Portfolio Strategist. Generate a COMPLETE professional portfolio for a person with the skill: "${skill}".
      
      Return the response in JSON format with this structure:
      {
        "fullName": "Full Name",
        "tagline": "A catchy professional tagline",
        "aboutMe": "A compelling 3-paragraph professional bio",
        "skills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5"],
        "projects": [
          {
            "title": "Project Name",
            "description": "A detailed description of a high-impact project",
            "keyFeatures": ["Feature 1", "Feature 2"],
            "techStack": ["Tech 1", "Tech 2"]
          },
          {
            "title": "Another Project",
            "description": "Description of another impressive project",
            "keyFeatures": ["Feature 1", "Feature 2"],
            "techStack": ["Tech 1", "Tech 2"]
          }
        ],
        "experience": [
          {
            "company": "Fictional Top Company",
            "role": "Senior ${skill}",
            "period": "2022 - Present",
            "desc": "Key achievements and responsibilities"
          }
        ]
      }
      
      Language: ${lang === 'hi' ? 'Hindi context but English text (professional portfolios are usually in English)' : 'English'}.`;

      const result = await genAI.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
        }
      });

      const responseText = result.text;
      if (responseText) {
        const parsed = JSON.parse(responseText) as PortfolioData;
        
        // Handle Slug
        let slug = customSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
        if (!slug) {
          slug = `portfolio-${skill.toLowerCase().split(' ')[0]}-${Math.random().toString(36).substring(2, 7)}`;
        }

        // Save to DB
        const saveRes = await fetch('/api/portfolios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, data: parsed })
        });

        if (saveRes.ok) {
          setPortfolio(parsed);
          setFinalUrl(`${window.location.origin}/p/${slug}`);
          setTimeout(() => {
            portfolioRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        } else {
          const errData = await saveRes.json();
          setError(errData.error || "Failed to save portfolio.");
        }
      }
    } catch (err) {
      console.error(err);
      setError(t.errorGen);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (textToCopy?: string) => {
    if (!portfolio && !textToCopy) return;
    
    let text = textToCopy;
    if (!text) {
      text = `
${portfolio?.fullName}
${portfolio?.tagline}

ABOUT ME:
${portfolio?.aboutMe}

SKILLS:
${portfolio?.skills.join(', ')}

PROJECTS:
${portfolio?.projects.map(p => `${p.title}\n${p.description}\nTech: ${p.techStack.join(', ')}`).join('\n\n')}

EXPERIENCE:
${portfolio?.experience.map(e => `${e.role} at ${e.company} (${e.period})\n${e.desc}`).join('\n\n')}
      `.trim();
    }
    
    navigator.clipboard.writeText(text!);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (viewingSlug && portfolio) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] text-[#1A1A1A] font-sans">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-zinc-100 overflow-hidden">
            <div className="bg-zinc-900 p-10 md:p-20 text-white text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500 rounded-full blur-[100px]"></div>
              </div>
              <div className="relative z-10">
                <h4 className="text-4xl md:text-6xl font-black mb-4 font-display tracking-tight">{portfolio.fullName}</h4>
                <p className="text-xl md:text-2xl text-indigo-400 font-bold italic">{portfolio.tagline}</p>
              </div>
            </div>
            <div className="p-8 md:p-20 space-y-20">
              <div className="grid md:grid-cols-3 gap-16">
                <div className="md:col-span-2 space-y-6">
                  <div className="flex items-center gap-3 text-indigo-600 font-black uppercase text-xs tracking-[0.2em]">
                    <UserIcon className="w-4 h-4" />
                    <span>{t.aboutMe}</span>
                  </div>
                  <div className="text-zinc-600 text-lg leading-relaxed space-y-4">
                    {portfolio.aboutMe.split('\n').map((p, i) => <p key={i}>{p}</p>)}
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center gap-3 text-indigo-600 font-black uppercase text-xs tracking-[0.2em]">
                    <Award className="w-4 h-4" />
                    <span>{t.skills}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {portfolio.skills.map((skill, i) => (
                      <span key={i} className="bg-zinc-100 text-zinc-700 px-4 py-2 rounded-xl text-sm font-bold border border-zinc-200">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-10">
                <div className="flex items-center gap-3 text-indigo-600 font-black uppercase text-xs tracking-[0.2em]">
                  <Layers className="w-4 h-4" />
                  <span>{t.projects}</span>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                  {portfolio.projects.map((project, i) => (
                    <div key={i} className="group p-8 rounded-[2rem] bg-zinc-50 border border-zinc-100 hover:bg-white hover:shadow-xl transition-all duration-500">
                      <h5 className="text-2xl font-bold mb-4 group-hover:text-indigo-600 transition-colors">{project.title}</h5>
                      <p className="text-zinc-500 mb-6 leading-relaxed">{project.description}</p>
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {project.techStack.map((tech, j) => (
                            <span key={j} className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md">
                              {tech}
                            </span>
                          ))}
                        </div>
                        <ul className="space-y-2">
                          {project.keyFeatures.map((feature, j) => (
                            <li key={j} className="flex items-center gap-2 text-sm text-zinc-600">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-10">
                <div className="flex items-center gap-3 text-indigo-600 font-black uppercase text-xs tracking-[0.2em]">
                  <Briefcase className="w-4 h-4" />
                  <span>{t.experience}</span>
                </div>
                <div className="space-y-8">
                  {portfolio.experience.map((exp, i) => (
                    <div key={i} className="flex flex-col md:flex-row md:items-start gap-4 md:gap-12 p-8 rounded-[2rem] border border-zinc-100">
                      <div className="md:w-48 shrink-0">
                        <p className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-1">{exp.period}</p>
                        <p className="font-bold text-zinc-400">{exp.company}</p>
                      </div>
                      <div className="space-y-2">
                        <h6 className="text-xl font-bold">{exp.role}</h6>
                        <p className="text-zinc-500 leading-relaxed">{exp.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 text-center">
            <a href="/" className="text-indigo-600 font-bold hover:underline flex items-center justify-center gap-2">
              Create your own AI Portfolio <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#1A1A1A] font-sans selection:bg-indigo-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-zinc-100 px-4 md:px-6 py-3 md:py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 md:p-2 rounded-xl shadow-lg shadow-indigo-200">
              <Zap className="w-4 h-4 md:w-5 md:h-5 text-white fill-white" />
            </div>
            <h1 className="font-bold text-lg md:text-xl tracking-tight font-display">{t.title}</h1>
          </div>

          {/* Desktop Nav */}
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
              className="flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-indigo-600 transition-colors"
            >
              <Globe className="w-4 h-4" />
              {lang === 'en' ? 'Hindi' : 'English'}
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-zinc-600">
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-zinc-100 p-4 space-y-4 shadow-2xl animate-in slide-in-from-top-2 duration-200">
            <button 
              onClick={() => { setLang(lang === 'en' ? 'hi' : 'en'); setIsMenuOpen(false); }}
              className="flex items-center gap-3 w-full p-4 rounded-2xl bg-zinc-50 text-zinc-700 font-bold"
            >
              <Globe className="w-5 h-5" />
              {lang === 'en' ? 'Switch to Hindi' : 'Switch to English'}
            </button>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-20">
        {/* Hero Section */}
        <section className="text-center mb-12 md:mb-20">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-xs md:text-sm font-bold mb-6 animate-bounce">
            <Sparkles className="w-4 h-4 fill-indigo-600" />
            <span>AI Powered Portfolio Generator</span>
          </div>
          <h2 className="text-4xl md:text-7xl font-extrabold mb-6 tracking-tight text-zinc-900 leading-[1.1] font-display">
            {t.heroTitle} <br className="hidden md:block" />
            <span className="text-indigo-600 italic">{t.heroAccent}</span>
          </h2>
          <p className="text-lg md:text-xl text-zinc-500 max-w-3xl mx-auto px-4 leading-relaxed">
            {t.heroSub}
          </p>
        </section>

        {/* Input Form */}
        <section className="max-w-3xl mx-auto mb-16 md:mb-24">
          <form onSubmit={generatePortfolio} className="space-y-6">
            <div className="relative group">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-[2rem] blur-xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative flex flex-col md:flex-row items-stretch md:items-center bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-2xl border border-zinc-100 overflow-hidden p-2">
                <input
                  type="text"
                  value={skill}
                  onChange={(e) => setSkill(e.target.value)}
                  placeholder={t.placeholder}
                  className="flex-1 px-6 md:px-8 py-5 md:py-6 text-lg md:text-xl outline-none placeholder:text-zinc-300 font-medium"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !skill.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 md:px-12 py-5 md:py-6 rounded-[1.2rem] md:rounded-[1.5rem] font-bold transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-indigo-200"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6 fill-white" />}
                  <span className="text-lg">{t.generate}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
              <div className="flex items-center gap-2 bg-white px-6 py-3 rounded-2xl border border-zinc-100 shadow-sm w-full md:w-auto">
                <span className="text-zinc-400 text-sm font-bold">URL:</span>
                <span className="text-zinc-300 text-sm">{window.location.origin}/p/</span>
                <input 
                  type="text"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value)}
                  placeholder="custom-slug (optional)"
                  className="outline-none text-sm font-bold text-indigo-600 placeholder:text-zinc-200 w-32"
                />
              </div>
              <p className="text-xs text-zinc-400 italic">Leave empty for AI generated URL</p>
            </div>
          </form>
          
          {loading && (
            <div className="mt-8 text-center animate-pulse">
              <p className="text-indigo-600 font-bold tracking-wide uppercase text-xs">{t.loadingMsg}</p>
            </div>
          )}
          {error && (
            <div className="mt-6 flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-2xl border border-red-100">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-bold">{error}</span>
            </div>
          )}
        </section>

        {/* Portfolio Result */}
        {portfolio && (
          <div ref={portfolioRef} className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-2">
              <h3 className="text-2xl font-bold font-display">{t.portfolioTitle}</h3>
              <div className="flex flex-wrap gap-4">
                {finalUrl && (
                  <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">
                    <span className="text-xs font-bold text-indigo-600 truncate max-w-[200px]">{finalUrl}</span>
                    <button onClick={() => copyToClipboard(finalUrl)} className="text-indigo-400 hover:text-indigo-600">
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <a href={finalUrl} target="_blank" className="text-indigo-400 hover:text-indigo-600">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}
                <button 
                  onClick={() => copyToClipboard()}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all border",
                    copied ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                  )}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? t.copied : t.copy}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-zinc-100 overflow-hidden">
              {/* Portfolio Header */}
              <div className="bg-zinc-900 p-10 md:p-20 text-white text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                  <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[100px]"></div>
                  <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500 rounded-full blur-[100px]"></div>
                </div>
                <div className="relative z-10">
                  <h4 className="text-4xl md:text-6xl font-black mb-4 font-display tracking-tight">{portfolio.fullName}</h4>
                  <p className="text-xl md:text-2xl text-indigo-400 font-bold italic">{portfolio.tagline}</p>
                </div>
              </div>

              <div className="p-8 md:p-20 space-y-20">
                {/* About & Skills */}
                <div className="grid md:grid-cols-3 gap-16">
                  <div className="md:col-span-2 space-y-6">
                    <div className="flex items-center gap-3 text-indigo-600 font-black uppercase text-xs tracking-[0.2em]">
                      <UserIcon className="w-4 h-4" />
                      <span>{t.aboutMe}</span>
                    </div>
                    <div className="text-zinc-600 text-lg leading-relaxed space-y-4">
                      {portfolio.aboutMe.split('\n').map((p, i) => <p key={i}>{p}</p>)}
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 text-indigo-600 font-black uppercase text-xs tracking-[0.2em]">
                      <Award className="w-4 h-4" />
                      <span>{t.skills}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {portfolio.skills.map((skill, i) => (
                        <span key={i} className="bg-zinc-100 text-zinc-700 px-4 py-2 rounded-xl text-sm font-bold border border-zinc-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Projects */}
                <div className="space-y-10">
                  <div className="flex items-center gap-3 text-indigo-600 font-black uppercase text-xs tracking-[0.2em]">
                    <Layers className="w-4 h-4" />
                    <span>{t.projects}</span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-8">
                    {portfolio.projects.map((project, i) => (
                      <div key={i} className="group p-8 rounded-[2rem] bg-zinc-50 border border-zinc-100 hover:bg-white hover:shadow-xl transition-all duration-500">
                        <h5 className="text-2xl font-bold mb-4 group-hover:text-indigo-600 transition-colors">{project.title}</h5>
                        <p className="text-zinc-500 mb-6 leading-relaxed">{project.description}</p>
                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-2">
                            {project.techStack.map((tech, j) => (
                              <span key={j} className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md">
                                {tech}
                              </span>
                            ))}
                          </div>
                          <ul className="space-y-2">
                            {project.keyFeatures.map((feature, j) => (
                              <li key={j} className="flex items-center gap-2 text-sm text-zinc-600">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Experience */}
                <div className="space-y-10">
                  <div className="flex items-center gap-3 text-indigo-600 font-black uppercase text-xs tracking-[0.2em]">
                    <Briefcase className="w-4 h-4" />
                    <span>{t.experience}</span>
                  </div>
                  <div className="space-y-8">
                    {portfolio.experience.map((exp, i) => (
                      <div key={i} className="flex flex-col md:flex-row md:items-start gap-4 md:gap-12 p-8 rounded-[2rem] border border-zinc-100">
                        <div className="md:w-48 shrink-0">
                          <p className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-1">{exp.period}</p>
                          <p className="font-bold text-zinc-400">{exp.company}</p>
                        </div>
                        <div className="space-y-2">
                          <h6 className="text-xl font-bold">{exp.role}</h6>
                          <p className="text-zinc-500 leading-relaxed">{exp.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features Section */}
        {!portfolio && !loading && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="p-10 rounded-[2.5rem] bg-white border border-zinc-100 shadow-sm hover:shadow-xl transition-all duration-500 group">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Zap className="w-7 h-7 text-indigo-600 fill-indigo-600" />
              </div>
              <h4 className="text-xl font-bold mb-3 font-display">{t.instant}</h4>
              <p className="text-zinc-500 leading-relaxed">
                {t.instantDesc}
              </p>
            </div>
            <div className="p-10 rounded-[2.5rem] bg-white border border-zinc-100 shadow-sm hover:shadow-xl transition-all duration-500 group">
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Award className="w-7 h-7 text-purple-600" />
              </div>
              <h4 className="text-xl font-bold mb-3 font-display">{t.proQuality}</h4>
              <p className="text-zinc-500 leading-relaxed">
                {t.proQualityDesc}
              </p>
            </div>
            <div className="p-10 rounded-[2.5rem] bg-white border border-zinc-100 shadow-sm hover:shadow-xl transition-all duration-500 group">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <h4 className="text-xl font-bold mb-3 font-display">{t.readyToUse}</h4>
              <p className="text-zinc-500 leading-relaxed">
                {t.readyToUseDesc}
              </p>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-100 py-16 px-6 bg-white mt-20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left">
          <div className="space-y-4">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <Zap className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="font-bold text-xl font-display">{t.title}</span>
            </div>
            <p className="text-zinc-400 text-sm max-w-xs">
              Empowering professionals to showcase their best work instantly using advanced AI.
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-12 md:gap-24">
            <div className="space-y-4">
              <h5 className="font-bold text-sm uppercase tracking-widest text-zinc-300">Product</h5>
              <ul className="space-y-2 text-zinc-500 font-medium">
                <li className="hover:text-indigo-600 cursor-pointer transition-colors">Generator</li>
                <li className="hover:text-indigo-600 cursor-pointer transition-colors">Templates</li>
                <li className="hover:text-indigo-600 cursor-pointer transition-colors">Pricing</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h5 className="font-bold text-sm uppercase tracking-widest text-zinc-300">Social</h5>
              <ul className="space-y-2 text-zinc-500 font-medium">
                <li className="hover:text-indigo-600 cursor-pointer transition-colors">Twitter</li>
                <li className="hover:text-indigo-600 cursor-pointer transition-colors">LinkedIn</li>
                <li className="hover:text-indigo-600 cursor-pointer transition-colors">Instagram</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-16 pt-8 border-t border-zinc-50 text-center">
          <p className="text-zinc-300 text-xs font-bold uppercase tracking-widest">
            © 2026 AI Portfolio Builder. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
