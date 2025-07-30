import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Phone, Mail, Calendar, FileText, Download, Eye } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Tenants = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTenant, setNewTenant] = useState({
    full_name: "",
    email: "",
    phone: "",
    room_id: "",
    join_date: "",
    id_proof_type: "",
    id_proof_file: null,
    agreement_file: null
  });

  useEffect(() => {
    if (user) {
      fetchTenants();
      fetchRooms();
    }
  }, [user]);

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*, rooms(room_number)')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch tenants",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('room_availability')
        .select('*')
        .eq('owner_id', user?.id)
        .gt('available_beds', 0);

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const handleAddTenant = async () => {
    try {
      if (!newTenant.full_name || !newTenant.email || !newTenant.phone || !newTenant.room_id) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      if (!newTenant.id_proof_file || !newTenant.agreement_file) {
        toast({
          title: "Error",
          description: "ID proof and agreement files are mandatory",
          variant: "destructive",
        });
        return;
      }

      let id_proof_url = null;
      let agreement_url = null;

      // Upload ID proof
      if (newTenant.id_proof_file) {
        const idProofExtension = newTenant.id_proof_file.name.split('.').pop();
        const idProofFileName = `${newTenant.full_name.toLowerCase().replace(/\s+/g, '-')}-${newTenant.id_proof_type}.${idProofExtension}`;
        
        const { data: idProofData, error: idProofError } = await supabase.storage
          .from('tenant-id-proofs')
          .upload(idProofFileName, newTenant.id_proof_file, {
            upsert: true
          });

        if (idProofError) throw idProofError;
        id_proof_url = idProofData?.path;
      }

      // Upload agreement
      if (newTenant.agreement_file) {
        const agreementExtension = newTenant.agreement_file.name.split('.').pop();
        const agreementFileName = `${newTenant.full_name.toLowerCase().replace(/\s+/g, '-')}-agreement.${agreementExtension}`;
        
        const { data: agreementData, error: agreementError } = await supabase.storage
          .from('agreements')
          .upload(agreementFileName, newTenant.agreement_file, {
            upsert: true
          });

        if (agreementError) throw agreementError;
        agreement_url = agreementData?.path;
      }

      // Insert tenant
      const { error } = await supabase
        .from('tenants')
        .insert({
          full_name: newTenant.full_name,
          email: newTenant.email,
          phone: newTenant.phone,
          room_id: newTenant.room_id,
          join_date: newTenant.join_date,
          owner_id: user?.id,
          id_proof_url,
          agreement_url,
          status: 'active'
        });

      if (error) throw error;

      // Check if room is now at full capacity and update status accordingly
      const { data: roomData } = await supabase
        .from('room_availability')
        .select('available_beds')
        .eq('id', newTenant.room_id)
        .single();

      if (roomData && roomData.available_beds === 0) {
        await supabase
          .from('rooms')
          .update({ status: 'occupied' })
          .eq('id', newTenant.room_id);
      }

      toast({
        title: "Success",
        description: "Tenant added successfully",
      });

      setNewTenant({
        full_name: "",
        email: "",
        phone: "",
        room_id: "",
        join_date: "",
        id_proof_type: "",
        id_proof_file: null,
        agreement_file: null
      });
      setIsAddDialogOpen(false);
      fetchTenants();
      fetchRooms();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add tenant",
        variant: "destructive",
      });
      console.error('Error adding tenant:', error);
    }
  };

  const handleDeleteTenant = async (tenantId, roomId) => {
    try {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', tenantId);

      if (error) throw error;

      // Check if room is now empty and update status accordingly
      if (roomId) {
        const { data: roomData } = await supabase
          .from('room_availability')
          .select('capacity, current_occupancy')
          .eq('id', roomId)
          .single();

        if (roomData && roomData.current_occupancy === 0) {
          await supabase
            .from('rooms')
            .update({ status: 'vacant' })
            .eq('id', roomId);
        }
      }

      toast({
        title: "Success",
        description: "Tenant deleted successfully",
      });

      fetchTenants();
      fetchRooms();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete tenant",
        variant: "destructive",
      });
    }
  };

  const downloadFile = async (bucketName, filePath, fileName) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const viewFile = async (bucketName, filePath) => {
    try {
      const { data } = await supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      if (data?.publicUrl) {
        window.open(data.publicUrl, '_blank');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to view file",
        variant: "destructive",
      });
    }
  };

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || tenant.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
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

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
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
            <h1 className="text-3xl font-bold text-foreground mb-2">Tenant Management</h1>
            <p className="text-muted-foreground">Manage tenant information and track their stay</p>
          </div>
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
                  <Label htmlFor="name" className="text-right">Full Name *</Label>
                  <Input 
                    id="name" 
                    placeholder="John Doe" 
                    className="col-span-3"
                    value={newTenant.full_name}
                    onChange={(e) => setNewTenant({...newTenant, full_name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">Email *</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="john@email.com" 
                    className="col-span-3"
                    value={newTenant.email}
                    onChange={(e) => setNewTenant({...newTenant, email: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">Phone *</Label>
                  <Input 
                    id="phone" 
                    placeholder="+91 9876543210" 
                    className="col-span-3"
                    value={newTenant.phone}
                    onChange={(e) => setNewTenant({...newTenant, phone: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="room" className="text-right">Room *</Label>
                  <Select value={newTenant.room_id} onValueChange={(value) => setNewTenant({...newTenant, room_id: value})}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map(room => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.room_number} ({room.room_type}) - {room.available_beds} bed{room.available_beds > 1 ? 's' : ''} available
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="joinDate" className="text-right">Join Date *</Label>
                  <Input 
                    id="joinDate" 
                    type="date" 
                    className="col-span-3"
                    value={newTenant.join_date}
                    onChange={(e) => setNewTenant({...newTenant, join_date: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="idProofType" className="text-right">ID Proof Type *</Label>
                  <Select value={newTenant.id_proof_type} onValueChange={(value) => setNewTenant({...newTenant, id_proof_type: value})}>
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
                  <Label htmlFor="idProof" className="text-right">ID Proof File *</Label>
                  <Input 
                    id="idProof" 
                    type="file" 
                    accept="image/*,.pdf"
                    className="col-span-3"
                    onChange={(e) => setNewTenant({...newTenant, id_proof_file: e.target.files[0]})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="agreement" className="text-right">Agreement *</Label>
                  <Input 
                    id="agreement" 
                    type="file" 
                    accept="image/*,.pdf"
                    className="col-span-3"
                    onChange={(e) => setNewTenant({...newTenant, agreement_file: e.target.files[0]})}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddTenant}>
                  Add Tenant
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
              placeholder="Search tenants..."
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
                  <AvatarFallback>{getInitials(tenant.full_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">{tenant.full_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Room {tenant.rooms?.room_number || 'Unknown'}
                  </p>
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
                      <span>{new Date(tenant.join_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Created</p>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span>{new Date(tenant.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {tenant.id_proof_url && (
                  <div className="flex items-center space-x-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>ID Proof Available</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => viewFile('tenant-id-proofs', tenant.id_proof_url)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadFile('tenant-id-proofs', tenant.id_proof_url, `${tenant.full_name}-id-proof`)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  {tenant.agreement_url && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => downloadFile('agreements', tenant.agreement_url, `${tenant.full_name}-agreement`)}
                    >
                      <FileText className="mr-1 h-3 w-3" />
                      Agreement
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteTenant(tenant.id, tenant.room_id)}
                  >
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
                {tenants.length > 0 ? Math.round(tenants.filter(t => t.status === "active").length / tenants.length * 100) : 0}%
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