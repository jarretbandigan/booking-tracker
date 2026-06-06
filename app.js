// Copyright (c) 2026 Jarret Bandigan. All rights reserved. Proprietary and confidential.
// AUTH — SHA-256, pre-computed hash (plaintext password not stored in source)
const CU="admin";
const CH="fba447b7c72af7dbd2482b4bc07352abbb8292df3b28956d91692e65eaafde2e";
let pend=null,pendOver=null,pfcl=null,active=null;
let expiryTimer=null,pclConfId=null,pclDispAction=null,pclExpired=[],listFilter='all',aType='confirmed';
let dispOnConfirm=null,dispOnCancel=null;
let bh=[],editId=null;
let gp=[],gpnid=1;
let tickerTarget=null;
let selectedGPId=null,pendingBookingForRepeat=null,pendingRating={};
async function h256(s){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,"0")).join("");}
async function doLogin(){
  const u=document.getElementById("lu").value.trim(),p=document.getElementById("lp").value;
  const h=await h256(p);
  if(u===CU&&h===CH){document.getElementById("ls").style.display="none";document.getElementById("as").style.display="block";document.getElementById("lerr").style.display="none";loadData();updateHeader();if(!prof.name)setTimeout(showWelcome,500);renderCal();checkPencilExpiry();scheduleMidnightCheck();}
  else{document.getElementById("lerr").style.display="block";document.getElementById("lp").value="";}
}
function doLogout(){clearTimeout(expiryTimer);expiryTimer=null;pclExpired=[];active=null;pfcl=null;pend=null;pendOver=null;pclConfId=null;editId=null;document.getElementById("as").style.display="none";document.getElementById("ls").style.display="flex";document.getElementById("lu").value="";document.getElementById("lp").value="";cAll();showTab('home');}

// DATA
const MN=["January","February","March","April","May","June","July","August","September","October","November","December"];
function TD(){return new Date().toLocaleDateString('en-CA');}
let cy=new Date().getFullYear(),cm=new Date().getMonth(),nid=10;
let bk=[],bl=[],prof={},bellTs=0;

function sv(){
  try{
    localStorage.setItem("bt_b",JSON.stringify(bk));
    localStorage.setItem("bt_bl",JSON.stringify(bl));
    document.getElementById("sverr").style.display="none";
  }catch(e){
    document.getElementById("sverr").style.display="block";
  }
}
function svP(){
  try{
    localStorage.setItem("bt_p",JSON.stringify(prof));
    localStorage.setItem("bt_bell",bellTs.toString());
  }catch(e){
    document.getElementById("sverr").style.display="block";
  }
}
function svH(){
  try{
    localStorage.setItem("bt_bh",JSON.stringify(bh));
  }catch(e){
    document.getElementById("sverr").style.display="block";
  }
}
function svGP(){
  try{
    localStorage.setItem("bt_gp",JSON.stringify(gp));
    localStorage.setItem("bt_gpnid",gpnid.toString());
  }catch(e){
    document.getElementById("sverr").style.display="block";
  }
}
function loadData(){
  try{
    const b=localStorage.getItem("bt_b"),l=localStorage.getItem("bt_bl");
    bk=b?JSON.parse(b):[];
    bl=l?JSON.parse(l):[];
    const p=localStorage.getItem("bt_p");prof=p?JSON.parse(p):{};
    const bell=localStorage.getItem("bt_bell");bellTs=bell?parseInt(bell):0;
    const h=localStorage.getItem("bt_bh");bh=h?JSON.parse(h):[];
  }catch(e){bk=[];bl=[];prof={};bellTs=0;bh=[];}
  try{const gpRaw=localStorage.getItem("bt_gp");gp=gpRaw?JSON.parse(gpRaw):[];}catch(e){gp=[];}
  try{const gpnRaw=localStorage.getItem("bt_gpnid");gpnid=gpnRaw?parseInt(gpnRaw):1;}catch(e){gpnid=1;}
  if(gp.length)gpnid=Math.max(gpnid,...gp.map(p=>p.id+1)); // safety recalc — mirrors nid pattern
  // Migration: add type field, normalise Pending payment method
  let migrated=false;
  bk.forEach(b=>{
    if(b.type===undefined){b.type="confirmed";migrated=true;}
    if(b.method==="Pending"){b.method="";b.pay="none";migrated=true;}
    if(b.at===undefined){b.at=b.ci||TD();migrated=true;}
  });
  if(migrated)sv();
  const ids=[...bk.map(x=>x.id),...bl.map(x=>x.id)];
  nid=ids.length?Math.max(...ids)+1:10;
  migrateToGP();
}
function migrateToGP(){
  if(gp.length>0)return;
  if(bk.length===0&&bh.length===0)return;
  let migrated=false;
  const allEntries=[
    ...bk.map(b=>({...b,_src:"bt_b"})),
    ...bh.map(b=>({...b,_src:"bt_bh"}))
  ];
  allEntries.forEach(entry=>{
    if(!entry.name)return;
    const normName=entry.name.toLowerCase().trim();
    const normMobile=(entry.mobile||"").trim();
    let profile=gp.find(p=>
      p.name.toLowerCase().trim()===normName&&
      (normMobile===""||p.mobiles.includes(normMobile))
    );
    if(!profile){
      profile={
        id:gpnid++,
        createdAt:Date.now(),
        name:entry.name.trim(),
        mobiles:normMobile?[normMobile]:[],
        email:entry.email||"",
        isBlacklisted:false,
        blacklistReason:"",
        blacklistDate:null,
        averageRating:null,
        tags:[],
        notes:"",
        hasConfirmed:false,
        linkedBookingIds:[],
        linkedHistoryIds:[],
        mergedProfileIds:[]
      };
      gp.push(profile);
    }
    if(normMobile&&!profile.mobiles.includes(normMobile))profile.mobiles.push(normMobile);
    if(entry._src==="bt_b"){
      if(!profile.linkedBookingIds.includes(entry.id))profile.linkedBookingIds.push(entry.id);
      const idx=bk.findIndex(b=>b.id===entry.id);
      if(idx!==-1&&bk[idx].guestProfileId===undefined){bk[idx].guestProfileId=profile.id;migrated=true;}
      if(entry.type==="confirmed")profile.hasConfirmed=true;
    }
    if(entry._src==="bt_bh"){
      if(!profile.linkedHistoryIds.includes(entry.id))profile.linkedHistoryIds.push(entry.id);
      const idx=bh.findIndex(b=>b.id===entry.id);
      if(idx!==-1&&bh[idx].guestProfileId===undefined){bh[idx].guestProfileId=profile.id;migrated=true;}
      if(entry.type==="confirmed")profile.hasConfirmed=true;
    }
  });
  svGP();
  if(migrated){sv();svH();}
}
// HELPERS
function f12(t){if(!t)return null;const[h,m]=t.split(":").map(Number);const ap=h>=12?"PM":"AM";const h12=h%12||12;return h12+":"+(m<10?"0"+m:m)+" "+ap;}
function dR(ci,co){const d=[],c=new Date(ci),e=new Date(co);while(c<e){d.push(c.toISOString().slice(0,10));c.setDate(c.getDate()+1);}return d;}
function aD(ds,n){const d=new Date(ds);d.setDate(d.getDate()+n);return d.toISOString().slice(0,10);}
function gB(ds,ex){return bk.find(b=>b.id!==ex&&isConf(b)&&dR(b.ci,b.co).includes(ds));}
function gCI(ds){return bk.find(b=>isConf(b)&&b.ci===ds);}
function gCO(ds){return bk.find(b=>isConf(b)&&b.co===ds);}
function gBl(ds){return bl.find(b=>dR(b.from,aD(b.to,1)).includes(ds));}
function cG(n){return bk.filter(b=>isConf(b)&&b.name.toLowerCase()===n.toLowerCase()).length;}
function pC(p){return({Airbnb:"ba",Agoda:"bg",["Booking.com"]:"bb",Facebook:"bf",Direct:"bd"}[p]||"bd");}
function pyL(p){return({full:"Fully paid",partial:"Partially paid",none:"No payment yet"}[p]);}
function pyC(p){return({full:"pf",partial:"pp",none:"pn2"}[p]);}
function mC(m){return({GCash:"gc",Maya:"my",["Bank transfer"]:"bk2",["Via app"]:"ap",Cash:"cs"}[m]||"nw");}
function eCo(b){return b.coL||b.coE||b.coS;}
function eCi(b){return b.ciE||b.ciL||b.ciS;}
function cAll(){document.querySelectorAll(".ov").forEach(o=>o.classList.remove("sh"));}
function cOv(id){document.getElementById(id).classList.remove("sh");}
function isUnpaid(b){return b.pay==="none"||b.pay==="partial"||b.method==="Pending";}
function payChipClass(b){if(b.method==="Pending")return"cpd";if(b.pay==="none")return"cpn";if(b.pay==="partial")return"cpp";return"cpf";}
function dirClass(ds,b){return ds===b.ci?"cid":"cmd";}
function isPencil(b){return b.type==="pencil";}
function isConf(b){return b.type==="confirmed";}
function getPclOn(ds){return bk.filter(b=>isPencil(b)&&dR(b.ci,b.co).includes(ds));}
function getConfOn(ds){return bk.find(b=>isConf(b)&&(dR(b.ci,b.co).includes(ds)||b.co===ds));}
function pclOnRange(ci,co){const days=dR(ci,co);return bk.filter(b=>isPencil(b)&&days.some(d=>dR(b.ci,b.co).includes(d)));}
function getGP(id){return gp.find(p=>p.id===id)||null;}
function findGP(name,mobile){
  const normName=(name||"").toLowerCase().trim();
  const normMobile=(mobile||"").trim();
  return gp.find(p=>
    p.name.toLowerCase().trim()===normName&&
    (normMobile===""||p.mobiles.includes(normMobile))
  )||null;
}
function initials(name){
  if(!name)return"?";
  const parts=name.trim().split(/\s+/);
  if(parts.length===1)return parts[0].slice(0,2).toUpperCase();
  return(parts[0][0]+parts[parts.length-1][0]).toUpperCase();
}
function createGP(name,mobile,email){
  const profile={
    id:gpnid++,
    createdAt:Date.now(),
    name:(name||"").trim(),
    mobiles:mobile?[(mobile||"").trim()]:[],
    email:(email||"").trim(),
    isBlacklisted:false,
    blacklistReason:"",
    blacklistDate:null,
    averageRating:null,
    tags:[],
    notes:"",
    hasConfirmed:false,
    linkedBookingIds:[],
    linkedHistoryIds:[],
    mergedProfileIds:[]
  };
  gp.push(profile);
  svGP();
  return profile;
}
function linkBkToGP(profileId,bookingId,isHistory){
  const profile=getGP(profileId);if(!profile)return;
  if(isHistory){if(!profile.linkedHistoryIds.includes(bookingId))profile.linkedHistoryIds.push(bookingId);}
  else{if(!profile.linkedBookingIds.includes(bookingId))profile.linkedBookingIds.push(bookingId);}
  svGP();
}
function updateGPConfirmed(profileId){
  const profile=getGP(profileId);if(!profile)return;
  profile.hasConfirmed=true;svGP();
}
function archiveBk(b,reason,extra){
  bh.push(Object.assign({},b,{cancelReason:reason,archivedAt:Date.now()},extra||{}));
  svH();
  if(b&&b.guestProfileId){
    const gpProfile=getGP(b.guestProfileId);
    if(gpProfile){
      gpProfile.linkedBookingIds=gpProfile.linkedBookingIds.filter(id=>id!==b.id);
      if(!gpProfile.linkedHistoryIds.includes(b.id))gpProfile.linkedHistoryIds.push(b.id);
      svGP();
    }
  }
}
let hvTimer,_expiryChecking=false;
function hvOn(sel){
  clearTimeout(hvTimer);
  const c=document.getElementById("cal");
  c.classList.add("hv-active");
  c.querySelectorAll(".hv-on").forEach(t=>t.classList.remove("hv-on"));
  c.querySelectorAll(sel).forEach(t=>{t.classList.add("hv-on");if(t.classList.contains("tr-top")||t.classList.contains("tr-bot"))t.parentElement.classList.add("hv-on");});
  // Click mode: install one-shot outside-click clearer
  const cs=prof.calSettings||{};
  if((cs.hoverMode||"hover")==="click"){
    const clearFn=(e)=>{if(!c.contains(e.target)){hvOff();document.removeEventListener("click",clearFn);}};
    setTimeout(()=>document.addEventListener("click",clearFn),50);
  }
}
function hvOff(){hvTimer=setTimeout(()=>{const c=document.getElementById("cal");c.classList.remove("hv-active");c.querySelectorAll(".hv-on").forEach(t=>t.classList.remove("hv-on"));},60);}
function updRateCalc(ciId,coId,rateId,totalId){
  const ci=document.getElementById(ciId)?.value;
  const co=document.getElementById(coId)?.value;
  const rate=parseFloat(document.getElementById(rateId)?.value)||0;
  const el=document.getElementById(totalId);
  if(!el)return;
  if(!ci||!co||!rate||co<=ci){el.style.display="none";return;}
  const nights=dR(ci,co).length;
  if(!nights){el.style.display="none";return;}
  const fmt=n=>Math.round(n).toLocaleString();
  el.textContent=nights+" night"+(nights!==1?"s":"")+" × ₱"+fmt(rate)+" = ₱"+fmt(nights*rate)+" estimated total";
  el.style.display="block";
}

// GUEST PROFILE SEARCH / BLACKLIST CHECK
function searchGP(){
  const q=document.getElementById("an").value.trim().toLowerCase();
  const sug=document.getElementById("gp-suggest");
  if(q.length<3){sug.style.display="none";return;}
  const matches=gp.filter(p=>p.name.toLowerCase().includes(q)).slice(0,3);
  if(!matches.length){sug.style.display="none";return;}
  sug.innerHTML=matches.map(p=>{
    const mob=p.mobiles[0]||"";
    const confCount=p.linkedBookingIds.filter(id=>bk.find(b=>b.id===id&&isConf(b))).length;
    const blBadge=p.isBlacklisted?`<span class="bl-bdg" style="margin-left:4px">Blacklisted</span>`:"";
    const cntBadge=confCount>0?`<span style="font-size:10px;background:#DCFCE7;color:#15803D;padding:2px 6px;border-radius:8px;margin-left:4px">${confCount} stay${confCount!==1?"s":""}</span>`:"";
    return`<div class="gp-sugg-row" onclick="selectGP(${p.id})">
      <div class="gp-avatar">${initials(p.name)}</div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;font-size:13px">${p.name}${blBadge}${cntBadge}</div>
        ${mob?`<div style="font-size:11px;color:#888">${mob}</div>`:""}
      </div>
    </div>`;
  }).join("");
  sug.style.display="block";
  setTimeout(()=>{
    const fn=(e)=>{
      if(!document.getElementById("an").contains(e.target)&&!sug.contains(e.target)){
        sug.style.display="none";document.removeEventListener("click",fn);
      }
    };
    document.addEventListener("click",fn);
  },50);
}
function selectGP(profileId){
  const profile=getGP(profileId);if(!profile)return;
  document.getElementById("an").value=profile.name;
  document.getElementById("am").value=profile.mobiles[0]||"";
  document.getElementById("ae").value=profile.email||"";
  selectedGPId=profileId;
  document.getElementById("gp-suggest").style.display="none";
  checkBlacklistInForm();
}
function checkBlacklistInForm(){
  const name=document.getElementById("an").value.trim();
  const mobile=document.getElementById("am").value.trim();
  let warn=document.getElementById("bl-warn-add");
  if(name.length<3){if(warn)warn.style.display="none";return;}
  const profile=selectedGPId?getGP(selectedGPId):findGP(name,mobile);
  if(profile&&profile.isBlacklisted){
    if(!warn){
      warn=document.createElement("div");
      warn.id="bl-warn-add";
      warn.style.cssText="background:#FEF2F2;border:1px solid #FCA5A5;border-radius:8px;padding:12px;margin-bottom:10px;";
      const mbb=document.querySelector("#ov-add .mbb");
      if(mbb)mbb.parentElement.insertBefore(warn,mbb);
    }
    const dateStr=profile.blacklistDate?new Date(profile.blacklistDate).toLocaleDateString("en-PH",{year:"numeric",month:"long",day:"numeric"}):"unknown date";
    warn.innerHTML=`<div style="color:#991B1B;font-weight:700;margin-bottom:5px">&#x1F6AB; ${profile.name} is blacklisted</div>
      <div style="font-size:12px;color:#7F1D1D;margin-bottom:8px">Date: ${dateStr}${profile.blacklistReason?'<br>Reason: '+profile.blacklistReason:''}</div>
      <div style="display:flex;gap:8px">
        <button class="btn bc" style="flex:1" onclick="document.getElementById('bl-warn-add').style.display='none'">Proceed anyway</button>
        <button class="btn bxx" style="flex:1" onclick="closeAdd()">Cancel</button>
      </div>`;
    warn.style.display="block";
  } else {
    if(warn)warn.style.display="none";
  }
}

