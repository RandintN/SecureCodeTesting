import { Context } from 'fabric-contract-api';
import { Iterators } from 'fabric-shim';
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
            await ctx.stub.putState(medicineClassificationID,
                Buffer.from(JSON.stringify(medicineClassification.toJson())));

            return medicineClassificationID;

        } catch (error) {
            return JSON.stringify(error + 'Error ocurrence');
        }
    }

    //#region queries
    public async queryMedicineClassificationByKey(ctx: Context, key: string): Promise<string> {
        const medicineClassificationInBytes = await ctx.stub.getState(key);
        return medicineClassificationInBytes.toString();
    }

    public async queryMedicineClassificationByCategory(ctx: Context, strCategory: string): Promise<string> {
        const queryJson = {
            selector: {
                category: strCategory,
            },
        };

        const iterator: Iterators.StateQueryIterator = await ctx.stub.getQueryResult(JSON.stringify(queryJson));
        return JSON.stringify(await this.getMedicineClassification(iterator));
    }

    public async getMedicineClassificationByCategory(ctx: Context, medicineClassificationCategory: string):
        Promise<MedicineClassification> {
        const medicineClassification: MedicineClassification = new MedicineClassification();
        medicineClassification.fromJson(JSON.parse(await this.queryMedicineClassificationByCategory(ctx,
            medicineClassificationCategory)));
        return medicineClassification;
    }

    //#endregion

    //#region private methods
    private async getMedicineClassification(iterator: Iterators.StateQueryIterator): Promise<MedicineClassification> {
        const medicineClassification: MedicineClassification = new MedicineClassification();
        while (true) {
            const result = await iterator.next();

            if (result.value && result.value.value.toString()) {
                medicineClassification.fromJson(JSON.parse(result.value.value.toString('utf8')));
            }

            if (result.done) {
                break;
            }
        }

        return medicineClassification;
    }

    //#endregion

}
