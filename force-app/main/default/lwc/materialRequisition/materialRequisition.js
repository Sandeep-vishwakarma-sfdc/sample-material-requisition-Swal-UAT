import addProduct from '@salesforce/apex/SampleMaterialRequisition.addProduct';
import getFreesampling from '@salesforce/apex/SampleMaterialRequisition.getFreesampling';
import getSalesOrgCode from '@salesforce/apex/SampleMaterialRequisition.getSalesOrgCode';
import { LightningElement,track, wire,api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getProductList from '@salesforce/apex/SampleMaterialRequisition.getProductList';
import deleteFreeSampleProduct from '@salesforce/apex/SampleMaterialRequisition.deleteFreeSampleProduct';
import { NavigationMixin } from 'lightning/navigation';
import getFreesamplingById from '@salesforce/apex/SampleMaterialRequisition.getFreesamplingById';
import submitForApproval from '@salesforce/apex/SampleMaterialRequisition.submitForApproval';
import getDepot from '@salesforce/apex/SampleMaterialRequisition.getDepot';
import getManagers from '@salesforce/apex/SampleMaterialRequisition.getManagers';
import saveFreeSampleManagement from '@salesforce/apex/SampleMaterialRequisition.saveFreeSampleManagement';
import getProfile from '@salesforce/apex/SampleMaterialRequisition.getProfile';
import approveRecord from '@salesforce/apex/SampleMaterialRequisition.approveRecord';
import rejectRecord from '@salesforce/apex/SampleMaterialRequisition.rejectRecord';
import getCurrentUser from '@salesforce/apex/SampleMaterialRequisition.getCurrentUser';
import getProductNRV from '@salesforce/apex/SampleMaterialRequisition.getProductNRV';
import reCallApprovalProcess from '@salesforce/apex/SampleMaterialRequisition.reCallApprovalProcess';
import updateFsp from '@salesforce/apex/SampleMaterialRequisition.updateFSP';


const Depot = 'D';
const Ho_commercial = 'H';

export default class MaterialRequisition extends NavigationMixin(LightningElement) {
    @track buttonmatrixobj = {'saveDisable':false,'editDisable':false,'cancelDisable':false,'submit_for_approvalDisable':true,'approveDisable':true,'rejectDisable':true,'approval_histroyDisable':false,'deleteDisable':false,'addbtn':false,'canclebtn':false,'saveHidden':false,'editHidden':false,'cancelHidden':false,'submit_for_approvalHidden':false,'approveHidden':false,'rejectHidden':false,'approval_histroyhidden':false,'ho_statushidden':true};
    @track salesOrgCode = '';
    @track product_filter = '';
    @track crop_filter = '';
    @track pest_filter = '';
    @track crop = {'Id':'','Name':''};
    @track crop_lst = []; 
    @track pest = {'Id':'','Name':''};
    @track pest_lst = [];
    @track disable = {'Product':false,'Crop':true,'Pest':true,'Depot':false,'Status':true,'sub_status':true,'po_number':true,'material_dispatch_on':true,'demo_acre':false,'demo_size':false,'number_of_size':false,'approve_by_rm':true,'approve_by_zml':true,'approve_by_hom':true,'ho_comment':true,'ho_status':true,'comment':true,'fspItemDemoSize':true,'fspItemDemoAcre':true,'fspItemNumberOfDemo':true};
    @track freesampling = {'Id':'','Depot':'','status':'','substatus':'','po_number':'','material_dispatch_on':''};
    @track validate = {
        product:false,
        demo_size:false,
        dose_acre:false,
        numberOfDemo:false,
        crop:false,
        CropPest:false,
        material_dispatch_on:false,
        po_number:false,
        depot:false,
    }
    productItemValidateCount= 0;
    @track freesampleObj ={'Name':'','Depot':'','Depot__r':{'Name':''}};
    @track lstfreeSampleProduct = [];
    @track freeSampleProduct = {
        'Id':'',
        'product':{'Id':'','Name':'','NRV':'','crop':[],'CropPest':[]},
        'dose_acre':'',
        'demo_size':'',
        'numberOfDemo':'',
        'DemoSampleQty':'',
        'material_value':''
    };
    @track fakeId = 1;
    @track hasRendered = {'Freesampling':false,'spinner':false};
    @track productSection = false;
    @track deleteProductId = [];
    @track lstDepotOption = [];
    @track profile_name = '';
    @track ho_status = '';
    @track ho_statusOption = [{label:'Approve',value:'approve'},{label:'Reject',value:'reject'}];
    @track ho_comment = '';
    @track spinner = false;
    @track customToast = {
        showToast : false,
        message:'Success',
        title:'Success',
        varient:'success'
    }
    @track demo_sample_formula = '';
    @track salesOrg = '';
    approvalClicked = false;
    thirdApprovalChecked = false;
    thresholdValue = '';
    submitForApprovalflag = false;
    actionbyHo = false; 
    is_TM = false;
    aShowModal = false;
    loggedinuser = '';
    opentoast = true;
    message = 'success';
    toast_class = 'slds-text-heading_medium slds-hyphenate success_tost'
    status = {
        'Draft':'Draft',
        'Pending':'Pending',
        'Approve':'Approved',
        'reject':'Rejected',
        'Pending_from_Depot':'Pending from Depot',
        'Pending_from_HO':'Pending from HO',
        'Closed':'Closed'
    }
    sub_status = {
        Pending_for_Approval_1:'Pending for Approval 1',
        Pending_for_Approval_2:'Pending for Approval 2',
        Pending_for_Approval_3:'Pending for Approval 3',
        for_PO_Number:'for PO Number',
        Pending_from_HO_Commercial:'Pending from HO Commercial',
        Approved_by_HO_Commercial:'Approved by HO Commercial',
        Rejected_by_HO_Commercial:'Rejected by HO Commercial',
        for_Dispatch_Details:'for Dispatch Details',
        Draft:'Draft',
        none:'',
        closed:'Closed'
    }
    profiles = {
        'territory_manager':'Territory Manager SWAL',
        // 'territory_manager':'Territory Manager for Swal', //Test
        'FMM_Users':'FMM USER SWAL',
        // 'regional_and_zonal_manager':'Regional/ Zonal for SWAL', //Test
        'Channel_Deployment_Manager_SWAL':'Channel Deployment Manager SWAL(Onboarding)',
        'regional_and_zonal_manager':'Regional/Zonal Manager SWAL',
        'Ho_commercial':'Marketing HO Swal'
    }
    @api freesamplemanagementid = '';
    @api externaluser = '';
    @api getFiredFromAura(){
        window.location.reload();
    }
    @wire(getSalesOrgCode)
    salesOrgCode({error,data}){
        if(data){
            console.log('salesorg ',data);
            this.salesOrgCode = data.Sales_Org_Code__c;
            this.salesOrg = data.Id;
            this.product_filter = `Sales_Org_Code__c='${this.salesOrgCode}' and isActive=true order by Name ASC limit 15`;
            this.crop_filter = `Sales_Org_Code__c='1000' order by Name ASC limit 15`;
            this.pest_filter =  `Name!=null order by Name ASC limit 15`;
        }
        if(error){
            console.log('Err ',error);
        }
    }
    @wire(getProfile)
    getLoggedInProfile({error,data}){
        console.log('Profile Name ',data);
        if(data){
            this.profile_name = data;
            if(this.profile_name==this.profiles.territory_manager){
                this.is_TM = true;
                this.disable.comment = false;
            }
        }
    }
    @wire(getCurrentUser)
    getUser({error,data}){
        if(data){
            this.loggedinuser = data;
            console.log('current user ',this.loggedinuser);
        }
    }
    
    connectedCallback(){
        
    }

    renderedCallback(){
        
        if(this.externaluser==Depot || this.externaluser==Ho_commercial){
            this.buttonmatrixobj.cancelHidden = true;
        }
        if(!this.hasRendered.Freesampling){
            
            if(this.freesamplemanagementid==''){
            getFreesampling().then(data=>{
                console.log('*** NEW *** ',data);
                this.getFreeSampleManagement(data);
                this.externalUserButtonMatrix();
            }).catch(err=>console.log('Exception1 getFreeSampleManagement--> ',err));
            }else if(this.freesamplemanagementid){
                console.log('Free sample Id ',this.freesamplemanagementid);
            getFreesamplingById({freeSampleMangtId:this.freesamplemanagementid}).then(data=>{
                console.log('*** Edit ***',data);
                this.getFreeSampleManagement(data);
                this.externalUserButtonMatrix();
            }).catch(err=>console.log('Exception2 getFreeSampleManagement--> ',err));
            }
            
        }
        if(this.hasRendered.spinner==false){
            this.spinner = true;
            setTimeout(() => {
                this.spinner = false;
            }, 2000);
            this.hasRendered.spinner = true;
        }
    }

    externalUserButtonMatrix(){
        
        if(this.freesampleObj.Status__c==this.status.Draft || this.freesampleObj.Status__c==this.status.reject){
            this.buttonmatrixobj.approval_histroyDisable = this.freesampleObj.Status__c==this.status.Draft?true:false;
            if(this.profile_name==this.profiles.territory_manager){
                if(this.freesampleObj.Id){
                    this.buttonmatrixobj.addbtn = false;
                    this.disablefield(false,false,false,false,true,true);
                    this.disableButton(false,false,false,true,true,false);
                }else{
                    this.buttonmatrixobj.addbtn = false;
                    this.disablefield(false,false,false,false,true,true);
                    this.disableButton(false,true,false,true,true,false);
                }
            }else{
                this.buttonmatrixobj.addbtn = true;
                this.disablefield(true,true,true,true,true,true);
                this.disableButton(true,true,true,true,true,true);
            }
        }else
        if(this.freesampleObj.Status__c==this.status.Pending && this.freesampleObj.Sub_Status__c==this.sub_status.Pending_for_Approval_1){
            this.is_TM = false;
            this.buttonmatrixobj.addbtn = true;
            this.disablefield(true,true,true,true,true,true);
            console.log('Test 218 ',this.profile_name==this.profiles.regional_and_zonal_manager || this.profile_name == this.profiles.FMM_Users || this.profile_name==this.profiles.Channel_Deployment_Manager_SWAL);
            if(this.profile_name==this.profiles.regional_and_zonal_manager || this.profile_name == this.profiles.FMM_Users || this.profile_name==this.profiles.Channel_Deployment_Manager_SWAL){
                console.log('Test 220',this.freesampleObj.Office_Manager__c==this.loggedinuser)
                if(this.freesampleObj.Office_Manager__c==this.loggedinuser){
                    this.disableButton(true,true,true,false,false,true);
                    this.disableFspItems(false,false,false);
                }else{
                    this.disableButton(true,true,true,true,true,true);
                }
            }else{
                this.disableButton(true,true,true,true,true,true);
            }
        }else
        if(this.freesampleObj.Status__c==this.status.Pending && this.freesampleObj.Sub_Status__c==this.sub_status.Pending_for_Approval_2){
            this.is_TM = false;
            this.buttonmatrixobj.addbtn = true;
            this.disablefield(true,true,true,true,true,true);
            if(this.profile_name==this.profiles.regional_and_zonal_manager  || this.profile_name == this.profiles.FMM_Users || this.profile_name==this.profiles.Channel_Deployment_Manager_SWAL){
                if(this.freesampleObj.Sales_Assistant__c ==this.loggedinuser){
                    this.disableButton(true,true,true,false,false,true);
                }else{
                    this.disableButton(true,true,true,true,true,true);
                }
            }else{
                this.disableButton(true,true,true,true,true,true);
            }
        }else
        if(this.freesampleObj.Status__c==this.status.Pending && this.freesampleObj.Sub_Status__c==this.sub_status.Pending_for_Approval_3){
            this.is_TM = false;
            console.log('FSM obj -->',this.freesampleObj,'Profile '+this.profiles.Ho_commercial,' login user ',this.loggedinuser);
            this.buttonmatrixobj.addbtn = true;
            this.disablefield(true,true,true,true,true,true);
            if(this.profile_name==this.profiles.Ho_commercial){
                if(this.freesampleObj.Technical_Manager__c  ==this.loggedinuser){
                    console.log('Third Person');
                    this.disableButton(true,true,true,false,false,true);
                }else{
                    this.disableButton(true,true,true,true,true,true);
                }
            }else{
                this.disableButton(true,true,true,true,true,true);
            }
        }else
        if(this.freesampleObj.Status__c==this.status.Pending_from_Depot && this.freesampleObj.Sub_Status__c==this.sub_status.for_PO_Number){
            this.is_TM = false;
            this.buttonmatrixobj.addbtn = true;
            this.disablefield(true,true,true,true,true,true);
            if(this.externaluser==Depot){
                if(this.freesampleObj.PO_Number__c!=undefined){
                    this.disable.po_number = false;
                    this.disableButton(false,true,true,true,true,true);
                }else{
                    this.disable.po_number = false;
                    this.disableButton(false,true,true,true,true,true);
                }
            }else{
                this.disableButton(true,true,true,true,true,true);
            }
        }else
        if(this.freesampleObj.Status__c==this.status.Pending_from_Depot && this.freesampleObj.Sub_Status__c==this.sub_status.for_Dispatch_Details){
            this.is_TM = false;
            this.buttonmatrixobj.addbtn = true;
            this.disablefield(true,true,true,true,true,true);
            if(this.externaluser==Depot){
                if(this.freesampleObj.Material_Dispatched_Date__c!=undefined){
                    this.disable.material_dispatch_on = true;
                    this.disableButton(true,true,true,true,true,true);
                }else{
                    this.disable.material_dispatch_on = false;
                    this.disableButton(false,true,true,true,true,true);
                }
            }else{
                this.disableButton(true,true,true,true,true,true);
            }
        }else
        if(this.freesampleObj.Status__c==this.status.Pending && this.freesampleObj.Sub_Status__c==this.sub_status.Pending_from_HO_Commercial){
            this.is_TM = false;
            this.buttonmatrixobj.addbtn = true;
            this.disablefield(true,true,true,true,true,true);
            if(this.externaluser==Ho_commercial){
                this.disable.ho_comment = false;
                this.disable.ho_status = false;
                this.buttonmatrixobj.ho_statushidden = false;
                this.disableButton(false,true,true,true,true,true);
            }else{
                this.disableButton(true,true,true,true,true,true);
            }
        }else
        if(this.freesampleObj.Status__c==this.status.Closed){
            this.is_TM = false;
            this.buttonmatrixobj.addbtn = true;
            this.buttonmatrixobj.approval_histroyDisable = false;
            this.disablefield(true,true,true,true,true,true);
            this.disableButton(true,true,true,true,true,true);
        }else
        if(!this.freesampleObj.Status__c){
            this.buttonmatrixobj.addbtn = true;
            this.buttonmatrixobj.approval_histroyDisable = false;
            this.disablefield(true,true,true,true,true,true);
            this.disableButton(true,true,true,true,true,true);
        }else{
            this.buttonmatrixobj.addbtn = true;
            this.buttonmatrixobj.approval_histroyDisable = false;
            this.disablefield(true,true,true,true,true,true);
            this.disableButton(true,true,true,true,true,true);
        }
        
    }
    disableFspItems(demoAcre,demoSize,noOfDemo){
        this.disable.fspItemDemoAcre = demoAcre;
        this.disable.fspItemDemoSize = demoSize;
        this.disable.fspItemNumberOfDemo = noOfDemo;
    }
    getFreeSampleManagement(data){
        this.freesampleObj = data;
        console.log('getFreeSampleManagement ',data);
        if(data.Threshold_value__c){
            this.thresholdValue = data.Threshold_value__c;
        }else if(data.Territory__c){
            this.thresholdValue = data.Territory__r.Zone__r!=undefined?data.Territory__r.Zone__r.Threshold_value__c:'';
            this.thresholdValue = this.thresholdValue==undefined?0:this.thresholdValue;
        }
        console.log('thresholdValue $$$',this.thresholdValue);
        this.freesampling.Id = data.Id != undefined?data.Id:'';
        this.freesampling.Depot = data.Depot__c!=undefined?data.Depot__r.Name:'';
        if(this.freesampling.Depot){
            this.validate.depot = false;
        }
        this.freesampling.status = data.Status__c!=undefined?data.Status__c:'';
        this.freesampling.substatus = data.Sub_Status__c!=undefined?data.Sub_Status__c:'';
        this.freesampling.po_number = data.PO_Number__c!=undefined?data.PO_Number__c:'';
        this.freesampling.material_dispatch_on = data.Material_Dispatched_Date__c!=undefined?data.Material_Dispatched_Date__c:'';
        this.freesampling.X1st_Approval_Date_Time__c = data.X1st_Approval_Date_Time__c!=undefined?this.formatAMPM(data.X1st_Approval_Date_Time__c):'';
        this.freesampling.X2nd_Approval_Date_Time__c = data.X2nd_Approval_Date_Time__c!=undefined?this.formatAMPM(data.X2nd_Approval_Date_Time__c):'';
        this.freesampling.X3rd_Approval_Date_Time__c = data.X3rd_Approval_Date_Time__c!=undefined?this.formatAMPM(data.X3rd_Approval_Date_Time__c):'';
        this.freesampling.Ho_comment__c = data.Ho_comment__c!=undefined?data.Ho_comment__c:'';
        this.freesampling.comment__c = data.Comment__c!=undefined?data.Comment__c:'';
        
        console.log('FSM obj',this.freesampleObj);
        if(this.freesamplemanagementid!=''){
            getProductList({freesamplingId:this.freesamplemanagementid}).then(data=>{
                let fsp = JSON.parse(JSON.stringify(data));
                console.log('lst lstfreeSampleProduct from class ',fsp);
                this.lstfreeSampleProduct = fsp;
                Array.prototype.forEach.call(this.lstfreeSampleProduct,product=>{
                    let demosamplyqty = product.dose_acre*product.demo_size*product.numberOfDemo;
                    let demosampleQtyLtrs = Number(demosamplyqty)>0?(demosamplyqty/1000).toFixed(2):0;
                    product.DemoSampleQty = Number.isNaN(Number(demosampleQtyLtrs))?0:demosampleQtyLtrs;
                    // if(product.material_value){
                    // product.thirdApprovalChecked = Number(product.material_value)>Number(this.thresholdValue)?true:false
                    // }

                });
                this.productSection = this.lstfreeSampleProduct.length > 0?true:false;
            }).catch(err=>console.log('Err ',err));
        }
        if(this.profile_name==this.profiles.territory_manager){
            getManagers().then(data=>{
                console.log('Managers ',data);
                this.freesampleObj.Territory__c = data.Id!=undefined?data.Id:'';
                if(data.Region__c){
                    if(data.Region__r.FMM_User__c && data.Region__r.FMM_User__r.IsActive){
                        this.freesampleObj.Office_Manager__c = data.Region__r.FMM_User__c;
                    }else{
                        if(data.Region__r.RegionHead__c && data.Region__r.RegionHead__r.IsActive)
                            this.freesampleObj.Office_Manager__c = data.Region__c!=undefined?data.Region__r.RegionHead__c:'';
                    }
                }
                if(data.Zone__c){
                    this.thresholdValue = data.Zone__r.Threshold_value__c;
                }
                this.freesampleObj.Sales_Assistant__c  = data.Zone__c!=undefined?data.Zone__r.ZMMUser__c:'';
            }).catch(err=>console.log('ERR getManagers ',err));
        }
        
        getDepot().then(data=>{
            console.log('Depot data ',data);
            this.lstDepotOption = [];
            if(data.length==0){
                if(this.profile_name==this.profiles.territory_manager){
                    this.validate.depot = true;
                }
            }
            if(data){
                for (let i = 0; i < data.length; i++) {
                    this.lstDepotOption = [...this.lstDepotOption, { label: data[i].Depot__r.Name, value: data[i].Depot__c }];
                    this.Depot_details = data;
                    console.log('lst Depot ',this.lstDepotOption);
                    if(this.lstDepotOption.length==1){
                        console.log('Depot2 ',this.lstDepotOption[0].value);
                        this.freesampleObj.Depot__c = this.lstDepotOption[0].value;
                        this.freesampleObj.Depot_Person_Email_ID__c = data[0].Depot__r.Depot_person__c;
                        this.freesampleObj.HO_Commercial_Email_ID__c = data[0].Depot__r.HO_Commercial__c;
                        this.validate.depot = false;
                    }
                }
            }
        });
        this.hasRendered.Freesampling = true;
    }

    handleChangeDepot(event){
        console.log('Id ',event.detail.value);
        this.freesampleObj.Depot__c = event.detail.value;
        let obj = this.Depot_details.find(ele=>ele.Depot__c==event.detail.value)
        if(obj.Depot__c && obj!=undefined){
        this.freesampleObj.Depot_Person_Email_ID__c = obj.Depot__c?obj.Depot__r.Depot_person__c:'';
        this.freesampleObj.HO_Commercial_Email_ID__c = obj.Depot__c?obj.Depot__r.HO_Commercial__c:'';
        this.validate.depot = false;
        }
        console.log('free sample Obj',this.freesampleObj);
    }
    handleApprovalHistroy(){
        if(this.freesampleObj.Id!=undefined){
            console.log('Open Model');
            this.aShowModal = true;
        }
    }
    closeModal(){
        this.aShowModal = false;
    }

    handleAddProduct(){
        if(this.isValidProduct()){
            this.freeSampleProduct.Id = this.fakeId++;
            let obj = JSON.parse(JSON.stringify(this.freeSampleProduct));
            console.log('Obj',obj);
            let isduplicate = this.lstfreeSampleProduct.find(ele =>ele.product.Id==obj.product.Id);
            console.log('is duplicate ',isduplicate);
            if(isduplicate==undefined){
                this.lstfreeSampleProduct.push(obj);
                this.disable.Crop = true;
                this.disable.Pest = true;
            }else{
                // this.showToastmessage('Warning','Duplicate product Not allowed','warning');
                this.showCustomToast('Warning','Duplicate product Not allowed','warning');
                this.disable.Crop = true;
                this.disable.Pest = true;
            }
            console.log('lstfreeSampleProduct ',JSON.stringify(this.lstfreeSampleProduct),'len ',this.lstfreeSampleProduct.length);
            this.clearProductSection();
            if(this.lstfreeSampleProduct.length>0)
                this.productSection = true;
        }
    }
    handleSaveMaterialRequisition(){
        
    if(this.lstfreeSampleProduct.length>0){
        // console.log('Add product',str);
        console.log('this.freesampling obj',this.freesampleObj);
        if(this.freesampleObj.Status__c==this.status.Pending_from_Depot && this.freesampleObj.Sub_Status__c==this.sub_status.for_PO_Number){
            if(this.freesampleObj.PO_Number__c!=undefined && this.freesampleObj.PO_Number__c.toString().trim()){
                if(this.freesampleObj.PO_Number__c!='' && this.freesampleObj.PO_Number__c.toString().trim()){
                    this.showCustomToast('Success','Success','success');
                    this.saveMaterialReq();
                }else{
                    this.showCustomToast('Error','Error','error');
                    this.validate.po_number = true;
                }
            }else{
                // this.showCustomToast('error');
                this.validate.po_number = true;
            }
        }else if(this.freesampling.status==this.status.Pending_from_Depot && this.freesampling.substatus==this.sub_status.for_Dispatch_Details){
            if(this.freesampleObj.Material_Dispatched_Date__c!=undefined){
                if(this.freesampleObj.Material_Dispatched_Date__c!=''){
                    this.showCustomToast('Success','Success','success');
                    this.saveMaterialReq();
                }else{
                    this.showCustomToast('Error','Error','error');
                    this.validate.material_dispatch_on = true;
                }
            }else{
                this.showCustomToast('Error','Error','error');
                this.validate.material_dispatch_on = true;
            }
        }else{
            if(this.validate.depot){
                if(this.externaluser){
                    if(this.validate.po_number==false){
                        this.saveMaterialReq();
                    }
                }else{
                    console.log('Depot validation');
                    // this.showToastmessage('Error','Depot not available','error');
                    this.showCustomToast('Error','Depot not available','error');
                }
            }else{
                if(this.validate.po_number==false){
                    this.saveMaterialReq();
                }
            }
        }
    }
    else{
        // this.showToastmessage('Error','Please add altest one product','error');
        this.showCustomToast('Error','Please add altest one product','error');
        }
    }

    saveMaterialReq(){
        // this.freesampleObj.SalesOrg__c = this.salesOrg;
        this.freesampleObj.Sales_Org__c = this.salesOrg;
        if(Number(this.thresholdValue)){
            this.freesampleObj.Threshold_value__c  = this.thresholdValue;
        }else{
            this.thresholdValue = 0;
            this.freesampleObj.Threshold_value__c  = this.thresholdValue;
        }
        let countThirdApprovalCheck = 0
        this.lstfreeSampleProduct.forEach(product=>{
            console.log('material value > threshold value',Number(product.material_value),' > ',Number(this.thresholdValue))
            if(Number(product.material_value)>Number(this.thresholdValue)){
                countThirdApprovalCheck++;
            }
        });
        console.log('countThirdApprovalCheck ',countThirdApprovalCheck);
        if(countThirdApprovalCheck>0){
            if(this.freesampleObj.Status__c==this.status.reject && this.freesampleObj.Sub_Status__c==this.sub_status.Rejected_by_HO_Commercial && this.externaluser){
                this.freesampleObj.Need_Marketing_HO_Approval__c = false;
            }else{
            this.freesampleObj.Need_Marketing_HO_Approval__c = true;
            }
        }else{
            this.freesampleObj.Need_Marketing_HO_Approval__c = false;
        }
        console.log('FSM new ',this.freesampleObj);
        saveFreeSampleManagement({freeSamplingObj:this.freesampleObj}).then(fsm=>{
             Array.prototype.forEach.call(this.lstfreeSampleProduct,product=>{
                delete product.DemoSampleQty;
                // if(product.thirdApprovalChecked){
                //     delete product.thirdApprovalChecked;
                // }
             });
             console.log('lst FSP ',this.lstfreeSampleProduct);

            let str = JSON.stringify(this.lstfreeSampleProduct); 
            this.freesampleObj = fsm;
            console.log('NEW FSM ID -->',fsm.Id);
            if(this.externaluser!=''){
                setTimeout(() => {
                    location.reload();
                }, 2000);
            }
        if(this.profile_name==this.profiles.territory_manager){    
        addProduct({product:str,freeSamplingId:fsm.Id}).then(data=>{     
            console.log('Material Requisition ',data);
            if(data){
                    if(this.approvalClicked==false){
                        this.showCustomToast('Success', 'Material requisition created', 'success');
                        // this.showToastmessage('Success', 'Material requisition created', 'success');
                    }
                if(this.submitForApprovalflag==true){
                    console.log('SUBMIT FOR APPROVAL CALLED------->');
                    console.log('Id to update',this.freesampleObj.Id);
                    deleteFreeSampleProduct({freeSampleProductIds:this.deleteProductId}).then(mesg=>{
                        submitForApproval({fsm_id:this.freesampleObj.Id}).then(fsm=>{
                            if(fsm){
                                console.log('status ',fsm.Status__c);
                                this.freesampling.status = fsm.Status__c;
                                this.freesampling.substatus = fsm.Sub_Status__c;
                                this.navigateToListView(fsm.Id);
                            }
                        }).catch(err=>console.log('Exception while Submit For Approval ',err));
                    }).catch(err=>console.log('Unable to Delete Record ',err));
                }else{
                    console.log('SAVE ACTION CALLED');
                    deleteFreeSampleProduct({freeSampleProductIds:this.deleteProductId}).then(mesg=>{
                        console.log(mesg);
                        console.log('Approved Clicked ',this.approvalClicked)
                        if(this.approvalClicked==false){
                            console.log('@@@@@ Inside  Approved Clicked')
                            this.navigateToListView(fsm.Id);
                        }
                    }).catch(err=>console.log('Unable to Delete Record ',err));
                }

            }
        
        }).catch(err=>{
            console.log('Exception in adding Product ',err)
            // this.showToastmessage('Error', 'Unable to create Material requisition', 'error');
            this.showCustomToast('Error', 'Unable to create Material requisition', 'error');
        });
        }
        if(this.externaluser==Ho_commercial){
            console.log(`this.freesampleObj.Status__c ${this.freesampleObj.Status__c} this.freesampleObj.Sub_Status__c ${this.freesampleObj.Sub_Status__c}`);
            if(this.freesampleObj.Status__c ==this.status.reject && this.freesampleObj.Sub_Status__c==this.sub_status.Rejected_by_HO_Commercial){
            reCallApprovalProcess({fsmid:this.freesampleObj.Id}).then(data=>{
                console.log(data);
            }).catch((err)=>console.log('ERR while restting ',err));
            }
        }
        });
    }

    handleChangeHoStatus(event){
        this.ho_status = event.detail.value
        console.log('Ho status',this.ho_status);
        this.actionbyHo = true;
        if(this.ho_status=='approve'){
            this.freesampleObj.Status__c = this.status.Pending_from_Depot;
            this.freesampleObj.Sub_Status__c = this.sub_status.for_Dispatch_Details;
        }
        if(this.ho_status=='reject'){
            this.freesampleObj.Status__c = this.status.reject;
            this.freesampleObj.Sub_Status__c = this.sub_status.Rejected_by_HO_Commercial;
            this.freesampleObj.Need_Marketing_HO_Approval__c = false;
        }
    }

    handleSubmitforApproval(){
        this.submitForApprovalflag = true;
        this.handleSaveMaterialRequisition();
    }
    validateFspItem(){
        this.template.querySelectorAll('.fsp-item').forEach(ele=>{
            if(Number(ele.value)<0){
            console.log('ele ',ele.value)
            this.productItemValidateCount++;
           }
        })
    }
    handleApprove(){
        console.log('FSM id',this.freesampleObj.Id);
        this.productItemValidateCount = 0;
        this.approvalClicked = true;
        this.handleSaveMaterialRequisition();
        this.validateFspItem();
        if(this.freesampleObj.Office_Manager__c==this.loggedinuser){
            if(Number(this.productItemValidateCount)==0){
            updateFsp({lstFsp:JSON.stringify(this.lstfreeSampleProduct)}).then(data=>{
                console.log('updateFsp ',data);
            }).catch(err=> console.log('Error uploading product',err))
            }else{
                // this.showToastmessage('Error','Invalid product item','error');
                this.showCustomToast('Error','Invalid product item','error');
            }
        }
        if(Number(this.productItemValidateCount)==0){
         setTimeout(() => {
            approveRecord({fsmid:this.freesampleObj.Id,comment:'Approve'}).then(isSuccess=>{
                if(isSuccess){
                    // this.showToastmessage('Success', 'Approved', 'success');
                    this.showCustomToast('Success', 'Approved', 'success');
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                }else{
                    // this.showToastmessage('Error', 'Unable to approve', 'error');
                    this.showCustomToast('Error', 'Unable to approve', 'error');
                }
            });
         }, 500); 
        }
    }
    handleReject(){
        console.log('FSM id',this.freesampleObj.Id);
        rejectRecord({fsmid:this.freesampleObj.Id,comment:'Reject'}).then(isSuccess=>{
            if(isSuccess){
                // this.showToastmessage('Success', 'Rejected', 'success');
                this.showCustomToast('Success', 'Rejected', 'success');
                setTimeout(() => {
                    location.reload();
                }, 1000);
            }else{
                // this.showToastmessage('Error', 'Unable to reject', 'error');
                this.showCustomToast('Error', 'Unable to reject', 'error');
            }
        });
    }

    handleRemoveFreeSampleProduct(event){
        let id_to_delete = event.target.id.split('-')[0];
        console.log('del Id ',id_to_delete);
        if(id_to_delete.toString().length>14){
            this.deleteProductId.push(id_to_delete);
        }
        let del_index = this.lstfreeSampleProduct.findIndex((ele)=>ele.Id == id_to_delete);
        console.log('del Index ',del_index);
        if(del_index!=-1)
            this.lstfreeSampleProduct.splice(del_index,1);
        console.log('After delete lstfreeSampleProduct ',this.lstfreeSampleProduct,'len ',this.lstfreeSampleProduct.length);
        if(this.lstfreeSampleProduct.length<1)
            this.productSection = false;
    }

    isValidProduct(){
        if(this.hasValue(this.freeSampleProduct.product.Id) && Number(this.freeSampleProduct.demo_size)!=0 && Number(this.freeSampleProduct.dose_acre)!=0 && Number(this.freeSampleProduct.numberOfDemo)!=0 &&this.hasValue(this.freeSampleProduct.product.crop) && this.hasValue(this.freeSampleProduct.product.CropPest)){
            return true;
        }
        if(!this.hasValue(this.freeSampleProduct.product.Id))
            this.validate.product = true;
        if(Number(this.freeSampleProduct.demo_size)==0)
            this.validate.demo_size = true;
        if(Number(this.freeSampleProduct.dose_acre)==0)
            this.validate.dose_acre = true;
        if(Number(this.freeSampleProduct.numberOfDemo)==0)
            this.validate.numberOfDemo = true;
        if(!this.hasValue(this.freeSampleProduct.product.crop))
            this.validate.crop = true;
        if(!this.hasValue(this.freeSampleProduct.product.CropPest))
            this.validate.CropPest = true; 
        return false;
    }

    hasValue(val){
        if(Object.keys(val).length>0){
            console.log('obj key ',Object.keys(val));
            return true;
        }
        return false;
    }

    clearProductSection(){
        Array.prototype.forEach.call(this.template.querySelectorAll('c-lookupcmp'),element => {
            element.clearAllselected();
            element.hitLimit = false;
            element.countItem = 0;
        });
        this.freeSampleProduct.product.Id = '';
        this.freeSampleProduct.product.Name = '';
        this.freeSampleProduct.product.crop = [];
        this.freeSampleProduct.product.CropPest = [];
        this.freeSampleProduct.dose_acre = '';
        this.freeSampleProduct.demo_size= '';
        this.freeSampleProduct.numberOfDemo = ''; 
        this.freeSampleProduct.DemoSampleQty = '';
        this.freeSampleProduct.material_value = '';
     
    }

    handleChangeHOComment(event){
        let val = event.target.value;
        if(val){
            this.ho_comment = val;
            this.freesampleObj.Ho_comment__c = this.ho_comment;
        }
    }
    handleChangeComment(event){
        if(this.profile_name==this.profiles.territory_manager){
            this.freesampleObj.Comment__c = event.target.value;
        }
    }

    handleDemoAcre(event){
        if(this.hasValue(event.target.value)){
            if(Number(event.target.value)>=0){
                this.freeSampleProduct.dose_acre = event.target.value;
                this.validate.dose_acre = false;
            }
        }else{
            this.freeSampleProduct.dose_acre = '';
        }
        let demosampleQty = this.freeSampleProduct.dose_acre*this.freeSampleProduct.demo_size*this.freeSampleProduct.numberOfDemo;
        let demosampleQtyLtrs = Number(demosampleQty)>0?(demosampleQty/1000).toFixed(2):0;
        this.freeSampleProduct.DemoSampleQty = Number.isNaN(Number(demosampleQtyLtrs))?0:demosampleQtyLtrs;
        this.freeSampleProduct.material_value = (Number(this.freeSampleProduct.DemoSampleQty) * Number(this.freeSampleProduct.productNRV)).toFixed(2);
    }
    handleDemoSize(event){
        if(this.hasValue(event.target.value)){
            if(Number(event.target.value)>=0){
                this.freeSampleProduct.demo_size = event.target.value;
                this.validate.demo_size = false;
            }
        }else{
            this.freeSampleProduct.demo_size = '';
        }
        let demosampleQty = this.freeSampleProduct.dose_acre*this.freeSampleProduct.demo_size*this.freeSampleProduct.numberOfDemo;
        let demosampleQtyLtrs = Number(demosampleQty)>0?(demosampleQty/1000).toFixed(2):0;
        this.freeSampleProduct.DemoSampleQty = Number.isNaN(Number(demosampleQtyLtrs))?0:demosampleQtyLtrs;
        this.freeSampleProduct.material_value = (Number(this.freeSampleProduct.DemoSampleQty) * Number(this.freeSampleProduct.productNRV)).toFixed(2);
    }
    handleFspItemDemoSize(event){
        console.log('FSP id',event.target.dataset.id)
        if(Number(event.target.value)>=0){
            if(event.target.dataset.id){
                let fsp = this.lstfreeSampleProduct.find(ele => ele.Id==event.target.dataset.id);
                fsp.demo_size = event.target.value;
                let demosampleQty = fsp.dose_acre*fsp.demo_size*fsp.numberOfDemo;
                let demosampleQtyLtrs = Number(demosampleQty)>0?(demosampleQty/1000).toFixed(2):0;
                fsp.DemoSampleQty = Number.isNaN(Number(demosampleQtyLtrs))?0:demosampleQtyLtrs;
                fsp.material_value = (Number(fsp.DemoSampleQty) * Number(fsp.product.NRV)).toFixed(2);
            }
            console.log('updated demosize',this.lstfreeSampleProduct); 
        }
    }
    handleFspItemDoseAcre(event){
        if(Number(event.target.value)>=0){
            if(event.target.dataset.id){
                let fsp = this.lstfreeSampleProduct.find(ele => ele.Id==event.target.dataset.id);
                fsp.dose_acre = event.target.value;
                let demosampleQty = fsp.dose_acre*fsp.demo_size*fsp.numberOfDemo;
                let demosampleQtyLtrs = Number(demosampleQty)>0?(demosampleQty/1000).toFixed(2):0;
                fsp.DemoSampleQty = Number.isNaN(Number(demosampleQtyLtrs))?0:demosampleQtyLtrs;
                fsp.material_value = (Number(fsp.DemoSampleQty) * Number(fsp.product.NRV)).toFixed(2);
            }
            console.log('updated dose_acre',this.lstfreeSampleProduct); 
        }
    }
    handlefspNumberOfDemo(event){
        if(Number(event.target.value)>=0){
            if(event.target.dataset.id){
                let fsp = this.lstfreeSampleProduct.find(ele => ele.Id==event.target.dataset.id);
                fsp.numberOfDemo = event.target.value;
                let demosampleQty = fsp.dose_acre*fsp.demo_size*fsp.numberOfDemo;
                let demosampleQtyLtrs = Number(demosampleQty)>0?(demosampleQty/1000).toFixed(2):0;
                fsp.DemoSampleQty = Number.isNaN(Number(demosampleQtyLtrs))?0:demosampleQtyLtrs;
                fsp.material_value = (Number(fsp.DemoSampleQty) * Number(fsp.product.NRV)).toFixed(2);
            }
            console.log('updated numberOfDemo',this.lstfreeSampleProduct); 
        }
    }

    handleNumberOfDemo(event){
        if(this.hasValue(event.target.value)){
            if(Number(event.target.value)>=0){
                this.freeSampleProduct.numberOfDemo = event.target.value;
                this.validate.numberOfDemo = false;
            }
        }else{
            this.freeSampleProduct.numberOfDemo = '';
        }
        let demosampleQty = this.freeSampleProduct.dose_acre*this.freeSampleProduct.demo_size*this.freeSampleProduct.numberOfDemo;
        let demosampleQtyLtrs = Number(demosampleQty)>0?(demosampleQty/1000).toFixed(2):0;
        this.freeSampleProduct.DemoSampleQty = Number.isNaN(Number(demosampleQtyLtrs))?0:demosampleQtyLtrs;
        this.freeSampleProduct.material_value = (Number(this.freeSampleProduct.DemoSampleQty) * Number(this.freeSampleProduct.productNRV)).toFixed(2);
    }
    handleChangePoNumber(event){
        let val = event.target.value;
        val = val.toString().trim();
        console.log('846 ',val+' len ',val.length);
        if(val){
            this.freesampleObj.PO_Number__c = val;
            this.freesampleObj.Status__c = this.status.Pending;
            this.freesampleObj.Sub_Status__c = this.sub_status.Pending_from_HO_Commercial;
            this.validate.po_number = false;
        }else{
            this.freesampleObj.PO_Number__c = '';
            this.validate.po_number = true;
        }
    }
    handleChangeMaterialDispatch(event){
        this.freesampleObj.Material_Dispatched_Date__c = event.target.value;
        if(this.freesampleObj.Material_Dispatched_Date__c!=undefined){
            this.validate.material_dispatch_on = false;
        }
        this.freesampleObj.Status__c = this.status.Closed;
        this.freesampleObj.Sub_Status__c = this.sub_status.closed;
        console.log('Material Date',this.freesampleObj.Material_Dispatched_Date__c);
    }

    handleProductSelected(event){
        console.log(`handleProductSelected ${event.detail.recId}-${event.detail.recName}`);
        this.freeSampleProduct.product.Id = event.detail.recId;
        this.freeSampleProduct.product.Name = event.detail.recName;
        getProductNRV({prodid:this.freeSampleProduct.product.Id}).then(nrv=>{
            this.freeSampleProduct.product.NRV = nrv;
            this.freeSampleProduct.productNRV = nrv;
        }).catch(err=>console.log('Error getting product NRV'))
        if(this.freeSampleProduct.product.Id){
            this.disable.Crop = false;
            this.disable.Pest = false;
        }
        this.validate.product = false;
    }
    handleRemoveProduct(){
        console.log('Removing product ',this.product);
        this.freeSampleProduct.product.Id = '';
        this.freeSampleProduct.product.Name = '';
        this.freeSampleProduct.product.NRV = '';
        this.freeSampleProduct.productNRV = '';
        this.disable.Crop = true;
        this.disable.Pest = true;
    }
    handleBacktoRecord(){
        console.log('FSM Id ',this.freesampling.Id)
        if(this.freesampling.Id!=''){
            this.navigateToListView(this.freesampling.Id);  
        }else{
            window.history.back();
        }     
    }
    handleMultipleCropSelected(event){
        let lst = event.detail;
        console.log('event details',event.detail);
        let temp = [];  
        Array.prototype.forEach.call(lst,ele=>{
            let obj = {
                'Id':ele.recId,
                'Name':ele.recName,
                'prod_id':this.freeSampleProduct.product.Id,
                'recordTypeName':'Crop'
            }
            temp.push(obj);
        });
        this.crop_lst = temp;
        console.log(`handleMultipleCropSelected`,this.crop_lst);
        this.freeSampleProduct.product.crop = this.crop_lst;
        this.validate.crop = false;
    }
    handleRemoveCrop(event){
        let lst = event.detail;
        let temp = [];
        Array.prototype.forEach.call(lst,ele=>{
            let obj = {
                'Id':ele.recId,
                'Name':ele.recName,
                'prod_id':this.freeSampleProduct.product.Id,
                'recordTypeName':'Crop'
            }
            temp.push(obj);
        });
        this.crop_lst = temp;
        this.freeSampleProduct.product.crop = this.crop_lst;
        this.crop.Id = '';
        this.crop.Name = '';
        console.log('Crops ',this.crop_lst);
    }
    
    handleMultiplePestSelected(event){
         let lst = event.detail;
         let temp = [];
         Array.prototype.forEach.call(lst,ele=>{
            let obj = {
                'Id':ele.recId,
                'Name':ele.recName,
                'prod_id':this.freeSampleProduct.product.Id,
                'recordTypeName':'Pest'
            }
            temp.push(obj);
        });
        this.pest_lst = temp;
         console.log('handleMultiplePestSelected',this.pest_lst);
         this.freeSampleProduct.product.CropPest = this.pest_lst;
         this.validate.CropPest = false;
    }
    handleRemovePest(event){
        let lst = event.detail;
        let temp = [];
        Array.prototype.forEach.call(lst,ele=>{
            let obj = {
                'Id':ele.recId,
                'Name':ele.recName,
                'prod_id':this.freeSampleProduct.product.Id,
                'recordTypeName':'Pest'
            }
            temp.push(obj);
        });
        this.pest_lst = temp;
        this.freeSampleProduct.product.CropPest = this.pest_lst;
        this.pest.Id = '';
        this.pest.Name = '';
        console.log('Pest ',this.pest_lst,'Removing pest',event.detail);
    }
  

    showToastmessage(title, message, varient) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: varient,
            }),
        );
    }

    navigateToListView(rec_id) {
        console.log('@@@@@@@ Record Id in NavigationMixIn',rec_id)
        window.open('/'+rec_id,'_self');
        /* commented on 28-07-2021
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: rec_id,
                objectApiName: 'Free_Sample_Management__c', // objectApiName is optional
                actionName: 'view'
            }
        });*/
    }
