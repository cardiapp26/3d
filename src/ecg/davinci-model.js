// Qualitative teaching relations transcribed from Bradfield et al., 2025.
// Angles and waveform heights below are illustrative, not extracted measurements.
export const DAVINCI_DOI = 'https://doi.org/10.1016/j.jaccas.2025.105998';
export const CABRERA = [
 {id:'aVL',angle:-30,color:'#c4a3ff'}, {id:'I',angle:0,color:'#7eb6ff'},
 {id:'-aVR',angle:30,color:'#57d9c5'}, {id:'II',angle:60,color:'#f4c66e'},
 {id:'aVF',angle:90,color:'#ff9c73'}, {id:'III',angle:120,color:'#f2799b'}
];
export const STANDARD = ['I','II','III','aVR','aVL','aVF'];
export const CHEST = [
 {id:'V1',plane:'superior',color:'#fb7185',position:[-.68,.65,1.8]},
 {id:'V2',plane:'superior',color:'#f6d65f',position:[-.12,.65,1.88]},
 {id:'V3',plane:'middle',color:'#67d8a4',position:[.55,.17,1.85]},
 {id:'V4',plane:'inferior',color:'#d59b72',position:[1.12,-.45,1.65]},
 {id:'V5',plane:'inferior',color:'#98b7ca',position:[1.93,-.45,.95]},
 {id:'V6',plane:'inferior',color:'#c4a3ff',position:[2.18,-.45,.0]}
];
export const SITES = {
 summit:{label:['LV summit · septal/aortik kenar','LV summit · septal/aortic margin'],position:[.02,.68,.5],figure:5,plane:'superior',axis:85,chest:[-.95,-.8,.5,.85,.95,.9],message:['V1–V2’de S baskınlığı, V3’te ani geçiş ve inferior aks. İnferoseptal çıkıntıyla aynı “bazal” etiket altında birleştirilmemeli.','S predominance in V1–V2, abrupt V3 transition and inferior axis. Do not merge this site with the inferoseptal process under one “basal” label.']},
 inferoseptal:{label:['LV inferoseptal çıkıntısı','LV inferoseptal process'],position:[-.1,-.48,-.35],figure:5,plane:'inferior',axis:-95,chest:[.65,.7,.8,.9,.95,.8],message:['Süperior aksa rağmen V1–V6 boyunca R konkordansı görülebilir. Şekil 5D’deki örnek, inferomediyal papiller kas örneğinden farklıdır.','R concordance across V1–V6 can accompany a superior axis. The Figure 5D example differs from the inferomedial papillary muscle example.']},
 superolateral:{label:['Süperolateral papiller kas','Superolateral papillary muscle'],position:[.88,.48,.05],figure:8,plane:'superior',axis:110,chest:[-.5,-.4,0,.15,.2,.12],message:['Üst düzlemdeki süperolateral papiller kas odağı: inferomediyal aks ve V3–V6’da RS örüntüsü (Şekil 8C).','Superolateral papillary focus in the superior plane: inferomedial axis and RS pattern in V3–V6 (Figure 8C).']},
 inferomedial:{label:['İnferomediyal papiller kas','Inferomedial papillary muscle'],position:[.3,-.66,-.08],figure:8,plane:'inferior',axis:-50,chest:[.2,.1,.55,.65,.75,.6],qChest:true,message:['Alt düzlemdeki inferomediyal papiller kas odağı: süperolateral aks; V3–V6’da başlangıç Q dalgası (Şekil 8C). Bu, inferoseptal çıkıntı değildir.','Inferomedial papillary focus in the inferior plane: superolateral axis; initial Q waves in V3–V6 (Figure 8C). This is not the inferoseptal process.']}
};
export const PV_SITES = {
 RSPV:{part:'rspv',position:[-.52,1,-.65],ii:1,v1:.35,avl:.25,width:1,figure:9,message:['RSPV, atriyal septuma yakın. II’deki P, RIPV’ye göre daha yüksek; V1’deki pozitif P ise daha küçük.','RSPV is close to the atrial septum. P in II is taller than RIPV, while positive P in V1 is smaller.']},
 RIPV:{part:'ripv',position:[-.6,.55,-.7],ii:.6,v1:.8,avl:.2,width:1,figure:9,message:['“İnferior” ven, toplam atriyal kitle içinde hâlâ üst konumda. Bu nedenle inferior P aksı korunabilir; V1 pozitifliği RSPV’den daha büyüktür.','The “inferior” vein remains superior within the total atrial mass. An inferior P axis can persist; positivity in V1 is greater than RSPV.']},
 LSPV:{part:'lspv',position:[.95,1,-.65],ii:.9,v1:.5,avl:.1,width:1.45,figure:9,message:['Sol venler atriyal septumdan daha uzak. Kaynaktaki sol ven pacemap’lerinde P süresi sağ venlerden daha geniş.','Left veins lie farther from the atrial septum. Left-vein pacemaps in the source have wider P waves than right-vein pacemaps.']},
 LIPV:{part:'lipv',position:[1,.55,-.7],ii:.5,v1:.5,avl:.1,width:1.45,figure:9,message:['II’deki P, LSPV’ye göre daha küçük ama pozitif kalabilir. “İnferior ven” adı tek başına negatif inferior P anlamına gelmez.','P in II is smaller than LSPV but can remain positive. The name “inferior vein” alone does not imply negative inferior P waves.']},
 RAA:{part:'ra',position:[-.8,.9,.65],ii:.5,v1:-.8,avl:.25,width:1,figure:9,message:['Sağ atriyal apendiks V1’in arkasında. Şekil 9’daki pacemap V1’de tipik negatif P gösterir.','The right atrial appendage lies behind V1. Its pacemap in Figure 9 shows a typical negative P wave in V1.']},
 LAA:{part:'la',position:[.95,.95,.3],ii:.5,v1:.5,avl:-.8,width:1.45,figure:9,message:['Sol atriyal apendiks pacemap’inde aVL’de tipik negatif P görülür. Bulguyu toplam atriyal kitleye göre yorumla.','The left atrial appendage pacemap shows a typical negative P in aVL. Interpret this within the total atrial mass.']}
};
export function limbValues(angle, mode='cabrera') {
 const leads=mode==='cabrera'?CABRERA:STANDARD.map(id=>id==='aVR'?{id,angle:-150,color:'#57d9c5'}:CABRERA.find(l=>l.id===id));
 return leads.map(l=>({...l,net:Math.cos((angle-l.angle)*Math.PI/180)}));
}
export function rvotAngle(fraction){return 75+45*Math.max(0,Math.min(1,fraction));}
export function wavePath({id,net=0,kind='qrs',width=1,q=false,invert=false}) {
 // Cabrera inversion applies to every point, not only the net amplitude.
 if(id==='aVR')return wavePath({id:'-aVR',net:-net,kind,width,q:false,invert:!invert});
 const sign=invert?-1:1,base=46,y=value=>base+(value-base)*sign;
 if(kind==='p')return `M6 ${base}H${80-25*width} Q80 ${y(base-net*58)} ${80+25*width} ${base}H154`;
 const points=kind==='st'?[[6,46],[46,46],[51,50],[59,17],[67,56],[74,base-net*12],[112,base-net*12],[125,base-8-net*12],[138,46],[154,46]]
 :kind==='rbbb'?[[6,46],[47,46],[54,35],[64,59],[80,12],[96,46],[154,46]]
 :kind==='lbbb'?[[6,46],[47,46],[57,52],[76,80],[94,76],[108,46],[154,46]]
 :q&&net<0?[[6,46],[49,46],[61,base+8+Math.abs(net)*30],[76,base-(1+net)*10],[88,46],[154,46]]
 :[[6,46],[49,46],...(q?[[54,58]]:[]),[63,base-(.5+.5*net)*37],[77,base+(.5-.5*net)*37],[88,46],[154,46]];
 return points.map(([x,v],i)=>`${i?'L':'M'}${x} ${y(v)}`).join('');
}
