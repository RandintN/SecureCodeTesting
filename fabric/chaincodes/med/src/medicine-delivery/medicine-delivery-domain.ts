import { Context } from 'fabric-contract-api';
import { IMedicineRequestJson } from '../medicine-request/medicine-request-json';
import { MedicineRequestStatusEnum} from '../utils/enums';
import { ChaincodeResponse } from 'fabric-shim';
import { ResponseUtil } from '../result/response-util';

export class MedicineDeliveryDomain {

    public async medicineDeliveryConfirmation(ctx: Context, key: string): Promise<ChaincodeResponse>  {

        try {
            let requestAsByte = null;
            requestAsByte = await ctx.stub.getState(key);

            const medicineRequest = (JSON.parse(requestAsByte.toString()) as IMedicineRequestJson);            
            medicineRequest.status = MedicineRequestStatusEnum.MEDICATION_DELIVERED;            
            const result = await ctx.stub.putState(key, Buffer.from(JSON.stringify(medicineRequest)));
            
            return ResponseUtil.ResponseOk(Buffer.from(JSON.stringify(result)));
    
        } catch (error) {
            console.log(error);
            return ResponseUtil.ResponseError(error.toString(), undefined);
        }
    }
}