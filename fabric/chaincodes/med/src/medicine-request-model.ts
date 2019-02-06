import { IExchange } from './exchange';
import { IMedicine } from './medicine';

export interface IMedRequest {
    org_id: string;
    amount: number;
    medicine: IMedicine;
    type: string[];
    return_date: string;
    exchange: IExchange[];
}
