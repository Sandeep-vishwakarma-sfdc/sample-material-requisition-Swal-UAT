/* eslint-disable no-console */
import {LightningElement, api, track} from 'lwc';
import process from '@salesforce/apex/GetProcessInstanceData.process';
import getProcessItemData from '@salesforce/apex/GetProcessInstanceData.getProcessItemData';

export default class ItemsToApproveTable extends LightningElement {

    @api actorId;
    @api contextObjectType;
    @api fieldNames; //field names provided by called to be rendered as columns
    @api disableReassignment;
    @api confirmationMessage;
    @api fspWrapList;
    rowData;
    columns;
    fieldDescribes;
    depotName;
    @api depotNameList;
    @track page = 1; 
    @track items = []; 
    @track data = []; 
    @track startingRecord = 1;
    @track endingRecord = 0; 
    @track pageSize = 5; 
    @track totalRecountCount = 0;
    @track totalPage = 0;
    @track isCommentModalOpen = false;
    @track isViewModalOpen = false;
    @track rowEvent;
    initialized = false;
    
    
    settings = {
        reactionOk: {label: 'Ok', variant: 'brand', value: 'Ok'},
        reactionCancel: {label: 'Cancel', variant: 'neutral', value: 'Cancel'},
        actionApprove: 'Approve',
        actionReject: 'Reject',
        actionReassign: 'Reassign',
        stringDataType: 'String',
        referenceDataType: 'reference',
        singleMode: 'single',
        mixedMode: 'mixed',
        fieldNameSubmitter: '__Submitter',
        fieldNameSubmitterURL: '__SubmitterURL',
        fieldNameLastActor: '__LastActor',
        fieldNameLastActorURL: '__LastActorURL',
        fieldNameType: '__Type',
        fieldNameRecordName: '__Name',
        fieldNameRecordURL: '__RecordURL',
        fieldNameworkItemId:'__workitemId',
        fieldNameId:'__Id',
        fieldNameDepotName: '__DepotName',
        fieldNameTMName:'__TMName',
        fieldNameTerritoryName:'__TerritoryName',
        fieldNameSubmittedDate:'__SubmittedDate',
        fieldNamefspWrapper:'__fspWrapper',
        fieldNameRecentApproverURL: '__RecentApproverUrl',
        defaultDateAttributes: {weekday: "long", year: "numeric", month: "long", day: "2-digit"},
        defaultDateTimeAttributes: {year: "numeric", month: "long", day: "2-digit", hour: "2-digit", minute: "2-digit"}
    };

    mandatoryColumnDescriptors = [
        {
            label: "Requisition No",
            fieldName: this.settings.fieldNameRecordURL,
            type: "url",
            sortable: true,
            wrapText: true,
            hideDefaultActions: true,
            typeAttributes: {label: {fieldName: this.settings.fieldNameRecordName}, target: "_blank"}
        },
        {
            label: "Depot", 
            fieldName: this.settings.fieldNameDepotName, 
            type: "text",
            sortable: true,wrapText: true,
            hideDefaultActions: true,
            typeAttributes: {label: {fieldName: this.settings.fieldNameDepotName}, target: "_blank"}
        },
        {
            label: "Territory", 
            fieldName: this.settings.fieldNameTerritoryName, 
            type: "text",
            sortable: true,
            wrapText: true,
            hideDefaultActions: true,
            typeAttributes: {label: {fieldName: this.settings.fieldNameTerritoryName}, target: "_blank"}
        },
        {
            label: "Territory Manager", 
            fieldName: this.settings.fieldNameTMName, 
            type: "text",
            sortable: true,
            wrapText: true,
            hideDefaultActions: true,
            typeAttributes: {label: {fieldName: this.settings.fieldNameTMName}, target: "_blank"}
        },
        {
            label: "Date Submitted",
            fieldName: 'dateSubmitted',
            type: "date",
            sortable: true,
            wrapText: true,
            hideDefaultActions: true,
            typeAttributes: this.settings.defaultDateTimeAttributes
        },
        {
            label: 'View',
            name: 'view',
            type: 'button-icon',
            initialWidth:50,
            wrapText: true,
            hideDefaultActions: true,
            typeAttributes: {
                iconName: 'action:preview',
                title: 'Preview',
                name:this.settings.fieldNameId
            }
        }
    ];