// OCCUPANCY
function updOcc(){
  const dim=new Date(cy,cm+1,0).getDate();let bkd=0;
  for(let d=1;d<=dim;d++){const ds=cy+"-"+String(cm+1).padStart(2,"0")+"-"+String(d).padStart(2,"0");if(gB(ds,null)||gBl(ds))bkd++;}
  const pct=Math.round((bkd/dim)*100);
  document.getElementById("ofrac").textContent=bkd+"/"+dim;
  document.getElementById("opct").textContent=pct+"%";
  document.getElementById("ofill").style.width=pct+"%";
  document.getElementById("omonth").textContent=MN[cm]+" "+cy;
  let tentDays=0;
  for(let d=1;d<=dim;d++){
    const ds=cy+"-"+String(cm+1).padStart(2,"0")+"-"+String(d).padStart(2,"0");
    if(!gB(ds,null)&&!gCO(ds)&&!gBl(ds)&&getPclOn(ds).length>0)tentDays++;
  }
  const otent=document.getElementById("otent");
  if(tentDays>0){otent.textContent="+ "+tentDays+" tentative day"+(tentDays!==1?"s":"")+" from pencil bookings";otent.style.display="block";}
  else{otent.style.display="none";}
}

// CALENDAR
function renderCal(){
  if(bk.some(b=>b.type==="pencil"))checkPencilExpiry();
  updOcc();
  document.getElementById("mlbl").textContent=MN[cm]+" "+cy;
  const cal=document.getElementById("cal");cal.classList.remove("hv-active");cal.innerHTML="";
  ["Su","Mo","Tu","We","Th","Fr","Sa"].forEach(d=>{const e=document.createElement("div");e.className="dn";e.textContent=d;cal.appendChild(e);});
  const first=new Date(cy,cm,1).getDay(),days=new Date(cy,cm+1,0).getDate();
  const mStr=cy+"-"+String(cm+1).padStart(2,"0");
  const firstDayStr=mStr+"-01";
  const lastDayStr=mStr+"-"+String(days).padStart(2,"0");
  const cs=prof.calSettings||{};
  const hoverEnabled=cs.hoverEnabled!==false;
  const hoverMode=cs.hoverMode||"hover";
  const noHover=!hoverEnabled||(hoverMode==="hover"&&window.matchMedia("(hover: none)").matches);
  for(let i=0;i<first;i++){const e=document.createElement("div");e.className="dy em";cal.appendChild(e);}
  const mkP=(cls,txt)=>{const p=document.createElement("span");p.className=cls;p.textContent=txt;return p;};
  const mkC=(cls,txt)=>{const c=document.createElement("span");c.className="ch "+cls;c.textContent=txt;return c;};
  const addHv=(el,id,isBlk)=>{
    if(noHover)return;
    const sel=isBlk?"[data-blid='"+id+"']":"[data-bid='"+id+"']";
    if(hoverMode==="click"){
      el.addEventListener("click",(e)=>{e.stopPropagation();if(el.classList.contains("hv-on")){clearTimeout(hvTimer);const c=document.getElementById("cal");c.classList.remove("hv-active");c.querySelectorAll(".hv-on").forEach(t=>t.classList.remove("hv-on"));}else hvOn(sel);});
    } else {
      el.addEventListener("mouseenter",()=>hvOn(sel));
      el.addEventListener("mouseleave",hvOff);
    }
  };
  for(let d=1;d<=days;d++){
    const ds=mStr+"-"+String(d).padStart(2,"0");
    const isTd=ds===TD(),isPast=ds<TD();
    const book=gB(ds,null),ciB=gCI(ds),coB=gCO(ds),blk=gBl(ds);
    const el=document.createElement("div");
    const num=()=>{const n=document.createElement("div");n.className="dn2";n.textContent=d;return n;};

    if(blk){
      // MAINTENANCE BLOCK
      el.className="dy mn2"+(isTd?" td":"");
      el.dataset.blid=blk.id;
      el.appendChild(num());
      if(isTd)el.appendChild(mkP("tp2","TODAY"));
      el.appendChild(mkC("chm",blk.reason.split("/")[0].trim()));
      el.onclick=()=>showBlk(blk);
      addHv(el,blk.id,true);

    } else if(ciB&&coB){
      // TURNAROUND — split into top/bottom halves
      el.className="dy tr"+(isPast?" ptr":"");
      el.appendChild(mkP("trbdg","↑↓"));
      const topIsOg=coB.ci<ds;
      const topBg=topIsOg?"#4ADE80":"#BBF7D0";
      const botBg="#BBF7D0";
      // top half — outgoing guest
      const tTop=document.createElement("div");
      tTop.className="tr-top";tTop.style.background=topBg;tTop.dataset.bid=coB.id;
      tTop.appendChild(num());
      tTop.appendChild(mkC("cod "+payChipClass(coB),"↓ "+coB.name.split(" ")[0]));
      tTop.onclick=(e)=>{e.stopPropagation();showTurn(coB,ciB);};
      addHv(tTop,coB.id,false);
      // bottom half — incoming guest
      const tBot=document.createElement("div");
      tBot.className="tr-bot";tBot.style.background=botBg;tBot.dataset.bid=ciB.id;
      tBot.appendChild(mkC("cid "+payChipClass(ciB),"↑ "+ciB.name.split(" ")[0]));
      tBot.onclick=(e)=>{e.stopPropagation();showTurn(coB,ciB);};
      addHv(tBot,ciB.id,false);
      el.appendChild(tTop);el.appendChild(tBot);

    } else if(coB&&!book){
      // CHECKOUT ONLY
      const coIsOg=coB.ci<TD()&&!isPast&&!isTd;
      let cls;
      if(isPast)cls="pco";
      else if(coIsOg)cls=isUnpaid(coB)?"og og-upd":"og";
      else cls="co";
      el.className="dy "+cls+(isTd?" td":"");
      el.dataset.bid=coB.id;
      el.appendChild(num());
      if(isTd)el.appendChild(mkP("tp2","TODAY"));
      if(!isPast&&isUnpaid(coB)&&prof.fullPay===false)el.appendChild(mkP("upd-bdg","!"));
      const coFaded=isPast&&!isUnpaid(coB);
      el.appendChild(mkC("cod "+payChipClass(coB)+(coFaded?" cfaded":""),"↓ "+coB.name.split(" ")[0]));
      if(coB.ci<firstDayStr&&d===1){const ci=document.createElement("span");ci.className="cont-i";ci.textContent="← cont.";el.appendChild(ci);}
      el.onclick=()=>showDet(coB);
      addHv(el,coB.id,false);

    } else if(book){
      // BOOKING (check-in or mid-stay)
      const isOg=book.ci<TD()&&book.co>TD();
      let cls;
      if(isOg&&isPast)cls="og pog";
      else if(isOg&&isTd)cls="og td";
      else if(isOg)cls=isUnpaid(book)?"og og-upd":"og";
      else if(isPast)cls="pbk";
      else if(isTd)cls="bk td";
      else cls="bk";
      el.className="dy "+cls;
      el.dataset.bid=book.id;
      el.appendChild(num());
      if(isTd)el.appendChild(mkP("tp2","TODAY"));
      if(!isPast&&isUnpaid(book)&&prof.fullPay===false)el.appendChild(mkP("upd-bdg","!"));
      const pastFullyPaid=isPast&&!isOg&&!isUnpaid(book);
      const chipCls=dirClass(ds,book)+" "+payChipClass(book)+(pastFullyPaid?" cfaded":"");
      const ch=document.createElement("span");
      ch.className="ch "+chipCls;
      if(cG(book.name)>1){const dot=document.createElement("span");dot.className="rdot";ch.appendChild(dot);}
      ch.appendChild(document.createTextNode((book.ci===ds?"↑ ":"")+book.name.split(" ")[0]));
      el.appendChild(ch);
      if(book.ci<firstDayStr&&d===1){const ci=document.createElement("span");ci.className="cont-i";ci.textContent="← cont.";el.appendChild(ci);}
      if(book.co>lastDayStr&&d===days){const co=document.createElement("span");co.className="cont-o";co.textContent="cont. →";el.appendChild(co);}
      el.onclick=()=>showDet(book);
      addHv(el,book.id,false);

    } else {
      const pclList=getPclOn(ds);
      if(pclList.length>0){
        // PENCIL TILE
        el.className="dy pcl"+(isTd?" td":"");
        el.appendChild(num());
        if(isTd)el.appendChild(mkP("tp2","TODAY"));
        const shown=pclList.slice(0,2);
        shown.forEach(pb=>{
          const chip=document.createElement("span");
          chip.className="ch cpd "+dirClass(ds,pb);
          chip.textContent=(pb.ci===ds?"↑ ":"")+pb.name.split(" ")[0];
          chip.dataset.bid=pb.id;
          if(!noHover){
            if(hoverMode==="click"){
              chip.addEventListener("click",(e)=>{e.stopPropagation();hvOn("[data-bid='"+pb.id+"']");el.classList.add("pcl-hv-src");document.getElementById("cal").classList.add("hv-active");});
            } else {
              chip.addEventListener("mouseenter",()=>{hvOn("[data-bid='"+pb.id+"']");el.classList.add("pcl-hv-src");document.getElementById("cal").classList.add("hv-active");});
              chip.addEventListener("mouseleave",()=>{hvOff();el.classList.remove("pcl-hv-src");});
            }
          }
          el.appendChild(chip);
        });
        if(pclList.length>2){
          const more=document.createElement("span");
          more.className="pcl-more";
          more.textContent="+"+( pclList.length-2)+" more";
          el.appendChild(more);
        }
        el.onclick=()=>pclList.length===1?showPclDet(pclList[0]):showPclList(ds);
      } else if(isPast){
        // PAST EMPTY
        el.className="dy pm";el.appendChild(num());
      } else {
        // AVAILABLE
        el.className="dy av"+(isTd?" td":"");el.appendChild(num());
        if(isTd)el.appendChild(mkP("tp2","TODAY"));
        const h=document.createElement("div");h.className="ah2";h.textContent="+ book";el.appendChild(h);
        el.onclick=()=>openAdd(ds);
      }
    }
    cal.appendChild(el);
  }
  buildTicker();
  buildStats();
}

// TURNAROUND DETAIL
// gB() and gCI() filter to isConf() — pencil bookings cannot trigger turnaround by construction
function showTurn(oB,iB){
  active=oB;
  const cot=eCo(oB),cit=eCi(iB),cd=oB.cd,ur=oB.ur;
  document.getElementById("dpanel").innerHTML=`
    <div class="pt">⚡ Turnaround day</div>
    <div class="cu">⚡ <div><strong>Urgent — same-day turnaround</strong><br>
    <strong>↓ ${oB.name}</strong> out at ${f12(cot)} · <strong>↑ ${iB.name}</strong> in at ${f12(cit)}<br>
    Cleaner must prepare unit between ${f12(cot)} and ${f12(cit)}.</div></div>
    <div class="tt">
      <button class="tbtn tcl${cd?" dn3":""}" onclick="tapCl()">${cd?"✓ Cleaner contacted":"🧹 Cleaner contacted?"}</button>
      <button class="tbtn trd${ur?" dn3":""}" onclick="tapRd()"${!cd?' disabled style="opacity:0.45;cursor:not-allowed"':''}>${ur?"✓ Unit ready":"✅ Unit ready?"}</button>
    </div>
    ${prof.cleanerMob?`<div style="margin-top:6px"><button class="btn" style="width:100%;border-color:#2D5F0F;color:#2D5F0F" onclick="msgCleaner(${oB.id})">📱 Message cleaner</button></div>`:""}
    <div style="margin-top:9px">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#999;margin-bottom:3px">Checkout — ${oB.name}</div>
      <div class="dr"><span class="dl">Platform</span><span class="bdg ${pC(oB.platform)}">${oB.platform}</span></div>
      <div class="dr"><span class="dl">Payment</span><span class="bdg ${pyC(oB.pay)}">${pyL(oB.pay)}</span></div>
      <div class="dr"><span class="dl">Mobile</span><span class="dv" style="color:#1A56DB">${oB.mobile||"—"}</span></div>
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#999;margin:6px 0 3px">Check-in — ${iB.name}</div>
      <div class="dr"><span class="dl">Platform</span><span class="bdg ${pC(iB.platform)}">${iB.platform}</span></div>
      <div class="dr"><span class="dl">Payment</span><span class="bdg ${pyC(iB.pay)}">${pyL(iB.pay)}</span></div>
      <div class="dr"><span class="dl">Mobile</span><span class="dv" style="color:#1A56DB">${iB.mobile||"—"}</span></div>
    </div>
    <div class="acb">
      <button class="btn be" onclick="active=bk.find(b=>b.id==${oB.id});showDet(active)">↓ Checkout details</button>
      <button class="btn bx" onclick="active=bk.find(b=>b.id==${iB.id});showDet(active)">↑ Check-in details</button>
    </div>`;
}

// DETAIL
function showDet(b){
  active=b;
  const rep=cG(b.name)>1,cnt=cG(b.name);
  const cot=eCo(b),cit=eCi(b),cd=b.cd,ur=b.ur;
  const nxIn=gCI(b.co),isTurn=!!nxIn;
  const lw=b.coL?" — <strong>do not schedule before "+f12(b.coL)+"</strong>":"";
  const ciX=b.ciE?'<br><small style="color:#BA7517">⏰ Early check-in</small>':b.ciL?'<br><small style="color:#888">⏰ Late check-in</small>':"";
  const coX=b.coL?'<br><small style="color:#BA7517">⏰ Late check-out</small>':b.coE?'<br><small style="color:#4A8A20">⏰ Early check-out</small>':"";
  const clBox=isTurn
    ?`<div class="cu">⚡ <div><strong>Urgent — same-day turnaround!</strong><br>Contact cleaner immediately. ${nxIn.name} checks in at <strong>${f12(eCi(nxIn))}</strong>${lw}</div></div>`
    :cd?`<div class="rb">🧹 Cleaner confirmed for <strong>${b.co} at ${f12(cot)}</strong>${lw}</div>`
    :`<div class="cb">🧹 <div><strong>Contact cleaner</strong> for checkout on <strong>${b.co} at ${f12(cot)}</strong>${lw}</div></div>`;
  // Cleaner flow only shown for confirmed bookings (pencil bookings have no cleaner logistics)
  const showCleaner = b.type === "confirmed" || b.type === undefined;
  const ratingHtml=buildRatingHtml(b,false);
  // Rate row — only shown when ratePerNight is set
  let rateRow="";
  if(b.ratePerNight){
    const fmt=n=>Math.round(n).toLocaleString();
    const origNights=dR(b.ci,b.originalCo||b.co).length;
    const origTotal=origNights*b.ratePerNight;
    if(b.extensionRate&&b.originalCo){
      const extNights=dR(b.originalCo,b.co).length;
      const extTotal=extNights*b.extensionRate;
      rateRow=`<div class="dr"><span class="dl">Rate</span><span class="dv" style="text-align:right"><div>Orig: ₱${fmt(b.ratePerNight)} × ${origNights}n = ₱${fmt(origTotal)}</div><div>Ext: ₱${fmt(b.extensionRate)} × ${extNights}n = ₱${fmt(extTotal)}</div><div><strong>Est. total: ₱${fmt(origTotal+extTotal)}</strong></div></span></div>`;
    } else {
      rateRow=`<div class="dr"><span class="dl">Rate</span><span class="dv">₱${fmt(b.ratePerNight)} × ${origNights} night${origNights!==1?"s":""} = ₱${fmt(origTotal)}</span></div>`;
    }
  }
  document.getElementById("dpanel").innerHTML=`
    <div class="pt">Booking details</div>
    <div class="dr"><span class="dl">Guest</span><strong class="dv">${b.name}</strong></div>
    <div class="dr"><span class="dl">Booker</span><span class="bdg ${rep?"rp":"nw"}">${rep?"⭐ Repeat ("+cnt+"x)":"New guest"}</span></div>
    <div class="dr"><span class="dl">Mobile</span><span class="dv" style="color:#1A56DB">${b.mobile||"—"}</span></div>
    ${b.email?`<div class="dr"><span class="dl">Email</span><span class="dv" style="color:#1A56DB">${b.email}</span></div>`:""}
    <div class="dr"><span class="dl">Platform</span><span class="bdg ${pC(b.platform)}">${b.platform}</span></div>
    <div class="dr"><span class="dl">Payment</span><span class="bdg ${pyC(b.pay)}">${pyL(b.pay)}</span></div>
    ${b.method?`<div class="dr"><span class="dl">Paid via</span><span class="bdg ${mC(b.method)}">${b.method}</span></div>`:""}
    <div class="dr"><span class="dl">Check-in</span><span class="dv">${b.ci} at <strong>${f12(cit)}</strong>${ciX}</span></div>
    <div class="dr"><span class="dl">Check-out</span><span class="dv">${b.co} at <strong>${f12(cot)}</strong>${coX}</span></div>
    ${b.notes?`<div class="dr"><span class="dl">Notes</span><span class="dv">${b.notes}</span></div>`:""}
    ${rateRow}
    ${ratingHtml}
    ${showCleaner?`<div class="tt">
      <button class="tbtn tcl${cd?" dn3":""}" onclick="tapCl()">${cd?"✓ Cleaner contacted":"🧹 Cleaner contacted?"}</button>
      <button class="tbtn trd${ur?" dn3":""}" onclick="tapRd()"${!cd?' disabled style="opacity:0.45;cursor:not-allowed"':''}>${ur?"✓ Unit ready":"✅ Unit ready?"}</button>
    </div>
    ${clBox}
    ${prof.cleanerMob?`<div style="margin-top:6px"><button class="btn" style="width:100%;border-color:#2D5F0F;color:#2D5F0F" onclick="msgCleaner(${b.id})">📱 Message cleaner</button></div>`:""}`:""}
    <div class="acb">
      <button class="btn be" onclick="openEdit()">✏️ Edit</button>
      <button class="btn bx" onclick="openExt()">📅 Extend</button>
      <button class="btn bc" onclick="openCan()">✕ Cancel</button>
    </div>`;
}

