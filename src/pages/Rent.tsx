import { useState, useEffect } from "react";
import Header from "@/components/Header";
import StatsCard from "@/components/StatsCard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Download, Search, DollarSign, Calendar, AlertCircle, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PaymentEntryDialog } from "@/components/PaymentEntryDialog";

interface RentRecord {
  id: string;
  tenant_id: string;
  room_id: string;
  amount: number;
  due_date: string;
  paid_date?: string;
  status: string;
  tenants: {
    id: string;
    full_name: string;
    email: string;
    status: string;
    rooms: {
      room_number: string;
      rent_amount: number;
    };
  };
  latest_payment?: {
    payment_date: string;
    rent_amount: number;
    deposit_amount: number;
    other_charges: number;
    payment_method: string;
  };
}

export default function Rent() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [statusFilter, setStatusFilter] = useState("all");
  const [rentRecords, setRentRecords] = useState<RentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRentRecords();
  }, [user, selectedMonth]);

  const fetchRentRecords = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get the selected month's start and end dates
      const monthStart = new Date(selectedMonth + '-01');
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
      
      // Fetch active tenants with room details
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select(`
          id,
          full_name,
          email,
          status,
          room_id,
          rooms!inner (
            room_number,
            rent_amount
          )
        `)
        .eq('owner_id', user.id)
        .eq('status', 'active');

      if (tenantsError) throw tenantsError;

      // Fetch payments for the selected month
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('owner_id', user.id)
        .gte('payment_month', monthStart.toISOString().split('T')[0])
        .lt('payment_month', new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1).toISOString().split('T')[0]);

      if (paymentsError) throw paymentsError;

      // Create rent records by combining tenant data with payment status
      const records: RentRecord[] = (tenantsData || []).map(tenant => {
        const latestPayment = paymentsData?.find(p => p.tenant_id === tenant.id);
        const dueDate = new Date(monthStart.getFullYear(), monthStart.getMonth(), 5); // 5th of each month
        const isPaid = !!latestPayment;
        const isOverdue = !isPaid && new Date() > dueDate;
        
        return {
          id: `${tenant.id}-${selectedMonth}`,
          tenant_id: tenant.id,
          room_id: tenant.room_id,
          amount: tenant.rooms.rent_amount,
          due_date: dueDate.toISOString().split('T')[0],
          paid_date: latestPayment?.payment_date,
          status: isPaid ? 'paid' : (isOverdue ? 'overdue' : 'pending'),
          tenants: tenant,
          latest_payment: latestPayment || undefined
        };
      });

      setRentRecords(records);
    } catch (error) {
      console.error('Error fetching rent records:', error);
      toast.error('Failed to fetch rent records');
    } finally {
      setLoading(false);
    }
  };

  // Filter records based on search and status
  const filteredRecords = rentRecords.filter(record => {
    const matchesSearch = record.tenants.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.tenants.rooms.room_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics for the current month
  const stats = {
    totalRent: filteredRecords.reduce((sum, record) => sum + record.amount, 0),
    collected: filteredRecords.filter(record => record.status === 'paid').reduce((sum, record) => {
      return sum + (record.latest_payment?.rent_amount || 0);
    }, 0),
    totalDeposits: filteredRecords.reduce((sum, record) => {
      return sum + (record.latest_payment?.deposit_amount || 0);
    }, 0),
    totalOtherCharges: filteredRecords.reduce((sum, record) => {
      return sum + (record.latest_payment?.other_charges || 0);
    }, 0),
    pending: filteredRecords.filter(record => record.status !== 'paid').reduce((sum, record) => sum + record.amount, 0),
    overdue: filteredRecords.filter(record => record.status === 'overdue').reduce((sum, record) => sum + record.amount, 0)
  };

  // Calculate analytics
  const analytics = {
    collectionRate: stats.totalRent > 0 ? Math.round((stats.collected / stats.totalRent) * 100) : 0,
    paidTenants: filteredRecords.filter(record => record.status === 'paid').length,
    pendingTenants: filteredRecords.filter(record => record.status !== 'paid').length,
    totalTenants: filteredRecords.length
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handlePaymentAdded = () => {
    fetchRentRecords();
  };

  const handleGenerateReceipt = (recordId: string) => {
    toast.success('Receipt generation feature coming soon');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Rent"
            value={`₹${stats.totalRent.toLocaleString()}`}
            icon={DollarSign}
            trend={{ value: `${analytics.collectionRate}%`, isPositive: analytics.collectionRate > 70 }}
          />
          <StatsCard
            title="Collected"
            value={`₹${stats.collected.toLocaleString()}`}
            icon={DollarSign}
            trend={{ value: `${analytics.paidTenants} tenants`, isPositive: true }}
          />
          <StatsCard
            title="Total Deposits"
            value={`₹${stats.totalDeposits.toLocaleString()}`}
            icon={DollarSign}
            trend={{ value: "0%", isPositive: true }}
          />
          <StatsCard
            title="Other Charges"
            value={`₹${stats.totalOtherCharges.toLocaleString()}`}
            icon={DollarSign}
            trend={{ value: "0%", isPositive: true }}
          />
        </div>

        {/* Analytics Cards */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="text-center">
                <h3 className="text-lg font-semibold text-secondary">Collection Rate</h3>
                <div className="relative w-32 h-32 mx-auto">
                  <svg className="w-32 h-32" viewBox="0 0 42 42">
                    <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="hsl(var(--muted))" strokeWidth="3"/>
                    <circle 
                      cx="21" 
                      cy="21" 
                      r="15.91549430918954" 
                      fill="transparent" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth="3"
                      strokeDasharray={`${analytics.collectionRate} ${100 - analytics.collectionRate}`}
                      strokeDashoffset="25"
                      className="transition-all duration-300"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">{analytics.collectionRate}%</span>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <span className="text-sm">Collected: ₹{stats.collected.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm">Pending: ₹{stats.pending.toLocaleString()}</span>
                  </div>
                </div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="text-center">
                <h3 className="text-lg font-semibold text-secondary">Pending Rent</h3>
                <p className="text-3xl font-bold text-orange-500">₹{stats.pending.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{analytics.pendingTenants} tenants</p>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="text-center">
                <h3 className="text-lg font-semibold text-secondary">Overdue</h3>
                <p className="text-3xl font-bold text-destructive">₹{stats.overdue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{filteredRecords.filter(r => r.status === 'overdue').length} tenants</p>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Rent Management */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-semibold">Rent Management</h2>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <div data-payment-dialog>
                  <PaymentEntryDialog onPaymentAdded={handlePaymentAdded} />
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search tenants..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-[200px]"
                  />
                </div>
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full sm:w-[150px]"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[120px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">Loading rent records...</div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No rent records found</div>
              ) : (
                filteredRecords.map((record) => (
                  <div 
                    key={record.id} 
                    className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                      record.status === 'overdue' ? 'border-destructive bg-destructive/5' : 
                      record.status === 'pending' ? 'border-destructive bg-destructive/5 cursor-pointer hover:bg-destructive/10' : ''
                    }`}
                    onClick={record.status !== 'paid' ? () => {
                      // Create an event with tenant data
                      const event = new CustomEvent('openPaymentDialog', {
                        detail: {
                          tenantId: record.tenant_id,
                          tenantName: record.tenants.full_name,
                          roomNumber: record.tenants.rooms.room_number,
                          rentAmount: record.amount,
                          paymentMonth: selectedMonth
                        }
                      });
                      window.dispatchEvent(event);
                    } : undefined}
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarFallback>
                          {getInitials(record.tenants.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{record.tenants.full_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Room {record.tenants.rooms.room_number} • Due: {new Date(record.due_date).toLocaleDateString()}
                        </p>
                        {record.latest_payment && (
                          <p className="text-xs text-green-600">
                            Paid: ₹{record.latest_payment.rent_amount} on {new Date(record.latest_payment.payment_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium">₹{record.amount.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Monthly Rent</p>
                        {record.latest_payment && (record.latest_payment.deposit_amount > 0 || record.latest_payment.other_charges > 0) && (
                          <p className="text-xs text-muted-foreground">
                            {record.latest_payment.deposit_amount > 0 && `Deposit: ₹${record.latest_payment.deposit_amount}`}
                            {record.latest_payment.other_charges > 0 && ` • Other: ₹${record.latest_payment.other_charges}`}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(record.status)}
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleGenerateReceipt(record.id)}>
                          Receipt
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}