    apActions = [
        {label: this.settings.actionApprove, value: this.settings.actionApprove, name: this.settings.actionApprove},
        {label: this.settings.actionReject, value: this.settings.actionReject, name: this.settings.actionReject}
       //{label: this.settings.actionReassign, value: this.settings.actionReassign, name: this.settings.actionReassign}
    ];
    currentAction = this.settings.actionApprove;
    errorApex;
    errorJavascript;
    selectedRows;
    apCount;
    commentVal = '';
    reassignActorId;

    connectedCallback() {
        this.getServerData();
    }
    getServerData() {
        console.log('this.actorId : ',this.actorId);
        console.log('this.fieldNames : ',this.fieldNames);
        getProcessItemData({
            actorId: this.actorId,
            objectName: this.contextObjectType,
            fieldNames: this.fieldNames,
            mode: this.mode,
            recordName:''
        }).then(result => {
            if(result.length>=0){
                let processData = JSON.parse(result);
                console.log('processData :'+result.length);
                this.fieldDescribes = processData.fieldDescribes;
                this.rowData = this.generateRowData(processData.processInstanceData);
                this.createColumns();
            }else{
                this.showToast('Validation Error', 'No Result Found', 'error', true);
            }
            
        }).catch(error => {
            console.log('error is: ' + JSON.stringify(error));
        });
    }

    createColumns() {
        this.columns = [...this.mandatoryColumnDescriptors.filter(curDescriptor => {
            return this.mode !== this.settings.singleMode || !(this.mode === this.settings.singleMode && curDescriptor.fieldName === this.settings.fieldNameType)
        }), ...this.getCustomFieldColumns()];//, this.getActionMenuItems()];
    }

    handeToDate(event){
        let toDate = event.target.value;
        let To_Date = this.template.querySelector(".To_Date");
        let From_Date = this.template.querySelector(".From_Date");
        let fromDate = From_Date.value;
        if(fromDate>toDate){
            To_Date.setCustomValidity("To date should be greater than From date"); 
        }else{
            To_Date.setCustomValidity("");
        }
        To_Date.reportValidity();
    }
    handeFromDate(event){
        let fromDate = event.target.value;
        let To_Date = this.template.querySelector(".To_Date");
        let From_Date = this.template.querySelector(".From_Date");
        let toDate = To_Date.value;
        if(toDate!=''){
            if(toDate<fromDate){
                From_Date.setCustomValidity("From date should be less than To date"); 
            }else{
                From_Date.setCustomValidity("");
            }
            From_Date.reportValidity();
        }
        
    }

    handleSeacrhClick(){
        let recordType='';

        var isValid=true;
        var isValidDate=true;
        
        let requisation = this.template.querySelector(".Requisation");
        let recordName = requisation.value;
        let Depot = this.template.querySelector(".Depot");
        let depotName = Depot.value;
        let Territory = this.template.querySelector(".Territory");
        let territoryName = Territory.value;
        let From_Date = this.template.querySelector(".From_Date");
        let fromDate = From_Date.value;
        let To_Date = this.template.querySelector(".To_Date");
        let toDate = To_Date.value;
        
        /*if((recordName=='' || recordName == null ) && (depotName=='' || depotName==null) && (territoryName ==''|| territoryName==null) ){
            this.showToast('Validation Error', 'Enter data in atleast one field', 'error', true);
            isValid=false;
        }else{

            requisation.setCustomValidity("");
        }*/
        requisation.reportValidity();
        console.log('isValid :',isValid)
       
        if(isValid){
            getProcessItemData({
                actorId: this.actorId,
                objectName: this.contextObjectType,
                fieldNames: this.fieldNames,
                mode: this.mode,
                recordName:recordName,
                depotName:depotName,
                territoryName:territoryName,
                From_Date:fromDate,
                To_Date:toDate
            }).then(result => {
                
                let processData = JSON.parse(result);
                console.log('result ',processData.processInstanceData.length);
                if(processData.processInstanceData.length==0){  
                    this.showToast('Validation Error', 'No Result Found', 'error', true);
                }
                this.fieldDescribes = processData.fieldDescribes;
                this.createColumns();
                this.rowData = this.generateRowData(processData.processInstanceData);
                
                
            }).catch(error => {
                console.log('error is: ' + JSON.stringify(error));
            });
        }
        
    }

