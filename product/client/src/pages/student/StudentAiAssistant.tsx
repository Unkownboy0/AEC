import React, { useState, useEffect } from "react";
import {
  Layers, User, CreditCard, Cpu, Briefcase, Compass, Trophy, Send,
  MessageSquare, BookOpen, Clock, CheckCircle, AlertTriangle, FileText,
  ClipboardList, HelpCircle, FileSpreadsheet, Award, CalendarDays,
  FileCode, FilePlus, TrendingUp, Book, Home, Truck, FolderGit, BadgeCheck,
  FolderOpen, Bell, Inbox, Calendar, Settings
} from "lucide-react";
import { toast } from "../../components/ui/Toast";
import { Loading } from "../../components/ui/Loading";
import api from "../../lib/axios";

export const StudentAiAssistant: React.FC = () => {

    const [messages, setMessages] = useState<any[]>([{ role: 'assistant', content: 'Hello! I am your AI Counselor. Ask me about attendance forecasts, predicted CGPA, or exam preps.' }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim()) return;
      const userMsg = input;
      setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
      setInput('');
      setLoading(true);
      try {
        const res = await api.post('/ai/chat', { message: userMsg });
        if (res.data?.status === 'success') {
          setMessages(prev => [...prev, { role: 'assistant', content: res.data.data.reply }]);
        }
      } catch {
        toast.error('AI chat connection error.');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="border bg-card p-5 rounded-xl shadow-sm space-y-4 h-[600px] flex flex-col text-left animate-in fade-in duration-200">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5 pb-3 border-b shrink-0">
          <Cpu className="h-5 w-5 text-primary animate-pulse" /> AI Academic Assistant
        </h2>
        <div className="flex-1 overflow-y-auto space-y-3 text-xs">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3 rounded-2xl max-w-[80%] ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && <div className="text-xs text-muted-foreground animate-pulse">Assistant is typing...</div>}
        </div>
        <form onSubmit={handleSend} className="flex gap-2 border-t pt-3 shrink-0">
          <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Ask anything..." className="flex-1 text-xs p-2.5 rounded-lg border bg-background" />
          <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg shadow">Send</button>
        </form>
      </div>
    );
  
};

export default StudentAiAssistant;
