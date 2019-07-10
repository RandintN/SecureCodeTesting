import { Context } from 'fabric-contract-api';
import { MedicineDomain } from '../medicine-abstract/medicine-domain';
import { MedicineClassificationDomain } from '../medicine-classification/medicine-classification-domain';
import { PharmaceuticalIndustryDomain } from '../pharmaceutical-industry/pharmaceutical-industry-domain';
import { ValidationResult } from '../validation/validation-model';
import { MedicineModel } from '../medicine/medicine-model';
import { ChaincodeResponse } from 'fabric-shim';
import { ResponseUtil } from '../result/response-util';
import { CommonConstants } from '../utils/common-messages';
import { RequestMode, MedicineStatusEnum } from '../utils/enums';
import { Result } from '../result/result';
import { ExchangeDomain } from '../exchange/exchange-domain';
import { NegotiationModalityDomain } from '../negotiation-modality/negotiation-modality-domain';
import { ValidationError } from '../validation/validation-error-model';
import { IMedicineOfferLedgerJson } from './medicine-offer-ledger-json';
import { IMedicineOfferJson } from './medicine-offer-json';
import { MedicineOffer } from './medicine-offer-model';

export class MedicineOfferDomain extends MedicineDomain {

    private static MED_OFFER_PD: string = 'MED-OFFER-PD';
    private static ERROR_INVALID_TYPE: ValidationError =
        new ValidationError('MOD-001', 'Type is invalid. Choose between loan, exchange and donation.');
    private static ERROR_INVALID_OFFER: ValidationError =
        new ValidationError('MOD-002', 'offer_id is invalid. Please insert a number.');
    private static ERROR_NEGOTIATION_IS_NEEDED: ValidationError =
        new ValidationError('MOD-003',
            'When the negotiation have a type as exchange one or more exchange is necessary.');

    public async addMedicineOffer(ctx: Context, medJsonIn: string): Promise<ChaincodeResponse> {

        try {

            const medicineOffer: MedicineOffer = new MedicineOffer();
            medicineOffer.fromJson(JSON.parse(medJsonIn) as IMedicineOfferJson);

            console.log(medicineOffer.medicine.activeIngredient);
            console.log(medicineOffer.medicine.pharmaForm);
            console.log(medicineOffer.medicine.concentration);

            const validationResult: ValidationResult = await
                this.validateMedicineOfferRules(ctx, medicineOffer);

            if (!validationResult.isValid) {
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(validationResult.errors)));
            }

            //const idRequest: string = Guid.create().toString();
            const idRequest: string = medicineOffer.offer_id;

            if (medicineOffer.type.toLocaleLowerCase() === RequestMode.EXCHANGE) {
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

    public async isValid(ctx: Context, medicine: MedicineModel): Promise<ValidationResult> {
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

    private async validateClassification(ctx: Context, medicine: MedicineModel):
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

    private async validatePharmaceuticalIndustries(ctx: Context, medicine: MedicineModel):
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
}
