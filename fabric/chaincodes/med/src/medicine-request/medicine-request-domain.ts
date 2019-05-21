import { Context } from 'fabric-contract-api';
import { ChaincodeResponse, Iterators, StateQueryResponse } from 'fabric-shim';
import { Guid } from 'guid-typescript';
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
import { IMedicineRequestQueryResultJson } from './medicine-request-query-result';

export class MedicineRequestDomain implements IMedicineRequestService {

    //#region constants

    private static MED_REQUEST_PD: string = 'MED-REQUEST-PD';
    private static ERROR_NEGOTIATION_IS_NEEDED: ValidationError =
        new ValidationError('MRD-001',
            'When the negotiation have a type as exchange one or more exchange is necessary.');
    private static ERROR_MEDICINE_REQUEST_NOT_FOUND: ValidationError =
        new ValidationError('MRD-002',
            'The medicine request is not found.');

    private static ERROR_INVALID_REQUEST_TYPE: ValidationError =
        new ValidationError('MRD-003', 'request_id is invalid. Please insert a number.');

    private static ERROR_INVALID_TYPE: ValidationError =
        new ValidationError('MRD-004', 'Type is invalid. Choose between loan, exchange and donation.');

    private static ERROR_NULL_MEDICINE_REQUEST_TO_APPROVE: ValidationError =
        new ValidationError('MRD-005', 'You must enter a request_id value.');

    private static ERROR_EMPTY_MEDICINE_REQUEST_TO_APPROVE: ValidationError =
        new ValidationError('MRD-006', 'Empty request_id is invaid.');
    //#endregion

    //#region region of methods to be invoked

    /** Check the documentation of IMedicineRequestService */
    public async addMedicineRequest(ctx: Context, medRequestJson: string): Promise<ChaincodeResponse> {

        try {
            console.log("JJJson ", medRequestJson);

            const medicineRequest: MedicineRequest = new MedicineRequest();
            medicineRequest.fromJson(JSON.parse(medRequestJson) as IMedicineRequestJson);

            console.log("medicineRequest ", medicineRequest);

            const validationResult: ValidationResult = await
                this.validateMedicineRequestRules(ctx, medicineRequest);

            if (!validationResult.isValid) {
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(validationResult.errors)));
            }

            //const idRequest: string = Guid.create().toString();
            const idRequest: string = medicineRequest.request_id;

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

