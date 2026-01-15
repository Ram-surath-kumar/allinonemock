import { useState, useEffect } from 'react';
import { User, Calendar, MapPin, Phone, Heart, Users, CreditCard, Mail, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { DatePicker } from '@/components/ui/date-picker';

export function StudentProfileView({ student, onBack }) {
    const [activeTab, setActiveTab] = useState('personal');
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState({});
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
            } else {
                setProfile({});
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

            // Sanitize data before saving (remove nulls or convert types if needed)
            const sanitizedProfile = { ...profile };
            delete sanitizedProfile.id; // Don't send internal PK
            delete sanitizedProfile.created_at;
            delete sanitizedProfile.updated_at;

            // Ensure numeric
            if (sanitizedProfile.family_annual_income) {
                sanitizedProfile.family_annual_income = Number(sanitizedProfile.family_annual_income);
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



    const renderInput = (label, field, type = 'text', placeholder = '') => (
        <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">{label}</label>
            {isEditing ? (
                type === 'date' ? (
                    <DatePicker
                        date={profile[field]}
                        setDate={(d) => handleChange(field, d)}
                        placeholder={placeholder || "Select date"}
                    />
                ) : (
                    <Input
                        type={type}
                        value={profile[field] || ''}
                        onChange={e => handleChange(field, e.target.value)}
                        placeholder={placeholder}
                    />
                )
            ) : (
                <p className="font-medium text-sm border p-2 rounded-md bg-muted/20 min-h-[40px] flex items-center">
                    {profile[field] || <span className="text-muted-foreground italic text-xs">Not provided</span>}
                </p>
            )}
        </div>
    );

    const renderSectionHeader = (icon, title) => (
        <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
                {icon} {title}
            </CardTitle>
        </CardHeader>
    );

    if (!profile && loading) return <div className="p-8 text-center">Loading profile...</div>;

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6 sticky top-0 bg-background/95 backdrop-blur z-10 py-4 border-b">
                <Button variant="outline" size="sm" onClick={onBack}>&larr; Back</Button>
                <div>
                    <h2 className="text-2xl font-bold">{student.name}</h2>
                    <p className="text-muted-foreground text-sm flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold">{student.role?.toUpperCase()}</span>
                        <span>{student.email}</span>
                        <span>•</span>
                        <span>{student.department}</span>
                    </p>
                </div>
                <div className="ml-auto">
                    {!isEditing ? (
                        <Button onClick={() => setIsEditing(true)}>Edit Details</Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => { setIsEditing(false); fetchProfile(); }}>Cancel</Button>
                            <Button onClick={handleSave} disabled={loading}>Save Changes</Button>
                        </div>
                    )}
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto">
                    <TabsTrigger value="personal">Personal & Identity</TabsTrigger>
                    <TabsTrigger value="academic">Academic</TabsTrigger>
                    <TabsTrigger value="contact">Contact & Address</TabsTrigger>
                    <TabsTrigger value="family">Family</TabsTrigger>
                    <TabsTrigger value="health">Health & Emergency</TabsTrigger>
                </TabsList>

                {/* 1. PERSONAL & IDENTITY */}
                <TabsContent value="personal" className="mt-6 space-y-6">
                    <Card>
                        {renderSectionHeader(<User className="h-5 w-5" />, "Personal Information")}
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {renderInput("Date of Birth", "dob", "date")}
                            {renderInput("Gender", "gender")}
                            {renderInput("Blood Group", "blood_group")}
                            {renderInput("Religion", "religion")}
                            {renderInput("Community / Category", "category")}
                            {renderInput("Nationality", "nationality")}
                            {renderInput("Mother Tongue", "mother_tongue")}
                            {renderInput("Aadhaar Number", "aadhar_no")}
                            {renderInput("PAN Number", "pan_no")}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 2. ACADEMIC */}
                <TabsContent value="academic" className="mt-6 space-y-6">
                    <Card>
                        {renderSectionHeader(<GraduationCap className="h-5 w-5" />, "Academic Record")}
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {renderInput("Student ID (Auto-Generated)", "student_id_no")}
                            {renderInput("College Email (Auto-Generated)", "college_email")}
                            {renderInput("Section", "section")}
                            {renderInput("Enrollment Date", "enrollment_date", "date")}
                        </CardContent>
                    </Card>
                    <AcademicTab userId={student.id} />
                </TabsContent>

                {/* 3. CONTACT & ADDRESS */}
                <TabsContent value="contact" className="mt-6 space-y-6">
                    <Card>
                        {renderSectionHeader(<Phone className="h-5 w-5" />, "Contact Details")}
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {renderInput("Personal Mobile", "personal_mobile")}
                            {renderInput("Alternative Mobile", "alt_mobile")}
                            {renderInput("Landline", "landline_phone")}
                            {renderInput("Personal Email", "personal_email")}
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            {renderSectionHeader(<MapPin className="h-5 w-5" />, "Current Address")}
                            <CardContent className="space-y-4">
                                {renderInput("Street / Area", "current_street")}
                                {renderInput("City", "current_city")}
                                {renderInput("State", "current_state")}
                                {renderInput("Pincode", "current_pincode")}
                                {renderInput("Country", "current_country")}
                            </CardContent>
                        </Card>
                        <Card>
                            {renderSectionHeader(<MapPin className="h-5 w-5" />, "Permanent Address")}
                            <CardContent className="space-y-4">
                                {renderInput("Street / Area", "permanent_street")}
                                {renderInput("City", "permanent_city")}
                                {renderInput("State", "permanent_state")}
                                {renderInput("Pincode", "permanent_pincode")}
                                {renderInput("Country", "permanent_country")}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* 4. FAMILY */}
                <TabsContent value="family" className="mt-6 space-y-6">
                    <Card>
                        {renderSectionHeader(<Users className="h-5 w-5" />, "Family Information")}
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {renderInput("Father's Name", "father_name")}
                            {renderInput("Father's Occupation", "father_occupation")}
                            {renderInput("Mother's Name", "mother_name")}
                            {renderInput("Mother's Occupation", "mother_occupation")}
                            {renderInput("Annual Family Income", "family_annual_income", "number")}
                            {renderInput("Siblings Count", "siblings_count", "number")}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 5. HEALTH & EMERGENCY */}
                <TabsContent value="health" className="mt-6 space-y-6">
                    <Card>
                        {renderSectionHeader(<Phone className="h-5 w-5" />, "Emergency Contact")}
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {renderInput("Contact Name", "emergency_contact_name")}
                            {renderInput("Relationship", "emergency_contact_relation")}
                            {renderInput("Contact Number", "emergency_contact_number")}
                            {renderInput("Address", "emergency_contact_address")}
                        </CardContent>
                    </Card>

                    <Card>
                        {renderSectionHeader(<Heart className="h-5 w-5" />, "Medical Information")}
                        <CardContent>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Medical History</label>
                                {isEditing ? (
                                    <Textarea
                                        value={profile.medical_history || ''}
                                        onChange={e => handleChange('medical_history', e.target.value)}
                                        rows={4}
                                    />
                                ) : (
                                    <p className="p-3 bg-muted/20 rounded-md text-sm">{profile.medical_history || 'No medical history recorded.'}</p>
                                )}
                            </div>
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
