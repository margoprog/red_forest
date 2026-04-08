import * as THREE from "three"
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Reflector } from 'three/examples/jsm/objects/Reflector.js'

//////////////////////
// SCENE
//////////////////////

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x040004)

//////////////////////
// CAMERA
//////////////////////

const camera = new THREE.PerspectiveCamera(
75,
window.innerWidth/window.innerHeight,
0.1,
300
)

const cameraPivot = new THREE.Group()
scene.add(cameraPivot)

cameraPivot.position.set(0,-2.3,4)
cameraPivot.add(camera)

//////////////////////
// LIGHT
//////////////////////

const flashlight = new THREE.SpotLight(0xffbbbb,25)

flashlight.angle = Math.PI/7
flashlight.penumbra = 1.5
flashlight.distance = 500

camera.add(flashlight)
camera.add(flashlight.target)

flashlight.position.set(0,-0.2,0)

//////////////////////
// RENDERER
//////////////////////

const renderer = new THREE.WebGLRenderer({antialias:true})

renderer.setSize(window.innerWidth,window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5))

document.body.appendChild(renderer.domElement)

//////////////////////
// TEXTURES
//////////////////////

const textureLoader = new THREE.TextureLoader()

//////////////////////
// WATER
//////////////////////

const waterGeo = new THREE.PlaneGeometry(300,300)

const water = new Reflector(waterGeo,{
clipBias:0.003,
textureWidth:512,
textureHeight:512,
color:0x770000
})

water.rotation.x = -Math.PI/2
water.position.y = -3

scene.add(water)

//////////////////////
// RED LILYPADS
//////////////////////

const lilyTexture = textureLoader.load("textures/mousse.png")
const lilyAlpha = textureLoader.load("textures/mousse_alpha.png")

lilyTexture.wrapS = lilyTexture.wrapT = THREE.RepeatWrapping
lilyTexture.repeat.set(60,60)

const lilyMat = new THREE.MeshStandardMaterial({
map:lilyTexture,
alphaMap:lilyAlpha,
transparent:true,
opacity:1.9,
depthWrite:false,
side:THREE.DoubleSide,
color:0xaa0000
})

const lily = new THREE.Mesh(
new THREE.PlaneGeometry(300,300),
lilyMat
)

lily.rotation.x = -Math.PI/2
lily.position.y = -2.990

scene.add(lily)

//////////////////////
// FOREST + EYES
//////////////////////

const loader = new GLTFLoader()

let eyes = []

const CLOSE_X = 0.49
const CLOSE_Z = -0.49

loader.load('/models/eye_tree.glb',(gltf)=>{

const tree = gltf.scene

const TREE_COUNT = 70
const AREA_SIZE = 14

for(let i=0;i<TREE_COUNT;i++){

const clone = tree.clone(true)

clone.position.set(
(Math.random()-0.5)*AREA_SIZE,
-3.05,
(Math.random()-0.5)*AREA_SIZE
)

clone.rotation.y = Math.random()*Math.PI*2

const scale = 0.8 + Math.random()*0.4
clone.scale.set(scale,scale,scale)

scene.add(clone)

const eye={
mesh:clone,
upper:[],
lower:[],
current:1,
target:1,
timer:0
}

clone.traverse(child=>{

if(!child.isMesh) return

const name = child.name.toLowerCase()

if(name.includes("upperlid")) eye.upper.push(child)
if(name.includes("lowerlid")) eye.lower.push(child)

})

eyes.push(eye)

}

})

//////////////////////
// EYE LOGIC
//////////////////////

const OPEN_DELAY = 500

const lightPos = new THREE.Vector3()
const lightTarget = new THREE.Vector3()
const lightDir = new THREE.Vector3()
const toEye = new THREE.Vector3()

function updateEyes(){

const now = performance.now()

flashlight.getWorldPosition(lightPos)
flashlight.target.getWorldPosition(lightTarget)

lightDir.subVectors(lightTarget,lightPos).normalize()

eyes.forEach(eye=>{

toEye.subVectors(eye.mesh.position,lightPos)

const distance = toEye.length()

toEye.normalize()

const angle = lightDir.dot(toEye)

const insideCone = angle > Math.cos(flashlight.angle)

if(insideCone && distance < flashlight.distance){

if(eye.timer===0) eye.timer=now

if(now-eye.timer>OPEN_DELAY){
eye.target=0
}

}else{

eye.timer=0
eye.target=1

}

eye.current += (eye.target-eye.current)*0.15

eye.upper.forEach(lid=>{
lid.rotation.x = -CLOSE_X * eye.current
lid.rotation.z = -CLOSE_Z * eye.current
})

eye.lower.forEach(lid=>{
lid.rotation.x = CLOSE_X * eye.current
lid.rotation.z = CLOSE_Z * eye.current
})

})

}

