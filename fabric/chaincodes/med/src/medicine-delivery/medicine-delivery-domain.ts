import { Context } from 'fabric-contract-api';
import { ChaincodeResponse } from 'fabric-shim';
import { ResponseUtil } from '../result/response-util';
import { CommonConstants } from '../utils/common-messages';
import { ValidationError } from '../validation/validation-error-model';
import { Result } from '../result/result';
import { MedicineDelivery } from './medicine-delivery-model';
import { IMedicineDeliveryJson } from './medicine-delivery-json';

export class MedicineDeliveryDomain {

    private static ERROR_MEDICINE_OFFER_NOT_FOUND: ValidationError =
        new ValidationError('MRD-002',
            'The medicine offer was not found.');

    private static ERROR_MEDICINE_DELIVERED: ValidationError =
            new ValidationError('MRD-008',
            'The medicine requested is already marked as delivered.');
            

    public async medicineDeliveryConfirmation(ctx: Context, deliveryJson: string): Promise<ChaincodeResponse>  {

        try {

            const medicineDelivery: MedicineDelivery = new MedicineDelivery();
            medicineDelivery.fromJson(JSON.parse(deliveryJson) as IMedicineDeliveryJson);

            let requestAsByte = null;
            requestAsByte = await ctx.stub.getState(medicineDelivery.offerId);

            if (!requestAsByte || requestAsByte.length < 1) {
                return ResponseUtil.ResponseNotFound(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineDeliveryDomain.ERROR_MEDICINE_OFFER_NOT_FOUND)));
            }

            if (!medicineDelivery.medication_delivered){
                medicineDelivery.medication_delivered = true;
                await ctx.stub.putState(deliveryJson, Buffer.from(JSON.stringify(medicineDelivery)));
                const result: Result = new Result();
                result.timestamp = new Date().getTime();
                return ResponseUtil.ResponseOk(Buffer.from(JSON.stringify(result)));
            } else {
                return ResponseUtil.ResponseNotFound(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineDeliveryDomain.ERROR_MEDICINE_DELIVERED)));
            }

        } catch (error) {
            console.log(error);
            return ResponseUtil.ResponseError(error.toString(), undefined);
        }
    }
}