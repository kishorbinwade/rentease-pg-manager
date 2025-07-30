import { useState } from "react";
import { Plus, Search, Edit, Trash2, Phone, Mail, Calendar, FileText } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Tenants = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Mock data - replace with real data from Supabase
  const tenants = [
    {
      id: 1,
      name: "Rahul Sharma",
      email: "rahul.sharma@email.com",
      phone: "+91 9876543210",
      room: "A-101",
      joinDate: "2024-01-15",
      endDate: "2024-07-15",
      status: "active",
      idProof: "Aadhar Card",
      emergencyContact: "+91 9876543200"
    },
    {
      id: 2,
      name: "Priya Singh",
      email: "priya.singh@email.com",
      phone: "+91 9876543211",
      room: "B-203",
      joinDate: "2024-01-10",
      endDate: "2024-07-10",
      status: "active",
      idProof: "Driving License",
      emergencyContact: "+91 9876543201"
    },
    {
      id: 3,
      name: "Amit Kumar",
      email: "amit.kumar@email.com",
      phone: "+91 9876543212",
      room: "C-305",
      joinDate: "2024-01-08",
      endDate: "2024-07-08",
      status: "active",
      idProof: "Passport",
      emergencyContact: "+91 9876543202"
    },
    {
      id: 4,
      name: "Sneha Patel",
      email: "sneha.patel@email.com",
      phone: "+91 9876543213",
      room: "A-102",
      joinDate: "2023-12-01",
      endDate: "2024-06-01",
      status: "notice_period",
      idProof: "Aadhar Card",
      emergencyContact: "+91 9876543203"
    }
  ];

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.room.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success text-success-foreground">Active</Badge>;
      case "notice_period":
        return <Badge className="bg-warning text-warning-foreground">Notice Period</Badge>;
      case "inactive":
        return <Badge variant="outline">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const AddTenantDialog = () => (
    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Tenant
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Tenant</DialogTitle>
          <DialogDescription>
            Add a new tenant to your PG. Fill in all required details.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Full Name
            </Label>
            <Input id="name" placeholder="John Doe" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input id="email" type="email" placeholder="john@email.com" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Phone
            </Label>
            <Input id="phone" placeholder="+91 9876543210" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="room" className="text-right">
              Room
            </Label>
            <Select>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select room" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A-102">A-102 (Vacant)</SelectItem>
                <SelectItem value="B-204">B-204 (Vacant)</SelectItem>
                <SelectItem value="C-306">C-306 (Vacant)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="joinDate" className="text-right">
              Join Date
            </Label>
            <Input id="joinDate" type="date" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endDate" className="text-right">
              End Date
            </Label>
            <Input id="endDate" type="date" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="idProof" className="text-right">
              ID Proof
            </Label>
            <Select>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select ID type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aadhar">Aadhar Card</SelectItem>
                <SelectItem value="passport">Passport</SelectItem>
                <SelectItem value="driving">Driving License</SelectItem>
                <SelectItem value="voter">Voter ID</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="emergency" className="text-right">
              Emergency Contact
            </Label>
            <Input id="emergency" placeholder="+91 9876543200" className="col-span-3" />
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setIsAddDialogOpen(false)}>
            Add Tenant
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="min-h-screen bg-muted">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Tenant Management</h1>
            <p className="text-muted-foreground">Manage tenant information and track their stay</p>
          </div>
          <AddTenantDialog />
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search tenants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tenants</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="notice_period">Notice Period</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tenants Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTenants.map((tenant) => (
            <Card key={tenant.id} className="shadow-soft hover:shadow-medium transition-shadow">
              <CardHeader className="flex flex-row items-center space-y-0 pb-4">
                <Avatar className="h-12 w-12 mr-4">
                  <AvatarFallback>{getInitials(tenant.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">{tenant.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">Room {tenant.room}</p>
                </div>
                {getStatusBadge(tenant.status)}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{tenant.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{tenant.phone}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Join Date</p>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span>{new Date(tenant.joinDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">End Date</p>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span>{new Date(tenant.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>ID: {tenant.idProof}</span>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <FileText className="mr-1 h-3 w-3" />
                    Agreement
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-card shadow-soft">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-foreground mb-1">
                {tenants.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Tenants</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card shadow-soft">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-success-foreground mb-1">
                {tenants.filter(t => t.status === "active").length}
              </div>
              <div className="text-sm text-muted-foreground">Active</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card shadow-soft">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-warning-foreground mb-1">
                {tenants.filter(t => t.status === "notice_period").length}
              </div>
              <div className="text-sm text-muted-foreground">Notice Period</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card shadow-soft">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary mb-1">
                {Math.round(tenants.filter(t => t.status === "active").length / tenants.length * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Retention Rate</div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Tenants;