import { Context } from 'fabric-contract-api';
import { ChaincodeResponse, Iterators, StateQueryResponse } from 'fabric-shim';
import { Guid } from 'guid-typescript';
import { error } from 'util';
import { ExchangeDomain } from '../exchange/exchange-domain';
import { MedicineOfferDomain } from '../medicine-offer/medicine-offer-domain';
import { NegotiationModalityDomain } from '../negotiation-modality/negotiation-modality-domain';
import { ResponseUtil } from '../result/response-util';
import { Result } from '../result/result';
import { CommonConstants } from '../utils/common-messages';
import { MedicineRequestStatusEnum, RequestMode } from '../utils/enums';
import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IMedicineRequestApproveRejectJson } from './medicine-request-approve-reject-json';
import { IMedicineRequestService } from './medicine-request-interface';
import { IMedicineRequestJson } from './medicine-request-json';
import { IMedicineRequestLedgerJson } from './medicine-request-ledger-json';
import { MedicineRequest } from './medicine-request-model';
import { IMedicineRequestPaginationResultJson } from './medicine-request-pagination-result';
import { IMedicineRequestQuery, QueryType } from './medicine-request-query';

export class MedicineRequestDomain implements IMedicineRequestService {

    //#region constants

    private static MED_REQUEST_PD: string = 'MED-REQUEST-PD';
    private static ERROR_NEGOTIATION_IS_NEEDED: ValidationError =
        new ValidationError('MRD-001',
            'When the negotiation have a type as exchange one or more exchange is necessary.');
    private static ERROR_MEDICINE_REQUEST_NOT_FOUND: ValidationError =
        new ValidationError('MRD-002',
            'The medicine request is not found.');

