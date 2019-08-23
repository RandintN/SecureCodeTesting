import { Context } from 'fabric-contract-api';
import { ChaincodeResponse, Iterators } from 'fabric-shim';
import { ResponseUtil } from '../result/response-util';
import { CommonConstants } from '../utils/common-messages';
import { ValidationError } from '../validation/validation-error-model';
import { Result } from '../result/result';
import { MedicineDelivery } from './medicine-delivery-model';
import { IMedicineDeliveryJson } from './medicine-delivery-json';
import { MedicineProposedStatusEnum } from '../utils/enums';
import { ValidationResult } from '../validation/validation-model';

export class MedicineDeliveryDomain {

    private static ERROR_MEDICINE_PROPOSE_NOT_FOUND: ValidationError =
        new ValidationError('MRD-002',
            'The medicine propose was not found.');

    private static ERROR_MEDICINE_DELIVERED: ValidationError =
            new ValidationError('MRD-008',
            'The medicine requested is already marked as delivered.');
            

    public async medicineDeliveryConfirmation(ctx: Context, deliveryJson: string): Promise<ChaincodeResponse>  {

        try {

            const medicineDelivery: MedicineDelivery = new MedicineDelivery();
            if(!await medicineDelivery.fromJson(ctx, JSON.parse(deliveryJson) as IMedicineDeliveryJson)){
                return ResponseUtil.ResponseNotFound(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineDeliveryDomain.ERROR_MEDICINE_PROPOSE_NOT_FOUND)));
            }

            // Make basic validations
            //----------------------------
            const deliveryBasicValidation: ValidationResult = medicineDelivery.isValid();

            if (!deliveryBasicValidation.isValid) {
                //Entrou no erro do isValid
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(deliveryBasicValidation.errors)));
            }

            if (medicineDelivery.propose.status != MedicineProposedStatusEnum.DELIVERED){
                medicineDelivery.propose.status = MedicineProposedStatusEnum.DELIVERED;
                await ctx.stub.putState(medicineDelivery.propose.key, Buffer.from(JSON.stringify(medicineDelivery.toJson())));
                console.log("Medicine Delivered id: "+medicineDelivery.propose.key);
                console.log('Medicine Status: '      +medicineDelivery.propose.status);
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