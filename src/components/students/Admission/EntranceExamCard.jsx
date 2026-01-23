import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin } from "lucide-react";

export function EntranceExamCard({ title, date, description }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="flex items-center gap-2 mt-1">
          <CalendarDays className="h-4 w-4" />{" "}
          {new Date(date).toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground/80">{description}</p>
        <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" /> Online / Verified Centers
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="secondary" className="w-full">
          View Syllabus
        </Button>
      </CardFooter>
    </Card>
  );
}
