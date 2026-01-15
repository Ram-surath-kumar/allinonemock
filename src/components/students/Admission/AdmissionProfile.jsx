import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Save, User, MapPin, Contact, HeartPulse, FileText, Users, AlertCircle } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from 'sonner';

export function AdmissionProfile({ userId }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState({
        personal_info: {},
        address_info: { current: {}, permanent: {} },
        guardian_info: { father: {}, mother: {}, guardian: {} },
        emergency_contacts: [],
        medical_history: {},
        documents: {}
    });

    useEffect(() => {
        if (userId) loadProfile();
    }, [userId]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const response = await api.getProfile(userId);
            if (response.data) {
                setProfile(prev => ({ ...prev, ...response.data }));
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const response = await api.updateProfile(userId, profile);
            if (!response.error) {
                toast.success("Profile updated successfully");
            } else {
                toast.error("Failed to update profile");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setSaving(false);
        }
    };

    const updateNested = (section, field, value, subSection = null) => {
        setProfile(prev => {
            if (subSection) {
                return {
                    ...prev,
                    [section]: {
                        ...prev[section],
                        [subSection]: {
                            ...prev[section]?.[subSection],
                            [field]: value
                        }
                    }
                };
            }
            return {
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: value
                }
            };
        });
    };

    if (loading) return <div className="p-10 text-center">Loading profile...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20 border-2">
                        <AvatarImage src={profile.documents?.photo_url} />
                        <AvatarFallback className="text-xl">ST</AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="text-2xl font-bold">{profile.personal_info?.first_name || 'Student Name'}</h2>
                        <p className="text-muted-foreground">{profile.admission_number || 'Admission No: Pending'}</p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : <><Save className="h-4 w-4 mr-2" /> Save Changes</>}
                </Button>
            </div>

            <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-6 h-auto">
                    <TabsTrigger value="personal" className="py-3"><User className="h-4 w-4 mr-2" /> Personal</TabsTrigger>
                    <TabsTrigger value="address" className="py-3"><MapPin className="h-4 w-4 mr-2" /> Address</TabsTrigger>
                    <TabsTrigger value="demographics" className="py-3"><Users className="h-4 w-4 mr-2" /> Demographics</TabsTrigger>
                    <TabsTrigger value="guardian" className="py-3"><Contact className="h-4 w-4 mr-2" /> Family</TabsTrigger>
                    <TabsTrigger value="medical" className="py-3"><HeartPulse className="h-4 w-4 mr-2" /> Medical</TabsTrigger>
                    <TabsTrigger value="documents" className="py-3"><FileText className="h-4 w-4 mr-2" /> Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="personal">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>Basic personal details of the student.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>First Name</Label>
                                <Input
                                    value={profile.personal_info?.first_name || ''}
                                    onChange={e => updateNested('personal_info', 'first_name', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Last Name</Label>
                                <Input
                                    value={profile.personal_info?.last_name || ''}
                                    onChange={e => updateNested('personal_info', 'last_name', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Date of Birth</Label>
                                <Input
                                    type="date"
                                    value={profile.personal_info?.dob || ''}
                                    onChange={e => updateNested('personal_info', 'dob', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Gender</Label>
                                <Input
                                    value={profile.personal_info?.gender || ''}
                                    onChange={e => updateNested('personal_info', 'gender', e.target.value)}
                                    placeholder="Male/Female/Other"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Blood Group</Label>
                                <Input
                                    value={profile.personal_info?.blood_group || ''}
                                    onChange={e => updateNested('personal_info', 'blood_group', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Religion</Label>
                                <Input
                                    value={profile.personal_info?.religion || ''}
                                    onChange={e => updateNested('personal_info', 'religion', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Aadhar Number</Label>
                                <Input
                                    value={profile.personal_info?.aadhar_no || ''}
                                    onChange={e => updateNested('personal_info', 'aadhar_no', e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="address">
                    <Card>
                        <CardHeader><CardTitle>Contact Addresses</CardTitle></CardHeader>
                        <CardContent className="space-y-8">
                            <div className="space-y-4">
                                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Current Address</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <Label>Street Address</Label>
                                        <Textarea
                                            value={profile.address_info?.current?.street || ''}
                                            onChange={e => updateNested('address_info', 'street', e.target.value, 'current')}
                                        />
                                    </div>
                                    <div>
                                        <Label>City</Label>
                                        <Input
                                            value={profile.address_info?.current?.city || ''}
                                            onChange={e => updateNested('address_info', 'city', e.target.value, 'current')}
                                        />
                                    </div>
                                    <div>
                                        <Label>State</Label>
                                        <Input
                                            value={profile.address_info?.current?.state || ''}
                                            onChange={e => updateNested('address_info', 'state', e.target.value, 'current')}
                                        />
                                    </div>
                                    <div>
                                        <Label>Zip Code</Label>
                                        <Input
                                            value={profile.address_info?.current?.zip || ''}
                                            onChange={e => updateNested('address_info', 'zip', e.target.value, 'current')}
                                        />
                                    </div>
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-4">
                                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Permanent Address</h3>
                                <div className="flex items-center space-x-2">
                                    <Label className="text-xs text-muted-foreground">Same as current?</Label>
                                    <Input type="checkbox" className="h-4 w-4" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <Label>Street Address</Label>
                                        <Textarea
                                            value={profile.address_info?.permanent?.street || ''}
                                            onChange={e => updateNested('address_info', 'street', e.target.value, 'permanent')}
                                        />
                                    </div>
                                    <div>
                                        <Label>City</Label>
                                        <Input
                                            value={profile.address_info?.permanent?.city || ''}
                                            onChange={e => updateNested('address_info', 'city', e.target.value, 'permanent')}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="guardian">
                    <Card>
                        <CardHeader><CardTitle>Parent / Guardian Info</CardTitle></CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-4 border p-4 rounded-md">
                                    <h3 className="font-semibold text-primary">Father</h3>
                                    <div className="space-y-2">
                                        <Label>Name</Label>
                                        <Input
                                            value={profile.guardian_info?.father?.name || ''}
                                            onChange={e => updateNested('guardian_info', 'name', e.target.value, 'father')}
                                        />
                                        <Label>Occupation</Label>
                                        <Input
                                            value={profile.guardian_info?.father?.occupation || ''}
                                            onChange={e => updateNested('guardian_info', 'occupation', e.target.value, 'father')}
                                        />
                                        <Label>Phone</Label>
                                        <Input
                                            value={profile.guardian_info?.father?.phone || ''}
                                            onChange={e => updateNested('guardian_info', 'phone', e.target.value, 'father')}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4 border p-4 rounded-md">
                                    <h3 className="font-semibold text-primary">Mother</h3>
                                    <div className="space-y-2">
                                        <Label>Name</Label>
                                        <Input
                                            value={profile.guardian_info?.mother?.name || ''}
                                            onChange={e => updateNested('guardian_info', 'name', e.target.value, 'mother')}
                                        />
                                        <Label>Occupation</Label>
                                        <Input
                                            value={profile.guardian_info?.mother?.occupation || ''}
                                            onChange={e => updateNested('guardian_info', 'occupation', e.target.value, 'mother')}
                                        />
                                        <Label>Phone</Label>
                                        <Input
                                            value={profile.guardian_info?.mother?.phone || ''}
                                            onChange={e => updateNested('guardian_info', 'phone', e.target.value, 'mother')}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="medical">
                    <Card>
                        <CardHeader><CardTitle>Medical History</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Known Allergies</Label>
                                <Textarea
                                    placeholder="List any known allergies..."
                                    value={profile.medical_history?.allergies || ''}
                                    onChange={e => updateNested('medical_history', 'allergies', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Chronic Illnesses</Label>
                                <Textarea
                                    placeholder="List any chronic conditions..."
                                    value={profile.medical_history?.chronic_illness || ''}
                                    onChange={e => updateNested('medical_history', 'chronic_illness', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Emergency Doctor Contact</Label>
                                <Input
                                    placeholder="Dr. Name - Phone"
                                    value={profile.medical_history?.doctor_contact || ''}
                                    onChange={e => updateNested('medical_history', 'doctor_contact', e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="demographics">
                    <Card>
                        <CardHeader><CardTitle>Demographics & Categories</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4 border p-4 rounded-md">
                                    <h3 className="font-semibold text-primary">Student Status</h3>
                                    <div className="space-y-2">
                                        <Label>Enrollment Type</Label>
                                        <Input
                                            placeholder="Regular / Distance / Part-Time"
                                            value={profile.personal_info?.enrollment_status || ''}
                                            onChange={e => updateNested('personal_info', 'enrollment_status', e.target.value)}
                                        />
                                        <Label>Admission Category</Label>
                                        <Input
                                            placeholder="General / OBC / SC / ST"
                                            value={profile.personal_info?.admission_category || ''}
                                            onChange={e => updateNested('personal_info', 'admission_category', e.target.value)}
                                        />
                                        <Label>Nationality</Label>
                                        <Input
                                            value={profile.personal_info?.nationality || ''}
                                            onChange={e => updateNested('personal_info', 'nationality', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4 border p-4 rounded-md">
                                    <h3 className="font-semibold text-primary">Social Status</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label>First Generation Learner</Label>
                                            <Input type="checkbox" className="h-4 w-4"
                                                checked={profile.personal_info?.is_first_generation || false}
                                                onChange={e => updateNested('personal_info', 'is_first_generation', e.target.checked)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label>BPL (Below Poverty Line)</Label>
                                            <Input type="checkbox" className="h-4 w-4"
                                                checked={profile.personal_info?.is_bpl || false}
                                                onChange={e => updateNested('personal_info', 'is_bpl', e.target.checked)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label>PWD (Person with Disability)</Label>
                                            <Input type="checkbox" className="h-4 w-4"
                                                checked={profile.personal_info?.is_pwd || false}
                                                onChange={e => updateNested('personal_info', 'is_pwd', e.target.checked)}
                                            />
                                        </div>
                                        {profile.personal_info?.is_pwd && (
                                            <Input
                                                placeholder="Disability Type"
                                                value={profile.personal_info?.disability_type || ''}
                                                onChange={e => updateNested('personal_info', 'disability_type', e.target.value)}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="documents">
                    <Card>
                        <CardHeader>
                            <CardTitle>Documents</CardTitle>
                            <CardDescription>Upload necessary documents. (Storage integration required)</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="border border-dashed p-6 rounded-lg text-center cursor-pointer hover:bg-muted/50">
                                    <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                                    <span className="text-sm font-medium">Upload Aadhar Card</span>
                                </div>
                                <div className="border border-dashed p-6 rounded-lg text-center cursor-pointer hover:bg-muted/50">
                                    <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                                    <span className="text-sm font-medium">Upload Transfer Certificate</span>
                                </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                <AlertCircle className="inline h-3 w-3 mr-1" />
                                Documents are stored securely and accessible only to authorized personnel.
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
