import { useEffect, useRef, useState } from "react";
import { Provider } from "react-redux";
import { useRouter } from "next/router";
import "nprogress/nprogress.css";
import NProgress from "nprogress";
import Router from "next/router";
import { MsalProvider } from "@azure/msal-react";
import "../styles/globals.css";
import "bootstrap/dist/css/bootstrap.css";

import "antd/dist/reset.css";
import SidebarHeader from "@/components/Layout/Layout";
import useSecurePage from "./useSecurePage";
import {
  startInactivityTimer,
  resetInactivityTimer,
  clearInactivityTimer,
} from "@/utils/inactiveTracker";
import { wrapper, store } from "../store/index";
import { setStorage } from "../utils/storages";
import { msalInstance } from "lib/msalInstance";

function MyApp({ Component, pageProps }) {
  const account = msalInstance.getAllAccounts()[0];
  const router = useRouter();
  const hasRedirected = useRef(false);
  useSecurePage();
  const isAuthPage = ["/", "/login", "/projects"].includes(router.pathname);
  // Redirect promise handler
  // const hasHandledRedirect = useRef(false);
  // useEffect(() => {
  //   if (!hasHandledRedirect.current) {
  //     hasHandledRedirect.current = true;
  //     msalInstance
  //       .handleRedirectPromise()
  //       .then((response) => {
  //         if (response) {
  //           console.log("MSAL redirect response:", response);
  //         }
  //       })
  //       .catch((error) => {
  //         console.error("MSAL redirect error:", error);
  //       });
  //   }
  // }, []);

  // // Inactivity logout logic
  // useEffect(() => {
  //   const account = msalInstance.getAllAccounts()[0];
  //   if (!account) return;

  //   const handleLogout = () => {
  //     console.log("Logging out due to inactivity");
  //     ssoLogout();
  //   };

  //   const handleActivity = () => {
  //     resetInactivityTimer(handleLogout);
  //   };

  //   const activityEvents = ["mousemove", "keydown", "scroll", "click"];
  //   activityEvents.forEach((event) =>
  //     window.addEventListener(event, handleActivity)
  //   );
  //   startInactivityTimer(handleLogout);

  //   return () => {
  //     activityEvents.forEach((event) =>
  //       window.removeEventListener(event, handleActivity)
  //     );
  //     clearInactivityTimer();
  //   };
  // }, [router.pathname]);

  // useEffect(() => {
  //   const account = msalInstance.getAllAccounts()[0];
  //   if (!account) return;
  //   let previousToken = null;
  //   const refreshToken = async () => {
  //     try {
  //       const tokenResponse = await msalInstance.acquireTokenSilent({
  //         account,
  //         scopes: ["User.Read", "offline_access"],
  //         forceRefresh: true,
  //       });
  //       const newToken = tokenResponse.accessToken;

  //       if (previousToken && previousToken !== newToken) {
  //         console.log("✅ Access token has been refreshed.");
  //       }
  //       setStorage("token", tokenResponse.idToken);
  //       previousToken = newToken;

  //       const tokenParts = newToken.split(".");
  //       const payload = JSON.parse(atob(tokenParts[1]));
  //       console.log(
  //         "🔒 Token expires at:",
  //         new Date(payload.exp * 1000).toISOString(),
  //         payload
  //       );
  //     } catch (error) {
  //       console.error("❌ Silent token refresh failed. Logging out...");
  //       ssoLogout();
  //     }
  //   };

  //   refreshToken(); // initial run
  //   const interval = setInterval(refreshToken, 16 * 30 * 1000);

  //   return () => clearInterval(interval);
  // }, [router.pathname]);

  // Loading bar for route changes
  useEffect(() => {
    const handleStart = () => NProgress.start();
    const handleComplete = () => NProgress.done();

    NProgress.configure({ showSpinner: false });
    Router.events.on("routeChangeStart", handleStart);
    Router.events.on("routeChangeComplete", handleComplete);
    Router.events.on("routeChangeError", handleComplete);

    return () => {
      Router.events.off("routeChangeStart", handleStart);
      Router.events.off("routeChangeComplete", handleComplete);
      Router.events.off("routeChangeError", handleComplete);
    };
  }, []);

  return (
    <MsalProvider instance={msalInstance}>
      <Provider store={store}>
        {isAuthPage ? (
          <Component {...pageProps} />
        ) : (
          <SidebarHeader>
            <Component {...pageProps} />
          </SidebarHeader>
        )}
      </Provider>
    </MsalProvider>
  );
}

export default wrapper.withRedux(MyApp);
