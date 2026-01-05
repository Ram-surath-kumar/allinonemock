import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/services/api";
import { toast } from "sonner";
import { Loader2, Ticket, Printer } from "lucide-react";
import { HallTicketView } from "./HallTicketView";

interface HallTicketGeneratorProps {
    exams: any[];
}

export function HallTicketGenerator({ exams }: HallTicketGeneratorProps) {
    const [selectedExamId, setSelectedExamId] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [tickets, setTickets] = useState<any[]>([]);
    const [viewTicket, setViewTicket] = useState<any>(null);
    const [viewOpen, setViewOpen] = useState(false);

    useEffect(() => {
        if (selectedExamId) {
            fetchTickets();
        } else {
            setTickets([]);
        }
    }, [selectedExamId]);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const response = await api.getHallTickets(selectedExamId);
            if (response.data) {
                setTickets(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch tickets", error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!selectedExamId) return;
        setGenerating(true);
        try {
            const response = await api.generateHallTickets(selectedExamId);
            if (response.error) throw new Error(response.error);

            toast.success("Hall tickets generated successfully");
            fetchTickets();
        } catch (error: any) {
            toast.error(error.message || "Failed to generate tickets");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <Card className="shad-card">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Hall Ticket Management</CardTitle>
                <div className="flex items-center gap-4">
                    <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                        <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="Select an Exam" />
                        </SelectTrigger>
                        <SelectContent>
                            {exams.map((exam) => (
                                <SelectItem key={exam.id} value={exam.id}>
                                    {exam.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {selectedExamId && (
                        <Button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="shad-button-primary"
                        >
                            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ticket className="mr-2 h-4 w-4" />}
                            Generate All
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {!selectedExamId ? (
                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                        <Ticket className="mx-auto h-12 w-12 opacity-20 mb-3" />
                        <p>Select an exam above to manage hall tickets</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-medium text-muted-foreground">
                                Generated Tickets: {tickets.length}
                            </h3>
                            {tickets.length > 0 && (
                                <Button variant="outline" size="sm">
                                    <Printer className="mr-2 h-4 w-4" /> Print Batch
                                </Button>
                            )}
                        </div>

                        {loading ? (
                            <div className="text-center py-8">Loading tickets...</div>
                        ) : tickets.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                                No hall tickets generated yet. Click "Generate All" to create them.
                            </div>
                        ) : (
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Student ID</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Generated At</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tickets.map((ticket) => (
                                            <TableRow key={ticket.id}>
                                                <TableCell className="font-medium">{ticket.student_id ? ticket.student_id.substring(0, 8) + '...' : 'Unknown'}</TableCell>
                                                <TableCell>
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        {ticket.status}
                                                    </span>
                                                </TableCell>
                                                <TableCell>{ticket.generated_at ? new Date(ticket.generated_at).toLocaleDateString() : '-'}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => {
                                                        setViewTicket(ticket);
                                                        setViewOpen(true);
                                                    }}>View</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
            <HallTicketView
                open={viewOpen}
                onOpenChange={setViewOpen}
                ticket={viewTicket}
                examName={exams.find(e => e.id === selectedExamId)?.name}
            />
        </Card>
    );
}
