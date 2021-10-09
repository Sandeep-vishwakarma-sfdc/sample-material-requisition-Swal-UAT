/* eslint-disable @lwc/lwc/no-async-operation */
/* eslint-disable @lwc/lwc/no-document-query */
/* eslint-disable no-console */
import { LightningElement, track, api, wire } from 'lwc';
import searchedList from '@salesforce/apex/AccountLookupController.searchedList'
import { CurrentPageReference } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { fireEvent, registerListener } from 'c/pubsub';
import no_data from '@salesforce/label/c.No_data_found';
const MAXLIMIT = 5;
export default class Lookupcmp extends LightningElement {
    @api placeholder;
    @api iconname;
    @api multiselect;
    @api sobject;
    @api fieldname;
    @api filter;
    @api displayfield;
    @api disable=false;
    @api required=false;
    @api singleselectedrec='';
    @api cmpwidth ='long';

    @track searchRecords = undefined;
    @api selectedRecords = [];
    @track i=0;
    @track message = false;
    @track flag;
    @track recordDataseleted;
    @api recordData = [];
    @track require_attribute=false;
    @track recordVisibility = false;
    @track spinner_flag = false;
    @track mouse_enter;
    @track mouse_leave;
    @track btn_flag;
    @track btn_clear = false;
    @track is_multiple;
    @track hidebox ='';
    @track deleteitemdetail = false;
    @track textboxclass='';
    @track dropdownClass=''
    @track hasRendered = true;
    @track no_data_label = no_data;
    @api hitLimit = false;
    @api countItem = 0;
  

    @wire(CurrentPageReference) pageRef;
    connectedCallback() {
        if(this.multiselect){
            this.is_multiple = JSON.parse(this.multiselect);
        }
    }
    renderedCallback(){
        console.log('count limit ',this.countItem)
        if(this.singleselectedrec!==''){
            this.hidebox = 'hideboxcss';
        }else{
            this.hidebox = '';
        }
        if(this.spinner_flag==true){
        if(this.required === true){
            if(this.singleselectedrec==''|| this.singleselectedrec==undefined){
                this.require_attribute = true;
            }else{
                this.require_attribute = false;
            }
        }
        }
        if(this.cmpwidth==='long'){
            this.textboxclass = 'slds-input mytextb';
            this.dropdownClass = 'dropdownb dropdown slds-scrollable'
        }else{
            this.textboxclass = 'slds-input mytextbsmall';
            this.dropdownClass = 'dropdownsmall dropdown slds-scrollable';
        }
        console.log('disable ',this.disable);
    }
    // deleteItemdetails(items){
    //     this.deleteitemdetail = true;
    //     this.hasRendered = true;
    //     this.clearAllselected(items);
    // }
    selectitemsdetails(item){
        this.hasRendered = true;
        this.disable = false;
      //  console.log('disable false');
    }
    // ****************** called when click on Search box
    searchField(event) {
        this.spinner_flag = true;
        let text = event.target.value;
        console.log(`{ obj: ${this.sobject}, name: ${this.fieldname}, value: ${text},filter:${this.filter},displayfield:${this.displayfield}`);
        console.log('select id,'+this.fieldname+' from '+this.sobject+' where '+this.displayfield+' like \'%'+text+'%\' and '+this.filter);
        
        searchedList({ obj: this.sobject, name: this.fieldname, value: text,filter:this.filter,displayfield:this.displayfield })
            .then(data => {
                console.log('search list ',data);
                this.flag = true;
                this.btn_flag = false;
                this.message = false;
                this.searchRecords = data;
                if (data.length === 0) {
                    this.searchRecords = undefined;
                    this.message = true;
                    this.flag = false;
                    this.btn_flag = true;
                }
                this.spinner_flag = false;
            }).catch(error => {
                this.dispatchEvent(new ShowToastEvent(
                    {
                        title: 'Error',
                        message: this.no_data_label,
                        variant: 'error',
                    }
                ));
                console.log('Err -->',error);
                this.spinner_flag = false;
            })
    }

    // ******************** Called when Click on particular record
    setSelectedrecord(event) {
        this.spinner_flag = true;
        const recid = event.target.dataset.val;
        const recname = event.target.dataset.name;
        let newObj = { 'recId': recid, 'recName': recname };
        if (this.is_multiple === true) {
            let dublele = this.selectedRecords.find(obj => obj.recName === newObj.recName);
            if (dublele === undefined) {
                if(this.countItem < MAXLIMIT){
                this.selectedRecords.push(newObj);
                this.recordData.push(recid);
                this.btn_clear = true;
                this.spinner_flag = false;
                 this.dispatchEvent(new CustomEvent('multiselected',{detail:this.selectedRecords}));
                 this.countItem ++;
                }else{
                    this.hitLimit = true;
                }
            }
            this.spinner_flag = false;
            this.flag = false;
            this.btn_flag = true;
        } else {
            if(recname!==undefined){
            this.singleselectedrec = recname;
            this.spinner_flag = false;
            this.flag = false;
            const selectEvent = new CustomEvent('selected',{detail:newObj});
            this.dispatchEvent(selectEvent);
            fireEvent(this.pageRef,"selectitems",this.singleselectedrec);
            this.hidebox = 'hideboxcss'
            }
        }

    }

    // ************************** Called when removing any particular Record
    removeHandler(event) {
        const del = event.target.dataset.val;
        //console.log("items " + this.recordData);
        let sel_rec = this.recordData;
        let records = this.selectedRecords;
        records.splice(del, 1);
        sel_rec.splice(del, 1);
        this.selectedRecords = records;
        this.recordData = sel_rec;
        this.countItem = this.countItem - 1
        if(this.countItem <= MAXLIMIT)
            this.hitLimit = false;
        //console.log("deleted item ");
        if (this.recordData.length === 0) {
            this.recordVisibility = false;
            this.btn_clear = false;
        }
        const removeEvent = new CustomEvent('remove',{detail:this.selectedRecords});
        this.dispatchEvent(removeEvent);
        
    }

    handleSelectedrecord() {
        if (this.recordData.length === 0) {
            this.recordVisibility = false;
            this.btn_clear = false;
        } else {
            this.spinner_flag = true;
            this.recordVisibility = true;
        }
    }

    focusOut_event() {
        if (this.mouse_leave === true)
            this.flag = false;
    }

    mouseIn() {
        this.mouse_enter = true;
        this.mouse_leave = false;
    }
    mouseOut() {
        this.mouse_leave = true;
        this.mouse_enter = false;
    }

    // ******************* use to Clear All selected Records
    @api 
    clearAllselected() {
        this.searchRecords = undefined;
        this.selectedRecords = [];
        console.log('selected rec ',this.selectedRecords);
        this.recordData = [];
        this.btn_clear = false;
        this.singleselectedrec ='';
        this.hidebox = ''
    }
    removeSingleHandler(event) {
        console.log('event  ',event.target.label,'selected rec',this.singleselectedrec);
        const removeEvent = new CustomEvent('remove',{detail:this.singleselectedrec});
        this.dispatchEvent(removeEvent);
        const element = this.template.querySelector('[data-id="inputtext"]');
        console.log('ele value 224',element.value);
        element.value = '';
        console.log('ele value 226',element.value);
    }
}