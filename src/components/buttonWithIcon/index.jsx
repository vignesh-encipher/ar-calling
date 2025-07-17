import React from "react";
import Style from "./style.module.css";

const RegularButtonWithIcon = ({ type, name, onClick, width, icon }) => {
  return (
    <button
      className={`btn mx-1 ${
        type === "outline" ? Style.outer : Style.btnColor
      }`}
      onClick={onClick}
      style={{ width: width }}
    >
      <span style={{ width: "20px", marginRight: "12px" }}>{icon}</span>
      <span className={Style.btnText}>{name}</span>
    </button>
  );
};

export default RegularButtonWithIcon;
