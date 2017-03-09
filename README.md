[![Build Status](https://travis-ci.org/ProtaconSolutions/Node-NFC-Reader.svg?branch=master)](https://travis-ci.org/ProtaconSolutions/Node-NFC-Reader)

# NFC-Reader
Nodejs driver package for ACR1222L NFC reader.

## Common application flow
 1. Start application and init device.
 2. Reader polls for tags continously.
 3. Once tag is detected, its ATR will be sent to PC.
 4. Connect ARCx PICC with T1 protocol.
 5. Access PICC by exchangin APDU:s.

## Terminology
| Term |  |
| :- | :- |
| PICC | Proximity inductive coupling card: a transponder that can be read or written by a proximity reader. Theses tags are based on the ISO14443 standard. Such tags do not have a power supply like a battery, but are powered by the electromagnetic field of the reader (PCD) |
| NFC      | Near-field communication (NFC) is a set of communication protocols that enable two electronic devices, one of which is usually a portable device such as a smartphone, to establish communication by bringing them within 4 cm (1.6 in) of each other. |
| ATR | An Answer To Reset (ATR) is a message output by a contact Smart Card conforming to ISO/IEC 7816 standards, following electrical reset of the card's chip by a card reader. The ATR conveys information about the communication parameters proposed by the card, and the card's nature and state. |
| APDU | In the context of smart cards, an application protocol data unit (APDU) is the communication unit between a smart card reader and a smart card.| 

## Windows specific
### pcsclite
``` 
npm install --global --production windows-build-tools
npm config set msvs_version 2015 --global
```