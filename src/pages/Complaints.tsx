import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Complaints = () => {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComplaint, setNewComplaint] = useState({
    title: "",
    description: "",
    room_id: "",
    priority: "medium" as "low" | "medium" | "high"
  });

  const isAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    if (user && userProfile) {
      fetchComplaints();
      if (isAdmin) {
        fetchRooms();
      }
    }
  }, [user, userProfile]);

  const fetchComplaints = async () => {
    try {
      let query = supabase
        .from('complaints')
        .select(`
          *,
          rooms(room_number),
          tenants(full_name)
        `)
        .order('created_at', { ascending: false });

      // If admin, show all complaints for their property
      // If tenant, show only their complaints
      if (isAdmin) {
        query = query.eq('owner_id', user?.id);
      } else {
        // Get tenant record first
        const { data: tenantData } = await supabase
          .from('tenants')
          .select('id')
          .eq('user_id', user?.id)
          .single();

        if (tenantData) {
          query = query.eq('tenant_id', tenantData.id);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setComplaints(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch complaints",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('owner_id', user?.id);

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const handleAddComplaint = async () => {
    try {
      if (!newComplaint.title || !newComplaint.description) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      let tenantId = null;
      let ownerId = user?.id;
      let roomId = newComplaint.room_id;

      if (!isAdmin) {
        // For tenants, get their tenant record
        const { data: tenantData } = await supabase
          .from('tenants')
          .select('id, room_id, owner_id')
          .eq('user_id', user?.id)
          .single();

        if (tenantData) {
          tenantId = tenantData.id;
          ownerId = tenantData.owner_id;
          roomId = tenantData.room_id;
        }
      }

      const { error } = await supabase
        .from('complaints')
        .insert({
          title: newComplaint.title,
          description: newComplaint.description,
          room_id: roomId || null,
          tenant_id: tenantId,
          owner_id: ownerId,
          priority: newComplaint.priority as "low" | "medium" | "high",
          status: 'open' as "open" | "in_progress" | "resolved"
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Complaint submitted successfully",
      });

      setNewComplaint({
        title: "",
        description: "",
        room_id: "",
        priority: "medium" as "low" | "medium" | "high"
      });
      setIsAddDialogOpen(false);
      fetchComplaints();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit complaint",
        variant: "destructive",
      });
      console.error('Error adding complaint:', error);
    }
  };

  const updateComplaintStatus = async (complaintId, newStatus) => {
    try {
      const { error } = await supabase
        .from('complaints')
        .update({ status: newStatus })
        .eq('id', complaintId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Complaint status updated",
      });

      fetchComplaints();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update complaint status",
        variant: "destructive",
      });
    }
  };

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (complaint.tenants?.full_name && complaint.tenants.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (complaint.rooms?.room_number && complaint.rooms.room_number.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || complaint.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || complaint.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "open":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Open</Badge>;
      case "in_progress":
        return <Badge className="bg-warning/10 text-warning border-warning/20">In Progress</Badge>;
      case "resolved":
        return <Badge className="bg-success/10 text-success border-success/20">Resolved</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority) => {
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

  const getStatusIcon = (status) => {
    switch (status) {
      case "open":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-warning" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-success" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
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
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Complaint Management</h1>
            <p className="text-muted-foreground">Track and resolve tenant complaints efficiently</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Complaint
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Submit New Complaint</DialogTitle>
                <DialogDescription>
                  Submit a new complaint for review and resolution.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">Title *</Label>
                  <Input 
                    id="title" 
                    placeholder="Brief description of the issue" 
                    className="col-span-3"
                    value={newComplaint.title}
                    onChange={(e) => setNewComplaint({...newComplaint, title: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="description" className="text-right pt-2">Description *</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Detailed description of the complaint"
                    className="col-span-3"
                    rows={4}
                    value={newComplaint.description}
                    onChange={(e) => setNewComplaint({...newComplaint, description: e.target.value})}
                  />
                </div>
                {isAdmin && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="room" className="text-right">Room</Label>
                    <Select value={newComplaint.room_id} onValueChange={(value) => setNewComplaint({...newComplaint, room_id: value})}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select room (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map(room => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.room_number} ({room.room_type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="priority" className="text-right">Priority</Label>
                  <Select value={newComplaint.priority} onValueChange={(value: "low" | "medium" | "high") => setNewComplaint({...newComplaint, priority: value})}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddComplaint}>
                  Submit Complaint
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
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
          {filteredComplaints.length === 0 ? (
            <Card className="shadow-soft">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No complaints found</p>
              </CardContent>
            </Card>
          ) : (
            filteredComplaints.map((complaint) => (
              <Card key={complaint.id} className="shadow-soft hover:shadow-medium transition-shadow">
                <CardHeader className="flex flex-row items-start justify-between pb-3">
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(complaint.status)}
                    <div>
                      <CardTitle className="text-lg">{complaint.title}</CardTitle>
                      <div className="flex items-center space-x-4 mt-1">
                        {complaint.tenants?.full_name && (
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{complaint.tenants.full_name}</span>
                          </div>
                        )}
                        {complaint.rooms?.room_number && (
                          <span className="text-sm text-muted-foreground">Room {complaint.rooms.room_number}</span>
                        )}
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
                      Submitted: {new Date(complaint.created_at).toLocaleDateString()} • 
                      Last updated: {new Date(complaint.updated_at).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-2">
                      {isAdmin && (
                        <Select
                          value={complaint.status}
                          onValueChange={(value) => updateComplaintStatus(complaint.id, value)}
                        >
                          <SelectTrigger className="w-[140px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
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
                {complaints.filter(c => c.status === "in_progress").length}
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