import { Context } from 'fabric-contract-api';

export interface INegotiationModalityService {
    addNegotiationModality(ctx: Context, strNegotiationModality: string): Promise<string>;

    queryNegotiationModalityByKey(ctx: Context, key: string): Promise<string>;

    queryNegotiationModalityByModality(ctx: Context, strModality: string): Promise<string>;
}
