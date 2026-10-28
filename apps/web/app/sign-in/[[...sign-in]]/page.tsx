import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Shell } from "@/components/shell";

export const metadata: Metadata = { title: "Ingresar | hack0", robots: { index: false, follow: false } };

export default function SignInPage() {
  return (
    <Shell>
      <div className="sign-in">
        <SignIn />
      </div>
    </Shell>
  );
}
