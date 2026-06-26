import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";

import { SOCIAL_ROUTES } from "../../../lib/constants";
import { useChatWidget } from "../context/ChatWidgetContext";

export function ChatRouteLauncher() {
  const { roomId } = useParams<{ roomId?: string }>();
  const { openChat } = useChatWidget();
  const parsedRoomId = Number(roomId);

  useEffect(() => {
    openChat(Number.isFinite(parsedRoomId) ? parsedRoomId : null);
  }, [openChat, parsedRoomId]);

  return <Navigate replace to={SOCIAL_ROUTES.feed} />;
}
