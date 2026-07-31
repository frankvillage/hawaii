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

The Studio exposes one document for Hawaii and one for MUULab. Editors reorder categories and dishes with the standard Studio controls. Each dish provides:

- Name, required.
- Optional price and optional note.
- Availability toggle, enabled by default. Unavailable dishes are excluded from the public build but preserved in the Studio record.
- Optional checkbox list of the official allergen codes `1`–`14`; no free-text allergen field is allowed.

Studio Publish is immediate: an editor with publishing permission makes the revision live in the CMS at once. A Sanity webhook requests the existing GitHub Pages workflow. The release remains static, so the visible website updates after the verified build and deploy completes rather than through an unreviewed client-side request.

## Data Flow

1. A named Studio user publishes a `menu` document.
2. Sanity sends a signed webhook to GitHub's `repository_dispatch` endpoint with event type `sanity-menu-published`.
3. The Pages workflow starts on the release branch, reads a least-privilege Sanity token from GitHub Actions secrets and builds the site.
4. The web app queries only the two approved `menu` documents, validates their complete structure with Zod and filters dishes marked unavailable.
5. Any missing configuration, fetch failure or invalid response makes the build use the existing committed menu data and emits a build warning; the public page never renders partial CMS data.
6. Existing build, lint, static and browser checks run before Pages deploys the artifact.

## Security and Roles

- Studio users are named Sanity accounts with Google SSO and MFA, configured in the Sanity project rather than in the repository.
- The web build receives only `SANITY_PROJECT_ID`, `SANITY_DATASET` and a read-only `SANITY_API_TOKEN` through environment variables. The token is not prefixed `NEXT_PUBLIC_` and is never sent to browsers.
- The webhook bearer token is a separate fine-grained GitHub token, scoped only to dispatch this repository workflow. It is stored in Sanity's webhook configuration, never in source control.
- The client accepts only menu IDs `menu-hawaii` and `menu-muulab`, fixed menu identifiers, image paths already owned by the project, and allergen values `1`–`14`.

## Reversibility

CMS loading is opt-in: without all required server-side configuration the current hard-coded menu remains the source of truth. Each CMS publication is represented by a GitHub Actions run and static artifact. Reverting is performed by redeploying a previous verified workflow artifact or republishing a previous Studio document version.

## Activation Checklist

- Create the Sanity project and private production dataset.
- Set `SANITY_PROJECT_ID`, `SANITY_DATASET` and a read-only `SANITY_API_TOKEN` in GitHub Actions secrets and the secured build environment.
- Deploy the Studio to `admin.hawaiipescara.it`, enable Google SSO/MFA, and invite named Hawaii and agency users with Publisher access.
- Import the generated initial menu seed.
- Create the signed Sanity webhook for `sanity-menu-published` using a GitHub fine-grained dispatch-only token.
- Publish a non-production test edit, verify the Pages workflow and visual output, then revoke any bootstrap credentials.
