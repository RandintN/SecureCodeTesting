import { Context } from 'fabric-contract-api';
import { ChaincodeResponse } from 'fabric-shim';

export interface IMedicineRequestService {
    addMedicineRequest(ctx: Context, medRequestJson: string): Promise<ChaincodeResponse>;

    approveMedicinePendingRequest(ctx: Context, medReqApproveStr: string): Promise<ChaincodeResponse>;

    rejectMedicinePendingRequest(ctx: Context, medReqRejectStr: string): Promise<ChaincodeResponse>;

    queryMedicineRequest(ctx: Context, key: string): Promise<string>;

}
