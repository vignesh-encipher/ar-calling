let inactivityTimeout;

export const startInactivityTimer = (logoutCallback, timeout = 15 * 60 * 1000) => {
  clearTimeout(inactivityTimeout);
  inactivityTimeout = setTimeout(logoutCallback, timeout);
};

export const resetInactivityTimer = (logoutCallback, timeout = 15 * 60 * 1000) => {
  startInactivityTimer(logoutCallback, timeout);
};

export const clearInactivityTimer = () => {
  clearTimeout(inactivityTimeout);
};
