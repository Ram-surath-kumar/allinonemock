import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export function ApplicationForm({ onSubmit }) {
    const [formData, setFormData] = useState({
        applicant_name: '',
        email: '',
        phone: '',
        course_applied: '',
        dob: '',
        academic_year: '2025-2026',
        // Detailed Categories
        gender: '',
        nationality: 'Indian',
        student_status: 'Regular',
        category: 'General',
        is_first_generation_learner: false,
        is_bpl: false,
        is_minority: false,
        minority_type: '',
        is_pwd: false,
        pwd_type: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="applicant_name">Full Name (as per Grade 12)</Label>
                    <Input
                        id="applicant_name"
                        value={formData.applicant_name}
                        onChange={e => setFormData({ ...formData, applicant_name: e.target.value })}
                        required
                        placeholder="John Doe"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                        id="dob"
                        type="date"
                        value={formData.dob}
                        onChange={e => setFormData({ ...formData, dob: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        required
                        placeholder="john@example.com"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                        id="phone"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 99999 99999"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="course">Program Applying For</Label>
                <Select onValueChange={v => setFormData({ ...formData, course_applied: v })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Program" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="B.Tech Computer Science">B.Tech Computer Science (4 Years)</SelectItem>
                        <SelectItem value="B.Tech Electronics">B.Tech Electronics (4 Years)</SelectItem>
                        <SelectItem value="BBA">Bachelor of Business Administration (3 Years)</SelectItem>
                        <SelectItem value="MBA">Master of Business Administration (2 Years)</SelectItem>
                        <SelectItem value="M.Tech Data Science">M.Tech Data Science (2 Years)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Detailed Categories Section */}
            <div className="border rounded-lg p-4 bg-muted/20 space-y-4">
                <h3 className="font-semibold text-sm">Detailed Category Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Gender</Label>
                        <Select onValueChange={v => setFormData({ ...formData, gender: v })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Gender" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Nationality</Label>
                        <Select onValueChange={v => setFormData({ ...formData, nationality: v })} defaultValue="Indian">
                            <SelectTrigger>
                                <SelectValue placeholder="Select Nationality" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Indian">Indian National</SelectItem>
                                <SelectItem value="NRI">NRI (Non-Resident Indian)</SelectItem>
                                <SelectItem value="OCI">OCI (Overseas Citizen of India)</SelectItem>
                                <SelectItem value="Foreign">Foreign National</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Reservation Category</Label>
                        <Select onValueChange={v => setFormData({ ...formData, category: v })} defaultValue="General">
                            <SelectTrigger>
                                <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="General">General</SelectItem>
                                <SelectItem value="OBC">OBC</SelectItem>
                                <SelectItem value="SC">SC</SelectItem>
                                <SelectItem value="ST">ST</SelectItem>
                                <SelectItem value="EWS">EWS</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Student Status</Label>
                        <Select onValueChange={v => setFormData({ ...formData, student_status: v })} defaultValue="Regular">
                            <SelectTrigger>
                                <SelectValue placeholder="Select Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Regular">Regular (Full-time)</SelectItem>
                                <SelectItem value="Distance">Distance Learning</SelectItem>
                                <SelectItem value="Part-Time">Part-Time</SelectItem>
                                <SelectItem value="Sponsored">Sponsored Student</SelectItem>
                                <SelectItem value="Research Scholar">Research Scholar</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="firstgen"
                            className="h-4 w-4 rounded border-gray-300"
                            checked={formData.is_first_generation_learner}
                            onChange={e => setFormData({ ...formData, is_first_generation_learner: e.target.checked })}
                        />
                        <Label htmlFor="firstgen">First Generation Learner</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="bpl"
                            className="h-4 w-4 rounded border-gray-300"
                            checked={formData.is_bpl}
                            onChange={e => setFormData({ ...formData, is_bpl: e.target.checked })}
                        />
                        <Label htmlFor="bpl">Below Poverty Line (BPL)</Label>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="minority"
                                className="h-4 w-4 rounded border-gray-300"
                                checked={formData.is_minority}
                                onChange={e => setFormData({ ...formData, is_minority: e.target.checked })}
                            />
                            <Label htmlFor="minority">Minority Category</Label>
                        </div>
                        {formData.is_minority && (
                            <Input
                                placeholder="Type (e.g., Linguistic, Religious)"
                                value={formData.minority_type}
                                onChange={e => setFormData({ ...formData, minority_type: e.target.value })}
                                className="h-8 text-sm"
                            />
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="pwd"
                                className="h-4 w-4 rounded border-gray-300"
                                checked={formData.is_pwd}
                                onChange={e => setFormData({ ...formData, is_pwd: e.target.checked })}
                            />
                            <Label htmlFor="pwd">Person with Disability (PWD)</Label>
                        </div>
                        {formData.is_pwd && (
                            <Input
                                placeholder="Type of Disability"
                                value={formData.pwd_type}
                                onChange={e => setFormData({ ...formData, pwd_type: e.target.value })}
                                className="h-8 text-sm"
                            />
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit" size="lg">Submit Application</Button>
            </div>
        </form>
    );
}
