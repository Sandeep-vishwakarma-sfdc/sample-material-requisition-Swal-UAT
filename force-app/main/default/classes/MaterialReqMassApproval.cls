public without sharing class MaterialReqMassApproval {
    @AuraEnabled
    public static List<Free_Sample_Management__c> getSampleRequisition(String query){
        List<Free_Sample_Management__c> lstfsm = new List<Free_Sample_Management__c>();
        lstfsm = Database.query(query);
        System.debug('lstFsm '+lstfsm);
       return lstfsm;
    }

    @AuraEnabled
    public static List<Free_Sample_Management__c> approveRecords(String fsmIds,String comment){
        List<Id> lstFsmId = (List<Id>)System.JSON.deserialize(fsmIds,List<Id>.class);
        List<Free_Sample_Management__c> lstfsm = new List<Free_Sample_Management__c>(); 
        try {
            lstfsm =  [select Id,Name,Status__c,Sub_Status__c,Ho_comment__c,Depot_Person_Email_ID__c,OwnerId,Owner.Email from Free_Sample_Management__c where Id in:lstFsmId];
            for(Free_Sample_Management__c fsm:lstfsm){
                fsm.Status__c = 'Pending from Depot';
                fsm.Sub_Status__c = 'for Dispatch Details';
                fsm.Ho_comment__c = comment;
            }
            update lstfsm;
            sendEmail(lstfsm,'approved');
            return lstfsm;
        } catch (Exception e) {
            return lstfsm;
        }
    }
    @AuraEnabled
    public static List<Free_Sample_Management__c> rejectRecords(String fsmIds,String comment){
        List<Id> lstFsmId = (List<Id>)System.JSON.deserialize(fsmIds,List<Id>.class);
        List<Free_Sample_Management__c> lstfsm = new List<Free_Sample_Management__c>(); 
        try {
            lstfsm =  [select Id,Name,Status__c,Sub_Status__c,Ho_comment__c,OwnerId,Owner.Email from Free_Sample_Management__c where Id in:lstFsmId];
            for(Free_Sample_Management__c fsm:lstfsm){
                fsm.Status__c = 'Rejected';
                fsm.Sub_Status__c = 'Rejected by HO Commercial';
                fsm.Ho_comment__c = comment;
            }
            update lstfsm;
            sendEmail(lstfsm,'rejected');
            return lstfsm;
        } catch (Exception e) {
            return lstfsm;
        }
    }

    @AuraEnabled
    public static Boolean isSessionActive(String hoEmail,String otp){
        List<SWAL_Mass_Approval__c> customSettingSMA = [select Id,Name,ho_email__c,OTP__c,Session_Time__c from SWAL_Mass_Approval__c where ho_email__c=:hoEmail limit 1];
        if(customSettingSMA.size()>0){
            Long milliseconds = DateTime.now().getTime() - customSettingSMA[0].Session_Time__c.getTime();
            Long seconds = milliseconds / 1000;
            Long minutes = seconds / 60;
            Long hours = minutes / 60;
            Long days = hours / 24;
            System.debug(days+' Days '+hours+' hr '+minutes+' min');
            if(days<1 && hours<3 && minutes<60 && customSettingSMA[0].OTP__c==otp){
                return true;
            }else{
                return false;
            }
        }
        return false;
    }

    @AuraEnabled
    public static string sendOTP(String hoEmail){
        String rand = string.valueof(Math.abs(Crypto.getRandomInteger()));
        String otp = rand.substring(0,6);
        List<SWAL_Mass_Approval__c> customSettingSMA = [select Id,Name,ho_email__c,OTP__c,Session_Time__c from SWAL_Mass_Approval__c where ho_email__c=:hoEmail limit 1];
        if(customSettingSMA.size()>0){
            customSettingSMA[0].OTP__c = otp;
            customSettingSMA[0].Session_Time__c = System.now();
            update customSettingSMA[0];
        }
        sendOTPEmail(hoEmail,otp);
        return otp;
    }
    
    @AuraEnabled
    public static Boolean verifyEmail(String hoEmail){
        List<Depot__c> depots = [select Id,Name,HO_Commercial__c from Depot__c where HO_Commercial__c=:hoEmail limit 1];
        if(depots.size()>0){
            List<SWAL_Mass_Approval__c> swa = [select Id,Name from SWAL_Mass_Approval__c where ho_email__c=:hoEmail limit 1];
            if(swa.size()==0){
                SWAL_Mass_Approval__c newsma = new SWAL_Mass_Approval__c();
                newsma.Name = hoEmail;
                newsma.ho_email__c = hoEmail;
                newsma.OTP__c = '123456';
                newsma.Session_Time__c = System.now();
                insert newsma;
            }
            return true;
        }else{
            return false;
        }
    }

    public static void sendOTPEmail(String hoEmail,String OTP){
        String mailbody = '<br><img src="https://upl--upltest.cs57.my.salesforce.com/servlet/servlet.ImageServer?id=0150k000000izrV&oid=00D0k000000Cq7D" alt="Company Logo" height="68" width="85"/><div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2"><div style="margin:50px auto;width:70%;padding:20px 0"><div style="border-bottom:1px solid #eee"><a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">UPL</a></div><p style="font-size:1.1em">Hi,</p><p>Use the following OTP to complete your procedures. OTP is valid for 3 minutes</p><h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">'+OTP+'</h2><p style="font-size:0.9em;">Regards,<br />UPL</p><hr style="border:none;border-top:1px solid #eee" /><div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300"></div></div></div>';
        Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
        List<String> lst_email = new List<String>{hoEmail};
        mail.setToAddresses(lst_email);
        mail.setSubject('Material Requisition OTP');
        mail.setHtmlBody(mailbody);
        mail.setBccSender(false); 
        mail.setUseSignature(false); 
        mail.setSenderDisplayName('UPL Team'); 
        mail.setSaveAsActivity(false); 
        Messaging.sendEmail(new Messaging.SingleEmailMessage[] { mail });
    }

    
    public static void sendEmail(List<Free_Sample_Management__c> lstfms,String status){
        
        List<String> lst_email = new List<String>();
        Map<String,List<Free_Sample_Management__c>> mapMails = new Map<String,List<Free_Sample_Management__c>>();
        for(Free_Sample_Management__c fsm:lstfms){
            if(mapMails.containsKey(fsm.OwnerId)){
                List<Free_Sample_Management__c> lstf = new List<Free_Sample_Management__c>();
                lstf = mapMails.get(fsm.OwnerId);
                lstf.add(fsm);
                mapMails.put(fsm.OwnerId,lstf);
            }else{
                List<Free_Sample_Management__c> lstf = new List<Free_Sample_Management__c>();
                lstf.add(fsm);
                mapMails.put(fsm.OwnerId,lstf);
            }
        }
        System.debug('mapMails '+mapMails.keySet());
        List<Messaging.SingleEmailMessage> masterListMails = new List<Messaging.SingleEmailMessage>();
        // String domainurl = 'https://upl--upltest.my.salesforce.com';test
        String domainurl = 'https://upl--uat.my.salesforce.com';
        for(String key:mapMails.keySet()){
            Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
            List<String> sendTo = new List<String>();
            List<Free_Sample_Management__c> lstfm = mapMails.get(key);
           
            String mailbody = '';
            String urld = '';
            for(Free_Sample_Management__c fm:lstfm){
                // sendTo.add('sandeep.vishwakarma@skinternational.com');
                if(status=='approved'){
                    sendTo.add(fm.Depot_Person_Email_ID__c);
                    mailbody+='<br><img src="https://upl--upltest.cs57.my.salesforce.com/servlet/servlet.ImageServer?id=0150k000000izrV&oid=00D0k000000Cq7D" alt="Company Logo" height="68" width="85"/><p><b>Dear Sir/Madam,</b></p><br/><p>Find below '+status+' Material Requisitions.</p><p>Please update Material Dispatch Date</p><br><table border="1"><tr><th colspan="2"><p><b>Free Sample Product</b></p></th></tr><tr><th style="background-color:#87CEEB">FSP-Name</th><th style="background-color:#87CEEB">View link</th></tr>';
                    urld = 'https://uat-uplltd.cs117.force.com/MaterialRequisition?recordId='+fm.Id+'&vf=D';
                }
                if(status=='rejected'){
                    sendTo.add(fm.Owner.Email);
                    mailbody+='<br><img src="https://upl--upltest.cs57.my.salesforce.com/servlet/servlet.ImageServer?id=0150k000000izrV&oid=00D0k000000Cq7D" alt="Company Logo" height="68" width="85"/><p><b>Dear Sir/Madam,</b></p><br/><p>Find below '+status+' Material Requisitions.</p><br><table border="1"><tr><th colspan="2"><p><b>Free Sample Product</b></p></th></tr><tr><th style="background-color:#87CEEB">FSP-Name</th><th style="background-color:#87CEEB">View link</th></tr>';
                    urld = domainurl+'/'+fm.Id;
                }
                
                mailbody+='<tr><td>' + fm.Name +'</td><td><a href="'+urld+'">Click here</a></td></tr>';
            }
            mailbody += '</table><br><br>';
            mail.setSubject('Material Requisition: Mass Approval Details');
            mail.setHtmlBody(mailbody);
            mail.setToAddresses(sendTo);
            mail.setBccSender(false); 
            mail.setUseSignature(false); 
            mail.setSenderDisplayName('UPL Team'); 
            mail.setSaveAsActivity(false); 
            masterListMails.add(mail);
        }
        Messaging.sendEmail(masterListMails);
    }
}