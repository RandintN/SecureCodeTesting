import { Context } from 'fabric-contract-api';
import { ChaincodeResponse, Shim } from 'fabric-shim';
import { Guid } from 'guid-typescript';
import { ActiveIngredientDomain } from '../active-ingredient/active-ingredient-domain';
import { MedicineClassificationDomain } from '../medicine-classification/medicine-classification-domain';
import { MedicineClassification } from '../medicine-classification/medicine-classification-model';
import { NegotiationModalityDomain } from '../negotiation-modality/negotiation-modality-domain';
import { NegotiationModality } from '../negotiation-modality/negotiation-modality-model';
import { PharmaceuticalFormDomain } from '../pharmaceutical-form/pharmaceutical-form-domain';
import { PharmaceuticalForm } from '../pharmaceutical-form/pharmaceutical-form-model';
import { PharmaceuticalIndustryDomain } from '../pharmaceutical-industry/pharmaceutical-industry-domain';
import { PharmaceuticalIndustry } from '../pharmaceutical-industry/pharmaceutical-industry-model';
import { ResponseUtil } from '../result/response-util';
import { Result } from '../result/result';
import { CommonMessages } from '../utils/common-messages';
import { ResponseCodes, SituationEnum } from '../utils/enums';
import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { MedicineOffer } from './medicine-offer-model';
import { IMedicineRequestService } from './medicine-request-interface';
import { IMedicineRequestJson } from './medicine-request-json';
import { MedicineRequest } from './medicine-request-model';

export class MedicineRequestDomain implements IMedicineRequestService {

    //#region constants

    private static ERROR_MEDICINE_CLASSIFICATION_NOT_FOUND: ValidationError =
        new ValidationError('MRD-003', 'The medicine_classification is not found.');

    private static ERROR_MEDICINE_CLASSIFICATION_INACTIVATED: ValidationError =
        new ValidationError('MRD-004', 'The medicine_classification is not active for negotiation.');

    private static ERROR_PHARMACEUTICAL_INDUSTRY_NOT_FOUND: ValidationError =
        new ValidationError('MRD-005', 'The pharmaceutical_industry is not found.');

    private static ERROR_PHARMACEUTICAL_INDUSTRY_INACTIVATED: ValidationError =
        new ValidationError('MRD-006', 'The pharmaceutical_industry is not active for negotiation.');

    private static ERROR_NEGOTIATION_MODALITY_NOT_FOUND: ValidationError =
        new ValidationError('MRD-007', 'The type is not found.');

    private static ERROR_NEGOTIATION_MODALITY_INACTIVATED: ValidationError =
        new ValidationError('MRD-008', 'The type is not active for negotiation.');

    private static ERROR_PHARMACEUTICAL_FORM_NOT_FOUND: ValidationError =
        new ValidationError('MRD-009', 'The pharma_form is not found.');

    private static ERROR_PHARMACEUTICAL_FORM_INACTIVATED: ValidationError =
        new ValidationError('MRD-010', 'The pharma_form is not active for negotiation.');

    private static MED_REQUEST_PD: string = 'MED-REQUEST-PD';

    //#endregion

