import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AdmissionProfile } from '@/components/students/Admission/AdmissionProfile';
import { Card, CardContent } from '@/components/ui/card';

export function Admissions() {
    const { currentUser } = useAuth();

    return (
        <div className="container mx-auto p-4 lg:p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admissions</h1>
                    <p className="text-muted-foreground">Manage personal details, documents, and admission records.</p>
                </div>
            </div>

            <Card className="border-none shadow-none bg-transparent">
                <CardContent className="p-0">
                    {currentUser?.id ? (
                        <AdmissionProfile userId={currentUser.user_id || currentUser.id} />
                    ) : (
                        <div className="text-center p-10 border rounded-lg bg-card">
                            <p>Please log in to view academic profile.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default Admissions;
