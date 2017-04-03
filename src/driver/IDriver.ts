import { DriverMessage } from './DriverMessage';
import { Observable } from 'rxjs';

export interface IDriver {
    listen() : Observable<DriverMessage>;
}