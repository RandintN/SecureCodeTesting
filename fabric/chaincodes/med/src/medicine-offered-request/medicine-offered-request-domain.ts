import { Context } from 'fabric-contract-api';
import { ChaincodeResponse, Iterators } from 'fabric-shim';
import { Guid } from 'guid-typescript';

import { IMedicineOfferJson } from '../medicine-offer/medicine-offer-json';
import { MedicineOfferedDomain } from '../medicine-offered/medicine-offered-domain';
import { MedicineOffered } from '../medicine-offered/medicine-offered-model';
import { IMedicineRequestJson } from '../medicine-request/medicine-request-json';
import { IMedicineRequestLedgerJson } from '../medicine-request/medicine-request-ledger-json';
import { ResponseUtil } from '../result/response-util';
import { Result } from '../result/result';
import { CommonConstants } from '../utils/common-messages';
import { DateExtension } from '../utils/date-extension';
import { MedicineOfferedStatusEnum, MedicineRequestStatusEnum, RequestMode } from '../utils/enums';
import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IMedicineOfferedApproveJson } from './medicine-offered-approve-json';
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
            'The requested type is not the same of the proposed.');

    private static ERROR_NEW_RETURN_DATE_EQUAL_RETURN_DATE: ValidationError =
        new ValidationError('MORD-005',
            'The new return date can not equal the medicine request return date.');

    private static ERROR_OFFER_MEDICINE_REQUEST_NOT_FOUND: ValidationError =
        new ValidationError('MORD-006',
            'Offer Medicine Request not found.');

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

    /** Check the documentation of IMedicineOfferedRequestService */
    public async approveOfferMedicineRequest(ctx: Context, approveOfferMedicineRequestJson: string)
        : Promise<ChaincodeResponse> {
        try {
            const medicineOfferedApprove: IMedicineOfferedApproveJson = JSON.parse(approveOfferMedicineRequestJson);

            if (!(await this.existsMedicineRequestStatusApproved(ctx, medicineOfferedApprove.request_id))) {
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineOfferedRequestDomain.ERROR_MEDICINE_REQUEST_NOT_FOUND)));
            }

            const medicineOfferedRequests: IMedicineOfferedRequestLedgerJson[]
                = await this.searchOfferMedicineRequestByRequestId(ctx, medicineOfferedApprove.request_id
                    , MedicineOfferedStatusEnum.PROPOSED);

            const result = new Result();

            if (medicineOfferedRequests.some((offer) => {
                return offer.key === medicineOfferedApprove.offer_id;
            })) {
                result.rejected_offers = new Array<string>();
                for (const offer of medicineOfferedRequests) {
                    if (offer.key === medicineOfferedApprove.offer_id) {
                        offer.status = MedicineOfferedStatusEnum.ACCEPTED;
                        result.offer_id = offer.key;
                    } else {
                        offer.status = MedicineOfferedStatusEnum.REJECTED;
                        result.rejected_offers.push(offer.key);
                    }
                    await ctx.stub.putState(offer.key
                        , Buffer.from(JSON.stringify(offer)));
                }

                result.request_id = medicineOfferedApprove.request_id;
                result.timestamp = new Date().getTime();
            } else {
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineOfferedRequestDomain.ERROR_OFFER_MEDICINE_REQUEST_NOT_FOUND)));
            }
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

            if (medicineOfferedRequest.type.toLocaleLowerCase() === RequestMode.LOAN) {
                if (medicineOfferedRequest.newReturnDate) {
                    const dateExtension: DateExtension = new DateExtension();
                    if (!dateExtension.validateDate(medicineOfferedRequest.newReturnDate, validationResult)) {
                        return validationResult;
                    }
                    if (Date.parse(medicineOfferedRequest.newReturnDate) === Date.parse(medicineRequest.return_date)) {
                        validationResult.addError(
                            MedicineOfferedRequestDomain.ERROR_NEW_RETURN_DATE_EQUAL_RETURN_DATE);
                        return validationResult;
                    }
                }
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

            if (!medicineRequest.amount.includes(medicineOfferedRequest.medicine.amount)) {
                validationResult.addError(
                    MedicineOfferedRequestDomain.ERROR_AMOUNT_MEDICINE_OFFER_IS_NOT_EQUAL_AMOUNT_MEDICINE_REQUEST);
                return validationResult;
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

        if (medicineRequest.commercial_name && medicineRequest.commercial_name !== ''
            && medicineRequest.commercial_name !== medicineOffered.commercialName) {
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

    private async existsMedicineRequestStatusApproved(ctx: Context, requestId: string): Promise<boolean> {
        const medicineRequestBuffer: Buffer = await ctx.stub.getState(requestId);

        if (medicineRequestBuffer.length === 0) {
            return false;
        }

        const medicineRequest: IMedicineRequestLedgerJson = JSON.parse(medicineRequestBuffer.toString());
        if (medicineRequest.status !== MedicineRequestStatusEnum.APPROVED) {
            return false;
        }
        return true;
    }

    private async searchOfferMedicineRequestByRequestId(ctx: Context, requestId: string, statusOffer: string)
        : Promise<IMedicineOfferedRequestLedgerJson[]> {

        // Creates QueryJson of couchDB index query
        const queryJson = {
            selector: {
                request_id: requestId,
                status: statusOffer,
            },
        };

        // Getting query result
        const iterator: Iterators.StateQueryIterator = await ctx.stub.getQueryResult(JSON.stringify(queryJson));
        const result: IMedicineOfferedRequestLedgerJson[] = await this.getOfferMedicineByRequesId(iterator);
        return result;
    }

    /**
     * Auxiliar method that's iterate over an interator of offer medicine request to retrieve the query result.
     * @param iterator iterator
     */
    private async getOfferMedicineByRequesId(iterator: Iterators.StateQueryIterator)
        : Promise<IMedicineOfferedRequestLedgerJson[]> {
        const medicineOfferedRequestJson: IMedicineOfferedRequestLedgerJson[] =
            new Array<IMedicineOfferedRequestLedgerJson>();
        let offer: IMedicineOfferedRequestLedgerJson;

        while (true) {
            const result = await iterator.next();

            if (result.value && result.value.value.toString()) {
                offer = JSON.parse(result.value.value.toString('utf8')) as IMedicineOfferedRequestLedgerJson;
                offer.key = result.value.getKey();
                medicineOfferedRequestJson.push(offer);
            }

            if (result.done) {
                break;
            }

        }
        return medicineOfferedRequestJson;
    }
}
