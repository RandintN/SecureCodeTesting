import { Context } from 'fabric-contract-api';
import { MedicineDomain } from '../medicine-abstract/medicine-domain';
import { MedicineClassificationDomain } from '../medicine-classification/medicine-classification-domain';
import { PharmaceuticalIndustryDomain } from '../pharmaceutical-industry/pharmaceutical-industry-domain';
import { ValidationResult } from '../validation/validation-model';
import { ChaincodeResponse } from 'fabric-shim';
import { ResponseUtil } from '../result/response-util';
import { CommonConstants } from '../utils/common-messages';
import { RequestMode, MedicineStatusEnum } from '../utils/enums';
import { Result } from '../result/result';
import { ExchangeDomain } from '../exchange/exchange-domain';
import { NegotiationModalityDomain } from '../negotiation-modality/negotiation-modality-domain';
import { ValidationError } from '../validation/validation-error-model';
import { IMedicineOfferLedgerJson } from './medicine-offer-ledger-json';
import { MedicineOffer } from './medicine-offer-model';
import { MedicineOfferModel } from './medicine-offer-model-base';
import { IMedicineOfferJson } from './medicine-offer-json';
import moment = require('moment');

export class MedicineOfferDomain extends MedicineDomain {

    private static MED_OFFER_PD: string = 'MED-OFFER-PD';
    private static ERROR_INVALID_TYPE: ValidationError =
        new ValidationError('MOD-001', 'Type is invalid. Choose between loan, exchange and donation.');
    private static ERROR_INVALID_OFFER: ValidationError =
        new ValidationError('MOD-002', 'offer_id is invalid. Please insert a number.');
    private static ERROR_NEGOTIATION_IS_NEEDED: ValidationError =
        new ValidationError('MOD-003',
            'When the negotiation have a type as exchange one or more exchange is necessary.');
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
    private static ERROR_DUPLICATE_BATCH: ValidationError =
    new ValidationError('MOD-010', 'The parameter batch is cannot be repeated.');
    private static ERROR_YEAR: ValidationError =
    new ValidationError('MOD-011', 'The year cannot be before the current.');
    private static ERROR_MONTH: ValidationError =
    new ValidationError('MOD-012', 'The month must be after the current.');
    private static ERROR_DUPLICATE_EXPIRE_DATE: ValidationError =
    new ValidationError('MOD-013', 'The parameter expire_date of medicine_batch cannot be repeated.');

    public async addMedicineOffer(ctx: Context, medJsonIn: string): Promise<ChaincodeResponse> {

        try {

            const medicineOffer: MedicineOffer = new MedicineOffer();
            medicineOffer.fromJson(JSON.parse(medJsonIn) as IMedicineOfferJson);

            const validationResult: ValidationResult = await
                this.validateMedicineOfferRules(ctx, medicineOffer);

            if (!validationResult.isValid) {
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(validationResult.errors)));
            }

            //const idRequest: string = Guid.create().toString();
            const idRequest: string = medicineOffer.offer_id;

            if (medicineOffer.type.toLocaleLowerCase() === RequestMode.EXCHANGE
            || medicineOffer.type.toLocaleLowerCase() === RequestMode.DONATION) {
                const medicineOfferToLedger: IMedicineOfferLedgerJson =
                    medicineOffer.toJson() as IMedicineOfferLedgerJson;

                    medicineOfferToLedger.msp_id = ctx.clientIdentity.getMSPID().toUpperCase();

                await ctx.stub.putPrivateData(MedicineOfferDomain.MED_OFFER_PD,
                    idRequest, Buffer.from(JSON.stringify(medicineOfferToLedger)));
            } else {
                medicineOffer.status = MedicineStatusEnum.APPROVED;

                const medicineOfferToLedger: IMedicineOfferLedgerJson =
                medicineOffer.toJson() as IMedicineOfferLedgerJson;
                medicineOfferToLedger.msp_id = ctx.clientIdentity.getMSPID().toUpperCase();

                await ctx.stub.putState(idRequest, Buffer.from(JSON.stringify(medicineOfferToLedger)));

            }

            const timestamp: number = new Date().getTime();
            const result: Result = new Result();

            result.offer_id = idRequest;
            result.timestamp = timestamp;

            console.log('Medicine Offer Id: ' + result.offer_id);

            return ResponseUtil.ResponseCreated(Buffer.from(JSON.stringify(result)));
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
     * @param medicineOffer MedicineRequest that will be verified
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

            if (medicineOffer.type.toLocaleLowerCase() !== RequestMode.DONATION &&
            medicineOffer.type.toLocaleLowerCase() !== RequestMode.EXCHANGE &&
            medicineOffer.type.toLocaleLowerCase() !== RequestMode.LOAN
            ) {
                validationResult.addError(MedicineOfferDomain.ERROR_INVALID_TYPE);

            }

            offerIdAsNumber = parseInt(medicineOffer.offer_id);
            if (isNaN(offerIdAsNumber)) {
                validationResult.addError(MedicineOfferDomain.ERROR_INVALID_OFFER);
            }

            if (medicineOffer.type.toLocaleLowerCase() === RequestMode.EXCHANGE) {
                if (!medicineOffer.exchange || medicineOffer.exchange.length < 1) {
                    validationResult.addError(MedicineOfferDomain.ERROR_NEGOTIATION_IS_NEEDED);

                } else {
                    const exchangeDomain: ExchangeDomain = new ExchangeDomain();

                    for (const exchange of medicineOffer.exchange) {
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
                let batchList : string[] = [];
                let expireDateList : string[] = [];
                for(const medicineBatchItem of medicine.medicineBatch){
                    if(medicineBatchItem.batch.length>0 && batchList.includes(medicineBatchItem.batch)){
                        validationResult.addError(MedicineOfferDomain.ERROR_DUPLICATE_BATCH);
                    }
                    else{
                        batchList.push(medicineBatchItem.batch);
                    }
                    if(!medicineBatchItem.amount){
                        validationResult.addError(MedicineOfferDomain.ERROR_EMPTY_BATCH_AMOUNT);
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
                    //Expire date must be one month after the current.
                    let month : string = medicineBatchItem.expireDate.substr(0, 2);
                    let year : string = medicineBatchItem.expireDate.substr(3, 6);
                    let today : Date = new Date(moment().format('YYYY-MM-DD HH:mm:ss'));

                    if(today.getUTCFullYear()>Number(year)){
                        validationResult.addError(MedicineOfferDomain.ERROR_YEAR);
                    }

                    if(today.getUTCMonth()+1>=Number(month)){
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
