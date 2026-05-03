import React from 'react';

export default function Logo({ size = "md" }) {
  const isLg = size === "lg";
  const isSm = size === "sm";
  
  // Dynamic sizing based on props (lg for Login, md for Sidebar, sm for Mobile Drawer)
  const iconSize = isLg ? 54 : isSm ? 28 : 36;
  const textSize = isLg ? "34px" : isSm ? "18px" : "22px";
  const gap = isLg ? "16px" : isSm ? "10px" : "12px";

  return (
    <div style={{ display: "flex", alignItems: "center", gap }}>
      <img 
        src="/logo.png" 
        alt="LogiTrack Logo"
        style={{
          width: iconSize,
          height: iconSize,
          objectFit: "cover",
          borderRadius: isSm ? "6px" : "10px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
          flexShrink: 0
        }}
      />
      <div style={{ 
        fontWeight: 800, 
        fontSize: textSize, 
        color: "white",
        letterSpacing: "-0.5px",
        lineHeight: 1,
      }}>
        Logi<span style={{ color: "#818cf8" }}>Track</span>
      </div>
    </div>
  );
}
