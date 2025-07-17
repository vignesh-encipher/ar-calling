import { Layout } from "antd/lib";
import { useRouter } from "next/router";
import styles from "./styles.module.css";
import NavBar from "../header";
import FooterComponent from "../footer";

const { Header, Content, Footer } = Layout;
const SidebarHeader = ({ children }) => {
  const router = useRouter();
  return (
    <Layout className={styles.layoutContainer} data-testid="layout-container">
      <NavBar Header={Header} styles={styles} />
      <Layout className={styles.layoutContainer}>
        <Content className={`bg-white overflow-auto`}>
          <div
            className={`${router.pathname == "/admin/settings" ? "" : "m-1"}`}
          >
            {children}
          </div>
        </Content>
        <Footer>
          <hr className="m-0" />
          <FooterComponent />
        </Footer>
      </Layout>
    </Layout>
  );
};

export default SidebarHeader;
