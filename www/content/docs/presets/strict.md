---
title: strict
summary: The strict seolint preset turns every rule that defaults to a warning into an error, for sites that must pass every check.
---

Every rule that defaults to `warn` becomes an error. Use it when the site must pass every check, such as in CI for a new site.

The preset sets these rules to `"error"`:

<bongo:presetrules preset="strict" />

Your config can still turn any of these rules off, because its own settings apply after the preset.
