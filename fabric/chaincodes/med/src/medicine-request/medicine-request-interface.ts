import { Context } from 'fabric-contract-api';
import { ChaincodeResponse } from 'fabric-shim';
import { MedicineRequestStatusEnum } from '../utils/enums';
import { IMedicineRequestQuery } from './medicine-request-query';

export interface IMedicineRequestService {
    addMedicineRequest(ctx: Context, medRequestJson: string): Promise<ChaincodeResponse>;

    approveMedicinePendingRequest(ctx: Context, medReqApproveStr: string): Promise<ChaincodeResponse>;

    rejectMedicinePendingRequest(ctx: Context, medReqRejectStr: string): Promise<ChaincodeResponse>;

    queryMedicineRequest(ctx: Context, key: string, status: MedicineRequestStatusEnum): Promise<ChaincodeResponse>;

    queryMedicineRequestsWithPagination(
        ctx: Context,
        queryParams: IMedicineRequestQuery,
        pageSize: number,
        bookmark?: string): Promise<ChaincodeResponse>;

}
