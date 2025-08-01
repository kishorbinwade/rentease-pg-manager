import { useState, useEffect } from "react";
import { Search, IndianRupee, Calendar, Download, CheckCircle, XCircle, Clock } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import StatsCard from "@/components/StatsCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Rent = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [statusFilter, setStatusFilter] = useState("all");
  const [rentRecords, setRentRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRentRecords();
    }
  }, [user, selectedMonth]);

  const fetchRentRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('rent_records')
        .select(`
          *,
          tenants(
            id,
            full_name,
            phone
          ),
          rooms(
            room_number,
            rent_amount
          )
        `)
        .eq('owner_id', user?.id)
        .order('due_date', { ascending: false });

      if (error) throw error;
      setRentRecords(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch rent records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = rentRecords.filter(record => {
    const matchesSearch = 
      record.tenants?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.rooms?.room_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthRecords = rentRecords.filter(record => 
    record.due_date?.startsWith(currentMonth)
  );

  const stats = {
    totalRent: currentMonthRecords.reduce((sum, record) => sum + Number(record.amount || 0), 0),
    collected: currentMonthRecords.filter(r => r.status === "paid").reduce((sum, record) => sum + Number(record.amount || 0), 0),
    pending: currentMonthRecords.filter(r => r.status === "pending").reduce((sum, record) => sum + Number(record.amount || 0), 0),
    overdue: currentMonthRecords.filter(r => r.status === "overdue").reduce((sum, record) => sum + Number(record.amount || 0), 0)
  };

  const analytics = {
    totalCollected: stats.collected,
    totalPending: stats.pending + stats.overdue,
    paidTenantsCount: currentMonthRecords.filter(r => r.status === "paid").length,
    unpaidTenantsCount: currentMonthRecords.filter(r => r.status !== "paid").length,
    collectionPercentage: stats.totalRent > 0 ? Math.round((stats.collected / stats.totalRent) * 100) : 0
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-success text-success-foreground">Paid</Badge>;
      case "pending":
        return <Badge className="bg-warning text-warning-foreground">Pending</Badge>;
      case "overdue":
        return <Badge className="bg-destructive text-destructive-foreground">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleMarkPaid = async (recordId: string) => {
    try {
      const { error } = await supabase
        .from('rent_records')
        .update({ 
          status: 'paid',
          paid_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Rent marked as paid",
      });

      fetchRentRecords();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update rent status",
        variant: "destructive",
      });
    }
  };

  const handleGenerateReceipt = (recordId: string) => {
    toast({
      title: "Info",
      description: "Receipt generation feature coming soon",
    });
  };

  return (
    <div className="min-h-screen bg-muted">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Rent Management</h1>
            <p className="text-muted-foreground">Track rent collection and payment status</p>
          </div>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Rent (This Month)"
            value={`₹${stats.totalRent.toLocaleString()}`}
            icon={IndianRupee}
            color="primary"
          />
          <StatsCard
            title="Collected"
            value={`₹${stats.collected.toLocaleString()}`}
            icon={CheckCircle}
            color="success"
          />
          <StatsCard
            title="Pending"
            value={`₹${(stats.pending + stats.overdue).toLocaleString()}`}
            icon={Clock}
            color="warning"
          />
          <StatsCard
            title="Collection Rate"
            value={`${analytics.collectionPercentage}%`}
            icon={XCircle}
            color="success"
          />
        </div>

        {/* Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-card shadow-soft">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-success mb-1">
                ₹{analytics.totalCollected.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Collected This Month</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card shadow-soft">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-warning mb-1">
                ₹{analytics.totalPending.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Pending Rent</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card shadow-soft">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-success mb-1">
                {analytics.paidTenantsCount}
              </div>
              <div className="text-sm text-muted-foreground">Paid Tenants</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card shadow-soft">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-destructive mb-1">
                {analytics.unpaidTenantsCount}
              </div>
              <div className="text-sm text-muted-foreground">Unpaid Tenants</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search tenants, rooms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024-07">July 2024</SelectItem>
              <SelectItem value="2024-06">June 2024</SelectItem>
              <SelectItem value="2024-05">May 2024</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Rent Records */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Rent Records</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No rent records found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRecords.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{getInitials(record.tenants?.full_name || 'N/A')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{record.tenants?.full_name || 'Unknown Tenant'}</p>
                        <p className="text-sm text-muted-foreground">Room {record.rooms?.room_number || 'N/A'}</p>
                        {record.tenants?.phone && (
                          <p className="text-xs text-muted-foreground">{record.tenants.phone}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          ₹{Number(record.amount || 0).toLocaleString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Due: {new Date(record.due_date).toLocaleDateString()}</p>
                        {record.paid_date && (
                          <p className="text-sm text-success">Paid: {new Date(record.paid_date).toLocaleDateString()}</p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {getStatusBadge(record.status)}
                      </div>

                      <div className="flex space-x-2">
                        {record.status === "paid" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateReceipt(record.id)}
                          >
                            <Download className="mr-1 h-3 w-3" />
                            Receipt
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleMarkPaid(record.id)}
                          >
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Mark Paid
                          </Button>
                        )}
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
};

export default Rent;