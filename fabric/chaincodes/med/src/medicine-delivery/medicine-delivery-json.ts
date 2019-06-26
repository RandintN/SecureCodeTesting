import {IDeliveryConsumerId} from './delivery-consumer-id-json';
import {IDeliveryConsumerPhone} from './delivery-consumer-phone-json';

export interface IMedicineDeliveryJson{
    offer_id: string;
    consumer_id: IDeliveryConsumerId;
    consumer_name : string;
    notes: string;
    consumer_phone: IDeliveryConsumerPhone;
    withdrawal_date: string;

}
