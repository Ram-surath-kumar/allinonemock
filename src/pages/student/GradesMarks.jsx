import { useState, useEffect } from "react";
import { BookOpen, AlertTriangle, XCircle, FileX, Calendar, TrendingDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RippleLoader } from "@/components/ui/RippleLoader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function GradesMarks() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [grades, setGrades] = useState([]);
  const [failedCourses, setFailedCourses] = useState([]);
  const [absentDetails, setAbsentDetails] = useState([]);
  const [malpracticeDetails, setMalpracticeDetails] = useState([]);

  useEffect(() => {
    if (currentUser) {
      loadGradesData();
    }
  }, [currentUser]);

  const loadGradesData = async () => {
    try {
      setLoading(true);
      // Fetch grades data
      if (currentUser?.id) {
        // Simulate API call - replace with actual API endpoint
        const mockGrades = [
          {
            id: "1",
            courseCode: "CS101",
            courseName: "Introduction to Programming",
            credits: 3,
            grade: "A",
            marks: 85,
            maxMarks: 100,
            semester: "Fall 2024",
            year: "2024",
            status: "passed",
          },
          {
            id: "2",
            courseCode: "CS102",
            courseName: "Data Structures",
            credits: 4,
            grade: "B",
            marks: 75,
            maxMarks: 100,
            semester: "Fall 2024",
            year: "2024",
            status: "passed",
          },
          {
            id: "3",
            courseCode: "MATH201",
            courseName: "Calculus",
            credits: 3,
            grade: "F",
            marks: 35,
            maxMarks: 100,
            semester: "Fall 2024",
            year: "2024",
            status: "failed",
          },
          {
            id: "4",
            courseCode: "PHY101",
            courseName: "Physics",
            credits: 3,
            grade: "C",
            marks: 65,
            maxMarks: 100,
            semester: "Spring 2024",
            year: "2024",
            status: "passed",
          },
        ];

        const mockAbsent = [
          {
            id: "1",
            courseCode: "CS103",
            courseName: "Algorithms",
            examDate: "2024-12-15",
            examType: "Midterm",
            reason: "Medical emergency",
          },
        ];

        const mockMalpractice = [
          {
            id: "1",
            courseCode: "MATH201",
            courseName: "Calculus",
            examDate: "2024-11-20",
            description: "Found with unauthorized material",
            action: "Warning issued",
            status: "Resolved",
          },
        ];

        setGrades(mockGrades);
        setFailedCourses(mockGrades.filter((g) => g.status === "failed"));
        setAbsentDetails(mockAbsent);
        setMalpracticeDetails(mockMalpractice);
      }
    } catch (error) {
      console.error("Error loading grades data:", error);
      toast.error("Failed to load grades data");
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case "A":
      case "A+":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "B":
      case "B+":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "C":
      case "C+":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "F":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const calculateGPA = () => {
    if (grades.length === 0) return 0;
    const gradePoints = {
      "A+": 4.0,
      A: 4.0,
      "A-": 3.7,
      "B+": 3.3,
      B: 3.0,
      "B-": 2.7,
      "C+": 2.3,
      C: 2.0,
      "C-": 1.7,
      "D+": 1.3,
      D: 1.0,
      F: 0.0,
    };

    const totalPoints = grades.reduce((sum, grade) => {
      return sum + (gradePoints[grade.grade] || 0) * grade.credits;
    }, 0);

    const totalCredits = grades.reduce((sum, grade) => sum + grade.credits, 0);
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RippleLoader />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall GPA</p>
                <p className="text-2xl font-bold">{calculateGPA()}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Courses</p>
                <p className="text-2xl font-bold">{grades.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed Courses</p>
                <p className="text-2xl font-bold text-destructive">{failedCourses.length}</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pass Rate</p>
                <p className="text-2xl font-bold text-success">
                  {grades.length > 0
                    ? Math.round(((grades.length - failedCourses.length) / grades.length) * 100)
                    : 0}
                  %
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Grades & Marks</CardTitle>
          <CardDescription>View your academic performance and related details</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Grades</TabsTrigger>
              <TabsTrigger value="failed">Failed Courses</TabsTrigger>
              <TabsTrigger value="absent">Absent Details</TabsTrigger>
              <TabsTrigger value="malpractice">Malpractice</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Code</TableHead>
                    <TableHead>Course Name</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No grades available
                      </TableCell>
                    </TableRow>
                  ) : (
                    grades.map((grade) => (
                      <TableRow key={grade.id}>
                        <TableCell className="font-medium">{grade.courseCode}</TableCell>
                        <TableCell>{grade.courseName}</TableCell>
                        <TableCell>{grade.credits}</TableCell>
                        <TableCell>
                          {grade.marks} / {grade.maxMarks}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getGradeColor(grade.grade)}>
                            {grade.grade}
                          </Badge>
                        </TableCell>
                        <TableCell>{grade.semester}</TableCell>
                        <TableCell>
                          <Badge variant={grade.status === "passed" ? "default" : "destructive"}>
                            {grade.status === "passed" ? "Passed" : "Failed"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="failed" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Code</TableHead>
                    <TableHead>Course Name</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Semester</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {failedCourses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <FileX className="h-5 w-5" />
                          No failed courses
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    failedCourses.map((grade) => (
                      <TableRow key={grade.id}>
                        <TableCell className="font-medium">{grade.courseCode}</TableCell>
                        <TableCell>{grade.courseName}</TableCell>
                        <TableCell>{grade.credits}</TableCell>
                        <TableCell className="text-destructive">
                          {grade.marks} / {grade.maxMarks}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getGradeColor(grade.grade)}>
                            {grade.grade}
                          </Badge>
                        </TableCell>
                        <TableCell>{grade.semester}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="absent" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Code</TableHead>
                    <TableHead>Course Name</TableHead>
                    <TableHead>Exam Type</TableHead>
                    <TableHead>Exam Date</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {absentDetails.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Calendar className="h-5 w-5" />
                          No absent records
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    absentDetails.map((absent) => (
                      <TableRow key={absent.id}>
                        <TableCell className="font-medium">{absent.courseCode}</TableCell>
                        <TableCell>{absent.courseName}</TableCell>
                        <TableCell>{absent.examType}</TableCell>
                        <TableCell>{new Date(absent.examDate).toLocaleDateString()}</TableCell>
                        <TableCell>{absent.reason || "Not specified"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="malpractice" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Code</TableHead>
                    <TableHead>Course Name</TableHead>
                    <TableHead>Exam Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Action Taken</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {malpracticeDetails.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <AlertTriangle className="h-5 w-5" />
                          No malpractice records
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    malpracticeDetails.map((malpractice) => (
                      <TableRow key={malpractice.id}>
                        <TableCell className="font-medium">{malpractice.courseCode}</TableCell>
                        <TableCell>{malpractice.courseName}</TableCell>
                        <TableCell>{new Date(malpractice.examDate).toLocaleDateString()}</TableCell>
                        <TableCell>{malpractice.description}</TableCell>
                        <TableCell>{malpractice.action}</TableCell>
                        <TableCell>
                          <Badge
                            variant={malpractice.status === "Resolved" ? "default" : "destructive"}
                          >
                            {malpractice.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
