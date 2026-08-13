# Contributing

Bug reports and focused pull requests are welcome. Please avoid including API keys, personal data, webhook secrets, or unredacted production payloads in issues and tests.

Before opening a pull request:

```bash
npm ci
npm run typecheck
npm test
npm pack --dry-run
```

Public API changes should include types, tests, README updates, and a changelog entry.
