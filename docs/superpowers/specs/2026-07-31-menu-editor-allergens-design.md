# Menu Editor and Allergen Publishing Design

## Goal

Allow named Hawaii and agency editors to publish menu, price, availability and allergen-code updates directly from the content Studio. A published revision must generate the next static site build automatically, with the prior verified release remaining deployable for rollback.

## Scope

- Model Hawaii and MUULab menus as structured Studio documents.
- Support category ordering, dish name, optional note, price, availability and allergen codes `1` through `14`.
- Reject malformed or duplicate allergen codes before content can be used by the public build.
- Read valid published Studio documents during static build; retain the committed menu as a safe fallback whenever the CMS is unconfigured, unavailable or returns invalid data.
- Trigger the existing Pages workflow after a Studio editor presses Publish.

## Editor Experience

The Studio exposes two fixed documents: `menu-hawaii`, which maps to the public `ristorante-mare` section, and `menu-muulab`, which maps to the public `muulab` section. The fixed IDs, public anchors, booking destinations, logos and gallery media remain code-owned. Editors reorder categories and dishes with the standard Studio controls. Each document contains ordered categories; each category has a stable `_key`, required title, optional note and ordered dishes. Each dish has its own stable `_key` and provides:

- Name, required.
- Optional price and optional note.
- Availability toggle, enabled by default. Unavailable dishes are excluded from the public build but preserved in the Studio record.
- Optional checkbox list of the official allergen codes `1`–`14`; every value is an integer in that range and each code can occur only once per dish. No free-text allergen field is allowed. The Studio list and the public-build validator import the same dependency-free menu contract, so the editorial UI cannot silently drift from the published-site rules.

Studio Publish is immediate: an editor with publishing permission makes the revision live in the CMS at once. A Sanity webhook invokes the existing GitHub Actions workflow-dispatch endpoint for the protected release branch. The release remains static, so the visible website updates after the verified build and deploy completes rather than through an unreviewed client-side request.

## Data Flow

1. A named Studio user publishes a `menu` document.
2. Sanity calls `workflow_dispatch` for `deploy-pages.yml`, passing the protected branch ref and the current CMS revision identifier.
3. The Pages workflow starts from that ref, reads a least-privilege Sanity token from GitHub Actions secrets and builds the site.
4. The web app queries only the two fixed `menu` documents and atomically validates both complete documents with Zod before filtering dishes marked unavailable.
5. Any missing configuration, fetch failure or invalid response makes the build use the existing committed menu data and emits a build warning; the public page never renders partial CMS data.
6. The artifact includes a private build manifest containing both document IDs, `_rev`, `_updatedAt` and a SHA-256 checksum of the validated menu snapshot. The same snapshot is retained as a private workflow artifact.
7. Existing build, lint, static and browser checks run before Pages deploys the artifact.

## Security and Roles

- Studio users are named Sanity accounts with Google SSO and MFA, configured in the Sanity project rather than in the repository.
- The web build receives only `SANITY_PROJECT_ID`, `SANITY_DATASET` and a read-only `SANITY_API_TOKEN` through environment variables. The token is not prefixed `NEXT_PUBLIC_` and is never sent to browsers.
- The webhook bearer token is a separate fine-grained GitHub token, scoped only to dispatch this repository workflow. It is stored in Sanity's webhook configuration, never in source control.
- The client accepts only menu IDs `menu-hawaii` and `menu-muulab`, fixed menu identifiers, image paths already owned by the project, and allergen values `1`–`14`.
- Studio validation provides editor feedback but is not trusted alone. The build rejects missing required fields, duplicate category or dish keys, malformed prices, duplicate allergen codes and any code outside `1`–`14`. A contract test requires the Studio schema and Zod parser to use the shared allergen list and price constraints.
- The Sanity webhook uses a GitHub App installation token or fine-grained token with **Actions: write** and **Contents: read** only for this one repository. It has no Contents write permission. GitHub cannot verify Sanity's origin at this endpoint, so the token is stored only in Sanity's webhook configuration, has a short expiry/rotation policy, and is revoked immediately if the webhook configuration changes unexpectedly.

## Reversibility

CMS loading is opt-in: without all required server-side configuration the current hard-coded menu remains the source of truth. Each CMS publication is represented by a GitHub Actions run, a validated menu-snapshot artifact and a static Pages artifact. Rollback means republishing the required historical Sanity document revision or deploying the corresponding retained Pages artifact; source-only workflow reruns are not presented as a content rollback because they would otherwise read the latest CMS data. A rollback input accepts only a completed successful run from this workflow and branch; before deploy, CI verifies the retained manifest document IDs, source commit and SHA-256 checksum against the downloaded snapshot.

## Activation Checklist

- Create the Sanity project and private production dataset.
- Set `SANITY_PROJECT_ID`, `SANITY_DATASET` and a read-only `SANITY_API_TOKEN` in GitHub Actions secrets and the secured build environment.
- Deploy the Studio to `admin.hawaiipescara.it`, enable Google SSO/MFA, and invite named Hawaii and agency users with Publisher access.
- Import the generated initial menu seed.
- Create the Sanity webhook for `workflow_dispatch` using a repository-scoped GitHub App or fine-grained token with Actions write and Contents read only; set expiry, rotation owner and revocation procedure.
- Publish a non-production test edit, verify the Pages workflow and visual output, then revoke any bootstrap credentials.
