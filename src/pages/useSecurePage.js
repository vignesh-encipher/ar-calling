import { useEffect, useRef } from "react";
import { projectBase } from "@/utils/config";

const useSecurePage = () => {
  const overlayRef = useRef(null);
  let isCmdShiftPressed = false;

  useEffect(() => {
    if (projectBase !== "production") return;

    // === Overlay for screen blur ===
    const overlay = document.createElement("div");
    Object.assign(overlay.style, {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "#fff",
      opacity: "1",
      zIndex: "999999",
      display: "none",
      pointerEvents: "none",
    });
    document.body.appendChild(overlay);
    overlayRef.current = overlay;

    const showOverlay = ({closeInspect}) => {
      if(closeInspect){
        alert("Close inspect tab")
      }
      overlay.style.display = "block";
      document.body.style.filter = "blur(10px)";
    };

    const hideOverlay = () => {
      overlay.style.display = "none";
      document.body.style.filter = "none";
    };

    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();

      // Block Print
      if ((e.ctrlKey || e.metaKey) && key === "p") {
        e.preventDefault();
      }
      console.log(e, "event");
      // Block DevTools shortcuts
      if (
        key === "f12" ||
        (e.ctrlKey && (e.shiftKey || e.altKey) && key === "i") ||
        (e.metaKey && (e.shiftKey || e.altKey) && key === "i") ||
        e.keyCode === 73
      ) {
        e.preventDefault();
        showOverlay();
      }

      // Block Cmd+Shift+3/4/5
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        showOverlay();
        setTimeout(hideOverlay, 2000);
      }
      // printscreen
      if (e.key === "PrintScreen" || e.keyCode === 44) {
        e.preventDefault();
        showOverlay();
        setTimeout(hideOverlay, 2000);
      }
      // Track Cmd+Shift
      if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
        isCmdShiftPressed = true;
        return;
      }

      if (isCmdShiftPressed) {
        e.preventDefault();
        e.stopPropagation();
        isCmdShiftPressed = false;
      }
    };

    const handleContextMenu = (e) => e.preventDefault();

    const handleVisibilityChange = () => {
      document.body.style.filter = document.hidden ? "blur(10px)" : "none";
    };

    // === DevTools Detection ===
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold =
        window.outerHeight - window.innerHeight > threshold;

      if (widthThreshold || heightThreshold) {
        showOverlay({closeInspect:true}); // You could also redirect or logout
        console.warn("DevTools detected");
      } else {
        hideOverlay();
      }
    };

    const devToolsInterval = setInterval(detectDevTools, 1000);

    // Add all listeners
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      // Cleanup
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(devToolsInterval);
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      document.body.style.filter = "none";
    };
  }, []);

  return null;
};

export default useSecurePage;
