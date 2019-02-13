import { Context } from 'fabric-contract-api';
import { Guid } from 'guid-typescript';
import { ActiveIngredientDomain } from '../active-ingredient/active-ingredient-domain';
import { ActiveIngredient } from '../active-ingredient/active-ingredient-model';
import { MedicineClassificationDomain } from '../medicine-classification/medicine-classification-domain';
import { MedicineClassification } from '../medicine-classification/medicine-classification-model';
import { Result } from '../result/result';
import { SituationEnum } from '../utils/situation-enum';
import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { Medicine } from './medicine-model';
import { MedicineOffer } from './medicine-offer-model';
import { IMedicineRequestService } from './medicine-request-interface';
import { MedicineRequest } from './medicine-request-model';
import { PharmaceuticalFormDomain } from '../pharmaceutical-form/pharmaceutical-form-domain';
import { PharmaceuticalForm } from '../pharmaceutical-form/pharmaceutical-form-model';

export class MedicineRequestDomain implements IMedicineRequestService {

    //#region constants
    private static ERROR_ACTIVE_INGREDIENT_NOT_FOUND: ValidationError =
        new ValidationError('MRD-001', 'The active_ingredient is not found.');

    private static ERROR_ACTIVE_INGREDIENT_NOT_ALLOWED: ValidationError =
        new ValidationError('MRD-002', 'The active_ingredient is not allowed for negotiation.');

    private static ERROR_ACTIVE_MEDICINE_CLASSIFICATION_NOT_FOUND: ValidationError =
        new ValidationError('MRD-003', 'The medicine_classification is not found.');

    private static ERROR_ACTIVE_MEDICINE_CLASSIFICATION_INACTIVATED: ValidationError =
        new ValidationError('MRD-004', 'The medicine_classification is not allowed for negotiation.');

    //#endregion

    //#region region of methods to be invoked

    public async addMedicineRequest(ctx: Context, medRequestJson: string): Promise<string> {

        try {
            const medicineRequest: MedicineRequest = JSON.parse(medRequestJson);

            if (medicineRequest.isValid()) {
                return 'Deu certo a validação';
            }

            const validationResult: ValidationResult = await
                this.validateMedicineRequestRules(ctx, medicineRequest);

            if (!validationResult.isValid) {
                throw new Error(JSON.stringify(validationResult));
            }

            const idRequest: Guid = Guid.create();
            await ctx.stub.putPrivateData('N2miMSP-PD', idRequest.toString(), Buffer.from(medRequestJson));

            const timestamp: number = new Date().getTime();

            const result: Result = new Result();

            result.id = idRequest;
            result.timestamp = timestamp;

            return JSON.stringify(result);
        } catch (error) {
            return JSON.stringify(error);
        }
    }
    //#endregion

    //#region region of queries

    public async queryMedicineRequest(ctx: Context): Promise<string> {
        const requestAsByte = await ctx.stub.getPrivateData('N2miMSP-PD', 'test');
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
        const activeIngredientValidationOfMedicineRequest: ValidationResult =
            await this.validateActiveIngredientOfMedicineRequest(ctx, medicineRequest);

        if (!activeIngredientValidationOfMedicineRequest.isValid) {
            validationResult.errors.concat(activeIngredientValidationOfMedicineRequest.errors);
        }

        // Make validation of active ingredient of medicines that is offerred
        const activeIngredientValidationOfMedicineExchange: ValidationResult =
            await this.validateActiveIngredientOfMedicineExchange(ctx, medicineRequest);

        if (!activeIngredientValidationOfMedicineExchange.isValid) {
            validationResult.errors.concat(activeIngredientValidationOfMedicineExchange.errors);
        }

        validationResult.isValid = validationResult.errors.length < 1;
        return validationResult;

    }

    //#region validations of active-ingrendient
    private async validateActiveIngredientOfMedicineRequest(ctx: Context, medicineRequest: MedicineRequest) {
        let validationResult: ValidationResult;

        try {
            validationResult = await this.validateActiveIngredient(ctx, medicineRequest.medicine);
        } catch (error) {
            throw error;
        }

        return validationResult;

    }

