import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useActiveShare, useCreateShare, useStopShare } from "@/hooks/use-location-share.ts";
import { useWebSocket } from "@/hooks/use-websocket";
import { useLocation } from "wouter";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Share2, StopCircle, Copy, Check, MapPin, Eye, ExternalLink } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WS_EVENTS } from "@shared/schema";
import Map from "@/components/Map";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { data: activeShare, isLoading: shareLoading } = useActiveShare();
  const createShare = useCreateShare();
  const stopShare = useStopShare();
  const { send, isConnected } = useWebSocket();
  
  const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  // Geolocation tracking
  useEffect(() => {
    if (!activeShare) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentPos({ lat: latitude, lng: longitude });
        
        if (isConnected && activeShare) {
          send(WS_EVENTS.LOCATION_UPDATE, {
            token: activeShare.shareToken,
            lat: latitude,
            lng: longitude
          });
        }
      },
      (error) => console.error("Location error:", error),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [activeShare, isConnected, send]);

  // WebSocket for viewer count
  const { on } = useWebSocket();
  useEffect(() => {
    if (activeShare) {
      const cleanup = on(WS_EVENTS.VIEWER_COUNT, (count: number) => {
        setViewerCount(count);
      });
      return cleanup;
    }
  }, [activeShare, on]);

  const handleCopy = () => {
    if (!activeShare) return;
    const url = `${window.location.origin}/view/${activeShare.shareToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartShare = () => {
    createShare.mutate();
  };

  const handleStopShare = () => {
    stopShare.mutate();
  };

  if (authLoading || shareLoading) {
    return <div className="h-screen w-full flex items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg text-white">
              <MapPin size={20} />
            </div>
            <span className="font-bold font-display text-lg hidden sm:block">LiveLoc</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground hidden sm:block">
              Hi, {user.username || 'User'}
            </span>
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={() => logout()}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Active Share Card */}
          {activeShare ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Controls & QR */}
              <div className="space-y-6">
                <Card className="border-border/50 shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-4 border-b border-green-500/10 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold text-sm uppercase tracking-wide">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                      </span>
                      Sharing Live
                    </div>
                    <div className="flex items-center gap-1 text-xs font-medium bg-background/50 px-2 py-1 rounded-full text-foreground/70">
                      <Eye size={12} /> {viewerCount} viewing
                    </div>
                  </div>

                  <CardContent className="p-6 space-y-6">
                    <div className="flex justify-center p-4 bg-white rounded-xl shadow-inner border border-border/20 mx-auto w-fit">
                      <QRCodeSVG 
                        value={`${window.location.origin}/view/${activeShare.shareToken}`}
                        size={180}
                        level="H"
                        includeMargin={true}
                        className="rounded-lg"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Share Link</label>
                      <div className="flex gap-2">
                        <code className="flex-1 bg-muted/50 p-3 rounded-xl text-xs sm:text-sm font-mono truncate border border-border/50 select-all">
                          {window.location.origin}/view/{activeShare.shareToken}
                        </code>
                        <Button 
                          size="icon" 
                          variant="outline" 
                          onClick={handleCopy}
                          className="shrink-0 rounded-xl"
                        >
                          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                      <Button variant="ghost" className="w-full text-xs" asChild>
                         <a href={`/view/${activeShare.shareToken}`} target="_blank" rel="noopener noreferrer">
                            Open in new tab <ExternalLink className="w-3 h-3 ml-2" />
                         </a>
                      </Button>
                    </div>

                    <Button 
                      variant="destructive" 
                      onClick={handleStopShare}
                      disabled={stopShare.isPending}
                      className="w-full rounded-xl h-12 text-base font-semibold shadow-lg shadow-destructive/20 hover:shadow-destructive/30"
                    >
                      {stopShare.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Stopping...
                        </>
                      ) : (
                        <>
                          <StopCircle className="w-4 h-4 mr-2" /> Stop Sharing
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Map Preview */}
              <div className="lg:col-span-2">
                <div className="h-[400px] lg:h-[600px] w-full bg-muted/30 rounded-3xl border border-border/50 shadow-xl overflow-hidden relative">
                  {currentPos ? (
                    <Map 
                      lat={currentPos.lat} 
                      lng={currentPos.lng} 
                      popupText="You are here"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-muted/10">
                      <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
                      <p>Acquiring GPS signal...</p>
                    </div>
                  )}
                  
                  <div className="absolute bottom-6 right-6 bg-background/90 backdrop-blur-md p-3 rounded-xl border border-border/50 shadow-lg text-xs space-y-1 z-[400]">
                    <div className="font-semibold text-foreground">Status</div>
                    <div className="flex justify-between gap-4 text-muted-foreground">
                      <span>GPS</span>
                      <span className="text-green-500 font-mono">ACTIVE</span>
                    </div>
                    <div className="flex justify-between gap-4 text-muted-foreground">
                      <span>Socket</span>
                      <span className={isConnected ? "text-green-500 font-mono" : "text-red-500 font-mono"}>
                        {isConnected ? "CONNECTED" : "OFFLINE"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Empty State / Start Sharing
            <div className="max-w-2xl mx-auto mt-12">
               <div className="text-center space-y-4 mb-8">
                 <h2 className="text-3xl font-bold font-display">Ready to share?</h2>
                 <p className="text-muted-foreground">Start a session to generate a secure, temporary link. You can stop it at any time.</p>
               </div>
               
               <Card className="bg-gradient-to-b from-card to-muted/20 border-border/50 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 group">
                 <div className="h-2 bg-gradient-to-r from-primary to-accent" />
                 <CardContent className="p-12 text-center flex flex-col items-center gap-8">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                       <Share2 className="w-10 h-10 text-primary" />
                    </div>
                    
                    <div className="space-y-2">
                       <h3 className="text-xl font-bold">Start Live Session</h3>
                       <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                         This will use your device's GPS to broadcast your location to anyone with the link.
                       </p>
                    </div>

                    <Button 
                      size="lg" 
                      onClick={handleStartShare}
                      disabled={createShare.isPending}
                      className="px-8 py-6 text-lg rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 hover:translate-y-[-2px] hover:shadow-primary/40 transition-all duration-300"
                    >
                      {createShare.isPending ? <Loader2 className="animate-spin mr-2" /> : <MapPin className="mr-2" />}
                      Start Sharing Location
                    </Button>
                 </CardContent>
               </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
