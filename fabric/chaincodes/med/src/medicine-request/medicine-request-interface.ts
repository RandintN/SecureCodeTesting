import { Context } from 'fabric-contract-api';
import { ChaincodeResponse } from 'fabric-shim';
import { IMedicineRequestApproveJson } from './medicine-request-approve-json';

export interface IMedicineRequestService {
    addMedicineRequest(ctx: Context, medRequestJson: string): Promise<ChaincodeResponse>;

    approveMedicinePendingRequest(ctx: Context, medReqApproveStr: string): Promise<ChaincodeResponse>;

    queryMedicineRequest(ctx: Context, key: string): Promise<string>;

}