function showBlk(bl2){
  active=null;
  document.getElementById("dpanel").innerHTML=`
    <div class="pt">🔧 Maintenance block</div>
    <div class="dr"><span class="dl">Reason</span><strong class="dv">${bl2.reason}</strong></div>
    <div class="dr"><span class="dl">From</span><span class="dv">${bl2.from}</span></div>
    <div class="dr"><span class="dl">To</span><span class="dv">${bl2.to}</span></div>
    ${bl2.notes?`<div class="dr"><span class="dl">Notes</span><span class="dv">${bl2.notes}</span></div>`:""}
    <div class="acb">
      <button class="btn be" onclick="openEditBlk(${bl2.id})">✏️ Edit</button>
      <button class="btn bc" onclick="delBlk(${bl2.id})">✕ Remove</button>
    </div>`;
}

// RATING
const RATE_TAGS=['Clean','Quiet','Friendly','Communicative','Late checkout','Damaged property','Would host again','Would not host again','Left a mess','Noisy'];
const RATE_CONFLICTS={'Would host again':'Would not host again','Would not host again':'Would host again','Clean':'Left a mess','Left a mess':'Clean','Quiet':'Noisy','Noisy':'Quiet'};
function buildRatingHtml(b,inProfile){
  if(b.type==='pencil')return'';
  if(b.co>=TD())return'';
  const rid=b.id;
  const starSvg=(n,filled)=>`<svg onclick="setRatingStar(${rid},${n})" width="28" height="28" viewBox="0 0 24 24" style="cursor:pointer;flex-shrink:0" data-star="${n}"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="${filled?'#F59E0B':'none'}" stroke="${filled?'#F59E0B':'#D1D5DB'}" stroke-width="2"/></svg>`;
  if(b.rating){
    const stars=[1,2,3,4,5].map(n=>`<span style="color:${n<=b.rating?'#F59E0B':'#D1D5DB'};font-size:20px">&#9733;</span>`).join('');
    const tagChips=(b.tags||[]).map(t=>`<span class="gp-tag-chip act">${t}</span>`).join('');
    return`<div style="margin-top:8px;padding-top:8px;border-top:1px solid #f0f0f0">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#999;margin-bottom:5px">Your review</div>
      <div>${stars}</div>
      ${tagChips?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:5px">${tagChips}</div>`:''}
      ${b.reviewNotes?`<div style="font-size:11px;color:#555;margin-top:5px;font-style:italic">${b.reviewNotes}</div>`:''}
      <button class="btn" style="font-size:11px;padding:3px 10px;margin-top:6px" onclick="editRating(${rid},${inProfile})">Edit review</button>
    </div>`;
  }
  const pendingStars=pendingRating[rid]||0;
  const starsHtml=[1,2,3,4,5].map(n=>starSvg(n,n<=pendingStars)).join('');
  const pendingTagsArr=pendingRating[rid+'t']||[];
  const tagChips=RATE_TAGS.map(t=>`<span class="gp-tag-chip${pendingTagsArr.includes(t)?' act':''}" data-tag="${t}" onclick="toggleRatingTag('${t.replace(/'/g,"\\'")}',${rid})">${t}</span>`).join('');
  const pendingNotes=pendingRating[rid+'n']||'';
  return`<div style="margin-top:8px;padding-top:8px;border-top:1px solid #f0f0f0">
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#999;margin-bottom:5px">Rate your guest</div>
    <div id="stars-${rid}" style="display:flex;gap:3px;margin-bottom:8px">${starsHtml}</div>
    <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px" id="tags-${rid}">${tagChips}</div>
    <textarea id="rnotes-${rid}" placeholder="Private notes about this guest" style="width:100%;box-sizing:border-box;border:1px solid #D1D5DB;border-radius:6px;padding:7px;font-size:12px;font-family:inherit;resize:vertical;min-height:50px">${pendingNotes}</textarea>
    <div id="raterr-${rid}" style="display:none;color:#DC2626;font-size:12px;margin-top:4px">Please select a star rating.</div>
    <button class="btn bsv" style="width:100%;margin-top:6px" onclick="saveRating(${rid},${inProfile})">Save rating</button>
  </div>`;
}
function setRatingStar(bookingId,stars){
  pendingRating[bookingId]=stars;
  const container=document.getElementById('stars-'+bookingId);if(!container)return;
  container.querySelectorAll('svg').forEach(svg=>{
    const n=parseInt(svg.dataset.star),filled=n<=stars;
    const path=svg.querySelector('path');
    if(path){path.setAttribute('fill',filled?'#F59E0B':'none');path.setAttribute('stroke',filled?'#F59E0B':'#D1D5DB');}
  });
}
function toggleRatingTag(tagName,bookingId){
  const container=document.getElementById('tags-'+bookingId);if(!container)return;
  if(!pendingRating[bookingId+'t'])pendingRating[bookingId+'t']=[];
  const arr=pendingRating[bookingId+'t'];
  const idx=arr.indexOf(tagName);
  if(idx===-1){
    arr.push(tagName);
    const conflict=RATE_CONFLICTS[tagName];
    if(conflict){const ci=arr.indexOf(conflict);if(ci!==-1)arr.splice(ci,1);}
  } else {arr.splice(idx,1);}
  container.querySelectorAll('.gp-tag-chip').forEach(chip=>{chip.classList.toggle('act',arr.includes(chip.dataset.tag));});
}
function saveRating(bookingId,inProfile){
  const stars=pendingRating[bookingId]||0;
  if(!stars){const errEl=document.getElementById('raterr-'+bookingId);if(errEl)errEl.style.display='block';return;}
  const tags=pendingRating[bookingId+'t']||[];
  const notesEl=document.getElementById('rnotes-'+bookingId);
  const reviewNotes=notesEl?notesEl.value.trim():'';
  let b=bk.find(x=>x.id===bookingId),inBk=true;
  if(!b){b=bh.find(x=>x.id===bookingId);inBk=false;}
  if(!b)return;
  b.rating=stars;b.tags=tags;b.reviewNotes=reviewNotes;
  if(inBk)sv();else svH();
  delete pendingRating[bookingId];delete pendingRating[bookingId+'t'];delete pendingRating[bookingId+'n'];
  const profile=b.guestProfileId?getGP(b.guestProfileId):null;
  if(profile){
    const allLinked=[
      ...profile.linkedBookingIds.map(id=>bk.find(x=>x.id===id)),
      ...profile.linkedHistoryIds.map(id=>bh.find(x=>x.id===id))
    ].filter(x=>x&&x.rating&&isConf(x));
    profile.averageRating=allLinked.length?allLinked.reduce((s,x)=>s+x.rating,0)/allLinked.length:null;
    profile.tags=[...new Set(allLinked.flatMap(x=>x.tags||[]))];
    svGP();
  }
  if(inProfile){const profId=profile?profile.id:(b.guestProfileId||null);if(profId)openGMProf(profId);}
  else showDet(b);
}
function editRating(bookingId,inProfile){
  let b=bk.find(x=>x.id===bookingId);
  if(!b)b=bh.find(x=>x.id===bookingId);
  if(!b)return;
  pendingRating[bookingId]=b.rating||0;
  pendingRating[bookingId+'t']=[...(b.tags||[])];
  pendingRating[bookingId+'n']=b.reviewNotes||'';
  const savedRating=b.rating;
  b.rating=undefined;
  if(inProfile){const profile=b.guestProfileId?getGP(b.guestProfileId):null;if(profile)openGMProf(profile.id);}
  else showDet(b);
  b.rating=savedRating;
}

function tapCl(){if(!active)return;active.cd=!active.cd;if(!active.cd)active.ur=false;sv();renderCal();showDet(active);}
function tapRd(){if(!active)return;if(!active.cd){alert("Please confirm cleaner has been contacted first.");return;}active.ur=!active.ur;sv();renderCal();showDet(active);}
function chgM(d){cm+=d;if(cm>11){cm=0;cy++;}if(cm<0){cm=11;cy--;}renderCal();}

// ADD
function openAdd(pre){
  editId=null;
  selectedGPId=null;
  document.getElementById("gp-suggest").style.display="none";
  const blWarn=document.getElementById("bl-warn-add");if(blWarn)blWarn.style.display="none";
  document.getElementById("atype-conf").style.opacity="";
  document.getElementById("atype-conf").style.pointerEvents="";
  document.getElementById("atype-pcl").style.opacity="";
  document.getElementById("atype-pcl").style.pointerEvents="";
  setAType('confirmed');
  ["an","am","ae","ano"].forEach(id=>document.getElementById(id).value="");
  const ci=pre||TD(),co=aD(pre||TD(),1);
  document.getElementById("aci").value=ci;document.getElementById("aci").min=TD();
  document.getElementById("aco").value=co;document.getElementById("aco").min=aD(ci,1);
  document.getElementById("acis").value=prof.ci||"14:00";document.getElementById("acos").value=prof.co||"12:00";
  ["acie","acil","acoe","acol"].forEach(id=>document.getElementById(id).value="");
  document.getElementById("apy").value="none";document.getElementById("ame").value="";
  document.getElementById("ame-row").style.display="none";
  document.getElementById("aerr").style.display="none";
  document.getElementById("a-rate").value=prof.defaultRate!=null?prof.defaultRate:"";
  document.getElementById("a-rate-total").style.display="none";
  const pn=document.getElementById("apre");
  if(pre){pn.textContent="📅 Check-in pre-filled for "+pre;pn.style.display="block";}else pn.style.display="none";
  document.getElementById("ov-add").classList.add("sh");
}
function saveAdd(){
  if(editId!==null){
    // Edit mode — update existing pencil booking in-place
    const name=document.getElementById("an").value.trim();
    const ci=document.getElementById("aci").value,co=document.getElementById("aco").value;
    const err=document.getElementById("aerr");
    if(!name||!ci||!co){err.textContent="Please fill in guest name and both dates.";err.style.display="block";return;}
    if(co<=ci){err.textContent="Check-out must be after check-in.";err.style.display="block";return;}
    const confConflict=dR(ci,co).find(d=>gB(d,editId));
    if(confConflict){err.textContent="Conflict on "+confConflict+" — a confirmed booking covers these dates.";err.style.display="block";return;}
    const blConflict=dR(ci,co).find(d=>gBl(d));
    if(blConflict){err.textContent="Conflict on "+blConflict+" — a maintenance block covers these dates.";err.style.display="block";return;}
    const idx=bk.findIndex(x=>x.id===editId);
    if(idx!==-1){
      bk[idx]={...bk[idx],name,
        mobile:document.getElementById("am").value.trim(),
        email:document.getElementById("ae").value.trim(),
        ci,co,ciS:document.getElementById("acis").value,
        coS:document.getElementById("acos").value,
        platform:document.getElementById("apl").value,
        notes:document.getElementById("ano").value.trim(),
        ratePerNight:parseFloat(document.getElementById("a-rate").value)||null};
      sv();renderCal();cAll();
    }
    editId=null;return;
  }
  const name=document.getElementById("an").value.trim();
  const ci=document.getElementById("aci").value,co=document.getElementById("aco").value;
  const err=document.getElementById("aerr");
  if(!name||!ci||!co){err.textContent="Please fill in guest name and both dates.";err.style.display="block";return;}
  if(co<=ci){err.textContent="Check-out must be after check-in.";err.style.display="block";return;}
  const mobile=document.getElementById("am").value.trim(),email=document.getElementById("ae").value.trim();
  const platform=document.getElementById("apl").value,notes=document.getElementById("ano").value.trim();
  const ciS=document.getElementById("acis").value,coS=document.getElementById("acos").value;
  const ciE=document.getElementById("acie").value,ciL=document.getElementById("acil").value;
  const coE=document.getElementById("acoe").value,coL=document.getElementById("acol").value;
  if(aType==="pencil"){
    // Hard block: overlap with confirmed booking (exclude checkout date — turnaround is allowed)
    const confConflict=dR(ci,co).find(d=>gB(d,null));
    if(confConflict){err.textContent="Conflict — a confirmed booking covers these dates.";err.style.display="block";return;}
    // Hard block: overlap with maintenance block
    const blConflict=dR(ci,co).find(d=>gBl(d));
    if(blConflict){err.textContent="Conflict — a maintenance block covers these dates.";err.style.display="block";return;}
    // Multiple pencil bookings on same dates: allowed
    const b={id:nid++,name,mobile,email,ci,co,ciS,coS,ciE:"",ciL:"",coE:"",coL:"",platform,pay:"none",method:"",notes,cd:false,ur:false,at:TD(),type:"pencil",ratePerNight:parseFloat(document.getElementById("a-rate").value)||null};
    commitBk(b);
    return;
  }
  // Confirmed path — minNights check
  if(prof.minNights&&parseInt(prof.minNights)>1){
    const nights=dR(ci,co).length;
    if(nights<parseInt(prof.minNights)){
      err.textContent="Minimum stay is "+prof.minNights+" night"+(parseInt(prof.minNights)!==1?"s":"")+". This booking is only "+nights+".";
      err.style.display="block";return;
    }
  }
  const b={id:nid++,name,mobile,email,ci,co,ciS,coS,ciE,ciL,coE,coL,platform,
    pay:document.getElementById("apy").value,method:document.getElementById("ame").value,
    notes,cd:false,ur:false,at:TD(),type:"confirmed",
    ratePerNight:parseFloat(document.getElementById("a-rate").value)||null};
  // Only check confirmed bookings and blocks (exclude checkout date — turnaround is allowed)
  const conf=dR(ci,co).find(ds=>gB(ds,null)||gBl(ds));
  if(conf){
    const conflictBook=gB(conf,null);
    if(conflictBook&&isUnpaid(conflictBook)){
      pendOver=conflictBook;pend=b;
      cAll();
      const contact=conflictBook.mobile||conflictBook.email||"—";
      document.getElementById("ow-msg").innerHTML=`There is currently an unpaid or pending booking for these dates. Booker: <strong>${conflictBook.name}</strong>, ${contact}. Do you want to overwrite this booking?`;
      document.getElementById("ov-ow").classList.add("sh");return;
    }
    if(conflictBook){err.textContent="Conflict on "+conf+" — already booked.";err.style.display="block";return;}
    err.textContent="Conflict on "+conf+" — already blocked.";err.style.display="block";return;
  }
  // Check for displaced pencil bookings
  const displaced=pclOnRange(ci,co);
  if(displaced.length>0){
    pend=b;
    showDisplaced(displaced,"These pencil bookings will be cancelled. Please contact them.",
      "Cancel pencil bookings and confirm","Go back",
      ()=>{displaced.forEach(d2=>{archiveBk(d2,"booking_confirmed");bk=bk.filter(x=>x.id!==d2.id);});cOv('ov-displaced');
        const exCoD=gCO(b.ci);
        if(exCoD){
          document.getElementById("twb").innerHTML=`<div class="wb"><strong>↓ ${exCoD.name}</strong> checks out on <strong>${b.ci} at ${f12(eCo(exCoD))}</strong><br><strong>↑ ${b.name}</strong> would check in at <strong>${f12(eCi(b))}</strong><br><br>Cleaner must prepare unit between these times. Confirm this is enough time.</div>`;
          document.getElementById("twbt").innerHTML=`<button class="bxx" onclick="cOv('ov-tw');pend=null;">Cancel</button><button class="bsv" onclick="commitPend()">Proceed anyway</button>`;
          document.getElementById("ov-tw").classList.add("sh");
        } else {commitBk(b);pend=null;}
      },
      ()=>{cOv('ov-displaced');pend=null;});
    return;
  }
  // Soft turnaround warning
  const exCo=gCO(ci);
  if(exCo){
    pend=b;cAll();
    document.getElementById("twb").innerHTML=`<div class="wb"><strong>↓ ${exCo.name}</strong> checks out on <strong>${ci} at ${f12(eCo(exCo))}</strong><br><strong>↑ ${name}</strong> would check in at <strong>${f12(eCi(b))}</strong><br><br>Cleaner must prepare unit between these times. Confirm this is enough time.</div>`;
    document.getElementById("twbt").innerHTML=`<button class="bxx" onclick="cOv('ov-tw');pend=null;">Cancel</button><button class="bsv" onclick="commitPend()">Proceed anyway</button>`;
    document.getElementById("ov-tw").classList.add("sh");return;
  }
  const rgProfile=selectedGPId?getGP(selectedGPId):findGP(name,mobile);
  if(rgProfile&&rgProfile.hasConfirmed&&b.type==="confirmed"){
    pendingBookingForRepeat=b;
    showRepeatGuest(rgProfile,b,
      ()=>{commitBk(pendingBookingForRepeat);pendingBookingForRepeat=null;},
      ()=>{selectedGPId=null;commitBk(pendingBookingForRepeat);pendingBookingForRepeat=null;}
    );
    return;
  }
  commitBk(b);
}
function commitPend(){if(!pend)return;commitBk(pend);pend=null;cAll();}
function commitBk(b){
  bk.push(b);
  let gpProfile=findGP(b.name,b.mobile);
  if(!gpProfile)gpProfile=createGP(b.name,b.mobile,b.email);
  b.guestProfileId=gpProfile.id;
  if(b.mobile&&!gpProfile.mobiles.includes(b.mobile))gpProfile.mobiles.push(b.mobile);
  linkBkToGP(gpProfile.id,b.id,false);
  if(b.type==="confirmed")updateGPConfirmed(gpProfile.id);
  sv();svGP();cAll();renderCal();showDet(b);
}
function confirmOw(){
  if(!pend||!pendOver)return;
  const b=pend,ovId=pendOver.id;
  // Check for turnaround BEFORE removing the overwritten booking
  const exCo=gCO(b.ci);
  if(exCo&&exCo.id!==ovId){
    // Turnaround warning — removal only happens if user proceeds
    cAll();pend=b;
    document.getElementById("twb").innerHTML=`<div class="wb"><strong>↓ ${exCo.name}</strong> checks out on <strong>${b.ci} at ${f12(eCo(exCo))}</strong><br><strong>↑ ${b.name}</strong> would check in at <strong>${f12(eCi(b))}</strong><br><br>Cleaner must prepare unit between these times. Confirm this is enough time.</div>`;
    document.getElementById("twbt").innerHTML=`<button class="bxx" onclick="cOv('ov-tw');pend=null;pendOver=null;">Cancel</button><button class="bsv" onclick="bk=bk.filter(x=>x.id!==${ovId});pendOver=null;commitPend()">Proceed anyway</button>`;
    document.getElementById("ov-tw").classList.add("sh");return;
  }
  // No turnaround (or turnaround is the booking being overwritten) — safe to remove and commit
  bk=bk.filter(x=>x.id!==ovId);
  pendOver=null;pend=null;cAll();
  commitBk(b);
}

