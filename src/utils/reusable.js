import {
  Avatar,
  message,
  notification,
  Popover,
  Skeleton,
  Tooltip,
} from "antd/lib";
import moment from "moment";
import Swal from "sweetalert2";
import { salt } from "@/utils/config";
import CryptoJS from "crypto-js";
import { removeStorage, setStorage } from "./storages";
import styles from "./page.module.css";
import { ssoLogout } from "lib/authService";

export const disableFutureDates = (current) => {
  let customDate = moment();
  return current && current.isAfter(customDate, "day");
};

export const debounce = (func, delay) => {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

export const disallowedCharacters = [
  "[",
  "{",
  "]",
  "}",
  "|",
  "!",
  ",",
  "%",
  "^",
  "\\",
  "(",
  ")",
  "#",
];

export const getAge = (dob) => {
  if (dob) {
    const diff = new Date() - new Date(dob);
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  }
};

export const commonFilterItems = [
  {
    id: 1,
    title: "Search",
    type: "search",
    value: null,
    placeholder: "Search",
  },
  {
    id: 2,
    title: "Status",
    type: "select",
    value: null,
    placeholder: "Select Status",
    options: [
      { label: "Active", value: "true" },
      { label: "In Active", value: "false" },
    ],
  },
  {
    id: 3,
    title: "Allocate",
    type: "select",
    value: null,
    placeholder: "Select Status",
    options: [
      { label: "Active", value: "true" },
      { label: "In Active", value: "false" },
    ],
  },
  {
    id: 6,
    title: "DateRange",
    type: "rangePicker",
    value: null,
    placeholder: "Select year",
    pickerType: "year",
  },
];

export const getResponsePopup = (res, duration = 1) => {
  switch (res?.data?.status ? res?.data?.status : res?.status) {
    case "USER_DEFINED_ERROR":
      return notification.warning({
        description: res?.data?.message ? res?.data?.message : res?.message,
        duration: 1,
      });
    case "SUCCESS":
      return notification.success({
        description: res?.data?.message ? res?.data?.message : res?.message,
        duration: duration,
      });
    case "FAILED":
      return notification.error({
        description: res?.data?.message ? res?.data?.message : res?.message,
        duration: 2,
      });
    case "EXCEPTION":
      return notification.error({
        description: res?.data?.message ? res?.data?.message : res?.message,
        duration: 2,
      });
    case "CUSTOM_EXCEPTION":
      return notification.error({
        description: res?.data?.message ? res?.data?.message : res?.message,
        duration: 2,
      });
    default:
      break;
  }
};

export const renderSkeleton = () => (
  <div className="skeleton-table">
    <div className="skeleton-header">
      <Skeleton.Input style={{ width: 2000 }} active />
    </div>

    {Array.from({ length: 6 }).map((_, index) => (
      <div key={index} className="skeleton-row">
        <Skeleton.Input style={{ width: 2000 }} active />
      </div>
    ))}
  </div>
);
export const tableSkeleton = ({ rows = 1, columns = 1 }) => (
  <div className="skeleton-table">
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div
        key={rowIndex}
        className="skeleton-row"
        style={{ overflow: "hidden" }}
      >
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton.Input
            key={colIndex}
            style={{ width: 100, height: 20, marginBottom: 0 }}
            active
          />
        ))}
      </div>
    ))}
  </div>
);

export const showTokenExpiredModal = () => {
  Swal.fire({
    title: "Warning!",
    text: "Oops! Your token is expired. Please log in again.",
    icon: "warning",
    confirmButtonText: "Logout",
    showCancelButton: false,
    confirmButtonColor: "var(--logoutBtn)",
    allowOutsideClick: false, // To prevent closing the modal by clicking outside
  }).then(async (result) => {
    if (result.isConfirmed) {
      removeStorage();
      await window.open("/projects", "_self");
    }
  });
};

export const encryptData = (data, key, iv) => {
  const keyUtf8 = CryptoJS.enc.Utf8.parse(key);
  const ivUtf8 = CryptoJS.enc.Utf8.parse(iv);
  const encrypted = CryptoJS.AES.encrypt(data, keyUtf8, {
    iv: ivUtf8,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return encrypted.toString();
};

export const generateRandomString = () => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomString = "";
  for (let i = 0; i < 16; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters.charAt(randomIndex);
  }
  return randomString;
};

export const encryptingPass = (password) => {
  const plaintextData = password;
  const encryptionKey = salt; // Should be 16, 24, or 32 bytes
  const initializationVector = generateRandomString(); // Should be 16 bytes
  const encryptedData = encryptData(
    plaintextData,
    encryptionKey,
    initializationVector
  );
  const values = { pass: encryptedData, iv: initializationVector };
  return values;
};

export const pdfEncrypt = (value) => {
  const plaintextData = value;
  let now = new Date();
  let date = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds(),
    now.getUTCMilliseconds()
  );
  const encryptionKey = salt; // Should be 16, 24, or 32 bytes
  const initializationVector = date + ":" + "vg"; // Should be 16 bytes
  const encryptedData = encryptData(
    plaintextData,
    encryptionKey,
    initializationVector
  );
  const values = { pass: encryptedData, iv: initializationVector };
  return values;
};

