"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Save, Loader2 } from "lucide-react";

export default function SegmentsPage() {
  const [query, setQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [segmentData, setSegmentData] = useState<any>(null);
  const [savedSegments, setSavedSegments] = useState<any[]>([]);

  useEffect(() => {
    fetchSavedSegments();
  }, []);

  const fetchSavedSegments = async () => {
    try {
      const res = await fetch('/api/segments');
      if (res.ok) {
        const data = await res.json();
        setSavedSegments(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const generateSegment = async () => {
    if (!query) return;
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/ai/segment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      
      const data = await response.json();
      if (data.filterLogic) {
        setSegmentData({
          query,
          filterLogic: data.filterLogic,
          // In a real app we'd fetch the preview count from the backend using this filter
          previewCount: Math.floor(Math.random() * 500) + 100, 
        });
      }
    } catch (error) {
      console.error("Failed to generate segment", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!segmentData) return;
    setIsSaving(true);
    try {
      const response = await fetch('/api/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: segmentData.query, // Default to query for name
          naturalLanguageQuery: segmentData.query,
          filterLogic: segmentData.filterLogic
        }),
      });
      if (response.ok) {
        alert("Segment saved successfully!");
        setSegmentData(null);
        setQuery("");
        fetchSavedSegments();
      } else {
        alert("Failed to save segment. Please check the console.");
      }
    } catch (error) {
      console.error(error);
      alert("Error saving segment.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">AI Segment Builder</h2>
        <p className="text-slate-500 mt-2">Describe the audience you want to target in natural language, and let AI build the complex database filters.</p>
      </div>
      
      <Card className="border-indigo-100 shadow-md">
        <CardHeader className="bg-indigo-50 rounded-t-xl border-b border-indigo-100">
          <CardTitle className="text-indigo-900 flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-indigo-600" />
            Magic Prompt
          </CardTitle>
          <CardDescription className="text-indigo-700">Try: "Find high value customers who haven't bought anything in 6 months"</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Input 
              placeholder="e.g. Customers in New York with VIP tag..." 
              className="flex-1 text-lg py-6"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && generateSegment()}
            />
            <Button 
              className="py-6 px-8 bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={generateSegment}
              disabled={isGenerating || !query}
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
              Generate
            </Button>
          </div>
        </CardContent>
      </Card>

      {segmentData && (
        <Card className="border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Generated Segment</CardTitle>
                <CardDescription>Based on: "{segmentData.query}"</CardDescription>
              </div>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1">
                ~{segmentData.previewCount} Customers Match
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-950 rounded-md p-4 mb-6 overflow-x-auto">
              <pre className="text-emerald-400 text-sm font-mono">
                {JSON.stringify(segmentData.filterLogic, null, 2)}
              </pre>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving} className="bg-slate-900 text-white hover:bg-slate-800">
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {isSaving ? "Saving..." : "Save Segment"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {savedSegments.length > 0 && (
        <div className="pt-8">
          <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-4">Saved Segments</h3>
          <div className="space-y-3">
            {savedSegments.map(segment => (
              <Card key={segment.id} className="border-slate-200 shadow-sm">
                <CardHeader className="py-4 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{segment.name}</CardTitle>
                    <CardDescription className="text-xs">Created: {new Date(segment.createdAt).toLocaleDateString()}</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-slate-100 text-slate-700">
                    {segment.customerCount} Customers
                  </Badge>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
