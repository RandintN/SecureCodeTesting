import { Context } from 'fabric-contract-api';
import { ActiveIngredientDomain } from '../active-ingredient/active-ingredient-domain';
import { PharmaceuticalFormDomain } from '../pharmaceutical-form/pharmaceutical-form-domain';
import { ValidationResult } from '../validation/validation-model';
import { Medicine } from './medicine-model';

export abstract class MedicineDomain {

    protected async validateActiveIngredient(ctx: Context, medicine: Medicine):
        Promise<ValidationResult> {
        let validationResult: ValidationResult;
        const activeIngredientDomain: ActiveIngredientDomain = new ActiveIngredientDomain();

        try {
            validationResult = await activeIngredientDomain.
                validateActiveIngredient(ctx, medicine.activeIngredient);

        } catch (error) {
            throw error;
        }

        validationResult.isValid = validationResult.errors.length < 1;

        return validationResult;
    }

    protected async validatePharmaceuticalForm(ctx: Context, medicine: Medicine):
        Promise<ValidationResult> {
        const validationResult: ValidationResult = new ValidationResult();
        const pharmaceuticalFormDomain: PharmaceuticalFormDomain = new PharmaceuticalFormDomain();

        try {
            // Validate pharmaceutical form of medicine requested
            const medicineOfferValidation: ValidationResult = await
                pharmaceuticalFormDomain.validatePharmaceuticalForm(ctx, medicine.pharmaForm);

            if (!medicineOfferValidation.isValid) {
                validationResult.addErrors(medicineOfferValidation.errors);

            }

        } catch (error) {
            throw error;
        }

        validationResult.isValid = validationResult.errors.length < 1;
        return validationResult;
    }

}