    private async validateActiveIngredientOfMedicineExchange(ctx: Context, medicineRequest: MedicineRequest) {
        const validationResult: ValidationResult = new ValidationResult();

        try {
            for (const medicineExchange of medicineRequest.exchange) {
                const mEValidationResult: ValidationResult =
                    await this.validateActiveIngredient(ctx, medicineExchange.medicine);

                if (!mEValidationResult.isValid) {
                    validationResult.errors.concat(mEValidationResult.errors);
                }
            }
        } catch (error) {
            throw error;
        }

        validationResult.isValid = validationResult.errors.length < 1;
        return validationResult;

    }

    private async validateActiveIngredient(ctx: Context, medicine: Medicine) {
        const validationResult: ValidationResult = new ValidationResult();
        const activeIngredientDomain: ActiveIngredientDomain = new ActiveIngredientDomain();

        try {
            const activeIngredient: ActiveIngredient = await activeIngredientDomain.
                getActiveIngredientByName(ctx, medicine.activeIngredient);

            if (!activeIngredient) {
                validationResult.errors.push(MedicineRequestDomain.ERROR_ACTIVE_INGREDIENT_NOT_FOUND);
                validationResult.isValid = false;
                return validationResult;
            }

            if (activeIngredient.special) {
                validationResult.errors.push(MedicineRequestDomain.ERROR_ACTIVE_INGREDIENT_NOT_ALLOWED);
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

    //#region  validations of medicine-classification
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
                    validationResult.errors.concat(medicineOfferValidation.errors);
                }

            }

            // Validate the classification of all medicine of exchange
            for (const exchande of medicineRequest.exchange) {
                const validationExchangeResult: ValidationResult = await
                    this.validateMedicineClassification(ctx, exchande.medicine.classification);

                if (!validationExchangeResult.isValid) {
                    validationResult.errors.concat(validationExchangeResult.errors);
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
                    validationResult.errors.concat(medicineClassificationValidation.errors);
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
                validationResult.errors.push(MedicineRequestDomain.ERROR_ACTIVE_MEDICINE_CLASSIFICATION_NOT_FOUND);
            } else if (medicineClassification.situation === SituationEnum.INACTIVE) {
                validationResult.errors.push(MedicineRequestDomain.
                    ERROR_ACTIVE_MEDICINE_CLASSIFICATION_INACTIVATED);
            }
        } catch (error) {
            throw error;
        }

        validationResult.isValid = validationResult.errors.length < 1;
        return validationResult;

    }

    ////#endregion

    //#region  validations of pharmaceutical-phorm
    private async validateRequestPharmaceuticalPhorm(ctx: Context, medicineRequest: MedicineRequest):
        Promise<ValidationResult> {
        const validationResult: ValidationResult = new ValidationResult();

        try {
            // Validate pharmaceutical phorm of medicine requested
            const medicineOfferValidation: ValidationResult = await
                this.validatePharmaceuticalPhorm(ctx, medicineRequest.medicine.pharmaForm);

            if (!medicineOfferValidation.isValid) {
                validationResult.errors.concat(medicineOfferValidation.errors);
            }

            // Validate pharmaceutical phorm of all medicine of exchange
            for (const exchande of medicineRequest.exchange) {
                const validationExchangeResult: ValidationResult = await
                    this.validateMedicineClassification(ctx, exchande.medicine.pharmaForm);

                if (!validationExchangeResult.isValid) {
                    validationResult.errors.concat(validationExchangeResult.errors);
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
                validationResult.errors.push(MedicineRequestDomain.ERROR_ACTIVE_MEDICINE_CLASSIFICATION_NOT_FOUND);
            } else if (pharmaceuticalForm.situation === SituationEnum.INACTIVE) {
                validationResult.errors.push(MedicineRequestDomain.
                    ERROR_ACTIVE_MEDICINE_CLASSIFICATION_INACTIVATED);
            }
        } catch (error) {
            throw error;
        }

        validationResult.isValid = validationResult.errors.length < 1;
        return validationResult;

    }

    ////#endregion

    //#region  validations of pharmaceutical-industry
    // TODO: FMarino - Implementar métodos de validação aqui
    ////#endregion

    //#region  validations of negotiation-modality
    // TODO: FMarino - Implementar métodos de validação aqui
    ////#endregion

    //#endregion
}