// comment third
    disablefield(product,demo_acre,demo_size,num_size,crop,pest){
        this.disable.Product = product;
        this.disable.demo_acre = demo_acre;
        this.disable.demo_size = demo_size;
        this.disable.number_of_size = num_size;
        this.disable.Crop = crop;
        this.disable.Pest = pest;
    }
    disableButton(save,edit,submit,approve,reject,deletebtn){
        this.buttonmatrixobj.saveDisable = save;
        this.buttonmatrixobj.editDisable = edit;
        this.buttonmatrixobj.submit_for_approvalDisable = submit;
        this.buttonmatrixobj.approveDisable = approve;
        this.buttonmatrixobj.rejectDisable = reject;
        this.buttonmatrixobj.deleteDisable = deletebtn;
    }

     formatAMPM(date) {
         date = new Date(date);
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun","Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        let day = date.getDate();
        let month = date.getMonth();
        let year = date.getFullYear();
        let hours = date.getHours();
        let minutes = date.getMinutes();
        let ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0'+minutes : minutes;
        var strTime = hours + ':' + minutes + ' ' + ampm;
        var strDateTime =  day+' '+monthNames[month]+' '+year+' '+strTime
        return strDateTime;
      }
      
      showCustomToast(messg,title,varient){
        this.customToast.showToast = true;
        this.customToast.message = messg;
        this.customToast.title = title;
        let color = 'white';
        //background-color: green
        if(varient=='success'){
            color = 'background-color: #28a754';
        }else if(varient == 'warning'){
            color = 'background-color: #ffc107';
        }else if(varient == 'error'){
            color = 'background-color: #dc3545';
        }
        this.customToast.varient = color;
        setTimeout(() => {
            this.customToast.showToast = false;
        }, 2000);
      }
    
}