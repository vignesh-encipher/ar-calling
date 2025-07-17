import React from "react";
import { connect } from "react-redux";
import { useRouter } from "next/router";
import Image from "next/image";
import headerStyles from "./styles.module.css";
import {
  AdminMenuList,
  Coder1MenuList,
  Coder2MenuList,
  DownloaderMenuList,
  OwnerMenuList,
  ProjectLeadMenuList,
  QALeadMenuList,
  QAMenuList,
  superAdminMenuList,
} from "../menuBar/menu";
import {
  createIdGen,
  getPathRoute,
  logoutFunction,
  formatLabel,
} from "@/utils/reusable";
import {
  getLocalStored,
  getStorage,
  removeStorage,
  setStorage,
} from "@/utils/storages";

const NavBar = ({
  Header,
  styles,
}) => {
  const router = useRouter();
  const stateActive = router.pathname;
  const { role = "" } = getLocalStored();

  const roleBasedRender = () => {
    switch (role?.toLowerCase()) {
      case "owner":
        return OwnerMenuList;
      case "admin":
        return AdminMenuList;
      case "coder_2":
        return Coder2MenuList;
      case "coder_1":
        return Coder1MenuList;
      case "downloader":
        return DownloaderMenuList;
      case "qa":
        return QAMenuList;
      case "super_admin":
        return superAdminMenuList;
      case "qa_lead":
        return QALeadMenuList;
      case "project_lead":
        return ProjectLeadMenuList;
      default:
        return [];
    }
  };
  const renderMenuItems = () => {
    if (role === null) {
      return null;
    }
    const condition = roleBasedRender();
    return condition?.map((data, index) => {
      const currentPath = router.pathname.replace(/\/$/, "");
      const menuPath = data?.to.replace(/\/$/, "");
      const isActive = currentPath === menuPath;
      const activeState =
        isActive ||
        stateActive === data.childRoute ||
        stateActive === data?.childRoute1 ||
        stateActive === data?.childRoute2 ||
        stateActive === data?.childRoute3 ||
        stateActive === data?.childRoute4;
      return (
        <li
          className={` ${activeState ? headerStyles.header_active : ""}`}
          key={index}
          onClick={() => {
            router.push(data?.to);
          }}
          id={`${createIdGen(`${role} ${data?.title}`)}`}
        >
          <div className="d-flex cursor-pointer">
            <div className="menu-icon">
              <Image
                src={activeState ? data.activeIcon : data.iconStyle}
                alt="icon"
                width={15}
                height={15}
                className={`mx-1 ${headerStyles.menuIconStyle}`}
              />
            </div>
            <span className={`nav-text header-nav-text`}>{data.title}</span>
          </div>
        </li>
      );
    });
  };

  return (
    <div>
      <Header
        className={`text-white custom-header d-flex align-items-center justify-content-between ${styles.customHeader}`}
      >
        <div
          className={`d-flex align-items-center ${headerStyles.logoContainer}`}
        >
          {/* Logs */}
        </div>
        <div className={`${headerStyles.navitems}`}>
          <ul
            className={`d-flex align-items-center justify-content-center ${headerStyles.metismenu} ${headerStyles.header_menu}`}
            id="menu"
          >
            {renderMenuItems()}
          </ul>
        </div>
        <div
          className={`d-flex align-items-center profile-detail ${headerStyles.profileContainer}`}
        >
          {/* profile */}
        </div>
      </Header>
    </div>
  );
};

const connector = connect((state) => ({}), {});
export default connector(NavBar);
