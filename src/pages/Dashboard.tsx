import { useState, useEffect } from "react";
import { Building2, Users, IndianRupee, AlertCircle, Home, TrendingUp, Calendar } from "lucide-react";
import Header from "@/components/Header";
import StatsCard from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Tooltip } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface DashboardStats {
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  totalTenants: number;
  rentCollected: number;
  pendingComplaints: number;
  totalDeposits: number;
  vacantBeds: number;
}

interface ChartData {
  month: string;
  rent: number;
  occupancy: number;
}

const Dashboard = () => {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalRooms: 0,
    occupiedRooms: 0,
    vacantRooms: 0,
    totalTenants: 0,
    rentCollected: 0,
    pendingComplaints: 0,
    totalDeposits: 0,
    vacantBeds: 0
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
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
      
      // Fetch rooms data with real-time stats
      const { data: rooms } = await supabase
        .from('rooms')
        .select('*')
        .eq('owner_id', user?.id);

      // Fetch all tenants with proper status filtering
      const { data: allTenants } = await supabase
        .from('tenants')
        .select('*, rooms(capacity)')
        .eq('owner_id', user?.id);

      const activeTenants = allTenants?.filter(t => t.status === 'active') || [];

      // Fetch recent tenants for display
      const { data: recentTenantsData } = await supabase
        .from('tenants')
        .select('*, rooms(room_number)')
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

      // Real-time rent collection for current month
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data: currentMonthPayments } = await supabase
        .from('payments')
        .select('rent_amount')
        .eq('owner_id', user?.id)
        .gte('payment_date', `${currentMonth}-01`)
        .lt('payment_date', `${currentMonth}-32`);

      // Calculate real-time deposits from active tenants only
      const totalActiveDeposits = activeTenants.reduce((sum, tenant) => {
        return sum + (parseFloat(tenant.deposit_amount?.toString() || "0") || 0);
      }, 0);

      // Calculate vacant beds
      const totalRoomCapacity = rooms?.reduce((sum, room) => sum + (room.capacity || 1), 0) || 0;
      const occupiedBeds = activeTenants.length;
      const vacantBeds = totalRoomCapacity - occupiedBeds;

      const totalRooms = rooms?.length || 0;
      const occupiedRooms = [...new Set(activeTenants.map(t => t.room_id))].length;
      const vacantRooms = totalRooms - occupiedRooms;
      const pendingComplaints = complaints?.filter(c => c.status === 'open').length || 0;
      const monthlyRentCollected = currentMonthPayments?.reduce((sum, payment) => sum + Number(payment.rent_amount), 0) || 0;

      setStats({
        totalRooms,
        occupiedRooms,
        vacantRooms,
        totalTenants: activeTenants.length,
        rentCollected: monthlyRentCollected,
        pendingComplaints,
        totalDeposits: totalActiveDeposits,
        vacantBeds
      });

      // Generate chart data for last 6 months
      const chartDataPromises = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStr = date.toISOString().slice(0, 7);
        
        chartDataPromises.push(
          Promise.all([
            supabase
              .from('payments')
              .select('rent_amount')
              .eq('owner_id', user?.id)
              .gte('payment_date', `${monthStr}-01`)
              .lt('payment_date', `${monthStr}-32`),
            supabase
              .from('tenants')
              .select('id')
              .eq('owner_id', user?.id)
              .eq('status', 'active')
              .lte('check_in_date', `${monthStr}-31`)
          ]).then(([paymentsResult, tenantsResult]) => ({
            month: date.toLocaleDateString('en-US', { month: 'short' }),
            rent: paymentsResult.data?.reduce((sum, p) => sum + Number(p.rent_amount), 0) || 0,
            occupancy: Math.round(((tenantsResult.data?.length || 0) / Math.max(1, totalRoomCapacity)) * 100)
          }))
        );
      }

      const resolvedChartData = await Promise.all(chartDataPromises);
      setChartData(resolvedChartData);

      setRecentTenants(recentTenantsData?.map(tenant => ({
        id: tenant.id,
        name: tenant.full_name,
        room: tenant.rooms?.room_number ? `Room ${tenant.rooms.room_number}` : 'No room assigned',
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

  const pieData = [
    { name: 'Occupied', value: stats.occupiedRooms, color: 'hsl(var(--occupied))' },
    { name: 'Vacant', value: stats.vacantRooms, color: 'hsl(var(--vacant))' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {userProfile?.full_name || 'User'}!
          </h1>
          <p className="text-muted-foreground">Here's your property management overview.</p>
        </div>

        {/* Key KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Active Tenants"
            value={stats.totalTenants}
            icon={Users}
            color="primary"
            trend={{ value: `${stats.occupiedRooms}/${stats.totalRooms} rooms`, isPositive: true }}
          />
          <StatsCard
            title="Vacant Beds"
            value={stats.vacantBeds}
            icon={Home}
            color="vacant"
            trend={{ value: "Available now", isPositive: stats.vacantBeds > 0 }}
          />
          <StatsCard
            title="Monthly Rent"
            value={`₹${stats.rentCollected.toLocaleString()}`}
            icon={IndianRupee}
            color="success"
            trend={{ value: "This month", isPositive: true }}
          />
          <StatsCard
            title="Total Deposits"
            value={`₹${stats.totalDeposits.toLocaleString()}`}
            icon={TrendingUp}
            color="primary"
            trend={{ value: "Active tenants", isPositive: true }}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Rent Collection Trend */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Monthly Rent Collection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      labelFormatter={(value) => `Month: ${value}`}
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Rent Collected']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="rent" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Occupancy Rate */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Occupancy Rate Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      labelFormatter={(value) => `Month: ${value}`}
                      formatter={(value: number) => [`${value}%`, 'Occupancy']}
                    />
                    <Bar dataKey="occupancy" fill="hsl(var(--occupied))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Room Status Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Room Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [`${value} rooms`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-occupied"></div>
                    <span className="text-sm">Occupied</span>
                  </div>
                  <span className="font-medium">{stats.occupiedRooms}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-vacant"></div>
                    <span className="text-sm">Vacant</span>
                  </div>
                  <span className="font-medium">{stats.vacantRooms}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Rooms</span>
                <span className="font-medium">{stats.totalRooms}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Occupancy Rate</span>
                <span className="font-medium">
                  {stats.totalRooms > 0 ? Math.round((stats.occupiedRooms / stats.totalRooms) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pending Complaints</span>
                <span className="font-medium text-warning">{stats.pendingComplaints}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Available Beds</span>
                <span className="font-medium text-success">{stats.vacantBeds}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  ₹{stats.rentCollected.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Rent Collected This Month</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-semibold text-foreground">
                  ₹{stats.totalDeposits.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Active Deposits</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Tenants */}
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Recent Tenants</CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate('/all-tenants')}>View All</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTenants.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No tenants found</p>
                ) : (
                  recentTenants.map((tenant) => (
                    <div key={tenant.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">{tenant.name}</p>
                        <p className="text-sm text-muted-foreground">{tenant.room}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{tenant.joinDate}</p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          tenant.status === 'active' ? 'bg-success/20 text-success' :
                          tenant.status === 'notice_period' ? 'bg-warning/20 text-warning' :
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
              <Button variant="outline" size="sm" onClick={() => navigate('/complaints')}>View All</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentComplaints.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No complaints found</p>
                ) : (
                  recentComplaints.map((complaint) => (
                    <div key={complaint.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">{complaint.issue}</p>
                        <p className="text-sm text-muted-foreground">{complaint.tenant} - Room {complaint.room}</p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        complaint.status === 'open' ? 'bg-destructive/20 text-destructive' :
                        complaint.status === 'in_progress' ? 'bg-warning/20 text-warning' :
                        'bg-success/20 text-success'
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