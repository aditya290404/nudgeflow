"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCustomers = async (searchQuery = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers?limit=100&search=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setCustomers(data.data || []);
    } catch (error) {
      console.error('Failed to fetch customers', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers(search);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Customers</h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input 
            placeholder="Search by name or email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
        </form>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>City</TableHead>
              <TableHead className="text-right">Total Orders</TableHead>
              <TableHead className="text-right">Total Spend</TableHead>
              <TableHead>Last Order</TableHead>
              <TableHead>Tags</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-slate-500">Loading...</TableCell>
              </TableRow>
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-slate-500">No customers found.</TableCell>
              </TableRow>
            ) : (
              customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-sm text-slate-500">{c.email}</div>
                  </TableCell>
                  <TableCell>{c.city || '-'}</TableCell>
                  <TableCell className="text-right">{c.totalOrders}</TableCell>
                  <TableCell className="text-right">{formatCurrency(c.totalSpend)}</TableCell>
                  <TableCell>
                    {c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString('en-IN') : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {c.tags.map((tag: string) => (
                        <Badge 
                          key={tag} 
                          variant="outline"
                          className={
                            tag === 'vip' ? 'border-amber-400 text-amber-600 bg-amber-50' :
                            tag === 'at_risk' ? 'border-red-400 text-red-600 bg-red-50' :
                            tag === 'new' ? 'border-emerald-400 text-emerald-600 bg-emerald-50' :
                            ''
                          }
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
