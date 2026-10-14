// A projected silk ribbon: no textures, network requests or rendering dependencies.
export function createRibbonScene(banner) {
  if (!banner) return {setMotion() {}};
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return {setMotion() {}};
  canvas.className = 'ribbon-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const scene = document.createElement('div');
  scene.className = 'ribbon-scene';
  scene.innerHTML = '<p class="ribbon-label"><span aria-hidden="true">✦</span> Движение в вашем ритме</p><div class="ribbon-controls"><button class="ribbon-gesture" type="button">Задать движение <span aria-hidden="true"></span></button><button class="ribbon-toggle" type="button" aria-pressed="false">Пауза</button></div>';
  scene.prepend(canvas);
  banner.append(scene);
  banner.classList.add('has-ribbon');
  const toggle = scene.querySelector('.ribbon-toggle');
  const gesture = scene.querySelector('.ribbon-gesture');
  const tau = Math.PI * 2;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const norm = v => {const n = Math.hypot(...v) || 1; return v.map(x => x / n);};
  const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  let width = 1, height = 1, pixelRatio = 1;
  let enabled = false, paused = false, visible = true, initialized = false;
  let raf = 0, last = 0, lastPaint = 0, phase = 0, reveal = 0.08, pulse = 0;
  let pointerX = 0, pointerY = 0, targetX = 0, targetY = 0;

  function rotate(p, yaw, tilt) {
    const x = p[0] * Math.cos(yaw) + p[2] * Math.sin(yaw);
    const z = -p[0] * Math.sin(yaw) + p[2] * Math.cos(yaw);
    return [x, p[1] * Math.cos(tilt) - z * Math.sin(tilt), p[1] * Math.sin(tilt) + z * Math.cos(tilt)];
  }
  function draw() {
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const cx = width * .5, cy = height * .47;
    const size = Math.min(width, height) * .143;
    const unfold = 1 - (1 - reveal) ** 3;
    const yaw = -.65 + phase * .19 + pointerX * .4 + (1-unfold)*1.1;
    const tilt = -.38 + Math.sin(phase*.27)*.2 + pointerY*.28;
    const project = p => {
      const scale = 8 / (8 - p[2]);
      return [cx + p[0]*size*scale, cy - p[1]*size*scale, p[2]];
    };
    const shadow = ctx.createRadialGradient(cx, height*.81, 0, cx, height*.81, width*.34);
    shadow.addColorStop(0, '#69203d25'); shadow.addColorStop(1, '#69203d00');
    ctx.save(); ctx.translate(0, height*.81); ctx.scale(1,.2); ctx.translate(0,-height*.81);
    ctx.fillStyle = shadow; ctx.fillRect(0, -height*3, width, height*8); ctx.restore();

    // Fine orbital paths give the sculpture scale without covering the typography.
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-.36);
    ctx.lineWidth = .6; ctx.strokeStyle = '#9f59632b';
    for (let i=0; i<3; i++) {
      ctx.beginPath(); ctx.ellipse(0,0,width*(.34+i*.035),height*(.13+i*.025),0,0,tau); ctx.stroke();
    }
    ctx.restore();
    const steps = width < 430 ? 144 : 224, strips = width < 430 ? 10 : 14;
    const rows = [];
    const curve = t => {
      const radius = 1.65 + .64 * Math.cos(3*t + Math.sin(phase*.23)*.25);
      return [radius*Math.cos(2*t), 1.75*Math.sin(3*t), radius*Math.sin(2*t)];
    };
    const count = Math.max(2, Math.ceil(steps*unfold));
    for (let i=0; i<=count; i++) {
      const t = i/steps*tau;
      const center = curve(t), next = curve(t+.001);
      const tangent = norm(next.map((v,j) => v-center[j]));
      const side = norm(cross(tangent, [Math.cos(2*t),0,Math.sin(2*t)]));
      const normal = norm(cross(tangent,side));
      const twist = t + phase*.11;
      const across = side.map((v,j) => v*Math.cos(twist)+normal[j]*Math.sin(twist));
      const bend = norm(cross(tangent,across));
      const span = (.34+.15*Math.sin(t*3)**2)*(1+pulse*.2);
      const row = [];
      for (let j=0; j<=strips; j++) {
        const u = j/strips*2-1;
        const pos = center.map((v,k) => (v + across[k]*u*span + bend[k]*(1-u*u)*.16)*(0.6+unfold*.4));
        const p = rotate(pos,yaw,tilt);
        row.push({p, screen:project(p)});
      }
      rows.push(row);
    }
    const faces = [];
    const light = norm([-.35,.65,1]);
    for (let i=0; i<count; i++) {
      for (let j=0; j<strips; j++) {
        const a=rows[i][j], b=rows[i+1][j], c=rows[i+1][j+1], d=rows[i][j+1];
        let n=norm(cross(b.p.map((v,k)=>v-a.p[k]),d.p.map((v,k)=>v-a.p[k])));
        if(n[2]<0) n=n.map(v=>-v);
        const diffuse=Math.max(0,n.reduce((sum,v,k)=>sum+v*light[k],0));
        const highlight=Math.pow(diffuse,14)*.8;
        const blend=.5+.5*Math.sin(i/steps*tau*1.5+phase*.24);
        const base=mix([199,39,100],[245,163,66],blend);
        const shaded=mix([65,17,49],base,.3+diffuse*.7);
        const color=mix(shaded,[255,248,216],highlight);
        faces.push({points:[a.screen,b.screen,c.screen,d.screen],z:(a.p[2]+b.p[2]+c.p[2]+d.p[2])/4,color:`rgb(${color.map(Math.round).join(',')})`});
      }
    }
    faces.sort((a,b)=>a.z-b.z);
    ctx.lineWidth=.5;
    for(const face of faces) {
      ctx.beginPath(); face.points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.closePath();
      ctx.fillStyle=face.color; ctx.strokeStyle=face.color; ctx.fill(); ctx.stroke();
    }
    // A small cloud of warm sparks follows the same rhythm as the ribbon.
    for(let i=0;i<34;i++) {
      const angle=i*2.39996+phase*(.12+(i%3)*.035);
      const radius=2.65+(i%5)*.12+pulse*.3;
      const p=project(rotate([Math.cos(angle)*radius,Math.sin(angle)*2.4,Math.sin(angle*2)*.7],-.3,.15));
      const alpha=(.25+.35*Math.sin(i+phase)**2)*unfold;
      ctx.fillStyle=`rgba(${i%2?'218,119,57':'160,43,91'},${alpha})`;
      ctx.beginPath();ctx.arc(p[0],p[1],i%6===0?2.1:1,0,tau);ctx.fill();
    }
    if(pulse>.02) {
      ctx.strokeStyle=`rgba(188,64,98,${pulse*.3})`;ctx.lineWidth=1;
      ctx.beginPath();ctx.ellipse(cx,cy,width*(.29+(1-pulse)*.15),height*(.25+(1-pulse)*.12),-.35,0,tau);ctx.stroke();
    }
  }
  function canRun() {return enabled && !paused && visible && !document.hidden;}
  function frame(now) {
    raf=0;
    if(!canRun())return;
    if(!last)last=now;
    const dt=Math.min((now-last)/1000,.06);last=now;
    phase+=dt*(1+pulse*3.5);reveal=Math.min(1,reveal+dt*.64);pulse=Math.max(0,pulse-dt*.65);
    pointerX+=(targetX-pointerX)*Math.min(1,dt*5);pointerY+=(targetY-pointerY)*Math.min(1,dt*5);
    if(now-lastPaint>=1000/30){draw();lastPaint=now;}
    raf=requestAnimationFrame(frame);
  }
  function sync() {
    const running=canRun();scene.dataset.ribbonState=running?'playing':'paused';
    if(running&&!raf){last=0;raf=requestAnimationFrame(frame);}
    else if(!running&&raf){cancelAnimationFrame(raf);raf=0;}
    toggle.setAttribute('aria-pressed',String(paused));
    toggle.textContent=paused?'Продолжить':'Пауза';
    toggle.disabled=!enabled;
    gesture.disabled=!enabled;
  }
  function resize() {
    const rect=canvas.getBoundingClientRect();width=Math.max(1,rect.width);height=Math.max(1,rect.height);
    pixelRatio=Math.min(devicePixelRatio||1,1.75);
    canvas.width=Math.round(width*pixelRatio);canvas.height=Math.round(height*pixelRatio);
    if(initialized)draw();
  }
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:0});
  observer.observe(scene);
  new ResizeObserver(resize).observe(canvas);
  banner.addEventListener('pointermove',event=>{
    if(!enabled||event.pointerType==='touch')return;
    const bounds=canvas.getBoundingClientRect();
    targetX=clamp((event.clientX-bounds.left)/bounds.width*2-1,-1,1);
    targetY=clamp((event.clientY-bounds.top)/bounds.height*2-1,-1,1);
  });
  banner.addEventListener('pointerleave',()=>{targetX=0;targetY=0;});
  function flourish() {if(enabled){paused=false;pulse=1;sync();}}
  canvas.addEventListener('pointerdown',flourish);
  gesture.addEventListener('click',flourish);
  toggle.addEventListener('click',()=>{paused=!paused;sync();});
  resize();
  return {setMotion(active) {
    enabled=active;
    if(!active)reveal=1;
    if(!initialized){initialized=true;draw();}
    sync();
  }};
}
