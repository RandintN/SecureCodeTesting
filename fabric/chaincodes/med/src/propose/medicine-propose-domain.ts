import { Context } from 'fabric-contract-api';
import { ChaincodeResponse, Iterators } from 'fabric-shim';
import { IMedicineRequestClaPharmIndJson } from '../medicine/medicine-initial-transaction-json';
import { MedicineProposedToOfferDomain } from '../medicine-proposed/medicine-proposed-to-offer-domain';
import { MedicineProposedToOffer } from '../medicine-proposed/medicine-proposed-to-offer-model';
import { IMedicineRequestJson as IMedicineBaseJson, IMedicineRequestJson } from '../medicine-request/medicine-request-json';
import { ResponseUtil } from '../result/response-util';
import { Result } from '../result/result';
import { CommonConstants } from '../utils/common-messages';
import { DateExtension } from '../utils/date-extension';
import { MedicineProposedStatusEnum, TradeStatusEnum, TradeMode, MedicineOperationEnum } from '../utils/enums';
import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IProposeApprovalJson } from './propose-approval-json';
import { IMedicineProposedService } from './medicine-propose-interface';
import { IProposedJson } from './medicine-proposed-json';
import { IMedicineProposedLedgerJson } from './medicine-proposed-ledger-json';
import { ProposeToOffer } from './propose-to-offer-model';
import { IMedicineQueryKey } from '../medicine/medicine-query-key';
import { MedicineProposedToRequestDomain } from '../medicine-proposed/medicine-proposed-to-request-domain';
import { ProposeToRequest } from './propose-to-request-model';
import { IMedicineOfferJson } from '../medicine-offer/medicine-offer-json';
import { IOfferExchangeJson } from '../medicine-offer/exchange-json';
import { IMedicineOfferClaPharmIndJson } from '../medicine-offer/medicine-offer-classification-pharma-industry-json';
import { IRequestExchangeJson } from '../medicine-request/exchange-json';
import { ProposedExchange } from './exchange-model';
import { IMedicineBatchJson } from '../medicine-batch/medicine-batch-json';
import { MedicineBatch } from '../medicine-batch/medicine-batch-model';

export class MedicineProposeDomain implements IMedicineProposedService {

    private medicineTrade:      IMedicineBaseJson;
    private medicineJson:       IMedicineBaseJson;
    private medicineProposed:   any;

    private static ERROR_MEDICINE_NOT_FOUND: ValidationError =
        new ValidationError('MPD-001',
            'Medicine Request not found.');

    private static ERROR_AMOUNT_MEDICINE_PROPOSE_IS_NOT_EQUAL_AMOUNT_MEDICINE_REQUEST: ValidationError =
        new ValidationError('MPD-002',
            'The amount medicine proposed does not correspond to the quantity requested medicine.');

    private static ERROR_AMOUNT_MEDICINE_PROPOSE_IS_NOT_EQUAL_AMOUNT_MEDICINE_OFFER: ValidationError =
    new ValidationError('MPD-003',
        'The amount medicine proposed does not correspond to the quantity offered medicine.');

    private static ERROR_MEDICINE_PROPOSE_IS_NOT_EQUAL_MEDICINE_REQUEST: ValidationError =
        new ValidationError('MPD-004',
            'The medicine proposed does not correspond to the requested medicine.');

    private static ERROR_MEDICINE_PROPOSE_IS_NOT_EQUAL_MEDICINE_OFFER: ValidationError =
            new ValidationError('MPD-005',
                'The medicine proposed does not correspond to the offered medicine.');

    private static ERROR_REQUESTED_TYPE_NOT_EQUAL_PROPOSED_TYPE: ValidationError =
        new ValidationError('MPD-006',
            'The requested type is not the same of the proposed.');

    private static ERROR_OFFERED_TYPE_NOT_EQUAL_PROPOSED_TYPE: ValidationError =
            new ValidationError('MPD-007',
                'The offered type is not the same of the proposed.');

    private static ERROR_NEW_RETURN_DATE_EQUAL_RETURN_DATE: ValidationError =
        new ValidationError('MPD-008',
            'The new return date can not equal the medicine request return date.');

    private static ERROR_OFFER_MEDICINE_REQUEST_NOT_FOUND: ValidationError =
        new ValidationError('MPD-009',
            'Medicine ID not found.');

    private static ERROR_DUPLICATED_PROPOSE_ID: ValidationError =
            new ValidationError('MPD-010',
                'Propose id is already used. Please insert another one.');

