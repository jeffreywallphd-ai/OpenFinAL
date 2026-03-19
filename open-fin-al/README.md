### No Warranty
This software is provided "as is" without any warranty of any kind, express or implied. This includes, but is not limited to, the warranties of merchantability, fitness for a particular purpose, and non-infringement.

### Disclaimer of Liability
The authors and copyright holders of this software disclaim all liability for any damages, including incidental, consequential, special, or indirect damages, arising from the use or inability to use this software.

## Architecture

- Architecture overview: `docs/architecture/architecture-overview.md`
- Architecture decisions: `docs/architecture/decisions/`
- Desktop build and packaging workflow: `../docs/architecture/build-and-packaging.md`
- Run `npm start` from `open-fin-al/` for the official desktop development flow.
- Run `npm run package` or `npm run make` from `open-fin-al/` for the official Electron Forge packaging flow.
- Run `npm run build:portable` only when you specifically need the Windows portable Electron Builder artifact.
- Run `npm run lint:architecture` from `open-fin-al/` to verify the currently enforced dependency boundaries.