    public async addMedicineRequestInBatch(ctx: Context, medRequestJson: string): Promise<ChaincodeResponse> {
        try {
            const medicineRequest = JSON.parse(medRequestJson);
            var sizeOfRequest = Object.keys(medicineRequest).length;
            
            let validationResult: ValidationResult;
            const medicineRequestArray: MedicineRequest [] = new Array<MedicineRequest>();
            let objectRequest: MedicineRequest;

            for (var i = 0; i < sizeOfRequest; i++){
    
                    objectRequest = new MedicineRequest();
                    objectRequest.fromJson(medicineRequest[i]);
                    validationResult = await this.validateMedicineRequestRules(ctx, objectRequest);
                    
                    if (!validationResult.isValid) {
                        return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                            Buffer.from(JSON.stringify(validationResult)));
                    }
                    medicineRequestArray.push(objectRequest);
            }

            const resultArray: Result[] = new Array<Result>();

            for (const medicineRequest of medicineRequestArray){
                const idRequest: string = Guid.create().toString();
                const timestamp: number = new Date().getTime();
                const result: Result = new Result();

                result.request_id = idRequest;
                result.timestamp = timestamp;
                if (medicineRequest.type.toLocaleLowerCase() === RequestMode.EXCHANGE) {
                    
                    const medicineRequestToLedger: IMedicineRequestLedgerJson =
                    medicineRequest.toJson() as IMedicineRequestLedgerJson;
                    medicineRequestToLedger.msp_id = ctx.clientIdentity.getMSPID().toUpperCase();
    
                    await ctx.stub.putPrivateData(MedicineRequestDomain.MED_REQUEST_PD,
                    idRequest, Buffer.from(JSON.stringify(medicineRequestToLedger)));
                    resultArray.push(result);
    
                } else {
                    medicineRequest.status = MedicineRequestStatusEnum.APPROVED;
                    const medicineRequestToLedger: IMedicineRequestLedgerJson =
                    medicineRequest.toJson() as IMedicineRequestLedgerJson;
                    medicineRequestToLedger.msp_id = ctx.clientIdentity.getMSPID().toUpperCase();
    
                    await ctx.stub.putState(idRequest, Buffer.from(JSON.stringify(medicineRequestToLedger)));
                    resultArray.push(result);
                    }
                }

            return ResponseUtil.ResponseCreated(Buffer.from(JSON.stringify(resultArray)));
        } catch (error) {
            return ResponseUtil.ResponseError(error.toString(), undefined);
        }
    }

    /** Check the documentation of IMedicineRequestService */
    public async approveMedicinePendingRequest(ctx: Context, medReqApproveStr: string): Promise<ChaincodeResponse> {
        let medRequestInBytes: Buffer = null;
        try {
            const medReqApproveJson: IMedicineRequestApproveRejectJson =
                JSON.parse(medReqApproveStr) as IMedicineRequestApproveRejectJson;

            if(medReqApproveJson.request_id==null){
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineRequestDomain.ERROR_NULL_MEDICINE_REQUEST_TO_APPROVE)));
            }

            if(medReqApproveJson.request_id==""){
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineRequestDomain.ERROR_EMPTY_MEDICINE_REQUEST_TO_APPROVE)));
            }

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

    /** Check the documentation of IMedicineRequestService */
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

    /** Check the documentation of IMedicineRequestService */
    public async queryMedicineRequest(ctx: Context, key: string):
        Promise<ChaincodeResponse> {

        try {
            let requestAsByte = null;
            requestAsByte = await ctx.stub.getState(key);
            if (!requestAsByte || requestAsByte.length < 1) {
                requestAsByte = await ctx.stub.getPrivateData(MedicineRequestDomain.MED_REQUEST_PD, key);
                if (!requestAsByte || requestAsByte.length < 1) {
                    return ResponseUtil.ResponseNotFound(CommonConstants.VALIDATION_ERROR,
                        Buffer.from(JSON.stringify(MedicineRequestDomain.ERROR_MEDICINE_REQUEST_NOT_FOUND)));
                }
            }

            const result: IMedicineRequestPaginationResultJson = {
                bookmark: undefined,
                fetched_records_count: 1,
                medicine_requests: JSON.parse(requestAsByte.toString()),
                timestamp: new Date().getTime(),
            };
            return ResponseUtil.ResponseOk(Buffer.from(JSON.stringify(result)));

        } catch (error) {
            console.log(error);
            return ResponseUtil.ResponseError(error.toString(), undefined);
        }
    }

    /** Check the documentation of IMedicineRequestService */
    public async queryMedicineRequestsWithPagination(
        ctx: Context,
        queryParams: string,
        pageSize: string,
        bookmark?: string):
        Promise<ChaincodeResponse> {

        try {
            // Retrieves query from string
            const query: IMedicineRequestQuery = JSON.parse(queryParams) as IMedicineRequestQuery;

            // When the kind of query is own the MSP_ID is setted in endogenous way,
            // to assurance that is the trust identity
            if (query.query_type === QueryType.MY_OWN_REQUESTS) {
                query.selector.msp_id = ctx.clientIdentity.getMSPID().toUpperCase();
            }

            // Creates the query of couchdb
            const queryJson = {
                selector: query.selector,
            };

            const filter: string = JSON.stringify(queryJson);

            // Get Query
            const stateQuery: StateQueryResponse<Iterators.StateQueryIterator> =
                await ctx.stub.getQueryResultWithPagination(
                    filter,
                    Number(pageSize),
                    bookmark);

            const records: IMedicineRequestJson[] = await this.getMedicineRequests(stateQuery.iterator);

            // Checking if some records were founding...
            if (!records || records.length < 1) {
                return ResponseUtil.ResponseNotFound(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineRequestDomain.ERROR_MEDICINE_REQUEST_NOT_FOUND)));
            }

            const result: IMedicineRequestPaginationResultJson = {
                bookmark: stateQuery.metadata.bookmark,
                fetched_records_count: stateQuery.metadata.fetched_records_count,
                medicine_requests: records,
                timestamp: new Date().getTime(),

            };

            return ResponseUtil.ResponseOk(Buffer.from(JSON.stringify(result)));
        } catch (error) {
            console.log(error);
            return ResponseUtil.ResponseError(error.toString(), undefined);
        }
    }

    /** Check the documentation of IMedicineRequestService */
    public async queryMedicineRequestPrivateData(ctx: Context, queryParams: string): Promise<ChaincodeResponse> {

        try {
            // Retrieves query from string
            const query: IMedicineRequestQuery = JSON.parse(queryParams) as IMedicineRequestQuery;

            // Creates the query of couchdb
            const queryJson = {
                selector: query.selector,
            };

            const filter: string = JSON.stringify(queryJson);

            // Get Query
            // TODO: alterar aqui para quando o jira FAB-14216 for fechado
            const queryIterator: any = await ctx.stub.getPrivateDataQueryResult
                (MedicineRequestDomain.MED_REQUEST_PD, filter);

            const records: IMedicineRequestJson[] = await this.getMedicineRequests(queryIterator.iterator);
            if (!records || records.length < 1) {
                return ResponseUtil.ResponseNotFound(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineRequestDomain.ERROR_MEDICINE_REQUEST_NOT_FOUND)));
            }

            const result: IMedicineRequestQueryResultJson = {
                medicine_requests: records,
                timestamp: new Date().getTime(),

            };

            return ResponseUtil.ResponseOk(Buffer.from(JSON.stringify(result)));
        } catch (error) {
            return ResponseUtil.ResponseError(error.toString(), undefined);
        }
    }
    //#endregion

    //#region of private methods

    /**
     * Method used to validate a MedicineRequest.
     *
     * First of all is checked the validation of fields of MedicineRequest, once it's valid will verify the
     * logical rules requirements.
     *
     * Note, if exists attributes inconsistents, the validation will return a
     * ValidationResult with status 'false' and doesnt will verify the rules.
     *
     * @param ctx Context of transaction
     * @param medicineRequest MedicineRequest that will be verified
     * @returns ValidationResult
     */
    private async validateMedicineRequestRules(ctx: Context, medicineRequest: MedicineRequest):
        Promise<ValidationResult> {
    
        const validationResult: ValidationResult = new ValidationResult();
        let requestIdAsNumber: number;

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

            requestIdAsNumber = parseInt(medicineRequest.request_id);
            if (isNaN(requestIdAsNumber)) {
                validationResult.addError(MedicineRequestDomain.ERROR_INVALID_REQUEST_TYPE);
            }

            if (medicineRequest.type.toLocaleLowerCase() === RequestMode.EXCHANGE) {
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
        const results: IMedicineRequestJson[] = new Array<IMedicineRequestJson>();

        if (!iterator || typeof iterator.next !== 'function') {
            return results;
        }

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

    //#endregion

}