function showRepeatGuest(profile,b,onSame,onDiff){
  const linkedBk=profile.linkedBookingIds.map(id=>bk.find(x=>x.id===id)).filter(Boolean);
  const linkedBh=profile.linkedHistoryIds.map(id=>bh.find(x=>x.id===id)).filter(Boolean);
  const allStays=[...linkedBk,...linkedBh].sort((a,x)=>x.ci.localeCompare(a.ci));
  const lastStay=allStays[0]||null;
  const avgStars=profile.averageRating;
  const starsHtml=avgStars?`<div style="color:#F59E0B;font-size:16px;margin:4px 0">${"★".repeat(Math.round(avgStars))}${"☆".repeat(5-Math.round(avgStars))} <span style="font-size:12px;color:#555">${avgStars.toFixed(1)}</span></div>`:"";
  const lastStayHtml=lastStay?`<div style="font-size:12px;color:#555;margin-bottom:4px">Last stay: <strong>${lastStay.ci} → ${lastStay.co}</strong> \xb7 <span class="bdg ${pC(lastStay.platform)}">${lastStay.platform}</span>${lastStay.pay?` \xb7 <span class="bdg ${pyC(lastStay.pay)}">${pyL(lastStay.pay)}</span>`:""}</div>`:"";
  const mobileDiff=b.mobile&&!profile.mobiles.includes(b.mobile)?`<div style="color:#B45309;font-size:12px;background:#FFFBEB;border:1px solid #FDE68A;padding:6px 10px;border-radius:6px;margin-bottom:8px">⚠ Different number from last time. Previous: ${profile.mobiles[0]||"—"}</div>`:"";
  const notesHtml=profile.notes?`<div style="font-size:12px;color:#555;font-style:italic;margin-bottom:4px">"${profile.notes}"</div>`:"";
  document.getElementById("rg-content").innerHTML=`
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
      <div class="gp-avatar" style="width:42px;height:42px;font-size:15px">${initials(profile.name)}</div>
      <div><div style="font-weight:700;font-size:14px">${profile.name}</div>${starsHtml}</div>
    </div>
    ${lastStayHtml}${notesHtml}${mobileDiff}`;
  document.getElementById("rg-same").onclick=()=>{
    b.guestProfileId=profile.id;
    if(b.mobile&&!profile.mobiles.includes(b.mobile))profile.mobiles.push(b.mobile);
    updateGPConfirmed(profile.id);svGP();
    cOv("ov-repeat-guest");onSame();
  };
  document.getElementById("rg-diff").onclick=()=>{
    selectedGPId=null;cOv("ov-repeat-guest");onDiff();
  };
  document.getElementById("ov-repeat-guest").classList.add("sh");
}

// EDIT
function openEdit(){
  if(!active)return;const b=active;
  document.getElementById("en").value=b.name;document.getElementById("em").value=b.mobile||"";document.getElementById("ee").value=b.email||"";
  document.getElementById("ecis").value=b.ciS||"14:00";document.getElementById("ecos").value=b.coS||"12:00";
  document.getElementById("ecie").value=b.ciE||"";document.getElementById("ecil").value=b.ciL||"";
  document.getElementById("ecoe").value=b.coE||"";document.getElementById("ecol").value=b.coL||"";
  document.getElementById("epl").value=b.platform;document.getElementById("epy").value=b.pay;
  document.getElementById("eme2").value=b.method||"";document.getElementById("eno").value=b.notes||"";
  document.getElementById("edates").innerHTML="🔒 Dates: <strong>"+b.ci+"</strong> → <strong>"+b.co+"</strong>";
  document.getElementById("eerr").style.display="none";
  const eRateEl=document.getElementById("e-rate"),eTotalEl=document.getElementById("e-rate-total");
  eRateEl.value=b.ratePerNight!=null?b.ratePerNight:"";
  if(b.ratePerNight){
    const nights=dR(b.ci,b.co).length;
    const fmt=n=>Math.round(n).toLocaleString();
    eTotalEl.textContent=nights+" night"+(nights!==1?"s":"")+" × ₱"+fmt(b.ratePerNight)+" = ₱"+fmt(nights*b.ratePerNight)+" estimated total";
    eTotalEl.style.display="block";
  } else {eTotalEl.style.display="none";}
  document.getElementById("ov-ed").classList.add("sh");
}
function saveEdit(){
  if(!active)return;const b=active;
  const name=document.getElementById("en").value.trim();
  const err=document.getElementById("eerr");
  if(!name){err.textContent="Guest name cannot be empty.";err.style.display="block";return;}
  b.name=name;b.mobile=document.getElementById("em").value.trim();b.email=document.getElementById("ee").value.trim();
  b.ciS=document.getElementById("ecis").value;b.coS=document.getElementById("ecos").value;
  b.ciE=document.getElementById("ecie").value;b.ciL=document.getElementById("ecil").value;
  b.coE=document.getElementById("ecoe").value;b.coL=document.getElementById("ecol").value;
  b.platform=document.getElementById("epl").value;b.pay=document.getElementById("epy").value;
  b.method=document.getElementById("eme2").value;b.notes=document.getElementById("eno").value.trim();
  b.ratePerNight=parseFloat(document.getElementById("e-rate").value)||null;
  sv();
  if(active&&active.guestProfileId){
    const gpProfile=getGP(active.guestProfileId);
    if(gpProfile){
      gpProfile.name=active.name;
      if(active.mobile&&!gpProfile.mobiles.includes(active.mobile))gpProfile.mobiles.push(active.mobile);
      if(active.email)gpProfile.email=active.email;
      svGP();
    }
  }
  cAll();renderCal();showDet(b);
}

// EXTEND
function openExt(){
  if(!active)return;const b=active;
  const nd=aD(b.co,1),conf=bk.some(b2=>b2.id!==b.id&&isConf(b2)&&b2.ci<nd&&b2.co>nd)||gBl(nd);
  const body=document.getElementById("exb"),btns=document.getElementById("exbt");
  if(conf){
    body.innerHTML=`<div class="er">Cannot extend — ${nd} is already blocked or booked.</div><p style="font-size:13px;color:#666">Current checkout: <strong>${b.co}</strong></p>`;
    btns.innerHTML=`<button class="bxx" style="flex:1" onclick="cAll()">Close</button>`;
  } else {
    const ip=b.pay==="full";
    body.innerHTML=`<p style="font-size:13px;margin-bottom:8px;color:#666">Current checkout: <strong>${b.co}</strong></p>
    <div class="fr"><label>New check-out date</label><input type="date" id="exd" min="${nd}" value="${nd}"/></div>
    ${ip?`<div class="ib">Guest is fully paid. If extension unpaid, status flips to partially paid.</div>`:""}
    <div class="f2">
      <div><label>Extension paid?</label><select id="expy"><option value="no">Not paid${ip?" — mark partial":""}</option><option value="yes">Already paid</option></select></div>
      <div><label>Method</label><select id="exme"><option value="">— select —</option><option>GCash</option><option>Maya</option><option>Via app</option><option>Bank transfer</option><option>Cash</option></select></div>
    </div>
    <div style="margin-top:8px">
      <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">
        <input type="checkbox" id="ext-same-rate" checked onchange="document.getElementById('ext-rate-row').style.display=this.checked?'none':'block'"/>
        Use same rate as original booking
      </label>
      <div id="ext-rate-row" style="display:none;margin-top:6px">
        <div class="fr"><label>Extension rate per night (₱)</label><input type="number" id="ext-rate" min="0" placeholder="0" value="${b.ratePerNight||''}"/></div>
      </div>
    </div>
    <div id="exer" class="er" style="display:none"></div>
    <p style="font-size:11px;color:#888;margin-top:5px">🧹 Cleaner date updates automatically.</p>`;
    btns.innerHTML=`<button class="bxx" onclick="cAll()">Cancel</button><button class="bsv" onclick="confExt()">Confirm</button>`;
  }
  document.getElementById("ov-ex").classList.add("sh");
}
function confExt(){
  const b=active,nc=document.getElementById("exd").value;
  const err=document.getElementById("exer");
  if(!nc||nc<=b.co){err.textContent="New checkout must be after "+b.co+".";err.style.display="block";return;}
  const conf=dR(aD(b.co,1),nc).find(ds=>gB(ds,b.id)||gBl(ds));
  if(conf){err.textContent="Conflict on "+conf+".";err.style.display="block";return;}
  const doExtend=()=>{
    const ep=document.getElementById("expy").value==="yes";
    const em=document.getElementById("exme").value;
    if(b.pay==="full"&&!ep)b.pay="partial";
    else if(b.pay==="none"&&ep)b.pay="partial";
    if(em)b.method=em;
    const sameRate=document.getElementById("ext-same-rate").checked;
    if(!sameRate){
      if(!b.originalCo)b.originalCo=b.co;
      b.extensionRate=parseFloat(document.getElementById("ext-rate").value)||null;
    }
    b.co=nc;b.cd=false;b.ur=false;
    sv();cAll();renderCal();showDet(b);
  };
  const extDisplaced=pclOnRange(aD(b.co,1),nc);
  if(extDisplaced.length>0){
    showDisplaced(extDisplaced,"These pencil bookings overlap the extended dates. Please contact them.",
      "Extend anyway","Go back",
      ()=>{extDisplaced.forEach(d2=>{archiveBk(d2,"booking_confirmed");bk=bk.filter(x=>x.id!==d2.id);});cOv('ov-displaced');doExtend();},
      ()=>{cOv('ov-displaced');});
    return;
  }
  doExtend();
}

