/**
 * Génère la base de connaissances de l'agent vocal à partir du contenu du site.
 * Usage : npx tsx scripts/agent-knowledge.ts > /tmp/houdli-agent-knowledge.md
 */
import { linaKnowledge } from "@/lib/lina";

console.log(linaKnowledge());
