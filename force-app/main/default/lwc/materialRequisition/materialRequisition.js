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
    @track disable = {'Product':false,'Crop':true,'Pest':true,'Depot':false,'Status':true,'sub_status':true,'po_number':true,'material_dispatch_on':true,'demo_acre':false,'demo_size':false,'number_of_size':false,'approve_by_rm':true,'approve_by_zml':true,'approve_by_hom':true,'ho_comment':true,'ho_status':true};
    @track freesampling = {'Id':'','Depot':'','status':'','substatus':'','po_number':'','material_dispatch_on':''};
    @track validate = {
        product:false,
        demo_size:false,
        dose_acre:false,
        numberOfDemo:false,
        crop:false,
        CropPest:false,
        material_dispatch_on:false,
        po_number:false
    }
    @track freesampleObj ={'Name':'','Depot':'','Depot__r':{'Name':''}};
    @track lstfreeSampleProduct = [];
    @track freeSampleProduct = {
        'Id':'',
        'product':{'Id':'','Name':'','crop':[],'CropPest':[]},
        'dose_acre':'',
        'demo_size':'',
        'numberOfDemo':''
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
        none:''
    }
    profiles = {
        'territory_manager':'Territory Manager SWAL',
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
            this.product_filter = `Sales_Org_Code__c='${this.salesOrgCode}' order by Name ASC limit 15`;
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
    

    renderedCallback(){
        console.log('Ho status ',this.ho_statusOption);
        // this.ho_statusOption= [{label:'Approve',value:'approve'},{label:'Reject',value:'reject'}];
        console.log('RecId LWC',this.freesamplemanagementid,'VF ',this.externaluser);
        if(this.externaluser==Depot || this.externaluser==Ho_commercial){
            this.buttonmatrixobj.cancelHidden = true;
        }
        console.log('Button Marix',this.buttonmatrixobj);
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
        console.log('Status ',this.freesampleObj.Status__c,'Sub Status ',this.freesampleObj.Sub_Status__c)

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
            if(this.profile_name==this.profiles.regional_and_zonal_manager){
                if(this.freesampleObj.Office_Manager__c==this.loggedinuser){
                    this.disableButton(true,true,true,false,false,true);
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
            if(this.profile_name==this.profiles.regional_and_zonal_manager){
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
                    this.disable.po_number = true;
                    this.disableButton(true,true,true,true,true,true);
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

    getFreeSampleManagement(data){
        this.freesampleObj = data;
        this.freesampling.Id = data.Id != undefined?data.Id:'';
        this.freesampling.Depot = data.Depot__c!=undefined?data.Depot__r.Name:'';
        this.freesampling.status = data.Status__c!=undefined?data.Status__c:'';
        this.freesampling.substatus = data.Sub_Status__c!=undefined?data.Sub_Status__c:'';
        this.freesampling.po_number = data.PO_Number__c!=undefined?data.PO_Number__c:'';
        this.freesampling.material_dispatch_on = data.Material_Dispatched_Date__c!=undefined?data.Material_Dispatched_Date__c:'';
        this.freesampling.X1st_Approval_Date_Time__c = data.X1st_Approval_Date_Time__c!=undefined?this.formatAMPM(data.X1st_Approval_Date_Time__c):'';
        this.freesampling.X2nd_Approval_Date_Time__c = data.X2nd_Approval_Date_Time__c!=undefined?this.formatAMPM(data.X2nd_Approval_Date_Time__c):'';
        this.freesampling.X3rd_Approval_Date_Time__c = data.X3rd_Approval_Date_Time__c!=undefined?this.formatAMPM(data.X3rd_Approval_Date_Time__c):'';
        this.freesampling.Ho_comment__c = data.Ho_comment__c!=undefined?data.Ho_comment__c:'';
        
        console.log('FSM obj',this.freesampleObj);
        if(this.freesamplemanagementid!=''){
            getProductList({freesamplingId:this.freesamplemanagementid}).then(data=>{
                let fsp = JSON.parse(JSON.stringify(data));
                console.log('lst lstfreeSampleProduct from class ',fsp);
                this.lstfreeSampleProduct = fsp;
                this.productSection = this.lstfreeSampleProduct.length > 0?true:false;
            }).catch(err=>console.log('Err ',err));
        }
        if(this.profile_name==this.profiles.territory_manager){
            getManagers().then(data=>{
                this.freesampleObj.Territory__c = data.Id!=undefined?data.Id:'';
                this.freesampleObj.Office_Manager__c = data.Region__c!=undefined?data.Region__r.RegionHead__c:'';
                this.freesampleObj.Sales_Assistant__c  = data.Zone__c!=undefined?data.Zone__r.ZonalHead__c:'';
            }).catch(err=>console.log('ERR getManagers ',err));
        }
        
        getDepot().then(data=>{
            console.log('Depot data ',data);
            this.lstDepotOption = [];
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
                this.showToastmessage('Warning','Duplicate product Not allowed','warning');
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
            if(this.freesampleObj.PO_Number__c!=undefined){
                if(this.freesampleObj.PO_Number__c!=''){
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
            this.saveMaterialReq();
        }
    }
    else{
            this.showToastmessage('Error','Please add altest one product','error');
        }
    }

    saveMaterialReq(){
        saveFreeSampleManagement({freeSamplingObj:this.freesampleObj}).then(fsm=>{
            let str = JSON.stringify(this.lstfreeSampleProduct); 
            this.freesampleObj = fsm;
            console.log('NEW FSM ID -->',fsm.Id);
        addProduct({product:str,freeSamplingId:fsm.Id}).then(data=>{     
            console.log('Material Requisition ',data);
            if(data){
                if(this.externaluser!=''){
                    setTimeout(() => {
                        location.reload();
                    }, 2000);
                }else{
                    this.showToastmessage('Success', 'Material requisition created', 'success');
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
                        this.navigateToListView(fsm.Id);
                    }).catch(err=>console.log('Unable to Delete Record ',err));
                }
            }
        
        }).catch(err=>{
            console.log('Exception in adding Product ',err)
            this.showToastmessage('Error', 'Unable to create Material requisition', 'error');
        });
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
        }
    }

    handleSubmitforApproval(){
        this.submitForApprovalflag = true;
        this.handleSaveMaterialRequisition();
    }
    handleApprove(){
        console.log('FSM id',this.freesampleObj.Id);
        approveRecord({fsmid:this.freesampleObj.Id,comment:'Approve'}).then(isSuccess=>{
            if(isSuccess){
                this.showToastmessage('Success', 'Approved', 'success');
                setTimeout(() => {
                    location.reload();
                }, 1000);
            }else{
                this.showToastmessage('Error', 'Unable to approve', 'error');
            }
        });
    }
    handleReject(){
        console.log('FSM id',this.freesampleObj.Id);
        rejectRecord({fsmid:this.freesampleObj.Id,comment:'Reject'}).then(isSuccess=>{
            if(isSuccess){
                this.showToastmessage('Success', 'Rejected', 'success');
                setTimeout(() => {
                    location.reload();
                }, 1000);
            }else{
                this.showToastmessage('Error', 'Unable to reject', 'error');
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
        this.template.querySelectorAll('c-lookupcmp').forEach(element => {
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
     
    }

    handleChangeHOComment(event){
        let val = event.target.value;
        if(val){
            this.ho_comment = val;
            this.freesampleObj.Ho_comment__c = this.ho_comment;
        }
    }

    handleDemoAcre(event){
        if(this.hasValue(event.target.value)){
            this.freeSampleProduct.dose_acre = event.target.value;
            this.validate.dose_acre = false;
        }
    }
    handleDemoSize(event){
        if(this.hasValue(event.target.value)){
            this.freeSampleProduct.demo_size = event.target.value;
            this.validate.demo_size = false;
        }
    }
    handleNumberOfDemo(event){
        if(this.hasValue(event.target.value)){
            this.freeSampleProduct.numberOfDemo = event.target.value;
            this.validate.numberOfDemo = false;
        }
    }
    handleChangePoNumber(event){
        let val = event.target.value;
        if(val){
            this.freesampleObj.PO_Number__c = val;
            this.freesampleObj.Status__c = this.status.Pending;
            this.freesampleObj.Sub_Status__c = this.sub_status.Pending_from_HO_Commercial;
            this.validate.po_number = false;
        }
    }
    handleChangeMaterialDispatch(event){
        this.freesampleObj.Material_Dispatched_Date__c = event.target.value;
        if(this.freesampleObj.Material_Dispatched_Date__c!=undefined){
            this.validate.material_dispatch_on = false;
        }
        this.freesampleObj.Status__c = this.status.Closed;
        this.freesampleObj.Sub_Status__c = this.sub_status.none;
        console.log('Material Date',this.freesampleObj.Material_Dispatched_Date__c);
    }

    handleProductSelected(event){
        console.log(`handleProductSelected ${event.detail.recId}-${event.detail.recName}`);
        this.freeSampleProduct.product.Id = event.detail.recId;
        this.freeSampleProduct.product.Name = event.detail.recName;
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
        this.disable.Crop = true;
        this.disable.Pest = true;
    }
    handleBacktoRecord(){
        console.log('FSM Id ',this.freesampling.Id)
        if(this.freesampling.Id!=''){
            this.navigateToListView(this.freesampling.Id);  
        }      
    }
    handleMultipleCropSelected(event){
        let lst = event.detail;
        let temp = [];
        lst.forEach(ele=>{
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
        lst.forEach(ele=>{
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
         lst.forEach(ele=>{
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
        lst.forEach(ele=>{
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
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: rec_id,
                objectApiName: 'Free_Sample_Management__c', // objectApiName is optional
                actionName: 'view'
            }
        });
    }
// comment
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
        let day = date.getDay();
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
        this.customToast.varient = varient;
        setTimeout(() => {
            this.customToast.showToast = false;
        }, 1000);
      }
    
}