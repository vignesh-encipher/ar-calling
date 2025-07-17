import { checkStatus } from "./helper";
import { portalUrl, tokenKey } from "../config";
import { getStorage } from "../storages";

export async function requestPortal(url, options) {
  const token = await getStorage(tokenKey);
  const actualUrl = `${portalUrl}${url}`;
  const actualOptions = {
    ...options,
    headers: {
      Authorization: `${"Bearer" + " " + token}`,
      "Content-Type": "application/json",
    },
  };
  return fetch(actualUrl, actualOptions).then(checkStatus);
}

export async function requestExternal(url, options, path) {
  const actualUrl = `${portalUrl}${url}`;
  const actualOptions = {
    ...options,
    body: JSON.stringify(body),
    headers: {
      Authorization: `${"Bearer" + " " + token}`,
      "Content-Type": "application/json",
    },
  };
  return fetch(actualUrl, actualOptions).then(checkStatus);
}