    private static ERROR_TRADE_EXGHANGE_NOT_EQUAL_PROPOSED_TYPE: ValidationError = new ValidationError('MPD-11', 'The medicine in exchange is not the same of the proposed.');

    /**
     * Method to send a medicine propose to the ledger.
     * @param ctx Context of operation
     * @param proposedJson Data of the proposed medicine
     */
    public async proposeMedicine(ctx: Context, proposedJson: string): Promise<ChaincodeResponse> {
        try {

            let validationTradeId: ValidationResult;
            validationTradeId = await this.loadTradeAndValidateId(ctx, proposedJson
                );
            if (!validationTradeId.isValid) {
                //Entrou no erro do isValid
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(validationTradeId.errors)));
            }

            let validationProposeId: ValidationResult;
            validationProposeId = await this.identifyAndValidatePropose(ctx, proposedJson);
            if (!validationProposeId.isValid) {
                //Entrou no erro do isValid
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(validationProposeId.errors)));
            }

            console.log("ID pra busca: " + this.medicineJson.internal_id);
            this.medicineProposed.internalId = this.medicineJson.internal_id;

            let validationResult: ValidationResult;

            if(this.medicineProposed.operation == MedicineOperationEnum.REQUEST){
                validationResult = await
                this.validateRequestProposedMedicineRules(ctx, this.medicineProposed);
            }

            if(this.medicineProposed.operation == MedicineOperationEnum.OFFER){
                validationResult = await
                this.validateOfferProposedMedicineRules(ctx, this.medicineProposed);
            }

            if (!validationResult.isValid) {
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(validationResult.errors)));
            }

            this.medicineProposed.status = MedicineProposedStatusEnum.PROPOSED;

            const proposedToLedger: IMedicineProposedLedgerJson =
            this.medicineProposed.toJson() as IMedicineProposedLedgerJson;

            proposedToLedger.msp_id = ctx.clientIdentity.getMSPID().toUpperCase();

            //Though we use an external id to make the queries, we generate an internal id to do the putState to the ledger.
            this.medicineProposed.internalProposeId = ctx.stub.getTxID();

            await ctx.stub.putState(this.medicineProposed.internalProposeId, Buffer.from(JSON.stringify(proposedToLedger)));

            const result: Result = new Result();
            result.propose_id = this.medicineProposed.internalProposeId;
            result.timestamp = new Date().getTime();
            result.id = this.medicineProposed.internalId;

            console.log('Medicine Propose id: ' + result.propose_id);
            console.log('Medicine Status: ' + proposedToLedger.status);

            return ResponseUtil.ResponseCreated(Buffer.from(JSON.stringify(result)));

        } catch (error) {
            return ResponseUtil.ResponseError(error.toString(), undefined);

        }
    }

    /**
     * Method to validate if the proposeId inserted was already writen.
     * @param ctx Context of operation
     * @param proposeId the propose Id
     */
    private async isUniqueProposeId(ctx: Context, proposeId: string): Promise<boolean>{

        // Creates the query of couchdb
        const queryJson = {
            selector:{
                propose_id: proposeId,
            }
        };

        const filter: string = JSON.stringify(queryJson);

        // Get Query
        const queryIterator: Iterators.StateQueryIterator = await ctx.stub.getQueryResult
        (filter);

        const medOfferJson: IMedicineBaseJson = await this.getMedicine(queryIterator);

        if(medOfferJson){
            //Achou um registro, o que mostra que o id já existe.
            return false;
        }

        return true;
    }

    /** Check the documentation of IMedicineProposeService */
    /**
     * Method to approve a choosen propose.
     * @param ctx Context of operation
     * @param approveOfferMedicineRequestJson the Id and propose Id
     */
    public async approvePropose(ctx: Context, approveOfferMedicineRequestJson: string)
        : Promise<ChaincodeResponse> {
        try {
            const medicineOfferedApprove: IProposeApprovalJson = JSON.parse(approveOfferMedicineRequestJson);

            if (!(await this.existsMedicineTradeStatusApproved(ctx, approveOfferMedicineRequestJson))) {
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineProposeDomain.ERROR_MEDICINE_NOT_FOUND)));
            }

            const medicineOfferedRequests: IMedicineProposedLedgerJson[]                = await this.searchProposeMedicineById(ctx, medicineOfferedApprove.id
                    , MedicineProposedStatusEnum.PROPOSED);

            const result = new Result();

            if (medicineOfferedRequests.some((offer) => {
                return offer.propose_id === medicineOfferedApprove.propose_id;
            })) {
                result.rejected_offers = new Array<string>();

                for (const offer of medicineOfferedRequests) {

                    if (offer.propose_id === medicineOfferedApprove.propose_id)
                    //Achou o propose correspondente para dar o accept
                    {
                        //Mudar o status do propose
                        offer.status = MedicineProposedStatusEnum.ACCEPTED;
                        //Mudar o status do trade
                        this.medicineTrade.status = TradeStatusEnum.WAITING_FOR_WITHDRAW;

                        result.propose_id = offer.key;
                        result.id = this.medicineTrade.internal_id;
                    } else {
                        offer.status = MedicineProposedStatusEnum.REJECTED;
                        result.rejected_offers.push(offer.key);
                    }
                    await ctx.stub.putState(offer.key
                        , Buffer.from(JSON.stringify(offer)));
                    await ctx.stub.putState(this.medicineTrade.internal_id
                            , Buffer.from(JSON.stringify(this.medicineTrade)));
                }

                result.timestamp = new Date().getTime();
            } else {
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineProposeDomain.ERROR_OFFER_MEDICINE_REQUEST_NOT_FOUND)));
            }
            return ResponseUtil.ResponseCreated(Buffer.from(JSON.stringify(result)));

        } catch (error) {
            return ResponseUtil.ResponseError(error.toString(), undefined);
        }
    }

    /**
     * Method specific to medicine offer to validate if the proposed
     * information is equal to the available offer.
     * @param ctx Context of operation
     * @param propose the informations of the proposed medicine
     */
    private async validateOfferProposedMedicineRules(ctx: Context, propose: ProposeToOffer)
        : Promise<ValidationResult> {

        const validationResult: ValidationResult = new ValidationResult();

        try {

            // Make basic validations
            //----------------------------
            //*Empty type
            //*Empty exchange - type = exchange
            //*Empty id
            //*Empty propose id
            //*Empty medicine
            // ---------------------------
            const basicValidation: ValidationResult = propose.isValid();

            if (!basicValidation.isValid) {
                return basicValidation;
            }

            //Try to get data with the trade id - internalId
            const result: Buffer = await ctx.stub.getState(propose.internalId);
            if (!result || result.length < 1) {
                validationResult.addError(MedicineProposeDomain.ERROR_MEDICINE_NOT_FOUND);
                return validationResult;
            }

            //The offer
            const offer: IMedicineOfferJson = JSON.parse(result.toString());

            //Verify is the medicine is approved or waiting for approved
            if (offer.status !== TradeStatusEnum.APPROVED) {
                validationResult.addError(MedicineProposeDomain.ERROR_MEDICINE_NOT_FOUND);
                return validationResult;
            }

            //Comparing type
            if (propose.type !== offer.type) {
                validationResult.addError(
                MedicineProposeDomain.ERROR_OFFERED_TYPE_NOT_EQUAL_PROPOSED_TYPE);
                
                return validationResult;
            }

            //Comparing return date
            if (propose.type.toLocaleLowerCase() === TradeMode.LOAN) {
                if (propose.newReturnDate) {
                    const dateExtension: DateExtension = new DateExtension();
                    if (!dateExtension.validateDate(propose.newReturnDate, validationResult)) {
                        return validationResult;
                    }
                    if (Date.parse(propose.newReturnDate) === Date.parse(offer.return_date)) {
                        validationResult.addError(
                            MedicineProposeDomain.ERROR_NEW_RETURN_DATE_EQUAL_RETURN_DATE);
                        return validationResult;
                    }
                }
            }

            //Detect if it's a exchange operation
            if (propose.type.toLocaleLowerCase() === TradeMode.EXCHANGE) {
                //Detect if the offer specified one or more itens
                //to give in exchange. Otherwise, it is not necessary
                //to validate the proposed exchange.
                if(offer.exchange && offer.exchange.length > 0) {
                    let hasExchange : boolean;
                    for(let exchangeItem of offer.exchange){
                        if(this.validateProposedOfferExchange(propose.exchange, exchangeItem)) {
                            hasExchange = true;
                            break;
                        }
                    }
                    if(!hasExchange) {
                        validationResult.addError(
                            MedicineProposeDomain.ERROR_TRADE_EXGHANGE_NOT_EQUAL_PROPOSED_TYPE);

                    return validationResult;
                    }
                }
                // In this case, the exchange proposed need to be attached to the offer, to be used on future proposals.
                // Then, it needs to update the ledger.
                else {
                    offer.exchange[0] = {
                        //1- Amount
                        "amount":propose.exchange.amount,
                        "medicine":{
                            //2- Active ingredient
                            "active_ingredient": propose.exchange.medicine.activeIngredient,
                            //3- Commercial name
                            "commercial_name": propose.exchange.medicine.commercialName,
                            //4- Pharma form
                            "pharma_form": propose.exchange.medicine.pharmaForm,
                            //5- Concentration
                            "concentration": propose.exchange.medicine.concentration,
                            //6- Pharma industry
                            "pharma_industry": [propose.exchange.medicine.pharmaIndustry],
                            //7- Classification
                            "classification": [propose.exchange.medicine.classification]
                        }
                    }

                    await ctx.stub.putState(propose.internalId
                        , Buffer.from(JSON.stringify(offer)));
                }
            }

            if (!offer.amount.includes(propose.amount)) {

                validationResult.addError(
                MedicineProposeDomain.ERROR_AMOUNT_MEDICINE_PROPOSE_IS_NOT_EQUAL_AMOUNT_MEDICINE_OFFER);

                return validationResult;
            }

            //The medicine of the propose offer
            const medicineProposedDomain: MedicineProposedToOfferDomain = new MedicineProposedToOfferDomain();
            
            const medicineProposedValidation: ValidationResult =
                await medicineProposedDomain.isValid(ctx, propose.medicine);

            if (!medicineProposedValidation.isValid) {
                validationResult.addErrors(medicineProposedValidation.errors);
                return validationResult;
            }

            if (!this.validateProposedOfferMedicine(propose.medicine, offer.medicine)) {
                validationResult.addError(
                MedicineProposeDomain.ERROR_MEDICINE_PROPOSE_IS_NOT_EQUAL_MEDICINE_OFFER);
            }

            validationResult.isValid = validationResult.errors.length < 1;

            return validationResult;

        } catch (error) {
            console.log(error);
            throw (error);
        }

    }

    /**
     * Method specific to medicine request to validate if the proposed
     * information is equal to the available request.
     * @param ctx Context of operation
     * @param propose the informations of the propose to request
     */
    private async validateRequestProposedMedicineRules(ctx: Context, propose: ProposeToRequest)
        : Promise<ValidationResult> {

        const validationResult: ValidationResult = new ValidationResult();

        try {

            // Make basic validations
            //----------------------------
            //*Empty type
            //*Empty id
            //*Empty propose id
            //*Empty medicine
            // ---------------------------
            const proposeBasicValidation: ValidationResult = propose.isValid();

            if (!proposeBasicValidation.isValid) {
                return proposeBasicValidation;
            }

            //Try to get data with the trade id - internalId
            const result: Buffer = await ctx.stub.getState(propose.internalId);
            if (!result || result.length < 1) {
                validationResult.addError(MedicineProposeDomain.ERROR_MEDICINE_NOT_FOUND);
                return validationResult;
            }

            //The request
            const request: IMedicineRequestJson = JSON.parse(result.toString());

            //Verify is the medicine is approved or waiting for approved
            if (request.status !== TradeStatusEnum.APPROVED) {
                validationResult.addError(MedicineProposeDomain.ERROR_MEDICINE_NOT_FOUND);
                return validationResult;
            }

            //Comparing type
            if (propose.type !== request.type) {
                validationResult.addError(
                        MedicineProposeDomain.ERROR_REQUESTED_TYPE_NOT_EQUAL_PROPOSED_TYPE);
                
                return validationResult;
            }

            //Comparing return date
            if (propose.type.toLocaleLowerCase() === TradeMode.LOAN) {
                if (propose.newReturnDate) {
                    const dateExtension: DateExtension = new DateExtension();
                    if (!dateExtension.validateDate(propose.newReturnDate, validationResult)) {
                        return validationResult;
                    }
                    if (Date.parse(propose.newReturnDate) === Date.parse(request.return_date)) {
                        validationResult.addError(
                            MedicineProposeDomain.ERROR_NEW_RETURN_DATE_EQUAL_RETURN_DATE);
                        return validationResult;
                    }
                }
            }

            //Detect if it's a exchange operation
            if (propose.type.toLocaleLowerCase() === TradeMode.EXCHANGE) {
                //Verify if the exchange propose is equal to some of
                //request exchange itens.
                let hasExchange : boolean;
                for(let exchangeItem of request.exchange){
                    //console.log("--------------------------")
                    //console.log(exchangeItem);
                    //console.log("--------------------------")
                    if(this.validateProposedRequestExchange(propose.exchange, exchangeItem)) {
                        hasExchange = true;
                        break;
                    }
                }
                if(!hasExchange) {
                    validationResult.addError(
                        MedicineProposeDomain.ERROR_TRADE_EXGHANGE_NOT_EQUAL_PROPOSED_TYPE);

                return validationResult;
                }
            }

            if (!request.amount.includes(propose.amount)) {
                validationResult.addError(
                MedicineProposeDomain.ERROR_AMOUNT_MEDICINE_PROPOSE_IS_NOT_EQUAL_AMOUNT_MEDICINE_REQUEST);

                return validationResult;
            }

            //The medicine of the propose request
            const medicineProposedDomain: MedicineProposedToRequestDomain= new MedicineProposedToRequestDomain();
            
            const medicineProposedValidation: ValidationResult =
                await medicineProposedDomain.isValid(ctx, propose.medicine);

            if (!medicineProposedValidation.isValid) {
                validationResult.addErrors(medicineProposedValidation.errors);
                return validationResult;
            }

            if (!this.validateProposedMedicine(propose.medicine, request.medicine)) {
                validationResult.addError(
                MedicineProposeDomain.ERROR_MEDICINE_PROPOSE_IS_NOT_EQUAL_MEDICINE_REQUEST);
            }

            validationResult.isValid = validationResult.errors.length < 1;

            return validationResult;

        } catch (error) {
            console.log(error);
            throw (error);
        }

    }

    /**
     * Method to try to load the medicine trade, returning ok or error, 
     * depending if the corresponding medicine trade exists, given the input.
     * @param ctx Context of operation
     * @param medicineProposedJson the informations of the proposed medicine
     */
    private async loadTradeAndValidateId(ctx: Context, medicineProposedJson: string)
        : Promise<ValidationResult> {

        const validationResult: ValidationResult = new ValidationResult();

        try {

            //Thirst thing, identify the medicine trade.
            this.medicineJson = await this.searchMedicineApproved(ctx, medicineProposedJson);

            //Check if the search returned an item.
            if (!this.medicineJson) { 
                //ID not found
                validationResult.addError(MedicineProposeDomain.ERROR_OFFER_MEDICINE_REQUEST_NOT_FOUND);

            } //else {
            //    console.log("Trade medicine from json was found: ", this.medicineJson);
            //}

            validationResult.isValid = validationResult.errors.length < 1;

            return validationResult;

        } catch (error) {
            console.log(error);
            throw (error);
        }

    }

    /**
     * This Method identify the proposed medicine as based on a request or 
     * offer. After, it verify if the propose id was already inserted. If
     * afirmative, an error is generated.
     * @param ctx Context of operation
     * @param medicineProposedJson the informations of the proposed medicine
     */
    private async identifyAndValidatePropose(ctx: Context, medicineProposedJson: string)
        : Promise<ValidationResult> {

        const validationResult: ValidationResult = new ValidationResult();

        try {

            //Thirst, identify if the trade is a request or an offer.
            if(this.medicineJson.operation == MedicineOperationEnum.REQUEST){
                this.medicineProposed  = new ProposeToRequest();
            }
            if(this.medicineJson.operation == MedicineOperationEnum.OFFER){
                this.medicineProposed  = new ProposeToOffer();
            }

            //Next, populate the proposed medicine object acording to the operation (request or offer)
            this.medicineProposed.fromJson(JSON.parse(medicineProposedJson) as IProposedJson);

            console.log("Foreign Propose id: " + this.medicineProposed.proposeId);
            
            validationResult.isValid = true;
            if(!await this.isUniqueProposeId(ctx, this.medicineProposed.proposeId)){
                //Duplicated ID
                validationResult.addError(MedicineProposeDomain.ERROR_DUPLICATED_PROPOSE_ID);
            }
            
            validationResult.isValid = validationResult.errors.length < 1;

            return validationResult;

        } catch (error) {
            console.log(error);
            throw (error);
        }

    }

    /**
     * This Method search for an approved medicine.
     * @param ctx Context of operation
     * @param medObject the informations of the proposed medicine
     */
    private async searchMedicineApproved(ctx: Context, medObject: string){
        // Retrieves query from string
        const query: IMedicineQueryKey = JSON.parse(medObject) as IMedicineQueryKey;

        let queryJson;

        //Only make the query if there's an id comming from medObject
        if(query.id) {
            // Creates the query of couchdb
            queryJson = {
                selector:{
                    id: query.id,
                    status: TradeStatusEnum.APPROVED
                }
            };
        } else {
            return null;
        }

        const filter: string = JSON.stringify(queryJson);

        // Get Query
        const queryIterator: Iterators.StateQueryIterator = await ctx.stub.getQueryResult
        (filter);

        const medJson: IMedicineBaseJson = await this.getMedicine(queryIterator);

        return medJson;
    }

    /**
     * Auxiliar method that iterates over an interator of MedicinePropose and mount the query result.
     * @param iterator iterator
     * @returns query results
     */
    private async getMedicine(iterator: Iterators.StateQueryIterator): Promise<IMedicineBaseJson> {

            const result = await iterator.next();
            let medicineJson: IMedicineBaseJson;

            if (result.value && result.value.value.toString()) {
                medicineJson = JSON.parse(result.value.value.toString('utf8')) as IMedicineBaseJson;
            }

        return medicineJson;
    }

    /**
     * Auxiliar method that goes inside the exchange and validate its fields,
     * comparing the inicial trade and the proposed medicine
     * @param proposedExchange the proposed medicine
     * @param originalExchange the initial offer
     */
    private validateProposedOfferExchange(proposedExchange: ProposedExchange, originalExchange: IOfferExchangeJson): boolean {


        //AMOUNT
        if (originalExchange.amount !== proposedExchange.amount) {
            console.log("Different amounts:");
            console.log("Sugested amount: " + originalExchange.amount);
            console.log("Proposed amount: " + proposedExchange.amount);
            return false;
        } else {
            //console.log("Amounts found equality.");
        }

        //ACTIVE INGREDIENT
        if (originalExchange.medicine.active_ingredient !== proposedExchange.medicine.activeIngredient) {
            console.log("Different active ingredients:");
            console.log("Sugested active ingredient: " + originalExchange.medicine.active_ingredient);
            console.log("Proposed active ingredient: " + proposedExchange.medicine.activeIngredient);
            return false;
        } else {
            //console.log("Ingredientes equals :)");
        }
        //CLASSIFICATION
        if (originalExchange.medicine.classification && originalExchange.medicine.classification && !originalExchange.medicine.classification.includes(proposedExchange.medicine.classification)) {
            console.log("Different classifications:");
            console.log("Sugested classification: " + originalExchange.medicine.classification);
            console.log("Proposed classification: " + proposedExchange.medicine.classification);
            return false;
        } else {
            //console.log("Classifications found equality.");
        }

        //COMMERCIAL NAME - Optional atribute
        if (originalExchange.medicine.commercial_name && originalExchange.medicine.commercial_name !== proposedExchange.medicine.commercialName) {
            console.log("Different commercial name:");
            console.log("Sugested amount: " + originalExchange.medicine.commercial_name);
            console.log("Proposed amount: " + proposedExchange.medicine.commercialName);
            return false;
        } else {
            //console.log("Commercial names equals :)");
        }
        //PHARMA INDUSTRY
        if (originalExchange.medicine.pharma_industry && originalExchange.medicine.pharma_industry.length > 1
            && !originalExchange.medicine.pharma_industry.includes(proposedExchange.medicine.pharmaIndustry)) {
            //console.log("Different pharma industry:");
            //console.log("Sugested pharma industry: " + originalExchange.medicine.pharma_industry);
            //console.log("Proposed pharma industry: " + proposedExchange.medicine.pharmaIndustry);
            //console.log("Tamanho do pharm industry.");
            //console.log(originalExchange.medicine.pharma_industry.length);
            return false;
        } else {
            //console.log("Pharma Industries found equality.")
        }

        //CONCENTRATION
        if (originalExchange.medicine.concentration !== proposedExchange.medicine.concentration) {
            console.log("Different concentrations:");
            console.log("Sugested concentration: " + originalExchange.medicine.concentration);
            console.log("Proposed concentration: " + proposedExchange.medicine.concentration);
            return false;
        } else {
            //console.log("Concentrations found equality.");
        }

        //PHARMA FORM
        if (originalExchange.medicine.pharma_form !== proposedExchange.medicine.pharmaForm) {
            console.log("Different pharma forms:");
            console.log("Sugested pharma form: " + originalExchange.medicine.pharma_form);
            console.log("Proposed pharma form: " + proposedExchange.medicine.pharmaForm);
            return false;
        } else {
            //console.log("Pharma forms found equality.");
        }

        return true;
    }

    /**
     * Auxiliar method that goes inside the exchange and validate its fields,
     * comparing the inicial trade and the proposed medicine
     * @param proposedExchange the proposed medicine
     * @param originalExchange the initial offer
     */
    private validateProposedRequestExchange(proposedExchange: ProposedExchange, originalExchange: IRequestExchangeJson): boolean {

        //AMOUNT
        if (originalExchange.amount !== proposedExchange.amount) {
            console.log("Different amounts:");
            console.log("Sugested amount: " + originalExchange.amount);
            console.log("Proposed amount: " + proposedExchange.amount);
            return false;
        } else {
            //console.log("Amounts found equality.");
        }

        //ACTIVE INGREDIENT
        if (originalExchange.medicine.active_ingredient !== proposedExchange.medicine.activeIngredient) {
            console.log("Different active ingredients:");
            console.log("Sugested active ingredient: " + originalExchange.medicine.active_ingredient);
            console.log("Proposed active ingredient: " + proposedExchange.activeIngredient);
            return false;
        } else {
            //console.log("Equals");
        }
        //CLASSIFICATION
        if (originalExchange.medicine.classification && originalExchange.medicine.classification && !originalExchange.medicine.classification.includes(proposedExchange.medicine.classification)) {
            console.log("Different classifications:");
            console.log("Sugested classification: " + originalExchange.medicine.classification);
            console.log("Proposed classification: " + proposedExchange.medicine.classification);
            return false;
        } else {
            //console.log("Classifications found equality.");
        }

        //COMMERCIAL NAME - Optional atribute
        if (originalExchange.medicine.commercial_name && originalExchange.medicine.commercial_name !== proposedExchange.medicine.commercialName) {
            console.log("Different commercial name:");
            console.log("Sugested amount: " + originalExchange.medicine.commercial_name);
            console.log("Proposed amount: " + proposedExchange.medicine.commercialName);
            return false;
        } else {
            //console.log("Equals");
        }
        //PHARMA INDUSTRY
        if (originalExchange.medicine.pharma_industry && originalExchange.medicine.pharma_industry.length > 0
            && !originalExchange.medicine.pharma_industry.includes(proposedExchange.medicine.pharmaIndustry)) {
            return false;
        } else {
            //console.log("Pharma Industries found equality.")
        }

        //CONCENTRATION
        if (originalExchange.medicine.concentration !== proposedExchange.medicine.concentration) {
            console.log("Different concentrations:");
            console.log("Sugested concentration: " + originalExchange.medicine.concentration);
            console.log("Proposed concentration: " + proposedExchange.medicine.concentration);
            return false;
        } else {
            //console.log("Concentrations found equality.");
        }

        //PHARMA FORM
        if (originalExchange.medicine.pharma_form !== proposedExchange.medicine.pharmaForm) {
            console.log("Different pharma forms:");
            console.log("Sugested pharma form: " + originalExchange.medicine.pharma_form);
            console.log("Proposed pharma form: " + proposedExchange.medicine.pharmaForm);
            return false;
        } else {
            //console.log("Pharma forms found equality.");
        }

        //REF VALUE
        if (originalExchange.medicine.ref_value !== proposedExchange.medicine.refValue) {
            console.log("Different reference values:");
            console.log("Sugested reference value: " + originalExchange.medicine.ref_value);
            console.log("Proposed reference value: " + proposedExchange.medicine.refValue);
            return false;
        } else {
            //console.log("Reference values found equality.");
        }

        //MEDICINE BATCH
        let originalMedicineBatchItem : IMedicineBatchJson;
        let proposedMedicineBatchItem : MedicineBatch;
        let found : boolean;
        for(originalMedicineBatchItem of originalExchange.medicine.medicine_batch) {
            found = false;
            for(proposedMedicineBatchItem of proposedExchange.medicine.medicineBatch) {
                if(proposedMedicineBatchItem.amount === originalMedicineBatchItem.amount &&
                    proposedMedicineBatchItem.batch === originalMedicineBatchItem.batch &&
                    proposedMedicineBatchItem.expireDate === originalMedicineBatchItem.expire_date) {
                        //console.log("Matched medicine batch itens:")
                        //console.log(proposedMedicineBatchItem.batch);
                        //console.log(originalMedicineBatchItem.batch);
                        //console.log(proposedMedicineBatchItem.amount);
                        //console.log(originalMedicineBatchItem.amount);
                        //console.log(proposedMedicineBatchItem.expireDate);
                        //console.log(originalMedicineBatchItem.expire_date);
                        found = true;
                    }
            }
            if(!found) {
                console.log("Different medicine batchs.");
                return false;
            }
        }
        //console.log("Medicine batchs found equality.");

        return true;
    }

    /**
     * Auxiliar method that goes inside the medicine and validate its fields,
     * comparing the inicial trade and the proposed medicine
     * @param proposedMedicine the proposed medicine
     * @param originalMedicine the initial trade - request or offer
     */
    private validateProposedMedicine(proposedMedicine: MedicineProposedToOffer, originalMedicine: IMedicineRequestClaPharmIndJson): boolean {
        if (originalMedicine.active_ingredient !== proposedMedicine.activeIngredient) {
            return false;
        }
        if (originalMedicine.classification && originalMedicine.classification.length > 0
            && !originalMedicine.classification.includes(proposedMedicine.classification)) {
            return false;
        }

        if (originalMedicine.commercial_name && originalMedicine.commercial_name !== ''
            && originalMedicine.commercial_name !== proposedMedicine.commercialName) {
            return false;
        }

        if (originalMedicine.pharma_industry && originalMedicine.pharma_industry.length > 0
            && !originalMedicine.pharma_industry.includes(proposedMedicine.pharmaIndustry)) {
            return false;
        }

        if (originalMedicine.concentration !== proposedMedicine.concentration) {
            return false;
        }

        if (originalMedicine.pharma_form !== proposedMedicine.pharmaForm) {
            return false;
        }

        return true;
    }

    /**
     * Auxiliar method that goes inside the medicine and validate its fields,
     * comparing the inicial offer and the proposed medicine
     * @param proposedMedicine the proposed medicine
     * @param originalMedicine the initial trade - request or offer
     */
    private validateProposedOfferMedicine(proposedMedicine: MedicineProposedToOffer, originalMedicine: IMedicineOfferClaPharmIndJson): boolean {
        if (originalMedicine.active_ingredient !== proposedMedicine.activeIngredient) {
            return false;
        }
        if (originalMedicine.classification && originalMedicine.classification.length > 0
            && !originalMedicine.classification.includes(proposedMedicine.classification)) {
            return false;
        }

        if (originalMedicine.commercial_name && originalMedicine.commercial_name !== ''
            && originalMedicine.commercial_name !== proposedMedicine.commercialName) {
            return false;
        }

        if (originalMedicine.pharma_industry && originalMedicine.pharma_industry.length > 0
            && !originalMedicine.pharma_industry.includes(proposedMedicine.pharmaIndustry)) {
            return false;
        }

        if (originalMedicine.concentration !== proposedMedicine.concentration) {
            return false;
        }

        if (originalMedicine.pharma_form !== proposedMedicine.pharmaForm) {
            return false;
        }

        return true;
    }

    /**
     * Auxiliar method that indicates if the input reach a valid and approved
     * medicine trade. A medicine trade can be request or offer
     * @param ctx Context of operation
     * @param approveProposeMedicineJson the json with the information to be
     * used
     */
    private async existsMedicineTradeStatusApproved(ctx: Context, approveProposeMedicineJson: string): Promise<boolean> {
        this.medicineTrade = await this.searchMedicineApproved(ctx, approveProposeMedicineJson);

        if (!this.medicineTrade) { 
            //Entrou no erro pra dizer que não achou o ID
            return false;
        }
        return true;
    }

    /**
     * Auxiliar method that indicates if the id reach a valid 
     * medicine trade. A medicine trade can be request or offer
     * @param ctx Context of operation
     * @param tradeId the id
     */
    private async searchProposeMedicineById(ctx: Context, tradeId: string, statusOffer: string)
        : Promise<IMedicineProposedLedgerJson[]> {

        // Creates QueryJson of couchDB index query
        const queryJson = {
            selector: {
                id: tradeId,
                status: statusOffer,
            },
        };

        // Getting query result
        const iterator: Iterators.StateQueryIterator = await ctx.stub.getQueryResult(JSON.stringify(queryJson));
        const result: IMedicineProposedLedgerJson[] = await this.getOfferMedicineByRequesId(iterator);
        return result;
    }

    /**
     * Auxiliar method that's iterate over an interator of offer medicine request to retrieve the query result.
     * @param iterator iterator
     */
    private async getOfferMedicineByRequesId(iterator: Iterators.StateQueryIterator)
        : Promise<IMedicineProposedLedgerJson[]> {
        const medicineOfferedRequestJson: IMedicineProposedLedgerJson[] =
            new Array<IMedicineProposedLedgerJson>();
        let offer: IMedicineProposedLedgerJson;

        while (true) {
            const result = await iterator.next();

            if (result.value && result.value.value.toString()) {
                offer = JSON.parse(result.value.value.toString('utf8')) as IMedicineProposedLedgerJson;
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
