import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface HallTicketViewProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ticket: any;
    examName?: string;
}

export function HallTicketView({ open, onOpenChange, ticket, examName }: HallTicketViewProps) {
    if (!ticket) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[600px] bg-white text-black">
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl font-bold border-b pb-4">
                        HALL TICKET
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Header Details */}
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500">Candidate Name</p>
                            <p className="font-bold text-lg">Student #{ticket.student_id ? ticket.student_id.substring(0, 6) : 'Unknown'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Roll Number</p>
                            <p className="font-mono font-bold">{ticket.student_id ? ticket.student_id.substring(0, 8).toUpperCase() : '-'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-y py-4 my-4">
                        <div>
                            <p className="text-sm text-gray-500">Examination</p>
                            <p className="font-semibold">{examName || 'Upcoming Examination'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Center</p>
                            <p className="font-semibold">Main Campus, Block A</p>
                        </div>
                    </div>

                    {/* Timetable Placeholder */}
                    <div>
                        <h4 className="font-bold mb-2 text-sm uppercase tracking-wider text-gray-500">Exam Schedule</h4>
                        <div className="border rounded-md overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Date</th>
                                        <th className="px-4 py-2 text-left">Subject</th>
                                        <th className="px-4 py-2 text-right">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    <tr>
                                        <td className="px-4 py-2">--/--/----</td>
                                        <td className="px-4 py-2">Mathematics I</td>
                                        <td className="px-4 py-2 text-right">10:00 AM</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2">--/--/----</td>
                                        <td className="px-4 py-2">Physics</td>
                                        <td className="px-4 py-2 text-right">10:00 AM</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-md text-xs text-yellow-800 border border-yellow-100">
                        <strong>Instructions:</strong>
                        <ul className="list-disc pl-4 mt-1 space-y-1">
                            <li>Candidates must present this hall ticket for entry.</li>
                            <li>Electronic gadgets are strictly prohibited.</li>
                            <li>Report 30 minutes before the scheduled time.</li>
                        </ul>
                    </div>
                </div>

                <DialogFooter className="sm:justify-between items-center border-t pt-4">
                    <p className="text-xs text-muted-foreground">Generated on: {new Date().toLocaleDateString()}</p>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                        <Button onClick={() => window.print()} className="gap-2">
                            <Printer className="h-4 w-4" /> Print
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
