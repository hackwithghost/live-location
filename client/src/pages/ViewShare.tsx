import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useShareByToken } from "@/hooks/use-location-share";
import { useWebSocket } from "@/hooks/use-websocket";
import { WS_EVENTS } from "@shared/schema";
import Map from "@/components/Map";
import { Loader2, Navigation, AlertCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card } from "@/components/ui/card";

export default function ViewShare() {
  const [, params] = useRoute("/view/:token");
  const token = params?.token || "";
  
  const { data: share, isLoading, error } = useShareByToken(token);
  const { isConnected, send, on } = useWebSocket();
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [shareEnded, setShareEnded] = useState(false);

  // Initialize position from DB data if available
  useEffect(() => {
    if (share?.lastLat && share?.lastLng) {
      setPosition({ lat: share.lastLat, lng: share.lastLng });
    }
    if (share && !share.active) {
      setShareEnded(true);
    }
  }, [share]);

  // Subscribe to updates
  useEffect(() => {
    if (isConnected && token) {
      send(WS_EVENTS.SUBSCRIBE, { token });
      console.log("Subscribed to share:", token);
    }
  }, [isConnected, token, send]);

  // Handle incoming updates
  useEffect(() => {
    const cleanupUpdate = on(WS_EVENTS.LOCATION_UPDATE, (payload: { lat: number; lng: number }) => {
      setPosition(payload);
    });
    
    const cleanupEnded = on(WS_EVENTS.SHARE_ENDED, () => {
      setShareEnded(true);
    });

    return () => {
      cleanupUpdate();
      cleanupEnded();
    };
  }, [on]);


  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-foreground space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Locating share...</p>
      </div>
    );
  }

  if (error || !share) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-foreground p-6 text-center">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Share Not Found</h1>
        <p className="text-muted-foreground max-w-md">
          This link might be invalid or has expired. Please check the URL and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-background relative overflow-hidden flex flex-col">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-[500] p-4 pointer-events-none">
        <div className="container mx-auto max-w-5xl flex justify-between items-start">
          <Card className="pointer-events-auto bg-background/90 backdrop-blur-md border-border/50 shadow-lg p-3 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-500">
            <div className="bg-primary p-2 rounded-xl text-white">
              <Navigation size={20} />
            </div>
            <div>
              <h1 className="font-bold text-sm">Tracking {share.user ? share.user.username : "User"}</h1>
              <div className="flex items-center gap-2">
                {shareEnded ? (
                  <span className="text-xs font-bold text-destructive flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-destructive"></span> ENDED
                  </span>
                ) : (
                  <span className="text-xs font-bold text-green-500 flex items-center gap-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    LIVE
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {isConnected ? "Connected" : "Reconnecting..."}
                </span>
              </div>
            </div>
          </Card>
          
          <div className="pointer-events-auto">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative z-0">
        {position ? (
          <Map 
            lat={position.lat} 
            lng={position.lng} 
            zoom={15} 
            popupText="Current Location" 
            className="h-full w-full rounded-none border-none" 
          />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center bg-muted/20">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground font-medium">Waiting for location update...</p>
          </div>
        )}
      </div>

      {/* Footer Status Overlay - Only if share ended */}
      {shareEnded && (
        <div className="absolute bottom-8 left-0 right-0 z-[500] px-4 pointer-events-none flex justify-center">
          <div className="pointer-events-auto bg-destructive text-destructive-foreground px-6 py-4 rounded-2xl shadow-xl max-w-md text-center animate-in slide-in-from-bottom-8 duration-500">
            <h3 className="font-bold mb-1">Session Ended</h3>
            <p className="text-sm opacity-90">The user has stopped sharing their location.</p>
          </div>
        </div>
      )}
    </div>
  );
}
