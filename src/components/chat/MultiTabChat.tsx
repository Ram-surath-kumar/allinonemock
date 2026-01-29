import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MessageSquare, Phone, Video, X, Minimize2, Search, Check, CheckCheck, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChatTab {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  unreadCount: number;
  minimized: boolean;
  lastMessage?: string;
  lastMessageTime?: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  type: "text" | "image" | "file";
  created_at: string;
  read: boolean;
}

interface UserStatus {
  userId: string;
  isOnline: boolean;
  lastSeen?: string;
}

export function MultiTabChat() {
  const { currentUser } = useAuth();
  const { tab, chatUserId } = useParams<{ tab?: string; chatUserId?: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Use chatUserId from URL params if available, otherwise extract from tab parameter
  const urlUserId = chatUserId || (tab?.startsWith('chat/') ? tab.split('/')[1] : undefined);
  const [tabs, setTabs] = useState<ChatTab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [messageInput, setMessageInput] = useState<Record<string, string>>({});
  const [users, setUsers] = useState<Array<{ id: string; name: string; email?: string; avatar?: string; last_login?: string }>>([]);
  const [userStatuses, setUserStatuses] = useState<Record<string, UserStatus>>({});
  const [recentChats, setRecentChats] = useState<ChatTab[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserList, setShowUserList] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRefs = useRef<Record<string, HTMLInputElement>>({});

  const maxTabs = 3;

  const updateChatUrl = (userId: string) => {
    if (!currentUser?.organization || !currentUser.user_id) return;
    // Use format: /orgName/userId/chat/userId (tab parameter will be "chat/userId")
    const newPath = `/${currentUser.organization.org_name}/${currentUser.user_id}/chat/${userId}`;
    navigate(newPath, { replace: true });
  };

  useEffect(() => {
    if (currentUser) {
      loadUsers();
      loadRecentChats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Separate effect to handle URL-based chat opening after users are loaded
  useEffect(() => {
    if (currentUser && urlUserId && urlUserId !== currentUser.id && users.length > 0) {
      const user = users.find(u => u.id === urlUserId);
      if (user && !tabs.find(t => t.userId === urlUserId)) {
        // Open chat without updating URL (already in URL)
        const newTab: ChatTab = {
          id: `chat-${user.id}-${Date.now()}`,
          userId: user.id,
          userName: user.name,
          userAvatar: user.avatar,
          unreadCount: 0,
          minimized: false
        };
        setTabs(prev => [...prev, newTab]);
        setActiveTab(newTab.id);
        setMessageInput(prev => ({ ...prev, [user.id]: "" }));
        updateUnreadCount(user.id, 0);
        loadMessages(user.id, true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, urlUserId, users.length]);

  useEffect(() => {
    if (tabs.length > 0 && currentUser) {
      // Start polling for new messages
      const interval = setInterval(() => {
        tabs.forEach(tab => {
          if (currentUser) {
            // Only mark as read if this tab is active and not minimized
            const shouldMarkAsRead = tab.id === activeTab && !tab.minimized;
            // Preserve optimistic messages during polling
            loadMessages(tab.userId, shouldMarkAsRead, true);
          }
        });
        // Update user statuses
        updateUserStatuses();
        // Reload recent chats to update unread counts
        loadRecentChats();
      }, 3000); // Poll every 3 seconds

      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabs.length, currentUser, activeTab]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (activeTab && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  useEffect(() => {
    // Mark messages as read when tab becomes active
    if (activeTab && currentUser) {
      const activeTabData = tabs.find(t => t.id === activeTab);
      if (activeTabData && !activeTabData.minimized) {
        // Clear unread count immediately when switching to active tab
        updateUnreadCount(activeTabData.userId, 0);
        loadMessages(activeTabData.userId, true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const updateUserStatuses = () => {
    // For now, assume users are online if they have recent activity (within 5 minutes)
    // In a real app, you'd track this via WebSocket or polling
    const now = Date.now();
    const statuses: Record<string, UserStatus> = {};

    users.forEach(user => {
      if (user.last_login) {
        const lastLoginTime = new Date(user.last_login).getTime();
        const minutesSinceLogin = (now - lastLoginTime) / (1000 * 60);
        statuses[user.id] = {
          userId: user.id,
          isOnline: minutesSinceLogin < 5, // Consider online if active within 5 minutes
          lastSeen: user.last_login
        };
      } else {
        statuses[user.id] = {
          userId: user.id,
          isOnline: false
        };
      }
    });

    setUserStatuses(statuses);
  };

  const loadUsers = async () => {
    try {
      const response = await api.getUsers({ status: "active" });
      if (response.data) {
        // Filter out current user
        const filtered = response.data.filter((u: { id: string }) => u.id !== currentUser?.id);
        setUsers(filtered);
        updateUserStatuses();
      }
    } catch (error) {
      console.error("Failed to load users", error);
    }
  };

  const loadRecentChats = async () => {
    if (!currentUser) return;

    try {
      // Get all users and their last messages
      const allUsers = await api.getUsers({ status: "active" });
      if (!allUsers.data) return;

      const filtered = allUsers.data.filter((u: { id: string }) => u.id !== currentUser?.id);
      const chatsWithMessages: ChatTab[] = [];

      for (const user of filtered) {
        const messagesResponse = await api.getChatMessages(currentUser.id, user.id);
        if (messagesResponse.data && messagesResponse.data.length > 0) {
          const allMessages = messagesResponse.data;
          const lastMessage = allMessages[allMessages.length - 1];

          // Count unread messages (messages sent to current user that are not read)
          const unreadCount = allMessages.filter((m: Message) =>
            m.receiver_id === currentUser.id && !m.read
          ).length;

          chatsWithMessages.push({
            id: `recent-${user.id}`,
            userId: user.id,
            userName: user.name,
            userAvatar: user.avatar,
            unreadCount,
            minimized: false,
            lastMessage: lastMessage.content,
            lastMessageTime: lastMessage.created_at
          });
        }
      }

      // Sort by last message time
      chatsWithMessages.sort((a, b) => {
        if (!a.lastMessageTime || !b.lastMessageTime) return 0;
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });

      setRecentChats(chatsWithMessages.slice(0, 10)); // Keep top 10

      // Update unread counts for open tabs
      chatsWithMessages.forEach(chat => {
        const existingTab = tabs.find(t => t.userId === chat.userId);
        if (existingTab) {
          updateUnreadCount(chat.userId, chat.unreadCount);
        }
      });
    } catch (error) {
      console.error("Failed to load recent chats", error);
    }
  };

  const loadMessages = async (userId: string, markAsRead: boolean = false, _preserveOptimistic: boolean = false) => {
    try {
      const response = await api.getChatMessages(currentUser?.id || "", userId);
      if (response.data) {
        const allMessages = response.data || [];

        // Always preserve optimistic messages AND existing non-temp messages to prevent them from disappearing
        setMessages(prev => {
          const currentMessages = prev[userId] || [];
          const optimisticMessages = currentMessages.filter(m => m.id.startsWith('temp-'));
          // Keep existing non-temp messages that might not be in server response yet (e.g., just sent)
          const existingNonTempMessages = currentMessages.filter(m => !m.id.startsWith('temp-'));

          // Create maps for matching
          const serverMessageMap = new Map<string, Message>();
          const serverMessageIds = new Set(allMessages.map((m: Message) => m.id));

          allMessages.forEach((m: Message) => {
            // Use content + sender + receiver + time bucket (10 seconds) as key
            const timestamp = new Date(m.created_at).getTime();
            const key = `${m.content}-${m.sender_id}-${m.receiver_id}-${Math.floor(timestamp / 10000)}`;
            serverMessageMap.set(key, m);
          });

          // Filter out optimistic messages that have been confirmed by server
          const stillOptimistic = optimisticMessages.filter(optMsg => {
            // Check by ID first
            if (serverMessageIds.has(optMsg.id)) {
              return false; // Server has it with same ID
            }

            // Check by content + sender + receiver + time
            const timestamp = new Date(optMsg.created_at).getTime();
            const key = `${optMsg.content}-${optMsg.sender_id}-${optMsg.receiver_id}-${Math.floor(timestamp / 10000)}`;

            if (serverMessageMap.has(key)) {
              return false; // Server has matching message
            }

            // Keep optimistic messages that are recent (less than 30 seconds old)
            const now = Date.now();
            const msgTime = new Date(optMsg.created_at).getTime();
            return (now - msgTime) < 30000;
          });

          // Merge: server messages + existing non-temp messages (to preserve recently sent messages) + remaining optimistic
          // First, combine server messages with existing non-temp messages, preferring server version
          const combinedMessages = [...existingNonTempMessages];
          allMessages.forEach(serverMsg => {
            const existingIndex = combinedMessages.findIndex(m => m.id === serverMsg.id);
            if (existingIndex >= 0) {
              combinedMessages[existingIndex] = serverMsg; // Update with server version
            } else {
              // Always add server message if it doesn't exist by ID
              // The duplicate check by content+time might incorrectly filter out valid messages
              combinedMessages.push(serverMsg);
            }
          });

          // Merge with optimistic messages
          const merged = [...combinedMessages, ...stillOptimistic];

          // Remove duplicates by ID
          const uniqueMessages = merged.reduce((acc, msg) => {
            if (!acc.find(m => m.id === msg.id)) {
              acc.push(msg);
            }
            return acc;
          }, [] as Message[]);

          return {
            ...prev,
            [userId]: uniqueMessages.sort((a, b) =>
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            )
          };
        });

        // Count unread messages
        const unreadMessages = allMessages.filter((m: Message) =>
          m.receiver_id === currentUser?.id && !m.read
        );
        const unreadCount = unreadMessages.length;

        // Update unread count for this user
        updateUnreadCount(userId, unreadCount);

        // Mark messages as read if tab is active and not minimized
        if (markAsRead && unreadCount > 0) {
          const activeTabData = tabs.find(t => t.userId === userId && t.id === activeTab);
          if (activeTabData && !activeTabData.minimized) {
            try {
              await api.markMessagesAsRead(currentUser?.id || "", userId);
              // Reload messages to get updated read status
              const updatedResponse = await api.getChatMessages(currentUser?.id || "", userId);
              if (updatedResponse.data) {
                setMessages(prev => {
                  const currentMessages = prev[userId] || [];
                  const optimisticMessages = currentMessages.filter(m => m.id.startsWith('temp-'));
                  const serverMessageIds = new Set(updatedResponse.data.map((m: Message) => m.id));
                  const stillOptimistic = optimisticMessages.filter(m => !serverMessageIds.has(m.id));

                  return {
                    ...prev,
                    [userId]: [...updatedResponse.data, ...stillOptimistic].sort((a, b) =>
                      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    )
                  };
                });
                updateUnreadCount(userId, 0);
              }
            } catch (error) {
              console.error("Failed to mark messages as read", error);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to load messages", error);
    }
  };

  const openChat = (user: { id: string; name: string; avatar?: string }) => {
    if (!currentUser) return;

    // Check if chat already open
    const existingTab = tabs.find(t => t.userId === user.id);
    if (existingTab) {
      setActiveTab(existingTab.id);
      setShowUserList(false);
      // Clear unread count immediately when opening existing chat
      updateUnreadCount(user.id, 0);
      // Mark messages as read
      loadMessages(user.id, true);
      // Update URL
      updateChatUrl(user.id);
      return;
    }

    // Check if max tabs reached
    if (tabs.length >= maxTabs) {
      toast.warning(`Maximum ${maxTabs} chats allowed. Close one to open another.`);
      return;
    }

    const newTab: ChatTab = {
      id: `chat-${user.id}-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      unreadCount: 0,
      minimized: false
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTab(newTab.id);
    setMessageInput(prev => ({ ...prev, [user.id]: "" }));
    setShowUserList(false);
    // Clear unread count immediately
    updateUnreadCount(user.id, 0);
    // Load messages and mark as read since we're opening the chat
    loadMessages(user.id, true);
    // Update URL
    updateChatUrl(user.id);
  };

  const handleBackToRecent = () => {
    setActiveTab(null);
    if (currentUser?.organization) {
      navigate(`/${currentUser.organization.org_name}/${currentUser.user_id}/chat`, { replace: true });
    }
  };

  const closeChat = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      setMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[tab.userId];
        return newMessages;
      });
      setMessageInput(prev => {
        const newInput = { ...prev };
        delete newInput[tab.userId];
        return newInput;
      });
    }

    setTabs(prev => {
      const filtered = prev.filter(t => t.id !== tabId);
      if (activeTab === tabId) {
        const newActiveTab = filtered.length > 0 ? filtered[filtered.length - 1].id : null;
        setActiveTab(newActiveTab);
        // Update URL - if there's another tab, go to it, otherwise go to chat base
        if (newActiveTab) {
          const newTab = filtered.find(t => t.id === newActiveTab);
          if (newTab) {
            updateChatUrl(newTab.userId);
          }
        } else {
          // No more tabs, go to base chat URL
          if (currentUser?.organization) {
            navigate(`/${currentUser.organization.org_name}/${currentUser.user_id}/chat`, { replace: true });
          }
        }
      }
      return filtered;
    });

    // Reload recent chats when a tab is closed
    loadRecentChats();
  };

  const toggleMinimize = (tabId: string) => {
    setTabs(prev => prev.map(t =>
      t.id === tabId ? { ...t, minimized: !t.minimized } : t
    ));
  };

  const sendMessage = async (userId: string) => {
    if (!currentUser || !messageInput[userId]?.trim()) return;

    const messageContent = messageInput[userId].trim();
    const tempId = `temp-${Date.now()}`;

    // Optimistic update - add message immediately
    const tempMessage: Message = {
      id: tempId,
      sender_id: currentUser.id,
      receiver_id: userId,
      content: messageContent,
      type: "text",
      created_at: new Date().toISOString(),
      read: false
    };

    // Add optimistic message immediately
    setMessages(prev => ({
      ...prev,
      [userId]: [...(prev[userId] || []), tempMessage]
    }));

    // Clear input immediately
    setMessageInput(prev => ({ ...prev, [userId]: "" }));

    try {
      const response = await api.sendChatMessage({
        sender_id: currentUser.id,
        receiver_id: userId,
        content: messageContent,
        type: "text"
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Replace temp message with actual message from server
      if (response.data) {
        const serverMsg = response.data;

        // Always add/replace the server message - API call succeeded, so message exists
        // Use functional update to ensure we have the latest state
        setMessages(prev => {
          const currentMessages = prev[userId] || [];

          // Remove temp message
          const filtered = currentMessages.filter(m => m.id !== tempId);

          // Check if server message already exists by ID
          const existingByIdIndex = filtered.findIndex(m => m.id === serverMsg.id);

          if (existingByIdIndex >= 0) {
            // Message exists by ID, replace it
            const updated = [...filtered];
            updated[existingByIdIndex] = serverMsg;
            const sorted = updated.sort((a, b) =>
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            return {
              ...prev,
              [userId]: sorted
            };
          }

          // Check if message exists by content + sender + receiver + time
          const existingByContentIndex = filtered.findIndex(m => {
            if (m.content === serverMsg.content &&
              m.sender_id === serverMsg.sender_id &&
              m.receiver_id === serverMsg.receiver_id) {
              const msgTime = new Date(m.created_at).getTime();
              const serverTime = new Date(serverMsg.created_at).getTime();
              return Math.abs(msgTime - serverTime) < 10000;
            }
            return false;
          });

          if (existingByContentIndex >= 0) {
            // Message exists by content match, replace it
            const updated = [...filtered];
            updated[existingByContentIndex] = serverMsg;
            const sorted = updated.sort((a, b) =>
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            return {
              ...prev,
              [userId]: sorted
            };
          }

          // Message doesn't exist, add it
          const updated = [...filtered, serverMsg];
          const sorted = updated.sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );

          return {
            ...prev,
            [userId]: sorted
          };
        });

        // Don't reload immediately - let the polling interval handle it
        // This prevents race conditions where the message might disappear
        // The message is already in state, so it will persist
      } else {
        // If no data returned, keep the optimistic message
        // It will be preserved by loadMessages during polling
      }

      await loadRecentChats(); // Refresh recent chats

      // Focus input after sending
      setTimeout(() => {
        if (messageInputRefs.current[userId]) {
          messageInputRefs.current[userId].focus();
        }
      }, 100);
    } catch (error) {
      // Remove optimistic message on error
      setMessages(prev => ({
        ...prev,
        [userId]: (prev[userId] || []).filter(m => m.id !== tempId)
      }));
      // Restore input
      setMessageInput(prev => ({ ...prev, [userId]: messageContent }));
      const errorMessage = error instanceof Error ? error.message : "Failed to send message";
      toast.error(errorMessage);
    }
  };

  const startCall = async (userId: string, type: "audio" | "video") => {
    try {
      const response = await api.initiateCall({
        caller_id: currentUser?.id,
        receiver_id: userId,
        type
      });

      if (response.error) {
        throw new Error(response.error);
      }

      toast.success(`${type === "video" ? "Video" : "Audio"} call initiated`);
      // TODO: In a real implementation, you would open WebRTC connection here
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to initiate call";
      toast.error(errorMessage);
    }
  };

  const updateUnreadCount = (userId: string, count: number) => {
    setTabs(prev => prev.map(t =>
      t.userId === userId ? { ...t, unreadCount: count } : t
    ));
  };

  const getTabWidth = () => {
    const activeTabs = tabs.filter(t => !t.minimized);
    const count = activeTabs.length;
    if (count === 0) return "100%";
    if (count === 1) return "100%";
    if (count === 2) return "50%";
    if (count === 3) return "33.333%";
    return `${100 / count}%`;
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const minimizedTabs = tabs.filter(t => t.minimized);

  const getStatusText = (userId: string) => {
    const status = userStatuses[userId];
    if (!status) return "Offline";

    if (status.isOnline) {
      return "Online";
    } else if (status.lastSeen) {
      try {
        return `Last seen ${formatDistanceToNow(new Date(status.lastSeen), { addSuffix: true })}`;
      } catch {
        return "Offline";
      }
    }
    return "Offline";
  };

  return (
    <div className="flex h-full min-h-0 bg-card overflow-hidden">
      {/* Left Sidebar - Recent Chats */}
      {(!isMobile || !activeTab) && (
        <div className={cn(
          "border-border bg-muted/30 flex flex-col shrink-0 transition-all",
          isMobile ? "w-full" : "w-64 border-r"
        )}>
          <div className="p-3 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-sm">Recent Chats</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary"
              onClick={() => window.dispatchEvent(new CustomEvent("toggle-ai-assistant"))}
              title="AI Assistant"
            >
              <Sparkles className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {recentChats.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                  <MessageSquare className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">No active chats</p>
                  <Button size="sm" onClick={() => setShowUserList(true)}>
                    Start a conversation
                  </Button>
                </div>
              ) : (
                recentChats.map((chat) => {
                  const isOpen = tabs.some(t => t.userId === chat.userId);
                  return (
                    <div
                      key={chat.id}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
                        isOpen ? "bg-primary/10" : "hover:bg-muted"
                      )}
                      onClick={() => {
                        const user = users.find(u => u.id === chat.userId);
                        if (user) {
                          // Clear unread count in recent chats when opening
                          setRecentChats(prev => prev.map(c =>
                            c.userId === chat.userId ? { ...c, unreadCount: 0 } : c
                          ));
                          openChat(user);
                        }
                      }}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={chat.userAvatar} />
                        <AvatarFallback className="text-xs">
                          {chat.userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate">{chat.userName}</p>
                          {chat.unreadCount > 0 && (
                            <Badge variant="destructive" className="h-4 px-1.5 text-[10px] shrink-0">
                              {chat.unreadCount}
                            </Badge>
                          )}
                        </div>
                        {chat.lastMessage && (
                          <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
          <div className="p-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowUserList(true)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      {(!isMobile || activeTab) && (
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Chat Windows */}
          {tabs.length > 0 ? (
            <div className="flex-1 flex relative min-h-0">
              {tabs.filter(t => !t.minimized).filter(t => !isMobile || t.id === activeTab).map(tab => {
                const tabMessages = messages[tab.userId] || [];
                const statusText = getStatusText(tab.userId);

                return (
                  <div
                    key={tab.id}
                    className={cn(
                      "flex flex-col border-r border-border last:border-r-0 transition-all",
                      "flex-1 min-w-0"
                    )}
                    style={{
                      width: isMobile ? "100%" : getTabWidth(),
                      flex: isMobile ? "1 1 100%" : `1 1 ${getTabWidth()}`
                    }}
                  >
                    {/* Chat Header */}
                    <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-border bg-muted/30 shrink-0">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {isMobile && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 mr-1" onClick={handleBackToRecent}>
                            <ArrowLeft className="h-4 w-4" />
                          </Button>
                        )}
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={tab.userAvatar} />
                          <AvatarFallback>
                            {tab.userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{tab.userName}</p>
                            {tab.unreadCount > 0 && (
                              <Badge variant="destructive" className="h-4 px-1 text-[10px] shrink-0">
                                {tab.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className={cn(
                            "text-xs truncate",
                            userStatuses[tab.userId]?.isOnline ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                          )}>
                            {statusText}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary"
                          onClick={() => window.dispatchEvent(new CustomEvent("toggle-ai-assistant"))}
                          title="AI Assistant"
                        >
                          <Sparkles className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => startCall(tab.userId, "audio")}
                          title="Audio Call"
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        {/* @ts-expect-error - Button accepts children */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => startCall(tab.userId, "video")}
                          title="Video Call"
                        >
                          <Video className="h-4 w-4" />
                        </Button>
                        {/* @ts-expect-error - Button accepts children */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleMinimize(tab.id)}
                          title="Minimize"
                        >
                          <Minimize2 className="h-4 w-4" />
                        </Button>
                        {/* @ts-expect-error - Button accepts children */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => closeChat(tab.id)}
                          title="Close"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Messages */}
                    <ScrollArea className="flex-1 px-4 min-h-0">
                      <div className="py-4 space-y-4">
                        {tabMessages.map((message) => {
                          const isOwn = message.sender_id === currentUser?.id;
                          return (
                            <div
                              key={message.id}
                              className={cn(
                                "flex",
                                isOwn ? "justify-end" : "justify-start"
                              )}
                            >
                              <div
                                className={cn(
                                  "max-w-[70%] rounded-lg px-3 py-2",
                                  isOwn
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-foreground"
                                )}
                              >
                                <p className="text-sm">{message.content}</p>
                                <div className={cn(
                                  "flex items-center gap-1 mt-1",
                                  isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                                )}>
                                  <p className="text-xs">
                                    {format(new Date(message.created_at), "HH:mm")}
                                  </p>
                                  {isOwn && (
                                    <span className="ml-1" title={message.read ? "Read" : "Sent"}>
                                      {message.read ? (
                                        <CheckCheck className="h-3 w-3 text-blue-400" />
                                      ) : (
                                        <Check className="h-3 w-3" />
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    {/* Message Input */}
                    <div className="border-t border-border p-3 shrink-0">
                      <div className="flex gap-2">
                        <Input
                          ref={(el) => {
                            if (el) messageInputRefs.current[tab.userId] = el;
                          }}
                          value={messageInput[tab.userId] || ""}
                          onChange={(e) =>
                            setMessageInput(prev => ({ ...prev, [tab.userId]: e.target.value }))
                          }
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              sendMessage(tab.userId);
                            }
                          }}
                          placeholder="Type a message..."
                          className="flex-1"
                        />
                        {/* @ts-expect-error - Button accepts children */}
                        <Button
                          onClick={() => sendMessage(tab.userId)}
                          disabled={!messageInput[tab.userId]?.trim()}
                        >
                          Send
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">No active chats</p>
                {/* @ts-expect-error - Button accepts children */}
                <Button onClick={() => setShowUserList(true)}>
                  Start a conversation
                </Button>
              </div>
            </div>
          )}

          {/* Minimized Tabs Bar */}
          {minimizedTabs.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 border-t border-border bg-muted/30 shrink-0">
              {minimizedTabs.map(tab => (
                <Button
                  key={tab.id}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 relative"
                  onClick={() => {
                    toggleMinimize(tab.id);
                    setActiveTab(tab.id);
                    // Clear unread count and mark messages as read when restoring
                    updateUnreadCount(tab.userId, 0);
                    loadMessages(tab.userId, true);
                  }}
                >
                  <Avatar className="h-5 w-5 mr-2">
                    <AvatarImage src={tab.userAvatar} />
                    <AvatarFallback className="text-[10px]">
                      {tab.userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs truncate max-w-[100px]">{tab.userName}</span>
                  {tab.unreadCount > 0 && (
                    <Badge variant="destructive" className="h-4 px-1 text-[10px] ml-1">
                      {tab.unreadCount}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* User List Modal */}
      {showUserList && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Select a user to chat</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowUserList(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                {filteredUsers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No users found</p>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => openChat(user)}
                    >
                      <Avatar>
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>
                          {user.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
}
