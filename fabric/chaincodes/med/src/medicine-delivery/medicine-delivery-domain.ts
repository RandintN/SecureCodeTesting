import { Context } from 'fabric-contract-api';
import { IMedicineRequestJson } from '../medicine-request/medicine-request-json';
import { MedicineRequestStatusEnum} from '../utils/enums';
import { ChaincodeResponse } from 'fabric-shim';
import { ResponseUtil } from '../result/response-util';
import { CommonConstants } from '../utils/common-messages';
import { ValidationError } from '../validation/validation-error-model';
import { Result } from '../result/result';

export class MedicineDeliveryDomain {

    private static ERROR_MEDICINE_REQUEST_NOT_FOUND: ValidationError =
        new ValidationError('MRD-002',
            'The medicine requested was not found.');

    private static ERROR_MEDICINE_REQUEST_DELIVERED: ValidationError =
            new ValidationError('MRD-008',
            'The medicine requested is already marked as delivered.');
            

    public async medicineDeliveryConfirmation(ctx: Context, key: string): Promise<ChaincodeResponse>  {

        try {
            let requestAsByte = null;
            requestAsByte = await ctx.stub.getState(key);

            if (!requestAsByte || requestAsByte.length < 1) {
                return ResponseUtil.ResponseNotFound(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineDeliveryDomain.ERROR_MEDICINE_REQUEST_NOT_FOUND)));
            }

            const medicineRequest = (JSON.parse(requestAsByte.toString()) as IMedicineRequestJson);
            if (medicineRequest.status !=  MedicineRequestStatusEnum.MEDICATION_DELIVERED){
                medicineRequest.status = MedicineRequestStatusEnum.MEDICATION_DELIVERED;
                await ctx.stub.putState(key, Buffer.from(JSON.stringify(medicineRequest)));
                const result: Result = new Result();
                result.timestamp = new Date().getTime();
                return ResponseUtil.ResponseOk(Buffer.from(JSON.stringify(result)));
            } else {
                return ResponseUtil.ResponseNotFound(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineDeliveryDomain.ERROR_MEDICINE_REQUEST_DELIVERED)));
            }

        } catch (error) {
            console.log(error);
            return ResponseUtil.ResponseError(error.toString(), undefined);
        }
    }
}