    //#region region of methods to be invoked
    public async addMedicineRequest(ctx: Context, medRequestJson: string): Promise<ChaincodeResponse> {
        try {
            const medicineRequest: MedicineRequest = new MedicineRequest();

            medicineRequest.fromJson(JSON.parse(medRequestJson) as IMedicineRequestJson);

            const validationResult: ValidationResult = await
                this.validateMedicineRequestRules(ctx, medicineRequest);

            if (validationResult.errors.length > 0) {
                return ResponseUtil.ResponseBadRequest(CommonMessages.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(validationResult)));
            }

            const idRequest: Guid = Guid.create();
            await ctx.stub.putPrivateData(MedicineRequestDomain.MED_REQUEST_PD,
                idRequest.toString(), Buffer.from(medRequestJson));

            const timestamp: number = new Date().getTime();

            const result: Result = new Result();

            result.id = idRequest;
            result.timestamp = timestamp;

            return ResponseUtil.ResponseCreated(Buffer.from(JSON.stringify(Result)));
        } catch (error) {
            return ResponseUtil.ResponseError(error, undefined);
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

        // Make basic validations
        const medicineBasicValidation: ValidationResult = medicineRequest.isValid();

        if (!medicineBasicValidation.isValid) {
            return medicineBasicValidation;
        }

        // Make validation of active ingredient of medicine that's requested
        const activeIngredientValidation: ValidationResult =
            await this.validateActiveIngredientOfMedicineRequest(ctx, medicineRequest);

        if (!activeIngredientValidation.isValid) {
            validationResult.addErrors(activeIngredientValidation.errors);

        }

        // Make validation of active ingredient of medicines that is offerred
        const activeIngredientValidationOfMedicineExchange: ValidationResult =
            await this.validateActiveIngredientOfMedicineExchange(ctx, medicineRequest);

        if (!activeIngredientValidationOfMedicineExchange.isValid) {
            validationResult.addErrors(activeIngredientValidationOfMedicineExchange.errors);

        }

        // Make validation of active ingredient of medicine that's requested
        const activeNegotiationModalityValidation: ValidationResult =
            await this.validateRequestNegotiationModality(ctx, medicineRequest);

        if (!activeNegotiationModalityValidation.isValid) {
            validationResult.addErrors(activeNegotiationModalityValidation.errors);

        }

        // Make validation of active ingredient of medicine that's requested
        const pharmaceuticalIndustryExchangeValidation: ValidationResult =
            await this.validatePharmaceuticalIndustryOfMedicineExchange(ctx, medicineRequest);

        if (!pharmaceuticalIndustryExchangeValidation.isValid) {
            validationResult.addErrors(pharmaceuticalIndustryExchangeValidation.errors);

        }

        const pharmaceuticalIndustryValidation: ValidationResult =
            await this.validatePharmaceuticalIndustriesOfMedicineRequest(ctx, medicineRequest);

        if (!pharmaceuticalIndustryValidation.isValid) {
            validationResult.addErrors(pharmaceuticalIndustryValidation.errors);

        }

        // Make validation of active ingredient of medicine that's requested
        const pharmaceuticalFormValidation: ValidationResult =
            await this.validateRequestPharmaceuticalPhorm(ctx, medicineRequest);

        if (!pharmaceuticalFormValidation.isValid) {
            validationResult.addErrors(pharmaceuticalFormValidation.errors);

        }

        validationResult.isValid = validationResult.errors.length < 1;
        return validationResult;
    }

    //#endregion

    //#region validations of active-ingrendient
    private async validateActiveIngredientOfMedicineRequest(ctx: Context, medicineRequest: MedicineRequest):
        Promise<ValidationResult> {
        let validationResult: ValidationResult;
        const activeIngredientDomain: ActiveIngredientDomain = new ActiveIngredientDomain();

        try {
            validationResult = await activeIngredientDomain.
                validateActiveIngredient(ctx, medicineRequest.medicine.activeIngredient);

        } catch (error) {
            throw error;
        }

        validationResult.isValid = validationResult.errors.length < 1;
        return validationResult;

    }

    private async validateActiveIngredientOfMedicineExchange(ctx: Context, medicineRequest: MedicineRequest):
        Promise<ValidationResult> {
        const validationResult: ValidationResult = new ValidationResult();
        const activeIngredientDomain: ActiveIngredientDomain = new ActiveIngredientDomain();

        try {
            for (const medicineExchange of medicineRequest.exchange) {
                const mEValidationResult: ValidationResult =
                    await activeIngredientDomain.
                        validateActiveIngredient(ctx, medicineExchange.medicine.activeIngredient);

                if (!mEValidationResult.isValid) {
                    validationResult.addErrors(mEValidationResult.errors);

                }

            }
        } catch (error) {
            throw error;
        }

        validationResult.isValid = validationResult.errors.length < 1;
        return validationResult;

    }

    //#endregion

    //#region validations of medicine-classification
    private async validateRequestMedicineClassifications(ctx: Context, medicineRequest: MedicineRequest):
        Promise<ValidationResult> {
        const validationResult: ValidationResult = new ValidationResult();

        try {
            // Validate the classification of medicine requested (when it is set)
            if (medicineRequest.medicine.classification !== null &&
                medicineRequest.medicine.classification !== undefined &&
                medicineRequest.medicine.classification.length > 0) {
                const medicineOfferValidation: ValidationResult = await
                    this.validateMedicineRequestClassification(ctx, medicineRequest.medicine);

                if (!medicineOfferValidation.isValid) {
                    validationResult.addErrors(medicineOfferValidation.errors);
                }

            }

            // Validate the classification of all medicine of exchange
            for (const exchande of medicineRequest.exchange) {
                const validationExchangeResult: ValidationResult = await
                    this.validateMedicineClassification(ctx, exchande.medicine.classification);

                if (!validationExchangeResult.isValid) {
                    validationResult.addErrors(validationExchangeResult.errors);
                }
            }

        } catch (error) {
            throw error;
        }

        validationResult.isValid = validationResult.errors.length < 1;
        return validationResult;
    }

