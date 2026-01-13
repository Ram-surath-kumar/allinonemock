import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { api } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTheme } from 'next-themes';
import { Bell, Lock, Shield, Settings as SettingsIcon, Users, User, Moon, Sun, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import { ProfileSettings } from './ProfileSettings';
import { TeamSettings } from './TeamSettings';

const AppearanceSettings = () => {
    const { theme, setTheme } = useTheme();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the look and feel of the application</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <Label>Theme</Label>
                        <p className="text-sm text-muted-foreground">Select your preferred theme</p>
                    </div>
                    <div className="flex gap-2 p-1 bg-muted rounded-lg">
                        <Button
                            variant={theme === 'light' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setTheme('light')}
                            className="w-8 h-8 p-0"
                        >
                            <Sun className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={theme === 'dark' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setTheme('dark')}
                            className="w-8 h-8 p-0"
                        >
                            <Moon className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={theme === 'system' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setTheme('system')}
                            className="w-8 h-8 p-0"
                        >
                            <Monitor className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const NotificationSettings = () => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage your notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-muted-foreground" />
                        <div className="space-y-0.5">
                            <Label>Email Notifications</Label>
                            <p className="text-sm text-muted-foreground">Receive emails about important updates</p>
                        </div>
                    </div>
                    <Switch defaultChecked />
                </div>
            </CardContent>
        </Card>
    );
};

const SecuritySettings = () => {
    const [loading, setLoading] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters long");
            return;
        }

        setLoading(true);

        try {
            // Update password using Supabase Auth
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            toast.success("Password updated successfully");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            console.error('Error updating password:', error);
            toast.error(error.message || "Failed to update password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Manage your password and account security</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password (optional for logged in users)</Label>
                        <Input
                            id="current-password"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                            id="new-password"
                            type="password"
                            required
                            validations={{
                                required: "Password is required",
                                minLength: {
                                    value: 6,
                                    message: "Password must have at least 6 characters"
                                }
                            }}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input
                            id="confirm-password"
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                        />
                    </div>
                    <Button type="submit" disabled={loading}>
                        {loading ? "Updating..." : "Update Password"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

const SystemSettings = ({ currentUser }) => {
    const [orgName, setOrgName] = useState(currentUser?.organization?.org_name || "");
    const [loading, setLoading] = useState(false);

    const handleOrgUpdate = async () => {
        if (!orgName.trim()) {
            toast.error("Organization name cannot be empty");
            return;
        }

        if (!currentUser?.organization?.id) {
            toast.error("Organization ID not found");
            return;
        }

        setLoading(true);
        try {
            const response = await api.updateOrganization(currentUser.organization.id, {
                org_name: orgName
            });

            if (response.error) throw new Error(response.error);

            toast.success("Organization details updated successfully");
            // Ideally refetch user/org data here or update context
        } catch (error) {
            console.error("Error updating organization:", error);
            toast.error(error.message || "Failed to update organization details");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Organization Details</CardTitle>
                    <CardDescription>Manage organization information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Organization Name</Label>
                        <Input
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                            placeholder="Enter organization name"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Organization Code</Label>
                        <Input
                            value={currentUser?.organization?.org_code || ""}
                            disabled
                            className="bg-muted"
                        />
                    </div>
                    <Button onClick={handleOrgUpdate} disabled={loading}>
                        {loading ? "Saving..." : "Save Changes"}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>System Information</CardTitle>
                    <CardDescription>Version and maintenance details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-muted/50">
                            <p className="text-sm font-medium text-muted-foreground">Version</p>
                            <p className="text-lg font-semibold">1.0.0</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50">
                            <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                            <p className="text-lg font-semibold">{new Date().toLocaleDateString()}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export const Settings = () => {
    const { currentUser } = useAuth();
    const isAdmin = currentUser?.role === 'admin';
    const isStudent = currentUser?.role === 'student';

    return (
        <div className="container mx-auto max-w-5xl py-6 space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your account settings and preferences.
                </p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="min-w-0 w-auto inline-flex h-9 items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground">
                    <TabsTrigger value="profile" className="flex items-center gap-2 px-4">
                        <User className="h-4 w-4" />
                        Profile
                    </TabsTrigger>

                    {/* Only non-students can see the Team tab */}
                    {!isStudent && (
                        <TabsTrigger value="team" className="flex items-center gap-2 px-4">
                            <Users className="h-4 w-4" />
                            Team
                        </TabsTrigger>
                    )}

                    <TabsTrigger value="security" className="flex items-center gap-2 px-4">
                        <Lock className="h-4 w-4" />
                        Security
                    </TabsTrigger>

                    {isAdmin && (
                        <TabsTrigger value="system" className="flex items-center gap-2 px-4">
                            <Shield className="h-4 w-4" />
                            System
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="profile" className="space-y-6">
                    <ProfileSettings currentUser={currentUser} />
                    <AppearanceSettings />
                    <NotificationSettings />
                </TabsContent>

                {!isStudent && (
                    <TabsContent value="team">
                        <TeamSettings currentUser={currentUser} />
                    </TabsContent>
                )}

                <TabsContent value="security">
                    <SecuritySettings />
                </TabsContent>

                {isAdmin && (
                    <TabsContent value="system">
                        <SystemSettings currentUser={currentUser} />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
};
