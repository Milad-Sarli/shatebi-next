import React from "react";

export default function LeavesBackgroundPattern() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      style={{ opacity: 0.12 }}
      aria-hidden="true"
    >
      {/* Animated circles */}
      <circle cx="100" cy="100" r="40" fill="#fbbf24" fillOpacity="0.7">
        <animate attributeName="cy" values="100;130;100" dur="7s" repeatCount="indefinite" />
        <animate attributeName="r" values="40;50;40" dur="6s" repeatCount="indefinite" />
      </circle>
      <circle cx="300" cy="150" r="30" fill="#3b82f6" fillOpacity="0.7">
        <animate attributeName="cx" values="300;340;300" dur="8s" repeatCount="indefinite" />
        <animate attributeName="r" values="30;40;30" dur="5s" repeatCount="indefinite" />
      </circle>
      <circle cx="500" cy="80" r="50" fill="#10b981" fillOpacity="0.7">
        <animate attributeName="cy" values="80;120;80" dur="9s" repeatCount="indefinite" />
        <animate attributeName="r" values="50;60;50" dur="7s" repeatCount="indefinite" />
      </circle>
      <circle cx="700" cy="200" r="35" fill="#a1a1aa" fillOpacity="0.7">
        <animate attributeName="cx" values="700;670;700" dur="10s" repeatCount="indefinite" />
        <animate attributeName="r" values="35;45;35" dur="6s" repeatCount="indefinite" />
      </circle>
      {/* Animated rectangles */}
      <rect x="200" y="250" width="60" height="60" rx="12" fill="#fbbf24" fillOpacity="0.7">
        <animate attributeName="y" values="250;280;250" dur="7s" repeatCount="indefinite" />
        <animate attributeName="width" values="60;80;60" dur="6s" repeatCount="indefinite" />
      </rect>
      <rect x="400" y="300" width="80" height="40" rx="8" fill="#3b82f6" fillOpacity="0.7">
        <animate attributeName="x" values="400;420;400" dur="8s" repeatCount="indefinite" />
        <animate attributeName="height" values="40;60;40" dur="5s" repeatCount="indefinite" />
      </rect>
      <rect x="600" y="120" width="50" height="90" rx="16" fill="#10b981" fillOpacity="0.7">
        <animate attributeName="y" values="120;160;120" dur="9s" repeatCount="indefinite" />
        <animate attributeName="width" values="50;70;50" dur="7s" repeatCount="indefinite" />
      </rect>
      {/* Add more animated shapes as desired for visual interest */}
    </svg>
  );
} 