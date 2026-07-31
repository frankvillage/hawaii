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
   schema validation, lint, tests and a static build.
5. CI writes a release manifest containing Git SHA, content revision and asset
   checksum.
6. An authorised technical release promotes that immutable artifact to Aruba.
7. The preceding artifact and the WordPress backup in `OLD` remain available
   for rollback.

## Prerequisites before activation

- Provision a CMS project with named roles and audit logs.
- Provision `admin.hawaiipescara.it`, DNS, TLS and Google SSO/MFA enforcement.
- Confirm who may publish price changes and whether Hawaii/MUULab have separate
  editorial scopes.
- Create read-only CMS and deployment secrets only in GitHub Actions secrets.
- Confirm Aruba supports a versioned release directory and atomic promotion.
- Review the final content processing and retention terms with the data
  controller before enabling the studio.

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
