import CryptoJS from "crypto-js";
import { salt, serverControl } from "../utils/config";

const secretKey = salt;
const hashKey = (key) => {
  return CryptoJS.SHA256(key).toString();
};
export const getStorage = (key) => {
  try {
    if (serverControl === "production") {
      const hashedKey = hashKey(key);
      const encryptedValue = sessionStorage.getItem(hashedKey);
      if (!encryptedValue) return null;
      const decryptedBytes = CryptoJS.AES.decrypt(encryptedValue, secretKey);
      const decryptedValue = decryptedBytes.toString(CryptoJS.enc.Utf8);
      return decryptedValue;
    } else {
      const value = sessionStorage.getItem(key);
      return value;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const setStorage = (key, value) => {
  try {
    if (serverControl === "production") {
      const hashedKey = hashKey(key);
      const stringValue =
        typeof value === "string" ? value : JSON.stringify(value);
      const encryptedValue = CryptoJS.AES.encrypt(
        stringValue,
        secretKey
      ).toString();
      sessionStorage.setItem(hashedKey, encryptedValue);
      return Promise.resolve();
    } else {
      sessionStorage.setItem(key, value);
      return Promise.resolve();
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const removeStorage = (key) => {
  try {
    if (key) {
      if (serverControl === "production") {
        const hashedKey = hashKey(key);
        sessionStorage.removeItem(hashedKey);
        return Promise.resolve();
      } else {
        sessionStorage.removeItem(key);
        return Promise.resolve();
      }
    } else {
      sessionStorage.clear();
      return Promise.resolve();
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getLocalStored = () => {
  const allSessionStorage = {};
  if (typeof window !== "undefined" && typeof sessionStorage !== "undefined") {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      allSessionStorage[key] = sessionStorage.getItem(key);
    }
  }
  return allSessionStorage;
};
