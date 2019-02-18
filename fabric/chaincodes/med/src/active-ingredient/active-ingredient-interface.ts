import { Context } from 'fabric-contract-api';
import { ValidationResult } from '../validation/validation-model';

export interface IActiveIngredientService {
    addActiveIngredient(ctx: Context, strActiveIngredient: string): Promise<string>;

    queryActiveIngredientByKey(ctx: Context, key: string): Promise<string>;

    queryActiveIngredientByName(ctx: Context, name: string): Promise<string>;

    validateActiveIngredient(ctx: Context, activeIngredientName: string): Promise<ValidationResult>;
}
