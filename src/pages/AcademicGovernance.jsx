import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, BookOpen, CheckCircle, AlertTriangle, FileText, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { RippleLoader } from "@/components/ui/RippleLoader";

export function AcademicGovernance() {
  const [stats, setStats] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [proposalOpen, setProposalOpen] = useState(false);
  const [newProgram, setNewProgram] = useState({
    code: "",
    name: "",
    duration_years: "3",
    type: "Degree"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, programsRes] = await Promise.all([
        fetch("http://localhost:3001/api/academic/dashboard"),
        fetch("http://localhost:3001/api/academic/programs"),
      ]);

      const statsJson = await statsRes.json();
      const programsJson = await programsRes.json();

      if (statsJson.data) setStats(statsJson.data);
      if (programsJson.data) setPrograms(programsJson.data);
    } catch (error) {
      console.error("Failed to fetch academic data", error);
    } finally {
      setLoading(false);
    }
  };

  const attainmentData = [
    { name: "PO1", target: 75, achieved: 78 },
    { name: "PO2", target: 75, achieved: 70 },
    { name: "PO3", target: 70, achieved: 72 },
    { name: "PO4", target: 75, achieved: 68 },
    { name: "PO5", target: 65, achieved: 69 },
  ];

  // Removed nested import

  const handlePropose = async () => {
    if (!newProgram.code || !newProgram.name) {
      toast.error("Please fill in all required fields");
      return;
    }
    // Mock success for now as we're focusing on UI/Responsiveness
    toast.success("Program proposal submitted for review");
    setProposalOpen(false);
    setNewProgram({ code: "", name: "", duration_years: "3", type: "Degree" });
  };

  if (loading) return <RippleLoader />;

  return (
    <div className="space-y-6 px-5 py-6 md:px-10 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Academic Governance</h1>
        <Dialog open={proposalOpen} onOpenChange={setProposalOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="w-full sm:w-auto h-9">
              <Plus className="mr-2 h-4 w-4" /> New Program Proposal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md w-[90vw] rounded-xl">
            <DialogHeader>
              <DialogTitle>New Program Proposal</DialogTitle>
              <DialogDescription>
                Submit a new academic program for accreditation and approval.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="prog-code">Program Code</Label>
                <Input
                  id="prog-code"
                  placeholder="e.g. BSC-CS"
                  value={newProgram.code}
                  onChange={(e) => setNewProgram({ ...newProgram, code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prog-name">Program Name</Label>
                <Input
                  id="prog-name"
                  placeholder="e.g. B.Sc. Computer Science"
                  value={newProgram.name}
                  onChange={(e) => setNewProgram({ ...newProgram, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duration (Years)</Label>
                  <Select
                    value={newProgram.duration_years}
                    onValueChange={(v) => setNewProgram({ ...newProgram, duration_years: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Year</SelectItem>
                      <SelectItem value="2">2 Years</SelectItem>
                      <SelectItem value="3">3 Years</SelectItem>
                      <SelectItem value="4">4 Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Program Type</Label>
                  <Select
                    value={newProgram.type}
                    onValueChange={(v) => setNewProgram({ ...newProgram, type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Degree">Degree</SelectItem>
                      <SelectItem value="Diploma">Diploma</SelectItem>
                      <SelectItem value="Certificate">Certificate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setProposalOpen(false)}>Cancel</Button>
              <Button onClick={handlePropose}>Submit Proposal</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.programs?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.programs?.approved || 0} Approved, {stats?.programs?.pending || 0} Pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Curriculum Compliance</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.curriculumCompliance}%</div>
            <p className="text-xs text-muted-foreground">Adherence to UGC/AICTE norms</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg PO Attainment</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgPOAttainment}%</div>
            <p className="text-xs text-muted-foreground">Program Outcome Achievement</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assessments</CardTitle>
            <FileText className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Ongoing exams & evaluations</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="programs" className="space-y-4">
        <TabsList className="w-full flex h-auto items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground overflow-x-auto no-scrollbar scroll-smooth">
          <TabsTrigger value="programs" className="px-4">Program Status</TabsTrigger>
          <TabsTrigger value="outcomes" className="px-4">Outcome Analysis</TabsTrigger>
          <TabsTrigger value="curriculum" className="px-4">Curriculum</TabsTrigger>
        </TabsList>

        <TabsContent value="programs" className="space-y-4">
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Academic Programs</CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              <div className="rounded-none sm:rounded-md border-x-0 sm:border overflow-x-auto no-scrollbar">
                <table className="w-full text-sm min-w-[700px]">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 text-left">Program Code</th>
                      <th className="p-3 text-left">Name</th>
                      <th className="p-3 text-left">Duration</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-left">Approval Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {programs.map((prog) => (
                      <tr key={prog.id} className="border-t">
                        <td className="p-3 font-medium">{prog.code}</td>
                        <td className="p-3">{prog.name}</td>
                        <td className="p-3">{prog.duration_years} Years</td>
                        <td className="p-3">
                          <Badge
                            variant={prog.approval_status === "Approved" ? "default" : "secondary"}
                          >
                            {prog.approval_status}
                          </Badge>
                        </td>
                        <td className="p-3">{prog.approval_date}</td>
                      </tr>
                    ))}
                    {programs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-muted-foreground">
                          No programs found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outcomes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Program Outcome (PO) Attainment</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attainmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="target" fill="#8884d8" name="Target Level" />
                  <Bar dataKey="achieved" fill="#82ca9d" name="Achieved Level" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
