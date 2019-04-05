import { Context } from 'fabric-contract-api';
import { ChaincodeResponse } from 'fabric-shim';
import { Guid } from 'guid-typescript';
import { IMedicineOfferJson } from '../medicine-offer/medicine-offer-json';
import { MedicineOfferedDomain } from '../medicine-offered/medicine-offered-domain';
import { MedicineOffered } from '../medicine-offered/medicine-offered-model';
import { IMedicineRequestJson } from '../medicine-request/medicine-request-json';
import { ResponseUtil } from '../result/response-util';
import { Result } from '../result/result';
import { CommonConstants } from '../utils/common-messages';
import { MedicineOfferedStatusEnum, MedicineRequestStatusEnum } from '../utils/enums';
import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IMedicineOfferedRequestService } from './medicine-offered-request-interface';
import { IMedicineOfferedRequestJson } from './medicine-offered-request-json';
import { IMedicineOfferedRequestLedgerJson } from './medicine-offered-request-ledger-json';
import { MedicineOfferedRequest } from './medicine-offered-request-model';

export class MedicineOfferedRequestDomain implements IMedicineOfferedRequestService {

    private static ERROR_MEDICINE_REQUEST_NOT_FOUND: ValidationError =
        new ValidationError('MORD-001',
            'Medicine Request not found.');

    private static ERROR_AMOUNT_MEDICINE_OFFER_IS_NOT_EQUAL_AMOUNT_MEDICINE_REQUEST: ValidationError =
        new ValidationError('MORD-002',
            'The amount medicine offered does not correspond to the quantity requested medicine.');

    private static ERROR_MEDICINE_OFFER_IS_NOT_EQUAL_MEDICINE_REQUEST: ValidationError =
        new ValidationError('MORD-003',
            'The medicine offered does not correspond to the requested medicine.');

    private static ERROR_REQUESTED_TYPE_NOT_EQUAL_PROPOSED_TYPE: ValidationError =
        new ValidationError('MORD-004',
            'The requested type is not the same of the proposed');

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

            medicineOfferedRequest.status = MedicineOfferedStatusEnum.PROPOSED;

            const medicineOfferedRequestToLedger: IMedicineOfferedRequestLedgerJson =
                medicineOfferedRequest.toJson() as IMedicineOfferedRequestLedgerJson;

            medicineOfferedRequestToLedger.msp_id = ctx.clientIdentity.getMSPID().toUpperCase();

            const offerId: string = Guid.create().toString();

            await ctx.stub.putState(offerId, Buffer.from(JSON.stringify(medicineOfferedRequestToLedger)));

            const result: Result = new Result();
            result.offer_id = offerId;
            result.timestamp = new Date().getTime();
            result.request_id = medicineOfferedRequestToLedger.request_id;

            console.log('Offer Medicine Request id: ' + result.offer_id);

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
            const result: Buffer = await ctx.stub.getState(medicineOfferedRequest.requestId);
            if (!result || result.length < 1) {
                validationResult.addError(MedicineOfferedRequestDomain.ERROR_MEDICINE_REQUEST_NOT_FOUND);
                return validationResult;
            }
            const medicineRequest: IMedicineRequestJson = JSON.parse(result.toString());
            if (medicineRequest.status !== MedicineRequestStatusEnum.APPROVED) {
                validationResult.addError(MedicineOfferedRequestDomain.ERROR_MEDICINE_REQUEST_NOT_FOUND);
                return validationResult;
            }

            if (medicineOfferedRequest.type !== medicineRequest.type) {
                validationResult.addError(
                    MedicineOfferedRequestDomain.ERROR_REQUESTED_TYPE_NOT_EQUAL_PROPOSED_TYPE);
                return validationResult;
            }

            if (!medicineRequest.amount.includes(medicineOfferedRequest.amount)) {
                validationResult.addError(
                    MedicineOfferedRequestDomain.ERROR_AMOUNT_MEDICINE_OFFER_IS_NOT_EQUAL_AMOUNT_MEDICINE_REQUEST);
                return validationResult;
            }

            const medicineOfferedDomain: MedicineOfferedDomain = new MedicineOfferedDomain();
            const medicineOfferedValidation: ValidationResult =
                await medicineOfferedDomain.isValid(ctx, medicineOfferedRequest.medicine);

            if (!medicineOfferedValidation.isValid) {
                validationResult.addErrors(medicineOfferedValidation.errors);
                return validationResult;
            }

            if (!this.validateMedicineOffered(medicineOfferedRequest.medicine, medicineRequest.medicine)) {
                validationResult.addError(
                    MedicineOfferedRequestDomain.ERROR_MEDICINE_OFFER_IS_NOT_EQUAL_MEDICINE_REQUEST);
            }

            validationResult.isValid = validationResult.errors.length < 1;

            return validationResult;

        } catch (error) {
            console.log(error);
            throw (error);
        }

    }

    private validateMedicineOffered(medicineOffered: MedicineOffered, medicineRequest: IMedicineOfferJson): boolean {
        if (medicineRequest.active_ingredient !== medicineOffered.activeIngredient) {
            return false;
        }
        if (medicineRequest.classification.length > 0
            && !medicineRequest.classification.includes(medicineOffered.classification)) {
            return false;
        }

        if (medicineRequest.comercial_name && medicineRequest.comercial_name !== ''
            && medicineRequest.comercial_name !== medicineOffered.comercialName) {
            return false;
        }

        if (medicineRequest.pharma_industry.length > 0
            && !medicineRequest.pharma_industry.includes(medicineOffered.pharmaIndustry)) {
            return false;
        }

        if (medicineRequest.concentration !== medicineOffered.concentration) {
            return false;
        }

        if (medicineRequest.pharma_form !== medicineOffered.pharmaForm) {
            return false;
        }

        return true;
    }
}
