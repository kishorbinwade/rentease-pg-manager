import { useState } from "react";
import { Search, Plus, AlertCircle, Clock, CheckCircle, User } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Complaints = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Mock data - replace with real data from Supabase
  const complaints = [
    {
      id: 1,
      tenant: "Rahul Sharma",
      room: "A-101",
      issue: "AC not working",
      description: "The air conditioner in my room has stopped working. Please get it repaired.",
      status: "open",
      priority: "high",
      submittedDate: "2024-01-15",
      lastUpdated: "2024-01-15"
    },
    {
      id: 2,
      tenant: "Priya Singh", 
      room: "B-203",
      issue: "WiFi connectivity issues",
      description: "Internet connection is very slow and frequently disconnects.",
      status: "in-progress",
      priority: "medium",
      submittedDate: "2024-01-12",
      lastUpdated: "2024-01-14"
    },
    {
      id: 3,
      tenant: "Amit Kumar",
      room: "C-305", 
      issue: "Water leakage in bathroom",
      description: "There is water leakage from the ceiling in the bathroom.",
      status: "resolved",
      priority: "high",
      submittedDate: "2024-01-10",
      lastUpdated: "2024-01-13"
    }
  ];

  const filteredComplaints = complaints.filter(complaint =>
    complaint.tenant.toLowerCase().includes(searchTerm.toLowerCase()) ||
    complaint.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
    complaint.issue.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Open</Badge>;
      case "in-progress":
        return <Badge className="bg-warning/10 text-warning border-warning/20">In Progress</Badge>;
      case "resolved":
        return <Badge className="bg-success/10 text-success border-success/20">Resolved</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
        return <Badge variant="secondary">Medium</Badge>;
      case "low":
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "in-progress":
        return <Clock className="h-4 w-4 text-warning" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-success" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-muted">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Complaint Management</h1>
            <p className="text-muted-foreground">Track and resolve tenant complaints efficiently</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search complaints, tenants, rooms..."
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
              <SelectItem value="all">All Complaints</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Complaints List */}
        <div className="space-y-4">
          {filteredComplaints.map((complaint) => (
            <Card key={complaint.id} className="shadow-soft hover:shadow-medium transition-shadow">
              <CardHeader className="flex flex-row items-start justify-between pb-3">
                <div className="flex items-start space-x-3">
                  {getStatusIcon(complaint.status)}
                  <div>
                    <CardTitle className="text-lg">{complaint.issue}</CardTitle>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{complaint.tenant}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">Room {complaint.room}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col space-y-2 items-end">
                  {getStatusBadge(complaint.status)}
                  {getPriorityBadge(complaint.priority)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{complaint.description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Submitted: {new Date(complaint.submittedDate).toLocaleDateString()} • 
                    Last updated: {new Date(complaint.lastUpdated).toLocaleDateString()}
                  </div>
                  <div className="flex space-x-2">
                    <Select defaultValue={complaint.status}>
                      <SelectTrigger className="w-[140px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
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
                {complaints.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Complaints</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card shadow-soft">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-destructive mb-1">
                {complaints.filter(c => c.status === "open").length}
              </div>
              <div className="text-sm text-muted-foreground">Open</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card shadow-soft">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-warning mb-1">
                {complaints.filter(c => c.status === "in-progress").length}
              </div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card shadow-soft">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-success mb-1">
                {complaints.filter(c => c.status === "resolved").length}
              </div>
              <div className="text-sm text-muted-foreground">Resolved</div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Complaints;