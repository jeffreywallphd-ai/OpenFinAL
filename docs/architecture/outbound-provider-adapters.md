# Outbound Provider Adapters

## Why this exists

OpenFinAL historically exposed a generic local `/proxy` endpoint from the Electron main process. Renderer code could send an arbitrary URL, headers, and request details through that proxy. That was convenient, but it created a broad trust boundary:

- renderer code could request nearly any destination;
- transport details and provider rules were mixed together in UI-facing gateways; and
- certificate pinning behavior lived in the generic proxy instead of the provider integrations that actually need it.

This document defines the first-stage migration toward named outbound provider adapters.

## Target pattern

Renderer code should call provider-named bridges such as:

- `window.outbound.alphaVantage.marketStatus(apiKey)`
- `window.outbound.sec.fetchJson(url, headers)`
- `window.outbound.sec.companyTickers(headers)`

Those preload bridges invoke IPC handlers in the main process. The main process then delegates to provider adapters under:

- `src/main/services/outbound/providers/alphaVantageAdapter.js`
- `src/main/services/outbound/providers/secAdapter.js`

Each adapter owns:

- the allowlisted destination(s);
- request construction;
- provider-specific authentication/header handling;
- provider-specific validation behavior such as SEC certificate fingerprint checks; and
- normalization points for future retries, telemetry, rate limiting, or caching.

## Scoped migration in this change

This first stage migrates a small but meaningful subset:

1. **Market data provider:** Alpha Vantage market status.
2. **Certificate-aware provider:** SEC JSON requests for `data.sec.gov` and `www.sec.gov`.

Updated callers now use provider adapters for:

- `AlphaVantageMarketGateway`
- `SecAPIGateway`
- SEC company ticker refreshes inside the SQLite asset/company lookup caches

## Extension pattern for future providers

When migrating another outbound integration:

1. Create a provider adapter in `src/main/services/outbound/providers/`.
2. Expose only the minimal provider operations needed through IPC contracts.
3. Register those operations in `registerOutboundHandlers.js`.
4. Add a preload bridge under `window.outbound`.
5. Update renderer/data-gateway callers to use the named provider method instead of `/proxy`.
6. Add focused tests for the adapter and IPC registration.

Keep provider adapters narrow and explicit. Prefer methods like `fetchQuote`, `fetchNews`, or `companyFacts` over passing arbitrary HTTP request shapes from the renderer.

## Generic proxy deprecation strategy

The generic `/proxy` route remains temporarily for compatibility with existing integrations that are not yet migrated. It is now **deprecated** and should not receive new feature work.

Current compatibility behavior:

- `/proxy` still exists so legacy callers keep working.
- The route now emits a deprecation warning header and logs a one-time warning in the main process.

Migration strategy:

1. Migrate existing renderer callers provider-by-provider.
2. Avoid adding any new renderer dependency on `window.exApi.fetch`.
3. Move certificate validation into provider adapters as those providers migrate.
4. Once all renderer callers are migrated, remove `/proxy` and the preload `exApi.fetch` bridge.

## What still uses the generic proxy after this change

The following renderer paths still depend on `window.exApi.fetch` and therefore still route through the generic proxy:

- OpenAI model requests in `src/Gateway/AI/Model/OpenAIModelGateway.ts`
- Alpha Vantage stock, ratio, economic indicator, and news gateways
- Wikipedia S&P 500 refresh lookups in the SQLite cache refresh flows

These are the next candidates for migration.
