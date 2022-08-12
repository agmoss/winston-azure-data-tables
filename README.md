# `winston-azure-data-tables`

> An Azure Table storage transport for winston3

[![NPM](https://img.shields.io/npm/v/winston-azure-data-tables?style=for-the-badge)](https://www.npmjs.com/package/winston-azure-data-tables)

## Highlights

-   :heavy_check_mark: **Simple API** - Easy to use API with sensible defaults
-   :large_blue_circle: **Typescript ready**
-   :cloud: **Modern** - Uses the new [`@azure/data-tables`](https://www.npmjs.com/package/@azure/data-tables) SDK

## Installation

```bash
yarn install winston
yarn install winston-azure-data-tables
```

## Usage

```typescript
import * as winston from "winston";
import { winstonAzureDataTables, extensions } from "winston-azure-blob";

const logger = winston.createLogger({
  format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.splat(),
      winston.format.json()
  ),
  transports: [
    winstonAzureDataTables({
      account: {
        name: "Azure storage account sub domain ([A-Za-z0-9])",
        key: "The long Azure storage secret key"
      },
      tableName: "the name of the table",
      tablesUrl: "The URL of the service account that is the target of the desired operation"
      partitionKey: "The partition key of the entity",
      rowKeyStrategy: () => new Date().toISOString(), // Thunk for generating the row key of the entity
    })
  ]
});

logger.warn("Hello!");
```

## API

-   **account** Azure storage account credentials
    -   **account.name:** The name of the Windows Azure storage account to use
    -   **account.key:** The access key used to authenticate into this storage account
-   **tableName:** The name of the table
-   **tablesUrl:** The URL of the service account that is the target of the desired operation, such as "https://myaccount.table.core.windows.net".
-   **partitionKey:** The partition key of the entity
-   **rowKeyStrategy:** Thunk for generating the row key of the entity
