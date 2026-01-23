import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { api } from "@/services/api";
import { toast } from "sonner";
import { Loader2, CalendarPlus, History, Plane } from "lucide-react";

export function LeaveManagement({ studentId }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    leave_type: "Medical",
    start_date: "",
    end_date: "",
    reason: "",
  });

  useEffect(() => {
    if (studentId) loadLeaves();
  }, [studentId]);

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const response = await api.getLeaves(studentId);
      if (response.data) {
        setLeaves(response.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await api.applyLeave({ studentId, ...formData });
      if (!response.error) {
        toast.success("Leave application submitted successfully");
        setFormData({ leave_type: "Medical", start_date: "", end_date: "", reason: "" });
        loadLeaves();
      } else {
        toast.error(response.error);
      }
    } catch (error) {
      toast.error("Failed to submit leave application");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Application Form */}
      <Card className="lg:col-span-1 h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5" />
            Apply for Leave
          </CardTitle>
          <CardDescription>Submit a new leave request.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Leave Type</Label>
              <Select
                value={formData.leave_type}
                onValueChange={(v) => setFormData({ ...formData, leave_type: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Medical">Medical</SelectItem>
                  <SelectItem value="Casual">Casual</SelectItem>
                  <SelectItem value="Duty">Duty Leave</SelectItem>
                  <SelectItem value="Emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  required
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                placeholder="Please provide a valid reason..."
                required
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Application
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Leave History */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Leave History
          </CardTitle>
          <CardDescription>Track the status of your leave requests.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    No leave records found.
                  </TableCell>
                </TableRow>
              ) : (
                leaves.map((leave) => (
                  <TableRow key={leave.id}>
                    <TableCell className="font-medium">{leave.leave_type}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(leave.start_date).toLocaleDateString()} -
                      </div>
                      <div className="text-sm">{new Date(leave.end_date).toLocaleDateString()}</div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={leave.reason}>
                      {leave.reason}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          leave.status === "Approved"
                            ? "default"
                            : leave.status === "Rejected"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {leave.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(leave.applied_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
