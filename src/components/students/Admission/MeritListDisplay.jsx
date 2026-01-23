import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { api } from "@/services/api";

export function MeritListDisplay() {
  const [lists, setLists] = useState([]);

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    try {
      const response = await api.getMeritLists();
      if (response.data) setLists(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-4">
      {lists.length === 0 ? (
        <div className="text-center py-10 border border-dashed rounded-lg">
          <p className="text-muted-foreground">No merit lists have been published yet.</p>
        </div>
      ) : (
        lists.map((list) => (
          <Card key={list.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg">{list.name}</CardTitle>
                <CardDescription>
                  Academic Year: {list.academic_year} | Cut-off:{" "}
                  <span className="font-semibold text-primary">{list.cut_off_score}</span>
                </CardDescription>
              </div>
              <Badge variant={list.status === "published" ? "default" : "secondary"}>
                {list.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center text-sm">
                <div className="space-x-4 text-muted-foreground">
                  <span>Round: {list.round_number}</span>
                  <span>Category: {list.category || "General"}</span>
                  <span>Published: {new Date(list.created_at).toLocaleDateString()}</span>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" /> Download List
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