    handleResetClick(){
        this.template.querySelector('form').reset();
        let requisation = this.template.querySelector(".Requisation");
        requisation.value='';
        let Depot = this.template.querySelector(".Depot");
        Depot.value='';
        let Territory = this.template.querySelector(".Territory");
        Territory.value='';
        let From_Date = this.template.querySelector(".From_Date");
        From_Date.value='';
        let To_Date = this.template.querySelector(".To_Date");
        To_Date.value='';
        console.log('requisation.value : ',requisation.value)
        From_Date.setCustomValidity("");
        To_Date.setCustomValidity("");
        From_Date.reportValidity();
        To_Date.reportValidity();
        eval("$A.get('e.force:refreshView').fire();");
        //this.getServerData();
    }

    getCustomFieldColumns() {
        let resultFields = [];
        if (this.fieldNames) {
            this.fieldNames.replace(/\s+/g, '').split(',').forEach(curFieldName => {
                let fieldDescribe = this.getFieldDescribe(this.contextObjectType, curFieldName);
                console.log('curFieldName : ',curFieldName);
                console.log('fieldDescribe : ',fieldDescribe);
                if (fieldDescribe) {
                    resultFields.push({
                            ...{
                                label: fieldDescribe.label,
                                fieldName: curFieldName,
                                sortable: true
                            }, ...this.getDefaultTypeAttributes(fieldDescribe.type)
                        }
                    );
                }
            });
        }
        return resultFields;
    }

    getDefaultTypeAttributes(type) {
        if (type.includes('date')) {
            return {
                type: "date",
                typeAttributes: this.settings.defaultDateTimeAttributes
            };
        } else {
            return {type: 'text'};
        }
    }

    getFieldDescribe(objectName, fieldName) {
        if (this.fieldDescribes && this.fieldDescribes[objectName]) {
            let fieldDescribe = this.fieldDescribes[objectName].find(curFieldDescribe => curFieldDescribe.name.toLowerCase() === fieldName.toLowerCase());
            return fieldDescribe;
        }
    }

    get actionReassign() {
        return this.currentAction === this.settings.actionReassign;
    }

    get allowedActions() {
        if (this.apActions && this.apActions.length) {
            if (this.disableReassignment) {
                return this.apActions.filter(curAction => curAction.value != this.settings.actionReassign);
            } else {
                return this.apActions;
            }
        }
        return [];
    }

    get mode() {
        if (this.contextObjectType && this.fieldNames)
            return this.settings.singleMode; //display items to approve for a single type of object, enabling additional fields to be displayed
        else if (!this.contextObjectType && this.fieldNames) {
            this.errorJavascript = 'Flow Configuration error: You have specified fields without providing the name of an object type.';
        } else {
            return this.settings.mixedMode;
        }
    }

    updateSelectedRows(event) {
        console.log('event. :',event.detail.selectedRows);
        this.selectedRows = event.detail.selectedRows;
        this.apCount = event.detail.selectedRows.length;
    }

    handleRowAction(event) {
        //fieldNameId
        console.log('rowAction clicked');
        var action = event.detail.action;
        console.log('rowAction :',action.name);
        this.currentAction = event.detail.action.value;
        console.log('this.currentAction :',this.currentAction);
        if(action.name=='__Id'){
            this.isViewModalOpen=true;
            var row = event.detail.row;
            console.log('rowId :',row.Id);

        }else if (this.currentAction === this.settings.actionApprove || this.currentAction === this.settings.actionReject) {
            this.isCommentModalOpen = true;
            this.rowEvent=event.detail.row;
        } else {
            this.modalAction(true);
        }
    }
    closeViewModal(){
        this.isViewModalOpen = false;
    }

    closeCommentModal() {
        this.isCommentModalOpen = false;
    }

    submitCommentDetails() {
        this.processApprovalAction(this.rowEvent);
        this.isCommentModalOpen = false;
    }

    handleModalBatch() {
        this.processApprovalAction();
    }

    processApprovalAction(curRow) {
        console.log('curRow selected :',curRow);
        if ((curRow || (this.selectedRows && this.selectedRows.length)) && this.currentAction) {
            process({
                reassignActorId: this.reassignActorId,
                action: this.currentAction,
                workItemIds: this.selectedRows,//curRow ? [curRow.WorkItemId] : this.selectedRows.map(curRow => curRow.WorkItemId),
                comment: this.commentVal
            })
                .then(result => {
                    this.showToast('Approval Management', this.currentAction + ' Complete', 'success', true);
                    //this.getServerData();
                    setTimeout(() => {
                        eval("$A.get('e.force:refreshView').fire();");
                      }, 3000);
                    
                })
                .catch(error => {
                    console.log('error returning from process work item apex call is: ' + JSON.stringify(error));
                });
        }
    }

