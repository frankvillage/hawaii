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

## Automatic publishing activation

GitHub Actions checks the published Sanity revisions at minute 17 of every
hour. The job uses the public dataset and repository variables
`SANITY_PROJECT_ID`, `SANITY_DATASET` and `SANITY_API_VERSION`; it does not need
a Sanity token, GitHub PAT or webhook credential.

The check compares Sanity with the strict public marker `menu-release.json`.
Unchanged revisions stop before dependencies, tests and build. Changed
revisions pass a current `_rev` to the immutable capture step, which fails
closed on missing configuration, network errors, invalid JSON, partial
documents or invalid schemas. Pushes and manual runs remain available for code
releases and controlled recovery.

## Identity and credential operations

La rotazione e la revoca delle credenziali seguono queste regole:

- Every property, agency and technical user has a named account. Shared
  accounts are forbidden.
- Studio access uses Google SSO. MFA is enforced in the Google Workspace
  identity policy, not left as an optional Studio preference.
- The hourly synchronization uses no long-lived CMS or webhook credential.
- Revocation removes the named user from Google/Sanity first, then revokes any
  assigned service access and reviews audit logs for recent publishes.
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

The release directory starts with a dot, so artifact upload explicitly includes
hidden files. The restore job provisions Node.js 22 and installs the locked web
dependencies before running the verifier.

## Prerequisites before activation

- Provision a CMS project with named roles and audit logs.
- Provision `admin.hawaiipescara.it`, DNS, TLS and Google SSO/MFA enforcement.
- Confirm who may publish price changes and whether Hawaii/MUULab have separate
  editorial scopes.
- Configure only the public Sanity project, dataset and API-version repository variables.
- Confirm Aruba supports a versioned release directory and atomic promotion.
- Review the final content processing and retention terms with the data
  controller before enabling the studio.
- Complete an hourly-sync test and record the first successful run ID.

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
