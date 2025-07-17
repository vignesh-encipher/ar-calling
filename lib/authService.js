// // lib/authService.js
// import { msalInstance } from "./msalInstance";
// // import { msalInstance } from "./msalInstance";

// export const ssoLogout = () => {
//   msalInstance.logoutRedirect({
//     postLogoutRedirectUri: "/", // Change to where you want to send users after logout
//   });
// };

// const isTokenExpired = (tokenResponse) => {
//   if (!tokenResponse || !tokenResponse.expiresOn) return true;
//   return new Date() > new Date(tokenResponse.expiresOn);
// };

// export const acquireTokenSilent = async () => {
//   try {
//     const accounts = msalInstance.getAllAccounts();
//     // console.log(accounts, "testings");

//     if (accounts.length === 0) {
//       console.log(" No logged-in user found, logging out...");
//       msalInstance.logoutRedirect({
//         postLogoutRedirectUri: "/", // Change to where you want to send users after logout
//       });
//       return null;
//     }

//     // Request token from cache or refresh if needed
//     const tokenResponse = await msalInstance.acquireTokenSilent({
//       account: accounts[0],
//       scopes: ["User.Read"], // Adjust scopes as needed
//     });

//     // If token is expired, log the user out
//     if (isTokenExpired(tokenResponse)) {
//       console.log(" Access token expired, logging out...");
//       msalInstance.logoutRedirect({
//         postLogoutRedirectUri: "/", // Change to where you want to send users after logout
//       });
//       return null;
//     }

//     return tokenResponse.idToken;
//   } catch (error) {
//     console.error(" acquireTokenSilent error:", error);

//     // If refresh token is expired, force logout
//     if (
//       error.errorMessage?.includes("interaction_required") ||
//       error.errorMessage?.includes("invalid_grant") ||
//       error.errorMessage?.includes("AADSTS70008") // Token expired error
//     ) {
//       console.log(" Token expired or invalid, logging out...");
//       msalInstance.logoutRedirect({
//         postLogoutRedirectUri: "/", // Change to where you want to send users after logout
//       });
//     }

//     return null;
//   }
// };

// import { removeStorage } from "@/utils/storages";
// import { msalInstance } from "./msalInstance";

// // Logout function
// export const ssoLogout = () => {
//   removeStorage();
//   msalInstance.logoutRedirect({
//     postLogoutRedirectUri: "/", // Redirect after logout
//   });
// };
// export const ssoLogout = async () => {
//   console.warn("Logging out current user...");

//   try {
//     // Get all active accounts
//     const accounts = msalInstance.getAllAccounts();
//     console.log("accounts:", accounts);

//     if (accounts.length > 0) {
//       // Logout with redirect for the first available account
//       await msalInstance.logoutRedirect({
//         account: accounts[0],
//         postLogoutRedirectUri: "/",
//         onRedirectNavigate: () => false, // Prevent unnecessary navigation
//       });
//     } else {
//       console.warn(" No active user found, redirecting to login...");
//       await msalInstance.logoutRedirect({
//         postLogoutRedirectUri: "/",
//       });
//     }

//     // Clear session and local storage after logout
//     sessionStorage.clear();
//     localStorage.clear();
    
//   } catch (error) {
//     console.error(" Error during logout:", error);
//   }
// };



// Function to acquire token silently (only checking refresh token issues)
// export const acquireTokenSilent = async () => {
//   try {
//     const accounts = msalInstance.getAllAccounts();
    
//     if (accounts.length === 0) {
//       console.log("No logged-in user found, logging out...");
//       ssoLogout();
//       return null;
//     }

//     // Request token silently (MSAL will handle access token refresh)
//     const tokenResponse = await msalInstance.acquireTokenSilent({
//       account: accounts[0],
//       scopes: ["User.Read"], // Adjust scopes as needed
//     });

//     return tokenResponse.idToken; // Return the valid token
//   } catch (error) {
//     console.error("acquireTokenSilent error:", error);

//     // Handling only refresh token expiration cases
//     if (
//       error.errorMessage?.includes("invalid_grant") || // Refresh token expired
//       error.errorMessage?.includes("AADSTS50173") || // Requires user re-auth
//       error.errorMessage?.includes("AADSTS70008") || // Expired refresh token
//       error.errorMessage?.includes("AADSTS90072") || // Refresh token revoked
//       error.errorMessage?.includes("AADSTS54005") // Refresh token used too many times
//     ) {
//       console.log("Refresh token expired or invalid, logging out...");
//       ssoLogout();
//     }

//     return null;
//   }
// };



// import { removeStorage } from "@/utils/storages";
// import { msalInstance } from "./msalInstance";

// // Logout function
// export const ssoLogout = () => {
//   removeStorage();
//   msalInstance.logoutRedirect({
//     postLogoutRedirectUri: "/", // Redirect after logout
//   });
// };

// export const acquireTokenSilent = async () => {
//   try {
//     const accounts = msalInstance.getAllAccounts();
    
//     if (accounts.length === 0) {
//       console.log("No logged-in user found, logging out...");
//       ssoLogout();
//       return null;
//     }

//     // Request token silently
//     const tokenResponse = await msalInstance.acquireTokenSilent({
//       account: accounts[0],
//       scopes: ["User.Read"],
//     });

//     return tokenResponse.idToken;
//   } catch (error) {
//     console.error("acquireTokenSilent error:", error);

//     if (
//       error.errorMessage?.includes("invalid_grant") ||
//       error.errorMessage?.includes("AADSTS50173") ||
//       error.errorMessage?.includes("AADSTS70008") ||
//       error.errorMessage?.includes("AADSTS90072") ||
//       error.errorMessage?.includes("AADSTS54005")
//     ) {
//       console.log("Refresh token expired or invalid, logging out...");
//       ssoLogout();
//     }

//     return null;
//   }
// };



import { msalInstance } from "./msalInstance";
import { removeStorage } from "@/utils/storages";

export const ssoLogout = () => {
  removeStorage();
  msalInstance.logoutRedirect({
    postLogoutRedirectUri: "/",
  });
};

export const acquireTokenSilent = async () => {
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length === 0) {
    console.log("No account found.");
    ssoLogout();
    return null;
  }

  try {
    const tokenResponse = await msalInstance.acquireTokenSilent({
      account: accounts[0],
      scopes: ["User.Read", "offline_access"],
    });

    return tokenResponse.idToken;
  } catch (error) {
    console.error("Silent token acquisition failed:", error);

    const criticalErrors = [
      "invalid_grant",
      "AADSTS50173",
      "AADSTS70008",
      "AADSTS90072",
      "AADSTS54005",
    ];

    if (criticalErrors.some((e) => error.message?.includes(e))) {
      console.log("Token invalid or expired — logging out.");
      ssoLogout();
    }

    return null;
  }
};
