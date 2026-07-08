type Props = {
  name: string;
  image?: string | null;
  size?: number;
};

/** User avatar with automatic initials fallback. */
export function Avatar({ name, image, size = 32 }: Props) {
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      aria-hidden
      className="fdy-mono flex items-center justify-center rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: "rgba(232,163,61,0.14)",
        color: "#E8A33D",
      }}
    >
      {initials || "?"}
    </div>
  );
}
