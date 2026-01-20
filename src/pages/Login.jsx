import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export function Login() {
  const [loopEmailOrId, setLoopEmailOrId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { loginWithCredentials, currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (currentUser && !authLoading) {
      navigate('/', { replace: true });
    }
  }, [currentUser, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!loopEmailOrId.trim() || !password.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter both Loop Email/Loop ID and Password',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // First, find the user by loopid or email in public.users
      // Try loopid first, then email
      let userData = null;
      let userError = null;

      // Try to find by loopid
      const { data: loopidData, error: loopidError } = await supabase
        .from('users')
        .select('*')
        .eq('loopid', loopEmailOrId.trim())
        .maybeSingle();

      if (loopidData) {
        userData = loopidData;
      } else {
        // If not found by loopid, try email
        const { data: emailData, error: emailError } = await supabase
          .from('users')
          .select('*')
          .eq('email', loopEmailOrId.trim())
          .maybeSingle();

        if (emailData) {
          userData = emailData;
        } else {
          userError = emailError || loopidError;
        }
      }

      if (userError || !userData) {
        toast({
          title: 'Login Failed',
          description: 'Invalid Loop Email/Loop ID or Password',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Login successful - use the loginWithCredentials function
      // This will authenticate with Supabase Auth and load user data
      // Trim password to remove any accidental whitespace
      await loginWithCredentials(userData.email, password.trim());

      toast({
        title: 'Login Successful',
        description: `Welcome back, ${userData.name}!`,
      });

      // Wait a moment for the user to be loaded in context, then navigate
      setTimeout(() => {
        // Navigate to dashboard - Index component will handle routing based on user data
        navigate('/');
      }, 100);
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login Failed',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md shadow-lg border-border bg-card/70 backdrop-blur-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 p-4 shadow-lg">
              <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription className="mt-2">
              Sign in to LoopVerse ERP
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="loopEmailOrId" className="text-sm font-medium">
                Loop Email / Loop ID
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="loopEmailOrId"
                  type="text"
                  placeholder="Enter Loop Email or Loop ID"
                  value={loopEmailOrId}
                  onChange={(e) => setLoopEmailOrId(e.target.value)}
                  className="pl-10 h-11"
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Powered by LoopVerse</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Login;
