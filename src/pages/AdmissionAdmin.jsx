import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, FileCheck, Award, Calendar, RefreshCcw } from "lucide-react";
import { api } from "@/services/api";
import { toast } from "sonner";

export default function AdmissionAdmin() {
  const [stats, setStats] = useState({
    total_applications: 0,
    pending_verification: 0,
    admitted: 0,
  });
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.getAdmissions();
      if (response.data) {
        const apps = response.data;
        setApplications(apps);
        setStats({
          total_applications: apps.length,
          pending_verification: apps.filter((a) => a.status === "applied").length,
          admitted: apps.filter((a) => a.status === "admitted").length,
        });
      }
    } catch (error) {
      console.error("Failed to fetch admin data", error);
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.updateAdmissionStatus(id, newStatus, "Status updated by admin");
      toast.success(`Application marked as ${newStatus}`);
      fetchDashboardData();
    } catch (error) {
      toast.error("Update failed");
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admission Administration</h1>
          <p className="text-muted-foreground">Manage applications, exams, and merit lists.</p>
        </div>
        <Button onClick={fetchDashboardData} size="sm" variant="outline">
          <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_applications}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending_verification}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admitted Students</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.admitted}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="applications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="exams">Entrance Exams</TabsTrigger>
          <TabsTrigger value="merit">Merit Lists</TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>Application Management</CardTitle>
              <CardDescription>Review and process incoming student applications.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="p-8 text-center">
                  <Loader2 className="animate-spin h-8 w-8 mx-auto" />
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      className="flex justify-between items-center border-b pb-4 last:border-0"
                    >
                      <div>
                        <div className="font-semibold">{app.applicant_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {app.application_no} | {app.course_applied}
                        </div>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">{app.gender || "N/A"}</Badge>
                          <Badge variant="outline">{app.category || "General"}</Badge>
                          <Badge
                            className={
                              app.status === "applied"
                                ? "bg-blue-100 text-blue-800"
                                : app.status === "verified"
                                  ? "bg-purple-100 text-purple-800"
                                  : app.status === "admitted"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                            }
                          >
                            {app.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {app.status === "applied" && (
                          <Button size="sm" onClick={() => handleStatusUpdate(app.id, "verified")}>
                            Verify Docs
                          </Button>
                        )}
                        {app.status === "verified" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleStatusUpdate(app.id, "shortlisted")}
                          >
                            Shortlist
                          </Button>
                        )}
                        {app.status === "merit_listed" && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleStatusUpdate(app.id, "admitted")}
                          >
                            Admit Student
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Entrance Exams</CardTitle>
              <CardDescription>Manage exams and record student scores.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4 border p-4 rounded-lg">
                  <h3 className="font-semibold">Create New Exam</h3>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Exam Name</label>
                    <input
                      className="w-full border rounded p-2 text-sm"
                      placeholder="e.g. JEE Main 2026"
                      id="examName"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date</label>
                    <input
                      className="w-full border rounded p-2 text-sm"
                      type="date"
                      id="examDate"
                    />
                  </div>
                  <Button
                    onClick={async () => {
                      const name = document.getElementById("examName").value;
                      const date = document.getElementById("examDate").value;
                      if (!name || !date) return toast.error("Fill all fields");
                      try {
                        await api.createEntranceExam({
                          name,
                          exam_code: name.replace(/\s+/g, "_").toUpperCase(),
                          academic_year: "2025-2026",
                          exam_date: date,
                          max_score: 360,
                        });
                        toast.success("Exam created");
                      } catch (e) {
                        toast.error("Failed to create exam");
                      }
                    }}
                  >
                    Create Exam
                  </Button>
                </div>

                <div className="space-y-4 border p-4 rounded-lg">
                  <h3 className="font-semibold">Enter Student Score</h3>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Application ID (Admission ID)</label>
                    <input
                      className="w-full border rounded p-2 text-sm"
                      placeholder="UUID"
                      id="scoreAppId"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Score</label>
                    <input
                      className="w-full border rounded p-2 text-sm"
                      type="number"
                      placeholder="e.g. 280"
                      id="scoreValue"
                    />
                  </div>
                  <Button
                    onClick={async () => {
                      const admission_id = document.getElementById("scoreAppId").value;
                      const score = document.getElementById("scoreValue").value;
                      // Hardcoded Exam ID lookup would be needed here in real app, simplified for demo to use text or first valid exam
                      // For MVP, we presume admin knows IDs or we list them.
                      // Better: Fetch exams list first.
                      toast.info(
                        "Select an exam from list to enter scores (Implementing logic...)"
                      );
                    }}
                  >
                    Submit Score
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="merit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Merit List Generation</CardTitle>
              <CardDescription>Automatically shortlist students based on cutoffs.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">List Name</label>
                    <input
                      className="w-full border rounded p-2 text-sm"
                      defaultValue="Round 1 - CS"
                      id="mlName"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Course</label>
                    <select className="w-full border rounded p-2 text-sm" id="mlCourse">
                      <option value="B.Tech Computer Science">B.Tech Computer Science</option>
                      <option value="B.Tech Electronics">B.Tech Electronics</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cut-off Score</label>
                    <input
                      className="w-full border rounded p-2 text-sm"
                      type="number"
                      defaultValue="90"
                      id="mlCutoff"
                    />
                  </div>
                  <Button
                    onClick={async () => {
                      const name = document.getElementById("mlName").value;
                      const course = document.getElementById("mlCourse").value;
                      const cutoff = document.getElementById("mlCutoff").value;
                      try {
                        const res = await api.generateMeritList({
                          name,
                          academic_year: "2025-2026",
                          course_identifier: course,
                          cut_off_score: Number(cutoff),
                          round_number: 1,
                          category: "General",
                        });
                        if (res.data)
                          toast.success(
                            `List Generated! ${res.data.candidates_shortlisted || 0} candidates shortlisted.`
                          );
                      } catch (e) {
                        toast.error("Failed to generate list");
                      }
                    }}
                  >
                    Generate & Publish List
                  </Button>
                </div>
                <div className="border rounded-lg p-4 bg-muted/20">
                  <h4 className="font-semibold mb-2">Instructions</h4>
                  <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                    <li>Ensure all applicant scores are entered before generation.</li>
                    <li>Only "Verified" applications are considered.</li>
                    <li>
                      Students meeting the cutoff will be automatically moved to "Merit Listed"
                      status.
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
