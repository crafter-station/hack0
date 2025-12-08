import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DebugMePage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Debug: User Info</h1>
        <div className="bg-muted p-4 rounded-lg space-y-2 font-mono text-sm">
          <div>
            <strong>User ID:</strong> {user.id}
          </div>
          <div>
            <strong>Email:</strong> {user.emailAddresses[0]?.emailAddress}
          </div>
          <div>
            <strong>Name:</strong> {user.firstName} {user.lastName}
          </div>
        </div>
        <div className="mt-4 p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">
            Copy this command and run it in your terminal:
          </p>
          <code className="block bg-muted p-3 rounded text-xs">
            bun run scripts/init-community-for-event.ts hackaru-2025 {user.id}
          </code>
        </div>
      </div>
    </div>
  );
}
