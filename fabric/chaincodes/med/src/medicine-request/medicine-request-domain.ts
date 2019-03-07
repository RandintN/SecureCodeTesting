import { Context } from 'fabric-contract-api';
import { ChaincodeResponse } from 'fabric-shim';
import { Guid } from 'guid-typescript';
import { debug } from 'util';
import { ExchangeDomain } from '../exchange/exchange-domain';
import { MedicineOfferDomain } from '../medicine-offer/medicine-offer-domain';
import { NegotiationModalityDomain } from '../negotiation-modality/negotiation-modality-domain';
import { ResponseUtil } from '../result/response-util';
import { Result } from '../result/result';
import { CommonConstants } from '../utils/common-messages';
import { MedicineRequestStatusEnum } from '../utils/enums';
import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IMedicineRequestApproveJson } from './medicine-request-approve-json';
import { IMedicineRequestService } from './medicine-request-interface';
import { IMedicineRequestJson } from './medicine-request-json';
import { MedicineRequest } from './medicine-request-model';

export class MedicineRequestDomain implements IMedicineRequestService {

    //#region constants

    private static MED_REQUEST_PD: string = 'MED-REQUEST-PD';
    private static ERROR_NEGOTIATION_IS_NEEDED: ValidationError =
        new ValidationError('MRD-001',
            'When the negotiation have a type as exchange one or more exchange is necessary.');
    private static ERROR_MEDICINE_REQUEST_NOT_FOUND: ValidationError =
        new ValidationError('MRD-002',
            'The medicine request is not found.');

    private static ERROR_INVALID_STATE: ValidationError =
        new ValidationError('MRD-003',
            'Invalid state.');
    //#endregion

    //#region region of methods to be invoked
    public async addMedicineRequest(ctx: Context, medRequestJson: string): Promise<ChaincodeResponse> {
        try {
            const medicineRequest: MedicineRequest = new MedicineRequest();

            medicineRequest.fromJson(JSON.parse(medRequestJson) as IMedicineRequestJson);

            const validationResult: ValidationResult = await
                this.validateMedicineRequestRules(ctx, medicineRequest);

            if (!validationResult.isValid) {
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(validationResult)));
            }

            const idRequest: Guid = Guid.create();

            if (medicineRequest.type.toLocaleLowerCase() === 'exchange') {
                await ctx.stub.putPrivateData(MedicineRequestDomain.MED_REQUEST_PD,
                    idRequest.toString(), Buffer.from(medRequestJson));

            } else {
                await ctx.stub.putState(idRequest.toString(), Buffer.from(medRequestJson));

            }

            const timestamp: number = new Date().getTime();
            const result: Result = new Result();

            result.id = idRequest.toString();
            result.timestamp = timestamp;

            return ResponseUtil.ResponseCreated(Buffer.from(JSON.stringify(result)));
        } catch (error) {
            return ResponseUtil.ResponseError(error.toString(), undefined);
        }
    }

    public async approveMedicinePendingRequest(ctx: Context, medReqApproveStr: string): Promise<ChaincodeResponse> {
        let medRequestInBytes: Buffer = null;
        try {
            const medReqApproveJson: IMedicineRequestApproveJson =
                JSON.parse(medReqApproveStr) as IMedicineRequestApproveJson;

            medRequestInBytes = await ctx.stub.getPrivateData(MedicineRequestDomain.MED_REQUEST_PD,
                medReqApproveJson.id);

            if (!medRequestInBytes || medRequestInBytes.length < 1) {
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineRequestDomain.ERROR_MEDICINE_REQUEST_NOT_FOUND)));

            }

            const medRequestJson: IMedicineRequestJson =
                JSON.parse(medRequestInBytes.toString()) as IMedicineRequestJson;

            if (!medRequestJson) {
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineRequestDomain.ERROR_MEDICINE_REQUEST_NOT_FOUND)));

            }

            const medicineRequest: MedicineRequest = new MedicineRequest();
            medicineRequest.fromJson(medRequestJson);

            if (medReqApproveJson.status.toUpperCase() === MedicineRequestStatusEnum.APPROVED) {
                await ctx.stub.putState(medReqApproveJson.id.toString(), Buffer.from(JSON.stringify(medRequestJson)));
                await ctx.stub.deletePrivateData(MedicineRequestDomain.MED_REQUEST_PD, medReqApproveJson.id);

            } else if (medReqApproveJson.status.toUpperCase() === MedicineRequestStatusEnum.REJECTED) {
                await ctx.stub.deletePrivateData(MedicineRequestDomain.MED_REQUEST_PD, medReqApproveJson.id);

            } else {
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineRequestDomain.ERROR_INVALID_STATE)));
            }

            const timestamp: number = new Date().getTime();
            const result: Result = new Result();

            result.id = medReqApproveJson.id.toString();

            return ResponseUtil.ResponseOk(Buffer.from(JSON.stringify(result)));
        } catch (error) {
            return ResponseUtil.ResponseError(error.toString(), undefined);
        }
    }

    //#endregion

    //#region region of queries

    public async queryMedicineRequest(ctx: Context, key: string): Promise<string> {
        const requestAsByte = await ctx.stub.getPrivateData(MedicineRequestDomain.MED_REQUEST_PD, key);
        return JSON.stringify(requestAsByte.toString());
    }

    //#endregion

    //#region of private methods
    private async validateMedicineRequestRules(ctx: Context, medicineRequest: MedicineRequest):
        Promise<ValidationResult> {
        const validationResult: ValidationResult = new ValidationResult();

        try {
            // Make basic validations
            const medicineBasicValidation: ValidationResult = medicineRequest.isValid();

            if (!medicineBasicValidation.isValid) {
                return medicineBasicValidation;
            }

            const medicineOfferDomain: MedicineOfferDomain = new MedicineOfferDomain();
            const medicineOfferValidation: ValidationResult =
                await medicineOfferDomain.isValid(ctx, medicineRequest.medicine);

            if (!medicineOfferValidation.isValid) {
                validationResult.addErrors(medicineOfferValidation.errors);

            }

            const negotiationModalityDomain: NegotiationModalityDomain = new NegotiationModalityDomain();
            const modalityValidationResult: ValidationResult =
                await negotiationModalityDomain.validateNegotiationModality(ctx, medicineRequest.type);

            if (!modalityValidationResult.isValid) {
                validationResult.addErrors(modalityValidationResult.errors);

            }

            if (medicineRequest.type.toLocaleLowerCase() === 'exchange') {
                if (!medicineRequest.exchange || medicineRequest.exchange.length < 1) {
                    validationResult.addError(MedicineRequestDomain.ERROR_NEGOTIATION_IS_NEEDED);

                } else {
                    const exchangeDomain: ExchangeDomain = new ExchangeDomain();

                    for (const exchange of medicineRequest.exchange) {
                        const exchangeValidation: ValidationResult = await exchangeDomain.isValid(ctx, exchange);

                        if (!exchangeValidation.isValid) {
                            validationResult.addErrors(exchangeValidation.errors);

                        }

                    }

                }

            }

        } catch (error) {
            throw error;
        }

        validationResult.isValid = validationResult.errors.length < 1;

        return validationResult;
    }

    //#endregion

}
