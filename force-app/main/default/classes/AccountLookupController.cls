public  without sharing class AccountLookupController {
    
    @AuraEnabled
    public static List<Search> searchedList(String obj,String name,String value,String filter,Boolean dependent,String displayfield){
        //String parameter_value;
       // parameter_value = para_value;
        System.debug('Name'+name);
        System.debug('Value'+value);
        System.debug('obj is'+obj);
        
        List<Search> serachlist = new List<Search>();
        Set<String> serachset = new Set<String>();
        List<SObject> alst; 
        
            if(value == null || String.isBlank(value)){
                System.debug('select id,'+name+' from '+obj+' '+filter);
                alst = Database.query('select id,'+name+' from '+obj+' where '+filter);
            }else{
                 System.debug('select id,'+name+' from '+obj+' where '+displayfield+' like \'%'+value+'%\' and '+filter);
                alst = Database.query('select id,'+name+' from '+obj+' where '+displayfield+' like \'%'+value+'%\' and '+filter);
            }
            System.debug('size of list'+alst.size());

            for(SObject a : alst)
            {   
                   if(obj=='DistributorSalesAreaMapping__c'){
                    String fieldname = (String)a.get(displayfield);
                    Id account_owner = (Id)a.get('AccountOwner__c');
                    if(serachset.add(fieldname)){
                        serachlist.add(new Search(fieldname,account_owner));
                    }
                   }else if(obj=='SKU__c' && displayfield=='Brand_Name__c'){
                    String fieldname = (String)a.get(displayfield);   
                    Id productid = (Id)a.get('Product_Name__c');
                    if(serachset.add(fieldname) && !String.isEmpty(fieldname)){
                        serachlist.add(new Search(fieldname,productid));
                    }
                   }else if(obj=='Customer_and_Region_Mapping__c'){
                        Id recid = (String)a.get('TerritoryManager__c');
                        String fieldname = (String)a.get(displayfield); 
                        if(serachset.add(recid)){
                            serachlist.add(new Search(fieldname,recid));
                        }
                   }
                   else
                   {
                        String fieldname = (String)a.get(displayfield);
                        serachlist.add(new Search(fieldname,a.Id));
                   }
            } 
           
            return serachlist;
        
    }

    public class Search{
        
        @AuraEnabled
        public String recName;

        @AuraEnabled
        public ID recId;
        public Search(String recNametemp,ID recIdtemp)
        {
            recName = recNametemp;
            recId = recIdtemp;
        }
    }    
}