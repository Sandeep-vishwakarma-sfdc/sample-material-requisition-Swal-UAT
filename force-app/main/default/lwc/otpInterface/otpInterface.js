import { LightningElement, track } from 'lwc';
import verifyEmail from '@salesforce/apex/MaterialReqMassApproval.verifyEmail';
import sendOTP from '@salesforce/apex/MaterialReqMassApproval.sendOTP'
export default class OtpInterface extends LightningElement {

    @track sendOTP1 = true;
    @track sendOTP2 = false;
    hoEmail = ''; 
    otp = '';
    invalidMesg = false;
    @track validate = {
        email:false,
    }


    handleSendOTP(){
        let emailinput = this.template.querySelector('.emailinput');
        this.hoEmail = emailinput?emailinput.value:'';
        console.log('email validate ',this.validateEmail(this.hoEmail));
        if(this.validateEmail(this.hoEmail)){
            this.verifyEmailPromise();
        }else{
            this.validate.email = true;
        }
    }

    verifyEmailPromise(){
        verifyEmail({hoEmail:this.hoEmail}).then(isVerify=>{
            console.log('isVerify ',isVerify);
            if(isVerify){
                console.log('hoEmail ',this.hoEmail);
                sendOTP({hoEmail:this.hoEmail}).then(otp=>{
                    this.otp=otp;
                    this.sendOTP1 = false;
                    this.sendOTP2 = true;
                    this.invalidMesg = false;
                    // console.log('OTP generated',this.otp);
                }).catch(err=>console.log('Error in getting otp',err));
                // console.log('OTP send',this.otp);
            }else{
                this.invalidMesg = true;
            }
        })
    }

    handleverify(event){
        let input = this.template.querySelector('.otpinput');
        let value = input?input.value:'';
        console.log('input ',input,' value ',value,' otp ',this.otp)
        if(value==this.otp){
            this.invalidMesg = false;
            window.location.href = `https://uat-uplltd.cs117.force.com/requisitionapprover?email=${this.hoEmail}&otp=${this.otp}`;
        }else{
            this.invalidMesg = true;
        }
    }
    validateEmail(email) {
        let re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }
}