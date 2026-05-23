import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  FileText,
  Clock,
  Brain,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Sun,
  Moon,
  ChevronDown,
  Info,
  CheckCircle,
  UploadCloud,
  Timer,
  Award,
  BookOpen,
  HelpCircle,
  Search,
} from "lucide-react";

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

interface FAQItem {
  question: string;
  answer: string;
}

export default function LandingPage() {
  const { currentUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);
  
  // Interactive PDF demo state
  const [demoState, setDemoState] = useState<"upload" | "parsing" | "test" | "analysis">("upload");
  const [demoProgress, setDemoProgress] = useState(0);

  // Animation Refs
  const heroRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctasRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const marketplaceRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);

  // Set mounted state and dynamically update SEO Meta & JSON-LD schema
  useEffect(() => {
    setMounted(true);
    
    // Set document head variables dynamically for search engines
    document.title = "All in One Mock - NextGen AI Mock Test Platform & PYQP Marketplace";
    
    const updateOrCreateMeta = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? "property" : "name";
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    updateOrCreateMeta("description", "All in One Mock is a high-conversion test-series marketplace. Instantly convert PDF question papers into interactive timed exams. Practice free PYQPs and get Generative AI analysis of concept blindspots, speed traps, and stress patterns.");
    updateOrCreateMeta("keywords", "All in One Mock, AI Mock Test, Previous Year Question Papers, PYQP, PDF to Mock Test, Test Series Marketplace, AI Exam Mentor, Concept Blindspots, Exam Speed Traps, Personal Success Roadmap");
    updateOrCreateMeta("og:title", "All in One Mock - NextGen AI Mock Test Platform");
    updateOrCreateMeta("og:description", "Convert static PDFs into live interactive exams. Access free PYQPs and receive hyper-personalized AI analysis of concept blindspots, speed traps, and exam stress patterns.");
    updateOrCreateMeta("og:url", window.location.origin);
    updateOrCreateMeta("twitter:title", "All in One Mock - PDF to Interactive Exam Platform");
    updateOrCreateMeta("twitter:description", "Get free PYQPs and receive hyper-personalized Generative AI feedback on concept blindspots, stress-induced patterns, and speed traps.");

    // Inject high-density JSON-LD Schema for advanced GEO and search rankings
    const schemaId = "allinonemock-structured-schema";
    let schemaScript = document.getElementById(schemaId) as HTMLScriptElement;
    if (!schemaScript) {
      schemaScript = document.createElement("script");
      schemaScript.id = schemaId;
      schemaScript.type = "application/ld+json";
      document.head.appendChild(schemaScript);
    }

    const schemaData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "SoftwareApplication",
          "@id": `${window.location.origin}/#software`,
          "name": "All in One Mock",
          "applicationCategory": "EducationalApplication, SaaS",
          "operatingSystem": "All",
          "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": "USD",
            "lowPrice": "0.00",
            "highPrice": "49.00",
            "description": "Freemium PYQPs with premium mock test-series purchases"
          },
          "description": "A high-conversion, test-series marketplace engineered to convert traffic using free Previous Year Question Papers (PYQPs) and instantly convert uploaded structural PDFs into timed mock tests with generative AI cognitive diagnostic roadmaps.",
          "publisher": {
            "@type": "Organization",
            "@id": `${window.location.origin}/#organization`,
            "name": "All in One Mock Inc.",
            "url": window.location.origin
          }
        },
        {
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What is All in One Mock and how does it act as an AI exam mentor?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "All in One Mock is a state-of-the-art AI mock test platform. Instead of giving simple percentage scores, it uses a hyper-personalized Generative AI Analysis layer to act as a digital mentor. It detects cognitive drop-offs like concept blindspots, stress patterns, and speed traps, offering students an actionable success roadmap."
              }
            },
            {
              "@type": "Question",
              "name": "How does the PDF to interactive timed mock test converter work?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Admins or educators simply upload standard structural exam PDFs. All in One Mock instantly parses and digests the document questions and options, immediately generating a live, interactive, timed online testing environment—completely eliminating manual database entries."
              }
            },
            {
              "@type": "Question",
              "name": "What is the freemium acquisition hook of All in One Mock?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "The platform offers a vast vault of Free Previous Year Question Papers (PYQPs) in a live, timed interactive test format. This hook attracts massive volumes of student traffic, which then seamlessly converts into curated premium mock test-series packages."
              }
            }
          ]
        }
      ]
    };

    schemaScript.textContent = JSON.stringify(schemaData);
  }, []);

  // Demo flow simulator for the interactive visual card
  useEffect(() => {
    if (demoState === "parsing") {
      const interval = setInterval(() => {
        setDemoProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setDemoState("test"), 600);
            return 100;
          }
          return prev + 8;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [demoState]);

  // GSAP Entrance and Scroll Trigger Animations
  useEffect(() => {
    if (!mounted) return;

    // Reset components to pre-animation state
    gsap.set([badgeRef.current, titleRef.current, subtitleRef.current, ctasRef.current, previewRef.current], { 
      opacity: 0, 
      y: 35 
    });

    // Staged entrance timeline
    const tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.8 } });
    
    tl.to(badgeRef.current, { opacity: 1, y: 0, delay: 0.1 })
      .to(titleRef.current, { opacity: 1, y: 0 }, "-=0.65")
      .to(subtitleRef.current, { opacity: 1, y: 0 }, "-=0.65")
      .to(ctasRef.current, { opacity: 1, y: 0 }, "-=0.65")
      .to(previewRef.current, { opacity: 1, y: 0 }, "-=0.5");

    // Scroll Trigger Reveal for Features Cards
    if (featuresRef.current) {
      const cards = featuresRef.current.querySelectorAll(".feature-card");
      gsap.fromTo(
        cards,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.15,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: {
            trigger: featuresRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        }
      );
    }

    // Scroll Trigger Reveal for Marketplace Section
    if (marketplaceRef.current) {
      gsap.fromTo(
        marketplaceRef.current,
        { opacity: 0, y: 35 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: marketplaceRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    }

    // Scroll Trigger Reveal for FAQ
    if (faqRef.current) {
      gsap.fromTo(
        faqRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: faqRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [mounted]);

  // Routing checks
  const getStartedLink = () => {
    if (currentUser?.organization && currentUser.user_id) {
      return `/${currentUser.organization.org_name}/${currentUser.user_id}/dashboard`;
    }
    return "/login";
  };

  const faqs: FAQItem[] = [
    {
      question: "What is All in One Mock and how does it differ from traditional mock test sites?",
      answer: "All in One Mock is a state-of-the-art NextGen AI Mock Test Platform. Traditional mock test websites rely on slow, question-by-question manual entries into databases. All in One Mock completely bypasses this by instantly digesting standard structural exam PDFs uploaded by administrators, generating timed interactive exam interfaces immediately. Furthermore, instead of just printing a simple quantitative percentage score, our generative AI analysis acts as a digital mentor, identifying cognitive concept blindspots, time-management speed traps, and stress-induced drop-offs."
    },
    {
      question: "How does the PDF-to-interactive timed exam converter operate?",
      answer: "When an administrator uploads an exam PDF (such as a JEE, NEET, SAT, or Civil Services test paper), our structural parsing algorithm immediately reads the text structure, isolating individual question blocks, code segments, diagrams, and options. Within fractions of a second, the static paper is transformed into a live exam environment containing navigation drawers, individual timers, interactive multiple-choice buttons, and instant bookmarking utilities."
    },
    {
      question: "How does the Freemium PYQP acquisition hook convert traffic?",
      answer: "All in One Mock uses high-conversion freemium economics. By offering a vast, searchable database of Free Previous Year Question Papers (PYQPs) transformed into live, timed test-series environments, we attract hundreds of thousands of students. Users practice these high-quality past exams completely free. As students experience the benefit of interactive testing and detailed feedback, they are seamlessly guided toward purchasing premium, expert-curated test-series marketplace products."
    },
    {
      question: "What specific analytics are provided in the Generative AI Success Roadmap?",
      answer: "Unlike standard performance reports, our hyper-personalized Generative AI Analysis calculates psychological and structural exam drop-offs: (1) Concept Blindspots (mapping exactly which syllabus nodes are compromised), (2) Speed Traps (flagging questions where the student spent excessive time but still answered incorrectly), and (3) Stress-Induced Patterns (identifying sudden inaccuracies in the last 15 minutes of an exam). The engine then renders a day-by-day learning roadmap to close these operational gaps."
    },
    {
      question: "How can content creators and institutions sell test series on All in One Mock?",
      answer: "All in One Mock features an integrated test-series marketplace. Independent content creators, tutoring institutes, and educators can launch their own custom store pages, set pricing structures, and upload their exam series. Our platform manages all user subscriptions, secure checkouts, exam hosting, and automated AI evaluation reports, functioning as a full-stack educational commerce engine."
    }
  ];

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 transition-smooth overflow-x-hidden">


      {/* 1. APP HEADER */}
      <header className="sticky top-0 z-50 w-full glass-modern border-b border-border transition-smooth no-print">
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 focus-visible:ring-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-sm">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              allinonemock
            </span>
          </Link>

          {/* Navigation links optimized for traditional SEO internal structure */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Core Engine</a>
            <a href="#demo" className="hover:text-foreground transition-colors">Instant Parser</a>
            <a href="#marketplace" className="hover:text-foreground transition-colors">Premium Marketplace</a>
            <a href="#faq" className="hover:text-foreground transition-colors">AEO FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            {/* next-themes Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full h-10 w-10 text-muted-foreground hover:text-foreground focus-visible:ring-2"
              aria-label="Toggle light and dark mode"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 animate-scale-in" />
              ) : (
                <Moon className="h-5 w-5 animate-scale-in" />
              )}
            </Button>

            {/* Premium CTA */}
            <Link to={getStartedLink()}>
              <Button className="px-5 rounded-full font-medium shadow-depth-1 hover-lift bg-primary text-white">
                {currentUser ? "My Dashboard" : "Practice Free PYQPs"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <main>
        <section
          ref={heroRef}
          className="relative container mx-auto px-4 md:px-8 pt-16 md:pt-24 pb-20 flex flex-col items-center text-center z-10"
        >
          {/* AEO / GEO Search Engine Optimization Badge */}
          <div
            ref={badgeRef}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold text-primary tracking-wide mb-6 uppercase shadow-glow"
          >
            <Sparkles className="h-3.5 w-3.5 text-violet-500 animate-pulse-slow" />
            <span>NextGen AI Mock Test Platform</span>
          </div>

          {/* High-Impact SEO Heading */}
          <h1
            ref={titleRef}
            className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl text-foreground leading-[1.1] mb-6"
          >
            Instant Timed Mock Exams from Any PDF
          </h1>

          {/* High-Conversion Copy */}
          <p
            ref={subtitleRef}
            className="text-lg md:text-xl text-muted-foreground max-w-3xl font-normal leading-relaxed mb-8"
          >
            Upload any static question PDF and instantly generate an interactive, timed mock environment. Access thousands of free interactive Previous Year Papers (PYQPs), and get hyper-personalized AI Roadmaps detailing your concept blindspots and speed traps.
          </p>

          {/* Hero Actions */}
          <div ref={ctasRef} className="flex flex-col sm:flex-row items-center gap-4 mb-16 w-full sm:w-auto">
            <Link to={getStartedLink()} className="w-full sm:w-auto">
              <Button size="lg" className="rounded-full px-8 font-semibold shadow-depth-2 hover-lift h-12 w-full bg-primary text-white">
                Upload PDF & Start Mock
              </Button>
            </Link>
            <a href="#demo" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="rounded-full px-8 font-semibold hover-lift h-12 w-full">
                See How It Works
              </Button>
            </a>
          </div>

          {/* Interactive Simulation Dashboard Component */}
          <div
            ref={previewRef}
            id="demo"
            className="relative w-full max-w-4xl rounded-2xl overflow-hidden glass-modern border border-border p-3 md:p-4 shadow-depth-3 transition-smooth duration-500"
          >
            <div className="rounded-xl overflow-hidden bg-muted/10 border border-border/50 aspect-[16/10] flex flex-col justify-between relative p-4 md:p-6 min-h-[380px]">
              
              {/* Top simulation toolbar */}
              <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-4">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex bg-muted/40 rounded-full px-4 py-1 text-xs font-semibold gap-3 text-muted-foreground border border-border/30">
                  <span
                    onClick={() => { setDemoState("upload"); setDemoProgress(0); }}
                    className={`cursor-pointer transition-colors ${demoState === "upload" ? "text-primary" : ""}`}
                  >
                    1. Upload
                  </span>
                  <span className={`transition-colors ${demoState === "parsing" ? "text-primary" : ""}`}>2. Parse</span>
                  <span
                    onClick={() => setDemoState("test")}
                    className={`cursor-pointer transition-colors ${demoState === "test" ? "text-primary" : ""}`}
                  >
                    3. Live Timed Exam
                  </span>
                  <span
                    onClick={() => setDemoState("analysis")}
                    className={`cursor-pointer transition-colors ${demoState === "analysis" ? "text-primary" : ""}`}
                  >
                    4. AI Diagnostic
                  </span>
                </div>
              </div>

              {/* SIMULATION VIEWS */}
              <div className="flex-1 flex flex-col justify-center items-center">
                <AnimatePresence mode="wait">
                  {/* VIEW 1: UPLOAD ZONE */}
                  {demoState === "upload" && (
                    <motion.div
                      key="upload"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex flex-col items-center justify-center border-2 border-dashed border-primary/20 bg-primary/5 rounded-xl p-8 max-w-lg w-full cursor-pointer hover:border-primary/45 transition-colors"
                      onClick={() => setDemoState("parsing")}
                    >
                      <UploadCloud className="h-12 w-12 text-primary mb-4 animate-float" />
                      <h3 className="text-lg font-bold mb-1">Drag & Drop Your Structural Exam PDF</h3>
                      <p className="text-xs text-muted-foreground text-center max-w-sm mb-4">
                        Admit exam papers, previous year mock questions, or school tests. Our AI auto-digests it in seconds.
                      </p>
                      <Button size="sm" className="rounded-full bg-primary/95 text-white">Select File</Button>
                    </motion.div>
                  )}

                  {/* VIEW 2: PARSING LOADER */}
                  {demoState === "parsing" && (
                    <motion.div
                      key="parsing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center max-w-md w-full"
                    >
                      <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-bold mb-1.5">Parsing Exam Document Structure...</h3>
                      <p className="text-xs text-muted-foreground text-center mb-4">
                        Isolating question sets, code blocks, MCQs, and layout parameters.
                      </p>
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden border border-border/30">
                        <div className="bg-primary h-full transition-all" style={{ width: `${demoProgress}%` }} />
                      </div>
                    </motion.div>
                  )}

                  {/* VIEW 3: TIMED LIVE TEST RUN */}
                  {demoState === "test" && (
                    <motion.div
                      key="test"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="w-full h-full flex flex-col md:flex-row gap-4 text-left"
                    >
                      {/* Interactive mock exam sidebar */}
                      <div className="flex-[3] border border-border/60 rounded-xl p-4 bg-muted/10 relative overflow-hidden flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-3">
                            <span className="text-xs font-bold text-primary tracking-wide">QUESTION 14 OF 75</span>
                            <div className="flex items-center gap-1 bg-red-500/10 text-red-500 px-2 py-0.5 rounded text-[10px] font-bold border border-red-500/15">
                              <Timer className="h-3 w-3" /> 01:45:12 REMAINING
                            </div>
                          </div>
                          <p className="text-sm font-semibold mb-3 leading-relaxed">
                            Q14: An elastic sphere of mass 'm' collides with a rigid wall at velocity 'v'. Calculate the total momentum transfer if the coefficient of restitution is e = 0.8.
                          </p>
                          <div className="space-y-2">
                            {["A) 1.8 mv (Correct Momentum Transfer)", "B) 0.8 mv", "C) 2.0 mv", "D) 0.2 mv"].map((opt, i) => (
                              <div
                                key={i}
                                className={`p-2.5 rounded-lg border text-xs cursor-pointer font-medium transition-colors hover:bg-muted/30 ${
                                  i === 0 ? "border-primary bg-primary/5 text-primary" : "border-border/60"
                                }`}
                              >
                                {opt}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-border/40">
                          <Button variant="ghost" size="sm" className="text-xs">Previous</Button>
                          <Button size="sm" className="bg-primary hover:bg-primary/90 text-white text-xs rounded-full" onClick={() => setDemoState("analysis")}>
                            Submit Exam
                          </Button>
                        </div>
                      </div>

                      {/* Side navigation matrix */}
                      <div className="flex-1 border border-border/60 rounded-xl p-3 bg-muted/5 flex flex-col justify-between text-xs">
                        <div>
                          <h4 className="font-bold mb-2 text-muted-foreground uppercase text-[10px] tracking-wider">Exam Matrix</h4>
                          <div className="grid grid-cols-5 gap-1.5 text-center font-bold">
                            {Array.from({ length: 15 }).map((_, i) => (
                              <div
                                key={i}
                                className={`py-1.5 rounded text-[10px] border ${
                                  i === 13
                                    ? "bg-primary border-primary text-white"
                                    : i < 10
                                    ? "bg-green-500/10 border-green-500/20 text-success"
                                    : "bg-muted border-border/50 text-muted-foreground"
                                }`}
                              >
                                {i + 1}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="mt-4 pt-2 border-t border-border/40 text-[10px] text-muted-foreground space-y-1.5">
                          <div className="flex justify-between"><span>Answered:</span> <span className="font-bold text-success">10</span></div>
                          <div className="flex justify-between"><span>Active:</span> <span className="font-bold text-primary">1</span></div>
                          <div className="flex justify-between"><span>Unvisited:</span> <span className="font-bold text-muted-foreground">4</span></div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* VIEW 4: GENAI ANALYSIS LAYER */}
                  {demoState === "analysis" && (
                    <motion.div
                      key="analysis"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="w-full h-full flex flex-col text-left gap-4"
                    >
                      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs text-primary font-bold mb-1">
                            <Brain className="h-4 w-4" /> HYPER-PERSONALIZED AI COGNITIVE DIAGNOSTIC
                          </div>
                          <h3 className="text-lg font-extrabold leading-tight">Your Success Roadmap</h3>
                        </div>
                        <Button size="sm" className="rounded-full bg-primary hover:bg-primary/90 text-white text-xs" onClick={() => setDemoState("upload")}>
                          Start Another Test
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        {/* Analytical Drop-off 1 */}
                        <div className="border border-border/60 bg-muted/5 rounded-xl p-3.5 flex flex-col justify-between">
                          <div>
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/15 font-bold uppercase text-[9px]">Concept Blindspot</span>
                            <h4 className="font-extrabold mt-2 text-sm leading-tight">Momentum Restitution Dynamics</h4>
                            <p className="text-muted-foreground leading-relaxed mt-1">
                              You missed Q14 and Q29. Analysis indicates you drop accuracy when coefficient 'e' lies between 0.5 and 0.8.
                            </p>
                          </div>
                          <span className="text-[10px] font-bold text-primary mt-3 cursor-pointer hover:underline flex items-center gap-1">
                            Load 5 Custom Dynamics Worksheets <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>

                        {/* Analytical Drop-off 2 */}
                        <div className="border border-border/60 bg-muted/5 rounded-xl p-3.5 flex flex-col justify-between">
                          <div>
                            <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/15 font-bold uppercase text-[9px]">Speed Trap Identified</span>
                            <h4 className="font-extrabold mt-2 text-sm leading-tight">Calculus Rate Variables (Q4)</h4>
                            <p className="text-muted-foreground leading-relaxed mt-1">
                              Spent **5.4 minutes** on Q4 (Average is 1.2 min) before selecting Option C incorrectly. Flagged as a stress speed trap.
                            </p>
                          </div>
                          <span className="text-[10px] font-bold text-primary mt-3 cursor-pointer hover:underline flex items-center gap-1">
                            Unlock speed-pacing simulator <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>

                        {/* Analytical Drop-off 3 */}
                        <div className="border border-border/60 bg-muted/5 rounded-xl p-3.5 flex flex-col justify-between">
                          <div>
                            <span className="px-2 py-0.5 rounded bg-violet-500/10 text-violet-500 border border-violet-500/15 font-bold uppercase text-[9px]">Stress-Induced Pattern</span>
                            <h4 className="font-extrabold mt-2 text-sm leading-tight">Last 15-Minute Drop-off</h4>
                            <p className="text-muted-foreground leading-relaxed mt-1">
                              Accuracy dropped by **42%** during the final 15 minutes of the exam. Speed increased by 3.5x, leading to reckless errors.
                            </p>
                          </div>
                          <span className="text-[10px] font-bold text-primary mt-3 cursor-pointer hover:underline flex items-center gap-1">
                            Schedule breath-control training <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>
        </section>

        {/* 3. CORE FEATURES ENGINE SECTION */}
        <section id="features" ref={featuresRef} className="container mx-auto px-4 md:px-8 py-20 border-t border-border/50 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
              Engineered for High-Conversion Mock Practice
            </h2>
            <p className="text-muted-foreground">
              All in One Mock represents the operating standard for modern digital prep. By combining freemium user acquisition with state-of-the-art PDF automation, we turn static tests into an active marketplace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* FEATURE 1: Freemium PYQPs Hook */}
            <motion.div
              whileHover={{ y: -5 }}
              className="feature-card glass-modern border border-border p-6 rounded-2xl flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Award className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">Freemium PYQP Vault</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Offer thousands of free Previous Year Question Papers (PYQPs) dynamically converted into live timed tests to capture high-density registration traffic.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mt-4">
                <CheckCircle className="h-4 w-4" /> Massive traffic acquisition
              </div>
            </motion.div>

            {/* FEATURE 2: PDF Parsing Auto-Digestion */}
            <motion.div
              whileHover={{ y: -5 }}
              className="feature-card glass-modern border border-border p-6 rounded-2xl flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">Instant PDF Digestion</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Skip manual, question-by-question database entry. Upload standard structural test PDFs, and watch them convert into interactive mock exams instantly.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mt-4">
                <CheckCircle className="h-4 w-4" /> Admin zero-friction setup
              </div>
            </motion.div>

            {/* FEATURE 3: Personal Generative AI Mentor */}
            <motion.div
              whileHover={{ y: -5 }}
              className="feature-card glass-modern border border-border p-6 rounded-2xl flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Brain className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">AI Cognitive Diagnostic</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Calculates concept blindspots, pacing speed traps, and stress drop-off intervals instead of basic grades, building a hyper-personalized roadmap.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mt-4">
                <CheckCircle className="h-4 w-4" /> Personal success mentor
              </div>
            </motion.div>

            {/* FEATURE 4: Test Series Marketplace */}
            <motion.div
              whileHover={{ y: -5 }}
              className="feature-card glass-modern border border-border p-6 rounded-2xl flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">Curated Marketplace</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  A high-conversion marketplace for premium curated mock tests and expert-level exam series. Turn practicing students into paying buyers.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mt-4">
                <CheckCircle className="h-4 w-4" /> Optimized monetization
              </div>
            </motion.div>
          </div>
        </section>

        {/* 4. PREMIUM MARKETPLACE SECTION */}
        <section id="marketplace" ref={marketplaceRef} className="container mx-auto px-4 md:px-8 py-20 border-t border-border/50 bg-muted/5 relative z-10">
          <div className="max-w-4xl mx-auto flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 text-xs font-semibold text-violet-600">
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>Test-Series Commerce</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Premium Storefronts for Curated Test Material
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                All in One Mock turns digital practice into a highly profitable ecosystem. Students who enter via the free PYQP vault are guided toward tailored, premium mocks matching their syllabus.
              </p>
              <ul className="space-y-3.5">
                <li className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
                  <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  <span><strong>Creator Portal:</strong> Institutes and subject experts upload test series, set custom pricing plans, and monitor sales within seconds.</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
                  <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  <span><strong>AI Recommendations:</strong> Students receive suggestions for premium tests specifically addressing blindspots identified in their free trials.</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
                  <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  <span><strong>Integrated Checkouts:</strong> Secure payment processing, immediate mock test generation, and full evaluation roadmaps.</span>
                </li>
              </ul>
            </div>

            {/* Test Series Cards Visualization */}
            <div className="flex-1 w-full max-w-md flex flex-col gap-4">
              <div className="border border-border/60 rounded-2xl glass-modern p-5 relative overflow-hidden shadow-depth-1">
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary font-bold text-[9px] uppercase">Highly Recommended</span>
                  <span className="font-bold text-sm text-foreground">$19.99</span>
                </div>
                <h4 className="font-bold text-base mb-1">JEE Advanced physics Elite Series</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  15 Full-length expert mocks converted dynamically from elite resources. Includes hyper-personalized AI Roadmaps.
                </p>
                <div className="flex justify-between items-center border-t border-border/40 pt-3 text-[10px] text-muted-foreground font-semibold">
                  <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> 15 Timed Mocks</span>
                  <span className="text-primary hover:underline cursor-pointer flex items-center gap-0.5">Buy Series <ArrowRight className="h-3 w-3" /></span>
                </div>
              </div>

              <div className="border border-border/60 rounded-2xl glass-modern p-5 relative overflow-hidden shadow-depth-1 opacity-80">
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-bold text-[9px] uppercase">Best Seller</span>
                  <span className="font-bold text-sm text-foreground">$24.99</span>
                </div>
                <h4 className="font-bold text-base mb-1">Civil Services CSAT AI Prep Pack</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  25 Timed logical reasoning mocks focusing on pacing speed-traps and comprehension Drop-offs.
                </p>
                <div className="flex justify-between items-center border-t border-border/40 pt-3 text-[10px] text-muted-foreground font-semibold">
                  <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> 25 Timed Mocks</span>
                  <span className="text-primary hover:underline cursor-pointer flex items-center gap-0.5">Buy Series <ArrowRight className="h-3 w-3" /></span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. AEO & GEO FAQ SECTION */}
        <section id="faq" ref={faqRef} className="container mx-auto px-4 md:px-8 py-20 border-t border-border/50 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-xs font-semibold text-primary mb-4">
              <Search className="h-3.5 w-3.5" />
              <span>AEO & GEO Search Engine Alignment</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
              Answer Engine optimized FAQ System
            </h2>
            <p className="text-muted-foreground">
              Direct, high-density conversational descriptions answering queries posed by next-generation search assistants (Google SGE, Gemini, and Perplexity).
            </p>
          </div>

          {/* Mutually-exclusive Details Accordion using Framer Motion */}
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-xl glass-modern border border-border overflow-hidden transition-smooth"
              >
                <button
                  onClick={() => setActiveFAQ(activeFAQ === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left font-bold text-base md:text-lg hover:bg-muted/10 focus-visible:bg-muted/10 transition-colors"
                  aria-expanded={activeFAQ === index}
                >
                  <span className="pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-300 ${
                      activeFAQ === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                
                <AnimatePresence initial={false}>
                  {activeFAQ === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="p-5 pt-0 text-sm md:text-base text-muted-foreground leading-relaxed border-t border-border/30 bg-muted/5">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

        {/* 6. CALL-TO-ACTION MARKETPLACE BLOCK */}
        <section className="container mx-auto px-4 md:px-8 py-20 border-t border-border/50 relative z-10 text-center">
          <div className="max-w-3xl mx-auto rounded-3xl bg-muted/40 border border-border p-8 md:p-12 relative overflow-hidden shadow-depth-2">

            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                Turn Static PDFs into Indispensable Mentors
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto text-sm md:text-base leading-relaxed">
                Experience the high-conversion ecosystem. Upload your standard papers or browse our free interactive vault of Previous Year papers (PYQPs).
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link to={getStartedLink()} className="w-full sm:w-auto">
                  <Button size="lg" className="rounded-full px-8 font-semibold shadow-depth-1 hover-lift w-full h-12 bg-primary text-white">
                    Convert Exam PDF Now
                  </Button>
                </Link>
                <Link to="/admin-console" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="rounded-full px-8 font-semibold hover-lift w-full h-12">
                    Open Standalone Console
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 7. FOOTER */}
      <footer className="border-t border-border/50 bg-muted/10 relative z-10 no-print">
        <div className="container mx-auto px-4 md:px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-white">
              <Brain className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-foreground">allinonemock</span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 md:gap-8 font-medium">
            <a href="#features" className="hover:text-foreground transition-colors">Core Engine</a>
            <a href="#demo" className="hover:text-foreground transition-colors">Instant Parser</a>
            <a href="#marketplace" className="hover:text-foreground transition-colors">Marketplace</a>
            <a href="#faq" className="hover:text-foreground transition-colors">AEO FAQ</a>
          </div>

          <div>
            <p>© {new Date().getFullYear()} All in One Mock. Engineered for AI Discovery & High-Conversion Prep.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
