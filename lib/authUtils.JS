import { msalInstance } from "./msalInstance";
import { loginRequest, graphRequest, storageRequest } from "./authConfig";
import { InteractionRequiredAuthError } from "@azure/msal-browser";

export const getAccount = () => {
  const accounts = msalInstance.getAllAccounts();
  return accounts.length > 0 ? accounts[0] : null;
};

export const acquireToken = async (resource) => {
  const account = getAccount();
  if (!account) throw new Error("No user account available");

  const tokenRequest = {
    graph: { ...graphRequest, account, forceRefresh: true },
    storage: { ...storageRequest, account, forceRefresh: true },
  }[resource] || { ...loginRequest, account, forceRefresh: true };

  try {
    console.log(" Attempting silent token acquisition...");
    const response = await msalInstance.acquireTokenSilent(tokenRequest);
    console.log("New Access Token:", response.accessToken);
    return response.accessToken;
  } catch (error) {
    console.error("Token acquisition failed:", error);
    if (error instanceof InteractionRequiredAuthError) {
      console.warn("User interaction required for token renewal.");
      return msalInstance.acquireTokenRedirect(tokenRequest);
    }
    throw error;
  }
};

export const handleLogin = () => msalInstance.loginRedirect(loginRequest);

export const handleLogout = () => 
  msalInstance.logoutRedirect({ postLogoutRedirectUri: "/" });
