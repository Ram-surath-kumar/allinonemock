import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Lock, ShieldCheck, Building2, Trash2, Plus, LogOut } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Organization {
    id: number;
    org_name: string;
    org_code: string;
    org_id: string;
}

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Dashboard State
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(false);
    const [newOrgName, setNewOrgName] = useState('');
    const [newOrgCode, setNewOrgCode] = useState('');
    const [newOrgId, setNewOrgId] = useState('');
    const [orgToDelete, setOrgToDelete] = useState<number | null>(null);

    useEffect(() => {
        const session = sessionStorage.getItem('super_admin_session');
        if (session === 'true') {
            setIsAuthenticated(true);
            fetchOrgs();
        }
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (username === 'UNFOUNDED' && password === 'ZIGGERS') {
            setIsAuthenticated(true);
            sessionStorage.setItem('super_admin_session', 'true');
            setError('');
            fetchOrgs();
        } else {
            setError('Invalid credentials');
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        sessionStorage.removeItem('super_admin_session');
        setUsername('');
        setPassword('');
    };

    const fetchOrgs = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .order('id', { ascending: true });

        if (error) {
            console.error('Error fetching orgs:', error);
        } else {
            setOrgs(data || []);
        }
        setLoading(false);
    };

    const handleAddOrg = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newOrgName || !newOrgCode || !newOrgId) return;

        const { error } = await supabase
            .from('organizations')
            .insert([{ org_name: newOrgName, org_code: newOrgCode, org_id: newOrgId }]);

        if (error) {
            alert('Error adding organization: ' + error.message);
        } else {
            setNewOrgName('');
            setNewOrgCode('');
            setNewOrgId('');
            fetchOrgs();
        }
    };

    const confirmDelete = async () => {
        if (!orgToDelete) return;

        const { error } = await supabase
            .from('organizations')
            .delete()
            .eq('id', orgToDelete);

        if (error) {
            alert('Error deleting org: ' + error.message);
        } else {
            fetchOrgs();
        }
        setOrgToDelete(null);
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="w-full max-w-md shadow-lg">
                    <CardHeader className="text-center space-y-2">
                        <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-2">
                            <Lock className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Super Admin Login</CardTitle>
                        <CardDescription>Enter your credentials to access the console</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter username"
                                    autoComplete="off"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                />
                            </div>
                            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
                            <Button type="submit" className="w-full">Unlock Console</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                    <h1 className="text-xl font-bold">Super Admin Console</h1>
                </div>
                <Button variant="ghost" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                </Button>
            </header>

            <main className="container mx-auto p-6 max-w-5xl space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Manage Organizations</CardTitle>
                        <CardDescription>Add, view, and remove organizations from the ERP system.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Add Org Form */}
                        <form onSubmit={handleAddOrg} className="grid sm:grid-cols-4 gap-4 mb-8 bg-muted/30 p-4 rounded-lg border">
                            <div className="space-y-2">
                                <Label htmlFor="orgName">Org Name</Label>
                                <Input
                                    id="orgName"
                                    value={newOrgName}
                                    onChange={(e) => setNewOrgName(e.target.value)}
                                    placeholder="e.g. Harvard University"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="orgCode">Org Code</Label>
                                <Input
                                    id="orgCode"
                                    value={newOrgCode}
                                    onChange={(e) => setNewOrgCode(e.target.value)}
                                    placeholder="e.g. HARV-001"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="orgId">Org ID (UUID)</Label>
                                <Input
                                    id="orgId"
                                    value={newOrgId}
                                    onChange={(e) => setNewOrgId(e.target.value)}
                                    placeholder="e.g. 550e8400-e29b..."
                                    required
                                />
                            </div>
                            <div className="flex items-end">
                                <Button type="submit" className="w-full">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Org
                                </Button>
                            </div>
                        </form>

                        {/* List */}
                        <div className="rounded-md border">
                            <div className="grid grid-cols-12 p-4 bg-muted/50 font-medium text-sm border-b">
                                <div className="col-span-1">ID</div>
                                <div className="col-span-4">Organization Name</div>
                                <div className="col-span-3">Code</div>
                                <div className="col-span-3">UUID</div>
                                <div className="col-span-1 text-right">Action</div>
                            </div>

                            {loading ? (
                                <div className="p-8 text-center text-muted-foreground">Loading organizations...</div>
                            ) : orgs.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">No organizations found.</div>
                            ) : (
                                <div className="divide-y">
                                    {orgs.map((org) => (
                                        <div key={org.id} className="grid grid-cols-12 p-4 items-center hover:bg-muted/5 text-sm transition-colors">
                                            <div className="col-span-1 font-mono text-muted-foreground">#{org.id}</div>
                                            <div className="col-span-4 font-medium flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                                {org.org_name}
                                            </div>
                                            <div className="col-span-3 font-mono">{org.org_code}</div>
                                            <div className="col-span-3 font-mono text-xs text-muted-foreground truncate" title={org.org_id}>
                                                {org.org_id}
                                            </div>
                                            <div className="col-span-1 flex justify-end">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                            onClick={() => setOrgToDelete(org.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete the
                                                                <strong> {org.org_name} </strong> organization from the database.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel onClick={() => setOrgToDelete(null)}>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

export default App;
