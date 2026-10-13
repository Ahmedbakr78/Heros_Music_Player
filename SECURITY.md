# Security Policy

## Supported versions

| Version | Supported |
|---|---|
| 1.1.x (latest) | Yes |
| < 1.1 | No — please update |

## Report privately — please do not open a public issue

Open a **private security advisory** on GitHub
(Security tab → Advisories → Report a vulnerability), or email the maintainer
via the address on the [profile](https://github.com/Ahmedbakr78).

Include: extension version, browser, what you expected, what happened, and
repro steps. Screenshots help.

## What happens next

- Acknowledgement within 72 hours.
- Fix + patch release as fast as the change allows.
- Credit in the release notes if you want it (or anonymity — your call).

## Scope notes

Heros Player makes zero network calls and stores everything in
`chrome.storage.local`. The interesting attack surface is the
probe/act injection surface (what a hostile page could feed the panel) and
permission hygiene — reports there are especially welcome.