// CANCEL
function openCan(){
  if(!active)return;const b=active;
  const days=dR(b.ci,b.co);
  document.getElementById("cab").innerHTML=`
    <p style="font-size:13px;margin-bottom:9px;color:#666">Cancelling for <strong>${b.name}</strong> (${b.ci} → ${b.co})</p>
    <div style="display:flex;flex-direction:column;gap:5px;margin-bottom:9px">
      <label style="display:flex;gap:7px;font-size:13px;cursor:pointer;padding:8px;border:1px solid #ddd;border-radius:5px">
        <input type="radio" name="ct" value="full" checked onchange="tgP(false)" style="margin-top:2px">
        <div><strong>Cancel full booking</strong><br><span style="font-size:11px;color:#888">Removes all ${days.length} day(s)</span></div>
      </label>
      <label style="display:flex;gap:7px;font-size:13px;cursor:pointer;padding:8px;border:1px solid #ddd;border-radius:5px">
        <input type="radio" name="ct" value="partial" onchange="tgP(true)" style="margin-top:2px">
        <div><strong>Remove specific days</strong><br><span style="font-size:11px;color:#888">Trim from start or end only</span></div>
      </label>
    </div>
    <div id="psec" style="display:none">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#999;margin-bottom:4px">Select days to remove</div>
      <div class="ds">${days.map(d=>`<label><input type="checkbox" value="${d}"> ${d}</label>`).join("")}</div>
      <div id="perr" class="er" style="display:none;margin-top:6px"></div>
    </div>`;
  document.getElementById("cabt").innerHTML=`<button class="bxx" onclick="cAll()">Keep booking</button><button class="bdl" onclick="reqCan()">Continue</button>`;
  document.getElementById("ov-ca").classList.add("sh");
}
function tgP(s){document.getElementById("psec").style.display=s?"block":"none";}
function reqCan(){
  const type=document.querySelector('input[name="ct"]:checked')?.value;
  if(type==="full"){pfcl=active;cOv("ov-ca");document.getElementById("ov-cc").classList.add("sh");}
  else confPart();
}
function execFull(){
  const b=pfcl;if(!b)return;
  archiveBk(b,"confirmed_cancelled_full",{cancelledBy:"host"});
  bk=bk.filter(x=>x.id!==b.id);sv();cAll();renderCal();
  document.getElementById("dpanel").innerHTML=`<div class="ph">Booking for ${b.name} cancelled.</div>`;
  active=null;pfcl=null;
  // Re-contact check: find displaced pencil guests whose dates overlap the cancelled booking
  const cancelledDays=dR(b.ci,b.co);
  const displaced=bh.filter(h=>
    h.cancelReason==="booking_confirmed"&&
    dR(h.ci,h.co).some(d=>cancelledDays.includes(d))
  );
  if(displaced.length>0){
    if(!prof.recontact)prof.recontact=[];
    displaced.forEach(h=>{
      if(!prof.recontact.find(r=>r.bhId===h.id)){
        prof.recontact.push({
          bhId:h.id,name:h.name,
          mobile:h.mobile||"",email:h.email||"",
          ci:h.ci,co:h.co,
          cancelledBookingId:b.id,
          storedAt:Date.now()
        });
      }
    });
    svP();
  }
}
function confPart(){
  const b=active;
  const sel=[...document.querySelectorAll("#psec input:checked")].map(c=>c.value);
  const pe=document.getElementById("perr");
  if(!sel.length){pe.textContent="Select at least one day.";pe.style.display="block";return;}
  const rem=dR(b.ci,b.co).filter(d=>!sel.includes(d));
  archiveBk(b,"confirmed_cancelled_partial",{originalCi:b.ci,originalCo:b.co,cancelledDays:sel});
  if(!rem.length){bk=bk.filter(x=>x.id!==b.id);sv();cAll();renderCal();document.getElementById("dpanel").innerHTML=`<div class="ph">All days removed — booking deleted.</div>`;active=null;return;}
  const s=rem.sort();b.ci=s[0];b.co=aD(s[s.length-1],1);
  sv();cAll();renderCal();showDet(b);
}

// MAINTENANCE
function openMaint(pre){
  document.getElementById("mnt").textContent="Block dates";
  const f=pre||TD();
  document.getElementById("mfr").value=f;document.getElementById("mto").value=f;
  document.getElementById("mre").value="Maintenance / repairs";document.getElementById("mno").value="";
  document.getElementById("merr").style.display="none";
  delete document.getElementById("ov-mn").dataset.eid;
  const pn=document.getElementById("mpre");
  if(pre){pn.textContent="📅 Date pre-filled for "+pre;pn.style.display="block";}else pn.style.display="none";
  document.getElementById("ov-mn").classList.add("sh");
}
function openEditBlk(id){
  const b=bl.find(x=>x.id===id);if(!b)return;
  document.getElementById("mnt").textContent="Edit block";
  document.getElementById("mfr").value=b.from;document.getElementById("mto").value=b.to;
  document.getElementById("mre").value=b.reason;document.getElementById("mno").value=b.notes||"";
  document.getElementById("merr").style.display="none";document.getElementById("mpre").style.display="none";
  document.getElementById("ov-mn").dataset.eid=id;
  document.getElementById("ov-mn").classList.add("sh");
}
function saveMaint(){
  const fr=document.getElementById("mfr").value,to=document.getElementById("mto").value;
  const re=document.getElementById("mre").value,no=document.getElementById("mno").value.trim();
  const err=document.getElementById("merr");
  if(!fr||!to){err.textContent="Please select both dates.";err.style.display="block";return;}
  if(to<fr){err.textContent="End date must be on or after start date.";err.style.display="block";return;}
  const eid=parseInt(document.getElementById("ov-mn").dataset.eid||"0");
  const conf=dR(fr,aD(to,1)).find(ds=>getConfOn(ds));
  if(conf){err.textContent="Conflict on "+conf+" — a confirmed guest is booked.";err.style.display="block";return;}
  const doSaveMaint=()=>{
    if(eid){const b=bl.find(x=>x.id===eid);if(b){b.from=fr;b.to=to;b.reason=re;b.notes=no;}}
    else bl.push({id:nid++,from:fr,to:to,reason:re,notes:no});
    delete document.getElementById("ov-mn").dataset.eid;
    sv();cAll();renderCal();
    document.getElementById("dpanel").innerHTML=`<div class="ph">Block saved: ${re} · ${fr} to ${to}.</div>`;
  };
  const mDisplaced=pclOnRange(fr,to);
  if(mDisplaced.length>0){
    showDisplaced(mDisplaced,"These pencil bookings overlap the blocked dates. Please contact them.",
      "Block anyway","Go back",
      ()=>{mDisplaced.forEach(d2=>{archiveBk(d2,"booking_confirmed");bk=bk.filter(x=>x.id!==d2.id);});cOv('ov-displaced');doSaveMaint();},
      ()=>{cOv('ov-displaced');});
    return;
  }
  doSaveMaint();
}
function delBlk(id){bl=bl.filter(b=>b.id!==id);sv();renderCal();document.getElementById("dpanel").innerHTML=`<div class="ph">Block removed.</div>`;}

// ALL BOOKINGS
function openList(){
  document.getElementById("lsq").value="";document.getElementById("lss").value="dd";
  listFilter='all';
  document.querySelectorAll(".lf-chip").forEach(c=>c.classList.toggle("act",c.dataset.lf==="all"));
  renderList();document.getElementById("ov-li").classList.add("sh");
}
function lFilt(chip){
  listFilter=chip.dataset.lf;
  document.querySelectorAll(".lf-chip").forEach(c=>c.classList.toggle("act",c===chip));
  renderList();
}
function renderList(){
  const q=document.getElementById("lsq").value.toLowerCase(),sort=document.getElementById("lss").value;
  let list=[...bk];
  if(listFilter==="conf")list=list.filter(b=>b.type==="confirmed"||!b.type);
  if(listFilter==="pcl")list=list.filter(b=>b.type==="pencil");
  if(q)list=list.filter(b=>b.name.toLowerCase().includes(q)||b.platform.toLowerCase().includes(q)||(b.method||"").toLowerCase().includes(q)||(b.mobile||"").includes(q));
  if(sort==="dd")list.sort((a,b)=>(b.at||"").localeCompare(a.at||""));
  else if(sort==="da")list.sort((a,b)=>(a.at||"").localeCompare(b.at||""));
  else if(sort==="na")list.sort((a,b)=>a.name.localeCompare(b.name));
  else if(sort==="nd")list.sort((a,b)=>b.name.localeCompare(a.name));
  else if(sort==="up"){list=list.filter(b=>b.ci>=TD());list.sort((a,b)=>a.ci.localeCompare(b.ci));}
  const el=document.getElementById("blist");
  if(!list.length){el.innerHTML=`<div class="el">No bookings found.</div>`;return;}
  el.innerHTML=list.map(b=>{
    const rep=cG(b.name)>1,ni=dR(b.ci,b.co).length,isTurn=isPencil(b)?false:!!gCI(b.co);
    return`<div class="bc2" onclick="pickBk(${b.id})">
      <div class="bc2t">
        <div><div class="bc2n">${rep?"⭐ ":""}${b.name}${isTurn?' <span style="color:#E8A020;font-size:10px">⚡</span>':""}${b.type==="pencil"?'<span class="pcl-bdg">✏️ Pencil</span>':""}</div>
        <div class="bc2d">${b.ci} → ${b.co} · ${ni} night${ni!==1?"s":""}</div></div>
        ${b.type==="pencil"?'<span class="bdg" style="background:#FEF9C3;color:#713F12;border:1px solid #FDE047;flex-shrink:0">Pencil hold</span>':`<span class="bdg ${pyC(b.pay)}" style="flex-shrink:0">${pyL(b.pay)}</span>`}
      </div>
      <div class="bc2b">
        <span class="bdg ${pC(b.platform)}">${b.platform}</span>
        ${b.method?`<span class="bdg ${mC(b.method)}">${b.method}</span>`:""}
        ${b.mobile?`<span style="font-size:11px;color:#888">${b.mobile}</span>`:""}
      </div>
    </div>`;
  }).join("");
}
function pickBk(id){
  const b=bk.find(x=>x.id===id);if(!b)return;
  cAll();const d=new Date(b.ci);cy=d.getFullYear();cm=d.getMonth();
  renderCal();
  if(isPencil(b))showPclDet(b);else showDet(b);
}

