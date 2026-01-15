import { useState, useEffect } from 'react';
import { User, Calendar, MapPin, Phone, Heart, Users, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { StudentAcademics } from './Profile/StudentAcademics';

export function StudentProfileView({ student, onBack }) {
    const [activeTab, setActiveTab] = useState('personal');
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (student?.id) {
            fetchProfile();
        }
    }, [student]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/sim/profiles/${student.id}`);
            const result = await response.json();
            if (result.data && !result.error) {
                setProfile(result.data);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Failed to load detailed profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);

            // Sanitize data before saving
            const sanitizedProfile = { ...profile };
            delete sanitizedProfile.id; // Don't send the internal primary key

            if (sanitizedProfile.family_income === '') {
                sanitizedProfile.family_income = null;
            } else if (sanitizedProfile.family_income !== undefined && sanitizedProfile.family_income !== null) {
                sanitizedProfile.family_income = Number(sanitizedProfile.family_income);
            }

            if (sanitizedProfile.dob === '') {
                sanitizedProfile.dob = null;
            }

            const dataToSave = {
                ...sanitizedProfile,
                user_id: student.id
            };

            const response = await fetch(`${import.meta.env.VITE_API_URL}/sim/profiles/${student.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSave)
            });

            const result = await response.json();
            if (!result.error) {
                toast.success('Profile updated successfully');
                setIsEditing(false);
                setProfile(result.data);
            } else {
                throw new Error(result.error || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setProfile(prev => ({ ...prev, [field]: value }));
    };

    if (!profile && loading) return <div className="p-8 text-center">Loading profile...</div>;

    const displayProfile = profile || {};

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" onClick={onBack}>&larr; Back</Button>
                <div>
                    <h2 className="text-2xl font-bold">{student.name}</h2>
                    <p className="text-muted-foreground">{student.email} • {student.department}</p>
                </div>
                <div className="ml-auto">
                    {!isEditing ? (
                        <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                            <Button onClick={handleSave} disabled={loading}>Save Changes</Button>
                        </div>
                    )}
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
                    <TabsTrigger value="personal">Personal</TabsTrigger>
                    <TabsTrigger value="academic">Academic</TabsTrigger>
                    <TabsTrigger value="health">Health & Emergency</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Basic Info</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Date of Birth</label>
                                <Input
                                    type="date"
                                    value={displayProfile.dob || ''}
                                    onChange={e => handleChange('dob', e.target.value)}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Gender</label>
                                <Input
                                    value={displayProfile.gender || ''}
                                    onChange={e => handleChange('gender', e.target.value)}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Aadhar No</label>
                                <Input
                                    value={displayProfile.aadhar_no || ''}
                                    onChange={e => handleChange('aadhar_no', e.target.value)}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Family Income</label>
                                <Input
                                    type="number"
                                    value={displayProfile.family_income || ''}
                                    onChange={e => handleChange('family_income', e.target.value)}
                                    disabled={!isEditing}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Address</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Current Address</label>
                                <Textarea
                                    value={displayProfile.address_current || ''}
                                    onChange={e => handleChange('address_current', e.target.value)}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Permanent Address</label>
                                <Textarea
                                    value={displayProfile.address_permanent || ''}
                                    onChange={e => handleChange('address_permanent', e.target.value)}
                                    disabled={!isEditing}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Guardian Info</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Guardian Name</label>
                                <Input
                                    value={displayProfile.guardian_name || ''}
                                    onChange={e => handleChange('guardian_name', e.target.value)}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Relationship</label>
                                <Input
                                    value={displayProfile.guardian_relation || ''}
                                    onChange={e => handleChange('guardian_relation', e.target.value)}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Contact Number</label>
                                <Input
                                    value={displayProfile.guardian_contact || ''}
                                    onChange={e => handleChange('guardian_contact', e.target.value)}
                                    disabled={!isEditing}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="academic" className="mt-4 space-y-4">
                    <StudentAcademics userId={student.id} />
                </TabsContent>

                <TabsContent value="health" className="mt-4 space-y-4">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5" /> Medical Info</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Blood Group</label>
                                <Input
                                    value={displayProfile.blood_group || ''}
                                    onChange={e => handleChange('blood_group', e.target.value)}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium">Medical History / Allergies</label>
                                <Textarea
                                    value={displayProfile.medical_history || ''}
                                    onChange={e => handleChange('medical_history', e.target.value)}
                                    disabled={!isEditing}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5" /> Emergency Contact</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Name</label>
                                <Input
                                    value={displayProfile.emergency_contact_name || ''}
                                    onChange={e => handleChange('emergency_contact_name', e.target.value)}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Phone</label>
                                <Input
                                    value={displayProfile.emergency_contact_number || ''}
                                    onChange={e => handleChange('emergency_contact_number', e.target.value)}
                                    disabled={!isEditing}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="documents" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Document upload and management (Coming Soon)</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function AcademicTab({ userId }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) fetchAcademicData();
    }, [userId]);

    const fetchAcademicData = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/sim/academic/${userId}`);
            const result = await response.json();
            if (result.data && !result.error) {
                setData(result.data);
            }
        } catch (error) {
            console.error('Failed academic fetch', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-4 text-center text-muted-foreground">Loading academic records...</div>;

    const record = data?.academic_record || {};
    const enrollments = data?.enrollments || [];

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Current Semester</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{record.semester || 'N/A'}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Cumulative GPA</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{record.gpa ? record.gpa.toFixed(2) : '-'}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Credits Earned</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{record.credits_earned || 0}</div></CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Current Enrollments</CardTitle></CardHeader>
                <CardContent>
                    {enrollments.length > 0 ? (
                        <div className="space-y-2">
                            {enrollments.map((enr, i) => (
                                <div key={i} className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50">
                                    <div>
                                        <div className="font-semibold">{enr.course_code}</div>
                                        <div className="text-sm text-muted-foreground">{enr.course_name}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-medium">{enr.credits} Credits</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm italic">No active enrollments found for this semester.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
