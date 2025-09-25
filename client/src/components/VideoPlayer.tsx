import React, { useEffect, useState, useRef } from 'react';
import { Play, Lock, Clock, Download } from 'lucide-react';
import { FirestoreVideoAccess, FirestoreVideo } from '../lib/firestore';

interface VideoPlayerProps {
  video: FirestoreVideo;
  access: FirestoreVideoAccess | null;
  onPaymentRequested: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, access, onPaymentRequested }) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (access && access.expiresAt) {
      const updateTimer = () => {
        const now = Date.now();
        const expiryTime = access.expiresAt.toMillis();
        const remaining = expiryTime - now;

        if (remaining > 0) {
          const hours = Math.floor(remaining / (1000 * 60 * 60));
          const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
          setTimeRemaining(`${hours}h ${minutes}m remaining`);
        } else {
          setTimeRemaining('Access expired');
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        }
      };

      updateTimer();
      intervalRef.current = setInterval(updateTimer, 60000); // Update every minute

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [access]);

  const hasValidAccess = access && access.expiresAt.toMillis() > Date.now();

  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return hours > 0 ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}` : `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
  <div className="space-y-6">
    {/* Video Player Container */}
    <div className="relative bg-card rounded-xl shadow-lg overflow-hidden">
      <div className="relative aspect-video bg-muted">
        {hasValidAccess ? (
          <video
            ref={videoRef}
            controls
            className="w-full h-full"
            poster={video.thumbnailUrl}
            data-testid="video-player"
          >
            <source src={video.videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <>
            {/* Video thumbnail (base layer) */}
            {video.thumbnailUrl && (
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="w-full h-full object-cover"
                data-testid="img-video-thumbnail"
              />
            )}

            {/* Locked overlay (ON TOP of thumbnail/video) */}
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-20 p-6 text-center"
              data-testid="locked-overlay"
            >
              <div className="bg-accent/20 rounded-full p-5 mb-4 inline-block">
                <Lock className="w-8 h-8 text-accent" />
              </div>

              <h3 className="text-lg sm:text-2xl font-bold mb-2 text-white">Premium Content</h3>
              <p className="text-sm sm:text-lg mb-4 text-white">Get 24-hour unlimited access to this video</p>

              <button
                onClick={onPaymentRequested}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-accent text-accent-foreground rounded-xl font-bold text-base sm:text-lg hover:bg-accent/90 transition-all transform hover:scale-105"
                data-testid="button-unlock-video"
              >
                Pay GH₵{(video.price / 100).toLocaleString()} to Watch
              </button>
            </div>

            {/* Play button overlay (visual only, behind locked overlay) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-60 pointer-events-none z-10">
              <div className="bg-white/20 rounded-full p-6">
                <Play className="w-8 h-8 text-white fill-white" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Video Info (unchanged) */}
      <div className="p-6">
        <h3 className="text-2xl font-bold mb-2" data-testid="text-video-title">{video.title}</h3>
        <p className="text-muted-foreground mb-4" data-testid="text-video-description">
          {video.description}
        </p>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <span className="flex items-center" data-testid="text-video-duration">
              <Clock className="w-4 h-4 mr-1" />
              {formatDuration(video.duration)}
            </span>
            <span className="flex items-center" data-testid="text-video-level">
              <span className="w-4 h-4 mr-1">🎓</span>
              {video.level}
            </span>
          </div>
          <div className="flex items-center space-x-2" data-testid="text-video-rating">
            <span className="text-accent">⭐</span>
            <span>4.8 (124 reviews)</span>
          </div>
        </div>
      </div>
    </div>

    {/* Access Status (unchanged) */}
    {hasValidAccess && (
      <div className="p-4 bg-muted rounded-lg" data-testid="status-video-access">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
            <div>
              <p className="font-medium">Access Granted</p>
              <p className="text-sm text-muted-foreground" data-testid="text-time-remaining">
                {timeRemaining}
              </p>
            </div>
          </div>
          <div className="text-primary font-medium flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            Active
          </div>
        </div>
      </div>
    )}
  </div>
);
};
