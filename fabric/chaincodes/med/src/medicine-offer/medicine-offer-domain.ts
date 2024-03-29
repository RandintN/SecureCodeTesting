import { Context } from 'fabric-contract-api';
import { MedicineDomain } from '../medicine-abstract/medicine-domain';
import { MedicineClassificationDomain } from '../medicine-classification/medicine-classification-domain';
import { PharmaceuticalIndustryDomain } from '../pharmaceutical-industry/pharmaceutical-industry-domain';
import { ValidationResult } from '../validation/validation-model';
import { ChaincodeResponse, Iterators, StateQueryResponse } from 'fabric-shim';
import { ResponseUtil } from '../result/response-util';
import { CommonConstants } from '../utils/common-messages';
import { TradeMode, TradeStatusEnum } from '../utils/enums';
import { Result } from '../result/result';
import { OfferExchangeDomain } from './exchange-domain';
import { NegotiationModalityDomain } from '../negotiation-modality/negotiation-modality-domain';
import { ValidationError } from '../validation/validation-error-model';
import { IMedicineOfferLedgerJson } from './medicine-offer-ledger-json';
import { MedicineOffer } from './medicine-offer-model';
import { MedicineOfferModel } from './medicine-offer-model-base';
import { IMedicineOfferJson } from './medicine-offer-json';
import moment = require('moment');
import { IMedicineOfferQueryResultJson } from './medicine-offer-query-result';
import { IMedicineOfferQuery, QueryType } from './medicine-offer-query';
import { IMedicineOfferPaginationResultJson } from './medicine-offer-pagination-result';
import { IApproveRejectJson } from '../approve-reject/approve-reject-json';

export class MedicineOfferDomain extends MedicineDomain {

    private static MED_OFFER_PD: string = 'MED-OFFER-PD';
    private static ERROR_INVALID_TYPE: ValidationError =
        new ValidationError('MOD-001', 'Type is invalid. Choose between loan, exchange and donation.');
    private static ERROR_INVALID_OFFER: ValidationError =
        new ValidationError('MOD-002', 'offer_id is invalid. Please insert a number.');
    private static ERROR_CLASSIFICATION_REQUIRED: ValidationError =
            new ValidationError('MOD-004', 'The parameter classification cannot be empty or null.');
    private static ERROR_PHARMA_INDUSTRY_REQUIRED: ValidationError =
    new ValidationError('MOD-005', 'The parameter pharm industry cannot be empty or null.');
    private static ERROR_EMPTY_MEDICINE_BATCH: ValidationError =
    new ValidationError('MOD-006', 'The parameter medicine_batch cannot be empty or null.');
    private static ERROR_EMPTY_BATCH_EXPIRE_DATE: ValidationError =
    new ValidationError('MOD-007', 'The parameter expire_date of medicine_batch cannot be empty or null.');
    private static ERROR_EMPTY_BATCH_AMOUNT: ValidationError =
    new ValidationError('MOD-008', 'The parameter amount of medicine_batch cannot be empty or null.');
    private static ERROR_BAD_FORMAT_EXPIRE_DATE: ValidationError =
        new ValidationError('MOD-009', 'The format of medicine_batch expire_date is not supported. Supported format: MM-YYYY');
    //This rule is not been used due to business decisions in N2MI.
    private static ERROR_DUPLICATE_BATCH: ValidationError =
    new ValidationError('MOD-010', 'The parameter batch is cannot be repeated.');
    private static ERROR_YEAR: ValidationError =
    new ValidationError('MOD-011', 'The year cannot be before the current.');
    private static ERROR_MONTH: ValidationError =
    new ValidationError('MOD-012', 'The month must be after the current.');
    private static ERROR_DUPLICATE_EXPIRE_DATE: ValidationError =
    new ValidationError('MOD-013', 'The parameter expire_date of medicine_batch cannot be repeated.');
    private static ERROR_INVALID_AMOUNT: ValidationError =
    new ValidationError('MOD-014', 'The parameter amount must be greater than zero.');
    private static ERROR_EMPTY_MEDICINE_OFFER: ValidationError =
        new ValidationError('MRD-015', 'Empty medicine offer is invaid.');
        private static ERROR_NULL_MEDICINE_OFFER: ValidationError =
        new ValidationError('MRD-016', 'You must enter a offer_id value.');
    private static ERROR_EMPTY_MEDICINE_OFFER_ID: ValidationError =
        new ValidationError('MRD-017', 'Empty offer_id is invaid.');
    private static ERROR_MEDICINE_OFFER_NOT_FOUND: ValidationError =
        new ValidationError('MRD-018',
            'The medicine offer is not found.');
    private static ERROR_BATCH_NOT_FOUND: ValidationError =
            new ValidationError('MRD-019',
            'The parameter batch cannot be empty or null.');

