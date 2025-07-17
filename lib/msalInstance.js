import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "./authConfig";

export const msalInstance = new PublicClientApplication(msalConfig);

msalInstance.initialize().then(() => {
  msalInstance.handleRedirectPromise().catch(error => {
    if (error.errorCode !== "no_token_request_cache_error") {
      console.error("MSAL Redirect Error:", error);
    }
    // else: suppress this expected error
  });
});
