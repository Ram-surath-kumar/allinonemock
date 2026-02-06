import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ManageOrg } from "@/components/admin/ManageOrg";
import { ShieldCheck, Lock } from "lucide-react";
import { toast } from "sonner";

export default function AdminConsole() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [activeTab, setActiveTab] = useState("manage-org");

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (username === "UNFOUNDED" && password === "ZIGGERS") {
            setIsAuthenticated(true);
            toast.success("Welcome to Admin Console");
        } else {
            toast.error("Invalid credentials");
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-[80vh] animate-fade-in">
                <Card className="w-full max-w-md shadow-lg">
                    <CardHeader className="space-y-1">
                        <div className="flex items-center justify-center mb-4">
                            <div className="p-3 rounded-full bg-primary/10 text-primary">
                                <Lock className="h-8 w-8" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold text-center">Admin Access</CardTitle>
                        <CardDescription className="text-center">
                            Enter your credentials to access the console
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    placeholder="Enter username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full mt-4">
                                Unlock Console
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-8 animate-fade-in">
            <div className="flex items-center space-x-4 mb-8">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    <ShieldCheck className="h-8 w-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
                    <p className="text-muted-foreground">
                        System-wide administration and configuration.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="manage-org" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="manage-org">Manage Organizations</TabsTrigger>
                    <TabsTrigger value="settings">Global Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="manage-org" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Organization Management</CardTitle>
                            <CardDescription>
                                Create, update, and remove organizations from the system.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ManageOrg />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings">
                    <Card>
                        <CardHeader>
                            <CardTitle>Global Settings</CardTitle>
                            <CardDescription>
                                Configure system-wide parameters (Coming Soon).
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                                Settings module under development.
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
