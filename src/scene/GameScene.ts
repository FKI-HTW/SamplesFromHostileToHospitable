import { BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, WebGLRenderer, Vector3 } from "three";
import { ARButton } from 'three/addons/webxr/ARButton.js';

class GameScene {
    private static _instance = new GameScene();
    public static get instance() {
        return this._instance;
    }

    private width: number;
    private height: number;
    private renderer: WebGLRenderer;
    private camera: PerspectiveCamera;

    // AR fields
    private hitTestSource: XRHitTestSource | null = null;
    private hitTestSourceRequested = false;

    // three js scene
    private readonly scene = new Scene();

    private constructor() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.renderer = new WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.width, this.height);


        // find target html element
        const targetElement = document.querySelector<HTMLDivElement>("#app");
        if (!targetElement)
            throw "unable to find target element";
        targetElement.appendChild(this.renderer.domElement);
        // setup camera
        const aspectRatio = this.width / this.height;
        this.camera = new PerspectiveCamera(75, aspectRatio, 0.1, 1000);

        // listen to size change
        window.addEventListener("resize", this.resize, false);

        // Start update loop
        this.renderer.setAnimationLoop(this.update);
    }

    private resize = () => {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.renderer.setSize(this.width, this.height);
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
    };

    // public render = () => {
    //     requestAnimationFrame(this.render);
    //     this.renderer.render(this.scene, this.camera);
    // }

    //test
    private cube!: Mesh;
    public load = () => {
        const geometry = new BoxGeometry(1, 1, 1);
        const material = new MeshBasicMaterial({ color: 0x00fff00 });
        this.cube = new Mesh(geometry, material);
        this.scene.add(this.cube);
        this.cube.position.set(0, 0, -3);
    }

    private setupAR() {
        // Activate XR 
        this.renderer.xr.enabled = true;
        // Create AR button
        const arButton = ARButton.createButton(this.renderer, { requiredFeatures: ['hit-test'] });
        document.body.appendChild(arButton);
        // Session Start Listener
        this.renderer.xr.addEventListener('sessionstart', () => {
            console.log('AR session started');
            this.requestHitTestSource();
        });
    }

    private requestHitTestSource() {
        const session = this.renderer.xr.getSession();
        if (session && !this.hitTestSourceRequested) {
            session.requestReferenceSpace('viewer').then((referenceSpace) => {
                (session as any).requestHitTestSource({ space: referenceSpace }).then((source: XRHitTestSource | null) => {
                    this.hitTestSource = source;
                });
            });
            this.hitTestSourceRequested = true;

            session.addEventListener('end', () => {
                this.hitTestSourceRequested = false;
                this.hitTestSource = null;
            });
        }
    }

    // Needs to be called every frame
    public trackHitSource(frame: XRFrame) {
        const referenceSpace = this.renderer.xr.getReferenceSpace();

        if (referenceSpace && this.hitTestSource) {
            const hitTestResults = frame.getHitTestResults(this.hitTestSource);

            if (hitTestResults.length > 0) {
                const hit = hitTestResults[0];
                const hitPose = hit.getPose(referenceSpace);

                if (hitPose) { // Sicherstellen, dass hitPose nicht null ist
                    const newY = hitPose.transform.position.y;
                    console.log(newY);
                    // this.cube.position.set(0, newY, -3);
                    this.cube.scale.set(0.2, 0.2, 0.2);
                    const cameraPosition = this.camera.position.clone();
                    const direction = new Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
                    this.cube.position.set(
                        this.camera.position.x + direction.x * 2,  // 3 Meter vor der Kamera
                        newY,  // Höhe vom Hit-Test-Punkt
                        this.camera.position.z + direction.z * 2
                    );
                    this.cube.visible = true;


                    // if (newY < this.highestPosition) {
                    //     animationSequence.schablone.position.y = newY;
                    //     this.highestPosition = newY;
                }
            }
        }
    }

    private update = (timestamp: number, frame: XRFrame) => {
        this.trackHitSource(frame);
        // Rendering should happen after moving objects
        this.renderer.render(this.scene, this.camera);
    }

    public startAR() {
        this.setupAR();
    }
}

export default GameScene;