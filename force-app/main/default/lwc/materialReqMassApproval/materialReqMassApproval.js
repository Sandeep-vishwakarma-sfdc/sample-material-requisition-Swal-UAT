import { LightningElement,wire,track } from 'lwc';
import getSampleRequisition from '@salesforce/apex/MaterialReqMassApproval.getSampleRequisition';
import approveRecords from '@salesforce/apex/MaterialReqMassApproval.approveRecords';
import rejectRecords from '@salesforce/apex/MaterialReqMassApproval.rejectRecords';
import isSessionActive from '@salesforce/apex/MaterialReqMassApproval.isSessionActive';


export default class MaterialReqMassApproval extends LightningElement {
  
  HO_EMAIL = '';
  OTP = '';  
error = '';
popupDisabled = true;
openModel = false;
currentAction = 'Approve';
commentVal = '';
countFSM = 0;
selectedFSM = [];
apActions = [
  {label: 'Approve', value: 'Approve', name: 'Approve'},
  {label: 'Reject', value: 'Reject', name: 'Reject'}
];
pageSize = 10;
disablebtn = {
  previousbtn_disable:true,
  nextbtn_disable:true,
}

@track customToast = {
  showToast : false,
  message:'Success',
  title:'Success',
  varient:'success'
}
hasRenderquery = false;
@track items = [];
@track tableData = false;
@track page = 1;
@track totalRecountCount = 0;
@track totalPage = 0;
@track startingRecord = 0;
@track endingRecord = 0;
@track sampleRequisitions = [{
   Depot__c:'',
   Depot__r:{Id:'',Name:''},
   Territory_Manager__c:'',
   Territory_Manager__r:{Id:'',Name:''},
   Territory__c:'',
   Territory__r:{Id:'',Name:''},
   Free_Sampling_Crop_Pests__r:[{Free_Sampling__c:'',Id:'',Name:'',Target_Pest__c:'',Target_Pest__r:{Name:'',Id:''},Target_Crop__c:'',Target_Crop__r:{Name:'',Id:''}
   }],
   Free_Sampling_Products__r:[{
       Id:'',Name:'',Number_of_Demo__c:'',Product__c:'',Dose_Acre_GM_ML_L_Per_Acre__c:'',Demo_material_value__c:'',Demo_Size_Acer__c:'',Demo_Sample_Qty_GM_ML__c:'',Free_Sampling__c:''
    }]
}];

connectedCallback(){
  
}
renderedCallback(){
  this.verifyCheckbox();
  if(this.hasRenderquery==false){
    this.HO_EMAIL = location.search.split("=")[1].split("&")[0];
    this.OTP = location.search.split("=")[2];
    let query = `select Id,Name,Depot__c,Depot__r.Name,Depot__r.HO_Commercial__c,Territory__c,Territory__r.Name,Territory_Manager__c,Territory_Manager__r.Name,Approval_Submission_Date_Time__c,(Select Id,Name,Product__c,Product__r.Name,Dose_Acre_GM_ML_L_Per_Acre__c,Demo_Size_Acer__c,Number_of_Demo__c,Demo_Sample_Qty_GM_ML__c,Demo_material_value__c from Free_Sampling_Products__r),(select Id,Name,Target_Crop__c,Target_Crop__r.Name,Target_Pest__c,Target_Pest__r.Name,recordType.Name from Free_Sampling_Crop_Pests__r) from Free_Sample_Management__c where SalesOrg__r.Sales_Org_Code__c='1210' and Territory__c!=null and Status__c='Pending' and Sub_Status__c='Pending from HO Commercial' and Depot__r.HO_Commercial__c='${this.HO_EMAIL}' order by CreatedDate ASC`;
    console.log('URL Email ',this.HO_EMAIL,'OTP ',this.OTP);
    console.log("query ",query);
    this.checkSession();
    this.getSampleReq(query);
    this.hasRenderquery = true;
  }
}

checkSession(){
  isSessionActive({hoEmail:this.HO_EMAIL,otp:this.OTP}).then(isActive=>{
    if(!isActive){
      // location.replace("https://upltest-uplltd.cs57.force.com/requisitionapprover");//test
      location.replace("https://uat-uplltd.cs117.force.com/requisitionapprover");
    }
  })
}

getSampleReq(qry){
  getSampleRequisition({query:qry}).then(data=>{
    this.items = this.clean(data);
    this.sampleRequisitions = this.clean(data);
    this.tableData = this.sampleRequisitions.length>0?true:false;
    this.totalRecountCount = this.sampleRequisitions.length;
    this.totalPage = Math.ceil(this.totalRecountCount / this.pageSize);
    this.sampleRequisitions = this.items.slice(0,this.pageSize); 
    this.endingRecord = this.pageSize;
    this.disablebtn.nextbtn_disable = this.totalPage > this.page?false:true;
    this.disablebtn.previousbtn_disable = this.page>1 ? false:true;
    console.log('this.sampleRequisitions connected',data);
  }).catch(err=>{
    this.error = err;
    console.log('Error getSampleRequisition',this.error);
  });
}


handleCheckBox(event){
  console.log('checkbox id ',event.target.id);
  let id = event.target.id.split('-')[0];
  if(event.target.checked){
    let found = this.selectedFSM.find(ele=>ele==id)
    if(!found){
      this.selectedFSM.push(id);
      this.popupDisabled = false;
    }
  }else{
    let index = this.selectedFSM.findIndex(ele=>ele==id);
    if(index!=-1){
      this.selectedFSM.splice(index,1);
    }
  }
  this.popupDisabled = this.selectedFSM.length>0?false:true;
  this.countFSM = this.selectedFSM.length;
  console.log('handleCheckBox SelectedFSM ',this.selectedFSM);
}

