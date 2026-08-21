const Logo = () => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#10b981" />
      </linearGradient>
    </defs>
    <circle
      cx="50"
      cy="50"
      r="45"
      stroke="url(#logo-gradient)"
      strokeWidth="2"
      strokeDasharray="10 5"
      opacity="0.3"
    />
    <path
      d="M50 20L25 75H35L50 42L65 75H75L50 20Z"
      fill="url(#logo-gradient)"
    />
    <circle cx="50" cy="52" r="8" fill="#030712" />
    <circle cx="50" cy="52" r="4" fill="url(#logo-gradient)">
      <animate
        attributeName="opacity"
        values="1;0.5;1"
        dur="2s"
        repeatCount="indefinite"
      />
    </circle>
    <path
      d="M70 30L85 15"
      stroke="url(#logo-gradient)"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M75 40L90 35"
      stroke="url(#logo-gradient)"
      strokeWidth="1"
      strokeLinecap="round"
      opacity="0.5"
    />
  </svg>
);

export default Logo;
