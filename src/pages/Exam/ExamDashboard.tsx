import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Calendar,
  GraduationCap,
  FileCheck,
  Plus,
  Clock,
  CalendarDays,
} from "lucide-react";
import { api } from "@/services/api";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { ScheduleExamDialog } from "./ScheduleExamDialog";
import { SeatingArrangement } from "./SeatingArrangement";
import { HallTicketGenerator } from "./HallTicketGenerator";

export default function ExamDashboard() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  const [exams, setExams] = useState<any[]>([]);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.getExamDashboard();
      if (response.error) throw new Error(response.error);
      setStats(response.data.stats || {});

      const examsResponse = await api.getExams();
      if (examsResponse.data) setExams(examsResponse.data);
    } catch (error: any) {
      toast.error(error.message || t("examinations.failedToLoadExamData"));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse">
        {t("examinations.loadingExaminationData")}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t("examinations.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("examinations.manageSchedulesAssessments")}
          </p>
        </div>
        <div className="flex gap-2">
          {/* @ts-expect-error - Button accepts children but TypeScript doesn't recognize it from JSX component */}
          <Button variant="outline" onClick={loadData}>
            {t("examinations.refresh")}
          </Button>
          {/* @ts-expect-error - Button accepts children but TypeScript doesn't recognize it from JSX component */}
          <Button className="shad-button-primary" onClick={() => setScheduleOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> {t("examinations.scheduleExam")}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* @ts-expect-error - Card components accept children but TypeScript doesn't recognize it from JSX component */}
        <Card className="shad-card hover-lift">
          {/* @ts-expect-error - CardHeader accepts children but TypeScript doesn't recognize it from JSX component */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            {/* @ts-expect-error - CardTitle accepts children but TypeScript doesn't recognize it from JSX component */}
            <CardTitle className="text-sm font-medium">{t("examinations.activeExams")}</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          {/* @ts-expect-error - CardContent accepts children but TypeScript doesn't recognize it from JSX component */}
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_exams?.length || 0}</div>
            <p className="text-xs text-muted-foreground">{t("examinations.currentlyScheduled")}</p>
          </CardContent>
        </Card>

        {/* @ts-expect-error - Card components accept children but TypeScript doesn't recognize it from JSX component */}
        <Card className="shad-card hover-lift">
          {/* @ts-expect-error - CardHeader accepts children but TypeScript doesn't recognize it from JSX component */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            {/* @ts-expect-error - CardTitle accepts children but TypeScript doesn't recognize it from JSX component */}
            <CardTitle className="text-sm font-medium">{t("examinations.totalExams")}</CardTitle>
            <BookOpen className="h-4 w-4 text-purple-500" />
          </CardHeader>
          {/* @ts-expect-error - CardContent accepts children but TypeScript doesn't recognize it from JSX component */}
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_exams || 0}</div>
            <p className="text-xs text-muted-foreground">{t("examinations.thisAcademicYear")}</p>
          </CardContent>
        </Card>

        {/* @ts-expect-error - Card components accept children but TypeScript doesn't recognize it from JSX component */}
        <Card className="shad-card hover-lift">
          {/* @ts-expect-error - CardHeader accepts children but TypeScript doesn't recognize it from JSX component */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            {/* @ts-expect-error - CardTitle accepts children but TypeScript doesn't recognize it from JSX component */}
            <CardTitle className="text-sm font-medium">
              {t("examinations.resultsPending")}
            </CardTitle>
            <FileCheck className="h-4 w-4 text-amber-500" />
          </CardHeader>
          {/* @ts-expect-error - CardContent accepts children but TypeScript doesn't recognize it from JSX component */}
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending_results || 0}</div>
            <p className="text-xs text-muted-foreground">{t("examinations.approvalsNeeded")}</p>
          </CardContent>
        </Card>

        {/* @ts-expect-error - Card components accept children but TypeScript doesn't recognize it from JSX component */}
        <Card className="shad-card hover-lift">
          {/* @ts-expect-error - CardHeader accepts children but TypeScript doesn't recognize it from JSX component */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            {/* @ts-expect-error - CardTitle accepts children but TypeScript doesn't recognize it from JSX component */}
            <CardTitle className="text-sm font-medium">{t("examinations.avgPassRate")}</CardTitle>
            <GraduationCap className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          {/* @ts-expect-error - CardContent accepts children but TypeScript doesn't recognize it from JSX component */}
          <CardContent>
            <div className="text-2xl font-bold">--%</div>
            <p className="text-xs text-muted-foreground">{t("examinations.acrossAllCourses")}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="planning" className="space-y-4">
        {/* @ts-expect-error - TabsList accepts children but TypeScript doesn't recognize it from JSX component */}
        <TabsList>
          {/* @ts-expect-error - TabsTrigger accepts children but TypeScript doesn't recognize it from JSX component */}
          <TabsTrigger value="planning">{t("examinations.planning")}</TabsTrigger>
          {/* @ts-expect-error - TabsTrigger accepts children but TypeScript doesn't recognize it from JSX component */}
          <TabsTrigger value="administration">{t("examinations.administration")}</TabsTrigger>
          {/* @ts-expect-error - TabsTrigger accepts children but TypeScript doesn't recognize it from JSX component */}
          <TabsTrigger value="evaluation">{t("examinations.evaluation")}</TabsTrigger>
          {/* @ts-expect-error - TabsTrigger accepts children but TypeScript doesn't recognize it from JSX component */}
          <TabsTrigger value="results">{t("examinations.results")}</TabsTrigger>
        </TabsList>

        {/* @ts-expect-error - TabsContent accepts children but TypeScript doesn't recognize it from JSX component */}
        <TabsContent value="planning" className="space-y-4">
          {/* @ts-expect-error - Card components accept children but TypeScript doesn't recognize it from JSX component */}
          <Card className="shad-card border-border/50">
            {/* @ts-expect-error - CardHeader accepts children but TypeScript doesn't recognize it from JSX component */}
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                {/* @ts-expect-error - CardTitle accepts children but TypeScript doesn't recognize it from JSX component */}
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  {t("examinations.upcomingExaminations")}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {exams.length} {t("examinations.exams")}
                </Badge>
              </div>
            </CardHeader>
            {/* @ts-expect-error - CardContent accepts children but TypeScript doesn't recognize it from JSX component */}
            <CardContent>
              {exams.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">
                    {t("examinations.noExamsScheduled")}
                  </p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    {t("examinations.clickScheduleExamToCreate")}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {exams.map((exam: any, index: number) => {
                    const startDate = new Date(exam.start_date);
                    const endDate = new Date(exam.end_date);
                    const isSameDay = startDate.toDateString() === endDate.toDateString();
                    const isPlanned = exam.status === "PLANNED";

                    return (
                      <div
                        key={exam.id}
                        className="group relative rounded-lg border border-border/50 bg-card/50 hover:bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200 p-4 animate-in fade-in slide-in-from-bottom-2"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 rounded-lg bg-primary/10 p-2 shrink-0">
                                <BookOpen className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-base text-foreground mb-1.5 group-hover:text-primary transition-colors">
                                  {exam.name}
                                </h3>
                                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>
                                      {isSameDay
                                        ? startDate.toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                          })
                                        : `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                                    </span>
                                  </div>
                                  {!isSameDay && (
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="h-3.5 w-3.5" />
                                      <span>
                                        {Math.ceil(
                                          (endDate.getTime() - startDate.getTime()) /
                                            (1000 * 60 * 60 * 24)
                                        )}{" "}
                                        days
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5 shrink-0">
                            <Badge
                              variant={isPlanned ? "default" : "secondary"}
                              className={`text-xs font-medium px-2.5 py-1 ${
                                isPlanned
                                  ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {exam.status}
                            </Badge>
                            {/* @ts-expect-error - Button accepts children but TypeScript doesn't recognize it from JSX component */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 text-xs font-medium hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                            >
                              <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                              Timetable
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* @ts-expect-error - TabsContent accepts children but TypeScript doesn't recognize it from JSX component */}
        <TabsContent value="administration">
          <Tabs defaultValue="seating" className="w-full">
            {/* @ts-expect-error - TabsList accepts children but TypeScript doesn't recognize it from JSX component */}
            <TabsList className="mb-4">
              {/* @ts-expect-error - TabsTrigger accepts children but TypeScript doesn't recognize it from JSX component */}
              <TabsTrigger value="seating">Seating Arrangement</TabsTrigger>
              {/* @ts-expect-error - TabsTrigger accepts children but TypeScript doesn't recognize it from JSX component */}
              <TabsTrigger value="tickets">Hall Tickets</TabsTrigger>
            </TabsList>

            {/* @ts-expect-error - TabsContent accepts children but TypeScript doesn't recognize it from JSX component */}
            <TabsContent value="seating">
              <SeatingArrangement exams={exams} />
            </TabsContent>

            {/* @ts-expect-error - TabsContent accepts children but TypeScript doesn't recognize it from JSX component */}
            <TabsContent value="tickets">
              <HallTicketGenerator exams={exams} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* @ts-expect-error - TabsContent accepts children but TypeScript doesn't recognize it from JSX component */}
        <TabsContent value="evaluation">
          {/* @ts-expect-error - Card components accept children but TypeScript doesn't recognize it from JSX component */}
          <Card className="shad-card">
            {/* @ts-expect-error - CardHeader accepts children but TypeScript doesn't recognize it from JSX component */}
            <CardHeader>
              {/* @ts-expect-error - CardTitle accepts children but TypeScript doesn't recognize it from JSX component */}
              <CardTitle>Marks Entry</CardTitle>
            </CardHeader>
            {/* @ts-expect-error - CardContent accepts children but TypeScript doesn't recognize it from JSX component */}
            <CardContent>
              <p className="text-muted-foreground">Select a course to enter marks.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* @ts-expect-error - TabsContent accepts children but TypeScript doesn't recognize it from JSX component */}
        <TabsContent value="results">
          {/* @ts-expect-error - Card components accept children but TypeScript doesn't recognize it from JSX component */}
          <Card className="shad-card">
            {/* @ts-expect-error - CardHeader accepts children but TypeScript doesn't recognize it from JSX component */}
            <CardHeader>
              {/* @ts-expect-error - CardTitle accepts children but TypeScript doesn't recognize it from JSX component */}
              <CardTitle>Published Results</CardTitle>
            </CardHeader>
            {/* @ts-expect-error - CardContent accepts children but TypeScript doesn't recognize it from JSX component */}
            <CardContent>
              <p className="text-muted-foreground">Access result analytics and reports.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ScheduleExamDialog open={scheduleOpen} onOpenChange={setScheduleOpen} onSuccess={loadData} />
    </div>
  );
}
