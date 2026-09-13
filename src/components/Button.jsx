import React from "react";
import "./Button.css";

export default function Button({ as: Component = "button", variant = "primary", size = "medium", className = "", type, ...props }) {
  return <Component type={Component === "button" ? (type || "button") : undefined} className={`emc-button emc-button--${variant} emc-button--${size} ${className}`.trim()} {...props} />;
}
