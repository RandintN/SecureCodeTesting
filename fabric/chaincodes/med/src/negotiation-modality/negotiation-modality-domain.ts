import { Iterators } from 'fabric-shim';
import { Guid } from 'guid-typescript';
import { Context } from 'vm';
import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { INegotiationModalityService } from './negotiation-modality-interface';
import { INegotiationModalityJson } from './negotiation-modality-json';
import { NegotiationModality } from './negotiation-modality-model';

export class NegotiationModalityDomain implements INegotiationModalityService {
    //#region constants
    private static ADMIN_MSP: string = 'n2mimsp';
    private static ERROR_NOT_ALLOWED_MSP: ValidationError =
        new ValidationError('NMD-001', 'Forbidden');

    //#endregion

    public async addNegotiationModality(ctx: Context, strNegotiationModality: string): Promise<string> {
        try {
            if (NegotiationModalityDomain.ADMIN_MSP !== ctx.stub.getCreator().getMspid().toLowerCase()) {
                throw new Error(JSON.stringify(NegotiationModalityDomain.ERROR_NOT_ALLOWED_MSP));
            }

            const negotiationModality: NegotiationModality = new NegotiationModality();
            negotiationModality.fromJson(JSON.parse(strNegotiationModality) as INegotiationModalityJson);
            const validationResult: ValidationResult = negotiationModality.isValid();

            if (!validationResult.isValid) {
                throw new Error(JSON.stringify(validationResult.errors));
            }

            const negotiationModalityID: string = Guid.create().toString();
            await ctx.stub.putState(negotiationModalityID, Buffer.from(JSON.stringify(negotiationModality.toJson())));

            return negotiationModalityID;

        } catch (error) {
            return JSON.stringify(error + 'Error ocurrence');
        }
    }

    //#region queries
    public async queryNegotiationModalityByKey(ctx: Context, key: string): Promise<string> {
        const medicineClassificationInBytes = await ctx.stub.getState(key);
        return medicineClassificationInBytes.toString();
    }

    public async queryNegotiationModalityByModality(ctx: Context, strModality: string): Promise<string> {
        const queryJson = {
            selector: {
                modality: strModality,
            },
        };

        const iterator: Iterators.StateQueryIterator = await ctx.stub.getQueryResult(JSON.stringify(queryJson));
        return JSON.stringify(await this.geNegotiationModality(iterator));
    }

    public async getNegotiationModalityByModality(ctx: Context, modality: string): Promise<NegotiationModality> {
        const negotiationModality: NegotiationModality = new NegotiationModality();
        negotiationModality.fromJson(JSON.parse(await this.queryNegotiationModalityByModality(ctx, modality)));
        return negotiationModality;
    }

    //#endregion

    //#region private methods
    private async geNegotiationModality(iterator: Iterators.StateQueryIterator): Promise<NegotiationModality> {
        const negotiationModality: NegotiationModality = new NegotiationModality();
        while (true) {
            const result = await iterator.next();

            if (result.value && result.value.value.toString()) {
                negotiationModality.fromJson(JSON.parse(result.value.value.toString('utf8')));
            }

            if (result.done) {
                break;
            }
        }

        return negotiationModality;
    }

    //#endregion

}
