import { useState, useEffect } from "react";
import { Calendar, Clock, DollarSign, Home, User } from "lucide-react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface PastTenant {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  check_in_date: string;
  check_out_date: string;
  deposit_amount: number;
  deposit_return_amount: number;
  deposit_return_status: string;
  rooms: {
    room_number: string;
    rent_amount: number;
  };
}

export default function PastTenants() {
  const { user } = useAuth();
  const [pastTenants, setPastTenants] = useState<PastTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPastTenants();
  }, [user]);

  const fetchPastTenants = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          id,
          full_name,
          email,
          phone,
          check_in_date,
          check_out_date,
          deposit_amount,
          deposit_return_amount,
          deposit_return_status,
          rooms!inner (
            room_number,
            rent_amount
          )
        `)
        .eq('owner_id', user.id)
        .eq('status', 'checked_out')
        .not('check_out_date', 'is', null)
        .order('check_out_date', { ascending: false });

      if (error) throw error;
      setPastTenants(data || []);
    } catch (error) {
      console.error('Error fetching past tenants:', error);
      toast.error('Failed to fetch past tenants');
    } finally {
      setLoading(false);
    }
  };

  const filteredTenants = pastTenants.filter(tenant =>
    tenant.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.rooms.room_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateStayDuration = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.floor(diffDays / 30);
    const days = diffDays % 30;
    return months > 0 ? `${months}m ${days}d` : `${days} days`;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getDepositStatusBadge = (status: string) => {
    switch (status) {
      case 'full':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Full Return</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Partial Return</Badge>;
      case 'none':
        return <Badge className="bg-red-100 text-red-800 border-red-300">No Return</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Past Tenants</h1>
          <p className="text-muted-foreground">Historical records of checked-out tenants</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Search by tenant name or room number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Past Tenants List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Past Tenants ({filteredTenants.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading past tenants...</div>
            ) : filteredTenants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No past tenants found matching your search' : 'No past tenants found'}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTenants.map((tenant) => (
                  <div 
                    key={tenant.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarFallback>
                          {getInitials(tenant.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{tenant.full_name}</h3>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-2">
                            <Home className="h-3 w-3" />
                            <span>Room {tenant.rooms.room_number}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            <span>
                              Stay Duration: {calculateStayDuration(tenant.check_in_date, tenant.check_out_date)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right space-y-2">
                      <div className="flex items-center gap-4">
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Check-in: {new Date(tenant.check_in_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Check-out: {new Date(tenant.check_out_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            <span>Deposit: ₹{tenant.deposit_amount?.toLocaleString() || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            <span>Returned: ₹{tenant.deposit_return_amount?.toLocaleString() || 0}</span>
                          </div>
                        </div>
                        
                        <div>
                          {getDepositStatusBadge(tenant.deposit_return_status)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}