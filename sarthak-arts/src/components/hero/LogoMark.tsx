type Props = {
  size?: number;
  className?: string;
};

export function LogoMark({ size = 28, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
      <circle cx="32" cy="32" r="24" stroke="currentColor" strokeWidth="0.75" opacity="0.12" />
      <text
        x="32"
        y="44"
        textAnchor="middle"
        fontFamily="'Sanskrit Text', 'Noto Serif Devanagari', serif"
        fontSize="36"
        fill="currentColor"
      >
        ॐ
      </text>
    </svg>
  );
}
