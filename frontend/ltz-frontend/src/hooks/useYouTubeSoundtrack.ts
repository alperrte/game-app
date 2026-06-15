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

type UseYouTubeSoundtrackOptions = {
  videoId: string | null;
  suspended: boolean;
};

export const useYouTubeSoundtrack = ({ videoId, suspended }: UseYouTubeSoundtrackOptions) => {
  const playerRef = useRef<YT.Player | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoIdRef = useRef(videoId);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const destroyPlayer = useCallback(() => {
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch {
        /* player already destroyed */
      }
      playerRef.current = null;
    }
    setPlayerReady(false);
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  const createPlayer = useCallback(
    async (vidId: string) => {
      if (!containerRef.current) return;

      destroyPlayer();
      await loadYouTubeApi();

      if (!containerRef.current) return;

      playerRef.current = new window.YT.Player(containerRef.current, {
        height: "1",
        width: "1",
        videoId: vidId,
        playerVars: {
          autoplay: 1,
          loop: 1,
          playlist: vidId,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => {
            setPlayerReady(true);
            setIsPlaying(true);
            setIsLoading(false);
          },
          onError: () => {
            setPlayerReady(false);
            setIsLoading(false);
          },
        },
      });
    },
    [destroyPlayer]
  );

  const pausePlayback = useCallback(() => {
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

  const togglePlayback = useCallback(async () => {
    if (!videoId || suspended) return;

    if (!playerRef.current) {
      setIsLoading(true);
      await createPlayer(videoId);
      return;
    }

    if (!playerReady) return;

    try {
      if (isPlaying) {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    } catch {
      /* player not ready */
    }
  }, [videoId, suspended, createPlayer, playerReady, isPlaying]);

  useEffect(() => {
    if (videoIdRef.current !== videoId) {
      videoIdRef.current = videoId;
      void Promise.resolve().then(() => destroyPlayer());
    }
  }, [videoId, destroyPlayer]);

  useEffect(() => {
    if (!suspended) return;
    void Promise.resolve().then(() => pausePlayback());
  }, [suspended, pausePlayback]);

  useEffect(
    () => () => {
      void Promise.resolve().then(() => destroyPlayer());
    },
    [destroyPlayer]
  );

  return {
    containerRef,
    isPlaying,
    playerReady,
    isLoading,
    togglePlayback,
  };
};