// GUESTS
let gmFilter='all';
function openGM(){
  document.getElementById("gmq").value="";
  gmFilter='all';
  document.querySelectorAll(".gm-chip").forEach(c=>c.classList.toggle("act",c.dataset.f==="all"));
  document.getElementById("gm-lv").style.display="block";
  document.getElementById("gm-pv").style.display="none";
  renderGM();
}
function buildGuests(){
  return gp.map(profile=>{
    const liveBkEntries=profile.linkedBookingIds.map(id=>bk.find(b=>b.id===id)).filter(Boolean);
    const histEntries=profile.linkedHistoryIds.map(id=>bh.find(b=>b.id===id)).filter(Boolean);
    const allStays=[
      ...liveBkEntries.map(b=>Object.assign({},b,{_src:'bk'})),
      ...histEntries.map(b=>Object.assign({},b,{_src:'bh'}))
    ].sort((a,b2)=>b2.ci.localeCompare(a.ci));
    const confStays=liveBkEntries.filter(b=>isConf(b));
    const platforms=[...new Set(allStays.map(s=>s.platform).filter(Boolean))];
    let payFull=0,payPart=0,payNone=0;
    confStays.forEach(b=>{if(b.pay==='full')payFull++;else if(b.pay==='partial')payPart++;else payNone++;});
    const sortedFut=liveBkEntries.filter(b=>b.ci>=TD()).sort((a,b2)=>a.ci.localeCompare(b2.ci));
    const upcoming=sortedFut[0]||null;
    const last=allStays[0]?.ci||null;
    return{
      ...profile,
      stays:allStays,platforms,
      payFull,payPart,payNone,
      upcoming,last,
      mobile:profile.mobiles[0]||'',
      email:profile.email||''
    };
  })
  .filter(g=>g.stays.length>0)
  .sort((a,b)=>{
    if(a.isBlacklisted!==b.isBlacklisted)return a.isBlacklisted?1:-1;
    return b.stays.length-a.stays.length||(b.last||'').localeCompare(a.last||'');
  });
}
function stayLabel(s){
  if(s._src==='bh'){
    if(s.cancelReason==='confirmed_cancelled_full')return'<span style="color:#8B2110;font-size:10px;font-weight:700">Cancelled by host</span>';
    if(s.cancelReason==='confirmed_cancelled_partial')return'<span style="color:#7A4A00;font-size:10px;font-weight:700">Partially cancelled</span>';
    if(s.cancelReason==='booking_confirmed')return'<span style="color:#C2410C;font-size:10px;font-weight:700">Pencil cancelled, another booking confirmed</span>';
    if(s.cancelReason==='expired')return'<span style="color:#6B7280;font-size:10px;font-weight:700">Pencil expired</span>';
    if(s.cancelReason==='host_cancelled')return'<span style="color:#6B7280;font-size:10px;font-weight:700">Pencil cancelled by host</span>';
  }
  if(s.type==='pencil')return'<span style="color:#713F12;font-size:10px;font-weight:700">✏️ Pencil</span>';
  return'<span style="color:#15803D;font-size:10px;font-weight:700">Confirmed</span>';
}
function cpTxt(btn,val){
  try{
    navigator.clipboard.writeText(val).then(()=>{
      const orig=btn.textContent;btn.textContent="Copied";
      setTimeout(()=>{btn.textContent=orig;},1000);
    });
  }catch(e){}
}
function gmFilt(chip){
  gmFilter=chip.dataset.f;
  document.querySelectorAll(".gm-chip").forEach(c=>c.classList.toggle("act",c===chip));
  renderGM();
}
function renderGM(){
  const q=document.getElementById("gmq").value.toLowerCase();
  const allGuests=buildGuests();
  let guests=[...allGuests];
  if(q)guests=guests.filter(g=>g.name.toLowerCase().includes(q)||(g.mobiles||[]).some(m=>m.includes(q))||(g.email||'').toLowerCase().includes(q));
  if(gmFilter==="conf")guests=guests.filter(g=>g.hasConfirmed);
  if(gmFilter==="pcl")guests=guests.filter(g=>!g.hasConfirmed);
  if(gmFilter==="bl")guests=guests.filter(g=>g.isBlacklisted===true);
  if(gmFilter==="unrated")guests=guests.filter(g=>g.hasConfirmed&&!g.averageRating);
  // Merge suggestion banner — same normalized name, different mobiles
  const nameMap={};
  allGuests.forEach(g=>{const k=g.name.toLowerCase().trim();if(!nameMap[k])nameMap[k]=[];nameMap[k].push(g);});
  const dupePairs=[];
  Object.values(nameMap).forEach(arr=>{if(arr.length>1)dupePairs.push([arr[0],arr[1]]);});
  const mergeBanner=dupePairs.length?`<div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:10px 12px;margin-bottom:10px">
    <div style="font-weight:700;font-size:12px;margin-bottom:4px">&#x26A0; Possible duplicate profiles</div>
    ${dupePairs.map(([a,b2])=>`<div style="font-size:12px;color:#555;margin-bottom:4px"><strong>${a.name}</strong> — ${a.mobiles[0]||'no mobile'} vs ${b2.mobiles[0]||'no mobile'} <button class="btn bsv" style="font-size:11px;padding:2px 8px;margin-left:6px" onclick="mergeProfiles(${a.id},${b2.id})">Merge</button></div>`).join('')}
  </div>`:'';
  const el=document.getElementById("gm-list");
  if(!guests.length){el.innerHTML=mergeBanner+`<div class="gm-el">No guests found.</div>`;return;}
  el.innerHTML=mergeBanner+guests.map(g=>{
    const starsHtml=g.averageRating?`<span style="color:#F59E0B;font-size:11px">${"★".repeat(Math.round(g.averageRating))}${"☆".repeat(5-Math.round(g.averageRating))}</span> <span style="font-size:11px;color:#888">${g.averageRating.toFixed(1)}</span>`:"";
    const blBadge=g.isBlacklisted?`<span class="bl-bdg" style="margin-left:5px">Blacklisted</span>`:"";
    const pclBadge=!g.hasConfirmed?`<span style="font-size:10px;background:#FEF9C3;color:#713F12;padding:1px 5px;border-radius:4px;margin-left:5px">Pencil only</span>`:"";
    const lastLabel=g.upcoming?`Next: ${g.upcoming.ci}`:(g.last?`Last: ${g.last}`:"");
    const plBadges=g.platforms.map(p=>`<span class="bdg ${pC(p)}">${p}</span>`).join("");
    return`<div class="gm-row" onclick="openGMProf(${g.id})">
      <div style="display:flex;align-items:center;gap:9px">
        <div class="gp-avatar">${initials(g.name)}</div>
        <div style="flex:1;min-width:0">
          <div class="gm-rn">${g.name}${blBadge}${pclBadge}</div>
          <div class="gm-rs">${g.stays.length} stay${g.stays.length!==1?'s':''}${lastLabel?' \xb7 '+lastLabel:''}${g.mobile?' \xb7 '+g.mobile:''}</div>
          <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-top:2px">${plBadges}${starsHtml?`<span style="margin-left:2px">${starsHtml}</span>`:''}</div>
        </div>
      </div>
    </div>`;
  }).join("");
}
function openGMProf(profileId){
  const profile=getGP(profileId);if(!profile)return;
  const liveBkEntries=profile.linkedBookingIds.map(id=>bk.find(b=>b.id===id)).filter(Boolean);
  const histEntries=profile.linkedHistoryIds.map(id=>bh.find(b=>b.id===id)).filter(Boolean);
  const allStays=[
    ...liveBkEntries.map(b=>Object.assign({},b,{_src:'bk'})),
    ...histEntries.map(b=>Object.assign({},b,{_src:'bh'}))
  ].sort((a,b2)=>b2.ci.localeCompare(a.ci));
  const repConf=liveBkEntries.filter(b=>isConf(b)).length>1;
  const payFull=liveBkEntries.filter(b=>isConf(b)&&b.pay==='full').length;
  const payPart=liveBkEntries.filter(b=>isConf(b)&&b.pay==='partial').length;
  const payNone=liveBkEntries.filter(b=>isConf(b)&&b.pay==='none').length;
  const paySum=[payFull?payFull+' full':'',payPart?payPart+' partial':'',payNone?payNone+' unpaid':''].filter(Boolean).join(' \xb7 ')||'—';
  const platforms=[...new Set(allStays.map(s=>s.platform).filter(Boolean))];
  const plBadges=platforms.map(p=>`<span class="bdg ${pC(p)}">${p}</span>`).join(" ");
  const starsHtml=profile.averageRating?`<div style="color:#F59E0B;font-size:16px;margin-bottom:4px">${"★".repeat(Math.round(profile.averageRating))}${"☆".repeat(5-Math.round(profile.averageRating))} <span style="font-size:12px;color:#555">${profile.averageRating.toFixed(1)}</span></div>`:"";
  const blHdrBadge=profile.isBlacklisted?` <span class="bl-bdg">Blacklisted</span>`:"";
  document.getElementById("gm-pname").innerHTML=(repConf?'⭐ ':'')+profile.name+blHdrBadge+(allStays.length>1?` <span style="font-size:12px;font-weight:400;color:#888">(${allStays.length} stays)</span>`:'');
  const staysHtml=allStays.map(s=>{
    const ni=dR(s.ci,s.co).length;
    const lbl=stayLabel(s);
    const payBadge=s._src==='bk'&&s.type==='confirmed'?`<span class="bdg ${pyC(s.pay)}">${pyL(s.pay)}</span>`:'';
    const ratingSection=buildRatingHtml(s,true);
    return`<div class="gm-stay">
      <div class="gm-stay-hd">
        <div><div class="gm-stay-dt">${s.ci} → ${s.co}</div><div style="font-size:11px;color:#888">${ni} night${ni!==1?'s':''}</div></div>
        ${payBadge}
      </div>
      <div style="margin-bottom:3px">${lbl}</div>
      <div class="gm-stay-inf">
        <span class="bdg ${pC(s.platform)}">${s.platform}</span>
        ${s.method&&s._src==='bk'?`<span class="bdg ${mC(s.method)}">${s.method}</span>`:''}
        ${s.notes?`<span style="font-size:11px;color:#888">${s.notes}</span>`:''}
      </div>
      ${ratingSection}
    </div>`;
  }).join("");
  const blSection=profile.isBlacklisted
    ?`<div style="background:#FEF2F2;border:1px solid #FCA5A5;border-radius:8px;padding:12px;margin-top:12px">
        <div style="color:#991B1B;font-weight:700;margin-bottom:4px">&#x1F6AB; Blacklisted</div>
        ${profile.blacklistDate?`<div style="font-size:12px;color:#7F1D1D;margin-bottom:4px">Date: ${new Date(profile.blacklistDate).toLocaleDateString('en-PH',{year:'numeric',month:'long',day:'numeric'})}</div>`:''}
        ${profile.blacklistReason?`<div style="font-size:12px;color:#7F1D1D;margin-bottom:8px">Reason: ${profile.blacklistReason}</div>`:''}
        <button class="btn" onclick="removeBlacklist(${profileId})">Remove from blacklist</button>
      </div>`
    :`<div style="margin-top:12px"><button class="btn bc" onclick="showBlacklistPanel(${profileId})">&#x1F6AB; Blacklist guest</button></div>`;
  document.getElementById("gm-pbody").innerHTML=`
    <div class="gm-psec">Contact</div>
    ${profile.mobiles.length?profile.mobiles.map(m=>`<div class="dr"><span class="dl">Mobile</span><span class="dv" style="color:#1A56DB">${m}<button class="gm-copy" onclick="cpTxt(this,'${m.replace(/'/g,"\\'")}')">Copy</button></span></div>`).join(''):`<div class="dr"><span class="dl">Mobile</span><span class="dv" style="color:#aaa">—</span></div>`}
    ${profile.email?`<div class="dr"><span class="dl">Email</span><span class="dv" style="color:#1A56DB">${profile.email}<button class="gm-copy" onclick="cpTxt(this,'${profile.email.replace(/'/g,"\\'")}')">Copy</button></span></div>`:''}
    <div class="gm-psec">Summary</div>
    <div class="dr"><span class="dl">Total stays</span><span class="dv">${allStays.length}</span></div>
    <div class="dr"><span class="dl">Platforms</span><span class="dv">${plBadges}</span></div>
    <div class="dr"><span class="dl">Payment summary</span><span class="dv">${paySum}</span></div>
    ${starsHtml?`<div class="dr"><span class="dl">Avg rating</span><span class="dv">${starsHtml}</span></div>`:''}
    ${profile.notes?`<div class="dr"><span class="dl">Notes</span><span class="dv">${profile.notes}</span></div>`:''}
    <div class="gm-psec">Stay history</div>
    ${staysHtml}
    ${blSection}`;
  document.getElementById("gm-lv").style.display="none";
  document.getElementById("gm-pv").style.display="block";
}
function gmBack(){
  document.getElementById("gm-lv").style.display="block";
  document.getElementById("gm-pv").style.display="none";
  renderGM();
}
function showBlacklistPanel(profileId){
  const profile=getGP(profileId);if(!profile)return;
  const reasons=['Damaged property','Did not pay','Disrespectful','Excessive noise','Brought unauthorized guests','Other'];
  const pbody=document.getElementById("gm-pbody");if(!pbody)return;
  pbody.innerHTML=`
    <div style="margin-top:10px">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#999;margin-bottom:8px">&#x1F6AB; Blacklist ${profile.name}</div>
      <div style="font-size:12px;color:#555;margin-bottom:8px">Select reason:</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px" id="bl-reasons">
        ${reasons.map(r=>`<span class="gp-tag-chip" data-reason="${r}" onclick="this.parentElement.querySelectorAll('.gp-tag-chip').forEach(c=>c.classList.remove('act'));this.classList.add('act');">${r}</span>`).join('')}
      </div>
      <textarea id="bl-notes" placeholder="Additional details (optional)" style="width:100%;box-sizing:border-box;border:1px solid #D1D5DB;border-radius:6px;padding:7px;font-size:12px;font-family:inherit;resize:vertical;min-height:50px;margin-bottom:8px"></textarea>
      <div style="display:flex;gap:8px">
        <button class="btn bc" style="flex:1" onclick="confirmBlacklist(${profileId})">Confirm blacklist</button>
        <button class="btn bxx" style="flex:1" onclick="openGMProf(${profileId})">Cancel</button>
      </div>
    </div>`;
}
function confirmBlacklist(profileId){
  const profile=getGP(profileId);if(!profile)return;
  const activeChip=document.querySelector('#bl-reasons .gp-tag-chip.act');
  const reason=activeChip?activeChip.dataset.reason:'';
  const notes=(document.getElementById('bl-notes')?.value||'').trim();
  profile.isBlacklisted=true;
  profile.blacklistReason=[reason,notes].filter(Boolean).join(' — ');
  profile.blacklistDate=Date.now();
  svGP();openGMProf(profileId);renderGM();
}
function removeBlacklist(profileId){
  const profile=getGP(profileId);if(!profile)return;
  const pbody=document.getElementById("gm-pbody");if(!pbody)return;
  const confirmDiv=document.createElement('div');
  confirmDiv.style.cssText='background:#FEF9C3;border:1px solid #FDE68A;border-radius:8px;padding:12px;margin-top:10px';
  confirmDiv.innerHTML=`<div style="font-size:13px;margin-bottom:8px">Remove ${profile.name} from blacklist?</div>
    <div style="display:flex;gap:8px">
      <button class="btn bc" style="flex:1" onclick="execRemoveBlacklist(${profileId})">Yes, remove</button>
      <button class="btn bxx" style="flex:1" onclick="openGMProf(${profileId})">Cancel</button>
    </div>`;
  pbody.appendChild(confirmDiv);
}
function execRemoveBlacklist(profileId){
  const profile=getGP(profileId);if(!profile)return;
  profile.isBlacklisted=false;profile.blacklistReason='';profile.blacklistDate=null;
  svGP();openGMProf(profileId);renderGM();
}
function mergeProfiles(primaryId,secondaryId){
  const primary=getGP(primaryId),secondary=getGP(secondaryId);
  if(!primary||!secondary||primaryId===secondaryId)return;
  secondary.mobiles.forEach(m=>{if(!primary.mobiles.includes(m))primary.mobiles.push(m);});
  secondary.linkedBookingIds.forEach(id=>{if(!primary.linkedBookingIds.includes(id))primary.linkedBookingIds.push(id);});
  secondary.linkedHistoryIds.forEach(id=>{if(!primary.linkedHistoryIds.includes(id))primary.linkedHistoryIds.push(id);});
  if(!primary.mergedProfileIds.includes(secondaryId))primary.mergedProfileIds.push(secondaryId);
  bk.forEach(b=>{if(b.guestProfileId===secondaryId)b.guestProfileId=primaryId;});
  bh.forEach(b=>{if(b.guestProfileId===secondaryId)b.guestProfileId=primaryId;});
  gp=gp.filter(p=>p.id!==secondaryId);
  if(!primary.isBlacklisted&&secondary.isBlacklisted){
    primary.isBlacklisted=true;primary.blacklistReason=secondary.blacklistReason;primary.blacklistDate=secondary.blacklistDate;
  }
  if(!primary.hasConfirmed&&secondary.hasConfirmed)primary.hasConfirmed=true;
  const ratedStays=[
    ...primary.linkedBookingIds.map(id=>bk.find(x=>x.id===id)),
    ...primary.linkedHistoryIds.map(id=>bh.find(x=>x.id===id))
  ].filter(x=>x&&x.rating&&isConf(x));
  primary.averageRating=ratedStays.length?ratedStays.reduce((sum,x)=>sum+x.rating,0)/ratedStays.length:null;
  primary.tags=[...new Set(ratedStays.flatMap(x=>x.tags||[]))];
  sv();svH();svGP();renderGM();
}

// EXPORT / IMPORT
let pendingImport=null;
function doExport(){
  const data={bt_b:bk,bt_bl:bl,bt_p:prof,bt_bh:bh,bt_gp:gp,bt_gpnid:gpnid};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download="booking-tracker-backup.json";
  document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
}
function triggerImport(){document.getElementById("imp-file").value="";document.getElementById("imp-file").click();}
function readImport(input){
  const file=input.files[0];if(!file)return;
  const imperr=document.getElementById("imperr");
  const impok=document.getElementById("impok");
  const impconfbtn=document.getElementById("impconfbtn");
  const reader=new FileReader();
  reader.onload=function(e){
    let data;
    try{data=JSON.parse(e.target.result);}catch(err){
      imperr.textContent="Invalid file — could not parse JSON.";imperr.style.display="block";
      impok.style.display="none";impconfbtn.style.display="none";
      document.getElementById("ov-imp").classList.add("sh");return;
    }
    if(!Array.isArray(data.bt_b)||!Array.isArray(data.bt_bl)){
      imperr.textContent="Invalid backup — file must contain bt_b and bt_bl arrays.";imperr.style.display="block";
      impok.style.display="none";impconfbtn.style.display="none";
      document.getElementById("ov-imp").classList.add("sh");return;
    }
    if(data.bt_gp!==undefined&&!Array.isArray(data.bt_gp)){
      imperr.textContent="Invalid backup — bt_gp must be an array.";imperr.style.display="block";
      impok.style.display="none";impconfbtn.style.display="none";
      document.getElementById("ov-imp").classList.add("sh");return;
    }
    pendingImport=data;
    imperr.style.display="none";
    const profTxt=data.bt_p&&!Array.isArray(data.bt_p)?" Property profile included.":"";
    const histTxt=Array.isArray(data.bt_bh)&&data.bt_bh.length?" "+data.bt_bh.length+" booking history record"+(data.bt_bh.length!==1?"s":"")+".":"";
    document.getElementById("impsummary").textContent="Found "+data.bt_b.length+" booking"+(data.bt_b.length!==1?"s":"")+" and "+data.bt_bl.length+" block"+(data.bt_bl.length!==1?"s":"")+"."+profTxt+histTxt;
    impok.style.display="block";impconfbtn.style.display="block";
    document.getElementById("ov-imp").classList.add("sh");
  };
  reader.readAsText(file);
}
function confirmImport(){
  if(!pendingImport)return;
  bk=pendingImport.bt_b;
  bl=pendingImport.bt_bl;
  if(pendingImport.bt_p&&!Array.isArray(pendingImport.bt_p)&&typeof pendingImport.bt_p==="object")prof=pendingImport.bt_p;
  else prof={};
  if(Array.isArray(pendingImport.bt_bh))bh=pendingImport.bt_bh;else bh=[];
  if(Array.isArray(pendingImport.bt_gp))gp=pendingImport.bt_gp;else gp=[];
  gpnid=pendingImport.bt_gpnid||1;
  if(gp.length)gpnid=Math.max(gpnid,...gp.map(p=>p.id+1));
  svGP();
  if(gp.length===0)migrateToGP(); // rebuild from imported bt_b/bt_bh if old backup has no bt_gp
  const ids=[...bk.map(x=>x.id),...bl.map(x=>x.id)];
  nid=ids.length?Math.max(...ids)+1:1;
  sv();svP();svH();svGP();cAll();renderCal();updateHeader();active=null;
  document.getElementById("dpanel").innerHTML='<div class="ph">✅ Backup restored — '+bk.length+' booking'+(bk.length!==1?'s':'')+(bl.length?' and '+bl.length+' block'+(bl.length!==1?'s':''):'')+' loaded.</div>';
  pendingImport=null;
}

// WHAT'S NEW
function openWN(){document.getElementById("ov-wn").classList.add("sh");}

// UPDATE HEADER
function updateHeader(){
  const n=prof.name?"Booking Tracker — "+prof.name:"Booking Tracker";
  document.getElementById("hpname").textContent=n;
}

// TAB SYSTEM
function showTab(tab){
  if(bk.some(b=>b.type==="pencil"))checkPencilExpiry();
  ['home','guests','reports','more'].forEach(t=>{
    document.getElementById('tab-'+t).style.display=t===tab?'block':'none';
    document.getElementById('bnt-'+t).classList.toggle('act',t===tab);
  });
  if(tab==='guests'){openGM();}
  if(tab==='home'){buildTicker();}
}

// TICKER + STATS
function buildTicker(){
  const wrap=document.getElementById("ticker-wrap");if(!wrap)return;
  const cs=prof.calSettings||{};
  if(cs.tickerEnabled===false){wrap.style.display="none";return;}
  const today=TD();
  const conf=bk.filter(b=>isConf(b));
  let events=[];
  // P1: Turnaround today
  const todayOut=conf.find(b=>b.co===today);
  const todayIn=conf.find(b=>b.ci===today);
  if(todayOut&&todayIn){
    events.push({label:"TURNAROUND TODAY",text:todayOut.name.split(" ")[0]+" checks out "+(f12(eCo(todayOut))||"")+" \xb7 "+todayIn.name.split(" ")[0]+" checks in "+(f12(eCi(todayIn))||""),date:today,id:todayIn.id});
  } else {
    // P2: Check-in today
    const todayIns=conf.filter(b=>b.ci===today);
    todayIns.forEach(b=>{
      const nights=dR(b.ci,b.co).length;
      const payStr=b.pay==="full"?"Paid":b.pay==="partial"?"Partial balance due":b.pay==="none"?"Unpaid":"";
      events.push({label:"CHECK-IN TODAY",text:b.name+" \xb7 "+b.platform+(f12(eCi(b))?" \xb7 "+f12(eCi(b)):"")+(payStr?" \xb7 "+payStr:"")+" \xb7 "+nights+" night"+(nights!==1?"s":""),date:today,id:b.id});
    });
    // P3: Checkout today, no check-in today
    if(!todayIns.length&&todayOut){
      events.push({label:"CHECKOUT TODAY",text:todayOut.name+" \xb7 "+todayOut.platform+(f12(eCo(todayOut))?" \xb7 "+f12(eCo(todayOut)):""),date:today,id:todayOut.id});
    }
  }
  // P4: Tomorrow check-in (only if no today events)
  if(!events.length){
    const tmr=aD(today,1);
    conf.filter(b=>b.ci===tmr).forEach(b=>{
      const nights=dR(b.ci,b.co).length;
      const payStr=b.pay==="full"?"Paid":b.pay==="partial"?"Partial balance due":b.pay==="none"?"Unpaid":"";
      events.push({label:"TOMORROW",text:b.name+" \xb7 "+b.platform+(f12(eCi(b))?" \xb7 "+f12(eCi(b)):"")+(payStr?" \xb7 "+payStr:"")+" \xb7 "+nights+" night"+(nights!==1?"s":""),date:tmr,id:b.id});
    });
  }
  // P5: Next upcoming check-in
  if(!events.length){
    const upcoming=conf.filter(b=>b.ci>today).sort((a,b2)=>a.ci.localeCompare(b2.ci));
    if(upcoming.length){
      const b=upcoming[0];
      const d=new Date(b.ci+"T00:00:00");
      const dateStr=d.toLocaleDateString("en-US",{month:"short",day:"numeric"});
      const nights=dR(b.ci,b.co).length;
      const payStr=b.pay==="full"?"Paid":b.pay==="partial"?"Partial balance due":b.pay==="none"?"Unpaid":"";
      events.push({label:"NEXT CHECK-IN",text:dateStr+" \xb7 "+b.name+" \xb7 "+b.platform+(f12(eCi(b))?" \xb7 "+f12(eCi(b)):"")+(payStr?" \xb7 "+payStr:"")+" \xb7 "+nights+" night"+(nights!==1?"s":""),date:b.ci,id:b.id});
    }
  }
  // P6: No bookings
  if(!events.length){events.push({label:"",text:"No upcoming check-ins  \xb7  Calendar is clear",date:null,id:null});}
  tickerTarget=events[0].date?{date:events[0].date,id:events[0].id}:null;
  const sep="&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\xb7\xb7\xb7\xb7\xb7&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
  const content=events.map(e=>(e.label?`<span style="color:#F59E0B">${e.label}</span> \xb7 `:"")+e.text).join(sep);
  const inner=document.getElementById("ticker-inner");
  if(inner)inner.innerHTML=content+sep+content;
  wrap.style.display="block";
}
function toggleLegend(){
  const lw=document.getElementById("legend-wrap");
  const btn=document.getElementById("legend-btn");
  const isOpen=lw.style.display!=="none";
  lw.style.display=isOpen?"none":"block";
  btn.style.background=isOpen?"#fff":"#F0FDF4";
  btn.style.borderColor=isOpen?"#D1D5DB":"#86EFAC";
  btn.style.color=isOpen?"#6B7280":"#16A34A";
}
function buildStats(){
  const mStr=cy+"-"+String(cm+1).padStart(2,"0");
  const days=new Date(cy,cm+1,0).getDate();
  const conf=bk.filter(b=>isConf(b));
  const mStart=mStr+"-01";
  const mEnd=mStr+"-"+String(days).padStart(2,"0");
  // Chip 1: Confirmed bookings overlapping this month
  const bkCount=conf.filter(b=>b.ci<=mEnd&&b.co>mStart).length;
  // Chip 2: Nights booked (days with mid-stay confirmed booking, checkout excluded via dR)
  let nightsBooked=0;
  for(let d=1;d<=days;d++){const ds=mStr+"-"+String(d).padStart(2,"0");if(gB(ds,null))nightsBooked++;}
  // Chip 3: Next free date (first date after today with no mid-stay booking and no block)
  const today=TD();let nextFree="—";let checkDate=aD(today,1);
  for(let i=0;i<365;i++){
    if(!gB(checkDate,null)&&!gBl(checkDate)){
      const d=new Date(checkDate+"T00:00:00");
      nextFree=d.toLocaleDateString("en-US",{month:"short",day:"numeric"});break;
    }
    checkDate=aD(checkDate,1);
  }
  const el1=document.getElementById("stat-bkcount");if(el1)el1.textContent=bkCount;
  const el2=document.getElementById("stat-nights");if(el2)el2.textContent=nightsBooked;
  const el3=document.getElementById("stat-nextfree");if(el3)el3.textContent=nextFree;
}
function tickerTap(){
  if(!tickerTarget||!tickerTarget.date)return;
  const parts=tickerTarget.date.split('-');
  cy=parseInt(parts[0]);cm=parseInt(parts[1])-1;
  renderCal();
  if(tickerTarget.id){const b=bk.find(x=>isConf(x)&&x.id===tickerTarget.id);if(b)showDet(b);}
}
function msgCleaner(id){
  const b=bk.find(x=>x.id===id);if(!b||!prof.cleanerMob)return;
  const checkoutTime=f12(eCo(b))||"12:00 PM";
  const nextCi=bk.filter(x=>isConf(x)&&x.ci>b.co).sort((a,c)=>a.ci.localeCompare(c.ci))[0];
  const msg=encodeURIComponent(
    "Hi! Guest "+b.name+" checks out on "+b.co+" at "+checkoutTime+"."+
    (nextCi?" Next check-in is "+nextCi.ci+". Please have the unit ready by then.":" Please clean after checkout. Thank you!")
  );
  window.open("sms:"+prof.cleanerMob+"?body="+msg);
}

// PROPERTY PROFILE
function openProf(){
  document.getElementById("pr-name").value=prof.name||"";
  document.getElementById("pr-addr").value=prof.addr||"";
  document.getElementById("pr-type").value=prof.type||"";
  document.getElementById("pr-bed").value=prof.bed||"";
  document.getElementById("pr-bath").value=prof.bath||"";
  document.getElementById("pr-occ").value=prof.occ||"";
  document.getElementById("pr-ci").value=prof.ci||"14:00";
  document.getElementById("pr-co").value=prof.co||"12:00";
  const eciTog=prof.eciAllow||false;
  document.getElementById("pr-eci-tog").checked=eciTog;
  document.getElementById("pr-eci-fee").style.display=eciTog?"block":"none";
  document.getElementById("pr-eci-val").value=prof.eciFee||"";
  const lcoTog=prof.lcoAllow||false;
  document.getElementById("pr-lco-tog").checked=lcoTog;
  document.getElementById("pr-lco-fee").style.display=lcoTog?"block":"none";
  document.getElementById("pr-lco-val").value=prof.lcoFee||"";
  document.getElementById("pr-pm-gc").checked=prof.pmGC!==false;
  document.getElementById("pr-pm-my").checked=prof.pmMy||false;
  document.getElementById("pr-pm-bt").checked=prof.pmBt||false;
  document.getElementById("pr-pm-cs").checked=prof.pmCs||false;
  document.getElementById("pr-fp-tog").checked=prof.fullPay||false;
  document.getElementById("pr-dp").value=prof.dpPct||"";
  document.getElementById("pr-dp").disabled=prof.fullPay||false;
  document.getElementById("pr-exp").value=prof.expHrs||"";
  document.getElementById("pr-min").value=prof.minNights||"";
  document.getElementById("pr-no-smoke").checked=prof.noSmoke||false;
  document.getElementById("pr-no-pets").checked=prof.noPets||false;
  document.getElementById("pr-no-party").checked=prof.noParty||false;
  document.getElementById("pr-rule").value=prof.customRule||"";
  document.getElementById("pr-hname").value=prof.hostName||"";
  document.getElementById("pr-hmob").value=prof.hostMob||"";
  document.getElementById("pr-gcash").value=prof.gcash||"";
  document.getElementById("pr-rate").value=prof.defaultRate!=null?prof.defaultRate:"";
  document.getElementById("pr-cmob").value=prof.cleanerMob||"";
  const cs=prof.calSettings||{tickerEnabled:true,hoverEnabled:true,hoverMode:"hover"};
  document.getElementById("pr-ticker").checked=cs.tickerEnabled!==false;
  const he=cs.hoverEnabled!==false;
  document.getElementById("pr-hover-enabled").checked=he;
  document.getElementById("pr-hover-on").checked=cs.hoverMode!=="click";
  document.getElementById("pr-hover-click").checked=cs.hoverMode==="click";
  document.getElementById("pr-hover-radios").style.opacity=he?"1":"0.4";
  document.getElementById("pr-hover-on").disabled=!he;
  document.getElementById("pr-hover-click").disabled=!he;
  document.getElementById("prof-saved").style.display="none";
  document.getElementById("ov-prof").classList.add("sh");
}
function saveProf(){
  const wasNew=!prof.name;
  // Preserve fields not bound to any UI input — saving the form must not wipe them
  const existingRecontact=prof.recontact||[];
  const existingPencilExpiryHrs=prof.pencilExpiryHrs||24;
  prof={
    name:document.getElementById("pr-name").value.trim(),
    addr:document.getElementById("pr-addr").value.trim(),
    type:document.getElementById("pr-type").value,
    bed:document.getElementById("pr-bed").value,
    bath:document.getElementById("pr-bath").value,
    occ:document.getElementById("pr-occ").value,
    ci:document.getElementById("pr-ci").value,
    co:document.getElementById("pr-co").value,
    eciAllow:document.getElementById("pr-eci-tog").checked,
    eciFee:document.getElementById("pr-eci-val").value,
    lcoAllow:document.getElementById("pr-lco-tog").checked,
    lcoFee:document.getElementById("pr-lco-val").value,
    pmGC:document.getElementById("pr-pm-gc").checked,
    pmMy:document.getElementById("pr-pm-my").checked,
    pmBt:document.getElementById("pr-pm-bt").checked,
    pmCs:document.getElementById("pr-pm-cs").checked,
    fullPay:document.getElementById("pr-fp-tog").checked,
    dpPct:document.getElementById("pr-dp").value,
    expHrs:document.getElementById("pr-exp").value,
    minNights:document.getElementById("pr-min").value,
    noSmoke:document.getElementById("pr-no-smoke").checked,
    noPets:document.getElementById("pr-no-pets").checked,
    noParty:document.getElementById("pr-no-party").checked,
    customRule:document.getElementById("pr-rule").value.trim(),
    hostName:document.getElementById("pr-hname").value.trim(),
    hostMob:document.getElementById("pr-hmob").value.trim(),
    gcash:document.getElementById("pr-gcash").value.trim(),
    defaultRate:parseFloat(document.getElementById("pr-rate").value)||null,
    cleanerMob:document.getElementById("pr-cmob").value.trim(),
    calSettings:{
      tickerEnabled:document.getElementById("pr-ticker").checked,
      hoverEnabled:document.getElementById("pr-hover-enabled").checked,
      hoverMode:document.getElementById("pr-hover-click").checked?"click":"hover"
    },
    recontact:existingRecontact,
    pencilExpiryHrs:existingPencilExpiryHrs
  };
  svP();
  buildTicker();buildStats();
  updateHeader();
  if(wasNew&&prof.name)localStorage.setItem('bt_setup_done','1');
  const saved=document.getElementById("prof-saved");
  saved.style.display="block";
  setTimeout(()=>{saved.style.display="none";cOv('ov-prof');},2000);
}

// PENCIL BOOKING FUNCTIONS
function setAType(t){
  aType=t;
  document.getElementById("atype-conf").classList.toggle("dn3",t==="confirmed");
  document.getElementById("atype-pcl").classList.toggle("dn3",t==="pencil");
  document.getElementById("apay-sec").style.display=t==="pencil"?"none":"block";
}
function toggleAddMethod(){
  const v=document.getElementById("apy").value;
  document.getElementById("ame-row").style.display=(v==="full"||v==="partial")?"block":"none";
}
function togglePclMethod(){
  const v=document.getElementById("pcc-py").value;
  document.getElementById("pcc-me-row").style.display=(v==="full"||v==="partial")?"block":"none";
}
function openPclPanel(ds){
  const list=getPclOn(ds);
  document.getElementById("pcl-panel-title").textContent="Pencil bookings for "+ds;
  document.getElementById("pcl-list").innerHTML=list.map(b=>`
    <div class="pcl-entry">
      <div class="pcl-lbl">PENCIL HOLD</div>
      <div class="pcl-entry-nm">${b.name}</div>
      <div class="pcl-entry-dt">${b.ci} → ${b.co}</div>
      <div class="pcl-entry-inf">${[b.mobile,b.email,b.platform].filter(Boolean).join(' · ')}</div>
      ${b.notes?`<div style="font-size:11px;color:#555;margin-bottom:6px">${b.notes}</div>`:''}
      <div class="pcl-entry-act">
        <button class="btn bx" onclick="openPclConf(${b.id})">Confirm booking</button>
        <button class="btn bc" onclick="cancelPcl(${b.id})">Cancel</button>
      </div>
    </div>`).join("");
  document.getElementById("pcl-panel").classList.add("sh");
}
function closePclPanel(){document.getElementById("pcl-panel").classList.remove("sh");}
function showPclDet(b){
  if(!b)return;
  active=b;
  const cnt=cG(b.name);
  document.getElementById("dpanel").innerHTML=`
    <div class="pt">
      <span class="pcl-lbl" style="font-size:11px">✏️ PENCIL BOOKING</span>
      ${cnt>1?`<span class="bdg rp" style="margin-left:5px">⭐ ${cnt}× guest</span>`:''}
    </div>
    <div class="dr"><span class="dl">Guest</span><span class="dv">${b.name}</span></div>
    ${b.mobile?`<div class="dr"><span class="dl">Mobile</span><span class="dv">${b.mobile}</span></div>`:''}
    ${b.email?`<div class="dr"><span class="dl">Email</span><span class="dv">${b.email}</span></div>`:''}
    <div class="dr"><span class="dl">Check-in</span><span class="dv">${b.ci}${b.ciS?' at '+f12(b.ciS):''}</span></div>
    <div class="dr"><span class="dl">Check-out</span><span class="dv">${b.co}${b.coS?' at '+f12(b.coS):''}</span></div>
    <div class="dr"><span class="dl">Nights</span><span class="dv">${dR(b.ci,b.co).length}</span></div>
    <div class="dr"><span class="dl">Platform</span><span class="dv"><span class="bdg ${pC(b.platform)}">${b.platform}</span></span></div>
    ${b.notes?`<div class="dr"><span class="dl">Notes</span><span class="dv">${b.notes}</span></div>`:''}
    <div class="acb">
      <button class="btn bx" onclick="openPclConf(${b.id})">Confirm this booking</button>
      <button class="btn" onclick="editPcl(${b.id})">Edit</button>
      <button class="btn bc" onclick="cancelPcl(${b.id})">Cancel pencil booking</button>
    </div>`;
}
function editPcl(id){
  const b=bk.find(x=>x.id===id);
  if(!b||b.type!=="pencil")return;
  editId=id;
  // reset form to clean state
  ["an","am","ae","ano"].forEach(fid=>document.getElementById(fid).value="");
  ["acie","acil","acoe","acol"].forEach(fid=>document.getElementById(fid).value="");
  document.getElementById("apy").value="none";
  document.getElementById("ame").value="";
  document.getElementById("ame-row").style.display="none";
  document.getElementById("aerr").style.display="none";
  document.getElementById("apre").style.display="none";
  // pre-fill with booking data
  document.getElementById("an").value=b.name;
  document.getElementById("am").value=b.mobile||"";
  document.getElementById("ae").value=b.email||"";
  document.getElementById("aci").value=b.ci;
  document.getElementById("aci").min=TD();
  document.getElementById("aco").value=b.co;
  document.getElementById("aco").min=aD(b.ci,1);
  document.getElementById("acis").value=b.ciS||prof.ci||"14:00";
  document.getElementById("acos").value=b.coS||prof.co||"12:00";
  document.getElementById("apl").value=b.platform;
  document.getElementById("ano").value=b.notes||"";
  // lock to pencil type
  setAType("pencil");
  document.getElementById("atype-conf").style.opacity="0.4";
  document.getElementById("atype-conf").style.pointerEvents="none";
  document.getElementById("atype-pcl").style.opacity="0.4";
  document.getElementById("atype-pcl").style.pointerEvents="none";
  document.getElementById("ov-add").classList.add("sh");
}
function showPclList(ds){
  const list=getPclOn(ds);
  document.getElementById("dpanel").innerHTML=`<div class="pt">✏️ Pencil holds — ${ds}</div>`+
    list.map(b=>`
      <div class="pcl-entry" style="margin-bottom:7px">
        <div class="pcl-lbl">PENCIL HOLD</div>
        <div class="pcl-entry-nm">${b.name}</div>
        <div class="pcl-entry-dt">${b.ci} → ${b.co}</div>
        <div class="pcl-entry-inf">${[b.mobile,b.email,b.platform].filter(Boolean).join(' · ')}</div>
        ${b.notes?`<div style="font-size:11px;color:#555;margin-bottom:6px">${b.notes}</div>`:''}
        <div class="pcl-entry-act">
          <button class="btn bx" onclick="openPclConf(${b.id})">Confirm</button>
          <button class="btn" onclick="editPcl(${b.id})">Edit</button>
          <button class="btn bc" onclick="cancelPcl(${b.id})">Cancel</button>
        </div>
      </div>`).join("");
}
function closeAdd(){
  editId=null;
  selectedGPId=null;
  document.getElementById("gp-suggest").style.display="none";
  const blWarn=document.getElementById("bl-warn-add");if(blWarn)blWarn.style.display="none";
  document.getElementById("atype-conf").style.opacity="";
  document.getElementById("atype-conf").style.pointerEvents="";
  document.getElementById("atype-pcl").style.opacity="";
  document.getElementById("atype-pcl").style.pointerEvents="";
  cAll();
}
function openPclConf(id){
  pclConfId=id;
  const b=bk.find(x=>x.id===id);if(!b)return;
  document.getElementById("pcl-conf-title").textContent="Confirm booking for "+b.name+"?";
  document.getElementById("pcc-py-part").style.display=prof.fullPay?"none":"";
  document.getElementById("pcc-py").value="none";
  document.getElementById("pcc-me-row").style.display="none";
  document.getElementById("pcc-me").value="";
  document.getElementById("pcl-conf-err").style.display="none";
  document.getElementById("ov-pcl-conf").classList.add("sh");
}
function confirmPcl(){
  const b=bk.find(x=>x.id===pclConfId);if(!b)return;
  const pay=document.getElementById("pcc-py").value;
  const method=document.getElementById("pcc-me").value;
  const displaced=pclOnRange(b.ci,b.co).filter(x=>x.id!==b.id);
  const doConfirm=()=>{
    b.type="confirmed";b.pay=pay;b.method=method;b.cd=false;b.ur=false;
    if(b.guestProfileId)updateGPConfirmed(b.guestProfileId);
    sv();cAll();closePclPanel();renderCal();showDet(b);
    const prev=gCO(b.ci);if(prev)showTurn(prev,b);
  };
  if(displaced.length>0){
    showDisplaced(displaced,"Please contact these guests whose pencil bookings will be cancelled.",
      "Acknowledge and confirm","Go back",
      ()=>{displaced.forEach(d2=>{archiveBk(d2,"booking_confirmed");bk=bk.filter(x=>x.id!==d2.id);});cOv('ov-displaced');cOv('ov-pcl-conf');doConfirm();},
      ()=>{cOv('ov-displaced');});
    return;
  }
  doConfirm();
}
function cancelPcl(id){
  const b=bk.find(x=>x.id===id);if(!b)return;
  closePclPanel();
  document.getElementById("dpanel").innerHTML=`
    <div class="pn">
      <div class="pt">Cancel pencil booking?</div>
      <div class="dr"><span class="dl">Guest</span><strong>${b.name}</strong></div>
      <div class="dr"><span class="dl">Dates</span>${b.ci} → ${b.co}</div>
      <div class="acb">
        <button class="btn" onclick="showPclDet(bk.find(x=>x.id===${id}))">Keep it</button>
        <button class="btn bc" onclick="execCancelPcl(${id})">Yes, cancel</button>
      </div>
    </div>`;
}
function execCancelPcl(id){
  const b=bk.find(x=>x.id===id);if(!b)return;
  archiveBk(b,"host_cancelled");
  bk=bk.filter(x=>x.id!==id);
  sv();renderCal();
  document.getElementById("dpanel").innerHTML='<div class="ph">📅 Pencil booking cancelled.</div>';
  active=null;
}
function showDisplaced(list,msg,confirmLabel,cancelLabel,onConfirm,onCancel){
  dispOnConfirm=onConfirm;dispOnCancel=onCancel;
  document.getElementById("disp-msg").textContent=msg;
  document.getElementById("disp-list").innerHTML=list.map(b=>`
    <div style="background:#fafafa;border:1px solid #e8e8e8;border-radius:6px;padding:8px 10px;font-size:12px">
      <strong>${b.name}</strong>${b.mobile?' · '+b.mobile:''}${b.email?'<br>'+b.email:''}
    </div>`).join("");
  document.getElementById("disp-btns").innerHTML=`
    <button class="bxx" onclick="dispOnCancel&&dispOnCancel()">${cancelLabel}</button>
    <button class="bdl" onclick="dispOnConfirm&&dispOnConfirm()">${confirmLabel}</button>`;
  document.getElementById("ov-displaced").classList.add("sh");
}
function checkPencilExpiry(){
  if(_expiryChecking)return;
  _expiryChecking=true;
  try{
    const pencils=bk.filter(b=>b.type==="pencil");
    if(!pencils.length)return;
    const expiryHrs=prof.pencilExpiryHrs||24;
    const now=Date.now();
    const expired=pencils.filter(b=>{
      const ciDt=new Date(b.ci+"T"+(prof.ci||"14:00")+":00");
      const expiry=ciDt.getTime()-(expiryHrs*3600000);
      return now>expiry;
    });
    if(!expired.length)return;
    expired.forEach(b=>{archiveBk(b,"expired");});
    bk=bk.filter(b=>!(b.type==="pencil"&&expired.find(e=>e.id===b.id)));
    pclExpired=expired;
    sv();renderCal();showExpiryToast(expired);
  }finally{
    _expiryChecking=false;
  }
}
function showExpiryToast(expired){
  const msg=expired.length===1
    ?"Pencil booking expired: "+expired[0].name+", "+expired[0].ci+" → "+expired[0].co
    :expired.length+" pencil bookings expired";
  document.getElementById("toast-msg").textContent=msg;
  document.getElementById("toast-expiry").style.display="block";
}
function openExpiryDetails(){
  document.getElementById("expiry-list").innerHTML=pclExpired.map(b=>`
    <div style="background:#fafafa;border:1px solid #e8e8e8;border-radius:6px;padding:8px 10px;font-size:12px">
      <strong>${b.name}</strong> · ${b.ci} → ${b.co}
      ${b.mobile?'<br>'+b.mobile:''}${b.email?'<br>'+b.email:''}
    </div>`).join("");
  document.getElementById("ov-expiry").classList.add("sh");
}
function scheduleMidnightCheck(){
  const now=new Date();
  const midnight=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1,0,0,5);
  const ms=midnight.getTime()-now.getTime();
  expiryTimer=setTimeout(()=>{checkPencilExpiry();scheduleMidnightCheck();},ms);
}

// IMPORTANT NOTICES
function openNotices(){
  // M3: Run expiry check before building panel so just-expired pencils are already archived
  checkPencilExpiry();
  // Clean stale recontact entries (older than 7 days)
  const now=Date.now();
  const weekMs=7*24*3600*1000;
  if(prof.recontact&&prof.recontact.length){
    const before=prof.recontact.length;
    prof.recontact=prof.recontact.filter(r=>r.storedAt>now-weekMs);
    if(prof.recontact.length!==before)svP();
  }

  // Section 1 — Cleaner Reminder
  const confFuture=bk.filter(b=>isConf(b)&&b.co>=TD()).sort((a,b2)=>a.co.localeCompare(b2.co));
  const nearestCoDate=confFuture.length?confFuture[0].co:null;
  let cleanerHtml='';
  if(nearestCoDate){
    const coGuests=confFuture.filter(b=>b.co===nearestCoDate);
    const isToday=nearestCoDate===TD();
    cleanerHtml=coGuests.map(b=>{
      const rowCls=isToday?"cu":"bel-row";
      const prefix=isToday?"Today — ":"";
      return`<div class="${rowCls}" onclick="pickBk(${b.id});cOv('ov-notices')">${prefix}<strong>${b.name}</strong> checks out <strong>${b.co}</strong> at ${f12(eCo(b))||"—"}${b.cd?'<span style="color:#4A8A20;margin-left:6px">✓ Contacted</span>':'<span style="color:#E8A020;margin-left:6px">⚠ Not contacted</span>'}</div>`;
    }).join("");
  } else {
    cleanerHtml=`<div class="bel-none">No upcoming checkouts</div>`;
  }

  // Section 2 — Pencil Holds Expiring Soon (mirrors checkPencilExpiry logic — local time aware)
  const expiryHrsN=prof.pencilExpiryHrs||24;
  const in48ms=48*3600*1000;
  const nearPcl=bk.filter(b=>{
    if(b.type!=="pencil"||b.co<TD())return false;
    const ciDt=new Date(b.ci+"T"+(prof.ci||"14:00")+":00");
    const expiry=ciDt.getTime()-(expiryHrsN*3600*1000);
    return expiry-now<=in48ms;
  }).sort((a,b2)=>a.ci.localeCompare(b2.ci));
  const pclHtml=nearPcl.length
    ?nearPcl.map(b=>`<div class="bel-row" onclick="showPclDet(bk.find(x=>x.id===${b.id}));cOv('ov-notices')"><strong>${b.name}</strong> · ${b.ci} → ${b.co} · ${b.platform}</div>`).join("")
    :`<div class="bel-none">No pencil holds expiring within 48 hours.</div>`;

  // Section 3 — Recently Expired Pencil Bookings (uses archivedAt timestamp; old entries without it are excluded)
  const recentExp=bh.filter(b=>b.cancelReason==="expired"&&b.archivedAt&&b.archivedAt>now-weekMs);
  const expHtml=recentExp.length
    ?recentExp.map(b=>`<div class="bel-row" style="cursor:default"><strong>${b.name}</strong> · ${b.ci} → ${b.co}${b.mobile?'<br><span style="color:#888">'+b.mobile+'</span>':''}${b.email?'<br><span style="color:#888">'+b.email+'</span>':''}</div>`).join("")
    :`<div class="bel-none">No recent expirations</div>`;

  // Section 4 — Upcoming Confirmed Bookings (fully paid)
  const upcoming=bk.filter(b=>isConf(b)&&b.ci>=TD()&&b.pay==="full").sort((a,b2)=>a.ci.localeCompare(b2.ci));
  const upcomingHtml=upcoming.length
    ?upcoming.map(b=>`<div class="bel-row" onclick="pickBk(${b.id});cOv('ov-notices')"><strong>${b.name}</strong> · ${b.ci} · <span class="bdg ${pC(b.platform)}">${b.platform}</span></div>`).join("")
    :`<div class="bel-none">No upcoming confirmed bookings</div>`;

  // Section 5+ — Payment sections (conditional on prof.fullPay)
  let paymentSectionsHtml='';
  if(prof.fullPay===true){
    const awaitingAll=bk.filter(b=>isConf(b)&&b.pay==="none"&&b.co>=TD()).sort((a,b2)=>a.ci.localeCompare(b2.ci));
    const awaitingHtml=awaitingAll.length
      ?awaitingAll.map(b=>`<div class="bel-row" onclick="pickBk(${b.id});cOv('ov-notices')"><strong>${b.name}</strong> · ${b.ci} → ${b.co} · <span class="bdg ${pC(b.platform)}">${b.platform}</span>${b.mobile?'<span style="color:#888;margin-left:5px">'+b.mobile+'</span>':b.email?'<span style="color:#888;margin-left:5px">'+b.email+'</span>':''}</div>`).join("")
      :`<div class="bel-none">No unpaid bookings</div>`;
    paymentSectionsHtml=`<div class="bel-sec"><div class="bel-sec-hd">💸 Awaiting Payment</div>${awaitingHtml}</div>`;
  } else {
    const awaitingFull=bk.filter(b=>isConf(b)&&b.pay==="none"&&b.co>=TD()).sort((a,b2)=>a.ci.localeCompare(b2.ci));
    const awaitingFullHtml=awaitingFull.length
      ?awaitingFull.map(b=>`<div class="bel-row" onclick="pickBk(${b.id});cOv('ov-notices')"><strong>${b.name}</strong> · ${b.ci} → ${b.co} · <span class="bdg ${pC(b.platform)}">${b.platform}</span>${b.mobile?'<span style="color:#888;margin-left:5px">'+b.mobile+'</span>':b.email?'<span style="color:#888;margin-left:5px">'+b.email+'</span>':''}</div>`).join("")
      :`<div class="bel-none">No unpaid bookings</div>`;
    const awaitingPart=bk.filter(b=>isConf(b)&&b.pay==="partial"&&b.co>=TD()).sort((a,b2)=>a.ci.localeCompare(b2.ci));
    const awaitingPartHtml=awaitingPart.length
      ?awaitingPart.map(b=>`<div class="bel-row" onclick="pickBk(${b.id});cOv('ov-notices')"><strong>${b.name}</strong> · ${b.ci} → ${b.co} · <span class="bdg ${pC(b.platform)}">${b.platform}</span>${b.mobile?'<span style="color:#888;margin-left:5px">'+b.mobile+'</span>':b.email?'<span style="color:#888;margin-left:5px">'+b.email+'</span>':''}</div>`).join("")
      :`<div class="bel-none">No partial payments pending</div>`;
    paymentSectionsHtml=`
      <div class="bel-sec"><div class="bel-sec-hd">💸 Awaiting Full Payment</div>${awaitingFullHtml}</div>
      <div class="bel-sec"><div class="bel-sec-hd">💳 Partial Payment — Balance Due</div>${awaitingPartHtml}</div>`;
  }

  // Re-contact Suggestions (only if candidates exist after cleanup)
  const recontact=prof.recontact||[];
  const recontactHtml=recontact.length>0
    ?`<div class="bel-sec"><div class="bel-sec-hd">📞 Re-contact Suggestions</div>
      <div class="bel-none" style="color:#555;margin-bottom:6px">You recently had a cancellation. These guests were displaced and may be interested:</div>
      ${recontact.map(r=>`<div class="bel-row" style="cursor:default"><strong>${r.name}</strong>${r.mobile?' · '+r.mobile:''}${r.email?'<br><span style="color:#888">'+r.email+'</span>':''}</div>`).join("")}
    </div>`
    :'';

  // Guests to rate
  const toRate=bk.filter(b=>isConf(b)&&b.co<TD()&&!b.rating)
    .sort((a,b2)=>b2.co.localeCompare(a.co)).slice(0,5);
  const toRateHtml=toRate.length
    ?toRate.map(b=>{
      const d=new Date(b.co+'T00:00:00');
      const coFmt=d.toLocaleDateString('en-PH',{month:'short',day:'numeric'});
      return`<div class="bel-row" style="display:flex;justify-content:space-between;align-items:center;gap:8px">
        <div><strong>${b.name}</strong> <span style="color:#888;font-size:11px">checked out ${coFmt}</span> <span class="bdg ${pC(b.platform)}">${b.platform}</span></div>
        <button class="btn bsv" style="font-size:11px;padding:3px 10px;flex-shrink:0" onclick="cOv('ov-notices');pickBk(${b.id})">Rate now</button>
      </div>`;
    }).join('')
    :`<div class="bel-none">All caught up. No guests to rate.</div>`;

  const body=document.getElementById("notices-body");
  body.innerHTML=`
    <div class="bel-sec"><div class="bel-sec-hd">🧹 Cleaner Reminder</div>${cleanerHtml}</div>
    <div class="bel-sec"><div class="bel-sec-hd">✏️ Pencil Holds Expiring Soon</div>${pclHtml}</div>
    <div class="bel-sec"><div class="bel-sec-hd">🗂️ Recently Expired Pencil Bookings</div>${expHtml}</div>
    <div class="bel-sec"><div class="bel-sec-hd">✅ Upcoming Confirmed Bookings</div>${upcomingHtml}</div>
    ${paymentSectionsHtml}
    ${recontactHtml}
    <div class="bel-sec"><div class="bel-sec-hd">&#x2B50; Guests to Rate</div>${toRateHtml}</div>`;
  document.getElementById("ov-notices").classList.add("sh");
}

// FIRST-TIME WELCOME
function showWelcome(){
  if(prof.name||localStorage.getItem('bt_setup_done'))return;
  const ov=document.getElementById("ov-welcome");
  ov.classList.add("sh");
  requestAnimationFrame(()=>ov.classList.add("vis"));
}
function closeWelcome(){
  const ov=document.getElementById("ov-welcome");
  ov.classList.remove("vis");
  setTimeout(()=>{ov.classList.remove("sh");},350);
}
