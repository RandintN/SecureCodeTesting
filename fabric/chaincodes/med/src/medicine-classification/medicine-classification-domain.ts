import { Context } from 'fabric-contract-api';
import { Guid } from 'guid-typescript';
import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IMedicineClassificationService } from './medicine-classification-interface';
import { IMedicineClassificationJson } from './medicine-classification-json';
import { MedicineClassification } from './medicine-classification-model';

export class MedicineClassificationDomain implements IMedicineClassificationService {
    //#region constants
    private static ADMIN_MSP: string = 'n2mimsp';
    private static ERROR_NOT_ALLOWED_MSP: ValidationError =
        new ValidationError('MCD-001', 'Forbidden');
    //#endregion

    public async addMedicineClassification(ctx: Context, strMedicineClassification: string): Promise<string> {
        try {
            if (MedicineClassificationDomain.ADMIN_MSP !== ctx.stub.getCreator().getMspid().toLowerCase()) {
                throw new Error(JSON.stringify(MedicineClassificationDomain.ERROR_NOT_ALLOWED_MSP));
            }

            const medicineClassification: MedicineClassification = new MedicineClassification();
            medicineClassification.fromJson(JSON.parse(strMedicineClassification) as IMedicineClassificationJson);
            const validationResult: ValidationResult = medicineClassification.isValid();

            if (!validationResult.isValid) {
                throw new Error(JSON.stringify(validationResult.errors));
            }

            const medicineClassificationID: string = Guid.create().toString();
            await ctx.stub.putState(medicineClassificationID, Buffer.from(JSON.stringify(medicineClassification)));

            return medicineClassificationID;

        } catch (error) {
            return JSON.stringify(error + 'Error ocurrence');
        }
    }

    public async queryMedicineClassificationByKey(ctx: Context, key: string): Promise<string> {
        const medicineClassificationInBytes = await ctx.stub.getState(key);
        return medicineClassificationInBytes.toString();
    }

    public async queryMedicineClassificationByName(ctx: Context, name: string): Promise<string> {
        throw new Error('Method not implemented.');
    }
}
