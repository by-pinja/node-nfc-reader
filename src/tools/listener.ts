import * as pcsc from 'pcsclite';
import { Acr1222l } from '../driver/acr1222l';

var pcsc = pcsc();

let driver = new Acr1222l();

driver.listen().subscribe(message => console.log(message));