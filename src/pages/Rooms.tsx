import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, User, IndianRupee, Users, Bed } from "lucide-react";
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
import { RoomEditDialog } from "@/components/RoomEditDialog";

const Rooms = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isTenantDialogOpen, setIsTenantDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newRoom, setNewRoom] = useState({
    room_number: "",
    room_type: "",
    rent_amount: "",
    floor: "",
    capacity: ""
  });
  const [editRoom, setEditRoom] = useState({
    id: "",
    room_number: "",
    room_type: "",
    rent_amount: "",
    floor: "",
    capacity: "",
    status: "vacant" as "occupied" | "vacant" | "under_maintenance"
  });

  useEffect(() => {
    if (user) {
      fetchRooms();
    }
  }, [user]);

  const fetchRooms = async () => {
    try {
      // First, fetch all rooms for the owner
      const { data: allRooms, error: allRoomsError } = await supabase
        .from('rooms')
        .select('*')
        .eq('owner_id', user?.id)
        .order('room_number');

      if (allRoomsError) throw allRoomsError;

      // Then, fetch all active tenants for these rooms
      const { data: activeTenants, error: tenantsError } = await supabase
        .from('tenants')
        .select(`
          id,
          full_name,
          phone,
          email,
          status,
          room_id
        `)
        .eq('owner_id', user?.id)
        .eq('status', 'active');

      if (tenantsError) throw tenantsError;

      // Combine rooms with their active tenants
      const roomsWithTenants = allRooms?.map(room => ({
        ...room,
        tenants: activeTenants?.filter(tenant => tenant.room_id === room.id) || []
      })) || [];

      setRooms(roomsWithTenants);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({
        title: "Error",
        description: "Failed to fetch rooms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = async () => {
    try {
      if (!newRoom.room_number || !newRoom.room_type || !newRoom.rent_amount || !newRoom.capacity) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('rooms')
        .insert({
          room_number: newRoom.room_number,
          room_type: newRoom.room_type,
          rent_amount: parseFloat(newRoom.rent_amount),
          floor: newRoom.floor ? parseInt(newRoom.floor) : null,
          capacity: parseInt(newRoom.capacity),
          owner_id: user?.id,
          status: 'vacant'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Room added successfully",
      });

      setNewRoom({
        room_number: "",
        room_type: "",
        rent_amount: "",
        floor: "",
        capacity: ""
      });
      setIsAddDialogOpen(false);
      fetchRooms();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add room",
        variant: "destructive",
      });
      console.error('Error adding room:', error);
    }
  };

  const handleEditRoom = async () => {
    try {
      if (!editRoom.room_number || !editRoom.room_type || !editRoom.rent_amount || !editRoom.capacity) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('rooms')
        .update({
          room_number: editRoom.room_number,
          room_type: editRoom.room_type,
          rent_amount: parseFloat(editRoom.rent_amount),
          floor: editRoom.floor ? parseInt(editRoom.floor) : null,
          capacity: parseInt(editRoom.capacity),
          status: editRoom.status as "occupied" | "vacant" | "under_maintenance"
        })
        .eq('id', editRoom.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Room updated successfully",
      });

      setIsEditDialogOpen(false);
      fetchRooms();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update room",
        variant: "destructive",
      });
      console.error('Error updating room:', error);
    }
  };

  const openEditDialog = (room) => {
    setEditingRoom(room);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (room) => {
    setSelectedRoom(room);
    setIsDeleteDialogOpen(true);
  };

  const openTenantDialog = (room) => {
    setSelectedRoom(room);
    setIsTenantDialogOpen(true);
  };

  const handleDeleteRoom = async () => {
    try {
      if (selectedRoom?.status === 'occupied') {
        toast({
          title: "Error",
          description: "Cannot delete an occupied room",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', selectedRoom.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Room deleted successfully",
      });

      setIsDeleteDialogOpen(false);
      fetchRooms();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete room",
        variant: "destructive",
      });
    }
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.room_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (room.tenants?.[0]?.full_name && room.tenants[0].full_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || room.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    if (status === "occupied") {
      return <Badge className="bg-occupied text-occupied-foreground">Occupied</Badge>;
    } else if (status === "under_maintenance") {
      return <Badge className="bg-warning text-warning-foreground">Maintenance</Badge>;
    }
    return <Badge className="bg-vacant text-vacant-foreground">Vacant</Badge>;
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
            <h1 className="text-3xl font-bold text-foreground mb-2">Room Management</h1>
            <p className="text-muted-foreground">Manage your PG rooms and track occupancy</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Room
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Room</DialogTitle>
                <DialogDescription>
                  Add a new room to your PG property. Fill in the details below.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="roomNumber" className="text-right">Room Number *</Label>
                  <Input 
                    id="roomNumber" 
                    placeholder="A-101" 
                    className="col-span-3"
                    value={newRoom.room_number}
                    onChange={(e) => setNewRoom({...newRoom, room_number: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="roomType" className="text-right">Type *</Label>
                  <Select value={newRoom.room_type} onValueChange={(value) => setNewRoom({...newRoom, room_type: value})}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select room type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single">Single</SelectItem>
                      <SelectItem value="Double">Double</SelectItem>
                      <SelectItem value="Triple">Triple</SelectItem>
                      <SelectItem value="Dormitory">Dormitory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="rent" className="text-right">Rent (₹) *</Label>
                  <Input 
                    id="rent" 
                    type="number" 
                    placeholder="8000" 
                    className="col-span-3"
                    value={newRoom.rent_amount}
                    onChange={(e) => setNewRoom({...newRoom, rent_amount: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="capacity" className="text-right">Capacity *</Label>
                  <Input 
                    id="capacity" 
                    type="number" 
                    placeholder="2" 
                    className="col-span-3"
                    value={newRoom.capacity}
                    onChange={(e) => setNewRoom({...newRoom, capacity: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="floor" className="text-right">Floor</Label>
                  <Input 
                    id="floor" 
                    type="number" 
                    placeholder="1" 
                    className="col-span-3"
                    value={newRoom.floor}
                    onChange={(e) => setNewRoom({...newRoom, floor: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddRoom}>
                  Add Room
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
              placeholder="Search rooms, tenants..."
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
              <SelectItem value="all">All Rooms</SelectItem>
              <SelectItem value="vacant">Vacant</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
              <SelectItem value="under_maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => {
            const activeTenants = room.tenants?.filter(t => t.status === 'active') || [];
            const currentOccupancy = activeTenants.length;
            const availableBeds = Math.max(0, (room.capacity || 1) - currentOccupancy);
            const isOccupied = currentOccupancy > 0;
            const isFull = currentOccupancy >= room.capacity;
            
            return (
              <Card 
                key={room.id} 
                className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer"
                onClick={() => openTenantDialog(room)}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">Room {room.room_number}</CardTitle>
                  {room.status === 'under_maintenance' ? (
                    <Badge className="bg-warning text-warning-foreground">Maintenance</Badge>
                  ) : isFull ? (
                    <Badge className="bg-occupied text-occupied-foreground">Full</Badge>
                  ) : isOccupied ? (
                    <Badge className="bg-vacant text-vacant-foreground">
                      Vacant - {availableBeds} Bed{availableBeds !== 1 ? 's' : ''} Available
                    </Badge>
                  ) : (
                    <Badge className="bg-vacant text-vacant-foreground">Vacant</Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium">
                      Capacity: {room.capacity || 1} | Occupied: {currentOccupancy} | Available: {availableBeds}
                    </p>
                    <div className="flex items-center justify-center space-x-2">
                      <IndianRupee className="h-4 w-4 text-success" />
                      <span className="font-semibold text-success">₹{Number(room.rent_amount).toLocaleString()}/month</span>
                    </div>
                  </div>

                  <div className="text-center">
                    {room.status === 'under_maintenance' ? (
                      <Badge className="bg-warning text-warning-foreground">Under Maintenance</Badge>
                    ) : isFull ? (
                      <Badge className="bg-occupied text-occupied-foreground">Full</Badge>
                    ) : isOccupied ? (
                      <Badge className="bg-vacant text-vacant-foreground">
                        Vacant - {availableBeds} Bed{availableBeds !== 1 ? 's' : ''} Available
                      </Badge>
                    ) : (
                      <Badge className="bg-vacant text-vacant-foreground">Vacant</Badge>
                    )}
                  </div>

                  <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => openEditDialog(room)}
                    >
                      <Edit className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => openDeleteDialog(room)}
                      disabled={currentOccupancy > 0}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-card shadow-soft">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-foreground mb-1">
                {rooms.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Rooms</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card shadow-soft">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-occupied-foreground mb-1">
                {rooms.filter(r => {
                  const activeTenants = r.tenants?.filter(t => t.status === 'active') || [];
                  return activeTenants.length >= r.capacity;
                }).length}
              </div>
              <div className="text-sm text-muted-foreground">Full Rooms</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card shadow-soft">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-vacant-foreground mb-1">
                {rooms.filter(r => {
                  const activeTenants = r.tenants?.filter(t => t.status === 'active') || [];
                  return activeTenants.length < r.capacity && r.status !== 'under_maintenance';
                }).length}
              </div>
              <div className="text-sm text-muted-foreground">Available Rooms</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card shadow-soft">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-warning-foreground mb-1">
                {rooms.filter(r => r.status === "under_maintenance").length}
              </div>
              <div className="text-sm text-muted-foreground">Maintenance</div>
            </CardContent>
          </Card>
        </div>

        {/* Room Edit Dialog */}
        <RoomEditDialog
          room={editingRoom}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onUpdate={fetchRooms}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Room</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this room? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteRoom} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete Room
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Tenant Details Dialog */}
        <Dialog open={isTenantDialogOpen} onOpenChange={setIsTenantDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Room {selectedRoom?.room_number} - Tenant Details</DialogTitle>
              <DialogDescription>
                Current tenant information for this room.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {selectedRoom?.tenants && selectedRoom.tenants.length > 0 ? (
                <div className="space-y-4">
                  {selectedRoom.tenants.map((tenant, index) => (
                    <div key={tenant.id} className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{tenant.full_name}</span>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>📱 {tenant.phone}</p>
                        {tenant.email && <p>✉️ {tenant.email}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No tenants in this room</p>
                  <p className="text-sm text-muted-foreground mt-1">This room is currently vacant</p>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setIsTenantDialogOpen(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Rooms;