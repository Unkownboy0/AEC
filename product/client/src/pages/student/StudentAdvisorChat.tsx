import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, User, Clock, CheckCircle, Phone, Video, Paperclip } from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import api from '../../lib/axios';

interface Message {
  id: string;
  senderRole: 'Student' | 'Advisor';
  senderName: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const DEMO_MESSAGES: Message[] = [
  { id: '1', senderRole: 'Advisor', senderName: 'Dr. Kavitha Rajan', message: 'Hello! I\'m your assigned academic advisor for this semester. Feel free to reach out regarding academics, career guidance, or any concerns.', timestamp: '2026-07-20T09:00:00', read: true },
  { id: '2', senderRole: 'Student', senderName: 'You', message: 'Thank you Dr. Kavitha! I had a question regarding my CGPA eligibility for the upcoming Google drive. Could you review my profile?', timestamp: '2026-07-20T09:15:00', read: true },
  { id: '3', senderRole: 'Advisor', senderName: 'Dr. Kavitha Rajan', message: 'Certainly! I checked your academic profile — your current CGPA of 9.5 and zero arrears makes you fully eligible. I have forwarded your profile to the placement cell for priority listing. Also, please ensure your resume is uploaded to the portal before the deadline.', timestamp: '2026-07-20T09:45:00', read: true },
  { id: '4', senderRole: 'Advisor', senderName: 'Dr. Kavitha Rajan', message: 'Also, I recommend attending the upcoming mock aptitude test on July 28th organized by the Training & Placement Cell. Your participation will be marked positively.', timestamp: '2026-07-21T10:00:00', read: false },
];

const ADVISOR_INFO = {
  name: 'Dr. Kavitha Rajan',
  designation: 'Associate Professor & Academic Advisor',
  department: 'Computer Science & Engineering',
  email: 'kavitha.rajan@geetorus.edu.in',
  phone: '+91 98001 23456',
  availability: 'Mon–Fri: 10:00 AM – 4:00 PM',
  initials: 'KR',
};

export const StudentAdvisorChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(DEMO_MESSAGES);
  const [replyInput, setReplyInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoading(false);
    scrollToBottom();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim()) return;
    const newMsg: Message = {
      id: Date.now().toString(),
      senderRole: 'Student',
      senderName: 'You',
      message: replyInput.trim(),
      timestamp: new Date().toISOString(),
      read: true,
    };
    setMessages(prev => [...prev, newMsg]);
    setReplyInput('');

    // Simulate advisor response after delay
    setTimeout(() => {
      const responses = [
        'Thank you for reaching out! I will review this and get back to you shortly.',
        'Great question! Let me check the latest guidelines and respond to you by tomorrow.',
        'I have noted your concern. Please visit my office during consultation hours for a detailed discussion.',
      ];
      const autoReply: Message = {
        id: (Date.now() + 1).toString(),
        senderRole: 'Advisor',
        senderName: ADVISOR_INFO.name,
        message: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date().toISOString(),
        read: false,
      };
      setMessages(prev => [...prev, autoReply]);
    }, 1800);
  };

  const unreadCount = messages.filter(m => m.senderRole === 'Advisor' && !m.read).length;

  if (isLoading) return <Loading text="Connecting to Advisor Chat..." />;

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col gap-0 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 h-full">

        {/* Advisor Info Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Your Advisor</h3>
            <div className="text-center space-y-2">
              <div className="h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xl mx-auto">
                {ADVISOR_INFO.initials}
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-800 dark:text-white">{ADVISOR_INFO.name}</p>
                <p className="text-[10px] text-slate-400 font-bold">{ADVISOR_INFO.designation}</p>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-emerald-600 font-bold">Available Now</span>
              </div>
            </div>
            <div className="space-y-2 text-[10px] font-semibold text-slate-500 border-t pt-3">
              <p><span className="font-extrabold text-slate-600 dark:text-slate-300">Dept:</span> {ADVISOR_INFO.department}</p>
              <p><span className="font-extrabold text-slate-600 dark:text-slate-300">Hours:</span> {ADVISOR_INFO.availability}</p>
              <p><span className="font-extrabold text-slate-600 dark:text-slate-300">Email:</span> <span className="text-indigo-600 break-all">{ADVISOR_INFO.email}</span></p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => toast.info('Email opened in your default mail client.')}
                className="flex-1 py-2 border text-[10px] font-black rounded-xl hover:bg-muted flex items-center justify-center gap-1">
                <Phone className="h-3 w-3" /> Contact
              </button>
              <button onClick={() => toast.info('Video meeting scheduled — check your email for the link.')}
                className="flex-1 py-2 border text-[10px] font-black rounded-xl hover:bg-muted flex items-center justify-center gap-1">
                <Video className="h-3 w-3" /> Meet
              </button>
            </div>
          </div>

          {unreadCount > 0 && (
            <div className="border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 shrink-0" />
              {unreadCount} unread message{unreadCount > 1 ? 's' : ''} from advisor
            </div>
          )}
        </div>

        {/* Chat Panel */}
        <div className="lg:col-span-3 border bg-card rounded-2xl shadow-sm flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b flex items-center gap-3 shrink-0">
            <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
              {ADVISOR_INFO.initials}
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-800 dark:text-white">{ADVISOR_INFO.name}</p>
              <p className="text-[10px] text-slate-400 font-bold">{ADVISOR_INFO.designation}</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-600 font-bold hidden sm:block">Online</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.senderRole === 'Student' ? 'justify-end' : 'justify-start'}`}>
                {m.senderRole === 'Advisor' && (
                  <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs shrink-0 mr-2 mt-1">
                    {ADVISOR_INFO.initials}
                  </div>
                )}
                <div className={`max-w-[75%] space-y-1`}>
                  <div className={`p-3 rounded-2xl text-xs font-semibold leading-relaxed ${
                    m.senderRole === 'Student'
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-muted text-slate-700 dark:text-slate-200 rounded-bl-sm'
                  }`}>
                    {m.message}
                  </div>
                  <p className={`text-[9px] font-bold text-slate-400 ${m.senderRole === 'Student' ? 'text-right' : ''}`}>
                    {new Date(m.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    {m.senderRole === 'Student' && <CheckCircle className="inline h-2.5 w-2.5 ml-1 text-indigo-400" />}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 border-t flex gap-2 shrink-0">
            <button type="button" onClick={() => toast.info('File attachment coming soon.')}
              className="p-2 hover:bg-muted rounded-xl border transition-colors shrink-0">
              <Paperclip className="h-4 w-4 text-slate-400" />
            </button>
            <input
              type="text"
              value={replyInput}
              onChange={e => setReplyInput(e.target.value)}
              placeholder="Type your message to advisor..."
              className="flex-1 text-xs px-3.5 py-2 border rounded-xl bg-background outline-none font-semibold focus:border-indigo-400 transition-colors"
            />
            <button type="submit"
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-black rounded-xl shadow hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shrink-0">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentAdvisorChat;
