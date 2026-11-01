import Link from "next/link";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { Flash } from "@/components/admin/Flash";
import { ImageField } from "@/components/admin/ImageField";
import { PageHeader } from "@/components/admin/PageHeader";
import { fieldClass, ghostButton, labelClass, primaryButton } from "@/components/admin/styles";
import { formatDate } from "@/lib/admin/format";
import { deleteFaq, saveFaq } from "@/lib/admin/faqs";
import { deleteGalleryItem, saveGalleryItem } from "@/lib/admin/gallery";
import { deleteLogo, saveLogo } from "@/lib/admin/logos";
import { deletePost, savePost } from "@/lib/admin/posts";
import { createServerSupabase } from "@/lib/supabase/server";

const galleryCategories = ["Team Building", "Événementiel", "Communication", "Stands"];

type AdminQuery = { id?: string; ok?: string; error?: string };

export async function FaqAdminPage({ searchParams }: { searchParams: Promise<AdminQuery> }) {
  const query = await searchParams;
  const supabase = await createServerSupabase();
  const { data: rows } = supabase
    ? await supabase.from("faqs").select("id,question,answer,sort_order,published").order("sort_order", { ascending: true })
    : { data: [] };
  const editing = rows?.find((row) => row.id === query.id);

  return (
    <>
      <PageHeader
        title="FAQ"
        text="Tant qu'aucune question n'est publiée ici, l'accueil garde les questions du site. Dès la première publication, la FAQ publique suit cette liste."
      />
      <Flash ok={query.ok} error={query.error} />
      <form action={saveFaq} className="mb-8 grid gap-4 rounded-xl border border-white/10 bg-[#111111] p-5 sm:grid-cols-2 sm:p-6">
        <input type="hidden" name="id" value={editing?.id ?? ""} />
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="question">
            Question
          </label>
          <input id="question" name="question" required defaultValue={editing?.question ?? ""} className={fieldClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="answer">
            Réponse
          </label>
          <textarea id="answer" name="answer" required rows={4} defaultValue={editing?.answer ?? ""} className={fieldClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="sort_order">
            Ordre
          </label>
          <input id="sort_order" name="sort_order" type="number" min={0} defaultValue={editing?.sort_order ?? (rows?.length ?? 0) + 1} className={fieldClass} />
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm text-white/80">
          <input type="checkbox" name="published" defaultChecked={editing?.published ?? true} className="size-4 accent-[#2d66d2]" />
          Publiée
        </label>
        <div className="flex gap-3 sm:col-span-2">
          <button className={primaryButton}>{editing ? "Mettre à jour" : "Ajouter"}</button>
          {editing ? (
            <Link href="/admin/faq" className={ghostButton}>
              Annuler
            </Link>
          ) : null}
        </div>
      </form>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-[0.14em] text-white/45">
            <tr>
              <th className="px-4 py-3 font-medium">Question</th>
              <th className="px-4 py-3 font-medium">État</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-white/50">
                  Aucune question en base. L&apos;accueil utilise encore le contenu du site.
                </td>
              </tr>
            ) : (
              (rows ?? []).map((row) => (
                <tr key={row.id} className="border-b border-white/10 align-top last:border-0">
                  <td className="px-4 py-4">
                    <p className="font-medium">{row.question}</p>
                    <p className="mt-1 line-clamp-2 max-w-xl text-white/55">{row.answer}</p>
                  </td>
                  <td className="px-4 py-4 text-white/70">{row.published ? "Publiée" : "Masquée"}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/admin/faq?id=${row.id}`} className={ghostButton}>
                        Modifier
                      </Link>
                      <form action={deleteFaq}>
                        <input type="hidden" name="id" value={row.id} />
                        <ConfirmSubmit />
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export async function ReferencesAdminPage({ searchParams }: { searchParams: Promise<AdminQuery> }) {
  const query = await searchParams;
  const supabase = await createServerSupabase();
  const columns = ["id", "name", "logo_url", "sort_order", "published"].join(",") as "id,name,logo_url,sort_order,published";
  const { data: rows } = supabase
    ? await supabase.from("client_logos").select(columns).order("sort_order", { ascending: true })
    : { data: [] };
  const editing = rows?.find((row) => row.id === query.id);

  return (
    <>
      <PageHeader
        title="Références"
        text="Le bandeau de l'accueil garde les logos actuels tant que cette liste est vide. Dès qu'un logo est publié, le bandeau suit uniquement cette liste."
      />
      <Flash ok={query.ok} error={query.error} />
      <form action={saveLogo} className="mb-8 grid gap-4 rounded-xl border border-white/10 bg-[#111111] p-5 sm:grid-cols-2 sm:p-6">
        <input type="hidden" name="id" value={editing?.id ?? ""} />
        <div>
          <label className={labelClass} htmlFor="name">
            Nom
          </label>
          <input id="name" name="name" required defaultValue={editing?.name ?? ""} className={fieldClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="sort_order">
            Ordre
          </label>
          <input id="sort_order" name="sort_order" type="number" min={0} defaultValue={editing?.sort_order ?? (rows?.length ?? 0) + 1} className={fieldClass} />
        </div>
        <div className="sm:col-span-2">
          <ImageField key={editing?.id ?? "new"} name="logo_url" label="Logo" defaultValue={editing?.logo_url ?? ""} hint="Envoi : PNG, JPG ou WEBP, 5 Mo max. Un SVG du site peut être saisi par son chemin /logos/…. Fond blanc recommandé." />
        </div>
        <label className="flex items-center gap-2 text-sm text-white/80 sm:col-span-2">
          <input type="checkbox" name="published" defaultChecked={editing?.published ?? true} className="size-4 accent-[#2d66d2]" />
          Publié
        </label>
        <div className="flex gap-3 sm:col-span-2">
          <button className={primaryButton}>{editing ? "Mettre à jour" : "Ajouter"}</button>
          {editing ? (
            <Link href="/admin/references" className={ghostButton}>
              Annuler
            </Link>
          ) : null}
        </div>
      </form>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-[0.14em] text-white/45">
            <tr>
              <th className="px-4 py-3 font-medium">Logo</th>
              <th className="px-4 py-3 font-medium">État</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-white/50">
                  Aucun logo en base. Le site affiche encore les références actuelles.
                </td>
              </tr>
            ) : (
              (rows ?? []).map((row) => (
                <tr key={row.id} className="border-b border-white/10 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={row.logo_url} alt="" className="h-12 w-20 rounded bg-white object-contain p-1" />
                      <span>{row.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white/70">{row.published ? "Publié" : "Masqué"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/admin/references?id=${row.id}`} className={ghostButton}>
                        Modifier
                      </Link>
                      <form action={deleteLogo}>
                        <input type="hidden" name="id" value={row.id} />
                        <ConfirmSubmit label="Supprimer ce logo ?" />
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export async function GalerieAdminPage({ searchParams }: { searchParams: Promise<AdminQuery> }) {
  const query = await searchParams;
  const supabase = await createServerSupabase();
  const columns = ["id", "title", "alt", "image_url", "category", "ratio", "sort_order", "published"].join(",") as "id,title,alt,image_url,category,ratio,sort_order,published";
  const { data: rows } = supabase
    ? await supabase.from("gallery_items").select(columns).order("sort_order", { ascending: true })
    : { data: [] };
  const editing = rows?.find((row) => row.id === query.id);

  return (
    <>
      <PageHeader
        title="Galerie"
        text="La page Galerie garde ses photos actuelles tant que cette liste est vide. La première photo publiée remplace alors la galerie du site."
      />
      <Flash ok={query.ok} error={query.error} />
      <form action={saveGalleryItem} className="mb-8 grid gap-4 rounded-xl border border-white/10 bg-[#111111] p-5 sm:grid-cols-2 sm:p-6">
        <input type="hidden" name="id" value={editing?.id ?? ""} />
        <div>
          <label className={labelClass} htmlFor="title">
            Titre
          </label>
          <input id="title" name="title" required defaultValue={editing?.title ?? ""} className={fieldClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="category">
            Catégorie
          </label>
          <select id="category" name="category" defaultValue={editing?.category ?? galleryCategories[0]} className={fieldClass}>
            {galleryCategories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="ratio">
            Format
          </label>
          <select id="ratio" name="ratio" defaultValue={editing?.ratio ?? "landscape"} className={fieldClass}>
            <option value="landscape">Paysage</option>
            <option value="portrait">Portrait</option>
            <option value="square">Carré</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="sort_order">
            Ordre
          </label>
          <input id="sort_order" name="sort_order" type="number" min={0} defaultValue={editing?.sort_order ?? (rows?.length ?? 0) + 1} className={fieldClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="alt">
            Texte alternatif
          </label>
          <input id="alt" name="alt" defaultValue={editing?.alt ?? ""} className={fieldClass} />
        </div>
        <div className="sm:col-span-2">
          <ImageField key={editing?.id ?? "new"} name="image_url" label="Image" defaultValue={editing?.image_url ?? ""} hint="JPG, PNG ou WEBP." />
        </div>
        <label className="flex items-center gap-2 text-sm text-white/80 sm:col-span-2">
          <input type="checkbox" name="published" defaultChecked={editing?.published ?? true} className="size-4 accent-[#2d66d2]" />
          Publiée
        </label>
        <div className="flex gap-3 sm:col-span-2">
          <button className={primaryButton}>{editing ? "Mettre à jour" : "Ajouter"}</button>
          {editing ? (
            <Link href="/admin/galerie" className={ghostButton}>
              Annuler
            </Link>
          ) : null}
        </div>
      </form>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-[0.14em] text-white/45">
            <tr>
              <th className="px-4 py-3 font-medium">Photo</th>
              <th className="px-4 py-3 font-medium">Catégorie</th>
              <th className="px-4 py-3 font-medium">État</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-white/50">
                  Aucune photo en base. La galerie publique reste celle du site.
                </td>
              </tr>
            ) : (
              (rows ?? []).map((row) => (
                <tr key={row.id} className="border-b border-white/10 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={row.image_url} alt="" className="h-12 w-16 rounded object-cover" />
                      <span>{row.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white/70">{row.category}</td>
                  <td className="px-4 py-3 text-white/70">{row.published ? "Publiée" : "Masquée"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/admin/galerie?id=${row.id}`} className={ghostButton}>
                        Modifier
                      </Link>
                      <form action={deleteGalleryItem}>
                        <input type="hidden" name="id" value={row.id} />
                        <ConfirmSubmit label="Supprimer cette photo ?" />
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export async function BlogAdminPage({ searchParams }: { searchParams: Promise<AdminQuery> }) {
  const query = await searchParams;
  const supabase = await createServerSupabase();
  const { data: rows } = supabase
    ? await supabase.from("posts").select("id,title,slug,excerpt,content,cover_url,published,created_at").order("created_at", { ascending: false })
    : { data: [] };
  const editing = rows?.find((row) => row.id === query.id);

  return (
    <>
      <PageHeader title="Blog" text="Les articles publiés apparaissent sur /blog. Sans article, la page garde son message d'attente." />
      <Flash ok={query.ok} error={query.error} />
      <form action={savePost} className="mb-8 grid gap-4 rounded-xl border border-white/10 bg-[#111111] p-5 sm:p-6">
        <input type="hidden" name="id" value={editing?.id ?? ""} />
        <div>
          <label className={labelClass} htmlFor="title">
            Titre
          </label>
          <input id="title" name="title" required defaultValue={editing?.title ?? ""} className={fieldClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="slug">
            Slug
          </label>
          <input id="slug" name="slug" defaultValue={editing?.slug ?? ""} placeholder="généré depuis le titre si vide" className={fieldClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="excerpt">
            Chapô
          </label>
          <textarea id="excerpt" name="excerpt" required rows={3} defaultValue={editing?.excerpt ?? ""} className={fieldClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="content">
            Texte
          </label>
          <textarea id="content" name="content" required rows={10} defaultValue={editing?.content ?? ""} className={fieldClass} />
        </div>
        <ImageField key={editing?.id ?? "new"} name="cover_url" label="Image de couverture" defaultValue={editing?.cover_url ?? ""} hint="Optionnelle." />
        <label className="flex items-center gap-2 text-sm text-white/80">
          <input type="checkbox" name="published" defaultChecked={editing?.published ?? false} className="size-4 accent-[#2d66d2]" />
          Publié
        </label>
        <div className="flex gap-3">
          <button className={primaryButton}>{editing ? "Mettre à jour" : "Enregistrer"}</button>
          {editing ? (
            <Link href="/admin/blog" className={ghostButton}>
              Annuler
            </Link>
          ) : null}
        </div>
      </form>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-[0.14em] text-white/45">
            <tr>
              <th className="px-4 py-3 font-medium">Article</th>
              <th className="px-4 py-3 font-medium">État</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-white/50">
                  Aucun article.
                </td>
              </tr>
            ) : (
              (rows ?? []).map((row) => (
                <tr key={row.id} className="border-b border-white/10 align-top last:border-0">
                  <td className="px-4 py-4">
                    <p className="font-medium">{row.title}</p>
                    <p className="text-xs text-white/40">/blog/{row.slug}</p>
                    <p className="mt-1 text-xs text-white/40">{formatDate(row.created_at)}</p>
                  </td>
                  <td className="px-4 py-4 text-white/70">{row.published ? "Publié" : "Brouillon"}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/admin/blog?id=${row.id}`} className={ghostButton}>
                        Modifier
                      </Link>
                      {row.published ? (
                        <Link href={`/blog/${row.slug}`} className={ghostButton}>
                          Voir
                        </Link>
                      ) : null}
                      <form action={deletePost}>
                        <input type="hidden" name="id" value={row.id} />
                        <ConfirmSubmit label="Supprimer cet article ?" />
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
