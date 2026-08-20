import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle, MessageSquare, Paperclip, RefreshCw, Send, UserRound, Users, Plus, Info } from 'lucide-react';
import api from '../../lib/axios';
import { downloadAndOpen } from '../../platform/download';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import { ProfileAvatar } from '../../components/profile/ProfileAvatar';
import { CreateGroupModal } from '../../components/chat/CreateGroupModal';
import { GroupInfoModal } from '../../components/chat/GroupInfoModal';
import { useAuth } from '../../context/AuthContext';
import { realtimeClient } from '../../realtime/realtime-client';

interface Participant {
  id: string;
  name: string;
  designation?: string | null;
  department?: string | null;
  profilePhoto?: string | null;
}

interface Conversation {
  conversationId: string;
  type: string;
  title: string;
  avatar?: string | null;
  participant?: Participant | null;
  unreadCount: number;
  lastMessage?: {
    id: string;
    message: string;
    sentTime: string;
    senderRole: string;
    senderName?: string;
  } | null;
}

interface ChatMessage {
  id: string;
  conversationId: string;
  message: string;
  sentTime: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string | null;
  senderRole: 'Student' | 'Faculty';
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  status: string;
}

interface PendingAttachment {
  name: string;
  base64: string;
}

export const StudentAdvisorChat: React.FC = () => {
  const { user } = useAuth();
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
  
  // Modals state
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await api.get(`/chat/messages/${encodeURIComponent(conversationId)}`);
      setMessages(response.data?.data || []);
    } catch (_) {
      toast.error('Failed to load message history.');
    }
  };

  const loadConversations = async (preferredId?: string) => {
    try {
      const response = await api.get('/chat/conversations');
      const next: Conversation[] = response.data?.data || [];
      setConversations(next);
      
      const currentActiveId = preferredId || activeConversation?.conversationId;
      const selected = next.find((item) => item.conversationId === currentActiveId)
        || next[0]
        || null;
      
      setActiveConversation(selected);
      if (selected) {
        await loadMessages(selected.conversationId);
      }
      return selected;
    } catch (_) {
      console.warn('Failed to load conversations.');
    }
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
      if (first) {
        await loadMessages(first.conversationId);
      } else {
        setMessages([]);
      }
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'We could not load your conversations.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    void loadPage();
  }, []);

  // Realtime subscription
  useEffect(() => {
    if (!realtimeClient) return;

    const unsubscribe = realtimeClient.subscribe((event: any) => {
      if (event.type === 'message:sent') {
        const payload = event.payload;
        // Reload conversations list to show newest snippets
        void loadConversations();

        // If the message belongs to current active thread, reload history
        if (activeConversation && payload?.conversationId === activeConversation.conversationId) {
          void loadMessages(activeConversation.conversationId);
        }
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [activeConversation?.conversationId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectConversation = async (conversation: Conversation) => {
    setActiveConversation(conversation);
    setSelectedFacultyId('');
    setError('');
    try {
      await loadMessages(conversation.conversationId);
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'We could not load this conversation.');
    }
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
    const recipientId = activeConversation?.participant?.id || selectedFacultyId;
    const conversationId = activeConversation?.conversationId;

    if (!conversationId && !recipientId) {
      return toast.error('Choose a conversation or faculty member.');
    }
    if (!replyInput.trim() && !attachment) {
      return toast.error('Enter a message or attach a file.');
    }
    setIsSending(true);
    try {
      const response = await api.post('/chat/messages', {
        recipientId: conversationId ? undefined : recipientId,
        conversationId,
        message: replyInput.trim(),
        priority: 'NORMAL',
        attachmentBase64: attachment?.base64,
        attachmentName: attachment?.name,
      });
      setReplyInput('');
      setAttachment(null);
      
      const newConvId = response.data?.data?.conversationId;
      await loadConversations(newConvId);
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || 'We could not send your message.');
    } finally {
      setIsSending(false);
    }
  };

  const openAttachment = async (message: ChatMessage) => {
    if (!message.attachmentUrl) return;
    const result = await downloadAndOpen(
      message.attachmentUrl,
      `chat-attachment-${message.id}.${(message.attachmentType || 'bin').toLowerCase()}`,
    );
    if (!result.success) toast.error(result.error || 'We could not open this attachment.');
  };

  const handleGroupCreated = (newConvId: string) => {
    void loadConversations(newConvId);
  };

  if (isLoading) return <Loading text="Loading conversations..." />;

  const isGroupChat = activeConversation?.type === 'GROUP';
  const recipient = activeConversation?.participant || availableFaculty.find((item) => item.id === selectedFacultyId) || null;

  return (
    <section className="min-h-[calc(100dvh-9rem)] lg:h-[calc(100dvh-8rem)] grid grid-cols-1 lg:grid-cols-[20rem_minmax(0,1fr)] gap-4">
      {/* Sidebar: Conversations List */}
      <aside className="rounded-2xl bg-card ring-1 ring-border/70 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h1 className="text-sm font-extrabold text-foreground">Conversations</h1>
            <p className="mt-0.5 text-[10px] text-muted-foreground">Direct and group collaboration</p>
          </div>
          <button
            onClick={() => setIsCreateGroupOpen(true)}
            className="flex items-center gap-1 text-[10px] bg-primary text-primary-foreground font-bold hover:bg-primary/95 rounded-lg px-2 py-1.5 transition-all shadow-xs active:scale-95"
            title="Create new group"
          >
            <Plus className="h-3 w-3" />
            Group
          </button>
        </div>
        
        {conversations.length ? (
          <div className="flex-1 flex lg:block gap-2 overflow-x-auto lg:overflow-y-auto p-2 lg:max-h-[calc(100dvh-16rem)] space-y-1">
            {conversations.map((conv) => {
              const isSelected = activeConversation?.conversationId === conv.conversationId;
              const hasGroupLabel = conv.type === 'GROUP';
              const displayTitle = conv.title || 'Group Chat';
              const displaySub = conv.lastMessage?.message || 'New conversation started';

              return (
                <button
                  key={conv.conversationId}
                  type="button"
                  onClick={() => void selectConversation(conv)}
                  className={`min-w-[15rem] lg:min-w-0 w-full rounded-xl p-3 text-left transition-colors flex items-center justify-between ${
                    isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {hasGroupLabel ? (
                      <ProfileAvatar
                        person={{ fullName: displayTitle, profilePhoto: conv.avatar }}
                        size="sm"
                        shape="circle"
                      />
                    ) : (
                      <ProfileAvatar
                        person={{ fullName: conv.participant?.name || 'User', profilePhoto: conv.participant?.profilePhoto }}
                        size="sm"
                        shape="circle"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="block truncate text-xs font-bold text-foreground">{displayTitle}</span>
                        {hasGroupLabel && (
                          <span className="inline-flex text-[8px] font-extrabold uppercase px-1 rounded-sm bg-primary/20 text-primary shrink-0">
                            Group
                          </span>
                        )}
                      </div>
                      <span className="block truncate text-[10px] text-muted-foreground mt-0.5">{displaySub}</span>
                    </div>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="rounded-full bg-primary px-1.5 py-0.5 text-[8px] font-bold text-primary-foreground shrink-0 ml-2 animate-bounce">
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center flex-1 flex flex-col justify-center items-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs font-bold text-foreground">No conversations yet</p>
            <p className="text-[10px] text-muted-foreground mt-1 max-w-xs">
              Choose an authorized faculty member or create a group to begin.
            </p>
          </div>
        )}
      </aside>

      {/* Main Chat Area */}
      <div className="min-h-[30rem] rounded-2xl bg-card ring-1 ring-border/70 overflow-hidden flex flex-col">
        {/* Header */}
        <header className="p-4 border-b border-border flex items-center justify-between bg-muted/5">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {isGroupChat ? (
              <button
                onClick={() => setIsGroupInfoOpen(true)}
                className="flex items-center gap-3 text-left hover:opacity-90 min-w-0"
              >
                <ProfileAvatar
                  person={{ fullName: activeConversation.title, profilePhoto: activeConversation.avatar }}
                  size="sm"
                  shape="circle"
                />
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-foreground flex items-center gap-1">
                    {activeConversation.title}
                    <Info className="h-3 w-3 text-primary inline" />
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground mt-0.5">Click for group info</p>
                </div>
              </button>
            ) : recipient ? (
              <div className="flex items-center gap-3 min-w-0">
                <ProfileAvatar
                  person={{ fullName: recipient.name, profilePhoto: recipient.profilePhoto }}
                  size="sm"
                  shape="circle"
                />
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-foreground">{recipient.name}</p>
                  <p className="truncate text-[10px] text-muted-foreground mt-0.5">
                    {[recipient.designation, recipient.department].filter(Boolean).join(' · ') || 'Faculty'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 w-full">
                <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <UserRound className="h-4.5 w-4.5" />
                </div>
                <select
                  value={selectedFacultyId}
                  onChange={(event) => setSelectedFacultyId(event.target.value)}
                  className="w-full max-w-sm rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold focus:outline-none"
                  aria-label="Choose faculty member"
                >
                  <option value="">Choose faculty member to message...</option>
                  {availableFaculty.map((faculty) => (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.name} {faculty.designation ? ` · ${faculty.designation}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => void loadPage()}
            className="rounded-xl p-2 text-muted-foreground hover:bg-muted"
            aria-label="Refresh conversations"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </header>

        {/* Message Thread */}
        {error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <p className="text-xs font-bold text-danger">{error}</p>
            <button
              type="button"
              onClick={() => void loadPage()}
              className="mt-3 rounded-xl bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-muted/10">
            {messages.length === 0 && (recipient || isGroupChat) && (
              <p className="py-12 text-center text-xs text-muted-foreground">No messages in this conversation.</p>
            )}
            {!recipient && !isGroupChat && (
              <p className="py-12 text-center text-xs text-muted-foreground">
                Select a faculty member or click group to begin conversation.
              </p>
            )}
            {messages.map((message) => {
              const mine = message.senderId === user?.id;
              const showSenderName = isGroupChat && !mine;

              return (
                <article key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-xs font-semibold shadow-xs transition-all ${
                      mine
                        ? 'rounded-tr-none bg-primary text-primary-foreground'
                        : 'rounded-tl-none bg-card border border-border text-foreground'
                    }`}
                  >
                    {showSenderName && (
                      <span className="block text-[9px] font-extrabold text-primary mb-1 uppercase tracking-wider">
                        {message.senderName}
                      </span>
                    )}
                    {message.message && <p className="whitespace-pre-wrap break-words leading-relaxed">{message.message}</p>}
                    {message.attachmentUrl && (
                      <button
                        type="button"
                        className="mt-2 text-[10px] font-extrabold flex items-center gap-1 underline underline-offset-2 hover:opacity-85"
                        onClick={() => void openAttachment(message)}
                      >
                        <Paperclip className="h-3 w-3" />
                        Open {message.attachmentType || 'attachment'}
                      </button>
                    )}
                    <div className="flex items-center justify-end gap-1 mt-1.5">
                      <span className={`text-[8px] ${mine ? 'text-primary-foreground/70' : 'text-neutral-400'}`}>
                        {new Date(message.sentTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {mine && <CheckCircle className="h-3 w-3 text-primary-foreground/75 shrink-0" />}
                    </div>
                  </div>
                </article>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Reply Composer */}
        <form onSubmit={handleSend} className="border-t border-border bg-card p-3 sm:p-4">
          {attachment && (
            <div className="mb-2 flex items-center justify-between rounded-lg bg-muted px-3 py-1.5 text-[10px] font-bold">
              <span className="truncate">{attachment.name}</span>
              <button type="button" onClick={() => setAttachment(null)} className="font-bold text-danger hover:underline">
                Remove
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="touch-target rounded-xl border border-border p-2.5 text-muted-foreground hover:bg-muted"
              aria-label="Attach file"
              disabled={(!recipient && !isGroupChat) || isSending}
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <input
              value={replyInput}
              onChange={(event) => setReplyInput(event.target.value)}
              placeholder={isGroupChat ? "Type your message..." : "Write a message..."}
              disabled={(!recipient && !isGroupChat) || isSending}
              className="min-h-11 flex-1 rounded-xl border border-border bg-background px-3.5 text-xs font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={(!recipient && !isGroupChat) || isSending}
              className="touch-target rounded-xl bg-primary px-4 py-2 text-primary-foreground active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Group Modals */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onGroupCreated={handleGroupCreated}
      />

      {activeConversation && (
        <GroupInfoModal
          isOpen={isGroupInfoOpen}
          conversationId={activeConversation.conversationId}
          onClose={() => setIsGroupInfoOpen(false)}
          onLeaveGroup={() => {
            setActiveConversation(null);
            void loadConversations();
          }}
          onGroupUpdated={() => {
            void loadConversations();
          }}
        />
      )}
    </section>
  );
};

export default StudentAdvisorChat;
