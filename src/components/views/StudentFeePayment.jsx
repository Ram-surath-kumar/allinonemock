import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Home, Bus, School, Check, AlertCircle } from "lucide-react";
import { api } from "@/services/api";

export function StudentFeePayment() {
    // Mock data for the 3 required fee types
    // In a real app, this would come from an API like await api.getStudentFees(studentId)
    const [fees, setFees] = useState([
        {
            id: "college",
            title: "College Fee",
            description: "Tuition and Academic Fees",
            amount: 45000,
            dueDate: "2024-04-15",
            status: "pending", // pending, paid, overdue
            icon: School,
        },
        {
            id: "hostel",
            title: "Hostel Fee",
            description: "Room and Boarding Charges",
            amount: 22000,
            dueDate: "2024-04-10",
            status: "paid",
            icon: Home,
        },
        {
            id: "transport",
            title: "Transport Fee",
            description: "Bus Route #12 Charges",
            amount: 8500,
            dueDate: "2024-04-05",
            status: "overdue",
            icon: Bus,
        },
    ]);

    const handlePay = (id) => {
        // Mock payment logic
        console.log(`Paying fee: ${id}`);
        // You could confirm and then set status to 'paid' optimistically
        setFees(fees.map(f => f.id === id ? { ...f, status: "paid" } : f));
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "paid": return "bg-green-100 text-green-700 hover:bg-green-200";
            case "overdue": return "bg-red-100 text-red-700 hover:bg-red-200";
            default: return "bg-yellow-100 text-yellow-700 hover:bg-yellow-200";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "paid": return <Check className="h-4 w-4 mr-1" />;
            case "overdue": return <AlertCircle className="h-4 w-4 mr-1" />;
            default: return <ClockIcon className="h-4 w-4 mr-1" />;
        }
    };

    // Helper for currency format
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {fees.map((fee) => (
                    <Card key={fee.id} className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div className={`p-2 rounded-full ${fee.status === 'paid' ? 'bg-green-100' : 'bg-primary/10'}`}>
                                    <fee.icon className={`h-6 w-6 ${fee.status === 'paid' ? 'text-green-600' : 'text-primary'}`} />
                                </div>
                                <Badge variant="outline" className={getStatusColor(fee.status)}>
                                    {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                                </Badge>
                            </div>
                            <CardTitle className="mt-4 text-xl">{fee.title}</CardTitle>
                            <CardDescription>{fee.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1 mt-2">
                                <p className="text-3xl font-bold">{formatCurrency(fee.amount)}</p>
                                <p className="text-sm text-muted-foreground">Due: {new Date(fee.dueDate).toLocaleDateString()}</p>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full"
                                variant={fee.status === 'paid' ? "outline" : "default"}
                                disabled={fee.status === 'paid'}
                                onClick={() => handlePay(fee.id)}
                            >
                                {fee.status === 'paid' ? (
                                    <>
                                        <Check className="mr-2 h-4 w-4" /> Paid
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="mr-2 h-4 w-4" /> Pay Now
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {/* Payment History Helper (Optional) */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Payment History</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Recent transactions will appear here.</p>
                </CardContent>
            </Card>
        </div>
    );
}

function ClockIcon(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}
