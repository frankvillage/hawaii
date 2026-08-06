import { getCliClient } from "sanity/cli";

async function main() {
  const client = getCliClient({ apiVersion: "2026-07-31" }).withConfig({
    perspective: "raw",
  });
  const { dataset, projectId } = client.config();

  if (projectId !== "og7dym3o" || dataset !== "production") {
    throw new Error("Snapshot interrotto: progetto o dataset Sanity non corrispondenti.");
  }

  const query =
    '*[_id in ["menu-hawaii", "menu-muulab", "drafts.menu-hawaii", "drafts.menu-muulab"]]|order(_id){_id, _rev, venue}';
  const result = await client.fetch(query);

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
