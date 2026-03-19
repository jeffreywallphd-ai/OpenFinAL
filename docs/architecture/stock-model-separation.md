# Stock model separation pattern

This refactor isolates one stock vertical slice so the stock lookup and stock quote flows do not force the rest of the application to reason about the same object as a request envelope, a domain entity, and a UI response.

## Layers in the refactored slice

### 1. JSON transport / serialization models
Transport models keep the renderer-facing JSON envelope in one place.

- `open-fin-al/src/Gateway/Transport/StockTransport.ts`
- Responsible for:
  - parsing `request.stock` payloads out of `IRequestModel`
  - creating request models for the UI (`createStockLookupRequestModel`, `createStockQuoteRequestModel`)
  - serializing lookup and quote results back into the existing UI response shape

### 2. Use-case DTOs
Use-case DTOs are small application-layer contracts that describe what the interactor needs and returns for a specific use case.

- `open-fin-al/src/application/stock/StockUseCaseDtos.ts`
- Added DTOs for:
  - `StockLookupInputDto`
  - `StockLookupResultDto`
  - `StockQuoteInputDto`
  - `StockQuoteResultDto`

These DTOs deliberately avoid the generic `request.request.stock` envelope and avoid entity-specific mutation APIs.

### 3. Domain entities
Domain entities now represent stock concepts instead of transport payloads.

- `open-fin-al/src/Entity/Stock/StockSearchCriteria.ts`
- `open-fin-al/src/Entity/Stock/StockTimeSeries.ts`
- Existing `Asset` continues to represent stock lookup matches from SQLite and provider lookup results.

The new entities are populated through mappers instead of calling `fillWithRequest()` from the interactor. That keeps transport concerns out of the entity layer for the refactored use cases.

### 4. Interactor orchestration
`open-fin-al/src/Interactor/StockInteractor.ts` now does three distinct things for the refactored paths:

1. parse the transport model
2. map transport -> use-case DTO -> domain entity
3. call the gateway, then map domain entity -> use-case DTO -> transport response

The quote path now also uses the dedicated quote gateway factory directly instead of leaking through the generic stock gateway path.

## Why this is better

Before this change, `StockRequest` was doing too much:

- request parsing
- acting like a domain object
- acting like a provider response container
- indirectly defining UI response shape

After this change, lookup and quote each have a clearer pipeline:

```text
JSON request envelope
  -> transport parser
  -> use-case input DTO
  -> domain entity
  -> gateway
  -> domain entity
  -> use-case output DTO
  -> transport serializer
  -> existing UI JSON shape
```

## Compatibility notes

The UI still receives the same top-level shape:

- `response.ok`
- `response.status`
- `response.results`
- top-level `source`

Lookup results continue to expose alias fields used by existing components:

- `symbol`
- `ticker`
- `name`
- `companyName`
- `cik`

Quote results continue to expose:

- `ticker`
- `quotePrice`
- `date`
- `startDate`
- `endDate`
- `data`

## Applying the same pattern later

The same separation can be repeated for other slices:

### Portfolios
- Transport: portfolio request envelopes and IPC payloads
- Input DTOs: create portfolio, list portfolios, portfolio summary inputs
- Domain entities: `Portfolio`, `AssetAllocation`, `Holding`
- Output DTOs: portfolio summary cards, holdings tables, rebalance previews

### News
- Transport: article search/filter payloads
- Input DTOs: query, ticker filter, pagination, summarization options
- Domain entities: article, article collection, topic tags
- Output DTOs: listing rows, article detail, AI summary payload

### Settings
- Transport: settings form payloads and IPC config payloads
- Input DTOs: update provider settings, rotate keys, toggle features
- Domain entities: configuration sections and provider preferences
- Output DTOs: settings screen view models and validation results

### SEC / fundamentals
- Transport: SEC endpoint payloads and provider-specific request shapes
- Input DTOs: overview, balance sheet, filing lookup inputs
- Domain entities: filing metadata, ratio snapshot, reporting period
- Output DTOs: overview cards, comparison tables, chart-ready series

## Migration guideline

For future slices, keep the transition incremental:

1. pick one use case
2. define transport model helpers
3. define input/output DTOs
4. introduce or reuse domain entities that are not transport-shaped
5. add mappers in both directions
6. preserve the existing UI response contract until the UI is ready for a cleaner contract

That approach keeps the refactor low-risk while steadily reducing envelope leakage across the codebase.
