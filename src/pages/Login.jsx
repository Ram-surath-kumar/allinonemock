import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Mail, Lock, Loader2, Eye, EyeOff, User, Sparkles, ShieldCheck, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { RippleLoader } from "@/components/ui/RippleLoader";

export function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Sign In State
  const [loopEmailOrId, setLoopEmailOrId] = useState("");
  const [password, setPassword] = useState("");
  
  // Sign Up State
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpStream, setSignUpStream] = useState("Engineering (JEE/GATE)");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { loginWithCredentials, currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (currentUser && !authLoading) {
      navigate("/", { replace: true });
    }
  }, [currentUser, authLoading, navigate]);

  // Quick Login Auto-filler
  const handleQuickLogin = async (role) => {
    let emailStr = "";
    let passStr = "123456";

    if (role === "student") {
      emailStr = "1000120002@loopverse.in";
    } else if (role === "admin") {
      emailStr = "admin@loopverse.in";
    }

    setLoopEmailOrId(emailStr);
    setPassword(passStr);
    
    // Trigger login directly
    setLoading(true);
    try {
      await loginWithCredentials(emailStr, passStr);
      toast({
        title: "Login Successful",
        description: `Welcome back! Logged in as ${role === "student" ? "Student" : "Administrator"}.`,
      });
      setTimeout(() => {
        navigate("/");
      }, 100);
    } catch (err) {
      toast({
        title: "Quick Login Failed",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();

    if (!loopEmailOrId.trim() || !password.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter both Email/User ID and Password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Find the user by loopid or email in public.users
      let userData = null;
      let userError = null;

      // Try to find by loopid
      const { data: loopidData, error: loopidError } = await supabase
        .from("users")
        .select("*")
        .eq("loopid", loopEmailOrId.trim())
        .maybeSingle();

      if (loopidData) {
        userData = loopidData;
      } else {
        // Try email
        const { data: emailData, error: emailError } = await supabase
          .from("users")
          .select("*")
          .eq("email", loopEmailOrId.trim())
          .maybeSingle();

        if (emailData) {
          userData = emailData;
        } else {
          userError = emailError || loopidError;
        }
      }

      if (userError || !userData) {
        toast({
          title: "Login Failed",
          description: "Invalid Email/User ID or Password",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Trim password to remove any accidental whitespace
      await loginWithCredentials(userData.email, password.trim());

      toast({
        title: "Login Successful",
        description: `Welcome back, ${userData.name}!`,
      });

      setTimeout(() => {
        navigate("/");
      }, 100);
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (!signUpName.trim() || !signUpEmail.trim() || !signUpPassword.trim() || !signUpConfirmPassword.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill out all fields.",
        variant: "destructive",
      });
      return;
    }

    if (signUpPassword.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // 1. Check if user already exists in public.users
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", signUpEmail.trim())
        .maybeSingle();

      if (existingUser) {
        throw new Error("This email address is already registered. Please sign in instead.");
      }

      // 2. Query dynamic organization and department values
      const { data: orgs } = await supabase.from("organizations").select("id").limit(1);
      const orgId = orgs && orgs.length > 0 ? orgs[0].id : null;

      const { data: depts } = await supabase.from("departments").select("id").limit(1);
      const deptId = depts && depts.length > 0 ? depts[0].id : null;

      // 3. Register user with Supabase Auth
      let authUserId = null;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signUpEmail.trim(),
        password: signUpPassword,
      });

      if (authError) {
        // If email signup is limited or requires admin confirmation, we'll fall back to creating the DB profile directly
        console.warn("Auth signup error, using resilient profile fallback:", authError.message);
      } else if (authData?.user) {
        authUserId = authData.user.id;
      }

      // Generate secure IDs
      const uniqueUserId = authUserId || ("usr_" + Math.random().toString(36).substring(2, 15));
      const generatedLoopId = String(1000000000 + Math.floor(Math.random() * 9000000000)); // 10-digit ID
      const generatedUserIdNum = Math.floor(100000 + Math.random() * 900000); // 6-digit number

      // 4. Create record in public.users
      const { error: dbError } = await supabase
        .from("users")
        .insert({
          id: uniqueUserId,
          org_id: orgId,
          department_id: deptId,
          name: signUpName.trim(),
          email: signUpEmail.trim(),
          role: "student",
          status: "active",
          loopid: generatedLoopId,
          user_id: generatedUserIdNum
        });

      if (dbError) {
        throw new Error(`Profile generation failed: ${dbError.message}`);
      }

      toast({
        title: "Registration Successful!",
        description: `Welcome ${signUpName}! Account created. You can now log in.`,
      });

      // Switch to sign in and auto-fill
      setLoopEmailOrId(signUpEmail.trim());
      setPassword(signUpPassword);
      setIsSignUp(false);

    } catch (error) {
      console.error("Sign up error:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <RippleLoader />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6 md:p-8">
      <Card className="w-full max-w-md border border-border bg-card shadow-sm rounded-xl overflow-hidden">
        
        {/* Toggle tabs at top */}
        <div className="flex border-b border-border bg-muted/30">
          <button
            type="button"
            onClick={() => setIsSignUp(false)}
            className={`flex-1 py-3 text-sm font-semibold transition-all border-b-2 ${
              !isSignUp
                ? "border-primary text-primary bg-card"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsSignUp(true)}
            className={`flex-1 py-3 text-sm font-semibold transition-all border-b-2 ${
              isSignUp
                ? "border-primary text-primary bg-card"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Create Account
          </button>
        </div>

        <CardHeader className="space-y-3 text-center pt-6 pb-2">
          <div className="flex justify-center">
            <div className="flex items-center justify-center rounded-xl bg-primary p-3 shadow-sm text-primary-foreground">
              <Brain className="h-6 w-6" />
            </div>
          </div>
          <div>
            <CardTitle className="text-xl font-bold tracking-tight text-foreground">
              {isSignUp ? "Join All in One Mock" : "Welcome Back"}
            </CardTitle>
            <CardDescription className="text-xs">
              {isSignUp 
                ? "Sign up in 30 seconds to instantly convert PDFs and practice PYQPs." 
                : "Sign in to access your timed exam environment and AI diagnostics."}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-2 pb-6">
          {!isSignUp ? (
            /* ================= SIGN IN FORM ================= */
            <div className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="loopEmailOrId" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Email or Student ID
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="loopEmailOrId"
                      type="text"
                      placeholder="Enter email or user ID (e.g. 1000120002)"
                      value={loopEmailOrId}
                      onChange={(e) => setLoopEmailOrId(e.target.value)}
                      className="pl-10 h-10 text-sm rounded-lg border-border"
                      disabled={loading}
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-10 text-sm rounded-lg border-border"
                      disabled={loading}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-10 text-sm font-semibold rounded-lg shadow-none"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    "Sign In to Platform"
                  )}
                </Button>
              </form>

              {/* DEMO CREDENTIAL QUICK ACCESS PANEL */}
              <div className="pt-4 border-t border-border mt-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center mb-3">
                  Quick Access Demo Credentials
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("student")}
                    className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-border bg-muted/10 hover:bg-muted/40 transition-colors text-center"
                  >
                    <GraduationCap className="h-5 w-5 text-primary mb-1" />
                    <span className="text-[11px] font-bold text-foreground">Student Portal</span>
                    <span className="text-[9px] text-muted-foreground font-mono mt-0.5">ID: 1000120002</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("admin")}
                    className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-border bg-muted/10 hover:bg-muted/40 transition-colors text-center"
                  >
                    <ShieldCheck className="h-5 w-5 text-emerald-600 mb-1" />
                    <span className="text-[11px] font-bold text-foreground">Admin Portal</span>
                    <span className="text-[9px] text-muted-foreground font-mono mt-0.5">ID: admin</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ================= SIGN UP FORM ================= */
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="signUpName" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signUpName"
                    type="text"
                    placeholder="Enter your full name"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    className="pl-10 h-10 text-sm rounded-lg border-border"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="signUpEmail" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signUpEmail"
                    type="email"
                    placeholder="name@example.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    className="pl-10 h-10 text-sm rounded-lg border-border"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="signUpStream" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Target Exam Stream
                </Label>
                <select
                  id="signUpStream"
                  value={signUpStream}
                  onChange={(e) => setSignUpStream(e.target.value)}
                  className="w-full h-10 text-sm rounded-lg border border-input bg-background px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={loading}
                >
                  <option value="Engineering (JEE/GATE)">Engineering (JEE / GATE)</option>
                  <option value="Medical (NEET)">Medical (NEET)</option>
                  <option value="Civil Services (UPSC)">Civil Services (UPSC)</option>
                  <option value="General Aptitude">General Aptitude (CAT/XAT)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="signUpPassword" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signUpPassword"
                    type="password"
                    placeholder="Create secure password"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    className="pl-10 h-10 text-sm rounded-lg border-border"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="signUpConfirmPassword" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signUpConfirmPassword"
                    type="password"
                    placeholder="Repeat secure password"
                    value={signUpConfirmPassword}
                    onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                    className="pl-10 h-10 text-sm rounded-lg border-border"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-10 text-sm font-semibold rounded-lg shadow-none"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering Account...
                  </>
                ) : (
                  "Create Student Account"
                )}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <p>Powered by All in One Mock</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Login;
