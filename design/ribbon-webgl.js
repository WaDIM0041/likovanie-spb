import {WebGLRenderer,Scene,PerspectiveCamera,BufferGeometry,BufferAttribute,DynamicDrawUsage,Mesh,MeshStandardMaterial,DoubleSide,Group,HemisphereLight,DirectionalLight,Color,Vector3,Points,PointsMaterial,LineLoop,LineBasicMaterial,PMREMGenerator,CanvasTexture,Sprite,SpriteMaterial,SRGBColorSpace,ACESFilmicToneMapping} from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

export function createWebGLRibbon(canvas) {
  const context=canvas.getContext('webgl2',{alpha:true,antialias:true,preserveDrawingBuffer:true});
  if(!context)return null;
  const renderer=new WebGLRenderer({canvas,context,alpha:true,antialias:true});
  renderer.outputColorSpace=SRGBColorSpace;renderer.toneMapping=ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  renderer.setClearColor(0x000000,0);
  const scene=new Scene();const camera=new PerspectiveCamera(40,1,.1,30);camera.position.set(0,.1,8.5);
  const pmrem=new PMREMGenerator(renderer);const room=new RoomEnvironment();
  const environment=pmrem.fromScene(room,.04).texture;scene.environment=environment;room.dispose();pmrem.dispose();
  scene.add(new HemisphereLight(0xffffff,0x111111,2));
  const key=new DirectionalLight(0xffffff,4);key.position.set(-3,5,4);scene.add(key);
  const fill=new DirectionalLight(0xffffff,2);fill.position.set(4,0,3);scene.add(fill);
  const rim=new DirectionalLight(0xffffff,3);rim.position.set(1,3,-3);scene.add(rim);
  const group=new Group();scene.add(group);
  const segments=168,strips=12,tau=Math.PI*2;
  const positions=new Float32Array((segments+1)*(strips+1)*3);
  const colors=new Float32Array(positions.length);
  const indices=[];
  for(let i=0;i<segments;i++)for(let j=0;j<strips;j++){
    const a=i*(strips+1)+j,b=a+strips+1;indices.push(a,b,a+1,b,b+1,a+1);
  }
  const geometry=new BufferGeometry();geometry.setIndex(indices);
  geometry.setAttribute('position',new BufferAttribute(positions,3).setUsage(DynamicDrawUsage));
  geometry.setAttribute('color',new BufferAttribute(colors,3).setUsage(DynamicDrawUsage));
  const material=new MeshStandardMaterial({vertexColors:true,metalness:.62,roughness:.27,side:DoubleSide,envMapIntensity:1.7});
  const mesh=new Mesh(geometry,material);mesh.frustumCulled=false;group.add(mesh);
  const pink=new Color('#f58220'),gold=new Color('#00a6a6'),tint=new Color();
  const tangent=new Vector3(),side=new Vector3(),normal=new Vector3(),across=new Vector3(),bend=new Vector3();
  const curve=(t,phase)=>{
    const r=1.65+.64*Math.cos(3*t+Math.sin(phase*.23)*.25);
    return new Vector3(r*Math.cos(2*t),1.75*Math.sin(3*t),r*Math.sin(2*t));
  };
  const sparkPositions=new Float32Array(34*3);const sparksGeometry=new BufferGeometry();
  sparksGeometry.setAttribute('position',new BufferAttribute(sparkPositions,3));
  const sparks=new Points(sparksGeometry,new PointsMaterial({color:0xf58220,size:.035,transparent:true,opacity:.6,depthWrite:false}));scene.add(sparks);
  for(let i=0;i<3;i++){
    const points=[];for(let j=0;j<96;j++){const a=j/96*tau;points.push(new Vector3(Math.cos(a)*(2.6+i*.25),Math.sin(a)*(.8+i*.15),-.5));}
    const ring=new LineLoop(new BufferGeometry().setFromPoints(points),new LineBasicMaterial({color:0xf58220,transparent:true,opacity:.15}));ring.rotation.z=-.35;scene.add(ring);
  }
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=64;
  const ctx=shadowCanvas.getContext('2d');
  if(ctx){const g=ctx.createRadialGradient(64,32,1,64,32,64);g.addColorStop(0,'#11111150');g.addColorStop(1,'#11111100');ctx.fillStyle=g;ctx.fillRect(0,0,128,64);
    const shadow=new Sprite(new SpriteMaterial({map:new CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));shadow.position.set(0,-2.35,-.6);shadow.scale.set(4,.7,1);scene.add(shadow);
  }
  return {
    resize(width,height,dpr){renderer.setPixelRatio(Math.min(dpr,width<430?1.25:1.5));renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();},
    render({phase,reveal,pulse,pointerX,pointerY}){
      const unfold=1-(1-reveal)**3;
      group.rotation.set(-.38+Math.sin(phase*.27)*.2+pointerY*.28,-.65+phase*.19+pointerX*.4+(1-unfold)*1.1,0);
      group.scale.setScalar(.6+unfold*.4);
      for(let i=0;i<=segments;i++){
        const t=i/segments*tau,center=curve(t,phase);
        tangent.copy(curve(t+.001,phase)).sub(center).normalize();
        side.crossVectors(tangent,new Vector3(Math.cos(2*t),0,Math.sin(2*t))).normalize();
        normal.crossVectors(tangent,side).normalize();
        const twist=t+phase*.11;across.copy(side).multiplyScalar(Math.cos(twist)).addScaledVector(normal,Math.sin(twist));
        bend.crossVectors(tangent,across).normalize();const span=(.34+.15*Math.sin(t*3)**2)*(1+pulse*.2);
        tint.copy(pink).lerp(gold,.5+.5*Math.sin(t*1.5+phase*.24));
        for(let j=0;j<=strips;j++){
          const u=j/strips*2-1,k=(i*(strips+1)+j)*3;
          positions[k]=center.x+across.x*u*span+bend.x*(1-u*u)*.16;
          positions[k+1]=center.y+across.y*u*span+bend.y*(1-u*u)*.16;
          positions[k+2]=center.z+across.z*u*span+bend.z*(1-u*u)*.16;
          colors[k]=tint.r;colors[k+1]=tint.g;colors[k+2]=tint.b;
        }
      }
      geometry.attributes.position.needsUpdate=true;geometry.attributes.color.needsUpdate=true;geometry.computeVertexNormals();
      geometry.setDrawRange(0,Math.max(6,Math.floor(segments*unfold)*strips*6));
      for(let i=0;i<34;i++){const a=i*2.39996+phase*(.12+(i%3)*.035),r=2.65+(i%5)*.12+pulse*.3;sparkPositions[i*3]=Math.cos(a)*r;sparkPositions[i*3+1]=Math.sin(a)*2.4;sparkPositions[i*3+2]=Math.sin(a*2)*.7;}
      sparksGeometry.attributes.position.needsUpdate=true;renderer.render(scene,camera);
    },
    dispose(){scene.traverse(obj=>{obj.geometry?.dispose();if(obj.material){obj.material.map?.dispose();obj.material.dispose();}});environment.dispose();renderer.dispose();}
  };
}
