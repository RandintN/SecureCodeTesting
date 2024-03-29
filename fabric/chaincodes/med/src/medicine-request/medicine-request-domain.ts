import { Context } from 'fabric-contract-api';
import { ChaincodeResponse, Iterators} from 'fabric-shim';
import { RequestExchangeDomain } from './exchange-domain';
import { NegotiationModalityDomain } from '../negotiation-modality/negotiation-modality-domain';
import { ResponseUtil } from '../result/response-util';
import { Result } from '../result/result';
import { CommonConstants } from '../utils/common-messages';
import { TradeStatusEnum, TradeMode } from '../utils/enums';
import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IApproveRejectJson } from '../approve-reject/approve-reject-json';
import { IMedicineRequestService } from './medicine-request-interface';
import { IMedicineRequestJson } from './medicine-request-json';
import { IMedicineRequestLedgerJson } from './medicine-request-ledger-json';
import { MedicineRequest } from './medicine-request-model';
import { IMedicineRequestPaginationResultJson } from './medicine-request-pagination-result';
import { IMedicineRequestQuery} from './medicine-request-query';
import { IMedicineRequestQueryResultJson } from './medicine-request-query-result';
import { MedicineRequestModel } from './medicine-request-model-base';
import { MedicineDomain } from '../medicine-abstract/medicine-domain';
import { MedicineClassificationDomain } from '../medicine-classification/medicine-classification-domain';
import { PharmaceuticalIndustryDomain } from '../pharmaceutical-industry/pharmaceutical-industry-domain';
import { Guid } from 'guid-typescript';

export class MedicineRequestDomain extends MedicineDomain implements IMedicineRequestService {

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

    private static ERROR_NULL_MEDICINE_REQUEST: ValidationError =
        new ValidationError('MRD-005', 'You must enter a request_id value.');

    private static ERROR_EMPTY_MEDICINE_REQUEST_ID: ValidationError =
        new ValidationError('MRD-006', 'Empty request_id is invaid.');

    private static ERROR_EMPTY_MEDICINE_REQUEST: ValidationError =
        new ValidationError('MRD-007', 'Empty medicine request is invaid.');

    private static ERROR_DUPLICATE_REQUEST_ID: ValidationError =
        new ValidationError('MRD-008', 'Id is already used. Please insert another one.');
    //#endregion

    //#region region of methods to be invoked

    /** Check the documentation of IMedicineRequestService */
    public async addMedicineRequest(ctx: Context, medRequestJson: string): Promise<ChaincodeResponse> {

        const result: Result = new Result();
        try {

            const medicineRequest: MedicineRequest = new MedicineRequest();
            medicineRequest.fromJson(JSON.parse(medRequestJson) as IMedicineRequestJson);


            const validationResult: ValidationResult = await
                this.validateMedicineRequestRules(ctx, medicineRequest);

            if (!validationResult.isValid) {
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(validationResult.errors)));
            }

            //const idRequest: string = Guid.create().toString();
            //const idRequest: string = medicineRequest.foreignId;
            medicineRequest.internalId = ctx.stub.getTxID();

            if (medicineRequest.type.toLocaleLowerCase() === TradeMode.EXCHANGE) {
                result.id = medicineRequest.foreignId;
                const medicineRequestToLedger: IMedicineRequestLedgerJson =
                    medicineRequest.toJson() as IMedicineRequestLedgerJson;

                medicineRequestToLedger.msp_id = ctx.clientIdentity.getMSPID().toUpperCase();

                await ctx.stub.putPrivateData(MedicineRequestDomain.MED_REQUEST_PD,
                    result.id, Buffer.from(JSON.stringify(medicineRequestToLedger)));

            } else {
                result.id = medicineRequest.internalId;
                medicineRequest.status = TradeStatusEnum.APPROVED;

                const medicineRequestToLedger: IMedicineRequestLedgerJson =
                    medicineRequest.toJson() as IMedicineRequestLedgerJson;

                medicineRequestToLedger.msp_id = ctx.clientIdentity.getMSPID().toUpperCase();

                await ctx.stub.putState(result.id, Buffer.from(JSON.stringify(medicineRequestToLedger)));

            }

