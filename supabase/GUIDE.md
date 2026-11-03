# Premier administrateur Houdli

1. Créez un projet sur [supabase.com](https://supabase.com).
2. Dans **Project Settings → API**, copiez l’URL et la clé `anon` `public`.
3. Créez `.env.local` à la racine (voir `.env.local.example`) :

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```

   `SUPABASE_SECRET_KEY` est obligatoire en production : le formulaire de contact écrit les demandes avec cette clé, côté serveur uniquement.

4. Dans **SQL Editor**, collez et exécutez `supabase/schema.sql`.
5. Dans **Authentication → Sign In / Providers**, laissez l’e-mail activé et **décochez « Allow new users to sign up »** : les comptes se créent uniquement depuis le tableau Supabase.
6. **Authentication → Users → Add user** : e-mail + mot de passe. Cochez « Auto Confirm ». Le trigger SQL crée un profil `user`, sans accès à l’admin.
7. Donnez le rôle admin à ce compte :

```sql
insert into public.profiles (id, email, role)
select id, email, 'admin' from auth.users
where email = 'vous@houdli.ma'
on conflict (id) do update set role = 'admin';
```

8. Relancez `npm run dev`, ouvrez `http://localhost:3001/admin/login` et connectez-vous.

Le site public ne change pas tant que les listes FAQ, références et galerie sont vides : il garde le contenu actuel. La première fiche publiée dans un de ces modules remplace la liste correspondante. Les articles de blog s’ajoutent à `/blog`. Les paramètres (téléphone, WhatsApp, e-mail, réseaux, SEO, `llms.txt`) s’appliquent dès l’enregistrement.

## CRM, devis et factures

Exécutez une fois `supabase/crm-devis-factures.sql` dans **SQL Editor**. Il crée les fiches clients, l’historique des échanges, les devis, les factures et leur numérotation (`DEV-2026-001`, `FAC-2026-001`). Tout reste réservé aux comptes admin. Remplissez ensuite **Paramètres → Facturation** (raison sociale, ICE, RC, IF, RIB) : ces mentions s’impriment sur chaque document.

Pour le calendrier, exécutez ensuite `supabase/calendrier.sql`. Les relances du CRM et les échéances des devis et factures y apparaissent automatiquement.

Pour le lien de devis en ligne, exécutez `supabase/devis-en-ligne.sql`. Chaque devis reçoit un lien secret `/devis/…` : le client le consulte et l’accepte, le devis passe en « Accepté » et la fiche CRM en « Client ».

## Alertes e-mail

Créez un compte gratuit sur [resend.com](https://resend.com), puis une clé API. Dans Vercel → Settings → Environment Variables, ajoutez `RESEND_API_KEY` (la clé) et `ALERT_EMAIL` (l’adresse qui reçoit les alertes), puis redéployez. Sans domaine vérifié chez Resend, `ALERT_EMAIL` doit être l’adresse du compte Resend. Une fois `houdli.ma` vérifié, ajoutez `ALERT_FROM`, par exemple `Houdli <alertes@houdli.ma>`, pour écrire à n’importe quelle adresse.

## Agent vocal

Lina, l'agent vocal ElevenLabs, s'affiche en bas à gauche des pages publiques dès que `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` est défini (à ajouter dans Vercel, puis redéployer). Après une modification des textes du site, mettez à jour sa base de connaissances :

```
npx tsx scripts/agent-knowledge.ts > /tmp/houdli-agent-knowledge.md
node --env-file=.env.local scripts/voice-agent.mjs /tmp/houdli-agent-knowledge.md
node --env-file=.env.local scripts/voice-agent-tests.mjs
```

La clé `ELEVENLABS_API_KEY` ne sert qu'à ces scripts : inutile de l'ajouter dans Vercel.

## Alertes WhatsApp

Suivez la page « Free API WhatsApp » de [callmebot.com](https://www.callmebot.com/blog/free-api-whatsapp-messages/) : ajoutez le numéro du bot indiqué sur la page à vos contacts, envoyez-lui la phrase d’activation, il répond avec votre clé. Dans Vercel, ajoutez `WHATSAPP_PHONE` (votre numéro au format international, par exemple `+212661234567`) et `CALLMEBOT_API_KEY` (la clé), puis redéployez. Les alertes ne peuvent être envoyées qu’au numéro qui a activé la clé.
