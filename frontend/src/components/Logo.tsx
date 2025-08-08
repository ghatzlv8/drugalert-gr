interface LogoProps {
  className?: string;
  showText?: boolean;
}

export default function Logo({ className = "h-8 w-8", showText = false }: LogoProps) {
  return (
    <div className="flex items-center space-x-2">
      <svg
        className={className}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Shield background */}
        <path
          d="M24 2L6 10V22C6 32.5 12.5 42.1 24 44C35.5 42.1 42 32.5 42 22V10L24 2Z"
          fill="#3B82F6"
        />
        
        {/* Alert bell */}
        <path
          d="M24 12C22.9 12 22 12.9 22 14V20L20 22V23H28V22L26 20V14C26 12.9 25.1 12 24 12ZM24 26C22.9 26 22 25.1 22 24H26C26 25.1 25.1 26 24 26Z"
          fill="white"
        />
        
        {/* Plus sign (medical) */}
        <path
          d="M31 18H29V16C29 15.4 28.6 15 28 15C27.4 15 27 15.4 27 16V18H25C24.4 18 24 18.4 24 19C24 19.6 24.4 20 25 20H27V22C27 22.6 27.4 23 28 23C28.6 23 29 22.6 29 22V20H31C31.6 20 32 19.6 32 19C32 18.4 31.6 18 31 18Z"
          fill="white"
        />
      </svg>
      
      {showText && (
        <span className="text-xl font-bold text-gray-900">DrugAlert.gr</span>
      )}
    </div>
  );
}
