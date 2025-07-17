import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { connect } from "react-redux";
import { Avatar, Menu, Tooltip } from "antd/lib";
import { UserOutlined } from "@ant-design/icons/lib";
import { faAnglesLeft, faAnglesRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getStorage } from "@/utils/storages.js";
import { getMenuListByRole, renderUserProfile } from "@/utils/reusable";

const MenuBar = ({ Sider, collapsed, toggleCollapse, styles, userDetails }) => {
  const router = useRouter();
  const currentRoute = router.pathname.toLowerCase();
  const [menuList, setMenuList] = useState([]);
  const [selectedKey, setSelectedKey] = useState("");

  useEffect(() => {
    const role = getStorage("userRole");
    const menu = getMenuListByRole(role?.toLowerCase());
    setMenuList(menu);
  }, []);

  useEffect(() => {
    const activeItem = menuList.find(
      (item) => item.to === router.pathname
    )?.title;
    if (activeItem) {
      setSelectedKey(activeItem);
    }
  }, [router.pathname, menuList]);

  return (
    <Sider width={200} className={styles.side} collapsed={collapsed}>
      <div
        className={`sidebar-header py-0 text-center d-flex justify-content-between ${styles.navHeader}`}
      >
        <div
          className={`w-75 d-flex justify-content-start align-items-center mx-2  ${styles.nameHeader}`}
        >
          <div
            className={`w-${
              collapsed ? "100" : "25"
            } h-100 rounded-1 py-1 mx-1`}
          >
            {userDetails?.userName ? (
              renderUserProfile({
                firstName: userDetails?.firstName,
                lastName: userDetails?.lastName,
                field: "header",
                width: "30px",
                height: "30px",
                boxShadow: true,
              })
            ) : (
              <Avatar size="medium" icon={<UserOutlined />} style={{width: "30px",
                height: "30px",}} />
             )}
          </div>
          {!collapsed && (
            <Tooltip
              title={`${userDetails?.firstName} ${userDetails?.lastName}`}
            >
              <div className="ml-2 font-weight1 name-container ellipsis">
                {userDetails?.firstName} {userDetails?.lastName}
              </div>
            </Tooltip>
          )}
        </div>
        <div
          type="text"
          onClick={toggleCollapse}
          className={`text-white d-flex align-items-center justify-content-center 
            ${
              collapsed
                ? styles.collapseButtonExpanded
                : styles.collapseButtonCollapsed
            }`}
        >
          {collapsed ? (
            <FontAwesomeIcon icon={faAnglesRight} className="font1"/>
          ) : (
            <FontAwesomeIcon icon={faAnglesLeft} className="font1"/>
          )}
        </div>
      </div>
      <Menu
        mode="inline"
        theme="light"
        selectedKeys={[selectedKey]}
        className={styles.customMenu}
      >
        {menuList?.map((item) => (
          <Menu.Item
            key={item.title.toLowerCase()}
            icon={item.iconStyle}
            onClick={() => {
              router.push(item?.to);
            }}
            className={
              (item.to === router.pathname ||
                (currentRoute+"/")?.includes(item.to?.toLowerCase())) &&
              styles.activeMenuStyle
            }
          >
            {item?.title}
          </Menu.Item>
        ))}
      </Menu>
    </Sider>
  );
};

const connector = connect((state) => ({
  userDetails: state.authReducer?.userDetails?.data?.response,
}));

export default connector(MenuBar);
