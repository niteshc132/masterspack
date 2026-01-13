import { SignIn, SignUp } from "@clerk/nextjs";
import Image from "next/image";

export const AuthBackground = ({ signIn }: { signIn?: boolean }) => (
  <>
    <Image
      src="/auth-background.png"
      alt="auth-background"
      className="object-cover brightness-90"
      fill
    />
    <div className="flex h-screen flex-col items-center justify-center gap-12">
      <div className="relative h-24 w-[180px]">
        <Image
          src="/logo.png"
          alt="Masters Logo"
          fill
          className="object-contain"
        />
      </div>
      {signIn && <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />}
      {!signIn && (
        <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" />
      )}
    </div>
  </>
);
