import "jest";
import { winstonAzureDataTables } from "../lib";
import winston, { format } from "winston";

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

    beforeAll(() => {
        return transport.azTableClient.createTable();
    });

    afterAll(() => {
        return transport.azTableClient.deleteTable();
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

    it("fails on invalid url", () => {
        expect(() => {
            winstonAzureDataTables({
                account: {
                    name: process.env.ACCOUNT_NAME || "",
                    key: process.env.ACCOUNT_KEY || "",
                },
                tableName: process.env.TABLE_NAME || "",
                tablesUrl: "notarealurl",
                partitionKey: "1",
                rowKeyStrategy: () => new Date().toISOString(),
            });
        }).toThrow("Invalid URL");
    });

    it("sends logs", async () => {
        const contents = { something: { obj: new Date() } };

        const logger = winston.createLogger({
            transports: [transport],
            format: format.combine(format.metadata(), format.timestamp()),
        });

        logger.info(contents);

        const f = await transport.azTableClient.getEntity(
            transport.partitionKey,
            strategy()
        );

        expect(f.message).toBe(JSON.stringify(contents));
    });

    it("fails on createEntity", async () => {
        const contents = { something: { obj: new Date() } };

        const logger = winston.createLogger({
            transports: winstonAzureDataTables({
                account: {
                    key: process.env.ACCOUNT_KEY || "",
                    name: process.env.ACCOUNT_NAME || "",
                },
                tableName: process.env.TABLE_NAME || "",
                tablesUrl: process.env.TABLES_URL || "",
                //@ts-expect-error
                partitionKey: 1,
                rowKeyStrategy: strategy,
            }),
            format: format.combine(format.metadata(), format.timestamp()),
        });

        logger.info(JSON.stringify(contents), (error) => {
            console.log(error);
            expect(error).toBeTruthy();
        });
    });
});
