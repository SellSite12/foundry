import { MyReviews } from "@/components/account/MyReviews";

export const metadata = { title: "My reviews" };

export default function MyReviewsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">My reviews</h1>
      <p className="mt-1 text-[13.5px] text-ink-dim">
        Every review you've written across Foundry stores. Edit or delete them from the product page.
      </p>
      <MyReviews />
    </div>
  );
}
