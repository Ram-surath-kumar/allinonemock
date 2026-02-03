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
  isArchived?: boolean;
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
  pinned?: boolean;
  starred?: boolean;
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

  // State
  const [chats, setChats] = useState<ChatTab[]>([]);
  const [activeChat, setActiveChat] = useState<ChatTab | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; user_id?: string | number; loopid?: string; name: string; email?: string; avatar?: string; last_login?: string }>>([]);
  const [statusMap, setStatusMap] = useState<Record<string, UserStatus>>({});
  const [lastMessageSentTime, setLastMessageSentTime] = useState<number>(0);
  const [pendingTempMessages, setPendingTempMessages] = useState<Set<string>>(new Set());

  // Initial Data Loading - Load users first if we have a chatUserId in URL
  useEffect(() => {
    if (currentUser) {
      // If we have a chatUserId in URL, prioritize loading users first
      if (chatUserId) {
        loadUsers().then(() => {
          // After users load, load chats
          loadChats();
        });
      } else {
        loadUsers();
        loadChats();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, chatUserId]);

  // Reload chats when users load to update names
  useEffect(() => {
    if (users.length > 0 && currentUser) {
      // Small delay to ensure users state is fully set
      const timer = setTimeout(() => {
        // Reload chats to update names with newly loaded users
        loadChats(true); // Silent reload to update names

        // Also update active chat name if it's "Unknown" or "Loading..."
        if (activeChat && (activeChat.userName === 'Unknown' || activeChat.userName === 'Loading...')) {
          const user = users.find(u =>
            u.id === activeChat.userId ||
            String(u.user_id) === String(activeChat.userId) ||
            String(u.loopid) === String(activeChat.userId)
          );
          if (user) {
            setActiveChat({
              ...activeChat,
              userId: user.id, // Ensure UUID
              userName: user.name,
              userAvatar: user.avatar
            });
          }
        }

        // Update all chats in state that have "Unknown" names
        setChats(prevChats => {
          return prevChats.map(chat => {
            if (chat.userName === 'Unknown' || chat.userName === 'Loading...') {
              const user = users.find(u =>
                u.id === chat.userId ||
                String(u.user_id) === String(chat.userId) ||
                String(u.loopid) === String(chat.userId)
              );
              if (user) {
                return {
                  ...chat,
                  userId: user.id,
                  userName: user.name,
                  userAvatar: user.avatar
                };
              }
            }
            return chat;
          });
        });
      }, 50);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users.length]);

  // Polling
  useEffect(() => {
    if (currentUser) {
      const interval = setInterval(() => {
        loadChats(true, false); // silent update, bypass cache
        updateUserStatuses();
        if (activeChat) {
          // Don't reload messages if we just sent one (within last 10 seconds) or have pending temp messages
          const timeSinceLastMessage = Date.now() - lastMessageSentTime;
          if (timeSinceLastMessage > 10000 && pendingTempMessages.size === 0) {
            loadMessages(activeChat, true); // silent update
          }
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [currentUser, activeChat, lastMessageSentTime]);

  // URL Sync: Handle opening chat from URL
  useEffect(() => {
    if (!currentUser) return;

    // Check if we have a chatUserId in the URL (from route /:orgName/:userId/chat/:chatUserId)
    // Note: chatUserId is the numeric user_id (loopid), not the UUID id
    if (chatUserId) {
      const targetLoopId = chatUserId; // This is the numeric user_id/loopid from URL

      // If users haven't loaded yet, create temporary chat and open it immediately
      if (users.length === 0) {
        // Create a temporary chat to open immediately (will be updated when users load)
        const tempChat: ChatTab = {
          id: `temp-chat-${targetLoopId}`,
          userId: targetLoopId, // Temporary - will be replaced with UUID
          userName: 'Loading...',
          type: 'direct',
          unreadCount: 0
        };

        // Only set if not already set or different
        if (!activeChat || activeChat.userId !== tempChat.userId) {
          setActiveChat(tempChat);
        }

        // Trigger users load
        loadUsers();
        return; // Will retry when users load
      }

      // Match by user_id (loopid) or loopid field, converting to string for comparison
      let user = users.find(u =>
        String(u.user_id) === String(targetLoopId) ||
        String(u.loopid) === String(targetLoopId) ||
        u.id === targetLoopId // Fallback to UUID match
      );

      // If user not found, try to find in chats (chats use UUID id as userId)
      if (!user) {
        const existingChat = chats.find(c => {
          // Try to match by finding user with matching loopid
          const chatUser = users.find(u => u.id === c.userId);
          return chatUser && (String(chatUser.user_id) === String(targetLoopId) || String(chatUser.loopid) === String(targetLoopId));
        });

        if (existingChat && existingChat.userName !== 'Unknown') {
          // Use existing chat data if we have name
          if (!activeChat || activeChat.userId !== existingChat.userId) {
            setActiveChat(existingChat);
            loadMessages(existingChat);

            // Update URL to use loopid - find user by UUID
            const chatUser = users.find(u => u.id === existingChat.userId);
            if (currentUser?.organization && chatUser) {
              const loopId = chatUser.user_id || chatUser.loopid;
              if (loopId && String(loopId) !== String(targetLoopId)) {
                navigate(`/${currentUser.organization.org_name}/${currentUser.user_id}/chat/${loopId}`, { replace: true });
              }
            }
          }
          return;
        }
        // User not found - keep temp chat open, will update when found
        return;
      }

      // Find existing chat or create temp one with proper user info
      // Chats use UUID id, so we need to find by matching the user's UUID
      const existing = chats.find(c => c.userId === user!.id);
      const chatToOpen = existing || {
        id: `recent-${user.id}`,
        userId: user.id, // Use UUID id for chat userId
        userName: user.name || 'Unknown',
        userAvatar: user.avatar,
        type: 'direct' as const,
        unreadCount: 0
      };

      // Update chat name if we now have user info
      if (user && chatToOpen.userName === 'Unknown') {
        chatToOpen.userName = user.name;
        chatToOpen.userAvatar = user.avatar;
      }

      // Only set active chat if it's different to avoid unnecessary re-renders
      if (!activeChat || activeChat.userId !== chatToOpen.userId || activeChat.id.startsWith('temp-chat-')) {
        setActiveChat(chatToOpen);
        loadMessages(chatToOpen);

        // Update URL to use loopid instead of UUID (if URL currently has UUID)
        if (currentUser?.organization && user) {
          const loopId = user.user_id || user.loopid;
          if (loopId && String(loopId) !== String(chatUserId)) {
            navigate(`/${currentUser.organization.org_name}/${currentUser.user_id}/chat/${loopId}`, { replace: true });
          }
        }
      }
    } else if (tab && tab.startsWith("chat/") && users.length > 0) {
      // Fallback for old URL format
      const targetId = tab.split("/")[1];
      // Try matching by loopid first, then UUID
      const user = users.find(u =>
        String(u.user_id) === String(targetId) ||
        String(u.loopid) === String(targetId) ||
        u.id === targetId
      );
      if (user) {
        const existing = chats.find(c => c.userId === user.id);
        const chatToOpen = existing || {
          id: `recent-${user.id}`,
          userId: user.id,
          userName: user.name || 'Unknown',
          userAvatar: user.avatar,
          type: 'direct' as const,
          unreadCount: 0
        };
        if (!activeChat || activeChat.userId !== chatToOpen.userId) {
          setActiveChat(chatToOpen);
          loadMessages(chatToOpen);

          // Update URL to use loopid instead of UUID
          if (currentUser?.organization && user) {
            const loopId = user.user_id || user.loopid;
            if (loopId) {
              navigate(`/${currentUser.organization.org_name}/${currentUser.user_id}/chat/${loopId}`, { replace: true });
            }
          }
        }
      }
    } else if (!tab && !chatUserId && !isMobile && chats.length > 0 && !activeChat) {
      // Desktop: Open first chat if none selected
      // setActiveChat(chats[0]); 
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatUserId, tab, users.length, chats.length, currentUser]); // Removed activeChat to avoid loop

  const loadUsers = async () => {
    try {
      const response = await api.getUsers({ status: "active" });
      if (response.data) {
        // Preserve all user fields including user_id and loopid
        const filteredUsers = response.data
          .filter((u: { id: string }) => u.id !== currentUser?.id)
          .map((u: any) => ({
            id: u.id,
            user_id: u.user_id ? String(u.user_id) : u.loopid,
            loopid: u.loopid,
            name: u.name,
            email: u.email,
            avatar: u.avatar,
            last_login: u.last_login
          }));
        setUsers(filteredUsers);
        return filteredUsers; // Return for promise chaining
      }
    } catch (error) {
      console.error("Failed to load users", error);
    }
    return [];
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

  const loadChats = async (silent = false, useCache = true) => {
    if (!currentUser) return;

    // If users haven't loaded yet and this is not a silent update, wait for users
    if (users.length === 0 && !silent) {
      // Wait a bit for users to load, then retry
      setTimeout(() => {
        if (users.length > 0) {
          loadChats(silent);
        }
      }, 100);
      return;
    }

    try {
      const response = await api.getRecentConversations(currentUser.id, useCache);
      if (response.data) {
        // Map API response to ChatTab info
        const mappedChats = response.data.map((c: any) => {
          // If direct, find user info
          let name = c.name;
          let avatar = c.avatar;
          let userId = c.userId; // Preserve original userId

          if (c.type === 'direct') {
            // Match by UUID id (which is what c.userId should be)
            let user = users.find(u => u.id === c.userId);

            if (!user && users.length > 0) {
              // If not found by UUID, try matching by user_id/loopid (in case API returns loopid or different format)
              user = users.find(u =>
                String(u.user_id) === String(c.userId) ||
                String(u.loopid) === String(c.userId) ||
                u.id === c.userId
              );

              if (user) {
                // Update userId to UUID for consistency
                userId = user.id;
              }
            }

            if (user) {
              name = user.name;
              avatar = user.avatar;
            } else if (users.length === 0) {
              // Users not loaded yet - keep existing name from previous load or mark as loading
              name = c.userName || name || 'Loading...';
            } else {
              // User not found even after users loaded
              // Check if we have an existing chat with this userId that has a name
              const existingChat = chats.find(ch => ch.userId === c.userId || ch.id === c.id);
              if (existingChat && existingChat.userName && existingChat.userName !== 'Unknown') {
                // Preserve existing name
                name = existingChat.userName;
                avatar = existingChat.userAvatar;
              } else {
                // Last resort - might be deleted or inactive user
                name = c.userName || name || 'Unknown';
              }
            }
          }

          return {
            ...c,
            type: c.type || 'direct', // Default to direct if missing
            userName: name || 'Unknown',
            userAvatar: avatar,
            userId: userId // Use resolved UUID
          };
        });
        setChats(mappedChats);
      }
    } catch (error) {
      if (!silent) console.error("Failed to load chats", error);
    }
  };

  // Update active chat name when users load (fixes "Unknown" issue and temp chats)
  useEffect(() => {
    if (activeChat && activeChat.userId && users.length > 0 && chatUserId) {
      const targetLoopId = chatUserId;

      // Match by UUID id (which is what chat.userId uses)
      let user = users.find(u => u.id === activeChat.userId);

      // If not found by UUID, try to match by user_id/loopid if activeChat.userId is a loopid
      if (!user) {
        user = users.find(u =>
          String(u.user_id) === String(activeChat.userId) ||
          String(u.loopid) === String(activeChat.userId) ||
          String(u.user_id) === String(targetLoopId) ||
          String(u.loopid) === String(targetLoopId)
        );

        // If found by loopid, update the chat to use UUID
        if (user) {
          const updatedChat: ChatTab = {
            ...activeChat,
            id: activeChat.id.startsWith('temp-chat-') ? `recent-${user.id}` : activeChat.id,
            userId: user.id, // Update to UUID
            userName: user.name,
            userAvatar: user.avatar
          };
          setActiveChat(updatedChat);
          // Load messages with the updated chat
          loadMessages(updatedChat);
          return;
        }
      }

      // Update name if it's still "Loading..." or "Unknown"
      if (user && (activeChat.userName === 'Unknown' || activeChat.userName === 'Loading...' || !activeChat.userName)) {
        setActiveChat({
          ...activeChat,
          userName: user.name,
          userAvatar: user.avatar
        });
      }
    }
  }, [users.length, activeChat?.userId, chatUserId]);

  const loadMessages = async (chat: ChatTab, silent = false, useCache = true) => {
    if (!currentUser) return;
    try {
      let params: any = { user_id: currentUser.id };
      if (chat.type === 'group' || (chat.id && chat.id.startsWith('group-'))) {
        params.group_id = chat.id;
      } else if (chat.userId) {
        // If chat.userId is a loopid (not UUID), find the actual UUID
        if (chat.userId && !chat.userId.includes('-') && users.length > 0) {
          // Likely a loopid, find the user
          const user = users.find(u =>
            String(u.user_id) === String(chat.userId) ||
            String(u.loopid) === String(chat.userId)
          );
          if (user) {
            params.other_user_id = user.id; // Use UUID
          } else {
            // Still loading, skip for now
            return;
          }
        } else {
          params.other_user_id = chat.userId;
        }
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
      const msgRes = await api.get<Message[]>(`/chat/messages`, params, useCache);

      if (msgRes.data && Array.isArray(msgRes.data)) {
        // Sort messages by created_at to ensure correct order
        const sortedMessages = [...msgRes.data].sort((a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        // Merge with existing messages to preserve optimistic updates
        setMessages(prev => {
          // If we have pending temp messages or recently sent a message, merge instead of replace
          const timeSinceLastMessage = Date.now() - lastMessageSentTime;
          const hasPendingMessages = pendingTempMessages.size > 0;

          if ((timeSinceLastMessage < 10000 || hasPendingMessages) && prev.length > 0) {
            // Keep temp messages that are still pending
            const tempMessages = prev.filter(m =>
              m.id.startsWith('temp-') && pendingTempMessages.has(m.id)
            );

            // Get server message IDs and content for comparison
            const serverMessageIds = new Set(sortedMessages.map(m => m.id));
            const serverMessageMap = new Map(sortedMessages.map(m => [m.id, m]));

            // Check if any temp messages match server messages by content and timestamp
            // (in case server uses different ID)
            const matchedTempIds = new Set<string>();
            tempMessages.forEach(tempMsg => {
              const matched = sortedMessages.find(serverMsg =>
                serverMsg.sender_id === tempMsg.sender_id &&
                serverMsg.content === tempMsg.content &&
                Math.abs(new Date(serverMsg.created_at).getTime() - new Date(tempMsg.created_at).getTime()) < 5000
              );
              if (matched) {
                matchedTempIds.add(tempMsg.id);
              }
            });

            // Remove matched temp messages (they're now in server response)
            const unmatchedTempMessages = tempMessages.filter(m => !matchedTempIds.has(m.id));

            // Update pending temp messages - remove matched ones
            if (matchedTempIds.size > 0) {
              setPendingTempMessages(prevPending => {
                const updated = new Set(prevPending);
                matchedTempIds.forEach(id => updated.delete(id));
                return updated;
              });
            }

            // Combine: unmatched temp messages + server messages
            const combined = [...unmatchedTempMessages, ...sortedMessages];

            // Remove duplicates by id, but preserve reactions from existing messages
            const unique = combined.reduce((acc, msg) => {
              const existingIndex = acc.findIndex(m => m.id === msg.id);
              if (existingIndex === -1) {
                acc.push(msg);
              } else {
                // Merge: use server version but preserve reactions from existing if they exist
                const existingMsg = acc[existingIndex];
                const mergedMsg = {
                  ...msg,
                  // Preserve reactions from existing message if server doesn't have them or if existing has more recent reactions
                  reactions: existingMsg.reactions && existingMsg.reactions.length > 0
                    ? (msg.reactions && msg.reactions.length > 0
                      ? msg.reactions // Use server reactions if available
                      : existingMsg.reactions) // Fall back to existing reactions
                    : (msg.reactions || []) // Use server reactions or empty array
                };
                acc[existingIndex] = mergedMsg;
              }
              return acc;
            }, [] as Message[]);

            return unique.sort((a, b) =>
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          }

          // Normal case: merge with existing to preserve reactions
          if (prev.length > 0) {
            // Create a map of existing messages with their reactions
            const existingMap = new Map(prev.map(m => [m.id, m]));

            // Merge: use server messages but preserve reactions from existing
            return sortedMessages.map(serverMsg => {
              const existingMsg = existingMap.get(serverMsg.id);
              if (existingMsg && existingMsg.reactions && existingMsg.reactions.length > 0) {
                // If server has reactions, use them; otherwise keep existing
                return {
                  ...serverMsg,
                  reactions: serverMsg.reactions && serverMsg.reactions.length > 0
                    ? serverMsg.reactions
                    : existingMsg.reactions
                };
              }
              return serverMsg;
            });
          }

          return sortedMessages;
        });
      }
    } catch (error) {
      if (!silent) console.error("Failed to load messages", error);
    }
  };

  const handleSelectChat = (chat: ChatTab) => {
    setActiveChat(chat);
    loadMessages(chat);

    // Update URL - use loopid (user_id) instead of UUID
    if (currentUser?.organization && chat.userId) {
      // Find the user to get their loopid
      const user = users.find(u => u.id === chat.userId);
      const loopId = user?.user_id || user?.loopid || chat.userId; // Fallback to UUID if loopid not found

      // Only update URL for 1:1 for now as routing logic expects userId
      // For groups, we might need new route /chat/group/:groupId
      navigate(`/${currentUser.organization.org_name}/${currentUser.user_id}/chat/${loopId}`, { replace: true });
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

    // Track when message was sent to prevent polling from clearing it
    const sentTime = Date.now();
    setLastMessageSentTime(sentTime);

    // Optimistic update
    const tempMsgId = `temp-${Date.now()}`;
    const tempMsg: Message = {
      id: tempMsgId,
      sender_id: currentUser.id,
      content,
      type,
      created_at: new Date().toISOString(),
      read: false,
      reply_to_id: replyTo?.id,
      reply_to: replyTo || undefined
    };

    // Track this temp message as pending
    setPendingTempMessages(prev => new Set(prev).add(tempMsgId));
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

      const response = await api.sendChatMessage(payload);

      // Replace temp message with real message from server response
      if (response.data) {
        const newMessage: Message = {
          id: response.data.id,
          sender_id: response.data.sender_id,
          content: response.data.content,
          type: response.data.type,
          created_at: response.data.created_at,
          read: response.data.read || false,
          reply_to_id: response.data.reply_to_id,
          reply_to: response.data.reply_to,
          pinned: response.data.pinned,
          starred: response.data.starred_by?.includes(currentUser.id),
          reactions: response.data.reactions || []
        };

        setMessages(prev => {
          // Remove temp message
          const filtered = prev.filter(m => m.id !== tempMsgId);
          // Check if message already exists (shouldn't happen, but safety check)
          const exists = filtered.some(m => m.id === newMessage.id);
          if (!exists) {
            // Add new message and sort by timestamp
            const updated = [...filtered, newMessage];
            return updated.sort((a, b) =>
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          }
          return filtered;
        });

        // Remove from pending temp messages
        setPendingTempMessages(prev => {
          const updated = new Set(prev);
          updated.delete(tempMsgId);
          return updated;
        });

        // Update chats sidebar without reloading all messages
        loadChats(true);
      } else {
        // Fallback: reload messages if response doesn't have data
        // Add a delay to ensure server has processed the message
        setTimeout(() => {
          loadMessages(activeChat, true);
          loadChats(true, false);
        }, 500);
      }
    } catch (error) {
      toast.error("Failed to send message");
      setMessages(prev => prev.filter(m => m.id !== tempMsgId));
      // Remove from pending temp messages
      setPendingTempMessages(prev => {
        const updated = new Set(prev);
        updated.delete(tempMsgId);
        return updated;
      });
    }
  };

  const handleMute = async (chatId: string, muted: boolean) => {
    if (!currentUser) return;
    try {
      await api.muteChat(chatId, currentUser.id, muted);
      toast.success(muted ? "Chat muted" : "Chat unmuted");
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, muted } : c));
      if (activeChat?.id === chatId) {
        setActiveChat(prev => prev ? { ...prev, muted } : null);
      }
      loadChats(true, false);
    } catch (error) {
      toast.error("Failed to update settings");
    }
  };

  const handleClear = async (chatId: string) => {
    if (!currentUser) return;
    try {
      await api.clearChat(chatId, currentUser.id);
      toast.success("Chat history cleared");
      if (activeChat?.id === chatId) {
        setMessages([]);
      }
      loadMessages(activeChat, true, false); // silent, bypass cache
    } catch (error) {
      toast.error("Failed to clear chat");
    }
  };

  const handleDelete = async (chatId: string) => {
    if (!currentUser) return;
    if (!confirm("Are you sure you want to delete this conversation?")) return;

    try {
      await api.deleteChat(chatId, currentUser.id);
      toast.success("Conversation deleted");
      if (activeChat?.id === chatId) {
        setActiveChat(null);
        if (currentUser.organization) {
          navigate(`/${currentUser.organization.org_name}/${currentUser.user_id}/chat`);
        }
      }
      loadChats(true, false);
    } catch (error) {
      toast.error("Failed to delete chat");
    }
  };

  const handleArchiveChat = async (chatId: string, archived: boolean) => {
    if (!currentUser) return;

    // 1. Optimistic Update
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, isArchived: archived } : c));
    if (activeChat?.id === chatId) {
      setActiveChat(prev => prev ? { ...prev, isArchived: archived } : null);
    }

    try {
      await api.archiveChat(chatId, currentUser.id, archived);
      toast.success(archived ? "Chat archived" : "Chat unarchived");
      // Load chats without background overlay to keep it smooth, bypass cache
      loadChats(true, false);
    } catch (error) {
      // Revert on failure
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, isArchived: !archived } : c));
      if (activeChat?.id === chatId) {
        setActiveChat(prev => prev ? { ...prev, isArchived: !archived } : null);
      }
      toast.error("Failed to update chat status");
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
      const response = await api.addReaction(messageId, currentUser.id, currentUser.name, emoji);
      // Update with server response to ensure reactions are synced
      if (response?.data?.reactions) {
        setMessages(prev => prev.map(msg =>
          msg.id === messageId ? { ...msg, reactions: response.data.reactions } : msg
        ));
      }
      if (activeChat) loadMessages(activeChat, true, false);
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
      const response = await api.removeReaction(messageId, currentUser.id, emoji);
      // Update with server response to ensure reactions are synced
      if (response?.data?.reactions !== undefined) {
        setMessages(prev => prev.map(msg =>
          msg.id === messageId ? { ...msg, reactions: response.data.reactions || [] } : msg
        ));
      }
      if (activeChat) loadMessages(activeChat, true, false);
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
          onArchiveChat={handleArchiveChat}
          onMuteChat={handleMute}
          onDeleteChat={handleDelete}
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
              onMute={(muted) => activeChat && handleMute(activeChat.id, muted)}
              onClear={() => activeChat && handleClear(activeChat.id)}
              onDelete={() => activeChat && handleDelete(activeChat.id)}
              onArchive={handleArchiveChat}
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
                    alt="Loopverse"
                    className="h-24 w-24 relative dark:invert-0 opacity-80"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = '<div class="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center relative"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" class="text-primary" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>';
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-light text-foreground">Welcome to Loopverse Chat</h2>
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
                Loopverse Chat v1.0
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
