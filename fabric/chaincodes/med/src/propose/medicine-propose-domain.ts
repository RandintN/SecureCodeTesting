import { Context } from 'fabric-contract-api';
import { ChaincodeResponse, Iterators } from 'fabric-shim';
import { IMedicineRequestClaPharmIndJson } from '../medicine/medicine-initial-transaction-json';
import { MedicineProposedToOfferDomain } from '../medicine-proposed/medicine-proposed-to-offer-domain';
import { MedicineProposedToOffer } from '../medicine-proposed/medicine-proposed-to-offer-model';
import { IMedicineRequestJson as IMedicineBaseJson } from '../medicine-request/medicine-request-json';
import { ResponseUtil } from '../result/response-util';
import { Result } from '../result/result';
import { CommonConstants } from '../utils/common-messages';
import { DateExtension } from '../utils/date-extension';
import { MedicineProposedStatusEnum, MedicineStatusEnum, RequestMode, MedicineOperationEnum } from '../utils/enums';
import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IProposeApprovalJson } from './propose-approval-json';
import { IMedicineProposedService } from './medicine-propose-interface';
import { IMedicineProposedJson } from './medicine-proposed-json';
import { IMedicineProposedLedgerJson } from './medicine-proposed-ledger-json';
import { ProposeToOffer } from './propose-to-offer-model';
import { IMedicineQueryKey } from '../medicine/medicine-query-key';
import { MedicineProposedToRequestDomain } from '../medicine-proposed/medicine-proposed-to-request-domain';
import { ProposeToRequest } from './propose-to-request-model';

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

    /**
     * Method to send a medicine propose to the ledger.
     * @param ctx Context of operation
     * @param medicineProposedJson Data of the proposed medicine
     */
    public async proposeMedicine(ctx: Context, medicineProposedJson: string): Promise<ChaincodeResponse> {
        try {

            let validationTradeId: ValidationResult;
            validationTradeId = await this.loadTradeAndValidateId(ctx, medicineProposedJson
                );
            if (!validationTradeId.isValid) {
                //Entrou no erro do isValid
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(validationTradeId.errors)));
            }

            let validationProposeId: ValidationResult;
            validationProposeId = await this.identifyAndValidatePropose(ctx, medicineProposedJson);
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

        console.log("Propose Id da busca: " + proposeId)
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
    public async approveOfferMedicineRequest(ctx: Context, approveOfferMedicineRequestJson: string)
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

                    if (offer.propose_id === medicineOfferedApprove.propose_id) {
                        offer.status = MedicineProposedStatusEnum.ACCEPTED;
                        result.propose_id = offer.key;
                        result.id = this.medicineTrade.internal_id;
                    } else {
                        offer.status = MedicineProposedStatusEnum.REJECTED;
                        result.rejected_offers.push(offer.key);
                    }
                    await ctx.stub.putState(offer.key
                        , Buffer.from(JSON.stringify(offer)));
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
     * @param medicineProposed the informations of the proposed medicine
     */
    private async validateOfferProposedMedicineRules(ctx: Context, medicineProposed: ProposeToOffer)
        : Promise<ValidationResult> {

        const validationResult: ValidationResult = new ValidationResult();

        try {

            // Make basic validations
            //----------------------------
            //*Empty type
            //*If the operation is exchange
            //*Empty id
            //*Empty propose id
            //*Empty medicine
            // ---------------------------
            const medicineOfferedBasicValidation: ValidationResult = medicineProposed.isValid();

            if (!medicineOfferedBasicValidation.isValid) {
                return medicineOfferedBasicValidation;
            }

            //Try to get data with the trade id - internalId
            const result: Buffer = await ctx.stub.getState(medicineProposed.internalId);
            if (!result || result.length < 1) {
                validationResult.addError(MedicineProposeDomain.ERROR_MEDICINE_NOT_FOUND);
                return validationResult;
            }

            //The medicine trade can be both request or offer
            const medicineTrade: any = JSON.parse(result.toString());

            //Verify is the medicine is approved or waiting for approved
            if (medicineTrade.status !== MedicineStatusEnum.APPROVED) {
                validationResult.addError(MedicineProposeDomain.ERROR_MEDICINE_NOT_FOUND);
                return validationResult;
            }

            //Comparing type
            if (medicineProposed.type !== medicineTrade.type) {
                validationResult.addError(
                MedicineProposeDomain.ERROR_OFFERED_TYPE_NOT_EQUAL_PROPOSED_TYPE);
                
                return validationResult;
            }

            //Comparing return date
            if (medicineProposed.type.toLocaleLowerCase() === RequestMode.LOAN) {
                if (medicineProposed.newReturnDate) {
                    const dateExtension: DateExtension = new DateExtension();
                    if (!dateExtension.validateDate(medicineProposed.newReturnDate, validationResult)) {
                        return validationResult;
                    }
                    if (Date.parse(medicineProposed.newReturnDate) === Date.parse(medicineTrade.return_date)) {
                        validationResult.addError(
                            MedicineProposeDomain.ERROR_NEW_RETURN_DATE_EQUAL_RETURN_DATE);
                        return validationResult;
                    }
                }
            }

            //The medicine of the propose offer
            const medicineProposedDomain: MedicineProposedToOfferDomain = new MedicineProposedToOfferDomain();
            
            const medicineProposedValidation: ValidationResult =
                await medicineProposedDomain.isValid(ctx, medicineProposed.medicine);

            if (!medicineProposedValidation.isValid) {
                validationResult.addErrors(medicineProposedValidation.errors);
                return validationResult;
            }

            if (!this.validateProposedMedicine(medicineProposed.medicine, medicineTrade.medicine)) {
                validationResult.addError(
                MedicineProposeDomain.ERROR_MEDICINE_PROPOSE_IS_NOT_EQUAL_MEDICINE_OFFER);
            }

            if (!medicineTrade.amount.includes(medicineProposed.medicine.amount)) {
                
                validationResult.addError(
                MedicineProposeDomain.ERROR_AMOUNT_MEDICINE_PROPOSE_IS_NOT_EQUAL_AMOUNT_MEDICINE_OFFER);

                return validationResult;
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
     * @param medicineProposed the informations of the proposed medicine
     */
    private async validateRequestProposedMedicineRules(ctx: Context, medicineProposed: ProposeToRequest)
        : Promise<ValidationResult> {

        const validationResult: ValidationResult = new ValidationResult();

        try {

            // Make basic validations
            //----------------------------
            //*Empty type
            //*If the operation is exchange
            //*Empty id
            //*Empty propose id
            //*Empty medicine
            // ---------------------------
            const medicineOfferedBasicValidation: ValidationResult = medicineProposed.isValid();

            if (!medicineOfferedBasicValidation.isValid) {
                return medicineOfferedBasicValidation;
            }

            //Try to get data with the trade id - internalId
            const result: Buffer = await ctx.stub.getState(medicineProposed.internalId);
            if (!result || result.length < 1) {
                validationResult.addError(MedicineProposeDomain.ERROR_MEDICINE_NOT_FOUND);
                return validationResult;
            }

            //The medicine trade can be both request or offer
            const medicineTrade: any = JSON.parse(result.toString());

            //Verify is the medicine is approved or waiting for approved
            if (medicineTrade.status !== MedicineStatusEnum.APPROVED) {
                validationResult.addError(MedicineProposeDomain.ERROR_MEDICINE_NOT_FOUND);
                return validationResult;
            }

            //Comparing type
            if (medicineProposed.type !== medicineTrade.type) {
                validationResult.addError(
                        MedicineProposeDomain.ERROR_REQUESTED_TYPE_NOT_EQUAL_PROPOSED_TYPE);
                
                return validationResult;
            }

            //Comparing return date
            if (medicineProposed.type.toLocaleLowerCase() === RequestMode.LOAN) {
                if (medicineProposed.newReturnDate) {
                    const dateExtension: DateExtension = new DateExtension();
                    if (!dateExtension.validateDate(medicineProposed.newReturnDate, validationResult)) {
                        return validationResult;
                    }
                    if (Date.parse(medicineProposed.newReturnDate) === Date.parse(medicineTrade.return_date)) {
                        validationResult.addError(
                            MedicineProposeDomain.ERROR_NEW_RETURN_DATE_EQUAL_RETURN_DATE);
                        return validationResult;
                    }
                }
            }

            //The medicine of the propose request
            const medicineProposedDomain: MedicineProposedToRequestDomain= new MedicineProposedToRequestDomain();
            
            const medicineProposedValidation: ValidationResult =
                await medicineProposedDomain.isValid(ctx, medicineProposed.medicine);

            if (!medicineProposedValidation.isValid) {
                validationResult.addErrors(medicineProposedValidation.errors);
                return validationResult;
            }

            if (!this.validateProposedMedicine(medicineProposed.medicine, medicineTrade.medicine)) {
                validationResult.addError(
                MedicineProposeDomain.ERROR_MEDICINE_PROPOSE_IS_NOT_EQUAL_MEDICINE_REQUEST);
            }

            if (!medicineTrade.amount.includes(medicineProposed.medicine.amount)) {
                validationResult.addError(
                MedicineProposeDomain.ERROR_AMOUNT_MEDICINE_PROPOSE_IS_NOT_EQUAL_AMOUNT_MEDICINE_REQUEST); 

                return validationResult;
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

            }

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
            this.medicineProposed.fromJson(JSON.parse(medicineProposedJson) as IMedicineProposedJson);

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

        // Creates the query of couchdb
        const queryJson = {
            selector:{
                id: query.id,
                status: MedicineStatusEnum.APPROVED
            }
        };

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
