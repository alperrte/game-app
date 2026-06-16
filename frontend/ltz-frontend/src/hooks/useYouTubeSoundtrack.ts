import { useRef, useState, useCallback, useEffect } from "react";

const loadYouTubeApi = (): Promise<void> =>
  new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve();
      return;
    }

    const existing = document.querySelector('script[src*="youtube.com/iframe_api"]');
    if (existing) {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        resolve();
      };
      return;
    }

    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });

const createMountNode = () => {
  const mount = document.createElement("div");
  mount.setAttribute("aria-hidden", "true");
  mount.style.cssText =
    "position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none;overflow:hidden";
  document.body.appendChild(mount);
  return mount;
};

type UseYouTubeSoundtrackOptions = {
  videoId: string | null;
  suspended: boolean;
};

export const useYouTubeSoundtrack = ({ videoId, suspended }: UseYouTubeSoundtrackOptions) => {
  const playerRef = useRef<YT.Player | null>(null);
  const mountNodeRef = useRef<HTMLDivElement | null>(null);
  const pendingPlayRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playbackError, setPlaybackError] = useState(false);

  const destroyPlayer = useCallback(() => {
    pendingPlayRef.current = false;
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch {
        /* player already destroyed */
      }
      playerRef.current = null;
    }
    if (mountNodeRef.current) {
      mountNodeRef.current.remove();
      mountNodeRef.current = null;
    }
    setPlayerReady(false);
    setIsPlaying(false);
    setIsLoading(false);
    setPlaybackError(false);
  }, []);

  const pausePlayback = useCallback(() => {
    pendingPlayRef.current = false;
    if (!playerRef.current || !playerReady) {
      setIsPlaying(false);
      return;
    }
    try {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    } catch {
      /* ignore */
    }
  }, [playerReady]);

  const togglePlayback = useCallback(() => {
    if (!videoId || suspended) return;

    if (playerReady && playerRef.current) {
      try {
        const state = playerRef.current.getPlayerState();
        if (state === YT.PlayerState.PLAYING || state === YT.PlayerState.BUFFERING) {
          playerRef.current.pauseVideo();
          setIsPlaying(false);
        } else {
          playerRef.current.playVideo();
        }
      } catch {
        setPlaybackError(true);
      }
      return;
    }

    pendingPlayRef.current = true;
    setIsLoading(true);
    setPlaybackError(false);
  }, [videoId, suspended, playerReady]);

  useEffect(() => {
    if (!videoId || suspended) {
      void Promise.resolve().then(() => destroyPlayer());
      return;
    }

    let cancelled = false;

    void (async () => {
      setIsLoading(true);
      setPlaybackError(false);
      await loadYouTubeApi();
      if (cancelled) return;

      destroyPlayer();
      if (cancelled) return;

      const mountNode = createMountNode();
      mountNodeRef.current = mountNode;

      playerRef.current = new window.YT.Player(mountNode, {
        height: "1",
        width: "1",
        videoId,
        playerVars: {
          autoplay: 0,
          loop: 1,
          playlist: videoId,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => {
            if (cancelled) return;
            setPlayerReady(true);
            setIsLoading(false);
            if (pendingPlayRef.current && playerRef.current) {
              try {
                playerRef.current.playVideo();
              } catch {
                setPlaybackError(true);
                pendingPlayRef.current = false;
              }
            }
          },
          onStateChange: (event) => {
            if (cancelled) return;
            if (event.data === YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              setIsLoading(false);
              pendingPlayRef.current = false;
            } else if (
              event.data === YT.PlayerState.PAUSED ||
              event.data === YT.PlayerState.ENDED
            ) {
              setIsPlaying(false);
            }
          },
          onError: () => {
            if (cancelled) return;
            setPlayerReady(false);
            setIsLoading(false);
            setPlaybackError(true);
            pendingPlayRef.current = false;
          },
        },
      });
    })();

    return () => {
      cancelled = true;
      destroyPlayer();
    };
  }, [videoId, suspended, destroyPlayer]);

  useEffect(() => {
    if (!suspended) return;
    void Promise.resolve().then(() => pausePlayback());
  }, [suspended, pausePlayback]);

  return {
    isPlaying,
    playerReady,
    isLoading,
    playbackError,
    togglePlayback,
  };
};
