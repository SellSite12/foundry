import { notFound } from "next/navigation";
import { Star } from "lucide-react";

import { db } from "@/lib/db";
import { getStoreAccess } from "@/lib/seller/access";
import { PageHeader, StatCard, EmptyState } from "@/components/seller/ui";
import { ReviewsManager } from "@/components/seller/ReviewsManager";
import { QuestionsManager } from "@/components/seller/QuestionsManager";

export const metadata = { title: "Reviews" };

export default async function ReviewsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const access = await getStoreAccess(storeId, "reviews");
  if (!access) notFound();

  const [reviews, questions] = await Promise.all([
    db.review.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { product: { select: { name: true } } },
    }),
    db.productQuestion.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { product: { select: { name: true } } },
    }),
  ]);

  const published = reviews.filter((r) => r.status === "PUBLISHED");
  const avg = published.length
    ? published.reduce((s, r) => s + r.rating, 0) / published.length
    : null;

  return (
    <div>
      <PageHeader
        title="Reviews"
        description="Moderate customer reviews and reply publicly."
      />

      <div className="mb-5 grid grid-cols-3 gap-4">
        <StatCard label="Average rating" value={avg === null ? "—" : avg.toFixed(1)} />
        <StatCard label="Published" value={published.length} />
        <StatCard
          label="Awaiting moderation"
          value={reviews.filter((r) => r.status === "PENDING").length}
        />
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          icon={<Star size={20} />}
          title="No reviews yet"
          body="When customers review your products on the storefront, they land here for moderation before going live."
        />
      ) : (
        <ReviewsManager
          storeId={storeId}
          reviews={reviews.map((r) => ({
            id: r.id,
            productName: r.product.name,
            authorName: r.authorName,
            rating: r.rating,
            title: r.title,
            body: r.body,
            reply: r.reply,
            status: r.status,
            reported: Boolean(r.reportedAt),
            verified: r.verified,
            createdAt: r.createdAt.toISOString(),
          }))}
        />
      )}

      <div id="questions" className="mt-10">
        <PageHeader
          title="Questions & answers"
          description="Customer questions from product pages — answers publish to the storefront."
        />
        {questions.length === 0 ? (
          <EmptyState
            icon={<Star size={20} />}
            title="No questions yet"
            body="When shoppers ask about a product, the question appears here to answer."
          />
        ) : (
          <QuestionsManager
            storeId={storeId}
            questions={questions.map((q) => ({
              id: q.id,
              productName: q.product.name,
              authorName: q.authorName,
              question: q.question,
              answer: q.answer,
              status: q.status,
              createdAt: q.createdAt.toISOString(),
            }))}
          />
        )}
      </div>
    </div>
  );
}
