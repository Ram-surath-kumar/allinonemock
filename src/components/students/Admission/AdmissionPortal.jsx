import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { Loader2, FileText, Award, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { ApplicationForm } from './ApplicationForm';
import { ApplicationStatus } from './ApplicationStatus';
import { MeritListDisplay } from './MeritListDisplay';
import { EntranceExamCard } from './EntranceExamCard';
import { AdmissionProfile } from './AdmissionProfile';
import { useAuth } from '@/contexts/AuthContext';

export function AdmissionPortal() {
    const [activeTab, setActiveTab] = useState('application');
    const [myApplications, setMyApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    const { currentUser } = useAuth();

    const fetchMyApplications = async () => {
        try {
            setLoading(true);
            const response = await api.getAdmissions(); // Fetches all, filter for user below
            if (response.data && currentUser?.email) {
                // Filter applications for the logged-in user
                const userApps = response.data.filter(app => app.email === currentUser.email);
                setMyApplications(userApps);
            } else {
                setMyApplications([]);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load applications");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser) {
            fetchMyApplications();
        } else {
            setLoading(false);
        }
    }, [currentUser]);

    const handleApplicationSubmit = async (formData) => {
        try {
            const response = await api.submitAdmissionApplication(formData);
            if (response.data) {
                toast.success("Application Submitted Successfully!");
                fetchMyApplications();
                setActiveTab('status');
            } else if (response.error) {
                toast.error(response.error);
            }
        } catch (error) {
            toast.error("Submission failed");
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Student Admission Portal</h2>
                <p className="text-muted-foreground">Apply for programs, track status, and view merit lists.</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="profile" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" /> My Profile
                    </TabsTrigger>
                    <TabsTrigger value="application" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Apply Now
                    </TabsTrigger>
                    <TabsTrigger value="status" className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> My Applications
                    </TabsTrigger>
                    <TabsTrigger value="merit" className="flex items-center gap-2">
                        <Award className="h-4 w-4" /> Merit Lists
                    </TabsTrigger>
                    <TabsTrigger value="exams" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> Entrance Exams
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-4">
                    {currentUser?.id ? (
                        <AdmissionProfile userId={currentUser.user_id || currentUser.id} />
                    ) : (
                        <div className="text-center p-10 border rounded-lg">Please log in to view your profile.</div>
                    )}
                </TabsContent>

                <TabsContent value="application" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>New Admission Application</CardTitle>
                            <CardDescription>Fill out the form below to apply for a new course.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ApplicationForm onSubmit={handleApplicationSubmit} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="status">
                    <div className="space-y-4">
                        {loading ? (
                            <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                        ) : myApplications.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {myApplications.map(app => (
                                    <ApplicationStatus key={app.id} application={app} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 border rounded-lg bg-muted/20">
                                <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                                <h3 className="text-lg font-medium">No Applications Found</h3>
                                <p className="text-sm text-muted-foreground mt-1">You haven't applied for any courses yet.</p>
                                <Button variant="link" onClick={() => setActiveTab('application')} className="mt-2">
                                    Start an Application
                                </Button>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="merit">
                    <MeritListDisplay />
                </TabsContent>

                <TabsContent value="exams">
                    <div className="grid gap-4 md:grid-cols-2">
                        <EntranceExamCard
                            title="JEE Main"
                            date="2026-04-15"
                            description="Joint Entrance Examination for B.Tech admission."
                        />
                        <EntranceExamCard
                            title="CAT 2025"
                            date="2025-11-24"
                            description="Common Admission Test for MBA programs."
                        />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
