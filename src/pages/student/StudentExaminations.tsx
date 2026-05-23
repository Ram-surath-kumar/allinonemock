import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Timetable from "../Exam/Timetable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, 
  Sparkles, 
  Clock, 
  AlertTriangle, 
  CheckSquare, 
  Target, 
  Upload, 
  Award, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Play, 
  Info, 
  RefreshCw, 
  File, 
  ShieldAlert, 
  Zap, 
  Check, 
  BookOpen, 
  ChevronRight,
  TrendingUp,
  User,
  Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { generateMockQuestionsFromPDF, chatWithPDFDocument } from "@/services/gemini";

// Rich Mock Exams for the Freemium PYQP Vault
const MOCK_PYQPS = [
  {
    id: "jee-2025",
    name: "JEE Advanced 2025 (Physics & Chemistry)",
    examCode: "JEE-ADV-25",
    year: 2025,
    questionsCount: 30,
    duration: 180, // minutes
    category: "Engineering",
    difficulty: "Hard",
    syllabus: [
      { topic: "Electrodynamics", weightage: "35%" },
      { topic: "Thermodynamics & Heat", weightage: "25%" },
      { topic: "Organic Reaction Mechanisms", weightage: "20%" },
      { topic: "Chemical Equilibrium", weightage: "20%" }
    ],
    questions: [
      {
        id: 1,
        text: "A parallel plate capacitor is charged and then disconnected from the source. A dielectric slab is now inserted between the plates. Which of the following statements is correct?",
        options: [
          "The electric field between the plates increases, and energy stored increases.",
          "The electric field between the plates decreases, and energy stored decreases.",
          "The charge on the plates decreases, and capacitance increases.",
          "The potential difference between the plates remains constant."
        ],
        correct: "B",
        concept: "Capacitance & Dielectrics",
        cognitiveTopic: "Electrostatics",
        difficulty: "Medium",
        avgTime: 90 // seconds
      },
      {
        id: 2,
        text: "In the thermodynamic process of a monatomic ideal gas, the volume is doubled isothermally. The change in entropy of the gas is:",
        options: [
          "nR ln 2",
          "nR ln(1/2)",
          "3/2 nR ln 2",
          "Zero"
        ],
        correct: "A",
        concept: "Entropy in Isothermal Processes",
        cognitiveTopic: "Thermodynamics",
        difficulty: "Easy",
        avgTime: 60
      },
      {
        id: 3,
        text: "The major product of the reaction of 2-bromobutane with potassium tert-butoxide in tert-butyl alcohol is:",
        options: [
          "1-butene",
          "trans-2-butene",
          "cis-2-butene",
          "2-methyl-2-propanol"
        ],
        correct: "A",
        concept: "Hofmann Elimination Reaction",
        cognitiveTopic: "Organic Chemistry",
        difficulty: "Hard",
        avgTime: 120
      }
    ]
  },
  {
    id: "gate-2025",
    name: "GATE Computer Science 2025 (Core Algorithms)",
    examCode: "GATE-CS-25",
    year: 2025,
    questionsCount: 30,
    duration: 180,
    category: "Engineering",
    difficulty: "Hard",
    syllabus: [
      { topic: "Design & Analysis of Algorithms", weightage: "40%" },
      { topic: "Theory of Computation", weightage: "30%" },
      { topic: "Computer Networks & Routing", weightage: "30%" }
    ],
    questions: [
      {
        id: 1,
        text: "What is the tightest upper bound on the time complexity of building a Binary Heap of size n using the bottom-up Heapify approach?",
        options: [
          "O(n log n)",
          "O(n)",
          "O(log n)",
          "O(n^2)"
        ],
        correct: "B",
        concept: "Linear-Time Heap Construction",
        cognitiveTopic: "Data Structures",
        difficulty: "Medium",
        avgTime: 85
      },
      {
        id: 2,
        text: "Consider the language L = {a^n b^n c^m | n >= 0, m >= 0}. Which of the following is correct?",
        options: [
          "L is regular but not context-free.",
          "L is context-free but not regular.",
          "L is context-sensitive but not context-free.",
          "L is not context-sensitive."
        ],
        correct: "B",
        concept: "Pushdown Automata & CFLs",
        cognitiveTopic: "Theory of Computation",
        difficulty: "Easy",
        avgTime: 50
      },
      {
        id: 3,
        text: "If Dijkstra's single-source shortest path algorithm is run on a directed graph G=(V,E) with negative edge weights, which of the following is true?",
        options: [
          "The algorithm will always terminate and produce correct shortest paths.",
          "The algorithm will terminate but may produce incorrect shortest paths.",
          "The algorithm will enter an infinite loop.",
          "The algorithm will throw a runtime segmentation fault."
        ],
        correct: "B",
        concept: "Negative Weight Edge Constraints",
        cognitiveTopic: "Algorithms",
        difficulty: "Hard",
        avgTime: 140
      }
    ]
  },
  {
    id: "upsc-2024",
    name: "UPSC Civil Services 2024 (General Studies)",
    examCode: "UPSC-GS-24",
    year: 2024,
    questionsCount: 30,
    duration: 120,
    category: "Civil Services",
    difficulty: "Medium",
    syllabus: [
      { topic: "Indian Polity & Governance", weightage: "35%" },
      { topic: "Modern Indian History", weightage: "35%" },
      { topic: "Environmental Ecology", weightage: "30%" }
    ],
    questions: [
      {
        id: 1,
        text: "With reference to the Constitution of India, consider the following statements regarding the Directive Principles of State Policy (DPSP): 1. They are enforceable by courts. 2. They influence the making of laws by the State. Which of the statements given above is/are correct?",
        options: [
          "1 only",
          "2 only",
          "Both 1 and 2",
          "Neither 1 nor 2"
        ],
        correct: "B",
        concept: "Non-justiciable Rights & DPSP",
        cognitiveTopic: "Indian Constitution",
        difficulty: "Easy",
        avgTime: 45
      },
      {
        id: 2,
        text: "The 'Radcliffe Line' was drawn to demarcate the international border between:",
        options: [
          "India and China",
          "India and Pakistan",
          "India and Afghanistan",
          "India and Myanmar"
        ],
        correct: "B",
        concept: "Partition Boundaries 1947",
        cognitiveTopic: "Modern History",
        difficulty: "Easy",
        avgTime: 30
      },
      {
        id: 3,
        text: "Which of the following bodies is charged with coordinating the conservation of Wetlands of International Importance under the Ramsar Convention?",
        options: [
          "IUCN",
          "UNEP",
          "WWF International",
          "The Ramsar Secretariat hosted by IUCN"
        ],
        correct: "D",
        concept: "Ecology Treaties & Secretariats",
        cognitiveTopic: "Environmental Science",
        difficulty: "Hard",
        avgTime: 95
      }
    ]
  },
  {
    id: "cat-2025-mock",
    name: "CAT 2025 (Quantitative Ability & Logic)",
    examCode: "CAT-QA-25",
    year: 2025,
    questionsCount: 3,
    duration: 120,
    category: "Management",
    difficulty: "Hard",
    syllabus: [
      { topic: "Quantitative Ability", weightage: "50%" },
      { topic: "Logical Reasoning", weightage: "50%" }
    ],
    questions: [
      {
        id: 1,
        text: "If log_2 x + log_4 x + log_16 x = 7, then the value of x is:",
        options: ["16", "32", "64", "128"],
        correct: "A",
        concept: "Logarithmic Equations",
        cognitiveTopic: "Algebra",
        difficulty: "Medium",
        avgTime: 90
      },
      {
        id: 2,
        text: "A and B run a 100m race. A wins by 10m or 2 seconds. The speed of A is:",
        options: ["5 m/s", "6 m/s", "5.5 m/s", "4.5 m/s"],
        correct: "A",
        concept: "Time, Speed & Distance",
        cognitiveTopic: "Arithmetic",
        difficulty: "Medium",
        avgTime: 80
      },
      {
        id: 3,
        text: "In a class of 60 students, 30 play cricket, 25 play football, and 10 play both. How many play neither cricket nor football?",
        options: ["15", "20", "25", "10"],
        correct: "A",
        concept: "Set Theory & Venn Diagrams",
        cognitiveTopic: "Modern Maths",
        difficulty: "Easy",
        avgTime: 65
      }
    ]
  }
];

