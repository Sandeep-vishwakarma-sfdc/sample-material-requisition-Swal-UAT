@isTest
public with sharing class SampleMaterialRequisitionTest {
    @TestSetup
    static void makeData(){
        
     User tm = new User(
     ProfileId = [SELECT Id FROM Profile WHERE Name = 'Territory Manager for Swal'].Id,
     LastName = 'TM',
     Email = 'sandeep.vishwakarma@skinternational.com',
     Username = 'test@test.com' + System.currentTimeMillis(),
     CompanyName = 'SK international',
     Title = 'title',
     Alias = 'alias',
     TimeZoneSidKey = 'America/Los_Angeles',
     EmailEncodingKey = 'UTF-8',
     LanguageLocaleKey = 'en_US',
     LocaleSidKey = 'en_US'
     );
     insert tm;
     
     User rm = new User(
     ProfileId = [SELECT Id FROM Profile WHERE Name = 'Regional/ Zonal for SWAL'].Id,
     LastName = 'RM',
     Email = 'sandeep.vishwakarma@skinternational.com',
     Username = 'test@test.com' + System.currentTimeMillis(),
     CompanyName = 'SK international',
     Title = 'title',
     Alias = 'alias',
     TimeZoneSidKey = 'America/Los_Angeles',
     EmailEncodingKey = 'UTF-8',
     LanguageLocaleKey = 'en_US',
     LocaleSidKey = 'en_US'
     );
     insert rm;   
        
     User zm = new User(
     ProfileId = [SELECT Id FROM Profile WHERE Name = 'Regional/ Zonal for SWAL'].Id,
     LastName = 'ZM',
     Email = 'sandeep.vishwakarma@skinternational.com',
     Username = 'test@test.com' + System.currentTimeMillis(),
     CompanyName = 'SK international',
     Title = 'title',
     Alias = 'alias',
     TimeZoneSidKey = 'America/Los_Angeles',
     EmailEncodingKey = 'UTF-8',
     LanguageLocaleKey = 'en_US',
     LocaleSidKey = 'en_US'
     );
     insert zm;    
     
      User Hom = new User(
     ProfileId = [SELECT Id FROM Profile WHERE Name = 'Marketing HO Swal'].Id,
     LastName = 'HOM',
     Email = 'sandeep.vishwakarma@skinternational.com',
     Username = 'test@test.com' + System.currentTimeMillis(),
     CompanyName = 'SK international',
     Title = 'title',
     Alias = 'alias',
     TimeZoneSidKey = 'America/Los_Angeles',
     EmailEncodingKey = 'UTF-8',
     LanguageLocaleKey = 'en_US',
     LocaleSidKey = 'en_US'
     );
     insert Hom;    
        
        Sales_Org__c sales_org = new Sales_Org__c();
        sales_org.Name='SWAL';
        sales_org.Sales_Org_Code__c='1210';
        insert sales_org;

        
        Product2 prod = new Product2();
        prod.Name = 'Product_test';
        insert prod;
        
        Crop__c crop = new Crop__c();
        crop.Name = 'crop';
        insert crop;
        
        Crop_Pest__c pest = new Crop_Pest__c();
        pest.Name = 'Pest';
        insert pest;
        
        Depot__c depot = new Depot__c();
        depot.Name = 'Depot';
        depot.Depot_person__c = 'sandeep.vishwakarma@skinternational.com';
        depot.HO_Commercial__c = 'sandeep.vishwakarma@skinternational.com';
        insert depot;
        
        TM_Depot_Mapping__c tm_depot = new TM_Depot_Mapping__c();
        tm_depot.Depot__c = depot.Id;
        tm_depot.Territory_Manager__c = tm.Id;
        insert tm_depot;
        
        Region__c region = new Region__c();
        region.Name = 'region';
        region.RegionCode__c = '1';
        region.SalesOrg__c = sales_org.Id;
        region.RegionHead__c = rm.Id;
        insert region;
	
		Zone__c zone = new Zone__c();
		zone.Name = 'zone';
		zone.ZoneCode__c = '1';
        zone.SalesOrg__c = sales_org.Id;
        zone.ZonalHead__c = zm.Id;
        insert zone;
		        
        Territory_Distributor__c td = new Territory_Distributor__c();
        td.Name = 'td';
        td.Region__c = region.Id;
        td.Zone__c = zone.Id;
        td.TerritoryManager__c = tm.Id;
        td.SalesOrg__c = sales_org.Id;
        insert td;
        
        
        Id fsmRecordType = Schema.SObjectType.Free_Sample_Management__c.getRecordTypeInfosByName().get('Post Free Sample Management').getRecordTypeId();
        Free_Sample_Management__c fsm = new Free_Sample_Management__c();
        fsm.Zip_Code__c = '123-4567';
        fsm.recordTypeId = fsmRecordType;
        fsm.Territory_Manager__c = tm.Id;
        fsm.Office_Manager__c = rm.Id;
        fsm.Sales_Assistant__c = zm.Id;
        fsm.Technical_Manager__c = Hom.Id; //UPL LTD as third Approval
        fsm.Sales_Org__c = sales_org.Id;
        fsm.Zip_Code__c = '123-4567'; // Need to change
        fsm.Status__c = 'Draft';
        fsm.Depot__c = depot.Id;
        insert fsm;
        
        Free_Sampling_Product__c fsp = new Free_Sampling_Product__c();
        fsp.Free_Sampling__c = fsm.Id;
        fsp.Demo_Size_Acer__c = Decimal.valueOf('1');
        fsp.Dose_Acre_GM_ML_L_Per_Acre__c = Decimal.valueOf('1');
        fsp.Number_of_Demo__c = Decimal.valueOf('1');
        fsp.Product__c = prod.Id;
        insert fsp;
        System.debug('FSP '+fsp.Id+'fsp Name'+fsp.Name);
        
        Id crop_rectype = Schema.SObjectType.Free_Sampling_Crop_Pest__c.getRecordTypeInfosByName().get('Crop').getRecordTypeId();
        Free_Sampling_Crop_Pest__c freesampleCrop = new Free_Sampling_Crop_Pest__c();
		freesampleCrop.Free_Sampling__c = fsm.Id;
		freesampleCrop.Free_Sampling_Product__c = fsp.Id;
        freesampleCrop.Product__c = prod.Id;
        freesampleCrop.Target_Crop__c = crop.Id;
        freesampleCrop.RecordTypeId = crop_rectype;
        insert freesampleCrop;
        
        Id pest_rectype = Schema.SObjectType.Free_Sampling_Crop_Pest__c.getRecordTypeInfosByName().get('Pest').getRecordTypeId();
        Free_Sampling_Crop_Pest__c freesamplePest = new Free_Sampling_Crop_Pest__c();
		freesamplePest.Free_Sampling__c = fsm.Id;
		freesamplePest.Free_Sampling_Product__c = fsp.Id;
        freesamplePest.Product__c = prod.Id;
        freesamplePest.Target_Pest__c = pest.Id;
        freesamplePest.RecordTypeId = pest_rectype;
        insert freesamplePest;
    }

    @isTest
    static void testMethods(){
        User tm = [select Id,Name from User where LastName='TM' limit 1];
        Sales_Org__c sales_org = [select Id,Name from Sales_Org__c limit 1];
        Free_Sample_Management__c fsm = [select Id,Name,Status__c,Sub_Status__c from Free_Sample_Management__c where Zip_Code__c = '123-4567' limit 1];
        Product2 prod = [select Id,Name from Product2 limit 1];
        Crop__c crop = [select Id,Name from Crop__c limit 1];
        Crop_Pest__c pest = [select Id,Name from Crop_Pest__c limit 1];
        User rm = [select Id,Name from User where LastName='RM' limit 1];
        User zm = [select Id,Name from User where LastName='ZM' limit 1];
        User Hom = [select Id,Name from User where LastName='HOM' limit 1];
        Depot__c depot = [select Id,Name from Depot__c limit 1]; 
        Free_Sample_Management__c fsm1 = new Free_Sample_Management__c();
        Free_Sampling_Product__c fsp = [select Id,Name from Free_Sampling_Product__c limit 1];
        System.runAs(tm){
        SampleMaterialRequisition.getFreesampling();
        SampleMaterialRequisition.getCurrentUser();
        SampleMaterialRequisition.getUserCountry();
        SampleMaterialRequisition.getProfile();
        SampleMaterialRequisition.getFreesampling();
        SampleMaterialRequisition.getDepot();
        SampleMaterialRequisition.getManagers();
        SampleMaterialRequisition.getFreesamplingById(fsm.Id+'');
        SampleMaterialRequisition.saveFreeSampleManagement(fsm);
        String str = '[{"Id":1,"product":{"Id":"'+prod.Id+'","Name":"'+prod.Name+'","crop":[{"Id":"'+crop.Id+'","Name":"'+crop.Name+'","prod_id":"'+prod.Id+'","recordTypeName":"Pest"},{"Id":"'+crop.Id+'","Name":"'+crop.Name+'","prod_id":"'+prod.Id+'","recordTypeName":"Pest"}],"CropPest":[{"Id":"'+pest.Id+'","Name":"'+pest.Name+'","prod_id":"'+prod.Id+'","recordTypeName":"Pest"},{"Id":"'+pest.Id+'","Name":"'+pest.Name+'","prod_id":"'+prod.Id+'","recordTypeName":"Pest"}]},"dose_acre":"10","demo_size":"20","numberOfDemo":"30"}]';
        SampleMaterialRequisition.addProduct(str,fsm.Id);
        SampleMaterialRequisition.getProductList(fsm.Id);  
        Id fsmRecordType = Schema.SObjectType.Free_Sample_Management__c.getRecordTypeInfosByName().get('Post Free Sample Management').getRecordTypeId();
        //Free_Sample_Management__c fsm1 = new Free_Sample_Management__c();
        fsm1.Zip_Code__c = '123-4568';
        fsm1.recordTypeId = fsmRecordType;
        fsm1.Territory_Manager__c = tm.Id;
        fsm1.Office_Manager__c = rm.Id;
        fsm1.Sales_Assistant__c = zm.Id;
        fsm1.Technical_Manager__c = hom.Id; //UPL LTD as third Approval
        fsm1.Sales_Org__c = sales_org.Id;
        fsm1.Status__c = 'Draft';
        fsm1.Depot__c = depot.Id;
        insert fsm1;  
        SampleMaterialRequisition.submitForApproval(fsm1.id);    
        }
        SampleMaterialRequisition.approveRecord(fsm1.Id,'Approve');
        SampleMaterialRequisition.rejectRecord(fsm1.Id,'Reject');
        fsm.Status__c = 'Pending from Depot';
        fsm.Sub_Status__c = 'for PO Number';
        update fsm;
        SampleMaterialRequisition.saveFreeSampleManagement(fsm);
        fsm.Status__c = 'Pending';
        fsm.Sub_Status__c = 'Pending from HO Commercial';
        update fsm;
        SampleMaterialRequisition.saveFreeSampleManagement(fsm);
        fsm.Status__c = 'Pending from Depot';
        fsm.Sub_Status__c = 'for Dispatch Details';
        update fsm;
        SampleMaterialRequisition.saveFreeSampleManagement(fsm);
        fsm.Status__c = 'Rejected';
        fsm.Sub_Status__c = 'Rejected by HO Commercial';
        update fsm;
        SampleMaterialRequisition.saveFreeSampleManagement(fsm);
        fsm.Status__c = 'Closed';
        fsm.Sub_Status__c = '';
        update fsm;
        SampleMaterialRequisition.saveFreeSampleManagement(fsm);
        SampleMaterialRequisition.deleteFreeSampleProduct(new List<String>{fsp.Id+''});
    }
}