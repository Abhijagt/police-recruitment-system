import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Shield, User, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';

// ── Validation ────────────────────────────────────────────────────────────────
interface LoginErrors {
  email?: string;
  password?: string;
  policeId?: string;
}

const POLICE_ID_REGEX = /^[A-Za-z0-9\-/]{3,20}$/;

function validateLogin(
  email: string,
  password: string,
  policeId: string,
  isSignUp: boolean
): LoginErrors {
  const errors: LoginErrors = {};

  // Email
  if (!email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'Please enter a valid email address.';
  } else if (isSignUp && !email.trim().endsWith('@police.gov.in')) {
    errors.email = 'Only @police.gov.in email addresses are allowed for signup.';
  }

  // Password
  if (!password) {
    errors.password = 'Password is required.';
  } else if (isSignUp && password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  } else if (isSignUp && !/[A-Z]/.test(password)) {
    errors.password = 'Password must contain at least one uppercase letter.';
  } else if (isSignUp && !/[0-9]/.test(password)) {
    errors.password = 'Password must contain at least one number.';
  }

  // Police ID (sign-up only)
  if (isSignUp) {
    if (!policeId.trim()) {
      errors.policeId = 'Police ID is required for signup.';
    } else if (!POLICE_ID_REGEX.test(policeId.trim())) {
      errors.policeId = 'Police ID must be 3–20 alphanumeric characters (hyphens/slashes allowed).';
    }
  }

  return errors;
}
// ─────────────────────────────────────────────────────────────────────────────

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [policeId, setPoliceId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validateLogin(email, password, policeId, isSignUp));
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (touched.email) setErrors(validateLogin(val, password, policeId, isSignUp));
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (touched.password) setErrors(validateLogin(email, val, policeId, isSignUp));
  };

  const handlePoliceIdChange = (val: string) => {
    setPoliceId(val);
    if (touched.policeId) setErrors(validateLogin(email, password, val, isSignUp));
  };

  // Switch mode: reset all errors/touched
  const handleModeSwitch = () => {
    setIsSignUp(!isSignUp);
    setErrors({});
    setTouched({});
    setPoliceId('');
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Touch all relevant fields
    const allTouched: Record<string, boolean> = { email: true, password: true };
    if (isSignUp) allTouched.policeId = true;
    setTouched(allTouched);

    const validationErrors = validateLogin(email, password, policeId, isSignUp);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast.error('Please fix the errors before continuing.');
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        // Verify officer in the whitelist
        const { data: officers, error: checkError } = await supabase
          .from('officers')
          .select('id')
          .eq('email', email.trim())
          .eq('police_id', policeId.trim())
          .maybeSingle();

        if (checkError) {
          throw new Error('Database error during verification. Please try again.');
        }
        if (!officers) {
          throw new Error('You are not an authorized police officer');
        }

        const { error } = await signUp(email.trim(), password);
        if (error) throw error;
        toast.success('Account created! Check your email to verify.');
      } else {
        const { error } = await signIn(email.trim(), password);
        if (error) throw error;
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const FieldError = ({ msg }: { msg?: string }) =>
    msg ? <p className="text-xs text-red-500 mt-1">{msg}</p> : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Police Recruitment Running Test Management System</h1>
        </div>

        <Card className="shadow-xl border-t-4 border-t-primary">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Portal Login</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Please enter your official credentials to access the running test management portal.
            </p>
          </CardHeader>

          <form onSubmit={handleSubmit} noValidate>
            <CardContent className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                  {isSignUp && <span className="text-xs text-muted-foreground ml-1">(must be @police.gov.in)</span>}
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={isSignUp ? "officer@police.gov.in" : "Enter your email"}
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    onBlur={() => handleBlur('email')}
                    className={`pl-10 ${touched.email && errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    maxLength={100}
                    autoComplete="email"
                  />
                </div>
                <FieldError msg={touched.email ? errors.email : undefined} />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password <span className="text-red-500">*</span>
                  {isSignUp && <span className="text-xs text-muted-foreground ml-1">(min 8 chars, 1 uppercase, 1 number)</span>}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={isSignUp ? "At least 8 characters" : "Enter your password"}
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    onBlur={() => handleBlur('password')}
                    className={`pl-10 pr-10 ${touched.password && errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    maxLength={128}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <FieldError msg={touched.password ? errors.password : undefined} />
              </div>

              {/* Police ID (sign-up only) */}
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="policeId">
                    Police ID <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="policeId"
                      type="text"
                      placeholder="e.g. MH-12345"
                      value={policeId}
                      onChange={(e) => handlePoliceIdChange(e.target.value.toUpperCase())}
                      onBlur={() => handleBlur('policeId')}
                      className={`pl-10 ${touched.policeId && errors.policeId ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                      maxLength={20}
                      autoComplete="off"
                    />
                  </div>
                  <FieldError msg={touched.policeId ? errors.policeId : undefined} />
                  <p className="text-xs text-muted-foreground">Alphanumeric, 3–20 characters</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full gradient-primary text-primary-foreground font-semibold h-12 text-base"
                disabled={isLoading}
              >
                {isLoading
                  ? (isSignUp ? 'Creating account...' : 'Signing in...')
                  : (isSignUp ? 'Create Account' : 'Sign In to Dashboard →')}
              </Button>
            </CardContent>
          </form>

          <CardFooter className="flex flex-col gap-3 pt-0">
            <button
              onClick={handleModeSwitch}
              className="text-sm text-primary hover:underline"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
            </button>
            <p className="text-xs text-muted-foreground text-center">
              Secured by Department Information Systems • v2.4.0
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
