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

    constructor(
        opts: Transport.TransportStreamOptions &
            Pick<IWinstonAzureDataTables, "account" | "tableName" | "tablesUrl">
    ) {
        super(opts);
        this.azTableClient = WinstonAzureDataTables.createAzTableClient(
            opts.account,
            opts.tableName,
            opts.tablesUrl
        );
        this.tableName = opts.tableName;
        this.tablesUrl = opts.tablesUrl;
    }

    static createAzTableClient(
        accountInfo: Account,
        tableName: string,
        tablesUrl: string
    ) {
        return new TableClient(
            tablesUrl,
            tableName,
            new AzureNamedKeyCredential(accountInfo.name, accountInfo.key)
        );
    }

    override log(info: LogEntry, next: () => void) {
        debug(info);
        const entity: TableEntity<LogEntry> = {
            level: info.level,
            message: JSON.stringify(info.message), // EDM's cannot be objects
            partitionKey: "1", // TODO: Create partition strategy
            rowKey: new Date().toISOString(), // TODO: Create row strategy
        };

        this.azTableClient
            .createEntity(entity)
            .then((resp) => {
                this.emit("logged", info);
                debug(resp);
                next();
            })
            .catch((e) => {
                this.emit("error", e);
                debug(e);
                next();
            });
    }
}

export const winstonAzureDataTables = (
    opts: ConstructorParameters<typeof WinstonAzureDataTables>[0]
) => new WinstonAzureDataTables(opts);
