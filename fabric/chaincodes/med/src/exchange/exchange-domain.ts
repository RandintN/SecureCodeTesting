import { Context } from 'fabric-contract-api';
import { MedicineExchangeDomain } from '../medicine-exchange/medicine-exchange-domain';
import { ValidationResult } from '../validation/validation-model';
import { Exchange } from './exchange-model';

export class ExchangeDomain {

    public async isValid(ctx: Context, exchange: Exchange) {
        const validationResult: ValidationResult = new ValidationResult();

        try {
            const validationModel: ValidationResult =
                exchange.isValid();

            if (!validationModel.isValid) {
                validationResult.addErrors(validationModel.errors);

                return validationResult;
            }

            const medicineExchangeDomain: MedicineExchangeDomain = new MedicineExchangeDomain();

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
