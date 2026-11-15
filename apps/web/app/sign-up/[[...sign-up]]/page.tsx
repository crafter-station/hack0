import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { Shell } from "@/components/shell";
import { redirectPath, signUpRedirects } from "@/lib/auth-redirect";

export const metadata: Metadata = { title: "Crear cuenta | hack0", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ redirect_url?: string | string[] }> };

export default async function SignUpPage({ searchParams }: Props) {
  const path = redirectPath((await searchParams).redirect_url, (await headers()).get("host"));
  return (
    <Shell>
      <div className="sign-in">
        <SignUp signInUrl="/sign-in" {...signUpRedirects(path)} />
      </div>
    </Shell>
  );
}
