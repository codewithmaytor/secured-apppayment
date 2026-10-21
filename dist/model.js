export const KEY='secured-payment-prototype-v1';
export const contacts=[{id:'agnes',name:'Agnes Wanjiku',handle:'@agnes.w',known:true,color:'peach'},{id:'books',name:'Nakuru Books',handle:'@nakuru.books',known:true,color:'mint'},{id:'brian',name:'Brian Otieno',handle:'@brian.o',known:true,color:'lilac'},{id:'new',name:'New demo recipient',handle:'@new.recipient',known:false,color:'peach'}];
export function money(cents){return new Intl.NumberFormat('en-KE',{style:'currency',currency:'KES',minimumFractionDigits:2}).format(cents/100);}
export function amountCents(value){if(!/^\d+(\.\d{1,2})?$/.test(String(value)))return null;const [a,b='']=String(value).split('.');const n=Number(a)*100+Number(b.padEnd(2,'0'));return Number.isSafeInteger(n)&&n>0?n:null;}
export function risk(amount,known){if(amount>=5000000)return {level:'Blocked',reason:'Amount reaches the KES 50,000 prototype limit.'};if(amount>=1000000||!known)return {level:'Review',reason:!known?'First payment to this recipient.':'Amount reaches the KES 10,000 review threshold.'};return {level:'Low',reason:'Known recipient and amount below the review threshold.'};}
export function seed(name='Mark Mutai',email='mark@example.test',type='Personal'){
 const day=new Date().toISOString().slice(0,10);
 return {name,email,type,opening:7825000,transactions:[
 {id:'SPA-DEMO-1043',name:'Agnes Wanjiku',handle:'@agnes.w',amount:375000,direction:'out',status:'Completed',risk:'Low',note:'Shared expenses',date:day+'T09:10:00+03:00'},
 {id:'SPA-DEMO-1042',name:'Brian Otieno',handle:'@brian.o',amount:1200000,direction:'in',status:'Completed',risk:'Low',note:'Project contribution',date:day+'T08:45:00+03:00'},
 {id:'SPA-DEMO-1041',name:'Nakuru Books',handle:'@nakuru.books',amount:150000,direction:'out',status:'Completed',risk:'Low',note:'Course materials',date:day+'T08:15:00+03:00'},
 {id:'SPA-DEMO-1040',name:'New demo recipient',handle:'@new.recipient',amount:6500000,direction:'out',status:'Blocked',risk:'Blocked',note:'Synthetic risk scenario',reason:'Amount reaches the KES 50,000 prototype limit.',date:day+'T07:55:00+03:00'}],
 accounts:[{id:'wallet',kind:'Demo wallet',name:'Prototype wallet',last4:'0021'},{id:'bank',kind:'Bank account',name:'Sample Bank',last4:'4821'}],alerts:[{id:'seed-alert',transaction:'SPA-DEMO-1040',reason:'KES 65,000 payment blocked by the prototype amount rule.',status:'Open'}],events:[{date:new Date().toISOString(),action:'Synthetic account prepared'}]};
}
export function balance(user){return user.transactions.reduce((b,t)=>t.status==='Completed'?b+(t.direction==='in'?t.amount:-t.amount):b,user.opening);}
export function commit(user,payment){
 if(user.transactions.some(t=>t.id===payment.id))return false;
 if(payment.status==='Completed'&&payment.direction==='out'&&payment.amount>balance(user))throw Error('Insufficient demo balance.');
 user.transactions.unshift(payment);return true;
}
export function csv(rows){const quote=v=>'"'+String(v??'').replaceAll('"','""')+'"';return '\uFEFF'+[['Reference','Recipient','Handle','KES','Direction','Status','Risk','Date','Note'],...rows.map(t=>[t.id,t.name,t.handle,(t.amount/100).toFixed(2),t.direction,t.status,t.risk,t.date,t.note])].map(r=>r.map(v=>quote(/^[=+@\-\t\r\n]/.test(String(v))?"'"+v:v)).join(',')).join('\r\n');}
