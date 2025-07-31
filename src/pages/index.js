import { useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { useRouter } from "next/router";
import PageLoading from "@/components/page-loading";
import { setStorage } from "@/utils/storages";

export default function Home() {
  const { instance, accounts, inProgress } = useMsal();
  const router = useRouter();

  // useEffect(() => {
  //   if (inProgress !== "none") return;

  //   // Always redirect to login when accounts are empty
  //   if (accounts.length === 0) {
  //     console.log("No session found. Forcing Outlook SSO login...");

  //     // Use prompt=login to force MS login page even if SSO cookie is present
  //     instance.loginRedirect({
  //       prompt: "login", // ✅ Forces user to re-enter credentials
  //     }).catch((error) => {
  //       console.error("Login error:", error);
  //     });

  //     return;
  //   }

  //   // Already logged in
  //   if (accounts.length > 0) {
  //     setStorage("token", accounts[0].idToken)
  //     console.log("✅ User authenticated. Redirecting to dashboard...");
  //     router.push("/projects");
  //   }
  // }, [instance, accounts, inProgress, router]);

  useEffect(() => {
    router.push("/files");
  }, []);

  return <PageLoading />;
}
