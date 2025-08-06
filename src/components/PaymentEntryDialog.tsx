import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface Tenant {
  id: string;
  full_name: string;
  room_id: string;
  rooms: {
    room_number: string;
    rent_amount: number;
  };
}

interface PaymentEntryDialogProps {
  onPaymentAdded?: () => void;
}

export function PaymentEntryDialog({ onPaymentAdded }: PaymentEntryDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  
  const [formData, setFormData] = useState({
    tenant_id: "",
    payment_date: new Date().toISOString().split('T')[0],
    payment_month: new Date().toISOString().split('T')[0].slice(0, 7) + "-01",
    rent_amount: "",
    deposit_amount: "",
    other_charges: "",
    payment_method: "",
    remarks: ""
  });

  useEffect(() => {
    if (open) {
      fetchTenants();
    }
  }, [open]);

  const fetchTenants = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          id,
          full_name,
          room_id,
          rooms!inner (
            room_number,
            rent_amount
          )
        `)
        .eq('owner_id', user.id)
        .eq('status', 'active');

      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      toast.error('Failed to fetch tenants');
    }
  };

  const handleTenantChange = (tenantId: string) => {
    const selectedTenant = tenants.find(t => t.id === tenantId);
    setFormData(prev => ({
      ...prev,
      tenant_id: tenantId,
      rent_amount: selectedTenant?.rooms.rent_amount.toString() || ""
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('payments')
        .insert({
          tenant_id: formData.tenant_id,
          owner_id: user.id,
          payment_date: formData.payment_date,
          payment_month: formData.payment_month,
          rent_amount: parseFloat(formData.rent_amount),
          deposit_amount: formData.deposit_amount ? parseFloat(formData.deposit_amount) : 0,
          other_charges: formData.other_charges ? parseFloat(formData.other_charges) : 0,
          payment_method: formData.payment_method,
          remarks: formData.remarks || null
        });

      if (error) throw error;

      toast.success('Payment recorded successfully');
      setOpen(false);
      setFormData({
        tenant_id: "",
        payment_date: new Date().toISOString().split('T')[0],
        payment_month: new Date().toISOString().split('T')[0].slice(0, 7) + "-01",
        rent_amount: "",
        deposit_amount: "",
        other_charges: "",
        payment_method: "",
        remarks: ""
      });
      onPaymentAdded?.();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-payment-trigger>
          <Plus className="h-4 w-4 mr-2" />
          Add Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="tenant">Tenant</Label>
            <Select value={formData.tenant_id} onValueChange={handleTenantChange}>
              <SelectTrigger data-tenant-select>
                <SelectValue placeholder="Select tenant" />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.full_name} - Room {tenant.rooms.room_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="payment_date">Payment Date</Label>
            <Input
              id="payment_date"
              type="date"
              value={formData.payment_date}
              onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="payment_month">Payment Month</Label>
            <Input
              id="payment_month"
              type="month"
              value={formData.payment_month.slice(0, 7)}
              onChange={(e) => setFormData(prev => ({ ...prev, payment_month: e.target.value + "-01" }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="rent_amount">Rent Amount</Label>
            <Input
              id="rent_amount"
              type="number"
              step="0.01"
              value={formData.rent_amount}
              onChange={(e) => setFormData(prev => ({ ...prev, rent_amount: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="deposit_amount">Deposit Amount (Optional)</Label>
            <Input
              id="deposit_amount"
              type="number"
              step="0.01"
              value={formData.deposit_amount}
              onChange={(e) => setFormData(prev => ({ ...prev, deposit_amount: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="other_charges">Other Charges (Optional)</Label>
            <Input
              id="other_charges"
              type="number"
              step="0.01"
              value={formData.other_charges}
              onChange={(e) => setFormData(prev => ({ ...prev, other_charges: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="payment_method">Payment Method</Label>
            <Select value={formData.payment_method} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              placeholder="Optional remarks"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Recording...' : 'Record Payment'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}