export const renderUserProfile = ({
  firstName,
  lastName,
  imageUrl,
  field,
  width,
  height,
  boxShadow,
}) => {
  const firstNameInitial = firstName?.charAt(0) || "";
  const secondNameInitial = (lastName && lastName?.charAt(0)) || "";
  const hash = (firstNameInitial.charCodeAt(0) % 6) + 1;
  const backgroundColor = field ? getBackgroundColor(hash) : "#263e50";

  if (!imageUrl) {
    const profileAvatar = (
      <Avatar
        style={{
          backgroundColor: backgroundColor,
          color: "white",
          width: width ? width : "40px",
          height: height ? height : "40px",
        }}
        className="d-flex justify-content-center align-items-center font-weight2 cursor-pointer font3 mx-2"
      >
        {lastName
          ? firstNameInitial?.toUpperCase() + secondNameInitial?.toUpperCase()
          : firstNameInitial?.toUpperCase()}
      </Avatar>
    );
    return profileAvatar;
  } else {
    const profileAvatar = (
      <img
        src={imageUrl}
        alt="avatar"
        style={{
          width: width ? width : "30px",
          height: height ? height : "30px",
        }}
        className={`cursor-pointer mx-2 ${styles.profileImgStyle} ${
          boxShadow && styles.profileImgBoxShadow
        }`}
      />
    );
    return profileAvatar;
  }
};

export const reusableEllipses = ({ str, count = 20 }) => {
  if (!str) return typeof str === "number" ? str : "---";
  if (str?.length > count) {
    return (
      <Tooltip placement="topRight" title={str}>
        {`${str?.substring(0, count)}...`}
      </Tooltip>
    );
  } else {
    return str;
  }
};

export const logoutFunction = async ({ router, azureLogout }) => {
  Swal.fire({
    title: "Warning!",
    text: "Do you want Logout!",
    icon: "warning",
    confirmButtonText: "Logout",
    showCancelButton: true,
    confirmButtonColor: "var(--logoutBtn)",
    closeOnConfirm: false,
  }).then(async (result) => {
    if (result.isConfirmed) {
      // removeStorage();
      // azureLogout && azureLogout.logoutRedirect({
      //   postLogoutRedirectUri: window.location.origin, // Redirect to home/login page after logout
      // })
      ssoLogout();
      router.push("/projects");
    }
  });
};

export const formatNumber = (number) => {
  switch (true) {
    case number >= 1000000000:
      return (
        <Popover content={number} trigger="hover">
          {((Math.floor(number / 100) * 100) / 1000000000).toFixed(1) + "B"}
        </Popover>
      );
    case number >= 1000000:
      return (
        <Popover content={number} trigger="hover">
          {((Math.floor(number / 100) * 100) / 1000000).toFixed(1) + "M"}
        </Popover>
      );
    case number >= 1000:
      return (
        <Popover content={number} trigger={"hover"}>
          {((Math.floor(number / 100) * 100) / 1000).toFixed(1) + "K"}
        </Popover>
      );
    default:
      return number == 0 ? 0 : Math.round(number).toString().padStart(2, "0");
  }
};

export const getId = (value) => {
  let lowerId = value.toLowerCase();
  let result = lowerId.replace(" ", "_");
  return result;
};


export const handleCopyTextInput = (info) => {
  if (info) {
    navigator.clipboard
      .writeText(info)
      .then(() => {
        message.success("Text copied to clipboard");
      })
      .catch((err) => {
        message.error("Failed to copy text: ", err);
      });
  }
};

export const getCamelCase = (str) => {
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (match, char) => char.toUpperCase());
};

export const getStatusColors = (status) => {
  let backgroundColor = "#0078D4";
  switch (status) {
    case "COMPLETED":
      backgroundColor = "#00BC13";
      break;
    case "AUDITED":
      backgroundColor = "#377880";
      break;
    case "REAUDIT":
      backgroundColor = "#ffd1a3";
      break;
    case "AUDIT_PENDING":
      backgroundColor = "#e28213";
      break;
    case "AUDIT_DECLINED":
      backgroundColor = "#ff5e5e";
      break;
    case "NEEDBACK":
      backgroundColor = "#2C28FB";
      break;
    case "QUERIED":
      backgroundColor = "#265073";
      break;
    case "DUPLICATE":
      backgroundColor = "#DC5B47";
      break;
    case "REASON":
      backgroundColor = "#0162A2";
      break;
  }
  return backgroundColor;
};

export const getOptionGenerator = ({
  item,
  label,
  value,
  isCombain = "",
  objKey,
}) => {
  if (!item) return item;
  if (isCombain || objKey) {
    return item.map((data) =>
      objKey
        ? {
            label: `${data?.[objKey]?.[label]} ${data?.[objKey]?.[isCombain]}`,
            value: data[value],
          }
        : {
            label: `${data[label]} ${data[isCombain]}`,
            value: data[value],
          }
    );
  }
  return item.map((data) => ({ label: data[label], value: data[value] }));
};

