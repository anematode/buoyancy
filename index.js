const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
const controls = new OrbitControls( camera, renderer.domElement );
document.body.appendChild( renderer.domElement );

function onResize () {
  renderer.setSize( window.innerWidth, window.innerHeight );
}

function resetPerspective () {
  camera.position.set( -0.6320506706886376, -82.7249050817383, 57.28167762179261 );
  controls.target.set(0, 0, 0);
  controls.update();
}

window.onload = window.onresize = onResize
resetPerspective()

const FLUID_GEOM_SIZE = 100
const DEMARCATION_LINES = 11
const CUBE_SIZE = 1
const CUBE_RES = 100

const CUBE_DENSITY = 1
const FLUID_DENSITY = 1

function createFluidGeometry() {
  const geometry = new THREE.PlaneGeometry( 100, 100 );
  const material = new THREE.MeshBasicMaterial( {color: 0x0000ff, side: THREE.DoubleSide, opacity: 0.5, transparent: true } );
  const plane = new THREE.Mesh( geometry, material );

  return plane
}

function createFluidLinesGeometry() {
  const points = []
  const material = new THREE.LineBasicMaterial({
    color: 0xffffffff
  });

  for (let i = 0; i <= DEMARCATION_LINES; ++i) {
    let frac = i / DEMARCATION_LINES

    points.push(new THREE.Vector3(frac * FLUID_GEOM_SIZE, 0, 0))
    points.push(new THREE.Vector3(frac * FLUID_GEOM_SIZE, FLUID_GEOM_SIZE, 0))
    points.push(new THREE.Vector3(0, frac * FLUID_GEOM_SIZE, 0))
    points.push(new THREE.Vector3(FLUID_GEOM_SIZE, frac * FLUID_GEOM_SIZE, 0))
  }

  points.forEach(v => { v.x -= FLUID_GEOM_SIZE / 2; v.y -= FLUID_GEOM_SIZE / 2; v.z += 0.01 })

  const g = new THREE.BufferGeometry().setFromPoints( points );

  const line = new THREE.LineSegments( g, material );
  return line
}

class FloatingObject {
  constructor () {
    this.points = [] // Series of Vec3s which are displacements
    this.weights = [] // Series of weights for each point

    this.volume = 0
    this.cm = new THREE.Vector3(0,0,0) // center of mass

    this.quaternion = new THREE.Quaternion() // rotation of the object relative to standing (cm is used for position)
    this.geometry = null
  }

  computeMass () {
    this.totalMass = this.weights.reduce((a, b) => a + b, 0)
  }

  getTransform () {
    return new THREE.Matrix4().compose(this.cm, this.quaternion, new THREE.Vector3(1, 1, 1))
  }
}

class Cube extends FloatingObject {
  constructor (len=CUBE_SIZE) {
    super()

    this.volume = len * len * len

    let RCUBE_RES = CUBE_RES + 1

    let perElem = this.volume / (RCUBE_RES * RCUBE_RES * RCUBE_RES)

    for (let x = 0; x < RCUBE_RES; ++x) {
      for (let y = 0; y < RCUBE_RES; ++y) {
        for (let z = 0; z < RCUBE_RES; ++z) {
          this.points.push(new THREE.Vector3(x, y, z))
          this.weights.push(perElem)
        }
      }
    }

    // Transform into cube
    this.points.forEach(v => { v.x = ((v.x / CUBE_RES) - 0.5) * len;
      v.y = ((v.y / CUBE_RES) - 0.5) * len
      v.z = ((v.z / CUBE_RES) - 0.5) * len
    })

    this.computeMass()
    this.setupGeometry()
  }

  setupGeometry () {
    let geom = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE)

    const material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
    const cube = new THREE.Mesh( geometry, material );

    this.elem = cube
  }

  setGeometry () {

  }

  computeActualPoints () {
    let transform = this.getTransform()

    return this.points.map(p => p.applyMatrix4(transform))
  }

  computeUnderwater () {

  }
}


const cube = new Cube()

scene.add(cube.geometry)

scene.add( fluidGeometry = createFluidGeometry() );
scene.add( fluidGeometryLines = createFluidLinesGeometry() )

camera.position.z = 5;

/**
 * z = 0 is the plane of the fluid
 * Fluid is displayed as 100 x 100 centered on (0, 0, 0)
 *
 * Cube is 1 unit across
 */

function animate() {
  controls.update();
  requestAnimationFrame( animate );
  renderer.render( scene, camera );
}
animate();