    private static ERROR_INVALID_TYPE: ValidationError =
        new ValidationError('MRD-004', 'Type is invalid. Choose between loan, exchange and donation.');
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
                    Buffer.from(JSON.stringify(validationResult.errors)));
            }

            const idRequest: string = Guid.create().toString();

            if (medicineRequest.type.toLocaleLowerCase() === RequestMode.EXCHANGE) {
                const medicineRequestToLedger: IMedicineRequestLedgerJson =
                    medicineRequest.toJson() as IMedicineRequestLedgerJson;

                medicineRequestToLedger.msp_id = ctx.clientIdentity.getMSPID().toUpperCase();

                await ctx.stub.putPrivateData(MedicineRequestDomain.MED_REQUEST_PD,
                    idRequest, Buffer.from(JSON.stringify(medicineRequestToLedger)));

            } else {
                medicineRequest.status = MedicineRequestStatusEnum.APPROVED;

                const medicineRequestToLedger: IMedicineRequestLedgerJson =
                    medicineRequest.toJson() as IMedicineRequestLedgerJson;

                medicineRequestToLedger.msp_id = ctx.clientIdentity.getMSPID().toUpperCase();

                await ctx.stub.putState(idRequest, Buffer.from(JSON.stringify(medicineRequestToLedger)));

            }

            const timestamp: number = new Date().getTime();
            const result: Result = new Result();

            result.request_id = idRequest;
            result.timestamp = timestamp;

            console.log('Medicine Request id: ' + result.request_id);

            return ResponseUtil.ResponseCreated(Buffer.from(JSON.stringify(result)));
        } catch (error) {
            return ResponseUtil.ResponseError(error.toString(), undefined);
        }
    }

    public async approveMedicinePendingRequest(ctx: Context, medReqApproveStr: string): Promise<ChaincodeResponse> {
        let medRequestInBytes: Buffer = null;
        try {
            const medReqApproveJson: IMedicineRequestApproveRejectJson =
                JSON.parse(medReqApproveStr) as IMedicineRequestApproveRejectJson;

            medRequestInBytes = await ctx.stub.getPrivateData(MedicineRequestDomain.MED_REQUEST_PD,
                medReqApproveJson.request_id);

            if (!medRequestInBytes || medRequestInBytes.length < 1) {
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineRequestDomain.ERROR_MEDICINE_REQUEST_NOT_FOUND)));

            }

            const medRequestJson: IMedicineRequestJson =
                JSON.parse(medRequestInBytes.toString()) as IMedicineRequestJson;

            if (!medRequestJson || medRequestJson.status !== MedicineRequestStatusEnum.WAITING_FOR_APPROVAL) {
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineRequestDomain.ERROR_MEDICINE_REQUEST_NOT_FOUND)));

            }

            const medicineRequest: MedicineRequest = new MedicineRequest();
            medicineRequest.fromJson(medRequestJson);
            medicineRequest.status = MedicineRequestStatusEnum.APPROVED;

            await ctx.stub.putState(medReqApproveJson.request_id
                , Buffer.from(JSON.stringify(medicineRequest.toJson())));
            await ctx.stub.deletePrivateData(MedicineRequestDomain.MED_REQUEST_PD, medReqApproveJson.request_id);

            const result: Result = new Result();

            result.request_id = medReqApproveJson.request_id;
            result.timestamp = new Date().getTime();

            return ResponseUtil.ResponseOk(Buffer.from(JSON.stringify(result)));

        } catch (error) {
            return ResponseUtil.ResponseError(error.toString(), undefined);
        }
    }

    public async rejectMedicinePendingRequest(ctx: Context, medReqRejectStr: string): Promise<ChaincodeResponse> {
        let medRequestInBytes: Buffer = null;
        try {
            const medReqRejectJson: IMedicineRequestApproveRejectJson =
                JSON.parse(medReqRejectStr) as IMedicineRequestApproveRejectJson;

            medRequestInBytes = await ctx.stub.getPrivateData(MedicineRequestDomain.MED_REQUEST_PD,
                medReqRejectJson.request_id);

            if (!medRequestInBytes || medRequestInBytes.length < 1) {
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineRequestDomain.ERROR_MEDICINE_REQUEST_NOT_FOUND)));

            }
            const medRequestJson: IMedicineRequestJson =
                JSON.parse(medRequestInBytes.toString()) as IMedicineRequestJson;

            if (!medRequestJson || medRequestJson.status !== MedicineRequestStatusEnum.WAITING_FOR_APPROVAL) {
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineRequestDomain.ERROR_MEDICINE_REQUEST_NOT_FOUND)));

            }

            const medicineRequest: MedicineRequest = new MedicineRequest();
            medicineRequest.fromJson(medRequestJson);
            medicineRequest.status = MedicineRequestStatusEnum.REJECTED;

            await ctx.stub.putPrivateData(MedicineRequestDomain.MED_REQUEST_PD, medReqRejectJson.request_id
                , Buffer.from(JSON.stringify(medicineRequest.toJson())));

            const result: Result = new Result();

            result.request_id = medReqRejectJson.request_id;
            result.timestamp = new Date().getTime();

            return ResponseUtil.ResponseOk(Buffer.from(JSON.stringify(result)));

        } catch (error) {
            return ResponseUtil.ResponseError(error.toString(), undefined);
        }
    }

    //#endregion

    //#region region of queries

    public async queryMedicineRequest(ctx: Context, key: string, status: MedicineRequestStatusEnum):
        Promise<ChaincodeResponse> {

        try {
            let requestAsByte = null;

            switch (status) {
                case MedicineRequestStatusEnum.APPROVED:
                    requestAsByte = await ctx.stub.getState(key);
                    break;
                case MedicineRequestStatusEnum.WAITING_FOR_APPROVAL:
                case MedicineRequestStatusEnum.REJECTED:
                    requestAsByte = await ctx.stub.getPrivateData(MedicineRequestDomain.MED_REQUEST_PD, key);
                    break;
                default:
                    throw error('Unknow state');
            }

            return ResponseUtil.ResponseCreated(Buffer.from(requestAsByte.toString()));
        } catch (error) {
            return ResponseUtil.ResponseError(error.toString(), undefined);
        }
    }

    public async queryMedicineRequestsWithPagination(
        ctx: Context,
        queryParams: IMedicineRequestQuery,
        pageSize: number,
        bookmark?: string):
        Promise<ChaincodeResponse> {

        try {
            const stateQuery: StateQueryResponse<Iterators.StateQueryIterator> =
                await ctx.stub.getQueryResultWithPagination(
                    this.createQueryMedicineRequest(ctx, queryParams),
                    pageSize,
                    bookmark);

            const records: IMedicineRequestJson[] = await this.getMedicineRequests(stateQuery.iterator);

            const result: IMedicineRequestPaginationResultJson = {
                bookmark: stateQuery.metadata.bookmark,
                fetched_records_count: stateQuery.metadata.fetched_records_count,
                medicine_requests: records,
                timestamp: new Date().getTime(),

            };

            return ResponseUtil.ResponseCreated(Buffer.from(JSON.stringify(result)));
        } catch (error) {
            return ResponseUtil.ResponseError(error.toString(), undefined);
        }
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

            if (medicineRequest.type.toLocaleLowerCase() !== RequestMode.DONATION &&
                medicineRequest.type.toLocaleLowerCase() !== RequestMode.EXCHANGE &&
                medicineRequest.type.toLocaleLowerCase() !== RequestMode.LOAN
            ) {
                validationResult.addError(MedicineRequestDomain.ERROR_INVALID_TYPE);

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

    /**
     * Auxiliar method that iterates over an interator of MedicineRequest and mount the query result.
     * @param iterator iterator
     * @returns query results
     */
    private async getMedicineRequests(iterator: Iterators.StateQueryIterator): Promise<IMedicineRequestJson[]> {
        const results: IMedicineRequestJson[] = [];

        while (true) {
            const result = await iterator.next();

            let medicineRequestJson: IMedicineRequestJson;

            if (result.value && result.value.value.toString()) {
                medicineRequestJson = JSON.parse(result.value.value.toString('utf8')) as IMedicineRequestJson;

            }

            if (medicineRequestJson) {
                results.push(medicineRequestJson);

            }

            if (result.done) {
                break;
            }

        }

        return results;
    }

    private createQueryMedicineRequest(ctx: Context, query: IMedicineRequestQuery): string {

        const queryJson = {
            selector: {
            },
        };

        if (query.query_type === QueryType.MY_OWN_REQUESTS) {
            queryJson.selector = { msp_id: ctx.clientIdentity.getMSPID().toUpperCase() };
        }

        return JSON.stringify(queryJson);
    }
    //#endregion

}