// Tailored HSL gradient styling helper for premium cards in the Highlighted Vault
const getHSLGradient = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('jee') || (cat.includes('engineering') && cat.includes('jee')) || cat.includes('physics')) {
    return {
      gradient: "from-[hsl(217,80%,12%)] via-[hsl(220,70%,6%)] to-[hsl(222,47%,9%)]",
      border: "border-[hsl(217,80%,30%)]/50 hover:border-[hsl(217,80%,55%)]/80",
      badge: "bg-[hsl(217,80%,18%)] text-[hsl(217,80%,85%)] border-[hsl(217,80%,35%)]/50 hover:bg-[hsl(217,80%,22%)]",
      glow: "shadow-[0_0_20px_rgba(59,130,246,0.15)] hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]"
    };
  } else if (cat.includes('gate') || (cat.includes('engineering') && cat.includes('gate'))) {
    return {
      gradient: "from-[hsl(162,80%,10%)] via-[hsl(170,70%,5%)] to-[hsl(222,47%,9%)]",
      border: "border-[hsl(162,80%,30%)]/50 hover:border-[hsl(162,80%,55%)]/80",
      badge: "bg-[hsl(162,80%,15%)] text-[hsl(162,80%,85%)] border-[hsl(162,80%,30%)]/50 hover:bg-[hsl(162,80%,18%)]",
      glow: "shadow-[0_0_20px_rgba(20,184,166,0.15)] hover:shadow-[0_0_30px_rgba(20,184,166,0.3)]"
    };
  } else if (cat.includes('upsc') || cat.includes('civil')) {
    return {
      gradient: "from-[hsl(35,80%,10%)] via-[hsl(25,70%,5%)] to-[hsl(222,47%,9%)]",
      border: "border-[hsl(35,80%,30%)]/50 hover:border-[hsl(35,80%,55%)]/80",
      badge: "bg-[hsl(35,80%,15%)] text-[hsl(35,80%,85%)] border-[hsl(35,80%,30%)]/50 hover:bg-[hsl(35,80%,18%)]",
      glow: "shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]"
    };
  } else if (cat.includes('cat') || cat.includes('management') || cat.includes('mba')) {
    return {
      gradient: "from-[hsl(280,80%,12%)] via-[hsl(260,70%,6%)] to-[hsl(222,47%,9%)]",
      border: "border-[hsl(280,80%,30%)]/50 hover:border-[hsl(280,80%,55%)]/80",
      badge: "bg-[hsl(280,80%,18%)] text-[hsl(280,80%,85%)] border-[hsl(280,80%,35%)]/50 hover:bg-[hsl(280,80%,22%)]",
      glow: "shadow-[0_0_20px_rgba(168,85,247,0.15)] hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]"
    };
  } else {
    // Default Velvet Crimson for Custom/Admin uploads
    return {
      gradient: "from-[hsl(340,85%,12%)] via-[hsl(350,75%,6%)] to-[hsl(222,47%)]",
      border: "border-[hsl(340,85%,30%)]/50 hover:border-[hsl(340,85%,55%)]/80",
      badge: "bg-[hsl(340,85%,18%)] text-[hsl(340,85%,85%)] border-[hsl(340,85%,35%)]/50 hover:bg-[hsl(340,85%,22%)]",
      glow: "shadow-[0_0_20px_rgba(244,63,94,0.15)] hover:shadow-[0_0_30px_rgba(244,63,94,0.3)]"
    };
  }
};

// Seed realistic completed attempts so student has instant diagnostic data to look at
const INITIAL_ATTEMPTS = [
  {
    id: "attempt-1",
    examName: "JEE Advanced 2025 (Physics & Chemistry) - Practice 1",
    examCode: "JEE-ADV-25",
    date: "May 18, 2026",
    score: 2,
    total: 3,
    percentage: 67,
    timeSpent: "4 mins 12 secs",
    conceptBlindspots: [
      { topic: "Hofmann Elimination Reaction (Organic Chemistry)", errorRate: 100, severity: "Critical", description: "Failing to recognize that highly hindered bases like potassium tert-butoxide yield the Hofmann (less substituted) alkene product rather than Zaitsev's alkene." },
      { topic: "Entropy in Isothermal Processes (Thermodynamics)", errorRate: 0, severity: "Proficient", description: "Successfully computed entropy changes in ideal gas volume expansions." }
    ],
    speedTraps: [
      { questionId: 3, timeSpent: 180, avgTime: 120, status: "Incorrect", description: "Spent 3.0 minutes (50% over recommended limit) on the Elimination reaction, ultimately selecting option B (trans-2-butene) instead of Hofmann product A." }
    ],
    stressPatterns: {
      panicThreshold: "Final 15% of exam time",
      panicAccuracy: "33% accuracy in rushed questions",
      behavior: "Your pacing was excellent in the first half, but speed traps in question 3 induced rushed arithmetic slips on adjacent sections."
    },
    mentorMessage: "Hello! You have solid foundational mechanics, but organic reaction stereochemistry under stress remains a critical drop-off. You fell into the Hofmann elimination speed trap by overthinking. Focus on sterically hindered base rules this week.",
    roadmap: [
      { id: 1, text: "Review Hofmann Elimination vs Zaitsev Elimination principles.", done: true },
      { id: 2, text: "Solve 15 elimination reaction practice sets using tert-butoxide.", done: false },
      { id: 3, text: "Take a 5-minute timed speed-drill test focusing solely on stereocenters.", done: false }
    ]
  }
];

