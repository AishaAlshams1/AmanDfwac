(function(){
  "use strict";

  /* ===== CONFETTI ===== */
  const confettiCanvas = document.getElementById('confettiCanvas');
  const cctx = confettiCanvas.getContext('2d');
  let confettiPieces = [];
  let confettiRunning = false;

  function resizeConfetti(){
    const stage = document.getElementById('stage');
    confettiCanvas.width = stage.offsetWidth;
    confettiCanvas.height = stage.offsetHeight;
  }
  resizeConfetti();
  window.addEventListener('resize', resizeConfetti);

  function spawnConfetti(count, colors){
    const w = confettiCanvas.width, h = confettiCanvas.height;
    for(let i=0;i<count;i++){
      confettiPieces.push({
        x: w*0.5+(Math.random()-0.5)*w*0.5,
        y: h*0.25,
        vx: (Math.random()-0.5)*14,
        vy: -Math.random()*16-4,
        w: 5+Math.random()*7, h: 3+Math.random()*5,
        color: colors[Math.floor(Math.random()*colors.length)],
        rotation: Math.random()*360,
        rotSpeed: (Math.random()-0.5)*18,
        gravity: 0.22+Math.random()*0.18,
        life: 1,
        decay: 0.006+Math.random()*0.005
      });
    }
    if(!confettiRunning){confettiRunning=true;animateConfetti();}
  }

  function animateConfetti(){
    cctx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
    confettiPieces = confettiPieces.filter(p=>p.life>0);
    if(confettiPieces.length===0){confettiRunning=false;return;}
    confettiPieces.forEach(p=>{
      p.vy+=p.gravity; p.x+=p.vx; p.y+=p.vy; p.vx*=0.99;
      p.rotation+=p.rotSpeed; p.life-=p.decay;
      cctx.save();
      cctx.translate(p.x,p.y);
      cctx.rotate(p.rotation*Math.PI/180);
      cctx.globalAlpha=Math.max(0,p.life);
      cctx.fillStyle=p.color;
      cctx.beginPath();
      cctx.roundRect(-p.w/2,-p.h/2,p.w,p.h,2);
      cctx.fill();
      cctx.restore();
    });
    requestAnimationFrame(animateConfetti);
  }

  /* ===== AUDIO ===== */
  let actx=null, musicNodes=null, musicOn=true, audioReady=false;

  function ensureAudio(){
    if(audioReady)return;
    audioReady=true;
    actx=new(window.AudioContext||window.webkitAudioContext)();
    startMusic();
  }

  function playClick(){
    if(!actx)return;
    const t=actx.currentTime;
    const osc=actx.createOscillator(), gain=actx.createGain();
    osc.type='sine';
    osc.frequency.setValueAtTime(780,t);
    osc.frequency.exponentialRampToValueAtTime(440,t+0.08);
    gain.gain.setValueAtTime(0.0001,t);
    gain.gain.linearRampToValueAtTime(0.14,t+0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001,t+0.12);
    osc.connect(gain).connect(actx.destination);
    osc.start(t);osc.stop(t+0.14);
  }

  function playChime(type){
    if(!actx)return;
    const t=actx.currentTime;
    const freqs=type==='safe'?[523.25,659.25,783.99,1046.5]
                :type==='caution'?[493.88,440.0,392.0]
                :[349.23,293.66,261.63];
    freqs.forEach((f,i)=>{
      const osc=actx.createOscillator(), gain=actx.createGain();
      osc.type='triangle';osc.frequency.value=f;
      const s=t+i*0.1;
      gain.gain.setValueAtTime(0.0001,s);
      gain.gain.linearRampToValueAtTime(0.12,s+0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001,s+0.5);
      osc.connect(gain).connect(actx.destination);
      osc.start(s);osc.stop(s+0.55);
    });
  }

  function startMusic(){
    if(!actx||musicNodes)return;
    const master=actx.createGain();
    master.gain.value=musicOn?0.04:0;
    master.connect(actx.destination);
    [130.81,164.81,196.00,246.94].forEach(freq=>{
      const o=actx.createOscillator();o.type='sine';o.frequency.value=freq;
      const d=actx.createOscillator();d.type='sine';d.frequency.value=freq*1.003;
      const g=actx.createGain();g.gain.value=0.2;
      const fl=actx.createBiquadFilter();fl.type='lowpass';fl.frequency.value=850;
      o.connect(fl);d.connect(fl);fl.connect(g);g.connect(master);
      o.start();d.start();
    });
    const lfo=actx.createOscillator();lfo.type='sine';lfo.frequency.value=0.07;
    const lG=actx.createGain();lG.gain.value=0.012;
    lfo.connect(lG);lG.connect(master.gain);lfo.start();
    musicNodes={master};
  }

  function toggleMusic(){
    musicOn=!musicOn;
    document.getElementById('soundBtn').textContent=musicOn?'🔈':'🔇';
    if(musicNodes&&actx) musicNodes.master.gain.linearRampToValueAtTime(musicOn?0.04:0,actx.currentTime+0.4);
  }

  document.getElementById('soundBtn').addEventListener('click',function(){ensureAudio();toggleMusic();});

  document.addEventListener('click',function(e){
    const btn=e.target.closest('button');
    if(btn){ensureAudio();playClick();}
    if(btn){
      const r=btn.getBoundingClientRect();
      const x=e.clientX-r.left, y=e.clientY-r.top;
      btn.style.setProperty('--rx',x+'px');btn.style.setProperty('--ry',y+'px');
      const rip=document.createElement('span');rip.className='ripple';
      rip.style.left=x+'px';rip.style.top=y+'px';
      rip.style.width=rip.style.height=Math.max(r.width,r.height)+'px';
      btn.appendChild(rip);setTimeout(()=>rip.remove(),500);
    }
  },true);

  /* ===== PARTICLES ===== */
  const particleHost=document.getElementById('particles');
  const sparkTypes=['star','rose','white'];
  for(let i=0;i<28;i++){
    const s=document.createElement('div');
    s.className='spark '+sparkTypes[i%3];
    const sz=2+Math.random()*3;
    s.style.width=sz+'px';s.style.height=sz+'px';
    s.style.left=Math.random()*100+'%';
    s.style.bottom=(Math.random()*15-5)+'%';
    s.style.animationDuration=(10+Math.random()*12)+'s';
    s.style.animationDelay=(Math.random()*12)+'s';
    particleHost.appendChild(s);
  }

  /* ===== GAME DATA ===== */
  const scenarios=[
    {image:"img/level1.png",text:"شخص غريب يقول للطفلة إنه يعرف والدتها، ويطلب منها أن تذهب معه ليريها مكانها.",
      choices:[
        {label:"أذهب معه لأنه يعرف والدتي",type:"unsafe",image:"img/level1un.png",result:"لم يكن من الآمن الذهاب معه.",why:"معرفة اسم أحد أفراد العائلة لا تعني أن الشخص صادق أو آمن. الغرباء أحياناً يستخدمون معلومات بسيطة لكسب الثقة."},
        {label:"أسأله من أين يعرف والدتي",type:"caution",image:"img/level1ca.png",result:"من الجيد أنك لم تذهبي معه مباشرة، لكن الأفضل عدم الاستمرار في الحديث مع شخص غريب.",why:"الاستمرار في النقاش قد يعطي الشخص فرصة لإقناعك بالذهاب معه. القاعدة الأسلم هي إنهاء الحديث والابتعاد فوراً."},
        {label:"أرفض الذهاب وأطلب المساعدة من شخص بالغ أثق به",type:"safe",image:"img/level1sa.png",result:"أحسنت! هذا هو التصرف الأكثر أماناً.",why:"الابتعاد عن الغريب وطلب المساعدة من شخص بالغ موثوق مثل شرطي أو أحد الوالدين هو القرار الصحيح دائماً."}
      ]},
    {image:"img/level2.png",text:"شخص غريب يقدم للطفلة هدية جميلة ويطلب منها أن تقترب منه وتأخذها.",
      choices:[
        {label:"آخذ الهدية منه",type:"unsafe",image:"img/level2un.png",result:"لم يكن من الآمن أخذ الهدية.",why:"بعض الغرباء قد يستخدمون الهدايا والألعاب لجذب الأطفال وكسب ثقتهم."},
        {label:"أشكره وأبقى أتحدث معه",type:"caution",image:"img/level2ca.png",result:"من الجيد أنك لم تأخذي الهدية، لكن البقاء مع شخص غريب قد لا يكون آمناً.",why:"الأفضل الابتعاد وعدم الاستمرار في الحديث مع شخص لا تعرفينه."},
        {label:"أرفض الهدية وأبتعد عنه",type:"safe",image:"img/level2sa.png",result:"أحسنت! هذا هو التصرف الأكثر أماناً.",why:"رفض الهدايا من الغرباء والابتعاد عنهم يساعد على حماية الأطفال من المواقف الخطرة."}
      ]},
    {image:"img/level3.png",text:"شخص في الإنترنت يطلب منها معلوماتها الشخصية.",
      choices:[
        {label:"أرسل له جميع المعلومات",type:"unsafe",image:"img/level3un.png",result:"لم يكن من الآمن مشاركة المعلومات.",why:"لا يجب مشاركة الاسم الكامل أو العنوان أو رقم الهاتف مع أشخاص لا تعرفينهم على الإنترنت."},
        {label:"أرسل له اسمي فقط",type:"caution",image:"img/level3ca.png",result:"من الجيد أنك لم ترسلي جميع المعلومات، لكن الأفضل عدم مشاركة أي معلومات شخصية.",why:"حتى المعلومات البسيطة قد تُستخدم بطريقة خاطئة أو تساعد الغرباء على معرفة المزيد عنك."},
        {label:"أرفض مشاركة أي معلومات وأحظر الحساب",type:"safe",image:"img/level3sa.png",result:"أحسنت! هذا هو التصرف الأكثر أماناً.",why:"حماية المعلومات الشخصية وحظر الحسابات المجهولة يساعد على البقاء آمناً أثناء استخدام الإنترنت."}
      ]},
    {image:"img/level4.png",text:"كانت الطفلة وحدها في المنزل، وطرق شخص الباب وقال إنه صديق والدها.",
      choices:[
        {label:"أفتح الباب له",type:"unsafe",image:"img/level4un.png",result:"لم يكن من الآمن فتح الباب.",why:"لا ينبغي فتح الباب لشخص غريب حتى لو قال إنه يعرف العائلة."},
        {label:"أتحدث معه من خلف الباب",type:"caution",image:"img/level4ca.png",result:"من الجيد أنك لم تفتحي الباب، لكن الأفضل عدم التحدث مع الغرباء لفترة طويلة.",why:"التواصل مع شخص غريب قد يجعله يحاول إقناعك بفتح الباب."},
        {label:"لا أفتح الباب وأتصل بولي أمري",type:"safe",image:"img/level4sa.png",result:"أحسنت! هذا هو التصرف الأكثر أماناً.",why:"عدم فتح الباب والتواصل مع ولي الأمر يساعد على الحفاظ على سلامتك."}
      ]},
    {image:"img/level5.png",text:"اكتشفت الطفلة أنها ضاعت ولم تعد ترى عائلتها في المركز التجاري.",
      choices:[
        {label:"أخرج من المركز وحدي",type:"unsafe",image:"img/level5un.png",result:"لم يكن من الآمن الخروج وحدك.",why:"الخروج من المكان قد يجعل العثور عليك أصعب بالنسبة لعائلتك."},
        {label:"أبحث عن عائلتي في كل مكان",type:"caution",image:"img/level5ca.png",result:"من الجيد أنك حاولت البحث، لكن التجول وحدك قد يجعلك تبتعدين أكثر.",why:"الأفضل التوجه إلى مكان المساعدة أو طلب المساعدة من موظف رسمي."},
        {label:"أطلب المساعدة من رجل أمن أو موظف",type:"safe",image:"img/level5sa.png",result:"أحسنت! هذا هو التصرف الأكثر أماناً.",why:"رجال الأمن والموظفون الرسميون موجودون لمساعدة الأطفال وإعادتهم إلى عائلاتهم بأمان."}
      ]},
    {image:"img/level6.png",text:"تعرضت الطفلة للتنمر من بعض الطلاب أثناء الفسحة.",
      choices:[
        {label:"أتشاجر معهم",type:"unsafe",image:"img/level6un.png",result:"لم يكن من الآمن الرد بالعنف.",why:"العنف قد يزيد المشكلة سوءاً ويعرض الجميع للأذى."},
        {label:"أتجاهلهم ولا أخبر أحداً",type:"caution",image:"img/level6ca.png",result:"من الجيد أنك لم تتشاجري، لكن الأفضل طلب المساعدة.",why:"إخبار شخص بالغ يساعد على إيقاف التنمر وحماية الطفل."},
        {label:"أخبر المعلم أو المرشد",type:"safe",image:"img/level6sa.png",result:"أحسنت! هذا هو التصرف الأكثر أماناً.",why:"إبلاغ المعلم أو المرشد يساعد على حل المشكلة بطريقة آمنة وصحيحة."}
      ]}
  ];

  /* ===== STATE ===== */
  let currentIndex=0, scoreSafe=0, scoreCaution=0, scoreUnsafe=0;
  const screens={
    welcome:document.getElementById('welcome'),
    howto:document.getElementById('howto'),
    scenario:document.getElementById('scenario'),
    result:document.getElementById('result'),
    final:document.getElementById('final')
  };
  let prevScreen=null;

  function showScreen(name){
    if(prevScreen&&prevScreen!==name){
      screens[prevScreen].classList.remove('active');
      screens[prevScreen].classList.add('exit-up');
      setTimeout(()=>{screens[prevScreen].classList.remove('exit-up');},400);
    }
    const target=screens[name];
    target.querySelectorAll('.stagger').forEach(el=>{
      el.style.animation='none';el.offsetHeight;el.style.animation='';
    });
    setTimeout(()=>{target.classList.add('active');},prevScreen?80:0);
    prevScreen=name;
  }

  function toArabic(n){return n.toString().replace(/\d/g,d=>'٠١٢٣٤٥٦٧٨٩'[d]);}

  function buildProgress(){
    const total=scenarios.length;
    const pct=(currentIndex/total)*100;
    document.getElementById('progressFill').style.width=pct+'%';
    document.getElementById('progressLabel').textContent='الموقف '+toArabic(currentIndex+1)+' من '+toArabic(total);
    document.getElementById('progressCount').textContent=toArabic(currentIndex+1)+'/'+toArabic(total);
    const dots=document.getElementById('progressDots');dots.innerHTML='';
    for(let i=0;i<total;i++){
      const d=document.createElement('div');
      d.className='pdot'+(i<currentIndex?' done':(i===currentIndex?' current':''));
      dots.appendChild(d);
    }
  }

  function renderScenario(){
    buildProgress();
    const s=scenarios[currentIndex];
    document.getElementById('sceneTag').textContent=s.tag;
    const se=document.getElementById('sceneEmojis');se.innerHTML='';
    if(s.image){const img=document.createElement('img');img.src=s.image;img.alt=s.tag;img.className='scene-image';se.appendChild(img);}
    document.getElementById('scenarioText').textContent=s.text;
    const wrap=document.getElementById('choicesWrap');wrap.innerHTML='';
    const order=s.choices.map((_,i)=>i);
    for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
    order.forEach((idx,oi)=>{
      const c=s.choices[idx];
      const btn=document.createElement('button');btn.className='choice-btn stagger';
      btn.style.animationDelay=(0.35+oi*0.1)+'s';
      btn.textContent=c.label;
      btn.addEventListener('click',()=>handleChoice(c,btn));
      wrap.appendChild(btn);
    });
    showScreen('scenario');
  }

  const typeMeta={
    safe:{icon:'✅',label:'خيار آمن',bgClass:'safe-bg',cardClass:'safe-card',colors:['#5fd39a','#a8e6cf','#ffd166','#fff','#8be8b8']},
    caution:{icon:'⚠️',label:'خيار يحتاج إلى حذر',bgClass:'caution-bg',cardClass:'caution-card',colors:['#f4c453','#f7dc8e','#fff','#ffd166','#ffeaa7']},
    unsafe:{icon:'⛔',label:'خيار غير آمن',bgClass:'unsafe-bg',cardClass:'unsafe-card',colors:['#f16565','#f5a0a0','#fff','#fdd','#ff8787']}
  };

  function handleChoice(choice,btnEl){
    document.querySelectorAll('.choice-btn').forEach(b=>{b.style.pointerEvents='none';b.style.opacity='.5';});
    btnEl.style.opacity='1';btnEl.style.transform='scale(1.03)';
    if(choice.type==='safe')scoreSafe++;
    else if(choice.type==='caution')scoreCaution++;
    else scoreUnsafe++;
    setTimeout(()=>{
      playChime(choice.type);
      const meta=typeMeta[choice.type];
      document.getElementById('resultBg').className='result-bg '+meta.bgClass;
      document.getElementById('resultIcon').textContent=meta.icon;
      document.getElementById('resultLabel').textContent=meta.label;
      document.getElementById('resultText').textContent=choice.result;
      document.getElementById('resultWhy').textContent=choice.why;
      document.getElementById('resultCard').className='result-card '+meta.cardClass;
      const ri=document.getElementById('resultImage');
      if(choice.image){ri.src=choice.image;ri.style.display='block';}else{ri.style.display='none';}
      const rc=document.getElementById('resultContent');rc.style.animation='none';rc.offsetHeight;rc.style.animation='';
      showScreen('result');
      if(choice.type==='safe'){setTimeout(()=>spawnConfetti(80,meta.colors),200);}
      else if(choice.type==='unsafe'){
        setTimeout(()=>{rc.classList.add('shake-it');setTimeout(()=>rc.classList.remove('shake-it'),600);},300);
      }
    },350);
  }

  document.getElementById('nextBtn').addEventListener('click',function(){
    currentIndex++;
    if(currentIndex<scenarios.length) renderScenario();
    else renderFinal();
  });

  function renderFinal(){
    const total=scenarios.length;
    const finalScreen=document.getElementById('final');
    finalScreen.querySelectorAll('.final-star').forEach(s=>s.remove());
    for(let i=0;i<16;i++){
      const star=document.createElement('div');star.className='final-star';star.textContent='✦';
      star.style.left=Math.random()*90+5+'%';star.style.top=Math.random()*90+5+'%';
      star.style.fontSize=(10+Math.random()*18)+'px';
      star.style.animationDelay=(Math.random()*3)+'s';
      star.style.animationDuration=(1.5+Math.random()*2)+'s';
      finalScreen.appendChild(star);
    }

    // Badge & title
    let badge,title,msg,msgIcon;
    if(scoreSafe===total){
      badge='🏆';title='حارس أمان محترف!';
      msg='اخترت التصرف الآمن في كل المواقف. أنتِ متميزة في معرفة كيف تحمين نفسك. استمري دائماً في التفكير قبل التصرف والتحدث مع من تثقين بهم.';
    } else if(scoreSafe>=Math.ceil(total/2)){
      badge='🥈';title='أداء جيد جداً!';
      msg='تعرفتِ على معظم التصرفات الآمنة. راجعي التفسيرات لتتعلمي كيف تتصرفين في كل موقف بثقة أكبر.';
    } else {
      badge='🌱';title='بداية جيدة للتعلّم';
      msg='كل موقف كان فرصة للتعلّم. تذكري: طلب المساعدة من شخص بالغ تثقين به هو دائماً الخيار الأذكى.';
    }

    document.getElementById('finalBadge').textContent=badge;
    document.getElementById('finalTitle').textContent=title;
    document.getElementById('msgIcon').textContent=msgIcon;
    document.getElementById('finalMsg').textContent=msg;

    // Big score
    document.getElementById('scoreBig').textContent=toArabic(scoreSafe);
    document.getElementById('scoreOf').textContent='من '+toArabic(total)+' خيارات آمنة';

    // Stars (1 star per safe answer, max 6)
    const starsRow=document.getElementById('starsRow');starsRow.innerHTML='';
    for(let i=0;i<total;i++){
      const s=document.createElement('span');s.className='star-item';
      if(i<scoreSafe){
        s.textContent='⭐';s.classList.add('lit');
        s.style.animationDelay=(0.5+i*0.12)+'s';
      } else {
        s.textContent='⭐';s.classList.add('dim');
      }
      starsRow.appendChild(s);
    }

    // Breakdown bars (animate after render)
    const pctSafe=Math.round((scoreSafe/total)*100);
    const pctCaution=Math.round((scoreCaution/total)*100);
    const pctUnsafe=Math.round((scoreUnsafe/total)*100);

    document.getElementById('numSafe').textContent=toArabic(scoreSafe);
    document.getElementById('numCaution').textContent=toArabic(scoreCaution);
    document.getElementById('numUnsafe').textContent=toArabic(scoreUnsafe);

    // Reset bars first
    document.getElementById('barSafe').style.width='0%';
    document.getElementById('barCaution').style.width='0%';
    document.getElementById('barUnsafe').style.width='0%';

    showScreen('final');

    // Animate bars after screen transition
    setTimeout(()=>{
      document.getElementById('barSafe').style.width=pctSafe+'%';
      document.getElementById('barCaution').style.width=pctCaution+'%';
      document.getElementById('barUnsafe').style.width=pctUnsafe+'%';
    },700);

    // Confetti bursts
    setTimeout(()=>{spawnConfetti(100,['#ffd166','#ff8fb3','#5fd39a','#fff','#b9aee3','#ffb3cd']);},500);
    setTimeout(()=>{spawnConfetti(60,['#ffd166','#ff8fb3','#5fd39a','#fff']);},1100);
    if(scoreSafe===total){
      setTimeout(()=>{spawnConfetti(80,['#ffd166','#fff','#5fd39a']);},1600);
    }
  }

  document.getElementById('restartBtn').addEventListener('click',function(){
    currentIndex=0;scoreSafe=0;scoreCaution=0;scoreUnsafe=0;
    renderScenario();
  });

  document.getElementById('homeBtn').addEventListener('click',function(){
    currentIndex=0;scoreSafe=0;scoreCaution=0;scoreUnsafe=0;
    showScreen('welcome');
  });

  document.getElementById('startBtn').addEventListener('click',function(){
    currentIndex=0;scoreSafe=0;scoreCaution=0;scoreUnsafe=0;
    renderScenario();
  });
  document.getElementById('howtoBtn').addEventListener('click',function(){showScreen('howto');});
  document.getElementById('backToWelcome').addEventListener('click',function(){
    currentIndex=0;scoreSafe=0;scoreCaution=0;scoreUnsafe=0;
    renderScenario();
  });

})();