            const timestamp: number = new Date().getTime();
            result.timestamp = timestamp;

            console.log('Medicine Request id: ' + result.id);
            console.log('Medicine Status:  ' + medicineRequest.status);

            return ResponseUtil.ResponseCreated(Buffer.from(JSON.stringify(result)));
        } catch (error) {
            return ResponseUtil.ResponseError(error.toString(), undefined);
        }
    }

    private async searchMedicineRequest(ctx: Context, requestId: string){

        if(requestId) {
            console.log("Foreign id: " + requestId);
        }

        // Creates the query of couchdb
        const queryJson = {
            selector:{
                id: requestId,
            }
        };

        const filter: string = JSON.stringify(queryJson);

        // Get Query
        const queryIterator: Iterators.StateQueryIterator = await ctx.stub.getQueryResult
        (filter);

        const medOfferJson: IMedicineRequestJson = await this.getMedicine(queryIterator);

        return medOfferJson;
    }

    /**
     * Auxiliar method that iterates over an interator of MedicineOffer and mount the query result.
     * @param iterator iterator
     * @returns query results
     */
    private async getMedicine(iterator: Iterators.StateQueryIterator): Promise<IMedicineRequestJson> {

        const result = await iterator.next();
        let medicineOfferJson: IMedicineRequestJson;

        if (result.value && result.value.value.toString()) {
            medicineOfferJson = JSON.parse(result.value.value.toString('utf8')) as IMedicineRequestJson;
        }

    return medicineOfferJson;
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
                        Buffer.from(JSON.stringify(validationResult.errors)));
                }
                medicineRequestArray.push(objectRequest);
            }

            const resultArray: Result[] = new Array<Result>();

            for (const medicineRequest of medicineRequestArray){

                //medicineRequest.internalId = ctx.stub.getTxID();
                /*
                    BUG:            getTxID generates only a unique value per                   transaction.
                                    But here we are doing many writes on the ledger,so it is needed more that one id generated. 

                    WORKAROUND:     Guid.create() will be used.

                    PROBLEM:        When we work with more than one peer,
                                    this will result in error, because
                                    different peers will generate
                                    different interalId's and, therefore,
                                    not a valid transaction.
                */
                medicineRequest.internalId = Guid.create().toString();
                const timestamp: number = new Date().getTime();
                const result: Result = new Result();

                result.id = medicineRequest.internalId;
                result.timestamp = timestamp;
                if (medicineRequest.type.toLocaleLowerCase() === TradeMode.EXCHANGE) {
                    
                    const medicineRequestToLedger: IMedicineRequestLedgerJson =
                    medicineRequest.toJson() as IMedicineRequestLedgerJson;
                    medicineRequestToLedger.msp_id = ctx.clientIdentity.getMSPID().toUpperCase();
    
                    await ctx.stub.putPrivateData(MedicineRequestDomain.MED_REQUEST_PD,
                        medicineRequest.internalId, Buffer.from(JSON.stringify(medicineRequestToLedger)));
                    resultArray.push(result);
    
                } else {
                    medicineRequest.status = TradeStatusEnum.APPROVED;
                    const medicineRequestToLedger: IMedicineRequestLedgerJson =
                    medicineRequest.toJson() as IMedicineRequestLedgerJson;
                    medicineRequestToLedger.msp_id = ctx.clientIdentity.getMSPID().toUpperCase();

                    await ctx.stub.putState(medicineRequest.internalId, Buffer.from(JSON.stringify(medicineRequestToLedger)));
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
            const reqApproveJson: IApproveRejectJson =
                JSON.parse(medReqApproveStr) as IApproveRejectJson;

            if(reqApproveJson==null){
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineRequestDomain.ERROR_EMPTY_MEDICINE_REQUEST)));
            }

            if(reqApproveJson.id==null){
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineRequestDomain.ERROR_NULL_MEDICINE_REQUEST)));
            }

            if(reqApproveJson.id==""){
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineRequestDomain.ERROR_EMPTY_MEDICINE_REQUEST_ID)));
            }

            medRequestInBytes = await ctx.stub.getPrivateData(MedicineRequestDomain.MED_REQUEST_PD,
                reqApproveJson.id);

            if (!medRequestInBytes || medRequestInBytes.length < 1) {
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineRequestDomain.ERROR_MEDICINE_REQUEST_NOT_FOUND)));

            }

            const medRequestJson: IMedicineRequestJson =
                JSON.parse(medRequestInBytes.toString()) as IMedicineRequestJson;

            if (!medRequestJson || medRequestJson.status !== TradeStatusEnum.WAITING_FOR_APPROVAL) {
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineRequestDomain.ERROR_MEDICINE_REQUEST_NOT_FOUND)));

            }

            const medicineRequest: MedicineRequest = new MedicineRequest();
            medicineRequest.fromJson(medRequestJson);
            medicineRequest.status = TradeStatusEnum.APPROVED;

            console.log("getTxID: " + medicineRequest.internalId);

            await ctx.stub.putState(medicineRequest.internalId
                , Buffer.from(JSON.stringify(medicineRequest.toJson())));
            await ctx.stub.deletePrivateData(MedicineRequestDomain.MED_REQUEST_PD, medicineRequest.foreignId);

            const result: Result = new Result();

            result.id = medicineRequest.internalId;
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
            const medReqRejectJson: IApproveRejectJson =
                JSON.parse(medReqRejectStr) as IApproveRejectJson;

            if(medReqRejectJson==null){
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineRequestDomain.ERROR_EMPTY_MEDICINE_REQUEST)));
            }

            if(medReqRejectJson.id==null){
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineRequestDomain.ERROR_NULL_MEDICINE_REQUEST)));
            }

            if(medReqRejectJson.id==""){
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineRequestDomain.ERROR_EMPTY_MEDICINE_REQUEST_ID)));
            }

            medRequestInBytes = await ctx.stub.getPrivateData(MedicineRequestDomain.MED_REQUEST_PD,
                medReqRejectJson.id);

            if (!medRequestInBytes || medRequestInBytes.length < 1) {
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineRequestDomain.ERROR_MEDICINE_REQUEST_NOT_FOUND)));

            }
            const medRequestJson: IMedicineRequestJson =
                JSON.parse(medRequestInBytes.toString()) as IMedicineRequestJson;

            if (!medRequestJson || medRequestJson.status !== TradeStatusEnum.WAITING_FOR_APPROVAL) {
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineRequestDomain.ERROR_MEDICINE_REQUEST_NOT_FOUND)));

            }

            const medicineRequest: MedicineRequest = new MedicineRequest();
            medicineRequest.fromJson(medRequestJson);
            medicineRequest.status = TradeStatusEnum.REJECTED;

            await ctx.stub.putPrivateData(MedicineRequestDomain.MED_REQUEST_PD, medReqRejectJson.id
                , Buffer.from(JSON.stringify(medicineRequest.toJson())));

            const result: Result = new Result();

            result.id = medReqRejectJson.id;
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
                medicine_trades: JSON.parse(requestAsByte.toString()),
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
                medicine_trades: records,
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

            const IdTest : IMedicineRequestJson = await this.searchMedicineRequest(ctx, medicineRequest.foreignId);
            if(IdTest){
                //Duplicated Id - Error
                validationResult.addError(MedicineRequestDomain.ERROR_DUPLICATE_REQUEST_ID);

            }
            const medicineBasicValidation: ValidationResult = medicineRequest.isValid();

            if (!medicineBasicValidation.isValid) {
                return medicineBasicValidation;
            }

            const medicineOfferValidation: ValidationResult =
                await this.isValid(ctx, medicineRequest.medicine);

            if (!medicineOfferValidation.isValid) {
                validationResult.addErrors(medicineOfferValidation.errors);

            }

            const negotiationModalityDomain: NegotiationModalityDomain = new NegotiationModalityDomain();
            const modalityValidationResult: ValidationResult =
                await negotiationModalityDomain.validateNegotiationModality(ctx, medicineRequest.type);

            if (!modalityValidationResult.isValid) {
                validationResult.addErrors(modalityValidationResult.errors);

            }

            if (medicineRequest.type.toLocaleLowerCase() !== TradeMode.DONATION &&
                medicineRequest.type.toLocaleLowerCase() !== TradeMode.EXCHANGE &&
                medicineRequest.type.toLocaleLowerCase() !== TradeMode.LOAN
            ) {
                validationResult.addError(MedicineRequestDomain.ERROR_INVALID_TYPE);

            }

            requestIdAsNumber = parseInt(medicineRequest.foreignId);
            if (isNaN(requestIdAsNumber)) {
                validationResult.addError(MedicineRequestDomain.ERROR_INVALID_REQUEST_TYPE);
            }

            if (medicineRequest.type.toLocaleLowerCase() === TradeMode.EXCHANGE) {
                if (!medicineRequest.exchange || medicineRequest.exchange.length < 1) {
                    validationResult.addError(MedicineRequestDomain.ERROR_NEGOTIATION_IS_NEEDED);

                } else {
                    const exchangeDomain: RequestExchangeDomain = new RequestExchangeDomain();

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

    public async isValid(ctx: Context, medicine: MedicineRequestModel): Promise<ValidationResult> {
        const validationResult: ValidationResult = new ValidationResult();

        try {
            const validationModel: ValidationResult =
                medicine.isValid();

            if (!validationModel.isValid) {
                validationResult.addErrors(validationModel.errors);

            }

            const validationActiveIngredient: ValidationResult =
                await super.validateActiveIngredient(ctx, medicine);

            if (!validationActiveIngredient.isValid) {
                validationResult.addErrors(validationActiveIngredient.errors);

            }

            const validationPharmaceuticalForm: ValidationResult =
                await super.validatePharmaceuticalForm(ctx, medicine);

            if (!validationPharmaceuticalForm.isValid) {
                validationResult.addErrors(validationPharmaceuticalForm.errors);

            }

            const validationClassification: ValidationResult =
                await this.validateClassification(ctx, medicine);

            if (!validationClassification.isValid) {
                validationResult.addErrors(validationClassification.errors);

            }

            const validationPharmaceuticalIndustries: ValidationResult =
                await this.validatePharmaceuticalIndustries(ctx, medicine);

            if (!validationPharmaceuticalIndustries.isValid) {
                validationResult.addErrors(validationPharmaceuticalIndustries.errors);

            }

        } catch (error) {
            throw error;
        }

        validationResult.isValid = validationResult.errors.length < 1;

        return validationResult;
    }

    private async validateClassification(ctx: Context, medicine: MedicineRequestModel):
        Promise<ValidationResult> {
        const validationResult: ValidationResult = new ValidationResult();
        const medicineClassificationDomain: MedicineClassificationDomain = new MedicineClassificationDomain();
        try {
            if (medicine.classification && medicine.classification.length > 0) {
                for (const classification of medicine.classification) {
                    if (classification) {
                        const medicineClassificationValidation: ValidationResult = await
                            medicineClassificationDomain.validateMedicineClassification(ctx, classification);

                        if (!medicineClassificationValidation.isValid) {
                            validationResult.addErrors(medicineClassificationValidation.errors);

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

    private async validatePharmaceuticalIndustries(ctx: Context, medicine: MedicineRequestModel):
        Promise<ValidationResult> {
        const validationResult: ValidationResult = new ValidationResult();
        const pharmaIndustryDomain: PharmaceuticalIndustryDomain = new PharmaceuticalIndustryDomain();
        try {
            if (medicine.pharmaIndustry && medicine.pharmaIndustry.length > 0) {
                for (const pharmaIndustry of medicine.pharmaIndustry) {
                    if (pharmaIndustry) {
                        const pharmaIndustryValidationResult: ValidationResult =
                            await pharmaIndustryDomain.validatePharmaceuticalIndustry(ctx, pharmaIndustry);

                        if (!pharmaIndustryValidationResult.isValid) {
                            validationResult.addErrors(pharmaIndustryValidationResult.errors);

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
