import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Shell } from "@/components/shell";

export const metadata: Metadata = { title: "Crear cuenta | hack0", robots: { index: false, follow: false } };

export default function SignUpPage() {
  return (
    <Shell>
      <div className="sign-in">
        <SignUp />
      </div>
    </Shell>
  );
}
