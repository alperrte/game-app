/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ChatWidgetContextValue = {
  isOpen: boolean;
  requestedRoomId: number | null;
  closeChat: () => void;
  openChat: (roomId?: number | null) => void;
  toggleChat: () => void;
};

const ChatWidgetContext = createContext<ChatWidgetContextValue | null>(null);

export function ChatWidgetProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [requestedRoomId, setRequestedRoomId] = useState<number | null>(null);

  const openChat = useCallback((roomId?: number | null) => {
    if (typeof roomId === "number") {
      setRequestedRoomId(roomId);
    }
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => setIsOpen(false), []);
  const toggleChat = useCallback(() => setIsOpen((current) => !current), []);

  const value = useMemo(
    () => ({ isOpen, requestedRoomId, closeChat, openChat, toggleChat }),
    [closeChat, isOpen, openChat, requestedRoomId, toggleChat],
  );

  return (
    <ChatWidgetContext.Provider value={value}>
      {children}
    </ChatWidgetContext.Provider>
  );
}

export function useChatWidget() {
  const context = useContext(ChatWidgetContext);

  if (!context) {
    throw new Error("useChatWidget must be used within ChatWidgetProvider");
  }

  return context;
}
