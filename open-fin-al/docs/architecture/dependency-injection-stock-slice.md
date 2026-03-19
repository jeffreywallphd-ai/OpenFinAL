# Dependency injection note: stock slice

## What changed

A small stock-related vertical slice now depends on application-facing service interfaces instead of reaching directly into renderer globals from business/application code.

Refactored path:

- `StockInteractor`
- `StockGatewayFactory`
- `StockQuoteGatewayFactory`
- `YFinanceStockGateway`

New application service interfaces:

- `src/application/services/IConfigService.ts`
- `src/application/services/ISecretService.ts`
- `src/application/services/IYahooFinanceClient.ts`

Default Electron adapters:

- `src/infrastructure/electron/ElectronConfigService.ts`
- `src/infrastructure/electron/ElectronSecretService.ts`
- `src/infrastructure/electron/ElectronYahooFinanceClient.ts`

## Why this reduces coupling

Previously, the stock interactor and factories directly called:

- `window.config.load()`
- `window.vault.getSecret(...)`
- `window.yahooFinance.*(...)`

That made the application layer depend on Electron preload globals, which are delivery/infrastructure concerns.

Now:

- `StockInteractor` depends on `IConfigService`
- `StockGatewayFactory` and `StockQuoteGatewayFactory` depend on `ISecretService` and `IYahooFinanceClient`
- `YFinanceStockGateway` depends on `IYahooFinanceClient`

The default constructors still wire in Electron adapters, so runtime behavior is preserved while tests can inject fakes without touching `window.*`.

## Current composition approach

This change intentionally keeps composition simple:

- production code uses default adapter instances in constructors
- tests inject fake services/factories explicitly

This is a stepping stone toward a broader composition root later.

## Remaining `window.*` coupling outside this slice

The renderer still has substantial direct preload/global coupling elsewhere, including but not limited to:

- many interactors such as `MarketStatusInteractor`, `EconomicIndicatorInteractor`, `FinancialRatioInteractor`, `NewsInteractor`, `InitializationInteractor`, and `SecInteractor`
- utility classes such as `ConfigManager`
- data gateways such as `SQLiteAssetGateway`, `SQLiteCompanyLookupGateway`, `SecAPIGateway`, and several other gateway factories
- view components that directly call `window.config`

A logical next step would be to extract the same service/adaptor pattern for:

1. config access across other interactors
2. secrets/vault access across non-stock gateways
3. database access for SQLite-backed gateways and interactors
4. view-facing application services so React components avoid direct preload access where practical