//////////////////////
// MUSHROOMS
//////////////////////

const stemMat = new THREE.MeshStandardMaterial({
color:0xFF0000,
emissive:0xFF0000,
emissiveIntensity:2,
transparent:true,
opacity:0.7
})

const capMat = new THREE.MeshStandardMaterial({
color:0xff0000,
emissive:0xFF0000,
emissiveIntensity:2.5
})

function createMushroom(x,z){

const mushroom = new THREE.Group()
const stemHeight = 0.07 + Math.random()*0.12
const stemWidth = 0.005 + Math.random()*0.01

const capRadius = 0.03 + Math.random()*0.05
const capHeight = Math.PI*(0.4 + Math.random()*0.3)

const stem = new THREE.Mesh(
new THREE.CylinderGeometry(stemWidth*0.6,stemWidth,stemHeight,12),
stemMat
)

stem.position.y = stemHeight/2
mushroom.add(stem)

const cap = new THREE.Mesh(
new THREE.SphereGeometry(capRadius,16,16,0,Math.PI*2,0,capHeight),
capMat
)

cap.position.y = stemHeight
mushroom.add(cap)

mushroom.position.set(x,-3,z)

scene.add(mushroom)

}

for(let i=0;i<35;i++){

createMushroom(
(Math.random()-0.5)*22,
(Math.random()-0.5)*22
)

}
//////////////////////
// AMBIENT LIGHT
//////////////////////

const ambientLight = new THREE.AmbientLight(
0x220000,   // couleur
0.2        // intensité
)

scene.add(ambientLight)
//////////////////////
// FOG
//////////////////////

scene.fog = new THREE.FogExp2(0x000000,0.02)

const fogTexture = textureLoader.load("textures/smog.png")

const fogParticles=[]

for(let i=0;i<25;i++){

const fog = new THREE.Mesh(

new THREE.PlaneGeometry(10,10),

new THREE.MeshBasicMaterial({
map:fogTexture,
transparent:true,
opacity:0.05,
depthWrite:false,
side:THREE.DoubleSide
})

)

fog.position.set(
(Math.random()-0.5)*20,
-2.98 + Math.random()*0.05,
(Math.random()-0.5)*20
)

fog.rotation.x = -Math.PI/2 + Math.random()*0.3
fog.rotation.z = Math.random()*Math.PI

scene.add(fog)
fogParticles.push(fog)

}

//////////////////////
// MOUSE
//////////////////////

let mouseX=0
let mouseY=0

window.addEventListener("mousemove",(event)=>{

mouseX=(event.clientX/window.innerWidth)*2-1
mouseY=(event.clientY/window.innerHeight)*2-1

})

//////////////////////
// CAMERA CONTROL
//////////////////////

let targetX=0
let targetY=0

function updateCamera(){

cameraPivot.rotation.x += (targetX-cameraPivot.rotation.x)*0.08
cameraPivot.rotation.y += (targetY-cameraPivot.rotation.y)*0.08

cameraPivot.rotation.x = THREE.MathUtils.clamp(
cameraPivot.rotation.x,
-0.1,
1.9
)

}

//////////////////////
// FLASHLIGHT
//////////////////////

function updateFlashlight(){

const range=10

flashlight.target.position.x = mouseX*range
flashlight.target.position.y = -mouseY*range
flashlight.target.position.z = -10

targetX = -mouseY*1.2
targetY = -mouseX*0.5

}

//////////////////////
// ANIMATION
//////////////////////

function tick(){

updateFlashlight()
updateCamera()
updateEyes()

const t = performance.now()*0.001

fogParticles.forEach(p=>{
p.position.y += Math.sin(t+p.position.x)*0.0002
})

renderer.render(scene,camera)

requestAnimationFrame(tick)

}

tick()

//////////////////////
// RESIZE
//////////////////////

window.addEventListener("resize",()=>{

renderer.setSize(window.innerWidth,window.innerHeight)

camera.aspect = window.innerWidth/window.innerHeight
camera.updateProjectionMatrix()

})