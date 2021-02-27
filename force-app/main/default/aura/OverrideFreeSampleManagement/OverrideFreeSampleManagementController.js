({
	doInit : function(component, event, helper) {
		var action = component.get("c.getUserCountry");
		var recId = component.get("v.recordId");
		var vf = component.get("v.vf");
		action.setCallback(this,function(response){
			var res = response.getReturnValue();
			if(res=='SWAL'){
				if(component.find('materialrequi')){
					var childcmp = component.find('materialrequi');
					childcmp.destroy();
					console.log('child cmp1',JSON.stringify(childcmp));
			    }
				component.set("v.isSWAL",true);
            }else if(res=='externalUser'){
				if(component.find('materialrequi')){
				component.set("v.isSWAL",true);	
					var childcmp = component.find('materialrequi');
					childcmp.destroy();
					console.log('child cmp2',JSON.stringify(childcmp));
			    }
                component.set("v.isSWAL",true);
            }else{
                console.log('Create New record',recId);
				if(recId!='' && recId!=undefined){
					var editRecordEvent = $A.get("e.force:editRecord");
						editRecordEvent.setParams({
							"recordId": recId
					});
					editRecordEvent.fire();
				}else{
                    console.log('Create New record');
					var createRecordEvent = $A.get("e.force:createRecord");
					createRecordEvent.setParams({
						"entityApiName": "Free_Sample_Management__c"
					});
					createRecordEvent.fire();
				}
			}
		});

		$A.enqueueAction(action);
	},
	handlePageChange : function(component, event, helper) {
        console.log("pageReference attribute change");
        //component.find("colombiaCase").reloadRecord(true);
        component.set("v.isSWAL",true);
        component.find('materialrequi').getFiredFromAura();
    }
})