  handleChangeSelectAll(event) {
    this.CheckAll(event.target.checked);
  }

  CheckAll(status){
    if(status == true){
      // this.items.forEach(ele=>{
      //   if(!this.selectedFSM.includes(ele.Id)){
      //     this.selectedFSM.push(ele.Id);
      //   }
      // })
      this.template.querySelectorAll('.checkinput').forEach(ele=>{
        console.log('ele ',ele.checked);
        if(ele.checked==false){
          ele.checked = true;
          this.selectedFSM.push(ele.id.split('-')[0]);
        }
      })
      }else{
          this.selectedFSM = [];
      }
      this.popupDisabled = this.selectedFSM.length>0?false:true;
      this.countFSM = this.selectedFSM.length;
      console.log('selectedFSM',this.selectedFSM)
  }


submitDetails(){
  console.log('Submit Details');
  let radiobtn = this.template.querySelector('.approve_reject');
  console.log('btn ',radiobtn.value);
  if(radiobtn.value=='Approve'){
    this.approveRecord();
  }else if(radiobtn.value=='Reject'){
    this.rejectRecord();
  }
}
handleSearchClick(){
        let requisation = this.template.querySelector(".Requisation");
        let Depot = this.template.querySelector(".Depot");
        let Territory = this.template.querySelector(".Territory");
        let From_Date = this.template.querySelector(".From_Date");
        let To_Date = this.template.querySelector(".To_Date");
        let recordName = requisation.value;
        let depotName = Depot.value;
        let territoryName = Territory.value;
        let fromDate = From_Date.value;
        let toDate = To_Date.value;


        let query = `select Id,Name,Depot__c,Depot__r.Name,Depot__r.HO_Commercial__c,Territory__c,Territory__r.Name,Territory_Manager__c,Territory_Manager__r.Name,Approval_Submission_Date_Time__c,(Select Id,Name,Product__c,Product__r.Name,Dose_Acre_GM_ML_L_Per_Acre__c,Demo_Size_Acer__c,Number_of_Demo__c,Demo_Sample_Qty_GM_ML__c,Demo_material_value__c from Free_Sampling_Products__r),(select Id,Name,Target_Crop__c,Target_Crop__r.Name,Target_Pest__c,Target_Pest__r.Name,recordType.Name from Free_Sampling_Crop_Pests__r) from Free_Sample_Management__c where Sales_Org__r.Sales_Org_Code__c='1210' and Territory__c!=null and Status__c='Pending' and Sub_Status__c='Pending from HO Commercial' and Depot__r.HO_Commercial__c='${this.HO_EMAIL}' order by CreatedDate ASC `;
        if(recordName){
          query = query+` and Name like '%${recordName}%'`;
        }
        if(depotName){
          query = query+` and Depot__r.Name like '%${depotName}%'`;
        }
        if(territoryName){
          query = query+` and Territory__r.Name like '%${territoryName}%'`;
        }
        if(fromDate){
          query = query+` and DAY_ONLY(LastModifiedDate) <= ${fromDate}`;
        }
        if(toDate){
          query = query+` and DAY_ONLY(LastModifiedDate) >= ${toDate}`;
        }
        console.log('Query ',query);
        this.getSampleReq(query);
}

approveRecord(){
  let str = JSON.stringify(this.selectedFSM);
  approveRecords({fsmIds:str,comment:this.commentVal}).then(data=>{
    if(data.length>0){
      this.showCustomToast('Success','Success','success');
      this.openModel = false;
    }
    let query = `select Id,Name,Depot__c,Depot__r.Name,Depot__r.HO_Commercial__c,Territory__c,Territory__r.Name,Territory_Manager__c,Territory_Manager__r.Name,Approval_Submission_Date_Time__c,(Select Id,Name,Product__c,Product__r.Name,Dose_Acre_GM_ML_L_Per_Acre__c,Demo_Size_Acer__c,Number_of_Demo__c,Demo_Sample_Qty_GM_ML__c,Demo_material_value__c from Free_Sampling_Products__r),(select Id,Name,Target_Crop__c,Target_Crop__r.Name,Target_Pest__c,Target_Pest__r.Name,recordType.Name from Free_Sampling_Crop_Pests__r) from Free_Sample_Management__c where Sales_Org__r.Sales_Org_Code__c='1210' and Territory__c!=null and Status__c='Pending' and Sub_Status__c='Pending from HO Commercial' and Depot__r.HO_Commercial__c='${this.HO_EMAIL}' order by CreatedDate ASC`;
    this.getSampleReq(query);
    window.location.reload();
  }).catch(err=>{
    console.log('Error approve Record ',err);
    this.error = err;
  });
}

rejectRecord(){
  let str = JSON.stringify(this.selectedFSM);
  rejectRecords({fsmIds:str,comment:this.commentVal}).then(data=>{
    if(data.length>0){
      this.showCustomToast('Success','Success','success');
      this.openModel = false;
    }
    let query = `select Id,Name,Depot__c,Depot__r.Name,Depot__r.HO_Commercial__c,Territory__c,Territory__r.Name,Territory_Manager__c,Territory_Manager__r.Name,Approval_Submission_Date_Time__c,(Select Id,Name,Product__c,Product__r.Name,Dose_Acre_GM_ML_L_Per_Acre__c,Demo_Size_Acer__c,Number_of_Demo__c,Demo_Sample_Qty_GM_ML__c,Demo_material_value__c from Free_Sampling_Products__r),(select Id,Name,Target_Crop__c,Target_Crop__r.Name,Target_Pest__c,Target_Pest__r.Name,recordType.Name from Free_Sampling_Crop_Pests__r) from Free_Sample_Management__c where Sales_Org__r.Sales_Org_Code__c='1210' and Territory__c!=null and Status__c='Pending' and Sub_Status__c='Pending from HO Commercial' and Depot__r.HO_Commercial__c='${this.HO_EMAIL}' order by CreatedDate ASC`;
    this.getSampleReq(query);
    window.location.reload();
  }).catch(err=>{
    console.log('Error approve Record ',err);
    this.error = err;
  });
}

handleResetClick(){
  this.template.querySelector(".Requisation").value = '';
 this.template.querySelector(".Depot").value = '';
   this.template.querySelector(".Territory").value = '';
    this.template.querySelector(".From_Date").value = '';
  this.template.querySelector(".To_Date").value = '';
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

handleActionChange(event){
  this.currentAction = event.detail.value;
}
handlePopupbtn(){
  this.openModel=!this.openModel;
  this.commentVal = '';
}
handleComment(event){
  this.commentVal = event.detail.value;
}
closeModal(){
  this.openModel = false;
}
clean(obj){
	for (var propName in obj) {
    if (obj[propName] == null || obj[propName] == undefined) {
       obj[propName] = '';
    }
    if(obj[propName] instanceof Object){
			this.clean(obj[propName]); 
    }
  }
  return obj;
}

previousPage(){
  if (this.page > 1) {
    this.page = this.page - 1;
    this.displayRecordPerPage(this.page);
  }
  this.disablebtn.nextbtn_disable = this.totalPage>=this.page+1?false:true;  
  this.disablebtn.previousbtn_disable = this.page>1 ? false:true;  
  this.template.querySelector('.allCheck').checked = false;
  this.selectedFSM = [];
  this.popupDisabled = true;
}
nextPage(){
  if((this.page<this.totalPage) && this.page !== this.totalPage){
    this.page = this.page + 1; //increase page by 1
    this.displayRecordPerPage(this.page); 
    this.disablebtn.nextbtn_disable = this.totalPage>=this.page+1?false:true;  
    this.disablebtn.previousbtn_disable = this.page>1 ? false:true;  
    this.template.querySelector('.allCheck').checked = false;
    this.selectedFSM = [];
    this.popupDisabled = true;
  }  
}


displayRecordPerPage(page){
  this.startingRecord = ((page -1) * this.pageSize) ;
  this.endingRecord = (this.pageSize * page);
  this.endingRecord = (this.endingRecord > this.totalRecountCount)? this.totalRecountCount : this.endingRecord; 
  this.sampleRequisitions = this.items.slice(this.startingRecord, this.endingRecord);
  this.startingRecord = this.startingRecord + 1;
}

verifyCheckbox(){
  console.log('Selected FSM ',this.selectedFSM);
  this.template.querySelectorAll('.checkinput').forEach(input=>{
    console.log('input ',input.id.split('-')[0],'cond ',this.selectedFSM.includes(input.id.split('-')[0]));
    input.checked = this.selectedFSM.includes(input.id.split('-')[0])?true:false;
  });
  console.log('total page ',this.totalPage,' page',this.page);
}
}