    private async validateMedicineRequestClassification(ctx: Context, medicineOffer: MedicineOffer):
        Promise<ValidationResult> {
        const validationResult: ValidationResult = new ValidationResult();

        try {
            for (const classification of medicineOffer.classification) {
                const medicineClassificationValidation: ValidationResult = await
                    this.validateMedicineClassification(ctx, classification);

                if (!medicineClassificationValidation.isValid) {
                    validationResult.addErrors(medicineClassificationValidation.errors);

                }
            }

        } catch (error) {
            throw error;
        }

        validationResult.isValid = validationResult.errors.length < 1;
        return validationResult;

    }

    private async validateMedicineClassification(ctx: Context, classification: string):
        Promise<ValidationResult> {
        const validationResult: ValidationResult = new ValidationResult();
        const medicineClassificationDomain: MedicineClassificationDomain = new MedicineClassificationDomain();

        try {
            const medicineClassification: MedicineClassification = await medicineClassificationDomain.
                getMedicineClassificationByCategory(ctx, classification);

            if (medicineClassification === null || medicineClassification === undefined) {
                validationResult.errors.push(MedicineRequestDomain.ERROR_MEDICINE_CLASSIFICATION_NOT_FOUND);

            } else if (medicineClassification.situation === SituationEnum.INACTIVE) {
                validationResult.errors.push(MedicineRequestDomain.
                    ERROR_MEDICINE_CLASSIFICATION_INACTIVATED);

            }

        } catch (error) {
            throw error;
        }

        validationResult.isValid = validationResult.errors.length < 1;
        return validationResult;

    }

    //#endregion

    //#region validations of pharmaceutical-phorm
    private async validateRequestPharmaceuticalPhorm(ctx: Context, medicineRequest: MedicineRequest):
        Promise<ValidationResult> {
        const validationResult: ValidationResult = new ValidationResult();

        try {
            // Validate pharmaceutical phorm of medicine requested
            const medicineOfferValidation: ValidationResult = await
                this.validatePharmaceuticalPhorm(ctx, medicineRequest.medicine.pharmaForm);

            if (!medicineOfferValidation.isValid) {
                validationResult.addErrors(medicineOfferValidation.errors);

            }

            // Validate pharmaceutical phorm of all medicine of exchange
            for (const exchande of medicineRequest.exchange) {
                const validationExchangeResult: ValidationResult = await
                    this.validateMedicineClassification(ctx, exchande.medicine.pharmaForm);

                if (!validationExchangeResult.isValid) {
                    validationResult.addErrors(validationExchangeResult.errors);

                }

            }

        } catch (error) {
            throw error;
        }

        validationResult.isValid = validationResult.errors.length < 1;
        return validationResult;

    }

    private async validatePharmaceuticalPhorm(ctx: Context, strPharmaceuticalPhorm: string):
        Promise<ValidationResult> {
        const validationResult: ValidationResult = new ValidationResult();
        const pharmaceuticalPhormDomain: PharmaceuticalFormDomain = new PharmaceuticalFormDomain();

        try {
            const pharmaceuticalForm: PharmaceuticalForm = await pharmaceuticalPhormDomain.
                getPharmaceuticalFormByForm(ctx, strPharmaceuticalPhorm);

            if (pharmaceuticalForm === null || pharmaceuticalForm === undefined) {
                validationResult.errors.push(MedicineRequestDomain.ERROR_PHARMACEUTICAL_FORM_NOT_FOUND);

            } else if (pharmaceuticalForm.situation === SituationEnum.INACTIVE) {
                validationResult.errors.push(MedicineRequestDomain.
                    ERROR_PHARMACEUTICAL_FORM_INACTIVATED);

            }

        } catch (error) {
            throw error;
        }

        validationResult.isValid = validationResult.errors.length < 1;
        return validationResult;

    }

    //#endregion

