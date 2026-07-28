---
name: Mobile dependency installation
description: Expo dependency installation may be blocked by the workspace package firewall before native verification can run.
---

Expo’s dependency tree can include transitive packages rejected by the workspace package firewall. When that happens, do not bypass the firewall; keep the package manifest and source ready, identify the blocked dependency, and retry only after selecting a permitted compatible version or alternative.

**Why:** Native dependency installation is security-policy controlled, so a failed install is an environment constraint rather than evidence that the application source is invalid.

**How to apply:** Check the install output for the blocked package, prefer the latest safe direct dependency or a maintained alternative, and clearly separate source validation from native build verification.