export default function SellerLoading() {
  return (
    <div>
      <div className="fdy-skeleton mb-6 h-8 w-56" />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="fdy-skeleton h-24" />
        ))}
      </div>
      <div className="fdy-skeleton mb-4 h-64" />
      <div className="fdy-skeleton h-40" />
    </div>
  );
}
