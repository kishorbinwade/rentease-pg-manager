import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const AllTenants = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const tenantsPerPage = 10;

  useEffect(() => {
    if (user) {
      fetchAllTenants();
    }
  }, [user]);

  const fetchAllTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          *,
          rooms(
            room_number,
            room_type
          )
        `)
        .eq('owner_id', user?.id)
        .order('full_name');

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

  const filteredTenants = tenants.filter(tenant =>
    tenant.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tenant.rooms?.room_number && tenant.rooms.room_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredTenants.length / tenantsPerPage);
  const startIndex = (currentPage - 1) * tenantsPerPage;
  const currentTenants = filteredTenants.slice(startIndex, startIndex + tenantsPerPage);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success text-success-foreground">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-muted text-muted-foreground">Inactive</Badge>;
      case 'notice_period':
        return <Badge className="bg-warning text-warning-foreground">Notice Period</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground">{status}</Badge>;
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
            <h1 className="text-3xl font-bold text-foreground mb-2">All Tenants</h1>
            <p className="text-muted-foreground">Complete list of all tenants in your PG</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search tenants by name, phone, email, or room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tenants List */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>
              Tenants ({filteredTenants.length} total)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentTenants.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No tenants found</p>
            ) : (
              <div className="space-y-4">
                {currentTenants.map((tenant) => (
                  <div key={tenant.id} className="border rounded-lg p-4 bg-background">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                      <div>
                        <h3 className="font-semibold text-foreground">{tenant.full_name}</h3>
                        <p className="text-sm text-muted-foreground">{tenant.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Room</p>
                        <p className="font-medium">
                          {tenant.rooms ? `${tenant.rooms.room_number} (${tenant.rooms.room_type})` : 'No room assigned'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Mobile</p>
                        <p className="font-medium">{tenant.phone}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        {getStatusBadge(tenant.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AllTenants;