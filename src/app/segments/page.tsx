"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SegmentsPage() {
  const [segments, setSegments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [previewLogic, setPreviewLogic] = useState<any>(null);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSegments = async () => {
    try {
      const res = await fetch('/api/segments');
      const data = await res.json();
      setSegments(data);
    } catch (error) {
      console.error('Failed to fetch segments', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSegments();
  }, []);

  const handleParse = async () => {
    if (!query) return;
    setIsParsing(true);
    try {
      const res = await fetch('/api/segments/ai-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      if (data.filterLogic) {
        setPreviewLogic(data.filterLogic);
        setPreviewCount(data.customerCount);
      }
    } catch (error) {
      console.error('Failed to parse query', error);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSave = async () => {
    if (!name || !previewLogic) return;
    setIsSaving(true);
    try {
      await fetch('/api/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          naturalLanguageQuery: query,
          filterLogic: previewLogic,
        })
      });
      setIsOpen(false);
      // Reset state
      setName("");
      setQuery("");
      setPreviewLogic(null);
      setPreviewCount(null);
      fetchSegments();
    } catch (error) {
      console.error('Failed to save segment', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Segments</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger render={<Button />}>New Segment</DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Segment</DialogTitle>
              <DialogDescription>
                Use natural language to filter your customers.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Segment Name</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="e.g. High Value Churn Risk" 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="query">Natural Language Query</Label>
                <div className="flex gap-2">
                  <Input 
                    id="query" 
                    value={query} 
                    onChange={(e) => setQuery(e.target.value)} 
                    placeholder="Customers who spent over ₹10,000..." 
                  />
                  <Button onClick={handleParse} disabled={isParsing || !query} variant="secondary">
                    {isParsing ? 'Parsing...' : 'Parse'}
                  </Button>
                </div>
              </div>
              
              {previewLogic && (
                <div className="rounded-md bg-slate-100 p-4 mt-2">
                  <p className="text-sm font-medium mb-2">Preview Logic:</p>
                  <pre className="text-xs text-slate-700 bg-white p-2 rounded border overflow-x-auto">
                    {JSON.stringify(previewLogic, null, 2)}
                  </pre>
                  <p className="text-sm font-medium mt-4">
                    Matching Customers: <span className="text-indigo-600 font-bold">{previewCount}</span>
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleSave} disabled={isSaving || !name || !previewLogic}>
                {isSaving ? 'Saving...' : 'Save Segment'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Query</TableHead>
              <TableHead className="text-right">Customers</TableHead>
              <TableHead className="text-right">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-slate-500">Loading...</TableCell>
              </TableRow>
            ) : segments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-slate-500">No segments found.</TableCell>
              </TableRow>
            ) : (
              segments.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-slate-500 max-w-xs truncate">{s.naturalLanguageQuery || 'N/A'}</TableCell>
                  <TableCell className="text-right font-medium">{s.customerCount}</TableCell>
                  <TableCell className="text-right text-slate-500">
                    {new Date(s.createdAt).toLocaleDateString()}
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