export const priorityOptions = [
  {
    value: "LOW",
    label: "Low",
  },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

export const generateReportStatus = [
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
];

export const getRoles = [
  { label: "Downloader", value: "DOWNLOADER" },
  { label: "Admin", value: "ADMIN" },
  { label: "Owner", value: "OWNER" },
  { label: "QA Lead", value: "QA_LEAD" },
  { label: "Project Lead", value: "PROJECT_LEAD" },
  { label: "QA", value: "QA" },
  { label: "Coder 2", value: "CODER_2" },
  { label: "Coder 1", value: "CODER_1" },
  // { label: "Super Admin", value: "SUPER_ADMIN" },
];

export const createIdGen = (key) => {
  if (key) {
    return key.trim().toLowerCase().replaceAll(" ", "-");
  } else {
    return key;
  }
};
export const ageCalculate = (date) => {
  const diff = new Date() - new Date(date);
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};
export const capitalizeFirstLetter = (str) => {
  if (!str) return "";
  const capitalizeWord =
    str.charAt(0)?.toUpperCase() + str?.slice(1).toLowerCase();
  return str ? capitalizeWord?.replace("_", " ") : "--";
};

export const formatLabel = (str) => {
  if (!str) return "--";

  return str
    .replace(/_/g, " ") // Replace underscores with spaces
    .split(" ") // Split into words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize each
    .join(" ");
};

export const getPathRoute = ({ router, roles }) => {
  const rolePaths = {
    TENANT_ADMIN: "/owner/dashboard",
    ADMIN: "/admin/dashboard",
    DOWNLOADER: "/downloader/downloader",
    QA: "/qa/tin",
    QA_LEAD: "/qalead/users",
    CODER2: "/coder2/patients",
    CODER1: "/coder1/patients",
    OWNER: "/owner/dashboard",
    SUPER_ADMIN: "/superadmin/users",
    PROJECT_LEAD: "/projectlead/users",
  };
  if (roles?.includes("SUPER_ADMIN")) {
    setStorage("userRole", "SUPER_ADMIN");
    router?.push(rolePaths["SUPER_ADMIN"]);
  } else if (roles?.includes("ADMIN")) {
    setStorage("userRole", "ADMIN");
    router?.push(rolePaths["ADMIN"]);
  } else if (roles?.includes("TENANT_ADMIN") || roles?.includes("OWNER")) {
    setStorage("userRole", "OWNER");
    router?.push(rolePaths["TENANT_ADMIN"]);
  } else if (roles?.includes("DOWNLOADER")) {
    setStorage("userRole", "DOWNLOADER");
    router?.push(rolePaths["DOWNLOADER"]);
  } else if (roles?.includes("QA_LEAD")) {
    setStorage("userRole", "QA_LEAD");
    router?.push(rolePaths["QA_LEAD"]);
  } else if (roles?.includes("QA")) {
    setStorage("userRole", "QA");
    router?.push(rolePaths["QA"]);
  } else if (roles?.includes("CODER_2")) {
    setStorage("userRole", "CODER_2");
    router?.push(rolePaths["CODER2"]);
  } else if (roles?.includes("CODER_1")) {
    setStorage("userRole", "CODER_1");
    router?.push(rolePaths["CODER1"]);
  } else if (roles?.includes("PROJECT_LEAD")) {
    setStorage("userRole", "PROJECT_LEAD");
    router?.push(rolePaths["PROJECT_LEAD"]);
  } else {
    getResponsePopup({
      status: "FAILED",
      message: "Role not found!",
    });
  }
};

export const convertUTCTimezone = (instantTime) => {
  if (!instantTime) return instantTime;
  const time = momentTimezone(instantTime);
  const offset = momentTimezone.tz
    .zone(momentTimezone.tz.guess())
    .utcOffset(time);
  const adjustedTime = time.clone().add(offset, "minutes");
  return adjustedTime.toISOString();
};

export const convertLocalTimezone = ({ date, format = "MM/DD/YYYY" }) => {
  if (!date) return date;
  const time = momentTimezone(date);
  const offset = momentTimezone.tz
    .zone(momentTimezone.tz.guess())
    .utcOffset(time);
  let adjustedTime = time.clone().subtract(offset, "minutes").toISOString();
  return momentTimezone.utc(adjustedTime).format(format);
};

export const getDayBasedFilter = [
  { label: "Today", value: "0" },
  { label: "Yesterday", value: "1" },
  { label: "Last 3 Days", value: "2" },
  { label: "Last 7 Days", value: "6" },
  { label: "Last 30 Days", value: "29" },
  { label: "Custom Date", value: "custom-date" },
];

export const getDayBasedDate = (date) => {
  const endDate = date == 1 ? 1 : 0;
  return {
    startDate: `${moment()
      .subtract(date, "days")
      .format("YYYY-MM-DD")}T00:00:00.000Z`,
    endDate: `${moment()
      .subtract(endDate, "days")
      .format("YYYY-MM-DD")}T23:59:59.999Z`,
  };
};
