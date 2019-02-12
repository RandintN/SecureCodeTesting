import { Context } from 'fabric-contract-api';

export interface IActiveIngredientService {
    addActiveIngredient(ctx: Context, strActiveIngredient: string): Promise<string>;

    queryActiveIngredientByKey(ctx: Context, key: string): Promise<string>;

    queryActiveIngredientByName(ctx: Context, name: string): Promise<string>;
}
