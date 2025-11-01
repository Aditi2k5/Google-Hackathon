import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}