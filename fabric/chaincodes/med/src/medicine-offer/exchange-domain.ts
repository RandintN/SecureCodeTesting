import { Context } from 'fabric-contract-api';
import { MedicineOfferExchangeDomain } from './medicine-exchange-domain';
import { ValidationResult } from '../validation/validation-model';
import { OfferExchange } from './exchange-model';

export class OfferExchangeDomain {

    public async isValid(ctx: Context, exchange: OfferExchange) {
        const validationResult: ValidationResult = new ValidationResult();

        try {
            const validationModel: ValidationResult =
                exchange.isValid();

            if (!validationModel.isValid) {
                validationResult.addErrors(validationModel.errors);

                return validationResult;
            }

            const medicineExchangeDomain: MedicineOfferExchangeDomain = new MedicineOfferExchangeDomain();

            const validationMedicineDomain: ValidationResult =
                await medicineExchangeDomain.isValid(ctx, exchange.medicine);

            if (!validationMedicineDomain.isValid) {
                validationResult.addErrors(validationMedicineDomain.errors);

            }

        } catch (error) {
            throw error;
        }

        validationResult.isValid = validationResult.errors.length < 1;

        return validationResult;
    }

}