    //#region validations of pharmaceutical-industry
    private async validatePharmaceuticalIndustriesOfMedicineRequest(ctx: Context, medicineRequest: MedicineRequest):
        Promise<ValidationResult> {
        const validationResult: ValidationResult = new ValidationResult();

        try {
            if (medicineRequest.medicine.pharmaIndustry !== null &&
                medicineRequest.medicine.pharmaIndustry !== undefined &&
                medicineRequest.medicine.pharmaIndustry.length > 0) {
                for (const pharmaIndustry of medicineRequest.medicine.pharmaIndustry) {
                    const pharmaIndustryValidationResult: ValidationResult =
                        await this.validatePharmaceuticalIndustry(ctx, pharmaIndustry);

                    if (!pharmaIndustryValidationResult.isValid) {
                        validationResult.addErrors(pharmaIndustryValidationResult.errors);

                    }

                }
            }

        } catch (error) {
            throw error;
        }

        validationResult.isValid = validationResult.errors.length < 1;
        return validationResult;

    }

    private async validatePharmaceuticalIndustryOfMedicineExchange(ctx: Context, medicineRequest: MedicineRequest):
        Promise<ValidationResult> {
        const validationResult: ValidationResult = new ValidationResult();

        try {
            for (const medicineExchange of medicineRequest.exchange) {
                const mEValidationResult: ValidationResult =
                    await this.validatePharmaceuticalIndustry(ctx, medicineExchange.medicine.pharmaIndustry);

                if (!mEValidationResult.isValid) {
                    validationResult.addErrors(mEValidationResult.errors);

                }
            }

        } catch (error) {
            throw error;
        }

        validationResult.isValid = validationResult.errors.length < 1;
        return validationResult;

    }

    private async validatePharmaceuticalIndustry(ctx: Context, pharmaIndustry: string):
        Promise<ValidationResult> {
        const validationResult: ValidationResult = new ValidationResult();
        const pharmaceuticalIndustryDomain: PharmaceuticalIndustryDomain = new PharmaceuticalIndustryDomain();

        try {
            const pharmaceuticalIndustry: PharmaceuticalIndustry = await pharmaceuticalIndustryDomain.
                getPharmaceuticalIndustryByName(ctx, pharmaIndustry);

            if (!pharmaceuticalIndustry) {
                validationResult.errors.push(MedicineRequestDomain.ERROR_PHARMACEUTICAL_INDUSTRY_NOT_FOUND);
                validationResult.isValid = false;
                return validationResult;
            }

            if (pharmaceuticalIndustry.situation !== SituationEnum.ACTIVE) {
                validationResult.errors.push(MedicineRequestDomain.ERROR_PHARMACEUTICAL_INDUSTRY_INACTIVATED);
                validationResult.isValid = false;
                return validationResult;
            }

        } catch (error) {
            throw error;
        }

        validationResult.isValid = validationResult.errors.length < 1;
        return validationResult;

    }
    //#endregion

    //#region validations of negotiation-modality
    private async validateRequestNegotiationModality(ctx: Context, medicineRequest: MedicineRequest):
        Promise<ValidationResult> {
        const validationResult: ValidationResult = new ValidationResult();

        try {
            for (const modality of medicineRequest.type) {
                const modalityValidationResult: ValidationResult =
                    await this.validateNegotiationModality(ctx, modality);

                if (!modalityValidationResult.isValid) {
                    validationResult.addErrors(modalityValidationResult.errors);

                }

            }

        } catch (error) {
            throw error;
        }

        validationResult.isValid = validationResult.errors.length < 1;
        return validationResult;

    }

    private async validateNegotiationModality(ctx: Context, modality: string):
        Promise<ValidationResult> {
        const validationResult: ValidationResult = new ValidationResult();
        const negotiationModalityDomain: NegotiationModalityDomain = new NegotiationModalityDomain();

        try {
            const negotiationModality: NegotiationModality = await negotiationModalityDomain.
                getNegotiationModalityByModality(ctx, modality);

            if (negotiationModality === null || negotiationModality === undefined) {
                validationResult.errors.push(MedicineRequestDomain.ERROR_NEGOTIATION_MODALITY_NOT_FOUND);

            } else if (negotiationModality.situation === SituationEnum.INACTIVE) {
                validationResult.errors.push(MedicineRequestDomain.
                    ERROR_NEGOTIATION_MODALITY_INACTIVATED);

            }

        } catch (error) {
            throw error;
        }

        validationResult.isValid = validationResult.errors.length < 1;
        return validationResult;

    }

    //#endregion

}
