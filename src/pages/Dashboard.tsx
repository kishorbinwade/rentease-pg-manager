import { useState, useEffect } from "react";
import { Building2, Users, DollarSign, AlertCircle, Home } from "lucide-react";
import Header from "@/components/Header";
import StatsCard from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalRooms: 0,
    occupiedRooms: 0,
    vacantRooms: 0,
    totalTenants: 0,
    rentCollected: "₹0",
    pendingComplaints: 0
  });
  const [recentTenants, setRecentTenants] = useState([]);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && userProfile) {
      fetchDashboardData();
    }
  }, [user, userProfile]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch rooms data
      const { data: rooms } = await supabase
        .from('rooms')
        .select('*')
        .eq('owner_id', user?.id);

      // Fetch tenants data
      const { data: tenants } = await supabase
        .from('tenants')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch complaints data
      const { data: complaints } = await supabase
        .from('complaints')
        .select('*, tenants(full_name), rooms(room_number)')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch rent records for current month
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data: rentRecords } = await supabase
        .from('rent_records')
        .select('amount')
        .eq('owner_id', user?.id)
        .eq('status', 'paid')
        .gte('paid_date', `${currentMonth}-01`);

      const totalRooms = rooms?.length || 0;
      const occupiedRooms = rooms?.filter(room => room.status === 'occupied').length || 0;
      const vacantRooms = totalRooms - occupiedRooms;
      const pendingComplaints = complaints?.filter(c => c.status === 'open').length || 0;
      const totalRentCollected = rentRecords?.reduce((sum, record) => sum + Number(record.amount), 0) || 0;

      setStats({
        totalRooms,
        occupiedRooms,
        vacantRooms,
        totalTenants: tenants?.length || 0,
        rentCollected: `₹${totalRentCollected.toLocaleString()}`,
        pendingComplaints
      });

      setRecentTenants(tenants?.map(tenant => ({
        id: tenant.id,
        name: tenant.full_name,
        room: tenant.room_id ? `Room ${tenant.room_id}` : 'No room assigned',
        joinDate: new Date(tenant.join_date).toLocaleDateString(),
        status: tenant.status
      })) || []);

      setRecentComplaints(complaints?.map(complaint => ({
        id: complaint.id,
        tenant: complaint.tenants?.full_name || 'Unknown',
        room: complaint.rooms?.room_number || 'Unknown',
        issue: complaint.title,
        status: complaint.status
      })) || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {userProfile?.full_name || 'User'}!
          </h1>
          <p className="text-muted-foreground">Here's what's happening with your PG today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <StatsCard
            title="Total Rooms"
            value={stats.totalRooms}
            icon={Building2}
            color="primary"
          />
          <StatsCard
            title="Occupied"
            value={stats.occupiedRooms}
            icon={Home}
            color="occupied"
          />
          <StatsCard
            title="Vacant"
            value={stats.vacantRooms}
            icon={Home}
            color="vacant"
          />
          <StatsCard
            title="Total Tenants"
            value={stats.totalTenants}
            icon={Users}
            color="primary"
          />
          <StatsCard
            title="Rent Collected"
            value={stats.rentCollected}
            icon={DollarSign}
            color="success"
          />
          <StatsCard
            title="Complaints"
            value={stats.pendingComplaints}
            icon={AlertCircle}
            color="warning"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Tenants */}
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Recent Tenants</CardTitle>
              <Button variant="outline" size="sm">View All</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTenants.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No tenants found</p>
                ) : (
                  recentTenants.map((tenant) => (
                    <div key={tenant.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">{tenant.name}</p>
                        <p className="text-sm text-muted-foreground">{tenant.room}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{tenant.joinDate}</p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          tenant.status === 'active' ? 'bg-success-light text-success-foreground' :
                          tenant.status === 'notice_period' ? 'bg-warning-light text-warning-foreground' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {tenant.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Complaints */}
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Recent Complaints</CardTitle>
              <Button variant="outline" size="sm">View All</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentComplaints.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No complaints found</p>
                ) : (
                  recentComplaints.map((complaint) => (
                    <div key={complaint.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">{complaint.issue}</p>
                        <p className="text-sm text-muted-foreground">{complaint.tenant} - {complaint.room}</p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        complaint.status === 'open' ? 'bg-destructive text-destructive-foreground' :
                        complaint.status === 'in_progress' ? 'bg-warning text-warning-foreground' :
                        'bg-success text-success-foreground'
                      }`}>
                        {complaint.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;