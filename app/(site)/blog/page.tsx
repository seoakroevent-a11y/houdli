import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { EmptyIllustration } from "@/components/blog/EmptyIllustration";
import { SmartLink } from "@/components/ui/SmartLink";
import { getPublishedPosts } from "@/lib/public-data";
import { formatDate } from "@/lib/admin/format";

export const metadata: Metadata = pageMetadata({
  title: "Blog événementiel : conseils d'agence au Maroc",
  description:
    "Le blog Houd-Li : team building, séminaires, communication, lumière et sono, print et stands. Des conseils d'agence pour vos événements au Maroc.",
  path: "/blog",
});

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <Section className="min-h-[90svh] pt-36 sm:pt-40 lg:pt-44" labelledBy="blog-title">
      <SectionHeading
        id="blog-title"
        as="h1"
        eyebrow="Le blog Houd-Li"
        title="Idées, tendances & coulisses"
        accent="coulisses"
        text="Conseils pratiques, inspirations et retours d'expérience autour de l'événementiel corporate au Maroc."
        align="center"
      />

      {posts.length > 0 ? (
        <ul className="mx-auto mt-16 grid max-w-3xl gap-4">
          {posts.map((post) => (
            <li key={post.id}>
              <SmartLink href={`/blog/${post.slug}`} className="surface-card block overflow-hidden">
                {post.cover_url ? (
                  <img src={post.cover_url} alt="" className="aspect-[16/9] w-full object-cover" />
                ) : null}
                <div className="p-6 sm:p-8">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted">{formatDate(post.created_at)}</p>
                  <h2 className="mt-3 font-display text-2xl font-bold text-fg">{post.title}</h2>
                  <p className="mt-3 leading-relaxed text-muted">{post.excerpt}</p>
                </div>
              </SmartLink>
            </li>
          ))}
        </ul>
      ) : null}

      {posts.length === 0 ? (
      <Reveal delay={0.2} className="mx-auto mt-16 max-w-2xl">
        <div className="surface-card relative overflow-hidden px-6 py-14 text-center sm:px-12">
          <div aria-hidden="true" className="accent-glow pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 -translate-y-1/3" />
          <EmptyIllustration className="relative mx-auto h-44 w-auto sm:h-52" />
          <h2 className="relative mt-8 text-2xl font-bold text-fg sm:text-3xl">Aucun article pour le moment</h2>
          <p className="relative mx-auto mt-3 max-w-md leading-relaxed text-muted">
            Nos premiers articles sont en cours d&apos;écriture. En attendant, parlons de votre prochain événement.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Button href="/#contact">
              Nous contacter
              <ArrowRight size={16} aria-hidden="true" />
            </Button>
            <Button href="/activites" variant="outline">
              Voir les activités
            </Button>
          </div>
        </div>
      </Reveal>
      ) : null}
    </Section>
  );
}
