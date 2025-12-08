import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { canManageEventBySlug } from "@/lib/actions/permissions";
import { isAdmin } from "@/lib/actions/claims";
import { db } from "@/lib/db";
import { events, communityMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export default async function DebugPermissionsPage() {
  const user = await currentUser();
  const { userId } = await auth();

  if (!user) {
    redirect("/sign-in");
  }

  const email = user.emailAddresses[0]?.emailAddress?.toLowerCase();
  const adminCheck = await isAdmin();

  // Test with hackaru-2025
  const testSlug = "hackaru-2025";
  const event = await db.query.events.findFirst({
    where: eq(events.slug, testSlug),
  });

  let membership = null;
  if (event?.organizationId) {
    membership = await db.query.communityMembers.findFirst({
      where: and(
        eq(communityMembers.communityId, event.organizationId),
        eq(communityMembers.userId, userId!)
      ),
    });
  }

  const canManage = await canManageEventBySlug(testSlug);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Debug: Permissions</h1>

        <div className="bg-muted p-4 rounded-lg space-y-2 font-mono text-sm">
          <div><strong>User ID:</strong> {userId}</div>
          <div><strong>Email:</strong> {email}</div>
          <div><strong>ADMIN_EMAILS env:</strong> {process.env.ADMIN_EMAILS}</div>
          <div><strong>Is Admin:</strong> {adminCheck ? "✅ YES" : "❌ NO"}</div>
        </div>

        <div className="bg-muted p-4 rounded-lg space-y-2 font-mono text-sm">
          <div><strong>Test Event:</strong> {testSlug}</div>
          <div><strong>Event Found:</strong> {event ? "✅ YES" : "❌ NO"}</div>
          <div><strong>Organization ID:</strong> {event?.organizationId || "None"}</div>
          <div><strong>Membership Found:</strong> {membership ? "✅ YES" : "❌ NO"}</div>
          {membership && (
            <div><strong>Membership Role:</strong> {membership.role}</div>
          )}
          <div><strong>Can Manage:</strong> {canManage ? "✅ YES" : "❌ NO"}</div>
        </div>

        {!canManage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Issue:</strong> Cannot manage event. Check:
            <ul className="list-disc ml-5 mt-2">
              <li>Email ({email}) should be in ADMIN_EMAILS</li>
              <li>OR have membership in organization {event?.organizationId}</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
