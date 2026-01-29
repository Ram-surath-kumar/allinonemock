import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useI18n } from "@/lib/i18n";

export function MISSubmission() {
  const { t } = useI18n();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState("AICTE");
  const [academicYear, setAcademicYear] = useState("2024-2025");
  const { toast } = useToast();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/mis/reports");
      const json = await res.json();
      if (json.data) setReports(json.data);
    } catch (error) {
      console.error("Failed to fetch reports", error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      const res = await fetch("http://localhost:3001/api/mis/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_type: reportType, academic_year: academicYear }),
      });
      const json = await res.json();
      if (json.success) {
        toast({
          title: t("mis.reportGenerated"),
          description: t("mis.misReportGeneratedSuccessfully"),
        });
        fetchReports();
      } else {
        throw new Error(json.message);
      }
    } catch (error) {
      toast({
        title: t("mis.generationFailed"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="p-8">{t("mis.loading")}</div>;

  return (
    <div className="space-y-6 px-5 py-6 md:px-10 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">{t("mis.title")}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Generator Card */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>{t("mis.generateNewReport")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("mis.reportType")}</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AICTE">{t("mis.aicteCompliance")}</SelectItem>
                    <SelectItem value="UGC">{t("mis.ugcAnnualReport")}</SelectItem>
                    <SelectItem value="NIRF">{t("mis.nirfData")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("mis.academicYear")}</label>
                <Select value={academicYear} onValueChange={setAcademicYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024-2025">2024-2025</SelectItem>
                    <SelectItem value="2023-2024">2023-2024</SelectItem>
                    <SelectItem value="2022-2023">2022-2023</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full" onClick={generateReport} disabled={generating}>
              {generating ? t("common.loading") : t("mis.generateReport")}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              {t("mis.aggregateDataDescription")}
            </p>
          </CardContent>
        </Card>

        {/* Recent Activity / Stats */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>{t("mis.submissionStatus")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm font-medium">{t("mis.lastSubmission")}</span>
                <span className="text-sm text-muted-foreground">Oct 15, 2024</span>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm font-medium">{t("mis.aicteStatus")}</span>
                <Badge variant="default" className="bg-green-500">
                  {t("mis.submitted")}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t("mis.ugcStatus")}</span>
                <Badge variant="secondary">{t("mis.pending")}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">{t("mis.reportHistory")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="rounded-none sm:rounded-md border-x-0 sm:border overflow-x-auto no-scrollbar">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 text-left">{t("mis.reportType")}</th>
                  <th className="p-3 text-left">{t("mis.academicYear")}</th>
                  <th className="p-3 text-left">{t("mis.generatedAt")}</th>
                  <th className="p-3 text-left">{t("common.status")}</th>
                  <th className="p-3 text-right">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-t">
                    <td className="p-3 font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      {report.report_type}
                    </td>
                    <td className="p-3">{report.academic_year}</td>
                    <td className="p-3">{new Date(report.created_at).toLocaleDateString()}</td>
                    <td className="p-3">
                      <Badge variant={report.status === "Submitted" ? "default" : "secondary"}>
                        {report.status === "Submitted"
                          ? t("mis.submitted")
                          : report.status === "Generated"
                            ? t("mis.generated")
                            : report.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        {t("mis.export")}
                      </Button>
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-muted-foreground">
                      {t("common.noResults")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
