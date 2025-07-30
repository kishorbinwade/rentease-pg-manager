import { Building, Users, Shield, CreditCard, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/rentease-hero.jpg";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  const features = [
    {
      icon: Building,
      title: "Property Management",
      description: "Efficiently manage multiple PG properties and room assignments"
    },
    {
      icon: Users,
      title: "Tenant Management",
      description: "Keep track of tenant details, agreements, and rental history"
    },
    {
      icon: CreditCard,
      title: "Rent Collection",
      description: "Streamlined rent collection with automated tracking and receipts"
    },
    {
      icon: Shield,
      title: "Complaint Management",
      description: "Handle tenant complaints and maintenance requests effectively"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-hero rounded-lg">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">RentEase</h1>
                <p className="text-xs text-muted-foreground">PG Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <Button onClick={() => navigate('/dashboard')}>
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => navigate('/auth')}>
                    Sign In
                  </Button>
                  <Button onClick={handleGetStarted}>
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-hero">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h1 className="text-5xl font-bold mb-6 leading-tight">
                Simplify Your PG Management with RentEase
              </h1>
              <p className="text-xl mb-8 text-white/90">
                Complete solution for managing paying guest properties, tenants, rent collection, and complaints - all in one powerful platform.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90" asChild>
                  <a href="/dashboard">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary" asChild>
                  <a href="/login">
                    Watch Demo
                  </a>
                </Button>
              </div>
            </div>
            <div className="relative">
              <img 
                src={heroImage} 
                alt="Property Management" 
                className="rounded-2xl shadow-strong w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Everything You Need to Manage Your PG
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From tenant onboarding to rent collection, RentEase provides all the tools you need for efficient property management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-gradient-card shadow-soft hover:shadow-medium transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="p-3 bg-primary rounded-lg inline-block mb-4">
                    <feature.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-6">
                Why Choose RentEase?
              </h2>
              <div className="space-y-4">
                {[
                  "Real-time dashboard with property insights",
                  "Automated rent tracking and receipt generation",
                  "Streamlined tenant complaint management",
                  "Secure document storage and management",
                  "Mobile-friendly responsive design",
                  "Role-based access for owners and tenants"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6 bg-gradient-card shadow-soft">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">95%</div>
                  <div className="text-sm text-muted-foreground">Rent Collection Rate</div>
                </div>
              </Card>
              <Card className="p-6 bg-gradient-card shadow-soft">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                  <div className="text-sm text-muted-foreground">System Availability</div>
                </div>
              </Card>
              <Card className="p-6 bg-gradient-card shadow-soft">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">50+</div>
                  <div className="text-sm text-muted-foreground">Happy Property Owners</div>
                </div>
              </Card>
              <Card className="p-6 bg-gradient-card shadow-soft">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">2min</div>
                  <div className="text-sm text-muted-foreground">Average Setup Time</div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your PG Management?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join hundreds of property owners who have streamlined their operations with RentEase.
          </p>
          <Button size="lg" className="bg-white text-primary hover:bg-white/90" asChild>
            <a href="/dashboard">
              Get Started Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="p-2 bg-primary rounded-lg">
              <Building className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">RentEase</h1>
              <p className="text-xs text-white/70">PG Management Made Simple</p>
            </div>
          </div>
          <div className="text-center mt-8 text-white/70">
            <p>&copy; 2024 RentEase. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