    /** Check the documentation of IMedicineOfferService */
    public async queryMedicineOffersWithPagination(ctx: Context, queryParams: string, pageSize: string, bookmark: string): Promise<ChaincodeResponse | PromiseLike<ChaincodeResponse>> {
        try {
            // Retrieves query from string
            const query: IMedicineOfferQuery = JSON.parse(queryParams) as IMedicineOfferQuery;

            // When the kind of query is own the MSP_ID is setted in endogenous way,
            // to assurance that is the trust identity
            if (query.query_type === QueryType.MY_OWN_OFFERS) {
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

            const records: IMedicineOfferJson[] = await this.getMedicineOffers(stateQuery.iterator);

            // Checking if some records were founding...
            if (!records || records.length < 1) {
                return ResponseUtil.ResponseNotFound(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineOfferDomain.ERROR_MEDICINE_OFFER_NOT_FOUND)));
            }

            const result: IMedicineOfferPaginationResultJson = {
                bookmark: stateQuery.metadata.bookmark,
                fetched_records_count: records.length,
                //Mudança na estratégia de contagem dos elementos
                //stateQuery.metadata.fetched_records_count,
                medicine_offers: records,
                timestamp: new Date().getTime(),

            };

            return ResponseUtil.ResponseOk(Buffer.from(JSON.stringify(result)));
        } catch (error) {
            console.log(error);
            return ResponseUtil.ResponseError(error.toString(), undefined);
        }
    }

    public async addMedicineOffer(ctx: Context, medJsonIn: string): Promise<ChaincodeResponse> {

        try {

            const result: Result = new Result();

            const medicineOffer: MedicineOffer = new MedicineOffer();
            medicineOffer.fromJson(JSON.parse(medJsonIn) as IMedicineOfferJson);

            const validationResult: ValidationResult = await
                this.validateMedicineOfferRules(ctx, medicineOffer);

            if (!validationResult.isValid) {
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(validationResult.errors)));
            }

            //Internal generation of transaction id, to be stored on the ledger.
            medicineOffer.internalId = ctx.stub.getTxID();

            if (medicineOffer.type.toLocaleLowerCase() === TradeMode.EXCHANGE
            || medicineOffer.type.toLocaleLowerCase() === TradeMode.DONATION) {
                result.id = medicineOffer.foreignId;
                const medicineOfferToLedger: IMedicineOfferLedgerJson =
                    medicineOffer.toJson() as IMedicineOfferLedgerJson;

                    medicineOfferToLedger.msp_id = ctx.clientIdentity.getMSPID().toUpperCase();

                //Writing the new offer, using internalId as key.
                //Wating for aproval.
                //In case of private data, we will use foreign Id
                //The private data cannot do a rich query and write
                //on the ledgeron the same execution. Therefore, it is not
                //possible to use internal Id in this case.
                await ctx.stub.putPrivateData(MedicineOfferDomain.MED_OFFER_PD,
                    result.id, Buffer.from(JSON.stringify(medicineOfferToLedger)));
            } else {
                medicineOffer.status = TradeStatusEnum.APPROVED;
                result.id = medicineOffer.internalId;

                const medicineOfferToLedger: IMedicineOfferLedgerJson =
                medicineOffer.toJson() as IMedicineOfferLedgerJson;
                medicineOfferToLedger.msp_id = ctx.clientIdentity.getMSPID().toUpperCase();

                //Writing the new offer, using internalId as key.
                await ctx.stub.putState(result.id, Buffer.from(JSON.stringify(medicineOfferToLedger)));

            }

            const timestamp: number = new Date().getTime();
            result.timestamp = timestamp;

            console.log('Medicine External Offer Id: ' + medicineOffer.foreignId);
            console.log('Medicine Offer Id: ' + result.id);

            return ResponseUtil.ResponseCreated(Buffer.from(JSON.stringify(result)));
        } catch (error) {
            return ResponseUtil.ResponseError(error.toString(), undefined);
        }
    }

    /** Check the documentation of IMedicineOfferService */
    public async queryMedicineOfferPrivateData(ctx: Context, queryParams: string): Promise<ChaincodeResponse> {

        try {
            // Retrieves query from string
            const query: IMedicineOfferQuery = JSON.parse(queryParams) as IMedicineOfferQuery;

            // Creates the query of couchdb
            const queryJson = {
                selector: query.selector,
            };

            const filter: string = JSON.stringify(queryJson);

            // Get Query
            // TODO: alterar aqui para quando o jira FAB-14216 for fechado
            const queryIterator: any = await ctx.stub.getPrivateDataQueryResult
                (MedicineOfferDomain.MED_OFFER_PD, filter);

            const records: IMedicineOfferJson[] = await this.getMedicineOffers(queryIterator.iterator);
            if (!records || records.length < 1) {
                return ResponseUtil.ResponseNotFound(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineOfferDomain.ERROR_MEDICINE_OFFER_NOT_FOUND)));
            }

            const result: IMedicineOfferQueryResultJson = {
                medicine_offers: records,
                timestamp: new Date().getTime(),

            };

            return ResponseUtil.ResponseOk(Buffer.from(JSON.stringify(result)));
        } catch (error) {
            return ResponseUtil.ResponseError(error.toString(), undefined);
        }
    }

    /**
     * Auxiliar method that iterates over an interator of MedicineOffer and mount the query result.
     * @param iterator iterator
     * @returns query results
     */
    private async getMedicineOffers(iterator: Iterators.StateQueryIterator): Promise<IMedicineOfferJson[]> {
        const results: IMedicineOfferJson[] = new Array<IMedicineOfferJson>();

        if (!iterator || typeof iterator.next !== 'function') {
            return results;
        }

        while (true) {

            const result = await iterator.next();

            let medicineOfferJson: IMedicineOfferJson;

            if (result.value && result.value.value.toString()) {
                medicineOfferJson = JSON.parse(result.value.value.toString('utf8')) as IMedicineOfferJson;

            }

            if (medicineOfferJson && medicineOfferJson.id) {
                results.push(medicineOfferJson);

            }

            if (result.done) {
                break;
            }

        }

        return results;
    }
    //#endregion

    /** Check the documentation of IMedicineOfferService */
    public async approveMedicinePendingOffer(ctx: Context, medOfferApproveStr: string): Promise<ChaincodeResponse> {
        let medRequestInBytes: Buffer = null;
        try {
            const approveJson: IApproveRejectJson =
                JSON.parse(medOfferApproveStr) as IApproveRejectJson;

            if(approveJson==null){
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineOfferDomain.ERROR_EMPTY_MEDICINE_OFFER)));
            }

            if(approveJson.id==null){
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineOfferDomain.ERROR_NULL_MEDICINE_OFFER)));
            }

            if(approveJson.id==""){
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineOfferDomain.ERROR_EMPTY_MEDICINE_OFFER_ID)));
            }

            medRequestInBytes = await ctx.stub.getPrivateData(MedicineOfferDomain.MED_OFFER_PD,
                approveJson.id);

            if (!medRequestInBytes || medRequestInBytes.length < 1) {
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineOfferDomain.ERROR_MEDICINE_OFFER_NOT_FOUND)));

            }

            const medOfferJson: IMedicineOfferJson =
                JSON.parse(medRequestInBytes.toString()) as IMedicineOfferJson;

            if (!medOfferJson || medOfferJson.status !== TradeStatusEnum.WAITING_FOR_APPROVAL) {
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineOfferDomain.ERROR_MEDICINE_OFFER_NOT_FOUND)));

            }

            const medicineOffer: MedicineOffer = new MedicineOffer();
            medicineOffer.fromJson(medOfferJson);
            medicineOffer.status = TradeStatusEnum.APPROVED;

            console.log("getTxID: " + medicineOffer.internalId);

            await ctx.stub.putState(medicineOffer.internalId
                , Buffer.from(JSON.stringify(medicineOffer.toJson())));
            await ctx.stub.deletePrivateData(MedicineOfferDomain.MED_OFFER_PD, medicineOffer.foreignId);

            const result: Result = new Result();

            result.id = medicineOffer.internalId;
            result.timestamp = new Date().getTime();

            return ResponseUtil.ResponseOk(Buffer.from(JSON.stringify(result)));

        } catch (error) {
            return ResponseUtil.ResponseError(error.toString(), undefined);
        }
    }

    /** Check the documentation of IMedicineOfferService */
    public async rejectMedicinePendingOffer(ctx: Context, medOfferRejectStr: string): Promise<ChaincodeResponse> {
        let medOfferInBytes: Buffer = null;
        try {
            const medOfferRejectJson: IMedicineOfferJson =
                JSON.parse(medOfferRejectStr) as IMedicineOfferJson;

            if(medOfferRejectJson==null){
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineOfferDomain.ERROR_EMPTY_MEDICINE_OFFER)));
            }

            if(medOfferRejectJson.id==null){
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineOfferDomain.ERROR_NULL_MEDICINE_OFFER)));
            }

            if(medOfferRejectJson.id==""){
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineOfferDomain.ERROR_EMPTY_MEDICINE_OFFER_ID)));
            }

            medOfferInBytes = await ctx.stub.getPrivateData(MedicineOfferDomain.MED_OFFER_PD,
                medOfferRejectJson.id);

            if (!medOfferInBytes || medOfferInBytes.length < 1) {
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineOfferDomain.ERROR_MEDICINE_OFFER_NOT_FOUND)));

            }
            const medOfferJson: IMedicineOfferJson =
                JSON.parse(medOfferInBytes.toString()) as IMedicineOfferJson;

            if (!medOfferJson || medOfferJson.status !== TradeStatusEnum.WAITING_FOR_APPROVAL) {
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineOfferDomain.ERROR_MEDICINE_OFFER_NOT_FOUND)));

            }

            const medicineOffer: MedicineOffer = new MedicineOffer();
            medicineOffer.fromJson(medOfferJson);
            medicineOffer.status = TradeStatusEnum.REJECTED;

            await ctx.stub.putPrivateData(MedicineOfferDomain.MED_OFFER_PD, medOfferRejectJson.id
                , Buffer.from(JSON.stringify(medicineOffer.toJson())));

            const result: Result = new Result();

            result.id = medOfferRejectJson.id;
            result.timestamp = new Date().getTime();

            return ResponseUtil.ResponseOk(Buffer.from(JSON.stringify(result)));

        } catch (error) {
            return ResponseUtil.ResponseError(error.toString(), undefined);
        }
    }

    /**
     * Method used to validate a MedicineOffer.
     *
     * First of all is checked the validation of fields of MedicineOffer, once it's valid will verify the
     * logical rules requirements.
     *
     * Note, if exists attributes inconsistents, the validation will return a
     * ValidationResult with status 'false' and doesnt will verify the rules.
     *
     * @param ctx Context of transaction
     * @param medicineOffer MedicineOffer that will be verified
     * @returns validationResult
     */
    private async validateMedicineOfferRules(ctx: Context, medicineOffer: MedicineOffer):
        Promise<ValidationResult> {

        const validationResult: ValidationResult = new ValidationResult();
        let offerIdAsNumber: number;

        try {
            // Make basic validations
            const medicineBasicValidation: ValidationResult = medicineOffer.isValid();

            if (!medicineBasicValidation.isValid) {
                return medicineBasicValidation;
            }

            const medicineOfferDomain: MedicineOfferDomain = new MedicineOfferDomain();
            const medicineOfferValidation: ValidationResult =
                await medicineOfferDomain.isValid(ctx, medicineOffer.medicine);

            if (!medicineOfferValidation.isValid) {
                validationResult.addErrors(medicineOfferValidation.errors);

            }

            const negotiationModalityDomain: NegotiationModalityDomain = new NegotiationModalityDomain();
            const modalityValidationResult: ValidationResult =
                await negotiationModalityDomain.validateNegotiationModality(ctx, medicineOffer.type);

            if (!modalityValidationResult.isValid) {
                validationResult.addErrors(modalityValidationResult.errors);

            }

            if (medicineOffer.type.toLocaleLowerCase() !== TradeMode.DONATION &&
            medicineOffer.type.toLocaleLowerCase() !== TradeMode.EXCHANGE &&
            medicineOffer.type.toLocaleLowerCase() !== TradeMode.LOAN
            ) {
                validationResult.addError(MedicineOfferDomain.ERROR_INVALID_TYPE);

            }

            offerIdAsNumber = parseInt(medicineOffer.foreignId);
            if (isNaN(offerIdAsNumber)) {
                validationResult.addError(MedicineOfferDomain.ERROR_INVALID_OFFER);
            }

            if (medicineOffer.type.toLocaleLowerCase() === TradeMode.EXCHANGE) {
                const exchangeDomain: OfferExchangeDomain = new OfferExchangeDomain();

                for (const exchange of medicineOffer.exchange) {
                    const exchangeValidation: ValidationResult = await exchangeDomain.isValid(ctx, exchange);

                    if (!exchangeValidation.isValid) {
                        validationResult.addErrors(exchangeValidation.errors);

                    }

                }

            }

        } catch (error) {
            throw error;
        }

        validationResult.isValid = validationResult.errors.length < 1;

        return validationResult;
    }

    public async isValid(ctx: Context, medicine: MedicineOfferModel): Promise<ValidationResult> {
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

            const validationMedicineBatch: ValidationResult = await this.validateMedicineBatch(medicine);

            if (!validationMedicineBatch.isValid) {
                validationResult.addErrors(validationMedicineBatch.errors);
            }

        } catch (error) {
            throw error;
        }

        validationResult.isValid = validationResult.errors.length < 1;

        return validationResult;
    }

    private async validateClassification(ctx: Context, medicine: MedicineOfferModel):
        Promise<ValidationResult> {
        const validationResult: ValidationResult = new ValidationResult();
        const medicineClassificationDomain: MedicineClassificationDomain = new MedicineClassificationDomain();
        try {
            if (medicine.classification && medicine.classification.length > 0) {
                const classification = medicine.classification;

                const medicineClassificationValidation: ValidationResult = await
                    medicineClassificationDomain.validateMedicineClassification(ctx, classification);

                if (!medicineClassificationValidation.isValid) {
                    validationResult.addErrors(medicineClassificationValidation.errors);
                }
            }
            else{
                validationResult.addError(MedicineOfferDomain.ERROR_CLASSIFICATION_REQUIRED);
            }
        } catch (error) {
            throw error;
        }

        validationResult.isValid = validationResult.errors.length < 1;

        return validationResult;
    }

    private async validatePharmaceuticalIndustries(ctx: Context, medicine: MedicineOfferModel):
        Promise<ValidationResult> {
        const validationResult: ValidationResult = new ValidationResult();
        const pharmaIndustryDomain: PharmaceuticalIndustryDomain = new PharmaceuticalIndustryDomain();
        try {
            if (medicine.pharmaIndustry && medicine.pharmaIndustry.length > 0) {
                const pharmaIndustry = medicine.pharmaIndustry;

                const pharmaIndustryValidationResult: ValidationResult =
                    await pharmaIndustryDomain.validatePharmaceuticalIndustry(ctx, pharmaIndustry);

                if (!pharmaIndustryValidationResult.isValid) {
                    validationResult.addErrors(pharmaIndustryValidationResult.errors);
                }
            }
            else{
                validationResult.addError(MedicineOfferDomain.ERROR_PHARMA_INDUSTRY_REQUIRED);
            }

        } catch (error) {
            throw error;
        }

        validationResult.isValid = validationResult.errors.length < 1;

        return validationResult;
    }

    private async validateMedicineBatch(medicine: MedicineOfferModel):
        Promise<ValidationResult> {
        const validationResult: ValidationResult = new ValidationResult();

        try {
            if (!medicine.medicineBatch) {
                validationResult.addError(MedicineOfferDomain.ERROR_EMPTY_MEDICINE_BATCH);
            }
            else if(medicine.medicineBatch.length < 1){
                validationResult.addError(MedicineOfferDomain.ERROR_EMPTY_MEDICINE_BATCH);
            }
            else {
                let expireDateList : string[] = [];
                for(const medicineBatchItem of medicine.medicineBatch){
                    if(!medicineBatchItem.amount){
                        validationResult.addError(MedicineOfferDomain.ERROR_EMPTY_BATCH_AMOUNT);
                    }
                    else if(medicineBatchItem.amount<=0){
                        validationResult.addError(MedicineOfferDomain.ERROR_INVALID_AMOUNT);
                    }
                    if(!medicineBatchItem.expireDate){
                        validationResult.addError(MedicineOfferDomain.ERROR_EMPTY_BATCH_EXPIRE_DATE);
                    }
                    else if (!moment(medicineBatchItem.expireDate, CommonConstants.DATE_FORMAT_OFFER, true).isValid()) {
                        validationResult.addError(MedicineOfferDomain.ERROR_BAD_FORMAT_EXPIRE_DATE);
                    }
                    if(expireDateList.includes(medicineBatchItem.expireDate)){
                        validationResult.addError(MedicineOfferDomain.ERROR_DUPLICATE_EXPIRE_DATE);
                    }
                    else{
                        expireDateList.push(medicineBatchItem.expireDate);
                    }
                    if(!medicineBatchItem.batch){
                        validationResult.addError(MedicineOfferDomain.ERROR_BATCH_NOT_FOUND);
                    }
                    //Expire date must be one month after the current.
                    let month : string = medicineBatchItem.expireDate.substr(0, 2);
                    let year : string = medicineBatchItem.expireDate.substr(3, 6);
                    let today : Date = new Date(moment().format('YYYY-MM-DD HH:mm:ss'));

                    //Se o ano atual for maior que o informado, erro
                    if(today.getUTCFullYear()>Number(year)){
                        validationResult.addError(MedicineOfferDomain.ERROR_YEAR);
                      //Se o ano atual for igual que o informado
                      //e se o mês atual for maior ou igual que o informado,
                      //erro.
                    } else if(today.getUTCFullYear()===Number(year) &&
                              today.getUTCMonth()+1>=Number(month)) {
                        validationResult.addError(MedicineOfferDomain.ERROR_MONTH);
                    }
                }
            }
        } catch (error) {
            throw error;
        }

        validationResult.isValid = validationResult.errors.length < 1;

        return validationResult;
    }
}
