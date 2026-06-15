import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Send, MousePointerClick, DollarSign } from "lucide-react";

export default async function DashboardPage() {
  const totalCustomers = await prisma.customer.count();
  const totalSpendAgg = await prisma.customer.aggregate({
    _sum: { totalSpend: true },
  });
  const totalSpend = totalSpendAgg._sum.totalSpend || 0;

  const totalCampaigns = await prisma.campaign.count();
  
  // Calculate aggregate campaign metrics
  const campaigns = await prisma.campaign.findMany();
  let totalSent = 0;
  let totalOpened = 0;
  
  campaigns.forEach(c => {
    totalSent += c.sentCount;
    totalOpened += c.openedCount;
  });

  const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalCustomers.toLocaleString()}</div>
            <p className="text-xs text-slate-500">+10% from last month</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-slate-500">+4.5% from last month</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Active Campaigns</CardTitle>
            <Send className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalCampaigns}</div>
            <p className="text-xs text-slate-500">2 campaigns currently sending</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Average Open Rate</CardTitle>
            <MousePointerClick className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{openRate}%</div>
            <p className="text-xs text-slate-500">Across all channels</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 pt-4">
        <Card className="col-span-4 bg-white shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Recent Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
             {campaigns.length === 0 ? (
                 <div className="text-center py-10 text-slate-500">No campaigns yet. Create one to see stats.</div>
             ) : (
                 <div className="space-y-4">
                    {campaigns.slice(-5).reverse().map(campaign => (
                        <div key={campaign.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                            <div>
                                <p className="font-medium text-slate-900">{campaign.name}</p>
                                <p className="text-sm text-slate-500">{campaign.channel} • {campaign.status}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-medium text-slate-900">{campaign.sentCount} sent</p>
                                <p className="text-sm text-indigo-600">{campaign.openedCount} opened</p>
                            </div>
                        </div>
                    ))}
                 </div>
             )}
          </CardContent>
        </Card>
        <Card className="col-span-3 bg-indigo-50 border-indigo-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-indigo-900">AI Insights</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
               <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-100">
                  <p className="text-sm font-medium text-indigo-900 mb-1">High Churn Risk Detected</p>
                  <p className="text-xs text-slate-600">12% of your VIP customers haven't purchased in the last 60 days. Consider running a re-engagement campaign via WhatsApp.</p>
               </div>
               <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-100">
                  <p className="text-sm font-medium text-indigo-900 mb-1">Email Performance</p>
                  <p className="text-xs text-slate-600">Your recent "Summer Sale" email has a 55% open rate, which is 15% higher than your average.</p>
               </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
