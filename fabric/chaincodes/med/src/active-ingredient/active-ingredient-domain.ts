import { Context } from 'fabric-contract-api';
import { Iterators } from 'fabric-shim';
import { Guid } from 'guid-typescript';
import { ValidationResult } from '../validation/validation-model';
import { IActiveIngredientService } from './active-ingredient-interface';
import { IActiveIngredientJson } from './active-ingredient-json';
import { ActiveIngredient } from './active-ingredient-model';

export class ActiveIngredientDomain implements IActiveIngredientService {
    private static ADMIN_MSP: string = 'n2mimsp';
    //#region region of methods to be invoked
    public async addActiveIngredient(ctx: Context, strActiveIngredient: string): Promise<string> {
        try {
            if (ActiveIngredientDomain.ADMIN_MSP !== ctx.stub.getCreator().getMspid().toLowerCase()) {
                throw new Error('Invalid active ingredient');
            }

            const activeIngredient: ActiveIngredient = new ActiveIngredient();
            activeIngredient.toJson(JSON.parse(strActiveIngredient) as IActiveIngredientJson);

            const validationResult: ValidationResult = activeIngredient.isValid();

            if (!validationResult.isValid) {
                throw new Error(JSON.stringify(validationResult.errors));
            }

            const activeIngredientID: string = Guid.create().toString();
            await ctx.stub.putState(activeIngredientID, Buffer.from(strActiveIngredient));

            return activeIngredientID;

        } catch (error) {
            return JSON.stringify(error);
        }
    }
    //#endregion

    //#region queries
    public async queryActiveIngredientByKey(ctx: Context, key: string): Promise<string> {
        const activeIngredientInBytes = await ctx.stub.getState(key);
        return activeIngredientInBytes.toString();
    }

    public async queryActiveIngredientByName(ctx: Context, name: string): Promise<string> {
        const activeIngredient: ActiveIngredient = await this.getActiveIngredientByName(ctx, name);
        return JSON.stringify(activeIngredient);
    }

    public async getActiveIngredientByName(ctx: Context, activeIngredientName: string): Promise<ActiveIngredient> {
        const queryJson = {
            selection: {
                name: activeIngredientName,
            },
        };

        const iterator: Iterators.StateQueryIterator = await ctx.stub.getQueryResult(JSON.stringify(queryJson));
        return await this.getActiveIngredient(iterator);
    }
    //#endregion

    //#region private methods
    private async getActiveIngredient(iterator: Iterators.StateQueryIterator): Promise<ActiveIngredient> {
        let activeIngredient: ActiveIngredient = null;
        while (true) {
            const result = await iterator.next();

            if (result.value && result.value.value.toString()) {
                activeIngredient = JSON.parse(result.value.value.toString('utf8'));
            }

            if (result.done) {
                break;
            }
        }

        return activeIngredient;
    }
    //#endregion
}
