import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

interface SignInPageProps {
  searchParams: Promise<{ redirect_url?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { redirect_url } = await searchParams;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto max-w-screen-xl px-4 lg:px-8">
          <div className="flex h-14 items-center">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-lg font-semibold tracking-tight">
                hack0
              </span>
              <span className="text-lg text-muted-foreground">.dev</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <SignIn
          fallbackRedirectUrl={redirect_url || "/onboarding/redirect"}
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-background border border-border shadow-none",
              headerTitle: "text-foreground",
              headerSubtitle: "text-muted-foreground",
              socialButtonsBlockButton: "bg-muted border-border text-foreground hover:bg-muted/80",
              socialButtonsBlockButtonText: "text-foreground font-medium",
              dividerLine: "bg-border",
              dividerText: "text-muted-foreground",
              formFieldLabel: "text-foreground",
              formFieldInput: "bg-background border-border text-foreground",
              formButtonPrimary: "bg-foreground text-background hover:bg-foreground/90",
              footerActionLink: "text-foreground hover:text-foreground/80",
              identityPreviewText: "text-foreground",
              identityPreviewEditButton: "text-muted-foreground hover:text-foreground",
            },
          }}
        />
      </main>
    </div>
  );
}
