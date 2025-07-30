import { useState } from "react";
import { Search, DollarSign, Calendar, Download, CheckCircle, XCircle, Clock } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import StatsCard from "@/components/StatsCard";

const Rent = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("2024-07");

  // Mock data - replace with real data from Supabase
  const rentRecords = [
    {
      id: 1,
      tenant: "Rahul Sharma",
      room: "A-101",
      amount: 8000,
      dueDate: "2024-07-01",
      paidDate: "2024-07-02",
      status: "paid",
      month: "2024-07",
      lateFee: 0
    },
    {
      id: 2,
      tenant: "Priya Singh",
      room: "B-203",
      amount: 12000,
      dueDate: "2024-07-01",
      paidDate: "2024-06-30",
      status: "paid",
      month: "2024-07",
      lateFee: 0
    },
    {
      id: 3,
      tenant: "Amit Kumar",
      room: "C-305",
      amount: 15000,
      dueDate: "2024-07-01",
      paidDate: null,
      status: "pending",
      month: "2024-07",
      lateFee: 100
    },
    {
      id: 4,
      tenant: "Sneha Patel",
      room: "A-102",
      amount: 8000,
      dueDate: "2024-07-01",
      paidDate: null,
      status: "overdue",
      month: "2024-07",
      lateFee: 200
    }
  ];

  const filteredRecords = rentRecords.filter(record =>
    record.tenant.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.room.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalRent: rentRecords.reduce((sum, record) => sum + record.amount + record.lateFee, 0),
    collected: rentRecords.filter(r => r.status === "paid").reduce((sum, record) => sum + record.amount, 0),
    pending: rentRecords.filter(r => r.status === "pending").reduce((sum, record) => sum + record.amount + record.lateFee, 0),
    overdue: rentRecords.filter(r => r.status === "overdue").reduce((sum, record) => sum + record.amount + record.lateFee, 0)
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

  const handleMarkPaid = (recordId: number) => {
    // Handle marking rent as paid
    console.log("Mark as paid:", recordId);
  };

  const handleGenerateReceipt = (recordId: number) => {
    // Handle generating receipt
    console.log("Generate receipt:", recordId);
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
            title="Total Rent"
            value={`₹${stats.totalRent.toLocaleString()}`}
            icon={DollarSign}
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
            value={`₹${stats.pending.toLocaleString()}`}
            icon={Clock}
            color="warning"
          />
          <StatsCard
            title="Overdue"
            value={`₹${stats.overdue.toLocaleString()}`}
            icon={XCircle}
            color="warning"
          />
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
          <Select>
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
              <span>Rent Records - {new Date(selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{getInitials(record.tenant)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{record.tenant}</p>
                      <p className="text-sm text-muted-foreground">Room {record.room}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        ₹{(record.amount + record.lateFee).toLocaleString()}
                      </p>
                      {record.lateFee > 0 && (
                        <p className="text-xs text-destructive">+₹{record.lateFee} late fee</p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Due: {new Date(record.dueDate).toLocaleDateString()}</p>
                      {record.paidDate && (
                        <p className="text-sm text-success">Paid: {new Date(record.paidDate).toLocaleDateString()}</p>
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
          </CardContent>
        </Card>

        {/* Collection Rate */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-card shadow-soft">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-success-foreground mb-1">
                {Math.round((stats.collected / stats.totalRent) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Collection Rate</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card shadow-soft">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-foreground mb-1">
                {rentRecords.filter(r => r.status === "paid").length}/{rentRecords.length}
              </div>
              <div className="text-sm text-muted-foreground">Tenants Paid</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card shadow-soft">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-destructive mb-1">
                {rentRecords.filter(r => r.status === "overdue").length}
              </div>
              <div className="text-sm text-muted-foreground">Overdue Accounts</div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Rent;