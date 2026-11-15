import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { Shell } from "@/components/shell";
import { redirectPath, signInRedirects } from "@/lib/auth-redirect";

export const metadata: Metadata = { title: "Ingresar | hack0", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ redirect_url?: string | string[] }> };

export default async function SignInPage({ searchParams }: Props) {
  const path = redirectPath((await searchParams).redirect_url, (await headers()).get("host"));
  return (
    <Shell>
      <div className="sign-in">
        <SignIn signUpUrl="/sign-up" {...signInRedirects(path)} />
      </div>
    </Shell>
  );
}
