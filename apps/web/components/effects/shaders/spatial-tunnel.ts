// Architectural portals from the supplied TomoyoDesign.pen companion asset.
// Both views share beveled rails and polished cobalt. The homepage adds
// traveling light and authored acceleration; compact previews travel steadily.
export const SPATIAL_TUNNEL_FRAGMENT = String.raw`
precision highp float;
/** @resolution */
uniform vec2 u_resolution;
uniform vec2 u_layout;
/** @mouse */
uniform vec2 u_mouse;
/** @time */
uniform float u_time;
/** @label Autoplay speed (0 for static) @default 1 @range 0, 2 */
uniform float u_speed;
/** @label Rotation rate @default 0.28 @range 0, 0.6 */
uniform float u_rotation;
/** @label Forward travel rate @default 0.8 @range 0, 1.6 */
uniform float u_travel;
/** @label Preview time (-1 for live) @default -1 @range -1, 30 */
uniform float u_phase;
/** @label Preview camera position @default -1 @range -1, 1 */
uniform float u_preview;
uniform float u_compact;
// Homepage choreography: continuous travel, roll, light depth, light intensity.
uniform vec4 u_journey;
uniform float u_energy;

// The optical axis stays fixed. Portals extend in both directions, so the
// accelerating journey never resets its position at a choreography boundary.
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float motionTime(){return u_phase>=0.0?u_phase:u_time*u_speed;}
float scene(vec3 p){
  float nearest=floor((p.z+1.8)/3.6);
  float distanceToPortal=100.0;
  // Adjacent portals differ by a constant rotation. Compute the expensive
  // trigonometry once and advance with the exact 0.24-radian rotation matrix.
  float turn=u_compact>0.5?motionTime()*u_rotation:u_journey.y;
  float angle=0.22+(nearest-1.0)*0.24+turn;
  vec2 q=rot(mod(angle,6.2831853))*p.xy;
  mat2 portalRotation=mat2(0.971337975,-0.237702626,0.237702626,0.971337975);
  for(int offset=-1;offset<=1;offset++){
    float layer=nearest+float(offset);
    vec2 b=abs(q)-vec2(2.15,1.55);
    float ring=length(max(b,0.0))+min(max(b.x,b.y),0.0)-0.62;
    vec2 section=vec2(ring,p.z-layer*3.6);
    // Flat architectural faces catch a wide reflection; the rounded bevel
    // retains a crisp silver edge as a portal passes the camera.
    vec2 bevel=abs(section)-vec2(0.22,0.20);
    float rail=length(max(bevel,0.0))+min(max(bevel.x,bevel.y),0.0)-0.14;
    distanceToPortal=min(distanceToPortal,rail);
    q=portalRotation*q;
  }
  return distanceToPortal;
}
vec3 normal(vec3 p,float footprint){vec2 e=vec2(footprint,0.0);return normalize(vec3(scene(p+e.xyy)-scene(p-e.xyy),scene(p+e.yxy)-scene(p-e.yxy),scene(p+e.yyx)-scene(p-e.yyx)));}
void main(){
  vec2 screen=gl_FragCoord.xy/u_resolution;
  vec2 top=vec2(screen.x,1.0-screen.y);
  vec3 white=vec3(0.975,0.985,1.0);
  float veil=0.0;
  if(u_compact<0.5){
    float copy=(1.0-smoothstep(0.39,0.55,top.x))*(1.0-smoothstep(0.53,0.75,top.y));
    // Follow the two headline lines with a continuous curved transition, rather
    // than a rectangular white shelf over the tunnel's nearest portal.
    float headlineEdge=mix(0.82,0.52,smoothstep(0.22,0.45,top.y));
    float headline=(1.0-smoothstep(headlineEdge-0.045,headlineEdge+0.065,top.x))*(1.0-smoothstep(0.29,0.47,top.y));
    veil=max(max(copy,headline),1.0-smoothstep(0.37,0.51,top.x));
    veil=max(veil,(1.0-smoothstep(0.065,0.18,top.y))*0.94);
    // Protect the icon with a local continuation of the paper edge. CSS-space
    // dimensions keep this small patch aligned when the GPU buffer is capped.
    float controlX=u_layout.x-max(56.0,(u_layout.x-1328.0)*0.5)-22.0;
    float controlPaper=(1.0-smoothstep(44.0,130.0,abs(top.x*u_layout.x-controlX)))
      *(1.0-smoothstep(62.0,110.0,(1.0-top.y)*u_layout.y));
    veil=max(veil,controlPaper*0.99);
    veil=mix(veil*0.99,1.0,smoothstep(0.985,1.0,veil));
    // Fully covered copy areas need no ray marching. The smooth coverage above
    // reaches opaque white before this branch, so its edge remains continuous.
    if(veil>0.9999){gl_FragColor=vec4(white,1.0);return;}
  }
  vec2 m=vec2(0.5);
  if(u_mouse.x>0.0&&u_mouse.y>0.0&&u_mouse.x<u_resolution.x&&u_mouse.y<u_resolution.y)m=u_mouse/u_resolution;
  if(u_preview>=0.0)m=vec2(u_preview,0.5);
  vec2 center=u_compact>0.5?vec2(0.5):vec2(0.755,0.405);
  vec2 uv=(gl_FragCoord.xy-u_resolution*center)/u_resolution.y;
  vec3 ro=vec3(0.3+(m.x-0.5)*1.4,0.12+(m.y-0.5)*0.8,-1.75+(m.x-0.5)*1.1);
  float clock=motionTime();
  if(u_compact>0.5){
    ro+=vec3(sin(clock*0.24)*0.24,sin(clock*0.30)*0.12,clock*u_travel);
  }else{
    ro=vec3(0.38,0.10,-1.75+u_journey.x);
  }
  vec3 rd=normalize(vec3(uv,u_compact>0.5?0.90:1.05));
  float travel=0.0;
  float d=0.0;
  for(int i=0;i<140;i++){
    d=scene(ro+rd*travel);
    if(d<0.002||travel>38.0)break;
    travel+=max(0.002,min(d*0.7,1.0));
  }
  vec3 col=white;
  float glow=exp(-length(uv-vec2(0.05,-0.04))*2.8);
  col=mix(vec3(0.10,0.24,0.95),vec3(0.008,0.017,0.09),glow);
  if(d<0.006&&travel<38.0){
    vec3 p=ro+rd*travel;
    // Average the bevel over its pixel footprint with the same six samples.
    // Subpixel normal changes otherwise turn a sharp reflection into white
    // dotted edges, even on the nearest rail and in a completely still frame.
    float footprint=clamp(travel/u_resolution.y*0.8,0.012,0.05);
    vec3 n=normal(p,footprint);
    vec3 light=normalize(vec3(-0.5,0.9,-0.8));
    float diffuse=max(dot(n,light),0.0);
    vec3 reflected=reflect(rd,n);
    float spec=pow(max(dot(reflect(-light,n),-rd),0.0),18.0);
    float fres=pow(1.0-max(dot(n,-rd),0.0),3.0);
    // A broad softbox and a narrow white strip describe the same polished
    // surface. Dark gaps between them keep the chrome from becoming a glow.
    float softbox=1.0-smoothstep(0.085,0.36,abs(reflected.y-0.42));
    float whiteStrip=1.0-smoothstep(0.045,0.19,abs(reflected.y-0.63));
    float sideLight=pow(max(dot(reflected,normalize(vec3(-0.72,0.2,-0.66))),0.0),12.0);
    // Subpixel white slivers in the distant portals cannot resolve cleanly.
    // Fade only their sharpest reflection; keep the broad metallic response.
    float fineReflection=1.0-smoothstep(9.0,28.0,travel);
    float faceLight=0.28+diffuse*0.72;
    col=vec3(0.018,0.07,0.78)*faceLight;
    col+=vec3(0.58,0.76,1.0)*(softbox*0.78+sideLight*0.45);
    col+=vec3(0.91,0.97,1.0)*((whiteStrip*0.42+spec*0.34)*fineReflection+fres*0.12);
    if(u_compact<0.5){
      float pulseDistance=(p.z-ro.z-u_journey.z)/3.8;
      float pulse=exp(-pulseDistance*pulseDistance)*u_journey.w;
      col+=vec3(0.47,0.74,1.0)*pulse*(0.18+softbox*0.46+fres*0.4);
      // The moving light illuminates the throat too, without a second render
      // target, bloom pass or additional scene-distance evaluations.
      col+=vec3(0.02,0.035,0.10)*u_energy*exp(-travel*0.025);
    }
    col=mix(col,vec3(0.009,0.018,0.09),1.0-exp(-travel*0.019));
  }
  col=mix(col,white,veil);
  if(u_compact<0.5)col=mix(col,white,smoothstep(0.90,0.99,top.y)*0.96);
  gl_FragColor=vec4(col,1.0);
}
`;
