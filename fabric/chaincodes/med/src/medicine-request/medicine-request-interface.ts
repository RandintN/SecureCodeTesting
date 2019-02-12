import { Context } from 'fabric-contract-api';

export interface IMedicineRequestService {
    addMedicineRequest(ctx: Context, medRequestJson: string): Promise<string>;

    queryMedicineRequest(ctx: Context): Promise<string>;

}
