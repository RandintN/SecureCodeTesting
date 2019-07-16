import { Context } from 'fabric-contract-api';
import { MedicineRequestExchangeDomain } from './medicine-exchange-domain';
import { ValidationResult } from '../validation/validation-model';
import { RequestExchange } from './exchange-model';

export class RequestExchangeDomain {

    public async isValid(ctx: Context, exchange: RequestExchange) {
        const validationResult: ValidationResult = new ValidationResult();

        try {
            const validationModel: ValidationResult =
                exchange.isValid();

            if (!validationModel.isValid) {
                validationResult.addErrors(validationModel.errors);

                return validationResult;
            }

            const medicineExchangeDomain: MedicineRequestExchangeDomain = new MedicineRequestExchangeDomain();

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
