import { useState } from "react";
import { Building, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    userType: "owner" // owner or tenant
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic here
    console.log("Login attempt:", formData);
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-2 text-white">
            <div className="p-2 bg-white/20 rounded-lg">
              <Building className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">RentEase</h1>
              <p className="text-xs text-white/70">PG Management</p>
            </div>
          </div>
        </div>

        <Card className="shadow-strong">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your RentEase account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* User Type Selection */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={formData.userType === "owner" ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, userType: "owner" })}
                  className="w-full"
                >
                  PG Owner
                </Button>
                <Button
                  type="button"
                  variant={formData.userType === "tenant" ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, userType: "tenant" })}
                  className="w-full"
                >
                  Tenant
                </Button>
              </div>

              <Separator />

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full">
                Sign In
              </Button>

              {/* Links */}
              <div className="text-center space-y-2">
                <a href="#" className="text-sm text-primary hover:underline">
                  Forgot your password?
                </a>
                <div className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <a href="#" className="text-primary hover:underline">
                    Sign up
                  </a>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <a href="/" className="text-white/70 hover:text-white text-sm">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;