import { Context, Contract } from 'fabric-contract-api';
import { ChaincodeResponse } from 'fabric-shim';
import { ActiveIngredientDomain } from './active-ingredient/active-ingredient-domain';
import { IActiveIngredientService } from './active-ingredient/active-ingredient-interface';
import { MedicineClassificationDomain } from './medicine-classification/medicine-classification-domain';
import { IMedicineClassificationService } from './medicine-classification/medicine-classification-interface';
import { MedicineOfferedRequestDomain } from './medicine-offered-request/medicine-offered-request-domain';
import { IMedicineOfferedRequestService } from './medicine-offered-request/medicine-offered-request-interface';
import { MedicineRequestDomain } from './medicine-request/medicine-request-domain';
import { IMedicineRequestService } from './medicine-request/medicine-request-interface';
import { NegotiationModalityDomain } from './negotiation-modality/negotiation-modality-domain';
import { INegotiationModalityService } from './negotiation-modality/negotiation-modality-interface';
import { PharmaceuticalFormDomain } from './pharmaceutical-form/pharmaceutical-form-domain';
import { IPharmaceuticalFormService } from './pharmaceutical-form/pharmaceutical-form-interface';
import { PharmaceuticalIndustryDomain } from './pharmaceutical-industry/pharmaceutical-industry-domain';
import { IPharmaceuticalIndustryService } from './pharmaceutical-industry/pharmaceutical-industry-interface';
import { ValidationResult } from './validation/validation-model';
import { MedicineDeliveryDomain} from './medicine-delivery/medicine-delivery-domain';

