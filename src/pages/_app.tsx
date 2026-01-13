import { type AppType } from "next/app";
import { api } from "~/utils/api";
import "~/styles/globals.css";
import localFont from "next/font/local";
import {
  ClerkProvider,
  RedirectToSignIn,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";
import { useRouter } from "next/router";

const sans3Font = localFont({
  src: [
    {
      path: "./fonts/Figtree-Regular.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/Figtree-Italic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "./fonts/Figtree-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/Figtree-BoldItalic.ttf",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-sourceSans",
});

const publicPages = ["/sign-in/[[...index]]", "/sign-up/[[...index]]"];

const MyApp: AppType = ({ Component, pageProps }) => {
  const { pathname } = useRouter();
  const { data } = api.users.getRole.useQuery();
  const isPublicPage = publicPages.includes(pathname);

  return (
    <main className={sans3Font.variable}>
      <ClerkProvider
        {...pageProps}
        appearance={{
          variables: {
            colorPrimary: "#3B84B8",
            borderRadius: "0.08",
            fontFamily: `var(${sans3Font.variable})`,
          },
          elements: {
            formButtonPrimary: "rounded-lg",
            formFieldInput: "rounded-lg",
          },
        }}
      >
        <Toaster />
        {isPublicPage && <Component {...pageProps} />}
        {!isPublicPage && (
          <>
            <SignedIn>
              {data === "GUEST" && (
                <div className="flex h-screen w-screen flex-col items-center justify-center">
                  <div>Please contact an admin</div>
                  <div>To grant you access</div>
                </div>
              )}
              {data !== "GUEST" && (
                <div>
                  <Component {...pageProps} />
                </div>
              )}
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        )}
      </ClerkProvider>
    </main>
  );
};

export default api.withTRPC(MyApp);
