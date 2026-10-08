# Contributing to AstronClaw & Loomy Tutorial

Thank you for your interest in contributing to the AstronClaw & Loomy Tutorial project! We welcome contributions from everyone.

## How to Contribute

1. Fork the repository
2. Create a new branch for your feature or bug fix (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run the checks described below
5. Commit your changes (`git commit -m 'Add some feature'`)
6. Push to the branch (`git push origin feature/my-feature`)
7. Open a Pull Request

## Testing and Validation

Use Node.js 24 and install the exact dependencies in the lockfile:

```sh
npm ci
npm test
```

`npm test` builds the production VitePress site, including the Chinese and English
pages, and checks the generated learning-assistant index. VitePress checks local
Markdown page links during the build and fails on unresolved page targets. Keep
this check enabled; fix broken links instead of setting `ignoreDeadLinks` to true.
The index check verifies the published JSON has usable entries for both languages
and matches the generated source index. These checks run for pull requests and
pushes to `main` in the **CI** workflow and before Pages deployment.

For every contribution:

- Run `npm test` and include the result in your pull request.
- For a new page, add the relevant navigation and check local links. Keep the
  Chinese and English content consistent when the change affects both languages.
- For changes to site components or scripts, add or update automated checks for
  the behavior being changed and include a regression check when fixing a bug.
- Preview visual changes with `npm run docs:dev` and check both languages.

The build checks local page targets; it does not verify heading anchors or contact
external websites. Check changed anchors and external URLs manually. It also does
not exercise live chat/API integrations; changes to those require focused tests
that mock external services and keep credentials out of fixtures and logs.

## Reporting Security Issues

Please follow [SECURITY.md](SECURITY.md) to report vulnerabilities privately.

## Contributor License Agreement (CLA)

Before we can merge your Pull Request, you must sign our Contributor License Agreement (CLA). 
When you open a Pull Request, the **CLA Assistant** bot will automatically check if you have signed the CLA.

If you haven't signed it yet, the bot will leave a comment on your Pull Request with a link to authorize via GitHub and sign the agreement on the web portal.

You only need to sign the CLA once for all your future contributions to this project.

## Code of Conduct

By participating in this project, you agree to abide by our code of conduct and treat all contributors with respect.
