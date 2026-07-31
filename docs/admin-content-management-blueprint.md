# Menu administration blueprint

## Purpose

The property, the Hawaii agency and the technical owner need independent,
named access to update menu content without accessing the public website files
or Aruba credentials.

## Recommended boundary

- `www.hawaiipescara.it` stays a static public website.
- `admin.hawaiipescara.it` hosts a managed content studio, separate from the
  public site and protected by Google SSO with MFA.
- The studio stores structured menu records. It never edits TypeScript source,
  templates, booking links or deployment configuration.
- A verified content revision produces an immutable static build artifact.
  Aruba receives only that artifact through a protected CI release step.

## Named roles

- **Property editor/publisher:** Hawaii and MUULab menu names, descriptions,
  prices, availability and display order.
- **Hawaii agency editor/reviewer:** the same content fields, with a review
  step before a production promotion.
- **Technical administrator:** identity setup, schemas, deployment approval,
  rollback and access revocation. This role is separate from editorial users.

Accounts must be named and never shared. Aruba, GitHub and CMS credentials are
not available to property or agency editor roles.

## Content scope

Editors may change only structured values:

- venue, category, dish name, note, price, availability and order;
- approved PDF link selected from an allowlist;
- approved image reference selected from an allowlist.

Editors may not change anchors, HTML, arbitrary URLs, JavaScript, media uploads,
booking destinations, site navigation or SEO infrastructure. These fields stay
code-owned to protect page layout, accessibility and links.

## Publishing flow

1. An editor signs in with Google and creates a content revision.
2. The studio validates required fields, price format, duplicate categories and
   allowed references before it can be submitted.
3. A reviewer checks the generated preview on desktop and mobile.
4. CI fetches the exact approved revision with a read-only server token, runs
   schema validation and writes the immutable menu snapshot.
5. CI writes a private snapshot containing `_rev` and `_updatedAt` for both
   fixed documents. The static build receives only its server-side
   `MENU_CMS_SNAPSHOT_PATH` and therefore cannot perform a second Sanity fetch.
   After lint and tests, CI signs snapshot and static export with SHA-256 in a
   manifest tied to workflow, branch, run and Git SHA.
6. GitHub Pages receives that exact verified export. An authorised technical
   release can subsequently promote the same immutable artifact to Aruba.
7. The preceding artifact and the WordPress backup in `OLD` remain available
   for rollback.

## Immediate publishing activation

Immediate publishing is not active merely because the code is deployed. It
requires the following external configuration in Sanity and GitHub. Questa
configurazione esterna è un passaggio operativo obbligatorio:

1. Add these GitHub Actions secrets to the repository: `SANITY_PROJECT_ID`,
   `SANITY_DATASET`, `SANITY_API_VERSION` and a read-only
   `SANITY_API_TOKEN`. They are exposed only to the static build/snapshot step
   and never use a `NEXT_PUBLIC_` prefix.
   `MENU_CMS_SNAPSHOT_PATH` is set by CI to the captured file and is also
   server-only; it is not a repository secret and must never be prefixed with
   `NEXT_PUBLIC_`.
2. Create a repository-scoped fine-grained token for the webhook with only
   **Actions: write** and **Contents: read**. Do not grant Contents write,
   Administration, Secrets or repository-wide access.
3. Configure a Sanity webhook for published `menu` documents. It invokes the
   GitHub Actions `workflow_dispatch` endpoint with this request:

```text
POST https://api.github.com/repos/Frankvillage/hawaii/actions/workflows/deploy-pages.yml/dispatches
Accept: application/vnd.github+json
Authorization: Bearer <restricted token>
X-GitHub-Api-Version: 2022-11-28
```

Use a custom payload equivalent to:

```json
{
  "ref": "claude/codex-handoff-assets-se8fjq",
  "inputs": {
    "cms_revision": "<published document _rev>",
    "rollback_run_id": ""
  }
}
```

The revision must be the `_rev` of the document that triggered the webhook.
CI refuses the dispatch when the revision does not match either fixed
published menu document. A GitHub App installation token may replace the
fine-grained token when a trusted intermediary mints its short-lived token;
never store an App private key directly in Sanity.

## Identity and credential operations

La rotazione e la revoca delle credenziali seguono queste regole:

- Every property, agency and technical user has a named account. Shared
  accounts are forbidden.
- Studio access uses Google SSO. MFA is enforced in the Google Workspace
  identity policy, not left as an optional Studio preference.
- The Sanity build token is read-only. The webhook token can dispatch Actions
  but cannot modify repository contents.
- Rotate the webhook credential and Sanity token every 90 days and immediately
  after personnel, supplier or device changes.
- Revocation removes the named user from Google/Sanity first, then revokes any
  assigned GitHub App installation or fine-grained token and reviews audit
  logs for recent publishes.
- Store token owners, creation date, expiry and last rotation in the protected
  operational credential register. Never record secret values in this
  repository.

## Verified rollback

Start `Deploy GitHub Pages preview` manually on the same branch and set only
`rollback_run_id` to a previous successful run ID. The workflow:

1. retrieves that run from the GitHub Actions API;
2. requires `completed/success`, the same workflow path and the same branch;
3. downloads only its private `verified-menu-release` artifact;
4. compares the target run Git SHA with the manifest source commit;
5. requires document IDs `menu-hawaii` and `menu-muulab`;
6. verifies snapshot and site SHA-256 values before extracting or deploying.

An artifact from another workflow, branch, commit or with a modified
snapshot/archive is rejected. Artifact retention is 90 days; longer-term Aruba
rollback remains covered by the versioned release manifest and the WordPress
backup under `OLD`.

## Prerequisites before activation

- Provision a CMS project with named roles and audit logs.
- Provision `admin.hawaiipescara.it`, DNS, TLS and Google SSO/MFA enforcement.
- Confirm who may publish price changes and whether Hawaii/MUULab have separate
  editorial scopes.
- Create read-only CMS and deployment secrets only in GitHub Actions secrets.
- Confirm Aruba supports a versioned release directory and atomic promotion.
- Review the final content processing and retention terms with the data
  controller before enabling the studio.
- Complete a test dispatch, revoke the test credential, issue the production
  credential and record the first successful run ID.

## Reversibility

The public site remains on local menu content until an approved CMS revision is
explicitly enabled. Every release is versioned; rollback means re-promoting the
prior verified artifact, not manually editing production files.

## Initial import

Generate import-ready NDJSON without lifecycle log lines:

```bash
npm run --silent menu:seed:studio > menu-seed.ndjson
```

The exporter reads the approved local menus, performs no network request and
does not write files by itself. The redirected seed file is an operator-created
temporary artifact and must not be committed.
