# Publish

To publish a new version of the toolkit, follow these steps:

1. Check the dependencies:

```bash
bun run depcheck
```

2. Commit all changes and make sure the working directory is clean.

3. Bump the version in `package.json` with on of the following commands:

```bash
bunx npm version patch      # for bug fixes
bunx npm version minor      # for new features
bunx npm version major      # for breaking changes
```

4. Build the project:

```bash
bun run build
```

5. Log in to npm:

```bash
bunx npm login
```

This opens a browser window for authentication.

6. Publish the new version:

```bash
bun publish
```
