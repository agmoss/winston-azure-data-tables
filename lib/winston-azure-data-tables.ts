import Transport from "winston-transport";
import Debug from "debug";
import {
    AzureNamedKeyCredential,
    TableClient,
    TableEntity,
} from "@azure/data-tables";
import { LogEntry } from "winston";

const debug = Debug("winston-azure-data-tables");

/**
 * Azure storage account credential variants
 * TODO: Support other credential options
 */
type Account = { name: string; key: string };

interface IWinstonAzureDataTables {
    account: Account;
    azTableClient: TableClient;
    tableName: string;
    tablesUrl: string;
    partitionKey: string;
    rowKeyStrategy: () => string; // TODO: Default this to date string or something like that
}

export class WinstonAzureDataTables
    extends Transport
    implements IWinstonAzureDataTables
{
    account!: {
        key: string;
        name: string;
    };

    azTableClient: TableClient;
    tableName: string;
    tablesUrl: string;
    partitionKey: string;
    rowKeyStrategy: () => string;

    constructor(
        opts: Transport.TransportStreamOptions &
            Pick<
                IWinstonAzureDataTables,
                | "account"
                | "tableName"
                | "tablesUrl"
                | "partitionKey"
                | "rowKeyStrategy"
            >
    ) {
        super(opts);
        this.azTableClient = WinstonAzureDataTables.createAzTableClient(
            opts.account,
            opts.tableName,
            opts.tablesUrl
        );
        this.tableName = opts.tableName;
        this.tablesUrl = opts.tablesUrl;
        this.partitionKey = opts.partitionKey;
        this.rowKeyStrategy = opts.rowKeyStrategy;
    }

    static createAzTableClient = (
        accountInfo: Account,
        tableName: string,
        tablesUrl: string
    ) => {
        return new TableClient(
            tablesUrl,
            tableName,
            new AzureNamedKeyCredential(accountInfo.name, accountInfo.key)
        );
    };

    /**
     * EDM's cannot be objects
     */
    static serializeValues = (info: LogEntry): LogEntry => {
        Object.keys(info).forEach((key) => {
            if (typeof info[key] === "object") {
                info[key] = JSON.stringify(info[key]);
            }
        });

        return info;
    };

    override log = async (info: LogEntry, next: () => void) => {
        debug(info);

        WinstonAzureDataTables.serializeValues(info);

        const entity: TableEntity<LogEntry> = {
            ...info,
            createdAt: new Date(),
            partitionKey: this.partitionKey,
            rowKey: this.rowKeyStrategy(),
            // TODO: Add API for additional metadata
        };

        try {
            await this.azTableClient.createEntity(entity);
        } catch (e) {
            debug(e);
        } finally {
            next();
        }
    };
}

export const winstonAzureDataTables = (
    opts: ConstructorParameters<typeof WinstonAzureDataTables>[0]
) => new WinstonAzureDataTables(opts);
