import { Building2, Users, DollarSign, AlertCircle, Home, CheckCircle } from "lucide-react";
import Header from "@/components/Header";
import StatsCard from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  // Mock data - replace with real data from Supabase
  const stats = {
    totalRooms: 24,
    occupiedRooms: 18,
    vacantRooms: 6,
    totalTenants: 18,
    rentCollected: "₹45,000",
    pendingComplaints: 3
  };

  const recentTenants = [
    { id: 1, name: "Rahul Sharma", room: "A-101", joinDate: "2024-01-15", status: "Active" },
    { id: 2, name: "Priya Singh", room: "B-203", joinDate: "2024-01-10", status: "Active" },
    { id: 3, name: "Amit Kumar", room: "C-305", joinDate: "2024-01-08", status: "Active" }
  ];

  const recentComplaints = [
    { id: 1, tenant: "Rahul Sharma", room: "A-101", issue: "AC not working", status: "Open" },
    { id: 2, tenant: "Priya Singh", room: "B-203", issue: "WiFi connectivity", status: "In Progress" },
    { id: 3, tenant: "Amit Kumar", room: "C-305", issue: "Water leakage", status: "Resolved" }
  ];

  return (
    <div className="min-h-screen bg-muted">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back, Rajesh!</h1>
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
            trend={{ value: "12%", isPositive: true }}
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
                {recentTenants.map((tenant) => (
                  <div key={tenant.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{tenant.name}</p>
                      <p className="text-sm text-muted-foreground">Room {tenant.room}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{tenant.joinDate}</p>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-success-light text-success-foreground">
                        {tenant.status}
                      </span>
                    </div>
                  </div>
                ))}
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
                {recentComplaints.map((complaint) => (
                  <div key={complaint.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{complaint.issue}</p>
                      <p className="text-sm text-muted-foreground">{complaint.tenant} - Room {complaint.room}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                      complaint.status === 'Open' ? 'bg-destructive text-destructive-foreground' :
                      complaint.status === 'In Progress' ? 'bg-warning text-warning-foreground' :
                      'bg-success text-success-foreground'
                    }`}>
                      {complaint.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;