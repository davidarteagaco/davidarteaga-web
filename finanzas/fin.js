/* Herramientas financieras · David Arteaga®
   Todo se calcula en el navegador. Nada de lo que se escribe sale del equipo. */
(()=>{
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const NBSP=' ';
const parse=(v,t)=>{v=String(v??'').trim();if(t==='text')return v;
  if(t==='money'||t==='int'){const n=+v.replace(/[^\d-]/g,'');return isFinite(n)?n:0}
  v=v.replace(/\s|%/g,'');if(v.includes(','))v=v.replace(/\./g,'').replace(',','.');const n=parseFloat(v);return isFinite(n)?n:0};
const loc=(n,d=0)=>(+n).toLocaleString('es-CO',{minimumFractionDigits:d,maximumFractionDigits:d});
const money=n=>(n<0?'−':'')+'$'+loc(Math.abs(Math.round(n)));
const num=(n,d=2)=>loc(n,d);
const pct=(n,d=1)=>(isFinite(n)?loc(n,d):'—')+'%';
const sgn=(n,d=1)=>n===null||!isFinite(n)?'—':(n>0?'+':n<0?'−':'')+loc(Math.abs(n),d)+'%';
const vr=(i,f)=>i?(f-i)/i*100:null;
const tone=(v,nat)=>v===null||Math.abs(v)<.05?'':(v*nat>0?'good':'bad');
const show=(v,t)=>t==='money'?money(v):t==='int'?loc(v):t==='text'?v:loc(v,v%1?2:0);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const VAR=(c,nat)=>`Var% = (${c}f − ${c}i) / ${c}i × 100 · Naturaleza: ${nat>0?'aumentar':'disminuir'}`;
const monthly=(r,t)=>{r/=100;switch(t){
  case 'EA':return Math.pow(1+r,1/12)-1;case 'NAMV':return r/12;case 'PMV':return r;
  case 'NATV':return Math.pow(1+r/4,1/3)-1;case 'NASV':return Math.pow(1+r/2,1/6)-1;
  case 'NAMA':{const a=r/12;return a/(1-a)}case 'PTV':return Math.pow(1+r,1/3)-1;case 'PSV':return Math.pow(1+r,1/6)-1}return 0};
const annuity=(P,i,n)=>i?P*i/(1-Math.pow(1+i,-n)):P/n;
const pv=(c,i,n)=>i?c*(1-Math.pow(1+i,-n))/i:c*n;
const RATE_TYPES=[['EA','Efectiva anual (EA)'],['NAMV','Nominal anual mes vencido (NAMV)'],['PMV','Periódica mensual vencida'],['NATV','Nominal anual trimestre vencido'],['NASV','Nominal anual semestre vencido'],['NAMA','Nominal anual mes anticipado'],['PTV','Periódica trimestral vencida'],['PSV','Periódica semestral vencida']];

/* ---------------- Definición de las aplicaciones ---------------- */
const A={};

A['ventas']={formula:'V = Σ ventas registradas del mes<br>Var% = (Vf − Vi) / Vi × 100<br>V real de salida = Vf / (1 + inflación acumulada entre ambos meses)<br>CV = Ventas / Proyección de ventas × 100',
 blocks:[{type:'pair',items:[{id:'v',label:'Ventas del mes ($)',t:'money',v:[58000000,66500000]},{id:'p',label:'Proyección de ventas del mes ($)',t:'money',v:[60000000,70000000]}]},
  {type:'fields',title:'Ajuste por inflación',items:[{id:'inf',label:'Inflación acumulada entre los dos meses (%)',t:'dec',v:'0,9',hint:'Variación del IPC publicada por el DANE. Escribe 0 si no aplica.'}]}],
 notes:['Línea base: último mes completo antes de iniciar. Salida: último mes completo antes de cerrar.','No se permiten promedios ni línea base en cero.','Si se usan períodos de excepción, la ficha pide deflactar las ventas.','Ventas en divisas se convierten a pesos con la tasa del día del pago.'],
 compute(g){const vi=g('v_b'),vf=g('v_f'),pi=g('p_b'),pf=g('p_f'),inf=g('inf'),real=vf/(1+inf/100),v=vr(vi,vf),vre=vr(vi,real),cvi=pi?vi/pi*100:0,cvf=pf?vf/pf*100:0;
  return {kpis:[['Variación de ventas',sgn(v),tone(v,1),1],['Variación real (sin inflación)',sgn(vre),tone(vre,1)],['Ventas de salida en pesos de la base',money(real)],['Cumplimiento base',pct(cvi),cvi>=100?'good':''],['Cumplimiento salida',pct(cvf),cvf>=100?'good':cvf>=90?'warn':'bad']],
   bars:[['Base',vi,money(vi)],['Salida',vf,money(vf)],['Salida real',real,money(real),1]],
   read:v===null?'Escribe las ventas de la línea base.':`Las ventas ${v>=0?'crecieron':'cayeron'} <b>${pct(Math.abs(v))}</b>. Descontando la inflación, el crecimiento real es <b>${sgn(vre)}</b>.${pf&&vf<pf?` Para cumplir la meta de salida faltaron <b>${money(pf-vf)}</b>.`:pf?' La meta de salida se cumplió.':''}`,
   tech:VAR('V',1)}}};

A['clientes-rentables']={formula:'CR = Número de clientes rentables / Total de clientes del período × 100<br>Margen del cliente = (Ventas − Costos directos) / Ventas × 100',
 blocks:[{type:'fields',items:[{id:'crit',label:'Criterio: margen mínimo para considerar rentable (%)',t:'dec',v:'25',hint:'La ficha exige especificar el criterio.'},{id:'crb',label:'CR de la línea base (%) · opcional',t:'dec',v:'',hint:'Si lo escribes, calculo la variación.'}]},
  {type:'table',id:'cl',title:'Clientes del período',add:'Agregar cliente',max:60,cols:[{id:'n',label:'Cliente',t:'text'},{id:'v',label:'Ventas ($)',t:'money'},{id:'c',label:'Costos directos ($)',t:'money'}],
   rows:[['Cliente A',18500000,12100000],['Cliente B',9200000,7900000],['Cliente C',7400000,4800000],['Cliente D',5100000,4600000],['Cliente E',3900000,2500000],['Cliente F',2600000,2350000],['Cliente G',1800000,1150000],['Cliente H',950000,880000]]}],
 notes:['Cuenta como cliente a quien compró en el período.','Costos directos: costo del producto o servicio vendido a ese cliente, descuentos, fletes y comisiones atribuibles.','Usa el mismo criterio de rentabilidad en la base y en la salida.'],
 compute(g,T){const crit=g('crit'),rows=T('cl').filter(r=>r.v>0).map(r=>({...r,u:r.v-r.c,m:(r.v-r.c)/r.v*100})),n=rows.length,rent=rows.filter(r=>r.m>=crit),cr=n?rent.length/n*100:0,
  tv=rows.reduce((a,r)=>a+r.v,0),tu=rows.reduce((a,r)=>a+r.u,0),vr_=rent.reduce((a,r)=>a+r.v,0),sorted=[...rows].sort((a,b)=>b.u-a.u),top=Math.max(1,Math.ceil(n*.2)),tuTop=sorted.slice(0,top).reduce((a,r)=>a+r.u,0),crb=g('crb'),v=crb?vr(crb,cr):null;
  return {kpis:[['Clientes rentables (CR)',pct(cr),'',1],['Rentables / total',`${rent.length} de ${n}`],['Ventas de clientes rentables',tv?pct(vr_/tv*100):'—'],['Margen total',tv?pct(tu/tv*100):'—'],[`Utilidad del ${top===1?'mejor cliente':`mejor ${loc(top/n*100)}%`}`,tu>0?pct(tuTop/tu*100):'—'],...(v!==null?[['Variación frente a la base',sgn(v),tone(v,1)]]:[])],
   bars:sorted.map(r=>[r.n,Math.max(r.m,0),pct(r.m),r.m<crit]),barMax:100,
   read:n?`<b>${rent.length} de ${n}</b> clientes superan el margen mínimo de ${pct(crit,0)}. ${tu>0?`El ${pct(top/n*100,0)} de tus clientes genera el <b>${pct(tuTop/tu*100,0)}</b> de la utilidad bruta: ahí conviene concentrar atención y servicio.`:''}`:'Agrega clientes con sus ventas.',
   tech:'Barras oscuras: clientes por debajo del criterio.'+(v!==null?' · '+VAR('CR',1):'')}}};

A['tasa-conversion-clientes']={formula:'TCC = Clientes o conversiones / Total de prospectos o cotizaciones × 100',
 blocks:[{type:'seg',id:'base',label:'Base de medición',opts:[['p','Sobre prospectos'],['c','Sobre cotizaciones']],v:'p'},
  {type:'pair',items:[{id:'k',label:'Clientes o conversiones',t:'int',v:[27,36]},{id:'d',label:'Prospectos o cotizaciones',t:'int',v:[400,410]}]},
  {type:'table',id:'f',title:'Conversión por fuente (opcional)',add:'Agregar fuente',max:12,cols:[{id:'n',label:'Fuente',t:'text'},{id:'d',label:'Prospectos',t:'int'},{id:'k',label:'Clientes',t:'int'}],
   rows:[['Referidos',60,14],['Redes sociales',180,9],['Visitas comerciales',90,8],['Página web',80,5]]}],
 notes:['Elige una base, prospectos o cotizaciones, y mantenla igual al inicio y al cierre.','Un prospecto es un contacto calificado, no cualquier mensaje recibido.'],
 compute(g,T,S){const lab=S('base')==='c'?'cotizaciones':'prospectos',ti=g('d_b')?g('k_b')/g('d_b')*100:0,tf=g('d_f')?g('k_f')/g('d_f')*100:0,v=vr(ti,tf),
  fs=T('f').filter(r=>r.d>0).map(r=>({...r,t:r.k/r.d*100})).sort((a,b)=>b.t-a.t);
  return {kpis:[['Variación de la TCC',sgn(v),tone(v,1),1],['TCC base',pct(ti)],['TCC salida',pct(tf)],['Clientes por cada 10 '+lab,num(tf/10,1)]],
   bars:fs.length?fs.map(r=>[r.n,r.t,pct(r.t)]):[['Base',ti,pct(ti)],['Salida',tf,pct(tf)]],
   read:fs.length>1?`La TCC pasó de <b>${pct(ti)}</b> a <b>${pct(tf)}</b> sobre ${lab}. Tu mejor fuente es <b>${esc(fs[0].n)}</b> (${pct(fs[0].t)}) y la más débil <b>${esc(fs[fs.length-1].n)}</b> (${pct(fs[fs.length-1].t)}): antes de buscar más prospectos, mira de dónde vienen.`:`La TCC pasó de <b>${pct(ti)}</b> a <b>${pct(tf)}</b> sobre ${lab}.`,
   tech:VAR('TCC',1)}}};

A['valor-vitalicio-cliente']={formula:'Margen anual por cliente = Ticket promedio × Compras al año × Margen bruto<br>VVC = Margen anual traído a valor presente durante los años de relación<br>CAC = Inversión comercial del período / Clientes nuevos del período',
 blocks:[{type:'fields',title:'Lo que deja un cliente',items:[{id:'tk',label:'Ticket promedio por compra ($)',t:'money',v:180000},{id:'fr',label:'Compras por año',t:'dec',v:'6'},{id:'mg',label:'Margen bruto (%)',t:'dec',v:'35'},{id:'yr',label:'Años promedio de relación',t:'dec',v:'3'},{id:'dr',label:'Tasa de descuento anual (%)',t:'dec',v:'12',hint:'Tu costo de oportunidad. 0 para no descontar.'}]},
  {type:'fields',title:'Lo que cuesta conseguirlo',items:[{id:'inv',label:'Inversión en marketing y ventas del período ($)',t:'money',v:12000000},{id:'nw',label:'Clientes nuevos en el período',t:'int',v:40}]}],
 notes:['No es un indicador fijo del programa: sirve para decidir cuánto invertir en conseguir y retener clientes.','Usa datos del mismo segmento: el VVC de un mayorista no se compara con el CAC de un minorista.'],
 compute(g){const ma=g('tk')*g('fr')*g('mg')/100,y=g('yr'),d=g('dr')/100,vvc=d?ma*(1-Math.pow(1+d,-y))/d:ma*y,cac=g('nw')?g('inv')/g('nw'):0,ratio=cac?vvc/cac:0,pay=ma?cac/(ma/12):0;
  return {kpis:[['Valor vitalicio (VVC)',money(vvc),'',1],['Costo de adquisición (CAC)',money(cac)],['Relación VVC / CAC',ratio?num(ratio,1)+' veces':'—',ratio>=3?'good':ratio>=1?'warn':ratio?'bad':''],['Meses para recuperar el CAC',pay?num(pay,1):'—'],['Margen anual por cliente',money(ma)]],
   bars:[['VVC',vvc,money(vvc)],['CAC',cac,money(cac),1]],
   read:!cac?'Escribe la inversión y los clientes nuevos.':ratio>=3?`Cada cliente devuelve <b>${num(ratio,1)} veces</b> lo que cuesta conseguirlo. Hay espacio para invertir más en adquisición.`:ratio>=1?`Recuperas lo invertido, pero con poco margen: <b>${num(ratio,1)} veces</b>. Antes de gastar más en atraer, trabaja retención y frecuencia.`:'Hoy cuesta más conseguir un cliente de lo que deja. Revisa canales de adquisición y precio.',
   tech:'Referencia orientativa: una relación de 3 veces o más suele considerarse sana; ajústala a tu sector.'}}};

A['clientes-activos']={formula:'CA = Σ clientes que compraron una o más veces en el período<br>Var% = (CAf − CAi) / CAi × 100',
 blocks:[{type:'table',id:'t',title:'Clientes activos por tipo',add:'Agregar tipo',max:12,cols:[{id:'n',label:'Tipo de cliente',t:'text'},{id:'b',label:'Base',t:'int'},{id:'f',label:'Salida',t:'int'}],
  rows:[['Empresas',25,31],['Mayoristas',18,22],['Minoristas',140,151],['Personas naturales',60,58]]}],
 notes:['Activo es quien compró en el período, no un prospecto ni un cliente registrado sin compras.','Cuenta cada cliente una sola vez aunque haya comprado varias veces.'],
 compute(g,T){const r=T('t'),b=r.reduce((a,x)=>a+x.b,0),f=r.reduce((a,x)=>a+x.f,0),v=vr(b,f),ch=r.map(x=>({...x,v:vr(x.b,x.f)})).filter(x=>x.v!==null).sort((a,c)=>c.v-a.v);
  return {kpis:[['Variación de clientes activos',sgn(v),tone(v,1),1],['Base',loc(b)],['Salida',loc(f)],['Clientes netos ganados',(f-b>=0?'+':'−')+loc(Math.abs(f-b))]],
   bars:r.map(x=>[x.n,x.f,`${loc(x.b)} → ${loc(x.f)}`]),
   read:ch.length?`El segmento que más crece es <b>${esc(ch[0].n)}</b> (${sgn(ch[0].v)})${ch[ch.length-1].v<0?` y el que se está yendo es <b>${esc(ch[ch.length-1].n)}</b> (${sgn(ch[ch.length-1].v)}): llama a esos clientes antes de buscar nuevos`:''}.`:'Escribe tus clientes por tipo.',
   tech:VAR('CA',1)}}};

A['cumplimiento-ventas']={formula:'CV = Valor de ventas / Proyección de ventas × 100',
 blocks:[{type:'table',id:'t',title:'Metas y ventas del período',add:'Agregar vendedor o canal',max:30,cols:[{id:'n',label:'Vendedor o canal',t:'text'},{id:'m',label:'Meta ($)',t:'money'},{id:'v',label:'Venta ($)',t:'money'}],
  rows:[['Tienda',25000000,26800000],['Vendedor externo 1',15000000,12300000],['Vendedor externo 2',15000000,15900000],['Canal digital',8000000,5200000]]},
  {type:'fields',items:[{id:'cvb',label:'CV de la línea base (%) · opcional',t:'dec',v:''}]}],
 notes:['La meta debe existir antes del período, no ajustarse al final.','Si la meta es irreal, el indicador pierde sentido: proyecta con historia, temporada y capacidad.'],
 compute(g,T){const r=T('t').filter(x=>x.m>0).map(x=>({...x,c:x.v/x.m*100})),m=r.reduce((a,x)=>a+x.m,0),v=r.reduce((a,x)=>a+x.v,0),cv=m?v/m*100:0,cvb=g('cvb'),vv=cvb?vr(cvb,cv):null,low=r.filter(x=>x.c<90);
  return {kpis:[['Cumplimiento total',pct(cv),cv>=100?'good':cv>=90?'warn':'bad',1],['Ventas',money(v)],['Meta',money(m)],[v>=m?'Por encima de la meta':'Faltante',money(Math.abs(m-v)),v>=m?'good':'bad'],...(vv!==null?[['Variación frente a la base',sgn(vv),tone(vv,1)]]:[])],
   bars:r.map(x=>[x.n,Math.min(x.c,150),pct(x.c),x.c<90]),barMax:150,
   read:r.length?(low.length?`${low.length===1?'Un frente está':`${low.length} frentes están`} por debajo del 90%: <b>${low.map(x=>esc(x.n)).join(', ')}</b>. Revisa ahí embudo, cartera de prospectos y acompañamiento.`:'Todos los frentes superan el 90% de su meta.'):'Agrega metas y ventas.',
   tech:'Barras oscuras: por debajo del 90%.'+(vv!==null?' · '+VAR('CV',1):'')}}};

A['tasa-abandono-compra']={formula:'TAC = Clientes que abandonaron la compra / Clientes que iniciaron el proceso de compra × 100',
 blocks:[{type:'pair',items:[{id:'s',label:'Iniciaron el proceso de compra',t:'int',v:[520,540]},{id:'a',label:'Abandonaron la compra',t:'int',v:[364,318]}]},
  {type:'fields',title:'Lo que se queda sobre la mesa',items:[{id:'tk',label:'Valor promedio del carrito o cotización ($)',t:'money',v:145000},{id:'rc',label:'Porcentaje que esperas recuperar con seguimiento (%)',t:'dec',v:'10'}]}],
 notes:['Aplica a tiendas en línea y también a cotizaciones que no se cierran.','Mide en el mismo canal y período en la base y en la salida.'],
 compute(g){const ti=g('s_b')?g('a_b')/g('s_b')*100:0,tf=g('s_f')?g('a_f')/g('s_f')*100:0,v=vr(ti,tf),lost=g('a_f')*g('tk'),rec=lost*g('rc')/100;
  return {kpis:[['Variación de la TAC',sgn(v),tone(v,-1),1],['TAC base',pct(ti)],['TAC salida',pct(tf)],['Ventas no concretadas en salida',money(lost)],['Recuperable con seguimiento',money(rec),'good']],
   bars:[['Base',ti,pct(ti)],['Salida',tf,pct(tf)]],barMax:100,
   read:`De cada 10 clientes que empiezan a comprar, <b>${num(tf/10,1)}</b> se van sin hacerlo. Recuperar el ${pct(g('rc'),0)} con un mensaje o una llamada a tiempo son <b>${money(rec)}</b> al mes.`,
   tech:VAR('TAC',-1)}}};

A['ticket-promedio-compra']={formula:'TPC = Total de ventas del período / Número de clientes atendidos en el período',
 blocks:[{type:'pair',items:[{id:'v',label:'Ventas del mes ($)',t:'money',v:[62400000,68900000]},{id:'c',label:'Clientes atendidos',t:'int',v:[410,428]}]},
  {type:'fields',title:'Simulación',items:[{id:'up',label:'Aumento del ticket que buscas (%)',t:'dec',v:'8',hint:'Con venta cruzada, combos o mejor portafolio.'}]}],
 notes:['Cuenta clientes, no facturas. Si solo tienes facturas, la ficha recomienda proponer otro indicador.','Con un solo cliente el TPC no aporta: es igual a las ventas.','Separa el efecto precio: si subiste precios, explica cuánto del aumento viene de ahí.'],
 compute(g){const ti=g('c_b')?g('v_b')/g('c_b'):0,tf=g('c_f')?g('v_f')/g('c_f'):0,v=vr(ti,tf),extra=tf*g('up')/100*g('c_f'),one=g('c_b')===1||g('c_f')===1;
  return {kpis:[['Variación del TPC',sgn(v),tone(v,1),1],['TPC base',money(ti)],['TPC salida',money(tf)],['Ventas extra al mes con la simulación',money(extra),'good'],['Al año',money(extra*12),'good']],
   bars:[['Base',ti,money(ti)],['Salida',tf,money(tf)],['Simulado',tf*(1+g('up')/100),money(tf*(1+g('up')/100)),1]],
   read:one?'<span class="warn">Con un solo cliente este indicador no aporta.</span>':`Cada cliente compró en promedio <b>${money(tf)}</b>. Si logras que gaste un ${pct(g('up'),0)} más con los mismos clientes, vendes <b>${money(extra)}</b> más al mes sin conseguir uno nuevo.`,
   tech:VAR('TPC',1)}}};

A['productividad-laboral-pl']={formula:'PL = No. productos, servicios o actividades / No. trabajadores<br>Var% = (PLf − PLi) / PLi × 100',
 blocks:[{type:'fields',items:[{id:'u',label:'Unidad que se mide',t:'text',v:'servicios prestados',hint:'La misma en la base y en la salida.'},{id:'per',label:'Período de medición',t:'text',v:'un mes'}]},
  {type:'pair',items:[{id:'q',label:'Productos, servicios o actividades',t:'int',v:[2150,2480]},{id:'w',label:'Trabajadores medidos',t:'int',v:[14,14]}]}],
 notes:['Mide los cargos priorizados, en lo posible de procesos misionales.','No se admite línea base en cero.','Si entra o sale personal, documenta ingresos, retiros e inducciones y explica la variación.','No mezcles unidades distintas sin un factor de equivalencia.'],
 compute(g){const a=g('w_b')?g('q_b')/g('w_b'):0,b=g('w_f')?g('q_f')/g('w_f'):0,v=vr(a,b),u=esc(g('u')||'unidades');
  return {kpis:[['Variación de la productividad',sgn(v),tone(v,1),1],['PL base',num(a)],['PL salida',num(b)],['Producción adicional equivalente',loc(Math.max(0,(b-a)*g('w_f')))+' '+u]],
   bars:[['Base',a,num(a)],['Salida',b,num(b)]],
   read:v===null?'Escribe la producción y los trabajadores de la base.':`Cada trabajador pasó de <b>${num(a)}</b> a <b>${num(b)}</b> ${u} en ${esc(g('per')||'el período')}.${g('w_b')!==g('w_f')?' <span class="warn">Cambió el número de trabajadores: documenta por qué para que la comparación sea válida.</span>':''}`,
   tech:VAR('PL',1)}}};

A['panac']={formula:'PANAC = Σ (Actividades no asociadas al cargo / Total de actividades del cargo) × Ponderación del cargo<br>Ponderación = Actividades del cargo / Actividades de todos los cargos analizados',
 blocks:[{type:'seg',id:'w',label:'Ponderación',opts:[['act','Por actividades de cada medición'],['eq','Igual para todos los cargos']],v:'act'},
  {type:'table',id:'t',title:'Mapeo de actividades del último mes',add:'Agregar cargo',max:20,cols:[{id:'n',label:'Cargo',t:'text'},{id:'tb',label:'Actividades base',t:'int'},{id:'ab',label:'No asociadas base',t:'int'},{id:'tf',label:'Actividades salida',t:'int'},{id:'af',label:'No asociadas salida',t:'int'}],
  rows:[['Asesor comercial',60,9,58,4],['Auxiliar de bodega',50,8,50,3],['Cajero',40,5,42,3],['Coordinador',60,7,55,4],['Auxiliar administrativo',40,6,40,2],['Conductor',50,9,48,5]]}],
 notes:['Si la intervención elimina o reasigna actividades, la ficha pide recalcular la ponderación en ambas mediciones.','Las actividades salen de entrevistas y del mapeo del último mes de cada cargo.','No se admite línea base en cero.'],
 compute(g,T,S){const r=T('t').filter(x=>x.tb>0&&x.tf>0),eq=S('w')==='eq',sb=r.reduce((a,x)=>a+x.tb,0),sf=r.reduce((a,x)=>a+x.tf,0),
  rows=r.map(x=>({...x,pb:x.ab/x.tb,pf:x.af/x.tf,wb:eq?1/r.length:x.tb/sb,wf:eq?1/r.length:x.tf/sf})),pi=rows.reduce((a,x)=>a+x.pb*x.wb,0)*100,pf=rows.reduce((a,x)=>a+x.pf*x.wf,0)*100,v=vr(pi,pf);
  return {kpis:[['Variación del PANAC',sgn(v),tone(v,-1),1],['PANAC base',pct(pi,2)],['PANAC salida',pct(pf,2)],['Cargos analizados',loc(rows.length)]],
   bars:rows.map(x=>[x.n,x.pf*100,`${pct(x.pb*100)} → ${pct(x.pf*100)}`]),barMax:Math.max(...rows.map(x=>x.pb*100),1),
   table:{head:['Cargo','Pond. base','Pond. salida','Proporción base','Proporción salida'],num:[1,2,3,4],rows:rows.map(x=>[esc(x.n),pct(x.wb*100),pct(x.wf*100),pct(x.pb*100),pct(x.pf*100)])},
   read:`El ${pct(pf,1)} del trabajo de los cargos analizados todavía corresponde a actividades que no son de su cargo.`,
   tech:VAR('PANAC',-1)}}};

A['canac-costo-actividades']={formula:'CANAC = Σ Salarioᵢ × Tasa ANACᵢ<br>Tasa ANAC = Horas en actividades no asociadas al cargo en el mes / Horas trabajadas en el mes<br>TEANAC = Σ minutos en actividades no asociadas al cargo',
 blocks:[{type:'table',id:'t',title:'Trabajadores o cargos analizados',add:'Agregar trabajador',max:40,cols:[{id:'n',label:'Cargo',t:'text'},{id:'s',label:'Salario ($)',t:'money'},{id:'h',label:'Horas mes',t:'int'},{id:'b',label:'Horas ANAC base',t:'int'},{id:'f',label:'Horas ANAC salida',t:'int'}],
  rows:[['Asesor comercial',2200000,192,28,16],['Asesor comercial',2200000,192,24,14],['Auxiliar administrativo',1750000,192,34,18],['Coordinador de operaciones',3400000,192,22,12]]}],
 notes:['Una fila por trabajador: la fórmula suma sobre todos los trabajadores analizados.','La ficha prioriza CANAC entre los indicadores fijos porque muestra el resultado en pesos.','Las horas salen de entrevistas y del registro de actividades del último mes. No se admite línea base en cero.'],
 compute(g,T){const r=T('t').filter(x=>x.h>0).map(x=>({...x,tb:x.b/x.h,tf:x.f/x.h})),ci=r.reduce((a,x)=>a+x.s*x.tb,0),cf=r.reduce((a,x)=>a+x.s*x.tf,0),v=vr(ci,cf),mi=r.reduce((a,x)=>a+x.b,0)*60,mf=r.reduce((a,x)=>a+x.f,0)*60;
  return {kpis:[['Variación del CANAC',sgn(v),tone(v,-1),1],['CANAC base',money(ci)],['CANAC salida',money(cf)],['Ahorro al año',money(Math.max(0,(ci-cf)*12)),'good'],['TEANAC base',loc(mi)+' min'],['TEANAC salida',loc(mf)+' min']],
   bars:[['Base',ci,money(ci)],['Salida',cf,money(cf)]],
   table:{head:['Cargo','Tasa base','Tasa salida','Costo base','Costo salida'],num:[1,2,3,4],rows:r.map(x=>[esc(x.n),pct(x.tb*100),pct(x.tf*100),money(x.s*x.tb),money(x.s*x.tf)])},
   read:`Cada mes la empresa paga <b>${money(cf)}</b> en salarios por trabajo que no corresponde a los cargos analizados${ci>cf?`, frente a ${money(ci)} en la base`:''}.`,
   tech:VAR('CANAC',-1)+' · '+VAR('TEANAC',-1)}}};

A['conversor-tasas']={formula:'EA = (1 + i periódica)<sup>n</sup> − 1 · i periódica = (1 + EA)<sup>1/n</sup> − 1<br>Nominal = i periódica × n · i vencida = i anticipada / (1 − i anticipada)',
 blocks:[{type:'fields',items:[{id:'r',label:'Tasa (%)',t:'dec',v:'24'},{id:'tp',label:'Tipo de tasa',t:'select',opts:RATE_TYPES,v:'EA'},{id:'us',label:'Tasa de usura vigente EA (%) · opcional',t:'dec',v:'',hint:'Cambia cada mes. Consúltala en la Superintendencia Financiera.'}]}],
 notes:['Las tasas que publican los bancos cambian: escribe siempre la de tu oferta.','Para comparar créditos usa la EA, que incluye la capitalización.'],
 compute(g,T,S){const im=monthly(g('r'),g('tp')),ea=Math.pow(1+im,12)-1,P=k=>Math.pow(1+ea,1/k)-1,us=g('us');
  const rows=[['Efectiva anual (EA)',ea],['Periódica mensual vencida',P(12)],['Nominal anual mes vencido',P(12)*12],['Periódica trimestral vencida',P(4)],['Nominal anual trimestre vencido',P(4)*4],['Periódica semestral vencida',P(2)],['Nominal anual semestre vencido',P(2)*2],['Periódica mensual anticipada',P(12)/(1+P(12))],['Nominal anual mes anticipado',P(12)/(1+P(12))*12],['Diaria (365 días)',P(365)]];
  return {kpis:[['Efectiva anual',pct(ea*100,2),'',1],['Mensual vencida',pct(P(12)*100,4)],['Nominal mes vencido',pct(P(12)*1200,2)],...(us?[['Frente a la usura',ea*100>us?'La supera':'Por debajo',ea*100>us?'bad':'good']]:[])],
   table:{head:['Tasa equivalente','Valor'],num:[1],rows:rows.map(([n,v])=>[n,pct(v*100,4)])},
   read:(g('tp')==='EA'?`Una tasa de <b>${pct(ea*100,2)} efectiva anual</b> equivale a <b>${pct(P(12)*100,4)}</b> cada mes vencido.`:`Una tasa de ${pct(g('r'),2)} ${esc(RATE_TYPES.find(x=>x[0]===g('tp'))[1].replace(/ \(.*\)/,'').toLowerCase())} equivale a <b>${pct(ea*100,2)} efectiva anual</b>.`)+`${us?(ea*100>us?' <span class="bad">Supera la tasa de usura que escribiste.</span>':''):''}`}}};

A['tabla-amortizacion']={formula:'Cuota fija (sistema francés) = P × i / (1 − (1 + i)<sup>−n</sup>)<br>Abono constante: capital = P / n, interés = saldo × i<br>UVR: cuota fija en UVR × valor UVR de cada mes',
 blocks:[{type:'fields',title:'Crédito',items:[{id:'P',label:'Monto del crédito ($)',t:'money',v:50000000},{id:'n',label:'Plazo (meses)',t:'int',v:60},{id:'r',label:'Tasa (%)',t:'dec',v:'18',hint:'En UVR, la tasa que se suma a la UVR.'},{id:'tp',label:'Tipo de tasa',t:'select',opts:RATE_TYPES.slice(0,3),v:'EA'},{id:'sis',label:'Sistema',t:'select',opts:[['fr','Cuota fija (francés)'],['ac','Abono constante a capital'],['uvr','Cuota constante en UVR']],v:'fr'}]},
  {type:'fields',title:'Costos adicionales',items:[{id:'seg',label:'Seguro de vida (% mensual sobre el saldo)',t:'dec',v:'0,05',hint:'Pregunta el valor exacto a tu entidad.'},{id:'fx',label:'Otros cargos fijos mensuales ($)',t:'money',v:0},{id:'ini',label:'Gastos iniciales ($)',t:'money',v:0,hint:'Estudio, avalúo, comisión.'}]},
  {type:'fields',title:'Solo para UVR',when:['sis','uvr'],items:[{id:'uvr',label:'Valor de la UVR hoy ($)',t:'dec',v:'400',hint:'Ejemplo. Consulta el valor del día en el Banco de la República.'},{id:'inf',label:'Inflación anual esperada (%)',t:'dec',v:'5'}]}],
 notes:['Las tasas, seguros y cargos cambian según la entidad y el momento: escribe los de tu oferta.','Resultado de referencia: el plan de pagos oficial es el que entrega la entidad.'],
 compute(g){const P=g('P'),n=Math.max(1,Math.min(600,Math.round(g('n')))),i=monthly(g('r'),g('tp')),seg=g('seg')/100,fx=g('fx'),sis=g('sis');
  const rows=[];let s=P,TI=0,TS=0,TP=0;
  if(sis==='uvr'){const u0=g('uvr')||1,inf=g('inf')/100;let su=P/u0;const cu=annuity(su,i,n);
    for(let k=1;k<=n;k++){const u=u0*Math.pow(1+inf,k/12),it=su*i,cap=cu-it,sp=su*u,sg=sp*seg,tot=cu*u+sg+fx;su-=cap;rows.push([k,sp,it*u,cap*u,sg,tot,Math.max(0,su*u)]);TI+=it*u;TS+=sg;TP+=tot}}
  else{const c=annuity(P,i,n);for(let k=1;k<=n;k++){const it=s*i,cap=sis==='fr'?c-it:P/n,sg=s*seg,tot=cap+it+sg+fx;rows.push([k,s,it,cap,sg,tot,Math.max(0,s-cap)]);s-=cap;TI+=it;TS+=sg;TP+=tot}}
  const first=rows[0][5],last=rows[rows.length-1][5],cost=TP+g('ini')-P;
  return {kpis:[['Primera cuota',money(first),'',1],['Última cuota',money(last)],['Total intereses',money(TI)],['Total seguros y cargos',money(TS+fx*n)],['Total pagado',money(TP+g('ini'))],['Costo del crédito',money(cost),'bad']],
   bars:[['Capital',P,money(P)],['Intereses',TI,money(TI),1],['Seguros y otros',TS+fx*n+g('ini'),money(TS+fx*n+g('ini')),1]],
   table:{head:['Mes','Saldo inicial','Interés','Capital','Seguro','Cuota total','Saldo final'],num:[0,1,2,3,4,5,6],rows:rows.map(r=>[r[0],...r.slice(1).map(money)])},
   csv:[['Mes','Saldo inicial','Interes','Capital','Seguro','Cuota total','Saldo final'],...rows.map(r=>r.map((x,j)=>j?Math.round(x):x))],
   read:`Por cada peso prestado pagas <b>${num((TP+g('ini'))/P,2)} pesos</b>. Tasa mensual equivalente: ${pct(i*100,3)}.${sis==='uvr'?' <span class="warn">En UVR la cuota y el saldo en pesos suben con la inflación.</span>':''}`}}};

const CATS=[['Vivienda (arriendo o cuota)','n',1600000],['Alimentación','n',1100000],['Transporte','n',450000],['Servicios públicos e internet','n',380000],['Salud','n',200000],['Educación','n',500000],['Deudas y créditos','d',700000],['Seguros','n',150000],['Entretenimiento','w',300000],['Ropa y cuidado personal','w',250000],['Ahorro e inversión','s',650000],['Otros','w',120000]];
A['presupuesto']={formula:'Saldo = Ingresos − Gastos − Ahorro<br>Referencia 50/30/20: necesidades, gustos y ahorro sobre el ingreso',
 blocks:[{type:'fields',items:[{id:'in',label:'Ingresos netos del mes ($)',t:'money',v:6500000},{id:'lim',label:'Límite de endeudamiento de referencia (%)',t:'dec',v:'30',hint:'Cuotas de deuda sobre ingreso. Ajústalo a tu caso.'}]},
  {type:'table',id:'c',title:'Doce categorías',fixed:1,cols:[{id:'n',label:'Categoría',t:'text',ro:1},{id:'v',label:'Valor mensual ($)',t:'money'}],rows:CATS.map(c=>[c[0],c[2]])}],
 notes:['La regla 50/30/20 es una referencia, no una norma: úsala para conversar con tus números.','Registra lo que de verdad gastas durante un mes antes de ajustar el presupuesto.'],
 compute(g,T){const inc=g('in'),r=T('c').map((x,k)=>({...x,k:CATS[k][1]})),tot=r.reduce((a,x)=>a+x.v,0),sum=k=>r.filter(x=>x.k===k||(k==='n'&&x.k==='d')).reduce((a,x)=>a+x.v,0),
  nec=sum('n'),des=sum('w'),aho=sum('s'),deu=r.filter(x=>x.k==='d').reduce((a,x)=>a+x.v,0),sal=inc-tot,p=x=>inc?x/inc*100:0,lim=g('lim');
  return {kpis:[[sal>=0?'Te queda libre':'Te falta',money(Math.abs(sal)),sal>=0?'good':'bad',1],['Necesidades',pct(p(nec)),p(nec)>50?'warn':''],['Gustos',pct(p(des)),p(des)>30?'warn':''],['Ahorro',pct(p(aho)),p(aho)>=20?'good':p(aho)>=10?'warn':'bad'],['Deudas / ingreso',pct(p(deu)),p(deu)>lim?'bad':'good']],
   bars:[...r].sort((a,b)=>b.v-a.v).map(x=>[x.n,x.v,`${money(x.v)} · ${pct(p(x.v),0)}`,x.k==='w']),
   read:!inc?'Escribe tus ingresos.':`${sal<0?`<span class="bad">Gastas ${money(-sal)} más de lo que recibes.</span> `:''}Tus necesidades se llevan el ${pct(p(nec),0)} del ingreso y ahorras el ${pct(p(aho),0)}. ${p(deu)>lim?`Las deudas superan tu límite de ${pct(lim,0)}: antes de un crédito nuevo, ordena las que tienes.`:'Tus deudas están dentro del límite que definiste.'}`,
   tech:'Barras oscuras: gustos. Necesidades incluyen deudas y seguros.'}}};

A['simulador-hipotecario']={formula:'Cuota = Monto × i / (1 − (1 + i)<sup>−n</sup>) · Monto máximo = Cuota máxima × (1 − (1 + i)<sup>−n</sup>) / i<br>i = (1 + EA)<sup>1/12</sup> − 1',
 blocks:[{type:'seg',id:'m',label:'Quiero calcular',opts:[['v','La cuota de una vivienda'],['c','Cuánto me prestan']],v:'v'},
  {type:'fields',items:[{id:'val',label:'Valor de la vivienda ($)',t:'money',v:280000000,when:['m','v']},{id:'inc',label:'Ingreso familiar mensual ($)',t:'money',v:9000000,when:['m','c']},{id:'fin',label:'Porcentaje que financia la entidad (%)',t:'dec',v:'70',hint:'Varía según tipo de vivienda y entidad.'},{id:'rel',label:'Cuota máxima sobre ingreso (%)',t:'dec',v:'30',hint:'Verifica el límite que aplica tu entidad.'},{id:'r',label:'Tasa efectiva anual (%)',t:'dec',v:'12,5',hint:'Ejemplo. Usa la de tu oferta.'},{id:'y',label:'Plazo (años)',t:'int',v:20},{id:'sg',label:'Seguros mensuales estimados ($)',t:'money',v:180000,hint:'Vida e incendio y terremoto.'}]}],
 notes:['Simulación de referencia en pesos con cuota fija. La aprobación depende del estudio de crédito de la entidad.','Las tasas cambian con frecuencia: actualízalas antes de decidir.'],
 compute(g,T,S){const i=monthly(g('r'),'EA'),n=g('y')*12,fin=g('fin')/100,rel=g('rel')/100,sg=g('sg');
  if(S('m')==='v'){const V=g('val'),M=V*fin,c=annuity(M,i,n),need=rel?(c+sg)/rel:0;
   return {kpis:[['Cuota mensual',money(c+sg),'',1],['Monto del crédito',money(M)],['Cuota inicial que pones',money(V-M)],['Ingreso familiar mínimo',money(need)],['Total pagado en el plazo',money((c+sg)*n)]],
    bars:[['Cuota inicial',V-M,money(V-M),1],['Crédito',M,money(M)],['Intereses',c*n-M,money(c*n-M),1]],
    read:`Para una vivienda de <b>${money(V)}</b> necesitas ahorrar <b>${money(V-M)}</b> de cuota inicial y demostrar ingresos de al menos <b>${money(need)}</b> al mes.`}}
  const inc=g('inc'),cm=Math.max(0,inc*rel-sg),M=pv(cm,i,n),V=fin?M/fin:0;
  return {kpis:[['Crédito máximo',money(M),'',1],['Cuota máxima',money(cm+sg)],['Vivienda a la que aspiras',money(V)],['Cuota inicial necesaria',money(V-M)]],
   bars:[['Cuota inicial',V-M,money(V-M),1],['Crédito',M,money(M)]],
   read:`Con ingresos de <b>${money(inc)}</b> podrías acceder a un crédito cercano a <b>${money(M)}</b> y a una vivienda de hasta <b>${money(V)}</b>, si ahorras ${money(V-M)} de cuota inicial.`}}};

/* ---------------- Motor de la interfaz ---------------- */
const host=$('#calc');if(!host)return;
const slug=document.body.dataset.app,D=A[slug];if(!D){host.textContent='Herramienta no encontrada.';return}
const fmtIn=(v,t)=>t==='money'||t==='int'?(v===''?'':loc(parse(v,t))):v;
const inp=(id,f,v)=>f.t==='select'?`<select id="${id}">${f.opts.map(([k,l])=>`<option value="${k}"${k===v?' selected':''}>${l}</option>`).join('')}</select>`
  :`<input id="${id}" data-t="${f.t}" ${f.t==='text'?'':`inputmode="${f.t==='money'||f.t==='int'?'numeric':'decimal'}"`} value="${esc(fmtIn(v,f.t))}" autocomplete="off">`;
const when=w=>w?` data-when="${w[0]}:${w[1]}"`:'';
let html=`<div class="card stack"><div class="formula">${D.formula}</div>`;
D.blocks.forEach(b=>{
  if(b.type==='fields')html+=`<div class="stack" style="gap:10px"${when(b.when)}>${b.title?`<h2 class="sec-t">${b.title}</h2>`:''}<div class="fields">${b.items.map(f=>`<label${when(f.when)}>${f.label}${inp(f.id,f,f.v)}${f.hint?`<span class="hint">${f.hint}</span>`:''}</label>`).join('')}</div></div>`;
  if(b.type==='pair')html+=`<div class="pair">${['b','f'].map((k,j)=>`<fieldset><legend>${j?'Medición de salida':'Línea base'}</legend>${b.items.map(f=>`<label>${f.label}${inp(f.id+'_'+k,f,f.v[j])}</label>`).join('')}</fieldset>`).join('')}</div>`;
  if(b.type==='seg')html+=`<div class="stack" style="gap:8px"><span class="hint">${b.label}</span><div class="seg" data-seg="${b.id}" role="group">${b.opts.map(([k,l])=>`<button type="button" data-v="${k}" aria-pressed="${k===b.v}">${l}</button>`).join('')}</div></div>`;
  if(b.type==='table')html+=`<div class="stack" style="gap:10px"><h2 class="sec-t">${b.title}</h2><div class="tbl-wrap"><table class="edit" data-tbl="${b.id}"><thead><tr>${b.cols.map(c=>`<th${c.t!=='text'?' class="num"':''}>${c.label}</th>`).join('')}${b.fixed?'':'<th></th>'}</tr></thead><tbody></tbody></table></div>${b.fixed?'':`<button type="button" class="btn add" data-add="${b.id}">${b.add}</button>`}</div>`;
});
html+=`<p class="hint">Valores de ejemplo. Cámbialos por los de tu empresa o tu caso. Nada de lo que escribes sale de tu navegador.</p></div>
<div class="card stack sticky" aria-live="polite"><div class="kpis" id="kpis"></div><div class="bars" id="bars"></div><p class="read" id="read"></p><p class="tech" id="tech"></p><div id="otbl"></div><button type="button" class="btn" id="csv" hidden>Descargar tabla (CSV)</button>
<ul class="notes">${D.notes.map(n=>`<li>${n}</li>`).join('')}</ul></div>`;
host.innerHTML=html;

const TB={};D.blocks.filter(b=>b.type==='table').forEach(b=>TB[b.id]=b);
function addRow(id,vals){const b=TB[id],tb=$(`[data-tbl="${id}"] tbody`);if(!b.fixed&&tb.children.length>=b.max)return;
  vals=vals||b.cols.map(c=>c.t==='text'?'':'');
  tb.insertAdjacentHTML('beforeend',`<tr>${b.cols.map((c,j)=>`<td${c.t!=='text'?' class="num"':''}>${c.ro?esc(vals[j]):`<input aria-label="${esc(c.label)}" data-t="${c.t}" data-c="${c.id}" ${c.t==='text'?'':`inputmode="${c.t==='money'||c.t==='int'?'numeric':'decimal'}"`} value="${esc(fmtIn(vals[j],c.t))}">`}</td>`).join('')}${b.fixed?'':'<td><button type="button" class="del" aria-label="Quitar fila">×</button></td>'}</tr>`);
  const btn=$(`[data-add="${id}"]`);if(btn)btn.hidden=tb.children.length>=b.max}
Object.values(TB).forEach(b=>b.rows.forEach(r=>addRow(b.id,r)));

const seg={};$$('[data-seg]').forEach(s=>{seg[s.dataset.seg]=$('[aria-pressed="true"]',s).dataset.v;
  s.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;$$('button',s).forEach(x=>x.setAttribute('aria-pressed',String(x===b)));seg[s.dataset.seg]=b.dataset.v;run()})});
