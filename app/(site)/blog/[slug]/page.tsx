import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { blogPostingJsonLd, breadcrumbJsonLd, clampDescription, jsonLdString, pageMetadata } from "@/lib/seo";
import { Section } from "@/components/ui/Section";
import { SmartLink } from "@/components/ui/SmartLink";
import { formatDate } from "@/lib/admin/format";
import { getPublishedPost, getPublishedPosts } from "@/lib/public-data";

type BlogParams = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  if (posts.length === 0) return [{ slug: "apercu" }];
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: BlogParams }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedPost(slug);
  if (!article) return {};
  return pageMetadata({
    title: article.title,
    description: article.excerpt,
    path: `/blog/${article.slug}`,
    image: article.cover_url || undefined,
  });
}

export default function BlogArticlePage({ params }: { params: BlogParams }) {
  return <Suspense fallback={<div aria-hidden="true" className="min-h-[70svh]" />}>
    <Article params={params} />
  </Suspense>;
}

/** Liens internes du texte : [libellé](/chemin). Les adresses externes restent du texte. */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\(\/[^)\s]*\))/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[([^\]]+)\]\((\/[^)\s]*)\)$/);
    if (!match) return part;
    return (
      <SmartLink key={i} href={match[2]} className="text-accent-text underline decoration-accent/40 underline-offset-4 hover:decoration-accent">
        {match[1]}
      </SmartLink>
    );
  });
}

/** Texte saisi dans l'admin : blocs séparés par une ligne vide, « ## » pour un sous-titre, « - » pour une liste. */
function ArticleBody({ content }: { content: string }) {
  const blocks = content.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  return (
    <div className="mt-10 text-base leading-relaxed text-fg">
      {blocks.map((block, i) => {
        if (block.startsWith("## ")) {
          return (
            <h2 key={i} className="mt-12 font-display text-2xl font-bold text-fg first:mt-0 sm:text-3xl">
              {block.slice(3)}
            </h2>
          );
        }
        const lines = block.split("\n");
        if (lines.every((line) => line.startsWith("- "))) {
          return (
            <ul key={i} className="mt-4 space-y-2 pl-5">
              {lines.map((line) => (
                <li key={line} className="list-disc marker:text-accent">
                  <Inline text={line.slice(2)} />
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="mt-4 whitespace-pre-wrap">
            <Inline text={block} />
          </p>
        );
      })}
    </div>
  );
}

async function Article({ params }: { params: BlogParams }) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) notFound();

  const path = `/blog/${post.slug}`;
  const structuredData = [
    blogPostingJsonLd({
      title: post.title,
      description: clampDescription(post.excerpt),
      path,
      image: post.cover_url,
      published: post.created_at,
    }),
    breadcrumbJsonLd([
      { name: "Accueil", path: "/" },
      { name: "Blog", path: "/blog" },
      { name: post.title, path },
    ]),
  ];

  return (
    <Section className="pt-36 sm:pt-40 lg:pt-44" labelledBy="article-title">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(structuredData) }} />
      <article className="mx-auto max-w-3xl">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">{formatDate(post.created_at)}</p>
        <h1 id="article-title" className="mt-4 font-display text-4xl font-bold text-fg sm:text-5xl">
          {post.title}
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted">{post.excerpt}</p>
        {post.cover_url ? (
          <img src={post.cover_url} alt={post.title} className="mt-8 aspect-[16/9] w-full rounded-[20px] object-cover" />
        ) : null}
        <ArticleBody content={post.content} />
        <SmartLink href="/blog" className="mt-12 inline-block text-sm text-accent-text">
          Retour au blog
        </SmartLink>
      </article>
    </Section>
  );
}
