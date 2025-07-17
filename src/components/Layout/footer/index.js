import React from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import footerLogo from "../../../../assets/footer/footerLogo.webp";
import styles from "../Layout/styles.module.css";

const FooterComponent = () => {
  const currentYear = new Date().getFullYear();
  const router = useRouter();
  const handleEncipherhealthClick = () => {
    if (typeof window !== undefined) {
      window.open("https://encipherhealth.com/", "_blank");
    }
  };
  const currentPath = router?.pathname;
  return (
    <footer className="text-center">
      <div
        className={
          currentPath === "/reviewer/patients/details"
            ? `d-flex background-white`
            : `d-flex`
        }
      >
        <div
          className=" d-flex flex-column align-items-center justify-content-center"
          style={{ margin: "0 auto" }}
        >
          <div className="d-flex align-items-center">
            <Image src={footerLogo} className={styles.footerImg} />
            <p
              className={`mb-0 hovered-text ${styles.footer}`}
              onClick={handleEncipherhealthClick}
              style={{
                cursor: "pointer",
                position: "relative",
                bottom: 0,
              }}
            >
              &copy; {currentYear} Powered by Encipher Health Inc.
            </p>
            &nbsp; &nbsp;
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterComponent;
