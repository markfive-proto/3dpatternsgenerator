// ═══════════════════════════════════════════════
// SHARED GLSL UTILITIES
// ═══════════════════════════════════════════════

const NOISE_GLSL = /* glsl */ `
vec3 mod289v3(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289v4(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289v4(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  vec2 C=vec2(1.0/6.0,1.0/3.0);vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289v3(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
  vec4 xr=x_*ns.x+ns.yyyy;vec4 yr=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(xr)-abs(yr);
  vec4 b0=vec4(xr.xy,yr.xy);vec4 b1=vec4(xr.zw,yr.zw);
  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 nrm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=nrm.x;p1*=nrm.y;p2*=nrm.z;p3*=nrm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

const COLOR_GLSL = /* glsl */ `
vec3 hsv2rgb(vec3 c){
  vec4 K=vec4(1.0,2.0/3.0,1.0/3.0,3.0);
  vec3 p=abs(fract(c.xxx+K.xyz)*6.0-K.www);
  return c.z*mix(K.xxx,clamp(p-K.xxx,0.0,1.0),c.y);
}
vec3 rgb2hsv(vec3 c){
  vec4 K=vec4(0.0,-1.0/3.0,2.0/3.0,-1.0);
  vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));
  vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));
  float d=q.x-min(q.w,q.y);float e=1.0e-10;
  return vec3(abs(q.z+(q.w-q.y)/(6.0*d+e)),d/(q.x+e),q.x);
}
`;

const VORONOI_GLSL = /* glsl */ `
vec2 vHash(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return fract(sin(p)*43758.5453);}
float voronoi(vec2 uv){
  vec2 i=floor(uv);vec2 f=fract(uv);float md=1.0;
  for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){
    vec2 n=vec2(float(x),float(y));vec2 pt=vHash(i+n);
    md=min(md,length(n+pt-f));
  }return md;
}
`;

// ═══════════════════════════════════════════════
// COMMON BLOCKS
// ═══════════════════════════════════════════════

const UNIFORMS = /* glsl */ `
uniform float uTime;
uniform float uNoiseAmplitude;
uniform float uNoiseFrequency;
uniform float uSize;
uniform vec3 uColor;
uniform vec3 uSecondaryColor;
uniform float uOpacity;
uniform float uGlowIntensity;
`;

const VARYINGS = /* glsl */ `
varying float vDisplacement;
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vWorldPos;
varying vec3 vLocalDir;
varying vec3 vLocalPos;
`;

const DISPLACEMENT = /* glsl */ `
vec3 pos=position;float len=length(pos);
vec3 dir=len>0.001?pos/len:vec3(0.0,1.0,0.0);
float n1=snoise(dir*uNoiseFrequency+uTime*0.3);
float n2=snoise(dir*uNoiseFrequency*2.0+uTime*0.5+100.0)*0.5;
float n3=snoise(dir*uNoiseFrequency*4.0+uTime*0.8+200.0)*0.25;
float totalNoise=n1+n2+n3;
vDisplacement=totalNoise;
vec3 displaced=dir*(uSize+totalNoise*uNoiseAmplitude);
`;

// ═══════════════════════════════════════════════
// UNIVERSAL MESH VERTEX SHADER
// ═══════════════════════════════════════════════

const MESH_VERT = `
${NOISE_GLSL}
${UNIFORMS}
${VARYINGS}
void main(){
  ${DISPLACEMENT}
  vLocalDir=dir;vLocalPos=displaced;
  vec4 wp=modelMatrix*vec4(displaced,1.0);
  vWorldPos=wp.xyz;
  vNormal=normalize(normalMatrix*normal);
  vViewDir=normalize(cameraPosition-wp.xyz);
  gl_Position=projectionMatrix*modelViewMatrix*vec4(displaced,1.0);
}
`;

// ═══════════════════════════════════════════════
// PARTICLES VERTEX (special — uses gl_PointSize)
// ═══════════════════════════════════════════════

const PARTICLES_VERT = `
${NOISE_GLSL}
${UNIFORMS}
uniform float uPointSize;
${VARYINGS}
void main(){
  ${DISPLACEMENT}
  vLocalDir=dir;vLocalPos=displaced;
  vec4 wp=modelMatrix*vec4(displaced,1.0);
  vWorldPos=wp.xyz;
  vNormal=normalize(normalMatrix*normal);
  vViewDir=normalize(cameraPosition-wp.xyz);
  vec4 mvp=modelViewMatrix*vec4(displaced,1.0);
  gl_Position=projectionMatrix*mvp;
  gl_PointSize=max(uPointSize*(300.0/-mvp.z),1.0);
}
`;

// ═══════════════════════════════════════════════
// FRAGMENT SHADER HEADER (shared by all mesh frags)
// ═══════════════════════════════════════════════

const FRAG_HEAD = `${COLOR_GLSL}
${UNIFORMS}
${VARYINGS}
`;
const FRAG_HEAD_NOISE = `${NOISE_GLSL}
${COLOR_GLSL}
${UNIFORMS}
${VARYINGS}
`;
const FRAG_HEAD_VORONOI = `${VORONOI_GLSL}
${COLOR_GLSL}
${UNIFORMS}
${VARYINGS}
`;

// ═══════════════════════════════════════════════
// SHADER INTERFACE
// ═══════════════════════════════════════════════

export interface ShaderDef {
  vertexShader: string;
  fragmentShader: string;
  renderMode: "points" | "mesh";
  wireframe?: boolean;
  transparent?: boolean;
  depthWrite?: boolean;
  blending?: "normal" | "additive";
  side?: "front" | "double";
}

// ═══════════════════════════════════════════════
// 20 FRAGMENT SHADERS
// ═══════════════════════════════════════════════

// ─── 1. PARTICLES ───
const particlesFrag = `
${FRAG_HEAD}
void main(){
  vec2 c=gl_PointCoord-0.5;float d=length(c);
  if(d>0.5)discard;
  float a=smoothstep(0.5,0.1,d);
  float t=smoothstep(-0.8,0.8,vDisplacement);
  vec3 col=mix(uSecondaryColor,uColor,t);
  col+=pow(max(t,0.0),1.5)*uGlowIntensity*0.4;
  float rim=1.0-abs(dot(vLocalDir,vec3(0,0,1)));
  col+=rim*0.15*uColor;
  gl_FragColor=vec4(col,a*uOpacity);
}
`;

// ─── 2. HOLOGRAPHIC ───
const holoFrag = `
${FRAG_HEAD}
void main(){
  vec3 N=normalize(vNormal);vec3 V=normalize(vViewDir);
  float NdV=max(dot(N,V),0.0);
  float fr=pow(1.0-NdV,3.0);
  float hue=fract(fr*2.0+vDisplacement*0.3+dot(N,vec3(1,.5,0))*.5+uTime*.05);
  vec3 rb=hsv2rgb(vec3(hue,.7,1.0));
  vec3 base=mix(vec3(.95),uColor,.15);
  vec3 col=mix(base,rb,fr*.8+.1);
  float rip=sin(vWorldPos.x*40.+vWorldPos.y*30.+vDisplacement*20.)*.5+.5;
  col=mix(col,col*1.3,smoothstep(.3,.7,rip)*.15);
  vec3 L=normalize(vec3(1));vec3 H=normalize(L+V);
  col+=pow(max(dot(N,H),0.),64.)*.6;
  col*=max(dot(N,L),0.)*.4+.6;
  col+=fr*rb*uGlowIntensity*.3;
  gl_FragColor=vec4(col,(.7+fr*.3)*uOpacity);
}
`;

// ─── 3. GRADIENT ───
const gradientFrag = `
${FRAG_HEAD}
void main(){
  vec3 N=normalize(vNormal);vec3 V=normalize(vViewDir);
  float NdV=max(dot(N,V),0.0);
  float y=(vLocalPos.y/(uSize+1.0))*.5+.5;y=clamp(y,0.,1.);
  vec3 col;
  if(y<.5)col=mix(uSecondaryColor,uColor,y*2.);
  else col=mix(uColor,vec3(1,.95,.98),(y-.5)*2.);
  float nc=vDisplacement*.15;vec3 hc=rgb2hsv(col);
  hc.x=fract(hc.x+nc);hc.y*=.85;col=hsv2rgb(hc);
  vec3 L=normalize(vec3(.5,1,.8));
  col*=max(dot(N,L),0.)*.35+.65;
  float fr=pow(1.-NdV,2.5);col+=fr*uColor*.2*uGlowIntensity;
  vec3 H=normalize(L+V);col+=pow(max(dot(N,H),0.),16.)*.15;
  gl_FragColor=vec4(col,uOpacity);
}
`;

// ─── 4. GLASS ───
const glassFrag = `
${FRAG_HEAD}
void main(){
  vec3 N=normalize(vNormal);vec3 V=normalize(vViewDir);
  float NdV=max(dot(N,V),0.0);float fr=pow(1.-NdV,4.);
  vec3 R=reflect(-V,N);
  float eh=fract(dot(R,vec3(.3,.5,.7))*.5+vDisplacement*.2+uTime*.02);
  vec3 env=hsv2rgb(vec3(eh,.6,1.));
  vec3 disp=vec3(hsv2rgb(vec3(fract(eh+.02),.7,1.)).r,env.g,hsv2rgb(vec3(fract(eh-.02),.7,1.)).b);
  vec3 base=mix(vec3(.98),uColor,.08);
  vec3 col=mix(base,disp,fr*.85);
  float ca=sin(vLocalDir.x*8.+uTime*.5)*sin(vLocalDir.y*6.+uTime*.4)*sin(vLocalDir.z*7.+uTime*.6);
  ca=ca*.5+.5;col=mix(col,hsv2rgb(vec3(fract(ca+uTime*.03),.8,1.)),ca*.25*(1.-fr));
  vec3 L1=normalize(vec3(1));vec3 L2=normalize(vec3(-1,.5,.5));
  col+=(pow(max(dot(N,normalize(L1+V)),0.),128.)+pow(max(dot(N,normalize(L2+V)),0.),96.)*.5)*uGlowIntensity*.5;
  gl_FragColor=vec4(col,mix(.15,.85,fr)*uOpacity);
}
`;

// ─── 5. MESH LINES ───
const meshLinesFrag = `
${FRAG_HEAD}
void main(){
  vec3 N=normalize(vNormal);vec3 V=normalize(vViewDir);
  float NdV=max(dot(N,V),0.0);
  float t=smoothstep(-.8,.8,vDisplacement);
  vec3 col=mix(uSecondaryColor,uColor,t);
  float fr=pow(1.-NdV,2.);
  col+=fr*uColor*uGlowIntensity*.5;
  col*=1.+uGlowIntensity*.3;
  gl_FragColor=vec4(col,uOpacity);
}
`;

// ─── 6. FUTURISTIC ───
const futuristicFrag = `
${FRAG_HEAD}
void main(){
  vec3 N=normalize(vNormal);vec3 V=normalize(vViewDir);
  float NdV=max(dot(N,V),0.0);
  float hue=fract(dot(N,vec3(1,.7,.3))*.8+vDisplacement*.4+uTime*.03);
  vec3 rb=hsv2rgb(vec3(hue,1.,1.));
  float bl=smoothstep(-.5,.5,vDisplacement);
  vec3 col=mix(mix(uSecondaryColor,uColor,bl),rb,.7);
  vec3 L=normalize(vec3(1));float dif=pow(max(dot(N,L),0.),.7);
  col*=dif*.5+.5;
  col+=pow(max(dot(N,normalize(L+V)),0.),48.)*.8;
  float fr=pow(1.-NdV,3.);
  col+=fr*hsv2rgb(vec3(fract(hue+.33),1.,1.))*uGlowIntensity*.6;
  vec3 hf=rgb2hsv(col);hf.y=min(hf.y*1.3,1.);hf.z=min(hf.z*1.1,1.);col=hsv2rgb(hf);
  gl_FragColor=vec4(col,uOpacity);
}
`;

// ─── 7. TOON ───
const toonFrag = `
${FRAG_HEAD}
void main(){
  vec3 N=normalize(vNormal);vec3 V=normalize(vViewDir);
  vec3 L=normalize(vec3(1,1,1));
  float d=dot(N,L);
  float bands=floor(d*4.+2.)/4.;bands=clamp(bands,.2,1.);
  float t=smoothstep(-.8,.8,vDisplacement);
  vec3 col=mix(uSecondaryColor,uColor,t)*bands;
  float edge=1.-smoothstep(.15,.35,abs(dot(N,V)));
  col=mix(col,vec3(0),edge*.7);
  gl_FragColor=vec4(col,uOpacity);
}
`;

// ─── 8. PLASMA ───
const plasmaFrag = `
${FRAG_HEAD}
void main(){
  float t1=sin(vWorldPos.x*3.+uTime*2.);
  float t2=sin(vWorldPos.y*4.+uTime*1.5);
  float t3=sin(vWorldPos.z*3.5+uTime*1.8);
  float t4=sin(length(vWorldPos.xy)*5.-uTime*3.);
  float pl=(t1+t2+t3+t4)*.25+.5;
  vec3 col=hsv2rgb(vec3(pl*.8+uTime*.02,.9,1.));
  col=mix(col,uColor,.2);
  vec3 N=normalize(vNormal);
  col*=max(dot(N,normalize(vec3(1))),0.)*.3+.7;
  col+=uGlowIntensity*.15;
  gl_FragColor=vec4(col,uOpacity);
}
`;

// ─── 9. X-RAY ───
const xrayFrag = `
${FRAG_HEAD}
void main(){
  vec3 N=normalize(vNormal);vec3 V=normalize(vViewDir);
  float fr=pow(1.-abs(dot(N,V)),2.);
  vec3 col=uColor*fr;
  col+=uSecondaryColor*fr*fr*uGlowIntensity*.5;
  float scan=sin(vWorldPos.y*30.+uTime*2.)*.5+.5;
  col+=scan*.05*uColor;
  gl_FragColor=vec4(col,fr*uOpacity);
}
`;

// ─── 10. FRESNEL GLOW ───
const fresnelFrag = `
${FRAG_HEAD}
void main(){
  vec3 N=normalize(vNormal);vec3 V=normalize(vViewDir);
  float fr=pow(1.-abs(dot(N,V)),3.);
  vec3 L=normalize(vec3(1));
  float dif=max(dot(N,L),0.)*.4+.3;
  float t=smoothstep(-.5,.5,vDisplacement);
  vec3 base=mix(uSecondaryColor,uColor,t);
  vec3 col=base*dif;
  col+=uColor*fr*uGlowIntensity;
  col+=pow(fr,5.)*vec3(1.)*.5;
  gl_FragColor=vec4(col,uOpacity);
}
`;

// ─── 11. VORONOI ───
const voronoiFrag = `
${FRAG_HEAD_VORONOI}
void main(){
  vec2 uv=vec2(atan(vLocalDir.z,vLocalDir.x)/6.2832+.5,asin(clamp(vLocalDir.y,-1.,1.))/3.1416+.5);
  uv*=8.;uv+=uTime*.1;
  float v=voronoi(uv);
  float edge=smoothstep(0.,.08,v);
  vec3 cc=hsv2rgb(vec3(fract(v*3.+vDisplacement*.3),.7,1.));
  vec3 col=mix(uColor,cc,.6)*edge;
  col+=(1.-edge)*uSecondaryColor*.5;
  vec3 N=normalize(vNormal);
  col*=max(dot(N,normalize(vec3(1))),0.)*.3+.7;
  gl_FragColor=vec4(col,uOpacity);
}
`;

// ─── 12. MARBLE ───
const marbleFrag = `
${FRAG_HEAD_NOISE}
void main(){
  vec3 p=vLocalDir*3.;
  float n=snoise(p)+snoise(p*2.)*.5+snoise(p*4.)*.25;
  float veins=sin(vLocalDir.x*10.+n*8.)*.5+.5;veins=pow(veins,.8);
  vec3 col=mix(uColor,uSecondaryColor,veins);
  vec3 N=normalize(vNormal);vec3 V=normalize(vViewDir);
  vec3 L=normalize(vec3(1));
  col*=max(dot(N,L),0.)*.4+.6;
  col+=pow(max(dot(N,normalize(L+V)),0.),32.)*.4;
  gl_FragColor=vec4(col,uOpacity);
}
`;

// ─── 13. AURORA ───
const auroraFrag = `
${FRAG_HEAD}
void main(){
  float y=vLocalPos.y/(uSize+1.);
  float w1=sin(y*8.+uTime*1.5+vLocalDir.x*3.);
  float w2=sin(y*12.-uTime+vLocalDir.z*4.);
  float au=(w1+w2)*.5;
  float hue=fract(y*.5+au*.3+uTime*.02);
  vec3 col=hsv2rgb(vec3(hue,.8,.9));
  col=mix(col,uColor,.2);
  float band=smoothstep(.3,.7,abs(au));
  col*=band*.7+.3;
  vec3 N=normalize(vNormal);vec3 V=normalize(vViewDir);
  float fr=pow(1.-abs(dot(N,V)),2.);
  col+=fr*uColor*.3*uGlowIntensity;
  gl_FragColor=vec4(col,uOpacity);
}
`;

// ─── 14. LAVA ───
const lavaFrag = `
${FRAG_HEAD_NOISE}
void main(){
  vec3 p=vLocalDir*4.+uTime*.2;
  float n=snoise(p)+snoise(p*2.)*.5+snoise(p*4.)*.25;
  float cracks=smoothstep(.1,.3,abs(n));
  vec3 hot=vec3(1.,.3,0.)*(1.+uGlowIntensity);
  vec3 dark=vec3(.15,.02,0.);
  vec3 col=mix(hot,dark,cracks);
  col=mix(col,uColor,.15);
  vec3 N=normalize(vNormal);
  col*=max(dot(N,normalize(vec3(1))),0.)*.2+.8;
  gl_FragColor=vec4(col,uOpacity);
}
`;

// ─── 15. ELECTRIC ───
const electricFrag = `
${FRAG_HEAD_NOISE}
void main(){
  vec3 p=vLocalDir*6.+uTime*.5;
  float n=snoise(p);
  float bolt=clamp(pow(abs(n),3.)*10.,0.,1.);
  vec3 col=mix(vec3(.02),uColor*2.,bolt);
  float n2=snoise(p*2.+50.);
  float bolt2=clamp(pow(abs(n2),4.)*15.,0.,1.);
  col+=uSecondaryColor*bolt2;
  vec3 N=normalize(vNormal);vec3 V=normalize(vViewDir);
  float fr=pow(1.-abs(dot(N,V)),2.);
  col+=fr*uColor*.3*uGlowIntensity;
  gl_FragColor=vec4(col,uOpacity);
}
`;

// ─── 16. CHROMATIC ───
const chromaticFrag = `
${FRAG_HEAD}
void main(){
  vec3 N=normalize(vNormal);vec3 V=normalize(vViewDir);
  float NdV=dot(N,V);
  float hb=fract(NdV*2.+vDisplacement*.5);
  vec3 col=vec3(
    hsv2rgb(vec3(fract(hb),1.,1.)).r,
    hsv2rgb(vec3(fract(hb+.33),1.,1.)).g,
    hsv2rgb(vec3(fract(hb+.66),1.,1.)).b
  );
  vec3 L=normalize(vec3(1));
  col*=max(dot(N,L),0.)*.3+.7;
  col+=pow(max(dot(N,normalize(L+V)),0.),48.)*.5;
  gl_FragColor=vec4(col,uOpacity);
}
`;

// ─── 17. TOPOGRAPHIC ───
const topoFrag = `
${FRAG_HEAD}
void main(){
  float height=length(vLocalPos)-uSize;
  float lines=fract(height*15.);
  float contour=1.-smoothstep(0.,.05,lines)*smoothstep(.1,.05,lines);
  float t=smoothstep(-1.,1.,vDisplacement);
  vec3 base=mix(uSecondaryColor,uColor,t);
  vec3 col=mix(base*.3,vec3(1),contour*.8);
  vec3 N=normalize(vNormal);
  col*=max(dot(N,normalize(vec3(1))),0.)*.3+.7;
  gl_FragColor=vec4(col,uOpacity);
}
`;

// ─── 18. RETRO ───
const retroFrag = `
${FRAG_HEAD}
void main(){
  float t=smoothstep(-.8,.8,vDisplacement);
  vec3 col=mix(uSecondaryColor,uColor,t);
  vec3 N=normalize(vNormal);
  col*=max(dot(N,normalize(vec3(1))),0.)*.4+.6;
  col=floor(col*6.+.5)/6.;
  float scan=sin(gl_FragCoord.y*1.5)*.5+.5;
  col*=.85+smoothstep(.3,.7,scan)*.15;
  vec2 uv=gl_FragCoord.xy/vec2(800.,600.);
  col*=1.-length(uv-.5)*.5;
  gl_FragColor=vec4(col,uOpacity);
}
`;

// ─── 19. IRIDESCENT ───
const iridescentFrag = `
${FRAG_HEAD}
void main(){
  vec3 N=normalize(vNormal);vec3 V=normalize(vViewDir);
  float NdV=max(dot(N,V),0.0);
  float thick=vDisplacement*.5+.5;
  float phase=NdV*6.+thick*4.;
  vec3 film=vec3(sin(phase)*.5+.5,sin(phase+2.094)*.5+.5,sin(phase+4.189)*.5+.5);
  vec3 col=mix(uColor,film,.7);
  vec3 L=normalize(vec3(1));
  col*=max(dot(N,L),0.)*.4+.6;
  float fr=pow(1.-NdV,3.);
  col+=fr*film*uGlowIntensity*.4;
  col+=pow(max(dot(N,normalize(L+V)),0.),64.)*.5;
  gl_FragColor=vec4(col,uOpacity);
}
`;

// ─── 20. EMISSION PULSE ───
const emissionFrag = `
${FRAG_HEAD}
void main(){
  vec3 N=normalize(vNormal);vec3 V=normalize(vViewDir);
  float NdV=max(dot(N,V),0.0);
  float pulse=sin(uTime*3.)*.5+.5;
  float pulse2=sin(uTime*5.+vDisplacement*3.)*.5+.5;
  float t=smoothstep(-.5,.5,vDisplacement);
  vec3 col=mix(uSecondaryColor,uColor,t);
  vec3 L=normalize(vec3(1));
  col*=max(dot(N,L),0.)*.3+.4;
  vec3 emit=mix(uColor,uSecondaryColor,pulse2);
  col+=emit*pulse*uGlowIntensity*.5;
  float fr=pow(1.-NdV,2.);
  col+=fr*uColor*pulse*uGlowIntensity*.3;
  gl_FragColor=vec4(col,uOpacity);
}
`;

// ═══════════════════════════════════════════════
// SHADER REGISTRY — 20 SHADERS
// ═══════════════════════════════════════════════

export const SHADER_DEFS: Record<string, ShaderDef> = {
  particles:    { vertexShader: PARTICLES_VERT, fragmentShader: particlesFrag,     renderMode: "points", transparent: true,  depthWrite: false, blending: "additive" },
  holographic:  { vertexShader: MESH_VERT,      fragmentShader: holoFrag,          renderMode: "mesh",   transparent: true,  depthWrite: true,  blending: "normal", side: "double" },
  gradient:     { vertexShader: MESH_VERT,      fragmentShader: gradientFrag,      renderMode: "mesh",   transparent: false, depthWrite: true,  blending: "normal", side: "front" },
  glass:        { vertexShader: MESH_VERT,      fragmentShader: glassFrag,         renderMode: "mesh",   transparent: true,  depthWrite: false, blending: "normal", side: "double" },
  meshLines:    { vertexShader: MESH_VERT,      fragmentShader: meshLinesFrag,     renderMode: "mesh",   transparent: true,  depthWrite: true,  blending: "normal", side: "double", wireframe: true },
  futuristic:   { vertexShader: MESH_VERT,      fragmentShader: futuristicFrag,    renderMode: "mesh",   transparent: false, depthWrite: true,  blending: "normal", side: "double" },
  toon:         { vertexShader: MESH_VERT,      fragmentShader: toonFrag,          renderMode: "mesh",   transparent: false, depthWrite: true,  blending: "normal", side: "front" },
  plasma:       { vertexShader: MESH_VERT,      fragmentShader: plasmaFrag,        renderMode: "mesh",   transparent: false, depthWrite: true,  blending: "normal", side: "double" },
  xray:         { vertexShader: MESH_VERT,      fragmentShader: xrayFrag,          renderMode: "mesh",   transparent: true,  depthWrite: false, blending: "additive", side: "double" },
  fresnel:      { vertexShader: MESH_VERT,      fragmentShader: fresnelFrag,       renderMode: "mesh",   transparent: false, depthWrite: true,  blending: "normal", side: "front" },
  voronoi:      { vertexShader: MESH_VERT,      fragmentShader: voronoiFrag,       renderMode: "mesh",   transparent: false, depthWrite: true,  blending: "normal", side: "front" },
  marble:       { vertexShader: MESH_VERT,      fragmentShader: marbleFrag,        renderMode: "mesh",   transparent: false, depthWrite: true,  blending: "normal", side: "front" },
  aurora:       { vertexShader: MESH_VERT,      fragmentShader: auroraFrag,        renderMode: "mesh",   transparent: false, depthWrite: true,  blending: "normal", side: "double" },
  lava:         { vertexShader: MESH_VERT,      fragmentShader: lavaFrag,          renderMode: "mesh",   transparent: false, depthWrite: true,  blending: "normal", side: "front" },
  electric:     { vertexShader: MESH_VERT,      fragmentShader: electricFrag,      renderMode: "mesh",   transparent: false, depthWrite: true,  blending: "normal", side: "double" },
  chromatic:    { vertexShader: MESH_VERT,      fragmentShader: chromaticFrag,     renderMode: "mesh",   transparent: false, depthWrite: true,  blending: "normal", side: "double" },
  topographic:  { vertexShader: MESH_VERT,      fragmentShader: topoFrag,          renderMode: "mesh",   transparent: false, depthWrite: true,  blending: "normal", side: "front" },
  retro:        { vertexShader: MESH_VERT,      fragmentShader: retroFrag,         renderMode: "mesh",   transparent: false, depthWrite: true,  blending: "normal", side: "front" },
  iridescent:   { vertexShader: MESH_VERT,      fragmentShader: iridescentFrag,    renderMode: "mesh",   transparent: true,  depthWrite: true,  blending: "normal", side: "double" },
  emission:     { vertexShader: MESH_VERT,      fragmentShader: emissionFrag,      renderMode: "mesh",   transparent: false, depthWrite: true,  blending: "normal", side: "double" },
};