    showToast(title, message, variant, autoClose) {
        this.template.querySelector('c-toast-message').showCustomNotice({
            detail: {
                title: title, message: message, variant: variant, autoClose: autoClose
            }
        });
    }

    getActionMenuItems() {
        return {
            type: "action",
            label: "Act",
            initialWidth: 150,
            typeAttributes: {rowActions: this.allowedActions}
        };
    }

    getRecordURL(sObject) {
        return '/lightning/r/' + sObject.attributes.type + '/' + sObject.Id + '/edit';
    }

    getObjectUrl(objectTypeName, recordId) {
        return '/lightning/r/' + objectTypeName + '/' + recordId + '/view';
    }

    generateRowData(rowData) {
        return rowData.map(curRow => {
            console.log('curRow :',curRow);
            try {
            let resultData = {
                ...{
                    WorkItemId: curRow.workItem.Id,
                    ActorId: curRow.workItem.ActorId,
                    TargetObjectId: curRow.sObj.Id,
                    dateSubmitted: curRow.processInstance.CreatedDate
                }, ...curRow.sObj
            };
            resultData[this.settings.fieldNameSubmitter] = curRow.createdByUser.Name;
            resultData[this.settings.fieldNameSubmitterURL] = this.getObjectUrl('User', curRow.createdByUser.Id);
            if (curRow.lastActorUser) {
                resultData[this.settings.fieldNameLastActor] = curRow.lastActorUser.Name;
                resultData[this.settings.fieldNameLastActorURL] = this.getObjectUrl('User', curRow.lastActorUser.Id);
            }
            //resultData[this.settings.fieldNameType] = curRow.sObj.attributes.type;
            resultData[this.settings.fieldNameRecordName] = curRow.sObj.reqName;
            //resultData[this.settings.fieldNameRecordURL] = this.getRecordURL(curRow.sObj);
            
            try {
                //console.log('curRow.sObj.Id : ',curRow.sObj.Id);
                resultData[this.settings.fieldNameworkItemId]=curRow.workItem.Id;
                resultData[this.settings.fieldNameId]=curRow.sObj.reqId;
                resultData[this.settings.fieldNameDepotName]=curRow.sObj.depot;
                resultData[this.settings.fieldNameTMName]=curRow.sObj.tmName;
                resultData[this.settings.fieldNameTerritoryName]=curRow.sObj.territory;
                resultData[this.settings.fieldNameSubmittedDate]=curRow.sObj.submittedDate;
                resultData[this.settings.fieldNamefspWrapper]=curRow.sObj.fspWrapList;
                
            } catch (error) {
                
            }
            console.log('resultData :',resultData);
            return resultData;
        }catch(error){
            console.log('error inside generateRowData '+error.stack);
        }
        });
    }

    get modalReactions() {
        return [this.settings.reactionOk];
    }
    get modalCancelReactions(){
        return [this.settings.reactionCancel];
    }

    handleModalReactionButtonClick(event) {
        this.handleModalBatch();
    }

    handleButtonClick(event) {
        this.currentAction = this.settings.actionApprove;
        if(this.commentVal!=null){
            this.commentVal='';
        }
        this.modalAction(true);
    }

    handleComment(event) {
        this.commentVal = event.detail.value;
    }
    handleSingleComment(event){
        this.commentVal = event.detail.value;
    }
    modalAction(isOpen) {
        const existing = this.template.querySelector('c-uc-modal');

        if (existing) {
            if (isOpen) {
                existing.openModal(this.selectedRows);
            } else {
                existing.closeModal();
            }
        }
    }

    handleSelectionChange(event) {
        this.reassignActorId = event.detail.value;
    }

    handleActionChange(event) {
        this.currentAction = event.detail.value;
        console.log('this.currentAction : ',this.currentAction);
        if(this.currentAction=='Approve'){
            this.confirmationMessage='Are you sure you want to approve records?';
        }else if(this.currentAction=='Reject'){
            this.confirmationMessage='Are you sure you want to reject records?';
        }
    }

    get isManageDisabled() {
        return (!this.selectedRows || this.selectedRows.length === 0);
    }
}