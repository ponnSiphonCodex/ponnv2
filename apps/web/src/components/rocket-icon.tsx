export function RocketIcon({ size = 24, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <path d="M12 2c3.2 1.6 5 5 5 9 0 1.8-.4 3.4-1 4.8l-1.3-1a1 1 0 0 0-1.5.6l-.4 1.6h-1.6l-.4-1.6a1 1 0 0 0-1.5-.6l-1.3 1C7.4 14.4 7 12.8 7 11c0-4 1.8-7.4 5-9Z" fill={color}/>
      <circle cx="12" cy="9.5" r="1.8" fill="#001D58"/>
      <path d="M8.5 15.5 6 17c-.6.4-.6 1.3 0 1.7l1.7 1M15.5 15.5 18 17c.6.4.6 1.3 0 1.7l-1.7 1" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M11 19.5c0 1 .5 2 1 2.5.5-.5 1-1.5 1-2.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
