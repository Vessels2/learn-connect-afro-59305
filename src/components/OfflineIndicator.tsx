import { WifiOff, Wifi } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";

export const OfflineIndicator = () => {
  const isOnline = useOfflineStatus();

  if (isOnline) return null;

  return (
    <Alert className="fixed bottom-4 right-4 w-auto max-w-md z-50 bg-yellow-50 border-yellow-200">
      <WifiOff className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800 ml-2">
        You're offline. Changes will be saved locally and synced when you reconnect.
      </AlertDescription>
    </Alert>
  );
};

export const OnlineStatusBadge = () => {
  const isOnline = useOfflineStatus();

  return (
    <div className="flex items-center gap-2 text-sm">
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4 text-green-500" />
          <span className="text-muted-foreground">Online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-yellow-500" />
          <span className="text-muted-foreground">Offline</span>
        </>
      )}
    </div>
  );
};
