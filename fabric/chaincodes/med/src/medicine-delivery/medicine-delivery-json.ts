import {IDeliveryConsumerId} from './delivery-consumer-id-json';
import {IDeliveryConsumerPhone} from './delivery-consumer-phone-json';
import { IMedicineProposedLedgerJson } from '../propose/medicine-proposed-ledger-json';

export interface IMedicineDeliveryJson extends IMedicineProposedLedgerJson {
    consumer_id: IDeliveryConsumerId;
    consumer_name : string;
    notes: string;
    consumer_phone: IDeliveryConsumerPhone;
    withdrawal_date: string;

}
