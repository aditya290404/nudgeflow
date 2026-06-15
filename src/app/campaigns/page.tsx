"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [segments, setSegments] = useState<any[]>([]);
  
  // Form State
  const [name, setName] = useState("");
  const [segmentId, setSegmentId] = useState("");
  const [channel, setChannel] = useState("");
  const [message, setMessage] = useState("");
  
  const [isDrafting, setIsDrafting] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      setCampaigns(data);
    } catch (error) {
      console.error('Failed to fetch campaigns', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSegments = async () => {
    try {
      const res = await fetch('/api/segments');
      const data = await res.json();
      setSegments(data);
    } catch (error) {
      console.error('Failed to fetch segments', error);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Open modal hook
  useEffect(() => {
    if (isOpen) {
      fetchSegments();
      setStep(1);
      setName("");
      setSegmentId("");
      setChannel("");
      setMessage("");
    }
  }, [isOpen]);

  const handleDraftMessage = async () => {
    if (!segmentId || !channel) return;
    setIsDrafting(true);
    try {
      const selectedSegment = segments.find(s => s.id === segmentId);
      const res = await fetch('/api/ai/draft-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          segmentDescription: selectedSegment?.naturalLanguageQuery || selectedSegment?.name, 
          channel 
        })
      });
      const data = await res.json();
      if (data.draft) {
        setMessage(data.draft);
      }
    } catch (error) {
      console.error('Failed to draft message', error);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleLaunch = async () => {
    setIsLaunching(true);
    try {
      // 1. Create Campaign
      const createRes = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, segmentId, message, channel })
      });
      const campaign = await createRes.json();

      // 2. Trigger Send
      await fetch(`/api/campaigns/${campaign.id}/send`, {
        method: 'POST',
      });

      setIsOpen(false);
      fetchCampaigns();
    } catch (error) {
      console.error('Failed to launch campaign', error);
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Campaigns</h2>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger render={<Button />}>New Campaign</DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Campaign (Step {step} of 4)</DialogTitle>
              <DialogDescription>
                Launch a new personalized campaign to a customer segment.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 min-h-[300px]">
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Campaign Name</Label>
                    <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Summer Sale 2026" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="segment">Target Segment</Label>
                    <Select value={segmentId} onValueChange={setSegmentId}>
                      <SelectTrigger id="segment">
                        <SelectValue placeholder="Select a segment" />
                      </SelectTrigger>
                      <SelectContent>
                        {segments.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name} ({s.customerCount} users)</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Communication Channel</Label>
                    <div className="grid grid-cols-2 gap-4">
                      {['EMAIL', 'SMS', 'WHATSAPP', 'RCS'].map(ch => (
                        <div 
                          key={ch} 
                          onClick={() => setChannel(ch)}
                          className={`p-4 border rounded-lg cursor-pointer text-center font-medium transition-colors ${channel === ch ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50'}`}
                        >
                          {ch}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Message Content</Label>
                    <Button variant="outline" size="sm" onClick={handleDraftMessage} disabled={isDrafting}>
                      {isDrafting ? 'Drafting...' : '✨ AI Draft'}
                    </Button>
                  </div>
                  <Textarea 
                    rows={8}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder={`Write your message here... Use {{name}} to personalize.`}
                  />
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg">Review Campaign</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-slate-500">Name:</div><div className="font-medium">{name}</div>
                    <div className="text-slate-500">Segment:</div><div className="font-medium">{segments.find(s => s.id === segmentId)?.name}</div>
                    <div className="text-slate-500">Channel:</div><div className="font-medium">{channel}</div>
                  </div>
                  <div className="mt-4">
                    <div className="text-slate-500 text-sm mb-1">Message Preview:</div>
                    <div className="p-3 bg-white border rounded whitespace-pre-wrap text-sm">{message.replace('{{name}}', 'Aditya')}</div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex justify-between sm:justify-between">
              <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 1}>Back</Button>
              {step < 4 ? (
                <Button 
                  onClick={() => setStep(step + 1)} 
                  disabled={
                    (step === 1 && (!name || !segmentId)) || 
                    (step === 2 && !channel) ||
                    (step === 3 && !message)
                  }
                >
                  Next Step
                </Button>
              ) : (
                <Button onClick={handleLaunch} disabled={isLaunching}>
                  {isLaunching ? 'Launching...' : '🚀 Launch Campaign'}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign Name</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Sent</TableHead>
              <TableHead className="text-right">Delivered</TableHead>
              <TableHead className="text-right">Opened</TableHead>
              <TableHead className="text-right">Clicked</TableHead>
              <TableHead className="text-right">Failed</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10 text-slate-500">Loading...</TableCell>
              </TableRow>
            ) : campaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10 text-slate-500">No campaigns found.</TableCell>
              </TableRow>
            ) : (
              campaigns.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-slate-500">{c.segment?.name}</div>
                  </TableCell>
                  <TableCell>{c.channel}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === 'SENT' || c.status === 'SENDING' ? 'default' : c.status === 'DRAFT' ? 'secondary' : 'outline'}>
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{c.sentCount}</TableCell>
                  <TableCell className="text-right text-indigo-600 font-medium">{c.deliveredCount}</TableCell>
                  <TableCell className="text-right text-emerald-600 font-medium">{c.openedCount}</TableCell>
                  <TableCell className="text-right text-blue-600 font-medium">{c.clickedCount}</TableCell>
                  <TableCell className="text-right text-red-600">{c.failedCount}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/campaigns/${c.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
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
