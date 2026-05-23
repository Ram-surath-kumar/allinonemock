import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ManageOrg } from "@/components/admin/ManageOrg";
import { ShieldCheck, Lock, Sparkles, Upload, Trash, Plus, FileText, Check, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { generateMockQuestionsFromPDF } from "@/services/gemini";

export default function AdminConsole() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [activeTab, setActiveTab] = useState("manage-org");

    // PYQP States
    const [paperTitle, setPaperTitle] = useState("");
    const [examCode, setExamCode] = useState("");
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [duration, setDuration] = useState("120");
    const [category, setCategory] = useState("GATE");
    const [difficulty, setDifficulty] = useState("Medium");
    
    // PDF Ingestion States
    const [pdfBase64, setPdfBase64] = useState<string | null>(null);
    const [pdfName, setPdfName] = useState<string | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [questions, setQuestions] = useState<any[]>([]);

    // Published PYQPs
    const [publishedPapers, setPublishedPapers] = useState<any[]>([]);
    const [isPublishing, setIsPublishing] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            fetchPublishedPapers();
        }
    }, [isAuthenticated]);

    const fetchPublishedPapers = async () => {
        try {
            const res = await api.get<any[]>("/exam/pyqp/list");
            if (res.data) {
                setPublishedPapers(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch published papers:", error);
        }
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (username === "UNFOUNDED" && password === "ZIGGERS") {
            setIsAuthenticated(true);
            toast.success("Welcome to Admin Console");
        } else {
            toast.error("Invalid credentials");
        }
    };

    const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPdfName(file.name);
            
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    resolve((reader.result as string).split(',')[1]);
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            setPdfBase64(base64);
            toast.success(`Ingested file: ${file.name}`);
        }
    };

    const handleAIQuestionExtraction = async () => {
        if (!pdfBase64) {
            toast.error("Please upload a PDF file first");
            return;
        }

        setIsExtracting(true);
        try {
            const extracted = await generateMockQuestionsFromPDF(pdfBase64);
            setQuestions(extracted.map((q, idx) => ({
                id: idx + 1,
                text: q.text || "",
                options: q.options || ["", "", "", ""],
                correct: q.correct || "A",
                concept: q.concept || "General",
                cognitiveTopic: q.cognitiveTopic || "General Topic",
                difficulty: q.difficulty || "Medium",
                avgTime: q.avgTime || 90
            })));
            toast.success(`AI successfully extracted ${extracted.length} questions from the PDF!`);
        } catch (err: any) {
            toast.error(err.message || "AI failed to extract questions. Using baseline format.");
        } finally {
            setIsExtracting(false);
        }
    };

    const handlePublishPaper = async () => {
        if (!paperTitle || !examCode || questions.length === 0) {
            toast.error("Please fill in all details and extract/add at least 1 question.");
            return;
        }

        setIsPublishing(true);
        try {
            const res = await api.post("/exam/pyqp/upload", {
                title: paperTitle,
                examCode,
                year: parseInt(year),
                questionsCount: questions.length,
                duration: parseInt(duration),
                category,
                difficulty,
                questions,
                pdf_url: `https://schoolsphere-assets.s3.amazonaws.com/mocks/${pdfName || 'default.pdf'}`
            });

            if (res.error) {
                throw new Error(res.error);
            }

            toast.success("PYQP Paper published to student portal successfully!");
            // Reset form
            setPaperTitle("");
            setExamCode("");
            setPdfBase64(null);
            setPdfName(null);
            setQuestions([]);
            // Refresh list
            fetchPublishedPapers();
        } catch (err: any) {
            toast.error(err.message || "Failed to publish PYQP.");
        } finally {
            setIsPublishing(false);
        }
    };

    const handleDeletePaper = async (id: string) => {
        try {
            const res = await api.delete(`/exam/pyqp/${id}`);
            if (res.error) throw new Error(res.error);
            toast.success("PYQP deleted successfully!");
            fetchPublishedPapers();
        } catch (err: any) {
            toast.error(err.message || "Failed to delete PYQP.");
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background animate-fade-in">
                <Card className="w-full max-w-md shadow-lg border border-border bg-card">
                    <CardHeader className="space-y-1">
                        <div className="flex items-center justify-center mb-4">
                            <div className="p-3 rounded-full bg-primary/10 text-primary">
                                <Lock className="h-8 w-8" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold text-center text-foreground">Admin Access</CardTitle>
                        <CardDescription className="text-center text-muted-foreground">
                            Enter your credentials to access the console
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    placeholder="Enter username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full mt-4 bg-primary text-primary-foreground font-semibold hover:bg-primary/95 shadow-md">
                                Unlock Console
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="container mx-auto p-6 space-y-8 animate-fade-in max-w-6xl">
                <div className="flex items-center justify-between border-b pb-6">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 rounded-xl bg-primary/10 text-primary">
                            <ShieldCheck className="h-8 w-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight">Admin Console</h1>
                            <p className="text-muted-foreground mt-1">
                                System-wide college administration, PYQP publishing, and RAG configuration.
                            </p>
                        </div>
                    </div>
                    <Button 
                        variant="outline" 
                        onClick={() => setIsAuthenticated(false)}
                        className="text-sm font-semibold border-border hover:bg-accent text-red-500 hover:text-red-600"
                    >
                        Lock Console
                    </Button>
                </div>

                <Tabs defaultValue="manage-org" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 max-w-lg bg-muted p-1 rounded-xl">
                        <TabsTrigger value="manage-org" className="font-semibold">Manage Organizations</TabsTrigger>
                        <TabsTrigger value="upload-pyqp" className="font-semibold">Publish PYQPs</TabsTrigger>
                        <TabsTrigger value="settings" className="font-semibold">Global Settings</TabsTrigger>
                    </TabsList>

                    <TabsContent value="manage-org" className="space-y-4 animate-in fade-in duration-300">
                        <Card className="border border-border">
                            <CardHeader>
                                <CardTitle>Organization Management</CardTitle>
                                <CardDescription>
                                    Create, update, and remove organizations from the system.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ManageOrg />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* NEW TAB: UPLOAD PYQP */}
                    <TabsContent value="upload-pyqp" className="space-y-6 animate-in fade-in duration-300">
                        <Card className="border border-border">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl font-bold">
                                    <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                                    AI-Powered Previous Year Question Paper (PYQP) Publisher
                                </CardTitle>
                                <CardDescription>
                                    Publish high-quality Mock test series directly to the student portal. Upload a PDF, let Gemini AI auto-extract questions, verify, and publish!
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Form parameters */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="paper-title" className="font-semibold">Exam Title / Name</Label>
                                        <Input 
                                            id="paper-title" 
                                            placeholder="e.g. GATE 2026 Computer Science" 
                                            value={paperTitle}
                                            onChange={(e) => setPaperTitle(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="exam-code" className="font-semibold">Unique Exam Code</Label>
                                        <Input 
                                            id="exam-code" 
                                            placeholder="e.g. GATE-CSE-26" 
                                            value={examCode}
                                            onChange={(e) => setExamCode(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="exam-category" className="font-semibold">Category / Stream</Label>
                                        <select 
                                            id="exam-category" 
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="GATE">Engineering (GATE)</option>
                                            <option value="JEE">Engineering (JEE)</option>
                                            <option value="NEET">Medical (NEET)</option>
                                            <option value="UPSC">Civil Services (UPSC)</option>
                                            <option value="CAT">Management (CAT)</option>
                                            <option value="General">General / Others</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="exam-year" className="font-semibold">Exam Year</Label>
                                        <Input 
                                            id="exam-year" 
                                            value={year}
                                            onChange={(e) => setYear(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="exam-duration" className="font-semibold">Duration (Minutes)</Label>
                                        <Input 
                                            id="exam-duration" 
                                            type="number"
                                            value={duration}
                                            onChange={(e) => setDuration(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="exam-difficulty" className="font-semibold">Difficulty Level</Label>
                                        <select 
                                            id="exam-difficulty" 
                                            value={difficulty}
                                            onChange={(e) => setDifficulty(e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="Easy">Easy</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Hard">Hard</option>
                                        </select>
                                    </div>
                                </div>

                                {/* PDF Uploader */}
                                <div className="border-t pt-6 space-y-4">
                                    <Label className="font-semibold block mb-2">Upload Paper PDF (MIMIC Storage & RAG)</Label>
                                    <div 
                                        onClick={() => document.getElementById("admin-pdf-input")?.click()}
                                        className="border-2 border-dashed rounded-xl p-8 text-center bg-muted/40 hover:bg-muted/70 transition-all cursor-pointer flex flex-col items-center justify-center"
                                    >
                                        <input 
                                            id="admin-pdf-input"
                                            type="file" 
                                            accept=".pdf" 
                                            className="hidden" 
                                            onChange={handlePDFUpload} 
                                        />
                                        <Upload className="h-8 w-8 text-primary mb-3 animate-pulse" />
                                        <span className="font-semibold text-sm">
                                            {pdfName ? pdfName : "Drag & drop or Click to upload Previous Year Paper PDF"}
                                        </span>
                                        <span className="text-xs text-muted-foreground mt-1">Supports up to 30MB PDF files</span>
                                    </div>

                                    {pdfBase64 && (
                                        <div className="flex justify-end pt-2">
                                            <Button 
                                                onClick={handleAIQuestionExtraction}
                                                disabled={isExtracting}
                                                className="bg-primary text-primary-foreground hover:bg-primary/95 font-bold shadow-md text-sm gap-2"
                                            >
                                                {isExtracting ? (
                                                    <>
                                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                                        AI Scanning & Extracting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="h-4 w-4 text-white" />
                                                        🤖 AI Extract MCQs Structure
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Questions preview list */}
                                {questions.length > 0 && (
                                    <div className="border-t pt-6 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-base font-bold text-foreground flex items-center gap-1.5">
                                                <FileText className="h-4.5 w-4.5 text-primary" />
                                                Extracted Questions Preview ({questions.length} Items)
                                            </h4>
                                            <Button 
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setQuestions(prev => [
                                                    ...prev, 
                                                    { 
                                                        id: prev.length + 1, 
                                                        text: "", 
                                                        options: ["", "", "", ""], 
                                                        correct: "A", 
                                                        concept: "", 
                                                        cognitiveTopic: "", 
                                                        difficulty: "Medium", 
                                                        avgTime: 90 
                                                    }
                                                ])}
                                                className="border-border text-xs gap-1 hover:bg-accent"
                                            >
                                                <Plus className="h-3.5 w-3.5" /> Add Question
                                            </Button>
                                        </div>

                                        <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                                            {questions.map((q, qIdx) => (
                                                <div key={q.id} className="border rounded-xl p-4 bg-muted/20 relative space-y-4 border-border">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => setQuestions(prev => prev.filter(item => item.id !== q.id))}
                                                        className="absolute top-2 right-2 text-red-500 hover:bg-red-500/10 hover:text-red-600 h-8 w-8"
                                                    >
                                                        <Trash className="h-4.5 w-4.5" />
                                                    </Button>

                                                    <div className="flex gap-4 items-start">
                                                        <Badge className="bg-primary hover:bg-primary text-primary-foreground font-bold shrink-0">
                                                            Q{qIdx + 1}
                                                        </Badge>
                                                        <div className="flex-1 space-y-3">
                                                            <div className="space-y-1">
                                                                <Label className="text-xs font-semibold">Question Text</Label>
                                                                <Input 
                                                                    value={q.text} 
                                                                    onChange={(e) => {
                                                                        const updated = [...questions];
                                                                        updated[qIdx].text = e.target.value;
                                                                        setQuestions(updated);
                                                                    }}
                                                                    placeholder="Enter question wording..."
                                                                />
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                {q.options.map((opt: string, optIdx: number) => (
                                                                    <div key={optIdx} className="space-y-1">
                                                                        <Label className="text-xs text-muted-foreground font-medium">Option {String.fromCharCode(65 + optIdx)}</Label>
                                                                        <Input 
                                                                            value={opt} 
                                                                            onChange={(e) => {
                                                                                const updated = [...questions];
                                                                                updated[qIdx].options[optIdx] = e.target.value;
                                                                                setQuestions(updated);
                                                                            }}
                                                                            placeholder={`Choice ${String.fromCharCode(65 + optIdx)}`}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs font-semibold">Correct Option</Label>
                                                                    <select
                                                                        value={q.correct}
                                                                        onChange={(e) => {
                                                                            const updated = [...questions];
                                                                            updated[qIdx].correct = e.target.value;
                                                                            setQuestions(updated);
                                                                        }}
                                                                        className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1.5 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                                    >
                                                                        <option value="A">A</option>
                                                                        <option value="B">B</option>
                                                                        <option value="C">C</option>
                                                                        <option value="D">D</option>
                                                                    </select>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs font-semibold">Tested Concept</Label>
                                                                    <Input 
                                                                        value={q.concept} 
                                                                        onChange={(e) => {
                                                                            const updated = [...questions];
                                                                            updated[qIdx].concept = e.target.value;
                                                                            setQuestions(updated);
                                                                        }}
                                                                        placeholder="e.g. Dijkstra's Algorithm"
                                                                        className="h-9 text-xs"
                                                                    />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs font-semibold">Cognitive Topic</Label>
                                                                    <Input 
                                                                        value={q.cognitiveTopic} 
                                                                        onChange={(e) => {
                                                                            const updated = [...questions];
                                                                            updated[qIdx].cognitiveTopic = e.target.value;
                                                                            setQuestions(updated);
                                                                        }}
                                                                        placeholder="e.g. Graph Theory"
                                                                        className="h-9 text-xs"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="flex justify-between border-t p-4 bg-muted/10">
                                <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                                    <AlertCircle className="h-3.5 w-3.5" /> Verify questions thoroughly before publishing.
                                </span>
                                <Button 
                                    onClick={handlePublishPaper}
                                    disabled={isPublishing || questions.length === 0}
                                    className="bg-primary text-primary-foreground font-semibold shadow hover:bg-primary/95 text-sm gap-1.5"
                                >
                                    {isPublishing ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                            Publishing Paper...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-4 w-4 text-white" />
                                            Publish to Student Vault
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>

                        {/* Published list */}
                        <Card className="border border-border">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold">Published Papers Vault</CardTitle>
                                <CardDescription>Currently active Previous Year Papers (PYQP) series in the student portal.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {publishedPapers.length === 0 ? (
                                    <div className="h-24 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                                        No custom PYQPs published yet.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {publishedPapers.map((paper) => (
                                            <div key={paper.id} className="flex items-center justify-between border rounded-lg p-4 bg-card shadow-sm hover:shadow transition-all border-border">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h5 className="font-bold text-sm text-foreground">{paper.title}</h5>
                                                        <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-medium uppercase px-2">
                                                            {paper.category}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground font-mono">
                                                        Exam Code: {paper.examCode} | Year: {paper.year} | {paper.questionsCount} MCQs | {paper.duration} minutes
                                                    </p>
                                                </div>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => handleDeletePaper(paper.id)}
                                                    className="text-red-500 hover:bg-red-500/10 hover:text-red-600 h-9 w-9 shrink-0"
                                                >
                                                    <Trash className="h-4.5 w-4.5" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="settings animate-in fade-in duration-300">
                        <Card className="border border-border">
                            <CardHeader>
                                <CardTitle>Global Settings</CardTitle>
                                <CardDescription>
                                    Configure system-wide parameters (Coming Soon).
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                                    Settings module under development.
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
