import Link from "next/link";
import { Users, PieChart, Send, Home } from "lucide-react";

export function Sidebar() {
  return (
    <div className="flex h-screen w-64 flex-col bg-slate-950 text-slate-200">
      <div className="flex h-16 items-center justify-center border-b border-slate-800">
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          NudgeFlow
        </h1>
      </div>
      <nav className="flex-1 space-y-2 py-4">
        <Link href="/dashboard" className="flex items-center px-6 py-3 hover:bg-slate-900 transition-colors">
          <Home className="mr-3 h-5 w-5" />
          Dashboard
        </Link>
        <Link href="/customers" className="flex items-center px-6 py-3 hover:bg-slate-900 transition-colors">
          <Users className="mr-3 h-5 w-5" />
          Customers
        </Link>
        <Link href="/segments" className="flex items-center px-6 py-3 hover:bg-slate-900 transition-colors">
          <PieChart className="mr-3 h-5 w-5" />
          Segments
        </Link>
        <Link href="/campaigns" className="flex items-center px-6 py-3 hover:bg-slate-900 transition-colors">
          <Send className="mr-3 h-5 w-5" />
          Campaigns
        </Link>
      </nav>
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
        &copy; 2026 NudgeFlow CRM
      </div>
    </div>
  );
}
