import { DriverMessage } from './DriverMessage';
import { Observable, Subject } from 'rx';

export interface IDriver {
    listen() : Observable<DriverMessage>;
}