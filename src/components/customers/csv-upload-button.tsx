"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import Papa from "papaparse";
import { useRouter } from "next/navigation";

export function CsvUploadButton() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const mappedData = results.data.map((row: any) => ({
            name: row.name || row.Name || "",
            email: row.email || row.Email || "",
            phone: row.phone || row.Phone || null,
            city: row.city || row.City || null,
            tags: (row.tags || row.Tags) ? String(row.tags || row.Tags).split(',').map(t => t.trim()) : [],
          })).filter((c) => c.name && c.email);

          if (mappedData.length === 0) {
            alert("No valid customers found in CSV. Make sure you have 'name' and 'email' columns.");
            setIsUploading(false);
            return;
          }

          const response = await fetch('/api/customers/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mappedData),
          });

          if (response.ok) {
            const data = await response.json();
            alert(`Successfully imported ${data.count} customers!`);
            router.refresh();
          } else {
            const err = await response.json();
            alert(`Error: ${err.error}`);
          }
        } catch (error) {
          console.error("Upload error:", error);
          alert("An error occurred during upload.");
        } finally {
          setIsUploading(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      },
      error: (error) => {
        console.error("CSV Parse Error:", error);
        alert("Failed to parse CSV file.");
        setIsUploading(false);
      }
    });
  };

  return (
    <>
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <Button 
        onClick={() => fileInputRef.current?.click()} 
        disabled={isUploading}
        className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
      >
        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {isUploading ? "Uploading..." : "Import CSV"}
      </Button>
    </>
  );
}
