public without sharing class SampleMaterialRequisition {
    static Sales_Org__c salesorg=null;
    @AuraEnabled(cacheable=true)
    public static Sales_Org__c getSalesOrgCode(){
        if(salesorg==null){
            salesorg = new Sales_Org__c();
            salesorg = [select Id,Name,Sales_Org_Code__c from Sales_Org__c where Name='SWAL' limit 1];
        }
        return salesorg;
    }
    @AuraEnabled(cacheable=true)
    public static string getCurrentUser(){
        return UserInfo.getUserId();
    }

    @AuraEnabled(cacheable=true)
    public static List<Territory_Distributor__c> getTerritory(){
        String userid = UserInfo.getUserId();
        // List<Territory_Distributor__c>  territory = [Select Id,Name from Territory_Distributor__c where (FMM_User_Id__c=:userid OR Regional_Manager_Id__c=:userid OR Zonal_Marketing_Manager_1_Id__c=:userid) AND (TerritoryManager__c=null OR TerritoryManagerActive__c=false)];
        List<Territory_Distributor__c>  territory = [SELECT id,Name from Territory_Distributor__c where Name like '%%' and Sales_Org_Code__c = '1210' and (FMM_User_Id__c=:userid OR (Regional_Manager_Id__c=:userid and FMM_User_Id__c=null) OR (Zonal_Marketing_Manager_1_Id__c=:userid AND Regional_Manager_Id__c=null and FMM_User_Id__c=null)) AND (TerritoryManager__c=null)];
        return territory;
    }

    @AuraEnabled(cacheable=true)
    public static User getUserCountry(){
        List<User> lstusr =  [select Id,Name,Country,profile.name from User where Id=:UserInfo.getUserId()];
        User usr = lstusr[0];
        return usr;
    }

    @AuraEnabled(cacheable=true)
    public static string getProfile(){
        String profilename = [select Id,Name,Profile.Name from User where Id=:UserInfo.getUserId()].Profile.Name;
        return String.isEmpty(profilename)?'':profilename;
    }

    @AuraEnabled
    public static Free_Sample_Management__c getFreesampling(){
        Id fsmRecordType = Schema.SObjectType.Free_Sample_Management__c.getRecordTypeInfosByName().get('Post Free Sample Management').getRecordTypeId();
        Profile ho_profile = [select Id,Name from Profile where Name='Marketing HO Swal' limit 1];
        Id ho_commerical = [select Id from User where ProfileId=:ho_profile.Id limit 1].Id;
        Free_Sample_Management__c newfsm = new Free_Sample_Management__c();
        newfsm.recordTypeId = fsmRecordType;
        if(getProfile()=='Territory Manager for Swal'){
            newfsm.Territory_Manager__c = UserInfo.getUserId();
        }
        newfsm.Technical_Manager__c = ho_commerical; //UPL LTD as third Approval
        newfsm.SalesOrg__c = getSalesOrgCode().Id;
        // newfsm.Sales_Org__c = getSalesOrgCode().Id;
        newfsm.Zip_Code__c = '123-4567'; // Need to change
        newfsm.Status__c = 'Draft';
        newfsm.Sub_Status__c = 'Draft';
        System.debug('New Free_Sample_Management__c created '+newfsm.Id);
        return newfsm;
    }

    @AuraEnabled(cacheable=true)
    public static List<TM_Depot_Mapping__c> getDepot(String territory){
        List<TM_Depot_Mapping__c> depomapping = new List<TM_Depot_Mapping__c>();
        if(String.isEmpty(territory)){
            depomapping = [select Id,Name,Depot__c,Depot__r.Name,Depot__r.Depot_person__c,Depot__r.HO_Commercial__c from TM_Depot_Mapping__c where Territory_Manager__c =:UserInfo.getUserId() and Depot__r.Name!=null and Depot__r.HO_Commercial__c!=null and Depot__r.SalesOrg__r.Sales_Org_Code__c='1210'];
        }else{
            depomapping = [select Id,Name,Depot__c,Depot__r.Name,Depot__r.Depot_person__c,Depot__r.HO_Commercial__c from TM_Depot_Mapping__c where Territory__c =:territory and Depot__r.Name!=null and Depot__r.HO_Commercial__c!=null and Depot__r.SalesOrg__r.Sales_Org_Code__c='1210' and Territory_Manager__c=null];
        }
        return depomapping;
    }

    @AuraEnabled
    public static String updateFSP(String lstFsp){
       List<FreeSampleProductWrap> lstproduct = (List<FreeSampleProductWrap>)System.JSON.deserialize(lstFsp,List<FreeSampleProductWrap>.class);
       List<Free_Sampling_Product__c> lstTempProduct = new List<Free_Sampling_Product__c>();
       for(FreeSampleProductWrap fsp:lstproduct){
        Free_Sampling_Product__c fspnew = new Free_Sampling_Product__c();
        fspnew.Id = fsp.Id;
        fspnew.Demo_Size_Acer__c = Decimal.valueOf(fsp.demo_size);
        fspnew.Dose_Acre_GM_ML_L_Per_Acre__c = Decimal.valueOf(fsp.dose_acre);
        fspnew.Number_of_Demo__c = Decimal.valueOf(fsp.numberOfDemo);
        lstTempProduct.add(fspnew);
       }
       try {
           update lstTempProduct;
           return 'Updated';
       } catch (Exception e) {
           System.debug('Product updation'+e);
           return 'Failed to update';
       } 
    }

    @AuraEnabled(cacheable=true)
    public static Territory_Distributor__c getManagers(){
        String userid = UserInfo.getUserId();
        Territory_Distributor__c territory = [SELECT Id, Name, Region__c,Region__r.RegionHead__c,Region__r.RegionHead__r.IsActive,Region__r.FMM_User__c,Region__r.FMM_User__r.IsActive, TerritoryManager__c, SalesOrg__c, Zone__c,Zone__r.ZonalHead__c,Zone__r.ZMMUser__c,Zone__r.Threshold_value__c,LastModifiedDate FROM Territory_Distributor__c where TerritoryManager__c =:userid or FMM_User_Id__c=:userid or Regional_Manager_Id__c=:userid or Zonal_Marketing_Manager_1_Id__c=:userid order by LastModifiedDate  DESC limit 1];
        return territory;
    }

    @AuraEnabled
    public static Free_Sample_Management__c getFreesamplingById(String freeSampleMangtId){
        System.debug('FSM '+freeSampleMangtId);
        List<Free_Sample_Management__c> lstfsm = new List<Free_Sample_Management__c>();
        lstfsm = [SELECT Id,Name,Threshold_value__c,SalesOrg__c,Territory_Manager__c,Territory__c,Territory__r.Name,Territory__r.Zone__r.Threshold_value__c,Depot__c,Depot__r.Name,Depot__r.Depot_person__c,Depot__r.HO_Commercial__c,Status__c,Sub_Status__c,PO_Number__c,Material_Dispatched_Date__c,X1st_Approval_Date_Time__c,X2nd_Approval_Date_Time__c,X3rd_Approval_Date_Time__c,Ho_comment__c,Office_Manager__c,Sales_Assistant__c,Technical_Manager__c,Comment__c,OwnerId from Free_Sample_Management__c where Id=:freeSampleMangtId];
        System.debug('FSM lst'+lstfsm);
        return lstfsm[0];
    }

    @AuraEnabled
    public static Free_Sample_Management__c saveFreeSampleManagement(Free_Sample_Management__c freeSamplingObj){
        System.debug('upsert fsm'+freeSamplingObj);
        Boolean alreadyRejected = false;
        if(getProfile() == 'Territory Manager for Swal' && freeSamplingObj.Status__c == 'Rejected' && freeSamplingObj.Sub_Status__c=='Rejected by HO Commercial'){
            alreadyRejected = true;
        }
        upsert freeSamplingObj;
        if(!alreadyRejected){
            sendEmailToUser(freeSamplingObj.Id);
        }
        return freeSamplingObj;
    }

    @AuraEnabled
    public static List<FreeSampleProductWrap> addProduct(String product,String freeSamplingId){
        System.debug('freeSamplingId '+freeSamplingId);
        System.debug('product str '+product);
        List<FreeSampleProductWrap> freeproductwrap = new List<FreeSampleProductWrap>();
        List<Free_Sampling_Crop_Pest__c> lst_fsCropAndPest = new List<Free_Sampling_Crop_Pest__c>();
        Map<String,Free_Sampling_Product__c> fsproductMap = new Map<String,Free_Sampling_Product__c>();
        Id cropRecordType = Schema.SObjectType.Free_Sampling_Crop_Pest__c.getRecordTypeInfosByName().get('Crop').getRecordTypeId();
        Id pestRecordType = Schema.SObjectType.Free_Sampling_Crop_Pest__c.getRecordTypeInfosByName().get('Pest').getRecordTypeId();
            freeproductwrap = (List<FreeSampleProductWrap>) System.JSON.deserialize(product, List<FreeSampleProductWrap>.class);
            System.debug('Product wrap '+freeproductwrap);
            
            for(FreeSampleProductWrap fspw : freeproductwrap){
                Free_Sampling_Product__c  fsp = new Free_Sampling_Product__c ();
                fsp.Free_Sampling__c = Id.valueOf(freeSamplingId);
                fsp.Demo_Size_Acer__c = Decimal.valueOf(fspw.demo_size);
                fsp.Dose_Acre_GM_ML_L_Per_Acre__c = Decimal.valueOf(fspw.dose_acre);
                fsp.Number_of_Demo__c = Decimal.valueOf(fspw.numberOfDemo);
                fsp.Product__c = fspw.product.Id;
                if(!String.isEmpty(fspw.productNRV)){
                fsp.NRV__c = Decimal.valueOf(fspw.productNRV);
                }
                System.debug('free sample Product Id '+String.valueOf(fspw.Id).length());
                if(String.valueOf(fspw.Id).length() < 14){
                    fsproductMap.put(fspw.Id,fsp);
                    System.debug('fsp '+fsproductMap); 
                }
            }
            insert fsproductMap.values();
            
            System.debug('FreeSampleProduct Map'+fsproductMap);
            for(FreeSampleProductWrap fspw : freeproductwrap){
                System.debug('FSPW ID '+fspw.Id);
                System.debug('Crops->'+fspw.product.crop);
                if(fspw.product.crop!=null){
                    for(CropAndPestWrap crop:fspw.product.crop){
                        if(fsproductMap.get(fspw.Id)!=null){
                        Free_Sampling_Crop_Pest__c fsCropAndPest = new Free_Sampling_Crop_Pest__c();
                        fsCropAndPest.Free_Sampling__c = freeSamplingId;
                        fsCropAndPest.Product__c = crop.prod_id;
                        fsCropAndPest.RecordTypeId = cropRecordType;
                        fsCropAndPest.Target_Crop__c = crop.Id;
                        fsCropAndPest.Free_Sampling_Product__c = fsproductMap.get(fspw.Id).Id;
                        lst_fsCropAndPest.add(fsCropAndPest);
                        }
                    }
                }
                if(fspw.product.CropPest!=null){
                    for(CropAndPestWrap pest:fspw.product.CropPest){
                        if(fsproductMap.get(fspw.Id)!=null){
                        Free_Sampling_Crop_Pest__c fsCropAndPest = new Free_Sampling_Crop_Pest__c();
                        fsCropAndPest.Free_Sampling__c = freeSamplingId;
                        fsCropAndPest.Product__c = pest.prod_id;
                        fsCropAndPest.RecordTypeId = pestRecordType;
                        fsCropAndPest.Target_Pest__c = pest.Id;
                        fsCropAndPest.Free_Sampling_Product__c = fsproductMap.get(fspw.Id).Id;
                        lst_fsCropAndPest.add(fsCropAndPest);
                        }
                    }
                }
            }
            insert lst_fsCropAndPest;
        return freeproductwrap;
    }


    @AuraEnabled(cacheable=true)
    public static List<FreeSampleProductWrap> getProductList(String freesamplingId){
            List<Free_Sampling_Crop_Pest__c> lstfree_sample_cropPest = [select Id,Name,Product__c,Product__r.Name,Product__r.Budget_NRV__c,Target_Pest__c,Target_Pest__r.Name,Target_Crop__c,Target_Crop__r.Name,recordType.Name,Free_Sampling__c,Free_Sampling_Product__c,Free_Sampling_Product__r.Name,Free_Sampling_Product__r.Demo_Size_Acer__c,Free_Sampling_Product__r.Dose_Acre_GM_ML_L_Per_Acre__c,Free_Sampling_Product__r.Number_of_Demo__c,Free_Sampling_Product__r.Demo_material_value__c from Free_Sampling_Crop_Pest__c where Free_Sampling__c=:freesamplingId];
            Map<String,Free_Sampling_Crop_Pest__c> mapFreeCropPestWrap = new Map<String,Free_Sampling_Crop_Pest__c>();
            for(Free_Sampling_Crop_Pest__c freesampleCP :lstfree_sample_cropPest){
                mapFreeCropPestWrap.put(freesampleCP.Free_Sampling_Product__c+'',freesampleCP);
                System.debug('mapFreeCropPestWrap '+mapFreeCropPestWrap);
            }
            Map<String,List<CropAndPestWrap>> mapCropWrap = new Map<String,List<CropAndPestWrap>>();
            Map<String,List<CropAndPestWrap>> mappestWrap = new Map<String,List<CropAndPestWrap>>();
            List<FreeSampleProductWrap> lstFreesampleProductWrap = new List<FreeSampleProductWrap>();

            for(Free_Sampling_Crop_Pest__c freesampleCropPest : lstfree_sample_cropPest){
                
                if(String.valueOf(freesampleCropPest.recordType.Name).equals('Crop')){
                    if(mapCropWrap.containsKey(freesampleCropPest.Free_Sampling_Product__c)){
                        List<CropAndPestWrap> lstCropPestWrap = new List<CropAndPestWrap>();
                        lstCropPestWrap = mapCropWrap.get(freesampleCropPest.Free_Sampling_Product__c);
                        CropAndPestWrap croppestwrap = new CropAndPestWrap();
                        croppestwrap.Id = freesampleCropPest.Target_Crop__c;
                        croppestwrap.Name = freesampleCropPest.Target_Crop__r.Name;
                        croppestwrap.prod_id = freesampleCropPest.Product__c;
                        croppestwrap.recordTypeName = freesampleCropPest.recordType.Name;
                        lstCropPestWrap.add(croppestwrap);
                        //Free_Sampling_Product__c
                        mapCropWrap.put(freesampleCropPest.Free_Sampling_Product__c, lstCropPestWrap);
                        System.debug('CropAndPestWrap '+croppestwrap);
                    }else{
                        List<CropAndPestWrap> lstCropPestWrap = new List<CropAndPestWrap>();
                        CropAndPestWrap croppestwrap = new CropAndPestWrap();
                        // croppestwrap.Id = freesampleCropPest.Id;
                        croppestwrap.Id = freesampleCropPest.Target_Crop__c;
                        croppestwrap.Name = freesampleCropPest.Target_Crop__r.Name;
                        croppestwrap.prod_id = freesampleCropPest.Product__c;
                        croppestwrap.recordTypeName = freesampleCropPest.recordType.Name;
                        lstCropPestWrap.add(croppestwrap);
                        mapCropWrap.put(freesampleCropPest.Free_Sampling_Product__c, lstCropPestWrap);
                        System.debug('CropAndPestWrap '+croppestwrap);
                    }
                }
                if(String.valueOf(freesampleCropPest.recordType.Name).equals('Pest')){
                    if(mappestWrap.containsKey(freesampleCropPest.Free_Sampling_Product__c)){
                        List<CropAndPestWrap> lstCropPestWrap = new List<CropAndPestWrap>();
                        lstCropPestWrap = mappestWrap.get(freesampleCropPest.Free_Sampling_Product__c);
                        CropAndPestWrap croppestwrap = new CropAndPestWrap();
                        croppestwrap.Id = freesampleCropPest.Target_Pest__c;
                        croppestwrap.Name = freesampleCropPest.Target_Pest__r.Name;
                        croppestwrap.prod_id = freesampleCropPest.Product__c;
                        croppestwrap.recordTypeName = freesampleCropPest.recordType.Name;
                        lstCropPestWrap.add(croppestwrap);
                        mappestWrap.put(freesampleCropPest.Free_Sampling_Product__c, lstCropPestWrap);
                    }else{
                        List<CropAndPestWrap> lstCropPestWrap = new List<CropAndPestWrap>();
                        CropAndPestWrap croppestwrap = new CropAndPestWrap();
                        croppestwrap.Id = freesampleCropPest.Target_Pest__c;
                        croppestwrap.Name = freesampleCropPest.Target_Pest__r.Name;
                        croppestwrap.prod_id = freesampleCropPest.Product__c;
                        croppestwrap.recordTypeName = freesampleCropPest.recordType.Name;
                        lstCropPestWrap.add(croppestwrap);
                        mappestWrap.put(freesampleCropPest.Free_Sampling_Product__c, lstCropPestWrap);
                    }
                }
            }
            System.debug('mapFreeCropPestWrap '+mapFreeCropPestWrap);
            for(String s:mapFreeCropPestWrap.keySet()){
                FreeSampleProductWrap freesampleProduct = new FreeSampleProductWrap();
                System.debug('mapCropWrap outer'+mapCropWrap);
                System.debug('key '+s);
                if(mapCropWrap.containsKey(s)){
                    System.debug('mapCropWrap '+mapCropWrap);
                    ProductWrap pw = new ProductWrap();
                    pw.crop = mapCropWrap.get(s);
                    freesampleProduct.product.crop = mapCropWrap.get(s);
                    freesampleProduct.product.Id = mapFreeCropPestWrap.get(s).Product__c;
                    freesampleProduct.product.Name = mapFreeCropPestWrap.get(s).Product__r.Name;
                }
                if(mappestWrap.containsKey(s)){
                    System.debug('mapCropWrap '+mappestWrap);
                    ProductWrap pw = new ProductWrap();
                    pw.CropPest = mappestWrap.get(s);
                    freesampleProduct.product.CropPest = mappestWrap.get(s);
                    freesampleProduct.product.Id = mapFreeCropPestWrap.get(s).Product__c;
                    freesampleProduct.product.Name = mapFreeCropPestWrap.get(s).Product__r.Name;
                    freesampleProduct.product.NRV = String.valueOf(mapFreeCropPestWrap.get(s).Product__r.Budget_NRV__c);
                }
                freesampleProduct.Id = mapFreeCropPestWrap.get(s).Free_Sampling_Product__c;
                freesampleProduct.demo_size = String.valueOf(mapFreeCropPestWrap.get(s).Free_Sampling_Product__r.Demo_Size_Acer__c);
                freesampleProduct.dose_acre = String.valueOf(mapFreeCropPestWrap.get(s).Free_Sampling_Product__r.Dose_Acre_GM_ML_L_Per_Acre__c);
                freesampleProduct.numberOfDemo =  String.valueOf(mapFreeCropPestWrap.get(s).Free_Sampling_Product__r.Number_of_Demo__c);
                freesampleProduct.material_value = String.valueOf(mapFreeCropPestWrap.get(s).Free_Sampling_Product__r.Demo_material_value__c);
                lstFreesampleProductWrap.add(freesampleProduct);
            } 
            System.debug('lstFreesampleProductWrap '+lstFreesampleProductWrap);
           return lstFreesampleProductWrap;
    }

    @AuraEnabled
    public static string deleteFreeSampleProduct(List<String> freeSampleProductIds){
        List<Free_Sampling_Crop_Pest__c> lstfsp =[select Id,Name,Free_Sampling_Product__c from Free_Sampling_Crop_Pest__c where Free_Sampling_Product__c IN:freeSampleProductIds];
        List<Free_Sampling_Product__c> lst =  [select Id from Free_Sampling_Product__c where Id IN:freeSampleProductIds];
        if(lst.size()>0){
            if(lstfsp.size()>0){
                delete lstfsp;
            }
            delete lst;
        }
        return 'Deleted';
    }

    @AuraEnabled
    public static Free_Sample_Management__c submitForApproval(String fsm_id){
        Free_Sample_Management__c fsm = new Free_Sample_Management__c();
        fsm = [SELECT Id,Name,SalesOrg__c,Territory_Manager__c,Raised_By__c,Territory__c,Depot__c,Status__c,Sub_Status__c,Office_Manager__c,Approval_Submission_Date_Time__c from Free_Sample_Management__c where Id=:fsm_id];
        if(fsm.Raised_By__c=='FMM' || fsm.Raised_By__c=='RM'){
            fsm.Status__c = 'Draft';
            fsm.Sub_Status__c = 'Pending for Approval 2';
        }
        if(fsm.Raised_By__c=='ZMM'){
            fsm.Status__c = 'Draft';
            fsm.Sub_Status__c = 'Pending for Approval 3';
        }
        update fsm;
        
        setApprovalProcess(fsm);
        return fsm;
    }
    @AuraEnabled
    public static String reCallApprovalProcess(String fsmid) {
       
        try {
            Free_Sample_Management__c fsm = [select Id,Name,PO_Number__c,Approval_Submission_Date_Time__c,Auto_Approved_1__c,RMNotification12HrsChecked__c,ZMNotification18HrsChecked__c,X1st_Approval_Date_Time__c,X2nd_Approval_Date_Time__c,X3rd_Approval_Date_Time__c,Auto_Approved_2__c,ZMNotification12HrsChecked__c,RMNotification18HrsChecked__c from Free_Sample_Management__c where Id=:fsmid];
            fsm.Approval_Submission_Date_Time__c = null;
            fsm.Auto_Approved_1__c = false;
            fsm.RMNotification12HrsChecked__c = false;
            fsm.ZMNotification18HrsChecked__c = false;
            fsm.X1st_Approval_Date_Time__c = null;
            fsm.X2nd_Approval_Date_Time__c = null;
            fsm.X3rd_Approval_Date_Time__c = null;
            fsm.Auto_Approved_2__c = false;
            fsm.ZMNotification12HrsChecked__c = false;
            fsm.RMNotification18HrsChecked__c = false;
            update fsm;
            return 'reset';
        } catch (Exception e) {
            return 'error'+e.getMessage();
        }
    }

    public static Id getWorkItemId(String targetObjectId){
        Id retVal = null;
        for(ProcessInstanceWorkitem workItem  : [Select p.Id from ProcessInstanceWorkitem p where p.ProcessInstance.TargetObjectId =: targetObjectId]){
            retVal  =  workItem.Id;
        }
        return retVal;
    }

    public static void setApprovalProcess(Free_Sample_Management__c fsm) {
        System.debug('FSM ID '+fsm.Id);
        Approval.ProcessSubmitRequest req1 = new Approval.ProcessSubmitRequest();
        // req1.setComments('Submitting request for approval automatically Test');
        req1.setObjectId(fsm.id);
        req1.setNextApproverIds(new Id[] {fsm.Office_Manager__c});
        // Submit the approval request for the Opportunity
        Approval.ProcessResult result = Approval.process(req1);
        System.debug('Result  '+result);
    }

    public static void sendEmailToUser(String obj_id){
        Free_Sample_Management__c fsm = [select Id,Name,Status__c,Sub_Status__c,Depot__c,Depot__r.Name,Depot__r.Depot_person__c,Depot__r.HO_Commercial__c,Territory_Manager__c,Territory_Manager__r.Email,Office_Manager__c,Office_Manager__r.Email,Sales_Assistant__c,Sales_Assistant__r.Email,Technical_Manager__r.Email,PO_Number__c,Material_Dispatched_Date__c,Owner.Email from Free_Sample_Management__c where Id=:obj_id];

        List<Free_Sampling_Product__c> lst_fsp = [Select Id,Name,Product__c,Product__r.Name,Dose_Acre_GM_ML_L_Per_Acre__c,Demo_Size_Acer__c,Number_of_Demo__c from Free_Sampling_Product__c where Free_Sampling__c=:obj_id];

        List<Free_Sampling_Crop_Pest__c> lst_cropPest = [select Id,Name,Product__c,Free_Sampling__c,RecordType.Name,Product__r.Name,Target_Crop__r.Name,Target_Pest__r.Name from Free_Sampling_Crop_Pest__c where Free_Sampling__c=:obj_id];

        System.debug('obj_id '+obj_id);
        //String url = 'http://uplltd.force.com/MaterialRequisition'; //production
        String url = 'https://uat-uplltd.cs117.force.com/MaterialRequisition'; //UAT
        String massapproval = 'http://uplltd.force.com/requisitionapprover';//production
        // String url = 'https://upltest-uplltd.cs57.force.com/MaterialRequisition'; //test
        // String massapproval = 'https://upltest-uplltd.cs57.force.com/requisitionapprover'; //test
        String mailbody = '';
        Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
        List<String> lst_email = new List<String>();
        lst_email.add('sandeep.vishwakarma@skinternational.com');
        if(fsm.Status__c=='Pending' && fsm.Sub_Status__c=='Pending from HO Commercial'){
            lst_email.add(fsm.Depot__r.HO_Commercial__c);
            mail.setSubject('Material Requisition: '+fsm.Name+' (Pending from HO Commercial)');
            mailbody+='<br><img src="https://upl--upltest.cs57.my.salesforce.com/servlet/servlet.ImageServer?id=0150k000000izrV&oid=00D0k000000Cq7D" alt="Company Logo" height="68" width="85"/><p><b>Dear Sir/Madam,</b></p><br/><p>PO Number for '+fsm.Name+' material requisition is updated. Please check below link to approve or reject the Material requisition</p><br><a href="'+url+'?recordId='+obj_id+'&vf=H">Click here</a> to view Details </br><p><a href="'+massapproval+'">Click here</a> to mass approve/reject the Material Requisition</p><br></br><br><b>Thank You,</b></br><br><b>UPL TEAM</b></br>';
            lst_email.add('sandeep.vishwakarma@skinternational.com');
        }
        if(fsm.Status__c=='Pending from Depot' && fsm.Sub_Status__c=='for Dispatch Details'){
            lst_email.add(fsm.Depot__r.Depot_person__c);
            mail.setSubject('Material Requisition: '+fsm.Name+' (For Dispatch Details)');
            mailbody+='<br><img src="https://upl--upltest.cs57.my.salesforce.com/servlet/servlet.ImageServer?id=0150k000000izrV&oid=00D0k000000Cq7D" alt="Company Logo" height="68" width="85"/><p><b>Dear Sir/Madam,</b></p><br/><p>' +fsm.Name+' material requisition is approved by HO Commercial. Please check below link to update the material dispatch date </p><br><a href="'+url+'?recordId='+obj_id+'&vf=D">Click here</a> to view Details </br><br></br><br><b>Thank You,</b></br><br><b>UPL TEAM</b></br>';
        }
        if(fsm.Status__c=='Rejected' && fsm.Sub_Status__c=='Rejected by HO Commercial'){
            mail.setSubject('Material Requisition: '+fsm.Name+' (Rejected by HO Commercial)');
            mailbody+='<br><img src="https://upl--upltest.cs57.my.salesforce.com/servlet/servlet.ImageServer?id=0150k000000izrV&oid=00D0k000000Cq7D" alt="Company Logo" height="68" width="85"/><p><b>Dear Sir/Madam,</b></p><br/><p><b>Sample Requisition "'+fsm.Name+'" is Rejected</b></p><br>';
            if(fsm.Owner.Email!=null){
                lst_email.add(fsm.Owner.Email);
            }
            mailbody+=getTableEmailBody(fsm,lst_fsp,lst_cropPest);
        }
        if(fsm.Status__c=='Closed'){
            mail.setSubject('Material Requisition: '+fsm.Name+' (Closed)');
            mailbody+='<br><img src="https://upl--upltest.cs57.my.salesforce.com/servlet/servlet.ImageServer?id=0150k000000izrV&oid=00D0k000000Cq7D" alt="Company Logo" height="68" width="85"/><p><b>Dear Sir/Madam,</b></p><br/><p>Find below details of Material Requisition.</p><br>';
            if(fsm.Territory_Manager__c!=null){
                lst_email.add(fsm.Territory_Manager__r.Email);
            }
            mailbody+=getTableEmailBody(fsm,lst_fsp,lst_cropPest);
            if(!String.isEmpty(fsm.Sales_Assistant__r.Email)){
                lst_email.add(fsm.Sales_Assistant__r.Email);
            }
            if(!String.isEmpty(fsm.Technical_Manager__r.Email)){
                lst_email.add(fsm.Technical_Manager__r.Email);
            }
            if(!String.isEmpty(fsm.Office_Manager__r.Email)){
                lst_email.add(fsm.Office_Manager__r.Email);
            }
        }
        if(lst_email.size()>0){
        mail.setToAddresses(lst_email);
        mail.setSubject('Material Requisition: '+fsm.Name);
        mail.setHtmlBody(mailbody);
        mail.setBccSender(false); 
        mail.setUseSignature(false); 
        mail.setSenderDisplayName('UPL Team'); 
        mail.setSaveAsActivity(false); 
        Messaging.sendEmail(new Messaging.SingleEmailMessage[] { mail });
        }
    }

    @AuraEnabled
    public static Boolean approveRecord(String fsmid,String comment){
        Approval.ProcessWorkitemRequest req = new Approval.ProcessWorkitemRequest();
        req.setComments(comment);
        req.setAction('Approve');
        // req.setNextApproverIds(new Id[] {opp.Next_Approver__c});
        Id workItemId = getWorkItemId(fsmid);
        req.setWorkitemId(workItemId);
        Approval.ProcessResult result =  Approval.process(req);
        if(result.isSuccess()){
            sendEmailToUser(fsmid);
        }
        return result.isSuccess();
    }

    @AuraEnabled
    public static Boolean rejectRecord(String fsmid,String comment){
        Approval.ProcessWorkitemRequest req = new Approval.ProcessWorkitemRequest();
        req.setComments(comment);
        req.setAction('Reject');
        Id workItemId = getWorkItemId(fsmid); 
        req.setWorkitemId(workItemId);
        Approval.ProcessResult result =  Approval.process(req);
        if(result.isSuccess()){
            // sendEmailToUser(fsmid);
        }
        return result.isSuccess();
    }
    @AuraEnabled
    public static string getProductNRV(String prodid){
        double nrv = [select Id,Budget_NRV__c from Product2 where Id=:prodid].Budget_NRV__c;
        return String.valueOf(nrv);
    }
    
    public class FreeSampleProductWrap {
        @AuraEnabled public String Id;
        @AuraEnabled public ProductWrap product;
        @AuraEnabled public String dose_acre;
        @AuraEnabled public String demo_size;
        @AuraEnabled public String numberOfDemo;
        @AuraEnabled public String material_value;
        @AuraEnabled public String productNRV;

        public FreeSampleProductWrap(){
            Id = '';
            product = new ProductWrap();
            dose_acre = '';
            demo_size = '';
            numberOfDemo = '';
            material_value = '';
            productNRV = '';
        }

    }
    
    public class ProductWrap {
        @AuraEnabled public String Id;
        @AuraEnabled public String Name;
        @AuraEnabled public String NRV;
        @AuraEnabled public List<CropAndPestWrap> crop;
        @AuraEnabled public List<CropAndPestWrap> CropPest;
        public ProductWrap(){
            Id = '';
            Name = '';
            NRV = '';
            Crop = new List<CropAndPestWrap>();
            CropPest = new List<CropAndPestWrap>();
        }
    }

    public class CropAndPestWrap{
        @AuraEnabled public String Id;
        @AuraEnabled public String Name;
        @AuraEnabled public String prod_id;
        @AuraEnabled public String recordTypeName;

        public CropAndPestWrap(){
            Id='';
            Name='';
            prod_id = '';
            recordTypeName = '';
        }
    }
    public static string getTableEmailBody(Free_Sample_Management__c fsm,List<Free_Sampling_Product__c> lst_fsp,List<Free_Sampling_Crop_Pest__c> lst_cropPest){
        String htmlBody = '';
        String material_dispatch = fsm.Material_Dispatched_Date__c!=null?fsm.Material_Dispatched_Date__c.format():'--';
        htmlBody = '<p><b>Material Requisition Details:</b></p><table border="1"><tr ><th>Material Requisition</th><td>'+fsm.Name+'</td></tr><tr ><th>Depot</th><td>'+fsm.Depot__r.Name+'</td></tr><tr ><th>PO Number</th><td> '+fsm.PO_Number__c+'</td></tr><tr ><th>Material Dispatched Date</th><td> '+material_dispatch+'</td></tr><tr ><th>Status</th><td>'+fsm.Status__c+'</td></tr></table>';

        htmlBody += '<br><p><b>Free Sample Product</b></p><table border="1" style="border-collapse: collapse"><tr><th style="background-color:#87CEEB">Product Name</th><th style="background-color:#87CEEB">Demo Plot Size (Acre)</th><th style="background-color:#87CEEB">Dose per acre (Gram / ML)</th><th style="background-color:#87CEEB">Number of Demo</th></tr>';
        for(Free_Sampling_Product__c fsp : lst_fsp){
            String productName = fsp.Product__r.Name; if(fsp.Product__r.Name == null){productName = '--';}
            String Demo_Acre = String.valueOf(fsp.Dose_Acre_GM_ML_L_Per_Acre__c); if(fsp.Dose_Acre_GM_ML_L_Per_Acre__c == null){Demo_Acre = '--';}
            String Demo_size = String.valueOf(fsp.Demo_Size_Acer__c); if(fsp.Demo_Size_Acer__c == null){Demo_size = '--';}
            String Number_of_Demo = String.valueOf(fsp.Number_of_Demo__c); if(fsp.Number_of_Demo__c == null){Number_of_Demo = '--';}
            htmlBody += '<tr><td>' + productName + '</td><td>' + Demo_Acre + '</td><td>' + Demo_size + '</td><td>' + Number_of_Demo + '</td></tr>';
        }
        htmlBody += '</table><br><br>';

        htmlBody += '<p><b>Free sample Crop and Pest Details:</b></p><table border="1" style="border-collapse: collapse"><tr><th style="background-color:#87CEEB">Type</th><th style="background-color:#87CEEB">Product Name</th><th style="background-color:#87CEEB">Target Crop</th><th style="background-color:#87CEEB">Target Pest</th></tr>';

        for(Free_Sampling_Crop_Pest__c cp : lst_cropPest){
            String type = cp.RecordType.Name; if(cp.RecordType.Name == null){type = '--';}
            String product_name = String.valueOf(cp.Product__r.Name); if(cp.Product__r.Name == null){product_name = '--';}
            String crop_name = String.valueOf(cp.Target_Crop__r.Name); if(cp.Target_Crop__r.Name == null){crop_name = '--';}
            String pest_name = String.valueOf(cp.Target_Pest__r.Name); if(cp.Target_Pest__r.Name == null){pest_name = '--';}
            htmlBody += '<tr><td>' + type + '</td><td>' + product_name + '</td><td>' + crop_name + '</td><td>' + pest_name + '</td></tr>';
        }
        htmlBody += '</table>';

        system.debug('Email Body: ' + htmlBody); 
        return htmlBody;
    }
}