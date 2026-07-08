type Props = {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function Card({ title, description, children, className = "" }: Props) {
  return (
    <section
      className={`rounded-2xl border border-[rgba(232,163,61,0.1)] bg-[#18140F] p-6 ${className}`}
    >
      {title && (
        <h2 className="fdy-display text-[16px] font-semibold text-[#EFE9DF]">
          {title}
        </h2>
      )}
      {description && (
        <p className="mt-1 text-[13px] text-[#7A7266]">{description}</p>
      )}
      <div className={title || description ? "mt-5" : ""}>{children}</div>
    </section>
  );
}
