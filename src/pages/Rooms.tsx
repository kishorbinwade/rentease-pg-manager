import { useState } from "react";
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

const Rooms = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({
    number: "",
    type: "",
    rent: "",
    floor: ""
  });

  // Mock data - replace with real data from Supabase
  const rooms = [
    {
      id: 1,
      number: "A-101",
      type: "Single",
      rent: 8000,
      status: "occupied",
      tenant: "Rahul Sharma",
      tenantPhone: "+91 9876543210",
      floor: 1
    },
    {
      id: 2,
      number: "A-102",
      type: "Single",
      rent: 8000,
      status: "vacant",
      tenant: null,
      tenantPhone: null,
      floor: 1
    },
    {
      id: 3,
      number: "B-201",
      type: "Double",
      rent: 12000,
      status: "occupied",
      tenant: "Priya Singh",
      tenantPhone: "+91 9876543211",
      floor: 2
    },
    {
      id: 4,
      number: "B-202",
      type: "Double",
      rent: 12000,
      status: "vacant",
      tenant: null,
      tenantPhone: null,
      floor: 2
    },
    {
      id: 5,
      number: "C-301",
      type: "Triple",
      rent: 15000,
      status: "occupied",
      tenant: "Amit Kumar",
      tenantPhone: "+91 9876543212",
      floor: 3
    },
    {
      id: 6,
      number: "C-302",
      type: "Triple",
      rent: 15000,
      status: "vacant",
      tenant: null,
      tenantPhone: null,
      floor: 3
    }
  ];

  const filteredRooms = rooms.filter(room =>
    room.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (room.tenant && room.tenant.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    if (status === "occupied") {
      return <Badge className="bg-occupied text-occupied-foreground">Occupied</Badge>;
    }
    return <Badge className="bg-vacant text-vacant-foreground">Vacant</Badge>;
  };

  const handleAddRoom = () => {
    // TODO: Add room to Supabase
    console.log("Adding room:", newRoom);
    setNewRoom({ number: "", type: "", rent: "", floor: "" });
    setIsAddDialogOpen(false);
  };

  const AddRoomDialog = () => (
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
            <Label htmlFor="roomNumber" className="text-right">
              Room Number
            </Label>
            <Input 
              id="roomNumber" 
              placeholder="A-101" 
              className="col-span-3"
              value={newRoom.number}
              onChange={(e) => setNewRoom({...newRoom, number: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="roomType" className="text-right">
              Type
            </Label>
            <Select value={newRoom.type} onValueChange={(value) => setNewRoom({...newRoom, type: value})}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select room type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Single">Single</SelectItem>
                <SelectItem value="Double">Double</SelectItem>
                <SelectItem value="Triple">Triple</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rent" className="text-right">
              Rent (₹)
            </Label>
            <Input 
              id="rent" 
              type="number" 
              placeholder="8000" 
              className="col-span-3"
              value={newRoom.rent}
              onChange={(e) => setNewRoom({...newRoom, rent: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="floor" className="text-right">
              Floor
            </Label>
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
  );

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
          <AddRoomDialog />
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
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rooms</SelectItem>
              <SelectItem value="vacant">Vacant</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <Card key={room.id} className="shadow-soft hover:shadow-medium transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Room {room.number}</CardTitle>
                {getStatusBadge(room.status)}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Type</p>
                    <p className="font-medium">{room.type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Floor</p>
                    <p className="font-medium">{room.floor}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-success" />
                  <span className="font-semibold text-success">₹{room.rent.toLocaleString()}/month</span>
                </div>

                {room.status === "occupied" && room.tenant && (
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{room.tenant}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{room.tenantPhone}</p>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="mr-1 h-3 w-3" />
                    Edit
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
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
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
        </div>
      </main>
    </div>
  );
};

export default Rooms;