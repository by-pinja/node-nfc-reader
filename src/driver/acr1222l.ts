import { IDriver } from './IDriver';
import * as pcsc from 'pcsclite';
import { Subject, Observable } from 'rxjs';
import { DriverMessage } from './DriverMessage';
import { ILogger } from './ILogger';

export class Acr1222l implements IDriver {
  private subject: Subject<DriverMessage> = new Subject<DriverMessage>();
  private pcsc: any;
  private readerName: string = "TODO";
  private reader: any;

  constructor(private logger?: ILogger) {
    this.pcsc = pcsc();

    if (this.logger == null) {
      this.logger = {
        error: (e) => console.error(e),
        log: (s) => console.log(s)
      }
    }

    this.pcsc.on('reader', (reader) => {
      this.logger.log(`New reader detected ${reader.name}`);

      if (reader.name !== this.readerName) {
        this.logger.log(`${reader.name} doesn't match defined name ${this.readerName}, ignoring`);
        return;
      }

      this.subject.next(new DriverMessage("READER_CONNECTED", {}))
      this.reader = reader;

      reader.on('error', (err) => this.onError(err));
      reader.on('status', (status) => this.onStatus(status));
      reader.on('end', () => this.onEnd());
    });

    this.pcsc.on('error', (err) => this.onError(err));
  }

  private onStatus(status: any) {
    this.logger.log(`Status ('${this.readerName}'): , ${status}`);

    /* check what has changed */
    let changes = this.pcsc.state ^ status.state;
    if (changes) {
      if ((changes & this.pcsc.SCARD_STATE_EMPTY) && (status.state & this.pcsc.SCARD_STATE_EMPTY)) {
        this.logger.log('card removed');

        this.subject.next(new DriverMessage("TAG_REMOVED", {}));

        this.disconnectCard();
      } else if ((changes & this.pcsc.SCARD_STATE_PRESENT) && (status.state & this.pcsc.SCARD_STATE_PRESENT)) {
        console.log('card inserted');/* card inserted */

        this.subject.next(new DriverMessage("TAG_INSERTED", {}))

        this.reader.connect({ share_mode: this.pcsc.SCARD_SHARE_SHARED }, (err, protocol) => {
          if (err) {
            console.log(err);
          } else {
            console.log('Protocol(', this.reader.name, '):', protocol);
            this.readUid(err, protocol);
          }
        });
      }
    }
  }

  private readUid(err: any, protocol: any) {
    this.reader.transmit(new Buffer([0xFF, 0xCA, 0x00, 0x00, 0x00]), 20, protocol, (err, data) => {
      if (err) {
        this.logger.error(`ERROR reading UID: ${err}`)
      } else {
        this.logger.error(`UID: ${data.toJSON()}`)

        let uid = '';

        for (const value of data) {
          uid += '|' + value;
        }

        this.subject.next(new DriverMessage('TAG_UID', uid));
      }
    });
  }

  private disconnectCard() {
    this.reader.disconnect(this.pcsc.SCARD_LEAVE_CARD, (err) => {
      if (err) {
        this.logger.error(err);
      } else {
        this.logger.log('disconnected card');
      }
    });
  }

  private onEnd(): void {
    this.logger.log(`Reader ${this.readerName} removed`);
    this.subject.next(new DriverMessage("READER_DISCONNECTED", {}))
  }

  private onError(err: any): void {
    this.logger.error(`reader/pcsc error: ${err.message}`);
    this.subject.error(err);
  }

  listen(): Observable<DriverMessage> {
    return this.subject;
  }
}