const g=id=>{const el=document.getElementById(id);if(!el)return 0;return el.tagName==='SELECT'?el.value:parse(el.value,el.dataset.t)};
const T=id=>{const b=TB[id];return $$(`[data-tbl="${id}"] tbody tr`).map((tr,k)=>{const o={};b.cols.forEach((c,j)=>{const el=$(`[data-c="${c.id}"]`,tr);o[c.id]=el?parse(el.value,c.t):b.rows[k][j]});return o})};
const S=id=>seg[id]??(document.getElementById(id)||{}).value;
let csv=null;
function run(){
  $$('[data-when]').forEach(el=>{const [k,v]=el.dataset.when.split(':');el.hidden=(S(k)??g(k))!==v});
  let o;try{o=D.compute(g,T,S)}catch(e){console.error(e);return}
  $('#kpis').innerHTML=(o.kpis||[]).map(([l,v,c,m])=>`<div class="kpi${m?' main':''}"><span>${l}</span><b class="${c||''}">${v}</b></div>`).join('');
  const bs=o.bars||[],mx=o.barMax||Math.max(...bs.map(x=>Math.abs(x[1])),1e-9);
  $('#bars').innerHTML=bs.map(([l,v,d,alt])=>`<div class="bar"><span class="lab" title="${esc(l)}">${esc(l)}</span><div class="tr"><div class="fi${alt?' alt':''}" style="width:${Math.max(0,Math.min(100,v/mx*100))}%"></div></div><span class="v">${d}</span></div>`).join('');
  $('#read').innerHTML=o.read||'';$('#tech').textContent=o.tech||'';$('#tech').hidden=!o.tech;
  $('#otbl').innerHTML=o.table?`<div class="tbl-wrap out-table"><table><thead><tr>${o.table.head.map((h,j)=>`<th${o.table.num.includes(j)?' class="num"':''}>${h}</th>`).join('')}</tr></thead><tbody>${o.table.rows.map(r=>`<tr>${r.map((c,j)=>`<td${o.table.num.includes(j)?' class="num"':''}>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:'';
  csv=o.csv||null;$('#csv').hidden=!csv}
host.addEventListener('input',run);host.addEventListener('change',run);
host.addEventListener('focusout',e=>{const el=e.target;if(el.matches('input[data-t="money"],input[data-t="int"]')&&el.value!=='')el.value=loc(parse(el.value,el.dataset.t))});
host.addEventListener('click',e=>{const a=e.target.closest('[data-add]');if(a){addRow(a.dataset.add);run();return}
  const d=e.target.closest('.del');if(d){const tb=d.closest('tbody');if(tb.children.length>1){d.closest('tr').remove();const id=d.closest('table').dataset.tbl,btn=$(`[data-add="${id}"]`);if(btn)btn.hidden=false;run()}}});
$('#csv').onclick=()=>{if(!csv)return;const txt='﻿'+csv.map(r=>r.join(';')).join('\n'),u=URL.createObjectURL(new Blob([txt],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=u;a.download=slug+'.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000)};
run();
})();
