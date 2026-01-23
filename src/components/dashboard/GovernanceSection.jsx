import { Briefcase, ShieldCheck, FileText, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function GovernanceSection({ stats }) {
  const placements = stats?.placements || { totalOffers: 0, avgPackage: 0, highestPackage: 0 };
  const compliance = stats?.compliance || { compliant: 0, nonCompliant: 0, pending: 0 };
  const pendingApprovals = stats?.pendingApprovals || 0;
  const systemVersion = stats?.systemVersion || "v1.0.0";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Placements Widget */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Placements</CardTitle>
          <Briefcase className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{placements.totalOffers}</div>
          <p className="text-xs text-muted-foreground">Offers Received</p>
          <div className="mt-2 text-xs flex justify-between">
            <span>Avg: {placements.avgPackage} LPA</span>
            <span>Max: {placements.highestPackage} LPA</span>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Widget */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Compliance</CardTitle>
          <ShieldCheck
            className={cn(
              "h-4 w-4",
              compliance.nonCompliant > 0 ? "text-destructive" : "text-green-500"
            )}
          />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-green-600">{compliance.compliant}</span>
              <span className="text-[10px] text-muted-foreground">OK</span>
            </div>
            <div className="h-8 w-px bg-border"></div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-destructive">{compliance.nonCompliant}</span>
              <span className="text-[10px] text-muted-foreground">Issues</span>
            </div>
            <div className="h-8 w-px bg-border"></div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-yellow-600">{compliance.pending}</span>
              <span className="text-[10px] text-muted-foreground">Pending</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approvals Widget */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingApprovals}</div>
          <p className="text-xs text-muted-foreground">Requests awaiting action</p>
          <div className="mt-2 w-full bg-secondary h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-orange-500 h-full rounded-full"
              style={{ width: pendingApprovals > 0 ? "50%" : "0%" }}
            ></div>
          </div>
        </CardContent>
      </Card>

      {/* System Status Widget */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">System Status</CardTitle>
          <Activity className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">Active</div>
          <p className="text-xs text-muted-foreground">Version: {systemVersion}</p>
          <div className="mt-2 text-xs text-muted-foreground">Next backup in 2h</div>
        </CardContent>
      </Card>
    </div>
  );
}
