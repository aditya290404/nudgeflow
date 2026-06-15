"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Send, Activity, Plus } from "lucide-react";

export default function CampaignsPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [segments, setSegments] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  
  // Form State
  const [name, setName] = useState("");
  const [segmentId, setSegmentId] = useState(""); // Hardcoded for demo if needed
  const [channel, setChannel] = useState("EMAIL");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchSegments = async () => {
      try {
        const res = await fetch('/api/segments');
        if (res.ok) {
          const data = await res.json();
          setSegments(data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    const fetchCampaigns = async () => {
      try {
        const res = await fetch('/api/campaigns');
        if (res.ok) {
          const data = await res.json();
          setCampaigns(data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchSegments();
    fetchCampaigns();
  }, []);

  const handleDraftMessage = async () => {
    setIsDrafting(true);
    try {
      const response = await fetch('/api/ai/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segmentName: "High Value Customers", // Example
          tone: "Friendly and Urgent",
        }),
      });
      const data = await response.json();
      if (channel === 'EMAIL') setMessage(data.email || '');
      else if (channel === 'SMS') setMessage(data.sms || '');
      else if (channel === 'WHATSAPP') setMessage(data.whatsapp || '');
    } catch (e) {
      console.error(e);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleSendCampaign = async () => {
    // Basic validation
    if (!name || !segmentId || !message) {
      alert("Please fill all fields");
      return;
    }
    
    setIsSending(true);
    try {
      const response = await fetch('/api/campaigns/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, segmentId, channel, message }),
      });
      if (response.ok) {
        alert("Campaign launched successfully!");
        setIsCreating(false);
        // Refresh campaigns
        const res = await fetch('/api/campaigns');
        const data = await res.json();
        setCampaigns(data);
      } else {
        const err = await response.json();
        alert("Error launching campaign: " + err.error);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to launch campaign.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Campaigns</h2>
          <p className="text-slate-500 mt-1">Manage and launch your targeted communications.</p>
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" /> New Campaign
          </Button>
        )}
      </div>

      {isCreating ? (
        <Card className="border-slate-200 shadow-md">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle>Create New Campaign</CardTitle>
            <CardDescription>Setup your audience, channel, and message.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label>Campaign Name</Label>
              <Input placeholder="e.g. Winter VIP Sale" value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Target Segment</Label>
                <Select value={segmentId} onValueChange={setSegmentId}>
                  <SelectTrigger><SelectValue placeholder="Select a segment" /></SelectTrigger>
                  <SelectContent>
                    {segments.length === 0 && <SelectItem value="none" disabled>No segments saved yet</SelectItem>}
                    {segments.map(seg => (
                      <SelectItem key={seg.id} value={seg.id}>{seg.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Channel</Label>
                <Select value={channel} onValueChange={setChannel}>
                  <SelectTrigger><SelectValue placeholder="Select channel" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                    <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <Label>Message Content</Label>
                <Button variant="outline" size="sm" onClick={handleDraftMessage} disabled={isDrafting} className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isDrafting ? "Drafting..." : "Auto-Draft with AI"}
                </Button>
              </div>
              <Textarea 
                className="min-h-[150px]" 
                placeholder="Write your message here..."
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
              <Button onClick={handleSendCampaign} disabled={isSending} className="bg-slate-900 hover:bg-slate-800">
                <Send className="w-4 h-4 mr-2" />
                Launch Campaign
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : campaigns.length > 0 ? (
        <div className="space-y-4">
          {campaigns.map(campaign => (
            <Card key={campaign.id} className="border-slate-200 shadow-sm">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{campaign.name}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className="text-sm px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {campaign.channel}
                    </span>
                    <span className="text-sm px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {campaign.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-8 text-center">
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{campaign.sentCount}</p>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Sent</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{campaign.deliveredCount}</p>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Delivered</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-indigo-600">{campaign.openedCount}</p>
                    <p className="text-xs text-indigo-600 uppercase tracking-wider">Opened</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">{campaign.clickedCount}</p>
                    <p className="text-xs text-emerald-600 uppercase tracking-wider">Clicked</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-2 bg-slate-50 shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
              <Activity className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No active campaigns</h3>
            <p className="text-slate-500 max-w-sm mt-2 mb-6">You haven't sent any campaigns yet. Create your first one to start tracking performance.</p>
            <Button onClick={() => setIsCreating(true)} className="bg-indigo-600 hover:bg-indigo-700">
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