export default function StudentExaminations() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  // Backward compatibility state
  const [marks, setMarks] = useState<any[]>([]);
  const [loadingMarks, setLoadingMarks] = useState(false);

  // AI Mock Platform State
  const [activeTab, setActiveTab] = useState("mock-hub");
  const [selectedSyllabusExam, setSelectedSyllabusExam] = useState<any>(null);
  
  // PDF Parse State
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [parseProgress, setParseProgress] = useState(0);
  const [parseStep, setParseStep] = useState(0);
  const [parsedExam, setParsedExam] = useState<any>(null);

  // Real PDF RAG States
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [ragMessages, setRagMessages] = useState<any[]>([
    { role: "model", content: "Hello! I've loaded your document. Ask me anything about it, like explaining concepts, listing formulas, or summarizing key sections!" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Custom PYQPs Vault
  const [customPYQPs, setCustomPYQPs] = useState<any[]>([]);

  const fetchCustomPYQPs = async () => {
    try {
      const response = await api.get<any[]>("/exam/pyqp/list");
      if (response.data) {
        setCustomPYQPs(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch custom PYQPs:", error);
    }
  };

  useEffect(() => {
    fetchCustomPYQPs();
  }, []);

  // Active Exam Testing Environment State
  const [activeExam, setActiveExam] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState<Record<number, string>>({});
  const [questionStates, setQuestionStates] = useState<Record<number, "unvisited" | "answered" | "review">>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timerIntervalId, setTimerIntervalId] = useState<any>(null);

  // AI Evaluation Scanner State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evalProgress, setEvalProgress] = useState(0);
  const [evalStep, setEvalStep] = useState(0);

  // Performance Analysis Mentorship State
  const [attempts, setAttempts] = useState<any[]>(INITIAL_ATTEMPTS);
  const [selectedAttempt, setSelectedAttempt] = useState<any>(INITIAL_ATTEMPTS[0]);

  // Timer Ref to access active time spent calculation
  const timeSpentSeconds = useRef(0);

  useEffect(() => {
    if (currentUser?.id) {
      fetchMarks();
    }
  }, [currentUser?.id]);

  // Backward compatibility DB results fetch
  const fetchMarks = async () => {
    try {
      setLoadingMarks(true);
      const response = await api.get(`/exam/marks/student/${currentUser?.id}`);
      if (response.data) {
        setMarks(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch marks:", error);
    } finally {
      setLoadingMarks(false);
    }
  };

  // Timer runner for exam environment
  useEffect(() => {
    if (activeExam && timeRemaining > 0) {
      const id = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(id);
            handleAutoSubmit();
            return 0;
          }
          timeSpentSeconds.current += 1;
          return prev - 1;
        });
      }, 1000);
      setTimerIntervalId(id);
      return () => clearInterval(id);
    }
  }, [activeExam]);

  // Launch a standard timed PYQP exam
  const handleStartExam = (exam: any) => {
    setActiveExam(exam);
    setCurrentQuestionIndex(0);
    setStudentAnswers({});
    
    // Initialize states
    const initialStates: Record<number, "unvisited" | "answered" | "review"> = {};
    exam.questions.forEach((_: any, idx: number) => {
      initialStates[idx] = idx === 0 ? "unvisited" : "unvisited";
    });
    setQuestionStates(initialStates);
    
    // Set timer (e.g. 5 minutes for demo testing speed, or full duration)
    setTimeRemaining(5 * 60); // 5 minutes speed-drill for standard testing
    timeSpentSeconds.current = 0;
    
    toast({
      title: "Proctored Exam Started",
      description: `Welcome to the secure timed environment for ${exam.name}.`,
    });
  };

  // Select option in active test
  const handleSelectOption = (option: string) => {
    setStudentAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: option
    }));
    setQuestionStates((prev) => ({
      ...prev,
      [currentQuestionIndex]: "answered"
    }));
  };

  // Skip question/mark for review
  const handleMarkForReview = () => {
    setQuestionStates((prev) => ({
      ...prev,
      [currentQuestionIndex]: "review"
    }));
    handleNextQuestion();
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < activeExam.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  // Clean form responses
  const handleClearResponse = () => {
    setStudentAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentQuestionIndex];
      return copy;
    });
    setQuestionStates((prev) => ({
      ...prev,
      [currentQuestionIndex]: "unvisited"
    }));
  };

  // Formatter for timer display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Triggered when clock runs out
  const handleAutoSubmit = () => {
    toast({
      title: "Time Expired",
      description: "Your test has been automatically submitted for evaluation.",
      variant: "destructive"
    });
    triggerAIEvaluation();
  };

  // Triggered by manual submit click
  const handleSubmitExam = () => {
    if (timerIntervalId) clearInterval(timerIntervalId);
    triggerAIEvaluation();
  };

  // Run the Generative AI evaluation scanners
  const triggerAIEvaluation = () => {
    setIsSubmitting(true);
    setEvalProgress(0);
    setEvalStep(0);
    
    // Simulate real AI processing
    const stepsInterval = setInterval(() => {
      setEvalStep((prev) => {
        if (prev >= 4) {
          clearInterval(stepsInterval);
          return 4;
        }
        return prev + 1;
      });
    }, 1200);

    const progressInterval = setInterval(() => {
      setParseProgress(0); // clear parser progress
      setEvalProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          
          // Complete evaluation and compile result attempt
          setTimeout(() => {
            finalizeAttempt();
          }, 500);
          return 100;
        }
        return prev + 5;
      });
    }, 300);
  };

  // Build attempt data post-exam submission
  const finalizeAttempt = () => {
    setIsSubmitting(false);
    
    // Evaluate questions correct
    let correctCount = 0;
    activeExam.questions.forEach((q: any, idx: number) => {
      if (studentAnswers[idx] === q.correct) {
        correctCount++;
      }
    });

    const isParsedPDF = activeExam.id === "parsed-pdf";
    const minutes = Math.floor(timeSpentSeconds.current / 60);
    const seconds = timeSpentSeconds.current % 60;

    // AI Mentor Logic Generation
    const wrongQuestions = activeExam.questions.filter((q: any, idx: number) => studentAnswers[idx] !== q.correct);
    
    const blindspots = wrongQuestions.map((q: any) => ({
      topic: `${q.concept} (${q.cognitiveTopic})`,
      errorRate: 100,
      severity: q.difficulty === "Hard" ? "Critical" : "Medium",
      description: `Failed concepts spotted regarding ${q.concept}. Expected time: ${q.avgTime}s.`
    }));

    // If none wrong, add a mock high proficiency one
    if (blindspots.length === 0) {
      blindspots.push({
        topic: "Perfect score achieved in all topics!",
        errorRate: 0,
        severity: "Proficient",
        description: "Zero conceptual weaknesses were detected during this testing interval."
      });
    }

    const speedTraps = wrongQuestions.map((q: any) => ({
      questionId: q.id,
      timeSpent: q.avgTime + 40,
      avgTime: q.avgTime,
      status: "Incorrect",
      description: `Exceeded standard time limits on Q${q.id} (${q.concept}) by 40s leading to potential panic.`
    }));

    const newAttempt = {
      id: `attempt-${Date.now()}`,
      examName: activeExam.name,
      examCode: activeExam.examCode,
      date: format(new Date(), "PPP"),
      score: correctCount,
      total: activeExam.questions.length,
      percentage: Math.round((correctCount / activeExam.questions.length) * 100),
      timeSpent: `${minutes}m ${seconds}s`,
      conceptBlindspots: blindspots.slice(0, 3),
      speedTraps: speedTraps.slice(0, 2),
      stressPatterns: {
        panicThreshold: "Final 25% of exam time",
        panicAccuracy: `${Math.round(correctCount * 12)}% accuracy in rushed segments`,
        behavior: "Panic triggers identified around final question marks. Taking structured breathing breaks is highly advised."
      },
      mentorMessage: `Excellent effort! You solved ${correctCount} questions correct. Your cognitive trace reveals minor vulnerabilities in ${activeExam.questions[correctCount % activeExam.questions.length]?.concept || 'core parameters'}. Review the generated step-by-step roadmap to close these concept loops.`,
      roadmap: [
        { id: 1, text: `Read standard review docs on ${activeExam.questions[0]?.concept || 'core algorithms'}`, done: false },
        { id: 2, text: `Solve 10 practice tasks under strict 1-minute countdown timers.`, done: false },
        { id: 3, text: `Re-sit the parsed paper and audit your specific speed metrics.`, done: false }
      ]
    };

    setAttempts((prev) => [newAttempt, ...prev]);
    setSelectedAttempt(newAttempt);
    setActiveExam(null);
    setActiveTab("genai-mentor");

    toast({
      title: "AI Analysis Complete",
      description: "Your post-exam GenAI mentorship dashboard is now loaded.",
    });
  };

  // PDF drag/upload simulation helpers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      startParsingPDF(e.dataTransfer.files[0]);
    }
  };

  const startParsingPDF = async (fileOrName: File | string) => {
    const isFile = typeof fileOrName !== "string";
    const fileName = isFile ? (fileOrName as File).name : (fileOrName as string);

    setUploadingFile(fileName);
    setParseProgress(10);
    setParseStep(0);

    try {
      let base64 = "";

      if (isFile) {
        setParseStep(1);
        setParseProgress(20);
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(fileOrName as File);
        });
      } else {
        // Fallback mock PDF base64 for sample button clicks
        base64 = "JVBERi0xLjQKJdPr6gogMSAwIG9iago8PAovVGl0bGUgKFNhbXBsZSkgCi9DcmVhdG9yIChHZW1pbmkpIAo+PgplbmRvYmoK...";
      }

      setParseProgress(40);
      setParseStep(2);

      // Save base64 for real RAG Chat Assistant
      setPdfBase64(base64);
      setRagMessages([
        { 
          role: "model", 
          content: `I have successfully ingested "${fileName}". I'm ready to answer any questions about its content. Type your questions below, or click the button to sit a mock test generated from this PDF!` 
        }
      ]);

      setParseProgress(60);
      setParseStep(3);

      // Call real Gemini API to extract MCQs from PDF content!
      const questions = await generateMockQuestionsFromPDF(base64);

      setParseProgress(90);
      setParseStep(4);

      const parsed = {
        id: "parsed-pdf",
        name: `Parsed Mock: ${fileName.replace(".pdf", "")}`,
        examCode: "AI-PARSED-PDF",
        year: new Date().getFullYear(),
        questionsCount: questions.length,
        duration: 120,
        category: "Self-Uploaded",
        difficulty: "Medium",
        questions: questions.map((q: any, idx: number) => ({
          id: idx + 1,
          text: q.text || `Question ${idx + 1}`,
          options: q.options || ["Option A", "Option B", "Option C", "Option D"],
          correct: q.correct || "A",
          concept: q.concept || "General Concept",
          cognitiveTopic: q.cognitiveTopic || "General Topic",
          difficulty: q.difficulty || "Medium",
          avgTime: q.avgTime || 90
        }))
      };

      setParsedExam(parsed);
      setParseProgress(100);

      toast({
        title: "PDF Parsed Successfully",
        description: `Zero-friction RAG engine compiled ${questions.length} custom mock questions from your PDF!`,
      });
    } catch (err: any) {
      console.error("PDF Ingestion Error:", err);
      toast({
        title: "Parsing Failed",
        description: err.message || "Failed to parse PDF document. Please try again.",
        variant: "destructive"
      });
      setUploadingFile(null);
    }
  };

  const handleLaunchParsedExam = () => {
    if (parsedExam) {
      handleStartExam(parsedExam);
      setUploadingFile(null);
      setParsedExam(null);
    }
  };

  // Toggle study checklist items
  const handleToggleRoadmapTask = (taskId: number) => {
    if (!selectedAttempt) return;
    const updatedRoadmap = selectedAttempt.roadmap.map((task: any) => 
      task.id === taskId ? { ...task, done: !task.done } : task
    );
    const updatedAttempt = { ...selectedAttempt, roadmap: updatedRoadmap };
    
    // Update attempts array
    setAttempts((prev) => prev.map((a) => a.id === selectedAttempt.id ? updatedAttempt : a));
    setSelectedAttempt(updatedAttempt);
  };

  const parseStepsText = [
    "Initializing secure parser container...",
    "Scanning document layouts, headers, and formulas...",
    "Isolating question blocks and MCQ answer structures...",
    "Interfacing parsed blocks with AI cognitive trace engine...",
    "PDF parsing complete. Timed online test compiled!"
  ];

  const evalStepsText = [
    "Submitting digital test sheet for processing...",
    "Evaluating question accuracy metrics...",
    "Tracing response delays for speed traps...",
    "Analyzing panic answer indicators in closing minutes...",
    "Drafting your personalized GenAI success roadmap..."
  ];

  return (
    <div className="relative min-h-[calc(100vh-64px)] w-full py-6 text-foreground bg-background">
      
      {/* 1. SECURE TIMED EXAM INTERFACE OVERLAY */}
      <AnimatePresence>
        {activeExam && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100 font-sans"
          >
            {/* Header Area */}
            <div className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900 px-6">
              <div className="flex items-center gap-3">
                <div className="rounded bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground tracking-wider uppercase">
                  Secure Timed Exam
                </div>
                <span className="font-semibold text-slate-200 truncate max-w-[200px] sm:max-w-md">
                  {activeExam.name}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-1.5 border border-slate-700">
                  <Clock className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
                  <span className="font-mono text-lg font-bold text-slate-200">
                    {formatTime(timeRemaining)}
                  </span>
                </div>
                <Button 
                  onClick={handleSubmitExam}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow border-0"
                >
                  Submit Exam
                </Button>
              </div>
            </div>

            {/* Split Panel Exam Screen */}
            <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
              {/* Left Column: Question Area */}
              <div className="flex flex-1 flex-col overflow-y-auto bg-slate-900/40 p-6 md:p-8">
                <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                  <span className="text-sm font-semibold text-slate-400">
                    Question {currentQuestionIndex + 1} of {activeExam.questions.length}
                  </span>
                  <Badge className="bg-slate-800 text-slate-300 border-slate-700 px-2 py-0.5 hover:bg-slate-800">
                    {activeExam.questions[currentQuestionIndex].difficulty} Difficulty
                  </Badge>
                </div>

                <div className="mb-8 min-h-[120px]">
                  <p className="text-lg md:text-xl font-medium leading-relaxed text-slate-200">
                    {activeExam.questions[currentQuestionIndex].text}
                  </p>
                </div>

                {/* Multiple Choices */}
                <div className="space-y-3.5 mb-8">
                  {activeExam.questions[currentQuestionIndex].options.map((option: string, idx: number) => {
                    const optionChar = String.fromCharCode(65 + idx); // A, B, C, D
                    const isSelected = studentAnswers[currentQuestionIndex] === optionChar;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(optionChar)}
                        className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-all duration-200 ${
                          isSelected 
                            ? "border-primary bg-primary/10 text-slate-100" 
                            : "border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-slate-300"
                        }`}
                      >
                        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${
                          isSelected 
                            ? "bg-primary border-primary text-primary-foreground" 
                            : "border-slate-700 text-slate-400 bg-slate-800"
                        }`}>
                          {optionChar}
                        </div>
                        <span className="text-base font-normal leading-normal">{option}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-6">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handlePrevQuestion}
                      disabled={currentQuestionIndex === 0}
                      className="border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" /> Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleNextQuestion}
                      disabled={currentQuestionIndex === activeExam.questions.length - 1}
                      className="border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300"
                    >
                      Next <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleClearResponse}
                      disabled={!studentAnswers[currentQuestionIndex]}
                      className="border-slate-700 bg-slate-900 hover:bg-slate-800 text-red-400 hover:text-red-300"
                    >
                      Clear Response
                    </Button>
                    <Button
                      onClick={handleMarkForReview}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                    >
                      Mark for Review & Next
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right Column: Navigation Sidebar */}
              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-800 bg-slate-900 p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                    Question Palette
                  </h3>

                  <div className="grid grid-cols-5 gap-3 max-h-[250px] overflow-y-auto pr-1">
                    {activeExam.questions.map((_: any, idx: number) => {
                      const state = questionStates[idx];
                      const isCurrent = idx === currentQuestionIndex;
                      
                      let btnBg = "bg-slate-800/40 border-slate-800 text-slate-400";
                      if (state === "answered") btnBg = "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700";
                      if (state === "review") btnBg = "bg-blue-600 border-blue-600 text-white hover:bg-blue-700";
                      if (isCurrent) btnBg += " ring-2 ring-primary ring-offset-2 ring-offset-slate-900";

                      return (
                        <button
                          key={idx}
                          onClick={() => setCurrentQuestionIndex(idx)}
                          className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-bold transition-all ${btnBg}`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-8 border-t border-slate-800 pt-6 space-y-3 text-xs text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 rounded bg-emerald-600"></span> Answered
                    </span>
                    <span className="font-semibold text-slate-300">
                      {Object.values(questionStates).filter(s => s === "answered").length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 rounded bg-blue-600"></span> Marked for Review
                    </span>
                    <span className="font-semibold text-slate-300">
                      {Object.values(questionStates).filter(s => s === "review").length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 rounded bg-slate-800/40 border border-slate-700"></span> Unvisited
                    </span>
                    <span className="font-semibold text-slate-300">
                      {activeExam.questions.length - Object.values(studentAnswers).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. GENAI EVALUATION LOADER SCANNERS */}
      <AnimatePresence>
        {isSubmitting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 px-6"
          >
            <div className="w-full max-w-md text-center space-y-6">
              <div className="flex justify-center">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 border border-primary/20">
                  <Sparkles className="h-10 w-10 text-primary animate-spin" style={{ animationDuration: '3s' }} />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-100 tracking-tight">GenAI Mentor Evaluating</h2>
                <p className="text-sm text-slate-400">
                  Building deep diagnostics profile of your timed testing run.
                </p>
              </div>

              {/* Progress Container */}
              <div className="space-y-2">
                <Progress value={evalProgress} className="h-2 bg-slate-800" />
                <div className="flex justify-between text-xs text-slate-500 font-mono">
                  <span>METRICS COMPILATION</span>
                  <span>{evalProgress}%</span>
                </div>
              </div>

              {/* Step Sequence Details */}
              <div className="rounded-lg border border-slate-900 bg-slate-900/50 p-4 text-left">
                <div className="space-y-3">
                  {evalStepsText.map((stepText, idx) => {
                    const isPassed = evalStep > idx;
                    const isActive = evalStep === idx;
                    return (
                      <div 
                        key={idx} 
                        className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                          isPassed ? "text-emerald-400 font-medium" : isActive ? "text-slate-200" : "text-slate-600"
                        }`}
                      >
                        {isPassed ? (
                          <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                        ) : isActive ? (
                          <RefreshCw className="h-4 w-4 shrink-0 animate-spin text-primary" />
                        ) : (
                          <div className="h-1.5 w-1.5 rounded-full bg-slate-700 ml-1.5"></div>
                        )}
                        <span>{stepText}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Page Layout Wrapper */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Examinations & AI Diagnostics
            </h1>
            <p className="text-muted-foreground mt-1">
              Sit timed official exams, practice pyqps vault, or digest PDFs into interactive mocks.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setActiveTab("mock-hub")}
              variant={activeTab === "mock-hub" ? "default" : "outline"}
              className="font-semibold shadow-sm"
            >
              Mock Hub
            </Button>
            <Button
              onClick={() => setActiveTab("genai-mentor")}
              variant={activeTab === "genai-mentor" ? "default" : "outline"}
              className="font-semibold shadow-sm"
            >
              AI Study Mentor
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 max-w-2xl bg-muted p-1">
            <TabsTrigger value="mock-hub" className="font-medium">AI Mock Test Hub</TabsTrigger>
            <TabsTrigger value="genai-mentor" className="font-medium">GenAI Performance Mentor</TabsTrigger>
            <TabsTrigger value="official-schedule" className="font-medium">Exam Schedules</TabsTrigger>
            <TabsTrigger value="official-results" className="font-medium">Official Results</TabsTrigger>
          </TabsList>

          {/* TAB 1: AI MOCK TEST HUB */}
          <TabsContent value="mock-hub" className="space-y-8 animate-in fade-in duration-300">
            
            {/* 🌟 PREMIUM OFFICIAL PYQP MOCKUP SERIES (HIGHLIGHTED VAULT) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                  <h3 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 flex-wrap">
                    Official PYQP Mockup Series
                    <span className="text-[10px] bg-primary/15 text-primary border border-primary/20 rounded-full px-2.5 py-0.5 font-bold font-mono tracking-wider">
                      ★ HIGHLIGHTED VAULT
                    </span>
                  </h3>
                </div>
                <Badge variant="outline" className="border-emerald-500/20 text-emerald-600 bg-emerald-500/5 font-semibold text-xs py-1 px-3 hidden sm:inline-flex">
                  Interactive Practice Enabled
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...MOCK_PYQPS, ...customPYQPs].map((exam) => {
                  const styles = getHSLGradient(exam.category || exam.name);
                  return (
                    <motion.div
                      key={exam.id}
                      whileHover={{ y: -8, scale: 1.01 }}
                      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${styles.gradient} ${styles.border} ${styles.glow} p-5 flex flex-col justify-between h-[240px] transition-all duration-300 group`}
                    >
                      {/* Premium floating ambient glow */}
                      <div className="absolute -right-16 -top-16 w-32 h-32 rounded-full bg-primary/10 blur-2xl group-hover:scale-150 transition-all duration-500" />
                      
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3 gap-2">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase border shadow-sm ${styles.badge}`}>
                            {exam.category === "Self-Uploaded" ? "Admin Upload" : exam.category}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 font-mono">
                            {exam.year || "2025"} Paper
                          </span>
                        </div>

                        <h4 className="text-sm font-extrabold leading-snug tracking-tight text-white group-hover:text-primary transition-colors line-clamp-2">
                          {exam.name}
                        </h4>
                        
                        <p className="text-[10px] text-slate-400 font-mono mt-2 flex items-center gap-1.5">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Code: {exam.examCode}
                        </p>
                      </div>

                      <div className="relative z-10 pt-3 border-t border-white/5 space-y-3">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold font-mono">
                          <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> {exam.questionsCount || exam.questions?.length || 0} MCQs</span>
                          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {exam.duration} mins</span>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleStartExam(exam)}
                            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-8.5 shadow-md transition-all duration-200"
                          >
                            <Play className="h-3 w-3 mr-1" /> Practice Mock
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => setSelectedSyllabusExam(exam)}
                            className="bg-white/5 hover:bg-white/10 text-white border-0 text-xs h-8.5 px-2.5"
                          >
                            Syllabus
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Zero-friction PDF Parse Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <Card className="lg:col-span-2 border-border shadow-sm bg-card hover:border-muted-foreground/30 transition-all">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Zero-Friction AI PDF-to-Test Parser
                  </CardTitle>
                  <CardDescription>
                    Upload any standard structural question paper PDF. Our parser will instantly extract math symbols, questions, and render a live timed test.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!uploadingFile ? (
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById("student-pdf-upload-input")?.click()}
                      className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                        isDragging ? "border-primary bg-primary/5" : "border-border bg-muted/40 hover:bg-muted/70"
                      }`}
                    >
                      <input
                        id="student-pdf-upload-input"
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            startParsingPDF(e.target.files[0]);
                          }
                        }}
                      />
                      <div className="rounded-full bg-primary/10 p-4 mb-4 text-primary">
                        <Upload className="h-8 w-8 animate-pulse text-primary" />
                      </div>
                      <p className="text-base font-semibold text-foreground mb-1">
                        Drag & Drop or Click to upload exam PDF
                      </p>
                      <p className="text-xs text-muted-foreground mb-4">
                        Instant Mock Test Generation & RAG Chat (UPSC, GATE, JEE, CAT, etc.)
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center" onClick={(e) => e.stopPropagation()}>
                        <Button 
                          onClick={() => startParsingPDF("gate-2025-algorithms.pdf")} 
                          variant="outline" 
                          size="sm"
                          className="text-xs border-border bg-card hover:bg-accent font-medium shadow-none"
                        >
                          Try GATE CSE Sample
                        </Button>
                        <Button 
                          onClick={() => startParsingPDF("jee-advanced-physics.pdf")} 
                          variant="outline" 
                          size="sm"
                          className="text-xs border-border bg-card hover:bg-accent font-medium shadow-none"
                        >
                          Try JEE Physics Sample
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-xl border p-4 bg-muted/30 space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="rounded bg-primary/10 p-3 text-primary">
                            <File className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm truncate">{uploadingFile}</h4>
                            <p className="text-xs text-muted-foreground">AI parsing engine running...</p>
                          </div>
                          {parseProgress === 100 && (
                            <Badge className="bg-emerald-600 text-white font-medium hover:bg-emerald-600">
                              Ready for Mock & Chat
                            </Badge>
                          )}
                        </div>

                        {/* Parser Progress */}
                        <div className="space-y-2">
                          <Progress value={parseProgress} className="h-2 bg-slate-800" />
                          <div className="flex justify-between text-xs text-muted-foreground font-mono">
                            <span>PARSING STEP DETAILS</span>
                            <span>{parseProgress}%</span>
                          </div>
                        </div>

                        {/* Step Details */}
                        {parseProgress < 100 && (
                          <div className="rounded bg-card p-3.5 border text-sm space-y-2">
                            {parseStepsText.map((stepText, idx) => {
                              const isCompleted = parseStep > idx || parseProgress === 100;
                              const isCurrent = parseStep === idx && parseProgress < 100;
                              return (
                                <div 
                                  key={idx} 
                                  className={`flex items-center gap-2 text-xs ${
                                    isCompleted ? "text-emerald-600 font-medium" : isCurrent ? "text-foreground font-semibold" : "text-muted-foreground"
                                  }`}
                                >
                                  {isCompleted ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                  ) : isCurrent ? (
                                    <RefreshCw className="h-3.5 w-3.5 text-primary shrink-0 animate-spin" />
                                  ) : (
                                    <div className="h-1.5 w-1.5 rounded-full bg-border shrink-0 ml-1"></div>
                                  )}
                                  <span>{stepText}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {parseProgress === 100 && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            <Button 
                              onClick={handleLaunchParsedExam}
                              className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground font-bold shadow-md text-sm"
                            >
                              <Play className="h-4.5 w-4.5 mr-2" /> Launch AI Mock Test
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={() => {
                                setUploadingFile(null);
                                setPdfBase64(null);
                                setParsedExam(null);
                              }}
                              className="border-border hover:bg-accent text-sm"
                            >
                              Clear File
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Working RAG Chat Assistant */}
                      {parseProgress === 100 && pdfBase64 && (
                        <div className="mt-6 border border-border rounded-xl bg-card overflow-hidden shadow-inner flex flex-col h-[350px] animate-in fade-in duration-300">
                          <div className="bg-muted/50 border-b p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                              <span className="text-sm font-bold text-foreground">💬 AI Document RAG Chat Assistant</span>
                            </div>
                            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-mono">
                              MULTIMODAL CONTEXT
                            </Badge>
                          </div>

                          {/* Chat body */}
                          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                            {ragMessages.map((msg, idx) => (
                              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                                  msg.role === 'user' 
                                    ? 'bg-primary text-primary-foreground font-medium rounded-tr-none' 
                                    : 'bg-muted text-foreground border border-border rounded-tl-none'
                                }`}>
                                  {msg.content}
                                </div>
                              </div>
                            ))}
                            {chatLoading && (
                              <div className="flex justify-start">
                                <div className="bg-muted text-foreground max-w-[85%] rounded-2xl rounded-tl-none px-3.5 py-2 text-xs border border-border flex items-center gap-2">
                                  <RefreshCw className="h-3 w-3 animate-spin text-primary" />
                                  <span>AI is scanning your document...</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Input form */}
                          <form 
                            onSubmit={async (e) => {
                              e.preventDefault();
                              if (!chatInput.trim() || chatLoading) return;
                              const msgText = chatInput.trim();
                              setChatInput("");
                              setRagMessages(prev => [...prev, { role: 'user', content: msgText }]);
                              setChatLoading(true);
                              try {
                                const reply = await chatWithPDFDocument(pdfBase64, 'application/pdf', ragMessages, msgText);
                                setRagMessages(prev => [...prev, { role: 'model', content: reply }]);
                              } catch (err: any) {
                                toast({
                                  title: "Chat Error",
                                  description: err.message || "Failed to communicate with AI.",
                                  variant: "destructive"
                                });
                              } finally {
                                setChatLoading(false);
                              }
                            }}
                            className="border-t p-3 bg-muted/20 flex gap-2"
                          >
                            <Input 
                              placeholder="Ask anything about the uploaded PDF..."
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              disabled={chatLoading}
                              className="flex-1 bg-background text-xs"
                            />
                            <Button type="submit" disabled={chatLoading || !chatInput.trim()} size="sm" className="bg-primary hover:bg-primary/95 text-xs text-primary-foreground font-bold">
                              Send
                            </Button>
                          </form>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Freemium Hook Highlights */}
              <Card className="border-border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Freemium Value</CardTitle>
                  <CardDescription>All in One Mock Acquisition Hook</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-md bg-primary p-2 text-primary-foreground mt-0.5">
                        <Zap className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">No Credit Card Needed</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Practice official previous year papers completely free, no premium lockouts.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="rounded-md bg-emerald-600 p-2 text-white mt-0.5">
                        <Award className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Interactive Timed Environment</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Stop solving from flat static PDFs. Practice in realistic simulated testing windows.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="rounded-md bg-amber-600 p-2 text-white mt-0.5">
                        <Brain className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">GenAI Mentorship Insights</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Gain detailed post-exam feedback revealing speed bottlenecks and stress factors.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Freemium PYQP Vault List */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-bold tracking-tight text-foreground">
                  Previous Year Papers (PYQP) Vault
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...MOCK_PYQPS, ...customPYQPs].map((exam) => (
                  <Card key={exam.id} className="border-border bg-card shadow-sm hover:border-primary/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border hover:bg-slate-100 font-medium">
                          {exam.category}
                        </Badge>
                        <span className="text-xs font-semibold text-muted-foreground">
                          {exam.year} Paper
                        </span>
                      </div>
                      <CardTitle className="text-base font-bold leading-snug hover:text-primary transition-colors cursor-pointer" onClick={() => handleStartExam(exam)}>
                        {exam.name}
                      </CardTitle>
                      <CardDescription className="font-mono text-xs mt-1">
                        Exam Code: {exam.examCode}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4 flex-1 flex flex-col justify-between">
                      <div className="border-t border-b py-3 my-2 space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5" /> Questions count
                          </span>
                          <span className="font-bold text-foreground">{exam.questionsCount} MCQs</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" /> Time limit
                          </span>
                          <span className="font-bold text-foreground">{exam.duration} mins</span>
                        </div>
                      </div>

                      <div className="pt-2 flex gap-2">
                        <Button 
                          onClick={() => handleStartExam(exam)} 
                          className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold shadow-sm text-xs h-9"
                        >
                          <Play className="h-3.5 w-3.5 mr-1.5" /> Start Timed Test
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setSelectedSyllabusExam(exam)}
                          className="border-border hover:bg-accent text-xs h-9 px-3"
                        >
                          Syllabus Weights
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

          </TabsContent>

          {/* TAB 2: GENAI PERFORMANCE MENTOR */}
          <TabsContent value="genai-mentor" className="space-y-6 animate-in fade-in duration-300">
            {attempts.length === 0 ? (
              <Card className="p-12 text-center border-border bg-card">
                <Brain className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <h3 className="font-bold text-lg">No Exam Diagnostic Data Found</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  Take an interactive timed paper from the Mock Hub first. Our AI Mentor will then render deep stress, pacing, and concept analytics.
                </p>
                <Button onClick={() => setActiveTab("mock-hub")} className="mt-4">
                  Go to Mock Hub
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* Attempts Selector Sidebar */}
                <div className="lg:col-span-1 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    <Activity className="h-4 w-4" /> Attempt Logs
                  </div>

                  <div className="space-y-2">
                    {attempts.map((attempt) => {
                      const isSelected = selectedAttempt?.id === attempt.id;
                      return (
                        <button
                          key={attempt.id}
                          onClick={() => setSelectedAttempt(attempt)}
                          className={`w-full text-left rounded-xl border p-3.5 transition-all flex flex-col justify-between ${
                            isSelected 
                              ? "border-primary bg-primary/5 text-foreground shadow-sm" 
                              : "border-border bg-card hover:bg-muted/40 text-muted-foreground"
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className={`font-bold text-xs leading-snug truncate max-w-[150px] ${isSelected ? "text-primary" : "text-foreground"}`}>
                              {attempt.examCode}
                            </span>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {attempt.date}
                            </span>
                          </div>
                          
                          <p className="text-xs text-foreground font-medium truncate mt-1">
                            {attempt.examName}
                          </p>

                          <div className="flex items-center justify-between mt-3 text-[11px]">
                            <span>Score: <strong className="text-foreground font-bold">{attempt.score}/{attempt.total}</strong></span>
                            <Badge className={`px-2 py-0 h-4.5 text-[9px] font-bold ${attempt.percentage >= 60 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                              {attempt.percentage}%
                            </Badge>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Attempt Core Diagnostics Dashboard */}
                <div className="lg:col-span-3 space-y-6">
                  
                  {/* Top Summary Banner */}
                  <Card className="border-border bg-card shadow-sm">
                    <CardHeader className="pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Brain className="h-5 w-5 text-primary" />
                          <CardTitle className="text-xl font-extrabold">{selectedAttempt.examName}</CardTitle>
                        </div>
                        <CardDescription className="mt-1">
                          Evaluated via All in One Mock GenAI Engine on {selectedAttempt.date}
                        </CardDescription>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-center rounded-lg border px-4 py-2 bg-muted/20">
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase">Accuracy</p>
                          <p className="text-2xl font-black text-foreground">{selectedAttempt.percentage}%</p>
                        </div>
                        <div className="text-center rounded-lg border px-4 py-2 bg-muted/20">
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase">Pacing</p>
                          <p className="text-sm font-bold text-foreground mt-1 whitespace-nowrap">{selectedAttempt.timeSpent}</p>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Micro-Level Diagnostic Drop-offs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Concept Blindspots Block */}
                    <Card className="border-border bg-card shadow-sm flex flex-col justify-between">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                          <Target className="h-4.5 w-4.5 text-primary" />
                          Concept Blindspots (Cognitive Trace)
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Micro-level drop-offs isolated from question answer correlations.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-2">
                        {selectedAttempt.conceptBlindspots.map((spot: any, idx: number) => (
                          <div key={idx} className="rounded-lg border p-3 bg-muted/30">
                            <div className="flex justify-between items-start gap-2 mb-1.5">
                              <h4 className="font-semibold text-xs text-foreground leading-normal max-w-[200px]">
                                {spot.topic}
                              </h4>
                              <Badge className={`text-[9px] font-bold py-0 ${
                                spot.severity === "Critical" 
                                  ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" 
                                  : spot.severity === "Proficient"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                              }`}>
                                {spot.severity}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              {spot.description}
                            </p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Speed Traps Block */}
                    <Card className="border-border bg-card shadow-sm flex flex-col justify-between">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                          <Clock className="h-4.5 w-4.5 text-amber-500" />
                          Structural Speed Traps (Pacing Bottlenecks)
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Time spent on specific questions compared to peer recommendations.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-2">
                        {selectedAttempt.speedTraps.map((trap: any, idx: number) => (
                          <div key={idx} className="rounded-lg border p-3 bg-muted/30">
                            <div className="flex justify-between items-center gap-2 mb-1.5 border-b pb-1.5">
                              <span className="font-mono text-xs font-semibold text-foreground">
                                Question {trap.questionId}
                              </span>
                              <Badge className="bg-red-50 text-red-700 border-red-200 font-bold hover:bg-red-50 text-[9px] py-0">
                                TimeSink
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground mb-1.5">
                              <div>Your time: <strong className="text-foreground font-bold">{trap.timeSpent}s</strong></div>
                              <div>Recommended: <strong className="text-foreground font-bold">{trap.avgTime}s</strong></div>
                            </div>
                            
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              {trap.description}
                            </p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                  </div>

                  {/* Stress-Induced Patterns */}
                  <Card className="border-border bg-card shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <AlertTriangle className="h-4.5 w-4.5 text-red-500" />
                        Stress-Induced Patterns (Exam Fatigue Profile)
                      </CardTitle>
                      <CardDescription className="text-xs">
                        How your cognitive accuracy shifted during high-pacing countdown zones.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="rounded-lg border p-3 bg-muted/30 text-center">
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase">Panic Threshold</p>
                          <p className="text-sm font-bold text-foreground mt-1">{selectedAttempt.stressPatterns.panicThreshold}</p>
                        </div>
                        <div className="rounded-lg border p-3 bg-muted/30 text-center">
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase">Rushed Segment Accuracy</p>
                          <p className="text-sm font-bold text-red-600 dark:text-red-400 mt-1">{selectedAttempt.stressPatterns.panicAccuracy}</p>
                        </div>
                        <div className="rounded-lg border p-3 bg-muted/30 text-center col-span-1 md:col-span-1">
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase">Pacing Strategy</p>
                          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">Fatigue Detected</p>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed mt-4 bg-muted/20 p-3 rounded-lg border">
                        {selectedAttempt.stressPatterns.behavior}
                      </p>
                    </CardContent>
                  </Card>

                  {/* GenAI Success Mentor Roadmap */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Message Box */}
                    <Card className="md:col-span-1 border-border bg-slate-900 text-slate-100 shadow-sm flex flex-col justify-between">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 text-primary" />
                          <CardTitle className="text-sm font-extrabold text-slate-100">AI Study Mentor</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-2 text-xs flex-1 flex flex-col justify-between">
                        <p className="leading-relaxed text-slate-300 italic">
                          "{selectedAttempt.mentorMessage}"
                        </p>
                        <div className="pt-4 flex items-center gap-2 border-t border-slate-800 mt-4 text-[10px] text-slate-400 font-mono">
                          <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                          GENAI ANALYSIS ACTIVE
                        </div>
                      </CardContent>
                    </Card>

                    {/* Step-by-Step Success Roadmap checklist */}
                    <Card className="md:col-span-2 border-border bg-card shadow-sm flex flex-col justify-between">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                          <CheckSquare className="h-4.5 w-4.5 text-emerald-600" />
                          Personalized Success Action Roadmap
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Step-by-step checklist recommended by GenAI Mentor to eliminate blindspots.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-2 space-y-3">
                        {selectedAttempt.roadmap.map((task: any) => (
                          <div 
                            key={task.id}
                            onClick={() => handleToggleRoadmapTask(task.id)}
                            className={`flex items-start gap-3 rounded-lg border p-3 transition-all cursor-pointer ${
                              task.done 
                                ? "bg-muted/40 border-muted text-muted-foreground" 
                                : "bg-card border-border hover:border-primary/30 text-foreground"
                            }`}
                          >
                            <div className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border ${
                              task.done ? "bg-emerald-600 border-emerald-600 text-white" : "border-muted-foreground bg-card"
                            }`}>
                              {task.done && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <span className={`text-xs ${task.done ? 'line-through opacity-70' : 'font-medium'}`}>
                              {task.text}
                            </span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                  </div>

                </div>

              </div>
            )}
          </TabsContent>

          {/* TAB 3: OFFICIAL SCHEDULES */}
          <TabsContent value="official-schedule" className="space-y-4 animate-in fade-in duration-300">
            <Timetable readOnly={true} />
          </TabsContent>

          {/* TAB 4: OFFICIAL RESULTS */}
          <TabsContent value="official-results" className="space-y-4 animate-in fade-in duration-300">
            <Card className="border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold">My Results</CardTitle>
                <CardDescription>
                  Official evaluated marks for your completed examinations in the database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border bg-card">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="font-semibold">Exam Name</TableHead>
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold text-right">Score</TableHead>
                        <TableHead className="font-semibold">Remarks</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingMarks ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <div className="flex justify-center items-center gap-2 text-sm text-muted-foreground">
                              <RefreshCw className="h-4 w-4 animate-spin text-primary" /> Loading results...
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : marks.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                            No official evaluated results found in the database.
                          </TableCell>
                        </TableRow>
                      ) : (
                        marks.map((mark, index) => (
                          <TableRow key={index} className="hover:bg-muted/20">
                            <TableCell className="font-semibold">
                              {mark.exams?.name || "Unknown Exam"}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {mark.exams?.start_date ? format(new Date(mark.exams.start_date), "PPP") : "-"}
                            </TableCell>
                            <TableCell className="text-right font-bold text-base">
                              {mark.score}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground" title={mark.remarks || ""}>
                              {mark.remarks || "-"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={mark.score >= 40 ? "default" : "destructive"}>
                                {mark.score >= 40 ? "Pass" : "Fail"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>

      {/* 3. SYLLABUS WEIGHTS AND DIFFICULTY DIALOG MODAL */}
      <AnimatePresence>
        {selectedSyllabusExam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-card rounded-xl border border-border p-6 shadow-xl space-y-4"
            >
              <div className="flex justify-between items-start border-b pb-3">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{selectedSyllabusExam.name}</h3>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">Code: {selectedSyllabusExam.examCode}</p>
                </div>
                <button 
                  onClick={() => setSelectedSyllabusExam(null)}
                  className="text-muted-foreground hover:text-foreground text-lg shrink-0"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Syllabus Weightage Analysis</h4>
                  <div className="space-y-2 border rounded-lg p-3 bg-muted/20">
                    {selectedSyllabusExam.syllabus.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="font-medium text-foreground">{item.topic}</span>
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/10 px-2 py-0 text-[10px] font-bold font-mono">
                          {item.weightage}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div className="rounded-lg border p-2 bg-muted/20 text-center">
                    <p className="text-[10px] text-muted-foreground font-semibold">DIFFICULTY</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{selectedSyllabusExam.difficulty}</p>
                  </div>
                  <div className="rounded-lg border p-2 bg-muted/20 text-center">
                    <p className="text-[10px] text-muted-foreground font-semibold">TEST TIME</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{selectedSyllabusExam.duration} mins</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  onClick={() => {
                    const exam = selectedSyllabusExam;
                    setSelectedSyllabusExam(null);
                    handleStartExam(exam);
                  }}
                  className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold shadow-md"
                >
                  Start Exam Timed Session
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
