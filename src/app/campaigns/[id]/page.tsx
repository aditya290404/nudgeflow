"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CampaignDetailPage() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState<any>(null);
  const [communications, setCommunications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaignData = async () => {
    try {
      // Re-using the /api/campaigns endpoint but filtering by ID isn't implemented, 
      // so we can either add an endpoint or fetch all and find.
      // Wait, we don't have a GET /api/campaigns/:id yet. 
      // Let's create one or just use Prisma in a server component.
      // Since it's a client component, I will create a quick GET route if needed, 
      // but to save time let me fetch from /api/campaigns and filter.
      const res = await fetch('/api/campaigns');
      const allCampaigns = await res.json();
      const found = allCampaigns.find((c: any) => c.id === id);
      if (found) {
        setCampaign(found);
      }
      
      // I need to fetch communications for this campaign. 
      // I should have created an API for this! 
      // Let me just fetch from a new endpoint /api/campaigns/[id]/communications.
      const commRes = await fetch(`/api/campaigns/${id}/communications`);
      if (commRes.ok) {
        const commData = await commRes.json();
        setCommunications(commData);
      }
    } catch (error) {
      console.error('Failed to fetch campaign details', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignData();
    // Poll every 5 seconds for real-time updates
    const interval = setInterval(fetchCampaignData, 5000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading && !campaign) {
    return <div className="p-10 text-center text-slate-500">Loading campaign...</div>;
  }

  if (!campaign) {
    return <div className="p-10 text-center text-slate-500">Campaign not found.</div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CLICKED': return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Clicked</Badge>;
      case 'OPENED': return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Opened</Badge>;
      case 'DELIVERED': return <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">Delivered</Badge>;
      case 'FAILED': return <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPercentage = (count: number, total: number) => {
    if (total === 0) return 0;
    return ((count / total) * 100).toFixed(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/campaigns" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">{campaign.name}</h2>
            <Badge variant={campaign.status === 'SENDING' ? 'default' : 'secondary'}>{campaign.status}</Badge>
          </div>
          <p className="text-slate-500 mt-1">Channel: {campaign.channel} • Segment: {campaign.segment?.name}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Sent</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{campaign.sentCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Delivered</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{campaign.deliveredCount}</div>
            <p className="text-xs text-slate-500">{getPercentage(campaign.deliveredCount, campaign.sentCount)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Opened</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{campaign.openedCount}</div>
            <p className="text-xs text-slate-500">{getPercentage(campaign.openedCount, campaign.deliveredCount)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Clicked</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{campaign.clickedCount}</div>
            <p className="text-xs text-slate-500">{getPercentage(campaign.clickedCount, campaign.openedCount)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Failed</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{campaign.failedCount}</div>
            <p className="text-xs text-slate-500">{getPercentage(campaign.failedCount, campaign.sentCount)}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border bg-white mt-8">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Communication Logs</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Message Preview</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {communications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-slate-500">No logs available.</TableCell>
              </TableRow>
            ) : (
              communications.map((comm) => (
                <TableRow key={comm.id}>
                  <TableCell>
                    <div className="font-medium">{comm.customer?.name}</div>
                    <div className="text-xs text-slate-500">{comm.customer?.email}</div>
                  </TableCell>
                  <TableCell className="max-w-md truncate" title={comm.message}>{comm.message}</TableCell>
                  <TableCell>{getStatusBadge(comm.status)}</TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {comm.clickedAt ? new Date(comm.clickedAt).toLocaleTimeString() :
                     comm.openedAt ? new Date(comm.openedAt).toLocaleTimeString() :
                     comm.deliveredAt ? new Date(comm.deliveredAt).toLocaleTimeString() :
                     new Date(comm.sentAt).toLocaleTimeString()}
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
