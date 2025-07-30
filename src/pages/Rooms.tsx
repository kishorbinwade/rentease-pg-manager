import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, User, DollarSign } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Rooms = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newRoom, setNewRoom] = useState({
    room_number: "",
    room_type: "",
    rent_amount: "",
    floor: ""
  });

  useEffect(() => {
    if (user) {
      fetchRooms();
    }
  }, [user]);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          *,
          tenants(
            full_name,
            phone
          )
        `)
        .eq('owner_id', user?.id)
        .order('room_number');

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
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
      if (!newRoom.room_number || !newRoom.room_type || !newRoom.rent_amount) {
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
        floor: ""
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

  const handleDeleteRoom = async (roomId) => {
    try {
      // Check if room is occupied
      const room = rooms.find(r => r.id === roomId);
      if (room?.status === 'occupied') {
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
        .eq('id', roomId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Room deleted successfully",
      });

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
    } else if (status === "maintenance") {
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
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <Card key={room.id} className="shadow-soft hover:shadow-medium transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Room {room.room_number}</CardTitle>
                {getStatusBadge(room.status)}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Type</p>
                    <p className="font-medium">{room.room_type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Floor</p>
                    <p className="font-medium">{room.floor || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-success" />
                  <span className="font-semibold text-success">₹{Number(room.rent_amount).toLocaleString()}/month</span>
                </div>

                {room.status === "occupied" && room.tenants?.[0] && (
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{room.tenants[0].full_name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{room.tenants[0].phone}</p>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteRoom(room.id)}
                    disabled={room.status === 'occupied'}
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
                {rooms.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Rooms</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card shadow-soft">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-occupied-foreground mb-1">
                {rooms.filter(r => r.status === "occupied").length}
              </div>
              <div className="text-sm text-muted-foreground">Occupied</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card shadow-soft">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-vacant-foreground mb-1">
                {rooms.filter(r => r.status === "vacant").length}
              </div>
              <div className="text-sm text-muted-foreground">Vacant</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card shadow-soft">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-warning-foreground mb-1">
                {rooms.filter(r => r.status === "maintenance").length}
              </div>
              <div className="text-sm text-muted-foreground">Maintenance</div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Rooms;