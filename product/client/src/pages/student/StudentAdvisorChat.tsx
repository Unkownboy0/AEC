import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle, MessageSquare, Paperclip, RefreshCw, Send, UserRound } from 'lucide-react';
import api from '../../lib/axios';
import { downloadAndOpen } from '../../platform/download';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';

interface Participant { id: string; name: string; designation?: string | null; department?: string | null }
interface Conversation {
  conversationId: string;
  participant: Participant;
  unreadCount: number;
  lastMessage?: { message?: string };
}
interface ChatMessage {
  id: string;
  senderRole: 'Student' | 'Faculty';
  message: string;
  sentTime: string;
  status: string;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
}
interface PendingAttachment { name: string; base64: string }

const initials = (name?: string) => (name || 'Faculty').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

export const StudentAdvisorChat: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [availableFaculty, setAvailableFaculty] = useState<Participant[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyInput, setReplyInput] = useState('');
  const [attachment, setAttachment] = useState<PendingAttachment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = async (conversationId: string) => {
    const response = await api.get(`/chat/messages/${encodeURIComponent(conversationId)}`);
    setMessages(response.data?.data || []);
  };

  const loadConversations = async (preferredId?: string) => {
    const response = await api.get('/chat/conversations');
    const next: Conversation[] = response.data?.data || [];
    setConversations(next);
    const selected = next.find((item) => item.conversationId === preferredId)
      || next.find((item) => item.conversationId === activeConversation?.conversationId)
      || next[0]
      || null;
    setActiveConversation(selected);
    return selected;
  };

  const loadPage = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [conversationResponse, facultyResponse] = await Promise.all([
        api.get('/chat/conversations'),
        api.get('/chat/faculty/list'),
      ]);
      const next: Conversation[] = conversationResponse.data?.data || [];
      setConversations(next);
      setAvailableFaculty(facultyResponse.data?.data || []);
      const first = next[0] || null;
      setActiveConversation(first);
      if (first) await loadMessages(first.conversationId);
      else setMessages([]);
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'We could not load your conversations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void loadPage(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const selectConversation = async (conversation: Conversation) => {
    setActiveConversation(conversation);
    setSelectedFacultyId('');
    setError('');
    try { await loadMessages(conversation.conversationId); }
    catch (requestError: any) { setError(requestError.response?.data?.message || 'We could not load this conversation.'); }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) return toast.error('Attachments must be 25 MB or smaller.');
    const reader = new FileReader();
    reader.onload = () => setAttachment({ name: file.name, base64: String(reader.result || '') });
    reader.onerror = () => toast.error('We could not read that file.');
    reader.readAsDataURL(file);
  };

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    const recipientId = activeConversation?.participant.id || selectedFacultyId;
    if (!recipientId) return toast.error('Choose an authorized faculty member.');
    if (!replyInput.trim() && !attachment) return toast.error('Enter a message or attach a file.');
    setIsSending(true);
    try {
      const response = await api.post('/chat/messages', {
        recipientId,
        message: replyInput.trim(),
        priority: 'NORMAL',
        attachmentBase64: attachment?.base64,
        attachmentName: attachment?.name,
      });
      setReplyInput('');
      setAttachment(null);
      const selected = await loadConversations(response.data?.data?.conversationId);
      if (selected) await loadMessages(selected.conversationId);
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || 'We could not send your message.');
    } finally { setIsSending(false); }
  };

  const openAttachment = async (message: ChatMessage) => {
    if (!message.attachmentUrl) return;
    const result = await downloadAndOpen(
      message.attachmentUrl,
      `chat-attachment-${message.id}.${(message.attachmentType || 'bin').toLowerCase()}`,
    );
    if (!result.success) toast.error(result.error || 'We could not open this attachment.');
  };

  if (isLoading) return <Loading text="Loading conversations..." />;
  const recipient = activeConversation?.participant || availableFaculty.find((item) => item.id === selectedFacultyId) || null;

  return (
    <section className="min-h-[calc(100dvh-9rem)] lg:h-[calc(100dvh-8rem)] grid grid-cols-1 lg:grid-cols-[18rem_minmax(0,1fr)] gap-4">
      <aside className="rounded-2xl bg-card ring-1 ring-border/70 overflow-hidden">
        <div className="p-4 border-b border-border">
          <h1 className="text-base font-bold">Faculty conversations</h1>
          <p className="mt-1 text-xs text-muted-foreground">Only assigned mentors and class faculty are available.</p>
        </div>
        {conversations.length ? (
          <div className="flex lg:block gap-2 overflow-x-auto lg:overflow-y-auto p-2 lg:max-h-[calc(100dvh-16rem)]">
            {conversations.map((conversation) => (
              <button key={conversation.conversationId} type="button" onClick={() => void selectConversation(conversation)} className={`min-w-64 lg:min-w-0 w-full rounded-xl p-3 text-left transition-colors ${activeConversation?.conversationId === conversation.conversationId ? 'bg-primary/10 text-primary' : 'hover:bg-muted/60'}`}>
                <div className="flex items-center gap-3">
                  <span className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{initials(conversation.participant.name)}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{conversation.participant.name}</span><span className="block truncate text-xs text-muted-foreground">{conversation.lastMessage?.message || 'Attachment'}</span></span>
                  {conversation.unreadCount > 0 && <span className="rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">{conversation.unreadCount}</span>}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-5 text-center"><MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/40" /><p className="mt-3 text-sm font-semibold">No conversations yet</p><p className="mt-1 text-xs text-muted-foreground">Choose an authorized faculty member to begin.</p></div>
        )}
      </aside>

      <div className="min-h-[30rem] rounded-2xl bg-card ring-1 ring-border/70 overflow-hidden flex flex-col">
        <header className="p-4 border-b border-border flex items-center gap-3">
          <span className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{recipient ? initials(recipient.name) : <UserRound className="h-5 w-5" />}</span>
          <div className="min-w-0 flex-1">
            {recipient ? <><p className="truncate text-sm font-bold">{recipient.name}</p><p className="truncate text-xs text-muted-foreground">{[recipient.designation, recipient.department].filter(Boolean).join(' · ') || 'Faculty'}</p></> : (
              <select value={selectedFacultyId} onChange={(event) => setSelectedFacultyId(event.target.value)} className="w-full max-w-sm rounded-xl border border-border bg-background px-3 py-2 text-sm" aria-label="Choose faculty member"><option value="">Choose faculty member</option>{availableFaculty.map((faculty) => <option key={faculty.id} value={faculty.id}>{faculty.name}{faculty.designation ? ` · ${faculty.designation}` : ''}</option>)}</select>
            )}
          </div>
          <button type="button" onClick={() => void loadPage()} className="touch-target rounded-xl p-2 text-muted-foreground hover:bg-muted" aria-label="Refresh conversations"><RefreshCw className="h-4 w-4" /></button>
        </header>

        {error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center"><p className="text-sm font-semibold text-danger">{error}</p><button type="button" onClick={() => void loadPage()} className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Retry</button></div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 bg-muted/20">
            {messages.length === 0 && recipient && <p className="py-12 text-center text-sm text-muted-foreground">No messages in this conversation.</p>}
            {!recipient && <p className="py-12 text-center text-sm text-muted-foreground">Select a faculty member to view or start a conversation.</p>}
            {messages.map((message) => {
              const mine = message.senderRole === 'Student';
              return <article key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[84%] sm:max-w-[72%] rounded-2xl px-3.5 py-3 text-sm ${mine ? 'rounded-br-sm bg-primary text-primary-foreground' : 'rounded-bl-sm bg-background ring-1 ring-border'}`}>{message.message && <p className="whitespace-pre-wrap break-words">{message.message}</p>}{message.attachmentUrl && <button type="button" className="mt-2 block underline underline-offset-2" onClick={() => void openAttachment(message)}>Open {message.attachmentType || 'attachment'}</button>}<p className={`mt-1.5 text-[10px] ${mine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{new Date(message.sentTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}{mine && <CheckCircle className="ml-1 inline h-3 w-3" />}</p></div></article>;
            })}
            <div ref={messagesEndRef} />
          </div>
        )}

        <form onSubmit={handleSend} className="border-t border-border bg-card p-3 sm:p-4">
          {attachment && <div className="mb-2 flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-xs"><span className="truncate">{attachment.name}</span><button type="button" onClick={() => setAttachment(null)} className="font-semibold text-danger">Remove</button></div>}
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="touch-target rounded-xl border border-border p-2.5 text-muted-foreground hover:bg-muted" aria-label="Attach file"><Paperclip className="h-4 w-4" /></button>
            <input value={replyInput} onChange={(event) => setReplyInput(event.target.value)} placeholder="Write a message" disabled={!recipient || isSending} className="min-h-11 flex-1 rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-60" />
            <button type="submit" disabled={!recipient || isSending} className="touch-target rounded-xl bg-primary px-4 text-primary-foreground active:scale-[0.98] disabled:opacity-50" aria-label="Send message"><Send className="h-4 w-4" /></button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default StudentAdvisorChat;
