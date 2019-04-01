import { Context } from 'fabric-contract-api';
import { ChaincodeResponse } from 'fabric-shim';
import { Guid } from 'guid-typescript';
import { MedicineOfferedDomain } from '../medicine-offered/medicine-offered-domain';
import { ResponseUtil } from '../result/response-util';
import { Result } from '../result/result';
import { CommonConstants } from '../utils/common-messages';
import { ValidationResult } from '../validation/validation-model';
import { IMedicineOfferedRequestService } from './medicine-offered-request-interface';
import { IMedicineOfferedRequestJson } from './medicine-offered-request-json';
import { MedicineOfferedRequest } from './medicine-offered-request-model';

export class MedicineOfferedRequestDomain implements IMedicineOfferedRequestService {

    public async offerMedicineRequest(ctx: Context, medicineOfferedRequestJson: string): Promise<ChaincodeResponse> {
        try {
            const medicineOfferedRequest: MedicineOfferedRequest = new MedicineOfferedRequest();
            medicineOfferedRequest.fromJson(JSON.parse(medicineOfferedRequestJson) as IMedicineOfferedRequestJson);

            const validationResult: ValidationResult = await
                this.validateOfferedRequestRules(ctx, medicineOfferedRequest);

            if (!validationResult.isValid) {
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(validationResult.errors)));
            }

            const requestId: string = Guid.create().toString();

            const timestamp: number = new Date().getTime();
            const result: Result = new Result();

            result.request_id = requestId;
            result.timestamp = timestamp;

            console.log('Offer Medicine Request id: ' + result.request_id);

            return ResponseUtil.ResponseCreated(Buffer.from(JSON.stringify(result)));

        } catch (error) {
            return ResponseUtil.ResponseError(error.toString(), undefined);

        }
    }

    private async validateOfferedRequestRules(ctx: Context, medicineOfferedRequest: MedicineOfferedRequest)
        : Promise<ValidationResult> {

        const validationResult: ValidationResult = new ValidationResult();

        try {
            // Make basic validations
            const medicineOfferedBasicValidation: ValidationResult = medicineOfferedRequest.isValid();

            if (!medicineOfferedBasicValidation.isValid) {
                return medicineOfferedBasicValidation;
            }

            const medicineOfferedDomain: MedicineOfferedDomain = new MedicineOfferedDomain();
            const medicineOfferedValidation: ValidationResult =
                await medicineOfferedDomain.isValid(ctx, medicineOfferedRequest.medicine);

            if (!medicineOfferedValidation.isValid) {
                validationResult.addErrors(medicineOfferedValidation.errors);
            }

            validationResult.isValid = validationResult.errors.length < 1;

            return validationResult;

        } catch (error) {
            console.log(error);
            throw (error);
        }

    }

}
