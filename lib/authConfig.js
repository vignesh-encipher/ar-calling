import { portalRedirectUrl, protalClientId } from "@/utils/config";

export const msalConfig = {
  auth: {
    clientId: protalClientId,
    // clientId: "a6a0c70c-a81d-4e36-832a-541f7d3cc687",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: portalRedirectUrl,
    knownAuthorities: ["login.microsoftonline.com"],
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    tokenRenewalOffsetSeconds: 300,
    windowHashTimeout: 60000,
    iframeHashTimeout: 60000,
    loadFrameTimeout: 10000,
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (!containsPii) console.log(`MSAL ${level}: ${message}`);
      },
      piiLoggingEnabled: false,
    },
  },
};

export const loginRequest = {
  scopes: ["User.Read", "openid", "profile", "offline_access"],
  prompt: "select_account",
  extraQueryParameters: {
    domain_hint: "organizations",
  },
};

export const silentRequest = {
  scopes: ["User.Read", "offline_access"],
  redirectUri: portalRedirectUrl,
  extraQueryParameters: {
    prompt: "none",
  },
};
