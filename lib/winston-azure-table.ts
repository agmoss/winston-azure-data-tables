import Transport from 'winston-transport';

interface IWinstonAzureTable {}

export class WinstonAzureTable extends Transport implements IWinstonAzureTable {
  constructor(opts: Transport.TransportStreamOptions) {
    super(opts);
  }
}
