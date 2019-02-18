import { Context } from 'fabric-contract-api';
import { ChaincodeResponse } from 'fabric-shim';
import { Result } from '../result/result';

export interface IMedicineRequestService {
    addMedicineRequest(ctx: Context, medRequestJson: string): Promise<Result>;

    queryMedicineRequest(ctx: Context, key: string): Promise<string>;

}
