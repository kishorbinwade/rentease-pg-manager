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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { FileUploadSecurity } from "@/components/FileUploadSecurity";

const Tenants = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
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
  
  const [editTenant, setEditTenant] = useState<{
    id: string;
    full_name: string;
    email: string;
    phone: string;
    room_id: string;
    join_date: string;
    status: "active" | "notice_period" | "inactive";
  }>({
    id: "",
    full_name: "",
    email: "",
    phone: "",
    room_id: "",
    join_date: "",
    status: "active"
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

  const validateAndSanitizeInput = (input: string, fieldName: string): string => {
    if (!input || typeof input !== 'string') {
      throw new Error(`${fieldName} is required`);
    }
    
    // Basic XSS prevention - remove script tags and dangerous content
    const sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
    
    // Trim and check length
    const trimmed = sanitized.trim();
    if (trimmed.length === 0) {
      throw new Error(`${fieldName} cannot be empty`);
    }
    
    return trimmed;
  };

  const validateFile = (file: File, maxSize: number = 10485760): void => {
    // File size validation (10MB default)
    if (file.size > maxSize) {
      throw new Error('File size exceeds maximum limit of 10MB');
    }
    
    // File type validation
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not allowed. Only images, PDF, and Word documents are permitted');
    }
    
    // File name validation
    if (/[<>:"/\\|?*]/.test(file.name)) {
      throw new Error('File name contains invalid characters');
    }
  };

  const handleAddTenant = async () => {
    try {
      // Validate and sanitize all inputs
      const sanitizedData = {
        fullName: validateAndSanitizeInput(newTenant.full_name, 'Full name'),
        email: validateAndSanitizeInput(newTenant.email, 'Email'),
        phone: validateAndSanitizeInput(newTenant.phone, 'Phone'),
        roomId: newTenant.room_id,
        joinDate: newTenant.join_date,
        idProofType: newTenant.id_proof_type
      };

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(sanitizedData.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Phone format validation (basic)
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(sanitizedData.phone.replace(/[\s\-\(\)]/g, ''))) {
        throw new Error('Please enter a valid phone number');
      }

      if (!sanitizedData.roomId || !sanitizedData.joinDate || !sanitizedData.idProofType) {
        throw new Error('Please fill in all required fields');
      }

      if (!newTenant.id_proof_file || !newTenant.agreement_file) {
        throw new Error('ID proof and agreement files are mandatory');
      }

      // Validate files before upload
      try {
        validateFile(newTenant.id_proof_file);
        validateFile(newTenant.agreement_file);
      } catch (fileError) {
        throw new Error(`File validation failed: ${fileError.message}`);
      }

      let id_proof_url = null;
      let agreement_url = null;

      // Upload ID proof with security measures
      if (newTenant.id_proof_file) {
        const idProofExtension = newTenant.id_proof_file.name.split('.').pop();
        const sanitizedName = sanitizedData.fullName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const idProofFileName = `${Date.now()}-${sanitizedName}-${sanitizedData.idProofType}.${idProofExtension}`;
        
        const { data: idProofData, error: idProofError } = await supabase.storage
          .from('tenant-id-proofs')
          .upload(idProofFileName, newTenant.id_proof_file, {
            upsert: false // Prevent overwriting for security
          });

        if (idProofError) throw new Error(`ID proof upload failed: ${idProofError.message}`);
        id_proof_url = idProofData?.path;
      }

      // Upload agreement with security measures
      if (newTenant.agreement_file) {
        const agreementExtension = newTenant.agreement_file.name.split('.').pop();
        const sanitizedName = sanitizedData.fullName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const agreementFileName = `${Date.now()}-${sanitizedName}-agreement.${agreementExtension}`;
        
        const { data: agreementData, error: agreementError } = await supabase.storage
          .from('agreements')
          .upload(agreementFileName, newTenant.agreement_file, {
            upsert: false // Prevent overwriting for security
          });

        if (agreementError) throw new Error(`Agreement upload failed: ${agreementError.message}`);
        agreement_url = agreementData?.path;
      }

      // Insert tenant with sanitized data and proper user association
      const { error } = await supabase
        .from('tenants')
        .insert({
          full_name: sanitizedData.fullName,
          email: sanitizedData.email,
          phone: sanitizedData.phone,
          room_id: sanitizedData.roomId,
          join_date: sanitizedData.joinDate,
          owner_id: user?.id,
          user_id: user?.id, // Ensure RLS compliance
          id_proof_url,
          agreement_url,
          status: 'active'
        });

      if (error) throw error;

      // Check if room is now at full capacity and update status accordingly
      const { data: roomData } = await supabase
        .from('room_availability')
        .select('available_beds')
        .eq('id', sanitizedData.roomId)
        .single();

      if (roomData && roomData.available_beds === 0) {
        await supabase
          .from('rooms')
          .update({ status: 'occupied' })
          .eq('id', sanitizedData.roomId);
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
      const errorMessage = error?.message || "Failed to add tenant";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error('Error adding tenant:', error);
    }
  };

  const handleEditTenant = (tenant: any) => {
    setEditTenant({
      id: tenant.id,
      full_name: tenant.full_name,
      email: tenant.email,
      phone: tenant.phone,
      room_id: tenant.room_id,
      join_date: tenant.join_date,
      status: tenant.status as "active" | "notice_period" | "inactive"
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateTenant = async () => {
    try {
      // Validate and sanitize inputs
      const sanitizedData = {
        fullName: validateAndSanitizeInput(editTenant.full_name, 'Full name'),
        email: validateAndSanitizeInput(editTenant.email, 'Email'),
        phone: validateAndSanitizeInput(editTenant.phone, 'Phone'),
        status: editTenant.status
      };

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(sanitizedData.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Phone format validation (basic)
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(sanitizedData.phone.replace(/[\s\-\(\)]/g, ''))) {
        throw new Error('Please enter a valid phone number');
      }

      const { error } = await supabase
        .from('tenants')
        .update({
          full_name: sanitizedData.fullName,
          email: sanitizedData.email,
          phone: sanitizedData.phone,
          status: sanitizedData.status
        })
        .eq('id', editTenant.id)
        .eq('owner_id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tenant updated successfully",
      });

      setIsEditDialogOpen(false);
      fetchTenants();
    } catch (error) {
      const errorMessage = error?.message || "Failed to update tenant";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (tenant: any) => {
    setSelectedTenant(tenant);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', selectedTenant.id)
        .eq('owner_id', user?.id);

      if (error) throw error;

      // Check if room is now empty and update status accordingly
      if (selectedTenant.room_id) {
        const { data: roomData } = await supabase
          .from('room_availability')
          .select('capacity, current_occupancy')
          .eq('id', selectedTenant.room_id)
          .single();

        if (roomData && roomData.current_occupancy === 0) {
          await supabase
            .from('rooms')
            .update({ status: 'vacant' })
            .eq('id', selectedTenant.room_id);
        }
      }

      toast({
        title: "Success",
        description: "Tenant deleted successfully",
      });

      setIsDeleteDialogOpen(false);
      setSelectedTenant(null);
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
                  <div className="col-span-3 space-y-2">
                    <Input 
                      id="idProof" 
                      type="file" 
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                      onChange={(e) => setNewTenant({...newTenant, id_proof_file: e.target.files[0]})}
                    />
                    <FileUploadSecurity />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="agreement" className="text-right">Agreement *</Label>
                  <div className="col-span-3 space-y-2">
                    <Input 
                      id="agreement" 
                      type="file" 
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setNewTenant({...newTenant, agreement_file: e.target.files[0]})}
                    />
                    <FileUploadSecurity acceptedTypes={['.pdf', '.doc', '.docx']} />
                  </div>
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleEditTenant(tenant)}
                  >
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
                    onClick={() => handleDeleteClick(tenant)}
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

        {/* Edit Tenant Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Tenant</DialogTitle>
              <DialogDescription>
                Update tenant information. Note: Room and join date cannot be changed.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">Full Name *</Label>
                <Input 
                  id="edit-name" 
                  placeholder="John Doe" 
                  className="col-span-3"
                  value={editTenant.full_name}
                  onChange={(e) => setEditTenant({...editTenant, full_name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">Email *</Label>
                <Input 
                  id="edit-email" 
                  type="email" 
                  placeholder="john@email.com" 
                  className="col-span-3"
                  value={editTenant.email}
                  onChange={(e) => setEditTenant({...editTenant, email: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-phone" className="text-right">Phone *</Label>
                <Input 
                  id="edit-phone" 
                  placeholder="+91 9876543210" 
                  className="col-span-3"
                  value={editTenant.phone}
                  onChange={(e) => setEditTenant({...editTenant, phone: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-status" className="text-right">Status *</Label>
                <Select value={editTenant.status} onValueChange={(value: "active" | "notice_period" | "inactive") => setEditTenant({...editTenant, status: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="notice_period">Notice Period</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateTenant}>
                Update Tenant
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Tenant</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this tenant? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default Tenants;