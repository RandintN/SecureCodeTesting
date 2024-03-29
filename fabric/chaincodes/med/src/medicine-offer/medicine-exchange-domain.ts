import { Context } from 'fabric-contract-api';
import { MedicineDomain } from '../medicine-abstract/medicine-domain';
import { MedicineClassificationDomain } from '../medicine-classification/medicine-classification-domain';
import { PharmaceuticalIndustryDomain } from '../pharmaceutical-industry/pharmaceutical-industry-domain';
import { ValidationResult } from '../validation/validation-model';
import { MedicineOfferExchange } from './medicine-exchange-model';

export class MedicineOfferExchangeDomain extends MedicineDomain {

    public async isValid(ctx: Context, medicine: MedicineOfferExchange): Promise<ValidationResult> {
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

    private async validateClassification(ctx: Context, medicine: MedicineOfferExchange):
        Promise<ValidationResult> {
        const validationResult: ValidationResult = new ValidationResult();
        const medicineClassificationDomain: MedicineClassificationDomain = new MedicineClassificationDomain();
        try {
            if(medicine.classification){
                for(const medicineClassificationItem of medicine.classification){
                    const medicineClassificationValidation: ValidationResult = await
                    medicineClassificationDomain.validateMedicineClassification(ctx, medicineClassificationItem);
                    if (!medicineClassificationValidation.isValid) {
                        validationResult.addErrors(medicineClassificationValidation.errors);

                    }
                }

            }            

        } catch (error) {
            throw error;
        }

        validationResult.isValid = validationResult.errors.length < 1;

        return validationResult;
    }

    private async validatePharmaceuticalIndustries(ctx: Context, medicine: MedicineOfferExchange):
        Promise<ValidationResult> {
        const validationResult: ValidationResult = new ValidationResult();
        const pharmaIndustryDomain: PharmaceuticalIndustryDomain = new PharmaceuticalIndustryDomain();

        try {
            if(medicine.pharmaIndustry){
                for(const medicinePharmaIndustryItem of medicine.pharmaIndustry){
                    const pharmaIndustryValidationResult: ValidationResult =
                    await pharmaIndustryDomain.validatePharmaceuticalIndustry(ctx, medicinePharmaIndustryItem);

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
}
