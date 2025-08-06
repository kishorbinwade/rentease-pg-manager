import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface RoomEditDialogProps {
  room: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const RoomEditDialog = ({ room, isOpen, onClose, onUpdate }: RoomEditDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [editRoom, setEditRoom] = useState({
    rent_amount: "",
    capacity: "",
  });

  // Update form when room changes
  const activeTenants = room?.tenants?.filter(t => t.status === 'active') || [];
  const currentOccupancy = activeTenants.length;

  // Pre-fill form when room changes
  useEffect(() => {
    if (room && isOpen) {
      setEditRoom({
        rent_amount: room.rent_amount?.toString() || "",
        capacity: room.capacity?.toString() || "",
      });
    }
  }, [room, isOpen]);

  const handleSave = async () => {
    try {
      const newRent = parseFloat(editRoom.rent_amount);
      const newCapacity = parseInt(editRoom.capacity);
      
      // Validation
      if (!newRent || newRent <= 0) {
        toast({
          title: "Error",
          description: "Rent must be a numeric value greater than 0",
          variant: "destructive",
        });
        return;
      }

      if (!newCapacity || newCapacity < 1 || !Number.isInteger(newCapacity)) {
        toast({
          title: "Error", 
          description: "Capacity must be an integer greater than 0",
          variant: "destructive",
        });
        return;
      }

      if (newCapacity < currentOccupancy) {
        toast({
          title: "Error",
          description: "Capacity cannot be less than current occupancy.",
          variant: "destructive",
        });
        return;
      }

      // Check if rent is changing to show confirmation
      if (newRent !== room.rent_amount) {
        setShowConfirmation(true);
        return;
      }

      await updateRoom(newRent, newCapacity);
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid input values",
        variant: "destructive",
      });
    }
  };

  const updateRoom = async (rent: number, capacity: number) => {
    try {
      // Log edit history
      const oldRent = room.rent_amount;
      const oldCapacity = room.capacity;

      if (rent !== oldRent) {
        await supabase
          .from('room_edit_history')
          .insert({
            room_id: room.id,
            field_name: 'rent_amount',
            old_value: oldRent.toString(),
            new_value: rent.toString(),
            edited_by: user?.id
          });
      }

      if (capacity !== oldCapacity) {
        await supabase
          .from('room_edit_history')
          .insert({
            room_id: room.id,
            field_name: 'capacity',
            old_value: oldCapacity.toString(),
            new_value: capacity.toString(),
            edited_by: user?.id
          });
      }

      // Update the room
      const { error } = await supabase
        .from('rooms')
        .update({
          rent_amount: rent,
          capacity: capacity
        })
        .eq('id', room.id)
        .eq('owner_id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Room updated successfully",
      });

      onUpdate();
      onClose();
      setShowConfirmation(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update room",
        variant: "destructive",
      });
    }
  };

  const handleConfirmRentChange = async () => {
    const newRent = parseFloat(editRoom.rent_amount);
    const newCapacity = parseInt(editRoom.capacity);
    await updateRoom(newRent, newCapacity);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Room {room?.room_number}</DialogTitle>
            <DialogDescription>
              Only rent and capacity can be modified. All other fields are read-only.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="room-number" className="text-right">Room Number</Label>
              <Input 
                id="room-number" 
                value={room?.room_number || ""}
                className="col-span-3"
                disabled
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="room-type" className="text-right">Type</Label>
              <Input 
                id="room-type" 
                value={room?.room_type || ""}
                className="col-span-3"
                disabled
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rent" className="text-right">Rent (₹) *</Label>
              <Input 
                id="rent" 
                type="number" 
                placeholder="8000"
                className="col-span-3"
                value={editRoom.rent_amount}
                onChange={(e) => setEditRoom({...editRoom, rent_amount: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="capacity" className="text-right">Capacity *</Label>
              <Input 
                id="capacity" 
                type="number" 
                placeholder="2"
                className="col-span-3"
                value={editRoom.capacity}
                onChange={(e) => setEditRoom({...editRoom, capacity: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Current Info</Label>
              <div className="col-span-3 text-sm text-muted-foreground">
                Occupied: {currentOccupancy} | Available: {Math.max(0, (room?.capacity || 0) - currentOccupancy)}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="floor" className="text-right">Floor</Label>
              <Input 
                id="floor" 
                value={room?.floor || ""}
                className="col-span-3"
                disabled
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Rent Change</AlertDialogTitle>
            <AlertDialogDescription>
              You are updating the rent for this room from ₹{room?.rent_amount} to ₹{editRoom.rent_amount}. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmation(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRentChange}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};