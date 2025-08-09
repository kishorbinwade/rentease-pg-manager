import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Zap, Plus, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";

interface MeterDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: any;
  meter: any;
  onMeterUpdate: () => void;
}

interface MeterReading {
  id: string;
  reading_value: number;
  reading_date: string;
  units_consumed: number;
  bill_amount: number;
  recorded_at: string;
}

const MeterDetailsModal = ({ isOpen, onClose, room, meter, onMeterUpdate }: MeterDetailsModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingReading, setAddingReading] = useState(false);
  const [newReading, setNewReading] = useState({
    reading_date: format(new Date(), 'yyyy-MM-dd'),
    reading_value: ''
  });

  useEffect(() => {
    if (isOpen && meter?.id) {
      fetchReadings();
    }
  }, [isOpen, meter?.id]);

  const fetchReadings = async () => {
    if (!meter?.id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('meter_readings')
        .select('*')
        .eq('meter_id', meter.id)
        .order('reading_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      setReadings(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch meter readings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateReading = (readingValue: number, readingDate: string) => {
    // Check if reading value is valid
    if (readingValue <= 0) {
      throw new Error("Reading value must be greater than 0");
    }

    // Get last reading
    const lastReading = readings.length > 0 ? readings[0] : null;

    // Check if reading value is greater than or equal to last reading
    if (lastReading && readingValue < lastReading.reading_value) {
      throw new Error(`Reading value must be greater than or equal to last reading (${lastReading.reading_value})`);
    }

    // Check if date is not in the past compared to last reading
    if (lastReading) {
      const lastDate = new Date(lastReading.reading_date);
      const newDate = new Date(readingDate);
      if (newDate < lastDate) {
        throw new Error("Reading date cannot be earlier than the last recorded reading date");
      }
    }
  };

  const calculateBill = async (unitsConsumed: number) => {
    try {
      const { data, error } = await supabase.rpc('calculate_electricity_bill', {
        units_consumed: unitsConsumed
      });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error calculating bill:', error);
      return 0;
    }
  };

  const handleAddReading = async () => {
    try {
      const readingValue = parseFloat(newReading.reading_value);
      
      // Validate reading
      validateReading(readingValue, newReading.reading_date);

      // Calculate units consumed
      const lastReading = readings.length > 0 ? readings[0] : null;
      const lastReadingValue = lastReading ? lastReading.reading_value : meter.starting_reading;
      const unitsConsumed = readingValue - lastReadingValue;

      // Calculate bill
      const billAmount = await calculateBill(unitsConsumed);

      // Save reading
      const { error } = await supabase
        .from('meter_readings')
        .insert({
          meter_id: meter.id,
          reading_value: readingValue,
          reading_date: newReading.reading_date,
          units_consumed: unitsConsumed,
          bill_amount: billAmount,
          recorded_by: user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Reading added successfully",
      });

      // Reset form and refresh data
      setNewReading({
        reading_date: format(new Date(), 'yyyy-MM-dd'),
        reading_value: ''
      });
      setAddingReading(false);
      fetchReadings();
      onMeterUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add reading",
        variant: "destructive",
      });
    }
  };

  const getCurrentReading = () => {
    return readings.length > 0 ? readings[0] : null;
  };

  const getTotalConsumption = () => {
    return readings.reduce((total, reading) => total + reading.units_consumed, 0);
  };

  const getTotalBill = () => {
    return readings.reduce((total, reading) => total + reading.bill_amount, 0);
  };

  const currentReading = getCurrentReading();

  if (!meter) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No Meter Found</DialogTitle>
            <DialogDescription>
              This room doesn't have a meter configured yet. Please add a meter first.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Meter Details - Room {room?.room_number}
          </DialogTitle>
          <DialogDescription>
            Meter ID: {meter?.meter_id} | Starting Reading: {meter?.starting_reading} units
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-card p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Reading</p>
                  <p className="text-2xl font-bold">
                    {currentReading ? currentReading.reading_value : meter?.starting_reading} units
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </div>

            <div className="bg-gradient-card p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Consumption</p>
                  <p className="text-2xl font-bold text-warning">{getTotalConsumption()} units</p>
                </div>
                <Zap className="h-8 w-8 text-warning" />
              </div>
            </div>

            <div className="bg-gradient-card p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Bill</p>
                  <p className="text-2xl font-bold text-success">₹{getTotalBill().toFixed(2)}</p>
                </div>
                <div className="text-success">₹</div>
              </div>
            </div>
          </div>

          {/* Add Reading Section */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add New Reading</h3>
              {!addingReading && (
                <Button onClick={() => setAddingReading(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Reading
                </Button>
              )}
            </div>

            {addingReading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reading_date">Reading Date</Label>
                  <Input
                    id="reading_date"
                    type="date"
                    value={newReading.reading_date}
                    onChange={(e) => setNewReading({ ...newReading, reading_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="reading_value">Reading Value (units)</Label>
                  <Input
                    id="reading_value"
                    type="number"
                    step="0.01"
                    placeholder="Enter meter reading"
                    value={newReading.reading_value}
                    onChange={(e) => setNewReading({ ...newReading, reading_value: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <Button onClick={handleAddReading} disabled={!newReading.reading_value}>
                    Save Reading
                  </Button>
                  <Button variant="outline" onClick={() => setAddingReading(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Reading History */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Reading History</h3>
            {loading ? (
              <div className="text-center py-4">Loading readings...</div>
            ) : readings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No readings recorded yet. Add your first reading to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reading Value</TableHead>
                    <TableHead>Units Consumed</TableHead>
                    <TableHead>Bill Amount</TableHead>
                    <TableHead>Recorded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readings.map((reading) => (
                    <TableRow key={reading.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(parseISO(reading.reading_date), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>{reading.reading_value} units</TableCell>
                      <TableCell>
                        <Badge variant={reading.units_consumed > 0 ? "default" : "secondary"}>
                          {reading.units_consumed} units
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">₹{reading.bill_amount.toFixed(2)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(parseISO(reading.recorded_at), 'MMM dd, HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MeterDetailsModal;