import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Navigation, ShieldCheck, QrCode, MapPin } from "lucide-react";
import { useLocation } from "wouter";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) return <div className="h-screen w-full flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  if (isAuthenticated) {
    setLocation("/dashboard");
    return null;
  }

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-accent/10 blur-[100px]" />
      </div>

      <header className="container mx-auto px-6 py-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-lg text-white">
            <MapPin size={24} strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-bold font-display tracking-tight">LiveLoc</h1>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 container mx-auto px-6 flex flex-col lg:flex-row items-center justify-center gap-16 z-10">
        <div className="flex-1 max-w-xl text-center lg:text-left space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/80 text-secondary-foreground text-sm font-medium border border-border/50 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Real-time tracking
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold font-display leading-[1.1] tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
            Share your location securely.
          </h1>
          
          <p className="text-xl text-muted-foreground leading-relaxed">
            Generate a secure link and QR code to share your live movements with friends or family. You control when it starts and stops.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Button 
              size="lg" 
              onClick={handleLogin}
              className="h-14 px-8 rounded-2xl text-lg font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
            >
              Get Started with Google
            </Button>
          </div>

          <div className="pt-8 grid grid-cols-3 gap-6 text-center lg:text-left">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto lg:mx-0">
                <ShieldCheck size={20} />
              </div>
              <p className="font-semibold">Secure</p>
              <p className="text-xs text-muted-foreground">Encrypted & private</p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mx-auto lg:mx-0">
                <QrCode size={20} />
              </div>
              <p className="font-semibold">QR Share</p>
              <p className="text-xs text-muted-foreground">Scan to track</p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center mx-auto lg:mx-0">
                <Navigation size={20} />
              </div>
              <p className="font-semibold">Live Map</p>
              <p className="text-xs text-muted-foreground">Real-time updates</p>
            </div>
          </div>
        </div>

        <div className="flex-1 w-full max-w-lg lg:max-w-xl">
          <div className="relative aspect-square">
            {/* Mock Phone / Dashboard UI */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-[3rem] blur-3xl transform rotate-6" />
            <div className="relative h-full w-full glass-card rounded-[2.5rem] overflow-hidden border-4 border-white/20 p-2 shadow-2xl">
              <div className="absolute inset-0 bg-background/50 z-0" />
              {/* Unsplash Map Image */}
              {/* scenic map view aerial */}
              <img 
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80" 
                alt="Map Background" 
                className="absolute inset-0 w-full h-full object-cover opacity-60 z-0"
              />
              
              <div className="relative z-10 h-full flex flex-col justify-between p-6">
                 {/* Floating UI Elements */}
                 <div className="glass rounded-2xl p-4 flex items-center gap-4 animate-in slide-in-from-top-4 duration-700 fade-in">
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg shadow-green-500/30">
                      <Navigation size={20} fill="currentColor" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">Trip to Downtown</h3>
                      <p className="text-xs text-muted-foreground">Updating live...</p>
                    </div>
                 </div>

                 <div className="glass rounded-2xl p-4 mb-8 mx-4 animate-in slide-in-from-bottom-4 duration-700 delay-200 fade-in">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold uppercase text-muted-foreground">Share Link</span>
                      <QrCode size={16} className="text-primary" />
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-2 text-xs font-mono truncate text-center mb-2">
                      liveloc.app/view/8x92m
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