export class MedicineRouterCC extends Contract implements
    IActiveIngredientService,
    IPharmaceuticalIndustryService,
    IMedicineClassificationService,
    IMedicineRequestService,
    IPharmaceuticalFormService,
    INegotiationModalityService,
    IMedicineOfferedRequestService {

    public async medicineDeliveryConfirmation(ctx: Context, requester_id: string): Promise<ChaincodeResponse> {
        return await new MedicineDeliveryDomain().medicineDeliveryConfirmation(ctx, requester_id);
    }

    //#region methods of active-ingredient
    public async addActiveIngredient(ctx: Context, strActiveIngredient: string): Promise<string> {
        return await new ActiveIngredientDomain().addActiveIngredient(ctx, strActiveIngredient);
    }

    public async queryActiveIngredientByKey(ctx: Context, key: string): Promise<string> {
        return await new ActiveIngredientDomain().queryActiveIngredientByKey(ctx, key);
    }

    public async queryActiveIngredientByName(ctx: Context, name: string): Promise<string> {
        return await new ActiveIngredientDomain().queryActiveIngredientByName(ctx, name);
    }

    public async validateActiveIngredient(ctx: Context, activeIngredientName: string): Promise<ValidationResult> {
        return await new ActiveIngredientDomain().validateActiveIngredient(ctx, activeIngredientName);
    }

    //#endregion

    //#region of methods of IMedicineRequestService
    public async addMedicineRequest(ctx: Context, medRequestJson: string): Promise<ChaincodeResponse> {
        return await new MedicineRequestDomain().addMedicineRequest(ctx, medRequestJson);
    }

    public async addMedicineRequestInBatch(ctx: Context, medRequestBatchJson: string): Promise<ChaincodeResponse> {
        return await new MedicineRequestDomain().addMedicineRequestInBatch(ctx, medRequestBatchJson);
    }

    public async approveMedicinePendingRequest(ctx: Context, medReqApproveJson: string): Promise<ChaincodeResponse> {
        return await new MedicineRequestDomain().approveMedicinePendingRequest(ctx, medReqApproveJson);
    }

    public async rejectMedicinePendingRequest(ctx: Context, medReqRejectJson: string): Promise<ChaincodeResponse> {
        return await new MedicineRequestDomain().rejectMedicinePendingRequest(ctx, medReqRejectJson);
    }

    public async queryMedicineRequest(ctx: Context, key: string):
        Promise<ChaincodeResponse> {
        return await new MedicineRequestDomain().queryMedicineRequest(ctx, key);
    }

    public async queryMedicineRequestsWithPagination(
        ctx: Context,
        queryParams: string,
        pageSize: string,
        bookmark?: string): Promise<ChaincodeResponse> {
        return await new MedicineRequestDomain().queryMedicineRequestsWithPagination(
            ctx,
            queryParams,
            pageSize,
            bookmark);
    }

    public async queryMedicineRequestPrivateData(ctx: Context, queryParams: string): Promise<ChaincodeResponse> {
        return await new MedicineRequestDomain().queryMedicineRequestPrivateData(ctx, queryParams);
    }

    //#endregion

    //#region of methods of IPharmaceuticalIndustryService
    public async addPharmaceuticalIndustry(ctx: Context, strPharmaceuticalIndustry: string): Promise<string> {
        return await new PharmaceuticalIndustryDomain().addPharmaceuticalIndustry(ctx, strPharmaceuticalIndustry);
    }

    public async queryPharmaceuticalIndustryByKey(ctx: Context, key: string): Promise<string> {
        return await new PharmaceuticalIndustryDomain().queryPharmaceuticalIndustryByKey(ctx, key);
    }

    // tslint:disable-next-line:variable-name
    public async queryPharmaceuticalIndustryByName(ctx: Context, pharmaceutical_laboratory: string): Promise<string> {
        return await new PharmaceuticalIndustryDomain().
            queryPharmaceuticalIndustryByName(ctx, pharmaceutical_laboratory);
    }

    //#endregion

    //#region methods of medicine-classification
    public async addMedicineClassification(ctx: Context, strMedicineClassification: string): Promise<string> {
        return await new MedicineClassificationDomain().addMedicineClassification(ctx, strMedicineClassification);
    }

    public async queryMedicineClassificationByKey(ctx: Context, key: string): Promise<string> {
        return await new MedicineClassificationDomain().queryMedicineClassificationByKey(ctx, key);
    }

    public async queryMedicineClassificationByCategory(ctx: Context, name: string): Promise<string> {
        return await new MedicineClassificationDomain().queryMedicineClassificationByCategory(ctx, name);
    }

    //#endregion

    //#region methods of negotiation-modality
    public async addNegotiationModality(ctx: Context, strNegotiationModality: string): Promise<string> {
        return await new NegotiationModalityDomain().addNegotiationModality(ctx, strNegotiationModality);
    }

    public async queryNegotiationModalityByKey(ctx: Context, key: string): Promise<string> {
        return await new NegotiationModalityDomain().queryNegotiationModalityByKey(ctx, key);
    }

    public async queryNegotiationModalityByModality(ctx: Context, strCategory: string): Promise<string> {
        return await new NegotiationModalityDomain().queryNegotiationModalityByModality(ctx, strCategory);
    }

    //#endregion

    //#region methods of PharmaceuticalForm
    public async addPharmaceuticalForm(ctx: Context, strPharmaceuticalForm: string): Promise<string> {
        return await new PharmaceuticalFormDomain().addPharmaceuticalForm(ctx, strPharmaceuticalForm);
    }

    public async queryPharmaceuticalFormByKey(ctx: Context, key: string): Promise<string> {
        return await new PharmaceuticalFormDomain().queryPharmaceuticalFormByKey(ctx, key);
    }

    public async queryPharmaceuticalFormByForm(ctx: Context, strPharmaceuticalForm: string): Promise<string> {
        return await new PharmaceuticalFormDomain().queryPharmaceuticalFormByForm(ctx, strPharmaceuticalForm);
    }

    //#endregion

    //#region methods of IMedicineOfferedRequestService
    public async offerMedicineRequest(ctx: Context, medicineOfferedRequestJson: string): Promise<ChaincodeResponse> {
        return await new MedicineOfferedRequestDomain().offerMedicineRequest(ctx, medicineOfferedRequestJson);
    }
    //#endregion
}
