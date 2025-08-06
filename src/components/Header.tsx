import { Building, Menu, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const { userProfile, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-border shadow-soft sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-hero rounded-lg">
              <Building className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">RentEase</h1>
              <p className="text-xs text-muted-foreground">PG Management</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/dashboard" className="text-foreground hover:text-primary transition-colors font-medium">
              Dashboard
            </Link>
            {isAdmin && (
              <>
                <Link to="/rooms" className="text-foreground hover:text-primary transition-colors font-medium">
                  Rooms
                </Link>
                <Link to="/tenants" className="text-foreground hover:text-primary transition-colors font-medium">
                  Tenants
                </Link>
                <Link to="/past-tenants" className="text-foreground hover:text-primary transition-colors font-medium">
                  Past Tenants
                </Link>
                <Link to="/rent" className="text-foreground hover:text-primary transition-colors font-medium">
                  Rent
                </Link>
              </>
            )}
            <Link to="/complaints" className="text-foreground hover:text-primary transition-colors font-medium">
              Complaints
            </Link>
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled>
                  <User className="mr-2 h-4 w-4" />
                  {userProfile?.full_name || 'User'} ({userProfile?.role})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;