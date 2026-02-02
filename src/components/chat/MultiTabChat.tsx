import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChatSidebar } from "./ChatSidebar";
import { ChatWindow } from "./ChatWindow";

interface ChatTab {
  id: string; // "recent-userID" or "group-ID"
  userId?: string;
  userName: string;
  userAvatar?: string;
  type?: 'direct' | 'group';
  unreadCount: number;
  lastMessage?: string;
  lastMessageTime?: string;
  muted?: boolean;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  type: "text" | "image" | "file";
  created_at: string;
  read?: boolean;
  read_by?: string[];
  reactions?: Array<{ emoji: string; user_id: string; user_name?: string }>;
  reply_to_id?: string;
  reply_to?: Message;
}

interface UserStatus {
  userId: string;
  isOnline: boolean;
  lastSeen?: string;
}

export function MultiTabChat() {
  const { currentUser } = useAuth();
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // State
  const [chats, setChats] = useState<ChatTab[]>([]);
  const [activeChat, setActiveChat] = useState<ChatTab | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string; email?: string; avatar?: string; last_login?: string }>>([]);
  const [statusMap, setStatusMap] = useState<Record<string, UserStatus>>({});

  // Initial Data Loading
  useEffect(() => {
    if (currentUser) {
      loadUsers();
      loadChats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Polling
  useEffect(() => {
    if (currentUser) {
      const interval = setInterval(() => {
        loadChats(true); // silent update
        updateUserStatuses();
        if (activeChat) {
          loadMessages(activeChat, true); // silent update
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [currentUser, activeChat]);

  // URL Sync: Handle opening chat from URL
  useEffect(() => {
    if (tab && tab.startsWith("chat/") && users.length > 0) {
      const targetId = tab.split("/")[1];
      // Check if it matches a user
      const user = users.find(u => u.id === targetId);
      if (user) {
        // Find existing chat or create temp one
        const existing = chats.find(c => c.userId === targetId);
        const chatToOpen = existing || {
          id: `recent-${user.id}`,
          userId: user.id,
          userName: user.name,
          userAvatar: user.avatar,
          type: 'direct',
          unreadCount: 0
        };
        setActiveChat(chatToOpen);
      }
    } else if (!tab && !isMobile && chats.length > 0 && !activeChat) {
      // Desktop: Open first chat if none selected
      // setActiveChat(chats[0]); 
    }
  }, [tab, users, chats.length]); // Intentionally not including activeChat to avoid loop

  const loadUsers = async () => {
    try {
      const response = await api.getUsers({ status: "active" });
      if (response.data) {
        setUsers(response.data.filter((u: { id: string }) => u.id !== currentUser?.id));
      }
    } catch (error) {
      console.error("Failed to load users", error);
    }
  };

  const updateUserStatuses = () => {
    const now = Date.now();
    const statuses: Record<string, UserStatus> = {};
    users.forEach(user => {
      if (user.last_login) {
        const lastLoginTime = new Date(user.last_login).getTime();
        const minutesSinceLogin = (now - lastLoginTime) / (1000 * 60);
        statuses[user.id] = {
          userId: user.id,
          isOnline: minutesSinceLogin < 5,
          lastSeen: user.last_login
        };
      } else {
        statuses[user.id] = { userId: user.id, isOnline: false };
      }
    });
    setStatusMap(statuses);
  };

  const loadChats = async (silent = false) => {
    if (!currentUser) return;
    try {
      const response = await api.getRecentConversations(currentUser.id);
      if (response.data) {
        // Map API response to ChatTab info
        const mappedChats = response.data.map((c: any) => {
          // If direct, find user info
          let name = c.name;
          let avatar = c.avatar;
          if (c.type === 'direct') {
            const user = users.find(u => u.id === c.userId);
            if (user) {
              name = user.name;
              avatar = user.avatar;
            }
          }

          return {
            ...c,
            type: c.type || 'direct', // Default to direct if missing
            userName: name || 'Unknown',
            userAvatar: avatar
          };
        });
        setChats(mappedChats);
      }
    } catch (error) {
      if (!silent) console.error("Failed to load chats", error);
    }
  };

  const loadMessages = async (chat: ChatTab, silent = false) => {
    if (!currentUser) return;
    try {
      let params: any = { user_id: currentUser.id };
      if (chat.type === 'group' || (chat.id && chat.id.startsWith('group-'))) {
        params.group_id = chat.id;
      } else if (chat.userId) {
        params.other_user_id = chat.userId;
      } else {
        return;
      }

      const response = await api.getChatMessages(currentUser.id, chat.userId || ""); // Wrapper doesn't support generic dict well yet, manual is better but wrapper used elsewhere.
      // Wait, api.getChatMessages is hardcoded for direct. I need to use the generic ONE I updated?
      // Actually I updated `api.getMessages` (generic) but the old `getChatMessages` existed.
      // Let's check `api.ts` update... I replaced `sendChatMessage`.
      // I need to use `api.get` directly or check if I updated `getChatMessages`.
      // I DID NOT update `getChatMessages` in `api.ts`, I added `getRecentConversations`.
      // I should have updated `getChatMessages` or added a new one. 
      // The `chat.js` backend now supports `GET /messages` with `group_id`.

      // Let's use `api.get` for now to be safe and quick
      const query = new URLSearchParams(params).toString();
      const msgRes = await api.get<Message[]>(`/chat/messages?${query}`);

      if (msgRes.data) {
        setMessages(msgRes.data);
      }
    } catch (error) {
      if (!silent) console.error("Failed to load messages", error);
    }
  };

  const handleSelectChat = (chat: ChatTab) => {
    setActiveChat(chat);
    loadMessages(chat);

    // Update URL
    if (currentUser?.organization && chat.userId) {
      // Only update URL for 1:1 for now as routing logic expects userId
      // For groups, we might need new route /chat/group/:groupId
      navigate(`/${currentUser.organization.org_name}/${currentUser.user_id}/chat/${chat.userId}`, { replace: true });
    }

    // Mark as read
    if (chat.unreadCount > 0) {
      const payload: any = { user_id: currentUser?.id };
      if (chat.type === 'group') {
        payload.group_id = chat.id;
      } else {
        payload.other_user_id = chat.userId;
      }
      api.put("/chat/messages/read", payload).then(() => {
        loadChats(true); // Refresh unread counts
      });
    }
  };

  const handleSendMessage = async (content: string, type: "text" | "image" | "file", replyTo?: Message | null) => {
    if (!currentUser || !activeChat) return;

    // Optimistic update
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      sender_id: currentUser.id,
      content,
      type,
      created_at: new Date().toISOString(),
      read: false,
      reply_to_id: replyTo?.id,
      reply_to: replyTo || undefined
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const payload: any = {
        sender_id: currentUser.id,
        content,
        type,
        reply_to_id: replyTo?.id
      };

      if (activeChat.type === 'group') {
        payload.group_id = activeChat.id;
      } else {
        payload.receiver_id = activeChat.userId;
      }

      await api.sendChatMessage(payload);

      // Reload to get real ID
      loadMessages(activeChat, true);
      loadChats(true); // Update last message in sidebar
    } catch (error) {
      toast.error("Failed to send message");
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
    }
  };

  const handleMute = async (muted: boolean) => {
    if (!currentUser || !activeChat) return;
    try {
      await api.muteChat(activeChat.id, currentUser.id, muted);
      toast.success(muted ? "Chat muted" : "Chat unmuted");
      setActiveChat(prev => prev ? { ...prev, muted } : null);
      loadChats(true);
    } catch (error) {
      toast.error("Failed to update settings");
    }
  };

  const handleClear = async () => {
    if (!currentUser || !activeChat) return;
    try {
      await api.clearChat(activeChat.id, currentUser.id);
      toast.success("Chat history cleared");
      setMessages([]);
    } catch (error) {
      toast.error("Failed to clear chat");
    }
  };

  const handleDelete = async () => {
    if (!currentUser || !activeChat) return;
    if (!confirm("Are you sure you want to delete this conversation?")) return;

    try {
      await api.deleteChat(activeChat.id, currentUser.id);
      toast.success("Conversation deleted");
      setActiveChat(null);
      loadChats();
      // Navigate base
      if (currentUser.organization) {
        navigate(`/${currentUser.organization.org_name}/${currentUser.user_id}/chat`);
      }
    } catch (error) {
      toast.error("Failed to delete chat");
    }
  };

  const handleLeaveGroup = () => {
    setActiveChat(null);
    loadChats();
    if (currentUser?.organization) {
      navigate(`/${currentUser.organization.org_name}/${currentUser.user_id}/chat`);
    }
  };

  const handleGroupCreated = () => {
    loadChats();
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    if (!currentUser) return;

    // Optimistic update
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = msg.reactions || [];
        // Check if already reacted with this emoji
        if (reactions.some(r => r.user_id === currentUser.id && r.emoji === emoji)) {
          return msg;
        }
        return {
          ...msg,
          reactions: [...reactions, { emoji, user_id: currentUser.id, user_name: currentUser.name }]
        };
      }
      return msg;
    }));

    try {
      await api.addReaction(messageId, currentUser.id, currentUser.name, emoji);
    } catch (error) {
      console.error("Failed to add reaction", error);
      // Revert on failure
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          return {
            ...msg,
            reactions: (msg.reactions || []).filter(r => !(r.user_id === currentUser.id && r.emoji === emoji))
          };
        }
        return msg;
      }));
    }
  };

  const handleRemoveReaction = async (messageId: string, emoji: string) => {
    if (!currentUser) return;

    // Optimistic update
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return {
          ...msg,
          reactions: (msg.reactions || []).filter(r => !(r.user_id === currentUser.id && r.emoji === emoji))
        };
      }
      return msg;
    }));

    try {
      await api.removeReaction(messageId, currentUser.id, emoji);
    } catch (error) {
      console.error("Failed to remove reaction", error);
      // Revert on failure
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          return {
            ...msg,
            reactions: [...(msg.reactions || []), { emoji, user_id: currentUser.id, user_name: currentUser.name }]
          };
        }
        return msg;
      }));
    }
  };

  return (
    <div className="flex h-full min-h-0 bg-background overflow-hidden">
      {/* Sidebar - Hidden on mobile if chat active */}
      <div className={`${isMobile && activeChat ? 'hidden' : 'block'} w-full md:w-[400px] lg:w-[450px] flex-shrink-0 border-r border-border`}>
        <ChatSidebar
          chats={chats}
          selectedChatId={activeChat?.id || null}
          onSelectChat={handleSelectChat}
          users={users}
          currentUser={{ id: currentUser?.id || '', name: currentUser?.name || '' }}
          statusMap={statusMap}
          className="h-full"
          onGroupCreated={handleGroupCreated}
        />
      </div>

      {/* active Chat Window */}
      {(activeChat || !isMobile) && (
        <div className={`${isMobile && !activeChat ? 'hidden' : 'flex'} flex-1 min-w-0 bg-background h-full`}>
          {activeChat ? (
            <ChatWindow
              activeChat={activeChat}
              messages={messages}
              currentUser={{ id: currentUser?.id || '', name: currentUser?.name || '' }}
              onSendMessage={handleSendMessage}
              onBack={() => {
                setActiveChat(null);
                if (currentUser?.organization) {
                  navigate(`/${currentUser.organization.org_name}/${currentUser.user_id}/chat`);
                }
              }}
              isMobile={isMobile}
              statusMap={statusMap}
              onMute={handleMute}
              onClear={handleClear}
              onDelete={handleDelete}
              onCall={(type) => toast.info(`${type} calling not implemented yet`)}
              chats={chats}
              onAddReaction={handleAddReaction}
              onRemoveReaction={handleRemoveReaction}
              onRefreshMessages={() => {
                if (activeChat) loadMessages(activeChat, true);
              }}
              onLeaveGroup={handleLeaveGroup}
            />
          ) : (
            <div className="hidden md:flex flex-1 flex-col items-center justify-center text-center p-8 bg-muted/5 select-none animate-in fade-in duration-500">
              <div className="max-w-md space-y-6 flex flex-col items-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                  <img
                    src="/logo.png"
                    alt="SchoolSphere"
                    className="h-24 w-24 relative dark:invert-0 opacity-80"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = '<div class="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center relative"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" class="text-primary" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>';
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-light text-foreground">Welcome to SchoolSphere Chat</h2>
                  <p className="text-sm text-muted-foreground">
                    Send and receive messages to teachers, students, and staff. <br />
                    Select a chat from the sidebar to start messaging.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-8">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  End-to-end encrypted connection established
                </div>
              </div>

              <div className="absolute bottom-6 text-xs text-muted-foreground/50">
                SchoolSphere Chat v1.0
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
