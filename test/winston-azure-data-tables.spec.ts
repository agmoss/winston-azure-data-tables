import "jest";
import { winstonAzureDataTables } from "../lib";
import winston from "winston";
// import { odata } from "@azure/data-tables";

describe("winston-azure-data-tables", () => {
    const strategy = () => new Date().toDateString();
    const transport = winstonAzureDataTables({
        account: {
            key: process.env.ACCOUNT_KEY || "",
            name: process.env.ACCOUNT_NAME || "",
        },
        tableName: process.env.TABLE_NAME || "",
        tablesUrl: process.env.TABLES_URL || "",
        partitionKey: "1",
        rowKeyStrategy: strategy,
    });

    beforeAll(async () => {
        await transport.azTableClient.createTable();
    });

    afterAll(async () => {
        await transport.azTableClient.deleteTable();
    });

    it("name and key options", () => {
        const azBlob = winstonAzureDataTables({
            account: {
                name: process.env.ACCOUNT_NAME || "",
                key: process.env.ACCOUNT_KEY || "",
            },
            tableName: process.env.TABLE_NAME || "",
            tablesUrl: process.env.TABLES_URL || "",
            partitionKey: "1",
            rowKeyStrategy: () => new Date().toISOString(),
        });
        expect(azBlob.tableName).toBe(process.env.TABLE_NAME);
    });

    it("sends logs", async () => {
        const contents = { something: "anything" };

        const logger = winston.createLogger({
            transports: [transport],
        });

        logger.info(contents);

        const f = await transport.azTableClient.getEntity(
            transport.partitionKey,
            strategy()
        );

        expect(f.message).toBe(JSON.stringify(contents));
    });
});
